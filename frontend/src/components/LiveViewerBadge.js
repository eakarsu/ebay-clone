import React, { useEffect, useState } from 'react';
import { Chip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { io } from 'socket.io-client';

// Single shared socket across badges — multiple mounts stay cheap.
let sharedSocket = null;
const getSocket = () => {
  if (sharedSocket) return sharedSocket;
  const base = (process.env.REACT_APP_API_URL || 'http://localhost:4000').replace('/api', '');
  sharedSocket = io(base, { path: '/socket.io', transports: ['websocket', 'polling'] });
  return sharedSocket;
};

/**
 * "N viewing now" — a live viewer count for a product.
 * Subscribes to `product:viewers` events via socket presence; renders nothing
 * when the count is 0 or 1 (ourselves) to avoid visual noise.
 */
const LiveViewerBadge = ({ productId }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!productId) return;
    const socket = getSocket();
    const onViewers = (payload) => {
      if (payload?.productId === productId) setCount(payload.count || 0);
    };
    socket.on('product:viewers', onViewers);
    socket.emit('product:view', productId);

    return () => {
      socket.emit('product:leave', productId);
      socket.off('product:viewers', onViewers);
    };
  }, [productId]);

  // Hide the chip when we're the only one looking — avoids "1 viewing now" noise.
  if (count < 2) return null;

  return (
    <Chip
      size="small"
      color="warning"
      icon={<VisibilityIcon />}
      label={`${count} viewing now`}
      sx={{ fontWeight: 500 }}
    />
  );
};

export default LiveViewerBadge;
