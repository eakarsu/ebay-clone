import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Public,
  LocalShipping,
  Calculate,
  Info,
  CheckCircle,
  Flight,
  Inventory,
  AttachMoney,
} from '@mui/icons-material';
import api from '../services/api';

const GSP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [shippingEstimate, setShippingEstimate] = useState(null);

  const countries = [
    { code: 'UK', name: 'United Kingdom', dutyRate: 0, taxRate: 20, deliveryDays: '7-12' },
    { code: 'DE', name: 'Germany', dutyRate: 0, taxRate: 19, deliveryDays: '8-14' },
    { code: 'FR', name: 'France', dutyRate: 0, taxRate: 20, deliveryDays: '8-14' },
    { code: 'AU', name: 'Australia', dutyRate: 5, taxRate: 10, deliveryDays: '10-18' },
    { code: 'CA', name: 'Canada', dutyRate: 0, taxRate: 5, deliveryDays: '5-10' },
    { code: 'JP', name: 'Japan', dutyRate: 0, taxRate: 10, deliveryDays: '8-14' },
    { code: 'IT', name: 'Italy', dutyRate: 0, taxRate: 22, deliveryDays: '8-14' },
    { code: 'ES', name: 'Spain', dutyRate: 0, taxRate: 21, deliveryDays: '8-14' },
    { code: 'NL', name: 'Netherlands', dutyRate: 0, taxRate: 21, deliveryDays: '7-12' },
    { code: 'BR', name: 'Brazil', dutyRate: 60, taxRate: 17, deliveryDays: '12-20' },
  ];

  const steps = [
    {
      label: 'Seller Ships to GSP Hub',
      description: 'Ship your item to our domestic GSP center. We handle international customs documentation.',
    },
    {
      label: 'GSP Processes Package',
      description: 'Our team inspects, repackages if needed, and prepares customs paperwork.',
    },
    {
      label: 'International Shipping',
      description: 'Package is shipped internationally with all duties and taxes pre-calculated.',
    },
    {
      label: 'Buyer Receives Item',
      description: 'Item clears customs and is delivered to the buyer with no surprise fees.',
    },
  ];

  const calculateShipping = async () => {
    if (!selectedCountry || !itemPrice) {
      setError('Please select a country and enter item price');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/gsp/calculate', {
        countryCode: selectedCountry,
        itemPrice: parseFloat(itemPrice),
        weight: itemWeight ? parseFloat(itemWeight) : 1,
      });
      setShippingEstimate(response.data);
    } catch (err) {
      // Fallback calculation if API fails
      const country = countries.find(c => c.code === selectedCountry);
      const price = parseFloat(itemPrice);
      const weight = itemWeight ? parseFloat(itemWeight) : 1;

      const baseShipping = 15 + (weight * 5);
      const duty = price * (country.dutyRate / 100);
      const tax = (price + duty) * (country.taxRate / 100);
      const gspFee = 5.99;

      setShippingEstimate({
        country: country.name,
        itemPrice: price,
        shippingCost: baseShipping.toFixed(2),
        dutyAmount: duty.toFixed(2),
        taxAmount: tax.toFixed(2),
        gspFee: gspFee.toFixed(2),
        totalCost: (price + baseShipping + duty + tax + gspFee).toFixed(2),
        estimatedDelivery: country.deliveryDays,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Public sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          Global Shipping Program
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Ship internationally with ease - We handle customs, duties, and import fees
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Calculator Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calculate /> Shipping Calculator
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Destination Country</InputLabel>
              <Select
                value={selectedCountry}
                label="Destination Country"
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                {countries.map((country) => (
                  <MenuItem key={country.code} value={country.code}>
                    {country.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Item Price"
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Package Weight (lbs)"
              type="number"
              value={itemWeight}
              onChange={(e) => setItemWeight(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">lbs</InputAdornment>,
              }}
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={calculateShipping}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Calculate />}
            >
              Calculate Shipping Cost
            </Button>

            {shippingEstimate && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Estimated Costs to {shippingEstimate.country}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Item Price</TableCell>
                        <TableCell align="right">${shippingEstimate.itemPrice}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>International Shipping</TableCell>
                        <TableCell align="right">${shippingEstimate.shippingCost}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Import Duty</TableCell>
                        <TableCell align="right">${shippingEstimate.dutyAmount}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Tax/VAT</TableCell>
                        <TableCell align="right">${shippingEstimate.taxAmount}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>GSP Processing Fee</TableCell>
                        <TableCell align="right">${shippingEstimate.gspFee}</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Total Cost</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          ${shippingEstimate.totalCost}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Flight /> Estimated Delivery: {shippingEstimate.estimatedDelivery} business days
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* How It Works Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info /> How GSP Works
            </Typography>

            <Stepper orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label} active>
                  <StepLabel>
                    <Typography sx={{ fontWeight: 600 }}>{step.label}</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>
      </Grid>

      {/* Supported Countries Table */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Public /> Supported Countries
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Country</TableCell>
                <TableCell align="center">Duty Rate</TableCell>
                <TableCell align="center">Tax/VAT Rate</TableCell>
                <TableCell align="center">Est. Delivery</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {countries.map((country) => (
                <TableRow key={country.code} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }}>{country.name}</Typography>
                  </TableCell>
                  <TableCell align="center">{country.dutyRate}%</TableCell>
                  <TableCell align="center">{country.taxRate}%</TableCell>
                  <TableCell align="center">{country.deliveryDays} days</TableCell>
                  <TableCell align="center">
                    <Chip
                      label="Available"
                      color="success"
                      size="small"
                      icon={<CheckCircle />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Benefits Section */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
            <CardContent>
              <LocalShipping sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Simple Shipping
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ship to one domestic location. We handle the rest of the international logistics.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
            <CardContent>
              <Inventory sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Customs Handled
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We prepare all customs documentation. No more paperwork headaches.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
            <CardContent>
              <AttachMoney sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Transparent Pricing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Buyers see total cost upfront. No surprise fees at delivery.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Seller Benefits */}
      <Paper sx={{ p: 4, mt: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Benefits for Sellers
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <CheckCircle />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Access Global Buyers
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Reach millions of international buyers without complexity
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <CheckCircle />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Protected Sales
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Seller protection for GSP eligible items against delivery issues
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <CheckCircle />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Ship Domestically Only
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Ship to our Kentucky hub - same as any domestic order
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <CheckCircle />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  No Returns Hassle
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Returns handled through our hub - no international return shipping
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default GSP;
