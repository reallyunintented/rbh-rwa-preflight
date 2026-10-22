import { describe, it, expect } from 'vitest';
import { policyProvenance } from '../src/policy-provenance';

describe('policy provenance', () => {
  it('builds', () => {
    const p = policyProvenance('operator-file', 'abc', ['maxSlippageBps']);
    expect(p.source).toBe('operator-file');
    expect(p.overrides).toContain('maxSlippageBps');
  });
});
