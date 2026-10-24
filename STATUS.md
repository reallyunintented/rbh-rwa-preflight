# STATUS.md

Milestone: M8/M9 + A1/A2/A3a + Track C MM1-MM3 complete; v0.4.0 audit-remediation + verify hardening
Last green commit: HEAD (audit remediation a157473 + verify hardening follow-up); see git log
Open questions: sequencer uptime feed absent for 4663; A3b degraded PASS pending human decision; M6 outreach pending.
Decisions: D1-D7 accepted; scope expansion authorized.
Next 3 actions: Track D validation/outreach; A3b decision; release prep.

## 2026-10-24: Independent audit pass (docs/AUDIT-2026-10-24.md, serves as REVIEW-6)
Read-only security + quality + product review of commit 901503f..5f3b8ba. Headline: unit gates
fail closed, but (1) aggregate() had an fail-open status default, (2) READY invariant defined but
never enforced, (3) L2 verify did not re-derive the verdict, (4) G8 simulation and G7 wiring
unimplemented, (5) credential-leak path via loadOperatorPolicy error messages (F-11).

## 2026-10-24: Audit remediation (PR1-PR5 partial)
Implemented: F-01 status normalization, F-02 READY invariant injection, F-05 G7 gate + G10-from-decoded, F-06 codehash via eth_getCode, F-07 recipient null, F-09 degraded provenance gate, F-10 sha256 provenance, F-11 redacted policy loading, F-12 L3 evidence iteration, F-13 bigint lending, F-16 calendar known, L2 verdict re-derivation.
Remaining: F-04 simulator (unimplemented), F-08 README claims must drop to scaffold reality, F-14 schema validation at boundaries, Q-series hygiene.
Status entry above was temporarily overwritten; audit trail restored.

## 2026-10-24: Verify hardening follow-up (v0.4.0)
- L3 now FAILs on RPC error/null responses, never counts unverified items, reports checked/of (fixed F-12 gap found in the remediation re-check).
- mcp-server.ts and cli.ts error outputs are redacted (F-11 sink).
- Reason set +3 codes (READY_INVARIANT_VIOLATED, SEQUENCER_GAP_DETECTED, SEQUENCER_DEGRADED_ASSURANCE), minor version bump per SPEC section 7 -> 0.4.0.
- Tests added: g7 unit, verdict fail-closed normalization, L2 positive re-derivation, L2 mutation (gate flip + hash repair -> L1 PASS / L2 FAIL), L3 error rejection. 43 files / 93 tests green; lint + secret scan clean.
- All remediation work is now committed (was previously uncommitted working-tree changes).
- Open-items handoff for the next session: docs/OPEN-ITEMS.md (attack order: F-04
  simulator → router codehash pinning → G10 remainder → F-14 schema validation →
  centralize invariant → README honesty → Q hygiene).
