// Pure Express/Socket.IO app construction — no side effects (no DB
// connection, no listening socket, no cron jobs). That's what makes it
// importable from tests via `require('./app')` without also booting a
// real server; src/server.js is the actual process entrypoint that wires
// this app up to a live database and a listening port.
const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const swaggerUi    = require('swagger-ui-express');

const connectDB              = require('./config/db');
const { redis }              = require('./config/redis');
const { initSocket }         = require('./socket/socketManager');
const { errorHandler }       = require('./middleware/error.middleware');
const logger                 = require('./utils/logger');
const swaggerSpec             = require('./config/swagger');

const authRoutes      = require('./routes/auth.routes');
const stockRoutes     = require('./routes/stock.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const alertRoutes     = require('./routes/alert.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const newsRoutes      = require('./routes/news.routes');

const app        = express();
const httpServer = http.createServer(app);

// CLIENT_URL supports a comma-separated list so a staging origin (or a
// second frontend) can be added without a code change — the common case
// of a single origin keeps working exactly as before.
const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim());
const corsOriginCheck = (origin, callback) => {
  // No Origin header (curl, server-to-server, same-origin) — allow.
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  callback(new Error('Not allowed by CORS'));
};

const io = new Server(httpServer, {
  cors: {
    origin:      corsOriginCheck,
    credentials: true,
  },
  // subscribe/unsubscribe payloads are just short symbol arrays — 10KB
  // is generous headroom, and capping it blocks a client from opening a
  // socket purely to push oversized frames at the server.
  maxHttpBufferSize: 1e4,
});

initSocket(io);

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: corsOriginCheck, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

// Tighter than authLimiter — this one triggers an email send, so a loose
// limit would let someone email-bomb a victim's inbox with reset links.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/google', authLimiter);
app.use('/api/auth/refresh', authLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/auth/reset-password', authLimiter);

// ── API DOCS (non-production only) ─────────────────────────────
app.use('/api/docs', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Route not found.' });
  }
  next();
});
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Stocklytics API Docs',
    swaggerOptions: { persistAuthorization: true },
  }),
);

// ── REQUEST LOGGING (one line per request, on response finish) ─
let reqCounter = 0;
app.use((req, res, next) => {
  const reqId = (++reqCounter).toString().padStart(5, '0');
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const msg = `#${reqId} | ${req.method.padEnd(6)} ${req.originalUrl.padEnd(40)} | ${res.statusCode} | ${ms}ms`;
    const meta = { tag: 'REQUEST' };

    if (res.statusCode >= 500) return logger.error(msg, meta);
    if (res.statusCode >= 400) return logger.warn(msg, meta);
    logger.info(msg, meta);
  });

  next();
});

app.use('/api/auth',      authRoutes);
app.use('/api/stocks',    stockRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts',    alertRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/news',      newsRoutes);

// Deep health check — an uptime monitor hitting this should actually
// catch "server process is up but can't reach Mongo" instead of getting
// a false-positive 200 from a handler that doesn't check anything.
app.get('/health', (req, res) => {
  const mongoUp = connectDB.isConnected();
  const redisUp = redis.status === 'ready';

  res.status(mongoUp ? 200 : 503).json({
    status: mongoUp ? 'OK' : 'DEGRADED',
    mongo: mongoUp ? 'up' : 'down',
    // Redis is optional (caching degrades gracefully without it), so it's
    // reported but never fails the overall health check.
    redis: redisUp ? 'up' : 'down',
  });
});

// ── 404 ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── CENTRALIZED ERROR HANDLER ───────────────────────────────────
app.use(errorHandler);

module.exports = { app, httpServer, io };
