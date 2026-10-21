# rwa-preflight: SPEC (v0.2 draft)

Status: draft for implementation. v0.1 written 2026-10-21; **v0.2 revised the same day** after an external review and a fact-check against current docs (see section 18). "rwa-preflight" is a working title (avoid putting "Robinhood" in the package name).

---

## 1. Pitch

A local-first TypeScript library (plus CLI and a thin MCP adapter) that an AI agent calls with a **concrete transaction it is about to send**. It returns an `ExecutionAssessment`:

- a verdict: `READY | BLOCKED | DEFER | HUMAN_REVIEW`
- machine-readable reason codes
- a **self-contained, block-pinned receipt** that is *replayable and tamper-evident*: anyone can re-derive the verdict from the receipt alone and spot-check its on-chain evidence later.

`READY` is returned **only** for transaction formats the tool can decode and verify against the actual calldata and simulated state, never on the agent's say-so.

First chain: Robinhood Chain (chain id 4663). First asset class: Robinhood Stock Tokens (ERC-8056 "scaled UI amount" tokens with a `uiMultiplier()`).

One-line positioning: **"A pre-trade check whose verdict you can re-run."** Honest scope line: *replayable and tamper-evident, not trustless, and not a guarantee of safety.*

---

## 2. Decision record (why this, why not the others)

Four ideas were reviewed, plus two external reviews. Research on 2026-10-21 showed the space already has several MCP servers and guardrails, so a plain "oracle health MCP" is no longer a gap.

| # | Idea | Decision | Reason |
|---|------|----------|--------|
| 1 | RWA oracle health & corporate-action MCP | **Core of the pick, reshaped** | The failure modes are real and documented. But "no MCP/SDK exists" is outdated, and the "adjusted price" bullet is partly redundant: the Chainlink feed already returns a multiplier-adjusted price. The real bug class is mixing price surfaces (applying the multiplier twice, or not at all). |
| 2 | Agent credit underwriting oracle | Park | Unverified data sources (Priors logs, x402 attribution), hard trust/attestation problem, probably needs an on-chain contract, credit-scoring surface. |
| 3 | Fair execution / MEV shield | Fold in (decode + simulation + slippage gates) | Private-relay premise unconfirmed; slippage caps and simulation are table stakes elsewhere. |
| 4 | Backtesting / simulation sandbox | Fold in only the **replay primitive** | A full historical-state sandbox is large; replaying one assessment gives most of the value at a fraction of the scope. |
| ext. | "Execution Preflight" framing | Adopted | Matches 1 + 3; overlap with existing tools is real, so replayability is the differentiator. |

---

## 3. Landscape and differentiation

Found via search on 2026-10-21 (not exhaustive; **the implementing agent must re-check in M0** and record results in `docs/LANDSCAPE.md`):

- **Collar Guardrail**: hosted MCP "deterministic pre-trade risk layer" on Robinhood Chain (oracle pricing, market-hours rules, tier limits, slippage bounds, contract-safety checks, Uniswap V4 fallback when the oracle is stale/paused).
- **KeeperHub Robinhood plugin**: a "Stock Market Status" gate (halt, on-chain pause flags, stale issuer quote, Chainlink beyond heartbeat, pending corporate action) plus a USDG <-> Stock Token swap action via Uniswap v4.
- **rob-mcp**: read-only verified tokenized-stock data (MCP + x402-paid JSON API), provenance on results.
- **rhc-mcp**: positions (uiMultiplier-aware), swap quotes and execution with per-swap caps and enforced slippage.
- **zerouter MCP**: swap quotes with a fair-price guardrail vs Chainlink and a market-open flag.
- **Arcus agent gateway**: REST-based data (corporate actions, trading capabilities, multipliers) for ~194 tokenized equities.
- **hoodchain (TypeScript SDK)**, a Rialto swap-preflight MCP, other data MCPs.

What none of these (as far as found) offer, and what this project does:

1. **Replayable, tamper-evident verdicts.** Receipts are self-contained and pinned to a block. `verify` re-derives the verdict offline and can spot-check on-chain evidence against an archive RPC.
2. **Decode + simulate the actual transaction.** `READY` requires that the calldata was decoded by a supported decoder and that simulated *state* (not events) matches the constraints, so agent-supplied "intent" can never grant approval.
3. **Enforced vs advisory labelling** of every guarantee.
4. **Tri-state discipline:** missing, unsupported or uncertain data never becomes an approval.
5. **Library-first.** Other MCP servers and harnesses can embed `core`.

Not claimed any more: "venue-agnostic". Arbitrary calldata can be *simulated*, but enforcement guarantees exist only for formats with a decoder.

Honest risk: the market may not value replayability, and competitors may add it. See kill criteria (section 15).

---

## 3a. Goals and non-goals

**Goals (v0.1)**
- `assess(action, policy)` for **one action kind: `swap_exact_in`**, single hop, **USDG <-> a registry Stock Token**, via **one router format** (expected: Uniswap v4 UniversalRouter exact-input-single; to be confirmed in M0, decision D2).
- Execution model: a **direct transaction from an EOA** (`account`). Smart accounts / ERC-4337 are out of scope.
- Gates for asset identity, sequencer, oracle liveness, corporate actions, issuer signals, valuation basis, decoding, simulation (state-based), execution quality, policy.
- Self-contained receipts and `verify` at three levels (section 10).
- CLI and a read-only MCP adapter; a public adversarial scenario suite (section 13).

**Anything outside the supported envelope** (other routers, multi-hop, native ETH legs, other pairs, smart accounts, unknown router codehash) may still be simulated and described, but the verdict is capped at `HUMAN_REVIEW`.

