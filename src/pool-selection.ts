export interface PoolCandidate {
  poolKey: string;
  feeBps: number;
  liquidity: bigint;
  hook: string;
}

export function selectCanonicalPool(candidates: PoolCandidate[], allowedHooks: string[] = []): PoolCandidate | null {
  const allowed = candidates.filter((c) => allowedHooks.length === 0 ? c.hook === '' : allowedHooks.includes(c.hook));
  if (allowed.length === 0) return null;
  // pick highest liquidity, then lowest fee
  return allowed.reduce((best, c) => {
    if (c.liquidity > best.liquidity) return c;
    if (c.liquidity === best.liquidity && c.feeBps < best.feeBps) return c;
    return best;
  });
}

export function quoteExactIn(pool: PoolCandidate, amountIn: bigint): { amountOut: bigint } {
  // simplified constant-product approximation
  if (pool.liquidity === 0n) return { amountOut: 0n };
  const fee = (amountIn * BigInt(pool.feeBps)) / 10000n;
  const amountInAfterFee = amountIn - fee;
  const amountOut = (amountInAfterFee * pool.liquidity) / (pool.liquidity + amountInAfterFee);
  return { amountOut };
}
