import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  LinearProgress,
  TextField,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { groupBuyService } from '../services/api';

const GroupBuyCard = ({ gb, onCommit }) => {
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const maxTier = Array.isArray(gb.tiers) ? Math.max(...gb.tiers.map((t) => t.min_qty)) : 0;
  const progress = maxTier ? Math.min(100, (gb.totalQuantity / maxTier) * 100) : 0;

  const handleCommit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onCommit(gb.id, Math.max(1, parseInt(qty, 10) || 1));
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{gb.productTitle}</Typography>
        <Typography variant="caption" color="text.secondary">by {gb.sellerUsername}</Typography>

        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {gb.totalQuantity} committed from {gb.commitmentCount} buyer{gb.commitmentCount === 1 ? '' : 's'}
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.5, height: 8, borderRadius: 1 }} />
        </Box>

        {gb.currentTier ? (
          <Chip size="small" color="success" label={`Unlocked: $${gb.currentTier.price.toFixed(2)} @ ${gb.currentTier.minQty}+`} sx={{ mr: 1 }} />
        ) : (
          <Chip size="small" label="No tier unlocked yet" sx={{ mr: 1 }} />
        )}
        {gb.nextTier && (
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={`${gb.nextTier.qtyNeeded} more for $${gb.nextTier.price.toFixed(2)}`}
          />
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">Tiers</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, mb: 2 }}>
          {(gb.tiers || []).map((t, i) => (
            <Chip key={i} size="small" label={`${t.min_qty}+ → $${t.price.toFixed ? t.price.toFixed(2) : t.price}`} />
          ))}
        </Box>

        {err && <Alert severity="error" sx={{ mb: 1 }}>{err}</Alert>}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            label="Qty"
            type="number"
            size="small"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ width: 100 }}
          />
          <Button variant="contained" onClick={handleCommit} disabled={busy}>
            Commit
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Ends {new Date(gb.endsAt).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

const GroupBuys = () => {
  const [buys, setBuys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await groupBuyService.listOpen();
      setBuys(res.data.groupBuys || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCommit = async (id, quantity) => {
    const res = await groupBuyService.commit(id, quantity);
    setBuys((prev) => prev.map((g) => (g.id === id ? res.data : g)));
  };

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <GroupsIcon color="primary" fontSize="large" />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Group buys</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        The more buyers commit, the better the price. Unlocked tiers apply to everyone.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        {loading ? (
          <Grid item xs={12}><Typography>Loading…</Typography></Grid>
        ) : buys.length === 0 ? (
          <Grid item xs={12}><Typography color="text.secondary">No active group buys. Check back soon.</Typography></Grid>
        ) : (
          buys.map((gb) => (
            <Grid item xs={12} sm={6} md={4} key={gb.id}>
              <GroupBuyCard gb={gb} onCommit={handleCommit} />
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default GroupBuys;
