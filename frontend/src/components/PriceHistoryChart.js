import React, { useEffect, useState } from 'react';
import { Paper, Typography, Box, Chip, CircularProgress, Stack } from '@mui/material';
import api from '../services/api';

/**
 * Dependency-free SVG sparkline of price changes for a product.
 * Keeps layout small; embed inside the product detail right column.
 */
const PriceHistoryChart = ({ productId, priceType = 'buy_now', days = 90, height = 80 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/price-history/${productId}`, { params: { type: priceType, days } })
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err.response?.data?.error || err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [productId, priceType, days]);

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Loading price history…
        </Typography>
      </Paper>
    );
  }

  if (error || !data || !data.history || data.history.length < 2) {
    return null; // not enough data to plot — stay quiet
  }

  const points = data.history.map((h) => parseFloat(h.newPrice));
  const times = data.history.map((h) => new Date(h.changedAt).getTime());
  const minP = Math.min(...points);
  const maxP = Math.max(...points);
  const rangeP = maxP - minP || 1;
  const minT = times[0];
  const maxT = times[times.length - 1];
  const rangeT = maxT - minT || 1;

  const width = 280;
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const path = points
    .map((p, i) => {
      const x = pad + ((times[i] - minT) / rangeT) * w;
      const y = pad + h - ((p - minP) / rangeP) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const first = points[0];
  const last = points[points.length - 1];
  const delta = last - first;
  const deltaPct = first > 0 ? (delta / first) * 100 : 0;
  const trendColor = delta < 0 ? 'success.main' : delta > 0 ? 'error.main' : 'text.secondary';

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Price history · {days}d
        </Typography>
        <Chip
          size="small"
          label={`${delta >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%`}
          sx={{ bgcolor: 'transparent', color: trendColor, fontWeight: 600 }}
        />
      </Stack>
      <Box
        component="svg"
        viewBox={`0 0 ${width} ${height}`}
        sx={{ width: '100%', height, display: 'block' }}
      >
        <path d={path} fill="none" stroke="#3665f3" strokeWidth="1.5" />
        {points.map((p, i) => {
          const x = pad + ((times[i] - minT) / rangeT) * w;
          const y = pad + h - ((p - minP) / rangeP) * h;
          return <circle key={i} cx={x} cy={y} r={1.5} fill="#3665f3" />;
        })}
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Low ${minP.toFixed(2)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          High ${maxP.toFixed(2)}
        </Typography>
      </Stack>
    </Paper>
  );
};

export default PriceHistoryChart;
