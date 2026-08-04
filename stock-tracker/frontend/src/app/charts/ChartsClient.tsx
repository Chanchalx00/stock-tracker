"use client";

import { useState, useEffect, useCallback } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import CandlestickChart from "@/components/CandlestickChart";
import ChartWatchlist from "@/components/ChartWatchlist";
import StockAvatar from "@/components/StockAvatar";
import FadeIn from "@/components/FadeIn";
import { ChangeBadge } from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

import { IconCandlestick, IconSearch } from "@/lib/icons";
import { formatPrice, displaySymbol } from "@/lib/utils";
import { mergeLiveTick } from "@/lib/liveChart";
import { useToast } from "@/hooks/useToast";
import { useStockSocket } from "@/hooks/useStockSocket";
import api from "@/lib/api";
import type { OhlcPoint } from "@/components/PriceChart";

interface SearchResult {
  symbol: string;
  displaySymbol: string;
  description: string;
}

interface QuoteSummary {
  currentPrice: number;
  change: number;
  percentChange: number;
}

const DEFAULT_SYMBOL = "^NSEI";
const DEFAULT_NAME = "NIFTY 50";

export default function ChartsClient() {
  const { toast, error: toastError } = useToast();

  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [name, setName] = useState(DEFAULT_NAME);

  const [points, setPoints] = useState<OhlcPoint[]>([]);
  const [quote, setQuote] = useState<QuoteSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const loadChart = useCallback(
    async (sym: string, displayName: string) => {
      setLoading(true);
      try {
        const [chartRes, quoteRes] = await Promise.all([
          api.get(`/stocks/chart/${encodeURIComponent(sym)}`),
          api.get(`/stocks/quote/${encodeURIComponent(sym)}`),
        ]);

        setPoints(chartRes.data.data?.points || []);
        setQuote({
          currentPrice: quoteRes.data.data.currentPrice,
          change: quoteRes.data.data.change,
          percentChange: quoteRes.data.data.percentChange,
        });
        setSymbol(sym);
        setName(displayName);
      } catch {
        toastError(`Could not load chart for ${sym}.`);
      } finally {
        setLoading(false);
      }
    },
    [toastError],
  );

  useEffect(() => {
    loadChart(DEFAULT_SYMBOL, DEFAULT_NAME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useStockSocket([symbol], (quote) => {
    if (quote.symbol !== symbol) return;
    setQuote({
      currentPrice: quote.currentPrice,
      change: quote.change,
      percentChange: quote.percentChange,
    });
    setPoints((prev) => mergeLiveTick(prev, quote.currentPrice));
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setResults([]);

    try {
      const { data } = await api.get(
        `/stocks/search?q=${encodeURIComponent(query)}`,
      );
      setResults((data.data || []).slice(0, 6));
    } catch {
      toastError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (r: SearchResult) => {
    loadChart(r.symbol, r.description);
    setResults([]);
    setQuery("");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <FadeIn>
            <div className="mb-6 flex items-center gap-2">
              <IconCandlestick
                size={22}
                className="text-emerald-400"
                aria-hidden="true"
              />
              <h1 className="text-2xl font-bold text-white">Charts</h1>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex gap-2 mb-4"
              role="search"
              aria-label="Search a symbol to chart"
            >
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search a symbol to chart (e.g. TCS, INFY)..."
                  leftAddon={<IconSearch size={14} />}
                  aria-label="Search a symbol to chart"
                />
              </div>
              <Button
                type="submit"
                disabled={searching || !query.trim()}
                loading={searching}
                leftIcon={!searching ? <IconSearch size={14} /> : undefined}
              >
                Search
              </Button>
            </form>
          </FadeIn>

          {results.length > 0 && (
            <FadeIn>
              <div className="grid gap-2 sm:grid-cols-2 mb-6">
                {results.map((r) => (
                  <button
                    key={r.symbol}
                    onClick={() => selectResult(r)}
                    className="text-left bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <span className="font-bold text-white text-sm">
                      {r.displaySymbol || r.symbol}
                    </span>
                    <p className="text-xs text-gray-500 truncate">
                      {r.description}
                    </p>
                  </button>
                ))}
              </div>
            </FadeIn>
          )}

          <FadeIn delay={0.05}>
            <div className="flex flex-col lg:flex-row gap-4">
              <ChartWatchlist activeSymbol={symbol} onSelect={loadChart} />

              <div className="flex-1 min-w-0 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4 bg-gray-900">
                  <div className="flex items-center gap-3">
                    <StockAvatar symbol={symbol} size={40} />
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {displaySymbol(symbol)}
                      </h2>
                      <p className="text-xs text-gray-500">{name}</p>
                    </div>
                  </div>

                  {quote && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        {formatPrice(quote.currentPrice)}
                      </p>
                      <div className="mt-1 flex justify-end">
                        <ChangeBadge value={quote.percentChange} />
                      </div>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="h-[480px] flex items-center justify-center bg-[#131722]">
                    <Spinner size="lg" label="Loading chart…" />
                  </div>
                ) : points.length > 1 ? (
                  <CandlestickChart points={points} symbol={symbol} height={480} />
                ) : (
                  <div className="h-[480px] flex items-center justify-center text-sm text-gray-600 bg-[#131722]">
                    No chart data available for {symbol}.
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </ProtectedRoute>
  );
}
