import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  FormControlLabel,
  Checkbox,
  Link,
  Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import ForgetPassword from "./ForgetPassword";
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // ── Login states ─────────────────────────────────────────────
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Forced reset states (admin-style) ────────────────────────
  const [showResetForm, setShowResetForm] = useState(false);

  // ── Normal login ─────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      await login(credentials.email.trim(), credentials.password);
      navigate(from, { replace: true });
    } catch (err) {
      setLoginError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Invalid credentials. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <Paper
      elevation={6}
      sx={{
        maxWidth: 400,
        mx: "auto",
        mt: 10,
        p: 4,
        textAlign: "center",
        borderRadius: 2,
      }}
    >
      <Box component="img" src="/logo-2.png" alt="Logo" sx={{ height: 60, mb: 2 }} />

      <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
        {showResetForm ? "Force Reset Password" : "Admin Login"}
      </Typography>

      {showResetForm ? (
        <ForgetPassword open={showResetForm} onClose={() => setShowResetForm(false)} />
      ) : (
        // ── Normal Login Form ────────────────────────────────────
        <form onSubmit={handleLogin} noValidate>
          <TextField
            fullWidth
            margin="normal"
            label="Email / Username"
            autoComplete="email"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            disabled={loginLoading}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            disabled={loginLoading}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 1,
              mb: 3,
            }}
          >
            <FormControlLabel
              control={<Checkbox size="small" />}
              label={<Typography variant="body2">Remember me</Typography>}
            />

            <Link
              component="button"
              variant="body2"
              underline="hover"
              onClick={() => setShowResetForm(true)}
              type="button"
            >
              Force reset password
            </Link>
          </Box>

          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loginLoading}
            sx={{
              bgcolor: "#f58220",
              "&:hover": { bgcolor: "#d96b1b" },
              py: 1.5,
            }}
          >
            {loginLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      )}
    </Paper>
  );
}