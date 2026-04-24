import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  InputAdornment,
  Tabs,
  Tab,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Inventory,
  Security,
  LocalShipping,
  Verified,
  Add,
  Star,
  TrendingUp,
  Timer,
  CheckCircle,
  Info,
  ArrowBack,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  pending: 'warning',
  shipped_to_vault: 'info',
  received: 'info',
  grading: 'secondary',
  graded: 'success',
  stored: 'success',
  shipping_out: 'primary',
  delivered: 'default',
};

const statusLabels = {
  pending: 'Pending Shipment',
  shipped_to_vault: 'In Transit to Vault',
  received: 'Received at Vault',
  grading: 'Being Graded',
  graded: 'Graded',
  stored: 'Stored in Vault',
  shipping_out: 'Shipping Out',
  delivered: 'Delivered',
};

const Vault = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Data
  const [vaultItems, setVaultItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [gradingServices, setGradingServices] = useState([]);

  // Submit dialog
  const [submitDialog, setSubmitDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [newItem, setNewItem] = useState({
    itemName: '',
    itemDescription: '',
    gradingService: 'PSA',
    estimatedValue: '',
    insuranceValue: '',
    notes: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, statsRes, servicesRes] = await Promise.all([
        api.get('/vault/items'),
        api.get('/vault/stats'),
        api.get('/vault/services'),
      ]);
      setVaultItems(itemsRes.data.items || []);
      setStats(statsRes.data);
      setGradingServices(servicesRes.data.services || []);
    } catch (err) {
      // Mock data
      setStats({
        totalItems: 5,
        stored: 3,
        grading: 1,
        pending: 1,
        totalEstimatedValue: 12500,
      });
      setGradingServices([
        { id: 'PSA', name: 'PSA', description: 'Professional Sports Authenticator', turnaround: '30-60 days' },
        { id: 'BGS', name: 'BGS', description: 'Beckett Grading Services', turnaround: '45-90 days' },
        { id: 'CGC', name: 'CGC', description: 'Certified Guaranty Company', turnaround: '30-45 days' },
        { id: 'SGC', name: 'SGC', description: 'Sportscard Guaranty', turnaround: '20-40 days' },
      ]);
      setVaultItems([
        {
          id: '1',
          itemName: '2023 Panini Prizm Wemby RC',
          gradingService: 'PSA',
          grade: '10',
          status: 'stored',
          estimatedValue: 5000,
          certNumber: 'PSA-12345678',
        },
        {
          id: '2',
          itemName: 'Pokemon Base Set Charizard',
          gradingService: 'BGS',
          grade: '9.5',
          status: 'grading',
          estimatedValue: 3500,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitItem = async () => {
    try {
      await api.post('/vault/submit', newItem);
      setSuccess('Item submitted for vaulting! Check your email for shipping instructions.');
      setSubmitDialog(false);
      setNewItem({
        itemName: '',
        itemDescription: '',
        gradingService: 'PSA',
        estimatedValue: '',
        insuranceValue: '',
        notes: '',
      });
      setActiveStep(0);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit item');
    }
  };

  const handleRequestShipOut = async (itemId) => {
    try {
      await api.post(`/vault/items/${itemId}/ship-out`);
      setSuccess('Ship out request submitted!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request ship out');
    }
  };

  const handleListForSale = async (itemId) => {
    // Navigate to sell page with vault item pre-filled
    navigate(`/sell?vaultItem=${itemId}`);
  };

  const steps = ['Item Details', 'Grading Service', 'Review & Submit'];

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
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Security sx={{ fontSize: 40, color: '#3665f3' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              eBay Vault
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Secure storage and authentication for your collectibles
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setSubmitDialog(true)}
          sx={{ bgcolor: '#3665f3' }}
        >
          Submit Item
        </Button>
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

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Inventory sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.totalItems}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.stored}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Vault
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Timer sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.grading + stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Processing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  ${stats.totalEstimatedValue?.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Est. Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<Inventory />} label="My Vault" />
          <Tab icon={<Info />} label="Grading Services" />
        </Tabs>
      </Paper>

      {/* Vault Items Tab */}
      {tabValue === 0 && (
        <Paper>
          {vaultItems.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Security sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Your vault is empty
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Submit your valuable collectibles for secure storage and authentication
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setSubmitDialog(true)}>
                Submit Your First Item
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Grading</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Est. Value</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaultItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar variant="rounded" sx={{ bgcolor: 'primary.light' }}>
                            <Star />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.itemName}
                            </Typography>
                            {item.certNumber && (
                              <Typography variant="caption" color="text.secondary">
                                Cert: {item.certNumber}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.gradingService} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {item.grade ? (
                          <Chip
                            icon={<Verified />}
                            label={item.grade}
                            size="small"
                            color="success"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[item.status] || item.status}
                          size="small"
                          color={statusColors[item.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {item.estimatedValue ? `$${item.estimatedValue.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {item.status === 'stored' && (
                          <>
                            <Button size="small" onClick={() => handleListForSale(item.id)}>
                              List for Sale
                            </Button>
                            <Button
                              size="small"
                              startIcon={<LocalShipping />}
                              onClick={() => handleRequestShipOut(item.id)}
                            >
                              Ship Out
                            </Button>
                          </>
                        )}
                        {item.status === 'pending' && (
                          <Button size="small" onClick={() => navigate(`/vault/${item.id}`)}>
                            Add Tracking
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

      {/* Grading Services Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {gradingServices.map((service) => (
            <Grid item xs={12} md={6} key={service.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      {service.id}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {service.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {service.description}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Turnaround
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {service.turnaround}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Price Range
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {service.priceRange || '$20-$100'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {service.categories && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Categories
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {service.categories.map((cat) => (
                          <Chip key={cat} label={cat} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Submit Item Dialog */}
      <Dialog open={submitDialog} onClose={() => setSubmitDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Submit Item to Vault</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ py: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Item Name"
                value={newItem.itemName}
                onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="e.g., 2023 Panini Prizm Victor Wembanyama RC"
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newItem.itemDescription}
                onChange={(e) => setNewItem({ ...newItem, itemDescription: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="Describe your item's condition and any notable features"
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estimated Value"
                    type="number"
                    value={newItem.estimatedValue}
                    onChange={(e) => setNewItem({ ...newItem, estimatedValue: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Insurance Value"
                    type="number"
                    value={newItem.insuranceValue}
                    onChange={(e) => setNewItem({ ...newItem, insuranceValue: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Grading Service</InputLabel>
                <Select
                  value={newItem.gradingService}
                  onChange={(e) => setNewItem({ ...newItem, gradingService: e.target.value })}
                  label="Grading Service"
                >
                  {gradingServices.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      <Box>
                        <Typography variant="body1">{service.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {service.turnaround}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                  <MenuItem value="none">No Grading (Vault Storage Only)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Additional Notes"
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                placeholder="Any special instructions or notes"
              />
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Please review your submission details before confirming.
              </Alert>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Item Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {newItem.itemName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Grading Service
                    </Typography>
                    <Typography variant="body1">{newItem.gradingService}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Estimated Value
                    </Typography>
                    <Typography variant="body1">
                      ${newItem.estimatedValue || 'Not specified'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialog(false)}>Cancel</Button>
          {activeStep > 0 && <Button onClick={() => setActiveStep(activeStep - 1)}>Back</Button>}
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep(activeStep + 1)}
              disabled={activeStep === 0 && !newItem.itemName}
            >
              Next
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSubmitItem}>
              Submit Item
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Vault;
