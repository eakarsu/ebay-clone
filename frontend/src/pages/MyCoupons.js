import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Card, CardContent, Box, Button, Stack, Alert,
  Chip, Grid, Snackbar, IconButton, Tooltip, Divider, CircularProgress,
} from '@mui/material';
import { ContentCopy, LocalOffer, AccessTime } from '@mui/icons-material';
import { couponService } from '../services/api';

// Buyer-facing page: lists every coupon the current user can redeem today.
// Codes are one-click copyable so they can be pasted straight into checkout.
export default function MyCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await couponService.listAvailable();
        if (alive) setCoupons(data.coupons || []);
      } catch (e) {
        if (alive) setError(e.response?.data?.error || 'Failed to load coupons');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
    } catch {
      setCopied('');
    }
  };

  const formatDiscount = (c) => {
    if (c.discountType === 'percentage')  return `${Number(c.discountValue)}% off`;
    if (c.discountType === 'fixed_amount') return `$${Number(c.discountValue).toFixed(2)} off`;
    if (c.discountType === 'free_shipping') return 'Free shipping';
    return `${c.discountValue} off`;
  };

  const daysLeft = (endDate) => {
    const ms = new Date(endDate) - new Date();
    if (ms <= 0) return 'expired';
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return days <= 1 ? 'expires today' : `${days} days left`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <LocalOffer color="primary" />
        <Typography variant="h4" fontWeight={700}>My Coupons</Typography>
      </Stack>
      <Typography color="text.secondary" mb={3}>
        Copy a code and paste it at checkout to save on your next order.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : coupons.length === 0 ? (
        <Alert severity="info">
          No coupons available right now. Check back soon — sellers publish new offers often.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {coupons.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <Card sx={{ height: '100%', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      {formatDiscount(c)}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<AccessTime sx={{ fontSize: 14 }} />}
                      label={daysLeft(c.endDate)}
                      color={daysLeft(c.endDate) === 'expires today' ? 'warning' : 'default'}
                    />
                  </Stack>

                  {c.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: 40 }}>
                      {c.description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      px: 1.5, py: 1,
                      border: '1px dashed',
                      borderColor: 'grey.400',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontFamily: 'monospace', letterSpacing: 1, flex: 1 }}
                    >
                      {c.code}
                    </Typography>
                    <Tooltip title="Copy code">
                      <IconButton size="small" onClick={() => copy(c.code)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                    {c.minPurchaseAmount && (
                      <Typography variant="caption" color="text.secondary">
                        Minimum purchase: ${Number(c.minPurchaseAmount).toFixed(2)}
                      </Typography>
                    )}
                    {c.maxDiscountAmount && (
                      <Typography variant="caption" color="text.secondary">
                        Max discount: ${Number(c.maxDiscountAmount).toFixed(2)}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Valid until {new Date(c.endDate).toLocaleDateString()}
                    </Typography>
                  </Stack>

                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={() => copy(c.code)}
                    sx={{ mt: 1.5 }}
                  >
                    Copy code
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={!!copied}
        autoHideDuration={2000}
        onClose={() => setCopied('')}
        message={`Copied ${copied} to clipboard`}
      />
    </Container>
  );
}
