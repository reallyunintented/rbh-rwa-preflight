import { describe, it, expect } from 'vitest';
import { g2Sequencer } from '../src/gates/g2';

describe('S33-S35', () => {
  it('S33 no source strict -> UNKNOWN', () => {
    expect(g2Sequencer({ feedKnown: false, up: false, graceElapsed: false }).status).toBe('UNKNOWN');
  });
  it('S34 zero feed never PASS', () => {
    // simulated by feedKnown false
    expect(g2Sequencer({ feedKnown: false, up: true, graceElapsed: true }).status).toBe('UNKNOWN');
  });
  it('S35 synthetic feed up -> PASS', () => {
    expect(g2Sequencer({ feedKnown: true, up: true, graceElapsed: true }).status).toBe('PASS');
  });
});
