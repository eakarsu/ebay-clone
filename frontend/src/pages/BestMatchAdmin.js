import React, { useEffect, useState } from 'react';
import {
  Container, Box, Typography, Paper, Button, TextField, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Chip, LinearProgress, Grid,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TuneIcon from '@mui/icons-material/Tune';
import { bestMatchService } from '../services/api';

const BestMatchAdmin = () => {
  const [factors, setFactors] = useState(null);
  const [factorsError, setFactorsError] = useState(null);

  const [productId, setProductId] = useState('');
  const [singleResult, setSingleResult] = useState(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState(null);

  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [batchError, setBatchError] = useState(null);

  useEffect(() => {
    bestMatchService.qualityFactors()
      .then(r => setFactors(r.data))
      .catch(e => setFactorsError(e.response?.data?.error || 'Failed to load quality factors'));
  }, []);

  const handleSingleUpdate = async () => {
    if (!productId.trim()) return;
    setSingleLoading(true);
    setSingleError(null);
    setSingleResult(null);
    try {
      const r = await bestMatchService.updateScore(productId.trim());
      setSingleResult(r.data);
    } catch (e) {
      setSingleError(e.response?.data?.error || 'Failed to update');
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBatchUpdate = async () => {
    if (!window.confirm('Recalculate quality scores for ALL active products? This may take a while.')) return;
    setBatchLoading(true);
    setBatchError(null);
    setBatchResult(null);
    try {
      const r = await bestMatchService.batchUpdate();
      setBatchResult(r.data);
    } catch (e) {
      setBatchError(e.response?.data?.error || 'Batch update failed');
    } finally {
      setBatchLoading(false);
    }
  };

  const renderFactors = () => {
    if (factorsError) return <Alert severity="error">{factorsError}</Alert>;
    if (!factors) return <CircularProgress size={24} />;

    const entries = Object.entries(factors).filter(([k, v]) =>
      v && typeof v === 'object' && ('weight' in v || 'description' in v)
    );

    if (entries.length === 0) {
      return (
        <Box component="pre" sx={{ fontSize: 12, whiteSpace: 'pre-wrap', m: 0 }}>
          {JSON.stringify(factors, null, 2)}
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {entries.map(([key, val]) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </Typography>
                {val.weight != null && (
                  <Chip size="small" label={`${Math.round(val.weight * 100)}%`} color="primary" />
                )}
              </Box>
              {val.weight != null && (
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, val.weight * 100)}
                  sx={{ mb: 1, height: 6, borderRadius: 3 }}
                />
              )}
              {val.description && (
                <Typography variant="caption" color="text.secondary">
                  {val.description}
                </Typography>
              )}
              {Array.isArray(val.factors) && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {val.factors.map(f => (
                    <Chip key={f} label={f} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>Best Match — Admin</Typography>
        <Typography color="text.secondary">
          Manage product quality scores used by the Best Match ranking algorithm.
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TuneIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Quality factors</Typography>
        </Box>
        {renderFactors()}
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Recalculate a single product</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter a product UUID to recompute its quality score from current signals.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="product UUID"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={handleSingleUpdate}
                disabled={singleLoading || !productId.trim()}
                startIcon={singleLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
              >
                Recalculate
              </Button>
            </Box>
            {singleError && <Alert severity="error" sx={{ mb: 2 }}>{singleError}</Alert>}
            {singleResult && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    {Object.entries(singleResult).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {k.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell>
                          {typeof v === 'object' ? (
                            <Box component="pre" sx={{ fontSize: 11, m: 0 }}>
                              {JSON.stringify(v, null, 2)}
                            </Box>
                          ) : String(v)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Batch recalculate all active products</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Recomputes every active product's quality score. Run after large catalog changes
              or signal recalibration.
            </Typography>
            <Button
              variant="contained"
              color="warning"
              onClick={handleBatchUpdate}
              disabled={batchLoading}
              startIcon={batchLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              Run batch update
            </Button>
            {batchLoading && <LinearProgress sx={{ mt: 2 }} />}
            {batchError && <Alert severity="error" sx={{ mt: 2 }}>{batchError}</Alert>}
            {batchResult && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {batchResult.message || JSON.stringify(batchResult)}
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BestMatchAdmin;
