import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Skeleton,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Schedule,
  MoreVert,
  Edit,
  Delete,
  PlayArrow,
  Add,
  CalendarMonth,
} from '@mui/icons-material';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { Link } from 'react-router-dom';
import { scheduledListingService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ScheduledListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [newScheduleTime, setNewScheduleTime] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const fetchListings = async () => {
    try {
      const response = await scheduledListingService.getMyScheduled();
      setListings(response.data || []);
    } catch (error) {
      console.error('Error fetching scheduled listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNow = async (id) => {
    try {
      await scheduledListingService.publishNow(id);
      fetchListings();
      setSnackbar({ open: true, message: 'Listing published!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to publish', severity: 'error' });
    }
    setAnchorEl(null);
  };

  const handleDelete = async (id) => {
    try {
      await scheduledListingService.delete(id);
      fetchListings();
      setSnackbar({ open: true, message: 'Scheduled listing deleted', severity: 'info' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    }
    setAnchorEl(null);
  };

  const handleUpdateSchedule = async () => {
    if (!selectedListing || !newScheduleTime) return;
    try {
      await scheduledListingService.update(selectedListing.id, {
        scheduledFor: newScheduleTime.toISOString(),
      });
      setEditDialog(false);
      fetchListings();
      setSnackbar({ open: true, message: 'Schedule updated!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update schedule', severity: 'error' });
    }
  };

  const getStatusChip = (listing) => {
    if (listing.status === 'published') {
      return <Chip size="small" label="Published" color="success" />;
    }
    if (isPast(new Date(listing.scheduledFor))) {
      return <Chip size="small" label="Overdue" color="error" />;
    }
    return <Chip size="small" label="Scheduled" color="primary" />;
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Schedule sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to view scheduled listings</Typography>
        <Button variant="contained" component={Link} to="/login">Sign In</Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" height={60} />
        <Skeleton variant="rectangular" height={400} />
      </Container>
    );
  }

  const pendingListings = listings.filter(l => l.status === 'pending');
  const publishedListings = listings.filter(l => l.status === 'published');

  return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Scheduled Listings</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            component={Link}
            to="/sell?schedule=true"
          >
            Schedule New Listing
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary.main">{listings.length}</Typography>
                <Typography variant="body2" color="text.secondary">Total Scheduled</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="warning.main">{pendingListings.length}</Typography>
                <Typography variant="body2" color="text.secondary">Pending</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main">{publishedListings.length}</Typography>
                <Typography variant="body2" color="text.secondary">Published</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3">
                  {pendingListings.length > 0
                    ? format(new Date(pendingListings.sort((a, b) =>
                        new Date(a.scheduledFor) - new Date(b.scheduledFor)
                      )[0]?.scheduledFor), 'MMM d')
                    : '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">Next Launch</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Listings Table */}
        <Paper>
          {listings.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CalendarMonth sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No scheduled listings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Schedule your listings to go live at the perfect time for maximum visibility.
              </Typography>
              <Button variant="contained" component={Link} to="/sell?schedule=true">
                Schedule Your First Listing
              </Button>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell>Scheduled For</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          variant="rounded"
                          src={listing.images?.[0]?.url || listing.product?.images?.[0]?.url}
                          sx={{ width: 48, height: 48 }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {(listing.title || listing.product?.title)?.slice(0, 50)}...
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={listing.category?.name || 'General'} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        ${listing.buyNowPrice?.toFixed(2) || listing.startingPrice?.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(listing.scheduledFor), 'MMM d, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(listing.scheduledFor), 'h:mm a')}
                      </Typography>
                      {listing.status === 'pending' && isFuture(new Date(listing.scheduledFor)) && (
                        <Typography variant="caption" color="primary.main" sx={{ display: 'block' }}>
                          {formatDistanceToNow(new Date(listing.scheduledFor), { addSuffix: true })}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(listing)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setSelectedListing(listing);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {selectedListing?.status === 'pending' && (
            <MenuItem onClick={() => handlePublishNow(selectedListing?.id)}>
              <PlayArrow sx={{ mr: 1 }} /> Publish Now
            </MenuItem>
          )}
          <MenuItem onClick={() => {
            setNewScheduleTime(new Date(selectedListing?.scheduledFor));
            setEditDialog(true);
            setAnchorEl(null);
          }}>
            <Edit sx={{ mr: 1 }} /> Reschedule
          </MenuItem>
          <MenuItem onClick={() => handleDelete(selectedListing?.id)} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>

        {/* Edit Schedule Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
          <DialogTitle>Reschedule Listing</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {selectedListing?.title || selectedListing?.product?.title}
            </Typography>
            <TextField
              fullWidth
              label="New Schedule Time"
              type="datetime-local"
              value={newScheduleTime ? new Date(newScheduleTime).toISOString().slice(0, 16) : ''}
              onChange={(e) => setNewScheduleTime(new Date(e.target.value))}
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateSchedule}>
              Update Schedule
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Container>
  );
};

export default ScheduledListings;
