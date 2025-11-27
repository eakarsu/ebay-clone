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
  Chip,
  IconButton,
  Skeleton,
  Grid,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Receipt,
  Download,
  Print,
  Visibility,
  CheckCircle,
  Pending,
  Warning,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { invoiceService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const response = await invoiceService.getMyInvoices();
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoice) => {
    try {
      const response = await invoiceService.download(invoice.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to download invoice', severity: 'error' });
    }
  };

  const handlePrint = (invoice) => {
    setSelectedInvoice(invoice);
    setViewDialog(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      paid: { color: 'success', icon: <CheckCircle />, label: 'Paid' },
      pending: { color: 'warning', icon: <Pending />, label: 'Pending' },
      overdue: { color: 'error', icon: <Warning />, label: 'Overdue' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Chip size="small" label={config.label} color={config.color} icon={config.icon} />;
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Receipt sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to view your invoices</Typography>
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

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.total || 0), 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <Receipt color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Invoices</Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">{invoices.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Invoices</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                ${totalPaid.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Paid</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                ${totalPending.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4">
                {invoices.filter(i => i.status === 'paid').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoices Table */}
      <Paper>
        {invoices.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Receipt sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No invoices yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Invoices will appear here after you make purchases or complete sales.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {invoice.invoiceNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      component={Link}
                      to={`/orders/${invoice.orderId}`}
                    >
                      #{invoice.orderId?.slice(0, 8)}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={invoice.type === 'purchase' ? 'Purchase' : 'Sale'}
                      color={invoice.type === 'purchase' ? 'default' : 'primary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      ${invoice.total?.toFixed(2)}
                    </Typography>
                    {invoice.taxAmount > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Tax: ${invoice.taxAmount?.toFixed(2)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{getStatusChip(invoice.status)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setViewDialog(true);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDownload(invoice)}>
                      <Download />
                    </IconButton>
                    <IconButton size="small" onClick={() => handlePrint(invoice)}>
                      <Print />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Invoice View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Invoice {selectedInvoice?.invoiceNumber}</Typography>
            {getStatusChip(selectedInvoice?.status)}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ py: 2 }} id="invoice-content">
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    INVOICE
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    #{selectedInvoice.invoiceNumber}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">
                    Date: {format(new Date(selectedInvoice.createdAt), 'MMMM d, yyyy')}
                  </Typography>
                  <Typography variant="body2">
                    Due: {format(new Date(selectedInvoice.dueDate || selectedInvoice.createdAt), 'MMMM d, yyyy')}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">From</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedInvoice.seller?.storeName || selectedInvoice.seller?.username || 'eBay Clone'}
                  </Typography>
                  <Typography variant="body2">{selectedInvoice.seller?.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Bill To</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedInvoice.buyer?.username || user?.username}
                  </Typography>
                  <Typography variant="body2">{selectedInvoice.buyer?.email || user?.email}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              {/* Line Items */}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedInvoice.items?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.title || item.product?.title}</TableCell>
                      <TableCell align="right">{item.quantity || 1}</TableCell>
                      <TableCell align="right">${item.price?.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Divider sx={{ my: 2 }} />

              {/* Totals */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ width: 300 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal:</Typography>
                    <Typography>${selectedInvoice.subtotal?.toFixed(2)}</Typography>
                  </Box>
                  {selectedInvoice.shippingAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Shipping:</Typography>
                      <Typography>${selectedInvoice.shippingAmount?.toFixed(2)}</Typography>
                    </Box>
                  )}
                  {selectedInvoice.taxAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Tax:</Typography>
                      <Typography>${selectedInvoice.taxAmount?.toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Total:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      ${selectedInvoice.total?.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
          <Button startIcon={<Print />} onClick={() => window.print()}>Print</Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => handleDownload(selectedInvoice)}
          >
            Download PDF
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

export default Invoices;
