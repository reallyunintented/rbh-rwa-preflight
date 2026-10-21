import { describe, it, expect } from 'vitest';
import { g0Context } from '../src/gates/g0';

describe('G0', () => {
  it('passes on matching chain', () => {
    const r = g0Context({ chainId: 4663, rpcChainId: 4663, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1, pinBlockTag: 'latest' });
    expect(r.status).toBe('PASS');
  });
  it('fails on mismatch', () => {
    const r = g0Context({ chainId: 4663, rpcChainId: 1, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1, pinBlockTag: 'latest' });
    expect(r.status).toBe('FAIL_HARD');
  });
});
