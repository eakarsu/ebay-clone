import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { Check, Close } from '@mui/icons-material';

const requirements = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'Uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'Special character (!@#$%...)', test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

const PasswordStrengthMeter = ({ password }) => {
  if (!password) return null;

  const passed = requirements.filter((r) => r.test(password)).length;
  const strength = (passed / requirements.length) * 100;

  const getColor = () => {
    if (strength <= 20) return 'error';
    if (strength <= 40) return 'error';
    if (strength <= 60) return 'warning';
    if (strength <= 80) return 'info';
    return 'success';
  };

  const getLabel = () => {
    if (strength <= 20) return 'Very Weak';
    if (strength <= 40) return 'Weak';
    if (strength <= 60) return 'Fair';
    if (strength <= 80) return 'Strong';
    return 'Very Strong';
  };

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">Password Strength</Typography>
        <Typography variant="caption" color={`${getColor()}.main`} sx={{ fontWeight: 600 }}>
          {getLabel()}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={strength} color={getColor()} sx={{ height: 6, borderRadius: 3, mb: 1 }} />
      <Box>
        {requirements.map((req, i) => {
          const met = req.test(password);
          return (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
              {met ? (
                <Check sx={{ fontSize: 14, color: 'success.main' }} />
              ) : (
                <Close sx={{ fontSize: 14, color: 'text.disabled' }} />
              )}
              <Typography variant="caption" color={met ? 'success.main' : 'text.disabled'}>
                {req.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default PasswordStrengthMeter;
