import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Skeleton,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  NotificationsActive,
  TrendingDown,
  Delete,
  MoreVert,
  Edit,
  Email,
  PhoneAndroid,
  ArrowDropDown,
  ArrowDropUp,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { priceAlertService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PriceAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const response = await priceAlertService.getMyAlerts();
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await priceAlertService.delete(id);
      setAlerts(alerts.filter(a => a.id !== id));
      setSnackbar({ open: true, message: 'Alert deleted', severity: 'info' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete alert', severity: 'error' });
    }
    setAnchorEl(null);
  };

  const handleToggleAlert = async (alert) => {
    try {
      await priceAlertService.update(alert.id, { isActive: !alert.isActive });
      setAlerts(alerts.map(a =>
        a.id === alert.id ? { ...a, isActive: !a.isActive } : a
      ));
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update alert', severity: 'error' });
    }
  };

  const getPriceChange = (alert) => {
    if (!alert.product?.buyNowPrice || !alert.originalPrice) return null;
    const change = ((alert.product.buyNowPrice - alert.originalPrice) / alert.originalPrice) * 100;
    return change;
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <NotificationsActive sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to view your price alerts</Typography>
        <Button variant="contained" component={Link} to="/login">Sign In</Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" height={60} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rectangular" height={250} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <NotificationsActive color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Price Alerts</Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">{alerts.length}</Typography>
            <Typography variant="body2" color="text.secondary">Total Alerts</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {alerts.filter(a => a.isActive).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Active</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {alerts.filter(a => {
                const change = getPriceChange(a);
                return change && change < 0;
              }).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Price Drops</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="secondary.main">
              {alerts.filter(a => {
                const currentPrice = a.product?.buyNowPrice;
                return currentPrice && currentPrice <= a.targetPrice;
              }).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Target Reached</Typography>
          </Paper>
        </Grid>
      </Grid>

      {alerts.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <NotificationsActive sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No price alerts yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add price alerts to any product and we'll notify you when the price drops!
          </Typography>
          <Button variant="contained" component={Link} to="/">
            Browse Products
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {alerts.map((alert) => {
            const priceChange = getPriceChange(alert);
            const targetReached = alert.product?.buyNowPrice <= alert.targetPrice;

            return (
              <Grid item xs={12} sm={6} md={4} key={alert.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', opacity: alert.isActive ? 1 : 0.6 }}>
                  {targetReached && (
                    <Chip
                      icon={<TrendingDown />}
                      label="Target Reached!"
                      color="success"
                      sx={{ position: 'absolute', m: 1, zIndex: 1 }}
                    />
                  )}
                  <CardMedia
                    component={Link}
                    to={`/product/${alert.productId}`}
                    sx={{
                      height: 160,
                      backgroundImage: `url(${alert.product?.images?.[0]?.url || 'https://via.placeholder.com/300'})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      bgcolor: 'grey.50',
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography
                        variant="body2"
                        component={Link}
                        to={`/product/${alert.productId}`}
                        sx={{
                          color: 'text.primary',
                          textDecoration: 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        {alert.product?.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setSelectedAlert(alert);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">Current Price</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            ${alert.product?.buyNowPrice?.toFixed(2)}
                          </Typography>
                          {priceChange !== null && (
                            <Chip
                              size="small"
                              icon={priceChange < 0 ? <ArrowDropDown /> : <ArrowDropUp />}
                              label={`${Math.abs(priceChange).toFixed(1)}%`}
                              color={priceChange < 0 ? 'success' : 'error'}
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Your Target</Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: targetReached ? 'success.main' : 'text.primary' }}
                        >
                          ${alert.targetPrice?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      {alert.notifyEmail && (
                        <Chip icon={<Email />} label="Email" size="small" variant="outlined" />
                      )}
                      {alert.notifyPush && (
                        <Chip icon={<PhoneAndroid />} label="Push" size="small" variant="outlined" />
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Created {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={alert.isActive}
                          onChange={() => handleToggleAlert(alert)}
                          size="small"
                        />
                      }
                      label={<Typography variant="caption">Active</Typography>}
                    />
                    <Button
                      size="small"
                      component={Link}
                      to={`/product/${alert.productId}`}
                    >
                      View Item
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Edit sx={{ mr: 1 }} /> Edit Alert
        </MenuItem>
        <MenuItem onClick={() => handleDeleteAlert(selectedAlert?.id)} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Delete Alert
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default PriceAlerts;
