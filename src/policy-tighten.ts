const TIGHTER: Record<string, (a: any, b: any) => boolean> = {
  maxSlippageBps: (a, b) => b <= a,
  maxOracleDeviationBps: (a, b) => b <= a,
  maxPoolFeeBps: (a, b) => b <= a,
  maxNotionalQuote: (a, b) => BigInt(b) <= BigInt(a),
  maxFeedAgeSecInSession: (a, b) => b <= a,
  maxIssuerSignalAgeSec: (a, b) => b <= a,
  maxDeadlineSec: (a, b) => b <= a,
  maxAssessmentAgeSec: (a, b) => b <= a,
  corporateActionLookaheadSec: (a, b) => b >= a,
  corporateActionLookbackSec: (a, b) => b >= a,
  requireIssuerSignals: (a, b) => (!a && b) || a === b,
  pinBlockTag: (a, b) => (['latest', 'safe', 'finalized'].indexOf(b) >= ['latest', 'safe', 'finalized'].indexOf(a)),
  sequencerAssurance: (a, b) => (a === 'degraded' && b === 'strict') || a === b,
};

export function validateTightening(base: any, requested: any): { ok: boolean; loosened: string[] } {
  const loosened: string[] = [];
  for (const field of Object.keys(TIGHTER)) {
    if (requested[field] !== undefined && base[field] !== undefined) {
      if (!TIGHTER[field](base[field], requested[field])) loosened.push(field);
    }
  }
  // subset checks for arrays
  for (const field of ['allowTokens', 'allowedPools', 'allowedHooks']) {
    if (Array.isArray(requested[field]) && Array.isArray(base[field])) {
      if (!requested[field].every((x: any) => base[field].includes(x))) loosened.push(field);
    }
  }
  if (requested.allowedRecipients && base.allowedRecipients) {
    if (base.allowedRecipients !== 'self' && requested.allowedRecipients === 'self') {
      // tightening, ok
    } else if (Array.isArray(base.allowedRecipients) && Array.isArray(requested.allowedRecipients)) {
      if (!requested.allowedRecipients.every((x: any) => base.allowedRecipients.includes(x))) loosened.push('allowedRecipients');
    } else if (base.allowedRecipients === 'self' && requested.allowedRecipients !== 'self') {
      loosened.push('allowedRecipients');
    }
  }
  if (requested.offSessionPolicy && base.offSessionPolicy) {
    const order = ['allow_wider', 'warn', 'defer'];
    if (order.indexOf(requested.offSessionPolicy) < order.indexOf(base.offSessionPolicy)) loosened.push('offSessionPolicy');
  }
  return { ok: loosened.length === 0, loosened };
}
