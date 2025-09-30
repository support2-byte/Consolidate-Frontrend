import React, { useState } from 'react';
import { 
  Box, Button, TextField, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, IconButton, Typography, Modal, FormControl, InputLabel, Radio, RadioGroup, FormControlLabel, Tooltip, Divider 
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';

// Demo data
const containers = [
  {
    containerNo: "RGSLU1234567",
    size: "40'HC",
    type: "Dry High",
    ownership: "SOC",
    currentJob: "MJ-9021",
    status: "In Transit",
    location: "At Sea",
    lastUsed: "2025-09-15",
    condition: "Available"
  },
  {
    containerNo: "MSCU8765432",
    size: "20'",
    type: "Dry Standard",
    ownership: "COC",
    currentJob: "MJ-9021",
    status: "Arrived",
    location: "Jebel Ali",
    lastUsed: "2025-09-12",
    condition: "Available"
  },
  {
    containerNo: "RGSLU9988776",
    size: "20'",
    type: "Dry Standard",
    ownership: "SOC",
    currentJob: "",
    status: "Available",
    location: "Karachi Depot",
    lastUsed: "2025-08-05",
    condition: "Available"
  },
  {
    containerNo: "ABCD1234567",
    size: "40'",
    type: "Reefer Standard",
    ownership: "SOC",
    currentJob: "",
    status: "Under Repair",
    location: "Dubai Depot",
    lastUsed: "2025-07-20",
    condition: "Under Repair"
  }
];

const usageHistory = [
  {
    jobNo: "MJ-9021",
    pol: "Karachi",
    pod: "Dubai",
    startDate: "2025-09-01",
    endDate: "2025-09-15",
    statusProgression: ["Loaded", "In Transit"],
    linkedOrders: 25,
    remarks: "No damage reported"
  },
  {
    jobNo: "MJ-8005",
    pol: "Dubai",
    pod: "Karachi",
    startDate: "2025-08-01",
    endDate: "2025-08-10",
    statusProgression: ["Loaded", "In Transit", "Arrived", "Cleared", "Returned"],
    linkedOrders: 20,
    remarks: "Minor dent repaired"
  }
];

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

const ContainerModule = () => {
  // State for filters
  const [filters, setFilters] = useState({
    containerNo: '',
    size: '',
    type: '',
    ownership: '',
    status: '',
    location: ''
  });

  // State for modals
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [selectedContainerNo, setSelectedContainerNo] = useState(null);

  // State for Add Container form
  const [formData, setFormData] = useState({
    ownership: 'SOC',
    containerNo: '',
    size: '',
    type: '',
    depotLocation: '',
    condition: 'Available',
    dateAdded: new Date().toISOString().split('T')[0],
    hireStartDate: '',
    hireEndDate: '',
    vendor: '',
    freeDays: '',
    placeOfLoading: '',
    placeOfDelivery: '',
    remarks: ''
  });

  // Handle filter changes
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      containerNo: '',
      size: '',
      type: '',
      ownership: '',
      status: '',
      location: ''
    });
  };

  // Filter containers
  const filteredContainers = containers.filter((c) =>
    c.containerNo.toLowerCase().includes(filters.containerNo.toLowerCase()) &&
    (!filters.size || c.size === filters.size) &&
    (!filters.type || c.type === filters.type) &&
    (!filters.ownership || c.ownership === filters.ownership) &&
    (!filters.status || c.status === filters.status) &&
    (!filters.location || c.location === filters.location)
  );

  // Handle form changes
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleFormSubmit = () => {
    if (!/^[A-Z]{4}\d{7}$/.test(formData.containerNo)) {
      alert('Container Number must be 4 letters followed by 7 digits');
      return;
    }
    if (!formData.size || !formData.type) {
      alert('Size and Type are required');
      return;
    }
    if (formData.ownership === 'SOC' && !formData.depotLocation) {
      alert('Depot Location is required for Owned By containers');
      return;
    }
    if (formData.ownership === 'COC' && (!formData.hireStartDate || !formData.hireEndDate || !formData.vendor || !formData.freeDays || !formData.placeOfLoading || !formData.placeOfDelivery)) {
      alert('Hire Start Date, Hire End Date, Vendor, Free Days, Place of Loading, and Place of Delivery are required for Hired By containers');
      return;
    }
    alert(`Container added: ${JSON.stringify(formData)}`);
    setOpenAddModal(false);
    setFormData({
      ownership: 'SOC',
      containerNo: '',
      size: '',
      type: '',
      depotLocation: '',
      condition: 'Available',
      dateAdded: new Date().toISOString().split('T')[0],
      hireStartDate: '',
      hireEndDate: '',
      vendor: '',
      freeDays: '',
      placeOfLoading: '',
      placeOfDelivery: '',
      remarks: ''
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Container Master Screen */}
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h4" 
            sx={{ fontWeight: 'bold', color: '#1976d2' }}
          >
            Container Master
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={() => setOpenAddModal(true)}
            sx={{
              bgcolor: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
              borderRadius: 2,
              textTransform: 'none',
              px: 1,
              py: 1,
              fontSize: '1rem'
            }}
          >
            Add Container
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* Filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 3 }}>
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%', mx: 1, mb: 2 }}>
            <TextField
              label="Container No."
              name="containerNo"
              value={filters.containerNo}
              onChange={handleFilterChange}
              size="small"
              fullWidth
              variant="outlined"
              sx={{ bgcolor: 'white' }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: '50%', mx: 1, mb: 2 }}>
            <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
              <InputLabel>Size</InputLabel>
              <Select name="size" value={filters.size} onChange={handleFilterChange}>
                <MenuItem value="">All Sizes</MenuItem>
                {["20'", "40'", "40'HC"].map((size) => (
                  <MenuItem key={size} value={size}>{size}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: '50%', mx: 1, mb: 2 }}>
            <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
              <InputLabel>Type</InputLabel>
              <Select name="type" value={filters.type} onChange={handleFilterChange}>
                <MenuItem value="">All Types</MenuItem>
                {["Dry High", "Dry Standard", "Flat High", "Flat Standard", "Open Top", "Open Top High", "Reefer High", "Reefer Standard", "Tank"].map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: '50%', mx: 1, mb: 2 }}>
            <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
              <InputLabel>Ownership</InputLabel>
              <Select name="ownership" value={filters.ownership} onChange={handleFilterChange}>
                <MenuItem value="">All Ownership</MenuItem>
                <MenuItem value="SOC">SOC</MenuItem>
                <MenuItem value="COC">COC</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: '50%', mx: 1, mb: 2 }}>
            <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
              <InputLabel>Status</InputLabel>
              <Select name="status" value={filters.status} onChange={handleFilterChange}>
                <MenuItem value="">All Statuses</MenuItem>
                {["Available", "Assigned to Job", "Loaded", "In Transit", "Arrived", "De-Linked", "Cleared", "Returned"].map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: '25%', mx: 1, mb: 2 }}>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              fullWidth
              sx={{ textTransform: 'none', borderColor: '#f58220', color: '#f58220' }}
            >
              Clear
            </Button>
          </Box>
        </Box>

        {/* Container Table */}
        <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Container No.</TableCell>
                <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Size</TableCell>
                <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Ownership</TableCell>
                <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Current Job</TableCell>
                <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Location</TableCell>
                <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Last Used</TableCell>
                <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContainers.map((container, index) => (
                <TableRow 
                  key={container.containerNo} 
                  sx={{ 
                    bgcolor: index % 2 === 0 ? '#f9f9f9' : 'white',
                    '&:hover': { bgcolor: '#e3f2fd' }
                  }}
                >
                  <TableCell 
                    sx={{ cursor: 'pointer', color: '#1976d2', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => {
                      setSelectedContainerNo(container.containerNo);
                      setOpenHistoryModal(true);
                    }}
                  >
                    {container.containerNo}
                  </TableCell>
                  <TableCell>{container.size}</TableCell>
                  <TableCell>{container.type}</TableCell>
                  <TableCell>
                    <Chip
                      label={container.ownership === 'SOC' ? 'Own' : 'Hired'}
                      color={container.ownership === 'SOC' ? 'success' : 'info'}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>{container.currentJob || '–'}</TableCell>
                  <TableCell>
                    <Chip
                      label={container.status}
                      color={
                        container.status === 'Available' ? 'success' :
                        container.status === 'In Transit' ? 'warning' :
                        container.status === 'Arrived' ? 'error' :
                        container.status === 'Under Repair' ? 'error' : 'default'
                      }
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>{container.location}</TableCell>
                  <TableCell>{container.lastUsed}</TableCell>
                  <TableCell>
                    <Tooltip title="View History">
                      <IconButton
                        onClick={() => {
                          setSelectedContainerNo(container.containerNo);
                          setOpenHistoryModal(true);
                        }}
                        sx={{ color: '#1976d2' }}
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={container.status !== 'Cleared' ? 'Container must be Cleared to mark Returned' : 'Mark as Returned'}>
                      <span>
                        <Button
                          disabled={container.status !== 'Cleared'}
                          onClick={() => alert(`Mark Returned clicked for ${container.containerNo}`)}
                          size="small"
                          sx={{ textTransform: 'none', color: '#1976d2' }}
                        >
                          Mark Returned
                        </Button>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Container Modal */}
        <Modal open={openAddModal} onClose={() => setOpenAddModal(false)}>
          <Box sx={{ ...modalStyle, width: { xs: '90%', sm: 600 } }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}
            >
              Add New Container
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <FormControl component="fieldset" sx={{ mb: 1 }}>
              <RadioGroup
                row
                name="ownership"
                value={formData.ownership}
                onChange={handleFormChange}
              >
                <FormControlLabel value="SOC" control={<Radio />} label="Owned By" />
                <FormControlLabel value="COC" control={<Radio />} label="Hired By" />
              </RadioGroup>
            </FormControl>
            <Box sx={{ mb: 1 }}>
              <TextField
                label="Container Number"
                name="containerNo"
                value={formData.containerNo}
                onChange={handleFormChange}
                fullWidth
                required
                helperText="Format: 4 letters + 7 digits (e.g., RGSLU1234567)"
                variant="outlined"
                sx={{ bgcolor: 'white', mb: 1 }}
              />
            </Box>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <Box sx={{ flex: 1, mx: 0.5 }}>
                <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white' }}>
                  <InputLabel>Size</InputLabel>
                  <Select name="size" value={formData.size} onChange={handleFormChange}>
                    {["20'", "40'", "40'HC"].map((size) => (
                      <MenuItem key={size} value={size}>{size}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1, mx: 0.5 }}>
                <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white' }}>
                  <InputLabel>Type</InputLabel>
                  <Select name="type" value={formData.type} onChange={handleFormChange}>
                    {["Dry High", "Dry Standard", "Flat High", "Flat Standard", "Open Top", "Open Top High", "Reefer High", "Reefer Standard", "Tank"].map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            {formData.ownership === 'SOC' && (
              <>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white' }}>
                      <InputLabel>Depot Location</InputLabel>
                      <Select name="depotLocation" value={formData.depotLocation} onChange={handleFormChange}>
                        {["Dubai Depot", "Karachi Depot", "Jebel Ali"].map((loc) => (
                          <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white' }}>
                      <InputLabel>Condition</InputLabel>
                      <Select name="condition" value={formData.condition} onChange={handleFormChange}>
                        {["Available", "Under Repair"].map((cond) => (
                          <MenuItem key={cond} value={cond}>{cond}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <TextField
                    label="Date Added"
                    name="dateAdded"
                    type="date"
                    value={formData.dateAdded}
                    onChange={handleFormChange}
                    fullWidth
                    variant="outlined"
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
              </>
            )}
            {formData.ownership === 'COC' && (
              <>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white' }}>
                      <InputLabel>Depot Location</InputLabel>
                      <Select name="depotLocation" value={formData.depotLocation} onChange={handleFormChange}>
                        {["Dubai Depot", "Karachi Depot", "Jebel Ali"].map((loc) => (
                          <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <FormControl fullWidth variant="outlined" sx={{ bgcolor: 'white' }}>
                      <InputLabel>Condition</InputLabel>
                      <Select name="condition" value={formData.condition} onChange={handleFormChange}>
                        {["Available", "Under Repair"].map((cond) => (
                          <MenuItem key={cond} value={cond}>{cond}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <TextField
                    label="Date Added"
                    name="dateAdded"
                    type="date"
                    value={formData.dateAdded}
                    onChange={handleFormChange}
                    fullWidth
                    variant="outlined"
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Hire Start Date"
                      name="hireStartDate"
                      type="date"
                      value={formData.hireStartDate}
                      onChange={handleFormChange}
                      fullWidth
                      required={formData.ownership === 'COC'}
                      variant="outlined"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Hire End Date"
                      name="hireEndDate"
                      type="date"
                      value={formData.hireEndDate}
                      onChange={handleFormChange}
                      fullWidth
                      required={formData.ownership === 'COC'}
                      variant="outlined"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <TextField
                    label="Vendor"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleFormChange}
                    fullWidth
                    required={formData.ownership === 'COC'}
                    variant="outlined"
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
                <Box sx={{ mb: 1 }}>
                  <TextField
                    label="Free Days"
                    name="freeDays"
                    type="number"
                    value={formData.freeDays}
                    onChange={handleFormChange}
                    fullWidth
                    required={formData.ownership === 'COC'}
                    variant="outlined"
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
                <Box sx={{ mb: 1 }}>
                  <TextField
                    label="Place of Loading"
                    name="placeOfLoading"
                    value={formData.placeOfLoading}
                    onChange={handleFormChange}
                    fullWidth
                    required={formData.ownership === 'COC'}
                    variant="outlined"
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
                <Box sx={{ mb: 1 }}>
                  <TextField
                    label="Place of Delivery"
                    name="placeOfDelivery"
                    value={formData.placeOfDelivery}
                    onChange={handleFormChange}
                    fullWidth
                    required={formData.ownership === 'COC'}
                    variant="outlined"
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
              </>
            )}
            <Box sx={{ mb: 1 }}>
              <TextField
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleFormChange}
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                sx={{ bgcolor: 'white' }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              <Button 
                variant="outlined" 
                onClick={() => setOpenAddModal(false)}
                sx={{ textTransform: 'none', borderColor: '#1976d2', color: '#1976d2' }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleFormSubmit}
                sx={{ textTransform: 'none', bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Usage History Modal */}
        <Modal open={openHistoryModal} onClose={() => setOpenHistoryModal(false)}>
          <Box sx={{ ...modalStyle, width: { xs: '90%', sm: 700 } }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}
            >
              Usage History for {selectedContainerNo}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Job No.</TableCell>
                    <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>POL → POD</TableCell>
                    <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Start Date</TableCell>
                    <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>End Date</TableCell>
                    <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Status Progression</TableCell>
                    <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Linked Orders</TableCell>
                    <TableCell sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usageHistory.map((history, index) => (
                    <TableRow 
                      key={history.jobNo}
                      sx={{ 
                        bgcolor: index % 2 === 0 ? '#f9f9f9' : 'white',
                        '&:hover': { bgcolor: '#e3f2fd' }
                      }}
                    >
                      <TableCell 
                        sx={{ cursor: 'pointer', color: '#1976d2', '&:hover': { textDecoration: 'underline' } }} 
                        onClick={() => alert(`Go to Job ${history.jobNo}`)}
                      >
                        {history.jobNo}
                      </TableCell>
                      <TableCell>{`${history.pol} → ${history.pod}`}</TableCell>
                      <TableCell>{history.startDate}</TableCell>
                      <TableCell>{history.endDate}</TableCell>
                      <TableCell>{history.statusProgression.join(' → ')}</TableCell>
                      <TableCell>{history.linkedOrders}</TableCell>
                      <TableCell>{history.remarks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                startIcon={<CloseIcon />}
                onClick={() => setOpenHistoryModal(false)}
                sx={{ textTransform: 'none', bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
              >
                Close
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default ContainerModule;