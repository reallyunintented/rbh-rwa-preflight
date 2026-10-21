# rwa-preflight

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-56%20passing-brightgreen)](#development)
[![Node](https://img.shields.io/badge/node-%3E%3D20-blue)](#quick-start)

**rwa-preflight tells an AI agent whether a concrete transaction involving Robinhood Chain Stock Tokens may be sent right now, and produces a self-contained, block-pinned, replayable receipt.**

## Why this exists
AI agents can suggest trades, but they need a deterministic, verifiable pre-trade check before anything is sent. rwa-preflight provides that check without signing or sending anything.

## What it does
- Verifies asset identity, oracle, corporate actions, issuer signals, valuation, decoding, simulation, execution quality, policy.
- Decodes and simulates the actual transaction; `intent` is diagnostic only.
- Returns READY only for supported formats with state-verified effects.

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
- No Chainlink sequencer uptime feed for chain 4663 (G2 -> UNKNOWN).
- Pool landscape not fully surveyed on-chain.
- USDG is treated as declared-peg unless policy allows oracle basis.

## Development
```bash
pnpm test
pnpm lint
pnpm secret-scan
```

## Documentation
- [SPEC.md](SPEC.md)
- [plan.md](plan.md)
- [docs/CHAIN_FACTS.md](docs/CHAIN_FACTS.md)
- [docs/DECISIONS.md](docs/DECISIONS.md)
- [STATUS.md](STATUS.md)

## License
MIT. See [LICENSE](LICENSE).
EOF