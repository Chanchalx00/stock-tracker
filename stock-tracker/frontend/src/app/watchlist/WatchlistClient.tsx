"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import StockCard from "@/components/StockCard";
import FadeIn from "@/components/FadeIn";
import { StaggerContainer, StaggerItem } from "@/components/Stagger";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

import { IconWatchlist, IconTrash, IconBookmarked } from "@/lib/icons";

import { useWatchlist } from "@/hooks/useWatchlist";
import { useToast } from "@/hooks/useToast";
import { useStockSocket } from "@/hooks/useStockSocket";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Quote {
  symbol: string;
  currentPrice: number;
  percentChange: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  timestamp: string;
}

export default function WatchlistClient() {
  const { items, loading, remove } = useWatchlist();

  const { toast, success, error: toastError } = useToast();

  const [quotes, setQuotes] = useState<Record<string, Quote>>({});

  useEffect(() => {
    const fetchInitialQuotes = async () => {
      const data: Record<string, Quote> = {};

      await Promise.all(
        items.map(async (item) => {
          try {
            const q = await api.get(`/stocks/quote/${item.symbol}`);

            data[item.symbol] = q.data.data;
          } catch {}
        }),
      );

      setQuotes(data);
    };

    if (items.length) {
      fetchInitialQuotes();
    }
  }, [items]);

  useStockSocket(
    items.map((item) => item.symbol),

    (quote) => {
      setQuotes((prev) => ({
        ...prev,
        [quote.symbol]: quote,
      }));
    },
  );

  const handleRemove = async (symbol: string) => {
    try {
      await remove(symbol);
      success(`Removed ${symbol} from watchlist.`);
    } catch {
      toastError("Failed to remove from watchlist.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <FadeIn>
            <div className="mb-6 flex items-center gap-2">
              <IconWatchlist
                size={22}
                className="text-emerald-400"
                aria-hidden="true"
              />

              <h1 className="text-2xl font-bold text-white">My Watchlist</h1>
            </div>
          </FadeIn>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" label="Loading watchlist…" />
            </div>
          ) : items.length === 0 ? (
            <FadeIn>
              <EmptyState
                Icon={IconBookmarked}
                title="Your watchlist is empty"
                description="Search for stocks on the dashboard and add them here."
              />
            </FadeIn>
          ) : (
            <StaggerContainer className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const q = quotes[item.symbol];

                return (
                  <StaggerItem key={item._id}>
                    <StockCard
                      symbol={item.symbol}
                      companyName={item.companyName}
                      currentPrice={q?.currentPrice}
                      percentChange={q?.percentChange}
                      high={q?.high}
                      low={q?.low}
                      volume={q?.volume}
                      asArticle
                    >
                      <div className="pt-2 border-t border-gray-800 mt-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          leftIcon={<IconTrash size={12} />}
                          onClick={() => handleRemove(item.symbol)}
                          className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                          aria-label={`Remove ${item.symbol} from watchlist`}
                        >
                          Remove
                        </Button>
                      </div>
                    </StockCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </ProtectedRoute>
  );
}
