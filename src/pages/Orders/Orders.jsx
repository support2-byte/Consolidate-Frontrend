
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
    InputAdornment,
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
    Collapse,
    Divider,
    Tab
} from "@mui/material";
import Avatar from '@mui/material/Avatar';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EditIcon from "@mui/icons-material/Edit";
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Autocomplete } from "@mui/material";
import CargoIcon from '@mui/icons-material/LocalShipping'; // Or use InventoryIcon
import { styled } from '@mui/material/styles';
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Close";
import UpdateIcon from "@mui/icons-material/Update";
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from "react-router-dom";
import OrderModalView from './OrderModalView'
import AssignModal from "./AssignContainer";
// import { ordersApi } from "../api"; // Adjust path as needed
import { api } from "../../api";
// import { fontWeight } from "html2canvas/dist/types/css/property-descriptors/font-weight";
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
    const [assigning, setAssigning] = useState(false);
    const [places, setPlaces] = useState([]);
    const [filters, setFilters] = useState({
        status: "",
        search: "",               // ← single search field instead of booking_ref
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
    const [tempOrderId, setTempOrderId] = useState(null);
    // New states for selection and assignment
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [openAssignModal, setOpenAssignModal] = useState(false);
    const [containers, setContainers] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState('');
    // New states for direct assign
    const [openDirectAssign, setOpenDirectAssign] = useState(false);
    const [directSelectedContainers, setDirectSelectedContainers] = useState([]);
    // States for status update
    const [openStatusDialog, setOpenStatusDialog] = useState(false);
    const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState(null);
    const [selectedReceiverForUpdate, setSelectedReceiverForUpdate] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    // ... your existing component logic (useState, handlers, etc.)
    // Handlers
    const handleStatusUpdate = (orderId, order) => {
        //  console.log('Updating status for order:', orderId);
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
        //  console.log('Selected status:', event.target.value);
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
            setLoading(true);
            // console.log('Updating status to:', selectedStatus, 'for receiver:', selectedReceiverForUpdate);      
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
            setLoading(false);
            setSnackbar({
                open: true,
                message: err.response?.data?.details || err.response?.message || 'Failed to update status',
                severity: 'error',
            });
            console.error('Error updating status:', err);
        }
        // setLoading(false);
        handleCloseStatusDialog();
    };


    // const handleFilterText = (e) => {
    //     const { name, value } = e.target;
    //     console.log("Filter change:", name, value);

    //     setFilters((prev) => ({ ...prev, [name]: value }));

    //     // Very important: reset to first page on every filter change
    //     setPage(0);
    // };

    // 3. Handler for status dropdown (also reset page)
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPage(0);
    };

    // 4. Fetch logic – clean & consistent
    const fetchOrders = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = {
                page: page + 1,           // 1-based paging (common convention)
                limit: rowsPerPage,
                includeContainer: true,
            };

            // ───────────────────────────────
            // Option A: General search field
            // ───────────────────────────────
            if (filters.search?.trim()) {
                params.search = filters.search.trim();     // backend should search multiple columns
                // or: params.q = filters.search.trim();
                // or: params.keyword = filters.search.trim();
            }

            // ───────────────────────────────
            // Option B: If you still want separate booking_ref / form_no
            // ───────────────────────────────
            // if (filters.booking_ref?.trim()) {
            //   params.booking_ref = filters.booking_ref.trim();
            // }

            if (filters.status) {
                params.status = filters.status;
            }
            console.log("parametors", params)
            const response = await api.get("/api/orders", { params });
            // ────────────────────────────────────────────────
            //  VERY IMPORTANT: Check what your backend actually returns
            // ────────────────────────────────────────────────
            console.log("API RESPONSE STRUCTURE:", response.data.pagination);

            const ordersData = response.data.data || response.data.orders || response.data || [];
            const totalCount = response.data.pagination.total || response.data.pagination.count || response.data.pagination.totalCount || 0;
            console.log('ordersssss dT ', ordersData)
            // Auto-populate logic (your existing code)
            const ordersWithAutoPopulate = await Promise.all(
                ordersData.map(async (order) => {
                    const ownerPrefix = order.sender_type === 'sender' ? 'sender' : 'receiver';
                    const ownerNameKey = `${ownerPrefix}_name`;
                    const selectedOwnerKey = 'selected_sender_owner';

                    if (order[selectedOwnerKey] && !order[ownerNameKey]?.trim()) {
                        try {
                            // console.log(`Auto-populating owner for order ${order.id} from ID: ${order[selectedOwnerKey]}`); // Debug log
                            const customerRes = await api.get(`/api/customers/${order[selectedOwnerKey]}`);
                            if (customerRes?.data) {
                                const customer = customerRes.data;
                                // Map customer fields to owner (adjust paths based on your API response structure)
                                const updatedOrder = { ...order };
                                updatedOrder[ownerNameKey] = customer.contact_name || customer.contact_persons?.[0]?.name || '';
                                updatedOrder[`${ownerPrefix}_contact`] = customer.primary_phone || customer.contact_persons?.[0]?.phone || '';
                                updatedOrder[`${ownerPrefix}_address`] = customer.zoho_notes || customer.billing_address || '';
                                updatedOrder[`${ownerPrefix}_email`] = customer.email || customer.contact_persons?.[0]?.email || '';
                                updatedOrder[`${ownerPrefix}_ref`] = customer.zoho_id || customer.ref || '';
                                updatedOrder[`${ownerPrefix}_remarks`] = customer.zoho_notes || customer.system_notes || '';
                                // console.log(`Auto-populated ${ownerNameKey} for order ${order.id}:`, updatedOrder[ownerNameKey]); // Debug log
                                return updatedOrder;
                            }
                        } catch (autoErr) {
                            console.error(`Auto-populate owner failed for order ${order.id}:`, autoErr);
                            // Fallback: Return original order unchanged
                        }
                    }
                    return order; // No change needed
                })
            );
            console.log('orders with auto populate', totalCount)
            setOrders(ordersWithAutoPopulate);
            setTotal(totalCount)
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
    useEffect(() => {
        fetchOptions();
        fetchOrders();
    }, [page, rowsPerPage, filters.status,]);


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
            // console.log('optionssss', placesRes, companiesRes, categoriesRes, subcategoriesRes, statusesRes);
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
        // console.log('Editing receiver:', receiver);
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
    const fetchContainers = async (payload) => {
        if (loadingContainers) return; // Prevent multiple calls
        setLoadingContainers(true);
        setAssignmentError(null);
        try {
            const response = await api.get('/api/containers', { params: payload });
            // console.log('Fetched containers:', response);
            // Filter for only available containers based on derived_status
            const availableContainers = (response.data.data || [])
            setContainers(availableContainers);
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
    const handleAssign = async (assignments) => {
        console.log('handleAssign called with assignments:', assignments);

        if (!assignments || Object.keys(assignments).length === 0) {
            setSnackbar({
                open: true,
                message: 'No valid assignments provided.',
                severity: 'warning',
            });
            return;
        }

        // Validation — only require qty > 0, weight > 0, containers
        let hasValid = false;
        Object.values(assignments).forEach(orderAssign => {
            Object.values(orderAssign).forEach(recAssign => {
                Object.values(recAssign).forEach(detail => {
                    const qty = parseInt(detail.qty, 10);
                    const assignedWeight = parseFloat(detail.totalAssignedWeight ?? detail.weight ?? 0);

                    if (
                        qty > 0 &&
                        assignedWeight > 0 &&
                        Array.isArray(detail.containers) &&
                        detail.containers.length > 0 &&
                        detail.orderItemId
                    ) {
                        hasValid = true;
                    }
                });
            });
        });

        if (!hasValid) {
            setSnackbar({
                open: true,
                message: 'Please assign qty > 0, weight > 0, containers, and orderItemId to at least one detail.',
                severity: 'warning',
            });
            return;
        }

        // Clean & normalize — trust user input for weight
        const cleanAssignments = {};
        Object.entries(assignments).forEach(([orderIdStr, orderAssign]) => {
            const cleanOrder = {};
            Object.entries(orderAssign).forEach(([recIdStr, recAssign]) => {
                const cleanRec = {};
                Object.entries(recAssign).forEach(([idxStr, detail]) => {
                    if (!detail.orderItemId) {
                        console.warn(`Skipping detail ${idxStr}: missing orderItemId`);
                        return;
                    }

                    const containers = (detail.containers || [])
                        .map(cid => parseInt(cid, 10))
                        .filter(cid => !isNaN(cid));

                    const qty = parseInt(detail.qty, 10);
                    const weightKg = parseFloat(detail.totalAssignedWeight ?? detail.weight ?? 0);

                    if (qty > 0 && weightKg > 0 && containers.length > 0) {
                        cleanRec[idxStr] = {
                            orderItemId: parseInt(detail.orderItemId),
                            qty,
                            totalAssignedWeight: weightKg,   // trust user input
                            containers,
                        };
                    }
                });

                if (Object.keys(cleanRec).length > 0) {
                    cleanOrder[recIdStr] = cleanRec;
                }
            });

            if (Object.keys(cleanOrder).length > 0) {
                cleanAssignments[orderIdStr] = cleanOrder;
            }
        });

        if (Object.keys(cleanAssignments).length === 0) {
            setSnackbar({
                open: true,
                message: 'No valid assignments after cleaning.',
                severity: 'warning',
            });
            return;
        }

        console.log('Sending payload (user-provided weights):', JSON.stringify(cleanAssignments, null, 2));

        try {
            // FIXED: Add { assignments: ... } wrapper
            const res = await api.post('/api/orders/assign-container', {
                assignments: cleanAssignments
            });

            const { success, message, updatedOrders, tracking } = res.data;

            if (success) {
                setSnackbar({
                    open: true,
                    message: message || `Assigned successfully (${tracking?.length || 0} receivers)`,
                    severity: 'success',
                });

                fetchContainers();
                fetchOrders();

                setSelectedOrders([]);
                setSelectedContainer('');
            } else {
                throw new Error(message || 'Assignment failed');
            }
        } catch (err) {
            console.error('Assignment error:', err);
            const msg = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to assign containers';
            setSnackbar({ open: true, message: msg, severity: 'error' });
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
                order.created_by || '', // From containers join
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



    // useEffect(() => {
    //     fetchOrders();
    // }, [page, rowsPerPage, filters]);
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
    // const handleFilterChange = (e) => {
    //     console.log('Filter change:', e.target.name, e.target.value);
    //     const { name, value } = e.target;
    //     setFilters((prev) => ({ ...prev, [name]: value }));
    //     setPage(0);
    // };

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
        'Ready for Loading',
        'Loaded Into container',
        'Shipment Processing',
        'Shipment In Transit',
        'Under Processing',
        'Arrived at Sort Facility',
        'Ready for Delivery',
        'Shipment Delivered'
    ];
    const getStatusColors = (status) => {
        // Extend your existing getStatusColors function to handle new statuses
        const colorMap = {
            'Ready for Loading': { bg: '#f3e5f5', text: '#7b1fa2' },
            'Loaded Into Container': { bg: '#e0f2f1', text: '#00695c' },
            'Shipment Processing': { bg: '#fff3e0', text: '#ef6c00' },
            'In Transit': { bg: '#e1f5fe', text: '#0277bd' },
            'Under Processing': { bg: '#fff3e0', text: '#f57c00' },
            'Arrived at Sort Facility': { bg: '#f1f8e9', text: '#689f38' },
            'Ready for Delivery': { bg: '#fce4ec', text: '#c2185b' },
            'Shipment Delivered': { bg: '#e8f5e8', text: '#2e7d32' },
            'Loaded': { bg: '#e8f5e8', text: '#2e7d32' },
            // 'Shipment Processing': { bg: '#fff3e0', text: '#ef6c00' },
            // 'Shipment In Transit': { bg: '#e1f5fe', text: '#0277bd' },
            'Assigned to Job': { bg: '#fff3e0', text: '#f57c00' },
            'Arrived at Sort Facility': { bg: '#f1f8e9', text: '#689f38' },
            'Ready for Delivery': { bg: '#fce4ec', text: '#c2185b' },
            'Shipment Delivered': { bg: '#e8f5e8', text: '#2e7d32' },
            // Fallback for unknown
            default: { bg: '#f5f5f5', text: '#666' }
        };
        return colorMap[status] || colorMap.default;
    };
    const StyledTooltip = styled(Tooltip)(({ theme }) => ({
        [`& .MuiTooltip-tooltip`]: {
            // backgroundColor: theme.palette.common.white, 
            // color: theme.palette.text.primary,
            // boxShadow: theme.shadows[3],
            borderRadius: theme.shape.borderRadius,
            fontSize: theme.typography.body2.fontSize,
            width: 600,
            // border: `1px solid ${theme.palette.divider}`,
        },
        [`& .MuiTooltip-arrow`]: {
            // color: theme.palette.common.white,
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

    const handleDirectAssign = async () => {
        if (!directSelectedContainers.length || !selectedOrders.length) {
            setSnackbar({
                open: true,
                message: 'Please select at least one container and one order.',
                severity: 'warning',
            });
            return;
        }

        setAssigning(true);

        try {
            // Filter only truly available containers
            const availableContainers = directSelectedContainers.filter(c => {
                const status = (c.derived_status || c.status || '').trim();
                return status === 'Available' || status === 'Assigned to Job';
            });

            if (availableContainers.length === 0) {
                const unavailable = [...new Set(
                    directSelectedContainers
                        .filter(c => !['Available', 'Assigned to Job'].includes((c.derived_status || c.status || '').trim()))
                        .map(c => c.derived_status || c.status || 'Unknown')
                )].join(', ');

                throw new Error(
                    `No available containers selected. ` +
                    `Only "Available" or "Assigned to Job" allowed. ` +
                    `(Invalid statuses: ${unavailable || 'none'})`
                );
            }

            // Build targets: receivers + their details with remaining quantity
            const targets = [];
            for (const orderId of selectedOrders) {
                const order = orders.find(o => o.id === orderId);
                if (!order?.receivers?.length) continue;

                for (const receiver of order.receivers) {
                    const receiverId = receiver.id;
                    if (!receiverId) continue;

                    const details = receiver.shippingdetails || receiver.shippingDetails || [];
                    details.forEach((detail, idx) => {
                        const remaining = parseInt(detail.remainingItems || detail.remaining || 0, 10);
                        if (remaining <= 0) return;

                        targets.push({
                            orderId: String(orderId),
                            receiverId: String(receiverId),
                            detailIndex: String(idx),
                            remainingQty: remaining,
                        });
                    });
                }
            }

            if (targets.length === 0) {
                throw new Error('No receivers with remaining quantity found in selected orders');
            }

            // Round-robin: assign containers to targets
            const assignmentList = [];

            availableContainers.forEach((cont, idx) => {
                const target = targets[idx % targets.length];
                const containerId = cont.cid || cont.container_number;

                if (!containerId) return;

                assignmentList.push({
                    orderId: target.orderId,
                    receiverId: target.receiverId,
                    detailIndex: target.detailIndex,
                    containerId: String(containerId),
                    qty: target.remainingQty,           // send full remaining — backend can adjust if needed
                });
            });

            if (assignmentList.length === 0) {
                throw new Error('No valid assignments could be created');
            }

            const payload = {
                assignments: assignmentList,
                requestedOrderIds: selectedOrders.map(String),
                totalContainers: availableContainers.length,
            };

            console.log('Sending batch assignment payload:', JSON.stringify(payload, null, 2));

            // Adjust endpoint name/path to match your routes
            const response = await api.post('/api/orders/assign-containers-batch', payload);

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Server rejected assignment');
            }

            const { updatedCount, updatedOrders = [], skipped = [] } = response.data;

            const msg = `Assigned ${availableContainers.length} containers to ${updatedCount || 'multiple'} receivers across ${updatedOrders.length || selectedOrders.length} orders.`;

            setSnackbar({ open: true, message: msg, severity: 'success' });

            if (skipped?.length > 0) {
                console.warn('Skipped assignments:', skipped);
                setSnackbar({
                    open: true,
                    message: `${skipped.length} assignments skipped (already fulfilled / unavailable).`,
                    severity: 'warning',
                });
            }

            // Refresh data
            fetchContainers();
            fetchOrders();

        } catch (err) {
            console.error('Direct batch assign error:', err);

            let msg = err.message || 'Failed to assign containers';
            if (err.response?.data) {
                const { error, details, message, skipped } = err.response.data;
                msg = details || message || error || msg;
                if (skipped?.length) msg += ` (${skipped.length} skipped)`;
            }

            setSnackbar({
                open: true,
                message: msg,
                severity: 'error',
            });
        } finally {
            setAssigning(false);
            setOpenDirectAssign(false);
            setDirectSelectedContainers([]);
        }
    };
    const handleOpenDirectAssign = async (tempData) => {
        setLoadingContainers(true);
        setAssignmentError(null);

        console.log('tempData received (raw):', tempData);
        console.log('tempData type:', typeof tempData, Array.isArray(tempData) ? 'array' : 'not array');

        let orderIdRaw;

        // Case 1: tempData is an array → take first element (your current case)
        if (Array.isArray(tempData) && tempData.length > 0) {
            orderIdRaw = tempData[0]; // e.g. 110 from [110]
            console.log('Detected array input → using first element:', orderIdRaw);
        }
        // Case 2: tempData is a plain number/string
        else if (typeof tempData === 'number' || (typeof tempData === 'string' && !isNaN(Number(tempData)))) {
            orderIdRaw = tempData;
            console.log('Detected direct number/string input:', orderIdRaw);
        }
        // Case 3: tempData is object → fallback to your original properties
        else if (tempData && typeof tempData === 'object') {
            orderIdRaw =
                tempData?.orderId ||
                tempData?.id ||
                tempData?.order_id ||
                tempData?.OrderId ||
                tempData?.orderID;
            console.log('Detected object input → extracted:', orderIdRaw);
        }

        // Final validation
        const orderId = Number(orderIdRaw);

        if (!orderIdRaw || isNaN(orderId) || orderId <= 0) {
            console.error('No valid orderId could be extracted from tempData:', {
                rawInput: tempData,
                extractedRaw: orderIdRaw,
                converted: orderId
            });

            setSnackbar({
                open: true,
                message: 'Cannot open assignment dialog — no valid order selected',
                severity: 'error',
            });
            setLoadingContainers(false);
            return;
        }

        setTempOrderId(orderId);
        console.log('Successfully set tempOrderId to:', orderId);

        // Proceed with fetching containers...
        try {
            const response = await api.get('/api/containers', {
                params: {
                    container_number: '',
                    container_size: '',
                    container_type: '',
                    owner_type: '',
                    status: '',
                    location: '',
                    page: 1,
                    limit: 50,
                },
            });

            console.log('Fetched containers:', response.data);

            const allContainers = response.data.data || [];
            const availableContainers = allContainers.filter(c => {
                const status = (c.derived_status || c.status || '').trim();
                return status === 'Available' || status === 'Assigned to Job';
            });

            setContainers(availableContainers);

        } catch (err) {
            console.error("Error fetching containers:", err);
            setAssignmentError('Failed to fetch containers.');
            setSnackbar({ open: true, message: 'Failed to fetch containers', severity: 'error' });
        } finally {
            setLoadingContainers(false);
            setOpenDirectAssign(true);
        }
    };
    const handleCloseDirectAssign = () => {
        setOpenDirectAssign(false);
        setDirectSelectedContainers([]);
    };


    const handleAssignContainerAll = async () => {
        if (!selectedContainer) {
            setSnackbar({ open: true, message: 'Please select a container first', severity: 'warning' });
            return;
        }
        console.log('Assigning container to orderId:', selectedContainer, 'with tempOrderId:', tempOrderId);

        const orderId = Number(tempOrderId);
        console.log('Assigning container to orderId:', orderId, 'with tempOrderId:', tempOrderId);
        if (isNaN(orderId) || orderId <= 0) {
            console.error('Invalid tempOrderId before send:', { tempOrderId, converted: orderId });
            setSnackbar({
                open: true,
                message: 'No valid order selected. Please close and reopen the dialog.',
                severity: 'error',
            });
            return;
        }

        setAssigning(true);

        try {
            const payload = {
                orderId: orderId,
                containerId: selectedContainer.cid || selectedContainer.container_number,
            };

            console.log('SENDING ASSIGNMENT PAYLOAD:', JSON.stringify(payload, null, 2));

            const response = await api.post('/api/orders/assign-one-container-multi-receivers', payload);

            setSnackbar({
                open: true,
                message: `Container assigned successfully to order #${orderId}`,
                severity: 'success',
            });

            // Refresh data
            fetchOrders?.();           // if you have this function
            fetchReceivers?.(orderId); // if you have per-order fetch

            setOpenDirectAssign(false);
            setSelectedContainer(null);
            setTempOrderId(null);

        } catch (err) {
            console.error('Assignment request failed:', err);

            let msg = 'Failed to assign container';
            if (err.response?.data?.details) {
                msg = err.response.data.details; // e.g. "Valid orderId is required"
            } else if (err.response?.data?.error) {
                msg = err.response.data.error;
            } else if (err.message) {
                msg = err.message;
            }

            setSnackbar({ open: true, message: msg, severity: 'error' });
        } finally {
            setAssigning(false);
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
        console.log('Parsing receivers:', receivers);
        if (!receivers || !Array.isArray(receivers)) return [];
        // return receivers.map(rec => ({
        return receivers
        // }));
    };

    const parseSummaryToListTwo = (receivers, order) => {
        if (!receivers || !Array.isArray(receivers)) return [];

        const containerList = [];

        receivers.forEach(rec => {
            if (rec.shippingdetails && Array.isArray(rec.shippingdetails)) {
                rec.shippingdetails.forEach(detail => {
                    if (detail.containerDetails && Array.isArray(detail.containerDetails)) {
                        detail.containerDetails.forEach(containerDetail => {
                            if (containerDetail.container && containerDetail.status) {
                                containerList.push({
                                    primary: `${containerDetail.container.container_number} (${rec.receiver_name || 'Unnamed Receiver'})`,
                                    status: containerDetail.status,
                                    receiverId: rec.id,
                                    shippingDetailId: detail.id,
                                    containerNumber: containerDetail.container.container_number,
                                    // Optional: Add more fields if needed, e.g., total_number: containerDetail.total_number
                                });
                            }
                        });
                    }
                });
            }
        });

        // Optional: Deduplicate by container_number if needed
        // const uniqueContainers = containerList.filter((item, index, self) =>
        //     index === self.findIndex(t => t.containerNumber === item.containerNumber)
        // );

        return containerList;
    };

    const PrettyList = ({ receivers, title }) => {
        console.log('receiversss', receivers)
        return (
            <Card
                variant="outlined"
                sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: '#fafafa',
                    width: 600,
                    boxShadow: 'none',
                    // '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Title */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            pb: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f58220' }}>
                            {title}
                        </Typography>
                        <Chip
                            label={`(${receivers?.length || 0})`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20, '& .MuiChip-label': { px: 0.5 } }}
                        />
                    </Box>

                    {/* Receivers List */}
                    <Stack spacing={1} sx={{ maxHeight: 'auto', overflow: 'auto' }}>
                        {receivers?.length > 0 ? (
                            receivers.map((receiver, rIdx) => (
                                <Card
                                    key={rIdx}
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 1.5,
                                        border: '1px solid',
                                        borderColor: 'grey.200',
                                        backgroundColor: '#fff',
                                        boxShadow: 'none',
                                        //   transition: 'all 0.2s ease',
                                        //   '&:hover': { boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderColor: 'primary.light' },
                                    }}
                                >
                                    {/* Receiver Info */}
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight="medium" noWrap>
                                                {receiver.receivername || 'Unnamed Receiver'}
                                            </Typography>

                                        </Box>
                                        <StatusChip status={receiver.status} size="small" />
                                    </Stack>

                                    <Divider sx={{ mt: 1 }} />

                                    {/* Shipping Details */}
                                    {receiver.shippingdetails?.length > 0 ? (
                                        receiver.shippingdetails.map((item, sIdx) => (
                                            <Box key={sIdx} sx={{ mt: 1, pl: 1 }}>
                                                <Box sx={{ flexDirection: "column", }}>


                                                    <Typography variant="body2" fontWeight="bold">
                                                        {item.category || 'Unknown Category'} - {item.subcategory || 'Unknown Subcategory'} ({item.type || 'Unknown Type'})  Total: {item.totalNumber ?? 0}, Weight: {item.weight ?? 0}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Qty Total Assigned: {Math.max(0, parseInt(item.totalNumber || 0) - parseInt(item.remainingItems || 0)).toLocaleString()} /
                                                        Remaining Items: {parseInt(item.remainingItems || 0).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                                {/* Container Details */}
                                                {item.containerDetails?.length > 0 ? (
                                                    <Stack direction="row" justifyContent={"space-between"} alignItems={"center"} display={'flex'} spacing={1} sx={{ justifyContent: 'space-between', flexWrap: 'wrap', }}>
                                                        {item.containerDetails.map((c, cIdx) => (
                                                            <div style={{ marginTop: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'center', flex: 1, display: 'flex' }}>
                                                                <Chip
                                                                    key={cIdx}
                                                                    label={`${c.container.container_number} - ${c.assign_total_box} boxes (${c.assign_weight} kg)`}
                                                                    size="large"
                                                                    color="secondary"
                                                                    variant="outlined"
                                                                    sx={{ marginBottom: 2 }}
                                                                    spacing={1}

                                                                />
                                                                <StatusChip status={c.status} size="small" />



                                                                {/* <Divider /> */}
                                                            </div>
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        No containers assigned
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))
                                    ) : (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                            No shipping details
                                        </Typography>
                                    )}

                                    {/* Drop Off Details */}
                                    {receiver.drop_off_details?.length > 0 && (
                                        <Box sx={{ mt: 1, pl: 1 }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                Drop Off Details:
                                            </Typography>
                                            {receiver.drop_off_details.map((dod, dIdx) => (
                                                <Typography variant="caption" color="text.secondary" key={dIdx} display="block">
                                                    {dod.drop_method} - {dod.dropoff_name} ({dod.drop_off_mobile}) on {dod.drop_date}
                                                </Typography>
                                            ))}
                                        </Box>
                                    )}
                                </Card>
                            ))
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, color: 'text.secondary' }}>
                                <EmojiEventsIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    No receivers available
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>
            </Card>
        );
    };

    // Combine both receivers and container details into one tooltip content
    const CombinedTooltip = ({ order }) => {
        // You can merge both datasets or just pass receivers since shippingdetails contains containers
        return <PrettyList receivers={order.receivers} title="Receivers & Containers" />;
    };

    // Updated parse function to extract unique container numbers from the full order structure
    // Assumes 'order' is the full JSON object provided (e.g., { id: 77, receivers: [...] })
    const parseContainersToList = (order) => {
        if (!order || !order.receivers || order.receivers.length === 0) {
            return [];
        }

        const containerSet = new Set(); // Use Set for uniqueness
        // console.log('Parsing containers from order:', order);   
        order.receivers.forEach((receiver) => {
            // console.log('Processing receiver:', receiver);
            if (receiver.shippingdetails && Array.isArray(receiver.shippingdetails)) {
                receiver.shippingdetails.forEach((shippingDetail) => {
                    if (shippingDetail.containerDetails && Array.isArray(shippingDetail.containerDetails)) {
                        shippingDetail.containerDetails.forEach((containerDetail) => {
                            if (containerDetail.container && containerDetail.container.container_number) {
                                containerSet.add(containerDetail.container.container_number.trim());
                            } else if (containerDetail.container_number) {
                                // Handle cases where container_number is directly on containerDetail.container
                                containerSet.add(containerDetail.container_number.trim());
                            }
                        });
                    }
                });
            }
        });

        // Convert to array of { primary: containerNumber } objects
        return Array.from(containerSet).map((num) => ({ primary: num }));
    };


    // Enhanced PrettyContainersList remains the same, but now feed it the parsed list
    const PrettyContainersList = ({ items, title }) => {
        console.log('Containers items:', items);
        return (
            <Box sx={{ p: 1, maxWidth: 280 }}>
                <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 1, display: 'block' }}>
                    {title} ({items.length})
                </Typography>
                <Stack direction="row" flexWrap="wrap" spacing={0.75} useFlexGap>
                    {items.length > 0 ? (
                        items.map((item, index) => (
                            console.log('statussss', item),

                            <Chip
                                key={index}
                                label={item.primary}
                                icon={<CargoIcon fontSize="small" />}
                                size="small"
                                variant="outlined"
                                sx={{
                                    borderRadius: 1.5,
                                    borderColor: 'divider',
                                    backgroundColor: '#0d6c6a',
                                    '& .MuiChip-icon': { color: 'secondary.main' },
                                    fontSize: '0.75rem',
                                    height: 24,
                                    '&:hover': { backgroundColor: '#e9ecef' }
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
                                backgroundColor: '#f8f9fa',
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                height: 24,
                            }}
                        />
                    )}
                </Stack>
            </Box>
        );
    };

    // Example usage in your component (assuming 'order' is the JSON data):
    // const containerList = parseContainersToList(order);
    // <PrettyContainersList items={containerList} title="Containers" />
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
        fontSize: '12px',
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

    const handleFilterText = (e) => {
        setFilters((prev) => ({
            ...prev,
            search: e.target.value,
        }));
    };

    const onSearchClick = () => {
        if (filters.search?.trim()) {
            fetchOrders(filters.search.trim());
        }
    };
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
                        {/* New Direct Assign Button */}
                        <Button
                            variant="contained"
                            disabled={numSelected === 0 || loadingContainers}
                            onClick={() => handleOpenDirectAssign(selectedOrders)}
                            startIcon={<AssignmentIcon />}
                            sx={{
                                borderRadius: 2,
                                backgroundColor: "#f58220",
                                color: "#fff",
                                "&:hover": { backgroundColor: "#f58220" },
                            }}
                        >
                            Direct Assign Containers ({numSelected})
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
                    {/* General search input */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                            label="Search order By Form No"
                            placeholder="Enter Form No"
                            type="search"
                            name="search"
                            value={filters.search || ""}
                            onChange={(e) => {
                                setFilters((prev) => ({
                                    ...prev,
                                    search: e.target.value,
                                }));
                            }}
                            size="small"
                            sx={{ width: 320 }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (filters.search?.trim()) {
                                        fetchOrders(filters.search.trim());
                                    } else {
                                        setFilters((prev) => ({ ...prev, search: "" }));
                                        fetchOrders("");
                                    }
                                }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => {
                                                if (filters.search?.trim()) {
                                                    fetchOrders(filters.search.trim());
                                                } else {
                                                    setFilters((prev) => ({ ...prev, search: "" }));
                                                    fetchOrders();
                                                }
                                            }}
                                            // edge="end"
                                            sx={{
                                                color: "primary.main", // always looks clickable
                                            }}
                                        >
                                            {filters.search?.trim() ? <SearchIcon /> : <SearchIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
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

                {/* Table - FIXED: No whitespace between <TableHead> and <TableBody> */}
                <TableContainer sx={{
                    borderRadius: 2,
                    overflow: 'scroll',
                    boxShadow: 2,
                    // maxHeight: 600,  
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
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#0d6c6a' }}>
                                <StyledTableHeadCell padding="checkbox" sx={{ bgcolor: '#0d6c6a', color: '#fff' }}>
                                    {/*     <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={handleSelectAllClick}
                    /> */}
                                </StyledTableHeadCell>
                                {[
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="created">Created At</StyledTableHeadCell>,
                                  
                                  <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="ref">Booking Ref</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="form_no">Form No</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff', width: 200 }} key="receivers">Receivers & Containers</StyledTableHeadCell>, // Multiple receivers with status

                                    // <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="loading">POL</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="dest">POD</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="sender">Sender</StyledTableHeadCell>,
                                    // <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff', width: 100 }} key="containers"></StyledTableHeadCell>,
                                    // New column for Products (weight, category, item products, total number)
                                    // <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="created_by">Created By</StyledTableHeadCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontSize: 10 }} key="total_items">Total Items & Weight</StyledTableHeadCell>,
                                    // <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff',  }} key="total_weight">Weight</StyledTabl  eHeadCell>,

                                    // <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="updated_at">Updated At</StyledTableHeadCell>,
                                    // <TableCell key="assoc">Associated Container</TableCell>,
                                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="actions">Actions</StyledTableHeadCell>
                                ]}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => {
                                // console.log('Rendering order: conatiners', order.receivers);
                                const isItemSelected = isSelected(order.id);
                                // renderReceivers( order.receivers);
                                const containersList = order.receivers.forEach((receiver) => {
                                    // console.log('Processing receiver: connnnnnnntainerssss', receiver);
                                    if (receiver.shippingdetails && Array.isArray(receiver.shippingdetails)) {
                                        receiver.shippingdetails.forEach((shippingDetail) => {
                                            if (shippingDetail.containerDetails && Array.isArray(shippingDetail.containerDetails)) {
                                                shippingDetail.containerDetails.forEach((containerDetail) => {
                                                    if (containerDetail && containerDetail) {
                                                        // console.log('Found container detail:', containerDetail.container);
                                                        // return containersList.push({primary: containerDetail.container.container_number.trim() } );
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                                const status = order.overall_status || order.status || 'Created';
                                const colors = getStatusColors(status);
                                console.log('Ren container list:', containersList);
                                // Updated: Compute products summary from receivers[].shippingDetails (corrected field names to snake_case)
                                const productsSummary = order.receivers.flatMap(receiver =>
                                    (receiver.shippingdetails || []).map(detail => ({
                                        category: detail.category || 'Unknown',
                                        subcategory: detail.subcategory || '',
                                        type: detail.type || 'Package', // Item type (e.g., "Package")
                                        weight: parseFloat(detail.weight || 0),
                                        total_number: parseInt(detail.totalNumber || 0),
                                        itemRef: detail.itemRef || '',
                                        shippingDetailStatus: detail.status || '',
                                        // containerName: detail.containerDetails || []
                                    }))
                                );
                                const totalItems = productsSummary.reduce((sum, p) => sum + p.total_number, 0);
                                const totalWeight = productsSummary.reduce((sum, p) => sum + p.weight, 0);
                                const categoryList = [...new Set(productsSummary.map(p => p.category))].join(', '); // Unique categories

                                return (
                                    <StyledTableRow
                                        key={order.id}
                                        onClick={() => handleClick(order.id)}
                                        role="checkbox"
                                        aria-checked={isItemSelected}
                                        selected={isItemSelected}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <StyledTableCell padding="checkbox">
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
                                        </StyledTableCell>
                         
                                        <StyledTableCell>{new Date(order.created_at).toLocaleDateString()}</StyledTableCell>
                                        <StyledTableCell>{order.booking_ref}</StyledTableCell>
                                        <StyledTableCell>{order?.rgl_booking_number}</StyledTableCell>
                                          <TableCell colSpan={1.5}> { /* optional: merge visually */}
                                            <StyledTooltip
                                                title={<CombinedTooltip order={order} />}
                                                arrow
                                                placement="bottom-start"
                                                PopperProps={{
                                                    sx: {
                                                        '& .MuiTooltip-tooltip': {
                                                            border: '1px solid #e0e0e0',
                                                            background: "transparent",
                                                            width: 600, // set your preferred width
                                                            //   maxHeight: 400,
                                                            //   overflow: 'auto',
                                                        },
                                                    },
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    noWrap
                                                    sx={{ maxWidth: 150, cursor: 'help', fontWeight: 'medium' }}
                                                >
                                                    {order.receivers.length > 0
                                                        ? <>
                                                            {order.receivers.length > 1 && (
                                                                <sup
                                                                    style={{
                                                                        padding: 4,
                                                                        borderRadius: 50,
                                                                        float: 'left',
                                                                        background: '#00695c',
                                                                        color: '#fff',
                                                                    }}
                                                                >
                                                                    ({order.receivers.length})
                                                                </sup>
                                                            )}
                                                            <span style={{ padding: 0 }}>
                                                                {order.receivers.map(r => r.receivername || '')}
                                                            </span>
                                                        </>
                                                        : '-'}
                                                </Typography>
                                            </StyledTooltip>
                                        </TableCell>
                                        {/* <StyledTableCell>{getPlaceName(order?.place_of_loading)}</StyledTableCell> */}
                                        <StyledTableCell>{getPlaceName(order.place_of_delivery)}</StyledTableCell>
                                        <StyledTableCell colSpan={1.5}>{order.sender_name?.substring(0, 20)}</StyledTableCell>

                                    


                                        {/* <StyledTableCell>{order.created_by.substring(10, 0) || ''}...</StyledTableCell> */}
                                        <TableCell sx={{flexWrap:'wrap',display:'flex',p:5}}>
                                            <StyledTableCell sx={{paddingLeft:0,fontWeight:'bold',color:'#000',border:0}}>{totalItems.toFixed()} Packages</StyledTableCell>
                                        <StyledTableCell sx={{paddingLeft:0,fontWeight:'bold',color:'#555',border:0}}>{totalWeight.toFixed()} kg</StyledTableCell>
                                       </TableCell>
                                        {/* <StyledTableCell sx={{bgcolor:"#555",color:"#fff"}} >{}</StyledTableCell> */}
                                        <StyledTableCell>
                                            <Stack direction="row" spacing={0}>
                                               
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
                {/* Pagination (unchanged, but uses fixed total) */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50, 75, 100, 125]}
                    component="div"
                    count={total}                     // ← must be correct number!
                    rowsPerPage={rowsPerPage}
                    page={page}                       // 0-based in MUI TablePagination
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Rows per page:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
                    }
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
                // aria-label="Consignments table pagination"
                />
                <OrderModalView
                    openModal={openModal}
                    handleCloseModal={handleCloseModal}
                    selectedOrder={selectedOrder}
                    modalLoading={modalLoading}
                    modalError={modalError}
                    places={places}
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
                    fetchOrders={fetchOrders}

                />
                {/* New Direct Assign Dialog */}
                <Dialog
                    open={openDirectAssign}
                    onClose={handleCloseDirectAssign}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Select Containers for All Selected Orders ({numSelected})</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Choose one or more containers to assign to all shipping details of the selected orders (full quantity).
                        </Typography>
                        {loadingContainers ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : (
                            <Autocomplete
                                multiple
                                value={directSelectedContainers}
                                onChange={(event, newValue) => setDirectSelectedContainers(newValue)}
                                options={containers}
                                getOptionLabel={(option) => option.container_number || 'Unknown'}
                                isOptionEqualToValue={(option, value) => option.cid === value.cid}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Containers"
                                        placeholder="Search and select containers..."
                                        fullWidth
                                    />
                                )}
                                sx={{ mt: 1 }}
                            />
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDirectAssign}>Cancel</Button>
                        <Button
                            onClick={handleDirectAssign}
                            variant="contained"
                            disabled={!directSelectedContainers.length || loadingContainers}
                            startIcon={<AssignmentIcon />}
                        >
                            Assign to All ({directSelectedContainers.length})
                        </Button>
                    </DialogActions>
                </Dialog>
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
                        <Button onClick={handleConfirmStatusUpdate} variant="contained" >
                            Update & Notify
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </>
    );
};
export default OrdersList;  
