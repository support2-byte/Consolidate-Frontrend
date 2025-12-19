import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
    Alert,
    IconButton,
    Tooltip,
    Snackbar
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { api } from '../../api'; // Assuming your api instance is imported

const EtaSetupPage = () => {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [currentStatus, setCurrentStatus] = useState({ id: null, status: '', daysOffset: '' });
    const [isEdit, setIsEdit] = useState(false);

    // Fetch statuses on mount
    useEffect(() => {
        fetchStatuses();
    }, []);

    const fetchStatuses = async () => {
        try {
            setLoading(true);
            const response = await api.get('api/options/eta-configs');
            setStatuses(response.data || []);
            setError('');
        } catch (err) {
            setError('Failed to fetch statuses');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentStatus({ id: null, status: '', daysOffset: '' });
        setIsEdit(false);
        setOpenDialog(true);
    };

    const handleEdit = (status) => {
        setCurrentStatus({ id: status.id, status: status.status, daysOffset: status.days_offset });
        setIsEdit(true);
        setOpenDialog(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this status?')) {
            try {
                await api.delete(`/api/options/eta-configs/${id}`);
                fetchStatuses();
                setSuccess('Status deleted successfully');
            } catch (err) {
                setError('Failed to delete status');
                console.error(err);
            }
        }
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setCurrentStatus({ id: null, status: '', daysOffset: '' });
        setError(''); // Clear any dialog errors
    };

    const handleSave = async () => {
        if (!currentStatus.status.trim() || !currentStatus.daysOffset) {
            setError('Status and days are required');
            return;
        }

        try {
            if (isEdit) {
                await api.put(`api/options/eta-configs/${currentStatus.id}`, {
                    status: currentStatus.status,
                    days_offset: parseInt(currentStatus.daysOffset)
                });
                setSuccess('Status updated successfully');
            } else {
                await api.post('api/options/eta-configs', {
                    status: currentStatus.status,
                    days_offset: parseInt(currentStatus.daysOffset)
                });
                setSuccess('Status added successfully');
            }
            handleDialogClose();
            fetchStatuses();
        } catch (err) {
            setError('Failed to save status');
            console.error(err);
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'status', headerName: 'Status', width: 300 },
        { field: 'days_offset', headerName: 'Days Offset', width: 150 },
        // Optional: Add timestamp columns if you want to display them
        // { field: 'created_at', headerName: 'Created At', width: 200 },
        // { field: 'updated_at', headerName: 'Updated At', width: 200 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            type: 'actions',
            getActions: (params) => [
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => handleEdit(params.row)}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => handleDelete(params.row.id)}
                />
            ]
        }
    ];

    const handleCloseSnackbar = () => {
        setSuccess('');
        setError('');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                ETA Setup
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Status List with Days</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    disabled={loading}
                >
                    Add Status
                </Button>
            </Box>
            <div style={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={statuses}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row.id}
                    disableRowSelectionOnClick
                    autoHeight
                />
            </div>

            {/* Dialog for Add/Edit */}
            <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>{isEdit ? 'Edit Status' : 'Add New Status'}</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        fullWidth
                        margin="dense"
                        label="Status"
                        value={currentStatus.status}
                        onChange={(e) => setCurrentStatus({ ...currentStatus, status: e.target.value })}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="dense"
                        label="Days Offset"
                        type="number"
                        value={currentStatus.daysOffset}
                        onChange={(e) => setCurrentStatus({ ...currentStatus, daysOffset: e.target.value })}
                        inputProps={{ min: 0 }}
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button 
                        onClick={handleSave} 
                        variant="contained"
                        disabled={!currentStatus.status.trim() || !currentStatus.daysOffset}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for success/error messages */}
            <Snackbar
                open={!!success || !!error}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={success ? 'success' : 'error'} sx={{ width: '100%' }}>
                    {success || error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default EtaSetupPage;