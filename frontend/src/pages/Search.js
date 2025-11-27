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
  TextField,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
} from '@mui/material';
import { FilterList, ExpandMore, ExpandLess, LocationOn, LocalShipping, Star, Verified } from '@mui/icons-material';
import { productService, categoryService } from '../services/api';
import ProductGrid from '../components/Products/ProductGrid';

const Search = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page')) || 1,
    pages: 1,
    total: 0
  });
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
    // New filters
    location: searchParams.get('location') || '',
    state: searchParams.get('state') || '',
    country: searchParams.get('country') || 'US',
    brand: searchParams.get('brand') || '',
    acceptsOffers: searchParams.get('acceptsOffers') === 'true',
    freeReturns: searchParams.get('freeReturns') === 'true',
    topRatedSeller: searchParams.get('topRatedSeller') === 'true',
    minSellerRating: searchParams.get('minSellerRating') || '',
    endingWithin: searchParams.get('endingWithin') || '',
    localPickup: searchParams.get('localPickup') === 'true',
    featured: searchParams.get('featured') === 'true',
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
          // New filters
          location: filters.location || undefined,
          state: filters.state || undefined,
          country: filters.country !== 'US' ? filters.country : undefined,
          brand: filters.brand || undefined,
          acceptsOffers: filters.acceptsOffers ? 'true' : undefined,
          freeReturns: filters.freeReturns ? 'true' : undefined,
          freeShipping: filters.freeShipping ? 'true' : undefined,
          topRatedSeller: filters.topRatedSeller ? 'true' : undefined,
          minSellerRating: filters.minSellerRating || undefined,
          endingWithin: filters.endingWithin || undefined,
          localPickup: filters.localPickup ? 'true' : undefined,
          featured: filters.featured ? 'true' : undefined,
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
      location: '',
      state: '',
      country: 'US',
      brand: '',
      acceptsOffers: false,
      freeReturns: false,
      topRatedSeller: false,
      minSellerRating: '',
      endingWithin: '',
      localPickup: false,
      featured: false,
    });
    setPriceRange([0, 5000]);
    setPagination((prev) => ({ ...prev, page: 1 }));
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

  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming',
  ];

  const countries = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'CN', label: 'China' },
    { value: 'WORLDWIDE', label: 'Worldwide' },
  ];

  const endingWithinOptions = [
    { value: '1', label: '1 hour' },
    { value: '4', label: '4 hours' },
    { value: '12', label: '12 hours' },
    { value: '24', label: '1 day' },
    { value: '48', label: '2 days' },
    { value: '168', label: '7 days' },
  ];

  const sellerRatingOptions = [
    { value: '4.5', label: '4.5 stars & up' },
    { value: '4.0', label: '4.0 stars & up' },
    { value: '3.5', label: '3.5 stars & up' },
    { value: '3.0', label: '3.0 stars & up' },
  ];

  const activeFiltersCount = [
    filters.category,
    filters.condition,
    filters.listingType,
    filters.minPrice,
    filters.maxPrice,
    filters.freeShipping,
    filters.location,
    filters.state,
    filters.country !== 'US' && filters.country,
    filters.brand,
    filters.acceptsOffers,
    filters.freeReturns,
    filters.topRatedSeller,
    filters.minSellerRating,
    filters.endingWithin,
    filters.localPickup,
    filters.featured,
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
          {filters.location && (
            <Chip
              icon={<LocationOn fontSize="small" />}
              label={filters.location}
              onDelete={() => handleFilterChange('location', '')}
              size="small"
            />
          )}
          {filters.state && (
            <Chip
              label={filters.state}
              onDelete={() => handleFilterChange('state', '')}
              size="small"
            />
          )}
          {filters.country && filters.country !== 'US' && (
            <Chip
              label={countries.find((c) => c.value === filters.country)?.label}
              onDelete={() => handleFilterChange('country', 'US')}
              size="small"
            />
          )}
          {filters.brand && (
            <Chip
              label={`Brand: ${filters.brand}`}
              onDelete={() => handleFilterChange('brand', '')}
              size="small"
            />
          )}
          {filters.freeShipping && (
            <Chip
              icon={<LocalShipping fontSize="small" />}
              label="Free Shipping"
              onDelete={() => handleFilterChange('freeShipping', false)}
              size="small"
              color="success"
            />
          )}
          {filters.localPickup && (
            <Chip
              label="Local Pickup"
              onDelete={() => handleFilterChange('localPickup', false)}
              size="small"
            />
          )}
          {filters.freeReturns && (
            <Chip
              label="Free Returns"
              onDelete={() => handleFilterChange('freeReturns', false)}
              size="small"
              color="success"
            />
          )}
          {filters.acceptsOffers && (
            <Chip
              label="Accepts Offers"
              onDelete={() => handleFilterChange('acceptsOffers', false)}
              size="small"
            />
          )}
          {filters.topRatedSeller && (
            <Chip
              icon={<Verified fontSize="small" />}
              label="Top Rated Seller"
              onDelete={() => handleFilterChange('topRatedSeller', false)}
              size="small"
              color="primary"
            />
          )}
          {filters.minSellerRating && (
            <Chip
              icon={<Star fontSize="small" />}
              label={`${filters.minSellerRating}+ stars`}
              onDelete={() => handleFilterChange('minSellerRating', '')}
              size="small"
            />
          )}
          {filters.endingWithin && (
            <Chip
              label={`Ending in ${endingWithinOptions.find((e) => e.value === filters.endingWithin)?.label}`}
              onDelete={() => handleFilterChange('endingWithin', '')}
              size="small"
              color="warning"
            />
          )}
          {filters.featured && (
            <Chip
              label="Featured"
              onDelete={() => handleFilterChange('featured', false)}
              size="small"
              color="secondary"
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
              <Accordion defaultExpanded disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Category</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filters.category}
                      displayEmpty
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
                </AccordionDetails>
              </Accordion>

              <Divider />

              {/* Condition */}
              <Accordion defaultExpanded disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Condition</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filters.condition}
                      displayEmpty
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
                </AccordionDetails>
              </Accordion>

              <Divider />

              {/* Buying Format */}
              <Accordion defaultExpanded disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Buying Format</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filters.listingType}
                      displayEmpty
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
                </AccordionDetails>
              </Accordion>

              <Divider />

              {/* Price Range */}
              <Accordion defaultExpanded disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Price</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
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
                </AccordionDetails>
              </Accordion>

              <Divider />

              {/* Item Location */}
              <Accordion disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" />
                    <Typography variant="subtitle2">Item Location</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="City or ZIP code"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>State</InputLabel>
                    <Select
                      value={filters.state}
                      label="State"
                      onChange={(e) => handleFilterChange('state', e.target.value)}
                    >
                      <MenuItem value="">Any State</MenuItem>
                      {usStates.map((state) => (
                        <MenuItem key={state} value={state}>
                          {state}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Country</InputLabel>
                    <Select
                      value={filters.country}
                      label="Country"
                      onChange={(e) => handleFilterChange('country', e.target.value)}
                    >
                      {countries.map((country) => (
                        <MenuItem key={country.value} value={country.value}>
                          {country.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </AccordionDetails>
              </Accordion>

              <Divider />

              {/* Delivery Options */}
              <Accordion disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping fontSize="small" />
                    <Typography variant="subtitle2">Delivery Options</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.freeShipping}
                        onChange={(e) => handleFilterChange('freeShipping', e.target.checked)}
                      />
                    }
                    label="Free Shipping"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.localPickup}
                        onChange={(e) => handleFilterChange('localPickup', e.target.checked)}
                      />
                    }
                    label="Local Pickup"
                  />
                </AccordionDetails>
              </Accordion>

              <Divider />

              {/* Show Only */}
              <Accordion disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Show Only</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.freeReturns}
                        onChange={(e) => handleFilterChange('freeReturns', e.target.checked)}
                      />
                    }
                    label="Free Returns"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.acceptsOffers}
                        onChange={(e) => handleFilterChange('acceptsOffers', e.target.checked)}
                      />
                    }
                    label="Accepts Offers"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.featured}
                        onChange={(e) => handleFilterChange('featured', e.target.checked)}
                      />
                    }
                    label="Featured Items"
                  />
                </AccordionDetails>
              </Accordion>

              <Divider />

              {/* Seller */}
              <Accordion disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Verified fontSize="small" />
                    <Typography variant="subtitle2">Seller</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.topRatedSeller}
                        onChange={(e) => handleFilterChange('topRatedSeller', e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Verified fontSize="small" color="primary" />
                        Top Rated Seller
                      </Box>
                    }
                  />
                  <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                    <InputLabel>Minimum Seller Rating</InputLabel>
                    <Select
                      value={filters.minSellerRating}
                      label="Minimum Seller Rating"
                      onChange={(e) => handleFilterChange('minSellerRating', e.target.value)}
                    >
                      <MenuItem value="">Any Rating</MenuItem>
                      {sellerRatingOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={parseFloat(opt.value)} precision={0.5} size="small" readOnly />
                            <Typography variant="body2">& up</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </AccordionDetails>
              </Accordion>

              <Divider />

              {/* Ending Within (for Auctions) */}
              <Accordion disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Ending Within</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    For auction listings only
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filters.endingWithin}
                      displayEmpty
                      onChange={(e) => handleFilterChange('endingWithin', e.target.value)}
                    >
                      <MenuItem value="">Any time</MenuItem>
                      {endingWithinOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </AccordionDetails>
              </Accordion>

              <Divider />

              {/* Brand */}
              <Accordion disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Brand</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter brand name"
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                  />
                </AccordionDetails>
              </Accordion>
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
                onChange={(e, page) => {
                  setPagination((prev) => ({ ...prev, page }));
                  const newParams = new URLSearchParams(searchParams);
                  if (page > 1) {
                    newParams.set('page', page);
                  } else {
                    newParams.delete('page');
                  }
                  setSearchParams(newParams);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
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
