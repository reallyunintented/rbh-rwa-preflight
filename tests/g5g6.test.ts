import { describe, it, expect } from 'vitest';
import { g5Issuer } from '../src/gates/g5';
import { g6Valuation } from '../src/gates/g6';

describe('G5/G6', () => {
  it('G5 halt', () => { expect(g5Issuer({ halt: true, tradable: true, available: true, stale: false, multiplierMatch: true }).status).toBe('FAIL_TRANSIENT'); });
  it('G6 unresolved', () => { expect(g6Valuation({ quoteResolved: false }).status).toBe('UNKNOWN'); });
  it('G6 pass', () => { expect(g6Valuation({ quoteResolved: true }).status).toBe('PASS'); });
});
