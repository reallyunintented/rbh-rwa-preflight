import { describe, it, expect } from 'vitest';
import { g1Asset } from '../src/gates/g1';

describe('G1', () => {
  it('unknown asset', () => { expect(g1Asset({ inRegistry: false, probeOk: true, pauseFlags: {} }).status).toBe('FAIL_HARD'); });
  it('pause flag', () => { expect(g1Asset({ inRegistry: true, probeOk: true, pauseFlags: { paused: true } }).status).toBe('FAIL_TRANSIENT'); });
  it('pass', () => { expect(g1Asset({ inRegistry: true, probeOk: true, pauseFlags: { paused: false } }).status).toBe('PASS'); });
});
