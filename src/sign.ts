import { sign, verify, generateKeyPairSync, createPublicKey } from 'node:crypto';
import { canonicalize } from './canonical';

export function generateSigningKey() {
  return generateKeyPairSync('ed25519');
}

export function signReceipt(receipt: unknown, privateKey: any): { payload: string; signature: string; publicKey: string } {
  const payload = canonicalize(receipt);
  const signature = sign(null, Buffer.from(payload), privateKey).toString('base64');
  const publicKey = createPublicKey(privateKey);
  const pub = publicKey.export({ type: 'spki', format: 'pem' }) as string;
  return { payload, signature, publicKey: pub };
}

export function verifyReceiptSignature(signed: { payload: string; signature: string; publicKey: string }): boolean {
  try {
    return verify(null, Buffer.from(signed.payload), signed.publicKey, Buffer.from(signed.signature, 'base64'));
  } catch {
    return false;
  }
}