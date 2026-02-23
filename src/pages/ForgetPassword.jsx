import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
} from '@mui/material';
import { api } from '../api';
export default function AdminResetPasswordDialog({ open, onClose, targetUserEmail }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Force reset states
  const [resetEmail, setResetEmail] = useState(targetUserEmail || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // ── Password validation logic ───────────────────────────────────────
  const passwordRequirements = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    // hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), // optional
  };

  const isPasswordValid = 
    passwordRequirements.minLength &&
    passwordRequirements.hasUppercase &&
    passwordRequirements.hasLowercase &&
    passwordRequirements.hasNumber;
    // && passwordRequirements.hasSpecial // if you want to enforce special char

  const passwordsMatch = newPassword === confirmPassword && newPassword !== "";

  const getPasswordHelperText = () => {
    if (!newPassword) return " ";
    if (!passwordRequirements.minLength) return "Must be at least 8 characters";
    if (!passwordRequirements.hasUppercase) return "Must contain at least one uppercase letter";
    if (!passwordRequirements.hasLowercase) return "Must contain at least one lowercase letter";
    if (!passwordRequirements.hasNumber) return "Must contain at least one number";
    // if (!passwordRequirements.hasSpecial) return "Must contain at least one special character";
    return " ";
  };

  const getConfirmHelperText = () => {
    if (!confirmPassword) return " ";
    if (!passwordsMatch) return "Passwords do not match";
    return " ";
  };

  const handleForceReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetEmail.trim()) {
      setResetError("Email is required");
      return;
    }

    if (!isPasswordValid) {
      setResetError("New password does not meet requirements");
      return;
    }

    if (!passwordsMatch) {
      setResetError("Passwords do not match");
      return;
    }

    setResetLoading(true);

    try {
      const response = await api.post("auth/admin/reset-user-password", {
        email: resetEmail.trim(),
        newPassword,
        confirmPassword,
      });

      const data = response.data;
      console.log("Force reset success:", data);

      setResetSuccess(`Password successfully reset for ${resetEmail.trim()}`);
      
      // Optional: reset fields & close
      setResetEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => onClose(), 1200); // give user time to see success message

    } catch (err) {
      setResetError(err.response?.data?.message || err.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Force Reset Password</DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleForceReset} noValidate sx={{ mt: 1 }}>
          <TextField
            fullWidth
            margin="normal"
            label="User Email"
            type="email"
            autoComplete="email"
            autoFocus
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            disabled={resetLoading}
            error={!!resetError && !resetEmail.trim()}
            helperText={resetError && !resetEmail.trim() ? "Email is required" : " "}
          />

          <TextField
            fullWidth
            margin="normal"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={resetLoading}
            error={newPassword.length > 0 && !isPasswordValid}
            helperText={getPasswordHelperText()}
            FormHelperTextProps={{
              sx: { color: newPassword && !isPasswordValid ? 'error.main' : 'text.secondary' }
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={resetLoading}
            error={confirmPassword.length > 0 && !passwordsMatch}
            helperText={getConfirmHelperText()}
            FormHelperTextProps={{
              sx: { color: confirmPassword && !passwordsMatch ? 'error.main' : 'text.secondary' }
            }}
          />

          {resetError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {resetError}
            </Alert>
          )}

          {resetSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {resetSuccess}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={resetLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleForceReset}
          disabled={
            resetLoading ||
            !resetEmail.trim() ||
            !newPassword ||
            !confirmPassword ||
            !isPasswordValid ||
            !passwordsMatch
          }
        >
          {resetLoading ? 'Resetting...' : 'Reset Password Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}