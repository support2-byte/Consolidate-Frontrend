// import { useState, useEffect, useCallback, useMemo } from "react";
// import {
//     Box,
//     Paper,
//     Typography,
//     Button,
//     TextField,
//     Stack,
//     Select,
//     MenuItem,
//     FormControl,
//     InputLabel,
//     Divider,
//     Chip,
//     Accordion,
//     AccordionSummary,
//     AccordionDetails,
//     IconButton,
//     Snackbar,
//     Alert,
//     RadioGroup,
//     Radio,
//     FormControlLabel,
//     CircularProgress,
//     Autocomplete,
//     Checkbox,
//     ListItemText,
//     FormGroup,
//     FormControlLabel as CheckboxFormControlLabel
// } from "@mui/material";
// import Dialog from "@mui/material/Dialog";
// import DialogContent from "@mui/material/DialogContent";
// import DialogTitle from "@mui/material/DialogTitle";
// import CloseIcon from "@mui/icons-material/Close";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// import DownloadIcon from "@mui/icons-material/Download";
// import AddIcon from "@mui/icons-material/Add";
// import DeleteIcon from "@mui/icons-material/Delete";
// import CopyIcon from "@mui/icons-material/ContentCopy"; // For duplicate button
// import { useNavigate, useLocation } from "react-router-dom";
// import { api } from "../../api";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// // Custom TextField with error support
// const CustomTextField = ({ disabled, ...props }) => (
//     <TextField
//         {...props}
//         disabled={disabled}
//         size="medium"
//         error={props.error}
//         helperText={props.helperText}
//         sx={{
//             flex: 1,
//             minWidth: 0,
//             "& .MuiOutlinedInput-root": {
//                 borderRadius: 2,
//                 transition: "all 0.3s ease",
//                 backgroundColor: "#fff",
//                 "& fieldset": { borderColor: "#ddd" },
//                 "&:hover fieldset": { borderColor: "#f58220" },
//                 "&.Mui-focused fieldset": {
//                     borderColor: "#f58220",
//                     boxShadow: "0 0 8px rgba(245, 130, 32, 0.3)",
//                 },
//                 ...(props.error && { "& fieldset": { borderColor: "#d32f2f" } }),
//                 ...(disabled && { backgroundColor: "#f5f5f5", color: "#999" }),
//             },
//             "& .MuiInputLabel-root": {
//                 letterSpacing: 0.5,
//                 textTransform: "capitalize",
//                 color: "rgba(180, 174, 174, 1)",
//                 ...(props.error && { color: "#d32f2f" }),
//                 ...(disabled && { color: "#999" }),
//             },
//         }}
//     />
// );

// const CustomSelect = ({ label, name, value, onChange, children, sx: selectSx, error, disabled, required = false, renderValue }) => (
//     <FormControl size="medium" sx={{ flex: 1, minWidth: 0, ...selectSx, background: "#fff" }} error={error} required={required}>
//         <InputLabel sx={{ color: "rgba(180, 174, 174, 1)", ...(disabled && { color: "#999" }) }}>{label}</InputLabel>
//         <Select
//             label={label}
//             name={name}
//             value={value}
//             onChange={onChange}
//             disabled={disabled}
//             size="medium"
//             renderValue={renderValue}
//             sx={{
//                 flex: 1,
//                 minWidth: 0,
//                 "& .MuiOutlinedInput-root": {
//                     borderRadius: 2,
//                     transition: "all 0.3s ease",
//                     backgroundColor: "#fff",
//                     "& fieldset": { borderColor: "#ddd" },
//                     "&:hover fieldset": { borderColor: "#f58220" },
//                     "&.Mui-focused fieldset": {
//                         borderColor: "#f58220",
//                         boxShadow: "0 0 8px rgba(245, 130, 32, 0.3)",
//                     },
//                     ...(error && { "& fieldset": { borderColor: "#d32f2f" } }),
//                     ...(disabled && { backgroundColor: "#f5f5f5", color: "#999" }),
//                 },
//                 "& .MuiInputLabel-root": {
//                     letterSpacing: 0.5,
//                     textTransform: "capitalize",
//                     color: "rgba(180, 174, 174, 1)",
//                     ...(error && { color: "#d32f2f" }),
//                     ...(disabled && { color: "#999" }),
//                 },
//             }}>
//             {children}
//         </Select>
//     </FormControl>
// );
// const OrderForm = () => {
//     const [previewOpen, setPreviewOpen] = useState(false);
//     const [previewSrc, setPreviewSrc] = useState('')
//     const location = useLocation();
//     const navigate = useNavigate();
//     const [expanded, setExpanded] = useState(new Set(["panel1"]));
//     const [containers, setContainers] = useState([]); // For selectedContainers multi-select
//     const [loading, setLoading] = useState(false);
//     const [loadingContainers, setLoadingContainers] = useState(false);
//     const [categories, setCategories] = useState([]);
//     const orderId = location.state?.orderId;
//     const [selectedOrder, setSelectedOrder] = useState(null);
//     const [isEditMode, setIsEditMode] = useState(!!orderId);
//     // console.log('Order ID from state:', orderId);
//     // Snackbar state for error/success messages
//     const [snackbar, setSnackbar] = useState({
//         open: false,
//         message: "",
//         severity: "info",
//     });
//     // Validation errors state
//     const [errors, setErrors] = useState({});
//     const initialShippingDetail = {
//         pickupLocation: "",
//         category: '',
//         subcategory: '',
//         type: '',
//         deliveryAddress: "",
//         totalNumber: "",
//         weight: "",
//         remainingItems: ""
//     };
//     const initialSenderObject = {
//         senderName: '',
//         senderContact: '',
//         senderAddress: '',
//         senderEmail: '',
//         eta: '',
//         etd: '',
//         shippingLine: '',
//         shippingDetails: [],
//         fullPartial: '',
//         qtyDelivered: '',
//         status: '',
//         remarks: '',
//     };
//     const initialReceiver = {
//         receiverName: "",
//         receiverContact: "",
//         receiverAddress: "",
//         receiverEmail: "",
//         eta: '',
//         etd: '',
//         shippingLine: '',
//         shippingDetails: [],
//         fullPartial: "",
//         qtyDelivered: "",
//         status: "Created",
//         remarks: "",
//         isNew: false
//     };
//     const [formData, setFormData] = useState({
//         // Core orders fields
//         bookingRef: "",
//         rglBookingNumber: "",
//         placeOfLoading: "",
//         pointOfOrigin: "",
//         finalDestination: "",
//         placeOfDelivery: "",
//         orderRemarks: "",
//         attachments: [],
//         // Owner fields (both sender and receiver)
//         senderName: "",
//         senderContact: "",
//         senderAddress: "",
//         senderEmail: "",
//         senderRef: "",
//         senderRemarks: "",
//         receiverName: "",
//         receiverContact: "",
//         receiverAddress: "",
//         receiverEmail: "",
//         receiverRef: "",
//         receiverRemarks: "",
//         // Senders array
//         senders: [{ ...initialSenderObject, shippingDetails: [], isNew: true }], // Updated: Init with one empty
//         // Receivers array with nested shippingDetails
//         receivers: [{ ...initialReceiver, shippingDetails: [], isNew: true }], // Updated: Init with one empty
//         // Computed globals
//         globalTotalItems: 0,
//         globalRemainingItems: 0,
//         // Transport fields
//         transportType: "",
//         thirdPartyTransport: "",
//         driverName: "",
//         driverContact: "",
//         driverNic: "",
//         driverPickupLocation: "",
//         truckNumber: "",
//         dropMethod: "",
//         dropoffName: "",
//         dropOffCnic: "",
//         dropOffMobile: "",
//         plateNo: "",
//         dropDate: "",
//         collectionMethod: "",
//         collection_scope: "Partial",
//         fullPartial: "", // Deprecated
//         qtyDelivered: "", // Deprecated
//         clientReceiverName: "",
//         clientReceiverId: "",
//         clientReceiverMobile: "",
//         deliveryDate: "",
//         gatepass: [],
//         senderType: 'sender',
//         selectedSenderOwner: ''
//     });
//     // Editable fields in edit mode
//     const editableInEdit = [
//         'transportType', 'dropMethod', 'dropoffName', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate',
//         'collectionMethod', 'collection_scope', 'qtyDelivered', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate',
//         'thirdPartyTransport', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber',
//         // Per-receiver partials and shipping
//         'receivers[].fullPartial', 'receivers[].qtyDelivered', 'receivers[].shippingDetails[].totalNumber',
//         'senders[].fullPartial', 'senders[].qtyDelivered', 'senders[].shippingDetails[].totalNumber'
//     ];
//     // Required fields validation
//     const requiredFields = [
//         'bookingRef', 'rglBookingNumber', 'placeOfLoading', 'pointOfOrigin', 'finalDestination', 'placeOfDelivery', 'transportType'
//     ];
//     // Dummy data for categories and subcategories
//     const dummyCategories = ["Electronics", "Clothing", "Books"];
//     const categorySubMap = {
//         "Electronics": ["Smartphones", "Laptops", "Accessories"],
//         "Clothing": ["Men's Wear", "Women's Wear", "Kids Wear"],
//         "Books": ["Fiction", "Non-Fiction", "Technical"],
//     };
//     const types = ["Select Unit", "Unit 1", "Unit 2"];
//     const statuses = ["Created", "In Transit", "Delivered", "Cancelled"];
//     const places = ["Select Place", "Singapore", "Dubai", "Rotterdam", "Hamburg", "Karachi", "Dubai-Emirates"];
//     const companies = ["Select 3rd party company", "Company A", "Company B"];
//     // Helper to convert snake_case to camelCase
//     const snakeToCamel = (str) => str.replace(/(_[a-z])/g, g => g[1].toUpperCase());
//     // Helper to convert camelCase to snake_case
//     const camelToSnake = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();
//     // Compute global totals dynamically
//     useEffect(() => {
//         const items = formData.senderType === 'sender' ? formData.receivers : formData.senders;
//         let total = 0;
//         let remaining = 0;
//         items.forEach(rec => {
//             const recTotal = (rec.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
//             const recDelivered = parseInt(rec.qtyDelivered || 0) || 0;
//             const recRemaining = Math.max(0, recTotal - recDelivered);
//             total += recTotal;
//             remaining += recRemaining;
//         });
//         setFormData(prev => ({ ...prev, globalTotalItems: total, globalRemainingItems: remaining }));
//     }, [formData.senderType, formData.receivers, formData.senders]);
//     // Compute remaining items dep
//     const remainingDep = useMemo(() => {
//         const items = formData.senderType === 'sender' ? formData.receivers : formData.senders;
//         return items.flatMap(rec =>
//             (rec.shippingDetails || []).map(sd => `${sd.totalNumber || ''}-${rec.qtyDelivered || ''}-${rec.fullPartial || ''}`)
//         ).join(',');
//     }, [formData.senderType, formData.receivers, formData.senders]);
//     // Compute per-item remaining dynamically
//     useEffect(() => {
//         const listKey = formData.senderType === 'sender' ? 'receivers' : 'senders';
//         setFormData(prev => ({
//             ...prev,
//             [listKey]: prev[listKey].map(rec => {
//                 const shippingDetails = rec.shippingDetails || [];
//                 const recTotal = shippingDetails.reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
//                 const delivered = parseInt(rec.qtyDelivered || 0) || 0;
//                 const recRemaining = Math.max(0, recTotal - delivered);
//                 if (rec.fullPartial === 'Partial' && recTotal > 0) {
//                     const updatedDetails = shippingDetails.map(sd => {
//                         const sdTotal = parseInt(sd.totalNumber || 0) || 0;
//                         const sdRemaining = Math.round((sdTotal / recTotal) * recRemaining);
//                         return { ...sd, remainingItems: sdRemaining.toString() };
//                     });
//                     return { ...rec, shippingDetails: updatedDetails };
//                 } else {
//                     const updatedDetails = shippingDetails.map(sd => ({ ...sd, remainingItems: (parseInt(sd.totalNumber || 0) || 0).toString() }));
//                     return { ...rec, shippingDetails: updatedDetails };
//                 }
//             })
//         }));
//     }, [remainingDep, formData.senderType]);
//     const validateForm = () => {
//         const newErrors = {};
//         // Core required fields
//         const coreRequired = ['bookingRef', 'rglBookingNumber', 'pointOfOrigin', 'placeOfLoading', 'placeOfDelivery', 'finalDestination'];
//         coreRequired.forEach(field => {
//             if (!formData[field]?.trim()) {
//                 newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
//             }
//         });
//         // Validate owner name
//         const ownerNameKey = formData.senderType === 'sender' ? 'senderName' : 'receiverName';
//         if (!formData[ownerNameKey]?.trim()) {
//             newErrors[ownerNameKey] = 'Owner name is required';
//         }
//         // Validate senderType
//         if (!formData.senderType) {
//             newErrors.senderType = 'Sender Type is required';
//         }
//         // Dynamic validation for panel2
//         const isSenderMode = formData.senderType === 'receiver';
//         const items = isSenderMode ? formData.senders : formData.receivers;
//         const itemsKey = isSenderMode ? 'senders' : 'receivers';
//         const itemPrefix = isSenderMode ? 'Sender' : 'Receiver';
//         if (items.length === 0) {
//             newErrors[itemsKey] = `At least one ${itemPrefix.toLowerCase()} is required`;
//         } else {
//             items.forEach((item, i) => {
//                 const nameField = isSenderMode ? 'senderName' : 'receiverName';
//                 const contactField = isSenderMode ? 'senderContact' : 'receiverContact';
//                 const addressField = isSenderMode ? 'senderAddress' : 'receiverAddress';
//                 const emailField = isSenderMode ? 'senderEmail' : 'receiverEmail';
//                 if (!item[nameField]?.trim()) {
//                     newErrors[`${itemsKey}[${i}].${nameField}`] = `${itemPrefix} ${i + 1} name is required`;
//                 }
//                 if (!item[contactField]?.trim()) {
//                     newErrors[`${itemsKey}[${i}].${contactField}`] = `${itemPrefix} ${i + 1} contact is required`;
//                 }
//                 if (!item[addressField]?.trim()) {
//                     newErrors[`${itemsKey}[${i}].${addressField}`] = `${itemPrefix} ${i + 1} address is required`;
//                 }
//                 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//                 if (item[emailField] && !emailRegex.test(item[emailField])) {
//                     newErrors[`${itemsKey}[${i}].${emailField}`] = `Invalid ${itemPrefix.toLowerCase()} ${i + 1} email format`;
//                 }
//                 // if (!item.eta?.trim()) {
//                 //     newErrors[`${itemsKey}[${i}].eta`] = `ETA is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
//                 // }
//                 // if (!item.etd?.trim()) {
//                 //     newErrors[`${itemsKey}[${i}].etd`] = `ETD is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
//                 // }
//                 // if (!item.shippingLine?.trim()) {
//                 // newErrors[`${itemsKey}[${i}].shippingLine`] = `Shipping Line is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
//                 // }
//                 // Validate each shippingDetail
//                 const shippingDetails = item.shippingDetails || [];
//                 if (shippingDetails.length === 0) {
//                     newErrors[`${itemsKey}[${i}].shippingDetails`] = `At least one shipping detail is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
//                 } else {
//                     shippingDetails.forEach((sd, j) => {
//                         const shippingRequiredFields = ['pickupLocation', 'category', 'subcategory', 'type', 'deliveryAddress', 'totalNumber', 'weight'];
//                         shippingRequiredFields.forEach(field => {
//                             if (!sd[field]?.trim()) {
//                                 newErrors[`${itemsKey}[${i}].shippingDetails[${j}].${field}`] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required for shipping detail ${j + 1}`;
//                             }
//                         });
//                         const totalNum = parseInt(sd.totalNumber);
//                         if (isNaN(totalNum) || totalNum <= 0) {
//                             newErrors[`${itemsKey}[${i}].shippingDetails[${j}].totalNumber`] = `Total Number must be a positive number`;
//                         }
//                         if (sd.weight && (isNaN(parseFloat(sd.weight)) || parseFloat(sd.weight) <= 0)) {
//                             newErrors[`${itemsKey}[${i}].shippingDetails[${j}].weight`] = `Weight must be a positive number`;
//                         }
//                     });
//                 }
//                 // Validate full/partial
//                 if (item.fullPartial === 'Partial') {
//                     if (!item.qtyDelivered?.trim()) {
//                         newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered is required for partial ${itemPrefix.toLowerCase()} ${i + 1}`;
//                     } else {
//                         const del = parseInt(item.qtyDelivered);
//                         const recTotal = (item.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
//                         if (isNaN(del) || del <= 0) {
//                             newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered must be a positive number`;
//                         } else if (del > recTotal) {
//                             newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered (${del}) cannot exceed total number (${recTotal})`;
//                         }
//                     }
//                 }
//             });
//         }
//         // Transport validations (unchanged)
//         if (!formData.transportType) {
//             newErrors.transportType = 'Transport Type is required';
//         }
//         const anyPartial = items.some(item => item.fullPartial === 'Partial');
//         const showInbound = formData.finalDestination?.includes('Karachi');
//         const showOutbound = formData.placeOfLoading?.includes('Dubai');
//         if (showInbound && formData.transportType === 'Drop Off') {
//             if (!formData.dropDate?.trim()) {
//                 newErrors.dropDate = 'Drop Date is required';
//             }
//             if (formData.dropMethod === 'Drop-Off') {
//                 if (!formData.dropoffName?.trim()) {
//                     newErrors.dropoffName = 'Drop-Off Person Name is required';
//                 }
//                 if (!formData.dropOffCnic?.trim()) {
//                     newErrors.dropOffCnic = 'Drop-Off CNIC/ID is required';
//                 }
//                 if (!formData.dropOffMobile?.trim()) {
//                     newErrors.dropOffMobile = 'Drop-Off Mobile is required';
//                 }
//             }
//         }
//         if (showOutbound && formData.transportType === 'Collection') {
//             const requiresDeliveryDate = anyPartial || formData.collectionMethod === 'Collected by Client';
//             if (requiresDeliveryDate && !formData.deliveryDate?.trim()) {
//                 newErrors.deliveryDate = 'Delivery Date is required for partial delivery or client collection';
//             }
//             if (formData.collectionMethod === 'Collected by Client') {
//                 if (!formData.clientReceiverName?.trim()) {
//                     newErrors.clientReceiverName = 'Receiver Name is required';
//                 }
//                 if (!formData.clientReceiverId?.trim()) {
//                     newErrors.clientReceiverId = 'Receiver ID is required';
//                 }
//                 if (!formData.clientReceiverMobile?.trim()) {
//                     newErrors.clientReceiverMobile = 'Receiver Mobile is required';
//                 }
//             }
//         }
//         if (formData.transportType === 'Third Party') {
//             if (!formData.thirdPartyTransport?.trim()) {
//                 newErrors.thirdPartyTransport = '3rd party Transport Company is required';
//             }
//             if (!formData.driverName?.trim()) {
//                 newErrors.driverName = 'Driver Name is required';
//             }
//             if (!formData.driverContact?.trim()) {
//                 newErrors.driverContact = 'Driver Contact is required';
//             }
//             if (!formData.driverNic?.trim()) {
//                 newErrors.driverNic = 'Driver NIC is required';
//             }
//             if (!formData.driverPickupLocation?.trim()) {
//                 newErrors.driverPickupLocation = 'Driver Pickup Location is required';
//             }
//             if (!formData.truckNumber?.trim()) {
//                 newErrors.truckNumber = 'Truck Number is required';
//             }
//         }
//         // Email and mobile validations
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         const ownerEmailKey = formData.senderType === 'sender' ? 'senderEmail' : 'receiverEmail';
//         if (formData[ownerEmailKey] && !emailRegex.test(formData[ownerEmailKey])) {
//             newErrors[ownerEmailKey] = 'Invalid owner email format';
//         }
//         const mobileRegex = /^\d{10,15}$/;
//         if (formData.dropOffMobile && !mobileRegex.test(formData.dropOffMobile.replace(/\D/g, ''))) {
//             newErrors.dropOffMobile = 'Invalid mobile number';
//         }
//         if (formData.clientReceiverMobile && !mobileRegex.test(formData.clientReceiverMobile.replace(/\D/g, ''))) {
//             newErrors.clientReceiverMobile = 'Invalid mobile number';
//         }
//         setErrors(newErrors);
//         return Object.keys(newErrors).length === 0;
//     };
//     // Fetch containers on mount
//     useEffect(() => {
//         fetchContainers();
//         fetchCategories();
//         if (orderId) {
//             fetchOrder(orderId);
//         }
//     }, [orderId]);
//     // Auto-expand accordions with errors
//     useEffect(() => {
//         if (Object.keys(errors).length > 0) {
//             const panelsToExpand = new Set();
//             Object.keys(errors).forEach(key => {
//                 if (['senderName', 'senderContact', 'senderAddress', 'senderEmail', 'senderRef', 'senderRemarks', 'receiverName', 'receiverContact', 'receiverAddress', 'receiverEmail', 'receiverRef', 'receiverRemarks'].includes(key)) panelsToExpand.add('panel1');
//                 if (key.startsWith('receivers[') || key.startsWith('senders[')) panelsToExpand.add('panel2');
//                 if (['transportType', 'dropMethod', 'dropoffName', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate', 'collectionMethod', 'fullPartial', 'qtyDelivered', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber', 'thirdPartyTransport'].includes(key)) panelsToExpand.add('panel3');
//             });
//             setExpanded(prev => new Set([...prev, ...panelsToExpand]));
//         }
//     }, [errors]);
//     const fetchCategories = () => {
//         setCategories(dummyCategories);
//     };
//     // Fetch all containers
//     const fetchContainers = async () => {
//         setLoadingContainers(true);
//         try {
//             const params = {
//                 page: 1,
//                 limit: 50
//             };
//             const response = await api.get('/api/containers', { params });
//             setContainers(response.data.data || []);
//         } catch (error) {
//             console.error('❌ Error fetching containers:', error);
//             setSnackbar({
//                 open: true,
//                 message: error.response?.data?.error || error.message || 'Failed to fetch containers',
//                 severity: 'error',
//             });
//         } finally {
//             setLoadingContainers(false);
//         }
//     };
//     const fetchOrder = async (id) => {
//         setLoading(true);
//         try {
//             const response = await api.get(`/api/orders/${id}`, { params: { includeContainer: true } });
//             if (!response.data) {
//                 throw new Error('Invalid response data');
//             }
//              console.log('Fetched order data:', response.data);
//              setSelectedOrder(response.data);
//             // Map snake_case to camelCase for core fields
//             const camelData = {};
//             Object.keys(response.data).forEach(apiKey => {
//                 let value = response.data[apiKey];
//                 if (value === null || value === undefined) value = '';
//                 if (['eta', 'etd', 'drop_date', 'delivery_date'].includes(apiKey)) {
//                     if (value) {
//                         const date = new Date(value);
//                         if (!isNaN(date.getTime())) {
//                             value = date.toISOString().split('T')[0]; // YYYY-MM-DD
//                         }
//                     } else {
//                         value = '';
//                     }
//                 }
//                 const camelKey = snakeToCamel(apiKey);
//                 camelData[camelKey] = value;
//             });
//             // Set senderType from API
//             camelData.senderType = response.data.sender_type || 'sender';
//             // Map owner fields
//             const ownerPrefix = camelData.senderType === 'sender' ? 'sender' : 'receiver';
//             const ownerFields = ['name', 'contact', 'address', 'email', 'ref', 'remarks'];
//             ownerFields.forEach(field => {
//                 const apiKey = `${ownerPrefix}_${field}`;
//                 const snakeVal = response.data[apiKey];
//                 if (snakeVal !== null && snakeVal !== undefined) {
//                     camelData[`${ownerPrefix}${field.charAt(0).toUpperCase() + field.slice(1)}`] = snakeVal;
//                 }
//             });
//             // Handle panel2 - dynamic based on senderType
//             // API always provides 'receivers' array, which maps to panel2 items
//             const panel2ApiKey = 'receivers';
//             const panel2Prefix = camelData.senderType === 'sender' ? 'receiver' : 'sender';
//             const panel2ListKey = camelData.senderType === 'sender' ? 'receivers' : 'senders';
//             const initialItem = panel2Prefix === 'receiver' ? initialReceiver : initialSenderObject;
//             let mappedPanel2 = [];
//             if (response.data[panel2ApiKey]) {
//                 mappedPanel2 = (response.data[panel2ApiKey] || []).map(rec => {
//                     if (!rec) return null;
//                     const camelRec = {
//                         ...initialItem,
//                         shippingDetails: [],
//                         isNew: false,
//                         validationWarnings: null
//                     };
//                     Object.keys(rec).forEach(apiKey => {
//                         let val = rec[apiKey];
//                         if (val === null || val === undefined) val = '';
//                         const camelKey = snakeToCamel(apiKey);
//                         if (['name', 'contact', 'address', 'email'].includes(camelKey)) {
//                             camelRec[`${panel2Prefix}${camelKey.charAt(0).toUpperCase() + camelKey.slice(1)}`] = val;
//                         } else {
//                             camelRec[camelKey] = val;
//                         }
//                     });
//                     // NEW: Parse per-item dates (eta, etd) to YYYY-MM-DD
//                     ['eta', 'etd'].forEach(dateField => {
//                         if (rec[dateField]) {  // API snake_case
//                             const date = new Date(rec[dateField]);
//                             if (!isNaN(date.getTime())) {
//                                 camelRec[dateField] = date.toISOString().split('T')[0];  // Set to camelRec.eta/etc.
//                             } else {
//                                 camelRec[dateField] = '';  // Invalid date -> empty
//                             }
//                         }
//                     });
//                     // Handle legacy shipping_detail to array
//                     if (rec.shipping_detail) {
//                         const sd = { ...rec.shipping_detail };
//                         Object.keys(sd).forEach(key => {
//                             const camelKey = snakeToCamel(key);
//                             sd[camelKey] = sd[key];
//                             delete sd[key];
//                         });
//                         camelRec.shippingDetails = [sd];
//                     }
//                     // If no shippingDetails, create default one from receiver-level totals
//                     if (!camelRec.shippingDetails || camelRec.shippingDetails.length === 0) {
//                         camelRec.shippingDetails = [{
//                             ...initialShippingDetail,
//                             totalNumber: rec.total_number || '',
//                             weight: rec.total_weight || ''
//                         }];
//                     }
//                     camelRec.status = rec.status || "Created";
//                     // New fields default
//                     camelRec.fullPartial = camelRec.fullPartial || '';
//                     camelRec.qtyDelivered = camelRec.qtyDelivered != null ? String(camelRec.qtyDelivered) : '0';
//                     return camelRec;
//                 }).filter(Boolean);
//             }
//             // Fallback panel2 fields to order-level if empty
//             mappedPanel2.forEach(rec => {
//                 if (rec.eta === '' && camelData.eta) {
//                     rec.eta = camelData.eta;
//                 }
//                 if (rec.etd === '' && camelData.etd) {
//                     rec.etd = camelData.etd;
//                 }
//                 if (rec.shippingLine === '' && camelData.shippingLine) {
//                     rec.shippingLine = camelData.shippingLine;
//                 }
//             });
//             // Compute remainingItems on load
//             mappedPanel2 = mappedPanel2.map(rec => {
//                 const shippingDetails = rec.shippingDetails || [];
//                 const recTotal = shippingDetails.reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
//                 const delivered = parseInt(rec.qtyDelivered || 0) || 0;
//                 const recRemaining = Math.max(0, recTotal - delivered);
//                 let updatedDetails = shippingDetails;
//                 if (rec.fullPartial === 'Partial' && recTotal > 0) {
//                     updatedDetails = shippingDetails.map(sd => {
//                         const sdTotal = parseInt(sd.totalNumber || 0) || 0;
//                         const sdRemaining = Math.round((sdTotal / recTotal) * recRemaining);
//                         return { ...sd, remainingItems: sdRemaining.toString() };
//                     });
//                 } else {
//                     updatedDetails = shippingDetails.map(sd => ({ ...sd, remainingItems: (parseInt(sd.totalNumber || 0) || 0).toString() }));
//                 }
//                 rec.shippingDetails = updatedDetails;
//                 // Validation warnings
//                 let warnings = null;
//                 const isInvalidTotal = recTotal <= 0;
//                 const isPartialInvalid = rec.fullPartial === 'Partial' && delivered > recTotal;
//                 if (isInvalidTotal || isPartialInvalid) {
//                     warnings = {};
//                     if (isInvalidTotal) warnings.total_number = 'Must be positive';
//                     if (isPartialInvalid) warnings.qty_delivered = 'Cannot exceed total_number';
//                 }
//                 rec.validationWarnings = warnings;
//                 return rec;
//             });
//             camelData[panel2ListKey] = mappedPanel2;
//             if (!camelData[panel2ListKey] || camelData[panel2ListKey].length === 0) {
//                 camelData[panel2ListKey] = [{
//                     ...initialItem,
//                     shippingDetails: [],
//                     isNew: true
//                 }];
//             }
//             // Ensure the other list is empty
//             const otherListKey = panel2ListKey === 'receivers' ? 'senders' : 'receivers';
//             camelData[otherListKey] = [];
//             // Attachments/gatepass
//             const cleanAttachments = (paths) => (paths || []).map(path => {
//                 if (typeof path === 'string' && path.startsWith('function wrap()')) {
//                     return path.substring(62);
//                 }
//                 return path;
//             });
//             camelData.attachments = cleanAttachments(camelData.attachments || []);
//             camelData.gatepass = cleanAttachments(camelData.gatepass || []);
//             const apiBase = import.meta.env.VITE_API_URL;
//             camelData.attachments = camelData.attachments.map(path =>
//                 path.startsWith('http') ? path : `${apiBase}${path}`
//             );
//             camelData.gatepass = camelData.gatepass.map(path =>
//                 path.startsWith('http') ? path : `${apiBase}${path}`
//             );
//             setFormData(camelData);
//             // Set initial errors from validation warnings
//             const initialErrors = {};
//             mappedPanel2.forEach((rec, i) => {
//                 if (rec.validationWarnings) {
//                     if (rec.validationWarnings.total_number) {
//                         initialErrors[`${panel2ListKey}[${i}].totalNumber`] = rec.validationWarnings.total_number;
//                     }
//                     if (rec.validationWarnings.qty_delivered) {
//                         initialErrors[`${panel2ListKey}[${i}].qtyDelivered`] = rec.validationWarnings.qty_delivered;
//                     }
//                 }
//             });
//             setErrors(initialErrors);
//             const hasWarnings = mappedPanel2.some(r => r && r.validationWarnings);
//             if (hasWarnings) {
//                 setSnackbar({
//                     open: true,
//                     message: 'Some receiver data needs attention (check totals/deliveries)',
//                     severity: 'warning',
//                 });
//             }
//         } catch (err) {
//             console.error("Error fetching order:", err);
//             setSnackbar({
//                 open: true,
//                 message: err.response?.data?.error || err.message || 'Failed to fetch order',
//                 severity: 'error',
//             });
//             if (err.response?.status === 404) {
//                 navigate('/orders');
//             }
//         } finally {
//             setLoading(false);
//         }
//     };
//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData((prev) => {
//             const updated = { ...prev, [name]: value };
//             if (name === 'transportType' && value !== prev.transportType) {
//                 // Clear transport-specific fields
//                 updated.dropMethod = '';
//                 updated.dropoffName = '';
//                 updated.dropOffCnic = '';
//                 updated.dropOffMobile = '';
//                 updated.plateNo = '';
//                 updated.dropDate = '';
//                 updated.collectionMethod = '';
//                 updated.clientReceiverName = '';
//                 updated.clientReceiverId = '';
//                 updated.clientReceiverMobile = '';
//                 updated.deliveryDate = '';
//                 updated.gatepass = [];
//                 updated.driverName = '';
//                 updated.driverContact = '';
//                 updated.driverNic = '';
//                 updated.driverPickupLocation = '';
//                 updated.truckNumber = '';
//                 updated.thirdPartyTransport = '';
//             }
//             if (name === 'dropMethod' && value === 'RGSL Pickup') {
//                 updated.dropoffName = '';
//                 updated.dropOffCnic = '';
//                 updated.dropOffMobile = '';
//             }
//             if (name === 'collectionMethod' && value === 'Delivered by RGSL') {
//                 updated.clientReceiverName = '';
//                 updated.clientReceiverId = '';
//                 updated.clientReceiverMobile = '';
//             }
//             if (name === 'senderType' && value !== prev.senderType) {
//                 // Clear opposite owner fields if switching
//                 const newPrefix = value;
//                 const oldPrefix = prev.senderType;
//                 const fields = ['Name', 'Contact', 'Address', 'Email', 'Ref', 'Remarks'];
//                 fields.forEach(key => {
//                     const oldKey = `${oldPrefix}${key}`;
//                     if (updated[oldKey]) updated[oldKey] = '';
//                 });
//                 // Updated: Clear opposite list and init active list with one empty item
//                 const newPanel2Key = value === 'sender' ? 'receivers' : 'senders';
//                 const otherKey = value === 'sender' ? 'senders' : 'receivers';
//                 updated[otherKey] = [];  // Clear opposite (e.g., senders when switching to 'sender')

