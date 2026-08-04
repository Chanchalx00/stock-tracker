import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CookieConsent, { getCookieConsent } from "./CookieConsent";

describe("CookieConsent", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the banner on a first visit (no stored choice)", () => {
    render(<CookieConsent />);
    expect(screen.getByRole("dialog", { name: "Cookie notice" })).toBeInTheDocument();
  });

  it("does not render again once a choice was already stored", () => {
    window.localStorage.setItem("cookie-consent", "accepted");
    render(<CookieConsent />);
    expect(screen.queryByRole("dialog", { name: "Cookie notice" })).not.toBeInTheDocument();
  });

  it("persists 'accepted' and dismisses the banner on Accept all", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(screen.getByRole("button", { name: "Accept all" }));

    expect(getCookieConsent()).toBe("accepted");
    // framer-motion's exit transition means removal isn't synchronous with
    // the click — but how long it takes varies by run (sometimes it's
    // already gone by the time we check), so poll for "gone" rather than
    // requiring the element to still exist at the moment we start waiting
    // (which is what waitForElementToBeRemoved demands, and why it flaked).
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Cookie notice" })).not.toBeInTheDocument();
    });
  });

  it("persists 'necessary' and dismisses the banner on Necessary only", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(screen.getByRole("button", { name: "Necessary only" }));

    expect(getCookieConsent()).toBe("necessary");
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Cookie notice" })).not.toBeInTheDocument();
    });
  });
});

describe("getCookieConsent", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(getCookieConsent()).toBeNull();
  });

  it("returns null for a garbage stored value rather than trusting it", () => {
    window.localStorage.setItem("cookie-consent", "yes-please");
    expect(getCookieConsent()).toBeNull();
  });
});
