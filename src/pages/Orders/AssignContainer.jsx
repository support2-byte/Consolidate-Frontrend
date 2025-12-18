// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import {
//   Dialog, DialogTitle, DialogContent, DialogActions,
//   Box, Grid, Stack, Card, CardContent, Typography,
//   Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
//   Chip, Button, IconButton, TextField, Select, MenuItem, InputLabel, FormControl,
//   Tooltip, Popover, List, ListItem, ListItemText, Checkbox, Divider,
//   Alert, AlertTitle, LinearProgress, Collapse, Accordion, AccordionSummary, AccordionDetails,
//   CircularProgress,
// } from '@mui/material';
// import { Snackbar, } from "@mui/material";
// import {
//   Close as CloseIcon, LocalShipping as LocalShippingIcon, Person as PersonIcon, Inventory as InventoryIcon, Assignment as AssignmentIcon,
//   ViewColumn as ViewColumnIcon, Edit as EditIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
//   Check as CheckIcon, Info as InfoIcon, Save as SaveIcon, Add as AddIcon,
// } from '@mui/icons-material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';



import{api} from '../../api'; // Assume api is a configured axios instance
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent,
  Grid, Stack, Box, Typography,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Button, IconButton, Chip, Alert, LinearProgress, Divider,
  Popover, ListItem, ListItemText, Checkbox,
  Accordion, AccordionSummary, AccordionDetails,Tooltip,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
// Assume api is imported from your API config
// import api from '../api'; // Adjust path as needed

