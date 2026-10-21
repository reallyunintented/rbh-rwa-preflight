import { describe, it, expect } from 'vitest';
import { inSession } from '../src/session';

describe('session', () => {
  it('weekend false', () => { expect(inSession(1700000000).inSession).toBe(false); });
});
