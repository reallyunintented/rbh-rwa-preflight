# rwa-preflight

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-143%20passing-brightgreen)](#development)
[![Node](https://img.shields.io/badge/node-%3E%3D20-blue)](#quick-start)

**rwa-preflight tells an AI agent whether a concrete transaction involving Robinhood Chain Stock Tokens may be sent right now, and produces a self-contained, block-pinned, replayable and tamper-evident receipt.**

## Why this exists
AI agents can suggest trades, but they need a deterministic, verifiable pre-trade check before anything is sent. rwa-preflight provides that check without signing or sending anything.

## What it does
- Pure gate functions G0–G12: asset identity, sequencer, oracle, corporate actions, issuer signals, valuation, decoding, simulation, execution quality, policy, lending, smart account.
- Decode-and-verify path is live: Universal Router v4 decoding pinned to the on-chain codehash (probe-recorded, never hand-typed), intent cross-check (`DECODE_MISMATCH`), gate-set completeness in aggregation.
- State-verified simulation: `eth_simulateV1` sequential reads (pre-state → swap → post-state); effects are claimed only when every read parses and state matches the decoded constraints. A verified revert is FAIL_HARD.
- Self-contained, block-pinned, replayable and tamper-evident receipts with L1 (integrity), L2 (verdict re-derivation incl. policy provenance) and L3 (on-chain evidence replay with checked/of counts).
- Fail-closed everywhere: unknown statuses, missing gates, unparseable reads or a missing READY invariant can never produce READY.

## Current honesty status
The decoded + simulated path runs end-to-end (G7/G8 live), but verdicts currently **cap below READY** by design: the G1/G5/G2/G9 gate inputs (registry probe, issuer signals, sequencer feed, mid-price) are fail-closed scaffolds awaiting real data. This is intentional, not a bug — see docs/REMAINING-PLAN.md.

## What it does not do
- Does not sign or send transactions.
- Does not guarantee safety; READY is a snapshot.
- Does not assess legal/eligibility.

## Quick start (agents)
```bash
pnpm install
pnpm test
```

```ts
import { assess } from './src/assess';

const receipt = await assess({
  rpcUrl: process.env.RHC_RPC_URL!,
  action: {
    kind: 'swap_exact_in',
    chainId: 4663,
    account: '0x1111111111111111111111111111111111111111',
    tx: { to: '0x8876789976dEcBfCbBbe364623C63652db8C0904', data: '0x', value: '0x0' },
  },
  policy: {
    maxSlippageBps: 100,
    maxOracleDeviationBps: 150,
    maxPoolFeeBps: 100,
    offSessionPolicy: 'defer',
    requireIssuerSignals: true,
    maxIssuerSignalAgeSec: 300,
    corporateActionLookaheadSec: 86400,
    corporateActionLookbackSec: 3600,
    maxDeadlineSec: 300,
    allowedRecipients: 'self',
    maxAssessmentAgeSec: 30,
    pinBlockTag: 'latest',
  },
});

console.log(receipt.assessment.verdict);
```

## Optional modules (M8/M9)
- Lending/collateral preflight (`src/lending.ts`, `src/gates/g11.ts`).
- Smart-account (ERC-4337) envelope validation (`src/smart-account.ts`).
These are experimental and not part of the v0.1 READY path.

## What READY means
READY is a snapshot verdict: supported format, state-verified constraints, state-verified effects, no unresolved critical assumptions.

## Known limitations
- No Chainlink sequencer uptime feed for chain 4663 (G2 -> UNKNOWN). Under strict mode, READY is unreachable on mainnet without a supported sequencer source.
- Degraded assurance is experimental; thresholds require probe data.
- The Universal Router v4 decoder layout is provisional until cross-checked against real swap calldata (chain-specific extra field per docs/CHAIN_FACTS.md O9); G9's fail-closed scaffolding keeps wrong decodes from reaching READY.
- Native token effects are not verified by simulation; claim exactly what is checked.
- Negative sequencer-lag signals are recorded (`headLagSignal`) but not yet wired into G2 details pending a real feed.
- Pool landscape not fully surveyed on-chain.
- USDG is treated as declared-peg unless policy allows oracle basis.

## Development
```bash
pnpm test
pnpm lint
pnpm build
pnpm secret-scan
```

## Documentation
- [SPEC.md](SPEC.md)
- [plan.md](plan.md)
- [docs/CHAIN_FACTS.md](docs/CHAIN_FACTS.md)
- [docs/DECISIONS.md](docs/DECISIONS.md)
- [docs/REMAINING-PLAN.md](docs/REMAINING-PLAN.md)
- [docs/VERIFICATION-HANDOFF.md](docs/VERIFICATION-HANDOFF.md) — standing verify-by-execution process
- [docs/HANDOFF_SESSION.md](docs/HANDOFF_SESSION.md)
- [STATUS.md](STATUS.md)

## License
MIT. See [LICENSE](LICENSE).