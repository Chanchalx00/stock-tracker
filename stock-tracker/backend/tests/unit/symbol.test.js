const { requireSymbol, SYMBOL_PATTERN } = require('../../src/utils/symbol');
const { ApiError } = require('../../src/utils/ApiError');

describe('SYMBOL_PATTERN', () => {
  it.each([
    'RELIANCE.NS',
    'HDFCBANK.NS',
    'ICICIBANK.NS',
    'BHARTIARTL.NS',
    'M&M.NS',
    'TCS.NS',
    '^NSEI',
    '^BSESN',
  ])('accepts the real ticker %s', (symbol) => {
    expect(SYMBOL_PATTERN.test(symbol)).toBe(true);
  });

  it.each(['', ' ', 'A B', 'DROP TABLE', 'sym;bol', '../etc/passwd', 'a'.repeat(30)])(
    'rejects %p',
    (symbol) => {
      expect(SYMBOL_PATTERN.test(symbol)).toBe(false);
    },
  );
});

describe('requireSymbol', () => {
  it('uppercases and trims', () => {
    expect(requireSymbol('  reliance.ns  ')).toBe('RELIANCE.NS');
  });

  it('throws a 400 (not a 500) for a non-string symbol', () => {
    expect(() => requireSymbol(123)).toThrow(ApiError);
    expect(() => requireSymbol(123)).toThrow(/required/i);

    try {
      requireSymbol(123);
    } catch (err) {
      expect(err.statusCode).toBe(400);
    }
  });

  it.each([undefined, null, '', '   ', {}, []])('throws a 400 for %p', (value) => {
    try {
      requireSymbol(value);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(400);
    }
  });

  it('rejects a malformed symbol with 400', () => {
    try {
      requireSymbol('not a symbol!');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err.statusCode).toBe(400);
      expect(err.message).toMatch(/not a valid symbol/i);
    }
  });
});
