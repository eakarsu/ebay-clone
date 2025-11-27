import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Replay,
  Gavel,
  Person,
  Send,
  CheckCircle,
  Cancel,
  AccessTime,
  LocalOffer,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SecondChanceOffer = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [endedAuctions, setEndedAuctions] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [offerDialog, setOfferDialog] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDuration, setOfferDuration] = useState(48);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch ended auctions and offers
      const [auctionsRes, sentRes, receivedRes] = await Promise.all([
        api.get('/auctions/ended'),
        api.get('/second-chance/sent'),
        api.get('/second-chance/received'),
      ]);
      setEndedAuctions(auctionsRes.data || []);
      setSentOffers(sentRes.data || []);
      setReceivedOffers(receivedRes.data || []);
    } catch (error) {
      // Mock data for demo
      setEndedAuctions([
        {
          id: 1,
          title: 'Vintage Rolex Watch',
          image: '/placeholder.jpg',
          winningBid: 2500,
          endedAt: '2024-01-15T10:00:00Z',
          bidders: [
            { id: 1, username: 'collector99', bidAmount: 2500, isWinner: true },
            { id: 2, username: 'watchlover', bidAmount: 2400, isWinner: false },
            { id: 3, username: 'vintagefan', bidAmount: 2200, isWinner: false },
            { id: 4, username: 'timepiecepro', bidAmount: 2000, isWinner: false },
          ],
        },
        {
          id: 2,
          title: 'Antique Desk Lamp',
          image: '/placeholder.jpg',
          winningBid: 150,
          endedAt: '2024-01-14T15:00:00Z',
          bidders: [
            { id: 5, username: 'homedecor', bidAmount: 150, isWinner: true },
            { id: 6, username: 'antiqueseeker', bidAmount: 140, isWinner: false },
          ],
        },
      ]);
      setSentOffers([
        {
          id: 1,
          listing: { title: 'Vintage Camera', image: '/placeholder.jpg' },
          bidder: { username: 'photofan' },
          offerPrice: 280,
          originalBid: 260,
          status: 'pending',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
      setReceivedOffers([
        {
          id: 2,
          listing: { title: 'Rare Vinyl Record', image: '/placeholder.jpg' },
          seller: { username: 'musicstore' },
          offerPrice: 95,
          originalBid: 90,
          status: 'pending',
          expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOffer = () => {
    if (!selectedBidder || !offerPrice) return;

    const newOffer = {
      id: Date.now(),
      listing: { title: selectedAuction.title, image: selectedAuction.image },
      bidder: { username: selectedBidder.username },
      offerPrice: parseFloat(offerPrice),
      originalBid: selectedBidder.bidAmount,
      status: 'pending',
      expiresAt: new Date(Date.now() + offerDuration * 60 * 60 * 1000).toISOString(),
    };

    setSentOffers([...sentOffers, newOffer]);
    setOfferDialog(false);
    setSelectedAuction(null);
    setSelectedBidder(null);
    setOfferPrice('');
  };

  const handleAcceptOffer = (offerId) => {
    setReceivedOffers(receivedOffers.map(o =>
      o.id === offerId ? { ...o, status: 'accepted' } : o
    ));
  };

  const handleDeclineOffer = (offerId) => {
    setReceivedOffers(receivedOffers.map(o =>
      o.id === offerId ? { ...o, status: 'declined' } : o
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'declined': return 'error';
      case 'expired': return 'default';
      default: return 'default';
    }
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Replay sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to access Second Chance Offers</Typography>
        <Button component={Link} to="/login" variant="contained">Sign In</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          <Replay sx={{ mr: 1, verticalAlign: 'middle' }} />
          Second Chance Offers
        </Typography>
        <Typography color="text.secondary">
          Send offers to losing bidders or view offers you've received
        </Typography>
      </Box>

      {/* Info Banner */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>What is a Second Chance Offer?</Typography>
        <Typography variant="body2">
          When an auction ends, you can send offers to non-winning bidders at their bid price or higher.
          This is useful when the winning bidder doesn't complete the purchase or when you have multiple identical items.
        </Typography>
      </Alert>

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Ended Auctions (${endedAuctions.length})`} />
        <Tab label={`Sent Offers (${sentOffers.length})`} />
        <Tab label={`Received Offers (${receivedOffers.length})`} />
      </Tabs>

      {loading ? (
        <LinearProgress />
      ) : tab === 0 ? (
        /* Ended Auctions */
        endedAuctions.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Gavel sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>No ended auctions</Typography>
            <Typography color="text.secondary">
              Your ended auctions will appear here
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {endedAuctions.map((auction) => (
              <Grid item xs={12} key={auction.id}>
                <Card>
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box
                            component="img"
                            src={auction.image}
                            sx={{ width: 100, height: 100, borderRadius: 1, objectFit: 'cover' }}
                          />
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>{auction.title}</Typography>
                            <Typography color="success.main" sx={{ fontWeight: 600 }}>
                              Winning bid: ${auction.winningBid.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Ended: {new Date(auction.endedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Non-winning Bidders ({auction.bidders.filter(b => !b.isWinner).length})
                        </Typography>
                        <List dense>
                          {auction.bidders
                            .filter(b => !b.isWinner)
                            .slice(0, 3)
                            .map((bidder) => (
                              <ListItem
                                key={bidder.id}
                                secondaryAction={
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Send />}
                                    onClick={() => {
                                      setSelectedAuction(auction);
                                      setSelectedBidder(bidder);
                                      setOfferPrice(bidder.bidAmount.toString());
                                      setOfferDialog(true);
                                    }}
                                  >
                                    Send Offer
                                  </Button>
                                }
                              >
                                <ListItemAvatar>
                                  <Avatar><Person /></Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={bidder.username}
                                  secondary={`Bid: $${bidder.bidAmount.toFixed(2)}`}
                                />
                              </ListItem>
                            ))}
                        </List>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      ) : tab === 1 ? (
        /* Sent Offers */
        sentOffers.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Send sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>No offers sent</Typography>
            <Typography color="text.secondary">
              Send second chance offers to non-winning bidders
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Listing</TableCell>
                  <TableCell>Bidder</TableCell>
                  <TableCell align="right">Original Bid</TableCell>
                  <TableCell align="right">Offer Price</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Expires In</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sentOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          component="img"
                          src={offer.listing.image}
                          sx={{ width: 50, height: 50, borderRadius: 1, objectFit: 'cover' }}
                        />
                        <Typography variant="subtitle2">{offer.listing.title}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{offer.bidder.username}</TableCell>
                    <TableCell align="right">${offer.originalBid.toFixed(2)}</TableCell>
                    <TableCell align="right">${offer.offerPrice.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={offer.status}
                        color={getStatusColor(offer.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <AccessTime fontSize="small" />
                        {getTimeRemaining(offer.expiresAt)}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        /* Received Offers */
        receivedOffers.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <LocalOffer sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>No offers received</Typography>
            <Typography color="text.secondary">
              Second chance offers from sellers will appear here
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {receivedOffers.map((offer) => (
              <Grid item xs={12} md={6} key={offer.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box
                        component="img"
                        src={offer.listing.image}
                        sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover' }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{offer.listing.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          From: {offer.seller.username}
                        </Typography>
                      </Box>
                      <Chip
                        label={offer.status}
                        color={getStatusColor(offer.status)}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Your Bid</Typography>
                        <Typography variant="h6">${offer.originalBid.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Offer Price</Typography>
                        <Typography variant="h6" color="primary">${offer.offerPrice.toFixed(2)}</Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Expires in: {getTimeRemaining(offer.expiresAt)}
                      </Typography>
                    </Box>

                    {offer.status === 'pending' && (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleAcceptOffer(offer.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => handleDeclineOffer(offer.id)}
                        >
                          Decline
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}

      {/* Send Offer Dialog */}
      <Dialog open={offerDialog} onClose={() => setOfferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Second Chance Offer</DialogTitle>
        <DialogContent>
          {selectedAuction && selectedBidder && (
            <Box sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Box
                  component="img"
                  src={selectedAuction.image}
                  sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover' }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedAuction.title}
                  </Typography>
                  <Typography color="text.secondary">
                    Winning bid: ${selectedAuction.winningBid.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar><Person /></Avatar>
                  <Box>
                    <Typography variant="subtitle2">{selectedBidder.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Their bid: ${selectedBidder.bidAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <TextField
                fullWidth
                label="Offer Price"
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                InputProps={{ startAdornment: '$' }}
                helperText={`Minimum: $${selectedBidder.bidAmount.toFixed(2)} (their bid amount)`}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                select
                label="Offer Duration"
                value={offerDuration}
                onChange={(e) => setOfferDuration(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={72}>72 hours</option>
                <option value={120}>5 days</option>
                <option value={168}>7 days</option>
              </TextField>

              <Alert severity="info" sx={{ mt: 3 }}>
                The buyer will have {offerDuration} hours to accept this offer.
                Standard eBay fees apply when the sale is completed.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOfferDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendOffer}
            disabled={!offerPrice || parseFloat(offerPrice) < (selectedBidder?.bidAmount || 0)}
            startIcon={<Send />}
          >
            Send Offer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SecondChanceOffer;
