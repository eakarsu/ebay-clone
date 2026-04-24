import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Card, CardContent, FormControlLabel, Switch,
  TextField, Button, Box, Alert, Stack,
} from '@mui/material';
import { BeachAccess } from '@mui/icons-material';
import { vacationService } from '../services/api';

export default function VacationMode() {
  const [status, setStatus] = useState({ vacationMode: false, message: '', returnDate: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await vacationService.getStatus();
      setStatus({
        vacationMode: !!(data.vacation_mode ?? data.vacationMode),
        message: data.vacation_message || data.vacationMessage || '',
        returnDate: (data.vacation_return_date || data.vacationReturnDate || '').slice(0, 10),
      });
    } catch (e) {
      setError('Failed to load vacation status');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await vacationService.updateStatus({
        vacationMode: status.vacationMode,
        message: status.message || null,
        returnDate: status.returnDate || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <BeachAccess color="primary" />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Vacation Mode</Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        When vacation mode is on, buyers will see a banner on your listings and store saying
        you're away. Your listings stay visible but won't receive the default search boost.
      </Typography>

      {loading ? (
        <Typography>Loading…</Typography>
      ) : (
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <FormControlLabel
                control={<Switch
                  checked={status.vacationMode}
                  onChange={e => setStatus({ ...status, vacationMode: e.target.checked })}
                />}
                label={status.vacationMode ? 'Vacation mode is ON' : 'Vacation mode is OFF'}
              />
              <TextField
                label="Away message (shown on listings)"
                value={status.message}
                onChange={e => setStatus({ ...status, message: e.target.value })}
                multiline rows={2}
                disabled={!status.vacationMode}
                placeholder="Back on [date]. Thanks for your patience!"
              />
              <TextField
                label="Return date"
                type="date"
                value={status.returnDate}
                onChange={e => setStatus({ ...status, returnDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={!status.vacationMode}
              />
              {error && <Alert severity="error">{error}</Alert>}
              {saved && <Alert severity="success">Saved.</Alert>}
              <Box>
                <Button variant="contained" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
