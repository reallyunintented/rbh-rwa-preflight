import { describe, it, expect } from 'vitest';
import { verify } from '../src/verify';
import { buildReceipt } from '../src/receipt';

describe('S40 old receipt verify', () => {
  it('v0.2 receipt verifies at L1/L2', async () => {
    const assessment: any = { schema: 'rwa-preflight/assessment/v0.2', verdict: 'READY', reasons: [], chain: { chainId: 1, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1, finality: 'soft' }, validity: { pinnedAtBlockTimestamp: 1, maxAgeSec: 30 }, gates: [], guarantees: { enforced: [], advisory: [], notAssessed: [] }, assumptions: [], limitations: ['x'], hashes: { inputs: '', evidence: '', assessment: '' } };
    const inputs: any = { action: {}, policy: {}, registrySlice: {}, calendarSlice: {}, decoders: [], libraryVersion: '0', schemaVersions: {} };
    const r = buildReceipt(assessment, inputs, []);
    const res = await verify(r, [1, 2]);
    expect(res[0].result).toBe('PASS');
    expect(res[1].result).toBe('FAIL');
  });
});
