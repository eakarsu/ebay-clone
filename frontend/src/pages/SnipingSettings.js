import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Card, CardContent, Box, Button, TextField,
  Switch, FormControlLabel, Alert, Stack,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { snipingService } from '../services/api';

/**
 * Per-listing Auction Sniping Protection settings.
 *
 * Soft-extends the auction end_time when a bid arrives within `windowSec`
 * of the end. Caps total extensions via `maxExtensions` so a long sniping
 * war can't keep an auction open forever.
 */
export default function SnipingSettings() {
  const { productId } = useParams();
  const [cfg, setCfg] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setErr('');
    try {
      const r = await snipingService.get(productId);
      setCfg(r.data);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [productId]);

  async function save() {
    setBusy(true); setErr(''); setMsg('');
    try {
      await snipingService.update(productId, {
        enabled: cfg.enabled,
        windowSec: Number(cfg.windowSec),
        amountSec: Number(cfg.amountSec),
        maxExtensions: Number(cfg.maxExtensions),
      });
      setMsg('Saved.');
      load();
    } catch (e) { setErr(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  }

  if (!cfg) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        {err ? <Alert severity="error">{err}</Alert> : <Typography>Loading…</Typography>}
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Auction Sniping Protection</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Listing #{productId} ends {new Date(cfg.auctionEnd).toLocaleString()}.
        Used {cfg.usedExtensions}/{cfg.maxExtensions} extensions so far.
      </Typography>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}

      <Card><CardContent>
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={cfg.enabled}
                onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })}
              />
            }
            label="Enable soft-close extension on late bids"
          />
          <TextField
            label="Window (seconds before end to trigger)"
            type="number" inputProps={{ min: 5, max: 600 }}
            value={cfg.windowSec}
            onChange={(e) => setCfg({ ...cfg, windowSec: e.target.value })}
            helperText="A bid landing within this many seconds of the auction end will trigger an extension."
          />
          <TextField
            label="Extension (seconds added each time)"
            type="number" inputProps={{ min: 10, max: 1800 }}
            value={cfg.amountSec}
            onChange={(e) => setCfg({ ...cfg, amountSec: e.target.value })}
          />
          <TextField
            label="Max extensions (cap to prevent never-ending wars)"
            type="number" inputProps={{ min: 0, max: 100 }}
            value={cfg.maxExtensions}
            onChange={(e) => setCfg({ ...cfg, maxExtensions: e.target.value })}
          />
          <Box>
            <Button variant="contained" onClick={save} disabled={busy}>Save</Button>
          </Box>
        </Stack>
      </CardContent></Card>
    </Container>
  );
}
