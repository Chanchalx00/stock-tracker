import type { OhlcPoint } from "@/components/PriceChart";
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
