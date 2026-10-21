import { describe, it, expect } from 'vitest';
import { assessLending } from '../src/lending';

describe('lending', () => {
  it('safe', () => { expect(assessLending({ collateralValue: 100n, borrowedValue: 50n, ltvBps: 6000, liquidationThresholdBps: 7000, collateralFactorBps: 7500 }).safe).toBe(true); });
  it('unsafe', () => { expect(assessLending({ collateralValue: 100n, borrowedValue: 90n, ltvBps: 6000, liquidationThresholdBps: 7000, collateralFactorBps: 7500 }).safe).toBe(false); });
});
