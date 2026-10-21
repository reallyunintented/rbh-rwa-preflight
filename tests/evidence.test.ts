import { describe, it, expect } from 'vitest';
import { ReplaySource } from '../src/evidence';
import { hashValue } from '../src/hash';

describe('replay', () => {
  it('throws on missing evidence', async () => {
    const src = new ReplaySource([]);
    await expect(src.rpc('eth_chainId', [])).rejects.toThrow('EVIDENCE_INCOMPLETE');
  });
});
