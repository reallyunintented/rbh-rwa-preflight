# STATUS.md

Milestone: M8/M9 + A1/A2/A3a + Track C MM1-MM3 complete; v0.4.0 audit-remediation; READY-path inputs activated
Last green commit: HEAD (all work committed; see git log)
Open questions: sequencer uptime feed absent for 4663; A3b degraded PASS pending human decision; M6 outreach pending.
Decisions: D1-D7 accepted; scope expansion authorized.
Next 3 actions: OPEN-ITEMS hygiene remainder (intent cross-check, gate-set completeness, action shape validation, onlyBuiltDependencies migration, npm audit) -> F-08 README re-upgrade check -> Track D outreach.

## 2026-10-24: Hygiene commit 033b10f verified; fixes applied on top (8a93243, 12ab60d, 3b03a73)
Commit 033b10f claimed "F-04 state-diff parsing" but contained a truthy-field shortcut:
a response carrying a stateDiff-shaped field flipped `available:true` with zero effect
checks (a READY risk once codehash pinning landed). The CLI redacted error catch had
also been deleted (F-11 regression). Fixes committed:
- F-04 REAL: runSimulation performs the M0-verified sequential-reads pattern —
  pre-state reads, the swap, post-state reads. `available:true` ONLY when every read
  parses as a full 32-byte word AND the state matches the decoded constraints
  (tokenIn outflow in (0, amountIn], tokenOut inflow >= minAmountOut to the decoded
  recipient, no other in-scope balance/allowance change). An unparseable read degrades
  to UNAVAILABLE; a verified revert is G8 FAIL_HARD even when reads were unavailable.
  Fence test locks the truthy-field shortcut out permanently.
- F-11: CLI redacted top-level catch reinstated + S32 regression fence test.
- OPEN-ITEMS item 2 DONE: probe-router emits the codehash; live probe captured the
  Universal Router codehash at pinned block 0x5c36f13 (2026-10-24), wired as
  UNIVERSAL_ROUTER_CODEHASH from docs/probes/router-codehash-probe.json;
  CHAIN_FACTS O9 updated; tests/router-probe.test.ts ties src constants to probe
  files (no hand-typed drift). Decoder layout caveat (O9 chain-specific field) stays
  provisional; G9 scaffolding keeps wrong decodes failing closed.
- Suite: 48 files / 117 tests green; lint + secret scan clean.
- Engine status: decoded+simulated path is live through G7/G8, but verdicts still cap
  below READY — G1/G5/G2/G9 gate inputs remain scaffolded falsy/UNKNOWN values
  (intentional, honest; remaining scaffolds listed in docs/OPEN-ITEMS.md).

## 2026-10-24: Independent audit pass (docs/AUDIT-2026-10-24.md, serves as REVIEW-6)
Read-only security + quality + product review of commit 901503f..5f3b8ba. Headline: unit gates
fail closed, but (1) aggregate() had an fail-open status default, (2) READY invariant defined but
never enforced, (3) L2 verify did not re-derive the verdict, (4) G8 simulation and G7 wiring
unimplemented, (5) credential-leak path via loadOperatorPolicy error messages (F-11).

## 2026-10-24: Open-items remediation pass
Uncommitted working-tree changes were verified and then completed (see next entry for the
verification fixes). Net result committed:
- F-04 SIMULATOR SCAFFOLD (not full implementation): runSimulation() performs an
  eth_simulateV1 call at the PINNED block from the real account and ALWAYS returns
  UNAVAILABLE_SIMULATION ("conservative"); state-diff parsing (balance/allowance from
  simulated state) is the remaining F-04 core. G8 is therefore UNKNOWN in every
  assessment — honest fail-closed.
- F-05 remainder: G10 extended (DEADLINE_MISSING/TOO_FAR, POOL_NOT_ALLOWED,
  POOL_FEE_EXCEEDS_POLICY, NOTIONAL_EXCEEDS_POLICY) and wired from decoded calldata
  (tokenIn/tokenOut from poolKey + zeroForOne vs policy.allowTokens — fail-closed when
  no allowlist configured; pool/notional checked only when policy configures them).
- F-14: PolicySchema.safeParse at the assess boundary (INPUT_INCOMPLETE) +
  maxNotionalQuote added to the schema.
- F-02: READY invariant centralized — aggregate() now REQUIRES the invariant and never
  returns READY without it (the assess-side injection remains as a second guard).
- F-08: README honesty downgrade.
- Q: libraryVersion from package.json, deps pinned to actually-resolved versions, lockfile
  synced (frozen-lockfile CI check passes).
Not attempted: OPEN-ITEMS item 2 (router codehash pinning — supported codehash list still
empty, so G7 remains UNKNOWN by design).
Status entry above was temporarily overwritten; audit trail restored.

## 2026-10-24: Verification of the remediation pass + fixes
The uncommitted "Open-items remediation pass" was verified claim-by-claim; fixes applied on top:
- Lockfile: package.json exact pins drifted from pnpm-lock.yaml (CI would fail; viem would
  have downgraded 2.57.7 -> 2.21.0). Now pinned to actually-resolved versions and lockfile
  synced; `pnpm install --frozen-lockfile` passes.
- aggregate(): invariant made REQUIRED (was optional). All-PASS gates without the invariant
  are HUMAN_REVIEW, never READY. Tests updated (s36-s38, verdict).
- runSimulation(): simulates at the pinned block (not 'latest') with `from: account`;
  UNAVAILABLE no longer fakes prerequisiteMissing (g8 UNKNOWN, not a wrong FAIL).
- G10: poolAllowed/poolFeeBps wired from decoded poolKey; tokenIn/tokenOut derived from
  poolKey + zeroForOne and checked against allowTokens (fail-closed when absent).
- Tests first for the fixes: g10-extended (6), simulator (3), verdict invariant
  mandatory (1). Suite 45 files / 103 tests green; lint + secret scan clean.
Remaining after this: OPEN-ITEMS.md items 1 core (state-diff parsing), 2 (codehash
pinning), 7/8 hygiene.

## 2026-10-24: Verify hardening follow-up (v0.4.0)
- L3 now FAILs on RPC error/null responses, never counts unverified items, reports checked/of (fixed F-12 gap found in the remediation re-check).
- mcp-server.ts and cli.ts error outputs are redacted (F-11 sink).
- Reason set +3 codes (READY_INVARIANT_VIOLATED, SEQUENCER_GAP_DETECTED, SEQUENCER_DEGRADED_ASSURANCE), minor version bump per SPEC section 7 -> 0.4.0.
- Tests added: g7 unit, verdict fail-closed normalization, L2 positive re-derivation, L2 mutation (gate flip + hash repair -> L1 PASS / L2 FAIL), L3 error rejection. 43 files / 93 tests green; lint + secret scan clean.
- All remediation work is now committed (was previously uncommitted working-tree changes).
- Open-items handoff for the next session: docs/OPEN-ITEMS.md (attack order: F-04
  simulator → router codehash pinning → G10 remainder → F-14 schema validation →
  centralize invariant → README honesty → Q hygiene).
