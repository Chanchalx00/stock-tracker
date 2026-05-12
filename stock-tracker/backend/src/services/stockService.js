const axios = require("axios");
const { get, set } = require("../config/redis");

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const QUOTE_TTL = 60;
const SEARCH_TTL = 300;

const getApiKey = () => {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY not set in environment variables");
  return key;
};

const getQuote = async (symbol) => {
  const cacheKey = `quote:${symbol.toUpperCase()}`;

  const cached = await get(cacheKey);
  if (cached) {
    console.log("CACHE HIT:", cacheKey);
    return cached;
  }
  console.log("CACHE MISS:", cacheKey);

  const { data } = await axios.get(`${FINNHUB_BASE}/quote`, {
    params: { symbol: symbol.toUpperCase(), token: getApiKey() },
    timeout: 8000,
  });

  if (
    !data ||
    data.c === undefined ||
    data.c === null ||
    data.c === 0 ||
    (data.h === 0 && data.l === 0 && data.o === 0)
  ) {
    throw new Error(
      `No price data available for symbol "${symbol}". The symbol may be invalid, delisted, or the market may be closed.`,
    );
  }

  const prevClose = data.pc || data.c;
  const change = +(data.c - prevClose).toFixed(2);
  const pctChange =
    prevClose > 0 ? +((change / prevClose) * 100).toFixed(2) : 0;

  const quote = {
    symbol: symbol.toUpperCase(),
    currentPrice: data.c,
    high: data.h,
    low: data.l,
    open: data.o,
    prevClose: data.pc,
    volume: data.v || 0,
    change,
    percentChange: pctChange,
    timestamp: new Date(),
  };

  await set(cacheKey, quote, QUOTE_TTL);
  return quote;
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

  const { data } = await axios.get(`${FINNHUB_BASE}/search`, {
    params: { q: query, token: getApiKey() },
    timeout: 8000,
  });

  const results = data.result?.slice(0, 10) || [];
  await set(cacheKey, results, SEARCH_TTL);
  return results;
};

module.exports = { getQuote, getQuoteSafe, searchSymbol };
