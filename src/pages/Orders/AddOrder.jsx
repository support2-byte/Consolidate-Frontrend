import { useState, useEffect, useCallback } from "react";
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
import CopyIcon from "@mui/icons-material/ContentCopy"; // For duplicate button
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
    const orderId = location.state?.orderId;
    const [isEditMode, setIsEditMode] = useState(!!orderId);

    // console.log('Order ID from state:', orderId);

    // Snackbar state for error/success messages
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "info",
    });

    // Validation errors state
    const [errors, setErrors] = useState({});

    const initialShippingDetail = {
        pickupLocation: "",
        category: '',
        subcategory: '',
        type: '',
        deliveryAddress: "",
        totalNumber: "",
        weight: "",
        shippingLine: "",  // New: per-receiver shipping line
        consignmentStatus: "",
        itemRef: "",
        remainingItems: ""  // New for partials
    };
    const initialSenderObject = {
        senderName: '',
        senderContact: '',
        senderAddress: '',
        senderEmail: '',
        eta: '',
        etd: '',
        shippingLine: '',
        shippingDetail: {
            pickupLocation: '',
            category: '',
            subcategory: '',
            type: '',
            deliveryAddress: '',
            totalNumber: '',
            weight: '',
            remainingItems: '',
        },
        fullPartial: '',
        qtyDelivered: '',
        containers: [],
        status: '',
        consignmentVessel: '',
        consignmentMarks: '',
        consignmentNumber: '',
        consignmentVoyage: '',
        senderRef: '',
        totalNumber: '',
        totalWeight: '',
        itemRef: '',
        remarks: '',
    };
    const initialReceiver = {
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
        remarks: "",  // New: consignment remarks
        status: "Created",
        containers: [],
        shippingDetail: initialShippingDetail,
        fullPartial: "",  // New: per-receiver
        qtyDelivered: "",  // New: per-receiver
        isNew: false
    };

    const [formData, setFormData] = useState({
        // Core orders fields
        bookingRef: "",
        rglBookingNumber: "",
        placeOfLoading: "",
        pointOfOrigin: "",
        finalDestination: "",
        placeOfDelivery: "",
        orderRemarks: "",
      
        attachments: [],
        // Senders fields
        senderName: "",
        senderContact: "",
        senderAddress: "",
        senderEmail: "",
        senderRef: "",
        senderRemarks: "",
        senders: [{ ...initialSenderObject, shippingDetail: { ...initialShippingDetail } }], // or senders: [] if you prefer empty initially
        // Receivers array with nested shippingDetail and per-receiver partial/full
        receivers: [{ ...initialReceiver, shippingDetail: { ...initialShippingDetail } }],
        // Computed globals (new)
        globalTotalItems: 0,
        globalRemainingItems: 0,
        // Transport fields (remove global fullPartial/qtyDelivered)
        transportType: "",
        thirdPartyTransport: "",
        driverName: "",
        driverContact: "",
        driverNic: "",
        driverPickupLocation: "",
        truckNumber: "",
        dropMethod: "",
        dropoffName: "",
        dropOffCnic: "",
        dropOffMobile: "",
        plateNo: "",
        dropDate: "",
        collectionMethod: "",
        fullPartial: "",  // Deprecated, but keep for legacy if needed
        qtyDelivered: "",  // Deprecated
        clientReceiverName: "",
        clientReceiverId: "",
        clientReceiverMobile: "",
        deliveryDate: "",
        gatepass: [],
    });

    // Editable fields in edit mode (add new per-receiver fields)
    const editableInEdit = [
        'transportType', 'dropMethod', 'dropoffName', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate',
        'collectionMethod', 'fullPartial', 'qtyDelivered', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate',
        'thirdPartyTransport', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber',
        // New: Allow editing per-receiver partials
        'receivers[].fullPartial', 'receivers[].qtyDelivered', 'receivers[].shippingDetail.totalNumber'
    ];

    // Receiver specific fields for error mapping
    const receiverFields = [
        'receiverName', 'receiverContact', 'receiverAddress', 'receiverEmail', 'consignmentVessel', 'consignmentNumber',
        'consignmentMarks', 'consignmentVoyage', 'totalNumber', 'totalWeight', 'itemRef', 'receiverRef', 'status',
        // New
        'fullPartial', 'qtyDelivered', 'remarks'
    ];

    // Shipping specific fields for validation
    const shippingRequiredFields = [
        'pickupLocation', 'category', 'subcategory', 'type', 'totalNumber', 'weight'
    ];

    // Required fields validation
    const requiredFields = [
        'bookingRef', 'rglBookingNumber', 'senderName', 'placeOfLoading', 'finalDestination', 'transportType',
         'pointOfOrigin'
    ];

    // Dummy data for categories and subcategories
    const dummyCategories = ["Electronics", "Clothing", "Books"];
    const categorySubMap = {
        "Electronics": ["Smartphones", "Laptops", "Accessories"],
        "Clothing": ["Men's Wear", "Women's Wear", "Kids Wear"],
        "Books": ["Fiction", "Non-Fiction", "Technical"],
    };

    // Helper to convert snake_case to camelCase
    const snakeToCamel = (str) => str.replace(/(_[a-z])/g, g => g[1].toUpperCase());

    // Helper to convert camelCase to snake_case
    const camelToSnake = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();

    // Compute global totals (new useEffect)
    useEffect(() => {
        const total = formData.receivers.reduce((sum, rec) => sum + (parseInt(rec.shippingDetail.totalNumber || 0) || 0), 0);
        const remaining = formData.receivers.reduce((sum, rec) => {
            const del = parseInt(rec.qtyDelivered || 0) || 0;
            const recTotal = parseInt(rec.shippingDetail.totalNumber || 0) || 0;
            return sum + Math.max(0, recTotal - del);
        }, 0);
        setFormData(prev => ({ ...prev, globalTotalItems: total, globalRemainingItems: remaining }));
    }, [formData.receivers]);

    // Compute per-receiver remainingItems whenever relevant fields change
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            receivers: prev.receivers.map(rec => {
                const total = parseInt(rec.shippingDetail?.totalNumber || 0) || 0;
                const delivered = parseInt(rec.qtyDelivered || 0) || 0;
                const remaining = Math.max(0, total - delivered);
                if ((rec.shippingDetail?.remainingItems || 0) !== remaining) {
                    return {
                        ...rec,
                        shippingDetail: {
                            ...rec.shippingDetail,
                            remainingItems: remaining
                        }
                    };
                }
                return rec;
            })
        }));
    }, [formData.receivers.map(r => `${r.shippingDetail?.totalNumber}-${r.qtyDelivered}`).join(',')]);

    // New: Auto-sync consignment totals from shipping if empty
    useEffect(() => {
        setFormData(prev => {
            const updatedReceivers = prev.receivers.map(rec => {
                const sd = rec.shippingDetail || {};
                return {
                    ...rec,
                    totalNumber: rec.totalNumber || sd.totalNumber || '',
                    totalWeight: rec.totalWeight || sd.weight || ''
                };
            });
            return { ...prev, receivers: updatedReceivers };
        });
    }, []);
