"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { IconLineChart } from "@/lib/icons";

interface StockAvatarProps {
  symbol: string;
  logoUrl?: string;
  size?: number;
  className?: string;
}

export default function StockAvatar({
  symbol,
  logoUrl,
  size = 36,
  className = "",
}: StockAvatarProps) {
  const [failed, setFailed] = useState(false);
  const cleanSym = symbol ? symbol.replace(/\.(NS|BO)$/i, "").toUpperCase() : "STOCK";
  const isIndex = cleanSym.startsWith("^");

  if (isIndex) {
    return (
      <div
        aria-hidden="true"
        style={{ width: size, height: size }}
        className={`rounded-full flex items-center justify-center border border-gray-700 shrink-0 bg-indigo-500/20 text-indigo-400 ${className}`}
      >
        <IconLineChart
          size={size * 0.5}
          className="text-indigo-400"
          aria-hidden="true"
        />
      </div>
    );
  }

  const initialLetters = cleanSym.slice(0, 2);

  if (failed) {
    return (
      <div
        aria-hidden="true"
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
        className={`rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 border border-emerald-400/30 flex items-center justify-center font-bold text-white uppercase shrink-0 shadow-sm ${className}`}
      >
        {initialLetters}
      </div>
    );
  }

  const imageSrc = logoUrl || `${API_BASE_URL}/stocks/logo/${encodeURIComponent(cleanSym)}`;

  return (
    <img
      src={imageSrc}
      alt={`${cleanSym} logo`}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`rounded-xl bg-white object-contain border border-gray-700 shrink-0 p-1 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
