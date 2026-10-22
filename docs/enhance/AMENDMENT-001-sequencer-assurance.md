# AMENDMENT-001: Sequencer assurance and policy provenance

Status: PROPOSED. Direction accepted by the owner on 2026-10-22. Implementation order: `docs/PLAN-ADDENDUM.md`, Track A.
Applies to: `SPEC.md` v0.2 (draft). Produces SPEC v0.3 and assessment schema `rwa-preflight/assessment/v0.3` (additive).
Edits required: SPEC §5 (resolve O2, add O13-O16), §7 (Policy, reason codes, Receipt), §8 (G2), §9 (note), §11 (policy provenance), §13 (S33-S40), §14, §18; `docs/CHAIN_FACTS.md`; `docs/DECISIONS.md` (D7, D8); `STATUS.md`; README "Known limitations".

## 1. Why this amendment exists

1. Chain 4663 appears to have **no Chainlink L2 Sequencer Uptime Feed**. README "Known limitations" says `G2 -> UNKNOWN`. SPEC F8 says to check that feed; SPEC O2 asks whether it exists. These must be reconciled by a probe, not by assumption.
2. SPEC §8 maps "feed unknown" to `UNKNOWN`, and §9 maps any `UNKNOWN` to `HUMAN_REVIEW`. If the code follows the spec, **no real mainnet assessment can reach READY**. That contradicts the README quickstart and acceptance criteria 01-02, unless the code deviates. Either the code deviates (possible defect) or READY is unreachable on mainnet (must be stated plainly in the README).
3. Why G2 matters for this tool: right after a sequencer outage, oracle and pool prices can lag. A price-staleness allowance or a price band can still pass a stale price. Chainlink's documentation describes the uptime feed as the mechanism to detect outages and enforce a recovery grace period, and says that after downtime the sequencer processes delayed-inbox messages before new transactions (source: docs.chain.link/data-feeds/l2-sequencer-feeds, re-verify in O13).
4. The MCP adapter (SPEC §11) does not say who supplies the policy. If the agent can pass policy parameters, it can weaken any safeguard added here.

## 2. Step 0: inspect before changing (mandatory, read-only)

Do not change any behavior until `docs/findings/FINDING-001-g2-behavior.md` is committed.

Tasks:
- Locate the G2 implementation and every place the sequencer feed address is read (registry, config, gate, tests, fixtures). Record file paths and line ranges.
- Run the existing test suite. Record which scenarios exercise G2 and with what feed source (real, mock, absent).
- Run a **read-only** live `assess` for 3 registry tokens (RPC URL via environment variable only). Record the verdict, the G2 gate result (status, reasons, enforcement) and the final reasons. Redact any URL or key.
- Check how S01 ("healthy swap -> READY") is satisfied: by a real chain read, a mock feed, or a bypass.

Classify the current behavior:

| Current behavior when the feed is absent | Meaning | Action |
|---|---|---|
| G2 returns `UNKNOWN` and the verdict becomes `HUMAN_REVIEW` | Safe default, but READY is unreachable on 4663 | Keep behavior. Document it (README, STATUS). Add the new reason code (§4). |
| G2 is skipped or treated as PASS (including a zero address) | Security defect against the fail-closed spec | Fix first, as a patch release, with regression tests S33-S34. |
| G2 is replaced by a price-freshness or price-band check | The guarantee is overstated | Correct the claim and restore `UNKNOWN`. Freshness checks stay in G3 where they belong. |

Report anything else you find (for example a config flag that disables G2).

## 3. Decision

Sequencer assurance becomes **explicit and capability-based**, with `strict` as the default:

- **strict (default):** READY requires a supported source that establishes (i) current up/down status and (ii) a verifiable timestamp of the last transition, so the recovery grace period can be enforced. If no such source exists for the chain, G2 is `UNKNOWN` with `SEQUENCER_UPTIME_UNAVAILABLE`, and the verdict is `HUMAN_REVIEW`. An empty, zero or unresolvable feed address is never PASS.
- **degraded:** an experimental, operator-enabled mode (§6). It never claims equivalence to the on-chain uptime flag. In this amendment it starts as observe-only.
- The only acceptable uptime source today is the on-chain Chainlink L2 Sequencer Uptime Feed proxy for the chain (answer `0` = up, `startedAt` = last transition) plus a policy grace period. Any other candidate source needs its own amendment and must show: status, a verifiable transition timestamp, and independence from the party whose liveness it attests (or document why not).

## 4. G2 behavior (replaces the G2 row in SPEC §8)

