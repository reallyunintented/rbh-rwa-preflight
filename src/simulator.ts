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
    // Conservative: without verified state-diff parsing, never claim availability.
    // Implementation of balance/allowance diff parsing is the remaining F-04 work.
    return { ...UNAVAILABLE_SIMULATION };
  } catch {
    return { ...UNAVAILABLE_SIMULATION };
  }
}
