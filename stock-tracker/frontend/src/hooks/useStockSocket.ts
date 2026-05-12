import { useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';

interface LiveQuote {
  symbol:        string;
  currentPrice:  number;
  percentChange: number;
  high:          number;
  low:           number;
  volume:        number;
  change:        number;
  timestamp:     string;
}

type QuoteHandler = (quote: LiveQuote) => void;

export function useStockSocket(symbols: string[], onQuote: QuoteHandler) {
  const subscribe = useCallback(() => {
    if (!symbols.length) return;
    const socket = getSocket();

    socket.emit('subscribe', symbols);

    symbols.forEach((symbol) => {
      socket.on(`price:${symbol}`, (quote: LiveQuote) => {
        onQuote(quote);
      });
    });
  }, [symbols.join(',')]);

  const unsubscribe = useCallback(() => {
    if (!symbols.length) return;
    const socket = getSocket();
    socket.emit('unsubscribe', symbols);
    symbols.forEach((symbol) => {
      socket.off(`price:${symbol}`);
    });
  }, [symbols.join(',')]);

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);
}