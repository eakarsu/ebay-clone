import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Paper,
  Chip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Button,
  IconButton,
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  Info,
  CheckCircle,
  Warning,
} from '@mui/icons-material';

// Category-specific item specifics configurations
const categorySpecifics = {
  clothing: {
    required: ['Brand', 'Size', 'Color', 'Material'],
    optional: ['Style', 'Neckline', 'Sleeve Length', 'Pattern', 'Occasion', 'Season', 'Care Instructions'],
    fields: {
      Brand: { type: 'autocomplete', options: ['Nike', 'Adidas', 'Gucci', 'Prada', 'Zara', 'H&M', 'Unbranded', 'Other'] },
      Size: { type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size'] },
      Color: { type: 'multiselect', options: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Brown', 'Gray', 'Multicolor'] },
      Material: { type: 'autocomplete', options: ['Cotton', 'Polyester', 'Silk', 'Wool', 'Leather', 'Denim', 'Linen', 'Nylon', 'Blend'] },
      Style: { type: 'select', options: ['Casual', 'Formal', 'Sports', 'Vintage', 'Bohemian', 'Streetwear'] },
      Neckline: { type: 'select', options: ['Crew', 'V-Neck', 'Scoop', 'Turtleneck', 'Collared', 'Off-Shoulder'] },
      'Sleeve Length': { type: 'select', options: ['Sleeveless', 'Short Sleeve', '3/4 Sleeve', 'Long Sleeve'] },
      Pattern: { type: 'select', options: ['Solid', 'Striped', 'Plaid', 'Floral', 'Animal Print', 'Geometric', 'Abstract'] },
    },
  },
  electronics: {
    required: ['Brand', 'Model', 'Condition'],
    optional: ['Storage Capacity', 'Color', 'Screen Size', 'Operating System', 'Processor', 'RAM', 'Connectivity'],
    fields: {
      Brand: { type: 'autocomplete', options: ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Microsoft', 'Other'] },
      Model: { type: 'text' },
      Condition: { type: 'select', options: ['New', 'Open Box', 'Refurbished', 'Used - Like New', 'Used - Good', 'Used - Fair', 'For Parts'] },
      'Storage Capacity': { type: 'select', options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'] },
      'Screen Size': { type: 'select', options: ['Under 5"', '5"-6"', '6"-7"', '10"-12"', '13"-15"', '15"-17"', '17"+'] },
      'Operating System': { type: 'select', options: ['iOS', 'Android', 'Windows', 'macOS', 'Linux', 'Chrome OS'] },
    },
  },
  collectibles: {
    required: ['Type', 'Era', 'Condition'],
    optional: ['Authenticity', 'Provenance', 'Certification', 'Edition', 'Signature', 'Year'],
    fields: {
      Type: { type: 'select', options: ['Trading Cards', 'Coins', 'Stamps', 'Memorabilia', 'Antiques', 'Art', 'Comics', 'Toys'] },
      Era: { type: 'select', options: ['Vintage (Pre-1970)', '1970s', '1980s', '1990s', '2000s', '2010s', 'Modern'] },
      Condition: { type: 'select', options: ['Mint', 'Near Mint', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'] },
      Authenticity: { type: 'select', options: ['Certified', 'Uncertified', 'COA Included', 'Authentication Pending'] },
      Certification: { type: 'autocomplete', options: ['PSA', 'BGS', 'CGC', 'PCGS', 'NGC', 'JSA', 'Beckett', 'None'] },
    },
  },
  vehicles: {
    required: ['Make', 'Model', 'Year', 'Mileage', 'VIN', 'Title Status'],
    optional: ['Exterior Color', 'Interior Color', 'Transmission', 'Fuel Type', 'Drive Type', 'Engine', 'Body Type'],
    fields: {
      Make: { type: 'autocomplete', options: ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Tesla', 'Other'] },
      Model: { type: 'text' },
      Year: { type: 'number', min: 1900, max: new Date().getFullYear() + 1 },
      Mileage: { type: 'number', suffix: 'miles' },
      VIN: { type: 'text', maxLength: 17 },
      'Title Status': { type: 'select', options: ['Clean', 'Salvage', 'Rebuilt', 'Flood', 'Lemon', 'Parts Only'] },
      Transmission: { type: 'select', options: ['Automatic', 'Manual', 'CVT', 'Semi-Automatic'] },
      'Fuel Type': { type: 'select', options: ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid'] },
    },
  },
  default: {
    required: ['Brand', 'Condition'],
    optional: ['Color', 'Material', 'Size', 'Model'],
    fields: {
      Brand: { type: 'text' },
      Condition: { type: 'select', options: ['New', 'New with tags', 'New without tags', 'Used', 'For parts or not working'] },
      Color: { type: 'text' },
      Material: { type: 'text' },
      Size: { type: 'text' },
      Model: { type: 'text' },
    },
  },
};

const ItemSpecificsField = ({ name, config, value, onChange, required = false }) => {
  const renderField = () => {
    switch (config.type) {
      case 'select':
        return (
          <FormControl fullWidth size="small" required={required}>
            <InputLabel>{name}</InputLabel>
            <Select
              value={value || ''}
              onChange={(e) => onChange(name, e.target.value)}
              label={name}
            >
              {config.options.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        return (
          <Autocomplete
            multiple
            size="small"
            options={config.options}
            value={value || []}
            onChange={(e, newValue) => onChange(name, newValue)}
            renderInput={(params) => (
              <TextField {...params} label={name} required={required} />
            )}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip label={option} {...getTagProps({ index })} size="small" key={option} />
              ))
            }
          />
        );

      case 'autocomplete':
        return (
          <Autocomplete
            freeSolo
            size="small"
            options={config.options}
            value={value || ''}
            onChange={(e, newValue) => onChange(name, newValue)}
            onInputChange={(e, newValue) => onChange(name, newValue)}
            renderInput={(params) => (
              <TextField {...params} label={name} required={required} />
            )}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            size="small"
            type="number"
            label={name}
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value)}
            required={required}
            InputProps={{
              inputProps: { min: config.min, max: config.max },
              endAdornment: config.suffix ? <Typography variant="caption" color="text.secondary">{config.suffix}</Typography> : null,
            }}
          />
        );

      case 'text':
      default:
        return (
          <TextField
            fullWidth
            size="small"
            label={name}
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value)}
            required={required}
            inputProps={{ maxLength: config.maxLength }}
          />
        );
    }
  };

  return (
    <Grid item xs={12} sm={6} md={4}>
      {renderField()}
    </Grid>
  );
};

const ItemSpecificsForm = ({
  category = 'default',
  values = {},
  onChange,
  showValidation = false,
}) => {
  const [customFields, setCustomFields] = useState([]);
  const config = categorySpecifics[category] || categorySpecifics.default;

  const handleFieldChange = (name, value) => {
    onChange({ ...values, [name]: value });
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { name: '', value: '' }]);
  };

  const updateCustomField = (index, field, value) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);

    // Update values
    const customValues = {};
    updated.forEach(cf => {
      if (cf.name && cf.value) {
        customValues[cf.name] = cf.value;
      }
    });
    onChange({ ...values, ...customValues });
  };

  const removeCustomField = (index) => {
    const removed = customFields[index];
    setCustomFields(customFields.filter((_, i) => i !== index));

    // Remove from values
    if (removed.name) {
      const newValues = { ...values };
      delete newValues[removed.name];
      onChange(newValues);
    }
  };

  const completedRequired = config.required.filter(name => values[name]).length;
  const completedOptional = config.optional.filter(name => values[name]).length;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Item Specifics
        </Typography>
        {showValidation && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {completedRequired === config.required.length ? (
              <Chip
                icon={<CheckCircle />}
                label="All required fields complete"
                color="success"
                size="small"
              />
            ) : (
              <Chip
                icon={<Warning />}
                label={`${completedRequired}/${config.required.length} required`}
                color="warning"
                size="small"
              />
            )}
          </Box>
        )}
      </Box>

      {/* Required Fields */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>Required</Typography>
            <Chip label={`${completedRequired}/${config.required.length}`} size="small" color="primary" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {config.required.map((name) => (
              <ItemSpecificsField
                key={name}
                name={name}
                config={config.fields[name] || { type: 'text' }}
                value={values[name]}
                onChange={handleFieldChange}
                required
              />
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Optional Fields */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>Optional</Typography>
            <Chip label={`${completedOptional}/${config.optional.length}`} size="small" variant="outlined" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {config.optional.map((name) => (
              <ItemSpecificsField
                key={name}
                name={name}
                config={config.fields[name] || { type: 'text' }}
                value={values[name]}
                onChange={handleFieldChange}
              />
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Custom Fields */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>Custom Fields</Typography>
            <Chip label={customFields.length} size="small" variant="outlined" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {customFields.map((field, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Field Name"
                  value={field.name}
                  onChange={(e) => updateCustomField(index, 'name', e.target.value)}
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Value"
                  value={field.value}
                  onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                />
              </Grid>
              <Grid item xs={2}>
                <IconButton onClick={() => removeCustomField(index)} color="error">
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button
            startIcon={<Add />}
            onClick={addCustomField}
            size="small"
          >
            Add Custom Field
          </Button>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Info color="info" fontSize="small" />
          <Typography variant="body2" color="info.dark">
            Adding item specifics helps buyers find your items and can increase your visibility in search results.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

const ItemSpecificsDisplay = ({ specifics = {}, compact = false }) => {
  const entries = Object.entries(specifics).filter(([_, value]) => value);

  if (entries.length === 0) return null;

  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {entries.slice(0, 5).map(([key, value]) => (
          <Chip
            key={key}
            label={`${key}: ${Array.isArray(value) ? value.join(', ') : value}`}
            size="small"
            variant="outlined"
          />
        ))}
        {entries.length > 5 && (
          <Chip label={`+${entries.length - 5} more`} size="small" />
        )}
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Item Specifics
      </Typography>
      <Grid container spacing={1}>
        {entries.map(([key, value]) => (
          <React.Fragment key={key}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                {key}
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography variant="body2">
                {Array.isArray(value) ? value.join(', ') : value}
              </Typography>
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
    </Paper>
  );
};

export { ItemSpecificsForm, ItemSpecificsDisplay, categorySpecifics };
export default ItemSpecificsForm;
