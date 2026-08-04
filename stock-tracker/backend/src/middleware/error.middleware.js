const { ApiError } = require("../utils/ApiError");
const logger = require("../utils/logger");
const sentry = require("../config/sentry");

const normalizeValidationErrors = (errors) => {
  if (!errors) return [];

  if (Array.isArray(errors)) {
    return errors.map((item) =>
      typeof item === "string"
        ? { field: "general", message: item }
        : { field: item?.field ?? "general", message: item?.message ?? String(item) },
    );
  }

  if (typeof errors === "object") {
    return Object.entries(errors).map(([field, msg]) => ({
      field,
      message: Array.isArray(msg) ? msg.join(", ") : String(msg),
    }));
  }

  return [{ field: "general", message: String(errors) }];
};

const sendError = (res, statusCode, message, validationErrors = null) => {
  const errors = validationErrors?.reduce((acc, item) => {
    acc[item.field] = item.message;
    return acc;
  }, {});

  return res.status(statusCode).json({
    success: false,
    message,
    validationErrors: validationErrors || undefined,
    errors: errors && Object.keys(errors).length > 0 ? errors : undefined,
  });
};

// Central error handler — every asyncHandler-wrapped route funnels its
// errors here instead of each controller deciding a status code and
// logging it independently.
// Express only treats a 4-arg function as error-handling middleware, so
// `next` has to stay in the signature even though it's never called.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`, {
      stack: err.stack,
      userId: req.user?._id ?? "unauthenticated",
    });
    sentry.captureException(err, { method: req.method, url: req.originalUrl, userId: req.user?._id });
  } else if (statusCode >= 400) {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${err.message}`, {
      userId: req.user?._id ?? "unauthenticated",
    });
  }

  if (err instanceof ApiError) {
    const validationErrors = normalizeValidationErrors(err.errors);
    return sendError(res, err.statusCode, err.message, validationErrors.length ? validationErrors : null);
  }

  // Mongoose duplicate-key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || { field: 1 })[0];
    return sendError(res, 409, `${field} already exists.`, [
      { field, message: `${field} already exists.` },
    ]);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const validationErrors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, 400, "Validation failed.", validationErrors);
  }

  // Mongoose invalid ObjectId / cast error
  if (err.name === "CastError") {
    return sendError(res, 400, `Invalid ${err.path}.`, null);
  }

  // Never leak internal error details to clients
  return sendError(res, 500, "An internal server error occurred.", null);
};

module.exports = { errorHandler };
