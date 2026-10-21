import { createHash } from 'node:crypto';
import { canonicalize } from './canonical.js';

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function hashValue(value: unknown): string {
  return sha256Hex(canonicalize(value));
}
