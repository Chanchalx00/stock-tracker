import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
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
  return `$${value.toFixed(2)}`;
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
