import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  LocalShipping,
  Timer,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const ProductCard = ({ product, onWatchlistToggle, isWatching }) => {
  const {
    id,
    title,
    primaryImage,
    currentPrice,
    buyNowPrice,
    listingType,
    auctionEnd,
    bidCount,
    shippingCost,
    freeShipping,
    condition,
    seller,
  } = product;

  const price = buyNowPrice || currentPrice;
  const isAuction = listingType === 'auction' || listingType === 'both';
  const timeLeft = auctionEnd ? formatDistanceToNow(new Date(auctionEnd), { addSuffix: false }) : null;

  const conditionLabels = {
    new: 'Brand New',
    like_new: 'Like New',
    very_good: 'Very Good',
    good: 'Good',
    acceptable: 'Acceptable',
    for_parts: 'For Parts',
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      {/* Watchlist button */}
      <IconButton
        onClick={(e) => {
          e.preventDefault();
          onWatchlistToggle?.(id);
        }}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'white',
          zIndex: 1,
          '&:hover': { bgcolor: 'grey.100' },
        }}
        size="small"
      >
        {isWatching ? <Favorite color="error" /> : <FavoriteBorder />}
      </IconButton>

      {/* Image */}
      <Link to={`/product/${id}`} style={{ textDecoration: 'none' }}>
        <CardMedia
          component="img"
          height="200"
          image={primaryImage || 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={title}
          sx={{ objectFit: 'contain', bgcolor: 'grey.50', p: 1 }}
        />
      </Link>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title */}
        <Typography
          component={Link}
          to={`/product/${id}`}
          variant="body2"
          sx={{
            color: 'text.primary',
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 1,
            '&:hover': { color: 'primary.main' },
          }}
        >
          {title}
        </Typography>

        {/* Condition */}
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {conditionLabels[condition] || condition}
        </Typography>

        {/* Price */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ${price?.toFixed(2)}
          </Typography>
          {isAuction && listingType === 'both' && buyNowPrice && (
            <Typography variant="caption" color="text.secondary">
              Buy It Now
            </Typography>
          )}
          {isAuction && currentPrice && currentPrice !== buyNowPrice && (
            <Typography variant="body2" color="text.secondary">
              {bidCount} bids · ${currentPrice?.toFixed(2)} current
            </Typography>
          )}
        </Box>

        {/* Auction timer */}
        {isAuction && timeLeft && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Timer fontSize="small" color="error" />
            <Typography variant="caption" color="error.main">
              {timeLeft} left
            </Typography>
          </Box>
        )}

        {/* Shipping */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 'auto' }}>
          <LocalShipping fontSize="small" color={freeShipping ? 'success' : 'action'} />
          <Typography variant="caption" color={freeShipping ? 'success.main' : 'text.secondary'}>
            {freeShipping ? 'Free shipping' : `+$${shippingCost?.toFixed(2)} shipping`}
          </Typography>
        </Box>

        {/* Seller */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {seller?.username}
          </Typography>
          {seller?.rating > 0 && (
            <Chip
              label={`${(seller.rating * 100).toFixed(0)}%`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
