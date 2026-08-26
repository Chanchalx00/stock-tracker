jest.mock('axios');
jest.mock('../../src/config/redis', () => ({
  get: jest.fn(async () => null),
  set: jest.fn(async () => {}),
  del: jest.fn(async () => {}),
  redis: { status: 'end' },
}));

const axios = require('axios');
const { getChartSeries } = require('../../src/services/stockService');

const yahooPayload = {
  chart: {
    result: [
      {
        meta: { symbol: 'RELIANCE.NS', regularMarketPrice: 100, chartPreviousClose: 90 },
        timestamp: [1, 2],
        indicators: { quote: [{ open: [1, 2], high: [2, 3], low: [0, 1], close: [1, 2], volume: [10, 20] }] },
      },
    ],
  },
};

const rangeSentToYahoo = () => axios.get.mock.calls.at(-1)[1].params.range;

beforeEach(() => {
  axios.get.mockReset();
  axios.get.mockResolvedValue({ data: yahooPayload });
});

describe('getChartSeries range handling', () => {
  it.each([
    ['1m', '1mo'],
    ['6m', '6mo'],
    ['3m', '3mo'],
  ])('translates the UI range %s into Yahoo\'s %s', async (uiRange, yahooRange) => {
    await getChartSeries('RELIANCE.NS', { range: uiRange, interval: '1d' });
    expect(rangeSentToYahoo()).toBe(yahooRange);
  });

  it.each(['1d', '5d', '1y', '5y', 'max'])('passes the already-valid range %s through', async (range) => {
    await getChartSeries('RELIANCE.NS', { range, interval: '1d' });
    expect(rangeSentToYahoo()).toBe(range);
  });

  it('normalizes a bare symbol to the NSE suffix', async () => {
    await getChartSeries('RELIANCE', { range: '1y', interval: '1d' });
    expect(axios.get.mock.calls.at(-1)[0]).toContain('RELIANCE.NS');
  });

  it('leaves an index symbol untouched', async () => {
    await getChartSeries('^NSEI', { range: '1y', interval: '1d' });
    expect(axios.get.mock.calls.at(-1)[0]).toContain(encodeURIComponent('^NSEI'));
  });

  it('throws a clear error for a non-string symbol instead of a TypeError', async () => {
    await expect(getChartSeries(123, { range: '1y' })).rejects.toThrow(/Invalid symbol/);
  });
});
