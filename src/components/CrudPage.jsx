import { useEffect, useState } from "react";
import { api } from "../api";
import {
  Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Box, IconButton, Tooltip
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
  const navigate = useNavigate();
  const load = async () => {
    const { data } = await api.get(endpoint);
    setRows(data);
  };

  useEffect(() => { load(); }, [endpoint]);

  // const startAdd = () => {
  //   setEditingId(null);
  //   setForm(formFields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {}));
  //   setOpen(true);
  // };


  const startAdd = () => {
    console.log("CustomerAdd", `/${title.toLowerCase()}/new`);

    // lowercase the title and make it plural route
    const route = `/${title.toLowerCase()}/new`;
    console.log("routeroute", route);

    navigate(route);
  }
  const startEdit = (row) => {
    const route = `/${title.toLowerCase()}/${row[idKey]}/edit`;
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

  const remove = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    await api.delete(`${endpoint}/${id}`);
    await load();
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
          <IconButton color="error" size="small" onClick={() => remove(params.row[idKey])}>
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
          onClick={() => navigate("/customers/add")}   // ✅ fix here
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
            getRowId={(row) => row.id} 
          // getRowId={(row) => row[idKey]} // now this works
          columns={gridColumns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          components={{ Toolbar: GridToolbar }}
          disableSelectionOnClick
          density="comfortable"
        />
      </Box>

      {/* Add/Edit dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Edit Record" : "Add Record"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formFields.map(f => (
              <TextField
                key={f.key}
                label={f.label}
                type={f.type || "text"}
                value={form[f.key] ?? ""}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                select={f.select}
                fullWidth
                SelectProps={f.select ? { native: true } : undefined}
              >
                {f.select && (
                  <>
                    <option value=""></option>
                    {f.options?.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </>
                )}
              </TextField>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
