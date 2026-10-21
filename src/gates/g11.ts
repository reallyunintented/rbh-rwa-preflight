export function g11Lending(input: { safe: boolean }) {
  if (!input.safe) return { gate: 'G11_LENDING', status: 'FAIL_HARD', reasons: ['LTV_EXCEEDS_POLICY'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  return { gate: 'G11_LENDING', status: 'PASS', reasons: [], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
}