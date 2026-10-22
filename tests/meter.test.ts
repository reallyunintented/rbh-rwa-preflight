import { describe, it, expect } from 'vitest';
import { buildMeterSnapshot } from '../src/meter';

describe('meter', () => {
  it('builds snapshot with formulas', () => {
    const s = buildMeterSnapshot({
      request: { asset: 'AAPL', side: 'buy', sizeQuote: '100' },
      chain: { chainId: 4663, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1 },
      feedPriceWad: 100n * 10n ** 18n,
      uiMultiplier: 10n ** 18n,
      midPriceWad: 101n * 10n ** 18n,
      effectivePriceWad: 102n * 10n ** 18n,
    });
    expect(s.reference.sharePriceWad.value).toBe((100n * 10n ** 18n).toString());
    expect(s.venue.midPremiumBps.value).toBe('100');
  });
});
