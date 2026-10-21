import { readFileSync } from 'node:fs';
import { verify } from './verify';

const cmd = process.argv[2];
if (cmd === 'verify') {
  const file = process.argv[3];
  const receipt = JSON.parse(readFileSync(file, 'utf8'));
  console.log(JSON.stringify(verify(receipt, [1, 2]), null, 2));
} else {
  console.log('rwa-preflight: assess | verify <receipt.json> | asset | registry');
}
