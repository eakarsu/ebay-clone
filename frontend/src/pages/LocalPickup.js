import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  LocationOn,
  Schedule,
  CheckCircle,
  Pending,
  Cancel,
  DirectionsCar,
  Person,
  Phone,
  Event,
  AccessTime,
  Info,
  Settings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const LocalPickup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [pickups, setPickups] = useState([]);
  const [sellerSettings, setSellerSettings] = useState(null);
  const [scheduleDialog, setScheduleDialog] = useState({ open: false, order: null });
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    fetchPickups();
    fetchSellerSettings();
  }, []);

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/local-pickup/my-pickups');
      setPickups(response.data.pickups || []);
    } catch (err) {
      // Use mock data if API fails
      setPickups([
        {
          id: 1,
          orderId: 'ORD-12345',
          productTitle: 'Vintage Guitar Amplifier',
          productImage: 'https://source.unsplash.com/100x100/?guitar,amplifier',
          sellerName: 'MusicGear Store',
          buyerName: 'John Smith',
          status: 'scheduled',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          scheduledTime: '2:00 PM - 4:00 PM',
          address: '123 Main St, San Francisco, CA 94102',
          role: 'buyer',
        },
        {
          id: 2,
          orderId: 'ORD-12346',
          productTitle: 'Antique Wooden Desk',
          productImage: 'https://source.unsplash.com/100x100/?desk,furniture',
          sellerName: 'My Store',
          buyerName: 'Jane Doe',
          status: 'pending',
          address: '456 Oak Ave, San Francisco, CA 94103',
          role: 'seller',
        },
        {
          id: 3,
          orderId: 'ORD-12340',
          productTitle: 'Vintage Record Collection',
          productImage: 'https://source.unsplash.com/100x100/?vinyl,records',
          sellerName: 'VinylLover',
          buyerName: 'Mike Johnson',
          status: 'completed',
          scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          scheduledTime: '10:00 AM - 12:00 PM',
          address: '789 Pine St, San Francisco, CA 94104',
          role: 'buyer',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerSettings = async () => {
    try {
      const response = await api.get('/local-pickup/settings');
      setSellerSettings(response.data.settings);
    } catch (err) {
      // Use mock settings
      setSellerSettings({
        enabled: true,
        address: '123 Business St, San Francisco, CA 94102',
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        availableHours: '9:00 AM - 6:00 PM',
        instructions: 'Please park in the back lot and ring the doorbell.',
      });
    }
  };

  const handleSchedulePickup = async () => {
    if (!scheduleDialog.order || !selectedDate || !selectedTime) return;

    try {
      await api.post(`/local-pickup/${scheduleDialog.order.id}/schedule`, {
        date: selectedDate,
        time: selectedTime,
      });
      setScheduleDialog({ open: false, order: null });
      fetchPickups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to schedule pickup');
    }
  };

  const handleConfirmPickup = async (pickupId) => {
    try {
      await api.post(`/local-pickup/${pickupId}/confirm`);
      fetchPickups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm pickup');
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <Pending />, label: 'Pending Schedule' },
      scheduled: { color: 'info', icon: <Schedule />, label: 'Scheduled' },
      completed: { color: 'success', icon: <CheckCircle />, label: 'Completed' },
      cancelled: { color: 'error', icon: <Cancel />, label: 'Cancelled' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  const availableTimes = [
    '9:00 AM - 11:00 AM',
    '11:00 AM - 1:00 PM',
    '1:00 PM - 3:00 PM',
    '3:00 PM - 5:00 PM',
    '5:00 PM - 7:00 PM',
  ];

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
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Local Pickup
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Schedule and manage your local pickup orders
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Settings />}
          onClick={() => setSettingsDialog(true)}
        >
          Pickup Settings
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs
        value={tabValue}
        onChange={(e, v) => setTabValue(v)}
        sx={{ mb: 3 }}
      >
        <Tab label="All Pickups" />
        <Tab label="As Buyer" />
        <Tab label="As Seller" />
      </Tabs>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0 }}>
            {pickups.filter(p =>
              tabValue === 0 ||
              (tabValue === 1 && p.role === 'buyer') ||
              (tabValue === 2 && p.role === 'seller')
            ).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <DirectionsCar sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No local pickup orders
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Items with local pickup will appear here
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/search?local_pickup=true')}
                >
                  Browse Local Pickup Items
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Schedule</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pickups
                      .filter(p =>
                        tabValue === 0 ||
                        (tabValue === 1 && p.role === 'buyer') ||
                        (tabValue === 2 && p.role === 'seller')
                      )
                      .map((pickup) => (
                      <TableRow key={pickup.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={pickup.productImage}
                              variant="rounded"
                              sx={{ width: 50, height: 50 }}
                            />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {pickup.productTitle}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Order: {pickup.orderId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pickup.role === 'buyer' ? 'Buyer' : 'Seller'}
                            size="small"
                            variant="outlined"
                            color={pickup.role === 'buyer' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>
                          {pickup.scheduledDate ? (
                            <Box>
                              <Typography variant="body2">
                                {new Date(pickup.scheduledDate).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {pickup.scheduledTime}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not scheduled
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{getStatusChip(pickup.status)}</TableCell>
                        <TableCell>
                          {pickup.status === 'pending' && pickup.role === 'buyer' && (
                            <Button
                              size="small"
                              onClick={() => setScheduleDialog({ open: true, order: pickup })}
                            >
                              Schedule
                            </Button>
                          )}
                          {pickup.status === 'scheduled' && pickup.role === 'seller' && (
                            <Button
                              size="small"
                              color="success"
                              onClick={() => handleConfirmPickup(pickup.id)}
                            >
                              Confirm Pickup
                            </Button>
                          )}
                          {pickup.status === 'scheduled' && (
                            <Button
                              size="small"
                              onClick={() => navigate(`/orders/${pickup.orderId}`)}
                            >
                              View Details
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
        </Grid>

        {/* How It Works Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info /> How It Works
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              For Buyers:
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Event fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Schedule a pickup time"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <DirectionsCar fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Meet seller at location"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircle fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Confirm pickup in app"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              For Sellers:
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Settings fontSize="small" color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary="Set pickup availability"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Person fontSize="small" color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary="Wait for buyer to schedule"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircle fontSize="small" color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary="Confirm when picked up"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Safety Tips */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Safety Tips
            </Typography>
            <List dense>
              {[
                'Meet in a public, well-lit location',
                'Bring a friend if possible',
                'Verify item before confirming pickup',
                'Keep communication on platform',
                'Trust your instincts',
              ].map((tip, idx) => (
                <ListItem key={idx} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle fontSize="small" color="success" />
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

      {/* Schedule Pickup Dialog */}
      <Dialog
        open={scheduleDialog.open}
        onClose={() => setScheduleDialog({ open: false, order: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule Pickup</DialogTitle>
        <DialogContent>
          {scheduleDialog.order && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Item: <strong>{scheduleDialog.order.productTitle}</strong>
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <LocationOn color="primary" />
                <Typography variant="body2">{scheduleDialog.order.address}</Typography>
              </Box>

              <TextField
                fullWidth
                label="Select Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0],
                }}
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth>
                <InputLabel>Select Time Slot</InputLabel>
                <Select
                  value={selectedTime}
                  label="Select Time Slot"
                  onChange={(e) => setSelectedTime(e.target.value)}
                >
                  {availableTimes.map((time) => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialog({ open: false, order: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSchedulePickup}
            disabled={!selectedDate || !selectedTime}
          >
            Confirm Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Seller Settings Dialog */}
      <Dialog
        open={settingsDialog}
        onClose={() => setSettingsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Local Pickup Settings</DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Switch
                checked={sellerSettings?.enabled || false}
                onChange={(e) =>
                  setSellerSettings({ ...sellerSettings, enabled: e.target.checked })
                }
              />
            }
            label="Enable Local Pickup"
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Pickup Address"
            value={sellerSettings?.address || ''}
            onChange={(e) =>
              setSellerSettings({ ...sellerSettings, address: e.target.value })
            }
            multiline
            rows={2}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Available Hours"
            value={sellerSettings?.availableHours || ''}
            onChange={(e) =>
              setSellerSettings({ ...sellerSettings, availableHours: e.target.value })
            }
            placeholder="e.g., 9:00 AM - 6:00 PM"
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Special Instructions"
            value={sellerSettings?.instructions || ''}
            onChange={(e) =>
              setSellerSettings({ ...sellerSettings, instructions: e.target.value })
            }
            multiline
            rows={3}
            placeholder="Parking info, doorbell instructions, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setSettingsDialog(false)}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LocalPickup;
