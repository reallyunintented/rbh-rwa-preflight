import { describe, it, expect } from 'vitest';
import { assessLending } from '../src/lending';

describe('lending adversarial', () => {
  it('zero collateral', () => { expect(assessLending({ collateralValue: 0n, borrowedValue: 1n, ltvBps: 5000, liquidationThresholdBps: 6000, collateralFactorBps: 7000 }).safe).toBe(false); });
  it('ltv exceeds threshold', () => { expect(assessLending({ collateralValue: 100n, borrowedValue: 10n, ltvBps: 8000, liquidationThresholdBps: 7000, collateralFactorBps: 7500 }).safe).toBe(false); });
  it('ltv exceeds collateral factor', () => { expect(assessLending({ collateralValue: 100n, borrowedValue: 10n, ltvBps: 7600, liquidationThresholdBps: 8000, collateralFactorBps: 7500 }).safe).toBe(false);   });
});