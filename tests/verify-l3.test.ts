import { describe, it, expect, vi, afterEach } from 'vitest';
import { verifyL3 } from '../src/verify';

const receipt = (rpcEvidence: unknown[]) => ({
  assessment: { chain: { chainId: 4663, blockNumber: '0x5a16b7b', blockHash: '0xabc' } },
  evidence: rpcEvidence,
});

const rpcItem = (id: string, response: unknown) => ({
  id, source: 'rpc', class: 'onchain-reverifiable', atBlock: '0x5a16b7b',
  request: { method: 'eth_chainId', params: [] }, response,
});

describe('verifyL3 evidence iteration (AUDIT F-12)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('FAILs when the RPC answers with an error for an evidence item', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ jsonrpc: '2.0', error: { code: -32000, message: 'nope' } }) })) as any);
    const r = await verifyL3(receipt([rpcItem('e1', '0x1237')]) as any, true, 'http://localhost');
    expect(r.result).toBe('FAIL');
  });

  it('FAILs when the RPC returns a null/undefined result', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ jsonrpc: '2.0', result: null }) })) as any);
    const r = await verifyL3(receipt([rpcItem('e1', '0x1237')]) as any, true, 'http://localhost');
    expect(r.result).toBe('FAIL');
  });

  it('never counts an item before it has actually been verified', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ jsonrpc: '2.0', error: { code: -32000, message: 'nope' } }) })) as any, );
    const r = await verifyL3(receipt([rpcItem('e1', '0x1237')]) as any, true, 'http://localhost');
    if (r.result === 'PASS') throw new Error('L3 must never PASS on an errored item');
  });
});
