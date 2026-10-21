# rwa-preflight: plan.md (v0.2)

Companion to `SPEC.md` v0.2 (the SPEC wins on any conflict; log the conflict in `docs/DECISIONS.md`).
Effort sizes: S = one short agent session, M = one long session or two short, L = several sessions.

## Working rules

1. **Tests first.** For every task: write the failing test (or fixture), then the code, then refactor.
2. **One milestone at a time.** Do not start M(n+1) until M(n)'s exit checklist is green and `STATUS.md` is updated. Never run M0 to M7 in one go.
3. **Claims ledger.** Every statement about the chain, an address, an ABI, an API, or a doc lives in `docs/CHAIN_FACTS.md` as `VERIFIED` (source: URL, or RPC call + block + date), `ASSUMED`, or `CONTRADICTED`. No gate may depend on an `ASSUMED` fact unless it degrades to `UNKNOWN` when that fact is wrong.
4. **Never hand-type addresses or ABIs from memory.** Generate from a named source or read on-chain; store the source next to the value.
5. **Read-only forever in v0.1.** No signing, no sending, no private keys anywhere.
6. **Secrets hygiene from the first commit.** RPC URLs can embed API keys. `.env*` is git-ignored from commit 1; probe/fixture writers redact (store host only, strip path/query); a secret scanner (gitleaks or equivalent) runs in pre-commit and CI; a test proves no credential-bearing URL is ever written to disk or into a receipt.
7. **READY invariant.** The code path to `READY` requires a supported decoder result, state-verified effects, and no unresolved critical assumption (SPEC section 9). Do not relax it to finish a milestone.
8. **Small commits**, conventional messages, each leaving CI green.
9. **Stop and ask the human** when a trigger in `HANDOFF.md` section 5 fires.

## M0: Facts spike (no product code) [M]

Goal: replace assumptions with verified facts, decide go/no-go on simulation, and settle decisions D1-D6.

