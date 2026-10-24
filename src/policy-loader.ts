import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { canonicalize } from './canonical.js';
import { redactText } from './redact.js';

const ENV_NAME_RE = /^[A-Z][A-Z0-9_]*POLICY.*$/;

export function loadOperatorPolicy(envName: string): { policy: any; hash: string } {
  if (!ENV_NAME_RE.test(envName)) throw new Error('POLICY_ENV_NAME_INVALID');
  const path = process.env[envName];
  if (!path) throw new Error('POLICY_FILE_ENV_MISSING');
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (e: any) {
    throw new Error(redactText(String(e?.message ?? e)));
  }
  let policy: any;
  try {
    policy = JSON.parse(raw);
  } catch (e: any) {
    throw new Error(redactText(String(e?.message ?? e)));
  }
  const hash = createHash('sha256').update(canonicalize(policy)).digest('hex');
  return { policy, hash };
}