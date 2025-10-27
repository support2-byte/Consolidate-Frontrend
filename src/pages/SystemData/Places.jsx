import React, { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const Places = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'Origin', location: '' });

  const mockPlaces = [
    { id: 1, name: 'Port A', type: 'Origin', location: 'USA' },
    { id: 2, name: 'Port B', type: 'Destination', location: 'Europe' },
  ];

  const handleOpenDialog = (place = null) => {
    setEditMode(!!place);
    setSelectedPlace(place);
    setFormData(place || { name: '', type: 'Origin', location: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPlace(null);
    setFormData({ name: '', type: 'Origin', location: '' });
  };

  const handleSave = () => {
    console.log('Saving Place:', formData);
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    console.log('Deleting ID:', id);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">Places</Typography>
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
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockPlaces.map((place) => (
              <TableRow key={place.id} hover>
                <TableCell>{place.id}</TableCell>
                <TableCell>{place.name}</TableCell>
                <TableCell>{place.type}</TableCell>
                <TableCell>{place.location}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(place)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(place.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editMode ? 'Edit Place' : 'Add Place'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} sx={{ mt: 2 }} />
          <TextField fullWidth label="Type" select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} sx={{ mt: 2 }}>
            <MenuItem value="Origin">Origin</MenuItem>
            <MenuItem value="Destination">Destination</MenuItem>
          </TextField>
          <TextField fullWidth label="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Places;