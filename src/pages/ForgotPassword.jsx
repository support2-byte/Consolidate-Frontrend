import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  Alert,
  CircularProgress,
  Backdrop,
  Link,
} from "@mui/material";
import { toast } from "react-toastify";
import { api } from "../api";

const ERROR_MESSAGES = {
  VALIDATION_ERROR: "Please enter a valid email address.",
  USER_NOT_FOUND: "No account found with this email address.",
};

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(ERROR_MESSAGES.VALIDATION_ERROR);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/request-reset",
        {
          email: trimmedEmail,
        },
        {
          validateStatus: () => true,
        },
      );

      if (response.data.success) {
        setIsSubmitted(true);
        toast.success(response.data?.message || "Password reset request sent!");
      } else {
        setError(response.data?.message);
        toast.error(response.data?.message);
      }
    } catch (err) {
      toast.error(err.message);
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
        }}
      >
        <Box
          component="img"
          src="/logo-2.png"
          alt="Logo"
          sx={{ height: 70, mb: 3 }}
        />

        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Reset Your Password
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {isSubmitted
            ? "If an account exists with that email, we have sent instructions to reset your password."
            : "Enter the email associated with your account and we'll send you a link to reset your password."}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!isSubmitted ? (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              margin="normal"
              label="Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
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
                  Sending Request...
                </>
              ) : (
                "Request Reset Link"
              )}
            </Button>
          </Box>
        ) : (
          <Alert severity="success" sx={{ mb: 3, textAlign: "left" }}>
            Request has been sent to Administrator, You will receive E-mail when
            Password is reset
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          <Link
            component="button"
            variant="body2"
            underline="hover"
            onClick={() => navigate("/login")}
            disabled={loading}
          >
            Back to Sign In
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}
