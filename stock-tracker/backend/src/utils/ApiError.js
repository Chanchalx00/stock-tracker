// Custom error class for all operational errors in the application.
// Throw this instead of plain Error objects in services and controllers —
// asyncHandler forwards it to the centralized error middleware, which
// knows how to turn it into the right status code and response shape.
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { ApiError };