const AssignModal = ({
  onUpdateAssignedQty,
  onRemoveContainers,
  openAssignModal,
  setOpenAssignModal,
  selectedOrders,
  orders,
  containers,
  loadingContainers,
  fetchContainers,
  handleAssign,
  handleReceiverAction, // Kept for compatibility
  onUpdateReceiver,
  onRefreshOrders,
}) => {
  // Simplified theme colors
  const theme = {
    primary: '#f58220',
    secondary: '#1a9c8f',
    background: '#f8f9fa',
    surface: '#ffffff',
    border: '#e0e0e0',
    textPrimary: '#212121',
    textSecondary: '#757575',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    divider: '#e0e0e0',
  };
const getStatusColors = (status) => {
    // Extend your existing getStatusColors function to handle new statuses
    const colorMap = {
      'Order Created': { bg: '#e3f2fd', text: '#1565c0' },
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
  // Initial objects (kept for mapping)
  const initialReceiver = {
    id: null, receiverName: '', receiverContact: '', receiverEmail: '', receiverAddress: '',
    category: '', totalNumber: 0, totalWeight: 0, status: 'Created', fullPartial: '',
    qtyDelivered: '0', eta: '', etd: '', shippingLine: '', shippingDetails: [], isNew: false,
    validationWarnings: null,
  };
  const initialSenderObject = {
    id: null, senderName: '', senderContact: '', senderEmail: '', senderAddress: '',
    status: 'Created', fullPartial: '', qtyDelivered: '0', eta: '', etd: '', shippingLine: '',
    shippingDetails: [], isNew: false, validationWarnings: null,
  };
  const initialShippingDetail = {
    deliveryAddress: '', pickupLocation: '', category: '', totalNumber: '', weight: '',
    remainingItems: '', deliveredItems: '0',
  };

  // States (consolidated and optimized)
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    id: false, name: true, booking_ref: true, category: true, totalPC: true, wt: true,
    assigned: false, remainingQty: true, deliveredQty: true, address: true,
    contact: false, email: false, containers: true, action: true,
    assignQty: true, // Always visible
  });
  const [columnAnchorEl, setColumnAnchorEl] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [editForm, setEditForm] = useState({
    receiverName: '', receiverContact: '', receiverEmail: '', receiverAddress: '',
    category: '', totalNumber: 0, totalWeight: 0, status: 'Created', shippingDetails: [],
  });
  const [editErrors, setEditErrors] = useState({});
  const [assignmentQuantities, setAssignmentQuantities] = useState({});
  const [selectedContainersPerDetail, setSelectedContainersPerDetail] = useState({});
  const [expandedReceivers, setExpandedReceivers] = useState(new Set());
  const [detailedOrders, setDetailedOrders] = useState({});
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [editingAssignReceiverId, setEditingAssignReceiverId] = useState(null);
  const [tempAssignQty, setTempAssignQty] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const availableContainers = useMemo(() => containers.filter(c => c.derived_status === 'Available' || 'Assigned to job'), [containers]);

  // Column configuration
  const headerCols = [
    'id', 'name', 'booking_ref', 'address', 'contact', 'email', 'wt',
    'totalPC', 'deliveredQty', 'remainingQty', 'assignQty', 'containers', 'action'
  ];
  const displayNames = {
    id: 'ID',
    name: 'Receiver',
    booking_ref: 'Booking Ref',
    address: 'Address',
    contact: 'Contact',
    email: 'Email',
    wt: 'Weight',
    totalPC: 'Units (Remaining)',
    deliveredQty: 'Delivered',
    remainingQty: 'Remaining',
    assignQty: 'Assign Qty',
    containers: 'Containers',
    action: 'Actions',
  };
  const visibleColumnCount = useMemo(
    () => headerCols.filter(col => columnVisibility[col] !== false).length,
    [columnVisibility, headerCols]
  );

  // Utility functions
  const snakeToCamel = useCallback((str) => {
    if (!str) return str;
    return str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
  }, []);

  const getDetailKey = useCallback((orderId, recId, detailIdx) => `${orderId}-${recId}-${detailIdx}`, []);
  const getGloballySelectedCids = useCallback(() => Object.values(selectedContainersPerDetail).flat(), [selectedContainersPerDetail]);

  const getAvailableContainersForKey = useCallback((key) => {
    const globalSelected = getGloballySelectedCids();
    const currentSelected = selectedContainersPerDetail[key] || [];
    return availableContainers.filter(c => !globalSelected.includes(c.cid) || currentSelected.includes(c.cid));
  }, [selectedContainersPerDetail, availableContainers, getGloballySelectedCids]);


      const StatusChip = ({ status }) => {
        const colors = getStatusColors(status);
        return (
            <Chip
                label={status}
                size="small"
                sx={{
                    height: 25,
                    fontSize: 12,
                    marginLeft: 0,
                    backgroundColor: colors.bg,
                    color: colors.text,
                }}
            />
        );
    };
  // Handlers
  const handleColumnMenuOpen = useCallback((event) => setColumnAnchorEl(event.currentTarget), []);
  const handleColumnMenuClose = useCallback(() => setColumnAnchorEl(null), []);
  const handleColumnToggle = useCallback((event, column) => {
    setColumnVisibility(prev => ({ ...prev, [column]: event.target.checked }));
  }, []);

  const handleContainerChange = useCallback((key, newValue) => {
    setSelectedContainersPerDetail(prev => ({ ...prev, [key]: newValue }));
  }, []);

  const handleQuantityChange = useCallback((key, value, max = Infinity) => {
    const qty = Math.max(0, Math.min(max, parseInt(value) || 0));
    setAssignmentQuantities(prev => ({ ...prev, [key]: qty }));
  }, []);

  const toggleExpanded = useCallback((orderId, recId) => {
    const key = `${orderId}-${recId}`;
    setExpandedReceivers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key); else newSet.add(key);
      return newSet;
    });
  }, []);

  const handleRemoveContainersForReceiver = useCallback((recId, orderId) => {
    setSelectedContainersPerDetail(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(k => { if (k.startsWith(`${orderId}-${recId}-`)) delete newState[k]; });
      return newState;
    });
    setAssignmentQuantities(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(k => { if (k.startsWith(`${orderId}-${recId}-`)) delete newState[k]; });
      return newState;
    });
    toggleExpanded(orderId, recId);
  }, [toggleExpanded]);

  const handleRemoveDetailAssignment = useCallback((orderId, recId, detailIdx) => {
    const key = getDetailKey(orderId, recId, detailIdx);
    setSelectedContainersPerDetail(prev => { const newState = { ...prev }; delete newState[key]; return newState; });
    setAssignmentQuantities(prev => { const newState = { ...prev }; delete newState[key]; return newState; });
  }, [getDetailKey]);

  // Fetch order
  const fetchOrder = useCallback(async (id) => {
    try {
      const response = await api.get(`/api/orders/${id}`, { params: { includeContainer: true } });
      if (!response.data) throw new Error('Invalid response data');

      const camelData = {};
      Object.keys(response.data).forEach(apiKey => {
        let value = response.data[apiKey];
        if (value === null || value === undefined) value = '';
        if (['eta', 'etd', 'drop_date', 'delivery_date'].includes(apiKey)) {
          if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) value = date.toISOString().split('T')[0];
          } else value = '';
        }
        camelData[snakeToCamel(apiKey)] = value;
      });

      camelData.senderType = response.data.sender_type || 'sender';
      const ownerPrefix = camelData.senderType === 'sender' ? 'sender' : 'receiver';
      const ownerFields = ['name', 'contact', 'address', 'email', 'ref', 'remarks'];
      ownerFields.forEach(field => {
        const apiKey = `${ownerPrefix}_${field}`;
        const snakeVal = response.data[apiKey];
        if (snakeVal !== null && snakeVal !== undefined) {
          camelData[`${ownerPrefix}${field.charAt(0).toUpperCase() + field.slice(1)}`] = snakeVal;
        }
      });

      const panel2ApiKey = 'receivers';
      const panel2Prefix = camelData.senderType === 'sender' ? 'receiver' : 'sender';
      const panel2ListKey = camelData.senderType === 'sender' ? 'receivers' : 'senders';
      const initialItem = panel2Prefix === 'receiver' ? initialReceiver : initialSenderObject;
      let mappedPanel2 = [];
      if (response.data[panel2ApiKey] && Array.isArray(response.data[panel2ApiKey])) {
        mappedPanel2 = response.data[panel2ApiKey].map(rec => {
          if (!rec) return null;
          const camelRec = { ...initialItem, shippingDetails: [], isNew: false, validationWarnings: null };
          Object.keys(rec).forEach(apiKey => {
            let val = rec[apiKey] ?? '';
            const camelKey = snakeToCamel(apiKey);
            if (['name', 'contact', 'address', 'email'].includes(camelKey)) {
              camelRec[`${panel2Prefix}${camelKey.charAt(0).toUpperCase() + camelKey.slice(1)}`] = val;
            } else {
              camelRec[camelKey] = val;
            }
          });
          // Fixed: Map shippingDetails array properly
          if (rec.shippingdetails && Array.isArray(rec.shippingdetails)) {
            camelRec.shippingDetails = rec.shippingdetails.map(sd => {
              const camelSd = { ...initialShippingDetail };
              Object.keys(sd).forEach(k => {
                camelSd[snakeToCamel(k)] = sd[k];
              });
              return camelSd;
            });
          } else if (!camelRec.shippingDetails?.length) {
            camelRec.shippingDetails = [{ ...initialShippingDetail, totalNumber: rec.total_number || '', weight: rec.total_weight || '' }];
          }
          camelRec.status = rec.status || 'Created';
          camelRec.fullPartial = camelRec.fullPartial || '';
          camelRec.qtyDelivered = String(camelRec.qtyDelivered ?? 0);
          // Validation based on original totals and delivered
          const shippingDetails = camelRec.shippingDetails;
          const recTotalOriginal = shippingDetails.reduce((sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0), 0);
          const delivered = parseInt(camelRec.qtyDelivered || 0);
          let warnings = null;
          if (recTotalOriginal <= 0) warnings = { totalNumber: 'Must be positive' };
          else if (delivered > recTotalOriginal) warnings = { ...warnings, qtyDelivered: 'Cannot exceed totalNumber' };
          camelRec.validationWarnings = warnings;
          return camelRec;
        }).filter(Boolean);
      }

      mappedPanel2.forEach(rec => {
        if (rec.eta === '' && camelData.eta) rec.eta = camelData.eta;
        if (rec.etd === '' && camelData.etd) rec.etd = camelData.etd;
        if (rec.shippingLine === '' && camelData.shippingLine) rec.shippingLine = camelData.shippingLine;
      });

      camelData[panel2ListKey] = mappedPanel2.length ? mappedPanel2 : [{ ...initialItem, shippingDetails: [], isNew: true }];
      const otherListKey = panel2ListKey === 'receivers' ? 'senders' : 'receivers';
      camelData[otherListKey] = [];

      const cleanAttachments = (paths) => (paths || []).map(path => 
        typeof path === 'string' && path.startsWith('function wrap()') ? path.substring(62) : path
      ).filter(Boolean);
      const apiBase = import.meta.env.VITE_API_URL;
      camelData.attachments = cleanAttachments(camelData.attachments || []).map(path => 
        path.startsWith('http') ? path : `${apiBase}${path}`
      );
      camelData.gatepass = cleanAttachments(camelData.gatepass || []).map(path => 
        path.startsWith('http') ? path : `${apiBase}${path}`
      );

      return camelData;
    } catch (err) {
      console.error('Error fetching order:', err);
      throw err;
    }
  }, [snakeToCamel]);

  // Optimized useEffect for fetching
  useEffect(() => {
    if (!openAssignModal || selectedOrders.length === 0) return;

    const fetchAllDetails = async () => {
      if (fetchingDetails) return;
      setFetchingDetails(true);

      const updatedOrders = { ...detailedOrders };
      let needsUpdate = false;
      for (const orderId of selectedOrders) {
        if (!updatedOrders[orderId]) {
          try {
            updatedOrders[orderId] = await fetchOrder(orderId);
            needsUpdate = true;
          } catch (err) {
            console.error(`Failed to fetch details for order ${orderId}:`, err);
          }
        }
      }

      if (needsUpdate) {
        setDetailedOrders(updatedOrders);
      }
      if (onRefreshOrders) onRefreshOrders();
      setFetchingDetails(false);
    };

    fetchAllDetails();
  }, [openAssignModal, selectedOrders, fetchOrder, onRefreshOrders, fetchingDetails, detailedOrders]);

  // Edit receiver handlers
  const handleEditReceiver = useCallback(async (rec) => {
    try {
      const orderId = rec.orderId;
      if (!detailedOrders[orderId]) await fetchOrder(orderId);
      const fullOrder = detailedOrders[orderId] || orders.find(o => o.id === orderId);
      const fullRec = fullOrder?.receivers?.find(r => r.id === rec.id) || rec;
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
        shippingDetails: fullRec.shippingDetails || [],
      });
      setEditErrors({});
      setOpenEditModal(true);
    } catch (err) {
      console.error('Error fetching receiver details:', err);
      setEditForm({
        receiverName: rec.receiverName || '',
        receiverContact: rec.receiverContact || '',
        receiverEmail: rec.receiverEmail || '',
        receiverAddress: rec.receiverAddress || '',
        category: rec.category || '',
        totalNumber: rec.totalNumber || 0,
        totalWeight: rec.totalWeight || 0,
        status: rec.status || 'Created',
        shippingDetails: rec.shippingDetails || [],
      });
      setEditErrors({});
      setOpenEditModal(true);
    }
  }, [detailedOrders, orders, fetchOrder]);

  const handleEditChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    if (editErrors[name]) setEditErrors(prev => ({ ...prev, [name]: '' }));
  }, [editErrors]);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!editForm.receiverName.trim()) errors.receiverName = 'Receiver name is required';
    if (!editForm.receiverAddress.trim()) errors.receiverAddress = 'Address is required';
    if (!editForm.receiverContact.trim()) errors.receiverContact = 'Contact is required';
    if (!editForm.receiverEmail.trim() || !/\S+@\S+\.\S+/.test(editForm.receiverEmail)) {
      errors.receiverEmail = 'Valid email is required';
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editForm.receiverName, editForm.receiverAddress, editForm.receiverContact, editForm.receiverEmail, editErrors]);

  const handleSaveReceiver = useCallback(() => {
    if (!validateForm()) return;
    if (onUpdateReceiver && selectedReceiver) {
      onUpdateReceiver({ ...selectedReceiver, ...editForm });
    }
    setOpenEditModal(false);
    setSelectedReceiver(null);
    setEditForm({
      receiverName: '', receiverContact: '', receiverEmail: '', receiverAddress: '',
      category: '', totalNumber: 0, totalWeight: 0, status: 'Created', shippingDetails: [],
    });
  }, [validateForm, onUpdateReceiver, selectedReceiver, editForm]);

  const showToast = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Enhanced assign handler
  const enhancedHandleAssign = useCallback(() => {
    console.log('Assignment Quantities:', assignmentQuantities);
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
          if (Object.keys(acc[orderId][rec.id]).length === 0) delete acc[orderId][rec.id];
        });
        if (Object.keys(acc[orderId]).length === 0) delete acc[orderId];
      }
      return acc;
    }, {});

    if (Object.keys(assignments).length === 0) {
      showToast('Please assign at least one detail.', 'warning');
      return;
    }

    console.log('Built assignments payload:', assignments);
    handleAssign(assignments);
    setOpenAssignModal(false);
  }, [selectedOrders, detailedOrders, orders, assignmentQuantities, selectedContainersPerDetail, getDetailKey, handleAssign, setOpenAssignModal, showToast]);

  // Computed values
  const totalReceivers = useMemo(() => selectedOrders.reduce((total, id) => total + (orders.find(o => o.id === id)?.receivers?.length || 0), 0), [selectedOrders, orders]);
  const totalAssignedDetails = useMemo(() => {
    let count = 0;
    selectedOrders.forEach(orderId => {
      const fullOrder = detailedOrders[orderId] || orders.find(o => o.id === orderId);
      fullOrder?.receivers?.forEach(rec => {
        rec.shippingDetails?.forEach((_, idx) => {
          const key = getDetailKey(orderId, rec.id, idx);
          if ((assignmentQuantities[key] || 0) > 0 && (selectedContainersPerDetail[key] || []).length > 0) count++;
        });
      });
    });
    return count;
  }, [selectedOrders, detailedOrders, orders, assignmentQuantities, selectedContainersPerDetail, getDetailKey]);
  const totalContainersUsed = useMemo(() => new Set(getGloballySelectedCids()).size, [getGloballySelectedCids]);
  const totalDelivered = useMemo(() => {
    let sum = 0;
    selectedOrders.forEach(orderId => {
      const fullOrder = detailedOrders[orderId] || orders.find(o => o.id === orderId);
      fullOrder?.receivers?.forEach(rec => sum += parseInt(rec.qtyDelivered || 0));
    });
    return sum;
  }, [selectedOrders, detailedOrders, orders]);

  const detailedAssignments = useMemo(() => {
    const ass = [];
    selectedOrders.forEach(orderId => {
      const fullOrder = detailedOrders[orderId] || orders.find(o => o.id === orderId);
      fullOrder?.receivers?.forEach(rec => {
        rec.shippingDetails?.forEach((detail, idx) => {
          const key = getDetailKey(orderId, rec.id, idx);
          const qty = assignmentQuantities[key] || 0;
          const conts = selectedContainersPerDetail[key] || [];
          if (qty > 0 && conts.length > 0) {
            const containerNumbers = conts.map(cid => availableContainers.find(c => c.cid === cid)?.container_number || String(cid)).join(', ');
            ass.push({ orderRef: fullOrder.bookingRef || 'N/A', receiverName: rec.receiverName || 'N/A', detailAddress: detail.deliveryAddress || `Detail ${idx + 1}`, qty, containers: containerNumbers, detailIdx: idx, recId: rec.id, orderId });
          }
        });
      });
    });
    return ass;
  }, [selectedOrders, detailedOrders, orders, assignmentQuantities, selectedContainersPerDetail, availableContainers, getDetailKey]);

 // Enhanced ReceiverRow with Accordion for Hierarchy
