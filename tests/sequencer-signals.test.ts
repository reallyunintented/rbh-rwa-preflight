import { describe, it, expect } from 'vitest';
import { computeHeaderGaps, headLagSec } from '../src/sequencer-signals';

describe('sequencer signals', () => {
  it('max gap', () => { expect(computeHeaderGaps([{ timestamp: 1 }, { timestamp: 5 }, { timestamp: 6 }]).maxGapSec).toBe(4); });
  it('head lag', () => { expect(headLagSec(10, 15)).toBe(5); });
});
