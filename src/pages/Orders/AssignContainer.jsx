import React, { useState } from 'react';
// From @mui/material (core components)
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, Card, CardContent, Box, Typography, Chip, Button, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    FormControl, InputLabel, Select, MenuItem, Alert, AlertTitle, Collapse, TextField,
    Tooltip, CircularProgress, Stack,
    Popover, Checkbox, FormControlLabel, Divider, List, ListItem, ListItemIcon, ListItemText
    // Add Popover, Checkbox, FormControlLabel, Divider, List, ListItem, ListItemIcon, ListItemText if not already there
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InfoIcon from '@mui/icons-material/Info';
import CargoIcon from '@mui/icons-material/LocalShipping';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';

const AssignModal = ({
    onUpdateAssignedQty,
    onRemoveContainers,
    openAssignModal,
    setOpenAssignModal,
    selectedOrders,
    orders,
    containers,
    selectedContainer,
    setSelectedContainer,
    loadingContainers,
    fetchContainers,
    handleAssign,
    handleReceiverAction, // This can now be removed if we handle edit internally, but keeping for compatibility
    onUpdateReceiver // New prop: callback to update receiver in parent state
}) => {
    const [showAllColumns, setShowAllColumns] = useState(true);
    const [columnVisibility, setColumnVisibility] = useState({
        id: true,
        name: true,
        orderRef: true,
        orderStatus: true,
        status: true,
        category: true,
        totalPC: true,
        wt: true,
        assigned: true,
        remainingQty: true,
        address: true,
        contact: true,
        email: true,
        containers: true,
        action: true
    });
    const [columnAnchorEl, setColumnAnchorEl] = useState(null);
    const [editingReceiverId, setEditingReceiverId] = useState(null);
    const [tempQty, setTempQty] = useState(0);
    // New states for edit receiver modal
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedReceiver, setSelectedReceiver] = useState(null);
    const [editForm, setEditForm] = useState({
        receiver_name: '',
        delivery_address: '',
        receiver_contact: '',
        receiver_email: '',
        category: '',
        total_number: 0,
        total_weight: 0,
        status: 'Created'
    });
    const [editErrors, setEditErrors] = useState({});

    const handleColumnToggle = (event, column) => {
        setColumnVisibility(prev => ({ ...prev, [column]: event.target.checked }));
    };

    const handleColumnMenuOpen = (event) => {
        setColumnAnchorEl(event.currentTarget);
    };

    const handleColumnMenuClose = () => {
        setColumnAnchorEl(null);
    };

    // New handler for editing receiver
    const handleEditReceiver = (rec) => {
        setSelectedReceiver(rec);
        setEditForm({
            receiver_name: rec.receiver_name || '',
            delivery_address: rec.delivery_address || rec.receiver_address || '',
            receiver_contact: rec.receiver_contact || '',
            receiver_email: rec.receiver_email || '',
            category: rec.category || '',
            total_number: rec.total_number || 0,
            total_weight: rec.total_weight || 0,
            status: rec.status || 'Created'
        });
        setEditErrors({});
        setOpenEditModal(true);
    };

    // Handle form changes
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
        // Clear error on change
        if (editErrors[name]) {
            setEditErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};
        if (!editForm.receiver_name.trim()) errors.receiver_name = 'Receiver name is required';
        if (!editForm.delivery_address.trim()) errors.delivery_address = 'Address is required';
        if (!editForm.receiver_contact.trim()) errors.receiver_contact = 'Contact is required';
        if (!editForm.receiver_email.trim() || !/\S+@\S+\.\S+/.test(editForm.receiver_email)) {
            errors.receiver_email = 'Valid email is required';
        }
        setEditErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle save/update
    const handleSaveReceiver = () => {
        if (!validateForm()) return;

        // Call parent callback to update
        if (onUpdateReceiver && selectedReceiver) {
            onUpdateReceiver({
                ...selectedReceiver,
                ...editForm
            });
        }

        // Close modal
        setOpenEditModal(false);
        setSelectedReceiver(null);
        setEditForm({}); // Reset form
    };

    const totalReceivers = selectedOrders.reduce((total, orderId) => {
        const order = orders.find(o => o.id === orderId);
        return total + (order ? (order.receivers ? order.receivers.length : 0) : 0);
    }, 0);

    return (
        <>
            <Dialog
                open={openAssignModal}
                onClose={() => setOpenAssignModal(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: '95vh',
                        overflow: 'hidden',
                    }
                }}
            >
                {/* ... (Previous Dialog content remains the same until the Action cell) ... */}
                <DialogTitle sx={{
                    bgcolor: '#0d6c6a',
                    color: 'white',
                    borderRadius: '12px 12px 0 0',
                    py: { xs: 2, sm: 2.5 },
                    px: { xs: 2, sm: 3 }
                }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <LocalShippingIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                            <Typography variant={{ xs: 'h6', sm: 'h5' }} fontWeight="bold">
                                Assign Selected Orders to Container
                            </Typography>
                            <Chip
                                label={`(${selectedOrders.length} Orders)`}
                                size="small"
                                color="secondary"
                                variant="filled"
                                sx={{
                                    ml: 1,
                                    fontSize: { xs: '0.7rem', sm: '0.8rem' }
                                }}
                            />
                        </Box>
                        <IconButton
                            onClick={() => setOpenAssignModal(false)}
                            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{
                    mt: 2,
                    p: { xs: 2, sm: 3 },
                    overflow: 'auto',
                    height: '80vh',
                    maxHeight: '80vh'
                }}>
               <Grid container justifyContent="space-between" mb={3} spacing={{ xs: 2, sm: 2 }}>
    <Grid item xs={12}>
        <Card sx={{
            boxShadow: 2,
            borderRadius: 2,
            border: '1px solid #e3f2fd',
            '&:hover': { boxShadow: '0 4px 12px rgba(245, 130, 32, 0.1)' }
        }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <PersonIcon color="primary" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                    <Typography variant={{ xs: 'subtitle2', sm: 'subtitle1' }} fontWeight="bold" color="#f58220">
                        All Receivers Details
                    </Typography>
                    <Chip
                        label={`(${totalReceivers})`}
                        size="small"
                        color="info"
                    />
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Tooltip title={showAllColumns ? "Switch to Compact View" : "Show All Columns"}>
                            <Button
                                variant="text"
                                size="small"
                                onClick={() => setShowAllColumns(!showAllColumns)}
                                sx={{ color: '#f58220', minWidth: 'auto' }}
                            >
                                <ViewColumnIcon fontSize="small" sx={{ mr: 0.5 }} />
                                {showAllColumns ? 'Compact' : 'Full'}
                            </Button>
                        </Tooltip>
                        <Tooltip title="Customize Columns">
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleColumnMenuOpen}
                                sx={{ color: '#f58220', borderColor: '#f58220', minWidth: 'auto', px: 1 }}
                            >
                                Columns
                            </Button>
                        </Tooltip>
                    </Box>
                </Box>
                <TableContainer sx={{
                    maxHeight: { xs: 400, sm: 450 },
                    overflow: 'auto',
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#f58220',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: '#f1f1f1',
                    },
                }}>
                    <Table size="small" stickyHeader sx={{ minWidth: { xs: 600, sm: 1350 } }}>
                        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 0.25, sm: 0.5, md: 1 }, display: columnVisibility.id ? 'table-cell' : 'none' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 0.25, sm: 0.5, md: 1 }, display: columnVisibility.name ? 'table-cell' : 'none' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 0.25, sm: 0.5, md: 1 }, display: columnVisibility.orderRef ? 'table-cell' : 'none' }}>Order Ref</TableCell>
           
                                <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 0.25, sm: 0.5, md: 1 }, display: columnVisibility.category ? 'table-cell' : 'none' }}>Category</TableCell>
                                     <TableCell sx={{
                                    fontWeight: 'bold',
                                    color: '#f58220',
                                    px: { xs: 0.25, sm: 0.5, md: 1 },
                                    display: { xs: showAllColumns && columnVisibility.address ? 'table-cell' : 'none', sm: columnVisibility.address ? 'table-cell' : 'none' }
                                }}>Address</TableCell>
                                <TableCell sx={{
                                    fontWeight: 'bold',
                                    color: '#f58220',
                                    px: { xs: 0.25, sm: 0.5, md: 1 },
                                    display: { xs: showAllColumns && columnVisibility.contact ? 'table-cell' : 'none', sm: columnVisibility.contact ? 'table-cell' : 'none' }
                                }}>Contact</TableCell>
                                <TableCell sx={{
                                    fontWeight: 'bold',
                                    color: '#f58220',
                                    px: { xs: 0.25, sm: 0.5, md: 1 },
                                    display: { xs: showAllColumns && columnVisibility.email ? 'table-cell' : 'none', sm: columnVisibility.email ? 'table-cell' : 'none' }
                                }}>Email</TableCell>
                                <TableCell sx={{
                                    fontWeight: 'bold',
                                    color: '#f58220',
                                    px: { xs: 0.25, sm: 0.5, md: 1 },
                                    display: { xs: showAllColumns && columnVisibility.wt ? 'table-cell' : 'none', sm: columnVisibility.wt ? 'table-cell' : 'none' }
                                }}>Wt</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 0.25, sm: 0.5, md: 1 }, display: columnVisibility.totalPC ? 'table-cell' : 'none' }}>Total PC</TableCell>
                            
                                <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 0.25, sm: 0.5, md: 1 }, display: columnVisibility.remainingQty ? 'table-cell' : 'none' }}>Remaining</TableCell>
                           
                                    <TableCell sx={{
                                    fontWeight: 'bold',
                                    color: '#f58220',
                                    px: { xs: 0.25, sm: 0.5, md: 1 },
                                    display: { xs: showAllColumns && columnVisibility.assigned ? 'table-cell' : 'none', sm: columnVisibility.assigned ? 'table-cell' : 'none' }
                                }}>Assigned</TableCell>
                                <TableCell sx={{
                                    fontWeight: 'bold',
                                    color: '#f58220',
                                    px: { xs: 0.25, sm: 0.5, md: 1 },
                                    display: { xs: showAllColumns && columnVisibility.containers ? 'table-cell' : 'none', sm: columnVisibility.containers ? 'table-cell' : 'none' }
                                }}>Containers</TableCell>
                          
                            </TableRow>
                        </TableHead>
                     <TableBody>
    {(() => {
        const allReceivers = selectedOrders.flatMap(orderId => {
            const order = orders.find(o => o.id === orderId);
            return order && order.receivers ? order.receivers.map(rec => ({
                ...rec,
                orderRef: order.booking_ref,
                orderId: orderId // Add orderId for unique key
            })) : [];
        });

        return allReceivers.map((rec, globalIndex) => {
            const order = orders.find(o => o.id === rec.order_id);
            const totalPC = rec.total_number || 0;
            const assigned = rec.qty_delivered || 0;
            const remaining = totalPC - Math.max(0, assigned); // Ensure non-negative
            const address = rec.delivery_address || rec.receiver_address || 'N/A';
            const contact = rec.receiver_contact || 'N/A';
            const email = rec.receiver_email || 'N/A';

            // Local remaining for this row (updates on edit)
            const localRemaining = totalPC - Math.max(0, editingReceiverId === rec.id ? tempQty : assigned);

            return (
                <TableRow
                    key={`${rec.orderId}-${rec.id || globalIndex}`} // More unique key using orderId
                    hover
                    sx={{
                        '&:hover': { bgcolor: '#f8f9fa' },
                        transition: 'background-color 0.2s ease'
                    }}
                >
                    <TableCell sx={{ px: { xs: 0.25, sm: 0.5, md: 1 }, fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: columnVisibility.id ? 'table-cell' : 'none' }}>{rec.id || 'N/A'}</TableCell>
                    <TableCell sx={{ px: { xs: 0.25, sm: 0.5, md: 1 }, fontWeight: 'medium', fontSize: { xs: '0.7rem', sm: '0.8rem' }, display: columnVisibility.name ? 'table-cell' : 'none' }}>{rec.receiver_name}</TableCell>
                    <TableCell sx={{ px: { xs: 0.25, sm: 0.5, md: 1 }, fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: columnVisibility.orderRef ? 'table-cell' : 'none' }}>{rec.orderRef}</TableCell>
                    {/* <TableCell sx={{
                        px: { xs: 0.25, sm: 0.5, md: 1 },
                        display: { xs: showAllColumns && columnVisibility.orderStatus ? 'table-cell' : 'none', sm: columnVisibility.orderStatus ? 'table-cell' : 'none' }
                    }}>
                        <Chip
                            label={order ? (order.status || 'Created') : 'N/A'}
                            size="small"
                            color={order ? (order.status === 'Delivered' ? 'success' : order.status === 'In Transit' ? 'warning' : 'default') : 'default'}
                            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        />
                    </TableCell>
                    <TableCell sx={{ px: { xs: 0.25, sm: 0.5, md: 1 }, display: columnVisibility.status ? 'table-cell' : 'none' }}>
                        <Chip
                            label={rec.status || 'Created'}
                            size="small"
                            color={rec.status === 'Delivered' ? 'success' : rec.status === 'In Transit' ? 'warning' : 'default'}
                            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        />
                    </TableCell> */}
                    <TableCell sx={{ px: { xs: 0.25, sm: 0.5, md: 1 }, fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: columnVisibility.category ? 'table-cell' : 'none' }}>{rec.category || 'N/A'}</TableCell>
                  
                    <TableCell sx={{
                        px: { xs: 0.25, sm: 0.5, md: 1 },
                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                        maxWidth: { xs: 60, sm: 100 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: { xs: showAllColumns && columnVisibility.address ? 'table-cell' : 'none', sm: columnVisibility.address ? 'table-cell' : 'none' }
                    }}>
                        {address}
                    </TableCell>
                    <TableCell sx={{
                        px: { xs: 0.25, sm: 0.5, md: 1 },
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        maxWidth: { xs: 50, sm: 80 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: { xs: showAllColumns && columnVisibility.contact ? 'table-cell' : 'none', sm: columnVisibility.contact ? 'table-cell' : 'none' }
                    }}>
                        {contact}
                    </TableCell>
                    <TableCell sx={{
                        px: { xs: 0.25, sm: 0.5, md: 1 },
                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                        maxWidth: { xs: 60, sm: 100 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: { xs: showAllColumns && columnVisibility.email ? 'table-cell' : 'none', sm: columnVisibility.email ? 'table-cell' : 'none' }
                    }}>
                        {email}
                    </TableCell>
                      <TableCell sx={{ px: { xs: 0.25, sm: 0.5, md: 1 }, fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: columnVisibility.totalPC ? 'table-cell' : 'none' }}>{totalPC}</TableCell>
                    <TableCell sx={{
                        px: { xs: 0.25, sm: 0.5, md: 1 },
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        display: { xs: showAllColumns && columnVisibility.wt ? 'table-cell' : 'none', sm: columnVisibility.wt ? 'table-cell' : 'none' }
                    }}>{rec.total_weight || 0}</TableCell>
                    {/* Inline Editable Assigned Qty */}
                  
                    <TableCell sx={{ px: { xs: 0.25, sm: 0.5, md: 1 }, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: localRemaining > 0 ? 'warning.main' : 'success.main', display: columnVisibility.remainingQty ? 'table-cell' : 'none' }}>
                        {localRemaining}
                    </TableCell>
                      <TableCell sx={{
                        px: { xs: 0.25, sm: 0.5, md: 1 },
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        display: { xs: showAllColumns && columnVisibility.assigned ? 'table-cell' : 'none', sm: columnVisibility.assigned ? 'table-cell' : 'none' }
                    }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                gap: 0.5,
                                p: 0.5,
                                borderRadius: 1,
                                transition: 'background-color 0.2s ease',
                                '&:hover': { backgroundColor: 'action.hover' }
                            }}
                            onClick={() => {
                                if (editingReceiverId !== rec.id) {
                                    setEditingReceiverId(rec.id);
                                    setTempQty(assigned);
                                }
                            }}
                        >
                            {editingReceiverId === rec.id ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={tempQty}
                                        onChange={(e) => setTempQty(Math.max(0, Math.min(totalPC, parseInt(e.target.value) || 0)))}
                                        onBlur={() => {
                                            onUpdateAssignedQty(rec.id, tempQty);
                                            setEditingReceiverId(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                onUpdateAssignedQty(rec.id, tempQty);
                                                setEditingReceiverId(null);
                                            } else if (e.key === 'Escape') {
                                                setEditingReceiverId(null);
                                            }
                                        }}
                                        inputProps={{
                                            min: 0,
                                            max: totalPC,
                                            style: { fontSize: '0.75rem', width: 60, textAlign: 'center', p: 0 }
                                        }}
                                        sx={{ 
                                            '& .MuiInputBase-root': { minHeight: 24 },
                                            '& .MuiInputBase-input': { py: 0.25 }
                                        }}
                                        autoFocus
                                    />
                                    <Tooltip title="Cancel">
                                        <IconButton 
                                            size="small" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingReceiverId(null);
                                            }} 
                                            sx={{ p: 0.25 }}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            ) : (
                                <>
                                    {assigned}
                                    <Tooltip title="Edit Qty">
                                        <EditIcon fontSize="small" sx={{ color: '#f58220' }} />
                                    </Tooltip>
                                </>
                            )}
                        </Box>
                    </TableCell>
                    <TableCell sx={{
                        px: { xs: 0.25, sm: 0.5, md: 1 },
                        display: { xs: showAllColumns && columnVisibility.containers ? 'table-cell' : 'none', sm: columnVisibility.containers ? 'table-cell' : 'none' },
                        whiteSpace: 'nowrap'
                    }}>
                        {rec.containers && rec.containers.length > 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Chip
                                    label={rec.containers.length > 1 ? `${rec.containers.slice(0, 1).join(', ')}...` : rec.containers.join(', ')}
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                    sx={{
                                        maxWidth: { xs: 50, sm: 80 },
                                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                        flexShrink: 0
                                    }}
                                />
                                <Tooltip title="Remove Containers">
                                    <IconButton 
                                        size="small" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveContainers(rec.id);
                                        }}
                                        sx={{ p: 0.25, color: '#f58220' }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ) : (
                            <Chip label="None" size="small" color="default" variant="outlined" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }} />
                        )}
                    </TableCell>
                    <TableCell sx={{
                        px: { xs: 0.25, sm: 0.5, md: 1 },
                        display: { xs: showAllColumns && columnVisibility.action ? 'table-cell' : 'none', sm: columnVisibility.action ? 'table-cell' : 'none' }
                    }} />
                </TableRow>
            );
        });
    })()}
