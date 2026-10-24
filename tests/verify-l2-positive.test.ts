import { describe, it, expect } from 'vitest';
import { verify, verifyL2 } from '../src/verify';
import { assess } from '../src/assess';
import { buildReceipt } from '../src/receipt';
import { hashValue } from '../src/hash';
import type { EvidenceItem, EvidenceSource } from '../src/evidence';

const stubResults: Record<string, unknown> = {
  'eth_chainId': '0x1237',
  'eth_blockNumber': '0x5a16b7b',
  'eth_getBlockByNumber': { hash: '0xblockhash', timestamp: '0x6908f000' },
  'eth_getCode': '0x',
};

function stubSource(): EvidenceSource {
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

const action = {
  kind: 'swap_exact_in' as const, chainId: 4663,
  account: '0x1111111111111111111111111111111111111111',
  tx: { to: '0x8876789976dEcBfCbBbe364623C63652db8C0904' as `0x${string}`, data: '0x' as `0x${string}`, value: '0x0' },
};

describe('verify L2 positive (AUDIT F-03)', () => {
  it('a legitimately built receipt re-derives: L2 PASS', async () => {
    const r = await assess({ source: stubSource(), action, policy: { maxSlippageBps:100, maxOracleDeviationBps:150, maxPoolFeeBps:100, offSessionPolicy:'defer', requireIssuerSignals:true, maxIssuerSignalAgeSec:300, corporateActionLookaheadSec:86400, corporateActionLookbackSec:3600, maxDeadlineSec:300, allowedRecipients:'self', maxAssessmentAgeSec:30, pinBlockTag:'latest' } as any });
    const res = await verifyL2(r as any);
    expect(res.result).toBe('PASS');
  });

  it('flipping a gate AND repairing hashes -> L1 PASS but L2 FAIL (rebuild mismatch)', async () => {
    const r = JSON.parse(JSON.stringify(await assess({ source: stubSource(), action, policy: { maxSlippageBps:100, maxOracleDeviationBps:150, maxPoolFeeBps:100, offSessionPolicy:'defer', requireIssuerSignals:true, maxIssuerSignalAgeSec:300, corporateActionLookaheadSec:86400, corporateActionLookbackSec:3600, maxDeadlineSec:300, allowedRecipients:'self', maxAssessmentAgeSec:30, pinBlockTag:'latest' } as any })));
    // mutate a FAIL_HARD gate to PASS, then recompute all hashes with the library itself
    const g1 = (r as any).assessment.gates.find((g: any) => g.gate === 'G1_ASSET');
    g1.status = 'PASS';
    const repaired = buildReceipt((r as any).assessment, (r as any).inputs, (r as any).evidence);
    const [l1, l2] = await verify(repaired, [1, 2]);
    expect(l1.result).toBe('PASS'); // integrity alone is not approval
    expect(l2.result).toBe('FAIL'); // re-derivation catches it
  });
});
