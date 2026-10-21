export function g3Oracle(input: { paused: boolean; answer: bigint; updatedAt: number; now: number; heartbeatSec: number; inSession: boolean; offSessionPolicy?: 'defer' | 'warn' | 'allow_wider'; }) {
  if (input.answer <= 0n || input.updatedAt <= 0) return { gate: 'G3_ORACLE', status: 'FAIL_HARD', reasons: ['PRICE_INVALID'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  if (input.paused) return { gate: 'G3_ORACLE', status: 'FAIL_TRANSIENT', reasons: ['ORACLE_PAUSED'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  const stale = (input.now - input.updatedAt) > input.heartbeatSec;
  if (stale && input.inSession) return { gate: 'G3_ORACLE', status: 'FAIL_TRANSIENT', reasons: ['PRICE_STALE'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
  if (stale && !input.inSession) {
    const policy = input.offSessionPolicy ?? 'defer';
    if (policy === 'defer') return { gate: 'G3_ORACLE', status: 'FAIL_TRANSIENT', reasons: ['PRICE_STALE_MARKET_CLOSED'], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
    // warn / allow_wider: advisory, do not block
    return { gate: 'G3_ORACLE', status: 'PASS', reasons: [], enforcement: 'advisory', details: { offSessionStale: true }, evidenceRefs: [] } as any;
  }
  return { gate: 'G3_ORACLE', status: 'PASS', reasons: [], enforcement: 'advisory', details: {}, evidenceRefs: [] } as any;
}
