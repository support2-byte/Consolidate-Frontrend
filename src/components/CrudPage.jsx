import { useEffect, useState } from "react";
import { api } from "../api";
import {
  Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Box
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

/**
 * props:
 *  - title: string
 *  - endpoint: "/api/customers"
 *  - columns: [{ key: "name", label: "Name" }, ...]
 *  - formFields: [{ key, label, type?, select?, options? }]
 *  - idKey?: defaults "id"
 */
export default function CrudPage({ title, endpoint, columns, formFields, idKey="id" }) {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    const { data } = await api.get(endpoint);
    setRows(data);
  };

  useEffect(() => { load(); }, [endpoint]);

  const startAdd = () => {
    setEditingId(null);
    setForm(formFields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {}));
    setOpen(true);
  };

  const startEdit = (row) => {
    setEditingId(row[idKey]);
    const obj = {};
    formFields.forEach(f => obj[f.key] = row[f.key] ?? "");
    setForm(obj);
    setOpen(true);
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

  // 🔹 Build DataGrid columns (add actions column)
  const gridColumns = [
    ...columns.map(c => ({
      field: c.key,
      headerName: c.label,
      flex: 1,
    })),
{
  field: "actions",
  headerName: "Actions",
  sortable: false,
  filterable: false,
  flex: 1,
  renderCell: (params) => (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{ width: "100%" }}
      mt={1}
    >
      <Button
        variant="text"
        size="small"
        onClick={() => startEdit(params.row)}
      >
        Edit
      </Button>
      <Button
        variant="text"
        size="small"
        color="error"
        onClick={() => remove(params.row[idKey])}
      >
        Delete
      </Button>
    </Stack>
  ),
}

  ];

  return (
    <Paper sx={{ p:3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{title}</Typography>
        <Button variant="contained" onClick={startAdd}>Add</Button>
      </Stack>

      {/* 🔹 DataGrid with sorting, filtering, search */}
      <Box sx={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={rows}
          getRowId={(row) => row[idKey]}
          columns={gridColumns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          components={{ Toolbar: GridToolbar }}
          disableSelectionOnClick
        />
      </Box>

      {/* 🔹 Add/Edit dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Edit" : "Add"}</DialogTitle>
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
