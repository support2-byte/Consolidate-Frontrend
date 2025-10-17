// OrdersList.jsx - Component for fetching and displaying orders (updated for normalized schema)
import { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    Table,
    TableBody,
    Card,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    Snackbar,
    CardContent,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    AlertTitle,
    Checkbox,
    Collapse 
} from "@mui/material";
import Avatar from '@mui/material/Avatar';
import EditIcon from "@mui/icons-material/Edit";
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import CargoIcon from '@mui/icons-material/LocalShipping'; // Or use InventoryIcon
import PersonIcon from '@mui/icons-material/Person';
import Divider from '@mui/material/Divider';
import InfoIcon from "@mui/icons-material/Info";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { styled } from '@mui/material/styles';
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import { getOrderStatusColor } from "./Utlis"; 
import { useNavigate } from "react-router-dom";
import OrderModalView from './OrderModalView'
import AssignmentIcon from '@mui/icons-material/Assignment';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckIcon from '@mui/icons-material/Check';  
// import { ordersApi } from "../api"; // Adjust path as needed
import { api } from "../../api";

const OrdersList = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
        const [loadingContainers, setLoadingContainers] = useState(false);
        const [assignmentError, setAssignmentError] = useState(null);
    const [filters, setFilters] = useState({
        status: "",
        booking_ref: "",  // Updated: Use booking_ref for search
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "info",
    });
    const [openModal, setOpenModal] = useState(false);
