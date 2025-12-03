import React, { useState, useEffect,useCallback,useMemo } from 'react';
// From @mui/material (core components)
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, Card, CardContent, Box, Typography, Chip, Button, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    FormControl, InputLabel, Select, MenuItem, Alert, AlertTitle, Collapse, TextField,
    Tooltip, CircularProgress, Stack,
    Popover, Checkbox, FormControlLabel, Divider, List, ListItem, ListItemIcon, ListItemText,
    Accordion, AccordionSummary, AccordionDetails, // New: For expandable shipping details
    IconButton as MuiIconButton, // Alias to avoid conflict
} from '@mui/material';
import { Add } from '@mui/icons-material';
import{ LinearProgress } from '@mui/material';
// Icons
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import { Remove } from '@mui/icons-material';
import { api } from '../../api';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InfoIcon from '@mui/icons-material/Info';
import CargoIcon from '@mui/icons-material/LocalShipping';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // For accordion
import DeleteIcon from '@mui/icons-material/Delete'; // For remove
const AssignModal = ({
    onUpdateAssignedQty,
    onRemoveContainers,
    openAssignModal,
    setOpenAssignModal,
    selectedOrders,
    orders,
    containers,
    selectedContainers: propSelectedContainers, // Can be ignored now
    setSelectedContainers: setPropSelectedContainers, // Can be ignored now
    loadingContainers,
    fetchContainers,
    // editingAssignReceiverId ,
    // setEditingAssignReceiverId,
    handleAssign, // Now receives nested assignments as single arg
    handleReceiverAction, // This can now be removed if we handle edit internally, but keeping for compatibility
    onUpdateReceiver, // New prop: callback to update receiver in parent state
    onRefreshOrders // New prop: callback to refresh parent orders data (optional)
}) => {
    // Utility function for snake_case to camelCase conversion
    const snakeToCamel = (str) => {
        if (!str) return str;
        return str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
    };
    // Initial objects for mapping
    const initialReceiver = {
        id: null,
        receiverName: '',
        receiverContact: '',
        receiverEmail: '',
        receiverAddress: '',
        category: '',
        totalNumber: 0,
        totalWeight: 0,
        status: 'Created',
        fullPartial: '',
        qtyDelivered: '0',
        eta: '',
        etd: '',
        shippingLine: '',
        shippingDetails: [],
        isNew: false,
        validationWarnings: null,
    };
    const initialSenderObject = {
        id: null,
        senderName: '',
        senderContact: '',
        senderEmail: '',
        senderAddress: '',
        status: 'Created',
        fullPartial: '',
        qtyDelivered: '0',
        eta: '',
        etd: '',
        shippingLine: '',
        shippingDetails: [],
        isNew: false,
        validationWarnings: null,
    };
    const initialShippingDetail = {
        deliveryAddress: '',
        pickupLocation: '',
        category: '',
        totalNumber: '',
        weight: '',
        remainingItems: '',
        deliveredItems: '0',
    };
    const [showAllColumns, setShowAllColumns] = useState(false); // Default to compact for better mobile
    const [columnVisibility, setColumnVisibility] = useState({
        id: true,
        name: true,
        booking_ref: true,
        category: true,
        totalPC: true,
        wt: true,
        assigned: true,
        remainingQty: true,
        deliveredQty: true, // New: Delivered Qty column
        address: true,
        contact: true,
        email: true,
        containers: true,
        action: true
    });
    const [columnAnchorEl, setColumnAnchorEl] = useState(null);
    const [editingReceiverId, setEditingReceiverId] = useState(null);
    const [tempQty, setTempQty] = useState(0);
    // New states for edit receiver modal
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedReceiver, setSelectedReceiver] = useState(null);
    const [editForm, setEditForm] = useState({
        receiverName: '',
        receiverContact: '',
        receiverEmail: '',
        receiverAddress: '',
        category: '', // Receiver-level category if needed
        totalNumber: 0,
        totalWeight: 0,
        status: 'Created',
        shippingDetails: [] // Array for multiple shipping details
    });
    const [editErrors, setEditErrors] = useState({});
    // Updated: Quantities for assignment per receiver per shipping detail
    const [assignmentQuantities, setAssignmentQuantities] = useState({}); // { [`${orderId}-${receiverId}-${detailIdx}`]: qty }
    // New: Local state for detailed orders data (fetched on demand)
    const [detailedOrders, setDetailedOrders] = useState({}); // { [orderId]: fullOrderData }
    const [fetchingDetails, setFetchingDetails] = useState(false);
    // New: Containers selection per detail
    const [selectedContainersPerDetail, setSelectedContainersPerDetail] = useState({}); // { [`${orderId}-${recId}-${detailIdx}`]: [cid1, ...] }
    // New: Expanded receivers for inline details
    const [expandedReceivers, setExpandedReceivers] = useState(new Set());
    const [editingAssignReceiverId, setEditingAssignReceiverId] = useState(null);
    const [tempAssignQty, setTempAssignQty] = useState(0);
    const availableContainers = useMemo(() => containers.filter(c => c.derived_status === 'Available'), [containers]);
    // Column visibility handlers
    const handleColumnMenuOpen = (event) => {
        setColumnAnchorEl(event.currentTarget);
    };
    const handleColumnMenuClose = () => {
        setColumnAnchorEl(null);
    };
    const handleColumnToggle = (event, column) => {
        setColumnVisibility(prev => ({ ...prev, [column]: event.target.checked }));
    };
    // Utility functions
    const getDetailKey = useCallback((orderId, recId, detailIdx) => `${orderId}-${recId}-${detailIdx}`, []);
    const getGloballySelectedCids = useCallback(() => Object.values(selectedContainersPerDetail).flat(), [selectedContainersPerDetail]);
    const getAvailableContainersForKey = useCallback((key) => {
        const globalSelected = getGloballySelectedCids();
        const currentSelected = selectedContainersPerDetail[key] || [];
        return availableContainers.filter(c => !globalSelected.includes(c.cid) || currentSelected.includes(c.cid));
    }, [selectedContainersPerDetail, availableContainers, getGloballySelectedCids]);
    // Handle container change
    const handleContainerChange = useCallback((key, newValue) => {
        setSelectedContainersPerDetail(prev => ({ ...prev, [key]: newValue }));
    }, []);
    // Handle quantity change for detail
    const handleQuantityChange = (key, value) => {
        const qty = Math.max(0, parseInt(value) || 0);
        setAssignmentQuantities(prev => ({
            ...prev,
            [key]: qty
        }));
    };
    // Handle toggle expanded for receiver details
    const toggleExpanded = useCallback((orderId, recId) => {
        const key = `${orderId}-${recId}`;
        setExpandedReceivers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    }, []);
    // Handle remove containers for a receiver (clear all details for this rec)
    const handleRemoveContainersForReceiver = (recId, orderId) => {
        setSelectedContainersPerDetail(prev => {
            const newState = { ...prev };
            Object.keys(newState).forEach(k => {
                if (k.startsWith(`${orderId}-${recId}-`)) {
                    delete newState[k];
                }
            });
            return newState;
        });
        // Optionally clear quantities too
        setAssignmentQuantities(prev => {
            const newState = { ...prev };
            Object.keys(newState).forEach(k => {
                if (k.startsWith(`${orderId}-${recId}-`)) {
                    delete newState[k];
                }
            });
            return newState;
        });
        // Collapse if expanded
        toggleExpanded(orderId, recId);
    };
    // Handle remove specific detail assignment
    const handleRemoveDetailAssignment = (orderId, recId, detailIdx) => {
        const key = getDetailKey(orderId, recId, detailIdx);
        setSelectedContainersPerDetail(prev => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
        setAssignmentQuantities(prev => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
    };
    // Added: fetchOrder function (integrated for single order fetch)
    const fetchOrder = async (id) => {
        setFetchingDetails(true);
        try {
            const response = await api.get(`/api/orders/${id}`, { params: { includeContainer: true } });
            if (!response.data) {
                throw new Error('Invalid response data');
            }
            console.log('Fetched order data:', response.data);
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
                    // Handle legacy shipping_detail to array
                    if (rec.shipping_detail) {
                        const sd = { ...rec.shipping_detail };
                        Object.keys(sd).forEach(key => {
                            const camelKey = snakeToCamel(key);
                            sd[camelKey] = sd[key];
                            delete sd[key];
                        });
                        camelRec.shippingDetails = [sd];
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
                    console.log('Mapped panel2 record:', camelRec);
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
            // Updated: Compute remainingItems and deliveredItems proportionally always
            mappedPanel2 = mappedPanel2.map(rec => {
                const shippingDetails = rec.shippingDetails || [];
                const recTotal = shippingDetails.reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
                const delivered = parseInt(rec.qtyDelivered || 0) || 0;
                const recRemaining = Math.max(0, recTotal - delivered);
                const updatedDetails = shippingDetails.map(sd => {
                    const sdTotal = parseInt(sd.totalNumber || 0) || 0;
                    const proportion = recTotal > 0 ? sdTotal / recTotal : 0;
                    const sdRemaining = Math.round(proportion * recRemaining);
                    const sdDelivered = Math.round(proportion * delivered);
                    return { ...sd, remainingItems: sdRemaining.toString(), deliveredItems: sdDelivered.toString() };
                });
                rec.shippingDetails = updatedDetails;
                // Validation warnings
                let warnings = null;
                const isInvalidTotal = recTotal <= 0;
                const isPartialInvalid = rec.fullPartial === 'Partial' && delivered > recTotal;
                if (isInvalidTotal || isPartialInvalid) {
                    warnings = {};
                    if (isInvalidTotal) warnings.totalNumber = 'Must be positive';
                    if (isPartialInvalid) warnings.qtyDelivered = 'Cannot exceed totalNumber';
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
            return camelData; // Return for use in modal
        } catch (err) {
            console.error("Error fetching order:", err);
            throw err; // Re-throw for caller to handle
        } finally {
            setFetchingDetails(false);
        }
    };
    // New: Fetch detailed data for all selected orders on modal open
    useEffect(() => {
        if (openAssignModal && selectedOrders.length > 0) {
            const fetchAllDetails = async () => {
                const updatedOrders = { ...detailedOrders };
                for (const orderId of selectedOrders) {
                    if (!updatedOrders[orderId]) {
                        try {
                            const fullOrder = await fetchOrder(orderId);
                            updatedOrders[orderId] = fullOrder;
                        } catch (err) {
                            console.error(`Failed to fetch details for order ${orderId}:`, err);
                        }
                    }
                }
                setDetailedOrders(updatedOrders);
                if (onRefreshOrders) onRefreshOrders(); // Optional parent refresh
            };
            fetchAllDetails();
        }
    }, [openAssignModal, selectedOrders]); // Trigger on open and selection change
    // Updated handleEditReceiver to use detailed data
    const handleEditReceiver = async (rec) => {
        try {
            // Fetch fresh data for this order to get full receiver details
            const orderId = rec.orderId;
            if (!detailedOrders[orderId]) {
                await fetchOrder(orderId); // This updates detailedOrders
            }
            const fullOrder = detailedOrders[orderId] || orders.find(o => o.id === orderId);
            const fullRec = fullOrder.receivers?.find(r => r.id === rec.id);
            console.log('Editing receiver, fetched fullRec:', fullRec);
            if (fullRec) {
                setSelectedReceiver(fullRec);
                setEditForm({
                    receiverName: fullRec.receiverName || '',
                    receiverContact: fullRec.receiverContact || '',
                    receiverEmail: fullRec.receiverEmail || '',
                    receiverAddress: fullRec.receiverAddress || '',
                    category: fullRec.category || '',
                    totalNumber: fullRec.totalNumber || 0,
                    totalWeight: fullRec.totalWeight || 0,
                    status: fullRec.status || 'Created',
                    shippingDetails: fullRec.shippingDetails || [] // Full array from fetch
                });
            } else {
                // Fallback to prop data
                setEditForm({
                    receiverName: rec.receiverName || '',
                    receiverContact: rec.receiverContact || '',
                    receiverEmail: rec.receiverEmail || '',
                    receiverAddress: rec.receiverAddress || '',
                    category: rec.category || '',
                    totalNumber: rec.totalNumber || 0,
                    totalWeight: rec.totalWeight || 0,
                    status: rec.status || 'Created',
                    shippingDetails: rec.shippingDetails || []
                });
            }
            setEditErrors({});
            setOpenEditModal(true);
        } catch (err) {
            console.error('Error fetching receiver details:', err);
            // Fallback to basic edit
            setEditForm({
                receiverName: rec.receiverName || '',
                receiverContact: rec.receiverContact || '',
                receiverEmail: rec.receiverEmail || '',
                receiverAddress: rec.receiverAddress || '',
                category: rec.category || '',
                totalNumber: rec.totalNumber || 0,
                totalWeight: rec.totalWeight || 0,
                status: rec.status || 'Created',
                shippingDetails: rec.shippingDetails || []
            });
            setEditErrors({});
            setOpenEditModal(true);
        }
    };
    // Handle form changes
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
        // Clear error on change
        if (editErrors[name]) {
            setEditErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
    // Validate form
    const validateForm = () => {
        const errors = {};
        if (!editForm.receiverName.trim()) errors.receiverName = 'Receiver name is required';
        if (!editForm.receiverAddress.trim()) errors.receiverAddress = 'Address is required';
        if (!editForm.receiverContact.trim()) errors.receiverContact = 'Contact is required';
        if (!editForm.receiverEmail.trim() || !/\S+@\S+\.\S+/.test(editForm.receiverEmail)) {
            errors.receiverEmail = 'Valid email is required';
        }
        setEditErrors(errors);
        return Object.keys(errors).length === 0;
    };
    // Handle save/update
    const handleSaveReceiver = () => {
        if (!validateForm()) return;
        // Call parent callback to update
        if (onUpdateReceiver && selectedReceiver) {
            onUpdateReceiver({
                ...selectedReceiver,
                ...editForm
            });
        }
        // Close modal
        setOpenEditModal(false);
        setSelectedReceiver(null);
        setEditForm({
            receiverName: '',
            receiverContact: '',
            receiverEmail: '',
            receiverAddress: '',
            category: '',
            totalNumber: 0,
            totalWeight: 0,
            status: 'Created',
            shippingDetails: []
        }); // Reset form
    };
    // Updated: Enhanced handleAssign to build nested assignments per detail
    const enhancedHandleAssign = () => {
        if (selectedOrders.length === 0) return;
        const assignments = selectedOrders.reduce((acc, orderId) => {
            acc[orderId] = {};
            const fullOrder = detailedOrders[orderId] || orders.find(o => o.id === orderId);
            if (fullOrder?.receivers) {
                fullOrder.receivers.forEach(rec => {
                    const details = rec.shippingDetails || [];
                    acc[orderId][rec.id] = details.reduce((recAcc, _, idx) => {
                        const key = getDetailKey(orderId, rec.id, idx);
                        const qty = assignmentQuantities[key] || 0;
                        const conts = selectedContainersPerDetail[key] || [];
                        if (qty > 0 && conts.length > 0) {
                            recAcc[idx] = { qty, containers: conts };
                        }
                        return recAcc;
                    }, {});
                    if (Object.keys(acc[orderId][rec.id]).length === 0) {
                        delete acc[orderId][rec.id];
                    }
                });
                if (Object.keys(acc[orderId]).length === 0) {
                    delete acc[orderId];
                }
            }
            return acc;
        }, {});
        // Check if any assignments are set
        if (Object.keys(assignments).length === 0) {
            alert('Please specify quantities and containers for at least one shipping detail before assigning.');
            return;
        }
        // Call handleAssign with nested assignments
        handleAssign(assignments);
    };
    const totalReceivers = selectedOrders.reduce((total, orderId) => {
        const order = orders.find(o => o.id === orderId);
        console.log('Calculating receivers for order:', orderId, order);
        return total + (order ? (order.receivers ? order.receivers.length : 0) : 0);
    }, 0);
    console.log('Available Containers:', selectedOrders, availableContainers);
    // Compute summary for right card
    const totalAssignedDetails = useMemo(() => {
        let count = 0;
        selectedOrders.forEach(orderId => {
            const fullOrder = detailedOrders[orderId] || orders.find(o => o.id === orderId);
            if (fullOrder?.receivers) {
                fullOrder.receivers.forEach(rec => {
                    const details = rec.shippingDetails || [];
                    details.forEach((_, idx) => {
                        const key = getDetailKey(orderId, rec.id, idx);
                        const qty = assignmentQuantities[key] || 0;
                        const conts = selectedContainersPerDetail[key] || [];
                        if (qty > 0 && conts.length > 0) count++;
                    });
                });
            }
        });
        return count;
    }, [selectedOrders, detailedOrders, orders, assignmentQuantities, selectedContainersPerDetail, getDetailKey]);
    const totalContainersUsed = useMemo(() => new Set(getGloballySelectedCids()).size, [getGloballySelectedCids]);
    // New: Total delivered across all
    const totalDelivered = useMemo(() => {
        let sum = 0;
        selectedOrders.forEach(orderId => {
            const fullOrder = detailedOrders[orderId] || orders.find(o => o.id === orderId);
            if (fullOrder?.receivers) {
                fullOrder.receivers.forEach(rec => {
                    sum += parseInt(rec.qtyDelivered || 0);
                });
            }
        });
        return sum;
    }, [selectedOrders, detailedOrders, orders]);
    // Compute detailed assignments for the preview table
    const detailedAssignments = useMemo(() => {
        const assignments = [];
        selectedOrders.forEach(orderId => {
            const fullOrder = detailedOrders[orderId] || orders.find(o => o.id === orderId);
            if (fullOrder?.receivers) {
                fullOrder.receivers.forEach(rec => {
                    const details = rec.shippingDetails || [];
                    details.forEach((detail, idx) => {
                        const key = getDetailKey(orderId, rec.id, idx);
                        const qty = assignmentQuantities[key] || 0;
                        const conts = selectedContainersPerDetail[key] || [];
                        if (qty > 0 && conts.length > 0) {
                            const containerNumbers = conts.map(cid => availableContainers.find(c => c.cid === cid)?.container_number || cid).join(', ');
                            assignments.push({
                                orderRef: fullOrder.bookingRef || 'N/A',
                                receiverName: rec.receiverName || 'N/A',
                                detailAddress: detail.deliveryAddress || `Detail ${idx + 1}`,
                                qty,
                                containers: containerNumbers,
                                detailIdx: idx,
                                recId: rec.id,
                                orderId
                            });
                        }
                    });
                });
            }
        });
        return assignments;
    }, [selectedOrders, detailedOrders, orders, assignmentQuantities, selectedContainersPerDetail, availableContainers, getDetailKey]);
    // Improved theme colors for better visual appeal
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
    return (
        <>
            <Dialog
                open={openAssignModal}
                onClose={() => setOpenAssignModal(false)}
                maxWidth={'xl'}
                fullWidth
                aria-labelledby="assign-modal-title"
                aria-describedby="assign-modal-description"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: '95vh',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: "#0d6c6a",
                    // bgcolor: `linear-gradient(135deg, #0d6c6a, 0%, #0d6c6a, 100%)`,
                    color: 'common.white',
                    borderRadius: '12px 12px 0 0',
                    py: { xs: 2, sm: 2.5 },
                    px: { xs: 2, sm: 3 },
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        bgcolor: '#0d6c6a',
                    }
                }} id="assign-modal-title">
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <LocalShippingIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} aria-hidden="true" />
                            <Typography variant={{ xs: 'h6', sm: 'h5' }} fontWeight="bold">
                                Assign Selected Orders to Container
                            </Typography>
                            <Chip
                                label={`(${selectedOrders.length} Orders)`}
                                size="small"
                                color="secondary"
                                variant="filled"
                                sx={{
                                    ml: 1,
                                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                }}
                            />
                        </Box>
                        <IconButton
                            onClick={() => setOpenAssignModal(false)}
                            aria-label="Close assign modal"
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    transform: 'scale(1.05)',
                                    transition: 'all 0.2s ease',
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
           <DialogContent sx={{
    mt: 2,
    p: { xs: 2, sm: 3 },
    overflow: 'auto',
    height: '80vh',
    maxHeight: '80vh',
    bgcolor: themeColors.background,
}} id="assign-modal-description">
    <Grid  justifyContent="space-between" mb={3} spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12}>
            <Card sx={{
                boxShadow: '0 4px 20px rgba(13, 108, 106, 0.08)',
                borderRadius: 3,
                border: `1px solid ${themeColors.border}`,
                '&:hover': {
                    boxShadow: '0 8px 32px rgba(245, 130, 32, 0.12)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                },
                bgcolor: themeColors.surface,
            }}>
                <CardContent sx={{ width: '100%' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
                        <Stack direction="row" alignItems="center" gap={1.5}>
                            <PersonIcon color="primary" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} aria-hidden="true" />
                            <Typography variant={{ xs: 'h6', sm: 'h5' }} fontWeight="bold" color={themeColors.primary}>
                                All Receivers Details
                            </Typography>
                            <Chip
                                label={`(${totalReceivers})`}
                                size="small"
                                color="info"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            />
                        </Stack>
                        <Stack direction="row" gap={1.5}>
                            <Tooltip title={showAllColumns ? "Switch to Compact View" : "Show All Columns"}>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => setShowAllColumns(!showAllColumns)}
                                    aria-label={`Toggle view to ${showAllColumns ? 'full' : 'compact'}`}
                                    sx={{
                                        color: themeColors.primary,
                                        minWidth: 'auto',
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        '&:hover': { bgcolor: 'rgba(245, 130, 32, 0.08)' },
                                    }}
                                >
                                    <ViewColumnIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    {showAllColumns ? 'Compact' : 'Full'}
                                </Button>
                            </Tooltip>
                            <Tooltip title="Customize Columns">
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleColumnMenuOpen}
                                    aria-label="Customize visible columns"
                                    sx={{
                                        color: themeColors.primary,
                                        borderColor: themeColors.primary,
                                        minWidth: 'auto',
                                        px: 2,
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        '&:hover': {
                                            borderColor: themeColors.primary,
                                            bgcolor: 'rgba(245, 130, 32, 0.08)',
                                        },
                                    }}
                                >
                                    Columns
                                </Button>
                            </Tooltip>
                        </Stack>
                    </Stack>
                    <TableContainer sx={{
                        maxHeight: { xs: 320, sm: 380 },
                        overflow: 'auto',
                        overflowX: 'scroll',
                        borderRadius: 2,
                        border: `1px solid ${themeColors.border}`,
                        bgcolor: themeColors.surface,
                        '&::-webkit-scrollbar': {
                            height: '6px',
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: themeColors.primary,
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: themeColors.background,
                        },
                    }} role="table" aria-label="Receivers details table">
                        <Table size="small" stickyHeader sx={{ minWidth: { xs: 800, sm: 1400 } }}>
                            <TableHead sx={{
                                bgcolor: `linear-gradient(135deg, ${themeColors.background} 0%, #e9ecef 100%)`,
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                            }}>
                                <TableRow>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: columnVisibility.id ? 'table-cell' : 'none'
                                    }} aria-sort="none">ID</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: columnVisibility.name ? 'table-cell' : 'none'
                                    }} aria-sort="none">Name</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: columnVisibility.booking_ref ? 'table-cell' : 'none'
                                    }} aria-sort="none">Order Ref</TableCell>
                                    {/* <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: columnVisibility.category ? 'table-cell' : 'none'
                                    }} aria-sort="none">Category</TableCell> */}
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: { xs: showAllColumns && columnVisibility.address ? 'table-cell' : 'none', sm: columnVisibility.address ? 'table-cell' : 'none' }
                                    }} aria-sort="none">Address</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: { xs: showAllColumns && columnVisibility.contact ? 'table-cell' : 'none', sm: columnVisibility.contact ? 'table-cell' : 'none' }
                                    }} aria-sort="none">Contact</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: { xs: showAllColumns && columnVisibility.email ? 'table-cell' : 'none', sm: columnVisibility.email ? 'table-cell' : 'none' }
                                    }} aria-sort="none">Email</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: { xs: showAllColumns && columnVisibility.wt ? 'table-cell' : 'none', sm: columnVisibility.wt ? 'table-cell' : 'none' }
                                    }} aria-sort="none">Wt (kg)</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: columnVisibility.totalPC ? 'table-cell' : 'none'
                                    }} aria-sort="none">Total PC</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: columnVisibility.deliveredQty ? 'table-cell' : 'none' // New: Delivered Qty column
                                    }} aria-sort="none">Delivered</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: columnVisibility.remainingQty ? 'table-cell' : 'none'
                                    }} aria-sort="none">Remaining</TableCell>
                                    {/* Hidden Assigned Qty column */}
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: 'none'
                                    }} aria-sort="none">Assigned Qty</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`
                                    }} aria-label="Assign quantity">Assign Qty</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.75,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        borderBottom: `2px solid ${themeColors.border}`,
                                        display: { xs: showAllColumns && columnVisibility.containers ? 'table-cell' : 'none', sm: columnVisibility.containers ? 'table-cell' : 'none' }
                                    }} aria-sort="none">Containers</TableCell>
                                    {/* Hidden Actions column */}
                                  
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(() => {
                                    const allReceivers = selectedOrders.flatMap(orderId => {
                                        const order = orders.find(o => o.id === orderId);
                                        return order && order.receivers ? order.receivers.map(rec => ({
                                            ...rec,
                                            booking_ref: order.booking_ref,
                                            orderId: orderId // Add orderId for unique key
                                        })) : [];
                                    });
                                    return allReceivers.map((rec, globalIndex) => {
// const isEditingAssign = editingAssignReceiverId === rec.id;
                                        const fullOrder = detailedOrders[rec.orderId] || orders.find(o => o.id === rec.orderId);
                                        const fullRec = fullOrder?.receivers?.find(r => r.id === rec.id) || rec;
                                        const shippingDetails = fullRec.shippingDetails || [];
                                        const totalPC = shippingDetails.reduce((sum, sd) => sum + (parseInt(sd.totalNumber || '0') || 0), 0);
                                        const totalWeight = shippingDetails.reduce((sum, sd) => sum + (parseFloat(sd.weight || '0') || 0), 0);
                                        // Fixed: Prioritize fullRec data, cap delivered at totalPC
                                        let delivered = fullRec && fullRec.qtyDelivered !== undefined ? parseInt(fullRec.qtyDelivered) || 0 : parseInt(rec.qty_delivered || '0') || 0;
                                        delivered = Math.min(delivered, totalPC);
                                        const recStatus = fullRec.status || rec.status || 'Created'; // Receiver status
                                        const recRemaining = Math.max(0, totalPC - delivered);
                                        const address = shippingDetails.map(detail => detail.deliveryAddress || '').filter(Boolean).join(', ') || fullRec.receiverAddress || rec.receiverAddress || 'N/A';
                                        const contact = fullRec.receiverContact || rec.receiverContact || 'N/A';
                                        const email = fullRec.receiverEmail || rec.receiverEmail || 'N/A';
                                        const category = fullRec.category || rec.category || 'N/A';
console.log('Rendering receiver row:', rec, 'FullRec:', fullRec, 'ShippingDetails:', shippingDetails);
                                        // Sum assigned qty for this receiver from details
                                        const totalAssignedQty = shippingDetails.reduce((sum, _, idx) => {
                                            const key = getDetailKey(rec.orderId, rec.id, idx);
                                            return sum + (assignmentQuantities[key] || 0);
                                        }, 0);
                                        // Sum containers for this receiver
                                        const totalContForRec = shippingDetails.reduce((sum, _, idx) => {
                                            const key = getDetailKey(rec.orderId, rec.id, idx);
                                            return sum + ((selectedContainersPerDetail[key] || []).length);
                                        }, 0);
                                        // Local remaining for this row (updates on edit)
                                        const assignedForRemaining = editingAssignReceiverId === rec.id ? tempAssignQty : totalAssignedQty;
                                        const localRemaining = Math.max(0, totalPC - delivered - assignedForRemaining);
                                        // Assigned containers preview for this receiver (from local state)
                                        const assignedContainersPreview = shippingDetails.reduce((acc, _, idx) => {
                                            const key = getDetailKey(rec.orderId, rec.id, idx);
                                            const conts = selectedContainersPerDetail[key] || [];
                                            return [...acc, ...conts.map(cid => availableContainers.find(c => c.cid === cid)?.container_number || cid)];
                                        }, []).filter(Boolean);
                                        const isExpanded = expandedReceivers.has(`${rec.orderId}-${rec.id}`);
                                        const isEditingAssign = editingAssignReceiverId === rec.id;
                                        const handleAssignBlur = () => {
                                            // Distribute tempAssignQty proportionally to details
                                            const recTotal = totalPC;
                                            if (recTotal > 0) {
                                                shippingDetails.forEach((sd, idx) => {
                                                    const sdTotal = parseInt(sd.totalNumber || 0) || 0;
                                                    const proportion = sdTotal / recTotal;
                                                    const newQty = Math.max(0, Math.round(proportion * tempAssignQty));
                                                    const key = getDetailKey(rec.orderId, rec.id, idx);
                                                    setAssignmentQuantities(prev => ({ ...prev, [key]: newQty }));
                                                });
                                            } else if (shippingDetails.length > 0) {
                                                // If no total, assign equally or to first
                                                const equalQty = Math.floor(tempAssignQty / shippingDetails.length);
                                                shippingDetails.forEach((_, idx) => {
                                                    const key = getDetailKey(rec.orderId, rec.id, idx);
                                                    const qty = idx === 0 ? tempAssignQty - (equalQty * (shippingDetails.length - 1)) : equalQty;
                                                    setAssignmentQuantities(prev => ({ ...prev, [key]: qty }));
                                                });
                                            }
                                            setEditingAssignReceiverId(null);
                                        };
                                        const handleAssignKeyDown = (e) => {
                                            if (e.key === 'Enter') {
                                                // Distribute tempAssignQty proportionally to details (duplicate logic for Enter)
                                                const recTotal = totalPC;
                                                if (recTotal > 0) {
                                                    shippingDetails.forEach((sd, idx) => {
                                                        const sdTotal = parseInt(sd.totalNumber || 0) || 0;
                                                        const proportion = sdTotal / recTotal;
                                                        const newQty = Math.max(0, Math.round(proportion * tempAssignQty));
                                                        const key = getDetailKey(rec.orderId, rec.id, idx);
                                                        setAssignmentQuantities(prev => ({ ...prev, [key]: newQty }));
                                                    });
                                                } else if (shippingDetails.length > 0) {
                                                    const equalQty = Math.floor(tempAssignQty / shippingDetails.length);
                                                    shippingDetails.forEach((_, idx) => {
                                                        const key = getDetailKey(rec.orderId, rec.id, idx);
                                                        const qty = idx === 0 ? tempAssignQty - (equalQty * (shippingDetails.length - 1)) : equalQty;
                                                        setAssignmentQuantities(prev => ({ ...prev, [key]: qty }));
                                                    });
                                                }
                                                setEditingAssignReceiverId(null);
                                            } else if (e.key === 'Escape') {
                                                setEditingAssignReceiverId(null);
                                            }
                                        };
                                        return (
                                            <>
                                                <TableRow
                                                    key={`${rec.orderId}-${rec.id || globalIndex}`} // More unique key using orderId
                                                    hover
                                                    sx={{
                                                        '&:hover': {
                                                            bgcolor: `rgba(${themeColors.primary}, 0.04)`,
                                                            transform: 'scale(1.01)',
                                                        },
                                                        transition: 'all 0.2s ease',
                                                        borderBottom: `1px solid ${themeColors.border}`,
                                                        bgcolor: 'white',
                                                    }}
                                                    role="row"
                                                >
                                                    <TableCell sx={{
                                                        px: { xs: 1.5, sm: 2 },
                                                        py: 1.75,
                                                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                        borderBottom: `1px solid ${themeColors.border}`,
                                                        display: columnVisibility.id ? 'table-cell' : 'none'
                                                    }} role="cell">{rec.id || 'N/A'}</TableCell>
                                                    <TableCell sx={{
                                                        px: { xs: 1.5, sm: 2 },
                                                        py: 1.75,
                                                        fontWeight: 600,
                                                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                        borderBottom: `1px solid ${themeColors.border}`,
                                                        display: columnVisibility.name ? 'table-cell' : 'none'
                                                    }} role="cell">{fullRec.receiverName || rec.receiverName}</TableCell>
                                                    <TableCell sx={{
                                                        px: { xs: 1.5, sm: 2 },
                                                        py: 1.75,
                                                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                        borderBottom: `1px solid ${themeColors.border}`,
                                                        display: columnVisibility.booking_ref ? 'table-cell' : 'none'
                                                    }} role="cell">{rec.booking_ref}</TableCell>
                                                        {/* <TableCell sx={{
                                                            px: { xs: 1.5, sm: 2 },
                                                            py: 1.75,
                                                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                            borderBottom: `1px solid ${themeColors.border}`,
                                                            display: columnVisibility.category ? 'table-cell' : 'none'
                                                        }} role="cell">{category}</TableCell> */}
                                                    <TableCell sx={{
                                                        px: { xs: 1, sm: 2 },
                                                        py: 1,
                                                        fontSize: { xs: '0.8rem', sm: '0.85rem' },
                                                        maxWidth: { xs: 120, sm: 160 },
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        borderBottom: `1px solid ${themeColors.border}`,
                                                        display: { xs: showAllColumns && columnVisibility.address ? 'table-cell' : 'none', sm: columnVisibility.address ? 'table-cell' : 'none' }
                                                    }} role="cell">
                                                        <Tooltip
                                                            title={
                                                                <Box sx={{ p: 1.5, maxWidth: 300 }}>
                                                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: themeColors.textPrimary }}>Shipping Details ({shippingDetails.length || 0}):</Typography>
                                                                    {shippingDetails.length > 0 ? (
                                                                        shippingDetails.map((detail, idx) => (
                                                                            <Box key={idx} sx={{ mb: 1.5, p: 1.5, border: `1px solid ${themeColors.border}`, borderRadius: 2, bgcolor: themeColors.background }}>
                                                                                <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}><strong>Detail {idx + 1}:</strong> {detail.deliveryAddress || 'N/A'}</Typography>
                                                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: themeColors.textSecondary }}>Pickup: {detail.pickupLocation || 'N/A'} | Category: {detail.category || 'N/A'}</Typography>
                                                                                <Typography variant="caption" sx={{ display: 'block', color: themeColors.textSecondary }}>Pieces: {detail.totalNumber || 0} | Weight: {detail.weight || 0} kg</Typography>
                                                                            </Box>
                                                                        ))
                                                                    ) : (
                                                                        <Typography variant="body2" color={themeColors.textSecondary}>No shipping details</Typography>
                                                                    )}
                                                                </Box>
                                                            }
                                                            arrow
                                                            placement="top"
                                                            componentsProps={{
                                                                tooltip: {
                                                                    sx: {
                                                                        bgcolor: themeColors.surface,
                                                                        color: themeColors.textPrimary,
                                                                        '& .MuiTooltip-arrow': { color: themeColors.surface }
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <Typography variant="body2" noWrap sx={{ maxWidth: 140, cursor: 'help', color: themeColors.textSecondary }}>
                                                                {shippingDetails.length > 1 && <sup style={{ color: themeColors.primary }}>({shippingDetails.length})</sup>}
                                                  
                                                                {address.length > 50 ? `${address.substring(0, 50)}...` : address}
                                                            </Typography>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        px: { xs: 1.5, sm: 2 },
                                                        py: 1.75,
                                                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                        maxWidth: { xs: 80, sm: 100 },
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        borderBottom: `1px solid ${themeColors.border}`,
                                                        display: { xs: showAllColumns && columnVisibility.contact ? 'table-cell' : 'none', sm: columnVisibility.contact ? 'table-cell' : 'none' }
                                                    }} role="cell">
                                                        <Typography variant="body2" color={themeColors.textPrimary}>{contact}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        px: { xs: 1.5, sm: 2 },
                                                        py: 1.75,
                                                        fontSize: { xs: '0.8rem', sm: '0.85rem' },
                                                        maxWidth: { xs: 100, sm: 140 },
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        borderBottom: `1px solid ${themeColors.border}`,
                                                        display: { xs: showAllColumns && columnVisibility.email ? 'table-cell' : 'none', sm: columnVisibility.email ? 'table-cell' : 'none' }
                                                    }} role="cell">
                                                        <Typography variant="body2" color={themeColors.textSecondary} noWrap>{email}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        px: { xs: 1.5, sm: 2 },
                                                        py: 1.75,
                                                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                        borderBottom: `1px solid ${themeColors.border}`,
                                                        display: { xs: showAllColumns && columnVisibility.wt ? 'table-cell' : 'none', sm: columnVisibility.wt ? 'table-cell' : 'none' },
                                                        color: themeColors.primary
                                                    }} role="cell">
                                                        <Typography variant="body2" fontWeight="600">{totalWeight || 0}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        px: { xs: 1.5, sm: 2 },
                                                        py: 1.75,
                                                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                        borderBottom: `1px solid ${themeColors.border}`,
                                                        display: columnVisibility.totalPC ? 'table-cell' : 'none',
                                                        color: themeColors.success
                                                    }} role="cell">
                                                        <Typography variant="body2" fontWeight="600">{totalPC}</Typography>
                                                    </TableCell>
                                                    {/* New: Delivered Qty Column */}
                                                    <TableCell sx={{
                                                        px: { xs: 1.5, sm: 2 },
                                                        py: 1.75,
                                                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                        color: themeColors.success,
                                                        borderBottom: `1px solid ${themeColors.border}`,
                                                        display: columnVisibility.deliveredQty ? 'table-cell' : 'none'
                                                    }} role="cell">
                                                        <Chip
                                                            label={delivered}
                                                            size="small"
                                                            color="success"
                                                            variant="filled"
                                                            sx={{
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                            }}
                                                            aria-label={`Delivered pieces: ${delivered}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        px: { xs: 1.5, sm: 2 },
                                                        py: 1.75,
                                                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                        color: localRemaining > 0 ? themeColors.warning : themeColors.success,
                                                        borderBottom: `1px solid ${themeColors.border}`,
                                                        display: columnVisibility.remainingQty ? 'table-cell' : 'none'
                                                    }} role="cell">
                                                        <Chip
                                                            label={localRemaining}
                                                            size="small"
                                                            color={localRemaining > 0 ? "warning" : "success"}
                                                            variant="outlined"
                                                            sx={{
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                            }}
                                                            aria-label={`Remaining pieces: ${localRemaining}`}
                                                        />
                                                    </TableCell>
                                                    {/* Hidden Assigned Qty cell */}
                                                    {/* <TableCell sx={{ }} role="cell"></TableCell> */}
                                               <TableCell sx={{
    px: { xs: 1.5, sm: 2 },
    py: 1.75,
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
    borderBottom: `1px solid ${themeColors.border}`
}} role="cell">
    <Stack direction="row" gap={1.5} alignItems="center" justifyContent="flex-start">
        {/* Assign Qty editable box */}
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                gap: 0.5,
                p: 1,
                borderRadius: 2,
                bgcolor: themeColors.background,
                border: `1px solid ${themeColors.border}`,
                transition: 'all 0.2s ease',
                minWidth: 80,
                '&:hover': {
                    bgcolor: `rgba(${themeColors.primary}, 0.08)`,
                    borderColor: themeColors.primary,
                    transform: 'scale(1.02)',
                },
                '&:focus': {
                    outline: `2px solid ${themeColors.primary}`,
                    outlineOffset: '2px'
                }
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (editingAssignReceiverId !== rec.id) {
                    setEditingAssignReceiverId(rec.id);
                    setTempAssignQty(totalAssignedQty);
                }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (editingAssignReceiverId !== rec.id) {
                        setEditingAssignReceiverId(rec.id);
                        setTempAssignQty(totalAssignedQty);
                    }
                }
            }}
            aria-label={`Edit assign quantity, current value ${totalAssignedQty}`}
        >
            {isEditingAssign ? (
                <Stack direction="row" alignItems="center" gap={0.5}>
                    <TextField
                        size="small"
                        type="number"
                        value={tempAssignQty}
                        onChange={(e) => setTempAssignQty(Math.max(0, Math.min(recRemaining, parseInt(e.target.value) || 0)))}
                        onBlur={handleAssignBlur}
                        onKeyDown={handleAssignKeyDown}
                        inputProps={{
                            min: 0,
                            max: recRemaining,
                            style: {
                                fontSize: '0.85rem',
                                width: 60,
                                textAlign: 'center',
                                py: 0.5
                            }
                        }}
                        sx={{
                            '& .MuiInputBase-root': {
                                minHeight: 32,
                                bgcolor: 'white',
                                borderRadius: 1,
                            },
                            '& .MuiInputBase-input': { py: 0.5 },
                            '& .MuiInputBase-root:focus': {
                                borderColor: themeColors.primary,
                                boxShadow: `0 0 0 2px rgba(${themeColors.primary}, 0.1)`,
                            }
                        }}
                        autoFocus
                        aria-label="Edit assign quantity input"
                    />
                    <Tooltip title="Cancel">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingAssignReceiverId(null);
                            }}
                            sx={{
                                p: 0.25,
                                color: themeColors.error,
                                '&:hover': {
                                    bgcolor: 'rgba(244, 67, 54, 0.1)',
                                    transform: 'scale(1.1)',
                                }
                            }}
                            aria-label="Cancel edit"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ) : (
                <Stack direction="row" alignItems="center" gap={0.5}>
                    {/* <Typography variant="body2" fontWeight="600" color={themeColors.textPrimary}>{`Delivered: ${delivered}`}</Typography> */}
                    <Tooltip title="Edit Assign Qty"
                  
                    >
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingAssignReceiverId(rec.id);
                            }}
                            size="small"
                            sx={{
                                p: 0.25,
                                color: themeColors.primary,
                                '&:hover': {
                                    bgcolor: `rgba(${themeColors.primary}, 0.1)`,
                                    transform: 'scale(1.1)',
                                }
                            }}
                            aria-label="Edit assign quantity"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )}
        </Box>
    </Stack>
