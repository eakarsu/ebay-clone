import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Divider,
} from '@mui/material';
import { TrendingUp, Star, AutoAwesome } from '@mui/icons-material';
import { aiService } from '../services/api';

const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const AIDemandReputation = () => {
  const [tab, setTab] = useState(0);

  // demand state
  const [category, setCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [season, setSeason] = useState('');
  const [history, setHistory] = useState('');

  // reputation state
  const [sellerId, setSellerId] = useState('');
  const [horizonDays, setHorizonDays] = useState('90');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const reset = () => {
    setError(null);
    setResult(null);
  };

  const handleTabChange = (_, v) => {
    setTab(v);
    reset();
  };

  const handleDemandSubmit = async (e) => {
    e.preventDefault();
    reset();
    if (!category.trim() && !productName.trim()) {
      setError('Provide at least a category or product name.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        category: category.trim() || undefined,
        product_name: productName.trim() || undefined,
        season: season.trim() || undefined,
        history: history.trim() || undefined,
      };
      const res = await aiService.predictDemand(payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReputationSubmit = async (e) => {
    e.preventDefault();
    reset();
    if (!sellerId.trim()) {
      setError('Seller ID is required.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        seller_id: sellerId.trim(),
        horizon_days: horizonDays ? Number(horizonDays) : undefined,
      };
      const res = await aiService.predictSellerReputation(payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AutoAwesome color="primary" />
        <Typography variant="h4" component="h1">
          AI Demand &amp; Reputation
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Forecast demand for a category or product, and predict seller reputation trajectory.
      </Typography>

      <Paper sx={{ p: 0, mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<TrendingUp />} iconPosition="start" label="Predict Demand" />
          <Tab icon={<Star />} iconPosition="start" label="Seller Reputation" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <TabPanel value={tab} index={0}>
                <Box component="form" onSubmit={handleDemandSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Electronics > Headphones" fullWidth disabled={loading} />
                  <TextField label="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Bluetooth earbuds" fullWidth disabled={loading} />
                  <TextField label="Season" value={season} onChange={(e) => setSeason(e.target.value)} placeholder="e.g. holiday Q4" fullWidth disabled={loading} />
                  <TextField label="History / context" value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Recent unit sales or trends" multiline rows={4} fullWidth disabled={loading} />
                  <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <TrendingUp />}>
                    Predict demand
                  </Button>
                </Box>
              </TabPanel>

              <TabPanel value={tab} index={1}>
                <Box component="form" onSubmit={handleReputationSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Seller ID" value={sellerId} onChange={(e) => setSellerId(e.target.value)} required fullWidth disabled={loading} />
                  <TextField label="Horizon (days)" type="number" value={horizonDays} onChange={(e) => setHorizonDays(e.target.value)} fullWidth disabled={loading} />
                  <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <Star />}>
                    Predict reputation
                  </Button>
                </Box>
              </TabPanel>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Result
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Working...</Typography>
                </Box>
              )}
              {!loading && !result && !error && (
                <Typography variant="body2" color="text.secondary">
                  Submit the form to see AI-generated forecast or analysis.
                </Typography>
              )}
              {!loading && result && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 600, overflow: 'auto' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                    {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                  </pre>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AIDemandReputation;