//                 // Ensure active list has at least one empty item
//                 const initItem = value === 'sender' ? initialReceiver : initialSenderObject;
//                 if (!updated[newPanel2Key] || updated[newPanel2Key].length === 0) {
//                     updated[newPanel2Key] = [{ ...initItem, shippingDetails: [], isNew: true }];
//                 }
//             }
//             return updated;
//         });
//         if (errors[name]) {
//             setErrors((prev) => ({ ...prev, [name]: '' }));
//         }
//     };
//     // Receiver handlers (updated)
//     const addReceiver = () => {
//         setFormData(prev => ({
//             ...prev,
//             receivers: [...prev.receivers, { ...initialReceiver, shippingDetails: [], isNew: true }]
//         }));
//     };
//     const removeReceiver = (index) => {
//         setFormData(prev => ({
//             ...prev,
//             receivers: prev.receivers.filter((_, i) => i !== index)
//         }));
//     };
//     const duplicateReceiver = (index) => {
//         setFormData(prev => ({
//             ...prev,
//             receivers: [
//                 ...prev.receivers.slice(0, index + 1),
//                 { ...prev.receivers[index], shippingDetails: prev.receivers[index].shippingDetails.map(sd => ({ ...sd })), isNew: true },
//                 ...prev.receivers.slice(index + 1)
//             ]
//         }));
//     };
//     const handleReceiverChange = (index, field) => (e) => {
//         const value = e.target.value;
//         setFormData(prev => ({
//             ...prev,
//             receivers: prev.receivers.map((rec, i) =>
//                 i === index ? { ...rec, [field]: value } : rec
//             )
//         }));
//         const errorKey = `receivers[${index}].${field}`;
//         if (errors[errorKey]) {
//             setErrors(prev => {
//                 const newErr = { ...prev };
//                 delete newErr[errorKey];
//                 return newErr;
//             });
//         }
//     };
//     const handleReceiverShippingChange = (index, j, field) => (e) => {
//         const value = e.target.value;
//         setFormData(prev => {
//             const rec = prev.receivers[index];
//             const oldSd = rec.shippingDetails[j] || {};
//             const updatedSd = { ...oldSd, [field]: value };
//             if (field === 'category' && value !== oldSd.category) {
//                 updatedSd.subcategory = '';
//             }
//             return {
//                 ...prev,
//                 receivers: prev.receivers.map((r, i) =>
//                     i === index ? {
//                         ...r,
//                         shippingDetails: r.shippingDetails.map((sd, k) => k === j ? updatedSd : sd)
//                     } : r
//                 )
//             };
//         });
//         const errorKey = `receivers[${index}].shippingDetails[${j}].${field}`;
//         if (errors[errorKey]) {
//             setErrors(prev => {
//                 const newErr = { ...prev };
//                 delete newErr[errorKey];
//                 return newErr;
//             });
//         }
//     };
//     const handleReceiverPartialChange = (index, field) => (e) => {
//         const value = e.target.value;
//         setFormData(prev => {
//             const rec = prev.receivers[index];
//             const updated = { ...rec, [field]: value };
//             if (field === 'fullPartial' && value === 'Full') {
//                 updated.qtyDelivered = '';
//             }
//             return {
//                 ...prev,
//                 receivers: prev.receivers.map((r, i) => i === index ? updated : r)
//             };
//         });
//         const errorKey = `receivers[${index}].${field}`;
//         if (errors[errorKey]) {
//             setErrors(prev => {
//                 const newErr = { ...prev };
//                 delete newErr[errorKey];
//                 return newErr;
//             });
//         }
//     };
//     const addReceiverShipping = (index) => {
//         setFormData(prev => ({
//             ...prev,
//             receivers: prev.receivers.map((r, i) =>
//                 i === index ? { ...r, shippingDetails: [...(r.shippingDetails || []), { ...initialShippingDetail }] } : r
//             )
//         }));
//     };
//     const duplicateReceiverShipping = (index, j) => {
//         const toDuplicate = formData.receivers[index].shippingDetails[j];
//         setFormData(prev => ({
//             ...prev,
//             receivers: prev.receivers.map((r, i) =>
//                 i === index ? {
//                     ...r,
//                     shippingDetails: [
//                         ...r.shippingDetails.slice(0, j + 1),
//                         { ...toDuplicate },
//                         ...r.shippingDetails.slice(j + 1)
//                     ]
//                 } : r
//             )
//         }));
//     };
//     const removeReceiverShipping = (index, j) => {
//         setFormData(prev => ({
//             ...prev,
//             receivers: prev.receivers.map((r, i) =>
//                 i === index ? { ...r, shippingDetails: r.shippingDetails.filter((_, k) => k !== j) } : r
//             )
//         }));
//     };
//     // Sender handlers (updated for consistency)
//     const addSender = useCallback(() => {
//         setFormData((prev) => ({
//             ...prev,
//             senders: [...prev.senders, { ...initialSenderObject, shippingDetails: [], isNew: true }],
//         }));
//     }, []);
//     const removeSender = useCallback((index) => {
//         setFormData((prev) => ({
//             ...prev,
//             senders: prev.senders.filter((_, i) => i !== index),
//         }));
//     }, []);
//     const duplicateSender = useCallback((index) => {
//         const toDuplicate = formData.senders[index];
//         setFormData((prev) => ({
//             ...prev,
//             senders: [
//                 ...prev.senders.slice(0, index + 1),
//                 { ...toDuplicate, shippingDetails: toDuplicate.shippingDetails.map(sd => ({ ...sd })), isNew: true },
//                 ...prev.senders.slice(index + 1),
//             ],
//         }));
//     }, [formData.senders]);
//     const handleSenderChange = useCallback((index, field) => (event) => {
//         const value = event.target.value;
//         setFormData((prev) => ({
//             ...prev,
//             senders: prev.senders.map((item, i) =>
//                 i === index ? { ...item, [field]: value } : item
//             ),
//         }));
//         const errorKey = `senders[${index}].${field}`;
//         if (errors[errorKey]) {
//             setErrors((prev) => ({ ...prev, [errorKey]: '' }));
//         }
//     }, [errors]);
//     const handleSenderShippingChange = useCallback((index, j, field) => (event) => {
//         const value = event.target.value;
//         setFormData((prev) => ({
//             ...prev,
//             senders: prev.senders.map((item, i) =>
//                 i === index
//                     ? {
//                         ...item,
//                         shippingDetails: item.shippingDetails.map((sd, k) => k === j ? { ...sd, [field]: value } : sd),
//                     }
//                     : item
//             ),
//         }));
//         const errorKey = `senders[${index}].shippingDetails[${j}].${field}`;
//         if (errors[errorKey]) {
//             setErrors((prev) => ({ ...prev, [errorKey]: '' }));
//         }
//     }, [errors]);
//     const handleSenderPartialChange = useCallback((index, field) => (event) => {
//         const value = event.target.value;
//         setFormData((prev) => ({
//             ...prev,
//             senders: prev.senders.map((item, i) =>
//                 i === index ? { ...item, [field]: value } : item
//             ),
//         }));
//         const errorKey = `senders[${index}].${field}`;
//         if (errors[errorKey]) {
//             setErrors((prev) => ({ ...prev, [errorKey]: '' }));
//         }
//     }, [errors]);
//     const addSenderShipping = (index) => {
//         setFormData(prev => ({
//             ...prev,
//             senders: prev.senders.map((r, i) =>
//                 i === index ? { ...r, shippingDetails: [...(r.shippingDetails || []), { ...initialShippingDetail }] } : r
//             )
//         }));
//     };
//     const duplicateSenderShipping = (index, j) => {
//         const toDuplicate = formData.senders[index].shippingDetails[j];
//         setFormData(prev => ({
//             ...prev,
//             senders: prev.senders.map((r, i) =>
//                 i === index ? {
//                     ...r,
//                     shippingDetails: [
//                         ...r.shippingDetails.slice(0, j + 1),
//                         { ...toDuplicate },
//                         ...r.shippingDetails.slice(j + 1)
//                     ]
//                 } : r
//             )
//         }));
//     };
//     const removeSenderShipping = (index, j) => {
//         setFormData(prev => ({
//             ...prev,
//             senders: prev.senders.map((r, i) =>
//                 i === index ? { ...r, shippingDetails: r.shippingDetails.filter((_, k) => k !== j) } : r
//             )
//         }));
//     };
//     const handleReceiverContainersChange = (index) => (event) => {
//         // Removed containers, placeholder
//     };
//     const handleAccordionChange = (panel) => (event, isExpanded) => {
//         setExpanded(prev => {
//             const newSet = new Set(prev);
//             if (isExpanded) {
//                 newSet.add(panel);
//             } else {
//                 newSet.delete(panel);
//             }
//             return newSet;
//         });
//     };
//     const handleFileUpload = (e) => {
//         const files = Array.from(e.target.files);
//         setFormData((prev) => ({ ...prev, attachments: [...(Array.isArray(prev.attachments) ? prev.attachments : []), ...files] }));
//     };
//     const handleGatepassUpload = (e) => {
//         const files = Array.from(e.target.files);
//         setFormData((prev) => ({ ...prev, gatepass: [...(Array.isArray(prev.gatepass) ? prev.gatepass : []), ...files] }));
//     };
// const handleSave = async () => {
//     if (!validateForm()) {
//         setSnackbar({
//             open: true,
//             message: 'Please fix the errors in the form',
//             severity: 'error',
//         });
//         return;
//     }
//     setLoading(true);
//     const formDataToSend = new FormData();
//     const dateFields = ['eta', 'etd', 'dropDate', 'deliveryDate'];
//     // Append core orders fields
//     const coreKeys = ['bookingRef', 'rglBookingNumber', 'placeOfLoading', 'pointOfOrigin', 'finalDestination', 'placeOfDelivery', 'orderRemarks', 'eta', 'etd', 'attachments'];
//     coreKeys.forEach(key => {
//         const value = formData[key];
//         if (dateFields.includes(key) && value === '') {
//             // Skip empty dates
//         } else {
//             const apiKey = camelToSnake(key);
//             formDataToSend.append(apiKey, value || '');
//         }
//     });
//     // Append owner fields dynamically
//     const ownerFieldPrefix = formData.senderType === 'sender' ? 'sender' : 'receiver';
//     const ownerFields = ['Name', 'Contact', 'Address', 'Email', 'Ref', 'Remarks'];
//     ownerFields.forEach(key => {
//         const value = formData[`${ownerFieldPrefix}${key}`] || '';
//         const apiKey = `${ownerFieldPrefix}_${camelToSnake(key.toLowerCase())}`;
//         formDataToSend.append(apiKey, value);
//     });
//     formDataToSend.append('sender_type', formData.senderType);
//     // Append selected_sender_owner
//     formDataToSend.append('selected_sender_owner', formData.selectedSenderOwner || '');
//     // Dynamic panel2 items
//     const panel2Items = formData.senderType === 'receiver' ? formData.senders : formData.receivers;
//     const panel2FieldPrefix = formData.senderType === 'sender' ? 'receiver' : 'sender';
//     const panel2ArrayKey = `${panel2FieldPrefix}s`;
//     // Append panel2 as JSON (basic info)
//     const panel2ToSend = panel2Items.map((item) => {
//         const snakeRec = {
//             [`${panel2FieldPrefix}_name`]: formData.senderType === 'sender' ? (item.receiverName || '') : (item.senderName || ''),
//             [`${panel2FieldPrefix}_contact`]: formData.senderType === 'sender' ? (item.receiverContact || '') : (item.senderContact || ''),
//             [`${panel2FieldPrefix}_address`]: formData.senderType === 'sender' ? (item.receiverAddress || '') : (item.senderAddress || ''),
//             [`${panel2FieldPrefix}_email`]: formData.senderType === 'sender' ? (item.receiverEmail || '') : (item.senderEmail || ''),
//             eta: item.eta || '',
//             etd: item.etd || '',
//             shipping_line: item.shippingLine || '',
//             full_partial: item.fullPartial || '',
//             qty_delivered: item.qtyDelivered || '',
//             status: item.status || 'Created',
//             remarks: item.remarks || '',
//         };
//         return snakeRec;
//     });
//     formDataToSend.append(panel2ArrayKey, JSON.stringify(panel2ToSend));
//     // Append order_items from all shippingDetails flat
//     console.log('saveee response',panel2ArrayKey,panel2Items,panel2ToSend,panel2FieldPrefix,formData,formDataToSend)
//     const orderItemsToSend = [];
//     panel2Items.forEach((item, i) => {
//         (item.shippingDetails || []).forEach((sd, j) => {
//             const snakeItem = {};
//             Object.keys(sd).forEach(key => {
//                 if (key !== 'remainingItems') {
//                     const snakeKey = camelToSnake(key);
//                     snakeItem[snakeKey] = sd[key] || '';
//                 }
//             });
//             snakeItem.item_ref = `REF-${i + 1}-${j + 1}-${Date.now()}`;
//             orderItemsToSend.push(snakeItem);
//         });
//     });
//     formDataToSend.append('order_items', JSON.stringify(orderItemsToSend));
//     // Append transport fields
//     const transportKeys = ['transportType','collection_scope', 'thirdPartyTransport', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber', 'dropMethod', 'dropoffName', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate', 'collectionMethod', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate', 'gatepass'];
//     transportKeys.forEach(key => {
//         const value = formData[key];
//         const apiKey = camelToSnake(key);
//         formDataToSend.append(apiKey, value || '');
//     });
//     // Handle attachments and gatepass
//     ['attachments', 'gatepass'].forEach(key => {
//         const value = formData[key];
//         if (Array.isArray(value) && value.length > 0) {
//             const existing = value.filter(item => typeof item === 'string');
//             const newFiles = value.filter(item => item instanceof File);
//             if (newFiles.length > 0) {
//                 newFiles.forEach(file => formDataToSend.append(key, file));
//             }
//             if (existing.length > 0) {
//                 const apiKey = camelToSnake(key);
//                 formDataToSend.append(`${apiKey}_existing`, JSON.stringify(existing));
//             }
//         }
//     });
//     try {
//         const endpoint = isEditMode ? `/api/orders/${orderId}` : '/api/orders';
//         const method = isEditMode ? 'put' : 'post';
//         const response = await api[method](endpoint, formDataToSend, {
//             headers: { 'Content-Type': 'multipart/form-data' }
//         });
//         if (isEditMode) {
//             await fetchOrder(orderId);
//         } else {
//             navigate('/orders');
//         }
//         setSnackbar({
//             open: true,
//             message: isEditMode ? 'Order updated successfully' : 'Order created successfully',
//             severity: 'success',
//         });
//     } catch (err) {
//         console.error("[handleSave] Backend error:", err.response?.data || err.message);
//         const backendMsg = err.response?.data?.error || err.message || 'Failed to save order';
//         setSnackbar({
//             open: true,
//             message: `Backend Error: ${backendMsg}`,
//             severity: 'error',
//         });
//     } finally {
//         setLoading(false);
//     }
// };


// // Helper to load images as Base64
// const loadImageAsBase64 = (url) => {
//   return new Promise((resolve) => {
//     const img = new Image();
//     img.crossOrigin = 'Anonymous';
//     img.src = url;

//     img.onload = () => {
//       const canvas = document.createElement('canvas');
//       canvas.width = img.width;
//       canvas.height = img.height;
//       const ctx = canvas.getContext('2d');
//       ctx.drawImage(img, 0, 0);
//       resolve(canvas.toDataURL('image/png'));
//     };

//     img.onerror = () => resolve(null);
//   });
// };

// const generateOrderPDF = async (selectedOrder) => {
//   if (!selectedOrder) return;

//   const doc = new jsPDF('p', 'mm', 'a4');
//   const pageWidth = doc.internal.pageSize.getWidth();
//   const margin = 8;
//   const brandPrimary = [13, 108, 106];  // #0D6C6A
//   const brandLight = [220, 245, 243];
//   const yStart = 30;

//   //---------------------------------------------------
//   // HEADER
//   //---------------------------------------------------
// const drawHeader = async () => {
//   const headerHeight = 28;

//   doc.setFillColor(...brandPrimary);
//   doc.rect(0, 0, pageWidth, headerHeight, 'F');
//   const logoBase64 = await loadImageAsBase64("/logo.png");

//   if (logoBase64) {
//     doc.addImage(logoBase64, 'PNG', margin, 4, 60, 20);
//   } else {
//     console.warn("Logo failed to load.");
//   }
//     doc.setTextColor(255, 255, 255);
//   doc.setFontSize(9).setFont('helvetica', 'normal');
//   doc.text(`Booking Ref: ${selectedOrder.booking_ref || "N/A"}`, pageWidth - margin, 12, { align: 'right' });
//   doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 17, { align: 'right' });
// };

//   //---------------------------------------------------
//   // SUMMARY CARDS
//   //---------------------------------------------------
//   const drawSummary = (y) => {
//     const cards = [
//       ["Order ID", selectedOrder.id || 'N/A'],
//       ["Receivers", selectedOrder.receivers?.length || 0],
//       ["Status", selectedOrder.status || "Created"],
//       ["Total Assigned Qty", selectedOrder.total_assigned_qty || 0],
//     ];

//     const cardWidth = (pageWidth - margin * 2 - 6) / 2;
//     const cardHeight = 16;

//     cards.forEach((item, i) => {
//       const col = i % 2;
//       const row = Math.floor(i / 2);
//       const x = margin + (col * (cardWidth + 6));
//       const cardY = y + row * (cardHeight + 6);

//       // Card box
//       doc.setDrawColor(220, 220, 220);
//       doc.setFillColor(...brandLight);
//       doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');

//       // Title bar
//       doc.setFillColor(...brandPrimary);
//       doc.rect(x, cardY, cardWidth, 5, 'F');
//       doc.setFont('helvetica', 'bold').setFontSize(9);
//       doc.setTextColor(255, 255, 255);
//       doc.text(item[0], x + 2, cardY + 4);

//       // Value
//       doc.setTextColor(50, 50, 50);
//       doc.setFont('helvetica', 'normal');
//       doc.text(String(item[1]), x + 3, cardY + 11);
//     });

//     return y + Math.ceil(cards.length / 2) * (cardHeight + 6) + 5;
//   };

//   //---------------------------------------------------
//   // KEY-VALUE DETAILS SECTION
//   //---------------------------------------------------
//   const drawDetails = (y, title, details) => {
//     doc.setFont('helvetica', 'bold').setFontSize(14);
//     doc.setTextColor(...brandPrimary);
//     doc.text(title, margin, y);

//     y += 4;

//     // Underline
//     doc.setDrawColor(...brandPrimary);
//     doc.setLineWidth(0.6);
//     doc.line(margin, y, pageWidth - margin, y);
//     y += 6;

//     const colWidth = (pageWidth - margin * 2 - 10) / 2;
//     const rowHeight = 8;

//     details.forEach((pair, index) => {
//       const col = index % 2;
//       const row = Math.floor(index / 2);
//       const x = margin + col * (colWidth + 10);
//       const dy = y + row * rowHeight;

//       doc.setFont('helvetica', 'bold');
//       doc.setFontSize(10);
//       doc.setTextColor(...brandPrimary);
//       doc.text(pair[0], x, dy);

//       doc.setFont('helvetica', 'normal');
//       doc.setTextColor(50, 50, 50);
//       doc.text(String(pair[1] || 'N/A'), x, dy + 4);
//     });

//     return y + Math.ceil(details.length / 2) * rowHeight + 6;
//   };

//   //---------------------------------------------------
//   // REMARKS & ATTACHMENTS BOX
//   //---------------------------------------------------
//   const drawBoxText = (y, title, text) => {
//     if (!text) return y;

//     const boxHeight = 20;
//     doc.setFillColor(248, 249, 250);
//     doc.roundedRect(margin, y, pageWidth - margin * 2, boxHeight, 2, 2, 'F');

//     doc.setFont('helvetica', 'bold').setFontSize(10);
//     doc.setTextColor(...brandPrimary);
//     doc.text(title, margin + 3, y + 6);

//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(9);
//     doc.setTextColor(50, 50, 50);
//     const wrapped = doc.splitTextToSize(text, pageWidth - margin * 2 - 6);
//     doc.text(wrapped, margin + 3, y + 11);

//     return y + boxHeight + 6;
//   };

//   //---------------------------------------------------
//   // RECEIVERS TABLE
//   //---------------------------------------------------
//   const drawReceivers = (y) => {
//     if (!selectedOrder.receivers?.length) return y;

//     doc.setFont('helvetica', 'bold').setFontSize(14);
//     doc.setTextColor(...brandPrimary);
//     doc.text("Receivers & Shipping Details", margin, y);
//     y += 6;

//     const headers = ['Receiver', 'Status', 'Consignment #', 'Qty', 'Weight', 'Contact', 'Address'];
//     const colWidths = [30, 30, 50, 20, 25, 30, 30];

//     autoTable(doc, {
//       startY: y,
//       head: [headers],
//       body: selectedOrder.receivers.map(r => [
//         r.receiver_name || 'N/A',
//         r.status || 'N/A',
//         r.consignment_number || 'N/A',
//         r.total_number ?? 'N/A',
//         r.total_weight ?? 'N/A',
//         r.receiver_contact || 'N/A',
//         r.receiver_address || 'N/A'
//       ]),
//       headStyles: { fillColor: brandPrimary, textColor: 255, fontStyle: 'bold' },
//       bodyStyles: { fontSize: 9, cellPadding: 3 },
//       columnStyles: {
//         0: { cellWidth: 30 },
//         1: { cellWidth: 35 },
//         2: { cellWidth: 30 },
//         3: { cellWidth: 25 },
//         4: { cellWidth: 25 },
//         5: { cellWidth: 25 },
//         6: { cellWidth: 25 },
//       },
//       margin: { left: margin, right: margin },
//     });

//     return doc.lastAutoTable.finalY + 6;
//   };

//   //---------------------------------------------------
//   // FOOTER
//   //---------------------------------------------------
//   const drawFooter = () => {
//     const y = 280;
//     doc.setDrawColor(...brandPrimary);
//     doc.line(margin, y, pageWidth - margin, y);

//     doc.setFont('helvetica', 'normal').setFontSize(9);
//     doc.setTextColor(80, 80, 80);
//     doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 6);
//     doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin, y + 6, { align: 'right' });
//   };

//   //---------------------------------------------------
//   // BUILD PDF
//   //---------------------------------------------------
//   await drawHeader();

//   let y = yStart;

//   // Summary cards
//   y = drawSummary(y);

