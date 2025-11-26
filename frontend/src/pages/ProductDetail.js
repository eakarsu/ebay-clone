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
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { productService, bidService, watchlistService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getById(id);
        setProduct(response.data);
        setIsWatching(response.data.isWatching);

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
            <Avatar src={product.seller?.avatarUrl}>
              {product.seller?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography
                component={Link}
                to={`/seller/${product.seller?.id}`}
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

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              startIcon={isWatching ? <Favorite color="error" /> : <FavoriteBorder />}
              onClick={handleWatchlistToggle}
            >
              {isWatching ? 'Watching' : 'Add to watchlist'}
            </Button>
            <IconButton>
              <Share />
            </IconButton>
          </Box>

          {/* Shipping */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocalShipping color={product.freeShipping ? 'success' : 'action'} />
              <Box>
                <Typography variant="subtitle2">
                  {product.freeShipping ? 'FREE Shipping' : `Shipping: $${product.shippingCost?.toFixed(2)}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ships from {product.shippingFrom?.city}, {product.shippingFrom?.state}
                </Typography>
                {product.estimatedDeliveryDays && (
                  <Typography variant="body2" color="text.secondary">
                    Estimated {product.estimatedDeliveryDays} days delivery
                  </Typography>
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

      {/* Tabs */}
      <Box sx={{ mt: 6 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Description" />
          <Tab label="Specifications" />
          <Tab label={`Bids (${product.bidCount || 0})`} />
        </Tabs>

        <Box sx={{ py: 3 }}>
          {tabValue === 0 && (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {product.description}
            </Typography>
          )}

          {tabValue === 1 && (
            <Table>
              <TableBody>
                {product.brand && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Brand</TableCell>
                    <TableCell>{product.brand}</TableCell>
                  </TableRow>
                )}
                {product.model && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                    <TableCell>{product.model}</TableCell>
                  </TableRow>
                )}
                {product.color && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                    <TableCell>{product.color}</TableCell>
                  </TableRow>
                )}
                {product.size && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                    <TableCell>{product.size}</TableCell>
                  </TableRow>
                )}
                {product.material && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                    <TableCell>{product.material}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Condition</TableCell>
                  <TableCell>{conditionLabels[product.condition]}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {tabValue === 2 && (
            <Box>
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
          )}
        </Box>
      </Box>

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
