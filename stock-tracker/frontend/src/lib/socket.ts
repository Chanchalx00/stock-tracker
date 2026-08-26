import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
      {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 2000,
        auth: (cb) => cb({ token: getAccessToken() }),
      }
    );

    socket.on('connect', () => {
      const active = [...refCounts.keys()];
      if (active.length) socket?.emit('subscribe', active);
    });
  }

  return socket;
};

const refCounts = new Map<string, number>();

export const subscribeSymbols = (symbols: string[]) => {
  const fresh = symbols.filter((symbol) => {
    const next = (refCounts.get(symbol) ?? 0) + 1;
    refCounts.set(symbol, next);
    return next === 1;
  });

  if (fresh.length) getSocket().emit('subscribe', fresh);
};

export const unsubscribeSymbols = (symbols: string[]) => {
  const dropped = symbols.filter((symbol) => {
    const next = (refCounts.get(symbol) ?? 1) - 1;
    if (next <= 0) {
      refCounts.delete(symbol);
      return true;
    }
    refCounts.set(symbol, next);
    return false;
  });

  if (dropped.length && socket) socket.emit('unsubscribe', dropped);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  refCounts.clear();
};
