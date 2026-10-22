import { describe, it, expect } from 'vitest';
import { computeHeaderGaps, headLagSec, degradedPass } from '../src/sequencer-signals';

describe('sequencer signals', () => {
  it('max gap', () => { expect(computeHeaderGaps([{ timestamp: 1 }, { timestamp: 5 }, { timestamp: 6 }]).maxGapSec).toBe(4); });
  it('head lag', () => { expect(headLagSec(10, 15)).toBe(5); });
  it('degraded pass', () => { expect(degradedPass({ maxGapSec: 10, headLagSec: 5 }, { maxGapSec: 60, maxHeadLagSec: 30 })).toBe(true); });
});
