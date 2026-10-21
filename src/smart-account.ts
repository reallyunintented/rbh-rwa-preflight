export interface UserOperation {
  sender: string;
  callData: string;
  nonce: bigint;
}

export function validateUserOp(op: UserOperation): { ok: boolean; reason?: string } {
  if (!op.sender.startsWith('0x') || op.sender.length !== 42) return { ok: false, reason: 'INVALID_SENDER' };
  if (!op.callData.startsWith('0x')) return { ok: false, reason: 'INVALID_CALLDATA' };
  if (op.nonce < 0n) return { ok: false, reason: 'INVALID_NONCE' };
  return { ok: true };
}