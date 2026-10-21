import { describe, it, expect } from 'vitest';
import { generateSigningKey, signReceipt, verifyReceiptSignature } from '../src/sign';

describe('sign', () => {
  it('signs and verifies', () => {
    const { privateKey } = generateSigningKey();
    const signed = signReceipt({ a: 1 }, privateKey);
    expect(verifyReceiptSignature(signed)).toBe(true);
  });
});