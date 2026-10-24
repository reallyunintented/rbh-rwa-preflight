import { describe, it, expect } from 'vitest';
import { g10Policy } from '../src/gates/g10';

describe('G10 decode mismatch', () => {
  it('passes when no mismatch', () => {
    const r = g10Policy({ tokenAllowed: true, recipientAllowed: true, minAmountOutZero: false, decodeMismatch: false });
    expect(r.status).toBe('PASS');
  });
  it('FAIL_HARD on decode mismatch', () => {
    const r = g10Policy({ tokenAllowed: true, recipientAllowed: true, minAmountOutZero: false, decodeMismatch: true });
    expect(r.status).toBe('FAIL_HARD');
    expect(r.reasons).toContain('DECODE_MISMATCH');
  });
});