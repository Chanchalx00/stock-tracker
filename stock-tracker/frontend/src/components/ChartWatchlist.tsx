"use client";

import { useEffect, useState } from "react";

import StockAvatar from "@/components/StockAvatar";
import { cn, formatPrice, displaySymbol } from "@/lib/utils";
import { IconChevronDown, IconChevronUp } from "@/lib/icons";
import { useStockSocket } from "@/hooks/useStockSocket";
import api from "@/lib/api";

interface WatchRow {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  percentChange: number;
}

interface ChartWatchlistProps {
  activeSymbol: string;
  onSelect: (symbol: string, name: string) => void;
}

const VISIBLE_STOCK_COUNT = 10;

export default function ChartWatchlist({
  activeSymbol,
  onSelect,
}: ChartWatchlistProps) {
  const [indices, setIndices] = useState<WatchRow[]>([]);
  const [stocks, setStocks] = useState<WatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.get("/stocks/indices"), api.get("/stocks/watchlist")])
      .then(([indicesRes, watchlistRes]) => {
        if (cancelled) return;
        setIndices(indicesRes.data.data || []);
        setStocks(watchlistRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleStocks = showAll ? stocks : stocks.slice(0, VISIBLE_STOCK_COUNT);

  useStockSocket(
    [...indices, ...visibleStocks].map((r) => r.symbol),
    (quote) => {
      const patch = (r: WatchRow): WatchRow =>
        r.symbol === quote.symbol
          ? {
              ...r,
              currentPrice: quote.currentPrice,
              change: quote.change,
              percentChange: quote.percentChange,
            }
          : r;
      setIndices((prev) => prev.map(patch));
      setStocks((prev) => prev.map(patch));
    },
  );

  const renderRow = (row: WatchRow) => {
    const positive = row.change >= 0;
    const active = row.symbol === activeSymbol;
    return (
      <li key={row.symbol}>
        <button
          onClick={() => onSelect(row.symbol, row.name)}
          aria-current={active ? "true" : undefined}
          aria-label={`${row.name}, ${formatPrice(row.currentPrice)}, ${positive ? "up" : "down"} ${Math.abs(row.percentChange).toFixed(2)} percent`}
          className={cn(
            "w-full flex items-center gap-2 px-3.5 py-2 text-left transition-colors",
            "hover:bg-gray-800/60 focus-visible:outline-none focus-visible:bg-gray-800/60",
            active && "bg-emerald-500/10 border-l-2 border-emerald-400",
            !active && "border-l-2 border-transparent",
          )}
        >
          <StockAvatar symbol={row.symbol} size={22} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {displaySymbol(row.symbol)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-medium text-white whitespace-nowrap">
              {formatPrice(row.currentPrice)}
            </p>
            <p
              className={cn(
                "text-[11px] font-medium whitespace-nowrap",
                positive ? "text-emerald-400" : "text-red-400",
              )}
            >
              {positive ? "+" : ""}
              {row.percentChange.toFixed(2)}%
            </p>
          </div>
        </button>
      </li>
    );
  };

  return (
    <aside
      aria-labelledby="chart-watchlist-title"
      className="w-full lg:w-64 shrink-0 bg-[#131722] border border-gray-800 rounded-2xl overflow-hidden"
    >
      <div className="px-3.5 py-3 border-b border-gray-800">
        <h2
          id="chart-watchlist-title"
          className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
        >
          Watchlist
        </h2>
      </div>

      <div className="max-h-[520px] lg:max-h-[640px] overflow-y-auto">
        {loading ? (
          <div
            className="p-3 space-y-2"
            aria-busy="true"
            aria-label="Loading watchlist"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 bg-gray-800/60 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <ul role="list">{indices.map(renderRow)}</ul>
            {indices.length > 0 && stocks.length > 0 && (
              <div className="border-t border-gray-800" />
            )}
            <ul role="list">{visibleStocks.map(renderRow)}</ul>

            {stocks.length > VISIBLE_STOCK_COUNT && (
              <button
                onClick={() => setShowAll((v) => !v)}
                aria-expanded={showAll}
                className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors border-t border-gray-800 focus-visible:outline-none focus-visible:bg-gray-800/60"
              >
                {showAll ? (
                  <>
                    See less
                    <IconChevronUp size={12} aria-hidden="true" />
                  </>
                ) : (
                  <>
                    See more ({stocks.length - VISIBLE_STOCK_COUNT})
                    <IconChevronDown size={12} aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
