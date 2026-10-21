import { writeFileSync } from 'node:fs';
import { createPublicClient, http, defineChain } from 'viem';

const RPC = process.env.RHC_RPC_URL!;
const chain = defineChain({ id: 4663, name: 'rhc', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [RPC] } } });
const client = createPublicClient({ chain, transport: http() });

async function main() {
  const assetsRes = await fetch('https://api.robinhood.com/rhj/assets');
  const assetsJson: any = await assetsRes.json();
  const dirRes = await fetch('https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json');
  const dirJson: any = await dirRes.json();
  const feeds = (Array.isArray(dirJson) ? dirJson : Object.values(dirJson).flat()) as any[];
  const blockNumber = await client.getBlockNumber();

  const entries: any[] = [];
  for (const a of assetsJson.assets || []) {
    const dep = (a.deployments || []).find((d: any) => d.chainId === 4663);
    if (!dep) continue;
    const addr = dep.contractAddress as `0x${string}`;
    let decimals: any, ui: any, paused: any;
    try {
      decimals = await client.readContract({ address: addr, abi: [{ type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' }], functionName: 'decimals' });
      ui = await client.readContract({ address: addr, abi: [{ type: 'function', name: 'uiMultiplier', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }], functionName: 'uiMultiplier' });
      paused = await client.readContract({ address: addr, abi: [{ type: 'function', name: 'oraclePaused', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' }], functionName: 'oraclePaused' });
    } catch (e) {
      decimals = null; ui = null; paused = null;
    }
    const feed = feeds.find((f: any) => (f.name || '').toUpperCase().startsWith((a.tokenSymbol || '').toUpperCase()));
    entries.push({
      symbol: a.tokenSymbol,
      name: a.tokenName,
      address: addr,
      decimals: Number(decimals),
      uiMultiplier: ui?.toString() ?? null,
      oraclePaused: paused,
      currentMultiplier: a.currentMultiplier,
      tradingCapabilities: a.tradingCapabilities,
      feed: feed ? { name: feed.name, proxyAddress: feed.proxyAddress, heartbeat: feed.heartbeat, decimals: feed.decimalPlaces } : null,
      source: 'https://api.robinhood.com/rhj/assets + https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json + on-chain probe',
    });
  }
  entries.sort((x, y) => String(x.symbol).localeCompare(String(y.symbol)));
  const registry = {
    schema: 'rwa-preflight/registry/v0.1',
    chainId: 4663,
    verifiedAtBlock: blockNumber.toString(),
    generatedAt: new Date().toISOString(),
    sources: ['https://api.robinhood.com/rhj/assets', 'https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json', 'on-chain probe'],
    entries,
  };
  writeFileSync('registry/stock-tokens.json', JSON.stringify(registry, null, 2));
  console.log('wrote', entries.length, 'entries at block', blockNumber);
}

main().catch((e) => { console.error(e); process.exit(1); });
