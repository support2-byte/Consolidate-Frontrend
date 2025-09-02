import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../api";
import { TextField, Button, Typography, Paper } from "@mui/material";

export default function Login() {
  const nav = useNavigate();
  const { setUser } = useOutletContext() || {};
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await api.post("/auth/login", form);
      setUser?.(data.user);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.error || "Login failed");
    }
  };

  return (
    <Paper sx={{ maxWidth: 420, mx: "auto", p: 3 }}>
      <Typography variant="h5" gutterBottom>Login</Typography>
      <form onSubmit={submit}>
        <TextField fullWidth margin="normal" label="Email"
          value={form.email} onChange={e=>setForm({...form, email: e.target.value})}/>
        <TextField fullWidth margin="normal" label="Password" type="password"
          value={form.password} onChange={e=>setForm({...form, password: e.target.value})}/>
        {err && <Typography color="error">{err}</Typography>}
        <Button variant="contained" type="submit" fullWidth sx={{ mt: 2 }}>Sign in</Button>
      </form>
    </Paper>
  );
}
