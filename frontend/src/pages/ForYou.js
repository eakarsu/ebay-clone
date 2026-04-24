import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Skeleton,
  Alert,
  Divider,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { forYouService, getImageUrl } from '../services/api';

const ProductCard = ({ p }) => (
  <Card component={RouterLink} to={`/products/${p.slug || p.id}`}
        sx={{ textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
    {p.image && (
      <CardMedia component="img" height="160" image={getImageUrl(p.image)} alt={p.title} />
    )}
    <CardContent sx={{ flex: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }} noWrap>{p.title}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          ${Number(p.buyNowPrice || p.currentPrice || 0).toFixed(2)}
        </Typography>
        {p.discountPct && <Chip size="small" color="error" label={`-${p.discountPct}%`} />}
      </Box>
      {p.freeShipping && <Typography variant="caption" color="success.main">Free shipping</Typography>}
    </CardContent>
  </Card>
);

const Section = ({ title, items, emptyHint }) => {
  if (!items || items.length === 0) {
    if (!emptyHint) return null;
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
        <Typography color="text.secondary" variant="body2">{emptyHint}</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>{title}</Typography>
      <Grid container spacing={2}>
        {items.map((p) => (
          <Grid item xs={6} sm={4} md={3} key={p.id}>
            <ProductCard p={p} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const ForYou = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await forYouService.get();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>For you</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Recommendations based on what you browse, watch, and what's hot on the marketplace.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton variant="rectangular" height={240} />
            </Grid>
          ))}
        </Grid>
      ) : data ? (
        <>
          <Section title="Flash sales right now" items={data.flashSales} />
          {(data.basedOnViews?.length || 0) > 0 && <Divider sx={{ mb: 3 }} />}
          <Section
            title="Based on your views"
            items={data.basedOnViews}
            emptyHint="Browse a few products and we'll start personalizing this section."
          />
          {(data.fromWatchlist?.length || 0) > 0 && <Divider sx={{ mb: 3 }} />}
          <Section title="From categories you watch" items={data.fromWatchlist} />
          <Divider sx={{ mb: 3 }} />
          <Section title="Trending now" items={data.trending} />
        </>
      ) : null}
    </Container>
  );
};

export default ForYou;
