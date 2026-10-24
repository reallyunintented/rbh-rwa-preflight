# VERIFICATION-HANDOFF — how to verify claims in this repo

Purpose: this repo has a recorded history of commits whose claims exceeded their
delivery. Every "DONE" claim — from any author, including this handbook — must be
re-proven by EXECUTION before being trusted. This document is the verifier's
standing process, the falsification record, and the current claim ledger.
Companion docs: `docs/REMAINING-PLAN.md` (work ledger), `docs/HANDOFF_SESSION.md`
(repo state), `docs/OPEN-ITEMS.md` (done/open detail), `docs/AUDIT-2026-10-24.md`
(findings F-01..F-16), `STATUS.md` (session trail).

## 1. The method (recipe, in order)

For every commit that claims implementation work:

1. **Extract the claims** from the commit message and docs touched:
   `git show <sha> --stat` then `git show <sha>` per file. List each claim
   separately (a message with five claims is five verdicts).
2. **Diff the claim against the delivery**: does each claim have real code, or
   only a stub/rename/side-effect? A claim of "wiring" needs a call site; a claim
   of "recording" needs an artifact in the repo (docs/probes, DECISIONS, CHAIN_FACTS).
3. **Run it, don't read it**:
   - `pnpm vitest run <relevant test files>` — targeted first, then all.
   - Full gates at the head you are verifying: `pnpm test && pnpm lint && pnpm build && pnpm secret-scan`.
4. **Prove the tests actually test the claim** (the vacuous-test trap):
   - Does the test exercise the REAL path (a receipt from `assess()`, a real
     response shape), or does it construct its own clean inputs whose properties
     encode the conclusion? Example exposure: the money-number guard that built a
     deliberately number-free receipt — nothing to catch.
   - Kill-test where cheap: temporarily revert the production change and confirm
     the tests go red. Recompile-level confidence only counts if the test fails
     without the fix.
5. **Hunt dead code**: `grep -r <newSymbol> src/ tests/` — an exported function no
   other file references is not "implemented", it is committed prose. Example
   exposure: `headLagSignal()` added with zero references and zero tests.
6. **Hunt dead-at-runtime code**: trace WHERE the new logic is reachable. A check
   inside `verifyL3` never runs at CLI default levels `[1,2]` — the a63c38a
   provenance exposure. Ask: under default parameters, does this path execute?
7. **Check mislabeled results**: objects returned from one level's function
   carrying another level's label (`{level:2...}` from `verifyL3`) — shape bugs
   that still "work".
8. **Check semantic drift against the plan**: a check that verifies receipt
   self-consistency is NOT "verify against the supplied policy file". Match the
   implementation to the letter of the plan item, not the theme.
9. **Check docs hygiene**: claims like "recorded" need a repo artifact; CLAIM
   code changes without doc updates (OPEN-ITEMS/REMAINING-PLAN/CHAIN_FACTS
   applicable line) are incomplete per the definition of done.
10. **Secret scan mentally too**: URLs in diffs, probe outputs, fixtures — hosts
    only, never full credential-bearing URLs (AGENTS.md hard rule).
11. **Write the verdict into the ledger** (a table like section 3), commit the
    finding, even when the verdict is "clean". Silence is how fake work survives.

## 2. Falsification record (why step 4-6 exist)

| Commit | Claimed | Actually delivered (proven by runs) |
|---|---|---|
| `033b10f` | "F-04 state-diff parsing" | Truthy-field shortcut: response carrying a stateDiff-SHAPED field flipped `available:true` with zero effect checks — a READY risk. Also deleted the CLI redacted catch (F-11 regression). Superseded by `3b03a73` + permanent fence test. |
| `a63c38a` | "Implement remaining plan: DECODE_MISMATCH, gate-set completeness, L2 provenance, pnpm workspace, hygiene" | 2 trivial tests. Provenance check DEAD at default verify levels (sat in verifyL3), mislabeled `{level:2}`; intent cross-check CRASHED on malformed input (`BigInt`) and compared deadlines via `Number()` (float); gate completeness only as a throw, not in `aggregate`; pnpm migration BACKWARDS (deleted the esbuild allowlist, left the ignored package.json field). Fixed tests-first in `97705e6..dc87c2b`. |
| `cf8a3dc` | "Fence tests + negative-lag signal + money-number guard + assess golden + pnpm audit recorded" | One test per fence (L3 fence shallow — no CLI/MCP pass-through; meter fence real); money guard VACUOUS (built its own number-free inputs); `headLagSignal()` DEAD (no references, no tests, not wired into G2); assess golden 2 assertions; npm audit NOT recorded anywhere. |

Patterns to watch for (all three commits shared some): breadth-language in the
message ("implement remaining plan", "hygiene"), small file/test stats, tests that
never exercise the changed production path, exports with no callers, "recorded"
without artifacts, docs untouched despite project claims.

## 3. Claim ledger (verify these, newest first)

Every line: claim -> current status -> how to re-prove. Suggested first action for
any new session: re-run the proof column quickly (10 min), then work the queue.

