import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Button,
  Alert,
  Chip,
} from '@mui/material';
import { lowStockService } from '../services/api';

const LowStockAlerts = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [edit, setEdit] = useState({ productId: '', threshold: '' });
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await lowStockService.list();
      setItems(res.data.items || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSet = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await lowStockService.setThreshold(edit.productId, parseInt(edit.threshold, 10));
      setMsg({ type: 'success', text: `Threshold set to ${res.data.threshold}` });
      setEdit({ productId: '', threshold: '' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        Low-stock alerts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Listings that have hit or dropped below their alert threshold. Set threshold to 0 to disable.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Set threshold for a listing
        </Typography>
        <Box component="form" onSubmit={handleSet} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Product ID"
            value={edit.productId}
            onChange={(e) => setEdit({ ...edit, productId: e.target.value })}
            required
            sx={{ flex: 2, minWidth: 260 }}
          />
          <TextField
            size="small"
            label="Threshold"
            type="number"
            inputProps={{ min: 0 }}
            value={edit.threshold}
            onChange={(e) => setEdit({ ...edit, threshold: e.target.value })}
            required
            sx={{ width: 140 }}
          />
          <Button type="submit" variant="contained">
            Save
          </Button>
        </Box>
        {msg && (
          <Alert sx={{ mt: 2 }} severity={msg.type}>
            {msg.text}
          </Alert>
        )}
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Listing</TableCell>
              <TableCell align="right">Remaining</TableCell>
              <TableCell align="right">Threshold</TableCell>
              <TableCell>Last alert</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No listings are currently below their threshold. 🎉
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.title}</TableCell>
                <TableCell align="right">
                  <Chip
                    size="small"
                    color={it.remaining <= 0 ? 'error' : 'warning'}
                    label={it.remaining}
                  />
                </TableCell>
                <TableCell align="right">{it.threshold}</TableCell>
                <TableCell>{it.alertedAt ? new Date(it.alertedAt).toLocaleString() : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default LowStockAlerts;
