import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Button, TextField, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Typography, Modal, FormControl, InputLabel, Radio, RadioGroup, FormControlLabel, Tooltip, Divider,
  Snackbar, Alert, CircularProgress, Backdrop, Pagination, TablePagination
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom'; // Add this import at the top of your component file
import HistoryIcon from '@mui/icons-material/History';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CloseIcon from '@mui/icons-material/Close';
import { api } from '../../api'; // Assuming api is configured with baseURL
import SaveIcon from '@mui/icons-material/Save'
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
  width: { xs: '90%', sm: 600 }
};


const ContainerModule = ({ propContainers = [] }) => {
  const navigate = useNavigate(); // Add this for job navigation
  const [filters, setFilters] = useState({
    container_number: '',
    container_size: '',
    container_type: '',
    owner_type: '',
    status: '',
    location: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  const getStatusColor = (status) => {
    const colors = {
      'Available': 'success',
      'Returned': 'success',
      'In Transit': 'warning',
      'Loaded': 'warning',
      'Occupied': 'warning',
      'Hired': 'warning',
      'Arrived': 'error',
      'Under Repair': 'error',
      'De-Linked': 'info',
      'Cleared': 'info',
      'Assigned to Job': 'warning'
    };
    return colors[status] || 'default';
  };

  // Dynamic options from API
  const [statuses, setStatuses] = useState([
    { value: 'Available', label: 'Available', color: getStatusColor('Available') },
    { value: 'Hired', label: 'Hired', color: getStatusColor('Hired') },
    { value: 'Occupied', label: 'Occupied', color: getStatusColor('Occupied') },
    { value: 'In Transit', label: 'In Transit', color: getStatusColor('In Transit') },
    { value: 'Loaded', label: 'Loaded', color: getStatusColor('Loaded') },
    { value: 'Assigned to Job', label: 'Assigned to Job', color: getStatusColor('Assigned to Job') },
    { value: 'Arrived', label: 'Arrived', color: getStatusColor('Arrived') },
    { value: 'De-Linked', label: 'De-Linked', color: getStatusColor('De-Linked') },
    { value: 'Under Repair', label: 'Under Repair', color: getStatusColor('Under Repair') },
    { value: 'Returned', label: 'Returned', color: getStatusColor('Returned') },
    { value: 'Cleared', label: 'Cleared', color: getStatusColor('Cleared') },
  ]);
  const [locations, setLocations] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [types, setTypes] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);

  // State for modals
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [selectedContainerNo, setSelectedContainerNo] = useState(null);

  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);

  // State for quick edit
  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({ status: '', location: '' });
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // State for containers and history
  const [containers, setContainers] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]); // Now holds groupedByJob array

  // Loading states
  const [loadingContainers, setLoadingContainers] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingReturned, setLoadingReturned] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Error states
  const [error, setError] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // State for Add Container form
  const [formData, setFormData] = useState({
    ownership: 'soc',
    containerNo: '',
    size: '',
    type: '',
    derived_status: '', // Default to empty string
    location: 'karachi_port', // NEW: Default physical location
    dateAdded: new Date().toISOString().split('T')[0],
    dateOfManufacture: new Date().toISOString().split('T')[0],
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    purchaseFrom: '', // Default to empty string
    ownershipDetails: 'Self-Owned',
    availableAtDate: '', // NEW: Separate date field for SOC available_at
    currency: 'USD',
    hireStartDate: new Date().toISOString().split('T')[0],
    hireEndDate: new Date().toISOString().split('T')[0],
    vendor: '',
    return_date: new Date().toISOString().split('T')[0],
    freeDays: '',
    placeOfLoading: '',
    placeOfDelivery: ''
  });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showToast = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
    setError(null); // Clear any existing error on new toast
  };

  const handleError = (error, defaultMessage = 'An unexpected error occurred') => {
    console.error('Error:', error);
    const message = error.response?.data?.error || error.message || defaultMessage;
    setError(message);
    showToast(message, 'error');
  };

  // Fetch dynamic options from backend
  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [statusRes, locationRes, sizeRes, typeRes, ownershipRes] = await Promise.all([
        api.get('/api/containers/statuses'),
        api.get('/api/containers/locations'),
        api.get('/api/containers/sizes'),
        api.get('/api/containers/types'),
        api.get('/api/containers/ownership-types')
      ]);
      console.log('Fetched options:', sizeRes );
      // setStatuses(statusRes.data || []);
      setLocations(locationRes.data || []);
      setSizes(sizeRes.data || []);
      setTypes(typeRes.data || []);
      setOwnershipTypes(ownershipRes.data || []);
    } catch (error) {
      handleError(error, 'Error fetching options');
    } finally {
      setLoadingOptions(false);
    }
  };

  // Validate container number format
  const validateContainerNumber = (containerNo) => {
    const regex = /^[A-Z]{4}\d{7}$/;
    return regex.test(containerNo);
  };

  // Validate date
  const validateDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  // Validate number
  const validateNumber = (value, fieldName) => {
    if (value === '' || value === null || value === undefined) return true; // Allow empty for optional
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error(`${fieldName} must be a valid non-negative number`);
    }
    return true;
  };

  // Fetch all containers from backend
  const fetchContainers = async () => {
    if (!navigator.onLine) {
      handleError(new Error('You are offline. Please check your connection.'), 'Network error');
      return;
    }
    setLoadingContainers(true);
    setError(null);
    try {
      const params = {
        ...filters,
        page: currentPage,
        limit: rowsPerPage
      };
      const response = await api.get('/api/containers', { params });
      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      setContainers(response.data?.data || []);
      setTotalCount(response.data?.total || 0);
    } catch (error) {
      handleError(error, 'Error fetching containers');
    } finally {
      setLoadingContainers(false);
    }
  };
