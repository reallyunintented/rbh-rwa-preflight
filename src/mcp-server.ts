import { assess } from './assess';
import { loadOperatorPolicy } from './policy-loader';
import { validateTightening } from './policy-tighten';
import { buildMeterSnapshot } from './meter';
import { verify } from './verify';
import { MCP_TOOLS } from './mcp';
import { redactText } from './redact';

process.stdin.setEncoding('utf8');
let buf = '';
process.stdin.on('data', (c) => { buf += c; });
process.stdin.on('end', async () => {
  try {
    const req = JSON.parse(buf);
    if (req.method === 'tools/list') {
      process.stdout.write(JSON.stringify({ tools: MCP_TOOLS }) + '\n');
    } else if (req.method === 'preflight_assess') {
      let policyProvenance: any;
      if (req.params?.policyEnv) {
        const { hash } = loadOperatorPolicy(req.params.policyEnv);
        policyProvenance = { source: 'operator-file', operatorPolicyHash: hash, overrides: [] };
      }
      const r = await assess({ ...req.params, policyProvenance });
      process.stdout.write(JSON.stringify(r) + '\n');
    } else if (req.method === 'meter_snapshot') {
      const snap = buildMeterSnapshot({ request: { asset: req.params?.asset ?? 'AAPL', side: req.params?.side ?? 'buy', sizeQuote: req.params?.size ?? '100' }, chain: { chainId: 4663, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1 }, feedPriceWad: 100n * 10n ** 18n, uiMultiplier: 10n ** 18n, midPriceWad: 101n * 10n ** 18n, effectivePriceWad: 102n * 10n ** 18n });
      process.stdout.write(JSON.stringify(snap) + '\n');
    } else if (req.method === 'preflight_verify') {
      const r = await verify(req.params.receipt, req.params.levels ?? [1, 2]);
      process.stdout.write(JSON.stringify(r) + '\n');
    } else {
      process.stdout.write(JSON.stringify({ error: 'unknown method' }) + '\n');
    }
  } catch (e: any) {
    process.stdout.write(JSON.stringify({ error: redactText(String(e?.message ?? e)) }) + '\n');
  }
});
