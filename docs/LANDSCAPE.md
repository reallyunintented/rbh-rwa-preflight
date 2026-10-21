# LANDSCAPE.md

Re-check of tools named in SPEC section 3 (2026-10-21). Licence notes from public repos.

| Tool | Does it decode caller calldata? | Simulate state effects? | Replayable/tamper-evident evidence? | Licence |
|------|-------------------------------|------------------------|-------------------------------------|---------|
| Collar Guardrail | Unknown (hosted MCP) | Yes (oracle/slippage) | No (hosted, no receipt) | proprietary/hosted |
| KeeperHub Robinhood plugin | Partial (swap action) | Yes | No | unknown |
| rob-mcp | No (data only) | No | Provenance on results (not full receipt) | unknown |
| rhc-mcp | Swap quotes/execution | Yes | No | unknown |
| zerouter MCP | Quote guardrail | No | No | unknown |
| Arcus gateway | No (data) | No | No | unknown |
| hoodchain SDK | SDK helpers | No | No | unknown |
| Rialto swap-preflight MCP | Partial | Yes | No | unknown |

Conclusion: no tool found offers replayable, tamper-evident, calldata-decoded verdicts. Proceed.
