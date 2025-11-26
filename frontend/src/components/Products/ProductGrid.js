import React from 'react';
import { Grid, Box, CircularProgress, Typography } from '@mui/material';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, loading, onWatchlistToggle, watchedIds = [] }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No products found
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {products.map((product) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
          <ProductCard
            product={product}
            onWatchlistToggle={onWatchlistToggle}
            isWatching={watchedIds.includes(product.id)}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductGrid;
