export function inSession(ts: number, coverage?: { startUnix?: number; endUnix?: number }): { inSession: boolean; known: boolean } {
  if (coverage?.startUnix !== undefined && ts < coverage.startUnix) return { inSession: false, known: false };
  if (coverage?.endUnix !== undefined && ts > coverage.endUnix) return { inSession: false, known: false };
  const d = new Date(ts * 1000);
  const day = d.getUTCDay();
  const hour = d.getUTCHours();
  if (day === 0 || day === 6) return { inSession: false, known: true };
  if (hour < 13 || hour >= 21) return { inSession: false, known: true }; // approx NYSE 9:30-16:00 ET -> 13:30-20:00 UTC; simplified
  return { inSession: true, known: true };
}
