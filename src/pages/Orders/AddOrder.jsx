// Updated OrderForm.jsx - with container integration, error handling, and validations
import { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Stack,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Snackbar,
    Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

// Custom TextField with error support
const CustomTextField = (props) => (
    <TextField
        {...props}
        size="medium"
        error={props.error}
        helperText={props.helperText}
        sx={{
            flex: 1,
            minWidth: 0,
            "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                transition: "all 0.3s ease",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#ddd" },
                "&:hover fieldset": { borderColor: "#f58220" },
                "&.Mui-focused fieldset": {
                    borderColor: "#f58220",
                    boxShadow: "0 0 8px rgba(245, 130, 32, 0.3)",
                },
                ...(props.error && { "& fieldset": { borderColor: "#d32f2f" } }),
            },
            "& .MuiInputLabel-root": {
                letterSpacing: 0.5,
                textTransform: "capitalize",
                color: "rgba(180, 174, 174, 1)",
                ...(props.error && { color: "#d32f2f" }),
            },
        }}
    />
);

const CustomSelect = ({ label, name, value, onChange, children, sx: selectSx, error }) => (
    <FormControl size="small" sx={{ flex: 1, minWidth: 0, ...selectSx, background: "#fff" }} error={error}>
        <InputLabel sx={{ color: "rgba(180, 174, 174, 1)" }}>{label}</InputLabel>
        <Select
            label={label}
            name={name}
            value={value}
            onChange={onChange}
            size="medium"
            sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    backgroundColor: "#fff",
                    "& fieldset": { borderColor: "#ddd" },
                    "&:hover fieldset": { borderColor: "#f58220" },
                    "&.Mui-focused fieldset": {
                        borderColor: "#f58220",
                        boxShadow: "0 0 8px rgba(245, 130, 32, 0.3)",
                    },
                    ...(error && { "& fieldset": { borderColor: "#d32f2f" } }),
                },
                "& .MuiInputLabel-root": {
                    letterSpacing: 0.5,
                    textTransform: "capitalize",
                    color: "rgba(180, 174, 174, 1)",
                    ...(error && { color: "#d32f2f" }),
                },
            }}>
            {children}
        </Select>
    </FormControl>
);

