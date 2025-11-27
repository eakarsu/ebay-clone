import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Paper,
  Avatar,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Chip,
  Rating,
  Skeleton,
  Divider,
  Card,
  CardMedia,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Store,
  Search,
  Notifications,
  NotificationsActive,
  Star,
  Verified,
  LocalShipping,
  Schedule,
  Category,
  ThumbUp,
  Speed,
  Shield,
  Info,
  Email,
  Phone,
  Language,
  Policy,
} from '@mui/icons-material';
import { useParams, Link } from 'react-router-dom';
import { storeService, reviewService, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SellerStore = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({ totalReviews: 0, averageRating: 0, ratingBreakdown: {} });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);


  // Mock category data with product counts
  const mockCategories = [
    { id: 1, name: 'Electronics', count: 45, icon: '📱' },
    { id: 2, name: 'Clothing', count: 128, icon: '👕' },
    { id: 3, name: 'Collectibles', count: 67, icon: '🏆' },
    { id: 4, name: 'Home & Garden', count: 34, icon: '🏠' },
    { id: 5, name: 'Toys & Games', count: 23, icon: '🎮' },
    { id: 6, name: 'Books', count: 56, icon: '📚' },
  ];

  useEffect(() => {
    if (username) {
      fetchStore();
      fetchProducts();
      fetchCategories();
    }
  }, [username]);

  const fetchStore = async () => {
    try {
      const response = await storeService.getByUsername(username);
      setStore(response.data);
      setIsSubscribed(response.data.isSubscribed);
      // Fetch feedback using the user_id from store data
      if (response.data.user_id) {
        fetchFeedback(response.data.user_id);
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (params = {}) => {
    try {
      const response = await storeService.getProducts(username, { ...params, search: searchQuery });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await storeService.getCategories(username);
      setCategories(response.data || mockCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Use mock data as fallback
      setCategories(mockCategories);
    }
  };

  const fetchFeedback = async (userId) => {
    try {
      const response = await reviewService.getForUser(userId, 'seller');
      setFeedback(response.data.reviews || []);
      setFeedbackStats(response.data.stats || { totalReviews: 0, averageRating: 0, ratingBreakdown: {} });
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const handleSubscribe = async () => {
    try {
      if (isSubscribed) {
        await storeService.unsubscribe(username);
        setIsSubscribed(false);
      } else {
        await storeService.subscribe(username);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts({ search: searchQuery, category: selectedCategory });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={60} />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!store) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Store sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
        <Typography variant="h5">Store not found</Typography>
      </Container>
    );
  }

  return (
    <Box>
      {/* Store Banner */}
      <Box
        sx={{
          height: 200,
          bgcolor: store.bannerColor || 'primary.main',
          backgroundImage: store.bannerImage ? `url(${store.bannerImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
          }}
        />
      </Box>

      <Container maxWidth="lg">
        {/* Store Info */}
        <Paper sx={{ mt: -4, mb: 4, p: 3, position: 'relative' }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Avatar
              src={store.logoUrl}
              sx={{
                width: 100,
                height: 100,
                border: 3,
                borderColor: 'white',
                mt: -5,
                bgcolor: 'primary.main',
              }}
            >
              <Store sx={{ fontSize: 48 }} />
            </Avatar>

            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {store.storeName || store.username}
                </Typography>
                {store.isVerified && <Verified color="primary" />}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating value={parseFloat(store.rating) || 4.9} readOnly precision={0.1} size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({store.totalReviews || 0} reviews)
                  </Typography>
                </Box>
                <Chip
                  icon={<Star />}
                  label={`${(parseFloat(store.rating || 0.99) * 100).toFixed(1)}% positive`}
                  size="small"
                  color="success"
                />
                <Typography variant="body2" color="text.secondary">
                  {store.totalSales?.toLocaleString() || 0} items sold
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {store.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip icon={<LocalShipping />} label="Fast shipping" size="small" />
                <Chip icon={<Schedule />} label={`Member since ${new Date(store.createdAt).getFullYear()}`} size="small" />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {user && (
                <Button
                  variant={isSubscribed ? 'outlined' : 'contained'}
                  startIcon={isSubscribed ? <NotificationsActive /> : <Notifications />}
                  onClick={handleSubscribe}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </Button>
              )}
              <Button variant="outlined">Contact Seller</Button>
            </Box>
          </Box>
        </Paper>

        {/* Search and Tabs */}
        <Box sx={{ mb: 3 }}>
          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              placeholder="Search this store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
          </form>

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="All Items" />
            <Tab label="Categories" />
            <Tab label="Feedback" />
            <Tab label="About" />
          </Tabs>
        </Box>

        {/* Tab 0: All Items */}
        {tabValue === 0 && (
          <>
            {/* Categories Filter */}
            {categories.length > 0 && (
              <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="All"
                  onClick={() => {
                    setSelectedCategory(null);
                    fetchProducts();
                  }}
                  variant={selectedCategory === null ? 'filled' : 'outlined'}
                  color={selectedCategory === null ? 'primary' : 'default'}
                />
                {categories.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={`${cat.name} (${cat.count})`}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      fetchProducts({ category: cat.id });
                    }}
                    variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
                    color={selectedCategory === cat.id ? 'primary' : 'default'}
                  />
                ))}
              </Box>
            )}

            {/* Products Grid */}
            <Grid container spacing={2}>
              {products.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      No items found in this store
                    </Typography>
                  </Box>
                </Grid>
              ) : (
                products.map((product) => (
                  <Grid item xs={6} sm={4} md={3} key={product.id}>
                    <Card
                      component={Link}
                      to={`/product/${product.id}`}
                      sx={{
                        textDecoration: 'none',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': { boxShadow: 4 },
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="160"
                        image={product.images?.[0]?.url || '/placeholder-image.png'}
                        alt={product.title}
                        sx={{ objectFit: 'contain', bgcolor: 'grey.50', p: 1 }}
                        onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            mb: 1,
                            color: 'text.primary',
                          }}
                        >
                          {product.title}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          ${parseFloat(product.buyNowPrice || product.currentPrice || 0).toFixed(2)}
                        </Typography>
                        {product.freeShipping && (
                          <Typography variant="caption" color="success.main">
                            Free shipping
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </>
        )}

        {/* Tab 1: Categories */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            {categories.map((cat) => (
              <Grid item xs={6} sm={4} md={3} key={cat.id}>
                <Card
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                    transition: 'all 0.2s',
                  }}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setTabValue(0);
                    fetchProducts({ category: cat.id });
                  }}
                >
                  <Typography variant="h2" sx={{ mb: 1 }}>
                    {cat.icon}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {cat.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cat.count} items
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 2: Feedback */}
        {tabValue === 2 && (
          <Box>
            {/* Feedback Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Seller Ratings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" color="success.main" sx={{ fontWeight: 700 }}>
                      {(parseFloat(store?.rating || 0.99) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Positive Feedback
                    </Typography>
                    <Rating value={parseFloat(store?.rating || 4.9)} readOnly precision={0.1} sx={{ mt: 1 }} />
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Box>
                    {[
                      { label: 'Item as Described', value: 4.9, icon: <Shield /> },
                      { label: 'Communication', value: 4.8, icon: <ThumbUp /> },
                      { label: 'Shipping Time', value: 4.7, icon: <Speed /> },
                      { label: 'Shipping Cost', value: 4.6, icon: <LocalShipping /> },
                    ].map((metric) => (
                      <Box key={metric.label} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {metric.icon}
                            <Typography variant="body2">{metric.label}</Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{metric.value}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(metric.value / 5) * 100}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Feedback List */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Recent Feedback ({feedbackStats.totalReviews} reviews)
              </Typography>
              {feedback.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No feedback yet
                </Typography>
              ) : (
                <List>
                  {feedback.map((fb, index) => (
                    <React.Fragment key={fb.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar src={getImageUrl(fb.reviewer?.avatarUrl)} sx={{ bgcolor: 'primary.main' }}>
                            {fb.reviewer?.username?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2">{fb.reviewer?.username}</Typography>
                              <Rating value={fb.rating} size="small" readOnly />
                              {fb.isVerifiedPurchase && (
                                <Chip label="Verified Purchase" size="small" color="success" sx={{ height: 20 }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              {fb.title && (
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {fb.title}
                                </Typography>
                              )}
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {fb.comment || 'No comment provided'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(fb.createdAt).toLocaleDateString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < feedback.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Box>
        )}

        {/* Tab 3: About */}
        {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  About {store?.storeName || store?.username}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {store?.description || 'Welcome to our store! We specialize in quality products with excellent customer service. Thank you for visiting!'}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Member Since</Typography>
                    <Typography variant="subtitle2">{new Date(store?.createdAt).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Items Sold</Typography>
                    <Typography variant="subtitle2">{store?.totalSales?.toLocaleString() || 0}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Location</Typography>
                    <Typography variant="subtitle2">{store?.location || 'United States'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Response Time</Typography>
                    <Typography variant="subtitle2">Within 24 hours</Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Store Policies
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocalShipping color="primary" />
                    <Typography variant="subtitle2">Shipping</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Items are shipped within 1-2 business days. Free shipping available on select items.
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Policy color="primary" />
                    <Typography variant="subtitle2">Returns</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    30-day return policy. Items must be returned in original condition.
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Shield color="primary" />
                    <Typography variant="subtitle2">Buyer Protection</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Full refund if item is not as described or doesn't arrive.
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Contact Seller
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button variant="outlined" startIcon={<Email />} fullWidth>
                    Send Message
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Response time: within 24 hours
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default SellerStore;
