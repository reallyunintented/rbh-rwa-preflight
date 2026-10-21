import { describe, it, expect } from 'vitest';
import { validateUserOp } from '../src/smart-account';

const sender = '0x' + '1'.repeat(40);
describe('smart account', () => {
  it('valid', () => { expect(validateUserOp({ sender, callData: '0x', nonce: 1n }).ok).toBe(true); });
  it('invalid', () => { expect(validateUserOp({ sender: 'x', callData: '0x', nonce: 1n }).ok).toBe(false); });
});
