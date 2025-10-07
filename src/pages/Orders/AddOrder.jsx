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
    RadioGroup,
    Radio,
    FormControlLabel,
    CircularProgress
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api";

// Custom TextField with error support
const CustomTextField = ({ disabled, ...props }) => (
    <TextField
        {...props}
        disabled={disabled}
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
                ...(disabled && { backgroundColor: "#f5f5f5", color: "#999" }),
            },
            "& .MuiInputLabel-root": {
                letterSpacing: 0.5,
                textTransform: "capitalize",
                color: "rgba(180, 174, 174, 1)",
                ...(props.error && { color: "#d32f2f" }),
                ...(disabled && { color: "#999" }),
            },
        }}
    />
);

const CustomSelect = ({ label, name, value, onChange, children, sx: selectSx, error, disabled, required = false }) => (
    <FormControl size="small" sx={{ flex: 1, minWidth: 0, ...selectSx, background: "#fff" }} error={error} required={required}>
        <InputLabel sx={{ color: "rgba(180, 174, 174, 1)", ...(disabled && { color: "#999" })}}>{label}</InputLabel>
        <Select
            label={label}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
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
                    ...(disabled && { backgroundColor: "#f5f5f5", color: "#999" }),
                },
                "& .MuiInputLabel-root": {
                    letterSpacing: 0.5,
                    textTransform: "capitalize",
                    color: "rgba(180, 174, 174, 1)",
                    ...(error && { color: "#d32f2f" }),
                    ...(disabled && { color: "#999" }),
                },
            }}>
            {children}
        </Select>
    </FormControl>
);

