import React, { useState } from 'react';
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
  Tab,
  Tabs,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  DirectionsCar,
  TwoWheeler,
  Build,
  Search,
  CheckCircle,
  LocalOffer,
  Speed,
  History,
  VerifiedUser,
  Gavel,
} from '@mui/icons-material';

const vehicleTypes = [
  { value: 'cars', label: 'Cars & Trucks', icon: <DirectionsCar /> },
  { value: 'motorcycles', label: 'Motorcycles', icon: <TwoWheeler /> },
  { value: 'parts', label: 'Parts & Accessories', icon: <Build /> },
];

const makes = [
  'Any Make', 'Acura', 'Audi', 'BMW', 'Chevrolet', 'Dodge', 'Ford',
  'Honda', 'Hyundai', 'Jeep', 'Kia', 'Lexus', 'Mazda', 'Mercedes-Benz',
  'Nissan', 'Porsche', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen',
];

const featuredVehicles = [
  {
    id: 1,
    title: '2020 Tesla Model 3',
    price: 35000,
    image: '/placeholder.jpg',
    mileage: 25000,
    location: 'Los Angeles, CA',
    vin: '5YJ3E1EA5LF...',
    bids: 12,
    isAuction: true,
  },
  {
    id: 2,
    title: '2019 Ford Mustang GT',
    price: 42000,
    image: '/placeholder.jpg',
    mileage: 18000,
    location: 'Dallas, TX',
    vin: '1FA6P8CF1K5...',
    bids: 0,
    isAuction: false,
  },
  {
    id: 3,
    title: '2021 BMW M3 Competition',
    price: 68000,
    image: '/placeholder.jpg',
    mileage: 12000,
    location: 'Miami, FL',
    vin: 'WBS43AY03M8...',
    bids: 8,
    isAuction: true,
  },
  {
    id: 4,
    title: '2018 Porsche 911 Carrera',
    price: 89000,
    image: '/placeholder.jpg',
    mileage: 22000,
    location: 'New York, NY',
    vin: 'WP0AB2A99JS...',
    bids: 0,
    isAuction: false,
  },
];

const benefits = [
  { icon: <History />, title: 'Vehicle History', description: 'Free Carfax or AutoCheck report on most vehicles' },
  { icon: <VerifiedUser />, title: 'Buyer Protection', description: 'eBay Vehicle Purchase Protection up to $100,000' },
  { icon: <LocalOffer />, title: 'Great Deals', description: 'Below market prices on thousands of vehicles' },
  { icon: <Gavel />, title: 'Auctions', description: 'Bid on vehicles and potentially save thousands' },
];

const Motors = () => {
  const [vehicleType, setVehicleType] = useState('cars');
  const [make, setMake] = useState('Any Make');
  const [model, setModel] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: 'grey.900',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
                eBay Motors
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
                Find your next ride. Cars, trucks, motorcycles, and parts.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {benefits.slice(0, 2).map((b) => (
                  <Chip
                    key={b.title}
                    icon={b.icon}
                    label={b.title}
                    sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Tabs
                  value={vehicleType}
                  onChange={(e, v) => setVehicleType(v)}
                  sx={{ mb: 3 }}
                >
                  {vehicleTypes.map((type) => (
                    <Tab
                      key={type.value}
                      value={type.value}
                      icon={type.icon}
                      label={type.label}
                      iconPosition="start"
                    />
                  ))}
                </Tabs>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Make"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      size="small"
                    >
                      {makes.map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      size="small"
                      placeholder="Any Model"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      select
                      label="Year Min"
                      value={yearMin}
                      onChange={(e) => setYearMin(e.target.value)}
                      size="small"
                    >
                      <MenuItem value="">Any</MenuItem>
                      {years.map((y) => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      select
                      label="Year Max"
                      value={yearMax}
                      onChange={(e) => setYearMax(e.target.value)}
                      size="small"
                    >
                      <MenuItem value="">Any</MenuItem>
                      {years.map((y) => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Min Price"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      size="small"
                      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Max Price"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      size="small"
                      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<Search />}
                      component={Link}
                      to={`/search?category=motors&type=${vehicleType}&make=${make}`}
                    >
                      Search Vehicles
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Featured Vehicles */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Featured Vehicles
        </Typography>
        <Grid container spacing={3}>
          {featuredVehicles.map((vehicle) => (
            <Grid item xs={12} sm={6} md={3} key={vehicle.id}>
              <Card sx={{ height: '100%' }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={vehicle.image}
                    alt={vehicle.title}
                  />
                  {vehicle.isAuction && (
                    <Chip
                      icon={<Gavel />}
                      label={`${vehicle.bids} bids`}
                      size="small"
                      color="primary"
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  )}
                </Box>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {vehicle.title}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                    ${vehicle.price.toLocaleString()}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <Speed sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      {vehicle.mileage.toLocaleString()} miles
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vehicle.location}
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    component={Link}
                    to={`/product/${vehicle.id}`}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits */}
      <Box sx={{ bgcolor: 'grey.50', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
            Why Buy on eBay Motors?
          </Typography>
          <Grid container spacing={3}>
            {benefits.map((benefit) => (
              <Grid item xs={12} sm={6} md={3} key={benefit.title}>
                <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>{benefit.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Browse by Category */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Browse by Category
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card
              component={Link}
              to="/search?category=motors&type=cars"
              sx={{
                textDecoration: 'none',
                display: 'block',
                '&:hover': { transform: 'translateY(-4px)', transition: '0.3s' },
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <DirectionsCar sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>Cars & Trucks</Typography>
                <Typography color="text.secondary">Over 200,000 listings</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card
              component={Link}
              to="/search?category=motors&type=motorcycles"
              sx={{
                textDecoration: 'none',
                display: 'block',
                '&:hover': { transform: 'translateY(-4px)', transition: '0.3s' },
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <TwoWheeler sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>Motorcycles</Typography>
                <Typography color="text.secondary">Over 50,000 listings</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card
              component={Link}
              to="/search?category=motors&type=parts"
              sx={{
                textDecoration: 'none',
                display: 'block',
                '&:hover': { transform: 'translateY(-4px)', transition: '0.3s' },
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Build sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>Parts & Accessories</Typography>
                <Typography color="text.secondary">Over 500,000 listings</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Sell Your Vehicle */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Sell Your Vehicle
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            Reach millions of buyers. List your car, truck, or motorcycle today.
          </Typography>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/sell?category=motors"
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
          >
            List Your Vehicle
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Motors;
