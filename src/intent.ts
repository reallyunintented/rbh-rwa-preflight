// Intent cross-check (S22): when the operator declares intent, verify it against
// the DECODED calldata. Any divergence — or an unparseable declared value — is a
// DECODE_MISMATCH (fail closed). Pure function: no I/O, no env, no clock.
export interface DecodedForIntent {
  tokenIn: string;
  tokenOut: string;
  recipient: string | null;
  minAmountOut: bigint | undefined;
  deadline: bigint | number | undefined;
}

function norm(v: unknown): string {
  return String(v).toLowerCase();
}

// Compare two amount-like values as bigints; unparseable -> null (caller decides).
function asBig(v: unknown): bigint | null {
  try {
    if (typeof v === 'bigint') return v;
    if (typeof v === 'number' && Number.isInteger(v)) return BigInt(v);
    if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) return BigInt(v.trim());
    return null;
  } catch {
    return null;
  }
}

export function intentDecodeMismatch(
  intent: Record<string, unknown> | undefined,
  decoded: DecodedForIntent | null,
  account: string,
): boolean {
  if (!intent || !decoded) return false;
  const mismatch = (b: boolean) => b;

  if (intent.tokenIn !== undefined && norm(intent.tokenIn) !== norm(decoded.tokenIn)) return true;
  if (intent.tokenOut !== undefined && norm(intent.tokenOut) !== norm(decoded.tokenOut)) return true;

  if (intent.minAmountOut !== undefined) {
    const declared = asBig(intent.minAmountOut);
    if (declared === null || decoded.minAmountOut === undefined || declared !== decoded.minAmountOut) return true;
  }

  if (intent.deadline !== undefined) {
    const declared = asBig(intent.deadline);
    if (declared === null || decoded.deadline === undefined || declared !== BigInt(decoded.deadline)) return true;
  }

  if (intent.recipient !== undefined) {
    // decoded.recipient null (decoder limitation, F-07): fall back to the account,
    // exactly as the simulator does. Anything not matching the fallback is a mismatch.
    const effective = decoded.recipient ?? account;
    if (norm(intent.recipient) !== norm(effective)) return mismatch(true);
  }

  return false;
}
