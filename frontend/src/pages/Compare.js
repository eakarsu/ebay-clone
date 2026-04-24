import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Paper, Box, Button, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Stack,
  IconButton, Tooltip,
} from '@mui/material';
import { Close, ShoppingCart } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { compareService } from '../services/api';

const STORAGE_KEY = 'compare:productIds';

export function useCompareList() {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });
  const persist = (next) => { setIds(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };
  const add = (id) => { if (!ids.includes(id) && ids.length < 4) persist([...ids, id]); };
  const remove = (id) => persist(ids.filter(x => x !== id));
  const clear = () => persist([]);
  const has = (id) => ids.includes(id);
  return { ids, add, remove, clear, has };
}

export default function Compare() {
  const { ids, remove, clear } = useCompareList();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ids.length < 2) { setData(null); return; }
    setLoading(true);
    compareService.compare(ids)
      .then(({ data }) => setData(data))
      .catch(e => setErr(e.response?.data?.error || 'Failed to compare'))
      .finally(() => setLoading(false));
  }, [ids.join(',')]);

  if (ids.length < 2) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Compare Products</Typography>
        <Alert severity="info">
          Add at least 2 products (up to 4) from their product cards to compare them side by side.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, flex: 1 }}>Compare Products</Typography>
        <Button size="small" onClick={clear}>Clear all</Button>
      </Stack>

      {err && <Alert severity="error">{err}</Alert>}
      {loading && <Typography>Loading…</Typography>}

      {data && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 180 }}></TableCell>
                {data.products.map(p => (
                  <TableCell key={p.id} sx={{ minWidth: 200, verticalAlign: 'top' }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="start">
                        <Avatar variant="rounded" src={p.image} sx={{ width: 64, height: 64 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" component={Link}
                            to={`/product/${p.id}`} sx={{ textDecoration: 'none', color: 'primary.main' }}>
                            {p.title}
                          </Typography>
                        </Box>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => remove(p.id)}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                      <Button size="small" variant="outlined" startIcon={<ShoppingCart />}
                        onClick={() => navigate(`/product/${p.id}`)}>View</Button>
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.matrix.map((row, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>{row.label}</TableCell>
                  {row.values.map((v, j) => (
                    <TableCell key={j}>
                      {row.label === 'Price' && typeof v === 'number' ? `$${v.toFixed(2)}` : String(v ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
