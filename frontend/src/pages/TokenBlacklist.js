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
  IconButton,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Block,
  Delete,
  CleaningServices,
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const TokenBlacklist = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tokensRes, statsRes] = await Promise.all([
        api.get('/token-blacklist'),
        api.get('/token-blacklist/stats'),
      ]);
      setTokens(tokensRes.data.tokens || tokensRes.data);
      setStats(statsRes.data.stats || statsRes.data);
    } catch (err) {
      setError('Failed to load blacklisted tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      await api.post('/token-blacklist/cleanup');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cleanup expired tokens');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await api.delete(`/token-blacklist/${selected.id}`);
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete token');
    }
  };

  const getReasonColor = (reason) => {
    const colors = {
      logout: 'info',
      password_change: 'warning',
      security_revoke: 'error',
      session_expired: 'default',
      admin_action: 'primary',
    };
    return colors[reason] || 'default';
  };

  const filteredTokens = filter
    ? tokens.filter((t) => t.reason === filter)
    : tokens;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Block sx={{ mr: 2, color: 'error.main', fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Token Blacklist
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CleaningServices />}
            onClick={handleCleanup}
          >
            Cleanup Expired
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Tokens
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Logouts
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {stats.logout_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Security Revokes
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {stats.revoked_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Expired
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                {stats.expired_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Filter by Reason</InputLabel>
          <Select
            value={filter}
            label="Filter by Reason"
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="">All Reasons</MenuItem>
            <MenuItem value="logout">Logout</MenuItem>
            <MenuItem value="password_change">Password Change</MenuItem>
            <MenuItem value="security_revoke">Security Revoke</MenuItem>
            <MenuItem value="session_expired">Session Expired</MenuItem>
            <MenuItem value="admin_action">Admin Action</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Tokens Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Token Hash</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Expires At</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTokens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No blacklisted tokens found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTokens.map((token) => (
                  <TableRow
                    key={token.id}
                    hover
                    onClick={() => {
                      setSelected(token);
                      setDetailOpen(true);
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography sx={{ fontFamily: 'monospace' }}>
                        {token.token_hash
                          ? token.token_hash.substring(0, 16) + '...'
                          : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{token.username}</TableCell>
                    <TableCell>
                      <Chip
                        label={token.reason?.replace(/_/g, ' ')}
                        size="small"
                        color={getReasonColor(token.reason)}
                      />
                    </TableCell>
                    <TableCell>{token.ip_address || 'N/A'}</TableCell>
                    <TableCell>
                      {token.expires_at
                        ? new Date(token.expires_at).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {token.created_at
                        ? new Date(token.created_at).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Token Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Token Hash
              </Typography>
              <Typography sx={{ fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>
                {selected.token_hash || 'N/A'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Username
              </Typography>
              <Typography sx={{ mb: 2 }}>
                {selected.username || 'N/A'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Reason
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={selected.reason?.replace(/_/g, ' ')}
                  color={getReasonColor(selected.reason)}
                />
              </Box>

              <Typography variant="subtitle2" color="text.secondary">
                IP Address
              </Typography>
              <Typography sx={{ mb: 2 }}>
                {selected.ip_address || 'N/A'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Expires At
              </Typography>
              <Typography sx={{ mb: 2 }}>
                {selected.expires_at
                  ? new Date(selected.expires_at).toLocaleString()
                  : 'N/A'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Created At
              </Typography>
              <Typography>
                {selected.created_at
                  ? new Date(selected.created_at).toLocaleString()
                  : 'N/A'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this token from the blacklist? This
            action cannot be undone.
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

export default TokenBlacklist;
