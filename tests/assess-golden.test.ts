import { describe, it, expect } from 'vitest';
import { assess } from '../src/assess';

describe('assess golden', () => {
  it('returns a receipt with verdict and gates', async () => {
    const src: any = { async rpc(m: string) { return { response: m === 'eth_chainId' ? '0x1237' : m === 'eth_blockNumber' ? '0x1' : m === 'eth_getBlockByNumber' ? { hash: '0x0', timestamp: '0x1' } : m === 'eth_getCode' ? '0x' : null, error: undefined }; }, items: () => [] };
    const r: any = await assess({ source: src, action: { kind: 'swap_exact_in', chainId: 4663, account: '0x1111111111111111111111111111111111111111', tx: { to: '0x8876789976dEcBfCbBbe364623C63652db8C0904', data: '0x', value: '0x0' } }, policy: { maxSlippageBps: 100, maxOracleDeviationBps: 150, maxPoolFeeBps: 100, offSessionPolicy: 'defer', requireIssuerSignals: true, maxIssuerSignalAgeSec: 300, corporateActionLookaheadSec: 86400, corporateActionLookbackSec: 3600, maxDeadlineSec: 300, allowedRecipients: 'self', maxAssessmentAgeSec: 30, pinBlockTag: 'latest' } });
    expect(r.assessment.verdict).toBeDefined();
    expect(Array.isArray(r.assessment.gates)).toBe(true);
  });
});