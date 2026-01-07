import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';  // For v5 compatibility
import { useTheme } from '@mui/material/styles';
import {
  LocalShipping,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Inventory2 as InventoryIcon,
  LocalShipping as TruckIcon,
  TrackChanges as PackageIcon,
  CheckCircle as CheckIcon,
  AccessTime as ClockIcon
} from '@mui/icons-material';
import { api } from '../../api';

const TrackingPage = () => {
  const [itemRef, setItemRef] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [allOrders, setAllOrders] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  const handleTrack = async (e) => {
    console.log('Tracking initiated for itemRef:', itemRef);
    // e.preventDefault();
    setLoading(true); 
    // setError('');
    try {
      console.log('Sending request to track itemRef:', itemRef);  
      const response = await api.get(`/api/orders/track/item/${itemRef}`);
      console.log('Tracking data received:', response);
      setOrderData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Tracking failed');
    }
    setLoading(false);
  };


  useEffect(() => {
    // Preload all orders on component mount (optional)
    getAllOrders();
  }, []);


  const getAllOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      console.log('All orders loaded for tracking page', response.data.data);
      setAllOrders(response.data.data);
    } catch (err) {
      console.error('Error fetching all orders:', err);
    }
  };

  // Enhanced timeline data with more details (use real API for history)
  const getTimelineData = () => [
    { status: 'Order Created', time: '2025-10-10 20:00', icon: <PackageIcon />, color: 'primary', description: 'Your order has been placed successfully.' },
    { status: 'In Transit', time: '2025-10-11 09:00', icon: <TruckIcon />, color: 'warning', description: 'Shipment is on the way to destination.' },
    ...(orderData?.tracking_status === 'Delivered' ? [{ status: 'Delivered', time: '2025-10-12 14:00', icon: <CheckIcon />, color: 'success', description: 'Order delivered to receiver.' }] : []),
  ];

  const statusColors = {
    Created: 'primary',
    'In Transit': 'warning',
    Delivered: 'success',
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography sx={{ ml: 2, color: 'grey.600' }}>Tracking your order...</Typography>
      </Box>
    );
  }
