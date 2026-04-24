import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Paper, Box, Button, Table, TableBody, TableRow, TableCell,
  TableHead, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Snackbar, Alert, Skeleton, Avatar, Tabs, Tab, Badge, Stack,
} from '@mui/material';
import { Undo, Warning, CheckCircle, Cancel, Pending, Gavel } from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { bidRetractionService, bidService, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Reason codes MUST match the DB check constraint on bid_retractions.reason.
const REASONS = [
  { value: 'entered_wrong_amount',       label: 'Entered wrong bid amount' },
  { value: 'seller_changed_description', label: 'Seller changed item description' },
  { value: 'cannot_contact_seller',      label: 'Cannot contact seller' },
  { value: 'other',                      label: 'Other reason' },
];

const STATUS_UI = {
  pending:  { color: 'warning', icon: <Pending />,     label: 'Pending' },
  approved: { color: 'success', icon: <CheckCircle />, label: 'Approved' },
  denied:   { color: 'error',   icon: <Cancel />,      label: 'Denied' },
};

const BidRetractions = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // Buyer state
  const [retractions, setRetractions] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [requestDialog, setRequestDialog] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');

  // Seller state
  const [pending, setPending] = useState([]);
  const [reviewDialog, setReviewDialog] = useState({ open: false, retraction: null, action: null });
  const [reviewNote, setReviewNote] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: myR }, { data: pend }, bidsResp] = await Promise.all([
        bidRetractionService.getMyRetractions(),
        bidRetractionService.getPending(),
        bidService.getUserBids().catch(() => ({ data: [] })),
      ]);
      setRetractions(myR || []);
      setPending(pend || []);
      // Surface only still-retractable bids (active + not ended + not already retracted).
      const bids = bidsResp.data?.bids || bidsResp.data || [];
      setMyBids(bids.filter(b => {
        const end = b.product?.auctionEnd || b.auctionEnd;
        return !b.isRetracted && end && new Date(end) > new Date();
      }));
    } catch (e) {
      console.error('Failed to load retractions', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const submitRequest = async () => {
    if (!selectedBid || !reason) {
      return setSnackbar({ open: true, message: 'Please pick a reason', severity: 'error' });
    }
    try {
      await bidRetractionService.request({
        bidId: selectedBid.id, reason, explanation,
      });
      setRequestDialog(false);
      setSelectedBid(null);
      setReason('');
      setExplanation('');
      setSnackbar({ open: true, message: 'Retraction request submitted', severity: 'success' });
      reload();
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to submit', severity: 'error' });
    }
  };

  const submitReview = async () => {
    const { retraction, action } = reviewDialog;
    if (!retraction || !action) return;
    try {
      await bidRetractionService.review(retraction.id, {
        status: action, reviewNote: reviewNote || null,
      });
      setReviewDialog({ open: false, retraction: null, action: null });
      setReviewNote('');
      setSnackbar({
        open: true,
        message: action === 'approved' ? 'Retraction approved' : 'Retraction denied',
        severity: action === 'approved' ? 'success' : 'info',
      });
      reload();
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error || 'Failed to review', severity: 'error' });
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Undo sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to manage bid retractions</Typography>
        <Button variant="contained" component={Link} to="/login">Sign In</Button>
      </Container>
    );
  }

  const statusChip = (status) => {
    const c = STATUS_UI[status] || STATUS_UI.pending;
    return <Chip size="small" label={c.label} color={c.color} icon={c.icon} />;
  };
  const reasonLabel = (r) => REASONS.find(x => x.value === r)?.label || r;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Undo color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Bid Retractions</Typography>
      </Box>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="My requests" />
        <Tab label={
          <Badge badgeContent={pending.length} color="warning" showZero={false}>
            <Box sx={{ pr: pending.length ? 2 : 0 }}>To review (on my auctions)</Box>
          </Badge>
        } />
      </Tabs>

      {loading ? (
        <>
          <Skeleton variant="text" height={40} />
          <Skeleton variant="rectangular" height={300} />
        </>
      ) : tab === 0 ? (
        <>
          <Alert severity="warning" sx={{ mb: 3 }} icon={<Warning />}>
            Use retractions only for genuine cases. Requests inside the last 12 hours of
            an auction are blocked. Excessive retractions can affect your account standing.
          </Alert>

          {myBids.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Your active bids</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Your bid</TableCell>
                    <TableCell>Auction ends</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {myBids.map(bid => {
                    const end = bid.product?.auctionEnd || bid.auctionEnd;
                    const hoursLeft = end ? (new Date(end) - new Date()) / 3600000 : Infinity;
                    const tooLate = hoursLeft < 12;
                    return (
                      <TableRow key={bid.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar variant="rounded" src={bid.product?.images?.[0]?.url} sx={{ width: 40, height: 40 }}>
                              <Gavel fontSize="small" />
                            </Avatar>
                            <Typography
                              variant="body2"
                              component={Link}
                              to={`/product/${bid.productId || bid.product?.id}`}
                              sx={{ color: 'primary.main', textDecoration: 'none' }}
                            >
                              {(bid.product?.title || '(item)').slice(0, 50)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            ${Number(bid.bidAmount || bid.amount || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {end ? formatDistanceToNow(new Date(end), { addSuffix: true }) : '—'}
                          </Typography>
                          {tooLate && (
                            <Typography variant="caption" color="error">&lt; 12h — locked</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            color="error"
                            disabled={tooLate}
                            onClick={() => { setSelectedBid(bid); setRequestDialog(true); }}
                          >
                            Request retraction
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          )}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Retraction history</Typography>
            {retractions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Undo sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                <Typography color="text.secondary">No retraction requests yet</Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Bid amount</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Requested</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Response</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {retractions.map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar variant="rounded"
                            src={r.product_image ? getImageUrl(r.product_image) : undefined}
                            sx={{ width: 40, height: 40 }}>
                            <Gavel fontSize="small" />
                          </Avatar>
                          <Typography variant="body2">{r.product_title}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          ${Number(r.original_amount).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{reasonLabel(r.reason)}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2">{format(new Date(r.created_at), 'MMM d, yyyy')}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </Typography>
                      </TableCell>
                      <TableCell>{statusChip(r.status)}</TableCell>
                      <TableCell>
                        {r.review_note && (
                          <Typography variant="body2" color="text.secondary">{r.review_note}</Typography>
                        )}
                        {r.reviewed_at && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Reviewed {format(new Date(r.reviewed_at), 'MMM d')}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </>
      ) : (
        // ---- Seller review tab ----
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Pending requests on your auctions</Typography>
          {pending.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
              <Typography color="text.secondary">Nothing to review.</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Bidder</TableCell>
                  <TableCell align="right">Bid amount</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Explanation</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pending.map(r => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar variant="rounded"
                          src={r.product_image ? getImageUrl(r.product_image) : undefined}
                          sx={{ width: 40, height: 40 }}>
                          <Gavel fontSize="small" />
                        </Avatar>
                        <Typography variant="body2">{r.product_title}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>@{r.bidder_username}</TableCell>
                    <TableCell align="right">${Number(r.original_amount).toFixed(2)}</TableCell>
                    <TableCell>{reasonLabel(r.reason)}</TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" sx={{
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {r.explanation || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" color="success" variant="outlined"
                          onClick={() => setReviewDialog({ open: true, retraction: r, action: 'approved' })}>
                          Approve
                        </Button>
                        <Button size="small" color="error" variant="outlined"
                          onClick={() => setReviewDialog({ open: true, retraction: r, action: 'denied' })}>
                          Deny
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* Buyer request dialog */}
      <Dialog open={requestDialog} onClose={() => setRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request bid retraction</DialogTitle>
        <DialogContent>
          {selectedBid && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Item</Typography>
              <Typography variant="body1">{selectedBid.product?.title}</Typography>
              <Typography variant="h6" color="primary.main">
                Your bid: ${Number(selectedBid.bidAmount || selectedBid.amount || 0).toFixed(2)}
              </Typography>
            </Box>
          )}
          <TextField
            select fullWidth label="Reason for retraction"
            value={reason} onChange={e => setReason(e.target.value)} sx={{ mb: 2 }}
          >
            {REASONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
          <TextField
            fullWidth multiline rows={3} label="Additional explanation"
            value={explanation} onChange={e => setExplanation(e.target.value)}
            placeholder="Tell the seller why you need to retract this bid…"
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            If approved, your bid will be removed and the auction's current price will
            drop to the next highest bid.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={submitRequest} disabled={!reason}>
            Submit request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Seller review dialog */}
      <Dialog
        open={reviewDialog.open}
        onClose={() => setReviewDialog({ open: false, retraction: null, action: null })}
        maxWidth="sm" fullWidth
      >
        <DialogTitle>
          {reviewDialog.action === 'approved' ? 'Approve retraction' : 'Deny retraction'}
        </DialogTitle>
        <DialogContent>
          {reviewDialog.retraction && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {reviewDialog.retraction.product_title} — bid of
                {' '}${Number(reviewDialog.retraction.original_amount).toFixed(2)} from @{reviewDialog.retraction.bidder_username}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Reason: <b>{reasonLabel(reviewDialog.retraction.reason)}</b>
              </Typography>
              {reviewDialog.retraction.explanation && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  "{reviewDialog.retraction.explanation}"
                </Typography>
              )}
            </Box>
          )}
          <TextField
            fullWidth multiline rows={3} label="Note to bidder (optional)"
            value={reviewNote} onChange={e => setReviewNote(e.target.value)}
          />
          {reviewDialog.action === 'approved' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Approving removes the bid and recalculates the auction's current price.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ open: false, retraction: null, action: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={reviewDialog.action === 'approved' ? 'success' : 'error'}
            onClick={submitReview}
          >
            {reviewDialog.action === 'approved' ? 'Approve' : 'Deny'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default BidRetractions;