| Situation | Gate status | Reason code | Enforcement |
|---|---|---|---|
| Supported feed: up and grace elapsed | PASS | none | advisory |
| Supported feed: down | FAIL_TRANSIENT | `SEQUENCER_DOWN` | advisory |
| Supported feed: up but inside grace | FAIL_TRANSIENT (+`retryAfterSec`) | `SEQUENCER_GRACE_PERIOD` | advisory |
| No supported source, `sequencerAssurance: strict` | UNKNOWN | `SEQUENCER_UPTIME_UNAVAILABLE` | none |
| No supported source, `degraded`, observe-only stage | UNKNOWN (signals recorded, see §6) | `SEQUENCER_UPTIME_UNAVAILABLE` | none |
| Degraded enabled (stage A3b only), all signals clean | PASS with limitation `SEQUENCER_DEGRADED_ASSURANCE` | none | advisory |
| Degraded enabled, gap or lag detected | FAIL_TRANSIENT or UNKNOWN per §6 | `SEQUENCER_GAP_DETECTED` / `HEAD_LAG_EXCEEDED` / `L1_BATCH_STALE` | advisory |
| Feed read errors, malformed answer, `startedAt` in the future | UNKNOWN | `EVIDENCE_INCOMPLETE` | none |

Add to SPEC §9: "A chain with no supported sequencer source cannot produce READY under `strict`. This is intended, must be stated in the README, and is not a bug."

## 5. Policy provenance (new rule for SPEC §11)

Principle: **the party being assessed must not be able to weaken the policy.**

- The CLI and MCP adapters load the policy from an **operator-owned source**: a file whose path comes from an environment variable named on the command line (for example `--policy-env RWA_PREFLIGHT_POLICY_FILE`). The tool schema must not accept a full policy from the agent.
- The agent may pass **tightening overrides only**. A request that loosens any field is rejected with the adapter error `POLICY_LOOSENING_REJECTED`; no assessment is produced. The error names the field, never echoes secrets.
- The receipt records `policyProvenance`: `{ source: 'operator-file' | 'library-caller', operatorPolicyHash, overrides: [...] }`. Library callers who embed `core` supply their own policy and own that responsibility; say so in the README.
- `preflight_default_policy` returns the effective policy so a human can inspect it.

Tightening order per field (a value may only move in the listed direction):

| Field | Tighter means |
|---|---|
| `allowTokens`, `allowedPools`, `allowedHooks` | a subset |
| `allowedRecipients` | `'self'` is tighter than any list; lists may only shrink |
| `maxNotionalQuote`, `maxSlippageBps`, `maxOracleDeviationBps`, `maxPoolFeeBps`, `offSessionMaxDeviationBps`, `maxFeedAgeSecInSession`, `maxIssuerSignalAgeSec`, `maxDeadlineSec`, `maxAssessmentAgeSec` | a smaller number |
| `corporateActionLookaheadSec`, `corporateActionLookbackSec` | a larger number |
| `requireIssuerSignals` | `false` -> `true` only |
| `offSessionPolicy` | `allow_wider` -> `warn` -> `defer` |
| `pinBlockTag` | `latest` -> `safe` -> `finalized` |
| `sequencerAssurance` | `degraded` -> `strict` only |

## 6. Degraded assurance (research track, off by default)

Why it is hard: one RPC call cannot establish continuous health. The chain's own history can cover a past window, so only "right now" needs a capture-time clock. Candidate signals (all to be validated, none is an equivalent of the on-chain uptime flag):

| Signal | What it measures | Evidence class |
|---|---|---|
| D-a Header gap scan | Largest timestamp gap between consecutive L2 blocks over `sequencerLookbackSec`, ending at the pinned block | onchain-reverifiable |
| D-b Head lag | Capture wall-clock time minus pinned block timestamp | offchain-captured (advisory) |
| D-c L1 batch recency | Age of the latest batch delivered to the rollup's L1 inbox (if the L1 contracts can be identified, O14) | onchain-reverifiable (L1 RPC) |

Rules:
- The sequencer sets L2 timestamps. Header data is evidence, not proof. D-c is the only signal independent of the sequencer, and only if O14 succeeds.
- No magic numbers. Thresholds (`sequencerMaxGapSec`, `sequencerMaxHeadLagSec`, `sequencerMaxBatchAgeSec`, grace) come from the probe in O15 (at least 14 days of observed cadence, outages and gaps) and are recorded in `docs/DECISIONS.md` with the data.
- Time to block mapping reuses the recorded binary search from G4. Respect RPC range limits and chunk requests. Each probe is evidence.
- No monitoring daemon in v0.x. Anything that needs observations across time that the chain does not hold is out of scope and must resolve to `HUMAN_REVIEW`.

Stages:
- **A3a observe-only:** compute and record D-a, D-b, D-c in the receipt (details of the G2 gate). G2 stays `UNKNOWN`. Verdicts do not change.
- **A3b enable:** allow PASS under `degraded` only when all of these hold: (1) probe data shows cadence is stable and gaps are detectable; (2) scenarios S36-S38 pass on fixtures including at least one real or faithfully synthetic outage; (3) an independent review pass found no unresolved issue; (4) the README and receipt limitations state that native uptime status and a cryptographic recovery timestamp are unavailable. Until then degraded mode cannot produce READY.

