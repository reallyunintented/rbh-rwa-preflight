import { describe, it, expect } from 'vitest';
import { runSimulation } from '../src/simulator';
import { g8Simulation } from '../src/gates/g8';

const BLOCK = '0x5a16b7b';
const ACCOUNT = '0x1111111111111111111111111111111111111111';
const RECIPIENT = '0x2222222222222222222222222222222222222222';
const TOKEN_IN = '0x3311111111111111111111111111111111111111';
const TOKEN_OUT = '0x4411111111111111111111111111111111111111';

const wad = (n: bigint) => '0x' + n.toString(16).padStart(64, '0');

// pre/post = ordered 5-tuple of read results:
// [bal(tokenIn,account), bal(tokenOut,account), bal(tokenIn,recipient), bal(tokenOut,recipient), allowance(tokenIn)]
function resp5(pre: bigint[], post: bigint[], swapOk = true) {
  const r5 = (xs: bigint[]) => xs.map((v) => ({ output: wad(v) }));
  return {
    calls: [
      { calls: r5(pre) },
      { calls: [{ status: swapOk ? '0x1' : '0x0', output: '0x' }] },
      { calls: r5(post) },
    ],
  };
}

const SELF = { tokenIn: TOKEN_IN, tokenOut: TOKEN_OUT, recipient: ACCOUNT, amountIn: 1000n, minAmountOut: 900n };
const OTHER = { ...SELF, recipient: RECIPIENT };

// account==recipient, self-swap: tokenIn outflow 900, tokenOut inflow 950, allowance unchanged
const SELF_CLEAN: [bigint[], bigint[]] = [[1000n, 0n, 0n, 0n, 1000n], [100n, 950n, 0n, 0n, 1000n]];
// recipient!=account: tokenIn out of account 900, tokenOut into recipient 950, nothing else moves
const OTHER_CLEAN: [bigint[], bigint[]] = [[1000n, 0n, 0n, 0n, 1000n], [100n, 0n, 0n, 950n, 1000n]];

const run = (src: any, decoded: any) =>
  runSimulation(src, { to: '0x5511111111111111111111111111111111111111', data: '0x', value: '0x0' },
    { blockNumber: BLOCK, account: ACCOUNT, decoded });

describe('simulation: effects verified from STATE (AUDIT F-04)', () => {
  it('clean self-swap -> available, all clean -> G8 PASS', async () => {
    const src = { async rpc() { return { response: resp5(...SELF_CLEAN), error: undefined }; } };
    const sim = await run(src, SELF);
    expect(sim.available).toBe(true);
    expect(sim.unexpectedBalance).toBe(false);
    expect(sim.unexpectedAllowance).toBe(false);
    expect(g8Simulation(sim).status).toBe('PASS');
  });

  it('clean cross-swap (recipient != account) -> PASS', async () => {
    const src = { async rpc() { return { response: resp5(...OTHER_CLEAN), error: undefined }; } };
    const sim = await run(src, OTHER);
    expect(sim.available).toBe(true);
    expect(sim.unexpectedBalance).toBe(false);
  });

  it('inflow < minAmountOut -> unexpectedBalance -> G8 FAIL_HARD', async () => {
    const src = { async rpc() { return { response: resp5([1000n, 0n, 0n, 0n, 1000n], [100n, 850n, 0n, 0n, 1000n]), error: undefined }; } };
    const sim = await run(src, SELF);
    expect(sim.unexpectedBalance).toBe(true);
    expect(g8Simulation(sim).status).toBe('FAIL_HARD');
  });

  it('outflow > decoded amountIn -> unexpectedBalance', async () => {
    const src = { async rpc() { return { response: resp5([2000n, 0n, 0n, 0n, 1000n], [100n, 950n, 0n, 0n, 1000n]), error: undefined }; } };
    const sim = await run(src, SELF);
    expect(sim.unexpectedBalance).toBe(true);
  });

  it('allowance changed during swap -> unexpectedAllowance -> G8 FAIL_HARD', async () => {
    const src = { async rpc() { return { response: resp5([1000n, 0n, 0n, 0n, 1000n], [100n, 950n, 0n, 0n, 0n]), error: undefined }; } };
    const sim = await run(src, SELF);
    expect(sim.unexpectedAllowance).toBe(true);
    expect(g8Simulation(sim).status).toBe('FAIL_HARD');
  });

  it('unexpected tokenIn at recipient (recipient != account) -> unexpectedBalance', async () => {
    const src = { async rpc() { return { response: resp5([1000n, 0n, 0n, 0n, 1000n], [100n, 0n, 50n, 950n, 1000n]), error: undefined }; } };
    const sim = await run(src, OTHER);
    expect(sim.unexpectedBalance).toBe(true);
  });

  it('reverted swap -> reverted -> G8 FAIL_HARD (SIM_REVERT even though simply unavailable would be UNKNOWN)', async () => {
    const src = { async rpc() { return { response: resp5(SELF_CLEAN[0], SELF_CLEAN[1], false), error: undefined }; } };
    const sim = await run(src, SELF);
    expect(sim.reverted).toBe(true);
    expect(sim.unexpectedBalance).toBe(false);
  });

  it('a stateDiff-SHAPED field alone must NEVER flip available:true (fence for the truthy-field shortcut)', async () => {
    const bogus = { stateDiff: { some: 'field' }, calls: [{ calls: [{ status: '0x1', output: '0x' }] }] };
    const src = { async rpc() { return { response: bogus, error: undefined }; } };
    const sim = await run(src, SELF);
    expect(sim.available).toBe(false);
    expect(g8Simulation(sim).status).toBe('UNKNOWN');
  });

  it('short hex that looks like a status can never be parsed as a balance (unparseable -> UNAVAILABLE)', async () => {
    const bogus = {
      calls: [
        { calls: [{ output: '0x1' }] }, // status-like short value -> not a word
        { calls: [{ status: '0x1' }] },
        { calls: [{}, {}, {}, {}, {}] },
      ],
    };
    const src = { async rpc() { return { response: bogus, error: undefined }; } };
    const sim = await run(src, SELF);
    expect(sim.available).toBe(false);
    expect(g8Simulation(sim).status).toBe('UNKNOWN');
  });

  it('all-zero deltas with success -> outflow must be positive -> unexpectedBalance (weird success is not clean)', async () => {
    const src = { async rpc() { return { response: resp5([1000n, 0n, 0n, 0n, 1000n], [1000n, 0n, 0n, 0n, 1000n]), error: undefined }; } };
    const sim = await run(src, SELF);
    expect(sim.available).toBe(true);
    expect(sim.unexpectedBalance).toBe(true);
  });
});

describe('runSimulation revert-only mode (decoded null)', () => {
  it('revert is still an honest verified fact; otherwise unavailable', async () => {
    const r1 = await runSimulation(
      { async rpc() { return { response: { calls: [{ calls: [{ status: '0x0' }] }] }, error: undefined }; } },
      { to: '0x5555', data: '0x', value: '0x0' },
      { blockNumber: BLOCK, account: ACCOUNT, decoded: null },
    );
    expect(r1.reverted).toBe(true);
    // a verified revert is FAIL_HARD even when state reads were unavailable
    expect(g8Simulation(r1).status).toBe('FAIL_HARD');
    const r2 = await runSimulation(
      { async rpc() { return { response: { calls: [{ calls: [{ status: '0x1' }] }] }, error: undefined }; } },
      { to: '0x5555', data: '0x', value: '0x0' },
      { blockNumber: BLOCK, account: ACCOUNT, decoded: null },
    );
    expect(r2.reverted).toBe(false);
    expect(r2.available).toBe(false);
  });
});
