import { readFileSync } from 'node:fs';

export function loadOperatorPolicy(envName: string): { policy: any; hash: string } {
  const path = process.env[envName];
  if (!path) throw new Error('POLICY_FILE_ENV_MISSING');
  const raw = readFileSync(path, 'utf8');
  const policy = JSON.parse(raw);
  const hash = Buffer.from(raw).toString('base64');
  return { policy, hash };
}
