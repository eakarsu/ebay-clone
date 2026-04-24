import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  Button,
  TextField,
  Chip,
  Divider,
  Collapse,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  FilterList,
  Clear,
  LocalShipping,
  LocalOffer,
  Verified,
  Store,
  Search as SearchIcon,
} from '@mui/icons-material';

const FilterSection = ({
  title,
  icon,
  children,
  defaultExpanded = true,
  loading = false,
}) => {
  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="subtitle2" fontWeight={600}>
            {title}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {loading ? (
          <Box>
            <Skeleton height={30} />
            <Skeleton height={30} />
            <Skeleton height={30} />
          </Box>
        ) : (
          children
        )}
      </AccordionDetails>
    </Accordion>
  );
};

const CheckboxFilter = ({
  options,
  selectedValues,
  onChange,
  maxVisible = 5,
  showSeeAll = true,
  loading = false,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [seeAllDialogOpen, setSeeAllDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <Box>
        <Skeleton height={30} />
        <Skeleton height={30} />
        <Skeleton height={30} />
      </Box>
    );
  }

  if (!options || options.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No options available
      </Typography>
    );
  }

  const visibleOptions = showAll ? options : options.slice(0, maxVisible);
  const hasMore = options.length > maxVisible;

  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        (opt.label || opt.value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleToggle = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  return (
    <Box>
      {visibleOptions.map((option) => (
        <FormControlLabel
          key={option.value}
          control={
            <Checkbox
              checked={selectedValues.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              size="small"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{option.label || option.value}</Typography>
              <Typography variant="caption" color="text.secondary">
                ({option.count})
              </Typography>
            </Box>
          }
          sx={{ width: '100%', ml: 0, my: 0.25 }}
        />
      ))}
      {hasMore && showSeeAll && (
        <Button
          size="small"
          onClick={() => {
            if (options.length > 10) {
              setSeeAllDialogOpen(true);
            } else {
              setShowAll(!showAll);
            }
          }}
          sx={{ mt: 1, textTransform: 'none', color: 'primary.main' }}
        >
          {showAll ? '− Show less' : `+ See all (${options.length})`}
        </Button>
      )}

      {/* See All Dialog for large lists */}
      <Dialog
        open={seeAllDialogOpen}
        onClose={() => setSeeAllDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Options</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredOptions.map((option) => (
              <ListItem key={option.value} disablePadding>
                <ListItemButton
                  onClick={() => handleToggle(option.value)}
                  selected={selectedValues.includes(option.value)}
                >
                  <Checkbox
                    checked={selectedValues.includes(option.value)}
                    tabIndex={-1}
                    disableRipple
                    size="small"
                  />
                  <ListItemText
                    primary={option.label || option.value}
                    secondary={`${option.count} items`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSeeAllDialogOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const PriceRangeFilter = ({ min, max, currentMin, currentMax, onChange }) => {
  const [localMin, setLocalMin] = useState(currentMin || '');
  const [localMax, setLocalMax] = useState(currentMax || '');

  const handleApply = () => {
    onChange(localMin, localMax);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        <TextField
          size="small"
          placeholder="Min"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          type="number"
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          sx={{ flex: 1 }}
        />
        <Typography variant="body2" color="text.secondary">
          to
        </Typography>
        <TextField
          size="small"
          placeholder="Max"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          type="number"
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          sx={{ flex: 1 }}
        />
      </Box>
      <Button
        variant="outlined"
        size="small"
        onClick={handleApply}
        fullWidth
        sx={{ textTransform: 'none' }}
      >
        Apply Price
      </Button>
      {(min !== undefined || max !== undefined) && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Range: ${min?.toFixed(2) || '0'} - ${max?.toFixed(2) || '...'}
        </Typography>
      )}
    </Box>
  );
};

const FilterSidebar = ({
  filters,
  filterOptions,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showFilters, setShowFilters] = useState(!isMobile);

  // Count active filters
  const activeFiltersCount = Object.values(selectedFilters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'boolean') return v;
    return v !== '' && v !== undefined && v !== null;
  }).length;

  // Build applied filter chips
  const getAppliedFilterChips = () => {
    const chips = [];

    // Categories
    if (selectedFilters.category) {
      const cat = filterOptions?.categories?.find(
        (c) => c.slug === selectedFilters.category
      );
      chips.push({
        key: 'category',
        label: cat?.value || selectedFilters.category,
        onDelete: () => onFilterChange('category', ''),
      });
    }

    // Conditions
    if (selectedFilters.condition?.length > 0) {
      selectedFilters.condition.forEach((cond) => {
        const option = filterOptions?.conditions?.find((c) => c.value === cond);
        chips.push({
          key: `condition-${cond}`,
          label: option?.label || cond,
          onDelete: () =>
            onFilterChange(
              'condition',
              selectedFilters.condition.filter((c) => c !== cond)
            ),
        });
      });
    }

    // Brands
    if (selectedFilters.brand?.length > 0) {
      selectedFilters.brand.forEach((brand) => {
        chips.push({
          key: `brand-${brand}`,
          label: `Brand: ${brand}`,
          onDelete: () =>
            onFilterChange(
              'brand',
              selectedFilters.brand.filter((b) => b !== brand)
            ),
        });
      });
    }

    // Colors
    if (selectedFilters.color?.length > 0) {
      selectedFilters.color.forEach((color) => {
        chips.push({
          key: `color-${color}`,
          label: `Color: ${color}`,
          onDelete: () =>
            onFilterChange(
              'color',
              selectedFilters.color.filter((c) => c !== color)
            ),
        });
      });
    }

    // Price
    if (selectedFilters.minPrice || selectedFilters.maxPrice) {
      chips.push({
        key: 'price',
        label: `$${selectedFilters.minPrice || '0'} - $${selectedFilters.maxPrice || '...'}`,
        onDelete: () => {
          onFilterChange('minPrice', '');
          onFilterChange('maxPrice', '');
        },
      });
    }

    // Listing Type
    if (selectedFilters.listingType) {
      const option = filterOptions?.listingTypes?.find(
        (l) => l.value === selectedFilters.listingType
      );
      chips.push({
        key: 'listingType',
        label: option?.label || selectedFilters.listingType,
        onDelete: () => onFilterChange('listingType', ''),
      });
    }

    // Boolean filters
    if (selectedFilters.freeShipping) {
      chips.push({
        key: 'freeShipping',
        label: 'Free Shipping',
        color: 'success',
        onDelete: () => onFilterChange('freeShipping', false),
      });
    }

    if (selectedFilters.localPickup) {
      chips.push({
        key: 'localPickup',
        label: 'Local Pickup',
        onDelete: () => onFilterChange('localPickup', false),
      });
    }

    if (selectedFilters.acceptsOffers) {
      chips.push({
        key: 'acceptsOffers',
        label: 'Accepts Offers',
        onDelete: () => onFilterChange('acceptsOffers', false),
      });
    }

    if (selectedFilters.freeReturns) {
      chips.push({
        key: 'freeReturns',
        label: 'Free Returns',
        color: 'success',
        onDelete: () => onFilterChange('freeReturns', false),
      });
    }

    return chips;
  };

  const appliedChips = getAppliedFilterChips();

  return (
    <Paper sx={{ p: 2 }}>
      {/* Header */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {activeFiltersCount > 0 && (
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={(e) => {
                e.stopPropagation();
                onClearFilters();
              }}
              sx={{ textTransform: 'none' }}
            >
              Clear all
            </Button>
          )}
          {isMobile && (showFilters ? <ExpandLess /> : <ExpandMore />)}
        </Box>
      </Box>

      {/* Applied Filters Chips */}
      {appliedChips.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {appliedChips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              size="small"
              color={chip.color || 'default'}
              onDelete={chip.onDelete}
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
        </Box>
      )}

      <Collapse in={showFilters}>
        {/* Category Filter */}
        <FilterSection title="Category" loading={loading}>
          <CheckboxFilter
            options={filterOptions?.categories?.map((c) => ({
              value: c.slug,
              label: c.value,
              count: c.count,
            }))}
            selectedValues={selectedFilters.category ? [selectedFilters.category] : []}
            onChange={(values) => onFilterChange('category', values[values.length - 1] || '')}
            loading={loading}
            maxVisible={8}
          />
        </FilterSection>

        <Divider />

        {/* Subcategory Filter (only show if category is selected) */}
        {selectedFilters.category && filterOptions?.subcategories?.length > 0 && (
          <>
            <FilterSection title="Subcategory" loading={loading}>
              <CheckboxFilter
                options={filterOptions?.subcategories?.map((s) => ({
                  value: s.slug,
                  label: s.value,
                  count: s.count,
                }))}
                selectedValues={
                  selectedFilters.subcategory ? [selectedFilters.subcategory] : []
                }
                onChange={(values) =>
                  onFilterChange('subcategory', values[values.length - 1] || '')
                }
                loading={loading}
              />
            </FilterSection>
            <Divider />
          </>
        )}

        {/* Condition Filter */}
        <FilterSection title="Condition" loading={loading}>
          <CheckboxFilter
            options={filterOptions?.conditions}
            selectedValues={selectedFilters.condition || []}
            onChange={(values) => onFilterChange('condition', values)}
            loading={loading}
          />
        </FilterSection>

        <Divider />

        {/* Price Range Filter */}
        <FilterSection title="Price" loading={loading}>
          <PriceRangeFilter
            min={filterOptions?.priceRange?.min}
            max={filterOptions?.priceRange?.max}
            currentMin={selectedFilters.minPrice}
            currentMax={selectedFilters.maxPrice}
            onChange={(min, max) => {
              onFilterChange('minPrice', min);
              onFilterChange('maxPrice', max);
            }}
          />
        </FilterSection>

        <Divider />

        {/* Buying Format Filter */}
        <FilterSection title="Buying Format" loading={loading}>
          <CheckboxFilter
            options={filterOptions?.listingTypes}
            selectedValues={selectedFilters.listingType ? [selectedFilters.listingType] : []}
            onChange={(values) =>
              onFilterChange('listingType', values[values.length - 1] || '')
            }
            loading={loading}
          />
        </FilterSection>

        <Divider />

        {/* Brand Filter */}
        {filterOptions?.brands?.length > 0 && (
          <>
            <FilterSection title="Brand" loading={loading}>
              <CheckboxFilter
                options={filterOptions?.brands}
                selectedValues={selectedFilters.brand || []}
                onChange={(values) => onFilterChange('brand', values)}
                loading={loading}
                maxVisible={6}
              />
            </FilterSection>
            <Divider />
          </>
        )}

        {/* Color Filter */}
        {filterOptions?.colors?.length > 0 && (
          <>
            <FilterSection title="Color" loading={loading}>
              <CheckboxFilter
                options={filterOptions?.colors}
                selectedValues={selectedFilters.color || []}
                onChange={(values) => onFilterChange('color', values)}
                loading={loading}
                maxVisible={6}
              />
            </FilterSection>
            <Divider />
          </>
        )}

        {/* Size Filter */}
        {filterOptions?.sizes?.length > 0 && (
          <>
            <FilterSection title="Size" defaultExpanded={false} loading={loading}>
              <CheckboxFilter
                options={filterOptions?.sizes}
                selectedValues={selectedFilters.size || []}
                onChange={(values) => onFilterChange('size', values)}
                loading={loading}
                maxVisible={6}
              />
            </FilterSection>
            <Divider />
          </>
        )}

        {/* Shipping Options */}
        <FilterSection
          title="Delivery Options"
          icon={<LocalShipping fontSize="small" />}
          defaultExpanded={false}
          loading={loading}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedFilters.freeShipping || false}
                onChange={(e) => onFilterChange('freeShipping', e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Free Shipping</Typography>
                {filterOptions?.shippingOptions?.freeShipping > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    ({filterOptions.shippingOptions.freeShipping})
                  </Typography>
                )}
              </Box>
            }
            sx={{ width: '100%', ml: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedFilters.localPickup || false}
                onChange={(e) => onFilterChange('localPickup', e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Local Pickup</Typography>
                {filterOptions?.shippingOptions?.localPickup > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    ({filterOptions.shippingOptions.localPickup})
                  </Typography>
                )}
              </Box>
            }
            sx={{ width: '100%', ml: 0 }}
          />
        </FilterSection>

        <Divider />

        {/* Show Only Options */}
        <FilterSection
          title="Show Only"
          icon={<LocalOffer fontSize="small" />}
          defaultExpanded={false}
          loading={loading}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedFilters.acceptsOffers || false}
                onChange={(e) => onFilterChange('acceptsOffers', e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Accepts Offers</Typography>
                {filterOptions?.sellerOptions?.acceptsOffers > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    ({filterOptions.sellerOptions.acceptsOffers})
                  </Typography>
                )}
              </Box>
            }
            sx={{ width: '100%', ml: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedFilters.freeReturns || false}
                onChange={(e) => onFilterChange('freeReturns', e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Free Returns</Typography>
                {filterOptions?.sellerOptions?.freeReturns > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    ({filterOptions.sellerOptions.freeReturns})
                  </Typography>
                )}
              </Box>
            }
            sx={{ width: '100%', ml: 0 }}
          />
        </FilterSection>
      </Collapse>
    </Paper>
  );
};

export default FilterSidebar;
