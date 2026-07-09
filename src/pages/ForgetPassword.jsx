import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { toast } from "react-toastify";
import { api } from "../api";

const passwordRules = (password) => ({
  minLength: password.length >= 8,
  hasUpper: /[A-Z]/.test(password),
  hasLower: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
});

function getPasswordHelper(password) {
  if (!password) return "Enter a strong password";
  const rules = passwordRules(password);
  if (!rules.minLength) return "At least 8 characters";
  if (!rules.hasUpper) return "At least 1 uppercase letter";
  if (!rules.hasLower) return "At least 1 lowercase letter";
  if (!rules.hasNumber) return "At least 1 number";
  return "Strong password!";
}

function isPasswordValid(password) {
  const rules = passwordRules(password);
  return rules.minLength && rules.hasUpper && rules.hasLower && rules.hasNumber;
}

export default function AdminResetPasswordDialog({
  open,
  onClose,
  userId,
  userEmail,
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = newPassword !== "" && newPassword === confirmPassword;

  const handleClose = () => {
    if (loading) return;
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    onClose();
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isPasswordValid(newPassword)) {
      const message = "New password does not meet requirements";
      setError(message);
      toast.error(message);
      return;
    }

    if (!passwordsMatch) {
      const message = "Passwords do not match";
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);

    try {
      await api.post(`/auth/admin/users/${userId}/reset-password`, {
        newPassword,
      });

      const message = `Password reset successfully for ${userEmail}`;
      setSuccess(message);
      toast.success(message);

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      const code = err.response?.data?.error;
      const message =
        code === "USER_NOT_FOUND"
          ? "User not found"
          : "Failed to reset password. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: "error.main", color: "white", py: 1.5 }}>
        Force Reset Password
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
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
            value={userEmail || ""}
            disabled
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            margin="dense"
            label="New Password"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            error={!!newPassword && !isPasswordValid(newPassword)}
            helperText={getPasswordHelper(newPassword)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNew((p) => !p)}
                    edge="end"
                    disabled={loading}
                  >
                    {showNew ? <VisibilityOff /> : <Visibility />}
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
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            error={!!confirmPassword && !passwordsMatch}
            helperText={
              !confirmPassword
                ? "Confirm your new password"
                : passwordsMatch
                  ? "Passwords match!"
                  : "Passwords do not match"
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirm((p) => !p)}
                    edge="end"
                    disabled={loading}
                  >
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleReset}
          disabled={
            loading ||
            !newPassword ||
            !confirmPassword ||
            !isPasswordValid(newPassword) ||
            !passwordsMatch
          }
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {loading ? "Resetting..." : "Force Reset Password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
