import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { walletService } from '../services/api';

const Wallet = () => {
  const [data, setData] = useState({ balance: 0, ledger: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await walletService.get();
      setData(res.data);
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

  const handleTopUp = async (e) => {
    e.preventDefault();
    setMsg(null);
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setMsg({ type: 'error', text: 'Enter an amount greater than 0' });
      return;
    }
    try {
      await walletService.topUp(parsed, 'Manual top-up');
      setAmount('');
      setMsg({ type: 'success', text: `Added $${parsed.toFixed(2)} to your wallet` });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  const badgeForReason = (reason) => {
    if (reason?.startsWith('credit:')) return { color: 'success', label: reason };
    if (reason?.startsWith('debit:')) return { color: 'error', label: reason };
    return { color: 'default', label: reason || '—' };
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        My wallet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Store credit earned from referrals, refunds, or top-ups. Apply at checkout.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Balance</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                ${Number(data.balance || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Add funds (dev)</Typography>
            {msg && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.text}</Alert>}
            <Box component="form" onSubmit={handleTopUp} sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Amount (USD)"
                type="number"
                inputProps={{ min: 1, max: 1000, step: '0.01' }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button type="submit" variant="contained">Top up</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Recent activity</Typography>
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : data.ledger?.length === 0 ? (
          <Typography color="text.secondary">No activity yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Note</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Balance after</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.ledger.map((e, i) => {
                const badge = badgeForReason(e.reason);
                const amt = Number(e.amount);
                return (
                  <TableRow key={i}>
                    <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
                    <TableCell><Chip size="small" color={badge.color} label={badge.label} /></TableCell>
                    <TableCell>{e.note || '—'}</TableCell>
                    <TableCell align="right" sx={{ color: amt >= 0 ? 'success.main' : 'error.main' }}>
                      {amt >= 0 ? '+' : ''}{amt.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">${Number(e.balanceAfter).toFixed(2)}</TableCell>
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

export default Wallet;
