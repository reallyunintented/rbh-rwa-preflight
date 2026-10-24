import { describe, it, expect } from 'vitest';
import { buildReceipt } from '../src/receipt';

describe('money-number guard', () => {
  it('no money number in receipt fields', () => {
    const assessment: any = { schema: 'x', verdict: 'READY', reasons: [], chain: { chainId: 1, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1, finality: 'soft' }, validity: { pinnedAtBlockTimestamp: 1, maxAgeSec: 30 }, gates: [], guarantees: { enforced: [], advisory: [], notAssessed: [] }, assumptions: [], limitations: ['x'], hashes: { inputs: '', evidence: '', assessment: '' } };
    const inputs: any = { action: { tx: { value: '0x0' } }, policy: { maxNotionalQuote: '100' }, registrySlice: {}, calendarSlice: {}, decoders: [], libraryVersion: '0', schemaVersions: {} };
    const r: any = buildReceipt(assessment, inputs, []);
    const moneyKeys = /amount|value|price|notional|balance/i;
    function check(o: any) {
      if (o && typeof o === 'object') {
        for (const k of Object.keys(o)) {
          if (moneyKeys.test(k) && typeof o[k] === 'number') throw new Error('money number: ' + k);
          check(o[k]);
        }
      }
    }
    expect(() => check(r)).not.toThrow();
  });
});