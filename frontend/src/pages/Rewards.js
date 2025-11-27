import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Stars,
  CardGiftcard,
  TrendingUp,
  ShoppingBag,
  LocalOffer,
  History,
  EmojiEvents,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { rewardsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Rewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemDialog, setRedeemDialog] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      fetchRewards();
      fetchTransactions();
      fetchTiers();
    }
  }, [user]);

  const fetchRewards = async () => {
    try {
      const response = await rewardsService.getMyRewards();
      setRewards(response.data);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await rewardsService.getTransactions();
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchTiers = async () => {
    try {
      const response = await rewardsService.getTiers();
      setTiers(response.data || []);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  const handleRedeem = async () => {
    const points = parseInt(redeemAmount);
    if (!points || points < 100 || points > (rewards?.points || 0)) {
      setSnackbar({ open: true, message: 'Invalid redemption amount', severity: 'error' });
      return;
    }

    try {
      await rewardsService.redeem({ points });
      setRedeemDialog(false);
      setRedeemAmount('');
      fetchRewards();
      fetchTransactions();
      setSnackbar({ open: true, message: `Redeemed ${points} points for $${(points / 100).toFixed(2)}!`, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to redeem points', severity: 'error' });
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Stars sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to view your rewards</Typography>
        <Button variant="contained" component={Link} to="/login">Sign In</Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rectangular" height={150} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  const pointsToNextTier = rewards?.nextTier?.requiredPoints - (rewards?.lifetimePoints || 0);
  const progressPercent = rewards?.nextTier
    ? ((rewards?.lifetimePoints || 0) / rewards?.nextTier?.requiredPoints) * 100
    : 100;

  const tierColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <Stars color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>eBay Rewards</Typography>
      </Box>

      {/* Points Summary */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #3665f3 0%, #1a3a8c 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>Available Points</Typography>
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
              {(rewards?.points || 0).toLocaleString()}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Worth ${((rewards?.points || 0) / 100).toFixed(2)} in rewards
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2, bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
              onClick={() => setRedeemDialog(true)}
              disabled={(rewards?.points || 0) < 100}
              startIcon={<CardGiftcard />}
            >
              Redeem Points
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <EmojiEvents sx={{ fontSize: 40, color: tierColors[rewards?.tier?.toLowerCase()] || '#FFD700' }} />
              <Box>
                <Typography variant="h6">{rewards?.tier || 'Bronze'} Member</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {rewards?.lifetimePoints?.toLocaleString() || 0} lifetime points
                </Typography>
              </Box>
            </Box>
            {rewards?.nextTier && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{rewards?.tier}</Typography>
                  <Typography variant="body2">{rewards?.nextTier?.name}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progressPercent, 100)}
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.3)' }}
                />
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.9 }}>
                  {pointsToNextTier.toLocaleString()} points to {rewards?.nextTier?.name}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Ways to Earn */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Ways to Earn</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingBag sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Shop</Typography>
              <Typography variant="body2" color="text.secondary">
                Earn 1 point per $1 spent on eligible purchases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <LocalOffer sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6">Special Offers</Typography>
              <Typography variant="body2" color="text.secondary">
                Earn bonus points on promoted items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">Tier Bonuses</Typography>
              <Typography variant="body2" color="text.secondary">
                Higher tiers earn up to 2x points
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tiers */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Membership Tiers</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {tiers.map((tier) => (
          <Grid item xs={6} sm={3} key={tier.id}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                border: rewards?.tier === tier.name ? 2 : 0,
                borderColor: 'primary.main',
              }}
            >
              <EmojiEvents sx={{ fontSize: 32, color: tierColors[tier.name?.toLowerCase()] }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {tier.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tier.requiredPoints?.toLocaleString()}+ points
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {tier.multiplier}x points
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Transaction History */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <History color="action" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Points History</Typography>
        </Box>
        {transactions.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No transactions yet
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Points</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.slice(0, 10).map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tx.description}
                      {tx.orderId && (
                        <Chip label={`Order #${tx.orderId.slice(0, 8)}`} size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: tx.points > 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Redeem Dialog */}
      <Dialog open={redeemDialog} onClose={() => setRedeemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Redeem Points</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Available: {(rewards?.points || 0).toLocaleString()} points
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Points to Redeem"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            helperText={`Minimum 100 points. Worth $${((parseInt(redeemAmount) || 0) / 100).toFixed(2)}`}
            inputProps={{ min: 100, max: rewards?.points || 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedeemDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRedeem}>Redeem</Button>
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

export default Rewards;
