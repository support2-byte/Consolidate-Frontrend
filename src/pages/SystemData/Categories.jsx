import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControl,
  InputLabel, Select, MenuItem, Snackbar, Alert, CircularProgress, Tooltip, Divider,Chip
} from '@mui/material';
import { api } from '../../api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const Categories = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [selected, setSelected] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCat, setLoadingCat] = useState(true);
  const [errorCat, setErrorCat] = useState(null);

  const [openSubDialog, setOpenSubDialog] = useState(false);
  const [editModeSub, setEditModeSub] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [formDataSub, setFormDataSub] = useState({ name: '', category_id: '' });
  const [selectedSub, setSelectedSub] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingSub, setLoadingSub] = useState(true);
  const [errorSub, setErrorSub] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    setSelectedSub([]);
  }, [selected]);

  const fetchCategories = async () => {
    try {
      setLoadingCat(true);
      setErrorCat(null);
      const response = await api.get('api/options/categories/crud');
      const data = response.data.categories || [];
      console.log('Fetched categories:', data);
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setErrorCat(err.message);
      setSnackbar({ open: true, message: 'Failed to load categories. Please try again.', severity: 'error' });
    } finally {
      setLoadingCat(false);
    }
  };

  const fetchSubcategories = async () => {
    try {
      setLoadingSub(true);
      setErrorSub(null);
      const response = await api.get('api/options/subcategories/crud');
      const data = response.data.subcategories || [];
      console.log('Fetched subcategories:', data);
      setSubcategories(data);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      setErrorSub(err.message);
      setSnackbar({ open: true, message: 'Failed to load subcategories. Please try again.', severity: 'error' });
    } finally {
      setLoadingSub(false);
    }
  };

  const filteredSubcategories = selected.length === 0 
    ? subcategories 
    : subcategories.filter(sub => selected.includes(sub.category_id));

  const validateCatForm = () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Category name is required.', severity: 'warning' });
      return false;
    }
    return true;
  };

  const validateSubForm = () => {
    if (!formDataSub.name.trim()) {
      setSnackbar({ open: true, message: 'Subcategory name is required.', severity: 'warning' });
      return false;
    }
    if (!formDataSub.category_id) {
      setSnackbar({ open: true, message: 'Category selection is required.', severity: 'warning' });
      return false;
    }
    return true;
  };

  const handleOpenDialog = (category = null) => {
    setEditMode(!!category);
    setSelectedCategory(category);
    setFormData(category || { name: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCategory(null);
    setFormData({ name: '' });
  };

  const handleSaveCat = async () => {
    if (!validateCatForm()) return;

    try {
      let response;
      if (editMode) {
        response = await api.put(`api/options/categories/${selectedCategory.id}`, { name: formData.name });
      } else {
        response = await api.post('api/options/categories', { name: formData.name });
      }
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to save category');
      }
      await fetchCategories();
      handleCloseDialog();
      setSnackbar({ 
        open: true, 
        message: editMode ? 'Category updated successfully!' : 'Category added successfully!', 
        severity: 'success' 
      });
    } catch (err) {
      console.error('Error saving category:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to save category.', severity: 'error' });
    }
  };

  const handleBulkDeleteCat = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selected.length} selected categories? This action cannot be undone.`)) {
      return;
    }
    try {
      for (const id of selected) {
        const response = await api.delete(`api/options/categories/${id}`);
        if (response.status >= 400) {
          throw new Error(response.data.error || 'Failed to delete category');
        }
      }
      await fetchCategories();
      await fetchSubcategories(); // Refresh subs as they may depend on cats
      setSelected([]);
      setSnackbar({ open: true, message: 'Selected categories deleted successfully!', severity: 'success' });
    } catch (err) {
      console.error('Error deleting categories:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to delete categories.', severity: 'error' });
    }
  };

  const handleToggleCat = (id, event) => {
    event.stopPropagation();
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleHeaderCheckboxCat = (event) => {
    event.stopPropagation();
    setSelected(event.target.checked ? categories.map(c => c.id) : []);
  };

  // Subcategory handlers
  const handleOpenSubDialog = (subcategory = null) => {
    setEditModeSub(!!subcategory);
    setSelectedSubCategory(subcategory);
    setFormDataSub(subcategory || { name: '', category_id: '' });
    setOpenSubDialog(true);
  };

  const handleCloseSubDialog = () => {
    setOpenSubDialog(false);
    setSelectedSubCategory(null);
    setFormDataSub({ name: '', category_id: '' });
  };

  const handleSaveSub = async () => {
    if (!validateSubForm()) return;

    try {
      let response;
      if (editModeSub) {
        response = await api.put(`api/options/subcategories/${selectedSubCategory.id}`, { 
          name: formDataSub.name, 
          category_id: parseInt(formDataSub.category_id) 
        });
      } else {
        response = await api.post('api/options/subcategories', { 
          name: formDataSub.name, 
          category_id: parseInt(formDataSub.category_id) 
        });
      }
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to save subcategory');
      }
      await fetchSubcategories();
      handleCloseSubDialog();
      setSnackbar({ 
        open: true, 
        message: editModeSub ? 'Subcategory updated successfully!' : 'Subcategory added successfully!', 
        severity: 'success' 
      });
    } catch (err) {
      console.error('Error saving subcategory:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to save subcategory.', severity: 'error' });
    }
  };

  const handleBulkDeleteSub = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedSub.length} selected subcategories? This action cannot be undone.`)) {
      return;
    }
    try {
      for (const id of selectedSub) {
        const response = await api.delete(`api/options/subcategories/${id}`);
        if (response.status >= 400) {
          throw new Error(response.data.error || 'Failed to delete subcategory');
        }
      }
      await fetchSubcategories();
      setSelectedSub([]);
      setSnackbar({ open: true, message: 'Selected subcategories deleted successfully!', severity: 'success' });
    } catch (err) {
      console.error('Error deleting subcategories:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to delete subcategories.', severity: 'error' });
    }
  };

  const handleToggleSub = (id, event) => {
    event.stopPropagation();
    setSelectedSub(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleHeaderCheckboxSub = (event) => {
    event.stopPropagation();
    setSelectedSub(event.target.checked ? filteredSubcategories.map(s => s.id) : []);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderEmptyState = (type) => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        No {type} found
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Click "Add New" to get started.
      </Typography>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => type === 'categories' ? handleOpenDialog() : handleOpenSubDialog()} sx={{ mt: 2 }}>
        Add Your First {type === 'categories' ? 'Category' : 'Subcategory'}
      </Button>
    </Box>
  );

  if (loadingCat || loadingSub) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  if (errorCat || errorSub) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorCat || errorSub}. <Button size="small" onClick={() => { fetchCategories(); fetchSubcategories(); }}>Retry</Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Categories Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#0d6c6a' }}>
              Manage Categories
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Organize your main categories. Subcategories will be filtered based on selected categories below.
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
            size="large"
            sx={{ backgroundColor: '#0d6c6a', '&:hover': { backgroundColor: '#0a5654' } }}
          >
            Add New Category
          </Button>
        </Box>

        <Paper sx={{ p: 2, overflowX: 'auto', position: 'relative' }}>
          {loadingCat && (
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <CircularProgress />
            </Box>
          )}
          {errorCat && !loadingCat && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorCat}. <Button size="small" onClick={fetchCategories}>Retry</Button>
            </Alert>
          )}
          <Table>
            <TableHead sx={{ backgroundColor: '#0d6c6a' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < categories.length}
                    checked={categories.length > 0 && selected.length === categories.length}
                    onChange={handleHeaderCheckboxCat}
                  />
                </TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 ? (
                renderEmptyState('categories')
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} hover onClick={() => handleOpenDialog(category)} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(category.id)}
                        onChange={(e) => handleToggleCat(category.id, e)}
                      />
                    </TableCell>
                    <TableCell>{category.id}</TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">{category.name}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {selected.length > 0 && (
                <Tooltip title={`Delete ${selected.length} selected categories`}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleBulkDeleteCat}
                    sx={{ mr: 2 }}
                  >
                    Delete Selected
                  </Button>
                </Tooltip>
              )}
              <Typography variant="body2" color="textSecondary">
                {categories.length} {categories.length === 1 ? 'category' : 'categories'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" disabled>
                Previous
              </Button>
              <Button variant="contained" size="small" disabled>
                Next
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Subcategories Section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#0d6c6a' }}>
              Manage Subcategories
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Subcategories are grouped under categories. {selected.length > 0 ? `Showing subcategories for ${selected.length} selected category(ies).` : 'Select categories above to filter.'}
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenSubDialog()}
            size="large"
            disabled={categories.length === 0}
            sx={{ backgroundColor: '#0d6c6a', '&:hover': { backgroundColor: '#0a5654' } }}
          >
            Add New Subcategory
          </Button>
        </Box>

        <Paper sx={{ p: 2, overflowX: 'auto', position: 'relative' }}>
          {loadingSub && (
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <CircularProgress />
            </Box>
          )}
          {errorSub && !loadingSub && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorSub}. <Button size="small" onClick={fetchSubcategories}>Retry</Button>
            </Alert>
          )}
          <Table>
            <TableHead sx={{ backgroundColor: '#0d6c6a' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedSub.length > 0 && selectedSub.length < filteredSubcategories.length}
                    checked={filteredSubcategories.length > 0 && selectedSub.length === filteredSubcategories.length}
                    onChange={handleHeaderCheckboxSub}
                  />
                </TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubcategories.length === 0 ? (
                renderEmptyState('subcategories')
              ) : (
                filteredSubcategories.map((subcategory) => (
                  <TableRow key={subcategory.id} hover onClick={() => handleOpenSubDialog(subcategory)} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedSub.includes(subcategory.id)}
                        onChange={(e) => handleToggleSub(subcategory.id, e)}
                      />
                    </TableCell>
                    <TableCell>{subcategory.id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={categories.find(c => c.id === subcategory.category_id)?.name || 'Unknown'} 
                        size="small" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">{subcategory.name}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {selectedSub.length > 0 && (
                <Tooltip title={`Delete ${selectedSub.length} selected subcategories`}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleBulkDeleteSub}
                    sx={{ mr: 2 }}
                  >
                    Delete Selected
                  </Button>
                </Tooltip>
              )}
              <Typography variant="body2" color="textSecondary">
                {filteredSubcategories.length} {filteredSubcategories.length === 1 ? 'subcategory' : 'subcategories'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" disabled>
                Previous
              </Button>
              <Button variant="contained" size="small" disabled>
                Next
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Categories Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#0d6c6a', color: '#fff' }}>
          {editMode ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {editMode ? 'Update the category name below.' : 'Enter a category name. Required fields are marked with *.'}
          </Typography>
          <TextField
            fullWidth
            label="Category Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 1 }}
            required
            error={!formData.name.trim()}
            helperText={!formData.name.trim() ? 'Required field' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveCat} variant="contained" disabled={!formData.name.trim()}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subcategories Dialog */}
      <Dialog open={openSubDialog} onClose={handleCloseSubDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#0d6c6a', color: '#fff' }}>
          {editModeSub ? 'Edit Subcategory' : 'Add New Subcategory'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {editModeSub ? 'Update the subcategory details below.' : 'Enter subcategory details. Required fields are marked with *.'}
          </Typography>
          <TextField
            fullWidth
            label="Subcategory Name *"
            value={formDataSub.name}
            onChange={(e) => setFormDataSub({ ...formDataSub, name: e.target.value })}
            sx={{ mt: 1 }}
            required
            error={!formDataSub.name.trim()}
            helperText={!formDataSub.name.trim() ? 'Required field' : ''}
          />
          <FormControl fullWidth sx={{ mt: 2 }} required error={!formDataSub.category_id}>
            <InputLabel>Parent Category *</InputLabel>
            <Select
              value={formDataSub.category_id}
              label="Parent Category *"
              onChange={(e) => setFormDataSub({ ...formDataSub, category_id: e.target.value })}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
            {!formDataSub.category_id && <Typography variant="caption" color="error">Required field</Typography>}
          </FormControl>
          <Divider sx={{ my: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubDialog}>Cancel</Button>
          <Button onClick={handleSaveSub} variant="contained" disabled={!formDataSub.name.trim() || !formDataSub.category_id}>
            {editModeSub ? 'Update' : 'Create'}
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

export default Categories;