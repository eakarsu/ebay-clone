const { Server } = require('socket.io');

let io = null;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    socket.on('auction:join', (productId) => {
      if (typeof productId === 'string' && productId.length > 0) {
        socket.join(`auction:${productId}`);
      }
    });

    socket.on('auction:leave', (productId) => {
      if (typeof productId === 'string' && productId.length > 0) {
        socket.leave(`auction:${productId}`);
      }
    });

    // Per-user rooms for notifications (client emits after authenticated.)
    socket.on('user:join', (userId) => {
      if (typeof userId === 'string' && userId.length > 0) {
        socket.join(`user:${userId}`);
      }
    });
  });

  return io;
};

const getIO = () => io;

const emitBid = (productId, payload) => {
  if (!io) return;
  io.to(`auction:${productId}`).emit('bid:new', payload);
};

const emitAuctionEnd = (productId, payload) => {
  if (!io) return;
  io.to(`auction:${productId}`).emit('auction:end', payload);
};

const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
};

module.exports = { init, getIO, emitBid, emitAuctionEnd, emitToUser };
