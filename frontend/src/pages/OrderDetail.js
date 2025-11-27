import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ArrowBack,
  LocalShipping,
  Receipt,
  Person,
  LocationOn,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../services/api';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusStep = (status) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Order not found</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/orders')} sx={{ mt: 2 }}>
          Back to Orders
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Order #{order.orderNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy h:mm a')}
          </Typography>
        </Box>
        <Chip
          label={order.status.toUpperCase()}
          color={getStatusColor(order.status)}
          size="medium"
        />
      </Box>

      {/* Order Status Stepper */}
      {order.status !== 'cancelled' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={getStatusStep(order.status)} alternativeLabel>
            <Step>
              <StepLabel>Order Placed</StepLabel>
            </Step>
            <Step>
              <StepLabel>Processing</StepLabel>
            </Step>
            <Step>
              <StepLabel>Shipped</StepLabel>
            </Step>
            <Step>
              <StepLabel>Delivered</StepLabel>
            </Step>
          </Stepper>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Order Items */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Receipt /> Order Items
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {order.items?.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  gap: 2,
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 0 },
                }}
              >
                <Avatar
                  variant="rounded"
                  src={item.image || 'https://via.placeholder.com/80'}
                  sx={{ width: 80, height: 80 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    component={Link}
                    to={`/product/${item.productId}`}
                    sx={{
                      color: 'text.primary',
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {item.quantity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unit Price: ${item.unitPrice?.toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  ${item.totalPrice?.toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Paper>

          {/* Tracking Info */}
          {order.trackingNumber && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping /> Shipping Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2">
                <strong>Carrier:</strong> {order.shippingCarrier || 'Standard Shipping'}
              </Typography>
              <Typography variant="body2">
                <strong>Tracking Number:</strong> {order.trackingNumber}
              </Typography>
              {order.shippedAt && (
                <Typography variant="body2">
                  <strong>Shipped:</strong> {format(new Date(order.shippedAt), 'MMM d, yyyy')}
                </Typography>
              )}
              {order.deliveredAt && (
                <Typography variant="body2">
                  <strong>Delivered:</strong> {format(new Date(order.deliveredAt), 'MMM d, yyyy')}
                </Typography>
              )}
            </Paper>
          )}
        </Grid>

        {/* Order Summary Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Payment Summary */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Order Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Subtotal</Typography>
              <Typography variant="body2">${order.subtotal?.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Shipping</Typography>
              <Typography variant="body2">
                {order.shippingCost > 0 ? `$${order.shippingCost?.toFixed(2)}` : 'Free'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Tax</Typography>
              <Typography variant="body2">${order.tax?.toFixed(2)}</Typography>
            </Box>
            {order.discount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="success.main">Discount</Typography>
                <Typography variant="body2" color="success.main">-${order.discount?.toFixed(2)}</Typography>
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                ${order.total?.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Chip
                label={`Payment: ${order.paymentStatus}`}
                size="small"
                color={order.paymentStatus === 'completed' ? 'success' : 'warning'}
                variant="outlined"
              />
            </Box>
          </Paper>

          {/* Seller Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person /> Seller
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {order.seller?.username}
            </Typography>
            {order.seller?.email && (
              <Typography variant="body2" color="text.secondary">
                {order.seller.email}
              </Typography>
            )}
          </Paper>

          {/* Buyer Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person /> Buyer
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {order.buyer?.username}
            </Typography>
            {order.buyer?.email && (
              <Typography variant="body2" color="text.secondary">
                {order.buyer.email}
              </Typography>
            )}
          </Paper>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn /> Shipping Address
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {order.shippingAddress.fullName && (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {order.shippingAddress.fullName}
                </Typography>
              )}
              <Typography variant="body2">
                {order.shippingAddress.street}
              </Typography>
              <Typography variant="body2">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </Typography>
              <Typography variant="body2">
                {order.shippingAddress.country}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrderDetail;
