export function g10Policy(input: { tokenAllowed: boolean; recipientAllowed: boolean; minAmountOutZero: boolean; }) {
  if (!input.tokenAllowed) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['TOKEN_NOT_ALLOWED'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (!input.recipientAllowed) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['RECIPIENT_NOT_ALLOWED'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (input.minAmountOutZero) return { gate: 'G10_POLICY', status: 'FAIL_HARD', reasons: ['SLIPPAGE_UNBOUNDED'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  return { gate: 'G10_POLICY', status: 'PASS', reasons: [], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
}
