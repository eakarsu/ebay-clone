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

    // --- Live product viewer presence ---
    // Clients call `product:view` with a productId when the product page
    // mounts. We track which rooms this socket is in so we can re-broadcast
    // the updated viewer count on disconnect, without a per-room teardown loop.
    socket.data.viewingProducts = new Set();

    socket.on('product:view', (productId) => {
      if (typeof productId !== 'string' || productId.length === 0) return;
      const room = `product:${productId}`;
      socket.join(room);
      socket.data.viewingProducts.add(productId);
      broadcastViewerCount(productId);
    });

    socket.on('product:leave', (productId) => {
      if (typeof productId !== 'string' || productId.length === 0) return;
      const room = `product:${productId}`;
      socket.leave(room);
      socket.data.viewingProducts.delete(productId);
      broadcastViewerCount(productId);
    });

    socket.on('disconnecting', () => {
      for (const productId of socket.data.viewingProducts || []) {
        // socket.io removes us from the room after this handler, so the
        // broadcast happens on a setImmediate tick to get the post-leave count.
        setImmediate(() => broadcastViewerCount(productId));
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

// Emit the current viewer count to everyone in the product's room.
const broadcastViewerCount = (productId) => {
  if (!io) return;
  const room = io.sockets.adapter.rooms.get(`product:${productId}`);
  const count = room ? room.size : 0;
  io.to(`product:${productId}`).emit('product:viewers', { productId, count });
};

module.exports = { init, getIO, emitBid, emitAuctionEnd, emitToUser, broadcastViewerCount };
