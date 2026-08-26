const {
  getQuote,
  searchSymbol,
  getChartSeries,
} = require("../services/stockService");
const { getStockNews } = require("../services/newsService");
const { getLogo, generateFallbackLogo } = require("../services/logoService");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const logger = require("../utils/logger");

const RECOMMENDED_SYMBOLS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd." },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Ltd." },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd." },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd." },
  { symbol: "INFY.NS", name: "Infosys Ltd." },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Ltd." },
  { symbol: "ITC.NS", name: "ITC Ltd." },
  { symbol: "LT.NS", name: "Larsen & Toubro Ltd." },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever Ltd." },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank Ltd." },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints Ltd." },
];

const INDEX_SYMBOLS = [
  { symbol: "^NSEI", name: "NIFTY 50" },
  { symbol: "^BSESN", name: "SENSEX" },
];

const WATCHLIST_SYMBOLS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd." },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Ltd." },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd." },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd." },
  { symbol: "INFY.NS", name: "Infosys Ltd." },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever Ltd." },
  { symbol: "ITC.NS", name: "ITC Ltd." },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Ltd." },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank Ltd." },
  { symbol: "LT.NS", name: "Larsen & Toubro Ltd." },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints Ltd." },
  { symbol: "AXISBANK.NS", name: "Axis Bank Ltd." },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki India Ltd." },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical Industries Ltd." },
  { symbol: "TITAN.NS", name: "Titan Company Ltd." },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement Ltd." },
  { symbol: "NESTLEIND.NS", name: "Nestle India Ltd." },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Ltd." },
  { symbol: "WIPRO.NS", name: "Wipro Ltd." },
  { symbol: "HCLTECH.NS", name: "HCL Technologies Ltd." },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra Ltd." },
  { symbol: "NTPC.NS", name: "NTPC Ltd." },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation of India Ltd." },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd." },
  { symbol: "TATASTEEL.NS", name: "Tata Steel Ltd." },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises Ltd." },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports and SEZ Ltd." },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel Ltd." },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corporation Ltd." },
  { symbol: "COALINDIA.NS", name: "Coal India Ltd." },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv Ltd." },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries Ltd." },
  { symbol: "GRASIM.NS", name: "Grasim Industries Ltd." },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank Ltd." },
  { symbol: "TECHM.NS", name: "Tech Mahindra Ltd." },
  { symbol: "CIPLA.NS", name: "Cipla Ltd." },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories Ltd." },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors Ltd." },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries Ltd." },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals Enterprise Ltd." },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories Ltd." },
  { symbol: "BPCL.NS", name: "Bharat Petroleum Corporation Ltd." },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp Ltd." },
  { symbol: "SBILIFE.NS", name: "SBI Life Insurance Company Ltd." },
  { symbol: "HDFCLIFE.NS", name: "HDFC Life Insurance Company Ltd." },
  { symbol: "SHRIRAMFIN.NS", name: "Shriram Finance Ltd." },
  { symbol: "TATACONSUM.NS", name: "Tata Consumer Products Ltd." },
  { symbol: "LTIM.NS", name: "LTIMindtree Ltd." },
  { symbol: "BEL.NS", name: "Bharat Electronics Ltd." },
];

exports.getIndices = asyncHandler(async (req, res) => {
  const results = await Promise.allSettled(
    INDEX_SYMBOLS.map(async ({ symbol, name }) => {
      const series = await getChartSeries(symbol, { range: "1d", interval: "5m" });
      return { ...series, name };
    }),
  );

  const indices = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  res.status(200).json(new ApiResponse(200, "Indices fetched.", indices));
});

