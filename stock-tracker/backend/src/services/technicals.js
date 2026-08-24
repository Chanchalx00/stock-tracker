

const round = (v, dp = 2) => (typeof v === "number" && Number.isFinite(v) ? Number(v.toFixed(dp)) : null);

const sma = (values, period) => {
  if (!Array.isArray(values) || values.length < period || period <= 0) return null;
  const window = values.slice(-period);
  return window.reduce((a, b) => a + b, 0) / period;
};


const emaSeries = (values, period) => {
  if (!Array.isArray(values) || values.length < period || period <= 0) return [];
  const k = 2 / (period + 1);
  const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const out = [seed];
  for (let i = period; i < values.length; i += 1) {
    out.push(values[i] * k + out[out.length - 1] * (1 - k));
  }
  return out;
};

const ema = (values, period) => {
  const series = emaSeries(values, period);
  return series.length ? series[series.length - 1] : null;
};


const rsiSeries = (closes, period = 14) => {
  if (!Array.isArray(closes) || closes.length < period + 1) return [];

  const gains = [];
  const losses = [];
  for (let i = 1; i < closes.length; i += 1) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const toRsi = (g, l) => {
    if (l === 0) return g === 0 ? 50 : 100;
    const rs = g / l;
    return 100 - 100 / (1 + rs);
  };

  const out = [toRsi(avgGain, avgLoss)];
  for (let i = period; i < gains.length; i += 1) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    out.push(toRsi(avgGain, avgLoss));
  }
  return out;
};

const rsi = (closes, period = 14) => {
  const series = rsiSeries(closes, period);
  return series.length ? series[series.length - 1] : null;
};

/**
 * MACD line, signal line and histogram. The signal is an EMA of the MACD line, so
 * a full signal needs slow + signal candles before it means anything.
 */
const macd = (closes, fast = 12, slow = 26, signalPeriod = 9) => {
  if (!Array.isArray(closes) || closes.length < slow + signalPeriod) return null;

  const fastSeries = emaSeries(closes, fast);
  const slowSeries = emaSeries(closes, slow);

  // Align the two EMA series on the same input indices before subtracting.
  const offset = fastSeries.length - slowSeries.length;
  const macdLine = slowSeries.map((slowVal, i) => fastSeries[i + offset] - slowVal);

  const signalSeries = emaSeries(macdLine, signalPeriod);
  if (!signalSeries.length) return null;

  const sigOffset = macdLine.length - signalSeries.length;
  const histogram = signalSeries.map((sig, i) => macdLine[i + sigOffset] - sig);

  const last = histogram.length - 1;
  const macdValue = macdLine[macdLine.length - 1];
  const signalValue = signalSeries[signalSeries.length - 1];

  // A crossover is a sign change in the histogram, located by scanning back.
  let crossover = null;
  let barsSinceCrossover = null;
  for (let i = last; i > 0; i -= 1) {
    const curr = histogram[i];
    const prev = histogram[i - 1];
    if ((curr > 0 && prev <= 0) || (curr < 0 && prev >= 0)) {
      crossover = curr > 0 ? "BULLISH" : "BEARISH";
      barsSinceCrossover = last - i;
      break;
    }
  }

  return {
    macd: round(macdValue, 3),
    signal: round(signalValue, 3),
    histogram: round(histogram[last], 3),
    // Current side of the signal line, independent of when the last cross happened.
    position: macdValue > signalValue ? "ABOVE_SIGNAL" : "BELOW_SIGNAL",
    crossover,
    barsSinceCrossover,
  };
};

const atr = (candles, period = 14) => {
  if (!Array.isArray(candles) || candles.length < period + 1) return null;

  const trueRanges = [];
  for (let i = 1; i < candles.length; i += 1) {
    const { high, low } = candles[i];
    const prevClose = candles[i - 1].close;
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  let value = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trueRanges.length; i += 1) {
    value = (value * (period - 1) + trueRanges[i]) / period;
  }
  return value;
};

const bollinger = (closes, period = 20, multiplier = 2) => {
  if (!Array.isArray(closes) || closes.length < period) return null;
  const window = closes.slice(-period);
  const mean = window.reduce((a, b) => a + b, 0) / period;
  const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  return {
    middle: round(mean),
    upper: round(mean + multiplier * sd),
    lower: round(mean - multiplier * sd),
    bandwidthPct: mean > 0 ? round(((2 * multiplier * sd) / mean) * 100) : null,
  };
};


