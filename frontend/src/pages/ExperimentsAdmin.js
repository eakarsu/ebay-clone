import React, { useEffect, useState } from 'react';
import {
  Container, Box, Typography, Paper, Alert, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Grid, LinearProgress, IconButton, Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BarChartIcon from '@mui/icons-material/BarChart';
import { experimentService } from '../services/api';

const statusColor = (s) => ({
  running: 'success',
  paused: 'warning',
  ended: 'default',
}[s] || 'default');

const ExperimentsAdmin = () => {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedKey, setSelectedKey] = useState(null);
  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);

  const loadList = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await experimentService.list();
      setExperiments(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadList(); }, []);

  const loadResults = async (key) => {
    setSelectedKey(key);
    setResultsLoading(true);
    setResultsError(null);
    setResults(null);
    try {
      const r = await experimentService.results(key);
      setResults(r.data);
    } catch (e) {
      setResultsError(e.response?.data?.error || 'Failed to load results');
    } finally {
      setResultsLoading(false);
    }
  };

  const bestVariant = results?.variants?.length
    ? results.variants.reduce((a, b) => (a.conversion_rate > b.conversion_rate ? a : b))
    : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>Experiments — Admin</Typography>
          <Typography color="text.secondary">
            A/B test assignments and conversion results. Deterministic per-subject assignment.
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={loadList} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Experiments</Typography>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></Box>
            ) : experiments.length === 0 ? (
              <Alert severity="info">No experiments defined yet.</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Key</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Assigned</TableCell>
                      <TableCell align="right">Conv.</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {experiments.map((exp) => (
                      <TableRow
                        key={exp.key}
                        hover
                        selected={selectedKey === exp.key}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => loadResults(exp.key)}
                      >
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {exp.key}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={exp.status} color={statusColor(exp.status)} />
                        </TableCell>
                        <TableCell align="right">{exp.assigned ?? 0}</TableCell>
                        <TableCell align="right">{exp.conversions ?? 0}</TableCell>
                        <TableCell>
                          <Tooltip title="View results">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); loadResults(exp.key); }}>
                              <BarChartIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, minHeight: 300 }}>
            {!selectedKey ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <BarChartIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                <Typography sx={{ mt: 1 }}>Select an experiment to view results</Typography>
              </Box>
            ) : (
              <>
                <Typography variant="h6" gutterBottom sx={{ fontFamily: 'monospace' }}>
                  {selectedKey}
                </Typography>
                {resultsLoading && <LinearProgress sx={{ mb: 2 }} />}
                {resultsError && <Alert severity="error">{resultsError}</Alert>}
                {results && results.variants.length === 0 && (
                  <Alert severity="info">No assignments yet for this experiment.</Alert>
                )}
                {results && results.variants.length > 0 && (
                  <>
                    <Box sx={{ mb: 3 }}>
                      {results.variants.map((v) => {
                        const isBest = bestVariant && v.variant === bestVariant.variant && results.variants.length > 1;
                        return (
                          <Box key={v.variant} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={600}>{v.variant}</Typography>
                                {isBest && <Chip size="small" label="winning" color="success" />}
                              </Box>
                              <Typography variant="body2">
                                {v.conversion_rate}% ({v.conversions}/{v.assigned})
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, v.conversion_rate)}
                              color={isBest ? 'success' : 'primary'}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        );
                      })}
                    </Box>

                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Variant</TableCell>
                            <TableCell align="right">Assigned</TableCell>
                            <TableCell align="right">Conversions</TableCell>
                            <TableCell align="right">Rate</TableCell>
                            <TableCell align="right">vs. control</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(() => {
                            const control = results.variants.find(v => v.variant === 'control') || results.variants[0];
                            return results.variants.map((v) => {
                              const lift = control && control.conversion_rate > 0
                                ? ((v.conversion_rate - control.conversion_rate) / control.conversion_rate * 100).toFixed(1)
                                : null;
                              return (
                                <TableRow key={v.variant}>
                                  <TableCell>{v.variant}</TableCell>
                                  <TableCell align="right">{v.assigned}</TableCell>
                                  <TableCell align="right">{v.conversions}</TableCell>
                                  <TableCell align="right">{v.conversion_rate}%</TableCell>
                                  <TableCell align="right">
                                    {v === control ? '—' : (
                                      <Typography
                                        variant="body2"
                                        color={lift > 0 ? 'success.main' : lift < 0 ? 'error.main' : 'text.secondary'}
                                      >
                                        {lift > 0 ? '+' : ''}{lift}%
                                      </Typography>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            });
                          })()}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button size="small" startIcon={<RefreshIcon />} onClick={() => loadResults(selectedKey)}>
                        Refresh results
                      </Button>
                    </Box>
                  </>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ExperimentsAdmin;
