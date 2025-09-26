import { useEffect, useState } from "react";
import { api } from "../api";
import {
  Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Box, IconButton, Tooltip, Snackbar, Alert
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
/**
 * Reusable CRUD Page with improved UI
 */
export default function CrudPage({ title, endpoint, columns, formFields, idKey = "id" }) {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const navigate = useNavigate();
  const load = async () => {
    const { data } = await api.get(endpoint);
    console.log("Data loaded from", endpoint, data);
    setRows(data);
  };

  useEffect(() => { load(); }, [endpoint]);

  // const startAdd = () => {
  //   setEditingId(null);
  //   setForm(formFields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {}));
  //   setOpen(true);
  // };


  const startAdd = () => {
    console.log("CustomerAdd", `/${title.toLowerCase()}/addadd`);

    // lowercase the title and make it plural route
    const route = `/${title.toLowerCase()}/add`;
    console.log("routeroute", route);

    navigate(route);
  }
  const startEdit = (row) => {
    console.log("CustomerEdit", row);
    const route = `/${title.toLowerCase()}/${row.zoho_id}/edit`;
    console.log("Navigate to edit:", route);
    navigate(route);
  };
  const save = async () => {
    if (editingId) {
      await api.put(`${endpoint}/${editingId}`, form);
    } else {
      await api.post(endpoint, form);
    }
    setOpen(false);
    await load();
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

  // 🔹 Build DataGrid columns with improved actions
const gridColumns = [
  ...columns.map(c => {
    if (c.key === "status") {
      return {
        field: c.key,
        headerName: c.label,
        flex: 1,
        renderCell: (params) => (
          <span
            style={{
              color: params.value ? "green" : "red",
              fontWeight: "bold",
            }}
          >
            {params.value ? "Active" : "Inactive"}
          </span>
        )
      };
    }

    return {
      field: c.key,
      headerName: c.label,
      flex: 1,
      renderCell: (params) => (
        <Tooltip title={params.value || ""}>
          <span style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "block",
            maxWidth: "100%"
          }}>
            {params.value}
          </span>
        </Tooltip>
      )
    };
  }),

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
  // const idKey = "zoho_id";

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" >{title}</Typography>
        <Button
          style={{ backgroundColor: "#f58220", color: "#fff" }}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => startAdd()}   // ✅ fix here
          sx={{ borderRadius: 2 }}
        >
          Add {title}
        </Button>
      </Stack>

      {/* DataGrid */}
      <Box sx={{
        height: 550, width: "100%",
        "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f4f6f8", fontWeight: "bold" },
        // "& .MuiDataGrid-row:nth-of-type(odd)": { backgroundColor: "#000" },
        "& .MuiDataGrid-row:hover": { backgroundColor: "#f1f9ff" }
      }}>

        <DataGrid
          rows={rows}
            getRowId={(row) => row.zoho_id} 
          // getRowId={(row) => row[idKey]} // now this works
          columns={gridColumns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          components={{ Toolbar: GridToolbar }}
          disableSelectionOnClick
          density="comfortable"
        />
      </Box>

<Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this record?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for toast notifications */}
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
