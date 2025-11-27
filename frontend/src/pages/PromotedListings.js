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
  Slider,
  Switch,
  FormControlLabel,
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
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  Visibility,
  AttachMoney,
  Campaign,
  CheckCircle,
  Info,
  Add,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PromotedListings = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [listings, setListings] = useState([]);
  const [promotedListings, setPromotedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [promotionDialog, setPromotionDialog] = useState(false);
  const [adRate, setAdRate] = useState(5);
  const [budget, setBudget] = useState(50);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await api.get('/products/my-listings');
      const allListings = response.data.products || [];
      setListings(allListings.filter(l => !l.isPromoted));
      setPromotedListings(allListings.filter(l => l.isPromoted));
    } catch (error) {
      // Mock data for demo
      const mockListings = [
        { id: 1, title: 'Vintage Camera', price: 150, image: '/placeholder.jpg', views: 45, isPromoted: false },
        { id: 2, title: 'Antique Watch', price: 300, image: '/placeholder.jpg', views: 78, isPromoted: false },
        { id: 3, title: 'Rare Coin Collection', price: 500, image: '/placeholder.jpg', views: 120, isPromoted: true, adRate: 5, impressions: 1500, clicks: 45 },
      ];
      setListings(mockListings.filter(l => !l.isPromoted));
      setPromotedListings(mockListings.filter(l => l.isPromoted));
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = (listing) => {
    setSelectedListing(listing);
    setPromotionDialog(true);
  };

  const handleConfirmPromotion = () => {
    // Move listing to promoted
    const promoted = {
      ...selectedListing,
      isPromoted: true,
      adRate,
      budget,
      impressions: 0,
      clicks: 0,
      startDate: new Date().toISOString()
    };
    setPromotedListings([...promotedListings, promoted]);
    setListings(listings.filter(l => l.id !== selectedListing.id));
    setPromotionDialog(false);
    setSelectedListing(null);
  };

  const handleStopPromotion = (listingId) => {
    const listing = promotedListings.find(l => l.id === listingId);
    if (listing) {
      const { isPromoted, adRate, budget, impressions, clicks, startDate, ...rest } = listing;
      setListings([...listings, rest]);
      setPromotedListings(promotedListings.filter(l => l.id !== listingId));
    }
  };

  const stats = {
    totalImpressions: promotedListings.reduce((sum, l) => sum + (l.impressions || 0), 0),
    totalClicks: promotedListings.reduce((sum, l) => sum + (l.clicks || 0), 0),
    totalSpent: promotedListings.reduce((sum, l) => sum + ((l.clicks || 0) * (l.adRate || 0) / 100), 0),
    avgCTR: promotedListings.length > 0
      ? (promotedListings.reduce((sum, l) => sum + ((l.clicks || 0) / (l.impressions || 1) * 100), 0) / promotedListings.length).toFixed(2)
      : 0,
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Campaign sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to access Promoted Listings</Typography>
        <Button component={Link} to="/login" variant="contained">Sign In</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          <Campaign sx={{ mr: 1, verticalAlign: 'middle' }} />
          Promoted Listings
        </Typography>
        <Typography color="text.secondary">
          Boost your listings' visibility and increase sales
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Visibility color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.totalImpressions.toLocaleString()}</Typography>
            <Typography color="text.secondary">Total Impressions</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.totalClicks}</Typography>
            <Typography color="text.secondary">Total Clicks</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <AttachMoney color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>${stats.totalSpent.toFixed(2)}</Typography>
            <Typography color="text.secondary">Total Spent</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Info color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.avgCTR}%</Typography>
            <Typography color="text.secondary">Avg. CTR</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* How It Works */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.50' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>How Promoted Listings Work</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Chip label="1" color="primary" size="small" />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Choose your ad rate</Typography>
                <Typography variant="body2" color="text.secondary">
                  Set a percentage of your item's sale price as your ad fee
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Chip label="2" color="primary" size="small" />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Get more visibility</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your listing appears in premium search placements
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Chip label="3" color="primary" size="small" />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Pay only when you sell</Typography>
                <Typography variant="body2" color="text.secondary">
                  You're only charged when a promoted item sells
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Active Promotions (${promotedListings.length})`} />
        <Tab label={`Available to Promote (${listings.length})`} />
      </Tabs>

      {loading ? (
        <LinearProgress />
      ) : tab === 0 ? (
        /* Active Promotions */
        promotedListings.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Campaign sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>No active promotions</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Start promoting your listings to increase visibility
            </Typography>
            <Button variant="contained" onClick={() => setTab(1)}>
              Browse Listings to Promote
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Listing</TableCell>
                  <TableCell align="right">Ad Rate</TableCell>
                  <TableCell align="right">Impressions</TableCell>
                  <TableCell align="right">Clicks</TableCell>
                  <TableCell align="right">CTR</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {promotedListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          component="img"
                          src={listing.image}
                          sx={{ width: 50, height: 50, borderRadius: 1, objectFit: 'cover' }}
                        />
                        <Box>
                          <Typography variant="subtitle2">{listing.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            ${parseFloat(listing.price || 0).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={`${listing.adRate}%`} color="primary" size="small" />
                    </TableCell>
                    <TableCell align="right">{(listing.impressions || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">{listing.clicks || 0}</TableCell>
                    <TableCell align="right">
                      {((listing.clicks || 0) / (listing.impressions || 1) * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleStopPromotion(listing.id)}
                      >
                        Stop
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        /* Available Listings */
        listings.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Info sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>No listings available to promote</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Create new listings to start promoting
            </Typography>
            <Button component={Link} to="/sell" variant="contained" startIcon={<Add />}>
              Create Listing
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {listings.map((listing) => (
              <Grid item xs={12} sm={6} md={4} key={listing.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="160"
                    image={listing.image}
                    alt={listing.title}
                  />
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {listing.title}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                      ${parseFloat(listing.price || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {listing.views || 0} views
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Campaign />}
                      onClick={() => handlePromote(listing)}
                    >
                      Promote
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}

      {/* Promotion Dialog */}
      <Dialog open={promotionDialog} onClose={() => setPromotionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Up Promotion</DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Box
                  component="img"
                  src={selectedListing.image}
                  sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover' }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedListing.title}
                  </Typography>
                  <Typography color="primary">
                    ${parseFloat(selectedListing.price || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Ad Rate: {adRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You'll pay ${(parseFloat(selectedListing.price || 0) * adRate / 100).toFixed(2)} when this item sells
              </Typography>
              <Slider
                value={adRate}
                onChange={(e, v) => setAdRate(v)}
                min={1}
                max={20}
                marks={[
                  { value: 1, label: '1%' },
                  { value: 5, label: '5%' },
                  { value: 10, label: '10%' },
                  { value: 20, label: '20%' },
                ]}
                sx={{ mb: 4 }}
              />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Daily Budget (Optional)
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '$' }}
                helperText="Maximum amount to spend per day on this promotion"
              />

              <Alert severity="info" sx={{ mt: 3 }}>
                Higher ad rates typically result in better placement and more visibility.
                Average ad rate for this category: 4.5%
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromotionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmPromotion} startIcon={<CheckCircle />}>
            Start Promotion
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PromotedListings;
