import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel,
  Radio, FormControl, FormLabel, Snackbar, Alert, CircularProgress, Chip, Tooltip
} from '@mui/material';
import { api } from '../../api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const ThirdParties = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [formData, setFormData] = useState({ 
    company_name: '', 
    contact_name: '', 
    contact_email: '', 
    contact_phone: '', 
    address: '', 
    type: '' 
  });
  const [thirdParties, setThirdParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchThirdParties();
  }, []);

  const fetchThirdParties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('api/options/thirdParty/crud');
      const data = response.data.third_parties || [];
      console.log('Fetched third parties:', data);
      setThirdParties(data);
    } catch (err) {
      console.error('Error fetching third parties:', err);
      setError(err.message);
      setSnackbar({ open: true, message: 'Failed to load third parties. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.company_name.trim()) {
      setSnackbar({ open: true, message: 'Company name is required.', severity: 'warning' });
      return false;
    }
    if (!formData.contact_name.trim()) {
      setSnackbar({ open: true, message: 'Contact name is required.', severity: 'warning' });
      return false;
    }
    if (!formData.address.trim()) {
      setSnackbar({ open: true, message: 'Address is required.', severity: 'warning' });
      return false;
    }
    if (!formData.type) {
      setSnackbar({ open: true, message: 'Type is required.', severity: 'warning' });
      return false;
    }
    return true;
  };

  const handleOpenDialog = (party = null) => {
    setEditMode(!!party);
    setSelectedParty(party);
    if (party) {
      setFormData({ 
        company_name: party.company_name || '', 
        contact_name: party.contact_name || '', 
        contact_email: party.contact_email || '', 
        contact_phone: party.contact_phone || '', 
        address: party.address || '', 
        type: party.type || '' 
      });
    } else {
      setFormData({ 
        company_name: '', 
        contact_name: '', 
        contact_email: '', 
        contact_phone: '', 
        address: '', 
        type: '' 
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedParty(null);
    setFormData({ 
      company_name: '', 
      contact_name: '', 
      contact_email: '', 
      contact_phone: '', 
      address: '', 
      type: '' 
    });
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setDialogLoading(true);
      let response;
      if (editMode) {
        response = await api.put(`api/options/thirdParty/${selectedParty.id}`, {
          company_name: formData.company_name,
          contact_name: formData.contact_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          address: formData.address,
          type: formData.type
        });
      } else {
        response = await api.post('api/options/thirdParty', {
          company_name: formData.company_name,
          contact_name: formData.contact_name,  
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          address: formData.address,
          type: formData.type
        });
      }
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to save third party');
      }
      await fetchThirdParties();
      handleCloseDialog();
      setSnackbar({ 
        open: true, 
        message: editMode ? 'Third party updated successfully!' : 'Third party added successfully!', 
        severity: 'success' 
      });
    } catch (err) {
      console.error('Error saving third party:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to save third party.', severity: 'error' });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this third party? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`api/options/thirdParty/${id}`);
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to delete third party');
      }
      await fetchThirdParties();
      setSnackbar({ open: true, message: 'Third party deleted successfully!', severity: 'success' });
    } catch (err) {
      console.error('Error deleting third party:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to delete third party.', severity: 'error' });
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'shipper': return 'Shipper';
      case 'consignee': return 'Consignee';
      case 'transport_company': return 'Transport Company';
      default: return 'None';
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderEmptyState = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        No third parties found
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Click "Add New" to get started.
      </Typography>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mt: 2 }}>
        Add Your First Third Party
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Manage Third Parties
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add New Third Party
        </Button>
      </Box>

      <Paper sx={{ p: 2, overflowX: 'auto', position: 'relative' }}>
        {loading && (
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <CircularProgress />
          </Box>
        )}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}. <Button size="small" onClick={fetchThirdParties}>Retry</Button>
          </Alert>
        )}
        <Table>
          <TableHead sx={{background:'#0d6c6a',color:'#fff'}}>
            <TableRow>
              <TableCell sx={{color:'#fff'}}><strong>ID</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Company Name</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Contact Name</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Email</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Phone</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Address</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Type</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {thirdParties.length === 0 && !loading ? (
              renderEmptyState()
            ) : (
              thirdParties.map((party) => (
                <TableRow key={party.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{party.id}</TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">{party.company_name}</Typography>
                  </TableCell>
                  <TableCell>{party.contact_name || 'N/A'}</TableCell>
                  <TableCell>{party.contact_email || 'N/A'}</TableCell>
                  <TableCell>{party.contact_phone || 'N/A'}</TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Tooltip title={party.address || 'N/A'}>
                      <Typography variant="body2" noWrap>{party.address || 'N/A'}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getTypeLabel(party.type)} 
                      size="small" 
                      color={party.type === 'transport_company' ? 'secondary' : 'primary'} 
                      variant={party.type === '' ? 'outlined' : 'filled'}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Third Party">
                      <IconButton size="small" onClick={() => handleOpenDialog(party)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Third Party">
                      <IconButton size="small" color="error" onClick={() => handleDelete(party.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{background:'#0d6c6a',color:'#fff'}}>
          {editMode ? 'Edit Third Party' : 'Add New Third Party'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {editMode ? 'Update the details below.' : 'Enter third party details. Required fields are marked with *.'}
          </Typography>
          <TextField
            fullWidth
            label="Company Name *"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            sx={{ mt: 1 }}
            required
            error={!formData.company_name.trim()}
            helperText={!formData.company_name.trim() ? 'Required field' : ''}
          />
          <TextField
            fullWidth
            label="Contact Name *"
            value={formData.contact_name}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            sx={{ mt: 2 }}
            required
            error={!formData.contact_name.trim()}
            helperText={!formData.contact_name.trim() ? 'Required field' : ''}
          />
          <TextField
            fullWidth
            label="Contact Email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            sx={{ mt: 2 }}
            helperText="Optional"
          />
          <TextField
            fullWidth
            label="Contact Phone"
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            sx={{ mt: 2 }}
            helperText="Optional (e.g., +1-234-567-8900)"
          />
          <TextField
            fullWidth
            label="Address *"
            multiline
            rows={3}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            sx={{ mt: 2 }}
            required
            error={!formData.address.trim()}
            helperText={!formData.address.trim() ? 'Required field (include plot, street, city, etc.)' : ''}
          />
          <FormControl sx={{ mt: 2 }} required error={!formData.type}>
            <FormLabel>Type *</FormLabel>
            <RadioGroup
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              row
            >
              <FormControlLabel value="shipper" control={<Radio />} label="Shipper" />
              <FormControlLabel value="consignee" control={<Radio />} label="Consignee" />
              <FormControlLabel value="transport_company" control={<Radio />} label="Transport Company" />
            </RadioGroup>
            {!formData.type && <Typography variant="caption" color="error">Required field</Typography>}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={dialogLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={dialogLoading || !formData.company_name.trim() || !formData.contact_name.trim() || !formData.address.trim() || !formData.type}
          >
            {dialogLoading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ThirdParties;