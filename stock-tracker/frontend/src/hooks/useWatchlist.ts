import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface WatchItem {
  _id:         string;
  symbol:      string;
  companyName: string;
  createdAt:   string;
}

export function useWatchlist() {
  const [items, setItems]     = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/watchlist');
      setItems(data.data ?? []);
    } catch {
      setError('Failed to load watchlist.');
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(
    async (symbol: string, companyName = ''): Promise<boolean> => {
      try {
        const { data } = await api.post('/watchlist', { symbol, companyName });
        setItems((prev) => [data.data, ...prev]);
        return true;
      } catch (err: any) {
        throw new Error(err.response?.data?.message ?? 'Failed to add to watchlist.');
      }
    },
    []
  );

  const remove = useCallback(async (symbol: string): Promise<void> => {
    try {
      await api.delete(`/watchlist/${symbol}`);
      setItems((prev) => prev.filter((i) => i.symbol !== symbol));
    } catch {
      throw new Error('Failed to remove from watchlist.');
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, error, refetch: fetch, add, remove };
}