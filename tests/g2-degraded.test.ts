import { describe, it, expect } from 'vitest';
import { g2Sequencer } from '../src/gates/g2';

describe('G2 degraded', () => {
  it('degraded clean -> PASS', () => {
    const r = g2Sequencer({ feedKnown: false, up: false, graceElapsed: false, sequencerAssurance: 'degraded', signals: { maxGapSec: 10, headLagSec: 5 }, thresholds: { maxGapSec: 60, maxHeadLagSec: 30 } });
    expect(r.status).toBe('PASS');
  });
  it('degraded dirty -> FAIL_TRANSIENT', () => {
    const r = g2Sequencer({ feedKnown: false, up: false, graceElapsed: false, sequencerAssurance: 'degraded', signals: { maxGapSec: 100, headLagSec: 5 }, thresholds: { maxGapSec: 60, maxHeadLagSec: 30 } });
    expect(r.status).toBe('FAIL_TRANSIENT');
  });
});
