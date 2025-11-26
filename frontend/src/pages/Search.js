import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Checkbox,
  FormControlLabel,
  Paper,
  Pagination,
  Chip,
  Button,
  Collapse,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FilterList, ExpandMore, ExpandLess } from '@mui/icons-material';
import { productService, categoryService } from '../services/api';
import ProductGrid from '../components/Products/ProductGrid';

const Search = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(!isMobile);

  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    listingType: searchParams.get('listingType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    freeShipping: searchParams.get('freeShipping') === 'true',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  const [priceRange, setPriceRange] = useState([0, 5000]);

  useEffect(() => {
    categoryService.getAll().then((res) => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: 20,
          search: filters.search || undefined,
          category: filters.category || undefined,
          condition: filters.condition || undefined,
          listingType: filters.listingType || undefined,
          minPrice: filters.minPrice || undefined,
          maxPrice: filters.maxPrice || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        };

        Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

        const response = await productService.getAll(params);
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters, pagination.page]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));

    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handlePriceRangeCommit = () => {
    handleFilterChange('minPrice', priceRange[0] > 0 ? priceRange[0] : '');
    handleFilterChange('maxPrice', priceRange[1] < 5000 ? priceRange[1] : '');
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      condition: '',
      listingType: '',
      minPrice: '',
      maxPrice: '',
      freeShipping: false,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    setPriceRange([0, 5000]);
    setSearchParams({});
  };

  const conditions = [
    { value: 'new', label: 'Brand New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'very_good', label: 'Very Good' },
    { value: 'good', label: 'Good' },
    { value: 'acceptable', label: 'Acceptable' },
  ];

  const listingTypes = [
    { value: 'auction', label: 'Auction' },
    { value: 'buy_now', label: 'Buy It Now' },
    { value: 'both', label: 'Auction + Buy Now' },
  ];

  const sortOptions = [
    { value: 'created_at-desc', label: 'Newest first' },
    { value: 'created_at-asc', label: 'Oldest first' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'auction_end-asc', label: 'Ending soonest' },
    { value: 'view_count-desc', label: 'Most popular' },
  ];

  const activeFiltersCount = [
    filters.category,
    filters.condition,
    filters.listingType,
    filters.minPrice,
    filters.maxPrice,
    filters.freeShipping,
  ].filter(Boolean).length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          {filters.search ? `Results for "${filters.search}"` : 'All Products'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pagination.total.toLocaleString()} results
        </Typography>
      </Box>

      {/* Active filters */}
      {activeFiltersCount > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {filters.category && (
            <Chip
              label={categories.find((c) => c.slug === filters.category)?.name || filters.category}
              onDelete={() => handleFilterChange('category', '')}
              size="small"
            />
          )}
          {filters.condition && (
            <Chip
              label={conditions.find((c) => c.value === filters.condition)?.label}
              onDelete={() => handleFilterChange('condition', '')}
              size="small"
            />
          )}
          {filters.listingType && (
            <Chip
              label={listingTypes.find((l) => l.value === filters.listingType)?.label}
              onDelete={() => handleFilterChange('listingType', '')}
              size="small"
            />
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <Chip
              label={`$${filters.minPrice || '0'} - $${filters.maxPrice || '∞'}`}
              onDelete={() => {
                handleFilterChange('minPrice', '');
                handleFilterChange('maxPrice', '');
                setPriceRange([0, 5000]);
              }}
              size="small"
            />
          )}
          <Button size="small" onClick={clearFilters}>
            Clear all
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Filters sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                cursor: isMobile ? 'pointer' : 'default',
              }}
              onClick={() => isMobile && setShowFilters(!showFilters)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterList />
                <Typography variant="h6">Filters</Typography>
                {activeFiltersCount > 0 && (
                  <Chip label={activeFiltersCount} size="small" color="primary" />
                )}
              </Box>
              {isMobile && (showFilters ? <ExpandLess /> : <ExpandMore />)}
            </Box>

            <Collapse in={showFilters}>
              {/* Category */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Condition */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={filters.condition}
                  label="Condition"
                  onChange={(e) => handleFilterChange('condition', e.target.value)}
                >
                  <MenuItem value="">Any condition</MenuItem>
                  {conditions.map((cond) => (
                    <MenuItem key={cond.value} value={cond.value}>
                      {cond.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Listing Type */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Buying Format</InputLabel>
                <Select
                  value={filters.listingType}
                  label="Buying Format"
                  onChange={(e) => handleFilterChange('listingType', e.target.value)}
                >
                  <MenuItem value="">All Listings</MenuItem>
                  {listingTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Price Range */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Price Range
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={handlePriceRangeChange}
                  onChangeCommitted={handlePriceRangeCommit}
                  valueLabelDisplay="auto"
                  min={0}
                  max={5000}
                  valueLabelFormat={(v) => `$${v}`}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">${priceRange[0]}</Typography>
                  <Typography variant="caption">${priceRange[1]}</Typography>
                </Box>
              </Box>

              {/* Free Shipping */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.freeShipping}
                    onChange={(e) => handleFilterChange('freeShipping', e.target.checked)}
                  />
                }
                label="Free Shipping"
              />
            </Collapse>
          </Paper>
        </Grid>

        {/* Products */}
        <Grid item xs={12} md={9}>
          {/* Sort */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                label="Sort by"
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
              >
                {sortOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <ProductGrid products={products} loading={loading} />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={(e, page) => setPagination((prev) => ({ ...prev, page }))}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Search;
