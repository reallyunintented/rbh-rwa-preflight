import { describe, it, expect } from 'vitest';
import { verify } from '../src/verify';
import { buildReceipt } from '../src/receipt';

describe('M8/M9 verify', () => {
  it('fails if G11 not PASS', async () => {
    const assessment: any = { schema: 'x', verdict: 'READY', reasons: [], chain: { chainId: 1, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1, finality: 'soft' }, validity: { pinnedAtBlockTimestamp: 1, maxAgeSec: 30 }, gates: [{ gate: 'G11_LENDING', status: 'FAIL_HARD' }], guarantees: { enforced: [], advisory: [], notAssessed: [] }, assumptions: [], limitations: ['x'], hashes: { inputs: '', evidence: '', assessment: '' } };
    const inputs: any = { action: {}, policy: {}, registrySlice: {}, calendarSlice: {}, decoders: [], libraryVersion: '0', schemaVersions: {} };
    const r = buildReceipt(assessment, inputs, []);
    const res = await verify(r, [2]);
    expect(res[0].result).toBe('FAIL');
  });
  it('passes if G11 PASS', async () => {
    const assessment: any = { schema: 'x', verdict: 'READY', reasons: [], chain: { chainId: 1, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1, finality: 'soft' }, validity: { pinnedAtBlockTimestamp: 1, maxAgeSec: 30 }, gates: [{ gate: 'G11_LENDING', status: 'PASS' }], guarantees: { enforced: [], advisory: [], notAssessed: [] }, assumptions: [], limitations: ['x'], hashes: { inputs: '', evidence: '', assessment: '' } };
    const inputs: any = { action: {}, policy: {}, registrySlice: {}, calendarSlice: {}, decoders: [], libraryVersion: '0', schemaVersions: {} };
    const r = buildReceipt(assessment, inputs, []);
    const res = await verify(r, [2]);
    expect(res[0].result).toBe('FAIL');
  });
});