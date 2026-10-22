# Drift list (docs vs code vs status)

## Known drift
1. SPEC.md says v0.2 draft and lists M0 items as to-do, but STATUS.md records M7 done and v0.2.0 released. Code is at v0.2.0 with M8/M9 scaffolds.
2. SPEC §3a lists lending and smart accounts as non-goals, but README lists them as optional modules and code has scaffolds.
3. STATUS.md says M8/M9 complete, but code is scaffold only.
4. SPEC v0.2 vs code uses v0.3 schema in assess (amendment proposes v0.3).
5. README "Known limitations" now states READY unreachable on mainnet (aligned with amendment).
6. Enhance docs propose Track A1/A2/A3a, but CLI/MCP policy provenance is only scaffold.
7. Secret-scan excludes dpp-main; directory is gitignored and removed from tracking.

## Resolution
- Update SPEC.md to v0.3 when amendment is adopted.
- Keep lending/smart accounts as experimental modules.
- Update STATUS.md to reflect scaffold status.
- Implement A1/A2 fully before claiming completion.
EOF