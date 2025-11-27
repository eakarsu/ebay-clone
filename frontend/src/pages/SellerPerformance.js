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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SellerPerformance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/seller-performance/dashboard');
      setPerformance(response.data);
    } catch (err) {
      // Use mock data if API fails
      setPerformance({
        level: 'top_rated',
        levelName: 'Top Rated Seller',
        defectRate: 0.3,
        lateShipmentRate: 1.2,
        feedbackScore: 98.5,
        totalSales: 1247,
        totalRevenue: 89420.50,
        averageRating: 4.8,
        metrics: {
          itemsNotAsDescribed: { count: 3, total: 1000, rate: 0.3 },
          cancelledOrders: { count: 5, total: 1000, rate: 0.5 },
          lateShipments: { count: 12, total: 1000, rate: 1.2 },
          trackingUploaded: { count: 980, total: 1000, rate: 98.0 },
        },
        recentFeedback: [
          { rating: 5, comment: 'Fast shipping, great item!', date: '2024-11-25' },
          { rating: 5, comment: 'Excellent seller, highly recommend', date: '2024-11-24' },
          { rating: 4, comment: 'Good product, slight delay in shipping', date: '2024-11-23' },
          { rating: 5, comment: 'Perfect condition as described', date: '2024-11-22' },
        ],
        tips: [
          'Ship items within 1 business day to improve late shipment rate',
          'Always upload tracking numbers immediately after shipping',
          'Respond to buyer messages within 24 hours',
          'Include accurate item descriptions and photos',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      below_standard: 'error',
      above_standard: 'warning',
      top_rated: 'success',
      top_rated_plus: 'primary',
    };
    return colors[level] || 'default';
  };

  const getLevelIcon = (level) => {
    const icons = {
      below_standard: <Warning color="error" />,
      above_standard: <CheckCircle color="warning" />,
      top_rated: <Star color="success" />,
      top_rated_plus: <EmojiEvents color="primary" />,
    };
    return icons[level] || <Info />;
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
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Seller Performance Dashboard
      </Typography>

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
              {getLevelIcon(performance?.level)}
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {performance?.levelName}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Based on your last 12 months of selling activity
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {performance?.totalSales?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">Total Sales</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ${(performance?.totalRevenue / 1000).toFixed(1)}k
                  </Typography>
                  <Typography variant="body2">Revenue</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {performance?.averageRating}
                  </Typography>
                  <Typography variant="body2">Avg Rating</Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Performance Metrics */}
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
                            Items not as described + cancelled orders
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {performance?.defectRate}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">&lt; 2%</TableCell>
                    <TableCell align="center">
                      {getMetricStatus(performance?.defectRate, 2).icon}
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
                            Orders shipped after handling time
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {performance?.lateShipmentRate}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">&lt; 3%</TableCell>
                    <TableCell align="center">
                      {getMetricStatus(performance?.lateShipmentRate, 3).icon}
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
                            Percentage of positive ratings
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {performance?.feedbackScore}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">&gt; 95%</TableCell>
                    <TableCell align="center">
                      {performance?.feedbackScore >= 95 ? (
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
                            Orders with tracking uploaded
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {performance?.metrics?.trackingUploaded?.rate}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">&gt; 95%</TableCell>
                    <TableCell align="center">
                      {performance?.metrics?.trackingUploaded?.rate >= 95 ? (
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

          {/* Seller Levels Explanation */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Seller Levels
            </Typography>

            <Grid container spacing={2}>
              {[
                {
                  level: 'below_standard',
                  name: 'Below Standard',
                  desc: 'Defect rate >2%. Reduced visibility in search.',
                  color: 'error.light',
                },
                {
                  level: 'above_standard',
                  name: 'Above Standard',
                  desc: 'Defect rate <2%. Normal visibility in search.',
                  color: 'warning.light',
                },
                {
                  level: 'top_rated',
                  name: 'Top Rated',
                  desc: 'Defect rate <0.5%, 100+ sales. Badge + fee discounts.',
                  color: 'success.light',
                },
                {
                  level: 'top_rated_plus',
                  name: 'Top Rated Plus',
                  desc: 'All TRS requirements + same-day handling. Maximum benefits.',
                  color: 'primary.light',
                },
              ].map((item) => (
                <Grid item xs={12} sm={6} key={item.level}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: item.color,
                      border: performance?.level === item.level ? 3 : 0,
                      borderColor: 'primary.main',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getLevelIcon(item.level)}
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                      {performance?.level === item.level && (
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

        {/* Right Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Recent Feedback */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Recent Feedback
            </Typography>
            <List dense>
              {performance?.recentFeedback?.map((feedback, idx) => (
                <ListItem key={idx} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box sx={{ display: 'flex' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          sx={{
                            fontSize: 14,
                            color: i < feedback.rating ? 'warning.main' : 'grey.300',
                          }}
                        />
                      ))}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={feedback.comment}
                    secondary={new Date(feedback.date).toLocaleDateString()}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Tips for Improvement */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Tips for Improvement
            </Typography>
            <List dense>
              {performance?.tips?.map((tip, idx) => (
                <ListItem key={idx} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Info color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={tip}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SellerPerformance;
