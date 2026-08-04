require('dotenv').config({ quiet: true }); // silences dotenv's own promotional "tip" banner
const { validateEnv } = require('./config/validateEnv');
validateEnv();

// Initialized before anything else is required, per Sentry's own setup
// guidance — a no-op unless SENTRY_DSN is set.
const sentry = require('./config/sentry');
sentry.init();

const { httpServer } = require('./app');
const connectDB             = require('./config/db');
const { startAlertChecker } = require('./jobs/alertChecker');
const logger                = require('./utils/logger');

// Winston already logs these (handleExceptions/handleRejections on every
// transport); this just also gets them to Sentry when it's configured.
process.on('uncaughtException', (err) => sentry.captureException(err));
process.on('unhandledRejection', (reason) => sentry.captureException(reason));

connectDB();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { tag: 'SYSTEM' });
  startAlertChecker();
});
