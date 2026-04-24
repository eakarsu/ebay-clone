import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Paper, Box, Button, TextField, Stack, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
  CircularProgress, FormGroup, FormControlLabel, Checkbox, Snackbar, Link,
} from '@mui/material';
import {
  Add, Delete, Refresh, ContentCopy, VpnKey, Visibility, VisibilityOff,
} from '@mui/icons-material';
import { apiKeyService } from '../services/api';

// Every scope the backend recognizes. Keep this in sync with backend middleware.
const ALL_SCOPES = [
  { value: 'public:read', label: 'Public read (products, categories, search)' },
  { value: 'orders:read', label: 'Read your own orders' },
  { value: 'orders:write', label: 'Create/modify orders' },
  { value: 'listings:read', label: 'Read listings' },
  { value: 'listings:write', label: 'Create/edit listings' },
];

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    rateLimit: 120,
    scopes: { 'public:read': true },
  });
  const [saving, setSaving] = useState(false);

  // One-time display of a newly created or rotated secret — we only get it once.
  const [newSecret, setNewSecret] = useState(null); // { secret, label }
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiKeyService.list();
      setKeys(data.keys || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    try {
      const scopes = Object.entries(form.scopes).filter(([, v]) => v).map(([k]) => k);
      if (scopes.length === 0) {
        setError('Select at least one scope');
        setSaving(false);
        return;
      }
      const { data } = await apiKeyService.create({
        name: form.name.trim() || 'Untitled key',
        scopes,
        rateLimit: Number(form.rateLimit) || 120,
      });
      setCreateOpen(false);
      setNewSecret({ secret: data.secret, label: `Key "${data.key.name}" created` });
      setRevealed(false);
      setForm({ name: '', rateLimit: 120, scopes: { 'public:read': true } });
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create key');
    } finally {
      setSaving(false);
    }
  };

  const handleRotate = async (k) => {
    if (!window.confirm(
      `Rotate "${k.name}"? The current secret will stop working immediately.`
    )) return;
    try {
      const { data } = await apiKeyService.rotate(k.id);
      setNewSecret({ secret: data.secret, label: `Key "${k.name}" rotated` });
      setRevealed(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to rotate key');
    }
  };

  const handleRevoke = async (k) => {
    if (!window.confirm(
      `Revoke "${k.name}"? This cannot be undone — any apps using this key will stop working.`
    )) return;
    try {
      await apiKeyService.delete(k.id);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to revoke key');
    }
  };

  const copySecret = async () => {
    if (!newSecret) return;
    try {
      await navigator.clipboard.writeText(newSecret.secret);
      setCopied(true);
    } catch { /* noop */ }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <VpnKey color="primary" />
          <Typography variant="h4" fontWeight={700}>API Keys</Typography>
        </Stack>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Create key
        </Button>
      </Stack>
      <Typography color="text.secondary" mb={3}>
        Use these keys with the <code>/api/v1</code> endpoints. Send them as{' '}
        <code>X-API-Key: &lt;secret&gt;</code> or <code>Authorization: Bearer &lt;secret&gt;</code>.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
        ) : keys.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              You don't have any API keys yet. Click <b>Create key</b> to generate one.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Prefix</TableCell>
                <TableCell>Scopes</TableCell>
                <TableCell align="right">Rate limit</TableCell>
                <TableCell>Last used</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {keys.map((k) => {
                const revoked = !!k.revoked_at;
                return (
                  <TableRow key={k.id} hover sx={{ opacity: revoked ? 0.55 : 1 }}>
                    <TableCell>{k.name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {k.key_prefix}…
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {(k.scopes || []).map((s) => (
                          <Chip key={s} size="small" label={s} sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{k.rate_limit_per_min}/min</TableCell>
                    <TableCell>
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'never'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={revoked ? 'Revoked' : 'Active'}
                        color={revoked ? 'default' : 'success'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {!revoked && (
                        <>
                          <Tooltip title="Rotate secret">
                            <IconButton size="small" onClick={() => handleRotate(k)}>
                              <Refresh fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Revoke">
                            <IconButton size="small" onClick={() => handleRevoke(k)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create API key</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              placeholder="e.g. Price-sync script"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              helperText="For your reference only"
            />
            <TextField
              label="Rate limit (requests/min)"
              type="number"
              value={form.rateLimit}
              onChange={(e) => setForm({ ...form, rateLimit: e.target.value })}
              inputProps={{ min: 1, max: 10000 }}
            />
            <Box>
              <Typography variant="subtitle2" mb={1}>Scopes</Typography>
              <FormGroup>
                {ALL_SCOPES.map((s) => (
                  <FormControlLabel
                    key={s.value}
                    control={
                      <Checkbox
                        checked={!!form.scopes[s.value]}
                        onChange={(e) => setForm({
                          ...form,
                          scopes: { ...form.scopes, [s.value]: e.target.checked },
                        })}
                      />
                    }
                    label={<><code>{s.value}</code> — {s.label}</>}
                  />
                ))}
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating…' : 'Create key'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Secret-reveal dialog — shown once, right after create/rotate */}
      <Dialog open={!!newSecret} onClose={() => setNewSecret(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{newSecret?.label}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Copy this secret now — it will <b>not</b> be shown again. If you lose it, rotate the key to generate a new one.
          </Alert>
          <TextField
            fullWidth
            value={newSecret?.secret || ''}
            type={revealed ? 'text' : 'password'}
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace' },
              endAdornment: (
                <Stack direction="row">
                  <IconButton size="small" onClick={() => setRevealed(!revealed)}>
                    {revealed ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                  <IconButton size="small" onClick={copySecret}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Stack>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSecret(null)}>Done</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Secret copied to clipboard"
      />
    </Container>
  );
}
