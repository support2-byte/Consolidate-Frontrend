
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
import {Autocomplete} from "@mui/material";
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
const fetchOrders = async () => {
    // console.log('Fetching orders with filters:', filters, 'page:', page, 'rowsPerPage:', rowsPerPage);
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
        
        // NEW: Auto-populate owner fields for each order if selected_sender_owner exists but name is empty
        const ordersWithAutoPopulate = await Promise.all(
            (response.data.data || []).map(async (order) => {
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
        
        setOrders(ordersWithAutoPopulate);
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

    // Validate: Ensure at least one order and one detail with qty > 0 and containers
    let hasValidAssignment = false;
    for (const orderAssign of Object.values(assignments)) {
        for (const recAssign of Object.values(orderAssign)) {
            for (const detailAssign of Object.values(recAssign)) {
                if (detailAssign.qty > 0 && Array.isArray(detailAssign.containers) && detailAssign.containers.length > 0) {
                    hasValidAssignment = true;
                    break;
                }
            }
            if (hasValidAssignment) break;
        }
        if (hasValidAssignment) break;
    }

    if (!hasValidAssignment) {
        setSnackbar({
            open: true,
            message: 'Please specify quantities and containers for at least one detail.',
            severity: 'warning',
        });
        return;
    }

    try {
        // FIXED: Send assignments directly (no wrapping key)
        const res = await api.post('/api/orders/assign-container', assignments);  // <-- Changed: assignments, not { assignments }

        const { success, message, updatedOrders, tracking } = res.data;
        if (success) {
            setSnackbar({
                open: true,
                message: message || `Successfully assigned to ${tracking?.length || 0} receivers across ${Object.keys(assignments).length} orders.`,
                severity: 'success',
            });
            console.log('Assignment response:', res.data);

            // Refresh data
            fetchContainers(); // Refresh available containers
           
            fetchOrders(); // Refresh full orders list
           
            // setOpenAssignModal(false);
            setSelectedOrders([]); // Clear order selection
            setSelectedContainer(''); // Clear if single-container mode, but deprecated

            // Optional: Update local orders state with updatedOrders if needed
            // if (updatedOrders && onRefreshOrders) {
            //     onRefreshOrders(updatedOrders);
            // }

        } else {
            throw new Error(message || 'Assignment failed');
        }
    } catch (err) {
        console.error('Error assigning containers:', err);
        const errorMsg = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to assign containers';
        setSnackbar({
            open: true,
            message: errorMsg,
            severity: 'error',
        });
    }
};
// Updated handleDirectAssign to build batch assignments and use the main endpoint for multiple orders/receivers
const handleDirectAssign = async () => {
    if (!directSelectedContainers.length || !selectedOrders.length) {
        setSnackbar({
            open: true,
            message: 'Please select at least one container and one order.',
            severity: 'warning',
        });
        return;
    }

    try {
        // Log selected containers for debugging
        // console.log('Selected containers before filtering:', directSelectedContainers.map(c => ({ cid: c.cid, container_number: c.container_number, derived_status: c.derived_status })));

        // Filter to only available containers based on derived_status
        const availableContainers = directSelectedContainers.filter(c => c.derived_status === 'Available' || 'Assigned to job');
        // console.log('Available containers after filtering:', availableContainers.map(c => ({ cid: c.cid, container_number: c.container_number })));

        if (!availableContainers.length) {
            // Provide more details on why filtered
            const unavailable = directSelectedContainers.filter(c => c.derived_status !== 'Available'|| 'Assigned to job');
            const reasons = [...new Set(unavailable.map(c => c.derived_status))].join(', ');
            throw new Error(`No available containers selected. Skipped due to statuses: ${reasons}. Please select containers with status "Available".`);
        }

        // Collect all eligible targets (receivers with positive remaining items in first detail)
        const allTargets = [];
        for (const orderId of selectedOrders) {
            const order = orders.find(o => o.id === orderId);
            if (!order || !order.receivers?.length) continue;

            for (const receiver of order.receivers) {
                const receiverId = receiver.id;
                if (!receiverId) continue;

                // Handle possible casing issues in property name
                const orderItems = receiver.shippingdetails || receiver.shippingDetails || [];
                if (orderItems.length === 0) continue;

                const firstDetail = orderItems[0];
                const remaining = parseInt(firstDetail.remainingItems) || 0;
                if (remaining <= 0) continue;

                allTargets.push({
                    orderId: orderId.toString(),
                    receiverId: receiverId.toString(),
                    detailIndex: '0',
                    remaining
                });
            }
        }

        if (allTargets.length === 0) {
            throw new Error('No valid receivers with remaining items found');
        }

        // Build assignments by distributing containers round-robin to targets
        const assignments = {};
        const assignedReceivers = new Set();

        for (let i = 0; i < availableContainers.length; i++) {
            const cont = availableContainers[i];
            const contId = cont.cid || cont.container_number;
            if (!contId) continue;

            const target = allTargets[i % allTargets.length];
            assignedReceivers.add(target.receiverId);

            if (!assignments[target.orderId]) {
                assignments[target.orderId] = {};
            }
            if (!assignments[target.orderId][target.receiverId]) {
                assignments[target.orderId][target.receiverId] = {};
            }
            const detailKey = target.detailIndex;
            if (!assignments[target.orderId][target.receiverId][detailKey]) {
                assignments[target.orderId][target.receiverId][detailKey] = {
                    qty: target.remaining,
                    containers: []
                };
            }
            assignments[target.orderId][target.receiverId][detailKey].containers.push(contId);
        }

        if (Object.keys(assignments).length === 0) {
            throw new Error('No valid assignments could be built');
        }

        console.log('Built assignments for direct batch:', assignments);

        // Call the batch endpoint with assignments - adjusted route to avoid :id conflict
        const response = await api.post('/api/orders/assign-containers-to-orders', {
            assignments,
            order_ids: selectedOrders // Optional, for fallback
        });

        if (response.data.success) {
            setSnackbar({
                open: true,
                message: `Successfully assigned ${availableContainers.length} containers to ${assignedReceivers.size} receivers across ${selectedOrders.length} orders.`,
                severity: 'success',
            });
            fetchContainers(); // Refresh available containers
            fetchOrders(); // Refresh orders list
        } else {
            // Handle backend-specific errors like skipped containers
            if (response.data.error && response.data.skipped) {
                throw new Error(`${response.data.error}. Skipped containers: ${response.data.skipped}`);
            }
            throw new Error(response.data.message || 'Assignment failed');
        }
    } catch (err) {
        console.error('Error in direct assign:', err);
        setSnackbar({
            open: true,
            message: err.message || 'Failed to assign containers',
            severity: 'error',
        });
    } finally {
        setOpenDirectAssign(false);
        setDirectSelectedContainers([]);
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
    

    const handleOpenDirectAssign =async  (tempData) => {

    try {
        const response = await api.get('/api/containers?container_number=&container_size=&container_type=&owner_type=&status=&location=&page=1&limit=50');
        console.log('Fetched containers:', response);
        // Filter for only available containers based on derived_status
        // const availableContainers = (response.data.data || []).filter(container => 
        //     container.derived_status === 'Available' || container.status === 1 // Adjust based on your API response structure
        // );
        setContainers(response.data.data || [] );
    } catch (err) {
        console.error("Error fetching containers:", err);
        setAssignmentError('Failed to fetch containers. Please check the backend query for table "cm".');
        setSnackbar({ open: true, message: 'Failed to fetch containers', severity: 'error' });
    } finally {
        setLoadingContainers(false);
    }

        // if (!containers.length) {
            // fetchContainers(payload);
        // }
        setOpenDirectAssign(true);
    };

    const handleCloseDirectAssign = () => {
        setOpenDirectAssign(false);
        setDirectSelectedContainers([]);
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
        'Loaded Into container': { bg: '#e0f2f1', text: '#00695c' },
        'Shipment Processing': { bg: '#fff3e0', text: '#ef6c00' },
        'Shipment In Transit': { bg: '#e1f5fe', text: '#0277bd' },
        'Under Processing': { bg: '#fff3e0', text: '#f57c00' },
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
            eta: rec.eta ? `ETA: ${new Date(rec.eta).toLocaleDateString()}` : null,
            receivers
        }));
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

    // Enhanced PrettyList: Modern vertical card-based layout for receivers with improved alignment, avatars, and status badges
    const PrettyList = ({ items, title }) => (
        console.log('PrettyListPrettyListPrettyList',title),
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
                <Stack spacing={1} sx={{ maxHeight: 'auto', overflow: 'auto', }}>
                    
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
                                    // overflow:"scroll",
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
                                    {/* <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: 'primary.main',
                                            fontSize: '1rem',
                                            flexShrink: 0 // Prevent shrinking
                                        }}
                                    >
                                        {item.primary ? item.primary.charAt(0).toUpperCase() : '?'}
                                    </Avatar> */}
                                    {/* Content - Flexible box for text wrapping */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight="medium"
                                            noWrap
                                            sx={{
                                                color: 'text.primary',
                                                // overflow: 'hidden',
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
                                                    backgroundColor: '#00695c',
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
                                        <Box sx={{ ml: 'auto' }}>
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

                                      
                                       
                                    </Box>
                                    )}
                                 
                                </Stack>
                                <Divider sx={{ mt: 1 }} />
                                <Box sx={{  }}>
                                           <Typography
                                       variant="body2"
                                            fontWeight="medium"
                                        sx={{
                                            color: '#000',
                                            display: 'block',
                                            mt: 1,   
                                            marginRight: 10
                                        }}
                                    >
                                        {item.eta}
                                    </Typography>
                                </Box>
                           
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
// Updated parse function to extract unique container numbers from the full order structure
// Assumes 'order' is the full JSON object provided (e.g., { id: 77, receivers: [...] })
const parseContainersToList = (order) => {
    if (!order || !order.receivers || order.receivers.length === 0) {
        return [];
    }

    const containerSet = new Set(); // Use Set for uniqueness
console.log('Parsing containers from order:', order);   
    order.receivers.forEach((receiver) => {
        console.log('Processing receiver:', receiver);
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
                        console.log('statussss',item),
                    
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
                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="ref">Booking Ref</StyledTableHeadCell>,
                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="loading">POL</StyledTableHeadCell>,
                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="dest">POD</StyledTableHeadCell>,
                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="sender">Sender</StyledTableHeadCell>,
                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="receivers">Receivers</StyledTableHeadCell>, // Multiple receivers with status
                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="containers">Containers</StyledTableHeadCell>,
                    // New column for Products (weight, category, item products, total number)
                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="products">Products</StyledTableHeadCell>,
                    // <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="created">Total Weight</StyledTableHeadCell>,
                    // <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="actions">Total Items</StyledTableHeadCell>,
                
                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="updated_at">Updated At</StyledTableHeadCell>,
                    // <TableCell key="assoc">Associated Container</TableCell>,
                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="created">Created At</StyledTableHeadCell>,
                    <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="actions">Actions</StyledTableHeadCell>
                ]}
            </TableRow>
        </TableHead>
        <TableBody>
            {orders.map((order) => {
                console.log('Rendering order: conatiners', order.receivers);
                const isItemSelected = isSelected(order.id);
                // renderReceivers( order.receivers);
                const containersList = order.receivers.forEach((receiver) => {
        console.log('Processing receiver: connnnnnnntainerssss', receiver);
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
                                <Typography variant="body2" noWrap sx={{ maxWidth: 220, cursor: 'help', fontWeight: 'medium' }}>
                                    {order.receivers.length > 0
                                        ? <>{order.receivers.length > 1 && <sup style={{ padding: 4, borderRadius: 50, float: 'left', background: '#00695c', color: '#fff' }}>({order.receivers.length})</sup>}
                                            <span style={{ padding: 0 }}>{order.receivers.map(c => c.receiver_name || '').join(', ').substring(0, 25)}...</span></>
                                        : '-'
                                    }
                                </Typography>
                            </StyledTooltip>
                        </StyledTableCell>
                       <TableCell>
                           <StyledTooltip
                               title={<PrettyList  items={parseSummaryToListTwo(order.receivers,order)} title="Containers Details"  />}
                               arrow
                               placement="top"
                               PopperProps={{

                                    sx: { '& .MuiTooltip-tooltip': { border: '1px solid #e0e0e0' } }
                                }}
                            >
                                <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
                                    {parseContainersToList(order)?.length > 0
                                        ? <>{parseContainersToList(order)?.length > 1 && <sup style={{ padding: 4, borderRadius: 50, float: 'left', background: '#00695c', color: '#fff' }}>({parseContainersToList(order).length})</sup>}
                                            <span style={{ padding: 0 }}>{parseContainersToList(order).map(c => c.primary).join(', ').substring(0, 25)}...</span></>
                                        : '-'   
                                    }
                                </Typography>
                            </StyledTooltip>
                        </TableCell>    
                        {/* Updated Products column using actual shippingDetails data (corrected field names) */}
                        <StyledTableCell>
                            <Tooltip
                                title={
                                    <Box sx={{ minWidth: 250 }}>
                                        <Typography variant="subtitle2" gutterBottom>Product Details</Typography>
                                        {productsSummary.length > 0 ? (
                                            productsSummary.map((product, idx) => (
                                                <Box key={idx} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                                    <Typography variant="body2"><strong>Category:</strong> {product.category}</Typography>
                                                    <Typography variant="body2"><strong>Subcategory:</strong> {product.subcategory || '-'}</Typography>
                                                    <Typography variant="body2"><strong>Item Type:</strong> {product.type}</Typography>
                                                    <Typography variant="body2"><strong>Weight:</strong> {product.weight} kg</Typography>
                                                    <Typography variant="body2"><strong>Total Items:</strong> {product.total_number}</Typography>
                                                    {/* <Typography variant="body2"><strong>Status:</strong> {product.status || '-'}</Typography> */}
                                                    {product.itemRef && <Typography variant="body2"><strong>Item Ref:</strong> {product.itemRef}</Typography>}
                                                </Box>
                                            ))
                                        ) : (
                                            <Typography variant="body2">-</Typography>
                                        )}
                                        {productsSummary.length > 0 && (
                                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                                                <Typography variant="body2"><strong>Total Weight:</strong> {totalWeight.toFixed(1)} kg</Typography>
                                                <Typography variant="body2"><strong>Total Items:</strong>{totalItems}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                }
                                arrow
                                placement="top"
                            >
                                <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
                                    {productsSummary.length > 0 ? (
                                        <>
                                            {productsSummary.length > 1 && <sup style={{ padding: 2, borderRadius: 50, float: 'left', background: '#00695c', color: '#fff', fontSize: '0.75rem' }}>({productsSummary.length})</sup>}
                                            <span style={{ paddingLeft: productsSummary.length > 1 ? 20 : 0 }}>
                                                Cat: {categoryList.substring(0, 10)}... | Wt: {totalWeight.toFixed(0)}kg | Items: {totalItems}
                                            </span>
                                        </>
                                    ) : '-'}
                                </Typography>
                            </Tooltip>
                        </StyledTableCell>
                        {/* <StyledTableCell>{totalWeight.toFixed(1)} kg</StyledTableCell>
                        <StyledTableCell>{totalItems.toFixed()} </StyledTableCell> */}


                        <TableCell>
                        {new Date(order.updated_at).toLocaleDateString()}
                        </TableCell>
                        <StyledTableCell>{new Date(order.created_at).toLocaleDateString()}</StyledTableCell>
                        <StyledTableCell>
                            <Stack direction="row" spacing={1}>
                                {/* <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, order); }} title="Update Status">
                                    <UpdateIcon />
                                </IconButton> */}
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
