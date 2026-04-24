import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Box,
  Alert,
  Skeleton,
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import { Link as RouterLink } from 'react-router-dom';
import { flashSaleService, getImageUrl } from '../services/api';

const TimeLeft = ({ endsAt }) => {
  const [remaining, setRemaining] = useState(() => new Date(endsAt) - new Date());
  useEffect(() => {
    const t = setInterval(() => setRemaining(new Date(endsAt) - new Date()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (remaining <= 0) return <Chip size="small" label="Ended" />;
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  return <Chip size="small" color="warning" label={`${h}h ${m}m ${s}s left`} />;
};

const FlashSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await flashSaleService.listActive();
        setSales(res.data.sales || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <BoltIcon color="warning" fontSize="large" />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Flash sales</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Limited-time discounts. When the clock runs out, prices go back to normal.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={260} />
              </Grid>
            ))
          : sales.length === 0
          ? <Grid item xs={12}><Typography color="text.secondary">No active flash sales right now. Check back soon.</Typography></Grid>
          : sales.map((s) => (
              <Grid item xs={12} sm={6} md={4} key={s.id}>
                <Card component={RouterLink} to={`/products/${s.productId}`} sx={{ textDecoration: 'none', height: '100%' }}>
                  {s.imageUrl && (
                    <CardMedia component="img" height="180" image={getImageUrl(s.imageUrl)} alt={s.productTitle} />
                  )}
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }} noWrap>
                      {s.productTitle}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                      <Typography variant="h5" color="error" sx={{ fontWeight: 700 }}>
                        ${s.salePrice?.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                        ${s.basePrice?.toFixed(2)}
                      </Typography>
                      <Chip size="small" color="error" label={`-${s.discountPct}%`} />
                    </Box>
                    <TimeLeft endsAt={s.endsAt} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>
    </Container>
  );
};

export default FlashSales;
