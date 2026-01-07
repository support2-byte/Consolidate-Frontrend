import React, { useState, useEffect,useCallback, useMemo } from 'react';
import {
  Box,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  ListItemIcon,
  TablePagination,
  Paper,
  TableSortLabel,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Slide
} from "@mui/material";
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Update as UpdateIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from "@mui/icons-material";
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom"; // Assuming React Router is used
  import { styled } from '@mui/material/styles';
import {api} from "../../api"; // Assuming api
import EditNoteIcon from '@mui/icons-material/EditNote';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyPlugin } from 'jspdf-autotable';
import logoPic from "../../../public/logo.png"
applyPlugin(jsPDF); 
// Assuming other imports are present: api, styled, MUI components (Paper, Table, etc.), icons, etc.
export default function Consignments() {
  const navigate = useNavigate();
  const [consignments, setConsignments] = useState([]);
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({ consignment_id: '', status: '' });
  const [selected, setSelected] = useState([]);
  const [selectedExport, setSelectedExport] = useState([]);
  const [numSelected, setNumSelected] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedConsignmentForUpdate, setSelectedConsignmentForUpdate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusList, setStatusList] = useState([]);

  const statuses = ["Draft", "In Transit", "Under Processing", "Delivered"];
  const [error, setError] = useState(null); 

  // Compute params for API
  const params = useMemo(() => ({
    page: page + 1, // API likely 1-indexed
    limit: rowsPerPage,
    order_by: orderBy,
    order: order,
    consignment_id: filters.consignment_id,
    status: filters.status,
  }), [page, rowsPerPage, orderBy, order, filters]);
