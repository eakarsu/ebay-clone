import React, { useEffect, useState } from 'react';
import {
  Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  TextField, Button, Stack, MenuItem, Alert, CircularProgress, Box,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const CONDITIONS = ['Any', 'New', 'Used', 'Refurbished', 'For Parts'];
const ACTIONS = ['noop', 'block_below', 'auto_markup_10pct', 'discount_15pct', 'dynamic', 'require_reserve'];

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ListingRulesEditor() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: '', condition: '', minPrice: 0, maxPrice: 0, conditionType: 'Any', action: 'noop' });

  const load = () => {
    setLoading(true);
    axios.get(`${API}/custom-views/listing-rules`)
      .then((r) => setRules(r.data.rules || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startNew = () => {
    setEditingId('new');
    setDraft({ name: '', condition: '', minPrice: 0, maxPrice: 0, conditionType: 'Any', action: 'noop' });
  };

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setDraft({ ...rule });
  };

  const cancel = () => { setEditingId(null); setError(null); };

  const save = async () => {
    setError(null);
    try {
      if (editingId === 'new') {
        await axios.post(`${API}/custom-views/listing-rules`, draft, { headers: authHeaders() });
      } else {
        await axios.put(`${API}/custom-views/listing-rules/${editingId}`, draft, { headers: authHeaders() });
      }
      setEditingId(null);
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const remove = async (id) => {
    setError(null);
    try {
      await axios.delete(`${API}/custom-views/listing-rules/${id}`, { headers: authHeaders() });
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  return (
    <Paper sx={{ p: 2 }} data-testid="listing-rules-editor">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Listing Rules Editor</Typography>
        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={startNew}>New Rule</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}><CircularProgress size={18} /> Loading rules...</Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell>Min $</TableCell>
              <TableCell>Max $</TableCell>
              <TableCell>Item Condition</TableCell>
              <TableCell>Action</TableCell>
              <TableCell align="right">Ops</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {editingId === 'new' && (
              <DraftRow draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
            )}
            {rules.map((r) => editingId === r.id ? (
              <DraftRow key={r.id} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
            ) : (
              <TableRow key={r.id} hover>
                <TableCell>{r.name}</TableCell>
                <TableCell><code>{r.condition}</code></TableCell>
                <TableCell>{r.minPrice}</TableCell>
                <TableCell>{r.maxPrice}</TableCell>
                <TableCell>{r.conditionType}</TableCell>
                <TableCell>{r.action}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => startEdit(r)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => remove(r.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}

function DraftRow({ draft, setDraft, onSave, onCancel }) {
  const upd = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  return (
    <TableRow>
      <TableCell><TextField size="small" value={draft.name} onChange={upd('name')} placeholder="rule name" /></TableCell>
      <TableCell><TextField size="small" value={draft.condition} onChange={upd('condition')} placeholder="e.g. category=Electronics" /></TableCell>
      <TableCell><TextField size="small" type="number" value={draft.minPrice} onChange={upd('minPrice')} sx={{ width: 80 }} /></TableCell>
      <TableCell><TextField size="small" type="number" value={draft.maxPrice} onChange={upd('maxPrice')} sx={{ width: 80 }} /></TableCell>
      <TableCell>
        <TextField select size="small" value={draft.conditionType} onChange={upd('conditionType')} sx={{ width: 130 }}>
          {CONDITIONS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </TableCell>
      <TableCell>
        <TextField select size="small" value={draft.action} onChange={upd('action')} sx={{ width: 180 }}>
          {ACTIONS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
        </TextField>
      </TableCell>
      <TableCell align="right">
        <IconButton size="small" color="primary" onClick={onSave}><SaveIcon fontSize="small" /></IconButton>
        <Button size="small" onClick={onCancel}>Cancel</Button>
      </TableCell>
    </TableRow>
  );
}
