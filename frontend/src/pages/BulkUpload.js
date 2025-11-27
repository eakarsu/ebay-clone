import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Chip,
  Alert,
  Link as MuiLink,
  Snackbar,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  CloudUpload,
  Download,
  CheckCircle,
  Error,
  Pending,
  Description,
  TableChart,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { bulkUploadService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const BulkUpload = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const steps = ['Download Template', 'Fill in Data', 'Upload File', 'Processing'];

  useEffect(() => {
    if (user) {
      fetchTemplates();
      fetchJobs();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const response = await bulkUploadService.getTemplates();
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await bulkUploadService.getJobs();
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setActiveStep(2);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await bulkUploadService.upload(formData);
      setSelectedFile(null);
      setActiveStep(3);
      fetchJobs();
      setSnackbar({ open: true, message: 'File uploaded successfully! Processing...', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Upload failed', severity: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      case 'processing':
        return <Pending color="warning" />;
      default:
        return <Pending color="action" />;
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <CloudUpload color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Bulk Listing Upload</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        Upload multiple listings at once using our CSV templates. Perfect for high-volume sellers!
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

      <Grid container spacing={4}>
        {/* Templates */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TableChart color="primary" />
              Download Templates
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose a template based on your category. Fill in the required fields and upload.
            </Typography>

            {templates.length > 0 ? (
              templates.map((template) => (
                <Card key={template.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {template.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.category || 'All categories'}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Download />}
                      href={template.downloadUrl}
                      onClick={() => setActiveStep(1)}
                    >
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Description sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                <Typography color="text.secondary">No templates available</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  sx={{ mt: 2 }}
                  onClick={() => setActiveStep(1)}
                >
                  Download Sample Template
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Upload */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUpload color="primary" />
              Upload File
            </Typography>

            <Box
              sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: selectedFile ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: selectedFile ? 'primary.50' : 'grey.50',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
              }}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                hidden
                onChange={handleFileSelect}
              />
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
                  <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                  <Typography variant="subtitle1">Drop your file here or click to browse</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supports CSV, XLSX, XLS (max 5MB)
                  </Typography>
                </>
              )}
            </Box>

            {selectedFile && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleUpload}
                  disabled={uploading}
                  startIcon={<CloudUpload />}
                >
                  {uploading ? 'Uploading...' : 'Upload and Process'}
                </Button>
                {uploading && <LinearProgress sx={{ mt: 2 }} />}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Upload History */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Upload History</Typography>

        {jobs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">No uploads yet</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Success</TableCell>
                <TableCell align="right">Failed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(job.status)}
                      <Typography variant="body2">{job.fileName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {format(new Date(job.createdAt), 'MMM d, yyyy h:mm a')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={job.status}
                      color={
                        job.status === 'completed' ? 'success' :
                        job.status === 'failed' ? 'error' :
                        job.status === 'processing' ? 'warning' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">{job.totalItems || 0}</TableCell>
                  <TableCell align="right">
                    <Typography color="success.main">{job.successCount || 0}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography color="error.main">{job.failedCount || 0}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

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

export default BulkUpload;
