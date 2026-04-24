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
  IconButton,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { referralService } from '../services/api';

const Referrals = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await referralService.me();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch (_) { /* ignore */ }
  };

  if (loading) return <Container sx={{ py: 4 }}><Typography>Loading…</Typography></Container>;
  if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>Refer friends, earn credit</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Get ${data.rewards.signup.toFixed(2)} when a friend signs up and an extra ${data.rewards.firstPurchase.toFixed(2)} when they place their first order.
      </Typography>

      {copied && <Alert severity="success" sx={{ mb: 2 }}>Copied {copied}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">Your code</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="h3" sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>
                {data.code}
              </Typography>
              <Tooltip title="Copy code">
                <IconButton onClick={() => copy(data.code, 'code')}><ContentCopyIcon /></IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={data.link} InputProps={{ readOnly: true }} />
              <Button onClick={() => copy(data.link, 'link')} variant="outlined">Copy link</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">Signups</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{data.signups}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">Purchases</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{data.purchases}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography variant="overline" color="success.contrastText">Total earned</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.contrastText' }}>
                    ${Number(data.rewardTotal || 0).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>How it works</Typography>
        <Box component="ol" sx={{ m: 0, pl: 3, color: 'text.secondary' }}>
          <li>Share your link or code with anyone who'd enjoy the marketplace.</li>
          <li>When they sign up with your code, both of you get store credit.</li>
          <li>When they complete their first purchase, you get a bigger bonus.</li>
        </Box>
      </Paper>
    </Container>
  );
};

export default Referrals;
