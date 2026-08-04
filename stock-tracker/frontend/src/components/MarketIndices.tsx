"use client";

import { useEffect, useState, useCallback } from "react";

import PriceChart, { OhlcPoint } from "@/components/PriceChart";
import { ChangeBadge } from "@/components/ui/Badge";
import { IconLineChart } from "@/lib/icons";
import { formatPrice } from "@/lib/utils";
import { mergeLiveTick } from "@/lib/liveChart";
import { useStockSocket } from "@/hooks/useStockSocket";
import api from "@/lib/api";

interface IndexData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  points: OhlcPoint[];
}

const INDEX_SYMBOLS = ["^NSEI", "^BSESN"];

export default function MarketIndices() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/stocks/indices");
      setIndices(data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useStockSocket(INDEX_SYMBOLS, (quote) => {
    setIndices((prev) =>
      prev.map((idx) =>
        idx.symbol === quote.symbol
          ? {
              ...idx,
              currentPrice: quote.currentPrice,
              change: quote.change,
              percentChange: quote.percentChange,
              points: mergeLiveTick(idx.points, quote.currentPrice),
            }
          : idx,
      ),
    );
  });

  if (loading) {
    return (
      <section
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
        aria-busy="true"
        aria-label="Loading market indices"
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-[250px] animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-800 rounded mb-3" />
            <div className="h-6 w-32 bg-gray-800 rounded mb-4" />
            <div className="h-[130px] w-full bg-gray-800 rounded" />
          </div>
        ))}
      </section>
    );
  }

  if (!indices.length) return null;

  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
      aria-label="Market indices"
    >
      {indices.map((idx) => {
        const positive = idx.change >= 0;
        return (
          <div
            key={idx.symbol}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <IconLineChart
                  size={14}
                  className="text-gray-500 shrink-0"
                  aria-hidden="true"
                />
                <h3 className="font-bold text-white text-sm truncate">
                  {idx.name}
                </h3>
              </div>
              <ChangeBadge value={idx.percentChange} />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="text-xl font-bold text-white"
                aria-label={`${idx.name} at ${formatPrice(idx.currentPrice)}`}
              >
                {idx.currentPrice.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}
              >
                {positive ? "+" : ""}
                {idx.change.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            </div>

            <PriceChart points={idx.points} positive={positive} />
          </div>
        );
      })}
    </section>
  );
}
