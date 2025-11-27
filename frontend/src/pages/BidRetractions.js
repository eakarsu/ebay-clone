import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Skeleton,
  Avatar,
} from '@mui/material';
import {
  Undo,
  Warning,
  CheckCircle,
  Cancel,
  Pending,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { bidRetractionService, bidService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BidRetractions = () => {
  const { user } = useAuth();
  const [retractions, setRetractions] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestDialog, setRequestDialog] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const retractReasons = [
    { value: 'wrong_amount', label: 'Entered wrong bid amount' },
    { value: 'item_changed', label: 'Seller changed item description' },
    { value: 'cannot_contact', label: 'Cannot contact seller' },
    { value: 'typo', label: 'Typographical error in bid' },
    { value: 'other', label: 'Other reason' },
  ];

  useEffect(() => {
    if (user) {
      fetchRetractions();
      fetchMyBids();
    }
  }, [user]);

  const fetchRetractions = async () => {
    try {
      const response = await bidRetractionService.getMyRetractions();
      setRetractions(response.data || []);
    } catch (error) {
      console.error('Error fetching retractions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBids = async () => {
    try {
      const response = await bidService.getUserBids();
      // Filter to only active bids that could be retracted
      setMyBids((response.data || []).filter(b =>
        b.status === 'active' && b.product?.auctionEnd && new Date(b.product.auctionEnd) > new Date()
      ));
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const handleRequestRetraction = async () => {
    if (!selectedBid || !reason) {
      setSnackbar({ open: true, message: 'Please select a reason', severity: 'error' });
      return;
    }

    try {
      await bidRetractionService.request({
        bidId: selectedBid.id,
        reason,
        explanation,
      });
      setRequestDialog(false);
      setSelectedBid(null);
      setReason('');
      setExplanation('');
      fetchRetractions();
      fetchMyBids();
      setSnackbar({ open: true, message: 'Retraction request submitted', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to submit request', severity: 'error' });
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <Pending />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircle />, label: 'Approved' },
      denied: { color: 'error', icon: <Cancel />, label: 'Denied' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Chip size="small" label={config.label} color={config.color} icon={config.icon} />;
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Undo sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to manage bid retractions</Typography>
        <Button variant="contained" component={Link} to="/login">Sign In</Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" height={60} />
        <Skeleton variant="rectangular" height={400} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <Undo color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Bid Retractions</Typography>
      </Box>

      {/* Warning */}
      <Alert severity="warning" sx={{ mb: 4 }} icon={<Warning />}>
        <Typography variant="subtitle2">Important</Typography>
        <Typography variant="body2">
          Bid retractions should only be used in genuine cases. Excessive retractions may result in account restrictions.
          Valid reasons include: entering wrong amount, seller changed description, or unable to contact seller.
        </Typography>
      </Alert>

      {/* Active Bids */}
      {myBids.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Your Active Bids</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a bid to request retraction
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Your Bid</TableCell>
                <TableCell>Auction Ends</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myBids.map((bid) => (
                <TableRow key={bid.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        variant="rounded"
                        src={bid.product?.images?.[0]?.url}
                        sx={{ width: 40, height: 40 }}
                      />
                      <Typography variant="body2" component={Link} to={`/product/${bid.productId}`}>
                        {bid.product?.title?.slice(0, 40)}...
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      ${bid.bidAmount?.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDistanceToNow(new Date(bid.product?.auctionEnd), { addSuffix: true })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelectedBid(bid);
                        setRequestDialog(true);
                      }}
                    >
                      Request Retraction
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Retraction History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Retraction History</Typography>

        {retractions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Undo sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
            <Typography color="text.secondary">No retraction requests</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Bid Amount</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Requested</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Response</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {retractions.map((retraction) => (
                <TableRow key={retraction.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        variant="rounded"
                        src={retraction.bid?.product?.images?.[0]?.url}
                        sx={{ width: 40, height: 40 }}
                      />
                      <Typography variant="body2">
                        {retraction.bid?.product?.title?.slice(0, 30)}...
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      ${retraction.bid?.bidAmount?.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {retractReasons.find(r => r.value === retraction.reason)?.label || retraction.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(retraction.createdAt), 'MMM d, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(retraction.createdAt), { addSuffix: true })}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(retraction.status)}</TableCell>
                  <TableCell>
                    {retraction.reviewNote && (
                      <Typography variant="body2" color="text.secondary">
                        {retraction.reviewNote}
                      </Typography>
                    )}
                    {retraction.reviewedAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Reviewed {format(new Date(retraction.reviewedAt), 'MMM d')}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Request Dialog */}
      <Dialog open={requestDialog} onClose={() => setRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Bid Retraction</DialogTitle>
        <DialogContent>
          {selectedBid && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Item</Typography>
              <Typography variant="body1">{selectedBid.product?.title}</Typography>
              <Typography variant="h6" color="primary.main">
                Your Bid: ${selectedBid.bidAmount?.toFixed(2)}
              </Typography>
            </Box>
          )}

          <TextField
            select
            fullWidth
            label="Reason for Retraction"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mb: 2 }}
          >
            {retractReasons.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Please provide details about why you need to retract this bid..."
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            Your request will be reviewed. If approved, your bid will be removed and the previous
            high bidder will be reinstated.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRequestRetraction}
            disabled={!reason}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default BidRetractions;
