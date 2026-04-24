import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Typography, Paper, Box, Grid, Stack, Alert, Chip,
  ToggleButton, ToggleButtonGroup, Table, TableHead, TableRow, TableCell,
  TableBody, CircularProgress, Divider,
} from '@mui/material';
import {
  TrendingUp, Visibility, ShoppingCart, Store, Percent, Insights,
} from '@mui/icons-material';
import { analyticsService } from '../services/api';

// Lightweight SVG bar chart — avoids adding a chart library just for two series.
function MiniBarChart({ data, valueKey, labelKey = 'day', color = '#3665f3', height = 120 }) {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="caption" color="text.secondary">No data for this period</Typography>
      </Box>
    );
  }
  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const barW = Math.max(4, Math.floor(100 / data.length) - 1);
  return (
    <Box sx={{ height, display: 'flex', alignItems: 'flex-end', gap: 0.5, pt: 1 }}>
      {data.map((d, i) => {
        const h = (values[i] / max) * (height - 20);
        return (
          <Box
            key={i}
            title={`${d[labelKey]}: ${values[i]}`}
            sx={{
              width: `${barW}%`,
              height: h,
              bgcolor: color,
              borderRadius: '2px 2px 0 0',
              transition: 'height 0.3s',
            }}
          />
        );
      })}
    </Box>
  );
}

function StatCard({ icon, label, value, sub, color = 'primary.main' }) {
  return (
    <Paper sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{
          width: 48, height: 48, borderRadius: 2,
          bgcolor: color, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
      </Stack>
    </Paper>
  );
}

const DAY_OPTIONS = [7, 14, 30, 60, 90];

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [dashboard, setDashboard] = useState(null);
  const [topEvents, setTopEvents] = useState([]);
  const [retention, setRetention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // All three fire in parallel; the dashboard is the only seller-scoped one.
      const [d, te, ret] = await Promise.all([
        analyticsService.sellerDashboard(days),
        analyticsService.topEvents(days),
        analyticsService.retention(),
      ]);
      setDashboard(d.data);
      setTopEvents(te.data.events || []);
      setRetention(ret.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const fmtMoney = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtInt = (n) => Number(n || 0).toLocaleString();
  const fmtPct = (n) => n == null ? '—' : `${Number(n).toFixed(1)}%`;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Insights color="primary" />
          <Typography variant="h4" fontWeight={700}>Analytics</Typography>
        </Stack>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={days}
          onChange={(_, v) => v && setDays(v)}
        >
          {DAY_OPTIONS.map((d) => (
            <ToggleButton key={d} value={d}>{d}d</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && !dashboard ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : dashboard ? (
        <>
          {/* Top-line stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<Store />}
                label="Active listings"
                value={fmtInt(dashboard.totals.listings)}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<TrendingUp />}
                label={`Revenue (${days}d)`}
                value={fmtMoney(dashboard.totals.revenue)}
                color="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<ShoppingCart />}
                label={`Orders (${days}d)`}
                value={fmtInt(dashboard.totals.orders)}
                color="warning.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<Percent />}
                label="View → order conversion"
                value={fmtPct(dashboard.conversion.conversion_pct)}
                sub={`${fmtInt(dashboard.conversion.views)} views, ${fmtInt(dashboard.conversion.orders)} orders`}
                color="secondary.main"
              />
            </Grid>
          </Grid>

          {/* Time-series charts */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Visibility fontSize="small" color="action" />
                  <Typography variant="subtitle2">Product views</Typography>
                </Stack>
                <MiniBarChart data={dashboard.viewsByDay} valueKey="views" color="#3665f3" />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <TrendingUp fontSize="small" color="action" />
                  <Typography variant="subtitle2">Revenue</Typography>
                </Stack>
                <MiniBarChart data={dashboard.revenueByDay} valueKey="revenue" color="#86b817" />
              </Paper>
            </Grid>
          </Grid>

          {/* Top products */}
          <Paper sx={{ p: 2.5, mb: 3 }}>
            <Typography variant="subtitle2" mb={2}>Top products (by GMV)</Typography>
            {dashboard.topProducts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No sales data yet for this period.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">GMV</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboard.topProducts.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ maxWidth: 400 }}>
                        <Typography variant="body2" noWrap title={p.title}>{p.title}</Typography>
                      </TableCell>
                      <TableCell align="right">{fmtInt(p.orders)}</TableCell>
                      <TableCell align="right">{fmtMoney(p.gmv)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>

          {/* Retention + top events side by side */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2.5, height: '100%' }}>
                <Typography variant="subtitle2" mb={2}>Retention (platform-wide)</Typography>
                {retention ? (
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Cohort size</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {fmtInt(retention.cohort_size)}
                      </Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Day 1</Typography>
                      <Chip size="small" label={fmtPct(retention.d1_pct)} />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Day 7</Typography>
                      <Chip size="small" label={fmtPct(retention.d7_pct)} />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Day 30</Typography>
                      <Chip size="small" label={fmtPct(retention.d30_pct)} />
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No data</Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 2.5, height: '100%' }}>
                <Typography variant="subtitle2" mb={2}>Top events ({days}d)</Typography>
                {topEvents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No events tracked yet.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Event</TableCell>
                        <TableCell align="right">Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topEvents.slice(0, 10).map((e) => (
                        <TableRow key={e.event_name} hover>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{e.event_name}</TableCell>
                          <TableCell align="right">{fmtInt(e.count)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      ) : null}
    </Container>
  );
}
