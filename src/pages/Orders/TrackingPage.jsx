import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Grid,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import { CheckCircle} from '@mui/icons-material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Notifications as NotifyIcon,
  CheckCircle as CheckIcon,
  Circle as CircleIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';

import { api } from '../../api';

const TrackingPage = () => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingData, setTrackingData] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = (value || '').trim();
    if (!q) {
      setError('Please enter item reference');
      return;
    }

    setLoading(true);
    setError('');
    setTrackingData(null);

    const url = `/api/orders/track/item/${encodeURIComponent(q.toUpperCase())}`;

    try {
      const res = await api.get(url);
      const data = res.data?.data ?? res.data;

      if (!data || !data.receivers?.length) {
        setError('No tracking information found for this reference');
        return;
      }

      setTrackingData(data);
    } catch (err) {
      let msg = 'Failed to load tracking details';
      if (err.response?.status === 404) msg = 'No shipment found for this reference';
      else if (err.response?.status === 400) msg = err.response.data?.message || 'Invalid reference';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Extract first receiver and item for display (as in screenshot)
  const receiver = trackingData?.receivers?.[0];
  const item = receiver?.items?.[0];
  const currentStatus = receiver?.current_status || receiver?.status || 'Order Created';
console.log('Current Status:', trackingData);
  // Simple timeline steps (you can make it dynamic later)
  const timelineSteps = [
    'Order Created',
    'Ready for Loading',
    'Loaded Into Container',
    'Shipment Processing',
    'Shipment In Transit',
    'Under Processing',
    'Arrived at Sort Facility',
    'Ready for Delivery',
    'Shipment Delivered'
  ];

  const currentStepIndex = timelineSteps.indexOf(currentStatus);
  const completedSteps = currentStepIndex >= 0 ? currentStepIndex : 0;

  // Helper function to get place name by ID
const getPlaceName = (placeId) => {
  if (!placeId) return '—';

  const places = {
    '2': 'Dubai',
    '5': 'Karachi',
    // Add more IDs and names as needed
  };

  return places[placeId] || `Unknown (${placeId})`;
};


  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', pb: 8 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 }, pt: 5 }}>

        {/* Hero Header - always visible */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0d6c6a 0%, #084a48 100%)',
            color: 'white',
            borderRadius: { xs: 2, md: 3 },
            p: { xs: 4, md: 6 },
            mb: 6,
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" fontWeight={800} sx={{ mb: 1 }}>
            Track Your Shipment
          </Typography>

          {/* Search Input - centered */}
          <Paper sx={{ p: 2, maxWidth: 600, mx: 'auto', borderRadius: 3, mt: 4 }}>
            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                size="large"
                placeholder="Enter Item Reference (e.g. ORDER-ITEM-REF-...)"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '1.1rem' }
                }}
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading || !value.trim()}
                sx={{ mt: 2, py: 1.5, bgcolor: '#f58220', '&:hover': { bgcolor: '#e64a19' } }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Track Now'}
              </Button>
            </form>
          </Paper>
        </Box>

        {/* Results - only shown after successful search */}
        {trackingData && receiver && (
          <Box flexDirection={'row'} display={'flex'} alignSelf={'center'} alignItems={'center'} justifyContent={'center'} mb={5}>
            <Typography variant="h4" sx={{ marginRight: 3,  fontWeight: 'bold' }}>
              {getPlaceName(trackingData?.place_of_loading)}
            </Typography>
            <CheckCircle sx={{ color: '#4caf50', fontSize: 30 }} />
            <Typography variant="h4" sx={{ marginLeft: 3, fontWeight: 'bold' }}>
               {getPlaceName(trackingData?.place_of_delivery)}
            </Typography>
</Box>
        )}

   {trackingData && receiver && (     
<Box>
            {/* Info Cards */}
            <Grid container justifyContent={'center'} spacing={2} sx={{ mb: 5 }}>
              {[             
               { label: 'Booking ID', value: trackingData?.booking_ref || '—' },
                { label: 'REF ID', value: item?.item_ref || '—' },
                { label: 'ORDER ID', value: trackingData.order_id || '—' },
                { label: 'QUANTITY', value: `${item?.total_number || 0} Packages` },
                { label: 'WEIGHT', value: `${item?.weight || 0} KG` },
                { label: 'ETA', value: receiver.eta ? new Date(receiver.eta).toLocaleDateString() : '—' },
              ].map((item, i) => (
                <Grid item xs={6} sm={4} md={2.4} key={i}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      textAlign: 'center',
                      bgcolor: 'white',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' }
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {item.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Timeline */}
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 5, position: 'relative' }}>
              <Box sx={{ position: 'relative', mb: 5 }}>
                <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 6, bgcolor: '#e0e0e0', borderRadius: 4, transform: 'translateY(-50%)' }} />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    width: `${(completedSteps / (timelineSteps.length - 1)) * 100}%`,
                    height: 6,
                    bgcolor: '#4caf50',
                    borderRadius: 4,
                    transform: 'translateY(-50%)'
                  }}
                />
                <Stack direction="row" justifyContent="space-between" sx={{ position: 'relative', zIndex: 1 }}>
                  {timelineSteps.map((step, i) => (
                    <Box key={step} sx={{ textAlign: 'center', flex: 1 }}>
                      <Box sx={{ mb: 1 }}>
                        {i < completedSteps ? (
                          <CheckCircle sx={{ color: '#4caf50', fontSize: 30 }} />
                        ) : i === completedSteps ? (
                          <CheckCircle sx={{ color: '#ff9800', fontSize: 30 }} />
                        ) : (
                          <CircleIcon sx={{ color: '#e0e0e0', fontSize: 30 }} />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: i === completedSteps ? 700 : 500,
                          color: i < completedSteps ? '#4caf50' : i === completedSteps ? '#ff9800' : '#757575'
                        }}
                      >
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>



              {/* Notify Me Button */}
              <Box sx={{ textAlign: 'center', mb: 5 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<NotifyIcon />}
                  sx={{ bgcolor: '#f58220', '&:hover': { bgcolor: '#e64a19' }, px: 8, py: 1.5 }}
                >
                  Notify Me
                </Button>
              </Box>

              {/* Detailed History */}
              <Box sx={{ mb: 5 }}>
  <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 700 }}>
    Shipment Status History
  </Typography>

  {receiver.status_history?.length > 0 ? (
    <List disablePadding>
      {receiver.status_history.map((entry, i) => {
        const isCurrent = entry.status === receiver.current_status;
        
        return (
          <ListItem 
            key={i} 
            sx={{ 
              py: 2, 
              borderBottom: '1px solid #eee', 
              position: 'relative',
              bgcolor: isCurrent ? 'rgba(255, 152, 0, 0.08)' : 'transparent', // light orange background for current
              borderLeft: isCurrent ? '4px solid #ff9800' : 'none', // orange left border
            }}
          >
            {/* Vertical timeline line */}
            <Box 
              sx={{ 
                position: 'absolute', 
                left: 20, 
                top: 0, 
                bottom: 0, 
                width: 4, 
                bgcolor: isCurrent ? '#ff9800' : (i < receiver.status_history.length - 1 ? '#4caf50' : '#e0e0e0')
              }} 
            />

            {/* Status content */}
            <Box sx={{ pl: 6, flex: 1 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: isCurrent ? 800 : 600,
                  color: isCurrent ? '#ff9800' : '#333',
                }}
              >
                {entry.status}
                {isCurrent && (
                  <Chip 
                    label="Current" 
                    size="small" 
                    sx={{ 
                      ml: 1.5, 
                      bgcolor: '#ff9800', 
                      color: 'white', 
                      fontSize: '0.7rem', 
                      height: 20 
                    }} 
                  />
                )}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {new Date(entry.time).toLocaleString('en-GB', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} • {entry.event_type.replace('_', ' ')}
              </Typography>

              {entry.notes && (
                <Typography variant="body2" sx={{ mt: 0.5, color: '#555', fontStyle: 'italic' }}>
                  {entry.notes.trim()}
                </Typography>
              )}
            </Box>
          </ListItem>
        );
      })}
    </List>
  ) : (
    <Alert severity="info" sx={{ textAlign: 'center' }}>
      No status history recorded yet for this receiver
    </Alert>
  )}
</Box>

              {/* Expected Arrival */}
              <Box sx={{ textAlign: 'center', mb: 5 }}>
                <Chip
                  label={`Expected Arrival: ${receiver.eta ? new Date(receiver.eta).toLocaleDateString() : 'TBD'}`}
                  size="large"
                  sx={{ bgcolor: '#f58220', color: 'white', fontSize: '1.1rem', fontWeight: 700, px: 4, py: 4 }}
                />
              </Box>
            </Paper>

            {/* Call to Action */}
            <Paper elevation={3} sx={{ p: 5, borderRadius: 3, textAlign: 'center', bgcolor: '#fff' }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                Are you looking to schedule your delivery?
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#555' }}>
                Please call at <strong>+971 555 658321</strong> and book your delivery with best competitive prices.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<PhoneIcon />}
                sx={{ bgcolor: '#0d6c6a', '&:hover': { bgcolor: '#084a48' }, px: 6 }}
              >
                Call Now
              </Button>
            </Paper>

            {/* Footer */}
            <Box textAlign="center" mt={8} color="text.secondary">
              <Typography variant="body2">
                Need help? Contact <strong>support@yourcompany.com</strong>
              </Typography>
              <Typography variant="caption" mt={1} display="block">
                © 2026 Your Logistics Company – Karachi
              </Typography>
            </Box>
          </Box>
        )}

        {/* No results yet or error */}
        {!trackingData && !loading && (
          <Box sx={{ textAlign: 'center', mt: 10 }}>
            <Typography variant="h6" color="text.secondary">
              Enter your item reference above to track your shipment
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TrackingPage;