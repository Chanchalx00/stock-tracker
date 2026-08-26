const { ApiError } = require('./ApiError');

const SYMBOL_PATTERN = /^\^?[A-Za-z0-9&-]{1,20}(\.[A-Za-z]{1,4})?$/;

const requireSymbol = (value, field = 'symbol') => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, 'Symbol is required.', [
      { field, message: 'Symbol is required and must be a string.' },
    ]);
  }

  const symbol = value.trim().toUpperCase();

  if (!SYMBOL_PATTERN.test(symbol)) {
    throw new ApiError(400, `"${value}" is not a valid symbol.`, [
      { field, message: `"${value}" is not a valid symbol.` },
    ]);
  }

  return symbol;
};

module.exports = { requireSymbol, SYMBOL_PATTERN };
