import { useEffect, useState } from "react";
import { api } from "../api";
import {
  Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Box, IconButton, Tooltip, Snackbar, Alert, CircularProgress
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

export default function CrudPage({ title, endpoint, columns, formFields, idKey = "id" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false); // 👈 loading state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const load = async () => {
  try {
    setLoading(true);
    // Use endpoint prop (e.g., /api/customers/panel?search=All&limit=5000)
    // If endpoint has no query, you can append defaults here
    const response = await api.get(endpoint);  // Now uses prop!
    console.log("Fetched data:", response.data);
    setRows(response.data);
  } catch (err) {
    console.error("Failed to load data", err);
    showToast("Failed to load data", "error");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    load();
  }, [  ]);

  const startAdd = () => {
    const route = `/${title.toLowerCase()}/add`;
    navigate(route);
  };

  const startEdit = (row) => {
    const route = `/${title.toLowerCase()}/${row.zoho_id}/edit`;
    navigate(route);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`${endpoint}/${deleteId}`);
      await load();
      showToast("Record deleted successfully!", "success");
    } catch (err) {
      showToast("Failed to delete record", "error");
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const gridColumns = [
    ...columns.map(c => ({
      field: c.key,
      headerName: c.label,
      flex: 1,
      renderCell: (params) => (
        <Tooltip title={params.value || ""}>
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
              maxWidth: "100%",
            }}
          >
            {params.value}
          </span>
        </Tooltip>
      ),
    })),
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} mt={2}>
          <Tooltip title="Edit">
            <IconButton color="primary" size="small" onClick={() => startEdit(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="error" size="small" onClick={() => handleDeleteClick(params.row.zoho_id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, position: "relative" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">{title}</Typography>
        <Button
          style={{ backgroundColor: "#f58220", color: "#fff" }}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={startAdd}
          sx={{ borderRadius: 2 }}
        >
          Add {title}
        </Button>
      </Stack>

      {/* Loader overlay */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(255,255,255,0.6)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}

      {/* DataGrid */}
      <Box
        sx={{
          height: 550,
          width: "100%",
          "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f4f6f8", fontWeight: "bold" },
          "& .MuiDataGrid-row:hover": { backgroundColor: "#f1f9ff" },
        }}
      >
        <DataGrid
          rows={rows}
          getRowId={(row) => row.zoho_id}
          columns={gridColumns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          components={{ Toolbar: GridToolbar }}
          disableSelectionOnClick
          density="comfortable"
        />
      </Box>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete this record?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
