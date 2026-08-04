const { MongoMemoryServer } = require('mongodb-memory-server');

// Runs once before the whole test run, in Jest's orchestrator process —
// spins up a real (but in-memory, disposable) MongoDB instance so
// integration tests exercise actual Mongoose/Mongo behavior instead of a
// hand-rolled mock that can silently drift from how the real driver acts.
module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;

  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-only-secret-'.padEnd(64, 'x');
  process.env.JWT_ACCESS_EXPIRY = '15m';
  process.env.JWT_REFRESH_EXPIRY_DAYS = '30';
  process.env.CLIENT_URL = 'http://localhost:3000';
  // Present so auth.controller's googleLogin exercises real verification
  // (and fails with 401 on a garbage token) instead of the "not
  // configured" 500 branch — no real Google project needed for that.
  process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
};