const getConsignments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/consignments`, { params });
        console.log('Fetched consignments:', response.data);
        setConsignments(response.data.data || []);
        setRowCount(response.data.total || 0); // Fixed: setRowCount
      } catch (err) {
        console.error("Error fetching consignments:", err);
        setError("Failed to fetch consignments");
        setSnackbar({
          open: true,
          message: err.response?.data?.error || err.message || 'Failed to fetch consignments',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    
    getConsignments();
  }, []); // Depend on params for re-fetch on changes

  // Custom renderers (unchanged)
  const renderDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderStatus = (status) => (
    <Chip 
      label={status} 
      color={status === "Delivered" ? "success" : status === "In Transit" ? "warning" : status === "Draft" ? "default" : "info"} 
      size="large"
      sx={{ fontSize: '0.875rem', maxWidth: 240, marginLeft: -8 }}
    />
  );

  useEffect(() => {
    
    if (consignments.some(c => c && (!c.shipperName || !c.consigneeName))) {
      console.log('Fetching shippers and consignees for consignments');
      const fetchAndUpdate = async () => {
        try {
          const [shippersRes, consigneesRes,statusRes] = await Promise.all([
            api.get(`api/options/shippers`),
              //  api.get('api/consignments/statuses'),
            api.get(`api/options/consignees`), // Assuming a similar endpoint for consignees
          ]);
// setStatusList(statusRes.data)
          const shippers = shippersRes.data; // Assume { shipperOptions: array of {value, label} objects }
          const consignees = consigneesRes.data; // Assume { consigneeOptions: array of {value, label} objects }
          console.log('Fetched shippers:', shippers.shipperOptions);
          console.log('Fetched consignees:', consignees.consigneeOptions);
  // const status = statusRes.data;
          setConsignments(prev => prev.map(consignment => {
            if (!consignment) return consignment;
            console.log('Updating consignment:', consignment);
 // Filter shipper by ID (convert to number for strict equality)
          
            // Filter shipper by ID (convert to number for strict equality)
            const shipperName = shippers.shipperOptions.find(s => {
              const shipperId = Number(consignment.shipper);
              console.log('Comparing shipper IDs:', s.value, shipperId);
              return s.value === shipperId;
            })?.label;

            // Filter consignee by ID (convert to number for strict equality)
            const consigneeName = consignees.consigneeOptions.find(c => {
              const consigneeId = Number(consignment.consignee);
              console.log('Comparing consignee IDs:', c.value, consigneeId);
              return c.value === consigneeId;
            })?.label;

            console.log('Updated shipper name:', shipperName);
            console.log('Updated consignee name:', consigneeName);

            return {
              ...consignment,
              shipperName,
              consigneeName,
              // statusOptions
            };
          }));
        } catch (error) {
          console.error('Error fetching shippers/consignees:', error);
        }
      };

      fetchAndUpdate();
    }

    const fetchStatus = async () => {
    try {
        const response = await api.get('api/consignments/statuses')           
           const data = response.data 
      console.log('Fetched container:', data.statusOptions);
setStatusList(data.statusOptions)
          // const shippers = shippersRes.data; // Assume { shipperOptions: array of {value, label} objects }
          // const consignees = consigneesRes.data; // Assume { consigneeOptions: array of {value, label} objects }
          // console.log('Fetched shippers:', shippers.shipperOptions);
          // console.log('Fetched consignees:', consignees.consigneeOptions);
          
        } catch (error) {
          console.error('Error fetching shippers/consignees:', error);
        }
      };
    fetchStatus()
  }, []);


  // Columns (removed duplicate "Orders")
  const columns = [
    { 
      key: "consignment_number", 
      label: "Consignment",
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ fontSize: '0.875rem' }}>{item.consignment_number || "N/A"}</Typography>
    },
    { 
      key: "shipper", 
      label: "Shippers", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140, fontSize: '0.875rem' }}>{item.shipper || "N/A"}</Typography>
    },
    { 
      key: "consignee", 
      label: "Consignee", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140, fontSize: '0.875rem'   }}>{item.consignee || "N/A"}</Typography>
    },
    { 
      key: "eta", 
      label: "ETA", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem' }} noWrap>{renderDate(item.eta)}</Typography>
    },
    { 
      key: "created_at", 
      label: "Created At", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem' }} noWrap>{renderDate(item.created_at)}</Typography>
    },
    { 
      key: "gross_weight", 
      label: "Weight (kg)", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{(item.gross_weight || 0).toLocaleString('en-GB')}</Typography> // Added locale
    },
{ 
  key: "orders", 
  label: "Pieces", 
  sortable: true,
  render: (item) => <Typography variant="body1" sx={{ fontSize: '0.875rem',maxWidth: 80, }}>{safeParseOrders(item.orders).length}</Typography>
},
    { 
      key: "delivered", 
      label: "Delivered", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{ fontWeight: 'bold',  color: 'success.main',maxWidth: 80 }}>{item.delivered || 0}</Typography>
    },
    { 
      key: "pending", 
      label: "Pending", 
      sortable: true,
      render: (item) => <Typography variant="body1" sx={{fontSize: '0.875rem', fontWeight: 'bold', color: 'warning.main' }}>{item.pending || 0}</Typography>
    },{ 
    key: "status", 
    label: "Status",
    sortable: true,
    render: (item) => renderStatus(item.status) // No Typography wrapper here
  },

  ];

  // Sorting functions (unchanged)
  function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function getComparator(order, orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

function getSortableValue(item, key) {
  const value = item[key];
  if (key === 'created_at' || key === 'eta') {
    return value ? new Date(value).getTime() : 0;
  }
  if (key === 'orders') { // New: For Pieces column
    return safeParseOrders(value).length;
  }
  if (typeof value === 'number') {
    return value;
  }
  return value || '';
}
  function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) {
        return order;
      }
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  // Memoized filtered and sorted
  const filteredConsignments = useMemo(() => 
    consignments.filter(item => {
      const matchesId = !filters.consignment_id || item.consignment_number?.toLowerCase().includes(filters.consignment_id.toLowerCase());
      const matchesStatus = !filters.status || item.status === filters.status;
      return matchesId && matchesStatus;
    }), [consignments, filters]
  );

  const sortedConsignments = useMemo(() => 
    stableSort(filteredConsignments, getComparator(order, orderBy)), 
    [filteredConsignments, order, orderBy]
  );
const handleStatusUpdate = ( consignment) => {
    setSelectedConsignmentForUpdate(consignment);
    setSelectedStatus(consignment.status);
    setOpenStatusDialog(true);
  };
  const handleSelectAllClick = (event) => {
    console.log('Select All Clicked, checked:', event.target.checked);  
    if (event.target.checked) {
      const newSelected = sortedConsignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((n) => n.id);
      const newSelectedExport = sortedConsignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((n) => n.id);
      
      setSelectedExport(newSelectedExport);
      setSelected(newSelected);
      setNumSelected(newSelected.length); // Added
      return;
    }
    setSelected([]);
    setNumSelected(0); // Added
  };

 console.log('Selected IDs:', selectedExport);
const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleClick = (id) => {
    console.log('Row clicked, ID:', selected);
    const selectedIndex = selected.indexOf(id);
    setSelectedExport(selected); // Keep export selection in sync
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
    setNumSelected(newSelected.length); // Added
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

// Assuming getPlaceName is defined elsewhere; if not, define it (e.g., a function mapping IDs to names)
const getPlaceNamePdf = (id) => {
  // Example mapping; replace with actual logic
  const places = { 2: 'Karachi', 5: 'Dubai' }; // Add more as needed
  return places[id] || 'N/A';
};


const handleExport = async () => {
  setExporting(true);
  console.log('Exporting consignments with params:', selectedExport);
  
  // Ensure selectedExport is an array (handle single object or undefined)
  let consignmentsToExport = [];
  if (Array.isArray(selectedExport)) {
    consignmentsToExport = selectedExport;
  } else if (selectedExport && typeof selectedExport === 'object') {
    consignmentsToExport = [selectedExport]; // Wrap single object
  } else {
    setSnackbar({
      open: true,
      severity: 'warning',
      message: 'No consignments selected for export.',
    });
    setExporting(false);
    return;
  }

  if (consignmentsToExport.length === 0) {
    setSnackbar({
      open: true,
      severity: 'warning',
      message: 'No consignments selected for export.',
    });
    setExporting(false);
    return;
  }

  // For simplicity, generate one PDF per consignment (or combine if needed)
  // Here, assuming single or loop; adjust for multi if required
  for (const consignment of consignmentsToExport) {
    if (!consignment.consignment_number) {
      console.warn('Skipping consignment without number:', consignment.id);
      continue;
    }

    try {
      // Fetch full details for the consignment to ensure complete data (orders, containers, etc.)
      const res = await api.get(`/api/consignments/${consignment.id}?autoUpdate=false`);
      const fullRes = res.data || {};
      let fullConsignment = fullRes.data || consignment; // Fallback to shallow if fetch fails

      // Apply mapping similar to loadConsignment for consistent field names and formatting
      const mappedData = {
        ...fullConsignment,
        shipper: fullConsignment?.shipper_id?.toString() || '',
        shipperName: fullConsignment?.shipper || '',
        shipperAddress: fullConsignment?.shipper_address || '',
        consignee: fullConsignment?.consignee_id?.toString() || '',
        consigneeName: fullConsignment?.consignee || '',
        consigneeAddress: fullConsignment?.consignee_address || '',
        origin: fullConsignment?.origin_id?.toString() || '',
        originName: fullConsignment?.origin || '',
        destination: fullConsignment?.destination_id?.toString() || '',
        destinationName: fullConsignment?.destination || '',
        bank: fullConsignment?.bank_id?.toString() || '',
        bankName: fullConsignment?.bank || '',
        payment_type: fullConsignment?.payment_type?.toString() || '',
        status: fullConsignment?.status || '',
        vessel: fullConsignment?.vessel ? fullConsignment.vessel.toString() : '',
        shipping_line: fullConsignment?.shipping_line ? fullConsignment.shipping_line.toString() : '',
        voyage: fullConsignment?.voyage ? fullConsignment.voyage.toString() : '',
        seal_no: fullConsignment?.seal_no || '',
        remarks: fullConsignment?.remarks || '',
        net_weight: fullConsignment?.net_weight || 0,
        gross_weight: fullConsignment?.gross_weight || 0,
        consignment_value: fullConsignment?.consignment_value || 0,
        currency_code: fullConsignment?.currency_code || '',
        eform_date: fullConsignment?.eform_date ? dayjs(fullConsignment.eform_date) : '',
        eta: fullConsignment?.eta ? dayjs(fullConsignment.eta) : '',
        containers: (fullConsignment?.containers || []).map(c => ({
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
        payment_type: mappedData.payment_type,
        status: mappedData.status
      });

      // allReceivers = mappedData.orders || []; // Align with your data
      const allReceivers = mappedData.orders || []; // Assuming orders are objects; adjust if IDs
      // If there is a selectedOrders state, filter here: .filter(o => selectedOrders.includes(o.id))

      // Map orders to include missing fields for template compatibility
      const mappedReceivers = allReceivers.map(order => ({
        ...order,
        booking_ref: `ORD-${order.id}`,
        place_of_loading: mappedData.originName || mappedData.origin,
        place_of_delivery: mappedData.destinationName || mappedData.destination,
        sender_name: mappedData.shipperName || mappedData.shipper,
        receiver_name: mappedData.consigneeName || mappedData.consignee,
        status: order.order_status || order.status
      }));

      const groupedShipping = allReceivers.reduce((acc, order) => {
        if (order.receivers && Array.isArray(order.receivers)) {
          acc[order.id] = order.receivers.reduce((recAcc, receiver) => {
            if (receiver.id && receiver.shippingdetails) {
              recAcc[receiver.id] = receiver.shippingdetails;
            }
            return recAcc;
          }, {});
        }
        return acc;
      }, {});

      // Prepare shipping details for condition and mapping
      const shippingDetails = Object.values(groupedShipping).flatMap(orderGroup => 
        Object.values(orderGroup)
      );

      await generateManifestPDFWithCanvas(mappedData, mappedReceivers, shippingDetails);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      setSnackbar({
        open: true,
        severity: 'error',
        message: `Failed to generate PDF for ${consignment.consignment_number}`,
      });
    }
  }

  setExporting(false);
  setSnackbar({ open: true, message: 'Exported successfully!', severity: 'success' });
};

const generateManifestPDFWithCanvas = async (data, mappedReceivers, shippingDetails) => {
  console.log('data for canvas data', data);
  if (!data.consignment_number) {
    setSnackbar({
      open: true,
      severity: 'warning',
      message: 'Please enter a consignment number to generate the manifest.',
    });
    return;
  }

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
  const getPlaceName = (place) => {
    const places = { 2: 'Karachi', 5: 'Dubai' }; // Example; replace with actual
    return places[place] || place || 'N/A';
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
        background: linear-gradient(135deg, #1abc9c 0%, #0d6c6a 100%); 
        color: white; 
        height: 30mm; 
        padding: 4mm 4mm; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 8mm;
        border-radius: 0 0 0px 0px; 
        box-shadow: 0 4px 12px rgba(13, 108, 106, 0.2); 
      }
      .header-logo { width: 220px; height: 60px; opacity: 0.95; } 
      .header-left { display: flex; gap: 0mm; }
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
        background: linear-gradient(135deg, #0d6c6a 0%, #1abc9c 100%); 
        color: white; 
        padding: 4mm 6mm; 
        font-size: 15px; 
        font-weight: 600; 
        margin: 0; 
        border-bottom: 2px solid rgba(255,255,255,0.2); 
      }
      .section-content { padding: 6mm; background: #f8f9fa; }
      .details-grid { 
        display: flex; 
        flex-direction: column;
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
        margin-bottom: 6mm; 
        font-size: 9px; 
        background: white; 
        border-radius: 8px; 
        overflow: hidden; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.08); 
      }
      th { 
        background: linear-gradient(135deg, #f58220 0%, #e67e22 100%); 
        color: white; 
        padding: 4mm; 
        text-align: left; 
        font-weight: 600; 
      }
      td { 
        padding: 4mm; 
        border-bottom: 1px solid #e9ecef; 
        vertical-align: top; 
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
      </div>
      <div class="header-right">
        <h1>Manifest Report</h1>
        <p class="header-consignment">Consignment Number: ${data.consignment_number || 'N/A'}</p>
        <p>${formatDate(new Date())}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
      </div>
    </div>
    
    <div class="summary-grid">
      <div class="card">
        <div class="card-header">Containers</div>
        <div class="card-value">${data.containers?.length || 0}</div>
      </div>
      <div class="card">
        <div class="card-header">Orders</div>
        <div class="card-value">${mappedReceivers?.length || 0}</div>
      </div>
      <div class="card">
        <div class="card-header">Net Weight</div>
        <div class="card-value">${formatWeight(data.net_weight)}</div>
      </div>
      <div class="card">
        <div class="card-header">Gross Weight</div>
        <div class="card-value">${formatWeight(data.gross_weight)}</div>
      </div>
      <div class="card">
        <div class="card-header">Value</div>
        <div class="card-value">${data.consignment_value || 0} ${data.currency_code || 'USD'}</div>
      </div>
      <div class="card">
        <div class="card-header">Status</div>
        <div class="card-value">${data.status || "Draft"}</div>
      </div>
    </div>
    
 <div class="section">
  <h2 class="section-header">Consignment Details</h2>
  <div style="display: flex; gap: 10px; justify-content: space-between; align-items: flex-start;">
    <div style="flex: 1; background-color: #f8f9fa; padding: 5px; border-radius: 8px; border-left: 4px solid #f58220;">
      <div style="margin-bottom: 6px;">
        <strong style="display: block; color: #34495e; margin-bottom: 2px;">Consignee</strong>
        <span style="color: #555;">${data.consigneeName || 'N/A'}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <strong style="display: block; color: #34495e; margin-bottom: 2px;">Destination</strong>
        <span style="color: #555;">${data.destinationName || 'N/A'}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <strong style="display: block; color: #34495e; margin-bottom: 2px;">ETA</strong>
        <span style="color: #555;">${formatDate(data.eta)}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <strong style="display: block; color: #34495e; margin-bottom: 2px;">Payment Type</strong>
        <span style="color: #555;">${data.payment_type || 'N/A'}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <strong style="display: block; color: #34495e; margin-bottom: 2px;">Seal No</strong>
        <span style="color: #555;">${data.seal_no || 'N/A'}</span>
      </div>
    </div>
  <div style="flex: 1; background-color: #f8f9fa; padding: 5px; border-radius: 8px; border-left: 4px solid #f58220;">
      <div style="margin-bottom: 6px;">
        <strong style="display: block; color: #34495e; margin-bottom: 2px;">Shipper</strong>
        <span style="color: #555;">${data.shipperName || 'N/A'}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <strong style="display: block; color: #34495e; margin-bottom: 2px;">Origin</strong>
        <span style="color: #555;">${data.originName || 'N/A'}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <strong style="display: block; color: #34495e; margin-bottom: 2px;">Vessel / Voyage</strong>
        <span style="color: #555;">${(data.vessel || 'N/A') + ' / ' + (data.voyage || 'N/A')}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <strong style="display: block; color: #34495e; margin-bottom: 2px;">Shipping Line</strong>
        <span style="color: #555;">${data.shipping_line || 'N/A'}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <strong style="display: block; color: #34495e; margin-bottom: 2px;">Bank</strong>
        <span style="color: #555;">${data.bankName || 'N/A'}</span>
      </div>
    </div>
  </div>
 ${data.remarks ? `
    <div style="margin: 24px 0px; padding: 20px; background-color: #e8f5e8; border-radius: 8px; border-left: 4px solid #27ae60;">
      <strong style="display: block; color: #34495e; margin-bottom: 8px;">Remarks:</strong>
      <span style="color: #555; white-space: pre-wrap;">${data.remarks}</span>
    </div>
  ` : ''}
</div>
    
   ${data.containers && data.containers.length > 0 ? `
  <div class="section" style="margin-top:20px">
    <h2 class="section-header">Containers</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #e0e0e0;">
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Container No</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Location</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Size</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Type</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Owner</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.containers.map((c, idx) => `
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;"><strong>${c.containerNo || `Container ${idx + 1}`}</strong></td>
            <td style="padding: 12px; border: 1px solid #ddd;">${c.location || 'N/A'}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${c.size || 'N/A'}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${c.containerType || 'N/A'}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${c.ownership || 'N/A'}</td>
            <td style="padding: 12px; border: 1px solid #ddd; color: #27ae60; font-weight: 500;">${c.status || 'Active'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
` : ''}

