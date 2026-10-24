# REMAINING-PLAN (2026-10-24, amended after code verification against head 1b90f68)

Handoff plan for the still-open items after commit 1b90f68 (117 tests green).
Source of truth: docs/OPEN-ITEMS.md + docs/AUDIT-2026-10-24.md.
Amendment note: several items below were re-checked against the source at head.
Statuses marked VERIFIED reflect actual code state, not prior claims.

## Attack order (amended)

### 1. Intent cross-check DECODE_MISMATCH (S22) — was missing from the original plan
- `DECODE_MISMATCH` exists only in the reasons.ts vocabulary; nothing computes it.
- assess trusts decoded calldata; when the operator's declared intent differs from
  the decoded constraints (if intent is provided), the receipt must say so.
- Tests first: intent==decoded fine; intent token/amount divergence => reason
  DECODE_MISMATCH => HUMAN_REVIEW/BLOCKED per policy; absent intent => no check.

### 2. Gate-set completeness (F-02 remainder, MEDIUM)
- Genuinely open: assess pushes G0..G10 (+ conditional G11/G12) but asserts nothing;
  aggregate guards the invariant, not set membership.
- In assess(), assert the full expected gate set G0..G10 is present before aggregation.
- aggregate() should reject a missing expected gate (treat as not passing).
- Tests first: a receipt missing G7 must never be READY; assess always emits G0..G10.

### 3. Already-done behaviors: add fence tests only (do NOT reimplement)
- L3 checked/of: VERIFIED DONE at code level — verifyL3 returns checked/of and both
  the CLI verify path and MCP preflight_verify dump the full result object. Add only
  a regression fence test asserting the outputs include checked/of.
- meter-api synthetic labeling: NOT_ASSESSED default landed in 033b10f; verify no
  NORMAL labels remain and add the fence test.
- L2 positive path: covered by tests/verify-l2-positive.test.ts.

### 4. L2 provenance verification (LOW) — genuinely open
- When a policy file is supplied at verify time, verify
  policyProvenance.operatorPolicyHash against loadOperatorPolicy; else SKIPPED with
  a documented reason.
- Tests: matching hash PASS; mismatched FAIL.

### 5. Small mechanical hygiene (batch)
- Sequencer negative-lag signal (Q-05): record negative lag as a signal
  (negativeLagSec) and flag in G2 details; fence test. Latent today (G2 signals are
  scaffolded in assess) but cheap to land properly.
- Money-number guard test (Q-06): no money `number` in receipt fields; bigint or
  decimal strings only.
- onlyBuiltDependencies: migrate pnpm.onlyBuiltDependencies to pnpm-workspace.yaml
  (pnpm 12 no longer reads the package.json field).
- npm audit (Q-08): run when network permits; record results.
- CLI assess parity: deeper golden test, SPEC section 11.

### 6. UR decoder live-fixture validation (O9 caveat) — HIGH-VALUE, was missing
- The decoded swap-struct layout (chain-specific extra field per O9, decoded min-out
  semantics) stays provisional until diffed against REAL swap calldata.
- Do: scan recent blocks via the RPC for UR swap transactions, pull calldata, store a
  redacted fixture (host only), and assert the decoder against it. G9 scaffolding
  keeps wrong decodes from reaching READY meanwhile.
- If no sample can be captured, record that in CHAIN_FACTS and defer.

### 7. Human decisions (do not improvise)
- A3b degraded-G2 PASS semantics (needs probe data; DECISIONS.md).
- SwapRouter02 second decoder promote-or-delete (O9 probe done; layout validation
  in item 6 informs this).
- M6/Track D outreach; release timing (SPEC section 15 kill criteria).
- NYSE holiday calendar source (O10).
- The READY-unblocking ladder beyond hygiene: real inputs for G1/G5 (registry +
  issuer probes), G2 (sequencer feed), G9 (mid-price implied min-out). F-08 README
  re-upgrade only after these feed real data.

## Validation
- pnpm test, pnpm lint, pnpm build, pnpm secret-scan green per commit.
- STATUS.md updated each session.
