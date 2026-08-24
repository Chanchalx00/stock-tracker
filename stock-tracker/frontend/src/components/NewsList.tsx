"use client";

import {
  IconExternalLink,
  IconClock,
  IconTrendingUp,
  IconTrendingDown,
  IconActivity,
  IconLightbulb,
  IconZap,
} from "@/lib/icons";
import { formatNewsTime, formatPrice } from "@/lib/utils";
import StockAvatar from "@/components/StockAvatar";

export interface NewsItem {
  id?: string;
  title: string;
  source: string;
  link: string;
  category?: string;
  symbol?: string;
  stockName?: string;
  whyItMatters?: string;
  currentPrice?: number | null;
  percentChange?: number | null;
  fiftyTwoWeekLow?: number | null;
  fiftyTwoWeekHigh?: number | null;
  volFactor?: number | null;
  publishedAt: string | null;
  isNew?: boolean;
}

interface NewsListProps {
  news: NewsItem[];
  loading?: boolean;
  emptyMessage?: string;
  skeletonCount?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  MARKET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  EARNINGS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ECONOMY: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  IPO: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  TECH: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

function formatExactTime(publishedAt: string | null): string {
  if (!publishedAt) return "";
  const date = new Date(publishedAt);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function NewsList({
  news,
  loading = false,
  emptyMessage = "No recent news found.",
  skeletonCount = 6,
}: NewsListProps) {
  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading news">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-800 rounded-full shrink-0" />
              <div className="h-4 w-40 bg-gray-800 rounded" />
            </div>
            <div className="h-5 w-5/6 bg-gray-800 rounded" />
            <div className="h-14 w-full bg-gray-800/60 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!news.length) {
    return (
      <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <p className="text-sm text-gray-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800/60">
      {news.map((item, i) => {
        const cat = item.category?.toUpperCase() || "MARKET";
        const catStyle = CATEGORY_COLORS[cat] || CATEGORY_COLORS.MARKET;
        const exactTime = formatExactTime(item.publishedAt);
        const relativeTime = formatNewsTime(item.publishedAt);

        const sym = item.symbol || "^NSEI";
        const hasPrice = item.currentPrice != null && item.currentPrice > 0;
        const isPos = (item.percentChange ?? 0) >= 0;

        // 52-Week Range position gauge calculation
        const low52 = item.fiftyTwoWeekLow;
        const high52 = item.fiftyTwoWeekHigh;
        let gaugePct = 50;
        if (hasPrice && low52 != null && high52 != null && high52 > low52) {
          gaugePct = Math.min(
            100,
            Math.max(0, ((item.currentPrice! - low52) / (high52 - low52)) * 100),
          );
        }

        // Null when the provider published no average volume to compare against.
        const volFactor = item.volFactor ?? null;

        return (
          <li key={item.id || item.link || item.title || i} className="relative pl-7">
            <span
              className={`absolute left-2.5 top-6 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-gray-950 transition-all ${
                item.isNew
                  ? "bg-emerald-400 ring-4 ring-emerald-500/20 animate-pulse scale-110"
                  : "bg-gray-700"
              }`}
            />

            <div
              className={`group rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
                item.isNew
                  ? "bg-emerald-500/5 border-emerald-500/30 shadow-xl shadow-emerald-950/20"
                  : "bg-gray-900 border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <StockAvatar symbol={sym} size={32} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {sym.replace(/^\^/, "")}
                      </span>
                      {item.stockName && (
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          · {item.stockName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {item.isNew && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black animate-pulse flex items-center gap-1">
                      <IconZap size={10} />
                      FLASH
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${catStyle}`}>
                    {cat}
                  </span>
                  <span className="font-medium text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded-md">
                    {item.source}
                  </span>
                  {exactTime && (
                    <span className="font-mono text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded-md font-bold">
                      {exactTime}
                    </span>
                  )}
                </div>
              </div>

              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.title} — ${item.source}`}
                className="block mb-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <span className="w-8 h-8 rounded-lg bg-gray-800/80 shrink-0 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 border border-gray-700/50 transition-all mt-0.5">
                    <IconExternalLink size={15} aria-hidden="true" />
                  </span>
                </div>
              </a>

              {item.whyItMatters && (
                <div className="mb-4 bg-gray-950/80 border border-gray-800 rounded-xl p-3.5 text-xs text-gray-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400" />
                  <div className="flex items-start gap-2.5">
                    <IconLightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-400 uppercase tracking-wide text-[10px] block mb-0.5">
                        Market Impact
                      </span>
                      <p className="leading-relaxed text-gray-300 font-medium">
                        {item.whyItMatters}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Unique Metrics Bar: Price, Vol Factor, & 52W Range Gauge */}
              <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
                {/* 1. Price & Change */}
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">
                      Price
                    </span>
                    {hasPrice ? (
                      <span className="font-bold text-white font-mono text-sm">
                        {formatPrice(item.currentPrice)}
                      </span>
                    ) : (
                      <span className="text-gray-500 font-mono text-xs">Loading…</span>
                    )}
                  </div>
                  {hasPrice && item.percentChange != null && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold font-mono flex items-center gap-0.5 ${
                        isPos
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {isPos ? (
                        <IconTrendingUp size={11} />
                      ) : (
                        <IconTrendingDown size={11} />
                      )}
                      {isPos ? "+" : ""}
                      {item.percentChange.toFixed(2)}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <IconActivity size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">
                      Vol Factor
                    </span>
                    <span className="font-bold text-white font-mono text-xs flex items-center gap-1">
                      <span>{volFactor !== null ? `${volFactor.toFixed(1)}x Vol` : "—"}</span>
                      {volFactor !== null && volFactor >= 2.0 && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          HIGH
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono font-medium mb-1">
                    <span>52W L: {low52 != null ? `₹${low52.toFixed(0)}` : "—"}</span>
                    <span className="text-gray-300 font-bold">52W Position</span>
                    <span>52W H: {high52 != null ? `₹${high52.toFixed(0)}` : "—"}</span>
                  </div>
                  <div className="relative h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/60 via-amber-500/60 to-emerald-500/60" />
                    <div
                      className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)] -translate-x-1/2 border border-gray-900"
                      style={{ left: `${gaugePct}%` }}
                      title={`Current position: ${gaugePct.toFixed(0)}% of 52W Range`}
                    />
                  </div>
                </div>
              </div>

              {relativeTime && (
                <div className="mt-2.5 flex items-center justify-end text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <IconClock size={11} aria-hidden="true" />
                    <span>{relativeTime}</span>
                  </span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
