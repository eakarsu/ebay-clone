import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Grid,
  Button,
  CircularProgress,
  Pagination,
} from '@mui/material';
import { format } from 'date-fns';
import { orderService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [tab, setTab] = useState(searchParams.get('type') === 'sales' ? 1 : 0);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const type = tab === 0 ? 'purchases' : 'sales';
        const response = await orderService.getAll({ type, page: pagination.page });
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [tab, pagination.page, user]);

  const handleTabChange = (e, newTab) => {
    setTab(newTab);
    setSearchParams({ type: newTab === 0 ? 'purchases' : 'sales' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
      returned: 'error',
    };
    return colors[status] || 'default';
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5">Please sign in to view your orders</Typography>
        <Button component={Link} to="/login" variant="contained" sx={{ mt: 2, borderRadius: 5, bgcolor: '#3665f3' }}>
          Sign in
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
        My Orders
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Purchases" />
          {user.isSeller && <Tab label="Sales" />}
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No orders found
          </Typography>
          {tab === 0 && (
            <Button component={Link} to="/" variant="contained" sx={{ mt: 2, borderRadius: 5, bgcolor: '#3665f3' }}>
              Start shopping
            </Button>
          )}
        </Paper>
      ) : (
        <>
          {orders.map((order) => (
            <Paper
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              sx={{ p: 3, mb: 2, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Order #{order.orderNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tab === 0 ? `Seller: ${order.otherParty}` : `Buyer: ${order.otherParty}`}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip label={order.status.toUpperCase()} color={getStatusColor(order.status)} size="small" />
                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                    ${order.total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {order.items.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Avatar
                        variant="rounded"
                        src={item.image || 'https://via.placeholder.com/60'}
                        sx={{ width: 60, height: 60 }}
                      />
                      <Box>
                        <Typography
                          component={Link}
                          to={`/product/${item.productId}`}
                          variant="body2"
                          sx={{
                            color: 'text.primary',
                            textDecoration: 'none',
                            '&:hover': { color: 'primary.main' },
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {order.trackingNumber && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2">
                    Tracking: {order.trackingNumber}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                <Button
                  component={Link}
                  to={`/orders/${order.id}`}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 5 }}
                >
                  View Details
                </Button>
                {order.status === 'delivered' && tab === 0 && (
                  <Button size="small" variant="outlined" sx={{ borderRadius: 5 }}>
                    Leave Review
                  </Button>
                )}
              </Box>
            </Paper>
          ))}

          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={(e, page) => setPagination((prev) => ({ ...prev, page }))}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Orders;
