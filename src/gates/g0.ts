export interface G0Input { chainId: number; rpcChainId: number; blockNumber: string; blockHash: string; blockTimestamp: number; pinBlockTag: string; }
export function g0Context(input: G0Input) {
  const mismatch = input.chainId !== input.rpcChainId;
  return { gate: 'G0_CONTEXT', status: mismatch ? 'FAIL_HARD' : 'PASS', reasons: mismatch ? ['RPC_INCONSISTENT'] : [], enforcement: 'advisory', details: { pinBlockTag: input.pinBlockTag }, evidenceRefs: [] } as any;
}