const [assignments, setAssignments] = useState({}); // For storing receiver-container assignments

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [exporting, setExporting] = useState(false);

    // New states for selection and assignment
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [openAssignModal, setOpenAssignModal] = useState(false);
    const [containers, setContainers] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: page + 1, // API uses 1-based
                limit: rowsPerPage,
                includeContainer: true,
                ...filters,
            };
            const response = await api.get(`/api/orders`, { params });
            console.log('Fetched orders:', response.data);
            setOrders(response.data.data || []);
            setTotal(response.data.total || 0);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("Failed to fetch orders");
            setSnackbar({
                open: true,
                message: err.response?.data?.error || err.message || 'Failed to fetch orders',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

        // Helper to normalize containers (handle string or array)
    // const normContainers = selectedOrder ? normalizeContainers(selectedOrders.containers) : []; 

   // Helper for horizontal key-value pairs in Grid
    const HorizontalKeyValue = ({ data, spacing = 3 }) => (
        <Grid container spacing={spacing}>
            {Object.entries(data).map(([key, value]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                    <Box sx={{ 
                        p: 2, 
                        border: '1px solid #e3f2fd', 
                        borderRadius: 2, 
                        bgcolor: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                            boxShadow: '0 4px 12px rgba(245, 130, 32, 0.15)',
                            transform: 'translateY(-2px)',
                            borderColor: '#f58220'
                        }
                    }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ 
                            textTransform: 'uppercase', 
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            mb: 0.5
                        }}>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="text.primary" sx={{ fontSize: '1rem' }}>
                            {value || 'N/A'}
                        </Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );

    // Fetch open containers
    const fetchContainers = async () => {
        if (loadingContainers) return; // Prevent multiple calls
        setLoadingContainers(true);
        setAssignmentError(null);
        try {
            const response = await api.get('/api/containers');
            setContainers(response.data.data || []);
        } catch (err) {
            console.error("Error fetching containers:", err);
            setAssignmentError('Failed to fetch containers. Please check the backend query for table "cm".');
            setSnackbar({ open: true, message: 'Failed to fetch containers', severity: 'error' });
        } finally {
            setLoadingContainers(false);
        }
    };


    const fetchOrderDetails = async (orderId) => {
        setModalLoading(true);
        setModalError(null);
        try {
            const response = await api.get(`/api/orders/${orderId}`);
            console.log('orders details',response)
            setSelectedOrder(response.data);  // Now includes nested receivers, order_items, etc.
        } catch (err) {
            console.error("Error fetching order details:", err);
            setModalError(err.response?.data?.error || err.message || 'Failed to fetch order details');
            setSnackbar({
                open: true,
                message: err.response?.data?.error || err.message || 'Failed to fetch order details',
                severity: 'error',
            });
        } finally {
            setModalLoading(false);
        }
    };

const handleClick = (id) => {
  const selectedIndex = selectedOrders.indexOf(id);
  let newSelected = [...selectedOrders];

  if (selectedIndex === -1) {
    newSelected.push(id);
  } else {
    newSelected.splice(selectedIndex, 1);
  }

  setSelectedOrders(newSelected);
};

// 2. handleSelectAllClick function (select/deselect all visible rows)
const handleSelectAllClick = (event) => {
  if (event.target.checked) {
    const newSelected = orders.map((n) => n.id);
    setSelectedOrders(newSelected);
    return;
  }
  setSelectedOrders([]);
};

const isSelected = (id) => selectedOrders.indexOf(id) !== -1;

   const handleAssign = async () => {
  if (selectedOrders.length === 0 || !selectedContainer) {
    setSnackbar({
      open: true,
      message: 'Please select orders and a container.',
      severity: 'warning',
    });
    return;
  }
  try {
    await api.post('/api/orders/assign-container', {
      order_ids: selectedOrders,
      container_id: selectedContainer,
    });
    setSnackbar({
      open: true,
      message: `Successfully assigned ${selectedOrders.length} orders to container.`,
      severity: 'success',
    });
    // fetchContainers(); // Refresh containers
    setOpenAssignModal(false);
    setSelectedOrders([]); // Clear selection after assign
    setSelectedContainer('');
    fetchOrders(); // Refresh list
  } catch (err) {
    console.error('Error assigning container:', err);
    setSnackbar({
      open: true,
      message: err.response?.data?.error || err.message || 'Failed to assign container',
      severity: 'error',
    });
  }
};

    const exportOrders = async () => {
        if (total === 0) {
            setSnackbar({
                open: true,
                message: 'No orders to export',
                severity: 'warning',
            });
            return;
        }
        setExporting(true);
        try {
            let allOrders = [];
            let currentPage = 1;
            const pageSize = 100;
            let hasMore = true;
            const exportFilters = { ...filters };

            while (hasMore) {
                const params = {
                    page: currentPage,
                    limit: pageSize,
                    includeContainer: true,
                    ...exportFilters,
                };
                const response = await api.get(`/api/orders`, { params });
                const pageOrders = response.data.data || [];
                allOrders = [...allOrders, ...pageOrders];
                if (pageOrders.length < pageSize) {
                    hasMore = false;
                } else {
                    currentPage++;
                }
            }

            if (allOrders.length === 0) {
                setSnackbar({
                    open: true,
                    message: 'No orders found to export',
                    severity: 'warning',
                });
                return;
            }

            const headers = [
                'Booking Ref',
                'Status',
                'Place of Loading',
                'Final Destination',
                'Sender',
                'Receivers',
                'Containers',
                'Associated Container',
                'Created At'
            ];

            const rows = allOrders.map((order) => [
                order.booking_ref || '',
                order.status || '',
                order?.place_of_loading || '',
                order.final_destination || '',
                order.sender_name || '',  // From senders join
                order.receiver_summary || '',  // Aggregated receivers with status
                order.receiver_containers || '',  // Aggregated containers
                order.container_number || '',  // From containers join
                new Date(order.created_at).toLocaleDateString()
            ]);

            const csvContent = [headers, ...rows]
                .map((row) => row.map((cell) => `"${cell}"`).join(','))
                .join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSnackbar({
                open: true,
                message: `Successfully exported ${allOrders.length} orders`,
                severity: 'success',
            });
        } catch (err) {
            console.error('Error exporting orders:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.error || err.message || 'Failed to export orders',
                severity: 'error',
            });
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        fetchContainers();
    }, [openAssignModal]);  // Fetch when modal opens

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPage(0);
    };

    const handleEdit = (orderId) => {
        navigate(`/orders/${orderId}/edit/`, { state: { orderId } });
    };

    const handleView = (orderId) => {
        fetchOrderDetails(orderId);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedOrder(null);
        setModalError(null);
    };

    const handleSnackbarClose = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    const statuses = ["", "Created", "In Transit", "Delivered", "Cancelled"]; // "" for all

    // Status color mapping function
    const getStatusColors = (status) => {
        const colorMap = {
            'Created': { bg: '#e3f2fd', text: '#1976d2' },
            'In Transit': { bg: '#fff3e0', text: '#f57c00' },
            'Delivered': { bg: '#e8f5e8', text: '#388e3c' },
            'Cancelled': { bg: '#ffebee', text: '#d32f2f' },
            default: { bg: '#f5f5f5', text: '#666' }
        };
        return colorMap[status] || colorMap.default;
    };

    const StyledTooltip = styled(Tooltip)(({ theme }) => ({
        [`& .MuiTooltip-tooltip`]: {
            backgroundColor: theme.palette.common.white,
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[3],
            borderRadius: theme.shape.borderRadius,
            fontSize: theme.typography.body2.fontSize,
            maxWidth: '300px',
            border: `1px solid ${theme.palette.divider}`,
        },
        [`& .MuiTooltip-arrow`]: {
            color: theme.palette.common.white,
        },
    }));

    const StyledList = styled(List)(({ theme }) => ({
        padding: theme.spacing(1),
        '& .MuiListItem-root': {
            borderRadius: theme.shape.borderRadius,
            margin: theme.spacing(0.25),
            '&:hover': {
                backgroundColor: theme.palette.action.hover,
            },
        },
    }));

       const normalizeContainers = (containers) => {
        if (!containers) return [];
        if (typeof containers === 'string') {
            return [containers.trim()];
        }
        if (Array.isArray(containers)) {
            return containers;
        }
        return [];
    };
    // Handle assign container to receiver
    const handleAssignContainer = async (receiverId, containerId) => {
        if (!containerId) return;
        try {
            await api.post(`/api/orders/${selectedOrder.id}/receivers/${receiverId}/assign-container`, { container_id: containerId });
            setSnackbar({ open: true, message: 'Container assigned successfully', severity: 'success' });
            fetchContainers(); // Refresh open containers
            // Refresh order details if needed (e.g., refetch selectedOrder in parent)
        } catch (err) {
            console.error('Error assigning container:', err);
            setAssignmentError(err.response?.data?.error || 'Failed to assign container');
            setSnackbar({ open: true, message: 'Failed to assign container', severity: 'error' });
        }
    };



    const StatusChip = ({ status }) => {
        const colors = getStatusColors(status);
        return (
            <Chip
                label={status}
                size="small"
                sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    marginLeft: 2,
                    backgroundColor: colors.bg,
                    color: colors.text,
                }}
            />
        );
    };