## 7. New policy fields, reason codes, receipt fields

Policy (all operator-owned; defaults):
- `sequencerAssurance: 'strict' | 'degraded'` default `'strict'`
- `sequencerGraceSec` default decided in Step A2 from the Chainlink recommendation and recorded
- degraded only: `sequencerLookbackSec`, `sequencerMaxGapSec`, `sequencerMaxHeadLagSec`, `sequencerMaxBatchAgeSec`, `l1RpcEnvName` (no defaults until A3a data exists; ignored under `strict`)

Reason codes (closed set; minor version bump): `SEQUENCER_UPTIME_UNAVAILABLE`, `SEQUENCER_DEGRADED_ASSURANCE` (limitation), `SEQUENCER_GAP_DETECTED`, `HEAD_LAG_EXCEEDED`, `L1_BATCH_STALE`. Adapter error (not a verdict): `POLICY_LOOSENING_REJECTED`.

Receipt: add `policyProvenance` (§5). The G2 `details` record which source and signals were used.

## 8. Versioning and replay

- Bump the assessment schema to `v0.3`. Additive fields only.
- G2 semantics change. Receipts carry `libraryVersion` and `schemaVersions`. L2 verify must keep the **frozen v0.2 G2 logic** for v0.2 receipts, or fail with a clear version error. It must never re-derive an old receipt with new semantics.
- Add a regression test: every existing v0.2 fixture receipt still verifies at L1 and L2.

## 9. New scenarios (SPEC §13)

| ID | Scenario | Expected |
|---|---|---|
| S33 | Chain with no uptime source, `strict` | HUMAN_REVIEW `SEQUENCER_UPTIME_UNAVAILABLE`, never READY |
| S34 | Registry entry has zero or missing feed address | Never PASS (unit and property test) |
| S35 | Synthetic mock feed: up, grace elapsed, everything else healthy | READY (proves READY stays reachable where a feed exists). Marked `synthetic: true` |
| S36 | A3a: header gap inside the lookback window | Receipt records `SEQUENCER_GAP_DETECTED`; verdict unchanged (HUMAN_REVIEW) |
| S37 | A3b only: clean window, fresh head, recent L1 batch | READY with limitation `SEQUENCER_DEGRADED_ASSURANCE` |
| S38 | A3b only: gap within grace / head lag exceeded | DEFER with `retryAfterSec` / HUMAN_REVIEW `HEAD_LAG_EXCEEDED` |
| S39 | MCP call tries to loosen policy (any row in §5) | Rejected `POLICY_LOOSENING_REJECTED`; a tightening override is accepted and recorded |
| S40 | Old v0.2 receipt | Still verifies at L2 with the original G2 semantics |

## 10. Acceptance criteria

1. FINDING-001 committed before any behavior change, with the classification from §2.
2. S33, S34, S35, S39, S40 pass. S36-S38 pass or are explicitly deferred with the reason recorded.
3. No code path can produce PASS for G2 without a supported source or the A3b conditions (test).
4. The README states, in the first screen of "Known limitations", whether READY is currently reachable on chain 4663.
5. CHAIN_FACTS.md reconciles F8 with the O13 probe result, with the RPC call and block number.
6. SPEC v0.3, DECISIONS (D7, D8) and STATUS are updated and consistent with the code.

## 11. Open facts to establish (record in `docs/CHAIN_FACTS.md`, never assume)

- **O13:** Does any supported Chainlink L2 Sequencer Uptime Feed exist for chain 4663? Check Chainlink's supported-network list and the Robinhood oracle docs, and probe on-chain. Record sources, RPC call and block. Do not rely on a claim from a third party that Chainlink has stopped adding feeds; verify at source.
- **O14:** Identify the rollup's L1 contracts (inbox, batch delivery events) for chain 4663 and how batches are posted (the chain is an Arbitrum Orbit chain settling to Ethereum; one source says data is posted through blobs). Record addresses with sources.
- **O15:** Observed block cadence on 4663 over at least 14 days: gap distribution, any outage-like gaps, post-gap behavior. Produce `scripts/probe-block-cadence.ts` and commit its summary (not raw RPC URLs).
- **O16:** Does Robinhood publish any sequencer status, feed, or delayed-sequencing fallback? Record the exact doc URL and wording. Treat any mention seen in secondary text as unverified until found at source.

## 12. Non-goals

Monitoring daemons; claiming equivalence between degraded signals and the on-chain uptime flag; changes to other gates; relaxing the READY invariant; hosted services.