const swingLevels = (candles, lookaround = 3, clusterPct = 1.2) => {
  if (!Array.isArray(candles) || candles.length < lookaround * 2 + 1) return { highs: [], lows: [] };

  const rawHighs = [];
  const rawLows = [];

  for (let i = lookaround; i < candles.length - lookaround; i += 1) {
    const window = candles.slice(i - lookaround, i + lookaround + 1);
    const { high, low } = candles[i];
    if (window.every((c) => c.high <= high)) rawHighs.push(high);
    if (window.every((c) => c.low >= low)) rawLows.push(low);
  }

  const cluster = (levels) => {
    const sorted = [...levels].sort((a, b) => a - b);
    const groups = [];
    for (const level of sorted) {
      const last = groups[groups.length - 1];
      if (last && Math.abs(level - last.sum / last.count) / (last.sum / last.count) * 100 <= clusterPct) {
        last.sum += level;
        last.count += 1;
      } else {
        groups.push({ sum: level, count: 1 });
      }
    }
    return groups.map((g) => ({ price: round(g.sum / g.count), touches: g.count }));
  };

  return { highs: cluster(rawHighs), lows: cluster(rawLows) };
};


const supportResistance = (candles, currentPrice) => {
  const { highs, lows } = swingLevels(candles);

  const below = [...lows, ...highs].filter((l) => l.price < currentPrice).sort((a, b) => b.price - a.price);
  const above = [...highs, ...lows].filter((l) => l.price > currentPrice).sort((a, b) => a.price - b.price);

  return {
    support1: below[0] ? below[0].price : null,
    support1Touches: below[0] ? below[0].touches : null,
    support2: below[1] ? below[1].price : null,
    resistance1: above[0] ? above[0].price : null,
    resistance1Touches: above[0] ? above[0].touches : null,
    resistance2: above[1] ? above[1].price : null,
    pivotCount: highs.length + lows.length,
  };
};


const computeTechnicals = (points, currentPrice) => {
  const candles = (points || []).filter(
    (p) => [p.open, p.high, p.low, p.close].every((v) => typeof v === "number" && Number.isFinite(v)),
  );
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume || 0);
  const price = typeof currentPrice === "number" ? currentPrice : closes[closes.length - 1];
  const n = candles.length;

  const unavailable = [];
  const need = (label, minCandles) => {
    if (n < minCandles) {
      unavailable.push(`${label} needs ${minCandles} daily candles; ${n} available`);
      return false;
    }
    return true;
  };

  const sma20 = need("SMA 20", 20) ? round(sma(closes, 20)) : null;
  const sma50 = need("SMA 50", 50) ? round(sma(closes, 50)) : null;
  const sma200 = need("SMA 200", 200) ? round(sma(closes, 200)) : null;
  const ema20 = need("EMA 20", 20) ? round(ema(closes, 20)) : null;
  const rsi14 = need("RSI 14", 15) ? round(rsi(closes, 14)) : null;
  const macdResult = need("MACD 12/26/9", 35) ? macd(closes) : null;
  const atr14 = need("ATR 14", 15) ? round(atr(candles, 14)) : null;
  const bands = need("Bollinger 20", 20) ? bollinger(closes, 20) : null;

  const levels = n >= 15 ? supportResistance(candles, price) : null;
  if (!levels) unavailable.push(`Swing support/resistance needs 15 daily candles; ${n} available`);

  const avgVolume20 = volumes.length >= 20 ? Math.round(sma(volumes, 20)) : null;
  const latestVolume = volumes.length ? volumes[volumes.length - 1] : null;
  const relativeVolume =
    avgVolume20 && latestVolume && avgVolume20 > 0 ? round(latestVolume / avgVolume20) : null;
  if (!avgVolume20) unavailable.push(`Relative volume needs 20 daily candles; ${n} available`);

  // 52-week extremes measured from the series itself rather than a vendor field.
  const yearCandles = candles.slice(-252);
  const high52 = yearCandles.length ? round(Math.max(...yearCandles.map((c) => c.high))) : null;
  const low52 = yearCandles.length ? round(Math.min(...yearCandles.map((c) => c.low))) : null;
  const pctFrom52High = high52 && price ? round(((price - high52) / high52) * 100) : null;
  const pctFrom52Low = low52 && price ? round(((price - low52) / low52) * 100) : null;

  const atrPct = atr14 && price ? round((atr14 / price) * 100) : null;

  return {
    candles: n,
    firstCandle: candles.length ? candles[0].time : null,
    lastCandle: candles.length ? candles[candles.length - 1].time : null,
    currentPrice: round(price),

    sma20,
    sma50,
    sma200,
    ema20,
    rsi14,
    // Wilder smoothing needs roughly 100 candles to settle; say so when it hasn't.
    rsiReliability: rsi14 === null ? null : n >= 100 ? "normal" : "limited",
    macd: macdResult,
    atr14,
    atrPct,
    atrReliability: atr14 === null ? null : n >= 100 ? "normal" : "limited",
    bollinger: bands,

    levels,
    high52,
    low52,
    pctFrom52High,
    pctFrom52Low,

    latestVolume,
    avgVolume20,
    relativeVolume,

    unavailable,
  };
};

module.exports = {
  sma,
  ema,
  emaSeries,
  rsi,
  rsiSeries,
  macd,
  atr,
  bollinger,
  swingLevels,
  supportResistance,
  computeTechnicals,
};
