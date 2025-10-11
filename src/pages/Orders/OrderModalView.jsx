import { useState } from "react";
import jsPDF from 'jspdf'; // Add this import for PDF generation (npm install jspdf)
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
import { useNavigate } from "react-router-dom";
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
     const navigate = useNavigate();
    if (!selectedOrder) return null;

    const statusColor = getOrderStatusColor(selectedOrder.overall_status || selectedOrder.status);

    const handleEdit = (orderId) => {
        handleCloseModal(),
        navigate(`/orders/${orderId}/edit/`, { state: { orderId } });
    };
    // Helper to format dates
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Helper to format files list for PDF
    const getFilesText = (files) => {
        if (!files || files.length === 0) return 'No attachments';
        return files.map((file, index) => 
            `${index + 1}. ${typeof file === 'string' ? file.split('/').pop() : file.name || 'File'}`
        ).join('\n');
    };

    // Export to PDF function
    const exportToPDF = (order) => {
        const doc = new jsPDF();
        let yPosition = 20;

        // Title
        doc.setFontSize(20);
        doc.text('Order Details', 20, yPosition);
        yPosition += 15;

        // Order Info Section
        doc.setFontSize(14);
        doc.text('Order Information', 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        doc.text(`Booking Ref: ${order.booking_ref || 'N/A'}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Status: ${order.overall_status || order.status || 'N/A'}`, 20, yPosition);
        yPosition += 7;
        doc.text(`RGL Booking Number: ${order.rgl_booking_number || 'N/A'}`, 20, yPosition);
        yPosition += 7;
        doc.text(`ETA: ${formatDate(order.eta)}`, 20, yPosition);
        yPosition += 7;
        doc.text(`ETD: ${formatDate(order.etd)}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Shipping Line: ${order.shipping_line || 'N/A'}`, 20, yPosition);
        yPosition += 10;

        // Sender
        doc.setFontSize(14);
        doc.text('Sender Details', 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        doc.text(`Name: ${order.sender_name || 'N/A'}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Contact: ${order.sender_contact || 'N/A'}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Email: ${order.sender_email || 'N/A'}`, 20, yPosition);
        yPosition += 10;

        // Receivers
        doc.setFontSize(14);
        doc.text('Receiver Details', 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        (order.receivers || []).forEach((rec, index) => {
            doc.text(`Receiver ${index + 1} Name: ${rec.receiver_name || 'N/A'}`, 20, yPosition);
            yPosition += 7;
            doc.text(`Receiver ${index + 1} Status: ${rec.status || 'Created'}`, 20, yPosition);
            yPosition += 7;
            doc.text(`Receiver ${index + 1} Contact: ${rec.receiver_contact || 'N/A'}`, 20, yPosition);
            yPosition += 7;
            doc.text(`Receiver ${index + 1} Email: ${rec.receiver_email || 'N/A'}`, 20, yPosition);
            yPosition += 7;
            doc.text(`Receiver ${index + 1} Consignment Number: ${rec.consignment_number || 'N/A'}`, 20, yPosition);
            yPosition += 7;
            doc.text(`Receiver ${index + 1} Total Weight: ${rec.total_weight || 'N/A'}`, 20, yPosition);
            yPosition += 7;
            doc.text(`Receiver ${index + 1} Containers: ${rec.containers?.join(', ') || 'N/A'}`, 20, yPosition);
            yPosition += 10;
        });
        yPosition += 10;

        // Shipping
        doc.setFontSize(14);
        doc.text('Shipping Details', 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        (order.order_items || []).forEach((item, index) => {
            doc.text(`Item ${index + 1} Category: ${item.category || 'N/A'}`, 20, yPosition);
            yPosition += 7;
            doc.text(`Item ${index + 1} Weight: ${item.weight ? `${item.weight} kg` : 'N/A' }`, 20, yPosition);
            yPosition += 7;
        });
        yPosition += 10;

        // Transport
        doc.setFontSize(14);
        doc.text('Transport Details', 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        doc.text(`Driver Name: ${order.driver_name || 'N/A'}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Truck Number: ${order.truck_number || 'N/A'}`, 20, yPosition);
        yPosition += 10;

        // Inbound/Outbound
        doc.setFontSize(14);
        doc.text('Inbound/Outbound Details', 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        doc.text(`Drop Method: ${order.drop_method || 'N/A'}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Drop Date: ${formatDate(order.drop_date)}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Collection Method: ${order.collection_method || 'N/A'}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Delivery Date: ${formatDate(order.delivery_date)}`, 20, yPosition);
        yPosition += 10;

        // Files
        doc.setFontSize(14);
        doc.text('Files', 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        doc.text('Attachments:', 20, yPosition);
        yPosition += 7;
        doc.text(getFilesText(order.attachments), 20, yPosition);
        yPosition += 20; // Approximate lines
        doc.text('Gatepass:', 20, yPosition);
        yPosition += 7;
        doc.text(getFilesText(order.gatepass), 20, yPosition);

        // Save the PDF
        doc.save(`Order_${order.booking_ref || 'Unknown'}_${Date.now()}.pdf`);
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

    // Helper to render receivers list
    const renderReceivers = () => {
        const receivers = selectedOrder.receivers || [];
        if (receivers.length === 0) {
            return <Typography variant="body2" color="text.secondary">No receivers</Typography>;
        }
        return (
            <List dense sx={{ py: 0 }}>
                {receivers.map((rec, index) => (
                    <Card key={rec.id || index} sx={{ mb: 2, border: '1px solid #e3f2fd', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" color="#f58220">
                                    Receiver {index + 1}: {rec.receiver_name}
                                </Typography>
                                <Chip 
                                    label={rec.status || 'Created'} 
                                    size="small" 
                                    color="primary" 
                                    variant="filled"
                                    sx={{ 
                                        bgcolor: getOrderStatusColor(rec.status || 'Created'),
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }} 
                                />
                            </Box>
                            <HorizontalKeyValue 
                                data={{
                                    'Contact': rec.receiver_contact,
                                    'Address': rec.receiver_address,
                                    'Email': rec.receiver_email,
                                    'Consignment Number': rec.consignment_number,
                                    'Total Number': rec.total_number,
                                    'Total Weight': rec.total_weight ? `${rec.total_weight} kg` : 'N/A',
                                    'Assignment': rec.assignment,
                                    'Item Ref': rec.item_ref,
                                    'Receiver Ref': rec.receiver_ref,
                                    'Consignment Vessel': rec.consignment_vessel,
                                    'Consignment Marks': rec.consignment_marks,
                                    'Consignment Voyage': rec.consignment_voyage
                                }} 
                                spacing={2}
                            />
                            {rec.containers && rec.containers.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
                                        Containers:
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {rec.containers.map((cont, cIndex) => (
                                            <Chip key={cIndex} label={cont} variant="outlined" color="info" size="small" />
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </List>
        );
    };

    // Helper to render order items
    const renderOrderItems = () => {
        const items = selectedOrder.order_items || [];
        if (items.length === 0) {
            return <Typography variant="body2" color="text.secondary">No order items</Typography>;
        }
        return (
            <List dense sx={{ py: 0 }}>
                {items.map((item, index) => (
                    <Card key={item.id || index} sx={{ mb: 2, border: '1px solid #e3f2fd', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="#f58220" gutterBottom>
                                Item {index + 1}
                            </Typography>
                            <HorizontalKeyValue 
                                data={{
                                    'Category': item.category,
                                    'Subcategory': item.subcategory,
                                    'Type': item.type,
                                    'Pickup Location': item.pickup_location,
                                    'Delivery Address': item.delivery_address,
                                    'Total Number': item.total_number,
                                    'Weight': item.weight ? `${item.weight} kg` : 'N/A',
                                    'Total Weight': item.total_weight ? `${item.total_weight} kg` : 'N/A',
                                    // 'Item Ref': item.item_ref,
                                    // 'Consignment Status': item.consignment_status
                                }} 
                                spacing={2}
                            />
                        </CardContent>
                    </Card>
                ))}
            </List>
        );
    };

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
                    <Chip 
                        label={selectedOrder.overall_status || selectedOrder.status || 'Created'} 
                        size="small" 
                        color="primary" 
                        variant="filled"
                        sx={{ 
                            ml: 1,
                            bgcolor: statusColor,
                            color: 'white',
                            fontWeight: 'bold'
                        }} 
                    />
                    {(selectedOrder.receivers || []).length > 0 && (
                        <Chip 
                            label={`(${selectedOrder.receivers.length} Receivers)`} 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                            sx={{ ml: 1 }} 
                        />
                    )}
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
                                                    'Status': selectedOrder.overall_status || selectedOrder.status || 'Created',
                                                    'RGL Booking Number': selectedOrder.rgl_booking_number,
                                                    'Place of Loading': selectedOrder.place_of_loading,
                                                    'Final Destination': selectedOrder.final_destination,
                                                    'Place of Delivery': selectedOrder.place_of_delivery,
                                                    'ETA': formatDate(selectedOrder.eta),
                                                    'ETD': formatDate(selectedOrder.etd),
                                                    'Consignment Marks': selectedOrder.consignment_marks,
                                                    'Point of Origin': selectedOrder.point_of_origin,
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

                                {/* Associated Container Card
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
                                                    'Container ID': selectedOrder.container_id,
                                                    'Container Number': selectedOrder.container_number,
                                                    'Location': selectedOrder.container_location,
                                                    'Availability': selectedOrder.container_availability,
                                                    'Derived Status': selectedOrder.container_derived_status
                                                }} 
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid> */}
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
                                                    'Email': selectedOrder.sender_email,
                                                    'Sender Ref': selectedOrder.sender_ref,
                                                    'Sender Remarks': selectedOrder.sender_remarks
                                                }} 
                                                spacing={2}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Receivers Details Card */}
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
                                                    Receivers ({(selectedOrder.receivers || []).length})
                                                </Typography>
                                            </Box>
                                            {renderReceivers()}
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
                                            {renderOrderItems()}
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
                                                    'Transport Type': selectedOrder.transport_type,
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
                                                    'Dropoff Name': selectedOrder.dropoff_name,
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
                    onClick={() => exportToPDF(selectedOrder)} 
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
                    disabled={!selectedOrder}
                >
                    Export to PDF
                </Button>
                <Button 
                    onClick={() => {handleEdit(selectedOrder?.id); }} 
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