//   // Order Information
//   const orderDetails = [
//     ["Booking Ref", selectedOrder.booking_ref],
//     ["Overall Status", selectedOrder.status],
//     ["RGL Booking #", selectedOrder.rgl_booking_number],
//     ["Place of Loading", selectedOrder.place_of_loading],
//     ["Final Destination", selectedOrder.final_destination],
//     ["Place of Delivery", selectedOrder.place_of_delivery],
//     ["ETA", selectedOrder.eta || 'N/A'],
//     ["ETD", selectedOrder.etd || 'N/A'],
//     ["Shipping Line", selectedOrder.shipping_line],
//     ["Point of Origin", selectedOrder.point_of_origin],
//   ];
//   y = drawDetails(y, "ORDER INFORMATION", orderDetails);

//   // Sender Information
//   const senderDetails = [
//     ["Sender Name", selectedOrder.sender_name],
//     ["Contact Number", selectedOrder.sender_contact],
//     ["Address", selectedOrder.sender_address],
//     ["Email", selectedOrder.sender_email],
//     ["Sender Reference", selectedOrder.sender_ref],
//   ];
//   y = drawDetails(y, "SENDER INFORMATION", senderDetails);

//   // Remarks
//   y = drawBoxText(y, "Order Remarks", selectedOrder.order_remarks);
//   y = drawBoxText(y, "Consignment Remarks", selectedOrder.consignment_remarks);

//   // Receivers Table
//   y = drawReceivers(y);

//   // Attachments
//   const attachmentsText = selectedOrder.attachments?.length > 0
//     ? selectedOrder.attachments.join(", ")
//     : "None";
//   y = drawBoxText(y, "Attachments", attachmentsText);

//   // Footer
//   drawFooter();

//   //---------------------------------------------------
//   // SAVE PDF
//   //---------------------------------------------------
//   doc.save(`RGS_Order_${selectedOrder.booking_ref || "Unknown"}.pdf`);
// };






//     const handleCancel = () => {
//         navigate(-1);
//     };
//     const handleSnackbarClose = (event, reason) => {
//         if (reason === 'clickaway') {
//             return;
//         }
//         setSnackbar({ ...snackbar, open: false });
//     };
//     const isFieldDisabled = (name) => {
//         if (!isEditMode) return false;
//         if (name.startsWith('receivers[') || name.startsWith('senders[')) {
//             // For new items, editable
//             const match = name.match(/(receivers|senders)\[(\d+)\]\.(.+)/);
//             if (match) {
//                 const list = match[1] === 'receivers' ? formData.receivers : formData.senders;
//                 const idx = parseInt(match[2]);
//                 const item = list[idx];
//                 if (item?.isNew) return false;
//             }
//             return !editableInEdit.some(e => name.includes(e.replace('receivers[].', '').replace('receivers[', '').replace('senders[].', '').replace('senders[', '')));
//         }
//         return !editableInEdit.includes(name);
//     };
//     // Validation helper for shipping details
//     const validateShippingDetails = (index) => {
//         const panel2FieldPrefix = formData.senderType === 'sender' ? 'receiver' : 'sender';
//         const listKey = formData.senderType === 'sender' ? 'receivers' : 'senders';
//         const currentList = formData[listKey];
//         const itemData = currentList[index];
//         const shippingDetails = itemData.shippingDetails || [];
//         let isValid = true;
//         const newErrors = { ...errors };
//         // Validate item level
//         const nameField = formData.senderType === 'sender' ? 'receiverName' : 'senderName';
//         if (!itemData[nameField]?.trim()) {
//             newErrors[`${listKey}[${index}].${nameField}`] = `${panel2FieldPrefix} name required`;
//             isValid = false;
//         }
//         // if (!itemData.eta) {
//         //     newErrors[`${listKey}[${index}].eta`] = 'ETA required';
//         //     isValid = false;
//         // }
//         // if (!itemData.etd) {
//         //     newErrors[`${listKey}[${index}].etd`] = 'ETD required';
//         //     isValid = false;
//         // }
//         // Validate each shipping detail
//         shippingDetails.forEach((sd, j) => {
//             if (!sd.pickupLocation?.trim()) {
//                 newErrors[`${listKey}[${index}].shippingDetails[${j}].pickupLocation`] = 'Pickup location required';
//                 isValid = false;
//             }
//             if (!sd.category?.trim()) {
//                 newErrors[`${listKey}[${index}].shippingDetails[${j}].category`] = 'Category required';
//                 isValid = false;
//             }
//             if (!sd.subcategory?.trim()) {
//                 newErrors[`${listKey}[${index}].shippingDetails[${j}].subcategory`] = 'Subcategory required';
//                 isValid = false;
//             }
//             if (!sd.type?.trim()) {
//                 newErrors[`${listKey}[${index}].shippingDetails[${j}].type`] = 'Type required';
//                 isValid = false;
//             }
//             if (!sd.deliveryAddress?.trim()) {
//                 newErrors[`${listKey}[${index}].shippingDetails[${j}].deliveryAddress`] = 'Delivery address required';
//                 isValid = false;
//             }
//             const totalNum = parseInt(sd.totalNumber || 0);
//             if (!sd.totalNumber || totalNum <= 0) {
//                 newErrors[`${listKey}[${index}].shippingDetails[${j}].totalNumber`] = 'Total number must be positive';
//                 isValid = false;
//             }
//             const weight = parseFloat(sd.weight || 0);
//             if (!sd.weight || weight <= 0) {
//                 newErrors[`${listKey}[${index}].shippingDetails[${j}].weight`] = 'Weight must be positive';
//                 isValid = false;
//             }
//         });
//         setErrors(newErrors);
//         return isValid;
//     };
//     // Updated handleSaveShipping (works for both senders/receivers)
//     const handleSaveShipping = async (index) => {
//         if (!validateShippingDetails(index)) {
//             setSnackbar({
//                 open: true,
//                 message: 'Please fix shipping detail errors',
//                 severity: 'error',
//             });
//             return;
//         }
//         setLoading(true);
//         console.log('save rendering',index)
//         const formDataToSend = new FormData();
//         // Dynamic panel2
//         const panel2FieldPrefix = formData.senderType === 'sender' ? 'receiver' : 'sender';
//         const listKey = formData.senderType === 'sender' ? 'receivers' : 'senders';
//         const currentList = formData[listKey];
//         const itemData = currentList[index];
//         const snakeRec = {
//             [`${panel2FieldPrefix}_name`]: formData.senderType === 'sender' ? itemData.receiverName || '' : itemData.senderName || '',
//             [`${panel2FieldPrefix}_contact`]: formData.senderType === 'sender' ? itemData.receiverContact || '' : itemData.senderContact || '',
//             [`${panel2FieldPrefix}_address`]: formData.senderType === 'sender' ? itemData.receiverAddress || '' : itemData.senderAddress || '',
//             [`${panel2FieldPrefix}_email`]: formData.senderType === 'sender' ? itemData.receiverEmail || '' : itemData.senderEmail || '',
//             eta: itemData.eta || '',
//             etd: itemData.etd || '',
//             remarks: itemData.remarks || '',
//             shipping_line: itemData.shippingLine || ''
//         };
//         // Append panel2 data as JSON
//         formDataToSend.append( `${panel2FieldPrefix}s`, JSON.stringify([snakeRec]) );
//         // Append shipping details as order_items flat list for this item
//         const orderItemsToSend = (itemData.shippingDetails || []).map((sd, j) => {
//             const snakeItem = {};
//             Object.keys(sd).forEach(key => {
//                 if (key !== 'remainingItems') {
//                     const snakeKey = camelToSnake(key);
//                     snakeItem[snakeKey] = sd[key] || '';
//                 }
//             });
//             snakeItem.item_ref = `REF-${index + 1}-${j + 1}-${Date.now()}`;
//             return snakeItem;
//         });
//         formDataToSend.append('order_items', JSON.stringify(orderItemsToSend));
//         // Append order_id for update
//         formDataToSend.append('order_id', orderId);
//         try {
//             const response = await api.put(`/api/orders/${orderId}/shipping`, formDataToSend, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });

//         console.log('save responseeeeee',response)

//             // Update local formData with response if needed
//             if (response.data.success) {
//                 // Optionally refetch full order or update local state
//                 await fetchOrder(orderId);
//                 setSnackbar({
//                     open: true,
//                     message: 'Shipping details saved successfully',
//                     severity: 'success',
//                 });
//             }
//         } catch (err) {
//             console.error("[handleSaveShipping] Error:", err.response?.data || err.message);
//             const backendMsg = err.response?.data?.error || err.message || 'Failed to save shipping details';
//             setSnackbar({
//                 open: true,
//                 message: `Error: ${backendMsg}`,
//                 severity: 'error',
//             });
//         } finally {
//             setLoading(false);
//         }
//     };
//     if (loading) {
//         return (
//             <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
//                 <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
//                     <CircularProgress size={24} />
//                     <Typography variant="h6" color="#f58220">Loading orders...</Typography>
//                 </Stack>
//             </Paper>
//         );
//     }
//     const firstPanel2Item = (formData.senderType === 'sender' ? formData.receivers : formData.senders)[0] || {};
//     const ownerName = formData.senderType === 'sender' ? formData.senderName : formData.receiverName;
//     return (
//             <>
//                 <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
//                     <Box sx={{ p: 3 }}>
//                         <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
//                             <Typography variant="h4" fontWeight="bold" color="#f58220">
//                                 {isEditMode ? "Edit" : "New"} Order Details
//                             </Typography>
//                             <Stack direction="row" gap={1}>
//                                 <Button
//                                     variant="outlined"
//                                     onClick={handleCancel}
//                                     sx={{ borderRadius: 2, borderColor: "#f58220", color: "#f58220", px: 3 }}
//                                     disabled={loading}
//                                 >
//                                     CANCEL
//                                 </Button>
//                                 <Button
//                                     variant="contained"
//                                     onClick={handleSave}
//                                     sx={{
//                                         borderRadius: 2,
//                                         backgroundColor: "#0d6c6a",
//                                         color: "#fff",
//                                         px: 3,
//                                         "&:hover": { backgroundColor: "#0d6c6a" },
//                                     }}
//                                     disabled={loading}
//                                 >
//                                     {loading ? "Saving..." : "SAVE"}
//                                 </Button>
//                             </Stack>
//                         </Stack>
//                         {/* Top Order Fields */}
//                         <Stack spacing={3} mb={4}>
//                             <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                 <CustomTextField
//                                     label="Booking Ref"
//                                     name="bookingRef"
//                                     value={formData.bookingRef}
//                                     onChange={handleChange}
//                                     error={!!errors.bookingRef}
//                                     helperText={errors.bookingRef}
//                                     required
//                                     disabled={isFieldDisabled('bookingRef')}
//                                 />
//                                 <CustomTextField
//                                     label="RGL Booking Number"
//                                     name="rglBookingNumber"
//                                     value={formData.rglBookingNumber}
//                                     onChange={handleChange}
//                                     error={!!errors.rglBookingNumber}
//                                     helperText={errors.rglBookingNumber}
//                                     required
//                                     disabled={isFieldDisabled('rglBookingNumber')}
//                                 />
//                             </Box>
//                             <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                 <CustomSelect
//                                     label="Point of Origin"
//                                     name="pointOfOrigin"
//                                     value={formData.pointOfOrigin || "Karachi"}
//                                     onChange={handleChange}
//                                     error={!!errors.pointOfOrigin}
//                                     renderValue={(selected) => selected || "Karachi"}
//                                 >
//                                     {places.map((p) => (
//                                         <MenuItem key={p} value={p}>
//                                             {p}
//                                         </MenuItem>
//                                     ))}
//                                 </CustomSelect>
//                                 <CustomSelect
//                                     label="Place of Loading"
//                                     name="placeOfLoading"
//                                     value={formData.placeOfLoading || ""}
//                                     onChange={handleChange}
//                                     error={!!errors.placeOfLoading}
//                                     renderValue={(selected) => selected || "Select Place of Loading"}
//                                 >
//                                     {places.map((p) => (
//                                         <MenuItem key={p} value={p}>
//                                             {p}
//                                         </MenuItem>
//                                     ))}
//                                 </CustomSelect>
//                             </Box>
//                             <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                 <CustomSelect
//                                     label="Place of Delivery"
//                                     name="placeOfDelivery"
//                                     value={formData.placeOfDelivery || ""}
//                                     onChange={handleChange}
//                                     error={!!errors.placeOfDelivery}
//                                     renderValue={(selected) => selected || "Select Place of Delivery"}
//                                 >
//                                     {places.map((p) => (
//                                         <MenuItem key={p} value={p}>
//                                             {p}
//                                         </MenuItem>
//                                     ))}
//                                 </CustomSelect>
//                                 <CustomSelect
//                                     label="Final Destination"
//                                     name="finalDestination"
//                                     value={formData.finalDestination || "Dubai"}
//                                     onChange={handleChange}
//                                     error={!!errors.finalDestination}
//                                     renderValue={(selected) => selected || "Dubai"}
//                                 >
//                                     {places.map((p) => (
//                                         <MenuItem key={p} value={p}>
//                                             {p}
//                                         </MenuItem>
//                                     ))}
//                                 </CustomSelect>
//                             </Box>
//                             <CustomTextField
//                                 label="Order Remarks"
//                                 name="orderRemarks"
//                                 value={formData.orderRemarks}
//                                 onChange={handleChange}
//                                 error={!!errors.orderRemarks}
//                                 helperText={errors.orderRemarks}
//                                 fullWidth
//                                 multiline
//                                 rows={2}
//                                 disabled={isFieldDisabled('orderRemarks')}
//                             />
//                         </Stack>
//                         <Divider sx={{ my: 3, borderColor: "#e0e0e0" }} />
//                         {/* Accordion Sections */}
//                         <Stack spacing={2}>
//                             <Accordion
//                                 expanded={expanded.has("panel1")}
//                                 onChange={handleAccordionChange("panel1")}
//                                 sx={{
//                                     borderRadius: 2,
//                                     boxShadow: "none",
//                                     "&:before": { display: "none" },
//                                     "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
//                                 }}
//                             >
//                                 <AccordionSummary
//                                     expandIcon={<ExpandMoreIcon />}
//                                     sx={{
//                                         bgcolor: expanded.has("panel1") ? "#0d6c6a" : "#fff3e0",
//                                         borderRadius: 2,
//                                         "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded.has("panel1") ? "#fff" : "#f58220" },
//                                     }}
//                                 >
//                                     1. Owner Details
//                                 </AccordionSummary>
//                                 <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
//                                     <Stack spacing={2}>
//                                         {(() => {
//                                             const sendersList = [
//                                                 { id: 1, name: 'John Doe Sender', contact: '+1-234-5678', address: '123 Sender St, City', email: 'john.sender@example.com', ref: 'SREF001', remarks: 'Preferred sender' },
//                                                 { id: 2, name: 'Jane Smith Sender', contact: '+1-876-5432', address: '456 Sender Ave, Town', email: 'jane.sender@example.com', ref: 'SREF002', remarks: 'Regular sender' }
//                                             ];
//                                             const receiversList = [
//                                                 { id: 1, name: 'Alice Receiver', contact: '+1-111-2222', address: '789 Receiver Blvd, Village', email: 'alice.receiver@example.com', ref: 'RREF001', remarks: 'Main receiver' },
//                                                 { id: 2, name: 'Bob Receiver', contact: '+1-333-4444', address: '101 Receiver Rd, Hamlet', email: 'bob.receiver@example.com', ref: 'RREF002', remarks: 'Secondary receiver' }
//                                             ];
//                                             const typePrefix = formData.senderType === 'receiver' ? 'Receiver' : 'Sender';
//                                             const fieldPrefix = formData.senderType === 'sender' ? 'sender' : 'receiver';
//                                             return (
//                                                 <>
//                                                     <FormControl component="fieldset" error={!!errors.senderType}>
//                                                         <Typography variant="subtitle1" fontWeight="bold" color="#f58220" gutterBottom>
//                                                             Select Type
//                                                         </Typography>
//                                                         <RadioGroup
//                                                             name="senderType"
//                                                             value={formData.senderType}
//                                                             onChange={handleChange}
//                                                             sx={{ flexDirection: 'row', gap: 3, mb: 1 }}
//                                                             defaultValue="sender"
//                                                         >
//                                                             <FormControlLabel value="sender" control={<Radio />} label="Sender Details" />
//                                                             <FormControlLabel value="receiver" control={<Radio />} label="Receiver Details" />
//                                                         </RadioGroup>
//                                                         {errors.senderType && <Typography variant="caption" color="error">{errors.senderType}</Typography>}
//                                                     </FormControl>
//                                                     <CustomSelect
//                                                         label={`Select ${typePrefix}`}
//                                                         name="selectedSenderOwner"
//                                                         value={formData.selectedSenderOwner || ""}
//                                                         onChange={(e) => {
//                                                             const value = e.target.value;
//                                                             handleChange(e);
//                                                             if (value) {
//                                                                 const list = formData.senderType === 'sender' ? sendersList : receiversList;
//                                                                 const item = list.find(l => l.id.toString() === value);
//                                                                 if (item) {
//                                                                     setFormData(prev => ({
//                                                                         ...prev,
//                                                                         [`${fieldPrefix}Name`]: item.name || '',
//                                                                         [`${fieldPrefix}Contact`]: item.contact || '',
//                                                                         [`${fieldPrefix}Address`]: item.address || '',
//                                                                         [`${fieldPrefix}Email`]: item.email || '',
//                                                                         [`${fieldPrefix}Ref`]: item.ref || '',
//                                                                         [`${fieldPrefix}Remarks`]: item.remarks || '',
//                                                                     }));
//                                                                 }
//                                                             } else {
//                                                                 setFormData(prev => ({
//                                                                     ...prev,
//                                                                     [`${fieldPrefix}Name`]: '',
//                                                                     [`${fieldPrefix}Contact`]: '',
//                                                                     [`${fieldPrefix}Address`]: '',
//                                                                     [`${fieldPrefix}Email`]: '',
//                                                                     [`${fieldPrefix}Ref`]: '',
//                                                                     [`${fieldPrefix}Remarks`]: '',
//                                                                 }));
//                                                             }
//                                                         }}
//                                                         renderValue={(selected) => {
//                                                             if (!selected) return `Select ${typePrefix}`;
//                                                             const list = formData.senderType === 'sender' ? sendersList : receiversList;
//                                                             const item = list.find(l => l.id.toString() === selected);
//                                                             return item ? item.name : `Select ${typePrefix}`;
//                                                         }}
//                                                     >
//                                                         <MenuItem value="">Select from List</MenuItem>
//                                                         {(formData.senderType === 'sender' ? sendersList : receiversList).map((item) => (
//                                                             <MenuItem key={item.id} value={item.id.toString()}>
//                                                                 {item.name}
//                                                             </MenuItem>
//                                                         ))}
//                                                     </CustomSelect>
//                                                     <Stack spacing={2}>
//                                                         <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                             <CustomTextField
//                                                                 label={`${typePrefix} Name`}
//                                                                 name={`${fieldPrefix}Name`}
//                                                                 value={formData[`${fieldPrefix}Name`] || ""}
//                                                                 onChange={handleChange}
//                                                                 error={!!errors[`${fieldPrefix}Name`]}
//                                                                 helperText={errors[`${fieldPrefix}Name`]}
//                                                                 required
//                                                             />
//                                                             <CustomTextField
//                                                                 label={`${typePrefix} Contact`}
//                                                                 name={`${fieldPrefix}Contact`}
//                                                                 value={formData[`${fieldPrefix}Contact`] || ""}
//                                                                 onChange={handleChange}
//                                                                 error={!!errors[`${fieldPrefix}Contact`]}
//                                                                 helperText={errors[`${fieldPrefix}Contact`]}
//                                                             />
//                                                         </Box>
//                                                         <CustomTextField
//                                                             label={`${typePrefix} Address`}
//                                                             name={`${fieldPrefix}Address`}
//                                                             value={formData[`${fieldPrefix}Address`] || ""}
//                                                             onChange={handleChange}
//                                                             error={!!errors[`${fieldPrefix}Address`]}
//                                                             helperText={errors[`${fieldPrefix}Address`]}
//                                                             multiline
//                                                             rows={2}
//                                                         />
//                                                         <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                             <CustomTextField
//                                                                 label={`${typePrefix} Email`}
//                                                                 name={`${fieldPrefix}Email`}
//                                                                 value={formData[`${fieldPrefix}Email`] || ""}
//                                                                 onChange={handleChange}
//                                                                 error={!!errors[`${fieldPrefix}Email`]}
//                                                                 helperText={errors[`${fieldPrefix}Email`]}
//                                                             />
//                                                             <CustomTextField
//                                                                 label={`${typePrefix} Ref`}
//                                                                 name={`${fieldPrefix}Ref`}
//                                                                 value={formData[`${fieldPrefix}Ref`] || ""}
//                                                                 onChange={handleChange}
//                                                                 error={!!errors[`${fieldPrefix}Ref`]}
//                                                                 helperText={errors[`${fieldPrefix}Ref`]}
//                                                             />
//                                                         </Box>
//                                                         <CustomTextField
//                                                             label={`${typePrefix} Remarks`}
//                                                             name={`${fieldPrefix}Remarks`}
//                                                             value={formData[`${fieldPrefix}Remarks`] || ""}
//                                                             onChange={handleChange}
//                                                             error={!!errors[`${fieldPrefix}Remarks`]}
//                                                             helperText={errors[`${fieldPrefix}Remarks`]}
//                                                             multiline
//                                                             rows={2}
//                                                         />
//                                                     </Stack>
//                                                 </>
//                                             );
//                                         })()}
//                                     </Stack>
//                                 </AccordionDetails>
//                             </Accordion>
//                             <Accordion
//                                 expanded={expanded.has("panel2")}
//                                 onChange={handleAccordionChange("panel2")}
//                                 sx={{
//                                     borderRadius: 2,
//                                     boxShadow: "none",
//                                     "&:before": { display: "none" },
//                                     "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
//                                 }}
//                             >
//                                 <AccordionSummary
//                                     expandIcon={<ExpandMoreIcon />}
//                                     sx={{
//                                         bgcolor: expanded.has("panel2") ? "#0d6c6a" : "#fff3e0",
//                                         borderRadius: 2,
//                                         "& .MuiAccordionSummary-content": {
//                                             fontWeight: "bold",
//                                             color: expanded.has("panel2") ? "#fff" : "#f58220",
//                                         },
//                                     }}
//                                 >
//                                     2. {formData.senderType === 'receiver' ? 'Sender Details (with Shipping)' : 'Receiver Details (with Shipping)'}
//                                 </AccordionSummary>
//                                 <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
//                                     <Stack spacing={2}>
//                                         {formData.senderType === 'sender' ? (
//                                             errors.receivers && <Alert severity="error">{errors.receivers}</Alert>
//                                         ) : (
//                                             errors.senders && <Alert severity="error">{errors.senders}</Alert>
//                                         )}
//                                         {/* Dynamic: Summary Table for multiples */}
//                                         {(formData.senderType === 'sender' ? formData.receivers : formData.senders).length > 1 && (
//                                             <Stack spacing={1}>
//                                                 <Typography variant="subtitle2" color="primary">
//                                                     {formData.senderType === 'sender' ? 'Receivers' : 'Senders'} Overview
//                                                 </Typography>
//                                                 <Stack direction="row" spacing={2} sx={{ overflowX: 'auto' }}>
//                                                     {(formData.senderType === 'sender' ? formData.receivers : formData.senders).map((rec, i) => {
//                                                         const totalItems = (rec.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
//                                                         const remainingItems = (rec.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.remainingItems || 0) || 0), 0);
//                                                         return (
//                                                             <Chip
//                                                                 key={i}
//                                                                 label={`${(formData.senderType === 'sender' ? rec.receiverName : rec.senderName) ||
//                                                                     (formData.senderType === 'sender' ? `Receiver ${i + 1}` : `Sender ${i + 1}`)
//                                                                     } (Items: ${totalItems} / Remaining: ${remainingItems})`}
//                                                                 variant={rec.fullPartial === 'Partial' ? "filled" : "outlined"}
//                                                                 color={rec.fullPartial === 'Partial' ? "warning" : "primary"}
//                                                             />
//                                                         );
//                                                     })}
//                                                 </Stack>
//                                             </Stack>
//                                         )}
//                                         {(() => {
//         const currentList = formData.senderType === 'sender' ? formData.receivers : formData.senders;
//         const isSenderMode = formData.senderType === 'receiver';
//         const typePrefix = isSenderMode ? 'Sender' : 'Receiver';
//         const handleChangeFn = isSenderMode ? handleSenderChange : handleReceiverChange;
//         const handleShippingChangeFn = isSenderMode ? handleSenderShippingChange : handleReceiverShippingChange;
//         const handlePartialChangeFn = isSenderMode ? handleSenderPartialChange : handleReceiverPartialChange;
//         const addShippingFn = isSenderMode ? addSenderShipping : addReceiverShipping;
//         const duplicateShippingFn = isSenderMode ? duplicateSenderShipping : duplicateReceiverShipping;
//         const removeShippingFn = isSenderMode ? removeSenderShipping : removeReceiverShipping;
//         const listKey = isSenderMode ? 'senders' : 'receivers';
//         const addRecFn = isSenderMode ? addSender : addReceiver;
//         const duplicateRecFn = isSenderMode ? duplicateSender : duplicateReceiver;
//         const removeRecFn = isSenderMode ? removeSender : removeReceiver;

//         const renderRecForm = (rec, i) => {
//             const recErrorsPrefix = `${listKey}[${i}]`;
//             const recDisabledPrefix = `${listKey}[${i}]`;
//             const handleRecNameChange = handleChangeFn(i, isSenderMode ? 'senderName' : 'receiverName');
//             const handleRecContactChange = handleChangeFn(i, isSenderMode ? 'senderContact' : 'receiverContact');
//             const handleRecAddressChange = handleChangeFn(i, isSenderMode ? 'senderAddress' : 'receiverAddress');
//             const handleRecEmailChange = handleChangeFn(i, isSenderMode ? 'senderEmail' : 'receiverEmail');

