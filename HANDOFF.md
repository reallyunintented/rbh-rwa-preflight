# HANDOFF: rwa-preflight (v0.2) for Claude Code, Codex, KiloCode, OpenCode, or any agentic coding AI

## 0. How to use this pack

1. Create an empty repo (name is the human's call; working title `rwa-preflight`).
2. Copy `SPEC.md`, `plan.md`, `HANDOFF.md` into the repo root.
3. Put the RPC URL in a git-ignored `.env` (`RHC_RPC_URL=...`). Provider URLs may contain an API key: it is a credential even though it is not a private key.
4. Start the agent in the repo and paste **Prompt A** (section 1). It runs milestone M0 only.
5. Read the M0 report yourself, decide D1-D6 (SPEC section 17), then paste **Prompt B** (section 3) for each later milestone.
6. At the review points in `plan.md`, give a *fresh* session or a different model **Prompt C** (section 4).

Environment: Node >= 20, pnpm, read-only access to a Robinhood Chain mainnet RPC. No keys, no wallets. Optional later: Foundry's `anvil` for fork-based tests.

**Authorisation level:** this pack authorises M0 only. Do not let any agent implement M1-M7 until the human has reviewed the M0 findings and settled the decisions in SPEC section 17.

---

## 1. Prompt A: start (milestone M0)

Paste everything in the block below.

```text
You are the lead engineer on "rwa-preflight", a read-only TypeScript library that tells an AI
agent whether a concrete transaction involving Robinhood Chain Stock Tokens may be sent right
now, and produces a self-contained, block-pinned, replayable and tamper-evident receipt.

Read, in this order, completely: SPEC.md (v0.2), plan.md, HANDOFF.md, AGENTS.md.
SPEC.md is the source of truth. If you find a conflict or a mistake in it, do not silently work
around it: write it to docs/DECISIONS.md and tell me.

Today's task: milestone M0 ("Facts spike") from plan.md, and nothing beyond it. No product code.

Non-negotiable rules:
1. Read-only. Never sign or send a transaction. Never create, ask for, or store a private key.
2. Secrets: RPC URLs may embed API keys. Keep them in a git-ignored .env. Never write a URL with
   path/query/credentials into any file, log, fixture, probe output, commit, or message. Store the
   host only. Add a redaction helper (with a test) and a secret scan before you save anything.
3. Do not trust the SPEC's domain facts. Every claim about the chain, an API, an address, an ABI,
   or a function's semantics must end up in docs/CHAIN_FACTS.md as VERIFIED (source: URL, or RPC
   method+params+block+date), ASSUMED, or CONTRADICTED.
4. Never type an address or ABI from memory. Fetch it from a named source or read it on-chain and
   store the source next to it. If you cannot verify something, mark it UNKNOWN.
5. Tests first for anything that is code. M0 is mostly probing, so tests are: redaction works,
   the registry build is reproducible, and probe scripts save redacted raw outputs.
6. Use RPCs and the issuer REST API politely (rate limits, timeouts, backoff).
7. Keep commits small. Keep STATUS.md (one screen) up to date.

M0 deliverables (details in plan.md):
- Minimal scaffold, .gitignore for .env*, secret-scan hook, redaction helper + test, CI skeleton.
- scripts/probe-rpc.ts and redacted raw outputs: chain id, client version, latest/safe/finalized
  behaviour and how those tags map to the documented finality stages, eth_simulateV1,
  debug_traceCall (callTracer + prestateTracer diff), eth_call state overrides, eth_getLogs range
  limits, historical eth_call depth.
- THE GO/NO-GO TEST: on a real, unsent swap-shaped transaction, show that your chosen simulation
  backend reports balance and allowance changes (account and recipient; tokenIn, tokenOut, native)
  from STATE, not from event logs. Document the exact method.
- Issuer REST API probe (/assets, /prices/{symbol}, /corporate-actions): schema, tradingCapabilities,
  isTradingHalt, timestamps, cache headers, rate limits, auth. Redacted samples.
- Token contract: enumerate ALL pause/halt flags and relevant functions; what newUIMultiplier() and
  effectiveAt() return when nothing is staged; whether uiMultiplier() flips lazily at effectiveAt.
- Sequencer uptime feed for chain 4663 (address, live status).
- Router and pools: deployed Uniswap v4 router(s), codehash, calldata layout for single-hop
  exact-input swaps USDG <-> Stock Token, Permit2 flow, any chain-specific extra fields; survey the
  pool landscape (fee tiers, hooks, how an acceptable pool can be identified).
- docs/CHAIN_FACTS.md covering F1-F13 and O1-O12 from SPEC.md section 5.
- scripts/build-registry.ts -> registry/stock-tokens.json with sources and verifiedAtBlock,
  reproducible on a second run. Does USDG have a Chainlink feed?
- docs/LANDSCAPE.md: re-check every tool named in SPEC.md section 3 (including KeeperHub's
  Robinhood plugin and the Arcus gateway): does it decode/simulate the caller's calldata, does it
  expose replayable or tamper-evident evidence, what is its licence.
- docs/DECISIONS.md: your proposals for D1-D6 (SPEC.md section 17), each with evidence.

Stop conditions (stop and ask me before continuing):
- No simulation method exposes state effects, and no alternative is obvious.
- No usable sequencer-health evidence exists for chain 4663.
- A fact in SPEC.md section 5 is contradicted by what you observe.
- Another tool already provides replayable, tamper-evident, calldata-decoded verdicts.
- You find a credential in any file, log, or history (stop, tell me, do not commit).
- You think the scope should change.

When done, reply with: (a) verified vs unverified facts, (b) the go/no-go result and recommended
simulation backend, (c) anything in the SPEC you think is wrong, (d) proposals for D1-D6,
(e) the M0 exit checklist with each item done/not done, (f) your recommendation: continue as
specified, narrow scope, or stop.
```

---

## 2. Prompt B: continue with the next milestone

```text
Continue the rwa-preflight project. Read STATUS.md, then SPEC.md (v0.2) and plan.md.
Today's task: milestone M{N} only. Follow plan.md "Working rules" and the CLAUDE.md hard rules.
Decisions D1-D6 as settled by the human are recorded in docs/DECISIONS.md; use them.

1. Summarise in 5 lines what M{N} must deliver and which scenario fixtures/tests you will write first.
2. Write the failing tests/fixtures first and show me they fail for the right reason.
3. Implement until green. Keep commits small. Run the secret scan before each commit.
4. Re-check CHAIN_FACTS.md: any gate that depends on an ASSUMED fact must degrade to UNKNOWN if the fact is wrong.
5. Finish with: exit checklist for M{N} (done/not done), what you could not verify, anything in the
   SPEC you think is wrong, and the next 3 actions. Update STATUS.md.

If a stop condition in HANDOFF.md section 5 triggers, stop and ask.
```

---

## 3. Prompt C: independent adversarial review (use a fresh session or a different model)

```text
You are a skeptical reviewer. You did not write this code. Read SPEC.md (v0.2) and docs/CHAIN_FACTS.md,
then review {PATHS}. Your job is to find ways the tool could return READY when it should not, or
produce a receipt that verifies when it should not, or leak a credential.

Produce docs/REVIEW-{N}.md with:
1. Violations of SPEC hard architectural rules (I/O outside EvidenceSource, floats in valuation,
   nondeterminism, unsanitised strings, unsafe rounding).
2. Paths to READY that bypass the READY invariant: unsupported tx formats treated as supported,
   decoder mis-decodes, agent `intent` influencing the verdict, log-based effects treated as proof,
   unresolved assumptions hidden, missing evidence not mapped to UNKNOWN.
3. Gates whose behaviour depends on an ASSUMED or UNVERIFIED fact without degrading to UNKNOWN.
4. Receipt weaknesses: anything L2 needs that is not inside the receipt; ways to alter inputs,
   evidence, or assessment so L1/L2/L3 still pass; offchain-captured evidence shown as verified;
   L3 reporting success for unchecked evidence.
5. Credential leakage: any place a URL with path/query/key could reach disk, logs, fixtures, receipts, errors.
6. Concrete counterexamples: for each finding, a minimal input/evidence bundle or calldata and the
   verdict it should produce.
7. Missing scenarios in the suite. Severity (blocker / major / minor) per finding.

Do not fix anything. Do not praise. If you found nothing in a category, say what you tried.
```

---

## 4. Stop-and-ask triggers (the agent must pause for the human)

- No simulation method exposes state effects (balances/allowances) and no alternative is obvious.
- No usable sequencer-health evidence for chain 4663.
- A SPEC fact is contradicted by observation (multiplier semantics, feed behaviour, pause flags, router layout, REST semantics).
- Another tool already ships replayable, tamper-evident, calldata-decoded verdicts.
- A credential (RPC key, token) appears anywhere in files, logs, or git history.
- A dependency with install scripts, native binaries, or a very recent unreviewed release is proposed.
- Any change that would make the library hold keys, sign, or send transactions.
- Scope change: new action kinds, new chains, smart accounts, hosted API, token/coin ideas.
- Anything touching legal/eligibility determination of Stock Token holders.
- Any temptation to relax the READY invariant or to treat a missing check as a pass.

## 5. Decisions only the human can make

- D1-D6 in `SPEC.md` section 17 (issuer signals in v0.1, supported pair/router, transaction envelope, simulation backend, finality/freshness defaults, quote-asset valuation).
- Package/repo name and GitHub owner; licence (default MIT); npm publishing and scope.
- Which RPC providers to use (and whether paid/archive access is acceptable).
- Whether to proceed after the M0 and M6 checkpoints (kill criteria in `SPEC.md` section 15).
- Whether to pursue signed receipts (M7) after validation.

## 7. Notes for other agents

- Codex/OpenCode/others: rename the section 2 block to `AGENTS.md`. The prompts are model-agnostic.
- If the harness has session-continuity tooling, point it at `STATUS.md`, `plan.md`, and `docs/DECISIONS.md`; those three files are enough to resume.
- Run review passes (Prompt C) with a different model family or a clean session; the same session tends to approve its own work.
