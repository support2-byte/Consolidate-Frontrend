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
  Link
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form.email, form.password);
      if (user) {
        nav(from, { replace: true });
      }
    } catch {
      setError("Invalid credentials. Please try again.");
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
        borderRadius: 2
      }}
    >
      {/* Logo */}
      <Box component="img" src="/logo-2.png" alt="Logo" sx={{ height: 60, mb: 2 }} />

      {/* Title */}
      <Typography variant="h6" sx={{ mb: 2, color: "#000", fontWeight: "bold" }}>
        Admin Login
      </Typography>

      {/* Form */}
      <form onSubmit={onSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Username"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {/* Remember me + Forgot password */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 1, mb: 2 }}
        >
          <FormControlLabel
            control={<Checkbox size="small" />}
            label={<Typography variant="body2">Remember me</Typography>}
          />
          <Link href="#" underline="hover" variant="body2">
            Forgot password?
          </Link>
        </Box>

        {/* Error Message */}
        {err && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {err}
          </Typography>
        )}

        {/* Login Button */}
        <Button
          variant="contained"
          type="submit"
          color="#fff"
          fullWidth
          sx={{
            mt: 1,
            bgcolor: "#f58220", // orange color
            "&:hover": { bgcolor: "#d96b1b" }
          }}
        >
         <Typography sx={{  color: "#fff", fontWeight: "" }}>Login </Typography>
        </Button>
      </form>
    </Paper>
  );
}
