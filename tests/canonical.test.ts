import { describe, it, expect } from 'vitest';
import { canonicalize } from '../src/canonical';
import { hashValue } from '../src/hash';

describe('canonical', () => {
  it('sorts keys', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });
  it('hash stable', () => {
    expect(hashValue({ b: 1, a: 2 })).toBe(hashValue({ a: 2, b: 1 }));
  });
});
