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
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};