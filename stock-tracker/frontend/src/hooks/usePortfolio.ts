import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

export interface Holding {
  _id:          string;
  symbol:       string;
  companyName:  string;
  quantity:     number;
  buyPrice:     number;
  currentPrice: number | null;
  investedValue: number;
  currentValue:  number | null;
  pnl:           number | null;
  pnlPercent:    number | null;
  dayChange:     number | null;
  createdAt:     string;
}

export interface PortfolioSummary {
  totalInvested:   number;
  totalCurrent:    number;
  totalPnl:        number;
  totalPnlPercent: number;
  holdingsCount:   number;
}

export interface AddHoldingPayload {
  symbol:      string;
  quantity:    number;
  buyPrice:    number;
  companyName?: string;
}

export function usePortfolio() {
  const [holdings, setHoldings]   = useState<Holding[]>([]);
  const [summary, setSummary]     = useState<PortfolioSummary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/portfolio');
      setHoldings(data.data.holdings ?? []);
      setSummary(data.data.summary   ?? null);
    } catch {
      setError('Failed to load portfolio.');
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (payload: AddHoldingPayload): Promise<void> => {
    try {
      await api.post('/portfolio', payload);
      await fetch(); 
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Failed to add holding.'));
    }
  }, [fetch]);

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      await api.delete(`/portfolio/${id}`);
      setHoldings((prev) => prev.filter((h) => h._id !== id));
      await fetch();
    } catch {
      throw new Error('Failed to remove holding.');
    }
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);

  return { holdings, summary, loading, error, refetch: fetch, add, remove };
}