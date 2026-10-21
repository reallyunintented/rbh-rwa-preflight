import { describe, it, expect } from 'vitest';
import { encodeFunctionData } from 'viem';
import { decodeUniversalRouterV4 } from '../src/decoders/universal-router-v4';

const ROUTER = '0x8876789976dEcBfCbBbe364623C63652db8C0904' as const;
const CODEHASH = '0x' + '11'.repeat(32) as any;

describe('decoder', () => {
  it('decodes a single V4 swap', () => {
    const poolKey = {
      currency0: '0x0000000000000000000000000000000000000001' as const,
      currency1: '0x0000000000000000000000000000000000000002' as const,
      fee: 3000,
      tickSpacing: 60,
      hooks: '0x0000000000000000000000000000000000000000' as const,
    };
    const abi = [{ type: 'function', name: 'x', inputs: [{ type: 'tuple', components: [
        { type: 'tuple', name: 'poolKey', components: [
          { type: 'address', name: 'currency0' }, { type: 'address', name: 'currency1' },
          { type: 'uint24', name: 'fee' }, { type: 'int24', name: 'tickSpacing' }, { type: 'address', name: 'hooks' },
        ]},
        { type: 'bool', name: 'zeroForOne' },
        { type: 'uint128', name: 'amountIn' },
        { type: 'uint128', name: 'amountOutMinimum' },
        { type: 'bytes', name: 'hookData' },
      ]}], outputs: [] }] as const;
    const inputBytes = encodeFunctionData({
      abi: abi as any,
      functionName: 'x',
      args: [ { poolKey, zeroForOne: true, amountIn: 1000n, amountOutMinimum: 900n, hookData: '0x' } ],
    });
    // inputBytes is full calldata with selector; strip selector (4 bytes) to get abi-encoded params
    const paramBytes = ('0x' + inputBytes.slice(10)) as `0x${string}`;

    const execAbi = [{ type: 'function', name: 'execute', inputs: [
        { type: 'bytes', name: 'commands' },
        { type: 'bytes[]', name: 'inputs' },
        { type: 'uint256', name: 'deadline' },
      ], outputs: [] }] as const;
    const data = encodeFunctionData({
      abi: execAbi as any,
      functionName: 'execute',
      args: [ '0x10', [paramBytes], 123n ],
    });

    const res = decodeUniversalRouterV4({
      to: ROUTER,
      data,
      account: '0x0000000000000000000000000000000000000003',
      routerAddress: ROUTER,
      routerCodehash: CODEHASH,
      supportedCodehashes: [CODEHASH],
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.decoded.amountIn).toBe(1000n);
      expect(res.decoded.minAmountOut).toBe(900n);
      expect(res.decoded.deadline).toBe(123);
      expect(res.decoded.poolKey.fee).toBe(3000);
    }
  });

  it('rejects unknown command', () => {
    const execAbi2 = [{ type: 'function', name: 'execute', inputs: [
        { type: 'bytes', name: 'commands' },
        { type: 'bytes[]', name: 'inputs' },
      ], outputs: [] }] as const;
    const data = encodeFunctionData({
      abi: execAbi2 as any,
      functionName: 'execute',
      args: [ '0x08', ['0x'], ],
    });
    const res = decodeUniversalRouterV4({
      to: ROUTER, data, account: '0x0000000000000000000000000000000000000003',
      routerAddress: ROUTER, routerCodehash: CODEHASH, supportedCodehashes: [CODEHASH],
    });
    expect(res.ok).toBe(false);
  });

  it('rejects unknown codehash', () => {
    const res = decodeUniversalRouterV4({
      to: ROUTER, data: '0x' as any, account: '0x0000000000000000000000000000000000000003',
      routerAddress: ROUTER, routerCodehash: ('0x' + '22'.repeat(32)) as any, supportedCodehashes: [CODEHASH],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('CODEHASH_UNKNOWN');
  });
});
