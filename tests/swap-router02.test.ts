import { describe, it, expect } from 'vitest';
import { encodeFunctionData } from 'viem';
import { decodeSwapRouter02, SWAP_ROUTER02_ADDRESS, SWAP_ROUTER02_CODEHASH } from '../src/decoders/swap-router02';

const ROUTER = SWAP_ROUTER02_ADDRESS;
const CODEHASH = SWAP_ROUTER02_CODEHASH as any;

describe('swap-router02 decoder', () => {
  it('decodes exactInputSingle', () => {
    const abi = [{ type: 'function', name: 'exactInputSingle', inputs: [{ type: 'tuple', components: [
      { type: 'address', name: 'tokenIn' }, { type: 'address', name: 'tokenOut' },
      { type: 'uint24', name: 'fee' }, { type: 'address', name: 'recipient' },
      { type: 'uint256', name: 'deadline' }, { type: 'uint256', name: 'amountIn' },
      { type: 'uint256', name: 'amountOutMinimum' }, { type: 'uint160', name: 'sqrtPriceLimitX96' },
    ]}], outputs: [{ type: 'uint256' }] }] as const;
    const data = encodeFunctionData({
      abi: abi as any,
      functionName: 'exactInputSingle',
      args: [{
        tokenIn: '0x0000000000000000000000000000000000000001',
        tokenOut: '0x0000000000000000000000000000000000000002',
        fee: 3000,
        recipient: '0x0000000000000000000000000000000000000003',
        deadline: 123n,
        amountIn: 1000n,
        amountOutMinimum: 900n,
        sqrtPriceLimitX96: 0n,
      }],
    });
    const r = decodeSwapRouter02({ to: ROUTER as any, data, routerAddress: ROUTER as any, supportedCodehashes: [CODEHASH], routerCodehash: CODEHASH });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.decoded.amountIn).toBe(1000n);
      expect(r.decoded.minAmountOut).toBe(900n);
      expect(r.decoded.fee).toBe(3000);
      expect(r.decoded.deadline).toBe(123);
    }
  });

  it('rejects unknown codehash', () => {
    const r = decodeSwapRouter02({ to: ROUTER as any, data: '0x' as any, routerAddress: ROUTER as any, supportedCodehashes: [CODEHASH], routerCodehash: ('0x' + '22'.repeat(32)) as any });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('CODEHASH_UNKNOWN');
  });

  it('rejects bad data', () => {
    const r = decodeSwapRouter02({ to: ROUTER as any, data: '0x1234' as any, routerAddress: ROUTER as any, supportedCodehashes: [CODEHASH], routerCodehash: CODEHASH });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('TX_FORMAT_UNSUPPORTED');
  });

  it('unsupported on bad data', () => {
    const r = decodeSwapRouter02({ to: '0xcaf681a66d020601342297493863e78c959e5cb2' as any, data: '0x' as any, routerAddress: '0xcaf681a66d020601342297493863e78c959e5cb2' as any, supportedCodehashes: ['0x0'] as any, routerCodehash: '0x0' as any });
    expect(r.ok).toBe(false);
  });
});