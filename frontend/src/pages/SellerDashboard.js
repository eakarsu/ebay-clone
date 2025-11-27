import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  ShoppingCart,
  Star,
  MoreVert,
  Visibility,
  Edit,
  LocalShipping,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const StatCard = ({ title, value, icon, color, subtitle, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick ? {
        transform: 'translateY(-2px)',
        boxShadow: 4,
      } : {},
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: `${color}.light`,
            p: 1.5,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 32 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderFilter, setOrderFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (tabValue === 1) fetchOrders(orderFilter);
    if (tabValue === 2) fetchProducts(productFilter);
  }, [tabValue, orderFilter, productFilter]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/seller/dashboard');
      setDashboard(response.data);
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (status = '') => {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get(`/seller/orders${params}`);
      setOrders(response.data.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const fetchProducts = async (filter = '') => {
    try {
      let params = '';
      if (filter === 'active') params = '?status=active';
      else if (filter === 'auction') params = '?status=active&type=auction';
      const response = await api.get(`/seller/products${params}`);
      setProducts(response.data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleStatClick = (type) => {
    // Clear all filters first
    setOrderFilter('');
    setProductFilter('');

    if (type === 'activeListings') {
      setProductFilter('active');
      setTabValue(2);
    } else if (type === 'pendingOrders') {
      setOrderFilter('pending');  // This will filter pending AND processing in backend
      setTabValue(1);
    } else if (type === 'activeAuctions') {
      setProductFilter('auction');
      setTabValue(2);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await api.put(`/seller/orders/${orderId}/status`, { status });
      fetchOrders();
      setAnchorEl(null);
    } catch (err) {
      console.error('Failed to update status:', err);
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
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Seller Dashboard
        </Typography>
        <Button variant="contained" onClick={() => navigate('/sell')}>
          List New Item
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sales"
            value={`$${dashboard?.overview?.sales?.total?.toLocaleString() || 0}`}
            icon={<TrendingUp />}
            color="success"
            subtitle={`$${dashboard?.overview?.sales?.month?.toLocaleString() || 0} this month`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Listings"
            value={dashboard?.overview?.products?.active || 0}
            icon={<Inventory />}
            color="primary"
            subtitle={`${dashboard?.overview?.products?.total || 0} total products`}
            onClick={() => handleStatClick('activeListings')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Orders"
            value={dashboard?.overview?.orders?.pending || 0}
            icon={<ShoppingCart />}
            color="warning"
            subtitle={`${dashboard?.overview?.orders?.total || 0} total orders`}
            onClick={() => handleStatClick('pendingOrders')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Auctions"
            value={dashboard?.overview?.products?.activeAuctions || 0}
            icon={<Star />}
            color="secondary"
            onClick={() => handleStatClick('activeAuctions')}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => {
          setTabValue(v);
          if (v === 0) {
            setOrderFilter('');
            setProductFilter('');
          }
        }}>
          <Tab label="Overview" />
          <Tab label={orderFilter ? `Orders (${orderFilter})` : 'Orders'} />
          <Tab label={productFilter ? `Products (${productFilter})` : 'Products'} />
        </Tabs>
        {(orderFilter || productFilter) && (
          <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Filter:</Typography>
            {orderFilter && (
              <Chip
                label={`Orders: ${orderFilter}`}
                size="small"
                onDelete={() => setOrderFilter('')}
              />
            )}
            {productFilter && (
              <Chip
                label={`Products: ${productFilter}`}
                size="small"
                onDelete={() => setProductFilter('')}
              />
            )}
            <Button size="small" onClick={() => { setOrderFilter(''); setProductFilter(''); }}>
              Clear All
            </Button>
          </Box>
        )}
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Recent Orders */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Orders
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order #</TableCell>
                      <TableCell>Buyer</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard?.recentOrders?.map((order) => (
                      <TableRow
                        key={order.id}
                        hover
                        onClick={() => navigate(`/orders/${order.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{order.orderNumber}</TableCell>
                        <TableCell>{order.buyerName}</TableCell>
                        <TableCell>${order.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            size="small"
                            color={getStatusColor(order.status)}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Top Selling Products
              </Typography>
              {dashboard?.topProducts?.map((product, index) => (
                <Box
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: index < dashboard.topProducts.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                      {product.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {product.salesCount} sold
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ${product.revenue.toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Buyer</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    hover
                    onClick={() => navigate(`/orders/${order.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.buyerName}</TableCell>
                    <TableCell>{order.buyerEmail}</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        size="small"
                        color={getStatusColor(order.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.paymentStatus}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnchorEl(e.currentTarget);
                          setSelectedOrder(order);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => navigate(`/orders/${selectedOrder?.id}`)}>
              <Visibility sx={{ mr: 1 }} /> View Details
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate(selectedOrder?.id, 'processing')}>
              Mark as Processing
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate(selectedOrder?.id, 'shipped')}>
              <LocalShipping sx={{ mr: 1 }} /> Mark as Shipped
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate(selectedOrder?.id, 'delivered')}>
              Mark as Delivered
            </MenuItem>
          </Menu>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Bids</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    hover
                    onClick={() => navigate(`/product/${product.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {product.imageUrl && (
                          <Box
                            component="img"
                            src={product.imageUrl}
                            alt={product.title}
                            sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                          />
                        )}
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {product.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      ${product.currentBid || product.price}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.status}
                        size="small"
                        color={product.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{product.listingType}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>{product.bidCount || 0}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/sell/edit/${product.id}`);
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
};

export default SellerDashboard;
