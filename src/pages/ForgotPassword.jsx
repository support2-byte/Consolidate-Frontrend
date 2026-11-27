import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  Typography,
} from "@mui/material";
import {
  EmailOutlined,
  ArrowBack,
  MarkEmailReadOutlined,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { api } from "../api";
import AuthLayout from "../components/AppLayout";

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
        { email: trimmedEmail },
        { validateStatus: () => true },
      );

      if (response.data.success) {
        setIsSubmitted(true);
        toast.success(response.data?.message || "Password reset request sent!");
      } else {
        setError(response.data?.message);
        toast.error(response.data?.message);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isSubmitted ? "Request sent" : "Reset your password"}
      subtitle={
        isSubmitted
          ? "If an account exists with that email, we have sent instructions to reset your password."
          : "Enter the email linked to your account and we will send a reset request."
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!isSubmitted ? (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="Email address"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined fontSize="small" color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 },
            }}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            size="large"
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1.5 }} />
                Sending request...
              </>
            ) : (
              "Request reset link"
            )}
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            p: 2.5,
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <MarkEmailReadOutlined color="primary" />
          <Typography variant="body2" color="text.secondary">
            The request has been sent to the administrator. You will receive an
            email once your password is reset.
          </Typography>
        </Box>
      )}

      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/login")}
        disabled={loading}
        sx={{ mt: 3, textTransform: "none" }}
      >
        Back to sign in
      </Button>
    </AuthLayout>
  );
}
