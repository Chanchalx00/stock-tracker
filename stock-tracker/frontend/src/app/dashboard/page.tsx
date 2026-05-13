"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import StockDetailModal from "@/components/StockDetailModal";
import Toast from "@/components/Toast";
import StockCard from "@/components/StockCard";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

import {
  IconSearch,
  IconTrendingUp,
  IconRefresh,
  IconPlus,
  IconEye,
  IconClose,
  IconBarChart,
  IconBookmarkAdd,
  IconSearchEmpty,
  IconActivity,
} from "@/lib/icons";

import { useToast } from "@/hooks/useToast";
import { useStockSocket } from "@/hooks/useStockSocket";

import api from "@/lib/api";

interface StockData {
  symbol: string;
  name?: string;
  currentPrice: number;
  high: number;
  low: number;
  open: number;
  prevClose?: number;
  volume: number;
  change: number;
  percentChange: number;
}

interface SearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const { toast, success, error: toastError } = useToast();

  const [recommended, setRecommended] = useState<StockData[]>([]);

  const [recLoading, setRecLoading] = useState(true);

  const [query, setQuery] = useState("");

  const [results, setResults] = useState<SearchResult[]>([]);

  const [searching, setSearching] = useState(false);

  const [modalStock, setModalStock] = useState<StockData | null>(null);

  const [fetchingDetail, setFetchingDetail] = useState<string | null>(null);

  const [addingWatch, setAddingWatch] = useState<string | null>(null);

  const loadRecommended = async () => {
    setRecLoading(true);

    try {
      const { data } = await api.get("/stocks/recommended");

      setRecommended(data.data || []);
    } catch {
      toastError("Could not load recommended stocks.");
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    loadRecommended();
  }, []);

  useStockSocket(
    recommended.map((stock) => stock.symbol),

    (quote) => {
      setRecommended((prev) =>
        prev.map((stock) =>
          stock.symbol === quote.symbol
            ? {
                ...stock,
                currentPrice: quote.currentPrice,
                percentChange: quote.percentChange,
                high: quote.high,
                low: quote.low,
                volume: quote.volume,
                change: quote.change,
              }
            : stock,
        ),
      );

      setModalStock((prev) => {
        if (!prev) return prev;

        if (prev.symbol === quote.symbol) {
          return {
            ...prev,
            currentPrice: quote.currentPrice,
            percentChange: quote.percentChange,
            high: quote.high,
            low: quote.low,
            volume: quote.volume,
            change: quote.change,
          };
        }

        return prev;
      });
    },
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setSearching(true);
    setResults([]);

    try {
      const { data } = await api.get(
        `/stocks/search?q=${encodeURIComponent(query)}`,
      );

      const valid = (data.data || []).filter(
        (r: SearchResult) =>
          r.type === "Common Stock" || r.type === "ADR" || r.type === "",
      );

      setResults(valid.slice(0, 8));

      if (!valid.length) {
        toastError("No results found. Try a different symbol.");
      }
    } catch {
      toastError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const openDetails = async (
    symbol: string,
    name?: string,
    prefetched?: StockData,
  ) => {
    if (prefetched) {
      setModalStock(prefetched);
      return;
    }

    setFetchingDetail(symbol);

    try {
      const { data } = await api.get(`/stocks/quote/${symbol}`);

      setModalStock({
        ...data.data,
        name: name || symbol,
      });
    } catch (err: any) {
      toastError(
        err.response?.status === 404
          ? `No price data available for ${symbol}.`
          : `Could not fetch details for ${symbol}.`,
      );
    } finally {
      setFetchingDetail(null);
    }
  };

  const handleAddWatchlist = async (symbol: string, name: string) => {
    setAddingWatch(symbol);

    try {
      await api.post("/watchlist", {
        symbol,
        companyName: name,
      });

      success(`Added ${symbol} to watchlist`);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to add to watchlist.");
    } finally {
      setAddingWatch(null);
    }
  };

  const handleCreateAlert = (symbol: string) =>
    router.push(`/alerts?symbol=${symbol}`);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <IconBarChart
                className="text-emerald-400"
                size={22}
                aria-hidden="true"
              />

              <h1 className="text-2xl font-bold text-white">
                Market Dashboard
              </h1>
            </div>

            <p className="text-gray-500 text-sm mt-1">
              Live stock prices · Search symbols · Track favourites
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 mb-10">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by symbol or company name..."
                leftAddon={<IconSearch size={14} />}
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

          {results.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  Search Results ({results.length})
                </h2>

                <Button
                  variant="ghost"
                  size="xs"
                  leftIcon={<IconClose size={12} />}
                  onClick={() => setResults([])}
                >
                  Clear
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {results.map((r) => (
                  <div
                    key={r.symbol}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 hover:border-gray-700 transition-colors"
                  >
                   
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">
                          {r.displaySymbol}
                        </span>

                        <Badge variant="gray">{r.type || "Stock"}</Badge>
                      </div>

                      <p className="text-gray-500 text-xs truncate sm:whitespace-normal mt-0.5">
                        {r.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:shrink-0">
                      <Button
                        variant="outline"
                        size="xs"
                        className="w-full sm:w-auto"
                        loading={fetchingDetail === r.symbol}
                        leftIcon={<IconEye size={12} />}
                        onClick={() => openDetails(r.symbol, r.description)}
                      >
                        Details
                      </Button>

                      <Button
                        variant="secondary"
                        size="xs"
                        className="w-full sm:w-auto"
                        loading={addingWatch === r.symbol}
                        leftIcon={<IconBookmarkAdd size={12} />}
                        onClick={() =>
                          handleAddWatchlist(r.symbol, r.description)
                        }
                      >
                        Watch
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <IconTrendingUp
                    size={18}
                    className="text-emerald-400"
                    aria-hidden="true"
                  />

                  <h2 className="text-lg font-bold text-white">
                    Recommended Stocks
                  </h2>
                </div>

                <p className="text-gray-500 text-xs mt-0.5">
                  Popular stocks with live market data
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<IconRefresh size={12} />}
                onClick={loadRecommended}
                loading={recLoading}
              >
                Refresh
              </Button>
            </div>

            {recLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({
                  length: 8,
                }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse"
                  >
                    <div className="flex justify-between mb-3">
                      <div className="space-y-2">
                        <div className="h-4 w-16 bg-gray-800 rounded" />

                        <div className="h-3 w-24 bg-gray-800 rounded" />
                      </div>

                      <div className="space-y-2 flex flex-col items-end">
                        <div className="h-4 w-16 bg-gray-800 rounded" />

                        <div className="h-3 w-12 bg-gray-800 rounded" />
                      </div>
                    </div>

                    <div className="h-3 w-full bg-gray-800 rounded mb-2" />

                    <div className="h-3 w-3/4 bg-gray-800 rounded" />
                  </div>
                ))}
              </div>
            ) : recommended.length === 0 ? (
              <EmptyState
                Icon={IconActivity}
                title="Could not load market data."
                description="Try refreshing or check your connection."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recommended.map((stock) => (
                  <StockCard
                    key={stock.symbol}
                    symbol={stock.symbol}
                    companyName={stock.name}
                    currentPrice={stock.currentPrice}
                    percentChange={stock.percentChange}
                    high={stock.high}
                    low={stock.low}
                    volume={stock.volume}
                    asArticle
                  >
                    <div className="flex gap-2 pt-2 border-t border-gray-800 mt-1">
                      <Button
                        variant="outline"
                        size="xs"
                        fullWidth
                        leftIcon={<IconEye size={12} />}
                        onClick={() =>
                          openDetails(stock.symbol, stock.name, stock)
                        }
                      >
                        Details
                      </Button>

                      <Button
                        variant="secondary"
                        size="xs"
                        fullWidth
                        loading={addingWatch === stock.symbol}
                        leftIcon={<IconPlus size={12} />}
                        onClick={() =>
                          handleAddWatchlist(
                            stock.symbol,
                            stock.name || stock.symbol,
                          )
                        }
                      >
                        Watch
                      </Button>
                    </div>
                  </StockCard>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <StockDetailModal
        stock={modalStock}
        onClose={() => setModalStock(null)}
        onAddWatchlist={handleAddWatchlist}
        onCreateAlert={handleCreateAlert}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </ProtectedRoute>
  );
}
