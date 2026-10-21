import { decodeFunctionData, decodeAbiParameters } from 'viem';
import type { Address, Hex } from '../types.js';

export const DECODER_ID = 'universal-router-v4-exact-in-single';
export const V4_SWAP_COMMAND = 0x10;

export interface PoolKey {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}

export interface DecodedUniversalRouterV4 {
  decoderId: string;
  routerCodehash: Hex;
  poolKey: PoolKey;
  zeroForOne: boolean;
  amountIn: bigint;
  minAmountOut: bigint;
  recipient: Address;
  deadline: number;
  commands: number[];
}

export type DecodeResult =
  | { ok: true; decoded: DecodedUniversalRouterV4 }
  | { ok: false; reason: 'CODEHASH_UNKNOWN' | 'TX_FORMAT_UNSUPPORTED' };

export function decodeUniversalRouterV4(input: {
  to: Address;
  data: Hex;
  account: Address;
  routerAddress: Address;
  routerCodehash: Hex;
  supportedCodehashes: Hex[];
}): DecodeResult {
  if (input.to.toLowerCase() !== input.routerAddress.toLowerCase()) return { ok: false, reason: 'CODEHASH_UNKNOWN' };
  if (!input.supportedCodehashes.map((x) => x.toLowerCase()).includes(input.routerCodehash.toLowerCase())) {
    return { ok: false, reason: 'CODEHASH_UNKNOWN' };
  }

  let commands: Hex = '0x';
  let inputs: Hex[] = [];
  let deadline = 0;

  const executeAbi3 = [
    {
      type: 'function', name: 'execute',
      inputs: [
        { name: 'commands', type: 'bytes' },
        { name: 'inputs', type: 'bytes[]' },
        { name: 'deadline', type: 'uint256' },
      ],
      outputs: [],
    },
  ] as const;
  const executeAbi2 = [
    {
      type: 'function', name: 'execute',
      inputs: [
        { name: 'commands', type: 'bytes' },
        { name: 'inputs', type: 'bytes[]' },
      ],
      outputs: [],
    },
  ] as const;

  try {
    const r = decodeFunctionData({ abi: executeAbi3, data: input.data });
    commands = r.args![0] as Hex;
    inputs = r.args![1] as Hex[];
    deadline = Number(r.args![2] as bigint);
  } catch {
    try {
      const r = decodeFunctionData({ abi: executeAbi2, data: input.data });
      commands = r.args![0] as Hex;
      inputs = r.args![1] as Hex[];
      deadline = 0;
    } catch {
      return { ok: false, reason: 'TX_FORMAT_UNSUPPORTED' };
    }
  }

  const commandBytes = (commands.slice(2).match(/.{2}/g) ?? []).map((b) => parseInt(b, 16));
  if (commandBytes.length === 0 || commandBytes.length !== inputs.length) {
    return { ok: false, reason: 'TX_FORMAT_UNSUPPORTED' };
  }
  if (commandBytes.some((c) => c !== V4_SWAP_COMMAND)) {
    return { ok: false, reason: 'TX_FORMAT_UNSUPPORTED' };
  }
  if (commandBytes.length !== 1) {
    return { ok: false, reason: 'TX_FORMAT_UNSUPPORTED' };
  }

  let decodedParams: any;
  try {
    const res = decodeAbiParameters(
      [
        {
          type: 'tuple',
          components: [
            {
              name: 'poolKey',
              type: 'tuple',
              components: [
                { name: 'currency0', type: 'address' },
                { name: 'currency1', type: 'address' },
                { name: 'fee', type: 'uint24' },
                { name: 'tickSpacing', type: 'int24' },
                { name: 'hooks', type: 'address' },
              ],
            },
            { name: 'zeroForOne', type: 'bool' },
            { name: 'amountIn', type: 'uint128' },
            { name: 'amountOutMinimum', type: 'uint128' },
            { name: 'hookData', type: 'bytes' },
          ],
        },
      ],
      inputs[0],
    );
    decodedParams = res[0];
  } catch {
    return { ok: false, reason: 'TX_FORMAT_UNSUPPORTED' };
  }

  const poolKey: PoolKey = {
    currency0: decodedParams.poolKey.currency0 as Address,
    currency1: decodedParams.poolKey.currency1 as Address,
    fee: Number(decodedParams.poolKey.fee),
    tickSpacing: Number(decodedParams.poolKey.tickSpacing),
    hooks: decodedParams.poolKey.hooks as Address,
  };

  return {
    ok: true,
    decoded: {
      decoderId: DECODER_ID,
      routerCodehash: input.routerCodehash,
      poolKey,
      zeroForOne: Boolean(decodedParams.zeroForOne),
      amountIn: BigInt(decodedParams.amountIn),
      minAmountOut: BigInt(decodedParams.amountOutMinimum),
      recipient: input.account,
      deadline,
      commands: commandBytes,
    },
  };
}