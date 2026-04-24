import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, Box, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Select, MenuItem, FormControl, InputLabel, Alert,
} from '@mui/material';
import { TrendingUp, AttachMoney, ShoppingBag, Pending } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { sellerEarningsService } from '../services/api';

const money = (v) => `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Tiny SVG sparkline — avoids pulling in a chart library just for this page.
function Sparkline({ series, width = 600, height = 120 }) {
  if (!series || series.length === 0) {
    return <Typography color="text.secondary"><i>No data in this period.</i></Typography>;
  }
  const values = series.map(p => Number(p.revenue));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = series.length > 1 ? width / (series.length - 1) : 0;
  const points = series.map((p, i) => {
    const x = i * step;
    const y = height - ((Number(p.revenue) - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#3665f3" strokeWidth="2" />
      {series.map((p, i) => {
        const x = i * step;
        const y = height - ((Number(p.revenue) - min) / range) * (height - 10) - 5;
        return <circle key={i} cx={x} cy={y} r="2" fill="#3665f3" />;
      })}
    </svg>
  );
}

export default function SellerEarnings() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const load = (d) => {
    setErr('');
    sellerEarningsService.get(d)
      .then(({ data }) => setData(data))
      .catch(e => setErr(e.response?.data?.error || 'Failed to load earnings'));
  };
  useEffect(() => { load(days); }, [days]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, flex: 1 }}>Earnings</Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Window</InputLabel>
          <Select value={days} label="Window" onChange={e => setDays(e.target.value)}>
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
            <MenuItem value={90}>Last 90 days</MenuItem>
            <MenuItem value={365}>Last 365 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {err && <Alert severity="error">{err}</Alert>}
      {!data ? <Typography>Loading…</Typography> : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <StatCard icon={<AttachMoney />} label="Gross revenue (lifetime)" value={money(data.summary.gross_revenue)} />
            <StatCard icon={<TrendingUp />} label={`Revenue (last ${data.days}d)`} value={money(data.summary.recent_revenue)} />
            <StatCard icon={<Pending />} label="Pending payout" value={money(data.summary.pending_payout)} />
            <StatCard icon={<ShoppingBag />} label={`Orders (last ${data.days}d)`} value={data.summary.recent_orders} />
          </Grid>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Revenue trend</Typography>
              <Sparkline series={data.timeseries} />
            </CardContent>
          </Card>

          <Typography variant="h6" sx={{ mb: 1 }}>Top products</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Units</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.topProducts.map(p => (
                  <TableRow key={p.id} hover component={Link} to={`/product/${p.id}`}
                    sx={{ textDecoration: 'none', '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ width: 64 }}><Avatar variant="rounded" src={p.image} /></TableCell>
                    <TableCell>{p.title}</TableCell>
                    <TableCell align="right">{p.units_sold}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{money(p.revenue)}</TableCell>
                  </TableRow>
                ))}
                {data.topProducts.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center"><i>No sales in this window yet.</i></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Container>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
            {icon}
            <Typography variant="body2" color="text.secondary">{label}</Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}
