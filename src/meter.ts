export type DisplayState = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'UNKNOWN' | 'NOT_ASSESSED';

export interface Sourced<T> {
  value: T | null;
  state: DisplayState;
  source: string;
  evidenceClass: 'onchain-reverifiable' | 'offchain-captured';
  ageSec: number | null;
  formulaId: string;
}

export interface MeterRequest {
  asset: string;
  side: 'buy' | 'sell';
  sizeQuote: string;
}

export interface MeterSnapshot {
  schema: 'rwa-meter/snapshot/v0.1';
  request: MeterRequest;
  chain: { chainId: number; blockNumber: string; blockHash: string; blockTimestamp: number };
  reference: {
    feedPriceWad: Sourced<string>;
    uiMultiplier: Sourced<string>;
    sharePriceWad: Sourced<string>;
    freshness: Sourced<string>;
  };
  venue: {
    midPriceWad: Sourced<string>;
    midPremiumBps: Sourced<string>;
    effectivePriceWad: Sourced<string>;
    effectiveAdverseBps: Sourced<string>;
    impactCurve: { sizeQuote: string; adverseBps: Sourced<string> }[];
  };
  limitations: string[];
  supply?: { recentMintBurn: Sourced<string> };
  hashes: { inputs: string; evidence: string; snapshot: string };
}

export function wadDiv(a: bigint, b: bigint): bigint {
  if (b === 0n) return 0n;
  return (a * 10n ** 18n) / b;
}

export function bps(a: bigint, b: bigint): bigint {
  if (b === 0n) return 0n;
  return (a * 10000n) / b;
}

export function buildMeterSnapshot(params: {
  request: MeterRequest;
  chain: { chainId: number; blockNumber: string; blockHash: string; blockTimestamp: number };
  feedPriceWad: bigint;
  uiMultiplier: bigint;
  midPriceWad: bigint;
  effectivePriceWad: bigint;
}): MeterSnapshot {
  const sharePrice = (params.feedPriceWad * 10n ** 18n) / (params.uiMultiplier === 0n ? 1n : params.uiMultiplier);
  const midPremium = bps(params.midPriceWad - sharePrice, sharePrice);
  const side = params.request.side;
  let adverse: bigint;
  if (side === 'buy') {
    adverse = bps(params.effectivePriceWad - sharePrice, sharePrice);
  } else {
    adverse = bps(sharePrice - params.effectivePriceWad, sharePrice);
  }
  const mkSourced = <T>(value: T, source: string): Sourced<T> => ({
    value,
    state: 'NORMAL',
    source,
    evidenceClass: 'onchain-reverifiable',
    ageSec: 0,
    formulaId: 'v0.1',
  });
  const snapshot: MeterSnapshot = {
    schema: 'rwa-meter/snapshot/v0.1',
    request: params.request,
    chain: params.chain,
    reference: {
      feedPriceWad: mkSourced(params.feedPriceWad.toString(), 'chainlink:feed'),
      uiMultiplier: mkSourced(params.uiMultiplier.toString(), 'rpc:token'),
      sharePriceWad: mkSourced(sharePrice.toString(), 'formula'),
      freshness: mkSourced('in-session-fresh', 'rpc:block'),
    },
    venue: {
      midPriceWad: mkSourced(params.midPriceWad.toString(), 'rpc:pool'),
      midPremiumBps: mkSourced(midPremium.toString(), 'formula'),
      effectivePriceWad: mkSourced(params.effectivePriceWad.toString(), 'rpc:quote'),
      effectiveAdverseBps: mkSourced(adverse.toString(), 'formula'),
      impactCurve: [
        { sizeQuote: (BigInt(params.request.sizeQuote) / 4n).toString(), adverseBps: mkSourced(adverse.toString(), 'formula') },
        { sizeQuote: params.request.sizeQuote, adverseBps: mkSourced(adverse.toString(), 'formula') },
        { sizeQuote: (BigInt(params.request.sizeQuote) * 4n).toString(), adverseBps: mkSourced(adverse.toString(), 'formula') },
      ],
    },
    limitations: ['informational only'],
    hashes: { inputs: '', evidence: '', snapshot: '' },
  };
  return snapshot;
}