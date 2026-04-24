import { io } from 'socket.io-client';

const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:4000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(BASE_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
};

export const joinAuction = (productId) => {
  const s = getSocket();
  s.emit('auction:join', productId);
};

export const leaveAuction = (productId) => {
  const s = getSocket();
  s.emit('auction:leave', productId);
};

// Per-user room for personal notifications (price drops, etc).
export const joinUserRoom = (userId) => {
  const s = getSocket();
  s.emit('user:join', userId);
};
