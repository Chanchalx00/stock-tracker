const Sentry = require('@sentry/node');
const logger = require('../utils/logger');

const enabled = Boolean(process.env.SENTRY_DSN);

// No-op everywhere when SENTRY_DSN isn't set — a fresh clone or a local
// dev environment works exactly as before, with nothing to configure.
// Set SENTRY_DSN (from a project at sentry.io, or a self-hosted instance)
// to start shipping 5xx errors there instead of only to the log files.
const init = () => {
  if (!enabled) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });

  logger.info('Sentry error tracking enabled', { tag: 'SYSTEM' });
};

const captureException = (err, context) => {
  if (!enabled) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
};

module.exports = { init, captureException, enabled };
