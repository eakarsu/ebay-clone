import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  TrendingUp,
  CheckCircle,
  Warning,
  Info,
  Star,
  Verified,
  Lock,
  LockOpen,
  Store,
  LocalOffer,
  AttachMoney,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const SellingLimits = () => {
  const { user } = useAuth();
  const [requestDialog, setRequestDialog] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Mock data for demonstration
  const limits = {
    current: {
      items: 10,
      value: 500,
    },
    used: {
      items: 7,
      value: 320,
    },
    canRequest: true,
    accountAge: 30,
    sellerLevel: 'Standard',
    feedbackScore: 12,
    positivePercentage: 100,
  };

  const itemsProgress = (limits.used.items / limits.current.items) * 100;
  const valueProgress = (limits.used.value / limits.current.value) * 100;

  const steps = [
    {
      label: 'New Seller',
      description: 'Start with a 10-item / $500 monthly limit',
      completed: true,
    },
    {
      label: 'Verified Seller',
      description: 'Verify your identity to unlock higher limits',
      completed: limits.accountAge >= 30,
    },
    {
      label: 'Established Seller',
      description: 'Build positive feedback and sales history',
      completed: limits.feedbackScore >= 20,
    },
    {
      label: 'Top Rated Seller',
      description: 'Achieve Top Rated status for unlimited selling',
      completed: false,
    },
  ];

  const handleRequestIncrease = () => {
    setSubmitted(true);
    setTimeout(() => {
      setRequestDialog(false);
      setSubmitted(false);
      setRequestReason('');
    }, 2000);
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Lock sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to view your selling limits</Typography>
        <Button component={Link} to="/login" variant="contained">Sign In</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
          Selling Limits
        </Typography>
        <Typography color="text.secondary">
          Monitor your selling capacity and request limit increases
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Current Limits */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Your Current Limits
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Items Listed</Typography>
                    <Typography variant="subtitle2">
                      {limits.used.items} / {limits.current.items}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={itemsProgress}
                    color={itemsProgress >= 90 ? 'error' : itemsProgress >= 70 ? 'warning' : 'primary'}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {limits.current.items - limits.used.items} items remaining this month
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Value Listed</Typography>
                    <Typography variant="subtitle2">
                      ${limits.used.value} / ${limits.current.value}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={valueProgress}
                    color={valueProgress >= 90 ? 'error' : valueProgress >= 70 ? 'warning' : 'success'}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    ${limits.current.value - limits.used.value} value remaining this month
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {(itemsProgress >= 80 || valueProgress >= 80) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You're approaching your selling limits. Consider requesting an increase.
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => setRequestDialog(true)}
                disabled={!limits.canRequest}
              >
                Request Limit Increase
              </Button>
              <Button
                variant="outlined"
                component={Link}
                to="/sell"
              >
                Create Listing
              </Button>
            </Box>
          </Paper>

          {/* How to Increase Limits */}
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              How to Increase Your Limits
            </Typography>

            <Stepper orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label} active={true} completed={step.completed}>
                  <StepLabel
                    icon={step.completed ? <CheckCircle color="success" /> : index + 1}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography color="text.secondary">{step.description}</Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Tips to Increase Your Limits Faster:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Complete all seller verification steps" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Ship items quickly and provide tracking" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Maintain high customer satisfaction ratings" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Keep your defect rate low" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                <ListItemText primary="Link a PayPal account or set up managed payments" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Account Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Store sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Seller Level</Typography>
                  <Chip label={limits.sellerLevel} color="primary" size="small" />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Star sx={{ mr: 1, color: 'warning.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Feedback Score</Typography>
                  <Typography variant="subtitle2">{limits.feedbackScore}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Verified sx={{ mr: 1, color: 'success.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Positive Feedback</Typography>
                  <Typography variant="subtitle2">{limits.positivePercentage}%</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Info sx={{ mr: 1, color: 'info.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Account Age</Typography>
                  <Typography variant="subtitle2">{limits.accountAge} days</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Limit Tiers
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="New Seller"
                    secondary="10 items / $500"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Verified"
                    secondary="100 items / $5,000"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Established"
                    secondary="1,000 items / $50,000"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Top Rated"
                    secondary="Unlimited"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Alert severity="info">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Why Do Limits Exist?
            </Typography>
            <Typography variant="body2">
              Selling limits help protect buyers and maintain marketplace trust.
              As you build a positive selling history, your limits will increase automatically.
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {/* Request Dialog */}
      <Dialog open={requestDialog} onClose={() => setRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Limit Increase</DialogTitle>
        <DialogContent>
          {submitted ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>Request Submitted!</Typography>
              <Typography color="text.secondary">
                We'll review your request and update your limits within 24-48 hours.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Tell us why you need higher limits. This helps us process your request faster.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reason for increase"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="E.g., I have more inventory to list, seasonal business increase, etc."
              />
              <Alert severity="info" sx={{ mt: 3 }}>
                Your request will be reviewed based on your selling history, account standing,
                and verification status.
              </Alert>
            </Box>
          )}
        </DialogContent>
        {!submitted && (
          <DialogActions>
            <Button onClick={() => setRequestDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleRequestIncrease}
              disabled={!requestReason.trim()}
            >
              Submit Request
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Container>
  );
};

export default SellingLimits;
