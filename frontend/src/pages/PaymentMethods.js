import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControlLabel,
  Checkbox,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Delete,
  CreditCard,
  Payment,
  AccountBalance,
  Star,
} from '@mui/icons-material';
import api from '../services/api';

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false);
  const [addBankDialogOpen, setAddBankDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Card form state
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardBrand: 'visa',
    cardExpMonth: '',
    cardExpYear: '',
    isDefault: true,
  });

  // Bank form state
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    isDefault: false,
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/payment/methods');
      setPaymentMethods(response.data.paymentMethods || []);
    } catch (err) {
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const formatCardBrand = (brand) => {
    if (!brand) return 'Card';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const handleDeleteClick = (method) => {
    setSelectedMethod(method);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMethod) return;

    setDeleting(true);
    try {
      await api.delete(`/payment/methods/${selectedMethod.id}`);
      setSuccess('Payment method removed successfully');
      setDeleteDialogOpen(false);
      fetchPaymentMethods();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove payment method');
    } finally {
      setDeleting(false);
      setSelectedMethod(null);
    }
  };

  const handleAddCard = async () => {
    // Validate
    if (!cardForm.cardNumber || cardForm.cardNumber.length < 4) {
      setError('Please enter at least the last 4 digits of your card');
      return;
    }
    if (!cardForm.cardExpMonth || !cardForm.cardExpYear) {
      setError('Please enter expiration date');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/payment/methods/direct', {
        paymentType: 'credit_card',
        cardBrand: cardForm.cardBrand,
        cardLastFour: cardForm.cardNumber.slice(-4),
        cardExpMonth: parseInt(cardForm.cardExpMonth),
        cardExpYear: parseInt(cardForm.cardExpYear),
        isDefault: cardForm.isDefault,
      });

      setSuccess('Card added successfully');
      setAddCardDialogOpen(false);
      setCardForm({
        cardNumber: '',
        cardBrand: 'visa',
        cardExpMonth: '',
        cardExpYear: '',
        isDefault: true,
      });
      fetchPaymentMethods();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add card');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBank = async () => {
    // Validate
    if (!bankForm.bankName) {
      setError('Please enter bank name');
      return;
    }
    if (!bankForm.accountNumber || bankForm.accountNumber.length < 4) {
      setError('Please enter at least the last 4 digits of your account');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/payment/methods/direct', {
        paymentType: 'bank_account',
        bankName: bankForm.bankName,
        bankAccountLastFour: bankForm.accountNumber.slice(-4),
        isDefault: bankForm.isDefault,
      });

      setSuccess('Bank account added successfully');
      setAddBankDialogOpen(false);
      setBankForm({
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        isDefault: false,
      });
      fetchPaymentMethods();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add bank account');
    } finally {
      setSaving(false);
    }
  };

  const getPaymentIcon = (type) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard sx={{ color: 'primary.main' }} />;
      case 'paypal':
        return <Payment sx={{ color: '#003087' }} />;
      case 'bank_account':
        return <AccountBalance sx={{ color: 'success.main' }} />;
      default:
        return <CreditCard sx={{ color: 'text.secondary' }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Payment Methods
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddCardDialogOpen(true)}
          >
            Add Card
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setAddBankDialogOpen(true)}
          >
            Add Bank
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Credit/Debit Cards */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CreditCard sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">Credit & Debit Cards</Typography>
        </Box>

        {paymentMethods.filter(pm => pm.paymentType === 'credit_card' || pm.paymentType === 'debit_card').length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No cards saved yet.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setAddCardDialogOpen(true)}
            >
              Add Your First Card
            </Button>
          </Box>
        ) : (
          <List>
            {paymentMethods
              .filter(pm => pm.paymentType === 'credit_card' || pm.paymentType === 'debit_card')
              .map((method, index) => (
                <React.Fragment key={method.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemIcon>
                      {getPaymentIcon('card')}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {formatCardBrand(method.cardBrand)} ending in {method.cardLastFour}
                          </Typography>
                          {method.isDefault && (
                            <Chip
                              icon={<Star sx={{ fontSize: 14 }} />}
                              label="Default"
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                      secondary={`Expires ${method.cardExpMonth}/${method.cardExpYear}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteClick(method)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
          </List>
        )}
      </Paper>

      {/* Bank Accounts */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccountBalance sx={{ mr: 2, color: 'success.main' }} />
          <Typography variant="h6">Bank Accounts</Typography>
        </Box>

        {paymentMethods.filter(pm => pm.paymentType === 'bank_account').length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No bank accounts linked.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setAddBankDialogOpen(true)}
            >
              Add Bank Account
            </Button>
          </Box>
        ) : (
          <List>
            {paymentMethods
              .filter(pm => pm.paymentType === 'bank_account')
              .map((method, index) => (
                <React.Fragment key={method.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemIcon>
                      {getPaymentIcon('bank')}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {method.bankName} - ****{method.bankAccountLastFour}
                          </Typography>
                          {method.isDefault && (
                            <Chip
                              icon={<Star sx={{ fontSize: 14 }} />}
                              label="Default"
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteClick(method)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
          </List>
        )}
      </Paper>

      {/* PayPal */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Payment sx={{ mr: 2, color: '#003087' }} />
          <Typography variant="h6">PayPal</Typography>
        </Box>

        {paymentMethods.filter(pm => pm.paymentType === 'paypal').length === 0 ? (
          <Typography color="text.secondary">
            No PayPal accounts linked. PayPal can be used during checkout.
          </Typography>
        ) : (
          <List>
            {paymentMethods
              .filter(pm => pm.paymentType === 'paypal')
              .map((method, index) => (
                <React.Fragment key={method.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemIcon>
                      {getPaymentIcon('paypal')}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {method.paypalEmail}
                          </Typography>
                          {method.isDefault && (
                            <Chip
                              icon={<Star sx={{ fontSize: 14 }} />}
                              label="Default"
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteClick(method)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
          </List>
        )}
      </Paper>

      {/* Add Card Dialog */}
      <Dialog
        open={addCardDialogOpen}
        onClose={() => setAddCardDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Credit or Debit Card</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Card Type</InputLabel>
                <Select
                  value={cardForm.cardBrand}
                  onChange={(e) => setCardForm({ ...cardForm, cardBrand: e.target.value })}
                  label="Card Type"
                >
                  <MenuItem value="visa">Visa</MenuItem>
                  <MenuItem value="mastercard">Mastercard</MenuItem>
                  <MenuItem value="amex">American Express</MenuItem>
                  <MenuItem value="discover">Discover</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                placeholder="Enter full card number or last 4 digits"
                value={cardForm.cardNumber}
                onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value.replace(/\D/g, '') })}
                inputProps={{ maxLength: 16 }}
                helperText="For demo purposes - enter any number (at least 4 digits)"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Exp Month</InputLabel>
                <Select
                  value={cardForm.cardExpMonth}
                  onChange={(e) => setCardForm({ ...cardForm, cardExpMonth: e.target.value })}
                  label="Exp Month"
                >
                  {[...Array(12)].map((_, i) => (
                    <MenuItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {String(i + 1).padStart(2, '0')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Exp Year</InputLabel>
                <Select
                  value={cardForm.cardExpYear}
                  onChange={(e) => setCardForm({ ...cardForm, cardExpYear: e.target.value })}
                  label="Exp Year"
                >
                  {[...Array(10)].map((_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <MenuItem key={year} value={String(year)}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={cardForm.isDefault}
                    onChange={(e) => setCardForm({ ...cardForm, isDefault: e.target.checked })}
                  />
                }
                label="Set as default payment method"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCardDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddCard}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Add Card'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Bank Dialog */}
      <Dialog
        open={addBankDialogOpen}
        onClose={() => setAddBankDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Bank Account</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bank Name"
                placeholder="e.g., Chase, Bank of America"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Number"
                placeholder="Enter account number or last 4 digits"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                helperText="For demo purposes - enter any number (at least 4 digits)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Routing Number (Optional)"
                placeholder="9-digit routing number"
                value={bankForm.routingNumber}
                onChange={(e) => setBankForm({ ...bankForm, routingNumber: e.target.value.replace(/\D/g, '') })}
                inputProps={{ maxLength: 9 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={bankForm.isDefault}
                    onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })}
                  />
                }
                label="Set as default payment method"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBankDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddBank}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Add Bank Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Remove Payment Method</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this payment method? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentMethods;
