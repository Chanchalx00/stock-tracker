import { useState, useCallback } from 'react';
import api from '@/lib/api';

export interface ValidatedSymbol {
  symbol:        string;
  currentPrice:  number;
  high:          number;
  low:           number;
  percentChange: number;
}

export function useSymbolValidation() {
  const [validated, setValidated]   = useState<ValidatedSymbol | null>(null);
  const [validating, setValidating] = useState(false);
  const [symError, setSymError]     = useState<string | null>(null);

  const validate = useCallback(async (symbol: string): Promise<boolean> => {
    const clean = symbol.trim().toUpperCase();
    if (!clean) {
      setValidated(null);
      setSymError(null);
      return false;
    }

    setValidating(true);
    setSymError(null);
    setValidated(null);

    try {
      const { data } = await api.get(`/stocks/validate/${clean}`);
      if (data.valid) {
        setValidated(data.data);
        return true;
      } else {
        setSymError(`"${clean}" is not a valid symbol or has no market data.`);
        return false;
      }
    } catch {
      setSymError('Could not validate symbol. Check your connection.');
      return false;
    } finally {
      setValidating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setValidated(null);
    setSymError(null);
  }, []);

  return { validated, validating, symError, validate, reset };
}