const OrderForm = () => {
    const [previewOpen, setPreviewOpen] = useState(false);
const [previewSrc, setPreviewSrc] = useState('')
    const location = useLocation();
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(new Set(["panel1"]));
    const [containers, setContainers] = useState([]); // For associatedContainer select
    const [loading, setLoading] = useState(false);
    const [loadingContainers, setLoadingContainers] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const orderId = location.state?.orderId;
    const [isEditMode, setIsEditMode] = useState(!!orderId);
    const [showInbound, setShowInbound] = useState(false);
    const [showOutbound, setShowOutbound] = useState(false);

    console.log('Order ID from state:', orderId);

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
        // New fields
        category: "",
        subcategory: "",
        type: "",
        deliveryAddress: "",
        pickupLocation: "",
        weight: "",
        // Karachi Drop-Off fields
        dropMethod: "",
        dropOffCnic: "",
        dropOffMobile: "",
        plateNo: "",
        dropDate: "",
        // Dubai Collection fields
        collectionMethod: "",
        fullPartial: "",
        qtyDelivered: "",
        clientReceiverName: "",
        clientReceiverId: "",
        clientReceiverMobile: "",
        deliveryDate: "",
        gatepass: [],
    });

    // Non-editable fields in edit mode for shipping orders
    const nonEditableInEdit = ['bookingRef', 'rglBookingNumber'];

    // Required fields validation
    const requiredFields = [
        'bookingRef',
        'rglBookingNumber',
        'senderName',
        'receiverName',
        'placeOfLoading',
        'finalDestination',
        // New required
        'category',
        'subcategory',
        'type',
        'weight'
    ];

    // Helper to convert snake_case to camelCase
    const snakeToCamel = (str) => str.replace(/(_[a-z])/g, g => g[1].toUpperCase());

    const validateForm = () => {
        const newErrors = {};
        // Compute conditions inside validation for accuracy
        const showInbound = formData.finalDestination?.includes('Karachi');
        const showOutbound = formData.placeOfLoading?.includes('Dubai');

        requiredFields.forEach(field => {
            if (!formData[field]?.trim()) {
                newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
            }
        });

        // Karachi Drop-Off validations (conditional)
        if (showInbound && formData.dropMethod === 'Drop-Off') {
            if (!formData.dropOffCnic?.trim()) {
                newErrors.dropOffCnic = 'Drop-Off CNIC/ID is required';
            }
            if (!formData.dropOffMobile?.trim()) {
                newErrors.dropOffMobile = 'Drop-Off Mobile is required';
            }
        }
        if (showInbound && !formData.dropDate?.trim()) {
            newErrors.dropDate = 'Drop Date is required';
        }

        // Dubai Collection validations (conditional)
        if (showOutbound && !formData.deliveryDate?.trim()) {
            newErrors.deliveryDate = 'Delivery Date is required';
        }
        if (showOutbound && formData.fullPartial === 'Partial' && !formData.qtyDelivered?.trim()) {
            newErrors.qtyDelivered = 'Qty Delivered is required for Partial';
        }
        if (showOutbound && formData.collectionMethod === 'Collected by Client') {
            if (!formData.clientReceiverName?.trim()) {
                newErrors.clientReceiverName = 'Receiver Name is required';
            }
            if (!formData.clientReceiverId?.trim()) {
                newErrors.clientReceiverId = 'Receiver ID is required';
            }
            if (!formData.clientReceiverMobile?.trim()) {
                newErrors.clientReceiverMobile = 'Receiver Mobile is required';
            }
        }

        // Email validation for sender and receiver
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.senderEmail && !emailRegex.test(formData.senderEmail)) {
            newErrors.senderEmail = 'Invalid sender email format';
        }
        if (formData.receiverEmail && !emailRegex.test(formData.receiverEmail)) {
            newErrors.receiverEmail = 'Invalid receiver email format';
        }

        // Date validation (if provided)
        const dateFields = ['eta', 'etd', 'dropDate', 'deliveryDate'];
        dateFields.forEach(field => {
            if (formData[field] && !/^\d{4}-\d{2}-\d{2}$/.test(formData[field])) {
                newErrors[field] = 'Invalid date format (YYYY-MM-DD)';
            }
        });

        // Weight validation (if provided)
        if (formData.weight && (isNaN(formData.weight) || parseFloat(formData.weight) <= 0)) {
            newErrors.weight = 'Weight must be a positive number';
        }

        // Mobile validation (simple phone check)
        const mobileRegex = /^\d{10,15}$/;
        if (formData.dropOffMobile && !mobileRegex.test(formData.dropOffMobile.replace(/\D/g, ''))) {
            newErrors.dropOffMobile = 'Invalid mobile number';
        }
        if (formData.clientReceiverMobile && !mobileRegex.test(formData.clientReceiverMobile.replace(/\D/g, ''))) {
            newErrors.clientReceiverMobile = 'Invalid mobile number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Fetch containers on mount
    useEffect(() => {
        fetchContainers();
        fetchCategories();
        if (orderId) {
            fetchOrder(orderId);
        }
    }, [orderId]);

    // Auto-set dropDate only if showInbound is true and field is empty
    useEffect(() => {
        const showInbound = formData.finalDestination?.includes('Karachi');
        if (showInbound && !formData.dropDate) {
            const today = new Date().toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, dropDate: today }));
        }
    }, [formData.finalDestination]);

    // Update visibility states
    useEffect(() => {
        setShowInbound(formData.finalDestination?.includes('Karachi'));
        setShowOutbound(formData.placeOfLoading?.includes('Dubai'));
    }, [formData.placeOfLoading, formData.finalDestination]);

    // Auto-expand accordions with errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const panelsToExpand = new Set();
            Object.keys(errors).forEach(key => {
                if (['senderName', 'senderContact', 'senderAddress', 'senderEmail'].includes(key)) panelsToExpand.add('panel1');
                if (['receiverName', 'receiverContact', 'receiverAddress', 'receiverEmail'].includes(key)) panelsToExpand.add('panel2');
                if (['category', 'subcategory', 'type', 'weight', 'pickupLocation', 'deliveryAddress', 'eta', 'etd', 'shippingLine'].includes(key)) panelsToExpand.add('panel3');
                if (['dropMethod', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate', 'collectionMethod', 'fullPartial', 'qtyDelivered', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate'].includes(key)) panelsToExpand.add('panel4');
            });
            setExpanded(prev => new Set([...prev, ...panelsToExpand]));
        }
    }, [errors]);

    // Fetch subcategories when category changes
    useEffect(() => {
        if (formData.category) {
            fetchSubcategories(formData.category);
        } else {
            setSubcategories([]);
        }
    }, [formData.category]);

    // Dummy data for categories and subcategories
    const dummyCategories = ["Electronics", "Clothing", "Books"];
    const categorySubMap = {
        "Electronics": ["Smartphones", "Laptops", "Accessories"],
        "Clothing": ["Men's Wear", "Women's Wear", "Kids Wear"],
        "Books": ["Fiction", "Non-Fiction", "Technical"],
    };

    const fetchCategories = () => {
        setCategories(dummyCategories);
    };

    const fetchSubcategories = (category) => {
        setSubcategories(categorySubMap[category] || []);
    };

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

    // In fetchOrder function, update to handle dates properly
    const fetchOrder = async (id) => {
        setLoading(true)
        try {
            const response = await api.get(`/api/orders/${id}`, { params: { includeContainer: true } });
            // Map snake_case to camelCase
            const camelData = {};
            Object.keys(response.data).forEach(apiKey => {
                let value = response.data[apiKey];
                // Handle dates: convert to YYYY-MM-DD format if it's a full ISO string or timestamp
                if (['eta', 'etd', 'drop_date', 'delivery_date'].includes(apiKey)) {
                    if (value) {
                        // If it's a full ISO string or Date object, format to YYYY-MM-DD
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {  // Valid date
                            value = date.toISOString().split('T')[0];  // Extract YYYY-MM-DD
                        }
                    } else {
                        value = '';  // Empty if null/undefined
                    }
                }
                const camelKey = apiKey.replace(/(_[a-z])/g, g => g[1].toUpperCase());
                camelData[camelKey] = value;
            });
            // Ensure attachments and gatepass are arrays if they are JSON strings
// Clean malformed paths (remove function wrapper prefix)
const cleanAttachments = (paths) => (paths || []).map(path => {
  if (typeof path === 'string' && path.startsWith('function wrap()')) {
    // Extract after fixed 62-char prefix
    return path.substring(62);
  }
  return path;
});

camelData.attachments = cleanAttachments(camelData.attachments);
camelData.gatepass = cleanAttachments(camelData.gatepass);

// Then build full URLs
const apiBase = import.meta.env.VITE_API_URL;
camelData.attachments = camelData.attachments.map(path => 
  path.startsWith('http') ? path : `${apiBase}${path}`
);
camelData.gatepass = camelData.gatepass.map(path => 
  path.startsWith('http') ? path : `${apiBase}${path}`
);
console.log('pathn data',camelData.attachments)
setFormData(camelData);

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
                finally{
                setLoading(false)
            }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'category') {
                updated.subcategory = '';
            }
            if (name === 'dropMethod' && value === 'RGSL Pickup') {
                updated.dropOffCnic = '';
                updated.dropOffMobile = '';
            }
            if (name === 'collectionMethod' && value === 'Delivered by RGSL') {
                updated.clientReceiverName = '';
                updated.clientReceiverId = '';
                updated.clientReceiverMobile = '';
            }
            if (name === 'fullPartial' && value === 'Full') {
                updated.qtyDelivered = '';
            }
            return updated;
        });
        // Clear error on change
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(prev => {
            const newSet = new Set(prev);
            if (isExpanded) {
                newSet.add(panel);
            } else {
                newSet.delete(panel);
            }
            return newSet;
        });
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setFormData((prev) => ({ ...prev, attachments: [...(Array.isArray(prev.attachments) ? prev.attachments : []), ...files] }));
    };

    const handleGatepassUpload = (e) => {
        const files = Array.from(e.target.files);
        setFormData((prev) => ({ ...prev, gatepass: [...(Array.isArray(prev.gatepass) ? prev.gatepass : []), ...files] }));
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
        const dateFields = ['eta', 'etd', 'dropDate', 'deliveryDate'];

   Object.keys(formData).forEach(key => {
    const value = formData[key];
    if (key === 'attachments' || key === 'gatepass') {
        if (Array.isArray(value) && value.length > 0) {
            // Separate existing paths (strings) and new files
            const existing = value.filter(item => typeof item === 'string');
            const newFiles = value.filter(item => item instanceof File);
            if (newFiles.length > 0) {
                newFiles.forEach(file => formDataToSend.append(key, file));
            }
            if (existing.length > 0) {
                // Append existing as separate text field
                const apiKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                formDataToSend.append(`${apiKey}_existing`, JSON.stringify(existing));
            }
        }
        return;  // Skip to next key (no need for else)
            } else if (dateFields.includes(key) && value === '') {
                if (value !== '') {  // Only append non-empty dates
                const apiKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                formDataToSend.append(apiKey, value);
            }
        } else {
            // Always append strings/numbers, as '' or 0 for backend validation
            const apiKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            formDataToSend.append(apiKey, value || '');
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
            // Handle backend validation errors by parsing details and setting field errors
            if (err.response?.data?.details) {
                const detailStr = err.response.data.details;
                const errorsList = detailStr.split('; ').map(detail => {
                    const match = detail.match(/^(\w+) (.+)$/);
                    if (match) {
                        const fieldSnake = match[1];
                        const msg = match[2];
                        const fieldCamel = snakeToCamel(fieldSnake);
                        return { field: fieldCamel, msg };
                    }
                    return null;
                }).filter(Boolean);

                const newErrors = {};
                errorsList.forEach(({field, msg}) => {
                    newErrors[field] = msg;
                });
                setErrors(prev => ({ ...prev, ...newErrors }));

                setSnackbar({
                    open: true,
                    message: 'Please fix the errors in the form',
                    severity: 'error',
                });
                return;
            }
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
    const types = ["Select Type", "Type 1", "Type 2"];

    const isFieldDisabled = (name) => isEditMode && nonEditableInEdit.includes(name);


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
                                onClick={handleSave}
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
                                disabled={isFieldDisabled('bookingRef')}
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
                                label="RGL Booking Number"
                                name="rglBookingNumber"
                                value={formData.rglBookingNumber}
                                onChange={handleChange}
                                error={!!errors.rglBookingNumber}
                                helperText={errors.rglBookingNumber}
                                required
                                disabled={isFieldDisabled('rglBookingNumber')}
                            />
                            <CustomSelect
                                label="Final Destination"
                                name="finalDestination"
                                value={formData.finalDestination}
                                onChange={handleChange}
                                error={!!errors.finalDestination}
                                required
                                disabled={isFieldDisabled('finalDestination')}
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
                                required
                                disabled={isFieldDisabled('placeOfLoading')}
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
                                disabled={isFieldDisabled('consignmentVessel')}
                            />
                        </Box>

                        {/* Row 4: Place of Delivery | Consignment Number */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                            <CustomSelect
                                label="Place of Delivery"
                                name="placeOfDelivery"
                                required
                                value={formData.placeOfDelivery}
                                onChange={handleChange}
                                disabled={isFieldDisabled('placeOfDelivery')}
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
                                disabled={isFieldDisabled('consignmentNumber')}
                            />
                        </Box>

                        {/* Row 5: Associated Container | Consignment Voyage */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                            <CustomSelect
                                label="Associated Container"
                                name="associatedContainer"
                                value={formData.associatedContainer}
                                onChange={handleChange}
                                disabled={loadingContainers || isFieldDisabled('associatedContainer')}
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
                                disabled={isFieldDisabled('consignmentVoyage')}
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
                                disabled={isFieldDisabled('orderRemarks')}
                            />
                            <CustomSelect
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={isFieldDisabled('status')}
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
                            expanded={expanded.has("panel1")}
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
                                    bgcolor: expanded.has("panel1") ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded.has("panel1") ? "#fff" : "#f58220" },
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
                                            disabled={isFieldDisabled('senderName')}
                                        />
                                        <CustomTextField
                                            label="Sender Contact"
                                            name="senderContact"
                                            value={formData.senderContact}
                                            onChange={handleChange}
                                            error={!!errors.senderContact}
                                            helperText={errors.senderContact}
                                            disabled={isFieldDisabled('senderContact')}
                                        />
                                    </Box>
                                    <CustomTextField
                                        label="Sender Address"
                                        name="senderAddress"
                                        value={formData.senderAddress}
                                        onChange={handleChange}
                                        error={!!errors.senderAddress}
                                        helperText={errors.senderAddress}
                                        multiline
                                        rows={2}
                                        disabled={isFieldDisabled('senderAddress')}
                                    />
                                    <CustomTextField
                                        label="Sender Email"
                                        name="senderEmail"
                                        value={formData.senderEmail}
                                        onChange={handleChange}
                                        error={!!errors.senderEmail}
                                        helperText={errors.senderEmail}
                                        disabled={isFieldDisabled('senderEmail')}
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            expanded={expanded.has("panel2")}
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
                                    bgcolor: expanded.has("panel2") ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded.has("panel2") ? "#fff" : "#f58220" },
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
                                            disabled={isFieldDisabled('receiverName')}
                                        />
                                        <CustomTextField
                                            label="Receiver Contact"
                                            name="receiverContact"
                                            value={formData.receiverContact}
                                            onChange={handleChange}
                                            error={!!errors.receiverContact}
                                            helperText={errors.receiverContact}
                                            disabled={isFieldDisabled('receiverContact')}
                                        />
                                    </Box>
                                    <CustomTextField
                                        label="Receiver Address"
                                        name="receiverAddress"
                                        value={formData.receiverAddress}
                                        onChange={handleChange}
                                        error={!!errors.receiverAddress}
                                        helperText={errors.receiverAddress}
                                        multiline
                                        rows={2}
                                        disabled={isFieldDisabled('receiverAddress')}
                                    />
                                    <CustomTextField
                                        label="Receiver Email"
                                        name="receiverEmail"
                                        value={formData.receiverEmail}
                                        onChange={handleChange}
                                        error={!!errors.receiverEmail}
                                        helperText={errors.receiverEmail}
                                        disabled={isFieldDisabled('receiverEmail')}
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            expanded={expanded.has("panel3")}
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
                                    bgcolor: expanded.has("panel3") ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded.has("panel3") ? "#fff" : "#f58220" },
                                }}
                            >
                                3. Shipping Details
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <CustomTextField
                                            label="Pickup Location"
                                            name="pickupLocation"
                                            value={formData.pickupLocation}
                                            onChange={handleChange}
                                            error={!!errors.pickupLocation}
                                            helperText={errors.pickupLocation}
                                        />
                                        <CustomSelect
                                            label="Category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            error={!!errors.category}
                                            required
                                        >
                                            <MenuItem value="">Select Category</MenuItem>
                                            {categories.map((c) => (
                                                <MenuItem key={c} value={c}>
                                                    {c}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <CustomSelect
                                            label="Subcategory"
                                            name="subcategory"
                                            value={formData.subcategory}
                                            onChange={handleChange}
                                            error={!!errors.subcategory}
                                            required
                                        >
                                            <MenuItem value="">Select Subcategory</MenuItem>
                                            {subcategories.map((sc) => (
                                                <MenuItem key={sc} value={sc}>
                                                    {sc}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                        <CustomSelect
                                            label="Type"
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            error={!!errors.type}
                                            required
                                        >
                                            <MenuItem value="">Select Type</MenuItem>
                                            {types.map((t) => (
                                                <MenuItem key={t} value={t}>
                                                    {t}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <CustomTextField
                                            label="Delivery Address"
                                            name="deliveryAddress"
                                            value={formData.deliveryAddress}
                                            onChange={handleChange}
                                            error={!!errors.deliveryAddress}
                                            helperText={errors.deliveryAddress}
                                            multiline
                                            rows={2}
                                        />
                                        <CustomTextField
                                            label="Weight"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleChange}
                                            error={!!errors.weight}
                                            helperText={errors.weight}
                                            required
                                        />
                                    </Box>
                                    {/* Existing fields */}
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
                                            required
                                            disabled={isFieldDisabled('eta')}
                                        />
                                        <CustomTextField
                                            label="ETD"
                                            name="etd"
                                            type="date"
                                            value={formData.etd}
                                            onChange={handleChange}
                                            required
                                            InputLabelProps={{ shrink: true }}
                                            error={!!errors.etd}
                                            helperText={errors.etd}
                                            disabled={isFieldDisabled('etd')}
                                        />
                                    </Box>
                                    <CustomTextField
                                        label="Shipping Line"
                                        name="shippingLine"
                                        value={formData.shippingLine}
                                        onChange={handleChange}
                                        required
                                        error={!!errors.shippingLine}
                                        helperText={errors.shippingLine}
                                        disabled={isFieldDisabled('shippingLine')}
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            expanded={expanded.has("panel4")}
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
                                    bgcolor: expanded.has("panel4") ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded.has("panel4") ? "#fff" : "#f58220" },
                                }}
                            >
                                4. Transport
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                                <Stack spacing={3}>
                                    {/* Existing fields */}
                                    <Stack spacing={2}>
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                            <CustomTextField
                                                label="Driver Name"
                                                name="driverName"
                                                value={formData.driverName}
                                                onChange={handleChange}
                                                error={!!errors.driverName}
                                                helperText={errors.driverName}
                                                disabled={isFieldDisabled('driverName')}
                                            />
                                            <CustomSelect
                                                label="3rd party Transport Company"
                                                name="thirdPartyTransport"
                                                value={formData.thirdPartyTransport}
                                                onChange={handleChange}
                                                error={!!errors.thirdPartyTransport}
                                                helperText={errors.thirdPartyTransport}
                                                disabled={isFieldDisabled('thirdPartyTransport')}
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
                                                error={!!errors.driverContact}
                                                helperText={errors.driverContact}
                                                disabled={isFieldDisabled('driverContact')}
                                            />
                                            <CustomTextField
                                                label="Driver NIC Number"
                                                name="driverNic"
                                                value={formData.driverNic}
                                                onChange={handleChange}
                                                error={!!errors.driverNic}
                                                helperText={errors.driverNic}
                                                disabled={isFieldDisabled('driverNic')}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                            <CustomTextField
                                                label="Driver Pickup Location"
                                                name="driverPickupLocation"
                                                value={formData.driverPickupLocation}
                                                onChange={handleChange}
                                                error={!!errors.driverPickupLocation}
                                                helperText={errors.driverPickupLocation}
                                                disabled={isFieldDisabled('driverPickupLocation')}
                                            />
                                            <CustomTextField
                                                label="Truck number"
                                                name="truckNumber"
                                                value={formData.truckNumber}
                                                onChange={handleChange}
                                                error={!!errors.truckNumber}
                                                helperText={errors.truckNumber}
                                                disabled={isFieldDisabled('truckNumber')}
                                            />
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ my: 2 }} />

                                    {showInbound && (
                                        <>
                                            <Typography variant="h6" color="#f58220" gutterBottom>
                                                🧭 Drop-Off (Inbound)
                                            </Typography>
                                            <Stack spacing={2}>
                                                <FormControl component="fieldset" error={!!errors.dropMethod}>
                                                    <RadioGroup
                                                        name="dropMethod"
                                                        value={formData.dropMethod}
                                                        onChange={handleChange}
                                                    >
                                                        <FormControlLabel value="Drop-Off" control={<Radio />} label="Drop-Off" />
                                                        <FormControlLabel value="RGSL Pickup" control={<Radio />} label="RGSL Pickup" />
                                                    </RadioGroup>
                                                </FormControl>
                                                {formData.dropMethod === 'Drop-Off' && (
                                                    <Stack spacing={2}>
                                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                            <CustomTextField
                                                                label="Drop-Off CNIC/ID"
                                                                name="dropOffCnic"
                                                                value={formData.dropOffCnic}
                                                                onChange={handleChange}
                                                                error={!!errors.dropOffCnic}
                                                                helperText={errors.dropOffCnic}
                                                                required
                                                            />
                                                            <CustomTextField
                                                                label="Drop-Off Mobile"
                                                                name="dropOffMobile"
                                                                value={formData.dropOffMobile}
                                                                onChange={handleChange}
                                                                error={!!errors.dropOffMobile}
                                                                helperText={errors.dropOffMobile}
                                                                required
                                                            />
                                                        </Box>
                                                    </Stack>
                                                )}
                                                <CustomTextField
                                                    label="Plate No (optional)"
                                                    name="plateNo"
                                                    value={formData.plateNo}
                                                    onChange={handleChange}
                                                    error={!!errors.plateNo}
                                                    helperText={errors.plateNo}
                                                />
                                                <CustomTextField
                                                    label="Drop Date"
                                                    name="dropDate"
                                                    type="date"
                                                    value={formData.dropDate}
                                                    onChange={handleChange}
                                                    InputLabelProps={{ shrink: true }}
                                                    error={!!errors.dropDate}
                                                    helperText={errors.dropDate}
                                                    required
                                                />
                                            </Stack>
                                        </>
                                    )}
                                    {showOutbound && (
                                        <>
                                            <Typography variant="h6" color="#f58220" gutterBottom>
                                                🚛 Collection (Outbound)
                                            </Typography>
                                            <Stack spacing={2}>
                                                <FormControl component="fieldset" error={!!errors.collectionMethod}>
                                                    <RadioGroup
                                                        name="collectionMethod"
                                                        value={formData.collectionMethod}
                                                        onChange={handleChange}
                                                    >
                                                        <FormControlLabel value="Delivered by RGSL" control={<Radio />} label="Delivered by RGSL" />
                                                        <FormControlLabel value="Collected by Client" control={<Radio />} label="Collected by Client" />
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormControl component="fieldset" error={!!errors.fullPartial}>
                                                    <RadioGroup
                                                        name="fullPartial"
                                                        value={formData.fullPartial}
                                                        onChange={handleChange}
                                                    >
                                                        <FormControlLabel value="Full" control={<Radio />} label="Full" />
                                                        <FormControlLabel value="Partial" control={<Radio />} label="Partial" />
                                                    </RadioGroup>
                                                </FormControl>
                                                {formData.fullPartial === 'Partial' && (
                                                    <CustomTextField
                                                        label="Qty Delivered"
                                                        name="qtyDelivered"
                                                        value={formData.qtyDelivered}
                                                        onChange={handleChange}
                                                        error={!!errors.qtyDelivered}
                                                        helperText={errors.qtyDelivered}
                                                        required
                                                        type="number"
                                                    />
                                                )}
                                                {formData.collectionMethod === 'Collected by Client' && (
                                                    <Stack spacing={2}>
                                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                            <CustomTextField
                                                                label="Receiver Name"
                                                                name="clientReceiverName"
                                                                value={formData.clientReceiverName}
                                                                onChange={handleChange}
                                                                error={!!errors.clientReceiverName}
                                                                helperText={errors.clientReceiverName}
                                                                required
                                                            />
                                                            <CustomTextField
                                                                label="Receiver ID"
                                                                name="clientReceiverId"
                                                                value={formData.clientReceiverId}
                                                                onChange={handleChange}
                                                                error={!!errors.clientReceiverId}
                                                                helperText={errors.clientReceiverId}
                                                                required
                                                            />
                                                        </Box>
                                                        <CustomTextField
                                                            label="Receiver Mobile"
                                                            name="clientReceiverMobile"
                                                            value={formData.clientReceiverMobile}
                                                            onChange={handleChange}
                                                            error={!!errors.clientReceiverMobile}
                                                            helperText={errors.clientReceiverMobile}
                                                            required
                                                        />
                                                    </Stack>
                                                )}
                                                <CustomTextField
                                                    label="Delivery Date"
                                                    name="deliveryDate"
                                                    type="date"
                                                    value={formData.deliveryDate}
                                                    onChange={handleChange}
                                                    InputLabelProps={{ shrink: true }}
                                                    error={!!errors.deliveryDate}
                                                    helperText={errors.deliveryDate}
                                                    required
                                                />
                                                <Button
                                                    variant="outlined"
                                                    component="label"
                                                    sx={{ borderRadius: 2, borderColor: "#f58220", color: "#f58220", px: 3 }}
                                                >
                                                    Gatepass Upload (Optional)
                                                    <input type="file" hidden multiple onChange={handleGatepassUpload} />
                                                </Button>
                                                {Array.isArray(formData.gatepass) && formData.gatepass.length > 0 && (
    <Stack spacing={1} direction="row" flexWrap="wrap" gap={1}>
        {formData.gatepass.map((gatepass, i) => {
            // Handle new uploads (File objects) vs existing (string URLs)
            const src = typeof gatepass === 'string' ? gatepass : URL.createObjectURL(gatepass);
            const label = typeof gatepass === 'string' ? gatepass.split('/').pop() : gatepass.name || 'File';
            
            return (
                <Chip 
                    key={i} 
                    label={label} 
                    color="secondary" 
                    size="small" 
                    variant="outlined"
                    onClick={() => {
                        setPreviewSrc(src);
                        setPreviewOpen(true);
                    }}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f58220', color: 'white' } }}
                />
            );
        })}
    </Stack>
)}
                                            </Stack>
                                        </>
                                    )}
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            expanded={expanded.has("panel5")}
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
                                    bgcolor: expanded.has("panel5") ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded.has("panel5") ? "#fff" : "#f58220" },
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
                            expanded={expanded.has("panel6")}
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
                                    bgcolor: expanded.has("panel6") ? "#0d6c6a" : "#fff3e0",
                                    borderRadius: 2,
                                    "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded.has("panel6") ? "#fff" : "#f58220" },
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
                                        disabled={isFieldDisabled('attachments')}
                                    >
                                        Upload File
                                        <input type="file" hidden multiple onChange={handleFileUpload} disabled={isFieldDisabled('attachments')} />
                                    </Button>
                                    {Array.isArray(formData.attachments) && formData.attachments.length > 0 && (
    <Stack spacing={1} direction="row" flexWrap="wrap" gap={1}>
        {formData.attachments.map((attachment, i) => {
            // Handle new uploads (File objects) vs existing (string URLs)
            const src = typeof attachment === 'string' ? attachment : URL.createObjectURL(attachment);
            const label = typeof attachment === 'string' ? attachment.split('/').pop() : attachment.name || 'File';
            
            return (
                <Chip 
                    key={i} 
                    label={label} 
                    color="secondary" 
                    size="small" 
                    variant="outlined"
                    onClick={() => {
                        setPreviewSrc(src);
                        setPreviewOpen(true);
                    }}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f58220', color: 'white' } }}
                />
            );
        })}
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


{/* Preview Modal */}
<Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
    <DialogTitle>
        File Preview
        <IconButton 
            onClick={() => setPreviewOpen(false)} 
            sx={{ position: 'absolute', right: 8, top: 8 }}
        >
            <CloseIcon />
        </IconButton>
    </DialogTitle>
    <DialogContent sx={{ p: 2 }}>
        {previewSrc && (
            <img 
                src={previewSrc} 
                alt="Preview" 
                style={{ 
                    width: '100%', 
                    height: 'auto', 
                    maxHeight: '70vh', 
                    objectFit: 'contain',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }} 
                onLoad={() => console.log('Preview loaded:', previewSrc)} // Debug
                onError={(e) => {
                    e.target.style.display = 'none';
                    setSnackbar({ 
                        open: true, 
                        message: 'Failed to load file. Check URL or file type.', 
                        severity: 'error' 
                    });
                }}
            />
        )}
        {/* Fallback for non-images (e.g., PDF): Open in new tab */}
        {!previewSrc.startsWith('blob:') && previewSrc.endsWith('.pdf') && (
            <a href={previewSrc} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', mt: 2 }}>
                <Button variant="outlined" startIcon={<DownloadIcon />}>Open PDF</Button>
            </a>
        )}
    </DialogContent>
</Dialog>
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