import { describe, it, expect } from 'vitest';
import { decodeUniversalRouterV4 } from '../src/decoders/universal-router-v4';

describe('decoder fuzz', () => {
  it('does not crash on random inputs', () => {
    for (let i = 0; i < 200; i++) {
      const len = Math.floor(Math.random() * 200);
      const bytes = '0x' + Array.from({ length: len }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
      let res: any;
      try {
        res = decodeUniversalRouterV4({ to: '0x8876789976dEcBfCbBbe364623C63652db8C0904' as any, data: bytes as any, account: '0x1111111111111111111111111111111111111111' as any, routerAddress: '0x8876789976dEcBfCbBbe364623C63652db8C0904' as any, routerCodehash: '0x0' as any, supportedCodehashes: ['0x0'] as any });
      } catch (e) {
        throw new Error('crash: ' + e);
      }
      expect(res).toBeDefined();
    }
  });
});
