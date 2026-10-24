export function g7Decode(input: { decoderOk: boolean; decoderReason?: string; }) {
  if (!input.decoderOk) {
    const reason = input.decoderReason ?? 'TX_FORMAT_UNSUPPORTED';
    const status = reason === 'CODEHASH_UNKNOWN' ? 'UNKNOWN' : 'FAIL_HARD';
    return { gate: 'G7_DECODE', status, reasons: [reason], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  }
  return { gate: 'G7_DECODE', status: 'PASS', reasons: [], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
}