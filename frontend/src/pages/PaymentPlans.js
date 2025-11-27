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
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Skeleton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Payment,
  Schedule,
  CheckCircle,
  Warning,
  Info,
  CreditCard,
} from '@mui/icons-material';
import { format, differenceInDays, isPast } from 'date-fns';
import { paymentPlanService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const PaymentPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payDialog, setPayDialog] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const response = await paymentPlanService.getMyPlans();
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallment = async () => {
    if (!selectedPlan || !selectedInstallment) return;

    try {
      await paymentPlanService.payInstallment(selectedPlan.id, selectedInstallment.id);
      setPayDialog(false);
      fetchPlans();
      setSnackbar({ open: true, message: 'Payment successful!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Payment failed', severity: 'error' });
    }
  };

  const getPlanStatus = (plan) => {
    const paidCount = plan.installments?.filter(i => i.status === 'paid').length || 0;
    const totalCount = plan.installments?.length || 0;
    const hasOverdue = plan.installments?.some(i => i.status === 'pending' && isPast(new Date(i.dueDate)));

    if (paidCount === totalCount) return { label: 'Completed', color: 'success' };
    if (hasOverdue) return { label: 'Overdue', color: 'error' };
    return { label: 'Active', color: 'primary' };
  };

  const getProgress = (plan) => {
    const paidCount = plan.installments?.filter(i => i.status === 'paid').length || 0;
    const totalCount = plan.installments?.length || 1;
    return (paidCount / totalCount) * 100;
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Payment sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to view your payment plans</Typography>
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
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <Payment color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Payment Plans</Typography>
      </Box>

      {/* Info Banner */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="subtitle2">Buy Now, Pay Later</Typography>
        <Typography variant="body2">
          Split your purchases into easy installments with 0% interest when paid on time.
        </Typography>
      </Alert>

      {plans.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Payment sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No payment plans yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Payment plans are automatically created when you choose "Pay in 4" at checkout.
          </Typography>
          <Button variant="contained" component={Link} to="/">
            Start Shopping
          </Button>
        </Paper>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Active Plans</Typography>
                  <Typography variant="h3">{plans.filter(p => getPlanStatus(p).label === 'Active').length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Total Remaining</Typography>
                  <Typography variant="h3">
                    ${plans.reduce((sum, p) => sum + (p.totalAmount - (p.paidAmount || 0)), 0).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Next Payment</Typography>
                  <Typography variant="h3">
                    {(() => {
                      const nextDue = plans
                        .flatMap(p => p.installments || [])
                        .filter(i => i.status === 'pending')
                        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
                      return nextDue ? format(new Date(nextDue.dueDate), 'MMM d') : 'None';
                    })()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Plans List */}
          {plans.map((plan) => {
            const status = getPlanStatus(plan);
            const progress = getProgress(plan);
            const nextInstallment = plan.installments?.find(i => i.status === 'pending');

            return (
              <Paper key={plan.id} sx={{ mb: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 3, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          component="img"
                          src={plan.order?.items?.[0]?.product?.images?.[0]?.url || 'https://via.placeholder.com/60'}
                          alt=""
                          sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover' }}
                        />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Order #{plan.orderId?.slice(0, 8)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {plan.installmentCount} payments of ${plan.installmentAmount?.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Progress</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2">{Math.round(progress)}%</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3} sx={{ textAlign: { md: 'right' } }}>
                      <Chip
                        label={status.label}
                        color={status.color}
                        icon={status.label === 'Completed' ? <CheckCircle /> : status.label === 'Overdue' ? <Warning /> : <Schedule />}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Installments Table */}
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {plan.installments?.map((installment, idx) => {
                      const isOverdue = installment.status === 'pending' && isPast(new Date(installment.dueDate));
                      const daysUntil = differenceInDays(new Date(installment.dueDate), new Date());

                      return (
                        <TableRow key={installment.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Payment {idx + 1} of {plan.installmentCount}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${installment.amount?.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {format(new Date(installment.dueDate), 'MMM d, yyyy')}
                            </Typography>
                            {installment.status === 'pending' && (
                              <Typography
                                variant="caption"
                                color={isOverdue ? 'error.main' : daysUntil <= 3 ? 'warning.main' : 'text.secondary'}
                              >
                                {isOverdue
                                  ? `${Math.abs(daysUntil)} days overdue`
                                  : `Due in ${daysUntil} days`}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={installment.status}
                              color={
                                installment.status === 'paid'
                                  ? 'success'
                                  : isOverdue
                                  ? 'error'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            {installment.status === 'pending' && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<CreditCard />}
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setSelectedInstallment(installment);
                                  setPayDialog(true);
                                }}
                              >
                                Pay Now
                              </Button>
                            )}
                            {installment.status === 'paid' && (
                              <Typography variant="caption" color="success.main">
                                Paid {installment.paidAt && format(new Date(installment.paidAt), 'MMM d')}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>
            );
          })}
        </>
      )}

      {/* Pay Dialog */}
      <Dialog open={payDialog} onClose={() => setPayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are about to pay <strong>${selectedInstallment?.amount?.toFixed(2)}</strong> for
            Order #{selectedPlan?.orderId?.slice(0, 8)}.
          </Typography>
          <Alert severity="info" icon={<Info />}>
            Payment will be charged to your default payment method on file.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePayInstallment} startIcon={<CreditCard />}>
            Pay ${selectedInstallment?.amount?.toFixed(2)}
          </Button>
        </DialogActions>
      </Dialog>

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

export default PaymentPlans;
