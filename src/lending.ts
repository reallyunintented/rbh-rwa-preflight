export interface LendingAssessmentInput {
  collateralValue: bigint;
  borrowedValue: bigint;
  ltvBps: number;
  liquidationThresholdBps: number;
  collateralFactorBps: number;
}

export function assessLending(input: LendingAssessmentInput): { safe: boolean; reason?: string } {
  if (input.collateralValue <= 0n) return { safe: false, reason: 'INVALID_COLLATERAL' };
  if (input.ltvBps > input.liquidationThresholdBps) return { safe: false, reason: 'LTV_EXCEEDS_THRESHOLD' };
  if (input.ltvBps > input.collateralFactorBps) return { safe: false, reason: 'LTV_EXCEEDS_COLLATERAL_FACTOR' };
  const ltv = (input.borrowedValue * 10000n) / input.collateralValue;
  if (Number(ltv) > input.ltvBps) return { safe: false, reason: 'LTV_EXCEEDS_POLICY' };
  return { safe: true };
}