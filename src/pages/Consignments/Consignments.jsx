import React, { useState, useEffect,useCallback, useMemo } from 'react';
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
  Slide
} from "@mui/material";
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Update as UpdateIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from "@mui/icons-material";
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom"; // Assuming React Router is used
  import { styled } from '@mui/material/styles';
import {api} from "../../api"; // Assuming api
import EditNoteIcon from '@mui/icons-material/EditNote';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyPlugin } from 'jspdf-autotable';
import logoPic from "../../../public/logo.png"
applyPlugin(jsPDF); 
// Assuming other imports are present: api, styled, MUI components (Paper, Table, etc.), icons, etc.

// Styled components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
  '&:last-child td, &:last-child th': { border: 0 },
  '&:hover': { backgroundColor: theme.palette.action.selected },
  fontSize: 10
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5, 2),
  fontSize: 10
}));

const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: '#0d6c6a',
  color: '#fff',
  fontWeight: 400,
  fontSize: 12,
  // padding: theme.spacing(1.5, 2),
  borderBottom: `2px solid ${theme.palette.primary.dark}`,
}));

export default function Consignments() {
  const navigate = useNavigate();

  const [consignments, setConsignments] = useState([]);
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({ consignment_id: '', status: '' });
  const [selected, setSelected] = useState([]);
  const [selectedExport, setSelectedExport] = useState([]);
  const [numSelected, setNumSelected] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedConsignmentForUpdate, setSelectedConsignmentForUpdate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusList, setStatusList] = useState([]);
  const [error, setError] = useState(null);

  // Server-side params
  const params = useMemo(() => ({
    page: page + 1,
    limit: rowsPerPage,
    order_by: orderBy,
    order,
    consignment_id: filters.consignment_id || undefined,
    status: filters.status || undefined,
  }), [page, rowsPerPage, orderBy, order, filters]);

  const getConsignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/consignments', { params });
      const data = response.data;
      console.log('API Response:', data);

      setConsignments(data.data || []);
      setRowCount(data.total || 0);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load consignments');
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to load consignments',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    getConsignments();
  }, [getConsignments]);

  // Fetch statuses (once on mount)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/api/consignments/statuses');
        setStatusList(res.data.statusOptions || []);
      } catch (err) {
        console.error('Error fetching statuses:', err);
      }
    };
    fetchStatus();
  }, []);

  // Render helpers
  const renderDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderStatus = (status) => (
    <Chip 
      label={status || 'N/A'} 
      color={
        status === "Delivered" ? "success" :
        status === "In Transit" ? "warning" :
        status === "Draft" ? "default" : "info"
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
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusUpdate = (consignment) => {
    setSelectedConsignmentForUpdate(consignment);
    setSelectedStatus(consignment.status || '');
    setOpenStatusDialog(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!selectedConsignmentForUpdate || !selectedStatus) return;

    try {
      await api.put(`/api/consignments/${selectedConsignmentForUpdate.id}/status`, {
        status: selectedStatus,
      });
      setSnackbar({ open: true, message: 'Status updated successfully!', severity: 'success' });
      getConsignments();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update status',
        severity: 'error',
      });
    } finally {
      setOpenStatusDialog(false);
    }
  };

  // ... (keep your other handlers: handleExport, handleView, handleEdit, etc.)

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
      {/* Header + Add Button */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="#f58220">
          Consignments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/consignments/add")}
          sx={{ bgcolor: '#0d6c6a', '&:hover': { bgcolor: '#0a5a59' } }}
        >
          New Consignment
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <TextField
          label="Search Consignment #"
          name="consignment_id"
          value={filters.consignment_id}
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
            {statusList.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Table */}
      <TableContainer sx={{ borderRadius: 2, overflow: 'auto',display:"table-cell", maxHeight: 600 }}>
        <Table  >
          <TableHead>
            <TableRow>
              <StyledTableHeadCell padding="checkbox">
                <Checkbox />
              </StyledTableHeadCell>
              {columns.map(col => (
                <StyledTableHeadCell key={col.key}>
                  {col.label}
                </StyledTableHeadCell>
              ))}
              <StyledTableHeadCell>Actions</StyledTableHeadCell>
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
              consignments.map(row => (
                <StyledTableRow key={row.id} sx={{fontSize:10}} hover>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>{row.consignment_number || 'N/A'}</TableCell>
                  <TableCell>{row.shipperName?.substring(0, 20) || row.shipper?.substring(0, 20) || 'N/A'}</TableCell>
                  <TableCell>{row.consigneeName?.substring(0, 20) || row.consignee?.substring(0, 20) || 'N/A'}</TableCell>
                  <TableCell>{renderDate(row.eta)}</TableCell>
                  <TableCell>{renderDate(row.created_at)}</TableCell>
                  <TableCell>{row.gross_weight || 0} kg</TableCell>
                  <TableCell>{row.orders?.length || 0}</TableCell>
                  <TableCell>{renderStatus(row.status)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/consignments/${row.id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => navigate(`/consignments/${row.id}/edit`)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update Status">
                        <IconButton size="small" onClick={() => handleStatusUpdate(row)}>
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
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)}>
        <DialogTitle>Update Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={e => setSelectedStatus(e.target.value)}
            >
              {statusList.map(s => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmStatusUpdate}>
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