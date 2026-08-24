const {
  sma,
  ema,
  rsi,
  rsiSeries,
  macd,
  atr,
  bollinger,
  supportResistance,
  computeTechnicals,
} = require("../../src/services/technicals");

/** Synthetic candles with a controllable close path. */
const candlesFrom = (closes, spread = 2) =>
  closes.map((c, i) => ({
    time: 1700000000000 + i * 86400000,
    open: c,
    high: c + spread / 2,
    low: c - spread / 2,
    close: c,
    volume: 100000,
  }));

describe("Simple and exponential moving averages", () => {
  it("averages the last N values", () => {
    expect(sma([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10)).toBe(5.5);
    expect(sma([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3)).toBe(9);
  });

  it("returns null rather than a partial average when the series is too short", () => {
    expect(sma([1, 2, 3], 10)).toBeNull();
    expect(ema([1, 2, 3], 10)).toBeNull();
  });

  it("returns the constant itself for a flat series", () => {
    expect(ema([7, 7, 7, 7, 7, 7, 7, 7], 5)).toBeCloseTo(7, 10);
  });

  it("matches the simple average's lag on a perfectly linear trend", () => {
    // A known identity: for the standard smoothing constant, EMA(n) and SMA(n) lag
    // a straight line by the same (n-1)/2. Agreement here is evidence the EMA
    // recursion and its SMA seed are both right.
    const rising = Array.from({ length: 60 }, (_, i) => 100 + i);
    expect(ema(rising, 20)).toBeCloseTo(sma(rising, 20), 1);
    expect(sma(rising, 20)).toBeCloseTo(159 - 9.5, 6);
  });

  it("reacts to a fresh move faster than the simple average", () => {
    const flatThenJump = [...Array.from({ length: 40 }, () => 100), ...Array.from({ length: 5 }, () => 120)];
    expect(ema(flatThenJump, 20)).toBeGreaterThan(sma(flatThenJump, 20));
  });
});

describe("RSI (Wilder)", () => {
  // Wilder's own worked example from "New Concepts in Technical Trading Systems".
  const WILDER_CLOSES = [
    44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28,
    46.28, 46.0, 46.03, 46.41, 46.22, 45.64, 46.21, 46.25, 45.71, 46.45, 45.78, 45.35, 44.03, 44.18,
    44.22, 44.57, 43.42, 42.66, 43.13,
  ];

  it("reproduces Wilder's published series", () => {
    const series = rsiSeries(WILDER_CLOSES, 14);
    // The book rounds intermediate averages to 2dp, so allow a small tolerance.
    const expected = [70.46, 66.25, 66.48, 69.35, 66.29, 57.92, 62.88, 63.21, 56.01, 62.34, 54.67, 50.39];
    expected.forEach((want, i) => expect(series[i]).toBeCloseTo(want, 1));
    expect(rsi(WILDER_CLOSES, 14)).toBeCloseTo(37.77, 1);
  });

  it("needs period + 1 closes before producing a value", () => {
    expect(rsi(WILDER_CLOSES.slice(0, 14), 14)).toBeNull();
    expect(rsi(WILDER_CLOSES.slice(0, 15), 14)).not.toBeNull();
  });

  it("pins to 100 when every move is a gain and stays in range otherwise", () => {
    const onlyUp = Array.from({ length: 30 }, (_, i) => 100 + i);
    expect(rsi(onlyUp, 14)).toBe(100);

    const onlyDown = Array.from({ length: 30 }, (_, i) => 100 - i);
    expect(rsi(onlyDown, 14)).toBeCloseTo(0, 6);
  });

  it("is not derived from the latest percentage change", () => {
    // Two series ending in the same daily move but with opposite histories must
    // produce different RSI values. The old implementation could not tell them apart.
    const up = [...Array.from({ length: 30 }, (_, i) => 100 + i), 131];
    const down = [...Array.from({ length: 30 }, (_, i) => 130 - i), 101.9];
    expect(rsi(up, 14)).not.toBeCloseTo(rsi(down, 14), 0);
  });
});

describe("MACD", () => {
  const closes = Array.from({ length: 120 }, (_, i) => 100 + 10 * Math.sin(i / 9) + i * 0.35);

  it("equals EMA(12) minus EMA(26) on the final bar", () => {
    const result = macd(closes);
    expect(result.macd).toBeCloseTo(ema(closes, 12) - ema(closes, 26), 2);
  });

  it("keeps the histogram equal to macd minus signal", () => {
    const result = macd(closes);
    expect(result.histogram).toBeCloseTo(result.macd - result.signal, 2);
  });

  it("reports which side of the signal line it sits on", () => {
    const result = macd(closes);
    expect(["ABOVE_SIGNAL", "BELOW_SIGNAL"]).toContain(result.position);
    expect(result.position).toBe(result.macd > result.signal ? "ABOVE_SIGNAL" : "BELOW_SIGNAL");
  });

  it("locates a real crossover in the series", () => {
    const result = macd(closes);
    expect(["BULLISH", "BEARISH", null]).toContain(result.crossover);
    if (result.crossover) expect(result.barsSinceCrossover).toBeGreaterThanOrEqual(0);
  });

  it("returns null below slow + signal candles", () => {
    expect(macd(closes.slice(0, 30))).toBeNull();
    expect(macd(closes.slice(0, 35))).not.toBeNull();
  });
});

describe("ATR and Bollinger Bands", () => {
  it("recovers a constant true range", () => {
    const flat = Array.from({ length: 20 }, () => ({ high: 102, low: 100, close: 101, open: 101 }));
    expect(atr(flat, 14)).toBeCloseTo(2, 6);
  });

  it("returns null when there are not enough candles", () => {
    expect(atr(candlesFrom([1, 2, 3]), 14)).toBeNull();
  });

  it("centres Bollinger Bands on the simple moving average", () => {
    const closes = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 5);
    const bands = bollinger(closes, 20, 2);
    expect(bands.middle).toBeCloseTo(sma(closes, 20), 2);
    expect(bands.upper).toBeGreaterThan(bands.middle);
    expect(bands.lower).toBeLessThan(bands.middle);
  });

  it("collapses to zero width on a flat series", () => {
    const bands = bollinger(Array.from({ length: 25 }, () => 50), 20, 2);
    expect(bands.upper).toBe(50);
    expect(bands.lower).toBe(50);
    expect(bands.bandwidthPct).toBe(0);
  });
});

describe("Support and resistance from swing pivots", () => {
  it("finds real pivot levels around the current price", () => {
    const zig = [];
    for (let i = 0; i < 60; i += 1) {
      const base = 100 + (Math.floor(i / 10) % 2 ? 8 : 0);
      zig.push({ open: base, high: base + 2, low: base - 2, close: base, volume: 1000 });
    }
    const levels = supportResistance(zig, 105);
    expect(levels.support1).toBeLessThan(105);
    expect(levels.resistance1).toBeGreaterThan(105);
    expect(levels.support1Touches).toBeGreaterThan(1);
  });

  it("reports no levels at all on a monotonic series, which genuinely has no pivots", () => {
    const rising = candlesFrom(Array.from({ length: 40 }, (_, i) => 100 + i * 2));
    const levels = supportResistance(rising, 200);
    expect(levels.pivotCount).toBe(0);
    expect(levels.support1).toBeNull();
    expect(levels.resistance1).toBeNull();
  });

  it("leaves resistance blank after a breakout above every prior pivot", () => {
    // Zigzag to build real pivots, then break out well above all of them.
    const path = [];
    for (let i = 0; i < 50; i += 1) path.push(100 + (Math.floor(i / 5) % 2 ? 8 : 0));
    for (let i = 0; i < 10; i += 1) path.push(120 + i);
    const levels = supportResistance(candlesFrom(path), 130);

    expect(levels.support1).not.toBeNull();
    expect(levels.support1).toBeLessThan(130);
    // Nothing above, so the old behaviour of returning dayHigh × 1.01 is gone.
    expect(levels.resistance1).toBeNull();
  });
});

describe("computeTechnicals — honest gaps", () => {
  const closes = Array.from({ length: 300 }, (_, i) => 100 + 12 * Math.sin(i / 11) + i * 0.2);
  const full = candlesFrom(closes);

  it("computes every indicator when history is sufficient", () => {
    const t = computeTechnicals(full, closes[closes.length - 1]);
    expect(t.candles).toBe(300);
    expect(t.unavailable).toEqual([]);
    for (const key of ["sma20", "sma50", "sma200", "ema20", "rsi14", "atr14"]) {
      expect(t[key]).not.toBeNull();
    }
    expect(t.macd).not.toBeNull();
    expect(t.bollinger).not.toBeNull();
    expect(t.rsiReliability).toBe("normal");
  });

  it("nulls out indicators it cannot compute and names each gap", () => {
    const t = computeTechnicals(full.slice(-40), closes[closes.length - 1]);
    expect(t.sma20).not.toBeNull();
    expect(t.sma50).toBeNull();
    expect(t.sma200).toBeNull();
    expect(t.unavailable.join(" ")).toMatch(/SMA 50 needs 50 daily candles; 40 available/);
    expect(t.unavailable.join(" ")).toMatch(/SMA 200 needs 200 daily candles; 40 available/);
  });

  it("returns nothing but gaps for a barely-listed stock", () => {
    const t = computeTechnicals(full.slice(-8), closes[closes.length - 1]);
    expect(t.sma20).toBeNull();
    expect(t.rsi14).toBeNull();
    expect(t.macd).toBeNull();
    expect(t.levels).toBeNull();
    expect(t.unavailable.length).toBeGreaterThanOrEqual(9);
  });

  it("marks Wilder indicators as limited before they have converged", () => {
    const t = computeTechnicals(full.slice(-40), closes[closes.length - 1]);
    expect(t.rsiReliability).toBe("limited");
    expect(t.atrReliability).toBe("limited");
  });

  it("derives 52-week extremes from the series, not from the current price", () => {
    const t = computeTechnicals(full, closes[closes.length - 1]);
    const year = full.slice(-252);
    expect(t.high52).toBeCloseTo(Math.max(...year.map((c) => c.high)), 2);
    expect(t.low52).toBeCloseTo(Math.min(...year.map((c) => c.low)), 2);
    // The old fallback was current price × 1.18 / × 0.82.
    expect(t.high52).not.toBeCloseTo(t.currentPrice * 1.18, 1);
    expect(t.low52).not.toBeCloseTo(t.currentPrice * 0.82, 1);
  });

  it("ignores candles with missing OHLC values", () => {
    const withHoles = [...full, { time: 1, open: null, high: null, low: null, close: null, volume: 0 }];
    expect(computeTechnicals(withHoles, 100).candles).toBe(300);
  });

  it("survives an empty series without throwing", () => {
    const t = computeTechnicals([], undefined);
    expect(t.candles).toBe(0);
    expect(t.sma20).toBeNull();
    expect(t.unavailable.length).toBeGreaterThan(0);
  });
});
