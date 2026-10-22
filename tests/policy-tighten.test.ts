import { describe, it, expect } from 'vitest';
import { validateTightening } from '../src/policy-tighten';

describe('policy tighten', () => {
  it('allows tightening', () => {
    const base = { maxSlippageBps: 100, requireIssuerSignals: false };
    const req = { maxSlippageBps: 50, requireIssuerSignals: true };
    expect(validateTightening(base, req).ok).toBe(true);
  });
  it('rejects loosening', () => {
    const base = { maxSlippageBps: 100 };
    const req = { maxSlippageBps: 200 };
    const r = validateTightening(base, req);
    expect(r.ok).toBe(false);
    expect(r.loosened).toContain('maxSlippageBps');
  });
});
