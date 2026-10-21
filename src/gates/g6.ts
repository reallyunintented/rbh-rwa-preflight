export function g6Valuation(input: { quoteResolved: boolean; }) {
  if (!input.quoteResolved) return { gate: 'G6_VALUATION', status: 'UNKNOWN', reasons: ['ASSUMPTION_UNRESOLVED'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  return { gate: 'G6_VALUATION', status: 'PASS', reasons: [], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
}
