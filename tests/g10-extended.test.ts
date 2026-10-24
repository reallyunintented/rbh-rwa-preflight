import { describe, it, expect } from 'vitest';
import { g10Policy } from '../src/gates/g10';

describe('G10 extended policy checks (AUDIT F-05)', () => {
  it('decoded deadline 0 -> FAIL_HARD DEADLINE_MISSING', () => {
    const r = g10Policy({ tokenAllowed: true, recipientAllowed: true, minAmountOutZero: false, deadlineSec: 0 });
    expect(r.status).toBe('FAIL_HARD');
    expect(r.reasons).toEqual(['DEADLINE_MISSING']);
  });
  it('decoded deadline beyond maxDeadlineSec -> FAIL_HARD DEADLINE_TOO_FAR', () => {
    const r = g10Policy({ tokenAllowed: true, recipientAllowed: true, minAmountOutZero: false, deadlineSec: 9000, maxDeadlineSec: 300 });
    expect(r.reasons).toEqual(['DEADLINE_TOO_FAR']);
  });
  it('decoded deadline within policy -> no deadline reason', () => {
    const r = g10Policy({ tokenAllowed: true, recipientAllowed: true, minAmountOutZero: false, deadlineSec: 120, maxDeadlineSec: 300 });
    expect(r.status).toBe('PASS');
  });
  it('non-allowed pool -> FAIL_HARD POOL_NOT_ALLOWED', () => {
    expect(g10Policy({ tokenAllowed: true, recipientAllowed: true, minAmountOutZero: false, poolAllowed: false }).reasons).toEqual(['POOL_NOT_ALLOWED']);
  });
  it('fee above cap -> FAIL_HARD POOL_FEE_EXCEEDS_POLICY', () => {
    expect(g10Policy({ tokenAllowed: true, recipientAllowed: true, minAmountOutZero: false, poolFeeBps: 500, maxPoolFeeBps: 100 }).reasons).toEqual(['POOL_FEE_EXCEEDS_POLICY']);
  });
  it('notional above cap -> FAIL_HARD NOTIONAL_EXCEEDS_POLICY', () => {
    expect(g10Policy({ tokenAllowed: true, recipientAllowed: true, minAmountOutZero: false, notionalOk: false }).reasons).toEqual(['NOTIONAL_EXCEEDS_POLICY']);
  });
});
