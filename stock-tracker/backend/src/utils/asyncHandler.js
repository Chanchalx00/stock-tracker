// Wraps async controller functions so thrown/rejected errors are
// automatically forwarded to Express's error-handling middleware instead
// of needing a try/catch in every controller.
//
// Usage: router.get('/', asyncHandler(async (req, res) => { ... }));
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };
