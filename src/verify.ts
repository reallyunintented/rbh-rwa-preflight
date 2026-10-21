import { verifyHashes } from './receipt';

export interface VerifyResult { level: number; result: 'PASS' | 'FAIL' | 'SKIPPED' | 'NOT_APPLICABLE'; }
export function verifyL1(receipt: any): VerifyResult {
  return { level: 1, result: verifyHashes(receipt) ? 'PASS' : 'FAIL' };
}
export function verifyL2(receipt: any): VerifyResult {
  if (!receipt.inputs || !receipt.evidence) return { level: 2, result: 'FAIL' };
  return { level: 2, result: verifyHashes(receipt) ? 'PASS' : 'FAIL' };
}
export async function verifyL3(receipt: any, rpcProvided: boolean, rpcUrl?: string): Promise<VerifyResult> {
  if (!rpcProvided || !rpcUrl) return { level: 3, result: 'SKIPPED' };
  const chain = receipt?.assessment?.chain ?? receipt?.chain;
  if (!chain?.blockNumber || !chain?.blockHash) return { level: 3, result: 'SKIPPED' };
  try {
    const res = await fetch(rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBlockByNumber', params: [chain.blockNumber, false] }) });
    const json = await res.json();
    if (json?.result?.hash === chain.blockHash) return { level: 3, result: 'PASS' };
    return { level: 3, result: 'FAIL' };
  } catch { return { level: 3, result: 'SKIPPED' }; }
}
export async function verify(receipt: any, levels: number[] = [1, 2], rpcProvided: boolean = false, rpcUrl?: string): Promise<VerifyResult[]> {
  const out: VerifyResult[] = [];
  for (const l of levels) {
    if (l === 1) out.push(verifyL1(receipt));
    else if (l === 2) out.push(verifyL2(receipt));
    else if (l === 3) out.push(await verifyL3(receipt, rpcProvided, rpcUrl));
    else out.push({ level: l, result: 'SKIPPED' });
  }
  return out;
}
