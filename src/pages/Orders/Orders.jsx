// OrdersList.jsx - Component for fetching and displaying orders
import { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    Table,
    TableBody,
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
import EditIcon from "@mui/icons-material/Edit";
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
        search: "",
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
            setSelectedOrder(response.data);
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
                'Receiver',
                'Associated Container',
                'Created At'
            ];

            const rows = allOrders.map((order) => [
                order.booking_ref || '',
                order.status || '',
                order.place_of_loading || '',
                order.final_destination || '',
                order.sender_name || '',
                order.receiver_name || '',
                order.associated_container || '',
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

                {/* Filters */}
                <Stack direction="row" spacing={2} mb={3} alignItems="center">
                    <TextField
                        label="Search Booking Ref"
                        name="search"
                        value={filters.search}
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

                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Booking Ref</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Place of Loading</TableCell>
                                <TableCell>Final Destination</TableCell>
                                <TableCell>Sender</TableCell>
                                <TableCell>Receiver</TableCell>
                                <TableCell>Associated Container</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id} hover>
                                    <TableCell>{order.booking_ref}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={order.status}
                                            color={
                                                order.status === "Created" ? "default" :
                                                order.status === "In Transit" ? "warning" :
                                                order.status === "Delivered" ? "success" :
                                                "error"
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{order.place_of_loading}</TableCell>
                                    <TableCell>{order.final_destination}</TableCell>
                                    <TableCell>{order.sender_name}</TableCell>
                                    <TableCell>{order.receiver_name}</TableCell>
                                    <TableCell>{order.associated_container || "-"}</TableCell>
                                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton size="small" onClick={() => handleView(order.id)} title="View Details">
                                                <VisibilityIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleEdit(order.id)} title="Edit">
                                                <EditIcon />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
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
                />
            </Paper>

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
        </>
    );
};

export default OrdersList;