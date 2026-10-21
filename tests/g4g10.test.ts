import { describe, it, expect } from 'vitest';
import { g4CorporateAction } from '../src/gates/g4';
import { g10Policy } from '../src/gates/g10';

describe('G4/G10', () => {
  it('G4 pending', () => { expect(g4CorporateAction({ newMultiplier: 2n, currentMultiplier: 1n, effectiveAt: 100, now: 10, lookaheadSec: 200, lookbackSec: 10 }).status).toBe('FAIL_TRANSIENT'); });
  it('G10 token not allowed', () => { expect(g10Policy({ tokenAllowed: false, recipientAllowed: true, minAmountOutZero: false }).status).toBe('FAIL_HARD'); });
  it('G10 pass', () => { expect(g10Policy({ tokenAllowed: true, recipientAllowed: true, minAmountOutZero: false }).status).toBe('PASS'); });
});
