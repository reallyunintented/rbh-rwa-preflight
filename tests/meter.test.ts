import { describe, it, expect } from 'vitest';
import { buildMeterSnapshot } from '../src/meter';

describe('meter', () => {
  it('builds snapshot', () => {
    const s = buildMeterSnapshot('AAPL', 'buy', '100');
    expect(s.schema).toBe('rwa-meter/snapshot/v0.1');
    expect(s.limitations.length).toBeGreaterThan(0);
  });
});
