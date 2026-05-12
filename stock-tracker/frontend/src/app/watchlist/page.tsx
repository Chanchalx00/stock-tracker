'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import StockCard from '@/components/StockCard';
import api from '@/lib/api';

interface WatchItem { _id: string; symbol: string; companyName: string; }
interface Quote { currentPrice: number; percentChange: number; high: number; low: number; }

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/watchlist');
      setItems(data.data);
    
      data.data.forEach(async (item: WatchItem) => {
        try {
          const q = await api.get(`/stocks/quote/${item.symbol}`);
          setQuotes((prev) => ({ ...prev, [item.symbol]: q.data.data }));
        } catch {}
      });
    } catch {}
    setLoading(false);
  };

  const remove = async (symbol: string) => {
    await api.delete(`/watchlist/${symbol}`);
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
  };

  useEffect(() => { fetchWatchlist(); }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-6">My Watchlist</h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Your watchlist is empty.</p>
              <p className="text-sm mt-1">Search for stocks and add them here.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const q = quotes[item.symbol];
                return (
                  <StockCard
                    key={item._id}
                    symbol={item.symbol}
                    currentPrice={q?.currentPrice}
                    percentChange={q?.percentChange}
                    high={q?.high}
                    low={q?.low}
                  >
                    <p className="text-xs text-gray-500 mb-2">{item.companyName}</p>
                    <button
                      onClick={() => remove(item.symbol)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </StockCard>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}