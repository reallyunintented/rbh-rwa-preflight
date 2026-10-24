# OPEN-ITEMS plan / audit trail (2026-10-24)

Handoff for the next implementing session. Findings source of truth:
`docs/AUDIT-2026-10-24.md` (independent security/quality/product audit, serves as REVIEW-6).
This file lists what is DONE (committed), what is OPEN, and the order to tackle it.

## Where things stand (thread)

- HEAD chain: 5f3b8ba → a157473 (audit remediation PR1-PR5 partial, tests 83→93) →
  2cebc4f (verify hardening, v0.4.0) → 037d1ca (STATUS update).
- v0.4.0 now includes: fail-closed verdict aggregation (unknown statuses / empty gate
  set → HUMAN_REVIEW), READY-invariant injection in assess, G7_DECODE gate fed by
  real `eth_getCode` codehash (supported list empty ⇒ always CODEHASH_UNKNOWN ⇒
  fail-closed), decoded recipient null ⇒ G10 BLOCKED, L2 verdict re-derivation
  (verified correct by positive + hash-repaired-mutation tests), L3 evidence
  iteration with checked/of counts and FAIL on RPC error/null responses, redacted
  error sinks in MCP/CLI, sha256 policy provenance, bigint-only lending comparison,
  sessionKnown → MARKET_CALENDAR_UNKNOWN.
- 43 test files / 93 tests green; lint clean; secret scan clean.
- Reason set added: READY_INVARIANT_VIOLATED, SEQUENCER_GAP_DETECTED,
  SEQUENCER_DEGRADED_ASSURANCE (with the minor version bump SPEC section 7 requires).

## Hard rules reminder (AGENTS.md — non-negotiable)

- Tests first (failing), then code. Small commits; secret scan before EVERY commit
  (`pnpm secret-scan`). Read-only: never sign/send; no private keys; no
  credential-bearing URLs in any file/log/fixture (hosts only).
- Never relax the READY invariant to finish a task; missing check → UNKNOWN, not PASS.
- All money math is bigint. Update STATUS.md at the end of the session.

## Open items, in attack order

### 1. F-04 — implement the G8 simulator (HIGH; blocks the README honesty fix)
- Status: SCAFFOLD IN PLACE (as of 2026-10-24). `runSimulation()` sends
  `eth_simulateV1` at the pinned block from the real account, and conservatively
  always returns `UNAVAILABLE_SIMULATION` -> G8 UNKNOWN -> no READY. Fail-closed by
  construction: state-diff parsing (balance/allowance read from simulated state)
  is the remaining core work and is guarded by the S27/S28 fixtures below.
- Do:
  - Implement the simulator per the M0-verified pattern: simulate the tx from
    `account` at the pinned block, then read state in the simulated state
    (balanceOf / allowance of tokenIn, tokenOut, native, for account + recipient).
  - Wire its result into `g8Simulation` inputs inside `assess()`; replace the
    hardcoded literal at `assess.ts:57`.
  - Claim exactly the checked-asset set; list everything else in `limitations`.
  - Tests FIRST: S27 (unexpected tokenIn outflow), S28 (missing prerequisite) as
    synthetic fixtures; property: a missing state diff ⇒ `available:false` ⇒ G8
    UNKNOWN, never PASS.
- Accept: verdict-level S27/S28 tests pass; no code path fabricates g8 booleans
  outside a real simulation result.

### 2. Router codehash pinning (HIGH; unblocks G7 to ever PASS)
- Today `supportedCodehashes` is empty in `assess.ts:35`, so every decode is
  `CODEHASH_UNKNOWN` → verdicts HUMAN_REVIEW/UNKNOWN forever (intentional, safe).
- Do (tests-first, M0-style):
  - `scripts/probe-router.ts` (or extend probe-rpc): `eth_getCode` the Universal
    Router at `0x8876789976dEcBfCbBbe364623C63652db8C0904` at a pinned block,
    keccak the code, save a redacted probe JSON (host only) in `docs/probes/`,
    record in `docs/CHAIN_FACTS.md` as VERIFIED with block + date.
  - Wire the verified constant into the decoder's supported list. Template:
    `src/decoders/swap-router02.ts:5-6` (its constant is already verified by
    `docs/probes/swap-router02-codehash.json`).
  - Decide (human) whether SwapRouter02 becomes a second supported decoder — it is
    currently unused dead code.
- Accept: an honest supported-format decode can reach G7 PASS (still needs F-04
  for READY).

