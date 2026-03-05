// src/components/AdminResetPasswordDialog.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { api } from '../api';

export default function AdminResetPasswordDialog({ open, onClose, targetUserEmail }) {
  const [resetEmail, setResetEmail] = useState(targetUserEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ────────────────────────────────────────────────────────────────
  // Validation Helpers
  // ────────────────────────────────────────────────────────────────
  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    // hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), // optional
  };

  const isPasswordValid = 
    passwordRules.minLength &&
    passwordRules.hasUpper &&
    passwordRules.hasLower &&
    passwordRules.hasNumber;

  const passwordsMatch = newPassword === confirmPassword && newPassword !== '';

  const getPasswordHelper = () => {
    if (!newPassword) return 'Enter a strong password';
    if (!passwordRules.minLength) return 'At least 8 characters';
    if (!passwordRules.hasUpper) return 'At least 1 uppercase letter';
    if (!passwordRules.hasLower) return 'At least 1 lowercase letter';
    if (!passwordRules.hasNumber) return 'At least 1 number';
    return 'Strong password!';
  };

  const getConfirmHelper = () => {
    if (!confirmPassword) return 'Confirm your new password';
    if (!passwordsMatch) return 'Passwords do not match';
    return 'Passwords match!';
  };

console.log("forget password",targetUserEmail)

  // ────────────────────────────────────────────────────────────────
  // Submit handler
  // ────────────────────────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!resetEmail.trim()) {
      setError('Email is required');
      return;
    }

    if (!isPasswordValid) {
      setError('New password does not meet requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/admin/reset-user-password', {
        email: resetEmail.trim().toLowerCase(),
        newPassword,
        confirmPassword,
      });
      

      setSuccess(`Password successfully reset for ${resetEmail.trim()}`);
      
      // Auto-close after 1.5 seconds
      setTimeout(() => {
        onClose();
        // Optional: refresh users list in parent component
        // window.location.reload(); // or call refreshSession() from context
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error ||
                  err.response?.data?.message ||
                  'Failed to reset password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={loading}
      disableBackdropClick={loading}
    >
      <DialogTitle sx={{ bgcolor: '#f58220', color: 'white', py: 1.5 }}>
        Force Reset User Password
      </DialogTitle>

      <DialogContent sx={{ pt: 5 }}>
       
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleReset} noValidate>
          <TextField
            fullWidth
            margin="dense"
            label="User Email"
            type="email"
            value={targetUserEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            disabled
            error={!!error && !resetEmail.trim()}
            helperText={!resetEmail.trim() && error ? 'Email is required' : ' '}
            sx={{ mt: 3 }}
          />

          <TextField
            fullWidth
            margin="dense"
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            error={newPassword && !isPasswordValid}
            helperText={getPasswordHelper()}
            FormHelperTextProps={{ sx: { color: newPassword && !isPasswordValid ? 'error.main' : 'text.secondary' } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                    disabled={loading}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />

          <TextField
            fullWidth
            margin="dense"
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            error={confirmPassword && !passwordsMatch}
            helperText={getConfirmHelper()}
            FormHelperTextProps={{ sx: { color: confirmPassword && !passwordsMatch ? 'error.main' : 'text.secondary' } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="error"
          onClick={handleReset}
          disabled={
            loading ||
            !resetEmail.trim() ||
            !newPassword ||
            !confirmPassword ||
            !isPasswordValid ||
            !passwordsMatch
          }
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Resetting...' : 'Force Reset Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}