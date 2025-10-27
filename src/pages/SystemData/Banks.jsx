import React, { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const Banks = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [formData, setFormData] = useState({ name: '', account: '', swift: '' });

  const mockBanks = [
    { id: 1, name: 'Bank 1', account: '123456', swift: 'BANKUS33' },
    { id: 2, name: 'Bank 2', account: '789012', swift: 'BANKGB2L' },
  ];

  const handleOpenDialog = (bank = null) => {
    setEditMode(!!bank);
    setSelectedBank(bank);
    setFormData(bank || { name: '', account: '', swift: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBank(null);
    setFormData({ name: '', account: '', swift: '' });
  };

  const handleSave = () => {
    console.log('Saving Bank:', formData);
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    console.log('Deleting ID:', id);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">Banks</Typography>
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
              <TableCell>Account</TableCell>
              <TableCell>SWIFT</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockBanks.map((bank) => (
              <TableRow key={bank.id} hover>
                <TableCell>{bank.id}</TableCell>
                <TableCell>{bank.name}</TableCell>
                <TableCell>{bank.account}</TableCell>
                <TableCell>{bank.swift}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(bank)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(bank.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editMode ? 'Edit Bank' : 'Add Bank'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} sx={{ mt: 2 }} />
          <TextField fullWidth label="Account Number" value={formData.account} onChange={(e) => setFormData({ ...formData, account: e.target.value })} sx={{ mt: 2 }} />
          <TextField fullWidth label="SWIFT Code" value={formData.swift} onChange={(e) => setFormData({ ...formData, swift: e.target.value })} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Banks;