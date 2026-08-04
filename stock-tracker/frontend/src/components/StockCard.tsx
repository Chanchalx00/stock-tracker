"use client";

import { motion } from "framer-motion";
import { cn, formatPrice, formatVolume } from "@/lib/utils";
import { ChangeBadge } from "@/components/ui/Badge";
import { IconArrowUp, IconArrowDown, IconVolume, IconNews } from "@/lib/icons";
import StockAvatar from "@/components/StockAvatar";

interface StockCardProps {
  symbol: string;
  companyName?: string;
  currentPrice?: number | null;
  percentChange?: number | null;
  high?: number;
  low?: number;
  volume?: number;
  hasNews?: boolean;
  children?: React.ReactNode;
  className?: string;
  asArticle?: boolean;
}

export default function StockCard({
  symbol,
  companyName,
  currentPrice,
  percentChange,
  high,
  low,
  volume,
  hasNews = false,
  children,
  className,
  asArticle = false,
}: StockCardProps) {
  const inner = (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(
        "bg-gray-900 border border-gray-800 rounded-xl p-5",
        "hover:border-gray-700 transition-colors duration-200",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <StockAvatar symbol={symbol} size={36} className="mt-0.5" />
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 font-bold text-white text-base leading-tight">
              <span className="truncate">{symbol}</span>
              {hasNews && (
                <IconNews
                  size={12}
                  className="text-emerald-400 shrink-0"
                  aria-label="Latest news available"
                />
              )}
            </h3>
            {companyName && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {companyName}
              </p>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          {currentPrice != null ? (
            <>
              <p
                className="text-white font-bold font-mono text-base whitespace-nowrap"
                aria-label={`Current price ${formatPrice(currentPrice)}`}
              >
                {formatPrice(currentPrice)}
              </p>
              <div className="mt-1 flex justify-end">
                <ChangeBadge value={percentChange ?? null} />
              </div>
            </>
          ) : (
            <span className="text-gray-600 text-xs" aria-label="Price loading">
              Loading…
            </span>
          )}
        </div>
      </div>

      {(high != null || low != null || volume != null) && (
        <dl
          className="flex items-center justify-between text-xs pt-3 border-t border-gray-800/80 mb-1"
          aria-label="Day statistics"
        >
          {high != null && (
            <div className="flex items-center gap-1">
              <IconArrowUp
                size={11}
                aria-hidden="true"
                className="text-emerald-400 shrink-0"
              />
              <dt className="text-gray-500">H</dt>
              <dd className="text-gray-300 font-medium font-mono whitespace-nowrap">
                {formatPrice(high)}
              </dd>
            </div>
          )}
          {low != null && (
            <div className="flex items-center gap-1">
              <IconArrowDown
                size={11}
                aria-hidden="true"
                className="text-red-400 shrink-0"
              />
              <dt className="text-gray-500">L</dt>
              <dd className="text-gray-300 font-medium font-mono whitespace-nowrap">
                {formatPrice(low)}
              </dd>
            </div>
          )}
          {volume != null && (
            <div className="flex items-center gap-1">
              <IconVolume
                size={11}
                aria-hidden="true"
                className="text-gray-500 shrink-0"
              />
              <dt className="text-gray-500">Vol</dt>
              <dd className="text-gray-300 font-medium font-mono whitespace-nowrap">
                {formatVolume(volume)}
              </dd>
            </div>
          )}
        </dl>
      )}

      {children}
    </motion.div>
  );

  if (asArticle) {
    return <article aria-label={`${symbol} stock card`}>{inner}</article>;
  }
  return inner;
}
