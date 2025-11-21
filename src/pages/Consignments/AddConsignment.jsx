import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, FormControl, Select, MenuItem, TextField, InputLabel,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Divider, Tooltip as TooltipMui, Slide, Fade, Accordion, AccordionSummary, AccordionDetails, Alert, Snackbar, Alert as SnackbarAlert
  , Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  TableContainer, Paper, TablePagination, Tooltip,
  Chip, Stack, Grid, Avatar
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ExpandMoreIconMui from '@mui/icons-material/ExpandMore';
import AddIconMui from '@mui/icons-material/Add';
import DeleteIconMui from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import BusinessIcon from '@mui/icons-material/Business';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import UpdateIcon from '@mui/icons-material/Update';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { api } from '../../api';
import ContainersTabs from '../Containers/Containers';
import ContainerModule from '../Containers/AddContainer';
// Custom components (assuming these are defined elsewhere)



const CustomTextField = ({ name, value, onChange, onBlur, label, type = 'text', startAdornment, endAdornment, multiline, rows, readOnly, tooltip, required = false, error, helperText, ...props }) => (
  <TooltipMui title={tooltip || ''}>
    <TextField
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      label={`${label}${required ? '*' : ''}`}
      type={type}
      multiline={multiline}
      rows={rows}
      fullWidth
      error={error}
      helperText={helperText}
      InputProps={{
        startAdornment,
        endAdornment,
        readOnly,
        sx: readOnly ? { backgroundColor: '#e3f2fd' } : undefined
      }}
      {...props}
    />
  </TooltipMui>
);

