import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { categoryService, productService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const steps = ['Details', 'Pricing', 'Shipping'];

const SellItem = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    condition: 'new',
    brand: '',
    model: '',
    color: '',
    size: '',

    listingType: 'buy_now',
    buyNowPrice: '',
    startingPrice: '',
    reservePrice: '',
    auctionDuration: 7,
    quantity: 1,

    freeShipping: true,
    shippingCost: '',
    shippingFromCity: '',
    shippingFromState: '',
    estimatedDeliveryDays: '',

    images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' }],
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/sell' } } });
      return;
    }

    categoryService.getWithSubcategories().then((res) => {
      setCategories(res.data.categories);
    });
  }, [user, navigate]);

  useEffect(() => {
    if (formData.categoryId) {
      const cat = categories.find((c) => c.id === formData.categoryId);
      setSubcategories(cat?.subcategories || []);
    }
  }, [formData.categoryId, categories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!formData.title || !formData.description || !formData.categoryId) {
        setError('Please fill in all required fields');
        return false;
      }
    }
    if (activeStep === 1) {
      if (formData.listingType === 'buy_now' && !formData.buyNowPrice) {
        setError('Please enter a Buy It Now price');
        return false;
      }
      if ((formData.listingType === 'auction' || formData.listingType === 'both') && !formData.startingPrice) {
        setError('Please enter a starting price');
        return false;
      }
    }
    if (activeStep === 2) {
      if (!formData.shippingFromCity || !formData.shippingFromState) {
        setError('Please enter shipping location');
        return false;
      }
      if (!formData.freeShipping && !formData.shippingCost) {
        setError('Please enter shipping cost');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setError('');
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');

    try {
      const productData = {
        ...formData,
        buyNowPrice: formData.buyNowPrice ? parseFloat(formData.buyNowPrice) : null,
        startingPrice: formData.startingPrice ? parseFloat(formData.startingPrice) : null,
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
        shippingCost: formData.shippingCost ? parseFloat(formData.shippingCost) : 0,
        quantity: parseInt(formData.quantity),
        auctionDuration: parseInt(formData.auctionDuration),
        estimatedDeliveryDays: formData.estimatedDeliveryDays ? parseInt(formData.estimatedDeliveryDays) : null,
      };

      const response = await productService.create(productData);

      if (!user.isSeller) {
        updateUser({ ...user, isSeller: true });
      }

      navigate(`/product/${response.data.product.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating listing');
    } finally {
      setLoading(false);
    }
  };

  const conditions = [
    { value: 'new', label: 'Brand New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'very_good', label: 'Very Good' },
    { value: 'good', label: 'Good' },
    { value: 'acceptable', label: 'Acceptable' },
    { value: 'for_parts', label: 'For Parts or Not Working' },
  ];

  const renderDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="e.g., iPhone 15 Pro Max 256GB - Brand New Sealed"
          helperText="80 characters max"
          inputProps={{ maxLength: 80 }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={6}
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="Describe your item in detail..."
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Category</InputLabel>
          <Select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            label="Category"
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Subcategory</InputLabel>
          <Select
            name="subcategoryId"
            value={formData.subcategoryId}
            onChange={handleChange}
            label="Subcategory"
            disabled={!formData.categoryId}
          >
            <MenuItem value="">None</MenuItem>
            {subcategories.map((sub) => (
              <MenuItem key={sub.id} value={sub.id}>
                {sub.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Condition</InputLabel>
          <Select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            label="Condition"
          >
            {conditions.map((cond) => (
              <MenuItem key={cond.value} value={cond.value}>
                {cond.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Brand"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Model"
          name="model"
          value={formData.model}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField
          fullWidth
          label="Color"
          name="color"
          value={formData.color}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField
          fullWidth
          label="Size"
          name="size"
          value={formData.size}
          onChange={handleChange}
        />
      </Grid>
    </Grid>
  );

  const renderPricing = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Listing Format
        </Typography>
        <RadioGroup
          name="listingType"
          value={formData.listingType}
          onChange={handleChange}
        >
          <FormControlLabel
            value="buy_now"
            control={<Radio />}
            label="Buy It Now only"
          />
          <FormControlLabel
            value="auction"
            control={<Radio />}
            label="Auction only"
          />
          <FormControlLabel
            value="both"
            control={<Radio />}
            label="Auction with Buy It Now option"
          />
        </RadioGroup>
      </Grid>

      {(formData.listingType === 'buy_now' || formData.listingType === 'both') && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Buy It Now Price"
            name="buyNowPrice"
            type="number"
            value={formData.buyNowPrice}
            onChange={handleChange}
            required
            InputProps={{ startAdornment: '$' }}
          />
        </Grid>
      )}

      {(formData.listingType === 'auction' || formData.listingType === 'both') && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Starting Price"
              name="startingPrice"
              type="number"
              value={formData.startingPrice}
              onChange={handleChange}
              required
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Reserve Price (optional)"
              name="reservePrice"
              type="number"
              value={formData.reservePrice}
              onChange={handleChange}
              InputProps={{ startAdornment: '$' }}
              helperText="Minimum price you'll accept"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Auction Duration</InputLabel>
              <Select
                name="auctionDuration"
                value={formData.auctionDuration}
                onChange={handleChange}
                label="Auction Duration"
              >
                <MenuItem value={1}>1 day</MenuItem>
                <MenuItem value={3}>3 days</MenuItem>
                <MenuItem value={5}>5 days</MenuItem>
                <MenuItem value={7}>7 days</MenuItem>
                <MenuItem value={10}>10 days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </>
      )}

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          inputProps={{ min: 1 }}
        />
      </Grid>
    </Grid>
  );

  const renderShipping = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.freeShipping}
              onChange={handleChange}
              name="freeShipping"
            />
          }
          label="Free shipping"
        />
      </Grid>

      {!formData.freeShipping && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Shipping Cost"
            name="shippingCost"
            type="number"
            value={formData.shippingCost}
            onChange={handleChange}
            required
            InputProps={{ startAdornment: '$' }}
          />
        </Grid>
      )}

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Ships From City"
          name="shippingFromCity"
          value={formData.shippingFromCity}
          onChange={handleChange}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Ships From State"
          name="shippingFromState"
          value={formData.shippingFromState}
          onChange={handleChange}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Estimated Delivery (days)"
          name="estimatedDeliveryDays"
          type="number"
          value={formData.estimatedDeliveryDays}
          onChange={handleChange}
          inputProps={{ min: 1 }}
        />
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
        Create Listing
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 4 }}>
        {activeStep === 0 && renderDetails()}
        {activeStep === 1 && renderPricing()}
        {activeStep === 2 && renderShipping()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext} sx={{ bgcolor: '#3665f3' }}>
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{ bgcolor: '#3665f3' }}
            >
              {loading ? 'Creating...' : 'List Item'}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default SellItem;
