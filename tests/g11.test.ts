import { describe, it, expect } from 'vitest';
import { g11Lending } from '../src/gates/g11';

describe('G11', () => {
  it('pass', () => { expect(g11Lending({ safe: true }).status).toBe('PASS'); });
  it('fail', () => { expect(g11Lending({ safe: false }).status).toBe('FAIL_HARD'); });
});
