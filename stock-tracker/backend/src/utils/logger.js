const fs = require("fs");
const path = require("path");
const winston = require("winston");

// Prevent log injection attacks (\n fake entries, \r overwrite, etc.)
// when a value that ends up in a log line originates from user input.
const sanitizeLog = (value) =>
  String(value ?? "")
    .replace(/\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_LOG_FILES = 5;

const LOG_DIR = process.env.LOG_DIR || "logs";
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const APP_LOG_FILE = path.join(LOG_DIR, "app.log");
const ERROR_LOG_FILE = path.join(LOG_DIR, "error.log");

const LEVEL_BADGE = {
  error: "ERROR",
  warn: "WARN ",
  info: "INFO ",
  http: "HTTP ",
  debug: "DEBUG",
};

// [2026-05-11 10:30:45]  INFO   [REQUEST] POST /login
const consoleFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, stack, tag, ...meta }) => {
    const badge = LEVEL_BADGE[level] ?? level.toUpperCase().padEnd(5);
    const tagStr = tag ? `[${tag}]  ` : "";
    const metaStr = Object.keys(meta).length
      ? "  " + Object.entries(meta).map(([k, v]) => `${k}=${v}`).join(" ")
      : "";
    const base = `[${timestamp}]  ${badge}  ${tagStr}${message}${metaStr}`;
    return stack ? `${base}\n${stack}` : base;
  }),
  winston.format.colorize({ all: true }),
);

const fileFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  defaultMeta: { service: "stock-tracker-backend" },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true,
    }),
    new winston.transports.File({
      filename: APP_LOG_FILE,
      format: fileFormat,
      maxsize: MAX_LOG_SIZE,
      maxFiles: MAX_LOG_FILES,
      tailable: true,
      handleExceptions: true,
      handleRejections: true,
    }),
    new winston.transports.File({
      filename: ERROR_LOG_FILE,
      level: "error",
      format: fileFormat,
      maxsize: MAX_LOG_SIZE,
      maxFiles: MAX_LOG_FILES,
      tailable: true,
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
module.exports.sanitizeLog = sanitizeLog;
