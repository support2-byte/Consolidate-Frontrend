import React, { useState, useEffect, useMemo } from 'react';
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
import { useNavigate } from "react-router-dom"; // Assuming React Router is used
  import { styled } from '@mui/material/styles';
import {api} from "../../api"; // Assuming api
import EditNoteIcon from '@mui/icons-material/EditNote';

// Assuming other imports are present: api, styled, MUI components (Paper, Table, etc.), icons, etc.
export default function Consignments() {
  const navigate = useNavigate();
  const [consignments, setConsignments] = useState([]);
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
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
  const [statusList, setStatusList] = useState([]);

  const statuses = ["Draft", "In Transit", "Under Processing", "Delivered"];
  const [error, setError] = useState(null); 

  // Compute params for API
  const params = useMemo(() => ({
    page: page + 1, // API likely 1-indexed
    limit: rowsPerPage,
    order_by: orderBy,
    order: order,
    consignment_id: filters.consignment_id,
    status: filters.status,
  }), [page, rowsPerPage, orderBy, order, filters]);
const getConsignments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/consignments`, { params });
        console.log('Fetched consignments:', response.data);
        setConsignments(response.data.data || []);
        setRowCount(response.data.total || 0); // Fixed: setRowCount
      } catch (err) {
        console.error("Error fetching consignments:", err);
        setError("Failed to fetch consignments");
        setSnackbar({
          open: true,
          message: err.response?.data?.error || err.message || 'Failed to fetch consignments',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    
    getConsignments();
  }, []); // Depend on params for re-fetch on changes

  // Custom renderers (unchanged)
  const renderDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderStatus = (status) => (
    <Chip 
      label={status} 
      color={status === "Delivered" ? "success" : status === "In Transit" ? "warning" : status === "Draft" ? "default" : "info"} 
      size="large"
      sx={{ fontSize: '0.875rem' }}
    />
  );

  useEffect(() => {
    
    if (consignments.some(c => c && (!c.shipperName || !c.consigneeName))) {
      console.log('Fetching shippers and consignees for consignments');
      const fetchAndUpdate = async () => {
        try {
          const [shippersRes, consigneesRes,statusRes] = await Promise.all([
            api.get(`api/options/shippers`),
              //  api.get('api/consignments/statuses'),
            api.get(`api/options/consignees`), // Assuming a similar endpoint for consignees
          ]);
// setStatusList(statusRes.data)
          const shippers = shippersRes.data; // Assume { shipperOptions: array of {value, label} objects }
          const consignees = consigneesRes.data; // Assume { consigneeOptions: array of {value, label} objects }
          console.log('Fetched shippers:', shippers.shipperOptions);
          console.log('Fetched consignees:', consignees.consigneeOptions);
  // const status = statusRes.data;
          setConsignments(prev => prev.map(consignment => {
            if (!consignment) return consignment;
            console.log('Updating consignment:', consignment);
 // Filter shipper by ID (convert to number for strict equality)
          
            // Filter shipper by ID (convert to number for strict equality)
            const shipperName = shippers.shipperOptions.find(s => {
              const shipperId = Number(consignment.shipper);
              console.log('Comparing shipper IDs:', s.value, shipperId);
              return s.value === shipperId;
            })?.label;

            // Filter consignee by ID (convert to number for strict equality)
            const consigneeName = consignees.consigneeOptions.find(c => {
              const consigneeId = Number(consignment.consignee);
              console.log('Comparing consignee IDs:', c.value, consigneeId);
              return c.value === consigneeId;
            })?.label;

            console.log('Updated shipper name:', shipperName);
            console.log('Updated consignee name:', consigneeName);

            return {
              ...consignment,
              shipperName,
              consigneeName,
              // statusOptions
            };
          }));
        } catch (error) {
          console.error('Error fetching shippers/consignees:', error);
        }
      };

      fetchAndUpdate();
    }

    const fetchStatus = async () => {
    try {
        const response = await api.get('api/consignments/statuses')           
           const data = response.data 
      console.log('Fetched container:', data.statusOptions);
setStatusList(data.statusOptions)
          // const shippers = shippersRes.data; // Assume { shipperOptions: array of {value, label} objects }
          // const consignees = consigneesRes.data; // Assume { consigneeOptions: array of {value, label} objects }
          // console.log('Fetched shippers:', shippers.shipperOptions);
          // console.log('Fetched consignees:', consignees.consigneeOptions);
          
        } catch (error) {
          console.error('Error fetching shippers/consignees:', error);
        }
      };
    fetchStatus()
  }, []);


  // Columns (removed duplicate "Orders")
  const columns = [
    { 
      key: "consignment_number", 
      label: "Consignment",
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ fontSize: '0.875rem' }}>{item.consignment_number || "N/A"}</Typography>
    },
    { 
      key: "shipper", 
      label: "Shippers", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140, fontSize: '0.875rem' }}>{item.shipper || "N/A"}</Typography>
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
      key: "gross_weight", 
      label: "Weight (kg)", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{(item.gross_weight || 0).toLocaleString('en-GB')}</Typography> // Added locale
    },
{ 
  key: "orders", 
  label: "Pieces", 
  sortable: true,
  render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{safeParseOrders(item.orders).length}</Typography>
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
    },{ 
    key: "status", 
    label: "Status",
    sortable: true,
    render: (item) => renderStatus(item.status) // No Typography wrapper here
  },

  ];

  // Sorting functions (unchanged)
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

function getSortableValue(item, key) {
  const value = item[key];
  if (key === 'created_at' || key === 'eta') {
    return value ? new Date(value).getTime() : 0;
  }
  if (key === 'orders') { // New: For Pieces column
    return safeParseOrders(value).length;
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

  // Memoized filtered and sorted
  const filteredConsignments = useMemo(() => 
    consignments.filter(item => {
      const matchesId = !filters.consignment_id || item.consignment_number?.toLowerCase().includes(filters.consignment_id.toLowerCase());
      const matchesStatus = !filters.status || item.status === filters.status;
      return matchesId && matchesStatus;
    }), [consignments, filters]
  );

  const sortedConsignments = useMemo(() => 
    stableSort(filteredConsignments, getComparator(order, orderBy)), 
    [filteredConsignments, order, orderBy]
  );

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = sortedConsignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((n) => n.id);
      setSelected(newSelected);
      setNumSelected(newSelected.length); // Added
      return;
    }
    setSelected([]);
    setNumSelected(0); // Added
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
    setNumSelected(newSelected.length); // Added
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
    setTimeout(() => {
      setExporting(false);
      setSnackbar({ open: true, message: 'Exported successfully!', severity: 'success' });
    }, 2000);
  };

  const handleStatusUpdate = ( consignment) => {
    setSelectedConsignmentForUpdate(consignment);
    setSelectedStatus(consignment.status);
    setOpenStatusDialog(true);
  };

  const handleView = (id) => {
        navigate(`/consignments/${id}/edit`,{ state: { mode: 'edit', consignmentId: id  } });

  };

  const handleEdit = (id) => {
    
    navigate(`/consignments/${id}/edit`, { state: { mode: 'edit', consignmentId: id } });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this consignment?')) {
      console.log('Delete consignment', id);
      setSnackbar({ open: true, message: 'Consignment deleted successfully!', severity: 'success' });
    }
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleConfirmStatusUpdate = async(row) => {
    console.log('consignments',row)
        try {
          const res = await api.put(`/api/consignments/${row.id}/next`);
          const { message } = res.data || {};
          getConsignments()
          console.log('Status advanced:', res)
          setSnackbar({
            open: true,
            message: message || 'Status advanced successfully!',
            severity: 'success',
          });
        } catch (err) {
          console.error('Error advancing status:', err);
          setSnackbar({
            open: true,
            message: 'Failed to advance status.',
            severity: 'error',
          });
        
      };
    setOpenStatusDialog(false);
    // setSnackbar({ open: true, message: 'Status updated successfully!', severity: 'success' });
      
}

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedConsignmentForUpdate(null);
    setSelectedStatus('');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  // Safe JSON parse helper to avoid errors
  const safeParseOrders = (orders) => {
  if (!orders) return [];
  if (Array.isArray(orders) || (typeof orders === 'object' && orders !== null)) {
    return orders; // Already parsed (from DB JSONB)
  }
  if (orders === '[]') return [];
  try {
    return JSON.parse(orders);
  } catch (e) {
    console.warn('Invalid orders JSON:', orders, e);
    return [];
  }
};

  const visibleRows = sortedConsignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const total = rowCount || filteredConsignments.length; // Use rowCount for server-side

  // For accurate totals in server-side pagination, fetch from API (see backend update suggestion below)
  // Client-side fallback for small datasets
  const totalWeight = useMemo(() => 
    filteredConsignments.reduce((sum, item) => sum + (item.gross_weight || 0), 0), 
    [filteredConsignments]
  );
const totalOrders = useMemo(() => 
  filteredConsignments.reduce((sum, item) => sum + safeParseOrders(item.orders).length, 0), 
  [filteredConsignments]
);
  // Styled components (unchanged)
  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
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
      {/* Summary Card (unchanged) */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1, transition: 'box-shadow 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 108, 106, 0.15)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Showing <strong>{total}</strong> consignments • Total Orders: <strong>{totalOrders}</strong> • Total Weight: <strong>{totalWeight.toLocaleString('en-GB')} kg</strong>
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

      {/* Header (unchanged) */}
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

</Tooltip>
          <Tooltip title="Export to CSV/PDF">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={loading || exporting || total === 0}
              size="small"
              fullWidth={true}
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
              fullWidth={true}
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

      {/* Filters (unchanged) */}
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
  labelId="status-select-label"
  aria-label="Select status"
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
  {statusList?.map((status) => (
    <MenuItem key={status.value} value={status.value}>
      <ListItemIcon>
        <Avatar sx={{ width: 16, height: 16, bgcolor: status.color, fontSize: '0.75rem' }}>
          {status.usage_count > 0 ? status.usage_count : ''}
        </Avatar>
      </ListItemIcon>
      {status.label}
    </MenuItem>
  ))}
</Select>
        </FormControl>
      </Stack>

      {/* Table - FIXED: No whitespace between <TableHead> and <TableBody> */}
      <TableContainer sx={{ 
        borderRadius: 2, 
        overflow: 'hidden',
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
        <Table stickyHeader size="small" aria-label="Consignments table" sx={{ tableLayout: 'fixed' }}>
          <TableHead>{/* Inline to avoid text nodes */}
            <TableRow>
              <StyledTableHeadCell padding="checkbox" sx={{ width: 50, padding: '12px 8px',backgroundColor:'#0d6c6a',color:'#fff' }}>
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
                    width: `${100 / (columns.length + 2)}%`,
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: '12px 8px',
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
              <StyledTableHeadCell sx={{ width: 50,textAlign:'center',marginRight:20, padding: '12px 8px',backgroundColor:'#0d6c6a',color:'#fff' }} scope="col">
                <Typography variant="body2" sx={{ lineHeight: 1 }}>Actions</Typography>
              </StyledTableHeadCell>
            </TableRow>
          </TableHead><TableBody>{/* No newline/whitespace here - key fix */} {/* Inline closing/opening to prevent text node */}
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>Loading consignments...</Typography>
                </TableCell>
              </TableRow>
            ) : visibleRows.length > 0 ? (
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
                    aria-label={`Consignment ${row.consignment_number}`}
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
                        aria-label={`Select consignment ${row.consignment_number}`}
                      />
                    </StyledTableCell>
                    {columns.map((column) => {
  const cellContent = column.render(row);
  const isChip = column.key === 'status'; // Or check if React.isValidElement(cellContent) && cellContent.type === Chip
  return (
    <StyledTableCell key={column.key} sx={{ width: `${100 / (columns.length + 2)}%`, maxWidth: 250 }}>
      <Tooltip 
        sx={{ width: '100%' }} 
        title={typeof cellContent === 'string' ? cellContent : ''} 
        arrow 
        placement="top"
        disableHoverListener={isChip} // Disable for Chip (self-tooltips unnecessary)
      >
        <span> {/* Forwarding wrapper for Tooltip */}
          {isChip ? cellContent : (
            <Typography variant="body2" sx={{width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cellContent}
            </Typography>
          )}
        </span>
      </Tooltip>
    </StyledTableCell>
  );
})}
                    <StyledTableCell sx={{ width: 80, padding: '12px 8px' }}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Update Status">
                          <EditNoteIcon
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(row); }}
                            aria-label={`View details for consignment ${row.consignment_number}`}
                            sx={{ 
                              color: '#f58220',
                              '&:hover': { backgroundColor: 'rgba(13, 108, 106, 0.08)', transform: 'scale(1.1)' },
                              transition: 'all 0.2s ease',
                              '&:focus': { outline: '2px solid #0d6c6a' }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </EditNoteIcon>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleEdit(row.id); }}
                            aria-label={`Edit consignment ${row.consignment_number}`}
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

      {/* Pagination (unchanged, but uses fixed total) */}
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

      {/* Dialog & Snackbar (unchanged) */}
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
            Update status for <strong>{selectedConsignmentForUpdate?.consignment_number}</strong>
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
  <MenuItem value="">All</MenuItem>
  {statusList?.map((status) => (
    <MenuItem key={status.value} value={status.value}>
      <ListItemIcon>
        <Avatar sx={{ width: 16, height: 16, bgcolor: status.color, fontSize: '0.75rem' }}>
          {status.usage_count > 0 ? status.usage_count : ''}
        </Avatar>
      </ListItemIcon>
      {status.label}
    </MenuItem>
  ))}
</Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, bgcolor: '#f8f9fa', borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCloseStatusDialog} size="small" variant="outlined">Cancel</Button>
          <Button onClick={() => handleConfirmStatusUpdate(selectedConsignmentForUpdate)} variant="contained" size="small" sx={{ backgroundColor: '#0d6c6a', '&:hover': { backgroundColor: '#0a5a59' } }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

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

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
}