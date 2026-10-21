import { describe, it, expect } from 'vitest';
import { validateUserOp } from '../src/smart-account';

describe('smart account adversarial', () => {
  it('empty sender', () => { expect(validateUserOp({ sender: '', callData: '0x', nonce: 0n }).ok).toBe(false); });
  it('bad callData', () => { expect(validateUserOp({ sender: '0x' + '1'.repeat(40), callData: 'abc', nonce: 0n }).ok).toBe(false); });
  it('negative nonce', () => { expect(validateUserOp({ sender: '0x' + '1'.repeat(40), callData: '0x', nonce: -1n }).ok).toBe(false); });
});
