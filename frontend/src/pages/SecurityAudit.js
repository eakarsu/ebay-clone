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
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Security,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  Delete,
  Edit,
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const SecurityAudit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ event_type: '', severity: '' });
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
        api.get('/security-audit', { params: filters }),
        api.get('/security-audit/stats'),
      ]);
      setAuditLogs(logsRes.data?.auditLogs || logsRes.data?.logs || logsRes.data || []);
      setStats(statsRes.data?.stats || statsRes.data || {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load security audit data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/security-audit', { params: filters });
      setAuditLogs(res.data?.auditLogs || res.data?.logs || res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit logs');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
    setEditData({ resolved: selected?.resolved || false });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      await api.put(`/security-audit/${selected.id}`, editData);
      setEditOpen(false);
      setDetailOpen(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update audit log');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/security-audit/${selected.id}`);
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete audit log');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'info',
      low: 'default',
      medium: 'warning',
      high: 'error',
      critical: 'error',
    };
    return colors[severity] || 'default';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon fontSize="small" />;
      case 'high':
        return <Warning fontSize="small" />;
      case 'medium':
        return <Warning fontSize="small" />;
      case 'info':
        return <CheckCircle fontSize="small" />;
      default:
        return <Security fontSize="small" />;
    }
  };

  const eventTypes = [
    'helmet_header_set',
    'csp_violation',
    'xss_attempt',
    'brute_force_attempt',
    'unauthorized_access',
    'rate_limit_exceeded',
    'sql_injection_attempt',
    'token_expired',
  ];

  const severityLevels = ['info', 'low', 'medium', 'high', 'critical'];

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Security sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Security Audit Logs
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchData}
        >
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Security color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Events
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ErrorIcon color="error" />
                <Typography variant="subtitle2" color="text.secondary">
                  Critical Events
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {stats.critical_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Warning color="warning" />
                <Typography variant="subtitle2" color="text.secondary">
                  Unresolved
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {stats.unresolved_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircle color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Today's Events
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.today_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={filters.event_type}
              label="Event Type"
              onChange={(e) => handleFilterChange('event_type', e.target.value)}
            >
              <MenuItem value="">All Event Types</MenuItem>
              {eventTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              value={filters.severity}
              label="Severity"
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <MenuItem value="">All Severities</MenuItem>
              {severityLevels.map((level) => (
                <MenuItem key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {(filters.event_type || filters.severity) && (
            <Button
              size="small"
              onClick={() => setFilters({ event_type: '', severity: '' })}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* Audit Logs Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Source IP</TableCell>
                <TableCell>URL</TableCell>
                <TableCell align="center">Blocked</TableCell>
                <TableCell align="center">Resolved</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No audit logs found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelected(item);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getSeverityIcon(item.severity)}
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.event_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.severity}
                        size="small"
                        color={getSeverityColor(item.severity)}
                        variant={item.severity === 'critical' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.source_ip || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.request_url || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {item.blocked ? (
                        <Chip label="Yes" size="small" color="success" icon={<CheckCircle />} />
                      ) : (
                        <Chip label="No" size="small" color="error" icon={<ErrorIcon />} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {item.resolved ? (
                        <Chip label="Yes" size="small" color="success" icon={<CheckCircle />} />
                      ) : (
                        <Chip label="No" size="small" color="error" icon={<ErrorIcon />} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'N/A'}
                      </Typography>
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
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security color="primary" />
            <Typography variant="h6">Audit Log Detail</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Event Type
                  </Typography>
                  <Typography variant="body1">
                    {selected.event_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Severity
                  </Typography>
                  <Chip
                    label={selected.severity}
                    size="small"
                    color={getSeverityColor(selected.severity)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Source IP
                  </Typography>
                  <Typography variant="body1">{selected.source_ip || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    URL
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {selected.request_url || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Blocked
                  </Typography>
                  {selected.blocked ? (
                    <Chip label="Yes" size="small" color="success" icon={<CheckCircle />} />
                  ) : (
                    <Chip label="No" size="small" color="error" icon={<ErrorIcon />} />
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resolved
                  </Typography>
                  {selected.resolved ? (
                    <Chip label="Yes" size="small" color="success" icon={<CheckCircle />} />
                  ) : (
                    <Chip label="No" size="small" color="error" icon={<ErrorIcon />} />
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Header Name
                  </Typography>
                  <Typography variant="body1">{selected.header_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {selected.created_at
                      ? new Date(selected.created_at).toLocaleString()
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Agent
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {selected.user_agent || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Details
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}
                  >
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', m: 0 }}
                    >
                      {selected.details
                        ? typeof selected.details === 'string'
                          ? selected.details
                          : JSON.stringify(selected.details, null, 2)
                        : 'No details available'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<Edit />}
            onClick={handleEdit}
            color="primary"
          >
            Edit
          </Button>
          <Button
            startIcon={<Delete />}
            onClick={() => setDeleteOpen(true)}
            color="error"
          >
            Delete
          </Button>
          <Button
            onClick={() => {
              setDetailOpen(false);
              setSelected(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Audit Log</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Resolved</InputLabel>
              <Select
                value={editData.resolved ? 'true' : 'false'}
                label="Resolved"
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    resolved: e.target.value === 'true',
                  }))
                }
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Audit Log</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this audit log entry? This action cannot be undone.
          </Typography>
          {selected && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Event: {selected.event_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Severity: {selected.severity}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                IP: {selected.source_ip || 'N/A'}
              </Typography>
            </Box>
          )}
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

export default SecurityAudit;
