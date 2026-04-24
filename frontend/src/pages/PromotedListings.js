import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardMedia, Button,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tab, Tabs, LinearProgress, Stack, InputAdornment, Tooltip, IconButton,
} from '@mui/material';
import {
  TrendingUp, Visibility, AttachMoney, Campaign, Info, Add,
  PlayArrow, Pause,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { promotionService } from '../services/api';
import api from '../services/api';

// Real CPC (cost-per-click) ad platform, matching backend/services/promotionService:
//   - Seller sets a per-click bid and optional daily budget
//   - Impressions get logged when listings appear in promoted slots
//   - Clicks charge the second-price-auction-derived cost at click time
// Status flows: active ↔ paused. No delete; paused promotions stay for history.
const PromotedListings = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [myProducts, setMyProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialog, setDialog] = useState(null); // { product, existing? }
  const [form, setForm] = useState({ cpcBid: 0.25, dailyBudget: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRes, promoRes] = await Promise.all([
        api.get('/seller/products?limit=200'),
        promotionService.listMine(),
      ]);
      setMyProducts(prodRes.data.products || []);
      setPromotions(promoRes.data.promotions || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  // Promotions index keyed by product_id so we can tell which products are unpromoted.
  const promoByProduct = React.useMemo(
    () => Object.fromEntries(promotions.map((p) => [p.product_id, p])),
    [promotions]
  );
  const unpromoted = myProducts.filter((p) => !promoByProduct[p.id]);
  const activePromos = promotions.filter((p) => p.status === 'active');
  const pausedPromos = promotions.filter((p) => p.status !== 'active');

  const openCreate = (product) => {
    const existing = promoByProduct[product.id];
    setForm({
      cpcBid: existing ? Number(existing.cpc_bid) : 0.25,
      dailyBudget: existing?.daily_budget ? String(existing.daily_budget) : '',
    });
    setDialog({ product, existing });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const cpcBid = Number(form.cpcBid);
      if (!cpcBid || cpcBid <= 0) {
        setError('CPC bid must be greater than 0');
        setSaving(false);
        return;
      }
      await promotionService.create({
        productId: dialog.product.id,
        cpcBid,
        dailyBudget: form.dailyBudget ? Number(form.dailyBudget) : null,
      });
      setDialog(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save promotion');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promo) => {
    const next = promo.status === 'active' ? 'paused' : 'active';
    try {
      await promotionService.setStatus(promo.id, next);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to change status');
    }
  };

  // Per-campaign aggregates — backend has daily_spend + click counters on promotion_bids.
  const stats = React.useMemo(() => {
    const totalImpressions = promotions.reduce((s, p) => s + (p.impressions || 0), 0);
    const totalClicks = promotions.reduce((s, p) => s + (p.clicks || 0), 0);
    const totalSpent = promotions.reduce((s, p) => s + Number(p.total_spent || 0), 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    return { totalImpressions, totalClicks, totalSpent, avgCTR: ctr.toFixed(2) };
  }, [promotions]);

  const img = (p) =>
    (Array.isArray(p.images) && p.images[0]?.imageUrl) ||
    p.imageUrl || p.image || '/placeholder.jpg';

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Campaign sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to access Promoted Listings</Typography>
        <Button component={Link} to="/login" variant="contained">Sign In</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          <Campaign sx={{ mr: 1, verticalAlign: 'middle' }} />
          Promoted Listings
        </Typography>
        <Typography color="text.secondary">
          Boost visibility with cost-per-click ads. You're only charged when buyers click your promoted listing.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Visibility color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{stats.totalImpressions.toLocaleString()}</Typography>
            <Typography color="text.secondary">Impressions</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{stats.totalClicks.toLocaleString()}</Typography>
            <Typography color="text.secondary">Clicks</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <AttachMoney color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>${stats.totalSpent.toFixed(2)}</Typography>
            <Typography color="text.secondary">Spent</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Info color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{stats.avgCTR}%</Typography>
            <Typography color="text.secondary">CTR</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Active (${activePromos.length})`} />
        <Tab label={`Paused (${pausedPromos.length})`} />
        <Tab label={`Available to promote (${unpromoted.length})`} />
      </Tabs>

      {loading ? (
        <LinearProgress />
      ) : tab === 0 || tab === 1 ? (
        (tab === 0 ? activePromos : pausedPromos).length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Campaign sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6">
              {tab === 0 ? 'No active promotions' : 'No paused promotions'}
            </Typography>
            {tab === 0 && (
              <Button sx={{ mt: 2 }} variant="contained" onClick={() => setTab(2)}>
                Browse listings to promote
              </Button>
            )}
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Listing</TableCell>
                  <TableCell align="right">CPC bid</TableCell>
                  <TableCell align="right">Daily budget</TableCell>
                  <TableCell align="right">Impressions</TableCell>
                  <TableCell align="right">Clicks</TableCell>
                  <TableCell align="right">Spent</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(tab === 0 ? activePromos : pausedPromos).map((promo) => {
                  const product = myProducts.find((p) => p.id === promo.product_id);
                  return (
                    <TableRow key={promo.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          {product && (
                            <Box
                              component="img"
                              src={img(product)}
                              sx={{ width: 50, height: 50, borderRadius: 1, objectFit: 'cover' }}
                            />
                          )}
                          <Box>
                            <Typography variant="subtitle2">
                              {promo.title || product?.title || '(deleted product)'}
                            </Typography>
                            {product && (
                              <Typography variant="body2" color="text.secondary">
                                ${Number(product.currentPrice || product.price || 0).toFixed(2)}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          color="primary"
                          label={`$${Number(promo.cpc_bid).toFixed(2)}`}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {promo.daily_budget ? `$${Number(promo.daily_budget).toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell align="right">{(promo.impressions || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">{promo.clicks || 0}</TableCell>
                      <TableCell align="right">${Number(promo.total_spent || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <Button
                            size="small"
                            onClick={() => product && openCreate(product)}
                            disabled={!product}
                          >
                            Edit
                          </Button>
                        </Tooltip>
                        <Tooltip title={promo.status === 'active' ? 'Pause' : 'Resume'}>
                          <IconButton size="small" onClick={() => handleToggle(promo)}>
                            {promo.status === 'active'
                              ? <Pause fontSize="small" />
                              : <PlayArrow fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        /* Available Listings */
        unpromoted.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Info sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              All your listings are already promoted
            </Typography>
            <Button component={Link} to="/sell" variant="contained" startIcon={<Add />}>
              Create new listing
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {unpromoted.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="160"
                    image={img(product)}
                    alt={product.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }} noWrap>
                      {product.title}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                      ${Number(product.currentPrice || product.price || 0).toFixed(2)}
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Campaign />}
                      onClick={() => openCreate(product)}
                    >
                      Promote
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}

      {/* Promote dialog — also used for editing an existing promotion */}
      <Dialog open={!!dialog} onClose={() => !saving && setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog?.existing ? 'Edit promotion' : 'Promote listing'}
        </DialogTitle>
        <DialogContent>
          {dialog && (
            <Box sx={{ pt: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Box
                  component="img"
                  src={img(dialog.product)}
                  sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover' }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>{dialog.product.title}</Typography>
                  <Typography color="primary">
                    ${Number(dialog.product.currentPrice || dialog.product.price || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Stack>

              <TextField
                fullWidth
                label="Cost per click (CPC)"
                type="number"
                value={form.cpcBid}
                onChange={(e) => setForm({ ...form, cpcBid: e.target.value })}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ step: 0.05, min: 0.01 }}
                helperText="Maximum you're willing to pay each time someone clicks your ad"
              />

              <TextField
                fullWidth
                label="Daily budget (optional)"
                type="number"
                value={form.dailyBudget}
                onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ step: 1, min: 0 }}
                helperText="Ad stops serving for the day once this is hit. Leave blank for no cap."
              />

              <Alert severity="info" sx={{ mt: 3 }}>
                You pay only when someone clicks. The actual charge per click is determined by a
                second-price auction against other bidders in the same category.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : dialog?.existing ? 'Save changes' : 'Start promotion'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PromotedListings;
