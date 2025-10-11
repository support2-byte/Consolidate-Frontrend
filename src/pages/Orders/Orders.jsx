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
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
} from "@mui/material";
import Avatar from '@mui/material/Avatar';
import EditIcon from "@mui/icons-material/Edit";
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import CargoIcon from '@mui/icons-material/LocalShipping'; // Or use InventoryIcon
import PersonIcon from '@mui/icons-material/Person';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import OrderModalView from './OrderModalView'
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

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [exporting, setExporting] = useState(false);

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
                order.place_of_loading || '',
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
const parseSummaryToList = (summary) => {
  if (!summary) return [];
  return summary.split(', ').map(item => {
    const match = item.match(/^(.*) \((.*)\)$/);
    return match ? { 
      primary: match[1].trim(), 
      status: match[2].trim(),
    } : { primary: item.trim(), status: null };
  });
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

    return (
        <>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" fontWeight="bold" color="#f58220">
                        Orders List
                    </Typography>
                    <Stack direction="row" spacing={2}>
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
                                const receiversList = parseSummaryToList(order.receiver_summary);
                                const containersList = order.receiver_containers_json ? order.receiver_containers_json.split(', ').map(cont => ({ primary: cont })) : []; // Simple for containers
                                const status = order.overall_status || order.status || 'Created';
                                const colors = getStatusColors(status);

                                return (
                                    <StyledTableRow key={order.id}>
                                        <StyledTableCell>{order.booking_ref}</StyledTableCell>
                                        <StyledTableCell>{order.place_of_loading}</StyledTableCell>
                                        <StyledTableCell>{order.final_destination}</StyledTableCell>
                                        <StyledTableCell>{order.sender_name}</StyledTableCell>
                                        <StyledTableCell>
                                            <StyledTooltip
                                                title={<PrettyList items={parseSummaryToList(order.receiver_summary)}  title="Receivers" />}
                                                arrow
                                                placement="top"
                                                PopperProps={{
                                                    sx: { '& .MuiTooltip-tooltip': { border: '1px solid #e0e0e0' } }
                                                }}
                                            >
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
                                                    {order.receiver_summary ? `${order.receiver_summary.substring(0, 20)}...` : '-'}
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
            </Paper>
        </>
    );
};   
export default OrdersList;