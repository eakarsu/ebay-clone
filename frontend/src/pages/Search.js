import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Pagination,
  Button,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
  Badge,
} from '@mui/material';
import { FilterList, Close } from '@mui/icons-material';
import { productService } from '../services/api';
import ProductGrid from '../components/Products/ProductGrid';
import FilterSidebar from '../components/Search/FilterSidebar';

const Search = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Changed from 'md' to 'sm' to show filters on tablets
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [filterOptions, setFilterOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page')) || 1,
    pages: 1,
    total: 0,
  });

  // Parse URL params into filter state
  const parseFiltersFromURL = useCallback(() => {
    return {
      search: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      subcategory: searchParams.get('subcategory') || '',
      condition: searchParams.get('condition')?.split(',').filter(Boolean) || [],
      listingType: searchParams.get('listingType') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      brand: searchParams.get('brand')?.split(',').filter(Boolean) || [],
      color: searchParams.get('color')?.split(',').filter(Boolean) || [],
      size: searchParams.get('size')?.split(',').filter(Boolean) || [],
      freeShipping: searchParams.get('freeShipping') === 'true',
      localPickup: searchParams.get('localPickup') === 'true',
      acceptsOffers: searchParams.get('acceptsOffers') === 'true',
      freeReturns: searchParams.get('freeReturns') === 'true',
      sortBy: searchParams.get('sortBy') || (searchParams.get('q') ? 'relevance' : 'created_at'),
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(parseFiltersFromURL);

  // Sync filters with URL when URL changes (e.g., from header search)
  useEffect(() => {
    const newFilters = parseFiltersFromURL();
    setFilters(newFilters);
  }, [searchParams, parseFiltersFromURL]);

  // Build API params from filters
  const buildApiParams = useCallback((filterState, page = 1) => {
    const params = {
      page,
      limit: 20,
    };

    if (filterState.search) params.search = filterState.search;
    if (filterState.category) params.category = filterState.category;
    if (filterState.subcategory) params.subcategory = filterState.subcategory;
    if (filterState.condition?.length > 0) params.condition = filterState.condition.join(',');
    if (filterState.listingType) params.listingType = filterState.listingType;
    if (filterState.minPrice) params.minPrice = filterState.minPrice;
    if (filterState.maxPrice) params.maxPrice = filterState.maxPrice;
    if (filterState.brand?.length > 0) params.brand = filterState.brand.join(',');
    if (filterState.color?.length > 0) params.color = filterState.color.join(',');
    if (filterState.freeShipping) params.freeShipping = 'true';
    if (filterState.localPickup) params.localPickup = 'true';
    if (filterState.acceptsOffers) params.acceptsOffers = 'true';
    if (filterState.freeReturns) params.freeReturns = 'true';
    if (filterState.sortBy) params.sortBy = filterState.sortBy;
    if (filterState.sortOrder) params.sortOrder = filterState.sortOrder;

    return params;
  }, []);

  // Fetch filter options
  const fetchFilters = useCallback(async (filterState) => {
    setFiltersLoading(true);
    try {
      const params = buildApiParams(filterState);
      delete params.page;
      delete params.limit;
      delete params.sortBy;
      delete params.sortOrder;

      const response = await productService.getFilters(params);
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    } finally {
      setFiltersLoading(false);
    }
  }, [buildApiParams]);

  // Fetch products
  const fetchProducts = useCallback(async (filterState, page = 1) => {
    setLoading(true);
    try {
      const params = buildApiParams(filterState, page);
      const response = await productService.getAll(params);
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

  // Initial load and when filters change
  useEffect(() => {
    const currentPage = parseInt(searchParams.get('page')) || 1;
    fetchProducts(filters, currentPage);
    fetchFilters(filters);
  }, [filters, searchParams, fetchProducts, fetchFilters]);

  // Update URL params when filters change
  const updateURLParams = useCallback((newFilters) => {
    const newParams = new URLSearchParams();

    if (newFilters.search) newParams.set('q', newFilters.search);
    if (newFilters.category) newParams.set('category', newFilters.category);
    if (newFilters.subcategory) newParams.set('subcategory', newFilters.subcategory);
    if (newFilters.condition?.length > 0) newParams.set('condition', newFilters.condition.join(','));
    if (newFilters.listingType) newParams.set('listingType', newFilters.listingType);
    if (newFilters.minPrice) newParams.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) newParams.set('maxPrice', newFilters.maxPrice);
    if (newFilters.brand?.length > 0) newParams.set('brand', newFilters.brand.join(','));
    if (newFilters.color?.length > 0) newParams.set('color', newFilters.color.join(','));
    if (newFilters.size?.length > 0) newParams.set('size', newFilters.size.join(','));
    if (newFilters.freeShipping) newParams.set('freeShipping', 'true');
    if (newFilters.localPickup) newParams.set('localPickup', 'true');
    if (newFilters.acceptsOffers) newParams.set('acceptsOffers', 'true');
    if (newFilters.freeReturns) newParams.set('freeReturns', 'true');
    if (newFilters.sortBy && newFilters.sortBy !== 'created_at') newParams.set('sortBy', newFilters.sortBy);
    if (newFilters.sortOrder && newFilters.sortOrder !== 'desc') newParams.set('sortOrder', newFilters.sortOrder);

    setSearchParams(newParams);
  }, [setSearchParams]);

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      // Reset subcategory when category changes
      if (key === 'category') {
        newFilters.subcategory = '';
      }
      updateURLParams(newFilters);
      return newFilters;
    });
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [updateURLParams]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const clearedFilters = {
      search: filters.search, // Keep search term
      category: '',
      subcategory: '',
      condition: [],
      listingType: '',
      minPrice: '',
      maxPrice: '',
      brand: [],
      color: [],
      size: [],
      freeShipping: false,
      localPickup: false,
      acceptsOffers: false,
      freeReturns: false,
      sortBy: 'created_at',
      sortOrder: 'desc',
    };
    setFilters(clearedFilters);
    updateURLParams(clearedFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [filters.search, updateURLParams]);

  // Handle page change
  const handlePageChange = useCallback((event, page) => {
    setPagination((prev) => ({ ...prev, page }));
    const newParams = new URLSearchParams(searchParams);
    if (page > 1) {
      newParams.set('page', page);
    } else {
      newParams.delete('page');
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  // Handle sort change
  const handleSortChange = useCallback((event) => {
    const [sortBy, sortOrder] = event.target.value.split('-');
    handleFilterChange('sortBy', sortBy);
    handleFilterChange('sortOrder', sortOrder);
  }, [handleFilterChange]);

  // Sort options
  const sortOptions = [
    ...(filters.search ? [{ value: 'relevance-desc', label: 'Best match' }] : []),
    { value: 'created_at-desc', label: 'Newest first' },
    { value: 'created_at-asc', label: 'Oldest first' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'auction_end-asc', label: 'Ending soonest' },
    { value: 'view_count-desc', label: 'Most popular' },
  ];

  // Count active filters for mobile badge
  const activeFiltersCount = useMemo(() => {
    return [
      filters.category,
      filters.subcategory,
      filters.condition?.length > 0,
      filters.listingType,
      filters.minPrice,
      filters.maxPrice,
      filters.brand?.length > 0,
      filters.color?.length > 0,
      filters.freeShipping,
      filters.localPickup,
      filters.acceptsOffers,
      filters.freeReturns,
    ].filter(Boolean).length;
  }, [filters]);

  // Quick filter buttons
  const quickFilters = [
    {
      label: 'Auctions',
      icon: null,
      active: filters.listingType === 'auction',
      onClick: () =>
        handleFilterChange('listingType', filters.listingType === 'auction' ? '' : 'auction'),
    },
    {
      label: 'Buy It Now',
      icon: null,
      active: filters.listingType === 'buy_now',
      onClick: () =>
        handleFilterChange('listingType', filters.listingType === 'buy_now' ? '' : 'buy_now'),
    },
    {
      label: 'Free Shipping',
      icon: null,
      active: filters.freeShipping,
      onClick: () => handleFilterChange('freeShipping', !filters.freeShipping),
    },
    {
      label: 'Accepts Offers',
      icon: null,
      active: filters.acceptsOffers,
      onClick: () => handleFilterChange('acceptsOffers', !filters.acceptsOffers),
    },
  ];

  // Filter sidebar component for both desktop and mobile
  const filterSidebarContent = (
    <FilterSidebar
      filters={filters}
      filterOptions={filterOptions}
      selectedFilters={filters}
      onFilterChange={handleFilterChange}
      onClearFilters={handleClearFilters}
      loading={filtersLoading}
    />
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          {filters.search ? `Results for "${filters.search}"` : 'All Products'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {pagination.total.toLocaleString()} results
        </Typography>

        {/* Quick Filter Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filter Button - Shows on smaller screens */}
          {isMobile && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<FilterList />}
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ borderRadius: 2, mr: 1 }}
            >
              All Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          )}

          {quickFilters.map((filter) => (
            <Button
              key={filter.label}
              variant={filter.active ? 'contained' : 'outlined'}
              size="small"
              onClick={filter.onClick}
              sx={{ borderRadius: 5 }}
            >
              {filter.label}
            </Button>
          ))}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Filters sidebar - Desktop/Tablet */}
        {!isMobile && (
          <Grid item xs={12} sm={4} md={3} lg={2.5}>
            <Box sx={{ position: 'sticky', top: 80, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
              {filterSidebarContent}
            </Box>
          </Grid>
        )}

        {/* Products */}
        <Grid item xs={12} sm={isMobile ? 12 : 8} md={isMobile ? 12 : 9} lg={isMobile ? 12 : 9.5}>
          {/* Sort */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                label="Sort by"
                onChange={handleSortChange}
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
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: { width: '85%', maxWidth: 360 },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setMobileDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          {filterSidebarContent}
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                handleClearFilters();
                setMobileDrawerOpen(false);
              }}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setMobileDrawerOpen(false)}
            >
              Apply ({pagination.total} results)
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  );
};

export default Search;
