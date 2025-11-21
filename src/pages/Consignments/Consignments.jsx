import { useEffect, useState } from "react";
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
import { useNavigate } from "react-router-dom"; // Assuming React Router is used
  import { styled } from '@mui/material/styles';

export default function Consignments() {
  const navigate = useNavigate();
  const [consignments, setConsignments] = useState([]);
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc'); // Default to desc for recent first
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({ consignment_id: '', status: '' });
  const [selected, setSelected] = useState([]);
  const [numSelected, setNumSelected] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedConsignmentForUpdate, setSelectedConsignmentForUpdate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const statuses = ["Draft", "In Transit", "Under Processing", "Delivered"];

  // Dummy data for consignments
  const dummyConsignments = [
    {
      id: 1,
      consignment_id: "CON-001",
      created_at: "2025-10-20T10:00:00Z",
      shippers: "ABC Shipping Ltd",
      consignee: "XYZ Logistics Inc",
      num_orders: 5,
      total_weight_kg: 18450,
      total_pieces: 120,
      delivered: 3,
      pending: 2,
      vessel: "MV Ocean Star",
      voyage: "VOY-2025-001",
      eta: "2025-11-03T00:00:00Z",
      status: "In Transit"
    },
    {
      id: 2,
      consignment_id: "CON-002",
      created_at: "2025-10-22T14:30:00Z",
      shippers: "Test Customer",
      consignee: "ABC LOGISTICS",
      num_orders: 3,
      total_weight_kg: 1200,
      total_pieces: 45,
      delivered: 0,
      pending: 3,
      vessel: "MV Sea Voyager",
      voyage: "VOY-2025-002",
      eta: "2025-11-05T00:00:00Z",
      status: "Under Processing"
    },
    {
      id: 3,
      consignment_id: "CON-003",
      created_at: "2025-10-25T09:15:00Z",
      shippers: "Global Freight Co",
      consignee: "Pacific Traders",
      num_orders: 8,
      total_weight_kg: 25000,
      total_pieces: 200,
      delivered: 8,
      pending: 0,
      vessel: "MV Gulf Breeze",
      voyage: "VOY-2025-003",
      eta: "2025-10-28T00:00:00Z",
      status: "Delivered"
    },
    {
      id: 4,
      consignment_id: "CON-004",
      created_at: "2025-10-26T16:45:00Z",
      shippers: "Karachi Exporters",
      consignee: "Dubai Importers Ltd",
      num_orders: 2,
      total_weight_kg: 8000,
      total_pieces: 50,
      delivered: 1,
      pending: 1,
      vessel: "MV Royal Gulf",
      voyage: "VOY-2025-004",
      eta: "2025-11-01T00:00:00Z",
      status: "Draft"
    }
  ];

  useEffect(() => {
    // Set dummy data for UI demo
    setConsignments(dummyConsignments);
    setRowCount(dummyConsignments.length);
  }, []);

  // Custom renderer for dates
  const renderDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Custom renderer for status
  const renderStatus = (status) => (
    <Chip 
      label={status} 
      color={status === "Delivered" ? "success" : status === "In Transit" ? "warning" : status === "Draft" ? "default" : "info"} 
      size="small" 
      sx={{ fontSize: '0.875rem' }}
    />
  );

  // Define columns for the table (excluding checkbox and actions) - Hiding "Vessel" and "Voyage"
  const columns = [
    { 
      key: "consignment_id", 
      label: "Consignment",
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem' }} noWrap>{item.consignment_id || "N/A"}</Typography>
    },
    
    { 
      key: "shippers", 
      label: "Shippers", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140, fontSize: '0.875rem' }}>{item.shippers || "N/A"}</Typography>
    },
    { 
      key: "consignee", 
      label: "Consignee", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140, fontSize: '0.875rem'   }}>{item.consignee || "N/A"}</Typography>
    },
{ 
      key: "eta", 
      label: "ETA", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem' }} noWrap>{renderDate(item.eta)}</Typography>
    },
    { 
      key: "created_at", 
      label: "Created At", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem' }} noWrap>{renderDate(item.created_at)}</Typography>
    },
    { 
      key: "total_weight_kg", 
      label: "Weight (kg)", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{(item.total_weight_kg || 0).toLocaleString()}</Typography>
    },
    { 
      key: "total_pieces", 
      label: "Pieces", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{item.total_pieces || 0}</Typography>
    },
        { 
      key: "num_orders", 
      label: "Orders", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{item.num_orders || 0}</Typography>
    },
    { 
      key: "delivered", 
      label: "Delivered", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontWeight: 'bold',  color: 'success.main' }}>{item.delivered || 0}</Typography>
    },
    { 
      key: "pending", 
      label: "Pending", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{fontSize: '0.875rem', fontWeight: 'bold', color: 'warning.main' }}>{item.pending || 0}</Typography>
    },
    
    { 
      key: "status", 
      label: "Status",
      sortable: true,
      render: (item) => renderStatus(item.status)
    },
  ];

  function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function getComparator(order, orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  // Handle numeric and date sorting
  function getSortableValue(item, key) {
    const value = item[key];
    if (key === 'created_at' || key === 'eta') {
      return value ? new Date(value).getTime() : 0;
    }
    if (typeof value === 'number') {
      return value;
    }
    return value || '';
  }

  function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) {
        return order;
      }
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const filteredConsignments = consignments.filter(item => {
    const matchesId = !filters.consignment_id || item.consignment_id.toLowerCase().includes(filters.consignment_id.toLowerCase());
    const matchesStatus = !filters.status || item.status === filters.status;
    return matchesId && matchesStatus;
  });

  const sortedConsignments = stableSort(filteredConsignments, getComparator(order, orderBy));

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = sortedConsignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = () => {
    setExporting(true);
    // Dummy export logic
    setTimeout(() => {
      setExporting(false);
      setSnackbar({ open: true, message: 'Exported successfully!', severity: 'success' });
    }, 2000);
  };

  const handleStatusUpdate = (id, consignment) => {
    setSelectedConsignmentForUpdate(consignment);
    setSelectedStatus(consignment.status);
    setOpenStatusDialog(true);
  };

  const handleView = (id) => {
    // Dummy view logic - Navigate to details page
    navigate(`/consignments/${id}/edit`);
  };

  const handleEdit = (id) => {
    // Dummy edit logic
    navigate(`/consignments/${id}/edit`);
  };

  const handleDelete = (id) => {
    // Dummy delete logic with confirmation
    if (window.confirm('Are you sure you want to delete this consignment?')) {
      console.log('Delete consignment', id);
      setSnackbar({ open: true, message: 'Consignment deleted successfully!', severity: 'success' });
    }
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleConfirmStatusUpdate = () => {
    // Dummy update logic
    setOpenStatusDialog(false);
    setSnackbar({ open: true, message: 'Status updated successfully!', severity: 'success' });
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedConsignmentForUpdate(null);
    setSelectedStatus('');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const visibleRows = sortedConsignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const total = filteredConsignments.length;
  const totalWeight = filteredConsignments.reduce((sum, item) => sum + (item.total_weight_kg || 0), 0);
  const totalOrders = filteredConsignments.reduce((sum, item) => sum + (item.num_orders || 0), 0);
     const StyledTableRow = styled(TableRow)(({ theme }) => ({
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
        },
        // hide last border
        '&:last-child td, &:last-child th': {
            border: 0,
        },
        '&:hover': {
            backgroundColor: theme.palette.action.selected,
        },
    }));

    const StyledTableCell = styled(TableCell)(({ theme }) => ({
        borderBottom: `1px solid ${theme.palette.divider}`,
        fontSize: '0.875rem',
        padding: theme.spacing(1.5, 2),
    }));

    const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        fontWeight: 'bold',
        fontSize: '0.875rem',
        padding: theme.spacing(1.5, 2),
        borderBottom: `2px solid ${theme.palette.primary.dark}`,
    }));
  
  return (
    <Paper 
      sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}
    >
      {/* Summary Card - Responsive Stack */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1, transition: 'box-shadow 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 108, 106, 0.15)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Showing <strong>{total}</strong> consignments • Total Orders: <strong>{totalOrders}</strong> • Total Weight: <strong>{totalWeight.toLocaleString()} kg</strong>
            </Typography>
            <Chip 
              icon={<InfoIcon fontSize="small" />} 
              label={`${numSelected} selected`} 
              color={numSelected > 0 ? "primary" : "default"}
              size="small"
              variant="outlined"
              sx={{ 
                borderRadius: 1.5,
                fontWeight: 'medium',
                minWidth: 120,
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.02)' }
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Header - Responsive with Stacked Buttons on Mobile */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 2, sm: 0 }} mb={2}>
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          color="#f58220" 
          sx={{ 
            fontSize: { xs: '1.5rem', md: '1.75rem' },
            mb: { xs: 1, sm: 0 },
            transition: 'transform 0.2s ease',
            '&:hover': { transform: 'scale(1.01)' }
          }}
        >
          Consignments
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title={numSelected === 0 ? "Select items to add to vessel" : ""}>
            <span>
              <Button
                variant="contained"
                disabled={numSelected === 0}
                onClick={() => console.log('Add selected to vessel')}
                startIcon={<AddIcon />}
                size="medium"
                fullWidth={true} // Full width on mobile
                sx={{
                  borderRadius: 2,
                  backgroundColor: "#0d6c6a",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#0a5a59" },
                  fontSize: '0.875rem',
                  fontWeight: 'medium',
                  transition: 'all 0.2s ease',
                  minHeight: 40,
                  width: 200,
                  '&:disabled': { backgroundColor: 'grey.400' }
                }}
              >
              Vessel ({numSelected})
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Export to CSV/PDF">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={loading || exporting || total === 0}
              size="small"
              fullWidth={true} // Full width on mobile
              sx={{
                borderRadius: 2,
                borderColor: "#0d6c6a",
                color: "#0d6c6a",
                "&:hover": { borderColor: "#0d6c6a", backgroundColor: "#0d6c6a", color: "#fff" },
                fontSize: '0.875rem',
                fontWeight: 'medium',
                transition: 'all 0.2s ease',
                minHeight: 40,
                width: 120,
                '&:disabled': { borderColor: 'grey.400', color: 'grey.400' }
              }}
            >
              {exporting ? <CircularProgress size={16} color="inherit" /> : "Export"}
            </Button>
          </Tooltip>
          <Tooltip title="Create new consignment">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/consignments/add")}
              size="small"
              fullWidth={true} // Full width on mobile
              sx={{
                borderRadius: 2,
                backgroundColor: "#0d6c6a",
                color: "#fff",
                "&:hover": { backgroundColor: "#0a5a59" },
                fontSize: '0.875rem',
                fontWeight: 'medium',
                transition: 'all 0.2s ease',
                minHeight: 40,
                width: 100,
              }}
            >
              New
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filters - Compact and Responsive */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
        <TextField
          label="Search Consignment #"
          name="consignment_id"
          value={filters.consignment_id}
          onChange={handleFilterChange}
          size="small"
          sx={{ 
            width: { xs: '100%', sm: 200 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'background.paper',
              transition: 'box-shadow 0.2s ease',
              '&:focus': { boxShadow: '0 0 0 2px rgba(13, 108, 106, 0.25)' }
            }
          }}
          placeholder="e.g., CON-001"
        />
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={filters.status}
            label="Status"
            onChange={handleFilterChange}
            sx={{
              borderRadius: 2,
              backgroundColor: 'background.paper',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#0d6c6a',
                '&:focus': { borderColor: '#0d6c6a' }
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Table - Full Width, No Horizontal Scroll, Responsive Columns */}
      <TableContainer sx={{ 
        borderRadius: 2, 
        overflow: 'hidden', // Hidden instead of auto to prevent scroll
        boxShadow: 2, 
        maxHeight: 600,
        width: '100%',
        '&::-webkit-scrollbar': {
          height: 6,
          width: 6,
        },
        '&::-webkit-scrollbar-track': {
          background: 'background.paper',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#0d6c6a',
          borderRadius: 3,
        }
      }}>
        <Table stickyHeader size="small" aria-label="Consignments table" sx={{ tableLayout: 'fixed' }}> {/* fixed layout for column control */}
          <TableHead>
            <TableRow>
              <StyledTableHeadCell padding="checkbox" sx={{ width: 50, padding: '12px 8px',backgroundColor:'#0d6c6a',color:'#fff' }}> {/* Adjusted padding for checkbox */}
                <Checkbox
                  color="primary"
                  indeterminate={numSelected > 0 && numSelected < rowCount}
                  checked={rowCount > 0 && numSelected === rowCount}
                  onChange={handleSelectAllClick}
                  size="small"
                  aria-label="Select all consignments"
                />
              </StyledTableHeadCell>
              {columns.map((column) => (
                <StyledTableHeadCell 
                  key={column.key} 
                  sx={{ 
                    width: `${100 / (columns.length + 2)}%`, // Distribute width evenly
                    maxWidth: 150, // Cap max width
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: '12px 8px', // Consistent padding
                    backgroundColor: '#0d6c6a',
                    color: '#fff',
                    textAlign:'center'
                  }} 
                  scope="col"
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.key}
                      direction={orderBy === column.key ? order : 'asc'}
                      onClick={(e) => handleRequestSort(e, column.key)}
                      sx={{ 
                        backgroundColor:'#0d6c6a',
                        color: 'inherit !important', 
                        '&:hover': { color: 'inherit !important' }, 
                        '& .MuiTableSortLabel-icon': { color: 'inherit !important' },
                        '&:focus': { outline: '2px solid currentColor' }
                      }}
                      aria-label={`Sort by ${column.label}`}
                    >
                      <Typography variant="body2" sx={{ lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {column.label}
                      </Typography>
                    </TableSortLabel>
                  ) : (
                    <Typography variant="body2" sx={{ lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {column.label}
                    </Typography>
                  )}
                </StyledTableHeadCell>
              ))}
              <StyledTableHeadCell sx={{ width: 50,textAlign:'center',marginRight:20, padding: '12px 8px',backgroundColor:'#0d6c6a',color:'#fff' }} scope="col"> {/* Fixed for actions */}
                <Typography variant="body2" sx={{ lineHeight: 1 }}>Actions</Typography>
              </StyledTableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row) => {
                const isItemSelected = isSelected(row.id);
                return (
                  <StyledTableRow
                    key={row.id}
                    onClick={() => handleClick(row.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    selected={isItemSelected}
                    hover
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick(row.id);
                      }
                    }}
                    sx={{ 
                      py: 1,
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease',
                      '&:focus': { outline: '2px solid #0d6c6a', outlineOffset: -2 }
                    }}
                    aria-label={`Consignment ${row.consignment_id}`}
                  >
                    <StyledTableCell padding="checkbox" sx={{ width: 50, padding: '12px 8px' }}>
                      <Checkbox
                        checked={isItemSelected}
                        onClick={(event) => {
                          handleClick(row.id);
                          event.stopPropagation();
                        }}
                        size="small"
                        inputProps={{
                          'aria-labelledby': `checkbox-${row.id}`,
                        }}
                        aria-label={`Select consignment ${row.consignment_id}`}
                      />
                    </StyledTableCell>
                    {columns.map((column) => (
                      <StyledTableCell key={column.key} sx={{ width: `${100 / (columns.length + 2)}%`, maxWidth: 150 }}>
                        <Tooltip sx={{ width: '100%' }} title={typeof column.render(row) === 'string' ? column.render(row) : ''} arrow placement="top">
                          <Typography  variant="body2" sx={{width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {column.render(row)}
                          </Typography>
                        </Tooltip>
                      </StyledTableCell>
                    ))}
                    <StyledTableCell sx={{ width: 80, padding: '12px 8px' }}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleView(row.id); }}
                            aria-label={`View details for consignment ${row.consignment_id}`}
                            sx={{ 
                              color: '#f58220',
                              '&:hover': { backgroundColor: 'rgba(13, 108, 106, 0.08)', transform: 'scale(1.1)' },
                              transition: 'all 0.2s ease',
                              '&:focus': { outline: '2px solid #0d6c6a' }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleEdit(row.id); }}
                            aria-label={`Edit consignment ${row.consignment_id}`}
                            sx={{ 
                              color: '#f58220',
                              '&:hover': { backgroundColor: 'rgba(13, 108, 106, 0.08)', transform: 'scale(1.1)' },
                              transition: 'all 0.2s ease',
                              '&:focus': { outline: '2px solid #0d6c6a' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </StyledTableCell>
                  </StyledTableRow>
                );
              })
            ) : (
              <StyledTableRow>
                <StyledTableCell colSpan={columns.length + 2} align="center" sx={{ py: 4, border: 0 }}>
                  <Stack spacing={1} alignItems="center">
                    <Typography variant="h6" color="text.secondary" sx={{ fontSize: '1.125rem' }}>
                      No consignments found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your filters or create a new one.
                    </Typography>
                  </Stack>
                </StyledTableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination - Enhanced Styling */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Rows per page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        sx={{
          borderTop: '1px solid rgba(224, 224, 224, 1)',
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            color: '#f58220',
            fontWeight: 'medium',
            fontSize: '0.875rem',
          },
          '& .MuiTablePagination-select, & .MuiTablePagination-input': {
            fontSize: '0.875rem',
            borderRadius: 1,
            '&:focus': { borderColor: '#0d6c6a' }
          },
          '& .MuiTablePagination-actions button': {
            color: '#0d6c6a',
            '& svg': { fontSize: '1.125rem' },
            '&:hover': { backgroundColor: 'rgba(13, 108, 106, 0.08)' },
            '&:focus': { outline: '2px solid #0d6c6a' }
          }
        }}
        aria-label="Consignments table pagination"
      />

      {/* Status Update Dialog - Compact & Polished */}
      <Dialog
        open={openStatusDialog}
        onClose={handleCloseStatusDialog}
        maxWidth="xs"
        fullWidth
        aria-labelledby="status-dialog-title"
        aria-describedby="status-dialog-description"
        sx={{ '& .MuiDialog-paper': { borderRadius: 3, boxShadow: 4 } }}
      >
        <DialogTitle id="status-dialog-title" sx={{ fontSize: '1.25rem', p: 2, bgcolor: '#f8f9fa', borderBottom: 1, borderColor: 'divider' }}>
          Update Status
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Typography id="status-dialog-description" variant="body1" color="text.secondary" mb={2} sx={{ fontSize: '1rem' }}>
            Update status for <strong>{selectedConsignmentForUpdate?.consignment_id}</strong>
          </Typography>
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={selectedStatus}
              label="Status"
              onChange={handleStatusChange}
              aria-label="Select status"
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#0d6c6a' }
              }}
            >
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, bgcolor: '#f8f9fa', borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCloseStatusDialog} size="small" variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmStatusUpdate} variant="contained" size="small" sx={{ backgroundColor: '#0d6c6a', '&:hover': { backgroundColor: '#0a5a59' } }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications - Enhanced */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        aria-live="polite"
        sx={{ '& .MuiSnackbarContent-root': { borderRadius: 2 } }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%', 
            fontSize: '1rem',
            borderRadius: 2,
            animation: 'slideInUp 0.3s ease',
            boxShadow: 2
          }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Paper>
  );
}