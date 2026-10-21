export interface G1Input { inRegistry: boolean; probeOk: boolean; pauseFlags: Record<string, boolean>; }
export function g1Asset(input: G1Input) {
  if (!input.inRegistry) return { gate: 'G1_ASSET', status: 'FAIL_HARD', reasons: ['ASSET_UNKNOWN'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (!input.probeOk) return { gate: 'G1_ASSET', status: 'FAIL_HARD', reasons: ['ASSET_INTERFACE_MISMATCH'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  const anyPaused = Object.values(input.pauseFlags).some(Boolean);
  if (anyPaused) return { gate: 'G1_ASSET', status: 'FAIL_TRANSIENT', reasons: ['PAUSE_FLAG_SET'], enforcement: 'advisory', details: { pauseFlags: input.pauseFlags }, evidenceRefs: [] } as any;
  return { gate: 'G1_ASSET', status: 'PASS', reasons: [], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
}
