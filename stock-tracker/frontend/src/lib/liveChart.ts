import type { OhlcPoint } from "@/components/PriceChart";

// The historical series from the backend is bucketed every 5 minutes
// (matches Yahoo's own interval). Live ticks arrive every second — if we
// appended each one as its own point, the chart would mix two wildly
// different data rates. Instead, round every live tick down to the same
// 5-minute bucket as the historical data: ticks landing in the current
// (still-forming) bucket just update that bar in place, and a genuinely
// new bar only appears once every 5 minutes — one consistent granularity.
export const CHART_BUCKET_MS = 5 * 60 * 1000;

export function bucketOf(time: number): number {
  return Math.floor(time / CHART_BUCKET_MS) * CHART_BUCKET_MS;
}

export function mergeLiveTick(
  points: OhlcPoint[],
  price: number,
): OhlcPoint[] {
  const bucket = bucketOf(Date.now());
  const last = points[points.length - 1];

  if (last && bucketOf(last.time) === bucket) {
    return [
      ...points.slice(0, -1),
      {
        ...last,
        high: Math.max(last.high, price),
        low: Math.min(last.low, price),
        close: price,
      },
    ];
  }

  return [
    ...points,
    { time: bucket, open: price, high: price, low: price, close: price },
  ];
}
