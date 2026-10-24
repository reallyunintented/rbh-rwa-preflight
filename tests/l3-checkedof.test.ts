import { describe, it, expect } from 'vitest';
import { verify, verifyL3 } from '../src/verify';

describe('L3 checked/of fence', () => {
  it('verifyL3 result includes checked and of', async () => {
    const receipt: any = { assessment: { chain: { blockNumber: '0x1', blockHash: '0x0' } }, evidence: [] };
    const r = await verifyL3(receipt, true, 'http://localhost');
    expect(r).toHaveProperty('checked');
    expect(r).toHaveProperty('of');
  });
  it('verify at level 3 returns checked/of', async () => {
    const receipt: any = { assessment: { chain: { blockNumber: '0x1', blockHash: '0x0' } }, evidence: [] };
    const res = await verify(receipt, [3], true, 'http://localhost');
    expect(res[0]).toHaveProperty('checked');
    expect(res[0]).toHaveProperty('of');
  });
});