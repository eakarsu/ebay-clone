import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  TextField,
  MenuItem,
  Button,
  Divider,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from '@mui/material';
import {
  Calculate,
  Public,
  LocalShipping,
  Info,
  ExpandMore,
  AttachMoney,
} from '@mui/icons-material';

const countries = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'UK', name: 'United Kingdom', currency: 'GBP' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'JP', name: 'Japan', currency: 'JPY' },
  { code: 'CN', name: 'China', currency: 'CNY' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'BR', name: 'Brazil', currency: 'BRL' },
  { code: 'MX', name: 'Mexico', currency: 'MXN' },
];

const categories = [
  { value: 'electronics', label: 'Electronics', dutyRate: 0.02 },
  { value: 'clothing', label: 'Clothing & Apparel', dutyRate: 0.12 },
  { value: 'jewelry', label: 'Jewelry & Watches', dutyRate: 0.065 },
  { value: 'collectibles', label: 'Collectibles & Art', dutyRate: 0.0 },
  { value: 'toys', label: 'Toys & Hobbies', dutyRate: 0.0 },
  { value: 'sports', label: 'Sporting Goods', dutyRate: 0.04 },
  { value: 'home', label: 'Home & Garden', dutyRate: 0.035 },
  { value: 'automotive', label: 'Auto Parts', dutyRate: 0.025 },
  { value: 'books', label: 'Books & Media', dutyRate: 0.0 },
  { value: 'health', label: 'Health & Beauty', dutyRate: 0.0 },
];

const taxRates = {
  US: 0.0,
  UK: 0.20,
  CA: 0.05,
  AU: 0.10,
  DE: 0.19,
  FR: 0.20,
  JP: 0.10,
  CN: 0.13,
  IN: 0.18,
  BR: 0.17,
  MX: 0.16,
};

const faqs = [
  {
    question: 'What are import duties?',
    answer: 'Import duties are taxes imposed by a government on goods imported from other countries. They vary based on the type of product, its value, and the destination country.',
  },
  {
    question: 'Who pays import duties?',
    answer: 'The buyer (importer) is typically responsible for paying import duties and taxes when goods arrive in their country. Some sellers offer DDP (Delivered Duty Paid) shipping where they cover these costs.',
  },
  {
    question: 'How accurate is this calculator?',
    answer: 'This calculator provides estimates based on general duty rates. Actual duties may vary based on specific product classifications (HS codes), trade agreements, and current regulations.',
  },
  {
    question: 'What is de minimis value?',
    answer: 'De minimis is the threshold below which no duties are charged. For example, the US has a de minimis of $800, meaning imports under this value enter duty-free.',
  },
  {
    question: 'Are there any items exempt from duties?',
    answer: 'Yes, certain items like personal effects, gifts under a certain value, and some categories (like books) may be exempt or have reduced duty rates depending on the country.',
  },
];

const ImportDuties = () => {
  const [fromCountry, setFromCountry] = useState('US');
  const [toCountry, setToCountry] = useState('UK');
  const [category, setCategory] = useState('electronics');
  const [itemValue, setItemValue] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [calculated, setCalculated] = useState(null);

  const calculateDuties = () => {
    const value = parseFloat(itemValue) || 0;
    const shipping = parseFloat(shippingCost) || 0;
    const totalValue = value + shipping;

    const selectedCategory = categories.find(c => c.value === category);
    const dutyRate = selectedCategory?.dutyRate || 0;
    const taxRate = taxRates[toCountry] || 0;

    // Calculate duty on item value
    const dutyAmount = value * dutyRate;

    // Calculate VAT/GST on (item + shipping + duty)
    const taxableAmount = totalValue + dutyAmount;
    const taxAmount = taxableAmount * taxRate;

    // Processing/handling fee estimate
    const handlingFee = taxAmount > 0 ? 15 : 0;

    setCalculated({
      itemValue: value,
      shippingCost: shipping,
      dutyRate: dutyRate * 100,
      dutyAmount,
      taxRate: taxRate * 100,
      taxAmount,
      handlingFee,
      totalFees: dutyAmount + taxAmount + handlingFee,
      grandTotal: totalValue + dutyAmount + taxAmount + handlingFee,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Calculate sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          Import Duties Calculator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Estimate import duties, taxes, and fees for international purchases
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Calculator */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Calculate Your Fees
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Shipping From"
                  value={fromCountry}
                  onChange={(e) => setFromCountry(e.target.value)}
                >
                  {countries.map((c) => (
                    <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Shipping To"
                  value={toCountry}
                  onChange={(e) => setToCountry(e.target.value)}
                >
                  {countries.map((c) => (
                    <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Product Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label} ({(c.dutyRate * 100).toFixed(1)}% duty)
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Item Value"
                  type="number"
                  value={itemValue}
                  onChange={(e) => setItemValue(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Shipping Cost"
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={calculateDuties}
                  startIcon={<Calculate />}
                  disabled={!itemValue}
                >
                  Calculate Fees
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Results */}
          {calculated && (
            <Paper sx={{ p: 4, mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Estimated Fees
              </Typography>

              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Item Value</TableCell>
                      <TableCell align="right">${calculated.itemValue.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Shipping Cost</TableCell>
                      <TableCell align="right">${calculated.shippingCost.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        Import Duty ({calculated.dutyRate.toFixed(1)}%)
                      </TableCell>
                      <TableCell align="right">${calculated.dutyAmount.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        VAT/GST ({calculated.taxRate.toFixed(1)}%)
                      </TableCell>
                      <TableCell align="right">${calculated.taxAmount.toFixed(2)}</TableCell>
                    </TableRow>
                    {calculated.handlingFee > 0 && (
                      <TableRow>
                        <TableCell>Processing Fee (est.)</TableCell>
                        <TableCell align="right">${calculated.handlingFee.toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Total Import Fees</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                        ${calculated.totalFees.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: 'primary.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Grand Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.2rem' }}>
                        ${calculated.grandTotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Alert severity="info" sx={{ mt: 3 }}>
                This is an estimate only. Actual duties and taxes may vary based on exact product
                classification and current regulations. Contact your local customs office for precise information.
              </Alert>
            </Paper>
          )}
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Info color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Important Information
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                When buying items internationally, you may be subject to import duties and taxes
                charged by your country's customs authority.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                These fees are in addition to the item price and shipping cost, and are typically
                collected upon delivery or when you pick up your package.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Some eBay sellers offer Global Shipping Program which includes all fees upfront,
                eliminating surprise charges.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                De Minimis Thresholds
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Goods below these values typically enter duty-free:
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow><TableCell>United States</TableCell><TableCell>$800</TableCell></TableRow>
                  <TableRow><TableCell>Canada</TableCell><TableCell>CAD $20</TableCell></TableRow>
                  <TableRow><TableCell>United Kingdom</TableCell><TableCell>£135</TableCell></TableRow>
                  <TableRow><TableCell>Australia</TableCell><TableCell>AUD $1,000</TableCell></TableRow>
                  <TableRow><TableCell>EU Countries</TableCell><TableCell>€150</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Frequently Asked Questions
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ImportDuties;
