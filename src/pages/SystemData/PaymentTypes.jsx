import React, { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
const PaymentTypes = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({ type: '', description: '' });

  const mockPaymentTypes = [
    { id: 1, type: 'Prepaid', description: 'Paid in advance' },
    { id: 2, type: 'Collect', description: 'Paid on delivery' },
  ];

  const handleOpenDialog = (type = null) => {
    setEditMode(!!type);
    setSelectedType(type);
    setFormData(type || { type: '', description: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedType(null);
    setFormData({ type: '', description: '' });
  };

  const handleSave = () => {
    // API call logic here
    console.log('Saving:', formData);
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    // API delete logic
    console.log('Deleting ID:', id);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">Payment Types</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add New
        </Button>
      </Box>
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockPaymentTypes.map((type) => (
              <TableRow key={type.id} hover>
                <TableCell>{type.id}</TableCell>
                <TableCell>{type.type}</TableCell>
                <TableCell>{type.description}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(type)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(type.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editMode ? 'Edit Payment Type' : 'Add Payment Type'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} sx={{ mt: 2 }} />
          <TextField fullWidth label="Description" multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} sx={{ mt: 2 }} />
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