### 3. F-05 remainder — finish G10 + decode-policy checks (MEDIUM)
- Updated 2026-10-24: DONE for the gate itself. `g10Policy` now checks
  DEADLINE_MISSING/DEADLINE_TOO_FAR, POOL_NOT_ALLOWED, POOL_FEE_EXCEEDS_POLICY,
  NOTIONAL_EXCEEDS_POLICY, and assess() derives tokenIn/tokenOut from the decoded
  poolKey + zeroForOne vs policy.allowTokens (fail-closed when no allowlist), pool
  and notional checks when the policy configures them. Tests: tests/g10-extended.test.ts.
- Still open: intent cross-check (`DECODE_MISMATCH`, S22) and POOL default derivation
  from registry.

### 4. F-14 — schema-validate inputs at the boundaries (MEDIUM)
- Updated 2026-10-24: policy is validated via `PolicySchema.safeParse` at assess
  (throws INPUT_INCOMPLETE); `maxNotionalQuote` added to the schema. MCP inherits
  the validation through assess.
- Still open: validate `action` (kind/chainId/account/tx shape) and reject unknown
  policy keys (zod strips unknown keys by default today).

### 5. F-02 remainder — centralize the READY invariant in aggregate (MEDIUM)
- DONE (2026-10-24): `aggregate(gates, inv)` REQUIRES the invariant; without it
  (decoder not ok / G8 not PASS / unresolved assumptions) the verdict is
  HUMAN_REVIEW even with all-PASS gates. The assess-side UNKNOWN-gate injection
  remains as a second guard. Tests: tests/verdict.test.ts.
- Still open: gate-set completeness — an absent expected G0..G10 gate must not
  count as passing (assess should assert the full gate set explicitly).

### 6. F-08 — README honesty (MEDIUM; do after items 1-2 land, start now)
- README claims "state-verified effects" and reachable READY; true only after
  items 1 + 2. Until then, mirror DRIFT-LIST: implemented = gates as pure
  functions, receipts, L1/L2/L3; unimplemented = registry probing, simulation,
  token allowlist. Keep the `limitations: ['minimal assess implementation']` line
  until the simulator lands.

### 7. Q-series hygiene (LOW; batch at leisure)
- DONE 2026-10-24: dependencies pinned to actually-resolved versions (viem 2.57.7,
  zod 4.6.7, tsx 4.23.15, typescript 5.9.3, vitest 2.1.9, @types/node 22.20.5,
  eslint 10.13.0) and pnpm-lock.yaml synced (`pnpm install --frozen-lockfile`
  passes). `libraryVersion` now read from package.json.
- Note: pnpm 12 warns that the `pnpm.onlyBuiltDependencies` field in package.json
  is no longer read; migrate to pnpm-workspace.yaml during hygiene.
- `assess.ts` `libraryVersion` already read from package.json (done); meter.ts edits
  still open below.
- meter.ts: `Sourced` labels hardcoded NORMAL/ageSec 0 → default NOT_ASSESSED
  until real sources exist (Q-04); meter-api.ts serves synthetic data under
  chain 4663 — mark it demo/synthetic loudly.
- `sequencer-signals.headLagSec`: clamp/flag negative lag (Q-05).
- Guard test: no money `number` in receipt fields; bigint/decimal strings only (Q-06).
- Run `npm audit` when network access permits; not yet done (Q-08).
- CLI: `assess` command missing (only `verify`); SPEC section 11 parity + deeper
  golden test.

### 8. Small L2/L3 refinements (LOW)
- L2 rebuild ignores `assessment.policyProvenance`: verify the provenance hash
  against `loadOperatorPolicy` when a policy file is supplied, else keep SKIPPED
  documented.
- Surface `checked`/`of` from L3 in MCP/CLI output.

## Human decisions (do not improvise)
- A3b degraded-G2 PASS semantics (authorized 2026-10-22; needs probe data for
  thresholds before it may contribute to READY — DECISIONS.md).
- SwapRouter02 second decoder yes/no (needs O9 probe first).
- M6/Track D outreach; release timing (kill criteria SPEC section 15).
- NYSE holiday calendar source (O10 ASSUMED) — blocks exact session windows.

## Done (for the record — do not redo)
- L3 error/null → FAIL with counts; redacted sinks; reason codes registered;
  v0.4.0; new tests (g7 unit, verdict normalization, L2 positive + mutation,
  L3 rejection); audit trail restored in STATUS.md; uncommitted remediation
  committed; audit report `docs/AUDIT-2026-10-24.md` exists.
- Verified correct, no further work needed: unit gate fail-closed behavior on
  honest inputs; L2 re-derivation mechanics; secret hygiene in fixtures/probes.
