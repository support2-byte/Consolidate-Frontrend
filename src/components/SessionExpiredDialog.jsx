import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Incorrect password",
  ACCOUNT_DISABLED: "Your account has been disabled. Contact an administrator.",
};

export default function SessionExpiredDialog({
  open,
  email,
  onSubmit,
  onSignInAsAnother,
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    setError("");
    setLoading(true);
    try {
      await onSubmit(password);
      setPassword("");
    } catch (err) {
      setError(
        ERROR_MESSAGES[err.message] || "Sign in failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // No onClose: the dialog cannot be dismissed by Esc or by clicking outside.
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Session expired</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You were signed out after 30 minutes of inactivity. Enter your
            password to continue where you left off.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Email"
            value={email || ""}
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            autoFocus
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Button
            type="button"
            onClick={onSignInAsAnother}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            Sign in as someone else
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !password}
            sx={{ textTransform: "none" }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Continue"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
