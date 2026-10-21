export function g5Issuer(input: { halt: boolean; tradable: boolean; available: boolean; stale: boolean; multiplierMatch: boolean; }) {
  if (!input.available) return { gate: 'G5_ISSUER_SIGNALS', status: 'UNKNOWN', reasons: ['ISSUER_SIGNAL_UNAVAILABLE'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  if (input.stale) return { gate: 'G5_ISSUER_SIGNALS', status: 'UNKNOWN', reasons: ['ISSUER_SIGNAL_STALE'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  if (!input.multiplierMatch) return { gate: 'G5_ISSUER_SIGNALS', status: 'UNKNOWN', reasons: ['CA_STATE_INCONSISTENT'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  if (input.halt) return { gate: 'G5_ISSUER_SIGNALS', status: 'FAIL_TRANSIENT', reasons: ['ISSUER_HALT'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  if (!input.tradable) return { gate: 'G5_ISSUER_SIGNALS', status: 'FAIL_TRANSIENT', reasons: ['ASSET_NOT_TRADABLE'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  return { gate: 'G5_ISSUER_SIGNALS', status: 'PASS', reasons: [], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
}
