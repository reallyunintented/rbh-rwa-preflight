export function computeHeaderGaps(blocks: { timestamp: number }[]): { maxGapSec: number } {
  let maxGap = 0;
  for (let i = 1; i < blocks.length; i++) {
    const gap = blocks[i].timestamp - blocks[i - 1].timestamp;
    if (gap > maxGap) maxGap = gap;
  }
  return { maxGapSec: maxGap };
}

export function headLagSec(blockTimestamp: number, captureUnix: number): number {
  return captureUnix - blockTimestamp;
}