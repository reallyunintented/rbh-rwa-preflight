import { describe, it, expect, vi, afterEach } from 'vitest';
import { LiveSource } from '../src/evidence';

describe('live source', () => {
  afterEach(() => vi.restoreAllMocks());
  it('records rpc call', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ result: '0x1' }) })) as any);
    const src = new LiveSource('http://localhost');
    const item = await src.rpc('eth_chainId', []);
    expect((item as any).response).toBe('0x1');
    expect(src.items().length).toBe(1);
  });
});
