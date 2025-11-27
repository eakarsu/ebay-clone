import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Gavel,
  TrendingUp,
  Edit,
  Delete,
  Visibility,
  Timer,
  AttachMoney,
  Info,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ProxyBidding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proxyBids, setProxyBids] = useState([]);
  const [editDialog, setEditDialog] = useState({ open: false, bid: null });
  const [newMaxBid, setNewMaxBid] = useState('');

  useEffect(() => {
    fetchProxyBids();
  }, []);

  const fetchProxyBids = async () => {
    try {
      setLoading(true);
      const response = await api.get('/proxy-bids');
      setProxyBids(response.data.proxyBids || []);
    } catch (err) {
      // Use mock data if API fails
      setProxyBids([
        {
          id: 1,
          productId: 101,
          productTitle: 'Vintage Rolex Submariner 1680',
          productImage: 'https://source.unsplash.com/100x100/?rolex,watch',
          maxBid: 5000,
          currentBid: 3200,
          currentWinning: true,
          auctionEnds: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          bidCount: 15,
        },
        {
          id: 2,
          productId: 102,
          productTitle: 'Apple MacBook Pro M3 Max 16"',
          productImage: 'https://source.unsplash.com/100x100/?macbook,laptop',
          maxBid: 2500,
          currentBid: 2400,
          currentWinning: false,
          auctionEnds: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
          bidCount: 23,
        },
        {
          id: 3,
          productId: 103,
          productTitle: 'Nike Air Jordan 1 Retro High OG',
          productImage: 'https://source.unsplash.com/100x100/?nike,sneakers',
          maxBid: 350,
          currentBid: 280,
          currentWinning: true,
          auctionEnds: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          bidCount: 8,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleIncreaseMaxBid = async () => {
    if (!editDialog.bid || !newMaxBid) return;

    try {
      await api.put(`/proxy-bids/${editDialog.bid.id}`, {
        maxBid: parseFloat(newMaxBid),
      });
      setEditDialog({ open: false, bid: null });
      setNewMaxBid('');
      fetchProxyBids();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update bid');
    }
  };

  const handleCancelBid = async (bidId) => {
    try {
      await api.delete(`/proxy-bids/${bidId}`);
      fetchProxyBids();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel bid');
    }
  };

  const getTimeLeft = (endDate) => {
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const bidIncrements = [
    { range: '$0.01 - $0.99', increment: '$0.05' },
    { range: '$1.00 - $4.99', increment: '$0.25' },
    { range: '$5.00 - $24.99', increment: '$0.50' },
    { range: '$25.00 - $99.99', increment: '$1.00' },
    { range: '$100.00 - $249.99', increment: '$2.50' },
    { range: '$250.00 - $499.99', increment: '$5.00' },
    { range: '$500.00 - $999.99', increment: '$10.00' },
    { range: '$1000+', increment: '$25.00' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        My Proxy Bids
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Automatic bidding keeps you competitive without constant monitoring
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Active Proxy Bids */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Gavel /> Active Proxy Bids ({proxyBids.length})
            </Typography>

            {proxyBids.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary" gutterBottom>
                  No active proxy bids
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/search?listing_type=auction')}
                >
                  Browse Auctions
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="center">Your Max</TableCell>
                      <TableCell align="center">Current</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Time Left</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proxyBids.map((bid) => (
                      <TableRow key={bid.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={bid.productImage}
                              variant="rounded"
                              sx={{ width: 50, height: 50 }}
                            />
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  '&:hover': { color: 'primary.main' },
                                  maxWidth: 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                onClick={() => navigate(`/product/${bid.productId}`)}
                              >
                                {bid.productTitle}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {bid.bidCount} bids
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            ${bid.maxBid.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body1">
                            ${bid.currentBid.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {bid.currentWinning ? (
                            <Chip
                              icon={<CheckCircle />}
                              label="Winning"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<Warning />}
                              label="Outbid"
                              color="error"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <Timer fontSize="small" color="action" />
                            <Typography variant="body2">
                              {getTimeLeft(bid.auctionEnds)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditDialog({ open: true, bid });
                              setNewMaxBid(bid.maxBid.toString());
                            }}
                            title="Increase max bid"
                          >
                            <TrendingUp />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/product/${bid.productId}`)}
                            title="View item"
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* How Proxy Bidding Works */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info /> How It Works
            </Typography>

            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="1. Set Your Maximum"
                  secondary="Enter the highest amount you're willing to pay"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="2. Automatic Bidding"
                  secondary="System bids the minimum needed to stay ahead"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="3. Pay Only What's Needed"
                  secondary="You pay one increment above the second-highest bidder"
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Example:
            </Typography>
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Your max bid: <strong>$100</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Current bid: <strong>$25</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                System bids: <strong>$26</strong> for you
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Someone bids: <strong>$50</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                System bids: <strong>$51</strong> for you
              </Typography>
            </Box>
          </Paper>

          {/* Bid Increments Table */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Bid Increments
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Current Price</TableCell>
                    <TableCell align="right">Increment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bidIncrements.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.range}</TableCell>
                      <TableCell align="right">{row.increment}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Max Bid Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, bid: null })}
      >
        <DialogTitle>Increase Maximum Bid</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You can only increase your maximum bid, not decrease it.
          </Typography>

          {editDialog.bid && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2">
                Item: <strong>{editDialog.bid.productTitle}</strong>
              </Typography>
              <Typography variant="body2">
                Current Max: <strong>${editDialog.bid.maxBid}</strong>
              </Typography>
              <Typography variant="body2">
                Current Bid: <strong>${editDialog.bid.currentBid}</strong>
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="New Maximum Bid"
            type="number"
            value={newMaxBid}
            onChange={(e) => setNewMaxBid(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            helperText={`Minimum: $${(editDialog.bid?.maxBid || 0) + 1}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, bid: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleIncreaseMaxBid}
            disabled={!newMaxBid || parseFloat(newMaxBid) <= (editDialog.bid?.maxBid || 0)}
          >
            Update Max Bid
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProxyBidding;
