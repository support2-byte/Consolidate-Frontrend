import React, { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const ThirdParties = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [formData, setFormData] = useState({ name: '', contact: '', type: '' });

  const mockThirdParties = [
    { id: 1, name: 'Third Party A', contact: 'contacta@example.com', type: 'Partner' },
    { id: 2, name: 'Third Party B', contact: 'contactb@example.com', type: 'Vendor' },
  ];

  const handleOpenDialog = (party = null) => {
    setEditMode(!!party);
    setSelectedParty(party);
    setFormData(party || { name: '', contact: '', type: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedParty(null);
    setFormData({ name: '', contact: '', type: '' });
  };

  const handleSave = () => {
    console.log('Saving Third Party:', formData);
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    console.log('Deleting ID:', id);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">3rd Parties</Typography>
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
              <TableCell>Contact</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockThirdParties.map((party) => (
              <TableRow key={party.id} hover>
                <TableCell>{party.id}</TableCell>
                <TableCell>{party.name}</TableCell>
                <TableCell>{party.contact}</TableCell>
                <TableCell>{party.type}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(party)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(party.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editMode ? 'Edit 3rd Party' : 'Add 3rd Party'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} sx={{ mt: 2 }} />
          <TextField fullWidth label="Contact Email" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} sx={{ mt: 2 }} />
          <TextField fullWidth label="Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThirdParties;