export const METER_STRINGS = {
  SESSION_CLOSED: 'US markets are closed. The reference price is the last oracle value from {age}.',
  MID_PREMIUM: 'The pool price is {bps} bps {above|below} the reference price.',
  ADVERSE_COST: 'For a {side} of {size} USDG, the pool fee and price impact cost about {bps} bps relative to the reference.',
  THIN_POOL: 'At {size4} USDG the cost rises to about {bps4} bps.',
  CA_PENDING: 'A corporate action (for example a split) is scheduled for {time}. Prices can jump.',
  ISSUER_HALT: 'The issuer reports a trading halt for this token.',
  UNKNOWN_FIELD: 'We could not determine {field}. No number is shown.',
  ELIGIBILITY_NOT_ASSESSED: 'Whether you may hold or trade this token is not assessed here. Check the issuer\'s jurisdiction list.',
  FOOTER: 'Information only, not advice. Prices can change before a transaction is included.',
} as const;

export const FORBIDDEN_WORDS = ['safe', 'safety', 'recommend', 'should buy', 'should sell', 'guarantee', 'risk-free'];
