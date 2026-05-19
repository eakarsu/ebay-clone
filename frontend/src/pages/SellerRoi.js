import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, Box, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, Pagination, TextField, MenuItem, CircularProgress,
} from '@mui/material';
import { Psychology } from '@mui/icons-material';
import { sellerRoiService } from '../services/api';

/**
 * Seller ROI Dashboard — paginated list of recent sales, plus a one-click
 * AI summary that ties price history + listing scores into actionable advice.
 *
 * Wired to: NEW custom feature #5 (Seller ROI dashboard).
 */
const PAGE_SIZE = 20;

export default function SellerRoi() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, revenue: 0, orders: 0 });
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    try {
      const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
      const r = await sellerRoiService.list({
        since,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setData(r.data);
    } catch (e) { setErr(e.response?.data?.error || e.message); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, days]);

  async function summarize() {
    setBusy(true); setErr('');
    try {
      const r = await sellerRoiService.summary(days);
      setSummary(r.data);
    } catch (e) { setErr(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  }

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Seller ROI Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Recent sales with the listing's AI optimizer score. Use the AI summary to
        find pricing/listing changes that would have netted more.
      </Typography>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary">Orders</Typography>
            <Typography variant="h5">{data.orders}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary">Revenue</Typography>
            <Typography variant="h5">${data.revenue}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField fullWidth select label="Period" value={days} onChange={(e) => { setPage(1); setDays(Number(e.target.value)); }}>
            {[7, 30, 60, 90, 180, 365].map((d) => <MenuItem key={d} value={d}>Last {d} days</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={6} md={3}>
          <Button fullWidth variant="contained" startIcon={busy ? <CircularProgress size={16} /> : <Psychology />} onClick={summarize} disabled={busy}>
            AI Summary
          </Button>
        </Grid>
      </Grid>

      {summary && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>AI Summary</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{summary.summary}</Typography>
            {summary.model && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Model: {summary.model}</Typography>}
          </CardContent>
        </Card>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Title</TableCell>
              <TableCell align="right">Sold for</TableCell>
              <TableCell align="right">Start price</TableCell>
              <TableCell align="right">Current price</TableCell>
              <TableCell align="right">AI Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{row.title || row.product_id}</TableCell>
                <TableCell align="right">${Number(row.total_amount || 0).toFixed(2)}</TableCell>
                <TableCell align="right">{row.starting_price ? `$${Number(row.starting_price).toFixed(2)}` : '-'}</TableCell>
                <TableCell align="right">{row.current_price ? `$${Number(row.current_price).toFixed(2)}` : '-'}</TableCell>
                <TableCell align="right">{row.ai_listing_score ?? '-'}</TableCell>
              </TableRow>
            ))}
            {!data.items.length && (
              <TableRow><TableCell colSpan={6} align="center">No orders in this period.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} />
      </Box>
    </Container>
  );
}
