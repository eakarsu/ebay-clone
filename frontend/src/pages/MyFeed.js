import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Grid, Card, CardMedia, CardContent, Box,
  Chip, Button, Stack, Alert,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { categoryFollowService, getImageUrl } from '../services/api';

export default function MyFeed() {
  const [follows, setFollows] = useState([]);
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFollows = async () => {
    try {
      const { data } = await categoryFollowService.listMine();
      setFollows(Array.isArray(data) ? data : []);
    } catch (_) { /* ignore */ }
  };

  const loadFeed = async (nextOffset = 0, replace = true) => {
    setLoading(true);
    try {
      const { data } = await categoryFollowService.getFeed({ limit: 20, offset: nextOffset });
      const next = data.items || [];
      setItems(replace ? next : [...items, ...next]);
      setHasMore(!!data.pagination?.hasMore);
      setOffset(nextOffset + next.length);
    } catch (e) {
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollows();
    loadFeed(0, true);
  }, []);

  const unfollow = async (categoryId) => {
    try {
      await categoryFollowService.unfollow(categoryId);
      await loadFollows();
      await loadFeed(0, true);
    } catch (_) { /* ignore */ }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>My Feed</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Fresh listings from the categories you follow.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {follows.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          You're not following any categories yet. Visit a category page and tap "Follow"
          to personalize your feed.
        </Alert>
      ) : (
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" color="text.secondary">Following</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            {follows.map(c => (
              <Chip
                key={c.id}
                label={c.name}
                onDelete={() => unfollow(c.id)}
                component={Link}
                to={`/category/${c.slug}`}
                clickable
              />
            ))}
          </Stack>
        </Box>
      )}

      {items.length === 0 && !loading ? (
        <Typography color="text.secondary">No recent listings in your followed categories.</Typography>
      ) : (
        <Grid container spacing={2}>
          {items.map(p => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
              <Card
                component={Link}
                to={`/products/${p.slug}`}
                sx={{ textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                {p.image && (
                  <CardMedia
                    component="img"
                    image={getImageUrl(p.image)}
                    alt={p.title}
                    sx={{ height: 180, objectFit: 'cover' }}
                  />
                )}
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {p.category_name}
                  </Typography>
                  <Typography variant="subtitle2" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {p.title}
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    ${Number(p.current_price || p.buy_now_price || 0).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.listing_type === 'auction' ? 'Auction' : 'Buy Now'} · @{p.seller_username}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {hasMore && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button onClick={() => loadFeed(offset, false)} disabled={loading}>
            {loading ? 'Loading…' : 'Load more'}
          </Button>
        </Box>
      )}
    </Container>
  );
}
