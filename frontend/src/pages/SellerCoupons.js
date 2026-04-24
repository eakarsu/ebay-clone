import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Typography, Paper, Box, Button, TextField, Stack, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Tabs, Tab, Switch, FormControlLabel, InputAdornment, Tooltip,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, LocalOffer } from '@mui/icons-material';
import { couponService } from '../services/api';

// Seller-side CRUD for coupon codes. Tabs filter by status; matches the
// backend's /coupons/my?status= semantics (active | expired | inactive).
const STATUS_TABS = [
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired',  label: 'Expired' },
  { value: '',         label: 'All' },
];

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  minPurchaseAmount: '',
  maxDiscountAmount: '',
  usageLimit: '',
  perUserLimit: 1,
  startDate: '',
  endDate: '',
};

export default function SellerCoupons() {
  const [status, setStatus] = useState('active');
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // coupon being edited
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await couponService.listMine({ status: status || undefined });
      setCoupons(data.coupons || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    // Default the date range to a sensible 30-day window from today.
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    setForm({
      ...emptyForm,
      startDate: now.toISOString().slice(0, 10),
      endDate: in30.toISOString().slice(0, 10),
    });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : undefined,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : 1,
        startDate: form.startDate,
        endDate: form.endDate,
      };
      if (!payload.code || !payload.startDate || !payload.endDate) {
        setError('Code, start date and end date are required');
        setSaving(false);
        return;
      }
      await couponService.create(payload);
      setCreateOpen(false);
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c) => {
    setEditTarget(c);
    setForm({
      ...emptyForm,
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      usageLimit: c.usageLimit || '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : '',
      isActive: c.isActive,
    });
  };

  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    try {
      await couponService.update(editTarget.id, {
        description: form.description,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        endDate: form.endDate,
        isActive: form.isActive,
      });
      setEditTarget(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    try {
      await couponService.delete(c.id);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to delete coupon');
    }
  };

  const formatDiscount = (c) =>
    c.discountType === 'percentage'
      ? `${Number(c.discountValue)}%`
      : `$${Number(c.discountValue).toFixed(2)}`;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LocalOffer color="primary" />
          <Typography variant="h4" fontWeight={700}>Coupon Codes</Typography>
        </Stack>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          New coupon
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={status}
          onChange={(_, v) => setStatus(v)}
          variant="scrollable"
        >
          {STATUS_TABS.map((t) => (
            <Tab key={t.value || 'all'} value={t.value} label={t.label} />
          ))}
        </Tabs>
      </Paper>

      <Paper>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
        ) : coupons.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No coupons in this bucket. Click <b>New coupon</b> to create one.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Used</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {c.code}
                  </TableCell>
                  <TableCell>{formatDiscount(c)}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography variant="body2" noWrap title={c.description}>
                      {c.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {c.usageCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </TableCell>
                  <TableCell>
                    {c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={c.isActive ? 'Active' : 'Inactive'}
                      color={c.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(c)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(c)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create a coupon</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Code"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              helperText="Stored in uppercase, e.g. SPRING20"
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={2}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Type"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                sx={{ flex: 1 }}
              >
                <MenuItem value="percentage">Percentage off</MenuItem>
                <MenuItem value="fixed_amount">Fixed amount off</MenuItem>
              </TextField>
              <TextField
                label="Value"
                required
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                sx={{ flex: 1 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {form.discountType === 'percentage' ? '%' : '$'}
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Min purchase"
                type="number"
                value={form.minPurchaseAmount}
                onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })}
                sx={{ flex: 1 }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
              <TextField
                label="Max discount"
                type="number"
                value={form.maxDiscountAmount}
                onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                sx={{ flex: 1 }}
                helperText="Only for % coupons"
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Total usage limit"
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                sx={{ flex: 1 }}
                helperText="Blank = unlimited"
              />
              <TextField
                label="Per-user limit"
                type="number"
                value={form.perUserLimit}
                onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Start date"
                type="date"
                required
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="End date"
                type="date"
                required
                InputLabelProps={{ shrink: true }}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog — only fields the backend PUT accepts */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit {editTarget?.code}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Code, discount value, and start date can't be changed after creation.
            </Alert>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={2}
            />
            <TextField
              label="Total usage limit"
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            />
            <TextField
              label="End date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
