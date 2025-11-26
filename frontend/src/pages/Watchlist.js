import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Box,
  Pagination,
} from '@mui/material';
import { Favorite as WatchlistIcon } from '@mui/icons-material';
import { watchlistService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductGrid from '../components/Products/ProductGrid';

const Watchlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const response = await watchlistService.get({ page: pagination.page });
      setItems(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user, pagination.page]);

  const handleRemove = async (productId) => {
    try {
      await watchlistService.remove(productId);
      setItems(items.filter((item) => item.product.id !== productId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <WatchlistIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>
          Sign in to view your watchlist
        </Typography>
        <Button
          component={Link}
          to="/login"
          variant="contained"
          sx={{ borderRadius: 5, bgcolor: '#3665f3' }}
        >
          Sign in
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <WatchlistIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>
          Your watchlist is empty
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Watch items to keep track of deals and auctions
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          sx={{ borderRadius: 5, bgcolor: '#3665f3' }}
        >
          Start shopping
        </Button>
      </Container>
    );
  }

  const products = items.map((item) => ({
    ...item.product,
    seller: item.seller,
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        Watchlist
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {pagination.total} items
      </Typography>

      <ProductGrid
        products={products}
        onWatchlistToggle={handleRemove}
        watchedIds={products.map((p) => p.id)}
      />

      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={(e, page) => setPagination((prev) => ({ ...prev, page }))}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
};

export default Watchlist;
