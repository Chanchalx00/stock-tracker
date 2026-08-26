import { useEffect, useRef } from 'react';
import { getSocket, subscribeSymbols, unsubscribeSymbols } from '@/lib/socket';

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
  const symbolsKey = symbols.join(',');

  const onQuoteRef = useRef(onQuote);
  useEffect(() => {
    onQuoteRef.current = onQuote;
  });

  useEffect(() => {
    const list = symbolsKey ? symbolsKey.split(',') : [];
    if (!list.length) return;

    const socket = getSocket();
    subscribeSymbols(list);

    const bound = list.map((symbol) => {
      const handler = (quote: LiveQuote) => onQuoteRef.current(quote);
      socket.on(`price:${symbol}`, handler);
      return { symbol, handler };
    });

    return () => {
      unsubscribeSymbols(list);
      bound.forEach(({ symbol, handler }) => socket.off(`price:${symbol}`, handler));
    };
  }, [symbolsKey]);
}
