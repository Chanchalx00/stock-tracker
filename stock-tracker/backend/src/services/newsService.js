const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const { get, set } = require("../config/redis");

const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";
const MARKET_NEWS_TTL = 600;
const STOCK_NEWS_TTL = 900;

const NEWS_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

const parser = new XMLParser();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Google News RSS titles are "Headline - Source"; the source is already
// broken out into its own field, so strip the duplicate suffix.
const cleanTitle = (title, source) => {
  if (!source) return title;
  return title.replace(new RegExp(`\\s-\\s${escapeRegex(source)}$`), "").trim();
};

const fetchNews = async (query, limit) => {
  const { data } = await axios.get(GOOGLE_NEWS_RSS, {
    params: { q: query, hl: "en-IN", gl: "IN", ceid: "IN:en" },
    headers: NEWS_HEADERS,
    timeout: 8000,
  });

  const json = parser.parse(data);
  const rawItems = json?.rss?.channel?.item;
  const items = rawItems ? (Array.isArray(rawItems) ? rawItems : [rawItems]) : [];

  return items.slice(0, limit).map((item) => {
    const title = String(item.title ?? "");
    const source = typeof item.source === "string" ? item.source : "Google News";
    return {
      title: cleanTitle(title, source),
      source,
      link: item.link,
      publishedAt: item.pubDate ? new Date(item.pubDate) : null,
    };
  });
};

const getMarketNews = async (limit = 12) => {
  const cacheKey = "news:market";
  const cached = await get(cacheKey);
  if (cached) return cached;

  const news = await fetchNews("India stock market Sensex Nifty BSE NSE", limit);
  await set(cacheKey, news, MARKET_NEWS_TTL);
  return news;
};

const getStockNews = async (query, limit = 6) => {
  const cacheKey = `news:stock:${query.toLowerCase()}:${limit}`;
  const cached = await get(cacheKey);
  if (cached) return cached;

  const news = await fetchNews(`${query} share price`, limit);
  await set(cacheKey, news, STOCK_NEWS_TTL);
  return news;
};

module.exports = { getMarketNews, getStockNews };