**Non-goals (v0.1)**
- Signing or sending transactions; key custody; wallets. **The library never touches private keys.**
- Credit scoring, MEV relays, backtesting, price prediction, lending preflight, multi-chain, hosted API, any token/coin.
- Legal/eligibility determination. Stock Tokens have jurisdiction restrictions; the receipt lists `eligibility` under `guarantees.notAssessed`. Not investment advice.

---

## 4. Users and use cases

- **Agent developer**: `const r = await assess(...)` before signing.
- **MCP host**: calls `preflight_assess`; the agent decides what to do with the verdict.
- **Auditor / incident responder**: runs `verify receipt.json` to see why an agent was (or was not) allowed to trade, and exactly what that proves.
- **Other MCP servers / harnesses**: embed `@rwa-preflight/core`.

---

## 5. Domain facts

Facts below come from Chainlink's and Robinhood's docs (and some third parties, marked) as read on 2026-10-21. **All are to be re-verified in M0 and recorded in `docs/CHAIN_FACTS.md`** with a source (doc URL or RPC call + block number). This table is not proof.

| ID | Fact | Source |
|----|------|--------|
| F1 | Each stock is its own ERC-20 (one contract per ticker); tokens implement ERC-8056; `uiMultiplier()` is shares-per-token scaled by 1e18. | Robinhood docs; Chainlink page |
| F2 | The Chainlink feed returns **token price = underlying price x multiplier**, already adjusted. Do not apply the multiplier again. | Robinhood Oracles page; Chainlink page |
| F3 | Underlying share price = `feedPrice * 1e18 / uiMultiplier()`. Share-equivalent balance = `balance * uiMultiplier() / 1e18`. | Robinhood Oracles page |
| F4 | Token exposes `oraclePaused()`, `newUIMultiplier()`, `effectiveAt()`; emits `UIMultiplierUpdated(oldMultiplier, newMultiplier, effectiveAtTimestamp)`. Updates are immediate or scheduled. | Chainlink page |
| F5 | `oraclePaused()` is **advisory**: a paused oracle may still return a value; staleness (`updatedAt` vs heartbeat) is the primary guard. | Robinhood Oracles page |
| F6 | During a split the feed freezes at the last good value while paused; a timing mismatch leaves it frozen. | Chainlink page |
| F7 | Feeds are 24/5. Off-hours the feed may hold the last price and has **no heartbeats**: staleness bounds must be session-aware. | Chainlink page |
| F8 | On this L2, check the Chainlink L2 Sequencer Uptime Feed (status 0 = up) plus a grace period. | Robinhood Oracles page |
| F9 | Chainlink supplies no corporate-action calendar; Robinhood coordinates pauses and multiplier updates. | Chainlink page |
| F10 | Chain id 4663; Arbitrum Orbit/Nitro; testnet feeds are mocks. | GetBlock docs; Arbitrum blog |
| F11 | Robinhood's REST `/prices` is **not** multiplier-adjusted; apply `currentMultiplier` from `/assets` to convert. The on-chain feed already includes the multiplier. | Robinhood "Stock Token APIs" |
| F12 | Read-only REST endpoints under `https://api.robinhood.com/rhj/`: `/assets` (metadata, `currentMultiplier`, per-chain deployments, `tradingCapabilities`), `/prices/{symbol}` (bid/ask, `isTradingHalt`), `/corporate-actions`. | Robinhood "Stock Token APIs" |
| F13 | Finality has stages: soft confirmation (sequencer), posted to Ethereum (ordering fixed), Ethereum finality (~13 min after posting). | Robinhood "Transaction Finality" |