exports.getStockChart = asyncHandler(async (req, res) => {
  const { symbol } = req.params;

  if (!symbol) throw new ApiError(400, "Symbol is required.");

  const asString = (value) => (typeof value === "string" ? value : "");

  let range = asString(req.query.range).toLowerCase() || "1y";
  let interval = asString(req.query.interval).toLowerCase();

  const VALID_RANGES = ["1d", "5d", "1m", "6m", "1y", "5y", "max"];
  if (!VALID_RANGES.includes(range)) {
    range = "1y";
  }

  const VALID_INTERVALS = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"];
  if (interval && !VALID_INTERVALS.includes(interval)) {
    interval = "";
  }

  if (!interval) {
    switch (range) {
      case "1d":
        interval = "5m";
        break;
      case "5d":
        interval = "15m";
        break;
      case "1m":
      case "6m":
      case "1y":
        interval = "1d";
        break;
      case "5y":
      case "max":
        interval = "1wk";
        break;
      default:
        interval = "1d";
    }
  }

  const series = await getChartSeries(symbol, { range, interval });
  res.status(200).json(new ApiResponse(200, "Chart series fetched.", series));
});

exports.getRecommended = asyncHandler(async (req, res) => {
  const results = await Promise.allSettled(
    RECOMMENDED_SYMBOLS.map(async ({ symbol, name }) => {
      const [quote, news] = await Promise.all([
        getQuote(symbol),
        getStockNews(name, 1).catch(() => []),
      ]);
      return {
        symbol,
        name,
        currentPrice: quote.currentPrice,
        high: quote.high,
        low: quote.low,
        open: quote.open,
        prevClose: quote.prevClose,
        volume: quote.volume,
        change: quote.change,
        percentChange: quote.percentChange,
        hasNews: news.length > 0,
      };
    }),
  );

  const stocks = results
    .filter((r) => r.status === "fulfilled" && r.value.currentPrice > 0)
    .map((r) => r.value);

  res
    .status(200)
    .json(new ApiResponse(200, "Recommended stocks fetched.", stocks, { count: stocks.length }));
});

exports.getWatchlist = asyncHandler(async (req, res) => {
  const results = await Promise.allSettled(
    WATCHLIST_SYMBOLS.map(async ({ symbol, name }) => {
      const quote = await getQuote(symbol);
      return {
        symbol,
        name,
        currentPrice: quote.currentPrice,
        change: quote.change,
        percentChange: quote.percentChange,
      };
    }),
  );

  const stocks = results
    .filter((r) => r.status === "fulfilled" && r.value.currentPrice > 0)
    .map((r) => r.value);

  res
    .status(200)
    .json(new ApiResponse(200, "Watchlist symbols fetched.", stocks, { count: stocks.length }));
});

exports.getStockLogo = async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) return res.status(400).end();

    const logo = (await getLogo(symbol)) || generateFallbackLogo(symbol);

    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    res.set("Content-Type", logo.contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(logo.data, "base64"));
  } catch (error) {
    logger.error(`Logo fetch failed for ${req.params.symbol}: ${error.message}`, { tag: "LOGO" });
    res.status(404).end();
  }
};

exports.search = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) {
    throw new ApiError(400, 'Search query "q" is required.');
  }

  const results = await searchSymbol(q.trim());
  res
    .status(200)
    .json(new ApiResponse(200, "Search results fetched.", results, { count: results.length }));
});

exports.getStockQuote = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    if (!symbol) throw new ApiError(400, "Symbol is required.");

    const quote = await getQuote(symbol.toUpperCase());
    res.status(200).json(new ApiResponse(200, "Quote fetched.", quote));
  } catch (error) {
    if (error instanceof ApiError) return next(error);

    if (
      error.message.includes("No price data") ||
      error.message.includes("No data found")
    ) {
      return next(new ApiError(404, error.message));
    }

    next(error);
  }
};

exports.validateSymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) throw new ApiError(400, "Symbol is required.");

    const quote = await getQuote(symbol.toUpperCase());

    res.status(200).json(
      new ApiResponse(
        200,
        "Symbol is valid.",
        {
          symbol: quote.symbol,
          currentPrice: quote.currentPrice,
          high: quote.high,
          low: quote.low,
          percentChange: quote.percentChange,
        },
        { valid: true },
      ),
    );
  } catch {
    res.status(200).json(
      new ApiResponse(
        200,
        `Symbol "${req.params.symbol.toUpperCase()}" not found or has no market data.`,
        null,
        { valid: false },
      ),
    );
  }
};
