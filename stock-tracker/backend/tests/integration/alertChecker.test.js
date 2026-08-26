jest.mock('../../src/services/stockService', () => ({
  getQuote: jest.fn(),
  getQuoteSafe: jest.fn(),
  searchSymbol: jest.fn(),
  getChartSeries: jest.fn(),
}));
jest.mock('../../src/socket/socketManager', () => ({
  initSocket: jest.fn(),
  broadcastAlert: jest.fn(),
}));

const mongoose = require('mongoose');
const { getQuote } = require('../../src/services/stockService');
const { broadcastAlert } = require('../../src/socket/socketManager');
const { checkAlerts } = require('../../src/jobs/alertChecker');
const Alert = require('../../src/models/Alert');

const makeAlert = (overrides = {}) =>
  Alert.create({
    userId: new mongoose.Types.ObjectId(),
    symbol: 'RELIANCE.NS',
    condition: 'GREATER_THAN',
    targetPrice: 100,
    ...overrides,
  });

beforeEach(() => {
  getQuote.mockReset();
  broadcastAlert.mockReset();
});

describe('checkAlerts', () => {
  it('triggers and broadcasts when the price crosses the target', async () => {
    await makeAlert();
    getQuote.mockResolvedValue({ currentPrice: 150 });

    await checkAlerts();

    const stored = await Alert.findOne({ symbol: 'RELIANCE.NS' });
    expect(stored.isTriggered).toBe(true);
    expect(stored.triggeredPrice).toBe(150);
    expect(broadcastAlert).toHaveBeenCalledTimes(1);
  });

  it('leaves an untriggered alert alone when the price is short of the target', async () => {
    await makeAlert();
    getQuote.mockResolvedValue({ currentPrice: 50 });

    await checkAlerts();

    const stored = await Alert.findOne({ symbol: 'RELIANCE.NS' });
    expect(stored.isTriggered).toBe(false);
    expect(broadcastAlert).not.toHaveBeenCalled();
  });

  it('honours LESS_THAN', async () => {
    await makeAlert({ condition: 'LESS_THAN', targetPrice: 100 });
    getQuote.mockResolvedValue({ currentPrice: 80 });

    await checkAlerts();

    expect((await Alert.findOne({})).isTriggered).toBe(true);
  });

  it('broadcasts only once when two sweeps overlap', async () => {
    await makeAlert();
    getQuote.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ currentPrice: 150 }), 50)),
    );

    await Promise.all([checkAlerts(), checkAlerts(), checkAlerts()]);

    expect(broadcastAlert).toHaveBeenCalledTimes(1);
  });

  it('skips a symbol that cannot be quoted without failing the sweep', async () => {
    await makeAlert({ symbol: 'GOOD.NS' });
    await makeAlert({ symbol: 'BAD.NS' });

    getQuote.mockImplementation(async (symbol) => {
      if (symbol === 'BAD.NS') throw new Error('no price data');
      return { currentPrice: 150 };
    });

    await checkAlerts();

    expect((await Alert.findOne({ symbol: 'GOOD.NS' })).isTriggered).toBe(true);
    expect((await Alert.findOne({ symbol: 'BAD.NS' })).isTriggered).toBe(false);
  });

  it('does nothing when there are no active alerts', async () => {
    await checkAlerts();
    expect(getQuote).not.toHaveBeenCalled();
    expect(broadcastAlert).not.toHaveBeenCalled();
  });
});
