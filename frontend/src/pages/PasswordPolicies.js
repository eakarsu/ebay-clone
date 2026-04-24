import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Lock,
  Delete,
  Edit,
  Add,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const defaultNewPolicy = {
  policy_name: '',
  description: '',
  min_length: 8,
  max_length: 128,
  require_uppercase: true,
  require_lowercase: true,
  require_number: true,
  require_special_char: false,
  max_age_days: 90,
  password_history_count: 5,
  applies_to: 'all',
  is_active: true,
};

const PasswordPolicies = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState([]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [newPolicy, setNewPolicy] = useState({ ...defaultNewPolicy });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/password-policies');
      setPolicies(response.data?.policies || response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load password policies');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (policy) => {
    setSelected(policy);
    setDetailOpen(true);
  };

  const handleEditOpen = () => {
    setEditData({ ...selected });
    setDetailOpen(false);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/password-policies/${editData.id}`, editData);
      setEditOpen(false);
      setEditData({});
      fetchPolicies();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update policy');
    }
  };

  const handleDeleteOpen = () => {
    setDetailOpen(false);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/password-policies/${selected.id}`);
      setDeleteOpen(false);
      setSelected(null);
      fetchPolicies();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete policy');
    }
  };

  const handleCreateSave = async () => {
    try {
      await api.post('/password-policies', newPolicy);
      setCreateOpen(false);
      setNewPolicy({ ...defaultNewPolicy });
      fetchPolicies();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create policy');
    }
  };

  const getAppliesToColor = (appliesTo) => {
    const colors = {
      all: 'primary',
      admin: 'error',
      seller: 'warning',
      buyer: 'info',
    };
    return colors[appliesTo] || 'default';
  };

  // Stats calculations
  const totalPolicies = policies.length;
  const activePolicies = policies.filter((p) => p.is_active).length;
  const adminPolicies = policies.filter((p) => p.applies_to === 'admin').length;
  const averageMinLength =
    policies.length > 0
      ? Math.round(policies.reduce((sum, p) => sum + (parseInt(p.min_length, 10) || 0), 0) / policies.length)
      : 0;

  const statsCards = [
    { label: 'Total Policies', value: totalPolicies, color: 'primary.main' },
    { label: 'Active Policies', value: activePolicies, color: 'success.main' },
    { label: 'Admin Policies', value: adminPolicies, color: 'error.main' },
    { label: 'Average Min Length', value: averageMinLength, color: 'warning.main' },
  ];

  const renderBooleanChip = (label, value) => (
    <Chip
      label={label}
      size="small"
      icon={value ? <CheckCircle /> : <Cancel />}
      color={value ? 'success' : 'default'}
      variant={value ? 'filled' : 'outlined'}
      sx={{ mr: 0.5, mb: 0.5 }}
    />
  );

  const renderPolicyForm = (data, setData) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
      <TextField
        fullWidth
        label="Policy Name"
        value={data.policy_name || ''}
        onChange={(e) => setData({ ...data, policy_name: e.target.value })}
        required
      />
      <TextField
        fullWidth
        label="Description"
        value={data.description || ''}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        multiline
        rows={2}
      />
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Min Length"
            type="number"
            value={data.min_length ?? ''}
            onChange={(e) => setData({ ...data, min_length: parseInt(e.target.value, 10) || 0 })}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Max Length"
            type="number"
            value={data.max_length ?? ''}
            onChange={(e) => setData({ ...data, max_length: parseInt(e.target.value, 10) || 0 })}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Max Age (days)"
            type="number"
            value={data.max_age_days ?? ''}
            onChange={(e) => setData({ ...data, max_age_days: parseInt(e.target.value, 10) || 0 })}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Password History Count"
            type="number"
            value={data.password_history_count ?? ''}
            onChange={(e) => setData({ ...data, password_history_count: parseInt(e.target.value, 10) || 0 })}
          />
        </Grid>
      </Grid>
      <FormControlLabel
        control={
          <Switch
            checked={!!data.require_uppercase}
            onChange={(e) => setData({ ...data, require_uppercase: e.target.checked })}
          />
        }
        label="Require Uppercase"
      />
      <FormControlLabel
        control={
          <Switch
            checked={!!data.require_lowercase}
            onChange={(e) => setData({ ...data, require_lowercase: e.target.checked })}
          />
        }
        label="Require Lowercase"
      />
      <FormControlLabel
        control={
          <Switch
            checked={!!data.require_number}
            onChange={(e) => setData({ ...data, require_number: e.target.checked })}
          />
        }
        label="Require Number"
      />
      <FormControlLabel
        control={
          <Switch
            checked={!!data.require_special_char}
            onChange={(e) => setData({ ...data, require_special_char: e.target.checked })}
          />
        }
        label="Require Special Character"
      />
      <FormControl fullWidth>
        <InputLabel>Applies To</InputLabel>
        <Select
          value={data.applies_to || 'all'}
          label="Applies To"
          onChange={(e) => setData({ ...data, applies_to: e.target.value })}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="seller">Seller</MenuItem>
          <MenuItem value="buyer">Buyer</MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Switch
            checked={!!data.is_active}
            onChange={(e) => setData({ ...data, is_active: e.target.checked })}
          />
        }
        label="Active"
      />
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Lock sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Password Policies
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchPolicies}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            Add Policy
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Policy Cards Grid */}
      {policies.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No password policies found.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {policies.map((policy) => (
            <Grid item xs={12} sm={6} md={4} key={policy.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => handleCardClick(policy)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {policy.policy_name}
                    </Typography>
                    <Chip
                      label={policy.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={policy.is_active ? 'success' : 'default'}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {policy.description || 'No description'}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={policy.applies_to || 'all'}
                      size="small"
                      color={getAppliesToColor(policy.applies_to)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Min Length
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {policy.min_length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Max Age (days)
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {policy.max_age_days}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    {renderBooleanChip('Uppercase', policy.require_uppercase)}
                    {renderBooleanChip('Lowercase', policy.require_lowercase)}
                    {renderBooleanChip('Number', policy.require_number)}
                    {renderBooleanChip('Special Char', policy.require_special_char)}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock color="primary" />
            {selected?.policy_name}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {selected.description || 'No description'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={selected.applies_to || 'all'}
                  color={getAppliesToColor(selected.applies_to)}
                  sx={{ textTransform: 'capitalize' }}
                />
                <Chip
                  label={selected.is_active ? 'Active' : 'Inactive'}
                  color={selected.is_active ? 'success' : 'default'}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Min Length</Typography>
                  <Typography variant="h6">{selected.min_length}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Max Length</Typography>
                  <Typography variant="h6">{selected.max_length}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Max Age (days)</Typography>
                  <Typography variant="h6">{selected.max_age_days}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Password History Count</Typography>
                  <Typography variant="h6">{selected.password_history_count}</Typography>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Requirements</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  {renderBooleanChip('Uppercase', selected.require_uppercase)}
                  {renderBooleanChip('Lowercase', selected.require_lowercase)}
                  {renderBooleanChip('Number', selected.require_number)}
                  {renderBooleanChip('Special Char', selected.require_special_char)}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<Edit />} onClick={handleEditOpen}>
            Edit
          </Button>
          <Button color="error" startIcon={<Delete />} onClick={handleDeleteOpen}>
            Delete
          </Button>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Password Policy</DialogTitle>
        <DialogContent>
          {renderPolicyForm(editData, setEditData)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Password Policy</DialogTitle>
        <DialogContent>
          {renderPolicyForm(newPolicy, setNewPolicy)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateOpen(false); setNewPolicy({ ...defaultNewPolicy }); }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateSave} disabled={!newPolicy.policy_name}>
            Create Policy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Password Policy</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the policy <strong>{selected?.policy_name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PasswordPolicies;
