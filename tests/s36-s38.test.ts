import { describe, it, expect } from 'vitest';
import { computeHeaderGaps } from '../src/sequencer-signals';
import { aggregate } from '../src/verdict';

describe('S36-S38', () => {
  it('S36 gap recorded, verdict unchanged', () => {
    const gaps = computeHeaderGaps([{ timestamp: 1 }, { timestamp: 100 }]);
    expect(gaps.maxGapSec).toBe(99);
    // verdict unchanged (HUMAN_REVIEW due to unknown sequencer)
    expect(aggregate([{ status: 'UNKNOWN' }], { decoderOk: false, g8Pass: false, unresolvedAssumptions: 1 })).toBe('HUMAN_REVIEW');
  });
  it('S37 clean + satisfied invariant -> READY (synthetic)', () => {
    expect(aggregate([{ status: 'PASS' }], { decoderOk: true, g8Pass: true, unresolvedAssumptions: 0 })).toBe('READY');
  });
  it('S38 gap within grace -> DEFER', () => {
    expect(aggregate([{ status: 'FAIL_TRANSIENT' }], { decoderOk: false, g8Pass: false, unresolvedAssumptions: 1 })).toBe('DEFER');
  });
});