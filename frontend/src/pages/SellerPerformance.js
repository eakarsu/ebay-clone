import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Warning,
  CheckCircle,
  Speed,
  LocalShipping,
  ThumbUp,
  Error,
  Info,
  EmojiEvents,
  Verified,
  Refresh,
  Gavel,
  Close,
  Timeline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { sellerPerformanceService } from '../services/api';

const SellerPerformance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [performance, setPerformance] = useState(null);
  const [defects, setDefects] = useState([]);
  const [benefits, setBenefits] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [appealDialog, setAppealDialog] = useState({ open: false, defect: null });
  const [appealReason, setAppealReason] = useState('');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [perfRes, defectsRes, benefitsRes, historyRes] = await Promise.all([
        sellerPerformanceService.getMyPerformance(),
        sellerPerformanceService.getDefects(),
        sellerPerformanceService.getBenefits(),
        sellerPerformanceService.getHistory()
      ]);

      setPerformance(perfRes.data);
      setDefects(defectsRes.data?.defects || []);
      setBenefits(benefitsRes.data);
      setHistory(historyRes.data?.history || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePerformance = async () => {
    try {
      setCalculating(true);
      const response = await sellerPerformanceService.calculatePerformance();
      setPerformance(response.data.performance);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate performance');
    } finally {
      setCalculating(false);
    }
  };

  const handleAppealSubmit = async () => {
    if (!appealReason || appealReason.length < 20) {
      setError('Appeal reason must be at least 20 characters');
      return;
    }

    try {
      await sellerPerformanceService.appealDefect(appealDialog.defect.id, { reason: appealReason });
      setAppealDialog({ open: false, defect: null });
      setAppealReason('');
      fetchAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit appeal');
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      below_standard: 'error',
      standard: 'default',
      above_standard: 'warning',
      top_rated: 'success',
      top_rated_plus: 'primary',
    };
    return colors[level] || 'default';
  };

  const getLevelIcon = (level) => {
    const icons = {
      below_standard: <Warning color="error" />,
      standard: <CheckCircle color="action" />,
      above_standard: <CheckCircle color="warning" />,
      top_rated: <Star color="success" />,
      top_rated_plus: <EmojiEvents color="primary" />,
    };
    return icons[level] || <Info />;
  };

  const getLevelName = (level) => {
    const names = {
      below_standard: 'Below Standard',
      standard: 'Standard',
      above_standard: 'Above Standard',
      top_rated: 'Top Rated Seller',
      top_rated_plus: 'Top Rated Plus',
    };
    return names[level] || 'Standard';
  };

  const getMetricStatus = (rate, threshold) => {
    if (rate <= threshold) return { color: 'success', icon: <CheckCircle color="success" /> };
    if (rate <= threshold * 2) return { color: 'warning', icon: <Warning color="warning" /> };
    return { color: 'error', icon: <Error color="error" /> };
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Seller Performance Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={calculating ? <CircularProgress size={20} /> : <Refresh />}
          onClick={handleCalculatePerformance}
          disabled={calculating}
        >
          Recalculate
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Seller Level Card */}
      <Paper sx={{ p: 4, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getLevelIcon(performance?.seller_level)}
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {getLevelName(performance?.seller_level)}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Based on your last 12 months of selling activity
                </Typography>
                {performance?.next_evaluation_date && (
                  <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                    Next evaluation: {new Date(performance.next_evaluation_date).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {performance?.total_transactions?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2">Total Sales</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {parseFloat(performance?.feedback_score || 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">Feedback Score</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {performance?.activeListings || 0}
                  </Typography>
                  <Typography variant="body2">Active Listings</Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Performance Metrics" />
        <Tab label={`Defects (${defects.length})`} />
        <Tab label="Benefits" />
        <Tab label="History" />
      </Tabs>

      {/* Performance Metrics Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Performance Metrics
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="center">Your Rate</TableCell>
                      <TableCell align="center">Target</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Error color="action" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Defect Rate
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {performance?.defect_count || 0} defects in period
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {(parseFloat(performance?.defect_rate || 0) * 100).toFixed(2)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">&lt; 2%</TableCell>
                      <TableCell align="center">
                        {getMetricStatus(parseFloat(performance?.defect_rate || 0) * 100, 2).icon}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocalShipping color="action" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Late Shipment Rate
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {performance?.late_shipment_count || 0} late shipments
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {(parseFloat(performance?.late_shipment_rate || 0) * 100).toFixed(2)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">&lt; 3%</TableCell>
                      <TableCell align="center">
                        {getMetricStatus(parseFloat(performance?.late_shipment_rate || 0) * 100, 3).icon}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ThumbUp color="action" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Positive Feedback
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {performance?.positive_feedback_count || 0} positive / {performance?.negative_feedback_count || 0} negative
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {parseFloat(performance?.feedback_score || 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">&gt; 95%</TableCell>
                      <TableCell align="center">
                        {(performance?.feedback_score || 100) >= 95 ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Warning color="warning" />
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Speed color="action" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Tracking Upload Rate
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {performance?.tracking_uploaded_count || 0} orders with tracking
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {(parseFloat(performance?.tracking_uploaded_rate || 0) * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">&gt; 95%</TableCell>
                      <TableCell align="center">
                        {(performance?.tracking_uploaded_rate || 0) >= 0.95 ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Warning color="warning" />
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Seller Levels */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Seller Levels
              </Typography>
              <Grid container spacing={2}>
                {[
                  { level: 'below_standard', name: 'Below Standard', desc: 'Defect rate >2%. Reduced search visibility.', color: 'error.light' },
                  { level: 'standard', name: 'Standard', desc: 'Meeting minimum requirements.', color: 'grey.200' },
                  { level: 'above_standard', name: 'Above Standard', desc: 'Defect rate <2%. Normal visibility.', color: 'warning.light' },
                  { level: 'top_rated', name: 'Top Rated', desc: 'Defect rate <0.5%, 100+ sales. Fee discounts.', color: 'success.light' },
                  { level: 'top_rated_plus', name: 'Top Rated Plus', desc: 'All TRS requirements + same-day handling.', color: 'primary.light' },
                ].map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.level}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: item.color,
                        border: performance?.seller_level === item.level ? 3 : 0,
                        borderColor: 'primary.main',
                        height: '100%',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getLevelIcon(item.level)}
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {item.name}
                        </Typography>
                        {performance?.seller_level === item.level && (
                          <Chip label="Current" size="small" color="primary" />
                        )}
                      </Box>
                      <Typography variant="body2">{item.desc}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Tips */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Tips for Improvement
              </Typography>
              <List dense>
                {[
                  'Ship items within 1 business day',
                  'Upload tracking numbers immediately',
                  'Respond to buyer messages within 24 hours',
                  'Include accurate item descriptions and photos',
                  'Process returns promptly',
                ].map((tip, idx) => (
                  <ListItem key={idx} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Info color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={tip} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Defects Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Defects
          </Typography>
          {defects.length === 0 ? (
            <Alert severity="success">
              Great job! You have no defects in the evaluation period.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {defects.map((defect) => (
                    <TableRow key={defect.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {defect.defect_type?.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {defect.description}
                        </Typography>
                      </TableCell>
                      <TableCell>{defect.order_number || 'N/A'}</TableCell>
                      <TableCell>{new Date(defect.defect_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={defect.appeal_status || 'none'}
                          size="small"
                          color={defect.appeal_status === 'approved' ? 'success' : defect.appeal_status === 'pending' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {defect.appeal_status !== 'approved' && defect.appeal_status !== 'pending' && (
                          <Button
                            size="small"
                            startIcon={<Gavel />}
                            onClick={() => setAppealDialog({ open: true, defect })}
                          >
                            Appeal
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Benefits Tab */}
      {activeTab === 2 && benefits && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Your Benefits ({getLevelName(benefits.currentLevel)})
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemIcon><CheckCircle color={benefits.benefits.fvfDiscount > 0 ? 'success' : 'disabled'} /></ListItemIcon>
                  <ListItemText
                    primary="Final Value Fee Discount"
                    secondary={`${benefits.benefits.fvfDiscount}% off`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color={benefits.benefits.promotedDiscount > 0 ? 'success' : 'disabled'} /></ListItemIcon>
                  <ListItemText
                    primary="Promoted Listings Discount"
                    secondary={`${benefits.benefits.promotedDiscount}% off`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color={benefits.benefits.topRatedBadge ? 'success' : 'disabled'} /></ListItemIcon>
                  <ListItemText
                    primary="Top Rated Badge"
                    secondary={benefits.benefits.topRatedBadge ? 'Displayed on your listings' : 'Not available'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color={benefits.benefits.prioritySupport ? 'success' : 'disabled'} /></ListItemIcon>
                  <ListItemText
                    primary="Priority Support"
                    secondary={benefits.benefits.prioritySupport ? 'Access to priority customer support' : 'Not available'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color={benefits.benefits.searchBoost > 0 ? 'success' : 'disabled'} /></ListItemIcon>
                  <ListItemText
                    primary="Search Boost"
                    secondary={`${benefits.benefits.searchBoost}% increased visibility`}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                All Seller Levels
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Level</TableCell>
                      <TableCell align="center">FVF</TableCell>
                      <TableCell align="center">Promo</TableCell>
                      <TableCell align="center">Badge</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {benefits.allLevels?.map((level) => (
                      <TableRow
                        key={level.level}
                        sx={{ bgcolor: level.level === benefits.currentLevel ? 'action.selected' : 'inherit' }}
                      >
                        <TableCell>{getLevelName(level.level)}</TableCell>
                        <TableCell align="center">{level.fvfDiscount}%</TableCell>
                        <TableCell align="center">{level.promotedDiscount}%</TableCell>
                        <TableCell align="center">{level.topRatedBadge ? <Check color="success" /> : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* History Tab */}
      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Performance History
          </Typography>
          {history.length === 0 ? (
            <Alert severity="info">No performance history available yet.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="center">Transactions</TableCell>
                    <TableCell align="center">On-Time Rate</TableCell>
                    <TableCell align="center">Tracking Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{new Date(row.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</TableCell>
                      <TableCell align="center">{row.transactions}</TableCell>
                      <TableCell align="center">{row.onTimeRate}%</TableCell>
                      <TableCell align="center">{row.trackingRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Appeal Dialog */}
      <Dialog open={appealDialog.open} onClose={() => setAppealDialog({ open: false, defect: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          Appeal Defect
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setAppealDialog({ open: false, defect: null })}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Defect Type: <strong>{appealDialog.defect?.defect_type?.replace(/_/g, ' ')}</strong>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason for Appeal"
            placeholder="Explain why this defect should be removed (minimum 20 characters)..."
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            helperText={`${appealReason.length}/20 minimum characters`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppealDialog({ open: false, defect: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleAppealSubmit} disabled={appealReason.length < 20}>
            Submit Appeal
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Missing Check import
const Check = ({ color }) => <CheckCircle color={color} fontSize="small" />;

export default SellerPerformance;
