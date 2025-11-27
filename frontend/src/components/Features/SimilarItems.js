import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Skeleton,
  IconButton,
  Chip,
} from '@mui/material';
import { FavoriteBorder, Favorite } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { recommendationService, watchlistService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SimilarItems = ({ productId, categoryId, title = 'Similar items' }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchedItems, setWatchedItems] = useState(new Set());

  useEffect(() => {
    fetchSimilarItems();
  }, [productId, categoryId]);

  const fetchSimilarItems = async () => {
    try {
      let response;
      if (productId) {
        response = await recommendationService.getSimilar(productId);
      } else if (categoryId) {
        response = await recommendationService.getForCategory(categoryId);
      } else {
        response = await recommendationService.getTrending();
      }
      setItems(response.data?.slice(0, 6) || []);
    } catch (error) {
      console.error('Error fetching similar items:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = async (itemId, e) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (watchedItems.has(itemId)) {
        await watchlistService.remove(itemId);
        setWatchedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      } else {
        await watchlistService.add(itemId);
        setWatchedItems(prev => new Set([...prev, itemId]));
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Skeleton variant="rectangular" height={150} />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="60%" />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (items.length === 0) return null;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{title}</Typography>
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid item xs={6} sm={4} md={2} key={item.id}>
            <Card
              component={Link}
              to={`/product/${item.id}`}
              sx={{
                textDecoration: 'none',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover': { boxShadow: 4 },
              }}
            >
              {item.matchScore && (
                <Chip
                  label={`${Math.round(item.matchScore * 100)}% match`}
                  size="small"
                  color="primary"
                  sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
                />
              )}
              <IconButton
                size="small"
                onClick={(e) => toggleWatchlist(item.id, e)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'white',
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                {watchedItems.has(item.id) ? (
                  <Favorite color="error" fontSize="small" />
                ) : (
                  <FavoriteBorder fontSize="small" />
                )}
              </IconButton>
              <CardMedia
                component="img"
                height="140"
                image={item.images?.[0]?.url || 'https://via.placeholder.com/200'}
                alt={item.title}
                sx={{ objectFit: 'contain', bgcolor: 'grey.50', p: 1 }}
              />
              <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
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
                  {item.title}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  ${item.buyNowPrice?.toFixed(2) || item.currentPrice?.toFixed(2)}
                </Typography>
                {item.freeShipping && (
                  <Typography variant="caption" color="success.main">
                    Free shipping
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SimilarItems;
