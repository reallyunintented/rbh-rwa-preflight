export function g2Sequencer(input: { feedKnown: boolean; up: boolean; graceElapsed: boolean; sequencerAssurance?: 'strict' | 'degraded'; policyProvenanceHash?: string; signals?: { maxGapSec: number; headLagSec: number }; thresholds?: { maxGapSec: number; maxHeadLagSec: number }; }) {
  if (input.sequencerAssurance === 'degraded' && !input.feedKnown) {
    if (!input.policyProvenanceHash) return { gate: 'G2_SEQUENCER', status: 'UNKNOWN', reasons: ['SEQUENCER_UPTIME_UNAVAILABLE'], enforcement: 'none', details: {}, evidenceRefs: [] } as any;
    const signals = input.signals ?? { maxGapSec: 0, headLagSec: 0 };
    const thresholds = input.thresholds ?? { maxGapSec: 60, maxHeadLagSec: 30 };
    const clean = signals.maxGapSec <= thresholds.maxGapSec && signals.headLagSec <= thresholds.maxHeadLagSec;
    if (clean) return { gate: 'G2_SEQUENCER', status: 'PASS', reasons: [], enforcement: 'advisory', details: { degraded: true, signals }, evidenceRefs: [], limitations: ['SEQUENCER_DEGRADED_ASSURANCE'] } as any;
    return { gate: 'G2_SEQUENCER', status: 'FAIL_TRANSIENT', reasons: ['SEQUENCER_GAP_DETECTED'], enforcement: 'advisory', details: { degraded: true, signals }, evidenceRefs: [] } as any;
  }
  if (!input.feedKnown) return { gate: 'G2_SEQUENCER', status: 'UNKNOWN', reasons: ['SEQUENCER_UPTIME_UNAVAILABLE'], enforcement: 'none', details: {}, evidenceRefs: [] } as any;
  if (!input.up) return { gate: 'G2_SEQUENCER', status: 'FAIL_TRANSIENT', reasons: ['SEQUENCER_DOWN'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  if (!input.graceElapsed) return { gate: 'G2_SEQUENCER', status: 'FAIL_TRANSIENT', reasons: ['SEQUENCER_GRACE_PERIOD'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  return { gate: 'G2_SEQUENCER', status: 'PASS', reasons: [], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
}
