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
  Stack,
  Avatar,
  Typography,
  LinearProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LockReset,
  Close,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

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

function passwordStrengthScore(password) {
  const rules = passwordRules(password);
  return Object.values(rules).filter(Boolean).length; // 0-4
}

const strengthMeta = [
  { label: "Very weak", color: "error.main" },
  { label: "Weak", color: "error.main" },
  { label: "Fair", color: "warning.main" },
  { label: "Good", color: "warning.main" },
  { label: "Strong", color: "success.main" },
];

function getInitials(email) {
  if (!email) return "?";
  const namePart = email.split("@")[0];
  return namePart.slice(0, 2).toUpperCase();
}

export default function ChangePasswordDialog({ open, onClose }) {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = newPassword !== "" && newPassword === confirmPassword;
  const strength = passwordStrengthScore(newPassword);

  const handleClose = () => {
    if (loading) return;
    setCurrentPassword("");
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

    if (!currentPassword) {
      const message = "Enter your current password";
      setError(message);
      toast.error(message);
      return;
    }

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
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      const message = "Password changed successfully. Logging you out...";
      setSuccess(message);
      toast.success(message);

      setTimeout(() => {
        handleClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      const code = err.response?.data?.error;
      const message =
        code === "INVALID_CURRENT_PASSWORD"
          ? "Current password is incorrect"
          : err.response?.data?.message ||
            "Failed to change password. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <DialogTitle
        sx={{
          bgcolor: "secondary.main",
          color: "#fff",
          py: 2,
          px: 3,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LockReset fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                Change Password
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Update the password for your account
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={handleClose}
            disabled={loading}
            size="small"
            sx={{ color: "#fff" }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      {loading && <LinearProgress color="secondary" />}

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={(theme) => ({
            my: 3,
            p: 1.5,
            borderRadius: 2,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(15,118,110,0.12)"
                : "rgba(15,118,110,0.06)",
            border: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 40,
              height: 40,
              fontSize: 14,
            }}
          >
            {getInitials(user?.email)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              Signed in as
            </Typography>
            <Typography
              variant="body1"
              fontWeight={600}
              noWrap
              title={user?.email || undefined}
            >
              {user?.email || "Unknown user"}
            </Typography>
          </Box>
        </Stack>

        <Box component="form" onSubmit={handleReset} noValidate>
          <TextField
            fullWidth
            margin="dense"
            label="Current Password"
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrent((p) => !p)}
                    edge="end"
                    disabled={loading}
                  >
                    {showCurrent ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
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
            sx={{ mb: 0.5 }}
          />

          {newPassword && (
            <Box sx={{ mb: 2, px: 0.5 }}>
              <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                {[0, 1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    sx={(theme) => ({
                      height: 4,
                      flex: 1,
                      borderRadius: 2,
                      bgcolor:
                        i < strength
                          ? strengthMeta[strength].color
                          : theme.palette.divider,
                    })}
                  />
                ))}
              </Box>
              <Typography
                variant="caption"
                sx={{ color: strengthMeta[strength].color }}
              >
                {strengthMeta[strength].label}
              </Typography>
            </Box>
          )}

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

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleReset}
          disabled={
            loading ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword ||
            !isPasswordValid(newPassword) ||
            !passwordsMatch
          }
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <LockReset />
            )
          }
        >
          {loading ? "Updating..." : "Change Password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
