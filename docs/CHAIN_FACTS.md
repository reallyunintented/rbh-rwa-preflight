# CHAIN_FACTS.md

Date: 2026-10-21. Chain: Robinhood Chain mainnet, chain id 4663.

## F (SPEC section 5)
| ID | Status | Fact | Source |
|----|--------|------|--------|
| F1 | VERIFIED | One ERC-20 per ticker, ERC-8056 scaled UI; uiMultiplier() shares-per-token (wad). | on-chain probe (CRM token) + Robinhood docs |
| F2 | VERIFIED | Chainlink feed returns token price = underlying x multiplier (already adjusted). | https://docs.robinhood.com/chain/oracles-and-price-feeds/ |
| F3 | VERIFIED | sharePrice = feedPrice*1e18/uiMultiplier; share-equiv balance = balance*uiMultiplier/1e18. | same |
| F4 | VERIFIED | Token exposes oraclePaused(), newUIMultiplier(), effectiveAt(); emits UIMultiplierUpdated. | on-chain probe |
| F5 | ASSUMED | oraclePaused() advisory; staleness primary guard. | Robinhood docs (not independently tested) |
| F6 | ASSUMED | Feed freezes during split while paused. | Chainlink docs |
| F7 | ASSUMED | Feeds 24/5; off-hours hold last price, no heartbeats. | Chainlink docs |
| F8 | VERIFIED (gap) | No Chainlink L2 sequencer uptime feed published for 4663. | Chainlink docs + robinhood-chain-kit |
| F9 | VERIFIED | Chainlink supplies no corporate-action calendar. | Chainlink docs |
| F10 | VERIFIED | chain id 4663; Arbitrum Orbit/Nitro. | RPC eth_chainId = 0x1237 |
| F11 | VERIFIED | REST /prices is NOT multiplier-adjusted; apply currentMultiplier from /assets. | /prices sample: tokenBid/tokenAsk vs bid/ask |
| F12 | VERIFIED | Read-only REST under https://api.robinhood.com/rhj/: /assets, /prices/{symbol}, /corporate-actions. | live probe |
| F13 | VERIFIED | Finality stages: soft (sequencer), posted (L1 ordering), L1 finality ~13 min. | Uniswap/Arbitrum docs |

## O (open facts)
| ID | Status | Finding | Source |
|----|--------|---------|--------|
| O1 | VERIFIED (partial) | Feed proxies from Chainlink directory; 58 feeds. Heartbeats vary (e.g. 86400 for USDG). | reference-data-directory.vercel.app |
| O2 | VERIFIED (none) | No Chainlink sequencer uptime feed for 4663. Sequencer endpoint/WS exist but are offchain. | Chainlink docs |
| O3 | VERIFIED | eth_simulateV1 available and exposes state via sequential read calls; debug_traceCall NOT available. | RPC probe |
| O4 | VERIFIED (limited) | Historical eth_call works for ~1h only on public RPC; 1d/7d unavailable. | RPC probe |
| O5 | VERIFIED | newUIMultiplier()==uiMultiplier() when nothing staged; effectiveAt() can be past timestamp; flips not lazily observable (no staged update seen). | on-chain probe CRM |
| O6 | VERIFIED | latest/safe/finalized map to different blocks (safe/finalized lag latest); default pinBlockTag recommend 'latest' for soft? Decision pending. | RPC probe |
| O7 | VERIFIED | USDG has Chainlink feed USDG/USD (proxy 0x61B7...). | Chainlink directory |
| O8 | VERIFIED (partial) | REST unauthenticated; cache headers (CloudFront x-cache); timestamps generatedAt; no rate-limit headers observed. | live probe |
| O9 | VERIFIED | Universal Router 0x8876789976dEcBfCbBbe364623C63652db8C0904 (v2.1.1); extra field minHopPriceX36 per third party. Permit2 canonical. | Uniswap docs + on-chain codehash |
| O10 | ASSUMED | NYSE holiday calendar not yet sourced; tradingCapabilities from /assets. | - |
| O11 | VERIFIED (partial) | Confirmed pause flags: paused(), oraclePaused(). No other pause selectors responded. | on-chain probe |
| O12 | VERIFIED (partial) | Pool landscape not surveyed on-chain; third party reports many pools/extreme fees. | docs only |