</TableCell>
<TableCell sx={{
    px: { xs: 1.5, sm: 2 },
    py: 1.75,
    borderBottom: `1px solid ${themeColors.border}`,
    display: { xs: showAllColumns && columnVisibility.containers ? 'table-cell' : 'none', sm: columnVisibility.containers ? 'table-cell' : 'none' },
    whiteSpace: 'nowrap'
}} role="cell">
    <Stack direction="row" gap={1.5} alignItems="center" justifyContent="flex-start" flexWrap="wrap">
        {totalContForRec > 0 && (
            <Tooltip title={`Selected: ${assignedContainersPreview.join(', ')}`}>
                <Chip
                    label={assignedContainersPreview.length > 1 ? `${assignedContainersPreview.slice(0, 1)}... (${totalContForRec})` : assignedContainersPreview.join(', ')}
                    size="small"
                    variant="outlined"
                    color="success"
                    sx={{
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        maxWidth: { xs: 100, sm: 120 },
                        flexShrink: 0,
                        borderColor: themeColors.success,
                        color: themeColors.success,
                    }}
                    aria-label={`Selected containers: ${assignedContainersPreview.join(', ')}`}
                />
            </Tooltip>
        )}
        <Tooltip title={`Click to ${isExpanded ? 'collapse' : 'expand'} shipping details for per-detail assignment`}>
            <IconButton
                size="medium"
                onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(rec.orderId, rec.id);
                }}
                sx={{
                    color: totalAssignedQty > 0 || totalContForRec > 0 ? themeColors.primary : 'action.active',
                    '&:hover': {
                        bgcolor: `rgba(${themeColors.primary}, 0.08)`,
                        transform: 'scale(1.1)',
                    },
                    '&:focus': {
                        outline: `2px solid ${themeColors.primary}`,
                        outlineOffset: '2px'
                    }
                }}
                aria-label={`Toggle shipping details ${isExpanded ? 'collapse' : 'expand'}`}
                aria-expanded={isExpanded}
            >
                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
        </Tooltip>
        {shippingDetails.length === 1 && totalContForRec === 0 && !rec.containers?.length && (
            (() => {
                const detail = shippingDetails[0];
                console.log('Single detail for receiver:', detail);
                const key = getDetailKey(rec.orderId, rec.id, 0);
                const currentConts = selectedContainersPerDetail[key] || [];
                const availConts = getAvailableContainersForKey(key);
                return (
                    <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
                        <InputLabel shrink>Containers</InputLabel>
                        <Select
                            multiple
                            value={currentConts}
                            onChange={(e) => handleContainerChange(key, e.target.value)}
                            renderValue={(selected) => {
                                if (selected.length === 0) return 'Select';
                                const names = selected.map(cid => availConts.find(c => c.cid === cid)?.container_number || cid);
                                return names.length <= 2 ? names.join(', ') : `${selected.length} cont.`;
                            }}
                            displayEmpty
                            sx={{
                                fontSize: '0.85rem',
                                '& .MuiSelect-select': {
                                    py: 0.75,
                                }
                            }}
                            aria-label="Select containers"
                        >
                            {availConts.map(c => (
                                <MenuItem key={c.cid} value={c.cid} sx={{ fontSize: '0.85rem' }}>
                                    {c.container_number}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );
            })()
        )}
        {totalContForRec === 0 && rec.containers && rec.containers.length > 0 ? (
            <Stack direction="row" alignItems="center" gap={0.5}>
                <Chip
                    label={rec.containers.length > 1 ? `${rec.containers.slice(0, 1).join(', ')}...` : rec.containers.join(', ')}
                    size="small"
                    variant="outlined"
                    color="info"
                    sx={{
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        maxWidth: { xs: 100, sm: 120 },
                        flexShrink: 0,
                        borderColor: themeColors.secondary,
                        color: themeColors.secondary,
                    }}
                />
                <Tooltip title="Remove Existing Containers">
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveContainers(rec.id);
                        }}
                        sx={{
                            p: 0.25,
                            color: themeColors.primary,
                            '&:hover': {
                                bgcolor: `rgba(${themeColors.primary}, 0.1)`,
                                transform: 'scale(1.1)',
                            }
                        }}
                        aria-label="Remove existing containers"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        ) : totalContForRec === 0 && !rec.containers?.length ? (
            <Chip
                label="None"
                size="small"
                color="default"
                variant="outlined"
                sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    borderColor: themeColors.textSecondary,
                    color: themeColors.textSecondary,
                }}
                aria-label="No containers assigned"
            />
        ) : null}
    </Stack>
