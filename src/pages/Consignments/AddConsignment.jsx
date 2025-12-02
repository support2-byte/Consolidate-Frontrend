import React, { useState, useEffect, useMemo } from 'react';
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
  Chip, Stack, Grid, Avatar,
  CircularProgress
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
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
import UpdateIcon from '@mui/icons-material/Update';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { api } from '../../api';
import { useNavigate } from 'react-router-dom';
import ContainersTabs from '../Containers/Containers';
import ContainerModule from '../Containers/Containers';
import { Navigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
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


// Optional prop for edit mode
  const ConsignmentPage = ({ consignmentId: propConsignmentId }) => {
  const currentDate = dayjs('2025-11-20');
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

  // Consolidated initData
  useEffect(() => {
    // setSaving(false)
    const initData = async () => {
      try {
        setLoading(true);
        const [thirdPartiesRes, originsRes, destinationsRes, banksRes, paymentTypesRes,
          vesselsRes, shippingLinesRes, currenciesRes, statusesRes, containerStatusesRes] =
          await Promise.all([
            api.get('api/options/thirdParty/crud'),
            api.get('api/options/origins'),
            api.get('api/options/places/crud'),
            api.get('api/options/banks/crud'),
            api.get('api/options/payment-types/crud'),
            api.get('api/options/vessels/crud'),
            api.get('api/options/shipping-lines'),
            api.get('api/options/currencies'),
            api.get('api/options/statuses'),
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
        const filteredOrigins = (destinationsRes?.data?.places || []).filter(place => place.is_destination === false);
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
          const defaultStatus = (statusesRes?.data?.statusOptions || []).find(opt => opt.value === 'Draft')?.value || (statusesRes?.data?.statusOptions || [])[0]?.value || '';
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
    console.log('Loading consignment', id);
    try {
      setMode('edit');
      const res = await api.get(`/api/consignments/${id}`);
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
        eform_date: data?.eform_date ? dayjs(data.eform_date) : null,
        eta: data?.eta ? dayjs(data.eta) : null,
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
const loadImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(null);
  });
};

const generateManifestPDF = async (data, selectedOrders = orders) => {
  if (!data.consignment_number) {
    setSnackbar({
      open: true,
      severity: 'warning',
      message: 'Please enter a consignment number to generate the manifest.',
    });
    return;
  }

  //---------------------------------------------------
  // SETUP
  //---------------------------------------------------
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const padding = 10;
  const brandPrimary = [13, 108, 106];  // #0d6c6a
  const brandAccent = [245, 130, 32];   // #f58220

  //---------------------------------------------------
  // LOAD LOGO AS BASE64
  //---------------------------------------------------
  const logoBase64 = await loadImageAsBase64("https://royalgulfshipping.com/wp-content/uploads/2023/08/RGSL-LOGO-white.png");

  //---------------------------------------------------
  // HEADER
  //---------------------------------------------------
  const drawHeader = () => {
    const headerHeight = 22;

    // Main brand color bar
    doc.setFillColor(...brandPrimary);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Logo Left
    if (logoBase64) {

      doc.addImage(logoBase64, 'PNG', margin, 4, 60, 12);  // smaller, sharper

    }

    // Title Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('Manifest Report', pageWidth - margin, 10, { align: 'right' });

    doc.setFontSize(9).setFont('helvetica', 'normal');
    doc.text(
      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      pageWidth - margin,
      17,
      { align: 'right' }
    );
  };

  //---------------------------------------------------
  // SUMMARY CARDS (Modern UI)
  //---------------------------------------------------
  const drawSummary = (y) => {
    const cards = [
      ["Containers", data.containers?.length || 0],
      ["Orders", selectedOrders?.length || 0],
      ["Net Weight", `${data.net_weight || 0} KGS`],
      ["Gross Weight", `${data.gross_weight || 0} KGS`],
      ["Value", `${data.consignment_value || 0} ${data.currency_code || 'USD'}`],
      ["Status", data.status || "Draft"],
    ];

    const cardWidth = (pageWidth - margin * 2 - 6) / 2;
    const cardHeight = 16;

    doc.setFontSize(10);

    cards.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);

      const x = margin + (col * (cardWidth + 6));
      const cardY = y + row * (cardHeight + 6);

      // Card box
      doc.setDrawColor(230, 230, 230);
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');

      // Title (accent)
      doc.setFillColor(...brandPrimary);
      doc.rect(x, cardY, cardWidth, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(item[0], x + 2, cardY + 4);

      // Value
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item[1]), x + 3, cardY + 11);
    });

    return y + Math.ceil(cards.length / 2) * (cardHeight + 6) + 5;
  };

  //---------------------------------------------------
  // CONSIGNMENT DETAILS
  //---------------------------------------------------
  const drawDetails = (y) => {
    doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(...brandPrimary);
    doc.text("Consignment Details", margin, y);

    y += 4;

    // Section underline
    doc.setDrawColor(...brandPrimary);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);

    y += 6;

    const details = [
      ["Consignment #", data.consignment_number],
      ["Shipper", data.shipperName],
      ["Consignee", data.consigneeName],
      ["Origin", data.originName],
      ["Destination", data.destinationName],
      ["Vessel / Voyage", `${data.vessel || 'N/A'} / ${data.voyage || 'N/A'}`],
      ["ETA", data.eta ? new Date(data.eta).toLocaleDateString() : 'N/A'],
      ["Shipping Line", data.shipping_line],
      ["Payment Type", data.payment_type],
      ["Bank", data.bankName],
      ["Seal No", data.seal_no],
    ];

    const colWidth = (pageWidth - margin * 2 - 10) / 2;

    doc.setFontSize(9).setTextColor(50, 50, 50);

    const rowHeight = 9; // reduced from 10

details.forEach((pair, index) => {
  const col = index % 2;
  const row = Math.floor(index / 2);
  const x = margin + col * (colWidth + 10);
  const dy = y + row * rowHeight;

  doc.setFont('helvetica', 'bold');
  doc.text(pair[0], x, dy);

  doc.setFont('helvetica', 'normal');
  doc.text(String(pair[1] || "N/A"), x, dy + 4); // reduced label offset
});

return y + Math.ceil(details.length / 2) * rowHeight + 6; // tighter bottom spacing
 };

  //---------------------------------------------------
  // REMARKS BOX
  //---------------------------------------------------
  const drawRemarks = (y) => {
    if (!data.remarks) return y;

    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'F');

    doc.setFontSize(9).setFont('helvetica', 'italic').setTextColor(90, 90, 90);

    const wrapped = doc.splitTextToSize(data.remarks, pageWidth - margin * 2 - 10);
    doc.text("Remarks:", margin + 3, y + 6);
    doc.text(wrapped, margin + 3, y + 11);

    return y + 28;
  };

  //---------------------------------------------------
  // TABLE: Containers
  //---------------------------------------------------
  const drawContainers = (y) => {
    if (!data.containers?.length) return y;

    doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(...brandPrimary);
    doc.text("Containers", margin, y);

    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Container No', 'Location', 'Size', 'Type', 'Owner', 'Status']],
      body: data.containers.map(c => [
        c.containerNo,
        c.location,
        c.size,
        c.containerType,
        c.ownership,
        c.status,
      ]),
      headStyles: { fillColor: brandPrimary, textColor: 255 },
      bodyStyles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin }
    });

    return doc.lastAutoTable.finalY + 10;
  };

  //---------------------------------------------------
  // TABLE: Orders
  //---------------------------------------------------
  const drawOrders = (y) => {
    if (!selectedOrders.length) return y;

    doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(...brandAccent);
    doc.text(`Selected Orders (${selectedOrders.length})`, margin, y);

    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Booking Ref', 'POL', 'POD', 'Sender', '#Recv', '#Cont', 'Status']],
      headStyles: { fillColor: brandAccent, textColor: 255 },
      bodyStyles: { fontSize: 9, cellPadding: 3 },
      body: selectedOrders.map(o => [
        o.booking_ref,
        o.place_of_loading,
        o.final_destination || o.place_of_delivery,
        o.sender_name,
        o.receivers?.length || 0,
        o.receiver_containers_json?.split(",").length || 0,
        o.status?.substring(0, 12),
      ]),
      margin: { left: margin, right: margin }
    });

    return doc.lastAutoTable.finalY + 10;
  };

  //---------------------------------------------------
  // FOOTER
  //---------------------------------------------------
  const drawFooter = () => {
    const y = 275;

    doc.setDrawColor(...brandPrimary);
    doc.line(margin, y, pageWidth - margin, y);

    doc.setFontSize(9).setTextColor(80, 80, 80);

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      margin,
      y + 6
    );

    doc.text(
      `Page ${doc.getCurrentPageInfo().pageNumber}`,
      pageWidth - margin,
      y + 6,
      { align: 'right' }
    );
  };

  //---------------------------------------------------
  // BUILD DOCUMENT
  //---------------------------------------------------
  drawHeader();
  let y = 30;
  y = drawSummary(y);
  y = drawDetails(y);
  y = drawRemarks(y);
  y = drawContainers(y);
  y = drawOrders(y);
  drawFooter();

  //---------------------------------------------------
  // SAVE FILE
  //---------------------------------------------------
  doc.save(`Manifest_${data.consignment_number}.pdf`);
};



