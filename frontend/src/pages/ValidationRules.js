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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Rule,
  Delete,
  Edit,
  Add,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const ValidationRules = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    route_path: '',
    http_method: '',
    validation_type: '',
  });
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [newRule, setNewRule] = useState({
    route_path: '',
    http_method: 'POST',
    field_name: '',
    field_location: 'body',
    validation_type: 'notEmpty',
    validation_params: '{}',
    error_message: '',
    is_active: true,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/validation-rules');
      setRules(res.data.rules || res.data || []);
    } catch (err) {
      setError('Failed to load validation rules');
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'info',
      POST: 'success',
      PUT: 'warning',
      DELETE: 'error',
    };
    return colors[method] || 'default';
  };

  const getLocationColor = (location) => {
    const colors = {
      body: 'primary',
      query: 'info',
      params: 'warning',
      headers: 'default',
    };
    return colors[location] || 'default';
  };

  const filteredRules = rules.filter((rule) => {
    if (filters.route_path && rule.route_path !== filters.route_path) return false;
    if (filters.http_method && rule.http_method !== filters.http_method) return false;
    if (filters.validation_type && rule.validation_type !== filters.validation_type) return false;
    return true;
  });

  const uniqueRoutePaths = [...new Set(rules.map((r) => r.route_path))].sort();

  const totalRules = rules.length;
  const activeRules = rules.filter((r) => r.is_active).length;
  const postRules = rules.filter((r) => r.http_method === 'POST').length;
  const getRules = rules.filter((r) => r.http_method === 'GET').length;

  const handleRowClick = (rule) => {
    setSelected(rule);
    setDetailOpen(true);
  };

  const handleEditOpen = () => {
    setEditData({
      route_path: selected.route_path || '',
      http_method: selected.http_method || 'POST',
      field_name: selected.field_name || '',
      field_location: selected.field_location || 'body',
      validation_type: selected.validation_type || 'notEmpty',
      validation_params: selected.validation_params
        ? (typeof selected.validation_params === 'string'
            ? selected.validation_params
            : JSON.stringify(selected.validation_params, null, 2))
        : '{}',
      error_message: selected.error_message || '',
      is_active: selected.is_active !== undefined ? selected.is_active : true,
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    try {
      const payload = {
        ...editData,
        validation_params:
          typeof editData.validation_params === 'string'
            ? JSON.parse(editData.validation_params)
            : editData.validation_params,
      };
      await api.put(`/validation-rules/${selected.id}`, payload);
      setEditOpen(false);
      setDetailOpen(false);
      setSelected(null);
      fetchRules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update validation rule');
    }
  };

  const handleCreateSave = async () => {
    try {
      const payload = {
        ...newRule,
        validation_params:
          typeof newRule.validation_params === 'string'
            ? JSON.parse(newRule.validation_params)
            : newRule.validation_params,
      };
      await api.post('/validation-rules', payload);
      setCreateOpen(false);
      setNewRule({
        route_path: '',
        http_method: 'POST',
        field_name: '',
        field_location: 'body',
        validation_type: 'notEmpty',
        validation_params: '{}',
        error_message: '',
        is_active: true,
      });
      fetchRules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create validation rule');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await api.delete(`/validation-rules/${selected.id}`);
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
      fetchRules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete validation rule');
    }
  };

  const formatValidationParams = (params) => {
    if (!params) return '{}';
    if (typeof params === 'string') {
      try {
        return JSON.stringify(JSON.parse(params), null, 2);
      } catch {
        return params;
      }
    }
    return JSON.stringify(params, null, 2);
  };

  const truncateText = (text, maxLength = 40) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Rule sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            Validation Rules
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateOpen(true)}
          >
            Create Rule
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchRules}>
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Rules
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalRules}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Rules
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {activeRules}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                POST Rules
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {postRules}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                GET Rules
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {getRules}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Route Path</InputLabel>
              <Select
                value={filters.route_path}
                label="Route Path"
                onChange={(e) => setFilters({ ...filters, route_path: e.target.value })}
              >
                <MenuItem value="">All Routes</MenuItem>
                {uniqueRoutePaths.map((path) => (
                  <MenuItem key={path} value={path}>
                    {path}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>HTTP Method</InputLabel>
              <Select
                value={filters.http_method}
                label="HTTP Method"
                onChange={(e) => setFilters({ ...filters, http_method: e.target.value })}
              >
                <MenuItem value="">All Methods</MenuItem>
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Validation Type</InputLabel>
              <Select
                value={filters.validation_type}
                label="Validation Type"
                onChange={(e) => setFilters({ ...filters, validation_type: e.target.value })}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="isEmail">isEmail</MenuItem>
                <MenuItem value="isLength">isLength</MenuItem>
                <MenuItem value="isStrongPassword">isStrongPassword</MenuItem>
                <MenuItem value="notEmpty">notEmpty</MenuItem>
                <MenuItem value="isFloat">isFloat</MenuItem>
                <MenuItem value="isInt">isInt</MenuItem>
                <MenuItem value="isUUID">isUUID</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Route Path</strong></TableCell>
              <TableCell><strong>Method</strong></TableCell>
              <TableCell><strong>Field Name</strong></TableCell>
              <TableCell><strong>Location</strong></TableCell>
              <TableCell><strong>Validation Type</strong></TableCell>
              <TableCell><strong>Error Message</strong></TableCell>
              <TableCell><strong>Active</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No validation rules found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRules.map((rule) => (
                <TableRow
                  key={rule.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(rule)}
                >
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {rule.route_path}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.http_method}
                      color={getMethodColor(rule.http_method)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{rule.field_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={rule.field_location}
                      color={getLocationColor(rule.field_location)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {rule.validation_type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {truncateText(rule.error_message)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={rule.is_active ? <CheckCircle /> : <Cancel />}
                      label={rule.is_active ? 'Active' : 'Inactive'}
                      color={rule.is_active ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {rule.created_at
                        ? new Date(rule.created_at).toLocaleDateString()
                        : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Rule color="primary" />
            Validation Rule Details
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  ID
                </Typography>
                <Typography variant="body1">{selected.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Route Path
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {selected.route_path}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  HTTP Method
                </Typography>
                <Chip
                  label={selected.http_method}
                  color={getMethodColor(selected.http_method)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Field Name
                </Typography>
                <Typography variant="body1">{selected.field_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Field Location
                </Typography>
                <Chip
                  label={selected.field_location}
                  color={getLocationColor(selected.field_location)}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Validation Type
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {selected.validation_type}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Error Message
                </Typography>
                <Typography variant="body1">{selected.error_message}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Validation Parameters
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography
                    variant="body2"
                    fontFamily="monospace"
                    component="pre"
                    sx={{ m: 0, whiteSpace: 'pre-wrap' }}
                  >
                    {formatValidationParams(selected.validation_params)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Active
                </Typography>
                <Chip
                  icon={selected.is_active ? <CheckCircle /> : <Cancel />}
                  label={selected.is_active ? 'Active' : 'Inactive'}
                  color={selected.is_active ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1">
                  {selected.created_at
                    ? new Date(selected.created_at).toLocaleString()
                    : '-'}
                </Typography>
              </Grid>
              {selected.updated_at && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Updated At
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selected.updated_at).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          <Button
            startIcon={<Edit />}
            variant="outlined"
            onClick={handleEditOpen}
          >
            Edit
          </Button>
          <Button
            startIcon={<Delete />}
            variant="outlined"
            color="error"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Validation Rule</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Route Path"
                value={editData.route_path || ''}
                onChange={(e) => setEditData({ ...editData, route_path: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>HTTP Method</InputLabel>
                <Select
                  value={editData.http_method || 'POST'}
                  label="HTTP Method"
                  onChange={(e) => setEditData({ ...editData, http_method: e.target.value })}
                >
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Name"
                value={editData.field_name || ''}
                onChange={(e) => setEditData({ ...editData, field_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Field Location</InputLabel>
                <Select
                  value={editData.field_location || 'body'}
                  label="Field Location"
                  onChange={(e) => setEditData({ ...editData, field_location: e.target.value })}
                >
                  <MenuItem value="body">body</MenuItem>
                  <MenuItem value="query">query</MenuItem>
                  <MenuItem value="params">params</MenuItem>
                  <MenuItem value="headers">headers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Validation Type</InputLabel>
                <Select
                  value={editData.validation_type || 'notEmpty'}
                  label="Validation Type"
                  onChange={(e) => setEditData({ ...editData, validation_type: e.target.value })}
                >
                  <MenuItem value="isEmail">isEmail</MenuItem>
                  <MenuItem value="isLength">isLength</MenuItem>
                  <MenuItem value="isStrongPassword">isStrongPassword</MenuItem>
                  <MenuItem value="notEmpty">notEmpty</MenuItem>
                  <MenuItem value="isFloat">isFloat</MenuItem>
                  <MenuItem value="isInt">isInt</MenuItem>
                  <MenuItem value="isUUID">isUUID</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editData.is_active !== undefined ? editData.is_active : true}
                    onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Error Message"
                value={editData.error_message || ''}
                onChange={(e) => setEditData({ ...editData, error_message: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Validation Parameters (JSON)"
                value={editData.validation_params || '{}'}
                onChange={(e) =>
                  setEditData({ ...editData, validation_params: e.target.value })
                }
                multiline
                rows={3}
                helperText="Enter valid JSON, e.g. {&quot;min&quot;: 1, &quot;max&quot;: 255}"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Validation Rule</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Route Path"
                value={newRule.route_path}
                onChange={(e) => setNewRule({ ...newRule, route_path: e.target.value })}
                placeholder="/api/products"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>HTTP Method</InputLabel>
                <Select
                  value={newRule.http_method}
                  label="HTTP Method"
                  onChange={(e) => setNewRule({ ...newRule, http_method: e.target.value })}
                >
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Name"
                value={newRule.field_name}
                onChange={(e) => setNewRule({ ...newRule, field_name: e.target.value })}
                placeholder="email"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Field Location</InputLabel>
                <Select
                  value={newRule.field_location}
                  label="Field Location"
                  onChange={(e) => setNewRule({ ...newRule, field_location: e.target.value })}
                >
                  <MenuItem value="body">body</MenuItem>
                  <MenuItem value="query">query</MenuItem>
                  <MenuItem value="params">params</MenuItem>
                  <MenuItem value="headers">headers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Validation Type</InputLabel>
                <Select
                  value={newRule.validation_type}
                  label="Validation Type"
                  onChange={(e) => setNewRule({ ...newRule, validation_type: e.target.value })}
                >
                  <MenuItem value="isEmail">isEmail</MenuItem>
                  <MenuItem value="isLength">isLength</MenuItem>
                  <MenuItem value="isStrongPassword">isStrongPassword</MenuItem>
                  <MenuItem value="notEmpty">notEmpty</MenuItem>
                  <MenuItem value="isFloat">isFloat</MenuItem>
                  <MenuItem value="isInt">isInt</MenuItem>
                  <MenuItem value="isUUID">isUUID</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newRule.is_active}
                    onChange={(e) => setNewRule({ ...newRule, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Error Message"
                value={newRule.error_message}
                onChange={(e) => setNewRule({ ...newRule, error_message: e.target.value })}
                multiline
                rows={2}
                placeholder="Please provide a valid email address"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Validation Parameters (JSON)"
                value={newRule.validation_params}
                onChange={(e) => setNewRule({ ...newRule, validation_params: e.target.value })}
                multiline
                rows={3}
                helperText="Enter valid JSON, e.g. {&quot;min&quot;: 1, &quot;max&quot;: 255}"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSave}>
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Validation Rule</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the validation rule for{' '}
            <strong>{selected?.field_name}</strong> on{' '}
            <strong>{selected?.route_path}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ValidationRules;
