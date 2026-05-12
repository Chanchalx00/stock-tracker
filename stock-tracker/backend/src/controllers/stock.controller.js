const {
  getQuote,
  searchSymbol,
  getQuoteSafe,
} = require("../services/stockService");


const RECOMMENDED_SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "NFLX", name: "Netflix Inc." },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "INTC", name: "Intel Corp." },
  { symbol: "BABA", name: "Alibaba Group" },
  { symbol: "UBER", name: "Uber Technologies" },
];

// GET /api/stocks/recommended

exports.getRecommended = async (req, res) => {
  try {
    const results = await Promise.allSettled(
      RECOMMENDED_SYMBOLS.map(async ({ symbol, name }) => {
        const quote = await getQuote(symbol);
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
        };
      }),
    );

    const stocks = results
      .filter((r) => r.status === "fulfilled" && r.value.currentPrice > 0)
      .map((r) => r.value);

    res.status(200).json({ success: true, count: stocks.length, data: stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stocks/search?q=AAPL

exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res
        .status(400)
        .json({ success: false, message: 'Search query "q" is required.' });
    }
    const results = await searchSymbol(q.trim());
    res
      .status(200)
      .json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stocks/quote/:symbol

exports.getStockQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      return res
        .status(400)
        .json({ success: false, message: "Symbol is required." });
    }

    const quote = await getQuote(symbol.toUpperCase());
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    if (
      error.message.includes("No price data") ||
      error.message.includes("No data found")
    ) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stocks/validate/:symbol

exports.validateSymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      return res
        .status(400)
        .json({ success: false, message: "Symbol is required." });
    }

    const quote = await getQuote(symbol.toUpperCase());

    res.status(200).json({
      success: true,
      valid: true,
      data: {
        symbol: quote.symbol,
        currentPrice: quote.currentPrice,
        high: quote.high,
        low: quote.low,
        percentChange: quote.percentChange,
      },
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      valid: false,
      message: `Symbol "${req.params.symbol.toUpperCase()}" not found or has no market data.`,
    });
  }
};
