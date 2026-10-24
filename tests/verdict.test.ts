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

describe('gate-set completeness (F-02 remainder, tests-first vs a63c38a)', () => {
  const ALL_PASS = (ids: string[]) => ids.map((gate) => ({ gate, status: 'PASS' }));
  const INV_OK = { decoderOk: true, g8Pass: true, unresolvedAssumptions: 0 };
  const EXPECTED = ['G0_CONTEXT', 'G1_ASSET', 'G2_SEQUENCER', 'G3_ORACLE', 'G4_CORPORATE_ACTION', 'G5_ISSUER_SIGNALS', 'G6_VALUATION', 'G7_DECODE', 'G8_SIMULATION', 'G9_EXECUTION_QUALITY', 'G10_POLICY'];

  it('full expected set + all PASS + invariant -> READY', () => {
    expect(aggregate(ALL_PASS(EXPECTED), INV_OK, EXPECTED)).toBe('READY');
  });

  it('a missing expected gate must never pass (missing G7 => HUMAN_REVIEW, not READY)', () => {
    const incompleteIds = EXPECTED.filter((id) => id !== 'G7_DECODE');
    expect(aggregate(ALL_PASS(incompleteIds), INV_OK, EXPECTED)).toBe('HUMAN_REVIEW');
  });

  it('extra gates (G11/G12) beyond the expected set are tolerated', () => {
    const gates = [...ALL_PASS(EXPECTED), { gate: 'G11_LENDING', status: 'PASS' }, { gate: 'G12_SMART_ACCOUNT', status: 'PASS' }];
    expect(aggregate(gates, INV_OK, EXPECTED)).toBe('READY');
  });

  it('a FAIL subject still dominates (missing gate does not mask a hard fail)', () => {
    const gates = ALL_PASS(EXPECTED);
    gates[0].status = 'FAIL_HARD';
    expect(aggregate(gates, INV_OK, EXPECTED)).toBe('BLOCKED');
  });

  it('unknown gate id in the set (name typo) is treated as missing', () => {
    const gates = ALL_PASS(EXPECTED).map((g) => (g.gate === 'G7_DECODE' ? { gate: 'G7_DECODED', status: 'PASS' } : g));
    expect(aggregate(gates, INV_OK, EXPECTED)).toBe('HUMAN_REVIEW');
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
