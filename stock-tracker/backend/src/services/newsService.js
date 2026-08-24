const axios = require("axios");
const crypto = require("crypto");
const { XMLParser } = require("fast-xml-parser");
const { get, set } = require("../config/redis");
const { getQuote } = require("./stockService");

const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";
const MARKET_NEWS_TTL = 300; // 5 minutes
const STOCK_NEWS_TTL = 600;

const NEWS_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

const parser = new XMLParser();
const knownNewsIds = new Set();

const STOCK_MAP = [
  { match: /reliance|jio/i, symbol: "RELIANCE.NS", displaySymbol: "RELIANCE", name: "Reliance Industries" },
  { match: /tcs|tata consultancy/i, symbol: "TCS.NS", displaySymbol: "TCS", name: "TCS Ltd." },
  { match: /infosys|infy/i, symbol: "INFY.NS", displaySymbol: "INFY", name: "Infosys Ltd." },
  { match: /hdfc/i, symbol: "HDFCBANK.NS", displaySymbol: "HDFCBANK", name: "HDFC Bank Ltd." },
  { match: /icici/i, symbol: "ICICIBANK.NS", displaySymbol: "ICICIBANK", name: "ICICI Bank Ltd." },
  { match: /sbi|state bank/i, symbol: "SBIN.NS", displaySymbol: "SBIN", name: "State Bank of India" },
  { match: /airtel|bharti/i, symbol: "BHARTIARTL.NS", displaySymbol: "BHARTIARTL", name: "Bharti Airtel" },
  { match: /itc/i, symbol: "ITC.NS", displaySymbol: "ITC", name: "ITC Ltd." },
  { match: /l&t|larsen/i, symbol: "LT.NS", displaySymbol: "LT", name: "Larsen & Toubro" },
  { match: /tata motors|tatamotors/i, symbol: "TATAMOTORS.NS", displaySymbol: "TATAMOTORS", name: "Tata Motors" },
  { match: /tata steel|tatasteel/i, symbol: "TATASTEEL.NS", displaySymbol: "TATASTEEL", name: "Tata Steel" },
  { match: /maruti/i, symbol: "MARUTI.NS", displaySymbol: "MARUTI", name: "Maruti Suzuki" },
  { match: /wipro/i, symbol: "WIPRO.NS", displaySymbol: "WIPRO", name: "Wipro Ltd." },
  { match: /nifty|sensex|bse|nse|market/i, symbol: "^NSEI", displaySymbol: "^NSEI", name: "NIFTY 50" },
];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cleanTitle = (title, source) => {
  if (!source) return title;
  return title.replace(new RegExp(`\\s-\\s${escapeRegex(source)}$`), "").trim();
};

const detectCategory = (title = "") => {
  const lower = title.toLowerCase();
  if (/quarter|q[1-4]|profit|loss|revenue|results|earnings|pat|ebitda/i.test(lower)) {
    return "EARNINGS";
  }
  if (/rbi|gdp|inflation|rate|fed|economy|policy|repo|cpi|wpi|budget/i.test(lower)) {
    return "ECONOMY";
  }
  if (/ipo|listing|subscription|sebi|allotment/i.test(lower)) {
    return "IPO";
  }
  if (/tech|ai|startup|crypto|it|software|tcs|infosys|wipro/i.test(lower)) {
    return "TECH";
  }
  return "MARKET";
};

const generateWhyItMatters = (title, category, displaySymbol) => {
  const lower = title.toLowerCase();
  if (lower.includes("rbi") || lower.includes("rate") || lower.includes("repo") || lower.includes("inflation")) {
    return "Monetary policy moves directly shift borrowing costs, sector valuation multiples, and overall equity market liquidity.";
  }
  if (lower.includes("profit") || lower.includes("q1") || lower.includes("q2") || lower.includes("q3") || lower.includes("q4") || lower.includes("results")) {
    return "Quarterly performance signals fundamental business momentum and triggers institutional price target updates.";
  }
  if (lower.includes("ipo") || lower.includes("listing")) {
    return "Primary market issuances reflect risk appetite and compete for institutional capital allocation.";
  }
  if (displaySymbol && displaySymbol !== "^NSEI") {
    return `Headline news event directly driving price action, volatility, and order flow for ${displaySymbol}.`;
  }
  return "Broad macroeconomic and market sentiment driver influencing systemic index direction and trading volume.";
};

const fetchNews = async (query, limit = 25) => {
  const { data } = await axios.get(GOOGLE_NEWS_RSS, {
    params: { q: query, hl: "en-IN", gl: "IN", ceid: "IN:en" },
    headers: NEWS_HEADERS,
    timeout: 8000,
  });

  const json = parser.parse(data);
  const rawItems = json?.rss?.channel?.item;
  const items = rawItems ? (Array.isArray(rawItems) ? rawItems : [rawItems]) : [];

  const processed = await Promise.all(
    items.slice(0, limit).map(async (item) => {
      const title = String(item.title ?? "");
      const source = typeof item.source === "string" ? item.source : "Google News";
      const cleanedTitle = cleanTitle(title, source);
      const link = item.link || "";
      const id = crypto
        .createHash("md5")
        .update(link || cleanedTitle)
        .digest("hex")
        .substring(0, 12);

      const category = detectCategory(cleanedTitle);
      const matchedStock = STOCK_MAP.find((sm) => sm.match.test(cleanedTitle)) || STOCK_MAP[STOCK_MAP.length - 1];
      const displaySym = matchedStock ? matchedStock.displaySymbol : "^NSEI";
      const stockName = matchedStock ? matchedStock.name : "NIFTY 50";
      const whyItMatters = generateWhyItMatters(cleanedTitle, category, displaySym);

      let quote = null;
      if (matchedStock?.symbol) {
        try {
          quote = await getQuote(matchedStock.symbol);
        } catch {
          quote = null;
        }
      }

      const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

      return {
        id,
        title: cleanedTitle,
        source,
        link,
        category,
        symbol: displaySym,
        stockName,
        whyItMatters,
        currentPrice: quote?.currentPrice ?? null,
        percentChange: quote?.percentChange ?? null,
        fiftyTwoWeekLow: quote?.fiftyTwoWeekLow ?? null,
        fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh ?? null,
        volFactor: quote?.volFactor ?? null,
        publishedAt,
      };
    })
  );

  return processed;
};

const getMarketNews = async (limit = 30) => {
  const cacheKey = "news:market";
  const cached = await get(cacheKey);
  if (cached) {
    cached.forEach((item) => knownNewsIds.add(item.id));
    return cached;
  }

  const news = await fetchNews("India stock market Sensex Nifty BSE NSE business", limit);
  news.forEach((item) => knownNewsIds.add(item.id));
  await set(cacheKey, news, MARKET_NEWS_TTL);
  return news;
};

const checkForNewMarketNews = async () => {
  try {
    const latest = await fetchNews("India stock market Sensex Nifty BSE NSE business", 15);
    const newItems = latest.filter((item) => !knownNewsIds.has(item.id));
    newItems.forEach((item) => knownNewsIds.add(item.id));
    return newItems;
  } catch {
    return [];
  }
};

const getStockNews = async (query, limit = 8) => {
  const cacheKey = `news:stock:${query.toLowerCase()}:${limit}`;
  const cached = await get(cacheKey);
  if (cached) return cached;

  const news = await fetchNews(`${query} share price news`, limit);
  await set(cacheKey, news, STOCK_NEWS_TTL);
  return news;
};

module.exports = { getMarketNews, getStockNews, checkForNewMarketNews };
