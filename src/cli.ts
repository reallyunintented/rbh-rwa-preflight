import { readFileSync } from 'node:fs';
import { verify } from './verify';
import { assess } from './assess';
import { loadOperatorPolicy } from './policy-loader';

(async () => {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (cmd === 'verify') {
    const file = args[1];
    const policyEnvIndex = args.indexOf('--policy-env');
    let policyProvenance: any;
    if (policyEnvIndex !== -1) {
      const envName = args[policyEnvIndex + 1];
      const { hash } = loadOperatorPolicy(envName);
      policyProvenance = { source: 'operator-file', operatorPolicyHash: hash, overrides: [] };
    }
    const receipt = JSON.parse(readFileSync(file, 'utf8'));
    if (policyProvenance) receipt.assessment.policyProvenance = policyProvenance;
    const res = await verify(receipt, [1, 2]);
    console.log(JSON.stringify(res, null, 2));
  } else if (cmd === 'assess') {
    const file = args[1];
    const input = JSON.parse(readFileSync(file, 'utf8'));
    const rpcUrl = process.env.RHC_RPC_URL;
    if (!rpcUrl) { console.log(JSON.stringify({ error: 'RHC_RPC_URL missing' })); process.exit(1); }
    const policyEnvIndex = args.indexOf('--policy-env');
    let policyProvenance: any;
    if (policyEnvIndex !== -1) {
      const envName = args[policyEnvIndex + 1];
      const { hash } = loadOperatorPolicy(envName);
      policyProvenance = { source: 'operator-file', operatorPolicyHash: hash, overrides: [] };
    }
    const receipt = await assess({ rpcUrl, action: input.action, policy: input.policy, policyProvenance } as any);
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    console.log('rwa-preflight: assess <input.json> [--policy-env ENV] | verify <receipt.json> [--policy-env ENV] | asset | registry');
  }
})();