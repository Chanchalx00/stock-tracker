const axios = require('axios');

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY;

const getQuote = async (symbol) => {
  const { data } = await axios.get(`${FINNHUB_BASE}/quote`, {
    params: { symbol, token: API_KEY },
  });
  return {
    symbol,
    currentPrice: data.c,
    high: data.h,
    low: data.l,
    open: data.o,
    prevClose: data.pc,
    change: +(data.c - data.pc).toFixed(2),
    percentChange: +(((data.c - data.pc) / data.pc) * 100).toFixed(2),
  };
};
const searchSymbol = async (query) => {
  const { data } = await axios.get(`${FINNHUB_BASE}/search`, {
    params: { q: query, token: API_KEY },
  });
  return data.result?.slice(0, 10) || [];
};

module.exports = { getQuote, searchSymbol };