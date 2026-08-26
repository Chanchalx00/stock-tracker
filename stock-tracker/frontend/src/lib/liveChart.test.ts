import { describe, it, expect, vi, afterEach } from "vitest";
import { mergeLiveTick, bucketOf, CHART_BUCKET_MS } from "@/lib/liveChart";
import type { OhlcPoint } from "@/components/PriceChart";

const bar = (time: number, price: number): OhlcPoint => ({
  time,
  open: price,
  high: price,
  low: price,
  close: price,
});

afterEach(() => {
  vi.useRealTimers();
});

const freezeAt = (ms: number) => {
  vi.useFakeTimers();
  vi.setSystemTime(ms);
};

describe("bucketOf", () => {
  it("floors a timestamp to its 5-minute bucket", () => {
    expect(bucketOf(CHART_BUCKET_MS * 3 + 1234)).toBe(CHART_BUCKET_MS * 3);
  });

  it("is stable for a timestamp already on a boundary", () => {
    expect(bucketOf(CHART_BUCKET_MS * 3)).toBe(CHART_BUCKET_MS * 3);
  });
});

describe("mergeLiveTick", () => {
  it("folds a tick into the open candle without adding a bar", () => {
    freezeAt(CHART_BUCKET_MS * 10 + 1000);
    const points = [bar(CHART_BUCKET_MS * 9, 100), bar(CHART_BUCKET_MS * 10, 110)];

    const merged = mergeLiveTick(points, 115);

    expect(merged).toHaveLength(2);
    expect(merged[1].close).toBe(115);
    expect(merged[1].high).toBe(115);
    expect(merged[1].open).toBe(110);
  });

  it("keeps the running low when the price falls", () => {
    freezeAt(CHART_BUCKET_MS * 10 + 1000);
    const points = [bar(CHART_BUCKET_MS * 10, 110)];

    const merged = mergeLiveTick(points, 90);

    expect(merged[0].low).toBe(90);
    expect(merged[0].high).toBe(110);
    expect(merged[0].close).toBe(90);
  });

  it("opens a new candle once the bucket rolls over", () => {
    freezeAt(CHART_BUCKET_MS * 11);
    const points = [bar(CHART_BUCKET_MS * 10, 110)];

    const merged = mergeLiveTick(points, 120);

    expect(merged).toHaveLength(2);
    expect(merged[1]).toMatchObject({
      time: CHART_BUCKET_MS * 11,
      open: 120,
      high: 120,
      low: 120,
      close: 120,
    });
  });

  it("does not mutate the array it was given", () => {
    freezeAt(CHART_BUCKET_MS * 10 + 1000);
    const points = [bar(CHART_BUCKET_MS * 10, 110)];
    const snapshot = structuredClone(points);

    mergeLiveTick(points, 130);

    expect(points).toEqual(snapshot);
  });

  describe("invariants the chart's in-place update path relies on", () => {
    it("grows the series by at most one bar per tick", () => {
      freezeAt(CHART_BUCKET_MS * 10);
      let points = [bar(CHART_BUCKET_MS * 9, 100)];

      for (const price of [101, 102, 103]) {
        const before = points.length;
        points = mergeLiveTick(points, price);
        expect(points.length - before).toBeLessThanOrEqual(1);
        expect(points.length - before).toBeGreaterThanOrEqual(0);
      }
    });

    it("never disturbs the first bar", () => {
      freezeAt(CHART_BUCKET_MS * 10);
      const first = bar(CHART_BUCKET_MS * 9, 100);
      let points = [first, bar(CHART_BUCKET_MS * 10, 110)];

      points = mergeLiveTick(points, 120);
      vi.setSystemTime(CHART_BUCKET_MS * 11);
      points = mergeLiveTick(points, 130);

      expect(points[0]).toEqual(first);
    });
  });
});