// Enhanced ReceiverRow with Accordion for Hierarchy
const ReceiverRow = ({ rec, globalIndex }) => {
  const fullOrder = detailedOrders[rec.orderId] || orders.find(o => o.id === rec.orderId);
  const fullRec = fullOrder?.receivers?.find(r => r.id === rec.id) || rec;
  const shippingDetails = fullRec.shippingDetails || [];
  const [localShippingDetails, setLocalShippingDetails] = useState(() =>
    shippingDetails.map(sd => ({
      ...sd,
      containerDetails: sd.containerDetails ? [...sd.containerDetails] : []
    }))
  );

  // Update localShippingDetails when shippingDetails change (e.g., on re-render)
  useEffect(() => {
    setLocalShippingDetails(shippingDetails.map(sd => ({
      ...sd,
      containerDetails: sd.containerDetails ? [...sd.containerDetails] : []
    })));
  }, [shippingDetails]);

  const totalPC = localShippingDetails.reduce((sum, sd) => sum + (parseInt(sd.remainingItems || sd.totalNumber || 0) || 0), 0); // Sum of remaining
  const totalWeight = localShippingDetails.reduce((sum, sd) => sum + parseFloat(sd.weight || 0), 0);
  let delivered = parseInt(fullRec.qtyDelivered || rec.qty_delivered || 0) || 0;
  delivered = Math.min(delivered, totalPC + totalPC); // Cap reasonably, but since remaining is post-delivered
  const totalNewAssignedQty = localShippingDetails.reduce((sum, _, idx) => sum + (assignmentQuantities[getDetailKey(rec.orderId, rec.id, idx)] || 0), 0);
  const localRemaining = Math.max(0, totalPC - totalNewAssignedQty);
  const isEditingAssign = editingAssignReceiverId === rec.id;
  const address = localShippingDetails.map(d => d.deliveryAddress).filter(Boolean).join(', ') || fullRec.receiverAddress || 'N/A';
  const contact = fullRec.receiverContact || 'N/A';
  const email = fullRec.receiverEmail || 'N/A';

  const existingContainers = localShippingDetails.flatMap(sd =>
    (sd.containerDetails || []).map(cd => cd.container?.cid).filter(Boolean)
  );
  const totalExistingCont = existingContainers.length;
  const existingContainersPreview = existingContainers.map(cid =>
    availableContainers.find(c => String(c.cid) === String(cid))?.container_number || String(cid)
  ).filter(Boolean);
  const totalSelectedCont = localShippingDetails.reduce((sum, _, idx) => sum + ((selectedContainersPerDetail[getDetailKey(rec.orderId, rec.id, idx)] || []).length), 0);
  const totalContForRec = totalExistingCont + totalSelectedCont;
  const assignedContainersPreview = localShippingDetails.reduce((acc, _, idx) => [...acc, ...((selectedContainersPerDetail[getDetailKey(rec.orderId, rec.id, idx)] || []).map(cid => availableContainers.find(c => String(c.cid) === String(cid))?.container_number || String(cid)))], []).filter(Boolean);
  const allContainersPreview = [...new Set([...existingContainersPreview, ...assignedContainersPreview])];
  const hasShippingDetails = localShippingDetails.length > 0;
  const key = `${rec.orderId}-${rec.id}`;
  const isExpanded = expandedReceivers.has(key);

  // Auto-expand if no assignments yet and has shipping details
  useEffect(() => {
    if (hasShippingDetails && totalNewAssignedQty === 0 && totalContForRec === 0 && !isExpanded) {
      toggleExpanded(rec.orderId, rec.id);
    }
  }, [hasShippingDetails, totalNewAssignedQty, totalContForRec, isExpanded, rec.orderId, rec.id, toggleExpanded]);

  const handleRemoveExisting = useCallback((detailIdx, contIdx) => {
    setLocalShippingDetails(prev => {
      const newDetails = [...prev];
      const detail = { ...newDetails[detailIdx] };
      const contDetail = detail.containerDetails[contIdx];
      const removedQty = parseInt(contDetail.assign_total_box || 0) || 0;
      // Update remaining items by adding back the removed qty
      detail.remainingItems = (parseInt(detail.remainingItems || 0) || 0) + removedQty;
      // Remove the container entry
      detail.containerDetails = detail.containerDetails.filter((_, i) => i !== contIdx);
      newDetails[detailIdx] = detail;
      return newDetails;
    });
  }, []);

  const handleAssignBlur = useCallback(() => {
    if (totalPC > 0) {
      localShippingDetails.forEach((sd, idx) => {
        const detailRemaining = parseInt(sd.remainingItems || sd.totalNumber || 0);
        const proportion = detailRemaining / totalPC;
        const newQty = Math.min(detailRemaining, Math.round(proportion * tempAssignQty));
        setAssignmentQuantities(prev => ({ ...prev, [getDetailKey(rec.orderId, rec.id, idx)]: newQty }));
      });
    } else if (localShippingDetails.length > 0) {
      const equalQty = Math.floor(tempAssignQty / localShippingDetails.length);
      localShippingDetails.forEach((sd, idx) => {
        const detailRemaining = parseInt(sd.remainingItems || sd.totalNumber || 0);
        const qty = Math.min(detailRemaining, idx === 0 ? tempAssignQty - (equalQty * (localShippingDetails.length - 1)) : equalQty);
        setAssignmentQuantities(prev => ({ ...prev, [getDetailKey(rec.orderId, rec.id, idx)]: qty }));
      });
    }
    setEditingAssignReceiverId(null);
  }, [totalPC, localShippingDetails, tempAssignQty, getDetailKey, rec.orderId, rec.id]);

  const handleAssignKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleAssignBlur();
    else if (e.key === 'Escape') setEditingAssignReceiverId(null);
  }, [handleAssignBlur]);

  // Generate subrows array
  const subRows = isExpanded && hasShippingDetails ? localShippingDetails.map((detail, idx) => {
    const keyDetail = getDetailKey(rec.orderId, rec.id, idx);
    console.log('remaining ',detail)
    const detailRemaining = parseInt(detail.remainingItems || detail.totalNumber || 0);
    const originalTotal = parseInt(detail.totalNumber || 0);
    const progressValue = originalTotal > 0 ? ((originalTotal - detailRemaining) / originalTotal * 100) : 0;
    // Filter out invalid/empty container details (e.g., all empty strings/null)
    const validContainerDetails = (detail.containerDetails || []).filter(cd =>
      (parseInt(cd.assign_total_box || 0) > 0 || parseFloat(cd.assign_weight || 0) > 0) && cd.container
    );
    return (
      <TableRow key={`detail-${keyDetail}`} sx={{ bgcolor: theme.background }}>
        <TableCell colSpan={visibleColumnCount}>
          <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="bold">
                Shipping Detail {idx + 1}: {detail.deliveryAddress || 'N/A'} ({detail.category} - {detailRemaining} pcs remaining, {detail.weight} kg)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Grid container p={3} sx={{ bgcolor: theme.background, width: '100%', justifyContent: "space-between" }} spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color={theme.primary} mb={1}>Existing Assignments:</Typography>
                  <Stack sx={{ bgcolor: theme.background }} spacing={1}>
                    {(() => {
                      // Debug log moved outside JSX
                      console.log('Container Detail:', detail.containerDetails);
                      return validContainerDetails.map((contDetail, contIdx) => (
                        <Card key={contIdx} variant="outlined" sx={{ p: 1, bgcolor: theme.surface }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  
                              <Typography variant="body2" fontWeight="bold">{contDetail.container?.container_number || 'N/A'}</Typography>
                              {/* <Typography variant="caption" color={theme.textSecondary}>Location: {contDetail.container?.location}</Typography> */}
                              <StatusChip
                                status={contDetail.status}
                                size="small"
                                
                                sx={{
                                  
                                  fontSize: 10,
                                  height: 35,
                                  minWidth: 40,
                                  flexShrink: 0,
                                  
                                  '& .MuiChip-label': { p: 3, }
                                }}
                              />
                
                            <Stack direction="column" alignSelf="center" alignItems="center" gap={1}>
                            </Stack>
                            <Stack direction="row" gap={1} alignItems="center" justifyContent="center">
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Chip label={`${parseInt(contDetail.assign_total_box || 0)} Units`} style={{ width: 100 }} size="large" color="success" />
                                <Chip label={`${parseFloat(contDetail.assign_weight || 0)} kg`} style={{ width: 100 }} size="large" color="primary" variant="outlined" />
                              </Stack>
                              <IconButton size="small" color="error" onClick={() => handleRemoveExisting(idx, contIdx)} title="Remove Assignment">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Card>
                      ));
                    })()}
                    {validContainerDetails.length === 0 && <Typography variant="body2" color={theme.textSecondary}>No existing assignments</Typography>}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color={theme.textSecondary} mb={1}>New Assignment:</Typography>
                  <Stack spacing={2}>
                    <TextField
                      size="small"
                      label="New Boxes to Assign"
                      type="number"
                      value={assignmentQuantities[keyDetail] || ''}
                      onChange={(e) => handleQuantityChange(keyDetail, e.target.value, detailRemaining)}
                      inputProps={{ min: 0, max: detailRemaining }}
                      sx={{ minWidth: 150 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Select Container</InputLabel>
                      <Select
                        multiple
                        value={selectedContainersPerDetail[keyDetail] || []}
                        onChange={(e) => handleContainerChange(keyDetail, e.target.value)}
                        label="Select Container"
                        renderValue={(selected) => selected.length ? `${selected.length} containers` : 'Choose...'}
                      >
                        {getAvailableContainersForKey(keyDetail).map(c => (
                          <MenuItem key={c.cid} value={c.cid}>
                            {c.container_number} ({c.location})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {(selectedContainersPerDetail[keyDetail] || []).length > 0 && (
                      <Chip
                        label={`${(selectedContainersPerDetail[keyDetail] || []).length} new containers`}
                        color="warning"
                        variant="outlined"
                        onDelete={() => handleContainerChange(keyDetail, [])}
                      />
                    )}
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {/* Preview in Summary */ }}
                      disabled={!(assignmentQuantities[keyDetail] || 0) > 0 || (selectedContainersPerDetail[keyDetail] || []).length === 0}
                      size="small"
                    >
                      Preview Assignment
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <LinearProgress variant="determinate" value={progressValue} sx={{ height: 8 }} color="primary" />
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: theme.textSecondary }}>
                Progress: {originalTotal - detailRemaining} / {originalTotal}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </TableCell>
      </TableRow>
    );
  }) : [];

  return (
    <>
      <TableRow key={`${rec.orderId}-${rec.id || globalIndex}`} hover sx={{ '&:hover': { bgcolor: `rgba(${theme.primary}, 0.04)` } }}>
        <TableCell key="id" sx={{ display: columnVisibility.id ? 'table-cell' : 'none' }}>{rec.id || 'N/A'}</TableCell>
        <TableCell key="name" sx={{ display: columnVisibility.name ? 'table-cell' : 'none' }}>{fullRec.receiverName || rec.receiverName}</TableCell>
        <TableCell key="booking_ref" sx={{ display: columnVisibility.booking_ref ? 'table-cell' : 'none' }}>
          {fullRec.booking_ref || rec.booking_ref || 'N/A'}
        </TableCell>
        <TableCell key="address" sx={{ display: columnVisibility.address ? 'table-cell' : 'none', maxWidth: 150 }}>
          <Tooltip title={address}>
            <Typography variant="body2" noWrap>{address.length > 20 ? `${address.substring(0, 20)}...` : address}</Typography>
          </Tooltip>
        </TableCell>
        <TableCell key="contact" sx={{ display: columnVisibility.contact ? 'table-cell' : 'none' }}>{contact}</TableCell>
        <TableCell key="email" sx={{ display: columnVisibility.email ? 'table-cell' : 'none' }}>{email}</TableCell>
        <TableCell key="wt" sx={{ display: columnVisibility.wt ? 'table-cell' : 'none' }}>{totalWeight || 0} kg</TableCell>
        <TableCell key="totalPC" sx={{ display: columnVisibility.totalPC ? 'table-cell' : 'none', color: theme.success }}>{totalPC}</TableCell>
        <TableCell key="deliveredQty" sx={{ display: columnVisibility.deliveredQty ? 'table-cell' : 'none' }}>
          <Chip label={delivered} size="small" color="success" />
        </TableCell>
        <TableCell key="remainingQty" sx={{ display: columnVisibility.remainingQty ? 'table-cell' : 'none' }}>
          <Chip label={localRemaining} size="small" color={localRemaining > 0 ? "warning" : "success"} variant="outlined" />
        </TableCell>
        <TableCell key="assignQty">
          <Typography variant="body2" fontWeight="bold">{totalNewAssignedQty}</Typography>
        </TableCell>
        <TableCell key="containers">
          <Stack direction="row" gap={1} alignItems="center">
            {totalContForRec > 0 ? (
              <Chip 
                label={allContainersPreview.length > 1 ? `${allContainersPreview[0]}... (${allContainersPreview.length})` : allContainersPreview.join(', ')} 
                size="small" 
                color="success" 
                variant="outlined" 
                title={allContainersPreview.join(', ')}
              />
            ) : (
              <Chip label="None" size="small" color="default" variant="outlined" />
            )}
          </Stack>
        </TableCell>
        <TableCell key="action">
          <Stack direction="row" gap={0.5}>
            {hasShippingDetails && (
              <IconButton size="small" onClick={() => toggleExpanded(rec.orderId, rec.id)}>
                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            )}
            {totalContForRec > 0 && (
              <IconButton size="small" onClick={() => handleRemoveContainersForReceiver(rec.id, rec.orderId)} color="error" title="Remove">
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </TableCell>
      </TableRow>
      {subRows}
      {!hasShippingDetails && isExpanded && (
        <TableRow sx={{ bgcolor: theme.background }}>
          <TableCell colSpan={visibleColumnCount}>
            <Typography variant="body2" color="text.secondary">No shipping details available for assignment</Typography>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};  

  // If no assignments, show preview table
  const PreviewTable = ({ assignments }) => (
    <Card sx={{ mt: 2,background:'transparent' }}>
      <CardContent>
        <Typography variant="h6" color={theme.primary}>Preview ({assignments.length} Assignments)</Typography>
        <TableContainer sx={{ maxHeight: 200, mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Receiver</TableCell>
                <TableCell>Detail</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Containers</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((a, i) => (
                <TableRow key={i}>
                  <TableCell>{a.orderRef}</TableCell>
                  <TableCell>{a.receiverName}</TableCell>
                  <TableCell>{a.detailAddress}</TableCell>
                  <TableCell><Chip label={a.qty} color="success" size="small" /></TableCell>
                  <TableCell>{a.containers}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleRemoveDetailAssignment(a.orderId, a.recId, a.detailIdx)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // Summary Card
  // const SummaryCard = () => (
  //   <Card sx={{ p:0,bgcolor:"transparent" }}>
  //     <Grid container spacing={1}>
  //       <Grid item xs={6}><Typography variant="body2">Orders</Typography><Chip label={selectedOrders.length} color="primary" size="small" /></Grid>
  //       <Grid item xs={6}><Typography variant="body2">Receivers</Typography><Chip label={totalReceivers} color="info" size="small" /></Grid>
  //       <Grid item xs={6}><Typography variant="body2">Delivered</Typography><Chip label={totalDelivered} color="success" size="small" /></Grid>
  //       <Grid item xs={6}><Typography variant="body2">Assigned Details</Typography><Chip label={totalAssignedDetails} color="success" size="small" /></Grid>
  //       <Grid item xs={6}><Typography variant="body2">Containers</Typography><Chip label={totalContainersUsed} color="warning" size="small" /></Grid>
  //       <Grid item xs={6}><Typography variant="body2">Total Qty</Typography><Chip label={detailedAssignments.reduce((s, a) => s + a.qty, 0)} color="primary" size="small" /></Grid>
  //     </Grid>
  //     {totalAssignedDetails === 0 && <Alert severity="info" sx={{ mt: 2 }}>Assign details to see preview.</Alert>}
  //     {detailedAssignments.length > 0 && <PreviewTable assignments={detailedAssignments} />}
  //   </Card>
  // );

  if (fetchingDetails) {
    return (
      <Dialog open={openAssignModal} onClose={() => setOpenAssignModal(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2 }}>Loading details...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Dialog open={openAssignModal} onClose={() => setOpenAssignModal(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.primary, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <LocalShippingIcon />
            <Typography variant="h5">Assign Orders to Containers ({selectedOrders.length})</Typography>
          </Stack>
              {/* <SummaryCard /> */}

          <IconButton onClick={() => setOpenAssignModal(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '70vh' }}>
          <Grid container sx={{ height: '100%' }}>
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%', borderRadius: 0 }}>
                <CardContent sx={{ p: 2, height: '100%' }}>
                  <Stack direction="row" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" color={theme.primary}>Receivers ({totalReceivers})</Typography>
                    <Stack direction="row" gap={1}>
                      <Button size="small" onClick={() => setShowAllColumns(!showAllColumns)} startIcon={<ViewColumnIcon />}>
                        {showAllColumns ? 'Compact' : 'Full'}
                      </Button>
                      <Button size="small" onClick={handleColumnMenuOpen} variant="outlined">Columns</Button>
                    </Stack>
                  </Stack>
                  <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {headerCols.map(col => (
                            <TableCell
                              key={col}
                              sx={{
                                display: columnVisibility[col] !== false ? 'table-cell' : 'none',
                                fontWeight: 'bold',
                                color: theme.primary,
                              }}
                            >
                              {displayNames[col]}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          const allReceivers = selectedOrders.flatMap(id => {
                            const fullOrder = detailedOrders[id] || orders.find(o => o.id === id);
                            return (fullOrder?.receivers || []).map(rec => ({ ...rec, booking_ref: fullOrder?.booking_ref, orderId: id }));
                          });
                          return allReceivers.map((rec, i) => <ReceiverRow key={i} rec={rec} globalIndex={i} />);
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {selectedOrders.length === 0 && <Alert severity="warning" sx={{ mt: 2 }}>Select orders to assign.</Alert>}
                  {totalReceivers === 0 && <Alert severity="info" sx={{ mt: 2 }}>No receivers found.</Alert>}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4} >
              {/* <SummaryCard /> */}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenAssignModal(false)} variant="outlined">Cancel</Button>
          <Button onClick={enhancedHandleAssign} variant="contained" disabled={totalAssignedDetails === 0} startIcon={<AssignmentIcon />}>
            Assign ({totalAssignedDetails})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Column Popover */}
      <Popover open={Boolean(columnAnchorEl)} anchorEl={columnAnchorEl} onClose={handleColumnMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={1}>Columns</Typography>
          {Object.keys(columnVisibility)
            .filter(col => !['assignQty', 'containers', 'action'].includes(col)) // Hide always-visible
            .map(col => (
              <ListItem key={col} onClick={() => handleColumnToggle({ target: { checked: !columnVisibility[col] } }, col)}>
                <Checkbox checked={columnVisibility[col]} />
                <ListItemText primary={displayNames[col]} />
              </ListItem>
            ))}
        </Box>
      </Popover>

      {/* Edit Modal - Simplified */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.primary, color: 'white' }}>Edit Receiver</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField fullWidth label="Name *" value={editForm.receiverName} onChange={handleEditChange} name="receiverName" error={!!editErrors.receiverName} helperText={editErrors.receiverName} />
            <TextField fullWidth label="Address *" multiline rows={3} value={editForm.receiverAddress} onChange={handleEditChange} name="receiverAddress" error={!!editErrors.receiverAddress} helperText={editErrors.receiverAddress} />
            <Stack direction="row" spacing={2}>
              <TextField fullWidth label="Contact *" value={editForm.receiverContact} onChange={handleEditChange} name="receiverContact" error={!!editErrors.receiverContact} helperText={editErrors.receiverContact} />
              <TextField fullWidth label="Email *" type="email" value={editForm.receiverEmail} onChange={handleEditChange} name="receiverEmail" error={!!editErrors.receiverEmail} helperText={editErrors.receiverEmail} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth label="Total Pieces" type="number" value={editForm.totalNumber} onChange={handleEditChange} name="totalNumber" inputProps={{ min: 0 }} />
              <TextField fullWidth label="Total Weight (kg)" type="number" value={editForm.totalWeight} onChange={handleEditChange} name="totalWeight" inputProps={{ min: 0, step: 0.01 }} />
            </Stack>
            <TextField fullWidth label="Category" value={editForm.category} onChange={handleEditChange} name="category" />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={editForm.status} onChange={handleEditChange} name="status" label="Status">
                <MenuItem value="Created">Created</MenuItem>
                <MenuItem value="In Process">In Process</MenuItem>
                <MenuItem value="Ready for Loading">Ready for Loading</MenuItem>
                <MenuItem value="Loaded into Container">Loaded into Container</MenuItem>
                <MenuItem value="Delivered">Delivered</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
          <Button onClick={handleSaveReceiver} variant="contained" startIcon={<SaveIcon />}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AssignModal;