import React, { useEffect, useState } from 'react';
import { Chip, Tooltip, Box, Typography } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import { trustScoreService } from '../services/api';

/**
 * Compact trust badge. Renders inline chip; tooltip expands to show the
 * underlying signals that produced the score.
 */
const TrustBadge = ({ userId, size = 'small' }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await trustScoreService.get(userId);
        if (!cancelled) setData(res.data);
      } catch (_) { /* silently hide on error */ }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (!data) return null;

  const tooltip = (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Trust score: {data.score}/100 — {data.tier}
      </Typography>
      {data.signals?.map((s, i) => (
        <Typography key={i} variant="caption" sx={{ display: 'block' }}>
          {s.weight > 0 ? '+' : ''}{s.weight}  {s.name}
        </Typography>
      ))}
    </Box>
  );

  return (
    <Tooltip title={tooltip} arrow>
      <Chip
        size={size}
        color={data.color}
        icon={<VerifiedIcon />}
        label={`${data.tier} · ${data.score}`}
      />
    </Tooltip>
  );
};

export default TrustBadge;
