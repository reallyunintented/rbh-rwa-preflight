# Handoff (current)

Milestone: M2 (in progress) -> next independent review pass #1, then M3a decoder.

Decisions D1-D6 accepted as proposed (docs/DECISIONS.md).

Key facts:
- Chain 4663, Universal Router 0x8876...0904 (v2.1.1), Permit2 canonical.
- Simulation backend: eth_simulateV1 (debug_traceCall unavailable).
- No Chainlink sequencer uptime feed for 4663 (G2 -> UNKNOWN).
- USDG has Chainlink feed USDG/USD.
- Registry: registry/stock-tokens.json (195 entries, reproducible).

Code status:
- src: canonical, hash, evidence, types, schemas, receipt, verdict, session, gates g0-g6,g10.
- tests: 26+ passing; lint + secret scan clean.

Next actions:
1. Run review pass #1 (Prompt C) on gates/receipt.
2. Record at least 3 live fixtures.
3. Start M3a decoder pinned to router codehash.
