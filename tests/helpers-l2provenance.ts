// Shared stubs for the L2/provenance verification tests.
import type { EvidenceItem, EvidenceSource } from '../src/evidence';
import { hashValue } from '../src/hash';

export function policy() {
  return { maxSlippageBps: 100, maxOracleDeviationBps: 150, maxPoolFeeBps: 100, offSessionPolicy: 'defer', requireIssuerSignals: true, maxIssuerSignalAgeSec: 300, corporateActionLookaheadSec: 86400, corporateActionLookbackSec: 3600, maxDeadlineSec: 300, allowedRecipients: 'self', maxAssessmentAgeSec: 30, pinBlockTag: 'latest' };
}

const stubResults: Record<string, unknown> = {
  'eth_chainId': '0x1237',
  'eth_blockNumber': '0x5a16b7b',
  'eth_getBlockByNumber': { hash: '0xblockhash', timestamp: '0x6908f000' },
  'eth_getCode': '0x',
};

export function stubReceiptSource(): EvidenceSource {
  const items: EvidenceItem[] = [];
  return {
    async rpc(method, params) {
      const item: EvidenceItem = {
        id: hashValue({ source: 'rpc', method, params }),
        source: 'rpc', class: 'onchain-reverifiable',
        request: { method, params },
        response: stubResults[method] ?? null,
      };
      items.push(item);
      return item;
    },
    async http() { throw new Error('not used'); },
    items: () => [...items],
  };
}

export const action = {
  kind: 'swap_exact_in' as const, chainId: 4663,
  account: '0x1111111111111111111111111111111111111111',
  tx: { to: '0x8876789976dEcBfCbBbe364623C63652db8C0904' as `0x${string}`, data: '0x' as `0x${string}`, value: '0x0' },
};
