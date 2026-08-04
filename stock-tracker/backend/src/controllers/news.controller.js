const { getMarketNews, getStockNews } = require("../services/newsService");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

// GET /api/news
exports.getMarket = asyncHandler(async (req, res) => {
  const news = await getMarketNews();
  res
    .status(200)
    .json(new ApiResponse(200, "Market news fetched.", news, { count: news.length }));
});

// GET /api/news/stock/:symbol?name=Company%20Name
exports.getForStock = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  if (!symbol) throw new ApiError(400, "Symbol is required.");

  const query = req.query.name?.trim() || symbol;
  const news = await getStockNews(query);
  res
    .status(200)
    .json(new ApiResponse(200, "Stock news fetched.", news, { count: news.length }));
});
