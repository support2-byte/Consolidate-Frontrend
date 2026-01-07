import React, { useState, useEffect, useMemo,useRef,useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, FormControl, Select, MenuItem, TextField, InputLabel,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Divider, Tooltip as TooltipMui,FormHelperText, Slide, Fade, Accordion, AccordionSummary, AccordionDetails, Alert, Snackbar, Alert as SnackbarAlert
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
  Chip, Stack, Grid, Avatar,
  CircularProgress,
  Card as MuiCard,
  AlertTitle
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import InfoIcon from '@mui/icons-material/Info';
import dayjs from 'dayjs';
import * as Yup from 'yup';
// import CircularProgress 
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ExpandMoreIconMui  from '@mui/icons-material/ExpandMore';
import { useParams } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIconMui from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import BusinessIcon from '@mui/icons-material/Business';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useBlocker } from 'react-router-dom';
import UpdateIcon from '@mui/icons-material/Update';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { api } from '../../api';
import { useNavigate } from 'react-router-dom';
import ContainersTabs from '../Containers/Containers';
import ContainerModule from '../Containers/Containers';
import { Navigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyPlugin } from 'jspdf-autotable';
import logoPic from "../../../public/logo.png"
applyPlugin(jsPDF); 
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
  const labelId = `${name}-label`; // Unique ID per field (e.g., "paymentType-label")
  // Ensure valid value to avoid MUI warnings
  const getSafeValue = (opt) => typeof opt === 'object' ? (opt.value ?? opt.label ?? opt.name ?? '') : opt;
  const validValue = options.length > 0 && options.some(opt => getSafeValue(opt) === value) ? value ?? name : '';
  return (
    <TooltipMui title={tooltip || ''}>
      <FormControl fullWidth error={error}>
        <InputLabel id={labelId}>{`${label}${required ? '*' : ''}`}</InputLabel>
        <Select
          name={name}
          value={validValue}
          onChange={onChange}
          onBlur={onBlur}
          labelId={labelId} // Link to InputLabel's id
          label={`${label}${required ? '*' : ''}`} // Keep for shrink behavior
          {...props}
        >
          {options.map((opt, index) => {
            const safeKey = getSafeValue(opt) || index.toString();
            const safeValue = getSafeValue(opt);
            const safeText = typeof opt === 'object' ? (opt.label ?? opt.value ?? opt.name ?? '') : opt;
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

const ConsignmentPage = ({ consignmentId: propConsignmentId }) => {
  const currentDate = dayjs();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { consignmentId: urlConsignmentId } = useParams();
  const location = useLocation();
  
  const effectiveConsignmentId = urlConsignmentId || location.state?.consignmentId || propConsignmentId;
  const [mode, setMode] = useState(effectiveConsignmentId ? 'edit' : 'add');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [initialValues, setInitialValues] = useState(null);
  const [values, setValues] = useState({
    id: '', // Add id for edit
    consignment_number: '',
    status: '',
    remarks: '',
    shipper: '',
    shipperName: '',
    shipperAddress: '',
    consignee: '',
    consigneeName: '',
    consigneeAddress: '',
    origin: '',
    originName: '',
    destination: '',
    destinationName: '',
    eform: '',
    eform_date: currentDate,
    bank: '',
    bankName: '',
    paymentType: '',
    voyage: '',
    consignment_value: 0,
    currency_code: '',
    // eta: currentDate,
    vessel: '',
    shippingLine: '',
    delivered: 0,
    pending: 0,
    seal_no: '',
    netWeight: 0,
    gross_weight: 0,
    containers: [],
    orders: []
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [options, setOptions] = useState({
    third_parties: [],
    banks: [],
    shipperOptions: [],
    consigneeOptions: [],
    originOptions: [],
    destinationOptions: [],
    bankOptions: [],
    paymentTypeOptions: [],
    vesselOptions: [],
    shippingLineOptions: [],
    currencyOptions: [],
    statusOptions: []
  });
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [containers, setContainers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [containersLoading, setContainersLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addedContainerIds, setAddedContainerIds] = useState([]);
  const [orderPage, setOrderPage] = useState(0);
  const [orderRowsPerPage, setOrderRowsPerPage] = useState(100);
  const [orderTotal, setOrderTotal] = useState(0);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "",
    booking_ref: "",
  });
  // Fixed: setFieldError -> setContainerError (local state for container errors)
  const [containerErrors, setContainerErrors] = useState({});
  const setContainerError = (path, message) => {
    setContainerErrors(prev => ({ ...prev, [path]: message }));
  };
// State (add if missing)
const [eta, setEta] = useState(currentDate || null);
const [etaSuggestion, setEtaSuggestion] = useState(null);
const [etaLoading, setEtaLoading] = useState(false);

// Local offsets (from your status_config table; map aliases as needed)
const statusOffsets = {
  'Drafts Cleared': 30,
  'Submitted On Vessel': 14,
  'Customs Cleared': 10,
  'Submitted': 10,
  'Under Shipment Processing': 7,
  'In Transit On Vessel': 4,
  'In Transit': 5,
  'Arrived at Facility': 1,
  'Ready for Delivery': 0,
  'Arrived at Destination': 0,
  'Delivered': 0,
  'HOLD for Delivery': 2,  // Fallback
  'HOLD': 0,
  'Cancelled': 0
  // Add legacy if needed: 'Draft': 30, 'Submitted': 10
};

// Updated handler (client-side calc; no API)
const handleStatusChange = (newStatusOrEvent) => {
  const newStatus = newStatusOrEvent.target ? newStatusOrEvent.target.value : newStatusOrEvent;  // Destructure if event
  setValues(prev => ({ ...prev, status: newStatus }));
  setEtaLoading(true);
  try {
    // Client-side ETA calc
    const today = dayjs();  // Fixed for testing; use dayjs() in prod
    const offsetDays = statusOffsets[newStatus] || 0;
    const suggestedEta = today.add(offsetDays, 'day').format('YYYY-MM-DD');
    setEtaSuggestion(suggestedEta);
    if (!eta) {
      setEta(suggestedEta);
      // setValues(prev => ({ ...prev, eta: suggestedEta }));  // Sync to form
      // setValues({eta:suggestedEta})
    }
    console.log(`Client-side ETA for '${newStatus}': ${suggestedEta} (+${offsetDays} days)`);  // Debug
  } catch (err) {
    console.warn('ETA suggestion failed:', err);
    setEtaSuggestion(null);
  } finally {
    setEtaLoading(false);
  }
};



// getStatusColor function: Maps consignment/container status to hex color
// Based on provided status data. Returns color string or fallback gray if unknown.
const getStatusColor = (status) => {
  if (!status || typeof status !== 'string') {
    return '#E0E0E0'; // Fallback for empty/unknown (light gray)
  }

  const statusColors = {
    'HOLD': '#FF9800',
    'Cancelled': '#F44336',
    'Drafts Cleared': '#E0E0E0',
    'Submitted On Vessel': '#9C27B0',
    'Customs Cleared': '#4CAF50',
    'Submitted': '#FFEB3B',
    'Under Shipment Processing': '#FF9800',
    'In Transit': '#4CAF50',
    'Arrived at Facility': '#795548',
    'Ready for Delivery': '#FFEB3B',
    'Arrived at Destination': '#FFEB3B',
    'Delivered': '#2196F3'
  };

  return statusColors[status] || '#9E9E9E'; // Default medium gray for unlisted
}
// Sync eta state with form values

// console.log('selected roe',effectiveConsignmentId)
  // Consolidated initData
 useEffect(() => {
  // setLoading(false)
  const initData = async () => {
    try {
      setLoading(true);
      const [thirdPartiesRes, originsRes, destinationsRes, banksRes, paymentTypesRes,
        vesselsRes, shippingLinesRes, currenciesRes, statusesRes, containerStatusesRes] =
        await Promise.all([
          api.get('api/options/thirdParty/crud'),
          api.get('api/options/places/crud'),
          api.get('api/options/places/crud'),
          api.get('api/options/banks/crud'),
          api.get('api/options/payment-types/crud'),
          api.get('api/options/vessels/crud'),
          api.get('api/options/shipping-lines'),
          api.get('api/options/currencies'),
          api.get('api/consignments/statuses'),
          api.get('api/options/container-statuses')
        ]);
      const third_parties = thirdPartiesRes?.data?.third_parties || [];
      const banks = banksRes?.data?.banks || [];
      const mapOptions = (items, valueKey = 'id', labelKey = 'name') =>
        (items || []).map(item => ({
          value: (item[valueKey] || item.value)?.toString() || '',
          label: item[labelKey] || item.label || item[valueKey] || ''
        }));
      const filteredDestinations = (destinationsRes?.data?.places || []).filter(place => place.is_destination === true);
      const filteredOrigins = (destinationsRes?.data?.places || []).filter(place => place.is_destination === true || place.is_origin === true );
      const paymentEnumMap = {
        'AP (Advance Payment)': 'Prepaid',
        'DP (Docs against Payment)': 'Collect',
        'DA (30 Days Payment)': 'Collect',
        'DA (60 Days Payment)': 'Collect',
        'DA (90 Days Payment)': 'Collect',
        'DA (120 Days Payment)': 'Collect',
        'DA (180 Days Payment)': 'Collect',
      };
      setOptions({
        third_parties,
        banks,
        shipperOptions: third_parties.filter(tp => tp.type === 'shipper').map(tp => ({ value: tp.id.toString(), label: tp.company_name })),
        consigneeOptions: third_parties.filter(tp => tp.type === 'consignee').map(tp => ({ value: tp.id.toString(), label: tp.company_name })),
        originOptions: mapOptions(originsRes?.data?.originOptions || filteredOrigins, 'id', 'name'),
        destinationOptions: mapOptions(filteredDestinations, 'id', 'name'),
        bankOptions: mapOptions(banks, 'id', 'name'),
        paymentTypeOptions: (paymentTypesRes?.data?.paymentTypes || []).map(pt => ({
          value: paymentEnumMap[pt.name] || 'Collect',
          label: pt.name,
          id: pt.id,
        })),
        vesselOptions: mapOptions(vesselsRes?.data?.vessels || [], 'id', 'name'),
        shippingLineOptions: mapOptions(shippingLinesRes?.data?.shippingLineOptions || [], 'id', 'name'),
        currencyOptions: mapOptions(currenciesRes?.data?.currencyOptions || [], 'code', 'name'),
        statusOptions: statusesRes?.data?.statusOptions || mapOptions(statusesRes?.data?.statuses || [], 'value', 'label'),
        containerStatusOptions: containerStatusesRes?.data?.containerStatusOptions || []
      });
      if (mode === 'add') {
        const defaultStatus = (statusesRes?.data?.statusOptions || []).find(opt => opt.value === 'Drafts Cleared')?.value || (statusesRes?.data?.statusOptions || [])[0]?.value || '';
        const defaultPaymentType = (paymentTypesRes?.data?.paymentTypes || [])[0]?.value || '';
        const defaultCurrency = (currenciesRes?.data?.currencyOptions || []).find(opt => opt.value === 'GBP')?.value || (currenciesRes?.data?.currencyOptions || [])[0]?.value || '';
        const defaultBank = mapOptions(banks || [])[0]?.value || '';
        const defaultVessel = mapOptions(vesselsRes?.data?.vessels || [])[0]?.value || '';
        setValues(prev => ({
          ...prev,
          status: defaultStatus,
          paymentType: defaultPaymentType,
          currency_code: defaultCurrency,
          bank: defaultBank,
          vessel: defaultVessel,
        }));
      }
      if (mode === 'edit' && effectiveConsignmentId) {
        await loadConsignment(effectiveConsignmentId);
      }
    } catch (err) {
      console.error('Error fetching options:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load options. Using defaults.',
        severity: 'warning'
      });
    } finally {
      setLoading(false);
    }
  };
  initData();
}, [mode, effectiveConsignmentId]);

const loadConsignment = async (id) => {
  try {
    // setMode('edit');
   const res = await api.get(`/api/consignments/${id}?autoUpdate=false`);
    const { data } = res.data || {};
    console.log('Loaded consignment data:', res);
    const mappedData = {
      ...data,
      shipper: data?.shipper_id?.toString() || '',
      shipperName: data?.shipper || '',
      shipperAddress: data?.shipper_address || '',
      consignee: data?.consignee_id?.toString() || '',
      consigneeName: data?.consignee || '',
      consigneeAddress: data?.consignee_address || '',
      origin: data?.origin_id?.toString() || '',
      originName: data?.origin || '',
      destination: data?.destination_id?.toString() || '',
      destinationName: data?.destination || '',
      bank: data?.bank_id?.toString() || '',
      bankName: data?.bank || '',
      paymentType: data?.payment_type?.toString() || '',
      status: data?.status || '',
      vessel: data?.vessel ? data.vessel.toString() : '',
      shippingLine: data?.shipping_line ? data.shipping_line.toString() : '',
      netWeight: data?.net_weight || 0,
      gross_weight: data?.gross_weight || 0,
      consignment_value: data?.consignment_value || 0,
      currency_code: data?.currency_code || '',
      eform_date: data?.eform_date ? dayjs(data.eform_date): '',
      eta: data?.eta ? dayjs(data.eta): '',
      containers: (data?.containers || []).map(c => ({
        location: c?.location || '',
        containerNo: c?.containerNo || '',
        size: c?.size || '',
        ownership: c?.ownership || '',
        containerType: c?.containerType || '',
        status: c?.status || 'Pending',
        id: c?.id || c?.cid
      })),
    };
    console.log('Mapped data (focus: vessel/payment/status):', {
      vessel: mappedData.vessel,
      paymentType: mappedData.paymentType,
      status: mappedData.status
    });
    setValues(mappedData);
    if (data?.orders && data.orders.length > 0) {
      setSelectedOrders(data.orders.map(o => o.id));
    }
  } catch (err) {
    console.error('Error loading consignment:', err);
  }
};
  // Lookup after values and options are set
  useEffect(() => {
    if (mode === 'edit' && effectiveConsignmentId && options.third_parties?.length > 0 && options.banks?.length > 0 &&
        options.originOptions?.length > 0 && options.destinationOptions?.length > 0 &&
        (values.shipperName || values.consigneeName || values.bankName || values.originName || values.destinationName)) {
      lookupMissingIds();
    }
    setEta(values.eta)
  }, [mode, effectiveConsignmentId, options.third_parties, options.banks, options.originOptions, options.destinationOptions,
      values.shipperName, values.consigneeName, values.bankName, values.originName, values.destinationName]);
  const lookupMissingIds = () => {
    const updates = {};
    let hasUpdate = false;
    const fuzzyMatch = (str1, str2) =>
      (str1 || '').trim().toLowerCase() === (str2 || '').trim().toLowerCase();
    if (values.shipperName && !values.shipper && options.third_parties.length > 0) {
      const selected = options.third_parties.find(tp =>
        tp.type === 'shipper' &&
        (fuzzyMatch(tp.company_name, values.shipperName) || fuzzyMatch(tp.name, values.shipperName))
      );
      if (selected) {
        updates.shipper = selected.id.toString();
        if (!values.shipperAddress || values.shipperAddress.trim() === '') {
          updates.shipperAddress = selected.address || selected.full_address || selected.company_address || '';
        }
        hasUpdate = true;
        console.log('Found shipper match:', selected);
      } else {
        console.warn('No shipper match found for:', values.shipperName);
      }
    }
    if (values.consigneeName && !values.consignee && options.third_parties.length > 0) {
      const selected = options.third_parties.find(tp =>
        tp.type === 'consignee' &&
        (fuzzyMatch(tp.company_name, values.consigneeName) || fuzzyMatch(tp.name, values.consigneeName))
      );
      if (selected) {
        updates.consignee = selected.id.toString();
        if (!values.consigneeAddress || values.consigneeAddress.trim() === '') {
          updates.consigneeAddress = selected.address || selected.full_address || selected.company_address || '';
        }
        hasUpdate = true;
        console.log('Found consignee match:', selected);
      } else {
        console.warn('No consignee match found for:', values.consigneeName);
      }
    }
    if (values.bankName && !values.bank && options.banks.length > 0) {
      const selected = options.banks.find(b =>
        fuzzyMatch(b.name, values.bankName) || fuzzyMatch(b.bank_name, values.bankName)
      );
      if (selected) {
        updates.bank = selected.id.toString();
        hasUpdate = true;
        console.log('Found bank match:', selected);
      } else {
        console.warn('No bank match found for:', values.bankName);
      }
    }
    if (values.originName && !values.origin && options.originOptions.length > 0) {
      const selected = options.originOptions.find(opt => fuzzyMatch(opt.label, values.originName));
      if (selected) {
        updates.origin = selected.value;
        hasUpdate = true;
        console.log('Found origin match:', selected);
      } else {
        console.warn('No origin match found for:', values.originName);
      }
    }
    if (values.destinationName && !values.destination && options.destinationOptions.length > 0) {
      const selected = options.destinationOptions.find(opt => fuzzyMatch(opt.label, values.destinationName));
      if (selected) {
        updates.destination = selected.value;
        hasUpdate = true;
        console.log('Found destination match:', selected);
      } else {
        console.warn('No destination match found for:', values.destinationName);
      }
    }
    if (hasUpdate) {
      setValues(prev => {
        const newValues = { ...prev, ...updates };
        console.log('Post-lookup values:', {
          shipper: newValues.shipper,
          shipperLabel: options.shipperOptions?.find(opt => opt.value === newValues.shipper)?.label,
          consignee: newValues.consignee,
          consigneeLabel: options.consigneeOptions?.find(opt => opt.value === newValues.consignee)?.label,
          bank: newValues.bank,
          bankLabel: options.bankOptions?.find(opt => opt.value === newValues.bank)?.label,
          origin: newValues.origin,
          originLabel: options.originOptions?.find(opt => opt.value === newValues.origin)?.label,
          destination: newValues.destination,
          destinationLabel: options.destinationOptions?.find(opt => opt.value === newValues.destination)?.label,
        });
        return newValues;
      });
      console.log('Fallback IDs & addresses set:', updates);
    }
  };
  useEffect(() => {
    if (!loading && initialValues === null) {
      // Capture snapshot after options and data are loaded
      setInitialValues({ ...values });
    }
  }, [loading, values]);
  const isDirty = useMemo(() => {
    if (!initialValues) return false;
    // List of primitive fields to compare directly
    const primitives = [
      'id', 'consignment_number', 'status', 'remarks', 'shipper', 'shipperName', 'shipperAddress',
      'consignee', 'consigneeName', 'consigneeAddress', 'origin', 'originName', 'destination', 'destinationName',
      'eform', 'bank', 'bankName', 'paymentType', 'voyage', 'consignment_value', 'currency_code',
      'delivered', 'pending', 'seal_no', 'netWeight', 'gross_weight'
    ];
    // Compare primitives
    for (let key of primitives) {
      if (values[key] !== initialValues[key]) {
        return true;
      }
    }
    // Compare dates (using dayjs format for string comparison)
    if (values.eform_date?.format('YYYY-MM-DD') !== initialValues.eform_date?.format('YYYY-MM-DD')) {
      return true;
    }
    // if (values.eta?.format('YYYY-MM-DD') !== initialValues.eta?.format('YYYY-MM-DD')) {
    //   return true;
    // }
    // Compare arrays using JSON.stringify (simple and sufficient for containers/orders structure)
    if (JSON.stringify(values.containers) !== JSON.stringify(initialValues.containers)) {
      return true;
    }
    if (JSON.stringify(values.orders) !== JSON.stringify(initialValues.orders)) {
      return true;
    }
    return false;
  }, [values, initialValues]);
  const isDirtyRef = useRef(false);
  // useEffect(() => {
  //   isDirtyRef.current = isDirty;
  // }, [isDirty]);
  // // Fixed: Single useBlocker call with memoized blocker to avoid hook count issues
  // const blocker = useCallback(
  //   ({ currentLocation, nextLocation }) =>
  //     isDirtyRef.current && (nextLocation.pathname !== currentLocation.pathname),
  //   []
  // );
  // useBlocker(blocker);
  // // Add this useEffect for browser close/refresh/tab close
  // useEffect(() => {
  //   if (!isDirty) {
  //     window.onbeforeunload = null;
  //     return;
  //   }
  //   const handleBeforeUnload = (e) => {
  //     e.preventDefault();
  //     e.returnValue = 'Are you sure you want to leave? Changes you made may not be saved.';
  //     return 'Are you sure you want to leave? Changes you made may not be saved.';
  //   };
  //   window.onbeforeunload = handleBeforeUnload;
  //   return () => {
  //     window.onbeforeunload = null;
  //   };
  // }, [isDirty]);
  // Optional: Add a manual confirmation for back button or custom nav (e.g., in resetForm or navigate calls)
  // But useBlocker handles most cases. For example, update resetForm:
  const resetForm = () => {
    if (isDirty) {
      const confirmed = window.confirm('Unsaved changes will be lost. Continue?');
      if (!confirmed) return;
    }
    setValues({
      id: '',
      // consignment_number: '', // Note: If you want to reset this too, uncomment
      status: '',
      remarks: '',
      shipper: '',
      shipperName: '',
      shipperAddress: '',
      consignee: '',
      consigneeName: '',
      consigneeAddress: '',
      origin: '',
      originName: '',
      destination: '',
      destinationName: '',
      eform: '',
      eform_date: currentDate,
      bank: '',
      bankName: '',
      paymentType: '',
      voyage: '',
      consignment_value: 0,
      currency_code: '',
      eta: currentDate,
      vessel: '',
      shippingLine: '',
      delivered: 0,
      pending: 0,
      seal_no: '',
      netWeight: 0,
      gross_weight: 0,
      containers: [{ containerNo: '', location: '', size: '', containerType: '', ownership: '', status: 'Pending', id: '' }],
      orders: []
    });
    setErrors({});
    setTouched({});
    setSelectedOrders([]);
    setInitialValues(null); // Reset initial snapshot to avoid false dirty state after reset
  };
  
  // Sync missing options for vessel, paymentType, status
  useEffect(() => {
    const syncMissingOptions = () => {
      let updatedOptions = { ...options };
      let hasUpdate = false;
      const appendIfMissing = (optKey, value) => {
        if (value && !updatedOptions[optKey]?.find(opt => opt.value === value)) {
          const newOpt = { value, label: value };
          updatedOptions[optKey] = [...(updatedOptions[optKey] || []), newOpt];
          hasUpdate = true;
          console.log(`Appended missing ${optKey}:`, newOpt);
        }
      };
      appendIfMissing('vesselOptions', values.vessel);
      appendIfMissing('paymentTypeOptions', values.paymentType);
      appendIfMissing('statusOptions', values.status);
      if (hasUpdate) {
        setOptions(updatedOptions);
        console.log('Synced options with form values.');
      }
    };
    if (mode === 'edit' && effectiveConsignmentId &&
        (values.vessel || values.paymentType || values.status) &&
        options.vesselOptions?.length > 0) {
      syncMissingOptions();
    }
  }, [mode, effectiveConsignmentId, values.vessel, values.paymentType, values.status, options.vesselOptions?.length]);
  // Debug render log
  useEffect(() => {
    console.log('Render - Current values for dropdowns:', {
      shipper: values.shipper,
      consignee: values.consignee,
      bank: values.bank,
      origin: values.origin,
      destination: values.destination,
    });
  }, [values.shipper, values.consignee, values.bank, values.origin, values.destination]);
  // Helper to load images as Base64

  const validateField = async (name, value) => {
    try {
      await validationSchema.fields[name]?.validate(value);
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [name]: error.message }));
    }
  };
  // Fetch containers
  useEffect(() => {
    // setSaving(false)
    const fetchContainers = async () => {
      setContainersLoading(true);
      try {
        const res = await api.get("/api/containers");
        setContainers(res.data?.data || []);
      } catch (err) {
        console.error("❌ Error fetching containers:", err);
      } finally {
        setContainersLoading(false);
      }
    };
    fetchContainers();
  }, []);
  useEffect(() => {
    const ids = (values.containers || []).map(c => c.id || c.cid).filter(id => id);
    setAddedContainerIds(ids);
  }, [values.containers]);
  // Fetch orders
useEffect(() => {
  const filterOrdersByContainers = (orders, selectedContainerIds) => {
    if (!Array.isArray(orders)) {
      console.warn('filterOrdersByContainers: Input "orders" is not an array:', orders);
      return [];
    }
    if (!selectedContainerIds || selectedContainerIds.length === 0) {
      // If no container IDs, still attach order to each receiver
      return orders.map(order => ({
        ...order,
        receivers: (order.receivers || []).map(receiver => ({
          ...receiver,
          order: order // Attach full order to each receiver
        }))
      }));
    }
    // FIXED: Parse to numbers for CID matching (assuming addedContainerIds are CIDs)
    const selectedCids = selectedContainerIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (selectedCids.length === 0) {
      console.warn('No valid CIDs for filtering');
      return [];
    }
    console.log('Filtering with CIDs:', selectedCids);
    return orders
      .map((order) => {
        console.log('Processing order:', order);
        const filteredReceivers = (order.receivers || [])
          .filter(receiver => receiver !== null)
          .map((receiver) => {
            console.log('Receiver:', receiver.id, 'containers:', receiver.containers);
            const filteredShippingDetails = (receiver.shippingdetails || []).filter((shippingDetail) => {
              const hasMatch = (shippingDetail.containerDetails || []).some((containerDetail) => {
                const cid = containerDetail.container?.cid;
                const matches = selectedCids.includes(cid);
                console.log(`Check: CID ${cid} in [${selectedCids.join(', ')}]? ${matches}`);
                return matches;
              });
              return hasMatch;
            });
            console.log(`Filtered shipping for receiver ${receiver.id}: ${filteredShippingDetails.length} items`);
            if (filteredShippingDetails.length === 0) return null;
            return {
              ...receiver,
              order: order, // Attach full order to each receiver
              shippingdetails: filteredShippingDetails,
            };
          })
          .filter(Boolean);
        console.log('Final filtered receivers:', filteredReceivers.length);
        if (filteredReceivers.length === 0) return null;
        const totalQty = filteredReceivers.reduce((sum, r) => sum + (r.total_number || 0), 0);
        return {
          ...order,
          receivers: filteredReceivers,
          total_assigned_qty: totalQty,
        };
      })
      .filter(Boolean);
  };
  // FIXED: Define fetchOrders outside the filter logic
  const fetchOrders = async () => {
    if ((addedContainerIds || []).length === 0) {
      setOrders([]);
      setOrderTotal(0);
      setOrdersLoading(false);
      return;
    }
    setOrdersLoading(true);
    try {
      const params = {
        page: orderPage + 1,
        limit: orderRowsPerPage,
        includeContainer: true,
        includeReceivers: true, // New: Explicitly include receivers
        includeShippingDetails: true, // New: Include shippingdetails within receivers
        container_id: addedContainerIds.join(','),
        ...(filters.booking_ref && { booking_ref: filters.booking_ref }),
        ...(filters.status && { status: filters.status }),
      };
      console.log('Fetching orders with params:', params); // Debug: Log sent params
      const response = await api.get(`/api/orders/consignmentsOrders`, { params });
      console.log('Fetched orders response:', response.data); // Debug: Full response
      const fetchedOrders = response.data?.data || [];
      const fetchedTotal = response.data?.total || 0;
      // FIXED: Apply client-side filtering for shipping details *after* fetching data
      const filteredOrders = filterOrdersByContainers(fetchedOrders, addedContainerIds);
      setOrders(filteredOrders);
      setOrderTotal(fetchedTotal);
      handleSelectAllClick({target: {checked:true}})
      if (filteredOrders.length >= 0) {
        handleSelectAllClick({ target: { checked: true } }); // Guard: Only if data exists
      }
      console.log('filteration last', filteredOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setSnackbar({ open: true, message: 'Failed to fetch orders. Please try again.', severity: 'error' }); // Fixed: Use setSnackbar
      setOrders([]); // Reset on error
      setOrderTotal(0);
    } finally {
      setOrdersLoading(false);
    }
  };
  // FIXED: Actually call the fetch function
  fetchOrders();
}, [addedContainerIds, filters, orderPage, orderRowsPerPage]);
  const getPlaceName = (placeId) => {
    if (!placeId) return '-';
    const place = options.destinationOptions.find(p => p.value === placeId.toString());
    return place ? place.label : placeId;
  };
  // Added deps if needed
  const isSelected = (id) => (selectedOrders || []).indexOf(id) !== -1;
  const handleOrderToggle = (orderId) => () => {
    console.log('toggle order', orderId);
    const currentIndex = (selectedOrders || []).indexOf(orderId);
    const newSelected = [...(selectedOrders || [])];
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
      const newSelecteds = (orders || []).map((n) => n.id);
      setSelectedOrders(newSelecteds);
      return;
    }
    setSelectedOrders([]);
  };
  const includedOrders = useMemo(() =>
    (selectedOrders || []).map(id => (orders || []).find(o => o.id === id)).filter(Boolean),
    [selectedOrders, orders]
  );

  const allReceivers = useMemo(() => orders.flatMap(order => order.receivers || []), [orders]);
// === AUTO CALCULATE NET & GROSS WEIGHT FROM SELECTED ORDERS ===
  const calculatedTotals = useMemo(() => {
    let totalNetWeight = 0;

    const ordersToSum = includedOrders.length > 0 ? includedOrders : orders;

    ordersToSum.forEach(order => {
      (order.receivers || []).forEach(receiver => {
        (receiver.shippingdetails || []).forEach(detail => {
          const weight = parseFloat(detail.weight || 0);
          const quantity = parseInt(detail.totalNumber || 1);
          totalNetWeight += weight * quantity;
        });
      });
    });

    const net = parseFloat(totalNetWeight.toFixed(2));
    const gross = parseFloat((net * 1.15).toFixed(2)); // 15% extra for packaging

    return { netWeight: net, grossWeight: gross };
  }, [includedOrders, orders]);

  // Sync calculated weights into form values
  useEffect(() => {
    setValues(prev => ({
      ...prev,
      netWeight: calculatedTotals.netWeight,
      gross_weight: calculatedTotals.grossWeight,
    }));
  }, [calculatedTotals.netWeight, calculatedTotals.grossWeight]);

  useEffect(() => {
    setValues(prev => ({ ...prev, orders: (selectedOrders || []).map(id => ({ id })) }));
  }, [selectedOrders]);
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
  const numSelected = (orders || []).filter((o) => isSelected(o.id)).length;
  const rowCount = (orders || []).length;
  const getStatusColors = (status) => {
    const colorMap = {
      'Created': { bg: '#00695c', text: '#f1f8e9' },
      'Received for Shipment': { bg: '#e3f2fd', text: '#1976d2' },
      'Waiting for Authentication': { bg: '#fff3e0', text: '#ef6c00' },
      'Shipper Authentication Confirmed': { bg: '#e8f5e8', text: '#388e3c' },
      'Under Shipment Processing': { bg: '#fff3e0', text: '#ef6c00' },
      'Waiting for Shipper Authentication (if applicable)': { bg: '#fff3e0', text: '#ef6c00' },
      'Customs Cleared': { bg: '#e8f5e8', text: '#388e3c' },
      'In Transit': { bg: '#fff3e0', text: '#ef6c00' },
      'Ready for Loading': { bg: '#f3e5f5', text: '#7b1fa2' },
      'Loaded into Container': { bg: '#e0f2f1', text: '#00695c' },
      'Departed for Port': { bg: '#e1f5fe', text: '#0277bd' },
      'Offloaded at Port': { bg: '#f1f8e9', text: '#689f38' },
      'Clearance Completed': { bg: '#fce4ec', text: '#c2185b' },
      'Containers Returned (Internal only)': { bg: '#ffebee', text: '#c62828' },
      'Hold': { bg: '#fff3e0', text: '#f57c00' },
      'Cancelled': { bg: '#ffebee', text: '#d32f2f' },
      'Delivered': { bg: '#e8f5e8', text: '#2e7d32' },
      default: { bg: '#f5f5f5', text: '#666' }
    };
    return colorMap[status] || colorMap.default;
  };
  const handleStatusUpdate = (id, order) => {
    console.log('Update status for order:', id, order);
  };
  const handleView = (id) => {
    console.log('View order:', id);
  };
  const handleEdit = (id) => {
    console.log('Edit order:', id);
  };
  const handleContainerToggle = (containerId) => () => {
    const currentIndex = (selectedContainers || []).indexOf(containerId);
    const newSelected = [...(selectedContainers || [])];
    if (currentIndex === -1) {
      newSelected.push(containerId);
    } else {
      newSelected.splice(currentIndex, 1);
    }
    setSelectedContainers(newSelected);
  };
  const addSelectedContainers = () => {
    const selectedData = (selectedContainers || [])
      .map(id => (containers || []).find(c => c.cid === id))
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
      containerNo: container.container_number || '',
      location: container.location || '',
      size: container.container_size || '',
      containerType: container.container_type || '',
      ownership: container.owner_type === 'soc' ? 'Own' : (container.owner_type === 'coc' ? 'Hired' : container.owner_type),
      status: container.derived_status || 'Pending',
      id: container.cid,
    }));
    setValues(prev => ({
      ...prev,
      containers: [...(prev.containers || []), ...newContainers]
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
  const validationSchema = Yup.object({
    consignment_number: Yup.string().required('Consignment # is required'),
    shipper: Yup.string().required('Shipper is required'),
    consignee: Yup.string().required('Consignee is required'),
    origin: Yup.string().required('Origin is required'),
    destination: Yup.string().required('Destination is required'),
    eform: Yup.string().matches(/^[A-Z]{3}-\d{6}$/, 'Invalid format (e.g., ABC-123456)').required('Eform # is required'),
    eform_date: Yup.date().required('Eform Date is required'),
    bank: Yup.string().required('Bank is required'),
    paymentType: Yup.string().required('Payment Type is required'),
    voyage: Yup.string().min(3, 'Voyage must be at least 3 characters').required('Voyage is required'),
    consignment_value: Yup.number().min(0).required('Consignment Value is required'),
    vessel: Yup.string().required('Vessel is required'),
    netWeight: Yup.number().min(0).required('Net Weight is required'),
    gross_weight: Yup.number().min(0).required('Gross Weight is required'),
    // containers: Yup.array().of(
    // Yup.object({
    // containerNo: Yup.string().required('Container No. is required'),
    // size: Yup.string().oneOf(['20ft', '40ft']).required('Size is required'),
    // })
    // ).min(1, 'At least one container required'),
    orders: Yup.array()
      .of(
        Yup.object({
          id: Yup.number().required()
        })
      )
      .min(1, 'At least one order is required'),
  });
  const handleChange = (e) => {
    console.log('handleee', e);
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
  };
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
  const handlePartyChange = (e) => {
    const { name, value } = e.target;
    handleChange(e);
    if ((name === 'shipper' || name === 'consignee') && options.third_parties.length > 0) {
      const selectedTp = options.third_parties.find(tp => tp.id.toString() === value);
      if (selectedTp) {
        const nameField = name === 'shipper' ? 'shipperName' : 'consigneeName';
        const addressField = name === 'shipper' ? 'shipperAddress' : 'consigneeAddress';
        setValues(prev => ({
          ...prev,
          [nameField]: selectedTp.name || selectedTp.company_name || selectedTp.title || '',
          [addressField]: selectedTp.address || ''
        }));
      } else {
        const nameField = name === 'shipper' ? 'shipperName' : 'consigneeName';
        const addressField = name === 'shipper' ? 'shipperAddress' : 'consigneeAddress';
        setValues(prev => ({
          ...prev,
          [nameField]: '',
          [addressField]: ''
        }));
      }
    } else if ((name === 'shipper' || name === 'consignee') && !value) {
      const nameField = name === 'shipper' ? 'shipperName' : 'consigneeName';
      const addressField = name === 'shipper' ? 'shipperAddress' : 'consigneeAddress';
      setValues(prev => ({
        ...prev,
        [nameField]: '',
        [addressField]: ''
      }));
    }
  };
  const handleBankChange = (e) => {
    const { name, value } = e.target;
    if (name !== 'bank') return;
    handleChange(e);
    if (options.banks.length > 0) {
      const selectedBank = options.banks.find(b => b.id.toString() === value);
      if (selectedBank) {
        setValues(prev => ({
          ...prev,
          bankName: selectedBank.name || selectedBank.bank_name || selectedBank.title || ''
        }));
      } else {
        setValues(prev => ({ ...prev, bankName: '' }));
      }
    } else {
      setValues(prev => ({ ...prev, bankName: '' }));
    }
  };
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    handleChange(e);
    let optionsKey = [];
    let nameField = '';
    if (name === 'origin') {
      optionsKey = options.originOptions;
      nameField = 'originName';
    } else if (name === 'destination') {
      optionsKey = options.destinationOptions;
      nameField = 'destinationName';
    }
    if (optionsKey.length > 0) {
      const selected = optionsKey.find(opt => opt.value === value);
      setValues(prev => ({ ...prev, [nameField]: selected ? selected.label : '' }));
    } else {
      setValues(prev => ({ ...prev, [nameField]: '' }));
    }
  };
  const updateArrayField = (arrayName, index, fieldName, value) => {
    const newArray = [...(values[arrayName] || [])];
    newArray[index][fieldName] = value;
    setValues(prev => ({ ...prev, [arrayName]: newArray }));
    if (touched[arrayName]) validateArray(arrayName);
  };
  const validateArray = async (arrayName) => {
    try {
      await validationSchema.fields[arrayName]?.validate(values[arrayName] || []);
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
  // Update addContainer function
  const addContainer = () => {
    setValues(prev => ({
      ...prev,
      containers: [...(prev.containers || []), { containerNo: '', location: '', size: '', containerType: '', ownership: '', status: 'Pending', id: '' }]
    }));
    markArrayTouched('containers');
  };
  const removeContainer = (index) => {
    const newContainers = (values.containers || []).filter((_, i) => i !== index);
    setValues(prev => ({ ...prev, containers: newContainers }));
    markArrayTouched('containers');
  };
  const advanceStatus = async () => {
    try {
      setLoading(true)
      const res = await api.put(`/api/consignments/${effectiveConsignmentId}/next`);
      const { message } = res.data || {};
      console.log('Status advanced:', res);
       loadConsignment(effectiveConsignmentId);
      setLoading(false)

      setSnackbar({
        open: true,
        message: message || 'Status advanced successfully!',
        severity: 'success',
      });
    } catch (err) {
      setLoading(false)

      console.error('Error advancing status:', err);
      setSnackbar({
        open: true,
        message: 'Failed to advance status.',
        severity: 'error',
      });
    }
  };


  useEffect(() => {
    
      if (orders && orders.length > 0) {
        const allOrderIds = orders.map((order) => order.id);
        setSelectedOrders(allOrderIds);
      }
    }, [orders]);

  const validateForm = async () => {
    try {
      await validationSchema.validate(values, { abortEarly: false });
      return true;
    } catch (validationError) {
      const fieldErrors = {};
      validationError.inner.forEach(err => {
        fieldErrors[err.path] = err.message;
      });
      setErrors(fieldErrors);
      setSnackbar({
        open: true,
        message: 'Please fix the validation errors before submitting.',
        severity: 'error',
      });
      return false;
    }
  };
  const validateAndPrepare = async () => {
    const isValid = await validateForm();
    if (!isValid) return null;
    const allFields = Object.keys(validationSchema.fields);
    // console.log('Marking all fields as touched for validation:', allFields);
    setTouched(prev => ({ ...prev, ...allFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}) }));
    const validContainers = (values.containers || []).filter(c =>
      c.containerNo && c.size && c.containerNo.trim() !== ''
    );
    if (validContainers.length === 0) {
      setSnackbar({ open: true, message: 'At least one valid container is required.', severity: 'error' });
      setSaving(false);
      return null;
    }
    const orderIds = (selectedOrders || values.orders || []).map(o => typeof o === 'object' ? o.id : o).filter(id => id);
    if (orderIds.length === 0) {
      setSnackbar({ open: true, message: 'At least one order is required.', severity: 'error' });
      setSaving(false);
      return null;
    }
    if (!values.consignment_number?.trim()) {
      setSnackbar({ open: true, message: 'Consignment Number is required.', severity: 'error' });
      setSaving(false);
      return null;
    }
    if (!values.shipperName?.trim() || !values.consigneeName?.trim()) {
      setSnackbar({ open: true, message: 'Shipper and Consignee names required.', severity: 'error' });
      setSaving(false);
      return null;
    }
    if (!values.bankName?.trim() && values.bank) {
      console.warn('Bank name empty; proceeding but populate for DB.');
    }
    const submitData = {
      consignment_value: parseFloat(values.consignment_value) || 0.00,
      net_weight: parseFloat(values.netWeight) || 0.00,
      gross_weight: parseFloat(values.gross_weight) || 0.00,
      payment_type: values.paymentType,
      status: values.status,
      consignment_number: values.consignment_number.trim(),
      remarks: values.remarks || null,
      shipper_id: parseInt(values.shipper, 10) || null,
      shipper_address: values.shipperAddress || null,
      shipper: values.shipperName || '',
      consignee_id: parseInt(values.consignee, 10) || null,
      consignee_address: values.consigneeAddress || null,
      consignee: values.consigneeName || '',
      origin: values.originName || values.origin || null,
      destination: values.destinationName || values.destination || null,
      eform: values.eform || null,
      eform_date: values.eform_date ? dayjs(values.eform_date).format('YYYY-MM-DD'): '',
      bank_id: parseInt(values.bank, 10) || null,
      bank: values.bankName || '',
      currency_code: values.currency_code || 'GBP',
      vessel: parseInt(values.vessel, 10) || null,
      eta: eta ? dayjs(values.eta).format('YYYY-MM-DD'): '',
      voyage: values.voyage || null,
      shipping_line: values.shippingLine || null,
      delivered: parseInt(values.delivered, 10) || 0,
      pending: parseInt(values.pending, 10) || 0,
      seal_no: values.seal_no || null,
      containers: validContainers,
      orders: orderIds,
    };
    console.log('Full submitData before API:', JSON.stringify(submitData, null, 3));
    return submitData;
  };
  const handleCreate = async (e) => {

    if (e) e.preventDefault();
    const submitData = await validateAndPrepare();

    if (!submitData) return;

    setSaving(true);
    try {

      const res = await api.post('/api/consignments', submitData);
setSaving(true);
      // console.log('[handleCreate] Success response:', res.data);
      const { data: responseData, message } = res.data || {};
      setSnackbar({
        open: true,
        message: 'Consignment created successfully!',
        severity: 'success',
      });
      console.log('New ID:', responseData?.id);
      const mappedResponse = {
        id: responseData?.id,
        ...responseData,
        shipper: responseData?.shipper_id?.toString() || '',
        consignee: responseData?.consignee_id?.toString() || '',
        bank: responseData?.bank_id?.toString() || '',
        vessel: responseData?.vessel?.toString() || '',
        shippingLine: responseData?.shipping_line?.toString() || '',
        netWeight: responseData?.net_weight,
        eform_date: responseData?.eform_date ? dayjs(responseData.eform_date): '',
        eta: responseData?.eta ? dayjs(responseData.eta): '',
        containers: responseData?.containers ? responseData.containers.map(c => ({
          containerNo: c?.containerNo,
          size: c?.size,
          ownership: c?.ownership,
          status: c?.status,
          id: c?.id || c?.cid
        })) : [],
      };
      setValues(mappedResponse);
      if (responseData?.orders) {
        setSelectedOrders(responseData.orders.map(o => o.id));
      }
      navigate(`/consignments`);
    } catch (err) {
      console.error("[handleCreate] Full error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      if (err.response) {
        const { error: apiError, details, message: backendMessage } = err.response.data || {};
        let backendValidationErrors = {};
        // Simplified error handling - expand as needed
        setErrors(prev => ({ ...prev, ...backendValidationErrors }));
        const backendMsg = apiError || backendMessage || err.message || 'Failed to create consignment';
        setSnackbar({
          open: true,
          message: backendMsg,
          severity: 'error',
        });
      } else {
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
  const handleEditCon = async (e) => {
    console.log('Editing consignment', e);
    if (e) e.preventDefault();
    if (!values.id) {
      setSnackbar({ open: true, message: 'No consignment ID found for editing.', severity: 'error' });
      setSaving(false);
      return;
    }
    setSaving(true);
    const submitData = await validateAndPrepare();
    if (!submitData) return;
    submitData.id = values.id;
    try {
      const res = await api.put(`/api/consignments/${values.id}`, submitData);
      console.log('[handleEdit] Success response:', res.data);
      const { data: responseData, message } = res.data || {};
      setSnackbar({
        open: true,
        message: 'Consignment updated successfully!',
        severity: 'success',
      });
      await loadConsignment(values.id);
      navigate(`/consignments`);
    } catch (err) {
      console.error("[handleEdit] Full error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      if (err.response) {
        const { error: apiError, details, message: backendMessage } = err.response.data || {};
        let backendValidationErrors = {};
        setErrors(prev => ({ ...prev, ...backendValidationErrors }));
        const backendMsg = apiError || backendMessage || err.message || 'Failed to update consignment';
        setSnackbar({
          open: true,
          message: backendMsg,
          severity: 'error',
        });
      } else {
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

  const getContainerError = (index) => { // Fixed: Function to get per-row errors
    // Simple implementation: Check for duplicates and required fields
    const container = values.containers?.[index] || {};
    const errors = {};
    if (!container.containerNo?.trim()) {
      errors.containerNo = 'Container No. is required';
    }
    if (!container.size?.trim()) {
      errors.size = 'Size is required';
    }
    // Check duplicate
    const isDuplicate = (containerNo) => {
      return (values.containers || []).some((c, i) => i !== index && c.containerNo?.trim().toUpperCase() === containerNo?.trim().toUpperCase());
    };
    if (container.containerNo && isDuplicate(container.containerNo)) {
      errors.containerNo = 'Container already exists in list';
    }
    return errors;
  };
  const hasErrors = Object.values(errors).some(Boolean);
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
    'Containers Returned (Internal only)',
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
  const StatusChip = ({ status }) => {
    const colors = getStatusColors(status);
    console.log('StatusChip colors for', status, colors);
    return (
      <Chip
        label={status}
        size="large"
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
  const parseSummaryToList = (receivers) => {
    if (!receivers || !Array.isArray(receivers)) return [];
    return receivers.map(rec => ({
      primary: rec.receiver_name,
      status: rec.status
    }));
  };
  const PrettyList = ({ items, title }) => (
    <MuiCard
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: '#fafafa',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f58220' }}>
            {title}
          </Typography>
          <Chip
            label={`(${items?.length || 0})`}
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
        <Stack spacing={1} sx={{ maxHeight: 200, overflow: 'auto' }}>
          {(items || []).length > 0 ? (
            (items || []).map((item, index) => (
              <MuiCard
                key={index}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  backgroundColor: '#fff',
                  boxShadow: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-1px)',
                    borderColor: 'primary.light'
                  },
                  cursor: 'pointer'
                }}
                onClick={() => { }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'primary.main',
                      fontSize: '1rem',
                      flexShrink: 0
                    }}
                  >
                    {item.primary ? item.primary.charAt(0).toUpperCase() : '?'}
                  </Avatar>
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
              </MuiCard>
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
              <EmojiEventsIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                No items available
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </MuiCard>
  );
  const parseContainersToList = (containersStr) => {
    if (!containersStr) return [];
    return containersStr.split(', ').map(cont => ({ primary: cont.trim() }));
  };
  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
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


// Helper to load images as Base64 (ensure this is defined/imported if not already)
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

// Assuming getPlaceName is defined elsewhere; if not, define it (e.g., a function mapping IDs to names)
const getPlaceNamePdf = (id) => {
  // Example mapping; replace with actual logic
  const places = { 2: 'Karachi', 5: 'Dubai' }; // Add more as needed
  return places[id] || 'N/A';
};



const generateManifestPDFWithCanvas = async (data, allReceivers, selectedOrderObjects = includedOrders) => {
    console.log('data for canvas data', data)
    if (!data.consignment_number) {
      setSnackbar({
        open: true,
        severity: 'warning',
        message: 'Please enter a consignment number to generate the manifest.',
      });
      return;
    }
    const groupedShipping = allReceivers.reduce((acc, order) => {
      acc[order.id] = order.receivers.reduce((recAcc, receiver) => {
        recAcc[receiver.id] = receiver.shippingdetails || [];
        return recAcc;
      }, {});
      return acc;
    }, {});


    let total_assign_boxes_all = 0;

    allReceivers.forEach(order => {
      order.receivers.forEach(receiver => {
        const shippingDetails = receiver.shippingdetails || [];

        shippingDetails.forEach(detail => {
          const containerDetails = detail.containerDetails || [];

          containerDetails.forEach(container => {
            total_assign_boxes_all += Number(container.assign_total_box) || 0;
          });
        });
      });
    });

    console.log(`Total Assign Boxes (All Orders): ${total_assign_boxes_all}`);


    // Helper function to normalize/format dates
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Helper function to get place name (assuming getPlaceName is defined; fallback here)
    const getPlaceName = (id) => {
      const places = { 2: 'Karachi', 5: 'Dubai' }; // Example; replace with actual
      return places[id] || id || 'N/A';
    };

    // Helper to format weight
    const formatWeight = (weight) => weight ? `${weight} KGS` : 'N/A';

    // Load logo as base64
    const logoBase64 = await loadImageAsBase64(logoPic);

    // Create a temporary div element to render content
    const tempElement = document.createElement('div');
    tempElement.style.width = '210mm'; // A4 width
    tempElement.style.padding = '4mm'; // Match margin
    tempElement.style.backgroundColor = 'white';
    tempElement.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    tempElement.style.boxSizing = 'border-box';


    // Commodity-wise data group karein with assign_total_box
    const commoditySummary = allReceivers.reduce((summary, order) => {
      order.receivers.forEach(receiver => {
        receiver.shippingdetails?.forEach(detail => {
          const commodity = detail.category || 'Unknown';
          const subcategory = detail.subcategory || '';
          const commodityKey = subcategory ? `${commodity} - ${subcategory}` : commodity;

          if (!summary[commodityKey]) {
            summary[commodityKey] = {
              commodity: commodityKey,
              totalOrders: 0,
              totalPkgs: 0,
              totalWeight: 0
            };
          }

          // Har shipping detail ko ek order consider karein
          summary[commodityKey].totalOrders += 1;

          // Assign total box calculate karein (containerDetails se)
          let assignBoxes = 0;
          detail.containerDetails?.forEach(container => {
            assignBoxes += Number(container.assign_total_box) || 0;
          });

          summary[commodityKey].totalPkgs += assignBoxes;
          summary[commodityKey].totalWeight += detail.weight || 0;
        });
      });

      return summary;
    }, {});

    // Array mein convert karein aur totals calculate karein
    const commodityArray = Object.values(commoditySummary);

    // Grand totals calculate karein
    const grandTotal = commodityArray.reduce((total, item) => {
      total.totalOrders += item.totalOrders;
      total.totalPkgs += item.totalPkgs;
      total.totalWeight += item.totalWeight;
      return total;
    }, { totalOrders: 0, totalPkgs: 0, totalWeight: 0 });

    let manifestData = [];
    let serialNo = 1;

    allReceivers.forEach(order => {
      order.receivers.forEach(receiver => {
        receiver.shippingdetails?.forEach(detail => {
          // Container number nikalne ke liye
          let containerNo = '';
          if (detail.containerDetails && detail.containerDetails.length > 0) {
            containerNo = detail.containerDetails[0]?.container?.container_number ||
              order.receiver_containers_json ||
              order.container_number ||
              'N/A';
          } else {
            containerNo = order.receiver_containers_json ||
              order.container_number ||
              'N/A';
          }

          // Marks & Nos (itemRef se)
          const marksNos = detail.itemRef || 'N/A';

          // PKGS (assign_total_box se)
          let pkgs = 0;
          detail.containerDetails?.forEach(container => {
            pkgs += Number(container.assign_total_box) || 0;
          });

          // Agar assign_total_box nahi hai to totalNumber use karo
          if (pkgs === 0) {
            pkgs = detail.totalNumber || 0;
          }

          // Commodity
          const commodity = detail.category || 'Unknown';
          const subcategory = detail.subcategory ? ` - ${detail.subcategory}` : '';
          const fullCommodity = `${commodity}${subcategory}`;

          manifestData.push({
            sno: serialNo++,
            orderNo: order.booking_ref || order.rgl_booking_number || 'N/A',
            containerNo: containerNo,
            sender: order.sender_name || 'N/A',
            receiver: receiver.receiver_name || 'N/A',
            marksNos: marksNos,
            pkgs: pkgs,
            weight: detail.weight || 0,
            commodity: fullCommodity
          });
        });
      });
    });

    // Totals calculate karein
    const manifestTotals = manifestData.reduce((total, item) => {
      total.totalPkgs += item.pkgs;
      total.totalWeight += item.weight;
      return total;
    }, { totalPkgs: 0, totalWeight: 0 });

    // Create the content for the PDF with enhanced, user-friendly styling
    tempElement.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      body { 
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; 
        margin: 0; padding: 0; 
        color: #2c3e50; background: white; 
        line-height: 1.4; 
        font-size: 11px; 
      }
      .header { 
        padding: 4mm 4mm; 
        display: flex; 
        justify-content: space-between; 
        align-items: start; 
      }
      .header-logo { width: 185px; opacity: 0.95;   image-rendering: optimizeQuality;-webkit-image-rendering: optimizeQuality; } 
      .header-left { display: flex; gap: 0mm; flex-direction: column; line-height: 0;}
      .header-consignment { font-size: 14px; font-weight: bold; margin: 0; }
      .header-right { text-align: right; flex-shrink: 0; }
      .header h1 { margin: 0 0 2mm 0; font-size: 20px; font-weight: 600; }
      .header p { margin: 0.5mm 0; font-size: 10px; opacity: 0.9; }
      .summary-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(85mm, 1fr)); 
        gap: 4mm; 
        margin-bottom: 8mm; 
      }
      .card { 
        background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%); 
        border: 1px solid #e9ecef; 
        border-radius: 8px; 
        padding: 6mm; 
        display: flex; 
        flex-direction: column; 
        justify-content: space-between; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.08); 
        transition: transform 0.2s ease; /* Subtle hover for interactivity */
      }
      .card:hover { transform: translateY(-1px); }
      .card-header { 
        background: linear-gradient(135deg, #0d6c6a 0%, #1abc9c 100%); 
        color: white; 
        padding: 2mm 3mm; 
        border-radius: 6px 6px 0 0; 
        font-size: 10px; 
        font-weight: 600; 
        text-align: center; 
      }
      .card-value { 
        font-size: 12px; 
        color: #2c3e50; 
        font-weight: 500; 
        text-align: center; 
        margin-top: 1mm; 
      }
      .section { 
        margin-bottom: 4mm; 
        background: #fff; 
        border-radius: 8px; 
        box-shadow: 0 2px 10px rgba(0,0,0,0.06); 
        page-break-inside: avoid; 
      }
      .section-header { 
        padding: 1mm 3mm; 
        font-size: 15px; 
        margin: 0; 
      }
      .section-content { padding: 6mm; background: #f8f9fa; }
      .details-grid { 
        display: flex; 
        flex-Direction:colums;
        gap: 6mm; 
        font-size: 10px; 
      }
      .details-grid dt { 
        font-weight: 600; 
        color: #0d6c6a; 
        margin-bottom: 2mm; 
        font-size: 11px; 
      }
      .details-grid dd { 
        margin: 0 0 4mm 0; 
        color: #34495e; 
        padding: 2mm; 
        background: white; 
        border-left: 3px solid #1abc9c; 
        border-radius: 0 4px 4px 0; 
      }
      .remarks-box { 
        background: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%); 
        border-radius: 8px; 
        padding: 6mm; 
        margin-bottom: 18mm; 
        font-style: italic; 
        color: #5a6c7d; 
        font-size: 10px; 
        border-left: 4px solid #f58220; 
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); 
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        font-size: 9px; 
        border: 1px solid #909090;
      }
      th { 
        text-align: center; 
        font-weight: normal;
      }
      td { 
        padding: 2mm; 
        border-bottom: 1px solid #e9ecef; 
        vertical-align: top; 
        text-align: center;
        font-weight: 600;
      }
      tr:nth-child(even) td { background: #f8f9fa; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #e3f2fd; }
      .orders-title { 
        background: linear-gradient(135deg, #f58220 0%, #e67e22 100%); 
        color: white; 
        padding: 3mm 6mm; 
        font-size: 14px; 
        font-weight: 600; 
        margin-bottom: 2mm; 
        border-radius: 6px 6px 0 0; 
      }
      .receiver-detail { 
        margin-bottom: 8mm; 
        padding: 6mm; 
        background: white; 
        border-radius: 8px; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.05); 
        border-left: 4px solid #1abc9c; 
      }
      .receiver-header { 
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); 
        color: white; 
        padding: 4mm; 
        border-radius: 6px 6px 0 0; 
        font-size: 13px; 
        font-weight: 600; 
        margin: -6mm -6mm 4mm -6mm; 
      }
      .shipping-item { 
        margin-bottom: 6mm; 
        padding: 4mm; 
        background: #f8f9fa; 
        border-radius: 6px; 
        border-left: 3px solid #f58220; 
      }
      .shipping-header { 
        font-size: 12px; 
        color: #e67e22; 
        margin-bottom: 3mm; 
        font-weight: 600; 
      }
      .container-subtable { 
        font-size: 8px; 
        margin-top: 3mm; 
      }
      .container-subtable th { 
        background: #3498db; 
        color: white; 
        padding: 2mm; 
      }
      .container-subtable td { 
        padding: 2mm; 
        border-bottom: 1px solid #bdc3c7; 
      }
      .footer { 
        margin-top: 12mm; 
        padding-top: 5mm; 
        border-top: 2px solid #0d6c6a; 
        color: #7f8c8d; 
        font-size: 10px; 
        text-align: center; 
        font-style: italic; 
      }
      .page-break { page-break-before: always; }
    </style>
    
    <div class="header">
      <div class="header-left">
        <img src="${logoBase64}" alt="Company Logo" class="header-logo" onerror="this.style.display='none';">
        <div>
            <h2>ROYAL GULF SHIPPING & LOGISTICS LLC</h2>
            <h5 style="color: gray;">Dubai • London • Karachi • Shenzhen</h5>
        </div>
        <h2>CONSOLIDATION MANIFEST – CONSIGNMENT LEVEL</h2>

      </div>
      <div class="header-right">
    <h1>Manifest Report</h1>
    <p class="header-consignment">Consignment ID: ${data.consignment_number || 'N/A'}</p>
    <p>POL: ${data.originName || 'N/A'}</p>
    <p>POD: ${data.destinationName || 'N/A'}</p>
    <p>ETD / ETA: ${data.eta}, ${data.etd}</p>
    <p>Vessel / Voyage: ${data.vessel}, ${data.voyage}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
    </div>

    
 <div class="section">
 <div class="section">
        <h2 class="section-header">PARTIES</h2>
        <div style="display: flex; flex-direction: column; margin-left: 10px;">
            <div style="display: flex;gap: 50px;">
                <h5>Shipper:</h5>
                <h5>${data.shipperName}</h5>
            </div>
            <div style="display: flex;gap: 37px;">
                <h5>Consignee:</h5>
                <h5>${data.consigneeName}</h5>
            </div>
        </div>
    </div>


<div class="section" >
    <h2 class="section-header">CONSIGNMENT SUMMARY</h2>
    <table>
        <thead>
            <tr style="border-bottom: 1px solid #909090;">
                <th style="border: 1px solid #ddd;">TOTAL CONTAINERS</th>
                <th style="border: 1px solid #ddd;">TOTAL ORDERS</th>
                <th style="border: 1px solid #ddd;">TOTAL PACKAGES</th>
                <th style="border: 1px solid #ddd;">TOTAL WEIGHT (KGS)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="border: 1px solid #ddd;">${data.containers?.length || 0}</td>
                <td style="border: 1px solid #ddd;">${selectedOrderObjects?.length || allReceivers?.length || 0}</td>
                <td style="border: 1px solid #ddd;">${Number(total_assign_boxes_all).toLocaleString()} Packages</td>
                <td style="border: 1px solid #ddd;">${Number(manifestTotals.totalWeight).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        </tbody>
    </table>
</div>


   ${data.containers && data.containers.length > 0 ? `
    <div class="section">
        <h2 class="section-header">COMMODITY SUMMARY (ALL CONTAINERS)</h2>
        <small>System clubs all orders with the same commodity and shows combined packages & weight.</small>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="border: 1px solid #ddd;">COMMODITY</th>
                    <th style="border: 1px solid #ddd;">TOTAL ORDERS</th>
                    <th style="border: 1px solid #ddd;">TOTAL PKGS</th>
                    <th style="border: 1px solid #ddd;">TOTAL WEIGHT (KGS)</th>
                </tr>
            </thead>
            <tbody>
                ${commodityArray.map(item => `
                <tr>
                    <td style="text-align:left; border: 1px solid #ddd;font-weight: normal;">${item.commodity}</td>
                    <td style="border: 1px solid #ddd;font-weight: normal;">${item.totalOrders}</td>
                    <td style="border: 1px solid #ddd;font-weight: normal;">${item.totalPkgs.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd;font-weight: normal;">
                        ${Number(item.totalWeight).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}
                </tr>
                `).join('')}

                <!-- Grand Total Row -->
                <tr style="background-color: #f5f5f5; font-weight: bold;">
                    <td style="text-align: left; padding: 12px; border: 1px solid #ddd;">TOTAL (All Commodities)</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${grandTotal.totalOrders}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${grandTotal.totalPkgs.toLocaleString()}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">
                        ${Number(grandTotal.totalWeight).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}</td>
                </tr>
            </tbody>
        </table>
    </div>` : ''}

  <div class="section" style="page-break-before: always;">
    <h2 class="section-header">DETAILED MANIFEST – ALL CONTAINERS</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
      <thead>
        <tr>
          <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 5%;">S.NO</th>
          <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 10%;">ORDER NO</th>
          <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 12%;">CONTAINER NO</th>
          <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 10%;">Tracking ID</th>
          <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 18%;">SENDER</th>
          <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 18%;">RECEIVER</th>
          <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 10%;">MARKS & NOS</th>
          <th style="text-align: right; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 7%;">PKGS</th>
          <th style="text-align: right; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 8%;">WEIGHT (KGS)</th>
          <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 12%;">COMMODITY</th>
        </tr>
      </thead>
      <tbody>
        ${manifestData.map(item => `
          <tr>
            <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.sno}</td>
            <td style="font-weight: normal; padding: 8px; border: 1px solid #ddd;">${item.orderNo}</td>
            <td style="font-weight: normal; padding: 8px; border: 1px solid #ddd;">${item.containerNo}</td>
            <td style="font-weight: normal; padding: 8px; border: 1px solid #ddd;">${item.marksNos}</td>
            <td style="font-weight: normal; padding: 8px; border: 1px solid #ddd;">${item.sender}</td>
            <td style="font-weight: normal; padding: 8px; border: 1px solid #ddd;">${item.receiver}</td>
            <td style="font-weight: normal; padding: 8px; border: 1px solid #ddd;">Marks and Nos</td>
            <td style="font-weight: normal; text-align: right; padding: 8px; border: 1px solid #ddd;">${item.pkgs.toLocaleString()}</td>
            <td style="font-weight: normal; text-align: right; padding: 8px; border: 1px solid #ddd;">${Number(item.weight).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="font-weight: normal;padding: 8px; border: 1px solid #ddd;">${item.commodity}</td>
          </tr>
        `).join('')}
        
        <!-- Total Row -->
        <tr style="background-color: #f5f5f5; font-weight: bold;">
          <td colspan="7" style="text-align: right; padding: 10px; border: 1px solid #ddd;">TOTAL:</td>
          <td style="text-align: right; padding: 10px; border: 1px solid #ddd;">${manifestTotals.totalPkgs.toLocaleString()}</td>
          <td style="text-align: right; padding: 10px; border: 1px solid #ddd;">${Number(manifestTotals.totalWeight).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 10px; border: 1px solid #ddd;"></td>
        </tr>
      </tbody>
    </table>
  </div>

    <div class="footer">
      <p><strong>Generated:</strong> ${new Date().toLocaleString()} | <strong>Page:</strong> 1 of ${Math.ceil(allReceivers?.length / 5 || 1)} </p>
      <p style="margin-top: 2mm; font-size: 9px; opacity: 0.7;">© 2025 Royal Gulf Shipping Management System | This manifest is computer-generated and legally binding.</p>
    </div>
</div>

  `;

    document.body.appendChild(tempElement);

    // Convert the element to canvas with higher quality and proper dimensions
    const scale = 1.5;
    const canvas = await html2canvas(tempElement, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: tempElement.scrollWidth,
      height: tempElement.scrollHeight,
      windowWidth: tempElement.scrollWidth,
      windowHeight: tempElement.scrollHeight,
      backgroundColor: '#ffffff',
      // Optimization settings
      imageTimeout: 0,
      removeContainer: true,
      onclone: function (clonedDoc) {
        clonedDoc.querySelectorAll('img').forEach(img => {
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
        });
      }
    });

    // Remove the temporary element
    document.body.removeChild(tempElement);

    // Save the canvas as an image file (PNG) - High quality
    const canvasDataURL = canvas.toDataURL('image/png', 0.85); // Full quality PNG
    const canvasLink = document.createElement('a');
    canvasLink.download = `Manifest_${data.consignment_number}_Canvas_${Date.now()}.png`;
    canvasLink.href = canvasDataURL;
    canvasLink.click(); // Trigger download

    // Create PDF from canvas with better quality and margins, with bottom space
    const innerWidthMm = 210 - 2 * 14; // 182mm
    const pxPerMm = canvas.width / innerWidthMm;
    const extraBottomSpaceMm = 8; // Approx 70px at 96dpi ~18.5mm, rounded to 20mm
    const contentHeightPerPageMm = (297 - 2 * 14) - extraBottomSpaceMm; // 269 - 20 = 249mm
    const contentHeightPerPagePx = contentHeightPerPageMm * pxPerMm;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const marginMm = 14;
    const contentWidthMm = innerWidthMm;

    let startY = 0;
    while (startY < canvas.height) {
      const sliceHeightPx = Math.min(contentHeightPerPagePx, canvas.height - startY);

      // Create cropped canvas for this page slice
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = canvas.width;
      croppedCanvas.height = sliceHeightPx;
      const ctx = croppedCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, startY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      // const croppedDataURL = croppedCanvas.toDataURL('image/png', 1.0);
      const croppedDataURL = croppedCanvas.toDataURL('image/jpeg', 0.85);
      const drawHeightMm = sliceHeightPx / pxPerMm;

      // Add to PDF (first page without addPage)
      if (startY > 0) {
        pdf.addPage();
      }
      pdf.addImage(croppedDataURL, 'JPEG', marginMm, marginMm, contentWidthMm, drawHeightMm, undefined, 'FAST');
      croppedCanvas.remove();

      startY += sliceHeightPx;
    }

    // Save the PDF
    pdf.save(`Manifest_${data.consignment_number}_Detailed_${Date.now()}.pdf`);
  };

const generateContainersAndOrdersPDFWithCanvas = async (data, allReceivers, selectedOrderObjects = includedOrders) => {
    console.log('data for canvas data', data)
    if (!data.consignment_number) {
      setSnackbar({
        open: true,
        severity: 'warning',
        message: 'Please enter a consignment number to generate the manifest.',
      });
      return;
    }

    // DEBUG: Check what data we have
    console.log('All Receivers:', allReceivers);
    console.log('Data Containers:', data.containers);

    // 1. GROUP ORDERS BY CONTAINER - CORRECT WAY
    const containerOrdersMap = {};

    // Pehle har container ke liye empty array bana lo
    if (data.containers && data.containers.length > 0) {
      data.containers.forEach(container => {
        containerOrdersMap[container.containerNo] = {
          container: container,
          orders: []
        };
      });
    } else {
      // Agar containers nahi hai to ek default bana lo
      containerOrdersMap['DEFAULT'] = {
        container: { containerNo: 'DEFAULT', size: 'N/A', type: 'N/A', seal_no: 'N/A' },
        orders: []
      };
    }

    // 2. CORRECT METHOD TO ASSIGN ORDERS TO CONTAINERS
    // Using shippingdetails.containerDetails[0].container.container_number
    if (allReceivers && allReceivers.length > 0) {
      console.log('Processing', allReceivers.length, 'orders');

      allReceivers.forEach(order => {
        let assignedContainerNo = null;

        // Method 1: Check shippingdetails.containerDetails
        if (order.receivers && order.receivers.length > 0) {
          order.receivers.forEach(receiver => {
            if (receiver.shippingdetails && receiver.shippingdetails.length > 0) {
              receiver.shippingdetails.forEach(shippingDetail => {
                if (shippingDetail.containerDetails && shippingDetail.containerDetails.length > 0) {
                  const containerDetail = shippingDetail.containerDetails[0];
                  if (containerDetail.container && containerDetail.container.container_number) {
                    assignedContainerNo = containerDetail.container.container_number;
                  }
                }
              });
            }
          });
        }

        // Method 2: Check receiver_containers_json field (backup)
        if (!assignedContainerNo && order.receiver_containers_json) {
          assignedContainerNo = order.receiver_containers_json;
        }

        // Method 3: Check containers array in receiver
        if (!assignedContainerNo && order.receivers && order.receivers.length > 0) {
          const receiver = order.receivers[0];
          if (receiver.containers && receiver.containers.length > 0) {
            assignedContainerNo = receiver.containers[0];
          }
        }

        // Assign order to container
        if (assignedContainerNo && containerOrdersMap[assignedContainerNo]) {
          containerOrdersMap[assignedContainerNo].orders.push(order);
          console.log(`Order ${order.id} assigned to container ${assignedContainerNo}`);
        } else {
          // If no container found, put in first container
          const firstKey = Object.keys(containerOrdersMap)[0];
          if (firstKey) {
            containerOrdersMap[firstKey].orders.push(order);
            console.log(`Order ${order.id} assigned to default container ${firstKey}`);
          }
        }
      });
    }

    // DEBUG: Check distribution
    console.log('Container Orders Distribution:');
    Object.keys(containerOrdersMap).forEach(key => {
      console.log(`Container ${key}: ${containerOrdersMap[key].orders.length} orders`);
      if (containerOrdersMap[key].orders.length > 0) {
        console.log('Order IDs:', containerOrdersMap[key].orders.map(o => o.id));
      }
    });

    // Helper functions
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // 3. FUNCTION TO CALCULATE STATISTICS FOR A SINGLE CONTAINER
    const calculateContainerStats = (orders) => {
      if (!orders || orders.length === 0) {
        return {
          totalOrders: 0,
          totalPackages: 0,
          totalWeight: 0,
          grossWeight: 0
        };
      }

      let totalOrders = 0;
      let totalPackages = 0;
      let totalWeight = 0;

      orders.forEach(order => {
        totalOrders++;

        if (order.receivers && order.receivers.length > 0) {
          order.receivers.forEach(receiver => {
            if (receiver.shippingdetails && receiver.shippingdetails.length > 0) {
              receiver.shippingdetails.forEach(item => {
                totalPackages += parseInt(item.totalNumber) || 0;
                totalWeight += parseFloat(item.weight) || 0;
              });
            }
          });
        }
      });

      // Gross weight distribution based on weight ratio
      const totalAllContainersWeight = Object.keys(containerOrdersMap).reduce((sum, key) => {
        const ordersInContainer = containerOrdersMap[key].orders;
        const containerWeight = ordersInContainer.reduce((wSum, order) => {
          let weight = 0;
          if (order.receivers && order.receivers.length > 0) {
            order.receivers.forEach(receiver => {
              if (receiver.shippingdetails && receiver.shippingdetails.length > 0) {
                receiver.shippingdetails.forEach(item => {
                  weight += parseFloat(item.weight) || 0;
                });
              }
            });
          }
          return wSum + weight;
        }, 0);
        return sum + containerWeight;
      }, 0);

      const grossWeightRatio = totalAllContainersWeight > 0 ? totalWeight / totalAllContainersWeight : 1;
      const grossWeight = data.gross_weight ? parseFloat(data.gross_weight) * grossWeightRatio : totalWeight;

      return {
        totalOrders: totalOrders,
        totalPackages: totalPackages,
        totalWeight: totalWeight,
        grossWeight: grossWeight
      };
    };

    // 4. FUNCTION TO CALCULATE COMMODITY SUMMARY FOR A SINGLE CONTAINER
    const calculateCommoditySummary = (orders) => {
      const commodityMap = {};

      if (orders && orders.length > 0) {
        orders.forEach(order => {
          if (order.receivers && order.receivers.length > 0) {
            order.receivers.forEach(receiver => {
              if (receiver.shippingdetails && receiver.shippingdetails.length > 0) {
                receiver.shippingdetails.forEach(item => {
                  const commodity = item.category || 'General';
                  if (!commodityMap[commodity]) {
                    commodityMap[commodity] = {
                      commodity: commodity,
                      totalOrders: new Set(),
                      totalPackages: 0,
                      totalWeight: 0
                    };
                  }

                  commodityMap[commodity].totalOrders.add(order.id);
                  commodityMap[commodity].totalPackages += parseInt(item.totalNumber) || 0;
                  commodityMap[commodity].totalWeight += parseFloat(item.weight) || 0;
                });
              }
            });
          }
        });
      }

      return Object.values(commodityMap).map(item => ({
        commodity: item.commodity,
        totalOrders: item.totalOrders.size,
        totalPackages: item.totalPackages,
        totalWeight: item.totalWeight
      }));
    };

    // 5. FUNCTION TO GET DETAILED MANIFEST FOR A SINGLE CONTAINER
    const getDetailedManifestData = (orders) => {
      const detailedData = [];
      let serialNumber = 1;

      if (orders && orders.length > 0) {
        orders.forEach(order => {
          if (order.receivers && order.receivers.length > 0) {
            order.receivers.forEach(receiver => {
              if (receiver.shippingdetails && receiver.shippingdetails.length > 0) {
                receiver.shippingdetails.forEach(item => {
                  detailedData.push({
                    sno: serialNumber++,
                    orderNumber: order.booking_ref || `ORD-${order.id}`,
                    sender: order.sender_name || 'N/A',
                    receiver: receiver.receiver_name || 'N/A',
                    marksNos: item.type || 'N/A',
                    packages: parseInt(item.totalNumber) || 0,
                    weight: parseFloat(item.weight) || 0,
                    commodity: item.category || 'N/A'
                  });
                });
              }
            });
          }
        });
      }

      return detailedData;
    };

    // Load logo as base64
    const logoBase64 = await loadImageAsBase64(logoPic);

    // Create a temporary div element
    const tempElement = document.createElement('div');
    tempElement.style.width = '210mm';
    tempElement.style.padding = '4mm';
    tempElement.style.backgroundColor = 'white';
    tempElement.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    tempElement.style.boxSizing = 'border-box';

    // 6. GENERATE HTML FOR EACH CONTAINER
    let allContainersHTML = '';
    let containerCounter = 0;

    // Loop through each container and generate its tables
    Object.keys(containerOrdersMap).forEach((containerNo) => {
      const containerData = containerOrdersMap[containerNo];
      const orders = containerData.orders;

      // Calculate data for this specific container
      const containerStats = calculateContainerStats(orders);
      const commoditySummary = calculateCommoditySummary(orders);
      const detailedData = getDetailedManifestData(orders);

      containerCounter++;

      // Add page break for containers after the first one
      const pageBreakClass = containerCounter > 1 ? 'page-break' : '';

      allContainersHTML += `
        <div class="${pageBreakClass}" style="margin-top: ${containerCounter > 1 ? '30px' : '0'}">
          <!-- Container Header -->
          <div class="container-title">
            CONTAINER ${containerCounter}: ${containerNo}
          </div>
          
          <!-- TABLE 1: Container Summary -->
          <div class="section-title">CONTAINER SUMMARY - ${containerNo}</div>
          ${orders.length > 0 ? `
          <table class="data-table">
            <thead>
              <tr>
                <th style="border-right: #7e7e7e 1px solid;">ORDERS IN CONTAINER</th>
                <th style="border-right: #7e7e7e 1px solid;">TOTAL PACKAGES</th>
                <th style="border-right: #7e7e7e 1px solid;">TOTAL WEIGHT (KGS)</th>
                <th>GROSS WEIGHT (APPROX.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border-right: #7e7e7e 1px solid;">${containerStats.totalOrders}</td>
                <td style="border-right: #7e7e7e 1px solid;">${containerStats.totalPackages}</td>
                <td style="border-right: #7e7e7e 1px solid;">${(containerStats.totalWeight).toFixed(2)}</td>
                <td>${(containerStats.grossWeight).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          ` : `
          <div style="text-align: center; padding: 30px; background: #f9f9f9; border: 1px dashed #ccc; margin-bottom: 20px;">
            <h4 style="color: #666; font-style: italic;">NO ORDERS FOUND IN THIS CONTAINER</h4>
            <p style="color: #999;">This container has no orders assigned to it.</p>
          </div>
          `}
          
          <!-- TABLE 2: Container Commodity Summary -->
          ${orders.length > 0 ? `
          <div class="section-title">CONTAINER COMMODITY SUMMARY - ${containerNo}</div>
          <div class="note">Commodity-wise breakdown for this container</div>
          ${commoditySummary.length > 0 ? `
          <table class="data-table">
            <thead>
              <tr>
                <th style="text-align:left; border-right: #7e7e7e 1px solid;">COMMODITY</th>
                <th style="border-right: #7e7e7e 1px solid;">TOTAL ORDERS</th>
                <th style="border-right: #7e7e7e 1px solid;">TOTAL PKGS</th>
                <th>TOTAL WEIGHT (KGS)</th>
              </tr>
            </thead>
            <tbody>
              ${commoditySummary.map(item => `
              <tr>
                <td style="text-align:left;border-right: #7e7e7e 1px solid;">${item.commodity}</td>
                <td style="border-right: #7e7e7e 1px solid;">${item.totalOrders}</td>
                <td style="border-right: #7e7e7e 1px solid;">${item.totalPackages}</td>
                <td>${(item.totalWeight).toFixed(2)}</td>
              </tr>
              `).join('')}
              <tr class="total-row">
                <td class="bold" style="text-align:left;border-right: #7e7e7e 1px solid;">TOTAL</td>
                <td class="bold" style="border-right: #7e7e7e 1px solid;">${commoditySummary.reduce((sum, item) => sum + item.totalOrders, 0)}</td>
                <td class="bold" style="border-right: #7e7e7e 1px solid;">${commoditySummary.reduce((sum, item) => sum + item.totalPackages, 0)}</td>
                <td class="bold">${(commoditySummary.reduce((sum, item) => sum + item.totalWeight, 0)).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          ` : '<p style="text-align: center; color: #666; font-style: italic;">No commodity data available</p>'}
          ` : ''}
          
          <!-- TABLE 3: Detailed Manifest -->
          ${orders.length > 0 ? `
          <div class="section-title">DETAILED MANIFEST - ${containerNo}</div>
          ${detailedData.length > 0 ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>ORDER NO</th>
                <th>SENDER</th>
                <th>RECEIVER</th>
                <th>MARKS & NOS</th>
                <th>PKGS</th>
                <th>WEIGHT (KGS)</th>
                <th>COMMODITY</th>
              </tr>
            </thead>
            <tbody>
              ${detailedData.map(item => `
              <tr>
                <td>${item.sno}</td>
                <td>${item.orderNumber}</td>
                <td>${item.sender}</td>
                <td>${item.receiver}</td>
                <td>${item.marksNos}</td>
                <td>${item.packages}</td>
                <td>${(item.weight).toFixed(2)}</td>
                <td>${item.commodity}</td>
              </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5" class="text-align:right; bold text-right">TOTAL:</td>
                <td class="bold">${detailedData.reduce((sum, item) => sum + item.packages, 0)}</td>
                <td class="bold">${(detailedData.reduce((sum, item) => sum + item.weight, 0)).toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          ` : '<p style="text-align: center; color: #666; font-style: italic;">No detailed manifest data available</p>'}
          ` : ''}
        </div>
      `;
    });

    // Create the complete HTML
    tempElement.innerHTML = `
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        margin: 0;
        padding: 0;
        color: #2c3e50;
        background: white;
        line-height: 1.4;
        font-size: 11px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        border-bottom: 2px solid #f58220;
        margin-bottom: 20px;
        padding-bottom: 15px;
      }

      .header-logo {
        width: 185px;
        opacity: 0.95;
      }

      .header-left {
        display: flex;
        flex-direction: column;
      }

      .header-consignment {
        font-size: 14px;
        font-weight: bold;
        margin: 0;
        color: #f58220;
      }

      .header-right {
        text-align: right;
        flex-shrink: 0;
      }

      .header h2 {
        margin: 0 0 2mm 0;
        font-size: 20px;
        font-weight: 600;
      }

      .header p {
        margin: 0.5mm 0;
        font-size: 10px;
        opacity: 0.9;
      }

      .section-title {
        font-size: 16px;
        font-weight: bold;
        color: #000000;
        margin: 25px 0 10px 0;
        padding-bottom: 5px;
        border-bottom: 2px solid #f58220;
        text-transform: uppercase;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 25px;
        font-size: 11px;
        border: 1px solid #7e7e7e;
      }

      .data-table th {
        color: #000000;
        font-weight: bold;
        text-align: center;
        padding: 10px 8px;
        border-bottom: 1px solid #7e7e7e;
        text-transform: uppercase;
        background-color: #f8f9fa;
      }

      .data-table td {
        padding: 8px;
        text-align: center;
        border-right: 1px solid #e0e0e0;
      }

      .data-table tr {
        border-bottom: 1px solid #e0e0e0;
      }

      .data-table tr:hover {
        background-color: #f5f5f5;
      }

      .data-table .total-row {
        font-weight: bold;
        background-color: #e8f5e8;
      }

      .container-title {
        font-size: 15px;
        font-weight: bold;
        color: #000000;
        margin: 30px 0 15px 0;
        background: #f5f5f5;
        padding: 12px;
        border-left: 4px solid #f58220;
        border-radius: 4px;
      }

      .page-break {
        page-break-before: always;
        padding-top: 20px;
      }

      .note {
        font-size: 10px;
        color: #666666;
        font-style: italic;
        margin: 5px 0 15px 0;
      }

      .footer {
        margin-top: 40px;
        padding-top: 20px;
        text-align: center;
        color: #000000;
        font-size: 11px;
        border-top: 2px solid #f58220;
      }

      .footer-line {
        margin: 5px 0;
      }

      .shipper-info {
        display: flex;
        flex-direction: column;
        margin: 20px 0;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 6px;
      }

      .shipper-row {
        display: flex;
        margin: 5px 0;
      }

      .shipper-label {
        font-weight: bold;
        min-width: 120px;
      }
    </style>

    <div class="header">
      <div class="header-left">
        <img src="${logoBase64}" alt="Company Logo" class="header-logo" onerror="this.style.display='none';">
        <div>
          <h2 style="margin: 5px 0;">ROYAL GULF SHIPPING & LOGISTICS LLC</h2>
          <h5 style="color: gray; margin: 3px 0;">Dubai • London • Karachi • Shenzhen</h5>
        </div>
        <h2 style="color: #f58220; margin-top: 10px;">CONSOLIDATION MANIFEST - CONTAINER LEVEL</h2>
      </div>
      <div class="header-right">
        <p class="header-consignment">Consignment: ${data.consignment_number || 'N/A'}</p>
        <p>Total Containers: ${data.containers ? data.containers.length : 0}</p>
        <p>POL: ${data.originName || 'N/A'}</p>
        <p>POD: ${data.destinationName || 'N/A'}</p>
        <p>ETD: ${data.etd || 'N/A'}</p>
        <p>ETA: ${formatDate(data.eta) || 'N/A'}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
      </div>
    </div>

    <div class="shipper-info">
      <div class="shipper-row">
        <div class="shipper-label">Shipper:</div>
        <div>${data.shipperName || 'N/A'}</div>
      </div>
      <div class="shipper-row">
        <div class="shipper-label">Consignee:</div>
        <div>${data.consigneeName || 'N/A'}</div>
      </div>
    </div>

    <!-- CONTAINER WISE REPORTS -->
    ${allContainersHTML || '<p style="text-align: center; color: red; font-weight: bold;">No container data available</p>'}

    <div class="footer">
      <div class="footer-line">Generated by Royal Gulf Shipping Management System</div>
      <div class="footer-line">Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}</div>
    </div>
    `;

    // Rest of the code remains same (canvas generation and PDF creation)
    document.body.appendChild(tempElement);

    const scale = 1.5;
    const canvas = await html2canvas(tempElement, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: tempElement.scrollWidth,
      height: tempElement.scrollHeight,
      windowWidth: tempElement.scrollWidth,
      windowHeight: tempElement.scrollHeight,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      removeContainer: true,
      onclone: function (clonedDoc) {
        clonedDoc.querySelectorAll('img').forEach(img => {
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
        });
      }
    });

    document.body.removeChild(tempElement);

    // Save as PNG
    const canvasDataURL = canvas.toDataURL('image/png', 0.85);
    const canvasLink = document.createElement('a');
    canvasLink.download = `Manifest_${data.consignment_number}_${Date.now()}.png`;
    canvasLink.href = canvasDataURL;
    canvasLink.click();

    // Create PDF
    const innerWidthMm = 210 - 2 * 14;
    const pxPerMm = canvas.width / innerWidthMm;
    const extraBottomSpaceMm = 8;
    const contentHeightPerPageMm = (297 - 2 * 14) - extraBottomSpaceMm;
    const contentHeightPerPagePx = contentHeightPerPageMm * pxPerMm;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const marginMm = 14;
    const contentWidthMm = innerWidthMm;

    let startY = 0;
    while (startY < canvas.height) {
      const sliceHeightPx = Math.min(contentHeightPerPagePx, canvas.height - startY);

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = canvas.width;
      croppedCanvas.height = sliceHeightPx;
      const ctx = croppedCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, startY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      const croppedDataURL = croppedCanvas.toDataURL('image/png', 0.85);
      const drawHeightMm = sliceHeightPx / pxPerMm;

      if (startY > 0) {
        pdf.addPage();
      }
      pdf.addImage(croppedDataURL, 'PNG', marginMm, marginMm, contentWidthMm, drawHeightMm);
      croppedCanvas.remove();

      startY += sliceHeightPx;
    }

    pdf.save(`Manifest_${data.consignment_number}_Containers_${Date.now()}.pdf`);
  };
  
const generateDocx = () => {
    // Placeholder for Docx (requires 'docx' and 'file-saver')
    setSnackbar({ open: true, severity: 'info', message: 'Docx generation: Install docx and file-saver for full support.' });
  };


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Box sx={{ p: 3, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
        <Slide in timeout={1000}>
          <Card sx={{ boxShadow: 4, borderRadius: 3, overflow: 'hidden' }}>
              <form onSubmit={mode === 'edit' ? handleEditCon : handleCreate}>

            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#0d6c6a', fontWeight: 'bold', mb: 3 }}>
                {mode === 'add' ? 'Add' : 'Edit'} Consignment Details
              </Typography>
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
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}> 
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="consignment_number"
                            value={values.consignment_number}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            label="Consignment #"
                            startAdornment={<DescriptionIcon sx={{ mr: 1, color: '#f58220' }} />}
                            readOnly={mode === 'edit'} // Keep readOnly for consignment_number in edit mode
                            required
                            error={touched.consignment_number && Boolean(errors.consignment_number)}
                            helperText={
                              touched.consignment_number && errors.consignment_number
                                ? errors.consignment_number
                               : 'Enter unique consignment number'
                            }
                          />
                        </Box>
    <Box sx={{ flex: 1, minWidth: 350  }}>
      <CustomSelect
        name="status"
        value={values.status}
        onChange={handleStatusChange}  // Now client-side
        label="Status"
        options={options.statusOptions || []}
        // disabled={mode === 'edit'}
        error={touched.status && Boolean(errors.status)}
        helperText={touched.status && errors.status ? errors.status : ''}
        loading={etaLoading}  // Brief spinner (optional, since instant)
      />
      {mode === 'edit' && (
        <Button
          variant="outlined"
          size="small"
          onClick={advanceStatus}
          sx={{ borderColor: '#f58220', color: '#f58220', minHeight: '56px',marginTop:1 }}
        >
          Change
        </Button>
      )}
    </Box>
    <Box sx={{ flex: 1, minWidth: 250 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>

      <DatePicker
        label="ETA"
        value={eta || etaSuggestion ? dayjs(eta || etaSuggestion) : dayjs(values?.eta)}  // Ensure Day.js or null; handle invalid
        onChange={(value) => {
          if (value && value.isValid()) {  // Guard: Check isValid before format
            const formatted = value.format('YYYY-MM-DD');
            setEta(formatted);
            setValues(prev => ({ ...prev, eta: formatted }));  // Sync to form
          } else {
            setEta(null);
            // setValues(prev => ({ ...prev, eta: null }));  // Clear invalid
          }
        }}
        inputFormat="YYYY-MM-DD"
        slotProps={{ 
          textField: { 
            helperText: etaLoading 
              ? 'Calculating ETA...' 
              : etaSuggestion && eta !== etaSuggestion
                ? `Suggested: ${dayjs(etaSuggestion).isValid() ? dayjs(etaSuggestion).format('MMM DD, YYYY') : 'Invalid date'} based on status (edited)`
                : etaSuggestion 
                  ? `Suggested: ${dayjs(etaSuggestion).isValid() ? dayjs(etaSuggestion).format('MMM DD, YYYY') : 'Invalid date'} based on status`
                  : 'Enter ETA'
          } 
        }}
        disabled={['Delivered', 'Cancelled'].includes(values.status)}  // Disable for terminals
        name="eta"
      />
</LocalizationProvider>                        

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
                            helperText={
                              touched.eform && errors.eform
                                ? errors.eform
                               : ''
                            }
                            tooltip="Format: ABC-123456"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomDatePicker
                            name="eform_date"
                            tooltip='Select Date'
                            value={values.eform_date}
                            onChange={handleDateChange}
                            onBlur={() => handleDateBlur('eform_date')}
                            label="Eform Date"
                            required
                            error={touched.eform_date && Boolean(errors.eform_date)}
                            helperText={
                              touched.eform_date && errors.eform_date
                                ? errors.eform_date
                               : ''
                            }
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
                            options={options.shipperOptions || []}
                            required
                            error={touched.shipper && Boolean(errors.shipper)}
                            helperText={
                              touched.shipper && errors.shipper
                                ? errors.shipper
                               : ''
                            }
                            tooltip="Select shipper"
                          />
                          <CustomTextField
                            name="shipperAddress"
                            value={values.shipperAddress}
                            label="Shipper Address"
                            multiline
                            rows={4}
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
                            options={options.consigneeOptions || []}
                            required
                            error={touched.consignee && Boolean(errors.consignee)}
                            helperText={
                              touched.consignee && errors.consignee
                                ? errors.consignee
                               : ''
                            }
                            tooltip="Select consignee"
                          />
                          <CustomTextField
                            name="consigneeAddress"
                            value={values.consigneeAddress}
                            label="Consignee Address"
                            multiline
                            rows={4}
                            sx={{ mt: 2 }}
                          />
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
                      {/* Locations Row */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="origin"
                            value={values.origin}
                            onChange={handleLocationChange} // FIXED: Use custom handler for name population
                            onBlur={() => handleSelectBlur('origin')}
                            label="Origin"
                            options={options.originOptions || []}
                            required
                            error={touched.origin && Boolean(errors.origin)}
                            helperText={
                              touched.origin && errors.origin
                                ? errors.origin
                               : ''
                            }
                            tooltip="Select origin port"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="destination"
                            value={values.destination}
                            onChange={handleLocationChange} // FIXED: Use custom handler
                            onBlur={() => handleSelectBlur('destination')}
                            label="Destination"
                            options={options.destinationOptions || []}
                            required
                            error={touched.destination && Boolean(errors.destination)}
                            helperText={
                              touched.destination && errors.destination
                                ? errors.destination
                               : ''
                            }
                            tooltip="Select destination port"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                     <CustomTextField
  name="shippingLine"
  value={values.shippingLine || ''}  // Ensure controlled value (add fallback for undefined)
  onChange={handleChange}
  onBlur={handleBlur}              // Optional: recommended if using Formik for validation on blur
  label="Shipping Line"
  type="text"
  placeholder="e.g., Maersk, MSC, COSCO"  // Helpful placeholder
  fullWidth
  variant="outlined"               // Common props for Material-UI style fields
  // Remove the 'options' prop completely since it's now a free text input
/>
                        </Box>
                      </Box>
                      {/* Payment & Value Row */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <FormControl fullWidth error={!!errors.paymentType}>
                            <Select
                              // labelId="payment-type-label"
                              name="paymentType"
                              value={values.paymentType || ''} // Fix: Use '' instead of null/undefined
                              // Updated onChange for MUI Select using your custom state (setValues, touched, validateField)
                              onChange={(e) => {
                                const newValue = e.target.value || '';
                                console.log('Selected paymentType (enum):', newValue); // e.g., 'Collect'
                                setValues(prev => ({ ...prev, paymentType: newValue }));
                                // setValues(prev => ({ ...prev, paymentType: newValue })); // Use setValues instead of setFieldValue
                                if (touched.paymentType) {
                                  validateField('paymentType', newValue);
                                }
                                setTouched(prev => ({ ...prev, paymentType: true })); // Mark as touched
                              }}
                              displayEmpty // Shows placeholder when empty
                              // Optional: For searchable, wrap in Autocomplete if needed (see below)
                            >
                              <MenuItem value="" disabled>
                                <em>Select Payment Type</em>
                              </MenuItem>
                              {options.paymentTypeOptions?.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              )) || null}
                            </Select>
                            {errors.paymentType && <FormHelperText>{errors.paymentType}</FormHelperText>}
                            {!errors.paymentType && <FormHelperText sx={{ color: 'text.secondary' }}>(Required)</FormHelperText>}
                          </FormControl>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="consignment_value"
                            value={values.consignment_value}
                            onChange={handleNumberChange}
                            onBlur={handleBlur}
                            label="Consignment Value"
                            type="number"
                            required
                            startAdornment={<AttachFileIcon sx={{ mr: 1, color: '#f58220' }} />}
                            endAdornment={
                              <FormControl size="small" sx={{ minWidth: 60 }}>
                                <Select
                                  name="currency_code"
                                  value={(options.currencyOptions || []).length > 0 && (options.currencyOptions || []).some(opt => opt.value === values.currency_code) ? values.currency_code : ''}
                                  onChange={handleChange}
                                >
                                  {(options.currencyOptions || [])?.length > 0 ? (options.currencyOptions || []).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                  )) : <MenuItem value="">Select Currency</MenuItem>}
                                </Select>
                              </FormControl>
                            }
                            error={touched.consignment_value && Boolean(errors.consignment_value)}
                            helperText={
                              touched.consignment_value && errors.consignment_value
                                ? errors.consignment_value
                               : ''
                            }
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="bank"
                            value={values.bank}
                            onChange={handleBankChange} // FIXED: Use custom handler
                            onBlur={() => handleSelectBlur('bank')}
                            label="Bank"
                            options={options.bankOptions || []}
                            required
                            error={touched.bank && Boolean(errors.bank)}
                            helperText={
                              touched.bank && errors.bank
                                ? errors.bank
                               : ''
                            }
                            tooltip="Select associated bank"
                          />
                        </Box>
                      </Box>
                      {/* Shipping Row */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="vessel"
                            value={values.vessel ?? ''} // Use ?? to handle null as empty string for display
                            onChange={handleChange}
                            onBlur={() => handleSelectBlur('vessel')}
                            label="Vessel"
                            options={options.vesselOptions || []}
                            required
                            error={touched.vessel && Boolean(errors.vessel)}
                            helperText={
                              touched.vessel && errors.vessel
                                ? errors.vessel
                               : ''
                            }
                            tooltip="Select vessel"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                         
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
                            helperText={
                              touched.voyage && errors.voyage
                                ? errors.voyage
                               : ''
                            }
                            tooltip="Enter voyage number (min 3 chars)"
                          />
                        </Box>
                      </Box>
                      {/* Counts & Seal Row */}
                     {/* Counts & Seal Row - UPDATED WITH AUTO WEIGHTS */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="seal_no"
                            value={values.seal_no}
                            onChange={handleChange}
                            label="Seal No"
                            startAdornment={<LocalPrintshopIcon sx={{ mr: 1, color: '#f58220' }} />}
                          />
                        </Box>

                        {/* Net Weight - Auto & Disabled */}
                        <Box sx={{ flex: 1, minWidth: 300 }}>
                          <CustomTextField
                            name="netWeight"
                            value={values.netWeight || 0}
                            label="Net Weight"
                            type="number"
                            required
                            disabled
                            InputProps={{ readOnly: true }}
                            startAdornment={<LocalShippingIcon sx={{ mr: 1, color: '#f58220' }} />}
                            endAdornment={<Typography variant="body2" color="text.secondary">KGS</Typography>}
                            helperText="Auto-calculated from selected orders"
                            sx={{
                              '& .MuiInputBase-input.Mui-disabled': {
                                WebkitTextFillColor: '#000000',
                                color: '#000000',
                                fontWeight: 'bold',
                              },
                            }}
                          />
                        </Box>

                        {/* Gross Weight - Auto & Disabled */}
                        <Box sx={{ flex: 1, minWidth: 300 }}>
                          <CustomTextField
                            name="gross_weight"
                            value={values.gross_weight || 0}
                            label="Gross Weight"
                            type="number"
                            required
                            disabled
                            InputProps={{ readOnly: true }}
                            startAdornment={<LocalShippingIcon sx={{ mr: 1, color: '#f58220' }} />}
                            endAdornment={<Typography variant="body2" color="text.secondary">KGS</Typography>}
                            helperText="Net + 15% (packaging estimate)"
                            sx={{
                              '& .MuiInputBase-input.Mui-disabled': {
                                WebkitTextFillColor: '#000000',
                                color: '#000000',
                                fontWeight: 'bold',
                              },
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Optional: Show summary when orders selected */}
                      {selectedOrders.length > 0 && (
                        <Alert severity="info" icon={<InfoIcon />} sx={{ borderLeft: '4px solid #f58220' }}>
                          <AlertTitle>Weight Summary</AlertTitle>
                          Based on <strong>{selectedOrders.length}</strong> selected order(s): {' '}
                          <strong>{calculatedTotals.netWeight} KGS</strong> net →{' '}
                          <strong>{calculatedTotals.grossWeight} KGS</strong> gross (estimated)
                        </Alert>
                      )}
                    </Box>

                    {/* Print Buttons */}
                    <Fade in={true} timeout={800}>
                      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Tooltip title="Download PDF manifest with details, containers, and orders">
                          <Button
                            variant="outlined"
                            startIcon={<LocalPrintshopIcon />}
                            onClick={() => generateManifestPDFWithCanvas(values, includedOrders)}
                            disabled={saving || !values.consignment_number}
                            sx={{ borderColor: '#f58220', color: '#f58220', '&:hover': { borderColor: '#e65100', backgroundColor: '#fff3e0' } }}
                          >
                            {saving ? <CircularProgress size={20} /> : 'Print Manifest'}
                          </Button>
                        </Tooltip>
                      </Box>
                    </Fade>
                  </AccordionDetails>
                </Accordion>
                <Divider sx={{ my: 3 }} />
               
              {/* Containers Section */}
              <Accordion sx={{ boxShadow: 2, borderRadius: 2, mt: 3, '&:before': { display: 'none' } }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#0d6c6a', borderRadius: '50%', p: 0.5 }} />}
                  sx={{ backgroundColor: '#0d6c6a', color: 'white', borderRadius: 2 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🚚 Containers</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                    <Tooltip title="Download simple consignment note as PDF">
                          <Button
                            variant="outlined"
                            startIcon={<DescriptionIcon />}
                            onClick={() => generateContainersAndOrdersPDFWithCanvas(values, includedOrders)} // Fixed: Pass includedOrders
                            disabled={saving || !values.consignment_number}
                            sx={{ borderColor: '#f58220', color: '#f58220', mb: 2, float: "right", flexDirection: 'row', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', alignSelf: 'flex-end', '&:hover': { borderColor: '#e65100', backgroundColor: '#fff3e0' } }}
                          >
                            Containers & Orders PDF
                          </Button>
                        </Tooltip>
                  <Table sx={{ minWidth: '100%', boxShadow: 1, borderRadius: 1, mb: 2, overflow: 'hidden' }} aria-label="Containers table">
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
                      {(values.containers || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No containers added. Click "Add New" or "Select from List" to get started.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        (values.containers || []).map((container, index) => {
                          // Get error for this specific row
                          const rowErrors = getContainerError(index);
                          return (
                            <Fade in key={`${container.containerNo || 'new'}-${index}`} timeout={300 * index}>
                              <TableRow hover sx={{ transition: 'all 0.2s ease' }}>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    fullWidth
                                    value={container.containerNo || ''}
                                    onChange={(e) => {
                                      const newValue = e.target.value;
                                      updateArrayField('containers', index, 'containerNo', newValue);
                                      // Validate duplicate on change
                                      if (newValue && rowErrors.containerNo?.includes('already exists')) {
                                        setContainerError(`containers[${index}].containerNo`, rowErrors.containerNo);
                                      } else {
                                        setContainerError(`containers[${index}].containerNo`, '');
                                      }
                                    }}
                                    onBlur={() => {
                                      markArrayTouched('containers');
                                      // Re-validate on blur
                                      const updatedErrors = getContainerError(index);
                                      setContainerError(`containers[${index}].containerNo`, updatedErrors.containerNo || '');
                                    }}
                                    error={Boolean(rowErrors.containerNo)}
                                    helperText={rowErrors.containerNo }
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
                                    value={container.size || ''}
                                    onChange={(e) => updateArrayField('containers', index, 'size', e.target.value)}
                                    onBlur={() => markArrayTouched('containers')}
                                    error={Boolean(rowErrors.size)}
                                    helperText={rowErrors.size}
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
                                    value={container.ownership || ''}
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
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                  <div style={{ display: 'flex', gap: 8, mt: 2 }}>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => {
                        // Pre-validate before adding empty row (optional: prompt for containerNo first)
                        const newContainer = { containerNo: '', location: '', size: '', containerType: '', ownership: '', status: '' };
                        if ((values.containers || []).some(c => c.containerNo?.trim() === '')) {
                          // Prevent adding if empty row exists
                          alert('Complete or remove the empty container row first.');
                          return;
                        }
                        addContainer(newContainer); // Assuming addContainer pushes the new object
                      }}
                      variant="outlined"
                      sx={{ flex: 1, color: '#0d6c6a' }}
                    >
                      Add New
                    </Button>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => {
                        // For modal: Ensure no duplicates when selecting
                        setContainerModalOpen(true);
                      }}
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
                    <ContainerModule containers={containers || []}
                      selectedContainers={selectedContainers || []}
                      onToggle={handleContainerToggle} />
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setContainerModalOpen(false)}>Cancel</Button>
                  <Button onClick={addSelectedContainers} disabled={(selectedContainers || []).length === 0} variant="contained">
                    Add Selected ({(selectedContainers || []).length})
                  </Button>
                </DialogActions>
              </Dialog>
              <Accordion sx={{ mt: 2, boxShadow: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#f58220', borderRadius: '50%', p: 0.5 }} />}
                  sx={{ backgroundColor: '#f58220', color: 'white', borderRadius: 2 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🛒 Orders ({numSelected} selected)</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <TextField
                      label="Booking Ref"
                      value={filters.booking_ref || ''}
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
                        value={filters.status || ''}
                        label="Status"
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, status: e.target.value }));
                          setOrderPage(0);
                        }}
                      >
                        <MenuItem value="">All</MenuItem>
                        {(statuses || []).map(status => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <TableContainer sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
                    <Table stickyHeader aria-label="Orders table">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#0d6c6a' }}>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} padding="checkbox">
                            <Checkbox
                              indeterminate={numSelected > 0 && numSelected < (orders || []).length}
                              checked={(orders || []).length > 0 && numSelected === (orders || []).length}
                              onChange={handleSelectAllClick}
                            />
                          </TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="ref">Booking Ref</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="loading">POL</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="dest">POD</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="sender">Sender</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="receivers">Receiver</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="containers">Containers</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="productsdetail">Items Details</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="created">Created At</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="status">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allReceivers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                              <Typography variant="body2" color="text.secondary">No receivers found.</Typography>
                            </TableCell>
                          </TableRow>
                        ) :
                          allReceivers.map((receiver) => {
                            const order = receiver.order || {}; // Fixed: Ensure order exists
                            const isItemSelected = isSelected(order.id);
                            console.log('receiver', allReceivers);
                            // Products summary from this receiver's shippingdetails
                            const productsSummary = (receiver.shippingdetails || []).map(detail => ({
                              category: detail.category || 'Unknown',
                              subcategory: detail.subcategory || '',
                              type: detail.type || 'Package',
                              weight: parseFloat(detail.weight || 0),
                              total_number: parseInt(detail.totalNumber || 0),
                              itemRef: detail.itemRef || '',
                              shippingDetailStatus: detail.consignmentStatus || '',
                            }));
                            console.log('productsSummary', productsSummary);
                            const totalItems = productsSummary.reduce((sum, p) => sum + p.total_number, 0);
                            const totalWeight = productsSummary.reduce((sum, p) => sum + p.weight, 0);
                            const categoryList = [...new Set(productsSummary.map(p => p.category))].join(', ');
                            // Status from receiver
                            const status = receiver.status || order.status || 'Created';
                            // Containers from this receiver
                            const filteredContainers = (receiver.containers || []).filter(Boolean);
                            const containersList = filteredContainers.length > 0
                              ? filteredContainers.map(cont => ({ primary: cont.container_number || cont })) // Fixed: Access correct prop
                              : [];
                            const filteredReceivers = [receiver];
                            return (
                              <StyledTableRow key={receiver.id} selected={isItemSelected}>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={isItemSelected}
                                    onChange={handleOrderToggle(order.id)}
                                  />
                                </TableCell>
                                <TableCell>{order.booking_ref || ''}</TableCell>
                                <TableCell>{getPlaceName(order?.place_of_loading || '')}</TableCell>
                                <TableCell>{getPlaceName(order.final_destination || order.place_of_delivery || order.place_of_loading || '')}</TableCell>
                                <TableCell>{order.sender_name || ''}</TableCell>
                                <TableCell>
                                  <Tooltip
                                    title={<PrettyList items={parseSummaryToList(filteredReceivers)} title="Receiver Details" />}
                                    arrow
                                    placement="top"
                                    PopperProps={{
                                      sx: { '& .MuiTooltip-tooltip': { border: '1px solid #e0e0e0' } }
                                    }}
                                  >
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
                                      {receiver.receiver_name || '-'}
                                    </Typography>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  <Tooltip
                                    title={<PrettyList items={parseContainersToList(filteredContainers.map(c => c.container_number || c).join(', ') || '')} title="Containers" />}
                                    arrow
                                    placement="top"
                                  >
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
                                      {containersList.length > 0
                                        ? <>{containersList.length > 1 && <sup style={{ padding: 4, borderRadius: 50, float: 'left', background: '#00695c', color: '#fff' }}>({containersList.length})</sup>}
                                          <span style={{ padding: 0 }}>{containersList.map(c => c.primary || '').join(', ').substring(0, 25)}...</span></>
                                        : '-'
                                      }
                                    </Typography>
                                  </Tooltip>
                                </TableCell>
                                <StyledTableCell>
                                  <Tooltip
                                    title={
                                      <Box sx={{ minWidth: 250 }}>
                                        <Typography variant="subtitle2" gutterBottom>Product Details</Typography>
                                        {productsSummary.length > 0 ? (
                                          productsSummary.map((product, idx) => (
                                            <Box key={idx} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                              <Typography variant="body2"><strong>Category:</strong> {product.category}</Typography>
                                              <Typography variant="body2"><strong>Subcategory:</strong> {product.subcategory || '-'}</Typography>
                                              <Typography variant="body2"><strong>Item Type:</strong> {product.type}</Typography>
                                              <Typography variant="body2"><strong>Weight:</strong> {product.weight} kg</Typography>
                                              <Typography variant="body2"><strong>Total Number:</strong> {product.total_number}</Typography>
                                              {product.itemRef && <Typography variant="body2"><strong>Item Ref:</strong> {product.itemRef}</Typography>}
                                            </Box>
                                          ))
                                        ) : (
                                          <Typography variant="body2">-</Typography>
                                        )}
                                        {productsSummary.length > 0 && (
                                          <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                                            <Typography variant="body2"><strong>Total Weight:</strong> {totalWeight.toFixed(1)} kg</Typography>
                                            <Typography variant="body2"><strong>Total Items:</strong> {totalItems}</Typography>
                                          </Box>
                                        )}
                                      </Box>
                                    }
                                    arrow
                                    placement="top"
                                  >
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
                                      {productsSummary.length > 0 ? (
                                        <>
                                          {productsSummary.length > 1 && <sup style={{ padding: 2, borderRadius: 50, float: 'left', background: '#00695c', color: '#fff', fontSize: '0.75rem' }}>({productsSummary.length})</sup>}
                                          <span style={{ paddingLeft: productsSummary.length > 1 ? 20 : 0 }}>
                                            Cat: {categoryList.substring(0, 10)}... | Wt: {totalWeight.toFixed(0)}kg | Items: {totalItems}
                                          </span>
                                        </>
                                      ) : '-'}
                                    </Typography>
                                  </Tooltip>
                                </StyledTableCell>
                                <TableCell>{new Date(order.created_at || Date.now()).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <StatusChip status={order.status} />
                                </TableCell>
                              </StyledTableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={orderTotal || 0}
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
                    {saving ? 'Saving...' : (mode === 'edit' ? 'Update Consignment' : 'Add Consignment')}
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          </CardContent>
              </form>

        </Card>
      </Slide>
    </Box>
  </LocalizationProvider>
);
};
export default ConsignmentPage


                  
