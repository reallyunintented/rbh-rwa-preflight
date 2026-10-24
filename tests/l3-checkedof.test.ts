import { describe, it, expect } from 'vitest';
import { verifyL3 } from '../src/verify';

describe('L3 checked/of fence', () => {
  it('result includes checked and of', async () => {
    const receipt: any = { assessment: { chain: { blockNumber: '0x1', blockHash: '0x0' } }, evidence: [] };
    const r = await verifyL3(receipt, true, 'http://localhost');
    expect(r).toHaveProperty('checked');
    expect(r).toHaveProperty('of');
  });
});