import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  TextField,
  Paper,
  Avatar,
  Rating,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Snackbar,
  Alert,
  Skeleton,
  Breadcrumbs,
} from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  Share,
  LocalShipping,
  VerifiedUser,
  Timer,
  ShoppingCart,
  Gavel,
  NavigateNext,
  CheckCircle,
  TrendingUp,
  Visibility,
  Store,
  Star,
  Autorenew,
  LocationOn,
  Inventory2,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { productService, bidService, watchlistService, recentlyViewedService, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Feature Components
import MakeOffer from '../components/Features/MakeOffer';
import ProductQA from '../components/Features/ProductQA';
import SimilarItems from '../components/Features/SimilarItems';
import PriceAlert from '../components/Features/PriceAlert';
import SocialShare from '../components/Features/SocialShare';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWatching, setIsWatching] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // New feature states
  const [offerDialog, setOfferDialog] = useState(false);
  const [priceAlertDialog, setPriceAlertDialog] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getById(id);
        setProduct(response.data);
        setIsWatching(response.data.isWatching);

        // Track recently viewed
        if (user) {
          try {
            await recentlyViewedService.track(id);
          } catch (err) {
            console.log('Could not track view');
          }
        }

        const minBid = response.data.currentPrice
          ? response.data.currentPrice + 1
          : response.data.startingPrice || 0;
        setBidAmount(minBid.toFixed(2));
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleWatchlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isWatching) {
        await watchlistService.remove(id);
        setIsWatching(false);
        setSnackbar({ open: true, message: 'Removed from watchlist', severity: 'info' });
      } else {
        await watchlistService.add(id);
        setIsWatching(true);
        setSnackbar({ open: true, message: 'Added to watchlist', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error', severity: 'error' });
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await addToCart(id, quantity);
      setSnackbar({ open: true, message: 'Added to cart', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error adding to cart', severity: 'error' });
    }
  };

  const handleBid = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await bidService.place({ productId: id, bidAmount: parseFloat(bidAmount) });
      const response = await productService.getById(id);
      setProduct(response.data);
      setSnackbar({ open: true, message: 'Bid placed successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error placing bid', severity: 'error' });
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await addToCart(id, quantity);
      navigate('/checkout');
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={40} />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">Product not found</Typography>
      </Container>
    );
  }

  const isAuction = product.listingType === 'auction' || product.listingType === 'both';
  const hasBuyNow = product.listingType === 'buy_now' || product.listingType === 'both';
  const timeLeft = product.auctionEnd ? formatDistanceToNow(new Date(product.auctionEnd)) : null;
  const minimumBid = product.currentPrice ? product.currentPrice + 1 : product.startingPrice;

  const conditionLabels = {
    new: 'Brand New',
    like_new: 'Like New',
    very_good: 'Very Good',
    good: 'Good',
    acceptable: 'Acceptable',
    for_parts: 'For Parts',
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        {product.category && (
          <Link to={`/category/${product.category.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {product.category.name}
          </Link>
        )}
        <Typography color="text.primary" noWrap sx={{ maxWidth: 200 }}>
          {product.title}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Images */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'sticky', top: 100 }}>
            <Box
              sx={{
                bgcolor: 'grey.50',
                borderRadius: 2,
                p: 2,
                mb: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 400,
              }}
            >
              <Box
                component="img"
                src={product.images?.[selectedImage]?.url || 'https://via.placeholder.com/500'}
                alt={product.title}
                sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
            {product.images?.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {product.images.map((img, idx) => (
                  <Box
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    sx={{
                      width: 80,
                      height: 80,
                      border: selectedImage === idx ? '2px solid' : '1px solid',
                      borderColor: selectedImage === idx ? 'primary.main' : 'grey.300',
                      borderRadius: 1,
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      component="img"
                      src={img.thumbnail || img.url}
                      alt=""
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
            {product.title}
          </Typography>

          {/* Seller info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar src={getImageUrl(product.seller?.avatarUrl)}>
              {product.seller?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography
                component={Link}
                to={`/store/${product.seller?.username}`}
                variant="subtitle1"
                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {product.seller?.username}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating value={product.seller?.rating * 5} readOnly size="small" precision={0.1} />
                <Typography variant="body2" color="text.secondary">
                  ({product.seller?.totalSales} sales)
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Condition */}
          <Chip label={conditionLabels[product.condition]} size="small" sx={{ mb: 2 }} />

          {/* Auction section */}
          {isAuction && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Timer color="error" />
                <Typography variant="subtitle1" color="error.main">
                  {timeLeft} left
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                Current bid ({product.bidCount} bids)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                ${product.currentPrice?.toFixed(2) || product.startingPrice?.toFixed(2)}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Your max bid"
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  size="small"
                  InputProps={{ startAdornment: '$' }}
                  sx={{ width: 150 }}
                />
                <Button
                  variant="contained"
                  startIcon={<Gavel />}
                  onClick={handleBid}
                  disabled={parseFloat(bidAmount) < minimumBid}
                  sx={{ borderRadius: 5, bgcolor: '#3665f3' }}
                >
                  Place bid
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Enter ${minimumBid?.toFixed(2)} or more
              </Typography>
            </Paper>
          )}

          {/* Buy Now section */}
          {hasBuyNow && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Buy It Now
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                ${product.buyNowPrice?.toFixed(2)}
              </Typography>

              {product.quantity > 1 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Quantity: {product.quantity - product.quantitySold} available
                  </Typography>
                  <TextField
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, product.quantity - product.quantitySold)))}
                    size="small"
                    inputProps={{ min: 1, max: product.quantity - product.quantitySold }}
                    sx={{ width: 100 }}
                  />
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleBuyNow}
                  sx={{ borderRadius: 5, px: 4, bgcolor: '#3665f3', flexGrow: 1 }}
                >
                  Buy It Now
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ShoppingCart />}
                  onClick={handleAddToCart}
                  sx={{ borderRadius: 5, px: 4, flexGrow: 1 }}
                >
                  Add to cart
                </Button>
              </Box>
            </Paper>
          )}

          {/* Make Offer Button */}
          {hasBuyNow && product.acceptsOffers && (
            <Button
              variant="outlined"
              fullWidth
              onClick={() => user ? setOfferDialog(true) : navigate('/login')}
              sx={{ mb: 2, borderRadius: 5 }}
            >
              Make an Offer
            </Button>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              startIcon={isWatching ? <Favorite color="error" /> : <FavoriteBorder />}
              onClick={handleWatchlistToggle}
            >
              {isWatching ? 'Watching' : 'Add to watchlist'}
            </Button>
            <Button
              size="small"
              onClick={() => user ? setPriceAlertDialog(true) : navigate('/login')}
            >
              Price Alert
            </Button>
            <SocialShare product={product} />
          </Box>

          {/* Shipping */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <LocalShipping color={product.freeShipping ? 'success' : 'action'} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">
                  {product.freeShipping ? 'FREE Shipping' : `Shipping: $${product.shippingCost?.toFixed(2)}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ships from {product.shippingFrom?.city}, {product.shippingFrom?.state}
                  {product.shippingFromZip && ` ${product.shippingFromZip}`}
                </Typography>
                {product.shippingService && (
                  <Typography variant="body2" color="text.secondary">
                    Service: {product.shippingService.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                )}
                {product.handlingTime && (
                  <Typography variant="body2" color="text.secondary">
                    Handling time: {product.handlingTime} business day{product.handlingTime > 1 ? 's' : ''}
                  </Typography>
                )}
                {product.estimatedDeliveryDays && (
                  <Typography variant="body2" color="text.secondary">
                    Estimated delivery: {product.estimatedDeliveryDays} days
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Local Pickup */}
          {product.allowsLocalPickup && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocationOn color="primary" />
                <Box>
                  <Typography variant="subtitle2">Local pickup available</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pick up from {product.shippingFrom?.city}, {product.shippingFrom?.state}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Returns */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Autorenew color={product.acceptsReturns ? 'success' : 'action'} />
              <Box>
                <Typography variant="subtitle2">
                  {product.acceptsReturns ? (
                    product.freeReturns ? 'Free returns' : `${product.returnPeriod || 30}-day returns`
                  ) : 'No returns accepted'}
                </Typography>
                {product.acceptsReturns && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {product.freeReturns
                        ? 'Seller pays for return shipping'
                        : `${product.returnShippingPaidBy === 'buyer' ? 'Buyer' : 'Seller'} pays for return shipping`
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Return period: {product.returnPeriod || 30} days
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Buyer protection */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <VerifiedUser color="primary" />
              <Box>
                <Typography variant="subtitle2">eBay Money Back Guarantee</Typography>
                <Typography variant="body2" color="text.secondary">
                  Get the item you ordered or your money back
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Trending Badge - eBay style */}
      <Paper sx={{ p: 2, mb: 4, mt: 4, bgcolor: '#f7f7f7', border: '1px solid #e5e5e5' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUp color="error" />
          <Typography variant="body2">
            <strong>Trending:</strong> {Math.floor(Math.random() * 50) + 10} people are viewing this item
          </Typography>
          <Visibility sx={{ ml: 2, color: 'text.secondary' }} fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            {Math.floor(Math.random() * 200) + 50} sold
          </Typography>
        </Box>
      </Paper>

      {/* About This Item Section - eBay style */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, fontSize: '1.5rem' }}>
          About this item
        </Typography>

        {/* Item Specifics - Two Column Layout */}
        <Paper sx={{ mb: 4, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#f7f7f7', px: 3, py: 2, borderBottom: '1px solid #e5e5e5' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Item specifics
            </Typography>
          </Box>
          <Box sx={{ p: 0 }}>
            <Grid container>
              {/* Standard product fields */}
              {product.condition && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                    <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                      <Typography variant="body2" color="text.secondary">Condition</Typography>
                    </Box>
                    <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {conditionLabels[product.condition] || product.condition}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {product.brand && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                    <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                      <Typography variant="body2" color="text.secondary">Brand</Typography>
                    </Box>
                    <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.brand}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {product.model && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                    <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                      <Typography variant="body2" color="text.secondary">Model</Typography>
                    </Box>
                    <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.model}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {product.upc && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                    <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                      <Typography variant="body2" color="text.secondary">UPC</Typography>
                    </Box>
                    <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.upc}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {product.sku && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                    <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                      <Typography variant="body2" color="text.secondary">SKU</Typography>
                    </Box>
                    <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.sku}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {product.color && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                    <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                      <Typography variant="body2" color="text.secondary">Color</Typography>
                    </Box>
                    <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.color}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {product.size && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                    <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                      <Typography variant="body2" color="text.secondary">Size</Typography>
                    </Box>
                    <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.size}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {product.material && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                    <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                      <Typography variant="body2" color="text.secondary">Material</Typography>
                    </Box>
                    <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.material}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {product.weight && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                    <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                      <Typography variant="body2" color="text.secondary">Weight</Typography>
                    </Box>
                    <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.weight}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {product.dimensions && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                    <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                      <Typography variant="body2" color="text.secondary">Dimensions</Typography>
                    </Box>
                    <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.dimensions}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {/* Custom specifications from seller */}
              {product.specifications?.['Item Specifics']?.map((spec, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Box
                    sx={{
                      display: 'flex',
                      borderBottom: '1px solid #e5e5e5',
                    }}
                  >
                    <Box
                      sx={{
                        width: '40%',
                        bgcolor: '#f7f7f7',
                        px: 2,
                        py: 1.5,
                        borderRight: '1px solid #e5e5e5',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {spec.name}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {spec.value}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>

        {/* Package Details - If available */}
        {(product.packageWeight || product.packageLength) && (
          <Paper sx={{ mb: 4, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#f7f7f7', px: 3, py: 2, borderBottom: '1px solid #e5e5e5' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Package details
              </Typography>
            </Box>
            <Box sx={{ p: 0 }}>
              <Grid container>
                {product.packageWeight && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                      <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                        <Typography variant="body2" color="text.secondary">Package weight</Typography>
                      </Box>
                      <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {product.packageWeight} {product.packageWeightUnit || 'lbs'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {product.packageLength && product.packageWidth && product.packageHeight && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                      <Box sx={{ width: '40%', bgcolor: '#f7f7f7', px: 2, py: 1.5, borderRight: '1px solid #e5e5e5' }}>
                        <Typography variant="body2" color="text.secondary">Package dimensions</Typography>
                      </Box>
                      <Box sx={{ width: '60%', px: 2, py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {product.packageLength} x {product.packageWidth} x {product.packageHeight} {product.dimensionUnit || 'in'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Paper>
        )}

        {/* Key Features - Bullet Points */}
        {product.specifications?.['Key Features'] && (
          <Paper sx={{ mb: 4, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#f7f7f7', px: 3, py: 2, borderBottom: '1px solid #e5e5e5' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Key Features
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {product.specifications['Key Features'].map((feature, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <CheckCircle sx={{ color: '#3665f3', fontSize: 20, mt: 0.3 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {feature.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.value}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        )}

        {/* Detailed Specifications */}
        {product.specifications?.['Specifications'] && (
          <Paper sx={{ mb: 4, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#f7f7f7', px: 3, py: 2, borderBottom: '1px solid #e5e5e5' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Specifications
              </Typography>
            </Box>
            <Table size="small">
              <TableBody>
                {product.specifications['Specifications'].map((spec, idx) => (
                  <TableRow
                    key={idx}
                    sx={{ '&:nth-of-type(even)': { bgcolor: '#fafafa' } }}
                  >
                    <TableCell
                      sx={{
                        width: '35%',
                        py: 1.5,
                        px: 3,
                        color: 'text.secondary',
                        borderBottom: '1px solid #e5e5e5',
                      }}
                    >
                      {spec.name}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1.5,
                        px: 3,
                        fontWeight: 500,
                        borderBottom: '1px solid #e5e5e5',
                      }}
                    >
                      {spec.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* Product Description */}
        <Paper sx={{ mb: 4, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#f7f7f7', px: 3, py: 2, borderBottom: '1px solid #e5e5e5' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Item description from the seller
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {product.description}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* About the Seller Section - eBay style */}
      <Paper sx={{ mb: 4, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: '#f7f7f7', px: 3, py: 2, borderBottom: '1px solid #e5e5e5' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            About this seller
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={getImageUrl(product.seller?.avatarUrl)}
                  sx={{ width: 64, height: 64, bgcolor: '#3665f3' }}
                >
                  <Store sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {product.seller?.username}
                  </Typography>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                    {(product.seller?.rating * 100 || 99.1).toFixed(1)}% positive feedback
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.seller?.totalSales?.toLocaleString() || '1.2K'} items sold
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                fullWidth
                sx={{ borderRadius: 5, mb: 1 }}
                component={Link}
                to={`/store/${product.seller?.username}`}
              >
                Visit store
              </Button>
              <Button
                variant="text"
                fullWidth
                sx={{ borderRadius: 5 }}
                onClick={() => user ? navigate(`/profile?tab=messages&compose=${product.seller?.id}`) : navigate('/login')}
              >
                Contact seller
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Detailed seller ratings
              </Typography>
              {[
                { label: 'Accurate description', value: 4.9 },
                { label: 'Reasonable shipping cost', value: 5.0 },
                { label: 'Shipping speed', value: 5.0 },
                { label: 'Communication', value: 5.0 },
              ].map((rating) => (
                <Box key={rating.label} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ width: 180 }}>
                    {rating.label}
                  </Typography>
                  <Box sx={{ flexGrow: 1, mx: 1 }}>
                    <Box
                      sx={{
                        height: 8,
                        bgcolor: '#e5e5e5',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${(rating.value / 5) * 100}%`,
                          bgcolor: '#3665f3',
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 30 }}>
                    {rating.value}
                  </Typography>
                </Box>
              ))}
              <Typography variant="caption" color="text.secondary">
                Average for the last 12 months
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Seller feedback
              </Typography>
              {[
                { user: 'a***2', text: 'Great seller, fast shipping! A+++', time: 'Past month' },
                { user: 's***5', text: 'Item as described, would buy again', time: 'Past month' },
                { user: 'm***8', text: 'Excellent transaction, thank you!', time: 'Past month' },
              ].map((feedback, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {feedback.user}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • {feedback.time}
                    </Typography>
                    <Chip label="Verified purchase" size="small" sx={{ height: 18, fontSize: 10 }} />
                  </Box>
                  <Typography variant="body2">{feedback.text}</Typography>
                </Box>
              ))}
              <Button variant="text" size="small" sx={{ color: '#3665f3' }}>
                See all feedback
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Tabs for Bids */}
      {isAuction && (
        <Box sx={{ mt: 4 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`Bids (${product.bidCount || 0})`} />
          </Tabs>
          <Box sx={{ py: 3 }}>
            {product.recentBids?.length > 0 ? (
              <Table>
                <TableBody>
                  {product.recentBids.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell>{bid.bidder}</TableCell>
                      <TableCell>${bid.amount.toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(bid.time), 'MMM d, yyyy h:mm a')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography color="text.secondary">No bids yet</Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Product Q&A */}
      <ProductQA productId={id} sellerId={product.seller?.id} />

      {/* Similar Items */}
      <SimilarItems productId={id} categoryId={product.category?.id} title="Similar sponsored items" />

      {/* Make Offer Dialog */}
      <MakeOffer
        open={offerDialog}
        onClose={() => setOfferDialog(false)}
        product={product}
        onSuccess={() => setSnackbar({ open: true, message: 'Offer submitted!', severity: 'success' })}
      />

      {/* Price Alert Dialog */}
      <PriceAlert
        open={priceAlertDialog}
        onClose={() => setPriceAlertDialog(false)}
        product={product}
        onSuccess={() => setSnackbar({ open: true, message: 'Price alert created!', severity: 'success' })}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductDetail;
