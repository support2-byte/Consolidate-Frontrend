import { useState, useContext, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";
import { Close, Save, Add, Delete } from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AppContext } from "../../context/AppContext";
import { api } from "../../api";
import { SortableRow } from "../../components/statuses/sortableRow";
import { DeleteDialog } from "../../components/statuses/statusDelete";
import { StatusDialog } from "../../components/statuses/statusDialog";

const TEAL = "#1a7a6e";
const ORANGE = "#e07b2a";

const EMPTY_FORM = {
  order_status: "",
  container_status: "",
  consignment_status: "",
  days_offset: 0,
  status: true,
};

export default function StatusesPage() {
  const {
    statuses: contextStatuses,
    fetchStatuses,
    statusLoading,
  } = useContext(AppContext);
  const [rows, setRows] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [deleteRow, setDeleteRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    if (contextStatuses?.length) {
      setRows(
        [...contextStatuses].sort(
          (a, b) => a.sorting_number - b.sorting_number,
        ),
      );
    }
  }, [contextStatuses]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = rows.findIndex((r) => r.id === active.id);
      const newIndex = rows.findIndex((r) => r.id === over.id);
      const reordered = arrayMove(rows, oldIndex, newIndex).map((r, i) => ({
        ...r,
        sorting_number: i + 1,
      }));

      setRows(reordered);

      try {
        await Promise.all(
          reordered.map((r) =>
            api.put(`/api/options/updateStatus/${r.id}`, {
              sorting_number: r.sorting_number,
            }),
          ),
        );
      } catch {
        setRows(rows);
      }
    },
    [rows],
  );

  const openEdit = (row) => {
    setEditRow(row);
    setEditForm({
      order_status: row.order_status ?? "",
      container_status: row.container_status ?? "",
      consignment_status: row.consignment_status ?? "",
      days_offset: row.days_offset,
      status: row.status,
    });
  };

  const handleEditField = (key, value) =>
    setEditForm((f) => ({ ...f, [key]: value }));
  const handleAddField = (key, value) =>
    setAddForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(
        `/api/options/updateStatus/${editRow.id}`,
        {
          order_status: editForm.order_status || null,
          container_status: editForm.container_status || null,
          consignment_status: editForm.consignment_status || null,
          days_offset: editForm.days_offset,
          status: editForm.status,
        },
      );
      setRows((prev) =>
        prev.map((r) => (r.id === editRow.id ? data.status : r)),
      );
      setEditRow(null);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      const nextSortingNumber = rows.length
        ? Math.max(...rows.map((r) => r.sorting_number)) + 1
        : 1;
      const { data } = await api.post(`/api/options/addStatus`, {
        order_status: addForm.order_status || null,
        container_status: addForm.container_status || null,
        consignment_status: addForm.consignment_status || null,
        days_offset: addForm.days_offset,
        status: addForm.status,
        sorting_number: nextSortingNumber,
      });
      setRows((prev) => [...prev, data.status]);
      setAddOpen(false);
      setAddForm(EMPTY_FORM);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (row) => {
    const prev = rows;
    setRows((r) =>
      r.map((x) => (x.id === row.id ? { ...x, status: !x.status } : x)),
    );
    try {
      const { data } = await api.put(`/api/options/updateStatus/${row.id}`, {
        status: !row.status,
      });
      setRows((r) => r.map((x) => (x.id === row.id ? data.status : x)));
    } catch {
      setRows(prev);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/options/deleteStatus/${deleteRow.id}`);
      setRows((prev) => prev.filter((r) => r.id !== deleteRow.id));
      setDeleteRow(null);
    } catch {
    } finally {
      setDeleting(false);
    }
  };

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
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: ORANGE, letterSpacing: -0.5 }}
        >
          Shipment Statuses
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={() => setAddOpen(true)}
          sx={{
            bgcolor: TEAL,
            "&:hover": { bgcolor: "#155f55" },
            fontWeight: 600,
          }}
        >
          Add Status
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e8e8e8",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: TEAL }}>
                  <TableCell sx={{ width: 40, color: "white", py: 1.5 }} />
                  <TableCell sx={{ color: "white", fontWeight: 600, py: 1.5 }}>
                    Sorting Number
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    Order Status
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    Container Status
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    Consignment Status
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    Days Offset
                  </TableCell>
                  <TableCell
                    sx={{ color: "white", fontWeight: 600 }}
                    align="right"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {statusLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} sx={{ color: TEAL }} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                      sx={{ py: 6, color: "#aaa" }}
                    >
                      No statuses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  <SortableContext
                    items={rows.map((r) => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {rows.map((row) => (
                      <SortableRow
                        key={row.id}
                        row={row}
                        onEdit={openEdit}
                        onToggle={handleToggle}
                        onDelete={setDeleteRow}
                      />
                    ))}
                  </SortableContext>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DndContext>
      </Paper>

      <StatusDialog
        open={!!editRow}
        onClose={() => setEditRow(null)}
        title="Edit Status"
        form={editForm}
        onFieldChange={handleEditField}
        onSave={handleSave}
        saving={saving}
      />

      <StatusDialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddForm(EMPTY_FORM);
        }}
        title="Add Status"
        form={addForm}
        onFieldChange={handleAddField}
        onSave={handleAdd}
        saving={saving}
      />

      <DeleteDialog
        open={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDelete}
        deleting={deleting}
        rowName={deleteRow?.order_status}
      />
    </Box>
  );
}
