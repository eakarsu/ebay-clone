import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import api from '../services/api';

const Returns = () => {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [viewType, setViewType] = useState('buyer');
  const [openDialog, setOpenDialog] = useState(false);
  const [orders, setOrders] = useState([]);
  const [newReturn, setNewReturn] = useState({
    orderId: '',
    returnReason: '',
    returnDetails: '',
  });
  const [error, setError] = useState('');
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  useEffect(() => {
    fetchReturns();
  }, [viewType]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/returns?type=${viewType}`);
      setReturns(response.data.returns);
    } catch (err) {
      setError('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleOpenDialog = () => {
    fetchOrders();
    setOpenDialog(true);
  };

  const handleCreateReturn = async () => {
    try {
      await api.post('/returns', newReturn);
      setOpenDialog(false);
      setNewReturn({
        orderId: '',
        returnReason: '',
        returnDetails: '',
      });
      fetchReturns();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create return request');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/returns/${id}/approve`, {
        refundType: 'full',
        refundAmount: selectedReturn?.total,
      });
      setDetailDialog(false);
      fetchReturns();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve return');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/returns/${id}/reject`, {
        sellerNotes: 'Return request rejected',
      });
      setDetailDialog(false);
      fetchReturns();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject return');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      requested: 'warning',
      approved: 'info',
      rejected: 'error',
      shipped: 'primary',
      received: 'info',
      refunded: 'success',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const filteredReturns = returns.filter((r) => {
    if (tabValue === 0) return true;
    if (tabValue === 1) return r.status === 'requested';
    if (tabValue === 2) return ['approved', 'shipped', 'received'].includes(r.status);
    if (tabValue === 3) return ['refunded', 'rejected', 'closed'].includes(r.status);
    return true;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Returns
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>View As</InputLabel>
            <Select
              value={viewType}
              label="View As"
              onChange={(e) => setViewType(e.target.value)}
            >
              <MenuItem value="buyer">Buyer</MenuItem>
              <MenuItem value="seller">Seller</MenuItem>
            </Select>
          </FormControl>
          {viewType === 'buyer' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenDialog}
            >
              Request Return
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No returns found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((returnItem) => (
                  <TableRow
                    key={returnItem.id}
                    hover
                    onClick={() => {
                      setSelectedReturn(returnItem);
                      setDetailDialog(true);
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{returnItem.orderNumber}</TableCell>
                    <TableCell>
                      {returnItem.returnReason.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={returnItem.status}
                        size="small"
                        color={getStatusColor(returnItem.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(returnItem.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReturn(returnItem);
                          setDetailDialog(true);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Return Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request a Return</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={newReturn.orderId}
              label="Order"
              onChange={(e) =>
                setNewReturn({ ...newReturn, orderId: e.target.value })
              }
            >
              {orders.map((order) => (
                <MenuItem key={order.id} value={order.id}>
                  {order.orderNumber} - ${order.total}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Return Reason</InputLabel>
            <Select
              value={newReturn.returnReason}
              label="Return Reason"
              onChange={(e) =>
                setNewReturn({ ...newReturn, returnReason: e.target.value })
              }
            >
              <MenuItem value="changed_mind">Changed My Mind</MenuItem>
              <MenuItem value="defective">Item is Defective</MenuItem>
              <MenuItem value="not_as_described">Not As Described</MenuItem>
              <MenuItem value="wrong_item">Wrong Item Received</MenuItem>
              <MenuItem value="arrived_late">Arrived Too Late</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Additional Details"
            multiline
            rows={4}
            value={newReturn.returnDetails}
            onChange={(e) =>
              setNewReturn({ ...newReturn, returnDetails: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateReturn}
            disabled={!newReturn.orderId || !newReturn.returnReason}
          >
            Submit Return Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Return Details</DialogTitle>
        <DialogContent>
          {selectedReturn && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Order:</strong> {selectedReturn.orderNumber}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Reason:</strong>{' '}
                {selectedReturn.returnReason?.replace(/_/g, ' ')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Status:</strong>{' '}
                <Chip
                  label={selectedReturn.status}
                  size="small"
                  color={getStatusColor(selectedReturn.status)}
                />
              </Typography>
              {selectedReturn.returnDetails && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Details:</strong> {selectedReturn.returnDetails}
                </Typography>
              )}
              {selectedReturn.trackingNumber && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Tracking:</strong> {selectedReturn.trackingNumber}
                </Typography>
              )}
              {selectedReturn.sellerNotes && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Seller Notes:</strong> {selectedReturn.sellerNotes}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          {viewType === 'seller' && selectedReturn?.status === 'requested' && (
            <>
              <Button color="error" onClick={() => handleReject(selectedReturn.id)}>
                Reject
              </Button>
              <Button
                variant="contained"
                onClick={() => handleApprove(selectedReturn.id)}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Returns;
