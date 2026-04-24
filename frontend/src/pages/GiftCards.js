import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, Box, Button, TextField,
  Tabs, Tab, Alert, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Stack, IconButton, Tooltip,
} from '@mui/material';
import { CardGiftcard, ContentCopy, Redeem, AccountBalanceWallet } from '@mui/icons-material';
import { giftCardService } from '../services/api';

export default function GiftCards() {
  const [tab, setTab] = useState(0);
  const [balance, setBalance] = useState({ balance: 0, transactions: [] });
  const [purchased, setPurchased] = useState([]);

  const [amount, setAmount] = useState(25);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [buyResult, setBuyResult] = useState(null);
  const [buyErr, setBuyErr] = useState('');

  const [code, setCode] = useState('');
  const [redeemResult, setRedeemResult] = useState(null);
  const [redeemErr, setRedeemErr] = useState('');

  const refresh = async () => {
    try {
      const [{ data: b }, { data: p }] = await Promise.all([
        giftCardService.getBalance(),
        giftCardService.myPurchased(),
      ]);
      setBalance(b);
      setPurchased(p);
    } catch {}
  };
  useEffect(() => { refresh(); }, []);

  const buy = async () => {
    setBuyErr(''); setBuyResult(null);
    try {
      const { data } = await giftCardService.purchase({
        amount: Number(amount),
        recipientEmail: recipient || null,
        message: message || null,
      });
      setBuyResult(data);
      refresh();
    } catch (e) {
      setBuyErr(e.response?.data?.error || 'Purchase failed');
    }
  };

  const redeem = async () => {
    setRedeemErr(''); setRedeemResult(null);
    try {
      const { data } = await giftCardService.redeem(code.trim());
      setRedeemResult(data);
      setCode('');
      refresh();
    } catch (e) {
      setRedeemErr(e.response?.data?.error || 'Redeem failed');
    }
  };

  const copy = (text) => navigator.clipboard?.writeText(text);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <CardGiftcard color="primary" />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Gift Cards & Store Credit</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AccountBalanceWallet color="success" fontSize="large" />
            <Box>
              <Typography variant="body2" color="text.secondary">Your store credit balance</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>${Number(balance.balance).toFixed(2)}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Buy a gift card" />
        <Tab label="Redeem a code" />
        <Tab label="My purchased cards" />
        <Tab label="Credit history" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent>
            <Stack spacing={2} sx={{ maxWidth: 500 }}>
              <TextField label="Amount (USD)" type="number" value={amount} onChange={e => setAmount(e.target.value)} inputProps={{ min: 5, max: 1000 }} fullWidth />
              <TextField label="Recipient email (optional)" value={recipient} onChange={e => setRecipient(e.target.value)} fullWidth />
              <TextField label="Personal message (optional)" value={message} onChange={e => setMessage(e.target.value)} multiline rows={2} fullWidth />
              {buyErr && <Alert severity="error">{buyErr}</Alert>}
              {buyResult && (
                <Alert severity="success" action={
                  <Tooltip title="Copy code"><IconButton onClick={() => copy(buyResult.code)}><ContentCopy /></IconButton></Tooltip>
                }>
                  Gift card purchased! Code: <b>{buyResult.code}</b>
                </Alert>
              )}
              <Box><Button variant="contained" onClick={buy}>Purchase</Button></Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Stack spacing={2} sx={{ maxWidth: 500 }}>
              <TextField label="Gift card code" value={code} onChange={e => setCode(e.target.value)} placeholder="GIFT-XXXX-XXXX-XXXX" fullWidth />
              {redeemErr && <Alert severity="error">{redeemErr}</Alert>}
              {redeemResult && (
                <Alert severity="success">
                  Added ${Number(redeemResult.credited).toFixed(2)} to your balance. New balance: ${Number(redeemResult.balance).toFixed(2)}
                </Alert>
              )}
              <Box><Button variant="contained" startIcon={<Redeem />} onClick={redeem}>Redeem</Button></Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Purchased</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchased.map(c => (
                <TableRow key={c.id}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {c.code}
                    <IconButton size="small" onClick={() => copy(c.code)}><ContentCopy fontSize="small" /></IconButton>
                  </TableCell>
                  <TableCell>${Number(c.amount).toFixed(2)}</TableCell>
                  <TableCell>{c.recipient_email || c.recipientEmail || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" color={c.redeemed ? 'success' : 'default'}
                      label={c.redeemed ? 'Redeemed' : 'Unredeemed'} />
                  </TableCell>
                  <TableCell>{new Date(c.created_at || c.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {purchased.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center"><i>No purchases yet</i></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 3 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Amount</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {balance.transactions.map(t => (
                <TableRow key={t.id}>
                  <TableCell sx={{ color: Number(t.amount) >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                    {Number(t.amount) >= 0 ? '+' : ''}${Number(t.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{t.reason.replace(/_/g, ' ')}</TableCell>
                  <TableCell>{new Date(t.created_at || t.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {balance.transactions.length === 0 && (
                <TableRow><TableCell colSpan={3} align="center"><i>No activity yet</i></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
