import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, FormControl, Select, MenuItem, TextField, InputLabel,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Divider, Tooltip as TooltipMui, FormHelperText, Slide, Fade, Accordion, AccordionSummary, AccordionDetails, Alert, Snackbar, Alert as SnackbarAlert
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
import ExpandMoreIconMui from '@mui/icons-material/ExpandMore';
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import autoTable from 'jspdf-autotable';
import { applyPlugin } from 'jspdf-autotable';
import logoPic from "../../../public/logo-2.png"
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
          {options?.map((opt, index) => {
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

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState(null);
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
    eta: currentDate,
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
  const [eta, setEta] = useState(null); // Current ETA in form
  const [etaSuggestion, setEtaSuggestion] = useState(null);
  const [etaLoading, setEtaLoading] = useState(false);
  const [statusOffsets, setStatusOffsets] = useState({}); // { "Shipment In Transit": 4, ... 

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
    statusOptions: [],
    containerStatusOptions: []
  });

  // Add your other states here (containers, orders, etc.)
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
  const [filters, setFilters] = useState({ status: "", booking_ref: "" });
  const [containerErrors, setContainerErrors] = useState({});
  const setContainerError = (path, message) => {
    setContainerErrors(prev => ({ ...prev, [path]: message }));
  };

  const CONSIGNMENT_TO_ETA_STATUS = {
    'Drafts Cleared': 'Ready for Loading',              // → 12 days
    'Submitted On Vessel': 'Shipment Processing',       // → 7 days
    'Customs Cleared': 'Shipment Processing',           // → 7 days
    'Submitted': 'Shipment Processing',                 // → 7 days
    'Under Shipment Processing': 'Shipment Processing', // → 7 days
    'In Transit': 'Shipment In Transit',                // → 4 days
    'In Transit On Vessel': 'Shipment In Transit',      // → 4 days
    'Arrived at Facility': 'Arrived at Sort Facility',  // → 1 day
    'Ready for Delivery': 'Ready for Delivery',         // → 0 days
    'Arrived at Destination': 'Under Processing',       // → 2 days
    'Delivered': 'Shipment Delivered',                  // → 0 days
    'HOLD': 'Shipment Delivered',
    'HOLD for Delivery': 'Ready for Delivery',
    'Cancelled': 'Shipment Delivered',
  };



  // === Status Colors (Client-side only) ===
  const getStatusColor = (status) => {
    if (!status || typeof status !== 'string') return '#E0E0E0';

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

    return statusColors[status] || '#9E9E9E';
  };

  const getPlaceName = (placeId) => {
    if (!placeId) return '-';
    const place = options.destinationOptions.find(p => p.value === placeId.toString());
    return place ? place.label : placeId;
  };
  // === Updated ETA Suggestion Handler ===
  const handleStatusChange = (newStatusOrEvent) => {
    const newStatus = typeof newStatusOrEvent === 'string'
      ? newStatusOrEvent
      : newStatusOrEvent.target.value;

    setValues(prev => ({ ...prev, status: newStatus }));

    if (!statusOffsets || Object.keys(statusOffsets).length === 0) {
      console.warn('ETA offsets not loaded yet');
      return;
    }

    setEtaLoading(true);

    try {
      const receiverStatus = CONSIGNMENT_TO_ETA_STATUS[newStatus] || newStatus;
      const offsetDays = statusOffsets[receiverStatus] ?? 0;

      const today = dayjs(); // Today is January 08, 2026
      const suggestedEta = today.add(offsetDays, 'day').format('YYYY-MM-DD');

      setEtaSuggestion(suggestedEta);

      // Only auto-fill if ETA is empty or default
      if (!eta || !eta.trim()) {
        setEta(suggestedEta);
        setValues(prev => ({ ...prev, eta: suggestedEta }));
      }

      console.log(
        `Consignment Status: "${newStatus}" → Receiver Status: "${receiverStatus}" → +${offsetDays} days → Suggested ETA: ${suggestedEta}`
      );
    } catch (err) {
      console.warn('ETA suggestion failed:', err);
      setEtaSuggestion(null);
    } finally {
      setEtaLoading(false);
    }
  };

  // === Load All Options + ETA Config ===
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);

        const [
          thirdPartiesRes, originsRes, destinationsRes, banksRes, paymentTypesRes,
          vesselsRes, shippingLinesRes, currenciesRes, statusesRes, containerStatusesRes, etaConfigRes
        ] = await Promise.all([
          api.get('api/options/thirdParty/crud'),
          api.get('api/options/places/crud'),
          api.get('api/options/places/crud'),
          api.get('api/options/banks/crud'),
          api.get('api/options/payment-types/crud'),
          api.get('api/options/vessels/crud'),
          api.get('api/options/shipping-lines'),
          api.get('api/options/currencies'),
          api.get('api/consignments/statuses'),
          api.get('api/options/container-statuses'),
          api.get('api/options/eta-configs')
        ]);

        // Process options...
        const third_parties = thirdPartiesRes?.data?.third_parties || [];
        const banks = banksRes?.data?.banks || [];

        const mapOptions = (items, valueKey = 'id', labelKey = 'name') =>
          (items || []).map(item => ({
            value: (item[valueKey] || item.value)?.toString() || '',
            label: item[labelKey] || item.label || item[valueKey] || ''
          }));

        const filteredDestinations = (destinationsRes?.data?.places || []).filter(place => place.is_destination === true);
        const filteredOrigins = (destinationsRes?.data?.places || []).filter(place => place.is_destination === true || place.is_origin === true);

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
          originOptions: mapOptions(filteredOrigins, 'id', 'name'),
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

        // === Load ETA Offsets from DB ===
        const offsets = etaConfigRes?.data?.reduce((acc, row) => {
          acc[row.status] = row.days_offset;
          return acc;
        }, {}) || {};
        console.log('Loaded ETA offsets:', offsets);
        setStatusOffsets(offsets);

        // === Set Defaults for Add Mode ===
        if (mode === 'add') {
          const defaultStatus = (statusesRes?.data?.statusOptions || [])
            .find(opt => opt.value === 'Drafts Cleared')?.value
            || (statusesRes?.data?.statusOptions || [])[0]?.value
            || '';

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

          // Trigger ETA suggestion after status is set
          if (defaultStatus && Object.keys(offsets).length > 0) {
            setTimeout(() => handleStatusChange(defaultStatus), 100);
          }
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
        shippingLine: data?.shipping_line_name || '',
        netWeight: data?.net_weight || 0,
        gross_weight: data?.gross_weight || 0,
        consignment_value: data?.consignment_value || 0,
        currency_code: data?.currency_code || '',
        eform_date: data?.eform_date ? dayjs(data.eform_date) : '',
        eta: data?.eta ? dayjs(data.eta) : '',
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
      // eta: suggestedEta || currentDate,
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


  // Added deps if needed
  const isSelected = (id) => (selectedOrders || []).indexOf(id) !== -1;
  const handleOrderToggle = (orderId) => () => {
    // console.log('toggle order', orderId);
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

  const includedOrders = useMemo(() =>
    (selectedOrders || []).map(id => (orders || []).find(o => o.id === id)).filter(Boolean),
    [selectedOrders, orders]
  );

  const allReceivers = useMemo(() => orders.flatMap(order => order.receivers || []), [orders]);
  useEffect(() => {
    if (orders && orders.length > 0) {
      const allOrderIds = orders.map((order) => order.id);
      setSelectedOrders(allOrderIds);
    }
  }, [orders]);
  // ✨ YAHAN TAK ✨
  // In your component
  const calculatedTotals = useMemo(() => {
    let totalAssignedWeight = 0;

    // Option A: from original nested structure
    const ordersToSum = includedOrders.length > 0 ? includedOrders : orders;

    ordersToSum.forEach(order => {
      (order.receivers || []).forEach(receiver => {
        (receiver.shippingdetails || []).forEach(detail => {
          (detail.containerDetails || []).forEach(cd => {
            totalAssignedWeight += parseFloat(cd.assign_weight || 0);
          });
        });
      });
    });

    // Round to 3 decimals (common for tons), or 2 for kg
    const assignedWt = parseFloat(totalAssignedWeight.toFixed(3));

    return {
      totalAssignedWeight: assignedWt,
      netWeight: assignedWt,
      grossWeight: parseFloat((assignedWt * 1.15).toFixed(3)), // 15% packaging/pallet
    };
  }, [includedOrders, orders]);

  // Sync to form values
  useEffect(() => {
    setValues(prev => ({
      ...prev,
      netWeight: calculatedTotals.netWeight,
      gross_weight: calculatedTotals.grossWeight,
      // optional: also store the raw assigned weight if needed
      totalAssignedWeight: calculatedTotals.totalAssignedWeight,
    }));
  }, [calculatedTotals]);

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
  // const rowCount = (orders || []).length;
  const getStatusColors = (status) => {
    console.log('stautssssss', status)
    // Extend your existing getStatusColors function to handle new statuses
    const colorMap = {
      'Ready for Loading': { bg: '#f3e5f5', text: '#7b1fa2' },
      'Loaded Into Container': { bg: '#e0f2f1', text: '#00695c' },
      'Shipment Processing': { bg: '#fff3e0', text: '#ef6c00' },
      'In Transit': { bg: '#e1f5fe', text: '#0277bd' },
      'Under Processing': { bg: '#fff3e0', text: '#f57c00' },
      'Arrived at Sort Facility': { bg: '#f1f8e9', text: '#689f38' },
      'Ready for Delivery': { bg: '#fce4ec', text: '#c2185b' },
      'Shipment Delivered': { bg: '#e8f5e8', text: '#2e7d32' },
      'Loaded': { bg: '#e8f5e8', text: '#2e7d32' },
      // 'Shipment Processing': { bg: '#fff3e0', text: '#ef6c00' },
      'Shipment In Transit': { bg: '#e1f5fe', text: '#0277bd' },
      'Assigned to Job': { bg: '#fff3e0', text: '#f57c00' },
      // 'Arrived at Sort Facility': { bg: '#f1f8e9', text: '#689f38' },
      // 'Ready for Delivery': { bg: '#fce4ec', text: '#c2185b' },
      // 'Shipment Delivered': { bg: '#e8f5e8', text: '#2e7d32' },
      // Fallback for unknown
      default: { bg: '#f5f5f5', text: '#666' }
    };
    return colorMap[status] || colorMap.default;
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
  // Fetch orders + filtering + flattening logic
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = (orders || []).map((n) => n.id);
      setSelectedOrders(newSelecteds);
      return;
    }
    setSelectedOrders([]);
  };

  // ────────────────────────────────────────────────────────────────
  // Main fetch function
  useEffect(() => {
    // ────────────────────────────────────────────────────────────────
    // Helper: Check if a shipping detail uses at least one selected container
    const itemUsesSelectedContainers = (shippingDetail, selectedCidsSet) => {
      if (!shippingDetail?.containerDetails?.length) return false;

      return shippingDetail.containerDetails.some(detail => {
        const cid = detail?.container?.cid;
        return cid && selectedCidsSet.has(Number(cid));
      });
    };

    // Helper: Filter containerDetails array to keep only selected containers
    const filterContainerDetails = (containerDetails, selectedCidsSet) => {
      if (!Array.isArray(containerDetails)) return [];

      return containerDetails.filter(detail => {
        const cid = detail?.container?.cid;
        return cid && selectedCidsSet.has(Number(cid));
      });
    };

    // Client-side filter: keep only matching shipping details + filter their containers
    const filterOrdersByContainers = (orders, selectedContainerIds) => {
      if (!Array.isArray(orders)) {
        console.warn('filterOrdersByContainers: orders is not an array', orders);
        return [];
      }

      // No containers selected → return original orders
      if (!selectedContainerIds?.length) {
        return orders.map(order => ({
          ...order,
          receivers: (order.receivers || []).map(receiver => ({
            ...receiver,
            order, // optional: attach full order if needed downstream
          })),
        }));
      }

      // Normalize selected container IDs to numbers + use Set for fast lookup
      const selectedCidsSet = new Set(
        selectedContainerIds
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id))
      );

      if (selectedCidsSet.size === 0) {
        console.warn('No valid numeric container IDs for filtering');
        return [];
      }

      console.log('Filtering orders for container CIDs:', [...selectedCidsSet]);

      return orders.map(order => {
        const filteredReceivers = (order.receivers || [])
          .map(receiver => {
            const filteredShippingDetails = (receiver.shippingdetails || [])
              .filter(detail => itemUsesSelectedContainers(detail, selectedCidsSet))
              .map(detail => ({
                ...detail,
                // Also filter the containerDetails inside each kept shipping detail
                containerDetails: filterContainerDetails(detail.containerDetails, selectedCidsSet),
              }));

            // Skip this receiver if no matching shipping details remain
            if (filteredShippingDetails.length === 0) return null;

            return {
              ...receiver,
              shippingdetails: filteredShippingDetails,
              order, // optional attachment
            };
          })
          .filter(Boolean); // remove null receivers

        // Skip this order if no receivers remain after filtering
        if (filteredReceivers.length === 0) return null;

        return {
          ...order,
          receivers: filteredReceivers,
        };
      }).filter(Boolean); // remove null orders
    };


    // ────────────────────────────────────────────────────────────────
    // Main fetch function
    const fetchOrders = async () => {
      // Early exit if no containers selected
      if (!addedContainerIds?.length) {
        setOrders([]);
        setOrderTotal(0);
        setOrdersLoading(false);
        return;
      }

      setOrdersLoading(true);
      console.log("Fetching orders...",addedContainerIds);
      try {
        const params = {
          page: orderPage + 1,
          limit: orderRowsPerPage,
          container_id: addedContainerIds.join(','), // backend pre-filters orders
          ...(filters?.booking_ref && { booking_ref: filters.booking_ref }),
          ...(filters?.status && { status: filters.status }),
          includeContainer: true,
          includeReceivers: true,
          includeShippingDetails: true,
        };

        console.log('Fetching orders with params:', params);

        const response = await api.get('/api/orders/consignmentsOrders',  { params: { includeContainer: true }})
        console.log('Fetched orders response:', response.data);

        const fetchedOrders = response.data?.data || [];
        const fetchedTotal = response.data?.pagination?.total || 0;

        // Apply client-side filtering (keeps only matching details + containers)
        const filteredOrders = filterOrdersByContainers(fetchedOrders, addedContainerIds);

        console.log('After client-side container filtering:', filteredOrders);

        setOrders(filteredOrders);
        setOrderTotal(fetchedTotal);

        // Auto-select all visible rows
        if (filteredOrders.length > 0) {
          handleSelectAllClick({ target: { checked: true } });
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setSnackbar({
          open: true,
          message: 'Failed to fetch orders. Please try again.',
          severity: 'error',
        });
        setOrders([]);
        setOrderTotal(0);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [
    addedContainerIds,
    filters?.booking_ref,
    filters?.status,
    orderPage,
    orderRowsPerPage,
    api,
    // setSnackbar,
    // setOrders,
    // setOrderTotal,
    // setOrdersLoading,
  ]);

  // ────────────────────────────────────────────────────────────────
  // Flatten shipments: one row = one container assignment
  // Recalculate whenever orders change
  // ────────────────────────────────────────────────────────────────
  const flatShipments = React.useMemo(() => {
    return orders.flatMap((order) =>
      (order.receivers || []).flatMap((receiver) =>
        (receiver.shippingdetails || []).flatMap((detail) =>
          (detail.containerDetails || []).map((containerDetail) => (
              console.log('details',detail),
            {
          
            // Order level
            orderId: order.id,
            bookingRef: order.booking_ref || '-',
            formNo: order.rgl_booking_number || '-',
            pol: getPlaceName?.(order.place_of_loading) || '-',
            pod: getPlaceName?.(order.place_of_delivery) || '-',
            sender: order.sender_name || '-',
            // Receiver level
            receiverName: receiver.receivername || '-',
            // Shipping detail / product level
            category: detail.category || 'Unknown',
            subcategory: detail.subcategory || '',
            type: detail.type || 'Package',
            totalItems: Number(detail.totalNumber || detail.total_number || 0),
            weight: Number(detail.weight || 0),
            itemRef: detail.itemRef || '',
            remainingItems: Number(detail.remainingItems || 0),
            receiverStatus:receiver.status,
            // Single container
            containerNumber: containerDetail.container?.container_number?.trim() || '-',
            containerCid: containerDetail.container?.cid,
            containerStatus: containerDetail.status || '-',
            assignWeight: containerDetail.assign_weight || '-',
            assignBoxes: containerDetail.assign_total_box || '-',
          }))
        )
      )
    );
  }, [orders]);

  const PrettyList = ({ receivers, title }) => {
    console.log('receiversss', receivers)
    return (
      <Card
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: '#fafafa',
          width: 600,
          boxShadow: 'none',
          // '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Title */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f58220' }}>
              {title}
            </Typography>
            <Chip
              label={`(${receivers?.length || 0})`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20, '& .MuiChip-label': { px: 0.5 } }}
            />
          </Box>

          {/* Receivers List */}
          <Stack spacing={1} sx={{ maxHeight: 'auto', overflow: 'auto' }}>
            {receivers?.length > 0 ? (
              receivers.map((receiver, rIdx) => (
                <Card
                  key={rIdx}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    backgroundColor: '#fff',
                    boxShadow: 'none',
                    //   transition: 'all 0.2s ease',
                    //   '&:hover': { boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderColor: 'primary.light' },
                  }}
                >
                  {/* Receiver Info */}
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight="medium" noWrap>
                        {receiver.receiver_name || 'Unnamed Receiver'}
                      </Typography>

                    </Box>
                    <StatusChip status={receiver.status} size="small" />
                  </Stack>

                  <Divider sx={{ mt: 1 }} />

                  {/* Shipping Details */}
                  {receiver.shippingdetails?.length > 0 ? (
                    receiver.shippingdetails.map((item, sIdx) => (
                      <Box key={sIdx} sx={{ mt: 1, pl: 1 }}>
                        <Box sx={{ flexDirection: "column", }}>


                          <Typography variant="body2" fontWeight="bold">
                            {item.category || 'Unknown Category'} - {item.subcategory || 'Unknown Subcategory'} ({item.type || 'Unknown Type'})  Total: {item.totalNumber ?? 0}, Weight: {item.weight ?? 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Qty Total Assigned: {Math.max(0, parseInt(item.totalNumber || 0) - parseInt(item.remainingItems || 0)).toLocaleString()} /
                            Remaining Items: {parseInt(item.remainingItems || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        {/* Container Details */}
                        {item.containerDetails?.length > 0 ? (
                          <Stack direction="row" justifyContent={"space-between"} alignItems={"center"} display={'flex'} spacing={1} sx={{ justifyContent: 'space-between', flexWrap: 'wrap', }}>
                            {item.containerDetails.map((c, cIdx) => (
                              <div style={{ marginTop: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'center', flex: 1, display: 'flex' }}>
                                <Chip
                                  key={cIdx}
                                  label={`${c.container.container_number} - ${c.assign_total_box} boxes (${c.assign_weight} kg)`}
                                  size="large"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ marginBottom: 2 }}
                                  spacing={1}

                                />
                                <StatusChip status={c.status} size="small" />



                                {/* <Divider /> */}
                              </div>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            No containers assigned
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      No shipping details
                    </Typography>
                  )}

                  {/* Drop Off Details */}
                  {receiver.drop_off_details?.length > 0 && (
                    <Box sx={{ mt: 1, pl: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        Drop Off Details:
                      </Typography>
                      {receiver.drop_off_details.map((dod, dIdx) => (
                        <Typography variant="caption" color="text.secondary" key={dIdx} display="block">
                          {dod.drop_method} - {dod.dropoff_name} ({dod.drop_off_mobile}) on {dod.drop_date}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Card>
              ))
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, color: 'text.secondary' }}>
                <EmojiEventsIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  No receivers available
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Card>
    );
  };

  // Combine both receivers and container details into one tooltip content
  const CombinedTooltip = ({ order }) => {
    // You can merge both datasets or just pass receivers since shippingdetails contains containers
    return <PrettyList receivers={order.receivers} title="Receivers & Containers" />;
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
      status: container.status || container.derived_status || 'Available',
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
    eform: Yup.string()
      .matches(/^[A-Z]{3}-\d{6}$/, 'Invalid format (e.g., ABC-123456)')
      .required('Eform # is required'),
    eform_date: Yup.date().required('Eform Date is required'),
    bank: Yup.string().required('Bank is required'),
    paymentType: Yup.string().required('Payment Type is required'),
    voyage: Yup.string().min(3, 'Voyage must be at least 3 characters').required('Voyage is required'),
    consignment_value: Yup.number().min(0).required('Consignment Value is required'),
    vessel: Yup.string().required('Vessel is required'),
    netWeight: Yup.number().min(0).required('Net Weight is required'),
    gross_weight: Yup.number().min(0).required('Gross Weight is required'),

    // Updated: We now expect containers array from UI
    containers: Yup.array()
      .of(
        Yup.object({
          containerNo: Yup.string().required('Container No. is required'),
          // size: Yup.string().oneOf(['20ft', '40ft', 'Other']).required('Size is required'),
          // // optional fields depending on your backend
          // ownership: Yup.string().optional(),
          // status: Yup.string().optional(),
        })
      )
      .min(1, 'At least one container is required'),

    // Still keep orders (or order IDs) if backend requires them
    orders: Yup.array(),

    // Optional: if backend wants explicit assignment mapping
    assignments: Yup.array()
      .of(
        Yup.object({
          orderId: Yup.number().required(),
          shippingDetailId: Yup.number().required(),
          containerNo: Yup.string().required(),
        })
      )
      .optional(),
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
    console.log('yyye', newArray)
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
  }, []);

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


  // Helper: Validate form + prepare payload using flatShipments as source of truth



  const validateAndPrepare = async () => {
    try {
      // 1. Run Yup validation on the form values (core fields)
      await validationSchema.validate(values, { abortEarly: false });

      // 2. Use flatShipments as the real source for containers & orders
      if (!flatShipments?.length) {
        setSnackbar({
          open: true,
          message: 'No shipments/containers selected. Please select at least one container assignment.',
          severity: 'error',
        });
        return null;
      }

      // 3. Extract unique containers
      const uniqueContainers = Array.from(
        new Map(
          flatShipments.map(s => [
            s.containerNumber,
            {
              containerNo: s.containerNumber,
              // size: s.containerNumber.includes('40') ? '40ft' : '20ft', // improve this logic if you have real size data
              // cid: s.containerCid || null,
              // status: s.containerStatus || 'Assigned',
              // // Add more fields if needed (seal, type, ownership, etc.)
            },
          ])
        ).values()
      );

      if (uniqueContainers.length === 0) {
        setSnackbar({
          open: true,
          message: 'No valid containers found in selected shipments.',
          severity: 'error',
        });
        return null;
      }

      // 4. Extract unique order IDs
      const uniqueOrderIds = [...new Set(flatShipments.map(s => s.orderId))];

      if (uniqueOrderIds.length === 0) {
        setSnackbar({
          open: true,
          message: 'No orders associated with selected shipments.',
          severity: 'error',
        });
        return null;
      }

      // 5. Optional: Build explicit assignment mapping (very useful for backend)
      const assignments = flatShipments.map(s => ({
        orderId: s.orderId,
        receiverName: s.receivername || null,
        category: s.category || null,
        containerNo: s.containerNumber,
        assignedWeight: parseFloat(s.assignWeight || 0),
        assignedBoxes: parseInt(s.assignBoxes || 0) || null,
        remainingItems: parseInt(s.remainingItems || 0) || null,
        // Add more if needed (e.g. shippingDetailId if you have it)
      }));

      // 6. Build the final payload
      const submitData = {
        // Core consignment fields from form
        consignment_number: values.consignment_number?.trim() || null,
        consignment_value: parseFloat(values.consignment_value) || 0,
        net_weight: parseFloat(values.netWeight) || 0,
        gross_weight: parseFloat(values.gross_weight) || 0,
        payment_type: values.paymentType || null,
        status: values.status || 'Draft',
        remarks: values.remarks || null,

        shipper_id: parseInt(values.shipper, 10) || null,
        shipper: values.shipperName?.trim() || '',
        shipper_address: values.shipperAddress || null,

        consignee_id: parseInt(values.consignee, 10) || null,
        consignee: values.consigneeName?.trim() || '',
        consignee_address: values.consigneeAddress || null,

        origin: values.originName || values.origin || null,
        destination: values.destinationName || values.destination || null,

        eform: values.eform?.trim() || null,
        eform_date: values.eform_date ? dayjs(values.eform_date).format('YYYY-MM-DD') : null,

        bank_id: parseInt(values.bank, 10) || null,
        bank: values.bankName?.trim() || '',

        currency_code: values.currency_code || 'GBP',
        vessel: parseInt(values.vessel, 10) || null,
        voyage: values.voyage?.trim() || null,
        shipping_line: values.shippingLine?.trim() || null,

        eta: values.eta ? dayjs(values.eta).format('YYYY-MM-DD') : null,

        // ───────────────────────────────────────
        // NEW: Data from UI / flatShipments
        // ───────────────────────────────────────
        containers: uniqueContainers,
        orders: uniqueOrderIds,
        assignments: assignments,      // ← very useful if backend supports it
        total_assigned_weight: calculatedTotals.totalAssignedWeight || 0,
      };

      console.log('Prepared submitData:', JSON.stringify(submitData, null, 2));

      return submitData;

    } catch (err) {
      // Handle Yup validation errors
      if (err.name === 'ValidationError') {
        const fieldErrors = {};
        err.inner.forEach(e => {
          fieldErrors[e.path] = e.message;
        });
        setErrors(fieldErrors);
        console.log('error fieldsss', fieldErrors)
        setSnackbar({
          open: true,
          message: 'Please fix the highlighted fields.',
          severity: 'error',
        });
      } else {
        console.error('Validation/Preparation failed:', err);
        setSnackbar({
          open: true,
          message: 'Error preparing consignment data. Please check inputs.',
          severity: 'error',
        });
      }

      return null;
    }
  };

  const navigate = useNavigate();
  const handleCreate = async (e) => {
    if (e) e.preventDefault();

    setSaving(true);

    const submitData = await validateAndPrepare();

    if (!submitData) {
      setSaving(false);
      return;
    }

    try {
      const res = await api.post('/api/consignments', submitData);
      console.log('responsee', res)
      const { data: responseData, message } = res.data || {};

      setSnackbar({
        open: true,
        message: message || 'Consignment created successfully!',
        severity: 'success',
      });

      console.log('New Consignment ID:', responseData);

      // Reset or redirect
      navigate('/consignments');

    } catch (err) {
      console.error('[handleCreate] Error:', err);

      if (err.name === 'ValidationError') {
        // Yup validation errors
        const formattedErrors = {};
        err.inner.forEach(error => {
          formattedErrors[error.path] = error.message;
        });
        setErrors(formattedErrors);
        setSnackbar({
          open: true,
          message: 'Please fix the validation errors',
          severity: 'error',
        });
      } else if (err.response) {
        // Backend errors
        const backendMsg =
          err.response.data?.message ||
          err.response.data?.error ||
          'Failed to create consignment';
        setSnackbar({
          open: true,
          message: backendMsg,
          severity: 'error',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'An unexpected error occurred',
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
    return (
      <Chip
        label={status}
        size="small"
        sx={{
          height: 18,
          fontSize: '0.85rem',
          marginLeft: 2,
          padding: 2,
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

  const handleFilterText = (e) => {
    const { name, value } = e.target;
    console.log("Filter change:", name, value);

    setFilters((prev) => ({ ...prev, [name]: value }));

    // Very important: reset to first page on every filter change
    setPage(0);
  };

  // 3. Handler for status dropdown (also reset page)
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const generateConsignmentNotePDFWithCanvas = async (data, allReceivers, selectedOrderObjects = includedOrders) => {
    console.log('Consignment Data:', data);
    console.log('All Receivers:', allReceivers);

    if (!data.consignment_number) {
      setSnackbar({
        open: true,
        severity: 'warning',
        message: 'Please enter a consignment number to generate the manifest.',
      });
      return;
    }

    // ==============================================
    // CALCULATE TOTAL BOXES FROM ALL ORDERS
    // ==============================================
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

    // ==============================================
    // GET UNIQUE COMMODITIES (CATEGORIES) WITH ACCUMULATED DATA
    // ==============================================
    const uniqueCommoditiesMap = new Map();

    allReceivers.forEach(order => {
      order.receivers.forEach(receiver => {
        receiver.shippingdetails?.forEach(detail => {
          const category = detail.category || 'Unknown';
          const subcategory = detail.subcategory || '';
          const commodityKey = `${category}${subcategory ? ` - ${subcategory}` : ''}`;

          if (!uniqueCommoditiesMap.has(commodityKey)) {
            uniqueCommoditiesMap.set(commodityKey, {
              commodity: commodityKey,
              totalBoxes: 0,
              totalWeight: 0,
              orders: new Set() // To track unique order IDs
            });
          }

          const commodityData = uniqueCommoditiesMap.get(commodityKey);

          // Add boxes
          let assignBoxes = 0;
          detail.containerDetails?.forEach(container => {
            assignBoxes += Number(container.assign_total_box) || 0;
          });
          commodityData.totalBoxes += assignBoxes;

          // Add weight
          commodityData.totalWeight += detail.weight || 0;

          // Add order ID
          commodityData.orders.add(order.id);
        });
      });
    });

    // Convert Map to Array and calculate total orders per commodity
    const uniqueCommodities = Array.from(uniqueCommoditiesMap.values()).map(item => ({
      commodity: item.commodity,
      totalOrders: item.orders.size,
      totalPkgs: item.totalBoxes,
      totalWeight: item.totalWeight
    }));

    console.log('Unique Commodities:', uniqueCommodities);

    // ==============================================
    // PREPARE MANIFEST DATA WITH UNIQUE ENTRIES
    // ==============================================
    let manifestData = [];
    let serialNo = 1;
    const processedOrders = new Set(); // To avoid duplicate entries

    allReceivers.forEach(order => {
      // Check if order already processed
      if (processedOrders.has(order.id)) return;
      processedOrders.add(order.id);

      // Get booking ID from order - booking_ref se
      const bookingNumber = order.booking_ref || 'N/A';

      order.receivers.forEach(receiver => {
        receiver.shippingdetails?.forEach(detail => {
          // Get container number
          let containerNo = '';
          if (detail.containerDetails && detail.containerDetails.length > 0) {
            containerNo = detail.containerDetails[0]?.container?.container_number || 'N/A';
          } else if (order.receiver_containers_json) {
            containerNo = order.receiver_containers_json;
          } else {
            containerNo = 'N/A';
          }

          // Marks & Nos
          const marksNos = detail.itemRef || 'N/A';

          // Calculate packages
          let pkgs = 0;
          detail.containerDetails?.forEach(container => {
            pkgs += Number(container.assign_total_box) || 0;
          });

          if (pkgs === 0) {
            pkgs = detail.totalNumber || 0;
          }

          // Commodity
          const category = detail.category || 'Unknown';
          const subcategory = detail.subcategory || '';
          const commodity = subcategory ? `${category} - ${subcategory}` : category;

          manifestData.push({
            sno: serialNo++,
            bookingNo: bookingNumber, // booking_ref se aaya hua
            containerNo: containerNo,
            sender: order.sender_name || 'N/A',
            receiver: receiver.receiver_name || 'N/A',
            marksNos: marksNos,
            pkgs: pkgs,
            weight: detail.weight || 0,
            commodity: commodity
          });
        });
      });
    });

    // Calculate manifest totals
    const manifestTotals = manifestData.reduce((total, item) => {
      total.totalPkgs += item.pkgs;
      total.totalWeight += item.weight;
      return total;
    }, { totalPkgs: 0, totalWeight: 0 });

    console.log('Manifest Data:', manifestData);
    console.log('Manifest Totals:', manifestTotals);

    // ==============================================
    // VESSEL AND CONTAINER INFO
    // ==============================================
    const getVesselName = (vesselId) => {
      if (!vesselId) return 'N/A';
      const vesselOption = options.vesselOptions?.find(v => v.value === vesselId.toString());
      return vesselOption?.label || `Vessel ${vesselId}`;
    };

    const vesselName = getVesselName(data.vessel);

    // Get container info
    const containerNo = data.containers && data.containers.length > 0
      ? data.containers[0].containerNo
      : 'N/A';

    const containerSize = data.containers && data.containers.length > 0
      ? data.containers[0].size
      : 'N/A';

    const containerType = data.containers && data.containers.length > 0
      ? data.containers[0].containerType
      : 'N/A';

    console.log('Container Info:', { containerNo, containerSize, containerType });
    console.log('Booking IDs from orders:', allReceivers.map(order => order.booking_ref));

    // Load logo as base64
    const logoBase64 = await loadImageAsBase64(logoPic);

    // Create a temporary div element
    const tempElement = document.createElement('div');
    tempElement.style.width = '210mm';
    tempElement.style.padding = '4mm';
    tempElement.style.backgroundColor = 'white';
    tempElement.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    tempElement.style.boxSizing = 'border-box';

    // ==============================================
    // CREATE HTML CONTENT
    // ==============================================
    tempElement.innerHTML = `<style>
        body {
            font-family: Arial, sans-serif;
            font-size: 13px;
            color: #000;
            line-height: 1.4;
            padding: 20px;
        }

        .container {
            max-width: 850px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .date-row {
            text-align: right;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .title {
            font-weight: bold;
            text-decoration: underline;
            font-size: 16px;
        }

        /* Top Boxes */
        .top-boxes {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
        }

        .box {
            flex: 1;
            border: 1px solid #000;
        }

        .box-label {
            padding: 2px 5px;
            border-bottom: 1px solid #000;
            min-height: 35px;
        }

        .box-content {
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .highlighted {
            font-weight: bold;
        }

        /* Details Grid */
        .details-grid {
            display: grid;
            grid-template-columns: 1.2fr 1.2fr 1fr;
            gap: 15px 10px;
            margin-bottom: 40px;
        }

        .underline {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 80px;
        }

        /* Summary Section */
        .summary-bar {
            display: flex;
            align-items: center;
            gap: 30px;
            margin-bottom: 30px;
        }

        .summary-box {
            border: 1px solid #000;
            padding: 10px 40px;
            font-weight: bold;
        }

        .summary-text {
            font-weight: bold;
        }

        /* Certification */
        .certification-box {
            border: 1px solid #000;
            padding: 15px;
            margin-bottom: 100px;
            width: 90%;
        }

        /* Footer */
        .footer {
            display: flex;
            justify-content: space-between;
        }

        .sign-block {
            width: 300px;
        }

        .sign-line {
            border-top: 1px solid #000;
            margin-bottom: 5px;
        }

        .text-right {
            text-align: left;
        }
        
        /* New style for container info */
        .container-info {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <div class="date-row">DATED: ${new Date().toLocaleString()}</div>
            <div class="title">CONSIGNMENT NOTE: ${data.consignment_number}</div>
        </div>

        <div class="top-boxes">
            <div class="box">
                <div class="box-label">Custom CRN or Customs Machine number</div>
                <div class="box-content"></div>
            </div>
            <div class="box">
                <div class="box-label">
                    <div class="container-info">
                        <span>Container No:</span>
                    </div>
                </div>
                <div class="box-content highlighted">${containerNo} ${containerSize}${containerType}</div>
            </div>
            <div class="box">
                <div class="box-label">Seal No</div>
                <div class="box-content">${data.seal_no || 'N/A'}</div>
            </div>
        </div>

        <div class="details-grid">
            <div><strong>VESSEL:</strong> ${vesselName}</div>
            <div><strong>Voyage:</strong> ${data.voyage || 'N/A'}</div>
            <div><strong>SHIPPING LINE:</strong> ${data.shipping_line_name || 'N/A'}</div>

            <div><strong>Dest:</strong> ${data.destinationName || 'N/A'}</div>
            <div><strong>Shipper:</strong> ${data.shipperName || 'N/A'}</div>
            <div><strong>BOOKING NO:</strong> ${allReceivers.length > 0 ? allReceivers.map(order => order.booking_ref).filter(Boolean).join(', ') : 'N/A'}</div>

            <div><strong>Comm:</strong> ${uniqueCommodities.length > 0 ? uniqueCommodities.map(c => c.commodity).join(', ') : 'N/A'}</div>
            <div><strong>Origin:</strong> ${data.originName || 'N/A'}</div>
            <div>
                <strong>GROSS Wt:</strong> <span class="underline">${data.gross_weight || '0'} KGS</span><br>
                <strong>NET Wt:</strong> <span class="underline">${data.net_weight || '0'} KGS</span>
            </div>

            <div><strong>Status:</strong> ${data.status || 'N/A'}</div>
            <div><strong class="underline">TRUCK NO</strong> ${allReceivers.length > 0 ? allReceivers.map(order => order.plate_no).filter(Boolean).join(', ') : 'N/A'}</div>
            <div><strong>TOTAL CTNS:</strong> <span class="underline">${Number(total_assign_boxes_all).toLocaleString()}</span></div>
        </div>

        <div class="summary-bar">
            <div class="summary-box">${containerNo} ${containerSize}${containerType}</div>
            <div class="summary-text">
                PKGS: ${Number(total_assign_boxes_all).toLocaleString()} &nbsp; GROSS WT: ${data.gross_weight || '0'} KGS &nbsp; NET WT: ${data.net_weight || '0'} KGS
            </div>
        </div>

        <div class="certification-box">
            I / We hereby certify that goods mentioned in the accompanied packing list have been placed inside the
            container and the container has been sealed by me / us the particulars are true.
        </div>

        <div class="footer">
            <div class="sign-block">
                <div class="sign-line"></div>
                PICT/KICT/QICT Representative<br>Gate Clerk / Dmg Inspector
            </div>
            <div class="sign-block text-right">
                <div class="sign-line"></div>
                Name and Signature of Agent<br>Shipper / Consolidator with stamp
            </div>
        </div>
    </div>`;

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
    canvasLink.download = `Consignment_Note_${data.consignment_number}_Canvas_${Date.now()}.png`;
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

      const croppedDataURL = croppedCanvas.toDataURL('image/jpeg', 0.85);
      const drawHeightMm = sliceHeightPx / pxPerMm;

      if (startY > 0) {
        pdf.addPage();
      }
      pdf.addImage(croppedDataURL, 'JPEG', marginMm, marginMm, contentWidthMm, drawHeightMm, undefined, 'FAST');
      croppedCanvas.remove();

      startY += sliceHeightPx;
    }

    pdf.save(`Manifest_${data.consignment_number}_Detailed_${Date.now()}.pdf`);

    console.log('PDF generation completed successfully!');
    console.log('Final Summary:', {
      consignmentNumber: data.consignment_number,
      totalOrders: allReceivers.length,
      totalBoxes: total_assign_boxes_all,
      container: containerNo,
      vessel: vesselName,
      uniqueCommodities: uniqueCommodities.length,
      bookingNumbers: allReceivers.map(order => order.booking_ref)
    });
  };
const generateshipmentsAndOrdersPDFWithCanvas = async (data, allReceivers, selectedOrderObjects = includedOrders) => {
    console.log('data for canvas data', data);
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

    // 1. GROUP BY RECEIVER (NOT CONTAINER)
    const receiverGroups = [];

    // Sab receivers ko collect karo
    if (allReceivers && allReceivers.length > 0) {
      allReceivers.forEach(order => {
        if (order.receivers && order.receivers.length > 0) {
          order.receivers.forEach(receiver => {
            receiverGroups.push({
              orderId: order.id,
              orderNumber: order.booking_ref || `ORD-${order.id}`,
              sender: order.sender_name || 'N/A',
              receiver: receiver.receiver_name || 'N/A',
              receiverData: receiver,
              orderData: order,
              shippingDetails: receiver.shippingdetails || []
            });
          });
        }
      });
    }

    console.log(`Total Receivers/Drop-offs: ${receiverGroups.length}`);

    // Helper functions
    const formatDateForPDF = (dateStr) => {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).toUpperCase();
    };

    // Vessel name get karne ka function
    const getVesselName = (vesselId) => {
      if (!vesselId) return 'N/A';
      const vesselOption = options.vesselOptions?.find(v => v.value === vesselId.toString());
      return vesselOption?.label || `Vessel ${vesselId}`;
    };

    const vesselName = getVesselName(data.vessel);

    // Load logo as base64
    const logoBase64 = await loadImageAsBase64(logoPic);

    // Common data for all HBLs
    const commonData = {
      consignment_number: data.consignment_number || 'N/A',
      originName: data.originName || 'N/A',
      destinationName: data.destinationName || 'N/A',
      shipperName: data.shipperName || 'N/A',
      shipperAddress: data.shipperAddress || 'N/A',
      consigneeName: data.consigneeName || 'N/A',
      consigneeAddress: data.consigneeAddress || 'N/A',
      bankName: data.bankName || 'N/A',
      created_at: data.created_at || 'N/A',
      generated_date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).toUpperCase(),
      generated_time: new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      voyage: data.voyage || 'N/A'
    };

    // PDF create karo
    const pdf = new jsPDF('p', 'mm', 'a4');
    const marginMm = 14;
    const contentWidthMm = 210 - 2 * marginMm;

    // Har receiver ke liye alag page banao
    for (let i = 0; i < receiverGroups.length; i++) {
      const receiverGroup = receiverGroups[i];
      const receiver = receiverGroup.receiverData;
      const shippingDetails = receiverGroup.shippingDetails;

      // Calculate receiver-specific stats
      let receiverPackages = 0;
      let receiverWeight = 0;
      let itemRef = "";

      shippingDetails.forEach(item => {
        // Use assign_total_box and assign_weight instead of totalNumber and weight
        let packagesForItem = 0;
        let weightForItem = 0;

        if (item.containerDetails && item.containerDetails.length > 0) {
          item.containerDetails.forEach(containerDetail => {
            packagesForItem += Number(containerDetail.assign_total_box) || 0;
            weightForItem += Number(containerDetail.assign_weight) || 0;
          });
        } else {
          packagesForItem = parseInt(item.totalNumber) || 0;
          weightForItem = parseFloat(item.weight) || 0;
        }

        receiverPackages += packagesForItem;
        receiverWeight += weightForItem;

        if (item.itemRef && !itemRef.includes(item.itemRef)) {
          itemRef += (itemRef ? ", " : "") + item.itemRef;
        }
      });

      // Container info
      const containerInfo = data.containers && data.containers.length > 0
        ? data.containers[0]
        : { containerNo: 'N/A', seal_no: 'N/A' };

      // Create HTML for this receiver ONLY
      const tempElement = document.createElement('div');
      tempElement.style.width = '780px';
      tempElement.style.padding = '25px';
      tempElement.style.backgroundColor = 'white';
      tempElement.style.fontFamily = 'Arial, sans-serif';
      tempElement.style.boxSizing = 'border-box';
      tempElement.style.borderTop = '8px solid #f37021';
      tempElement.style.margin = '0 auto';
      tempElement.style.fontSize = '10px';
      tempElement.style.color = '#333';

      // Single receiver HTML
      tempElement.innerHTML = `
      <style>
      .terms {
  font-size: 10px;
  line-height: 1.4;
}

.terms ol {
  margin: 6px 0;
  padding-left: 0;
  list-style-position: inside; /* 🔥 MAIN FIX */
}

.terms li {
  margin-bottom: 4px;
}

.terms .footer {
  font-size: 7px;
  margin-top: 10px;
}

</style>
      <div style="width: 780px; margin: 0 auto; background: white;">
        <!-- HBL Design Header -->
        <div class="header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <div class="logo-area">
            <img src="${logoBase64 || ''}" alt="RoyalGulf Logo" style="width: 150px; height: auto;">
          </div>
          <div class="company-info" style="text-align: left; flex-grow: 1; margin-left: 20px;">
            <p class="company-name" style="color: #f37021; font-size: 16px; font-weight: bold; margin: 0;">ROYAL GULF SHIPPING & LOGISTICS LLC</p>
            <p class="locations" style="color: #008a45; font-weight: bold; margin: 2px 0;">DUBAI • LONDON • KARACHI • SHENZHEN</p>
            <p style="font-size: 8px;">Ph: +971-4-3331785 | www.royalgulfshipping.com</p>
          </div>
          <div class="title-area" style="text-align: right;">
            <p class="hbl-title" style="color: #f37021; font-size: 20px; font-weight: bold; margin: 0;">HOUSE BILL OF LADING</p>
            <p style="font-size: 8px;">Non-negotiable copy</p>
            <p style="font-size: 8px;">Consignment: ${commonData.consignment_number}</p>
          </div>
        </div>
        
        <!-- First Row - Basic Info -->
        <div class="grid-row" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 8px;">
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">HBL NO.</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">--</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">ORDER REFERENCE</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${receiverGroup.orderNumber}</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">Item REFERENCE</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${itemRef}</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">ISSUE DATE</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${new Date(commonData.created_at).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">PLACE OF ISSUE</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${commonData.originName}</span>
          </div>
          
        </div>
        
        <!-- Shipment Parties Section -->
        <div class="section-header" style="color: #008a45; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #008a45; margin-bottom: 5px; grid-column: span 4;">SHIPMENT PARTIES</div>
        
        <div class="parties-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 70px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">SHIPPER</span>
            <div class="placeholder" style="font-weight: bold; font-size: 9px;">${commonData.shipperName}</div>
            <div class="placeholder" style="font-size: 8px; color: #666;">${commonData.shipperAddress}</div>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 70px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">CONSIGNEE</span>
            <div class="placeholder" style="font-weight: bold; font-size: 9px;">${receiverGroup.receiver}</div>
            <div class="placeholder" style="font-size: 8px; color: #666;">${receiver.receiver_address || 'N/A'}</div>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 70px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">NOTIFY PARTY</span>
            <div class="placeholder" style="font-weight: bold; font-size: 9px;">SAME AS CONSIGNEE</div>
          </div>
        </div>
        
        <!-- Voyage & Routing Section -->
        <div class="section-header" style="color: #008a45; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #008a45; margin-bottom: 5px; grid-column: span 4;">VOYAGE & ROUTING DETAILS</div>
        
        <div class="grid-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">PORT OF LOADING (POL)</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${commonData.originName}</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">PORT OF DISCHARGE (POD)</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${commonData.destinationName}</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">FINAL DESTINATION</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${commonData.destinationName}</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">VESSEL NAME</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${vesselName}</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">VOYAGE / SAILING</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${commonData.voyage}</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">INCOTERMS</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">SEAFREIGHT</span>
          </div>
        </div>
        
        <!-- Container Info -->
        <div class="section-header" style="color: #008a45; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #008a45; margin-bottom: 5px; grid-column: span 4;">CONTAINER & PACKAGE INFO</div>
        
        <div class="grid-row" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px;">
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">CONTAINER NO.</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${containerInfo.containerNo} | ${containerInfo.size}ft</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">SEAL NO.</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${containerInfo.seal_no || 'N/A'}</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">TOTAL PACKAGES</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${receiverPackages}</span>
          </div>
          <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">TOTAL WEIGHT (KGS)</span>
            <span class="placeholder" style="font-weight: bold; font-size: 9px;">${receiverWeight.toFixed(2)}</span>
          </div>
        </div>
        
        <!-- Cargo Description Table -->
        <div class="section-header" style="color: #008a45; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #008a45; margin-bottom: 5px; grid-column: span 4;">CARGO DESCRIPTION</div>
        
        ${shippingDetails.length > 0 ? `
        <table class="cargo-table" style="width: 100%; border-collapse: collapse; margin-top: 5px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; background-color: #f9f9f9; padding: 4px; font-size: 8px; width: 20%;">MARKS & NUMBERS</th>
              <th style="border: 1px solid #ccc; background-color: #f9f9f9; padding: 4px; font-size: 8px; width: 40%;">DESCRIPTION OF GOODS</th>
              <th style="border: 1px solid #ccc; background-color: #f9f9f9; padding: 4px; font-size: 8px; width: 10%;">PKGS</th>
              <th style="border: 1px solid #ccc; background-color: #f9f9f9; padding: 4px; font-size: 8px; width: 15%;">WEIGHT (KGS)</th>
              <th style="border: 1px solid #ccc; background-color: #f9f9f9; padding: 4px; font-size: 8px; width: 15%;">VOLUME (CBM)</th>
            </tr>
          </thead>
          <tbody>
  ${shippingDetails.map((item, idx) => {
        // Calculate packages and weight from containerDetails
        let packagesForItem = 0;
        let weightForItem = 0;

        if (item.containerDetails && item.containerDetails.length > 0) {
          item.containerDetails.forEach(containerDetail => {
            packagesForItem += Number(containerDetail.assign_total_box) || 0;
            weightForItem += Number(containerDetail.assign_weight) || 0;
          });
        } else {
          packagesForItem = parseInt(item.totalNumber) || 0;
          weightForItem = parseFloat(item.weight) || 0;
        }

        const category = item.category || 'N/A';
        const subcategory = item.subcategory || '';
        const description = subcategory ? `${category} - ${subcategory}` : category;

        return `
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${item.type || 'N/A'}</td>
              <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${description}</td>
              <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${packagesForItem}</td>
              <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${weightForItem.toFixed(2)}</td>
              <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">0.00</td>
            </tr>
            `;
      }).join('')}
          <tr style="font-weight: bold; background-color: #e8f5e8;">
            <td colspan="2" style="border: 1px solid #ccc; padding: 8px 4px; text-align: right;">TOTAL:</td>
            <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${receiverPackages}</td>
            <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${receiverWeight.toFixed(2)}</td>
            <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">0.00</td>
          </tr>
        </tbody>
        </table>
        ` : `
        <div style="text-align: center; padding: 30px; background: #f9f9f9; border: 1px dashed #ccc; margin-bottom: 20px;">
          <h4 style="color: #666; font-style: italic;">NO CARGO DETAILS FOUND</h4>
          <p style="color: #999;">No shipping details available for this receiver.</p>
        </div>
        `}
        
        <!-- Terms and Footer -->
        <div class="bottom-section" style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px; margin-top: 10px; border-top: 1px solid #000; padding-top: 8px;">
          <div class="terms">
  <strong>
    By confirming this order for shipment, the Shipper/Consignee agrees to the following terms:
  </strong>

  <ol style="margin-left: 4px;">
    <li>Carriage is performed under Royal Gulf Shipping & Logistics LLC’s standard terms and applicable international conventions. All cargo details supplied must be true and complete.</li>

    <li>Transit times are estimates only. Delays may occur due to weather, customs, port congestion, operational issues or carrier schedules.</li>

    <li>Customs scanning, inspections, dog checks, or port delays may incur extra charges payable by the Merchant.</li>

    <li>In case of loss/damage, liability shall not exceed the freight value or USD 50 per package unless a higher value is declared and agreed in writing beforehand.</li>

    <li>The Merchant confirms lawful ownership of goods and accepts full responsibility for any illegal, prohibited or undeclared items shipped.</li>

    <li>Royal Gulf is not liable for any damage during customs/port inspections at origin, transit or destination.</li>

    <li>Cargo is carried at Merchant’s risk unless the Merchant arranges separate insurance. Royal Gulf is not liable for indirect or consequential losses.</li>

    <li>Claims must be notified immediately in writing and within legal time limits. Late claims may be void.</li>

    <li>Royal Gulf may use third-party carriers or subcontractors; all their protections and liability limits apply equally to Royal Gulf.</li>

    <li>This HBL applies only to order ref ${receiverGroup.orderNumber}.</li>

    <li>Governed by UAE law; disputes fall under Dubai courts unless agreed otherwise.</li>
  </ol>

  <p class="footer">
    Receiver: ${receiverGroup.receiver} |
    Order: ${receiverGroup.orderNumber} |
    Container: ${containerInfo.containerNo} |
    Page ${i + 1} of ${receiverGroups.length}
  </p>
</div>

          <div class="signature-box" style="border-left: 1px solid #ccc; padding-left: 10px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #000;">For and on behalf of</span>
            <p style="color: #f37021; font-weight: bold; margin: 0; font-size:12px;">Royal Gulf Shipping & Logistics LLC</p>
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #000;">Generated: ${commonData.generated_date} ${commonData.generated_time}</span>

            <div style="margin-top: 35px; border-top: 1px solid #000;">
              <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">Authorised Signature</span>
            </div>
          </div>
        </div>
      </div>
    `;

      // Add to DOM
      document.body.appendChild(tempElement);

      // Generate canvas for this receiver
      const canvas = await html2canvas(tempElement, {
        scale: 2.0,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: tempElement.scrollWidth,
        height: tempElement.scrollHeight,
        windowWidth: tempElement.scrollWidth,
        windowHeight: tempElement.scrollHeight,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        removeContainer: true
      });

      // Remove from DOM
      document.body.removeChild(tempElement);

      // Calculate dimensions
      const pxPerMm = canvas.width / contentWidthMm;
      const canvasHeightMm = canvas.height / pxPerMm;

      // Add new page for each receiver (except first)
      if (i > 0) {
        pdf.addPage();
      }

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png', 1);
      pdf.addImage(imgData, 'PNG', marginMm, marginMm, contentWidthMm, canvasHeightMm);
    }
    pdf.save(`HBL_${data.consignment_number}_${Date.now()}.pdf`);
  };

  const generateManifestPDFWithCanvas = async (data, allReceivers, selectedOrderObjects = includedOrders) => {
    console.log('data for canvas data', data)
    console.log('data for Receiver', allReceivers)
    console.log('All Data', includedOrders)


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
    let total_assign_weight_all = 0;

    allReceivers.forEach(order => {
      order.receivers.forEach(receiver => {
        const shippingDetails = receiver.shippingdetails || [];
        shippingDetails.forEach(detail => {
          const containerDetails = detail.containerDetails || [];
          containerDetails.forEach(container => {
            total_assign_boxes_all += Number(container.assign_total_box) || 0;
            total_assign_weight_all += Number(container.assign_weight) || 0;

          });
        });
      });
    });

    console.log(`Total Assign Boxes (All Orders): ${total_assign_boxes_all}`);
    console.log(`Total Assign Weight (All Orders): ${total_assign_weight_all}`);

    // Load logo as base64
    const logoBase64 = await loadImageAsBase64(logoPic);

    // Create a temporary div element to render content
    const tempElement = document.createElement('div');
    tempElement.style.width = '210mm';
    tempElement.style.padding = '4mm';
    tempElement.style.backgroundColor = 'white';
    tempElement.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    tempElement.style.boxSizing = 'border-box';

    // Commodity-wise data group karein with assign_total_box AND assign_weight
    const commoditySummary = allReceivers.reduce((summary, order) => {
      order.receivers.forEach(receiver => {
        receiver.shippingdetails?.forEach(detail => {
          const commodity = detail.category || 'Unknown';
          const subcategory = detail.subcategory || '';
          const commodityType = detail.type || '';

          // Commodity key without type for grouping
          const commodityKey = `${commodity}|${subcategory}`;
          const displayKey = subcategory ? `${commodity} - ${subcategory}` : commodity;

          if (!summary[commodityKey]) {
            summary[commodityKey] = {
              commodity: displayKey,
              commodityType: commodityType,
              totalOrders: new Set(), // Use Set for unique order IDs
              totalPkgs: 0,
              totalWeight: 0
            };
          }

          // Add order ID to Set (unique orders count)
          summary[commodityKey].totalOrders.add(order.id);

          // Calculate assign boxes and weight for THIS detail only
          let assignBoxesForThisDetail = 0;
          let assignWeightForThisDetail = 0;

          if (detail.containerDetails && detail.containerDetails.length > 0) {
            detail.containerDetails.forEach(container => {
              assignBoxesForThisDetail += Number(container.assign_total_box) || 0;
              assignWeightForThisDetail += Number(container.assign_weight) || 0;
            });
          }

          summary[commodityKey].totalPkgs += assignBoxesForThisDetail;
          summary[commodityKey].totalWeight += assignWeightForThisDetail;
        });
      });

      return summary;
    }, {});

    // Convert Set sizes to numbers
    Object.values(commoditySummary).forEach(item => {
      item.totalOrders = item.totalOrders.size;
    });

    const commodityArray = Object.values(commoditySummary);

    const grandTotal = commodityArray.reduce((total, item) => {
      total.totalOrders += item.totalOrders;
      total.totalPkgs += item.totalPkgs;
      total.totalWeight += item.totalWeight;
      return total;
    }, { totalOrders: 0, totalPkgs: 0, totalWeight: 0 });

    // Group data by container
    const containerGroups = {};
    let serialNo = 1;

    // Get containers from data response
    const containersData = data.containers || [];

    allReceivers.forEach(order => {
      order.receivers.forEach(receiver => {
        receiver.shippingdetails?.forEach(detail => {
          let containerNo = '';
          let containerSize = 'N/A';
          let containerType = 'N/A';

          if (detail.containerDetails && detail.containerDetails.length > 0) {
            containerNo = detail.containerDetails[0]?.container?.container_number ||
              order.receiver_containers_json ||
              order.container_number ||
              'N/A';

            // Get container size from container details
            containerSize = detail.containerDetails[0]?.container?.size ||
              detail.containerDetails[0]?.size ||
              'N/A';

            // Get container type from container details
            containerType = detail.containerDetails[0]?.container?.containerType ||
              detail.containerDetails[0]?.containerType ||
              'N/A';
          } else {
            containerNo = order.receiver_containers_json ||
              order.container_number ||
              'N/A';
          }

          // Try to get size and type from main data containers array
          if (containerNo !== 'N/A' && containersData.length > 0) {
            const matchedContainer = containersData.find(c => c.containerNo === containerNo);
            if (matchedContainer) {
              containerSize = matchedContainer.size || containerSize;
              containerType = matchedContainer.containerType || containerType;
            }
          }

          // Try to get size from order data if not found
          if (containerSize === 'N/A') {
            containerSize = order.container_size || 'N/A';
          }

          const trackingId = detail.itemRef || 'N/A';
          let pkgs = 0;
          let assignWeight = 0;

          detail.containerDetails?.forEach(container => {
            pkgs += Number(container.assign_total_box) || 0;
            assignWeight += Number(container.assign_weight) || 0;
          });

          if (pkgs === 0) {
            pkgs = detail.totalNumber || 0;
          }

          const commodity = detail.category || 'Unknown';
          const subcategory = detail.subcategory ? ` - ${detail.subcategory}` : '';
          const fullCommodity = `${commodity}${subcategory}`;

          if (!containerGroups[containerNo]) {
            containerGroups[containerNo] = {
              containerNumber: containerNo,
              containerSize: containerSize,
              containerType: containerType, // Added container type
              data: []
            };
          }

          containerGroups[containerNo].data.push({
            sno: serialNo++,
            orderNo: order.booking_ref || order.rgl_booking_number || 'N/A',
            containerNo: containerNo,
            sender: order.sender_name || 'N/A',
            receiver: receiver.receivername || 'N/A',
            trackingId: trackingId,
            pkgs: pkgs,
            weight: assignWeight,
            commodity: fullCommodity
          });
        });
      });
    });

    // Calculate totals for each container
    Object.keys(containerGroups).forEach(containerNo => {
      const containerData = containerGroups[containerNo].data;
      const containerTotal = containerData.reduce((total, item) => {
        total.totalPkgs += item.pkgs;
        total.totalWeight += item.weight;
        return total;
      }, { totalPkgs: 0, totalWeight: 0 });

      containerGroups[containerNo].containerTotal = containerTotal;
    });

    // Calculate overall manifest totals
    const manifestTotals = Object.values(containerGroups).reduce((total, container) => {
      total.totalPkgs += container.containerTotal.totalPkgs;
      total.totalWeight += container.containerTotal.totalWeight;
      return total;
    }, { totalPkgs: 0, totalWeight: 0 });

    // Vessel name get karne ka function
    const getVesselName = (vesselId) => {
      if (!vesselId) return 'N/A';
      const vesselOption = options.vesselOptions?.find(v => v.value === vesselId.toString());
      return vesselOption?.label || `Vessel ${vesselId}`;
    };

    const vesselName = getVesselName(data.vessel);

    // Create the content for the PDF with original styling
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
        <h2>CONSOLIDATION MANIFEST - CONSIGNMENT LEVEL</h2>

      </div>
      <div class="header-right">
    <h1>Manifest Report</h1>
    <p class="header-consignment">Consignment ID: ${data.consignment_number || 'N/A'}</p>
    <p>POL: ${data.originName || 'N/A'}</p>
    <p>POD: ${data.destinationName || 'N/A'}</p>
    <p>ETD: ${data.eta}</p>
    <p>Vessel / Voyage: ${vesselName}, ${data.voyage}</p>
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
                <td style="border: 1px solid #ddd;">${Number(total_assign_weight_all).toFixed(2)}</td>
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
                    <td style="text-align:left; border: 1px solid #ddd;font-weight: normal;">${item.commodity} (${item.commodityType})</td>
                    <td style="border: 1px solid #ddd;font-weight: normal;">${item.totalOrders}</td>
                    <td style="border: 1px solid #ddd;font-weight: normal;">${item.totalPkgs.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd;font-weight: normal;">${Number(item.totalWeight).toFixed(2)}</td>
                `).join('')}

                <!-- Grand Total Row -->
                <tr style="background-color: #f5f5f5; font-weight: bold;">
                    <td style="text-align: left; padding: 12px; border: 1px solid #ddd;">TOTAL (All Commodities)</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${grandTotal.totalOrders}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${grandTotal.totalPkgs.toLocaleString()}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">
                        ${grandTotal.totalWeight}</td>
                </tr>
            </tbody>
        </table>
    </div>` : ''}

    <div class="section" style="page-break-before: always;">
        <h2 class="section-header">DETAILED MANIFEST - CONTAINER WISE</h2>
        
        ${Object.values(containerGroups).map((container, containerIndex) => `
            <div style="margin-bottom: 6mm;">
                <div class="container-header">
                    <h2><span>Container: ${container.containerNumber}</span>
                    <span>Size: ${container.containerSize}${container.containerType}</span></h2>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 5%;">S.NO</th>
                            <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 10%;">ORDER NO</th>
                            <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 10%;">Tracking ID</th>
                            <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 18%;">SENDER</th>
                            <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 18%;">RECEIVER</th>
                            <th style="text-align: right; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 7%;"; text-align: right;">PKGS</th>
                            <th style="text-align: right; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 8%;"; text-align: right;">WEIGHT (KGS)</th>
                            <th style="text-align: center; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 12%;">COMMODITY</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${container.data.map(item => `
                            <tr>
                                <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.sno}</td>
                                <td style="font-weight: normal; padding: 8px; border: 1px solid #ddd;">${item.orderNo}</td>
                                <td style="font-weight: normal; padding: 8px; border: 1px solid #ddd;">${item.trackingId}</td>
                                <td style="font-weight: normal; padding: 8px; border: 1px solid #ddd;">${item.sender}</td>
                                <td style="font-weight: normal; padding: 8px; border: 1px solid #ddd;">${item.receiver}</td>
                                <td style="font-weight: normal; text-align: right; padding: 8px; border: 1px solid #ddd;">${item.pkgs.toLocaleString()}</td>
                                <td style="font-weight: normal; text-align: right; padding: 8px; border: 1px solid #ddd;">${Number(item.weight).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}</td>
                                <td style="font-weight: normal;padding: 8px; border: 1px solid #ddd;">${item.commodity}</td>
                            </tr>
                        `).join('')}
                        <tr style="background-color: #f5f5f5; font-weight: bold;">
                            <td colspan="5" style="text-align: right; padding: 10px; border: 1px solid #ddd;">Container Total:</td>
                            <td style="text-align: right; padding: 10px; border: 1px solid #ddd;">${container.containerTotal.totalPkgs.toLocaleString()}</td>
                            <td style="text-align: right; padding: 10px; border: 1px solid #ddd;">${Number(container.containerTotal.totalWeight).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `).join('')}
        
        <!-- Grand Total Row -->
        <table style="margin-top: 4mm;">
            <tbody>
                <tr class="grand-total">
                    <td colspan="5" style="text-align: right; padding: 8px; font-size: 10px;">GRAND TOTAL (All Containers):</td>
                    <td style="text-align: right; padding: 8px; font-size: 10px;">${manifestTotals.totalPkgs.toLocaleString()}</td>
                    <td style="text-align: right; padding: 8px; font-size: 10px;">${Number(manifestTotals.totalWeight).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}</td>
                    <td style="padding: 8px;"></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p><strong>Generated:</strong> ${new Date().toLocaleString()} | <strong>Total Containers:</strong> ${Object.keys(containerGroups).length}</p>
        <p style="margin-top: 2mm; font-size: 9px; opacity: 0.7;">© ${new Date().getFullYear()} Royal Gulf Shipping Management System | This manifest is computer-generated and legally binding.</p>
    </div>
</div>`;

    document.body.appendChild(tempElement);

    // Improved PDF generation with better page break handling
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
        // Add page break logic for better PDF rendering
        const tables = clonedDoc.querySelectorAll('table');
        tables.forEach((table, index) => {
          if (index > 0) {
            // Add page break before each container table except first
            const parentDiv = table.closest('div');
            if (parentDiv && parentDiv.previousElementSibling &&
              parentDiv.previousElementSibling.className === 'container-header') {
              const containerDiv = parentDiv.parentElement;
              containerDiv.style.breakInside = 'avoid';
            }
          }
        });

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
    canvasLink.download = `Manifest_${data.consignment_number}_Canvas_${Date.now()}.png`;
    canvasLink.href = canvasDataURL;
    canvasLink.click();

    // Create PDF with improved page break handling
    const pdf = new jsPDF('p', 'mm', 'a4');
    const marginMm = 14;
    const contentWidthMm = 210 - 2 * marginMm;

    // Calculate dimensions
    const pxPerMm = canvas.width / contentWidthMm;
    const maxPageHeightMm = 297 - 2 * marginMm;
    const maxPageHeightPx = maxPageHeightMm * pxPerMm;

    let currentY = 0;
    let pageNum = 1;

    // Function to check if we need to break before a container
    const needsContainerBreak = (containerStartY, containerHeightPx, currentPageY) => {
      const remainingSpace = maxPageHeightPx - currentPageY;
      // If container height is more than remaining space, start on new page
      return containerHeightPx > remainingSpace;
    };

    while (currentY < canvas.height) {
      let sliceHeightPx = maxPageHeightPx;
      let shouldBreak = false;

      // Check if we need to break for containers
      const containerDivs = tempElement.querySelectorAll('.container-header');
      containerDivs.forEach(containerDiv => {
        const rect = containerDiv.getBoundingClientRect();
        const containerStartY = rect.top * scale;
        const containerEndY = containerStartY + (rect.height * scale);

        // If container starts on current page but might not fit
        if (containerStartY >= currentY && containerStartY < currentY + maxPageHeightPx) {
          // Calculate container height including its table
          const containerSection = containerDiv.parentElement;
          const containerRect = containerSection.getBoundingClientRect();
          const containerHeightPx = containerRect.height * scale;

          if (needsContainerBreak(containerStartY - currentY, containerHeightPx, currentY)) {
            sliceHeightPx = containerStartY - currentY - 10; // Leave small gap
            shouldBreak = true;
          }
        }
      });

      // Ensure we don't exceed canvas height
      sliceHeightPx = Math.min(sliceHeightPx, canvas.height - currentY);

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = canvas.width;
      croppedCanvas.height = sliceHeightPx;
      const ctx = croppedCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, currentY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      const croppedDataURL = croppedCanvas.toDataURL('image/jpeg', 0.85);
      const drawHeightMm = sliceHeightPx / pxPerMm;

      if (currentY > 0) {
        pdf.addPage();
        pageNum++;
      }

      pdf.addImage(croppedDataURL, 'JPEG', marginMm, marginMm, contentWidthMm, drawHeightMm, undefined, 'FAST');

      // Add page number
      pdf.setFontSize(9);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Page ${pageNum}`, 210 / 2, 297 - 10, { align: 'center' });

      croppedCanvas.remove();
      currentY += sliceHeightPx;
    }

    pdf.save(`Manifest_${data.consignment_number}_ContainerWise_${Date.now()}.pdf`);
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

        let containerInfo = { containerNo: 'N/A', seal_no: 'N/A', size: 'N/A' };

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
                // Use assign_total_box and assign_weight instead of totalNumber and weight
                let packagesForItem = 0;
                let weightForItem = 0;

                if (item.containerDetails && item.containerDetails.length > 0) {
                  item.containerDetails.forEach(containerDetail => {
                    packagesForItem += Number(containerDetail.assign_total_box) || 0;
                    weightForItem += Number(containerDetail.assign_weight) || 0;
                  });
                } else {
                  packagesForItem = parseInt(item.totalNumber) || 0;
                  weightForItem = parseFloat(item.weight) || 0;
                }

                totalPackages += packagesForItem;
                totalWeight += weightForItem;
              });
            }
          });
        }
      });

      // Gross weight calculation
      const totalAllContainersWeight = Object.keys(containerOrdersMap).reduce((sum, key) => {
        const ordersInContainer = containerOrdersMap[key].orders;
        const containerWeight = ordersInContainer.reduce((wSum, order) => {
          let weight = 0;
          if (order.receivers && order.receivers.length > 0) {
            order.receivers.forEach(receiver => {
              if (receiver.shippingdetails && receiver.shippingdetails.length > 0) {
                receiver.shippingdetails.forEach(item => {
                  if (item.containerDetails && item.containerDetails.length > 0) {
                    item.containerDetails.forEach(containerDetail => {
                      weight += Number(containerDetail.assign_weight) || 0;
                    });
                  } else {
                    weight += parseFloat(item.weight) || 0;
                  }
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
                  const subcategory = item.subcategory || '';
                  const commodityType = item.type || 'N/A';

                  // Use commodity + subcategory as key for proper grouping
                  const commodityKey = subcategory ? `${commodity}|${subcategory}` : commodity;
                  const displayName = subcategory ? `${commodity} - ${subcategory} (${commodityType})` : commodity;


                  if (!commodityMap[commodityKey]) {
                    commodityMap[commodityKey] = {
                      commodity: displayName,
                      totalOrders: new Set(),
                      totalPackages: 0,
                      totalWeight: 0
                    };
                  }

                  commodityMap[commodityKey].totalOrders.add(order.id);

                  // Use assign_total_box and assign_weight
                  let packagesForItem = 0;
                  let weightForItem = 0;

                  if (item.containerDetails && item.containerDetails.length > 0) {
                    item.containerDetails.forEach(containerDetail => {
                      packagesForItem += Number(containerDetail.assign_total_box) || 0;
                      weightForItem += Number(containerDetail.assign_weight) || 0;
                    });
                  } else {
                    packagesForItem = parseInt(item.totalNumber) || 0;
                    weightForItem = parseFloat(item.weight) || 0;
                  }

                  commodityMap[commodityKey].totalPackages += packagesForItem;
                  commodityMap[commodityKey].totalWeight += weightForItem;
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
                  // Calculate packages and weight from containerDetails
                  let packages = 0;
                  let weight = 0;

                  if (item.containerDetails && item.containerDetails.length > 0) {
                    item.containerDetails.forEach(containerDetail => {
                      packages += Number(containerDetail.assign_total_box) || 0;
                      weight += Number(containerDetail.assign_weight) || 0;
                    });
                  } else {
                    packages = parseInt(item.totalNumber) || 0;
                    weight = parseFloat(item.weight) || 0;
                  }

                  const commodity = item.category || 'N/A';
                  const subcategory = item.subcategory || '';
                  const fullCommodity = subcategory ? `${commodity} - ${subcategory}` : commodity;

                  detailedData.push({
                    sno: serialNumber++,
                    orderNumber: order.booking_ref || `ORD-${order.id}`,
                    sender: order.sender_name || 'N/A',
                    receiver: receiver.receiver_name || 'N/A',
                    marksNos: item.type || 'N/A',
                    packages: packages,
                    weight: weight,
                    commodity: fullCommodity
                  });
                });
              }
            });
          }
        });
      }

      return detailedData;
    };

    // Vessel name get karne ka function
    const getVesselName = (vesselId) => {
      if (!vesselId) return 'N/A';
      const vesselOption = options.vesselOptions?.find(v => v.value === vesselId.toString());
      return vesselOption?.label || `Vessel ${vesselId}`;
    };

    const vesselName = getVesselName(data.vessel);

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
            CONTAINER ${containerCounter}: ${containerNo} | SIZE: ${containerData.container.size || 'N/A'}${containerData.container.containerType || 'N/A'}
          </div>
          
          <!-- TABLE 1: Container Summary -->
          <div class="section-title">CONTAINER SUMMARY - ${containerNo} (${containerData.container.size || 'N/A'}${containerData.container.containerType || 'N/A'})</div>
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
          <div class="section-title">CONTAINER COMMODITY SUMMARY - ${containerNo} (${containerData.container.size || 'N/A'}${containerData.container.containerType || 'N/A'})</div>

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
<div class="section-title">DETAILED MANIFEST - ${containerNo} (${containerData.container.size || 'N/A'}${containerData.container.containerType || 'N/A'})</div>
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
  console.log('Rendering Add/Edit Consignment form in', eta,etaSuggestion);
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Typography variant="h4" gutterBottom sx={{ color: '#0d6c6a', fontWeight: 'bold', mb: 3 }}>
                    {mode === 'add' ? 'Add' : 'Edit'} Consignment Details
                  </Typography>

                  <Button
                    variant="outlined"
                    startIcon={<DescriptionIcon />}
                    onClick={() => generateConsignmentNotePDFWithCanvas(values, includedOrders)} // Fixed: Pass includedOrders
                    disabled={saving || !values.consignment_number}
                    sx={{ borderColor: '#f58220', color: '#f58220', '&:hover': { borderColor: '#e65100', backgroundColor: '#fff3e0' } }}
                  >
                    Consignment Note PDF
                  </Button>
                </Box>
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
                        <Box sx={{ flex: 1, minWidth: 350 }}>
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
                              sx={{ borderColor: '#f58220', color: '#f58220', minHeight: '56px', marginTop: 1 }}
                            >
                              Change
                            </Button>
                          )}
                        </Box>

                        {mode === 'edit' && (
                          <Box sx={{ flex: 1, minWidth: 250 }}>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>

                              <DatePicker
                                label="ETA"
                                value={eta ? dayjs(eta) : dayjs(etaSuggestion)}  // Ensure Day.js or null; handle invalid
                                onChange={(value) => {
                                  if (value && value?.isValid()) {  // Guard: Check isValid before format
                                    const formatted = value.format('YYYY-MM-DD');
                                    setEta(formatted);
                                    setValues(prev => ({ ...prev, eta: formatted }));  // Sync to form
                                  } else {
                                    setEta(null);
                                    // setValues(prev => ({ ...prev, eta: null }));  // Clear invalid
                                  }
                                }}
                                inputFormat="YYYY-MM-DD"
                                readOnly={true}
                                slotProps={{
                                  textField: {
                                    helperText: etaLoading
                                      ? 'Calculating ETA...'
                                      : etaSuggestion && eta !== etaSuggestion
                                        ? `Suggested: ${dayjs(etaSuggestion).isValid() ? dayjs(etaSuggestion).format('MMM DD, YYYY') : 'Invalid date'} based on status (edited)`
                                        : etaSuggestion
                                          ? `Suggested: ${dayjs(etaSuggestion).isValid() ? dayjs(etaSuggestion).format('MMM DD, YYYY') : 'Invalid date'} based on status`
                                          : 'Set ETA based on status',
                                  }
                                }}
                                disabled={['Delivered', 'Cancelled'].includes(values.status)}  // Disable for terminals
                                name="eta"
                              />
                            </LocalizationProvider>

                          </Box>
                        )}
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
                        <Tooltip title="Download simple Shipment note as PDF">
                          <Button
                            variant="outlined"
                            startIcon={<DescriptionIcon />}
                            onClick={() => generateshipmentsAndOrdersPDFWithCanvas(values, orders)} // Fixed: Pass includedOrders
                            disabled={saving || !values.consignment_number}
                            sx={{ borderColor: '#f58220', color: '#f58220', '&:hover': { borderColor: '#e65100', backgroundColor: '#fff3e0' } }}
                          >
                            Shipment & Orders PDF
                          </Button>
                        </Tooltip>
                        <Tooltip title="Download simple consignment note as PDF">
                          <Button
                            variant="outlined"
                            startIcon={<DescriptionIcon />}
                            onClick={() => generateContainersAndOrdersPDFWithCanvas(values, orders)}
                            disabled={saving || !values.consignment_number}
                            sx={{ borderColor: '#f58220', color: '#f58220', '&:hover': { borderColor: '#e65100', backgroundColor: '#fff3e0' } }}
                          >
                            Containers & Orders PDF
                          </Button>
                        </Tooltip>


                        <Tooltip title="Download PDF manifest with details, containers, and orders">
                          <Button
                            variant="outlined"
                            startIcon={<LocalPrintshopIcon />}
                            onClick={() => generateManifestPDFWithCanvas(values, orders)}
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
                            console.log('derived_status', container)
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
                                      helperText={rowErrors.containerNo}
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
                                      value={container.status || 'Available'}
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
                {/* <Accordion sx={{ mt: 2, boxShadow: 2, borderRadius: 2, '&:before': { display: 'none' } }}> */}


                <Accordion sx={{ mt: 2, boxShadow: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: '#fff', backgroundColor: '#f58220', borderRadius: '50%', p: 0.5 }} />}
                    sx={{ backgroundColor: '#f58220', color: 'white', borderRadius: 2 }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      🛒 Shipments by Container ({flatShipments.length} lines)
                    </Typography>
                  </AccordionSummary>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    {/* Right side - Button */}
                    <Tooltip title="Download simple Shipment note as PDF">
                      <Button
                        variant="outlined"
                        startIcon={<DescriptionIcon />}
                        onClick={() => generateshipmentsAndOrdersPDFWithCanvas(values, includedOrders)}
                        disabled={saving || !values.consignment_number}
                        sx={{
                          borderColor: '#f58220',
                          color: '#f58220',
                          '&:hover': {
                            borderColor: '#e65100',
                            backgroundColor: '#fff3e0'
                          }
                        }}
                      >
                        Shipment & Orders PDF
                      </Button>
                    </Tooltip>
                  </Box>


                  <AccordionDetails sx={{ p: 3 }}>
                    <TableContainer
                      component={Paper}
                      sx={{
                        borderRadius: 2,
                        overflow: 'auto',
                        boxShadow: 2,
                        maxHeight: 580,
                        width: '100%',
                        '&::-webkit-scrollbar': { height: 8, width: 8 },
                        '&::-webkit-scrollbar-thumb': { background: '#0d6c6a', borderRadius: 4 },
                      }}
                    >
                      <Table stickyHeader size="small" aria-label="shipments-by-container-table">
                        <TableHead sx={{ bgcolor: '#0d6c6a' }}>
                          <TableRow sx={{ bgcolor: '#0d6c6a' }}>
                            <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontWeight: 'Bold' }}>Item Ref No</TableCell>
                            <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontWeight: 'Bold' }}>Booking Ref</TableCell>
                            <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontWeight: 'Bold' }}>Form No</TableCell>
                            <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontWeight: 'Bold' }}>Product</TableCell>
                            <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontWeight: 'Bold' }}>POL</TableCell>
                            <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontWeight: 'Bold' }}>POD</TableCell>
                            <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontWeight: 'Bold' }}>Sender</TableCell>
                            <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontWeight: 'Bold' }}>Receiver</TableCell>
                            {/* <TableCell sx={{ bgcolor: '#0d6c6a' , color: '#fff', fontWeight: 'Bold' }}>Product</TableCell> */}

                            <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontWeight: 'Bold' }}>Container</TableCell>
                            <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontWeight: 'Bold', width: 200 }}>
                              Assign Weight & Items
                            </TableCell>
                            <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff', fontWeight: 'Bold' }}>Status</TableCell>

                            {/* <TableCell align="right"sx={{ bgcolor: '#0d6c6a' , color: '#fff', fontWeight: 'Bold' }}>
                  Actions
                </TableCell> */}
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {flatShipments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                                <Typography variant="body1" color="text.secondary">
                                  No shipments with container assignments found
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            flatShipments.map((shipment, index) => (
                              console.log('shipments', shipment),
                              <TableRow key={`${shipment.orderId}-${shipment.containerNumber}-${index}`}>
                                <TableCell>{shipment.itemRef}</TableCell>
                                <TableCell>{shipment.bookingRef}</TableCell>
                                <TableCell>{shipment.formNo}</TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      {shipment.category}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {shipment.subcategory && `${shipment.subcategory} • `}
                                      {/* {shipment.type} */}
                                    </Typography>
                                  </Box>
                                </TableCell>


                                <TableCell>{shipment.pol}</TableCell>
                                <TableCell>{shipment.pod}</TableCell>
                                <TableCell>{shipment.sender}</TableCell>
                                <TableCell>{shipment.receiverName}</TableCell>


                                <TableCell>
                                  <Chip
                                    label={shipment.containerNumber}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  {/* {shipment.remainingItems > 0 ? shipment.remainingItems.toLocaleString() : '-'} */}
                                  {shipment.assignWeight > 0 ? `${shipment.assignWeight.toLocaleString()} kg` : '-'}
                                  {' '}
                                  {shipment.assignBoxes > 0 ? `${shipment.assignBoxes.toLocaleString()} ${shipment.type}` : '-'}


                                </TableCell>

                                <TableCell>
                                  <StatusChip status={shipment.receiverStatus} size='small' />

                                </TableCell>


                                {/* <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="View order">
                          <IconButton
                            size="small"
                            onClick={() => handleView?.(shipment.orderId)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit order">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit?.(shipment.orderId)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell> */}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                  {/* <TablePagination
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
                  /> */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', gap: 2, mb: 2, }}>
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



