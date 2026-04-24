import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardMedia, Button,
  Paper, TextField, MenuItem, Chip, Tab, Tabs, InputAdornment, Alert,
  Stack, CircularProgress, Divider, List, ListItem, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  DirectionsCar, Search, Speed, History, VerifiedUser,
  CheckCircle, Warning, Build, LocalOffer,
} from '@mui/icons-material';
import { motorsService } from '../services/api';

// Common makes + body types as constants — the backend doesn't expose these lookups
// so hardcoding the usual set is the pragmatic choice.
const MAKES = ['Any', 'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes',
  'Audi', 'Volkswagen', 'Nissan', 'Tesla', 'Jeep', 'Subaru', 'Hyundai', 'Kia'];
const BODY_TYPES = ['Any', 'Sedan', 'SUV', 'Truck', 'Coupe', 'Convertible',
  'Hatchback', 'Wagon', 'Van', 'Minivan'];
const CURRENT_YEAR = new Date().getFullYear();

export default function Motors() {
  const [tab, setTab] = useState(0); // 0=search, 1=vin-lookup, 2=fitment
  const [filters, setFilters] = useState({
    make: 'Any', model: '', bodyType: 'Any',
    yearFrom: '', yearTo: '', mileageMax: '',
  });
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // VIN lookup state
  const [vin, setVin] = useState('');
  const [vinLoading, setVinLoading] = useState(false);
  const [vinResult, setVinResult] = useState(null); // { decoded, history }
  const [vinError, setVinError] = useState('');

  // Fitment check state — product must already exist with vehicle_parts_compatibility rows
  const [fitForm, setFitForm] = useState({
    productId: '', year: '', make: '', model: '',
  });
  const [fitResult, setFitResult] = useState(null);
  const [fitLoading, setFitLoading] = useState(false);
  const [fitError, setFitError] = useState('');

  const search = useCallback(async () => {
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'Any') params[k] = v;
      });
      const { data } = await motorsService.searchVehicles(params);
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const lookupVin = async () => {
    const v = vin.trim().toUpperCase();
    if (v.length !== 17) {
      setVinError('VIN must be exactly 17 characters');
      return;
    }
    setVinLoading(true);
    setVinError('');
    setVinResult(null);
    try {
      // Decode + history in parallel; both use simulated data in dev per controller comments.
      const [decodedRes, historyRes] = await Promise.all([
        motorsService.decodeVin(v),
        motorsService.getHistory(v),
      ]);
      // Listing may or may not exist in our DB — don't fail if missing.
      let listing = null;
      try { listing = (await motorsService.getByVin(v)).data; } catch {}
      setVinResult({ decoded: decodedRes.data, history: historyRes.data, listing });
    } catch (e) {
      setVinError(e.response?.data?.error || 'VIN lookup failed');
    } finally {
      setVinLoading(false);
    }
  };

  const checkFit = async () => {
    setFitLoading(true);
    setFitError('');
    setFitResult(null);
    try {
      const { data } = await motorsService.checkFitment(fitForm);
      setFitResult(data);
    } catch (e) {
      setFitError(e.response?.data?.error || 'Compatibility check failed');
    } finally {
      setFitLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <DirectionsCar color="primary" fontSize="large" />
        <Typography variant="h4" fontWeight={700}>eBay Motors</Typography>
      </Stack>
      <Typography color="text.secondary" mb={3}>
        Search vehicles, run a VIN report, or check whether a part fits your car.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab icon={<Search />} iconPosition="start" label="Search vehicles" />
          <Tab icon={<History />} iconPosition="start" label="VIN lookup" />
          <Tab icon={<Build />} iconPosition="start" label="Parts fitment" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <>
          {/* Filters */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select fullWidth label="Make"
                  value={filters.make}
                  onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                >
                  {MAKES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth label="Model"
                  value={filters.model}
                  onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                  placeholder="e.g. Camry"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select fullWidth label="Body type"
                  value={filters.bodyType}
                  onChange={(e) => setFilters({ ...filters, bodyType: e.target.value })}
                >
                  {BODY_TYPES.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <TextField
                  fullWidth label="Year from" type="number"
                  value={filters.yearFrom}
                  onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                  inputProps={{ min: 1950, max: CURRENT_YEAR }}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <TextField
                  fullWidth label="Year to" type="number"
                  value={filters.yearTo}
                  onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                  inputProps={{ min: 1950, max: CURRENT_YEAR }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth label="Max mileage" type="number"
                  value={filters.mileageMax}
                  onChange={(e) => setFilters({ ...filters, mileageMax: e.target.value })}
                  InputProps={{ endAdornment: <InputAdornment position="end">mi</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} md={9} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={search}
                  disabled={loading}
                  sx={{ minWidth: 140 }}
                >
                  {loading ? 'Searching…' : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
          ) : !searched ? (
            <Alert severity="info">
              Use the filters above to search listed vehicles. Leave a field blank to not filter on it.
            </Alert>
          ) : results.length === 0 ? (
            <Alert severity="info">No vehicles match those filters.</Alert>
          ) : (
            <Grid container spacing={3}>
              {results.map((v) => (
                <Grid item xs={12} sm={6} md={4} key={v.id}>
                  <Card
                    component={Link}
                    to={`/product/${v.product_id}`}
                    sx={{ textDecoration: 'none', height: '100%' }}
                  >
                    {v.image && (
                      <CardMedia
                        component="img"
                        height="180"
                        image={v.image}
                        alt={v.title}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600} noWrap title={v.title}>
                        {v.year} {v.make} {v.model}
                      </Typography>
                      <Typography variant="h6" color="primary" mt={0.5}>
                        ${Number(v.buy_now_price || v.current_price || 0).toLocaleString()}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                        {v.mileage != null && (
                          <Chip size="small" icon={<Speed />} label={`${Number(v.mileage).toLocaleString()} mi`} />
                        )}
                        {v.body_type && <Chip size="small" label={v.body_type} />}
                        {v.transmission && <Chip size="small" label={v.transmission} />}
                        {v.title_status && v.title_status !== 'Clean' && (
                          <Chip size="small" color="warning" icon={<Warning />} label={v.title_status} />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" mb={1}>Enter a VIN (17 characters)</Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="e.g. 1HGBH41JXMN109186"
                inputProps={{ maxLength: 17, style: { fontFamily: 'monospace', letterSpacing: 1 } }}
                onKeyDown={(e) => { if (e.key === 'Enter') lookupVin(); }}
              />
              <Button
                variant="contained"
                onClick={lookupVin}
                disabled={vinLoading}
                startIcon={<VerifiedUser />}
                sx={{ minWidth: 140 }}
              >
                {vinLoading ? 'Looking up…' : 'Run report'}
              </Button>
            </Stack>
            {vinError && <Alert severity="error" sx={{ mt: 2 }}>{vinError}</Alert>}
          </Paper>

          {vinResult && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    VIN decode
                  </Typography>
                  <List dense>
                    <Row k="VIN" v={vinResult.decoded.vin} mono />
                    <Row k="Year / Make / Model"
                         v={`${vinResult.decoded.year} ${vinResult.decoded.make} ${vinResult.decoded.model}`} />
                    <Row k="Body type" v={vinResult.decoded.bodyType} />
                    <Row k="Engine" v={vinResult.decoded.engineSize} />
                    <Row k="Fuel" v={vinResult.decoded.fuelType} />
                    <Row k="Transmission" v={vinResult.decoded.transmission} />
                    <Row k="Drivetrain" v={vinResult.decoded.drivetrain} />
                    <Row k="Origin" v={vinResult.decoded.manufacturerCountry} />
                  </List>
                  {vinResult.listing && (
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Button
                        fullWidth
                        variant="outlined"
                        component={Link}
                        to={`/product/${vinResult.listing.product_id}`}
                        startIcon={<LocalOffer />}
                      >
                        View listing on eBay Motors
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={7}>
                <Paper sx={{ p: 3, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Ownership history</Typography>
                  <List dense>
                    {(vinResult.history.owners || []).map((o) => (
                      <ListItem key={o.ownerNumber}>
                        <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                        <ListItemText
                          primary={`Owner #${o.ownerNumber} — ${o.state}`}
                          secondary={`Since ${o.purchaseDate} · ${Number(o.mileage).toLocaleString()} mi at purchase`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>

                <Paper sx={{ p: 3, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Service records</Typography>
                  <List dense>
                    {(vinResult.history.serviceRecords || []).map((s, i) => (
                      <ListItem key={i}>
                        <ListItemText
                          primary={s.service}
                          secondary={`${s.date} · ${Number(s.mileage).toLocaleString()} mi`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>

                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>Estimated value</Typography>
                  <Grid container spacing={2}>
                    {vinResult.history.estimatedValue && Object.entries(vinResult.history.estimatedValue).map(([k, v]) => (
                      <Grid item xs={4} key={k}>
                        <Typography variant="caption" color="text.secondary" textTransform="capitalize">
                          {k === 'tradein' ? 'Trade-in' : k}
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          ${Number(v).toLocaleString()}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                    <Chip
                      icon={<CheckCircle />}
                      color={vinResult.history.accidents?.length ? 'warning' : 'success'}
                      label={`${vinResult.history.accidents?.length || 0} accidents reported`}
                    />
                    <Chip
                      icon={<CheckCircle />}
                      color={vinResult.history.recalls?.length ? 'warning' : 'success'}
                      label={`${vinResult.history.recalls?.length || 0} open recalls`}
                    />
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {tab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" mb={1}>Check if a part fits your vehicle</Typography>
          <Typography color="text.secondary" variant="body2" mb={3}>
            Paste the part listing's ID and your vehicle details. Sellers add compatibility
            records when they list parts — if no records exist for the listing, the check
            will return a cautionary result.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Part listing ID"
                value={fitForm.productId}
                onChange={(e) => setFitForm({ ...fitForm, productId: e.target.value })}
                placeholder="UUID from the part listing page"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth label="Year" type="number"
                value={fitForm.year}
                onChange={(e) => setFitForm({ ...fitForm, year: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth label="Make"
                value={fitForm.make}
                onChange={(e) => setFitForm({ ...fitForm, make: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth label="Model"
                value={fitForm.model}
                onChange={(e) => setFitForm({ ...fitForm, model: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Build />}
                onClick={checkFit}
                disabled={fitLoading || !fitForm.productId || !fitForm.year || !fitForm.make || !fitForm.model}
              >
                {fitLoading ? 'Checking…' : 'Check fitment'}
              </Button>
            </Grid>
          </Grid>

          {fitError && <Alert severity="error" sx={{ mt: 2 }}>{fitError}</Alert>}
          {fitResult && (
            <Alert
              severity={fitResult.compatible ? 'success' : 'warning'}
              icon={fitResult.compatible ? <CheckCircle /> : <Warning />}
              sx={{ mt: 2 }}
            >
              {fitResult.message}
              {fitResult.compatibilityInfo?.notes && (
                <Box component="div" mt={1}>
                  <strong>Notes:</strong> {fitResult.compatibilityInfo.notes}
                </Box>
              )}
            </Alert>
          )}
        </Paper>
      )}
    </Container>
  );
}

function Row({ k, v, mono }) {
  return (
    <ListItem disableGutters sx={{ py: 0.5 }}>
      <ListItemText
        primary={<Typography variant="caption" color="text.secondary">{k}</Typography>}
        secondary={
          <Typography variant="body2" sx={{ fontFamily: mono ? 'monospace' : undefined }}>
            {v || '—'}
          </Typography>
        }
      />
    </ListItem>
  );
}
