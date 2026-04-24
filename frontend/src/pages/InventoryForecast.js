import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { inventoryForecastService } from '../services/api';

const STATUS = {
  urgent: { color: 'error', label: 'Restock now' },
  warning: { color: 'warning', label: 'Low cover' },
  ok: { color: 'success', label: 'Healthy' },
  idle: { color: 'default', label: 'Idle' },
  out_of_stock: { color: 'error', label: 'Out of stock' },
};

const InventoryForecast = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await inventoryForecastService.get();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Container sx={{ py: 4 }}><LinearProgress /></Container>;
  if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
  if (!data) return null;

  const { items, summary } = data;
  // Sort by urgency: urgent → warning → ok → idle → out_of_stock.
  const order = ['urgent', 'warning', 'out_of_stock', 'ok', 'idle'];
  const sorted = [...items].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Inventory forecast</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Stock-out predictions based on your last 30 days of sales. Restock urgent items before they hit zero.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { k: 'urgent', label: 'Restock now', color: 'error.main' },
          { k: 'warning', label: 'Low cover', color: 'warning.main' },
          { k: 'ok', label: 'Healthy', color: 'success.main' },
          { k: 'idle', label: 'Idle', color: 'text.secondary' },
          { k: 'outOfStock', label: 'Out of stock', color: 'error.main' },
        ].map((s) => (
          <Grid item xs={6} sm={4} md={2.4} key={s.k}>
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">{s.label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: s.color }}>
                  {summary[s.k] || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3 }}>
        {sorted.length === 0 ? (
          <Typography color="text.secondary">No active listings yet. Create one to see forecasts.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">7d</TableCell>
                <TableCell align="right">30d</TableCell>
                <TableCell align="right">Velocity/day</TableCell>
                <TableCell align="right">Days of cover</TableCell>
                <TableCell>Stock-out</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((it) => {
                const s = STATUS[it.status] || STATUS.ok;
                return (
                  <TableRow key={it.productId} hover>
                    <TableCell>
                      <Box
                        component={RouterLink}
                        to={`/products/${it.slug || it.productId}`}
                        sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {it.title}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{it.stock}</TableCell>
                    <TableCell align="right">{it.units7d}</TableCell>
                    <TableCell align="right">{it.units30d}</TableCell>
                    <TableCell align="right">{it.velocityPerDay}</TableCell>
                    <TableCell align="right">{it.daysOfCover != null ? it.daysOfCover : '—'}</TableCell>
                    <TableCell>
                      {it.stockOutDate ? new Date(it.stockOutDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell><Chip size="small" color={s.color} label={s.label} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default InventoryForecast;
