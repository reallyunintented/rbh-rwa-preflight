export type Address = `0x${string}`;
export type Hex = `0x${string}`;
export type Verdict = 'READY' | 'BLOCKED' | 'DEFER' | 'HUMAN_REVIEW';
export type GateStatus = 'PASS' | 'FAIL_HARD' | 'FAIL_TRANSIENT' | 'UNKNOWN' | 'NOT_APPLICABLE';
export type Enforcement = 'tx-enforced' | 'advisory' | 'none';

export interface ProposedAction {
  kind: 'swap_exact_in';
  chainId: number;
  account: Address;
  tx: { to: Address; data: Hex; value: string };
  intent?: Record<string, unknown>;
}

export interface Policy {
  allowTokens?: Address[];
  maxNotionalQuote?: string;
  maxSlippageBps: number;
  maxOracleDeviationBps: number;
  maxPoolFeeBps: number;
  allowedPools?: string[];
  allowedHooks?: Address[];
  maxFeedAgeSecInSession?: number;
  offSessionPolicy: 'defer' | 'warn' | 'allow_wider';
  offSessionMaxDeviationBps?: number;
  requireIssuerSignals: boolean;
  maxIssuerSignalAgeSec: number;
  corporateActionLookaheadSec: number;
  corporateActionLookbackSec: number;
  maxDeadlineSec: number;
  allowedRecipients: Address[] | 'self';
  maxAssessmentAgeSec: number;
  pinBlockTag: 'latest' | 'safe' | 'finalized';
}

export interface ExecutionAssessment {
  schema: string;
  verdict: Verdict;
  reasons: string[];
  chain: { chainId: number; blockNumber: string; blockHash: Hex; blockTimestamp: number; finality: string };
  validity: { pinnedAtBlockTimestamp: number; maxAgeSec: number };
  gates: unknown[];
  guarantees: { enforced: string[]; advisory: string[]; notAssessed: string[] };
  assumptions: string[];
  limitations: string[];
  hashes: { inputs: string; evidence: string; assessment: string };
  policyProvenance?: { source: string; operatorPolicyHash: string; overrides: string[] };
}

export interface Receipt {
  assessment: ExecutionAssessment;
  inputs: { action: ProposedAction; policy: Policy; registrySlice: unknown; calendarSlice: unknown; decoders: unknown[]; libraryVersion: string; schemaVersions: Record<string, string> };
  evidence: unknown[];
}
