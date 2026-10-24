# Handoff (current) — 2026-10-24, after commit e001f93

Refreshed from the stale M2-era version. Read after SPEC.md, plan.md, AGENTS.md.

## State of the repo (all verified by runs, not claims)

- HEAD: `e001f93` — clean tree. Suite: **51 files / 136 tests green**; `pnpm lint`
  (tsc + eslint), `pnpm build`, `pnpm secret-scan` all clean at head.
- Version v0.4.0. Deps pinned + lockfile synced (viem 2.57.7, zod 4.6.7, tsx 4.23.15,
  typescript 5.9.3, vitest 2.1.9). pnpm has no deprecation warning (config migrated
  fully to pnpm-workspace.yaml; ignored package.json `pnpm` field removed).
- Authoritative docs: `docs/AUDIT-2026-10-24.md` (findings F-01..F-16, Q-series),
  `docs/OPEN-ITEMS.md` (done/open ledger), `docs/REMAINING-PLAN.md` (amended attack
  order, statuses updated), `docs/CHAIN_FACTS.md` (chain facts; O9 = router pin),
  `docs/VERIFICATION-HANDOFF.md` (STANDING verify-before-trust process + claim
  ledger with per-claim re-proof commands; read it before trusting ANY done claim),
  `STATUS.md` (full session trail incl. the a63c38a verification saga).

## Engine honesty snapshot

- Decoded + simulated path is LIVE through G7 (codehash pinned from a live probe:
  `docs/probes/router-codehash-probe.json`, block 0x5c36f13) and G8 (real sequential-
 reads state verification: tokenIn outflow in (0, amountIn], tokenOut inflow >=
  minAmountOut to decoded recipient, nothing else moves, revert-first FAIL_HARD).
- Verdicts still CAP BELOW READY and that is INTENTIONAL: G1/G5/G2/G9 gate inputs
  remain scaffolded (registry probe, issuer signals, sequencer feed, mid-price).
  Do not "fix" that by lifting the scaffolds — feed them real data instead.
- Intent cross-check S22 (`src/intent.ts`) and gate-set completeness
  (`aggregate(..., expectedGateIds)` in `src/verdict.ts`) are live and tested.

## Session history worth knowing (lessons, in order)

1. Commit `033b10f` (external) claimed "F-04 state-diff parsing" but shipped a
   truthy-field shortcut (`stateDiff`-shaped field => available:true). Found by
   claim-by-claim audit; true implementation landed in `3b03a73`; a permanent fence
   test now guards it (tests/simulator-effects.test.ts).
2. Commit `a63c38a` (external) claimed "implement remaining plan" but delivered 2
   trivial tests and: a provenance check DEAD at default verify levels (it sat in
   verifyL3), a crash on malformed intent (BigInt) with float deadline compare,
   gate completeness only as a throw, and a BACKWARDS pnpm migration (deleted the
   esbuild allowlist, left the ignored package.json field). All fixed tests-first.
   Proof discipline that caught both: run tests, don't read commit messages.

## Convention for incoming work (AGENTS.md hard rules, condensed)

- Tests FIRST (red, run, then code). Small commits; `pnpm secret-scan` before EVERY
  commit; STATUS.md updated at session end.
- Read-only: no signing/sending; no private keys; no credential-bearing URLs in any
  file/log/fixture (hosts only; CLIs take env-var NAMES).
- READY invariant is never relaxed to finish a task; a missing check is UNKNOWN.
- Never hand-type addresses/ABIs: constants come from named committed sources
  (`docs/probes/*.json`, tests/router-probe.test.ts ties src to the probes).
- All money math bigint. On-chain/API strings are untrusted — never interpolate them
  into reason text or output.

## Open work, amended attack order (docs/REMAINING-PLAN.md is the living version)

1. UR decoder live-fixture validation (O9 caveat — HIGH-VALUE): the v4 swap-struct
   layout chain-specific extra field makes decoded min-out semantics provisional.
   Do: scan recent blocks via RPC for UR swap calldata, store a redacted fixture
   (host only), assert the decoder against it. Attempt the capture; if none found,
   record that in CHAIN_FACTS and defer. G9 scaffolding keeps wrong decodes failing
   closed meanwhile.
2. Fence tests (already-done behaviors need regression fences, do NOT reimplement):
   L3 `checked`/`of` present in CLI/MCP verify output; meter-api carries no NORMAL
   labels.
3. Q-06 money-number guard test: no money `number` in receipt fields.
4. Sequencer negative-lag signal (Q-05): record negativeLagSec instead of silent
   clamp; flag in G2 details. Latent while G2 signals are scaffolded.
5. npm audit (Q-08, network permitting; record results). CLI assess golden test
   (SPEC section 11).
6. Policy-FILE provenance variant: verifyL2 currently checks receipt self-consistency;
   a verify-side convention for "policy file supplied at verify time" is a design
   decision to make with the human.
7. Human decisions (do NOT improvise): A3b degraded-G2 PASS semantics (needs probe
   data, see DECISIONS.md); SwapRouter02 promote-or-delete (now that O9 codehash is
   pinned, layout validation in item 1 informs this); M6/Track D outreach; NYSE
   holiday calendar source (O10); F-08 README re-upgrade ONLY after G1/G5/G2/G9 get
   real data.

## Commands

- install: `pnpm install --frozen-lockfile`
- test / lint / build: `pnpm test` / `pnpm lint` / `pnpm build`
- secret scan: `pnpm secret-scan`
- probe RPC: `pnpm tsx scripts/probe-rpc.ts`
- probe router: `pnpm tsx scripts/probe-router.ts [<addressFromCHAIN_FACTS-O9>]`
  (requires `RHC_RPC_URL` in git-ignored `.env`; emits host-only JSON to
  `docs/probes/router-codehash-probe.json`)

## Verify-before-trust (standing instruction for the next session)

Any prior commit's claims — including ones from this handoff — must be re-proven by
running the targeted tests before building on them: `pnpm vitest run <file>`.
History here has two recorded fake/partial deliveries; assume nothing.