</TableCell>
                                                    {/* Hidden Actions cell */}
                                                    {/* <TableCell sx={{ display: 'none' }} role="cell"></TableCell> */}
                                                </TableRow>
                                                {isExpanded && shippingDetails.length > 1 && shippingDetails.map((detail, idx) => {
                                                    const key = getDetailKey(rec.orderId, rec.id, idx);
                                                    const currentConts = selectedContainersPerDetail[key] || [];
                                                    const availConts = getAvailableContainersForKey(key);
                                                    const detailRemaining = parseInt(detail.remainingItems || '0') || 0;
                                                    const detailDelivered = parseInt(detail.deliveredItems || '0') || 0;
                                                    const hasAssignment = (assignmentQuantities[key] || 0) > 0 || currentConts.length > 0;
                                                    const detailAssignQty = assignmentQuantities[key] || 0;
                                                    console.log('Detail assignment state:', { detail, detailAssignQty, currentConts });
                                                    return (
                                                        <TableRow
                                                            key={`sub-${rec.orderId}-${rec.id}-${idx}`}
                                                            sx={{
                                                                bgcolor: `rgba(${themeColors.background}, 0.6)`,
                                                                '&:hover': {
                                                                    bgcolor: themeColors.background
                                                                },
                                                                borderBottom: `2px solid ${themeColors.border}`,
                                                            }}
                                                            role="row"
                                                        >
                                                            <TableCell colSpan={13} sx={{ p: 3, borderTop: `2px solid ${themeColors.border}` }}> {/* Increased colspan for new column */}
                                                                <Stack direction={{ xs: 'column', md: 'row' }} gap={2.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
                                                                    <Box sx={{ flex: 1 }}>
                                                                        <Typography
                                                                            variant="h6"
                                                                            fontWeight="bold"
                                                                            color={themeColors.primary}
                                                                            gutterBottom
                                                                            sx={{
                                                                                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                                                                mb: 1.5,
                                                                            }}
                                                                        >
                                                                            Shipping Detail {idx + 1}
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="body1"
                                                                            sx={{
                                                                                mb: 1.5,
                                                                                fontSize: { xs: '0.95rem', sm: '1rem' },
                                                                                color: themeColors.textPrimary,
                                                                                lineHeight: 1.4,
                                                                            }}
                                                                        >{detail.deliveryAddress || 'N/A'}
                                                                        </Typography>
                                                                        <Box // Changed from Typography to Box to avoid <p> wrapper for inline elements
                                                                            sx={{
                                                                                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                flexWrap: 'wrap',
                                                                                gap: 1,
                                                                                color: themeColors.textSecondary,
                                                                            }}
                                                                        >
                                                                            <Chip
                                                                                label={recStatus}
                                                                                size="small"
                                                                                color={recStatus === 'Delivered' ? "success" : recStatus === 'In Transit' ? "info" : "default"}
                                                                                variant="filled"
                                                                                sx={{
                                                                                    fontSize: '0.75rem',
                                                                                    fontWeight: 600,
                                                                                }}
                                                                                aria-label={`Status: ${recStatus}`}
                                                                            /> |
                                                                            Category: <Chip
                                                                                label={detail.category || 'N/A'}
                                                                                size="small"
                                                                                color="info"
                                                                                variant="outlined"
                                                                                sx={{
                                                                                    fontSize: '0.75rem',
                                                                                    borderColor: themeColors.secondary,
                                                                                    color: themeColors.secondary,
                                                                                    ml: 0.5,
                                                                                    mr: 1,
                                                                                }}
                                                                                aria-label={`Category: ${detail.category || 'N/A'}`}
                                                                            /> |
                                                                            Total Pieces: <strong style={{ color: themeColors.textPrimary }}>{detail.totalNumber || 0}</strong> |
                                                                            Delivered: <strong style={{ color: themeColors.success }}>{detailDelivered}</strong> pcs | {/* Enhanced: Show delivered */}
                                                                            Remaining: <strong style={{ color: themeColors.warning }}>{detailRemaining}</strong> pcs |
                                                                            Weight: <strong style={{ color: themeColors.textPrimary }}>{detail.weight || 0} kg</strong>
                                                                        </Box>
                                                                        {/* New: Progress Bar for Delivery Status */}
                                                                        <LinearProgress
                                                                            variant="determinate"
                                                                            value={(detailDelivered / (parseInt(detail.totalNumber || 0) || 1)) * 100}
                                                                            sx={{
                                                                                mt: 1.5,
                                                                                height: 8,
                                                                                borderRadius: 4,
                                                                                bgcolor: themeColors.background,
                                                                                '& .MuiLinearProgress-bar': {
                                                                                    borderRadius: 4,
                                                                                    bgcolor: themeColors.success,
                                                                                }
                                                                            }}
                                                                            aria-label={`Delivery progress: ${detailDelivered} of ${detail.totalNumber}`}
                                                                        />
                                                                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: themeColors.textSecondary, textAlign: 'center' }}>
                                                                            {detailDelivered} / {detail.totalNumber} delivered ({Math.round((detailDelivered / (parseInt(detail.totalNumber || 0) || 1)) * 100)}%)
                                                                        </Typography>
                                                                    </Box>
                                                                    <Stack
                                                                        direction="row"
                                                                        gap={1.5}
                                                                        alignItems="flex-end"
                                                                        justifyContent="flex-start"
                                                                        sx={{
                                                                            minWidth: { xs: '100%', md: 'auto' },
                                                                            flexWrap: 'wrap',
                                                                        }}
                                                                    >
                                                                        <TextField
                                                                            size="small"
                                                                            type="number"
                                                                            label="Assign Qty"
                                                                            value={assignmentQuantities[key] || ''}
                                                                            onChange={(e) => {
                                                                                const val = parseInt(e.target.value) || 0;
                                                                                const qty = Math.max(0, Math.min(detailRemaining, val));
                                                                                handleQuantityChange(key, qty);
                                                                            }}
                                                                            inputProps={{
                                                                                min: 0,
                                                                                max: detailRemaining,
                                                                                style: {
                                                                                    width: 120,
                                                                                    fontSize: '0.9rem'
                                                                                }
                                                                            }}
                                                                            helperText={`Max: ${detailRemaining}`}
                                                                            sx={{
                                                                                width: { xs: '100%', md: 'auto' },
                                                                                minWidth: 120,
                                                                                flex: 1,
                                                                                maxWidth: { md: 140 },
                                                                                '& .MuiInputBase-root': {
                                                                                    minHeight: 44,
                                                                                    bgcolor: 'white',
                                                                                    borderRadius: 2,
                                                                                },
                                                                                '& .MuiInputBase-input': { py: 1 },
                                                                                '& .MuiFormHelperText-root': {
                                                                                    fontSize: '0.8rem',
                                                                                    mt: 0.75,
                                                                                    color: themeColors.textSecondary,
                                                                                },
                                                                                '& .MuiInputBase-root:focus': {
                                                                                    borderColor: themeColors.primary,
                                                                                    boxShadow: `0 0 0 2px rgba(${themeColors.primary}, 0.1)`,
                                                                                }
                                                                            }}
                                                                            aria-label={`Assign quantity for detail ${idx + 1}`}
                                                                        />
                                                                        <FormControl size="small" sx={{
                                                                            minWidth: 160,
                                                                            flex: 1,
                                                                            maxWidth: { md: 180 },
                                                                            '& .MuiFormControl-root': {
                                                                                minHeight: 44,
                                                                            }
                                                                        }}>
                                                                            <InputLabel shrink>Containers</InputLabel>
                                                                            <Select
                                                                                multiple
                                                                                value={currentConts}
                                                                                onChange={(e) => handleContainerChange(key, e.target.value)}
                                                                                label="Containers"
                                                                                renderValue={(selected) => {
                                                                                    if (selected.length === 0) return 'Select containers';
                                                                                    const names = selected.map(cid => availConts.find(c => c.cid === cid)?.container_number || cid);
                                                                                    return names.length <= 2 ? names.join(', ') : `${selected.length} containers`;
                                                                                }}
                                                                                displayEmpty
                                                                                sx={{
                                                                                    fontSize: '0.9rem',
                                                                                    minHeight: 44,
                                                                                    '& .MuiSelect-select': {
                                                                                        py: 1,
                                                                                    },
                                                                                    '& .MuiOutlinedInput-root': {
                                                                                        minHeight: 44,
                                                                                    },
                                                                                    '& .MuiOutlinedInput-root:focus': {
                                                                                        borderColor: themeColors.primary,
                                                                                        boxShadow: `0 0 0 2px rgba(${themeColors.primary}, 0.1)`,
                                                                                    }
                                                                                }}
                                                                                aria-label={`Select containers for detail ${idx + 1}`}
                                                                            >
                                                                                {availConts.map(c => (
                                                                                    <MenuItem key={c.cid} value={c.cid} sx={{ fontSize: '0.9rem' }}>
                                                                                        <Stack direction="row" alignItems="center" gap={1}>
                                                                                            <Typography variant="body2" fontWeight="600">{c.container_number}</Typography>
                                                                                            <Typography variant="caption" color="text.secondary">({c.location || 'N/A'})</Typography>
                                                                                        </Stack>
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </FormControl>
                                                                        {hasAssignment && currentConts.length > 0 && (
                                                                            <Tooltip title={`Selected: ${currentConts.map(cid => availConts.find(c => c.cid === cid)?.container_number || cid).join(', ')}`}>
                                                                                <Chip
                                                                                    label={currentConts.length > 1 ? `${currentConts.slice(0, 1).map(cid => availConts.find(c => c.cid === cid)?.container_number || cid)}... (${currentConts.length})` : currentConts.map(cid => availConts.find(c => c.cid === cid)?.container_number || cid).join(', ')}
                                                                                    size="small"
                                                                                    variant="outlined"
                                                                                    color="success"
                                                                                    sx={{
                                                                                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                                                                        maxWidth: { xs: 100, sm: 120 },
                                                                                        flexShrink: 0,
                                                                                        borderColor: themeColors.success,
                                                                                        color: themeColors.success,
                                                                                    }}
                                                                                    aria-label={`Selected containers for detail: ${currentConts.map(cid => availConts.find(c => c.cid === cid)?.container_number || cid).join(', ')}`}
                                                                                />
                                                                            </Tooltip>
                                                                        )}
                                                                        {hasAssignment && (
                                                                            <Tooltip title={`Remove assignment: ${detailAssignQty} pcs, ${currentConts.length} cont`}>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleRemoveDetailAssignment(rec.orderId, rec.id, idx);
                                                                                    }}
                                                                                    color="error"
                                                                                    sx={{
                                                                                        p: 0.75,
                                                                                        minHeight: 44,
                                                                                        minWidth: 44,
                                                                                        alignSelf: 'flex-end',
                                                                                        '&:hover': {
                                                                                            bgcolor: themeColors.error,
                                                                                            color: 'white',
                                                                                            transform: 'scale(1.1)',
                                                                                        },
                                                                                        '&:focus': {
                                                                                            outline: `2px solid ${themeColors.primary}`,
                                                                                            outlineOffset: '2px'
                                                                                        }
                                                                                    }}
                                                                                    aria-label={`Remove assignment for detail ${idx + 1}`}
                                                                                >
                                                                                    <DeleteIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}
                                                                    </Stack>
                                                                </Stack>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </>
                                        );
                                    });
                                })()}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {selectedOrders.length === 0 ? (
                        <Alert
                            severity="warning"
                            sx={{
                                mt: 3,
                                borderRadius: 2,
                                boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
                                border: `1px solid ${themeColors.warning}`,
                                bgcolor: `rgba(${themeColors.warning}, 0.08)`,
                            }}
                            role="alert"
                        >
                            <AlertTitle>No Orders Selected</AlertTitle>
                            <Typography variant="body2" color={themeColors.textSecondary}>Please select orders from the main table to assign containers.</Typography>
                        </Alert>
                    ) : totalReceivers === 0 ? (
                        <Alert
                            severity="info"
                            sx={{
                                mt: 3,
                                borderRadius: 2,
                                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)',
                                border: `1px solid ${themeColors.secondary}`,
                                bgcolor: `rgba(${themeColors.secondary}, 0.08)`,
                            }}
                            role="alert"
                        >
                            <AlertTitle>No Receivers Found</AlertTitle>
                            <Typography variant="body2" color={themeColors.textSecondary}>The selected orders have no associated receivers.</Typography>
                        </Alert>
                    ) : null}
                </CardContent>
            </Card>
        </Grid>
    </Grid>
    {/* New: Detailed Assignments Preview Table */}
    {detailedAssignments.length > 0 && (
        <Grid item xs={12}>
            <Card sx={{
                boxShadow: '0 4px 20px rgba(13, 108, 106, 0.08)',
                borderRadius: 3,
                border: `1px solid ${themeColors.border}`,
                '&:hover': {
                    boxShadow: '0 8px 32px rgba(245, 130, 32, 0.12)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                },
                bgcolor: themeColors.surface,
            }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
                        <AssignmentIcon color="primary" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} aria-hidden="true" />
                        <Typography variant={{ xs: 'h6', sm: 'h5' }} fontWeight="bold" color={themeColors.primary}>
                            Current Assignments Preview ({detailedAssignments.length})
                        </Typography>
                    </Stack>
                    <TableContainer sx={{
                        maxHeight: 240,
                        overflow: 'auto',
                        overflowX: 'auto',
                        borderRadius: 2,
                        border: `1px solid ${themeColors.border}`,
                        bgcolor: themeColors.surface,
                        '&::-webkit-scrollbar': {
                            height: '6px',
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: themeColors.primary,
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: themeColors.background,
                        },
                    }} role="table" aria-label="Assignments preview table">
                        <Table size="small" stickyHeader sx={{ minWidth: 1000 }}>
                            <TableHead sx={{
                                bgcolor: `linear-gradient(135deg, ${themeColors.background} 0%, #e9ecef 100%)`,
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                            }}>
                                <TableRow>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: 2.5,
                                        py: 1.75,
                                        fontSize: '0.9rem',
                                        borderBottom: `2px solid ${themeColors.border}`,
                                    }} aria-sort="none">Order Ref</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: 2.5,
                                        py: 1.75,
                                        fontSize: '0.9rem',
                                        borderBottom: `2px solid ${themeColors.border}`,
                                    }} aria-sort="none">Receiver</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: 2.5,
                                        py: 1.75,
                                        fontSize: '0.9rem',
                                        borderBottom: `2px solid ${themeColors.border}`,
                                    }} aria-sort="none">Shipping Detail</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: 2.5,
                                        py: 1.75,
                                        fontSize: '0.9rem',
                                        borderBottom: `2px solid ${themeColors.border}`,
                                    }} aria-sort="none">Qty</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: 2.5,
                                        py: 1.75,
                                        fontSize: '0.9rem',
                                        borderBottom: `2px solid ${themeColors.border}`,
                                    }} aria-sort="none">Containers</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: 2.5,
                                        py: 1.75,
                                        fontSize: '0.9rem',
                                        borderBottom: `2px solid ${themeColors.border}`,
                                    }} aria-sort="none">Action</TableCell> {/* Existing action */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {detailedAssignments.map((assign, index) => (
                                    <TableRow
                                        key={index}
                                        hover
                                        sx={{
                                            '&:hover': {
                                                bgcolor: `rgba(${themeColors.primary}, 0.04)`,
                                                transform: 'scale(1.01)',
                                            },
                                            transition: 'all 0.2s ease',
                                            borderBottom: `1px solid ${themeColors.border}`,
                                            bgcolor: 'white',
                                        }}
                                        role="row"
                                    >
                                        <TableCell sx={{ px: 2.5, py: 1.75, fontSize: '0.9rem', borderBottom: `1px solid ${themeColors.border}` }} role="cell">{assign.orderRef}</TableCell>
                                        <TableCell sx={{ px: 2.5, py: 1.75, fontSize: '0.9rem', fontWeight: 600, borderBottom: `1px solid ${themeColors.border}` }} role="cell">{assign.receiverName}</TableCell>
                                        <TableCell sx={{ px: 2.5, py: 1.75, fontSize: '0.9rem', borderBottom: `1px solid ${themeColors.border}` }} role="cell">
                                            <Tooltip title={assign.detailAddress} arrow placement="top">
                                                <Typography
                                                    variant="body2"
                                                    noWrap
                                                    sx={{
                                                        maxWidth: 180,
                                                        color: themeColors.textSecondary,
                                                        fontSize: '0.85rem',
                                                    }}
                                                >
                                                    {assign.detailAddress.length > 25 ? `${assign.detailAddress.substring(0, 25)}...` : assign.detailAddress}
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell sx={{
                                            px: 2.5,
                                            py: 1.75,
                                            fontSize: '0.9rem',
                                            color: themeColors.success,
                                            fontWeight: 'bold',
                                            borderBottom: `1px solid ${themeColors.border}`,
                                        }} role="cell">
                                            <Chip
                                                label={assign.qty}
                                                size="small"
                                                color="success"
                                                variant="filled"
                                                sx={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                }}
                                                aria-label={`Quantity: ${assign.qty}`}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ px: 2.5, py: 1.75, fontSize: '0.9rem', borderBottom: `1px solid ${themeColors.border}` }} role="cell">
                                            <Tooltip title={assign.containers} arrow placement="top">
                                                <Chip
                                                    label={assign.containers.length > 20 ? `${assign.containers.substring(0, 20)}...` : assign.containers}
                                                    size="small"
                                                    color="info"
                                                    variant="outlined"
                                                    sx={{
                                                        fontSize: '0.8rem',
                                                        borderColor: themeColors.secondary,
                                                        color: themeColors.secondary,
                                                    }}
                                                    aria-label={`Containers: ${assign.containers}`}
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${themeColors.border}` }} role="cell">
                                            <Tooltip title="Remove Assignment">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveDetailAssignment(assign.orderId, assign.recId, assign.detailIdx)}
                                                    sx={{
                                                        color: themeColors.error,
                                                        '&:hover': {
                                                            bgcolor: themeColors.error,
                                                            color: 'white',
                                                            transform: 'scale(1.1)',
                                                        },
                                                        '&:focus': {
                                                            outline: `2px solid ${themeColors.primary}`,
                                                            outlineOffset: '2px'
                                                        }
                                                    }}
                                                    aria-label={`Remove assignment for ${assign.receiverName}`}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Grid>
    )}
<Grid container flexDirection={'row'} justifyContent={'space-between'} sx={{ mt: 3 }}>
    <Box width={{ xs: '100%', sm: '69%' }} xs={6} sm={6}>
        <Card sx={{
            boxShadow: '0 4px 20px rgba(13, 108, 106, 0.08)',
            borderRadius: 3,
            border: `1px solid ${themeColors.border}`,
            '&:hover': {
                boxShadow: '0 8px 32px rgba(245, 130, 32, 0.12)',
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease',
            },
            bgcolor: themeColors.surface,
        }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Stack direction="row" alignItems="center" gap={1.5}>
                        <InventoryIcon color="primary" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} aria-hidden="true" />
                        <Typography variant={{ xs: 'h6', sm: 'h5' }} fontWeight="bold" color={themeColors.primary}>
                            Available Open Containers ({containers.length})
                        </Typography>
                        {totalContainersUsed > 0 && (
                            <Chip
                                label={`Used: ${totalContainersUsed}`}
                                size="small"
                                color="warning"
                                sx={{
                                    fontSize: '0.75rem',
                                    borderColor: themeColors.warning,
                                    color: themeColors.warning,
                                }}
                                aria-label={`Containers used: ${totalContainersUsed}`}
                            />
                        )}
                    </Stack>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={fetchContainers}
                        disabled={loadingContainers}
                        startIcon={loadingContainers ? <CircularProgress size={16} color="primary" /> : <RefreshIcon />}
                        sx={{
                            minWidth: 'auto',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            borderColor: themeColors.primary,
                            color: themeColors.primary,
                            borderRadius: 2,
                            px: 2,
                            '&:hover': {
                                borderColor: themeColors.primary,
                                bgcolor: `rgba(${themeColors.primary}, 0.08)`,
                            },
                            '&:focus': {
                                outline: `2px solid ${themeColors.primary}`,
                                outlineOffset: '2px'
                            }
                        }}
                        aria-label="Refresh containers list"
                    >
                        {loadingContainers ? 'Loading...' : 'Refresh'}
                    </Button>
                </Stack>
                {loadingContainers ? (
                    <Stack direction="row" justifyContent="center" alignItems="center" py={4} spacing={2}>
                        <CircularProgress size={24} color="primary" aria-label="Loading containers" />
                        <Typography variant="body2" color={themeColors.textSecondary} sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            Fetching containers...
                        </Typography>
                    </Stack>
                ) : containers.length === 0 ? (
                    <Alert
                        severity="info"
                        icon={<InfoIcon />}
                        sx={{
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)',
                            border: `1px solid ${themeColors.secondary}`,
                            bgcolor: `rgba(${themeColors.secondary}, 0.08)`,
                        }}
                        role="alert"
                    >
                        <AlertTitle>No Containers Available</AlertTitle>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: themeColors.textSecondary }}>No open containers found. Try refreshing or check if any are marked as 'Available'.</Typography>
                    </Alert>
                ) : (
                    <TableContainer sx={{
                        maxHeight: { xs: 300, sm: 340 },
                        overflow: 'auto',
                        overflowX: 'clip',
                        borderRadius: 2,
                        border: `1px solid ${themeColors.border}`,
                        bgcolor: themeColors.surface,
                        '&::-webkit-scrollbar': {
                            height: '6px',
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: themeColors.primary,
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: themeColors.background,
                        },
                    }} role="table" aria-label="Available containers table">
                        <Table size="small" stickyHeader sx={{ minWidth: { xs: 500, sm: 800 } }}>
                            <TableHead sx={{
                                bgcolor: `linear-gradient(135deg, ${themeColors.background} 0%, #e9ecef 100%)`,
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                            }}>
                                <TableRow>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2.5 },
                                        py: 1.75,
                                        fontSize: '0.9rem',
                                        borderBottom: `2px solid ${themeColors.border}`,
                                    }} aria-sort="none">Container No</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2.5 },
                                        py: 1.75,
                                        fontSize: '0.9rem',
                                        borderBottom: `2px solid ${themeColors.border}`,
                                    }} aria-sort="none">Status</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2.5 },
                                        py: 1.75,
                                        fontSize: '0.9rem',
                                        borderBottom: `2px solid ${themeColors.border}`,
                                    }} aria-sort="none">Location</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 700,
                                        color: themeColors.primary,
                                        px: { xs: 1.5, sm: 2.5 },
                                        py: 1.75,
                                        fontSize: '0.9rem',
                                        borderBottom: `2px solid ${themeColors.border}`,
                                    }} aria-sort="none">Owner Type</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {containers.map((container) => (
                                    <TableRow
                                        key={container.cid}
                                        hover
                                        sx={{
                                            '&:hover': {
                                                bgcolor: `rgba(${themeColors.primary}, 0.04)`,
                                                transform: 'scale(1.01)',
                                            },
                                            transition: 'all 0.2s ease',
                                            borderBottom: `1px solid ${themeColors.border}`,
                                            bgcolor: 'white',
                                        }}
                                        role="row"
                                    >
                                        <TableCell sx={{
                                            px: { xs: 1.5, sm: 2.5 },
                                            py: 1.75,
                                            fontWeight: 600,
                                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                            borderBottom: `1px solid ${themeColors.border}`,
                                        }} role="cell">
                                            <Stack direction="row" alignItems="center" gap={1}>
                                                <Typography variant="body2" fontWeight="600" color={themeColors.textPrimary}>{container.container_number}</Typography>
                                                {getGloballySelectedCids().includes(container.cid) && (
                                                    <Chip
                                                        label="Assigned"
                                                        size="small"
                                                        color="success"
                                                        variant="filled"
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                        }}
                                                        aria-label="Container assigned"
                                                    />
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1.75, borderBottom: `1px solid ${themeColors.border}` }} role="cell">
                                            <Chip
                                                label={container.derived_status}
                                                size="small"
                                                color={container.derived_status === 'Available' ? 'success' : 'default'}
                                                variant="filled"
                                                sx={{
                                                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                                                    fontWeight: 600,
                                                    borderRadius: 1.5,
                                                }}
                                                aria-label={`Status: ${container.derived_status}`}
                                            />
                                        </TableCell>
                                        <TableCell sx={{
                                            px: { xs: 1.5, sm: 2.5 },
                                            py: 1.75,
                                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                            color: themeColors.textSecondary,
                                            borderBottom: `1px solid ${themeColors.border}`,
                                        }} role="cell">{container.location || 'N/A'}</TableCell>
                                        <TableCell sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1.75, borderBottom: `1px solid ${themeColors.border}` }} role="cell">
                                            <Chip
                                                label={container.owner_type?.toUpperCase()}
                                                size="small"
                                                variant="outlined"
                                                color="info"
                                                sx={{
                                                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                                                    fontWeight: 600,
                                                    borderColor: themeColors.secondary,
                                                    color: themeColors.secondary,
                                                    borderRadius: 1.5,
                                                }}
                                                aria-label={`Owner type: ${container.owner_type}`}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    </Box>
    <Box width={{ xs: '100%', sm: '30%' }} xs={6} sm={6}>
        <Card sx={{
            boxShadow: '0 4px 20px rgba(13, 108, 106, 0.08)',
            borderRadius: 3,
            border: `1px solid ${themeColors.border}`,
            '&:hover': {
                boxShadow: '0 8px 32px rgba(245, 130, 32, 0.12)',
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease',
            },
            bgcolor: themeColors.surface,
        }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
                    <InventoryIcon color="primary" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} aria-hidden="true" />
                    <Typography variant={{ xs: 'h6', sm: 'h5' }} fontWeight="bold" color={themeColors.primary}>
                        Assignment Summary
                    </Typography>
                </Stack>
                <Stack spacing={2.5}>
                    <Stack direction="row" justifyContent="space-between" sx={{ py: 1, px: 1, borderRadius: 2, bgcolor: `rgba(${themeColors.primary}, 0.04)` }}>
                        <Typography variant="body1" fontWeight="600" color={themeColors.textPrimary} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Orders:</Typography>
                        <Chip
                            label={selectedOrders.length}
                            color="primary"
                            size="small"
                            variant="outlined"
                            sx={{
                                fontSize: '0.8rem',
                                borderColor: themeColors.primary,
                                color: themeColors.primary,
                            }}
                            aria-label={`Orders: ${selectedOrders.length}`}
                        />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ py: 1, px: 1, borderRadius: 2, bgcolor: `rgba(${themeColors.secondary}, 0.04)` }}>
                        <Typography variant="body1" fontWeight="600" color={themeColors.textPrimary} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Receivers:</Typography>
                        <Chip
                            label={totalReceivers}
                            color="info"
                            size="small"
                            variant="outlined"
                            sx={{
                                fontSize: '0.8rem',
                                borderColor: themeColors.secondary,
                                color: themeColors.secondary,
                            }}
                            aria-label={`Receivers: ${totalReceivers}`}
                        />
                    </Stack>
                    {/* New: Total Delivered in Summary */}
                    <Stack direction="row" justifyContent="space-between" sx={{ py: 1, px: 1, borderRadius: 2, bgcolor: `rgba(${themeColors.success}, 0.04)` }}>
                        <Typography variant="body1" fontWeight="600" color={themeColors.textPrimary} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Total Delivered:</Typography>
                        <Chip
                            label={totalDelivered}
                            color="success"
                            size="small"
                            variant="filled"
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                            }}
                            aria-label={`Total delivered: ${totalDelivered}`}
                        />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ py: 1, px: 1, borderRadius: 2, bgcolor: `rgba(${themeColors.success}, 0.04)` }}>
                        <Typography variant="body1" fontWeight="600" color={themeColors.textPrimary} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Assigned Details:</Typography>
                        <Chip
                            label={totalAssignedDetails}
                            color="success"
                            size="small"
                            variant="filled"
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                            }}
                            aria-label={`Assigned details: ${totalAssignedDetails}`}
                        />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ py: 1, px: 1, borderRadius: 2, bgcolor: `rgba(${themeColors.warning}, 0.04)` }}>
                        <Typography variant="body1" fontWeight="600" color={themeColors.textPrimary} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Containers Used:</Typography>
                        <Chip
                            label={totalContainersUsed}
                            color="warning"
                            size="small"
                            variant="outlined"
                            sx={{
                                fontSize: '0.8rem',
                                borderColor: themeColors.warning,
                                color: themeColors.warning,
                            }}
                            aria-label={`Containers used: ${totalContainersUsed}`}
                        />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ py: 1, px: 1, borderRadius: 2, bgcolor: `rgba(${themeColors.primary}, 0.06)` }}>
                        <Typography variant="body1" fontWeight="600" color={themeColors.textPrimary} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Total Qty:</Typography>
                        <Chip
                            label={detailedAssignments.reduce((sum, a) => sum + a.qty, 0)}
                            color="primary"
                            size="small"
                            variant="filled"
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                            }}
                            aria-label={`Total quantity: ${detailedAssignments.reduce((sum, a) => sum + a.qty, 0)}`}
                        />
                    </Stack>
                </Stack>
                {totalAssignedDetails === 0 && availableContainers.length > 0 && (
                    <Alert
                        severity="info"
                        sx={{
                            mt: 3,
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)',
                            border: `1px solid ${themeColors.secondary}`,
                            bgcolor: `rgba(${themeColors.secondary}, 0.08)`,
                        }}
                        role="alert"
                        icon={<InfoIcon />}
                    >
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: themeColors.textSecondary }}>Assign quantities and containers per shipping detail in the table above (expand rows with multiple details for inline editing).</Typography>
                    </Alert>
                )}
            </CardContent>
        </Card>
    </Box>
