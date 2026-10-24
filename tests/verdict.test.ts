import { describe, it, expect } from 'vitest';
import { aggregate, readyInvariant } from '../src/verdict';

describe('verdict', () => {
  it('precedence', () => {
    const invBadFails = { decoderOk: false, g8Pass: false, unresolvedAssumptions: 1 };
    expect(aggregate([{ status: 'FAIL_HARD' }, { status: 'UNKNOWN' }], invBadFails)).toBe('BLOCKED');
    expect(aggregate([{ status: 'UNKNOWN' }], invBadFails)).toBe('HUMAN_REVIEW');
    expect(aggregate([{ status: 'FAIL_TRANSIENT' }], invBadFails)).toBe('DEFER');
    expect(aggregate([{ status: 'PASS' }], { decoderOk: true, g8Pass: true, unresolvedAssumptions: 0 })).toBe('READY');
  });

  it('readyInvariant is mandatory for READY (AUDIT F-02)', () => {
    // all-PASS gates without the invariant -> never READY
    expect(aggregate([{ status: 'PASS' }], { decoderOk: false, g8Pass: true, unresolvedAssumptions: 0 })).toBe('HUMAN_REVIEW');
    expect(aggregate([{ status: 'PASS' }], { decoderOk: true, g8Pass: false, unresolvedAssumptions: 0 })).toBe('HUMAN_REVIEW');
    expect(aggregate([{ status: 'PASS' }], { decoderOk: true, g8Pass: true, unresolvedAssumptions: 1 })).toBe('HUMAN_REVIEW');
  });

  it('fail-closed normalization (AUDIT F-01)', () => {
    const invBad = { decoderOk: false, g8Pass: false, unresolvedAssumptions: 1 };
    expect(aggregate([{ status: 'PASS ' }], invBad)).toBe('HUMAN_REVIEW'); // typo'd status
    expect(aggregate([{ status: 'pass' }], invBad)).toBe('HUMAN_REVIEW');
    expect(aggregate([{ status: 'SKIPPED' }], invBad)).toBe('HUMAN_REVIEW');
    expect(aggregate([{ status: undefined as any }], invBad)).toBe('HUMAN_REVIEW');
    expect(aggregate([], invBad)).toBe('HUMAN_REVIEW'); // no gates is never READY
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
