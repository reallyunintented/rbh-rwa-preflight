import { describe, it, expect } from 'vitest';
import { g8Simulation } from '../src/gates/g8';

describe('G8', () => {
  it('unavailable', () => { expect(g8Simulation({ available: false, reverted: false, unexpectedBalance: false, unexpectedAllowance: false, prerequisiteMissing: false }).status).toBe('UNKNOWN'); });
  it('revert', () => { expect(g8Simulation({ available: true, reverted: true, unexpectedBalance: false, unexpectedAllowance: false, prerequisiteMissing: false }).status).toBe('FAIL_HARD'); });
  it('pass', () => { expect(g8Simulation({ available: true, reverted: false, unexpectedBalance: false, unexpectedAllowance: false, prerequisiteMissing: false }).status).toBe('PASS'); });
});
