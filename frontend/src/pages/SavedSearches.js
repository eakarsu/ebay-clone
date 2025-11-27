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
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Delete,
  Edit,
  PlayArrow,
  Notifications,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SavedSearches = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searches, setSearches] = useState([]);
  const [error, setError] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState(null);

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const response = await api.get('/saved-searches');
      setSearches(response.data.savedSearches);
    } catch (err) {
      setError('Failed to load saved searches');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved search?')) {
      return;
    }

    try {
      await api.delete(`/saved-searches/${id}`);
      setSearches(searches.filter((s) => s.id !== id));
    } catch (err) {
      setError('Failed to delete saved search');
    }
  };

  const handleToggleAlerts = async (id, emailAlerts) => {
    try {
      await api.put(`/saved-searches/${id}`, { emailAlerts: !emailAlerts });
      setSearches(
        searches.map((s) =>
          s.id === id ? { ...s, emailAlerts: !emailAlerts } : s
        )
      );
    } catch (err) {
      setError('Failed to update alerts');
    }
  };

  const handleRunSearch = (search) => {
    const params = new URLSearchParams();
    if (search.searchQuery) params.set('q', search.searchQuery);
    if (search.categoryId) params.set('category', search.categoryId);
    if (search.minPrice) params.set('minPrice', search.minPrice);
    if (search.maxPrice) params.set('maxPrice', search.maxPrice);
    if (search.condition) params.set('condition', search.condition);
    navigate(`/search?${params.toString()}`);
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/saved-searches/${selectedSearch.id}`, {
        name: selectedSearch.name,
        alertFrequency: selectedSearch.alertFrequency,
      });
      setSearches(
        searches.map((s) =>
          s.id === selectedSearch.id ? selectedSearch : s
        )
      );
      setEditDialog(false);
    } catch (err) {
      setError('Failed to update saved search');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Search sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Saved Searches
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper>
        {searches.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Search sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No Saved Searches
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Save your searches to get notified when new items match your criteria.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/search')}>
              Start Searching
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Search Query</TableCell>
                  <TableCell>Filters</TableCell>
                  <TableCell>Email Alerts</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searches.map((search) => (
                  <TableRow key={search.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {search.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {search.searchQuery || '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {search.categoryName && (
                          <Chip label={search.categoryName} size="small" />
                        )}
                        {search.minPrice && (
                          <Chip label={`Min: $${search.minPrice}`} size="small" variant="outlined" />
                        )}
                        {search.maxPrice && (
                          <Chip label={`Max: $${search.maxPrice}`} size="small" variant="outlined" />
                        )}
                        {search.condition && (
                          <Chip label={search.condition} size="small" variant="outlined" />
                        )}
                        {search.freeShipping && (
                          <Chip label="Free Shipping" size="small" color="success" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={search.emailAlerts}
                        onChange={() => handleToggleAlerts(search.id, search.emailAlerts)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {search.alertFrequency}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleRunSearch(search)}
                        title="Run Search"
                      >
                        <PlayArrow />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedSearch(search);
                          setEditDialog(true);
                        }}
                        title="Edit"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(search.id)}
                        title="Delete"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Saved Search</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={selectedSearch?.name || ''}
            onChange={(e) =>
              setSelectedSearch({ ...selectedSearch, name: e.target.value })
            }
            sx={{ mt: 2, mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Alert Frequency</InputLabel>
            <Select
              value={selectedSearch?.alertFrequency || 'daily'}
              label="Alert Frequency"
              onChange={(e) =>
                setSelectedSearch({
                  ...selectedSearch,
                  alertFrequency: e.target.value,
                })
              }
            >
              <MenuItem value="instant">Instant</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SavedSearches;
