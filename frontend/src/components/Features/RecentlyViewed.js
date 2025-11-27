import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Skeleton,
  Button,
} from '@mui/material';
import { ChevronLeft, ChevronRight, History, Clear } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { recentlyViewedService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const RecentlyViewed = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (user) {
      fetchRecentlyViewed();
    }
  }, [user]);

  const fetchRecentlyViewed = async () => {
    try {
      const response = await recentlyViewedService.get();
      setItems(response.data || []);
    } catch (error) {
      console.error('Error fetching recently viewed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await recentlyViewedService.clear();
      setItems([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const scroll = (direction) => {
    const container = document.getElementById('recently-viewed-scroll');
    const scrollAmount = 300;
    if (container) {
      const newPosition = direction === 'left'
        ? scrollPosition - scrollAmount
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (!user || loading) {
    if (loading && user) {
      return (
        <Box sx={{ my: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Recently Viewed</Typography>
          <Box sx={{ display: 'flex', gap: 2, overflow: 'hidden' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" width={180} height={220} />
            ))}
          </Box>
        </Box>
      );
    }
    return null;
  }

  if (items.length === 0) return null;

  return (
    <Box sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History color="action" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recently Viewed
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<Clear />}
          onClick={handleClearHistory}
          color="inherit"
        >
          Clear
        </Button>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={() => scroll('left')}
          sx={{
            position: 'absolute',
            left: -20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            bgcolor: 'white',
            boxShadow: 2,
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          <ChevronLeft />
        </IconButton>

        <Box
          id="recently-viewed-scroll"
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            py: 1,
          }}
        >
          {items.map((item) => (
            <Card
              key={item.id}
              component={Link}
              to={`/product/${item.productId || item.id}`}
              sx={{
                minWidth: 180,
                maxWidth: 180,
                textDecoration: 'none',
                '&:hover': { boxShadow: 4 },
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image={item.product?.images?.[0]?.url || item.images?.[0]?.url || 'https://via.placeholder.com/180'}
                alt={item.product?.title || item.title}
                sx={{ objectFit: 'contain', bgcolor: 'grey.50', p: 1 }}
              />
              <CardContent sx={{ p: 1.5 }}>
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
                    minHeight: 40,
                  }}
                >
                  {item.product?.title || item.title}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  ${(item.product?.buyNowPrice || item.buyNowPrice)?.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <IconButton
          onClick={() => scroll('right')}
          sx={{
            position: 'absolute',
            right: -20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            bgcolor: 'white',
            boxShadow: 2,
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          <ChevronRight />
        </IconButton>
      </Box>
    </Box>
  );
};

export default RecentlyViewed;
