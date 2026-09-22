import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Divider,
} from "@mui/material";
import { api } from "../../api";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import { toast } from "react-toastify";

const Vessels = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    status: "Active",
  });
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVessels();
  }, []);

  const fetchVessels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("api/options/vessels/crud");
      const data = response.data.vessels || [];
      setVessels(data);
    } catch (err) {
      console.error("Error fetching vessels:", err);
      setError(err.message);
      toast.error("Failed to load vessels. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.warning("Vessel name is required.");
      return false;
    }
    if (!formData.capacity.trim()) {
      toast.warning("Capacity is required.");
      return false;
    }
    return true;
  };

  const handleOpenDialog = (vessel = null) => {
    setEditMode(!!vessel);
    setSelectedVessel(vessel);
    if (vessel) {
      setFormData({
        name: vessel.name || "",
        capacity: vessel.capacity || "",
        status: vessel.status || "Active",
      });
    } else {
      setFormData({ name: "", capacity: "", status: "Active" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVessel(null);
    setFormData({ name: "", capacity: "", status: "Active" });
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setDialogLoading(true);
      let response;
      if (editMode) {
        response = await api.put(
          `api/options/vessels/${selectedVessel.id}`,
          formData,
        );
      } else {
        response = await api.post("api/options/vessels", formData);
      }
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.error || "Failed to save vessel");
      }
      await fetchVessels();
      handleCloseDialog();
      toast.success(
        editMode
          ? "Vessel updated successfully!"
          : "Vessel added successfully!",
      );
    } catch (err) {
      console.error("Error saving vessel:", err);
      toast.error(err.message || "Failed to save vessel.");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this vessel? This action cannot be undone.",
      )
    ) {
      return;
    }
    try {
      const response = await api.delete(`api/options/vessels/${id}`);
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.error || "Failed to delete vessel");
      }
      await fetchVessels();
      toast.success("Vessel deleted successfully!");
    } catch (err) {
      console.error("Error deleting vessel:", err);
      toast.error(err.message || "Failed to delete vessel.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "Maintenance":
        return "warning";
      default:
        return "default";
    }
  };

  const renderEmptyState = () => (
    <Box sx={{ textAlign: "center", py: 4 }}>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        No vessels found
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Click "Add New" to get started.
      </Typography>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog()}
        sx={{ mt: 2 }}
      >
        Add Your First Vessel
      </Button>
    </Box>
  );

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
            Manage Vessels
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Add, edit, or remove vessels for shipping operations.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
          sx={{
            backgroundColor: "#0d6c6a",
            "&:hover": { backgroundColor: "#0a5654" },
          }}
        >
          Add New Vessel
        </Button>
      </Box>

      <Paper sx={{ p: 2, overflowX: "auto", position: "relative" }}>
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <CircularProgress />
          </Box>
        )}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}.{" "}
            <Button size="small" onClick={fetchVessels}>
              Retry
            </Button>
          </Alert>
        )}
        <Table>
          <TableHead sx={{ backgroundColor: "#0d6c6a" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                ID
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                Name
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                Capacity (TEU)
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                Status
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vessels.length === 0 && !loading
              ? renderEmptyState()
              : vessels.map((vessel) => (
                  <TableRow
                    key={vessel.id}
                    hover
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{vessel.id}</TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {vessel.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{vessel.capacity || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={vessel.status || "Unknown"}
                        size="small"
                        color={getStatusColor(vessel.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Vessel">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(vessel)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Vessel">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(vessel.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog for Add/Edit */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: "#0d6c6a", color: "#fff" }}>
          {editMode ? "Edit Vessel" : "Add New Vessel"}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {editMode
              ? "Update the vessel details below."
              : "Enter vessel details. Required fields are marked with *."}
          </Typography>
          <TextField
            fullWidth
            label="Vessel Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 1 }}
            required
            error={!formData.name.trim()}
            helperText={!formData.name.trim() ? "Required field" : ""}
          />
          <TextField
            fullWidth
            label="Capacity (TEU) *"
            type="number"
            value={formData.capacity}
            onChange={(e) =>
              setFormData({ ...formData, capacity: e.target.value })
            }
            sx={{ mt: 2 }}
            required
            error={!formData.capacity.trim()}
            helperText={
              !formData.capacity.trim()
                ? "Required field (Twenty-foot Equivalent Unit)"
                : ""
            }
          />
          <FormControl fullWidth sx={{ mt: 2 }} required>
            <InputLabel>Status *</InputLabel>
            <Select
              value={formData.status}
              label="Status *"
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>
          <Divider sx={{ my: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={dialogLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              dialogLoading ||
              !formData.name.trim() ||
              !formData.capacity.trim()
            }
            sx={{
              backgroundColor: "#0d6c6a",
              "&:hover": { backgroundColor: "#0a5654" },
            }}
          >
            {dialogLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vessels;
