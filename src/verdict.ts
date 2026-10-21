export function aggregate(gates: { status: string }[]): string {
  if (gates.some((g) => g.status === 'FAIL_HARD')) return 'BLOCKED';
  if (gates.some((g) => g.status === 'UNKNOWN')) return 'HUMAN_REVIEW';
  if (gates.some((g) => g.status === 'FAIL_TRANSIENT')) return 'DEFER';
  return 'READY';
}

export function readyInvariant(input: { decoderOk: boolean; g8Pass: boolean; unresolvedAssumptions: number; }): boolean {
  return input.decoderOk && input.g8Pass && input.unresolvedAssumptions === 0;
}
