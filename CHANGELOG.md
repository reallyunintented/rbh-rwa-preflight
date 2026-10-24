# Changelog

## v0.4.0 (2026-10-24)
- Audit remediation hardening (see docs/AUDIT-2026-10-24.md): fail-closed verdict
  normalization (F-01), READY invariant enforce path in assess (F-02), G7 gate + decoded
  G10 inputs (F-05), codehash via eth_getCode (F-06), decoded recipient null (F-07),
  degraded-G2 provenance binding (F-09), sha256 policy provenance (F-10),
  redacted policy loading and error sinks (F-11), L3 evidence iteration with checked/of
  counts and FAIL on RPC errors (F-12), bigint-only lending comparison (F-13),
  session-known -> MARKET_CALENDAR_UNKNOWN (F-16), L2 verdict re-derivation via
  ReplaySource (F-03).
- Reason set additions (minor bump): READY_INVARIANT_VIOLATED,
  SEQUENCER_GAP_DETECTED, SEQUENCER_DEGRADED_ASSURANCE.
- New tests: g7 unit, verdict normalization, positive + mutation L2, L3 error-response
  rejection.

## v0.3.0 (2026-10-22)
- A1: policy provenance (operator-owned policy, tighten-only overrides)
- A2: strict G2, schema v0.3, S33-S40
- A3a: observe-only sequencer signals
- A3b: degraded mode helper + integration
- M8: lending/collateral preflight scaffold + gate
- M9: smart-account envelope validation + gate
- Track C: meter snapshot builder, formulas, API, string table, scenarios
- Track D: validation outreach template

## v0.2.0 (2026-10-21)
- M0-M7 initial implementation
EOF