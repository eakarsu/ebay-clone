import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getSocket, joinUserRoom } from '../services/socket';
import { useAuth } from '../context/AuthContext';

/**
 * Global listener for `user:outbid` socket events. Mounted once from Layout.
 * When the signed-in user is outbid elsewhere on the site, we show a snackbar
 * with a shortcut back to the auction. The backend pushes to the *previous
 * winning bidder's* personal room only.
 */
const OutbidToast = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    // Re-join the user room on (re)connect — socket.io can reconnect silently.
    const joinRoom = () => joinUserRoom(user.id);
    joinRoom();
    socket.on('connect', joinRoom);

    const onOutbid = (payload) => setToast(payload);
    socket.on('user:outbid', onOutbid);

    return () => {
      socket.off('user:outbid', onOutbid);
      socket.off('connect', joinRoom);
    };
  }, [user?.id]);

  if (!toast) return null;

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast(null);
  };

  const handleView = () => {
    setToast(null);
    navigate(toast.link || `/product/${toast.productId}`);
  };

  return (
    <Snackbar
      open={!!toast}
      autoHideDuration={8000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity="warning"
        variant="filled"
        action={
          <Button color="inherit" size="small" onClick={handleView}>
            VIEW
          </Button>
        }
      >
        You've been outbid — ${Number(toast.newBidAmount).toFixed(2)} on{' '}
        <strong>{toast.productTitle}</strong>
      </Alert>
    </Snackbar>
  );
};

export default OutbidToast;
