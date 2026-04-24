import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Card, CardContent, Box, Button, TextField,
  Stack, Alert, Switch, FormControlLabel, IconButton, Divider,
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { bundleDiscountService } from '../services/api';

export default function BundleDiscounts() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', minItems: 2, discountPercent: 10, isActive: true });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await bundleDiscountService.listMine();
      setRules(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load bundle rules');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setError('');
    try {
      await bundleDiscountService.create({
        name: form.name,
        minItems: Number(form.minItems),
        discountPercent: Number(form.discountPercent),
        isActive: form.isActive,
      });
      setForm({ name: '', minItems: 2, discountPercent: 10, isActive: true });
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create');
    }
  };

  const toggleActive = async (rule) => {
    try {
      await bundleDiscountService.update(rule.id, { isActive: !rule.is_active });
      load();
    } catch (e) {
      setError('Failed to update');
    }
  };

  const remove = async (id) => {
    try {
      await bundleDiscountService.delete(id);
      load();
    } catch (e) {
      setError('Failed to delete');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Bundle Discounts</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Reward buyers who buy multiple items from your store. The highest-matching rule
        applies per seller at checkout.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>New bundle rule</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Rule name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Min items"
              type="number"
              value={form.minItems}
              onChange={e => setForm({ ...form, minItems: e.target.value })}
              inputProps={{ min: 2 }}
              sx={{ width: { sm: 140 } }}
            />
            <TextField
              label="Discount %"
              type="number"
              value={form.discountPercent}
              onChange={e => setForm({ ...form, discountPercent: e.target.value })}
              inputProps={{ min: 1, max: 100 }}
              sx={{ width: { sm: 140 } }}
            />
          </Stack>
          <FormControlLabel
            control={<Switch
              checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
            />}
            label="Active"
          />
          <Box sx={{ mt: 1 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={create}
              disabled={!form.name || !form.discountPercent}
            >
              Add rule
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 1 }}>Your rules</Typography>
      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : rules.length === 0 ? (
        <Typography color="text.secondary">No bundle rules yet.</Typography>
      ) : (
        <Stack spacing={1}>
          {rules.map(rule => (
            <Card key={rule.id} variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1">{rule.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Buy {rule.min_items}+ items → {Number(rule.discount_percent)}% off
                  </Typography>
                </Box>
                <FormControlLabel
                  control={<Switch
                    checked={!!rule.is_active}
                    onChange={() => toggleActive(rule)}
                  />}
                  label={rule.is_active ? 'Active' : 'Paused'}
                />
                <IconButton color="error" onClick={() => remove(rule.id)}>
                  <Delete />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
