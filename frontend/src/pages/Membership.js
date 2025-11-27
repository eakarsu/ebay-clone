import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import {
  Check,
  Star,
  LocalShipping,
  Replay,
  SupportAgent,
  Percent,
  AccessTime,
  Diamond,
  WorkspacePremium,
  Cancel,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Membership = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMembership, setCurrentMembership] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, plan: null });
  const [cancelDialog, setCancelDialog] = useState(false);

  const plans = [
    {
      id: 1,
      name: 'Basic',
      icon: <Star sx={{ fontSize: 48, color: '#3665f3' }} />,
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      color: '#3665f3',
      features: [
        { icon: <LocalShipping />, text: 'Free shipping on eligible items' },
        { icon: <Replay />, text: '60-day returns' },
        { icon: <Percent />, text: '2% cashback on purchases' },
        { icon: <AccessTime />, text: 'Early access to deals' },
      ],
    },
    {
      id: 2,
      name: 'Premium',
      icon: <WorkspacePremium sx={{ fontSize: 48, color: '#e53238' }} />,
      monthlyPrice: 19.99,
      annualPrice: 199.99,
      color: '#e53238',
      popular: true,
      features: [
        { icon: <LocalShipping />, text: 'Free expedited shipping' },
        { icon: <Replay />, text: '90-day returns' },
        { icon: <Percent />, text: '5% cashback on purchases' },
        { icon: <SupportAgent />, text: 'Priority customer support' },
        { icon: <AccessTime />, text: 'Early access to deals' },
        { icon: <Star />, text: 'Exclusive member discounts' },
      ],
    },
    {
      id: 3,
      name: 'Elite',
      icon: <Diamond sx={{ fontSize: 48, color: '#86b817' }} />,
      monthlyPrice: 29.99,
      annualPrice: 299.99,
      color: '#86b817',
      features: [
        { icon: <LocalShipping />, text: 'Free express shipping' },
        { icon: <Replay />, text: '365-day returns' },
        { icon: <Percent />, text: '10% cashback on purchases' },
        { icon: <SupportAgent />, text: '24/7 dedicated support' },
        { icon: <AccessTime />, text: 'First access to all deals' },
        { icon: <Star />, text: 'Maximum member discounts' },
        { icon: <Diamond />, text: 'VIP event invitations' },
      ],
    },
  ];

  useEffect(() => {
    fetchMembership();
  }, []);

  const fetchMembership = async () => {
    try {
      setLoading(true);
      const response = await api.get('/membership/current');
      setCurrentMembership(response.data.membership);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Failed to load membership');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      const response = await api.post('/membership/subscribe', {
        planId: plan.id,
        billingCycle,
      });
      setCurrentMembership(response.data.membership);
      setConfirmDialog({ open: false, plan: null });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to subscribe');
    }
  };

  const handleCancel = async () => {
    try {
      await api.post('/membership/cancel');
      setCurrentMembership(null);
      setCancelDialog(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel membership');
    }
  };

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getSavings = (plan) => {
    const monthlyCost = plan.monthlyPrice * 12;
    const annualCost = plan.annualPrice;
    return ((monthlyCost - annualCost) / monthlyCost * 100).toFixed(0);
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
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          eBay Plus Membership
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Unlock exclusive benefits and save more on every purchase
        </Typography>

        <ToggleButtonGroup
          value={billingCycle}
          exclusive
          onChange={(e, value) => value && setBillingCycle(value)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="monthly">Monthly</ToggleButton>
          <ToggleButton value="annual">
            Annual
            <Chip
              label="Save up to 17%"
              size="small"
              color="success"
              sx={{ ml: 1 }}
            />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {currentMembership && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Current Plan: {currentMembership.planName}
              </Typography>
              <Typography variant="body2">
                Member since {new Date(currentMembership.startDate).toLocaleDateString()}
                {' | '}
                Renews {new Date(currentMembership.renewalDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setCancelDialog(true)}
              startIcon={<Cancel />}
            >
              Cancel Membership
            </Button>
          </Box>
        </Paper>
      )}

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: currentMembership?.planId === plan.id ? `3px solid ${plan.color}` : 'none',
                transform: plan.popular ? 'scale(1.05)' : 'none',
                zIndex: plan.popular ? 1 : 0,
              }}
            >
              {plan.popular && (
                <Chip
                  label="Most Popular"
                  color="secondary"
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
              {currentMembership?.planId === plan.id && (
                <Chip
                  label="Current Plan"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                  }}
                />
              )}
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                {plan.icon}
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
                  {plan.name}
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: plan.color }}>
                    ${getPrice(plan)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </Typography>
                  {billingCycle === 'annual' && (
                    <Typography variant="caption" color="success.main">
                      Save {getSavings(plan)}% vs monthly
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  {plan.features.map((feature, idx) => (
                    <ListItem key={idx} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36, color: plan.color }}>
                        {feature.icon}
                      </ListItemIcon>
                      <ListItemText primary={feature.text} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant={currentMembership?.planId === plan.id ? 'outlined' : 'contained'}
                  disabled={currentMembership?.planId === plan.id}
                  sx={{
                    bgcolor: currentMembership?.planId === plan.id ? 'transparent' : plan.color,
                    '&:hover': {
                      bgcolor: currentMembership?.planId === plan.id ? 'transparent' : plan.color,
                      opacity: 0.9,
                    },
                  }}
                  onClick={() => setConfirmDialog({ open: true, plan })}
                >
                  {currentMembership?.planId === plan.id
                    ? 'Current Plan'
                    : currentMembership
                    ? 'Upgrade'
                    : 'Subscribe'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 4, mt: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
          Member Benefits
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <LocalShipping sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Free Shipping
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enjoy free shipping on millions of eligible items. Higher tiers get faster delivery.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Replay sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Extended Returns
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get up to 365 days to return items. More time means more confidence in your purchases.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Percent sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Cashback Rewards
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Earn cashback on every purchase. Elite members earn up to 10% back on all orders.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Subscribe Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, plan: null })}
      >
        <DialogTitle>Confirm Subscription</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to subscribe to <strong>{confirmDialog.plan?.name}</strong> plan
            for <strong>${confirmDialog.plan && getPrice(confirmDialog.plan)}/{billingCycle === 'monthly' ? 'month' : 'year'}</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Your subscription will begin immediately and you can cancel anytime.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, plan: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSubscribe(confirmDialog.plan)}
          >
            Confirm Subscription
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle>Cancel Membership?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your membership? You'll lose access to:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><Check color="error" /></ListItemIcon>
              <ListItemText primary="Free shipping benefits" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Check color="error" /></ListItemIcon>
              <ListItemText primary="Extended return period" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Check color="error" /></ListItemIcon>
              <ListItemText primary="Cashback rewards" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Keep Membership</Button>
          <Button variant="contained" color="error" onClick={handleCancel}>
            Cancel Membership
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Membership;
