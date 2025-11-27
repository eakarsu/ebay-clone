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
  TextField,
  MenuItem,
  Chip,
  Slider,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Favorite,
  VolunteerActivism,
  Search,
  CheckCircle,
  TrendingUp,
  People,
  Public,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const charities = [
  { id: 1, name: 'American Red Cross', category: 'Humanitarian', logo: '/placeholder.jpg', totalRaised: 2500000 },
  { id: 2, name: 'St. Jude Children\'s Hospital', category: 'Health', logo: '/placeholder.jpg', totalRaised: 1800000 },
  { id: 3, name: 'World Wildlife Fund', category: 'Environment', logo: '/placeholder.jpg', totalRaised: 1200000 },
  { id: 4, name: 'Feeding America', category: 'Humanitarian', logo: '/placeholder.jpg', totalRaised: 950000 },
  { id: 5, name: 'Habitat for Humanity', category: 'Housing', logo: '/placeholder.jpg', totalRaised: 750000 },
  { id: 6, name: 'ASPCA', category: 'Animals', logo: '/placeholder.jpg', totalRaised: 600000 },
];

const charityCategories = [
  'All Categories', 'Animals', 'Arts & Culture', 'Education', 'Environment',
  'Health', 'Housing', 'Humanitarian', 'International', 'Religion',
];

const charityListings = [
  {
    id: 1,
    title: 'Vintage Guitar - 50% to Red Cross',
    price: 500,
    image: '/placeholder.jpg',
    charity: 'American Red Cross',
    percentage: 50,
    seller: 'musiclover',
  },
  {
    id: 2,
    title: 'Signed Baseball - 100% to St. Jude',
    price: 200,
    image: '/placeholder.jpg',
    charity: 'St. Jude Children\'s Hospital',
    percentage: 100,
    seller: 'sportscollector',
  },
  {
    id: 3,
    title: 'Designer Handbag - 25% to WWF',
    price: 350,
    image: '/placeholder.jpg',
    charity: 'World Wildlife Fund',
    percentage: 25,
    seller: 'fashionista',
  },
  {
    id: 4,
    title: 'Antique Clock - 75% to Habitat',
    price: 180,
    image: '/placeholder.jpg',
    charity: 'Habitat for Humanity',
    percentage: 75,
    seller: 'antiqueshop',
  },
];

const stats = [
  { value: '$500M+', label: 'Raised for charity', icon: <TrendingUp /> },
  { value: '100K+', label: 'Nonprofits supported', icon: <VolunteerActivism /> },
  { value: '1M+', label: 'Charity listings', icon: <Favorite /> },
  { value: '190', label: 'Countries reached', icon: <Public /> },
];

const CharityListings = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedCharity, setSelectedCharity] = useState(null);
  const [donationPercentage, setDonationPercentage] = useState(10);

  const filteredCharities = charities.filter(c =>
    (category === 'All Categories' || c.category === category) &&
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: 'secondary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <VolunteerActivism sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            eBay for Charity
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
            Buy and sell to support causes you care about
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: 'secondary.main', '&:hover': { bgcolor: 'grey.100' } }}
              onClick={() => setCreateDialog(true)}
            >
              Sell for Charity
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ borderColor: 'white', color: 'white' }}
              component={Link}
              to="/search?charity=true"
            >
              Shop Charity Listings
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Stats */}
      <Container maxWidth="lg" sx={{ py: 4, mt: -4 }}>
        <Grid container spacing={2}>
          {stats.map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ color: 'secondary.main', mb: 1 }}>{stat.icon}</Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                <Typography color="text.secondary">{stat.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Charity Listings */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Featured Charity Listings
        </Typography>
        <Grid container spacing={3}>
          {charityListings.map((listing) => (
            <Grid item xs={12} sm={6} md={3} key={listing.id}>
              <Card sx={{ height: '100%' }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={listing.image}
                    alt={listing.title}
                  />
                  <Chip
                    icon={<Favorite />}
                    label={`${listing.percentage}% to charity`}
                    size="small"
                    color="secondary"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </Box>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {listing.title}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                    ${listing.price.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Benefiting: {listing.charity}
                  </Typography>
                  <Typography variant="body2" color="secondary">
                    ${(listing.price * listing.percentage / 100).toFixed(2)} goes to charity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Browse Charities */}
      <Box sx={{ bgcolor: 'grey.50', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
            Browse Charities
          </Typography>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search charities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'grey.500' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Category"
              >
                {charityCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {filteredCharities.map((charity) => (
              <Grid item xs={12} sm={6} md={4} key={charity.id}>
                <Card sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                  <Avatar
                    src={charity.logo}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {charity.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {charity.category}
                    </Typography>
                    <Typography variant="body2" color="secondary">
                      ${(charity.totalRaised / 1000000).toFixed(1)}M raised
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSelectedCharity(charity);
                      setCreateDialog(true);
                    }}
                  >
                    Sell
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
          How It Works
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, textAlign: 'center', height: '100%' }}>
              <Chip label="1" color="secondary" sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Choose Your Charity
              </Typography>
              <Typography color="text.secondary">
                Select from over 100,000 registered nonprofits or add your favorite charity.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, textAlign: 'center', height: '100%' }}>
              <Chip label="2" color="secondary" sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Set Your Donation
              </Typography>
              <Typography color="text.secondary">
                Choose to donate 10-100% of your sale price. You decide how much to give.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, textAlign: 'center', height: '100%' }}>
              <Chip label="3" color="secondary" sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Make an Impact
              </Typography>
              <Typography color="text.secondary">
                When your item sells, eBay sends the donation directly to your chosen charity.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Create Charity Listing Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create a Charity Listing</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {!user ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Please sign in to create a charity listing
                </Typography>
                <Button component={Link} to="/login" variant="contained">
                  Sign In
                </Button>
              </Box>
            ) : (
              <>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Select a Charity
                </Typography>
                <TextField
                  fullWidth
                  select
                  value={selectedCharity?.id || ''}
                  onChange={(e) => setSelectedCharity(charities.find(c => c.id === e.target.value))}
                  sx={{ mb: 3 }}
                >
                  {charities.map((charity) => (
                    <MenuItem key={charity.id} value={charity.id}>
                      {charity.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Donation Percentage: {donationPercentage}%
                </Typography>
                <Slider
                  value={donationPercentage}
                  onChange={(e, v) => setDonationPercentage(v)}
                  min={10}
                  max={100}
                  step={5}
                  marks={[
                    { value: 10, label: '10%' },
                    { value: 50, label: '50%' },
                    { value: 100, label: '100%' },
                  ]}
                  sx={{ mb: 3 }}
                />

                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <CheckCircle sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                    Your listing will display the charity badge
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <CheckCircle sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                    Buyers can search specifically for charity listings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <CheckCircle sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                    You may receive a tax deduction for your donation
                  </Typography>
                </Paper>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          {user && (
            <Button
              variant="contained"
              component={Link}
              to={`/sell?charity=${selectedCharity?.id}&percentage=${donationPercentage}`}
              disabled={!selectedCharity}
            >
              Continue to List Item
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CharityListings;
