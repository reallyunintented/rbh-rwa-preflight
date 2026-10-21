import { describe, it, expect } from 'vitest';
import { g2Sequencer } from '../src/gates/g2';
import { g3Oracle } from '../src/gates/g3';

describe('G2/G3', () => {
  it('G2 unknown', () => { expect(g2Sequencer({ feedKnown: false, up: true, graceElapsed: true }).status).toBe('UNKNOWN'); });
  it('G3 paused', () => { expect(g3Oracle({ paused: true, answer: 1n, updatedAt: 1, now: 2, heartbeatSec: 10, inSession: true }).status).toBe('FAIL_TRANSIENT'); });
  it('G3 pass', () => { expect(g3Oracle({ paused: false, answer: 1n, updatedAt: 10, now: 11, heartbeatSec: 10, inSession: true }).status).toBe('PASS'); });
});
