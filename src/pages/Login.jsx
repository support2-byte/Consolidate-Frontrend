// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
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
  CircularProgress,
  InputAdornment,
  IconButton,
  Backdrop,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // ── Form states ────────────────────────────────────────────────
  const [credentials, setCredentials] = useState({
    email: localStorage.getItem("rememberedEmail") || "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem("rememberMe"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  e.stopPropagation();

  setError("");
  setLoading(true);

  try {
    const email = credentials.email.trim();
    const password = credentials.password;

    if (!email || !password) throw new Error("Email and password required");

    await login(email, password);

    // Save remember me
    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("rememberedEmail");
    }

    // Navigate – small delay helps React finalize state
    await new Promise(r => setTimeout(r, 300));

    const redirectTo = location.state?.from?.pathname || "/dashboard";
    navigate(redirectTo, { replace: true });

  } catch (err) {
    const message = err.message || "Login failed";
    setError(message);
  } finally {
    setLoading(false);
  }
};
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
        position: "relative",
      }}
    >
      {/* Full-screen loading overlay */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Paper
        elevation={6}
        sx={{
          maxWidth: 550,
          width: "100%",
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Logo */}
        <Box component="img" src="/logo-2.png" alt="Logo" sx={{ height: 70, mb: 3 }} />

        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to continue to Consolidate Dashboard
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
<Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>

          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            disabled={loading}
            error={!!error && !credentials.email.trim()}
            helperText={!!error && !credentials.email.trim() ? "Email is required" : " "}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            disabled={loading}
            error={!!error && !credentials.password}
            helperText={!!error && !credentials.password ? "Password is required" : " "}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                  disabled={loading}
                />
              }
              label="Remember me"
            />

            {/* <Link
              component="button"
              variant="body2"
              underline="hover"
              onClick={() => navigate("/forgot-password")}
              type="button"
              disabled={loading}
            >
              Forgot password?
            </Link> */}
          </Box>

  {/* Your TextFields */}

  <Button
    type="submit"
    fullWidth
    variant="contained"
    disabled={loading}
    sx={{ py: 1.5, mt: 3 }}
  >
    {loading ? (
      <>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        Signing in...
      </>
    ) : (
      "Sign In"
    )}
  </Button>
</Box>

        {/* Optional hint */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: "block" }}>
          Admin access? Use your registered credentials.
        </Typography>
      </Paper>
    </Box>
  );
}