# DECISIONS.md

Proposals for D1-D6 (SPEC section 17), with evidence.

## D1 Issuer REST signals in v0.1
Proposal: Yes, as offchain-captured, required by default, excluded from L3. Evidence: REST unauthenticated, schema stable, cache headers present.

## D2 Supported pair/router
Proposal: USDG <-> registry Stock Token, single-hop exact-in via Universal Router 0x8876789976dEcBfCbBbe364623C63652db8C0904 (v2.1.1), pinned by codehash. Permit2 required.

## D3 Transaction envelope
Proposal: Single EOA transaction; missing prerequisite -> PREREQUISITE_MISSING. Defer smart accounts.

## D4 Simulation backend
Proposal: eth_simulateV1 (available; debug_traceCall unavailable). State exposure via sequential read calls in same simulated block + traceTransfers for native.

## D5 Default pinBlockTag / finality
Proposal: 'latest' (soft) with documented soft-confirmation risk; maxAssessmentAgeSec 30. Rationale: safe/finalized lag; historical depth limited.

## D6 Quote-asset valuation
Proposal: Limits in USDG units; USDG has Chainlink feed (O7 verified) so oracle basis possible, but default declared-peg allowed only if policy allows.

## M7 authorization (human checkpoint)
Decision: Pursue signed receipts (in-toto/DSSE, authorship level L4) and additional router decoder (SwapRouter02) after validation. Authorized. Evidence: validation checklist M6 accepted; signed receipts implemented in src/sign.ts and src/receipt.ts; decoder added in src/decoders/swap-router02.ts.

## D7 SwapRouter02 as distinct execution surface
Proposal: Support SwapRouter02 exactInputSingle (0xcaf681a66d020601342297493863e78c959e5cb2) as an additional decoder, pinned by deployed codehash 0x6f36c378e272c6324c48f045182bcb54bd8ad654cf9ebd42e8893d52c4cb25dc (fetched via eth_getCode, 2026-10-21). Kept out of READY until codehash pinned and tests pass. Evidence: on-chain code via RPC host rpc.mainnet.chain.robinhood.com.

## Scope expansion (M8/M9)
Decision: Move lending/collateral preflight and ERC-4337 smart-account support from non-goals to post-v0.1 milestones M8 and M9. Authorized as scope expansion. Evidence: user request; plan.md updated.

## A3b degraded assurance
Decision: Enable experimental degraded-mode PASS with conservative thresholds; observe-only by default. Evidence: user authorization on 2026-10-22.
