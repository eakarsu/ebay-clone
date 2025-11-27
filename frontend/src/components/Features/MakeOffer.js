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
  Chip,
  Divider,
} from '@mui/material';
import { LocalOffer, Gavel } from '@mui/icons-material';
import { offerService } from '../../services/api';

const MakeOffer = ({ open, onClose, product, onSuccess }) => {
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minOffer = product?.buyNowPrice ? product.buyNowPrice * 0.5 : 0;
  const suggestedOffers = product?.buyNowPrice
    ? [0.7, 0.8, 0.9].map(p => (product.buyNowPrice * p).toFixed(2))
    : [];

  const handleSubmit = async () => {
    if (!offerAmount || parseFloat(offerAmount) < minOffer) {
      setError(`Minimum offer is $${minOffer.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await offerService.create({
        productId: product.id,
        offerAmount: parseFloat(offerAmount),
        message,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalOffer color="primary" />
          <Typography variant="h6">Make an Offer</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Item</Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>{product?.title}</Typography>
          <Typography variant="h6" color="primary.main">
            Buy It Now: ${product?.buyNowPrice?.toFixed(2)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>Your Offer</Typography>
        <TextField
          fullWidth
          type="number"
          value={offerAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          InputProps={{ startAdornment: '$' }}
          placeholder="Enter your offer amount"
          sx={{ mb: 2 }}
        />

        {suggestedOffers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Quick offers:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {suggestedOffers.map((amount) => (
                <Chip
                  key={amount}
                  label={`$${amount}`}
                  onClick={() => setOfferAmount(amount)}
                  variant={offerAmount === amount ? 'filled' : 'outlined'}
                  color={offerAmount === amount ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message to the seller (optional)"
          label="Message"
        />

        <Alert severity="info" sx={{ mt: 2 }}>
          Your offer is binding. If the seller accepts, you're obligated to purchase the item.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !offerAmount}
          startIcon={<Gavel />}
        >
          {loading ? 'Submitting...' : 'Submit Offer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MakeOffer;