const generateDocx = () => {
  // Placeholder for Docx (requires 'docx' and 'file-saver')
  setSnackbar({ open: true, severity: 'info', message: 'Docx generation: Install docx and file-saver for full support.' });
};



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
          container_ids: addedContainerIds.join(','),
          ...(filters.booking_ref && { booking_ref: filters.booking_ref }),
          ...(filters.status && { status: filters.status }),
        };
        const response = await api.get(`/api/orders`, { params });
        console.log('Fetched orders:', response.data);
        setOrders(response.data?.data || []);
        setOrderTotal(response.data?.total || 0);
        handleSelectAllClick({ target: { checked: true } });
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [addedContainerIds, filters, orderPage, orderRowsPerPage]);

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
      'Waiting for Consignee Authentication': { bg: '#fff3e0', text: '#ef6c00' },
      'Waiting for Shipper Authentication (if applicable)': { bg: '#fff3e0', text: '#ef6c00' },
      'Consignee Authentication Confirmed': { bg: '#e8f5e8', text: '#388e3c' },
      'In Process': { bg: '#fff3e0', text: '#ef6c00' },
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
    //   Yup.object({
    //     containerNo: Yup.string().required('Container No. is required'),
    //     size: Yup.string().oneOf(['20ft', '40ft']).required('Size is required'),
    //   })
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
      const res = await api.put(`/api/consignments/${effectiveConsignmentId}/next`);
      const { message } = res.data || {};
      console.log('Status advanced:', res);
      await loadConsignment(effectiveConsignmentId);
      setSnackbar({
        open: true,
        message: message || 'Status advanced successfully!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error advancing status:', err);
      setSnackbar({
        open: true,
        message: 'Failed to advance status.',
        severity: 'error',
      });
    }
  };

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
      eform_date: values.eform_date ? dayjs(values.eform_date).format('YYYY-MM-DD') : null,
      bank_id: parseInt(values.bank, 10) || null,
      bank: values.bankName || '',
      currency_code: values.currency_code || 'GBP',
      vessel: parseInt(values.vessel, 10) || null,
      eta: values.eta ? dayjs(values.eta).format('YYYY-MM-DD') : null,
      voyage: values.voyage || null,
      shipping_line: parseInt(values.shippingLine, 10) || null,
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
    console.log('Creating consignment', e);
    if (e) e.preventDefault();
    setSaving(true);
    const submitData = await validateAndPrepare();
    if (!submitData) return;
    try {
      const res = await api.post('/api/consignments', submitData);
      console.log('[handleCreate] Success response:', res.data);
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
        eform_date: responseData?.eform_date ? dayjs(responseData.eform_date) : null,
        eta: responseData?.eta ? dayjs(responseData.eta) : null,
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
        if (details && Array.isArray(details)) {
          details.forEach(field => {
            const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            backendValidationErrors[camelField] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')} is required or invalid`;
          });
        } else if (details) {
          Object.entries(details).forEach(([field, msg]) => {
            const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            backendValidationErrors[camelField] = msg;
          });
        } else {
          if (apiError?.includes('duplicate') || apiError?.includes('unique')) {
            backendValidationErrors.consignment_number = 'Consignment Number already exists.';
          } else if (apiError?.includes('foreign key')) {
            backendValidationErrors.shipper = 'Invalid Shipper, Consignee, Bank, Vessel, or Shipping Line.';
          }
        }
        setErrors(prev => ({ ...prev, ...backendValidationErrors }));
        const backendMsg = apiError || backendMessage || err.message || 'Failed to create consignment';
        let detailsMsg = '';
        if (details && Array.isArray(details)) {
          const fieldNames = details.map(field => field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '));
          detailsMsg = `\nValidation Errors: ${fieldNames.join(', ')} (e.g., select valid options with names).`;
        } else if (details) {
          detailsMsg = `\nDetails: ${JSON.stringify(details)}`;
        }
        if (err.response.status === 500) {
          detailsMsg += `\nServer Error (500): Check backend logs/DB for SQL issues (e.g., duplicate number, invalid ID). Try unique consignment_number.`;
        }
        setSnackbar({
          open: true,
          message: `Backend Error: ${backendMsg}${detailsMsg}`,
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
        if (details && Array.isArray(details)) {
          details.forEach(field => {
            const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            backendValidationErrors[camelField] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')} is required or invalid`;
          });
        } else if (details) {
          Object.entries(details).forEach(([field, msg]) => {
            const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            backendValidationErrors[camelField] = msg;
          });
        } else {
          if (apiError?.includes('duplicate') || apiError?.includes('unique')) {
            backendValidationErrors.consignment_number = 'Consignment Number already exists.';
          } else if (apiError?.includes('foreign key')) {
            backendValidationErrors.shipper = 'Invalid Shipper, Consignee, Bank, Vessel, or Shipping Line.';
          }
        }
        setErrors(prev => ({ ...prev, ...backendValidationErrors }));
        const backendMsg = apiError || backendMessage || err.message || 'Failed to update consignment';
        let detailsMsg = '';
        if (details && Array.isArray(details)) {
          const fieldNames = details.map(field => field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '));
          detailsMsg = `\nValidation Errors: ${fieldNames.join(', ')} (e.g., select valid options with names).`;
        } else if (details) {
          detailsMsg = `\nDetails: ${JSON.stringify(details)}`;
        }
        if (err.response.status === 500) {
          detailsMsg += `\nServer Error (500): Check backend logs/DB for SQL issues (e.g., duplicate number, invalid ID). Try unique consignment_number.`;
        }
        setSnackbar({
          open: true,
          message: `Backend Error: ${backendMsg}${detailsMsg}`,
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

  const resetForm = () => {
    setValues({
      id: '',
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
      containers: [{ containerNo: '', location: '', size: '', containerType: '', ownership: '', status: 'Pending', id: '' }],
      orders: []
    });
    setErrors({});
    setTouched({});
    setSelectedOrders([]);
  };

  const getContainerError = () => errors.containers;
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
    <Card
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
              <Card
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
              <EmojiEventsIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                No items available
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Card>
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
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#0d6c6a', fontWeight: 'bold', mb: 3 }}>
              {mode === 'add' ? 'Add' : 'Edit'} Consignment Details
            </Typography>
            <form onSubmit={mode === 'edit' ? handleEditCon : handleCreate}>
              {/* Main Data Section */}
              <Accordion defaultExpanded sx={{ boxShadow: 2, borderRadius: 2, mb: 3, '&:before': { display: 'none' } }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIconMui  sx={{ color: '#fff', backgroundColor: '#0d6c6a', borderRadius: '50%', p: 0.5 }} />}
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
                          name="consignment_number"
                          value={values.consignment_number}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          label="Consignment #"
                          startAdornment={<DescriptionIcon sx={{ mr: 1, color: '#f58220' }} />}
                          readOnly={mode === 'edit'} // Keep readOnly for consignment_number in edit mode
                          required
                          error={touched.consignment_number && Boolean(errors.consignment_number)}
                          helperText={touched.consignment_number && errors.consignment_number}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                          <CustomSelect
                            name="status"
                            value={values.status}
                            onChange={handleChange}
                            label="Status"
                            options={options.statusOptions || []}
                            // disabled={mode === 'edit'} // Keep disabled for status in edit mode (use Next button)
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
                          name="eform_date"
                          tooltip='Select Date'
                          value={values.eform_date}
                          onChange={handleDateChange}
                          onBlur={() => handleDateBlur('eform_date')}
                          label="Eform Date"
                          required
                          error={touched.eform_date && Boolean(errors.eform_date)}
                          helperText={touched.eform_date && errors.eform_date}
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
                          helperText={touched.shipper && errors.shipper}
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
                          helperText={touched.consignee && errors.consignee}
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
                          helperText={touched.origin && errors.origin}
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
                          options={options.shippingLineOptions || []}
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
                              console.log('Selected paymentType (enum):', newValue);  // e.g., 'Collect'
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
                          helperText={touched.consignment_value && errors.consignment_value}
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
                          value={values.vessel ?? ''} // Use ?? to handle null as empty string for display
                          onChange={handleChange}
                          onBlur={() => handleSelectBlur('vessel')}
                          label="Vessel"
                          options={options.vesselOptions || []}
                          required
                          error={touched.vessel && Boolean(errors.vessel)}
                          helperText={touched.vessel && errors.vessel}
                          tooltip="Select vessel"
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <CustomDatePicker
                          name="eta"
                          tooltip='Select Date'
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
                          name="seal_no"
                          value={values.seal_no}
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
                          onChange={handleNumberChange}
                          label="Net Weight"
                          type="number"
                          required
                          startAdornment={<LocalShippingIcon sx={{ mr: 1, color: '#f58220' }} />}
                          endAdornment={<Typography variant="body2" color="text.secondary">KGS</Typography>}
                          error={touched.netWeight && Boolean(errors.netWeight)}
                          helperText={touched.netWeight && errors.netWeight}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 300 }}>
                        <CustomTextField
                          name="gross_weight"
                          value={values.gross_weight}
                          onChange={handleNumberChange}
                          onBlur={handleBlur}
                          label="Gross Weight"
                          type="number"
                          required
                          startAdornment={<LocalShippingIcon sx={{ mr: 1, color: '#f58220' }} />}
                          endAdornment={<Typography variant="body2" color="text.secondary">KGS</Typography>}
                          error={touched.gross_weight && Boolean(errors.gross_weight)}
                          helperText={touched.gross_weight && errors.gross_weight}
                        />
                      </Box>
                    </Box>
                  </Box>
                  {/* Print Buttons */}
                  <Fade in={true} timeout={800}>
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Tooltip title="Download PDF manifest with details, containers, and orders">
                        <Button
                          variant="outlined"
                          startIcon={<LocalPrintshopIcon />}
                          onClick={() => generateManifestPDF(values)}
                          disabled={saving || !values.consignment_number}
                          sx={{ borderColor: '#f58220', color: '#f58220', '&:hover': { borderColor: '#e65100', backgroundColor: '#fff3e0' } }}
                        >
                          {saving ? <CircularProgress size={20} /> : 'Print Manifest'}
                        </Button>
                      </Tooltip>
                      <Tooltip title="Download simple consignment note as PDF">
                        <Button
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                                   onClick={() => generateManifestPDF(values)}
                          disabled={saving || !values.consignment_number}
                          sx={{ borderColor: '#f58220', color: '#f58220', '&:hover': { borderColor: '#e65100', backgroundColor: '#fff3e0' } }}
                        >
                          Print Note (PDF)
                        </Button>
                      </Tooltip>
                      {/* <Tooltip title="Download as Word document (requires additional setup)">
                        <Button
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          onClick={generateDocx}
                          disabled={saving || !values.consignment_number}
                          sx={{ borderColor: '#f58220', color: '#f58220', '&:hover': { borderColor: '#e65100', backgroundColor: '#fff3e0' } }}
                        >
                          Print Docx
                        </Button>
                      </Tooltip> */}
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
                  {saving ? 'Saving...' : (mode === 'edit' ? 'Update Consignment' : 'Add Consignment')}
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
                      (values.containers || []).map((container, index) => (
                        <Fade in key={index} timeout={300 * index}>
                          <TableRow hover sx={{ transition: 'all 0.2s ease' }}>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                value={container.containerNo || ''}
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
                                value={container.size || ''}
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
                                <DeleteIconMui  fontSize="small" />
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
                    startIcon={<AddIcon />}
                    onClick={addContainer}
                    variant="outlined"
                    sx={{ flex: 1, color: '#0d6c6a', }}
                  >
                    Add New
                  </Button>
                  <Button
                    startIcon={<AddIcon />}
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
            {/* Orders Section */}
            <Accordion sx={{ mt: 2, boxShadow: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#f58220', borderRadius: '50%', p: 0.5 }} />}
                sx={{ backgroundColor: '#f58220', color: 'white', borderRadius: 2 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🛒 Orders ({numSelected} selected)</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3 }}>
                <>
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
                              indeterminate={numSelected > 0 && numSelected < rowCount}
                              checked={rowCount > 0 && numSelected === rowCount}
                              onChange={handleSelectAllClick}
                            />
                          </TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="ref">Booking Ref</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="loading">POL</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="dest">POD</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="sender">Sender</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="receivers">Receivers</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="containers">Containers</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="status">Status</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="created">Created At</TableCell>
                          {/* <TableCell sx={{ bgcolor: '#0d6c6a', color: '#fff' }} key="actions">Actions</TableCell> */}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(orders || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                              <Typography variant="body2" color="text.secondary">No orders found.</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          (orders || []).map((order) => {
                            const isItemSelected = isSelected(order.id);
                            // renderReceivers( order.receivers);
                            const containersList = order.receiver_containers_json ? order.receiver_containers_json.split(', ').map(cont => ({ primary: cont })) : []; // Simple for containers
                            const status = order.overall_status || order.status || 'Created';
                            const colors = getStatusColors(status);
                            return (
                              <TableRow
                                key={order.id}
                                selected={isItemSelected}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={isItemSelected}
                                    onChange={handleOrderToggle(order.id)}
                                  />
                                </TableCell>
                                <TableCell>{order.booking_ref || ''}</TableCell>
                                <TableCell>{order?.place_of_loading || ''}</TableCell>
                                <TableCell>{order.place_of_discharge || order.place_of_loading || ''}</TableCell>
                                <TableCell>{order.sender_name || ''}</TableCell>
                                <TableCell>
                                  <Tooltip
                                    title={<PrettyList items={parseSummaryToList(order.receivers || [])} title="Receivers" />}
                                    arrow
                                    placement="top"
                                    PopperProps={{
                                      sx: { '& .MuiTooltip-tooltip': { border: '1px solid #e0e0e0' } }
                                    }}
                                  >
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
                                      {(order.receivers || []).length > 0
                                        ? <>{(order.receivers || []).length > 1 && <sup style={{ padding: 4, borderRadius: 50, float: 'left', background: '#00695c', color: '#fff' }}>({order.receivers.length})</sup>}
                                          <span style={{ padding: 0 }}>{(order.receivers || []).map(r => r.receiver_name || '').join(', ').substring(0, 50)}...</span></>
                                        : '-'
                                      }
                                    </Typography>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  <Tooltip
                                    // title={<PrettyContainersList items={parseContainersToList(order.receiver_containers_json)} title="Containers" />}
                                    title={<PrettyList items={parseContainersToList(order.receiver_containers_json || '')} title="Containers" />}
                                    arrow
                                    placement="top"
                                  >
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 120, cursor: 'help', fontWeight: 'medium' }}>
                                      {order.receiver_containers_json
                                        ? <>{containersList.length > 1 && <sup style={{ padding: 4, borderRadius: 50, float: 'left', background: '#00695c', color: '#fff' }}>({containersList.length})</sup>}
                                          <span style={{ padding: 0 }}>{containersList.map(c => c.primary || '').join(', ').substring(0, 25)}...</span></>
                                        : '-'
                                      }
                                    </Typography>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={`${status.substring(0, 15)}...`} // Internal status for admin
                                    // size="small"
                                    sx={{
                                      flexShrink: 0,
                                      backgroundColor: colors.bg,
                                      color: colors.text
                                    }}
                                  />
                                </TableCell>
                               <TableCell>{new Date(order.created_at || Date.now()).toLocaleDateString()}</TableCell>
                               {/*   <TableCell>
                                  <IconButton size="small" onClick={() => handleView(order.id)}>
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleEdit(order.id)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleStatusUpdate(order.id, order)}>
                                    <UpdateIcon fontSize="small" />
                                  </IconButton>
                                </TableCell> */}
                              </TableRow>
                            );
                          })
                        )}
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
                </>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </Slide>
    </Box>
  </LocalizationProvider>
);
};
export default ConsignmentPage