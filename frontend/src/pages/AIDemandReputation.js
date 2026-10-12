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
import AIReport from '../components/AIReport';
import FullFieldPresets from '../components/FullFieldPresets';

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
  const [historicalMetrics, setHistoricalMetrics] = useState('');
  const [recentReviews, setRecentReviews] = useState('');
  const [disputeStats, setDisputeStats] = useState('');

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
        contextNotes: [productName.trim() && `Product: ${productName.trim()}`, season.trim() && `Season: ${season.trim()}`, history.trim() && `History: ${history.trim()}`].filter(Boolean).join('\n'),
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
        sellerId: sellerId.trim(),
        historicalMetrics: historicalMetrics.trim() ? JSON.parse(historicalMetrics) : {},
        recentReviews: recentReviews.trim() ? JSON.parse(recentReviews) : [],
        disputeStats: disputeStats.trim() ? JSON.parse(disputeStats) : {},
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
                  <FullFieldPresets value={{ category, productName, season, history }} presets={[
                    { label: 'Headphone demand', values: { category: 'Electronics > Headphones', productName: 'Wireless noise-cancelling headphones', season: 'Holiday shopping', history: 'Example: sales increased during recent promotions; confirm actual sales before forecasting.' } },
                    { label: 'Garden supplies', values: { category: 'Home & Garden > Gardening', productName: 'Raised garden bed kits', season: 'Spring', history: 'Example: interest rose before planting season; confirm inventory and prior sales.' } },
                    { label: 'School backpacks', values: { category: 'Clothing > Backpacks', productName: 'Durable school backpacks', season: 'Back-to-school', history: 'Example: demand peaks before term starts; confirm actual order history.' } },
                  ]} disabled={loading} onChange={(values) => { setCategory(values.category); setProductName(values.productName); setSeason(values.season); setHistory(values.history); }} />
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
                  <FullFieldPresets value={{ sellerId, historicalMetrics, recentReviews, disputeStats }} presets={[
                    { label: 'Stable delivery', values: { historicalMetrics: '{"orders_90d":120,"on_time_rate":0.97}', recentReviews: '[{"rating":5,"comment":"Arrived on time"}]', disputeStats: '{"open":0,"resolved":1}' } },
                    { label: 'Delivery delays', values: { historicalMetrics: '{"orders_90d":85,"on_time_rate":0.78}', recentReviews: '[{"rating":2,"comment":"Shipment arrived late"}]', disputeStats: '{"open":2,"resolved":1}' } },
                    { label: 'Improving service', values: { historicalMetrics: '{"orders_90d":64,"on_time_rate":0.91}', recentReviews: '[{"rating":4,"comment":"Good communication"}]', disputeStats: '{"open":0,"resolved":3}' } },
                  ]} disabled={loading} onChange={(values) => { setHistoricalMetrics(values.historicalMetrics); setRecentReviews(values.recentReviews); setDisputeStats(values.disputeStats); }} />
                  <Typography variant="body2" color="text.secondary">Enter a real seller ID first. Examples preserve it and provide illustrative metrics only; replace those metrics with verified records before generating.</Typography>
                  <TextField label="Seller ID" value={sellerId} onChange={(e) => setSellerId(e.target.value)} required fullWidth disabled={loading} />
                  <TextField label="Historical metrics (JSON object)" value={historicalMetrics} onChange={(e) => setHistoricalMetrics(e.target.value)} multiline rows={2} fullWidth disabled={loading} />
                  <TextField label="Recent reviews (JSON array)" value={recentReviews} onChange={(e) => setRecentReviews(e.target.value)} multiline rows={2} fullWidth disabled={loading} />
                  <TextField label="Dispute stats (JSON object)" value={disputeStats} onChange={(e) => setDisputeStats(e.target.value)} multiline rows={2} fullWidth disabled={loading} />
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
              {!loading && result && <AIReport response={result.data?.forecast ?? result.data?.analysis ?? result} title={tab === 0 ? 'Demand forecast' : 'Seller reputation'} model={result.data?.model} tokens={result.data?.tokens} />}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AIDemandReputation;
