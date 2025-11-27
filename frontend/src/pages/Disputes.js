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
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Disputes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [orders, setOrders] = useState([]);
  const [newDispute, setNewDispute] = useState({
    orderId: '',
    disputeType: '',
    reason: '',
    desiredResolution: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const response = await api.get('/disputes');
      setDisputes(response.data.disputes);
    } catch (err) {
      setError('Failed to load disputes');
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

  const handleCreateDispute = async () => {
    try {
      await api.post('/disputes', newDispute);
      setOpenDialog(false);
      setNewDispute({
        orderId: '',
        disputeType: '',
        reason: '',
        desiredResolution: '',
      });
      fetchDisputes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create dispute');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'warning',
      pending_seller_response: 'info',
      pending_buyer_response: 'info',
      under_review: 'primary',
      resolved: 'success',
      closed: 'default',
      escalated: 'error',
    };
    return colors[status] || 'default';
  };

  const filteredDisputes = disputes.filter((d) => {
    if (tabValue === 0) return true;
    if (tabValue === 1) return !['resolved', 'closed'].includes(d.status);
    if (tabValue === 2) return ['resolved', 'closed'].includes(d.status);
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
          My Disputes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Open Dispute
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="All Disputes" />
          <Tab label="Active" />
          <Tab label="Resolved" />
        </Tabs>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDisputes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No disputes found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDisputes.map((dispute) => (
                  <TableRow
                    key={dispute.id}
                    hover
                    onClick={() => navigate(`/disputes/${dispute.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{dispute.orderNumber}</TableCell>
                    <TableCell>
                      {dispute.disputeType.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>
                      <Typography noWrap sx={{ maxWidth: 200 }}>
                        {dispute.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={dispute.status.replace(/_/g, ' ')}
                        size="small"
                        color={getStatusColor(dispute.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/disputes/${dispute.id}`);
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

      {/* Create Dispute Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Open a Dispute</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={newDispute.orderId}
              label="Order"
              onChange={(e) =>
                setNewDispute({ ...newDispute, orderId: e.target.value })
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
            <InputLabel>Dispute Type</InputLabel>
            <Select
              value={newDispute.disputeType}
              label="Dispute Type"
              onChange={(e) =>
                setNewDispute({ ...newDispute, disputeType: e.target.value })
              }
            >
              <MenuItem value="item_not_received">Item Not Received</MenuItem>
              <MenuItem value="item_not_as_described">
                Item Not As Described
              </MenuItem>
              <MenuItem value="unauthorized_purchase">
                Unauthorized Purchase
              </MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Reason"
            multiline
            rows={4}
            value={newDispute.reason}
            onChange={(e) =>
              setNewDispute({ ...newDispute, reason: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth>
            <InputLabel>Desired Resolution</InputLabel>
            <Select
              value={newDispute.desiredResolution}
              label="Desired Resolution"
              onChange={(e) =>
                setNewDispute({ ...newDispute, desiredResolution: e.target.value })
              }
            >
              <MenuItem value="full_refund">Full Refund</MenuItem>
              <MenuItem value="partial_refund">Partial Refund</MenuItem>
              <MenuItem value="replacement">Replacement</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateDispute}
            disabled={
              !newDispute.orderId ||
              !newDispute.disputeType ||
              !newDispute.reason
            }
          >
            Submit Dispute
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Disputes;
