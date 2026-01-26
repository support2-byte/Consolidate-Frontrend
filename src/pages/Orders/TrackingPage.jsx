import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Grid,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

// ... other imports you already have

const TrackingPage = () => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [trackType, setTrackType] = useState('item_ref');

const handleSearch = async (e) => {
  e.preventDefault();
  if (!value.trim()) return;

  setLoading(true);
  setError('');
  setTrackingData(null);

  const reference = value.trim().toUpperCase();

  const typeToEndpoint = {
    item_ref:       'item',
    order_id:       'order',
    booking_ref:    'item',           // adjust later if needed
    consignment_no: 'consignment_no',
  };

  const endpoint = typeToEndpoint[trackType];
  if (!endpoint) {
    setError('Invalid tracking type');
    setLoading(false);
    return;
  }

  const url = `/api/orders/track/${endpoint}/${encodeURIComponent(reference)}`;

  try {
    const res = await api.get(url);
    let rawData = res.data?.data ?? res.data;

    // ────────────────────────────────────────────────
    // Normalize for consignment_no responses
    // ────────────────────────────────────────────────
    let trackingDataToSet;

    if (trackType === 'consignment_no') {
      if (!rawData?.orders?.length) {
        setError('No orders found for this consignment');
        setLoading(false);
        return;
      }

      // Most common case: 1 order per consignment
      // If multiple orders become common → you may want to show a list or tabs
      const mainOrder = rawData.orders[0];

      trackingDataToSet = {
        // Copy fields the UI already expects/uses
        order_id: mainOrder.order_id,
        booking_ref: mainOrder.booking_ref,
        created_at: mainOrder.created_at,
        status: mainOrder.status,
        overall_status: mainOrder.overall_status,
        eta: mainOrder.eta || rawData.consignment?.eta,
        sender: mainOrder.sender,
        receivers: mainOrder.receivers,
        total_assigned_qty: mainOrder.total_assigned_qty,

        // Optional: expose consignment-level info if you want to display it
        consignment: {
          number: rawData.consignment?.number,
          status: rawData.consignment?.status,
          eta: rawData.consignment?.eta,
          origin: rawData.consignment?.origin,
          destination: rawData.consignment?.destination,
          vessel: rawData.consignment?.vessel,
          voyage: rawData.consignment?.voyage,
          containers: rawData.consignment?.containers,
        },
      };
    } else {
      // item_ref, order_id, booking_ref → assume flat structure already
      trackingDataToSet = rawData;
    }

    if (!trackingDataToSet || !trackingDataToSet.receivers?.length) {
      setError('No tracking information found for this reference');
      return;
    }

    setTrackingData(trackingDataToSet);

  } catch (err) {
    let msg = 'Failed to load tracking details';
    if (err.response) {
      switch (err.response.status) {
        case 404: msg = 'No shipment found for this reference'; break;
        case 400: msg = err.response.data?.message || 'Invalid reference format'; break;
        case 500: msg = 'Server error – please try again later'; break;
        default:  msg = err.response.data?.message || msg;
      }
    }
    setError(msg);
    console.error('Tracking error:', err);
  } finally {
    setLoading(false);
  }
};
  // Helpers
  const receiver = trackingData?.receivers?.[0];
  const item     = receiver?.items?.[0];

  const getPlaceName = (placeId) => {
    if (!placeId) return '—';
    const places = { '2': 'Dubai', '5': 'Karachi' /* add more as needed */ };
    return places[placeId] || `Unknown (${placeId})`;
  };

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

  const currentStatus = receiver?.current_status || receiver?.status || 'Order Created';
  const currentStepIndex = timelineSteps.indexOf(currentStatus);
  const completedSteps = currentStepIndex >= 0 ? currentStepIndex : 0;

  // Decide layout
  const useDetailedLayout = ['order_id', 'consignment_no'].includes(trackType);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', pb: 8 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 }, pt: 5 }}>

        {/* Hero / Search */}
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

          <Paper sx={{ p: 2, maxWidth: 600, mx: 'auto', borderRadius: 3, mt: 4 }}>
            <form onSubmit={handleSearch}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <FormControl sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                  <InputLabel id="track-by-label">Track by</InputLabel>
                  <Select
                    labelId="track-by-label"
                    value={trackType}
                    label="Track by"
                    onChange={(e) => setTrackType(e.target.value)}
                    disabled={loading}
                    size="large"
                  >
                    <MenuItem value="item_ref">Item Reference</MenuItem>
                    <MenuItem value="order_id">Order ID</MenuItem>
                    <MenuItem value="booking_ref">Booking Reference</MenuItem>
                    <MenuItem value="consignment_no">Consignment Tracking No</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="large"
                  placeholder={
                    trackType === 'item_ref'       ? "e.g. ORDER-ITEM-REF-12345" :
                    trackType === 'order_id'       ? "e.g. 106 or ORD-987654" :
                    trackType === 'consignment_no'    ? "e.g. RGSL-17676-327" :
                                                     "e.g. CN-4567890123"
                  }
                  value={value}
                  onChange={(e) => setValue(e.target.value.trim())}
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
              </Stack>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading || !value.trim()}
                sx={{ py: 1.5, bgcolor: '#f58220', '&:hover': { bgcolor: '#e64a19' } }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Track Now'}
              </Button>
            </form>
          </Paper>
        </Box>

        {/* ───────────────────────────────────────────────
            RESULTS
        ─────────────────────────────────────────────── */}
        
      {useDetailedLayout && trackingData && (
  <Box sx={{ maxWidth: 1600, mx: 'auto', px: { xs: 2, md: 0 } }}>
    {/* Order Summary Card */}
    <Paper 
      elevation={3} 
      sx={{ 
        p: { xs: 3, md: 5 }, 
        mb: 6, 
        borderRadius: 3, 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e0e7ff'
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
      

        <Box 
          sx={{ 
            mt: 3, 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            gap: 2 
          }}
        >
      
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight={700} 
          color="primary.main" 
          gutterBottom
        >
          Order #{trackingData.order_id}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Booking Reference: <strong>{trackingData.booking_ref || '—'}</strong>
        </Typography>
      
          <Chip 
            label={`Created: ${new Date(trackingData.created_at).toLocaleDateString()}`} 
            variant="outlined" 
            color="default" 
            size="medium"
          />
          <Chip 
            label={`Status: ${trackingData.sta || trackingData.status || 'In Process'}`} 
            color="primary" 
            variant="filled" 
            size="medium"
            sx={{ fontWeight: 600 }}
          />
          <Chip 
            label={`Total Quantity: ${trackingData.total_assigned_qty?.toLocaleString() || 0} pcs`} 
            color="info" 
            size="medium"
          />
          {trackingData.eta && (
            <Chip 
              label={`Overall ETA: ${new Date(trackingData.eta).toLocaleDateString()}`} 
              color="success" 
              variant="outlined" 
              size="medium"
            />
          )}
        </Box>
      </Box>
    </Paper>

    {/* Sender & Receiver Sections */}
    <Box display={"flex"} justifyContent={'space-between'} >
      {/* Sender Info */}
      {trackingData.sender && (
        <Box  xs={12} spacing={3} md={8}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 4, 
              height: '100%', 
              borderRadius: 3, 
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom color="primary.dark">
              Sender Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {trackingData.sender.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Phone: {trackingData.sender.contact || '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: {trackingData.sender.email || '—'}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Receivers - take remaining space */}
      <Box  xs={24} md={trackingData.sender ? 24 : 12}>
        <Stack spacing={3}>
          {trackingData.receivers?.map((receiver, idx) => {
            const items = receiver.items || [];
            const totalPackages = items.reduce((sum, it) => sum + (Number(it.total_number) || 0), 0);
            const totalWeight = items.reduce((sum, it) => sum + (Number(it.weight) || 0), 0);

            return (
              <Paper 
                key={receiver.receiver_id} 
                elevation={3}
                sx={{ 
                  borderRadius: 3, 
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                {/* Receiver Header */}
                <Box 
                  sx={{ 
                    bgcolor: '#0d6c6a',
                    color: 'white',
                    p: { xs: 3, md: 4 },
                    position: 'relative'
                  }}
                >
                  <Typography variant="h5" fontWeight={700}>
                    Receiver {idx + 1}: {receiver.name}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mt: 1, opacity: 0.95 }}>
                    {receiver.address || '—'}
                  </Typography>

                  <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={receiver.status} 
                      size="medium"
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.25)',
                        color: 'white',
                        fontWeight: 600,
                        '& .MuiChip-label': { px: 2 }
                      }}
                    />
                    <Chip 
                      label={`ETA: ${receiver.eta ? new Date(receiver.eta).toLocaleDateString() : 'TBD'}`} 
                      size="medium"
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.18)',
                        color: 'white'
                      }}
                    />
                    {receiver.containers?.length > 0 && (
                      <Chip 
                        label={`Containers: ${receiver.containers.join(' • ')}`} 
                        size="medium"
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.18)',
                          color: 'white'
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Content */}
                <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: '#ffffff' }}>
                  <Grid container spacing={4}>
                    {/* Contact & Totals */}
                    <Grid item xs={12} md={5}>
                      <Stack spacing={3}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Contact Information
                          </Typography>
                          <Typography fontWeight={500}>{receiver.contact || '—'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {receiver.email || '—'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Shipment Summary
                          </Typography>
                          <Typography fontWeight={500}>
                            {totalPackages.toLocaleString()} packages
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total weight: {totalWeight.toLocaleString()} kg
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    {/* Drop-off Details */}
                    {receiver.drop_off_details?.length > 0 && (
                      <Grid item xs={12} md={7}>
                        <Box 
                          sx={{ 
                            p: 3, 
                            bgcolor: '#fffbeb', 
                            borderRadius: 2,
                            border: '1px solid #fde68a'
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom color="amber.dark">
                            Scheduled Pickup / Drop-off
                          </Typography>
                          
                          {receiver.drop_off_details.map((d, i) => (
                            <Box key={i} sx={{ mt: i > 0 ? 2.5 : 0 }}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {d.drop_method}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Contact:</strong> {d.dropoff_name} • {d.drop_off_mobile}
                              </Typography>
                              {d.plate_no && (
                                <Typography variant="body2">
                                  Vehicle: {d.plate_no}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                Date: {d.drop_date ? new Date(d.drop_date).toLocaleDateString() : '—'}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>

                  {/* Items Table */}
                  {items.length > 0 && (
                    <Box sx={{ mt: 5 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Items / Cargo Details
                      </Typography>
                      <TableContainer 
                        component={Paper} 
                        elevation={0}
                        sx={{ 
                          border: '1px solid #e2e8f0', 
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}
                      >
                        <Table size="medium">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                              <TableCell><strong>Item Ref</strong></TableCell>
                              <TableCell><strong>Description</strong></TableCell>
                              <TableCell align="right"><strong>Quantity</strong></TableCell>
                              <TableCell align="right"><strong>Weight (kg)</strong></TableCell>
                              <TableCell><strong>Container(s)</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {items.map((it) => {
                              const containers = it.assignments?.map(a => a.container_number).filter(Boolean).join(', ') || '—';
                              return (
                                <TableRow 
                                  key={it.item_id}
                                  hover
                                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                  <TableCell>{it.item_ref}</TableCell>
                                  <TableCell>
                                    {it.category}
                                    {it.subcategory && ` • ${it.subcategory}`}
                                    {it.type && ` (${it.type})`}
                                  </TableCell>
                                  <TableCell align="right">{Number(it.total_number)?.toLocaleString() || '—'}</TableCell>
                                  <TableCell align="right">{it.weight || '—'}</TableCell>
                                  <TableCell>{containers}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  {/* Status History */}
                  {receiver.status_history?.length > 0 && (
                    <Box sx={{ mt: 5 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Shipment Status History
                      </Typography>
                      <List disablePadding>
                        {receiver.status_history.map((entry, i) => {
                          const isCurrent = entry.status === receiver.current_status;
                          return (
                            <ListItem
                              key={i}
                              divider={i < receiver.status_history.length - 1}
                              sx={{
                                py: 2.5,
                                pl: 0,
                                bgcolor: isCurrent ? 'rgba(255, 193, 7, 0.08)' : 'transparent',
                                borderLeft: isCurrent ? '4px solid #ffb300' : 'none',
                                pl: isCurrent ? 3 : 0,
                                transition: 'all 0.2s'
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Typography variant="subtitle1" fontWeight={isCurrent ? 700 : 600}>
                                    {entry.status}
                                  </Typography>
                                  {isCurrent && (
                                    <Chip 
                                      label="Current Status" 
                                      size="small" 
                                      color="warning" 
                                      variant="filled"
                                    />
                                  )}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {new Date(entry.time).toLocaleString('en-GB', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })} • {entry.event_type?.replace('_', ' ') || 'Update'}
                                </Typography>
                                {entry.notes && (
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mt: 1, 
                                      fontStyle: 'italic', 
                                      color: 'text.secondary',
                                      bgcolor: 'rgba(0,0,0,0.03)',
                                      p: 1.5,
                                      borderRadius: 1
                                    }}
                                  >
                                    {entry.notes.trim()}
                                  </Typography>
                                )}
                              </Box>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    </Box>
{/* Timeline */}
              <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mt: 5, position: 'relative' }}>
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
</Paper>
                {/* Notify Me */}
                <Box sx={{ textAlign: 'center',mt:5, mb: 5 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<NotifyIcon />}   // ← make sure icon is imported
                    sx={{ bgcolor: '#f58220', '&:hover': { bgcolor: '#e64a19' }, px: 8, py: 1.5 }}
                  >
                    Notify Me
                  </Button>
                </Box>

                {/* Status History */}
                <Box sx={{ mb: 5 }}>
                  <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 700 }}>
                    Shipment Status History
                  </Typography>
                </Box>
    {/* Final CTA */}
    <Paper 
      elevation={4}
      sx={{ 
        mt: 8, 
        p: { xs: 4, md: 6 }, 
        textAlign: 'center', 
        borderRadius: 4,
        bgcolor: '#0d1b2a',
        color: 'white'
      }}
    >
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Ready to Schedule Pickup or Delivery?
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
        Contact our team for the best rates and fastest service. We're available 24/7.
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<PhoneIcon />}
        sx={{ 
          bgcolor: '#f58220', 
          '&:hover': { bgcolor: '#e66918' },
          px: 6,
          py: 1.8,
          fontSize: '1.1rem',
          fontWeight: 600,
          borderRadius: 50
        }}
      >
        Call Now: +971 555 658321
      </Button>
    </Paper>

    {/* Footer */}
    <Box textAlign="center" mt={8} color="text.secondary">
      <Typography variant="body2">
        Need assistance? Email us at <strong>support@yourcompany.com</strong>
      </Typography>
      <Typography variant="caption" mt={1.5} display="block">
        © {new Date().getFullYear()} Your Logistics Company – Karachi, Pakistan
      </Typography>
    </Box>
  </Box>
)}

               

        {/* Loading */}
        {loading && (
          <Box sx={{ textAlign: 'center', mt: 10 }}>
            <CircularProgress size={60} thickness={5} />
            <Typography variant="h6" sx={{ mt: 2 }}>Searching shipment...</Typography>
          </Box>
        )}

        {/* Error */}
        {error && !loading && (
          <Alert severity="error" sx={{ mt: 5, maxWidth: 600, mx: 'auto' }}>
            <AlertTitle>Tracking Failed</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Empty state */}
        {!trackingData && !loading && !error && (
          <Box sx={{ textAlign: 'center', mt: 10 }}>
            <Typography variant="h6" color="text.secondary">
              Enter your reference number above to track your shipment
            </Typography>
          </Box>
        )}

      </Box>
    </Box>
  );
};

export default TrackingPage