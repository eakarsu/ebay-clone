import React, { useEffect, useState } from 'react';
import { Button, CircularProgress, Typography, Box } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { followService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Follow / unfollow a seller. Shows the current follower count alongside.
 * When the viewer is a guest, clicking kicks them to /login.
 */
const FollowButton = ({ sellerId, size = 'small', showCount = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ following: false, followers: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await followService.status(sellerId);
        if (!cancelled) setStatus(res.data);
      } catch (_) { /* silently show default */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [sellerId]);

  const isSelf = user && user.id === sellerId;
  if (isSelf) return null;

  const handleClick = async () => {
    if (!user) { navigate('/login'); return; }
    setBusy(true);
    try {
      const res = status.following
        ? await followService.unfollow(sellerId)
        : await followService.follow(sellerId);
      setStatus(res.data);
    } catch (_) { /* ignore; state unchanged */ }
    finally { setBusy(false); }
  };

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <Button
        size={size}
        variant={status.following ? 'outlined' : 'contained'}
        color={status.following ? 'inherit' : 'primary'}
        startIcon={status.following ? <PersonRemoveIcon /> : <PersonAddIcon />}
        onClick={handleClick}
        disabled={busy || loading}
      >
        {busy || loading ? <CircularProgress size={14} /> : (status.following ? 'Following' : 'Follow')}
      </Button>
      {showCount && (
        <Typography variant="caption" color="text.secondary">
          {status.followers} follower{status.followers === 1 ? '' : 's'}
        </Typography>
      )}
    </Box>
  );
};

export default FollowButton;
