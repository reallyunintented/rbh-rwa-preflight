# FINDING-001: G2 behavior and READY reachability

## Summary
G2 in `src/gates/g2.ts` returns `UNKNOWN` when no sequencer feed is present. Verdict aggregation maps any `UNKNOWN` to `HUMAN_REVIEW`. Therefore, on chain 4663 (no supported Chainlink sequencer feed), READY is unreachable under strict mode.

## Classification
- Current behavior: feed unknown -> G2 UNKNOWN -> verdict HUMAN_REVIEW.
- This is the safe default and matches SPEC §8/§9.
- No bypass or PASS-without-feed found in code.

## Evidence
- `src/gates/g2.ts`: returns UNKNOWN when `feedKnown` is false.
- `src/verdict.ts`: `aggregate` returns HUMAN_REVIEW if any gate is UNKNOWN.
- `docs/CHAIN_FACTS.md`: O2 marked VERIFIED (none).
- RPC probe: no Chainlink sequencer feed address for 4663.

## Impact
- README "Known limitations" must state READY is unreachable on mainnet without a supported feed.
- G2 remains advisory; no change to READY invariant.

## Recommendation
- Keep strict behavior.
- Document in README and STATUS.
- Consider off-chain sequencer signal as advisory only (degraded mode) per AMENDMENT-001.
EOF