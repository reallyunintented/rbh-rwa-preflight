# HANDOFF-ADDENDUM (2026-10-22)

For the coding agent. Merge into `HANDOFF.md` and `STATUS.md` if their conventions differ; do not delete existing content. This file is an addendum, not a replacement.

## 1. Read order

1. `AGENTS.md`, then `SPEC.md` (v0.2), `docs/DECISIONS.md`, `STATUS.md`, `HANDOFF.md`
2. `docs/amendments/AMENDMENT-001-sequencer-assurance.md`
3. `docs/PLAN-ADDENDUM.md` (order of work, gates, stop points)
4. `docs/METER_SPEC.md` (only when Track C starts)
5. `docs/DECISIONS-ADDENDUM.md` (decision records to merge)

If two documents conflict: `SPEC.md` wins over `METER_SPEC.md`; code behavior that contradicts the spec is a finding to report, not a reason to edit the spec silently.

## 2. What changed since the last session

- The owner accepted a **strict-by-default sequencer assurance** direction (no Chainlink uptime feed is believed to exist for chain 4663) and **operator-owned, tighten-only policy** for the CLI and MCP adapters.
- A **meter** module (human-facing, order-size-specific, evidence-backed reality check for Stock Tokens) is planned as a consumer of the existing engine, gated behind the amendment.
- Smart-account enforcement is **deferred** (Track E) and must not be started.
- A suspected issue: if G2 returns `UNKNOWN` without a feed, `HUMAN_REVIEW` follows (SPEC §9), so READY may be unreachable on real mainnet. Whether the code matches this is unknown until Step A0.

## 3. Non-negotiables (restated from SPEC; violating any is a stop condition)

- The library never reads, stores or requests a private key and never signs or sends. No write RPC methods anywhere.
- RPC URLs and keys never appear in receipts, logs, fixtures, probe outputs, docs or commits. Pass them by environment variable name only. Run the secret scan before every commit.
- READY only with a supported decoder, state-verified effects, resolved critical assumptions (SPEC §9). Missing or uncertain data is `UNKNOWN`, never PASS.
- Gates and decoders do no I/O except through `EvidenceSource`; all money math is `bigint`; no floating point in valuation or premium code.
- On-chain and API strings are untrusted: sanitize, never interpolate into free text.
- `limitations` is never empty. No wording such as "safe", "trustless" or "guaranteed" anywhere (code, docs, UI).
- The party being assessed (the agent) must never be able to weaken the operator's policy.

## 4. How to work

- **Inspect, then change.** Record findings before behavior changes. Do not "fix" a failing test by weakening the test; if a test and the spec disagree, report it.
- **Tests first** for every new behavior (scenarios S33-S40, M01-M14 are the acceptance backbone). Small commits, one concern each.
- **Facts are OPEN until sourced.** Record every fact in `docs/CHAIN_FACTS.md` and `docs/FACTS-STATUS.md` with an authoritative source (official doc URL, or RPC call plus block number) and the date. Secondary articles are leads, not sources. A fact you cannot establish stays `OPEN`.
- **Independent review pass:** after each track, re-read your own diff as a hostile reviewer: look for any path that turns missing data into PASS, any place a number is shown without source and age, any place the agent can influence policy.
- **Versioning:** assessment schema `v0.3` is additive. Old v0.2 receipts must still verify with frozen v0.2 semantics (S40).
- **Layout:** the README shows a flat `src/` layout. Do not restructure existing code. New packages (for example `apps/meter`) are added via `pnpm-workspace.yaml` without moving existing files.
- **Do not extend** lending (M8) or smart-account (M9) modules. Do not add a token, a hosted service, or new chains.

## 5. First session (do these, then stop and report)

1. **T1 (Track B1):** write `docs/FACTS-STATUS.md` for O1-O16. Read-only research plus RPC probes via environment variables.
2. **T2 (Track B2):** write the drift list (docs vs code vs status).
3. **T3 (Step A0):** inspect G2 and READY reachability; write `docs/findings/FINDING-001-g2-behavior.md` using the classification in AMENDMENT-001 §2.
4. **Stop and report** with the template below. Do not start A1 until the human responds, unless FINDING-001 classifies the current behavior as "skipped or PASS when absent": in that case also prepare the minimal fix and regression tests (S33-S34) and include them in the report for approval.

## 6. Report template (use every time you stop)

```
## Report: <task ids> (<date>)
Changed: <files, one line each>
Tests: <commands run, pass/fail counts, new scenarios>
Findings: <what the code actually does; classification where requested>
Facts established: <ID, state, source>
Could not verify: <ID, what was tried>
Risks / limitations introduced: <list>
Decisions needed from human: <list with a recommended default>
Next step proposed: <one item>
```

## 7. Decisions the human must make (do not decide these yourself)

- Approve moving past STOP 1 and STOP 2 (see PLAN-ADDENDUM).
- Approve A3b (enabling degraded-mode PASS) after the A3a data exists.
- **D-M1** reference price source beyond the on-chain feed and its redisplay licence; **D-M2** hosting and monthly cost cap; **D-M3** product name, public wording, disclaimers.
- Whether to publish the meter publicly and whether to start Track E.

## 8. Known facts and caveats to carry (all subject to re-verification)

- Chain id 4663 (Arbitrum Orbit, settles to Ethereum). Stock Tokens are tokenized debt securities restricted in some jurisdictions (US persons among them); eligibility is never assessed by this project.
- Chainlink feed price is multiplier-adjusted; issuer REST price is not (SPEC F2, F3, F11). Mixing them is the main valuation bug class.
- Robinhood's account-abstraction docs list ERC-4337 and EIP-7702 support on this chain (relevant only to deferred Track E).
- The README says the Chainlink sequencer uptime feed is absent for 4663; SPEC F8 says to check it. Reconcile in O13.
- Landscape (agent-side tools and human-facing analytics) is crowded; differentiation claims must be re-checked in MM0 and stated as hypotheses until validated.

## 9. Things you must not do

Sign or send transactions; handle keys; add custom Solidity; commit secrets or credential-bearing URLs; claim safety or equivalence you have not proven; widen scope beyond the active track; treat third-party reports as verified facts; ship anything public (page, API, package release) without the human's explicit approval.