//             const renderShippingSection = () => (
//                 <Stack spacing={2}>
//                     <Typography variant="subtitle1" color="primary" fontWeight="bold" mb={1}>
//                         Shipping Details
//                     </Typography>
//                     {/* ETA, ETD at receiver/sender level (if still needed; or move per sd as per prev advice) */}
//                     <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                         {/* <CustomTextField
//                             label="ETA"
//                             type="date"
//                             value={rec.eta || ""}
//                             onChange={handleChangeFn(i, 'eta')}
//                             InputLabelProps={{ shrink: true }}
//                             error={!!errors[`${recErrorsPrefix}.eta`]}
//                             helperText={errors[`${recErrorsPrefix}.eta`]}
//                             required
//                             disabled={isFieldDisabled(`${recDisabledPrefix}.eta`)}
//                         />
//                         <CustomTextField
//                             label="ETD"
//                             type="date"
//                             value={rec.etd || ""}
//                             onChange={handleChangeFn(i, 'etd')}
//                             InputLabelProps={{ shrink: true }}
//                             error={!!errors[`${recErrorsPrefix}.etd`]}
//                             helperText={errors[`${recErrorsPrefix}.etd`]}
//                             required
//                             disabled={isFieldDisabled(`${recDisabledPrefix}.etd`)}
//                         /> */}
//                     </Box>
//                     {/* Shipping Details Forms */}
//                     {(rec.shippingDetails || []).length === 0 ? (
//                         // Empty placeholder (unchanged, but icons now always visible)
//                         <Box sx={{ p: 1.5, border: 1, borderColor: "grey.200", borderRadius: 1 }}>
//                             <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
//                                 <Typography variant="body2" color="primary" fontWeight="bold">
//                                     Shipping Detail 1
//                                 </Typography>
//                                 <Stack direction="row" spacing={1}>
//                                     {/* UPDATED: Remove !isEditMode - always show icons */}
//                                     <IconButton
//                                         onClick={() => duplicateShippingFn(i, 0)}
//                                         size="small"
//                                         title="Duplicate"
//                                     >
//                                         <CopyIcon />
//                                     </IconButton>
//                                     <IconButton
//                                         onClick={() => removeShippingFn(i, 0)}
//                                         size="small"
//                                         title="Delete"
//                                     >
//                                         <DeleteIcon />
//                                     </IconButton>
//                                 </Stack>
//                             </Stack>
//                                                                 <Stack spacing={1.5}>
//                                                                     <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                                         <CustomTextField
//                                                                             label="Pickup Location"
//                                                                             value=""
//                                                                             onChange={(e) => {
//                                                                                 addShippingFn(i);  // Add first if empty
//                                                                                 handleShippingChangeFn(i, 0, 'pickupLocation')(e);
//                                                                             }}
//                                                                             error={!!errors[`${recErrorsPrefix}.shippingDetails[0].pickupLocation`]}
//                                                                             helperText={errors[`${recErrorsPrefix}.shippingDetails[0].pickupLocation`]}
//                                                                             required
//                                                                             disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].pickupLocation`)}
//                                                                         />
//                                                                         <CustomSelect
//                                                                             label="Category"
//                                                                             value=""
//                                                                             onChange={(e) => {
//                                                                                 addShippingFn(i);
//                                                                                 handleShippingChangeFn(i, 0, 'category')(e);
//                                                                             }}
//                                                                             error={!!errors[`${recErrorsPrefix}.shippingDetails[0].category`]}
//                                                                             helperText={errors[`${recErrorsPrefix}.shippingDetails[0].category`]}
//                                                                             required
//                                                                             disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].category`)}
//                                                                             renderValue={(selected) => selected || "Select Category"}
//                                                                         >
//                                                                             <MenuItem value="">Select Category</MenuItem>
//                                                                             {categories.map((c) => (
//                                                                                 <MenuItem key={c} value={c}>
//                                                                                     {c}
//                                                                                 </MenuItem>
//                                                                             ))}
//                                                                         </CustomSelect>
//                                                                     </Box>
//                                                                     <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                                         <CustomSelect
//                                                                             label="Subcategory"
//                                                                             value=""
//                                                                             onChange={(e) => {
//                                                                                 addShippingFn(i);
//                                                                                 handleShippingChangeFn(i, 0, 'subcategory')(e);
//                                                                             }}
//                                                                             error={!!errors[`${recErrorsPrefix}.shippingDetails[0].subcategory`]}
//                                                                             helperText={errors[`${recErrorsPrefix}.shippingDetails[0].subcategory`]}
//                                                                             required
//                                                                             disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].subcategory`)}
//                                                                             renderValue={(selected) => selected || "Select Subcategory"}
//                                                                         >
//                                                                             <MenuItem value="">Select Subcategory</MenuItem>
//                                                                             {(categorySubMap[''] || []).map((sc) => (
//                                                                                 <MenuItem key={sc} value={sc}>
//                                                                                     {sc}
//                                                                                 </MenuItem>
//                                                                             ))}
//                                                                         </CustomSelect>
//                                                                         <CustomSelect
//                                                                             label="Type"
//                                                                             value=""
//                                                                             onChange={(e) => {
//                                                                                 addShippingFn(i);
//                                                                                 handleShippingChangeFn(i, 0, 'type')(e);
//                                                                             }}
//                                                                             error={!!errors[`${recErrorsPrefix}.shippingDetails[0].type`]}
//                                                                             helperText={errors[`${recErrorsPrefix}.shippingDetails[0].type`]}
//                                                                             required
//                                                                             disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].type`)}
//                                                                             renderValue={(selected) => selected || "Select Type"}
//                                                                         >
//                                                                             <MenuItem value="">Select Unit</MenuItem>
//                                                                             {types.slice(1).map((t) => (
//                                                                                 <MenuItem key={t} value={t}>
//                                                                                     {t}
//                                                                                 </MenuItem>
//                                                                             ))}
//                                                                         </CustomSelect>
//                                                                     </Box>
//                                                                     <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                                         <CustomTextField
//                                                                             label="Total Number"
//                                                                             value=""
//                                                                             onChange={(e) => {
//                                                                                 addShippingFn(i);
//                                                                                 handleShippingChangeFn(i, 0, 'totalNumber')(e);
//                                                                             }}
//                                                                             error={!!errors[`${recErrorsPrefix}.shippingDetails[0].totalNumber`]}
//                                                                             helperText={errors[`${recErrorsPrefix}.shippingDetails[0].totalNumber`]}
//                                                                             required
//                                                                             disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].totalNumber`)}
//                                                                         />
//                                                                         <CustomTextField
//                                                                             label="Weight"
//                                                                             value=""
//                                                                             onChange={(e) => {
//                                                                                 addShippingFn(i);
//                                                                                 handleShippingChangeFn(i, 0, 'weight')(e);
//                                                                             }}
//                                                                             error={!!errors[`${recErrorsPrefix}.shippingDetails[0].weight`]}
//                                                                             helperText={errors[`${recErrorsPrefix}.shippingDetails[0].weight`]}
//                                                                             required
//                                                                             disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].weight`)}
//                                                                         />
//                                                                     </Box>
//                                                                     <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                                         <CustomTextField
//                                                                             label="Delivery Address"
//                                                                             value=""
//                                                                             onChange={(e) => {
//                                                                                 addShippingFn(i);
//                                                                                 handleShippingChangeFn(i, 0, 'deliveryAddress')(e);
//                                                                             }}
//                                                                             error={!!errors[`${recErrorsPrefix}.shippingDetails[0].deliveryAddress`]}
//                                                                             helperText={errors[`${recErrorsPrefix}.shippingDetails[0].deliveryAddress`]}
//                                                                             fullWidth
//                                                                             disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].deliveryAddress`)}
//                                                                         />
//                                                                         <CustomTextField label="Ref Number" value={`REF-${i + 1}-1`} disabled={true} />
//                                                                     </Box>
//                                                                 </Stack>
//                                                             </Box>
//                                                         ) : (
//                         (rec.shippingDetails || []).map((sd, j) => (
//                             <Box key={j} sx={{ p: 1.5, border: 1, borderColor: "grey.200", borderRadius: 1 }}>
//                                 <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
//                                     <Typography variant="body2" color="primary" fontWeight="bold">
//                                         Shipping Detail {j + 1}
//                                     </Typography>
//                                     <Stack direction="row" spacing={1}>
//                                         {/* UPDATED: Remove !isEditMode - always show icons; length guard on delete */}
//                                         <IconButton
//                                             onClick={() => duplicateShippingFn(i, j)}
//                                             size="small"
//                                             title="Duplicate"
//                                         >
//                                             <CopyIcon />
//                                         </IconButton>
//                                         {(rec.shippingDetails || []).length > 1 && (
//                                             <IconButton
//                                                 onClick={() => removeShippingFn(i, j)}
//                                                 size="small"
//                                                 title="Delete"
//                                             >
//                                                 <DeleteIcon />
//                                             </IconButton>
//                                         )}
//                                     </Stack>
//                                 </Stack>
//                                                                     <Stack spacing={1.5}>
//                                                                         <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                                             <CustomTextField
//                                                                                 label="Pickup Location"
//                                                                                 value={sd.pickupLocation || ""}
//                                                                                 onChange={(e) => handleShippingChangeFn(i, j, 'pickupLocation')(e)}
//                                                                                 error={!!errors[`${recErrorsPrefix}.shippingDetails[${j}].pickupLocation`]}
//                                                                                 helperText={errors[`${recErrorsPrefix}.shippingDetails[${j}].pickupLocation`]}
//                                                                                 required
//                                                                             />
//                                                                             <CustomSelect
//                                                                                 label="Category"
//                                                                                 value={sd.category || ""}
//                                                                                 onChange={(e) => handleShippingChangeFn(i, j, 'category')(e)}
//                                                                                 error={!!errors[`${recErrorsPrefix}.shippingDetails[${j}].category`]}
//                                                                                 helperText={errors[`${recErrorsPrefix}.shippingDetails[${j}].category`]}
//                                                                                 required
//                                                                                 renderValue={(selected) => selected || "Select Category"}
//                                                                             >
//                                                                                 <MenuItem value="">Select Category</MenuItem>
//                                                                                 {categories.map((c) => (
//                                                                                     <MenuItem key={c} value={c}>
//                                                                                         {c}
//                                                                                     </MenuItem>
//                                                                                 ))}
//                                                                             </CustomSelect>
//                                                                         </Box>
//                                                                         <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                                             <CustomSelect
//                                                                                 label="Subcategory"
//                                                                                 value={sd.subcategory || ""}
//                                                                                 onChange={(e) => handleShippingChangeFn(i, j, 'subcategory')(e)}
//                                                                                 error={!!errors[`${recErrorsPrefix}.shippingDetails[${j}].subcategory`]}
//                                                                                 helperText={errors[`${recErrorsPrefix}.shippingDetails[${j}].subcategory`]}
//                                                                                 required
//                                                                                 renderValue={(selected) => selected || "Select Subcategory"}
//                                                                             >
//                                                                                 <MenuItem value="">Select Subcategory</MenuItem>
//                                                                                 {(categorySubMap[sd.category] || []).map((sc) => (
//                                                                                     <MenuItem key={sc} value={sc}>
//                                                                                         {sc}
//                                                                                     </MenuItem>
//                                                                                 ))}
//                                                                             </CustomSelect>
//                                                                             <CustomSelect
//                                                                                 label="Type"
//                                                                                 value={sd.type || ""}
//                                                                                 onChange={(e) => handleShippingChangeFn(i, j, 'type')(e)}
//                                                                                 error={!!errors[`${recErrorsPrefix}.shippingDetails[${j}].type`]}
//                                                                                 helperText={errors[`${recErrorsPrefix}.shippingDetails[${j}].type`]}
//                                                                                 required
//                                                                                 renderValue={(selected) => selected || "Select Type"}
//                                                                             >
//                                                                                 <MenuItem value="">Select Unit</MenuItem>
//                                                                                 {types.slice(1).map((t) => (
//                                                                                     <MenuItem key={t} value={t}>
//                                                                                         {t}
//                                                                                     </MenuItem>
//                                                                                 ))}
//                                                                             </CustomSelect>
//                                                                         </Box>
//                                                                         <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                                             <CustomTextField
//                                                                                 label="Total Number"
//                                                                                 value={sd.totalNumber || ""}
//                                                                                 onChange={(e) => handleShippingChangeFn(i, j, 'totalNumber')(e)}
//                                                                                 error={!!errors[`${recErrorsPrefix}.shippingDetails[${j}].totalNumber`]}
//                                                                                 helperText={errors[`${recErrorsPrefix}.shippingDetails[${j}].totalNumber`]}
//                                                                                 required
//                                                                             />
//                                                                             <CustomTextField
//                                                                                 label="Weight"
//                                                                                 value={sd.weight || ""}
//                                                                                 onChange={(e) => handleShippingChangeFn(i, j, 'weight')(e)}
//                                                                                 error={!!errors[`${recErrorsPrefix}.shippingDetails[${j}].weight`]}
//                                                                                 helperText={errors[`${recErrorsPrefix}.shippingDetails[${j}].weight`]}
//                                                                                 required
//                                                                             />
//                                                                         </Box>
//                                                                         <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                                             <CustomTextField
//                                                                                 label="Delivery Address"
//                                                                                 value={sd.deliveryAddress || ""}
//                                                                                 onChange={(e) => handleShippingChangeFn(i, j, 'deliveryAddress')(e)}
//                                                                                 error={!!errors[`${recErrorsPrefix}.shippingDetails[${j}].deliveryAddress`]}
//                                                                                 helperText={errors[`${recErrorsPrefix}.shippingDetails[${j}].deliveryAddress`]}
//                                                                                 fullWidth
//                                                                             />
//                                                                             <CustomTextField label="Ref Number" value={sd.itemRef || `REF-${i + 1}-${j + 1}`} disabled={true} />
//                                                                         </Box>
//                                                                     </Stack>
//                                                                 </Box>
//                                                             ))
//                                                         )}
//                                                         <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
//                                                             <Button
//                                                                 variant="outlined"
//                                                                 startIcon={<AddIcon />}
//                                                                 onClick={() => addShippingFn(i)}
//                                                             >
//                                                                 Add Shipping Detail
//                                                             </Button>
//                                                             <Button
//                                                                 variant="contained"
//                                                                 onClick={() => handleSaveShipping(i)}
//                                                             >
//                                                                 Save
//                                                             </Button>
//                                                         </Stack>
//                                                     </Stack>
//                                                 );

//                                                 return (
//                                                     <Box key={i} sx={{ p: 2, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
//                                                         <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
//                                                             <Typography variant="subtitle1" color="primary" fontWeight={"bold"}>
//                                                                 {typePrefix} {i + 1}
//                                                             </Typography>
//                                                             <Stack direction="row" spacing={1}>

//                                                                     <>
//                                                                         <IconButton
//                                                                             onClick={() => duplicateRecFn(i)}
//                                                                             size="small"
//                                                                             title="Duplicate"
//                                                                         >
//                                                                             <CopyIcon />
//                                                                         </IconButton>
//                                                                         {currentList.length > 1 && (
//                                                                             <IconButton
//                                                                                 onClick={() => removeRecFn(i)}
//                                                                                 size="small"
//                                                                                 title="Delete"
//                                                                             >
//                                                                                 <DeleteIcon />
//                                                                             </IconButton>
//                                                                         )}
//                                                                     </>

//                                                             </Stack>
//                                                         </Stack>
//                                                         {/* Show validation warnings if present */}
//                                                         {rec.validationWarnings && (
//                                                             <Alert severity="warning" sx={{ mb: 2 }}>
//                                                                 {Object.entries(rec.validationWarnings)
//                                                                     .map(([key, msg]) => `${snakeToCamel(key).replace(/([A-Z])/g, ' $1').trim()}: ${msg}`)
//                                                                     .join('; ')}
//                                                             </Alert>
//                                                         )}
//                                                         {/* Dynamic: Basic Info */}
//                                                         <Box
//                                                             sx={{
//                                                                 display: 'flex',
//                                                                 flexDirection: { xs: 'column', sm: 'row' },
//                                                                 gap: 2,
//                                                                 alignItems: 'stretch',
//                                                             }}
//                                                         >
//                                                             <CustomTextField
//                                                                 label={`${typePrefix} Name`}
//                                                                 value={isSenderMode ? rec.senderName : rec.receiverName}
//                                                                 onChange={handleRecNameChange}
//                                                                 error={!!errors[`${recErrorsPrefix}.${isSenderMode ? 'senderName' : 'receiverName'}`]}
//                                                                 helperText={errors[`${recErrorsPrefix}.${isSenderMode ? 'senderName' : 'receiverName'}`]}
//                                                                 required
//                                                                 disabled={isFieldDisabled(`${recDisabledPrefix}.${isSenderMode ? 'senderName' : 'receiverName'}`)}
//                                                             />
//                                                             <CustomTextField
//                                                                 label={`${typePrefix} Contact`}
//                                                                 value={isSenderMode ? rec.senderContact : rec.receiverContact}
//                                                                 onChange={handleRecContactChange}
//                                                                 error={!!errors[`${recErrorsPrefix}.${isSenderMode ? 'senderContact' : 'receiverContact'}`]}
//                                                                 helperText={errors[`${recErrorsPrefix}.${isSenderMode ? 'senderContact' : 'receiverContact'}`]}
//                                                                 disabled={isFieldDisabled(`${recDisabledPrefix}.${isSenderMode ? 'senderContact' : 'receiverContact'}`)}
//                                                             />
//                                                         </Box>
//                                                         <Box
//                                                             sx={{
//                                                                 display: 'flex',
//                                                                 py: 2,
//                                                                 flexDirection: { xs: 'column', sm: 'row' },
//                                                                 gap: 2,
//                                                                 alignItems: 'stretch',
//                                                             }}
//                                                         >
//                                                             <CustomTextField
//                                                                 label={`${typePrefix} Address`}
//                                                                 value={isSenderMode ? rec.senderAddress : rec.receiverAddress}
//                                                                 onChange={handleRecAddressChange}
//                                                                 error={!!errors[`${recErrorsPrefix}.${isSenderMode ? 'senderAddress' : 'receiverAddress'}`]}
//                                                                 helperText={errors[`${recErrorsPrefix}.${isSenderMode ? 'senderAddress' : 'receiverAddress'}`]}
//                                                                 disabled={isFieldDisabled(`${recDisabledPrefix}.${isSenderMode ? 'senderAddress' : 'receiverAddress'}`)}
//                                                             />
//                                                             <CustomTextField
//                                                                 label={`${typePrefix} Email`}
//                                                                 value={isSenderMode ? rec.senderEmail : rec.receiverEmail}
//                                                                 onChange={handleRecEmailChange}
//                                                                 error={!!errors[`${recErrorsPrefix}.${isSenderMode ? 'senderEmail' : 'receiverEmail'}`]}
//                                                                 helperText={errors[`${recErrorsPrefix}.${isSenderMode ? 'senderEmail' : 'receiverEmail'}`]}
//                                                                 disabled={isFieldDisabled(`${recDisabledPrefix}.${isSenderMode ? 'senderEmail' : 'receiverEmail'}`)}
//                                                             />
//                                                         </Box>
//                                                         {renderShippingSection()}
//                                                     </Box>
//                                                 );
//                                             };