const OrderForm = ({ orderId,params }) => { // Accept orderId for edit mode
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState("panel1");
    const [containers, setContainers] = useState([]); // For associatedContainer select
    const [loading, setLoading] = useState(false);
    const [loadingContainers, setLoadingContainers] = useState(false);
    const [isEditMode, setIsEditMode] = useState(!!orderId);
console.log('sbcjhasb',params)
    // Snackbar state for error/success messages
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "info",
    });

    // Validation errors state
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        // ... all fields as before
        bookingRef: "",
        status: "In Transit",
        rglBookingNumber: "",
        consignmentRemarks: "",
        placeOfLoading: "",
        finalDestination: "",
        placeOfDelivery: "",
        orderRemarks: "",
        associatedContainer: "", // Will be populated from containers
        consignmentNumber: "",
        consignmentVessel: "",
        consignmentVoyage: "",
        senderName: "",
        senderContact: "",
        senderAddress: "",
        senderEmail: "",
        receiverName: "",
        receiverContact: "",
        receiverAddress: "",
        receiverEmail: "",
        eta: "",
        etd: "",
        shippingLine: "",
        driverName: "",
        driverContact: "",
        driverNic: "",
        driverPickupLocation: "",
        truckNumber: "",
        thirdPartyTransport: "",
        attachments: [],
    });

    // Required fields validation
    const requiredFields = [
        'bookingRef',
        'rglBookingNumber',
        'senderName',
        'receiverName',
        'placeOfLoading',
        'finalDestination'
    ];

    const validateForm = () => {
        const newErrors = {};
        requiredFields.forEach(field => {
            if (!formData[field]?.trim()) {
                newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
            }
        });

        // Email validation for sender and receiver
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.senderEmail && !emailRegex.test(formData.senderEmail)) {
            newErrors.senderEmail = 'Invalid sender email format';
        }
        if (formData.receiverEmail && !emailRegex.test(formData.receiverEmail)) {
            newErrors.receiverEmail = 'Invalid receiver email format';
        }

        // Date validation (if provided)
        const dateFields = ['eta', 'etd'];
        dateFields.forEach(field => {
            if (formData[field] && !/^\d{4}-\d{2}-\d{2}$/.test(formData[field])) {
                newErrors[field] = 'Invalid date format (YYYY-MM-DD)';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Fetch containers on mount
    useEffect(() => {
        fetchContainers();
        if (orderId) {
            fetchOrder(orderId);
        }
    }, [orderId]);

    // Fetch all containers
    const fetchContainers = async () => {
        setLoadingContainers(true);
        try {
            const params = {
                page: 1,
                limit: 50
            };
            const response = await api.get('/api/containers', { params });
            setContainers(response.data.data || []);
        } catch (error) {
            console.error('❌ Error fetching containers:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.error || error.message || 'Failed to fetch containers',
                severity: 'error',
            });
        } finally {
            setLoadingContainers(false);
        }
    };

    const fetchOrder = async (id) => {
        try {
            const response = await api.get(`/api/orders/${id}`, { params: { includeContainer: true } });
            setFormData(response.data);
        } catch (err) {
            console.error("Error fetching order:", err);
            setSnackbar({
                open: true,
                message: err.response?.data?.error || err.message || 'Failed to fetch order',
                severity: 'error',
            });
            if (err.response?.status === 404) {
                navigate('/orders'); // Redirect if not found
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error on change
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, ...files] }));
    };

    const handleSave = async () => {
        // Validate form first
        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: 'Please fix the errors in the form',
                severity: 'error',
            });
            return;
        }

        setLoading(true);
        const formDataToSend = new FormData();
        const dateFields = ['eta', 'etd'];

        Object.keys(formData).forEach(key => {
            const value = formData[key];
            if (key === 'attachments') {
                if (Array.isArray(value) && value.length > 0) {
                    if (value[0] instanceof File) {
                        // New files
                        value.forEach(file => formDataToSend.append('attachments', file));
                    } else {
                        // Existing attachments (array of paths), append as JSON string
                        formDataToSend.append('attachments', JSON.stringify(value));
                    }
                }
            } else if (dateFields.includes(key) && value === '') {
                // Skip empty dates to send as undefined (becomes NULL in backend)
            } else if (value !== undefined && value !== null && value !== '') {
                formDataToSend.append(key, value);
            }
        });

        try {
            if (isEditMode) {
                await api.put(`/api/orders/${orderId}`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post(`/api/orders`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setSnackbar({
                open: true,
                message: isEditMode ? 'Order updated successfully' : 'Order created successfully',
                severity: 'success',
            });
            // No navigation - stay on page to review or continue
        } catch (err) {
            console.error("Error saving order:", err);
            setSnackbar({
                open: true,
                message: err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to save order',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    // Placeholder options (unchanged)
    const places = ["Select Place", "Singapore", "Dubai", "Rotterdam", "Hamburg", "Karachi", "Dubai-Emirates"];
    const companies = ["Select 3rd party company", "Company A", "Company B"];
    const statuses = ["Created", "In Transit", "Delivered", "Cancelled"];

    return (
        <>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
                <Box sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h4" fontWeight="bold" color="#f58220">
                            {isEditMode ? "Edit" : "New"} Order Details
                        </Typography>
                        <Stack direction="row" gap={1}>
                            <Button
                                variant="outlined"
                                onClick={handleCancel}
                                sx={{ borderRadius: 2, borderColor: "#f58220", color: "#f58220", px: 3 }}
                                disabled={loading}
                            >
                                CANCEL
                            </Button>
                            <Button
                                variant="contained"
                                // onClick={}
                                onClick={handleSave }
                                sx={{
                                    borderRadius: 2,
                                    backgroundColor: "#0d6c6a",
                                    color: "#fff",
                                    px: 3,
                                    "&:hover": { backgroundColor: "#0d6c6a" },
                                }}
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "SAVE"}
                            </Button>
                        </Stack>
                    </Stack>

                    {/* Top Order Fields - with validation errors */}
                    <Stack spacing={3} mb={4}>
                        {/* Row 1: Booking Ref | Consignment Remarks */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                            <CustomTextField
                                label="Booking Ref"
                                name="bookingRef"
                                value={formData.bookingRef}
                                onChange={handleChange}
                                error={!!errors.bookingRef}
                                helperText={errors.bookingRef}
                                required
                            />
                            <CustomTextField
                                label="Consignment Remarks"
                                name="consignmentRemarks"
                                value={formData.consignmentRemarks}
                                onChange={handleChange}
                            />
                        </Box>

                        {/* Row 2: RGL Booking Number | Final Destination */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                            <CustomTextField
                                label="RGL Booking Number*"
                                name="rglBookingNumber"
                                value={formData.rglBookingNumber}
                                onChange={handleChange}
                                error={!!errors.rglBookingNumber}
                                helperText={errors.rglBookingNumber}
                                required
                            />
                            <CustomSelect
                                label="Final Destination"
                                name="finalDestination"
                                value={formData.finalDestination}
                                onChange={handleChange}
                                error={!!errors.finalDestination}
                            >
                                {places.map((p) => (
                                    <MenuItem key={p} value={p}>
                                        {p}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                        </Box>

                        {/* Row 3: Place of Loading | Consignment Vessel */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                            <CustomSelect
                                label="Place of Loading"
                                name="placeOfLoading"
                                value={formData.placeOfLoading}
                                onChange={handleChange}
                                error={!!errors.placeOfLoading}
                            >
                                {places.map((p) => (
                                    <MenuItem key={p} value={p}>
                                        {p}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                            <CustomTextField
                                label="Consignment Vessel"
                                name="consignmentVessel"
                                value={formData.consignmentVessel}
                                onChange={handleChange}
                            />
                        </Box>

                        {/* Row 4: Place of Delivery | Consignment Number */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                            <CustomSelect
                                label="Place of Delivery"
                                name="placeOfDelivery"
                                value={formData.placeOfDelivery}
                                onChange={handleChange}
                            >
                                {places.map((p) => (
                                    <MenuItem key={p} value={p}>
                                        {p}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                            <CustomTextField
                                label="Consignment Number"
                                name="consignmentNumber"
                                value={formData.consignmentNumber}
                                onChange={handleChange}
                            />
                        </Box>

                        {/* Row 5: Associated Container | Consignment Voyage */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                            <CustomSelect
                                label="Associated Container"
                                name="associatedContainer"
                                value={formData.associatedContainer}
                                onChange={handleChange}
                                disabled={loadingContainers}
                            >
                                <MenuItem value="">Select Container</MenuItem>
                                {containers.map((container) => (
                                    <MenuItem key={container.cid} value={container.container_number}>
                                        {container.container_number} ({container.container_size} - {container.derived_status || container.availability})
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                            <CustomTextField
                                label="Consignment Voyage"
                                name="consignmentVoyage"
                                value={formData.consignmentVoyage}
                                onChange={handleChange}
                            />
                        </Box>

                        {/* Row 6: Order Remarks | Status */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                            <CustomTextField
                                label="Order Remarks"
                                name="orderRemarks"
                                value={formData.orderRemarks}
                                onChange={handleChange}
                                multiline
                                rows={3}
                            />
                            <CustomSelect
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                {statuses.map((s) => (
                                    <MenuItem key={s} value={s}>
                                        {s}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                        </Box>
                    </Stack>

                    <Divider sx={{ my: 3, borderColor: "#e0e0e0" }} />

                    {/* Accordion Sections - with validation for sender/receiver */}
                    <Stack spacing={2}>
                        <Accordion
                            expanded={expanded === "panel1"}
                            onChange={handleAccordionChange("panel1")}
                            sx={{
                                borderRadius: 2,
                                boxShadow: "none",
                                "&:before": { display: "none" },
                                "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    bgcolor: expanded === "panel1" ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded === "panel1" ? "#fff" : "#f58220" },
                                }}
                            >
                                1. Sender Details
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <CustomTextField
                                            label="Sender Name"
                                            name="senderName"
                                            value={formData.senderName}
                                            onChange={handleChange}
                                            error={!!errors.senderName}
                                            helperText={errors.senderName}
                                            required
                                        />
                                        <CustomTextField
                                            label="Sender Contact"
                                            name="senderContact"
                                            value={formData.senderContact}
                                            onChange={handleChange}
                                        />
                                    </Box>
                                    <CustomTextField
                                        label="Sender Address"
                                        name="senderAddress"
                                        value={formData.senderAddress}
                                        onChange={handleChange}
                                        multiline
                                        rows={2}
                                    />
                                    <CustomTextField
                                        label="Sender Email"
                                        name="senderEmail"
                                        value={formData.senderEmail}
                                        onChange={handleChange}
                                        error={!!errors.senderEmail}
                                        helperText={errors.senderEmail}
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            expanded={expanded === "panel2"}
                            onChange={handleAccordionChange("panel2")}
                            sx={{
                                borderRadius: 2,
                                boxShadow: "none",
                                "&:before": { display: "none" },
                                "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    bgcolor: expanded === "panel2" ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded === "panel2" ? "#fff" : "#f58220" },
                                }}
                            >
                                2. Receiver Details
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <CustomTextField
                                            label="Receiver Name"
                                            name="receiverName"
                                            value={formData.receiverName}
                                            onChange={handleChange}
                                            error={!!errors.receiverName}
                                            helperText={errors.receiverName}
                                            required
                                        />
                                        <CustomTextField
                                            label="Receiver Contact"
                                            name="receiverContact"
                                            value={formData.receiverContact}
                                            onChange={handleChange}
                                        />
                                    </Box>
                                    <CustomTextField
                                        label="Receiver Address"
                                        name="receiverAddress"
                                        value={formData.receiverAddress}
                                        onChange={handleChange}
                                        multiline
                                        rows={2}
                                    />
                                    <CustomTextField
                                        label="Receiver Email"
                                        name="receiverEmail"
                                        value={formData.receiverEmail}
                                        onChange={handleChange}
                                        error={!!errors.receiverEmail}
                                        helperText={errors.receiverEmail}
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            expanded={expanded === "panel3"}
                            onChange={handleAccordionChange("panel3")}
                            sx={{
                                borderRadius: 2,
                                boxShadow: "none",
                                "&:before": { display: "none" },
                                "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    bgcolor: expanded === "panel3" ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded === "panel3" ? "#fff" : "#f58220" },
                                }}
                            >
                                3. Shipping Details
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <CustomTextField
                                            label="ETA"
                                            name="eta"
                                            type="date"
                                            value={formData.eta}
                                            onChange={handleChange}
                                            InputLabelProps={{ shrink: true }}
                                            error={!!errors.eta}
                                            helperText={errors.eta}
                                        />
                                        <CustomTextField
                                            label="ETD"
                                            name="etd"
                                            type="date"
                                            value={formData.etd}
                                            onChange={handleChange}
                                            InputLabelProps={{ shrink: true }}
                                            error={!!errors.etd}
                                            helperText={errors.etd}
                                        />
                                    </Box>
                                    <CustomTextField
                                        label="Shipping Line"
                                        name="shippingLine"
                                        value={formData.shippingLine}
                                        onChange={handleChange}
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            expanded={expanded === "panel4"}
                            onChange={handleAccordionChange("panel4")}
                            sx={{
                                borderRadius: 2,
                                boxShadow: "none",
                                "&:before": { display: "none" },
                                "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    bgcolor: expanded === "panel4" ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded === "panel4" ? "#fff" : "#f58220" },
                                }}
                            >
                                4. Transport
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <CustomTextField
                                            label="Driver Name"
                                            name="driverName"
                                            value={formData.driverName}
                                            onChange={handleChange}
                                        />
                                        <CustomSelect
                                            label="3rd party Transport Company"
                                            name="thirdPartyTransport"
                                            value={formData.thirdPartyTransport}
                                            onChange={handleChange}
                                        >
                                            {companies.map((c) => (
                                                <MenuItem key={c} value={c}>
                                                    {c}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <CustomTextField
                                            label="Driver Contact number"
                                            name="driverContact"
                                            value={formData.driverContact}
                                            onChange={handleChange}
                                        />
                                        <CustomTextField
                                            label="Driver NIC Number"
                                            name="driverNic"
                                            value={formData.driverNic}
                                            onChange={handleChange}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <CustomTextField
                                            label="Driver Pickup Location"
                                            name="driverPickupLocation"
                                            value={formData.driverPickupLocation}
                                            onChange={handleChange}
                                        />
                                        <CustomTextField
                                            label="Truck number"
                                            name="truckNumber"
                                            value={formData.truckNumber}
                                            onChange={handleChange}
                                        />
                                    </Box>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            expanded={expanded === "panel5"}
                            onChange={handleAccordionChange("panel5")}
                            sx={{
                                borderRadius: 2,
                                boxShadow: "none",
                                "&:before": { display: "none" },
                                "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    bgcolor: expanded === "panel5" ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded === "panel5" ? "#fff" : "#f58220" },
                                }}
                            >
                                5. Order Summary
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                                <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Booking Ref:</Typography>
                                        <Chip label={formData.bookingRef || "-"} variant="outlined" color="primary" />
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Status:</Typography>
                                        <Chip label={formData.status} color="warning" variant="filled" />
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Place of Loading:</Typography>
                                        <Typography variant="body1">{formData.placeOfLoading || "-"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Final Destination:</Typography>
                                        <Typography variant="body1">{formData.finalDestination || "-"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Sender:</Typography>
                                        <Typography variant="body1">{formData.senderName || "-"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Receiver:</Typography>
                                        <Typography variant="body1">{formData.receiverName || "-"}</Typography>
                                    </Stack>
                                    {formData.associatedContainer && (
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body1" fontWeight="medium">Associated Container:</Typography>
                                            <Chip label={formData.associatedContainer} color="info" variant="outlined" />
                                        </Stack>
                                    )}
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            expanded={expanded === "panel6"}
                            onChange={handleAccordionChange("panel6")}
                            sx={{
                                borderRadius: 2,
                                boxShadow: "none",
                                "&:before": { display: "none" },
                                "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    bgcolor: expanded === "panel6" ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded === "panel6" ? "#fff" : "#f58220" },
                                }}
                            >
                                6. Attachments
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                                <Stack spacing={2}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        sx={{ borderRadius: 2, borderColor: "#f58220", color: "#f58220", px: 3 }}
                                    >
                                        Upload File
                                        <input type="file" hidden multiple onChange={handleFileUpload} />
                                    </Button>
                                    {formData.attachments.length > 0 && (
                                        <Stack spacing={1} direction="row" flexWrap="wrap" gap={1}>
                                            {formData.attachments.map((file, i) => (
                                                <Chip key={i} label={file.name || file} color="secondary" size="small" variant="outlined" />
                                            ))}
                                        </Stack>
                                    )}
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    </Stack>

                    {/* Bottom Buttons - unchanged */}
                    <Stack direction="row" justifyContent="flex-end" gap={2} mt={4} pt={3} borderTop="1px solid #e0e0e0">
                        {/* <Button
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 2, borderColor: "#ddd", color: "#666" }}
                        >
                            Add to Container
                        </Button> */}
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            sx={{ borderRadius: 2, borderColor: "#f58220", color: "#f58220" }}
                        >
                            Print Consignment Manifest
                        </Button>
                    </Stack>
                </Box>
            </Paper>

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

export default OrderForm;