</Grid>
    <Grid container spacing={2} sx={{ mt: 3 }}>
        {selectedOrders.length > 0 && totalAssignedDetails > 0 && (
            <Grid item xs={12}>
                <Collapse in={true} timeout={300}>
                    <Alert
                        severity="success"
                        icon={<CheckIcon />}
                        sx={{
                            mt: 2,
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(76, 175, 80, 0.15)',
                            animation: 'slideIn 0.3s ease-out',
                            bgcolor: `rgba(${themeColors.success}, 0.06)`,
                            border: `1px solid ${themeColors.success}`,
                            '& .MuiAlert-icon': { fontSize: '1.5rem' },
                            '& .MuiAlert-message': { py: 1.5 },
                        }}
                        role="alert"
                    >
                        <AlertTitle sx={{ fontSize: '1.1rem', fontWeight: 700, color: themeColors.success }}>Ready to Assign</AlertTitle>
                        <Typography variant="body1" sx={{ fontWeight: '600', fontSize: '0.95rem', color: themeColors.textPrimary }}>
                            This will assign <strong style={{ color: themeColors.primary }}>{totalContainersUsed}</strong> containers to <strong style={{ color: themeColors.primary }}>{totalAssignedDetails}</strong> shipping details across <strong style={{ color: themeColors.primary }}>{selectedOrders.length}</strong> orders. See preview table above for details.
                        </Typography>
                    </Alert>
                </Collapse>
            </Grid>
        )}
    </Grid>
