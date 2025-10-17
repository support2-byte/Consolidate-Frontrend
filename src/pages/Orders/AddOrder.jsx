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

const CustomSelect = ({ label, name, value, onChange, children, sx: selectSx, error, disabled, required = false, renderValue }) => (
    <FormControl size="medium" sx={{ flex: 1, minWidth: 0, ...selectSx, background: "#fff" }} error={error} required={required}>
        <InputLabel sx={{ color: "rgba(180, 174, 174, 1)", ...(disabled && { color: "#999" }) }}>{label}</InputLabel>
        <Select
            label={label}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            size="medium"
            renderValue={renderValue}
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
        remainingItems: ""
    };
    const initialSenderObject = {
        senderName: '',
        senderContact: '',
        senderAddress: '',
        senderEmail: '',
        eta: '',
        etd: '',
        shippingLine: '',
        shippingDetails: [],
        fullPartial: '',
        qtyDelivered: '',
        status: '',
        remarks: '',
    };
    const initialReceiver = {
        receiverName: "",
        receiverContact: "",
        receiverAddress: "",
        receiverEmail: "",
        eta: '',
        etd: '',
        shippingLine: '',
        shippingDetails: [],
        fullPartial: "",
        qtyDelivered: "",
        status: "Created",
        remarks: "",
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
        senders: [{ ...initialSenderObject, shippingDetails: [] }],
        // Receivers array with nested shippingDetails
        receivers: [{ ...initialReceiver, shippingDetails: [] }],
        // Computed globals
        globalTotalItems: 0,
        globalRemainingItems: 0,
        // Transport fields
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
        fullPartial: "",  // Deprecated
        qtyDelivered: "",  // Deprecated
        clientReceiverName: "",
        clientReceiverId: "",
        clientReceiverMobile: "",
        deliveryDate: "",
        gatepass: [],
        senderType: 'sender',
        selectedSenderOwner: ''
    });

    // Editable fields in edit mode
    const editableInEdit = [
        'transportType', 'dropMethod', 'dropoffName', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate',
        'collectionMethod', 'fullPartial', 'qtyDelivered', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate',
        'thirdPartyTransport', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber',
        // Per-receiver partials and shipping
        'receivers[].fullPartial', 'receivers[].qtyDelivered', 'receivers[].shippingDetails[].totalNumber'
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
    const types = ["Select Unit", "Unit 1", "Unit 2"];
    const statuses = ["Created", "In Transit", "Delivered", "Cancelled"];
    const places = ["Select Place", "Singapore", "Dubai", "Rotterdam", "Hamburg", "Karachi", "Dubai-Emirates"];
    const companies = ["Select 3rd party company", "Company A", "Company B"];

    // Helper to convert snake_case to camelCase
    const snakeToCamel = (str) => str.replace(/(_[a-z])/g, g => g[1].toUpperCase());

    // Helper to convert camelCase to snake_case
    const camelToSnake = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();

    // Compute global totals
    useEffect(() => {
        let total = 0;
        let remaining = 0;
        formData.receivers.forEach(rec => {
            const recTotal = (rec.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
            const recDelivered = parseInt(rec.qtyDelivered || 0) || 0;
            const recRemaining = Math.max(0, recTotal - recDelivered);
            total += recTotal;
            remaining += recRemaining;
        });
        setFormData(prev => ({ ...prev, globalTotalItems: total, globalRemainingItems: remaining }));
    }, [formData.receivers]);

    // Compute per-receiver remaining and per-sd remaining proportionally when partial changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            receivers: prev.receivers.map(rec => {
                const shippingDetails = rec.shippingDetails || [];
                const recTotal = shippingDetails.reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
                const delivered = parseInt(rec.qtyDelivered || 0) || 0;
                const recRemaining = Math.max(0, recTotal - delivered);
                if (rec.fullPartial === 'Partial' && recTotal > 0) {
                    const updatedDetails = shippingDetails.map(sd => {
                        const sdTotal = parseInt(sd.totalNumber || 0) || 0;
                        const sdRemaining = Math.round((sdTotal / recTotal) * recRemaining);
                        return { ...sd, remainingItems: sdRemaining.toString() };
                    });
                    return { ...rec, shippingDetails: updatedDetails };
                } else {
                    const updatedDetails = shippingDetails.map(sd => ({ ...sd, remainingItems: (parseInt(sd.totalNumber || 0) || 0).toString() }));
                    return { ...rec, shippingDetails: updatedDetails };
                }
            })
        }));
    }, [formData.receivers.flatMap(r => r.shippingDetails.map(sd => `${sd.totalNumber}-${r.qtyDelivered}-${r.fullPartial}`)).join(',')]);

    const validateForm = () => {
        const newErrors = {};

        // Core required fields
        const coreRequired = ['bookingRef', 'rglBookingNumber', 'pointOfOrigin', 'placeOfLoading', 'placeOfDelivery', 'finalDestination'];
        coreRequired.forEach(field => {
            if (!formData[field]?.trim()) {
                newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
            }
        });

        // Validate senderType
        if (!formData.senderType) {
            newErrors.senderType = 'Sender Type is required';
        }

        // Dynamic validation for panel2
        const isSenderMode = formData.senderType === 'receiver';
        const items = isSenderMode ? formData.senders : formData.receivers;
        const itemsKey = isSenderMode ? 'senders' : 'receivers';
        const itemPrefix = isSenderMode ? 'Sender' : 'Receiver';

        if (items.length === 0) {
            newErrors[itemsKey] = `At least one ${itemPrefix.toLowerCase()} is required`;
        } else {
            items.forEach((item, i) => {
                const nameField = isSenderMode ? 'senderName' : 'receiverName';
                const contactField = isSenderMode ? 'senderContact' : 'receiverContact';
                const addressField = isSenderMode ? 'senderAddress' : 'receiverAddress';
                const emailField = isSenderMode ? 'senderEmail' : 'receiverEmail';

                if (!item[nameField]?.trim()) {
                    newErrors[`${itemsKey}[${i}].${nameField}`] = `${itemPrefix} ${i + 1} name is required`;
                }
                if (!item[contactField]?.trim()) {
                    newErrors[`${itemsKey}[${i}].${contactField}`] = `${itemPrefix} ${i + 1} contact is required`;
                }
                if (!item[addressField]?.trim()) {
                    newErrors[`${itemsKey}[${i}].${addressField}`] = `${itemPrefix} ${i + 1} address is required`;
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (item[emailField] && !emailRegex.test(item[emailField])) {
                    newErrors[`${itemsKey}[${i}].${emailField}`] = `Invalid ${itemPrefix.toLowerCase()} ${i + 1} email format`;
                }

                if (!item.eta?.trim()) {
                    newErrors[`${itemsKey}[${i}].eta`] = `ETA is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
                }
                if (!item.etd?.trim()) {
                    newErrors[`${itemsKey}[${i}].etd`] = `ETD is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
                }
                if (!item.shippingLine?.trim()) {
                    newErrors[`${itemsKey}[${i}].shippingLine`] = `Shipping Line is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
                }

                // Validate each shippingDetail
                const shippingDetails = item.shippingDetails || [];
                if (shippingDetails.length === 0) {
                    newErrors[`${itemsKey}[${i}].shippingDetails`] = `At least one shipping detail is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
                } else {
                    shippingDetails.forEach((sd, j) => {
                        const shippingRequiredFields = ['pickupLocation', 'category', 'subcategory', 'type', 'deliveryAddress', 'totalNumber', 'weight'];
                        shippingRequiredFields.forEach(field => {
                            if (!sd[field]?.trim()) {
                                newErrors[`${itemsKey}[${i}].shippingDetails[${j}].${field}`] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required for shipping detail ${j + 1}`;
                            }
                        });

                        const totalNum = parseInt(sd.totalNumber);
                        if (isNaN(totalNum) || totalNum <= 0) {
                            newErrors[`${itemsKey}[${i}].shippingDetails[${j}].totalNumber`] = `Total Number must be a positive number`;
                        }
                        if (sd.weight && (isNaN(parseFloat(sd.weight)) || parseFloat(sd.weight) <= 0)) {
                            newErrors[`${itemsKey}[${i}].shippingDetails[${j}].weight`] = `Weight must be a positive number`;
                        }
                    });
                }

                // Validate full/partial
                if (item.fullPartial === 'Partial') {
                    if (!item.qtyDelivered?.trim()) {
                        newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered is required for partial ${itemPrefix.toLowerCase()} ${i + 1}`;
                    } else {
                        const del = parseInt(item.qtyDelivered);
                        const recTotal = (item.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
                        if (isNaN(del) || del <= 0) {
                            newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered must be a positive number`;
                        } else if (del > recTotal) {
                            newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered (${del}) cannot exceed total number (${recTotal})`;
                        }
                    }
                }
            });
        }

        // Transport validations (unchanged)
        if (!formData.transportType) {
            newErrors.transportType = 'Transport Type is required';
        }

        const anyPartial = items.some(item => item.fullPartial === 'Partial');
        const showInbound = formData.finalDestination?.includes('Karachi');
        const showOutbound = formData.placeOfLoading?.includes('Dubai');

        if (showInbound && formData.transportType === 'Drop Off') {
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
            if (!formData.thirdPartyTransport?.trim()) {
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

        // Email and mobile validations
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.senderEmail && !emailRegex.test(formData.senderEmail)) {
            newErrors.senderEmail = 'Invalid sender email format';
        }
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
                if (key.startsWith('receivers[') || key.startsWith('senders[')) panelsToExpand.add('panel2');
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

    const fetchOrder = async (id) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/orders/${id}`, { params: { includeContainer: true } });

            if (!response.data) {
                throw new Error('Invalid response data');
            }

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

            // Handle multiples - map receivers to camelCase
            let mappedReceivers = ((response.data.receivers || []) || []).map(rec => {
                if (!rec) return null;  // Skip invalid rec

                const camelRec = {
                    ...initialReceiver,
                    shippingDetails: [],
                    isNew: false,
                    validationWarnings: null
                };

                Object.keys(rec).forEach(apiKey => {
                    let val = rec[apiKey];
                    if (val === null || val === undefined) val = '';
                    const camelKey = snakeToCamel(apiKey);
                    camelRec[camelKey] = val;
                });

                // Handle legacy shippingDetail to array
                if (rec.shipping_detail) {
                    const sd = { ...rec.shipping_detail };
                    Object.keys(sd).forEach(key => {
                        const camelKey = snakeToCamel(key);
                        sd[camelKey] = sd[key];
                        delete sd[key];
                    });
                    camelRec.shippingDetails = [sd];
                }

                camelRec.status = rec.status || "Created";

                // New fields default
                camelRec.fullPartial = camelRec.fullPartial || '';
                camelRec.qtyDelivered = camelRec.qtyDelivered != null ? String(camelRec.qtyDelivered) : '0';

                return camelRec;
            }).filter(Boolean);

            // Fallback receiver fields to order-level if empty
            mappedReceivers.forEach(rec => {
                if (rec.eta === '' && camelData.eta) {
                    rec.eta = camelData.eta;
                }
                if (rec.etd === '' && camelData.etd) {
                    rec.etd = camelData.etd;
                }
                if (rec.shippingLine === '' && camelData.shippingLine) {
                    rec.shippingLine = camelData.shippingLine;
                }
            });

            // Compute remainingItems on load
            mappedReceivers = mappedReceivers.map(rec => {
                const shippingDetails = rec.shippingDetails || [];
                const recTotal = shippingDetails.reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
                const delivered = parseInt(rec.qtyDelivered || 0) || 0;
                const recRemaining = Math.max(0, recTotal - delivered);
                let updatedDetails = shippingDetails;
                if (rec.fullPartial === 'Partial' && recTotal > 0) {
                    updatedDetails = shippingDetails.map(sd => {
                        const sdTotal = parseInt(sd.totalNumber || 0) || 0;
                        const sdRemaining = Math.round((sdTotal / recTotal) * recRemaining);
                        return { ...sd, remainingItems: sdRemaining.toString() };
                    });
                } else {
                    updatedDetails = shippingDetails.map(sd => ({ ...sd, remainingItems: (parseInt(sd.totalNumber || 0) || 0).toString() }));
                }
                rec.shippingDetails = updatedDetails;

                // Validation warnings
                let warnings = null;
                const isInvalidTotal = recTotal <= 0;
                const isPartialInvalid = rec.fullPartial === 'Partial' && delivered > recTotal;
                if (isInvalidTotal || isPartialInvalid) {
                    warnings = {};
                    if (isInvalidTotal) warnings.total_number = 'Must be positive';
                    if (isPartialInvalid) warnings.qty_delivered = 'Cannot exceed total_number';
                }
                rec.validationWarnings = warnings;

                return rec;
            });

            camelData.receivers = mappedReceivers;
            if (!camelData.receivers || camelData.receivers.length === 0) {
                camelData.receivers = [{
                    ...initialReceiver,
                    shippingDetails: [],
                    isNew: true
                }];
            }

            // Set senderType
            camelData.senderType = 'sender';

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

            // Set initial errors from validation warnings
            const initialErrors = {};
            camelData.receivers.forEach((rec, i) => {
                if (rec.validationWarnings) {
                    if (rec.validationWarnings.total_number) {
                        initialErrors[`receivers[${i}].totalNumber`] = rec.validationWarnings.total_number;
                    }
                    if (rec.validationWarnings.qty_delivered) {
                        initialErrors[`receivers[${i}].qtyDelivered`] = rec.validationWarnings.qty_delivered;
                    }
                }
            });
            setErrors(initialErrors);

            const hasWarnings = mappedReceivers.some(r => r && r.validationWarnings);
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

    // Receiver handlers
    const addReceiver = () => {
        setFormData(prev => ({
            ...prev,
            receivers: [...prev.receivers, { ...initialReceiver, shippingDetails: [], isNew: true }]
        }));
    };

    const removeReceiver = (index) => {
        setFormData(prev => ({
            ...prev,
            receivers: prev.receivers.filter((_, i) => i !== index)
        }));
    };

    const duplicateReceiver = (index) => {
        setFormData(prev => ({
            ...prev,
            receivers: [
                ...prev.receivers.slice(0, index + 1),
                { ...prev.receivers[index], shippingDetails: prev.receivers[index].shippingDetails.map(sd => ({ ...sd })), isNew: true },
                ...prev.receivers.slice(index + 1)
            ]
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
        const errorKey = `receivers[${index}].${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[errorKey];
                return newErr;
            });
        }
    };

    const handleReceiverShippingChange = (index, j, field) => (e) => {
        const value = e.target.value;
        setFormData(prev => {
            const rec = prev.receivers[index];
            const oldSd = rec.shippingDetails[j] || {};
            const updatedSd = { ...oldSd, [field]: value };
            if (field === 'category' && value !== oldSd.category) {
                updatedSd.subcategory = '';
            }
            return {
                ...prev,
                receivers: prev.receivers.map((r, i) =>
                    i === index ? { 
                        ...r, 
                        shippingDetails: r.shippingDetails.map((sd, k) => k === j ? updatedSd : sd)
                    } : r
                )
            };
        });
        const errorKey = `receivers[${index}].shippingDetails[${j}].${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[errorKey];
                return newErr;
            });
        }
    };

    const handleReceiverPartialChange = (index, field) => (e) => {
        const value = e.target.value;
        setFormData(prev => {
            const rec = prev.receivers[index];
            const updated = { ...rec, [field]: value };
            if (field === 'fullPartial' && value === 'Full') {
                updated.qtyDelivered = '';
            }
            return {
                ...prev,
                receivers: prev.receivers.map((r, i) => i === index ? updated : r)
            };
        });
        const errorKey = `receivers[${index}].${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[errorKey];
                return newErr;
            });
        }
    };

    const addReceiverShipping = (index) => {
        setFormData(prev => ({
            ...prev,
            receivers: prev.receivers.map((r, i) =>
                i === index ? { ...r, shippingDetails: [...(r.shippingDetails || []), { ...initialShippingDetail }] } : r
            )
        }));
    };

    const duplicateReceiverShipping = (index, j) => {
        const toDuplicate = formData.receivers[index].shippingDetails[j];
        setFormData(prev => ({
            ...prev,
            receivers: prev.receivers.map((r, i) =>
                i === index ? { 
                    ...r, 
                    shippingDetails: [
                        ...r.shippingDetails.slice(0, j + 1),
                        { ...toDuplicate },
                        ...r.shippingDetails.slice(j + 1)
                    ]
                } : r
            )
        }));
    };

    const removeReceiverShipping = (index, j) => {
        setFormData(prev => ({
            ...prev,
            receivers: prev.receivers.map((r, i) =>
                i === index ? { ...r, shippingDetails: r.shippingDetails.filter((_, k) => k !== j) } : r
            )
        }));
    };

    // Sender handlers (similar)
    const addSender = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            senders: [...prev.senders, { ...initialSenderObject, shippingDetails: [] }],
        }));
    }, []);

    const removeSender = useCallback((index) => {
        setFormData((prev) => ({
            ...prev,
            senders: prev.senders.filter((_, i) => i !== index),
        }));
    }, []);

    const duplicateSender = useCallback((index) => {
        const toDuplicate = formData.senders[index];
        setFormData((prev) => ({
            ...prev,
            senders: [
                ...prev.senders.slice(0, index + 1),
                { ...toDuplicate, shippingDetails: toDuplicate.shippingDetails.map(sd => ({ ...sd })), id: Date.now() },
                ...prev.senders.slice(index + 1),
            ],
        }));
    }, [formData.senders]);

    const handleSenderChange = useCallback((index, field) => (event) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            senders: prev.senders.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));

        const errorKey = `senders[${index}].${field}`;
        if (errors[errorKey]) {
            setErrors((prev) => ({ ...prev, [errorKey]: '' }));
        }
    }, [errors]);

    const handleSenderShippingChange = useCallback((index, j, field) => (event) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            senders: prev.senders.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        shippingDetails: item.shippingDetails.map((sd, k) => k === j ? { ...sd, [field]: value } : sd),
                    }
                    : item
            ),
        }));

        const errorKey = `senders[${index}].shippingDetails[${j}].${field}`;
        if (errors[errorKey]) {
            setErrors((prev) => ({ ...prev, [errorKey]: '' }));
        }
    }, [errors]);

    const handleSenderPartialChange = useCallback((index, field) => (event) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            senders: prev.senders.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));

        const errorKey = `senders[${index}].${field}`;
        if (errors[errorKey]) {
            setErrors((prev) => ({ ...prev, [errorKey]: '' }));
        }
    }, [errors]);

    const addSenderShipping = (index) => {
        setFormData(prev => ({
            ...prev,
            senders: prev.senders.map((r, i) =>
                i === index ? { ...r, shippingDetails: [...(r.shippingDetails || []), { ...initialShippingDetail }] } : r
            )
        }));
    };

    const duplicateSenderShipping = (index, j) => {
        const toDuplicate = formData.senders[index].shippingDetails[j];
        setFormData(prev => ({
            ...prev,
            senders: prev.senders.map((r, i) =>
                i === index ? { 
                    ...r, 
                    shippingDetails: [
                        ...r.shippingDetails.slice(0, j + 1),
                        { ...toDuplicate },
                        ...r.shippingDetails.slice(j + 1)
                    ]
                } : r
            )
        }));
    };

    const removeSenderShipping = (index, j) => {
        setFormData(prev => ({
            ...prev,
            senders: prev.senders.map((r, i) =>
                i === index ? { ...r, shippingDetails: r.shippingDetails.filter((_, k) => k !== j) } : r
            )
        }));
    };

    const handleReceiverContainersChange = (index) => (event) => {
        // Removed containers, placeholder
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

        // Append sender fields
        const senderKeys = ['senderName', 'senderContact', 'senderAddress', 'senderEmail', 'senderRef', 'senderRemarks', 'senderType', 'selectedSenderOwner'];
        senderKeys.forEach(key => {
            const apiKey = camelToSnake(key);
            formDataToSend.append(apiKey, formData[key] || '');
        });

        // Dynamic panel2 items
        const panel2Items = formData.senderType === 'receiver' ? formData.senders : formData.receivers;
        const isSenderMode = formData.senderType === 'receiver';

        // Append receivers as JSON (basic info)
        const receiversToSend = panel2Items.map((item, i) => {
            const snakeRec = {};
            const nameVal = isSenderMode ? (item.senderName || '') : (item.receiverName || '');
            const contactVal = isSenderMode ? (item.senderContact || '') : (item.receiverContact || '');
            const addressVal = isSenderMode ? (item.senderAddress || '') : (item.receiverAddress || '');
            const emailVal = isSenderMode ? (item.senderEmail || '') : (item.receiverEmail || '');

            snakeRec.receiver_name = nameVal;
            snakeRec.receiver_contact = contactVal;
            snakeRec.receiver_address = addressVal;
            snakeRec.receiver_email = emailVal;

            snakeRec.eta = item.eta || '';
            snakeRec.etd = item.etd || '';
            snakeRec.shipping_line = item.shippingLine || '';
            snakeRec.full_partial = item.fullPartial || '';
            snakeRec.qty_delivered = item.qtyDelivered || '';
            snakeRec.status = item.status || 'Created';
            snakeRec.remarks = item.remarks || '';

            return snakeRec;
        });
        formDataToSend.append('receivers', JSON.stringify(receiversToSend));

        // Append order_items from all shippingDetails flat
        const orderItemsToSend = [];
        panel2Items.forEach((item, i) => {
            (item.shippingDetails || []).forEach((sd, j) => {
                const snakeItem = {};
                Object.keys(sd).forEach(key => {
                    if (key !== 'remainingItems') {
                        const snakeKey = camelToSnake(key);
                        snakeItem[snakeKey] = sd[key] || '';
                    }
                });
                snakeItem.item_ref = `ORDER-ITEM-REF-${i + 1}-${j + 1}-${Date.now()}`;
                orderItemsToSend.push(snakeItem);
            });
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
            const response = await api[method](endpoint, formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

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
            console.error("[handleSave] Backend error:", err.response?.data || err.message);
            const backendMsg = err.response?.data?.error || err.message || 'Failed to save order';
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

    const isFieldDisabled = (name) => {
        if (!isEditMode) return false;
        if (name.startsWith('receivers[') || name.startsWith('senders[')) {
            // For new items, editable
            const match = name.match(/(receivers|senders)\[(\d+)\]\.(.+)/);
            if (match) {
                const list = match[1] === 'receivers' ? formData.receivers : formData.senders;
                const idx = parseInt(match[2]);
                const item = list[idx];
                if (item?.isNew) return false;
            }
            return !editableInEdit.some(e => name.includes(e.replace('receivers[].', '').replace('receivers[', '')));
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
                                value={formData.pointOfOrigin || "Karachi"}
                                onChange={handleChange}
                                error={!!errors.pointOfOrigin}
                                renderValue={(selected) => selected || "Karachi"}
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
                                value={formData.placeOfLoading || ""}
                                onChange={handleChange}
                                error={!!errors.placeOfLoading}
                                renderValue={(selected) => selected || "Select Place of Loading"}
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
                                value={formData.placeOfDelivery || ""}
                                onChange={handleChange}
                                error={!!errors.placeOfDelivery}
                                renderValue={(selected) => selected || "Select Place of Delivery"}
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
                                value={formData.finalDestination || "Dubai"}
                                onChange={handleChange}
                                error={!!errors.finalDestination}
                                renderValue={(selected) => selected || "Dubai"}
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
                                    {(() => {
                                        const sendersList = [
                                            { id: 1, name: 'John Doe Sender', contact: '+1-234-5678', address: '123 Sender St, City', email: 'john.sender@example.com', ref: 'SREF001', remarks: 'Preferred sender' },
                                            { id: 2, name: 'Jane Smith Sender', contact: '+1-876-5432', address: '456 Sender Ave, Town', email: 'jane.sender@example.com', ref: 'SREF002', remarks: 'Regular sender' }
                                        ];
                                        const receiversList = [
                                            { id: 1, name: 'Alice Receiver', contact: '+1-111-2222', address: '789 Receiver Blvd, Village', email: 'alice.receiver@example.com', ref: 'RREF001', remarks: 'Main receiver' },
                                            { id: 2, name: 'Bob Receiver', contact: '+1-333-4444', address: '101 Receiver Rd, Hamlet', email: 'bob.receiver@example.com', ref: 'RREF002', remarks: 'Secondary receiver' }
                                        ];
                                        const typePrefix = formData.senderType === 'receiver' ? 'Receiver' : 'Sender';
                                        const fieldPrefix = formData.senderType === 'sender' ? 'sender' : 'receiver';
                                        return (
                                            <>
                                                <FormControl component="fieldset" error={!!errors.senderType}>
                                                    <Typography variant="subtitle1" fontWeight="bold" color="#f58220" gutterBottom>
                                                        Select Type
                                                    </Typography>
                                                    <RadioGroup
                                                        name="senderType"
                                                        value={formData.senderType}
                                                        onChange={handleChange}
                                                        sx={{ flexDirection: 'row', gap: 3, mb: 1 }}
                                                        defaultValue="sender"
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
                                                        handleChange(e);
                                                        if (value) {
                                                            const list = formData.senderType === 'sender' ? sendersList : receiversList;
                                                            const item = list.find(l => l.id.toString() === value);
                                                            if (item) {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    [`${fieldPrefix}Name`]: item.name || '',
                                                                    [`${fieldPrefix}Contact`]: item.contact || '',
                                                                    [`${fieldPrefix}Address`]: item.address || '',
                                                                    [`${fieldPrefix}Email`]: item.email || '',
                                                                    [`${fieldPrefix}Ref`]: item.ref || '',
                                                                    [`${fieldPrefix}Remarks`]: item.remarks || '',
                                                                }));
                                                            }
                                                        } else {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                [`${fieldPrefix}Name`]: '',
                                                                [`${fieldPrefix}Contact`]: '',
                                                                [`${fieldPrefix}Address`]: '',
                                                                [`${fieldPrefix}Email`]: '',
                                                                [`${fieldPrefix}Ref`]: '',
                                                                [`${fieldPrefix}Remarks`]: '',
                                                            }));
                                                        }
                                                    }}
                                                    renderValue={(selected) => {
                                                        if (!selected) return `Select ${typePrefix}`;
                                                        const list = formData.senderType === 'sender' ? sendersList : receiversList;
                                                        const item = list.find(l => l.id.toString() === selected);
                                                        return item ? item.name : `Select ${typePrefix}`;
                                                    }}
                                                >
                                                    <MenuItem value="">Select from List</MenuItem>
                                                    {(formData.senderType === 'sender' ? sendersList : receiversList).map((item) => (
                                                        <MenuItem key={item.id} value={item.id.toString()}>
                                                            {item.name}
                                                        </MenuItem>
                                                    ))}
                                                </CustomSelect>
                                                <Stack spacing={2}>
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                        <CustomTextField
                                                            label={`${typePrefix} Name`}
                                                            name={`${fieldPrefix}Name`}
                                                            value={formData[`${fieldPrefix}Name`] || ""}
                                                            onChange={handleChange}
                                                            error={!!errors[`${fieldPrefix}Name`]}
                                                            helperText={errors[`${fieldPrefix}Name`]}
                                                            required
                                                        />
                                                        <CustomTextField
                                                            label={`${typePrefix} Contact`}
                                                            name={`${fieldPrefix}Contact`}
                                                            value={formData[`${fieldPrefix}Contact`] || ""}
                                                            onChange={handleChange}
                                                            error={!!errors[`${fieldPrefix}Contact`]}
                                                            helperText={errors[`${fieldPrefix}Contact`]}
                                                        />
                                                    </Box>
                                                    <CustomTextField
                                                        label={`${typePrefix} Address`}
                                                        name={`${fieldPrefix}Address`}
                                                        value={formData[`${fieldPrefix}Address`] || ""}
                                                        onChange={handleChange}
                                                        error={!!errors[`${fieldPrefix}Address`]}
                                                        helperText={errors[`${fieldPrefix}Address`]}
                                                        multiline
                                                        rows={2}
                                                    />
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                        <CustomTextField
                                                            label={`${typePrefix} Email`}
                                                            name={`${fieldPrefix}Email`}
                                                            value={formData[`${fieldPrefix}Email`] || ""}
                                                            onChange={handleChange}
                                                            error={!!errors[`${fieldPrefix}Email`]}
                                                            helperText={errors[`${fieldPrefix}Email`]}
                                                        />
                                                        <CustomTextField
                                                            label={`${typePrefix} Ref`}
                                                            name={`${fieldPrefix}Ref`}
                                                            value={formData[`${fieldPrefix}Ref`] || ""}
                                                            onChange={handleChange}
                                                            error={!!errors[`${fieldPrefix}Ref`]}
                                                            helperText={errors[`${fieldPrefix}Ref`]}
                                                        />
                                                    </Box>
                                                    <CustomTextField
                                                        label={`${typePrefix} Remarks`}
                                                        name={`${fieldPrefix}Remarks`}
                                                        value={formData[`${fieldPrefix}Remarks`] || ""}
                                                        onChange={handleChange}
                                                        error={!!errors[`${fieldPrefix}Remarks`]}
                                                        helperText={errors[`${fieldPrefix}Remarks`]}
                                                        multiline
                                                        rows={2}
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
            "& .MuiAccordionSummary-content": {
                fontWeight: "bold",
                color: expanded.has("panel2") ? "#fff" : "#f58220",
            },
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
                        {(formData.senderType === 'sender' ? formData.receivers : formData.senders).map((rec, i) => {
                            const totalItems = (rec.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
                            const remainingItems = (rec.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.remainingItems || 0) || 0), 0);
                            return (
                                <Chip
                                    key={i}
                                    label={`${
                                        (formData.senderType === 'sender' ? rec.receiverName : rec.senderName) ||
                                        (formData.senderType === 'sender' ? `Receiver ${i + 1}` : `Sender ${i + 1}`)
                                    } (Items: ${totalItems} / Remaining: ${remainingItems})`}
                                    variant={rec.fullPartial === 'Partial' ? "filled" : "outlined"}
                                    color={rec.fullPartial === 'Partial' ? "warning" : "primary"}
                                />
                            );
                        })}
                    </Stack>
                </Stack>
            )}
            {(() => {
                const currentList = formData.senderType === 'sender' ? formData.receivers : formData.senders;
                const isSenderMode = formData.senderType === 'receiver';
                const typePrefix = isSenderMode ? 'Sender' : 'Receiver';
                const handleChangeFn = isSenderMode ? handleSenderChange : handleReceiverChange;
                const handleShippingChangeFn = isSenderMode ? handleSenderShippingChange : handleReceiverShippingChange;
                const handlePartialChangeFn = isSenderMode ? handleSenderPartialChange : handleReceiverPartialChange;
                const addShippingFn = isSenderMode ? addSenderShipping : addReceiverShipping;
                const duplicateShippingFn = isSenderMode ? duplicateSenderShipping : duplicateReceiverShipping;
                const removeShippingFn = isSenderMode ? removeSenderShipping : removeReceiverShipping;
                const listKey = isSenderMode ? 'senders' : 'receivers';
                const errorsPrefix = isSenderMode ? `senders[${0}]` : `receivers[${0}]`;
                const disabledPrefix = isSenderMode ? `senders[${0}]` : `receivers[${0}]`;
                const addRecFn = isSenderMode ? addSender : addReceiver;

                const renderRecForm = (rec, i) => {
                    const recErrorsPrefix = isSenderMode ? `senders[${i}]` : `receivers[${i}]`;
                    const recDisabledPrefix = isSenderMode ? `senders[${i}]` : `receivers[${i}]`;
                    const emptySd = {
                        pickupLocation: '',
                        category: '',
                        subcategory: '',
                        type: '',
                        totalNumber: '',
                        weight: '',
                        deliveryAddress: '',
                        itemRef: `REF-${i + 1}-1`
                    };

                    const handleEmptySdChange = (field, value) => {
                        addShippingFn(i);
                        handleShippingChangeFn(i, 0, field, value);
                    };

                    const renderShippingSection = () => (
                        <Stack spacing={2}>
                            <Typography variant="subtitle1" color="primary" fontWeight={"bold"} mb={1}>
                                Shipping Details
                            </Typography>
                            {/* ETA, ETD, Shipping Line at receiver/sender level */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                    alignItems: 'stretch',
                                }}
                            >
                                <CustomTextField
                                    label="ETA"
                                    type="date"
                                    value={rec.eta || ""}
                                    onChange={(e) => handleChangeFn(i, 'eta')(e)}
                                    InputLabelProps={{ shrink: true }}
                                    error={!!errors[`${listKey}[${i}].eta`]}
                                    helperText={errors[`${listKey}[${i}].eta`]}
                                    required
                                    disabled={isFieldDisabled(`${recDisabledPrefix}.eta`)}
                                />
                                <CustomTextField
                                    label="ETD"
                                    type="date"
                                    value={rec.etd || ""}
                                    onChange={(e) => handleChangeFn(i, 'etd')(e)}
                                    InputLabelProps={{ shrink: true }}
                                    error={!!errors[`${listKey}[${i}].etd`]}
                                    helperText={errors[`${listKey}[${i}].etd`]}
                                    required
                                    disabled={isFieldDisabled(`${recDisabledPrefix}.etd`)}
                                />
                            </Box>
                            {/* <CustomTextField
                                label="Shipping Line"
                                value={rec.shippingLine || ""}
                                onChange={(e) => handleChangeFn(i, 'shippingLine')(e)}
                                error={!!errors[`${listKey}[${i}].shippingLine`]}
                                helperText={errors[`${listKey}[${i}].shippingLine`]}
                                required
                                fullWidth
                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingLine`)}
                            /> */}
                            {/* Shipping Details Forms */}
                            {(rec.shippingDetails || []).length === 0 ? (
                                <Box sx={{ p: 1.5, border: 1, borderColor: "grey.200", borderRadius: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="body2" color="primary" fontWeight="bold">
                                            Shipping Detail 1
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            {!isEditMode && (
                                                <>
                                                    <IconButton
                                                        onClick={() => duplicateShippingFn(i, 0)}
                                                        size="small"
                                                        title="Duplicate"
                                                    >
                                                        <CopyIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => removeShippingFn(i, 0)}
                                                        size="small"
                                                        title="Delete"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                        </Stack>
                                    </Stack>
                                    <Stack spacing={1.5}>
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                            <CustomTextField
                                                label="Pickup Location"
                                                value={emptySd.pickupLocation}
                                                onChange={(e) => handleEmptySdChange('pickupLocation', e.target.value)}
                                                error={!!errors[`${listKey}[${i}].shippingDetails[0].pickupLocation`]}
                                                helperText={errors[`${listKey}[${i}].shippingDetails[0].pickupLocation`]}
                                                required
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].pickupLocation`)}
                                            />
                                            <CustomSelect
                                                label="Category"
                                                value={emptySd.category}
                                                onChange={(e) => handleEmptySdChange('category', e.target.value)}
                                                error={!!errors[`${listKey}[${i}].shippingDetails[0].category`]}
                                                helperText={errors[`${listKey}[${i}].shippingDetails[0].category`]}
                                                required
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].category`)}
                                                renderValue={(selected) => selected || "Select Category"}
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
                                                value={emptySd.subcategory}
                                                onChange={(e) => handleEmptySdChange('subcategory', e.target.value)}
                                                error={!!errors[`${listKey}[${i}].shippingDetails[0].subcategory`]}
                                                helperText={errors[`${listKey}[${i}].shippingDetails[0].subcategory`]}
                                                required
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].subcategory`)}
                                                renderValue={(selected) => selected || "Select Subcategory"}
                                            >
                                                <MenuItem value="">Select Subcategory</MenuItem>
                                                {(categorySubMap[emptySd.category] || []).map((sc) => (
                                                    <MenuItem key={sc} value={sc}>
                                                        {sc}
                                                    </MenuItem>
                                                ))}
                                            </CustomSelect>
                                            <CustomSelect
                                                label="Type"
                                                value={emptySd.type}
                                                onChange={(e) => handleEmptySdChange('type', e.target.value)}
                                                error={!!errors[`${listKey}[${i}].shippingDetails[0].type`]}
                                                helperText={errors[`${listKey}[${i}].shippingDetails[0].type`]}
                                                required
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].type`)}
                                                renderValue={(selected) => selected || "Select Type"}
                                            >
                                                <MenuItem value="">Select Unit</MenuItem>
                                                {types.slice(1).map((t) => (
                                                    <MenuItem key={t} value={t}>
                                                        {t}
                                                    </MenuItem>
                                                ))}
                                            </CustomSelect>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                            <CustomTextField
                                                label="Total Number"
                                                value={emptySd.totalNumber}
                                                onChange={(e) => handleEmptySdChange('totalNumber', e.target.value)}
                                                error={!!errors[`${listKey}[${i}].shippingDetails[0].totalNumber`]}
                                                helperText={errors[`${listKey}[${i}].shippingDetails[0].totalNumber`]}
                                                required
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].totalNumber`)}
                                            />
                                            <CustomTextField
                                                label="Weight"
                                                value={emptySd.weight}
                                                onChange={(e) => handleEmptySdChange('weight', e.target.value)}
                                                error={!!errors[`${listKey}[${i}].shippingDetails[0].weight`]}
                                                helperText={errors[`${listKey}[${i}].shippingDetails[0].weight`]}
                                                required
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].weight`)}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                            <CustomTextField
                                                label="Delivery Address"
                                                value={emptySd.deliveryAddress}
                                                onChange={(e) => handleEmptySdChange('deliveryAddress', e.target.value)}
                                                error={!!errors[`${listKey}[${i}].shippingDetails[0].deliveryAddress`]}
                                                helperText={errors[`${listKey}[${i}].shippingDetails[0].deliveryAddress`]}
                                                fullWidth
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].deliveryAddress`)}
                                            />
                                            <CustomTextField label="Ref Number" value={emptySd.itemRef} disabled={true} />
                                        </Box>
                                    </Stack>
                                </Box>
                            ) : (
                                (rec.shippingDetails || []).map((sd, j) => (
                                    <Box key={j} sx={{ p: 1.5, border: 1, borderColor: "grey.200", borderRadius: 1 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="body2" color="primary" fontWeight="bold">
                                                Shipping Detail {j + 1}
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                {!isEditMode && (
                                                    <>
                                                        <IconButton
                                                            onClick={() => duplicateShippingFn(i, j)}
                                                            size="small"
                                                            title="Duplicate"
                                                        >
                                                            <CopyIcon />
                                                        </IconButton>
                                                        {(rec.shippingDetails || []).length > 1 && (
                                                            <IconButton
                                                                onClick={() => removeShippingFn(i, j)}
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
                                        <Stack spacing={1.5}>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                <CustomTextField
                                                    label="Pickup Location"
                                                    value={sd.pickupLocation || ""}
                                                    onChange={(e) => handleShippingChangeFn(i, j, 'pickupLocation')(e)}
                                                    error={!!errors[`${listKey}[${i}].shippingDetails[${j}].pickupLocation`]}
                                                    helperText={errors[`${listKey}[${i}].shippingDetails[${j}].pickupLocation`]}
                                                    required
                                                    disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[${j}].pickupLocation`)}
                                                />
                                                <CustomSelect
                                                    label="Category"
                                                    value={sd.category || ""}
                                                    onChange={(e) => handleShippingChangeFn(i, j, 'category')(e)}
                                                    error={!!errors[`${listKey}[${i}].shippingDetails[${j}].category`]}
                                                    helperText={errors[`${listKey}[${i}].shippingDetails[${j}].category`]}
                                                    required
                                                    disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[${j}].category`)}
                                                    renderValue={(selected) => selected || "Select Category"}
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
                                                    value={sd.subcategory || ""}
                                                    onChange={(e) => handleShippingChangeFn(i, j, 'subcategory')(e)}
                                                    error={!!errors[`${listKey}[${i}].shippingDetails[${j}].subcategory`]}
                                                    helperText={errors[`${listKey}[${i}].shippingDetails[${j}].subcategory`]}
                                                    required
                                                    disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[${j}].subcategory`)}
                                                    renderValue={(selected) => selected || "Select Subcategory"}
                                                >
                                                    <MenuItem value="">Select Subcategory</MenuItem>
                                                    {(categorySubMap[sd.category] || []).map((sc) => (
                                                        <MenuItem key={sc} value={sc}>
                                                            {sc}
                                                        </MenuItem>
                                                    ))}
                                                </CustomSelect>
                                                <CustomSelect
                                                    label="Type"
                                                    value={sd.type || ""}
                                                    onChange={(e) => handleShippingChangeFn(i, j, 'type')(e)}
                                                    error={!!errors[`${listKey}[${i}].shippingDetails[${j}].type`]}
                                                    helperText={errors[`${listKey}[${i}].shippingDetails[${j}].type`]}
                                                    required
                                                    disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[${j}].type`)}
                                                    renderValue={(selected) => selected || "Select Type"}
                                                >
                                                    <MenuItem value="">Select Unit</MenuItem>
                                                    {types.slice(1).map((t) => (
                                                        <MenuItem key={t} value={t}>
                                                            {t}
                                                        </MenuItem>
                                                    ))}
                                                </CustomSelect>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                <CustomTextField
                                                    label="Total Number"
                                                    value={sd.totalNumber || ""}
                                                    onChange={(e) => handleShippingChangeFn(i, j, 'totalNumber')(e)}
                                                    error={!!errors[`${listKey}[${i}].shippingDetails[${j}].totalNumber`]}
                                                    helperText={errors[`${listKey}[${i}].shippingDetails[${j}].totalNumber`]}
                                                    required
                                                    disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[${j}].totalNumber`)}
                                                />
                                                <CustomTextField
                                                    label="Weight"
                                                    value={sd.weight || ""}
                                                    onChange={(e) => handleShippingChangeFn(i, j, 'weight')(e)}
                                                    error={!!errors[`${listKey}[${i}].shippingDetails[${j}].weight`]}
                                                    helperText={errors[`${listKey}[${i}].shippingDetails[${j}].weight`]}
                                                    required
                                                    disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[${j}].weight`)}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                <CustomTextField
                                                    label="Delivery Address"
                                                    value={sd.deliveryAddress || ""}
                                                    onChange={(e) => handleShippingChangeFn(i, j, 'deliveryAddress')(e)}
                                                    error={!!errors[`${listKey}[${i}].shippingDetails[${j}].deliveryAddress`]}
                                                    helperText={errors[`${listKey}[${i}].shippingDetails[${j}].deliveryAddress`]}
                                                    fullWidth
                                                    disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[${j}].deliveryAddress`)}
                                                />
                                                <CustomTextField label="Ref Number" value={sd.itemRef || `REF-${i + 1}-${j + 1}`} disabled={true} />
                                            </Box>
                                        </Stack>
                                    </Box>
                                ))
                            )}
                            <Stack direction="row" spacing={1} sx={{justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => addShippingFn(i)}
                                >
                                    Add Shipping Detail
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => handleSaveShipping?.(i)} // Define handleSaveShipping in parent component if needed
                                >
                                    Save
                                </Button>
                            </Stack>
                        </Stack>
                    );

                    return (
                        <Box key={i} sx={{ p: 2, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="subtitle1" color="primary" fontWeight={"bold"}>
                                    {typePrefix} {i + 1}
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
                            {/* Show validation warnings if present */}
                            {rec.validationWarnings && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    {Object.entries(rec.validationWarnings)
                                        .map(([key, msg]) => `${snakeToCamel(key).replace(/([A-Z])/g, ' $1').trim()}: ${msg}`)
                                        .join('; ')}
                                </Alert>
                            )}
                            {/* Dynamic: Basic Info */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                    alignItems: 'stretch',
                                }}
                            >
                                <CustomTextField
                                    label={`${typePrefix} Name`}
                                    value={isSenderMode ? rec.senderName : rec.receiverName}
                                    onChange={handleChangeFn(i, isSenderMode ? 'senderName' : 'receiverName')}
                                    error={!!errors[`${listKey}[${i}].${isSenderMode ? 'senderName' : 'receiverName'}`]}
                                    helperText={errors[`${listKey}[${i}].${isSenderMode ? 'senderName' : 'receiverName'}`]}
                                    required
                                    disabled={isFieldDisabled(`${recDisabledPrefix}.${isSenderMode ? 'senderName' : 'receiverName'}`)}
                                />
                                <CustomTextField
                                    label={`${typePrefix} Contact`}
                                    value={isSenderMode ? rec.senderContact : rec.receiverContact}
                                    onChange={handleChangeFn(i, isSenderMode ? 'senderContact' : 'receiverContact')}
                                    error={!!errors[`${listKey}[${i}].${isSenderMode ? 'senderContact' : 'receiverContact'}`]}
                                    helperText={errors[`${listKey}[${i}].${isSenderMode ? 'senderContact' : 'receiverContact'}`]}
                                    disabled={isFieldDisabled(`${recDisabledPrefix}.${isSenderMode ? 'senderContact' : 'receiverContact'}`)}
                                />
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    py: 2,
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                    alignItems: 'stretch',
                                }}
                            >
                                <CustomTextField
                                    label={`${typePrefix} Address`}
                                    value={isSenderMode ? rec.senderAddress : rec.receiverAddress}
                                    onChange={handleChangeFn(i, isSenderMode ? 'senderAddress' : 'receiverAddress')}
                                    error={!!errors[`${listKey}[${i}].${isSenderMode ? 'senderAddress' : 'receiverAddress'}`]}
                                    helperText={errors[`${listKey}[${i}].${isSenderMode ? 'senderAddress' : 'receiverAddress'}`]}
                                    disabled={isFieldDisabled(`${recDisabledPrefix}.${isSenderMode ? 'senderAddress' : 'receiverAddress'}`)}
                                />
                                <CustomTextField
                                    label={`${typePrefix} Email`}
                                    value={isSenderMode ? rec.senderEmail : rec.receiverEmail}
                                    onChange={handleChangeFn(i, isSenderMode ? 'senderEmail' : 'receiverEmail')}
                                    error={!!errors[`${listKey}[${i}].${isSenderMode ? 'senderEmail' : 'receiverEmail'}`]}
                                    helperText={errors[`${listKey}[${i}].${isSenderMode ? 'senderEmail' : 'receiverEmail'}`]}
                                    disabled={isFieldDisabled(`${recDisabledPrefix}.${isSenderMode ? 'senderEmail' : 'receiverEmail'}`)}
                                />
                            </Box>
                            {renderShippingSection()}
                            {/* <CustomTextField
                                label="Remarks"
                                value={rec.remarks || ""}
                                onChange={handleChangeFn(i, 'remarks')}
                                multiline
                                rows={2}
                                fullWidth
                                disabled={isFieldDisabled(`${recDisabledPrefix}.remarks`)}
                            /> */}
                        </Box>
                    );
                };

                const handleEmptyRecChange = (field, value) => {
                    addRecFn();
                    const fn = isSenderMode ? handleSenderChange : handleReceiverChange;
                    fn(0, field, value);
                };

                const emptyRec = {
                    [isSenderMode ? 'senderName' : 'receiverName']: '',
                    [isSenderMode ? 'senderContact' : 'receiverContact']: '',
                    [isSenderMode ? 'senderAddress' : 'receiverAddress']: '',
                    [isSenderMode ? 'senderEmail' : 'receiverEmail']: '',
                    eta: '',
                    etd: '',
                    shippingLine: '',
                    shippingDetails: []
                };

                if (currentList.length === 0) {
                    // Render empty receiver/sender form
                    const emptyI = 0;
                    return renderRecForm(emptyRec, emptyI).props.children[0].props.children; // Hacky, but renders the inner Box without outer key/Box
                } else {
                    return currentList.map((rec, i) => renderRecForm(rec, i));
                }
            })()}
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
                                                value={formData.dropMethod || ""}
                                                onChange={handleChange}
                                                error={!!errors.dropMethod}
                                                renderValue={(selected) => selected || "Select Drop Method"}
                                            >
                                                <MenuItem value="">Select Drop Method</MenuItem>
                                                <MenuItem value="Drop-Off">Drop-Off</MenuItem>
                                                <MenuItem value="RGSL Pickup">RGSL Pickup</MenuItem>
                                            </CustomSelect>
                                            <Stack spacing={2}>
                                                <CustomTextField
                                                    label="Person Name"
                                                    name="dropoffName"
                                                    value={formData.dropoffName}
                                                    onChange={handleChange}
                                                    error={!!errors.dropoffName}
                                                    helperText={errors.dropoffName}
                                                    required={formData.dropMethod === 'Drop-Off'}
                                                />
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label="CNIC/ID"
                                                        name="dropOffCnic"
                                                        value={formData.dropOffCnic}
                                                        onChange={handleChange}
                                                        error={!!errors.dropOffCnic}
                                                        helperText={errors.dropOffCnic}
                                                        required={formData.dropMethod === 'Drop-Off'}
                                                    />
                                                    <CustomTextField
                                                        label="Mobile"
                                                        name="dropOffMobile"
                                                        value={formData.dropOffMobile}
                                                        onChange={handleChange}
                                                        error={!!errors.dropOffMobile}
                                                        helperText={errors.dropOffMobile}
                                                        required={formData.dropMethod === 'Drop-Off'}
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
                                    )}

                                    {formData.transportType === 'Collection' && (
                                        <Stack spacing={2}>
                                            <Typography variant="h6" color="#f58220" gutterBottom>
                                                🚛 Collection Details
                                            </Typography>
                                            <CustomSelect
                                                label="Collection Method"
                                                name="collectionMethod"
                                                value={formData.collectionMethod || ""}
                                                onChange={handleChange}
                                                error={!!errors.collectionMethod}
                                                renderValue={(selected) => selected || "Select Collection Method"}
                                            >
                                                <MenuItem value="">Select Collection Method</MenuItem>
                                                <MenuItem value="Delivered by RGSL">Delivered by RGSL</MenuItem>
                                                <MenuItem value="Collected by Client">Collected by Client</MenuItem>
                                            </CustomSelect>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                <CustomSelect
                                                    label="Full / Partial"
                                                    name="collection_scope"
                                                    value={formData.collection_scope || "Partial"}
                                                    onChange={handleChange}
                                                    error={!!errors.collection_scope}
                                                    helperText={errors.collection_scope}
                                                >
                                                    <MenuItem value="Full">Full</MenuItem>
                                                    <MenuItem value="Partial">Partial</MenuItem>
                                                </CustomSelect>
                                                {formData.collection_scope === "Partial" && (
                                                    <CustomTextField
                                                        label="Qty Delivered"
                                                        name="qtyDelivered"
                                                        value={formData.qtyDelivered || ""}
                                                        onChange={handleChange}
                                                        error={!!errors.qtyDelivered}
                                                        helperText={errors.qtyDelivered}
                                                    />
                                                )}
                                            </Box>
                                            <Stack spacing={2}>
                                                <CustomTextField
                                                    label="Receiver Name / CNIC/ID"
                                                    name="clientReceiverName"
                                                    value={formData.clientReceiverName}
                                                    onChange={handleChange}
                                                    error={!!errors.clientReceiverName}
                                                    helperText={errors.clientReceiverName}
                                                    required={formData.collectionMethod === 'Collected by Client'}
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
                                                    />
                                                    <CustomTextField
                                                        label="Receiver Mobile"
                                                        name="clientReceiverMobile"
                                                        value={formData.clientReceiverMobile}
                                                        onChange={handleChange}
                                                        error={!!errors.clientReceiverMobile}
                                                        helperText={errors.clientReceiverMobile}
                                                        required={formData.collectionMethod === 'Collected by Client'}
                                                    />
                                                </Box>
                                                <CustomTextField
                                                    label="Plate No (optional)"
                                                    name="plateNo"
                                                    value={formData.plateNo}
                                                    onChange={handleChange}
                                                    error={!!errors.plateNo}
                                                    helperText={errors.plateNo}
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
                                                value={formData.thirdPartyTransport || ""}
                                                onChange={handleChange}
                                                error={!!errors.thirdPartyTransport}
                                                helperText={errors.thirdPartyTransport}
                                                renderValue={(selected) => selected || "Select Company"}
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
                                                />
                                                <CustomTextField
                                                    label="Driver Contact number"
                                                    name="driverContact"
                                                    value={formData.driverContact}
                                                    onChange={handleChange}
                                                    error={!!errors.driverContact}
                                                    helperText={errors.driverContact}
                                                    required
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
                                                />
                                                <CustomTextField
                                                    label="Driver Pickup Location"
                                                    name="driverPickupLocation"
                                                    value={formData.driverPickupLocation}
                                                    onChange={handleChange}
                                                    error={!!errors.driverPickupLocation}
                                                    helperText={errors.driverPickupLocation}
                                                    required
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
                                5. Attachments
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