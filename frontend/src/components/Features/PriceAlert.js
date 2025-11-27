import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Slider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { NotificationsActive, TrendingDown } from '@mui/icons-material';
import { priceAlertService } from '../../services/api';

const PriceAlert = ({ open, onClose, product, onSuccess }) => {
  const [targetPrice, setTargetPrice] = useState(
    product?.buyNowPrice ? Math.round(product.buyNowPrice * 0.8) : ''
  );
  const [emailNotify, setEmailNotify] = useState(true);
  const [pushNotify, setPushNotify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentPrice = product?.buyNowPrice || product?.currentPrice || 0;
  const minPrice = Math.round(currentPrice * 0.3);
  const maxPrice = currentPrice;

  const handleSubmit = async () => {
    if (!targetPrice || targetPrice >= currentPrice) {
      setError('Target price must be lower than current price');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await priceAlertService.create({
        productId: product.id,
        targetPrice: parseFloat(targetPrice),
        notifyEmail: emailNotify,
        notifyPush: pushNotify,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const percentOff = currentPrice > 0
    ? Math.round((1 - targetPrice / currentPrice) * 100)
    : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsActive color="primary" />
          <Typography variant="h6">Set Price Alert</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Item</Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>{product?.title}</Typography>
          <Typography variant="h6" color="primary.main">
            Current Price: ${currentPrice.toFixed(2)}
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Alert me when price drops to:
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              InputProps={{ startAdornment: '$' }}
              size="small"
              sx={{ width: 150 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingDown color="success" />
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                {percentOff}% off
              </Typography>
            </Box>
          </Box>

          <Slider
            value={targetPrice || minPrice}
            onChange={(e, value) => setTargetPrice(value)}
            min={minPrice}
            max={maxPrice}
            step={1}
            marks={[
              { value: minPrice, label: `$${minPrice}` },
              { value: Math.round(currentPrice * 0.5), label: '50% off' },
              { value: maxPrice, label: `$${maxPrice}` },
            ]}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Notification preferences:</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={emailNotify}
                onChange={(e) => setEmailNotify(e.target.checked)}
              />
            }
            label="Email notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={pushNotify}
                onChange={(e) => setPushNotify(e.target.checked)}
              />
            }
            label="Push notifications"
          />
        </Box>

        <Alert severity="info">
          We'll notify you when the price drops to ${targetPrice || '...'} or below.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !targetPrice}
          startIcon={<NotificationsActive />}
        >
          {loading ? 'Creating...' : 'Create Alert'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PriceAlert;
