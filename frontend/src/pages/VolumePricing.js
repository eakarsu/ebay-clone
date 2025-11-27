import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ShoppingCart,
  Add,
  Delete,
  Edit,
  CheckCircle,
  Info,
  LocalOffer,
  TrendingDown,
  Savings,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const VolumePricing = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([
    {
      id: 1,
      title: 'Vintage T-Shirt',
      basePrice: 25.00,
      quantity: 50,
      volumePricing: [
        { minQty: 2, discount: 5 },
        { minQty: 5, discount: 10 },
        { minQty: 10, discount: 15 },
      ],
      enabled: true,
    },
    {
      id: 2,
      title: 'Phone Cases (Pack)',
      basePrice: 12.99,
      quantity: 100,
      volumePricing: [
        { minQty: 3, discount: 8 },
        { minQty: 6, discount: 15 },
        { minQty: 12, discount: 20 },
      ],
      enabled: true,
    },
  ]);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [tiers, setTiers] = useState([
    { minQty: 2, discount: 5 },
    { minQty: 5, discount: 10 },
    { minQty: 10, discount: 15 },
  ]);

  const handleEditListing = (listing) => {
    setSelectedListing(listing);
    setTiers(listing.volumePricing || [{ minQty: 2, discount: 5 }]);
    setEditDialog(true);
  };

  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    setTiers([...tiers, { minQty: lastTier.minQty + 5, discount: lastTier.discount + 5 }]);
  };

  const handleRemoveTier = (index) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleUpdateTier = (index, field, value) => {
    const newTiers = [...tiers];
    newTiers[index][field] = parseInt(value) || 0;
    setTiers(newTiers);
  };

  const handleSave = () => {
    setListings(listings.map(l =>
      l.id === selectedListing.id
        ? { ...l, volumePricing: tiers }
        : l
    ));
    setEditDialog(false);
  };

  const toggleEnabled = (listingId) => {
    setListings(listings.map(l =>
      l.id === listingId ? { ...l, enabled: !l.enabled } : l
    ));
  };

  const calculatePrice = (basePrice, discount) => {
    return (basePrice * (1 - discount / 100)).toFixed(2);
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Savings sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to manage volume pricing</Typography>
        <Button component={Link} to="/login" variant="contained">Sign In</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          <Savings sx={{ mr: 1, verticalAlign: 'middle' }} />
          Volume Pricing
        </Typography>
        <Typography color="text.secondary">
          Offer discounts when buyers purchase multiple items
        </Typography>
      </Box>

      {/* How It Works */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.50' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Buy More, Save More
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Chip label="1" color="primary" size="small" />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Set Quantity Tiers</Typography>
                <Typography variant="body2" color="text.secondary">
                  Define discount tiers based on quantity purchased
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Chip label="2" color="primary" size="small" />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Buyers See Savings</Typography>
                <Typography variant="body2" color="text.secondary">
                  Discounts are shown prominently on your listing
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Chip label="3" color="primary" size="small" />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Increase Sales</Typography>
                <Typography variant="body2" color="text.secondary">
                  Encourage larger orders and reduce per-item shipping costs
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Example Display */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          How Buyers See Volume Pricing
        </Typography>
        <Card sx={{ maxWidth: 400 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Sample Product - $25.00
            </Typography>
            <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 600, mb: 1 }}>
                <LocalOffer sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                Buy More, Save More
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Buy 2+</TableCell>
                    <TableCell>$23.75 each</TableCell>
                    <TableCell><Chip label="5% off" size="small" color="success" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Buy 5+</TableCell>
                    <TableCell>$22.50 each</TableCell>
                    <TableCell><Chip label="10% off" size="small" color="success" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Buy 10+</TableCell>
                    <TableCell>$21.25 each</TableCell>
                    <TableCell><Chip label="15% off" size="small" color="success" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>
      </Paper>

      {/* Listings with Volume Pricing */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Your Listings with Volume Pricing
      </Typography>

      {listings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingCart sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>No volume pricing configured</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Set up volume pricing on your listings to encourage bulk purchases
          </Typography>
          <Button component={Link} to="/my-listings" variant="contained">
            Manage Listings
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Listing</TableCell>
                <TableCell align="right">Base Price</TableCell>
                <TableCell>Pricing Tiers</TableCell>
                <TableCell align="center">Enabled</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{listing.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {listing.quantity} in stock
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    ${listing.basePrice.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {listing.volumePricing.map((tier, index) => (
                        <Chip
                          key={index}
                          label={`${tier.minQty}+: ${tier.discount}% off`}
                          size="small"
                          variant="outlined"
                          color={listing.enabled ? 'success' : 'default'}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={listing.enabled}
                      onChange={() => toggleEnabled(listing.id)}
                      color="success"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEditListing(listing)}
                    >
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Benefits */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDown sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Lower Per-Unit Costs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reduce shipping and handling costs per item when selling in bulk
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingCart sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Larger Orders
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Encourage buyers to purchase more items in a single transaction
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Savings sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Competitive Edge
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stand out from competitors by offering volume discounts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Volume Pricing</DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box sx={{ py: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {selectedListing.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Base price: ${selectedListing.basePrice.toFixed(2)}
              </Typography>

              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Discount Tiers
              </Typography>

              {tiers.map((tier, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label="Min Quantity"
                    type="number"
                    size="small"
                    value={tier.minQty}
                    onChange={(e) => handleUpdateTier(index, 'minQty', e.target.value)}
                    sx={{ width: 120 }}
                  />
                  <TextField
                    label="Discount %"
                    type="number"
                    size="small"
                    value={tier.discount}
                    onChange={(e) => handleUpdateTier(index, 'discount', e.target.value)}
                    sx={{ width: 120 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    = ${calculatePrice(selectedListing.basePrice, tier.discount)} each
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveTier(index)}
                    disabled={tiers.length <= 1}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}

              <Button
                startIcon={<Add />}
                onClick={handleAddTier}
                disabled={tiers.length >= 5}
                sx={{ mt: 1 }}
              >
                Add Tier
              </Button>

              <Alert severity="info" sx={{ mt: 3 }}>
                Tip: Start with a small discount (5-10%) for 2+ items and increase for larger quantities.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VolumePricing;
