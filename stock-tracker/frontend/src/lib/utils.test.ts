import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatVolume,
  formatPct,
  pnlColor,
  displaySymbol,
  formatNewsTime,
  parseIpoDate,
  getAllotmentState,
} from "./utils";

describe("formatPrice", () => {
  it("formats a positive number as INR with 2 decimals", () => {
    expect(formatPrice(1234.5)).toBe("₹1,234.50");
  });

  it("returns an em dash for null/undefined/NaN", () => {
    expect(formatPrice(null)).toBe("—");
    expect(formatPrice(undefined)).toBe("—");
    expect(formatPrice(NaN)).toBe("—");
  });

  it("formats zero as a real price, not a missing value", () => {
    expect(formatPrice(0)).toBe("₹0.00");
  });
});

describe("formatVolume", () => {
  it("abbreviates billions/millions/thousands", () => {
    expect(formatVolume(2_500_000_000)).toBe("2.5B");
    expect(formatVolume(3_200_000)).toBe("3.2M");
    expect(formatVolume(4_500)).toBe("5K"); // rounds to 0 decimals
  });

  it("returns the raw number below 1000", () => {
    expect(formatVolume(999)).toBe("999");
  });

  it("returns an em dash for zero or negative volume", () => {
    expect(formatVolume(0)).toBe("—");
    expect(formatVolume(-5)).toBe("—");
  });
});

describe("formatPct", () => {
  it("prefixes a plus sign on non-negative values", () => {
    expect(formatPct(1.2345)).toBe("+1.23%");
    expect(formatPct(0)).toBe("+0.00%");
  });

  it("keeps the native minus sign on negative values (no double sign)", () => {
    expect(formatPct(-2.5)).toBe("-2.50%");
  });

  it("returns an em dash for null/undefined/NaN", () => {
    expect(formatPct(null)).toBe("—");
    expect(formatPct(undefined)).toBe("—");
  });
});

describe("pnlColor", () => {
  it("is emerald for gains and zero, red for losses, gray for unknown", () => {
    expect(pnlColor(10)).toBe("text-emerald-400");
    expect(pnlColor(0)).toBe("text-emerald-400");
    expect(pnlColor(-1)).toBe("text-red-400");
    expect(pnlColor(null)).toBe("text-gray-400");
  });
});

describe("displaySymbol", () => {
  it("maps known index tickers to their display name", () => {
    expect(displaySymbol("^NSEI")).toBe("NIFTY 50");
    expect(displaySymbol("^BSESN")).toBe("SENSEX");
  });

  it("strips the exchange suffix from equities", () => {
    expect(displaySymbol("TCS.NS")).toBe("TCS");
    expect(displaySymbol("RELIANCE.BO")).toBe("RELIANCE");
  });

  it("passes through a symbol with no prefix/suffix unchanged", () => {
    expect(displaySymbol("AAPL")).toBe("AAPL");
  });
});

describe("formatNewsTime", () => {
  it("returns an empty string for missing or invalid input", () => {
    expect(formatNewsTime(null)).toBe("");
    expect(formatNewsTime(undefined)).toBe("");
    expect(formatNewsTime("not-a-date")).toBe("");
  });

  it("renders a recent timestamp as minutes/hours ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatNewsTime(fiveMinAgo)).toBe("5m ago");

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(formatNewsTime(threeHoursAgo)).toBe("3h ago");
  });
});

describe("parseIpoDate", () => {
  it("parses the format Chittorgarh publishes", () => {
    const d = parseIpoDate("Fri, Aug 28, 2026");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(7);
    expect(d!.getDate()).toBe(28);
  });

  it("keeps the calendar day it was given, not a UTC-shifted one", () => {
    const d = parseIpoDate("Tue, Sep 1, 2026");
    expect(d!.getDate()).toBe(1);
    expect(d!.getMonth()).toBe(8);
  });

  it("returns null for placeholders and junk", () => {
    for (const v of [null, undefined, "", "   ", "TBA", "Not announced", "N/A", "-", "banana"]) {
      expect(parseIpoDate(v)).toBeNull();
    }
  });
});

describe("getAllotmentState", () => {
  const on = (iso: string) => new Date(`${iso}T12:00:00`);

  it("reports done once the allotment date has passed", () => {
    expect(getAllotmentState("Fri, Aug 28, 2026", on("2026-08-29"))).toBe("done");
    expect(getAllotmentState("Fri, Aug 28, 2026", on("2026-09-15"))).toBe("done");
  });

  it("reports today on the allotment date itself", () => {
    expect(getAllotmentState("Fri, Aug 28, 2026", on("2026-08-28"))).toBe("today");
  });

  it("reports pending before the allotment date", () => {
    expect(getAllotmentState("Fri, Aug 28, 2026", on("2026-08-25"))).toBe("pending");
    expect(getAllotmentState("Tue, Sep 1, 2026", on("2026-08-25"))).toBe("pending");
  });

  it("reports unknown when no usable date was published", () => {
    expect(getAllotmentState(undefined, on("2026-08-25"))).toBe("unknown");
    expect(getAllotmentState("TBA", on("2026-08-25"))).toBe("unknown");
  });

  it("does not flip a day early for a late-evening check", () => {
    const lateOnTheDayBefore = new Date("2026-08-27T23:30:00");
    expect(getAllotmentState("Fri, Aug 28, 2026", lateOnTheDayBefore)).toBe("pending");
  });
});
