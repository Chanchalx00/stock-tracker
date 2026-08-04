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

// Full Nifty 50 constituents — used for the chart page's watchlist sidebar,
// which needs a much bigger browsable pool than the dashboard's curated
// 12-stock "Recommended" list. Kept separate from RECOMMENDED_SYMBOLS so
// expanding this doesn't also make the dashboard fan out to 50 news lookups.
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

// GET /api/stocks/indices
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

// GET /api/stocks/chart/:symbol
exports.getStockChart = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  if (!symbol) throw new ApiError(400, "Symbol is required.");

  const series = await getChartSeries(symbol, { range: "1d", interval: "5m" });
  res.status(200).json(new ApiResponse(200, "Chart series fetched.", series));
});

// GET /api/stocks/recommended
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

// GET /api/stocks/watchlist
// Lighter than /recommended: quotes only, no per-stock news lookup, but
// covers the full Nifty 50 rather than a curated top 12.
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

// GET /api/stocks/logo/:symbol
// Unauthenticated — <img> tags can't attach our JWT, and a company logo
// isn't sensitive data anyway. Deliberately NOT routed through
// asyncHandler/ApiError: this always responds with an image or a bare
// 404, never a JSON error body, since the frontend just reads it as
// an <img src>.
exports.getStockLogo = async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) return res.status(400).end();

    // Always resolve to *something* — a real logo if we can find one,
    // otherwise a generated initials avatar — so the frontend's <img>
    // never actually fails to load (no broken-image icon, no need for
    // client-side text-fallback/truncation logic).
    const logo = (await getLogo(symbol)) || generateFallbackLogo(symbol);

    // Helmet defaults Cross-Origin-Resource-Policy to same-origin, which
    // makes browsers block <img> tags loading this from the frontend's
    // origin. This route serves public logo images, so relax it here only.
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    res.set("Content-Type", logo.contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(logo.data, "base64"));
  } catch (error) {
    logger.error(`Logo fetch failed for ${req.params.symbol}: ${error.message}`, { tag: "LOGO" });
    res.status(404).end();
  }
};

// GET /api/stocks/search?q=AAPL
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

// GET /api/stocks/quote/:symbol
// Deliberately keeps its own try/catch: getQuote() throws a plain Error
// whose message decides whether this is a 404 (symbol not found) or a
// 500 (something upstream actually broke) — that distinction has to be
// made here, not by the generic error middleware.
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

// GET /api/stocks/validate/:symbol
// Also keeps its own try/catch: an invalid symbol is a normal outcome
// here, not an error — the response is always 200 with valid:true/false,
// so it must not be handed to the error middleware at all.
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
