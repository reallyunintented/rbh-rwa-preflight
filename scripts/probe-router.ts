// Probe the deployed Universal Router (O9, docs/CHAIN_FACTS.md) and record its
// codehash at a pinned block. Output is host-only (no URL, no credentials, per
// AGENTS.md).
// First-run usage: the router address comes from the named committed source
// docs/CHAIN_FACTS.md (fact O9, Uniswap deployment + on-chain probe). It is a CLI
// argument here precisely so it is never hand-typed inside src/ without provenance.
//   pnpm tsx scripts/probe-router.ts <addressFromCHAIN_FACTS-O9>
// Later runs reuse the recorded probe (arg optional).
import { keccak256, toHex } from 'viem';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';

const RPC = process.env.RHC_RPC_URL;
if (!RPC) { console.error('RHC_RPC_URL missing'); process.exit(1); }
const HOST = new URL(RPC).host;

async function rpc(method: string, params: any[] = []): Promise<any> {
  const res = await fetch(RPC!, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  return res.json();
}

async function main() {
  const probePath = 'docs/probes/router-codehash-probe.json';
  let address: string | null = process.argv[2] ?? null;
  if (!address && existsSync(probePath)) {
    try { address = JSON.parse(readFileSync(probePath, 'utf8')).address ?? null; } catch { address = null; }
  }
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error('router address required (from CHAIN_FACTS O9 source or existing probe); refusing to hand-type addresses');
  }
  const blockNumber = (await rpc('eth_blockNumber')).result as string;
  const code = await rpc('eth_getCode', [address, blockNumber]);
  const bytecode: string = code.result ?? '';
  const out = {
    host: HOST,
    address,
    method: 'eth_getCode',
    blockNumber,
    codehash: bytecode && bytecode !== '0x' ? (keccak256(toHex(bytecode as `0x${string}`)) as string) : null,
    bytecodeLength: bytecode.length,
    capturedAt: new Date().toISOString(),
  };
  mkdirSync('docs/probes', { recursive: true });
  writeFileSync(probePath, JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify(out));
}
main();
