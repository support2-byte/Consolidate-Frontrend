import React, { useState } from 'react';
import * as Yup from 'yup';
import {
  Box, Button, Card, CardContent, TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Chip, Accordion, AccordionSummary, AccordionDetails,
  Typography, Alert, Divider, MenuList, Paper, Tooltip,
  IconButton as MuiIconButton
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

const ConsignmentPage = () => {
  const [values, setValues] = useState({
    consignmentNumber: '',
    status: 'Created',
    remarks: '',
    shipper: '',
    consignee: '',
    origin: '',
    destination: '',
    fromDate: dayjs('2025-10-27'),
    bank: '',
    paymentType: 'Prepaid',
    voyage: '',
    consignmentValue: 0,
    currency: 'GBP',
    eta: dayjs('2025-10-27'),
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

  // Mock options (replace with API fetches)
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

  // Validation functions (same as before)
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

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
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
    setValues(prev => ({ ...prev, containers: prev.containers.filter((_, i) => i !== index) }));
    markArrayTouched('containers');
  };

  const addOrder = () => {
    setValues(prev => ({ ...prev, orders: [...prev.orders, { itemName: '', quantity: 1, price: '' }] }));
  };

  const removeOrder = (index) => {
    setValues(prev => ({ ...prev, orders: prev.orders.filter((_, i) => i !== index) }));
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
      fromDate: dayjs('2025-10-27'),
      bank: '',
      paymentType: 'Prepaid',
      voyage: '',
      consignmentValue: 0,
      currency: 'GBP',
      eta: dayjs('2025-10-27'),
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

  const getContainerError = () => errors.containers; // Simplified

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, backgroundColor: '#f5f7fa' }}>
        <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            {/* <Typography variant="h4" gutterBottom sx={{ color: '#0d6c6a', fontWeight: 'bold' }}>
              Consignment Details
            </Typography> */}
            <form onSubmit={handleSubmit}>
              {/* Main Data Section */}
              <Accordion defaultExpanded sx={{ boxShadow: 1, borderRadius: 1, mb: 2, }}>
                <AccordionSummary  expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#0d6c6a' }} />}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold',color:'#f58220' }}>Consignment Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Row 1: Consignment #, Status, Next Button */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <TextField
                          fullWidth
                          id="consignmentNumber"
                          name="consignmentNumber"
                          label="Consignment #"
                          value={values.consignmentNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.consignmentNumber && Boolean(errors.consignmentNumber)}
                          helperText={touched.consignmentNumber && errors.consignmentNumber}
                          InputProps={{ startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'grey.500' }} />} }
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <FormControl fullWidth error={touched.status && Boolean(errors.status)}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            name="status"
                            value={values.status}
                            label="Status"
                            onChange={handleSelectChange}
                          >
                            <MenuItem value="Created">Created</MenuItem>
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="Shipped">Shipped</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      {/* <Box sx={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'flex-end' }}>
                        <Button variant="contained" color="primary" fullWidth sx={{ height: '56px' }}>Next</Button>
                      </Box> */}
                    </Box>

                    {/* Row 2: Remarks (full width) */}
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        id="remarks"
                        name="remarks"
                        label="Remarks"
                        multiline
                        rows={2}
                        value={values.remarks}
                        onChange={handleChange}
                        InputProps={{ startAdornment: <AttachFileIcon sx={{ mr: 1, color: 'grey.500', mt: 1 }} />} }
                      />
                    </Box>

                    {/* Row 3: From Date, ETA, Voyage */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <DatePicker
                          label="From Date*"
                          value={values.fromDate}
                          onChange={(newValue) => handleDateChange('fromDate', newValue)}
                          onClose={() => handleDateBlur('fromDate')}
                          slotProps={{ textField: { fullWidth: true, error: touched.fromDate && Boolean(errors.fromDate), helperText: touched.fromDate && errors.fromDate, InputProps: { startAdornment: <DateRangeIcon sx={{ mr: 1, color: 'grey.500' }} /> } } }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <DatePicker
                          label="ETA"
                          value={values.eta}
                          onChange={(newValue) => handleDateChange('eta', newValue)}
                          slotProps={{ textField: { fullWidth: true, InputProps: { startAdornment: <DateRangeIcon sx={{ mr: 1, color: 'grey.500' }} /> } } }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <Tooltip title="Enter voyage number">
                          <TextField
                            fullWidth
                            id="voyage"
                            name="voyage"
                            label="Voyage*"
                            value={values.voyage}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.voyage && Boolean(errors.voyage)}
                            helperText={touched.voyage && errors.voyage}
                            InputProps={{ startAdornment: <DirectionsBoatIcon sx={{ mr: 1, color: 'grey.500' }} /> }}
                          />
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Row 4: Payment Type, Consignment Value, Bank */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <FormControl fullWidth error={touched.paymentType && Boolean(errors.paymentType)}>
                          <InputLabel>Payment Type*</InputLabel>
                          <Select
                            name="paymentType"
                            value={values.paymentType}
                            label="Payment Type*"
                            onChange={handleSelectChange}
                            onBlur={() => handleSelectBlur('paymentType')}
                          >
                            {paymentTypeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <TextField
                          fullWidth
                          id="consignmentValue"
                          name="consignmentValue"
                          label="Consignment Value*"
                          type="number"
                          value={values.consignmentValue}
                          onChange={handleNumberChange}
                          onBlur={handleBlur}
                          error={touched.consignmentValue && Boolean(errors.consignmentValue)}
                          helperText={touched.consignmentValue && errors.consignmentValue}
                          InputProps={{
                            startAdornment: <BusinessIcon sx={{ mr: 1, color: 'grey.500' }} />,
                            endAdornment: (
                              <FormControl sx={{ minWidth: 80 }}>
                                <Select
                                  name="currency"
                                  value={values.currency}
                                  size="small"
                                  onChange={handleSelectChange}
                                >
                                  {currencyOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                </Select>
                              </FormControl>
                            )
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <Tooltip title="Select associated bank">
                          <FormControl fullWidth error={touched.bank && Boolean(errors.bank)}>
                            <InputLabel>Bank*</InputLabel>
                            <Select
                              name="bank"
                              value={values.bank}
                              label="Bank*"
                              onChange={handleSelectChange}
                              onBlur={() => handleSelectBlur('bank')}
                            >
                              {bankOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Row 5: Shipper, Consignee, Vessel */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <Tooltip title="Select shipper">
                          <FormControl fullWidth error={touched.shipper && Boolean(errors.shipper)}>
                            <InputLabel>Shipper*</InputLabel>
                            <Select 
                              name="shipper" 
                              value={values.shipper} 
                              label="Shipper*" 
                              onChange={handleSelectChange}
                              onBlur={() => handleSelectBlur('shipper')}
                            >
                              {shipperOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Tooltip>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <Tooltip title="Select consignee">
                          <FormControl fullWidth error={touched.consignee && Boolean(errors.consignee)}>
                            <InputLabel>Consignee*</InputLabel>
                            <Select 
                              name="consignee" 
                              value={values.consignee} 
                              label="Consignee*" 
                              onChange={handleSelectChange}
                              onBlur={() => handleSelectBlur('consignee')}
                            >
                              {consigneeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Tooltip>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <Tooltip title="Select vessel">
                          <FormControl fullWidth error={touched.vessel && Boolean(errors.vessel)}>
                            <InputLabel>Vessel*</InputLabel>
                            <Select 
                              name="vessel" 
                              value={values.vessel} 
                              label="Vessel*" 
                              onChange={handleSelectChange}
                              onBlur={() => handleSelectBlur('vessel')}
                            >
                              {vesselOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Row 6: Origin, Destination, Shipping Line */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <Tooltip title="Select origin port">
                          <FormControl fullWidth error={touched.origin && Boolean(errors.origin)}>
                            <InputLabel>Origin*</InputLabel>
                            <Select 
                              name="origin" 
                              value={values.origin} 
                              label="Origin*" 
                              onChange={handleSelectChange}
                              onBlur={() => handleSelectBlur('origin')}
                            >
                              {originOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Tooltip>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <Tooltip title="Select destination port">
                          <FormControl fullWidth error={touched.destination && Boolean(errors.destination)}>
                            <InputLabel>Destination*</InputLabel>
                            <Select 
                              name="destination" 
                              value={values.destination} 
                              label="Destination*" 
                              onChange={handleSelectChange}
                              onBlur={() => handleSelectBlur('destination')}
                            >
                              {destinationOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Tooltip>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <FormControl fullWidth>
                          <InputLabel>Shipping Line</InputLabel>
                          <Select 
                            name="shippingLine" 
                            value={values.shippingLine} 
                            label="Shipping Line" 
                            onChange={handleSelectChange}
                          >
                            {shippingLineOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>

                    {/* Row 7: # Delivered, # Pending, Seal No */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <TextField
                          fullWidth
                          id="delivered"
                          name="delivered"
                          label="# Delivered"
                          type="number"
                          value={values.delivered}
                          onChange={handleNumberChange}
                          InputProps={{ readOnly: true, startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'grey.500' }} />, sx: { backgroundColor: '#e3f2fd' } }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <TextField
                          fullWidth
                          id="pending"
                          name="pending"
                          label="# Pending"
                          type="number"
                          value={values.pending}
                          onChange={handleNumberChange}
                          InputProps={{ readOnly: true, startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'grey.500' }} />, sx: { backgroundColor: '#e3f2fd' } }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <TextField
                          fullWidth
                          id="sealNo"
                          name="sealNo"
                          label="Seal No"
                          value={values.sealNo}
                          onChange={handleChange}
                          InputProps={{ startAdornment: <LocalPrintshopIcon sx={{ mr: 1, color: 'grey.500' }} /> }}
                        />
                      </Box>
                    </Box>

                    {/* Row 8: Net Weight, Gross Weight */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 300 }}>
                        <TextField
                          fullWidth
                          id="netWeight"
                          name="netWeight"
                          label="Net Weight*"
                          type="number"
                          value={values.netWeight}
                          onChange={handleNumberChange}
                          onBlur={handleBlur}
                          error={touched.netWeight && Boolean(errors.netWeight)}
                          helperText={touched.netWeight && errors.netWeight}
                          InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary">KGS</Typography>, startAdornment: <LocalShippingIcon sx={{ mr: 1, color: 'grey.500' }} /> }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 300 }}>
                        <TextField
                          fullWidth
                          id="grossWeight"
                          name="grossWeight"
                          label="Gross Weight*"
                          type="number"
                          value={values.grossWeight}
                          onChange={handleNumberChange}
                          onBlur={handleBlur}
                          error={touched.grossWeight && Boolean(errors.grossWeight)}
                          helperText={touched.grossWeight && errors.grossWeight}
                          InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary">KGS</Typography>, startAdornment: <LocalShippingIcon sx={{ mr: 1, color: 'grey.500' }} /> }}
                        />
                      </Box>
                    </Box>

                    {/* Print Buttons Row */}
                    <Box sx={{ width: '100%', display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                      <Tooltip title="Print Manifest">
                        <Button variant="outlined" startIcon={<LocalPrintshopIcon />} sx={{ borderColor: '#ff9800', color: '#ff9800', '&:hover': { borderColor: '#f57c00' } }}>
                          Print Manifest
                        </Button>
                      </Tooltip>
                      <Tooltip title="Print Note (PDF)">
                        <Button variant="outlined" startIcon={<DescriptionIcon />} sx={{ borderColor: '#ff9800', color: '#ff9800', '&:hover': { borderColor: '#f57c00' } }}>
                          Print Note (PDF)
                        </Button>
                      </Tooltip>
                      <Tooltip title="Print Docx">
                        <Button variant="outlined" startIcon={<DescriptionIcon />} sx={{ borderColor: '#ff9800', color: '#ff9800', '&:hover': { borderColor: '#f57c00' } }}>
                          Print Docx
                        </Button>
                      </Tooltip>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Containers Section */}
              <Accordion sx={{ boxShadow: 1, borderRadius: 1, mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#0d6c6a' }} />}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f58220' }}>Containers</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                        <TableCell>Truck No</TableCell>
                        <TableCell>Container No.</TableCell>
                        <TableCell>Container Size</TableCell>
                        <TableCell>Ownership</TableCell>
                        <TableCell>Number of Days</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {values.containers.map((container, index) => (
                        <TableRow key={index} hover>
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
                            <MuiIconButton onClick={() => removeContainer(index)} color="error" size="small">
                              <DeleteIconMui fontSize="small" />
                            </MuiIconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button
                    startIcon={<AddIconMui />}
                    onClick={addContainer}
                    variant="outlined"
                    sx={{ mt: 2, borderColor: '#1976d2', color: '#1976d2', '&:hover': { borderColor: '#1565c0' } }}
                  >
                    Add Container
                  </Button>
                  {touched.containers && errors.containers && <Alert severity="error" sx={{ mt: 1 }}>{errors.containers}</Alert>}
                </AccordionDetails>
              </Accordion>

              {/* Orders Section */}
              <Accordion sx={{ boxShadow: 1, borderRadius: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIconMui sx={{ color: '#fff', backgroundColor: '#0d6c6a' }} />}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f58220' }}>Orders</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Table sx={{ minWidth: 500 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                        <TableCell>Item Name</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Price ($)</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {values.orders.map((order, index) => (
                        <TableRow key={index} hover>
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
                            <MuiIconButton onClick={() => removeOrder(index)} color="error" size="small">
                              <DeleteIconMui fontSize="small" />
                            </MuiIconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button
                    startIcon={<AddIconMui />}
                    onClick={addOrder}
                    variant="outlined"
                    sx={{ mt: 2, borderColor: '#1976d2', color: '#1976d2', '&:hover': { borderColor: '#1565c0' } }}
                  >
                    Add Order
                  </Button>
                </AccordionDetails>
              </Accordion>

              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={resetForm} sx={{ borderColor: '#9e9e9e', color: '#9e9e9e' }}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary" size="large">
                  Save Consignment
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default ConsignmentPage;