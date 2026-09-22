import { useState, useEffect, useContext } from "react";
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Stack,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { api } from "../../api";
import { AppContext } from "../../context/AppContext";

const driverFields = ["driver_id", "name", "phone_number", "vehicle_plate"];
const trackFields = ["routes"];

export default function DriversPage() {
  const {
    drivers,
    driverTracks: tracks,
    driversLoading,
    driverTracksLoading,
    fetchDrivers,
    fetchDriverTracks,
  } = useContext(AppContext);

  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const loading = driversLoading || driverTracksLoading;

  const openDialog = (row = null) => {
    setEditing(row);
    setForm(
      row ||
        (tab === 0
          ? { driver_id: "", name: "", phone_number: "", vehicle_plate: "" }
          : { driver_id: "", routes: "" }),
    );
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    const endpoint =
      tab === 0 ? "api/options/drivers" : "api/options/driver-tracks";
    try {
      let response;
      if (editing) {
        response = await api.put(`${endpoint}/${editing.id}`, form);
      } else {
        response = await api.post(endpoint, form);
      }
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.message || "Failed to save");
      }
      closeDialog();
      tab === 0 ? await fetchDrivers() : await fetchDriverTracks();
    } catch (err) {
      console.error("Error saving:", err);
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this?")) {
      return;
    }
    const endpoint =
      tab === 0 ? "api/options/drivers" : "api/options/driver-tracks";
    try {
      const response = await api.delete(`${endpoint}/${id}`);
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.message || "Failed to delete");
      }
      tab === 0 ? await fetchDrivers() : await fetchDriverTracks();
    } catch (err) {
      console.error("Error deleting:", err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const rows = tab === 0 ? drivers : tracks;

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ color: "#0d6c6a" }}
          >
            Drivers
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Manage drivers and their tracks
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openDialog()}
        >
          Add {tab === 0 ? "Driver" : "Track"}
        </Button>
      </Box>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Drivers" />
        <Tab label="Driver Tracks" />
      </Tabs>

      <Paper sx={{ p: 2, overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ background: "#0d6c6a" }}>
            {tab === 0 ? (
              <TableRow>
                <TableCell sx={{ color: "#fff" }}>Driver ID</TableCell>
                <TableCell sx={{ color: "#fff" }}>Name</TableCell>
                <TableCell sx={{ color: "#fff" }}>Phone</TableCell>
                <TableCell sx={{ color: "#fff" }}>Vehicle Plate</TableCell>
                <TableCell sx={{ color: "#fff" }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell sx={{ color: "#fff" }}>Driver</TableCell>
                <TableCell sx={{ color: "#fff" }}>Total Deliveries</TableCell>
                <TableCell sx={{ color: "#fff" }}>Routes</TableCell>
                <TableCell sx={{ color: "#fff" }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            )}
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tab === 0 ? 5 : 4} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    {tab === 0 ? "No drivers found" : "No driver tracks found"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : tab === 0 ? (
              drivers.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>{d.driver_id}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d.phone_number}</TableCell>
                  <TableCell>{d.vehicle_plate}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openDialog(d)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(d.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              tracks.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>
                    {t.driver_name} ({t.driver_code})
                  </TableCell>
                  <TableCell>{t.total_deliveries}</TableCell>
                  <TableCell>{t.routes}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openDialog(t)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
            p: 1,
          }}
        >
          <Typography variant="body2">
            1 - {rows.length} of {rows.length}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" disabled>
              Previous
            </Button>
            <Button variant="contained" size="small" disabled>
              Next
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? "Edit" : "Add"} {tab === 0 ? "Driver" : "Track"}
        </DialogTitle>
        <DialogContent>
          {tab === 1 && (
            <FormControl fullWidth sx={{ mt: 2 }} required>
              <InputLabel>Driver</InputLabel>
              <Select
                label="Driver"
                value={form.driver_id || ""}
                onChange={(e) =>
                  setForm({ ...form, driver_id: e.target.value })
                }
              >
                {drivers.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name} ({d.driver_id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {(tab === 0 ? driverFields : trackFields).map((f) => (
            <TextField
              key={f}
              fullWidth
              label={f.replace(/_/g, " ")}
              value={form[f] || ""}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              sx={{ mt: 2 }}
              required
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
