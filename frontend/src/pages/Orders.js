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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Alert,
  Snackbar,
} from '@mui/material';
import { format } from 'date-fns';
import { orderService, reviewService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [tab, setTab] = useState(searchParams.get('type') === 'sales' ? 1 : 0);

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

  const handleOpenReviewDialog = (order) => {
    setSelectedOrder(order);
    setReviewData({ rating: 5, comment: '' });
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setSelectedOrder(null);
    setReviewData({ rating: 5, comment: '' });
  };

  const handleSubmitReview = async () => {
    if (!selectedOrder) return;

    setSubmittingReview(true);
    try {
      await reviewService.create({
        orderId: selectedOrder.id,
        reviewedUserId: selectedOrder.otherPartyId,
        reviewType: tab === 0 ? 'seller' : 'buyer',
        rating: reviewData.rating,
        comment: reviewData.comment,
      });

      setSnackbar({
        open: true,
        message: 'Feedback submitted successfully!',
        severity: 'success',
      });
      handleCloseReviewDialog();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to submit feedback',
        severity: 'error',
      });
    } finally {
      setSubmittingReview(false);
    }
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
                <Button
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 5 }}
                    onClick={() => handleOpenReviewDialog(order)}
                  >
                    Leave Feedback
                  </Button>
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

      {/* Feedback Dialog */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Leave Feedback for {selectedOrder?.otherParty}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              How would you rate your experience with this {tab === 0 ? 'seller' : 'buyer'}?
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Rating
                value={reviewData.rating}
                onChange={(e, newValue) => setReviewData({ ...reviewData, rating: newValue })}
                size="large"
              />
              <Typography variant="body2" color="text.secondary">
                {reviewData.rating === 5 && 'Excellent!'}
                {reviewData.rating === 4 && 'Good'}
                {reviewData.rating === 3 && 'Average'}
                {reviewData.rating === 2 && 'Below Average'}
                {reviewData.rating === 1 && 'Poor'}
              </Typography>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your feedback (optional)"
              placeholder={`Share your experience with this ${tab === 0 ? 'seller' : 'buyer'}...`}
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseReviewDialog} disabled={submittingReview}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitReview}
            disabled={submittingReview || !reviewData.rating}
            sx={{ borderRadius: 5, bgcolor: '#3665f3' }}
          >
            {submittingReview ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Orders;
