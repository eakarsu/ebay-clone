import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  InputAdornment,
  Chip,
  Rating,
  Avatar,
  Skeleton,
} from '@mui/material';
import { Search, Store as StoreIcon, Verified, Star } from '@mui/icons-material';
import api from '../services/api';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores/featured');
      setStores(Array.isArray(response.data) ? response.data : []);
      setLoadError(Array.isArray(response.data) ? '' : 'Stores returned an unexpected response.');
    } catch (error) {
      setLoadError('Stores could not be loaded. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(store =>
    (store.storeName || store.store_name || store.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <StoreIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          eBay Stores
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Discover trusted sellers and browse their collections
        </Typography>
        <Box sx={{ maxWidth: 500, mx: 'auto' }}>
          <TextField
            fullWidth
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Featured Stores
      </Typography>
      {loadError && <Typography role="alert" color="error" sx={{ mb: 2 }}>{loadError}</Typography>}

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {filteredStores.map((store) => (
            <Grid item xs={12} sm={6} md={4} key={store.id}>
              <Card
                component={Link}
                to={`/store/${store.username}`}
                sx={{
                  textDecoration: 'none',
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 120,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Avatar
                    src={store.logoUrl}
                    sx={{ width: 80, height: 80, border: '3px solid white' }}
                  >
                    {(store.storeName || store.username)?.[0]?.toUpperCase()}
                  </Avatar>
                </CardMedia>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {store.storeName || store.username}
                    </Typography>
                    {store.isVerified && (
                      <Verified sx={{ fontSize: 18, color: 'primary.main' }} />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Rating value={Number(store.rating) || 0} precision={0.1} size="small" readOnly />
                    <Typography variant="body2" color="text.secondary">
                      ({store.rating == null ? 'No rating' : store.rating})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      size="small"
                      label={`${store.subscriberCount || 0} followers`}
                      variant="outlined"
                    />
                    {store.isVerified && (
                      <Chip size="small" label="Top Rated" color="primary" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {filteredStores.length === 0 && !loading && !loadError && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <StoreIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No stores found matching "{searchQuery}"
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Stores;
