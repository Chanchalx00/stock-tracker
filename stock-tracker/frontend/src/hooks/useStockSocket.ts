import { useEffect, useCallback, useMemo } from 'react';
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
  const symbolsKey = useMemo(() => symbols.join(','), [symbols]);

  const subscribe = useCallback(() => {
    if (!symbols.length) return;
    const socket = getSocket();

    socket.emit('subscribe', symbols);

    symbols.forEach((symbol) => {
      socket.on(`price:${symbol}`, (quote: LiveQuote) => {
        onQuote(quote);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  const unsubscribe = useCallback(() => {
    if (!symbols.length) return;
    const socket = getSocket();
    socket.emit('unsubscribe', symbols);
    symbols.forEach((symbol) => {
      socket.off(`price:${symbol}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);
}