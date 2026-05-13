const { getQuoteSafe } = require('../services/stockService');
const Watchlist = require('../models/Watchlist');

let io;

const EMIT_INTERVAL_MS = 15_000; 
const intervals = new Map();   
const subscribers = new Map();   

const initSocket = (socketServer) => {
  io = socketServer;

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

   
    socket.on('subscribe', (symbols) => {
      if (!Array.isArray(symbols)) return;
      symbols.forEach((symbol) => {
        const s = symbol.toUpperCase();
        socket.join(`price:${s}`);

        if (!subscribers.has(s)) subscribers.set(s, new Set());
        subscribers.get(s).add(socket.id);

        startEmitting(s);
      });
    });

   
    socket.on('unsubscribe', (symbols) => {
      if (!Array.isArray(symbols)) return;
      symbols.forEach((symbol) => {
        const s = symbol.toUpperCase();
        socket.leave(`price:${s}`);
        if (subscribers.has(s)) {
          subscribers.get(s).delete(socket.id);
          if (subscribers.get(s).size === 0) stopEmitting(s);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
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