</TableBody>
                    </Table>
                </TableContainer>
                {selectedOrders.length === 0 ? (
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
                        <AlertTitle>No Orders Selected</AlertTitle>
                        Please select orders from the main table to assign containers.
                    </Alert>
                ) : totalReceivers === 0 ? (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 1 }}>
                        <AlertTitle>No Receivers Found</AlertTitle>
                        The selected orders have no associated receivers.
                    </Alert>
                ) : null}
            </CardContent>
        </Card>
    </Grid>
</Grid>

                 <Grid container flexDirection={'row'} justifyContent={'space-evenly'} spacing={{ xs: 2, sm: 3 }} sx={{ mt: 1 }}>
    <Grid item xs={6} sm={6}>
        <Card sx={{
            boxShadow: 2,
            borderRadius: 2,
            border: '1px solid #e3f2fd',
            '&:hover': { boxShadow: '0 4px 12px rgba(245, 130, 32, 0.1)' }
        }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InventoryIcon color="primary" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                        <Typography variant={{ xs: 'subtitle2', sm: 'subtitle1' }} fontWeight="bold" color="#f58220">
                            Available Open Containers ({containers.length})
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={fetchContainers}
                        disabled={loadingContainers}
                        startIcon={loadingContainers ? <CircularProgress size={16} /> : <RefreshIcon />}
                        sx={{ minWidth: 'auto' }}
                    >
                        {loadingContainers ? 'Loading...' : 'Refresh'}
                    </Button>
                </Box>
                {loadingContainers ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: { xs: 3, sm: 4 } }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                            Fetching containers...
                        </Typography>
                    </Box>
                ) : containers.length === 0 ? (
                    <Alert severity="info" icon={<InfoIcon />}>
                        <AlertTitle>No Containers Available</AlertTitle>
                        No open containers found. Try refreshing or check if any are marked as 'Available'.
                    </Alert>
                ) : (
                    <TableContainer sx={{ maxHeight: { xs: 250, sm: 300 }, overflow: 'auto', overflowX: 'auto' }}>
                        <Table size="small" stickyHeader sx={{ minWidth: { xs: 300, sm: 600 } }}>
                            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 0.5, sm: 1, md: 2 } }}>Container No</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 0.5, sm: 1, md: 2 } }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 0.5, sm: 1, md: 2 } }}>Location</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#f58220', px: { xs: 0.5, sm: 1, md: 2 } }}>Owner Type</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {containers.map((container) => (
                                    <TableRow
                                        key={container.cid}
                                        hover
                                        selected={selectedContainer === container.cid}
                                        onClick={() => setSelectedContainer(container.cid)}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: '#f0f8ff' },
                                            transition: 'all 0.2s ease',
                                            '&.Mui-selected': { bgcolor: 'success.50' }
                                        }}
                                    >
                                        <TableCell sx={{ px: { xs: 0.5, sm: 1, md: 2 }, fontWeight: 'medium', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{container.container_number}</TableCell>
                                        <TableCell sx={{ px: { xs: 0.5, sm: 1, md: 2 } }}>
                                            <Chip
                                                label={container.derived_status}
                                                size="small"
                                                color={container.derived_status === 'Available' ? 'success' : 'default'}
                                                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ px: { xs: 0.5, sm: 1, md: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{container.location || 'N/A'}</TableCell>
                                        <TableCell sx={{ px: { xs: 0.5, sm: 1, md: 2 } }}>
                                            <Chip
                                                label={container.owner_type.toUpperCase()}
                                                size="small"
                                                variant="outlined"
                                                color="info"
                                                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    </Grid>
    <Grid item xs={6} sm={6}>
        <Card sx={{
            boxShadow: 2,
            borderRadius: 2,
            border: '1px solid #e3f2fd',
            '&:hover': { boxShadow: '0 4px 12px rgba(245, 130, 32, 0.1)' }
        }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <InventoryIcon color="primary" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                    <Typography variant={{ xs: 'subtitle2', sm: 'subtitle1' }} fontWeight="bold" color="#f58220">
                        Select Container
                    </Typography>
                </Box>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Available Container</InputLabel>
                    <Select
                        value={selectedContainer}
                        label="Available Container"
                        onChange={(e) => setSelectedContainer(e.target.value)}
                        startAdornment={
                            selectedContainer ? (
                                <Chip
                                    label="Selected"
                                    size="small"
                                    color="success"
                                    sx={{ mr: 1, height: 20 }}
                                />
                            ) : null
                        }
                    >
                        <MenuItem value="">
                            <em>Choose a container from available options below</em>
                        </MenuItem>
                        {containers.map((container) => (
                            <MenuItem key={container.cid} value={container.cid}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <CargoIcon fontSize="small" color="info" />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" fontWeight="medium">
                                            {container.container_number}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {container.derived_status} • {container.owner_type}
                                        </Typography>
                                    </Box>
                                    {container.location && (
                                        <Chip
                                            label={container.location}
                                            size="small"
                                            variant="outlined"
                                            color="info"
                                        />
                                    )}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {!selectedContainer && containers.length > 0 && (
                    <Alert severity="info" icon={<InfoIcon />}>
                        Select a container to assign. It will be linked to all {totalReceivers} receivers in the selected orders.
                    </Alert>
                )}
            </CardContent>
        </Card>
    </Grid>
    {selectedOrders.length > 0 && selectedContainer && (
        <Grid item xs={12}>
            <Collapse in={true} timeout={300}>
                <Alert
                    severity="success"
                    icon={<CheckIcon />}
                    sx={{
                        mt: 2,
                        borderRadius: 2,
                        animation: 'slideIn 0.3s ease-out'
                    }}
                >
                    <AlertTitle>Ready to Assign</AlertTitle>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        This will assign the selected container to {totalReceivers} receivers across {selectedOrders.length} orders.
                    </Typography>
                </Alert>
            </Collapse>
        </Grid>
    )}
</Grid>
                </DialogContent>
                <DialogActions sx={{
                    p: { xs: 2, sm: 3 },
                    bgcolor: '#f8f9fa',
                    borderTop: '1px solid #e0e0e0',
                    justifyContent: 'space-between'
                }}>
                    <Button
                        onClick={() => setOpenAssignModal(false)}
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            borderColor: '#f58220',
                            color: '#f58220',
                            px: 3,
                            '&:hover': { borderColor: '#e65100', color: '#e65100' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        variant="contained"
                        disabled={!selectedContainer || selectedOrders.length === 0}
                        sx={{
                            borderRadius: 2,
                            bgcolor: '#f58220',
                            px: 4,
                            '&:hover': { bgcolor: '#e65100' },
                            '&.Mui-disabled': { bgcolor: 'grey.400' },
                            boxShadow: selectedContainer ? '0 3px 8px rgba(245, 130, 32, 0.3)' : 'none'
                        }}
                        startIcon={<AssignmentIcon />}
                    >
                        Assign ({selectedOrders.length} Orders)
                    </Button>
                </DialogActions>

                {/* Column Visibility Popover */}
                <Popover
                    open={Boolean(columnAnchorEl)}
                    anchorEl={columnAnchorEl}
                    onClose={handleColumnMenuClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    sx={{ mt: 1 }}
                >
                    <Box sx={{ p: 2, minWidth: 200 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Visible Columns</Typography>
                        <Divider sx={{ mb: 1 }} />
                        <List dense>
                            {Object.keys(columnVisibility).map((column) => (
                                <ListItem key={column} disablePadding>
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <Checkbox
                                            edge="start"
                                            checked={columnVisibility[column]}
                                            onChange={(e) => handleColumnToggle(e, column)}
                                            size="small"
                                        />
                                    </ListItemIcon>
                                    <ListItemText primary={column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Popover>
            </Dialog>

            {/* New Edit Receiver Modal */}
            <Dialog
                open={openEditModal}
                onClose={() => {
                    setOpenEditModal(false);
                    setSelectedReceiver(null);
                    setEditForm({});
                    setEditErrors({});
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ bgcolor: '#f58220', color: 'white', borderRadius: '12px 12px 0 0' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight="bold">
                            Edit Receiver
                        </Typography>
                        <IconButton onClick={() => setOpenEditModal(false)} sx={{ color: 'white' }}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Receiver Name"
                            name="receiver_name"
                            value={editForm.receiver_name}
                            onChange={handleEditChange}
                            error={!!editErrors.receiver_name}
                            helperText={editErrors.receiver_name}
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            fullWidth
                            label="Delivery Address"
                            name="delivery_address"
                            value={editForm.delivery_address}
                            onChange={handleEditChange}
                            error={!!editErrors.delivery_address}
                            helperText={editErrors.delivery_address}
                            variant="outlined"
                            size="small"
                            multiline
                            rows={2}
                        />
                        <TextField
                            fullWidth
                            label="Contact Number"
                            name="receiver_contact"
                            value={editForm.receiver_contact}
                            onChange={handleEditChange}
                            error={!!editErrors.receiver_contact}
                            helperText={editErrors.receiver_contact}
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            name="receiver_email"
                            value={editForm.receiver_email}
                            onChange={handleEditChange}
                            error={!!editErrors.receiver_email}
                            helperText={editErrors.receiver_email}
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            fullWidth
                            label="Category"
                            name="category"
                            value={editForm.category}
                            onChange={handleEditChange}
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            fullWidth
                            label="Total Pieces"
                            name="total_number"
                            type="number"
                            value={editForm.total_number}
                            onChange={handleEditChange}
                            variant="outlined"
                            size="small"
                            inputProps={{ min: 0 }}
                        />
                        <TextField
                            fullWidth
                            label="Total Weight"
                            name="total_weight"
                            type="number"
                            value={editForm.total_weight}
                            onChange={handleEditChange}
                            variant="outlined"
                            size="small"
                            inputProps={{ min: 0, step: 0.01 }}
                        />
                        <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={editForm.status}
                                onChange={handleEditChange}
                                label="Status"
                            >
                                <MenuItem value="Created">Created</MenuItem>
                                <MenuItem value="In Transit">In Transit</MenuItem>
                                <MenuItem value="Delivered">Delivered</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                        onClick={() => {
                            setOpenEditModal(false);
                            setSelectedReceiver(null);
                            setEditForm({});
                            setEditErrors({});
                        }}
                        variant="outlined"
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveReceiver}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={Object.keys(editErrors).length > 0}
                        sx={{ bgcolor: '#f58220', '&:hover': { bgcolor: '#e65100' } }}
                    >
                        Update Receiver
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AssignModal;