console.log('Rendering TrackingPage with orderData:', orderData);
  return (
    <Box
      sx={{
        // minHeight: '80vh',
        bgcolor: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        // py: 4,
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Background Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.05,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '20%',
            right: '10%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: 'primary.light'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '20%',
            left: '10%',
            width: 150,
            height: 150,
            borderRadius: '50%',
            bgcolor: 'secondary.light'
          }
        }}
      />

      <Box sx={{ maxWidth: 1300, mx: 'auto', px: 2, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: 'primary.main',
              color: 'white'
            }}
          >
            <PackageIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'grey.800', fontWeight: 'bold' }}>
            Track Your Order
          </Typography>
          <Typography variant="h6" sx={{ color: 'grey.600', maxWidth: 500, mx: 'auto' }}>
            Enter your Item Reference to get real-time updates on your shipment journey
          </Typography>
        </Box>

        {/* Search Form */}
        <Card sx={{ width: '60%', margin: '0 auto',display:'table', mb: 6, boxShadow: 6, borderRadius: 3, overflow: 'visible' }}>
          <CardContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleTrack} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Enter Item Reference (e.g., ITEM-REF-1-1760101177608)"
                value={itemRef}
                onChange={(e) => setItemRef(e.target.value.trim())}
                required
                variant="outlined"
                sx={{ 
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'white'
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !itemRef}
                sx={{ 
                    bgcolor:'#0d6c6a' ,
                  color: 'white',
                  px: 4, 
                  py: 1.5, 
                  minWidth: 140,
                  borderRadius: 3,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  boxShadow: 2,
                  '&:hover': { boxShadow: 4 }
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Track Order'}
              </Button>
            </Box>
            {error && (
              <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        {orderData && (
          <Card sx={{ boxShadow: 6, borderRadius: 3, overflow: 'hidden', mb: 4 }}>
            {/* Header Card */}
            <Box
              sx={{
                bgcolor: 'primary.main',
                // bgcolor: 'linear-gradient(135deg, primary.main 0%, primary.dark 100%)',
                color: 'white',
                p: 4,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, }} />
              <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}>
                <Box>
                  <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
                    Order #{orderData[0].booking_ref}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Item Ref: <Chip label={orderData[0].item_ref || orderData[0].receiver_item_ref} variant="outlined" sx={{ color: 'white', borderColor: 'white', ml: 1 }} />
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.8 }}>
                    Consignment: {orderData[0].consignment_number || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex'}}>
                  <Box>
                  
            
                    <Typography variant="h6" fontWeight="bold">ETA: {new Date(orderData[0].eta).toLocaleDateString()}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>ETD: {new Date(orderData[0].etd).toLocaleDateString()}</Typography>
                   {/* <Chip
                      label={orderData[0].overall_status}
                      color={statusColors[orderData[0].overall_status] || 'default'}
                      variant="filled"
                      size="large"
                      sx={{ fontSize: '1rem', px: 2 ,bgcolor:'#fff'}}
                    /> */}
                  </Box>
                  
                </Box>
              </Box>
            </Box>

            {/* Detailed Content */}
            <CardContent sx={{ p: 2 }}>
     <Box sx={{ display: "flex", gap: 2, mt: 2 }}> 
  {/* Receiver Info */}
  <Box sx={{ flex: 1 }}>
    <CardHeader
      title="Receiver Details"
      titleTypographyProps={{ variant: 'h6', fontWeight: 'medium', color: 'grey.800' }}
      avatar={<PersonIcon sx={{ color: 'primary.main' }} />}
      sx={{ pb: 2 }}
    />
    <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
      <List dense>
        <ListItem>
          <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
          <ListItemText primary="Name" secondary={orderData[0].receiver_name} />
        </ListItem>
        <ListItem>
          <ListItemIcon><PhoneIcon color="primary" /></ListItemIcon>
          <ListItemText primary="Contact" secondary={orderData[0].receiver_contact || 'N/A'} />
        </ListItem>
        <ListItem>
          <ListItemIcon><LocationIcon color="primary" /></ListItemIcon>
          <ListItemText primary="Address" secondary={orderData[0].receiver_address || 'N/A'} />
        </ListItem>
        <ListItem>
          <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
          <ListItemText primary="Email" secondary={orderData[0].receiver_email || 'N/A'} />
        </ListItem>
        <ListItem>
          <ListItemIcon><InventoryIcon color="primary" /></ListItemIcon>
          <ListItemText primary="Total Weight" secondary={`${orderData[0].receiver_total_weight || orderData[0].total_weight} kg`} />
        </ListItem>
      </List>
    </Paper>
  </Box>

  {/* Shipment Info */}
  <Box sx={{ flex: 1 }}>
    <CardHeader
      title="Shipment Information"
      titleTypographyProps={{ variant: 'h6', fontWeight: 'medium', color: 'grey.800' }}
      avatar={<LocalShipping color="primary" />}
      sx={{ pb: 2 }}
    />
    <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
      <List dense>
        <ListItem>
          <ListItemIcon><PackageIcon color="primary" /></ListItemIcon>
          <ListItemText primary="Containers" secondary={orderData[0].receiver_containers_json || orderData[0].container_number || 'None'} />
        </ListItem>
        <ListItem>
          <ListItemIcon><LocalShipping color="primary" /></ListItemIcon>
          <ListItemText primary="Transport Type" secondary={orderData[0].transport_type || 'N/A'} />
        </ListItem>
        <ListItem>
          <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
          <ListItemText primary="Driver" secondary={orderData[0].driver_name || 'N/A'} />
        </ListItem>
        <ListItem>
          <ListItemIcon><TruckIcon color="primary" /></ListItemIcon>
          <ListItemText primary="Truck Number" secondary={orderData[0].truck_number || 'N/A'} />
        </ListItem>
        <ListItem>
          <ListItemIcon><ClockIcon color="primary" /></ListItemIcon>
          <ListItemText primary="Drop Date" secondary={new Date(orderData[0].drop_date).toLocaleDateString() || 'N/A'} />
        </ListItem>
      </List>
    </Paper>
  </Box>

  {/* Order Summary */}
  <Box sx={{ flex: 1 }}>
    <CardHeader
      title="Order Summary"
      titleTypographyProps={{ variant: 'h6', fontWeight: 'medium', color: 'grey.800' }}
      sx={{ pb: 2 }}
    />
    <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 0 }}>
          <Typography variant="body2" color="grey.600">Shipping Line</Typography>
          <Typography variant="body1" fontWeight="medium">{orderData[0].shipping_line || 'N/A'}</Typography>
        </Box>
        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 0 }}>
          <Typography variant="body2" color="grey.600">Place of Loading</Typography>
          <Typography variant="body1" fontWeight="medium">{orderData[0].place_of_loading || 'N/A'}</Typography>
        </Box>
        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 0 }}>
          <Typography variant="body2" color="grey.600">Final Destination</Typography>
          <Typography variant="body1" fontWeight="medium">{orderData[0].final_destination || 'N/A'}</Typography>
        </Box>
        <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 0 }}>
          <Typography variant="body2" color="grey.600">Status</Typography>
          <Chip label={orderData[0].overall_status} color={statusColors[orderData[0].overall_status] || 'default'} size="small" />
        </Box>
      </Box>
    </Paper>
  </Box>
</Box>
            </CardContent>

            {/* Enhanced Timeline */}
            <Divider />
            <Box sx={{ px: 4, pb: 4 }}>
              <CardHeader
                title="Order Journey Timeline"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'medium', color: 'grey.800' }}
                sx={{ pb: 2 }}
              />
              <Timeline position="alternate">
                {getTimelineData().map((item, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot 
                        variant="filled" 
                        sx={{ 
                          bgcolor: theme.palette[statusColors[item.status] || 'grey'].main,
                          color: 'white',
                          boxShadow: 1
                        }}
                      >
                        <Avatar sx={{ width: 28, height: 28, fontSize: '1rem' }}>
                          {item.icon}
                        </Avatar>
                      </TimelineDot>
                      {index < getTimelineData().length - 1 && <TimelineConnector sx={{ bgcolor: 'primary.main' }} />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 2, 
                          bgcolor: 'white',
                          borderLeft: `4px solid ${theme.palette[statusColors[item.status] || 'grey'].main}`,
                          '&:hover': { boxShadow: 3 }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette[statusColors[item.status] || 'grey'].main }}>
                            {item.status}
                          </Typography>
                          <Chip 
                            label="●" 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ height: 20, width: 20, fontSize: '0.75rem' }}
                          />
                        </Box>
                        <Typography variant="body2" color="grey.600">{item.time}</Typography>
                        <Typography variant="body2" sx={{ mt: 1, color: 'grey.700' }}>{item.description}</Typography>
                        <IconButton size="small" sx={{ mt: 1, color: 'primary.main' }}>
                          <ClockIcon />
                        </IconButton>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Box>
          </Card>
        )}

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 6, pt: 4, borderTop: 1, borderColor: 'grey.200' }}>
          <Typography variant="body2" color="grey.600" gutterBottom>
            Need help? Contact support at support@yourcompany.com or call +1-234-567-8900
          </Typography>
          <Typography variant="caption" color="grey.500">
            © 2025 Your Company. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default TrackingPage;