// Updated helper: parse and enhance with icons/chips for better UX
const parseSummaryToList = (receivers) => {
    console.log('Parsing receivers:', receivers);
    if (!receivers || !Array.isArray(receivers)) return [];
    return receivers.map(rec => ({
        primary: rec.receiver_name,
        status: rec.status
    }));
};

// Enhanced PrettyList: Modern card-based layout for receivers with avatars and status badges
const PrettyList = ({ items, title }) => (
  <Box sx={{ p: 1, maxWidth: 280 }}><Typography variant="caption" sx={{ fontWeight: 'bold', color: '#fff', mb: 1, display: 'block' }}>
      {title} ({items.length})
    </Typography>
    <Stack spacing={0.75}>
      {items.length > 0 ? (
        items.map((item, index) => (
          <Card 
            key={index} 
            variant="outlined" 
            sx={{ 
              p: 1, 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'divider',
              backgroundColor: '#f8f9fa', // Changed to light grey background
              boxShadow: 'none',
              '&:hover': { 
                boxShadow: 1, 
                backgroundColor: '#e9ecef' // Darker grey on hover
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar 
                sx={{ 
                  width: 18, 
                  height: 18, 
                  bgcolor: 'primary.light', 
                  fontSize: '0.875rem' 
                }}
              >
                {item.primary.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight="medium" noWrap sx={{ mb: 0.25 }}>
                  {item.primary}
                </Typography>
                {item.status && (
                  <StatusChip status={item.status} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                )}
              </Box>
            </Stack>
          </Card>
        ))
      ) : (
        <Card variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, backgroundColor: '#f8f9fa' }}>
          <Typography variant="body2" color="text.secondary" italic>
            No items
          </Typography>
        </Card>
      )}
    </Stack>
  </Box>
);

// Enhanced parse for containers: Simple string split
const parseContainersToList = (containersStr) => {
  if (!containersStr) return [];
  return containersStr.split(', ').map(cont => ({ primary: cont.trim() }));
};

// Enhanced PrettyContainersList: Horizontal chips for compact, modern feel
const PrettyContainersList = ({ items, title }) => (
    console.log('Containers items:', items),    
  <Box sx={{ p: 1, maxWidth: 280 }}>
    <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 1, display: 'block' }}>
      {title} ({items.length})
    </Typography>
    <Stack direction="row" flexWrap="wrap" spacing={0.75} useFlexGap>
      {items.length > 0 ? (
        items.map((item, index) => (
          <Chip
            key={index}
            label={item.primary}
            icon={<CargoIcon fontSize="small" />}
            size="small"
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              borderColor: 'divider',
              backgroundColor: '#f8f9fa', // Changed to light grey background
              '& .MuiChip-icon': { color: 'secondary.main' },
              fontSize: '0.75rem',
              height: 24,
              '&:hover': { backgroundColor: '#e9ecef' } // Darker grey on hover
            }}
          />
        ))
      ) : (
        <Chip
          label="No containers"
          size="small"
          variant="outlined"
          sx={{ 
            borderRadius: 1.5, 
            borderColor: 'divider', 
            backgroundColor: '#f8f9fa', // Changed to light grey background
            color: 'text.secondary',
            fontSize: '0.75rem',
            height: 24,
          }}
        />
      )}
    </Stack>
  </Box>
);
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

    if (loading) {
        return (
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                    <CircularProgress size={24} />
                    <Typography variant="h6" color="#f58220">Loading orders...</Typography>
                </Stack>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
                <Typography variant="h6" color="error">{error}</Typography>
                <Button variant="contained" onClick={fetchOrders} sx={{ mt: 2, backgroundColor: "#f58220" }}>
                    Retry
                </Button>
            </Paper>
        );
    }

