import { describe, it, expect } from 'vitest';
import { g7Decode } from '../src/gates/g7';

describe('G7 decode gate', () => {
  it('unknown codehash -> UNKNOWN (not FAIL)**', () => {
    const r = g7Decode({ decoderOk: false, decoderReason: 'CODEHASH_UNKNOWN' });
    expect(r.status).toBe('UNKNOWN');
    expect(r.reasons).toEqual(['CODEHASH_UNKNOWN']);
  });
  it('unsupported format -> FAIL_HARD', () => {
    const r = g7Decode({ decoderOk: false, decoderReason: 'TX_FORMAT_UNSUPPORTED' });
    expect(r.status).toBe('FAIL_HARD');
  });
  it('ok decode -> PASS', () => {
    expect(g7Decode({ decoderOk: true }).status).toBe('PASS');
  });
  it('missing reason defaults to TX_FORMAT_UNSUPPORTED', () => {
    expect(g7Decode({ decoderOk: false }).reasons).toEqual(['TX_FORMAT_UNSUPPORTED']);
  });
});
