import { assess } from './assess';
import { verify } from './verify';
import { MCP_TOOLS } from './mcp';

process.stdin.setEncoding('utf8');
let buf = '';
process.stdin.on('data', (c) => { buf += c; });
process.stdin.on('end', async () => {
  try {
    const req = JSON.parse(buf);
    if (req.method === 'tools/list') {
      process.stdout.write(JSON.stringify({ tools: MCP_TOOLS }) + '\n');
    } else if (req.method === 'preflight_assess') {
      const r = await assess(req.params);
      process.stdout.write(JSON.stringify(r) + '\n');
    } else if (req.method === 'preflight_verify') {
      const r = await verify(req.params.receipt, req.params.levels ?? [1, 2]);
      process.stdout.write(JSON.stringify(r) + '\n');
    } else {
      process.stdout.write(JSON.stringify({ error: 'unknown method' }) + '\n');
    }
  } catch (e: any) {
    process.stdout.write(JSON.stringify({ error: e?.message }) + '\n');
  }
});
