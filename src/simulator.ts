export interface SimResult { reverted: boolean; balanceChanges: Record<string, bigint>; allowanceChanges: Record<string, bigint>; logs: unknown[]; }
export interface Simulator { simulate(tx: { to: string; data: string; value: string }, account: string, blockNumber: string): Promise<SimResult>; }
