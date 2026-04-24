import React, { useEffect, useState } from 'react';
import {
  Container, Paper, Typography, Stepper, Step, StepLabel, Box, Button,
  TextField, Alert, CircularProgress, Grid, MenuItem
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const STEP_KEYS = ['account', 'identity', 'payout', 'tax', 'policies', 'first_listing'];

const SellerOnboarding = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [data, setData] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/seller-onboarding/me');
        const ob = res.data.onboarding;
        const completed = ob.completed_steps || [];
        setCompletedSteps(completed);
        setData(ob.data || {});
        const currentIdx = STEP_KEYS.indexOf(ob.current_step);
        setActiveStep(currentIdx >= 0 ? currentIdx : 0);
      } catch (e) {
        setError(e.response?.data?.error || 'Failed to load onboarding');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (nextStepKey, nextCompleted, nextData) => {
    setSaving(true);
    try {
      await api.put('/seller-onboarding/me', {
        current_step: nextStepKey,
        completed_steps: nextCompleted,
        data: nextData,
      });
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const key = STEP_KEYS[activeStep];
    const nextCompleted = Array.from(new Set([...completedSteps, key]));
    setCompletedSteps(nextCompleted);
    const nextIdx = Math.min(activeStep + 1, STEP_KEYS.length - 1);
    const nextKey = STEP_KEYS[nextIdx];
    setActiveStep(nextIdx);
    await persist(nextKey, nextCompleted, data);
  };

  const handleBack = () => {
    setActiveStep(s => Math.max(s - 1, 0));
  };

  const update = (field, val) => {
    setData(d => ({ ...d, [field]: val }));
  };

  if (loading) {
    return (
      <Container sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const allDone = STEP_KEYS.every(k => completedSteps.includes(k));

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('onboarding.title', 'Become a seller')}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {STEP_KEYS.map((k) => (
            <Step key={k} completed={completedSteps.includes(k)}>
              <StepLabel>{t(`onboarding.step_${k}`, k)}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {allDone ? (
          <Alert severity="success">
            {t('onboarding.completed', "You're all set — start selling!")}
          </Alert>
        ) : (
          <Box sx={{ minHeight: 220 }}>
            {activeStep === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Business name" value={data.business_name || ''}
                    onChange={(e) => update('business_name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone" value={data.phone || ''}
                    onChange={(e) => update('phone', e.target.value)} />
                </Grid>
              </Grid>
            )}
            {activeStep === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="ID type" value={data.id_type || ''}
                    onChange={(e) => update('id_type', e.target.value)}>
                    <MenuItem value="passport">Passport</MenuItem>
                    <MenuItem value="driver_license">Driver license</MenuItem>
                    <MenuItem value="national_id">National ID</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="ID number" value={data.id_number || ''}
                    onChange={(e) => update('id_number', e.target.value)} />
                </Grid>
              </Grid>
            )}
            {activeStep === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Bank name" value={data.bank_name || ''}
                    onChange={(e) => update('bank_name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Account (last 4)" value={data.account_last4 || ''}
                    onChange={(e) => update('account_last4', e.target.value)} />
                </Grid>
              </Grid>
            )}
            {activeStep === 3 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Tax ID / VAT" value={data.tax_id || ''}
                    onChange={(e) => update('tax_id', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Tax country" value={data.tax_country || ''}
                    onChange={(e) => update('tax_country', e.target.value)}>
                    <MenuItem value="US">United States</MenuItem>
                    <MenuItem value="GB">United Kingdom</MenuItem>
                    <MenuItem value="DE">Germany</MenuItem>
                    <MenuItem value="ES">Spain</MenuItem>
                    <MenuItem value="TR">Turkey</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            )}
            {activeStep === 4 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Handling time (days)" type="number"
                    value={data.handling_days || ''}
                    onChange={(e) => update('handling_days', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Return window (days)" type="number"
                    value={data.return_days || ''}
                    onChange={(e) => update('return_days', e.target.value)} />
                </Grid>
              </Grid>
            )}
            {activeStep === 5 && (
              <Typography>
                Head to the <a href="/sell">Sell</a> page to create your first listing,
                then come back and click Finish.
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0 || saving} onClick={handleBack}>
            Back
          </Button>
          <Button variant="contained" disabled={saving || allDone} onClick={handleNext}>
            {activeStep === STEP_KEYS.length - 1 ? 'Finish' : t('common.continue', 'Continue')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SellerOnboarding;
