import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { api } from "../api";
import { toast } from "react-toastify";

const ERROR_MESSAGES = {
  EMAIL_TAKEN: "An account with this email already exists.",
  VALIDATION_ERROR: "Email and password are required.",
};

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      const message = ERROR_MESSAGES.VALIDATION_ERROR;
      setError(message);
      toast.error(message);
      return;
    }

    if (form.password.length < 8) {
      const message = "Password must be at least 8 characters.";
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim() || undefined,
      });

      toast.success("Account created successfully!");

      navigate("/login");
    } catch (err) {
      const code = err.response?.data?.error;
      const message =
        ERROR_MESSAGES[code] || "Registration failed. Please try again.";

      setError(message);
      toast.error(message);
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
      }}
    >
      <Paper
        elevation={6}
        sx={{
          maxWidth: 500,
          width: "100%",
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <Box
          component="img"
          src="/logo-2.png"
          alt="Logo"
          sx={{ height: 70, mb: 3 }}
        />

        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Register to access the Consolidate Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            margin="normal"
            label="Full Name"
            autoComplete="name"
            autoFocus
            value={form.name}
            onChange={handleChange("name")}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange("email")}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange("password")}
            disabled={loading}
            helperText="Minimum 8 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate("/login")}
            disabled={loading}
            sx={{ mt: 1 }}
          >
            Already have an account? Sign in
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
