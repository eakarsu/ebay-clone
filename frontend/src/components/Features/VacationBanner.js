import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle } from '@mui/material';
import { BeachAccess } from '@mui/icons-material';
import { vacationService } from '../../services/api';

// Shows an informational banner when a seller is in vacation mode.
// Accepts a sellerId and silently renders nothing if not on vacation or on fetch failure.
export default function VacationBanner({ sellerId }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!sellerId) return;
    let cancelled = false;
    vacationService.getSellerStatus(sellerId).then(({ data }) => {
      if (cancelled) return;
      const on = data.vacation_mode ?? data.vacationMode;
      if (on) setState(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [sellerId]);

  if (!state) return null;
  const msg = state.vacation_message || state.vacationMessage;
  const date = state.vacation_return_date || state.vacationReturnDate;
  const when = date ? new Date(date).toLocaleDateString() : null;

  return (
    <Alert severity="info" icon={<BeachAccess />} sx={{ mb: 2 }}>
      <AlertTitle>Seller is on vacation</AlertTitle>
      {msg || 'This seller is currently away and may respond more slowly than usual.'}
      {when && <> Expected back <b>{when}</b>.</>}
    </Alert>
  );
}
