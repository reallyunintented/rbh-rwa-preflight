import { describe, it, expect } from 'vitest';
import { buildReceipt, verifyHashes } from '../src/receipt';

describe('mutation', () => {
  it('detects single-byte tamper in assessment', () => {
    const assessment: any = { schema: 'x', verdict: 'READY', reasons: [], chain: { chainId: 1, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1, finality: 'soft' }, validity: { pinnedAtBlockTimestamp: 1, maxAgeSec: 30 }, gates: [], guarantees: { enforced: [], advisory: [], notAssessed: [] }, assumptions: [], limitations: ['x'], hashes: { inputs: '', evidence: '', assessment: '' } };
    const inputs: any = { action: {}, policy: {}, registrySlice: {}, calendarSlice: {}, decoders: [], libraryVersion: '0', schemaVersions: {} };
    const r = buildReceipt(assessment, inputs, []);
    // tamper verdict
    (r.assessment as any).verdict = 'BLOCKED';
    expect(verifyHashes(r)).toBe(false);
  });
});