//                                             // Always render the list (assumes >=1 items via state enforcement)
//                                             return currentList.map((rec, i) => renderRecForm(rec, i));
//                                         })()}
//                                         <Button
//                                             variant="outlined"
//                                             startIcon={<AddIcon />}
//                                             onClick={formData.senderType === 'receiver' ? addSender : addReceiver}
//                                             sx={{ alignSelf: 'flex-start' }}
//                                         >
//                                             {formData.senderType === 'receiver' ? 'Add Sender' : 'Add Receiver'}
//                                         </Button>
//                                     </Stack>
//                                 </AccordionDetails>
//                             </Accordion>
//                             <Accordion
//                                 expanded={expanded.has("panel3")}
//                                 onChange={handleAccordionChange("panel3")}
//                                 sx={{
//                                     borderRadius: 2,
//                                     boxShadow: "none",
//                                     "&:before": { display: "none" },
//                                     "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
//                                 }}
//                             >
//                                 <AccordionSummary
//                                     expandIcon={<ExpandMoreIcon />}
//                                     sx={{
//                                         bgcolor: expanded.has("panel3") ? "#0d6c6a" : "#fff3e0",
//                                         borderRadius: 2,
//                                         "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded.has("panel3") ? "#fff" : "#f58220" },
//                                     }}
//                                 >
//                                     3. Transport
//                                 </AccordionSummary>
//                                 <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
//                                     <Stack spacing={3}>
//                                         <FormControl component="fieldset" error={!!errors.transportType}>
//                                             <Typography variant="h6" color="#f58220" gutterBottom>
//                                                 Transport Type
//                                             </Typography>
//                                             <RadioGroup
//                                                 name="transportType"
//                                                 value={formData.transportType}
//                                                 onChange={handleChange}
//                                                 style={{ flexDirection: "row" }}
//                                             >
//                                                 <FormControlLabel value="Drop Off" control={<Radio />} label="Drop Off" />
//                                                 <FormControlLabel value="Collection" control={<Radio />} label="Collection" />
//                                                 <FormControlLabel value="Third Party" control={<Radio />} label="Third Party" />
//                                             </RadioGroup>
//                                             {errors.transportType && <Typography variant="caption" color="error">{errors.transportType}</Typography>}
//                                         </FormControl>
//                                         {formData.transportType === 'Drop Off' && (
//                                             <Stack spacing={2}>
//                                                 <Typography variant="h6" color="#f58220" gutterBottom>
//                                                     🧭 Drop-Off Details
//                                                 </Typography>
//                                                 <CustomSelect
//                                                     label="Drop Method"
//                                                     name="dropMethod"
//                                                     value={formData.dropMethod || ""}
//                                                     onChange={handleChange}
//                                                     error={!!errors.dropMethod}
//                                                     renderValue={(selected) => selected || "Select Drop Method"}
//                                                 >
//                                                     <MenuItem value="">Select Drop Method</MenuItem>
//                                                     <MenuItem value="Drop-Off">Drop-Off</MenuItem>
//                                                     <MenuItem value="RGSL Pickup">RGSL Pickup</MenuItem>
//                                                 </CustomSelect>
//                                                 <Stack spacing={2}>
//                                                     <CustomTextField
//                                                         label="Person Name"
//                                                         name="dropoffName"
//                                                         value={formData.dropoffName}
//                                                         onChange={handleChange}
//                                                         error={!!errors.dropoffName}
//                                                         helperText={errors.dropoffName}
//                                                         required={formData.dropMethod === 'Drop-Off'}
//                                                     />
//                                                     <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                         <CustomTextField
//                                                             label="CNIC/ID"
//                                                             name="dropOffCnic"
//                                                             value={formData.dropOffCnic}
//                                                             onChange={handleChange}
//                                                             error={!!errors.dropOffCnic}
//                                                             helperText={errors.dropOffCnic}
//                                                             required={formData.dropMethod === 'Drop-Off'}
//                                                         />
//                                                         <CustomTextField
//                                                             label="Mobile"
//                                                             name="dropOffMobile"
//                                                             value={formData.dropOffMobile}
//                                                             onChange={handleChange}
//                                                             error={!!errors.dropOffMobile}
//                                                             helperText={errors.dropOffMobile}
//                                                             required={formData.dropMethod === 'Drop-Off'}
//                                                         />
//                                                     </Box>
//                                                 </Stack>
//                                                 <CustomTextField
//                                                     label="Plate No (optional)"
//                                                     name="plateNo"
//                                                     value={formData.plateNo}
//                                                     onChange={handleChange}
//                                                     error={!!errors.plateNo}
//                                                     helperText={errors.plateNo}
//                                                 />
//                                                 <CustomTextField
//                                                     label="Drop Date"
//                                                     name="dropDate"
//                                                     type="date"
//                                                     value={formData.dropDate}
//                                                     onChange={handleChange}
//                                                     InputLabelProps={{ shrink: true }}
//                                                     error={!!errors.dropDate}
//                                                     helperText={errors.dropDate}
//                                                     required
//                                                 />
//                                             </Stack>
//                                         )}
//                                         {formData.transportType === 'Collection' && (
//                                             <Stack spacing={2}>
//                                                 <Typography variant="h6" color="#f58220" gutterBottom>
//                                                     🚛 Collection Details
//                                                 </Typography>
//                                                 <CustomSelect
//                                                     label="Collection Method"
//                                                     name="collectionMethod"
//                                                     value={formData.collectionMethod || ""}
//                                                     onChange={handleChange}
//                                                     error={!!errors.collectionMethod}
//                                                     renderValue={(selected) => selected || "Select Collection Method"}
//                                                 >
//                                                     <MenuItem value="">Select Collection Method</MenuItem>
//                                                     <MenuItem value="Delivered by RGSL">Delivered by RGSL</MenuItem>
//                                                     <MenuItem value="Collected by Client">Collected by Client</MenuItem>
//                                                 </CustomSelect>
//                                                 <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                     <CustomSelect
//                                                         label="Full / Partial"
//                                                         name="collection_scope"
//                                                         value={formData.collection_scope || "Partial"}
//                                                         onChange={handleChange}
//                                                         error={!!errors.collection_scope}
//                                                         helperText={errors.collection_scope}
//                                                     >
//                                                         <MenuItem value="Full">Full</MenuItem>
//                                                         <MenuItem value="Partial">Partial</MenuItem>
//                                                     </CustomSelect>
//                                                     {formData.collection_scope === "Partial" && (
//                                                         <CustomTextField
//                                                             label="Qty Delivered"
//                                                             name="qtyDelivered"
//                                                             value={formData.qtyDelivered || ""}
//                                                             onChange={handleChange}
//                                                             error={!!errors.qtyDelivered}
//                                                             helperText={errors.qtyDelivered}
//                                                         />
//                                                     )}
//                                                 </Box>
//                                                 <Stack spacing={2}>
//                                                     <CustomTextField
//                                                         label="Receiver Name / CNIC/ID"
//                                                         name="clientReceiverName"
//                                                         value={formData.clientReceiverName}
//                                                         onChange={handleChange}
//                                                         error={!!errors.clientReceiverName}
//                                                         helperText={errors.clientReceiverName}
//                                                         required={formData.collectionMethod === 'Collected by Client'}
//                                                     />
//                                                     <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                         <CustomTextField
//                                                             label="Receiver ID"
//                                                             name="clientReceiverId"
//                                                             value={formData.clientReceiverId}
//                                                             onChange={handleChange}
//                                                             error={!!errors.clientReceiverId}
//                                                             helperText={errors.clientReceiverId}
//                                                             required={formData.collectionMethod === 'Collected by Client'}
//                                                         />
//                                                         <CustomTextField
//                                                             label="Receiver Mobile"
//                                                             name="clientReceiverMobile"
//                                                             value={formData.clientReceiverMobile}
//                                                             onChange={handleChange}
//                                                             error={!!errors.clientReceiverMobile}
//                                                             helperText={errors.clientReceiverMobile}
//                                                             required={formData.collectionMethod === 'Collected by Client'}
//                                                         />
//                                                     </Box>
//                                                     <CustomTextField
//                                                         label="Plate No (optional)"
//                                                         name="plateNo"
//                                                         value={formData.plateNo}
//                                                         onChange={handleChange}
//                                                         error={!!errors.plateNo}
//                                                         helperText={errors.plateNo}
//                                                     />
//                                                 </Stack>
//                                                 <CustomTextField
//                                                     label="Delivery Date"
//                                                     name="deliveryDate"
//                                                     type="date"
//                                                     value={formData.deliveryDate}
//                                                     onChange={handleChange}
//                                                     InputLabelProps={{ shrink: true }}
//                                                     error={!!errors.deliveryDate}
//                                                     helperText={errors.deliveryDate}
//                                                     required
//                                                 />
//                                                 <Button
//                                                     variant="outlined"
//                                                     component="label"
//                                                     sx={{ borderRadius: 2, borderColor: "#f58220", color: "#f58220", px: 3 }}
//                                                 >
//                                                     Gatepass Upload (Optional)
//                                                     <input type="file" hidden multiple onChange={handleGatepassUpload} />
//                                                 </Button>
//                                                 {Array.isArray(formData.gatepass) && formData.gatepass.length > 0 && (
//                                                     <Stack spacing={1} direction="row" flexWrap="wrap" gap={1}>
//                                                         {formData.gatepass.map((gatepass, j) => {
//                                                             const src = typeof gatepass === 'string' ? gatepass : URL.createObjectURL(gatepass);
//                                                             const label = typeof gatepass === 'string' ? gatepass.split('/').pop() : gatepass.name || 'File';
//                                                             return (
//                                                                 <Chip
//                                                                     key={j}
//                                                                     label={label}
//                                                                     color="secondary"
//                                                                     size="small"
//                                                                     variant="outlined"
//                                                                     onClick={() => {
//                                                                         setPreviewSrc(src);
//                                                                         setPreviewOpen(true);
//                                                                     }}
//                                                                     sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f58220', color: 'white' } }}
//                                                                 />
//                                                             );
//                                                         })}
//                                                     </Stack>
//                                                 )}
//                                             </Stack>
//                                         )}
//                                         {formData.transportType === 'Third Party' && (
//                                             <Stack spacing={2}>
//                                                 <Typography variant="h6" color="#f58220" gutterBottom>
//                                                     👥 Third Party Details
//                                                 </Typography>
//                                                 <CustomSelect
//                                                     label="3rd party Transport Company"
//                                                     name="thirdPartyTransport"
//                                                     value={formData.thirdPartyTransport || ""}
//                                                     onChange={handleChange}
//                                                     error={!!errors.thirdPartyTransport}
//                                                     helperText={errors.thirdPartyTransport}
//                                                     renderValue={(selected) => selected || "Select Company"}
//                                                 >
//                                                     {companies.map((c) => (
//                                                         <MenuItem key={c} value={c}>
//                                                             {c}
//                                                         </MenuItem>
//                                                     ))}
//                                                 </CustomSelect>
//                                                 <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                     <CustomTextField
//                                                         label="Driver Name"
//                                                         name="driverName"
//                                                         value={formData.driverName}
//                                                         onChange={handleChange}
//                                                         error={!!errors.driverName}
//                                                         helperText={errors.driverName}
//                                                         required
//                                                     />
//                                                     <CustomTextField
//                                                         label="Driver Contact number"
//                                                         name="driverContact"
//                                                         value={formData.driverContact}
//                                                         onChange={handleChange}
//                                                         error={!!errors.driverContact}
//                                                         helperText={errors.driverContact}
//                                                         required
//                                                     />
//                                                 </Box>
//                                                 <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
//                                                     <CustomTextField
//                                                         label="Driver NIC Number"
//                                                         name="driverNic"
//                                                         value={formData.driverNic}
//                                                         onChange={handleChange}
//                                                         error={!!errors.driverNic}
//                                                         helperText={errors.driverNic}
//                                                         required
//                                                     />
//                                                     <CustomTextField
//                                                         label="Driver Pickup Location"
//                                                         name="driverPickupLocation"
//                                                         value={formData.driverPickupLocation}
//                                                         onChange={handleChange}
//                                                         error={!!errors.driverPickupLocation}
//                                                         helperText={errors.driverPickupLocation}
//                                                         required
//                                                     />
//                                                 </Box>
//                                                 <CustomTextField
//                                                     label="Truck number"
//                                                     name="truckNumber"
//                                                     value={formData.truckNumber}
//                                                     onChange={handleChange}
//                                                     error={!!errors.truckNumber}
//                                                     helperText={errors.truckNumber}
//                                                     required
//                                                 />
//                                             </Stack>
//                                         )}
//                                     </Stack>
//                                 </AccordionDetails>
//                             </Accordion>
//                             <Accordion
//                                 expanded={expanded.has("panel4")}
//                                 onChange={handleAccordionChange("panel4")}
//                                 sx={{
//                                     borderRadius: 2,
//                                     boxShadow: "none",
//                                     "&:before": { display: "none" },
//                                     "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
//                                 }}
//                             >
//                                 <AccordionSummary
//                                     expandIcon={<ExpandMoreIcon />}
//                                     sx={{
//                                         bgcolor: expanded.has("panel4") ? "#0d6c6a" : "#fff3e0",
//                                         borderRadius: 2,
//                                         "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded.has("panel4") ? "#fff" : "#f58220" },
//                                     }}
//                                 >
//                                     4. Order Summary
//                                 </AccordionSummary>
//                                 <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
//                                     <Stack spacing={2}>
//                                         <Stack direction="row" justifyContent="space-between" alignItems="center">
//                                             <Typography variant="body1" fontWeight="medium">Booking Ref:</Typography>
//                                             <Chip label={formData.bookingRef || "-"} variant="outlined" color="primary" />
//                                         </Stack>
//                                         <Stack direction="row" justifyContent="space-between" alignItems="center">
//                                             <Typography variant="body1" fontWeight="medium">Point of Origin:</Typography>
//                                             <Typography variant="body1">{formData.pointOfOrigin || "-"}</Typography>
//                                         </Stack>
//                                         <Stack direction="row" justifyContent="space-between" alignItems="center">
//                                             <Typography variant="body1" fontWeight="medium">Place of Loading:</Typography>
//                                             <Typography variant="body1">{formData.placeOfLoading || "-"}</Typography>
//                                         </Stack>
//                                         <Stack direction="row" justifyContent="space-between" alignItems="center">
//                                             <Typography variant="body1" fontWeight="medium">Final Destination:</Typography>
//                                             <Typography variant="body1">{formData.finalDestination || "-"}</Typography>
//                                         </Stack>
//                                         <Stack direction="row" justifyContent="space-between" alignItems="center">
//                                             <Typography variant="body1" fontWeight="medium">Owner:</Typography>
//                                             <Typography variant="body1">{ownerName || "-"}</Typography>
//                                         </Stack>
//                                         <Stack spacing={1}>
//                                             <Typography variant="body1" fontWeight="medium">{formData.senderType === 'sender' ? 'Receivers:' : 'Senders:'}</Typography>
//                                             {(formData.senderType === 'sender' ? formData.receivers : formData.senders).map((rec, i) => (
//                                                 <Stack direction="row" justifyContent="space-between" alignItems="center" key={i}>
//                                                     <Chip sx={{ p: 2 }} label={formData.senderType === 'sender' ? rec.receiverName : rec.senderName || `${formData.senderType === 'sender' ? 'Receiver' : 'Sender'} ${i + 1}`} size="small" color="primary" variant="outlined" />
//                                                     <Typography variant="body2" color="text.secondary">
//                                                         Delivered: {rec.qtyDelivered || 0} / { (rec.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0) } items
//                                                     </Typography>
//                                                 </Stack>
//                                             ))}
//                                         </Stack>
//                                         {formData.receivers.some(rec => rec.containers && rec.containers.length > 0) && (
//                                             <Stack spacing={1}>
//                                                 <Typography variant="body1" fontWeight="medium">Assigned Containers:</Typography>
//                                                 {formData.receivers.flatMap(rec => rec.containers || []).map((cont, i) => (
//                                                     <Stack direction="row" justifyContent="space-between" alignItems="center" key={i}>
//                                                         <Chip sx={{ p: 2 }} label={cont} color="info" size="small" variant="outlined" />
//                                                     </Stack>
//                                                 ))}
//                                             </Stack>
//                                         )}
//                                         {/* New: Global Totals */}
//                                         <Divider />
//                                         <Stack direction="row" justifyContent="space-between" alignItems="center">
//                                             <Typography variant="body1" fontWeight="medium">Total Items (All {formData.senderType === 'sender' ? 'Receivers' : 'Senders'}):</Typography>
//                                             <Chip label={formData.globalTotalItems || "-"} variant="outlined" color="success" />
//                                         </Stack>
//                                         <Stack direction="row" justifyContent="space-between" alignItems="center">
//                                             <Typography variant="body1" fontWeight="medium">Shipping Line:</Typography>
//                                             <Typography variant="body1">{firstPanel2Item.shippingLine || "-"}</Typography>
//                                         </Stack>
//                                         <Stack direction="row" justifyContent="space-between" alignItems="center">
//                                             <Typography variant="body1" fontWeight="medium">ETA:</Typography>
//                                             <Typography variant="body1">{firstPanel2Item.eta || "-"}</Typography>
//                                         </Stack>
//                                         <Stack direction="row" justifyContent="space-between" alignItems="center">
//                                             <Typography variant="body1" fontWeight="medium">Transport Type:</Typography>
//                                             <Typography variant="body1">{formData.transportType || "-"}</Typography>
//                                         </Stack>
//                                     </Stack>
//                                 </AccordionDetails>
//                             </Accordion>
//                             <Accordion
//                                 expanded={expanded.has("panel5")}
//                                 onChange={handleAccordionChange("panel5")}
//                                 sx={{
//                                     borderRadius: 2,
//                                     boxShadow: "none",
//                                     "&:before": { display: "none" },
//                                     "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
//                                 }}
//                             >
//                                 <AccordionSummary
//                                     expandIcon={<ExpandMoreIcon />}
//                                     sx={{
//                                         bgcolor: expanded.has("panel5") ? "#0d6c6a" : "#fff3e0",
//                                         borderRadius: 2,
//                                         "& .MuiAccordionSummary-content": { fontWeight: "bold", color: expanded.has("panel5") ? "#fff" : "#f58220" },
//                                     }}
//                                 >
//                                     5. Attachments
//                                 </AccordionSummary>
//                                 <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
//                                     <Stack spacing={2}>
//                                         <Button
//                                             variant="outlined"
//                                             component="label"
//                                             sx={{ borderRadius: 2, borderColor: "#f58220", color: "#f58220", px: 3 }}
//                                         >
//                                             Upload File
//                                             <input type="file" hidden multiple onChange={handleFileUpload} />
//                                         </Button>
//                                         {Array.isArray(formData.attachments) && formData.attachments.length > 0 && (
//                                             <Stack spacing={1} direction="row" flexWrap="wrap" gap={1}>
//                                                 {formData.attachments.map((attachment, i) => {
//                                                     const src = typeof attachment === 'string' ? attachment : URL.createObjectURL(attachment);
//                                                     const label = typeof attachment === 'string' ? attachment.split('/').pop() : attachment.name || 'File';
//                                                     return (
//                                                         <Chip
//                                                             key={i}
//                                                             label={label}
//                                                             color="secondary"
//                                                             size="small"
//                                                             variant="outlined"
//                                                             onClick={() => {
//                                                                 setPreviewSrc(src);
//                                                                 setPreviewOpen(true);
//                                                             }}
//                                                             sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f58220', color: 'white' } }}
//                                                         />
//                                                     );
//                                                 })}
//                                             </Stack>
//                                         )}
//                                     </Stack>
//                                 </AccordionDetails>
//                             </Accordion>
//                         </Stack>
//                         {/* Bottom Buttons */}
//                         <Stack direction="row" justifyContent="flex-end" gap={2} mt={4} pt={3} borderTop="1px solid #e0e0e0">
//                             <Button
//                                 onClick={() => generateOrderPDF(selectedOrder)}
//                                 variant="outlined"
//                                 size="small"
//                                 startIcon={<DownloadIcon />}
//                                 sx={{ borderRadius: 2, borderColor: "#f58220", color: "#f58220" }}
//                             >
//                                 Print Consignment Manifest
//                             </Button>
//                         </Stack>
//                     </Box>
//                 </Paper>
//                 {/* Preview Modal */}
//                 <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
//                     <DialogTitle>
//                         File Preview
//                         <IconButton
//                             onClick={() => setPreviewOpen(false)}
//                             sx={{ position: 'absolute', right: 8, top: 8 }}
//                         >
//                             <CloseIcon />
//                         </IconButton>
//                     </DialogTitle>
//                     <DialogContent sx={{ p: 2 }}>
//                         {previewSrc && (
//                             <img
//                                 src={previewSrc}
//                                 alt="Preview"
//                                 style={{
//                                     width: '100%',
//                                     height: 'auto',
//                                     maxHeight: '70vh',
//                                     objectFit: 'contain',
//                                     borderRadius: 2,
//                                     boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
//                                 }}
//                                 onLoad={() => console.log('Preview loaded:', previewSrc)}
//                                 onError={(e) => {
//                                     e.target.style.display = 'none';
//                                     setSnackbar({
//                                         open: true,
//                                         message: 'Failed to load file. Check URL or file type.',
//                                         severity: 'error'
//                                     });
//                                 }}
//                             />
//                         )}
//                         {!previewSrc.startsWith('blob:') && previewSrc.endsWith('.pdf') && (
//                             <a href={previewSrc} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', mt: 2 }}>
//                                 <Button variant="outlined" startIcon={<DownloadIcon />}>Open PDF</Button>
//                             </a>
//                         )}
//                     </DialogContent>
//                 </Dialog>
//                 {/* Snackbar for notifications */}
//                 <Snackbar
//                     open={snackbar.open}
//                     autoHideDuration={6000}
//                     onClose={handleSnackbarClose}
//                     anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//                 >
//                     <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
//                         {snackbar.message}
//                     </Alert>
//                 </Snackbar>
//             </>
//     );
// };

// export default OrderForm;


