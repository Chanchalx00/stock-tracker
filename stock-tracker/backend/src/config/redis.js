const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
});

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) =>
  console.warn("Redis error (non-fatal):", err.message),
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
  } catch {}
};

const del = async (key) => {
  try {
    await redis.del(key);
  } catch {}
};

module.exports = { redis, get, set, del };
