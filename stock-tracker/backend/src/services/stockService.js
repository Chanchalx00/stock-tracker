const axios = require('axios');

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const getApiKey = () => {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY not set in environment variables');
  return key;
};

const getQuote = async (symbol) => {
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
      `No price data available for symbol "${symbol}". The symbol may be invalid, delisted, or the market may be closed.`
    );
  }
  const prevClose = data.pc || data.c;
  const change    = +(data.c - prevClose).toFixed(2);
  const pctChange = prevClose > 0 ? +((change / prevClose) * 100).toFixed(2) : 0;
 
  return {
    symbol:        symbol.toUpperCase(),
    currentPrice:  data.c,
    high:          data.h,
    low:           data.l,
    open:          data.o,
    prevClose:     data.pc,
    volume:        data.v || 0,
    change,
    percentChange: pctChange,
    timestamp:     new Date(),
  };
};
const getQuoteSafe = async (symbol) => {
  try {
    return await getQuote(symbol);
  } catch {
    return null;
  }
};
const searchSymbol = async (query) => {
  const { data } = await axios.get(`${FINNHUB_BASE}/search`, {
    params: { q: query, token: getApiKey() },
    timeout: 8000,
  });
  return data.result?.slice(0, 10) || [];
};
 
module.exports = { getQuote, getQuoteSafe, searchSymbol };