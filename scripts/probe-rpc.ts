import { writeFileSync, mkdirSync } from 'node:fs';
import { redactText } from '../src/redact';

const RPC = process.env.RHC_RPC_URL;
if (!RPC) { console.error('RHC_RPC_URL missing'); process.exit(1); }
const HOST = new URL(RPC).host;

async function rpc(method: string, params: any[] = []): Promise<any> {
  const res = await fetch(RPC!, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  return json;
}

const out: Record<string, any> = { host: HOST, capturedAt: new Date().toISOString() };

async function main() {
  out.chainId = await rpc('eth_chainId');
  out.clientVersion = await rpc('web3_clientVersion');
  out.blockNumber = await rpc('eth_blockNumber');

  for (const tag of ['latest', 'safe', 'finalized', 'earliest']) {
    out['block_' + tag] = await rpc('eth_getBlockByNumber', [tag, false]);
  }

  // eth_call state override probe
  out.eth_call_stateOverride = await rpc('eth_call', [
    { to: '0x0000000000000000000000000000000000000001', data: '0x' },
    'latest',
    { '0x0000000000000000000000000000000000000001': { balance: '0x1' } },
  ]);

  // debug_traceCall callTracer
  out.debug_traceCall_callTracer = await rpc('debug_traceCall', [
    { to: '0x0000000000000000000000000000000000000001', data: '0x' },
    'latest',
    { tracer: 'callTracer' },
  ]);

  // debug_traceCall prestateTracer diff
  out.debug_traceCall_prestateTracer = await rpc('debug_traceCall', [
    { to: '0x0000000000000000000000000000000000000001', data: '0x' },
    'latest',
    { tracer: 'prestateTracer', tracerConfig: { diffMode: true } },
  ]);

  // eth_simulateV1 probe
  out.eth_simulateV1 = await rpc('eth_simulateV1', [
    { blockStateCalls: [{ calls: [{ to: '0x0000000000000000000000000000000000000001', data: '0x' }] }] },
    'latest',
  ]);

  // eth_getLogs range probe
  const latest = parseInt(out.blockNumber.result, 16);
  out.eth_getLogs_1000 = await rpc('eth_getLogs', [{ fromBlock: '0x' + (latest - 1000).toString(16), toBlock: 'latest' }]);
  out.eth_getLogs_10000 = await rpc('eth_getLogs', [{ fromBlock: '0x' + (latest - 10000).toString(16), toBlock: 'latest' }]);

  // historical eth_call depth: 1h/1d/7d blocks approx (Arbitrum ~0.25s? Actually block time ~0.25s? We'll try offsets)
  const offsets = [3600, 86400, 604800]; // seconds; assume 1 block/sec? We'll compute by timestamp search later; here just try block numbers
  for (const sec of offsets) {
    const bn = latest - sec; // rough
    out['hist_eth_call_' + sec] = await rpc('eth_call', [
      { to: '0x0000000000000000000000000000000000000001', data: '0x' },
      '0x' + bn.toString(16),
    ]);
  }

  mkdirSync('docs/probes', { recursive: true });
  const redacted = JSON.parse(redactText(JSON.stringify(out)));
  writeFileSync('docs/probes/rpc-probe.json', JSON.stringify(redacted, null, 2));
  console.log('saved docs/probes/rpc-probe.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
