import * as Sentry from "@sentry/nextjs";

// Client-side (browser) init — a no-op unless NEXT_PUBLIC_SENTRY_DSN is
// set. Public because it's baked into the client bundle at build time,
// same as NEXT_PUBLIC_API_URL — a Sentry DSN is meant to be public (it
// only accepts events, it can't read anything back).
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
