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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  BugReport,
  Delete,
  Edit,
  CheckCircle,
  Warning,
  Cancel,
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const ErrorLogs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorLogs, setErrorLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ error_type: '', severity: '' });
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        api.get('/error-logs', { params: filters }),
        api.get('/error-logs/stats'),
      ]);
      setErrorLogs(logsRes.data.errorLogs || logsRes.data || []);
      setStats(statsRes.data || {});
    } catch (err) {
      setError('Failed to load error logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/error-logs', { params: filters });
      setErrorLogs(res.data.errorLogs || res.data || []);
    } catch (err) {
      setError('Failed to load error logs');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = { info: 'info', warning: 'warning', error: 'error', critical: 'error' };
    return colors[severity] || 'default';
  };

  const handleEdit = () => {
    setEditData({ is_resolved: selected?.is_resolved || false, severity: selected?.severity || 'error' });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      await api.put(`/error-logs/${selected.id}`, editData);
      setEditOpen(false);
      setDetailOpen(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update error log');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/error-logs/${selected.id}`);
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete error log');
    }
  };

  const errorTypes = ['TypeError', 'NetworkError', 'ReferenceError', 'ChunkLoadError', 'SyntaxError', 'RangeError', 'UnhandledRejection', 'SecurityError', 'AbortError', 'QuotaExceededError', 'Error'];
  const severities = ['info', 'warning', 'error', 'critical'];

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <BugReport sx={{ fontSize: 32, color: 'error.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Error Logs
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>
          Refresh
        </Button>
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
              <Typography color="text.secondary" gutterBottom>Total Errors</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Critical</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>{stats.critical_count || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Unresolved</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>{stats.unresolved_count || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Today</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.today_count || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Error Type</InputLabel>
            <Select value={filters.error_type} label="Error Type" onChange={(e) => setFilters({ ...filters, error_type: e.target.value })}>
              <MenuItem value="">All Types</MenuItem>
              {errorTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Severity</InputLabel>
            <Select value={filters.severity} label="Severity" onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
              <MenuItem value="">All Severities</MenuItem>
              {severities.map((s) => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
            </Select>
          </FormControl>
          {(filters.error_type || filters.severity) && (
            <Button size="small" onClick={() => setFilters({ error_type: '', severity: '' })}>Clear Filters</Button>
          )}
        </Box>
      </Paper>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Error Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Component</TableCell>
                <TableCell>Page URL</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell align="center">Resolved</TableCell>
                <TableCell align="center">Count</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {errorLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No error logs found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                errorLogs.map((log) => (
                  <TableRow key={log.id} hover sx={{ cursor: 'pointer' }} onClick={() => { setSelected(log); setDetailOpen(true); }}>
                    <TableCell>
                      <Chip label={log.error_type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{log.error_message}</Typography>
                    </TableCell>
                    <TableCell>{log.component_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>{log.page_url || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={log.severity} size="small" color={getSeverityColor(log.severity)} variant={log.severity === 'critical' ? 'filled' : 'outlined'} />
                    </TableCell>
                    <TableCell align="center">
                      {log.is_resolved ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                    </TableCell>
                    <TableCell align="center">{log.occurrence_count || 1}</TableCell>
                    <TableCell>{log.created_at ? new Date(log.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setSelected(null); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReport color="error" />
            Error Log Detail
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Error Type</Typography>
                  <Chip label={selected.error_type} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Severity</Typography>
                  <Chip label={selected.severity} size="small" color={getSeverityColor(selected.severity)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Component</Typography>
                  <Typography>{selected.component_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Page URL</Typography>
                  <Typography sx={{ wordBreak: 'break-all' }}>{selected.page_url || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Resolved</Typography>
                  {selected.is_resolved ? <Chip label="Yes" size="small" color="success" /> : <Chip label="No" size="small" color="error" />}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Occurrence Count</Typography>
                  <Typography>{selected.occurrence_count || 1}</Typography>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Error Message</Typography>
                <Typography>{selected.error_message}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Stack Trace</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 250, overflow: 'auto' }}>
                  <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', m: 0 }}>
                    {selected.error_stack || 'No stack trace available'}
                  </Typography>
                </Paper>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Browser Info</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', m: 0 }}>
                    {selected.browser_info ? JSON.stringify(selected.browser_info, null, 2) : 'No browser info'}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<Edit />} onClick={handleEdit}>Edit</Button>
          <Button startIcon={<Delete />} color="error" onClick={() => setDeleteOpen(true)}>Delete</Button>
          <Button onClick={() => { setDetailOpen(false); setSelected(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Error Log</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Resolved</InputLabel>
              <Select value={editData.is_resolved ? 'true' : 'false'} label="Resolved" onChange={(e) => setEditData({ ...editData, is_resolved: e.target.value === 'true' })}>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select value={editData.severity || ''} label="Severity" onChange={(e) => setEditData({ ...editData, severity: e.target.value })}>
                {severities.map((s) => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Error Log</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this error log? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ErrorLogs;
