import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { verifyL2, verify } from '../src/verify';
import { assess } from '../src/assess';
import { buildReceipt } from '../src/receipt';
import { canonicalize } from '../src/canonical';
import { stubReceiptSource, policy, action } from './helpers-l2provenance';

// Tests-first for a63c38a's revert: its provenance check sat inside verifyL3's
// evidence loop, labeled {level:2}, and verify() only calls verifyL3 when level 3
// is requested — the CLI default [1,2] never ran it. Correct home: verifyL2.

describe('L2 provenance verification (tests-first fix-forward)', () => {
  it('a matching operatorPolicyHash does not break L2 PASS', async () => {
    const r = await assess({ source: stubReceiptSource(), action, policy: policy() } as any);
    const correct = createHash('sha256').update(canonicalize((r as any).inputs.policy)).digest('hex');
    (r as any).assessment.policyProvenance = { source: 'operator-file', operatorPolicyHash: correct, overrides: [] };
    const repaired = buildReceipt((r as any).assessment, (r as any).inputs, (r as any).evidence);
    const res = await verifyL2(repaired as any);
    expect(res.result).toBe('PASS');
    expect(res.level).toBe(2); // stays a level-2 result, no mislabeled level-3 object
  });

  it('a mismatching operatorPolicyHash -> L2 FAIL even with untouched gates', async () => {
    const r = JSON.parse(JSON.stringify(await assess({ source: stubReceiptSource(), action, policy: policy() } as any)));
    (r as any).assessment.policyProvenance = { source: 'operator-file', operatorPolicyHash: '0xdeadbeefdeadbeef', overrides: [] };
    const repaired = buildReceipt((r as any).assessment, (r as any).inputs, (r as any).evidence);
    const [l1, l2] = await verify(repaired as any, [1, 2]);
    expect(l1.result).toBe('PASS'); // hashes repairable; integrity alone is not approval
    expect(l2.result).toBe('FAIL'); // provenance catches it at level 2
  });

  it('provenance present but inputs.policy missing -> FAIL, never a crash', async () => {
    const r = JSON.parse(JSON.stringify(await assess({ source: stubReceiptSource(), action, policy: policy() } as any)));
    const correct = createHash('sha256').update(canonicalize(policy())).digest('hex');
    (r as any).assessment.policyProvenance = { source: 'operator-file', operatorPolicyHash: correct, overrides: [] };
    delete (r as any).inputs.policy;
    const res = await verifyL2(r as any);
    expect(res.result).toBe('FAIL');
  });

  it('provenance check runs under the DEFAULT verify levels [1,2] (a63c38a never ran it there)', async () => {
    const r = JSON.parse(JSON.stringify(await assess({ source: stubReceiptSource(), action, policy: policy() } as any)));
    (r as any).assessment.policyProvenance = { source: 'operator-file', operatorPolicyHash: '0xdeadbeefdeadbeef', overrides: [] };
    const repaired = buildReceipt((r as any).assessment, (r as any).inputs, (r as any).evidence);
    const out = await verify(repaired as any); // default levels
    expect(out.find((x) => x.level === 2)?.result).toBe('FAIL');
  });
});
