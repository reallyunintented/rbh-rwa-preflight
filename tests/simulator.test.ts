import { describe, it, expect } from 'vitest';
import { runSimulation, UNAVAILABLE_SIMULATION } from '../src/simulator';
import { g8Simulation } from '../src/gates/g8';

const recorded: { method: string; params: unknown[] }[] = [];
const src = {
  async rpc(method: string, params: unknown[]) {
    recorded.push({ method, params });
    return { response: { status: '0x1' }, error: undefined };
  },
};

describe('runSimulation (AUDIT F-04 scaffold)', () => {
  it('sends eth_simulateV1 at the PINNED block, from the real account', async () => {
    recorded.length = 0;
    await runSimulation(src as any, { to: '0xabc', data: '0x', value: '0x0' }, { blockNumber: '0x5a16b7b', account: '0x1111111111111111111111111111111111111111' });
    expect(recorded.length).toBe(1);
    expect(recorded[0].method).toBe('eth_simulateV1');
    const [opts, blockTag] = recorded[0].params as [any, string];
    expect(blockTag).toBe('0x5a16b7b');           // pinned block, not 'latest'
    expect(opts.blockStateCalls[0].calls[0].from).toBe('0x1111111111111111111111111111111111111111');
  });

  it('unavailable default never fakes prerequisite-missing', () => {
    expect(UNAVAILABLE_SIMULATION.available).toBe(false);
    expect(UNAVAILABLE_SIMULATION.prerequisiteMissing).toBe(false); // UNKNOWN, not a wrong FAIL
    expect(g8Simulation(UNAVAILABLE_SIMULATION).status).toBe('UNKNOWN');
  });

  it('rpc error -> unavailable -> G8 UNKNOWN (fail closed)', async () => {
    const errSrc = { async rpc() { return { response: null, error: { message: 'x' } }; } };
    const r = await runSimulation(errSrc as any, { to: '0xabc', data: '0x', value: '0x0' }, { blockNumber: '0x1', account: '0x1' });
    expect(g8Simulation(r).status).toBe('UNKNOWN');
  });
});
