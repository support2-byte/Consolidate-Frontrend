import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Autocomplete,
  TextField,
  Alert,
} from "@mui/material";
import { api } from "../../api"; // adjust path

/**
 * Grant or revoke edit access for one or many consignments.
 * Props: open, onClose, consignmentIds (array), onDone()
 */
export default function EditAccessDialog({
  open,
  onClose,
  consignmentIds = [],
  onDone,
}) {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setUser(null);
    setError("");
    api
      .get("/api/consignments/edit-access/users")
      .then((r) => setUsers(r.data?.data || []))
      .catch(() => setError("Failed to load users"));
  }, [open]);

  const save = async (userId) => {
    setBusy(true);
    setError("");
    try {
      await api.put("/api/consignments/edit-access/bulk", {
        ids: consignmentIds,
        userId,
      });
      onDone?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update edit access");
    } finally {
      setBusy(false);
    }
  };

  const n = consignmentIds.length;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit access</DialogTitle>
      <DialogContent sx={{ pt: "12px !important" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {n} consignment{n === 1 ? "" : "s"} selected. Admins and super admins
          can always edit. Choose one user who may also edit
          {n === 1 ? " it" : " them"}. Granting replaces any existing access.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Autocomplete
          options={users}
          value={user}
          onChange={(e, v) => setUser(v)}
          getOptionLabel={(u) =>
            u ? `${u.name || ""}${u.email ? ` (${u.email})` : ""}` : ""
          }
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => (
            <TextField {...params} label="User" size="small" />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" disabled={busy || !n} onClick={() => save(null)}>
          Revoke access
        </Button>
        <Button
          variant="contained"
          disabled={busy || !user || !n}
          onClick={() => save(user.id)}
        >
          Grant access
        </Button>
      </DialogActions>
    </Dialog>
  );
}
