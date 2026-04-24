import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent, Button, Paper, Chip,
  Tab, Tabs, Stack, Alert, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Table, TableHead, TableRow, TableCell,
  TableBody, Divider, InputAdornment, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  VerifiedUser, CheckCircle, Cancel, Search, Description,
  Inventory, HelpOutline,
} from '@mui/icons-material';
import { authenticityService } from '../services/api';

const STATUS_COLORS = {
  pending: 'default',
  inspecting: 'info',
  authenticated: 'success',
  rejected: 'error',
};

export default function AuthenticityGuarantee() {
  const [tab, setTab] = useState(0);

  // Categories — shown on overview tab + referenced for the "is this required?" tool.
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  // My requests
  const [viewAs, setViewAs] = useState('buyer');
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');

  // Verify certificate
  const [verifyMode, setVerifyMode] = useState('certificate'); // certificate | nfc
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Is-required checker
  const [reqCheckForm, setReqCheckForm] = useState({ categoryName: '', itemValue: '' });
  const [reqCheckResult, setReqCheckResult] = useState(null);
  const [reqChecking, setReqChecking] = useState(false);

  // Detail dialog
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await authenticityService.listCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch { /* non-fatal */ }
      finally { setCatLoading(false); }
    })();
  }, []);

  const loadRequests = React.useCallback(async () => {
    setReqLoading(true);
    setReqError('');
    try {
      const { data } = await authenticityService.listMine(viewAs);
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setReqError(e.response?.data?.error || 'Failed to load your requests');
    } finally {
      setReqLoading(false);
    }
  }, [viewAs]);

  useEffect(() => { if (tab === 1) loadRequests(); }, [tab, loadRequests]);

  const verify = async () => {
    const v = verifyInput.trim();
    if (!v) return;
    setVerifying(true);
    setVerifyError('');
    setVerifyResult(null);
    try {
      const params = verifyMode === 'certificate' ? { certificateNumber: v } : { nfcTagId: v };
      const { data } = await authenticityService.verify(params);
      setVerifyResult(data);
    } catch (e) {
      setVerifyError(e.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const checkRequired = async () => {
    if (!reqCheckForm.categoryName || !reqCheckForm.itemValue) return;
    setReqChecking(true);
    setReqCheckResult(null);
    try {
      const { data } = await authenticityService.checkRequired(
        reqCheckForm.categoryName,
        Number(reqCheckForm.itemValue),
      );
      setReqCheckResult(data);
    } catch (e) {
      setReqCheckResult({ error: e.response?.data?.error || 'Check failed' });
    } finally {
      setReqChecking(false);
    }
  };

  const viewDetail = async (id) => {
    try {
      const { data } = await authenticityService.getRequest(id);
      setDetail(data);
    } catch (e) {
      setReqError(e.response?.data?.error || 'Failed to load detail');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <VerifiedUser color="primary" fontSize="large" />
        <Typography variant="h4" fontWeight={700}>Authenticity Guarantee</Typography>
      </Stack>
      <Typography color="text.secondary" mb={3}>
        Every eligible item is inspected by an expert before it ships. Scan the NFC tag or
        enter a certificate number to verify at any time.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab icon={<Inventory />} iconPosition="start" label="Overview" />
          <Tab icon={<Description />} iconPosition="start" label="My requests" />
          <Tab icon={<Search />} iconPosition="start" label="Verify certificate" />
          <Tab icon={<HelpOutline />} iconPosition="start" label="Is this required?" />
        </Tabs>
      </Paper>

      {/* OVERVIEW */}
      {tab === 0 && (
        <>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
            <Typography variant="h6" fontWeight={600} mb={2}>How it works</Typography>
            <Grid container spacing={2}>
              {[
                ['Seller ships to us', 'The item goes to our authentication center first, not directly to you.'],
                ['Expert inspection', 'Verified by a category specialist against brand-specific markers.'],
                ['Certificate + NFC tag', 'Pass → item is tagged and certified. Fail → full refund.'],
                ['You receive the item', 'Confirmed genuine, with a scannable certificate attached.'],
              ].map(([title, body], i) => (
                <Grid item xs={12} md={3} key={i}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Chip label={i + 1} color="primary" size="small" />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
                      <Typography variant="body2" color="text.secondary">{body}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Typography variant="h6" fontWeight={600} mb={2}>Eligible categories</Typography>
          {catLoading ? (
            <CircularProgress />
          ) : categories.length === 0 ? (
            <Alert severity="info">
              No categories currently enrolled in Authenticity Guarantee.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {categories.map((c) => (
                <Grid item xs={12} sm={6} md={4} key={c.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {c.category_name}
                        </Typography>
                        {c.is_mandatory && (
                          <Chip size="small" color="warning" label="Mandatory" />
                        )}
                      </Stack>
                      {c.min_value_threshold != null && (
                        <Typography variant="body2" color="text.secondary">
                          Kicks in at ${Number(c.min_value_threshold).toLocaleString()}+
                        </Typography>
                      )}
                      {c.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>{c.description}</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* MY REQUESTS */}
      {tab === 1 && (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <ToggleButtonGroup
              size="small" exclusive value={viewAs}
              onChange={(_, v) => v && setViewAs(v)}
            >
              <ToggleButton value="buyer">As buyer</ToggleButton>
              <ToggleButton value="seller">As seller</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {reqError && <Alert severity="error" sx={{ mb: 2 }}>{reqError}</Alert>}

          <Paper>
            {reqLoading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
            ) : requests.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  You have no authenticity requests {viewAs === 'buyer' ? 'as a buyer' : 'as a seller'}.
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Brand</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Certificate</TableCell>
                    <TableCell align="right">Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" noWrap title={r.product_title}>
                          {r.product_title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.order_number}</TableCell>
                      <TableCell>{r.brand || '—'}</TableCell>
                      <TableCell align="right">
                        ${Number(r.declared_value || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={r.status} color={STATUS_COLORS[r.status] || 'default'} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {r.certificate_number || '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => viewDetail(r.id)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </>
      )}

      {/* VERIFY CERTIFICATE */}
      {tab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Verify an authenticity certificate
          </Typography>
          <ToggleButtonGroup
            size="small" exclusive value={verifyMode}
            onChange={(_, v) => v && setVerifyMode(v)}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="certificate">Certificate #</ToggleButton>
            <ToggleButton value="nfc">NFC tag</ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              placeholder={verifyMode === 'certificate' ? 'AG-1234567890-ABCDEF' : '8-char tag ID'}
              InputProps={{ sx: { fontFamily: 'monospace' } }}
              onKeyDown={(e) => { if (e.key === 'Enter') verify(); }}
            />
            <Button
              variant="contained"
              onClick={verify}
              disabled={verifying || !verifyInput.trim()}
              startIcon={<Search />}
              sx={{ minWidth: 120 }}
            >
              {verifying ? '…' : 'Verify'}
            </Button>
          </Stack>

          {verifyError && <Alert severity="error" sx={{ mt: 2 }}>{verifyError}</Alert>}

          {verifyResult && (
            <Box sx={{ mt: 3 }}>
              {verifyResult.verified ? (
                <Alert severity="success" icon={<CheckCircle />}>
                  <Typography variant="subtitle2">{verifyResult.message}</Typography>
                  {verifyResult.item && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>{verifyResult.item.brand} {verifyResult.item.model}</strong> — {verifyResult.item.productTitle}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Category: {verifyResult.item.category} ·
                        Authenticated: {new Date(verifyResult.item.authenticatedDate).toLocaleDateString()} ·
                        Cert: <span style={{ fontFamily: 'monospace' }}>{verifyResult.item.certificateNumber}</span>
                      </Typography>
                    </Box>
                  )}
                </Alert>
              ) : (
                <Alert severity="error" icon={<Cancel />}>
                  {verifyResult.message || 'Not verified'}
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* IS THIS REQUIRED? */}
      {tab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            Is Authenticity Guarantee required for my item?
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Some categories require verification for all items; others kick in above a price threshold.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Category name"
                value={reqCheckForm.categoryName}
                onChange={(e) => setReqCheckForm({ ...reqCheckForm, categoryName: e.target.value })}
                placeholder="e.g. Sneakers, Watches, Handbags"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth label="Item value" type="number"
                value={reqCheckForm.itemValue}
                onChange={(e) => setReqCheckForm({ ...reqCheckForm, itemValue: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth variant="contained"
                onClick={checkRequired}
                disabled={reqChecking || !reqCheckForm.categoryName || !reqCheckForm.itemValue}
                sx={{ height: '100%' }}
              >
                Check
              </Button>
            </Grid>
          </Grid>
          {reqCheckResult && (
            <Alert
              severity={reqCheckResult.error ? 'error' : reqCheckResult.required ? 'info' : 'success'}
              sx={{ mt: 3 }}
            >
              {reqCheckResult.error || reqCheckResult.message}
              {reqCheckResult.category?.min_value_threshold != null && (
                <Box sx={{ mt: 1 }}>
                  Threshold for this category: ${Number(reqCheckResult.category.min_value_threshold).toLocaleString()}
                </Box>
              )}
            </Alert>
          )}
        </Paper>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Authenticity request details</DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Stack spacing={1.5}>
              <Row k="Product" v={detail.product_title} />
              <Row k="Order #" v={detail.order_number} mono />
              <Row k="Brand / Model" v={`${detail.brand || '—'} ${detail.model || ''}`} />
              <Row k="Declared value" v={`$${Number(detail.declared_value || 0).toLocaleString()}`} />
              <Row k="Status" v={<Chip size="small" label={detail.status} color={STATUS_COLORS[detail.status] || 'default'} />} />
              {detail.is_authentic != null && (
                <Row k="Authentic?" v={detail.is_authentic ? 'Yes' : 'No'} />
              )}
              {detail.authenticity_score != null && (
                <Row k="Score" v={`${detail.authenticity_score}%`} />
              )}
              {detail.certificate_number && <Row k="Certificate" v={detail.certificate_number} mono />}
              {detail.nfc_tag_id && <Row k="NFC tag" v={detail.nfc_tag_id} mono />}
              {detail.inspection_notes && (
                <>
                  <Divider />
                  <Typography variant="caption" color="text.secondary">Inspector notes</Typography>
                  <Typography variant="body2">{detail.inspection_notes}</Typography>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function Row({ k, v, mono }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="caption" color="text.secondary">{k}</Typography>
      {typeof v === 'string' ? (
        <Typography variant="body2" sx={{ fontFamily: mono ? 'monospace' : undefined }}>
          {v || '—'}
        </Typography>
      ) : v}
    </Stack>
  );
}
