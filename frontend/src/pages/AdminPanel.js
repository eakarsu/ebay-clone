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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  People,
  Inventory,
  ShoppingCart,
  AttachMoney,
  Gavel,
  Block,
  CheckCircle,
  Delete,
  Edit,
  Visibility,
} from '@mui/icons-material';
import api from '../services/api';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card>
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
          }}
        >
          {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 32 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialog, setUserDialog] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (tabValue === 1) fetchUsers();
    if (tabValue === 2) fetchProducts();
    if (tabValue === 3) fetchOrders();
    if (tabValue === 4) fetchDisputes();
  }, [tabValue]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setDashboard(response.data);
    } catch (err) {
      setError('Failed to load admin dashboard. Make sure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/admin/products');
      setProducts(response.data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/admin/orders');
      setOrders(response.data.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const fetchDisputes = async () => {
    try {
      const response = await api.get('/admin/disputes');
      setDisputes(response.data.disputes);
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
    }
  };

  const handleUpdateUser = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.id}`, {
        status: selectedUser.status,
        isAdmin: selectedUser.isAdmin,
      });
      fetchUsers();
      setUserDialog(false);
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleUpdateProductStatus = async (productId, status) => {
    try {
      await api.put(`/admin/products/${productId}/status`, { status });
      fetchProducts();
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      suspended: 'error',
      pending: 'warning',
      open: 'warning',
      resolved: 'success',
      closed: 'default',
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
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Admin Panel
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Users"
            value={dashboard?.users?.total || 0}
            icon={<People />}
            color="primary"
            subtitle={`${dashboard?.users?.newThisWeek || 0} new this week`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Active Products"
            value={dashboard?.products?.active || 0}
            icon={<Inventory />}
            color="success"
            subtitle={`${dashboard?.products?.newToday || 0} new today`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Orders"
            value={dashboard?.orders?.total || 0}
            icon={<ShoppingCart />}
            color="info"
            subtitle={`${dashboard?.orders?.pending || 0} pending`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Revenue (Month)"
            value={`$${dashboard?.revenue?.month?.toLocaleString() || 0}`}
            icon={<AttachMoney />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Open Disputes"
            value={dashboard?.openDisputes || 0}
            icon={<Gavel />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="Users" />
          <Tab label="Products" />
          <Tab label="Orders" />
          <Tab label="Disputes" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Activity
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard?.recentActivity?.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip
                            label={activity.type.replace('_', ' ')}
                            size="small"
                            color={
                              activity.type === 'new_user'
                                ? 'primary'
                                : activity.type === 'new_order'
                                ? 'success'
                                : 'info'
                            }
                          />
                        </TableCell>
                        <TableCell>{activity.title}</TableCell>
                        <TableCell>
                          {new Date(activity.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Products</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.isAdmin ? 'Admin' : 'User'}
                        size="small"
                        color={user.isAdmin ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status || 'active'}
                        size="small"
                        color={getStatusColor(user.status || 'active')}
                      />
                    </TableCell>
                    <TableCell>{user.productCount}</TableCell>
                    <TableCell>{user.orderCount}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserDialog(true);
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

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Seller</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {product.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{product.sellerName}</TableCell>
                    <TableCell>${product.price}</TableCell>
                    <TableCell>{product.categoryName}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.status}
                        size="small"
                        color={getStatusColor(product.status)}
                      />
                    </TableCell>
                    <TableCell>{product.listingType}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleUpdateProductStatus(product.id, 'active')}
                      >
                        <CheckCircle />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleUpdateProductStatus(product.id, 'suspended')}
                      >
                        <Block />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 3 && (
        <Paper sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Buyer</TableCell>
                  <TableCell>Seller</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.buyerName}</TableCell>
                    <TableCell>{order.sellerName}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 4 && (
        <Paper sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Opened By</TableCell>
                  <TableCell>Against</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id} hover>
                    <TableCell>{dispute.orderNumber}</TableCell>
                    <TableCell>{dispute.disputeType.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{dispute.openerName}</TableCell>
                    <TableCell>{dispute.againstName}</TableCell>
                    <TableCell>
                      <Chip
                        label={dispute.status}
                        size="small"
                        color={getStatusColor(dispute.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* User Edit Dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 300 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            User: {selectedUser?.username} ({selectedUser?.email})
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedUser?.status || 'active'}
              label="Status"
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, status: e.target.value })
              }
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedUser?.isAdmin ? 'admin' : 'user'}
              label="Role"
              onChange={(e) =>
                setSelectedUser({
                  ...selectedUser,
                  isAdmin: e.target.value === 'admin',
                })
              }
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateUser}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel;
