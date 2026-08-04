"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { IconLineChart } from "@/lib/icons";

interface StockAvatarProps {
  symbol: string;
  size?: number;
  className?: string;
}

export default function StockAvatar({
  symbol,
  size = 36,
  className = "",
}: StockAvatarProps) {
  const [failed, setFailed] = useState(false);
  const isIndex = symbol.startsWith("^");

  // Indices (^NSEI, ^BSESN) aren't companies — there's no logo to fetch,
  // so skip the request entirely and show a distinct chart icon instead.
  if (isIndex) {
    return (
      <div
        aria-hidden="true"
        style={{ width: size, height: size }}
        className={`rounded-full flex items-center justify-center border border-gray-700 shrink-0 bg-indigo-500 ${className}`}
      >
        <IconLineChart
          size={size * 0.5}
          className="text-white"
          aria-hidden="true"
        />
      </div>
    );
  }

  // The backend always resolves to *something* — a real company logo, or
  // a generated initials avatar sized to fit — so this <img> only fails
  // to load if the network/backend itself is unreachable, which this
  // plain gray circle covers as a last resort.
  if (failed) {
    return (
      <div
        aria-hidden="true"
        style={{ width: size, height: size }}
        className={`rounded-full bg-gray-700 border border-gray-700 shrink-0 ${className}`}
      />
    );
  }

  return (
    <img
      src={`${API_BASE_URL}/stocks/logo/${encodeURIComponent(symbol)}`}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`rounded-full bg-white object-contain border border-gray-700 shrink-0 p-1 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
