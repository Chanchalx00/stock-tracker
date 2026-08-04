module.exports = {
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setupFilesAfterEnv.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 20000,
};
