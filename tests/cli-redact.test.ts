import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

// S32-style regression test (AUDIT F-11): a credential-bearing URL must never reach
// stdout/stderr through an error message, in the CLI.
// Repro chain fixed by this test: --policy-env takes any env var NAME; if it points at
// a URL-valued variable (like RHC_RPC_URL), readFileSync throws ENOENT containing the
// full URL. The top-level catch must redact before printing.
const SECRET = 'SECRETKEYDOESNOTEXIST123';
const HOST_URL = `https://rpc.example.invalid/v3/${SECRET}`;

function spawnCli(args: string[]) {
  return spawnSync(
    process.execPath,
    [join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'), join(process.cwd(), 'src', 'cli.ts'), ...args],
    {
      encoding: 'utf8',
      timeout: 30000,
      env: { ...process.env, RHC_RPC_URL: HOST_URL },
    },
  );
}

import { join } from 'node:path';

describe('CLI credential redaction (S32, AUDIT F-11)', () => {
  it('verify with a URL-valued policy-env leaks no URL and no key', () => {
    const r = spawnCli(['verify', 'does-not-exist.json', '--policy-env', 'RHC_RPC_URL']);
    const out = (r.stdout ?? '') + (r.stderr ?? '');
    expect(out).not.toContain('https://');
    expect(out).not.toContain(SECRET);
  });
});
