import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Stocklytics collects, why, and how to request deletion.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 30, 2026">
      <p>
        This is a plain-language description of what Stocklytics actually
        does with your data, kept in sync with the code rather than written
        as boilerplate. It isn&apos;t a substitute for legal advice — if
        you&apos;re relying on this for a real business, have it reviewed by
        a lawyer.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account info:</strong> name and email, always. A password
          (stored as a bcrypt hash, never in plain text) if you sign up
          directly, or nothing if you sign in with Google — in that case we
          also store the profile photo Google shares with us.
        </li>
        <li>
          <strong>App data:</strong> your watchlist symbols, portfolio
          holdings (symbol, quantity, buy price), and price alerts —
          everything you explicitly add.
        </li>
        <li>
          <strong>Nothing else, by default.</strong> No analytics or
          advertising cookies are set unless a future version of this app
          adds them, in which case the cookie banner on first visit
          governs that.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        One cookie: an httpOnly session cookie that keeps you signed in.
        JavaScript can never read it (that&apos;s the point — it&apos;s what
        keeps a token thief who compromises the page from also stealing your
        session). It&apos;s strictly necessary for the app to function and
        isn&apos;t used for tracking.
      </p>

      <h2>Third parties</h2>
      <ul>
        <li>
          <strong>Market data</strong> is fetched from Yahoo Finance by
          symbol — no account information is sent to them.
        </li>
        <li>
          <strong>Google Sign-In</strong>, if you use it, shares your name,
          email, and profile photo with us per Google&apos;s own sign-in
          flow.
        </li>
        <li>
          <strong>Error tracking</strong> (Sentry) may be enabled in
          production to capture unhandled errors — request path and user ID
          may be attached to an error report so we can debug it. Purely
          diagnostic, not used for tracking.
        </li>
        <li>
          <strong>Email</strong> is sent (via whatever SMTP provider is
          configured) only when you request a password reset, straight to
          the address on your account.
        </li>
      </ul>

      <h2>Deleting your data</h2>
      <p>
        There&apos;s no self-service delete button yet. Email the address
        below and we&apos;ll remove your account and everything tied to
        it.
      </p>

      <h2>Contact</h2>
      <p>Questions about this policy: reach out via the project&apos;s GitHub repository.</p>
    </LegalPage>
  );
}
