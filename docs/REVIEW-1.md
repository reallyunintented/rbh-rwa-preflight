# Independent review pass #1 — gates and receipt contract

Scope reviewed: `src/canonical.ts`, `src/evidence.ts`, `src/hash.ts`, `src/reasons.ts`,
`src/receipt.ts`, `src/redact.ts`, `src/schemas.ts`, `src/session.ts`, `src/types.ts`,
`src/verdict.ts`, `src/gates/*.ts`, tests. SPEC.md v0.2, docs/CHAIN_FACTS.md.

Reviewer did not write the code. Goal: find paths to READY that should not exist, receipt
weaknesses, credential leaks, and gates depending on unverified facts.

## 1. Hard architectural rules
- I/O outside EvidenceSource: none found in `src/gates` or `src/decoders` (no decoders yet). `src/session.ts` uses `new Date()` but is not under gates/decoders and is not lint-gated. Allowed, but the gate inputs that consume session results must be treated as advisory/unknown when coverage is missing. Finding: `inSession()` returns `known: true` for all inputs including out-of-calendar dates; SPEC requires `MARKET_CALENDAR_UNKNOWN` outside coverage. **Major.**
- Floats in valuation: none in gates. `src/gates/g3.ts` and `g4.ts` use number seconds; acceptable but rounding direction not applicable.
- Nondeterminism: `LiveSource.http` uses `Date.now()` for capture time (allowed, recorded). `buildReceipt` sorts evidence. Good.
- Unsanitised strings: gate reason text is from fixed table. Good. `details.pauseFlags` echoes a boolean record; okay. Risk: `details` may later carry on-chain strings; not currently.
- Unsafe rounding: not implemented yet.

## 2. Paths to READY bypassing the READY invariant
- `src/verdict.ts::aggregate` returns `READY` for any all-PASS gate set. There is no decoder result or state-verified effect check wired. Acceptable only because no `assess()` pipeline exists yet and M3a/M3b are pending; but the READY-invariant guard must be added before M3b and a test must prove no READY without decoder + state effects. **Blocker for M3b** (not for M2).
- `g10Policy` can PASS with `minAmountOutZero=false` but does not verify decoded min-out > 0 beyond a boolean; decoder not implemented. Deferred.
- Agent `intent` is not used anywhere in gates (good). No decoder yet, so no decode comparison.
- No log-based effects treated as proof (none implemented).

## 3. Gates depending on ASSUMED/UNVERIFIED facts without degrading to UNKNOWN
- `g2Sequencer`: `feedKnown=false` -> UNKNOWN, but reason code is `SEQUENCER_DOWN`. Should perhaps be a distinct code, but no code exists. Minor.
- `g3Oracle`: off-session staleness always returns `PRICE_STALE_MARKET_CLOSED` regardless of `offSessionPolicy` (`defer`/`warn`/`allow_wider`). SPEC says policy decides. **Major.**
- `g3Oracle`: staleness bound uses `heartbeatSec` number; if heartbeat unknown, no UNKNOWN path. But registry provides heartbeat. Minor.
- `g4CorporateAction`: does not detect `CA_RECENT` (multiplier changed within lookback) or `CA_STATE_INCONSISTENT` (issuer vs chain mismatch). Only pending lookahead. **Major** (scenario S04 expects DEFER CA_RECENT).
- `g5Issuer`: okay; required signals unavailable -> UNKNOWN.
- `session.inSession`: simplified UTC window; outside coverage not detected (see above). **Major** (S18).
- G0 finality below policy is not a failure and not recorded as `BLOCK_NOT_FINAL` limitation. **Minor/Major**: spec says limitation `BLOCK_NOT_FINAL` when finality below policy. Current g0 only chain mismatch. **Major** (acceptance expects limitations).
- G1 pause flags: only boolean record; okay.

## 4. Receipt weaknesses
- `receipt.ts::buildReceipt` recomputes hashes but does not validate that `assessment.limitations` is non-empty. SPEC says mandatory, never empty. Should enforce or at least test. **Minor.**
- `verifyHashes` returns boolean only; no per-level results. M4 will implement verify. Fine.
- `EvidenceItem.id` full sha256. Good.
- HTTP evidence: `request` stores host only (good for secrets), but `capture.headers` stores only content-type; SPEC wants Date/Age/Cache-Control subset. **Minor.**
- `ReplaySource.http` derives id from host + method only, collapsing distinct URLs on the same host. If two HTTP calls to the same host with different paths are made, replay cannot distinguish them. **Major** for self-containment/replay correctness. Fix: include the full (redacted) URL or a path key in the id input, while keeping secrets out. Since redaction strips path/query, this is inherently limited; but at minimum include method + host + a caller-provided key. Current design stores only host in request, so collisions are possible. **Major.**
- `LiveSource` does not redact the RPC URL before use? It stores `rpcUrl` in memory only (not serialized). Good. But error messages from fetch could include the URL? `item.error.message` from fetch may include URL. Potential credential leak in receipt if fetch fails. **Blocker-ish**: redact error messages. **Major.**
- `canonicalize` throws on `undefined` inside arrays and on non-plain objects. Could cause verify to crash instead of returning failure. **Minor.**

## 5. Credential leakage
- `scripts/probe-rpc.ts` uses `redactText(JSON.stringify(out))`. But `out` includes `host` only, not full URL. Good. However probe writes `capturedAt` with ISO time. Fine.
- `scripts/build-registry.ts` uses RPC URL from env and does not write it. Good. It writes `generatedAt` ISO. Fine.
- `LiveSource` stores `rpcUrl` (credential-bearing) in instance; not serialized, but if an error includes URL, leak. See above.
- Secret scan regex: `credPath` flags any URL path segment of length >=8. This may create false positives but currently clean. It skips test files. Reasonable.

## 6. Concrete counterexamples
- Off-session policy: with `offSessionPolicy='allow_wider'`, a stale feed during closed session still yields `PRICE_STALE_MARKET_CLOSED` DEFER; should allow wider deviation or PASS. Current g3 cannot express.
- CA recent: multiplier changed 10 minutes ago with `lookbackSec=3600`; g4 returns PASS; expected DEFER CA_RECENT.
- Calendar unknown: `inSession(9999999999)` returns known=true; expected UNKNOWN MARKET_CALENDAR_UNKNOWN.
- Replay collision: two `http()` calls to `https://api.robinhood.com/rhj/assets` and `/prices/AAPL` collapse to same id because id uses host only.

## 7. Missing scenarios
- S04 (CA_RECENT), S09 (off-session defer), S18 (calendar unknown), S07 without intent (multiplier double applied detection in G9 not implemented, deferred to M3b).

## Severity summary
Blockers: none at M2 scope except M3b readiness.
Major: G3 off-session policy; G4 CA_RECENT + CA_STATE_INCONSISTENT; session calendar coverage; HTTP evidence id collision; error-message redaction.
Minor: G0 BLOCK_NOT_FINAL limitation; G2 reason code; HTTP cache headers; limitations non-empty enforcement; canonicalize robustness.

## Recommended fixes before M2 exit
1. Make `session.inSession` accept a coverage window and return `known:false` outside it; add tests.
2. Extend `g3Oracle` to take `offSessionPolicy` and apply it.
3. Extend `g4CorporateAction` to accept previous multiplier/time and issuer multiplier; detect CA_RECENT and CA_STATE_INCONSISTENT.
4. Redact error messages in `LiveSource`.
5. Make HTTP evidence ids include method+host+path-bucket or accept a caller key (document collision limitation).
6. Add G0 finality limitation handling at assess layer (M4).
