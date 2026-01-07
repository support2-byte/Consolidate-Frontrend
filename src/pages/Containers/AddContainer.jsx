import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Button, TextField, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Typography, Modal, FormControl, InputLabel, Radio, RadioGroup, FormControlLabel, Tooltip, Divider,
  Snackbar, Alert, CircularProgress, Backdrop, Pagination, TablePagination
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate } from 'react-router-dom'; // Add this import at the top of your component file
import HistoryIcon from '@mui/icons-material/History';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CloseIcon from '@mui/icons-material/Close';
import { api } from '../../api'; // Assuming api is configured with baseURL
import SaveIcon from '@mui/icons-material/Save';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);  // Explicitly apply the plugin to jsPDF prototype
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

const   ContainerModule = ({ propContainers = [] }) => {
  const navigate = useNavigate();
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
  const [usageHistory, setUsageHistory] = useState([]);

  // Loading states
  const [loadingContainers, setLoadingContainers] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingReturned, setLoadingReturned] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

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
    derived_status: '',
    location: 'karachi_port',
    dateAdded: new Date().toISOString().split('T')[0],
    dateOfManufacture: new Date().toISOString().split('T')[0],
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    purchaseFrom: '',
    ownershipDetails: 'Self-Owned',
    availableAtDate: new Date().toISOString().split('T')[0],
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
    setError(null);
  };

  const handleError = (error, defaultMessage = 'An unexpected error occurred') => {
    console.error('Error:', error);
    const message = error.response?.data?.error || error.message || defaultMessage;
    setError(message);
    showToast(message, 'error');
  };

  const [places, setPlaces] = useState([]);

  // Helper function to get place name by ID
  const getPlaceName = (placeId) => {
    if (!placeId) return 'N/A';
    const idStr = placeId.toString();
    const place = places.find(p => p.value === idStr || p.id === placeId);
    return place ? place.label : `ID: ${placeId}`;
  };

  const getJobDetails = async (jobNo) => {
    try {
      const response = await api.get(`/api/jobs/${jobNo}`);
      return {
        pol: response.data?.pol,
        pod: response.data?.pod
      };
    } catch (error) {
      console.error(`Error fetching job ${jobNo}:`, error);
      return { pol: null, pod: null };
    }
  };

  // Fetch dynamic options from backend
  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [statusRes, locationRes, sizeRes, typeRes, ownershipRes, placesRes] = await Promise.all([
        api.get('/api/containers/statuses'),
        api.get('/api/containers/locations'),
        api.get('/api/containers/sizes'),
        api.get('/api/containers/types'),
        api.get('/api/containers/ownership-types'),
        api.get('api/options/places/crud')
      ]);
