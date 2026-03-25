
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
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Autocomplete } from "@mui/material";
import CargoIcon from '@mui/icons-material/LocalShipping'; // Or use InventoryIcon
import { styled } from '@mui/material/styles';
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Close";
import UpdateIcon from "@mui/icons-material/Update";
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from "react-router-dom";
import OrderModalView from './OrderModalView'
import AssignModal from "./AssignContainer";
import logoPic from "../../../public/logo-2.png"; // Adjust path as needed
import logoCAS from "../../../public/cas-logo.png"; // Adjust path as needed
import logoMFD from "../../../public/mfd-logo.png"; // Adjust path as needed
// import { ordersApi } from "../api"; // Adjust path as needed
import { api } from "../../api";
import { Description } from "@mui/icons-material";
// import { fontWeight } from "html2canvas/dist/types/css/property-descriptors/font-weight";
// Handlers

const OrdersList = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [openDocumentsModal, setOpenDocumentsModal] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
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
    const [selectedReceiverForUpdateDetails, setSelectedReceiverForUpdateDetails] = useState(null);

    const [selectedStatus, setSelectedStatus] = useState('');
    // ... your existing component logic (useState, handlers, etc.)
    // Handlers
    const handleStatusUpdate = (orderId, order) => {
        //  console.log('Updating status for order:', orderId);
        setSelectedOrderForUpdate(orderId);
        if (orderId && orderId.length) {
            const firstRec = orderId[0];
            console.log('receiverr', firstRec)

            setSelectedReceiverForUpdate(firstRec);
            setSelectedStatus(firstRec.status || 'Received for Shipment'); // Default to receiver's status or first status
        }
        console.log('receiverr', order, orderId)

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
        const rec = selectedOrderForUpdate?.receivers?.find(r => r.id === recId);
        setSelectedReceiverForUpdate(rec);
        setSelectedStatus(rec?.status || 'Received for Shipment');
    };

    const handleShippingChange = (event) => {
        console.log('itemssss ', event.target.value)
        const recId = event.target.value;
        const rec = selectedReceiverForUpdate?.shippingdetails?.find(r => r.itemRef === recId)
        console.log('seklected', rec)

        setSelectedReceiverForUpdateDetails(rec);
        // setSelectedStatus(rec?.status || 'Received for Shipment');ss
    };
    const handleConfirmStatusUpdate = async () => {
        if (!selectedOrderForUpdate || !selectedReceiverForUpdate || !selectedStatus) return;
        try {
            setLoading(true);
            // console.log('Updating status to:', selectedStatus, 'for receiver:', selectedReceiverForUpdate);      
            // API call to update receiver status (triggers notifications as per mapping)
            await api.put(`/api/orders/${selectedOrderForUpdate.id}/receivers/${selectedReceiverForUpdate.id}/items/${selectedReceiverForUpdateDetails.itemRef}/status`, {
                status: selectedStatus,
                itemRefs: [selectedReceiverForUpdateDetails.itemRef],
                // Optional: Include trigger logic if backend handles notifications
                notifyClient: true, // Based on "Shown to Client?" mapping
                notifyParties: true // Sender/Receiver as per rules
            });
            setSnackbar({
                open: true,
                message: `Status updated to "${selectedStatus}" for "${selectedReceiverForUpdate.receivername}" successfully! Notifications sent as per rules.`,
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
            console.log('statussss', statusesRes)
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

    const handleDocuments = async (orderId) => {
        setTempOrderId(orderId);
        setDocumentsLoading(true);
        setOpenDocumentsModal(true);
    };

    const handleCloseDocumentsModal = () => {
        setOpenDocumentsModal(false);
        setDocuments([]);
        setTempOrderId(null);
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
                                                {receiver.receiverName || 'Unnamed Receiver'}
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

    const getReceiverAddress = (orderData) => {
        if (orderData.receivers && orderData.receivers.length > 0) {
            const firstReceiver = orderData.receivers[0];
            return firstReceiver.receiveraddress || null;
        }
        return null;
    };

    // Helper function to get receiver name
    const getReceiverName = (orderData) => {
        if (orderData.receivers && orderData.receivers.length > 0) {
            const firstReceiver = orderData.receivers[0];
            return firstReceiver.receiverName || null;
        }
        return null;
    };

    // Helper function to get receiver email
    const getReceiverEmail = (orderData) => {
        if (orderData.receivers && orderData.receivers.length > 0) {
            const firstReceiver = orderData.receivers[0];
            return firstReceiver.receiveremail || null;
        }
        return null;
    };

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

    // Helper function to extract all unique containers from order data
    function extractContainers(orderData) {
        const containers = [];

        if (orderData.receivers && orderData.receivers.length > 0) {
            orderData.receivers.forEach(receiver => {
                if (receiver.containers && receiver.containers.length > 0) {
                    receiver.containers.forEach(container => {
                        if (!containers.includes(container)) {
                            containers.push(container);
                        }
                    });
                }

                if (receiver.shippingdetails && receiver.shippingdetails.length > 0) {
                    receiver.shippingdetails.forEach(detail => {
                        if (detail.containerDetails && detail.containerDetails.length > 0) {
                            detail.containerDetails.forEach(containerDetail => {
                                const containerNum = containerDetail.container?.container_number || containerDetail.container_number;
                                if (containerNum && !containers.includes(containerNum)) {
                                    containers.push(containerNum);
                                }
                            });
                        }
                    });
                }
            });
        }

        if (containers.length === 0) {
            containers.push(orderData.associated_container || '_________');
        }

        return containers;
    }

    // Helper function to get data specific to a container
    function getContainerData(orderData, containerNumber) {
        const containerData = {
            ...orderData,
            container_number: containerNumber,
            orders: []
        };

        if (orderData.receivers && orderData.receivers.length > 0) {
            orderData.receivers.forEach(receiver => {
                if (receiver.shippingdetails && receiver.shippingdetails.length > 0) {
                    receiver.shippingdetails.forEach(detail => {
                        if (detail.containerDetails && detail.containerDetails.length > 0) {
                            detail.containerDetails.forEach(containerDetail => {
                                const detailContainerNum = containerDetail.container?.container_number || containerDetail.container_number;

                                if (detailContainerNum === containerNumber) {
                                    containerData.orders.push({
                                        orderRef: detail.itemRef || receiver.receiverref || 'ORDER-REF',
                                        quantity: containerDetail.total_number || detail.totalNumber || 0,
                                        weight: containerDetail.assign_weight || detail.weight || 0
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }

        if (containerData.orders.length === 0) {
            containerData.orders.push({
                orderRef: orderData.booking_ref || '_________',
                quantity: orderData.total_assigned_qty || 0,
                weight: orderData.weight || 0
            });
        }

        return containerData;
    }

    // Generate HTML rows for the orders table
    function generateOrderRows(containerData) {
        if (!containerData.orders || containerData.orders.length === 0) {
            return `
            <tr>
                <td>_________</td>
                <td>_________</td>
                <td>_________</td>
            </tr>
        `;
        }

        // Since we're now sending only one order per page, this will always be a single row
        return containerData.orders.map(order => `
        <tr>
            <td>${order.orderRef || '_________'}</td>
            <td>${order.quantity || '_________'}</td>
            <td>${order.weight || '_________'}</td>
        </tr>
    `).join('');
    }

    function getContainerCategory(containerData) {
        if (!containerData.receivers || containerData.receivers.length === 0) {
            return containerData.category || '___TEXTILE_____________';
        }

        // Loop through receivers to find category for this container
        for (const receiver of containerData.receivers) {
            if (receiver.shippingdetails && receiver.shippingdetails.length > 0) {
                for (const detail of receiver.shippingdetails) {
                    if (detail.containerDetails && detail.containerDetails.length > 0) {
                        for (const containerDetail of detail.containerDetails) {
                            const detailContainerNum = containerDetail.container?.container_number || containerDetail.container_number;

                            if (detailContainerNum === containerData.container_number) {
                                // Return the category from shipping detail
                                return detail.category || detail.subcategory || '___TEXTILE_____________';
                            }
                        }
                    }
                }
            }
        }

        return containerData.category || '___TEXTILE_____________';
    }

    // Generate a single page for a container
    function generateContainerPage(containerData, pageNumber, totalPages) {
        return `
    <div class="page">
        <div class="page-content">
            <!-- Date - Now properly positioned at top -->
            <div class="stamp-paper"></div>
            <div class="date-section">
                Dated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
            </div>

            <!-- Address block -->
            <div class="address-block">
                <div class="address-line">To,</div>
                <div class="address-line">Anti Narcotics Force,</div>
                <div class="address-line">Port Qasim / Karachi,</div>
                <div class="address-line">The Deputy Collector of Customs Exports,</div>
                <div class="address-line">West Wharf / East Wharf / KICT / PICT / PORT QASIM,</div>
                <div class="address-line">Karachi,</div>
            </div>

            <!-- Title -->
            <div class="title">Letter of Indemnity, Undertaking</div>

            <!-- Subject -->
            <div class="subject-line">
                <span style="font-weight: bold;">SUBJECT:</span> 
                Container No <span style="color: #ff0000;">${containerData.container_number} , </span>
                Vide GD No : <span style="color: #ff0000;">${containerData.gd_number || '_________'} </span>
                ${containerData.system_number ? `BB System # <span style="color: #ff0000;">${containerData.system_number}` : ''}</span>
            </div>
            
            <!-- Exporter -->
            <div class="exporter-info">
                <span style="font-weight: bold;">EXPORTER:</span> 
                <span style="color: #ff0000;">${containerData.sender_name || '_________________________'}</span>
            </div>

            <!-- CNIC -->
            <div class="cnic-info">
                <span class="cnic-label">CNIC</span>
                <span>: <span style="color: #ff0000;">${containerData.sender_cnic || '_____-_______-_'}</span></span>
            </div>

            <!-- Main content -->
            <div class="content-margin">
                WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS, BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
            </div>

            <!-- Point 1 -->
            <div class="content-margin point">
                1. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY 
                <span style="color: #ff0000; font-weight: bold; text-decoration: underline; letter-spacing: 2px;">
                ${getContainerCategory(containerData) || '___TEXTILE_____________'}
                </span>AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC. AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>

            <!-- Point 2 -->
            <div class="content-margin point">
                2. WE FURTHER LIKE TO BRING IN YOUR KNOWLEDGE THE SAID CONSIGNMENT CONTAINERS THE BELOW ORDERS FOR EXPORT (CONTAINER ${containerData.container_number}).
            </div>

            <!-- Table with Orders -->
            <div class="content-margin">
                <table>
                    <thead>
                        <tr>
                            <th>Order No</th>
                            <th>Qty / Pkgs</th>
                            <th>Weight (kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateOrderRows(containerData)}
                    </tbody>
                </table>
            </div>

            <!-- Point 3 -->
            <div class="content-margin point">
                3. IT IS THEREFORE, REQUESTED TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
            </div>

            <!-- Signature section -->
            <div class="signature-section">
                <div class="signature-item">
                    <span class="signature-label">Signature</span>
                    <span class="signature-colon">:</span>
                    <span class="signature-line"></span>
                </div>
                <div class="signature-item">
                    <span class="signature-label">Name</span>
                    <span class="signature-colon">:</span>
                    <span class="signature-line">${containerData.sender_name || ''}</span>
                </div>
            </div>
        </div>
    </div>
  `;
    }

    const PartyShipperUndertakingForANF = (orderData) => {
        const containers = extractContainers(orderData);
        let allPagesHTML = '';

        containers.forEach((container, containerIndex) => {
            const containerData = getContainerData(orderData, container);

            // Generate a page for each order in the container
            containerData.orders.forEach((order, orderIndex) => {
                // Create a copy of container data with just this order
                const singleOrderData = {
                    ...containerData,
                    orders: [order] // Only include this single order
                };

                // Calculate page numbers
                const totalOrders = containerData.orders.length;
                const globalPageNumber = (containerIndex * totalOrders) + orderIndex + 1;
                const totalPages = containers.reduce((acc, curr) => {
                    const currData = getContainerData(orderData, curr);
                    return acc + currData.orders.length;
                }, 0);

                allPagesHTML += generateContainerPage(singleOrderData, globalPageNumber, totalPages);
            });
        });

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3rd Party Shipper Undertaking for ANF</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Arial, sans-serif;
            background-color: #f5f5f5;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0;
            margin: 0;
            width: 100%;
        }
            .stamp-paper
            {
                height: 385px;
            }
        
        /* Page container - Portrait orientation */
        .page {
            width: 210mm; /* Standard A4 width */
            min-height: auto; /* Remove fixed min-height */
            background-color: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            padding: 15mm 15mm 15mm 15mm;
            position: relative;
            margin: 0 auto 20px auto;
            box-sizing: border-box;
        }
        
        /* Add page break between pages */
        .page:not(:last-child) {
            page-break-after: always;
        }
        
        /* PRINT STYLES */
        @media print {
            @page {
                size: legal portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto; /* Let content determine height */
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            /* Last page shouldn't have page break */
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
        
        /* Rest of your CSS remains exactly the same */
        table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin: 10px 0;
        }
        
        th, td {
            border: 1px solid #000;
            padding: 8px; /* Slightly reduced padding */
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 14px;
        }
        
        th {
            font-weight: bold;
            background-color: #f2f2f2;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 250px;
            height: 20px;
            display: inline-block;
            margin-left: 10px;
        }
        
        .date-section {
            font-family: Arial, sans-serif;
            font-size: 15px;
            color: #000000;
            line-height: 1.4;
            margin-top: 0;
            margin-bottom: 15px; /* Reduced margin */
            text-align: left;
        }

        .address-block {
            margin-top: 0;
            margin-bottom: 15px; /* Reduced margin */
        }

        .address-line {
            font-family: Arial, sans-serif;
            font-size: 15px;
            line-height: 1.6; /* Slightly reduced line-height */
        }

        .title {
            text-align: center;
            font-weight: bold;
            font-family: Arial, sans-serif;
            font-size: 18px;
            margin: 15px 0; /* Reduced margin */
            letter-spacing: 1px;
        }

        .subject-line {
            font-family: Arial, sans-serif;
            font-size: 15px;
            margin: 10px 0; /* Reduced margin */
        }

        .exporter-info {
            margin: 10px 0; /* Reduced margin */
            font-family: Arial, sans-serif;
            font-size: 15px;
        }

        .cnic-info {
            margin: 10px 0; /* Reduced margin */
            display: flex;
            font-family: Arial, sans-serif;
            font-size: 15px;
        }

        .cnic-label {
            width: 70px;
            font-weight: bold;
        }

        .content-margin {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }

        .point {
            margin: 15px 0;
            line-height: 1.5;
        }

        .signature-section {
            margin-top: 20px;
            margin-bottom: 0;
        }

        .signature-item {
            margin-bottom: 5px;
            font-family: Arial, sans-serif;
            font-size: 15px;
            display: flex;
            align-items: center;
        }

        .signature-label {
            width: 70px;
        }

        .signature-colon {
            width: 20px;
        }

        .page-content {
            display: flex;
            flex-direction: column;
            height: auto; /* Let content determine height */
        }

        /* Optional: Add a small indicator to show which order/item this page represents */
        .order-indicator {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
            text-align: right;
        }
    </style>
</head>
<body>
    ${allPagesHTML}
</body>
</html>
`;
    };

    const PartyShipperIndemnityForEachOrderFormat = (orderData) => {
        // Default values if orderData is missing
        const safeOrder = orderData || {};

        // Helper function to safely get values
        const getSafeValue = (value, defaultValue = '_________________') => {
            return value && value !== '' && value !== null && value !== undefined ? value : defaultValue;
        };

        // Get sender/receiver details
        const senderName = safeOrder.sender_name || '';
        const senderCNIC = safeOrder.sender_cnic || '_____-_______-_';
        const senderPassport = safeOrder.sender_passport || '________';
        const senderPhone = safeOrder.sender_phone || '03xx-xxxxxxx';
        const senderAddress = safeOrder.sender_address || 'Address in Karachi';
        const senderCompany = safeOrder.sender_company || safeOrder.sender_name || 'Company Name / Individual Name';

        // Calculate total packages from shipping details
        const calculateTotalPackages = () => {
            if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
                return safeOrder.total_packages || '123';
            }

            let total = 0;
            safeOrder.receivers.forEach(receiver => {
                if (receiver.shippingdetails && Array.isArray(receiver.shippingdetails)) {
                    receiver.shippingdetails.forEach(detail => {
                        total += parseInt(detail.totalNumber) || 0;
                    });
                }
            });
            return total || '123';
        };

        // Get goods description
        const getGoodsDescription = () => {
            if (safeOrder.goods_description) return safeOrder.goods_description;

            // Try to get from first shipping detail
            if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
                const detail = safeOrder.receivers[0].shippingdetails[0];
                return `${detail.category || 'TEXTILE'} ${detail.subcategory || ''}`.trim();
            }

            return 'TEXTILE';
        };

        const totalPackages = calculateTotalPackages();
        const goodsDescription = getGoodsDescription();
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, '-');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3rd Party Shipper Indemnity for each order format</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: A4 ;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto; /* Let content determine height */
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            /* Last page shouldn't have page break */
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <!-- Header Section - Right Aligned -->
        <div style="text-align: right; margin-bottom: 40px;">
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 5px;">${getSafeValue(senderCompany)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 5px;">${getSafeValue(senderAddress)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">CNIC # : ${getSafeValue(senderCNIC)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Passport No : ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000;">Tel #: ${getSafeValue(senderPhone)}</div>
        </div>

        <!-- Date -->
        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 10px;">
            Dated: ${currentDate}
        </div>

        <!-- To Address -->
        <div style="margin-bottom: 10px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">BB System, 3<sup style="font-size: 9.5px;">rd</sup> Party Shipper</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Address,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Karachi - Pakistan.</div>
        </div>

        <!-- Title -->
        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <!-- Subject Section -->
        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #ff0000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #ff0000;">${getSafeValue(safeOrder.booking_ref)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Co-Loader : <span style="color: #ff0000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #ff0000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #ff0000;">${getSafeValue(senderCNIC)}</span></span>
            </div>
        </div>

        <!-- Main Content -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <!-- Point 1 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <!-- Point 2 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that Cargo Aviation Systems (Pvt) Ltd, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <!-- Point 3 -->
        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #ff0000; text-decoration: underline;">${getSafeValue(goodsDescription, '__TEXTILE_____________')}</span>
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <!-- Point 4 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <!-- Goods Owner Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-family: Arial; font-size: 15.0px;">
            <tr>
                <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #ff0000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">CNIC ID #</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderCNIC)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">: (Digitally Signed Login Credentials & OTP Verified)</td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getReceiverName(safeOrder)} ( ${new Date().toLocaleString()} ) , ${getReceiverEmail(safeOrder)}</td>
            </tr>
        </table>

        <!-- Footer Note -->
        <div style="text-align: center; font-family: Arial; font-size: 12px; color: #000000; margin-top: 10px; line-height: 1.6;">
            We hereby understand and confirm the document is digitally signed and is fully authorized to use if needed in event of any clearance process.
        </div>
    </div>
</body>
</html>
    `;
    };

    const CASBillofLading = (orderData) => {
        const getValue = (value) => {
            return (value && value !== '' && value !== null && value !== undefined) ? value : '';
        };

        // Format current date
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Extract data from order object
        const senderName = getValue(orderData.sender_name);
        const senderAddress = getValue(orderData.sender_address);
        const senderContact = getValue(orderData.sender_contact);

        // Get first receiver data
        const receiver = orderData.receivers && orderData.receivers[0] ? orderData.receivers[0] : {};
        const receiverName = getValue(receiver.receiverName);
        const receiverContact = getValue(receiver.receiverContact);
        const receiverAddress = getValue(receiver.receiverAddress);

        // Get shipping details
        const shippingDetails = receiver.shippingDetails || [];

        // Get container details
        const containers = receiver.containers || [];

        // Build container rows for table
        const getContainerRows = () => {
            if (!shippingDetails.length) return '';

            let rows = '';
            shippingDetails.forEach(detail => {
                if (detail.containerDetails && detail.containerDetails.length) {
                    detail.containerDetails.forEach(containerDetail => {
                        const containerNum = containerDetail.container?.container_number || containerDetail.container_number || '';
                        const sealNo = ''; // Seal no not in API
                        const pkgs = containerDetail.total_number || '';
                        const grossWt = containerDetail.assign_weight ? `${containerDetail.assign_weight} KGS` : '';

                        if (containerNum) {
                            rows += `<tr><td>${containerNum} / 40'HC</td><td></td><td>${pkgs} PKG</td><td></td><td>${grossWt}</td></tr>`;
                        }
                    });
                }
            });
            return rows;
        };

        // Calculate total packages
        const totalPkgs = shippingDetails.reduce((sum, detail) => {
            if (detail.containerDetails) {
                return sum + detail.containerDetails.reduce((s, cd) => s + (parseInt(cd.total_number) || 0), 0);
            }
            return sum;
        }, 0);

        // Get vessel name
        const vesselName = getValue(orderData.consignment_vessel);
        const voyageNo = getValue(orderData.consignment_voyage);
        const vesselVoyage = vesselName && voyageNo ? `${vesselName} / ${voyageNo}` : vesselName || voyageNo || '';

        // Get container count
        const containerCount = containers.length ? `${containers.length}X40'HC` : '';

        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bill of Lading - Cargo Aviation</title>
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 10px;
                margin: 0;
                padding: 20px;
                background-color: #f0f0f0;
            }
            .bl-container {
                width: 800px;
                margin: 0 auto;
                background-color: #fff;
                padding: 10px;
                border: 1px solid #ccc;
                position: relative;
                min-height: 1050px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10px;
            }
            .logo-section {
                display: flex;
                align-items: center;
                gap:20px;
            }
            .mfd-logo img {
                width: 80px;
                height: auto;
            }
            .company-name {
                font-size: 16px;
                font-weight: bold;
                color: #2b3a67;
            }
            .bl-title {
                text-align: right;
                line-height: 1.2;
            }
            .bl-title h1 {
                font-size: 18px;
                margin: 0;
            }
            .grid-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                border-top: 1px solid #000;
                border-left: 1px solid #000;
            }
            .cell {
                border-right: 1px solid #000;
                border-bottom: 1px solid #000;
                padding: 4px;
                min-height: 40px;
            }
            .label {
                font-size: 8px;
                color: #555;
                display: block;
                margin-bottom: 2px;
            }
            .content {
                font-weight: bold;
                text-transform: uppercase;
                white-space: pre-line;
            }
            .full-width {
                grid-column: span 2;
            }
            .four-cols {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
            }
            .description-area {
                min-height: 300px;
                padding: 15px;
                border-left: 1px solid #000;
                border-right: 1px solid #000;
                position: relative;
            }
            .table-data {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .table-data th {
                text-align: left;
                font-size: 9px;
                border-bottom: 1px solid #000;
                padding: 5px;
            }
            .table-data td {
                padding: 5px;
                font-weight: bold;
            }
            .footer {
                margin-top: 10px;
                border-top: 2px solid #000;
                padding-top: 10px;
            }
            .red-bar {
                height: 10px;
                background-color: #e63946;
                margin-top: 20px;
            }
            .empty-placeholder {
                height: 20px;
            }
        </style>
    </head>
    <body>

    <div class="bl-container">
        <div class="header">
            <div class="logo-section">
                <div class="mfd-logo"><img src="${logoCAS}" alt="Cargo Aviation"></div>
                <div class="company-name">Cargo Aviation System Pvt Ltd</div>
            </div>
            <div class="bl-title">
                <h1>Bill of Lading</h1>
                <div>Multimodal Transport<br>or Port-to-Port Shipment</div>
            </div>
        </div>

        <div class="grid-container">
            <div class="cell">
                <span class="label">Shipper</span>
                <div class="content">
                    ${senderName ? `${senderName}<br>` : ''}
                    ${senderAddress ? senderAddress.replace(/, /g, ',<br>') + '<br>' : ''}
                    ${senderContact ? `Tel: ${senderContact}` : ''}
                </div>
            </div>
            <div class="cell">
                <span class="label">B/L No. (also to be used as payment ref.)</span>
                <div class="content" style="font-size: 14px;">${getValue(orderData.booking_ref)}</div>
            </div>

            <div class="cell">
                <span class="label">Consignee</span>
                <div class="content">
                    ${receiverName ? `${receiverName}<br>` : ''}
                    ${receiverAddress ? receiverAddress.replace(/, /g, ',<br>') + '<br>' : ''}
                    ${receiverContact ? `Tel: ${receiverContact}` : ''}
                </div>
            </div>
            <div class="cell">
                <span class="label">Export Reference / Forwarding Agent</span>
                <div class="content"></div>
            </div>

            <div class="cell">
                <span class="label">Notify Party</span>
                <div class="content">
                    ${receiverName ? `${receiverName}<br>` : ''}
                    ${receiverAddress ? receiverAddress.replace(/, /g, ',<br>') + '<br>' : ''}
                    ${receiverContact ? `Tel: ${receiverContact}` : ''}
                </div>
            </div>
            <div class="cell">
                <span class="label">Destination Agent</span>
                <div class="content"></div>
            </div>
        </div>

        <div class="grid-container" style="border-top: none;">
            <div class="four-cols full-width">
                <div class="cell"><span class="label">Port of Loading</span><div class="content">${getPlaceName(orderData.place_of_loading) || getValue(orderData.place_of_loading)}</div></div>
                <div class="cell"><span class="label">Pre-carriage by</span><div class="content"></div></div>
                <div class="cell"><span class="label">Ocean Vessel / Voyage</span><div class="content">${vesselVoyage}</div></div>
                <div class="cell"><span class="label">Freight payable at</span><div class="content"></div></div>
            </div>
            <div class="four-cols full-width">
                <div class="cell"><span class="label">Place of Receipt</span><div class="content"></div></div>
                <div class="cell"><span class="label">Port of Discharge</span><div class="content">${getPlaceName(orderData.final_destination) || getValue(orderData.final_destination)}</div></div>
                <div class="cell"><span class="label">Place of Delivery</span><div class="content">${getPlaceName(orderData.final_destination) || getValue(orderData.final_destination)}</div></div>
                <div class="cell"><span class="label">Final Destination</span><div class="content">${getPlaceName(orderData.final_destination) || getValue(orderData.final_destination)}</div></div>
            </div>
        </div>

        <div class="description-area">
            <div style="display: flex; justify-content: space-between;">
                <div style="width: 20%;">
                    <span class="label">Marks & Nos. / No of Pkgs</span>
                    <div class="content" style="margin-top: 20px;">${totalPkgs ? totalPkgs + ' PKGS' : ''}</div>
                </div>
                <div style="width: 30%; text-align: left;">
                    <span class="label">Description of Goods</span>
                    <div class="content" style="margin-top: 20px; text-decoration: underline;">
                        ${containers.length ? containers.length + 'X40\'HC FCL CONTAINER SAID TO CONTAIN' : ''}
                    </div>
                    <div class="content" style="margin-top: 10px;">
                        ${containers.length ? containers.length + 'X40\'HC CONTAINER' : ''}<br>
                        ${totalPkgs ? 'STC ' + totalPkgs + ' PACKAGES' : ''}<br>
                        ${shippingDetails.length ? shippingDetails.map(d => d.category || d.subcategory).filter(Boolean).join(', ') : ''}
                    </div>
                    <div class="content" style="margin-top: 30px; font-size: 11px;">
                        ALL SORT OF DESTINATION CHARGES ON CONSIGNEE'S ACCOUNT
                    </div>
                </div>
                <div style="width: 20%; text-align: right;">
                    <span class="label">Gross Weight / Measurement</span>
                    <div class="content" style="margin-top: 20px;">
                        ${shippingDetails.reduce((sum, d) => sum + (parseFloat(d.weight) || 0), 0) ?
                'GROSS WT<br>' + shippingDetails.reduce((sum, d) => sum + (parseFloat(d.weight) || 0), 0).toFixed(2) + ' KGS' :
                ''}
                    </div>
                    <div class="content" style="margin-top: 40px;">CY/CY</div>
                </div>
            </div>

            ${getContainerRows() ? `
            <table class="table-data">
                <thead>
                    <tr>
                        <th>CONTAINER NO. SIZE</th>
                        <th>SEAL NO.</th>
                        <th>PKGS</th>
                        <th>NET WT</th>
                        <th>GROSS WT</th>
                    </tr>
                </thead>
                <tbody>
                    ${getContainerRows()}
                </tbody>
            </table>
            ` : ''}
            <div style="display: flex;justify-content: end;">
                    <p style="width: 200px;padding: 5px;border: 2px solid #000;font-size: 8px;font-weight: bold;">
                        All Terminal Charges & Demurrage Etc at the port of Discharge/ Destination as per line's tariff & At the Account of Consignee.
                    </p>
            </div>
        </div>

        

        <div class="grid-container">
            <div class="cell"><span class="label">Freight Details</span><div class="content"></div></div>
            <div class="cell"><span class="label">Total Number of Pkgs</span><div class="content">${containerCount}</div></div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: space-between;">
            <div style="width: 60%;">
                <p style="font-size: 7px;">RECEIVED for shpment specified above in apparent good order and condition unless otherwise stated
The Gods to be delivered at above mentioned Port of Discharge or Place of Delivery, whichever applies
SUBJECT TO Terms and Conditions contained on reverse side hereof, to which Merchant agrees by
accepting this Bill of Lading
IN WITNESS WHEREOF the number of onginal Bills of lading stated on this side next to this clause
have been signed, one of which being accomplished, the others to stand void, unless compulsorily
applicable law provides otherwise
*Applicable only when used for MULTI MODAL TRANSPORTATION.</p>
                <div class="content" style="margin-top: 10px;">Karachi , ${currentDate}</div>
            </div>
            <div style="text-align: right; width: 40%;">    
                <div class="content" style="margin-top: 10px;">
                    Cargo Aviation <br> System Pvt Ltd
                </div>
            </div>
        </div>

        <div class="red-bar"></div>
        <div style="text-align: right; font-weight: bold; color: #2b3a67; font-size: 12px; margin-top: 5px;">
            Cargo Aviation System Pvt Ltd
        </div>
    </div>

    </body>
    </html>
    `;
    };

    const DubaiLetterOfIndemnityForCustoms = (orderData) => {
        // Default values if orderData is missing
        const safeOrder = orderData || {};

        // Helper function to safely get values
        const getSafeValue = (value, defaultValue = '_________________') => {
            return value && value !== '' && value !== null && value !== undefined ? value : defaultValue;
        };

        // Get sender/receiver details
        const senderName = safeOrder.sender_name || '';
        const senderCNIC = safeOrder.sender_cnic || '_____-_______-_';
        const trade_license = safeOrder.trade_license || '________';
        const senderPassport = safeOrder.sender_passport || '________';
        const senderEmiratesID = safeOrder.sender_emirates_id || '________';
        const senderPhone = safeOrder.sender_phone || '03xx-xxxxxxx';
        const senderAddress = safeOrder.sender_address || 'Address in Karachi';
        const senderCompany = safeOrder.sender_company || safeOrder.sender_name || 'Company Name / Individual Name';

        // Calculate total packages from shipping details
        const calculateTotalPackages = () => {
            if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
                return safeOrder.total_packages || '123';
            }

            let total = 0;
            safeOrder.receivers.forEach(receiver => {
                if (receiver.shippingdetails && Array.isArray(receiver.shippingdetails)) {
                    receiver.shippingdetails.forEach(detail => {
                        total += parseInt(detail.totalNumber) || 0;
                    });
                }
            });
            return total || '123';
        };

        // Get goods description
        const getGoodsDescription = () => {
            if (safeOrder.goods_description) return safeOrder.goods_description;

            // Try to get from first shipping detail
            if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
                const detail = safeOrder.receivers[0].shippingdetails[0];
                return `${detail.category || 'TEXTILE'} ${detail.subcategory || ''}`.trim();
            }

            return 'TEXTILE';
        };

        const totalPackages = calculateTotalPackages();
        const goodsDescription = getGoodsDescription();
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, '-');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dubai Letter of Idemnity for Customs</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: A4;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto; /* Let content determine height */
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            /* Last page shouldn't have page break */
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <!-- Header Section - Right Aligned -->
        <div style="text-align: right; margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 5px;">${getSafeValue(senderCompany)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 5px;">${getSafeValue(senderAddress)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Trade Liceness #: ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Passport No: ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Emirates ID #: ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000;">Tel #: ${getSafeValue(senderPhone)}</div>
        </div>

        <!-- Date -->
        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 10px;">
            Dated: ${currentDate}
        </div>

        <!-- To Address -->
        <div style="margin-bottom: 10px;">
                        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Anti Narcotics Force,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Dubai, Sharjah Customs,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">United Arab Emirates.</div>
        </div>

        <!-- Title -->
        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <!-- Subject Section -->
        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #ff0000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #ff0000;">${getSafeValue(safeOrder.booking_ref)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">EXPORTER : <span style="color: #ff0000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #ff0000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #ff0000;">${getSafeValue(senderCNIC)}</span></span>
            </div>
        </div>

        <!-- Main Content -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <!-- Point 1 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <!-- Point 2 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that Royal Gulf Shipping & Logistics LLC, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <!-- Point 3 -->
        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #ff0000; text-decoration: underline;">${getSafeValue(goodsDescription, '__TEXTILE_____________')}</span>            
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <!-- Point 4 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <!-- Goods Owner Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: Arial; font-size: 15.0px;">
            <tr>
                <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #ff0000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">CNIC ID #</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderCNIC)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">: (Digitally Signed Login Credentials & OTP Verified)</td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getReceiverName(safeOrder)} ( ${new Date().toLocaleString()} ) , ${getReceiverEmail(safeOrder)}</td>
            </tr>
        </table>

        <!-- Footer Note -->
        <div style="text-align: center; font-family: Arial; font-size: 12px; color: #000000; margin-top: 10px; line-height: 1.6;">
            We hereby understand and confirm the document is digitally signed and is fully authorized to use if needed in event of any clearance process.
        </div>
    </div>
</body>
</html>
    `;
    };

    const KarachiGovtCustomsStampPaperUndertakingFormat = (orderData) => {
        // Default values if orderData is missing
        const safeOrder = orderData || {};

        // Helper function to safely get values
        const getSafeValue = (value, defaultValue = '_________________') => {
            return value && value !== '' && value !== null && value !== undefined ? value : defaultValue;
        };

        // Get sender/receiver details
        const senderName = safeOrder.sender_name || '';
        const senderCNIC = safeOrder.sender_cnic || '_____-_______-_';
        const senderPassport = safeOrder.sender_passport || '________';
        const senderPhone = safeOrder.sender_phone || '03xx-xxxxxxx';
        const senderAddress = safeOrder.sender_address || 'Address in Karachi';
        const senderCompany = safeOrder.sender_company || safeOrder.sender_name || 'Company Name / Individual Name';

        // Calculate total packages from shipping details
        const calculateTotalPackages = () => {
            if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
                return safeOrder.total_packages || '123';
            }

            let total = 0;
            safeOrder.receivers.forEach(receiver => {
                if (receiver.shippingdetails && Array.isArray(receiver.shippingdetails)) {
                    receiver.shippingdetails.forEach(detail => {
                        total += parseInt(detail.totalNumber) || 0;
                    });
                }
            });
            return total || '123';
        };

        // Get goods description
        const getGoodsDescription = () => {
            if (safeOrder.goods_description) return safeOrder.goods_description;

            // Try to get from first shipping detail
            if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
                const detail = safeOrder.receivers[0].shippingdetails[0];
                return `${detail.category || 'TEXTILE'} ${detail.subcategory || ''}`.trim();
            }

            return 'TEXTILE';
        };

        const totalPackages = calculateTotalPackages();
        const goodsDescription = getGoodsDescription();
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, '-');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Karachi Govt. Customs Stamp paper undertaking format</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
.stamp-paper
            {
                height: 385px;
            }
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: legal portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto; /* Let content determine height */
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            /* Last page shouldn't have page break */
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <div class="stamp-paper"></div>
        <!-- Date -->
        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 15px;">
            Dated: ${currentDate}
        </div>

        <!-- To Address -->
        <div style="margin-bottom: 0px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Anti Narcotics Force,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Dubai, Sharjah Customs,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">United Arab Emirates.</div>
        </div>

        <!-- Title -->
        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <!-- Subject Section -->
        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #ff0000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #ff0000;">${getSafeValue(safeOrder.booking_ref)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">EXPORTER : <span style="color: #ff0000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #ff0000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #ff0000;">${getSafeValue(senderCNIC)}</span></span>
            </div>
        </div>

        <!-- Main Content -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <!-- Point 1 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <!-- Point 2 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that "<span style="color: #ff0000;">XYZ Exporter</span> & their agents" Cargo Aviation Systems (Pvt) Ltd, are only a Warehousing & Distribution agents on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <!-- Point 3 -->
        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #ff0000; text-decoration: underline;">${getSafeValue(goodsDescription, '__TEXTILE_____________')}</span>
            </div>
            <div style="font-family: Arial; font-size: 13.2px; color: #000000; text-align: justify;">
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <!-- Point 4 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 30px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <!-- Goods Owner Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-family: Arial; font-size: 15.0px;">
            <tr>
                <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #ff0000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">CNIC ID #</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderCNIC)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">: (Digitally Signed Login Credentials & OTP Verified)</td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getReceiverName(safeOrder)} ( ${new Date().toLocaleString()} ) , ${getReceiverEmail(safeOrder)}</td>
            </tr>
        </table>
    </div>
</body>
</html>
    `;
    };

    const KarachiUndertakingForCustomsEachSenderShouldGive = (orderData) => {
        // Default values if orderData is missing
        const safeOrder = orderData || {};

        // Helper function to safely get values
        const getSafeValue = (value, defaultValue = '_________________') => {
            return value && value !== '' && value !== null && value !== undefined ? value : defaultValue;
        };

        // Get sender/receiver details
        const senderName = safeOrder.sender_name || '';
        const senderCNIC = safeOrder.sender_cnic || '_____-_______-_';
        const senderPassport = safeOrder.sender_passport || '________';
        const senderPhone = safeOrder.sender_phone || '03xx-xxxxxxx';
        const senderAddress = safeOrder.sender_address || 'Address in Karachi';
        const senderCompany = safeOrder.sender_company || safeOrder.sender_name || 'Company Name / Individual Name';

        // Calculate total packages from shipping details
        const calculateTotalPackages = () => {
            if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
                return safeOrder.total_packages || '123';
            }

            let total = 0;
            safeOrder.receivers.forEach(receiver => {
                if (receiver.shippingdetails && Array.isArray(receiver.shippingdetails)) {
                    receiver.shippingdetails.forEach(detail => {
                        total += parseInt(detail.totalNumber) || 0;
                    });
                }
            });
            return total || '123';
        };

        // Get goods description
        const getGoodsDescription = () => {
            if (safeOrder.goods_description) return safeOrder.goods_description;

            // Try to get from first shipping detail
            if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
                const detail = safeOrder.receivers[0].shippingdetails[0];
                return `${detail.category || 'TEXTILE'} ${detail.subcategory || ''}`.trim();
            }

            return 'TEXTILE';
        };

        const totalPackages = calculateTotalPackages();
        const goodsDescription = getGoodsDescription();
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, '-');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Karachi, Undertaking for Customs, Each sender should give</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
.stamp-paper
            {
                height: 385px;
            }
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: legal portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto; /* Let content determine height */
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            /* Last page shouldn't have page break */
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <div class="stamp-paper"></div>
        <!-- Date -->
        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 20px;">
            Dated: ${currentDate}
        </div>

        <!-- To Address -->
        <div style="margin-bottom: 10px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Anti Narcotics Force,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Port Qasim / Karachi,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">The Deputy Collector of Customs Exports,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">West Wharf / East Wharf / KICT / PICT / PORT QASIM,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Karachi,</div>
        </div>

        <!-- Title -->
        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <!-- Subject Section -->
        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #ff0000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #ff0000;">${getSafeValue(safeOrder.booking_ref)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">EXPORTER : <span style="color: #ff0000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #ff0000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #ff0000;">${getSafeValue(senderCNIC)}</span></span>
            </div>
        </div>

        <!-- Main Content -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <!-- Point 1 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <!-- Point 2 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that "<span style="color: #ff0000;">XYZ Exporter</span> & their agents" Cargo Aviation Systems (Pvt) Ltd, are only a Warehousing & Distribution agents on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <!-- Point 3 -->
        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #ff0000; text-decoration: underline;">${getSafeValue(goodsDescription, '__TEXTILE_____________')}</span>
            </div>
            <div style="font-family: Arial; font-size: 13.2px; color: #000000; text-align: justify;">
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <!-- Point 4 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 30px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <!-- Goods Owner Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: Arial; font-size: 15.0px;">
            <tr>
                <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #ff0000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">CNIC ID #</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderCNIC)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">: (Digitally Signed Login Credentials & OTP Verified)</td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getReceiverName(safeOrder)} ( ${new Date().toLocaleString()} ) , ${getReceiverEmail(safeOrder)}</td>
            </tr>
        </table>
    </div>
</body>
</html>
    `;
    };

    const ReceiverUndertakingForDubaiCustoms = (orderData) => {
        // Default values if orderData is missing
        const safeOrder = orderData || {};

        // Helper function to safely get values
        const getSafeValue = (value, defaultValue = '_________________') => {
            return value && value !== '' && value !== null && value !== undefined ? value : defaultValue;
        };

        // Get sender/receiver details
        const senderName = safeOrder.sender_name || '';
        const senderCNIC = safeOrder.sender_cnic || '_____-_______-_';
        const trade_license = safeOrder.trade_license || '________';
        const senderPassport = safeOrder.sender_passport || '________';
        const senderEmiratesID = safeOrder.sender_emirates_id || '________';
        const senderPhone = safeOrder.sender_phone || '03xx-xxxxxxx';
        const senderAddress = safeOrder.sender_address || 'Address in Karachi';
        const senderCompany = safeOrder.sender_company || safeOrder.sender_name || 'Company Name / Individual Name';

        // Calculate total packages from shipping details
        const calculateTotalPackages = () => {
            if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
                return safeOrder.total_packages || '123';
            }

            let total = 0;
            safeOrder.receivers.forEach(receiver => {
                if (receiver.shippingdetails && Array.isArray(receiver.shippingdetails)) {
                    receiver.shippingdetails.forEach(detail => {
                        total += parseInt(detail.totalNumber) || 0;
                    });
                }
            });
            return total || '123';
        };

        // Get goods description
        const getGoodsDescription = () => {
            if (safeOrder.goods_description) return safeOrder.goods_description;

            // Try to get from first shipping detail
            if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
                const detail = safeOrder.receivers[0].shippingdetails[0];
                return `${detail.category || 'TEXTILE'} ${detail.subcategory || ''}`.trim();
            }

            return 'TEXTILE';
        };

        const totalPackages = calculateTotalPackages();
        const goodsDescription = getGoodsDescription();
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, '-');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receiver Undertaking for Dubai Customs</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: A4 portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto; /* Let content determine height */
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            /* Last page shouldn't have page break */
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <!-- Header Section - Right Aligned -->
        <div style="text-align: right; margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 5px;">${getSafeValue(senderCompany)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 5px;">${getSafeValue(senderAddress)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Trade Liceness #: ${getSafeValue(trade_license)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Passport No: ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Emirates ID #: ${getSafeValue(senderEmiratesID)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000;">Tel #: ${getSafeValue(senderPhone)}</div>
        </div>

        <!-- Date -->
        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 10px;">
            Dated: ${currentDate}
        </div>

        <!-- To Address -->
        <div style="margin-bottom: 10px;">
                        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">BB System, 3rd Party Consignee</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Address, </div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Dubai UAE.</div>
        </div>

        <!-- Title -->
        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <!-- Subject Section -->
        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> IMPORT OF <span style="color: #ff0000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #ff0000;">${getSafeValue(safeOrder.booking_ref)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Co-Loader : <span style="color: #ff0000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #ff0000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #ff0000;">${getSafeValue(senderCNIC)}</span></span>
            </div>
        </div>

        <!-- Main Content -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <!-- Point 1 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <!-- Point 2 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that Royal Gulf Shipping & Logistics LLC, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <!-- Point 3 -->
        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #ff0000; text-decoration: underline;">${getSafeValue(goodsDescription, '__TEXTILE_____________')}</span>
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <!-- Point 4 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <!-- Goods Owner Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: Arial; font-size: 15.0px;">
            <tr>
            <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
            <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #ff0000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Emirates ID # 	</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderEmiratesID)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">: (Digitally Signed Login Credentials & OTP Verified)</td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getReceiverName(safeOrder)} ( ${new Date().toLocaleString()} ) , ${getReceiverEmail(safeOrder)}</td>
            </tr>
        </table>

        <!-- Footer Note -->
        <div style="text-align: center; font-family: Arial; font-size: 12px; color: #000000; margin-top: 5px;">
            We hereby understand and confirm the document is digitally signed and is fully authorized to use if needed in event of any clearance process.
        </div>
    </div>
</body>
</html>
    `;
    };

    const ReceiverUndertakingDubaiANF = (orderData) => {
        // Default values if orderData is missing
        const safeOrder = orderData || {};

        // Helper function to safely get values
        const getSafeValue = (value, defaultValue = '_________________') => {
            return value && value !== '' && value !== null && value !== undefined ? value : defaultValue;
        };

        // Get sender/receiver details
        const senderName = safeOrder.sender_name || '';
        const senderCNIC = safeOrder.sender_cnic || '_____-_______-_';
        const trade_license = safeOrder.trade_license || '________';
        const senderPassport = safeOrder.sender_passport || '________';
        const senderEmiratesID = safeOrder.sender_emirates_id || '________';
        const senderPhone = safeOrder.sender_phone || '03xx-xxxxxxx';
        const senderAddress = safeOrder.sender_address || 'Address in Karachi';
        const senderCompany = safeOrder.sender_company || safeOrder.sender_name || 'Company Name / Individual Name';

        // Calculate total packages from shipping details
        const calculateTotalPackages = () => {
            if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
                return safeOrder.total_packages || '123';
            }

            let total = 0;
            safeOrder.receivers.forEach(receiver => {
                if (receiver.shippingdetails && Array.isArray(receiver.shippingdetails)) {
                    receiver.shippingdetails.forEach(detail => {
                        total += parseInt(detail.totalNumber) || 0;
                    });
                }
            });
            return total || '123';
        };

        // Get goods description
        const getGoodsDescription = () => {
            if (safeOrder.goods_description) return safeOrder.goods_description;

            // Try to get from first shipping detail
            if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
                const detail = safeOrder.receivers[0].shippingdetails[0];
                return `${detail.category || 'TEXTILE'} ${detail.subcategory || ''}`.trim();
            }

            return 'TEXTILE';
        };

        const totalPackages = calculateTotalPackages();
        const goodsDescription = getGoodsDescription();
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, '-');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receiver Undertaking Dubai ANF</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: A4 portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto; /* Let content determine height */
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            /* Last page shouldn't have page break */
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <!-- Header Section - Right Aligned -->
        <div style="text-align: right; margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 5px;">${getSafeValue(senderCompany)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 5px;">${getSafeValue(senderAddress)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Trade Liceness #: ${getSafeValue(trade_license)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Passport No: ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Emirates ID #: ${getSafeValue(senderEmiratesID)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000;">Tel #: ${getSafeValue(senderPhone)}</div>
        </div>

        <!-- Date -->
        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 10px;">
            Dated: ${currentDate}
        </div>

        <!-- To Address -->
        <div style="margin-bottom: 10px;">
                        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Anti Narcotics Force,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Dubai, Sharjah Customs,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">United Arab Emirates. </div>
        </div>

        <!-- Title -->
        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <!-- Subject Section -->
        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">IMPORT OF <span style="color: #ff0000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #ff0000;">${getSafeValue(safeOrder.booking_ref)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Co-Loader : <span style="color: #ff0000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #ff0000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #ff0000;">${getSafeValue(senderCNIC)}</span></span>
            </div>
        </div>

        <!-- Main Content -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <!-- Point 1 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <!-- Point 2 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that Royal Gulf Shipping & Logistics LLC, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <!-- Point 3 -->
        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #ff0000; text-decoration: underline;">${getSafeValue(goodsDescription, '__TEXTILE_____________')}</span>
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <!-- Point 4 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <!-- Goods Owner Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: Arial; font-size: 15.0px;">
            <tr>
            <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
            <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #ff0000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Emirates ID # 	</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderEmiratesID)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">: (Digitally Signed Login Credentials & OTP Verified)</td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getReceiverName(safeOrder)} ( ${new Date().toLocaleString()} ) , ${getReceiverEmail(safeOrder)}</td>
            </tr>
        </table>

        <!-- Footer Note -->
        <div style="text-align: center; font-family: Arial; font-size: 12px; color: #000000; margin-top: 5px;">
            We hereby understand and confirm the document is digitally signed and is fully authorized to use if needed in event of any clearance process.
        </div>
    </div>
</body>
</html>
    `;
    };

    const SenderUndertakingForThirdPartyShipper = (orderData) => {
        // Default values if orderData is missing
        const safeOrder = orderData || {};

        // Helper function to safely get values
        const getSafeValue = (value, defaultValue = '_________________') => {
            return value && value !== '' && value !== null && value !== undefined ? value : defaultValue;
        };

        // Get sender/receiver details
        const senderName = safeOrder.sender_name || '';
        const senderCNIC = safeOrder.sender_cnic || '_____-_______-_';
        const trade_license = safeOrder.trade_license || '________';
        const senderPassport = safeOrder.sender_passport || '________';
        const senderEmiratesID = safeOrder.sender_emirates_id || '________';
        const consignmentNumber = safeOrder.consignment_number || '________';
        const consignmentVessel = safeOrder.consignment_vessel || '________';
        const consignmentVoyage = safeOrder.consignment_voyage || '________';
        const senderPhone = safeOrder.sender_phone || '03xx-xxxxxxx';
        const senderAddress = safeOrder.sender_address || 'Address in Karachi';
        const senderCompany = safeOrder.sender_company || safeOrder.sender_name || 'Company Name / Individual Name';

        // Calculate total packages from shipping details
        const calculateTotalPackages = () => {
            if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
                return safeOrder.total_packages || '123';
            }

            let total = 0;
            safeOrder.receivers.forEach(receiver => {
                if (receiver.shippingdetails && Array.isArray(receiver.shippingdetails)) {
                    receiver.shippingdetails.forEach(detail => {
                        total += parseInt(detail.totalNumber) || 0;
                    });
                }
            });
            return total || '123';
        };

        // Get goods description
        const getGoodsDescription = () => {
            if (safeOrder.goods_description) return safeOrder.goods_description;

            // Try to get from first shipping detail
            if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
                const detail = safeOrder.receivers[0].shippingdetails[0];
                return `${detail.category || 'TEXTILE'} ${detail.subcategory || ''}`.trim();
            }

            return 'TEXTILE';
        };

        const totalPackages = calculateTotalPackages();
        const goodsDescription = getGoodsDescription();
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, '-');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sender Undertaking for 3rd Party Shipper</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: A4 portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto; /* Let content determine height */
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            /* Last page shouldn't have page break */
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <!-- Header Section - Right Aligned -->
        <div style="text-align: right; margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 5px;">${getSafeValue(senderCompany)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 5px;">${getSafeValue(senderAddress)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Trade Liceness #: ${getSafeValue(trade_license)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Passport No: ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #ff0000; margin-bottom: 5px;">Emirates ID #: ${getSafeValue(senderEmiratesID)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #ff0000;">Tel #: ${getSafeValue(senderPhone)}</div>
        </div>

        <!-- Date -->
        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #ff0000; margin-bottom: 10px;">
            Dated: ${currentDate}
        </div>

        <!-- To Address -->
        <div style="margin-bottom: 10px;">
                        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">BB System, 3rd Party Shipper</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Address, </div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Karachi - Pakistan.</div>
        </div>

        <!-- Title -->
        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <!-- Subject Section -->
        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">EXPORT OF <span style="color: #ff0000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #ff0000;">${getSafeValue(safeOrder.booking_ref)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Co-Loader : <span style="color: #ff0000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #ff0000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #ff0000;">${getSafeValue(senderCNIC)}</span></span>
            </div>
        </div>

        <!-- Main Content -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <!-- Point 1 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <!-- Point 2 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that Cargo Aviation Systems (Pvt) Ltd, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <!-- Point 3 -->
        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #ff0000; text-decoration: underline;">${getSafeValue(goodsDescription, '__TEXTILE_____________')}</span>
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <!-- Point 4 -->
        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <!-- Goods Owner Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: Arial; font-size: 15.0px;">
            <tr>
            <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
            <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #ff0000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Emirates ID # 	</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #ff0000;">${getSafeValue(senderEmiratesID)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">: (Digitally Signed Login Credentials & OTP Verified)</td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getReceiverName(safeOrder)} ( ${new Date().toLocaleString()} ) , ${getReceiverEmail(safeOrder)}</td>
            </tr>
        </table>

        <!-- Footer Note -->
        <div style="text-align: center; font-family: Arial; font-size: 12px; color: #000000; margin-top: 5px;">
            We hereby understand and confirm the document is digitally signed and is fully authorized to use if needed in event of any clearance process.
        </div>
    </div>
</body>
</html>
    `;
    };

    const WHARFAGEConsignmentsNote = (orderData) => {
        // Default values if orderData is missing
        const safeOrder = orderData || {};

        // Helper function to safely get values
        const getSafeValue = (value, defaultValue = '_________________') => {
            return value && value !== '' && value !== null && value !== undefined ? value : defaultValue;
        };

        // Get first receiver
        const firstReceiver = safeOrder.receivers && safeOrder.receivers.length > 0 ? safeOrder.receivers[0] : {};

        // Get shipping details
        const shippingDetails = firstReceiver.shippingdetails || [];

        // Get container details with their weights
        const getContainerDetails = () => {
            const containerList = [];
            if (firstReceiver.containers && firstReceiver.containers.length > 0) {
                firstReceiver.containers.forEach(container => {
                    let totalQty = 0;
                    let totalWeight = 0;

                    // Find all shipping details for this container
                    shippingDetails.forEach(detail => {
                        if (detail.containerDetails) {
                            detail.containerDetails.forEach(cd => {
                                const containerNum = cd.container?.container_number || cd.container_number;
                                if (containerNum === container) {
                                    totalQty += parseInt(cd.total_number) || 0;
                                    totalWeight += parseFloat(cd.assign_weight) || 0;
                                }
                            });
                        }
                    });

                    containerList.push({
                        number: container,
                        quantity: totalQty,
                        weight: totalWeight
                    });
                });
            }
            return containerList;
        };

        const containerDetails = getContainerDetails();

        // Calculate totals
        const totalPackages = containerDetails.reduce((sum, c) => sum + c.quantity, 0);
        const totalWeight = containerDetails.reduce((sum, c) => sum + c.weight, 0);

        // Get all truck numbers
        const getTruckNumbers = () => {
            const trucks = [];
            if (firstReceiver.dropoffdetails) {
                firstReceiver.dropoffdetails.forEach(drop => {
                    if (drop.plate_no && !trucks.includes(drop.plate_no)) {
                        trucks.push(drop.plate_no);
                    }
                });
            }
            return trucks.join(', ');
        };

        // Get commodities
        const getCommodities = () => {
            const commodities = [];
            shippingDetails.forEach(detail => {
                if (detail.category && !commodities.includes(detail.category)) {
                    commodities.push(detail.category);
                }
            });
            return commodities.join(', ');
        };

        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, '-');

        // Generate consignment number
        const consignmentNumber = `CNS-${safeOrder.id || 'XXXX'}-${new Date().getTime()}`;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wharfage Consignment Note</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 13px;
            color: #000;
            line-height: 1.4;
            padding: 20px;
        }

        .container {
            max-width: 850px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .date-row {
            text-align: right;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .title {
            font-weight: bold;
            text-decoration: underline;
            font-size: 16px;
        }

        /* Top Boxes */
        .top-boxes {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
        }

        .box {
            flex: 1;
            border: 1px solid #000;
        }

        .box-label {
            padding: 2px 5px;
            border-bottom: 1px solid #000;
            min-height: 35px;
        }

        .box-content {
            height: auto;
            min-height: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5px;
        }

        .highlighted {
            font-weight: bold;
            color: #ff0000;
        }

        /* Container list inside box */
        .container-list {
            width: 100%;
        }
        
        .container-row {
            display: flex;
            border-bottom: 1px dashed #ccc;
            padding: 3px 0;
        }
        
        .container-row:last-child {
            border-bottom: none;
        }
        
        .container-number {
            flex: 2;
            text-align: left;
            padding-left: 5px;
        }
        
        .container-qty {
            flex: 1;
            text-align: center;
            border-left: 1px dashed #ccc;
        }
        
        .container-weight {
            flex: 1;
            text-align: center;
            border-left: 1px dashed #ccc;
        }

        /* Details Grid - Original Style */
        .details-grid {
            display: grid;
            grid-template-columns: 1.2fr 1.2fr 1fr;
            gap: 15px 10px;
            margin-bottom: 40px;
        }

        .underline {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 80px;
        }

        /* Summary Section - Original Style */
        .summary-bar {
            display: flex;
            align-items: center;
            gap: 30px;
            margin-bottom: 5px;
        }

        .summary-box {
            border: 1px solid #000;
            padding: 10px 40px;
            font-weight: bold;
            min-width: 200px;
        }

        .summary-text {
            font-weight: bold;
        }

        /* Certification - Original Style */
        .certification-box {
            border: 1px solid #000;
            padding: 15px;
            margin-bottom: 100px;
            width: 90%;
        }

        /* Footer - Original Style */
        .footer {
            display: flex;
            justify-content: space-between;
        }

        .sign-block {
            width: 300px;
        }

        .sign-line {
            border-top: 1px solid #000;
            margin-bottom: 5px;
        }

        .text-right {
            text-align: left;
        }
        
        /* Container info */
        .container-info {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .small-text {
            font-size: 11px;
            color: #666;
        }
        
        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="date-row">DATED: ${currentDate}</div>
            <div class="title">CONSIGNMENT NOTE: ${consignmentNumber}</div>
        </div>

         <div class="top-boxes">
            <div class="box">
                <div class="box-label">Custom CRN or Customs Machine number</div>
                <div class="box-content">${getSafeValue(safeOrder.customs_crn)}</div>
            </div>
            <div class="box">
                <div class="box-label">
                    <div class="container-info">
                        <span>Container No:</span>
                    </div>
                </div>
                <div class="box-content" style="padding: 0;">
                    ${firstReceiver.containers && firstReceiver.containers.length > 0
                ? firstReceiver.containers.map(container => `
                            <div style="width: 100%; text-align: center; box-sizing: border-box; padding: 8px; border-bottom: ${firstReceiver.containers.indexOf(container) < firstReceiver.containers.length - 1 ? '1px solid #ccc' : 'none'};">
                                ${container}
                            </div>
                        `).join('')
                : '<div style="padding: 8px;">N/A</div>'
            }
                </div>
            </div>
            <div class="box">
                <div class="box-label">Seal No</div>
                <div class="box-content">${getSafeValue(safeOrder.seal_no)}</div>
            </div>
        </div>

        <div class="details-grid">
            <div><strong>VESSEL:</strong> ${getSafeValue(safeOrder.consignment_vessel)}</div>
            <div><strong>Voyage:</strong> ${getSafeValue(safeOrder.consignment_voyage)}</div>
            <div><strong>SHIPPING LINE:</strong> ${getSafeValue(safeOrder.shipping_line)}</div>

            <div><strong>Dest:</strong> ${getPlaceName(getSafeValue(safeOrder.final_destination))}</div>
            <div><strong>Shipper:</strong> ${getSafeValue(firstReceiver.receivername)}</div>
            <div><strong>BOOKING NO:</strong> ${getSafeValue(safeOrder.rgl_booking_number)}</div>

            <div><strong>Comm:</strong> ${getCommodities() || 'N/A'}</div>
            <div><strong>Origin:</strong> ${getPlaceName(getSafeValue(safeOrder.place_of_loading))}</div>
            <div>
                <strong>GROSS Wt:</strong> <span class="underline">${totalWeight} KGS</span><br>
                <strong>NET Wt:</strong> <span class="underline">${totalWeight} KGS</span>
            </div>

            <div><strong>Status:</strong> ${getSafeValue(safeOrder.status)}</div>
            <div><strong class="underline">TRUCK NO</strong> ${getTruckNumbers() || getSafeValue(safeOrder.truck_number)}</div>
            <div><strong>TOTAL CTNS:</strong> <span class="underline">${totalPackages.toLocaleString()}</span></div>
        </div>

        <!-- Multiple summary boxes for each container -->
        ${containerDetails.map(container => `
        <div class="summary-bar">
            <div class="summary-box">${container.number}</div>
            <div class="summary-text">
                PKGS: ${container.quantity.toLocaleString()} &nbsp; GROSS WT: ${container.weight} KGS &nbsp; NET WT: ${container.weight} KGS
            </div>
        </div>
        `).join('')}

        <div class="certification-box">
            I / We hereby certify that goods mentioned in the accompanied packing list have been placed inside the
            container and the container has been sealed by me / us the particulars are true.
        </div>

        <div class="footer">
            <div class="sign-block">
                <div class="sign-line"></div>
                PICT/KICT/QICT Representative<br>Gate Clerk / Dmg Inspector
            </div>
            <div class="sign-block text-right">
                <div class="sign-line"></div>
                Name and Signature of Agent<br>Shipper / Consolidator with stamp
            </div>
        </div>
    </div>
</body>
</html>`;
    };

    const OrderAcknowledgementPrintableVersion = (orderData) => {
        const logoBase64 = logoPic;
        // Helper function to format date
        const formatDate = (dateString) => {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }) + ' ' + date.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return dateString || '';
            }
        };

        // Format current date and time
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const currentTime = new Date().toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Extract data from order object based on your response structure
        const senderName = orderData.sender_name || 'N/A';
        const senderContact = orderData.sender_contact || 'N/A';
        const senderEmail = orderData.sender_email || 'N/A';
        const senderRef = orderData.sender_ref || 'N/A';

        // Get first receiver data
        const receiver = orderData.receivers && orderData.receivers[0] ? orderData.receivers[0] : {};
        const receiverName = receiver.receivername || 'N/A';  // Fixed: receivername
        const receiverContact = receiver.receivercontact || 'N/A';  // Fixed: receivercontact
        const receiverAddress = receiver.receiveraddress || 'N/A';  // Fixed: receiveraddress
        const receiverEmail = receiver.receiveremail || 'N/A';  // Fixed: receiveremail

        // Get shipping details
        const shippingDetails = receiver.shippingdetails || [];  // Fixed: shippingdetails

        // Calculate totals
        let totalQty = 0;
        let totalWeight = 0;

        shippingDetails.forEach(item => {
            totalQty += parseInt(item.totalNumber || 0);
            totalWeight += parseFloat(item.weight || 0);
        });

        // If no shipping details, use receiver totals
        if (shippingDetails.length === 0) {
            totalQty = parseInt(receiver.totalnumber || 0) || parseInt(orderData.total_assigned_qty || 0);  // Fixed: totalnumber
            totalWeight = parseFloat(receiver.totalweight || 0);  // Fixed: totalweight
        }

        // Get container info
        const containers = receiver.containers || [];
        const containerInfo = containers.length > 0 ? containers.join(', ') : 'N/A';  // Show all containers

        // Get sender CNIC from sender_address (parse if needed)
        const extractCNIC = (address) => {
            if (!address) return '';
            const cnicMatch = address.match(/CNIC[:\s]*([0-9-]+)/i) || address.match(/[0-9]{5}-[0-9]{7}-[0-9]/);
            return cnicMatch ? cnicMatch[1] || cnicMatch[0] : '';
        };

        const senderCNIC = extractCNIC(orderData.sender_address) || orderData.sender_cnic || '';

        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Acknowledgement Printable Version</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                color: #333;
                line-height: 1.3;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
                width: 210mm;
                min-height: 297mm;
            }

            .document-container {
                background: #fff;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #ccc;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                min-height: 257mm;
            }

            /* Top Banner */
            .top-banner {
                background-color: #1a4731;
                color: white;
                text-align: center;
                padding: 10px;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 2px;
                margin-bottom: 20px;
            }

            /* Header Section */
            .header-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .logo-area {
                display: flex;
                align-items: center;
            }

            .logo-icon {
                width: 80px;
                margin-right: 15px;
            }

            .company-name img {
                width: 250px;
                height: auto;
            }

            .disclaimer-bubble {
                border: 2px solid #ff4d4d;
                border-radius: 50%;
                padding: 15px;
                width: 200px;
                text-align: center;
                color: #ff4d4d;
                font-size: 11px;
                font-weight: bold;
                min-height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Titles */
            .order-title {
                text-align: center;
                font-weight: bold;
                font-size: 18px;
                margin: 10px 0;
                text-transform: uppercase;
            }

            .dated-text {
                font-weight: bold;
                font-size: 13px;
                margin-bottom: 5px;
            }

            /* Tables */
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }

            th, td {
                border: 1px solid #777;
                padding: 8px;
                text-align: left;
                font-size: 12px;
                vertical-align: top;
            }

            .table-header {
                background-color: #f9f9f9;
                text-align: center;
                font-style: italic;
                font-weight: bold;
            }

            /* Small Text Sections */
            .small-red-text {
                color: #d35400;
                font-size: 10px;
                margin: 10px 0;
                line-height: 1.2;
            }

            .order-info-bar {
                display: flex;
                justify-content: space-between;
                margin: 15px 0;
                font-size: 13px;
                font-weight: bold;
            }

            .bold-declaration {
                font-size: 12px;
                font-weight: bold;
                font-style: italic;
                margin: 15px 0;
            }

            /* Footer */
            .terms-title {
                color: #ff4d4d;
                font-size: 14px;
                margin-top: 20px;
            }

            .terms-list {
                font-size: 10px;
                color: #2c3e50;
                padding-left: 0;
                list-style: none;
            }

            .terms-list li {
                margin-bottom: 3px;
            }

            .final-confirmation {
                text-align: center;
                font-weight: bold;
                margin-top: 30px;
                font-size: 14px;
            }

            /* Order Items Table */
            .order-items-table {
                margin: 20px 0;
            }

            .order-items-table .table-header {
                background-color: #1a4731;
                color: white;
            }

            .total-row {
                background-color: #f2f2f2;
                font-weight: bold;
            }

            /* Signature Section */
            .signature-section {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
            }

            .signature-box {
                text-align: center;
                border-top: 1px solid #333;
                padding-top: 10px;
                width: 45%;
            }

            /* Print-specific styles */
            @media print {
                body {
                    background-color: white;
                    padding: 0;
                }
                
                .document-container {
                    box-shadow: none;
                    border: none;
                    padding: 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="document-container">
            <div class="top-banner">STORAGE & DISTRIBUTION</div>

            <div class="header-section">
                <div class="logo-area">
                    <div class="company-name">
                            <img src="${logoBase64 || ''}" alt="Company Logo">
                    </div>
                </div>
                <div class="disclaimer-bubble">
                    In case of any Lost or Damage for Non-Insured Cargo. US$ 15 PER PKG claim would be adjusted
                </div>
            </div>

            <div class="order-title">ORDER ACKNOWLEDGEMENT</div>
            <div class="dated-text">Dated: ${currentDate} ${currentTime}</div>

            <table>
                <tr>
                    <td class="table-header" style="width: 50%;">Sender</td>
                    <td class="table-header" style="width: 50%;">Receiver</td>
                </tr>
                <tr>
                    <td>
                        <strong>${senderName}</strong><br><br>
                        Contact Person: ${senderName}<br>
                        Passport No: <br>
                        CNIC: ${senderCNIC || ''}<br>
                        Tel: ${senderContact}<br>
                        E-Mail: ${senderEmail}
                    </td>
                    <td>
                        <strong>${receiverName}</strong><br><br>
                        Contact Person: ${receiverName}<br>
                        Passport No: <br>
                        Emirates ID: <br>
                        Tel: ${receiverContact}<br>
                        E-Mail: ${receiverEmail}
                    </td>
                </tr>
            </table>

            <div class="small-red-text">
                This paper serves as a legal responsibility of sender & receiver for the contents of the cargo being shipped
                through the company Royal Gulf Shipping & Logistics LLC. The Sender and Receiver will be responsible for any
                loss/ damage which results in case of any prohibited items attempted to be shipped through this order.
            </div>

            <div class="order-title">ACKNOWLEDGMENT AND ACCEPTANCE OF ORDER</div>

            <div class="order-info-bar">
                <div><u> Order Date:</u> <span>${formatDate(orderData.created_at)}</span></div>
                <div><u> Order Number:</u> <span>${orderData.booking_ref || 'N/A'}</span></div>
                <div><u> Customer No:</u> <span>${orderData.rgl_booking_number || 'N/A'}</span></div>
            </div>

            <p style="font-size: 12px;">We are in receipt of your Order as detailed below:</p>

            <table class="order-items-table">
                <tr class="table-header">
                    <td>QTY</td>
                    <td>DESCRIPTION</td>
                    <td>Order No</td>
                    <td>Form No</td>
                    <td>Port of Loading</td>
                    <td>Port of Destination</td>
                </tr>
                ${shippingDetails.length > 0 ? shippingDetails.map(item => `
                <tr>
                    <td style="text-align: center;">${item.totalNumber || 0}</td>
                    <td>${item.category || item.subcategory || 'N/A'}</td>
                    <td style="text-align: center;">${item.itemRef || orderData.booking_ref || 'N/A'}</td>
                    <td>${containerInfo}</td>
                    <td>${getPlaceName(orderData.place_of_loading) || 'N/A'}</td>
                    <td>${getPlaceName(orderData.final_destination) || 'N/A'}</td>
                </tr> 
                `).join('') : `
                <tr>
                    <td style="text-align: center;">${totalQty || 0}</td>
                    <td>General Items</td>
                    <td style="text-align: center;">${orderData.booking_ref || 'N/A'}</td>
                    <td>${containerInfo}</td>
                    <td>${orderData.place_of_loading || 'N/A'}</td>
                    <td>${orderData.final_destination || 'N/A'}</td>
                </tr>
                `}
                <tr class="total-row">
                    <td style="text-align: center;">${totalQty}</td>
                    <td colspan="5">TOTAL PACKAGES: ${totalQty} | TOTAL WEIGHT: ${totalWeight} kg</td>
                </tr>
            </table>

            <div class="dated-text" style="text-decoration: underline;">Mode: ${orderData.transport_type || 'Drop Off'}</div>

            <div class="bold-declaration">
                I, the sender, whose name and address are given on the item, certify that the particulars given in this
                declaration are correct and that this item does not contain any dangerous article or articles prohibited by
                legislation or by <u>postal or customs regulations.</u>
            </div>

            <div class="terms-title">Terms & Conditions</div>
            <ul class="terms-list">
                <li>*All the information provided on order acknowledgement is as per the information provided by the sender.</li>
                <li>*Customer (Sender/Receiver) acknowledges that the company will not be held liable for any loss or damage
                    caused by customs inspections, fair wear & tear & Natural Disaster.</li>
                <li>*All shipments will be inspected by Customs / ANF teams at terminals and there being if any extra cost
                    incurred will be borne by the sender Or receiver.</li>
                <li>*Transit time provided are tentative and could be change with / without prior notice upon vessels and
                    customs clearance.</li>
            </ul>

            <div class="signature-section">
                <div class="signature-box">
                    <strong>Sender's Signature</strong><br>
                    ${senderName}
                </div>
                <div class="signature-box">
                    <strong>Receiver's Signature</strong><br>
                    ${receiverName}
                </div>
            </div>

            <div class="final-confirmation">
                We confirm acceptance of said order, with terms as stated above.
            </div>

        </div>
    </body>
    </html>
    `;
    };

    const OrderConfirmationAndAcceptanceDubaiReceiver = (orderData) => {
        // Logo ko directly use karo
        const logoBase64 = logoPic; // Direct use karo, await nahi

        // Helper function to format date
        const formatDate = (dateString) => {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            } catch (e) {
                return dateString || '';
            }
        };

        // Format current date
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Expected ship date (7 days from now)
        const expectedShipDate = new Date();
        expectedShipDate.setDate(expectedShipDate.getDate() + 7);
        const formattedShipDate = expectedShipDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
        });

        // Expected delivery date (17 days from now - 10 days transit)
        const expectedDeliveryDate = new Date();
        expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 17);
        const formattedDeliveryDate = expectedDeliveryDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Extract data from order object
        const senderName = orderData.sender_name || '';
        const senderContact = orderData.sender_contact || '';
        const senderEmail = orderData.sender_email || '';
        const senderAddress = orderData.sender_address || '';

        // Get first receiver data
        const receiver = orderData.receivers && orderData.receivers[0] ? orderData.receivers[0] : {};
        const receiverName = receiver.receivername || '';
        const receiverContact = receiver.receivercontact || '';
        const receiverAddress = receiver.receiveraddress || '';
        const receiverEmail = receiver.receiveremail || '';

        // Get shipping details
        const shippingDetails = receiver.shippingdetails || [];

        // Calculate totals
        let totalQty = 0;

        shippingDetails.forEach(item => {
            totalQty += parseInt(item.totalNumber || 0);
        });

        // If no shipping details, use receiver totals
        if (shippingDetails.length === 0) {
            totalQty = parseInt(receiver.totalnumber || 0) || parseInt(orderData.total_assigned_qty || 425);
        }

        // Get container info for marks
        const containers = receiver.containers || [];
        const containerInfo = containers.length > 0 ? containers.join(', ') : 'ABC XYZ';

        // Get category/description
        const getDescription = () => {
            if (shippingDetails.length > 0) {
                return shippingDetails[0].category || shippingDetails[0].subcategory || '';
            }
            return '';
        };


        // Get order number/item reference
        const getOrderNo = () => {
            if (shippingDetails.length > 0 && shippingDetails[0].itemRef) {
                return shippingDetails[0].itemRef;
            }
            return orderData.booking_ref || '5017';
        };

        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Royal Gulf</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                font-size: 12px; 
                color: #333; 
                margin: 0;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container { 
                width: 800px; 
                margin: 0 auto; 
                border: 1px solid #ccc; 
                padding: 10px; 
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            
            /* Header Section */
            .header-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 10px;
            }
            .logo-text { 
                color: #e67e22; 
                font-weight: bold; 
                font-size: 18px; 
            }
            .sub-logo { 
                font-size: 10px; 
                color: #555; 
            }
            .main-title { 
                font-size: 20px; 
                font-weight: bold; 
            }
            
            /* General Table Styling */
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 0px; 
            }
            th, td { 
                padding: 4px; 
                vertical-align: top; 
            }
            
            .red-text { 
                color: red; 
                font-weight: 500;
            }
            .golden-text {
                color: #b8860b;
                font-weight: 500;
            }
            .label-cell { 
                font-weight: bold; 
                background-color: #f9f9f9; 
                width: 15%; 
            }
            
            /* Sections */
            .section-header { 
                font-weight: bold; 
                text-align: center; 
                background-color: white; 
                padding: 5px; 
                font-size: 16px; 
                margin: 10px 0;
            }
            .disclaimer { 
                font-size: 11px; 
                color: #b8860b; 
                padding: 5px; 
                margin: 10px 0;
            }
            
            .footer-sign { 
                height: 60px; 
            }
            
            .logo-img {
                max-width: 180px;
                max-height: 60px;
            }
            
            @media print {
                body {
                    background-color: white;
                    padding: 0;
                }
                .container {
                    box-shadow: none;
                    border: 1px solid #ccc;
                }
            }
        </style>
    </head>
    <body>

    <div class="container">
        <table class="header-table" style="border:none;">
            <tr style="border:none;display: flex;align-items: center;gap: 125px;">
                <td style="border:none;">
                    ${logoBase64 ?
                `<img src="${logoBase64}" alt="Royal Gulf Logo" class="logo-img"><br>` :
                `<span class="logo-text">RoyalGulf</span><br>`
            }
                </td>
                <td style="border:none; ">
                    <div class="main-title">ORDER CONFIRMATION</div>
                </td>
            </tr>
        </table>

        <table>
            <tr>
                <td class="label-cell">Dated</td>
                <td class="red-text" colspan="2">${currentDate}</td>
            </tr>
            <tr style="background: #eee; font-weight: bold;     border: 1px solid #aaa;">
                <td style="width: 50%;">TO</td>
                <td colspan="2">FROM</td>
            </tr>
            <tr>
                <td class="red-text" style="white-space: pre-line;     border: 1px solid #aaa;">
                    ${senderName}<br>
                    ${senderAddress.replace(/, /g, ',<br>')}<br>
                    Contact Person: ${senderName}<br>
                    Passport No: XXXXXX<br>
                    CNIC: XXXXXX<br>
                    Tel: ${senderContact}<br>
                    E-Mail: ${senderEmail}
                </td>
                <td class="red-text" colspan="2" style="white-space: pre-line;     border: 1px solid #aaa;">
                    ${receiverName}<br>
                    ${receiverAddress.replace(/, /g, ',<br>')}<br>
                    Contact Person: ${receiverName}<br>
                    Passport No:<br>
                    Emirates ID #<br>
                    Tel: ${receiverContact}<br>
                    E-Mail: ${receiverEmail}
                </td>
            </tr>
        </table>

        <div class="disclaimer golden-text">
            This paper serves as an legal responsibility of sender & receiver for the contents of the cargo being shipped through the company Royal Gulf Shipping & Logistics LLC. The Sender and Receiver will be only responsible for any loss / damages which results in case of any prohibited items attempted to be shipped through this order.
        </div>

        <div class="section-header">ACKNOWLEDGMENT AND ACCEPTANCE OF ORDER</div>

        <table>
            <tr>
                <td><b>Order Date:</b> <span class="red-text">${formatDate(orderData.created_at) || '15/08/11'}</span></td>
                <td><b>Order Number:</b> <span class="red-text">${orderData.booking_ref || '5017'}</span></td>
                <td><b>Customer No:</b> <span class="red-text">${orderData.rgl_booking_number || 'Sender BB Sys #'}</span></td>
            </tr>
        </table>

        <table>
            <tr style="text-align: center; font-weight: bold; background: #eee;     border: 1px solid #aaa;">
                <td style="width: 10%;">QTY</td>
                <td style="width: 30%;">DESCRIPTION</td>
                <td style="width: 15%;">Order No</td>
                <td style="width: 15%;">Marks & No</td>
                <td style="width: 15%;">Port of Loading</td>
                <td style="width: 15%;">Port of Destination</td>
            </tr>
            <tr style="height: 60px; text-align: center;     border: 1px solid #aaa;">
                <td class="red-text">${totalQty}</td>
                <td class="red-text">${getDescription()}</td>
                <td class="red-text">${getOrderNo()}</td>
                <td class="red-text">${containerInfo}</td>
                <td class="red-text">${getPlaceName(orderData.place_of_loading)}</td>
                <td class="red-text">${getPlaceName(orderData.final_destination)}</td>
            </tr>
            <tr>
                <td colspan="4" rowspan="2"><b>Mode:</b> <span class="red-text">${orderData.transport_type || 'Sea Shipment'}</span></td>
                <td style="text-align: right;"><b>SUBTOTAL:</b></td>
                <td style="text-align: center;">TBC</td>
            </tr>
            <tr>
                <td style="text-align: right; font-size: 9px;">FREIGHT SURCHARGE</td>
                <td style="text-align: center;">N/a</td>
            </tr>
            <tr>
                <td colspan="4">
                    <b>EXPECTED SHIP DATE:</b> <span class="red-text">${formattedShipDate}</span><br>
                    <b>TRANSIT TIME:</b> <span class="red-text">10 Days ( Expected Delivery ${formattedDeliveryDate} )</span>
                </td>
                <td style="text-align: right; font-weight: bold;">TOTAL</td>
                <td style="text-align: center;">N/A</td>
            </tr>
        </table>

        <table>
            <tr style="background: #eee; font-weight: bold; border: 1px solid #aaa;" >
                <td style="width: 50%;">BILL TO: <span style="font-weight: normal;">(CUSTOMER # 117788)</span></td>
                <td style="width: 50%;">SHIP TO:</td>
            </tr>
            <tr class="red-text">
                <td>
                    Either of the Party from<br>sender or receiver paying the Invoice<br>
                    <span style="color: black;">Attn: ${senderName.split(' ')[0] || 'AFZAL'}</span><br>
                    Tel: ${senderContact}
                </td>
                <td>
                    Individual or company suppose to be the<br>recipient of the consignment<br>
                    <span style="color: black;">Attn: ${receiverName.split(' ')[0] || 'Abbas'}</span><br>
                    Tel: ${receiverContact}
                </td>
            </tr>
        </table>

        <div style="text-align: center; font-weight: bold; padding: 5px;  margin: 10px 0;">
            We confirm acceptance of said order, with terms as stated above.
        </div>

        <table style="margin-top: 10px;">
            <tr>
                <td style="width: 15%; border-bottom: none;"><b>Signature:</b></td>
                <td rowspan="2" style="text-align: center; padding: 8px;">
                    Digitally Signed through verified login and OTP for ID verification<br>
                    <b>Time & Date Stamp:</b> ${currentDate} ${new Date().toLocaleTimeString()}<br>
                    <b>Email Addressed Used:</b> ${senderEmail}
                </td>
            </tr>
            <tr>
                <td style="border-top: none;"><b>Name:</b> ${senderName}</td>
            </tr>
        </table>
    </div>

    </body>
    </html>
    `;
    };

    const OrderConfirmationAndAcceptanceKarachiReceiver = (orderData) => {
        // Logo ko directly use karo
        const logoBase64 = logoCAS; // Direct use karo, await nahi

        // Helper function to format date
        const formatDate = (dateString) => {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            } catch (e) {
                return dateString || '';
            }
        };

        // Format current date
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Expected ship date (7 days from now)
        const expectedShipDate = new Date();
        expectedShipDate.setDate(expectedShipDate.getDate() + 7);
        const formattedShipDate = expectedShipDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
        });

        // Expected delivery date (17 days from now - 10 days transit)
        const expectedDeliveryDate = new Date();
        expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 17);
        const formattedDeliveryDate = expectedDeliveryDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Extract data from order object
        const senderName = orderData.sender_name || '';
        const senderContact = orderData.sender_contact || '';
        const senderEmail = orderData.sender_email || '';
        const senderAddress = orderData.sender_address || '';

        // Get first receiver data
        const receiver = orderData.receivers && orderData.receivers[0] ? orderData.receivers[0] : {};
        const receiverName = receiver.receivername || '';
        const receiverContact = receiver.receivercontact || '';
        const receiverAddress = receiver.receiveraddress || '';
        const receiverEmail = receiver.receiveremail || '';

        // Get shipping details
        const shippingDetails = receiver.shippingdetails || [];

        // Calculate totals
        let totalQty = 0;

        shippingDetails.forEach(item => {
            totalQty += parseInt(item.totalNumber || 0);
        });

        // If no shipping details, use receiver totals
        if (shippingDetails.length === 0) {
            totalQty = parseInt(receiver.totalnumber || 0) || parseInt(orderData.total_assigned_qty || 425);
        }

        // Get container info for marks
        const containers = receiver.containers || [];
        const containerInfo = containers.length > 0 ? containers.join(', ') : 'ABC XYZ';

        // Get category/description
        const getDescription = () => {
            if (shippingDetails.length > 0) {
                return shippingDetails[0].category || shippingDetails[0].subcategory || '';
            }
            return '';
        };


        // Get order number/item reference
        const getOrderNo = () => {
            if (shippingDetails.length > 0 && shippingDetails[0].itemRef) {
                return shippingDetails[0].itemRef;
            }
            return orderData.booking_ref || '5017';
        };

        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Cargo Aviation System</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                font-size: 12px; 
                color: #333; 
                margin: 0;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container { 
                width: 800px; 
                margin: 0 auto; 
                border: 1px solid #ccc; 
                padding: 10px; 
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            
            /* Header Section */
            .header-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 10px;
            }
            .logo-text { 
                color: #e67e22; 
                font-weight: bold; 
                font-size: 18px; 
            }
            .sub-logo { 
                font-size: 10px; 
                color: #555; 
            }
            .main-title { 
                font-size: 20px; 
                font-weight: bold; 
            }
            
            /* General Table Styling */
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 0px; 
            }
            th, td { 
                padding: 4px; 
                vertical-align: top; 
            }
            
            .red-text { 
                color: red; 
                font-weight: 500;
            }
            .golden-text {
                color: #b8860b;
                font-weight: 500;
            }
            .label-cell { 
                font-weight: bold; 
                background-color: #f9f9f9; 
                width: 15%; 
            }
            
            /* Sections */
            .section-header { 
                font-weight: bold; 
                text-align: center; 
                background-color: white; 
                padding: 5px; 
                font-size: 16px; 
                margin: 10px 0;
            }
            .disclaimer { 
                font-size: 11px; 
                color: #b8860b; 
                padding: 5px; 
                margin: 10px 0;
            }
            
            .footer-sign { 
                height: 60px; 
            }
            
            .logo-img {
                max-width: 180px;
                max-height: 60px;
            }
            
            @media print {
                body {
                    background-color: white;
                    padding: 0;
                }
                .container {
                    box-shadow: none;
                    border: 1px solid #ccc;
                }
            }
        </style>
    </head>
    <body>

    <div class="container">
        <table class="header-table" style="border:none;">
            <tr style="border:none;display: flex;align-items: center;gap: 125px;">
                <td style="border:none;">
                    ${logoBase64 ?
                `<img src="${logoBase64}" alt="Royal Gulf Logo" class="logo-img"><br>` :
                `<span class="logo-text">RoyalGulf</span><br>`
            }
                </td>
                <td style="border:none; ">
                    <div class="main-title">ORDER CONFIRMATION</div>
                </td>
            </tr>
        </table>

        <table>
            <tr>
                <td class="label-cell">Dated</td>
                <td class="red-text" colspan="2">${currentDate}</td>
            </tr>
            <tr style="background: #eee; font-weight: bold;     border: 1px solid #aaa;">
                <td style="width: 50%;">TO</td>
                <td colspan="2">FROM</td>
            </tr>
            <tr>
                <td class="red-text" style="white-space: pre-line;     border: 1px solid #aaa;">
                    ${senderName}<br>
                    ${senderAddress.replace(/, /g, ',<br>')}<br>
                    Contact Person: ${senderName}<br>
                    Passport No: XXXXXX<br>
                    CNIC: XXXXXX<br>
                    Tel: ${senderContact}<br>
                    E-Mail: ${senderEmail}
                </td>
                <td class="red-text" colspan="2" style="white-space: pre-line;     border: 1px solid #aaa;">
                    ${receiverName}<br>
                    ${receiverAddress.replace(/, /g, ',<br>')}<br>
                    Contact Person: ${receiverName}<br>
                    Passport No:<br>
                    Emirates ID #<br>
                    Tel: ${receiverContact}<br>
                    E-Mail: ${receiverEmail}
                </td>
            </tr>
        </table>

        <div class="disclaimer golden-text">
            This paper serves as an legal responsibility of sender & receiver for the contents of the cargo being shipped through the company Cargo Aviation Systems (Pvt.) Ltd. The Sender and Receiver will be only responsible for any loss / damages which results in case of any prohibited items attempted to be shipped through this order.
        </div>

        <div class="section-header">ACKNOWLEDGMENT AND ACCEPTANCE OF ORDER</div>

        <table>
            <tr>
                <td><b>Order Date:</b> <span class="red-text">${formatDate(orderData.created_at) || '15/08/11'}</span></td>
                <td><b>Order Number:</b> <span class="red-text">${orderData.booking_ref || '5017'}</span></td>
                <td><b>Customer No:</b> <span class="red-text">${orderData.rgl_booking_number || 'Sender BB Sys #'}</span></td>
            </tr>
        </table>

        <table>
            <tr style="text-align: center; font-weight: bold; background: #eee;     border: 1px solid #aaa;">
                <td style="width: 10%;">QTY</td>
                <td style="width: 30%;">DESCRIPTION</td>
                <td style="width: 15%;">Order No</td>
                <td style="width: 15%;">Marks & No</td>
                <td style="width: 15%;">Port of Loading</td>
                <td style="width: 15%;">Port of Destination</td>
            </tr>
            <tr style="height: 60px; text-align: center;     border: 1px solid #aaa;">
                <td class="red-text">${totalQty}</td>
                <td class="red-text">${getDescription()}</td>
                <td class="red-text">${getOrderNo()}</td>
                <td class="red-text">${containerInfo}</td>
                <td class="red-text">${getPlaceName(orderData.place_of_loading)}</td>
                <td class="red-text">${getPlaceName(orderData.final_destination)}</td>
            </tr>
            <tr>
                <td colspan="4" rowspan="2"><b>Mode:</b> <span class="red-text">${orderData.transport_type || 'Sea Shipment'}</span></td>
                <td style="text-align: right;"><b>SUBTOTAL:</b></td>
                <td style="text-align: center;">TBC</td>
            </tr>
            <tr>
                <td style="text-align: right; font-size: 9px;">FREIGHT SURCHARGE</td>
                <td style="text-align: center;">N/a</td>
            </tr>
            <tr>
                <td colspan="4">
                    <b>EXPECTED SHIP DATE:</b> <span class="red-text">${formattedShipDate}</span><br>
                    <b>TRANSIT TIME:</b> <span class="red-text">10 Days ( Expected Delivery ${formattedDeliveryDate} )</span>
                </td>
                <td style="text-align: right; font-weight: bold;">TOTAL</td>
                <td style="text-align: center;">N/A</td>
            </tr>
        </table>

        <table>
            <tr style="background: #eee; font-weight: bold; border: 1px solid #aaa;" >
                <td style="width: 50%;">BILL TO: <span style="font-weight: normal;">(CUSTOMER # 117788)</span></td>
                <td style="width: 50%;">SHIP TO:</td>
            </tr>
            <tr class="red-text">
                <td>
                    Either of the Party from<br>sender or receiver paying the Invoice<br>
                    <span style="color: black;">Attn: ${senderName.split(' ')[0] || 'AFZAL'}</span><br>
                    Tel: ${senderContact}
                </td>
                <td>
                    Individual or company suppose to be the<br>recipient of the consignment<br>
                    <span style="color: black;">Attn: ${receiverName.split(' ')[0] || 'Abbas'}</span><br>
                    Tel: ${receiverContact}
                </td>
            </tr>
        </table>

        <div style="text-align: center; font-weight: bold; padding: 5px;  margin: 10px 0;">
            We confirm acceptance of said order, with terms as stated above.
        </div>

        <table style="margin-top: 10px;">
            <tr>
                <td style="width: 15%; border-bottom: none;"><b>Signature:</b></td>
                <td rowspan="2" style="text-align: center; padding: 8px;">
                    Digitally Signed through verified login and OTP for ID verification<br>
                    <b>Time & Date Stamp:</b> ${currentDate} ${new Date().toLocaleTimeString()}<br>
                    <b>Email Addressed Used:</b> ${senderEmail}
                </td>
            </tr>
            <tr>
                <td style="border-top: none;"><b>Name:</b> ${senderName}</td>
            </tr>
        </table>
    </div>

    </body>
    </html>
    `;

    };

    const OrderConfirmationAndAcceptanceUKReceiver = (orderData) => {
        // Logo ko directly use karo
        const logoBase64 = logoMFD; // Direct use karo, await nahi

        // Helper function to format date
        const formatDate = (dateString) => {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            } catch (e) {
                return dateString || '';
            }
        };

        // Format current date
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Expected ship date (7 days from now)
        const expectedShipDate = new Date();
        expectedShipDate.setDate(expectedShipDate.getDate() + 7);
        const formattedShipDate = expectedShipDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
        });

        // Expected delivery date (17 days from now - 10 days transit)
        const expectedDeliveryDate = new Date();
        expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 17);
        const formattedDeliveryDate = expectedDeliveryDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Extract data from order object
        const senderName = orderData.sender_name || '';
        const senderContact = orderData.sender_contact || '';
        const senderEmail = orderData.sender_email || '';
        const senderAddress = orderData.sender_address || '';

        // Get first receiver data
        const receiver = orderData.receivers && orderData.receivers[0] ? orderData.receivers[0] : {};
        const receiverName = receiver.receivername || '';
        const receiverContact = receiver.receivercontact || '';
        const receiverAddress = receiver.receiveraddress || '';
        const receiverEmail = receiver.receiveremail || '';

        // Get shipping details
        const shippingDetails = receiver.shippingdetails || [];

        // Calculate totals
        let totalQty = 0;

        shippingDetails.forEach(item => {
            totalQty += parseInt(item.totalNumber || 0);
        });

        // If no shipping details, use receiver totals
        if (shippingDetails.length === 0) {
            totalQty = parseInt(receiver.totalnumber || 0) || parseInt(orderData.total_assigned_qty || 425);
        }

        // Get container info for marks
        const containers = receiver.containers || [];
        const containerInfo = containers.length > 0 ? containers.join(', ') : 'ABC XYZ';

        // Get category/description
        const getDescription = () => {
            if (shippingDetails.length > 0) {
                return shippingDetails[0].category || shippingDetails[0].subcategory || '';
            }
            return '';
        };


        // Get order number/item reference
        const getOrderNo = () => {
            if (shippingDetails.length > 0 && shippingDetails[0].itemRef) {
                return shippingDetails[0].itemRef;
            }
            return orderData.booking_ref || '5017';
        };

        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Messiah Freight</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                font-size: 12px; 
                color: #333; 
                margin: 0;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container { 
                width: 800px; 
                margin: 0 auto; 
                border: 1px solid #ccc; 
                padding: 10px; 
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            
            /* Header Section */
            .header-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 10px;
            }
            .logo-text { 
                color: #e67e22; 
                font-weight: bold; 
                font-size: 18px; 
            }
            .sub-logo { 
                font-size: 10px; 
                color: #555; 
            }
            .main-title { 
                font-size: 20px; 
                font-weight: bold; 
            }
            
            /* General Table Styling */
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 0px; 
            }
            th, td { 
                padding: 4px; 
                vertical-align: top; 
            }
            
            .red-text { 
                color: red; 
                font-weight: 500;
            }
            .golden-text {
                color: #b8860b;
                font-weight: 500;
            }
            .label-cell { 
                font-weight: bold; 
                background-color: #f9f9f9; 
                width: 15%; 
            }
            
            /* Sections */
            .section-header { 
                font-weight: bold; 
                text-align: center; 
                background-color: white; 
                padding: 5px; 
                font-size: 16px; 
                margin: 10px 0;
            }
            .disclaimer { 
                font-size: 11px; 
                color: #b8860b; 
                padding: 5px; 
                margin: 10px 0;
            }
            
            .footer-sign { 
                height: 60px; 
            }
            
            .logo-img {
                max-width: 180px;
                max-height: 60px;
            }
            
            @media print {
                body {
                    background-color: white;
                    padding: 0;
                }
                .container {
                    box-shadow: none;
                    border: 1px solid #ccc;
                }
            }
        </style>
    </head>
    <body>

    <div class="container">
        <table class="header-table" style="border:none;">
            <tr style="border:none;display: flex;align-items: center;gap: 125px;">
                <td style="border:none;">
                    ${logoBase64 ?
                `<img src="${logoBase64}" alt="Royal Gulf Logo" class="logo-img"><br>` :
                `<span class="logo-text">RoyalGulf</span><br>`
            }
                </td>
                <td style="border:none; ">
                    <div class="main-title">ORDER CONFIRMATION</div>
                </td>
            </tr>
        </table>

        <table>
            <tr>
                <td class="label-cell">Dated</td>
                <td class="red-text" colspan="2">${currentDate}</td>
            </tr>
            <tr style="background: #eee; font-weight: bold;     border: 1px solid #aaa;">
                <td style="width: 50%;">TO</td>
                <td colspan="2">FROM</td>
            </tr>
            <tr>
                <td class="red-text" style="white-space: pre-line;     border: 1px solid #aaa;">
                    ${senderName}<br>
                    ${senderAddress.replace(/, /g, ',<br>')}<br>
                    Contact Person: ${senderName}<br>
                    Passport No: XXXXXX<br>
                    CNIC: XXXXXX<br>
                    Tel: ${senderContact}<br>
                    E-Mail: ${senderEmail}
                </td>
                <td class="red-text" colspan="2" style="white-space: pre-line;     border: 1px solid #aaa;">
                    ${receiverName}<br>
                    ${receiverAddress.replace(/, /g, ',<br>')}<br>
                    Contact Person: ${receiverName}<br>
                    Passport No:<br>
                    Emirates ID #<br>
                    Tel: ${receiverContact}<br>
                    E-Mail: ${receiverEmail}
                </td>
            </tr>
        </table>

        <div class="disclaimer golden-text">
            This paper serves as an legal responsibility of sender & receiver for the contents of the cargo being shipped through the company Messiah Freight & Distributions UK Ltd. The Sender and Receiver will be only responsible for any loss / damages which results in case of any prohibited items attempted to be shipped through this order.
        </div>

        <div class="section-header">ACKNOWLEDGMENT AND ACCEPTANCE OF ORDER</div>

        <table>
            <tr>
                <td><b>Order Date:</b> <span class="red-text">${formatDate(orderData.created_at) || '15/08/11'}</span></td>
                <td><b>Order Number:</b> <span class="red-text">${orderData.booking_ref || '5017'}</span></td>
                <td><b>Customer No:</b> <span class="red-text">${orderData.rgl_booking_number || 'Sender BB Sys #'}</span></td>
            </tr>
        </table>

        <table>
            <tr style="text-align: center; font-weight: bold; background: #eee;     border: 1px solid #aaa;">
                <td style="width: 10%;">QTY</td>
                <td style="width: 30%;">DESCRIPTION</td>
                <td style="width: 15%;">Order No</td>
                <td style="width: 15%;">Marks & No</td>
                <td style="width: 15%;">Port of Loading</td>
                <td style="width: 15%;">Port of Destination</td>
            </tr>
            <tr style="height: 60px; text-align: center;     border: 1px solid #aaa;">
                <td class="red-text">${totalQty}</td>
                <td class="red-text">${getDescription()}</td>
                <td class="red-text">${getOrderNo()}</td>
                <td class="red-text">${containerInfo}</td>
                <td class="red-text">${getPlaceName(orderData.place_of_loading)}</td>
                <td class="red-text">${getPlaceName(orderData.final_destination)}</td>
            </tr>
            <tr>
                <td colspan="4" rowspan="2"><b>Mode:</b> <span class="red-text">${orderData.transport_type || 'Sea Shipment'}</span></td>
                <td style="text-align: right;"><b>SUBTOTAL:</b></td>
                <td style="text-align: center;">TBC</td>
            </tr>
            <tr>
                <td style="text-align: right; font-size: 9px;">FREIGHT SURCHARGE</td>
                <td style="text-align: center;">N/a</td>
            </tr>
            <tr>
                <td colspan="4">
                    <b>EXPECTED SHIP DATE:</b> <span class="red-text">${formattedShipDate}</span><br>
                    <b>TRANSIT TIME:</b> <span class="red-text">10 Days ( Expected Delivery ${formattedDeliveryDate} )</span>
                </td>
                <td style="text-align: right; font-weight: bold;">TOTAL</td>
                <td style="text-align: center;">N/A</td>
            </tr>
        </table>

        <table>
            <tr style="background: #eee; font-weight: bold; border: 1px solid #aaa;" >
                <td style="width: 50%;">BILL TO: <span style="font-weight: normal;">(CUSTOMER # 117788)</span></td>
                <td style="width: 50%;">SHIP TO:</td>
            </tr>
            <tr class="red-text">
                <td>
                    Either of the Party from<br>sender or receiver paying the Invoice<br>
                    <span style="color: black;">Attn: ${senderName.split(' ')[0] || 'AFZAL'}</span><br>
                    Tel: ${senderContact}
                </td>
                <td>
                    Individual or company suppose to be the<br>recipient of the consignment<br>
                    <span style="color: black;">Attn: ${receiverName.split(' ')[0] || 'Abbas'}</span><br>
                    Tel: ${receiverContact}
                </td>
            </tr>
        </table>

        <div style="text-align: center; font-weight: bold; padding: 5px;  margin: 10px 0;">
            We confirm acceptance of said order, with terms as stated above.
        </div>

        <table style="margin-top: 10px;">
            <tr>
                <td style="width: 15%; border-bottom: none;"><b>Signature:</b></td>
                <td rowspan="2" style="text-align: center; padding: 8px;">
                    Digitally Signed through verified login and OTP for ID verification<br>
                    <b>Time & Date Stamp:</b> ${currentDate} ${new Date().toLocaleTimeString()}<br>
                    <b>Email Addressed Used:</b> ${senderEmail}
                </td>
            </tr>
            <tr>
                <td style="border-top: none;"><b>Name:</b> ${senderName}</td>
            </tr>
        </table>
    </div>

    </body>
    </html>
    `;
    };

    const MessiahBillofLading = (orderData) => {
        const getValue = (value) => {
            return (value && value !== '' && value !== null && value !== undefined) ? value : '';
        };

        // Format current date
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Extract data from order object
        const senderName = getValue(orderData.sender_name);
        const senderAddress = getValue(orderData.sender_address);
        const senderContact = getValue(orderData.sender_contact);

        // Get first receiver data
        const receiver = orderData.receivers && orderData.receivers[0] ? orderData.receivers[0] : {};
        const receiverName = getValue(receiver.receivername);
        const receiverContact = getValue(receiver.receivercontact);
        const receiverAddress = getValue(receiver.receiveraddress);

        // Get shipping details
        const shippingDetails = receiver.shippingdetails || [];

        // Get container details
        const containers = receiver.containers || [];

        // Build container rows for table
        const getContainerRows = () => {
            if (!shippingDetails.length) return '';

            let rows = '';
            shippingDetails.forEach(detail => {
                if (detail.containerDetails && detail.containerDetails.length) {
                    detail.containerDetails.forEach(containerDetail => {
                        const containerNum = containerDetail.container?.container_number || containerDetail.container_number || '';
                        const sealNo = ''; // Seal no not in API
                        const pkgs = containerDetail.total_number || '';
                        const grossWt = containerDetail.assign_weight ? `${containerDetail.assign_weight} KGS` : '';

                        if (containerNum) {
                            rows += `<tr><td>${containerNum} / 40'HC</td><td></td><td>${pkgs} PKG</td><td></td><td>${grossWt}</td></tr>`;
                        }
                    });
                }
            });
            return rows;
        };

        // Calculate total packages
        const totalPkgs = shippingDetails.reduce((sum, detail) => {
            if (detail.containerDetails) {
                return sum + detail.containerDetails.reduce((s, cd) => s + (parseInt(cd.total_number) || 0), 0);
            }
            return sum;
        }, 0);

        // Get vessel name
        const vesselName = getValue(orderData.consignment_vessel);
        const voyageNo = getValue(orderData.consignment_voyage);
        const vesselVoyage = vesselName && voyageNo ? `${vesselName} / ${voyageNo}` : vesselName || voyageNo || '';

        // Get container count
        const containerCount = containers.length ? `${containers.length}X40'HC` : '';

        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bill of Lading - Messiah Freight</title>
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 10px;
                margin: 0;
                padding: 20px;
                background-color: #f0f0f0;
            }
            .bl-container {
                width: 800px;
                margin: 0 auto;
                background-color: #fff;
                padding: 10px;
                border: 1px solid #ccc;
                position: relative;
                min-height: 1050px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10px;
            }
            .logo-section {
                display: flex;
                align-items: center;
            }
            .mfd-logo img {
                width: 80px;
                height: auto;
            }
            .company-name {
                font-size: 16px;
                font-weight: bold;
                color: #2b3a67;
            }
            .bl-title {
                text-align: right;
                line-height: 1.2;
            }
            .bl-title h1 {
                font-size: 18px;
                margin: 0;
            }
            .grid-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                border-top: 1px solid #000;
                border-left: 1px solid #000;
            }
            .cell {
                border-right: 1px solid #000;
                border-bottom: 1px solid #000;
                padding: 4px;
                min-height: 40px;
            }
            .label {
                font-size: 8px;
                color: #555;
                display: block;
                margin-bottom: 2px;
            }
            .content {
                font-weight: bold;
                text-transform: uppercase;
                white-space: pre-line;
            }
            .full-width {
                grid-column: span 2;
            }
            .four-cols {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
            }
            .description-area {
                min-height: 300px;
                padding: 15px;
                border-left: 1px solid #000;
                border-right: 1px solid #000;
                position: relative;
            }
            .table-data {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .table-data th {
                text-align: left;
                font-size: 9px;
                border-bottom: 1px solid #000;
                padding: 5px;
            }
            .table-data td {
                padding: 5px;
                font-weight: bold;
            }
            .footer {
                margin-top: 10px;
                border-top: 2px solid #000;
                padding-top: 10px;
            }
            .red-bar {
                height: 10px;
                background-color: #e63946;
                margin-top: 20px;
            }
            .empty-placeholder {
                height: 20px;
            }
        </style>
    </head>
    <body>

    <div class="bl-container">
        <div class="header">
            <div class="logo-section">
                <div class="mfd-logo"><img src="${logoMFD}" alt="Messiah Freight & Distributions UK Ltd Logo"></div>
                <div class="company-name">MESSIAH FREIGHT & DISTRIBUTORS UK LTD</div>
            </div>
            <div class="bl-title">
                <h1>Bill of Lading</h1>
                <div>Multimodal Transport<br>or Port-to-Port Shipment</div>
            </div>
        </div>

        <div class="grid-container">
            <div class="cell">
                <span class="label">Shipper</span>
                <div class="content">
                    ${senderName ? `${senderName}<br>` : ''}
                    ${senderAddress ? senderAddress.replace(/, /g, ',<br>') + '<br>' : ''}
                    ${senderContact ? `Tel: ${senderContact}` : ''}
                </div>
            </div>
            <div class="cell">
                <span class="label">B/L No. (also to be used as payment ref.)</span>
                <div class="content" style="font-size: 14px;">${getValue(orderData.booking_ref)}</div>
            </div>

            <div class="cell">
                <span class="label">Consignee</span>
                <div class="content">
                    ${receiverName ? `${receiverName}<br>` : ''}
                    ${receiverAddress ? receiverAddress.replace(/, /g, ',<br>') + '<br>' : ''}
                    ${receiverContact ? `Tel: ${receiverContact}` : ''}
                </div>
            </div>
            <div class="cell">
                <span class="label">Export Reference / Forwarding Agent</span>
                <div class="content"></div>
            </div>

            <div class="cell">
                <span class="label">Notify Party</span>
                <div class="content">
                    ${receiverName ? `${receiverName}<br>` : ''}
                    ${receiverAddress ? receiverAddress.replace(/, /g, ',<br>') + '<br>' : ''}
                    ${receiverContact ? `Tel: ${receiverContact}` : ''}
                </div>
            </div>
            <div class="cell">
                <span class="label">Destination Agent</span>
                <div class="content"></div>
            </div>
        </div>

        <div class="grid-container" style="border-top: none;">
            <div class="four-cols full-width">
                <div class="cell"><span class="label">Port of Loading</span><div class="content">${getPlaceName(orderData.place_of_loading) || getValue(orderData.place_of_loading)}</div></div>
                <div class="cell"><span class="label">Pre-carriage by</span><div class="content"></div></div>
                <div class="cell"><span class="label">Ocean Vessel / Voyage</span><div class="content">${vesselVoyage}</div></div>
                <div class="cell"><span class="label">Freight payable at</span><div class="content"></div></div>
            </div>
            <div class="four-cols full-width">
                <div class="cell"><span class="label">Place of Receipt</span><div class="content"></div></div>
                <div class="cell"><span class="label">Port of Discharge</span><div class="content">${getPlaceName(orderData.final_destination) || getValue(orderData.final_destination)}</div></div>
                <div class="cell"><span class="label">Place of Delivery</span><div class="content">${getPlaceName(orderData.final_destination) || getValue(orderData.final_destination)}</div></div>
                <div class="cell"><span class="label">Final Destination</span><div class="content">${getPlaceName(orderData.final_destination) || getValue(orderData.final_destination)}</div></div>
            </div>
        </div>

        <div class="description-area">
            <div style="display: flex; justify-content: space-between;">
                <div style="width: 20%;">
                    <span class="label">Marks & Nos. / No of Pkgs</span>
                    <div class="content" style="margin-top: 20px;">${totalPkgs ? totalPkgs + ' PKGS' : ''}</div>
                </div>
                <div style="width: 30%; text-align: left;">
                    <span class="label">Description of Goods</span>
                    <div class="content" style="margin-top: 20px; text-decoration: underline;">
                        ${containers.length ? containers.length + 'X40\'HC FCL CONTAINER SAID TO CONTAIN' : ''}
                    </div>
                    <div class="content" style="margin-top: 10px;">
                        ${containers.length ? containers.length + 'X40\'HC CONTAINER' : ''}<br>
                        ${totalPkgs ? 'STC ' + totalPkgs + ' PACKAGES' : ''}<br>
                        ${shippingDetails.length ? shippingDetails.map(d => d.category || d.subcategory).filter(Boolean).join(', ') : ''}
                    </div>
                    <div class="content" style="margin-top: 30px; font-size: 11px;">
                        ALL SORT OF DESTINATION CHARGES ON CONSIGNEE'S ACCOUNT
                    </div>
                </div>
                <div style="width: 20%; text-align: right;">
                    <span class="label">Gross Weight / Measurement</span>
                    <div class="content" style="margin-top: 20px;">
                        ${shippingDetails.reduce((sum, d) => sum + (parseFloat(d.weight) || 0), 0) ?
                'GROSS WT<br>' + shippingDetails.reduce((sum, d) => sum + (parseFloat(d.weight) || 0), 0).toFixed(2) + ' KGS' :
                ''}
                    </div>
                    <div class="content" style="margin-top: 40px;">CY/CY</div>
                </div>
            </div>

            ${getContainerRows() ? `
            <table class="table-data">
                <thead>
                    <tr>
                        <th>CONTAINER NO. SIZE</th>
                        <th>SEAL NO.</th>
                        <th>PKGS</th>
                        <th>NET WT</th>
                        <th>GROSS WT</th>
                    </tr>
                </thead>
                <tbody>
                    ${getContainerRows()}
                </tbody>
            </table>
            ` : ''}
            <div style="display: flex;justify-content: end;">
                    <p style="width: 200px;padding: 5px;border: 2px solid #000;font-size: 8px;font-weight: bold;">
                        All Terminal Charges & Demurrage Etc at the port of Discharge/ Destination as per line's tariff & At the Account of Consignee.
                    </p>
            </div>
        </div>

        

        <div class="grid-container">
            <div class="cell"><span class="label">Freight Details</span><div class="content"></div></div>
            <div class="cell"><span class="label">Total Number of Pkgs</span><div class="content">${containerCount}</div></div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: space-between;">
            <div style="width: 60%;">
                <p style="font-size: 7px;">RECEIVED for shpment specified above in apparent good order and condition unless otherwise stated
The Gods to be delivered at above mentioned Port of Discharge or Place of Delivery, whichever applies
SUBJECT TO Terms and Conditions contained on reverse side hereof, to which Merchant agrees by
accepting this Bill of Lading
IN WITNESS WHEREOF the number of onginal Bills of lading stated on this side next to this clause
have been signed, one of which being accomplished, the others to stand void, unless compulsorily
applicable law provides otherwise
*Applicable only when used for MULTI MODAL TRANSPORTATION.</p>
                <div class="content" style="margin-top: 10px;">LONDON , ${currentDate}</div>
            </div>
            <div style="text-align: right; width: 40%;">    
                <div class="content" style="margin-top: 10px;">
                    MESSIAH FREIGHT &<br>DISTRIBUTORS UK LTD
                </div>
            </div>
        </div>

        <div class="red-bar"></div>
        <div style="text-align: right; font-weight: bold; color: #2b3a67; font-size: 12px; margin-top: 5px;">
            MESSIAH FREIGHT & DISTRIBUTORS UK LTD
        </div>
    </div>

    </body>
    </html>
    `;
    };
    
    const RGSLBillofLading = (orderData) => {
        const getValue = (value) => {
            return (value && value !== '' && value !== null && value !== undefined) ? value : '';
        };

        // Format current date
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Extract data from order object
        const senderName = getValue(orderData.sender_name);
        const senderAddress = getValue(orderData.sender_address);
        const senderContact = getValue(orderData.sender_contact);

        // Get first receiver data
        const receiver = orderData.receivers && orderData.receivers[0] ? orderData.receivers[0] : {};
        const receiverName = getValue(receiver.receivername);
        const receiverContact = getValue(receiver.receivercontact);
        const receiverAddress = getValue(receiver.receiveraddress);

        // Get shipping details
        const shippingDetails = receiver.shippingdetails || [];

        // Get container details
        const containers = receiver.containers || [];

        // Build container rows for table
        const getContainerRows = () => {
            if (!shippingDetails.length) return '';

            let rows = '';
            shippingDetails.forEach(detail => {
                if (detail.containerDetails && detail.containerDetails.length) {
                    detail.containerDetails.forEach(containerDetail => {
                        const containerNum = containerDetail.container?.container_number || containerDetail.container_number || '';
                        const sealNo = ''; // Seal no not in API
                        const pkgs = containerDetail.total_number || '';
                        const grossWt = containerDetail.assign_weight ? `${containerDetail.assign_weight} KGS` : '';

                        if (containerNum) {
                            rows += `<tr><td>${containerNum} / 40'HC</td><td></td><td>${pkgs} PKG</td><td></td><td>${grossWt}</td></tr>`;
                        }
                    });
                }
            });
            return rows;
        };

        // Calculate total packages
        const totalPkgs = shippingDetails.reduce((sum, detail) => {
            if (detail.containerDetails) {
                return sum + detail.containerDetails.reduce((s, cd) => s + (parseInt(cd.total_number) || 0), 0);
            }
            return sum;
        }, 0);

        // Get vessel name
        const vesselName = getValue(orderData.consignment_vessel);
        const voyageNo = getValue(orderData.consignment_voyage);
        const vesselVoyage = vesselName && voyageNo ? `${vesselName} / ${voyageNo}` : vesselName || voyageNo || '';

        // Get container count
        const containerCount = containers.length ? `${containers.length}X40'HC` : '';

        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bill of Lading - Royal Gulf</title>
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 10px;
                margin: 0;
                padding: 20px;
                background-color: #f0f0f0;
            }
            .bl-container {
                width: 800px;
                margin: 0 auto;
                background-color: #fff;
                padding: 10px;
                border: 1px solid #ccc;
                position: relative;
                min-height: 1050px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10px;
            }
            .logo-section {
                display: flex;
                align-items: center;
            }
            .mfd-logo img {
                width: 180px;
                height: auto;
            }
            .company-name {
                font-size: 16px;
                font-weight: bold;
                color: #2b3a67;
            }
            .bl-title {
                text-align: right;
                line-height: 1.2;
            }
            .bl-title h1 {
                font-size: 18px;
                margin: 0;
            }
            .grid-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                border-top: 1px solid #000;
                border-left: 1px solid #000;
            }
            .cell {
                border-right: 1px solid #000;
                border-bottom: 1px solid #000;
                padding: 4px;
                min-height: 40px;
            }
            .label {
                font-size: 8px;
                color: #555;
                display: block;
                margin-bottom: 2px;
            }
            .content {
                font-weight: bold;
                text-transform: uppercase;
                white-space: pre-line;
            }
            .full-width {
                grid-column: span 2;
            }
            .four-cols {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
            }
            .description-area {
                min-height: 300px;
                padding: 15px;
                border-left: 1px solid #000;
                border-right: 1px solid #000;
                position: relative;
            }
            .table-data {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .table-data th {
                text-align: left;
                font-size: 9px;
                border-bottom: 1px solid #000;
                padding: 5px;
            }
            .table-data td {
                padding: 5px;
                font-weight: bold;
            }
            .footer {
                margin-top: 10px;
                border-top: 2px solid #000;
                padding-top: 10px;
            }
            .red-bar {
                height: 10px;
                background-color: #e63946;
                margin-top: 20px;
            }
            .empty-placeholder {
                height: 20px;
            }
        </style>
    </head>
    <body>

    <div class="bl-container">
        <div class="header">
            <div class="logo-section">
                <div class="mfd-logo"><img src="${logoPic}" alt="Royal Gulf"></div>
                <div class="company-name">ROYAL GULF SHIPPING & LOGISTICS LLC</div>
            </div>
            <div class="bl-title">
                <h1>Bill of Lading</h1>
                <div>Multimodal Transport<br>or Port-to-Port Shipment</div>
            </div>
        </div>

        <div class="grid-container">
            <div class="cell">
                <span class="label">Shipper</span>
                <div class="content">
                    ${senderName ? `${senderName}<br>` : ''}
                    ${senderAddress ? senderAddress.replace(/, /g, ',<br>') + '<br>' : ''}
                    ${senderContact ? `Tel: ${senderContact}` : ''}
                </div>
            </div>
            <div class="cell">
                <span class="label">B/L No. (also to be used as payment ref.)</span>
                <div class="content" style="font-size: 14px;">${getValue(orderData.booking_ref)}</div>
            </div>

            <div class="cell">
                <span class="label">Consignee</span>
                <div class="content">
                    ${receiverName ? `${receiverName}<br>` : ''}
                    ${receiverAddress ? receiverAddress.replace(/, /g, ',<br>') + '<br>' : ''}
                    ${receiverContact ? `Tel: ${receiverContact}` : ''}
                </div>
            </div>
            <div class="cell">
                <span class="label">Export Reference / Forwarding Agent</span>
                <div class="content"></div>
            </div>

            <div class="cell">
                <span class="label">Notify Party</span>
                <div class="content">
                    ${receiverName ? `${receiverName}<br>` : ''}
                    ${receiverAddress ? receiverAddress.replace(/, /g, ',<br>') + '<br>' : ''}
                    ${receiverContact ? `Tel: ${receiverContact}` : ''}
                </div>
            </div>
            <div class="cell">
                <span class="label">Destination Agent</span>
                <div class="content"></div>
            </div>
        </div>

        <div class="grid-container" style="border-top: none;">
            <div class="four-cols full-width">
                <div class="cell"><span class="label">Port of Loading</span><div class="content">${getPlaceName(orderData.place_of_loading) || getValue(orderData.place_of_loading)}</div></div>
                <div class="cell"><span class="label">Pre-carriage by</span><div class="content"></div></div>
                <div class="cell"><span class="label">Ocean Vessel / Voyage</span><div class="content">${vesselVoyage}</div></div>
                <div class="cell"><span class="label">Freight payable at</span><div class="content"></div></div>
            </div>
            <div class="four-cols full-width">
                <div class="cell"><span class="label">Place of Receipt</span><div class="content"></div></div>
                <div class="cell"><span class="label">Port of Discharge</span><div class="content">${getPlaceName(orderData.final_destination) || getValue(orderData.final_destination)}</div></div>
                <div class="cell"><span class="label">Place of Delivery</span><div class="content">${getPlaceName(orderData.final_destination) || getValue(orderData.final_destination)}</div></div>
                <div class="cell"><span class="label">Final Destination</span><div class="content">${getPlaceName(orderData.final_destination) || getValue(orderData.final_destination)}</div></div>
            </div>
        </div>

        <div class="description-area">
            <div style="display: flex; justify-content: space-between;">
                <div style="width: 20%;">
                    <span class="label">Marks & Nos. / No of Pkgs</span>
                    <div class="content" style="margin-top: 20px;">${totalPkgs ? totalPkgs + ' PKGS' : ''}</div>
                </div>
                <div style="width: 30%; text-align: left;">
                    <span class="label">Description of Goods</span>
                    <div class="content" style="margin-top: 20px; text-decoration: underline;">
                        ${containers.length ? containers.length + 'X40\'HC FCL CONTAINER SAID TO CONTAIN' : ''}
                    </div>
                    <div class="content" style="margin-top: 10px;">
                        ${containers.length ? containers.length + 'X40\'HC CONTAINER' : ''}<br>
                        ${totalPkgs ? 'STC ' + totalPkgs + ' PACKAGES' : ''}<br>
                        ${shippingDetails.length ? shippingDetails.map(d => d.category || d.subcategory).filter(Boolean).join(', ') : ''}
                    </div>
                    <div class="content" style="margin-top: 30px; font-size: 11px;">
                        ALL SORT OF DESTINATION CHARGES ON CONSIGNEE'S ACCOUNT
                    </div>
                </div>
                <div style="width: 20%; text-align: right;">
                    <span class="label">Gross Weight / Measurement</span>
                    <div class="content" style="margin-top: 20px;">
                        ${shippingDetails.reduce((sum, d) => sum + (parseFloat(d.weight) || 0), 0) ?
                'GROSS WT<br>' + shippingDetails.reduce((sum, d) => sum + (parseFloat(d.weight) || 0), 0).toFixed(2) + ' KGS' :
                ''}
                    </div>
                    <div class="content" style="margin-top: 40px;">CY/CY</div>
                </div>
            </div>

            ${getContainerRows() ? `
            <table class="table-data">
                <thead>
                    <tr>
                        <th>CONTAINER NO. SIZE</th>
                        <th>SEAL NO.</th>
                        <th>PKGS</th>
                        <th>NET WT</th>
                        <th>GROSS WT</th>
                    </tr>
                </thead>
                <tbody>
                    ${getContainerRows()}
                </tbody>
            </table>
            ` : ''}
            <div style="display: flex;justify-content: end;">
                    <p style="width: 200px;padding: 5px;border: 2px solid #000;font-size: 8px;font-weight: bold;">
                        All Terminal Charges & Demurrage Etc at the port of Discharge/ Destination as per line's tariff & At the Account of Consignee.
                    </p>
            </div>
        </div>

        

        <div class="grid-container">
            <div class="cell"><span class="label">Freight Details</span><div class="content"></div></div>
            <div class="cell"><span class="label">Total Number of Pkgs</span><div class="content">${containerCount}</div></div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: space-between;">
            <div style="width: 60%;">
                <p style="font-size: 7px;">RECEIVED for shpment specified above in apparent good order and condition unless otherwise stated
The Gods to be delivered at above mentioned Port of Discharge or Place of Delivery, whichever applies
SUBJECT TO Terms and Conditions contained on reverse side hereof, to which Merchant agrees by
accepting this Bill of Lading
IN WITNESS WHEREOF the number of onginal Bills of lading stated on this side next to this clause
have been signed, one of which being accomplished, the others to stand void, unless compulsorily
applicable law provides otherwise
*Applicable only when used for MULTI MODAL TRANSPORTATION.</p>
                <div class="content" style="margin-top: 10px;">LONDON , ${currentDate}</div>
            </div>
            <div style="text-align: right; width: 40%;">    
                <div class="content" style="margin-top: 10px;">
                    MESSIAH FREIGHT &<br>DISTRIBUTORS UK LTD
                </div>
            </div>
        </div>

        <div class="red-bar"></div>
        <div style="text-align: right; font-weight: bold; color: #2b3a67; font-size: 12px; margin-top: 5px;">
            MESSIAH FREIGHT & DISTRIBUTORS UK LTD
        </div>
    </div>

    </body>
    </html>
    `;
    };


    const KYCDubaiCompany = (orderData) => {
        const getValue = (value) => {
            return (value && value !== '' && value !== null && value !== undefined) ? value : '';
        };

        // Format current date
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Extract data from order object
        const senderName = getValue(orderData.sender_name);
        const senderAddress = getValue(orderData.sender_address);
        const senderContact = getValue(orderData.sender_contact);

        // Get first receiver data
        const receiver = orderData.receivers && orderData.receivers[0] ? orderData.receivers[0] : {};
        const receiverName = getValue(receiver.receivername);
        const receiverContact = getValue(receiver.receivercontact);
        const receiverAddress = getValue(receiver.receiveraddress);

        // Get shipping details
        const shippingDetails = receiver.shippingdetails || [];

        // Get container details
        const containers = receiver.containers || [];

        // Build container rows for table
        const getContainerRows = () => {
            if (!shippingDetails.length) return '';

            let rows = '';
            shippingDetails.forEach(detail => {
                if (detail.containerDetails && detail.containerDetails.length) {
                    detail.containerDetails.forEach(containerDetail => {
                        const containerNum = containerDetail.container?.container_number || containerDetail.container_number || '';
                        const sealNo = ''; // Seal no not in API
                        const pkgs = containerDetail.total_number || '';
                        const grossWt = containerDetail.assign_weight ? `${containerDetail.assign_weight} KGS` : '';

                        if (containerNum) {
                            rows += `<tr><td>${containerNum} / 40'HC</td><td></td><td>${pkgs} PKG</td><td></td><td>${grossWt}</td></tr>`;
                        }
                    });
                }
            });
            return rows;
        };

        // Calculate total packages
        const totalPkgs = shippingDetails.reduce((sum, detail) => {
            if (detail.containerDetails) {
                return sum + detail.containerDetails.reduce((s, cd) => s + (parseInt(cd.total_number) || 0), 0);
            }
            return sum;
        }, 0);

        // Get vessel name
        const vesselName = getValue(orderData.consignment_vessel);
        const voyageNo = getValue(orderData.consignment_voyage);
        const vesselVoyage = vesselName && voyageNo ? `${vesselName} / ${voyageNo}` : vesselName || voyageNo || '';

        // Get container count
        const containerCount = containers.length ? `${containers.length}X40'HC` : '';

        return `<!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>KYC Dubai Company</title>
                    <style>

                        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #333; size: A4; }
                        .form-container { width: 800px; border: 2px solid #000; margin: auto; }
                        
                        .header-grid { display: grid; grid-template-columns: 1fr 200px; border-bottom: 2px solid #000; }
                        .header-left { padding: 10px; }
                        .logo { font-weight: bold; font-style: italic; color: #d9534f; font-size: 24px; }
                        .logo img{ width: 180px; height: auto; }
                        .logo span { color: #555; font-size: 14px; }
                        .form-title { text-align: center; text-decoration: underline; font-weight: bold; margin-top: 10px; }
                        .disclaimer { font-size: 10px; margin-top: 10px; line-height: 1.2; text-align: justify; }
                        
                        .photo-box { border-left: 2px solid #000; padding: 10px; text-align: center; font-size: 10px; background: #f9f9f9; }

                        /* Form Rows */
                        .row { display: flex; border-bottom: 1px solid #000; min-height: 30px; }
                        .row:last-child { border-bottom: none; }
                        .col-num { width: 40px; border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; }
                        .col-label { width: 300px; border-right: 1px solid #000; padding: 5px; font-weight: bold; }
                        .col-input { flex-grow: 1; padding: 5px; color: #d9534f; font-style: italic; }
                        
                        /* Nested checkboxes for Category */
                        .category-options { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
                        .option { font-style: normal; color: #d9534f; }

                        /* Footer / Declaration */
                        .declaration { padding: 10px; font-size: 11px; line-height: 1.4; border-top: 2px solid #000; }
                        .signature-section { display: grid; grid-template-columns: 1fr 1fr; padding: 10px; }
                        .sig-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; }
                </style>
                </head>
                <body>

                <div class="form-container">
                    <div class="header-grid">
                        <div class="header-left">
                            <div class="logo"><img src="${logoPic}" alt="Royal Gulf"> <br><span>Royal Gulf Shipping & Logistics LLC</span></div>
                            <div class="form-title">KYC (Know Your Customer) Form</div>
                            <p class="disclaimer">
                                As Required Mandatory by company policy and government authorities involved, for identification verification of Storage Customers/Importers/Exporters/for customs clearance performed on their behalf by Royal Gulf Shipping & Logistics LLC as an authorized Warehousing company / agents directly or indirectly through a Clearing agent appointed by Royal Gulf Shipping & Logistics LLC on behalf of the customer.
                            </p>
                        </div>
                        <div class="photo-box">
                            Passport Size Photograph of Individual / Attach Photograph of the Authorized Signatory For Proprietary Firm / Partnership Firm / Trust and Company
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-num">1</div>
                        <div class="col-label">Category</div>
                        <div class="col-input">
                            <div class="category-options">
                                <div class="option">☐ Company</div>
                                <div class="option">☐ Individual/proprietary firm</div>
                                <div class="option">☐ Trusts/Foundations</div>
                                <div class="option">☐ Partnership Firm</div>
                            </div>
                        </div>
                    </div>

                    <div class="row" style="height: 60px;">
                        <div class="col-num">2</div>
                        <div class="col-label">Name of the Individual / Proprietary firm/Company/Trusts/Foundations Partnership firm Name of all partners</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row">
                        <div class="col-num">3</div>
                        <div class="col-label">RGSL Customer Account No</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row" style="height: 80px;">
                        <div class="col-num">4</div>
                        <div class="col-label">Permanent or Registered address... <br> Telephone: <br> Mobile:</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row" style="height: 100px;">
                        <div class="col-num">5</div>
                        <div class="col-label">Principal Business address... <br> Telephone: <br> Fax Number: <br> Email Address: <br> Website:</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row">
                        <div class="col-num">6</div>
                        <div class="col-label">Name of Authorized Signatory for signing import/export documents...</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row"><div class="col-num">7</div><div class="col-label">Passport No:</div><div class="col-input">To be fetched... COPY ATTACHED</div></div>
                    <div class="row"><div class="col-num">8</div><div class="col-label">Emirates ID #:</div><div class="col-input">To be fetched... COPY ATTACHED</div></div>
                    <div class="row"><div class="col-num">9</div><div class="col-label">Visa No:</div><div class="col-input">To be fetched... COPY ATTACHED</div></div>

                    <div class="declaration">
                        I/We hereby Declare that the particulars given herein above are true , correct and complete to the best of my/our knowledge and belief, the documents submitted in support of this form KYC are genuine and obtained legally from the respective issuing authority. In case of any change in any of the aforementioned particulars, I/we undertake to notify you in writing failing which the above particulars may be relied upon including all shipments/documents executed and tendered by the individual so authorized and mentioned in 6 above. I/We hereby authorize you to submit the above particulars to the customs and other regulatory authorities on my/our behlaf as may be required in order in to transport and customs clear my/our shipments.
                    </div>

                    <div class="signature-section">
                        <div>
                            Place: <span class="option">Dubai, UAE</span><br><br>
                            Date: <span class="option">${currentDate}</span>
                        </div>
                        <div>
                            Signature <span class="sig-line"></span><br><br>
                            Name <span class="sig-line"></span>
                        </div>
                    </div>
                </div>

                </body>
                </html>
                `;
    };

    const KYCUKCompany = (orderData) => {
        const getValue = (value) => {
            return (value && value !== '' && value !== null && value !== undefined) ? value : '';
        };

        // Format current date
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Extract data from order object
        const senderName = getValue(orderData.sender_name);
        const senderAddress = getValue(orderData.sender_address);
        const senderContact = getValue(orderData.sender_contact);

        // Get first receiver data
        const receiver = orderData.receivers && orderData.receivers[0] ? orderData.receivers[0] : {};
        const receiverName = getValue(receiver.receivername);
        const receiverContact = getValue(receiver.receivercontact);
        const receiverAddress = getValue(receiver.receiveraddress);

        // Get shipping details
        const shippingDetails = receiver.shippingdetails || [];

        // Get container details
        const containers = receiver.containers || [];

        // Build container rows for table
        const getContainerRows = () => {
            if (!shippingDetails.length) return '';

            let rows = '';
            shippingDetails.forEach(detail => {
                if (detail.containerDetails && detail.containerDetails.length) {
                    detail.containerDetails.forEach(containerDetail => {
                        const containerNum = containerDetail.container?.container_number || containerDetail.container_number || '';
                        const sealNo = ''; // Seal no not in API
                        const pkgs = containerDetail.total_number || '';
                        const grossWt = containerDetail.assign_weight ? `${containerDetail.assign_weight} KGS` : '';

                        if (containerNum) {
                            rows += `<tr><td>${containerNum} / 40'HC</td><td></td><td>${pkgs} PKG</td><td></td><td>${grossWt}</td></tr>`;
                        }
                    });
                }
            });
            return rows;
        };

        // Calculate total packages
        const totalPkgs = shippingDetails.reduce((sum, detail) => {
            if (detail.containerDetails) {
                return sum + detail.containerDetails.reduce((s, cd) => s + (parseInt(cd.total_number) || 0), 0);
            }
            return sum;
        }, 0);

        // Get vessel name
        const vesselName = getValue(orderData.consignment_vessel);
        const voyageNo = getValue(orderData.consignment_voyage);
        const vesselVoyage = vesselName && voyageNo ? `${vesselName} / ${voyageNo}` : vesselName || voyageNo || '';

        // Get container count
        const containerCount = containers.length ? `${containers.length}X40'HC` : '';

        return `<!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>KYC UK Company</title>
                    <style>

                        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #333; size: A4; }
                        .form-container { width: 800px; border: 2px solid #000; margin: auto; }
                        
                        .header-grid { display: grid; grid-template-columns: 1fr 200px; border-bottom: 2px solid #000; }
                        .header-left { padding: 10px; }
                        .logo { font-weight: bold; display: flex; align-items: center; gap: 20px; }
                        .logo img{ width: 100px; height: auto; }
                        .logo span { color: #555; font-size: 20px; }
                        .form-title { text-align: center; text-decoration: underline; font-weight: bold; margin-top: 10px; }
                        .disclaimer { font-size: 10px; margin-top: 10px; line-height: 1.2; text-align: justify; }
                        
                        .photo-box { border-left: 2px solid #000; padding: 10px; text-align: center; font-size: 10px; background: #f9f9f9; }

                        /* Form Rows */
                        .row { display: flex; border-bottom: 1px solid #000; min-height: 30px; }
                        .row:last-child { border-bottom: none; }
                        .col-num { width: 40px; border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; }
                        .col-label { width: 300px; border-right: 1px solid #000; padding: 5px; font-weight: bold; }
                        .col-input { flex-grow: 1; padding: 5px; color: #d9534f; font-style: italic; }
                        
                        /* Nested checkboxes for Category */
                        .category-options { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
                        .option { font-style: normal; color: #d9534f; }

                        /* Footer / Declaration */
                        .declaration { padding: 10px; font-size: 11px; line-height: 1.4; border-top: 2px solid #000; }
                        .signature-section { display: grid; grid-template-columns: 1fr 1fr; padding: 10px; }
                        .sig-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; }
                </style>
                </head>
                <body>

                <div class="form-container">
                    <div class="header-grid">
                        <div class="header-left">
                            <div class="logo"><img src="${logoMFD}" alt="Messiah Freight"><span>MESSIAH FREIGHT & DISTRIBUTORS UK LTD </span></div>
                            <div class="form-title">KYC (Know Your Customer) Form</div>
                            <p class="disclaimer">
                                As Required Mandatory by company policy and government authorities involved, for identification verification of Storage Customers/Importers/Exporters/for customs clearance performed on their behalf by customs clearnace performed on their behalf by Messiah Freight & Distribution Uk Ltd as an authorized Warehousing company / agents directly or indirectly through a Clearing agent appointed by Royal Gulf Shipping & Logistics LLC on behalf of the customer.
                            </p>
                        </div>
                        <div class="photo-box">
                            Passport Size Photograph of Individual / Attach Photograph of the Authorized Signatory For Proprietary Firm / Partnership Firm / Trust and Company
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-num">1</div>
                        <div class="col-label">Category</div>
                        <div class="col-input">
                            <div class="category-options">
                                <div class="option">☐ Company</div>
                                <div class="option">☐ Individual/proprietary firm</div>
                                <div class="option">☐ Trusts/Foundations</div>
                                <div class="option">☐ Partnership Firm</div>
                            </div>
                        </div>
                    </div>

                    <div class="row" style="height: 60px;">
                        <div class="col-num">2</div>
                        <div class="col-label">Name of the Individual / Proprietary firm/Company/Trusts/Foundations Partnership firm Name of all partners</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row">
                        <div class="col-num">3</div>
                        <div class="col-label">RGSL Customer Account No</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row" style="height: 80px;">
                        <div class="col-num">4</div>
                        <div class="col-label">Permanent or Registered address... <br> Telephone: <br> Mobile:</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row" style="height: 100px;">
                        <div class="col-num">5</div>
                        <div class="col-label">Principal Business address... <br> Telephone: <br> Fax Number: <br> Email Address: <br> Website:</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row">
                        <div class="col-num">6</div>
                        <div class="col-label">Name of Authorized Signatory for signing import/export documents...</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row"><div class="col-num">7</div><div class="col-label">Passport No:</div><div class="col-input">To be fetched... COPY ATTACHED</div></div>
                    <div class="row"><div class="col-num">8</div><div class="col-label">Emirates ID #:</div><div class="col-input">To be fetched... COPY ATTACHED</div></div>
                    <div class="row"><div class="col-num">9</div><div class="col-label">Visa No:</div><div class="col-input">To be fetched... COPY ATTACHED</div></div>

                    <div class="declaration">
                    I/We hereby Declare that the particulars given herein above are true , correct and complete to the best of my/our knowledge and belief, the documents submitted in support of this form KYC are genuine and obtained legally from the respective issuing authority. In case of any change in any of the aforementioned particulars, I/we undertake to notify you in writing failing which the above particulars may be relied upon including all shipments/documents executed and tendered by the individual so authorized and mentioned in 6 above. I/We hereby authorize you to submit the above particulars to the customs and other regulatory authorities on my/our behlaf as may be required in order in to transport and customs clear my/our shipments.
                    </div>

                    <div class="signature-section">
                        <div>
                            Place: <span class="option">United Kingdom</span><br><br>
                            Date: <span class="option">${currentDate}</span>
                        </div>
                        <div>
                            Signature <span class="sig-line"></span><br><br>
                            Name <span class="sig-line"></span>
                        </div>
                    </div>
                </div>

                </body>
                </html>
                `;
    };

    const KYCKarachiCompany = (orderData) => {
        const getValue = (value) => {
            return (value && value !== '' && value !== null && value !== undefined) ? value : '';
        };

        // Format current date
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Extract data from order object
        const senderName = getValue(orderData.sender_name);
        const senderAddress = getValue(orderData.sender_address);
        const senderContact = getValue(orderData.sender_contact);

        // Get first receiver data
        const receiver = orderData.receivers && orderData.receivers[0] ? orderData.receivers[0] : {};
        const receiverName = getValue(receiver.receivername);
        const receiverContact = getValue(receiver.receivercontact);
        const receiverAddress = getValue(receiver.receiveraddress);

        // Get shipping details
        const shippingDetails = receiver.shippingdetails || [];

        // Get container details
        const containers = receiver.containers || [];

        // Build container rows for table
        const getContainerRows = () => {
            if (!shippingDetails.length) return '';

            let rows = '';
            shippingDetails.forEach(detail => {
                if (detail.containerDetails && detail.containerDetails.length) {
                    detail.containerDetails.forEach(containerDetail => {
                        const containerNum = containerDetail.container?.container_number || containerDetail.container_number || '';
                        const sealNo = ''; // Seal no not in API
                        const pkgs = containerDetail.total_number || '';
                        const grossWt = containerDetail.assign_weight ? `${containerDetail.assign_weight} KGS` : '';

                        if (containerNum) {
                            rows += `<tr><td>${containerNum} / 40'HC</td><td></td><td>${pkgs} PKG</td><td></td><td>${grossWt}</td></tr>`;
                        }
                    });
                }
            });
            return rows;
        };

        // Calculate total packages
        const totalPkgs = shippingDetails.reduce((sum, detail) => {
            if (detail.containerDetails) {
                return sum + detail.containerDetails.reduce((s, cd) => s + (parseInt(cd.total_number) || 0), 0);
            }
            return sum;
        }, 0);

        // Get vessel name
        const vesselName = getValue(orderData.consignment_vessel);
        const voyageNo = getValue(orderData.consignment_voyage);
        const vesselVoyage = vesselName && voyageNo ? `${vesselName} / ${voyageNo}` : vesselName || voyageNo || '';

        // Get container count
        const containerCount = containers.length ? `${containers.length}X40'HC` : '';

        return `<!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>KYC Karachi Company</title>
                    <style>
                        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #333; size: A4; }
                        .form-container { width: 800px; border: 2px solid #000; margin: auto; }
                        .header-grid { display: grid; grid-template-columns: 1fr 200px; border-bottom: 2px solid #000; }
                        .header-left { padding: 10px; }
                        .logo { font-weight: bold; display: flex; align-items: center; gap: 20px; }
                        .logo img{ width: 100px; height: auto; }
                        .logo span { color: #555; font-size: 20px; }
                        .form-title { text-align: center; text-decoration: underline; font-weight: bold; margin-top: 10px; }
                        .disclaimer { font-size: 10px; margin-top: 10px; line-height: 1.2; text-align: justify; }
                        
                        .photo-box { border-left: 2px solid #000; padding: 10px; text-align: center; font-size: 10px; background: #f9f9f9; }

                        /* Form Rows */
                        .row { display: flex; border-bottom: 1px solid #000; min-height: 30px; }
                        .row:last-child { border-bottom: none; }
                        .col-num { width: 40px; border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; }
                        .col-label { width: 300px; border-right: 1px solid #000; padding: 5px; font-weight: bold; }
                        .col-input { flex-grow: 1; padding: 5px; color: #d9534f; font-style: italic; }
                        
                        /* Nested checkboxes for Category */
                        .category-options { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
                        .option { font-style: normal; color: #d9534f; }

                        /* Footer / Declaration */
                        .declaration { padding: 10px; font-size: 11px; line-height: 1.4; border-top: 2px solid #000; }
                        .signature-section { display: grid; grid-template-columns: 1fr 1fr; padding: 10px; }
                        .sig-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; }
                </style>
                </head>
                <body>

                <div class="form-container">
                    <div class="header-grid">
                        <div class="header-left">
                            <div class="logo"><img src="${logoCAS}" alt="Cargo Aviation"> <span>Cargo Aviation System Pvt Ltd</span></div>
                            <div class="form-title">KYC (Know Your Customer) Form</div>
                            <p class="disclaimer">
                                As Required Mandatory by company policy and government authorities involved, for identification verification of Storage Customers/Importers/Exporters/for customs clearance performed on their behalf by customs clearnace performed on their behalf by Cargo Aviation Systems (Pvt) Ltd as an authorized Warehousing company / agents directly or indirectly through a Clearing agent appointed by Royal Gulf Shipping & Logistics LLC on behalf of the customer.
                            </p>
                        </div>
                        <div class="photo-box">
                            Passport Size Photograph of Individual / Attach Photograph of the Authorized Signatory For Proprietary Firm / Partnership Firm / Trust and Company
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-num">1</div>
                        <div class="col-label">Category</div>
                        <div class="col-input">
                            <div class="category-options">
                                <div class="option">☐ Company</div>
                                <div class="option">☐ Individual/proprietary firm</div>
                                <div class="option">☐ Trusts/Foundations</div>
                                <div class="option">☐ Partnership Firm</div>
                            </div>
                        </div>
                    </div>

                    <div class="row" style="height: 60px;">
                        <div class="col-num">2</div>
                        <div class="col-label">Name of the Individual / Proprietary firm/Company/Trusts/Foundations Partnership firm Name of all partners</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row">
                        <div class="col-num">3</div>
                        <div class="col-label">RGSL Customer Account No</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row" style="height: 80px;">
                        <div class="col-num">4</div>
                        <div class="col-label">Permanent or Registered address... <br> Telephone: <br> Mobile:</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row" style="height: 100px;">
                        <div class="col-num">5</div>
                        <div class="col-label">Principal Business address... <br> Telephone: <br> Fax Number: <br> Email Address: <br> Website:</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row">
                        <div class="col-num">6</div>
                        <div class="col-label">Name of Authorized Signatory for signing import/export documents...</div>
                        <div class="col-input">To be fetched from system database</div>
                    </div>

                    <div class="row"><div class="col-num">7</div><div class="col-label">Passport No:</div><div class="col-input">To be fetched... COPY ATTACHED</div></div>
                    <div class="row"><div class="col-num">8</div><div class="col-label">Emirates ID #:</div><div class="col-input">To be fetched... COPY ATTACHED</div></div>
                    <div class="row"><div class="col-num">9</div><div class="col-label">Visa No:</div><div class="col-input">To be fetched... COPY ATTACHED</div></div>

                    <div class="declaration">
                        I/We hereby Declare that the particulars given herein above are true , correct and complete to the best of my/our knowledge and belief, the documents submitted in support of this form KYC are genuine and obtained legally from the respective issuing authority. In case of any change in any of the aforementioned particulars, I/we undertake to notify you in writing failing which the above particulars may be relied upon including all shipments/documents executed and tendered by the individual so authorized and mentioned in 6 above. I/We hereby authorize you to submit the above particulars to the customs and other regulatory authorities on my/our behlaf as may be required in order in to transport and customs clear my/our shipments.
                    </div>

                    <div class="signature-section">
                        <div>
                            Place: <span class="option">Karachi, Pakistan</span><br><br>
                            Date: <span class="option">${currentDate}</span>
                        </div>
                        <div>
                            Signature <span class="sig-line"></span><br><br>
                            Name <span class="sig-line"></span>
                        </div>
                    </div>
                </div>

                </body>
                </html>
                `;
    };

    const handleDocumentAction = (action, docName, orderData) => {
        // Static document mapping
        const documents = {
            '3rd Party Shipper Undertaking for ANF.pdf': {
            title: '3rd Party Shipper Undertaking for ANF',
                content: PartyShipperUndertakingForANF(orderData),
                fileExt: '.html',
                mimeType: 'text/html'
            },
            '3rd Party Shipper Indemnity for each order format.pdf': {
                title: '3rd Party Shipper Indemnity for each order format',
                content: PartyShipperIndemnityForEachOrderFormat(orderData),
                fileExt: '.html',
                mimeType: 'text/html'
            },
            'Dubai Letter of Idemnity for Customs.pdf': {
                title: 'Dubai Letter of Idemnity for Customs',
                content: DubaiLetterOfIndemnityForCustoms(orderData),
                fileExt: '.html',
                mimeType: 'text/html'
            },
            'Karachi Govt. Customs Stamp paper undertaking format.pdf': {
                title: 'Karachi Govt. Customs Stamp paper undertaking format',
                content: KarachiGovtCustomsStampPaperUndertakingFormat(orderData),
                fileExt: '.html',
                mimeType: 'text/html'
            },
            'Karachi, Undertaking for Customs, Each sender should give.pdf': {
                title: 'Karachi, Undertaking for Customs, Each sender should give',
                content: KarachiUndertakingForCustomsEachSenderShouldGive(orderData),
                fileExt: '.html',
                mimeType: 'text/html'
            },
            'Receiver Undertaking for Dubai Customs.pdf': {
                title: 'Receiver Undertaking for Dubai Customs',
                content: ReceiverUndertakingForDubaiCustoms(orderData),
                fileExt: '.html',
                mimeType: 'text/html'
            },
            'Receiver Undertaking Dubai ANF.pdf': {
                title: 'Receiver Undertaking Dubai ANF',
                content: ReceiverUndertakingDubaiANF(orderData),
                fileExt: '.html',
                mimeType: 'text/html'
            },
            'Sender Undertaking for 3rd Party Shipper.pdf': {
                title: 'Sender Undertaking for 3rd Party Shipper',
                content: SenderUndertakingForThirdPartyShipper(orderData),
                fileExt: '.html',
                mimeType: 'text/html'
            },
            'WHARFAGE - CONSIGNMENT NOTE.pdf': {
                title: 'WHARFAGE - CONSIGNMENT NOTE',
                content: WHARFAGEConsignmentsNote(orderData),
                fileExt: '.pdf',
                mimeType: 'application/pdf'
            },
            'Order Acknowledgement Printabe Version.pdf': {
                title: 'Order Acknowledgement - Printabe Version',
                content: OrderAcknowledgementPrintableVersion(orderData),
                fileExt: '.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            'Order Confirmation & Acceptance Dubai Receiver': {
                title: 'Order Confirmation & Acceptance Dubai Receiver',
                content: OrderConfirmationAndAcceptanceDubaiReceiver(orderData),
                fileExt: '.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            'Order Confirmation & Acceptance UK Receiver.pdf': {
                title: 'Order Confirmation & Acceptance UK Receiver',
                content: OrderConfirmationAndAcceptanceUKReceiver(orderData),
                fileExt: '.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            'Order Confirmation & Acceptance Karachi Receiver.pdf': {
                title: 'Order Confirmation & Acceptance Karachi Receiver',
                content: OrderConfirmationAndAcceptanceKarachiReceiver(orderData),
                fileExt: '.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            'Messiah Bill of Lading.pdf': {
                title: 'Messiah Bill of Lading',
                content: MessiahBillofLading(orderData),
                fileExt: '.pdf',
                mimeType: 'application/pdf'
            },
            'RGSL Bill of Lading.pdf': {
                title: 'RGSL Bill of Lading',
                content: RGSLBillofLading(orderData),
                fileExt: '.pdf',
                mimeType: 'application/pdf'
            },
            'KYC Dubai Company.pdf': {
                title: 'KYC Dubai Company',
                content: KYCDubaiCompany(orderData),
                fileExt: '.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            'KYC UK Company.pdf': {
                title: 'KYC UK Company',
                content: KYCUKCompany(orderData),
                fileExt: '.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            'KYC Karachi Company.pdf': {
                title: 'KYC Karachi Company',
                content: KYCKarachiCompany(orderData),
                fileExt: '.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            'CAS Bill of Lading.pdf': {
                title: 'CAS Bill of Lading',
                content: CASBillofLading(orderData),
                fileExt: '.pdf',
                mimeType: 'application/pdf'
            }
        };

        const doc = documents[docName];

        if (!doc) {
            setSnackbar({
                open: true,
                message: 'Document template not found',
                severity: 'warning',
            });
            return;
        }

        if (action === 'view') {
            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(doc.content);
            previewWindow.document.close();
        } else if (action === 'print') {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(doc.content);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.print();
            };
        }
        // else if (action === 'download') {
        //     // Correct file name with proper extension
        //     const fileName = docName.replace(/\$|\.pdf$|\.xlsx$/, '') + doc.fileExt;

        //     const blob = new Blob([doc.content], { type: doc.mimeType });
        //     const url = URL.createObjectURL(blob);
        //     const link = document.createElement('a');
        //     link.href = url;
        //     link.download = fileName;
        //     document.body.appendChild(link);
        //     link.click();
        //     document.body.removeChild(link);
        //     URL.revokeObjectURL(url);

        //     setSnackbar({
        //         open: true,
        //         message: `Downloading as ${doc.fileExt} file`,
        //         severity: 'info',
        //     });
        // }
    };
    return (
        <>
            {/* Documents Modal - New Separate Modal */}
            {/* Documents Modal - Static Design Only */}
            <Dialog
                open={openDocumentsModal}
                onClose={handleCloseDocumentsModal}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2, minHeight: '60vh' }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: '#0d6c6a',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h6" component="div">
                        Documents - Order #{tempOrderId || '123'}
                    </Typography>
                    <IconButton
                        onClick={handleCloseDocumentsModal}
                        sx={{ color: '#fff' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ mt: 2 }}>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell sx={{ fontWeight: 'bold', width: 50 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Document Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* Static document list as per your requirement */}
                                {[
                                    '3rd Party Shipper Undertaking for ANF.pdf',
                                    '3rd Party Shipper Indemnity for each order format.pdf',
                                    'CAS Bill of Lading.pdf',
                                    'Dubai Letter of Idemnity for Customs.pdf',
                                    'Essential Information.pdf',
                                    'GP#0121725 - Cargo GatePass.pdf',
                                    'Karachi Govt. Customs Stamp paper undertaking format.pdf',
                                    'Karachi, Undertaking for Customs, Each sender should give.pdf',
                                    'KYC Dubai Company.pdf',
                                    'KYC UK Company.pdf',
                                    'KYC Karachi Company.pdf',
                                    'Messiah Bill of Lading.pdf',
                                    'RGSL Bill of Lading.pdf',
                                    'Order Acknowledgement Printabe Version.pdf',
                                    'Order Confirmation & Acceptance Dubai Receiver.pdf',
                                    'Order Confirmation & Acceptance UK Receiver.pdf',
                                    'Order Confirmation & Acceptance Karachi Receiver.pdf',
                                    'Receiver Undertaking for Dubai Customs.pdf',
                                    'Receiver Undertaking Dubai ANF.pdf',
                                    'Rickmers Bill of Lading Sample.pdf',
                                    'Sender Undertaking for 3rd Party Shipper.pdf',
                                    'WHARFAGE - CONSIGNMENT NOTE.pdf'
                                ].map((docName, index) => {
                                    // Determine file type and icon
                                    const fileExtension = docName.split('.').pop()?.toLowerCase() || '';
                                    let fileIcon = <InsertDriveFileIcon />;
                                    let fileType = fileExtension.toUpperCase();

                                    if (fileExtension === 'pdf') {
                                        fileIcon = <PictureAsPdfIcon color="error" />;
                                    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
                                        fileIcon = <DescriptionIcon color="primary" />;
                                    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                                        fileIcon = <AssignmentIcon color="success" />;
                                    }

                                    return (
                                        <TableRow
                                            key={index}
                                            hover
                                            sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}
                                        >
                                            <TableCell>
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {fileIcon}
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {docName}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {fileType}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    <Tooltip title="View Document">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                // Get the current order from selectedOrder or tempOrderId
                                                                const currentOrder = selectedOrder || orders.find(o => o.id === tempOrderId);
                                                                if (currentOrder) {
                                                                    handleDocumentAction('view', docName, currentOrder);
                                                                } else {
                                                                    setSnackbar({
                                                                        open: true,
                                                                        message: 'No order selected',
                                                                        severity: 'warning',
                                                                    });
                                                                }
                                                            }}
                                                            sx={{
                                                                color: '#0d6c6a',
                                                                '&:hover': { bgcolor: 'rgba(13, 108, 106, 0.1)' }
                                                            }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Print Document">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                // Get the current order from selectedOrder or tempOrderId
                                                                const currentOrder = selectedOrder || orders.find(o => o.id === tempOrderId);
                                                                if (currentOrder) {
                                                                    handleDocumentAction('print', docName, currentOrder);
                                                                } else {
                                                                    setSnackbar({
                                                                        open: true,
                                                                        message: 'No order selected',
                                                                        severity: 'warning',
                                                                    });
                                                                }
                                                            }}
                                                            sx={{
                                                                color: '#f58220',
                                                                '&:hover': { bgcolor: 'rgba(245, 130, 32, 0.1)' }
                                                            }}
                                                        >
                                                            <PrintIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {/* <Tooltip title="Download">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDocumentAction('download', docName)}
                                                            sx={{
                                                                color: '#0d6c6a',
                                                                '&:hover': { bgcolor: 'rgba(13, 108, 106, 0.1)' }
                                                            }}
                                                        >
                                                            <FileDownloadIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip> */}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Button
                        onClick={handleCloseDocumentsModal}
                        variant="outlined"
                        sx={{
                            borderColor: '#0d6c6a',
                            color: '#0d6c6a',
                            '&:hover': { borderColor: '#0d6c6a', bgcolor: 'rgba(13, 108, 106, 0.05)' }
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
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
                    display:"table-cell"
                    }
                }}>
                    <Table stickyHeader size="small" aria-label="Consignments table" sx={{  }}>
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
                                                    sx={{ maxWidth: 150, cursor: 'help',  }}
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
                                                                {order.receivers.map(r => r.receiverName || '')}
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
                                        <TableCell sx={{ flexWrap: 'wrap', display: 'list-item', p: 0 }}>
                                            <StyledTableCell sx={{ paddingLeft: 0, fontWeight: 'bold', color: '#000', border: 0 }}>{totalItems.toFixed()} Packages</StyledTableCell>
                                            <StyledTableCell sx={{ paddingLeft: 0, fontWeight: 'bold', color: '#555', border: 0 }}>{totalWeight.toFixed()} kg</StyledTableCell>
                                        </TableCell>
                                        {/* <StyledTableCell sx={{bgcolor:"#555",color:"#fff"}} >{}</StyledTableCell> */}
                                        <StyledTableCell>
                                            <Stack direction="row" spacing={0}>
                                                <IconButton size="10" color="#e2e8f0" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order); }} title="Update Status">
                                                    <UpdateIcon />
                                                </IconButton>
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDocuments(order.id); }} title="Documents">
                                                    <DescriptionIcon />
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
                                {
                                    selectedOrderForUpdate?.receivers?.map((rec) => (<MenuItem key={rec.id} value={rec.id}>
                                        {rec.receivername} (Current: {rec.status})
                                    </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Items</InputLabel>
                            <Select
                                value={selectedReceiverForUpdateDetails?.itemRef || ''}
                                label="Receiver"
                                onChange={handleShippingChange}
                            >
                                {
                                    selectedReceiverForUpdate?.shippingdetails?.map((rec) => (
                                        <MenuItem key={rec.itemRef} value={rec.itemRef}>
                                            {rec.itemRef} (Category: {rec.category})
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