const validateForm = () => {
    const newErrors = {};

    // Detect mode: Edit if formData.id exists and != 'new' (assume ID set on fetch/edit)
    const isEditMode = formData.id && formData.id !== 'new' && formData.id !== '';

    console.log('[validateForm] Mode detected:', isEditMode ? 'Edit (strict)' : 'Add (relaxed)');

    // Core required fields (always enforce, but optional on add if needed) - UPDATED: Removed shippingLine, eta, etd
    requiredFields.forEach(field => {
        if (!formData[field]?.trim()) {
            newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
        }
    });

    // Dynamic validation for second panel: receivers or senders based on senderType
    const isSenderMode = formData.senderType === 'receiver';
    const items = isSenderMode ? formData.senders : formData.receivers;
    const itemsKey = isSenderMode ? 'senders' : 'receivers';
    const itemPrefix = isSenderMode ? 'Sender' : 'Receiver';

    if (items.length === 0) {
        console.log('No items present');
        newErrors[itemsKey] = `At least one ${itemPrefix.toLowerCase()} is required`;
    } else {
        items.forEach((item, i) => {
            // FIXED: Always validate required fields (independent of mode for core fields)
            const nameField = isSenderMode ? 'senderName' : 'receiverName';
            const contactField = isSenderMode ? 'senderContact' : 'receiverContact';
            const addressField = isSenderMode ? 'senderAddress' : 'receiverAddress';
            const emailField = isSenderMode ? 'senderEmail' : 'receiverEmail';
            const refField = isSenderMode ? 'senderRef' : 'receiverRef';
            const consignmentNumberField = 'consignmentNumber'; // Same

            if (!item[nameField]?.trim()) {
                newErrors[`${itemsKey}[${i}].${nameField}`] = `${itemPrefix} ${i + 1} name is required`;
            }
            if (isEditMode && item.containers.length === 0) {
                newErrors[`${itemsKey}[${i}].containers`] = `At least one container is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
                // TODO: Comment out if containers optional in some cases
            }
            if (!item[consignmentNumberField]?.trim()) {
                newErrors[`${itemsKey}[${i}].${consignmentNumberField}`] = `Consignment number is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
            }
            if (!item.totalWeight?.trim()) {
                newErrors[`${itemsKey}[${i}].totalWeight`] = `Total weight is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
            }
            if (!item[refField]?.trim()) {
                newErrors[`${itemsKey}[${i}].${refField}`] = `${itemPrefix} ref is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (item[emailField] && !emailRegex.test(item[emailField])) {
                newErrors[`${itemsKey}[${i}].${emailField}`] = `Invalid ${itemPrefix.toLowerCase()} ${i + 1} email format`;
            }

            // Validate nested shippingDetail
            const sd = item.shippingDetail || {};
            shippingRequiredFields.forEach(field => {
                // FIXED: Always validate if empty (core required)
                if (!sd[field]?.trim()) {
                    newErrors[`${itemsKey}[${i}].shippingDetail.${field}`] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
                }
            });
            // NEW: totalNumber must be positive (enforce always, as core)
            const totalNumStr = sd.totalNumber || '';  // FIXED: Always use sd.totalNumber (source of truth from order_items)
            const totalNum = parseInt(totalNumStr);
            if (isNaN(totalNum) || totalNum <= 0) {
                newErrors[`${itemsKey}[${i}].shippingDetail.totalNumber`] = `Total Number must be positive for ${itemPrefix.toLowerCase()} ${i + 1}`;
            }
            if (sd.weight && (isNaN(parseFloat(sd.weight)) || parseFloat(sd.weight) <= 0)) {
                newErrors[`${itemsKey}[${i}].shippingDetail.weight`] = `Weight must be a positive number for ${itemPrefix.toLowerCase()} ${i + 1}`;
            }

            // UPDATED: Per-item partial validation (use sd.totalNumber now)
            // FIXED: Only enforce exceed check in edit mode (relax for add/new)
            if (item.fullPartial === 'Partial') {
                const delStr = item.qtyDelivered?.toString() || '';
                if (!delStr.trim()) {
                    newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered is required for partial ${itemPrefix.toLowerCase()} ${i + 1}`;
                } else {
                    const del = parseInt(delStr);
                    if (isNaN(del)) {
                        newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered must be a valid number for ${itemPrefix.toLowerCase()} ${i + 1}`;
                    } else if (del <= 0) {
                        newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered must be positive for partial ${itemPrefix.toLowerCase()} ${i + 1}`;
                    } else {
                        // FIXED: Enforce exceed only in edit mode, using sd.totalNumber
                        if (isEditMode && del > totalNum) {
                            newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered (${del}) cannot exceed total number (${totalNum}) for ${itemPrefix.toLowerCase()} ${i + 1}`;
                        } else if (!isEditMode && del > totalNum) {
                            // Optional: Soft warning for add mode (console, not hard error)
                            console.warn(`Add mode ${itemPrefix.toLowerCase()} ${i + 1}: Qty Delivered (${del}) > Total Number (${totalNum}) - fix on edit`);
                        }
                    }
                }
            }

            // UPDATED: Validate per-item eta, etd (now required per UI)
            
        });
    }

    // Transport validations (updated: conditional deliveryDate)
    // UPDATED: Check if any item is partial for requiresDeliveryDate
    const anyPartial = items.some(item => item.fullPartial === 'Partial');
    const showInbound = formData.finalDestination?.includes('Karachi');  // Align with backend logic
    const showOutbound = formData.placeOfLoading?.includes('Dubai');

    if (showInbound && formData.transportType === 'Drop Off') {  // Assumed transportType values
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

    if (showOutbound && formData.transportType === 'Collection') {
        // UPDATED: Conditional on any partial or client collection
        const requiresDeliveryDate = anyPartial || formData.collectionMethod === 'Collected by Client';
        if (requiresDeliveryDate && !formData.deliveryDate?.trim()) {
            newErrors.deliveryDate = 'Delivery Date is required for partial delivery or client collection';
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

    // Date validation for global dates
    const globalDateFields = ['dropDate', 'deliveryDate'];
    globalDateFields.forEach(field => {
        if (formData[field] && !/^\d{4}-\d{2}-\d{2}$/.test(formData[field])) {
            newErrors[field] = 'Invalid date format (YYYY-MM-DD)';
        }
    });

    // Date validation for per-item eta, etd
    // items.forEach((item, i) => {
    //     ['eta', 'etd'].forEach(field => {
    //         if (item[field] && !/^\d{4}-\d{2}-\d{2}$/.test(item[field])) {
    //             newErrors[`${itemsKey}[${i}].${field}`] = `Invalid ${field.toUpperCase()} date format (YYYY-MM-DD) for ${itemPrefix.toLowerCase()} ${i + 1}`;
    //         }
    //     });
    // });

    // Mobile validation
    const mobileRegex = /^\d{10,15}$/;
    if (formData.dropOffMobile && !mobileRegex.test(formData.dropOffMobile.replace(/\D/g, ''))) {
        newErrors.dropOffMobile = 'Invalid mobile number';
    }
    if (formData.clientReceiverMobile && !mobileRegex.test(formData.clientReceiverMobile.replace(/\D/g, ''))) {
        newErrors.clientReceiverMobile = 'Invalid mobile number';
    }

    // NEW: Log errors for debugging (identify frontend vs backend)
    console.log('[validateForm] Errors detected:', newErrors);
    if (Object.keys(newErrors).length > 0) {
        console.log('[validateForm] Frontend blocking submit - fix these before backend hit');
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
                if (['transportType', 'dropMethod', 'dropoffName', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate', 'collectionMethod', 'fullPartial', 'qtyDelivered', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber', 'thirdPartyTransport'].includes(key)) panelsToExpand.add('panel3');
            });
            setExpanded(prev => new Set([...prev, ...panelsToExpand]));
        }
    }, [errors]);

    const fetchCategories = () => {
        setCategories(dummyCategories);
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

    // Updated fetchOrder to handle nested shippingDetail and new fields
    // Improvements: Map-based matching, consistent remaining calc, validation warnings
    const fetchOrder = async (id) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/orders/${id}`, { params: { includeContainer: true } });

            // Map snake_case to camelCase for core fields
            const camelData = {};
            Object.keys(response.data).forEach(apiKey => {
                let value = response.data[apiKey];
                if (value === null || value === undefined) value = '';
                if (['eta', 'etd', 'drop_date', 'delivery_date'].includes(apiKey)) {
                    if (value) {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                            value = date.toISOString().split('T')[0];  // YYYY-MM-DD
                        }
                    } else {
                        value = '';
                    }
                }
                const camelKey = snakeToCamel(apiKey);
                camelData[camelKey] = value;
            });

            // NEW: Create map for order_items by receiver_id (robust matching)
            const orderItems = response.data.order_items || [];
            const receiverItemMap = new Map();
            orderItems.forEach(item => {
                console.log('Mapping order item:', item);
                if (item.receiver_id) {
                    receiverItemMap.set(Number(item.receiver_id), item);  // FIXED: Use Number for key consistency
                }
            });

            // Handle multiples - map receivers to camelCase
            let mappedReceivers = (response.data.receivers || []).map(rec => {
                // Parse containers if string (align with backend)
                let parsedContainers = rec.containers || [];
                if (typeof rec.containers === 'string') {
                    if (rec.containers.trim() === '') {
                        parsedContainers = [];
                    } else {
                        try {
                            parsedContainers = JSON.parse(rec.containers);
                        } catch (e) {
                            parsedContainers = [rec.containers];
                        }
                    }
                }

                const camelRec = {
                    ...initialReceiver,
                    shippingDetail: { ...initialShippingDetail },
                    isNew: false,
                    validationWarnings: null  // NEW: For frontend alerts
                };

                Object.keys(rec).forEach(apiKey => {
                    let val = rec[apiKey];
                    if (val === null || val === undefined) val = '';
                    const camelKey = snakeToCamel(apiKey);
                    camelRec[camelKey] = val;
                });

                // Handle containers
                camelRec.containers = Array.isArray(parsedContainers) ? parsedContainers.map(c =>
                    typeof c === 'object' ? (c.container_number || c) : c
                ) : [];

                camelRec.status = rec.status || "Created";

                // FIXED: Nest shippingDetail using map by receiver_id (not index)
                const item = receiverItemMap.get(Number(rec.id)) || {};  // FIXED: Use Number for key lookup
                Object.keys(item).forEach(apiKey => {
                    let val = item[apiKey];
                    if (val === null || val === undefined) val = '';
                    const camelKey = snakeToCamel(apiKey);
                    // FIXED: Always set shippingDetail fields (remove hasOwnProperty check to handle missing keys in initial)
                    camelRec.shippingDetail[camelKey] = String(val);
                });

                // New fields default
                camelRec.fullPartial = rec.full_partial || '';
                camelRec.qtyDelivered = rec.qty_delivered != null ? String(rec.qty_delivered) : '';

                // Sync consignment totals if empty
                camelRec.totalNumber = camelRec.totalNumber || camelRec.shippingDetail.totalNumber || '';
                camelRec.totalWeight = camelRec.totalWeight || camelRec.shippingDetail.weight || '';

                return camelRec;
            });

            // FIXED: Moved fallback for missing items here (after map completes)
            mappedReceivers.forEach(rec => {
                if (!rec.shippingDetail.category) {
                    console.log(`Receiver ${rec.receiver_name} missing item - adding default`);
                    rec.shippingDetail.category = 'Unassigned';  // Temp placeholder
                }
            });

            // Compute remainingItems for each receiver on load - FIXED: Use synced rec.totalNumber
            mappedReceivers = mappedReceivers.map(rec => {
                const total = parseInt(rec.totalNumber || 0) || 0;  // Use rec.totalNumber (synced)
                const delivered = parseInt(rec.qtyDelivered || 0) || 0;
                rec.shippingDetail.remainingItems = Math.max(0, total - delivered);

                // NEW: Add validation warnings (for frontend display, e.g., in form)
                let warnings = null;
                const isInvalidTotal = total <= 0;
                const isPartialInvalid = rec.fullPartial === 'Partial' && delivered > total;
                if (isInvalidTotal || isPartialInvalid) {
                    warnings = {};
                    if (isInvalidTotal) warnings.total_number = 'Must be positive';
                    if (isPartialInvalid) warnings.qty_delivered = 'Cannot exceed total_number';
                }
                rec.validationWarnings = warnings;

                return rec;
            });

            camelData.receivers = mappedReceivers;
            if (camelData.receivers.length === 0) {
                // Default receiver - mark as new to handle on update
                camelData.receivers = [{
                    ...initialReceiver,
                    shippingDetail: { ...initialShippingDetail },
                    isNew: true,
                    validationWarnings: { total_number: 'Must be positive' }  // Flag for user input
                }];
            }

            // Attachments/gatepass
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

            setFormData(camelData);

            // NEW: Optional - Show snackbar if warnings exist across receivers
            const hasWarnings = mappedReceivers.some(r => r.validationWarnings);
            if (hasWarnings) {
                setSnackbar({
                    open: true,
                    message: 'Some receiver data needs attention (check totals/deliveries)',
                    severity: 'warning',
                });
            }

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
            setLoading(false);
        }
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'transportType' && value !== prev.transportType) {
                // Clear transport-specific fields
                updated.dropMethod = '';
                updated.dropoffName = '';
                updated.dropOffCnic = '';
                updated.dropOffMobile = '';
                updated.plateNo = '';
                updated.dropDate = '';
                updated.collectionMethod = '';
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
            return updated;
        });
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    // Updated addReceiver
    const addReceiver = () => {
        setFormData(prev => ({
            ...prev,
            receivers: [...prev.receivers, { ...initialReceiver, shippingDetail: { ...initialShippingDetail }, isNew: true }]
        }));
    };

    // Updated removeReceiver
    const removeReceiver = (index) => {
        setFormData(prev => ({
            ...prev,
            receivers: prev.receivers.filter((_, i) => i !== index)
        }));
    };

    // Duplicate receiver (new)
    const duplicateReceiver = (index) => {
        setFormData(prev => ({
            ...prev,
            receivers: [
                ...prev.receivers.slice(0, index + 1),
                { ...prev.receivers[index], shippingDetail: { ...prev.receivers[index].shippingDetail }, isNew: true },  // Duplicate with deep copy
                ...prev.receivers.slice(index + 1)
            ]
        }));
    };

    // Updated handleReceiverChange (for basic fields)
    const handleReceiverChange = (index, field) => (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            receivers: prev.receivers.map((rec, i) =>
                i === index ? { ...rec, [field]: value } : rec
            )
        }));
        // Clear error
        const errorKey = `receivers[${index}].${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[errorKey];
                return newErr;
            });
        }
    };

    // Updated handleReceiverShippingChange (with remaining sync and consignment sync)
    const handleReceiverShippingChange = (index, field) => (e) => {
        const value = e.target.value;
        setFormData(prev => {
            const rec = prev.receivers[index];
            const oldSd = rec.shippingDetail || {};
            const updatedSd = { ...oldSd, [field]: value };
            if (field === 'category' && value !== oldSd.category) {
                updatedSd.subcategory = '';
            }
            // Sync remaining if qtyDelivered changed indirectly
            if (field === 'totalNumber') {
                const del = parseInt(rec.qtyDelivered || 0);
                updatedSd.remainingItems = Math.max(0, parseInt(value) - del);
                // Sync to receiver totalNumber if empty
                rec.totalNumber = rec.totalNumber || value;
            }
            if (field === 'weight') {
                // Sync to receiver totalWeight if empty
                rec.totalWeight = rec.totalWeight || value;
            }
            return {
                ...prev,
                receivers: prev.receivers.map((r, i) =>
                    i === index ? { ...r, shippingDetail: updatedSd } : r
                )
            };
        });
        // Clear error
        const errorKey = `receivers[${index}].shippingDetail.${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[errorKey];
                return newErr;
            });
        }
    };

    // New: Handle per-receiver full/partial change
    const handleReceiverPartialChange = (index, field) => (e) => {
        const value = e.target.value;
        setFormData(prev => {
            const rec = prev.receivers[index];
            const updated = { ...rec, [field]: value };
            if (field === 'fullPartial' && value === 'Full') {
                updated.qtyDelivered = '';  // Clear qty
            } else if (field === 'qtyDelivered') {
                const del = parseInt(value);
                const total = parseInt(rec.shippingDetail.totalNumber || 0);
                rec.shippingDetail.remainingItems = Math.max(0, total - del);
            }
            return {
                ...prev,
                receivers: prev.receivers.map((r, i) => i === index ? updated : r)
            };
        });
        // Clear error
        const errorKey = `receivers[${index}].${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[errorKey];
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


    // Handler for changing basic fields in senders array
    const handleSenderChange = useCallback((index, field) => (event) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            senders: prev.senders.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));

        // Clear error for this field
        const errorKey = `senders[${index}].${field}`;
        if (errors[errorKey]) {
            setErrors((prev) => ({ ...prev, [errorKey]: '' }));
        }
    }, [errors, setErrors]);

    // Handler for changing shipping detail fields in senders array
    const handleSenderShippingChange = useCallback((index, field) => (event) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            senders: prev.senders.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        shippingDetail: { ...item.shippingDetail, [field]: value },
                    }
                    : item
            ),
        }));

        // Clear error for this field
        const errorKey = `senders[${index}].shippingDetail.${field}`;
        if (errors[errorKey]) {
            setErrors((prev) => ({ ...prev, [errorKey]: '' }));
        }

        // Auto-calculate remaining items if totalNumber changes
        if (field === 'totalNumber' && item.shippingDetail.qtyDelivered) {
            const remaining = parseInt(value, 10) - parseInt(item.shippingDetail.qtyDelivered || 0, 10);
            setFormData((prev) => ({
                ...prev,
                senders: prev.senders.map((sItem, sI) =>
                    sI === index
                        ? {
                            ...sItem,
                            shippingDetail: {
                                ...sItem.shippingDetail,
                                remainingItems: remaining > 0 ? remaining.toString() : '0',
                            },
                        }
                        : sItem
                ),
            }));
        }
    }, [errors, setErrors]);

    // Handler for changing partial delivery fields in senders array
    const handleSenderPartialChange = useCallback((index, field) => (event) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            senders: prev.senders.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));

        // Clear error for this field
        const errorKey = `senders[${index}].${field}`;
        if (errors[errorKey]) {
            setErrors((prev) => ({ ...prev, [errorKey]: '' }));
        }

        // Auto-calculate remaining items if qtyDelivered changes
        if (field === 'qtyDelivered') {
            const total = parseInt(item.shippingDetail.totalNumber || 0, 10);
            const remaining = total - parseInt(value, 10);
            setFormData((prev) => ({
                ...prev,
                senders: prev.senders.map((sItem, sI) =>
                    sI === index
                        ? {
                            ...sItem,
                            shippingDetail: {
                                ...sItem.shippingDetail,
                                remainingItems: remaining > 0 ? remaining.toString() : '0',
                            },
                        }
                        : sItem
                ),
            }));
        }
    }, [errors, setErrors]);

    // Handler for selecting containers in senders array
    const handleSenderContainersChange = useCallback((index) => (event) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            senders: prev.senders.map((item, i) =>
                i === index ? { ...item, containers: value } : item
            ),
        }));

        // Clear error for containers
        const errorKey = `senders[${index}].containers`;
        if (errors[errorKey]) {
            setErrors((prev) => ({ ...prev, [errorKey]: '' }));
        }
    }, [errors, setErrors]);

    // Add a new sender
    const addSender = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            senders: [...prev.senders, { ...initialSenderObject }],
        }));
    }, []);

    // Duplicate a sender
    const duplicateSender = useCallback((index) => {
        const toDuplicate = formData.senders[index];
        setFormData((prev) => ({
            ...prev,
            senders: [
                ...prev.senders.slice(0, index + 1),
                { ...toDuplicate, id: Date.now() }, // Add unique id if needed
                ...prev.senders.slice(index + 1),
            ],
        }));
    }, [formData.senders]);

    // Remove a sender
    const removeSender = useCallback((index) => {
        setFormData((prev) => ({
            ...prev,
            senders: prev.senders.filter((_, i) => i !== index),
        }));
        // Optionally clear errors for removed item
        Object.keys(errors).forEach((key) => {
            if (key.startsWith(`senders[${index}]`)) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[key];
                    return newErrors;
                });
            }
        });
    }, [errors]);

    // Add a

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setFormData((prev) => ({ ...prev, attachments: [...(Array.isArray(prev.attachments) ? prev.attachments : []), ...files] }));
    };

    const handleGatepassUpload = (e) => {
        const files = Array.from(e.target.files);
        setFormData((prev) => ({ ...prev, gatepass: [...(Array.isArray(prev.gatepass) ? prev.gatepass : []), ...files] }));
    };
 const handleSave = async () => {
    // NEW: Relaxed validation on add - only block critical errors
    const isAddMode = !isEditMode;  // Assume isEditMode defined (e.g., !!orderId)
    const isSenderMode = formData.senderType === 'receiver';
    console.log('[handleSave] Mode:', isAddMode ? 'Add (relaxed validation)' : 'Edit (strict)', `Panel2: ${isSenderMode ? 'Sender' : 'Receiver'}`);

    // Pass a mode flag to validateForm to relax checks on add
    if (!validateForm(isAddMode)) {  // UPDATED: Pass mode to validateForm for relaxed add
        setSnackbar({
            open: true,
            message: 'Please fix the errors in the form',
            severity: 'error',
        });
        console.log('[handleSave] Frontend validation blocked - check console for details');
        return;
    }

    // Frontend passed - always hit backend (logs confirm)
    console.log('[handleSave] Frontend passed - hitting backend');

    setLoading(true);
    const formDataToSend = new FormData();
    const dateFields = ['eta', 'etd', 'dropDate', 'deliveryDate'];

    // Append core orders fields
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

    // Append senders fields (UPDATED: Include senderType and selectedSenderOwner for backend persistence)
    const senderKeys = ['senderName', 'senderContact', 'senderAddress', 'senderEmail', 'senderRef', 'senderRemarks', 'senderType', 'selectedSenderOwner'];
    senderKeys.forEach(key => {
        const apiKey = camelToSnake(key);
        formDataToSend.append(apiKey, formData[key] || '');
    });

    // Dynamic panel2 items
    const panel2Items = isSenderMode ? formData.senders : formData.receivers;

    // Append "receivers" as JSON (mapped from panel2 items to receiver format for backend compatibility)
    const receiversToSend = panel2Items.map((item, i) => {
        const sd = item.shippingDetail || {};
        const snakeRec = {};

        // Map basic fields dynamically
        const nameVal = isSenderMode ? (item.senderName || '') : (item.receiverName || '');
        const contactVal = isSenderMode ? (item.senderContact || '') : (item.receiverContact || '');
        const addressVal = isSenderMode ? (item.senderAddress || '') : (item.receiverAddress || '');
        const emailVal = isSenderMode ? (item.senderEmail || '') : (item.receiverEmail || '');
        const refVal = isSenderMode ? (item.senderRef || '') : (item.receiverRef || '');

        snakeRec.receiver_name = nameVal;
        snakeRec.receiver_contact = contactVal;
        snakeRec.receiver_address = addressVal;
        snakeRec.receiver_email = emailVal;
        snakeRec.receiver_ref = refVal;

        // Consignment fields (same in both)
        snakeRec.consignment_vessel = item.consignmentVessel || '';
        snakeRec.consignment_number = item.consignmentNumber || '';
        snakeRec.consignment_marks = item.consignmentMarks || '';
        snakeRec.consignment_voyage = item.consignmentVoyage || '';

        // Sync totals from shippingDetail (source of truth)
        snakeRec.total_number = sd.totalNumber || item.totalNumber || '';
        snakeRec.total_weight = sd.weight || item.totalWeight || '';

        // Auto-generate item_ref
        snakeRec.item_ref = item.itemRef || `ITEM-REF-${i + 1}-${Date.now()}`;

        snakeRec.remarks = item.remarks || '';
        snakeRec.containers = item.containers || [];
        snakeRec.full_partial = item.fullPartial || '';
        snakeRec.qty_delivered = item.qtyDelivered || '';
        snakeRec.status = item.status || 'Created';

        // Other fields if any (e.g., eta, etd, shippingLine per item)
        snakeRec.eta = item.eta || '';
        snakeRec.etd = item.etd || '';
        snakeRec.shipping_line = item.shippingLine || '';

        return snakeRec;
    });
    formDataToSend.append('receivers', JSON.stringify(receiversToSend));

    // Append order_items from nested shippingDetails (same structure)
    const orderItemsToSend = panel2Items.map((item, i) => {
        const sd = item.shippingDetail || {};
        const snakeItem = {};
        Object.keys(sd).forEach(key => {
            if (key !== 'itemRef' && key !== 'remainingItems') {  // Skip computed
                const snakeKey = camelToSnake(key);
                snakeItem[snakeKey] = sd[key] || '';
            }
        });
        snakeItem.item_ref = sd.itemRef || `ORDER-ITEM-REF-${i + 1}-${Date.now()}`;
        return snakeItem;
    });
    formDataToSend.append('order_items', JSON.stringify(orderItemsToSend));

    // Append transport fields
    const transportKeys = ['transportType', 'thirdPartyTransport', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber', 'dropMethod', 'dropoffName', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate', 'collectionMethod', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate', 'gatepass'];
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
        const endpoint = isEditMode ? `/api/orders/${orderId}` : '/api/orders';
        const method = isEditMode ? 'put' : 'post';
        console.log('[handleSave] Request to:', endpoint, 'Method:', method);
        console.log('[handleSave] FormData entries:');
        for (let pair of formDataToSend.entries()) {
            console.log(`${pair[0]}:`, pair[1]);
        }
        const response = await api[method](endpoint, formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('[handleSave] Backend success:', response.data);

        if (isEditMode) {
            await fetchOrder(orderId);
        } else {
            navigate('/orders');
        }
        setSnackbar({
            open: true,
            message: isEditMode ? 'Order updated successfully' : 'Order created successfully',
            severity: 'success',
        });
    } catch (err) {
        console.error("[handleSave] Backend error full response:", err.response?.data || err.message);
        const backendData = err.response?.data || {};
        const backendMsg = backendData.error || backendData.details || err.message || 'Failed to save order';

        // UPDATED: Handle backend errors as direct object (e.g., { "receivers[0].field": "msg" })
        let newErrorsFromBackend = {};
        if (typeof backendData === 'object' && Object.keys(backendData).length > 0) {
            // Check if it's direct errors object
            if (Object.keys(backendData).some(key => key.startsWith('receivers[') || key.includes('.'))) {
                newErrorsFromBackend = { ...backendData };

                // Remap keys and messages if in sender mode
                if (isSenderMode) {
                    const remapped = {};
                    Object.keys(newErrorsFromBackend).forEach(oldKey => {
                        let newKey = oldKey.replace('receivers[', 'senders[');
                        let msg = newErrorsFromBackend[oldKey];

                        // Remap field names in key
                        newKey = newKey
                            .replace('.receiverName', '.senderName')
                            .replace('.receiverContact', '.senderContact')
                            .replace('.receiverAddress', '.senderAddress')
                            .replace('.receiverEmail', '.senderEmail')
                            .replace('.receiverRef', '.senderRef');

                        // Update message to say "sender" instead of "receiver"
                        msg = msg.replace(/Receiver/gi, 'Sender').replace(/receiver/gi, 'sender');

                        remapped[newKey] = msg;
                    });
                    newErrorsFromBackend = remapped;
                }
            } else if (backendData.details) {
                // Fallback to string parsing if details is string
                const detailStr = backendData.details;
                const errorMsgs = detailStr.split(';').map(s => s.trim()).filter(Boolean);

                errorMsgs.forEach(msg => {
                    // Receiver-specific: e.g., "qty_delivered cannot exceed total_number for receiver 1"
                    const qtyMatch = msg.match(/qty_delivered cannot exceed total_number for (receiver|sender) (\d+)/i);
                    if (qtyMatch) {
                        const itemType = qtyMatch[1].toLowerCase();
                        const index = parseInt(qtyMatch[2]) - 1;
                        const arrayKey = (itemType === 'sender' || isSenderMode) ? 'senders' : 'receivers';
                        const adjustedMsg = msg.replace(itemType, isSenderMode ? 'sender' : 'receiver');
                        newErrorsFromBackend[`${arrayKey}[${index}].qtyDelivered`] = adjustedMsg;
                        return;
                    }
                    // Delivery date: "delivery_date required"
                    if (msg.includes('delivery_date required')) {
                        newErrorsFromBackend.deliveryDate = 'Delivery Date is required';
                        return;
                    }
                    // General "field required" e.g., "consignment_number required for receiver 1"
                    const recRequiredMatch = msg.match(/(\w+) required for (receiver|sender) (\d+)/i);
                    if (recRequiredMatch) {
                        const fieldSnake = recRequiredMatch[1];
                        const itemType = recRequiredMatch[2].toLowerCase();
                        const index = parseInt(recRequiredMatch[3]) - 1;
                        const arrayKey = (itemType === 'sender' || isSenderMode) ? 'senders' : 'receivers';
                        const camelField = snakeToCamel(fieldSnake);
                        const fieldPath = camelField.startsWith('shippingDetail') ? `shippingDetail.${camelField.replace('shippingDetail.', '')}` : 
                            (isSenderMode && ['receiverName', 'receiverContact', 'receiverAddress', 'receiverEmail', 'receiverRef'].includes(camelField) ? 
                                camelField.replace('receiver', 'sender') : camelField);
                        const adjustedMsg = msg.replace(itemType, isSenderMode ? 'sender' : 'receiver');
                        newErrorsFromBackend[`${arrayKey}[${index}].${fieldPath}`] = `${adjustedMsg} for ${isSenderMode ? 'sender' : 'receiver'} ${index + 1}`;
                        return;
                    }
                    // Generic field required e.g., "booking_ref is required"
                    if (msg.includes(' is required')) {
                        const fieldSnake = msg.split(' ')[0];
                        const camel = snakeToCamel(fieldSnake);
                        newErrorsFromBackend[camel] = msg;
                        return;
                    }
                    // Fallback: Assume msg starts with field
                    const parts = msg.split(' ');
                    if (parts.length > 0) {
                        const possibleField = parts[0].replace(/[^a-zA-Z]/g, '');
                        const camelField = snakeToCamel(possibleField);
                        newErrorsFromBackend[camelField] = msg;
                    }
                });
            }
        }

        // Merge backend errors into frontend (highlight fields)
        if (Object.keys(newErrorsFromBackend).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrorsFromBackend }));
            setSnackbar({
                open: true,
                message: 'Backend validation failed - errors highlighted in form',
                severity: 'error',
            });
            console.log('[handleSave] Backend errors mapped to fields:', newErrorsFromBackend);
            return;  // Stop here, user fixes highlighted fields
        }

        // Generic backend error (no details to map)
        setSnackbar({
            open: true,
            message: `Backend Error: ${backendMsg}`,
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

    // Placeholder options
    const places = ["Select Place", "Singapore", "Dubai", "Rotterdam", "Hamburg", "Karachi", "Dubai-Emirates"];
    const companies = ["Select 3rd party company", "Company A", "Company B"];
    const statuses = ["Created", "In Transit", "Delivered", "Cancelled"];
    const types = ["Select Type", "Type 1", "Type 2"];

    const isFieldDisabled = (name) => {
        if (!isEditMode) return false;
        // For receiver fields, check if in editableInEdit (new logic allows partials)
        if (name.startsWith('receivers[')) {
            const match = name.match(/receivers\[(\d+)\]\.(.+)/);
            if (match) {
                const idx = parseInt(match[1]);
                const field = match[2];
                const receiver = formData.receivers[idx];
                if (receiver?.isNew) {
                    return false; // All fields editable for new receivers
                } else {
                    // For existing, only partial fields
                    return !editableInEdit.some(e => e.includes(field));
                }
            }
            return true;
        }
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

                    {/* Top Order Fields */}
                    <Stack spacing={3} mb={4}>
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
                                1. Owner Details
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                                <Stack spacing={2}>
                                    {/* Dummy data for sendersList and receiversList */}
                                    {(() => {
                                        const sendersList = [
                                            { id: 1, name: 'John Doe Sender', contact: '+1-234-5678', address: '123 Sender St, City', email: 'john.sender@example.com', ref: 'SREF001', remarks: 'Preferred sender' },
                                            { id: 2, name: 'Jane Smith Sender', contact: '+1-876-5432', address: '456 Sender Ave, Town', email: 'jane.sender@example.com', ref: 'SREF002', remarks: 'Regular sender' }
                                        ];
                                        const receiversList = [
                                            { id: 1, name: 'Alice Receiver', contact: '+1-111-2222', address: '789 Receiver Blvd, Village', email: 'alice.receiver@example.com', ref: 'RREF001', remarks: 'Main receiver' },
                                            { id: 2, name: 'Bob Receiver', contact: '+1-333-4444', address: '101 Receiver Rd, Hamlet', email: 'bob.receiver@example.com', ref: 'RREF002', remarks: 'Secondary receiver' }
                                        ];
                                        const typePrefix = formData.senderType === 'sender' ? 'Sender' : 'Receiver';
                                        return (
                                            <>
                                                {/* Sender/Receiver Selection */}
                                                <FormControl component="fieldset" error={!!errors.senderType}>
                                                    <Typography variant="subtitle1" fontWeight="bold" color="#f58220" gutterBottom>
                                                        Select Type
                                                    </Typography>
                                                    <RadioGroup
                                                        name="senderType"
                                                        value={formData.senderType}
                                                        onChange={handleChange}
                                                        sx={{ flexDirection: 'row', gap: 3, mb: 1 }}
                                                        // defaultValue="sender"
                                                    >
                                                        <FormControlLabel value="sender" control={<Radio />} label="Sender Details" />
                                                        <FormControlLabel value="receiver" control={<Radio />} label="Receiver Details" />
                                                    </RadioGroup>
                                                    {errors.senderType && <Typography variant="caption" color="error">{errors.senderType}</Typography>}
                                                </FormControl>
                                                <CustomSelect
                                                    label={`Select ${typePrefix}`}
                                                    name="selectedSenderOwner"
                                                    value={formData.selectedSenderOwner || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        handleChange(e); // Update the selected value
                                                        if (value) {
                                                            // Population logic: Use the dummy lists
                                                            const list = formData.senderType === 'sender' ? sendersList : receiversList;
                                                            const item = list.find(l => l.id.toString() === value);
                                                            if (item) {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    senderName: item.name || '',
                                                                    senderContact: item.contact || '',
                                                                    senderAddress: item.address || '',
                                                                    senderEmail: item.email || '',
                                                                    senderRef: item.ref || '',
                                                                    senderRemarks: item.remarks || '',
                                                                }));
                                                            }
                                                        }
                                                    }}
                                                    error={!!errors.selectedSenderOwner}
                                                    helperText={errors.selectedSenderOwner}
                                                    required
                                                    disabled={isFieldDisabled('selectedSenderOwner')}
                                                >
                                                    <MenuItem value="">Select from List</MenuItem>
                                                    {(formData.senderType === 'sender' ? sendersList : receiversList).map((item) => (
                                                        <MenuItem key={item.id} value={item.id.toString()}>
                                                            {item.name}
                                                        </MenuItem>
                                                    ))}
                                                </CustomSelect>
                                                {/* Conditional Fields based on selection */}
                                                <Stack spacing={2}>
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                        <CustomTextField
                                                            label={`${typePrefix} Name`}
                                                            name="senderName"
                                                            value={formData.senderName}
                                                            onChange={handleChange}
                                                            error={!!errors.senderName}
                                                            helperText={errors.senderName}
                                                            required
                                                            disabled={isFieldDisabled('senderName')}
                                                        />
                                                        <CustomTextField
                                                            label={`${typePrefix} Contact`}
                                                            name="senderContact"
                                                            value={formData.senderContact}
                                                            onChange={handleChange}
                                                            error={!!errors.senderContact}
                                                            helperText={errors.senderContact}
                                                            disabled={isFieldDisabled('senderContact')}
                                                        />
                                                    </Box>
                                                    <CustomTextField
                                                        label={`${typePrefix} Address`}
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
                                                            label={`${typePrefix} Email`}
                                                            name="senderEmail"
                                                            value={formData.senderEmail}
                                                            onChange={handleChange}
                                                            error={!!errors.senderEmail}
                                                            helperText={errors.senderEmail}
                                                            disabled={isFieldDisabled('senderEmail')}
                                                        />
                                                        <CustomTextField
                                                            label={`${typePrefix} Ref`}
                                                            name="senderRef"
                                                            value={formData.senderRef}
                                                            onChange={handleChange}
                                                            error={!!errors.senderRef}
                                                            helperText={errors.senderRef}
                                                            disabled={isFieldDisabled('senderRef')}
                                                        />
                                                    </Box>
                                                    <CustomTextField
                                                        label={`${typePrefix} Remarks`}
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
                                            </>
                                        );
                                    })()}
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
                                2. {formData.senderType === 'receiver' ? 'Sender Details (with Shipping)' : 'Receiver Details (with Shipping)'}
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                                <Stack spacing={2}>
                                    {formData.senderType === 'sender' ? (
                                        errors.receivers && <Alert severity="error">{errors.receivers}</Alert>
                                    ) : (
                                        errors.senders && <Alert severity="error">{errors.senders}</Alert>
                                    )}
                                    {/* Dynamic: Summary Table for multiples */}
                                    {(formData.senderType === 'sender' ? formData.receivers : formData.senders).length > 1 && (
                                        <Stack spacing={1}>
                                            <Typography variant="subtitle2" color="primary">
                                                {formData.senderType === 'sender' ? 'Receivers' : 'Senders'} Overview
                                            </Typography>
                                            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto' }}>
                                                {(formData.senderType === 'sender' ? formData.receivers : formData.senders).map((rec, i) => (
                                                    <Chip
                                                        key={i}
                                                        label={`${(formData.senderType === 'sender' ? rec.receiverName : rec.senderName) ||
                                                            (formData.senderType === 'sender' ? `Receiver ${i + 1}` : `Sender ${i + 1}`)
                                                            } (Items: ${rec.shippingDetail?.totalNumber || 0
                                                            } / Remaining: ${rec.shippingDetail?.remainingItems || 0
                                                            })`}
                                                        variant={rec.fullPartial === 'Partial' ? "filled" : "outlined"}
                                                        color={rec.fullPartial === 'Partial' ? "warning" : "primary"}
                                                    />
                                                ))}
                                            </Stack>
                                        </Stack>
                                    )}
                                    {(formData.senderType === 'sender' ? formData.receivers : formData.senders).map((rec, i) => {
                                        const isSenderMode = formData.senderType === 'receiver';
                                        const currentList = isSenderMode ? formData.senders : formData.receivers;
                                        return (
                                            <Box key={i} sx={{ p: 2, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                                    <Typography variant="subtitle1" color="primary" fontWeight={"bold"}>
                                                        {isSenderMode ? `Sender ${i + 1}` : `Receiver ${i + 1}`}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1}>
                                                        {!isEditMode && (
                                                            <>
                                                                <IconButton
                                                                    onClick={() => (isSenderMode ? duplicateSender : duplicateReceiver)(i)}
                                                                    size="small"
                                                                    title="Duplicate"
                                                                >
                                                                    <CopyIcon />
                                                                </IconButton>
                                                                {currentList.length > 1 && (
                                                                    <IconButton
                                                                        onClick={() => (isSenderMode ? removeSender : removeReceiver)(i)}
                                                                        size="small"
                                                                        title="Delete"
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                )}
                                                            </>
                                                        )}
                                                    </Stack>
                                                </Stack>

                                                {/* Dynamic: Basic Info */}
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label={isSenderMode ? "Sender Name" : "Receiver Name"}
                                                        value={isSenderMode ? rec.senderName : rec.receiverName}
                                                        onChange={isSenderMode ? handleSenderChange(i, 'senderName') : handleReceiverChange(i, 'receiverName')}
                                                        error={!!(isSenderMode ? errors[`senders[${i}].senderName`] : errors[`receivers[${i}].receiverName`])}
                                                        helperText={isSenderMode ? errors[`senders[${i}].senderName`] : errors[`receivers[${i}].receiverName`]}
                                                        required
                                                        disabled={isFieldDisabled(isSenderMode ? `senders[${i}].senderName` : `receivers[${i}].receiverName`)}
                                                    />
                                                    <CustomTextField
                                                        label={isSenderMode ? "Sender Contact" : "Receiver Contact"}
                                                        value={isSenderMode ? rec.senderContact : rec.receiverContact}
                                                        onChange={isSenderMode ? handleSenderChange(i, 'senderContact') : handleReceiverChange(i, 'receiverContact')}
                                                        error={!!(isSenderMode ? errors[`senders[${i}].senderContact`] : errors[`receivers[${i}].receiverContact`])}
                                                        helperText={isSenderMode ? errors[`senders[${i}].senderContact`] : errors[`receivers[${i}].receiverContact`]}
                                                        disabled={isFieldDisabled(isSenderMode ? `senders[${i}].senderContact` : `receivers[${i}].receiverContact`)}
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'flex', py: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label={isSenderMode ? "Sender Address" : "Receiver Address"}
                                                        value={isSenderMode ? rec.senderAddress : rec.receiverAddress}
                                                        onChange={isSenderMode ? handleSenderChange(i, 'senderAddress') : handleReceiverChange(i, 'receiverAddress')}
                                                        error={!!(isSenderMode ? errors[`senders[${i}].senderAddress`] : errors[`receivers[${i}].receiverAddress`])}
                                                        helperText={isSenderMode ? errors[`senders[${i}].senderAddress`] : errors[`receivers[${i}].receiverAddress`]}
                                                        disabled={isFieldDisabled(isSenderMode ? `senders[${i}].senderAddress` : `receivers[${i}].receiverAddress`)}
                                                    />
                                                    <CustomTextField
                                                        label={isSenderMode ? "Sender Email" : "Receiver Email"}
                                                        value={isSenderMode ? rec.senderEmail : rec.receiverEmail}
                                                        onChange={isSenderMode ? handleSenderChange(i, 'senderEmail') : handleReceiverChange(i, 'receiverEmail')}
                                                        error={!!(isSenderMode ? errors[`senders[${i}].senderEmail`] : errors[`receivers[${i}].receiverEmail`])}
                                                        helperText={isSenderMode ? errors[`senders[${i}].senderEmail`] : errors[`receivers[${i}].receiverEmail`]}
                                                        disabled={isFieldDisabled(isSenderMode ? `senders[${i}].senderEmail` : `receivers[${i}].senderEmail`)}
                                                    />
                                                </Box>
                                                {/* Nested Shipping Details */}
                                                <Typography variant="subtitle1" color="primary" fontWeight={"bold"} mb={1}>Shipping Details</Typography>
                                                <Stack spacing={2}>
                                                    {/* Moved: ETA, ETD, Shipping Line to top of receiver/sender */}
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                        <CustomTextField
                                                            label="ETA"
                                                            name={isSenderMode ? `senders[${i}].eta` : `receivers[${i}].eta`}
                                                            type="date"
                                                            value={rec.eta || ""}
                                                            onChange={(e) => (isSenderMode ? handleSenderChange(i, 'eta') : handleReceiverChange(i, 'eta'))(e)}
                                                            InputLabelProps={{ shrink: true }}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].eta`] : errors[`receivers[${i}].eta`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].eta`] : errors[`receivers[${i}].eta`]}
                                                            required
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].eta` : `receivers[${i}].eta`)}
                                                        />
                                                        <CustomTextField
                                                            label="ETD"
                                                            name={isSenderMode ? `senders[${i}].etd` : `receivers[${i}].etd`}
                                                            type="date"
                                                            value={rec.etd || ""}
                                                            onChange={(e) => (isSenderMode ? handleSenderChange(i, 'etd') : handleReceiverChange(i, 'etd'))(e)}
                                                            InputLabelProps={{ shrink: true }}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].etd`] : errors[`receivers[${i}].etd`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].etd`] : errors[`receivers[${i}].etd`]}
                                                            required
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].etd` : `receivers[${i}].etd`)}
                                                        />
                                                    </Box>
                                                    <CustomTextField
                                                        label="Shipping Line"
                                                        name={isSenderMode ? `senders[${i}].shippingLine` : `receivers[${i}].shippingLine`}
                                                        value={rec.shippingLine || ""}
                                                        onChange={(e) => (isSenderMode ? handleSenderChange(i, 'shippingLine') : handleReceiverChange(i, 'shippingLine'))(e)}
                                                        error={!!(isSenderMode ? errors[`senders[${i}].shippingLine`] : errors[`receivers[${i}].shippingLine`])}
                                                        helperText={isSenderMode ? errors[`senders[${i}].shippingLine`] : errors[`receivers[${i}].shippingLine`]}
                                                        required
                                                        fullWidth
                                                        disabled={isFieldDisabled(isSenderMode ? `senders[${i}].shippingLine` : `receivers[${i}].shippingLine`)}
                                                    />
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                        <CustomTextField
                                                            label="Pickup Location"
                                                            value={rec.shippingDetail?.pickupLocation || ""}
                                                            onChange={isSenderMode ? handleSenderShippingChange(i, 'pickupLocation') : handleReceiverShippingChange(i, 'pickupLocation')}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].shippingDetail.pickupLocation`] : errors[`receivers[${i}].shippingDetail.pickupLocation`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].shippingDetail.pickupLocation`] : errors[`receivers[${i}].shippingDetail.pickupLocation`]}
                                                            required
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].shippingDetail.pickupLocation` : `receivers[${i}].shippingDetail.pickupLocation`)}
                                                        />
                                                        <CustomSelect
                                                            label="Category"
                                                            value={rec.shippingDetail?.category || ""}
                                                            onChange={isSenderMode ? handleSenderShippingChange(i, 'category') : handleReceiverShippingChange(i, 'category')}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].shippingDetail.category`] : errors[`receivers[${i}].shippingDetail.category`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].shippingDetail.category`] : errors[`receivers[${i}].shippingDetail.category`]}
                                                            required
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].shippingDetail.category` : `receivers[${i}].shippingDetail.category`)}
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
                                                            value={rec.shippingDetail?.subcategory || ""}
                                                            onChange={isSenderMode ? handleSenderShippingChange(i, 'subcategory') : handleReceiverShippingChange(i, 'subcategory')}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].shippingDetail.subcategory`] : errors[`receivers[${i}].shippingDetail.subcategory`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].shippingDetail.subcategory`] : errors[`receivers[${i}].shippingDetail.subcategory`]}
                                                            required
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].shippingDetail.subcategory` : `receivers[${i}].shippingDetail.subcategory`)}
                                                        >
                                                            <MenuItem value="">Select Subcategory</MenuItem>
                                                            {(categorySubMap[rec.shippingDetail?.category] || []).map((sc) => (
                                                                <MenuItem key={sc} value={sc}>
                                                                    {sc}
                                                                </MenuItem>
                                                            ))}
                                                        </CustomSelect>
                                                        <CustomSelect
                                                            label="Type"
                                                            value={rec.shippingDetail?.type || ""}
                                                            onChange={isSenderMode ? handleSenderShippingChange(i, 'type') : handleReceiverShippingChange(i, 'type')}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].shippingDetail.type`] : errors[`receivers[${i}].shippingDetail.type`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].shippingDetail.type`] : errors[`receivers[${i}].shippingDetail.type`]}
                                                            required
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].shippingDetail.type` : `receivers[${i}].shippingDetail.type`)}
                                                        >
                                                            <MenuItem value="">Select Type</MenuItem>
                                                            {types.map((t) => (
                                                                <MenuItem key={t} value={t}>
                                                                    {t}
                                                                </MenuItem>
                                                            ))}
                                                        </CustomSelect>
                                                    </Box>
                                                    <CustomTextField
                                                        label="Delivery Address"
                                                        value={rec.shippingDetail?.deliveryAddress || ""}
                                                        onChange={isSenderMode ? handleSenderShippingChange(i, 'deliveryAddress') : handleReceiverShippingChange(i, 'deliveryAddress')}
                                                        error={!!(isSenderMode ? errors[`senders[${i}].shippingDetail.deliveryAddress`] : errors[`receivers[${i}].shippingDetail.deliveryAddress`])}
                                                        helperText={isSenderMode ? errors[`senders[${i}].shippingDetail.deliveryAddress`] : errors[`receivers[${i}].shippingDetail.deliveryAddress`]}
                                                        fullWidth
                                                        disabled={isFieldDisabled(isSenderMode ? `senders[${i}].shippingDetail.deliveryAddress` : `receivers[${i}].shippingDetail.deliveryAddress`)}
                                                    />
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                        <CustomTextField
                                                            label="Total Number"
                                                            value={rec.shippingDetail?.totalNumber || ""}
                                                            onChange={isSenderMode ? handleSenderShippingChange(i, 'totalNumber') : handleReceiverShippingChange(i, 'totalNumber')}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].shippingDetail.totalNumber`] : errors[`receivers[${i}].shippingDetail.totalNumber`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].shippingDetail.totalNumber`] : errors[`receivers[${i}].shippingDetail.totalNumber`]}
                                                            required
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].shippingDetail.totalNumber` : `receivers[${i}].shippingDetail.totalNumber`)}
                                                        />
                                                        <CustomTextField
                                                            label="Weight"
                                                            value={rec.shippingDetail?.weight || ""}
                                                            onChange={isSenderMode ? handleSenderShippingChange(i, 'weight') : handleReceiverShippingChange(i, 'weight')}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].shippingDetail.weight`] : errors[`receivers[${i}].shippingDetail.weight`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].shippingDetail.weight`] : errors[`receivers[${i}].shippingDetail.weight`]}
                                                            required
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].shippingDetail.weight` : `receivers[${i}].shippingDetail.weight`)}
                                                        />
                                                    </Box>
                                                    {/* <CustomTextField
                                                        label="Remaining Items"
                                                        value={rec.shippingDetail?.remainingItems || ""}
                                                        disabled={true}
                                                        helperText="Auto-calculated for partial deliveries"
                                                    /> */}
                                                </Stack>

                                                {/* Assigned Containers */}
                                                <Typography variant="subtitle1" color="primary" fontWeight={"bold"} mt={2}>Assigned Containers</Typography>
                                                <Box sx={{ display: 'flex', py: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <FormControl sx={{ flex: 1, minWidth: 0 }} error={!!(isSenderMode ? errors[`senders[${i}].containers`] : errors[`receivers[${i}].containers`])}>
                                                        <InputLabel sx={{ color: "rgba(180, 174, 174, 1)" }}>Select Containers</InputLabel>
                                                        <Select
                                                            value={rec.containers || []}
                                                            label="Select Containers"
                                                            onChange={isSenderMode ? handleSenderContainersChange(i) : handleReceiverContainersChange(i)}
                                                            disabled={loadingContainers || isFieldDisabled(isSenderMode ? `senders[${i}].containers` : `receivers[${i}].containers`)}
                                                            size="medium"
                                                            multiple
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
                                                                    ...((isSenderMode ? errors[`senders[${i}].containers`] : errors[`receivers[${i}].containers`]) && { "& fieldset": { borderColor: "#d32f2f" } }),
                                                                    ...(isFieldDisabled(isSenderMode ? `senders[${i}].containers` : `receivers[${i}].containers`) && { backgroundColor: "#f5f5f5", color: "#999" }),
                                                                },
                                                            }}
                                                        >
                                                            {containers.map((container) => (
                                                                <MenuItem key={container.cid} value={container.container_number}>
                                                                    {`${container.container_number} (${container.container_size} - ${container.derived_status || container.availability})`}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                        {(isSenderMode ? errors[`senders[${i}].containers`] : errors[`receivers[${i}].containers`]) &&
                                                            <Typography variant="caption" color="error">
                                                                {isSenderMode ? errors[`senders[${i}].containers`] : errors[`receivers[${i}].containers`]}
                                                            </Typography>
                                                        }
                                                    </FormControl>
                                                    <CustomSelect
                                                        label="Status"
                                                        value={rec.status}
                                                        onChange={isSenderMode ? handleSenderChange(i, 'status') : handleReceiverChange(i, 'status')}
                                                        error={!!(isSenderMode ? errors[`senders[${i}].status`] : errors[`receivers[${i}].status`])}
                                                        helperText={isSenderMode ? errors[`senders[${i}].status`] : errors[`receivers[${i}].status`]}
                                                        disabled={isFieldDisabled(isSenderMode ? `senders[${i}].status` : `receivers[${i}].status`)}
                                                    >
                                                        {statuses.map((s) => (
                                                            <MenuItem key={s} value={s}>
                                                                {s}
                                                            </MenuItem>
                                                        ))}
                                                    </CustomSelect>
                                                </Box>
                                                {/* Consignment Details */}
                                                <Typography variant="subtitle1" color="primary" fontWeight={"bold"} mt={2}>Consignment Details</Typography>
                                                <Stack spacing={2}>
                                                    <Box sx={{ display: 'flex', py: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                        <CustomTextField
                                                            label="Consignment Vessel"
                                                            value={rec.consignmentVessel || ""}
                                                            onChange={isSenderMode ? handleSenderChange(i, 'consignmentVessel') : handleReceiverChange(i, 'consignmentVessel')}
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].consignmentVessel` : `receivers[${i}].consignmentVessel`)}
                                                        />
                                                        <CustomTextField
                                                            label="Consignment Marks"
                                                            value={rec.consignmentMarks || ""}
                                                            onChange={isSenderMode ? handleSenderChange(i, 'consignmentMarks') : handleReceiverChange(i, 'consignmentMarks')}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].consignmentMarks`] : errors[`receivers[${i}].consignmentMarks`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].consignmentMarks`] : errors[`receivers[${i}].consignmentMarks`]}
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].consignmentMarks` : `receivers[${i}].consignmentMarks`)}
                                                        />
                                                    </Box>
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                        <CustomTextField
                                                            label="Consignment Number"
                                                            value={rec.consignmentNumber || ""}
                                                            onChange={isSenderMode ? handleSenderChange(i, 'consignmentNumber') : handleReceiverChange(i, 'consignmentNumber')}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].consignmentNumber`] : errors[`receivers[${i}].consignmentNumber`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].consignmentNumber`] : errors[`receivers[${i}].consignmentNumber`]}
                                                            required
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].consignmentNumber` : `receivers[${i}].consignmentNumber`)}
                                                        />
                                                        <CustomTextField
                                                            label="Consignment Voyage"
                                                            value={rec.consignmentVoyage || ""}
                                                            onChange={isSenderMode ? handleSenderChange(i, 'consignmentVoyage') : handleReceiverChange(i, 'consignmentVoyage')}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].consignmentVoyage`] : errors[`receivers[${i}].consignmentVoyage`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].consignmentVoyage`] : errors[`receivers[${i}].consignmentVoyage`]}
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].consignmentVoyage` : `receivers[${i}].consignmentVoyage`)}
                                                        />
                                                        <CustomTextField
                                                            label={isSenderMode ? "Sender Ref" : "Receiver Ref"}
                                                            value={isSenderMode ? rec.senderRef : rec.receiverRef}
                                                            onChange={isSenderMode ? handleSenderChange(i, 'senderRef') : handleReceiverChange(i, 'receiverRef')}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].senderRef`] : errors[`receivers[${i}].receiverRef`])}
                                                            helperText={isSenderMode ? errors[`senders[${i}].senderRef`] : errors[`receivers[${i}].receiverRef`]}
                                                            required
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].senderRef` : `receivers[${i}].receiverRef`)}
                                                        />
                                                    </Box>
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                        <CustomTextField
                                                            label="Total Number"
                                                            value={rec.totalNumber || ""}
                                                            onChange={isSenderMode ? handleSenderChange(i, 'totalNumber') : handleReceiverChange(i, 'totalNumber')}
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].totalNumber` : `receivers[${i}].totalNumber`)}
                                                        />
                                                        <CustomTextField
                                                            label="Total Weight*"
                                                            value={rec.totalWeight || ""}
                                                            onChange={isSenderMode ? handleSenderChange(i, 'totalWeight') : handleReceiverChange(i, 'totalWeight')}
                                                            error={!!(isSenderMode ? errors[`senders[${i}].totalWeight`] : errors[`receivers[${i}].totalWeight`])}
                                                            helperText={(isSenderMode ? errors[`senders[${i}].totalWeight`] : errors[`receivers[${i}].totalWeight`]) || "Synced from shipping (editable for overrides)"}
                                                            required
                                                            disabled={isFieldDisabled(isSenderMode ? `senders[${i}].totalWeight` : `receivers[${i}].totalWeight`)}
                                                        />
                                                        <CustomTextField
                                                            label="Ref Number"
                                                            value={rec.itemRef || ""}
                                                            disabled={true}
                                                        />
                                                    </Box>
                                                    {/* New: Moved Remarks to consignment */}
                                                    <CustomTextField
                                                        label="Remarks"
                                                        value={rec.remarks || ""}
                                                        onChange={isSenderMode ? handleSenderChange(i, 'remarks') : handleReceiverChange(i, 'remarks')}
                                                        multiline
                                                        rows={2}
                                                        fullWidth
                                                        disabled={isFieldDisabled(isSenderMode ? `senders[${i}].remarks` : `receivers[${i}].remarks`)}
                                                    />
                                                </Stack>
                                            </Box>
                                        );
                                    })}
                                    <Button
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={formData.senderType === 'receiver' ? addSender : addReceiver}
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        {formData.senderType === 'receiver' ? 'Add Sender' : 'Add Receiver'}
                                    </Button>
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
                                3. Transport
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
                                                    {formData.gatepass.map((gatepass, j) => {
                                                        const src = typeof gatepass === 'string' ? gatepass : URL.createObjectURL(gatepass);
                                                        const label = typeof gatepass === 'string' ? gatepass.split('/').pop() : gatepass.name || 'File';
                                                        return (
                                                            <Chip
                                                                key={j}
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
                                4. Order Summary
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
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" key={i}>
                                                <Chip sx={{ p: 2 }} label={rec.receiverName || `Receiver ${i + 1}`} size="small" color="primary" variant="outlined" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Delivered: {rec.qtyDelivered || 0} / Remaining: {rec.shippingDetail.remainingItems || 0}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                    {formData.receivers.some(rec => rec.containers && rec.containers.length > 0) && (
                                        <Stack spacing={1}>
                                            <Typography variant="body1" fontWeight="medium">Assigned Containers:</Typography>
                                            {formData.receivers.flatMap(rec => rec.containers || []).map((cont, i) => (
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" key={i}>
                                                    <Chip sx={{ p: 2 }} label={cont} color="info" size="small" variant="outlined" />
                                                </Stack>
                                            ))}
                                        </Stack>
                                    )}
                                    {/* New: Global Totals */}
                                    <Divider />
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Total Items (All Receivers):</Typography>
                                        <Chip label={formData.globalTotalItems || "-"} variant="outlined" color="success" />
                                    </Stack>
                                    {formData.globalRemainingItems < formData.globalTotalItems && (
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body1" fontWeight="medium">Remaining Items (Partials):</Typography>
                                            <Chip label={formData.globalRemainingItems} variant="filled" color="warning" />
                                        </Stack>
                                    )}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Shipping Line:</Typography>
                                        <Typography variant="body1">{formData.receivers[0]?.shippingLine || "-"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">ETA:</Typography>
                                        <Typography variant="body1">{formData.receivers[0]?.eta || "-"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Transport Type:</Typography>
                                        <Typography variant="body1">{formData.transportType || "-"}</Typography>
                                    </Stack>
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
                                5. Attachments
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

                    {/* Bottom Buttons */}
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