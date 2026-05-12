import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface PriceAlert {
  _id:             string;
  symbol:          string;
  condition:       'GREATER_THAN' | 'LESS_THAN';
  targetPrice:     number;
  isTriggered:     boolean;
  triggeredAt?:    string;
  triggeredPrice?: number;
  createdAt:       string;
}

export interface CreateAlertPayload {
  symbol:      string;
  condition:   'GREATER_THAN' | 'LESS_THAN';
  targetPrice: number;
}

export function useAlerts() {
  const [alerts, setAlerts]   = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/alerts');
      setAlerts(data.data ?? []);
    } catch {
      setError('Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (payload: CreateAlertPayload): Promise<void> => {
    try {
      const { data } = await api.post('/alerts', payload);
      setAlerts((prev) => [data.data, ...prev]);
    } catch (err: any) {
      throw new Error(err.response?.data?.message ?? 'Failed to create alert.');
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      await api.delete(`/alerts/${id}`);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch {
      throw new Error('Failed to delete alert.');
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const active    = alerts.filter((a) => !a.isTriggered);
  const triggered = alerts.filter((a) =>  a.isTriggered);

  return { alerts, active, triggered, loading, error, refetch: fetch, create, remove };
}