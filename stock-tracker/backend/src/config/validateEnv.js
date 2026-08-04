const logger = require('../utils/logger');

// Called once at boot, before the server starts listening. Without this,
// a missing JWT_SECRET or MONGO_URI only surfaces the moment the first
// request that needs it comes in — the process looks "up" (health check
// passes) while every login silently 500s. Fail fast instead.
const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];

// Missing these degrades a specific feature rather than the whole app —
// worth a loud warning, not worth refusing to boot.
const RECOMMENDED = {
  GOOGLE_CLIENT_ID: 'Google sign-in will return 500 on every attempt until this is set.',
  REDIS_URL: 'Quote/news/search caching is disabled without it — falls back to hitting upstream APIs directly.',
};

const validateEnv = () => {
  const missingRequired = REQUIRED.filter((key) => !process.env[key]?.trim());

  if (missingRequired.length > 0) {
    logger.error(
      `Missing required environment variable(s): ${missingRequired.join(', ')}. See backend/.env.example.`,
      { tag: 'SYSTEM' },
    );
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    logger.error(
      'JWT_SECRET is too short (< 32 chars) to be a safe signing key. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
      { tag: 'SYSTEM' },
    );
    process.exit(1);
  }

  for (const [key, consequence] of Object.entries(RECOMMENDED)) {
    if (!process.env[key]?.trim()) {
      logger.warn(`${key} is not set. ${consequence}`, { tag: 'SYSTEM' });
    }
  }
};

module.exports = { validateEnv };
