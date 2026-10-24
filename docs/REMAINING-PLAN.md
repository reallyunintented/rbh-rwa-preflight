# REMAINING-PLAN (2026-10-24, amended after code verification against head 1b90f68)

Handoff plan for the still-open items after commit 1b90f68 (117 tests green).
Source of truth: docs/OPEN-ITEMS.md + docs/AUDIT-2026-10-24.md.
Amendment note: several items below were re-checked against the source at head.
Statuses marked VERIFIED reflect actual code state, not prior claims.

## Attack order (amended)

### 1. Intent cross-check DECODE_MISMATCH (S22) — was missing from the original plan
- DONE 2026-10-24 (fix-forward of a63c38a): a63c38a wired the compare inline in
  assess with a throw-on-malformed BigInt and a float Number() deadline compare.
  Now extracted to pure `src/intent.ts` (`intentDecodeMismatch`): fail-closed on
  malformed declared values (mismatch, never crash), deadline compared as bigint
  (no precision loss), case-insensitive compare, decoded.recipient null falls back
  to account exactly like the simulator, intent-deadline-present-but-undecodable is
  a mismatch. Tests: tests/intent-crosscheck.test.ts (8 cases, incl. the 2^53+1
  precision fence). G10 still FAIL_HARDs with DECODE_MISMATCH.

### 2. Gate-set completeness (F-02 remainder, MEDIUM)
- DONE 2026-10-24 (fix-forward, tests first): aggregate() takes an optional
  expectedGateIds list; a missing or typo'd gate id never counts as passing
  (HUMAN_REVIEW), severity checks (FAIL_HARD/UNKNOWN/FAIL_TRANSIENT) still dominate.
  assess passes the full G0..G10 list (belt-and-braces with the existing throw).
  Extra conditional gates (G11/G12) tolerated. Tests in tests/verdict.test.ts
  (missing G7 -> HUMAN_REVIEW, typo'd id -> HUMAN_REVIEW, extras tolerated).

### 3. Already-done behaviors: add fence tests only (do NOT reimplement)
- L3 checked/of: VERIFIED DONE at code level — verifyL3 returns checked/of and both
  the CLI verify path and MCP preflight_verify dump the full result object. Add only
  a regression fence test asserting the outputs include checked/of.
- meter-api synthetic labeling: NOT_ASSESSED default landed in 033b10f; verify no
  NORMAL labels remain and add the fence test.
- L2 positive path: covered by tests/verify-l2-positive.test.ts.

### 4. L2 provenance verification (LOW) — genuinely open
- DONE 2026-10-24 (fix-forward of a63c38a): a63c38a's provenance check sat inside
  verifyL3's evidence loop, labeled {level:2}, and never ran under the CLI default
  levels [1,2] (verify only reaches L3 when requested). Moved into verifyL2: runs at
  default levels, level-2 label preserved, fail-closed on broken inputs
  (missing/broken inputs.policy -> FAIL, not crash), matching-hash PASS preserved.
  Tests: tests/verify-provenance.test.ts (uses tests/helpers-l2provenance.ts).
- Remaining nuance (noted, open): this verifies receipt self-consistency
  (assessment.policyProvenance vs sha256(canonicalize(inputs.policy))). The
  operator-supplied policy FILE variant needs a verify-side input convention and
  stays open.

### 5. Small mechanical hygiene (batch)
- Sequencer negative-lag signal (Q-05): signal + tests DONE (a204123:
  `headLagSignal` fenced, negative detected, no silent clamp). REMAINING: wire the
  flag into G2 details the moment a real sequencer feed lands (G2 signals are
  scaffolded in assess; wiring before data would be dead code by design).
- Money-number guard test (Q-06): DONE + strengthened (a204123) — checker now runs
  over a REAL assess()-built receipt with path tracking, not hand-made inputs.
- onlyBuiltDependencies: DONE 2026-10-24 — a63c38a had deleted the esbuild allowlist
  while leaving the ignored `pnpm.onlyBuiltDependencies` field in package.json
  (backwards); fixed: field removed from package.json, `esbuild` allowlist restored
  in pnpm-workspace.yaml. Deprecation warning verified gone (`pnpm install
  --frozen-lockfile`, zero matches on "no longer read").
- Fence tests: meter no-NORMAL DONE (real, kept); L3 checked/of — verify()
  pass-through fenced (a204123), the CLI-output variant remains a nicety (LOW).
- npm audit (Q-08): DONE 2026-10-24 — 15 vulnerabilities, 1 low / 9 moderate /
  2 high / 3 critical, ALL in the dev chain (vitest > vite-node > vite,
  GHSA-9jrq-w75r-8gcw); production deps clean. Live re-run at a204123 matches the
  recorded numbers exactly (docs/DECISIONS.md, Q-08 entry). Decision: defer vitest
  upgrade, track upstream.
- CLI assess golden: improved (a204123: full gate set + receipt shape); the reason
  vocabulary check is still a nicety (LOW).

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