const numSelected = selectedOrders.length;
const rowCount = orders.length;

    return (
        <>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" fontWeight="bold" color="#f58220">
                        Orders List
                    </Typography>
                    <Stack direction="row" spacing={2}>
                  <Button
  variant="contained"
  disabled={numSelected === 0}
  onClick={() => setOpenAssignModal(true)}
  startIcon={<AddIcon />}
  sx={{
    borderRadius: 2,
    backgroundColor: "#0d6c6a",
    color: "#fff",
    "&:hover": { backgroundColor: "#0d6c6a" },
  }}
>
  Add Selected to Container ({numSelected})
</Button>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={exportOrders}
                            disabled={loading || exporting || total === 0}
                            sx={{
                                borderRadius: 2,
                                borderColor: "#0d6c6a",
                                color: "#0d6c6a",
                                "&:hover": { borderColor: "#0d6c6a", backgroundColor: "#0d6c6a", color: "#fff" },
                            }}
                        >
                            {exporting ? <CircularProgress size={20} color="inherit" /> : null}
                            Export Orders
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate("/orders/add")}
                            sx={{
                                borderRadius: 2,
                                backgroundColor: "#0d6c6a",
                                color: "#fff",
                                "&:hover": { backgroundColor: "#0d6c6a" },
                            }}
                        >
                            New Order
                        </Button>
                    </Stack>
                </Stack>
   
                {/* Filters - Updated: booking_ref for search */}
                <Stack direction="row" spacing={2} mb={3} alignItems="center">
                    <TextField
                        label="Search Booking Ref"
                        name="booking_ref"  // Updated to match backend filter
                        value={filters.booking_ref}
                        onChange={handleFilterChange}
                        size="small"
                        sx={{ width: 200 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            name="status"
                            value={filters.status}
                            label="Status"
                            onChange={handleFilterChange}
                        >
                            {statuses.map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status || "All"}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>

                <TableContainer sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
                    <Table stickyHeader>
                        <TableHead >
                            <TableRow sx={{ bgcolor: '#0d6c6a' }} >
                              <TableCell padding="checkbox" sx={{ bgcolor: '#0d6c6a', color: '#fff' }}>
  <Checkbox
    color="primary"
    indeterminate={numSelected > 0 && numSelected < rowCount}
    checked={rowCount > 0 && numSelected === rowCount}
    onChange={handleSelectAllClick}
  />
</TableCell>
                                {[
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="ref">Booking Ref</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="loading">Place of Loading</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="dest">Final Destination</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="sender">Sender</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="receivers">Receivers</StyledTableHeadCell>, // Multiple receivers with status
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="containers">Containers</StyledTableHeadCell> ,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="status">Status</StyledTableHeadCell>,
                                    //   <TableCell key="assoc">Associated Container</TableCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="created">Created At</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="actions">Actions</StyledTableHeadCell>
                                ]}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {orders.map((order) => {
                            console.log('Rendering order:', order.receivers);
  const isItemSelected = isSelected(order.id);
                        //  renderReceivers( order.receivers);
                                const containersList = order.receiver_containers_json ? order.receiver_containers_json.split(', ').map(cont => ({ primary: cont })) : []; // Simple for containers
                                const status = order.overall_status || order.status || 'Created';
                                const colors = getStatusColors(status);

                                return (
                                   <StyledTableRow 
      key={order.id}
      onClick={() => handleClick(order.id)}
      role="checkbox"
      aria-checked={isItemSelected}
      selected={isItemSelected}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          checked={isItemSelected}
          onChange={(event) => {
            handleClick(order.id);
            event.stopPropagation();
          }}
          inputProps={{
            'aria-labelledby': `enhanced-table-checkbox-${order.id}`,
          }}
        />
      </TableCell>
                                        <StyledTableCell>{order.booking_ref}</StyledTableCell>
                                        <StyledTableCell>{order?.place_of_loading}</StyledTableCell>
                                        <StyledTableCell>{order.final_destination}</StyledTableCell>
                                        <StyledTableCell>{order.sender_name}</StyledTableCell>
                                       <StyledTableCell>
    <StyledTooltip
        title={<PrettyList items={parseSummaryToList(order.receivers)} title="Receivers" />}
        arrow
        placement="top"
        PopperProps={{
            sx: { '& .MuiTooltip-tooltip': { border: '1px solid #e0e0e0' } }
        }}
    >
        <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
            {order.receivers && order.receivers.length > 0 
                ? `${order.receivers.map(r => r.receiver_name).join(', ').substring(0, 20)}...` 
                : '-'
            }
        </Typography>
    </StyledTooltip>
</StyledTableCell>
                                        <StyledTableCell>
                                            <StyledTooltip
                                                title={<PrettyContainersList items={parseContainersToList(order.receiver_containers_json)} title="Containers" />}
                                                arrow
                                                placement="top"
                                            >
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 100, cursor: 'help', fontWeight: 'medium' }}>
                                                    {order.receiver_containers_json ? `${order.receiver_containers_json.substring(0, 15)}...` : '-'}
                                                </Typography>
                                            </StyledTooltip>
                                        </StyledTableCell>
                                          <StyledTableCell>
                                            <Chip
                                                label={status}
                                                size="small"
                                                sx={{ 
                                                    backgroundColor: colors.bg,
                                                    color: colors.text
                                                }}
                                            />
                                        </StyledTableCell>
                                        <StyledTableCell>{new Date(order.created_at).toLocaleDateString()}</StyledTableCell>
                                        <StyledTableCell>
                                            <Stack direction="row" spacing={1}>
                                                <IconButton size="small" onClick={() => handleView(order.id)} title="View Details">
                                                    <VisibilityIcon />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleEdit(order.id)} title="Edit">
                                                    <EditIcon />
                                                </IconButton>
                                            </Stack>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ 
                        borderTop: '1px solid rgba(224, 224, 224, 1)',
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                            color: '#f58220',
                            fontWeight: 'medium',
                        },
                        '& .MuiTablePagination-actions button': {
                            color: '#0d6c6a',
                        }
                    }}
                />

                <OrderModalView 
                    openModal={openModal} 
                    handleCloseModal={handleCloseModal} 
                    selectedOrder={selectedOrder} 
                    modalLoading={modalLoading} 
                    modalError={modalError} 
                />

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

