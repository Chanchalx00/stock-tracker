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
