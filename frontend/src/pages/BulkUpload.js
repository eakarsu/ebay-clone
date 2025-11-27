import React, { useState, useRef } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableContainer,
  LinearProgress,
  Chip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CloudUpload,
  Download,
  CheckCircle,
  Error,
  Description,
  TableChart,
  ArrowBack,
  Publish,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const BulkUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [uploadResults, setUploadResults] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const steps = ['Download Template', 'Upload CSV', 'Review & Publish'];

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/seller/bulk-upload/template', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bulk_upload_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setActiveStep(1);
      setSnackbar({ open: true, message: 'Template downloaded successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to download template', severity: 'error' });
    }
  };

  const handleDownloadSampleData = async () => {
    try {
      const response = await api.get('/seller/bulk-upload/sample-data', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_products.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setActiveStep(1);
      setSnackbar({ open: true, message: 'Sample data downloaded! Contains 18+ products covering all types, conditions, and features.', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to download sample data', severity: 'error' });
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => !line.startsWith('#') && line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have header row and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length === headers.length) {
        const product = {};
        headers.forEach((header, index) => {
          product[header] = values[index];
        });
        products.push(product);
      }
    }

    return products;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setSnackbar({ open: true, message: 'Please select a CSV file', severity: 'error' });
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const products = parseCSV(e.target.result);
        if (products.length === 0) {
          setSnackbar({ open: true, message: 'No valid products found in CSV', severity: 'error' });
          return;
        }
        if (products.length > 100) {
          setSnackbar({ open: true, message: 'Maximum 100 products per upload', severity: 'error' });
          return;
        }
        setCsvData(products);
        setActiveStep(2);
      } catch (err) {
        setSnackbar({ open: true, message: err.message || 'Failed to parse CSV file', severity: 'error' });
      }
    };
    reader.onerror = () => {
      setSnackbar({ open: true, message: 'Failed to read file', severity: 'error' });
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    try {
      setUploading(true);

      const response = await api.post('/seller/bulk-upload', {
        products: csvData,
      });

      setUploadResults(response.data);
      setSnackbar({
        open: true,
        message: `${response.data.successCount} products uploaded successfully!`,
        severity: response.data.failedCount > 0 ? 'warning' : 'success'
      });
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Upload failed', severity: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setCsvData([]);
    setUploadResults(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CloudUpload sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to use bulk upload</Typography>
        <Button variant="contained" component={Link} to="/login">Sign In</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Bulk Listing Upload</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/my-listings')}
        >
          Back to Listings
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        Upload multiple listings at once using our CSV template. Perfect for high-volume sellers!
      </Alert>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      {activeStep === 0 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TableChart color="primary" />
                Download Template
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Download our CSV template with all product fields. It includes instructions and example data.
              </Typography>

              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Template Includes:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="37 product fields" secondary="Title, pricing, shipping, etc." />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="2 example rows" secondary="Buy Now and Auction samples" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Field descriptions" secondary="Instructions for each field" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Category list" secondary="All available category IDs" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Button
                variant="contained"
                fullWidth
                startIcon={<Download />}
                onClick={handleDownloadTemplate}
                sx={{ mb: 2 }}
              >
                Download CSV Template
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Download />}
                onClick={handleDownloadSampleData}
                color="secondary"
              >
                Download Sample Data (18+ Products)
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Instructions
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="1. Download the template"
                    secondary="Click the download button to get the CSV template"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Fill in your products"
                    secondary="Open in Excel/Google Sheets and add your product data"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Remove instruction lines"
                    secondary="Delete lines starting with # before uploading"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Save as CSV"
                    secondary="Make sure to save the file as CSV format"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="5. Upload and review"
                    secondary="Upload your file and review before publishing"
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeStep === 1 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Upload Your CSV File
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            Select your completed CSV file. Make sure to remove instruction lines (starting with #) before uploading.
          </Typography>

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <Box
            sx={{
              border: 2,
              borderStyle: 'dashed',
              borderColor: selectedFile ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              mb: 3,
              maxWidth: 500,
              mx: 'auto',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFile ? (
              <>
                <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="subtitle1">{selectedFile.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Typography>
              </>
            ) : (
              <>
                <Description sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="subtitle1">Click to select or drag & drop</Typography>
                <Typography variant="caption" color="text.secondary">
                  CSV files only (max 100 products)
                </Typography>
              </>
            )}
          </Box>

          <Button
            variant="outlined"
            onClick={() => setActiveStep(0)}
          >
            Back to Download
          </Button>
        </Paper>
      )}

      {activeStep === 2 && !uploadResults && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Review Products ({csvData.length})
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Review your products below. Click "Upload All" to create these listings.
          </Alert>

          <TableContainer sx={{ maxHeight: 400, mb: 3 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {csvData.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell sx={{ maxWidth: 250 }}>
                      <Typography variant="body2" noWrap>
                        {product.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.listing_type}
                        size="small"
                        color={product.listing_type === 'auction' ? 'secondary' : 'primary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      ${product.buy_now_price || product.starting_price || '0'}
                    </TableCell>
                    <TableCell>{product.quantity || 1}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.status || 'draft'}
                        size="small"
                        color={product.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {uploading && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Uploading products...
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setActiveStep(1);
                setCsvData([]);
              }}
              disabled={uploading}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<Publish />}
              onClick={handleUpload}
              disabled={uploading}
            >
              Upload All ({csvData.length} products)
            </Button>
          </Box>
        </Paper>
      )}

      {uploadResults && (
        <Paper sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {uploadResults.failedCount === 0 ? (
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            ) : (
              <Error sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
            )}
            <Typography variant="h5" gutterBottom>
              Upload Complete
            </Typography>
            <Typography color="text.secondary">
              {uploadResults.successCount} of {uploadResults.successCount + uploadResults.failedCount} products uploaded successfully
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
            <Chip
              icon={<CheckCircle />}
              label={`${uploadResults.successCount} Succeeded`}
              color="success"
            />
            {uploadResults.failedCount > 0 && (
              <Chip
                icon={<Error />}
                label={`${uploadResults.failedCount} Failed`}
                color="error"
              />
            )}
          </Box>

          {uploadResults.results?.failed?.length > 0 && (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadResults.results.failed.map((item) => (
                    <TableRow key={item.row}>
                      <TableCell>{item.row}</TableCell>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>
                        <Typography color="error" variant="body2">
                          {item.error}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={handleReset}>
              Upload More
            </Button>
            <Button variant="contained" onClick={() => navigate('/my-listings')}>
              View Listings
            </Button>
          </Box>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BulkUpload;
