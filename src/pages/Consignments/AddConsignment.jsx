import React, { useState } from 'react';
import * as Yup from 'yup';
import {
  Box, Button, Card, CardContent, TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Accordion, AccordionSummary, AccordionDetails,
  Typography, Alert, Divider, Tooltip, Fade, Slide
} from '@mui/material';
import {
  Delete as DeleteIconMui,
  Add as AddIconMui, ExpandMore as ExpandMoreIconMui
} from '@mui/icons-material';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationOnIcon from '@mui/icons-material/LocationOn';    
import AttachFileIcon from '@mui/icons-material/AttachFile';
import BusinessIcon from '@mui/icons-material/Business';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Custom TextField Component for consistency
const CustomTextField = ({ name, value, onChange, onBlur, label, type = 'text', startAdornment, endAdornment, multiline, rows, readOnly, tooltip, required = false, error, helperText, ...props }) => (
  <Tooltip title={tooltip || ''}>
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
  </Tooltip>
);

// Custom Select Component
const CustomSelect = ({ name, value, onChange, onBlur, label, options, tooltip, required = false, error, helperText, ...props }) => (
  <Tooltip title={tooltip || ''}>
    <FormControl fullWidth error={error}>
      <InputLabel>{`${label}${required ? '*' : ''}`}</InputLabel>
      <Select 
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        label={`${label}${required ? '*' : ''}`}
        {...props}
      >
        {options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
      </Select>
      {helperText && <Typography variant="caption" color="error">{helperText}</Typography>}
    </FormControl>
  </Tooltip>
);

// Custom DatePicker Component
const CustomDatePicker = ({ name, value, onChange, onBlur, label, tooltip, required = false, error, helperText, ...props }) => (
  <Tooltip title={tooltip || ''}>
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
  </Tooltip>
);

const ConsignmentPage = () => {
  const [values, setValues] = useState({
    consignmentNumber: '',
    status: 'Created',
    remarks: '',
    shipper: '',
    consignee: '',
    origin: '',
    destination: '',
    fromDate: dayjs('2025-10-28'), // Updated to current date
    bank: '',
    paymentType: 'Prepaid',
    voyage: '',
    consignmentValue: 0,
    currency: 'GBP',
    eta: dayjs('2025-10-28'),
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

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validationSchema = Yup.object({
    consignmentNumber: Yup.string().required('Consignment # is required'),
    shipper: Yup.string().required('Shipper is required'),
    consignee: Yup.string().required('Consignee is required'),
    origin: Yup.string().required('Origin is required'),
    destination: Yup.string().required('Destination is required'),
    fromDate: Yup.date().required('From Date is required'),
    bank: Yup.string().required('Bank is required'),
    paymentType: Yup.string().required('Payment Type is required'),
    voyage: Yup.string().required('Voyage is required'),
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

  // Mock options (same as before)
  const shipperOptions = ['Shipper A', 'Shipper B', 'Shipper C'];
  const consigneeOptions = ['Consignee X', 'Consignee Y', 'Consignee Z'];
  const originOptions = ['Port 1', 'Port 2', 'Port 3'];
  const destinationOptions = ['Port A', 'Port B', 'Port C'];
  const bankOptions = ['Bank 1', 'Bank 2', 'Bank 3'];
  const paymentTypeOptions = ['Prepaid', 'Collect'];
  const vesselOptions = ['Vessel 1', 'Vessel 2', 'Vessel 3'];
  const shippingLineOptions = ['Line Alpha', 'Line Beta', 'Line Gamma'];
  const currencyOptions = ['GBP', 'USD', 'EUR'];
  const statusOptions = ['Pending', 'In Transit', 'Delivered'];

  // Validation functions (retained from original)
  const validateField = async (name, value) => {
    try {
      await validationSchema.fields[name]?.validate(value);
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [name]: error.message }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    if (touched[name]) validateField(name, parseFloat(value) || 0);
  };

  const handleDateChange = (name, newValue) => {
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

  const addContainer = () => {
    setValues(prev => ({ ...prev, containers: [...prev.containers, { truckNo: '', containerNo: '', size: '', ownership: '', numberOfDays: 0, status: 'Pending' }] }));
    markArrayTouched('containers');
  };

  const removeContainer = (index) => {
    const newContainers = values.containers.filter((_, i) => i !== index);
    setValues(prev => ({ ...prev, containers: newContainers.length > 0 ? newContainers : [{ truckNo: '', containerNo: '', size: '', ownership: '', numberOfDays: 0, status: 'Pending' }] }));
    markArrayTouched('containers');
  };

  const addOrder = () => {
    setValues(prev => ({ ...prev, orders: [...prev.orders, { itemName: '', quantity: 1, price: '' }] }));
  };

  const removeOrder = (index) => {
    const newOrders = values.orders.filter((_, i) => i !== index);
    setValues(prev => ({ ...prev, orders: newOrders.length > 0 ? newOrders : [{ itemName: '', quantity: 1, price: '' }] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = Object.keys(validationSchema.fields);
    setTouched(prev => ({ ...prev, ...allFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}) }));
    try {
      await validationSchema.validate(values, { abortEarly: false });
      console.log('Form Data:', values);
    } catch (error) {
      const validationErrors = {};
      error.inner.forEach(err => validationErrors[err.path] = err.message);
      setErrors(validationErrors);
    }
  };

  const resetForm = () => {
    setValues({
      consignmentNumber: '',
      status: 'Created',
      remarks: '',
      shipper: '',
      consignee: '',
      origin: '',
      destination: '',
      fromDate: dayjs('2025-10-28'),
      bank: '',
      paymentType: 'Prepaid',
      voyage: '',
      consignmentValue: 0,
      currency: 'GBP',
      eta: dayjs('2025-10-28'),
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
        <Slide in timeout={600}>
          <Card sx={{ boxShadow: 4, borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#0d6c6a', fontWeight: 'bold', mb: 3 }}>
                Consignment Details
              </Typography>
              <form onSubmit={handleSubmit}>
                {/* Main Data Section - Using Box for 3-column layout */}
                <Accordion defaultExpanded sx={{ boxShadow: 2, borderRadius: 2, mb: 3, '&:before': { display: 'none' } }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#f58220', borderRadius: '50%', p: 0.5 }} />}
                    sx={{ backgroundColor: '#f58220', color: 'white', borderRadius: 2 }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>📦 Consignment Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Basic Info Row - 3 columns */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomTextField
                            name="consignmentNumber"
                            value={values.consignmentNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            label="Consignment #"
                            startAdornment={<DescriptionIcon sx={{ mr: 1, color: '#f58220' }} />}
                            required
                            error={touched.consignmentNumber && Boolean(errors.consignmentNumber)}
                            helperText={touched.consignmentNumber && errors.consignmentNumber}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="status"
                            value={values.status}
                            onChange={handleChange}
                            label="Status"
                            options={['Created', 'Active', 'Shipped']}
                            error={touched.status && Boolean(errors.status)}
                            helperText={touched.status && errors.status}
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

                      {/* Dates & Voyage Row - 3 columns */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomDatePicker
                            name="fromDate"
                            value={values.fromDate}
                            onChange={handleDateChange}
                            onBlur={() => handleDateBlur('fromDate')}
                            label="From Date"
                            required
                            error={touched.fromDate && Boolean(errors.fromDate)}
                            helperText={touched.fromDate && errors.fromDate}
                            slotProps={{ textField: { InputProps: { startAdornment: <DateRangeIcon sx={{ mr: 1, color: '#f58220' }} /> } } }}
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
                            tooltip="Enter voyage number"
                          />
                        </Box>
                      </Box>

                      {/* Payment & Value Row - 3 columns */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="paymentType"
                            value={values.paymentType}
                            onChange={handleChange}
                            onBlur={() => handleSelectBlur('paymentType')}
                            label="Payment Type"
                            options={paymentTypeOptions}
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
                            startAdornment={<BusinessIcon sx={{ mr: 1, color: '#f58220' }} />}
                            endAdornment={
                              <FormControl size="small" sx={{ minWidth: 60 }}>
                                <Select name="currency" value={values.currency} onChange={handleChange}>
                                  {currencyOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
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
                            options={bankOptions}
                            required
                            error={touched.bank && Boolean(errors.bank)}
                            helperText={touched.bank && errors.bank}
                            tooltip="Select associated bank"
                          />
                        </Box>
                      </Box>

                      {/* Parties & Vessel Row - 3 columns */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="shipper"
                            value={values.shipper}
                            onChange={handleChange}
                            onBlur={() => handleSelectBlur('shipper')}
                            label="Shipper"
                            options={shipperOptions}
                            required
                            error={touched.shipper && Boolean(errors.shipper)}
                            helperText={touched.shipper && errors.shipper}
                            tooltip="Select shipper"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="consignee"
                            value={values.consignee}
                            onChange={handleChange}
                            onBlur={() => handleSelectBlur('consignee')}
                            label="Consignee"
                            options={consigneeOptions}
                            required
                            error={touched.consignee && Boolean(errors.consignee)}
                            helperText={touched.consignee && errors.consignee}
                            tooltip="Select consignee"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="vessel"
                            value={values.vessel}
                            onChange={handleChange}
                            onBlur={() => handleSelectBlur('vessel')}
                            label="Vessel"
                            options={vesselOptions}
                            required
                            error={touched.vessel && Boolean(errors.vessel)}
                            helperText={touched.vessel && errors.vessel}
                            tooltip="Select vessel"
                          />
                        </Box>
                      </Box>

                      {/* Locations & Line Row - 3 columns */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                          <CustomSelect
                            name="origin"
                            value={values.origin}
                            onChange={handleChange}
                            onBlur={() => handleSelectBlur('origin')}
                            label="Origin"
                            options={originOptions}
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
                            options={destinationOptions}
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
                            options={shippingLineOptions}
                          />
                        </Box>
                      </Box>

                      {/* Counts & Seal Row - 3 columns */}
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

                      {/* Weights Row - 2 columns */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 300 }}>
                          <CustomTextField
                            name="netWeight"
                            value={values.netWeight}
                            onChange={handleNumberChange}
                            onBlur={handleBlur}
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

                    {/* Print Buttons - Centered with Fade In */}
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

                {/* Containers Section */}
                <Accordion sx={{ boxShadow: 2, borderRadius: 2, mb: 3, '&:before': { display: 'none' } }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#0d6c6a', borderRadius: '50%', p: 0.5 }} />}
                    sx={{ backgroundColor: '#0d6c6a', color: 'white', borderRadius: 2 }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🚚 Containers</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 3 }}>
                    <Table sx={{ minWidth: '100%', boxShadow: 1, borderRadius: 1, overflow: 'hidden' }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Truck No</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Container No.</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Size</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Ownership</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Days</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {values.containers.map((container, index) => (
                          <Fade in key={index} timeout={300 * index}>
                            <TableRow hover sx={{ transition: 'all 0.2s ease' }}>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={container.truckNo}
                                  onChange={(e) => updateArrayField('containers', index, 'truckNo', e.target.value)}
                                />
                              </TableCell>
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
                                  value={container.ownership}
                                  onChange={(e) => updateArrayField('containers', index, 'ownership', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={container.numberOfDays}
                                  onChange={(e) => updateArrayField('containers', index, 'numberOfDays', parseInt(e.target.value) || 0)}
                                />
                              </TableCell>
                              <TableCell>
                                <FormControl size="small" fullWidth>
                                  <Select
                                    value={container.status}
                                    onChange={(e) => updateArrayField('containers', index, 'status', e.target.value)}
                                  >
                                    {statusOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                  </Select>
                                </FormControl>
                              </TableCell>
                              <TableCell>
                                <IconButton onClick={() => removeContainer(index)} color="error" size="small">
                                  <DeleteIconMui fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          </Fade>
                        ))}
                      </TableBody>
                    </Table>
                    <Button
                      startIcon={<AddIconMui />}
                      onClick={addContainer}
                      variant="contained"
                      sx={{ mt: 2, backgroundColor: '#f58220', color: 'white', '&:hover': { backgroundColor: '#e65100' } }}
                    >
                      Add Container
                    </Button>
                    {touched.containers && errors.containers && <Alert severity="error" sx={{ mt: 1 }}>{errors.containers}</Alert>}
                  </AccordionDetails>
                </Accordion>

                {/* Orders Section */}
                <Accordion sx={{ boxShadow: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#1976d2', borderRadius: '50%', p: 0.5 }} />}
                    sx={{ backgroundColor: '#1976d2', color: 'white', borderRadius: 2 }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🛒 Orders</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 3 }}>
                    <Table sx={{ minWidth: '100%', boxShadow: 1, borderRadius: 1, overflow: 'hidden' }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#e8f5e8' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Price ($)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {values.orders.map((order, index) => (
                          <Fade in key={index} timeout={300 * index}>
                            <TableRow hover sx={{ transition: 'all 0.2s ease' }}>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={order.itemName}
                                  onChange={(e) => updateArrayField('orders', index, 'itemName', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={order.quantity}
                                  onChange={(e) => updateArrayField('orders', index, 'quantity', parseInt(e.target.value) || 1)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={order.price}
                                  onChange={(e) => updateArrayField('orders', index, 'price', parseFloat(e.target.value) || 0)}
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton onClick={() => removeOrder(index)} color="error" size="small">
                                  <DeleteIconMui fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          </Fade>
                        ))}
                      </TableBody>
                    </Table>
                    <Button
                      startIcon={<AddIconMui />}
                      onClick={addOrder}
                      variant="contained"
                      sx={{ mt: 2, backgroundColor: '#1976d2', color: 'white', '&:hover': { backgroundColor: '#1565c0' } }}
                    >
                      Add Order
                    </Button>
                  </AccordionDetails>
                </Accordion>

                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={resetForm} 
                    sx={{ borderColor: '#9e9e9e', color: '#9e9e9e', '&:hover': { borderColor: '#757575' } }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    sx={{ backgroundColor: '#f58220', color: 'white', px: 4, '&:hover': { backgroundColor: '#e65100' } }}
                  >
                    Save Consignment
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Slide>
      </Box>
    </LocalizationProvider>
  );
};

export default ConsignmentPage;