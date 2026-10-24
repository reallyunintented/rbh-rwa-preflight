import { LiveSource, type EvidenceSource } from './evidence';
import { buildReceipt } from './receipt';
import { g0Context } from './gates/g0';
import { g1Asset } from './gates/g1';
import { g2Sequencer } from './gates/g2';
import { g3Oracle } from './gates/g3';
import { g4CorporateAction } from './gates/g4';
import { g5Issuer } from './gates/g5';
import { g6Valuation } from './gates/g6';
import { g7Decode } from './gates/g7';
import { g8Simulation } from './gates/g8';
import { g9ExecutionQuality } from './gates/g9';
import { g10Policy } from './gates/g10';
import { g11Lending } from './gates/g11';
import { assessLending } from './lending';
import { validateUserOp } from './smart-account';
import { aggregate, readyInvariant } from './verdict';
import { decodeUniversalRouterV4 } from './decoders/universal-router-v4';
import { keccak256, toHex } from 'viem';

export async function assess(input: { rpcUrl?: string; source?: EvidenceSource; action: any; policy: any; }) {
  const src = (input.source ?? new LiveSource(input.rpcUrl as string)) as EvidenceSource;
  const chainIdItem = await src.rpc('eth_chainId', []);
  const rpcChainId = parseInt(chainIdItem.response as string, 16);
  const blockItem = await src.rpc('eth_blockNumber', []);
  const blockNumber = blockItem.response as string;
  const blockDetail = await src.rpc('eth_getBlockByNumber', [blockNumber, false]);
  const blockHash = (blockDetail.response as any)?.hash ?? '0x0';
  const blockTimestamp = Number((blockDetail.response as any)?.timestamp ?? 0);

  const codeItem = await src.rpc('eth_getCode', [input.action.tx.to, blockNumber]);
  const bytecode = (codeItem.response as string) ?? '0x';
  const routerCodehash = bytecode && bytecode !== '0x' ? (keccak256(toHex(bytecode as `0x${string}`)) as any) : ('0x0' as any);
  // No verified Universal Router v4 codehash is pinned in this repo; supported list empty => fail-closed.
  const supportedCodehashes: any[] = [];

  const decoderRes = decodeUniversalRouterV4({
    to: input.action.tx.to,
    data: input.action.tx.data,
    account: input.action.account,
    routerAddress: input.action.tx.to,
    routerCodehash,
    supportedCodehashes,
  });

  const decoded = decoderRes.ok ? decoderRes.decoded : null;

  const gates: any[] = [];
  gates.push(g0Context({ chainId: input.action.chainId, rpcChainId, blockNumber, blockHash: '0x0', blockTimestamp: 0, pinBlockTag: input.policy.pinBlockTag }));
  gates.push(g1Asset({ inRegistry: false, probeOk: false, pauseFlags: {} }));
  gates.push(g2Sequencer({ feedKnown: false, up: false, graceElapsed: false, sequencerAssurance: input.policy.sequencerAssurance ?? 'strict', signals: { maxGapSec: 0, headLagSec: 0 }, thresholds: { maxGapSec: input.policy.sequencerMaxGapSec ?? 60, maxHeadLagSec: input.policy.sequencerMaxHeadLagSec ?? 30 } }));
  gates.push(g3Oracle({ paused: false, answer: 0n, updatedAt: 0, now: 0, heartbeatSec: 0, inSession: false }));
  gates.push(g4CorporateAction({ newMultiplier: 0n, currentMultiplier: 0n, effectiveAt: 0, now: 0, lookaheadSec: 0, lookbackSec: 0 }));
  gates.push(g5Issuer({ halt: false, tradable: false, available: false, stale: true, multiplierMatch: false }));
  gates.push(g6Valuation({ quoteResolved: false }));
  gates.push(g7Decode({ decoderOk: decoderRes.ok, decoderReason: decoderRes.ok ? undefined : decoderRes.reason }));
  gates.push(g8Simulation({ available: false, reverted: false, unexpectedBalance: false, unexpectedAllowance: false, prerequisiteMissing: false }));
  gates.push(g9ExecutionQuality({ deviationBps: 0, policyBps: 0, minOutImpliedOk: false }));
  if (input.action.lending) {
    const lr = assessLending(input.action.lending);
    gates.push(g11Lending({ safe: lr.safe }));
  }
  if (input.action.userOp) {
    const ur = validateUserOp(input.action.userOp);
    gates.push({ gate: 'G12_SMART_ACCOUNT', status: ur.ok ? 'PASS' : 'FAIL_HARD', reasons: ur.ok ? [] : [ur.reason ?? 'INVALID_USEROP'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] });
  }
  const recipientAllowed = decoded && decoded.recipient
    ? (input.policy.allowedRecipients === 'self'
        ? decoded.recipient.toLowerCase() === String(input.action.account).toLowerCase()
        : Array.isArray(input.policy.allowedRecipients) && input.policy.allowedRecipients.map((x: string) => x.toLowerCase()).includes(decoded.recipient.toLowerCase()))
    : false;
  gates.push(g10Policy({
    tokenAllowed: false,
    recipientAllowed,
    minAmountOutZero: decoded ? decoded.minAmountOut === 0n : true,
  }));

  // READY invariant: decoder must be ok and g8 must pass and no unresolved assumptions.
  const g8 = gates.find((g) => g.gate === 'G8_SIMULATION');
  const g8Pass = g8?.status === 'PASS';
  const unresolvedAssumptions = 0;
  const decoderOk = decoderRes.ok;
  if (!readyInvariant({ decoderOk, g8Pass, unresolvedAssumptions })) {
    // force non-READY by injecting an UNKNOWN gate if everything else passed
    if (!gates.some((g) => g.status === 'FAIL_HARD' || g.status === 'UNKNOWN' || g.status === 'FAIL_TRANSIENT')) {
      gates.push({ gate: 'G7_DECODE', status: 'UNKNOWN', reasons: ['READY_INVARIANT_VIOLATED'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] });
    }
  }

  const verdict = aggregate(gates);
  const assessment: any = {
    schema: 'rwa-preflight/assessment/v0.3',
    verdict,
    reasons: gates.flatMap((g: any) => g.reasons),
    chain: { chainId: input.action.chainId, blockNumber, blockHash, blockTimestamp, finality: 'unknown' },
    validity: { pinnedAtBlockTimestamp: 0, maxAgeSec: input.policy.maxAssessmentAgeSec },
    gates,
    guarantees: { enforced: [], advisory: [], notAssessed: ['eligibility'] },
    assumptions: [],
    limitations: ['minimal assess implementation'],
    hashes: { inputs: '', evidence: '', assessment: '' },
  };
  assessment.policyProvenance = (input as any).policyProvenance;
  const receipt = buildReceipt(assessment, { action: input.action, policy: input.policy, registrySlice: {}, calendarSlice: {}, decoders: [], libraryVersion: '0.0.0', schemaVersions: {} }, src.items());
  return receipt;
}