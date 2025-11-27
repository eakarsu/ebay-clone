import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
  Home,
  LocalShipping,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Addresses = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    addressType: 'shipping',
    isDefault: false,
    fullName: '',
    streetAddress: '',
    streetAddress2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/addresses');
      setAddresses(response.data.addresses);
    } catch (err) {
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        addressType: address.addressType || 'shipping',
        isDefault: address.isDefault || false,
        fullName: address.fullName || '',
        streetAddress: address.streetAddress || '',
        streetAddress2: address.streetAddress2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'United States',
        phone: address.phone || '',
      });
    } else {
      setEditingAddress(null);
      setFormData({
        addressType: 'shipping',
        isDefault: false,
        fullName: '',
        streetAddress: '',
        streetAddress2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        phone: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAddress(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress.id}`, formData);
        setSuccess('Address updated successfully');
      } else {
        await api.post('/addresses', formData);
        setSuccess('Address added successfully');
      }
      handleCloseDialog();
      fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await api.delete(`/addresses/${id}`);
      setSuccess('Address deleted successfully');
      fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (address) => {
    try {
      await api.put(`/addresses/${address.id}`, {
        ...address,
        isDefault: true,
      });
      setSuccess('Default address updated');
      fetchAddresses();
    } catch (err) {
      setError('Failed to set default address');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const shippingAddresses = addresses.filter(a => a.addressType === 'shipping');
  const billingAddresses = addresses.filter(a => a.addressType === 'billing');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          My Addresses
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Address
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Shipping Addresses */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <LocalShipping sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">Shipping Addresses</Typography>
        </Box>

        {shippingAddresses.length === 0 ? (
          <Typography color="text.secondary">
            No shipping addresses saved. Add one to make checkout faster.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {shippingAddresses.map((address) => (
              <Grid item xs={12} md={6} key={address.id}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {address.fullName}
                      </Typography>
                      {address.isDefault && (
                        <Chip label="Default" size="small" color="primary" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {address.streetAddress}
                      {address.streetAddress2 && <><br />{address.streetAddress2}</>}
                      <br />
                      {address.city}, {address.state} {address.postalCode}
                      <br />
                      {address.country}
                    </Typography>
                    {address.phone && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Phone: {address.phone}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<Edit />} onClick={() => handleOpenDialog(address)}>
                      Edit
                    </Button>
                    <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(address.id)}>
                      Delete
                    </Button>
                    {!address.isDefault && (
                      <Button size="small" onClick={() => handleSetDefault(address)}>
                        Set as Default
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Billing Addresses */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Home sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">Billing Addresses</Typography>
        </Box>

        {billingAddresses.length === 0 ? (
          <Typography color="text.secondary">
            No billing addresses saved.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {billingAddresses.map((address) => (
              <Grid item xs={12} md={6} key={address.id}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {address.fullName}
                      </Typography>
                      {address.isDefault && (
                        <Chip label="Default" size="small" color="primary" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {address.streetAddress}
                      {address.streetAddress2 && <><br />{address.streetAddress2}</>}
                      <br />
                      {address.city}, {address.state} {address.postalCode}
                      <br />
                      {address.country}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<Edit />} onClick={() => handleOpenDialog(address)}>
                      Edit
                    </Button>
                    <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(address.id)}>
                      Delete
                    </Button>
                    {!address.isDefault && (
                      <Button size="small" onClick={() => handleSetDefault(address)}>
                        Set as Default
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAddress ? 'Edit Address' : 'Add New Address'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Address Type</InputLabel>
                  <Select
                    name="addressType"
                    value={formData.addressType}
                    onChange={handleChange}
                    label="Address Type"
                  >
                    <MenuItem value="shipping">Shipping</MenuItem>
                    <MenuItem value="billing">Billing</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Apt, Suite, Unit (Optional)"
                  name="streetAddress2"
                  value={formData.streetAddress2}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State/Province"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ZIP/Postal Code"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone (Optional)"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleChange}
                    />
                  }
                  label="Set as default address"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : (editingAddress ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Addresses;
