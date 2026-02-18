import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
    Typography,
  TextField,
  Button,
  Alert,
  Box
} from '@mui/material';
import { api } from '../api';
// import { useNavigate } from 'react-router-dom';
export default function AdminResetPasswordDialog({ open, onClose, targetUserEmail }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  // ── Forced reset states (admin-style) ────────────────────────
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
   const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const handleForceReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetEmail.trim()) {
      setResetError("Email is required");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setResetError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }
      console.log("Attempting force reset for:", resetEmail);
    // setResetLoading(true);

    try {
      // console.log("Force reset API response:", api.post("auth/admin/reset-user-password"));

      const response = await api.post("auth/admin/reset-user-password", {
        email: resetEmail.trim(),
        newPassword,
        confirmPassword,
      });
      console.log("Force reset response status:", response);
      const data = await response.data;
      console.log("Force reset API response:", data);
      // navigate("/login");

console.log("Force reset API response data:", data);
      // setResetSuccess(`Password successfully changed for ${resetEmail.trim()}`);
      // navigate("/login");
      // Optional: clear fields
      setResetEmail("");
      setNewPassword("");
      setConfirmPassword("");
onClose();

    } catch (err) {
      setResetError(err.message || "Something went wrong. Try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Force Reset Password</DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleForceReset} noValidate>
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
            error={!!resetError}
          />

          <TextField
            fullWidth
            margin="normal"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={resetLoading}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={resetLoading}
          />

          {resetError && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
              {resetError}
            </Alert>
          )}

          {resetSuccess && (
            <Alert severity="success" sx={{ mt: 2, mb: 1 }}>
              {resetSuccess}
            </Alert>
          )}

          {/* <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={resetLoading || !resetEmail.trim() || !newPassword || !confirmPassword}
            sx={{
              mt: 3,
              bgcolor: "#f58220",
              "&:hover": { bgcolor: "#d96b1b" },
            }}
          >
            {resetLoading ? "Resetting..." : "Reset Password Now"}
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => {
              setShowResetForm(false);
              setResetError("");
              setResetSuccess("");
              setResetEmail("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            sx={{ mt: 1.5 }}
          >
            ← Back to Login
          </Button> */}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          variant="contained" 
          color="error"
          onClick={handleForceReset}
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? 'Resetting...' : 'Reset Password Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}