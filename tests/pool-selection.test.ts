import { describe, it, expect } from 'vitest';
import { selectCanonicalPool, quoteExactIn } from '../src/pool-selection';

describe('pool selection', () => {
  it('selects highest liquidity', () => {
    const pools = [
      { poolKey: 'a', feeBps: 30, liquidity: 100n, hook: '' },
      { poolKey: 'b', feeBps: 30, liquidity: 200n, hook: '' },
    ];
    expect(selectCanonicalPool(pools, [])?.poolKey).toBe('b');
  });
  it('returns null if no allowed hooks', () => {
    const pools = [{ poolKey: 'a', feeBps: 30, liquidity: 100n, hook: 'hook1' }];
    expect(selectCanonicalPool(pools, [])).toBeNull();
  });
  it('quote', () => {
    const pool = { poolKey: 'a', feeBps: 30, liquidity: 1000n, hook: '' };
    const q = quoteExactIn(pool, 100n);
    expect(q.amountOut).toBeGreaterThan(0n);
  });
});
