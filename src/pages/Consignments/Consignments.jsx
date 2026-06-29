import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from "react";
import {
  Box,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  ListItemIcon,
  TablePagination,
  Paper,
  TableSortLabel,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Slide,
} from "@mui/material";
import { AppContext } from "../../context/AppContext";
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Update as UpdateIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom"; // Assuming React Router is used
import { styled } from "@mui/material/styles";
import { api } from "../../api"; // Assuming api
import EditNoteIcon from "@mui/icons-material/EditNote";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { applyPlugin } from "jspdf-autotable";
import logoPic from "../../../public/logo.png";
import { get } from "lodash";
applyPlugin(jsPDF);
// Assuming other imports are present: api, styled, MUI components (Paper, Table, etc.), icons, etc.

// Styled components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
  "&:last-child td, &:last-child th": { border: 0 },
  "&:hover": { backgroundColor: theme.palette.action.selected },
  fontSize: 10,
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5, 2),
  fontSize: 10,
}));

const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#0d6c6a",
  color: "#fff",
  fontWeight: 400,
  fontSize: 12,
  // padding: theme.spacing(1.5, 2),
  borderBottom: `2px solid ${theme.palette.primary.dark}`,
}));

export default function Consignments() {
  const navigate = useNavigate();
  const { statuses } = useContext(AppContext);
  const [consignments, setConsignments] = useState([]);
  const [orderBy, setOrderBy] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    consignment_id: "",
    status: "",
    container_number: "",
  });
  const [selected, setSelected] = useState([]);
  const [selectedExport, setSelectedExport] = useState([]);
  const [numSelected, setNumSelected] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedConsignmentForUpdate, setSelectedConsignmentForUpdate] =
    useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Server-side params
  const params = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      order_by: orderBy,
      order,
      consignment_id: filters.consignment_id || undefined,
      container_number: filters.container_number || undefined,
      status: filters.status || undefined,
    }),
    [page, rowsPerPage, orderBy, order, filters],
  );

  const getConsignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/api/consignments", { params });
      const data = response.data;

      setConsignments(data.data || []);
      setRowCount(data.total || 0);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load consignments");
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Failed to load consignments",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    getConsignments();
  }, [getConsignments]);

  const consignmentStatuses = useMemo(
    () =>
      (statuses || [])
        .filter((s) => s.status === true && s.consignment_status)
        .sort((a, b) => a.sorting_number - b.sorting_number),
    [statuses],
  );

  const renderDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderStatus = (status) => (
    <Chip
      label={status || "N/A"}
      color={
        status === "Delivered"
          ? "success"
          : status === "In Transit"
            ? "warning"
            : status === "Draft"
              ? "default"
              : "info"
      }
      size="small"
      sx={{ fontSize: 12 }}
    />
  );

  // Columns
  const columns = [
    { key: "consignment_number", label: "Consignment", sortable: true },
    { key: "shipper", label: "Shippers", sortable: true },
    { key: "consignee", label: "Consignee", sortable: true },
    { key: "eta", label: "ETA", sortable: true },
    { key: "created_at", label: "Created At", sortable: true },
    { key: "gross_weight", label: "Weight (kg)", sortable: true },
    { key: "orders", label: "Pieces", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  // Handlers
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusUpdate = (consignment) => {
    setSelectedConsignmentForUpdate(consignment);
    setSelectedStatus(consignment.status || "");
    setOpenStatusDialog(true);
  };

  const handleView = (id) => {
    navigate(`/consignments/${id}/edit`, {
      state: { mode: "edit", consignmentId: id },
    });
  };

  const handleEdit = (id) => {
    navigate(`/consignments/${id}/edit`, {
      state: { mode: "edit", consignmentId: id },
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this consignment?")) {
      setSnackbar({
        open: true,
        message: "Consignment deleted successfully!",
        severity: "success",
      });
    }
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleConfirmStatusUpdate = async (row) => {
    try {
      const selectedStatusObj = consignmentStatuses.find(
        (s) => s.consignment_status === selectedStatus,
      );
      const res = await api.put(`/api/consignments/${row.id}/status`, {
        newStatus: selectedStatus,
        days_offset: selectedStatusObj?.days_offset ?? 0,
        reason: "Status advanced via UI",
      });
      const { message } = res.data || {};
      getConsignments();
      setLoading(false);

      setSnackbar({
        open: true,
        message: message || "Status advanced successfully!",
        severity: "success",
      });
    } catch (err) {
      setLoading(false);

      console.error("Error advancing status:", err);
      setSnackbar({
        open: true,
        message: "Failed to advance status.",
        severity: "error",
      });
    }

    setOpenStatusDialog(false);
    // setSnackbar({ open: true, message: 'Status updated successfully!', severity: 'success' });
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedConsignmentForUpdate(null);
    setSelectedStatus("");
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  // Safe JSON parse helper to avoid errors
  const safeParseOrders = (orders) => {
    if (!orders) return [];
    if (
      Array.isArray(orders) ||
      (typeof orders === "object" && orders !== null)
    ) {
      return orders; // Already parsed (from DB JSONB)
    }
    if (orders === "[]") return [];
    try {
      return JSON.parse(orders);
    } catch (e) {
      console.warn("Invalid orders JSON:", orders, e);
      return [];
    }
  };

  // ... (keep your other handlers: handleExport, handleView, handleEdit, etc.)

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
      {/* Header + Add Button */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight="bold" color="#f58220">
          Consignments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/consignments/add")}
          sx={{ bgcolor: "#0d6c6a", "&:hover": { bgcolor: "#0a5a59" } }}
        >
          New Consignment
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <TextField
          label="Search Consignment #"
          name="consignment_id"
          value={filters.consignment_id}
          onChange={handleFilterChange}
          size="small"
          fullWidth
        />

        <TextField
          label="Search Container #"
          name="container_number"
          value={filters.container_number}
          onChange={handleFilterChange}
          size="small"
          fullWidth
        />

        <FormControl size="small" fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={filters.status}
            label="Status"
            onChange={handleFilterChange}
          >
            <MenuItem value="">All</MenuItem>
            {consignmentStatuses.map((s) => (
              <MenuItem key={s.id} value={s.consignment_status}>
                {s.consignment_status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Table */}
      <TableContainer
        sx={{
          borderRadius: 2,
          overflow: "auto",
          display: "table-cell",
          width: "100%",
          maxHeight: 600,
        }}
      >
        <Table sx={{ width: "100%", tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <StyledTableHeadCell padding="checkbox" sx={{ width: 50 }}>
                <Checkbox />
              </StyledTableHeadCell>
              <StyledTableHeadCell sx={{ width: 140 }}>
                Consignment #
              </StyledTableHeadCell>
              <StyledTableHeadCell sx={{ width: 160 }}>
                Shipper
              </StyledTableHeadCell>
              <StyledTableHeadCell sx={{ width: 160 }}>
                Consignee
              </StyledTableHeadCell>
              <StyledTableHeadCell sx={{ width: 110 }}>ETA</StyledTableHeadCell>
              <StyledTableHeadCell sx={{ width: 110 }}>
                Created
              </StyledTableHeadCell>
              <StyledTableHeadCell sx={{ width: 100 }}>
                Gross Wt
              </StyledTableHeadCell>
              <StyledTableHeadCell sx={{ width: 80 }}>
                Orders
              </StyledTableHeadCell>
              <StyledTableHeadCell sx={{ width: 130 }}>
                Status
              </StyledTableHeadCell>
              <StyledTableHeadCell sx={{ width: 100 }}>
                Actions
              </StyledTableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : consignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center">
                  No consignments found
                </TableCell>
              </TableRow>
            ) : (
              consignments.map((row) => (
                <StyledTableRow key={row.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, wordBreak: "break-word" }}>
                    {row.consignment_number || "N/A"}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, wordBreak: "break-word" }}>
                    {row.shipperName?.substring(0, 20) ||
                      row.shipper?.substring(0, 20) ||
                      "N/A"}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, wordBreak: "break-word" }}>
                    {row.consigneeName?.substring(0, 20) ||
                      row.consignee?.substring(0, 20) ||
                      "N/A"}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {renderDate(row.eta)}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {renderDate(row.created_at)}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {row.gross_weight || 0} kg
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {row.orders?.length || 0}
                  </TableCell>
                  <TableCell>{renderStatus(row.status)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(row.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update Status">
                        <IconButton
                          size="small"
                          onClick={() => handleStatusUpdate(row)}
                        >
                          <EditNoteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={rowCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      {/* Status Update Dialog */}
      <Dialog
        open={openStatusDialog}
        onClose={() => setOpenStatusDialog(false)}
      >
        <DialogTitle>Update Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {consignmentStatuses.map((s) => (
                <MenuItem key={s.id} value={s.consignment_status}>
                  {s.consignment_status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() =>
              handleConfirmStatusUpdate(selectedConsignmentForUpdate)
            }
            sx={{ bgcolor: "#0d6c6a", "&:hover": { bgcolor: "#0a5a59" } }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Paper>
  );
}
