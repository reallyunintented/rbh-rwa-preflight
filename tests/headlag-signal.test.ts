import { describe, it, expect } from 'vitest';
import { headLagSignal } from '../src/sequencer-signals';

describe('headLagSignal', () => {
  it('negative lag detected', () => {
    const r = headLagSignal(100, 50);
    expect(r.negative).toBe(true);
    expect(r.lagSec).toBe(0);
  });
  it('non-negative lag', () => {
    const r = headLagSignal(50, 100);
    expect(r.negative).toBe(false);
    expect(r.lagSec).toBe(50);
  });
});