import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  TablePagination,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SyncIcon from "@mui/icons-material/Sync";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const TEAL = "#1a7a6e";
const ORANGE = "#e07b2a";

export default function CrudPage({
  title,
  endpoint,
  columns,
  rows: externalRows,
  loading: externalLoading,
  onDelete,
  onReloadZoho,
  typeField = "type",
}) {
  const isControlled = externalRows !== undefined;
  const [internalRows, setInternalRows] = useState([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [zohoSyncing, setZohoSyncing] = useState(false);

  const rows = isControlled ? externalRows : internalRows;
  const loading = isControlled ? !!externalLoading : internalLoading;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

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
    if (isControlled) return;
    try {
      setInternalLoading(true);
      const response = await api.get(endpoint);
      setInternalRows(response.data);
    } catch (err) {
      console.error("Failed to load data", err);
      showToast("Failed to load data", "error");
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (!isControlled) load();
  }, []);

  const startAdd = () => navigate(`/${title.toLowerCase()}/add`);
  const startEdit = (row) =>
    navigate(`/${title.toLowerCase()}/${row.zoho_id}/edit`);

  const loadZoho = async () => {
    setZohoSyncing(true);
    try {
      if (onReloadZoho) {
        await onReloadZoho();
      } else {
        await axios.get(
          "https://consolidate.onrender.com/api/customerPanals?search=All&limit=5000&",
        );
      }
      showToast("Zoho customers synced successfully!", "success");
    } catch (err) {
      console.error("Failed to sync Zoho data:", err);
      showToast(
        `Failed to sync: ${err.response?.data?.error || err.message}`,
        "error",
      );
    } finally {
      setZohoSyncing(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (onDelete) {
        await onDelete(deleteId);
      } else {
        await api.delete(`${endpoint}/${deleteId}`);
        await load();
      }
      showToast("Record deleted successfully!", "success");
    } catch (err) {
      showToast("Failed to delete record", "error");
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleTypeFilterChange = (_e, newValue) => {
    // ToggleButtonGroup fires null when clicking the already-selected button;
    // keep the current selection in that case instead of clearing it.
    if (newValue !== null) {
      setTypeFilter(newValue);
      setPage(0);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const filteredRows = useMemo(() => {
    let result = rows;

    if (typeFilter !== "all") {
      result = result.filter(
        (row) => String(row[typeField] ?? "").toLowerCase() === typeFilter,
      );
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter((row) =>
        columns.some((c) =>
          String(row[c.key] ?? "")
            .toLowerCase()
            .includes(term),
        ),
      );
    }

    return result;
  }, [rows, typeFilter, searchTerm, columns, typeField]);

  const paginatedRows = filteredRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: ORANGE, letterSpacing: -0.5 }}
        >
          {title}
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="small"
            startIcon={
              zohoSyncing ? (
                <CircularProgress size={16} sx={{ color: TEAL }} />
              ) : (
                <SyncIcon />
              )
            }
            onClick={loadZoho}
            disabled={zohoSyncing}
            sx={{
              borderColor: TEAL,
              color: TEAL,
              fontWeight: 600,
              "&:hover": { borderColor: TEAL, bgcolor: "#e6f4f1" },
            }}
          >
            Sync Zoho
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={startAdd}
            sx={{
              bgcolor: TEAL,
              fontWeight: 600,
              "&:hover": { bgcolor: "#155f55" },
            }}
          >
            Add {title}
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <TextField
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ minWidth: 260, bgcolor: "white" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "#999" }} />
              </InputAdornment>
            ),
          }}
        />

        <ToggleButtonGroup
          value={typeFilter}
          exclusive
          onChange={handleTypeFilterChange}
          size="small"
        >
          <ToggleButton
            value="all"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              "&.Mui-selected": {
                bgcolor: TEAL,
                color: "white",
                "&:hover": { bgcolor: "#155f55" },
              },
              px: 2,
            }}
          >
            All
          </ToggleButton>
          <ToggleButton
            value="sender"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              "&.Mui-selected": {
                bgcolor: TEAL,
                color: "white",
                "&:hover": { bgcolor: "#155f55" },
              },
              px: 2,
            }}
          >
            Sender
          </ToggleButton>
          <ToggleButton
            value="receiver"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              "&.Mui-selected": {
                bgcolor: TEAL,
                color: "white",
                "&:hover": { bgcolor: "#155f55" },
              },
              px: 2,
            }}
          >
            Receiver
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e8e8e8",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: TEAL }}>
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    sx={{ color: "white", fontWeight: 600 }}
                  >
                    {c.label}
                  </TableCell>
                ))}
                <TableCell
                  sx={{ color: "white", fontWeight: 600 }}
                  align="right"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    <CircularProgress size={28} sx={{ color: TEAL }} />
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    align="center"
                    sx={{ py: 6, color: "#aaa" }}
                  >
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => (
                  <TableRow
                    key={row.zoho_id}
                    sx={{
                      "&:hover": { bgcolor: "#e6f4f1" },
                      "&:nth-of-type(even)": { bgcolor: "#fafafa" },
                    }}
                  >
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        <Tooltip title={row[c.key] ?? ""}>
                          <span
                            style={{
                              display: "block",
                              maxWidth: 220,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row[c.key] ?? ""}
                          </span>
                        </Tooltip>
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => startEdit(row)}
                            sx={{
                              color: TEAL,
                              "&:hover": { bgcolor: "#e6f4f1" },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(row.zoho_id)}
                            sx={{
                              color: "#c62828",
                              "&:hover": { bgcolor: "#fdecea" },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this record? This action cannot be
          undone.
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: "#666" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            sx={{ bgcolor: "#c62828", "&:hover": { bgcolor: "#a31f1f" } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
