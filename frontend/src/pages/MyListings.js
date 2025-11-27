import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Avatar,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Search,
  FilterList,
  MoreVert,
  Stop,
  Replay,
  Delete,
  CloudUpload,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const MyListings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Action menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', product: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchListings();
  }, [page, rowsPerPage, statusFilter, typeFilter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      let params = `?page=${page + 1}&limit=${rowsPerPage}`;
      if (statusFilter) params += `&status=${statusFilter}`;
      if (typeFilter) params += `&type=${typeFilter}`;
      if (search) params += `&search=${encodeURIComponent(search)}`;

      const response = await api.get(`/seller/products${params}`);
      setProducts(response.data.products || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchListings();
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      sold: 'info',
      ended: 'default',
      draft: 'warning',
    };
    return colors[status] || 'default';
  };

  const getTypeColor = (type) => {
    const colors = {
      auction: 'secondary',
      buy_now: 'primary',
      both: 'info',
    };
    return colors[type] || 'default';
  };

  const getTypeLabel = (type) => {
    const labels = {
      auction: 'Auction',
      buy_now: 'Fixed Price',
      both: 'Both',
    };
    return labels[type] || type;
  };

  // Menu handlers
  const handleMenuOpen = (event, product) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  // Action handlers
  const handleEndListing = async () => {
    if (!confirmDialog.product) return;
    try {
      await api.put(`/seller/products/${confirmDialog.product.id}/end`);
      setSnackbar({ open: true, message: 'Listing ended successfully', severity: 'success' });
      fetchListings();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to end listing', severity: 'error' });
    }
    setConfirmDialog({ open: false, type: '', product: null });
  };

  const handleRelistItem = async () => {
    if (!confirmDialog.product) return;
    try {
      const response = await api.post(`/seller/products/${confirmDialog.product.id}/relist`);
      setSnackbar({ open: true, message: 'Item relisted successfully', severity: 'success' });
      // Navigate to edit the new listing
      navigate(`/sell/edit/${response.data.newProductId}`);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to relist item', severity: 'error' });
    }
    setConfirmDialog({ open: false, type: '', product: null });
  };

  const handleDeleteListing = async () => {
    if (!confirmDialog.product) return;
    try {
      await api.delete(`/seller/products/${confirmDialog.product.id}`);
      setSnackbar({ open: true, message: 'Listing deleted successfully', severity: 'success' });
      fetchListings();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to delete listing', severity: 'error' });
    }
    setConfirmDialog({ open: false, type: '', product: null });
  };

  const openConfirmDialog = (type, product) => {
    handleMenuClose();
    setConfirmDialog({ open: true, type, product });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          My Listings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={async () => {
              try {
                const response = await api.get('/seller/bulk-upload/sample-data', {
                  responseType: 'blob',
                });
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'sample_products.csv');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                setSnackbar({ open: true, message: 'Sample data downloaded! 18+ products with all types.', severity: 'success' });
              } catch (err) {
                setSnackbar({ open: true, message: 'Failed to download sample data', severity: 'error' });
              }
            }}
          >
            Sample Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => navigate('/bulk-upload')}
          >
            Bulk Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/sell')}
          >
            Create New Listing
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
            <TextField
              size="small"
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <Button type="submit" variant="outlined" size="small">
              Search
            </Button>
          </form>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="ended">Ended</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="buy_now">Fixed Price</MenuItem>
              <MenuItem value="auction">Auction</MenuItem>
              <MenuItem value="both">Both</MenuItem>
            </Select>
          </FormControl>

          {(statusFilter || typeFilter || search) && (
            <Button
              size="small"
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setSearch('');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* Listings Table */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No listings found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {statusFilter || typeFilter || search
                ? 'Try adjusting your filters'
                : "You haven't created any listings yet"}
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/sell')}>
              Create Your First Listing
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Bids</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product.id}
                      hover
                      onClick={() => navigate(`/product/${product.id}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            variant="rounded"
                            src={product.imageUrl}
                            sx={{ width: 50, height: 50 }}
                          >
                            {product.title?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                              {product.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.categoryName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${product.currentBid || product.price || 0}
                        </Typography>
                        {product.listingType === 'auction' && product.currentBid && (
                          <Typography variant="caption" color="text.secondary">
                            Current bid
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.status}
                          size="small"
                          color={getStatusColor(product.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTypeLabel(product.listingType)}
                          size="small"
                          variant="outlined"
                          color={getTypeColor(product.listingType)}
                        />
                      </TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>{product.bidCount || 0}</TableCell>
                      <TableCell>
                        {new Date(product.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/sell/edit/${product.id}`);
                          }}
                          title="Edit listing"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, product)}
                          title="More actions"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedProduct?.status === 'active' && (
          <MenuItem onClick={() => openConfirmDialog('end', selectedProduct)}>
            <Stop sx={{ mr: 1 }} fontSize="small" />
            End Listing
          </MenuItem>
        )}
        {(selectedProduct?.status === 'ended' || selectedProduct?.status === 'sold') && (
          <MenuItem onClick={() => openConfirmDialog('relist', selectedProduct)}>
            <Replay sx={{ mr: 1 }} fontSize="small" />
            Relist Item
          </MenuItem>
        )}
        <MenuItem
          onClick={() => openConfirmDialog('delete', selectedProduct)}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete Listing
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: '', product: null })}
      >
        <DialogTitle>
          {confirmDialog.type === 'end' && 'End Listing Early?'}
          {confirmDialog.type === 'relist' && 'Relist This Item?'}
          {confirmDialog.type === 'delete' && 'Delete Listing?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.type === 'end' &&
              `Are you sure you want to end "${confirmDialog.product?.title}" early? This action cannot be undone.`}
            {confirmDialog.type === 'relist' &&
              `This will create a new listing based on "${confirmDialog.product?.title}". You can edit it before publishing.`}
            {confirmDialog.type === 'delete' &&
              `Are you sure you want to permanently delete "${confirmDialog.product?.title}"? This action cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, type: '', product: null })}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (confirmDialog.type === 'end') handleEndListing();
              else if (confirmDialog.type === 'relist') handleRelistItem();
              else if (confirmDialog.type === 'delete') handleDeleteListing();
            }}
            color={confirmDialog.type === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            {confirmDialog.type === 'end' && 'End Listing'}
            {confirmDialog.type === 'relist' && 'Relist'}
            {confirmDialog.type === 'delete' && 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MyListings;
