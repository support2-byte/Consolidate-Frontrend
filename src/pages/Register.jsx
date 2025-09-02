import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { TextField, Button, Typography, Paper } from "@mui/material";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/auth/register", form);
      nav("/login");
    } catch (e) {
      setErr(e.response?.data?.error || "Registration failed");
    }
  };

  return (
    <Paper sx={{ maxWidth: 420, mx: "auto", p: 3 }}>
      <Typography variant="h5" gutterBottom>Register</Typography>
      <form onSubmit={submit}>
        <TextField fullWidth margin="normal" label="Email"
          value={form.email} onChange={e=>setForm({...form, email: e.target.value})}/>
        <TextField fullWidth margin="normal" label="Password" type="password"
          value={form.password} onChange={e=>setForm({...form, password: e.target.value})}/>
        {err && <Typography color="error">{err}</Typography>}
        <Button variant="contained" type="submit" fullWidth sx={{ mt: 2 }}>Create account</Button>
      </form>
    </Paper>
  );
}
