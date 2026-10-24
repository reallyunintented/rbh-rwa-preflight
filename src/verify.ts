import { createHash } from 'node:crypto';
import { canonicalize } from './canonical';
import { verifyHashes } from './receipt';
import { ReplaySource } from './evidence';
import { assess } from './assess';

export interface VerifyResult { level: number; result: 'PASS' | 'FAIL' | 'SKIPPED' | 'NOT_APPLICABLE'; checked?: number; of?: number; }
export function verifyL1(receipt: any): VerifyResult {
  return { level: 1, result: verifyHashes(receipt) ? 'PASS' : 'FAIL' };
}
export async function verifyL2(receipt: any): Promise<VerifyResult> {
  if (!receipt?.inputs || !receipt?.evidence || !receipt?.assessment) return { level: 2, result: 'FAIL' };
  try {
    const src = new ReplaySource(receipt.evidence as any[]);
    const rebuilt = await assess({ source: src as any, action: receipt.inputs.action, policy: receipt.inputs.policy });
    const a = receipt.assessment;
    const b = (rebuilt as any).assessment;
    if (a?.verdict !== b?.verdict) return { level: 2, result: 'FAIL' };
    if (JSON.stringify(a?.reasons ?? []) !== JSON.stringify(b?.reasons ?? [])) return { level: 2, result: 'FAIL' };
    if (JSON.stringify(a?.gates ?? []) !== JSON.stringify(b?.gates ?? [])) return { level: 2, result: 'FAIL' };
    if (!verifyHashes(receipt)) return { level: 2, result: 'FAIL' };
    return { level: 2, result: 'PASS' };
  } catch {
    return { level: 2, result: 'FAIL' };
  }
}
export async function verifyL3(receipt: any, rpcProvided: boolean, rpcUrl?: string): Promise<VerifyResult> {
  if (!rpcProvided || !rpcUrl) return { level: 3, result: 'SKIPPED' };
  const chain = receipt?.assessment?.chain ?? receipt?.chain;
  if (!chain?.blockNumber || !chain?.blockHash) return { level: 3, result: 'SKIPPED' };
  const items = (receipt?.evidence ?? []).filter((e: any) => e?.source === 'rpc' && e?.class === 'onchain-reverifiable');
  if (!Array.isArray(receipt?.evidence) || items.length === 0) {
    // No onchain-reverifiable evidence to check: never claim success for unchecked evidence.
    return { level: 3, result: 'FAIL', checked: 0, of: 0 };
  }
  let checked = 0;
  for (const it of items) {
  try {
    const pp = receipt?.assessment?.policyProvenance;
    if (pp?.operatorPolicyHash) {
      const computed = createHash('sha256').update(canonicalize(receipt.inputs.policy)).digest('hex');
      if (computed !== pp.operatorPolicyHash) return { level: 2, result: 'FAIL' };
    }
      const res = await fetch(rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: (it.request as any)?.method, params: (it.request as any)?.params }) });
      const json = await res.json();
      if (json?.error) return { level: 3, result: 'FAIL', checked, of: items.length };
      if (json?.result === undefined || json?.result === null) return { level: 3, result: 'FAIL', checked, of: items.length };
      if (JSON.stringify(json.result) !== JSON.stringify(it.response)) return { level: 3, result: 'FAIL', checked, of: items.length };
      checked++;
    } catch {
      // Network/RPC exceptions mid-verification are failures, not skips.
      return { level: 3, result: 'FAIL', checked, of: items.length };
    }
  }
  return { level: 3, result: 'PASS', checked, of: items.length };
}
export async function verify(receipt: any, levels: number[] = [1, 2], rpcProvided: boolean = false, rpcUrl?: string): Promise<VerifyResult[]> {
  const out: VerifyResult[] = [];
  for (const l of levels) {
    if (l === 1) out.push(verifyL1(receipt));
    else if (l === 2) out.push(await verifyL2(receipt));
    else if (l === 3) out.push(await verifyL3(receipt, rpcProvided, rpcUrl));
    else out.push({ level: l, result: 'SKIPPED' });
  }
  return out;
}