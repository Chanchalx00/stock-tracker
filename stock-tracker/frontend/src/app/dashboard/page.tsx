"use client";
import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import StockCard from "@/components/StockCard";
import api from "@/lib/api";

interface StockResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

interface Quote {
  symbol: string;
  currentPrice: number;
  high: number;
  low: number;
  change: number;
  percentChange: number;
}

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [addingToWatchlist, setAddingToWatchlist] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSelectedQuote(null);
    try {
      const { data } = await api.get(`/stocks/search?q=${query}`);
      setResults(data.data || []);
    } catch {
      showToast("Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  };

  const fetchQuote = async (symbol: string) => {
    setLoadingQuote(true);
    try {
      const { data } = await api.get(`/stocks/quote/${symbol}`);
      setSelectedQuote(data.data);
    } catch {
      showToast("Could not fetch quote.");
    } finally {
      setLoadingQuote(false);
    }
  };

  const addToWatchlist = async (symbol: string, name: string) => {
    setAddingToWatchlist(symbol);
    try {
      await api.post("/watchlist", { symbol, companyName: name });
      showToast(`${symbol} added to watchlist!`);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add.");
    } finally {
      setAddingToWatchlist("");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-6">Search Stocks</h1>

          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by symbol or name... e.g. AAPL, RELIANCE"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold cursor-pointer rounded-xl transition-colors text-sm"
            >
              {searching ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </form>

          {selectedQuote && (
            <div className="mb-6">
              <StockCard
                symbol={selectedQuote.symbol}
                currentPrice={selectedQuote.currentPrice}
                percentChange={selectedQuote.percentChange}
                high={selectedQuote.high}
                low={selectedQuote.low}
              >
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-800 text-xs text-gray-400">
                  <span>
                    Change:{" "}
                    <span
                      className={
                        selectedQuote.change >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {selectedQuote.change}
                    </span>
                  </span>
                  <span>
                    High:{" "}
                    <span className="text-white">{selectedQuote.high}</span>
                  </span>
                </div>
              </StockCard>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((r) => (
                <div
                  key={r.symbol}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-sm">
                        {r.displaySymbol}
                      </p>

                      <p className="text-gray-500 text-xs mt-1 wrap-break-words leading-relaxed">
                        {r.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <button
                        onClick={() => fetchQuote(r.symbol)}
                        disabled={loadingQuote}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 cursor-pointer transition-colors whitespace-nowrap"
                      >
                        Quote
                      </button>

                      <button
                        onClick={() => addToWatchlist(r.symbol, r.description)}
                        disabled={addingToWatchlist === r.symbol}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 cursor-pointer transition-colors whitespace-nowrap"
                      >
                        + Watch
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full border border-gray-700 shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
