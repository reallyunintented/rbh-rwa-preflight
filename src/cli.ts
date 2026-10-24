import { readFileSync } from 'node:fs';
import { verify } from './verify';
import { loadOperatorPolicy } from './policy-loader';
import { redactText } from './redact';

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
  } else {
    console.log('rwa-preflight: assess | verify <receipt.json> [--policy-env ENV] | asset | registry');
  }
})().catch((e: any) => {
  console.log(JSON.stringify({ error: redactText(String(e?.message ?? e)) }));
});