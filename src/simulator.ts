export interface SimulationResult {
  available: boolean;
  reverted: boolean;
  unexpectedBalance: boolean;
  unexpectedAllowance: boolean;
  prerequisiteMissing: boolean;
}

export const UNAVAILABLE_SIMULATION: SimulationResult = {
  available: false,
  reverted: false,
  unexpectedBalance: false,
  unexpectedAllowance: false,
  prerequisiteMissing: false,
};

interface SimRpcSource {
  rpc(m: string, p: unknown[]): Promise<{ response?: unknown; error?: { message: string } }>;
}

export async function runSimulation(
  source: SimRpcSource,
  tx: { to: string; data: string; value: string },
  opts: { blockNumber: string; account: string },
): Promise<SimulationResult> {
  try {
    const item = await source.rpc('eth_simulateV1', [
      { blockStateCalls: [{ calls: [{ from: opts.account, to: tx.to, data: tx.data, value: tx.value }] }] },
      opts.blockNumber,
    ]);
    if (item.error || !item.response) return { ...UNAVAILABLE_SIMULATION };
    const res: any = item.response;
    const blocks = Array.isArray(res) ? res : [res];
    let reverted = false;
    let hasStateDiff = false;
    for (const b of blocks) {
      const calls = Array.isArray(b?.calls) ? b.calls : (Array.isArray(b?.result?.calls) ? b.result.calls : []);
      for (const c of calls) {
        if (c?.error || c?.status === '0x0' || c?.status === 0) reverted = true;
      }
      if (b?.stateDiff || b?.result?.stateDiff || b?.stateChanges) hasStateDiff = true;
    }
    if (reverted) return { available: false, reverted: true, unexpectedBalance: false, unexpectedAllowance: false, prerequisiteMissing: false };
    if (!hasStateDiff) return { ...UNAVAILABLE_SIMULATION };
    return { available: true, reverted: false, unexpectedBalance: false, unexpectedAllowance: false, prerequisiteMissing: false };
  } catch {
    return { ...UNAVAILABLE_SIMULATION };
  }
}
