import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  LocalShipping,
  Payment,
  CheckCircle,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addressService, orderService } from '../services/api';

const steps = ['Shipping', 'Payment', 'Review'];

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();

  const [activeStep, setActiveStep] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
  });
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderIds, setOrderIds] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    if (cart.items.length === 0 && !orderComplete) {
      navigate('/cart');
      return;
    }

    addressService.getAll().then((res) => {
      setAddresses(res.data.addresses);
      const defaultAddr = res.data.addresses.find((a) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      }
    });
  }, [user, cart.items.length, navigate, orderComplete]);

  const handleAddressChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!selectedAddress && !useNewAddress) {
        setError('Please select or add a shipping address');
        return;
      }
      if (useNewAddress) {
        const required = ['fullName', 'streetAddress', 'city', 'state', 'postalCode'];
        const missing = required.filter((f) => !newAddress[f]);
        if (missing.length > 0) {
          setError('Please fill in all required fields');
          return;
        }

        try {
          const response = await addressService.create({
            ...newAddress,
            addressType: 'shipping',
            isDefault: addresses.length === 0,
          });
          setSelectedAddress(response.data.address.id);
          setAddresses([...addresses, response.data.address]);
          setUseNewAddress(false);
        } catch (err) {
          setError(err.response?.data?.error || 'Error saving address');
          return;
        }
      }
    }

    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddressId: selectedAddress,
        billingAddressId: selectedAddress,
      };

      const response = await orderService.create(orderData);
      setOrderIds(response.data.orders.map((o) => o.orderNumber));
      setOrderComplete(true);
      setActiveStep(3);
      await refreshCart();
    } catch (err) {
      setError(err.response?.data?.error || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  const renderShipping = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalShipping /> Shipping Address
      </Typography>

      {addresses.length > 0 && (
        <RadioGroup
          value={useNewAddress ? '' : selectedAddress}
          onChange={(e) => {
            setSelectedAddress(e.target.value);
            setUseNewAddress(false);
          }}
        >
          {addresses.map((addr) => (
            <Paper
              key={addr.id}
              sx={{
                p: 2,
                mb: 2,
                border: selectedAddress === addr.id ? '2px solid' : '1px solid',
                borderColor: selectedAddress === addr.id ? 'primary.main' : 'grey.300',
              }}
            >
              <FormControlLabel
                value={addr.id}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="subtitle2">{addr.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {addr.streetAddress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {addr.city}, {addr.state} {addr.postalCode}
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          ))}
        </RadioGroup>
      )}

      <Button
        variant={useNewAddress ? 'contained' : 'outlined'}
        onClick={() => setUseNewAddress(!useNewAddress)}
        sx={{ mb: 2 }}
      >
        {useNewAddress ? 'Using new address' : 'Add new address'}
      </Button>

      {useNewAddress && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={newAddress.fullName}
              onChange={handleAddressChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              name="streetAddress"
              value={newAddress.streetAddress}
              onChange={handleAddressChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              name="city"
              value={newAddress.city}
              onChange={handleAddressChange}
              required
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              label="State"
              name="state"
              value={newAddress.state}
              onChange={handleAddressChange}
              required
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              label="ZIP Code"
              name="postalCode"
              value={newAddress.postalCode}
              onChange={handleAddressChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={newAddress.phone}
              onChange={handleAddressChange}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderPayment = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Payment /> Payment Method
      </Typography>

      <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
        <Paper sx={{ p: 2, mb: 2, border: paymentMethod === 'card' ? '2px solid' : '1px solid', borderColor: paymentMethod === 'card' ? 'primary.main' : 'grey.300' }}>
          <FormControlLabel
            value="card"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="subtitle2">Credit or Debit Card</Typography>
                <Typography variant="body2" color="text.secondary">
                  Visa, Mastercard, American Express
                </Typography>
              </Box>
            }
          />
        </Paper>
        <Paper sx={{ p: 2, mb: 2, border: paymentMethod === 'paypal' ? '2px solid' : '1px solid', borderColor: paymentMethod === 'paypal' ? 'primary.main' : 'grey.300' }}>
          <FormControlLabel
            value="paypal"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="subtitle2">PayPal</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pay with your PayPal account
                </Typography>
              </Box>
            }
          />
        </Paper>
      </RadioGroup>

      {paymentMethod === 'card' && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Demo mode: No actual payment will be processed
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Card Number" defaultValue="4242 4242 4242 4242" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Expiry" defaultValue="12/25" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="CVC" defaultValue="123" />
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );

  const renderReview = () => {
    const selectedAddr = addresses.find((a) => a.id === selectedAddress);

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Review Your Order
        </Typography>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Shipping Address
          </Typography>
          {selectedAddr && (
            <Typography variant="body2" color="text.secondary">
              {selectedAddr.fullName}<br />
              {selectedAddr.streetAddress}<br />
              {selectedAddr.city}, {selectedAddr.state} {selectedAddr.postalCode}
            </Typography>
          )}
        </Paper>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Payment Method
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {paymentMethod === 'card' ? 'Credit Card ending in 4242' : 'PayPal'}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Order Items ({cart.items.length})
          </Typography>
          {cart.items.map((item) => (
            <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                {item.product.title} x{item.quantity}
              </Typography>
              <Typography variant="body2">${item.itemTotal.toFixed(2)}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">Total</Typography>
            <Typography variant="subtitle2">${cart.summary.total.toFixed(2)}</Typography>
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderSuccess = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      <Typography variant="h4" sx={{ mb: 2 }}>
        Order Placed Successfully!
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Order number(s): {orderIds.join(', ')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        You will receive an email confirmation shortly.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/orders')}
        sx={{ borderRadius: 5, bgcolor: '#3665f3', mr: 2 }}
      >
        View Orders
      </Button>
      <Button
        variant="outlined"
        onClick={() => navigate('/')}
        sx={{ borderRadius: 5 }}
      >
        Continue Shopping
      </Button>
    </Box>
  );

  if (orderComplete) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>{renderSuccess()}</Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
        Checkout
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {activeStep === 0 && renderShipping()}
            {activeStep === 1 && renderPayment()}
            {activeStep === 2 && renderReview()}
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            {activeStep < 2 ? (
              <Button variant="contained" onClick={handleNext} sx={{ bgcolor: '#3665f3' }}>
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handlePlaceOrder}
                disabled={loading}
                sx={{ bgcolor: '#3665f3' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Place Order'}
              </Button>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Order Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Items ({cart.summary.itemCount})</Typography>
              <Typography>${cart.summary.subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Shipping</Typography>
              <Typography>{cart.summary.shipping === 0 ? 'FREE' : `$${cart.summary.shipping.toFixed(2)}`}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Est. Tax</Typography>
              <Typography>${cart.summary.tax.toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ${cart.summary.total.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Checkout;
