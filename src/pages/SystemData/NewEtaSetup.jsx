import { useContext, useEffect, useCallback, useReducer } from "react";
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
  Button,
  CircularProgress,
} from "@mui/material";
import { Add } from "@mui/icons-material";
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
import { toast } from "react-toastify";
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

const initialState = {
  rows: [],
  editRow: null,
  editForm: { ...EMPTY_FORM },
  addOpen: false,
  addForm: { ...EMPTY_FORM },
  deleteRow: null,
  saving: false,
  deleting: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_ROWS":
      return { ...state, rows: action.payload };
    case "OPEN_EDIT":
      return {
        ...state,
        editRow: action.payload,
        editForm: {
          order_status: action.payload.order_status ?? "",
          container_status: action.payload.container_status ?? "",
          consignment_status: action.payload.consignment_status ?? "",
          days_offset: action.payload.days_offset,
          status: action.payload.status,
        },
      };
    case "CLOSE_EDIT":
      return { ...state, editRow: null, editForm: { ...EMPTY_FORM } };
    case "UPDATE_EDIT_FORM":
      return { ...state, editForm: { ...state.editForm, ...action.payload } };
    case "OPEN_ADD":
      return { ...state, addOpen: true, addForm: { ...EMPTY_FORM } };
    case "CLOSE_ADD":
      return { ...state, addOpen: false, addForm: { ...EMPTY_FORM } };
    case "UPDATE_ADD_FORM":
      return { ...state, addForm: { ...state.addForm, ...action.payload } };
    case "SET_DELETE_ROW":
      return { ...state, deleteRow: action.payload };
    case "SET_SAVING":
      return { ...state, saving: action.payload };
    case "SET_DELETING":
      return { ...state, deleting: action.payload };
    case "UPDATE_ROW":
      return {
        ...state,
        rows: state.rows.map((r) =>
          r.id === action.payload.id ? action.payload : r,
        ),
      };
    case "ADD_ROW":
      return { ...state, rows: [...state.rows, action.payload] };
    case "REMOVE_ROW":
      return {
        ...state,
        rows: state.rows.filter((r) => r.id !== action.payload),
      };
    default:
      return state;
  }
};

export default function StatusesPage() {
  const {
    statuses: contextStatuses,
    fetchStatuses,
    statusLoading,
  } = useContext(AppContext);

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (contextStatuses?.length) {
      dispatch({
        type: "SET_ROWS",
        payload: [...contextStatuses].sort(
          (a, b) => a.sorting_number - b.sorting_number,
        ),
      });
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

      const oldIndex = state.rows.findIndex((r) => r.id === active.id);
      const newIndex = state.rows.findIndex((r) => r.id === over.id);
      const reordered = arrayMove(state.rows, oldIndex, newIndex).map(
        (r, i) => ({
          ...r,
          sorting_number: i + 1,
        }),
      );

      dispatch({ type: "SET_ROWS", payload: reordered });

      try {
        await api.put(`/api/options/bulkUpdateStatus`, {
          statuses: reordered.map((r) => ({
            id: r.id,
            sorting_number: r.sorting_number,
          })),
        });
      } catch (error) {
        dispatch({ type: "SET_ROWS", payload: state.rows });
        toast.error("Failed to reorder statuses. Please try again.");
      }
    },
    [state.rows],
  );

  const handleSave = async () => {
    dispatch({ type: "SET_SAVING", payload: true });
    try {
      const { data } = await api.put(
        `/api/options/updateStatus/${state.editRow.id}`,
        {
          order_status: state.editForm.order_status || null,
          container_status: state.editForm.container_status || null,
          consignment_status: state.editForm.consignment_status || null,
          days_offset: state.editForm.days_offset,
          status: state.editForm.status,
        },
      );
      dispatch({ type: "UPDATE_ROW", payload: data.status });
      dispatch({ type: "CLOSE_EDIT" });
      toast.success("Status updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update status.");
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  };

  const handleAdd = async () => {
    dispatch({ type: "SET_SAVING", payload: true });
    try {
      const nextSortingNumber = state.rows.length
        ? Math.max(...state.rows.map((r) => r.sorting_number)) + 1
        : 1;
      const { data } = await api.post(`/api/options/addStatus`, {
        order_status: state.addForm.order_status || null,
        container_status: state.addForm.container_status || null,
        consignment_status: state.addForm.consignment_status || null,
        days_offset: state.addForm.days_offset,
        status: state.addForm.status,
        sorting_number: nextSortingNumber,
      });
      dispatch({ type: "ADD_ROW", payload: data.status });
      dispatch({ type: "CLOSE_ADD" });
      toast.success("Status added successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add status.");
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  };

  const handleToggle = async (row) => {
    dispatch({ type: "UPDATE_ROW", payload: { ...row, status: !row.status } });
    try {
      const { data } = await api.put(`/api/options/updateStatus/${row.id}`, {
        status: !row.status,
      });
      dispatch({ type: "UPDATE_ROW", payload: data.status });
      toast.success(`Status ${!row.status ? "enabled" : "disabled"}.`);
    } catch (error) {
      // Revert optimistic update
      dispatch({ type: "UPDATE_ROW", payload: row });
      toast.error("Failed to toggle status.");
    }
  };

  const handleDelete = async () => {
    dispatch({ type: "SET_DELETING", payload: true });
    try {
      await api.delete(`/api/options/deleteStatus/${state.deleteRow.id}`);
      dispatch({ type: "REMOVE_ROW", payload: state.deleteRow.id });
      dispatch({ type: "SET_DELETE_ROW", payload: null });
      toast.success("Status deleted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete status.");
    } finally {
      dispatch({ type: "SET_DELETING", payload: false });
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
          onClick={() => dispatch({ type: "OPEN_ADD" })}
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
                  <TableCell
                    align="center"
                    sx={{ width: 60, color: "white", py: 1.5 }}
                  />
                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: 600, py: 1.5 }}
                  >
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
                ) : state.rows.length === 0 ? (
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
                    items={state.rows.map((r) => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {state.rows.map((row) => (
                      <SortableRow
                        key={row.id}
                        row={row}
                        onEdit={(r) =>
                          dispatch({ type: "OPEN_EDIT", payload: r })
                        }
                        onToggle={handleToggle}
                        onDelete={(r) =>
                          dispatch({ type: "SET_DELETE_ROW", payload: r })
                        }
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
        open={!!state.editRow}
        onClose={() => dispatch({ type: "CLOSE_EDIT" })}
        title="Edit Status"
        form={state.editForm}
        onFieldChange={(key, value) =>
          dispatch({ type: "UPDATE_EDIT_FORM", payload: { [key]: value } })
        }
        onSave={handleSave}
        saving={state.saving}
      />

      <StatusDialog
        open={state.addOpen}
        onClose={() => dispatch({ type: "CLOSE_ADD" })}
        title="Add Status"
        form={state.addForm}
        onFieldChange={(key, value) =>
          dispatch({ type: "UPDATE_ADD_FORM", payload: { [key]: value } })
        }
        onSave={handleAdd}
        saving={state.saving}
      />

      <DeleteDialog
        open={!!state.deleteRow}
        onClose={() => dispatch({ type: "SET_DELETE_ROW", payload: null })}
        onConfirm={handleDelete}
        deleting={state.deleting}
        rowName={state.deleteRow?.order_status}
      />
    </Box>
  );
}
