const Redis = require("ioredis");
const logger = require("../utils/logger");

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
});

redis.on("connect", () => logger.info("Redis connected", { tag: "SYSTEM" }));
redis.on("error", (err) =>
  logger.warn(`Redis error (non-fatal): ${err.message}`, { tag: "SYSTEM" }),
);

const get = async (key) => {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

const set = async (key, value, ttlSeconds = 60) => {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Cache write failure is never fatal — the caller already has the value.
  }
};

const del = async (key) => {
  try {
    await redis.del(key);
  } catch {
    // Best-effort invalidation — a stale cache entry expires on its own via TTL.
  }
};

module.exports = { redis, get, set, del };