// Custom Select Component
const CustomSelect = ({ name, value, onChange, onBlur, label, options, tooltip, required = false, error, helperText, ...props }) => {
  const labelId = `${name}-label`;  // Unique ID per field (e.g., "paymentType-label")

  return (
    <TooltipMui title={tooltip || ''}>
      <FormControl fullWidth error={error}>
        <InputLabel id={labelId}>{`${label}${required ? '*' : ''}`}</InputLabel>
        <Select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          labelId={labelId}  // Link to InputLabel's id
          label={`${label}${required ? '*' : ''}`}  // Keep for shrink behavior
          {...props}
        >
          {options.map((opt, index) => {
            const safeKey = (typeof opt === 'object' ? (opt.value ?? opt.label ?? '') : opt) || index.toString();
            const safeValue = typeof opt === 'object' ? (opt.value ?? opt.label ?? '') : opt;
            const safeText = typeof opt === 'object' ? (opt.label ?? opt.value ?? '') : opt;
            return <MenuItem key={safeKey} value={safeValue}>{safeText}</MenuItem>;
          })}
        </Select>
        {helperText && <Typography variant="caption" color="error">{helperText}</Typography>}
      </FormControl>
    </TooltipMui>
  );
};
// Custom DatePicker Component
const CustomDatePicker = ({ name, value, onChange, onBlur, label, tooltip, required = false, error, helperText, ...props }) => (
  <TooltipMui title={tooltip || ''}>
    <DatePicker
      label={`${label}${required ? '*' : ''}`}
      value={value}
      onChange={(newValue) => onChange({ target: { name, value: newValue } })}
      onClose={onBlur}
      slotProps={{
        textField: {
          fullWidth: true,
          error,
          helperText,
          ...props
        }
      }}
    />
  </TooltipMui>
);
const ConsignmentPage = ({ consignmentId = null }) => {  // Optional prop for edit mode
  const currentDate = dayjs('2025-11-20'); // Fixed current date
  const [mode, setMode] = useState(consignmentId ? 'edit' : 'add'); // add or edit
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Snackbar state for error/success messages
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [values, setValues] = useState({
    consignmentNumber: '',
    status: 'Draft',
    remarks: '',
    shipper: '',
    shipperAddress: '',
    consignee: '',
    consigneeAddress: '',
    origin: '',
    destination: '',
    eform: '',
    eformDate: currentDate,
    bank: '',
    paymentType: 'Prepaid',
    voyage: '',
    consignmentValue: 0,
    currency: 'GBP',
    eta: currentDate,
    vessel: '',
    shippingLine: '',
    delivered: 0,
    pending: 0,
    sealNo: '',
    netWeight: 0,
    grossWeight: 0,
    containers: [{ truckNo: '', containerNo: '', size: '', ownership: '', numberOfDays: 0, status: 'Pending' }],
    orders: [{ itemName: '', quantity: 0, price: '' }]
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [options, setOptions] = useState({
    shipperOptions: [],
    consigneeOptions: [],
    originOptions: [],
    destinationOptions: [],
    bankOptions: [],
    paymentTypeOptions: ['Prepaid', 'Collect'], // Hardcoded enum
    vesselOptions: [],
    shippingLineOptions: [],
    currencyOptions: ['GBP', 'USD', 'EUR'],
    statusOptions: []
  });
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [containers, setContainers] = useState([]); // Fetched containers
  const [orders, setOrders] = useState([]); // Fetched orders
  const [containersLoading, setContainersLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addedContainerIds, setAddedContainerIds] = useState([]);
  const [orderPage, setOrderPage] = useState(0);
  const [orderRowsPerPage, setOrderRowsPerPage] = useState(10);
  const [orderTotal, setOrderTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    booking_ref: "",  // Updated: Use booking_ref for search
  });
  // Fetch containers on mount
  useEffect(() => {
    const fetchContainers = async () => {
      setContainersLoading(true);
      try {
        const res = await api.get("/api/containers");
        setContainers(res.data.data || []);
      } catch (err) {
        console.error("❌ Error fetching containers:", err);
      } finally {
        setContainersLoading(false);
      }
    };
    fetchContainers();
  }, []);

  // Collect added container IDs whenever containers change
  useEffect(() => {
    const ids = values.containers
      .map(c => c.id || c.cid)
      .filter(id => id);
    setAddedContainerIds(ids);
  }, [values.containers]);

  // Fetch orders (adapt the provided function for modal - fetch first page with reasonable limit)
  useEffect(() => {
    const fetchOrders = async () => {
      if (addedContainerIds.length === 0) {
        setOrders([]);
        setOrderTotal(0);
        setOrdersLoading(false);
        return;
      }

      setOrdersLoading(true);
      try {
        const params = {
          page: orderPage + 1, // 1-based for API
          limit: orderRowsPerPage,
          includeContainer: true,
          container_ids: addedContainerIds.join(','),
          ...(filters.booking_ref && { booking_ref: filters.booking_ref }),
          ...(filters.status && { status: filters.status }),
        };
        const response = await api.get(`/api/orders`, { params });
        console.log('Fetched orders:', response.data);
        setOrders(response.data.data || []);
        setOrderTotal(response.data.total || 0);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [addedContainerIds, filters, orderPage, orderRowsPerPage]);

  // Order selection handlers
  const isSelected = (id) => selectedOrders.indexOf(id) !== -1;

  const handleOrderToggle = (orderId) => () => {
    console.log('toggle order', orderId)
    const currentIndex = selectedOrders.indexOf(orderId);
    const newSelected = [...selectedOrders];
    if (currentIndex === -1) {
      newSelected.push(orderId);
    } else {
      newSelected.splice(currentIndex, 1);
    }
    setSelectedOrders(newSelected);
  };

  const handleClick = (id) => handleOrderToggle(id)();

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = orders.map((n) => n.id);
      setSelectedOrders(newSelecteds);
      return;
    }
    setSelectedOrders([]);
  };
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

  const handleChangeOrderPage = (event, newPage) => {
    setOrderPage(newPage);
  };

  const handleChangeOrderRowsPerPage = (event) => {
    setOrderRowsPerPage(parseInt(event.target.value, 10));
    setOrderPage(0);
  };

  const numSelected = orders.filter((o) => isSelected(o.id)).length;
  const rowCount = orders.length;

  const getStatusColors = (status) => {
    // Extend your existing getStatusColors function to handle new statuses
    const colorMap = {
      'Created': { bg: '#00695c', text: '#f1f8e9' },
      'Received for Shipment': { bg: '#e3f2fd', text: '#1976d2' },
      'Waiting for Authentication': { bg: '#fff3e0', text: '#ef6c00' },
      'Shipper Authentication Confirmed': { bg: '#e8f5e8', text: '#388e3c' },
      'Waiting for Consignee Authentication': { bg: '#fff3e0', text: '#ef6c00' },
      'Waiting for Shipper Authentication (if applicable)': { bg: '#fff3e0', text: '#ef6c00' },
      'Consignee Authentication Confirmed': { bg: '#e8f5e8', text: '#388e3c' },
      'In Process': { bg: '#fff3e0', text: '#ef6c00' },
      'Ready for Loading': { bg: '#f3e5f5', text: '#7b1fa2' },
      'Loaded into Container': { bg: '#e0f2f1', text: '#00695c' },
      'Departed for Port': { bg: '#e1f5fe', text: '#0277bd' },
      'Offloaded at Port': { bg: '#f1f8e9', text: '#689f38' },
      'Clearance Completed': { bg: '#fce4ec', text: '#c2185b' },
      'Containers Returned (Internal only)': { bg: '#ffebee', text: '#c62828' }, // Internal red
      'Hold': { bg: '#fff3e0', text: '#f57c00' },
      'Cancelled': { bg: '#ffebee', text: '#d32f2f' },
      'Delivered': { bg: '#e8f5e8', text: '#2e7d32' },
      // Fallback for unknown
      default: { bg: '#f5f5f5', text: '#666' }
    };
    return colorMap[status] || colorMap.default;
  };

  const handleStatusUpdate = (id, order) => {
    console.log('Update status for order:', id, order);
    // Implement status update logic
  };

  const handleView = (id) => {
    console.log('View order:', id);
    // Implement view logic
  };

  const handleEdit = (id) => {
    console.log('Edit order:', id);
    // Implement edit logic
  };

  // Handler to toggle container selection
  const handleContainerToggle = (containerId) => () => {
    const currentIndex = selectedContainers.indexOf(containerId);
    const newSelected = [...selectedContainers];
    if (currentIndex === -1) {
      newSelected.push(containerId);
    } else {
      newSelected.splice(currentIndex, 0);
    }
    setSelectedContainers(newSelected);
  };

  // Handler to add selected containers to form
  // Handler to add selected containers to form
  const addSelectedContainers = () => {
    const selectedData = selectedContainers
      .map(id => containers.find(c => c.cid === id))
      .filter(Boolean);

    if (selectedData.length === 0) {
      setSnackbar({
        open: true,
        message: 'No containers selected.',
        severity: 'warning',
      });
      return;
    }

    const newContainers = selectedData.map(container => ({
      // Map API fields to form fields (no truckNo, no days)
      containerNo: container.container_number || '',
      location: container.location || '',
      size: container.container_size || '',
      containerType: container.container_type || '',
      ownership: container.owner_type === 'soc' ? 'Own' : (container.owner_type === 'coc' ? 'Hired' : container.owner_type),
      status: container.derived_status || 'Pending',  // Use derived_status directly in TextField
      id: container.cid,  // For backend reference
    }));

    // Append immutably
    setValues(prev => ({
      ...prev,
      containers: [...prev.containers, ...newContainers]
    }));

    markArrayTouched('containers');
    setSelectedContainers([]);
    setContainerModalOpen(false);

    setSnackbar({
      open: true,
      message: `${newContainers.length} container(s) added successfully!`,
      severity: 'success',
    });
  };

  // Updated validation schema (Yup for form-level)
  const validationSchema = Yup.object({
    consignmentNumber: Yup.string().required('Consignment # is required'),
    shipper: Yup.string().required('Shipper is required'),
    consignee: Yup.string().required('Consignee is required'),
    origin: Yup.string().required('Origin is required'),
    destination: Yup.string().required('Destination is required'),
    eform: Yup.string().matches(/^[A-Z]{3}-\d{6}$/, 'Invalid format (e.g., ABC-123456)').required('Eform # is required'),
    eformDate: Yup.date().required('Eform Date is required'),
    bank: Yup.string().required('Bank is required'),
    paymentType: Yup.string().required('Payment Type is required'),
    voyage: Yup.string().min(3, 'Voyage must be at least 3 characters').required('Voyage is required'),
    consignmentValue: Yup.number().min(0).required('Consignment Value is required'),
    vessel: Yup.string().required('Vessel is required'),
    netWeight: Yup.number().min(0).required('Net Weight is required'),
    grossWeight: Yup.number().min(0).required('Gross Weight is required'),
    containers: Yup.array().of(
      Yup.object({
        containerNo: Yup.string().required('Container No. is required'),
        size: Yup.string().required('Size is required')
      })
    ).min(1, 'At least one container is required')
  });

  // Status transitions for "Next" button
  const statusTransitions = {
    'Draft': 'Submitted',
    'Submitted': 'In Transit',
    'In Transit': 'Delivered',
    'Delivered': null,
    'Cancelled': null
  };

  useEffect(() => {
    setOptions({
      shipperOptions: ['SYNERGY FABRICATIONS', 'Shipper B', 'Shipper C'].map(opt => ({ value: opt, label: opt })),
      consigneeOptions: ['THIRD PARTY #2', 'Consignee Y', 'Consignee Z'].map(opt => ({ value: opt, label: opt })),
      originOptions: ['Port 1', 'Port 2', 'Port 3'].map(opt => ({ value: opt, label: opt })),
      destinationOptions: ['Port A', 'Port B', 'Port C'].map(opt => ({ value: opt, label: opt })),
      bankOptions: ['Bank 1', 'Bank 2', 'Bank 3'].map(opt => ({ value: opt, label: opt })),

      paymentTypeOptions: ['Prepaid', 'Collect'].map(opt => ({ value: opt, label: opt })),  // Add .map here
      vesselOptions: ['Vessel 1', 'Vessel 2', 'Vessel 3'].map(opt => ({ value: opt, label: opt })),
      shippingLineOptions: ['Line Alpha', 'Line Beta', 'Line Gamma'].map(opt => ({ value: opt, label: opt })),
      currencyOptions: ['GBP', 'USD', 'EUR'].map(opt => ({ value: opt, label: opt })),
      // ... do this for bankOptions, vesselOptions, etc.
      statusOptions: [
        { value: 'Draft', label: 'Draft' },
        { value: 'Submitted', label: 'Submitted' },
        { value: 'In Transit', label: 'In Transit' },
        { value: 'Delivered', label: 'Delivered' },
        { value: 'Cancelled', label: 'Cancelled' }
      ],
      // Add this new one
      containerStatusOptions: [
        { value: 'Pending', label: 'Pending' },
        { value: 'In Transit', label: 'In Transit' },
        { value: 'Delivered', label: 'Delivered' },
        { value: 'Cancelled', label: 'Cancelled' }
      ]
    });
  }, []);
  // Validation functions
  const validateField = async (name, value) => {
    try {
      await validationSchema.fields[name]?.validate(value);
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [name]: error.message }));
    }
  };
  const loadConsignment = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/consignments/${consignmentId}`);
      const { data } = res.data;
      // Assume backend uses camelCase
      const mappedData = {
        ...data,
        eformDate: data.eformDate ? dayjs(data.eformDate) : null,
        eta: data.eta ? dayjs(data.eta) : null,
        containers: (data.containers || []).map(c => ({
          truckNo: c.truckNo || '',
          containerNo: c.containerNo || '',
          size: c.size || '',
          ownership: c.ownership || '',
          numberOfDays: c.numberOfDays || 0,
          status: c.status || 'Pending',
          id: c.id || c.cid  // For backend reference (assume backend returns id or cid)
        })),
        orders: (data.orders || []).map(o => ({
          itemName: o.itemName || '',
          quantity: o.quantity || 1,
          price: o.price || ''
        }))
      };
      setValues(mappedData);
    } catch (err) {
      console.error('Error loading consignment:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (e) => {
    console.log('handleee', e)
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
  };
  // Load consignment for edit mode
  useEffect(() => {
    if (mode === 'edit' && consignmentId) {
      loadConsignment();
    } else {
      setLoading(false);
    }
  }, [mode, consignmentId]);


  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    if (touched[name]) validateField(name, parseFloat(value) || 0);
  };

  const handleDateChange = (e) => {
    const { name, value: newValue } = e.target;
    setValues(prev => ({ ...prev, [name]: newValue }));
    if (touched[name]) validateField(name, newValue);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleDateBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, values[name]);
  };

  const handleSelectBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, values[name]);
  };

  // Handle party change to populate address (mock; in real, fetch from API)
  const handlePartyChange = (e) => {
    const { name, value } = e.target;
    handleChange(e);
    // Mock address; replace with API call if needed
    if (name === 'shipper') {
      setValues(prev => ({ ...prev, shipperAddress: value ? `${value} Address\nLine 2\nCity, Country` : '' }));
    } else if (name === 'consignee') {
      setValues(prev => ({ ...prev, consigneeAddress: value ? `${value} Address\nLine 2\nCity, Country` : '' }));
    }
  };

  const updateArrayField = (arrayName, index, fieldName, value) => {
    const newArray = [...values[arrayName]];
    newArray[index][fieldName] = value;
    setValues(prev => ({ ...prev, [arrayName]: newArray }));
    if (touched[arrayName]) validateArray(arrayName);
  };

  const validateArray = async (arrayName) => {
    try {
      await validationSchema.fields[arrayName].validate(values[arrayName]);
      setErrors(prev => ({ ...prev, [arrayName]: undefined }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [arrayName]: error.message }));
    }
  };

  const markArrayTouched = (arrayName) => {
    if (!touched[arrayName]) {
      setTouched(prev => ({ ...prev, [arrayName]: true }));
      validateArray(arrayName);
    }
  };
  // Update initial state (in useState for values)
  // Start empty

  // Updated addContainer
  const addContainer = () => {
    setValues(prev => ({
      ...prev,
      containers: [...prev.containers, { containerNo: '', location: '', size: '', containerType: '', ownership: '', status: 'Pending' }]
    }));
    markArrayTouched('containers');
  };

  // Updated removeContainer (allow empty)
  const removeContainer = (index) => {
    const newContainers = values.containers.filter((_, i) => i !== index);
    setValues(prev => ({ ...prev, containers: newContainers }));  // No fallback to empty object
    markArrayTouched('containers');
  };
  // Update initial state (in useState for values)


  // Updated addOrder
  const addOrder = () => {
    setValues(prev => ({
      ...prev,
      orders: [...prev.orders, { itemName: '', quantity: 1, price: '' }]
    }));
  };

  // Updated removeOrder (allow empty)
  const removeOrder = (index) => {
    const newOrders = values.orders.filter((_, i) => i !== index);
    setValues(prev => ({ ...prev, orders: newOrders }));  // No fallback to empty object
  };

  // Handler to add selected orders to form (adjust mappings based on your orders API response structure)
  const addSelectedOrders = () => {
    const selectedData = selectedOrders
      .map(id => orders.find(o => o.id === id))  // Assuming orders have 'id'
      .filter(Boolean);

    if (selectedData.length === 0) {
      setSnackbar({
        open: true,
        message: 'No orders selected.',
        severity: 'warning',
      });
      return;
    }

    const newOrders = selectedData.map(order => ({
      // Map API fields to form fields (example based on common order structure; adjust as needed)
      itemName: order.item_name || order.itemName || order.description || '',  // e.g., from order_items or main order
      quantity: order.quantity || order.qty || 1,
      price: order.price || order.unit_price || 0,
      id: order.id,  // For backend reference
    }));

    // Append immutably
    setValues(prev => ({
      ...prev,
      orders: [...prev.orders, ...newOrders]
    }));

    setSelectedOrders([]);
    setOrderModalOpen(false);

    setSnackbar({
      open: true,
      message: `${newOrders.length} order(s) added successfully!`,
      severity: 'success',
    });
  };  // Advance status (calls API)
  const advanceStatus = async () => {
    if (mode === 'add' || !consignmentId) {
      alert('Save the consignment first to advance status.');
      return;
    }
    try {
      const res = await api.patch(`/consignments/${consignmentId}/next`);
      const { message } = res.data;
      alert(message);
      // Reload data
      window.location.reload(); // Simple reload; use state update in prod
    } catch (err) {
      console.error('Error advancing status:', err);
      alert('Error advancing status');
    }
  };
  // Handle submit (POST for add, PUT for edit)
  // Handle submit (POST for add, PUT for edit)
  const handleSubmit = async (e) => {
    console.log('asdsadas', e)
    if (e) {
      e.preventDefault();
    }
    const allFields = Object.keys(validationSchema.fields);
    setTouched(prev => ({ ...prev, ...allFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}) }));
    try {
      await validationSchema.validate(values, { abortEarly: false });
    } catch (error) {
      const validationErrors = {};
      error.inner.forEach(err => validationErrors[err.path] = err.message);
      setErrors(validationErrors);
      setSnackbar({
        open: true,
        message: 'Please fix the errors in the form',
        severity: 'error',
      });
      // return;
    }
    console.log('set submit', values, allFields)

    setSaving(true);

    // Prepare submit data with camelCase keys and formatted dates
    const submitData = {
      ...values,
      eformDate: values.eformDate ? values.eformDate.format('YYYY-MM-DD') : null,
      eta: values.eta ? values.eta.format('YYYY-MM-DD') : null,
    };

    console.log('submitData', submitData);

    try {
      let res;
      const endpoint = mode === 'add' ? '/api/consignments' : `/api/consignments/${consignmentId}`;
      const method = mode === 'add' ? 'post' : 'put';
      res = await api[method](endpoint, submitData);

      // Axios success: res.status is 2xx
      const { data: responseData, message } = res.data; // Axios: res.data holds body
      setSnackbar({
        open: true,
        message: mode === 'add' ? 'Consignment created successfully!' : 'Consignment updated successfully!',
        severity: 'success',
      });
      // Redirect or reset; for now, log ID for "Next"
      if (mode === 'add') {
        console.log('New ID:', responseData.id); // Use for edit mode
        setMode('edit');
        // Map response back to camelCase (assume backend camelCase)
        const mappedResponse = {
          ...responseData,
          eformDate: responseData.eformDate ? dayjs(responseData.eformDate) : null,
          eta: responseData.eta ? dayjs(responseData.eta) : null,
          containers: responseData.containers ? responseData.containers.map(c => ({
            truckNo: c.truckNo,
            containerNo: c.containerNo,
            size: c.size,
            ownership: c.ownership,
            numberOfDays: c.numberOfDays,
            status: c.status,
            id: c.id || c.cid
          })) : [],
          orders: responseData.orders ? responseData.orders.map(o => ({
            itemName: o.itemName,
            quantity: o.quantity,
            price: o.price
          })) : []
        };
        setValues(mappedResponse);
      } else {
        // For edit, reload data
        if (consignmentId) {
          await loadConsignment(); // Reuse existing load function
        }
      }
    } catch (err) {
      console.error("[handleSubmit] Backend error:", err.response?.data || err.message);
      if (err.response) {
        // API error (4xx/5xx)
        const { error: apiError, details } = err.response.data || {};
        const backendMsg = apiError || err.message || 'Failed to save consignment';
        setSnackbar({
          open: true,
          message: `Backend Error: ${backendMsg}${details ? `\nDetails: ${details.join(', ')}` : ''}`,
          severity: 'error',
        });
      } else {
        // Network/other error
        setSnackbar({
          open: true,
          message: 'An unexpected error occurred. Please try again.',
          severity: 'error',
        });
      }
    } finally {
      setSaving(false);
    }
  };
  const resetForm = () => {
    setValues({
      consignmentNumber: '',
      status: 'Draft',
      remarks: '',
      shipper: '',
      shipperAddress: '',
      consignee: '',
      consigneeAddress: '',
      origin: '',
      destination: '',
      eform: '',
      eformDate: currentDate,
      bank: '',
      paymentType: 'Prepaid',
      voyage: '',
      consignmentValue: 0,
      currency: 'GBP',
      eta: currentDate,
      vessel: '',
      shippingLine: '',
      delivered: 0,
      pending: 0,
      sealNo: '',
      netWeight: 0,
      grossWeight: 0,
      containers: [{ truckNo: '', containerNo: '', size: '', ownership: '', numberOfDays: 0, status: 'Pending' }],
      orders: [{ itemName: '', quantity: 1, price: '' }]
    });
    setErrors({});
    setTouched({});
  };

  const getContainerError = () => errors.containers;

  if (loading) return <div>Loading...</div>;

  const statuses = [
    'Created',
    'Received for Shipment',
    'Waiting for Authentication',
    'Shipper Authentication Confirmed',
    'Waiting for Consignee Authentication',
    'Waiting for Shipper Authentication (if applicable)',
    'Consignee Authentication Confirmed',
    'In Process',
    'Ready for Loading',
    'Loaded into Container',
    'Departed for Port',
    'Offloaded at Port',
    'Clearance Completed',
    'Containers Returned (Internal only)', // Internal only - no client visibility
    'Hold',
    'Cancelled',
    'Delivered'
  ];

  const StyledTooltip = styled(Tooltip)(({ theme }) => ({
    [`& .MuiTooltip-tooltip`]: {
      backgroundColor: theme.palette.common.white,
      color: theme.palette.text.primary,
      boxShadow: theme.shadows[3],
      borderRadius: theme.shape.borderRadius,
      fontSize: theme.typography.body2.fontSize,
      maxWidth: '300px',
      border: `1px solid ${theme.palette.divider}`,
    },
    [`& .MuiTooltip-arrow`]: {
      color: theme.palette.common.white,
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
  const parseSummaryToList = (receivers) => {
    // console.log('Parsing receivers:', receivers);
    if (!receivers || !Array.isArray(receivers)) return [];
    return receivers.map(rec => ({
      primary: rec.receiver_name,
      status: rec.status
    }));
  };

  // Enhanced PrettyList: Modern vertical card-based layout for receivers with improved alignment, avatars, and status badges
  const PrettyList = ({ items, title }) => (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: '#fafafa', // Subtle off-white background for better contrast
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' // Gentle shadow on hover for depth
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Title Section - Centered and prominent */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f58220' }}> {/* Use brand color for title */}
            {title}
          </Typography>
          <Chip
            label={`(${items.length})`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{
              fontSize: '0.7rem',
              height: 20,
              '& .MuiChip-label': { px: 0.5 }
            }}
          />
        </Box>

        {/* Items List - Vertical stack with improved spacing */}
        <Stack spacing={1} sx={{ maxHeight: 200, overflow: 'auto' }}> {/* Add scrollable height for better UX in dense lists */}
          {items.length > 0 ? (
            items.map((item, index) => (
              <Card
                key={index}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  backgroundColor: '#fff', // Clean white for individual cards
                  boxShadow: 'none',
                  transition: 'all 0.2s ease', // Smooth transitions
                  '&:hover': {
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-1px)', // Subtle lift on hover
                    borderColor: 'primary.light'
                  },
                  cursor: 'pointer' // Indicate interactivity
                }}
                onClick={() => { /* Optional: Add click handler for item selection */ }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                  {/* Avatar - Slightly larger for better touch targets */}
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'primary.main',
                      fontSize: '1rem',
                      flexShrink: 0 // Prevent shrinking
                    }}
                  >
                    {item.primary ? item.primary.charAt(0).toUpperCase() : '?'}
                  </Avatar>

                  {/* Content - Flexible box for text wrapping */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      noWrap
                      sx={{
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.primary || 'Unnamed Item'}
                    </Typography>
                    {item.secondary && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          mt: 0.25
                        }}
                      >
                        {item.secondary}
                      </Typography>
                    )}
                  </Box>

                  {/* Status Badge - Aligned to the right */}
                  {item.status && (
                    <StatusChip
                      status={item.status}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        height: 20,
                        minWidth: 60,
                        flexShrink: 0,
                        '& .MuiChip-label': { px: 0.5 }
                      }}
                    />
                  )}
                </Stack>
              </Card>
            ))
          ) : (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 3,
              color: 'text.secondary'
            }}>
              <EmojiEventsIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} /> {/* Visual placeholder */}
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                No items available
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Card>
  );

  // Enhanced parse for containers: Simple string split
  const parseContainersToList = (containersStr) => {
    if (!containersStr) return [];
    return containersStr.split(', ').map(cont => ({ primary: cont.trim() }));
  };

  // Enhanced PrettyContainersList: Horizontal chips for compact, modern feel
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
              <Chip
                key={index}
                label={item.primary}
                icon={<LocalShippingIcon fontSize="small" />}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: 1.5,
                  borderColor: 'divider',
                  backgroundColor: '#f8f9fa', // Changed to light grey background
                  '& .MuiChip-icon': { color: 'secondary.main' },
                  fontSize: '0.75rem',
                  height: 24,
                  '&:hover': { backgroundColor: '#e9ecef' } // Darker grey on hover
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
                backgroundColor: '#f8f9fa', // Changed to light grey background
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
  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
      border: 0,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  }));

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderBottom: `1px solid ${theme.palette.divider}`,
    fontSize: '0.875rem',
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
        <Slide in timeout={1000}>
          <Card sx={{ boxShadow: 4, borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#0d6c6a', fontWeight: 'bold', mb: 3 }}>
                {mode === 'add' ? 'Add' : 'Edit'} Consignment Details
              </Typography>
              <form onSubmit={handleSubmit}>
                {/* Main Data Section */}
                <Accordion defaultExpanded sx={{ boxShadow: 2, borderRadius: 2, mb: 3, '&:before': { display: 'none' } }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#0d6c6a', borderRadius: '50%', p: 0.5 }} />}
                    sx={{ backgroundColor: '#0d6c6a', color: 'white', borderRadius: 2 }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>📦 Consignment Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Basic Info Row */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="consignmentNumber"
                            value={values.consignmentNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            label="Consignment #"
                            startAdornment={<DescriptionIcon sx={{ mr: 1, color: '#f58220' }} />}
                            readOnly={mode === 'edit'} // Readonly in edit
                            required
                            error={touched.consignmentNumber && Boolean(errors.consignmentNumber)}
                            helperText={touched.consignmentNumber && errors.consignmentNumber}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                            <CustomSelect
                              name="status"
                              value={values.status}
                              onChange={handleChange}
                              label="Status"
                              options={options.statusOptions}
                              readOnly={mode === 'edit'} // Readonly, advance via Next
                              error={touched.status && Boolean(errors.status)}
                              helperText={touched.status && errors.status}
                            />
                            {mode === 'edit' && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={advanceStatus}
                                sx={{ borderColor: '#f58220', color: '#f58220', minHeight: '56px' }}
                              >
                                Next
                              </Button>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="remarks"
                            value={values.remarks}
                            onChange={handleChange}
                            label="Remarks"
                            multiline
                            rows={2}
                            startAdornment={<AttachFileIcon sx={{ mr: 1, color: '#f58220' }} />}
                          />
                        </Box>
                      </Box>

                      {/* Eform Row */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="eform"
                            value={values.eform}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            label="Eform #"
                            inputProps={{ pattern: '^[A-Z]{3}-\\d{6}$', placeholder: 'ABC-123456' }}
                            required
                            error={touched.eform && Boolean(errors.eform)}
                            helperText={touched.eform && errors.eform}
                            tooltip="Format: ABC-123456"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomDatePicker
                            name="eformDate"
                            value={values.eformDate}
                            onChange={handleDateChange}
                            onBlur={() => handleDateBlur('eformDate')}
                            label="Eform Date"
                            required
                            error={touched.eformDate && Boolean(errors.eformDate)}
                            helperText={touched.eformDate && errors.eformDate}
                            slotProps={{ textField: { InputProps: { startAdornment: <DateRangeIcon sx={{ mr: 1, color: '#f58220' }} /> } } }}
                          />
                        </Box>
                      </Box>

                      {/* Parties Row */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="shipper"
                            value={values.shipper}
                            onChange={handlePartyChange}
                            onBlur={() => handleSelectBlur('shipper')}
                            label="Shipper"
                            options={options.shipperOptions}
                            required
                            error={touched.shipper && Boolean(errors.shipper)}
                            helperText={touched.shipper && errors.shipper}
                            tooltip="Select shipper"
                          />
                          <CustomTextField
                            name="shipperAddress"
                            value={values.shipperAddress}
                            label="Shipper Address"
                            multiline
                            rows={4}
                            readOnly
                            sx={{ mt: 2 }}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="consignee"
                            value={values.consignee}
                            onChange={handlePartyChange}
                            onBlur={() => handleSelectBlur('consignee')}
                            label="Consignee"
                            options={options.consigneeOptions}
                            required
                            error={touched.consignee && Boolean(errors.consignee)}
                            helperText={touched.consignee && errors.consignee}
                            tooltip="Select consignee"
                          />
                          <CustomTextField
                            name="consigneeAddress"
                            value={values.consigneeAddress}
                            label="Consignee Address"
                            multiline
                            rows={4}
                            readOnly
                            sx={{ mt: 2 }}
                          />
                        </Box>
                      </Box>

                      {/* Locations Row */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="origin"
                            value={values.origin}
                            onChange={handleChange}
                            onBlur={() => handleSelectBlur('origin')}
                            label="Origin"
                            options={options.originOptions}
                            required
                            error={touched.origin && Boolean(errors.origin)}
                            helperText={touched.origin && errors.origin}
                            tooltip="Select origin port"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="destination"
                            value={values.destination}
                            onChange={handleChange}
                            onBlur={() => handleSelectBlur('destination')}
                            label="Destination"
                            options={options.destinationOptions}
                            required
                            error={touched.destination && Boolean(errors.destination)}
                            helperText={touched.destination && errors.destination}
                            tooltip="Select destination port"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="shippingLine"
                            value={values.shippingLine}
                            onChange={handleChange}
                            label="Shipping Line"
                            options={options.shippingLineOptions}
                          />
                        </Box>
                      </Box>

                      {/* Payment & Value Row */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="paymentType"
                            value={values.paymentType}
                            onChange={handleChange}
                            onBlur={() => handleSelectBlur('paymentType')}
                            label="Payment Type"
                            options={options.paymentTypeOptions}  // Remove .map(...) – now objects
                            required
                            error={touched.paymentType && Boolean(errors.paymentType)}
                            helperText={touched.paymentType && errors.paymentType}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="consignmentValue"
                            value={values.consignmentValue}
                            onChange={handleNumberChange}
                            onBlur={handleBlur}
                            label="Consignment Value"
                            type="number"
                            required
                            startAdornment={<AttachFileIcon sx={{ mr: 1, color: '#f58220' }} />}
                            endAdornment={
                              <FormControl size="small" sx={{ minWidth: 60 }}>
                                <Select name="currency" value={values.currency} onChange={handleChange}>
                                  {options.currencyOptions.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                            }
                            error={touched.consignmentValue && Boolean(errors.consignmentValue)}
                            helperText={touched.consignmentValue && errors.consignmentValue}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="bank"
                            value={values.bank}
                            onChange={handleChange}
                            onBlur={() => handleSelectBlur('bank')}
                            label="Bank"
                            options={options.bankOptions}  // Remove .map(...)
                            required
                            error={touched.bank && Boolean(errors.bank)}
                            helperText={touched.bank && errors.bank}
                            tooltip="Select associated bank"
                          />
                        </Box>
                      </Box>

                      {/* Shipping Row */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="vessel"
                            value={values.vessel}
                            onChange={handleChange}
                            onBlur={() => handleSelectBlur('vessel')}
                            label="Vessel"
                            options={options.vesselOptions}
                            required
                            error={touched.vessel && Boolean(errors.vessel)}
                            helperText={touched.vessel && errors.vessel}
                            tooltip="Select vessel"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomDatePicker
                            name="eta"
                            value={values.eta}
                            onChange={handleDateChange}
                            label="ETA"
                            slotProps={{ textField: { InputProps: { startAdornment: <DateRangeIcon sx={{ mr: 1, color: '#f58220' }} /> } } }}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="voyage"
                            value={values.voyage}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            label="Voyage"
                            startAdornment={<DirectionsBoatIcon sx={{ mr: 1, color: '#f58220' }} />}
                            required
                            error={touched.voyage && Boolean(errors.voyage)}
                            helperText={touched.voyage && errors.voyage}
                            tooltip="Enter voyage number (min 3 chars)"
                          />
                        </Box>
                      </Box>

                      {/* Counts & Seal Row */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="delivered"
                            value={values.delivered}
                            label="# Delivered"
                            type="number"
                            readOnly
                            startAdornment={<DescriptionIcon sx={{ mr: 1, color: '#f58220' }} />}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="pending"
                            value={values.pending}
                            label="# Pending"
                            type="number"
                            readOnly
                            startAdornment={<DescriptionIcon sx={{ mr: 1, color: '#f58220' }} />}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="sealNo"
                            value={values.sealNo}
                            onChange={handleChange}
                            label="Seal No"
                            startAdornment={<LocalPrintshopIcon sx={{ mr: 1, color: '#f58220' }} />}
                          />
                        </Box>
                      </Box>

                      {/* Weights Row */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 300 }}>
                          <CustomTextField
                            name="netWeight"
                            value={values.netWeight}
                            label="Net Weight"
                            type="number"
                            readOnly
                            required
                            startAdornment={<LocalShippingIcon sx={{ mr: 1, color: '#f58220' }} />}
                            endAdornment={<Typography variant="body2" color="text.secondary">KGS</Typography>}
                            error={touched.netWeight && Boolean(errors.netWeight)}
                            helperText={touched.netWeight && errors.netWeight}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 300 }}>
                          <CustomTextField
                            name="grossWeight"
                            value={values.grossWeight}
                            onChange={handleNumberChange}
                            onBlur={handleBlur}
                            label="Gross Weight"
                            type="number"
                            required
                            startAdornment={<LocalShippingIcon sx={{ mr: 1, color: '#f58220' }} />}
                            endAdornment={<Typography variant="body2" color="text.secondary">KGS</Typography>}
                            error={touched.grossWeight && Boolean(errors.grossWeight)}
                            helperText={touched.grossWeight && errors.grossWeight}
                          />
                        </Box>
                      </Box>
                    </Box>

                    {/* Print Buttons */}
                    <Fade in={true} timeout={800}>
                      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          startIcon={<LocalPrintshopIcon />}
                          sx={{ borderColor: '#f58220', color: '#f58220', '&:hover': { borderColor: '#e65100', backgroundColor: '#fff3e0' } }}
                        >
                          Print Manifest
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          sx={{ borderColor: '#f58220', color: '#f58220', '&:hover': { borderColor: '#e65100', backgroundColor: '#fff3e0' } }}
                        >
                          Print Note (PDF)
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          sx={{ borderColor: '#f58220', color: '#f58220', '&:hover': { borderColor: '#e65100', backgroundColor: '#fff3e0' } }}
                        >
                          Print Docx
                        </Button>
                      </Box>
                    </Fade>
                  </AccordionDetails>
                </Accordion>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 2, }}>
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    sx={{ borderColor: '#9e9e9e', color: '#9e9e9e', '&:hover': { borderColor: '#757575' } }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    sx={{ backgroundColor: '#f58220', color: 'white', px: 4, '&:hover': { backgroundColor: '#e65100' } }}
                  >
                    {saving ? 'Saving...' : (mode === 'add' ? 'Add Consignment' : 'Update Consignment')}
                  </Button>
                </Box>
              </form>
              {/* Containers Section */}
              <Accordion sx={{ boxShadow: 2, borderRadius: 2, mt: 3, '&:before': { display: 'none' } }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#0d6c6a', borderRadius: '50%', p: 0.5 }} />}
                  sx={{ backgroundColor: '#0d6c6a', color: 'white', borderRadius: 2 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🚚 Containers</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <Table sx={{ minWidth: '100%', boxShadow: 1, borderRadius: 1, mb: 2, overflow: 'hidden' }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Container No.</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Size</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Ownership</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {values.containers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No containers added. Click "Add New" or "Select from List" to get started.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        values.containers.map((container, index) => (
                          <Fade in key={index} timeout={300 * index}>
                            <TableRow hover sx={{ transition: 'all 0.2s ease' }}>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={container.containerNo}
                                  onChange={(e) => updateArrayField('containers', index, 'containerNo', e.target.value)}
                                  onBlur={() => markArrayTouched('containers')}
                                  error={Boolean(getContainerError())}
                                  helperText={getContainerError()}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={container.location || ''}
                                  onChange={(e) => updateArrayField('containers', index, 'location', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={container.size}
                                  onChange={(e) => updateArrayField('containers', index, 'size', e.target.value)}
                                  onBlur={() => markArrayTouched('containers')}
                                  error={Boolean(getContainerError())}
                                  helperText={getContainerError()}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={container.containerType || ''}
                                  onChange={(e) => updateArrayField('containers', index, 'containerType', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={container.ownership}
                                  onChange={(e) => updateArrayField('containers', index, 'ownership', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={container.status || ''}
                                  onChange={(e) => updateArrayField('containers', index, 'status', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton onClick={() => removeContainer(index)} color="error" size="small">
                                  <DeleteIconMui fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          </Fade>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <div style={{ display: 'flex', gap: 8, mt: 2 }}>
                    <Button
                      startIcon={<AddIconMui />}
                      onClick={addContainer}
                      variant="outlined"
                      sx={{ flex: 1, color: '#0d6c6a', }}
                    >
                      Add New
                    </Button>
                    <Button
                      startIcon={<AddIconMui />}
                      onClick={() => setContainerModalOpen(true)}
                      variant="contained"
                      disabled={containersLoading}
                      sx={{ flex: 1, backgroundColor: '#0d6c6a', color: 'white', '&:hover': { backgroundColor: '#0a5553' } }}
                    >
                      {containersLoading ? 'Loading...' : 'Select from List'}
                    </Button>
                  </div>
                  {touched.containers && errors.containers && <Alert severity="error" sx={{ mt: 1 }}>{errors.containers}</Alert>}
                </AccordionDetails>
              </Accordion>
              {/* Container Selection Modal */}
              <Dialog open={containerModalOpen} onClose={() => setContainerModalOpen(false)} maxWidth="xl" fullWidth>
                {/* <DialogTitle>Select Containers</DialogTitle> */}
                <DialogContent>
                  {containersLoading ? (
                    <Typography>Loading containers...</Typography>
                  ) : (
                    <ContainerModule containers={containers}
                      selectedContainers={selectedContainers}
                      onToggle={handleContainerToggle} />
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setContainerModalOpen(false)}>Cancel</Button>
                  <Button onClick={addSelectedContainers} disabled={selectedContainers.length === 0} variant="contained">
                    Add Selected ({selectedContainers.length})
                  </Button>
                </DialogActions>
              </Dialog>
              {/* Orders Section */}
              <Accordion sx={{ boxShadow: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#f58220', borderRadius: '50%', p: 0.5 }} />}
                  sx={{ backgroundColor: '#f58220', color: 'white', borderRadius: 2 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🛒 Orders</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                      <TextField
                        label="Booking Ref"
                        value={filters.booking_ref}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, booking_ref: e.target.value }));
                          setOrderPage(0);
                        }}
                        size="small"
                        sx={{ minWidth: 200 }}
                      />
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={filters.status}
                          label="Status"
                          onChange={(e) => {
                            setFilters(prev => ({ ...prev, status: e.target.value }));
                            setOrderPage(0);
                          }}
                        >
                          <MenuItem value="">All</MenuItem>
                          {statuses.map(status => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <TableContainer sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#0d6c6a' }}>
                            {[
                              <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="ref">Booking Ref</StyledTableHeadCell>,
                              <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="loading">POL</StyledTableHeadCell>,
                              <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="dest">POD</StyledTableHeadCell>,
                              <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="sender">Sender</StyledTableHeadCell>,
                              <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="receivers">Receivers</StyledTableHeadCell>,
                              <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="containers">Containers</StyledTableHeadCell>,
                              <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="status">Status</StyledTableHeadCell>,
                              <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="created">Created At</StyledTableHeadCell>,
                              // <StyledTableHeadCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="actions">Actions</StyledTableHeadCell>
                            ]}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {orders.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                <Typography variant="body2" color="text.secondary">No orders found.</Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            orders.map((order) => {
                              const isItemSelected = isSelected(order.id);
                              //  renderReceivers( order.receivers);
                              const containersList = order.receiver_containers_json ? order.receiver_containers_json.split(', ').map(cont => ({ primary: cont })) : []; // Simple for containers
                              const status = order.overall_status || order.status || 'Created';
                              const colors = getStatusColors(status);

                              return (
                                <StyledTableRow
                                  key={order.id}
                                  onClick={() => handleClick(order.id)}
                                  role="checkbox"
                                  aria-checked={isItemSelected}
                                  selected={isItemSelected}
                                  sx={{ cursor: 'pointer' }}
                                >

                                  <StyledTableCell>{order.booking_ref}</StyledTableCell>
                                  <StyledTableCell>{order?.place_of_loading}</StyledTableCell>
                                  <StyledTableCell>{order.place_of_discharge || order.place_of_loading}</StyledTableCell>
                                  <StyledTableCell>{order.sender_name}</StyledTableCell>
                                  <StyledTableCell>
                                    <StyledTooltip
                                      title={<PrettyList items={parseSummaryToList(order.receivers)} title="Receivers" />}
                                      arrow
                                      placement="top"
                                      PopperProps={{
                                        sx: { '& .MuiTooltip-tooltip': { border: '1px solid #e0e0e0' } }
                                      }}
                                    >
                                      <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
                                        {order.receivers && order.receivers.length > 0
                                          ? <>{order.receivers.length > 1 && <sup style={{ padding: 4, borderRadius: 50, float: 'left', background: '#00695c', color: '#fff' }}>({order.receivers.length})</sup>}
                                            <p style={{ padding: 0 }}>{order.receivers.map(r => r.receiver_name).join(', ').substring(0, 50)}...</p></>
                                          : '-'
                                        }
                                      </Typography>
                                    </StyledTooltip>
                                  </StyledTableCell>
                                  <StyledTableCell>
                                    <StyledTooltip
                                      title={<PrettyList items={parseContainersToList(order.receiver_containers_json)} title="Containers" />}
                                      arrow
                                      placement="top"
                                    >
                                      <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>

                                        {order.receiver_containers_json
                                          ? <>{containersList.length > 1 && <sup style={{ padding: 4, borderRadius: 50, float: 'left', background: '#00695c', color: '#fff' }}>({containersList.length})</sup>}
                                            <p style={{ padding: 0 }}>{containersList.map(c => c.primary).join(', ').substring(0, 25)}...</p></>
                                          : '-'
                                        }
                                      </Typography>
                                    </StyledTooltip>
                                  </StyledTableCell>
                                  <StyledTableCell>{new Date(order.created_at).toLocaleDateString()}</StyledTableCell>

                                  <StyledTableCell>
                                    <Chip
                                      label={`${status.substring(0, 15)}...`} // Internal status for admin
                                      // size="small"
                                      sx={{
                                        flexShrink: 0,
                                        backgroundColor: colors.bg,
                                        color: colors.text
                                      }}
                                    />
                                  </StyledTableCell>

                                </StyledTableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={orderTotal}
                      rowsPerPage={orderRowsPerPage}
                      page={orderPage}
                      onPageChange={handleChangeOrderPage}
                      onRowsPerPageChange={handleChangeOrderRowsPerPage}
                      sx={{
                        borderTop: '1px solid rgba(224, 224, 224, 1)',
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                          color: '#f58220',
                          fontWeight: 'medium',
                        },
                        '& .MuiTablePagination-actions button': {
                          color: '#0d6c6a',
                        }
                      }}
                    />
                  </>
                </AccordionDetails>
              </Accordion>

              <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <SnackbarAlert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                  {snackbar.message}
                </SnackbarAlert>
              </Snackbar>
            </CardContent>
          </Card>
        </Slide>
      </Box>
    </LocalizationProvider>
  );
};
export default ConsignmentPage;