export function g9ExecutionQuality(input: { deviationBps: number; policyBps: number; minOutImpliedOk: boolean; }) {
  if (!input.minOutImpliedOk) return { gate: 'G9_EXECUTION_QUALITY', status: 'FAIL_HARD', reasons: ['SLIPPAGE_EXCEEDS_POLICY'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  if (input.deviationBps > input.policyBps) return { gate: 'G9_EXECUTION_QUALITY', status: 'FAIL_HARD', reasons: ['ORACLE_DEVIATION_EXCEEDS_POLICY'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  return { gate: 'G9_EXECUTION_QUALITY', status: 'PASS', reasons: [], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
}
