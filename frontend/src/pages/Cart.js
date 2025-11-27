import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  IconButton,
  TextField,
  Divider,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, loading, refreshCart } = useCart();

  useEffect(() => {
    if (user) {
      refreshCart();
    }
  }, [user, refreshCart]);

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CartIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>
          Sign in to view your cart
        </Typography>
        <Button
          component={Link}
          to="/login"
          variant="contained"
          sx={{ borderRadius: 5, bgcolor: '#3665f3' }}
        >
          Sign in
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading your cart...
        </Typography>
      </Container>
    );
  }

  if (cart.items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CartIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>
          Your cart is empty
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Start shopping and add items to your cart
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          sx={{ borderRadius: 5, bgcolor: '#3665f3' }}
        >
          Start shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
        Shopping Cart ({cart.summary.itemCount} items)
      </Typography>

      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          {cart.items.map((item) => (
            <Paper key={item.id} sx={{ p: 3, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={2}>
                  <Box
                    component={Link}
                    to={`/product/${item.product.id}`}
                    sx={{ display: 'block' }}
                  >
                    <Avatar
                      variant="rounded"
                      src={item.product.image || 'https://via.placeholder.com/100'}
                      alt={item.product.title}
                      sx={{ width: 100, height: 100 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    component={Link}
                    to={`/product/${item.product.id}`}
                    variant="subtitle1"
                    sx={{
                      color: 'text.primary',
                      textDecoration: 'none',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    {item.product.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Seller: {item.seller.username}
                  </Typography>
                  {item.product.freeShipping ? (
                    <Typography variant="body2" color="success.main">
                      Free shipping
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      +${item.product.shippingCost.toFixed(2)} shipping
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <TextField
                      value={item.quantity}
                      size="small"
                      inputProps={{ style: { textAlign: 'center', width: 40 } }}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        updateQuantity(item.id, val);
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.availableQuantity}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
                <Grid item xs={4} sm={1} sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ${item.itemTotal.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={2} sm={1} sx={{ textAlign: 'right' }}>
                  <IconButton
                    color="error"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Order Summary
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography>${cart.summary.subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Shipping</Typography>
                <Typography>
                  {cart.summary.shipping === 0 ? 'FREE' : `$${cart.summary.shipping.toFixed(2)}`}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Est. Tax</Typography>
                <Typography>${cart.summary.tax.toFixed(2)}</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ${cart.summary.total.toFixed(2)}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate('/checkout')}
              sx={{
                borderRadius: 5,
                py: 1.5,
                bgcolor: '#3665f3',
                '&:hover': { bgcolor: '#2a4dc4' },
              }}
            >
              Proceed to Checkout
            </Button>

            <Button
              fullWidth
              component={Link}
              to="/"
              sx={{ mt: 2, borderRadius: 5 }}
            >
              Continue Shopping
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;
