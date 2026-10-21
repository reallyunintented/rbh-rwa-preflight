# rwa-preflight: agent instructions

Read SPEC.md (v0.2, source of truth), plan.md (milestones), HANDOFF.md (prompts and rules) first.

## Hard rules
- Read-only. No signing, no sending, no private keys anywhere (code, tests, env files, docs).
- Secrets: RPC URLs can embed API keys. Keep them in git-ignored .env; never write URLs with
  path/query/credentials to any file, log, fixture, probe output, receipt, or commit. Store hosts only.
  CLIs take env-var NAMES, not literal URLs. Run the secret scan before every commit.
- READY invariant: READY only if (a) the tx format is supported (known router codehash + decoder),
  (b) every claimed tx-enforced constraint is verified on the DECODED calldata, (c) effects are
  verified from simulated STATE, (d) no critical assumption is unresolved. Anything else is
  UNKNOWN (=> HUMAN_REVIEW), DEFER, or BLOCKED. Never relax this to finish a task.
- `intent` fields from the agent are diagnostic only. They never grant approval.
- Events/logs are diagnostics, never proof of absence of effects. Claim only what state reads verified.
- Receipts are self-contained: policy, registry slice, calendar slice, decoder versions, and all
  evidence live inside the receipt. Replay never uses current defaults or local files.
- Evidence is classed onchain-reverifiable or offchain-captured; L3 never claims to verify the latter.
- Gates/decoders are pure: only I/O is the EvidenceSource. No fetch, Date.now, Math.random, env reads.
- All money math is bigint. No floats in valuation code. Round conservatively.
- On-chain and API strings are untrusted. Never interpolate them into reason text or tool output.
- Never hand-type addresses/ABIs. Generate from a named source or read on-chain; store the source.
- Every chain/doc/API claim goes into docs/CHAIN_FACTS.md as VERIFIED / ASSUMED / CONTRADICTED with source and date.
- Wording: "replayable and tamper-evident", never "trustless"; "READY" is a snapshot, not safety.

## Workflow
- Tests first (failing test, then code). One milestone at a time; check the exit list in plan.md.
- Small commits, CI green at each commit. Update STATUS.md at the end of every session.
- No new dependency without a one-line justification in docs/DECISIONS.md. Pin versions.
- If SPEC.md seems wrong or incomplete, record it in docs/DECISIONS.md and ask; don't improvise silently.

## Commands (fill in during M0/M1)
- install: pnpm install
- test: pnpm test
- lint: pnpm lint
- build: pnpm build
- secret scan: (fill in)
- probe RPC: pnpm tsx scripts/probe-rpc.ts
- build registry: pnpm tsx scripts/build-registry.ts

## Definition of done (any task)
Tests written first and passing; lint passes; secret scan clean; docs and CHAIN_FACTS updated if
facts changed; STATUS.md updated; no TODO hiding a missing check (a missing check must produce UNKNOWN).
