import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Avatar,
  Stack,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
  Fab
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileDownload as ExportIcon,
  PictureAsPdf as PdfIcon,
  ExcelIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Assessment as SummaryIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  GetApp as ImportIcon,
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  FilterAlt as FilterAltIcon,
  Sort as SortIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ManifestFile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const manifestRef = useRef(null);
  
  // State management
  const [manifests, setManifests] = useState([]);
  const [filteredManifests, setFilteredManifests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedManifest, setSelectedManifest] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedManifestForAction, setSelectedManifestForAction] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Sample manifest data
  useEffect(() => {
    const sampleManifests = [
      {
        id: 'MNF-2025-001',
        manifestNumber: 'MNF-2025-001',
        date: '2025-01-15',
        status: 'completed',
        shipper: 'Global Shipping Corp',
        consignee: 'ABC Trading Ltd',
        origin: 'Dubai',
        destination: 'Karachi',
        vessel: 'MSC Oscar',
        voyage: 'MSC-2025-015',
        totalContainers: 15,
        totalWeight: '245,000 kg',
        totalValue: '$1,250,000',
        items: [
          {
            id: 'ITM-001',
            description: 'Electronics Equipment',
            hsCode: '8517.12',
            quantity: 500,
            weight: '12,000 kg',
            volume: '25 CBM',
            value: '$250,000',
            containers: ['CONT-001', 'CONT-002']
          },
          {
            id: 'ITM-002',
            description: 'Textile Products',
            hsCode: '6203.43',
            quantity: 1000,
            weight: '8,000 kg',
            volume: '30 CBM',
            value: '$150,000',
            containers: ['CONT-003', 'CONT-004', 'CONT-005']
          }
        ],
        documents: ['Bill of Lading', 'Commercial Invoice', 'Packing List'],
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T14:45:00Z'
      },
      {
        id: 'MNF-2025-002',
        manifestNumber: 'MNF-2025-002',
        date: '2025-01-18',
        status: 'in-transit',
        shipper: 'Mideast Logistics',
        consignee: 'XYZ Imports',
        origin: 'Dubai',
        destination: 'London',
        vessel: 'CMA CGM Magellan',
        voyage: 'CMG-2025-022',
        totalContainers: 8,
        totalWeight: '120,000 kg',
        totalValue: '$850,000',
        items: [
          {
            id: 'ITM-003',
            description: 'Machinery Parts',
            hsCode: '8479.90',
            quantity: 200,
            weight: '15,000 kg',
            volume: '20 CBM',
            value: '$450,000',
            containers: ['CONT-006', 'CONT-007']
          }
        ],
        documents: ['Bill of Lading', 'Certificate of Origin'],
        createdAt: '2025-01-18T09:15:00Z',
        updatedAt: '2025-01-18T11:30:00Z'
      },
      {
        id: 'MNF-2025-003',
        manifestNumber: 'MNF-2025-003',
        date: '2025-01-20',
        status: 'pending',
        shipper: 'Fast Freight Solutions',
        consignee: 'Global Retail Co',
        origin: 'Dubai',
        destination: 'New York',
        vessel: 'Evergreen Giant',
        voyage: 'EGG-2025-018',
        totalContainers: 12,
        totalWeight: '180,000 kg',
        totalValue: '$920,000',
        items: [
          {
            id: 'ITM-004',
            description: 'Consumer Goods',
            hsCode: '9503.00',
            quantity: 2000,
            weight: '10,000 kg',
            volume: '35 CBM',
            value: '$320,000',
            containers: ['CONT-008', 'CONT-009']
          }
        ],
        documents: ['Commercial Invoice', 'Packing List'],
        createdAt: '2025-01-20T08:00:00Z',
        updatedAt: '2025-01-20T08:00:00Z'
      }
    ];
    
    setManifests(sampleManifests);
    setFilteredManifests(sampleManifests);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...manifests];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(manifest =>
        manifest.manifestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manifest.shipper.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manifest.consignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manifest.vessel.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(manifest => manifest.status === selectedStatus);
    }
    
    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(manifest => 
        dayjs(manifest.date).isAfter(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(manifest => 
        dayjs(manifest.date).isBefore(dateRange.end)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'date') {
        aValue = dayjs(a.date);
        bValue = dayjs(b.date);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredManifests(filtered);
  }, [manifests, searchTerm, selectedStatus, dateRange, sortBy, sortOrder]);

  // Status color helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-transit': return 'info';
      case 'pending': return 'warning';
      case 'delayed': return 'error';
      default: return 'default';
    }
  };

  // Status icon helper
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckIcon />;
      case 'in-transit': return <ShippingIcon />;
      case 'pending': return <WarningIcon />;
      case 'delayed': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  // Export functions
  const handleExportPDF = async () => {
    setSnackbar({ open: true, message: 'Generating PDF...', severity: 'info' });
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(245, 130, 32);
      pdf.text('Shipping Manifest Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Add date
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      // Add manifests
      filteredManifests.forEach((manifest, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(13, 108, 106);
        pdf.text(`Manifest ${index + 1}: ${manifest.manifestNumber}`, 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Date: ${manifest.date}`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Shipper: ${manifest.shipper}`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Consignee: ${manifest.consignee}`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Route: ${manifest.origin} → ${manifest.destination}`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Vessel: ${manifest.vessel} (${manifest.voyage})`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Containers: ${manifest.totalContainers} | Weight: ${manifest.totalWeight} | Value: ${manifest.totalValue}`, 20, yPosition);
        yPosition += 15;
      });
      
      pdf.save(`manifest-report-${new Date().toISOString().split('T')[0]}.pdf`);
      setSnackbar({ open: true, message: 'PDF exported successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to export PDF', severity: 'error' });
    }
    
    setExportMenuAnchor(null);
  };

  const handleExportExcel = () => {
    setSnackbar({ open: true, message: 'Excel export coming soon', severity: 'info' });
    setExportMenuAnchor(null);
  };

  // Dialog handlers
  const handleViewDetails = (manifest) => {
    setSelectedManifest(manifest);
    setDetailsDialogOpen(true);
  };

  const handleCreateManifest = () => {
    setCreateDialogOpen(true);
  };

  const handleEditManifest = (manifest) => {
    setSelectedManifest(manifest);
    // Navigate to edit page or open edit dialog
    setSnackbar({ open: true, message: 'Edit functionality coming soon', severity: 'info' });
  };

  const handleDeleteManifest = (manifest) => {
    // Implement delete functionality
    setSnackbar({ open: true, message: 'Delete functionality coming soon', severity: 'info' });
  };

  const handlePrintManifest = () => {
    window.print();
  };

  const handleShareManifest = () => {
    // Implement share functionality
    setSnackbar({ open: true, message: 'Share functionality coming soon', severity: 'info' });
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  // Snackbar handler
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ 
        p: { xs: 2, md: 3 },
        bgcolor: '#f5f7fa',
        minHeight: '100vh',
        transform: fullscreen ? 'scale(1.2)' : 'scale(1)',
        transformOrigin: 'top center',
        transition: 'transform 0.3s ease'
      }}>
        {/* Header */}
        <Box sx={{ 
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="#0d6c6a" sx={{ mb: 1 }}>
              Shipping Manifests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and track all your shipping manifests
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={() => window.location.reload()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom In">
              <IconButton onClick={handleZoomIn}>
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton onClick={handleZoomOut}>
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fullscreen">
              <IconButton onClick={handleFullscreen}>
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: 3
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {manifests.length}
                    </Typography>
                    <Typography variant="body2">
                      Total Manifests
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <SummaryIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: 3
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {manifests.filter(m => m.status === 'in-transit').length}
                    </Typography>
                    <Typography variant="body2">
                      In Transit
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <ShippingIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: 3
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {manifests.filter(m => m.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2">
                      Pending
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <WarningIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: 3
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {manifests.filter(m => m.status === 'completed').length}
                    </Typography>
                    <Typography variant="body2">
                      Completed
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <CheckIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search manifests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in-transit">In Transit</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="delayed">Delayed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, start: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, end: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                >
                  More Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateManifest}
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f58220 0%, #e65100 100%)',
                boxShadow: 3
              }}
            >
              New Manifest
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ImportIcon />}
              sx={{ borderRadius: 2 }}
            >
              Import
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              sx={{ borderRadius: 2 }}
            >
              Export
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrintManifest}
              sx={{ borderRadius: 2 }}
            >
              Print
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShareManifest}
              sx={{ borderRadius: 2 }}
            >
              Share
            </Button>
          </Box>
        </Box>

        {/* View Toggle */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('table')}
            sx={{ borderRadius: 2, mr: 1 }}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === 'card' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('card')}
            sx={{ borderRadius: 2 }}
          >
            Card View
          </Button>
        </Box>

        {/* Manifests List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {viewMode === 'table' ? (
              <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#0d6c6a' }}>
                      <TableRow>
                        <TableCell sx={{ color: 'white' }}>Manifest #</TableCell>
                        <TableCell sx={{ color: 'white' }}>Date</TableCell>
                        <TableCell sx={{ color: 'white' }}>Shipper</TableCell>
                        <TableCell sx={{ color: 'white' }}>Consignee</TableCell>
                        <TableCell sx={{ color: 'white' }}>Route</TableCell>
                        <TableCell sx={{ color: 'white' }}>Status</TableCell>
                        <TableCell sx={{ color: 'white' }}>Containers</TableCell>
                        <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredManifests.map((manifest) => (
                        <TableRow key={manifest.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {manifest.manifestNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {dayjs(manifest.date).format('MMM DD, YYYY')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {manifest.shipper}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {manifest.consignee}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {manifest.origin} → {manifest.destination}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={manifest.status.replace('-', ' ')}
                              color={getStatusColor(manifest.status)}
                              size="small"
                              icon={getStatusIcon(manifest.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {manifest.totalContainers}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setSelectedManifestForAction(manifest);
                                setActionMenuAnchor(e.currentTarget);
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {filteredManifests.map((manifest) => (
                  <Grid item xs={12} md={6} lg={4} key={manifest.id}>
                    <Card sx={{ 
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" fontWeight="bold" color="#0d6c6a">
                            {manifest.manifestNumber}
                          </Typography>
                          <Chip
                            label={manifest.status.replace('-', ' ')}
                            color={getStatusColor(manifest.status)}
                            size="small"
                            icon={getStatusIcon(manifest.status)}
                          />
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {dayjs(manifest.date).format('MMM DD, YYYY')}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Shipper:</strong> {manifest.shipper}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Consignee:</strong> {manifest.consignee}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Route:</strong> {manifest.origin} → {manifest.destination}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Vessel:</strong> {manifest.vessel}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {manifest.totalContainers} containers
                          </Typography>
                          <Box>
                            <IconButton size="small" onClick={() => handleViewDetails(manifest)}>
                              <ViewIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleEditManifest(manifest)}>
                              <EditIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
        >
          <MenuItem onClick={handleExportPDF}>
            <PdfIcon sx={{ mr: 1 }} /> Export as PDF
          </MenuItem>
          <MenuItem onClick={handleExportExcel}>
            <ExcelIcon sx={{ mr: 1 }} /> Export as Excel
          </MenuItem>
        </Menu>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={() => setActionMenuAnchor(null)}
        >
          <MenuItem onClick={() => {
            handleViewDetails(selectedManifestForAction);
            setActionMenuAnchor(null);
          }}>
            <ViewIcon sx={{ mr: 1 }} /> View Details
          </MenuItem>
          <MenuItem onClick={() => {
            handleEditManifest(selectedManifestForAction);
            setActionMenuAnchor(null);
          }}>
            <EditIcon sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem onClick={() => {
            handleDeleteManifest(selectedManifestForAction);
            setActionMenuAnchor(null);
          }}>
            <DeleteIcon sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>

        {/* Details Dialog */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          {selectedManifest && (
            <>
              <DialogTitle sx={{ 
                bgcolor: '#0d6c6a', 
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="h6">
                  Manifest Details - {selectedManifest.manifestNumber}
                </Typography>
                <IconButton onClick={() => setDetailsDialogOpen(false)} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                  <Tab label="Overview" />
                  <Tab label="Items" />
                  <Tab label="Documents" />
                </Tabs>
                
                {tabValue === 0 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>Basic Information</Typography>
                      <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Manifest Number:</strong> {selectedManifest.manifestNumber}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Date:</strong> {selectedManifest.date}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Status:</strong> {selectedManifest.status}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Vessel:</strong> {selectedManifest.vessel}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Voyage:</strong> {selectedManifest.voyage}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>Parties</Typography>
                      <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Shipper:</strong> {selectedManifest.shipper}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Consignee:</strong> {selectedManifest.consignee}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Origin:</strong> {selectedManifest.origin}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Destination:</strong> {selectedManifest.destination}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Summary</Typography>
                      <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Total Containers:</strong> {selectedManifest.totalContainers}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Total Weight:</strong> {selectedManifest.totalWeight}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Total Value:</strong> {selectedManifest.totalValue}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                )}
                
                {tabValue === 1 && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item ID</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>HS Code</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Weight</TableCell>
                          <TableCell>Volume</TableCell>
                          <TableCell>Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedManifest.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.hsCode}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.weight}</TableCell>
                            <TableCell>{item.volume}</TableCell>
                            <TableCell>{item.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {tabValue === 2 && (
                  <List>
                    {selectedManifest.documents.map((doc, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <AttachFileIcon />
                        </ListItemIcon>
                        <ListItemText primary={doc} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
                <Button variant="contained" onClick={() => handleEditManifest(selectedManifest)}>
                  Edit
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Create Manifest Dialog */}
        <Dialog 
          open={createDialogOpen} 
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ bgcolor: '#0d6c6a', color: 'white' }}>
            Create New Manifest
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Manifest creation form will be implemented here.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Create</Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              background: 'linear-gradient(135deg, #f58220 0%, #e65100 100%)'
            }}
            onClick={handleCreateManifest}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ManifestFile;