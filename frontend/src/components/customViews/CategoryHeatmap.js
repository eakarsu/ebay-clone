import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

function colorFor(v) {
  // Cool->Hot gradient: blue (low) -> red (high)
  const pct = Math.min(100, Math.max(0, v)) / 100;
  const r = Math.round(54 + (229 - 54) * pct);
  const g = Math.round(101 + (50 - 101) * pct);
  const b = Math.round(243 + (56 - 243) * pct);
  return `rgb(${r},${g},${b})`;
}

export default function CategoryHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    axios.get(`${API}/custom-views/category-heatmap`)
      .then((r) => { if (mounted) setData(r.data); })
      .catch((e) => { if (mounted) setErr(e.message); });
    return () => { mounted = false; };
  }, []);

  if (err) return <Paper sx={{ p: 2 }}>Error: {err}</Paper>;
  if (!data) return <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}><CircularProgress size={18} /> Loading heatmap...</Paper>;

  const { categories, metrics, cells } = data;
  const lookup = {};
  cells.forEach((c) => { lookup[`${c.category}|${c.metric}`] = c.value; });

  return (
    <Paper sx={{ p: 2 }} data-testid="category-heatmap">
      <Typography variant="h6" mb={1}>Category Performance Heatmap</Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ borderCollapse: 'separate', borderSpacing: '2px' }}>
          <thead>
            <tr>
              <th></th>
              {metrics.map((m) => (
                <th key={m} style={{ padding: '4px 8px', fontSize: 12, color: '#444' }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat}>
                <td style={{ padding: '4px 8px', fontWeight: 600, fontSize: 12 }}>{cat}</td>
                {metrics.map((m) => {
                  const v = lookup[`${cat}|${m}`] || 0;
                  return (
                    <td key={m} style={{
                      width: 64, height: 36, textAlign: 'center', color: '#fff',
                      background: colorFor(v), fontWeight: 600, fontSize: 12, borderRadius: 4,
                    }}>
                      {v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
    </Paper>
  );
}