Tasks
- [ ] Scaffold minimal repo: pnpm workspace, TypeScript, vitest, lint, CI skeleton, `.gitignore` with `.env*`, secret-scan hook, redaction helper (+ test).
- [ ] `scripts/probe-rpc.ts` against `RHC_RPC_URL`: chain id, client version; behaviour of `latest/safe/finalized` and how they map to the documented finality stages (O6); `eth_simulateV1`, `debug_traceCall` (callTracer with logs, `prestateTracer` diff mode), `eth_call` with state overrides; `eth_getLogs` max range; historical `eth_call` depth at 1h/1d/7d (O4). Save redacted raw outputs to `docs/probes/`.
- [ ] **State-effects go/no-go (O3):** prove, on a real unsent swap-shaped transaction, that the chosen backend can report balance and allowance changes of `account`/`recipient` for `tokenIn`, `tokenOut`, and native from state (not from logs). Document the exact method. If impossible, stop (HANDOFF section 5).
- [ ] Establish F1-F13 and open facts O1-O12 from `SPEC.md` section 5; record status and source for each in `docs/CHAIN_FACTS.md`.
- [ ] Probe the issuer REST API (`/assets`, `/prices/{symbol}`, `/corporate-actions`): schema, `tradingCapabilities`, `isTradingHalt`, timestamps, cache headers, rate limits, auth. Save redacted samples. Confirm F11 yourself.
- [ ] Enumerate **all** pause/halt flags and relevant functions on a Stock Token contract (ABI/bytecode/docs; O11). Read `newUIMultiplier()`/`effectiveAt()` with nothing staged (O5).
- [ ] Sequencer uptime feed for 4663: address and live status (O2). If no usable sequencer evidence exists, stop.
- [ ] Router/pools: identify the deployed Uniswap v4 router(s), codehash, calldata layout for single-hop exact-in swaps USDG <-> Stock Token, Permit2 flow, extra chain-specific fields (O9); survey pool landscape (fee tiers, hooks, how "acceptable" pools can be identified, O12).
- [ ] `scripts/build-registry.ts`: generate `registry/stock-tokens.json` from Chainlink's Robinhood feed-address page plus on-chain probes (`decimals`, `symbol`, `uiMultiplier`, `oraclePaused`, feed `decimals`, `latestRoundData`). Record `sources[]` and `verifiedAtBlock`. Fail loudly if a source is unreachable.
- [ ] USDG: does it have a Chainlink feed (O7)?
- [ ] `docs/LANDSCAPE.md`: re-check every tool in `SPEC.md` section 3 (including KeeperHub's Robinhood plugin and the Arcus gateway): what it does now, licence, whether it decodes/simulates the caller's calldata, whether it offers replayable or tamper-evident evidence.
- [ ] `docs/DECISIONS.md`: propose D1-D6 (`SPEC.md` section 17) with evidence.

Exit checklist
- [ ] `CHAIN_FACTS.md` covers F1-F13 and O1-O12, each with status and source.
- [ ] Simulation go/no-go answered with evidence.
- [ ] Registry builds reproducibly; second run is identical (or the diff is documented).
- [ ] D1-D6 proposed with evidence; recommendation: continue / narrow scope / stop.
- [ ] No credential-bearing URL anywhere in the repo history (scanner output attached).

**Human checkpoint:** read `DECISIONS.md`, `LANDSCAPE.md`, and the go/no-go. Decide D1-D6. If a competitor already ships replayable, tamper-evident verdicts, or state effects cannot be verified, stop and rethink before M1.

## M1: Core skeleton and receipt contract [M]

Tests first
- [ ] Canonical JSON (RFC 8785) vectors; hash stability across key order; **full-length** SHA-256 ids; evidence sorted by id.
- [ ] bigint math: WAD scaling, decimals normalisation, share/token conversion (F3), rounding direction. fast-check properties.
- [ ] `EvidenceSource` contract tests for Live (mock transport), Recording, Replay; Replay rejects any read not in evidence (`EVIDENCE_INCOMPLETE`).
- [ ] **Self-containment test:** build a receipt, delete every registry/policy/calendar file and clear all env, run L2 verify: must pass using only the receipt; remove one snapshot field: must fail `INPUT_INCOMPLETE`.
- [ ] Redaction tests: credential-bearing URLs never appear in receipts, logs, fixtures, probes.

Tasks
- [ ] Types per `SPEC.md` section 7 (`Receipt` with `inputs` snapshots, `EvidenceItem` classes) with zod schemas.
- [ ] `EvidenceSource` (rpc + http kinds), `LiveSource`, `ReplaySource`; HTTP evidence stores capture time and cache headers.
- [ ] Hashing/canonicalisation; receipt assembly; reason-code table with fixed text.
- [ ] Lint/tests: no float math in valuation modules; no `Date`, `Math.random`, `fetch`, env reads inside `gates/` and `decoders/`.

Exit: all tests green; the lint rules demonstrably fail on a deliberate violation (tested).

## M2: Gates without simulation [L]

Tests first: `FixtureBuilder` and scenario tests for S01 (stubbed later parts), S02-S12, S18-S20, S23-S25.

Tasks
- [ ] G0 Context, G1 Asset (incl. all pause flags), G2 Sequencer, G3 Oracle, G4 Corporate action (time -> block mapping via recorded binary search), G5 Issuer signals, G6 Valuation, G10 Policy (parts that don't need decoding).
- [ ] `session.ts`: session calendar (24/5 sessions; holidays JSON with source URL and coverage window; outside coverage -> `UNKNOWN`), reconciled with `tradingCapabilities` per D1.
- [ ] Verdict aggregation with precedence, `validity`, `isStillValid`, and the READY-invariant guard (a test proves no path to READY without decoder + state verification once those exist; until then READY is impossible in code).
- [ ] Record at least 3 live fixtures (healthy state for 3 tokens) via `scripts/record-fixture.ts`; synthetic fixtures clearly marked.

Exit
- [ ] Scenarios above pass; coverage >= 90% on gates.
- [ ] **Independent review pass #1** (`HANDOFF.md` section 4) on gates and receipt contract: `docs/REVIEW-1.md`, blockers resolved.

## M3a: Decoder [L]

Tests first: S14, S15, S21, S22, S26 with hostile and malformed calldata, plus truncated/extra-command/odd-length inputs (fuzz).

Tasks
- [ ] Decoder for the single supported router format from D2, pinned by router codehash. Extract command(s), pool key (currencies, fee, hooks), amountIn, minAmountOut, recipient, deadline, payer/settle semantics.
- [ ] Anything not recognised exactly -> `TX_FORMAT_UNSUPPORTED` (never a best-effort guess). Unknown codehash -> `CODEHASH_UNKNOWN`.
- [ ] G7 Decode gate; G10 policy checks on decoded fields (recipient, deadline, pool, fee, hooks).
- [ ] Record real decoded examples from the live chain as fixtures (read from public transactions, never send your own).

Exit: decoder fixtures pass; fuzz run finds no crash or silent mis-decode; **independent review pass #2** focused on decoder bypasses (`docs/REVIEW-2.md`).

## M3b: State-based simulation and execution quality [L]

Tests first: S01 (full), S13, S16, S17, S27, S28, S29, and the S06/S07 pair (must be caught without `intent.assumed*`).

Tasks
- [ ] `Simulator` interface and the backend(s) chosen in M0; capability probe at startup; unusable backend -> `UNKNOWN SIM_UNAVAILABLE`.
- [ ] G8: state reads before/after in the same simulated state; assert exact bounds; claim only the checked asset set; list unverified assets in `limitations`. Logs used as diagnostics only.
- [ ] G9: oracle fair value for both legs; deviation; decoded-min-out-implied bound; fee tier; quote-asset handling per D6 (declared peg shown in `assumptions`).
- [ ] Wire the READY invariant: READY only with decoder result + state-verified effects + resolved assumptions.
- [ ] Live read-only assessment for >= 3 tokens using transactions built by a `scripts/` helper (never in the library, never sent).

Exit: all scenarios S01-S29 pass; live receipts produced.

## M4: Verify and CLI [M]

Tests first: mutation suite (flip each byte class of inputs, evidence, assessment, hashes, block hash) with expected failing level; S30, S31, S32.

Tasks
- [ ] `verify` L1, L2, L3 with per-level results, `checked n of m`, `SKIPPED(reason)`, and `unverifiable` listing for `offchain-captured` evidence.
- [ ] `docs/RECEIPT_FORMAT.md`: normative, with a worked example and the "what each level proves / does not prove" table from `SPEC.md` section 10.
- [ ] CLI (`assess`, `verify`, `asset`, `registry verify`) with RPC URLs passed by environment-variable name only.
- [ ] Golden test: library vs CLI identical canonical output.

Exit
- [ ] L2 passes on all fixtures (clean env); mutation suite green; S31 demonstrates exactly the documented limits.
- [ ] L3 works on at least one RPC that serves history.
- [ ] **Independent review pass #3** on verify and receipt format (`docs/REVIEW-3.md`).

## M5: MCP adapter, hardening, docs [M]

- [ ] MCP stdio adapter (4 tools, `readOnlyHint`, sanitised output); golden test vs CLI.
- [ ] Optional multi-RPC quorum at the pinned block; `RPC_INCONSISTENT` tests with a lying mock RPC.
- [ ] Fuzz inputs and timeouts: no crash, only `UNKNOWN`/validation errors.
- [ ] README: 60-second demo (S07), usage, **"what this does not do"**, **"what each verify level proves"**, threat-model summary, jurisdiction/eligibility note, "READY is a snapshot".
- [ ] `SECURITY.md`, `CONTRIBUTING.md`, licence; `npm audit` clean; secret scan clean; dependency count noted.

Exit: acceptance criteria 1-11 in `SPEC.md` section 14 all checked with links to evidence.

## M6: Release and validation [S-M]

- [ ] Publish v0.1.0 (npm with provenance; tag; changelog). Describe it as a preflight check with replayable, tamper-evident receipts, not as a security guarantee.
- [ ] Short write-up: the multiplier-basis failure (S06/S07) and the receipt idea, with a demo receipt.
- [ ] Outreach per `SPEC.md` section 15: offer `core` as a dependency to adjacent MCPs/SDKs (an issue or small PR showing the integration); ask 3 independent agent builders for 15 minutes of feedback; log in `docs/VALIDATION.md`.
- [ ] Set the 6-week checkpoint date in `STATUS.md`.

## M7: Only after validation (do not start without the human)

Signed receipts (in-toto Statement + DSSE, Ed25519, signer interface; verification level L4); more decoders; lending/collateral preflight; hosted API; other chains/issuers; smart accounts.

## Risk register

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Existing tools already cover the idea or add replay | High | M0 landscape re-check; differentiation = decode + state-verified + replay; kill criteria; offer `core` as a library to them |
| RPC cannot expose state effects or history | Medium | M0 go/no-go; stop-and-ask; explicit `UNKNOWN`/`SKIPPED` |
| Decoder wrong or bypassable (router version differences, hostile calldata) | Medium-High | Codehash pinning; exact-match decoding; unsupported -> `HUMAN_REVIEW`; fuzz; live-recorded fixtures; review pass #2 |
| AI-generated code with subtle EVM/valuation mistakes | Medium-High | Claims ledger; live fixtures; property + mutation tests; 3 independent review passes; conservative rounding |
| Receipt claims misread as proof of truth | Medium | Per-level results; wording rules; S31 demo of the limits |
| Credential leak via RPC URL in logs/fixtures | Medium | Redaction helper + tests; `.env` ignored; secret scan in pre-commit and CI; env-var-name-only CLI |
| Issuer API changes, outages, or caching surprises | Medium | Captured with timestamps/cache headers; freshness bound; cross-check on-chain; `UNKNOWN` when unavailable |
| Facts in docs change (multiplier semantics, feeds, heartbeats, router) | Medium | Registry generated from sources; `registry verify`; dated facts; codehash pins |
| Eligibility/legal misunderstanding | Medium | `notAssessed` in receipts; README note; no advice language |
| No adoption | High | Validation plan, early outreach, kill criteria, small scope |

## Progress log

Keep `STATUS.md` (one screen): current milestone, last green commit, open questions, decisions made (D1-D6), next 3 actions. Update at the end of every session.

## M8: Lending/collateral preflight (post-v0.1, scope expansion)
- New action kind `lend_collateral`.
- Gates: collateral factor, LTV, liquidation threshold, oracle staleness, issuer signals.
- Simulation: position changes from state.
- Receipts/verify support.
- Scenarios S33+.

## M9: Smart-account (ERC-4337) support (post-v0.1, scope expansion)
- New transaction envelope (UserOperation).
- Decoder for ERC-4337 calldata.
- Simulation of userOp execution.
- Policy checks on paymaster, bundler, etc.
- Scenarios S40+.