### Attempt 1 — engine truth core (my earlier claims)
| Claim | Status | Re-prove |
|---|---|---|
| F-04 real sequential-reads state verification; unparseable read -> UNAVAILABLE; revert-first FAIL_HARD | Proven `3b03a73` | `pnpm vitest run tests/simulator-effects.test.ts tests/simulator.test.ts` (10 adversarial cases incl. truthy-field fence; kill-test: re-add a stateDiff shortcut -> fence goes red) |
| CLI credential redaction (F-11) restored + S32 fence | Proven | `pnpm vitest run tests/cli-redact.test.ts`; `grep -n redactText src/cli.ts` |
| Router codehash pinned from live probe (no hand-typed drift) | Proven, live-checkable | `pnpm vitest run tests/router-probe.test.ts`; re-run `pnpm tsx scripts/probe-router.ts` (live eth_getCode) and confirm identical codehash at latest block vs `docs/probes/router-codehash-probe.json` |
| Neatness of gate G8 vs decoded constraints | Proven | `tests/simulator-effects.test.ts` (outflow/inflow/allowance/unexpected cases) |

### Attempt 2 — fix-forward of a63c38a
| Claim | Status | Re-prove |
|---|---|---|
| pnpm migration completed; deprecation warning gone | Proven `97705e6` | `pnpm install --frozen-lockfile 2>&1 \| grep -c "no longer read"` -> 0; `cat pnpm-workspace.yaml` (esbuild allowlisted); package.json has no `pnpm` key |
| S22 intent cross-check pure + fail-closed + bigint deadline | Proven `6caef77` | `pnpm vitest run tests/intent-crosscheck.test.ts` (8 cases incl. 2^53+1 precision fence); `grep -n intentDecodeMismatch src/assess.ts` |
| aggregate() expectedGateIds completeness | Proven `c771a14` | `pnpm vitest run tests/verdict.test.ts` (missing G7 -> HUMAN_REVIEW; typo'd id; FAIL_HARD dominance) |
| L2 provenance runs at default levels | Proven `dc87c2b` | `pnpm vitest run tests/verify-provenance.test.ts` (mismatch FAIL under default `[1,2]`; matching PASS; broken inputs FAIL) |
| 51 files / 136 tests green | Proven at `e001f93` | run `pnpm test` |

### Attempt 3 — cf8a3dc (external), debts CLOSED by a204123 (verified 2026-10-24)
| Claim | Was | Now |
|---|---|---|
| Meter no-NORMAL fence | Real, kept | UNCHANGED, passes at head |
| L3 checked/of fence | Shallow (only FAIL shape) | Strengthened: `verify()` pass-through at level 3 fenced. Residual nicety: CLI-process-output variant (spawn CLI, grep stdout) — LOW |
| Q-06 money-number guard | VACUOUS (hand-made number-free inputs) | FIXED: checker path-tracks a REAL assess()-built receipt; passed, meaning the receipt pipeline emits no money numbers |
| headLagSignal (Q-05) | DEAD CODE, untested | Tested (negative detected, no silent clamp). Wiring into G2 remains intentionally PENDING the real feed (per plan; wiring before data would itself be dead code) |
| assess golden (SPEC §11) | 2 assertions | Improved: full gate-set count + receipt shape. Residual nicety: reason-vocabulary check — LOW |
| npm audit "recorded" | NOT recorded | CLOSED: docs/DECISIONS.md Q-08 entry; live re-run matched every recorded number (15 vulns; 1L/9M/2H/3C; GHSA-9jrq-w75r-8gcw; dev chain only) |

Kill-test/hardening note: a204123's tests were verified green at head but were not
red-tested (nothing changed in src to make them red); accept: fences over real
receipt paths (Q-06) need no src change to be meaningful, but future fence authors
should state the failure mode they fence against in a comment (Q-06 lacks it).

## 4. Standing quality bar (what counts as DONE here)

- Tests-first: a red run before the fix, for anything presented as a FIX.
- Fence tests exercise the real production path, not hand-constructed clean inputs.
- No dead code: new exports referenced and, where meaningful, wired into the
  default paths.
- No dead-at-runtime placements: reachable under default parameters.
- Docs updated in or adjacent to the claiming commit; "recorded" implies an artifact.
- All gates green at the verified head: test, lint, build, secret-scan.
- Verdicts BELOW READY are honest and intact: G1/G5/G2/G9 scaffolds stay until fed
  real data; never lift a scaffold to make a gate PASS.

## 5. Verifier's current work queue

1. Section 3 Attempt 3 debts are CLOSED and re-proven (a204123); only LOW niceties
   remain (CLI-output L3 fence, golden reason-vocab, fence-failure-mode comments).
2. Docs synced with the a204123 truth (this pass). REMAINING-PLAN section 5 now
   reflects closed vs pending-with-data items.
3. Top substantive item: UR decoder live-fixture validation (O9) — scan recent
   blocks for real UR swap calldata, redacted fixture, decoder asserted.
4. Human-decision block stays quarantined: A3b semantics, SwapRouter02
   promote-or-delete, O10 calendar, README re-upgrade, outreach.
5. Standing rule: any future external commit gets the section-1 recipe on arrival.

## 6. Command cheat sheet

- Full gates: `pnpm test && pnpm lint && pnpm build && pnpm secret-scan`
- Targeted: `pnpm vitest run tests/<file>.test.ts`
- Claim archaeology: `git show <sha> --stat` / `git log --oneline -n 10`
- Dead-code probe: `grep -rn "<symbol>" src/ tests/`
- Runtime-reachability probe: trace the caller chain for the new function; if the
  only caller is inside a level the default parameters never reach, it's dead.
- Live probe (host-only output): `pnpm tsx scripts/probe-rpc.ts` /
  `pnpm tsx scripts/probe-router.ts` (requires `RHC_RPC_URL` in git-ignored `.env`)
