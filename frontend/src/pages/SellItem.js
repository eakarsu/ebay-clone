import React, { useState, useEffect, useRef } from 'react';
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
  IconButton,
  CircularProgress,
  LinearProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  StarBorder,
  AddPhotoAlternate,
} from '@mui/icons-material';
import { categoryService, productService, uploadService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const steps = ['Basic Info', 'Photos', 'Item Details', 'Pricing', 'Shipping', 'Returns'];

const SellItem = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    categoryId: '',
    subcategoryId: '',
    condition: 'new',

    // Step 2: Photos
    images: [],

    // Step 3: Item Details
    description: '',
    brand: '',
    model: '',
    color: '',
    size: '',
    material: '',
    upc: '',

    // Step 4: Pricing
    listingType: 'buy_now',
    buyNowPrice: '',
    startingPrice: '',
    reservePrice: '',
    auctionDuration: 7,
    quantity: 1,
    acceptsOffers: false,
    minimumOfferAmount: '',

    // Step 5: Shipping
    freeShipping: true,
    shippingCost: '',
    shippingFromCity: '',
    shippingFromState: '',
    shippingFromZip: '',
    handlingTime: '1',
    shippingService: 'usps_priority',
    packageWeight: '',
    packageWeightUnit: 'lbs',
    packageLength: '',
    packageWidth: '',
    packageHeight: '',
    dimensionUnit: 'in',
    allowsLocalPickup: false,

    // Step 6: Returns
    acceptsReturns: true,
    returnPeriod: '30',
    returnShippingPaidBy: 'buyer',
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

  // Image handling functions
  const handleFileSelect = async (files) => {
    const validFiles = Array.from(files).filter((file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 5 * 1024 * 1024;
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length === 0) {
      setError('Please select valid image files (JPEG, PNG, WebP, GIF) under 5MB');
      return;
    }

    if (formData.images.length + validFiles.length > 12) {
      setError('Maximum 12 images allowed');
      return;
    }

    setUploadingImages(true);
    setUploadProgress(0);

    try {
      const newImages = [];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const preview = URL.createObjectURL(file);
        newImages.push({
          id: `temp_${Date.now()}_${i}`,
          file,
          preview,
          url: null,
          uploading: true,
        });
        setUploadProgress(((i + 1) / validFiles.length) * 50);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));

      const formDataUpload = new FormData();
      validFiles.forEach((file) => {
        formDataUpload.append('images', file);
      });

      const response = await uploadService.uploadMultiple(formDataUpload);
      setUploadProgress(100);

      setFormData((prev) => {
        const updatedImages = [...prev.images];
        const uploadedUrls = response.data.images;

        let uploadedIndex = 0;
        for (let i = 0; i < updatedImages.length; i++) {
          if (updatedImages[i].uploading && uploadedIndex < uploadedUrls.length) {
            updatedImages[i] = {
              ...updatedImages[i],
              url: uploadedUrls[uploadedIndex].url,
              thumbnail: uploadedUrls[uploadedIndex].thumbnail,
              uploading: false,
            };
            uploadedIndex++;
          }
        }
        return { ...prev, images: updatedImages };
      });
    } catch (err) {
      setError('Error uploading images. Please try again.');
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => !img.uploading),
      }));
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSetPrimary = (index) => {
    setFormData((prev) => {
      const images = [...prev.images];
      const [selected] = images.splice(index, 1);
      images.unshift(selected);
      return { ...prev, images };
    });
  };

  const handleImageInputChange = (e) => {
    handleFileSelect(e.target.files);
    e.target.value = '';
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!formData.title || !formData.categoryId) {
        setError('Please enter a title and select a category');
        return false;
      }
    }
    if (activeStep === 1) {
      if (formData.images.length === 0) {
        setError('Please upload at least one photo');
        return false;
      }
      if (formData.images.some((img) => img.uploading)) {
        setError('Please wait for images to finish uploading');
        return false;
      }
    }
    if (activeStep === 2) {
      if (!formData.description) {
        setError('Please enter a description');
        return false;
      }
    }
    if (activeStep === 3) {
      if (formData.listingType === 'buy_now' && !formData.buyNowPrice) {
        setError('Please enter a Buy It Now price');
        return false;
      }
      if ((formData.listingType === 'auction' || formData.listingType === 'both') && !formData.startingPrice) {
        setError('Please enter a starting price');
        return false;
      }
    }
    if (activeStep === 4) {
      if (!formData.shippingFromCity || !formData.shippingFromState || !formData.shippingFromZip) {
        setError('Please enter complete shipping location');
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
        handlingTime: parseInt(formData.handlingTime),
        returnPeriod: parseInt(formData.returnPeriod),
        packageWeight: formData.packageWeight ? parseFloat(formData.packageWeight) : null,
        packageLength: formData.packageLength ? parseFloat(formData.packageLength) : null,
        packageWidth: formData.packageWidth ? parseFloat(formData.packageWidth) : null,
        packageHeight: formData.packageHeight ? parseFloat(formData.packageHeight) : null,
        minimumOfferAmount: formData.minimumOfferAmount ? parseFloat(formData.minimumOfferAmount) : null,
        images: formData.images.map((img) => ({ url: img.url, thumbnail: img.thumbnail })),
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

  const shippingServices = [
    { value: 'usps_priority', label: 'USPS Priority Mail' },
    { value: 'usps_ground', label: 'USPS Ground Advantage' },
    { value: 'usps_first_class', label: 'USPS First Class' },
    { value: 'ups_ground', label: 'UPS Ground' },
    { value: 'ups_2day', label: 'UPS 2nd Day Air' },
    { value: 'ups_next_day', label: 'UPS Next Day Air' },
    { value: 'fedex_ground', label: 'FedEx Ground' },
    { value: 'fedex_express', label: 'FedEx Express' },
    { value: 'fedex_2day', label: 'FedEx 2Day' },
  ];

  const handlingTimes = [
    { value: '1', label: '1 business day' },
    { value: '2', label: '2 business days' },
    { value: '3', label: '3 business days' },
    { value: '5', label: '5 business days' },
    { value: '10', label: '10 business days' },
  ];

  const returnPeriods = [
    { value: '14', label: '14 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
  ];

  // Step 1: Basic Information
  const renderBasicInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="e.g., iPhone 15 Pro Max 256GB - Brand New Sealed"
          helperText={`${formData.title.length}/80 characters`}
          inputProps={{ maxLength: 80 }}
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
    </Grid>
  );

  // Step 2: Photos
  const renderPhotos = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>Photos</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Add up to 12 photos. The first photo will be your main listing image.
      </Typography>

      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: `2px dashed ${dragOver ? '#3665f3' : '#ccc'}`,
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragOver ? 'rgba(54, 101, 243, 0.05)' : 'transparent',
          transition: 'all 0.2s ease',
          mb: 3,
          '&:hover': { borderColor: '#3665f3', bgcolor: 'rgba(54, 101, 243, 0.02)' },
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageInputChange}
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          style={{ display: 'none' }}
        />
        <CloudUpload sx={{ fontSize: 48, color: dragOver ? '#3665f3' : '#666', mb: 1 }} />
        <Typography variant="h6" color={dragOver ? 'primary' : 'textSecondary'}>
          Drag and drop photos here
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          or click to browse (JPEG, PNG, WebP, GIF - max 5MB each)
        </Typography>
        <Button variant="outlined" startIcon={<AddPhotoAlternate />} sx={{ mt: 2 }}
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
          Select Photos
        </Button>
      </Box>

      {uploadingImages && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>Uploading images...</Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {formData.images.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {formData.images.length} of 12 photos added
          </Typography>
          <Grid container spacing={2}>
            {formData.images.map((image, index) => (
              <Grid item xs={6} sm={4} md={3} key={image.id || index}>
                <Paper elevation={2} sx={{
                  position: 'relative', paddingTop: '100%', borderRadius: 2, overflow: 'hidden',
                  border: index === 0 ? '3px solid #3665f3' : 'none',
                }}>
                  <Box component="img" src={image.preview || image.url} alt={`Preview ${index + 1}`}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      objectFit: 'cover', opacity: image.uploading ? 0.5 : 1 }} />
                  {image.uploading && (
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                      <CircularProgress size={32} />
                    </Box>
                  )}
                  {index === 0 && (
                    <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: '#3665f3', color: 'white',
                      px: 1, py: 0.5, borderRadius: 1, fontSize: 12, fontWeight: 600 }}>
                      Main Photo
                    </Box>
                  )}
                  {!image.uploading && (
                    <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 0.5 }}>
                      {index !== 0 && (
                        <IconButton size="small" onClick={() => handleSetPrimary(index)}
                          sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }} title="Set as main photo">
                          <StarBorder fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => handleRemoveImage(index)}
                        sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#ffebee' } }} title="Remove photo">
                        <Delete fontSize="small" color="error" />
                      </IconButton>
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
            {formData.images.length < 12 && (
              <Grid item xs={6} sm={4} md={3}>
                <Paper elevation={0} onClick={() => fileInputRef.current?.click()}
                  sx={{ position: 'relative', paddingTop: '100%', borderRadius: 2,
                    border: '2px dashed #ccc', cursor: 'pointer', '&:hover': { borderColor: '#3665f3' } }}>
                  <Box sx={{ position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <AddPhotoAlternate sx={{ fontSize: 32, color: '#666' }} />
                    <Typography variant="caption" display="block" color="text.secondary">Add more</Typography>
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Box>
  );

  // Step 3: Item Details
  const renderItemDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2 }}>Item Details</Typography>
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
          placeholder="Describe your item in detail. Include features, condition details, and any flaws."
        />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" sx={{ mb: 2, mt: 2 }}>Item Specifics</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Brand" name="brand" value={formData.brand} onChange={handleChange} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Model" name="model" value={formData.model} onChange={handleChange} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField fullWidth label="Color" name="color" value={formData.color} onChange={handleChange} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField fullWidth label="Size" name="size" value={formData.size} onChange={handleChange} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField fullWidth label="Material" name="material" value={formData.material} onChange={handleChange} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField fullWidth label="UPC/ISBN" name="upc" value={formData.upc} onChange={handleChange}
          placeholder="Optional" />
      </Grid>
    </Grid>
  );

  // Step 4: Pricing
  const renderPricing = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2 }}>Pricing</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Listing Format</Typography>
        <RadioGroup name="listingType" value={formData.listingType} onChange={handleChange}>
          <FormControlLabel value="buy_now" control={<Radio />} label="Buy It Now - Fixed price" />
          <FormControlLabel value="auction" control={<Radio />} label="Auction - Bidding with starting price" />
          <FormControlLabel value="both" control={<Radio />} label="Auction with Buy It Now option" />
        </RadioGroup>
      </Grid>

      {(formData.listingType === 'buy_now' || formData.listingType === 'both') && (
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Buy It Now Price" name="buyNowPrice" type="number"
            value={formData.buyNowPrice} onChange={handleChange} required
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
        </Grid>
      )}

      {(formData.listingType === 'auction' || formData.listingType === 'both') && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Starting Price" name="startingPrice" type="number"
              value={formData.startingPrice} onChange={handleChange} required
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Reserve Price (optional)" name="reservePrice" type="number"
              value={formData.reservePrice} onChange={handleChange}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              helperText="Minimum price you'll accept" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Auction Duration</InputLabel>
              <Select name="auctionDuration" value={formData.auctionDuration}
                onChange={handleChange} label="Auction Duration">
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
        <TextField fullWidth label="Quantity" name="quantity" type="number"
          value={formData.quantity} onChange={handleChange} inputProps={{ min: 1 }} />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={<Checkbox checked={formData.acceptsOffers} onChange={handleChange} name="acceptsOffers" />}
          label="Allow Best Offer - Let buyers negotiate on price"
        />
      </Grid>

      {formData.acceptsOffers && (
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Minimum Offer Amount (optional)" name="minimumOfferAmount" type="number"
            value={formData.minimumOfferAmount} onChange={handleChange}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            helperText="Auto-decline offers below this amount" />
        </Grid>
      )}
    </Grid>
  );

  // Step 5: Shipping
  const renderShipping = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2 }}>Shipping</Typography>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Shipping Cost</Typography>
        <FormControlLabel
          control={<Checkbox checked={formData.freeShipping} onChange={handleChange} name="freeShipping" />}
          label="Free shipping"
        />
      </Grid>

      {!formData.freeShipping && (
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Shipping Cost" name="shippingCost" type="number"
            value={formData.shippingCost} onChange={handleChange} required
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
        </Grid>
      )}

      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" sx={{ mb: 2, mt: 2 }}>Ship From Location</Typography>
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="City" name="shippingFromCity" value={formData.shippingFromCity}
          onChange={handleChange} required />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="State" name="shippingFromState" value={formData.shippingFromState}
          onChange={handleChange} required />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="ZIP Code" name="shippingFromZip" value={formData.shippingFromZip}
          onChange={handleChange} required />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" sx={{ mb: 2, mt: 2 }}>Shipping Details</Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Handling Time</InputLabel>
          <Select name="handlingTime" value={formData.handlingTime} onChange={handleChange} label="Handling Time">
            {handlingTimes.map((ht) => (
              <MenuItem key={ht.value} value={ht.value}>{ht.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Shipping Service</InputLabel>
          <Select name="shippingService" value={formData.shippingService}
            onChange={handleChange} label="Shipping Service">
            {shippingServices.map((ss) => (
              <MenuItem key={ss.value} value={ss.value}>{ss.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" sx={{ mb: 2, mt: 2 }}>Package Details (Optional)</Typography>
      </Grid>

      <Grid item xs={6} sm={3}>
        <TextField fullWidth label="Weight" name="packageWeight" type="number"
          value={formData.packageWeight} onChange={handleChange}
          InputProps={{ endAdornment: <InputAdornment position="end">lbs</InputAdornment> }} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField fullWidth label="Length" name="packageLength" type="number"
          value={formData.packageLength} onChange={handleChange}
          InputProps={{ endAdornment: <InputAdornment position="end">in</InputAdornment> }} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField fullWidth label="Width" name="packageWidth" type="number"
          value={formData.packageWidth} onChange={handleChange}
          InputProps={{ endAdornment: <InputAdornment position="end">in</InputAdornment> }} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField fullWidth label="Height" name="packageHeight" type="number"
          value={formData.packageHeight} onChange={handleChange}
          InputProps={{ endAdornment: <InputAdornment position="end">in</InputAdornment> }} />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={<Checkbox checked={formData.allowsLocalPickup} onChange={handleChange} name="allowsLocalPickup" />}
          label="Offer local pickup - Buyers can pick up the item in person"
        />
      </Grid>
    </Grid>
  );

  // Step 6: Returns
  const renderReturns = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2 }}>Returns</Typography>
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={<Checkbox checked={formData.acceptsReturns} onChange={handleChange} name="acceptsReturns" />}
          label="Accept returns"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          Accepting returns can help increase buyer confidence and sales
        </Typography>
      </Grid>

      {formData.acceptsReturns && (
        <>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Return Period</InputLabel>
              <Select name="returnPeriod" value={formData.returnPeriod}
                onChange={handleChange} label="Return Period">
                {returnPeriods.map((rp) => (
                  <MenuItem key={rp.value} value={rp.value}>{rp.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Return Shipping Paid By</InputLabel>
              <Select name="returnShippingPaidBy" value={formData.returnShippingPaidBy}
                onChange={handleChange} label="Return Shipping Paid By">
                <MenuItem value="buyer">Buyer</MenuItem>
                <MenuItem value="seller">Seller (Free returns)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Alert severity="info">
          By listing this item, you agree to comply with all applicable laws and marketplace policies.
        </Alert>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
        Create Listing
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
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
        {activeStep === 0 && renderBasicInfo()}
        {activeStep === 1 && renderPhotos()}
        {activeStep === 2 && renderItemDetails()}
        {activeStep === 3 && renderPricing()}
        {activeStep === 4 && renderShipping()}
        {activeStep === 5 && renderReturns()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext} sx={{ bgcolor: '#3665f3' }}>
              Continue
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ bgcolor: '#3665f3' }}>
              {loading ? 'Creating...' : 'List Item'}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default SellItem;
