import React, { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
const Vessels = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [formData, setFormData] = useState({ name: '', capacity: '', status: 'Active' });

  const mockVessels = [
    { id: 1, name: 'Vessel 1', capacity: '500 TEU', status: 'Active' },
    { id: 2, name: 'Vessel 2', capacity: '1000 TEU', status: 'Maintenance' },
  ];

  const handleOpenDialog = (vessel = null) => {
    setEditMode(!!vessel);
    setSelectedVessel(vessel);
    setFormData(vessel || { name: '', capacity: '', status: 'Active' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVessel(null);
    setFormData({ name: '', capacity: '', status: 'Active' });
  };

  const handleSave = () => {
    console.log('Saving Vessel:', formData);
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    console.log('Deleting ID:', id);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">Vessels</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add New
        </Button>
      </Box>
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockVessels.map((vessel) => (
              <TableRow key={vessel.id} hover>
                <TableCell>{vessel.id}</TableCell>
                <TableCell>{vessel.name}</TableCell>
                <TableCell>{vessel.capacity}</TableCell>
                <TableCell>{vessel.status}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(vessel)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(vessel.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editMode ? 'Edit Vessel' : 'Add Vessel'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} sx={{ mt: 2 }} />
          <TextField fullWidth label="Capacity (TEU)" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} sx={{ mt: 2 }} />
          <TextField fullWidth label="Status" select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} sx={{ mt: 2 }}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Maintenance">Maintenance</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vessels;