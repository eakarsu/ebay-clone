import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Security,
  Lock,
  Smartphone,
  VpnKey,
  CheckCircle,
} from '@mui/icons-material';
import api from '../services/api';

const SecuritySettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setupDialog, setSetupDialog] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await api.get('/auth/me');
      // Backend returns data directly, not wrapped in user object
      setTwoFactorEnabled(response.data?.twoFactorEnabled || false);
    } catch (err) {
      console.error('Failed to check 2FA status:', err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setSuccess('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/2fa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setSetupDialog(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/2fa/verify', {
        code: verificationCode,
      });
      setBackupCodes(response.data.backupCodes);
      setTwoFactorEnabled(true);
      setShowBackupCodes(true);
      setSetupDialog(false);
      setVerificationCode('');
      setSuccess('Two-factor authentication enabled successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/2fa/disable');
      setTwoFactorEnabled(false);
      setSuccess('Two-factor authentication disabled');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/2fa/regenerate-backup-codes');
      setBackupCodes(response.data.backupCodes);
      setShowBackupCodes(true);
      setSuccess('New backup codes generated');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Security Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Change Password */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Lock sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">Change Password</Typography>
        </Box>

        <form onSubmit={handleChangePassword}>
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={passwords.currentPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, currentPassword: e.target.value })
            }
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={passwords.newPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, newPassword: e.target.value })
            }
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={passwords.confirmPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, confirmPassword: e.target.value })
            }
            sx={{ mb: 3 }}
            required
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </form>
      </Paper>

      {/* Two-Factor Authentication */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Smartphone sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">Two-Factor Authentication</Typography>
        </Box>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Add an extra layer of security to your account by requiring a
          verification code in addition to your password.
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              {twoFactorEnabled ? (
                <CheckCircle color="success" />
              ) : (
                <Security color="disabled" />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Authenticator App"
              secondary={
                twoFactorEnabled
                  ? 'Two-factor authentication is enabled'
                  : 'Use an authenticator app like Google Authenticator or Authy'
              }
            />
            {twoFactorEnabled ? (
              <Button color="error" onClick={handleDisable2FA} disabled={loading}>
                Disable
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSetup2FA} disabled={loading}>
                Enable
              </Button>
            )}
          </ListItem>
        </List>

        {twoFactorEnabled && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <VpnKey sx={{ mr: 2, color: 'warning.main' }} />
              <Typography variant="subtitle1">Backup Codes</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Backup codes can be used to access your account if you lose your
              authenticator device.
            </Typography>
            <Button
              variant="outlined"
              onClick={handleRegenerateBackupCodes}
              disabled={loading}
            >
              Generate New Backup Codes
            </Button>
          </>
        )}
      </Paper>

      {/* 2FA Setup Dialog */}
      <Dialog open={setupDialog} onClose={() => setSetupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            1. Scan this QR code with your authenticator app:
          </Typography>

          {qrCode && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <img src={qrCode} alt="QR Code" style={{ maxWidth: 200 }} />
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Or manually enter this code: <strong>{secret}</strong>
          </Typography>

          <Typography sx={{ mb: 2 }}>
            2. Enter the 6-digit code from your authenticator app:
          </Typography>

          <TextField
            fullWidth
            label="Verification Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="000000"
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleVerify2FA}
            disabled={loading || verificationCode.length !== 6}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify & Enable'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onClose={() => setShowBackupCodes(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Your Backup Codes</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Save these codes in a safe place. Each code can only be used once.
          </Alert>

          <Grid container spacing={1}>
            {backupCodes.map((code, index) => (
              <Grid item xs={6} key={index}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: '1.1rem',
                  }}
                >
                  {code}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(backupCodes.join('\n'));
              setSuccess('Backup codes copied to clipboard');
            }}
          >
            Copy All
          </Button>
          <Button variant="contained" onClick={() => setShowBackupCodes(false)}>
            I've Saved These Codes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SecuritySettings;
