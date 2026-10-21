import { decodeFunctionData } from 'viem';
import type { Address, Hex } from '../types.js';

export const DECODER_ID_V3 = 'swap-router02-exact-input-single';
export const SWAP_ROUTER02_ADDRESS = '0xcaf681a66d020601342297493863e78c959e5cb2' as const;
export const SWAP_ROUTER02_CODEHASH = '0x6f36c378e272c6324c48f045182bcb54bd8ad654cf9ebd42e8893d52c4cb25dc' as const;

const abi = [
  {
    type: 'function',
    name: 'exactInputSingle',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export function decodeSwapRouter02(input: { to: Address; data: Hex; routerAddress: Address; supportedCodehashes: Hex[]; routerCodehash: Hex; }) {
  if (input.to.toLowerCase() !== input.routerAddress.toLowerCase()) return { ok: false as const, reason: 'CODEHASH_UNKNOWN' };
  if (!input.supportedCodehashes.map((x) => x.toLowerCase()).includes(input.routerCodehash.toLowerCase())) return { ok: false as const, reason: 'CODEHASH_UNKNOWN' };
  try {
    const res = decodeFunctionData({ abi, data: input.data });
    const t = res.args![0] as any;
    return { ok: true as const, decoded: { decoderId: DECODER_ID_V3, routerCodehash: input.routerCodehash, tokenIn: t.tokenIn, tokenOut: t.tokenOut, fee: t.fee, recipient: t.recipient, deadline: Number(t.deadline), amountIn: t.amountIn, minAmountOut: t.amountOutMinimum } };
  } catch {
    return { ok: false as const, reason: 'TX_FORMAT_UNSUPPORTED' };
  }
}