<Dialog 
    open={openAssignModal} 
    onClose={() => setOpenAssignModal(false)} 
    maxWidth="xl" 
    fullWidth
    PaperProps={{
        sx: {
            borderRadius: 3,
            maxHeight: '95vh', // Prevent overflow on small screens
            overflow: 'hidden',
            // width: { xs: '98%', sm: '90%', md: '60%' } // Responsive width
        }
    }}
>
    <DialogTitle sx={{ 
        bgcolor: '#0d6c6a', 
        color: 'white', 
        borderRadius: '12px 12px 0 0',
        py: { xs: 2, sm: 2.5 },
        px: { xs: 2, sm: 3 }
    }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocalShippingIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                <Typography variant={{ xs: 'h6', sm: 'h5' }} fontWeight="bold">
                    Assign Selected Orders to Container
                </Typography>
                <Chip 
                    label={`(${selectedOrders.length} Orders)`} 
                    size="small" 
                    color="secondary" 
                    variant="filled" 
                    sx={{ 
                        ml: 1,
                        fontSize: { xs: '0.7rem', sm: '0.8rem' }
                    }}
                />
            </Box>
            <IconButton 
                onClick={() => setOpenAssignModal(false)} 
                sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
                <CloseIcon />
            </IconButton>
        </Stack>
    </DialogTitle>
    <DialogContent sx={{ 
        mt: 2,
        p: { xs: 2, sm: 3 }, 
        overflow: 'auto',
        height: '80vh',
        maxHeight: '80vh' // Sc rollable content on small screens
    }}>
        <Grid container justifyContent={"space-between"} mb={3} spacing={{ xs: 2, sm: 2 }}>
            {/* Available Containers Section */}
            <Grid item width="48%" xs={12}>
                <Card sx={{ 
                    boxShadow: 2, 
                    borderRadius: 2,
                    border: '1px solid #e3f2fd',
                    '&:hover': { boxShadow: '0 4px 12px rgba(245, 130, 32, 0.1)' }
                }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InventoryIcon color="primary" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                                <Typography variant={{ xs: 'subtitle2', sm: 'subtitle1' }} fontWeight="bold" color="#f58220">
                                    Available Open Containers ({containers.length})
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={fetchContainers}
                                disabled={loadingContainers}
                                startIcon={loadingContainers ? <CircularProgress size={16} /> : <RefreshIcon />}
                                sx={{ minWidth: 'auto' }}
                            >
                                {loadingContainers ? 'Loading...' : 'Refresh'}
                            </Button>
                        </Box>
                        {loadingContainers ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: { xs: 3, sm: 4 } }}>
                                <CircularProgress size={24} />
                                <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                                    Fetching containers...
                                </Typography>
                            </Box>
                        ) : containers.length === 0 ? (
                            <Alert severity="info" icon={<InfoIcon />}>
                                <AlertTitle>No Containers Available</AlertTitle>
                                No open containers found. Try refreshing or check if any are marked as 'Available'.
                            </Alert>
                        ) : (
                            <TableContainer sx={{ maxHeight: { xs: 250, sm: 300 }, overflow: 'auto' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 1, sm: 2 } }}>Container No</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 1, sm: 2 } }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 1, sm: 2 } }}>Location</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 1, sm: 2 } }}>Owner Type</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {containers.map((container) => (
                                            <TableRow 
                                                key={container.cid} 
                                                hover 
                                                selected={selectedContainer === container.cid}
                                                onClick={() => setSelectedContainer(container.cid)}
                                                sx={{ 
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: '#f0f8ff' },
                                                    transition: 'all 0.2s ease',
                                                    '&.Mui-selected': { bgcolor: 'success.50' }
                                                }}
                                            >
                                                <TableCell sx={{ px: { xs: 1, sm: 2 }, fontWeight: 'medium' }}>{container.container_number}</TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                    <Chip 
                                                        label={container.derived_status} 
                                                        size="small" 
                                                        color={container.derived_status === 'Available' ? 'success' : 'default'} 
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{container.location || 'N/A'}</TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                    <Chip 
                                                        label={container.owner_type.toUpperCase()} 
                                                        size="small" 
                                                        variant="outlined" 
                                                        color="info" 
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Grid> 
             {/* All Receivers Section */}
            <Grid item width="48%"  xs={12}>
                <Card sx={{ 
                    boxShadow: 2, 
                    borderRadius: 2,
                    border: '1px solid #e3f2fd',
                    '&:hover': { boxShadow: '0 4px 12px rgba(245, 130, 32, 0.1)' }
                }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <PersonIcon color="primary" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                            <Typography variant={{ xs: 'subtitle2', sm: 'subtitle1' }} fontWeight="bold" color="#f58220">
                                All Receivers
                            </Typography>
                            <Chip 
                                label={`(${selectedOrders.reduce((total, orderId) => {
                                    const order = orders.find(o => o.id === orderId);
                                    return total + (order ? (order.receivers ? order.receivers.length : 0) : 0);
                                }, 0)})`} 
                                size="small" 
                                color="info" 
                            />
                        </Box>
                        <TableContainer sx={{ maxHeight: { xs: 200, sm: 250 }, overflow: 'auto' }}>
                            <Table size="small" stickyHeader>
                                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 1, sm: 2 } }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 1, sm: 2 } }}>Order</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 1, sm: 2 } }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 1, sm: 2 } }}>Containers</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedOrders.flatMap(orderId => {
                                        const order = orders.find(o => o.id === orderId);
                                        return order && order.receivers ? order.receivers.map(rec => ({
                                            ...rec,
                                            orderRef: order.booking_ref
                                        })) : [];
                                    }).map((rec, index) => (
                                        <TableRow 
                                            key={`${rec.order_id}-${rec.id || index}`} 
                                            hover 
                                            sx={{ 
                                                '&:hover': { bgcolor: '#f8f9fa' },
                                                transition: 'background-color 0.2s ease'
                                            }}
                                        >
                                            <TableCell sx={{ px: { xs: 1, sm: 2 }, fontWeight: 'medium' }}>{rec.receiver_name}</TableCell>
                                            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{rec.orderRef}</TableCell>
                                            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                <Chip 
                                                    label={rec.status || 'Created'} 
                                                    size="small" 
                                                    color={rec.status === 'Delivered' ? 'success' : rec.status === 'In Transit' ? 'warning' : 'default'} 
                                                />
                                            </TableCell>
                                            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                {rec.containers && rec.containers.length > 0 
                                                    ? <Chip label={rec.containers.join(', ')} size="small" variant="outlined" color="info" />
                                                    : <Chip label="None" size="small" color="default" variant="outlined" />
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {selectedOrders.reduce((total, orderId) => {
                            const order = orders.find(o => o.id === orderId);
                            return total + (order ? (order.receivers ? order.receivers.length : 0) : 0);
                        }, 0) === 0 && (
                            <Alert severity="info" sx={{ mt: 2, borderRadius: 1 }}>
                                <AlertTitle>No Receivers Found</AlertTitle>
                                The selected orders have no associated receivers.
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </Grid>
     

           
            </Grid>

<Grid container width="100%" justifyContent="space-between" sx={{ mt: 1,  overflow: 'auto',
       }}>
               {/* Selected Orders Section */}
            <Grid width="48%" item xs={12}>
                <Card sx={{ 
                    boxShadow: 2, 
                    borderRadius: 2,
                    border: '1px solid #e3f2fd',
                    '&:hover': { boxShadow: '0 4px 12px rgba(245, 130, 32, 0.1)' }
                }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <InfoIcon color="primary" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                            <Typography variant={{ xs: 'subtitle2', sm: 'subtitle1' }} fontWeight="bold" color="#f58220">
                                Selected Orders
                            </Typography>
                        </Box>
                        <TableContainer sx={{ maxHeight: { xs: 200, sm: 250 }, overflow: 'auto' }}>
                            <Table size="small" stickyHeader>
                                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 1, sm: 2 } }}>Booking Ref</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 1, sm: 2 } }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 1, sm: 2 } }}>Receivers</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedOrders.map(orderId => {
                                        const order = orders.find(o => o.id === orderId);
                                        if (!order) return null;
                                        const numReceivers = order.receivers ? order.receivers.length : 0;
                                        return (
                                            <TableRow 
                                                key={orderId} 
                                                hover 
                                                sx={{ 
                                                    '&:hover': { bgcolor: '#f8f9fa' },
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                            >
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{order.booking_ref}</TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                    <Chip 
                                                        label={order.status || 'Created'} 
                                                        size="small" 
                                                        color={order.status === 'Delivered' ? 'success' : order.status === 'In Transit' ? 'warning' : 'default'} 
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                    <Chip 
                                                        label={`${numReceivers}`} 
                                                        size="small" 
                                                        color="info" 
                                                        variant="outlined" 
                                                        icon={<PersonIcon fontSize="small" />}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {selectedOrders.length === 0 && (
                            <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
                                <AlertTitle>No Orders Selected</AlertTitle>
                                Please select orders from the main table to assign containers.
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        {/* Container Selection Section */}
            <Grid  width="48%" item xs={12}>
                <Card sx={{ 
                    boxShadow: 2, 
                    borderRadius: 2,
                    border: '1px solid #e3f2fd',
                    '&:hover': { boxShadow: '0 4px 12px rgba(245, 130, 32, 0.1)' }
                }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <InventoryIcon color="primary" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                            <Typography variant={{ xs: 'subtitle2', sm: 'subtitle1' }} fontWeight="bold" color="#f58220">
                                Select Container
                            </Typography>
                        </Box>
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <InputLabel>Available Container</InputLabel>
                            <Select
                                value={selectedContainer}
                                label="Available Container"
                                onChange={(e) => setSelectedContainer(e.target.value)}
                                startAdornment={
                                    selectedContainer ? (
                                        <Chip 
                                            label="Selected" 
                                            size="small" 
                                            color="success" 
                                            sx={{ mr: 1, height: 20 }} 
                                        />
                                    ) : null
                                }
                            >
                                <MenuItem value="">
                                    <em>Choose a container from available options below</em>
                                </MenuItem>
                                {containers.map((container) => (
                                    <MenuItem key={container.cid} value={container.cid}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                            <CargoIcon fontSize="small" color="info" />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {container.container_number}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {container.derived_status} • {container.owner_type}
                                                </Typography>
                                            </Box>
                                            {container.location && (
                                                <Chip 
                                                    label={container.location} 
                                                    size="small" 
                                                    variant="outlined" 
                                                    color="info" 
                                                />
                                            )}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {!selectedContainer && containers.length > 0 && (
                            <Alert severity="info" icon={<InfoIcon />}>
                                Select a container to assign. It will be linked to all {selectedOrders.reduce((total, orderId) => {
                                    const order = orders.find(o => o.id === orderId);
                                    return total + (order ? (order.receivers ? order.receivers.length : 0) : 0);
                                }, 0)} receivers in the selected orders.
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </Grid>

        
            
        </Grid>

        {/* Summary Alert */}
        {selectedOrders.length > 0 && selectedContainer && (
            <Collapse in={true} timeout={300}>
                <Alert 
                    severity="success" 
                    icon={<CheckIcon />} 
                    sx={{ 
                        mt: 2, 
                        borderRadius: 2,
                        animation: 'slideIn 0.3s ease-out'
                    }}
                >
                    <AlertTitle>Ready to Assign</AlertTitle>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        This will assign the selected container to {selectedOrders.reduce((total, orderId) => {
                            const order = orders.find(o => o.id === orderId);
                            return total + (order ? (order.receivers ? order.receivers.length : 0) : 0);
                        }, 0)} receivers across {selectedOrders.length} orders.
                    </Typography>
                </Alert>
            </Collapse>
        )}
    </DialogContent>
    <DialogActions sx={{ 
        p: { xs: 2, sm: 3 }, 
        bgcolor: '#f8f9fa', 
        borderTop: '1px solid #e0e0e0',
        justifyContent: 'space-between'
    }}>
        <Button 
            onClick={() => setOpenAssignModal(false)} 
            variant="outlined" 
            sx={{ 
                borderRadius: 2, 
                borderColor: '#f58220', 
                color: '#f58220',
                px: 3,
                '&:hover': { borderColor: '#e65100', color: '#e65100' }
            }}
        >
            Cancel
        </Button>
        <Button 
            onClick={handleAssign} 
            variant="contained" 
            disabled={!selectedContainer || selectedOrders.length === 0}
            sx={{ 
                borderRadius: 2, 
                bgcolor: '#f58220',
                px: 4,
                '&:hover': { bgcolor: '#e65100' },
                '&.Mui-disabled': { bgcolor: 'grey.400' },
                boxShadow: selectedContainer ? '0 3px 8px rgba(245, 130, 32, 0.3)' : 'none'
            }}
            startIcon={<AssignmentIcon />}
        >
            Assign ({selectedOrders.length} Orders)
        </Button>
    </DialogActions>
</Dialog>
            </Paper>
        </>
    );
};   
export default OrdersList;