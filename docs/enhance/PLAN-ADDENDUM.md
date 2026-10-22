# PLAN-ADDENDUM (2026-10-22)

Appends to `plan.md`. Do not delete existing milestones. If `plan.md` already marks milestones done (for example M0-M7), keep that status and add these tracks after it. Unknown repo state is resolved by Track B and Step A0, not by assumption.

## Principles

1. **Inspect before changing.** Record what exists (code, tests, fixtures, status) before editing behavior.
2. **One track at a time**, in the order below. Each track has a gate and a stop point where the agent reports to the human.
3. **Claims ledger:** every claim in README or SPEC maps to a test or a recorded fact. Anything unproven is "OPEN", never "ASSUMED".
4. **Fail closed.** Missing, unsupported or uncertain data never becomes approval or a reassuring number.
5. **No scope creep.** Lending (M8) and smart-account (M9) modules stay experimental and out of the READY path. Do not extend them in these tracks.

## Order and gates

```
B (facts) -> A0 -> A1 -> A2 -> [STOP 1: human review] -> A3a -> C (meter MM0..MM4) -> D (validation) -> [E deferred]
```

### Track B: facts and doc drift (first)

- **B1** Create `docs/FACTS-STATUS.md`: one row per open fact O1-O16 (SPEC §5 and AMENDMENT-001 §11) with state `RESOLVED | OPEN | WRONG`, the source (doc URL, or RPC call plus block number) and the date. Do not guess. Redact URLs and keys.
- **B2** List every statement in README, SPEC and STATUS that disagrees with the code or with FACTS-STATUS. Fix wording or open an issue. Known drift: SPEC says "v0.2 draft" and lists M0 items as to-do while STATUS reportedly records M7 done and v0.2.0 released; SPEC §3a lists lending and smart accounts as non-goals while README lists them as optional modules (M8/M9).
- Done when: FACTS-STATUS and the drift list are committed and consistent.

### Track A: AMENDMENT-001 (sequencer assurance and policy provenance)

- **A0** Inspect G2 and READY reachability, produce `docs/findings/FINDING-001-g2-behavior.md` (AMENDMENT-001 §2). Read-only. If the classification is "skipped or PASS when absent", fix that first as a patch release.
- **A1** Policy provenance: operator-owned policy source for CLI and MCP, tighten-only overrides, `policyProvenance` in the receipt, scenario S39. Tests first.
- **A2** Strict G2 per AMENDMENT-001 §4, new reason codes, schema v0.3 with frozen v0.2 verify path (S40), scenarios S33-S35, README and STATUS wording, SPEC v0.3 and DECISIONS entries (D7, D8).
- **STOP 1:** report to the human: FINDING-001 result, whether READY is reachable on 4663, the diff summary, test results. Wait for approval before A3a.
- **A3a** Observe-only degraded signals (AMENDMENT-001 §6): O14, O15 probes, `scripts/probe-block-cadence.ts`, signals recorded in the G2 details, scenario S36. **No verdict change.** A3b (enabling degraded PASS) is a separate human decision after the data exists.

### Track C: meter (`docs/METER_SPEC.md`)

Gate: FINDING-001 done, A1-A2 done (or waived in DECISIONS by the owner), FACTS-STATUS shows O1, O5, O7, O9, O12 resolved or degraded-to-UNKNOWN by design.

- **MM0** Landscape recheck, D-M1, quote method, canonical pool rule. Stop if the combined hypothesis is already served.
- **MM1** Quote module, snapshot builder, formulas, scenarios M01-M14 on fixtures. No UI.
- **MM2** API and page, string table with lint, permalinks. Private preview only.
- **STOP 2:** human review of wording (D-M3), hosting (D-M2), cost cap. No public launch without explicit approval.
- **MM3** Optional extras. **MM4** Validation (METER_SPEC §12).
- Layout: the README shows a flat `src/` layout while SPEC §6 suggests pnpm workspaces. Do not restructure existing code. Add the meter as a new workspace package (for example `apps/meter`) that depends on the existing package, adding only a minimal exports map if needed.

### Track D: core validation (existing SPEC §15)

Continue the signal checks: show the S07 demo and a receipt to 3 adjacent-project maintainers and 3 independent agent builders. Record in `docs/VALIDATION.md`. Proceed to hosted API, signing or more chains only on a real integration signal (SPEC §15).

### Track E: scoped smart-account enforcement (DEFERRED; do not start)

Preconditions: a positive signal from Track D or an explicit owner decision recorded in DECISIONS. Then:

1. **Verify first:** Robinhood's account-abstraction docs (docs.robinhood.com/chain/account-abstraction, read 2026-10-22) state ERC-4337 and EIP-7702 support, EntryPoints v0.6/v0.7/v0.8, a Safe 4337 module, Alchemy as bundler/RPC, ZeroDev as an alternative. Re-fetch, record addresses with sources, and confirm that a smart-account stack with session-key policies (for example Kernel permissions: call, gas, rate-limit, timestamp policies) is actually deployed on chain 4663. If not, stop and report.
2. **Design constraints:** dedicated sandbox account with a deliberately tiny balance (the balance is the worst case); owner key never on the agent machine; agent gets only a session key with call policy (router, swap selector, recipient is the account, token allowlist), short expiry, rate limit, gas cap; `approve` only for exact amounts to the router; **no custom Solidity** in the first iterations, only existing audited components; confirm the router entry point has an ABI simple enough for argument-level call policies (Universal Router packed bytes may not be).
3. **Phases:** testnet account and session key -> executor (agent requests, executor runs preflight, signs only on READY, key isolated from the agent's shell) -> `verify-account` (read installed permissions, compare to the owner's policy, refuse READY if looser) -> revocation and kill switch -> hostile-agent test suite on a fork (wrong target, changed recipient, multicall wrapping, approve-to-attacker, plain transfer, admin calls, replay after expiry or revocation, cap overruns) -> receipts v2 bound to UserOp and tx hash with a simulated-vs-actual state diff.
4. **Before any real funds:** independent review of the session policy and executor; staged rollout; limitations stated plainly. An onchain co-signer that makes the verdict binding on-chain needs custom Solidity plus an audit budget and is out of scope.

## Stop conditions (report immediately, do not push on)

- READY is found to be reachable without a supported decoder and state-verified effects.
- A gate is found to treat missing data as PASS.
- A secret or credential-bearing URL appears in any committed file, log or fixture.
- A required fact cannot be established from an authoritative source after a reasonable attempt.
- Any task would need a private key, a write RPC method, or sending a transaction.

## Definition of done (per track)

Code and tests merged; scenarios listed for the track pass; SPEC/README/STATUS/DECISIONS/CHAIN_FACTS updated and consistent with the code; limitations stated; STATUS shows the track state; the report in `HANDOFF-ADDENDUM.md` format delivered.