// Fetch container by ID with usage history from backend
const fetchContainerById = async (cid) => {
  setLoadingHistory(true);
  if (!cid) {
    handleError(new Error('Invalid container ID'));
    return;
  }
  try {
    const [containerRes, historyRes] = await Promise.all([
      api.get(`/api/containers/${cid}`),
      api.get(`/api/containers/${cid}/usage-history`)
    ]);
    if (containerRes.status !== 200) {
      throw new Error(`Unexpected response status: ${containerRes.status}`);
    }
    if (historyRes.status !== 200) {
      throw new Error(`Unexpected response status: ${historyRes.status}`);
    }
    console.log('Fetched container and history:', containerRes, historyRes);  
    const data = containerRes.data;
    const groupedHistory = historyRes.data?.groupedByJob;
    // Convert object to array for UI rendering
    const historyArray = groupedHistory ? Object.values(groupedHistory) : [];
    console.log('Converted history array:', historyArray);
    // Update to use groupedByJob for enhanced UI
    setUsageHistory(historyArray);
    setSelectedContainerNo(data.container_number || cid);
  } catch (error) {
    console.error('Error fetching container details:', error);
    setUsageHistory([]);
    setSelectedContainerNo(cid);
    handleError(error, 'Error fetching container details');
  } finally {
    setLoadingHistory(false);
  }
};
  useEffect(() => {
    if (!propContainers || propContainers.length === 0) {
      setContainers([]);
      setTotalCount(0);
      return;
    }

    let filtered = [...propContainers];

    // Apply filters
    if (filters.container_number) {
      filtered = filtered.filter(c => c.container_number?.toUpperCase().includes(filters.container_number.toUpperCase()));
    }
    if (filters.container_size) {
      filtered = filtered.filter(c => c.container_size === filters.container_size);
    }
    if (filters.container_type) {
      filtered = filtered.filter(c => c.container_type === filters.container_type);
    }
    if (filters.owner_type) {
      filtered = filtered.filter(c => c.owner_type === filters.owner_type);
    }
    if (filters.status) {
      filtered = filtered.filter(c => c.derived_status === filters.status);
    }
    if (filters.location) {
      filtered = filtered.filter(c => c.location === filters.location);
    }

    setTotalCount(filtered.length);

    // Paginate
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    setContainers(filtered.slice(startIndex, endIndex));
  }, []);

  // Handle quick edit
  const handleQuickEdit = (container) => {
    setEditingId(container.cid);
    setTempData({ status: container.derived_status || '', location: container.location || '' });
  };

  // Handle quick save (updates DB via API)
  const handleQuickSave = async (cid) => {
    if (!tempData.status || !tempData.location) {
      showToast('Status and Location are required', 'error');
      return;
    }
    setLoadingUpdate(true);
    try {
      const payload = {
        derived_status: tempData.status,
        location: tempData.location,
        // derived_status: tempData.status  // Sync with backend logic
      };
      const response = await api.put(`/api/containers/${cid}`, payload);
      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      showToast('Container updated successfully', 'success');
      setEditingId(null);
      await fetchContainers(); // Refresh from DB
    } catch (error) {
      handleError(error, 'Failed to update container');
    } finally {
      setLoadingUpdate(false);
    }
  };

  // Handle quick cancel  
  const handleQuickCancel = () => {
    setEditingId(null);
    setTempData({ status: '', location: '' });
  };

  // Handle edit container (full modal)
  const handleEdit = async (container) => {
    if (!container) {
      handleError(new Error('Invalid container data'));
      return;
    }
    try {
      setEditingContainer(container);
      setFormData({
        ownership: container.owner_type || 'soc',
        containerNo: container.container_number || '',
        size: container.container_size || '',
        type: container.container_type || '',
        derived_status: container.derived_status || '',
        location: container.location || 'karachi_port', // NEW: Use physical location
        dateAdded: new Date().toISOString().split('T')[0],
        dateOfManufacture: container.manufacture_date ? new Date(container.manufacture_date).toISOString().split('T')[0] : '',
        purchaseDate: container.purchase_date ? new Date(container.purchase_date).toISOString().split('T')[0] : '',
        purchasePrice: container.purchase_price || '',
        purchaseFrom: container.purchase_from || '',
        ownershipDetails: container.owned_by || 'Self-Owned',
        availableAtDate: container.available_at ? new Date(container.available_at).toISOString().split('T')[0] : '', // NEW: Date field
        currency: container.currency || 'USD',
        hireStartDate: container.hire_start_date ? new Date(container.hire_start_date).toISOString().split('T')[0] : '',
        hireEndDate: container.hire_end_date ? new Date(container.hire_end_date).toISOString().split('T')[0] : '',
        vendor: container.hired_by || '',
        return_date: container.return_date ? new Date(container.return_date).toISOString().split('T')[0] : '',
        freeDays: container.free_days || '',
        placeOfLoading: container.place_of_loading || '',
        placeOfDelivery: container.place_of_destination || ''
      });
      setIsEditing(true);
      setOpenAddModal(true);
    } catch (error) {
      handleError(error, 'Error preparing to edit container');
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchContainers();
  }, [filters, currentPage, rowsPerPage]);

  // Handle history modal open
  const openHistory = (cid) => {
    if (!cid) {
      handleError(new Error('Invalid container ID'));
      return;
    }
    setSelectedContainerNo(cid);
    fetchContainerById(cid);
    setOpenHistoryModal(true);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    if (!e || !e.target) return;
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      container_number: '',
      container_size: '',
      container_type: '',
      owner_type: '',
      status: '',
      location: ''
    });
    setCurrentPage(1);
  };

  // Handle form changes
  const handleFormChange = (e) => {
    if (!e || !e.target) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Comprehensive form validation
  const validateForm = () => {
    const errors = [];

    // Container Number
    if (!formData.containerNo.trim()) {
      errors.push('Container Number is required');
    } else if (!validateContainerNumber(formData.containerNo)) {
      errors.push('Container Number must be 4 letters followed by 7 digits (e.g., ABCD1234567)');
    }

    // Size and Type
    if (!formData.size) {
      errors.push('Size is required');
    }
    if (!formData.type) {
      errors.push('Type is required');
    }

    // Location (physical)
    if (!formData.location || !['karachi_port', 'dubai_port'].includes(formData.location)) {
      errors.push('Valid Location is required (Karachi Port or Dubai Port)');
    }

    // Ownership specific
    if (formData.ownership === 'soc') {
      if (!formData.dateOfManufacture || !validateDate(formData.dateOfManufacture)) {
        errors.push('Valid Date of Manufacture is required');
      }
      if (!formData.purchaseDate || !validateDate(formData.purchaseDate)) {
        errors.push('Valid Purchase Date is required');
      }
      if (!formData.purchasePrice || !validateNumber(formData.purchasePrice, 'Purchase Price')) {
        errors.push('Valid Purchase Price is required');
      }
      if (!formData.purchaseFrom) {
        errors.push('Purchase From is required');
      }
      if (!formData.ownershipDetails.trim()) {
        errors.push('Owned By is required');
      }
      if (!formData.availableAtDate || !validateDate(formData.availableAtDate)) {
        errors.push('Valid Available At Date is required');
      }
      if (formData.currency && !/^[A-Z]{3}$/.test(formData.currency)) {
        errors.push('Currency must be a 3-letter code (e.g., USD)');
      }
    }

    if (formData.ownership === 'coc') {
      if (!formData.hireStartDate || !validateDate(formData.hireStartDate)) {
        errors.push('Valid Hire Start Date is required');
      }
      if (!formData.hireEndDate || !validateDate(formData.hireEndDate)) {
        errors.push('Valid Hire End Date is required');
      }
      if (!formData.vendor.trim()) {
        errors.push('Vendor is required');
      }
      if (!formData.freeDays || !validateNumber(formData.freeDays, 'Free Days')) {
        errors.push('Valid Free Days is required');
      }
      if (!formData.placeOfLoading.trim()) {
        errors.push('Place of Loading is required');
      }
      if (!formData.placeOfDelivery.trim()) {
        errors.push('Place of Delivery is required');
      }
      if (formData.return_date && !validateDate(formData.return_date)) {
        errors.push('Valid Return Date is required');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
    return true;
  };

  // Handle form submission (updates DB via API)
  const handleFormSubmit = async () => {
    try {
      validateForm();
    } catch (validationError) {
      handleError(validationError);
      return;
    }

    if (!navigator.onLine) {
      handleError(new Error('You are offline. Please check your connection.'), 'Network error');
      return;
    }

    const payload = {
      container_number: formData.containerNo,
      container_size: formData.size,
      container_type: formData.type,
      owner_type: formData.ownership,
      derived_status: formData.derived_status,
      remarks: 'Created/Updated via frontend', // Optional
      created_by: 'system', // Replace with actual user
      location: formData.location, // NEW: Physical location
      // derived_status: formData.derived_status,
      manufacture_date: formData.dateOfManufacture,
      purchase_date: formData.purchaseDate,
      purchase_price: parseFloat(formData.purchasePrice) || 0,
      purchase_from: formData.purchaseFrom,
      owned_by: formData.ownershipDetails,
      available_at: formData.availableAtDate, // NEW: Date field for SOC
      currency: formData.currency,
      hire_start_date: formData.hireStartDate,
      hire_end_date: formData.hireEndDate,
      hired_by: formData.vendor,
      return_date: formData.return_date,
      free_days: parseInt(formData.freeDays) || 0,
      place_of_loading: formData.placeOfLoading,
      place_of_destination: formData.placeOfDelivery
    };

    setLoadingForm(true);
    setError(null);
    try {
      if (isEditing && editingContainer) {
        console.log('Updating container:', editingContainer.cid);
        if (!editingContainer.cid) {
          throw new Error('Invalid container ID for update');
        }
        const response = await api.put(`/api/containers/${editingContainer.cid}`, payload);
        if (response.status !== 200) {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
        showToast('Container updated successfully', 'success');
      } else {
        const response = await api.post('/api/containers', payload);
        if (response.status !== 201) {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
        showToast('Container added successfully', 'success');
      }
      setOpenAddModal(false);
      setIsEditing(false);
      setEditingContainer(null);
      setFormData({
        ownership: 'soc',
        containerNo: '',
        size: '',
        type: '',
        derived_status: '',
        location: 'karachi_port',
        dateAdded: new Date().toISOString().split('T')[0],
        dateOfManufacture: '',
        purchaseDate: '',
        purchasePrice: '',
        purchaseFrom: '',
        ownershipDetails: 'Self-Owned',
        availableAtDate: '',
        currency: 'USD',
        hireStartDate: '',
        hireEndDate: '',
        vendor: '',
        return_date: '',
        freeDays: '',
        placeOfLoading: '',
        placeOfDelivery: ''
      });
      await fetchContainers(); // Refresh from DB after update
    } catch (error) {
      handleError(error, 'Failed to save container');
    } finally {
      setLoadingForm(false);
    }
  };

  // Mark container as returned (updates DB via API)
  const markReturned = async (cid) => {
    console.log('Marking container as returned:', cid);
    if (!cid) {
      handleError(new Error('Invalid container ID'));
      return;
    }
    if (!navigator.onLine) {
      handleError(new Error('You are offline. Please check your connection.'), 'Network error');
      return;
    }
    setLoadingReturned(prev => ({ ...prev, [cid]: true }));
    setError(null);
    try {
      const payload = {
        derived_status: 'Returned',
        // derived_status: 'Returned',
        remarks: 'Marked as returned via frontend'
      };
      const response = await api.put(`/api/containers/${cid}`, payload);
      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      await fetchContainers(); // Refresh from DB
      showToast('Container marked as returned successfully', 'success');
    } catch (error) {
      handleError(error, 'Failed to mark as returned');
    } finally {
      setLoadingReturned(prev => ({ ...prev, [cid]: false }));
    }
  };

  console.log('Containers state:', containers);
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f5f5f5', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Container Master Screen */}
      <Box sx={{ maxWidth: 1450, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 'bold', color: '#f58220' }}
          >
            Container Master
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={() => {
              setIsEditing(false);
              setEditingContainer(null);
              setOpenAddModal(true);
            }}
            sx={{
              bgcolor: 'linear-gradient(45deg, #0d6c6a 30%, #21CBF3 90%)',
              borderRadius: 2,
              textTransform: 'none',
              px: 5,
              py: 1,
              fontSize: '1rem',
              background: "#0d6c6a",
              color: "#fff"
            }}
          >
            Add Containers
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* Filters with Dynamic Options */}
        <Box sx={{ display: 'flex', flexWrap: 'nowrap', justifyContent: "space-between", mb: 2, gap: 1 }}>
          <Box sx={{ minWidth: 150 }}>
            <TextField
              label="Container No."
              name="container_number"
              value={filters.container_number || ''}
              onChange={handleFilterChange}
              size="small"
              fullWidth
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
                  transition: "all 0.3s ease",
                  backgroundColor: "#fff",
                  "& fieldset": { borderColor: "#ddd" },
                  "&:hover fieldset": { borderColor: "primary.main" },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                    boxShadow: "0 0 8px rgba(25, 118, 210, 0.3)",
                  },
                },
                "& .MuiInputLabel-root": {
                  letterSpacing: 0.5,
                  textTransform: "capitalize",
                  color: "rgba(180, 174, 174, 1)",
                },
              }}
            />
          </Box>
          <Box sx={{ minWidth: 170 }}>
            <FormControl fullWidth size="small" sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
                transition: "all 0.3s ease",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#ddd" },
                "&:hover fieldset": { borderColor: "primary.main" },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  boxShadow: "0 0 8px rgba(25, 118, 210, 0.3)",
                },
              },
              "& .MuiInputLabel-root": {
                letterSpacing: 0.5,
                textTransform: "capitalize",
                color: "rgba(180, 174, 174, 1)",
              },
            }}>
              <InputLabel>Size</InputLabel>
              <Select name="container_size" label='Size' value={filters.container_size || ''} onChange={handleFilterChange}>
                <MenuItem value="">All Sizes</MenuItem>
                {sizes.map((size) => (
                  <MenuItem key={size.value} value={size.value}>{size.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 170 }}>
            <FormControl fullWidth size="small" sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
                transition: "all 0.3s ease",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#ddd" },
                "&:hover fieldset": { borderColor: "primary.main" },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  boxShadow: "0 0 8px rgba(25, 118, 210, 0.3)",
                },
              },
              "& .MuiInputLabel-root": {
                letterSpacing: 0.5,
                textTransform: "capitalize",
                color: "rgba(180, 174, 174, 1)",
              },
            }}>
              <InputLabel>Type</InputLabel>
              <Select name="container_type" label="Type" value={filters.container_type || ''} onChange={handleFilterChange}>
                <MenuItem value="">All Types</MenuItem>
                {/* {types.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))} */}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 170 }}>
            <FormControl fullWidth size="small" sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
                transition: "all 0.3s ease",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#ddd" },
                "&:hover fieldset": { borderColor: "primary.main" },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  boxShadow: "0 0 8px rgba(25, 118, 210, 0.3)",
                },
              },
              "& .MuiInputLabel-root": {
                letterSpacing: 0.5,
                textTransform: "capitalize",
                color: "rgba(180, 174, 174, 1)",
              },
            }}>
              <InputLabel>Ownership</InputLabel>
              <Select name="owner_type" label="Ownership" value={filters.owner_type || ''} onChange={handleFilterChange}>
                <MenuItem value="">All Ownership</MenuItem>
                {ownershipTypes.map((own) => (
                  <MenuItem key={own.value} value={own.value}>{own.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 170 }}>
            <FormControl fullWidth size="small" sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
                transition: "all 0.3s ease",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#ddd" },
                "&:hover fieldset": { borderColor: "primary.main" },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  boxShadow: "0 0 8px rgba(25, 118, 210, 0.3)",
                },
              },
              "& .MuiInputLabel-root": {
                letterSpacing: 0.5,
                textTransform: "capitalize",
                color: "rgba(180, 174, 174, 1)",
              },
            }}>
              <InputLabel>Status</InputLabel>
              <Select name="status" label="Status" value={filters.status || ''} onChange={handleFilterChange}>
                <MenuItem value="">All Statuses</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 170 }}>
            <FormControl fullWidth size="small" sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
                transition: "all 0.3s ease",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#ddd" },
                "&:hover fieldset": { borderColor: "primary.main" },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  boxShadow: "0 0 8px rgba(25, 118, 210, 0.3)",
                },
              },
              "& .MuiInputLabel-root": {
                letterSpacing: 0.5,
                textTransform: "capitalize",
                color: "rgba(180, 174, 174, 1)",
              },
            }}>
              <InputLabel>Location</InputLabel>
              <Select name="location" label="Location" value={filters.location || ''} onChange={handleFilterChange}>
                <MenuItem value="">All Locations</MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc.value} value={loc.value}>{loc.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 100 }}>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              fullWidth
              sx={{ textTransform: 'none', borderColor: '#0d6c6a', color: '#0d6c6a', height: '100%' }}
            >
              Clear
            </Button>
          </Box>
        </Box>

        {/* Scrollable Table Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto', boxShadow: 3, borderRadius: 2 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow><TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Container No.</TableCell><TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Size</TableCell><TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Type</TableCell><TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Ownership</TableCell>
                <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Status</TableCell><TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Location</TableCell><TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Last Used</TableCell><TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Actions</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {loadingContainers ? (<TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress size={24} /><Typography variant="body2" sx={{ ml: 1 }}>Loading containers...</Typography></TableCell></TableRow>) : error ?
                  (<TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'error.main' }}><Typography variant="body2">{error}</Typography><Button onClick={fetchContainers} sx={{ mt: 1 }}>Retry</Button></TableCell></TableRow>)
                  : containers.length === 0 ? (<TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><Typography variant="body2">No containers found</Typography></TableCell></TableRow>) : (containers.map((container, index) => { const isEditing = editingId === container.cid; const currentStatus = isEditing ? tempData.status
                    : (container.derived_status || 'N/A'); const currentLocation = isEditing ? tempData.location : (container.location || 'N/A'); const statusColor = statuses.find(s => s.value === currentStatus)?.color || 'default'; return (<TableRow key={container.cid || index} sx={{ bgcolor: index % 2 === 0 ? '#f9f9f9' : 'white', '&:hover': { bgcolor: '#e3f2fd' } }}><TableCell sx={{ cursor: 'pointer', color: '#0d6c6a', '&:hover': { textDecoration: 'underline' } }} onClick={() => openHistory(container.cid)}>{container.container_number || 'N/A'}</TableCell>
                    <TableCell>{container.container_size || 'N/A'}</TableCell>
                    <TableCell>{container.container_type || 'N/A'}</TableCell>
                    <TableCell><Chip label={container.owner_type === 'soc' ? 'Own' : 'Hired'}
                      color={container.owner_type === 'soc' ? 'success' : 'info'} size="small" sx={{ fontWeight: 'bold' }} /></TableCell>
                    <TableCell>{isEditing ?
                      (<FormControl size="small" sx={{ minWidth: 120 }}><Select value={currentStatus} onChange={(e) => setTempData({ ...tempData, status: e.target.value })} displayEmpty>{statuses.map((status) => (<MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>))}</Select></FormControl>) :
                      (<Chip label={currentStatus} color={statusColor} size="small" sx={{ fontWeight: 'bold' }} />)}</TableCell><TableCell>{isEditing ? (<FormControl size="small" sx={{ minWidth: 120 }}><Select value={currentLocation} onChange={(e) => setTempData({ ...tempData, location: e.target.value })} displayEmpty>
                        <MenuItem value="">Select Location</MenuItem>{locations.map((loc) => (<MenuItem key={loc.value} value={loc.value}>{loc.label}</MenuItem>))}</Select></FormControl>) : (currentLocation)}</TableCell><TableCell>{container.created_time ? new Date(container.created_time).toLocaleDateString() : '–'}</TableCell><TableCell>{isEditing ? (<Box sx={{ display: 'flex', gap: 1 }}><Tooltip title="Save"><IconButton onClick={() => handleQuickSave(container.cid)} disabled={loadingUpdate} size="small">{loadingUpdate ? <CircularProgress size={16} /> :
                            <SaveIcon />}
                          </IconButton></Tooltip><Tooltip title="Cancel">
                            <IconButton onClick={handleQuickCancel} size="small"><CloseIcon /></IconButton></Tooltip></Box>) :
                          (<><Tooltip title="Quick Update Status & Location">
                            <IconButton onClick={() => handleQuickEdit(container)} sx={{ color: '#0d6c6a' }} size="small">
                              <EditIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Edit Container Details">
                              <IconButton onClick={() => handleEdit(container)} sx={{ color: '#f58220' }} size="small">
                                <EditNoteIcon fontSize="large" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View History">
                              <IconButton onClick={() => openHistory(container.cid)} sx={{ color: '#0d6c6a' }} disabled={loadingHistory}>{loadingHistory ?
                                <CircularProgress size={16} /> : <HistoryIcon />}</IconButton></Tooltip>
                            <Tooltip title={container.derived_status !== 'Cleared' ? 'Container must be Cleared to mark Returned' : 'Mark as Returned'}><span>
                              <Button disabled={container.derived_status !== 'Cleared' || loadingReturned[container.cid]} onClick={() => markReturned(container.cid)} size="small" startIcon={loadingReturned[container.cid] ? <CircularProgress size={16} /> : null}
                                sx={{ textTransform: 'none', color: '#0d6c6a' }}>Mark Returned</Button></span></Tooltip>

                          </>
                        )}



                      </TableCell></TableRow>); }))}
              </TableBody>
            </Table>
          </TableContainer>

          {!loadingContainers && totalCount > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={currentPage - 1}
              onPageChange={(event, newPage) => {
                setCurrentPage(newPage + 1);
              }}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setCurrentPage(1);
              }}
              sx={{ flexShrink: 0, mt: 1 }}
            />
          )}
        </Box>

        {/* Add Container Modal with Dynamic Options */}
        <Modal open={openAddModal} onClose={() => {
          setOpenAddModal(false);
          setIsEditing(false);
          setEditingContainer(null);
        }}>
          <Box sx={{ ...modalStyle, width: { xs: '90%', sm: 1100 } }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 'bold', color: '#0d6c6a', mb: 1 }}
            >
              {isEditing ? 'Edit Container' : 'Add New Container'}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <FormControl component="fieldset" sx={{ mb: 1 }}>
              <RadioGroup
                row
                name="ownership"
                value={formData.ownership || 'soc'}
                onChange={handleFormChange}
              >
                {ownershipTypes.slice().reverse().map((own) => (
                  <FormControlLabel
                    key={own.value}
                    value={own.value}
                    control={<Radio />}
                    label={own.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <Box sx={{ display: 'flex', }}>
              <Box sx={{ flex: 1, mx: 0.5 }}>
                <TextField
                  label="Container Number"
                  name="containerNo"
                  value={formData.containerNo || ''}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  helperText="Format: 4 letters + 7 digits (e.g., RGSLU1234567)"
                  variant="outlined"
                  disabled={isEditing}
                  sx={{ bgcolor: 'white', mb: 1 }}
                />
              </Box>
              <Box sx={{ flex: 1, mx: 0.5 }}>
                <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white' }}>
                  <InputLabel>Derived Status</InputLabel>
                  <Select name="derived_status" label="Derived Status" value={formData.derived_status || ''} onChange={handleFormChange}>
                    {statuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <Box sx={{ flex: 1, mx: 0.5 }}>
                <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white' }}>
                  <InputLabel>Size</InputLabel>
                  <Select name="size" label='Size' value={formData.size || ''} onChange={handleFormChange} disabled={isEditing}>
                    {sizes.map((size) => (
                      <MenuItem key={size.value} value={size.value}>{size.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1, mx: 0.5 }}>
                <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white' }}>
                  <InputLabel>Type</InputLabel>
                  <Select name="type" label='Type' value={formData.type || ''} onChange={handleFormChange} disabled={isEditing}>
                    {types.map((type) => (
                      <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            {/* NEW: Physical Location Select */}
            <Box sx={{ mb: 1 }}>
              <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white' }}>
                <InputLabel>Location</InputLabel>
                <Select name="location" label="Location" value={formData.location || 'karachi_port'} onChange={handleFormChange}>
                  {locations.map((loc) => (
                    <MenuItem key={loc.value} value={loc.value}>{loc.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {formData.ownership === 'soc' && (
              <>
                <Box sx={{ mb: 1 }}>
                  <TextField
                    label="Date of Manufacture"
                    name="dateOfManufacture"
                    type="date"
                    value={formData.dateOfManufacture || ''}
                    onChange={handleFormChange}
                    fullWidth
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Purchase Date"
                      name="purchaseDate"
                      type="date"
                      value={formData.purchaseDate || ''}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "row", mx: 0.5 }}>
                    <TextField
                      label="Purchase Price"
                      name="purchasePrice"
                      type="number"
                      value={formData.purchasePrice || ''}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'white', marginRight: 2 }}
                    />
                    <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white', width: 100 }}>
                      <InputLabel>Currency</InputLabel>
                      <Select name="currency" label="Currency" value={formData.currency || 'USD'} onChange={handleFormChange}>
                        {['USD', 'EUR', 'GBP', 'AED', 'PKR', 'SAR', 'INR'].map((curr) => (
                          <MenuItem key={curr} value={curr}>{curr}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white' }}>
                      <TextField
                        label="Purchase From"
                        name="purchaseFrom"
                        type="text"
                        value={formData.purchaseFrom || ''}
                        onChange={handleFormChange}
                        fullWidth
                        required
                        variant="outlined"
                        sx={{ bgcolor: 'white' }}
                      />

                      {/* <InputLabel>Purchase From</InputLabel>
                      <Select name="purchaseFrom" label="Purchase From" value={formData.purchaseFrom || ''} onChange={handleFormChange} disabled={isEditing}>
                        {locations.map((loc) => (
                          <MenuItem key={loc.value} value={loc.value}>{loc.label}</MenuItem>
                        ))}
                      </Select> */}
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Owned By"
                      name="ownershipDetails"
                      value={formData.ownershipDetails || ''}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                </Box>
                {/* NEW: Available At Date for SOC */}
                <Box sx={{ mb: 1 }}>
                  <TextField
                    label="Available At Date"
                    name="availableAtDate"
                    type="date"
                    value={formData.availableAtDate || ''}
                    onChange={handleFormChange}
                    fullWidth
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}></Box>
                  <Box sx={{ flex: 1, mx: 0.5 }} />
                </Box>
              </>
            )}
            {formData.ownership === 'coc' && (
              <>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Hire Start Date"
                      name="hireStartDate"
                      type="date"
                      value={formData.hireStartDate || ''}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Hire End Date"
                      name="hireEndDate"
                      type="date"
                      value={formData.hireEndDate || ''}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Return Date"
                      name="return_date"
                      type="date"
                      value={formData.return_date || ''}
                      onChange={handleFormChange}
                      fullWidth
                      variant="outlined"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Vendor"
                      name="vendor"
                      value={formData.vendor || ''}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', mb: 1 }}></Box>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Place of Loading"
                      name="placeOfLoading"
                      value={formData.placeOfLoading || ''}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Place of Delivery"
                      name="placeOfDelivery"
                      value={formData.placeOfDelivery || ''}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Free Days"
                      name="freeDays"
                      type="number"
                      value={formData.freeDays || ''}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                </Box>
              </>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setOpenAddModal(false);
                  setIsEditing(false);
                  setEditingContainer(null);
                }}
                disabled={loadingForm}
                sx={{ textTransform: 'none', borderColor: '#0d6c6a', color: '#0d6c6a' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleFormSubmit}
                disabled={loadingForm}
                startIcon={loadingForm ? <CircularProgress size={20} /> : null}
                sx={{ color: "#fff", textTransform: 'none', bgcolor: "#f58220", '&:hover': { bgcolor: '#1b5e20' } }}
              >
                {isEditing ? 'Update' : 'Save'}
              </Button>
            </Box>
          </Box>
        </Modal>
{/* Usage History Modal with Loading - Updated for grouped response */}
<Modal open={openHistoryModal} onClose={() => setOpenHistoryModal(false)}>
  <Box sx={{ ...modalStyle, width: { xs: '90%', sm: 1400 }, maxHeight: '90vh', overflowY: 'auto' }}>
    <Typography
      variant="h5"
      gutterBottom
      sx={{ fontWeight: 'bold', color: '#0d6c6a', mb: 2 }}
    >
      Usage History for Container {selectedContainerNo || 'N/A'}
    </Typography>
    <Divider sx={{ mb: 3 }} />
    {loadingHistory ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 1 }}>Loading history...</Typography>
      </Box>
    ) : (
      <Box>
        {(!usageHistory || usageHistory.length === 0) ? (
          <Typography variant="body2" align="center" sx={{ py: 4, color: 'text.secondary' }}>
            No history available
          </Typography>
        ) : (
          usageHistory
            .filter(group => group && group.length > 0) // Filter empty groups
            .map((group, groupIndex) => {
              const firstEvent = group[0] || {}; // Use first event for group metadata
              const jobNo = firstEvent.jobNo || `General Period ${groupIndex + 1}`;
              const pol = firstEvent.pol || 'N/A';
              const pod = firstEvent.pod || 'N/A';
              const linkedOrders = firstEvent.linkedOrders || 'N/A';
              const sortedEvents = [...group].sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime)); // Sort events descending by time
              const earliestEvent = sortedEvents[sortedEvents.length - 1] || {};
              const latestEvent = sortedEvents[0] || {};
              return (
                <Box key={jobNo || `group-${groupIndex}`} sx={{ mb: 3 }}>
                  {/* Group Summary Row */}
                  <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ color: '#0d6c6a', fontWeight: 'bold' }}>
                        Job: {jobNo}
                      </Typography>
                      <Chip label={`Events: ${group.length}`} color="info" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip label={`${pol} → ${pod}`} color="default" size="small" />
                      <Chip label={linkedOrders} color="primary" size="small" />
                      <Chip label={`Start: ${earliestEvent.startDate || 'N/A'}`} color="secondary" size="small" />
                      <Chip label={`End: ${latestEvent.endDate || 'N/A'}`} color="warning" size="small" />
                    </Box>
                  </Paper>

                  {/* Events Sub-Table */}
                  <TableContainer component={Paper} sx={{ boxShadow: 1, borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Event Time</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Summary</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Changed By</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Location</TableCell>
                          <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Order/Receiver</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedEvents.map((event, eventIndex) => (
                          <TableRow key={`${jobNo}-${event.eventTime}-${eventIndex}`} sx={{ '&:hover': { bgcolor: '#e3f2fd' } }}>
                            <TableCell>{event.eventTime || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={event.eventType || 'N/A'} 
                                color={event.eventType === 'CREATION' ? 'success' : event.eventType === 'ASSIGNMENT' ? 'primary' : 'info'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 200, wordBreak: 'break-word' }}>{event.eventSummary || 'N/A'}</TableCell>
                            <TableCell>{event.changedBy || 'System'}</TableCell>
                            <TableCell>{event.location || 'N/A'}</TableCell>
                            <TableCell>{`${event.orderId || 'N/A'}/${event.receiverId || 'N/A'}`}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            })
        )}
      </Box>
    )}
    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
      <Button
        variant="contained"
        startIcon={<CloseIcon />}
        onClick={() => setOpenHistoryModal(false)}
        sx={{ textTransform: 'none', color: "#fff", bgcolor: '#f58220', '&:hover': { bgcolor: '#1565c0' } }}
      >
        Close
      </Button>
    </Box>
  </Box>
</Modal>
        {/* Snackbar */}
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

        {/* Backdrop for global loading */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loadingForm || loadingOptions || loadingContainers}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Box>
    </Box>
  );
};
export default ContainerModule;