console.log('Fetched options:', { statusRes, locationRes, sizeRes, typeRes, ownershipRes, placesRes });
      // setLocations(locationRes.data || []);
      setSizes(sizeRes.data || []);
      setTypes(typeRes.data || []);
      setOwnershipTypes(ownershipRes.data || []);

      const allPlaces = placesRes?.data?.places || [];
      setPlaces(allPlaces.map(p => ({
        id: p.id,
        value: p.id.toString(),
        label: p.name
      })));

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
    if (value === '' || value === null || value === undefined) return true;
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

  // Fetch container by ID with usage history
  const fetchContainerById = async (cid) => {
    setLoadingHistory(true);
    setUsageHistory([]);

    if (!cid) {
      handleError(new Error('Invalid container ID'));
      setLoadingHistory(false);
      return;
    }

    try {
      const [containerRes, historyRes] = await Promise.all([
        api.get(`/api/containers/${cid}`),
        api.get(`/api/containers/${cid}/usage-history`)
      ]);

      if (containerRes.status !== 200 || historyRes.status !== 200) {
        throw new Error('Failed to fetch container details');
      }

      const data = containerRes.data;
      const groupedHistory = historyRes.data?.groupedByJob;

      const enhancedGroupedHistory = {};

      if (groupedHistory) {
        const jobs = Object.keys(groupedHistory);
        const jobDetailsPromises = jobs.map(jobNo => getJobDetails(jobNo));
        const jobDetailsResults = await Promise.all(jobDetailsPromises);

        const jobDetailsMap = {};
        jobs.forEach((jobNo, index) => {
          jobDetailsMap[jobNo] = jobDetailsResults[index];
        });

        Object.keys(groupedHistory).forEach(jobNo => {
          const jobEvents = groupedHistory[jobNo];
          const correctPolPod = jobDetailsMap[jobNo];

          const enhancedEvents = jobEvents.filter(event =>
            event.eventType === "ASSIGNMENT"
          ).map(event => ({
            ...event,
            pol: correctPolPod.pol || event.pol,
            pod: correctPolPod.pod || event.pod
          }));

          if (enhancedEvents.length > 0) {
            enhancedGroupedHistory[jobNo] = enhancedEvents;
          }
        });
      }
      const historyArray = Object.keys(enhancedGroupedHistory).length > 0
        ? Object.values(enhancedGroupedHistory)
        : [];

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
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    setContainers(filtered.slice(startIndex, endIndex));
  }, []);

  // Handle quick edit
  const handleQuickEdit = (container) => {
    setEditingId(container.cid);
    setTempData({ status: container.derived_status || '', location: container.location || '' });
  };

  // Handle quick save
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
      };
      const response = await api.put(`/api/containers/${cid}`, payload);
      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      showToast('Container updated successfully', 'success');
      setEditingId(null);
      await fetchContainers();
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
console.log('Enhanced Grouped History:', locations);

  // Handle edit container
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
        location: container.location || 'karachi_port',
        dateAdded: new Date().toISOString().split('T')[0],
        dateOfManufacture: container.manufacture_date ? new Date(container.manufacture_date).toISOString().split('T')[0] : '',
        purchaseDate: container.purchase_date ? new Date(container.purchase_date).toISOString().split('T')[0] : '',
        purchasePrice: container.purchase_price || '',
        purchaseFrom: container.purchase_from || '',
        ownershipDetails: container.owned_by || 'Self-Owned',
        availableAtDate: container.available_at ? new Date(container.available_at).toISOString().split('T')[0] : '',
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
  const [historyCid, setHistoryCid] = useState('');
  const openHistory = (cid) => {
    if (!cid) {
      handleError(new Error('Invalid container ID'));
      return;
    }
    setSelectedContainerNo(cid);
    fetchContainerById(cid);
    setHistoryCid(cid);
    setOpenHistoryModal(true);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    if (!e || !e.target) return;
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
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

  // Form validation
  const validateForm = () => {
    const errors = [];

    if (!formData.containerNo.trim()) {
      errors.push('Container Number is required');
    } else if (!validateContainerNumber(formData.containerNo)) {
      errors.push('Container Number must be 4 letters followed by 7 digits (e.g., ABCD1234567)');
    }

    if (!formData.size) {
      errors.push('Size is required');
    }
    if (!formData.type) {
      errors.push('Type is required');
    }

    if (!formData.location || !['karachi_port', 'dubai_port'].includes(formData.location)) {
      errors.push('Valid Location is required (Karachi Port or Dubai Port)');
    }

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

  // Handle form submission
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
      remarks: 'Created/Updated via frontend',
      created_by: 'system',
      location: formData.location,
      manufacture_date: formData.dateOfManufacture,
      purchase_date: formData.purchaseDate,
      purchase_price: parseFloat(formData.purchasePrice) || 0,
      purchase_from: formData.purchaseFrom,
      owned_by: formData.ownershipDetails,
      available_at: formData.availableAtDate,
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
        availableAtDate: new Date().toISOString().split('T')[0],
        currency: 'USD',
        hireStartDate: '',
        hireEndDate: '',
        vendor: '',
        return_date: '',
        freeDays: '',
        placeOfLoading: '',
        placeOfDelivery: ''
      });
      await fetchContainers();
    } catch (error) {
      handleError(error, 'Failed to save container');
    } finally {
      setLoadingForm(false);
    }
  };

  // Mark container as returned
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
        remarks: 'Marked as returned via frontend'
      };
      const response = await api.put(`/api/containers/${cid}`, payload);
      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      await fetchContainers();
      showToast('Container marked as returned successfully', 'success');
    } catch (error) {
      handleError(error, 'Failed to mark as returned');
    } finally {
      setLoadingReturned(prev => ({ ...prev, [cid]: false }));
    }
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

  // Function to generate PDF for full manifest - WITH ORDER PDF STYLE
  const generateFullManifestPDF = async (OrderIds, historyCid) => {
    console.log("Printing for:", { OrderIds, historyCid });

    // Step 1: Properly parse OrderIds
    let orderIdArray = [];

    if (Array.isArray(OrderIds)) {
      orderIdArray = OrderIds;
    } else if (typeof OrderIds === "string") {
      orderIdArray = OrderIds.split(",").map((id) => id.trim());
    } else if (OrderIds) {
      orderIdArray = [OrderIds.toString()];
    }

    // Step 2: Clean each order ID (remove prefix if exists)
    const cleanedOrderIds = orderIdArray.map((id) => {
      const strId = id.toString();
      if (strId.includes("-")) {
        return strId.split("-").slice(1).join("-");
      }
      return strId;
    });

    console.log("Cleaned Order Ids:", cleanedOrderIds);

    if (cleanedOrderIds.length === 0) {
      showToast("No valid order IDs provided", "warning");
      return;
    }

    if (usageHistory.length === 0) {
      showToast("No history data available to print", "warning");
      return;
    }

    setGeneratingPDF(true);
    try {

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
      doc.text(
        "CONTAINER MANIFEST SUMMARY",
        pageWidth - margin,
        10,
        { align: "right" }
      );

      // -------- IMPORTANT: FETCH EACH ORDER SEPARATELY --------
      const allOrdersData = [];
      const allReceivers = [];

      try {
        // Pehle metadata fetch karein (ek baar)
        // const [statusRes, locationRes, sizeRes, typeRes, ownershipRes, placesRes] =
        //   await Promise.all([
        //     api.get("/api/containers/statuses"),
        //     api.get("/api/containers/locations"),
        //     api.get("/api/containers/sizes"),
        //     api.get("/api/containers/types"),
        //     api.get("/api/containers/ownership-types"),
        //     api.get("/api/options/places/crud"),
        //   ]);

        // const places = placesRes.data || [];

        // // Place name getter function
        // window.getPlaceName = (placeId) => {
        //   if (!placeId) return "N/A";
        //   const idStr = placeId.toString();
        //   const place = places.find((p) => p.value === idStr || p.id === placeId);
        //   return place ? place.label : `ID: ${placeId}`;
        // };

        // // Ab har order ke liye alag API call karein
        // console.log(`Fetching ${cleanedOrderIds.length} orders...`);

        for (const orderId of cleanedOrderIds) {
          try {
            console.log(`Fetching order ${orderId}...`);
            const response = await api.get(`/api/orders/${orderId}`, {
              params: {
                includeOrders: true
              }
            });

            if (response.data) {
              allOrdersData.push({
                orderId: orderId,
                data: response.data
              });

              // Collect all receivers from this order
              if (response.data.receivers) {
                response.data.receivers.forEach(receiver => {
                  allReceivers.push({
                    ...receiver,
                    sourceOrderId: orderId,
                    sourceOrderData: response.data
                  });
                });
              }

              console.log(`Order ${orderId} fetched successfully`);
            }
          } catch (orderError) {
            console.error(`Error fetching order ${orderId}:`, orderError);
            // Continue with other orders
          }
        }

        console.log(`Total orders fetched: ${allOrdersData.length}`);
        console.log(`Total receivers found: ${allReceivers.length}`);

      } catch (apiError) {
        console.error("API fetch error:", apiError);
        showToast("Failed to fetch some order data", "error");
      }

      // y = doc.autoTable.previous.finalY + 10;


      // -------- CONTAINER INFO --------
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      // Calculate totals from all receivers
      let totalOrders = 0;
      let totalPackages = 0;
      let totalWeight = 0;

      allReceivers.forEach((receiver) => {
        if (receiver.shippingDetails) {
          totalOrders += receiver.shippingDetails.length;
          receiver.shippingDetails.forEach((item) => {
            totalPackages += item.totalNumber || 0;
            totalWeight += item.weight || 0;
          });
        }
      });

      // Find container number from historyCid
      let matchedContainerNumber = "Not Found";

      // Search in all receivers
      for (const receiver of allReceivers) {
        if (receiver.shippingDetails) {
          for (const item of receiver.shippingDetails) {
            if (item.containerDetails) {
              for (const containerDetail of item.containerDetails) {
                if (containerDetail.container?.cid === historyCid) {
                  matchedContainerNumber = containerDetail.container.container_number;
                  break;
                }
              }
            }
            if (matchedContainerNumber !== "Not Found") break;
          }
        }
        if (matchedContainerNumber !== "Not Found") break;
      }

      // Search in assignmentHistory of all orders
      if (matchedContainerNumber === "Not Found") {
        for (const order of allOrdersData) {
          if (order.data.assignmentHistory) {
            const match = order.data.assignmentHistory.find(
              (a) => a.cid === historyCid
            );
            if (match) {
              matchedContainerNumber = match.container_number;
              break;
            }
          }
        }
      }

      console.log("Matched Container Number:", matchedContainerNumber);

      // Use first order for basic info or combine info
      const firstOrder = allOrdersData.length > 0 ? allOrdersData[0].data : {};

      // Get unique values from all orders (for places, etc.)
      const allPlaceOfLoading = [...new Set(allOrdersData.map(o => o.data.place_of_loading))].filter(Boolean);
      const allPlaceOfDelivery = [...new Set(allOrdersData.map(o => o.data.place_of_delivery))].filter(Boolean);

      // Container Details Cards
      const cards = [
        ["Total Orders in Manifest", cleanedOrderIds.length.toString()],
        ["Container Number", matchedContainerNumber || "N/A"],
        ["Place Of Loading", allPlaceOfLoading.length > 0 ?
          allPlaceOfLoading.map(id => getPlaceName(id)).join(", ") :
          getPlaceName(firstOrder.place_of_loading) || "N/A"],
        ["Place Of Delivery", allPlaceOfDelivery.length > 0 ?
          allPlaceOfDelivery.map(id => getPlaceName(id)).join(", ") :
          getPlaceName(firstOrder.place_of_delivery) || "N/A"],
        ["Total No of Orders", totalOrders || "N/A"],
        ["Total No of Packages", totalPackages || "N/A"],
        ["Total Weight", totalWeight + " Kgs" || "N/A"],
        // ["Generated For Orders", cleanedOrderIds.join(", ")],
      ];

      const cardWidth = (pageWidth - margin * 2 - 12) / 2;
      const cardHeight = 16;

      cards.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + col * (cardWidth + 12);
        const cardY = y + row * (cardHeight + 3);

        doc.setDrawColor(220, 220, 220);
        doc.setFillColor(...brandLight);
        doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "FD");

        doc.setFillColor(...brandPrimary);
        doc.rect(x, cardY, cardWidth, 5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(item[0], x + 3, cardY + 4);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const value = String(item[1] || "Not Found");

        // Long values ke liye text wrap
        const maxWidth = cardWidth - 6;
        const lines = doc.splitTextToSize(value, maxWidth);
        doc.text(lines, x + 3, cardY + 11);
      });

      y += 85;

      // -------- RECEIVERS DETAILS --------
      // Filter receivers that belong to our target orders
      const targetOrderIds = cleanedOrderIds.map(id => id.toString());
      const allReceiversData = [];

      allReceivers.forEach((receiver) => {
        const receiverOrderId = receiver.sourceOrderId ||
          (receiver.order_id ? receiver.order_id.toString() : null);

        // Check if this receiver belongs to any of our target orders
        if (receiverOrderId && targetOrderIds.includes(receiverOrderId)) {
          const shippingDetails = receiver.shippingDetails || [];
          shippingDetails.forEach((detail) => {
            const orderData = receiver.sourceOrderData || firstOrder;

            allReceiversData.push({
              receiverName: receiver.receiver_name || "N/A",
              category: detail.category || "N/A",
              subcategory: detail.subcategory || "N/A",
              type: detail.type || "N/A",
              totalNumber: detail.totalNumber || 0,
              weight: detail.weight || 0,
              itemRef: detail.itemRef || "N/A",
              receiverId: receiver.id,
              orderId: receiverOrderId,
              bookingRef: orderData.booking_ref || "N/A",
              rglBookingNumber: orderData.rgl_booking_number || "N/A",
              senderName: orderData.sender_name || "N/A",
            });
          });
        }
      });

      console.log("Filtered receivers data:", allReceiversData.length);

      if (allReceiversData.length > 0) {
        // ================= FIRST TABLE (Summary by Category) =================
        const categorySummary = {};
        allReceiversData.forEach((receiver) => {
          const key = `${receiver.category}|${receiver.subcategory}|${receiver.type}`;
          if (!categorySummary[key]) {
            categorySummary[key] = {
              category: receiver.category,
              subcategory: receiver.subcategory,
              type: receiver.type,
              totalNumber: 0,
              weight: 0,
            };
          }
          categorySummary[key].totalNumber += Number(receiver.totalNumber || 0);
          categorySummary[key].weight += Number(receiver.weight || 0);
        });

        const tableData = Object.values(categorySummary).map((item) => [
          item.category,
          item.subcategory,
          item.type,
          item.totalNumber.toString(),
          item.weight.toString(),
        ]);

        const totalQuantity = Object.values(categorySummary).reduce(
          (sum, item) => sum + item.totalNumber,
          0
        );
        const totalOrderWeight = Object.values(categorySummary).reduce(
          (sum, item) => sum + item.weight,
          0
        );

        tableData.push([
          {
            content: "TOTAL",
            colSpan: 3,
            styles: {
              halign: "center",
              fontStyle: "bold",
              textColor: [...brandPrimary],
            },
          },
          {
            content: totalQuantity.toString(),
            styles: {
              halign: "left",
              fontStyle: "bold",
            },
          },
          {
            content: totalOrderWeight.toString(),
            styles: {
              halign: "left",
              fontStyle: "bold",
            },
          },
        ]);

        doc.autoTable({
          head: [["Category", "Subcategory", "Type", "Qty", "Weight"]],
          body: tableData,
          startY: y,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak",
            valign: "top",
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: brandPrimary,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            lineWidth: 0.1,
            lineColor: [...brandPrimary],
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 40 },
            2: { cellWidth: 40 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
          },
          margin: { left: margin, right: margin },
          didParseCell: function (data) {
            if (data.section === "body") {
              if (data.row.index % 2 === 0) {
                data.cell.styles.fillColor = [245, 245, 245];
              } else {
                data.cell.styles.fillColor = [255, 255, 255];
              }

              if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = "bold";
                if (data.column.index === 0) {
                  data.cell.styles.textColor = [...brandPrimary];
                }
              }
            }
          },
        });

        y = doc.lastAutoTable.finalY + 8;


        // ===  ============== SECOND TABLE (Detailed List) =================
        const secondTableBody = allReceiversData.map((receiver, index) => [
          index + 1,
          receiver.bookingRef || "-",
          receiver.rglBookingNumber || "-",
          receiver.senderName || "-",
          receiver.receiverName || "-",
          receiver.category || "-",
          receiver.subcategory || "-",
          receiver.type || "-",
          receiver.totalNumber || 0,
          receiver.weight || 0,
        ]);

        const totalQty = allReceiversData.reduce(
          (sum, item) => sum + Number(item.totalNumber || 0),
          0
        );
        const totalWeightSecond = allReceiversData.reduce(
          (sum, item) => sum + Number(item.weight || 0),
          0
        );

        secondTableBody.push([
          {
            content: "TOTAL",
            colSpan: 8,
            styles: {
              halign: "center",
              fontStyle: "bold",
              textColor: [...brandPrimary],
            },
          },
          {
            content: totalQty.toString(),
            styles: {
              halign: "left",
              fontStyle: "bold",
            },
          },
          {
            content: totalWeightSecond.toString(),
            styles: {
              halign: "left",
              fontStyle: "bold",
            },
          },
        ]);

        doc.autoTable({
          startY: y,
          head: [
            [
              "S.No",
              "Order No",
              "RGSL",
              "Sender",
              "Receiver",
              "Category",
              "Sub Category",
              "Type",
              "Qty",
              "Weight",
            ],
          ],
          body: secondTableBody,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak",
            valign: "top",
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: brandPrimary,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            lineWidth: 0.1,
            lineColor: [...brandPrimary],
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 15 },
            2: { cellWidth: 21 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25 },
            5: { cellWidth: 23 },
            6: { cellWidth: 20 },
            7: { cellWidth: 17 },
            8: { cellWidth: 13 },
            9: { cellWidth: 16 },
          },
          margin: { left: margin, right: margin },
          didParseCell: function (data) {
            if (data.section === "body") {
              if (data.row.index === secondTableBody.length - 1) return;

              if (data.row.index % 2 === 0) {
                data.cell.styles.fillColor = [245, 245, 245];
              } else {
                data.cell.styles.fillColor = [255, 255, 255];
              }
            }
          },
        });
      } else {
        // No data found
        doc.setFont("helvetica", "italic").setFontSize(10);
        doc.setTextColor(150, 0, 0);
        doc.text(
          "No receiver details found for the selected orders",
          margin,
          y
        );
        y += 8;

        doc.setFont("helvetica", "normal").setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(`Orders requested: ${cleanedOrderIds.join(", ")}`, margin, y);
        y += 5;
        doc.text(`Orders fetched successfully: ${allOrdersData.length}`, margin, y);
      }

      // -------- FOOTER --------
      const totalPages = doc.internal.getNumberOfPages();
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        const footerY = 285;
        doc.setFont("helvetica", "normal").setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Container: ${matchedContainerNumber || "N/A"}`,
          margin,
          footerY
        );
        doc.text(
          `Page ${pageNum} of ${totalPages}`,
          pageWidth - margin,
          footerY,
          { align: "right" }
        );
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          footerY,
          { align: "center" }
        );
      }

      // -------- SAVE PDF --------
      const fileName = `Container_Manifest_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      showToast(`PDF generated for ${allOrdersData.length} order(s)!`, "success");

    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast("Error generating PDF: " + error.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Update your generateSingleJobManifestPDF function to be more reusable
  const generateSingleJobManifestPDF = async (jobEvents, containerNumber, jobNo, pol, pod, linkedOrders) => {
    console.log("Printing single job:", jobNo);

    if (!jobEvents || jobEvents.length === 0) {
      showToast("No data available for this job", "warning");
      return;
    }

    setGeneratingPDF(true);
    try {
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
      doc.text(
        "CONTAINER MANIFEST",
        pageWidth - margin,
        10,
        { align: "right" }
      );

      doc.setFont("helvetica", "normal").setFontSize(12);
      doc.text(`Job: ${jobNo}`, pageWidth - margin, 18, { align: "right" });

      // -------- CONTAINER INFO --------
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      // Get job summary
      const firstEvent = jobEvents[0];
      const jobStartDate = jobEvents[jobEvents.length - 1]?.eventTime || 'N/A';
      const jobEndDate = jobEvents[0]?.eventTime || 'N/A';

      // Container Details Cards
      const cards = [
        ["Job Number", jobNo],
        ["Container Number", containerNumber || "N/A"],
        ["Place Of Loading", getPlaceName(pol) || "N/A"],
        ["Place Of Delivery", getPlaceName(pod) || "N/A"],
        ["Linked Orders", linkedOrders || "N/A"],
        ["Job Start Date", jobStartDate ? new Date(jobStartDate).toLocaleDateString() : 'N/A'],
        ["Job End Date", jobEndDate ? new Date(jobEndDate).toLocaleDateString() : 'N/A'],
        ["Total Events", jobEvents.length.toString()],
      ];

      const cardWidth = (pageWidth - margin * 2 - 12) / 2;
      const cardHeight = 16;

      cards.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + col * (cardWidth + 12);
        const cardY = y + row * (cardHeight + 3);

        doc.setDrawColor(220, 220, 220);
        doc.setFillColor(...brandLight);
        doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "FD");

        doc.setFillColor(...brandPrimary);
        doc.rect(x, cardY, cardWidth, 5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(item[0], x + 3, cardY + 4);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const value = String(item[1] || "Not Found");

        const maxWidth = cardWidth - 6;
        const lines = doc.splitTextToSize(value, maxWidth);
        doc.text(lines, x + 3, cardY + 11);
      });

      y += cards.length / 2 * (cardHeight + 3) + 10;

      // -------- JOB EVENTS TABLE --------
      if (jobEvents.length > 0) {
        const tableData = jobEvents.map((event, index) => [
          index + 1,
          event.eventTime ? new Date(event.eventTime).toLocaleString() : 'N/A',
          event.eventType || 'N/A',
          event.eventSummary || 'N/A',
          event.changedBy || 'System',
          event.orderId || 'N/A',
          event.receiverId || 'N/A',
        ]);

        doc.autoTable({
          head: [["S.No", "Event Time", "Type", "Summary", "Changed By", "Order", "Receiver"]],
          body: tableData,
          startY: y,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak",
            valign: "top",
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: brandPrimary,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            lineWidth: 0.1,
            lineColor: [...brandPrimary],
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 30 },
            2: { cellWidth: 20 },
            3: { cellWidth: 40 },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 },
            6: { cellWidth: 20 },
          },
          margin: { left: margin, right: margin },
        });
      }

      // -------- FOOTER --------
      const totalPages = doc.internal.getNumberOfPages();
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFont("helvetica", "normal").setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Container: ${containerNumber || "N/A"} | Job: ${jobNo} | Events: ${jobEvents.length}`,
          margin,
          footerY
        );
        doc.text(
          `Page ${pageNum} of ${totalPages}`,
          pageWidth - margin,
          footerY,
          { align: "right" }
        );
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          footerY,
          { align: "center" }
        );
      }

      // -------- SAVE PDF --------
      const fileName = `Container_${containerNumber}_Job_${jobNo}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      showToast(`PDF generated for Job ${jobNo}!`, "success");

    } catch (error) {
      console.error("Error generating single job PDF:", error);
      showToast("Error generating PDF: " + error.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Function to generate detailed manifest PDF for a single job (with order details)
  const generateJobDetailManifestPDF = async (jobNo, pol, pod, linkedOrders, jobEvents) => {
    console.log("Generating detailed manifest for job:", jobNo);

    if (!linkedOrders) {
      showToast("No linked orders found for this job", "warning");
      return;
    }

    setGeneratingPDF(true);
    try {
      // Clean order IDs
      let orderIdArray = [];
      if (typeof linkedOrders === "string") {
        orderIdArray = linkedOrders.split(",").map((id) => id.trim());
      } else if (Array.isArray(linkedOrders)) {
        orderIdArray = linkedOrders;
      }

      const cleanedOrderIds = orderIdArray.map((id) => {
        const strId = id.toString();
        if (strId.includes("-")) {
          return strId.split("-").slice(1).join("-");
        }
        return strId;
      });

      if (cleanedOrderIds.length === 0) {
        showToast("No valid order IDs found for this job", "warning");
        return;
      }

      // Fetch order data for this job
      const allOrdersData = [];
      const allReceivers = [];

      for (const orderId of cleanedOrderIds) {
        try {
          console.log(`Fetching order ${orderId} for job ${jobNo}...`);
          const response = await api.get(`/api/orders/${orderId}`, {
            params: {
              includeOrders: true
            }
          });

          if (response.data) {
            allOrdersData.push({
              orderId: orderId,
              data: response.data
            });

            if (response.data.receivers) {
              response.data.receivers.forEach(receiver => {
                allReceivers.push({
                  ...receiver,
                  sourceOrderId: orderId,
                  sourceOrderData: response.data
                });
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching order ${orderId}:`, error);
        }
      }

      // Create PDF (similar to your existing full manifest but for single job)
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const brandPrimary = [13, 108, 106];
      const brandLight = [220, 245, 243];
      let y = 30;

      // Find container number from historyCid
      let matchedContainerNumber = "Not Found";

      // Search in all receivers
      for (const receiver of allReceivers) {
        if (receiver.shippingDetails) {
          for (const item of receiver.shippingDetails) {
            if (item.containerDetails) {
              for (const containerDetail of item.containerDetails) {
                if (containerDetail.container?.cid === historyCid) {
                  matchedContainerNumber = containerDetail.container.container_number;
                  break;
                }
              }
            }
            if (matchedContainerNumber !== "Not Found") break;
          }
        }
        if (matchedContainerNumber !== "Not Found") break;
      }

      // Search in assignmentHistory of all orders
      if (matchedContainerNumber === "Not Found") {
        for (const order of allOrdersData) {
          if (order.data.assignmentHistory) {
            const match = order.data.assignmentHistory.find(
              (a) => a.cid === historyCid
            );
            if (match) {
              matchedContainerNumber = match.container_number;
              break;
            }
          }
        }
      }

      // Header
      const logoBase64 = await loadImageAsBase64("./logo-2.png");
      if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 4, 60, 12);

      doc.setFont("helvetica", "bold").setFontSize(16);
      doc.setTextColor(...brandPrimary);
      doc.text("JOB MANIFEST", pageWidth - margin, 10, { align: "right" });

      doc.setFont("helvetica", "normal").setFontSize(12);
      doc.text(`Job: ${jobNo}`, pageWidth - margin, 18, { align: "right" });

      // Job Summary
      const cards = [
        ["Job Number", jobNo],
        ["Container Number", selectedContainerNo || "N/A"],
        ["Place Of Loading", getPlaceName(pol) || "N/A"],
        ["Place Of Delivery", getPlaceName(pod) || "N/A"],
        ["Linked Orders", cleanedOrderIds.join(", ")],
        ["Total Orders in Job", allOrdersData.length.toString()],
        ["Generated On", new Date().toLocaleDateString()],
      ];

      const cardWidth = (pageWidth - margin * 2 - 12) / 2;
      const cardHeight = 16;

      cards.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + col * (cardWidth + 12);
        const cardY = y + row * (cardHeight + 3);

        doc.setDrawColor(220, 220, 220);
        doc.setFillColor(...brandLight);
        doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "FD");

        doc.setFillColor(...brandPrimary);
        doc.rect(x, cardY, cardWidth, 5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(item[0], x + 3, cardY + 4);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const value = String(item[1] || "Not Found");
        const maxWidth = cardWidth - 6;
        const lines = doc.splitTextToSize(value, maxWidth);
        doc.text(lines, x + 3, cardY + 11);
      });

      y += 85;

      // -------- RECEIVERS DETAILS --------
      // Filter receivers that belong to our target orders
      const targetOrderIds = cleanedOrderIds.map(id => id.toString());
      const allReceiversData = [];

      allReceivers.forEach((receiver) => {
        const receiverOrderId = receiver.sourceOrderId ||
          (receiver.order_id ? receiver.order_id.toString() : null);

        // Check if this receiver belongs to any of our target orders
        if (receiverOrderId && targetOrderIds.includes(receiverOrderId)) {
          const shippingDetails = receiver.shippingDetails || [];
          shippingDetails.forEach((detail) => {
            const orderData = receiver.sourceOrderData || firstOrder;

            allReceiversData.push({
              receiverName: receiver.receiver_name || "N/A",
              category: detail.category || "N/A",
              subcategory: detail.subcategory || "N/A",
              type: detail.type || "N/A",
              totalNumber: detail.totalNumber || 0,
              weight: detail.weight || 0,
              itemRef: detail.itemRef || "N/A",
              receiverId: receiver.id,
              orderId: receiverOrderId,
              bookingRef: orderData.booking_ref || "N/A",
              rglBookingNumber: orderData.rgl_booking_number || "N/A",
              senderName: orderData.sender_name || "N/A",
            });
          });
        }
      });

      console.log("Filtered receivers data:", allReceiversData.length);

      if (allReceiversData.length > 0) {
        // ================= FIRST TABLE (Summary by Category) =================
        const categorySummary = {};
        allReceiversData.forEach((receiver) => {
          const key = `${receiver.category}|${receiver.subcategory}|${receiver.type}`;
          if (!categorySummary[key]) {
            categorySummary[key] = {
              category: receiver.category,
              subcategory: receiver.subcategory,
              type: receiver.type,
              totalNumber: 0,
              weight: 0,
            };
          }
          categorySummary[key].totalNumber += Number(receiver.totalNumber || 0);
          categorySummary[key].weight += Number(receiver.weight || 0);
        });

        const tableData = Object.values(categorySummary).map((item) => [
          item.category,
          item.subcategory,
          item.type,
          item.totalNumber.toString(),
          item.weight.toString(),
        ]);

        const totalQuantity = Object.values(categorySummary).reduce(
          (sum, item) => sum + item.totalNumber,
          0
        );
        const totalOrderWeight = Object.values(categorySummary).reduce(
          (sum, item) => sum + item.weight,
          0
        );

        tableData.push([
          {
            content: "TOTAL",
            colSpan: 3,
            styles: {
              halign: "center",
              fontStyle: "bold",
              textColor: [...brandPrimary],
            },
          },
          {
            content: totalQuantity.toString(),
            styles: {
              halign: "left",
              fontStyle: "bold",
            },
          },
          {
            content: totalOrderWeight.toString(),
            styles: {
              halign: "left",
              fontStyle: "bold",
            },
          },
        ]);

        doc.autoTable({
          head: [["Category", "Subcategory", "Type", "Qty", "Weight"]],
          body: tableData,
          startY: y,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak",
            valign: "top",
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: brandPrimary,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            lineWidth: 0.1,
            lineColor: [...brandPrimary],
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 40 },
            2: { cellWidth: 40 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
          },
          margin: { left: margin, right: margin },
          didParseCell: function (data) {
            if (data.section === "body") {
              if (data.row.index % 2 === 0) {
                data.cell.styles.fillColor = [245, 245, 245];
              } else {
                data.cell.styles.fillColor = [255, 255, 255];
              }

              if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = "bold";
                if (data.column.index === 0) {
                  data.cell.styles.textColor = [...brandPrimary];
                }
              }
            }
          },
        });

        y = doc.lastAutoTable.finalY + 8;


        // ===  ============== SECOND TABLE (Detailed List) =================
        const secondTableBody = allReceiversData.map((receiver, index) => [
          index + 1,
          receiver.bookingRef || "-",
          receiver.rglBookingNumber || "-",
          receiver.senderName || "-",
          receiver.receiverName || "-",
          receiver.category || "-",
          receiver.subcategory || "-",
          receiver.type || "-",
          receiver.totalNumber || 0,
          receiver.weight || 0,
        ]);

        const totalQty = allReceiversData.reduce(
          (sum, item) => sum + Number(item.totalNumber || 0),
          0
        );
        const totalWeightSecond = allReceiversData.reduce(
          (sum, item) => sum + Number(item.weight || 0),
          0
        );

        secondTableBody.push([
          {
            content: "TOTAL",
            colSpan: 8,
            styles: {
              halign: "center",
              fontStyle: "bold",
              textColor: [...brandPrimary],
            },
          },
          {
            content: totalQty.toString(),
            styles: {
              halign: "left",
              fontStyle: "bold",
            },
          },
          {
            content: totalWeightSecond.toString(),
            styles: {
              halign: "left",
              fontStyle: "bold",
            },
          },
        ]);

        doc.autoTable({
          startY: y,
          head: [
            [
              "S.No",
              "Order No",
              "RGSL",
              "Sender",
              "Receiver",
              "Category",
              "Sub Category",
              "Type",
              "Qty",
              "Weight",
            ],
          ],
          body: secondTableBody,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak",
            valign: "top",
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: brandPrimary,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            lineWidth: 0.1,
            lineColor: [...brandPrimary],
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 15 },
            2: { cellWidth: 21 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25 },
            5: { cellWidth: 23 },
            6: { cellWidth: 20 },
            7: { cellWidth: 17 },
            8: { cellWidth: 13 },
            9: { cellWidth: 16 },
          },
          margin: { left: margin, right: margin },
          didParseCell: function (data) {
            if (data.section === "body") {
              if (data.row.index === secondTableBody.length - 1) return;

              if (data.row.index % 2 === 0) {
                data.cell.styles.fillColor = [245, 245, 245];
              } else {
                data.cell.styles.fillColor = [255, 255, 255];
              }
            }
          },
        });
      } else {
        // No data found
        doc.setFont("helvetica", "italic").setFontSize(10);
        doc.setTextColor(150, 0, 0);
        doc.text(
          "No receiver details found for the selected orders",
          margin,
          y
        );
        y += 8;

        doc.setFont("helvetica", "normal").setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(`Orders requested: ${cleanedOrderIds.join(", ")}`, margin, y);
        y += 5;
        doc.text(`Orders fetched successfully: ${allOrdersData.length}`, margin, y);
      }

      // -------- FOOTER --------
      const totalPages = doc.internal.getNumberOfPages();
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        const footerY = 285;
        doc.setFont("helvetica", "normal").setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Container: ${matchedContainerNumber || "N/A"}`,
          margin,
          footerY
        );
        doc.text(
          `Page ${pageNum} of ${totalPages}`,
          pageWidth - margin,
          footerY,
          { align: "right" }
        );
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          footerY,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `Job_${jobNo}_Manifest_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      showToast(`Job ${jobNo} manifest generated!`, "success");

    } catch (error) {
      console.error("Error generating job manifest PDF:", error);
      showToast("Error generating PDF: " + error.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };


  const generateStatusHistoryPDF = async (containerNumber) => {
    console.log("Generating status history PDF for container:", containerNumber);

    if (!historyCid) {
      showToast("Container ID not found", "error");
      return;
    }

    setGeneratingPDF(true);
    try {
      // API call to fetch status history
      const response = await api.get(`/api/containers/${historyCid}/usage-history`);

      if (!response.data || !response.data.containerStatusHistory) {
        throw new Error('No status history data available');
      }

      const statusHistory = response.data.containerStatusHistory.events;
      const totalRecords = response.data.containerStatusHistory.totalRecords;

      if (!statusHistory || statusHistory.length === 0) {
        throw new Error('No status history records found');
      }

      // Create PDF document (same as above code)
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
      doc.text(
        "CONTAINER STATUS HISTORY REPORT",
        pageWidth - margin,
        10,
        { align: "right" }
      );

      doc.setFont("helvetica", "normal").setFontSize(12);
      doc.text(`Container: ${containerNumber}`, pageWidth - margin, 18, { align: "right" });


      // -------- SUMMARY SECTION --------
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      // Sort events by date (newest first)
      const sortedStatusHistory = [...statusHistory].sort((a, b) =>
        new Date(b.createdTime) - new Date(a.createdTime)
      );

      const firstStatus = sortedStatusHistory[sortedStatusHistory.length - 1];
      const latestStatus = sortedStatusHistory[0];

      // Get unique statuses
      const uniqueStatuses = [...new Set(statusHistory.map(s => s.status))];

      // Get unique locations
      const uniqueLocations = [...new Set(statusHistory.map(s => s.location))].filter(Boolean);

      // Summary Cards
      const summaryCards = [
        ["Container Number", containerNumber],
        ["Total Status Changes", totalRecords.toString()],
        ["First Status Date", firstStatus?.createdTime ? new Date(firstStatus.createdTime).toLocaleDateString() : "N/A"],
        ["Latest Status Date", latestStatus?.createdTime ? new Date(latestStatus.createdTime).toLocaleDateString() : "N/A"],
        ["Status Types", uniqueStatuses.length.toString()],
        ["Locations Used", uniqueLocations.length.toString()],
      ];

      const cardWidth = (pageWidth - margin * 2 - 12) / 2;
      const cardHeight = 16;

      summaryCards.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + col * (cardWidth + 12);
        const cardY = y + row * (cardHeight + 3);

        doc.setDrawColor(220, 220, 220);
        doc.setFillColor(...brandLight);
        doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "FD");

        doc.setFillColor(...brandPrimary);
        doc.rect(x, cardY, cardWidth, 5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(item[0], x + 3, cardY + 4);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const value = String(item[1] || "N/A");
        const maxWidth = cardWidth - 6;
        const lines = doc.splitTextToSize(value, maxWidth);
        doc.text(lines, x + 3, cardY + 11);
      });

      y += (summaryCards.length / 2) * (cardHeight + 3) +5;

      // -------- STATUS PROGRESSION TIMELINE --------
      if (statusHistory.length > 0) {
        doc.setFont("helvetica", "bold").setFontSize(12);
        doc.setTextColor(...brandPrimary);
        doc.text("STATUS CHANGE TIMELINE", margin, y);
        y += 10;

        // Timeline ko page width ke hisaab se adjust karo
        const timelineStartY = y;
        const timelineWidth = pageWidth - 2 * margin - 30;
        const maxEventsPerRow = 7; // Ek row mein kitne events dikhaye

        // Sort events chronologically
        const chronologicalEvents = [...statusHistory].sort((a, b) =>
          new Date(a.createdTime) - new Date(b.createdTime)
        );

        // Multiple rows mein divide karo agar zyada events hain
        const rows = Math.ceil(chronologicalEvents.length / maxEventsPerRow);
        const rowHeight = 25;

        for (let row = 0; row < rows; row++) {
          const startIdx = row * maxEventsPerRow;
          const endIdx = Math.min(startIdx + maxEventsPerRow, chronologicalEvents.length);
          const rowEvents = chronologicalEvents.slice(startIdx, endIdx);

          // Har row ke liye timeline line
          doc.setDrawColor(...brandPrimary);
          doc.setLineWidth(0.5);
          const rowY = timelineStartY + (row * rowHeight);
          doc.line(margin + 15, rowY, margin + 15 + timelineWidth, rowY);

          // Events in this row
          rowEvents.forEach((event, idx) => {
            const totalEventsInRow = rowEvents.length;
            const eventDate = new Date(event.createdTime);

            // Calculate position
            const xPos = margin + 15 + (timelineWidth * (idx / (totalEventsInRow - 1 || 1)));

            // Timeline point
            doc.setFillColor(...brandPrimary);
            doc.circle(xPos, rowY, 2.5, 'F');

            // Status above the line
            doc.setFont("helvetica", "bold").setFontSize(8);
            doc.setTextColor(...brandPrimary);
            const status = event.status || 'Unknown';
            const statusWidth = doc.getTextWidth(status);
            doc.text(status, xPos - (statusWidth / 2), rowY - 5);

            // Date below the line
            doc.setFont("helvetica", "normal").setFontSize(7);
            doc.setTextColor(100, 100, 100);
            const dateStr = eventDate.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short'
            });
            const dateWidth = doc.getTextWidth(dateStr);
            doc.text(dateStr, xPos - (dateWidth / 2), rowY + 7);

            // Time below date (smaller)
            doc.setFontSize(6);
            const timeStr = eventDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
            const timeWidth = doc.getTextWidth(timeStr);
            doc.text(timeStr, xPos - (timeWidth / 2), rowY + 11);
          });
        }

        y = timelineStartY + (rows * rowHeight) ;
      }

      // -------- DETAILED STATUS CHANGES TABLE --------
      if (statusHistory.length > 0) {
        doc.setFont("helvetica", "bold").setFontSize(12);
        doc.setTextColor(...brandPrimary);
        doc.text("DETAILED STATUS HISTORY", margin, y);
        y += 5;

        const tableData = statusHistory.map((event, index) => {
          const eventDate = new Date(event.createdTime);

          return [
            index + 1,
            eventDate.toLocaleDateString(),
            eventDate.toLocaleTimeString(),
            event.status || "N/A",
            event.location || "N/A",
            event.createdBy || "System",
            event.notes || "No notes",
          ];
        });

        doc.autoTable({
          head: [["S.No", "Date", "Time", "Status", "Location", "Changed By", "Notes"]],
          body: tableData,
          startY: y,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak",
            valign: "top",
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: brandPrimary,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            lineWidth: 0.1,
            lineColor: [...brandPrimary],
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: {
              cellWidth: 25,
              fontStyle: "bold"
            },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 },
            6: { cellWidth: pageWidth - 2 * margin - 127 },
          },
          margin: { left: margin, right: margin },
          didParseCell: function (data) {
            if (data.section === "body") {
              // Alternate row colors
              if (data.row.index % 2 === 0) {
                data.cell.styles.fillColor = [245, 245, 245];
              } else {
                data.cell.styles.fillColor = [255, 255, 255];
              }

              // Highlight status column with colors
              if (data.column.index === 3) {
                const status = data.cell.text[0];
                const statusColor = getStatusColor(status);

              }
            }
          },
        });
      }

      // -------- FOOTER --------
      const totalPages = doc.internal.getNumberOfPages();
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        const footerY = doc.internal.pageSize.getHeight() - 10;

        doc.setFont("helvetica", "normal").setFontSize(8);
        doc.setTextColor(100, 100, 100);

        doc.text(
          `Container: ${containerNumber} | Status Changes: ${totalRecords}`,
          margin,
          footerY
        );

        doc.text(
          `Page ${pageNum} of ${totalPages}`,
          pageWidth - margin,
          footerY,
          { align: "right" }
        );

        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          footerY,
          { align: "center" }
        );
      }

      const fileName = `Container_${containerNumber}_Status_History_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      showToast(`Status history PDF generated for ${containerNumber}! (${totalRecords} records)`, "success");

    } catch (error) {
      console.error("Error generating status history PDF:", error);
      showToast("Error generating PDF: " + error.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };



  console.log('Containers state:', containers);
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f5f5f5', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ maxWidth: 1450, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f58220' }}>
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

        {/* Filters */}
        <Box sx={{ display: 'flex', flexWrap: 'nowrap', justifyContent: "space-between", mb: 2, gap: 1 }}>
          {/* Filter components (same as before) */}
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
          {/* ... other filters ... */}
        </Box>

        {/* Table */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto', boxShadow: 3, borderRadius: 2 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Container No.</TableCell>
                  <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Size</TableCell>
                  <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Ownership</TableCell>
                  <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Location</TableCell>
                  <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Last Used</TableCell>
                  <TableCell sx={{ bgcolor: '#0d6c6a', color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingContainers ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                      <Typography variant="body2" sx={{ ml: 1 }}>Loading containers...</Typography>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'error.main' }}>
                      <Typography variant="body2">{error}</Typography>
                      <Button onClick={fetchContainers} sx={{ mt: 1 }}>Retry</Button>
                    </TableCell>
                  </TableRow>
                ) : containers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2">No containers found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  containers.map((container, index) => {
                    const isEditing = editingId === container.cid;
                    const currentStatus = isEditing ? tempData.status : (container.derived_status || 'N/A');
                    const currentLocation = isEditing ? tempData.location : (container.location || 'N/A');
                    const statusColor = statuses.find(s => s.value === currentStatus)?.color || 'default';

                    return (
                      <TableRow key={container.cid || index} sx={{ bgcolor: index % 2 === 0 ? '#f9f9f9' : 'white', '&:hover': { bgcolor: '#e3f2fd' } }}>
                        <TableCell sx={{ cursor: 'pointer', color: '#0d6c6a', '&:hover': { textDecoration: 'underline' } }} onClick={() => openHistory(container.cid)}>
                          {container.container_number || 'N/A'}
                        </TableCell>
                        <TableCell>{container.container_size || 'N/A'}</TableCell>
                        <TableCell>{container.container_type || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip label={container.owner_type === 'soc' ? 'Own' : 'Hired'} color={container.owner_type === 'soc' ? 'success' : 'info'} size="small" sx={{ fontWeight: 'bold' }} />
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select value={currentStatus} onChange={(e) => setTempData({ ...tempData, status: e.target.value })} displayEmpty>
                                {statuses.map((status) => (
                                  <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Chip label={currentStatus} color={statusColor} size="small" sx={{ fontWeight: 'bold' }} />
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select value={currentLocation} onChange={(e) => setTempData({ ...tempData, location: e.target.value })} displayEmpty>
                                <MenuItem value="">Select Location</MenuItem>
                                {locations.map((loc) => (
                                  <MenuItem key={loc.value} value={loc.value}>{loc.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            currentLocation
                          )}
                        </TableCell>
                        <TableCell>{container.created_time ? new Date(container.created_time).toLocaleDateString() : '–'}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Save">
                                <IconButton onClick={() => handleQuickSave(container.cid)} disabled={loadingUpdate} size="small">
                                  {loadingUpdate ? <CircularProgress size={16} /> : <SaveIcon />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancel">
                                <IconButton onClick={handleQuickCancel} size="small"><CloseIcon /></IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <>
                              <Tooltip title="Quick Update Status & Location">
                                <IconButton onClick={() => handleQuickEdit(container)} sx={{ color: '#0d6c6a' }} size="small">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Container Details">
                                <IconButton onClick={() => handleEdit(container)} sx={{ color: '#f58220' }} size="small">
                                  <EditNoteIcon fontSize="large" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View History">
                                <IconButton onClick={() => openHistory(container.cid)} sx={{ color: '#0d6c6a' }} disabled={loadingHistory}>
                                  {loadingHistory ? <CircularProgress size={16} /> : <HistoryIcon />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={container.derived_status !== 'Cleared' ? 'Container must be Cleared to mark Returned' : 'Mark as Returned'}>
                                <span>
                                  <Button disabled={container.derived_status !== 'Cleared' || loadingReturned[container.cid]} onClick={() => markReturned(container.cid)} size="small" startIcon={loadingReturned[container.cid] ? <CircularProgress size={16} /> : null} sx={{ textTransform: 'none', color: '#0d6c6a' }}>
                                    Mark Returned
                                  </Button>
                                </span>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
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

        {/* Add Container Modal */}
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
  <Select
    name="location"
    label="Location"
    value={formData.location || 'karachi_port'}
    onChange={handleFormChange}
  >
    <MenuItem value="karachi_port">Karachi Port</MenuItem>
    <MenuItem value="dubai_port">Dubai Port</MenuItem>
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

        {/* Usage History Modal with PDF Generation */}
        {/* Usage History Modal */}
        <Modal open={openHistoryModal} onClose={() => setOpenHistoryModal(false)}>
          <Box sx={{ ...modalStyle, width: { xs: '90%', sm: 1400 }, maxHeight: '90vh', overflowY: 'auto' }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
              mb: 2
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: '#0d6c6a',
                  mb: { xs: 1, sm: 2 }
                }}
              >
                Usage History for Container {selectedContainerNo || 'N/A'}
              </Typography>


              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* Status History Button */}
                <Tooltip title="Print Status Change History">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => generateStatusHistoryPDF(selectedContainerNo)}
                    disabled={generatingPDF || usageHistory.length === 0}
                    sx={{
                      borderRadius: 2,
                      borderColor: "#0d6c6a",
                      color: "#0d6c6a",
                      '&:hover': {
                        backgroundColor: 'rgba(13, 108, 106, 0.1)'
                      }
                    }}
                  >
                    {generatingPDF ? 'Generating...' : 'Print Status History'}
                  </Button>
                </Tooltip>

                {/* Full Manifest Button */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    const allLinkedOrders = usageHistory
                      .filter(group => Array.isArray(group) && group.length > 0)
                      .map(group => group[0]?.linkedOrders)
                      .filter(Boolean);
                    generateFullManifestPDF(allLinkedOrders, historyCid);
                  }}
                  disabled={generatingPDF || usageHistory.length === 0}
                  sx={{
                    borderRadius: 2,
                    borderColor: "#f58220",
                    color: "#f58220",
                    '&:hover': {
                      backgroundColor: 'rgba(245, 130, 32, 0.1)'
                    }
                  }}
                >
                  {generatingPDF ? 'Generating...' : 'Print Full Manifest'}
                </Button>
              </Box>

              {/* Full Manifest Button */}
              {/* <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  const allLinkedOrders = usageHistory
                    .filter(group => Array.isArray(group) && group.length > 0)
                    .map(group => group[0]?.linkedOrders)
                    .filter(Boolean);
                  generateFullManifestPDF(allLinkedOrders, historyCid);
                }}
                disabled={generatingPDF || usageHistory.length === 0}
                sx={{
                  borderRadius: 2,
                  borderColor: "#f58220",
                  color: "#f58220",
                  alignSelf: { xs: 'flex-start', sm: 'center' }
                }}
              >
                {generatingPDF ? 'Generating...' : 'Print Full Manifest'}
              </Button> */}
            </Box>
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
                    No assignment history available
                  </Typography>
                ) : (
                  usageHistory
                    .filter(group => group && group.length > 0)
                    .map((group, groupIndex) => {
                      const filteredGroup = group.filter(event => event.eventType === "ASSIGNMENT");
                      if (filteredGroup.length === 0) return null;

                      const firstEvent = filteredGroup[0];
                      const jobNo = firstEvent.jobNo || `General Period ${groupIndex + 1}`;
                      const pol = firstEvent.pol || 'N/A';
                      const pod = firstEvent.pod || 'N/A';
                      const linkedOrders = firstEvent.linkedOrders || 'N/A';
                      const sortedEvents = [...group].sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));
                      const earliestEvent = sortedEvents[sortedEvents.length - 1] || {};
                      const latestEvent = sortedEvents[0] || {};

                      return (
                        <Box key={jobNo || `group-${groupIndex}`} sx={{ mb: 3 }}>
                          {/* Group Summary Row with Print Button */}
                          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" sx={{ color: '#0d6c6a', fontWeight: 'bold' }}>
                                Job: {jobNo}
                              </Typography>

                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip label={`Events: ${group.length}`} color="info" size="small" />

                                {/* Single Job Print Button */}
                                <Tooltip title="Print this job only">
                                  <IconButton
                                    size="small"
                                    onClick={() => generateSingleJobManifestPDF(
                                      group,
                                      selectedContainerNo,
                                      jobNo,
                                      pol,
                                      pod,
                                      linkedOrders
                                    )}
                                    disabled={generatingPDF}
                                    sx={{
                                      color: '#0d6c6a',
                                      '&:hover': {
                                        backgroundColor: 'rgba(13, 108, 106, 0.1)'
                                      }
                                    }}
                                  >
                                    {generatingPDF ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <DownloadIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>

                                {/* Detailed Manifest Button (if you want both options) */}
                                <Tooltip title="Print detailed manifest">
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => generateJobDetailManifestPDF(
                                      jobNo,
                                      pol,
                                      pod,
                                      linkedOrders,
                                      group
                                    )}
                                    disabled={generatingPDF}
                                    sx={{
                                      borderRadius: 1,
                                      borderColor: "#f58220",
                                      color: "#f58220",
                                      fontSize: '0.75rem',
                                      py: 0.5,
                                      px: 1
                                    }}
                                  >
                                    Manifest
                                  </Button>
                                </Tooltip>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Chip label={`${getPlaceName(pol)} → ${getPlaceName(pod)}`} color="default" size="small" />
                              <Chip label={`Orders: ${linkedOrders}`} color="primary" size="small" />
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
                                  <TableRow key={`${jobNo}-${event.eventTime}-${eventIndex}`}>
                                    <TableCell>{event.eventTime ? new Date(event.eventTime).toLocaleString() : 'N/A'}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={event.eventType || 'N/A'}
                                        color={event.eventType === 'CREATION' ? 'success' : event.eventType === 'ASSIGNMENT' ? 'primary' : 'info'}
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                                      {event.eventSummary || 'N/A'}
                                    </TableCell>
                                    <TableCell>{event.changedBy || 'System'}</TableCell>
                                    <TableCell>
                                      {event.pol && event.pod ? (
                                        `${getPlaceName(event.pol)} → ${getPlaceName(event.pod)}`
                                      ) : (
                                        event.location || 'N/A'
                                      )}
                                    </TableCell>
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
          open={loadingForm || loadingOptions || loadingContainers || generatingPDF}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Box>
    </Box>
  );
};
export default ContainerModule;