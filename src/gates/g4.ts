export function g4CorporateAction(input: { newMultiplier: bigint; currentMultiplier: bigint; effectiveAt: number; now: number; lookaheadSec: number; lookbackSec: number; lastChangeUnix?: number; issuerMultiplier?: bigint; }) {
  if (input.issuerMultiplier !== undefined && input.issuerMultiplier !== input.currentMultiplier) {
    return { gate: 'G4_CORPORATE_ACTION', status: 'UNKNOWN', reasons: ['CA_STATE_INCONSISTENT'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  }
  if (input.newMultiplier !== input.currentMultiplier && input.effectiveAt > input.now && input.effectiveAt - input.now <= input.lookaheadSec) {
    return { gate: 'G4_CORPORATE_ACTION', status: 'FAIL_TRANSIENT', reasons: ['CA_PENDING'], enforcement: 'advisory', details: {}, evidenceRefs: [], retryAfterSec: input.effectiveAt - input.now } as any;
  }
  if (input.lastChangeUnix !== undefined && input.now - input.lastChangeUnix >= 0 && input.now - input.lastChangeUnix <= input.lookbackSec) {
    return { gate: 'G4_CORPORATE_ACTION', status: 'FAIL_TRANSIENT', reasons: ['CA_RECENT'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  }
  return { gate: 'G4_CORPORATE_ACTION', status: 'PASS', reasons: [], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
}
