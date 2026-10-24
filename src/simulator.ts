import { encodeFunctionData } from 'viem';

export interface SimulationResult {
  available: boolean;
  reverted: boolean;
  unexpectedBalance: boolean;
  unexpectedAllowance: boolean;
  prerequisiteMissing: boolean;
}

export const UNAVAILABLE_SIMULATION: SimulationResult = {
  available: false,
  reverted: false,
  unexpectedBalance: false,
  unexpectedAllowance: false,
  prerequisiteMissing: false,
};

export interface DecodedSwapEffects {
  tokenIn: string;
  tokenOut: string;
  recipient: string;
  amountIn: bigint;
  minAmountOut: bigint;
}

interface SimRpcSource {
  rpc(m: string, p: unknown[]): Promise<{ response?: unknown; error?: { message: string } }>;
}

// ERC-20 read selectors. Source: EIP-20 token standard (https://eips.ethereum.org/EIPS/eip-20),
// recorded in docs/CHAIN_FACTS.md (F1) as the interface Stock Tokens implement.
const ERC20_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;

// A uint256 read must be a full 32-byte word ('0x' + 64 hex). This rejects short
// values like call status '0x1' so a status can never be confused with a balance.
function parseWord(v: unknown): bigint | null {
  if (typeof v !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(v)) return null;
  return BigInt(v);
}

// Tolerant parse of a simulated read call's uint256 output. Conservative: an
// unparseable read returns null and the whole run degrades to UNAVAILABLE.
function readResult(c: any): bigint | null {
  for (const key of ['output', 'returnData', 'out', 'returnValue']) {
    const v = parseWord(c?.[key]);
    if (v !== null) return v;
  }
  return null;
}

function blockCalls(blocks: any[], i: number): any[] {
  const b = blocks[i];
  if (Array.isArray(b?.calls)) return b.calls;
  if (Array.isArray(b?.result?.calls)) return b.result.calls;
  return [];
}

function isRevert(c: any): boolean {
  return Boolean(c?.error || c?.status === '0x0' || c?.status === 0);
}

// eth_simulateV1 returns an array of simulated blocks, each with a calls array.
// Providers vary: accept (a) the canonical blocks array, (b) an object whose
// calls are the blocks (each element having its own calls), or (c) a single
// block object whose calls are the call items themselves.
function toBlocks(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.calls) && res.calls.length > 0 && res.calls.every((c: any) => Array.isArray(c?.calls))) {
    return res.calls;
  }
  if (Array.isArray(res?.calls)) return [res];
  if (Array.isArray(res?.result?.calls) && res.result.calls.every((c: any) => Array.isArray(c?.calls))) return res.result.calls;
  return [];
}

// Ordered state reads executed at two simulated states (before/after the swap
// block): the M0-verified "sequential reads" pattern for eth_simulateV1.
// Order is fixed: [bal(tokenIn, account), bal(tokenOut, account),
// bal(tokenIn, recipient), bal(tokenOut, recipient), allowance(tokenIn)] — 5 reads.
function readCallsFor(account: string, recipient: string, spender: string, tokenIn: string, tokenOut: string) {
  const bal = (t: string, a: string) => ({ to: t, data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'balanceOf', args: [a as `0x${string}`] }) });
  const allowance = { to: tokenIn, data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'allowance', args: [account as `0x${string}`, spender as `0x${string}`] }) };
  return [
    bal(tokenIn, account),
    bal(tokenOut, account),
    bal(tokenIn, recipient),
    bal(tokenOut, recipient),
    allowance,
  ];
}

export async function runSimulation(
  source: SimRpcSource,
  tx: { to: string; data: string; value: string },
  opts: {
    blockNumber: string;
    account: string;
    decoded: DecodedSwapEffects | null;
  },
): Promise<SimulationResult> {
  try {
    if (!opts.decoded) {
      // No decoded tokens: an effects claim is impossible. Probe only for a hard
      // revert (an honest verified fact); availability stays false otherwise.
      const item = await source.rpc('eth_simulateV1', [
        { blockStateCalls: [{ calls: [{ from: opts.account, to: tx.to, data: tx.data, value: tx.value }] }] },
        opts.blockNumber,
      ]);
      if (item.error || !item.response) return { ...UNAVAILABLE_SIMULATION };
      const blocks: any[] = toBlocks(item.response);
      const reverted = blockCalls(blocks, 0).some(isRevert);
      return { available: false, reverted, unexpectedBalance: false, unexpectedAllowance: false, prerequisiteMissing: false };
    }

    const dec = opts.decoded as DecodedSwapEffects;
    const reads = readCallsFor(opts.account, dec.recipient, tx.to, dec.tokenIn, dec.tokenOut);
    const plain = reads.map((r) => ({ to: r.to, data: r.data, value: '0x0' }));
    const item = await source.rpc('eth_simulateV1', [
      { blockStateCalls: [
        { calls: plain },                                                        // pre state reads
        { calls: [{ from: opts.account, to: tx.to, data: tx.data, value: tx.value }] }, // the swap
        { calls: plain },                                                        // post state reads
      ] },
      opts.blockNumber,
    ]);
    if (item.error || !item.response) return { ...UNAVAILABLE_SIMULATION };
    const blocks: any[] = toBlocks(item.response);

    const preRaw = blockCalls(blocks, 0);
    const postRaw = blockCalls(blocks, 2);
    if (preRaw.length !== reads.length || postRaw.length !== reads.length) return { ...UNAVAILABLE_SIMULATION };
    if (blockCalls(blocks, 1).some(isRevert) || preRaw.some(isRevert) || postRaw.some(isRevert)) {
      return { available: false, reverted: true, unexpectedBalance: false, unexpectedAllowance: false, prerequisiteMissing: false };
    }

    const pre = preRaw.map(readResult);
    const post = postRaw.map(readResult);
    if (pre.some((x) => x === null) || post.some((x) => x === null)) return { ...UNAVAILABLE_SIMULATION };
    const P = pre as bigint[];
    const Q = post as bigint[];

    const dInAccount = P[0] - Q[0];        // tokenIn outflow from the account
    const dOutAccount = Q[1] - P[1];       // tokenOut to the account
    const dInRecipient = P[2] - Q[2];      // tokenIn at the recipient
    const dOutRecipient = Q[3] - P[3];     // tokenOut to the recipient
    const dAllowance = Q[4] - P[4];        // allowance must not change during the swap

    let unexpectedBalance = false;
    // tokenIn outflow: strictly positive and never more than the decoded amount.
    if (dInAccount <= 0n || dInAccount > dec.amountIn) unexpectedBalance = true;
    // tokenOut inflow into the decoded recipient: at least the decoded minimum.
    const inflow = dec.recipient.toLowerCase() === opts.account.toLowerCase() ? dOutAccount : dOutRecipient;
    if (inflow < dec.minAmountOut) unexpectedBalance = true;
    // No unexpected in-scope changes: nothing else moves.
    if (dec.recipient.toLowerCase() !== opts.account.toLowerCase()) {
      if (dOutAccount !== 0n || dInRecipient !== 0n) unexpectedBalance = true;
    } else if (dOutRecipient !== 0n) {
      unexpectedBalance = true;
    }

    const unexpectedAllowance = dAllowance !== 0n;
    return { available: true, reverted: false, unexpectedBalance, unexpectedAllowance, prerequisiteMissing: false };
  } catch {
    return { ...UNAVAILABLE_SIMULATION };
  }
}
