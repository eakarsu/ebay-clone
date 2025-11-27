import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'success.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <Email sx={{ fontSize: 40, color: 'success.main' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Check Your Email
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            We've sent a password reset link to <strong>{email}</strong>. Please check
            your inbox and follow the instructions to reset your password.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Didn't receive the email? Check your spam folder or try again.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setSuccess(false)}
            sx={{ mr: 2 }}
          >
            Try Again
          </Button>
          <Button component={Link} to="/login" variant="contained">
            Back to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Button
          component={Link}
          to="/login"
          startIcon={<ArrowBack />}
          sx={{ mb: 3 }}
        >
          Back to Login
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Forgot Password?
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