</DialogContent>
                <DialogActions sx={{
                    p: { xs: 2.5, sm: 3 },
                    bgcolor: `linear-gradient(135deg, ${themeColors.background} 0%, #e9ecef 100%)`,
                    borderTop: `1px solid ${themeColors.border}`,
                    justifyContent: 'space-between',
                    gap: 2,
                }}>
                    <Button
                        onClick={() => setOpenAssignModal(false)}
                        variant="outlined"
                        size="medium"
                        sx={{
                            borderRadius: 3,
                            borderColor: themeColors.primary,
                            color: themeColors.primary,
                            px: 4,
                            py: 1.25,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': {
                                borderColor: themeColors.primary,
                                bgcolor: `rgba(${themeColors.primary}, 0.08)`,
                                boxShadow: `0 4px 12px rgba(${themeColors.primary}, 0.2)`,
                                transform: 'scale(1.02)',
                            },
                            '&:focus': {
                                outline: `2px solid ${themeColors.primary}`,
                                outlineOffset: '2px'
                            }
                        }}
                        aria-label="Cancel assignment"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={enhancedHandleAssign}
                        variant="contained"
                        size="medium"
                        disabled={selectedOrders.length === 0 || totalAssignedDetails === 0}
                        sx={{
                            borderRadius: 3,
                            bgcolor: `linear-gradient(135deg, ${themeColors.primary} 0%, #e65100 100%)`,
                            px: 5,
                            py: 1.25,
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: totalAssignedDetails > 0 ? `0 4px 16px rgba(${themeColors.primary}, 0.3)` : 'none',
                            '&:hover': {
                                bgcolor: `linear-gradient(135deg, #e65100 0%, #d84315 100%)`,
                                boxShadow: `0 6px 20px rgba(${themeColors.primary}, 0.4)`,
                                transform: 'scale(1.02)',
                            },
                            '&.Mui-disabled': {
                                bgcolor: 'grey.400',
                                boxShadow: 'none',
                                transform: 'none',
                            },
                            '&:focus': {
                                outline: `2px solid ${themeColors.primary}`,
                                outlineOffset: '2px'
                            }
                        }}
                        startIcon={<AssignmentIcon />}
                        aria-label={`Assign ${selectedOrders.length} orders`}
                    >
                        Assign ({selectedOrders.length} Orders)
                    </Button>
                </DialogActions>
                {/* Column Visibility Popover */}
                <Popover
                    open={Boolean(columnAnchorEl)}
                    anchorEl={columnAnchorEl}
                    onClose={handleColumnMenuClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    sx={{ mt: 1 }}
                    PaperProps={{
                        sx: {
                            borderRadius: 2,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                            bgcolor: themeColors.surface,
                            border: `1px solid ${themeColors.border}`,
                        }
                    }}
                    aria-labelledby="column-menu-title"
                >
                    <Box sx={{ p: 2.5, minWidth: 240 }}>
                        <Typography id="column-menu-title" variant="subtitle1" sx={{ mb: 2, fontWeight: '700', color: themeColors.primary }}>Visible Columns</Typography>
                        <Divider sx={{ mb: 2, borderColor: themeColors.border }} />
                        <List dense role="list">
                            {Object.keys(columnVisibility).map((column) => (
                                <ListItem key={column} disablePadding sx={{ py: 1, borderRadius: 1, '&:hover': { bgcolor: `rgba(${themeColors.primary}, 0.04)` } }} role="listitem">
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Checkbox
                                            edge="start"
                                            checked={columnVisibility[column]}
                                            onChange={(e) => handleColumnToggle(e, column)}
                                            size="small"
                                            sx={{
                                                '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
                                                color: themeColors.primary,
                                            }}
                                            aria-label={`Toggle ${column} column visibility`}
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
                                        primaryTypographyProps={{
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            color: themeColors.textPrimary,
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Popover>
            </Dialog>
            {/* New Edit Receiver Modal */}
            <Dialog
                open={openEditModal}
                onClose={() => {
                    setOpenEditModal(false);
                    setSelectedReceiver(null);
                    setEditForm({
                        receiverName: '',
                        receiverContact: '',
                        receiverEmail: '',
                        receiverAddress: '',
                        category: '',
                        totalNumber: 0,
                        totalWeight: 0,
                        status: 'Created',
                        shippingDetails: []
                    });
                    setEditErrors({});
                }}
                maxWidth="sm"
                fullWidth
                aria-labelledby="edit-receiver-title"
                aria-describedby="edit-receiver-description"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: `linear-gradient(135deg, ${themeColors.primary} 0%, #e65100 100%)`,
                    color: 'common.white',
                    borderRadius: '12px 12px 0 0',
                    py: 2.5,
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                    }
                }} id="edit-receiver-title">
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5" fontWeight="bold">
                            Edit Receiver
                        </Typography>
                        <IconButton
                            onClick={() => setOpenEditModal(false)}
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    transform: 'scale(1.05)',
                                }
                            }}
                            aria-label="Close edit receiver modal"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 3, bgcolor: themeColors.surface }} id="edit-receiver-description">
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Receiver Name *"
                            name="receiverName"
                            value={editForm.receiverName}
                            onChange={handleEditChange}
                            error={!!editErrors.receiverName}
                            helperText={editErrors.receiverName}
                            variant="outlined"
                            size="medium"
                            sx={{
                                '& .MuiInputLabel-root': {
                                    fontSize: '0.95rem',
                                    color: themeColors.textSecondary,
                                },
                                '& .MuiInputBase-input': {
                                    fontSize: '0.95rem',
                                    py: 1.25,
                                },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    bgcolor: 'white',
                                },
                                '& .MuiOutlinedInput-root:focus': {
                                    borderColor: themeColors.primary,
                                    boxShadow: `0 0 0 2px rgba(${themeColors.primary}, 0.1)`,
                                },
                                '& .MuiFormHelperText-root': {
                                    fontSize: '0.8rem',
                                    mt: 0.5,
                                }
                            }}
                            aria-required="true"
                            aria-invalid={!!editErrors.receiverName}
                        />
                        <TextField
                            fullWidth
                            label="Receiver Address *"
                            name="receiverAddress"
                            value={editForm.receiverAddress}
                            onChange={handleEditChange}
                            error={!!editErrors.receiverAddress}
                            helperText={editErrors.receiverAddress}
                            variant="outlined"
                            size="medium"
                            multiline
                            rows={3}
                            sx={{
                                '& .MuiInputLabel-root': {
                                    fontSize: '0.95rem',
                                    color: themeColors.textSecondary,
                                },
                                '& .MuiInputBase-input': {
                                    fontSize: '0.95rem',
                                    py: 1.25,
                                },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    bgcolor: 'white',
                                },
                                '& .MuiOutlinedInput-root:focus': {
                                    borderColor: themeColors.primary,
                                    boxShadow: `0 0 0 2px rgba(${themeColors.primary}, 0.1)`,
                                },
                                '& .MuiFormHelperText-root': {
                                    fontSize: '0.8rem',
                                    mt: 0.5,
                                }
                            }}
                            aria-required="true"
                            aria-invalid={!!editErrors.receiverAddress}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth
                                label="Contact Number *"
                                name="receiverContact"
                                value={editForm.receiverContact}
                                onChange={handleEditChange}
                                error={!!editErrors.receiverContact}
                                helperText={editErrors.receiverContact}
                                variant="outlined"
                                size="medium"
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        fontSize: '0.95rem',
                                        color: themeColors.textSecondary,
                                    },
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.95rem',
                                        py: 1.25,
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: 'white',
                                    },
                                    '& .MuiOutlinedInput-root:focus': {
                                        borderColor: themeColors.primary,
                                        boxShadow: `0 0 0 2px rgba(${themeColors.primary}, 0.1)`,
                                    },
                                    '& .MuiFormHelperText-root': {
                                        fontSize: '0.8rem',
                                        mt: 0.5,
                                    }
                                }}
                                aria-required="true"
                                aria-invalid={!!editErrors.receiverContact}
                            />
                            <TextField
                                fullWidth
                                label="Email *"
                                name="receiverEmail"
                                value={editForm.receiverEmail}
                                onChange={handleEditChange}
                                error={!!editErrors.receiverEmail}
                                helperText={editErrors.receiverEmail}
                                variant="outlined"
                                size="medium"
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        fontSize: '0.95rem',
                                        color: themeColors.textSecondary,
                                    },
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.95rem',
                                        py: 1.25,
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: 'white',
                                    },
                                    '& .MuiOutlinedInput-root:focus': {
                                        borderColor: themeColors.primary,
                                        boxShadow: `0 0 0 2px rgba(${themeColors.primary}, 0.1)`,
                                    },
                                    '& .MuiFormHelperText-root': {
                                        fontSize: '0.8rem',
                                        mt: 0.5,
                                    }
                                }}
                                aria-required="true"
                                aria-invalid={!!editErrors.receiverEmail}
                            />
                        </Stack>
                        <TextField
                            fullWidth
                            label="Category"
                            name="category"
                            value={editForm.category}
                            onChange={handleEditChange}
                            variant="outlined"
                            size="medium"
                            sx={{
                                '& .MuiInputLabel-root': {
                                    fontSize: '0.95rem',
                                    color: themeColors.textSecondary,
                                },
                                '& .MuiInputBase-input': {
                                    fontSize: '0.95rem',
                                    py: 1.25,
                                },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    bgcolor: 'white',
                                },
                                '& .MuiOutlinedInput-root:focus': {
                                    borderColor: themeColors.primary,
                                    boxShadow: `0 0 0 2px rgba(${themeColors.primary}, 0.1)`,
                                }
                            }}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth
                                label="Total Pieces"
                                name="totalNumber"
                                type="number"
                                value={editForm.totalNumber}
                                onChange={handleEditChange}
                                variant="outlined"
                                size="medium"
                                inputProps={{ min: 0 }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        fontSize: '0.95rem',
                                        color: themeColors.textSecondary,
                                    },
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.95rem',
                                        py: 1.25,
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: 'white',
                                    },
                                    '& .MuiOutlinedInput-root:focus': {
                                        borderColor: themeColors.primary,
                                        boxShadow: `0 0 0 2px rgba(${themeColors.primary}, 0.1)`,
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Total Weight (kg)"
                                name="totalWeight"
                                type="number"
                                value={editForm.totalWeight}
                                onChange={handleEditChange}
                                variant="outlined"
                                size="medium"
                                inputProps={{ min: 0, step: 0.01 }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        fontSize: '0.95rem',
                                        color: themeColors.textSecondary,
                                    },
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.95rem',
                                        py: 1.25,
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: 'white',
                                    },
                                    '& .MuiOutlinedInput-root:focus': {
                                        borderColor: themeColors.primary,
                                        boxShadow: `0 0 0 2px rgba(${themeColors.primary}, 0.1)`,
                                    }
                                }}
                            />
                        </Stack>
                        <FormControl fullWidth size="medium" variant="outlined">
                            <InputLabel sx={{ fontSize: '0.95rem', color: themeColors.textSecondary }}>Status</InputLabel>
                            <Select
                                name="status"
                                value={editForm.status}
                                onChange={handleEditChange}
                                label="Status"
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.95rem',
                                        py: 1.25,
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: 'white',
                                    },
                                    '& .MuiOutlinedInput-root:focus': {
                                        borderColor: themeColors.primary,
                                        boxShadow: `0 0 0 2px rgba(${themeColors.primary}, 0.1)`,
                                    }
                                }}
                                aria-label="Status select"
                            >
                                <MenuItem value="Created" sx={{ fontSize: '0.95rem' }}>Created</MenuItem>
                                <MenuItem value="In Transit" sx={{ fontSize: '0.95rem' }}>In Transit</MenuItem>
                                <MenuItem value="Delivered" sx={{ fontSize: '0.95rem' }}>Delivered</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{
                    p: 3,
                    pt: 0,
                    justifyContent: 'flex-end',
                    gap: 2,
                    bgcolor: themeColors.background,
                    borderTop: `1px solid ${themeColors.border}`,
                }}>
                    <Button
                        onClick={() => {
                            setOpenEditModal(false);
                            setSelectedReceiver(null);
                            setEditForm({
                                receiverName: '',
                                receiverContact: '',
                                receiverEmail: '',
                                receiverAddress: '',
                                category: '',
                                totalNumber: 0,
                                totalWeight: 0,
                                status: 'Created',
                                shippingDetails: []
                            });
                            setEditErrors({});
                        }}
                        variant="outlined"
                        size="medium"
                        color="inherit"
                        sx={{
                            borderRadius: 3,
                            px: 4,
                            py: 1.25,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderColor: themeColors.primary,
                            color: themeColors.primary,
                            '&:hover': {
                                borderColor: themeColors.primary,
                                bgcolor: `rgba(${themeColors.primary}, 0.08)`,
                            },
                            '&:focus': {
                                outline: `2px solid ${themeColors.primary}`,
                                outlineOffset: '2px'
                            }
                        }}
                        aria-label="Cancel editing receiver"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveReceiver}
                        variant="contained"
                        size="medium"
                        startIcon={<SaveIcon />}
                        disabled={Object.keys(editErrors).length > 0}
                        sx={{
                            borderRadius: 3,
                            bgcolor: `linear-gradient(135deg, ${themeColors.primary} 0%, #e65100 100%)`,
                            px: 4,
                            py: 1.25,
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: '0 4px 16px rgba(245, 130, 32, 0.3)',
                            '&:hover': {
                                bgcolor: `linear-gradient(135deg, #e65100 0%, #d84315 100%)`,
                                boxShadow: '0 6px 20px rgba(245, 130, 32, 0.4)',
                                transform: 'scale(1.02)',
                            },
                            '&.Mui-disabled': {
                                bgcolor: 'grey.400',
                                boxShadow: 'none',
                                transform: 'none',
                            },
                            '&:focus': {
                                outline: `2px solid ${themeColors.primary}`,
                                outlineOffset: '2px'
                            }
                        }}
                        aria-label="Update receiver details"
                    >
                        Update Receiver
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
export default AssignModal;