import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Security } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(
        formData.email,
        formData.password,
        requiresTwoFactor ? twoFactorCode : null
      );

      if (result?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setLoading(false);
        return;
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRequiresTwoFactor(false);
    setTwoFactorCode('');
    setError('');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Sign in to eBay
          </Typography>
          <Typography variant="body2" color="text.secondary">
            New to eBay?{' '}
            <Link to="/register" style={{ color: '#3665f3' }}>
              Create an account
            </Link>
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {requiresTwoFactor ? (
          <form onSubmit={handleSubmit}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Security sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Two-Factor Authentication
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter the 6-digit code from your authenticator app
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Verification Code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              margin="normal"
              required
              autoFocus
              inputProps={{ maxLength: 6 }}
              placeholder="000000"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || twoFactorCode.length !== 6}
              sx={{
                mt: 3,
                mb: 2,
                borderRadius: 5,
                py: 1.5,
                bgcolor: '#3665f3',
                '&:hover': { bgcolor: '#2a4dc4' },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify & Sign In'}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={handleBackToLogin}
              sx={{ textTransform: 'none' }}
            >
              Back to login
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                borderRadius: 5,
                py: 1.5,
                bgcolor: '#3665f3',
                '&:hover': { bgcolor: '#2a4dc4' },
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        )}

        {!requiresTwoFactor && (
          <>
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Quick Login (Demo)
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click to auto-fill credentials:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFormData({ email: 'jane@example.com', password: 'password123' })}
                >
                  Buyer (Jane)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => setFormData({ email: 'techdeals@example.com', password: 'password123' })}
                >
                  Seller (TechDeals)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => setFormData({ email: 'vintage@example.com', password: 'password123' })}
                >
                  Seller (Vintage)
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => setFormData({ email: 'fashion@example.com', password: 'password123' })}
                >
                  Seller (Fashionista)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="info"
                  onClick={() => setFormData({ email: 'sports@example.com', password: 'password123' })}
                >
                  Seller (SportsGear)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFormData({ email: 'home@example.com', password: 'password123' })}
                >
                  Seller (Home)
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Login;
