import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { api } from '../../api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const PaymentTypes = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: '', percent: '', days: '' });
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  const fetchPaymentTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('api/options/payment-types/crud'); // Updated endpoint for full list
      const data = await response.data.paymentTypes; // For axios, use .data
      console.log('Fetched payment types:', data);
      setPaymentTypes(data || []); // Expect { paymentTypes: [...] }
    } catch (err) {
      console.error('Error fetching payment types:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type = null) => {
    setEditMode(!!type);
    setSelectedType(type);
    setFormData(type || { name: '', type: '', percent: '', days: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedType(null);
    setFormData({ name: '', type: '', percent: '', days: '' });
  };

  const handleSave = async () => {
    try {
      let response;
      if (editMode) {
        response = await api.put(`api/options/payment-types/${selectedType.id}`, formData); // Updated endpoint
      } else {
        response = await api.post('api/options/payment-types', formData); // Updated endpoint
      }
      if (response.status >= 400) { // For axios, check status
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to save payment type');
      }
      await fetchPaymentTypes(); // Refresh list
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving payment type:', err);
      alert(err.message); // Replace with proper error handling (e.g., Snackbar)
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment type?')) {
      return;
    }
    try {
      const response = await api.delete(`api/options/payment-types/${id}`); // Updated endpoint
      if (response.status >= 400) { // For axios, check status
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to delete payment type');
      }
      await fetchPaymentTypes(); // Refresh list
    } catch (err) {
      console.error('Error deleting payment type:', err);
      alert(err.message); // Replace with proper error handling (e.g., Snackbar)
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;
  }

  if (error) {
    return <Box sx={{ p: 3 }}><Typography color="error">Error: {error}</Typography></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">Payment Types</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add
        </Button>
      </Box>
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead sx={{background:'#0d6c6a',color:'#fff'}}>
                    <TableRow>
                      <TableCell sx={{color:'#fff'}}>Payment Type Name</TableCell>
              <TableCell sx={{color:'#fff'}}>Type</TableCell>
             <TableCell sx={{color:'#fff'}}>Percent</TableCell>
             <TableCell sx={{color:'#fff'}}>Days</TableCell>
            <TableCell sx={{color:'#fff'}}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentTypes.map((type) => (
              <TableRow key={type.id} hover>
                <TableCell>{type.name}</TableCell>
                <TableCell align="center">{type.type || ''}</TableCell>
                <TableCell align="center">{type.percent || '0%'}</TableCell>
                <TableCell align="center">{type.days || 0}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleOpenDialog(type)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(type.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, p: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2">1 - 8 of 8</Typography>
          </Box>
          <Button variant="outlined" size="small" disabled>
            Previous
          </Button>
          <Button variant="contained" size="small" disabled>
            Next
          </Button>
        </Box>
      </Paper>

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Payment Type' : 'Add Payment Type'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Type (e.g., DP, DA)"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Percent"
            type="number"
            value={formData.percent}
            onChange={(e) => setFormData({ ...formData, percent: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Days"
            type="number"
            value={formData.days}
            onChange={(e) => setFormData({ ...formData, days: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentTypes;