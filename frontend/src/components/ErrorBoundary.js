import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import api from '../services/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Report error to backend
    try {
      api.post('/error-logs', {
        error_type: error.name || 'Error',
        error_message: error.message,
        error_stack: error.stack,
        component_name: errorInfo?.componentStack?.split('\n')[1]?.trim() || 'Unknown',
        page_url: window.location.href,
        browser_info: {
          browser: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
        },
        severity: 'error',
      });
    } catch (reportError) {
      // Silently fail if reporting fails
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              An unexpected error occurred. Our team has been notified.
            </Typography>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3, textAlign: 'left', bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="error" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                </Typography>
              </Paper>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button variant="outlined" onClick={() => { window.location.href = '/'; }}>
                Go Home
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
