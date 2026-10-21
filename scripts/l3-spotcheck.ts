import { writeFileSync } from 'node:fs';
import { assess } from '../src/assess';
import { verify } from '../src/verify';

const rpc = process.env.RHC_RPC_URL!;
console.log('rpc', rpc);
const action = { kind: 'swap_exact_in', chainId: 4663, account: '0x1111111111111111111111111111111111111111', tx: { to: '0x8876789976dEcBfCbBbe364623C63652db8C0904', data: '0x', value: '0x0' } };
const policy = { maxSlippageBps: 100, maxOracleDeviationBps: 150, maxPoolFeeBps: 100, offSessionPolicy: 'defer', requireIssuerSignals: true, maxIssuerSignalAgeSec: 300, corporateActionLookaheadSec: 86400, corporateActionLookbackSec: 3600, maxDeadlineSec: 300, allowedRecipients: 'self', maxAssessmentAgeSec: 30, pinBlockTag: 'latest' };
const receipt = await assess({ rpcUrl: rpc, action, policy });
console.log('blockNumber', receipt.assessment.chain.blockNumber, 'blockHash', receipt.assessment.chain.blockHash);
const res = await verify(receipt, [1, 2, 3], true, rpc);
writeFileSync('fixtures/l3-spotcheck.json', JSON.stringify(res, null, 2));
console.log(JSON.stringify(res));
