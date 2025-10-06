import { useState } from "react";
import {
    Box,
    Typography,
    Button,
    Stack,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    CircularProgress,
    Alert,
    IconButton,
    Card,
    CardContent,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Fade,
    Grow,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import InventoryIcon from "@mui/icons-material/Inventory";
import DriveEtaIcon from "@mui/icons-material/DriveEta";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { getOrderStatusColor } from "./Utlis"; // Assuming you have a utility for status colors

// TabPanel Component
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Grow in={value === index} timeout={600}>
                    <Box sx={{ p: 3 }}>
                        {children}
                    </Box>
                </Grow>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

// View Order Modal Component
const OrderModalView = ({ openModal, handleCloseModal, selectedOrder, modalLoading, modalError }) => {
    const [tabValue, setTabValue] = useState(0);
    if (!selectedOrder) return null;

    const statusColor = getOrderStatusColor(selectedOrder.status);

    // Helper to format dates
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Helper to format files list
    const renderFiles = (files) => {
        if (!files || files.length === 0) return <Typography variant="body2" color="text.secondary">No attachments</Typography>;
        return (
            <List dense sx={{ py: 0 }}>
                {files.map((file, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32, color: '#f58220' }}>
                            <AttachFileIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary={typeof file === 'string' ? file.split('/').pop() : file.name || 'File'}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                            secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                    </ListItem>
                ))}
            </List>
        );
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Helper for horizontal key-value pairs in Grid
    const HorizontalKeyValue = ({ data, spacing = 3 }) => (
        <Grid container spacing={spacing}>
            {Object.entries(data).map(([key, value]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                    <Box sx={{ 
                        p: 2, 
                        border: '1px solid #e3f2fd', 
                        borderRadius: 2, 
                        bgcolor: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                            boxShadow: '0 4px 12px rgba(245, 130, 32, 0.15)',
                            transform: 'translateY(-2px)',
                            borderColor: '#f58220'
                        }
                    }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ 
                            textTransform: 'uppercase', 
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            mb: 0.5
                        }}>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="text.primary" sx={{ fontSize: '1rem' }}>
                            {value || 'N/A'}
                        </Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );

    return (
        <Dialog open={openModal} onClose={handleCloseModal} maxWidth="xl" fullWidth>
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                bgcolor: '#0d6c6a', 
                color: 'white', 
                borderRadius: '12px 12px 0 0',
                py: 3,
                boxShadow: '0 4px 12px rgba(245, 130, 32, 0.3)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5,bgcolor:'#0d6c6a' }}>
                    <InfoIcon sx={{ fontSize: '1.5rem' }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.75rem' }}>
                        Order Details - {selectedOrder.booking_ref}
                    </Typography>
                </Box>
                <IconButton onClick={handleCloseModal} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                {modalLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                        <CircularProgress size={24} sx={{ color: '#f58220' }} />
                        <Typography variant="body1" sx={{ ml: 1, color: 'text.secondary' }}>
                            Loading order details...
                        </Typography>
                    </Box>
                ) : modalError ? (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                        {modalError}
                    </Alert>
                ) : (
                    <>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="order details tabs" variant="scrollable" scrollButtons="auto" sx={{ px: 2 }}>
                                <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" {...a11yProps(0)} sx={{ 
                                    color: '#f58220', 
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    '&.Mui-selected': { color: '#f58220' }
                                }} />
                                <Tab label="Parties" icon={<PersonIcon />} iconPosition="start" {...a11yProps(1)} sx={{ 
                                    color: '#f58220', 
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    '&.Mui-selected': { color: '#f58220' }
                                }} />
                                <Tab label="Shipping" icon={<InventoryIcon />} iconPosition="start" {...a11yProps(2)} sx={{ 
                                    color: '#f58220', 
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    '&.Mui-selected': { color: '#f58220' }
                                }} />
                                <Tab label="Transport" icon={<DriveEtaIcon />} iconPosition="start" {...a11yProps(3)} sx={{ 
                                    color: '#f58220', 
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    '&.Mui-selected': { color: '#f58220' }
                                }} />
                                <Tab label="Inbound/Outbound" icon={<LocalShippingIcon />} iconPosition="start" {...a11yProps(4)} sx={{ 
                                    color: '#f58220', 
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    '&.Mui-selected': { color: '#f58220' }
                                }} />
                                <Tab label="Files" icon={<AttachFileIcon />} iconPosition="start" {...a11yProps(5)} sx={{ 
                                    color: '#f58220', 
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    '&.Mui-selected': { color: '#f58220' }
                                }} />
                            </Tabs>
                        </Box>
                        <TabPanel value={tabValue} index={0}>
                            <Grid container spacing={3}>
                                {/* Order Information Card */}
                                <Grid item xs={12}>
                                    <Card sx={{ 
                                        boxShadow: 3, 
                                        borderRadius: 3,
                                        border: '1px solid #e3f2fd',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                <InfoIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                    Order Information
                                                </Typography>
                                            </Box>
                                            <HorizontalKeyValue 
                                                data={{
                                                    'RGL Booking Number': selectedOrder.rgl_booking_number,
                                                    'Place of Loading': selectedOrder.place_of_loading,
                                                    'Final Destination': selectedOrder.final_destination,
                                                    'Place of Delivery': selectedOrder.place_of_delivery,
                                                    'ETA': formatDate(selectedOrder.eta),
                                                    'ETD': formatDate(selectedOrder.etd),
                                                    'Consignment Number': selectedOrder.consignment_number,
                                                    'Consignment Vessel': selectedOrder.consignment_vessel,
                                                    'Consignment Voyage': selectedOrder.consignment_voyage,
                                                    'Shipping Line': selectedOrder.shipping_line,
                                                    'Order Remarks': selectedOrder.order_remarks,
                                                    'Consignment Remarks': selectedOrder.consignment_remarks,
                                                    'Created At': new Date(selectedOrder.created_at).toLocaleString('en-US', { 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric', 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })
                                                }} 
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Associated Container Card */}
                                <Grid item xs={12}>
                                    <Card sx={{ 
                                        boxShadow: 3, 
                                        borderRadius: 3,
                                        border: '1px solid #e3f2fd',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                <LocalShippingIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                    Associated Container
                                                </Typography>
                                            </Box>
                                            <HorizontalKeyValue 
                                                data={{
                                                    'Container ID': selectedOrder.associated_container,
                                                    'Size': selectedOrder.container_size,
                                                    'Type': selectedOrder.container_type,
                                                    'Derived Status': selectedOrder.container_derived_status,
                                                    'Location': selectedOrder.container_location,
                                                    'Availability': selectedOrder.container_availability
                                                }} 
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        <TabPanel value={tabValue} index={1}>
                            <Grid container spacing={3}>
                                {/* Sender Details Card */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ 
                                        boxShadow: 3, 
                                        borderRadius: 3,
                                        border: '1px solid #e3f2fd',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                <PersonIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                    Sender Details
                                                </Typography>
                                            </Box>
                                            <HorizontalKeyValue 
                                                data={{
                                                    'Name': selectedOrder.sender_name,
                                                    'Contact': selectedOrder.sender_contact,
                                                    'Address': selectedOrder.sender_address,
                                                    'Email': selectedOrder.sender_email
                                                }} 
                                                spacing={2}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Receiver Details Card */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ 
                                        boxShadow: 3, 
                                        borderRadius: 3,
                                        border: '1px solid #e3f2fd',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                <PersonIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                    Receiver Details
                                                </Typography>
                                            </Box>
                                            <HorizontalKeyValue 
                                                data={{
                                                    'Name': selectedOrder.receiver_name,
                                                    'Contact': selectedOrder.receiver_contact,
                                                    'Address': selectedOrder.receiver_address,
                                                    'Email': selectedOrder.receiver_email
                                                }} 
                                                spacing={2}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        <TabPanel value={tabValue} index={2}>
                            <Grid container spacing={3}>
                                {/* Shipping Details Card */}
                                <Grid item xs={12}>
                                    <Card sx={{ 
                                        boxShadow: 3, 
                                        borderRadius: 3,
                                        border: '1px solid #e3f2fd',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                <InventoryIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                    Shipping Details
                                                </Typography>
                                            </Box>
                                            <HorizontalKeyValue 
                                                data={{
                                                    'Category': selectedOrder.category,
                                                    'Subcategory': selectedOrder.subcategory,
                                                    'Type': selectedOrder.type,
                                                    'Pickup Location': selectedOrder.pickup_location,
                                                    'Delivery Address': selectedOrder.delivery_address,
                                                    'Weight': selectedOrder.weight ? `${selectedOrder.weight} kg` : 'N/A'
                                                }} 
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        <TabPanel value={tabValue} index={3}>
                            <Grid container spacing={3}>
                                {/* Transport Details Card */}
                                <Grid item xs={12}>
                                    <Card sx={{ 
                                        boxShadow: 3, 
                                        borderRadius: 3,
                                        border: '1px solid #e3f2fd',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                <DriveEtaIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                    Transport Details
                                                </Typography>
                                            </Box>
                                            <HorizontalKeyValue 
                                                data={{
                                                    'Driver Name': selectedOrder.driver_name,
                                                    'Driver Contact': selectedOrder.driver_contact,
                                                    'Driver NIC': selectedOrder.driver_nic,
                                                    'Driver Pickup Location': selectedOrder.driver_pickup_location,
                                                    'Truck Number': selectedOrder.truck_number,
                                                    'Third Party Transport': selectedOrder.third_party_transport
                                                }} 
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        <TabPanel value={tabValue} index={4}>
                            <Grid container spacing={3}>
                                {/* Drop-Off / Inbound Details Card */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ 
                                        boxShadow: 3, 
                                        borderRadius: 3,
                                        border: '1px solid #e3f2fd',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                <LocalShippingIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                    Drop-Off (Inbound)
                                                </Typography>
                                            </Box>
                                            <HorizontalKeyValue 
                                                data={{
                                                    'Drop Method': selectedOrder.drop_method,
                                                    'Drop-Off CNIC/ID': selectedOrder.drop_off_cnic,
                                                    'Drop-Off Mobile': selectedOrder.drop_off_mobile,
                                                    'Plate No': selectedOrder.plate_no,
                                                    'Drop Date': formatDate(selectedOrder.drop_date)
                                                }} 
                                                spacing={2}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Collection / Outbound Details Card */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ 
                                        boxShadow: 3, 
                                        borderRadius: 3,
                                        border: '1px solid #e3f2fd',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                <LocalShippingIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                    Collection (Outbound)
                                                </Typography>
                                            </Box>
                                            <HorizontalKeyValue 
                                                data={{
                                                    'Collection Method': selectedOrder.collection_method,
                                                    'Full/Partial': selectedOrder.full_partial,
                                                    'Qty Delivered': selectedOrder.qty_delivered,
                                                    'Client Receiver Name': selectedOrder.client_receiver_name,
                                                    'Client Receiver ID': selectedOrder.client_receiver_id,
                                                    'Client Receiver Mobile': selectedOrder.client_receiver_mobile,
                                                    'Delivery Date': formatDate(selectedOrder.delivery_date)
                                                }} 
                                                spacing={2}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        <TabPanel value={tabValue} index={5}>
                            <Grid container spacing={3}>
                                {/* Attachments Card */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ 
                                        boxShadow: 3, 
                                        borderRadius: 3,
                                        border: '1px solid #e3f2fd',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                <AttachFileIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                    Attachments
                                                </Typography>
                                            </Box>
                                            {renderFiles(selectedOrder.attachments)}
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Gatepass Card */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ 
                                        boxShadow: 3, 
                                        borderRadius: 3,
                                        border: '1px solid #e3f2fd',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                <AttachFileIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                    Gatepass
                                                </Typography>
                                            </Box>
                                            {renderFiles(selectedOrder.gatepass)}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </TabPanel>
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ 
                p: 3, 
                bgcolor: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                borderTop: '1px solid #e0e0e0',
                justifyContent: 'flex-end',
                gap: 2,
                boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
            }}>
                <Button 
                    onClick={handleCloseModal} 
                    variant="outlined" 
                    sx={{ 
                        borderRadius: 3, 
                        borderColor: '#f58220', 
                        color: '#f58220',
                        px: 4,
                        py: 1,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                            borderColor: '#e65100', 
                            color: '#e65100',
                            boxShadow: '0 4px 12px rgba(245, 130, 32, 0.2)',
                            transform: 'translateY(-1px)'
                        }
                    }}
                >
                    Close
                </Button>
                <Button 
                    onClick={() => { handleCloseModal(); handleEdit(selectedOrder?.id); }} 
                    variant="contained" 
                    sx={{ 
                        borderRadius: 3, 
                        bgcolor: 'linear-gradient(135deg, #f58220 0%, #e65100 100%)',
                        px: 4,
                        py: 1,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                            bgcolor: 'linear-gradient(135deg, #e65100 0%, #d84315 100%)',
                            boxShadow: '0 6px 20px rgba(245, 130, 32, 0.3)',
                            transform: 'translateY(-1px)'
                        }
                    }}
                    disabled={!selectedOrder}
                >
                    Edit Order
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default OrderModalView;