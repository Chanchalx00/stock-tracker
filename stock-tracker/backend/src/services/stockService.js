const axios = require("axios");
const { get, set } = require("../config/redis");

const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search";
const QUOTE_TTL = 1;
const SEARCH_TTL = 300;

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

const normalizeSymbol = (symbol) => {
  if (typeof symbol !== "string" || !symbol.trim()) {
    throw new Error(`Invalid symbol: ${JSON.stringify(symbol)}`);
  }
  const clean = symbol.toUpperCase().trim();
  if (clean.startsWith("^")) return clean;
  return /\.[A-Z]+$/.test(clean) ? clean : `${clean}.NS`;
};

const getQuote = async (symbol) => {
  const normalized = normalizeSymbol(symbol);
  const cacheKey = `quote:${normalized}`;

  const cached = await get(cacheKey);
  if (cached) return cached;

  let data;
  try {
    ({ data } = await axios.get(`${YAHOO_CHART_URL}/${encodeURIComponent(normalized)}`, {
      params: { interval: "1d", range: "1d" },
      headers: YAHOO_HEADERS,
      timeout: 8000,
    }));
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error(
        `No price data available for symbol "${symbol}". The symbol may be invalid, delisted, or the market may be closed.`,
        { cause: err },
      );
    }
    throw err;
  }

  const result = data?.chart?.result?.[0];
  const meta = result?.meta;

  if (!meta || meta.regularMarketPrice === undefined || meta.regularMarketPrice === null) {
    throw new Error(
      `No price data available for symbol "${symbol}". The symbol may be invalid, delisted, or the market may be closed.`,
    );
  }

  const currentPrice = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
  const change = +(currentPrice - prevClose).toFixed(2);
  const pctChange = prevClose > 0 ? +((change / prevClose) * 100).toFixed(2) : 0;

  const openSeries = result.indicators?.quote?.[0]?.open || [];
  const open = openSeries.length ? openSeries[openSeries.length - 1] : meta.regularMarketOpen ?? null;

  const volume = meta.regularMarketVolume || 0;
  const avgVolume = meta.averageDailyVolume10Day || meta.averageDailyVolume3Month || 0;
  const volFactor = volume > 0 && avgVolume > 0 ? +(volume / avgVolume).toFixed(1) : null;

  const fiftyTwoWeekHigh = meta.fiftyTwoWeekHigh ?? null;
  const fiftyTwoWeekLow = meta.fiftyTwoWeekLow ?? null;

  const quote = {
    symbol: meta.symbol,
    currentPrice,
    high: meta.regularMarketDayHigh ?? null,
    low: meta.regularMarketDayLow ?? null,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    open,
    prevClose,
    volume,
    volFactor,
    change,
    percentChange: pctChange,
    timestamp: new Date(),
  };

  await set(cacheKey, quote, QUOTE_TTL);
  return quote;
};

const SERIES_TTL = 60;

const YAHOO_RANGE_ALIASES = { "1m": "1mo", "3m": "3mo", "6m": "6mo" };
const toYahooRange = (range) => YAHOO_RANGE_ALIASES[String(range).toLowerCase()] ?? range;

const getChartSeries = async (symbol, { range = "1d", interval = "5m", ttl = SERIES_TTL } = {}) => {
  const normalized = normalizeSymbol(symbol);
  const yahooRange = toYahooRange(range);
  const cacheKey = `series:${normalized}:${yahooRange}:${interval}`;

  const cached = await get(cacheKey);
  if (cached) return cached;

  let data;
  try {
    ({ data } = await axios.get(`${YAHOO_CHART_URL}/${encodeURIComponent(normalized)}`, {
      params: { interval, range: yahooRange },
      headers: YAHOO_HEADERS,
      timeout: 8000,
    }));
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error(`No chart data available for symbol "${symbol}".`, { cause: err });
    }
    throw err;
  }

  const result = data?.chart?.result?.[0];
  const meta = result?.meta;

  if (!meta || meta.regularMarketPrice === undefined || meta.regularMarketPrice === null) {
    throw new Error(`No chart data available for symbol "${symbol}".`);
  }

  const timestamps = result.timestamp || [];
  const quoteSeries = result.indicators?.quote?.[0] || {};
  const {
    open: opens = [],
    high: highs = [],
    low: lows = [],
    close: closes = [],
    volume: volumes = [],
  } = quoteSeries;

  const points = timestamps
    .map((t, i) => ({
      time: t * 1000,
      open: opens[i],
      high: highs[i],
      low: lows[i],
      close: closes[i],
      volume: volumes[i] || 0,
    }))
    .filter((p) =>
      [p.open, p.high, p.low, p.close].every((v) => v !== null && v !== undefined),
    );

  const currentPrice = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
  const change = +(currentPrice - prevClose).toFixed(2);
  const pctChange = prevClose > 0 ? +((change / prevClose) * 100).toFixed(2) : 0;

  const series = {
    symbol: meta.symbol,
    name: meta.longName || meta.shortName || meta.symbol,
    currentPrice,
    high: meta.regularMarketDayHigh ?? null,
    low: meta.regularMarketDayLow ?? null,
    prevClose,
    change,
    percentChange: pctChange,
    points,
  };

  await set(cacheKey, series, ttl);
  return series;
};

const getQuoteSafe = async (symbol) => {
  try {
    return await getQuote(symbol);
  } catch {
    return null;
  }
};

const searchSymbol = async (query) => {
  const cacheKey = `search:${query.toLowerCase()}`;

  const cached = await get(cacheKey);
  if (cached) return cached;

  const { data } = await axios.get(YAHOO_SEARCH_URL, {
    params: { q: query, quotesCount: 20, newsCount: 0 },
    headers: YAHOO_HEADERS,
    timeout: 8000,
  });

  const results = (data.quotes || [])
    .filter(
      (q) =>
        q.quoteType === "EQUITY" && (q.exchange === "NSI" || q.exchange === "BSE"),
    )
    .slice(0, 10)
    .map((q) => ({
      symbol: q.symbol,
      displaySymbol: q.symbol,
      description: q.longname || q.shortname || q.symbol,
      type: "Common Stock",
    }));

  await set(cacheKey, results, SEARCH_TTL);
  return results;
};

module.exports = { getQuote, getQuoteSafe, searchSymbol, getChartSeries };
