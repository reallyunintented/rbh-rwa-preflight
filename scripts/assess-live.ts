import { readFileSync } from 'node:fs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { assess } from '../src/assess';

const rpc = process.env.RHC_RPC_URL!;
const reg = JSON.parse(readFileSync('registry/stock-tokens.json', 'utf8'));
const picks = reg.entries.slice(0, 3);

mkdirSync('fixtures', { recursive: true });
for (const e of picks) {
  const action = {
    kind: 'swap_exact_in',
    chainId: 4663,
    account: '0x1111111111111111111111111111111111111111',
    tx: { to: '0x8876789976dEcBfCbBbe364623C63652db8C0904', data: '0x', value: '0x0' },
  };
  const policy = { maxSlippageBps: 100, maxOracleDeviationBps: 150, maxPoolFeeBps: 100, offSessionPolicy: 'defer', requireIssuerSignals: true, maxIssuerSignalAgeSec: 300, corporateActionLookaheadSec: 86400, corporateActionLookbackSec: 3600, maxDeadlineSec: 300, allowedRecipients: 'self', maxAssessmentAgeSec: 30, pinBlockTag: 'latest' };
  const receipt = await assess({ rpcUrl: rpc, action, policy });
  writeFileSync(`fixtures/live-${e.symbol}.json`, JSON.stringify(receipt, null, 2));
  console.log('wrote', e.symbol);
}
