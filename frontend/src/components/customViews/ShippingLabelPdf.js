import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack, Alert } from '@mui/material';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export default function ShippingLabelPdf() {
  const [orderId, setOrderId] = useState('1');
  const [status, setStatus] = useState('');

  const handleDownload = async () => {
    setStatus('Generating PDF...');
    try {
      const res = await fetch(`${API}/custom-views/shipping-label/${encodeURIComponent(orderId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipping-label-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus(`Downloaded PDF for order #${orderId}`);
    } catch (e) {
      setStatus(`Failed: ${e.message}`);
    }
  };

  const handlePreview = () => {
    window.open(`${API}/custom-views/shipping-label/${encodeURIComponent(orderId)}`, '_blank');
    setStatus(`Opened preview for order #${orderId}`);
  };

  return (
    <Paper sx={{ p: 2 }} data-testid="shipping-label-pdf">
      <Typography variant="h6" mb={1}>Shipping Label & Invoice PDF</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Generate a printable PDF shipping label and invoice for any order.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField
          label="Order ID"
          size="small"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          sx={{ width: 180 }}
        />
        <Button variant="contained" onClick={handleDownload}>Download PDF</Button>
        <Button variant="outlined" onClick={handlePreview}>Preview</Button>
      </Stack>
      {status && (
        <Box mt={2}>
          <Alert severity="info">{status}</Alert>
        </Box>
      )}
    </Paper>
  );
}
