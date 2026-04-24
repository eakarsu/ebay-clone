import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Box,
  Chip,
  Avatar,
  Button,
  Alert,
  Skeleton,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { followService, getImageUrl } from '../services/api';

/**
 * "Following" activity feed — new listings from sellers the viewer follows,
 * newest first. When the viewer follows no one, we show a nudge to browse
 * products and follow sellers from product pages.
 */
const Feed = () => {
  const [items, setItems] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [feedRes, followingRes] = await Promise.all([
          followService.feed(30),
          followService.myFollowing(),
        ]);
        setItems(feedRes.data.items || []);
        setFollowing(followingRes.data.following || []);
      } catch (_) { /* leave empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Your Feed</Typography>
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={280} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Your Feed</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        New listings from sellers you follow{following.length > 0 ? ` — ${following.length} seller${following.length === 1 ? '' : 's'}` : ''}.
      </Typography>

      {/* Sellers strip */}
      {following.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, mb: 3 }}>
          {following.map((s) => (
            <Box
              key={s.id}
              component={Link}
              to={`/store/${s.username}`}
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textDecoration: 'none', color: 'inherit', minWidth: 80,
              }}
            >
              <Avatar src={getImageUrl(s.avatar_url)} sx={{ width: 56, height: 56, mb: 0.5 }}>
                {s.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="caption" noWrap sx={{ maxWidth: 80 }}>
                {s.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {s.active_listings} active
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {items.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {following.length === 0
            ? 'You don\'t follow any sellers yet. Visit a product page and tap "Follow" on the seller to populate this feed.'
            : 'No new listings from your followed sellers yet — check back soon.'}
          <Box sx={{ mt: 1 }}>
            <Button component={Link} to="/" size="small" variant="outlined">Browse products</Button>
          </Box>
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {items.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Card
                component={Link}
                to={`/product/${p.id}`}
                sx={{ textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <CardMedia
                  component="img"
                  height="180"
                  image={p.image_url ? getImageUrl(p.image_url) : 'https://via.placeholder.com/400x300?text=No+image'}
                  alt={p.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {p.seller_username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      {p.seller_username} · {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      ${(p.buy_now_price ?? p.current_price ?? 0).toFixed ? Number(p.buy_now_price ?? p.current_price ?? 0).toFixed(2) : p.buy_now_price ?? p.current_price}
                    </Typography>
                    {p.free_shipping && <Chip label="Free shipping" size="small" color="success" variant="outlined" />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Feed;
