import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Pulls the backend's ApiError message out of an axios rejection, falling
// back to a generic message for network errors / anything unexpected —
// avoids every call site typing its catch block `(err: any)` just to
// reach `err.response?.data?.message`.
export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}

export function formatVolume(value: number): string {
  if (!value || value <= 0) return "—";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function formatPrice(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—";
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function pnlColor(value: number | null | undefined): string {
  if (value == null) return "text-gray-400";
  return value >= 0 ? "text-emerald-400" : "text-red-400";
}

export function pnlBg(value: number | null | undefined): string {
  if (value == null) return "bg-gray-800 border-gray-700";
  return value >= 0
    ? "bg-emerald-500/10 border-emerald-500/20"
    : "bg-red-500/10 border-red-500/20";
}

const INDEX_LABELS: Record<string, string> = {
  NSEI: "NIFTY 50",
  BSESN: "SENSEX",
};

// Yahoo's raw symbols aren't display-ready: indices are prefixed with "^"
// (e.g. "^NSEI") and equities are suffixed with their exchange ("TCS.NS").
export function displaySymbol(symbol: string): string {
  const bare = symbol.replace(/^\^/, "").replace(/\.(NS|BO)$/i, "");
  return INDEX_LABELS[bare] ?? bare;
}

export function formatNewsTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
