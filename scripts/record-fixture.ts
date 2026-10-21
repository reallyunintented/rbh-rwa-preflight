import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createPublicClient, http, defineChain, encodeFunctionData, decodeFunctionResult } from 'viem';

const RPC = process.env.RHC_RPC_URL!;
const chain = defineChain({ id: 4663, name: 'rhc', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [RPC] } } });
const client = createPublicClient({ chain, transport: http() });

const TOKEN_ABI = [
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
  { type: 'function', name: 'uiMultiplier', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'oraclePaused', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'newUIMultiplier', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'effectiveAt', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
] as const;

const FEED_ABI = [
  { type: 'function', name: 'latestRoundData', inputs: [], outputs: [
    { name: 'roundId', type: 'uint80' }, { name: 'answer', type: 'int256' },
    { name: 'startedAt', type: 'uint256' }, { name: 'updatedAt', type: 'uint256' },
    { name: 'answeredInRound', type: 'uint80' },
  ], stateMutability: 'view' },
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
] as const;

async function main() {
  const registry = JSON.parse(readFileSync('registry/stock-tokens.json', 'utf8'));
  const feeds = await (await fetch('https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json')).json();
  const bySymbol = new Map<string, any>();
  for (const f of feeds) {
    const m = String(f.name).match(/Robinhood\s+([A-Z0-9]+)\s*\/\s*USD/i) || String(f.name).match(/^([A-Z0-9]+)\s*\/\s*USD/i);
    if (m) bySymbol.set(m[1].toUpperCase(), f);
  }

  const symbols = ['AAPL', 'MSFT', 'NVDA'];
  mkdirSync('fixtures', { recursive: true });
  const blockNumber = await client.getBlockNumber();
  const block = await client.getBlock({ blockNumber });

  for (const sym of symbols) {
    const entry = registry.entries.find((e: any) => e.symbol === sym);
    if (!entry) { console.error('no registry entry', sym); continue; }
    const feed = bySymbol.get(sym);
    const token = entry.address as `0x${string}`;
    const decimals = await client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'decimals' });
    const uiMultiplier = await client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'uiMultiplier' });
    const oraclePaused = await client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'oraclePaused' });
    const newUIMultiplier = await client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'newUIMultiplier' });
    const effectiveAt = await client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'effectiveAt' });

    let feedData: any = null;
    if (feed) {
      const proxy = feed.proxyAddress as `0x${string}`;
      const rd = await client.readContract({ address: proxy, abi: FEED_ABI, functionName: 'latestRoundData' });
      const fdec = await client.readContract({ address: proxy, abi: FEED_ABI, functionName: 'decimals' });
      feedData = { proxyAddress: proxy, decimals: Number(fdec), roundId: rd[0].toString(), answer: rd[1].toString(), startedAt: rd[2].toString(), updatedAt: rd[3].toString(), answeredInRound: rd[4].toString(), heartbeat: feed.heartbeat };
    }

    const fixture = {
      synthetic: false,
      schema: 'rwa-preflight/fixture/v0.1',
      symbol: sym,
      recordedAtBlock: blockNumber.toString(),
      blockHash: block.hash,
      blockTimestamp: Number(block.timestamp),
      chainId: 4663,
      token: {
        address: token,
        decimals: Number(decimals),
        uiMultiplier: uiMultiplier.toString(),
        oraclePaused: Boolean(oraclePaused),
        newUIMultiplier: newUIMultiplier.toString(),
        effectiveAt: effectiveAt.toString(),
      },
      registryEntry: entry,
      feed: feedData,
      rest: {
        currentMultiplier: entry.currentMultiplier,
        tradingCapabilities: entry.tradingCapabilities,
      },
      recordedAtUnix: Math.floor(Date.now() / 1000),
    };
    writeFileSync(`fixtures/live-${sym}.json`, JSON.stringify(fixture, null, 2));
    console.log('wrote fixtures/live-' + sym + '.json');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });