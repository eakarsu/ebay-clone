import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  Alert,
} from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  LocalShipping,
  Timer,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Share,
  ContentCopy,
  Close,
  ShoppingCart,
  CompareArrows,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { productService, cartService } from '../../services/api';
import { useCompareList } from '../../pages/Compare';

const ProductCard = ({
  product,
  onWatchlistToggle,
  isWatching,
  showActions = false,  // Show edit/delete for seller's own listings
  onDelete,
  onEdit,
}) => {
  const navigate = useNavigate();
  const compare = useCompareList();
  const [anchorEl, setAnchorEl] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    id,
    title,
    description,
    primaryImage,
    image_url,
    currentPrice,
    current_price,
    buyNowPrice,
    buy_now_price,
    price,
    listingType,
    listing_type,
    auctionEnd,
    auction_end,
    bidCount,
    bid_count,
    shippingCost,
    shipping_cost,
    freeShipping,
    free_shipping,
    condition,
    seller,
    quantity,
    view_count,
    category,
  } = product;

  // Handle both camelCase and snake_case
  const displayPrice = price || buyNowPrice || buy_now_price || currentPrice || current_price || 0;
  const displayImage = primaryImage || image_url || 'https://via.placeholder.com/300x200?text=No+Image';
  const isAuction = (listingType || listing_type) === 'auction' || (listingType || listing_type) === 'both';
  const auctionEndDate = auctionEnd || auction_end;
  const timeLeft = auctionEndDate ? formatDistanceToNow(new Date(auctionEndDate), { addSuffix: false }) : null;
  const isFreeShipping = freeShipping || free_shipping;
  const displayShipping = shippingCost || shipping_cost || 0;
  const bids = bidCount || bid_count || 0;

  const conditionLabels = {
    new: 'Brand New',
    like_new: 'Like New',
    very_good: 'Very Good',
    good: 'Good',
    acceptable: 'Acceptable',
    for_parts: 'For Parts',
    used: 'Used',
  };

  const handleMenuOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCardClick = (e) => {
    // If clicking on action buttons, don't navigate
    if (e.target.closest('button') || e.target.closest('.MuiIconButton-root')) {
      return;
    }
    navigate(`/product/${id}`);
  };

  const handleViewDetails = () => {
    handleMenuClose();
    setDetailOpen(true);
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) {
      onEdit(product);
    } else {
      navigate(`/sell/edit/${id}`);
    }
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await productService.delete(id);
      setDeleteConfirm(false);
      if (onDelete) {
        onDelete(id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await cartService.add({ productId: id, quantity: 1 });
      // Could add a snackbar notification here
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const handleShare = () => {
    handleMenuClose();
    if (navigator.share) {
      navigator.share({
        title: title,
        url: `${window.location.origin}/product/${id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/product/${id}`);
    }
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-4px)',
          },
        }}
        onClick={handleCardClick}
      >
        {/* Top action buttons */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, display: 'flex', gap: 0.5 }}>
          {showActions && (
            <IconButton
              onClick={handleMenuOpen}
              sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
              size="small"
            >
              <MoreVert fontSize="small" />
            </IconButton>
          )}
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWatchlistToggle?.(id);
            }}
            sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
            size="small"
          >
            {isWatching ? <Favorite color="error" /> : <FavoriteBorder />}
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (compare.has(id)) compare.remove(id);
              else compare.add(id);
            }}
            title={compare.has(id) ? 'Remove from compare' : 'Add to compare (up to 4)'}
            sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
            size="small"
          >
            <CompareArrows color={compare.has(id) ? 'primary' : 'inherit'} />
          </IconButton>
        </Box>

        {/* Condition badge */}
        <Chip
          label={conditionLabels[condition] || condition || 'Used'}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            bgcolor: condition === 'new' ? 'success.main' : 'grey.700',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />

        {/* Image */}
        <CardMedia
          component="img"
          height="200"
          image={displayImage}
          alt={title}
          sx={{ objectFit: 'contain', bgcolor: 'grey.50', p: 1 }}
        />

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Title */}
          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 1,
              fontWeight: 500,
              '&:hover': { color: 'primary.main' },
            }}
          >
            {title}
          </Typography>

          {/* Price */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              ${parseFloat(displayPrice).toFixed(2)}
            </Typography>
            {isAuction && bids > 0 && (
              <Typography variant="body2" color="text.secondary">
                {bids} bid{bids !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>

          {/* Auction timer */}
          {isAuction && timeLeft && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Timer fontSize="small" color="error" />
              <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                {timeLeft} left
              </Typography>
            </Box>
          )}

          {/* Shipping */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 'auto' }}>
            <LocalShipping fontSize="small" color={isFreeShipping ? 'success' : 'action'} />
            <Typography variant="caption" color={isFreeShipping ? 'success.main' : 'text.secondary'}>
              {isFreeShipping ? 'Free shipping' : `+$${parseFloat(displayShipping).toFixed(2)} shipping`}
            </Typography>
          </Box>

          {/* Seller */}
          {seller && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {seller.username || seller.first_name}
              </Typography>
              {seller.rating > 0 && (
                <Chip
                  label={`${(seller.rating * 100).toFixed(0)}%`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Box>
          )}
        </CardContent>

        {/* Quick action buttons */}
        {!showActions && (
          <CardActions sx={{ pt: 0 }}>
            <Button
              size="small"
              variant="contained"
              fullWidth
              startIcon={<ShoppingCart />}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
            >
              Add to Cart
            </Button>
          </CardActions>
        )}
      </Card>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleViewDetails}>
          <Visibility fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit Listing
        </MenuItem>
        <MenuItem onClick={handleShare}>
          <Share fontSize="small" sx={{ mr: 1 }} /> Share
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Quick View Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Product Details</Typography>
          <IconButton onClick={() => setDetailOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Box
                component="img"
                src={displayImage}
                alt={title}
                sx={{ width: '100%', borderRadius: 2, maxHeight: 300, objectFit: 'contain' }}
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>{title}</Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip label={conditionLabels[condition] || condition} color="primary" />
                <Chip label={(listingType || listing_type) === 'auction' ? 'Auction' : 'Buy Now'} variant="outlined" />
              </Box>

              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700, mb: 2 }}>
                ${parseFloat(displayPrice).toFixed(2)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {description || 'No description available'}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Quantity</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{quantity || 1}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Views</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{view_count || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{category?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Shipping</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {isFreeShipping ? 'Free' : `$${parseFloat(displayShipping).toFixed(2)}`}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Edit />} onClick={handleEdit}>
            Edit
          </Button>
          <Button variant="contained" onClick={() => navigate(`/product/${id}`)}>
            View Full Page
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Delete Listing?</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography>
            Are you sure you want to delete "{title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductCard;
