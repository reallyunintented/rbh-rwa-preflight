import { hashValue } from './hash.js';
import type { Receipt, ExecutionAssessment } from './types.js';

export function buildReceipt(assessment: ExecutionAssessment, inputs: Receipt['inputs'], evidence: unknown[]): Receipt {
  if (!Array.isArray((assessment as any).limitations) || (assessment as any).limitations.length === 0) {
    throw new Error('INPUT_INCOMPLETE');
  }
  const sortedEvidence = [...evidence].sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));
  const receipt: Receipt = {
    assessment: { ...assessment, hashes: { ...assessment.hashes } },
    inputs,
    evidence: sortedEvidence,
  };
  // recompute hashes
  receipt.assessment.hashes.inputs = hashValue(inputs);
  receipt.assessment.hashes.evidence = hashValue(sortedEvidence);
  const assessmentWithoutHashes = { ...receipt.assessment, hashes: undefined };
  receipt.assessment.hashes.assessment = hashValue(assessmentWithoutHashes);
  return receipt;
}

export function verifyHashes(receipt: Receipt): boolean {
  if (hashValue(receipt.inputs) !== receipt.assessment.hashes.inputs) return false;
  if (hashValue(receipt.evidence) !== receipt.assessment.hashes.evidence) return false;
  const a = { ...receipt.assessment, hashes: undefined };
  if (hashValue(a) !== receipt.assessment.hashes.assessment) return false;
  return true;
}
