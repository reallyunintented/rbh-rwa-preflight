export function g2Sequencer(input: { feedKnown: boolean; up: boolean; graceElapsed: boolean; }) {
  if (!input.feedKnown) return { gate: 'G2_SEQUENCER', status: 'UNKNOWN', reasons: ['SEQUENCER_UPTIME_UNAVAILABLE'], enforcement: 'none', details: {}, evidenceRefs: [] } as any;
  if (!input.up) return { gate: 'G2_SEQUENCER', status: 'FAIL_TRANSIENT', reasons: ['SEQUENCER_DOWN'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  if (!input.graceElapsed) return { gate: 'G2_SEQUENCER', status: 'FAIL_TRANSIENT', reasons: ['SEQUENCER_GRACE_PERIOD'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  return { gate: 'G2_SEQUENCER', status: 'PASS', reasons: [], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
}
