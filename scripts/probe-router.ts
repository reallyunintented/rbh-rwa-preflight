import { writeFileSync, mkdirSync } from 'node:fs';
import { redactText } from '../src/redact';

const RPC = process.env.RHC_RPC_URL;
if (!RPC) { console.error('RHC_RPC_URL missing'); process.exit(1); }
const HOST = new URL(RPC).host;

async function rpc(method: string, params: any[] = []): Promise<any> {
  const res = await fetch(RPC!, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  return res.json();
}

async function main() {
  const blockNumber = (await rpc('eth_blockNumber')).result;
  const code = await rpc('eth_getCode', ['0x8876789976dEcBfCbBbe364623C63652db8C0904', blockNumber]);
  const out = { host: HOST, blockNumber, bytecodeLength: (code.result ?? '').length };
  mkdirSync('docs/probes', { recursive: true });
  writeFileSync('docs/probes/router-codehash-probe.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
}
main();