
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
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EditIcon from "@mui/icons-material/Edit";
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import CargoIcon from '@mui/icons-material/LocalShipping'; // Or use InventoryIcon
import { styled } from '@mui/material/styles';
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import UpdateIcon from "@mui/icons-material/Update";
import { useNavigate } from "react-router-dom";
import OrderModalView from './OrderModalView'
import AssignModal from "./AssignContainer";
// import { ordersApi } from "../api"; // Adjust path as needed
import { api } from "../../api";
// Handlers

const OrdersList = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAllColumns, setShowAllColumns] = useState(false)
    const [loadingContainers, setLoadingContainers] = useState(false);
    const [assignmentError, setAssignmentError] = useState(null);
    const [selectedContainers, setSelectedContainers] = useState([]);
    const [places, setPlaces] = useState([]);
    const [filters, setFilters] = useState({
        status: "",
        booking_ref: "", // Updated: Use booking_ref for search
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
    // States for status update
    const [openStatusDialog, setOpenStatusDialog] = useState(false);
    const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState(null);
    const [selectedReceiverForUpdate, setSelectedReceiverForUpdate] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    // ... your existing component logic (useState, handlers, etc.)
    // Handlers
    const handleStatusUpdate = (orderId, order) => {
        console.log('Updating status for order:', orderId);
        setSelectedOrderForUpdate(orderId);
        if (orderId && orderId.length) {
            const firstRec = orderId[0];
            setSelectedReceiverForUpdate(firstRec);
            setSelectedStatus(firstRec.status || 'Received for Shipment'); // Default to receiver's status or first status
        }
        setOpenStatusDialog(true);
    };
    const handleCloseStatusDialog = () => {
        setOpenStatusDialog(false);
        setSelectedOrderForUpdate(null);
        setSelectedReceiverForUpdate(null);
        setSelectedStatus('');
    };
    const handleStatusChange = (event) => {
        console.log('Selected status:', event.target.value);
        setSelectedStatus(event.target.value);
    };
    const handleReceiverChange = (event) => {
        const recId = event.target.value;
        const rec = selectedOrderForUpdate?.find(r => r.id === recId);
        setSelectedReceiverForUpdate(rec);
        setSelectedStatus(rec?.status || 'Received for Shipment');
    };
    const handleConfirmStatusUpdate = async () => {
        if (!selectedOrderForUpdate || !selectedReceiverForUpdate || !selectedStatus) return;
        try {
            console.log('Updating status to:', selectedStatus, 'for receiver:', selectedReceiverForUpdate); 
            // API call to update receiver status (triggers notifications as per mapping)
            await api.put(`/api/orders/${selectedReceiverForUpdate.order_id}/receivers/${selectedReceiverForUpdate.id}/status`, {
                status: selectedStatus,
                // Optional: Include trigger logic if backend handles notifications
                notifyClient: true, // Based on "Shown to Client?" mapping
                notifyParties: true // Sender/Receiver as per rules
            });
            setSnackbar({
                open: true,
                message: `Status updated to "${selectedStatus}" for "${selectedReceiverForUpdate.receiver_name}" successfully! Notifications sent as per rules.`,
                severity: 'success',
            });
            fetchOrders(); // Refresh the list to update overall status
        } catch (err) {
            setSnackbar({
                open: true,
                message: 'Failed to update status',
                severity: 'error',
            });
        }
        handleCloseStatusDialog();
    };
    const fetchOrders = async () => {
        console.log('Fetching orders with filters:', filters, 'page:', page, 'rowsPerPage:', rowsPerPage);
        setLoading(true);
        setError(null);
        try {
          const nonEmptyFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v && v.trim())
  );
  const params = {
    page: page + 1,
    limit: rowsPerPage,
    includeContainer: true,
    ...nonEmptyFilters,  // Use this instead of ...filters
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

    // Fetch options on mount (replaces dummies)
const fetchOptions = async () => {
    try {
        setLoading(true);
        const [placesRes, companiesRes, categoriesRes, subcategoriesRes, statusesRes] = await Promise.all([
            api.get('api/options/places/crud'),
            api.get('api/options/thirdParty/crud'),
            api.get('api/options/categories/crud'), // Assumed endpoint; adjust if different
            api.get('api/options/subcategories/crud'), // For subcategories
            api.get('api/options/statuses'),
        ]);
        // Places: assume data.places = [{id, name, is_destination, ...}]
        console.log('optionssss', placesRes, companiesRes, categoriesRes, subcategoriesRes, statusesRes);
        const allPlaces = placesRes?.data?.places || [];
        setPlaces(allPlaces.map(p => ({ value: p.id.toString(), label: p.name })));
    } catch (error) {
        console.error('Error fetching options:', error);
        setSnackbar({
            open: true,
            message: error.response?.data?.error || error.message || 'Failed to fetch options',
            severity: 'error',
        });
       } finally {
        setLoading(false);
    }
};

// Helper function to get place name by ID
const getPlaceName = (placeId) => {
    if (!placeId) return '-';
    const place = places.find(p => p.value === placeId.toString());
    return place ? place.label : placeId;
};


    const handleReceiverAction = (receiver) => {
        console.log('Editing receiver:', receiver);
        // Example: Open an edit modal or update state
        // You can implement logic here, e.g., setEditingReceiver(receiver);
        alert(`Editing receiver: ${receiver.receiver_name}`); // Placeholder for demo
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
    const handleUpdateReceiver = (updatedReceiver) => {
        // Update in orders state, e.g.:
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.receivers?.map(rec =>
                    rec.id === updatedReceiver.id ? { ...rec, ...updatedReceiver } : rec
                ) || order.receivers
            )
        );
        // Optional: Show success snackbar
    };
    // Fetch open containers
    const fetchContainers = async () => {
        if (loadingContainers) return; // Prevent multiple calls
        setLoadingContainers(true);
        setAssignmentError(null);
        try {
            const response = await api.get('/api/containers');
            console.log('Fetched containers:', response);
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
            console.log('orders details', response)
            setSelectedOrder(response.data); // Now includes nested receivers, order_items, etc.
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
    const handleAssign = async (containerId, quantities) => {
        console.log('selected', containerId, selectedOrders, quantities);
        if (selectedOrders.length === 0 || !containerId) {
            setSnackbar({
                open: true,
                message: 'Please select orders and a container.',
                severity: 'warning',
            });
            return;
        }
        // Validate quantities if provided
        if (quantities && Object.keys(quantities).length === 0) {
            setSnackbar({
                open: true,
                message: 'Please specify quantities for at least one receiver.',
                severity: 'warning',
            });
            return;
        }
        try {
            const res = await api.post('/api/orders/assign-container', {
                order_ids: selectedOrders,
                container_id: containerId,
                quantities, // Include quantities object
            });
            setSnackbar({
                open: true,
                message: `Successfully assigned container & quantities to ${res.data.tracking?.length || selectedOrders.length} receivers across ${selectedOrders.length} orders.`,
                severity: 'success',
            });
            console.log('response', res);
            fetchContainers(); // Refresh containers
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
    const onUpdateAssignedQty = (receiverId, newQty) => {
        setOrders(prevOrders => prevOrders.map(order => ({
            ...order,
            receivers: order.receivers?.map(rec => rec.id === receiverId ? { ...rec, qty_delivered: newQty } : rec)
        })));
    };
    const onRemoveContainers = (receiverId) => {
        setOrders(prevOrders => prevOrders.map(order => ({
            ...order,
            receivers: order.receivers?.map(rec => rec.id === receiverId ? { ...rec, containers: [] } : rec)
        })));
        // Optional: Show success snackbar
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
                order.sender_name || '', // From senders join
                order.receiver_summary || '', // Aggregated receivers with status
                order.receiver_containers || '', // Aggregated containers
                order.container_number || '', // From containers join
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
        fetchOptions();
        fetchOrders();
    }, [page, rowsPerPage, filters]);
    useEffect(() => {
        fetchContainers();
    }, [openAssignModal]); // Fetch when modal opens
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleFilterChange = (e) => {
        console.log('Filter change:', e.target.name, e.target.value);
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPage(0);
    };

    const handleFilterText = (e) => {
        console.log('Filter change:', e.target.name, e.target.value );
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
    const statuses = [
        'Created',
        'Received for Shipment',
        'Waiting for Authentication',
        'Shipper Authentication Confirmed',
        'Waiting for Consignee Authentication',
        'Waiting for Shipper Authentication (if applicable)',
        'Consignee Authentication Confirmed',
        'In Process',
        'Ready for Loading',
        'Loaded into Container',
        'Departed for Port',
        'Offloaded at Port',
        'Clearance Completed',
        'Containers Returned (Internal only)', // Internal only - no client visibility
        'Hold',
        'Cancelled',
        'Delivered'
    ];
    const getStatusColors = (status) => {
        // Extend your existing getStatusColors function to handle new statuses
        const colorMap = {
            'Created': { bg: '#00695c', text: '#f1f8e9' },
            'Received for Shipment': { bg: '#e3f2fd', text: '#1976d2' },
            'Waiting for Authentication': { bg: '#fff3e0', text: '#ef6c00' },
            'Shipper Authentication Confirmed': { bg: '#e8f5e8', text: '#388e3c' },
            'Waiting for Consignee Authentication': { bg: '#fff3e0', text: '#ef6c00' },
            'Waiting for Shipper Authentication (if applicable)': { bg: '#fff3e0', text: '#ef6c00' },
            'Consignee Authentication Confirmed': { bg: '#e8f5e8', text: '#388e3c' },
            'In Process': { bg: '#fff3e0', text: '#ef6c00' },
            'Ready for Loading': { bg: '#f3e5f5', text: '#7b1fa2' },
            'Loaded into Container': { bg: '#e0f2f1', text: '#00695c' },
            'Departed for Port': { bg: '#e1f5fe', text: '#0277bd' },
            'Offloaded at Port': { bg: '#f1f8e9', text: '#689f38' },
            'Clearance Completed': { bg: '#fce4ec', text: '#c2185b' },
            'Containers Returned (Internal only)': { bg: '#ffebee', text: '#c62828' }, // Internal red
            'Hold': { bg: '#fff3e0', text: '#f57c00' },
            'Cancelled': { bg: '#ffebee', text: '#d32f2f' },
            'Delivered': { bg: '#e8f5e8', text: '#2e7d32' },
            // Fallback for unknown
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
        // console.log('assign container', receiverId, containerId)
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
    const parseSummaryToList = (receivers, order) => {
        console.log('Parsing receivers:', receivers,order);
        if (!receivers || !Array.isArray(receivers)) return [];
        return receivers.map(rec => ({
            primary: rec.receiver_name,
            status: rec.status,
            receivers
        }));
    };
    // Enhanced PrettyList: Modern vertical card-based layout for receivers with improved alignment, avatars, and status badges
    const PrettyList = ({ items, title }) => (
        <Card
            variant="outlined"
            sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: '#fafafa', // Subtle off-white background for better contrast
                boxShadow: 'none',
                '&:hover': {
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' // Gentle shadow on hover for depth
                }
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Title Section - Centered and prominent */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f58220' }}> {/* Use brand color for title */}
                        {title}
                    </Typography>
                    <Chip
                        label={`(${items.length})`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                            fontSize: '0.7rem',
                            height: 20,
                            '& .MuiChip-label': { px: 0.5 }
                        }}
                    />
                </Box>
                {/* Items List - Vertical stack with improved spacing */}
                <Stack spacing={1} sx={{ maxHeight: 200, overflow: 'auto' }}>
                    
                     {/* Add scrollable height for better UX in dense lists */}
                    {items.length > 0 ? (
                    console.log('Rendering items:', items), 
                    items.map((item, index) => (
                            <Card
                                key={index}
                                variant="outlined"
                                sx={{
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    backgroundColor: '#fff', // Clean white for individual cards
                                    boxShadow: 'none',
                                    transition: 'all 0.2s ease', // Smooth transitions
                                    '&:hover': {
                                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                                        transform: 'translateY(-1px)', // Subtle lift on hover
                                        borderColor: 'primary.light'
                                    },
                                    cursor: 'pointer' // Indicate interactivity
                                }}
                                onClick={() =>  handleStatusUpdate(item.receivers)} // Example action on click
                            >
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                                    {/* Avatar - Slightly larger for better touch targets */}
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: 'primary.main',
                                            fontSize: '1rem',
                                            flexShrink: 0 // Prevent shrinking
                                        }}
                                    >
                                        {item.primary ? item.primary.charAt(0).toUpperCase() : '?'}
                                    </Avatar>
                                    {/* Content - Flexible box for text wrapping */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight="medium"
                                            noWrap
                                            sx={{
                                                color: 'text.primary',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {item.primary || 'Unnamed Item'}
                                        </Typography>
                                        {item.secondary && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    mt: 0.25
                                                }}
                                            >
                                                {item.secondary}
                                            </Typography>
                                        )}
                                    </Box>
                                    {/* Status Badge - Aligned to the right */}
                                    {item.status && (
                                        <StatusChip
                                            status={item.status}
                                            size="small"
                                            sx={{
                                                fontSize: '0.7rem',
                                                height: 20,
                                                minWidth: 60,
                                                flexShrink: 0,
                                                '& .MuiChip-label': { px: 0.5 }
                                            }}
                                        />
                                    )}
                                </Stack>
                            </Card>
                        ))
                    ) : (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 3,
                            color: 'text.secondary'
                        }}>
                            <EmojiEventsIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} /> {/* Visual placeholder */}
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                No items available
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Box>
        </Card>
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
                        type="text"
                        name="booking_ref" // Updated to match backend filter
                        value={filters.booking_ref || ''}
                        onChange={handleFilterText}
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
                            <MenuItem value="">All</MenuItem> {/* Added "All" option */}
                            {statuses.map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status}
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
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="loading">POL</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="dest">POD</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="sender">Sender</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="receivers">Receivers</StyledTableHeadCell>, // Multiple receivers with status
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="containers">Containers</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="status">Status</StyledTableHeadCell>,
                                    // <TableCell key="assoc">Associated Container</TableCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="created">Created At</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="actions">Actions</StyledTableHeadCell>
                                ]}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => {
                                console.log('Rendering order:', order.receivers);
                                const isItemSelected = isSelected(order.id);
                                // renderReceivers( order.receivers);
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
                                        <StyledTableCell>{getPlaceName(order?.place_of_loading)}</StyledTableCell>
                                        <StyledTableCell>{getPlaceName(order.place_of_delivery)}</StyledTableCell>
                                        <StyledTableCell>{order.sender_name}</StyledTableCell>
                                        <StyledTableCell>
                                            <StyledTooltip
                                                title={<PrettyList items={parseSummaryToList(order.receivers,order)} title="Receivers" />}
                                                arrow
                                                placement="top"
                                                PopperProps={{
                                                    sx: { '& .MuiTooltip-tooltip': { border: '1px solid #e0e0e0' } }
                                                }}
                                            >
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
                                                    {order.receivers.length > 0
                                                        ? <>{order.receivers.length > 1 && <sup style={{ padding: 4, borderRadius: 50, float: 'left', background: '#00695c', color: '#fff' }}>({order.receivers.length})</sup>}
                                                            <span style={{ padding: 0 }}>{order.receivers.map(c => c.receiver_name || '').join(', ').substring(0, 25)}...</span></>
                                                        : '-'
                                                    }
                                                </Typography>
                                            </StyledTooltip>
                                        </StyledTableCell>
                                      <TableCell>
                                                                        <Tooltip
                                                                          // title={<PrettyContainersList items={parseContainersToList(order.receiver_containers_json)} title="Containers" />}
                                                                          title={<PrettyList items={parseContainersToList(order.receiver_containers_json || '')} title="Containers" />}
                                                                          arrow
                                                                          placement="top"
                                                                        >
                                                                          <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
                                                                            {order.receiver_containers_json
                                                                              ? <>{containersList.length > 1 && <sup style={{ padding: 4, borderRadius: 50, float: 'left', background: '#00695c', color: '#fff' }}>({containersList.length})</sup>}
                                                                                <span style={{ padding: 0 }}>{containersList.map(c => c.primary || '').join(', ').substring(0, 25)}...</span></>
                                                                              : '-'
                                                                            }
                                                                          </Typography>
                                                                        </Tooltip>
                                                                      </TableCell>
                                                                      <TableCell>
                                                                        <Chip
                                                                          label={`${status.substring(0, 15)}...`} // Internal status for admin
                                                                          // size="small"
                                                                          sx={{
                                                                            flexShrink: 0,
                                                                            backgroundColor: colors.bg,
                                                                            color: colors.text
                                                                          }}
                                                                        />
                                                                      </TableCell>
                                        <StyledTableCell>{new Date(order.created_at).toLocaleDateString()}</StyledTableCell>
                                        <StyledTableCell>
                                            <Stack direction="row" spacing={1}>
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, order); }} title="Update Status">
                                                    <UpdateIcon />
                                                </IconButton>
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleView(order.id); }} title="View Details">
                                                    <VisibilityIcon />
                                                </IconButton>
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(order.id); }} title="Edit">
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
                <AssignModal
                    openAssignModal={openAssignModal}
                    setOpenAssignModal={setOpenAssignModal}
                    selectedOrders={selectedOrders}
                    orders={orders} // Assuming 'orders' is available
                    containers={containers}
                    selectedContainers={selectedContainers}
                    setSelectedContainers={setSelectedContainers}
                    loadingContainers={loadingContainers}
                    fetchContainers={fetchContainers}
                    onUpdateAssignedQty={onUpdateAssignedQty}
                    onRemoveContainers={onRemoveContainers}
                    handleAssign={handleAssign}
                    handleReceiverAction={handleReceiverAction}
                    onUpdateReceiver={handleUpdateReceiver}
   
                />
                {/* Status Update Dialog - Updated for per-receiver status */}
                <Dialog
                    open={openStatusDialog}
                    onClose={handleCloseStatusDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Update Receiver Status</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Select receiver and new status for order "{selectedOrderForUpdate?.booking_ref}". Notifications will be sent based on rules.
                        </Typography>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Receiver</InputLabel>
                            <Select
                                value={selectedReceiverForUpdate?.id || ''}
                                label="Receiver"
                                onChange={handleReceiverChange}
                            >
                                {selectedOrderForUpdate?.map((rec) => (
                                    <MenuItem key={rec.id} value={rec.id}>
                                        {rec.receiver_name} (Current: {rec.status})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={selectedStatus}
                                label="Status"
                                onChange={handleStatusChange}
                            >
                                {statuses.map((status) => (
                                    <MenuItem key={status} value={status}>
                                        {status}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseStatusDialog}>Cancel</Button>
                        <Button onClick={handleConfirmStatusUpdate} variant="contained">
                            Update & Notify
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </>
    );
};
export default OrdersList;  
