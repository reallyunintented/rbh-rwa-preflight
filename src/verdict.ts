import type { GateStatus, Verdict } from './types.js';

const KNOWN_STATUSES: ReadonlySet<string> = new Set<GateStatus>(['PASS', 'FAIL_HARD', 'FAIL_TRANSIENT', 'UNKNOWN', 'NOT_APPLICABLE']);

export function aggregate(gates: { status: string }[]): Verdict {
  if (gates.some((g) => !KNOWN_STATUSES.has(g.status))) return 'HUMAN_REVIEW';
  if (gates.some((g) => g.status === 'FAIL_HARD')) return 'BLOCKED';
  if (gates.some((g) => g.status === 'UNKNOWN')) return 'HUMAN_REVIEW';
  if (gates.some((g) => g.status === 'FAIL_TRANSIENT')) return 'DEFER';
  // READY requires the invariant: no READY without decoder + state-verified effects + resolved assumptions.
  // Callers must pass these via the gate set; an empty gate set is never READY.
  if (gates.length === 0) return 'HUMAN_REVIEW';
  return 'READY';
}

export function readyInvariant(input: { decoderOk: boolean; g8Pass: boolean; unresolvedAssumptions: number; }): boolean {
  return input.decoderOk && input.g8Pass && input.unresolvedAssumptions === 0;
}
