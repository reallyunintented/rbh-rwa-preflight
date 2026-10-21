import { describe, it, expect } from 'vitest';
import { g9ExecutionQuality } from '../src/gates/g9';

describe('G9', () => {
  it('deviation exceeds', () => { expect(g9ExecutionQuality({ deviationBps: 200, policyBps: 150, minOutImpliedOk: true }).status).toBe('FAIL_HARD'); });
  it('pass', () => { expect(g9ExecutionQuality({ deviationBps: 100, policyBps: 150, minOutImpliedOk: true }).status).toBe('PASS'); });
});
