import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress, Stack, Chip } from '@mui/material';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export default function ListingSalesChart({ days = 14 }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    axios.get(`${API}/custom-views/listing-sales?days=${days}`)
      .then((r) => { if (mounted) setData(r.data); })
      .catch((e) => { if (mounted) setErr(e.message); });
    return () => { mounted = false; };
  }, [days]);

  if (err) return <Paper sx={{ p: 2 }}>Error: {err}</Paper>;
  if (!data) return <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}><CircularProgress size={18} /> Loading sales...</Paper>;

  const series = data.series || [];
  const max = Math.max(1, ...series.map((s) => s.revenue));
  const width = 720;
  const height = 220;
  const barW = Math.max(8, Math.floor((width - 40) / series.length) - 4);

  return (
    <Paper sx={{ p: 2 }} data-testid="listing-sales-chart">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Listing Sales (last {data.days} days)</Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={`Orders: ${data.totals.orders}`} color="primary" size="small" />
          <Chip label={`Revenue: $${data.totals.revenue.toFixed(2)}`} color="success" size="small" />
        </Stack>
      </Stack>
      <Box sx={{ overflowX: 'auto' }}>
        <svg width={width} height={height} role="img" aria-label="listing sales chart">
          <line x1={30} y1={height - 30} x2={width - 10} y2={height - 30} stroke="#888" />
          {series.map((s, i) => {
            const h = ((s.revenue / max) * (height - 60));
            const x = 30 + i * (barW + 4);
            const y = (height - 30) - h;
            return (
              <g key={s.day}>
                <rect x={x} y={y} width={barW} height={h} fill="#3665f3">
                  <title>{`${s.day}: $${s.revenue.toFixed(2)} (${s.orders} orders)`}</title>
                </rect>
                <text x={x + barW / 2} y={height - 14} textAnchor="middle" fontSize="9" fill="#444">{s.day.slice(5)}</text>
              </g>
            );
          })}
        </svg>
      </Box>
    </Paper>
  );
}