${mappedReceivers && mappedReceivers.length > 0 ? `
<div class="section">
    <h2 class="section-header">Orders (${mappedReceivers.length})</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f39c12;">
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd; color: white;">Booking Ref</th>
          <th style="text-align: center; padding: 12px; border: 1px solid #ddd; color: white;">POL</th>
          <th style="text-align: center; padding: 12px; border: 1px solid #ddd; color: white;">POD</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd; color: white;">Sender</th>
          <th style="text-align: center; padding: 12px; border: 1px solid #ddd; color: white;">Receiver</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd; color: white;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${mappedReceivers.map((c, idx) => `
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;"><strong>${c.booking_ref || `Booking ${idx + 1}`}</strong></td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${getPlaceName(c.place_of_loading || 'N/A')}</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${getPlaceName(c.place_of_delivery || 'N/A')}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${c.sender_name || 'N/A'}</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${c.receiver_name || 'N/A'}</td>
            <td style="padding: 12px; border: 1px solid #ddd; color: #27ae60; font-weight: 500;">${c.status || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
` : ''}

${shippingDetails.length > 0 ? `
  <div class="section">
    <h2 class="section-header">Shipment Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #16a085;">
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd; color: white;">Tracking No</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd; color: white;">Category</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd; color: white;">Sub Category</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd; color: white;">Type</th>
          <th style="text-align: center; padding: 12px; border: 1px solid #ddd; color: white;">Total Items</th>
          <th style="text-align: center; padding: 12px; border: 1px solid #ddd; color: white;">Weight (kg)</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd; color: white;">Pickup Location</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd; color: white;">Delivery Address</th>
          <th style="text-align: left; padding: 12px; border: 1px solid #ddd; color: white;">Container No</th>
        </tr>
      </thead>
      <tbody>
        ${shippingDetails.map(s => `
          <tr>
            <td style="padding: 5px; border: 1px solid #ddd;"><strong>${s.itemRef || 'N/A'}</strong></td>
            <td style="padding: 5px; border: 1px solid #ddd;">${s.category || 'N/A'}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${s.subcategory || 'N/A'}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${s.type || 'N/A'}</td>
            <td style="padding: 5px; border: 1px solid #ddd; text-align: center;">${s.totalNumber || 'N/A'}</td>
            <td style="padding: 5px; border: 1px solid #ddd; text-align: center;">${(s.weight / 1000).toFixed(2)}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${s.pickupLocation || 'N/A'}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${s.deliveryAddress || 'N/A'}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${s.containerDetails?.[0]?.container?.container_number || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
` : ''}

 
    <div class="footer">
      <p><strong>Generated:</strong> ${new Date().toLocaleString()} | <strong>Page:</strong> 1 of ${Math.ceil(mappedReceivers?.length / 5 || 1)} </p>
      <p style="margin-top: 2mm; font-size: 9px; opacity: 0.7;">© 2025 Royal Gulf Shipping Management System | This manifest is computer-generated and legally binding.</p>
    </div>
  `;
  
  document.body.appendChild(tempElement);
  
  // Convert the element to canvas with higher quality and proper dimensions
  const scale = 2.5;
  const canvas = await html2canvas(tempElement, {
    scale: scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: tempElement.scrollWidth,
    height: tempElement.scrollHeight,
    windowWidth: tempElement.scrollWidth,
    windowHeight: tempElement.scrollHeight,
    backgroundColor: '#ffffff' // Ensure white background
  });
  
  // Remove the temporary element
  document.body.removeChild(tempElement);
  
  // Save the canvas as an image file (PNG) - High quality
  const canvasDataURL = canvas.toDataURL('image/png', 1.0); // Full quality PNG
  const canvasLink = document.createElement('a');
  canvasLink.download = `Manifest_${data.consignment_number}_Canvas_${Date.now()}.png`;
  canvasLink.href = canvasDataURL;
  canvasLink.click(); // Trigger download
  
  // Create PDF from canvas with better quality and margins, with bottom space
  const innerWidthMm = 210 - 2 * 14; // 182mm
  const pxPerMm = canvas.width / innerWidthMm;
  const extraBottomSpaceMm = 8 ; // Approx 70px at 96dpi ~18.5mm, rounded to 20mm
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
    
    const croppedDataURL = croppedCanvas.toDataURL('image/png', 1.0);
    const drawHeightMm = sliceHeightPx / pxPerMm;
    
    // Add to PDF (first page without addPage)
    if (startY > 0) {
      pdf.addPage();
    }
    pdf.addImage(croppedDataURL, 'PNG', marginMm, marginMm, contentWidthMm, drawHeightMm);
    
    startY += sliceHeightPx;
  }
  
  // Save the PDF
  pdf.save(`Manifest_${data.consignment_number}_Detailed_${Date.now()}.pdf`);
};
  const handleView = (id) => {
        navigate(`/consignments/${id}/edit`,{ state: { mode: 'edit', consignmentId: id  } });

  };

  const handleEdit = (id) => {
    
    navigate(`/consignments/${id}/edit`, { state: { mode: 'edit', consignmentId: id } });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this consignment?')) {
      console.log('Delete consignment', id);
      setSnackbar({ open: true, message: 'Consignment deleted successfully!', severity: 'success' });
    }
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleConfirmStatusUpdate = async(row) => {
    console.log('consignments',row)
        try {
          const res = await api.put(`/api/consignments/${row.id}/next`);
          const { message } = res.data || {};
          getConsignments()
          console.log('Status advanced:', res)
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
        
      };
    setOpenStatusDialog(false);
    // setSnackbar({ open: true, message: 'Status updated successfully!', severity: 'success' });
      
}

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedConsignmentForUpdate(null);
    setSelectedStatus('');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  // Safe JSON parse helper to avoid errors
  const safeParseOrders = (orders) => {
  if (!orders) return [];
  if (Array.isArray(orders) || (typeof orders === 'object' && orders !== null)) {
    return orders; // Already parsed (from DB JSONB)
  }
  if (orders === '[]') return [];
  try {
    return JSON.parse(orders);
  } catch (e) {
    console.warn('Invalid orders JSON:', orders, e);
    return [];
  }
};

  const visibleRows = sortedConsignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const total = rowCount || filteredConsignments.length; // Use rowCount for server-side
// For accurate totals in server-side pagination, fetch from API (see backend update suggestion below)
// Client-side fallback for small datasets
const totalWeight = useMemo(() => 
  filteredConsignments.reduce((sum, item) => {
    const weight = parseFloat(item.gross_weight) || 0; // Ensure numeric parsing
    return sum + weight;
  }, 0), 
  [filteredConsignments]
);
// Helper for formatting total weight to 4 decimal places (use in render, e.g., {formatWeight(totalWeight)} kg)
const formatWeight = useCallback((weight) => {
  if (isNaN(weight) || weight === null || weight === undefined) return '0.0000';
  return Number(weight).toFixed(4); // Format to 4 decimal places, e.g., "1234.5678"
}, []);

const totalOrders = useMemo(() => 
  filteredConsignments.reduce((sum, item) => sum + safeParseOrders(item.orders).length, 0), 
  [filteredConsignments]
);
  // Styled components (unchanged)
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
    <Paper 
      sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}
    >
      {/* Summary Card (unchanged) */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1, transition: 'box-shadow 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 108, 106, 0.15)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Showing <strong>{total}</strong> consignments • Total Orders: <strong>{totalOrders}</strong> • Total Weight: <strong>{formatWeight(totalWeight)} kg</strong>
            </Typography>
            <Chip 
              icon={<InfoIcon fontSize="small" />} 
              label={`${numSelected} selected`} 
              color={numSelected > 0 ? "primary" : "default"}
              size="small"
              variant="outlined"
              sx={{ 
                borderRadius: 1.5,
                fontWeight: 'medium',
                minWidth: 120,
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.02)' }
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Header (unchanged) */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 2, sm: 0 }} mb={2}>
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          color="#f58220" 
          sx={{ 
            fontSize: { xs: '1.5rem', md: '1.75rem' },
            mb: { xs: 1, sm: 0 },
            transition: 'transform 0.2s ease',
            '&:hover': { transform: 'scale(1.01)' }
          }}
        >
          Consignments
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title={numSelected === 0 ? "Select items to add to vessel" : ""}>

</Tooltip>
          <Tooltip title="Export to CSV/PDF">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={loading || exporting || total === 0}
              size="small"
              fullWidth={true}
              sx={{
                borderRadius: 2,
                borderColor: "#0d6c6a",
                color: "#0d6c6a",
                "&:hover": { borderColor: "#0d6c6a", backgroundColor: "#0d6c6a", color: "#fff" },
                fontSize: '0.875rem',
                fontWeight: 'medium',
                transition: 'all 0.2s ease',
                minHeight: 40,
                width: 120,
                '&:disabled': { borderColor: 'grey.400', color: 'grey.400' }
              }}
            >
              {exporting ? <CircularProgress size={16} color="inherit" /> : "Export"}
            </Button>
          </Tooltip>
          <Tooltip title="Create new consignment">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/consignments/add")}
              size="small"
              fullWidth={true}
              sx={{
                borderRadius: 2,
                backgroundColor: "#0d6c6a",
                color: "#fff",
                "&:hover": { backgroundColor: "#0a5a59" },
                fontSize: '0.875rem',
                fontWeight: 'medium',
                transition: 'all 0.2s ease',
                minHeight: 40,
                width: 100,
              }}
            >
              New
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filters (unchanged) */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
        <TextField
          label="Search Consignment #"
          name="consignment_id"
          value={filters.consignment_id}
          onChange={handleFilterChange}
          size="small"
          sx={{ 
            width: { xs: '100%', sm: 200 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'background.paper',
              transition: 'box-shadow 0.2s ease',
              '&:focus': { boxShadow: '0 0 0 2px rgba(13, 108, 106, 0.25)' }
            }
          }}
          placeholder="e.g., CON-001"
        />
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
          <InputLabel>Status</InputLabel>
       <Select
  name="status"
  value={filters.status}
  label="Status"
  onChange={handleFilterChange}
  labelId="status-select-label"
  aria-label="Select status"
  sx={{
    borderRadius: 2,
    backgroundColor: 'background.paper',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#0d6c6a',
      '&:focus': { borderColor: '#0d6c6a' }
    }
  }}
>
  <MenuItem value="">All</MenuItem>
  {statusList?.map((status) => (
    <MenuItem key={status.value} value={status.value}>
      <ListItemIcon>
        <Avatar sx={{ width: 16, height: 16, bgcolor: status.color, fontSize: '0.75rem' }}>
          {status.usage_count > 0 ? status.usage_count : ''}
        </Avatar>
      </ListItemIcon>
      {status.label}
    </MenuItem>
  ))}
</Select>
        </FormControl>
      </Stack>

      {/* Table - FIXED: No whitespace between <TableHead> and <TableBody> */}
      <TableContainer sx={{ 
        borderRadius: 2, 
        overflow: 'hidden',
        boxShadow: 2, 
        maxHeight: 600,
        width: '100%',
        '&::-webkit-scrollbar': {
          height: 6,
          width: 6,
        },
        '&::-webkit-scrollbar-track': {
          background: 'background.paper',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#0d6c6a',
          borderRadius: 3,
        }
      }}>
        <Table stickyHeader size="small" aria-label="Consignments table" sx={{ tableLayout: 'fixed' }}>
          <TableHead>{/* Inline to avoid text nodes */}
            <TableRow>
              <StyledTableHeadCell padding="checkbox" sx={{ width: 50, padding: '12px 8px',backgroundColor:'#0d6c6a',color:'#fff' }}>
                <Checkbox
                  color="primary"
                  indeterminate={numSelected > 0 && numSelected < rowCount}
                  checked={rowCount > 0 && numSelected === rowCount}
                  onChange={handleSelectAllClick}
                  size="small"
                  aria-label="Select all consignments"
                />
              </StyledTableHeadCell>
              {columns.map((column) => (
                <StyledTableHeadCell 
                  key={column.key} 
                  sx={{ 
                    width: `${100 / (columns.length + 2)}%`,
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: '12px 8px',
                    backgroundColor: '#0d6c6a',
                    color: '#fff',
                    textAlign:'center'
                  }} 
                  scope="col"
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.key}
                      direction={orderBy === column.key ? order : 'asc'}
                      onClick={(e) => handleRequestSort(e, column.key)}
                      sx={{ 
                        backgroundColor:'#0d6c6a',
                        color: 'inherit !important', 
                        '&:hover': { color: 'inherit !important' }, 
                        '& .MuiTableSortLabel-icon': { color: 'inherit !important' },
                        '&:focus': { outline: '2px solid currentColor' }
                      }}
                      aria-label={`Sort by ${column.label}`}
                    >
                      <Typography variant="body2" sx={{ lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {column.label}
                      </Typography>
                    </TableSortLabel>
                  ) : (
                    <Typography variant="body2" sx={{ lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {column.label}
                    </Typography>
                  )}
                </StyledTableHeadCell>
              ))}
              <StyledTableHeadCell sx={{ width: 50,textAlign:'center',marginRight:20, padding: '12px 8px',backgroundColor:'#0d6c6a',color:'#fff' }} scope="col">
                <Typography variant="body2" sx={{ lineHeight: 1 }}>Actions</Typography>
              </StyledTableHeadCell>
            </TableRow>
          </TableHead><TableBody>{/* No newline/whitespace here - key fix */} {/* Inline closing/opening to prevent text node */}
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>Loading consignments...</Typography>
                </TableCell>
              </TableRow>
            ) : visibleRows.length > 0 ? (
              visibleRows.map((row) => {
                const isItemSelected = isSelected(row.id);
                return (
                  <StyledTableRow
                    key={row.id}
                    onClick={() => {handleClick(row.id),setSelectedExport(row)}}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    selected={isItemSelected}
                    hover
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick(row.id);
                        setSelectedExport(row.id);
                      }
                    }}
                    sx={{ 
                      py: 1,
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease',
                      '&:focus': { outline: '2px solid #0d6c6a', outlineOffset: -2 }
                    }}
                    aria-label={`Consignment ${row.consignment_number}`}
                  >
                    <StyledTableCell padding="checkbox" sx={{ width: 50, padding: '12px 8px' }}>
                      <Checkbox
                        checked={isItemSelected}
                        onClick={(event) => {
                          handleClick(row.id);
                          setSelectedExport(row);
                          event.stopPropagation();
                        }}
                        size="small"
                        inputProps={{
                          'aria-labelledby': `checkbox-${row.id}`,
                        }}
                        aria-label={`Select consignment ${row.consignment_number}`}
                      />
                    </StyledTableCell>
                    {columns.map((column) => {
  const cellContent = column.render(row);
  const isChip = column.key === 'status'; // Or check if React.isValidElement(cellContent) && cellContent.type === Chip
  return (
    <StyledTableCell key={column.key} sx={{ width: `${100 / (columns.length + 2)}%`, maxWidth: 250 }}>
      <Tooltip 
        sx={{ width: '100%' }} 
        title={typeof cellContent === 'string' ? cellContent : ''} 
        arrow 
        placement="top"
        disableHoverListener={isChip} // Disable for Chip (self-tooltips unnecessary)
      >
        <span> {/* Forwarding wrapper for Tooltip */}
          {isChip ? cellContent : (
            <Typography variant="body2" sx={{width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cellContent}
            </Typography>
          )}
        </span>
      </Tooltip>
    </StyledTableCell>
  );
})}
                    <StyledTableCell sx={{ width: 80, padding: '12px 8px' }}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Update Status">
                          <EditNoteIcon
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(row); }}
                            aria-label={`View details for consignment ${row.consignment_number}`}
                            sx={{ 
                              color: '#f58220',
                              '&:hover': { backgroundColor: 'rgba(13, 108, 106, 0.08)', transform: 'scale(1.1)' },
                              transition: 'all 0.2s ease',
                              '&:focus': { outline: '2px solid #0d6c6a' }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </EditNoteIcon>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleEdit(row.id); }}
                            aria-label={`Edit consignment ${row.consignment_number}`}
                            sx={{ 
                              color: '#f58220',
                              '&:hover': { backgroundColor: 'rgba(13, 108, 106, 0.08)', transform: 'scale(1.1)' },
                              transition: 'all 0.2s ease',
                              '&:focus': { outline: '2px solid #0d6c6a' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </StyledTableCell>
                  </StyledTableRow>
                );
              })
            ) : (
              <StyledTableRow>
                <StyledTableCell colSpan={columns.length + 2} align="center" sx={{ py: 4, border: 0 }}>
                  <Stack spacing={1} alignItems="center">
                    <Typography variant="h6" color="text.secondary" sx={{ fontSize: '1.125rem' }}>
                      No consignments found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your filters or create a new one.
                    </Typography>
                  </Stack>
                </StyledTableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination (unchanged, but uses fixed total) */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Rows per page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        sx={{
          borderTop: '1px solid rgba(224, 224, 224, 1)',
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            color: '#f58220',
            fontWeight: 'medium',
            fontSize: '0.875rem',
          },
          '& .MuiTablePagination-select, & .MuiTablePagination-input': {
            fontSize: '0.875rem',
            borderRadius: 1,
            '&:focus': { borderColor: '#0d6c6a' }
          },
          '& .MuiTablePagination-actions button': {
            color: '#0d6c6a',
            '& svg': { fontSize: '1.125rem' },
            '&:hover': { backgroundColor: 'rgba(13, 108, 106, 0.08)' },
            '&:focus': { outline: '2px solid #0d6c6a' }
          }
        }}
        aria-label="Consignments table pagination"
      />

      {/* Dialog & Snackbar (unchanged) */}
      <Dialog
        open={openStatusDialog}
        onClose={handleCloseStatusDialog}
        maxWidth="xs"
        fullWidth
        aria-labelledby="status-dialog-title"
        aria-describedby="status-dialog-description"
        sx={{ '& .MuiDialog-paper': { borderRadius: 3, boxShadow: 4 } }}
      >
        <DialogTitle id="status-dialog-title" sx={{ fontSize: '1.25rem', p: 2, bgcolor: '#0d6c6a', color: "#fff", borderBottom: 1, borderColor: 'divider' }}>
          Consignment Status
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography id="status-dialog-description" variant="body1" color="text.secondary" m={2} sx={{ fontSize: '1rem' }}>
            Update status for <strong>{selectedConsignmentForUpdate?.consignment_number}</strong>
          </Typography>
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel id="status-select-label">Status</InputLabel>
<Select
  labelId="status-select-label"
  value={selectedStatus}
  label="Status"
  onChange={handleStatusChange}
  aria-label="Select status"
  sx={{
    borderRadius: 2,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#0d6c6a' }
  }}
>
  <MenuItem value="">All</MenuItem>
  {statusList?.map((status) => (
    <MenuItem key={status.value} value={status.value}>
      <ListItemIcon>
        <Avatar sx={{ width: 16, height: 16, bgcolor: status.color, fontSize: '0.75rem' }}>
          {status.usage_count > 0 ? status.usage_count : ''}
        </Avatar>
      </ListItemIcon>
      {status.label}
    </MenuItem>
  ))}
</Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 2, bgcolor: '#f8f9fa', borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCloseStatusDialog} size="small" variant="outlined">Cancel</Button>
          <Button onClick={() => handleConfirmStatusUpdate(selectedConsignmentForUpdate)} variant="contained" size="small" sx={{ backgroundColor: '#0d6c6a', color: "#fff", '&:hover': { backgroundColor: '#0a5a59', } }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        aria-live="polite"
        sx={{ '& .MuiSnackbarContent-root': { borderRadius: 2 } }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%', 
            fontSize: '1rem',
            borderRadius: 2,
            animation: 'slideInUp 0.3s ease',
            boxShadow: 2
          }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
}