**Open facts the agent must establish in M0** (do not assume):
- O1. Feed proxy addresses, decimals, heartbeats per ticker (source of truth: Chainlink's Robinhood price-feed address page; generate a registry with sources, never hand-type).
- O2. Sequencer uptime feed address for chain 4663, and whether it exists.
- O3. Which simulation APIs the RPC supports (`eth_simulateV1`, `debug_traceCall` with `prestateTracer` diff mode, `eth_call` with state overrides) and **whether they expose state (balance/allowance/storage) differences sufficient for the checks in G8**. This is a go/no-go test.
- O4. Whether historical `eth_call` at old blocks works (archive depth); L3 depends on it.
- O5. Semantics of `newUIMultiplier()` / `effectiveAt()` when nothing is staged, and whether `uiMultiplier()` flips lazily at `effectiveAt`.
- O6. Mapping of block tags `latest/safe/finalized` to the documented finality stages **(a third-party guide maps them; probe it, do not assume)**, and the default `pinBlockTag`.
- O7. Quote-asset pricing: does USDG have a Chainlink feed? If not, the peg is a declared assumption (D6).
- O8. REST schema details, authentication/rate limits, response timestamps (`generated`-style fields), and caching. Third-party gateways report their own per-process caches (e.g. 5 min / 15 s / 1 h); **official caching behaviour is unverified**.
- O9. Deployed Uniswap v4 router: address, codehash, version, calldata layout. Two third-party sources report a chain-specific extra field (`minHopPriceX36`) in the swap struct; verify against the deployed contract before writing a decoder. Also: Permit2 flow and prerequisites.
- O10. NYSE holiday calendar source for the session module, and how it relates to `tradingCapabilities` from `/assets`.
- O11. **All pause/halt flags** on the token contract. One third party reports three independent on-chain pause flags (not just `oraclePaused()`); enumerate them from the ABI/bytecode/docs.
- O12. Pool landscape: a third party reports hundreds of pools per stock token with fee tiers up to 95% and nothing on-chain distinguishing "official" pools. Establish how to identify acceptable pools (pool key, fee tier, hooks) and what the decoder must check.

---

## 6. Architecture

```
agent / MCP host / CLI
        |
        v
  assess(action, policy)                 verify(receipt, levels)
        |                                        |
   [pin block]                                   |
        |                                        v
  EvidenceSource  <--- Live (records every call: rpc + http)
        ^         <--- Replay (serves only the receipt's evidence)
        |
  Gates + Decoder (pure functions of: evidence + receipt.inputs)
        |
  Verdict aggregation -> ExecutionAssessment -> Receipt {assessment, inputs, evidence}
```

Hard architectural rules:

1. **`EvidenceSource` is the only I/O.** It has two kinds: `rpc` (chain reads, simulation) and `http` (issuer REST). No `fetch`, `Date.now()`, `Math.random()`, or env reads inside gates or decoders. Time is the pinned block's timestamp; the capture time of HTTP data is recorded as evidence, not recomputed.
2. **Evidence classes.** Every evidence item is `onchain-reverifiable` (can be re-fetched at the pinned block) or `offchain-captured` (e.g. issuer REST: **cannot be re-verified later**, there is no history endpoint). The receipt labels which is which, and L3 never claims to verify the latter.
3. **Gates and decoders are deterministic and self-contained.** Everything non-RPC that influences a verdict (policy, registry slice, session calendar slice, decoder id/version/codehash, library version) is a snapshot stored **inside the receipt**. A hash is not a substitute for the data it commits to.
4. **All money math is `bigint`.** No floating point in valuation or deviation code (lint rule + property tests). Rounding is conservative: limits round in the safe direction.
5. **On-chain and API strings are untrusted input** (names, symbols). They never flow into reason text or tool output unsanitized.
6. **Secrets never enter artifacts.** RPC URLs may carry API keys in path/query. They never appear in receipts, logs, fixtures, probe outputs, or commits (section 12).

Suggested layout (pnpm workspaces):

```
packages/
  core/             types, gates, verdict, evidence recording/replay, hashing, bigint math
  chain-robinhood/  registry, ABIs, session calendar, issuer REST source, RPC readers/simulators
  decoders/         one decoder per supported router format (v0.1: exactly one)
  cli/              rwa-preflight CLI
  mcp/              read-only MCP adapter (stdio)
fixtures/           recorded + synthetic bundles for scenarios
scripts/            build-registry.ts, probe-rpc.ts, record-fixture.ts
docs/               CHAIN_FACTS.md, LANDSCAPE.md, DECISIONS.md, RECEIPT_FORMAT.md
```

Stack: Node >= 20, TypeScript (strict, ESM), viem, zod, vitest, fast-check, tsup, eslint + prettier, pnpm. Minimal, pinned runtime dependencies. MIT unless the owner decides otherwise.

---

## 7. Types (normative sketch)

Integers are `bigint` in memory and **decimal strings** in JSON.

```ts
type Address = `0x${string}`; type Hex = `0x${string}`;

interface ProposedAction {
  kind: 'swap_exact_in';
  chainId: number;
  account: Address;                        // EOA sending the tx directly (smart accounts unsupported)
  tx: { to: Address; data: Hex; value: string };   // the exact tx the agent intends to sign
  intent?: {                               // DIAGNOSTIC ONLY. Never used to grant READY.
    tokenIn?: Address; tokenOut?: Address; amountIn?: string;
    minAmountOut?: string; recipient?: Address; deadline?: number;
    assumedUnitPrice?: string; assumedBasis?: 'token' | 'share';
  };
}

interface Policy {
  allowTokens?: Address[];
  maxNotionalQuote?: string;               // denominated in the quote asset (USDG units), not "USD"
  maxSlippageBps: number;                  // implied by decoded minAmountOut vs oracle fair value; default 100
  maxOracleDeviationBps: number;           // simulated execution price vs oracle; default 150
  maxPoolFeeBps: number;                   // default decided in M0 (O12)
  allowedPools?: string[];                 // pool keys; default derived from registry/decision D2
  allowedHooks?: Address[];                // default: none allowed
  maxFeedAgeSecInSession?: number;         // default derived from registry heartbeat
  offSessionPolicy: 'defer' | 'warn' | 'allow_wider';   // default 'defer'
  offSessionMaxDeviationBps?: number;
  requireIssuerSignals: boolean;           // default true (halt + tradingCapabilities)
  maxIssuerSignalAgeSec: number;           // default decided in M0 (O8)
  corporateActionLookaheadSec: number;     // default 86400
  corporateActionLookbackSec: number;      // default 3600
  maxDeadlineSec: number;                  // default 300; checked on DECODED deadline
  allowedRecipients: Address[] | 'self';   // default 'self'; checked on DECODED recipient
  maxAssessmentAgeSec: number;             // default 30; see validity
  pinBlockTag: 'latest' | 'safe' | 'finalized';   // default decided in M0 (O6)
}

type Verdict = 'READY' | 'BLOCKED' | 'DEFER' | 'HUMAN_REVIEW';
type GateStatus = 'PASS' | 'FAIL_HARD' | 'FAIL_TRANSIENT' | 'UNKNOWN' | 'NOT_APPLICABLE';
type Enforcement = 'tx-enforced' | 'advisory' | 'none';

interface GateResult {
  gate: 'G0_CONTEXT' | 'G1_ASSET' | 'G2_SEQUENCER' | 'G3_ORACLE' | 'G4_CORPORATE_ACTION'
      | 'G5_ISSUER_SIGNALS' | 'G6_VALUATION' | 'G7_DECODE' | 'G8_SIMULATION'
      | 'G9_EXECUTION_QUALITY' | 'G10_POLICY';
  status: GateStatus;
  reasons: ReasonCode[];
  enforcement: Enforcement;
  details: Record<string, JsonValue>;
  evidenceRefs: string[];
  retryAfterSec?: number;
}

interface ExecutionAssessment {
  schema: 'rwa-preflight/assessment/v0.2';
  verdict: Verdict;
  reasons: ReasonCode[];
  retryAfterSec?: number;
  chain: { chainId: number; blockNumber: string; blockHash: Hex; blockTimestamp: number;
           finality: 'soft' | 'posted' | 'final' | 'unknown' };
  validity: { pinnedAtBlockTimestamp: number; maxAgeSec: number };   // READY is a snapshot, not a promise
  valuation?: { feedPriceWad: string; uiMultiplier: string; sharePriceWad: string;
                quoteAsset: string; quotePriceBasis: 'oracle' | 'declared-peg' };
  decoded?: { decoderId: string; routerCodehash: Hex; poolKey: JsonValue; amountIn: string;
              minAmountOut: string; recipient: Address; deadline: number };
  gates: GateResult[];
  guarantees: { enforced: string[]; advisory: string[]; notAssessed: string[] };
  assumptions: string[];                   // e.g. "USDG treated as 1.00 quote units (declared peg)"
  limitations: string[];                   // mandatory, never empty
  hashes: { inputs: string; evidence: string; assessment: string };   // full sha256 over JCS (RFC 8785)
}

interface EvidenceItem {
  id: string;                              // FULL sha256 of JCS({source, method|url, params})
  source: 'rpc' | 'http';
  class: 'onchain-reverifiable' | 'offchain-captured';
  atBlock?: string;                        // rpc
  request: JsonValue;                      // credentials stripped; never contains the RPC URL
  response?: JsonValue; error?: { code?: number; message: string };
  capture?: { fetchedAtUnix: number; headers?: Record<string, string> };  // http: Date/Age/Cache-Control subset
}

interface Receipt {
  assessment: ExecutionAssessment;
  inputs: {                                // canonical snapshots: everything non-RPC that affected the verdict
    action: ProposedAction; policy: Policy;
    registrySlice: JsonValue;              // only entries used (addresses, decimals, feeds, heartbeats, sources)
    calendarSlice: JsonValue;              // sessions/holidays covering the pinned time
    decoders: { id: string; version: string; routerCodehash: Hex }[];
    libraryVersion: string; schemaVersions: Record<string, string>;
  };
  evidence: EvidenceItem[];                // sorted by id (deterministic)
}
```

Reason codes (closed set, versioned; adding one is a minor version bump):

```
ASSET_UNKNOWN ASSET_NOT_CANONICAL ASSET_INTERFACE_MISMATCH PAUSE_FLAG_SET
ORACLE_PAUSED PRICE_STALE PRICE_STALE_MARKET_CLOSED PRICE_INVALID
SEQUENCER_DOWN SEQUENCER_GRACE_PERIOD
CA_PENDING CA_RECENT CA_STATE_INCONSISTENT
ISSUER_HALT ASSET_NOT_TRADABLE ISSUER_SIGNAL_UNAVAILABLE ISSUER_SIGNAL_STALE
MULTIPLIER_DOUBLE_APPLIED MULTIPLIER_NOT_APPLIED VALUATION_BASIS_MISMATCH ASSUMPTION_UNRESOLVED
TX_FORMAT_UNSUPPORTED CODEHASH_UNKNOWN DECODE_MISMATCH POOL_NOT_ALLOWED POOL_FEE_EXCEEDS_POLICY
PREREQUISITE_MISSING
SIM_UNAVAILABLE SIM_REVERT SIM_UNEXPECTED_BALANCE_CHANGE SIM_UNEXPECTED_ALLOWANCE_CHANGE
SLIPPAGE_UNBOUNDED SLIPPAGE_EXCEEDS_POLICY ORACLE_DEVIATION_EXCEEDS_POLICY
DEADLINE_MISSING DEADLINE_TOO_FAR NOTIONAL_EXCEEDS_POLICY RECIPIENT_NOT_ALLOWED TOKEN_NOT_ALLOWED
MARKET_CALENDAR_UNKNOWN EVIDENCE_INCOMPLETE INPUT_INCOMPLETE RPC_INCONSISTENT BLOCK_NOT_FINAL ASSESSMENT_STALE
```

---

## 8. Gates

Each gate is a pure function of the receipt's `inputs` and `evidence` (via `EvidenceSource`).

| Gate | Checks | Fail mapping |
|------|--------|--------------|
| **G0 Context** | `chainId` matches RPC; block pinned (number + hash + timestamp) per `pinBlockTag`; record finality stage; all later reads at that block. | Mismatch: `FAIL_HARD`. Finality below policy: limitation `BLOCK_NOT_FINAL` (not a failure in v0.1, since nothing irreversible happens). |
| **G1 Asset** | Stock Tokens must be in the registry **and** pass an on-chain probe (`decimals`, `uiMultiplier`, `oraclePaused`, plus **every pause/halt flag from O11**). Look-alikes fail. Quote asset must be the registry's USDG. | Not in registry: `FAIL_HARD ASSET_UNKNOWN`. Probe reverts: `FAIL_HARD ASSET_INTERFACE_MISMATCH`. A pause flag set: `FAIL_TRANSIENT PAUSE_FLAG_SET`. |
| **G2 Sequencer** | Uptime feed: up and grace elapsed. | Down/grace: `FAIL_TRANSIENT`. Feed unknown: `UNKNOWN`. |
| **G3 Oracle** | `latestRoundData()` via registry proxy: `answer > 0`, `updatedAt > 0`; `oraclePaused()` false; staleness is session-aware (off session staleness is expected; `offSessionPolicy` decides). | Paused: `FAIL_TRANSIENT ORACLE_PAUSED`. Invalid: `FAIL_HARD PRICE_INVALID`. Stale in session: `FAIL_TRANSIENT PRICE_STALE`. Off session + `defer`: `FAIL_TRANSIENT PRICE_STALE_MARKET_CLOSED`. Calendar uncertain: `UNKNOWN`. |
| **G4 Corporate action** | Read `uiMultiplier`, `newUIMultiplier`, `effectiveAt` at the pinned block. Scan `UIMultiplierUpdated` logs over `corporateActionLookbackSec`. **Time -> block mapping** by a recorded binary search over block timestamps (each probe is evidence); respect RPC range limits and chunk. | Staged within lookahead: `FAIL_TRANSIENT CA_PENDING` (+`retryAfterSec`). Changed within lookback: `FAIL_TRANSIENT CA_RECENT`. Inconsistent: `UNKNOWN`. Exact semantics depend on O5. |
| **G5 Issuer signals** | `/assets` `tradingCapabilities` and `currentMultiplier`, `/prices/{symbol}` `isTradingHalt`, `/corporate-actions` pending items. Captured as `offchain-captured` evidence with capture time and cache headers. Cross-check `currentMultiplier` against on-chain `uiMultiplier`. Required when `requireIssuerSignals` (default). Not part of L3. | Halt: `FAIL_TRANSIENT ISSUER_HALT`. Not tradable in session: `FAIL_TRANSIENT ASSET_NOT_TRADABLE`. Unavailable: `UNKNOWN ISSUER_SIGNAL_UNAVAILABLE`. Older than policy: `UNKNOWN ISSUER_SIGNAL_STALE`. Multiplier disagrees with chain: `UNKNOWN CA_STATE_INCONSISTENT`. |
| **G6 Valuation** | Token value and share price from F2/F3 in bigint; quote-asset price from oracle, or a **declared peg** listed in `assumptions` with `quotePriceBasis: 'declared-peg'`. Optional diagnostics: compare `intent.assumed*` to the oracle in both bases to *name* a multiplier mistake. | Unresolved critical quote price: `UNKNOWN ASSUMPTION_UNRESOLVED`. Diagnostics only add reason codes; they are not required for detection (see G9). |
| **G7 Decode** | The transaction `to` must be a router with a codehash in the supported-decoder list. The decoder extracts **from the calldata**: command(s), pool key (currencies, fee, hooks), `amountIn`, `minAmountOut`, recipient, deadline, payer/settle semantics. Compare to policy (pool, fee, hooks, recipient, deadline) and, if present, to `intent` (any mismatch is hostile or buggy). | Unknown target/codehash: `UNKNOWN CODEHASH_UNKNOWN`. Unsupported command layout: `UNKNOWN TX_FORMAT_UNSUPPORTED`. Disagrees with intent: `FAIL_HARD DECODE_MISMATCH`. Disallowed pool/fee/hook: `FAIL_HARD POOL_NOT_ALLOWED / POOL_FEE_EXCEEDS_POLICY`. Missing/zero min-out: `FAIL_HARD SLIPPAGE_UNBOUNDED`. |
| **G8 Simulation (state-based)** | Simulate `tx` from `account` at the pinned block. Establish effects from **state reads in the same simulated state** (e.g. multi-call `balanceOf`/`allowance`/native balance before and after via `eth_simulateV1`, or a `prestateTracer` diff): `account` and `recipient` balances of `tokenIn`, `tokenOut`, native; allowances of in-scope tokens. Require: `tokenIn` outflow <= decoded `amountIn`; `tokenOut` inflow >= decoded `minAmountOut`; **no other change among the in-scope assets**. Logs are diagnostic only. The claim made is exactly that, nothing broader: balances of assets outside the checked set are listed in `limitations` as not verified. Prerequisites (allowance/Permit2 state) are read from state. | Revert: `FAIL_HARD SIM_REVERT`. Prerequisite missing: `FAIL_HARD PREREQUISITE_MISSING`. Unexpected state change: `FAIL_HARD SIM_UNEXPECTED_BALANCE_CHANGE / SIM_UNEXPECTED_ALLOWANCE_CHANGE`. Backend can't expose state: `UNKNOWN SIM_UNAVAILABLE`. **Never fall back to event-log analysis while keeping the same guarantees.** |
| **G9 Execution quality** | Simulated execution price and the **decoded** min-out-implied price vs oracle fair value for both legs; deviation in bps vs policy (wider off session if configured). This is the **primary detector of multiplier-basis mistakes**: an agent that used a raw REST price, or applied the multiplier twice, encodes a min-out that is off by roughly the multiplier, so the implied bound is absurd or unreachable, without needing `intent.assumed*`. Pool fee tier checked against policy. | Over policy: `FAIL_HARD SLIPPAGE_EXCEEDS_POLICY / ORACLE_DEVIATION_EXCEEDS_POLICY`. Quote price only a declared peg: allowed, but listed in `assumptions` and the notional check is expressed in quote units. |
| **G10 Policy** | Token allowlist, notional cap in quote-asset units (rounded up), recipient and deadline from **decoded** calldata (`tx-enforced`), pool/hook allowlist. | Violations: `FAIL_HARD <code>`. |

Every gate result carries `enforcement`. Only properties verified on the decoded calldata (min-out, deadline, recipient, pool) are `tx-enforced`. Oracle state, session rules, issuer signals and anything the pinned snapshot says about the future are `advisory`; an off-chain tool cannot guarantee a quote survives until inclusion, and the assessment says so.

---

## 9. Verdict aggregation and the READY invariant

Precedence (highest wins): `BLOCKED > HUMAN_REVIEW > DEFER > READY`.

- Any `FAIL_HARD` -> `BLOCKED`.
- Else any `UNKNOWN` -> `HUMAN_REVIEW` (waiting does not resolve unknowns).
- Else any `FAIL_TRANSIENT` -> `DEFER` with `retryAfterSec` = max hint (fallback 60).
- Else all gates `PASS`/`NOT_APPLICABLE` **and the READY invariant holds** -> `READY`.

**READY invariant (normative):** the tool may return `READY` only when
1. every check required by the selected policy has sufficient verified evidence;
2. every execution constraint claimed as `tx-enforced` has been verified against the **actual decoded transaction**, and the effects claimed have been verified against **simulated state**;
3. the transaction format is explicitly supported (known router codehash, supported decoder);
4. no critical assumption is unresolved (declared assumptions are disclosed, not hidden).

Missing evidence, unsupported formats, unresolved critical assumptions, or verification failures are never interpreted as approval. A gate that errors, times out, or lacks evidence is `UNKNOWN`. `READY` means "no checked condition failed at block N under the stated assumptions", never "safe". `limitations` is mandatory and never empty. Use `validity.maxAgeSec`: an assessment older than that must be re-run before signing (`isStillValid(assessment, nowUnix)` is a pure helper; stale -> `ASSESSMENT_STALE`).

---

## 10. Evidence, receipts, replay

**Recording.** `LiveSource` wraps RPC and HTTP clients; every call becomes an `EvidenceItem` keyed by the **full** SHA-256 of its canonical request. Evidence is stored **sorted by id** so identical assessments yield identical receipts.

**Hashing.** JSON canonicalised with RFC 8785 (JCS), hashed with SHA-256:
- `hashes.inputs` = hash of `receipt.inputs` (the full snapshots, not references)
- `hashes.evidence` = hash of the sorted evidence list
- `hashes.assessment` = hash of the assessment with `hashes` removed

**Self-containment rule.** L2 uses only `receipt.inputs` and `receipt.evidence`. If something needed is absent, `verify` fails with `INPUT_INCOMPLETE` or `EVIDENCE_INCOMPLETE`. It must never substitute a current default, registry, calendar or policy.

**What each verification level establishes** (and what it does not):

| Level | Establishes | Does **not** establish |
|-------|------------|------------------------|
| **L1 Integrity** | Receipt is internally consistent (hashes recompute). | Authenticity. Anyone who edits evidence and recomputes hashes passes L1. |
| **L2 Re-derivation** | The verdict equals what this library version derives from the receipt's own inputs and evidence (offline, deterministic). | That the evidence is real. A forged-but-consistent receipt passes L2. |
| **L3 Source consistency** | `onchain-reverifiable` evidence matches what one RPC returns at the pinned block (and the block hash matches). Reports `checked n of m`. | Anything about `offchain-captured` evidence (issuer REST), which is listed as *unverifiable*; or universal truth (one provider is not proof). |
| **L4 Authorship** (M7, not in v0.1) | A key holder attested to the receipt. | Correctness of the content. |

`verify` returns a **per-level result** (`PASS | FAIL | SKIPPED(reason) | NOT_APPLICABLE`). There is no overall boolean that hides skipped levels. L3 can never report success for evidence it did not check.

**Receipts are unsigned in v0.1.** Marketing and docs say "replayable and tamper-evident", never "trustless". A later milestone adds a signer interface and an in-toto Statement/DSSE envelope; v0.1 has no dependency on any provenance project.

---

## 11. Interfaces

**Library**
```ts
import { assess, verify, isStillValid } from '@rwa-preflight/core';
import { robinhoodChain } from '@rwa-preflight/chain-robinhood';

const chain = robinhoodChain({ rpcUrls: [process.env.RHC_RPC_URL!] });   // URL never leaves the process
const receipt = await assess({ chain, action, policy });                // -> Receipt
const result  = await verify(receipt, { levels: [1, 2] });              // -> per-level results
```

**CLI**
```
rwa-preflight assess --action action.json --policy policy.json --rpc-env RHC_RPC_URL --out receipt.json
rwa-preflight verify receipt.json --levels 1,2                 # offline
rwa-preflight verify receipt.json --levels 3 --rpc-env ARCHIVE_RPC_URL
rwa-preflight asset <TICKER|0xADDRESS> --rpc-env RHC_RPC_URL
rwa-preflight registry verify --rpc-env RHC_RPC_URL
```
(RPC URLs are passed via environment variable names, never as literal CLI arguments, so they don't land in shell history or logs.)

**MCP (stdio, read-only, `readOnlyHint: true`)**: `preflight_assess`, `preflight_verify`, `preflight_describe_asset`, `preflight_default_policy`. Results: compact summary (verdict, reasons, retryAfterSec, validity, guarantees, assumptions, limitations) plus the full receipt as structured content.

CLI and MCP must return identical assessments for identical input (golden test).

---

## 12. Security and threat model

| Threat | Mitigation |
|--------|-----------|
| Hostile or prompt-injected agent supplies calldata | Never sign/send. Decode + state-based simulation. `intent` is diagnostic only. |
| Agent lies in `intent` (e.g. claims safe min-out) | Verdict derives from **decoded calldata**; intent mismatch -> `DECODE_MISMATCH`. Unsupported format -> capped at `HUMAN_REVIEW`. |
| Spoofed or missing events | Events are diagnostic. Effects verified from state reads; claims limited to the checked asset set; the rest listed as not verified. |
| Dishonest/flaky RPC | Optional multi-RPC quorum at the pinned block (M5); `RPC_INCONSISTENT`; L3 against a different provider. |
| Forged receipt (edit evidence, recompute hashes) | Documented limitation: passes L1 and L2. L3 catches on-chain evidence forgery; issuer evidence is unverifiable; authorship needs signatures (M7). Never market as trustless. |
| Issuer API outage/poisoning/caching | Captured with timestamps and cache headers; freshness bound; cross-check against on-chain multiplier; unavailable -> `UNKNOWN`. |
| Pool/fee-tier trap (many pools, extreme fees, hooks) | Decoder checks pool key against policy (O12); default allows no hooks. |
| Prompt injection via on-chain/API strings | Sanitise, length-limit, never interpolate into free text; reason text from a fixed table. |
| Registry poisoning | Registry generated by script from named sources, committed with sources + `verifiedAtBlock`; a **slice** is embedded in every receipt; `registry verify` re-checks on-chain. |
| TOCTOU (state changes before inclusion) | `validity.maxAgeSec`; `READY` documented as a snapshot; `advisory` labelling. |
| **Credential leakage** (RPC URLs with API keys in path/query) | URLs never stored in receipts/logs/fixtures/probe outputs (store host only, redacted); `.env` git-ignored; secret scan (e.g. gitleaks) in pre-commit and CI; probe/fixture writers run a redaction pass and a test asserts no URL with credentials is written. |
| Supply chain | Few deps, pinned, lockfile, `npm audit`, provenance on publish. |
| Resource abuse | Timeouts, range chunking, input size limits. |
| False sense of safety | Mandatory `limitations`, wording rules above, README "what this does not do". |

Code-quality risk (largely AI-written; no human EVM reviewer): claims ledger, fixtures recorded from the live chain, mutation tests on verification, independent review passes (plan.md).

---

## 13. Scenario suite (acceptance backbone)

Recorded from the live chain where possible; otherwise built by `FixtureBuilder` and marked `synthetic: true`.

| ID | Scenario | Expected |
|----|----------|----------|
| S01 | Healthy in-session swap, supported router, state verified | READY |
| S02 | `oraclePaused()` true | DEFER `ORACLE_PAUSED` |
| S03 | Split staged, `effectiveAt` in 2h | DEFER `CA_PENDING` |
| S04 | Multiplier changed 10 min ago | DEFER `CA_RECENT` |
| S05 | Split timing mismatch (feed frozen, new multiplier staged) | DEFER `ORACLE_PAUSED` (+ `PRICE_STALE`) |
| S06 | Post-split (multiplier 10); agent sells with a min-out computed from the raw REST price (multiplier not applied) | BLOCKED `SLIPPAGE_EXCEEDS_POLICY` (+ `MULTIPLIER_NOT_APPLIED` if `intent.assumed*` given) |
| S07 | Post-split; agent buys with a min-out computed from feed price x multiplier (applied twice) | BLOCKED `SLIPPAGE_EXCEEDS_POLICY` (+ `MULTIPLIER_DOUBLE_APPLIED` if given). Must be caught **without** `intent.assumed*`. |
| S08 | Feed stale during session | DEFER `PRICE_STALE` |
| S09 | Weekend, feed holds last price, `offSessionPolicy=defer` | DEFER `PRICE_STALE_MARKET_CLOSED` |
| S10 | Sequencer down | DEFER `SEQUENCER_DOWN` |
| S11 | Sequencer up, inside grace period | DEFER `SEQUENCER_GRACE_PERIOD` |
| S12 | Look-alike token (same symbol, not in registry) | BLOCKED `ASSET_UNKNOWN` |
| S13 | Simulation reverts | BLOCKED `SIM_REVERT` |
| S14 | Calldata batches an extra command (approval/transfer) beyond the supported layout | HUMAN_REVIEW `TX_FORMAT_UNSUPPORTED` (or BLOCKED `DECODE_MISMATCH` if it contradicts intent) |
| S15 | Decoded min-out is zero | BLOCKED `SLIPPAGE_UNBOUNDED` |
| S16 | Execution price 5% off oracle | BLOCKED `ORACLE_DEVIATION_EXCEEDS_POLICY` |
| S17 | RPC cannot expose state effects | HUMAN_REVIEW `SIM_UNAVAILABLE` |
| S18 | Date outside session-calendar coverage | HUMAN_REVIEW `MARKET_CALENDAR_UNKNOWN` |
| S19 | Notional above cap (quote units) | BLOCKED `NOTIONAL_EXCEEDS_POLICY` |
| S20 | `uiMultiplier()` reverts | BLOCKED `ASSET_INTERFACE_MISMATCH` |
| S21 | Unknown router address/codehash | HUMAN_REVIEW `CODEHASH_UNKNOWN` |
| S22 | Intent says min-out X; calldata encodes something else | BLOCKED `DECODE_MISMATCH` |
| S23 | Issuer reports trading halt | DEFER `ISSUER_HALT` |
| S24 | Issuer API unavailable (policy requires it) | HUMAN_REVIEW `ISSUER_SIGNAL_UNAVAILABLE` |
| S25 | `tradingCapabilities` says not tradable in this session | DEFER `ASSET_NOT_TRADABLE` |
| S26 | Pool fee tier above policy cap | BLOCKED `POOL_FEE_EXCEEDS_POLICY` |
| S27 | State diff shows extra `tokenIn` outflow with no matching `Transfer` log (synthetic) | BLOCKED `SIM_UNEXPECTED_BALANCE_CHANGE` |
| S28 | Allowance/Permit2 prerequisite missing | BLOCKED `PREREQUISITE_MISSING` |
| S29 | USDG has no oracle; peg declared | READY **only if** peg is listed in `assumptions` and policy allows declared pegs; otherwise HUMAN_REVIEW `ASSUMPTION_UNRESOLVED` |
| S30 | Receipt missing its policy/registry snapshot | verify fails `INPUT_INCOMPLETE` (L2) |
| S31 | Forged receipt: evidence edited, hashes recomputed | L1 PASS, L2 PASS, **L3 FAIL** on on-chain evidence; issuer evidence reported unverifiable (documents the limits) |
| S32 | Tool run with a credential-bearing RPC URL | No URL or key appears in receipt, logs, fixtures, or probe output |

Also required: property tests for bigint valuation (round-trip, monotonicity, rounding direction), mutation tests for verification, and a test that **no code path can emit READY without a decoder result and state-verified effects**.

---

## 14. Acceptance criteria for v0.1

1. `assess()` runs end-to-end read-only against live mainnet for at least 3 stock tokens and records a receipt.
2. All scenarios in section 13 return the expected verdicts/reasons/verify outcomes.
3. **Self-contained replay:** L2 verify passes on every fixture receipt in a clean environment containing no registry, policy or calendar files; any single-byte tamper is detected at the documented level (mutation suite).
4. L3 works against an RPC that serves the needed history and reports `SKIPPED(reason)` otherwise; it never reports success for unchecked or offchain-captured evidence.
5. Gates and decoders perform no I/O except via `EvidenceSource`; no floating-point in valuation modules (enforced by tests/lint).
6. The READY invariant (section 9) is enforced by code and tests: no READY without supported decoder + state-verified effects + resolved critical assumptions.
7. CLI and MCP produce identical assessments for identical input.
8. `docs/CHAIN_FACTS.md` has no `ASSUMED` fact that a gate depends on unless that gate degrades to `UNKNOWN` when the fact is wrong.
9. README has a 60-second demo (S07) and an explicit "what this does not do / what each verify level proves" section.
10. CI green; line coverage >= 90% on `core` gates and decoders; `npm audit` no high/critical; secret scan passes.
11. The library never reads, stores, or requests a private key; no credential-bearing URL is written anywhere.

---

## 15. Validation and kill criteria

- **Signal checks (after M4):** show the S07 demo and a receipt to maintainers of at least 3 adjacent projects (section 3) and 3 independent agent builders. Record in `docs/VALIDATION.md`.
- **Proceed to hosted API / signing / more chains only if** at least one external project integrates `core` (or asks for a specific feature) within 6 weeks of v0.1.0.
- **Pivot or stop if** nobody integrates, or an existing tool ships replayable evidence first. Keep the repo as a finished reference implementation and stop investing.
- The adoption test is independent developers integrating the library, nothing else.

---

## 16. Out-of-scope follow-ups (only after validation)

Additional router decoders; signed receipts (in-toto/DSSE, authorship level L4); lending/collateral preflight; portfolio risk supervisor; hosted API; additional chains/issuers; smart-account (ERC-4337) support; Robinhood Agent-Apps listing (official docs describe agent apps as usable only by Robinhood-hosted agents in the mobile app; relevance to on-chain use must be checked first).

---

## 17. Decisions required before M1 (human + M0 evidence)

| ID | Decision | Recommended default |
|----|----------|---------------------|
| D1 | Are issuer REST signals (halt, tradingCapabilities, corporate actions) in v0.1? | Yes, as `offchain-captured`, required by default, excluded from L3 |
| D2 | Supported pair and router format | USDG <-> registry Stock Token, one single-hop exact-in router format, pinned by codehash, confirmed in M0 (O9, O12) |
| D3 | Transaction envelope | Single EOA transaction with prerequisites already satisfied; missing prerequisite -> `PREREQUISITE_MISSING`. Multi-tx sequences and smart accounts deferred |
| D4 | Simulation backend and whether it exposes state effects (O3) | Backend chosen from M0 probes; if none exposes state effects, stop and present options |
| D5 | Default `pinBlockTag`, finality stance, `maxAssessmentAgeSec` (O6) | Decide from probes; document soft-confirmation risk |
| D6 | Quote-asset valuation (O7) | Limits in quote units; peg only as a declared assumption; READY with a peg only if the policy explicitly allows |

---

## 18. Revision log

**v0.2 (2026-10-21)**: after an external (ChatGPT) review and a fact-check against Robinhood/Chainlink docs.
- Receipt made self-contained (added `inputs`; hashes now commit to full snapshots). **Accepted: real flaw in v0.1.**
- `READY` now requires a supported decoder and verification against the decoded calldata; agent `intent` is diagnostic only; `requireEnforcedSlippage` removed (always required); "venue-agnostic" claim dropped. **Accepted.** Cost: one decoder moved from "post-v0.1" into v0.1.
- Event-log deltas demoted to diagnostics; effects verified from state reads; claims limited to checked assets. **Accepted, with a refinement:** logs from the canonical registry tokens are emitted by trusted contract code, but they still cannot prove the *absence* of other effects, so the narrow-claim rule applies.
- Supported pair matrix and quote-asset valuation specified; limits expressed in quote units; peg only as declared assumption; multiplier-mistake detection moved to decoded min-out vs oracle (G9), with `intent.assumed*` as diagnostics. **Accepted.**
- Verification claims restated as "replayable and tamper-evident" with a per-level table. **Accepted.**
- Added: issuer REST signals (G5; REST price semantics confirmed in official docs), finality stages and freshness (`validity`), EOA-only envelope, time->block mapping, full-length evidence ids and deterministic ordering, router codehash pinning, credential redaction rules, extra M0 stop conditions, READY invariant statement. **Accepted.**
- Added beyond the review: `offchain-captured` vs `onchain-reverifiable` evidence classes (issuer REST has no history, so L3 cannot re-check it); pool/fee-tier/hook risk and extra on-chain pause flags (third-party reports, to verify in M0); Permit2/prerequisite handling; KeeperHub and Arcus added to the landscape.
- Not adopted as stated: the review's claim that official docs describe REST caching could not be confirmed (only third-party gateways documented their own caches); treated as open fact O8.
