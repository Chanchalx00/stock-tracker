require('dotenv').config({ quiet: true });
const { validateEnv } = require('./config/validateEnv');
validateEnv();
const sentry = require('./config/sentry');
sentry.init();

const { httpServer } = require('./app');
const connectDB             = require('./config/db');
const { startAlertChecker } = require('./jobs/alertChecker');
const logger                = require('./utils/logger');

process.on('uncaughtException', (err) => sentry.captureException(err));
process.on('unhandledRejection', (reason) => sentry.captureException(reason));

connectDB();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { tag: 'SYSTEM' });
  startAlertChecker();
});
