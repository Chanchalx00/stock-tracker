import * as Sentry from "@sentry/nextjs";

// Server-side (Node.js runtime) init — a no-op unless SENTRY_DSN is set.
// This app has no middleware/edge routes, so there's nothing to register
// for the edge runtime.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

export const onRequestError = Sentry.captureRequestError;
