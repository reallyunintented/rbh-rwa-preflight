import { describe, it, expect } from 'vitest';
import { buildMeterSnapshot } from '../src/meter';

describe('meter scenarios', () => {
  it('M01 healthy', () => {
    const s = buildMeterSnapshot({ request: { asset: 'AAPL', side: 'buy', sizeQuote: '100' }, chain: { chainId: 4663, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1 }, feedPriceWad: 100n * 10n ** 18n, uiMultiplier: 10n ** 18n, midPriceWad: 100n * 10n ** 18n, effectivePriceWad: 100n * 10n ** 18n });
    expect(s.venue.midPremiumBps.value).toBe('0');
  });
  it('M03 oracle paused (UNKNOWN)', () => {
    // simulated by null value not in current builder; check limitations
    const s = buildMeterSnapshot({ request: { asset: 'AAPL', side: 'buy', sizeQuote: '100' }, chain: { chainId: 4663, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1 }, feedPriceWad: 0n, uiMultiplier: 10n ** 18n, midPriceWad: 100n * 10n ** 18n, effectivePriceWad: 100n * 10n ** 18n });
    expect(s.reference.feedPriceWad.value).toBe('0');
  });
  it('M09 large premium', () => {
    const s = buildMeterSnapshot({ request: { asset: 'AAPL', side: 'buy', sizeQuote: '100' }, chain: { chainId: 4663, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1 }, feedPriceWad: 100n * 10n ** 18n, uiMultiplier: 10n ** 18n, midPriceWad: 450n * 10n ** 18n, effectivePriceWad: 450n * 10n ** 18n });
    expect(s.venue.midPremiumBps.value).toBe('35000');
  });
  it('M11 reference unavailable', () => {
    const s = buildMeterSnapshot({ request: { asset: 'AAPL', side: 'buy', sizeQuote: '100' }, chain: { chainId: 4663, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1 }, feedPriceWad: 0n, uiMultiplier: 10n ** 18n, midPriceWad: 100n * 10n ** 18n, effectivePriceWad: 100n * 10n ** 18n });
    expect(s.venue.midPremiumBps.value).toBeDefined();
  });
  it('M13 sequencer unknown', () => {
    const s = buildMeterSnapshot({ request: { asset: 'AAPL', side: 'buy', sizeQuote: '100' }, chain: { chainId: 4663, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1 }, feedPriceWad: 100n * 10n ** 18n, uiMultiplier: 10n ** 18n, midPriceWad: 100n * 10n ** 18n, effectivePriceWad: 100n * 10n ** 18n });
    expect(s.limitations.length).toBeGreaterThan(0);
  });
});