import { useState, useEffect, useCallback, useMemo } from "react";
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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
// import { Delete } from "@mui/icons-material";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
    const [categorySubMap, setCategorySubMap] = useState({});
    const [types, setTypes] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [places, setPlaces] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [companies, setCompanies] = useState([]);
    const orderId = location.state?.orderId;
    const [isEditMode, setIsEditMode] = useState(!!orderId);
    const containerOptions = location.state?.containers || [];
    const getStatusColors = location.state?.getStatusColors || (() => ({}));
    // const ownerName = location.state?.ownerName || '';
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
        // Owner fields (both sender and receiver)
        senderName: "",
        senderContact: "",
        senderAddress: "",
        senderEmail: "",
        senderRef: "",
        senderRemarks: "",
        receiverName: "",
        receiverContact: "",
        receiverAddress: "",
        receiverEmail: "",
        receiverRef: "",
        receiverRemarks: "",
        // Senders array
        senders: [],
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
        collection_scope: "Partial",
        fullPartial: "", // Deprecated
        qtyDelivered: "", // Deprecated
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
        'collectionMethod', 'collection_scope', 'qtyDelivered', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate',
        'thirdPartyTransport', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber',
        // Per-receiver partials and shipping
        'receivers[].fullPartial', 'receivers[].qtyDelivered', 'receivers[].shippingDetails[].totalNumber',
        'senders[].fullPartial', 'senders[].qtyDelivered', 'senders[].shippingDetails[].totalNumber'
    ];
    // Required fields validation
    const requiredFields = [
        'rglBookingNumber', 'pointOfOrigin', 'placeOfLoading', 'finalDestination', 'placeOfDelivery'
    ];


    const [options2, setOptions2] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [options3, setOptions3] = useState([]);
    const [searchTerm3, setSearchTerm3] = useState('');

    // Fetch customers on mount or search change
    useEffect(() => {
        const fetchCustomers = async () => {
            // setLoading(true);
            try {
                const params = new URLSearchParams({ search: searchTerm3 ? searchTerm3 : 'All', limit: 5000 });
                const response = await api.get(`/api/customers?${params}`); // Adjust endpoint as needed
                //   const data = await response.json();
                setOptions3(response.data);
            } catch (error) {
                console.error('Error fetching customers:', error);
            } finally {
                setLoading(false);
            }
        };

        if (searchTerm3.length >= 2 || options3.length === 0) { // Debounce: search after 2 chars or initial load
            fetchCustomers();
        }
    }, [searchTerm3]);

    // Fetch customers on mount or search change
    useEffect(() => {
        const fetchCustomers = async () => {
            // setLoading(true);
            try {
                const params = new URLSearchParams({ search: searchTerm ? searchTerm : 'All', limit: 5000 });
                const response = await api.get(`/api/customers?${params}`); // Adjust endpoint as needed
                ;
                console.log('Fetched customers for options2:', response.data);
                setOptions2(response.data);
            } catch (err) {
                console.error('Error fetching customers:', err);
            } finally {
                setLoading(false);
            }
        };

        if (searchTerm.length >= 2 || options2.length === 0) { // Debounce: search after 2 chars or initial load
            fetchCustomers();
        }
    }, [searchTerm]);

    const typePrefix = formData.senderType === 'receiver' ? 'Receiver' : 'Sender';
    const fieldPrefix = formData.senderType === 'sender' ? 'sender' : 'receiver';

    const handleSelectOwner = async (event, value) => {
        console.log('Selected customer value:', value);
        //   const fetchCustomer = async () => {
        try {
            const res = await api.get(`/api/customers/${value.zoho_id || value.id}`);
            console.log('Customer data:', res);

            if (res && res.data.contact_persons) {
                const c = res.data;
                setFormData(prev => ({
                    ...prev,
                    //   [`${fieldPrefix}Name`]: res.data.name || '',
                    [`${fieldPrefix}Contact`]: c.contact_persons[0].phone || c.contact || '', // Assume primary_phone or fallback
                    [`${fieldPrefix}Address`]: c.contact_persons[0].name || c.billing_address || '',
                    [`${fieldPrefix}Email`]: c.email || '',
                    [`${fieldPrefix}Ref`]: c.zoho_id || '', // Or custom ref field
                    [`${fieldPrefix}Remarks`]: c.zoho_notes || c.system_notes || '',
                    selectedSenderOwner: c.zoho_id || c.id, // Use unique ID
                }));
            } else {
                // Clear on deselect
                setFormData(prev => ({
                    ...prev,
                    //   [`${fieldPrefix}Name`]: '',
                    [`${fieldPrefix}Contact`]: '',
                    [`${fieldPrefix}Address`]: '',
                    [`${fieldPrefix}Email`]: '',
                    [`${fieldPrefix}Ref`]: '',
                    [`${fieldPrefix}Remarks`]: '',
                    selectedSenderOwner: '',
                }));
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);
        }
    };

    // Helper to convert snake_case to camelCase
    const snakeToCamel = (str) => str.replace(/(_[a-z])/g, g => g[1].toUpperCase());
    // Helper to convert camelCase to snake_case
    const camelToSnake = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();


    // Auto generate bookingRef and rglBookingNumber for new orders
    // Auto generate bookingRef, rgslBookingRef, and rglBookingNumber for new orders
    useEffect(() => {
        if (!isEditMode && !formData.bookingRef) {
            const timestamp = Date.now();
            const randomLast3 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const timestampWithRandom = timestamp.toString().slice(0, 5);

            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
            const autoPart = `${today}-${randomSuffix}`;

            const bookingRef = `RGSL-${timestampWithRandom}-${randomLast3}`;
            // const rgslBookingRef = `RGSL-ORD-${today}-${randomLast3}`;
            // const rglBookingNumber = `RGSL-ORD-${randomSuffix}${today}`;

            setFormData(prev => ({
                ...prev,
                bookingRef,
                // rgslBookingRef,
                // rglBookingNumber
            }));
        }
    }, [isEditMode]);
    // Compute global totals dynamically
    useEffect(() => {
        const items = formData.senderType === 'sender' ? formData.receivers : formData.senders;
        let total = 0;
        let remaining = 0;
        items.forEach(rec => {
            const recTotal = (rec.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
            const recDelivered = parseInt(rec.qtyDelivered || 0) || 0;
            const recRemaining = Math.max(0, recTotal - recDelivered);
            total += recTotal;
            remaining += recRemaining;
        });
        setFormData(prev => ({ ...prev, globalTotalItems: total, globalRemainingItems: remaining }));
    }, [formData.senderType, formData.receivers, formData.senders]);
    // Compute remaining items dep
    const remainingDep = useMemo(() => {
        const items = formData.senderType === 'sender' ? formData.receivers : formData.senders;
        return items.flatMap(rec =>
            (rec.shippingDetails || []).map(sd => `${sd.totalNumber || ''}-${rec.qtyDelivered || ''}-${rec.fullPartial || ''}`)
        ).join(',');
    }, [formData.senderType, formData.receivers, formData.senders]);
    // Compute per-item remaining dynamically
    useEffect(() => {
        const listKey = formData.senderType === 'sender' ? 'receivers' : 'senders';
        setFormData(prev => ({
            ...prev,
            [listKey]: prev[listKey].map(rec => {
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
    }, [remainingDep, formData.senderType]);

    const ownerNameKey = formData.senderType === 'sender' ? 'senderName' : 'receiverName';
    useEffect(() => {
        if (isEditMode && formData.selectedSenderOwner) {
            // const ownerNameKey = formData.senderType === 'sender' ? 'senderName' : 'receiverName';
            if (!formData[ownerNameKey]?.trim()) {
                // Auto-fetch customer details if name empty but ID present
                handleSelectOwner(null, { zoho_id: formData.selectedSenderOwner }); // Mock event/value to trigger fetch
            }
        }
    }, [isEditMode, formData.selectedSenderOwner, formData.senderType]);
    const validateForm = () => {
        const newErrors = {};
        // Core required fields
        const coreRequired = ['rglBookingNumber', 'pointOfOrigin', 'placeOfLoading', 'placeOfDelivery', 'finalDestination'];
        coreRequired.forEach(field => {
            if (!formData[field]?.trim()) {
                newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
            }
        });

        // Validate owner name
        if (!formData[ownerNameKey]?.trim() && formData.selectedSenderOwner) {
            newErrors[ownerNameKey] = 'Owner name is recommended (fetch from selected ID)';
        }
        const ownerContactKey = formData.senderType === 'sender' ? 'senderContact' : 'receiverContact';
        // if (!formData[ownerContactKey]?.trim()) {
        //     newErrors[ownerContactKey] = 'Owner contact is required';
        // }
        const ownerAddressKey = formData.senderType === 'sender' ? 'senderAddress' : 'receiverAddress';
        // if (!formData[ownerAddressKey]?.trim()) {
        //     newErrors[ownerAddressKey] = 'Owner address is required';
        // }
        // Validate senderType
        if (!formData.senderType) {
            newErrors.senderType = 'Sender Type is required';
        }
        // Dynamic validation for panel2
        const isSenderMode = formData.senderType === 'receiver';
        const items = isSenderMode ? formData.senders : formData.receivers;
        const itemsKey = isSenderMode ? 'senders' : 'receivers';
        const itemPrefix = isSenderMode ? 'Sender' : 'Receiver';
        // if (items.length === 0) {
        //     newErrors[itemsKey] = `At least one ${itemPrefix.toLowerCase()} is required`;
        // } else {
        //     items.forEach((item, i) => {
        //         const nameField = isSenderMode ? 'senderName' : 'receiverName';
        //         const contactField = isSenderMode ? 'senderContact' : 'receiverContact';
        //         const addressField = isSenderMode ? 'senderAddress' : 'receiverAddress';
        //         const emailField = isSenderMode ? 'senderEmail' : 'receiverEmail';
        //         if (!item[nameField]?.trim()) {
        //             newErrors[`${itemsKey}[${i}].${nameField}`] = `${itemPrefix} ${i + 1} name is required`;
        //         }
        //         if (!item[contactField]?.trim()) {
        //             newErrors[`${itemsKey}[${i}].${contactField}`] = `${itemPrefix} ${i + 1} contact is required`;
        //         }
        //         if (!item[addressField]?.trim()) {
        //             newErrors[`${itemsKey}[${i}].${addressField}`] = `${itemPrefix} ${i + 1} address is required`;
        //         }
        //         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        //         if (item[emailField] && !emailRegex.test(item[emailField])) {
        //             newErrors[`${itemsKey}[${i}].${emailField}`] = `Invalid ${itemPrefix.toLowerCase()} ${i + 1} email format`;
        //         }
        //         // if (!item.eta?.trim()) {
        //         //     newErrors[`${itemsKey}[${i}].eta`] = `ETA is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
        //         // }
        //         // if (!item.etd?.trim()) {
        //         //     newErrors[`${itemsKey}[${i}].etd`] = `ETD is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
        //         // }
        //         // if (!item.shippingLine?.trim()) {
        //         // newErrors[`${itemsKey}[${i}].shippingLine`] = `Shipping Line is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
        //         // }
        //         // Validate each shippingDetail
        //         const shippingDetails = item.shippingDetails || [];
        //         if (shippingDetails.length === 0) {
        //             newErrors[`${itemsKey}[${i}].shippingDetails`] = `At least one shipping detail is required for ${itemPrefix.toLowerCase()} ${i + 1}`;
        //         } else {
        //             shippingDetails.forEach((sd, j) => {
        //                 const shippingRequiredFields = ['pickupLocation', 'category', 'subcategory', 'type', 'deliveryAddress', 'totalNumber', 'weight'];
        //                 shippingRequiredFields.forEach(field => {
        //                     if (!sd[field]?.trim()) {
        //                         newErrors[`${itemsKey}[${i}].shippingDetails[${j}].${field}`] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required for shipping detail ${j + 1}`;
        //                     }
        //                 });
        //                 const totalNum = parseInt(sd.totalNumber);
        //                 if (isNaN(totalNum) || totalNum <= 0) {
        //                     newErrors[`${itemsKey}[${i}].shippingDetails[${j}].totalNumber`] = `Total Number must be a positive number`;
        //                 }
        //                 if (sd.weight && (isNaN(parseFloat(sd.weight)) || parseFloat(sd.weight) <= 0)) {
        //                     newErrors[`${itemsKey}[${i}].shippingDetails[${j}].weight`] = `Weight must be a positive number`;
        //                 }
        //             });
        //         }
        //         // Validate full/partial
        //         if (item.fullPartial === 'Partial') {
        //             if (!item.qtyDelivered?.trim()) {
        //                 newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered is required for partial ${itemPrefix.toLowerCase()} ${i + 1}`;
        //             } else {
        //                 const del = parseInt(item.qtyDelivered);
        //                 const recTotal = (item.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
        //                 if (isNaN(del) || del <= 0) {
        //                     newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered must be a positive number`;
        //                 } else if (del > recTotal) {
        //                     newErrors[`${itemsKey}[${i}].qtyDelivered`] = `Qty Delivered (${del}) cannot exceed total number (${recTotal})`;
        //                 }
        //             }
        //         }
        //     });
        // }
        // Transport validations
        if (!formData.transportType) {
            newErrors.transportType = 'Transport Type is required';
        }
        if (formData.transportType === 'Drop Off' && !formData.dropMethod?.trim()) {
            newErrors.dropMethod = 'Drop Method is required';
        }
        // All other transport fields are optional - no additional validations
        // Email and mobile validations
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const ownerEmailKey = formData.senderType === 'sender' ? 'senderEmail' : 'receiverEmail';
        if (formData[ownerEmailKey] && !emailRegex.test(formData[ownerEmailKey])) {
            newErrors[ownerEmailKey] = 'Invalid owner email format';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
            // Companies: third_parties for transport (filter if needed, e.g., type === 'transport')
            const thirdParties = companiesRes?.data?.third_parties || [];
            setCompanies(thirdParties.map(c => ({ value: c.id.toString(), label: c.company_name })));
            // Categories: assume data.categories = [{id, name}]
            const fetchedCategories = categoriesRes?.data?.categories || [];
            setCategories(fetchedCategories.map(c => c.name));
            console.log('Fetched Categories:', fetchedCategories);
            // Subcategories: assume data.subcategories = [{id, name, category_id}]
            const fetchedSubcategories = subcategoriesRes?.data?.subcategories || [];
            console.log('Fetched Subcategories:', fetchedSubcategories);
            // Build subMap by grouping subcategories by category_id
            const subMap = {};
            fetchedCategories.forEach(cat => {
                console.log('Processing category:', cat);
                subMap[cat.name] = fetchedSubcategories
                    .filter(s => s.category_id === cat.id)
                    .map(s => s.name);
                console.log(`Subcats for ${cat.name}:`, subMap[cat.name]);
            });
            setCategorySubMap(subMap);
            setTypes(["Package", "Box", "Bags"]);
            // Types: assuming a separate endpoint is needed; for now, use fallback or adjust
            // If types are from another endpoint, replace with api.get('api/options/types/crud')
            // setTypes([]); // Or fetch properly
            // Statuses: use statusOptions or statuses
            setStatuses(statusesRes?.data?.statusOptions || statusesRes?.data?.statuses || []);
        } catch (error) {
            console.error('Error fetching options:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.error || error.message || 'Failed to fetch options',
                severity: 'error',
            });
            // Fallback to dummies if needed
            setCategories(["Electronics", "Clothing", "Books"]);
            setCategorySubMap({
                "Electronics": ["Smartphones", "Laptops", "Accessories"],
                "Clothing": ["Men's Wear", "Women's Wear", "Kids Wear"],
                "Books": ["Fiction", "Non-Fiction", "Technical"],
            });
            setTypes(["Package", "Box", "Bags"]);
            setStatuses(["Created", "In Transit", "Delivered", "Cancelled"]);
            setPlaces([{ value: '', label: 'Select Place' }, { value: 'Singapore', label: 'Singapore' }, { value: 'Dubai', label: 'Dubai' }]); // Minimal fallback
            setCompanies([{ value: '', label: 'Select 3rd party company' }, { value: 'Company A', label: 'Company A' }]);
        } finally {
            setLoading(false);
        }
    };


    const themeColors = {
        primary: '#f58220',
        secondary: '#1a9c8f',
        background: '#f8f9fa',
        surface: '#ffffff',
        border: '#e0e0e0',
        textPrimary: '#212121',
        textSecondary: '#757575',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336'
    };
    // Fetch containers on mount
    useEffect(() => {
        fetchOptions();
        fetchContainers();
        if (orderId) {
            fetchOrder(orderId);
        }
    }, [orderId]);
    // Auto-expand accordions with errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const panelsToExpand = new Set();
            Object.keys(errors).forEach(key => {
                if (['senderName', 'senderContact', 'senderAddress', 'senderEmail', 'senderRef', 'senderRemarks', 'receiverName', 'receiverContact', 'receiverAddress', 'receiverEmail', 'receiverRef', 'receiverRemarks'].includes(key)) panelsToExpand.add('panel1');
                if (key.startsWith('receivers[') || key.startsWith('senders[')) panelsToExpand.add('panel2');
                if (['transportType', 'dropMethod', 'dropoffName', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate', 'collectionMethod', 'fullPartial', 'qtyDelivered', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber', 'thirdPartyTransport'].includes(key)) panelsToExpand.add('panel3');
            });
            setExpanded(prev => new Set([...prev, ...panelsToExpand]));
        }
    }, [errors]);
    // Fetch all containers
    const fetchContainers = async () => {
        setLoadingContainers(true);
        try {
            const params = {
                page: 1,
                limit: 50,
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
        console.log('Fetched order data:', response.data);
        setSelectedOrder(response.data);
        // Map snake_case to camelCase for core fields
        const camelData = {};
        Object.keys(response.data).forEach(apiKey => {
            let value = response.data[apiKey];
            if (value === null || value === undefined) value = '';
            if (['eta', 'etd', 'drop_date', 'delivery_date'].includes(apiKey)) {
                if (value) {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        value = date.toISOString().split('T')[0]; // YYYY-MM-DD
                    }
                } else {
                    value = '';
                }
            }
            const camelKey = snakeToCamel(apiKey);
            camelData[camelKey] = value;
        });
        // Set senderType from API
        camelData.senderType = response.data.sender_type || 'sender';
        // Map owner fields
        const ownerPrefix = camelData.senderType === 'sender' ? 'sender' : 'receiver';
        const ownerFields = ['name', 'contact', 'address', 'email', 'ref', 'remarks'];
        ownerFields.forEach(field => {
            const apiKey = `${ownerPrefix}_${field}`;
            const snakeVal = response.data[apiKey];
            if (snakeVal !== null && snakeVal !== undefined) {
                camelData[`${ownerPrefix}${field.charAt(0).toUpperCase() + field.slice(1)}`] = snakeVal;
            }
        });

        // NEW: Auto-populate owner fields if selected_sender_owner exists but name is empty
        const ownerNameKey = `${ownerPrefix}Name`;
        if (camelData.selectedSenderOwner && !camelData[ownerNameKey]?.trim()) {
            try {
                console.log(`Auto-populating owner from ID: ${camelData.selectedSenderOwner}`); // Debug log
                const customerRes = await api.get(`/api/customers/${camelData.selectedSenderOwner}`);
                if (customerRes?.data) {
                    const customer = customerRes.data;
                    // Map customer fields to owner (adjust paths based on your API response structure)
                    camelData[ownerNameKey] = customer.contact_name || customer.contact_persons?.[0]?.name || '';
                    camelData[`${ownerPrefix}Contact`] = customer.primary_phone || customer.contact_persons?.[0]?.phone || '';
                    camelData[`${ownerPrefix}Address`] = customer.zoho_notes || customer.billing_address || '';
                    camelData[`${ownerPrefix}Email`] = customer.email || customer.contact_persons?.[0]?.email || '';
                    camelData[`${ownerPrefix}Ref`] = customer.zoho_id || customer.ref || '';
                    camelData[`${ownerPrefix}Remarks`] = customer.zoho_notes || customer.system_notes || '';
                    console.log(`Auto-populated ${ownerNameKey}:`, camelData[ownerNameKey]); // Debug log
                }
            } catch (autoErr) {
                console.error('Auto-populate owner failed:', autoErr);
                // Fallback: Don't override with empty—keep whatever was there
            }
        }

        // Handle panel2 - dynamic based on senderType
        // API always provides 'receivers' array, which maps to panel2 items
        const panel2ApiKey = 'receivers';
        const panel2Prefix = camelData.senderType === 'sender' ? 'receiver' : 'sender';
        const panel2ListKey = camelData.senderType === 'sender' ? 'receivers' : 'senders';
        const initialItem = panel2Prefix === 'receiver' ? initialReceiver : initialSenderObject;
        let mappedPanel2 = [];
        if (response.data[panel2ApiKey]) {
            mappedPanel2 = (response.data[panel2ApiKey] || []).map(rec => {
                if (!rec) return null;
                const camelRec = {
                    ...initialItem,
                    shippingDetails: [],
                    isNew: false,
                    validationWarnings: null
                };
                Object.keys(rec).forEach(apiKey => {
                    let val = rec[apiKey];
                    if (val === null || val === undefined) val = '';
                    const camelKey = snakeToCamel(apiKey);
                    if (['name', 'contact', 'address', 'email'].includes(camelKey)) {
                        camelRec[`${panel2Prefix}${camelKey.charAt(0).toUpperCase() + camelKey.slice(1)}`] = val;
                    } else {
                        camelRec[camelKey] = val;
                    }
                });
                // Handle shippingdetails array (plural, as per new API)
                if (rec.shippingdetails) {
                    const mappedShippingDetails = (rec.shippingdetails || []).map(sd => {
                        const camelSd = { ...initialShippingDetail };
                        Object.keys(sd).forEach(sdApiKey => {
                            let sdVal = sd[sdApiKey];
                            if (sdVal === null || sdVal === undefined) sdVal = '';
                            const sdCamelKey = snakeToCamel(sdApiKey);
                            camelSd[sdCamelKey] = sdVal;
                        });
                        // Map nested containerDetails
                        if (sd.containerDetails) {
                            const mappedContainerDetails = (sd.containerDetails || []).map(cd => {
                                const camelCd = { totalNumber: '', container: null, status: '' };
                                Object.keys(cd).forEach(cdApiKey => {
                                    let cdVal = cd[cdApiKey];
                                    if (cdVal === null || cdVal === undefined) cdVal = '';
                                    const cdCamelKey = snakeToCamel(cdApiKey);
                                    camelCd[cdCamelKey] = cdVal;
                                });
                                // Specific mapping for total_number -> totalNumber
                                if ('total_number' in cd) {
                                    camelCd.totalNumber = cd.total_number || '';
                                }
                                return camelCd;
                            });
                            camelSd.containerDetails = mappedContainerDetails;
                        } else {
                            camelSd.containerDetails = [{ totalNumber: '', container: null, status: '' }];
                        }
                        return camelSd;
                    });
                    camelRec.shippingDetails = mappedShippingDetails;
                }
                // If no shippingDetails, create default one from receiver-level totals
                if (!camelRec.shippingDetails || camelRec.shippingDetails.length === 0) {
                    camelRec.shippingDetails = [{
                        ...initialShippingDetail,
                        totalNumber: rec.total_number || '',
                        weight: rec.total_weight || ''
                    }];
                }
                camelRec.status = rec.status || "Created";
                // New fields default
                camelRec.fullPartial = camelRec.fullPartial || '';
                camelRec.qtyDelivered = camelRec.qtyDelivered != null ? String(camelRec.qtyDelivered) : '0';
                return camelRec;
            }).filter(Boolean);
        }
        // Fallback panel2 fields to order-level if empty
        mappedPanel2.forEach(rec => {
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
        mappedPanel2 = mappedPanel2.map(rec => {
            const shippingDetails = rec.shippingDetails || [];
            const recTotal = shippingDetails.reduce((sum, sd) => {
                return sum + ((sd.containerDetails || []).reduce((s, cd) => s + (parseInt(cd.totalNumber || 0) || 0), 0));
            }, 0);
            const delivered = parseInt(rec.qtyDelivered || 0) || 0;
            const recRemaining = Math.max(0, recTotal - delivered);
            let updatedDetails = shippingDetails;
            if (rec.fullPartial === 'Partial' && recTotal > 0) {
                updatedDetails = shippingDetails.map(sd => {
                    const sdTotal = (sd.containerDetails || []).reduce((s, cd) => s + (parseInt(cd.totalNumber || 0) || 0), 0);
                    const sdRemaining = Math.round((sdTotal / recTotal) * recRemaining);
                    return { 
                        ...sd, 
                        containerDetails: (sd.containerDetails || []).map(cd => ({ 
                            ...cd, 
                            remainingItems: Math.round((parseInt(cd.totalNumber || 0) / sdTotal) * sdRemaining).toString() 
                        }))
                    };
                });
            } else {
                updatedDetails = shippingDetails.map(sd => ({ 
                    ...sd, 
                    containerDetails: (sd.containerDetails || []).map(cd => ({ 
                        ...cd, 
                        remainingItems: (parseInt(cd.totalNumber || 0) || 0).toString() 
                    }))
                }));
            }
            rec.shippingDetails = updatedDetails;
            // Validation warnings
            let warnings = null;
            const isInvalidTotal = recTotal <= 0;
            const isPartialInvalid = rec.fullPartial === 'Partial' && delivered > recTotal;
            if (isInvalidTotal || isPartialInvalid) {
                warnings = {};
                // if (isInvalidTotal) warnings.total_number = 'Must be positive';
                if (isPartialInvalid) warnings.qty_delivered = 'Cannot exceed total_number';
            }
            rec.validationWarnings = warnings;
            return rec;
        });
        camelData[panel2ListKey] = mappedPanel2;
        if (!camelData[panel2ListKey] || camelData[panel2ListKey].length === 0) {
            camelData[panel2ListKey] = [{
                ...initialItem,
                shippingDetails: [],
                isNew: true
            }];
        }
        // Ensure the other list is empty
        const otherListKey = panel2ListKey === 'receivers' ? 'senders' : 'receivers';
        camelData[otherListKey] = [];
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
        mappedPanel2.forEach((rec, i) => {
            if (rec.validationWarnings) {
                if (rec.validationWarnings.total_number) {
                    // Map to nested container totalNumber errors if needed; for simplicity, set at shipping level
                    initialErrors[`${panel2ListKey}[${i}].shippingDetails[0].containerDetails[0].totalNumber`] = rec.validationWarnings.total_number;
                }
                if (rec.validationWarnings.qty_delivered) {
                    initialErrors[`${panel2ListKey}[${i}].qtyDelivered`] = rec.validationWarnings.qty_delivered;
                }
            }
        });
        setErrors(initialErrors);
        const hasWarnings = mappedPanel2.some(r => r && r.validationWarnings);
        // if (hasWarnings) {
        //     setSnackbar({
        //         open: true,
        //         message: 'Some receiver data needs attention (check totals/deliveries)',
        //         severity: 'warning',
        //     });
        // }
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
            if (name === 'senderType' && value !== prev.senderType) {
                // Clear opposite owner fields if switching
                const newPrefix = value;
                const oldPrefix = prev.senderType;
                const fields = ['Name', 'Contact', 'Address', 'Email', 'Ref', 'Remarks'];
                fields.forEach(key => {
                    const oldKey = `${oldPrefix}${key}`;
                    if (updated[oldKey]) updated[oldKey] = '';
                });
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

    const loadImageAsBase64 = (url) =>
        new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = () => resolve(null);
        });

    const generateOrderPDF = async (order) => {
        if (!order) return;

        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        const brandPrimary = [13, 108, 106]; // #0d6c6a
        const brandLight = [220, 245, 243];
        let y = 30;

        // -------- HEADER --------
        const logoBase64 = await loadImageAsBase64("./logo-2.png");
        if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 4, 60, 12);

        doc.setFont("helvetica", "bold").setFontSize(16);
        doc.setTextColor(...brandPrimary);
        doc.text("ORDER DETAILS REPORT", pageWidth - margin, 10, { align: "right" });

        doc.setFont("helvetica", "normal").setFontSize(9);
        doc.text(`Booking Ref: ${order.booking_ref}`, pageWidth - margin, 17, { align: "right" });
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 22, { align: "right" });

        // -------- SUMMARY CARDS --------
        const cards = [
            ["Order ID", order.id],
            ["Status", order.status],
            ["Drop Method", order.drop_method],
            ["Point of Origin", order.point_of_origin],
            ["Total Assigned Qty", order.total_assigned_qty],
            ["Collection Scope", order.collection_scope],
        ];
        const cardWidth = (pageWidth - margin * 2 - 6) / 2;
        const cardHeight = 16;

        cards.forEach((item, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = margin + col * (cardWidth + 6);
            const cardY = y + row * (cardHeight + 6);

            doc.setDrawColor(220, 220, 220);
            doc.setFillColor(...brandLight);
            doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, "FD");

            doc.setFillColor(...brandPrimary);
            doc.rect(x, cardY, cardWidth, 5, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.text(item[0], x + 2, cardY + 4);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 50, 50);
            doc.text(String(item[1]), x + 3, cardY + 11);
        });

        y += Math.ceil(cards.length / 2) * (cardHeight + 6) + 5;

        // -------- ORDER DETAILS --------
        const orderDetails = [
            ["Booking Ref", order.booking_ref],
            ["RGL Booking #", order.rgl_booking_number],
            ["Place of Loading", order.place_of_loading],
            ["Final Destination", order.final_destination],
            ["Place of Delivery", order.place_of_delivery],
            ["ETA", order.eta || "N/A"],
            ["ETD", order.etd || "N/A"],
            ["Shipping Line", order.shipping_line || "N/A"],
            ["Plate No", order.plate_no],
            ["Drop Off CNIC", order.drop_off_cnic],
            ["Drop Off Mobile", order.drop_off_mobile],
            ["Drop Date", order.drop_date ? new Date(order.drop_date).toLocaleString() : "N/A"],
        ];

        const drawKeyValueSection = (y, title, details) => {
            doc.setFont("helvetica", "bold").setFontSize(14);
            doc.setTextColor(...brandPrimary);
            doc.text(title, margin, y);
            y += 4;

            doc.setDrawColor(...brandPrimary);
            doc.setLineWidth(0.6);
            doc.line(margin, y, pageWidth - margin, y);
            y += 6;

            const colWidth = (pageWidth - margin * 2 - 10) / 2;
            const rowHeight = 8;

            details.forEach((pair, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const x = margin + col * (colWidth + 10);
                const dy = y + row * rowHeight;

                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(...brandPrimary);
                doc.text(pair[0], x, dy);

                doc.setFont("helvetica", "normal");
                doc.setTextColor(50, 50, 50);
                doc.text(String(pair[1] || "N/A"), x, dy + 4);
            });

            return y + Math.ceil(details.length / 2) * rowHeight + 6;
        };

        y = drawKeyValueSection(y, "ORDER INFORMATION", orderDetails);

        // -------- SENDER DETAILS --------
        const senderDetails = [
            ["Sender Name", order.sender_name],
            ["Contact Number", order.sender_contact],
            ["Email", order.sender_email],
            ["Address", order.sender_address],
            ["Sender Ref", order.sender_ref],
            ["Sender Remarks", order.sender_remarks],
            ["Selected Sender Owner", order.selected_sender_owner],
        ];
        y = drawKeyValueSection(y, "SENDER INFORMATION", senderDetails);

        // -------- RECEIVERS TABLE --------
        if (order.receivers?.length) {
            doc.setFont("helvetica", "bold").setFontSize(14);
            doc.setTextColor(...brandPrimary);
            doc.text("RECEIVERS", margin, y);
            y += 6;

            autoTable(doc, {
                startY: y,
                head: [["Receiver", "Status", "Consignment #", "Qty", "Weight", "Contact", "Address", "Containers"]],
                body: order.receivers.map((r) => [
                    r.receiver_name,
                    r.status,
                    r.consignment_number,
                    r.total_number,
                    r.total_weight,
                    r.receiver_contact,
                    r.receiver_address,
                    r.containers?.map(c => c.join(", ")).join("; ") || "N/A",
                ]),
                headStyles: { fillColor: brandPrimary, textColor: 255 },
                bodyStyles: { fontSize: 9, cellPadding: 3 },
                margin: { left: margin, right: margin },
            });

            y = doc.lastAutoTable.finalY + 6;

            // -------- RECEIVER SHIPPING DETAILS TABLE --------
            for (const receiver of order.receivers) {
                if (!receiver.shippingDetails?.length) continue;

                doc.setFont("helvetica", "bold").setFontSize(12);
                doc.setTextColor(...brandPrimary);
                doc.text(`Products Details for: ${receiver.receiver_name}`, margin, y);
                y += 6;

                autoTable(doc, {
                    startY: y,
                    head: [["Category", "Subcategory", "Type", "Total #", "Weight", "Pickup", "Delivery", "Item Ref", "Assigned Qty"]],
                    body: receiver.shippingDetails.map((s) => [
                        s.category,
                        s.subcategory,
                        s.type,
                        s.totalNumber,
                        s.weight,
                        s.pickupLocation,
                        s.deliveryAddress,
                        s.itemRef,
                        s.assignedQty
                    ]),
                    headStyles: { fillColor: brandPrimary, textColor: 255 },
                    bodyStyles: { fontSize: 9, cellPadding: 3 },
                    margin: { left: margin, right: margin },
                });

                y = doc.lastAutoTable.finalY + 6;
            }
        }

        // -------- REMARKS --------
        const drawBoxText = (y, title, text) => {
            if (!text) return y;

            const boxHeight = 20;
            doc.setFillColor(248, 249, 250);
            doc.roundedRect(margin, y, pageWidth - margin * 2, boxHeight, 2, 2, "F");

            doc.setFont("helvetica", "bold").setFontSize(10);
            doc.setTextColor(...brandPrimary);
            doc.text(title, margin + 3, y + 6);

            doc.setFont("helvetica", "normal").setFontSize(9);
            doc.setTextColor(50, 50, 50);
            const wrapped = doc.splitTextToSize(text, pageWidth - margin * 2 - 6);
            doc.text(wrapped, margin + 3, y + 11);

            return y + boxHeight + 6;
        };

        y = drawBoxText(y, "Order Remarks", order.order_remarks);

        // -------- ATTACHMENTS --------
        const attachmentsText = order.attachments?.length ? order.attachments.join(", ") : "None";
        y = drawBoxText(y, "Attachments", attachmentsText);

        // -------- FOOTER --------
        const footerY = 275;
        doc.setDrawColor(...brandPrimary);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        doc.setFont("helvetica", "normal").setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, footerY + 6);
        doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin, footerY + 6, { align: "right" });

        // -------- SAVE PDF --------
        doc.save(`Order_${order.booking_ref || "Unknown"}.pdf`);
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
    // Frontend: handleSaveShipping function (add this to your AddOrder.jsx component)
    // This function saves/updates shipping details for a specific receiver index without full form submission
    // It can be called on the "Save" button click for shipping section
    const handleSaveShipping = async (index) => {
        if (!validateShippingDetails(index)) {
            setSnackbar({
                open: true,
                message: 'Please fix shipping detail errors',
                severity: 'error',
            });
            return;
        }
        setLoading(true);
        const formDataToSend = new FormData();
        // Dynamic panel2
        const panel2FieldPrefix = formData.senderType === 'sender' ? 'receiver' : 'sender';
        const listKey = formData.senderType === 'sender' ? 'receivers' : 'senders';
        const currentList = formData[listKey];
        const itemData = currentList[index];
        const snakeRec = {
            [`${panel2FieldPrefix}_name`]: formData.senderType === 'sender' ? itemData.receiverName || '' : itemData.senderName || '',
            [`${panel2FieldPrefix}_contact`]: formData.senderType === 'sender' ? itemData.receiverContact || '' : itemData.senderContact || '',
            [`${panel2FieldPrefix}_address`]: formData.senderType === 'sender' ? itemData.receiverAddress || '' : itemData.senderAddress || '',
            [`${panel2FieldPrefix}_email`]: formData.senderType === 'sender' ? itemData.receiverEmail || '' : itemData.senderEmail || '',
            eta: itemData.eta || '',
            etd: itemData.etd || '',
            remarks: itemData.remarks || '',
            shipping_line: itemData.shippingLine || ''
        };
        // Append panel2 data as JSON
        formDataToSend.append(`${panel2FieldPrefix}s`, JSON.stringify([snakeRec]));
        // Append shipping details as order_items flat list for this item
        const orderItemsToSend = (itemData.shippingDetails || []).map((sd, j) => {
            const snakeItem = {};
            Object.keys(sd).forEach(key => {
                if (key !== 'remainingItems') {
                    const snakeKey = camelToSnake(key);
                    snakeItem[snakeKey] = sd[key] || '';
                }
            });
            snakeItem.item_ref = `ORDER-ITEM-REF-${index + 1}-${j + 1}-${Date.now()}`;
            return snakeItem;
        });
        formDataToSend.append('order_items', JSON.stringify(orderItemsToSend));
        // Append order_id for update
        formDataToSend.append('order_id', orderId);
        try {
            const response = await api.put(`/api/orders/${orderId}/shipping`, formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update local formData with response if needed
            if (response.data.success) {
                // Optionally refetch full order or update local state
                await fetchOrder(orderId);
                setSnackbar({
                    open: true,
                    message: 'Shipping details saved successfully',
                    severity: 'success',
                });
            }
        } catch (err) {
            console.error("[handleSaveShipping] Error:", err.response?.data || err.message);
            const backendMsg = err.response?.data?.error || err.message || 'Failed to save shipping details';
            setSnackbar({
                open: true,
                message: `Error: ${backendMsg}`,
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };
    // Validation helper for shipping details (add this too)
    const validateShippingDetails = (index) => {
        const panel2FieldPrefix = formData.senderType === 'sender' ? 'receiver' : 'sender';
        const listKey = formData.senderType === 'sender' ? 'receivers' : 'senders';
        const currentList = formData[listKey];
        const itemData = currentList[index];
        const shippingDetails = itemData.shippingDetails || [];
        let isValid = true;
        const newErrors = { ...errors };
        // Validate item level
        const nameField = formData.senderType === 'sender' ? 'receiverName' : 'senderName';
        if (!itemData[nameField]?.trim()) {
            newErrors[`${listKey}[${index}].${nameField}`] = `${panel2FieldPrefix} name required`;
            isValid = false;
        }
        if (!itemData.eta) {
            newErrors[`${listKey}[${index}].eta`] = 'ETA required';
            isValid = false;
        }
        if (!itemData.etd) {
            newErrors[`${listKey}[${index}].etd`] = 'ETD required';
            isValid = false;
        }
        // Validate each shipping detail
        shippingDetails.forEach((sd, j) => {
            if (!sd.pickupLocation?.trim()) {
                newErrors[`${listKey}[${index}].shippingDetails[${j}].pickupLocation`] = 'Pickup location required';
                isValid = false;
            }
            if (!sd.category?.trim()) {
                newErrors[`${listKey}[${index}].shippingDetails[${j}].category`] = 'Category required';
                isValid = false;
            }
            if (!sd.subcategory?.trim()) {
                newErrors[`${listKey}[${index}].shippingDetails[${j}].subcategory`] = 'Subcategory required';
                isValid = false;
            }
            if (!sd.type?.trim()) {
                newErrors[`${listKey}[${index}].shippingDetails[${j}].type`] = 'Type required';
                isValid = false;
            }
            if (!sd.deliveryAddress?.trim()) {
                newErrors[`${listKey}[${index}].shippingDetails[${j}].deliveryAddress`] = 'Delivery address required';
                isValid = false;
            }
            // const totalNum = parseInt(sd.totalNumber || 0);
            // if (!sd.totalNumber || totalNum <= 0) {
            //     newErrors[`${listKey}[${index}].shippingDetails[${j}].totalNumber`] = 'Total number must be positive';
            //     isValid = false;
            // }
            const weight = parseFloat(sd.weight || 0);
            if (!sd.weight || weight <= 0) {
                newErrors[`${listKey}[${index}].shippingDetails[${j}].weight`] = 'Weight must be positive';
                isValid = false;
            }
        });
        setErrors(newErrors);
        return isValid;
    };

    // Add this useEffect to auto-select "Drop Off" as default for transportType (place it near other useEffects, e.g., after form initialization)
    useEffect(() => {
        if (!isEditMode && !formData.transportType) {
            setFormData(prev => ({ ...prev, transportType: 'Drop Off' }));
        }
    }, [isEditMode]);


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
    // console.log("Submitting form data:", formData);
    console.log('Saving owner name:', formData[ownerNameKey]); // Debug
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
    const coreKeys = ['bookingRef', 'rglBookingNumber', 'placeOfLoading', 'pointOfOrigin', 'finalDestination', 'placeOfDelivery', 'orderRemarks', 'eta', 'etd', 'attachments'];
    coreKeys.forEach(key => {
        const value = formData[key];
        if (dateFields.includes(key) && value === '') {
            // Skip empty dates
        } else {
            const apiKey = camelToSnake(key);
            formDataToSend.append(apiKey, value || '');
        }
    });
    // Append owner fields dynamically
    const ownerFieldPrefix = formData.senderType === 'sender' ? 'sender' : 'receiver';
    const ownerFields = ['Name', 'Contact', 'Address', 'Email', 'Ref', 'Remarks'];
    ownerFields.forEach(key => {
        const value = formData[`${ownerFieldPrefix}${key}`] || '';
        const apiKey = `${ownerFieldPrefix}_${camelToSnake(key.toLowerCase())}`;
        formDataToSend.append(apiKey, value);
    });
    formDataToSend.append('sender_type', formData.senderType);
    // Append selected_sender_owner
    formDataToSend.append('selected_sender_owner', formData.selectedSenderOwner || '');
    // Dynamic panel2 items
    const panel2Items = formData.senderType === 'receiver' ? formData.senders : formData.receivers;
    const panel2FieldPrefix = formData.senderType === 'sender' ? 'receiver' : 'sender';
    const panel2ArrayKey = `${panel2FieldPrefix}s`;
    // Append panel2 as JSON (basic info)
    const panel2ToSend = panel2Items.map((item) => {
        const snakeRec = {
            [`${panel2FieldPrefix}_name`]: formData.senderType === 'sender' ? (item.receiverName || '') : (item.senderName || ''),
            [`${panel2FieldPrefix}_contact`]: formData.senderType === 'sender' ? (item.receiverContact || '') : (item.senderContact || ''),
            [`${panel2FieldPrefix}_address`]: formData.senderType === 'sender' ? (item.receiverAddress || '') : (item.senderAddress || ''),
            [`${panel2FieldPrefix}_email`]: formData.senderType === 'sender' ? (item.receiverEmail || '') : (item.senderEmail || ''),
            eta: item.eta || '',
            etd: item.etd || '',
            shipping_line: item.shippingLine || '',
            full_partial: item.full_partial || item.fullPartial || 'Full',
            qty_delivered: item.qty_delivered || item.qtyDelivered || '',
            status: item.status || 'Created',
            remarks: item.remarks || '',
      containers: Array.isArray(item.containers) ? item.containers.flat().flat() : [],
        };
        return snakeRec;
    });
    formDataToSend.append(panel2ArrayKey, JSON.stringify(panel2ToSend));
    // Append order_items from all shippingDetails flat, now with nested containers
    const orderItemsToSend = [];
    panel2Items.forEach((item, i) => {
        (item.shippingDetails || []).forEach((sd, j) => {
            const snakeItem = {};
            Object.keys(sd).forEach(key => {
                if (key !== 'remainingItems' && key !== 'containerDetails') {
                    const snakeKey = camelToSnake(key);
                    snakeItem[snakeKey] = sd[key] || '';
                }
            });
            // NEW: Handle nested containerDetails as 'container_details' array of snake_case objects
            snakeItem.container_details = (sd.containerDetails || []).map((cd) => {
                const snakeCd = {};
                Object.keys(cd).forEach(ck => {
                    const snakeCk = camelToSnake(ck);
                    snakeCd[snakeCk] = cd[ck]; // container is CID primitive
                });
                return snakeCd;
            });
            snakeItem.item_ref = `ORDER-ITEM-REF-${i + 1}-${j + 1}-${Date.now()}`;
            orderItemsToSend.push(snakeItem);
        });
    });
    formDataToSend.append('order_items', JSON.stringify(orderItemsToSend));
    // Append transport fields
    const transportKeys = ['transportType', 'collection_scope', 'thirdPartyTransport', 'driverName', 'driverContact', 'driverNic', 'driverPickupLocation', 'truckNumber', 'dropMethod', 'dropoffName', 'dropOffCnic', 'dropOffMobile', 'plateNo', 'dropDate', 'collectionMethod', 'clientReceiverName', 'clientReceiverId', 'clientReceiverMobile', 'deliveryDate', 'gatepass'];
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
        if (!isEditMode) {
            if (name === 'bookingRef') return true;
            return false;
        }
        if (name.startsWith('receivers[') || name.startsWith('senders[')) {
            // For new items, editable
            const match = name.match(/(receivers|senders)\[(\d+)\]\.(.+)/);
            if (match) {
                const list = match[1] === 'receivers' ? formData.receivers : formData.senders;
                const idx = parseInt(match[2]);
                const item = list[idx];
                if (item?.isNew) return false;
            }
            return !editableInEdit.some(e => name.includes(e.replace('receivers[].', '').replace('receivers[', '').replace('senders[].', '').replace('senders[', '')));
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
    const firstPanel2Item = (formData.senderType === 'sender' ? formData.receivers : formData.senders)[0] || {};
    const ownerName = formData.senderType === 'sender' ? formData.senderName : formData.receiverName;
    return (
        <>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
                <Box sx={{ p: 3 }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={3}
                        className="MuiStack-root css-twoet5"
                        sx={{
                            position: 'sticky',
                            zIndex: 9999,
                            top: 63,
                            background: 'white',
                            p: 2,
                        }}

                    >
                        <Typography variant="h4" fontWeight="bold" color="#f58220">
                            {isEditMode ? "Edit" : "New"} Order Details
                        </Typography>
                        <Stack direction="row"
                            sx={{
                                position: 'sticky',
                                zIndex: 9999,
                                top: 63,
                                background: 'white',
                            }}
                            gap={1}>
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
                                disabled={isFieldDisabled('bookingRef')}
                            />
                            <CustomTextField
                                label="RGSL Booking Number"
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
                                value={formData.pointOfOrigin || places.find(p => p.label === 'Karachi')?.value || ''}
                                onChange={handleChange}
                                error={!!errors.pointOfOrigin}
                                required
                                renderValue={(selected) => places.find(p => p.value === selected)?.label || "Karachi"}
                            >
                                {places.map((p) => (
                                    <MenuItem key={p.value} value={p.value}>
                                        {p.label}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                            <CustomSelect
                                label="Place of Loading"
                                name="placeOfLoading"
                                value={formData.placeOfLoading || ""}
                                onChange={handleChange}
                                error={!!errors.placeOfLoading}
                                required
                                renderValue={(selected) => places.find(p => p.value === selected)?.label || "Select Place of Loading"}
                            >
                                {places.map((p) => (
                                    <MenuItem key={p.value} value={p.value}>
                                        {p.label}
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
                                required
                                renderValue={(selected) => places.find(p => p.value === selected)?.label || "Select Place of Delivery"}
                            >
                                {places.map((p) => (
                                    <MenuItem key={p.value} value={p.value}>
                                        {p.label}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                            <CustomSelect
                                label="Final Destination"
                                name="finalDestination"
                                value={formData.finalDestination || places.find(p => p.label === 'Dubai')?.value || ''}
                                onChange={handleChange}
                                error={!!errors.finalDestination}
                                required
                                renderValue={(selected) => places.find(p => p.value === selected)?.label || "Dubai"}
                            >
                                {places.map((p) => (
                                    <MenuItem key={p.value} value={p.value}>
                                        {p.label}
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
                                        const ownerNameKey = formData.senderType === 'sender' ? 'senderName' : 'receiverName';
                                        const ownerContactKey = formData.senderType === 'sender' ? 'senderContact' : 'receiverContact';
                                        const ownerAddressKey = formData.senderType === 'sender' ? 'senderAddress' : 'receiverAddress';
                                        const ownerEmailKey = formData.senderType === 'sender' ? 'senderEmail' : 'receiverEmail';
                                        const ownerRefKey = formData.senderType === 'sender' ? 'senderRef' : 'receiverRef';
                                        const ownerRemarksKey = formData.senderType === 'sender' ? 'senderRemarks' : 'receiverRemarks';
                                        const typePrefix = formData.senderType === 'sender' ? 'Sender' : 'Receiver';
                                        const fieldPrefix = formData.senderType === 'sender' ? 'sender' : 'receiver';

                                        const handleOwnerNameChange = (event, newValue) => {
                                            if (typeof newValue === 'string') {
                                                // Manual entry or existing value
                                                handleChange({ target: { name: ownerNameKey, value: newValue } });
                                            } else if (newValue) {
                                                // Selected option, fetch details
                                                handleSelectOwner(event, newValue);
                                            } else {
                                                // Cleared
                                                const fieldMap = {
                                                    [ownerNameKey]: '',
                                                    [ownerContactKey]: '',
                                                    [ownerAddressKey]: '',
                                                    [ownerEmailKey]: '',
                                                    [ownerRefKey]: '',
                                                    [ownerRemarksKey]: '',
                                                };
                                                Object.entries(fieldMap).forEach(([formKey, value]) => {
                                                    handleChange({ target: { name: formKey, value } });
                                                });
                                                handleChange({ target: { name: 'selectedSenderOwner', value: '' } });
                                            }
                                        };

                                        const handleSelectOwner = async (event, value) => {
                                            if (value && typeof value !== 'string') {
                                                try {
                                                    const res = await api.get(`/api/customers/${value.zoho_id || value.id}`);

                                                    if (res && res.data) {
                                                        const fieldMap = {
                                                            [ownerNameKey]: res.data.contact_name || res.data.contact_persons[0].name || '',
                                                            [ownerContactKey]: res.data.primary_phone || res.data.contact_persons[0].phone || '',
                                                            [ownerAddressKey]: res.data.zoho_notes || res.data.billing_address || '',
                                                            [ownerEmailKey]: res.data.email || res.data.contact_persons[0].email || '',
                                                            [ownerRefKey]: res.data.zoho_id || res.data.ref || '',
                                                            [ownerRemarksKey]: res.data.zoho_notes || res.data.system_notes || '',
                                                        };
                                                        Object.entries(fieldMap).forEach(([formKey, dbValue]) => {
                                                            handleChange({ target: { name: formKey, value: dbValue } });
                                                        });
                                                        // Set unique ID for reference
                                                        handleChange({ target: { name: 'selectedSenderOwner', value: res.data.zoho_id || res.data.id } });
                                                    }
                                                } catch (error) {
                                                    console.error('Error fetching owner details:', error);
                                                }
                                            }
                                        };

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

                                                <Stack spacing={2}>
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>



                                                        <Autocomplete
                                                            options={options2}
                                                            loading={loading}
                                                            freeSolo={true}
                                                            getOptionLabel={(option) => typeof option === 'string' ? option : (option.contact_name || '')}
                                                            isOptionEqualToValue={(option, value) => {
                                                                if (typeof value === 'string') {
                                                                    return typeof option === 'string' ? option === value : (option.contact_name || '') === value;
                                                                }
                                                                return typeof option !== 'string' && (option.zoho_id === value.zoho_id || option.id === value.id);
                                                            }}
                                                            value={formData[ownerNameKey] || null}
                                                            onChange={handleOwnerNameChange}
                                                            onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
                                                            renderInput={(params) => (
                                                                <CustomTextField
                                                                    {...params}
                                                                    label={`Search & Select ${typePrefix}`}
                                                                    error={!!errors[ownerNameKey] || !!errors.selectedSenderOwner} // Add name-specific error
                                                                    helperText={errors[ownerNameKey] || errors.selectedSenderOwner || (loading ? 'Loading...' : '')}
                                                                    // required (if needed)

                                                                    disabled={isFieldDisabled('selectedSenderOwner')}
                                                                    style={{ width: '100%' }}
                                                                />
                                                            )}
                                                            renderOption={(props, option) => (
                                                                <li {...props} key={typeof option === 'string' ? option : (option.zoho_id || option.id)}>
                                                                    <div>
                                                                        <strong>{typeof option === 'string' ? option : (option.contact_name || '')}</strong>
                                                                        {typeof option !== 'string' && option.email && <div style={{ fontSize: '0.875em', color: '#666' }}>{option.email}</div>}
                                                                        {typeof option !== 'string' && option.primary_phone && <div style={{ fontSize: '0.875em', color: '#666' }}>{option.primary_phone}</div>}
                                                                    </div>
                                                                </li>
                                                            )}
                                                            noOptionsText={searchTerm ? `No ${typePrefix.toLowerCase()}s found for "${searchTerm}"` : `Type to search ${typePrefix.toLowerCase()}s`}
                                                            clearOnBlur={false}
                                                            selectOnFocus={true}
                                                            style={{ width: '60%' }}
                                                        />
                                                        <CustomTextField
                                                            label={`${typePrefix} Contact`}
                                                            name={ownerContactKey}
                                                            value={formData[ownerContactKey] || ""}
                                                            onChange={handleChange}
                                                            error={!!errors[ownerContactKey]}
                                                            helperText={errors[ownerContactKey]}
                                                        // required
                                                        />
                                                    </Box>
                                                    <CustomTextField
                                                        label={`${typePrefix} Address`}
                                                        name={ownerAddressKey}
                                                        value={formData[ownerAddressKey] || ""}
                                                        onChange={handleChange}
                                                        error={!!errors[ownerAddressKey]}
                                                        helperText={errors[ownerAddressKey]}
                                                        multiline
                                                        rows={2}
                                                    // required
                                                    />
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                        <CustomTextField
                                                            label={`${typePrefix} Email`}
                                                            name={ownerEmailKey}
                                                            value={formData[ownerEmailKey] || ""}
                                                            onChange={handleChange}
                                                            error={!!errors[ownerEmailKey]}
                                                            helperText={errors[ownerEmailKey]}
                                                        />
                                                        <CustomTextField
                                                            label={`${typePrefix} Ref`}
                                                            name={ownerRefKey}
                                                            value={formData[ownerRefKey] || ""}
                                                            onChange={handleChange}
                                                            error={!!errors[ownerRefKey]}
                                                            helperText={errors[ownerRefKey]}
                                                        />
                                                    </Box>
                                                    <CustomTextField
                                                        label={`${typePrefix} Remarks`}
                                                        name={ownerRemarksKey}
                                                        value={formData[ownerRemarksKey] || ""}
                                                        onChange={handleChange}
                                                        error={!!errors[ownerRemarksKey]}
                                                        helperText={errors[ownerRemarksKey]}
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
            {/* {formData.senderType === 'sender' ? (
                errors.receivers && <Alert severity="error">{errors.receivers}</Alert>
            ) : (
                errors.senders && <Alert severity="error">{errors.senders}</Alert>
            )} */}
            {/* Dynamic: Summary Table for multiples */}
            {(formData.senderType === 'sender' ? formData.receivers : formData.senders).length > 1 && (
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="primary">
                        {formData.senderType === 'sender' ? 'Receivers' : 'Senders'} Overview
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ overflowX: 'auto' }}>
                        {(formData.senderType === 'sender' ? formData.receivers : formData.senders).map((rec, i) => {
                            const totalItems = (rec.shippingDetails || []).reduce((sum, sd) => {
                                return sum + ((sd.containerDetails || []).reduce((s, cd) => s + (parseInt(cd.assignTotalBox || 0) || 0), 0));
                            }, 0);
                            const remainingItems = (rec.shippingDetails || []).reduce((sum, sd) => {
                                return sum + ((sd.containerDetails || []).reduce((s, cd) => s + (parseInt(cd.remainingItems || 0) || 0), 0));
                            }, 0);
                            return (
                                <Chip
                                    key={i}
                                    label={`${(formData.senderType === 'sender' ? rec.receiverName : rec.senderName) ||
                                        (formData.senderType === 'sender' ? `Receiver ${i + 1}` : `Sender ${i + 1}`)
                                        } (Items: ${totalItems.toLocaleString()} / Remaining: ${remainingItems.toLocaleString()})`}
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
                const duplicateRecFn = isSenderMode ? duplicateSender : duplicateReceiver;
                const removeRecFn = isSenderMode ? removeSender : removeReceiver;
                // Helper function to update nested state immutably (generic for senders/receivers)
                const updateNestedArray = (indices, field, value, isSender = true) => {
                    const key = isSender ? 'senders' : 'receivers';
                    setFormData(prev => ({
                        ...prev,
                        [key]: prev[key].map((item, ii) => {
                            if (ii !== indices[0]) return item;
                            return {
                                ...item,
                                shippingDetails: (item.shippingDetails || []).map((sd, jj) => {
                                    if (jj !== indices[1]) return sd;
                                    return {
                                        ...sd,
                                        containerDetails: (sd.containerDetails || []).map((cd, kk) => {
                                            if (kk !== indices[2]) return cd;
                                            return { ...cd, [field]: value };
                                        })
                                    };
                                })
                            };
                        })
                    }));
                };
                // 1. handleSenderContainerDetailChange
                // Parameters: index (receiver/sender index i), shippingIndex (j), containerIndex (k), field ('assignTotalBox', 'assignWeight', 'container', 'status')
                // Returns: a function that takes event or value and updates the state
                const handleSenderContainerDetailChange = (index, shippingIndex, containerIndex, field) => (eventOrValue) => {
                    const value = eventOrValue.target ? eventOrValue.target.value : eventOrValue;
                    updateNestedArray([index, shippingIndex, containerIndex], field, value, true); // true for sender
                };
                // 2. handleReceiverContainerDetailChange
                // Parameters: index (receiver/sender index i), shippingIndex (j), containerIndex (k), field ('assignTotalBox', 'assignWeight', 'container', 'status')
                // Returns: a function that takes event or value and updates the state
                const handleReceiverContainerDetailChange = (index, shippingIndex, containerIndex, field) => (eventOrValue) => {
                    const value = eventOrValue.target ? eventOrValue.target.value : eventOrValue;
                    updateNestedArray([index, shippingIndex, containerIndex], field, value, false); // false for receiver
                };
                // 3. addSenderContainerDetail
                // Parameters: index (i), shippingIndex (j)
                // Adds a new empty container detail to the specified shippingDetails in senders
                const addSenderContainerDetail = (index, shippingIndex) => {
                    console.log('Adding sender container detail for sender index:', index, 'shipping index:', shippingIndex);
                    setFormData(prev => ({
                        ...prev,
                        senders: prev.senders.map((sender, ii) => {
                            if (ii !== index) return sender;
                            return {
                                ...sender,
                                shippingDetails: sender.shippingDetails.map((sd, jj) => {
                                    if (jj !== shippingIndex) return sd;
                                    return {
                                        ...sd,
                                        containerDetails: [...(sd.containerDetails || []), { assignTotalBox: '', assignWeight: '', container: null, status: '' }]
                                    };
                                })
                            };
                        })
                    }));
                };
                // 4. addReceiverContainerDetail
                // Parameters: index (i), shippingIndex (j)
                // Adds a new empty container detail to the specified shippingDetails in receivers
                const addReceiverContainerDetail = (index, shippingIndex) => {
                    console.log('Adding receiver container detail for receiver index:', index, 'shipping index:', shippingIndex);
                    setFormData(prev => ({
                        ...prev,
                        receivers: prev.receivers.map((receiver, ii) => {
                            if (ii !== index) return receiver;
                            return {
                                ...receiver,
                                shippingDetails: receiver.shippingDetails.map((sd, jj) => {
                                    if (jj !== shippingIndex) return sd;
                                    return {
                                        ...sd,
                                        containerDetails: [...(sd.containerDetails || []), { assignTotalBox: '', assignWeight: '', container: null, status: '' }]
                                    };
                                })
                            };
                        })
                    }));
                };
                // 5. removeSenderContainerDetail
                // Parameters: index (i), shippingIndex (j), containerIndex (k)
                // Removes the container detail at the specified indices from senders
                const removeSenderContainerDetail = (index, shippingIndex, containerIndex) => {
                    setFormData(prev => ({
                        ...prev,
                        senders: prev.senders.map((sender, ii) => {
                            if (ii !== index) return sender;
                            return {
                                ...sender,
                                shippingDetails: sender.shippingDetails.map((sd, jj) => {
                                    if (jj !== shippingIndex) return sd;
                                    return {
                                        ...sd,
                                        containerDetails: (sd.containerDetails || []).filter((_, kk) => kk !== containerIndex)
                                    };
                                })
                            };
                        })
                    }));
                };
                // 6. removeReceiverContainerDetail
                // Parameters: index (i), shippingIndex (j), containerIndex (k)
                // Removes the container detail at the specified indices from receivers
                const removeReceiverContainerDetail = (index, shippingIndex, containerIndex) => {
                    setFormData(prev => ({
                        ...prev,
                        receivers: prev.receivers.map((receiver, ii) => {
                            if (ii !== index) return receiver;
                            return {
                                ...receiver,
                                shippingDetails: receiver.shippingDetails.map((sd, jj) => {
                                    if (jj !== shippingIndex) return sd;
                                    return {
                                        ...sd,
                                        containerDetails: (sd.containerDetails || []).filter((_, kk) => kk !== containerIndex)
                                    };
                                })
                            };
                        })
                    }));
                };
                // 7. duplicateSenderContainerDetail (optional, for completeness)
                // Parameters: index (i), shippingIndex (j), containerIndex (k)
                // Duplicates the container detail at the specified indices in senders
                const duplicateSenderContainerDetail = (index, shippingIndex, containerIndex) => {
                    setFormData(prev => ({
                        ...prev,
                        senders: prev.senders.map((sender, ii) => {
                            if (ii !== index) return sender;
                            return {
                                ...sender,
                                shippingDetails: sender.shippingDetails.map((sd, jj) => {
                                    if (jj !== shippingIndex) return sd;
                                    const containerDetails = [...(sd.containerDetails || [])];
                                    const toDuplicate = containerDetails[containerIndex];
                                    if (toDuplicate) {
                                        containerDetails.splice(containerIndex + 1, 0, { ...toDuplicate });
                                    }
                                    return { ...sd, containerDetails };
                                })
                            };
                        })
                    }));
                };
                // 8. duplicateReceiverContainerDetail (optional, for completeness)
                // Parameters: index (i), shippingIndex (j), containerIndex (k)
                // Duplicates the container detail at the specified indices in receivers
                const duplicateReceiverContainerDetail = (index, shippingIndex, containerIndex) => {
                    setFormData(prev => ({
                        ...prev,
                        receivers: prev.receivers.map((receiver, ii) => {
                            if (ii !== index) return receiver;
                            return {
                                ...receiver,
                                shippingDetails: receiver.shippingDetails.map((sd, jj) => {
                                    if (jj !== shippingIndex) return sd;
                                    const containerDetails = [...(sd.containerDetails || [])];
                                    const toDuplicate = containerDetails[containerIndex];
                                    if (toDuplicate) {
                                        containerDetails.splice(containerIndex + 1, 0, { ...toDuplicate });
                                    }
                                    return { ...sd, containerDetails };
                                })
                            };
                        })
                    }));
                };
                // Valid shipment statuses (from backend validation)
                const validShipmentStatuses = [
                   'Order Created', 'Ready for Loading', 'Loaded Into Container', 'Shipment Processing',
                    'Shipment In Transit', 'Under Processing', 'Arrived at Sort Facility',
                    'Ready for Delivery', 'Shipment Delivered'
                ];
                // Assume containerOptions is fetched elsewhere (e.g., useEffect with api.get('/api/containers/available'))
                // Example: const [containerOptions, setContainerOptions] = useState([]); // [{cid: 1, container_number: 'CONT001', location: 'Depot'}, ...]
                const renderRecForm = (rec, i) => {
                    const recErrorsPrefix = isSenderMode ? `senders[${i}]` : `receivers[${i}]`;
                    const recDisabledPrefix = isSenderMode ? `senders[${i}]` : `receivers[${i}]`;
                    const isSender = isSenderMode;
                    const emptySd = {
                        pickupLocation: '',
                        category: '',
                        subcategory: '',
                        type: '',
                        weight: '',
                        totalNumber: '',
                        deliveryAddress: '',
                        status: '', // NEW: Add status to emptySd
                        containerDetails: [], // FIXED: Empty array, no initial blank
                        itemRef: `ORDER-ITEM-REF-${i + 1}-${Date.now()}`
                    };
                    // NEW: Unified add shipping with values for preview
                    const addShippingWithValues = (recIndex, sdFields, containerFields = null) => {
                        const key = listKey;
                        setFormData(prev => ({
                            ...prev,
                            [key]: prev[key].map((item, ii) => {
                                if (ii !== recIndex) return item;
                                const newSd = { ...emptySd, ...sdFields };
                                if (containerFields) {
                                    newSd.containerDetails = [{
                                        ...emptySd.containerDetails[0],
                                        ...containerFields
                                    }];
                                } else {
                                    newSd.containerDetails = [...emptySd.containerDetails];
                                }
                                return {
                                    ...item,
                                    shippingDetails: [...(item.shippingDetails || []), newSd]
                                };
                            })
                        }));
                    };
                    const handleEmptySdChange = (field, value) => {
                        const sdFields = { [field]: value };
                        let containerFields = null;
                        // FIXED: Removed auto-fill for totalNumber and weight
                        addShippingWithValues(i, sdFields, containerFields);
                    };
                    // NEW: Handler for shipping change with auto container fill
                    const handleShippingChangeWithAutoFill = (recIndex, shipIndex, field) => (e) => {
                        if (field !== 'totalNumber' && field !== 'weight') {
                            handleShippingChangeFn(recIndex, shipIndex, field)(e);
                            return;
                        }
                        const value = e.target.value;
                        const key = listKey;
                        // FIXED: Removed auto-fill for containerField
                        setFormData(prev => ({
                            ...prev,
                            [key]: prev[key].map((item, ii) => {
                                if (ii !== recIndex) return item;
                                return {
                                    ...item,
                                    shippingDetails: item.shippingDetails.map((sd, jj) => {
                                        if (jj !== shipIndex) return sd;
                                        return {
                                            ...sd,
                                            [field]: value
                                        };
                                    })
                                };
                            })
                        }));
                    };
                    // NEW: Handlers for container details
                    const addContainerDetail = (shippingIndex) => {
                        const addFn = isSenderMode ? addSenderContainerDetail : addReceiverContainerDetail;
                        addFn(i, shippingIndex);
                    };
                    const removeContainerDetail = (shippingIndex, containerIndex) => {
                        const removeFn = isSenderMode ? removeSenderContainerDetail : removeReceiverContainerDetail;
                        removeFn(i, shippingIndex, containerIndex);
                    };
                    const duplicateContainerDetail = (shippingIndex, containerIndex) => {
                        const duplicateFn = isSenderMode ? duplicateSenderContainerDetail : duplicateReceiverContainerDetail;
                        duplicateFn(i, shippingIndex, containerIndex);
                    };
                    const handleContainerDetailChange = (shippingIndex, containerIndex, field) => (value) => {
                        const changeFn = isSenderMode ? handleSenderContainerDetailChange : handleReceiverContainerDetailChange;
                        changeFn(i, shippingIndex, containerIndex, field)(value);
                    };
                    const nameField = isSenderMode ? 'senderName' : 'receiverName';
                    // FIXED: Compute global selected container CIDs with null check
                    const getCid = (cont) => cont ? (typeof cont === 'object' ? cont.cid : cont) : null;
                    const globalSelectedCids = currentList.flatMap(r =>
                        (r.shippingDetails || []).flatMap(sd =>
                            (sd.containerDetails || []).map(cd => getCid(cd.container)).filter(Boolean)
                        )
                    );
                    // FIXED: availableContainers now computed per shipping (but will be overridden per CD below for display)
                    const availableContainersBase = containers.filter(c => !globalSelectedCids.includes(c.cid));
                    // FIXED: Equality function for Autocomplete (handles both object and primitive value)
                    const autocompleteEquality = (option, value) => {
                        const valueCid = value ? (typeof value === 'object' ? value.cid : value) : null;
                        return option.cid === valueCid;
                    };
                    const handleNameChange = (event, newValue) => {
                        if (typeof newValue === 'string') {
                            handleChangeFn(i, nameField)({ target: { value: newValue } });
                        } else if (newValue) {
                            handleSelect(event, newValue);
                        } else {
                            const fieldMap = isSenderMode ? {
                                senderName: '',
                                senderContact: '',
                                senderAddress: '',
                                senderEmail: '',
                                senderRef: '',
                                senderRemarks: '',
                                senderMarksNumber: '',
                            } : {
                                receiverName: '',
                                receiverContact: '',
                                receiverAddress: '',
                                receiverEmail: '',
                                receiverRef: '',
                                receiverRemarks: '',
                                receiverMarksNumber: '',
                            };
                            Object.entries(fieldMap).forEach(([formKey, value]) => {
                                handleChangeFn(i, formKey)({ target: { value } });
                            });
                            handleChangeFn(i, 'selectedSenderOwner')({ target: { value: '' } });
                        }
                    };
                    const handleSelect = async (event, value) => {
                        if (value && typeof value !== 'string') {
                            try {
                                const res = await api.get(`/api/customers/${value.zoho_id || value.id}`);
                                if (res && res.data) {
                                    const fieldMap = isSenderMode ? {
                                        senderName: res.data.contact_name || res.data.contact_persons[0].name || '',
                                        senderContact: res.data.primary_phone || res.data.contact_persons[0].phone || '',
                                        senderAddress: res.data.zoho_notes || res.data.billing_address || '',
                                        senderEmail: res.data.email || '',
                                        senderRef: res.data.zoho_id || res.data.ref || '',
                                        senderRemarks: res.data.zoho_notes || res.data.system_notes || '',
                                    } : {
                                        receiverName: res.data.contact_name || res.data.contact_persons[0].name || '',
                                        receiverContact: res.data.primary_phone || res.data.contact_persons[0].phone || '',
                                        receiverAddress: res.data.zoho_notes || res.data.contact_persons[0].name || '',
                                        receiverEmail: res.data.email || res.data.contact_persons[0].email || '',
                                        receiverRef: res.data.zoho_id || res.data.ref || '',
                                        receiverRemarks: res.data.zoho_notes || res.data.system_notes || '',
                                    };
                                    Object.entries(fieldMap).forEach(([formKey, dbValue]) => {
                                        const updateFn = handleChangeFn(i, formKey);
                                        updateFn({ target: { value: dbValue } });
                                    });
                                    handleChangeFn(i, 'selectedSenderOwner')({ target: { value: res.data.zoho_id || res.data.id } });
                                }
                            } catch (error) {
                                console.error('Error fetching customer details:', error);
                            }
                        }
                    }
                    // Helper to calculate sum of assignTotalBox for a shipping detail
                    const calculateSumAssignTotalBox = (sd) => {
                        return (sd.containerDetails || []).reduce((sum, cd) => sum + (parseInt(cd.assignTotalBox || 0) || 0), 0);
                    };
                    // Helper to calculate sum of assignWeight for a shipping detail
                    const calculateSumAssignWeight = (sd) => {
                        return (sd.containerDetails || []).reduce((sum, cd) => sum + (parseFloat(cd.assignWeight || 0) || 0), 0);
                    };
                    // Helper to render empty container detail row for a specific shipping (always show one row)
                    const renderEmptyContainerDetail = (shippingIndex) => {
                        const emptyCd = { assignTotalBox: '', assignWeight: '', container: null, status: '' };
                        // FIXED: Compute displayValue for preview consistency (handles object or primitive)
                        const currentContainerPreview = emptyCd.container;
                        const currentCidPreview = typeof currentContainerPreview === 'object' ? currentContainerPreview?.cid : currentContainerPreview;
                        const otherSelectedCidsPreview = globalSelectedCids.filter(cid => cid != currentCidPreview);
                        const availableContainersForCdPreview = containers.filter(c => !otherSelectedCidsPreview.includes(c.cid));
                        const displayValuePreview = currentContainerPreview && typeof currentContainerPreview === 'object'
                            ? currentContainerPreview
                            : (currentCidPreview ? availableContainersForCdPreview.find(c => c.cid === currentCidPreview) || containers.find(c => c.cid === currentCidPreview) : null);
                        return (
                            <Box sx={{ p: 1, border: 1, borderColor: "grey.200", borderRadius: 1 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="body2" color="primary">
                                        Container 1
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        <IconButton
                                            onClick={() => {
                                                addContainerDetail(shippingIndex);
                                                duplicateContainerDetail(shippingIndex, 0);
                                            }}
                                            size="small"
                                            title="Duplicate"
                                            color="primary"
                                        >
                                            <ContentCopyIcon />
                                        </IconButton>
                                    </Stack>
                                </Stack>
                                {/* NEW: Split into two rows for better layout with four fields */}
                                <Stack spacing={1.5}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <CustomTextField
                                            label="Assign Total Box"
                                            value={emptyCd.assignTotalBox || ""}
                                            onChange={(e) => {
                                                addContainerDetail(shippingIndex);
                                                handleContainerDetailChange(shippingIndex, 0, 'assignTotalBox')(e.target.value);
                                            }}
                                            sx={{ width: { xs: '100%', sm: '50%' } }}
                                            error={!!errors[`${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].assignTotalBox`]}
                                            helperText={errors[`${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].assignTotalBox`]}
                                        />
                                        <CustomTextField
                                            label="Assign Weight"
                                            value={emptyCd.assignWeight || ""}
                                            onChange={(e) => {
                                                addContainerDetail(shippingIndex);
                                                handleContainerDetailChange(shippingIndex, 0, 'assignWeight')(e.target.value);
                                            }}
                                            sx={{ width: { xs: '100%', sm: '50%' } }}
                                            error={!!errors[`${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].assignWeight`]}
                                            helperText={errors[`${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].assignWeight`]}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                        <Autocomplete
                                            options={availableContainersForCdPreview}
                                            value={displayValuePreview}
                                            onChange={(e, newValue) => {
                                                addContainerDetail(shippingIndex);
                                                handleContainerDetailChange(shippingIndex, 0, 'container')(newValue);
                                            }}
                                            sx={{ width: { xs: '100%', sm: '50%' } }}
                                            getOptionLabel={(option) => option.container_number || ''}
                                            isOptionEqualToValue={autocompleteEquality}
                                            renderInput={(params) => <TextField {...params} label="Container" />}
                                        />
                                        <CustomSelect
                                            label="Status"
                                            value={emptyCd.status || ""}
                                            onChange={(e) => {
                                                addContainerDetail(shippingIndex);
                                                handleContainerDetailChange(shippingIndex, 0, 'status')(e.target.value);
                                            }}
                                            sx={{ width: { xs: '100%', sm: '50%' } }}
                                            error={!!errors[`${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].status`]}
                                            helperText={errors[`${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].status`]}
                                            renderValue={(selected) => selected || "Select Status"}
                                        >
                                            <MenuItem value="">Select Status</MenuItem>
                                            {validShipmentStatuses.map((s) => (
                                                <MenuItem key={s} value={s}>
                                                    {s}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                    </Box>
                                </Stack>
                            </Box>
                        );
                    };
                    const renderShippingSection = () => (
                        <Stack spacing={2}>
                            <Typography variant="subtitle1" color="primary" fontWeight={"bold"} mb={1}>
                                Shipping Details
                            </Typography>
                            {/* ETA, ETD at receiver/sender level */}
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
                                />
                                <CustomTextField
                                    label="ETD"
                                    type="date"
                                    value={rec.etd || ""}
                                    onChange={(e) => handleChangeFn(i, 'etd')(e)}
                                    InputLabelProps={{ shrink: true }}
                                    error={!!errors[`${listKey}[${i}].etd`]}
                                    helperText={errors[`${listKey}[${i}].etd`]}
                                />
                            </Box>
                            {/* Shipping Details Forms */}
                            {(rec.shippingDetails || []).length === 0 ? (
                                <Box sx={{ p: 1.5, border: 1, borderColor: "grey.200", borderRadius: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="body2" color="primary" fontWeight="bold">
                                            Shipping Detail 1
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton
                                                onClick={() => duplicateShippingFn(i, 0)}
                                                size="small"
                                                title="Duplicate"
                                                color="primary"
                                            >
                                                <ContentCopyIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => removeShippingFn(i, 0)}
                                                size="small"
                                                title="Delete"
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
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
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].pickupLocation`)}
                                            />
                                            <CustomSelect
                                                label="Category"
                                                value={emptySd.category}
                                                onChange={(e) => handleEmptySdChange('category', e.target.value)}
                                                error={!!errors[`${listKey}[${i}].shippingDetails[0].category`]}
                                                helperText={errors[`${listKey}[${i}].shippingDetails[0].category`]}
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
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].type`)}
                                                renderValue={(selected) => selected || "Select Type"}
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
                                                label="Weight"
                                                value={emptySd.weight}
                                                onChange={(e) => handleEmptySdChange('weight', e.target.value)}
                                                error={!!errors[`${listKey}[${i}].shippingDetails[0].weight`]}
                                                helperText={errors[`${listKey}[${i}].shippingDetails[0].weight`]}
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].weight`)}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                            <CustomTextField
                                                label="Total Number"
                                                value={emptySd.totalNumber}
                                                onChange={(e) => handleEmptySdChange('totalNumber', e.target.value)}
                                                error={!!errors[`${listKey}[${i}].shippingDetails[0].totalNumber`]}
                                                helperText={errors[`${listKey}[${i}].shippingDetails[0].totalNumber`]}
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].totalNumber`)}
                                            />
                                        </Box>
                                        {/* NEW: Status field for shipping detail under Total Number */}
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                            <CustomSelect
                                                label="Consignment Status"
                                                value={emptySd.status || ""}
                                                onChange={(e) => handleEmptySdChange('status', e.target.value)}
                                                error={!!errors[`${listKey}[${i}].shippingDetails[0].status`]}
                                                helperText={errors[`${listKey}[${i}].shippingDetails[0].status`]}
                                                disabled={isFieldDisabled(`${recDisabledPrefix}.shippingDetails[0].status`)}
                                                renderValue={(selected) => selected || "Select Status"}
                                            >
                                                <MenuItem value="">Select Status</MenuItem>
                                                {validShipmentStatuses.map((s) => (
                                                    <MenuItem key={s} value={s}>
                                                        {s}
                                                    </MenuItem>
                                                ))}
                                            </CustomSelect>
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
                                        {/* FIXED: Add button for container instead of section */}
                                        <Button
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            onClick={() => {
                                                addShippingFn(i);
                                                addContainerDetail(0);
                                            }}
                                            size="small"
                                        >
                                            Add Container Assignment
                                        </Button>
                                    </Stack>
                                </Box>
                            ) : (
                                (rec.shippingDetails || []).map((sd, j) => {
                                    // FIXED: No per-SD available; compute per-CD below
                                    // NEW: Always render at least one empty container row if none exist
                                    const hasContainers = (sd.containerDetails || []).length > 0;
                                    return (
                                        <Box key={j} sx={{ p: 1.5, border: 1, borderColor: "grey.200", borderRadius: 1 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                                <Typography variant="body2" color="primary" fontWeight="bold">
                                                    Shipping Detail {j + 1}
                                                </Typography>
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        onClick={() => duplicateShippingFn(i, j)}
                                                        size="small"
                                                        title="Duplicate"
                                                        color="primary"
                                                    >
                                                        <ContentCopyIcon />
                                                    </IconButton>
                                                    {(rec.shippingDetails || []).length > 1 && (
                                                        <IconButton
                                                            onClick={() => removeShippingFn(i, j)}
                                                            size="small"
                                                            title="Delete"
                                                            color="error"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
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
                                                    />
                                                    <CustomSelect
                                                        label="Category"
                                                        value={sd.category || ""}
                                                        onChange={(e) => handleShippingChangeFn(i, j, 'category')(e)}
                                                        error={!!errors[`${listKey}[${i}].shippingDetails[${j}].category`]}
                                                        helperText={errors[`${listKey}[${i}].shippingDetails[${j}].category`]}
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
                                                        renderValue={(selected) => selected || "Select Type"}
                                                    >
                                                        <MenuItem value="">Select Unit</MenuItem>
                                                        {types.map((t) => (
                                                            <MenuItem key={t} value={t}>
                                                                {t}
                                                            </MenuItem>
                                                        ))}
                                                    </CustomSelect>
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label="Weight"
                                                        value={sd.weight || ""}
                                                        onChange={handleShippingChangeWithAutoFill(i, j, 'weight')}
                                                        error={!!errors[`${listKey}[${i}].shippingDetails[${j}].weight`]}
                                                        helperText={errors[`${listKey}[${i}].shippingDetails[${j}].weight`]}
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label="Total Number"
                                                        value={sd.totalNumber || ""}
                                                        onChange={handleShippingChangeWithAutoFill(i, j, 'totalNumber')}
                                                        error={!!errors[`${listKey}[${i}].shippingDetails[${j}].totalNumber`]}
                                                        helperText={errors[`${listKey}[${i}].shippingDetails[${j}].totalNumber`]}
                                                    />
                                                </Box>
                                                {/* NEW: Status field for shipping detail under Total Number - FIXED: Use 'status' consistently */}
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomSelect
                                                        label="Shippment Status"
                                                        value={sd.status || ""}
                                                        onChange={(e) => handleShippingChangeFn(i, j, 'status')(e)}
                                                        error={!!errors[`${listKey}[${i}].shippingDetails[${j}].status`]}
                                                        helperText={errors[`${listKey}[${i}].shippingDetails[${j}].status`]}
                                                        renderValue={(selected) => selected || "Select Status"}
                                                    >
                                                        <MenuItem value="">Select Status</MenuItem>
                                                        {validShipmentStatuses.map((s) => (
                                                            <MenuItem key={s} value={s}>
                                                                {s}
                                                            </MenuItem>
                                                        ))}
                                                    </CustomSelect>
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label="Delivery Address"
                                                        value={sd.deliveryAddress || ""}
                                                        onChange={(e) => handleShippingChangeFn(i, j, 'deliveryAddress')(e)}
                                                        error={!!errors[`${listKey}[${i}].shippingDetails[${j}].deliveryAddress`]}
                                                        helperText={errors[`${listKey}[${i}].shippingDetails[${j}].deliveryAddress`]}
                                                        fullWidth
                                                    />
                                                    <CustomTextField label="Ref Number" value={sd.itemRef || `ORDER-ITEM-REF-${i + 1}-${j + 1}-${Date.now()}`} disabled={true} />
                                                </Box>
                                                {/* FIXED: Container Details Section - only if hasContainers, else button */}
                                                {!hasContainers ? (
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<AddIcon />}
                                                        onClick={() => addContainerDetail(j)}
                                                        size="small"
                                                    >
                                                        Add Container Assignment
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Stack spacing={1}>
                                                            <Typography variant="subtitle2" color="primary" fontWeight="bold">
                                                                Container Details
                                                            </Typography>
                                                            {(sd.containerDetails || []).map((cd, k) => {
                                                                // FIXED: Per-CD availability (exclude others, include current for display); handles object or primitive
                                                                const currentContainer = cd.container;
                                                                const currentCid = typeof currentContainer === 'object' ? currentContainer?.cid : currentContainer;
                                                                const otherSelectedCids = globalSelectedCids.filter(cid => cid !== currentCid);
                                                                const availableContainersForCd = containers.filter(c => !otherSelectedCids.includes(c.cid));
                                                                const displayValue = currentContainer && typeof currentContainer === 'object'
                                                                    ? currentContainer
                                                                    : (currentCid ? availableContainersForCd.find(c => c.cid === currentCid) || containers.find(c => c.cid === currentCid) : null);
                                                                return (
                                                                    <Box key={k} sx={{ p: 1, border: 1, borderColor: "grey.200", borderRadius: 1 }}>
                                                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                                                            <Typography variant="body2" color="primary">
                                                                                Container {k + 1}
                                                                            </Typography>
                                                                            <Stack direction="row" spacing={1}>
                                                                                <IconButton
                                                                                    onClick={() => duplicateContainerDetail(j, k)}
                                                                                    size="small"
                                                                                    title="Duplicate"
                                                                                    color="primary"
                                                                                >
                                                                                    <ContentCopyIcon />
                                                                                </IconButton>
                                                                                <IconButton
                                                                                    onClick={() => removeContainerDetail(j, k)}
                                                                                    size="small"
                                                                                    title="Delete"
                                                                                    color="error"
                                                                                >
                                                                                    <DeleteIcon />
                                                                                </IconButton>
                                                                            </Stack>
                                                                        </Stack>
                                                                        {/* NEW: Split into two rows for better layout */}
                                                                        <Stack spacing={1.5}>
                                                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                                                {/* FIXED: Changed label and field to assignTotalBox */}
                                                                                <CustomTextField
                                                                                    label="Assign Total Box"
                                                                                    value={cd.assignTotalBox || ""}
                                                                                    onChange={(e) => handleContainerDetailChange(j, k, 'assignTotalBox')(e.target.value)}
                                                                                    error={!!errors[`${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].assignTotalBox`]}
                                                                                    helperText={errors[`${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].assignTotalBox`]}
                                                                                    sx={{ width: { xs: '100%', sm: '50%' } }}
                                                                                />
                                                                                {/* NEW: Assign Weight Field */}
                                                                                <CustomTextField
                                                                                    label="Assign Weight"
                                                                                    value={cd.assignWeight || ""}
                                                                                    onChange={(e) => handleContainerDetailChange(j, k, 'assignWeight')(e.target.value)}
                                                                                    error={!!errors[`${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].assignWeight`]}
                                                                                    helperText={errors[`${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].assignWeight`]}
                                                                                    sx={{ width: { xs: '100%', sm: '50%' } }}
                                                                                />
                                                                            </Box>
                                                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                                                {/* FIXED: Proper Autocomplete for Container; now sets full object */}
                                                                                <Autocomplete
                                                                                    // FIXED: Use per-CD options and displayValue; updated equality; set full object
                                                                                    options={availableContainersForCd}
                                                                                    value={displayValue}
                                                                                    onChange={(e, newValue) => {
                                                                                        // FIXED: Set to full object or null on clear
                                                                                        handleContainerDetailChange(j, k, 'container')(newValue);
                                                                                    }}
                                                                                    getOptionLabel={(option) => option.container_number || ''}
                                                                                    isOptionEqualToValue={autocompleteEquality}
                                                                                    renderInput={(params) => <TextField {...params} label="Container" />}
                                                                                    sx={{ width: { xs: '100%', sm: '50%' } }}
                                                                           
                                                                                    // fullWidth
                                                                                />
                                                                                <CustomSelect
                                                                                    label="Status"
                                                                                    value={cd.status || ""}
                                                                                    onChange={(e) => handleContainerDetailChange(j, k, 'status')(e.target.value)}
                                                                                    error={!!errors[`${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].status`]}
                                                                                    helperText={errors[`${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].status`]}
                                                                                    sx={{ width: { xs: '100%', sm: '50%' } }}
                                                                        
                                                                                    renderValue={(selected) => selected || "Select Status"}
                                                                                >
                                                                                    <MenuItem value="">Select Status</MenuItem>
                                                                                    {validShipmentStatuses.map((s) => (
                                                                                        <MenuItem key={s} value={s}>
                                                                                            {s}
                                                                                        </MenuItem>
                                                                                    ))}
                                                                                </CustomSelect>
                                                                            </Box>
                                                                        </Stack>
                                                                    </Box>
                                                                );
                                                            })
                                                        }
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<AddIcon />}
                                                            onClick={() => addContainerDetail(j)}
                                                            size="small"
                                                        >
                                                            Add Container
                                                        </Button>
                                                        {/* NEW: Total Assign Summary Row (always appears, uses current sd for sum) */}
                                                        <Box sx={{ p: 1, border: 1, borderColor: "grey.300", borderRadius: 1, bgcolor: "grey.50" }}>
                                                            <Typography variant="body2" color="primary" fontWeight="bold">
                                                                Total Assign Number: {calculateSumAssignTotalBox(sd).toLocaleString()} | Total Assign Weight: {calculateSumAssignWeight(sd).toFixed(2)}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                    </>
                                                )}
                                            </Stack>
                                        </Box>
                                    );
                                })
                            )}
                            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => addShippingFn(i)}
                                >
                                    Add Shipping Detail
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
                                    <IconButton
                                        onClick={() => duplicateRecFn(i)}
                                        size="small"
                                        title="Duplicate"
                                        color="primary"
                                    >
                                        <ContentCopyIcon />
                                    </IconButton>
                                    {currentList.length > 1 && (
                                        <IconButton
                                            onClick={() => removeRecFn(i)}
                                            size="small"
                                            title="Delete"
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
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
                                <Autocomplete
                                    options={options3}
                                    loading={loading}
                                    freeSolo={true}
                                    getOptionLabel={(option) => typeof option === 'string' ? option : (option.contact_name || '')}
                                    isOptionEqualToValue={(option, value) => {
                                        if (typeof value === 'string') {
                                            return typeof option === 'string' ? option === value : (option.contact_name || '') === value;
                                        }
                                        return typeof option !== 'string' && (option.zoho_id === value.zoho_id || option.id === value.id);
                                    }}
                                    value={rec[nameField] || null}
                                    onChange={handleNameChange}
                                    disabled={isFieldDisabled(`${recDisabledPrefix}.${isSenderMode ? 'senderName' : 'receiverName'}`)}
                                    onInputChange={(_, newInputValue) => setSearchTerm3(newInputValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={`${typePrefix} Name`}
                                            error={!!errors[`${listKey}[${i}].${nameField}`]}
                                            helperText={errors[`${listKey}[${i}].${nameField}`]}
                                            disabled={isFieldDisabled(`${recDisabledPrefix}.${isSenderMode ? 'senderName' : 'receiverName'}`)}
                                            fullWidth
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props} key={typeof option === 'string' ? option : (option.zoho_id || option.id)}>
                                            <div>
                                                <strong>{typeof option === 'string' ? option : (option.contact_name || '')}</strong>
                                                {typeof option !== 'string' && option.email && <div style={{ fontSize: '0.875em', color: '#666' }}>{option.email}</div>}
                                                {typeof option !== 'string' && option.primary_phone && <div style={{ fontSize: '0.875em', color: '#666' }}>{option.primary_phone}</div>}
                                            </div>
                                        </li>
                                    )}
                                    noOptionsText={searchTerm3 ? `No ${typePrefix.toLowerCase()}s found for "${searchTerm3}"` : `Type to search ${typePrefix.toLowerCase()}s`}
                                    clearOnBlur={false}
                                    selectOnFocus={true}
                                    style={{ width: '50%' }}
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
                            <CustomTextField
                                label={`${typePrefix} Marks & Number`}
                                value={isSenderMode ? rec.senderMarksNumber : rec.receiverMarksNumber}
                                onChange={handleChangeFn(i, isSenderMode ? 'senderMarksNumber' : 'receiverMarksNumber')}
                                error={!!errors[`${listKey}[${i}].${isSenderMode ? 'senderMarksNumber' : 'receiverMarksNumber'}`]}
                                helperText={errors[`${listKey}[${i}].${isSenderMode ? 'senderMarksNumber' : 'receiverMarksNumber'}`]}
                                disabled={isFieldDisabled(`${recDisabledPrefix}.${isSenderMode ? 'senderMarksNumber' : 'receiverMarksNumber'}`)}
                                fullWidth
                            />
                            <CustomTextField
                                label="Remarks"
                                value={rec.remarks || ""}
                                onChange={handleChangeFn(i, 'remarks')}
                                multiline
                                rows={3}
                                fullWidth
                                disabled={isFieldDisabled(`${recDisabledPrefix}.remarks`)}
                            />
                            {renderShippingSection()}
                        </Box>
                    );
                };
                const handleEmptyRecChange = (field, value) => {
                    addRecFn();
                    const fn = isSenderMode ? handleSenderChange : handleReceiverChange;
                    fn(0, field)({ target: { value } });
                };
                const emptyRec = {
                    [isSenderMode ? 'senderName' : 'receiverName']: '',
                    [isSenderMode ? 'senderContact' : 'receiverContact']: '',
                    [isSenderMode ? 'senderAddress' : 'receiverAddress']: '',
                    [isSenderMode ? 'senderEmail' : 'receiverEmail']: '',
                    [isSenderMode ? 'senderMarksNumber' : 'receiverMarksNumber']: '',
                    eta: '',
                    etd: '',
                    shippingLine: '',
                    shippingDetails: []
                };
                if (currentList.length === 0) {
                    // Render empty receiver/sender form
                    const emptyI = 0;
                    return renderRecForm(emptyRec, emptyI);
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
                                    <FormControl component="fieldset">
                                        <Typography variant="h6" color="#f58220" gutterBottom>
                                            Transport Type
                                        </Typography>
                                        <RadioGroup
                                            name="transportType"
                                            value={formData.transportType || "Drop Off"}  // Default to "Drop Off" in render
                                            onChange={handleChange}
                                            style={{ flexDirection: "row" }}
                                        >
                                            <FormControlLabel value="Drop Off" control={<Radio />} label="Drop Off" />
                                            <FormControlLabel value="Collection" control={<Radio />} label="Collection" />
                                            <FormControlLabel value="Third Party" control={<Radio />} label="Third Party" />
                                        </RadioGroup>
                                        {errors.transportType && <FormHelperText error>{errors.transportType}</FormHelperText>}
                                    </FormControl>
                                    {formData.transportType === 'Drop Off' && (
                                        <Stack spacing={2}>
                                            <Typography variant="h6" color="#f58220" gutterBottom>
                                                🧭 Drop-Off Details
                                            </Typography>
                                            <CustomSelect
                                                label="Drop Method *"
                                                name="dropMethod"
                                                value={formData.dropMethod || ""}
                                                onChange={handleChange}
                                                error={!!errors.dropMethod}
                                                helperText={errors.dropMethod || "Required"}
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
                                                />
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label="CNIC/ID"
                                                        name="dropOffCnic"
                                                        value={formData.dropOffCnic}
                                                        onChange={handleChange}
                                                        error={!!errors.dropOffCnic}
                                                        helperText={errors.dropOffCnic}
                                                    />
                                                    <CustomTextField
                                                        label="Mobile"
                                                        name="dropOffMobile"
                                                        value={formData.dropOffMobile}
                                                        onChange={handleChange}
                                                        error={!!errors.dropOffMobile}
                                                        helperText={errors.dropOffMobile}
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
                                                helperText={errors.collectionMethod}
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
                                                />
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                                                    <CustomTextField
                                                        label="Receiver ID"
                                                        name="clientReceiverId"
                                                        value={formData.clientReceiverId}
                                                        onChange={handleChange}
                                                        error={!!errors.clientReceiverId}
                                                        helperText={errors.clientReceiverId}
                                                    />
                                                    <CustomTextField
                                                        label="Receiver Mobile"
                                                        name="clientReceiverMobile"
                                                        value={formData.clientReceiverMobile}
                                                        onChange={handleChange}
                                                        error={!!errors.clientReceiverMobile}
                                                        helperText={errors.clientReceiverMobile}
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
                                                renderValue={(selected) => companies.find(c => c.value === selected)?.label || "Select Company"}
                                            >
                                                {companies.map((c) => (
                                                    <MenuItem key={c.value} value={c.value}>
                                                        {c.label}
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
                                                />
                                                <CustomTextField
                                                    label="Driver Contact number"
                                                    name="driverContact"
                                                    value={formData.driverContact}
                                                    onChange={handleChange}
                                                    error={!!errors.driverContact}
                                                    helperText={errors.driverContact}
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
                                                />
                                                <CustomTextField
                                                    label="Driver Pickup Location"
                                                    name="driverPickupLocation"
                                                    value={formData.driverPickupLocation}
                                                    onChange={handleChange}
                                                    error={!!errors.driverPickupLocation}
                                                    helperText={errors.driverPickupLocation}
                                                />
                                            </Box>
                                            <CustomTextField
                                                label="Truck number"
                                                name="truckNumber"
                                                value={formData.truckNumber}
                                                onChange={handleChange}
                                                error={!!errors.truckNumber}
                                                helperText={errors.truckNumber}
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
                                        <Typography variant="body1">{places.find(p => p.value === formData.pointOfOrigin)?.label || "-"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Place of Loading:</Typography>
                                        <Typography variant="body1">{places.find(p => p.value === formData.placeOfLoading)?.label || "-"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Final Destination:</Typography>
                                        <Typography variant="body1">{places.find(p => p.value === formData.finalDestination)?.label || "-"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Owner:</Typography>
                                        <Typography variant="body1">{ownerName || "-"}</Typography>
                                    </Stack>
                                    <Stack spacing={1}>
                                        <Typography variant="body1" fontWeight="medium">{formData.senderType === 'sender' ? 'Receivers:' : 'Senders:'}</Typography>
                                        {(formData.senderType === 'sender' ? formData.receivers : formData.senders).map((rec, i) => (
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" key={i}>
                                                <Chip sx={{ p: 2 }} label={formData.senderType === 'sender' ? rec.receiverName : rec.senderName || `${formData.senderType === 'sender' ? 'Receiver' : 'Sender'} ${i + 1}`} size="small" color="primary" variant="outlined" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Delivered: {rec.qtyDelivered || 0} / {(rec.shippingDetails || []).reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0)} items
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                    {formData.receivers.some(rec => rec.containers && rec.containers.length > 0) && (
                                        console.log('Rendering Assigned Containers section', formData.receivers),
                                        <Stack spacing={1}>
                                            <Typography variant="body1" fontWeight="medium">Assigned Containers:</Typography>
                                            {formData.receivers?.flatMap(rec => rec.containers || []).map((cont, i) => (
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" key={i}>
                                                    <Chip sx={{ p: 2 }} label={cont} color="info" size="small" variant="outlined" />
                                                </Stack>
                                            ))}
                                        </Stack>
                                    )}
                                    {/* New: Global Totals */}
                                    <Divider />
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Total Items (All {formData.senderType === 'sender' ? 'Receivers' : 'Senders'}):</Typography>
                                        <Chip label={formData.globalTotalItems || "-"} variant="outlined" color="success" />
                                    </Stack>
                                    {/* {formData.globalRemainingItems < formData.globalTotalItems && (
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body1" fontWeight="medium">Remaining Items (Partials):</Typography>
                                            <Chip label={formData.globalRemainingItems} variant="filled" color="warning" />
                                        </Stack>
                                    )} */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">Shipping Line:</Typography>
                                        <Typography variant="body1">{firstPanel2Item.shippingLine || "-"}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1" fontWeight="medium">ETA:</Typography>
                                        <Typography variant="body1">{firstPanel2Item.eta || "-"}</Typography>
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
                                                        onDelete={() => {
                                                            // Revoke object URL if it's a File object to free memory
                                                            if (typeof attachment === 'object' && attachment !== null) {
                                                                URL.revokeObjectURL(src);
                                                            }
                                                            // Remove the attachment from the array
                                                            const newAttachments = formData.attachments.filter((_, index) => index !== i);
                                                            setFormData(prev => ({ ...prev, attachments: newAttachments }));
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
                            onClick={() => generateOrderPDF(selectedOrder)}
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