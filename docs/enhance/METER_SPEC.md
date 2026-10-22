# METER_SPEC: Stock Token reality check (v0.1 draft)

Status: draft. Gated: implementation starts only after PLAN-ADDENDUM Tracks A0-A2 and B are done (see "Gate").
Relation to `SPEC.md`: this is a **separate consumer module** of the existing engine. It does not change the READY invariant, the receipt format, or any gate. If this document conflicts with `SPEC.md`, `SPEC.md` wins.

## 1. Purpose

A page and JSON API that tells a person (or an agent) what a Robinhood Stock Token trade of a **chosen size** would really look like right now, in plain language, with the source, age and formula of every number visible. It is informational. It does not recommend, approve or block anything.

Working title: "meter". The product name is a human decision (D-M3); do not put "Robinhood" in a package name.

## 2. Why this and what is already out there

Reported on 2026-10-22 (secondary reports, not all independently verified; **MM0 must re-check and record results in `docs/LANDSCAPE.md`**):

- Per-token NAV, holders and volume data for Robinhood Chain stock tokens exist (RWA.xyz asset pages).
- A NAV board with per-asset premium/discount and a 0-100 risk score exists for tokenized equities (TokenizedXonChain, per a research summary; coverage of Robinhood Chain not confirmed). It documents no execution path.
- A report describes NAV-aware pricing with premium/discount at the point of trade (Theorem with RWA.xyz; sponsored report, treat as announced capability).
- Agent-side guardrails and quote tools exist (see `SPEC.md` §3: Collar Guardrail, KeeperHub, rob-mcp, rhc-mcp, zerouter, Arcus gateway).
- Premium episodes are documented: a token trading far above its underlying (HIMS case; another case with a stock-paired memecoin pool absorbing over half a token's supply and the token priced at about 4.5x the underlying close). Premiums can narrow when supply is minted.

So "per-token premium analytics" is **not a gap**. The hypothesis to test is narrower. Differentiators to validate, none verified as missing:

1. **H1** All-in, **order-size-specific** adverse cost: pool fee and price impact for the user's size, not just last price vs NAV.
2. **H2** **Provenance and age on every number**, with explicit treatment of closed underlying markets.
3. **H3** **Separate indicators** instead of one opaque risk score.
4. **H4** Exit and issuer constraints surfaced (halt, tradability, pending corporate action, eligibility "not assessed").
5. **H5** A **replayable, block-pinned snapshot** with a permalink (same evidence model as receipts).

Kill criteria: see §12.

## 3. Non-goals

No investment advice or recommendations. No verdict words ("safe", "READY", "buy", "avoid"). No signing, sending, custody, wallets or accounts. No token or coin. No tax, legal or eligibility determination (shown as "not assessed" with a pointer to the issuer's own jurisdiction list). No multi-chain. No scraping of sites that forbid it. No ads or trackers.

## 4. Hard rules

- **R1** The meter never emits READY, BLOCKED, DEFER or HUMAN_REVIEW. Those words are reserved for decoded-transaction assessments in `core`. The meter has no transaction.
- **R2** UNKNOWN is a first-class display state. It is never hidden, rounded to "normal", or omitted.
- **R3** Every displayed number carries: source, evidence class (`onchain-reverifiable` | `offchain-captured`), age, and formula id.
- **R4** All money math is `bigint`, reusing `core` valuation. No floating point in valuation or premium code (lint rule and property tests).
- **R5** Price surfaces: the on-chain Chainlink feed is already multiplier-adjusted; issuer REST `/prices` is not (SPEC F2, F3, F11). Never mix them. Any conversion is explicit and tested (scenario M06).
- **R6** On-chain and API strings are untrusted: sanitize, length-limit, never interpolate into free text. All user-facing sentences come from a fixed string table (§8).
- **R7** Secrets stay server-side. RPC URLs and keys never appear in responses, logs, fixtures, pages or commits (same redaction rules as SPEC §12).
- **R8** Reference price sources must permit redisplay. Default: the on-chain feed only. Any other source requires decision D-M1 and a recorded licence check.

## 5. Data model (normative sketch)

Integers are `bigint` in memory and decimal strings in JSON. Schema id: `rwa-meter/snapshot/v0.1`.

```ts
type DisplayState = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'UNKNOWN' | 'NOT_ASSESSED';
// Display bands are configuration with a documented rationale. They describe magnitude, not advice.

interface MeterRequest {
  asset: string;                 // ticker or address; must resolve via registry + on-chain probe (reuse G1)
  side: 'buy' | 'sell';
  sizeQuote: string;             // order size in quote-asset units (USDG), decimal string
}

interface Sourced<T> {
  value: T | null;               // null means UNKNOWN
  state: DisplayState;
  source: string;                // e.g. 'chainlink:feed:<proxy>' | 'rpc:pool-state' | 'issuer:rest:/prices'
  class: 'onchain-reverifiable' | 'offchain-captured';
  ageSec: number | null;         // relative to the pinned block timestamp or capture time, as applicable
  formulaId: string;
  note?: string;                 // fixed-table key only
}

interface MeterSnapshot {
  schema: 'rwa-meter/snapshot/v0.1';
  request: MeterRequest;
  chain: { chainId: number; blockNumber: string; blockHash: string; blockTimestamp: number };
  asset: { symbol: string; address: string; identity: Sourced<'registry-and-probe-ok'> };
  session: Sourced<'open' | 'closed' | 'unknown'>;          // reuse calendar + issuer tradingCapabilities
  reference: {
    feedPriceWad: Sourced<string>;                          // already multiplier-adjusted
    uiMultiplier: Sourced<string>;
    sharePriceWad: Sourced<string>;                         // feed * 1e18 / multiplier
    freshness: Sourced<'in-session-fresh' | 'in-session-stale' | 'off-session-held' | 'unknown'>;
  };
  venue: {
    pool: { poolKey: unknown; feeBps: number; hooks: string };   // canonical pool choice recorded with reason
    midPriceWad: Sourced<string>;
    midPremiumBps: Sourced<string>;                         // venue mid vs reference share price; side-independent
    effectivePriceWad: Sourced<string>;                     // for this side and size, after pool fee and price impact
    effectiveAdverseBps: Sourced<string>;                   // side-specific cost vs reference (see §6)
    impactCurve: { sizeQuote: string; adverseBps: Sourced<string> }[];   // 3 sizes: 0.25x, 1x, 4x of request, capped
  };
  corporateAction: Sourced<'none' | 'pending' | 'recent' | 'inconsistent'>;   // reuse G4
  issuer: { halt: Sourced<boolean>; tradable: Sourced<boolean>; multiplierAgrees: Sourced<boolean> };  // reuse G5
  oracle: { paused: Sourced<boolean> };                     // reuse G3
  sequencer: Sourced<'up' | 'unknown'>;                     // per AMENDMENT-001; under strict with no source this is UNKNOWN
  eligibility: { state: 'NOT_ASSESSED'; note: 'ELIGIBILITY_NOT_ASSESSED' };
  supply?: { recentMintBurn: Sourced<string> };             // MM3, optional
  limitations: string[];                                    // mandatory, never empty
  hashes: { inputs: string; evidence: string; snapshot: string };   // full sha256 over JCS (RFC 8785)
  evidence: unknown[];                                      // same EvidenceItem shape as core, sorted by id
}
```

The snapshot is **block-pinned and replayable** with the same `EvidenceSource` machinery as receipts. Reuse `core` types and hashing. Do not fork them.

## 6. Formulas (golden-tested)

Let `R` = reference share price (WAD), `S` = effective execution price per share for the requested side and size, both in quote units per share.

- `midPremiumBps = (M - R) * 10000 / R`, where `M` is venue mid per share. Positive = venue above reference.
- Buy: `effectiveAdverseBps = (S - R) * 10000 / R` (paying more than reference is adverse).
- Sell: `effectiveAdverseBps = (R - S) * 10000 / R` (receiving less than reference is adverse).
- `S` is derived from a read-only quote or simulation at the pinned block and includes pool fee and price impact. **Gas is shown separately** and never folded in silently.
- Rounding: always round the displayed adverse cost **up** (conservative). `R <= 0` or any missing input gives UNKNOWN, never a number.
- Off-session: `R` is the last held oracle value. Show its age. Never present it as live.
- Conversions between token and share bases use `uiMultiplier` exactly as in SPEC F3.

## 7. Engine reuse and new work

Reuse from `core` (do not reimplement): G1 asset identity, G3 oracle liveness (paused, stale, session-aware), G4 corporate action, G5 issuer signals, G6 valuation, evidence recording, hashing, registry slices, session calendar, redaction.

New work (all read-only):
- **Quote module:** for `(pool, side, sizeQuote)` return output amount at the pinned block via the deployed quoter or a read-only simulation. Which method is determined by the O9/O12 probes in M0; record the choice in DECISIONS. No state-changing RPC methods anywhere.
- **Canonical pool selection:** choose the pool(s) per token by a documented rule (registry, liquidity, fee tier, hook allowlist: default no hooks). Record the rule and the pool chosen in the snapshot. If no pool passes, the venue block is UNKNOWN with `POOL_NOT_ALLOWED`-style note.
- **Display bands and string table** (§8).
- **API and page** (§9).

## 8. Plain-language string table (fixed; no free-form generation)

Keys map to fixed sentences with typed placeholders only (numbers, ages, symbols already validated). Examples (final wording is a human review item, D-M3):

- `SESSION_CLOSED`: "US markets are closed. The reference price is the last oracle value from {age}."
- `MID_PREMIUM`: "The pool price is {bps} bps {above|below} the reference price."
- `ADVERSE_COST`: "For a {side} of {size} USDG, the pool fee and price impact cost about {bps} bps relative to the reference."
- `THIN_POOL`: "At {size4} USDG the cost rises to about {bps4} bps."
- `CA_PENDING`: "A corporate action (for example a split) is scheduled for {time}. Prices can jump."
- `ISSUER_HALT`: "The issuer reports a trading halt for this token."
- `UNKNOWN_FIELD`: "We could not determine {field}. No number is shown."
- `ELIGIBILITY_NOT_ASSESSED`: "Whether you may hold or trade this token is not assessed here. Check the issuer's jurisdiction list."
- Standing footer: "Information only, not advice. Prices can change before a transaction is included."

Forbidden words in the string table (lint test): "safe", "safety", "recommend", "should buy", "should sell", "guarantee", "risk-free".

## 9. Interfaces

- **Library:** `buildSnapshot({ chain, request, policy? }): Promise<MeterSnapshot>` and `verifySnapshot(snapshot, levels)` mirroring `core` verify semantics (L1, L2, L3, same limits on `offchain-captured` evidence).
- **HTTP (v0 API, read-only):** `GET /api/v0/token/{ticker}?side=buy|sell&size=<quote units>` returns the snapshot JSON. `GET /api/v0/snapshot/{hash}` returns a stored snapshot for permalinks. Caching: per (token, side, size bucket, block) for a short TTL; rate limiting; no accounts; no cookies.
- **Page:** one page per token. Layout: up to three headline numbers, then the signal list, then "what this does not tell you", then permalink and JSON download. Each number has a provenance popover (source, class, age, formula). Color is never the only signal. Mobile first.
- **MCP (optional, MM2+):** read-only tool `meter_snapshot` in the existing MCP adapter, same JSON.
- **Hosting and cost:** human decision D-M2 (cheapest option that keeps RPC keys server-side; set a monthly cost cap before launch).

## 10. Milestones

- **MM0** Landscape recheck and decisions: record `docs/LANDSCAPE.md` update; resolve D-M1 (reference price source and licence), pool-quote method (from O9/O12), canonical pool rule. Stop and report if the combined hypothesis is already served.
- **MM1** Quote module, snapshot builder, formulas, golden and property tests, scenarios M01-M14 on fixtures. No UI.
- **MM2** API and page, string table with lint, permalinks, redaction tests. Private preview only.
- **MM3** Optional: impact curve polish, mint/burn supply signal, MCP tool.
- **MM4** Validation with real holders (§12). Public launch only after D-M3 wording review by the owner.

## 11. Scenario suite (meter)

| ID | Scenario | Expected |
|---|---|---|
| M01 | Healthy, in session, thin impact | Numbers shown with provenance; no UNKNOWN |
| M02 | Weekend, feed holds last price | `SESSION_CLOSED` text, reference age shown, never "live" |
| M03 | Oracle paused | Reference UNKNOWN or flagged; no premium number from a paused feed |
| M04 | Feed stale in session | `in-session-stale`; premium shown with warning state or UNKNOWN per policy |
| M05 | Corporate action staged | `CA_PENDING` shown; premium states reflect uncertainty |
| M06 | Post-split multiplier case; REST price unadjusted | No double or missing multiplier in any number (mirror of S06/S07 at meter level) |
| M07 | Issuer halt | `ISSUER_HALT` shown |
| M08 | Thin pool: impact at 4x size very high | Impact curve shows it; HIGH band |
| M09 | Large premium (synthetic: venue about 4.5x reference) | `midPremiumBps` HIGH with evidence; no verdict words |
| M10 | Look-alike token | Identity UNKNOWN or failed; no numbers |
| M11 | Reference unavailable | Premium UNKNOWN; page still renders |
| M12 | Issuer multiplier disagrees with chain | `multiplierAgrees` false; numbers flagged |
| M13 | Sequencer source unknown (strict, no feed) | `sequencer: UNKNOWN` displayed; never "up" |
| M14 | Credentials in RPC URL | No URL or key in any response, log, fixture |

Also required: golden tests for §6 against hand-worked examples, property tests (monotonic impact in size, rounding direction, sign symmetry), the forbidden-words lint, a test that no code path can output a verdict word, and a replay test (snapshot verifies at L1 and L2 offline).

## 12. Validation and kill criteria

- Show a private preview to **five real stock-token holders** (not developers) and **three agent builders**. Record in `docs/VALIDATION.md`: would they check it before trading, which number mattered, what confused them.
- Proceed to public launch only if at least 3 of 5 holders say they would check it before a trade and at least 1 builder would call the JSON.
- Stop or fold into `core` as an example if an existing tool already serves the combined H1-H5 view in production, or if fewer than 3 of 5 holders would use it.
- Independent adoption is the only success measure that counts; page views are not evidence.

## 13. Decisions required from the human

- **D-M1** Reference price source beyond the on-chain feed, and its redisplay licence (default: on-chain feed only).
- **D-M2** Hosting provider and monthly cost cap.
- **D-M3** Product name, public wording review, jurisdiction wording, disclaimer text (EU context: keep the content factual and non-advisory).

## 14. Gate

Do not start MM1 until: FINDING-001 is committed; Amendment 001 steps A1-A2 are done (or explicitly waived by the owner in DECISIONS); `docs/FACTS-STATUS.md` shows O1, O5, O7, O9, O12 resolved or explicitly degraded-to-UNKNOWN by design.
