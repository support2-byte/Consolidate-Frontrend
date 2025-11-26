import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel, Autocomplete, TextField,
  ListItemText, Snackbar, Alert, CircularProgress, Chip, Tooltip, Divider
} from '@mui/material';
import { api } from '../../api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_PARAMS = 'format=json&limit=5&addressdetails=1&countrycodes='; // Add country filter if needed, e.g., 'us,ca'

const Places = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    isLoading: false, 
    isDestination: false, 
    country: '', 
    latitude: '', 
    longitude: '' 
  });
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [suggestions, setSuggestions] = useState([]); // For autocomplete options
  const [inputValue, setInputValue] = useState(''); // Debounced input
  const timeoutRef = useRef(null);

  useEffect(() => {
    fetchPlaces();
  }, []);

  // Safe inputValue for MUI (always string)
  const safeInputValue = inputValue || '';

  // Debounced Nominatim search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (safeInputValue.length > 2) { // Use safe version
        fetchSuggestions(safeInputValue);
      } else {
        setSuggestions([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutRef.current);
  }, [safeInputValue]); // Depend on safe version

  const fetchSuggestions = async (query) => {
    try {
      const response = await fetch(`${NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&${NOMINATIM_PARAMS}`);
      if (!response.ok) throw new Error('Nominatim search failed');
      const data = await response.json();
      setSuggestions(data.map(item => ({
        label: item.display_name || item.name,
        value: item.display_name,
        lat: item.lat,
        lon: item.lon,
        country: item.address?.country || ''
      })));
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (event, option) => {
    if (option) {
      setFormData(prev => ({
        ...prev,
        name: option.value,
        latitude: option.lat,
        longitude: option.lon,
        country: option.country
      }));
      setInputValue(option.label || ''); // Ensure string
    }
  };

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('api/options/places/crud');
      const data = response.data.places || [];
      console.log('Fetched places:', data);
      setPlaces(data);
    } catch (err) {
      console.error('Error fetching places:', err);
      setError(err.message);
      setSnackbar({ open: true, message: 'Failed to load places. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Place name is required.', severity: 'warning' });
      return false;
    }
    if (!formData.country.trim()) {
      setSnackbar({ open: true, message: 'Country is required.', severity: 'warning' });
      return false;
    }
    return true;
  };

  const handleOpenDialog = (place = null) => {
    setEditMode(!!place);
    setSelectedPlace(place);
    if (place) {
      // Map snake_case backend keys to camelCase form state for edit
      setFormData({ 
        name: place.name || '', 
        isLoading: place.is_loading || false, 
        isDestination: place.is_destination || false, 
        country: place.country || '', 
        latitude: place.latitude || '', 
        longitude: place.longitude || '' 
      });
      setInputValue(place.name || ''); // Prefill input for better UX
    } else {
      setFormData({ 
        name: '', 
        isLoading: false, 
        isDestination: false, 
        country: '', 
        latitude: '', 
        longitude: '' 
      });
      setInputValue(''); // Reset to empty string
    }
    setSuggestions([]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPlace(null);
    setFormData({ 
      name: '', 
      isLoading: false, 
      isDestination: false, 
      country: '', 
      latitude: '', 
      longitude: '' 
    });
    setSuggestions([]);
    setInputValue(''); // Reset to empty string
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setDialogLoading(true);
      let response;
      if (editMode) {
        response = await api.put(`api/options/places/${selectedPlace.id}`, {
          name: formData.name,
          is_loading: formData.isLoading,
          is_destination: formData.isDestination,
          country: formData.country,
          latitude: parseFloat(formData.latitude) || null,
          longitude: parseFloat(formData.longitude) || null
        });
      } else {
        response = await api.post('api/options/places', {
          name: formData.name,
          is_loading: formData.isLoading,
          is_destination: formData.isDestination,
          country: formData.country,
          latitude: parseFloat(formData.latitude) || null,
          longitude: parseFloat(formData.longitude) || null
        });
      }
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to save place');
      }
      await fetchPlaces();
      handleCloseDialog();
      setSnackbar({ 
        open: true, 
        message: editMode ? 'Place updated successfully!' : 'Place added successfully!', 
        severity: 'success' 
      });
    } catch (err) {
      console.error('Error saving place:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to save place.', severity: 'error' });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this place? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`api/options/places/${id}`);
      if (response.status >= 400) {
        const errorData = response.data;
        throw new Error(errorData.error || 'Failed to delete place');
      }
      await fetchPlaces();
      setSnackbar({ open: true, message: 'Place deleted successfully!', severity: 'success' });
    } catch (err) {
      console.error('Error deleting place:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to delete place.', severity: 'error' });
    }
  };

  const getTypeLabel = (place) => {
    const types = [];
    if (place.is_loading) types.push('Loading');
    if (place.is_destination) types.push('Destination');
    return types.join(', ') || 'None';
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderEmptyState = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        No places found
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Click "Add New" to get started.
      </Typography>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mt: 2 }}>
        Add Your First Place
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Manage Places
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Add, edit, or remove locations for loading and destinations.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add New Place
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
            {error}. <Button size="small" onClick={fetchPlaces}>Retry</Button>
          </Alert>
        )}
        <Table>
          <TableHead sx={{background:'#0d6c6a',color:'#fff'}}>
            <TableRow>
              <TableCell sx={{color:'#fff'}}><strong>ID</strong></TableCell>
              <TableCell  sx={{color:'#fff'}}><strong>Name</strong></TableCell>
              <TableCell  sx={{color:'#fff'}}><strong>Type</strong></TableCell>
              <TableCell sx={{color:'#fff'}}><strong>Country</strong></TableCell>
              <TableCell sx={{color:'#fff'}}><strong>Latitude</strong></TableCell>
              <TableCell sx={{color:'#fff'}}><strong>Longitude</strong></TableCell>
              <TableCell sx={{color:'#fff'}}><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {places.length === 0 && !loading ? (
              renderEmptyState()
            ) : (
              places.map((place) => (
                <TableRow key={place.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{place.id}</TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">{place.name}</Typography>
                  </TableCell>
                  <TableCell>
                    {getTypeLabel(place) === 'None' ? (
                      <Chip label="None" size="small" color='primary' variant="outlined" />
                    ) : (
                      <Chip label={getTypeLabel(place)} size="small" color='primary' />
                    )}
                  </TableCell>
                  <TableCell>{place.country || 'N/A'}</TableCell>
                  <TableCell>{place.latitude || 'N/A'}</TableCell>
                  <TableCell>{place.longitude || 'N/A'}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit Place">
                      <IconButton size="small" onClick={() => handleOpenDialog(place)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Place">
                      <IconButton size="small" color="error" onClick={() => handleDelete(place.id)}>
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle  sx={{background:'#0d6c6a',color:'#fff'}}>
          {editMode ? 'Edit Place' : 'Add New Place'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {editMode ? 'Update the details below.' : 'Enter place details. Use the search to auto-fill coordinates.'}
          </Typography>
          <Autocomplete
            freeSolo
            options={suggestions || []}
            getOptionLabel={(option) => option ? (option.label || '') : ''}
            isOptionEqualToValue={(option, value) => option?.value === value?.value}
            onChange={handleSuggestionSelect}
            inputValue={safeInputValue} // Use safe version to prevent undefined
            onInputChange={(_, newInputValue) => setInputValue(newInputValue || '')} // Default to ''
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label="Place Name *"
                sx={{ mt: 1 }}
                required
                placeholder="Start typing to search places (e.g., New York, Eiffel Tower)..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
                error={!formData.name.trim()}
                helperText={!formData.name.trim() ? 'Required field' : ''}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <ListItemText 
                  primary={option.label} 
                  secondary={`Lat: ${option.lat}, Lon: ${option.lon}, Country: ${option.country}`} 
                />
              </li>
            )}
          />
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isLoading}
                  onChange={(e) => setFormData({ ...formData, isLoading: e.target.checked })}
                />
              }
              label="Loading Point (e.g., pickup location)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDestination}
                  onChange={(e) => setFormData({ ...formData, isDestination: e.target.checked })}
                />
              }
              label="Destination (e.g., drop-off location)"
            />
          </Box>
          <TextField
            fullWidth
            label="Country *"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            sx={{ mt: 2 }}
            required
            error={!formData.country.trim()}
            helperText={!formData.country.trim() ? 'Required field' : ''}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              helperText="Auto-filled from search (optional)"
            />
            <TextField
              fullWidth
              label="Longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              helperText="Auto-filled from search (optional)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={dialogLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={dialogLoading || !formData.name.trim() || !formData.country.trim()}
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

export default Places;