const jwt = require('jsonwebtoken');
const { getQuoteSafe } = require('../services/stockService');
const { checkForNewMarketNews } = require('../services/newsService');
const { isAccessTokenBlacklisted } = require('../services/token.service');
const logger = require('../utils/logger');

let io;

const EMIT_INTERVAL_MS = 1_000;
const intervals = new Map();
const subscribers = new Map();
const MAX_SYMBOLS_PER_SOCKET = 50;
const MAX_CONNECTIONS_PER_IP = 10;
const connectionsByIp = new Map();

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Not authorized. No token.'));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return next(new Error('Invalid or expired token.'));
  }

  if (decoded.jti && isAccessTokenBlacklisted(decoded.jti)) {
    return next(new Error('Session has been revoked.'));
  }

  socket.data.userId = decoded.id;
  next();
};

const enforcePerIpConnectionLimit = (socket, next) => {
  const ip = socket.handshake.address;
  const count = connectionsByIp.get(ip) || 0;

  if (count >= MAX_CONNECTIONS_PER_IP) {
    return next(new Error('Too many connections from this address.'));
  }

  connectionsByIp.set(ip, count + 1);
  socket.data.ip = ip;
  next();
};

const isValidSymbol = (value) =>
  typeof value === 'string' && value.length > 0 && value.length <= 10;

const initSocket = (socketServer) => {
  io = socketServer;

  io.use(enforcePerIpConnectionLimit);
  io.use(authenticateSocket);

  // Live news broadcast ticker (every 30 seconds)
  setInterval(async () => {
    try {
      const newNews = await checkForNewMarketNews();
      if (newNews && newNews.length > 0 && io) {
        newNews.forEach((item) => {
          io.emit('news:item', item);
        });
      }
    } catch {
      // background polling fail silent
    }
  }, 30_000);

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`, { tag: 'SOCKET', userId: socket.data.userId });

    // Lets broadcastAlert() below reach this specific user.
    socket.join(`user:${socket.data.userId}`);

    socket.on('subscribe', (symbols) => {
      if (!Array.isArray(symbols)) return;

      const alreadyJoined = [...socket.rooms].filter((room) => room.startsWith('price:')).length;
      const room = symbols
        .filter(isValidSymbol)
        .slice(0, Math.max(0, MAX_SYMBOLS_PER_SOCKET - alreadyJoined));

      room.forEach((symbol) => {
        const s = symbol.toUpperCase();
        socket.join(`price:${s}`);

        if (!subscribers.has(s)) subscribers.set(s, new Set());
        subscribers.get(s).add(socket.id);

        startEmitting(s);
      });
    });

    socket.on('unsubscribe', (symbols) => {
      if (!Array.isArray(symbols)) return;
      symbols.filter(isValidSymbol).forEach((symbol) => {
        const s = symbol.toUpperCase();
        socket.leave(`price:${s}`);
        if (subscribers.has(s)) {
          subscribers.get(s).delete(socket.id);
          if (subscribers.get(s).size === 0) stopEmitting(s);
        }
      });
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`, { tag: 'SOCKET' });

      const ip = socket.data.ip;
      const count = connectionsByIp.get(ip) || 1;
      if (count <= 1) connectionsByIp.delete(ip);
      else connectionsByIp.set(ip, count - 1);

      subscribers.forEach((sockets, symbol) => {
        sockets.delete(socket.id);
        if (sockets.size === 0) stopEmitting(symbol);
      });
    });
  });
};

const startEmitting = (symbol) => {
  if (intervals.has(symbol)) return;

  const emitPrice = async () => {
    const quote = await getQuoteSafe(symbol);
    if (quote && io) {
      io.to(`price:${symbol}`).emit(`price:${symbol}`, {
        symbol:        quote.symbol,
        currentPrice:  quote.currentPrice,
        percentChange: quote.percentChange,
        high:          quote.high,
        low:           quote.low,
        volume:        quote.volume,
        change:        quote.change,
        timestamp:     quote.timestamp,
      });
    }
  };

  emitPrice();
  intervals.set(symbol, setInterval(emitPrice, EMIT_INTERVAL_MS));
};

const stopEmitting = (symbol) => {
  if (intervals.has(symbol)) {
    clearInterval(intervals.get(symbol));
    intervals.delete(symbol);
    subscribers.delete(symbol);
  }
};


const broadcastAlert = (userId, alert) => {
  if (io) {
    io.to(`user:${userId}`).emit('alert:triggered', alert);
  }
};

module.exports = { initSocket, broadcastAlert };
