import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Card, CardContent, CardActions,
  IconButton, Chip, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Switch, MenuItem, Snackbar, Alert, Stack,
} from '@mui/material';
import { Add, Edit, Delete, Star, StarBorder, ContentCopy } from '@mui/icons-material';
import { listingTemplateService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const emptyForm = {
  name: '',
  title: '',
  description: '',
  condition: 'new',
  listingType: 'buy_now',
  startingPrice: '',
  buyNowPrice: '',
  shippingCost: '',
  freeShipping: false,
  brand: '',
  durationDays: 7,
  isDefault: false,
};

export default function ListingTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, 'new' = new, id = edit
  const [form, setForm] = useState(emptyForm);
  const [snack, setSnack] = useState({ open: false, severity: 'success', message: '' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await listingTemplateService.list();
      setTemplates(data || []);
    } catch (e) {
      setSnack({ open: true, severity: 'error', message: 'Failed to load templates' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(emptyForm); setEditing('new'); };
  const openEdit = (t) => {
    const data = t.template_data || t.templateData || {};
    setForm({
      name: t.name,
      title: data.title || '',
      description: data.description || '',
      condition: data.condition || 'new',
      listingType: data.listingType || 'buy_now',
      startingPrice: data.startingPrice ?? '',
      buyNowPrice: data.buyNowPrice ?? '',
      shippingCost: data.shippingCost ?? '',
      freeShipping: !!data.freeShipping,
      brand: data.brand || '',
      durationDays: data.durationDays || 7,
      isDefault: !!t.is_default,
    });
    setEditing(t.id);
  };

  const save = async () => {
    if (!form.name || form.name.trim().length < 2) {
      setSnack({ open: true, severity: 'error', message: 'Name is required' });
      return;
    }
    try {
      const payload = { ...form };
      if (editing === 'new') await listingTemplateService.create(payload);
      else await listingTemplateService.update(editing, payload);
      setEditing(null);
      setSnack({ open: true, severity: 'success', message: 'Template saved' });
      load();
    } catch (e) {
      setSnack({ open: true, severity: 'error', message: 'Failed to save template' });
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await listingTemplateService.remove(id);
      setSnack({ open: true, severity: 'success', message: 'Template deleted' });
      load();
    } catch (e) {
      setSnack({ open: true, severity: 'error', message: 'Delete failed' });
    }
  };

  const useTemplate = async (t) => {
    try {
      await listingTemplateService.apply(t.id);
    } catch {}
    // Pass template data to the Sell page via query string id; Sell page will fetch it.
    navigate(`/sell?templateId=${t.id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flex: 1, fontWeight: 700 }}>Listing Templates</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>New Template</Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Save reusable drafts for listings you create often. Apply a template on the Sell page to pre-fill the form.
      </Typography>

      {loading ? (
        <Typography>Loading…</Typography>
      ) : templates.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">No templates yet</Typography>
          <Typography color="text.secondary">Create your first template to speed up repeat listings.</Typography>
        </CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {templates.map(t => {
            const d = t.template_data || t.templateData || {};
            return (
              <Grid item xs={12} md={6} lg={4} key={t.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      {t.is_default ? <Star color="warning" /> : <StarBorder color="disabled" />}
                      <Typography variant="h6">{t.name}</Typography>
                    </Stack>
                    {d.title && <Typography variant="body2" sx={{ mb: 1 }}><b>Title:</b> {d.title}</Typography>}
                    {d.brand && <Chip size="small" label={d.brand} sx={{ mr: 0.5 }} />}
                    {d.condition && <Chip size="small" label={d.condition} sx={{ mr: 0.5 }} />}
                    {d.listingType && <Chip size="small" label={d.listingType} sx={{ mr: 0.5 }} />}
                    {d.freeShipping && <Chip size="small" label="Free shipping" color="success" />}
                    <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                      Used {t.usage_count || 0} time{t.usage_count === 1 ? '' : 's'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<ContentCopy />} onClick={() => useTemplate(t)}>Use</Button>
                    <Button size="small" startIcon={<Edit />} onClick={() => openEdit(t)}>Edit</Button>
                    <IconButton size="small" color="error" onClick={() => remove(t.id)}><Delete /></IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing === 'new' ? 'New template' : 'Edit template'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Template name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth required />
            <TextField label="Default title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} fullWidth />
            <TextField label="Default description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={3} />
            <Stack direction="row" spacing={2}>
              <TextField select label="Condition" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} fullWidth>
                {['new', 'like_new', 'used', 'refurbished', 'for_parts'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </TextField>
              <TextField select label="Listing type" value={form.listingType} onChange={e => setForm({ ...form, listingType: e.target.value })} fullWidth>
                <MenuItem value="buy_now">Buy It Now</MenuItem>
                <MenuItem value="auction">Auction</MenuItem>
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Starting price" type="number" value={form.startingPrice} onChange={e => setForm({ ...form, startingPrice: e.target.value })} fullWidth />
              <TextField label="Buy-now price" type="number" value={form.buyNowPrice} onChange={e => setForm({ ...form, buyNowPrice: e.target.value })} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Shipping cost" type="number" value={form.shippingCost} onChange={e => setForm({ ...form, shippingCost: e.target.value })} fullWidth disabled={form.freeShipping} />
              <FormControlLabel control={<Switch checked={form.freeShipping} onChange={e => setForm({ ...form, freeShipping: e.target.checked })} />} label="Free shipping" />
            </Stack>
            <TextField label="Brand" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} fullWidth />
            <FormControlLabel control={<Switch checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />} label="Use as default template" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Container>
  );
}
