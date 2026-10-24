import { describe, it, expect } from 'vitest';
import { intentDecodeMismatch } from '../src/intent';

const DEC = {
  tokenIn: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  tokenOut: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  recipient: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
  amountIn: 1000n,
  minAmountOut: 900n,
  deadline: 1234n as unknown as number,
};
const ACCT = '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD';

describe('intent cross-check -> DECODE_MISMATCH (S22, tests-first vs a63c38a inline logic)', () => {
  it('no intent or no decoded swap: no mismatch (nothing to cross-check)', () => {
    expect(intentDecodeMismatch(undefined, DEC, ACCT)).toBe(false);
    expect(intentDecodeMismatch(undefined, null, ACCT)).toBe(false);
    expect(intentDecodeMismatch({ tokenIn: '0xX' }, null, ACCT)).toBe(false);
  });

  it('matching intent (case-insensitive) -> no mismatch', () => {
    expect(intentDecodeMismatch({
      tokenIn: DEC.tokenIn.toUpperCase(),
      tokenOut: DEC.tokenOut,
      minAmountOut: '900',
      recipient: DEC.recipient,
      deadline: '1234',
    }, DEC, ACCT)).toBe(false);
  });

  it('token divergence -> mismatch', () => {
    expect(intentDecodeMismatch({ tokenIn: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE' }, DEC, ACCT)).toBe(true);
    expect(intentDecodeMismatch({ tokenOut: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE' }, DEC, ACCT)).toBe(true);
  });

  it('amount/minOut divergence -> mismatch', () => {
    expect(intentDecodeMismatch({ minAmountOut: '899' }, DEC, ACCT)).toBe(true);
  });

  it('MALFORMED intent numbers must produce a mismatch, never throw (a63c38a would crash on BigInt/Number)', () => {
    expect(() => intentDecodeMismatch({ minAmountOut: 'not-a-number' }, DEC, ACCT)).not.toThrow();
    expect(intentDecodeMismatch({ minAmountOut: 'not-a-number' }, DEC, ACCT)).toBe(true);
    expect(intentDecodeMismatch({ deadline: { a: 1 } as any }, DEC, ACCT)).toBe(true);
  });

  it('deadline compared as bigint, no float precision loss (a63c38a used Number())', () => {
    // 2^53+1 loses precision through Number(); bigint compare must catch it
    const big = (2n ** 53n + 1n).toString();
    expect(intentDecodeMismatch({ deadline: big }, { ...DEC, deadline: 2n ** 53n + 1n as unknown as number }, ACCT)).toBe(false);
    expect(intentDecodeMismatch({ deadline: big }, { ...DEC, deadline: 2n ** 53n + 2n as unknown as number }, ACCT)).toBe(true);
  });

  it('intent deadline present but decoder found none -> cannot confirm -> mismatch', () => {
    expect(intentDecodeMismatch({ deadline: '1234' }, { ...DEC, deadline: undefined }, ACCT)).toBe(true);
  });

  it('intent recipient != effective recipient -> mismatch; fallback (decoded recipient null) compares against account', () => {
    expect(intentDecodeMismatch({ recipient: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE' }, DEC, ACCT)).toBe(true);
    expect(intentDecodeMismatch({ recipient: ACCT }, { ...DEC, recipient: null as any }, ACCT)).toBe(false);
    expect(intentDecodeMismatch({ recipient: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE' }, { ...DEC, recipient: null as any }, ACCT)).toBe(true);
  });
});
