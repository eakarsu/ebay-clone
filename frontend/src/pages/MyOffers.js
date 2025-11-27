import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  LocalOffer,
  Check,
  Close,
  Refresh,
  Chat,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { offerService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyOffers = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [sentOffers, setSentOffers] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondDialog, setRespondDialog] = useState(false);
  const [counterDialog, setCounterDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

  const fetchOffers = async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        offerService.getSentOffers(),
        offerService.getMyOffers(),
      ]);
      setSentOffers(sentRes.data || []);
      setReceivedOffers(receivedRes.data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (action) => {
    if (!selectedOffer) return;
    try {
      await offerService.respond(selectedOffer.id, { status: action });
      setRespondDialog(false);
      fetchOffers();
      setSnackbar({
        open: true,
        message: `Offer ${action}!`,
        severity: action === 'accepted' ? 'success' : 'info',
      });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to respond to offer', severity: 'error' });
    }
  };

  const handleCounter = async () => {
    if (!selectedOffer || !counterAmount) return;
    try {
      await offerService.counter(selectedOffer.id, { counterAmount: parseFloat(counterAmount) });
      setCounterDialog(false);
      setCounterAmount('');
      fetchOffers();
      setSnackbar({ open: true, message: 'Counter offer sent!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to send counter offer', severity: 'error' });
    }
  };

  const handleWithdraw = async (offerId) => {
    try {
      await offerService.withdraw(offerId);
      fetchOffers();
      setSnackbar({ open: true, message: 'Offer withdrawn', severity: 'info' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to withdraw offer', severity: 'error' });
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending' },
      accepted: { color: 'success', label: 'Accepted' },
      declined: { color: 'error', label: 'Declined' },
      countered: { color: 'info', label: 'Countered' },
      withdrawn: { color: 'default', label: 'Withdrawn' },
      expired: { color: 'default', label: 'Expired' },
    };
    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip size="small" label={config.label} color={config.color} />;
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <LocalOffer sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to view your offers</Typography>
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

  const currentOffers = tabValue === 0 ? sentOffers : receivedOffers;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <LocalOffer color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>My Offers</Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Offers Sent (${sentOffers.length})`} />
          <Tab label={`Offers Received (${receivedOffers.length})`} />
        </Tabs>

        {currentOffers.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <LocalOffer sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {tabValue === 0 ? 'No offers sent yet' : 'No offers received yet'}
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>{tabValue === 0 ? 'Seller' : 'Buyer'}</TableCell>
                <TableCell align="right">Your Offer</TableCell>
                <TableCell align="right">Item Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentOffers.map((offer) => (
                <TableRow key={offer.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        variant="rounded"
                        src={offer.product?.images?.[0]?.url}
                        sx={{ width: 48, height: 48 }}
                      />
                      <Box>
                        <Typography
                          variant="body2"
                          component={Link}
                          to={`/product/${offer.productId}`}
                          sx={{
                            color: 'text.primary',
                            textDecoration: 'none',
                            '&:hover': { color: 'primary.main' },
                            fontWeight: 500,
                          }}
                        >
                          {offer.product?.title?.slice(0, 40)}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {tabValue === 0 ? offer.seller?.username : offer.buyer?.username}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      ${parseFloat(offer.offerAmount || 0).toFixed(2)}
                    </Typography>
                    {offer.counterAmount && (
                      <Typography variant="caption" color="info.main" sx={{ display: 'block' }}>
                        Counter: ${parseFloat(offer.counterAmount || 0).toFixed(2)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      ${parseFloat(offer.product?.buyNowPrice || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(offer.status)}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {tabValue === 0 && offer.status === 'pending' && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleWithdraw(offer.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                    {tabValue === 0 && offer.status === 'countered' && (
                      <>
                        <Button
                          size="small"
                          color="success"
                          onClick={() => {
                            setSelectedOffer(offer);
                            handleRespond('accepted');
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleWithdraw(offer.id)}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {tabValue === 1 && offer.status === 'pending' && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => {
                            setSelectedOffer(offer);
                            setRespondDialog(true);
                          }}
                        >
                          <Check />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedOffer(offer);
                            handleRespond('declined');
                          }}
                        >
                          <Close />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => {
                            setSelectedOffer(offer);
                            setCounterAmount(offer.offerAmount?.toString());
                            setCounterDialog(true);
                          }}
                        >
                          <Refresh />
                        </IconButton>
                      </>
                    )}
                    {offer.status === 'accepted' && (
                      <Button
                        size="small"
                        variant="contained"
                        component={Link}
                        to={`/checkout?offer=${offer.id}`}
                      >
                        Pay Now
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Respond Dialog */}
      <Dialog open={respondDialog} onClose={() => setRespondDialog(false)}>
        <DialogTitle>Respond to Offer</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Accept this offer of <strong>${parseFloat(selectedOffer?.offerAmount || 0).toFixed(2)}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRespondDialog(false)}>Cancel</Button>
          <Button color="error" onClick={() => handleRespond('declined')}>Decline</Button>
          <Button variant="contained" onClick={() => handleRespond('accepted')}>Accept</Button>
        </DialogActions>
      </Dialog>

      {/* Counter Dialog */}
      <Dialog open={counterDialog} onClose={() => setCounterDialog(false)}>
        <DialogTitle>Make Counter Offer</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Original offer: ${parseFloat(selectedOffer?.offerAmount || 0).toFixed(2)}
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Your counter offer"
            value={counterAmount}
            onChange={(e) => setCounterAmount(e.target.value)}
            InputProps={{ startAdornment: '$' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCounterDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCounter}>Send Counter</Button>
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

export default MyOffers;
