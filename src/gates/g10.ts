export function g10Policy(input: { tokenAllowed: boolean; recipientAllowed: boolean; minAmountOutZero: boolean; decodeMismatch?: boolean; deadlineSec?: number; maxDeadlineSec?: number; poolAllowed?: boolean; poolFeeBps?: number; maxPoolFeeBps?: number; notionalOk?: boolean; }) {
  if (!input.tokenAllowed) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['TOKEN_NOT_ALLOWED'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (input.decodeMismatch) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['DECODE_MISMATCH'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (!input.recipientAllowed) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['RECIPIENT_NOT_ALLOWED'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (input.minAmountOutZero) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['SLIPPAGE_UNBOUNDED'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (input.deadlineSec !== undefined) {
    if (input.deadlineSec === 0) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['DEADLINE_MISSING'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
    if (input.maxDeadlineSec !== undefined && input.deadlineSec > input.maxDeadlineSec) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['DEADLINE_TOO_FAR'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  }
  if (input.poolAllowed === false) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['POOL_NOT_ALLOWED'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (input.poolFeeBps !== undefined && input.maxPoolFeeBps !== undefined && input.poolFeeBps > input.maxPoolFeeBps) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['POOL_FEE_EXCEEDS_POLICY'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (input.notionalOk === false) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['NOTIONAL_EXCEEDS_POLICY'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  return { gate: 'G10_POLICY', status: 'PASS', reasons: [], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
}