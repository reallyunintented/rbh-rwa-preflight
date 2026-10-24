import { describe, it, expect } from 'vitest';
import { assess } from '../src/assess';

describe('money-number guard (real receipt)', () => {
  it('no money number in receipt fields', async () => {
    const src: any = { async rpc(m: string) { return { response: m === 'eth_chainId' ? '0x1237' : m === 'eth_blockNumber' ? '0x1' : m === 'eth_getBlockByNumber' ? { hash: '0x0', timestamp: '0x1' } : m === 'eth_getCode' ? '0x' : null, error: undefined }; }, items: () => [] };
    const r: any = await assess({ source: src, action: { kind: 'swap_exact_in', chainId: 4663, account: '0x1111111111111111111111111111111111111111', tx: { to: '0x8876789976dEcBfCbBbe364623C63652db8C0904', data: '0x', value: '0x0' } }, policy: { maxSlippageBps: 100, maxOracleDeviationBps: 150, maxPoolFeeBps: 100, offSessionPolicy: 'defer', requireIssuerSignals: true, maxIssuerSignalAgeSec: 300, corporateActionLookaheadSec: 86400, corporateActionLookbackSec: 3600, maxDeadlineSec: 300, allowedRecipients: 'self', maxAssessmentAgeSec: 30, pinBlockTag: 'latest' } });
    const moneyKeys = /amount|value|price|notional|balance/i;
    function check(o: any, path = '') {
      if (o && typeof o === 'object') {
        for (const k of Object.keys(o)) {
          if (moneyKeys.test(k) && typeof o[k] === 'number') throw new Error('money number at ' + path + k);
          check(o[k], path + k + '.');
        }
      }
    }
    expect(() => check(r)).not.toThrow();
  });
});