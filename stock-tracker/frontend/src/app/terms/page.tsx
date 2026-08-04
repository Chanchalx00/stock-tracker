import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using Stocklytics.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="July 30, 2026">
      <p>
        Plain-language terms for using Stocklytics. Not a substitute for
        legal advice.
      </p>

      <h2>Not investment advice</h2>
      <p>
        Market data, prices, and portfolio figures in this app are for
        informational purposes only. Nothing here is a recommendation to
        buy or sell any security. Prices come from a third-party data
        provider and may be delayed or inaccurate — verify anything before
        acting on it.
      </p>

      <h2>Your account</h2>
      <p>
        You&apos;re responsible for keeping your credentials safe and for
        activity that happens under your account. Let us know if you
        believe it&apos;s been compromised.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Don&apos;t use the app to do anything illegal, try to break or
        overload it, or access data that isn&apos;t yours.
      </p>

      <h2>Availability</h2>
      <p>
        This is provided as-is, without uptime guarantees. Market data
        depends on an upstream third party and can be delayed, wrong, or
        unavailable.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may change as the app changes. Continuing to use it
        after an update means you accept the current version.
      </p>

      <h2>Contact</h2>
      <p>Questions: reach out via the project&apos;s GitHub repository.</p>
    </LegalPage>
  );
}
