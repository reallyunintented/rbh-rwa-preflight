import { describe, it, expect } from 'vitest';
import { buildReceipt } from '../src/receipt';
import { verify } from '../src/verify';

describe('golden', () => {
  it('library verify deterministic', async () => {
    const assessment: any = { schema: 'x', verdict: 'READY', reasons: [], chain: { chainId: 1, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1, finality: 'soft' }, validity: { pinnedAtBlockTimestamp: 1, maxAgeSec: 30 }, gates: [], guarantees: { enforced: [], advisory: [], notAssessed: [] }, assumptions: [], limitations: ['x'], hashes: { inputs: '', evidence: '', assessment: '' } };
    const inputs: any = { action: {}, policy: {}, registrySlice: {}, calendarSlice: {}, decoders: [], libraryVersion: '0', schemaVersions: {} };
    const r = buildReceipt(assessment, inputs, []);
    const a = await verify(r, [1, 2]);
    const b = await verify(r, [1, 2]);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
