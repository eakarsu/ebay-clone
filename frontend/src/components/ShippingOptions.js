import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  InputAdornment,
  Collapse,
  Switch,
} from '@mui/material';
import {
  LocalShipping,
  Store,
  Schedule,
  CheckCircle,
  Add,
  Delete,
  Edit,
  LocationOn,
  AccessTime,
  Savings,
  Info,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

// Combined Shipping Calculator Component
const CombinedShippingCalculator = ({
  items = [],
  sellerRules = null,
  onCalculate,
}) => {
  const defaultRules = {
    firstItemShipping: 0,
    additionalItemDiscount: 0,
    maxDiscount: 0,
    freeShippingThreshold: null,
  };

  const rules = sellerRules || defaultRules;

  // Calculate combined shipping
  const calculateShipping = () => {
    if (items.length === 0) return 0;

    // Check if free shipping threshold is met
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (rules.freeShippingThreshold && totalValue >= rules.freeShippingThreshold) {
      return 0;
    }

    // Calculate with combined shipping discount
    const sortedItems = [...items].sort((a, b) => b.shippingCost - a.shippingCost);
    let totalShipping = 0;

    sortedItems.forEach((item, index) => {
      if (index === 0) {
        // First item pays full shipping
        totalShipping += item.shippingCost * item.quantity;
      } else {
        // Additional items get discount
        const discountedRate = Math.max(
          0,
          item.shippingCost - rules.additionalItemDiscount
        );
        totalShipping += discountedRate * item.quantity;
      }
    });

    return Math.max(0, totalShipping);
  };

  const regularShipping = items.reduce((sum, item) => sum + (item.shippingCost * item.quantity), 0);
  const combinedShipping = calculateShipping();
  const savings = regularShipping - combinedShipping;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LocalShipping color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Combined Shipping
        </Typography>
      </Box>

      {items.length > 1 && savings > 0 && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<Savings />}>
          Save ${savings.toFixed(2)} with combined shipping!
        </Alert>
      )}

      <List dense>
        {items.map((item, index) => (
          <ListItem key={item.id}>
            <ListItemText
              primary={item.title}
              secondary={`Qty: ${item.quantity}`}
            />
            <Typography variant="body2">
              {index === 0 ? (
                `$${item.shippingCost.toFixed(2)}`
              ) : (
                <Box component="span">
                  <Typography
                    component="span"
                    sx={{ textDecoration: 'line-through', color: 'text.secondary', mr: 1 }}
                  >
                    ${item.shippingCost.toFixed(2)}
                  </Typography>
                  <Typography component="span" color="success.main">
                    ${Math.max(0, item.shippingCost - rules.additionalItemDiscount).toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Typography>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Total Shipping
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          {savings > 0 && (
            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
              ${regularShipping.toFixed(2)}
            </Typography>
          )}
          <Typography variant="h6" color={combinedShipping === 0 ? 'success.main' : 'primary'}>
            {combinedShipping === 0 ? 'FREE' : `$${combinedShipping.toFixed(2)}`}
          </Typography>
        </Box>
      </Box>

      {rules.freeShippingThreshold && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <Info sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
            Free shipping on orders ${rules.freeShippingThreshold}+
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// Combined Shipping Settings (for sellers)
const CombinedShippingSettings = ({
  settings = {},
  onChange,
}) => {
  const [enabled, setEnabled] = useState(settings.enabled || false);
  const [additionalDiscount, setAdditionalDiscount] = useState(settings.additionalDiscount || 0);
  const [freeThreshold, setFreeThreshold] = useState(settings.freeThreshold || '');

  const handleSave = () => {
    onChange({
      enabled,
      additionalDiscount: parseFloat(additionalDiscount) || 0,
      freeThreshold: freeThreshold ? parseFloat(freeThreshold) : null,
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Combined Shipping Rules
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          }
          label={enabled ? 'Enabled' : 'Disabled'}
        />
      </Box>

      <Collapse in={enabled}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Discount per additional item"
              type="number"
              value={additionalDiscount}
              onChange={(e) => setAdditionalDiscount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Amount to deduct from shipping for each additional item"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Free shipping threshold (optional)"
              type="number"
              value={freeThreshold}
              onChange={(e) => setFreeThreshold(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Orders above this amount get free shipping"
            />
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Combined shipping encourages buyers to purchase multiple items.
            The first item pays full shipping, additional items get the discount you set.
          </Typography>
        </Alert>

        <Button variant="contained" onClick={handleSave} sx={{ mt: 2 }}>
          Save Settings
        </Button>
      </Collapse>
    </Paper>
  );
};

// Local Pickup Component
const LocalPickupOption = ({
  enabled = false,
  location = {},
  availability = {},
  onChange,
  onSelect,
  viewMode = false, // true for buyer view, false for seller settings
}) => {
  const [expanded, setExpanded] = useState(false);
  const [pickupDetails, setPickupDetails] = useState({
    enabled: enabled,
    address: location.address || '',
    city: location.city || '',
    state: location.state || '',
    zipCode: location.zipCode || '',
    instructions: location.instructions || '',
    availableDays: availability.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: availability.startTime || '09:00',
    endTime: availability.endTime || '17:00',
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDayToggle = (day) => {
    const newDays = pickupDetails.availableDays.includes(day)
      ? pickupDetails.availableDays.filter(d => d !== day)
      : [...pickupDetails.availableDays, day];
    setPickupDetails({ ...pickupDetails, availableDays: newDays });
  };

  if (viewMode) {
    // Buyer view
    return (
      <Card
        sx={{
          border: '1px solid',
          borderColor: enabled ? 'success.main' : 'grey.300',
          cursor: 'pointer',
        }}
        onClick={onSelect}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Store color={enabled ? 'success' : 'action'} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Local Pickup
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pick up in person - Free
              </Typography>
            </Box>
            <Typography variant="h6" color="success.main">
              FREE
            </Typography>
          </Box>

          {enabled && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2">
                  {location.city}, {location.state} {location.zipCode}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2">
                  {availability.days?.join(', ')} • {availability.startTime} - {availability.endTime}
                </Typography>
              </Box>
              {location.instructions && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {location.instructions}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // Seller settings view
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Store color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Local Pickup
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={pickupDetails.enabled}
              onChange={(e) => setPickupDetails({ ...pickupDetails, enabled: e.target.checked })}
            />
          }
          label={pickupDetails.enabled ? 'Enabled' : 'Disabled'}
        />
      </Box>

      <Collapse in={pickupDetails.enabled}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Pickup Address"
              value={pickupDetails.address}
              onChange={(e) => setPickupDetails({ ...pickupDetails, address: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="City"
              value={pickupDetails.city}
              onChange={(e) => setPickupDetails({ ...pickupDetails, city: e.target.value })}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              label="State"
              value={pickupDetails.state}
              onChange={(e) => setPickupDetails({ ...pickupDetails, state: e.target.value })}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              label="ZIP Code"
              value={pickupDetails.zipCode}
              onChange={(e) => setPickupDetails({ ...pickupDetails, zipCode: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Pickup Instructions (optional)"
              value={pickupDetails.instructions}
              onChange={(e) => setPickupDetails({ ...pickupDetails, instructions: e.target.value })}
              placeholder="e.g., Call when you arrive, enter through side door"
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
          Available Days
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {daysOfWeek.map((day) => (
            <Chip
              key={day}
              label={day.slice(0, 3)}
              onClick={() => handleDayToggle(day)}
              color={pickupDetails.availableDays.includes(day) ? 'primary' : 'default'}
              variant={pickupDetails.availableDays.includes(day) ? 'filled' : 'outlined'}
            />
          ))}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="time"
              label="Start Time"
              value={pickupDetails.startTime}
              onChange={(e) => setPickupDetails({ ...pickupDetails, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="time"
              label="End Time"
              value={pickupDetails.endTime}
              onChange={(e) => setPickupDetails({ ...pickupDetails, endTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={() => onChange && onChange(pickupDetails)}
        >
          Save Pickup Settings
        </Button>
      </Collapse>
    </Paper>
  );
};

// Shipping Method Selector (for checkout)
const ShippingMethodSelector = ({
  shippingOptions = [],
  localPickupAvailable = false,
  localPickupDetails = {},
  selectedMethod,
  onSelect,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Shipping Method
      </Typography>

      <RadioGroup
        value={selectedMethod}
        onChange={(e) => onSelect(e.target.value)}
      >
        {shippingOptions.map((option) => (
          <Card
            key={option.id}
            sx={{
              mb: 2,
              border: '1px solid',
              borderColor: selectedMethod === option.id ? 'primary.main' : 'grey.300',
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                value={option.id}
                control={<Radio />}
                label=""
                sx={{ mr: 0 }}
              />
              <LocalShipping color="action" sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{option.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.estimatedDays}
                </Typography>
              </Box>
              <Typography variant="h6">
                {option.cost === 0 ? 'FREE' : `$${option.cost.toFixed(2)}`}
              </Typography>
            </CardContent>
          </Card>
        ))}

        {localPickupAvailable && (
          <Card
            sx={{
              border: '1px solid',
              borderColor: selectedMethod === 'local-pickup' ? 'success.main' : 'grey.300',
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                value="local-pickup"
                control={<Radio />}
                label=""
                sx={{ mr: 0 }}
              />
              <Store color="action" sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Local Pickup</Typography>
                <Typography variant="body2" color="text.secondary">
                  {localPickupDetails.city}, {localPickupDetails.state}
                </Typography>
              </Box>
              <Typography variant="h6" color="success.main">
                FREE
              </Typography>
            </CardContent>
          </Card>
        )}
      </RadioGroup>
    </Paper>
  );
};

export {
  CombinedShippingCalculator,
  CombinedShippingSettings,
  LocalPickupOption,
  ShippingMethodSelector,
};

export default ShippingMethodSelector;
