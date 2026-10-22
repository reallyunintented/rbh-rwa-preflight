export interface MeterSnapshot {
  schema: 'rwa-meter/snapshot/v0.1';
  asset: string;
  side: 'buy' | 'sell';
  sizeQuote: string;
  limitations: string[];
}

export function buildMeterSnapshot(asset: string, side: 'buy' | 'sell', sizeQuote: string): MeterSnapshot {
  return { schema: 'rwa-meter/snapshot/v0.1', asset, side, sizeQuote, limitations: ['informational only'] };
}