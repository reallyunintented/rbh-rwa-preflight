# REVIEW-4: SwapRouter02 adversarial review

## Scope
src/decoders/swap-router02.ts, tests/swap-router02.test.ts, codehash source docs/probes/swap-router02-codehash.json.

## Findings
1. (minor) Decoder relies on caller-supplied routerCodehash/supportedCodehashes; pinning is external. Hidden mismatch could mark unknown codehash as supported only if caller lies. Mitigation: callers must pass on-chain codehash and registry slice; READY invariant requires known codehash.
2. (minor) sqrtPriceLimitX96 and deadline are not validated against policy here; policy checks occur in gates. Decoder extracts only.
3. (minor) No multi-hop or other selectors supported; any other selector returns TX_FORMAT_UNSUPPORTED.
4. No credential leakage: no URLs or keys in decoder/fixtures.

## Counterexamples
- Unknown codehash -> CODEHASH_UNKNOWN.
- Truncated calldata -> TX_FORMAT_UNSUPPORTED.
- Wrong selector -> TX_FORMAT_UNSUPPORTED.

## Missing scenarios
- Fuzz over random calldata (handled by decoder-fuzz style) not yet added for SwapRouter02.
EOF
echo done