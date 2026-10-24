import { describe, it, expect } from 'vitest';
import { aggregate, readyInvariant } from '../src/verdict';

describe('verdict', () => {
  it('precedence', () => {
    expect(aggregate([{ status: 'FAIL_HARD' }, { status: 'UNKNOWN' }])).toBe('BLOCKED');
    expect(aggregate([{ status: 'UNKNOWN' }])).toBe('HUMAN_REVIEW');
    expect(aggregate([{ status: 'FAIL_TRANSIENT' }])).toBe('DEFER');
    expect(aggregate([{ status: 'PASS' }])).toBe('READY');
  });

  it('fail-closed normalization (AUDIT F-01)', () => {
    expect(aggregate([{ status: 'PASS ' }])).toBe('HUMAN_REVIEW'); // typo'd status
    expect(aggregate([{ status: 'pass' }])).toBe('HUMAN_REVIEW');
    expect(aggregate([{ status: 'SKIPPED' }])).toBe('HUMAN_REVIEW');
    expect(aggregate([{ status: undefined as any }])).toBe('HUMAN_REVIEW');
    expect(aggregate([])).toBe('HUMAN_REVIEW'); // no gates is never READY
  });
});

describe('ready invariant', () => {
  it('requires decoder + state + resolved assumptions', () => {
    expect(readyInvariant({ decoderOk: true, g8Pass: true, unresolvedAssumptions: 0 })).toBe(true);
    expect(readyInvariant({ decoderOk: false, g8Pass: true, unresolvedAssumptions: 0 })).toBe(false);
    expect(readyInvariant({ decoderOk: true, g8Pass: false, unresolvedAssumptions: 0 })).toBe(false);
    expect(readyInvariant({ decoderOk: true, g8Pass: true, unresolvedAssumptions: 1 })).toBe(false);
  });
});
