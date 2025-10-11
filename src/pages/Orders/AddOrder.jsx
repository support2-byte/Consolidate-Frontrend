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
    CircularProgress,
    Autocomplete,
    Checkbox,
    ListItemText,
    FormGroup,
    FormControlLabel as CheckboxFormControlLabel
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
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
        <InputLabel sx={{ color: "rgba(180, 174, 174, 1)", ...(disabled && { color: "#999" }) }}>{label}</InputLabel>
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
    const [containers, setContainers] = useState([]); // For selectedContainers multi-select
    const [loading, setLoading] = useState(false);
    const [loadingContainers, setLoadingContainers] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const orderId = location.state?.orderId;
    const [isEditMode, setIsEditMode] = useState(!!orderId);

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
        // Core orders fields (added missing: point_of_origin, consignment_remarks, consignment_marks)
        bookingRef: "",
        rglBookingNumber: "",
        placeOfLoading: "",
        pointOfOrigin: "",  // Added
        finalDestination: "",
        placeOfDelivery: "",
        orderRemarks: "",
        eta: "",
        etd: "",
        shippingLine: "",
        attachments: [],
        // Senders fields (added sender_ref, sender_remarks)
        senderName: "",
        senderContact: "",
        senderAddress: "",
        senderEmail: "",
        senderRef: "",  // Added
        senderRemarks: "",  // Added
        // Receivers array (added receiver_ref, consignment_marks, consignment_voyage)
        receivers: [{
            receiverName: "",
            receiverContact: "",
            receiverAddress: "",
            receiverEmail: "",
            consignmentVessel: "",
            consignmentNumber: "",
            consignmentMarks: "",  // Added
            consignmentVoyage: "",  // Added
            totalNumber: "",
            totalWeight: "",
            itemRef: "",
            receiverRef: "",  // Added
            status: "Created",
            containers: []
        }],
        // Order Items fields (added consignment_status, total_weight calculated)
        category: '',  // Instead of null
        subcategory: '',  // Instead of null
        type: '',  // Or 'Select Type' if that's your placeholder
        pickupLocation: "",
        deliveryAddress: "",
        totalNumber: "",
        weight: "",  // Keep single weight; remove duplicate totalWeight
        itemRef: "",
        consignmentStatus: "",  // Added
        // Transport fields (added dropoff_name as drop_off_person)
        transportType: "Road",  // Default per schema
        thirdPartyTransport: "",
        driverName: "",
        driverContact: "",
        driverNic: "",
        driverPickupLocation: "",
        truckNumber: "",
        dropMethod: "",
        dropoffName: "",  // Added (drop_off_person name)
        dropOffCnic: "",
        dropOffMobile: "",
        plateNo: "",
        dropDate: "",
        collectionMethod: "",
        fullPartial: "",
        qtyDelivered: "",
        clientReceiverName: "",
        clientReceiverId: "",
        clientReceiverMobile: "",
        deliveryDate: "",
        gatepass: [],
    });

    // Editable fields in edit mode
    const editableInEdit = [
        'transportType',
        'dropMethod',
        'dropoffName',
        'dropOffCnic',
        'dropOffMobile',
        'plateNo',
        'dropDate',
        'collectionMethod',
        'fullPartial',
        'qtyDelivered',
        'clientReceiverName',
        'clientReceiverId',
        'clientReceiverMobile',
        'deliveryDate',
        'thirdPartyTransport',
        'driverName',
        'driverContact',
        'driverNic',
        'driverPickupLocation',
        'truckNumber'
    ];

    // Receiver specific fields for error mapping (updated)
    const receiverFields = [
        'receiverName',
        'receiverContact',
        'receiverAddress',
        'receiverEmail',
        'consignmentVessel',
        'consignmentNumber',
        'consignmentMarks',  // Added
        'consignmentVoyage',  // Added
        'totalNumber',
        'totalWeight',
        'itemRef',
        'receiverRef',  // Added
        'status'
    ];

    // Required fields validation (updated, removed duplicate totalWeight)
    const requiredFields = [
        'bookingRef',
        'rglBookingNumber',
        'senderName',
        'placeOfLoading',
        'finalDestination',
        'transportType',
        // New required for order_items
        'category',
        'subcategory',
        'type',
        'totalNumber',
        'weight',  // Single weight
        'shippingLine',
        'pointOfOrigin'  // Added
        // Removed consignmentMarks and consignmentRemarks to align with UI (not rendered)
    ];

    // Helper to convert snake_case to camelCase
    const snakeToCamel = (str) => str.replace(/(_[a-z])/g, g => g[1].toUpperCase());

    // Helper to convert camelCase to snake_case
    const camelToSnake = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();

    const validateForm = () => {
        const newErrors = {};

        requiredFields.forEach(field => {
            if (!formData[field]?.trim()) {
                newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
            }
        });

        // Validate receivers (at least one, and required fields; updated)
        if (formData.receivers.length === 0) {
            newErrors.receivers = 'At least one receiver is required';
        } else {
            formData.receivers.forEach((rec, i) => {
                if (!rec.receiverName?.trim()) {
                    newErrors[`receivers[${i}].receiverName`] = `Receiver ${i + 1} name is required`;
                }
                if (rec.containers.length === 0) {
                    newErrors[`receivers[${i}].containers`] = `At least one container is required for receiver ${i + 1}`;
                }
                if (!rec.consignmentNumber?.trim()) {
                    newErrors[`receivers[${i}].consignmentNumber`] = `Consignment number is required for receiver ${i + 1}`;
                }
                if (!rec.totalWeight?.trim()) {
                    newErrors[`receivers[${i}].totalWeight`] = `Total weight is required for receiver ${i + 1}`;
                }
                if (!rec.receiverRef?.trim()) {
                    newErrors[`receivers[${i}].receiverRef`] = `Receiver ref is required for receiver ${i + 1}`;
                }
                // Add more per-receiver validations (e.g., email)
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (rec.receiverEmail && !emailRegex.test(rec.receiverEmail)) {
                    newErrors[`receivers[${i}].receiverEmail`] = `Invalid receiver ${i + 1} email format`;
                }
            });
        }

        // Transport Type validations (updated with dropoff_name)
        if (formData.transportType === 'Drop Off') {
            if (!formData.dropDate?.trim()) {
                newErrors.dropDate = 'Drop Date is required';
            }
            if (formData.dropMethod === 'Drop-Off') {
                if (!formData.dropoffName?.trim()) {
                    newErrors.dropoffName = 'Drop-Off Person Name is required';
                }
                if (!formData.dropOffCnic?.trim()) {
                    newErrors.dropOffCnic = 'Drop-Off CNIC/ID is required';
                }
                if (!formData.dropOffMobile?.trim()) {
                    newErrors.dropOffMobile = 'Drop-Off Mobile is required';
                }
            }
        }

        if (formData.transportType === 'Collection') {
            if (!formData.deliveryDate?.trim()) {
                newErrors.deliveryDate = 'Delivery Date is required';
            }
            if (formData.fullPartial === 'Partial' && !formData.qtyDelivered?.trim()) {
                newErrors.qtyDelivered = 'Qty Delivered is required for Partial';
            }
            if (formData.collectionMethod === 'Collected by Client') {
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
        }

        if (formData.transportType === 'Third Party') {
            if (!formData.thirdPartyTransport?.trim() || formData.thirdPartyTransport === 'Select 3rd party company') {
                newErrors.thirdPartyTransport = '3rd party Transport Company is required';
            }
            if (!formData.driverName?.trim()) {
                newErrors.driverName = 'Driver Name is required';
            }
            if (!formData.driverContact?.trim()) {
                newErrors.driverContact = 'Driver Contact is required';
            }
            if (!formData.driverNic?.trim()) {
                newErrors.driverNic = 'Driver NIC is required';
            }
            if (!formData.driverPickupLocation?.trim()) {
                newErrors.driverPickupLocation = 'Driver Pickup Location is required';
            }
            if (!formData.truckNumber?.trim()) {
                newErrors.truckNumber = 'Truck Number is required';
            }
        }

        // Email validation for sender
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.senderEmail && !emailRegex.test(formData.senderEmail)) {
            newErrors.senderEmail = 'Invalid sender email format';
        }

        // Date validation (if provided)
        const dateFields = ['eta', 'etd', 'dropDate', 'deliveryDate'];
        dateFields.forEach(field => {
            if (formData[field] && !/^\d{4}-\d{2}-\d{2}$/.test(formData[field])) {
                newErrors[field] = 'Invalid date format (YYYY-MM-DD)';
            }
        });

        // Weight validation (single weight)
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

    // Auto-expand accordions with errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const panelsToExpand = new Set();
            Object.keys(errors).forEach(key => {
                if (['senderName', 'senderContact', 'senderAddress', 'senderEmail', 'senderRef', 'senderRemarks'].includes(key)) panelsToExpand.add('panel1');
                if (key.startsWith('receivers[')) panelsToExpand.add('panel2');
                if (['category', 'subcategory', 'type', 'weight', 'pickupLocation', 'deliveryAddress', 'consignmentStatus', 'itemRef'].includes(key)) panelsToExpand.add('panel3');
                if (['transportType', 'dropMethod', 'dropoffName', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate', 'collectionMethod', 'fullPartial', 'qtyDelivered', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber', 'thirdPartyTransport'].includes(key)) panelsToExpand.add('panel4');
            });
            setExpanded(prev => new Set([...prev, ...panelsToExpand]));
        }
    }, [errors]);


    useEffect(() => {
        if (formData.category) {
            fetchSubcategories(formData.category);
        } else {
            setSubcategories([]);  // Already good
            setFormData(prev => ({ ...prev, subcategory: '' }));  // Fixed: Reset subcategory to '' to match options
        }
    }, [formData.category]);

    // Auto-populate receiver totalNumber and totalWeight from shipping details if empty
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            receivers: prev.receivers.map(rec => ({
                ...rec,
                totalNumber: rec.totalNumber || formData.totalNumber,
                totalWeight: rec.totalWeight || formData.weight
            }))
        }));
    }, [formData.totalNumber, formData.weight]);

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
        const subs = categorySubMap[category] || [];
        setSubcategories(subs);
        // Fixed: If no subcategories, reset formData.subcategory to '' to avoid null/mismatch
        if (subs.length === 0) {
            setFormData(prev => ({ ...prev, subcategory: '' }));
        }
    };

    // Example: Call fetchCategories on mount if needed
    useEffect(() => {
        fetchCategories();
    }, []);

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

    // Updated fetchOrder to handle new fields and multiples
    const fetchOrder = async (id) => {
        setLoading(true)
        try {
            const response = await api.get(`/api/orders/${id}`, { params: { includeContainer: true } });
            // Map snake_case to camelCase for core fields
            const camelData = {};
            Object.keys(response.data).forEach(apiKey => {
                let value = response.data[apiKey];
                // Sanitize null/undefined to '' for string fields
                if (value === null || value === undefined) value = '';
                // Handle dates: convert to YYYY-MM-DD format if it's a full ISO string or timestamp
                if (['eta', 'etd', 'drop_date', 'delivery_date'].includes(apiKey)) {
                    if (value) {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                            value = date.toISOString().split('T')[0];
                        }
                    } else {
                        value = '';
                    }
                }
                const camelKey = snakeToCamel(apiKey);
                camelData[camelKey] = value;
            });
            // Handle order_items - take first one
            if (response.data.order_items && response.data.order_items.length > 0) {
                const item = response.data.order_items[0];
                const camelItem = {};
                Object.keys(item).forEach(apiKey => {
                    let val = item[apiKey];
                    if (val === null || val === undefined) val = '';
                    const camelKey = snakeToCamel(apiKey);
                    camelItem[camelKey] = val;
                });
                camelData.category = camelItem.category;
                camelData.subcategory = camelItem.subcategory;
                camelData.type = camelItem.type;
                camelData.pickupLocation = camelItem.pickupLocation;
                camelData.deliveryAddress = camelItem.deliveryAddress;
                camelData.totalNumber = camelItem.totalNumber;
                camelData.weight = camelItem.weight;
                camelData.itemRef = camelItem.itemRef;
                camelData.consignmentStatus = camelItem.consignmentStatus;
            }
            // Handle multiples - map receivers to camelCase (updated for new fields)
            camelData.receivers = (response.data.receivers || []).map(rec => {
                const camelRec = {};
                Object.keys(rec).forEach(apiKey => {
                    let val = rec[apiKey];
                    // Sanitize null/undefined to ''
                    if (val === null || val === undefined) val = '';
                    const camelKey = snakeToCamel(apiKey);
                    camelRec[camelKey] = val;
                });
                // Handle containers - strings or objects
                if (Array.isArray(rec.containers) && rec.containers.length > 0) {
                    camelRec.containers = rec.containers.map(c => typeof c === 'object' ? c.container_number : c);
                } else {
                    camelRec.containers = [];
                }
                // Handle status - default to "Created" if not present (assuming API may not return it yet)
                camelRec.status = rec.status || "Created";
                return camelRec;
            });
            if (camelData.receivers.length === 0) {
                camelData.receivers = [{
                    receiverName: "",
                    receiverContact: "",
                    receiverAddress: "",
                    receiverEmail: "",
                    consignmentVessel: "",
                    consignmentNumber: "",
                    consignmentMarks: "",
                    consignmentVoyage: "",
                    totalNumber: "",
                    totalWeight: "",
                    itemRef: "",
                    receiverRef: "",
                    status: "Created",
                    containers: []
                }];
            }
            // Attachments/gatepass unchanged
            const cleanAttachments = (paths) => (paths || []).map(path => {
                if (typeof path === 'string' && path.startsWith('function wrap()')) {
                    return path.substring(62);
                }
                return path;
            });
            camelData.attachments = cleanAttachments(camelData.attachments || []);
            camelData.gatepass = cleanAttachments(camelData.gatepass || []);
            const apiBase = import.meta.env.VITE_API_URL;
            camelData.attachments = camelData.attachments.map(path =>
                path.startsWith('http') ? path : `${apiBase}${path}`
            );
            camelData.gatepass = camelData.gatepass.map(path =>
                path.startsWith('http') ? path : `${apiBase}${path}`
            );
            console.log('pathn data', camelData.attachments)
            setFormData(camelData);
        } catch (err) {
            console.error("Error fetching order:", err);
            setSnackbar({
                open: true,
                message: err.response?.data?.error || err.message || 'Failed to fetch order',
                severity: 'error',
            });
            if (err.response?.status === 404) {
                navigate('/orders');
            }
        } finally {
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
            if (name === 'transportType' && value !== prev.transportType) {
                // Clear all transport-specific fields when switching
                updated.dropMethod = '';
                updated.dropoffName = '';
                updated.dropOffCnic = '';
                updated.dropOffMobile = '';
                updated.plateNo = '';
                updated.dropDate = '';
                updated.collectionMethod = '';
                updated.fullPartial = '';
                updated.qtyDelivered = '';
                updated.clientReceiverName = '';
                updated.clientReceiverId = '';
                updated.clientReceiverMobile = '';
                updated.deliveryDate = '';
                updated.gatepass = [];
                updated.driverName = '';
                updated.driverContact = '';
                updated.driverNic = '';
                updated.driverPickupLocation = '';
                updated.truckNumber = '';
                updated.thirdPartyTransport = '';
            }
            if (name === 'dropMethod' && value === 'RGSL Pickup') {
                updated.dropoffName = '';
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

    // Handlers for receivers (updated for new fields)
    const addReceiver = () => {
        setFormData(prev => ({
            ...prev,
            receivers: [...prev.receivers, {
                receiverName: "",
                receiverContact: "",
                receiverAddress: "",
                receiverEmail: "",
                consignmentVessel: "",
                consignmentNumber: "",
                consignmentMarks: "",
                consignmentVoyage: "",
                totalNumber: prev.totalNumber || "",
                totalWeight: prev.weight || "",
                itemRef: "",
                receiverRef: "",
                status: "Created",
                containers: []
            }]
        }));
    };

    const removeReceiver = (index) => {
        setFormData(prev => ({
            ...prev,
            receivers: prev.receivers.filter((_, i) => i !== index)
        }));
    };

    const handleReceiverChange = (index, field) => (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            receivers: prev.receivers.map((rec, i) =>
                i === index ? { ...rec, [field]: value } : rec
            )
        }));
        // Clear error
        if (errors[`receivers[${index}].${field}`]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[`receivers[${index}].${field}`];
                return newErr;
            });
        }
    };

    const handleReceiverContainersChange = (index) => (event) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            receivers: prev.receivers.map((r, i) =>
                i === index ? { ...r, containers: value || [] } : r
            ),
        }));
        // Clear error
        if (errors[`receivers[${index}].containers`]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[`receivers[${index}].containers`];
                return newErr;
            });
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

        // Append core orders fields (updated with new fields)
        const coreKeys = ['bookingRef', 'rglBookingNumber', 'placeOfLoading', 'pointOfOrigin', 'finalDestination', 'placeOfDelivery', 'orderRemarks', 'eta', 'etd', 'shippingLine', 'attachments'];
        coreKeys.forEach(key => {
            const value = formData[key];
            if (dateFields.includes(key) && value === '') {
                // Skip empty dates
            } else {
                const apiKey = camelToSnake(key);
                formDataToSend.append(apiKey, value || '');
            }
        });

        // Append senders fields (new)
        const senderKeys = ['senderName', 'senderContact', 'senderAddress', 'senderEmail', 'senderRef', 'senderRemarks'];
        senderKeys.forEach(key => {
            const apiKey = camelToSnake(key);
            formDataToSend.append(apiKey, formData[key] || '');
        });

        // Append receivers as JSON (updated with new fields)
        const receiversToSend = formData.receivers.map((rec, i) => {
            const snakeRec = {};
            Object.keys(rec).forEach(key => {
                if (key === 'containers') {
                    snakeRec.containers = rec.containers;
                } else {
                    const snakeKey = camelToSnake(key);
                    snakeRec[snakeKey] = rec[key];
                }
            });
            // Auto-generate item_ref if empty
            if (!snakeRec.item_ref) {
                snakeRec.item_ref = `ITEM-REF-${i + 1}-${Date.now()}`;
            }
            return snakeRec;
        });
        formDataToSend.append('receivers', JSON.stringify(receiversToSend));

        // Append order_items fields (single)
        const itemKeys = ['category', 'subcategory', 'type', 'pickupLocation', 'deliveryAddress', 'totalNumber', 'weight', 'consignmentStatus'];
        itemKeys.forEach(key => {
            const apiKey = camelToSnake(key);
            formDataToSend.append(apiKey, formData[key] || '');
        });
        // Auto-generate item_ref for order_items if empty
        const orderItemRef = formData.itemRef || `ORDER-ITEM-REF-${Date.now()}`;
        formDataToSend.append('item_ref', orderItemRef);

        // Append transport fields (updated with dropoff_name)
        const transportKeys = ['transportType', 'thirdPartyTransport', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber', 'dropMethod', 'dropoffName', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate', 'collectionMethod', 'fullPartial', 'qtyDelivered', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate', 'gatepass'];
        transportKeys.forEach(key => {
            const value = formData[key];
            const apiKey = camelToSnake(key);
            formDataToSend.append(apiKey, value || '');
        });

        // Handle attachments and gatepass
        ['attachments', 'gatepass'].forEach(key => {
            const value = formData[key];
            if (Array.isArray(value) && value.length > 0) {
                const existing = value.filter(item => typeof item === 'string');
                const newFiles = value.filter(item => item instanceof File);
                if (newFiles.length > 0) {
                    newFiles.forEach(file => formDataToSend.append(key, file));
                }
                if (existing.length > 0) {
                    const apiKey = camelToSnake(key);
                    formDataToSend.append(`${apiKey}_existing`, JSON.stringify(existing));
                }
            }
        });

        try {
            if (isEditMode) {
                await api.put(`/api/orders/${orderId}`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                await fetchOrder(orderId);
            } else {
                await api.post(`/api/orders`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                navigate('/orders');
            }
            setSnackbar({
                open: true,
                message: isEditMode ? 'Order updated successfully' : 'Order created successfully',
                severity: 'success',
            });
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
                errorsList.forEach(({ field, msg }) => {
                    if (receiverFields.includes(field)) {
                        newErrors[`receivers[0].${field}`] = msg;
                    } else {
                        newErrors[field] = msg;
                    }
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

    const isFieldDisabled = (name) => {
        if (!isEditMode) return false;
        return !editableInEdit.includes(name);
    };

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

                    {/* Top Order Fields - updated with missing fields */}
                    <Stack spacing={3} mb={4}>
                        {/* Row 1: Booking Ref | RGL Booking Number */}
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
                                label="RGL Booking Number"
                                name="rglBookingNumber"
                                value={formData.rglBookingNumber}
                                onChange={handleChange}
                                error={!!errors.rglBookingNumber}
                                helperText={errors.rglBookingNumber}
                                required
                                disabled={isFieldDisabled('rglBookingNumber')}
                            />
                        </Box>

                        {/* Row 2: Point of Origin | Place of Loading */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                            <CustomSelect
                                label="Point of Origin"
                                name="pointOfOrigin"
                                value={formData.pointOfOrigin}
                                onChange={handleChange}
                                error={!!errors.pointOfOrigin}
                                required
                                disabled={isFieldDisabled('pointOfOrigin')}
                            >
                                {places.map((p) => (
                                    <MenuItem key={p} value={p}>
                                        {p}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
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
                        </Box>

                        {/* Row 3: Place of Delivery | Final Destination */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                            <CustomSelect
                                label="Place of Delivery"
                                name="placeOfDelivery"
                                value={formData.placeOfDelivery}
                                onChange={handleChange}
                                error={!!errors.placeOfDelivery}
                                required
                                disabled={isFieldDisabled('placeOfDelivery')}
                            >
                                {places.map((p) => (
                                    <MenuItem key={p} value={p}>
                                        {p}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
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

                        {/* Row 4: Order Remarks */}
                        <CustomTextField
                            label="Order Remarks"
                            name="orderRemarks"
                            value={formData.orderRemarks}
                            onChange={handleChange}
                            error={!!errors.orderRemarks}
                            helperText={errors.orderRemarks}
                            fullWidth
                            multiline
                            rows={2}
                            disabled={isFieldDisabled('orderRemarks')}
                        />
                    </Stack>

                    <Divider sx={{ my: 3, borderColor: "#e0e0e0" }} />

                    {/* Accordion Sections */}
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
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <CustomTextField
                                            label="Sender Email"
                                            name="senderEmail"
                                            value={formData.senderEmail}
                                            onChange={handleChange}
                                            error={!!errors.senderEmail}
                                            helperText={errors.senderEmail}
                                            disabled={isFieldDisabled('senderEmail')}
                                        />
                                        <CustomTextField
                                            label="Sender Ref"
                                            name="senderRef"
                                            value={formData.senderRef}
                                            onChange={handleChange}
                                            error={!!errors.senderRef}
                                            helperText={errors.senderRef}
                                            disabled={isFieldDisabled('senderRef')}
                                        />
                                    </Box>
                                    <CustomTextField
                                        label="Sender Remarks"
                                        name="senderRemarks"
                                        value={formData.senderRemarks}
                                        onChange={handleChange}
                                        error={!!errors.senderRemarks}
                                        helperText={errors.senderRemarks}
                                        multiline
                                        rows={2}
                                        disabled={isFieldDisabled('senderRemarks')}
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
                                2. Shipping Details
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
                                            disabled={isFieldDisabled('pickupLocation')}
                                        />
                                        <CustomSelect
                                            label="Category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            error={!!errors.category}
                                            required
                                            disabled={isFieldDisabled('category')}
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
                                            disabled={isFieldDisabled('subcategory')}
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
                                            disabled={isFieldDisabled('type')}
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
                                            label="Total Number"
                                            name="totalNumber"
                                            value={formData.totalNumber}
                                            onChange={handleChange}
                                            error={!!errors.totalNumber}
                                            helperText={errors.totalNumber}
                                            required
                                            disabled={isFieldDisabled('totalNumber')}
                                        />
                                        <CustomTextField
                                            label="Weight"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleChange}
                                            error={!!errors.weight}
                                            helperText={errors.weight}
                                            required
                                            disabled={isFieldDisabled('weight')}
                                        />
                                        {/* Removed duplicate totalWeight; calculate if needed */}
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
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
                                        <CustomTextField
                                            label="Remarks"
                                            name="consignmentStatus"
                                            value={formData.consignmentStatus}
                                            onChange={handleChange}
                                            error={!!errors.consignmentStatus}
                                            helperText={errors.consignmentStatus}
                                            disabled={isFieldDisabled('consignmentStatus')}
                                        />
                                    </Box>
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
                                            InputLabelProps={{ shrink: true }}
                                            error={!!errors.etd}
                                            helperText={errors.etd}
                                            required
                                            disabled={isFieldDisabled('etd')}
                                        />
                                    </Box>

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
                                3. Receiver Details
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                                <Stack spacing={2}>
                                    {errors.receivers && <Alert severity="error">{errors.receivers}</Alert>}
                                    {formData.receivers.map((rec, i) => (
                                        <Box key={i} sx={{ p: 2, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                                <Typography variant="subtitle1" color="primary" fontWeight={"bold"}>Receiver {i + 1}</Typography>
                                                {formData.receivers.length > 1 && (
                                                    <IconButton onClick={() => removeReceiver(i)} size="small">
                                                        <DeleteIcon />
                                                    </IconButton>
                                                )}
                                            </Stack>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                <CustomTextField
                                                    label="Receiver Name"
                                                    value={rec.receiverName}
                                                    onChange={handleReceiverChange(i, 'receiverName')}
                                                    error={!!errors[`receivers[${i}].receiverName`]}
                                                    helperText={errors[`receivers[${i}].receiverName`]}
                                                    required
                                                />
                                                <CustomTextField
                                                    label="Receiver Contact"
                                                    value={rec.receiverContact}
                                                    onChange={handleReceiverChange(i, 'receiverContact')}
                                                    error={!!errors[`receivers[${i}].receiverContact`]}
                                                    helperText={errors[`receivers[${i}].receiverContact`]}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', py: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>

                                                <CustomTextField
                                                    label="Receiver Address"
                                                    value={rec.receiverAddress}
                                                    onChange={handleReceiverChange(i, 'receiverAddress')}
                                                    error={!!errors[`receivers[${i}].receiverAddress`]}
                                                    helperText={errors[`receivers[${i}].receiverAddress`]}

                                                />
                                                <CustomTextField
                                                    label="Receiver Email"
                                                    value={rec.receiverEmail}
                                                    onChange={handleReceiverChange(i, 'receiverEmail')}
                                                    error={!!errors[`receivers[${i}].receiverEmail`]}
                                                    helperText={errors[`receivers[${i}].receiverEmail`]}
                                                />
                                            </Box>
                                            {/* Assigned Containers - Multi Select */}
                                            <Typography variant="subtitle1" color="primary" fontWeight={"bold"} >Assigned Containers</Typography>
                                            <Box sx={{ display: 'flex', py: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>

                                                <FormControl sx={{ flex: 1, minWidth: 0 }} error={!!errors[`receivers[${i}].containers`]}>
                                                    <InputLabel sx={{ color: "rgba(180, 174, 174, 1)" }}>Select Containers</InputLabel>
                                                    <Select

                                                        value={rec.containers || []}
                                                        label="Select Containers"
                                                        onChange={handleReceiverContainersChange(i)}
                                                        disabled={loadingContainers}
                                                        size="medium"
                                                        sx={{
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
                                                                ...(errors[`receivers[${i}].containers`] && { "& fieldset": { borderColor: "#d32f2f" } }),
                                                            },
                                                        }}
                                                    >
                                                        {containers.map((container) => (
                                                            <MenuItem key={container.cid} value={container.container_number}>
                                                                {`${container.container_number} (${container.container_size} - ${container.derived_status || container.availability})`}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {errors[`receivers[${i}].containers`] && <Typography variant="caption" color="error">{errors[`receivers[${i}].containers`]}</Typography>}
                                                </FormControl>
                                                <CustomSelect
                                                    label="Status"
                                                    name="status"
                                                    value={rec.status}
                                                    onChange={handleReceiverChange(i, 'status')}
                                                    error={!!errors[`receivers[${i}].status`]}
                                                    helperText={errors[`receivers[${i}].status`]}
                                                >
                                                    {statuses.map((s) => (
                                                        <MenuItem key={s} value={s}>
                                                            {s}
                                                        </MenuItem>
                                                    ))}
                                                </CustomSelect>

                                            </Box>
                                            {/* Per-Receiver Consignment Details - updated with new fields */}
                                            <Typography variant="subtitle1" color="primary" fontWeight={"bold"} >Consignment Details</Typography>
                                            <Stack spacing={2}>
                                                <Box sx={{ display: 'flex', py: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label="Consignment Vessel"
                                                        value={rec.consignmentVessel || ""}
                                                        onChange={handleReceiverChange(i, 'consignmentVessel')}
                                                    />

                                                    <CustomTextField
                                                        label="Consignment Marks"
                                                        value={rec.consignmentMarks || ""}
                                                        onChange={handleReceiverChange(i, 'consignmentMarks')}
                                                        error={!!errors[`receivers[${i}].consignmentMarks`]}
                                                        helperText={errors[`receivers[${i}].consignmentMarks`]}
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label="Consignment Number"
                                                        value={rec.consignmentNumber || ""}
                                                        onChange={handleReceiverChange(i, 'consignmentNumber')}
                                                        error={!!errors[`receivers[${i}].consignmentNumber`]}
                                                        helperText={errors[`receivers[${i}].consignmentNumber`]}
                                                        required
                                                    />
                                                    <CustomTextField
                                                        label="Consignment Voyage"
                                                        value={rec.consignmentVoyage || ""}
                                                        onChange={handleReceiverChange(i, 'consignmentVoyage')}
                                                        error={!!errors[`receivers[${i}].consignmentVoyage`]}
                                                        helperText={errors[`receivers[${i}].consignmentVoyage`]}
                                                    />
                                                    <CustomTextField
                                                        label="Receiver Ref"
                                                        value={rec.receiverRef || ""}
                                                        onChange={handleReceiverChange(i, 'receiverRef')}
                                                        error={!!errors[`receivers[${i}].receiverRef`]}
                                                        helperText={errors[`receivers[${i}].receiverRef`]}
                                                        required
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label="Total Number"
                                                        value={rec.totalNumber || ""}
                                                        onChange={handleReceiverChange(i, 'totalNumber')}
                                                    />
                                                    <CustomTextField
                                                        label="Total Weight"
                                                        value={rec.totalWeight || ""}
                                                        onChange={handleReceiverChange(i, 'totalWeight')}
                                                        error={!!errors[`receivers[${i}].totalWeight`]}
                                                        helperText={errors[`receivers[${i}].totalWeight`]}
                                                        required
                                                    />
                                                    <CustomTextField
                                                        label="Ref Number"
                                                        value={rec.itemRef || ""}
                                                        disabled={true}
                                                    />
                                                </Box>
                                            </Stack>
                                        </Box>
                                    ))}
                                    <Button
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={addReceiver}
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Add Receiver
                                    </Button>
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
                                    <FormControl component="fieldset" error={!!errors.transportType}>
                                        <Typography variant="h6" color="#f58220" gutterBottom>
                                            Transport Type
                                        </Typography>
                                        <RadioGroup
                                            name="transportType"
                                            value={formData.transportType}
                                            onChange={handleChange}
                                            style={{ flexDirection: "row" }}
                                        >
                                            <FormControlLabel value="Drop Off" control={<Radio />} label="Drop Off" />
                                            <FormControlLabel value="Collection" control={<Radio />} label="Collection" />
                                            <FormControlLabel value="Third Party" control={<Radio />} label="Third Party" />
                                        </RadioGroup>
                                        {errors.transportType && <Typography variant="caption" color="error">{errors.transportType}</Typography>}
                                    </FormControl>

                                    {formData.transportType === 'Drop Off' && (
                                        <Stack spacing={2}>
                                            <Typography variant="h6" color="#f58220" gutterBottom>
                                                🧭 Drop-Off Details
                                            </Typography>
                                            <CustomSelect
                                                label="Drop Method"
                                                name="dropMethod"
                                                value={formData.dropMethod}
                                                onChange={handleChange}
                                                error={!!errors.dropMethod}
                                                required
                                                disabled={isFieldDisabled('dropMethod')}
                                            >
                                                <MenuItem value="">Select Drop Method</MenuItem>
                                                <MenuItem value="Drop-Off">Drop-Off</MenuItem>
                                                <MenuItem value="RGSL Pickup">RGSL Pickup</MenuItem>
                                            </CustomSelect>
                                            <Stack spacing={2}>
                                                <CustomTextField
                                                    label="Drop-Off Person Name"
                                                    name="dropoffName"
                                                    value={formData.dropoffName}
                                                    onChange={handleChange}
                                                    error={!!errors.dropoffName}
                                                    helperText={errors.dropoffName}
                                                    required={formData.dropMethod === 'Drop-Off'}
                                                    disabled={isFieldDisabled('dropoffName')}
                                                />
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label="Drop-Off CNIC/ID"
                                                        name="dropOffCnic"
                                                        value={formData.dropOffCnic}
                                                        onChange={handleChange}
                                                        error={!!errors.dropOffCnic}
                                                        helperText={errors.dropOffCnic}
                                                        required={formData.dropMethod === 'Drop-Off'}
                                                        disabled={isFieldDisabled('dropOffCnic')}
                                                    />
                                                    <CustomTextField
                                                        label="Drop-Off Mobile"
                                                        name="dropOffMobile"
                                                        value={formData.dropOffMobile}
                                                        onChange={handleChange}
                                                        error={!!errors.dropOffMobile}
                                                        helperText={errors.dropOffMobile}
                                                        required={formData.dropMethod === 'Drop-Off'}
                                                        disabled={isFieldDisabled('dropOffMobile')}
                                                    />
                                                </Box>
                                            </Stack>
                                            <CustomTextField
                                                label="Plate No (optional)"
                                                name="plateNo"
                                                value={formData.plateNo}
                                                onChange={handleChange}
                                                error={!!errors.plateNo}
                                                helperText={errors.plateNo}
                                                disabled={isFieldDisabled('plateNo')}
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
                                                disabled={isFieldDisabled('dropDate')}
                                            />
                                        </Stack>
                                    )}

                                    {formData.transportType === 'Collection' && (
                                        <Stack spacing={2}>
                                            <Typography variant="h6" color="#f58220" gutterBottom>
                                                🚛 Collection Details
                                            </Typography>
                                            <CustomSelect
                                                label="Collection Method"
                                                name="collectionMethod"
                                                value={formData.collectionMethod}
                                                onChange={handleChange}
                                                error={!!errors.collectionMethod}
                                                required
                                                disabled={isFieldDisabled('collectionMethod')}
                                            >
                                                <MenuItem value="">Select Collection Method</MenuItem>
                                                <MenuItem value="Delivered by RGSL">Delivered by RGSL</MenuItem>
                                                <MenuItem value="Collected by Client">Collected by Client</MenuItem>
                                            </CustomSelect>
                                            <CustomSelect
                                                label="Full/Partial"
                                                name="fullPartial"
                                                value={formData.fullPartial}
                                                onChange={handleChange}
                                                error={!!errors.fullPartial}
                                                required
                                                disabled={isFieldDisabled('fullPartial')}
                                            >
                                                <MenuItem value="">Select Full/Partial</MenuItem>
                                                <MenuItem value="Full">Full</MenuItem>
                                                <MenuItem value="Partial">Partial</MenuItem>
                                            </CustomSelect>
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
                                                    disabled={isFieldDisabled('qtyDelivered')}
                                                />
                                            )}
                                            <Stack spacing={2}>
                                                <CustomTextField
                                                    label="Receiver Name / CNIC/ID"
                                                    name="clientReceiverName"
                                                    value={formData.clientReceiverName}
                                                    onChange={handleChange}
                                                    error={!!errors.clientReceiverName}
                                                    helperText={errors.clientReceiverName}
                                                    required={formData.collectionMethod === 'Collected by Client'}
                                                    disabled={isFieldDisabled('clientReceiverName')}
                                                />
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label="Receiver ID"
                                                        name="clientReceiverId"
                                                        value={formData.clientReceiverId}
                                                        onChange={handleChange}
                                                        error={!!errors.clientReceiverId}
                                                        helperText={errors.clientReceiverId}
                                                        required={formData.collectionMethod === 'Collected by Client'}
                                                        disabled={isFieldDisabled('clientReceiverId')}
                                                    />
                                                    <CustomTextField
                                                        label="Receiver Mobile"
                                                        name="clientReceiverMobile"
                                                        value={formData.clientReceiverMobile}
                                                        onChange={handleChange}
                                                        error={!!errors.clientReceiverMobile}
                                                        helperText={errors.clientReceiverMobile}
                                                        required={formData.collectionMethod === 'Collected by Client'}
                                                        disabled={isFieldDisabled('clientReceiverMobile')}
                                                    />
                                                </Box>
                                                <CustomTextField
                                                    label="Plate No (optional)"
                                                    name="plateNo"
                                                    value={formData.plateNo}
                                                    onChange={handleChange}
                                                    error={!!errors.plateNo}
                                                    helperText={errors.plateNo}
                                                    disabled={isFieldDisabled('plateNo')}
                                                />
                                            </Stack>
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
                                                disabled={isFieldDisabled('deliveryDate')}
                                            />
                                            <Button
                                                variant="outlined"
                                                component="label"
                                                sx={{ borderRadius: 2, borderColor: "#f58220", color: "#f58220", px: 3 }}
                                                disabled={isFieldDisabled('gatepass')}
                                            >
                                                Gatepass Upload (Optional)
                                                <input type="file" hidden multiple onChange={handleGatepassUpload} disabled={isFieldDisabled('gatepass')} />
                                            </Button>
                                            {Array.isArray(formData.gatepass) && formData.gatepass.length > 0 && (
                                                <Stack spacing={1} direction="row" flexWrap="wrap" gap={1}>
                                                    {formData.gatepass.map((gatepass, i) => {
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
                                    )}

                                    {formData.transportType === 'Third Party' && (
                                        <Stack spacing={2}>
                                            <Typography variant="h6" color="#f58220" gutterBottom>
                                                👥 Third Party Details
                                            </Typography>
                                            <CustomSelect
                                                label="3rd party Transport Company"
                                                name="thirdPartyTransport"
                                                value={formData.thirdPartyTransport}
                                                onChange={handleChange}
                                                error={!!errors.thirdPartyTransport}
                                                helperText={errors.thirdPartyTransport}
                                                required
                                                disabled={isFieldDisabled('thirdPartyTransport')}
                                            >
                                                {companies.map((c) => (
                                                    <MenuItem key={c} value={c}>
                                                        {c}
                                                    </MenuItem>
                                                ))}
                                            </CustomSelect>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                <CustomTextField
                                                    label="Driver Name"
                                                    name="driverName"
                                                    value={formData.driverName}
                                                    onChange={handleChange}
                                                    error={!!errors.driverName}
                                                    helperText={errors.driverName}
                                                    required
                                                    disabled={isFieldDisabled('driverName')}
                                                />
                                                <CustomTextField
                                                    label="Driver Contact number"
                                                    name="driverContact"
                                                    value={formData.driverContact}
                                                    onChange={handleChange}
                                                    error={!!errors.driverContact}
                                                    helperText={errors.driverContact}
                                                    required
                                                    disabled={isFieldDisabled('driverContact')}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                <CustomTextField
                                                    label="Driver NIC Number"
                                                    name="driverNic"
                                                    value={formData.driverNic}
                                                    onChange={handleChange}
                                                    error={!!errors.driverNic}
                                                    helperText={errors.driverNic}
                                                    required
                                                    disabled={isFieldDisabled('driverNic')}
                                                />
                                                <CustomTextField
                                                    label="Driver Pickup Location"
                                                    name="driverPickupLocation"
                                                    value={formData.driverPickupLocation}
                                                    onChange={handleChange}
                                                    error={!!errors.driverPickupLocation}
                                                    helperText={errors.driverPickupLocation}
                                                    required
                                                    disabled={isFieldDisabled('driverPickupLocation')}
                                                />
                                            </Box>
                                            <CustomTextField
                                                label="Truck number"
                                                name="truckNumber"
                                                value={formData.truckNumber}
                                                onChange={handleChange}
                                                error={!!errors.truckNumber}
                                                helperText={errors.truckNumber}
                                                required
                                                disabled={isFieldDisabled('truckNumber')}
                                            />
                                        </Stack>
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
                                        <Typography variant="body1" fontWeight="medium">Point of Origin:</Typography>
                                        <Typography variant="body1">{formData.pointOfOrigin || "-"}</Typography>
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
                                    <Stack spacing={1}>
                                        <Typography variant="body1" fontWeight="medium">Receivers:</Typography>
                                        {formData.receivers.map((rec, i) => (
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                          
                                          <Chip sx={{p:2}} key={i} label={rec.receiverName || `Receiver ${i + 1}`} size="small" color="primary" variant="outlined" />
                                                  <Typography variant="body2" color="text.secondary">{rec.itemRef || "-"}</Typography>
                                                </Stack>
                                        ))}
                                    </Stack>
                                    {formData.receivers.some(rec => rec.containers && rec.containers.length > 0) && (
                                        <Stack spacing={1}>
                                            <Typography variant="body1" fontWeight="medium">Assigned Containers:</Typography>
                                            {formData.receivers.flatMap(rec => rec.containers || []).map((cont, i) => (
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                               <Chip sx={{p:2}} key={i} label={cont} color="info" size="small" variant="outlined" />
                                                  </Stack>
                                            ))}
                                        </Stack>
                                    )}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Category:</Typography>
                                        <Typography variant="body1">{formData.category || "-"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Weight:</Typography>
                                        <Typography variant="body1">{formData.weight || "-"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Transport Type:</Typography>
                                        <Typography variant="body1">{formData.transportType || "-"}</Typography>
                                    </Stack>
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
                            onLoad={() => console.log('Preview loaded:', previewSrc)}
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