import { describe, it, expect } from 'vitest';
import { FORBIDDEN_WORDS, METER_STRINGS } from '../src/meter-strings';

describe('meter strings', () => {
  it('no forbidden words', () => {
    const text = Object.values(METER_STRINGS).join(' ');
    for (const w of FORBIDDEN_WORDS) expect(text.toLowerCase().includes(w)).toBe(false);
  });
});
