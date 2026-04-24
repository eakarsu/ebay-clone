import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Divider,
  Pagination,
  Skeleton,
  IconButton,
} from '@mui/material';
import {
  LocalOffer,
  Timer,
  LocalShipping,
  Whatshot,
  ArrowBack,
} from '@mui/icons-material';
import api from '../services/api';

// Countdown timer component
const CountdownTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(endTime) - new Date();
    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft.expired) {
    return (
      <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
        Deal Expired
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Timer sx={{ fontSize: 16, color: 'error.main' }} />
      <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </Typography>
    </Box>
  );
};

// Deal card component
const DealCard = ({ deal, onClick }) => {
  const savings = deal.originalPrice - deal.dealPrice;

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        position: 'relative',
      }}
    >
      {/* Discount badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          bgcolor: '#e53238',
          color: 'white',
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          fontWeight: 700,
          fontSize: '0.9rem',
          zIndex: 1,
        }}
      >
        {deal.discountPercentage}% OFF
      </Box>

      {deal.featured && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: '#f5af02',
            color: 'white',
            px: 1,
            py: 0.3,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            zIndex: 1,
          }}
        >
          <Whatshot sx={{ fontSize: 14 }} />
          HOT
        </Box>
      )}

      <CardMedia
        component="img"
        height="200"
        image={deal.product?.primaryImage || 'https://via.placeholder.com/300x200?text=No+Image'}
        alt={deal.product?.title}
        sx={{ objectFit: 'contain', bgcolor: '#f7f7f7', p: 2 }}
      />

      <CardContent>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: 48,
          }}
        >
          {deal.product?.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#e53238' }}>
            ${deal.dealPrice?.toFixed(2)}
          </Typography>
          <Typography
            variant="body2"
            sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
          >
            ${deal.originalPrice?.toFixed(2)}
          </Typography>
        </Box>

        <Typography variant="body2" color="success.main" sx={{ fontWeight: 600, mb: 1 }}>
          You save ${savings.toFixed(2)}
        </Typography>

        {deal.product?.freeShipping && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <LocalShipping sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
              FREE Shipping
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <CountdownTimer endTime={deal.endTime} />
          <Typography variant="caption" color="text.secondary">
            {deal.quantityRemaining} left
          </Typography>
        </Box>

        {deal.quantityRemaining < 10 && (
          <Box
            sx={{
              mt: 1,
              bgcolor: '#fff3e0',
              p: 0.5,
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 600 }}>
              Almost gone! Only {deal.quantityRemaining} left
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const DailyDeals = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minDiscount, setMinDiscount] = useState(parseInt(searchParams.get('minDiscount')) || 0);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'end_time');

  useEffect(() => {
    fetchDeals();
    fetchCategories();
  }, [selectedCategory, minDiscount, sortBy, searchParams.get('page')]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (selectedCategory) params.append('category', selectedCategory);
      if (minDiscount > 0) params.append('minDiscount', minDiscount);
      params.append('sortBy', sortBy);
      params.append('page', searchParams.get('page') || 1);
      params.append('limit', 12);

      const response = await api.get(`/deals?${params.toString()}`);
      setDeals(response.data.deals || []);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      // Use mock data if API not available
      setDeals([
        {
          id: '1',
          discountPercentage: 35,
          dealPrice: 649.99,
          originalPrice: 999.99,
          endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
          quantityRemaining: 15,
          featured: true,
          product: {
            id: 'p1',
            title: 'Apple MacBook Air M2 - 256GB SSD - Space Gray',
            primaryImage: 'https://source.unsplash.com/300x200/?macbook',
            freeShipping: true,
          },
        },
        {
          id: '2',
          discountPercentage: 50,
          dealPrice: 149.99,
          originalPrice: 299.99,
          endTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          quantityRemaining: 5,
          featured: false,
          product: {
            id: 'p2',
            title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
            primaryImage: 'https://source.unsplash.com/300x200/?headphones',
            freeShipping: true,
          },
        },
        {
          id: '3',
          discountPercentage: 40,
          dealPrice: 179.99,
          originalPrice: 299.99,
          endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          quantityRemaining: 25,
          featured: true,
          product: {
            id: 'p3',
            title: 'Nintendo Switch OLED Model - White Joy-Con',
            primaryImage: 'https://source.unsplash.com/300x200/?nintendo',
            freeShipping: true,
          },
        },
        {
          id: '4',
          discountPercentage: 25,
          dealPrice: 74.99,
          originalPrice: 99.99,
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          quantityRemaining: 8,
          featured: false,
          product: {
            id: 'p4',
            title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
            primaryImage: 'https://source.unsplash.com/300x200/?cooking',
            freeShipping: false,
          },
        },
        {
          id: '5',
          discountPercentage: 60,
          dealPrice: 39.99,
          originalPrice: 99.99,
          endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          quantityRemaining: 3,
          featured: false,
          product: {
            id: 'p5',
            title: 'Premium Wireless Earbuds with Charging Case',
            primaryImage: 'https://source.unsplash.com/300x200/?earbuds',
            freeShipping: true,
          },
        },
        {
          id: '6',
          discountPercentage: 30,
          dealPrice: 349.99,
          originalPrice: 499.99,
          endTime: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
          quantityRemaining: 12,
          featured: false,
          product: {
            id: 'p6',
            title: 'Dyson V11 Cordless Vacuum Cleaner - Refurbished',
            primaryImage: 'https://source.unsplash.com/300x200/?vacuum',
            freeShipping: true,
          },
        },
      ]);
      setPagination({ page: 1, pages: 1, total: 6 });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/deals/categories');
      setCategories(response.data.categories || []);
    } catch (err) {
      setCategories([
        { id: '1', name: 'Electronics', slug: 'electronics', dealCount: 25 },
        { id: '2', name: 'Home & Garden', slug: 'home-garden', dealCount: 18 },
        { id: '3', name: 'Fashion', slug: 'fashion', dealCount: 32 },
        { id: '4', name: 'Sports', slug: 'sports', dealCount: 15 },
      ]);
    }
  };

  const handlePageChange = (event, page) => {
    searchParams.set('page', page);
    setSearchParams(searchParams);
  };

  const handleDealClick = (deal) => {
    navigate(`/product/${deal.product.id}?deal=${deal.id}`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <LocalOffer sx={{ fontSize: 40, color: '#e53238' }} />
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            Daily Deals
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Discover amazing deals updated daily. Limited time offers with huge savings!
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Filter Deals
            </Typography>

            {/* Category Filter */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.slug}>
                    {cat.name} ({cat.dealCount})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Minimum Discount Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Minimum Discount: {minDiscount}%
              </Typography>
              <Slider
                value={minDiscount}
                onChange={(e, value) => setMinDiscount(value)}
                min={0}
                max={75}
                step={5}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                ]}
                sx={{ color: '#e53238' }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Sort */}
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="end_time">Ending Soon</MenuItem>
                <MenuItem value="discount">Biggest Discount</MenuItem>
                <MenuItem value="price">Lowest Price</MenuItem>
                <MenuItem value="created_at">Newest</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 3 }}
              onClick={() => {
                setSelectedCategory('');
                setMinDiscount(0);
                setSortBy('end_time');
              }}
            >
              Clear Filters
            </Button>
          </Paper>
        </Grid>

        {/* Deals Grid */}
        <Grid item xs={12} md={9}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              {pagination.total} deals found
            </Typography>
            <Chip
              icon={<Timer />}
              label="Deals refresh at midnight"
              variant="outlined"
              size="small"
            />
          </Box>

          {loading ? (
            <Grid container spacing={3}>
              {[...Array(6)].map((_, idx) => (
                <Grid item xs={12} sm={6} lg={4} key={idx}>
                  <Card>
                    <Skeleton variant="rectangular" height={200} />
                    <CardContent>
                      <Skeleton variant="text" width="80%" height={24} />
                      <Skeleton variant="text" width="60%" height={32} />
                      <Skeleton variant="text" width="40%" height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : deals.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <LocalOffer sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No deals found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or check back later for new deals.
              </Typography>
            </Paper>
          ) : (
            <>
              <Grid container spacing={3}>
                {deals.map((deal) => (
                  <Grid item xs={12} sm={6} lg={4} key={deal.id}>
                    <DealCard deal={deal} onClick={() => handleDealClick(deal)} />
                  </Grid>
                ))}
              </Grid>

              {pagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={pagination.pages}
                    page={pagination.page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default DailyDeals;
