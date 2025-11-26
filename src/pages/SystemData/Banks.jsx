import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Snackbar, Alert, CircularProgress, Chip, Tooltip
} from '@mui/material';
import { api } from '../../api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const Banks = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    account_number: '', 
    swift_code: '', 
    branch: '', 
    address: '', 
    currency: 'USD' 
  });
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('api/options/banks/crud');
      const data = response.data.banks || [];
      console.log('Fetched banks:', data);
      setBanks(data);
    } catch (err) {
      console.error('Error fetching banks:', err);
      setError(err.message);
      setSnackbar({ open: true, message: 'Failed to load banks. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Bank name is required.', severity: 'warning' });
      return false;
    }
    if (!formData.account_number.trim()) {
      setSnackbar({ open: true, message: 'Account number is required.', severity: 'warning' });
      return false;
    }
    if (!formData.swift_code.trim()) {
      setSnackbar({ open: true, message: 'SWIFT code is required.', severity: 'warning' });
      return false;
    }
    return true;
  };

  const handleOpenDialog = (bank = null) => {
    setEditMode(!!bank);
    setSelectedBank(bank);
    if (bank) {
      setFormData({ 
        name: bank.name || '', 
        account_number: bank.account_number || '', 
        swift_code: bank.swift_code || '', 
        branch: bank.branch || '', 
        address: bank.address || '', 
        currency: bank.currency || 'USD' 
      });
    } else {
      setFormData({ 
        name: '', 
        account_number: '', 
        swift_code: '', 
        branch: '', 
        address: '', 
        currency: 'USD' 
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBank(null);
    setFormData({ 
      name: '', 
      account_number: '', 
      swift_code: '', 
      branch: '', 
      address: '', 
      currency: 'USD' 
    });
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setDialogLoading(true);
      let response;
      if (editMode) {
        response = await api.put(`api/options/banks/${selectedBank.id}`, {
          name: formData.name,
          account_number: formData.account_number,
          swift_code: formData.swift_code,
          branch: formData.branch,
          address: formData.address,
          currency: formData.currency
        });
      } else {
        response = await api.post('api/options/banks', {
          name: formData.name,
          account_number: formData.account_number,
          swift_code: formData.swift_code,
          branch: formData.branch,
          address: formData.address,
          currency: formData.currency
        });
      }
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to save bank');
      }
      await fetchBanks();
      handleCloseDialog();
      setSnackbar({ 
        open: true, 
        message: editMode ? 'Bank updated successfully!' : 'Bank added successfully!', 
        severity: 'success' 
      });
    } catch (err) {
      console.error('Error saving bank:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to save bank.', severity: 'error' });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`api/options/banks/${id}`);
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to delete bank');
      }
      await fetchBanks();
      setSnackbar({ open: true, message: 'Bank deleted successfully!', severity: 'success' });
    } catch (err) {
      console.error('Error deleting bank:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to delete bank.', severity: 'error' });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderEmptyState = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        No banks found
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Click "Add New" to get started.
      </Typography>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mt: 2 }}>
        Add Your First Bank
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Manage Banks
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Add, edit, or remove bank accounts for payments and transactions.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add New Bank
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
            {error}. <Button size="small" onClick={fetchBanks}>Retry</Button>
          </Alert>
        )}
        <Table>
          <TableHead sx={{background:'#0d6c6a',color:'#fff'}}>
            <TableRow>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>ID</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Bank Name</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Account Number</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>SWIFT Code</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Branch</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Currency</strong></TableCell>
              <TableCell sx={{background:'#0d6c6a',color:'#fff'}}><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {banks.length === 0 && !loading ? (
              renderEmptyState()
            ) : (
              banks.map((bank) => (
                <TableRow key={bank.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{bank.id}</TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">{bank.name}</Typography>
                  </TableCell>
                  <TableCell>{bank.account_number}</TableCell>
                  <TableCell>
                    <Tooltip title={bank.swift_code}>
                      <Chip label={bank.swift_code} size="small" color="primary" />
                    </Tooltip>
                  </TableCell>
                  <TableCell>{bank.branch || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={bank.currency} size="small" color="secondary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Bank">
                      <IconButton size="small" onClick={() => handleOpenDialog(bank)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Bank">
                      <IconButton size="small" color="error" onClick={() => handleDelete(bank.id)}>
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
        <DialogTitle>
          {editMode ? 'Edit Bank' : 'Add New Bank'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {editMode ? 'Update the details below.' : 'Enter bank details. Required fields are marked with *.'}
          </Typography>
          <TextField
            fullWidth
            label="Bank Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 1 }}
            required
            error={!formData.name.trim()}
            helperText={!formData.name.trim() ? 'Required field' : ''}
          />
          <TextField
            fullWidth
            label="Account Number *"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            sx={{ mt: 2 }}
            required
            error={!formData.account_number.trim()}
            helperText={!formData.account_number.trim() ? 'Required field' : ''}
          />
          <TextField
            fullWidth
            label="SWIFT Code *"
            value={formData.swift_code}
            onChange={(e) => setFormData({ ...formData, swift_code: e.target.value.toUpperCase() })}
            sx={{ mt: 2 }}
            required
            error={!formData.swift_code.trim()}
            helperText={!formData.swift_code.trim() ? 'Required field (e.g., BOFAUS3N)' : ''}
          />
          <TextField
            fullWidth
            label="Branch"
            value={formData.branch}
            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            sx={{ mt: 2 }}
            helperText="Optional"
          />
          <TextField
            fullWidth
            label="Address"
            multiline
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            sx={{ mt: 2 }}
            helperText="Optional (full bank address)"
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={formData.currency}
              label="Currency"
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="GBP">GBP</MenuItem>
              <MenuItem value="PKR">PKR</MenuItem>
              <MenuItem value="AED">AED</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={dialogLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={dialogLoading || !formData.name.trim() || !formData.account_number.trim() || !formData.swift_code.trim()}
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

export default Banks;