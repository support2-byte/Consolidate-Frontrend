
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,

} from '@mui/material';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import NotificationsIcon from '@mui/icons-material/Notifications';

// Assume you have an api client (axios or fetch wrapper)
import { api } from '../../api';
import ShipmentTimeline from './shipmentTimeline';

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
      item_ref: 'item',
      order_id: 'order',
      rglBookingNo: 'rgl', // adjust later if needed
      consignment_no: 'consignment_no',
    };

    const endpoint = typeToEndpoint[trackType];
    if (!endpoint) {
      setError('Invalid tracking type');
      setLoading(false);
      return;
    }
console.log('rglBookingNorglBookingNo',typeToEndpoint)
    const url = `/api/orders/track/${endpoint}/${encodeURIComponent(reference)}`;

    try {
      const res = await api.get(url);
      let rawData = res.data?.data ?? res.data;
      console.log('sender response rawdata', rawData)
      let trackingDataToSet;

      if (trackType === 'consignment_no') {
        if (!rawData?.orders?.length) {
          setError('No orders found for this consignment');
          setLoading(false);
          return;
        }

        // === IMPORTANT: Preserve full structure for consignment ===
        // Do NOT flatten — keep consignment, orders array, and summary
        trackingDataToSet = {
          consignment: rawData.consignment || {},
          orders: rawData.orders || [],
          summary: rawData.summary || {},
        };

        // Basic validation
        if (!trackingDataToSet.consignment?.number) {
          setError('Consignment number is missing in response');
          setLoading(false);
          return;
        }

        // Optional: log for debugging during development
        console.log('Consignment data prepared:', {
          consignmentNo: trackingDataToSet.consignment.number,
          orderCount: trackingDataToSet.orders.length,
          hasSummary: !!trackingDataToSet.summary?.order_count,
        });
      } else {
        // For item_ref, order_id, booking_ref — use flat structure
        // Assuming most responses have a single main order
        const mainOrder = rawData.orders?.[0] || rawData; // fallback if no orders array
        console.log('main order sender_email', trackingData)
        trackingDataToSet = {
          order_id: mainOrder.order_id || rawData.order_id || '—',
          booking_ref: mainOrder.booking_ref || rawData.booking_ref || '—',
          rgl_booking_number: mainOrder.rgl_booking_number || rawData.rgl_booking_number || '-',
          place_of_delivery: mainOrder.place_of_delivery || rawData.place_of_delivery || '',
          place_of_loading: mainOrder.place_of_loading || rawData.place_of_loading || '',

          created_at: mainOrder.created_at || rawData.created_at || '—',
          status: mainOrder.status || rawData.status || 'In Process',
          overall_status: mainOrder.overall_status || rawData.overall_status || 'In Process',
          eta: mainOrder.eta || rawData.eta || rawData.consignment?.eta || '—',
          sender: mainOrder.sender_name || rawData.sender_name || null,
          sender_email: mainOrder.sender_email || rawData.sender_email || null,
          sender_contact: mainOrder.sender_contact || rawData.sender_contact || null,
          receivers: mainOrder.receivers || rawData.receivers || [],
          total_assigned_qty: mainOrder.total_assigned_qty || rawData.total_assigned_qty || 0,
          // If consignment info is present, include it
          consignment: rawData.consignment
            ? {
              number: rawData.consignment.number,
              status: rawData.consignment.status,
              eta: rawData.consignment.eta,
              origin: rawData.consignment.origin,
              destination: rawData.consignment.destination,
              vessel: rawData.consignment.vessel,
              voyage: rawData.consignment.voyage,
              containers: rawData.consignment.containers,
            }
            : null,
        };
      }

      // Final validation - different checks for different layouts
      if (trackType === 'consignment_no') {
        if (!trackingDataToSet.orders?.length) {
          setError('No valid orders found in consignment');
          setLoading(false);
          return;
        }
      } else {
        if (!trackingDataToSet.receivers?.length) {
          setError('No receivers/tracking information found for this reference');
          setLoading(false);
          return;
        }
      }

      setTrackingData(trackingDataToSet);
    } catch (err) {
      let msg = 'Failed to load tracking details';
      if (err.response) {
        switch (err.response.status) {
          case 404:
            msg = 'No shipment found for this reference';
            break;
          case 400:
            msg = err.response.data?.message || 'Invalid reference format';
            break;
          case 500:
            msg = 'Server error – please try again later';
            break;
          default:
            msg = err.response.data?.message || msg;
        }
      }
      setError(msg);
      console.error('Tracking error:', err);
    } finally {
      setLoading(false);
    }
  };
  // ────────────────────────────────────────────────
  // Layout decision
  // ────────────────────────────────────────────────
  const isItemRefLayout = trackType === 'item_ref';
  const isOrderLayout = ['order_id', 'rglBookingNo'].includes(trackType);
  const isConsignmentLayout = trackType === 'consignment_no';

  const receiver = trackingData?.receivers?.[0];
  const item = receiver?.items?.[0];

  const timelineSteps = [
    'Order Created',
    'Ready for Loading',
    'Loaded Into Container',
    'Shipment Processing',
    'Shipment In Transit',
    'Under Processing',
    'Arrived at Sort Facility',
    'Ready for Delivery',
    'Shipment Delivered',
  ];

  const currentStatus = receiver?.current_status || receiver?.status || trackingData?.status || 'Order Created';
  const currentStepIndex = timelineSteps.indexOf(currentStatus);
  const completedSteps = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const progressPercent = (completedSteps / timelineSteps.length) * 100;


  console.log('Consignment data →', {
    hasSummary: !!trackingData?.summary,
    summaryContent: trackingData?.summary,
    orderCount: trackingData?.summary?.order_count,
    totalItems: trackingData?.summary?.total_items,
  });
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', pb: 8 }}>
      {/* Hero / Search Section - common for all layouts */}
      <Box
        sx={{
          background: 'linear-gradient(90deg, #f58220 0%, #16a34a 100%)',
          color: 'white',
          borderRadius: { xs: 0, md: 3 },
          p: { xs: 4, md: 6 },
          mb: 6,
          height: 300,
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" fontWeight={800} sx={{ mt: 15 }}>
          Track Your Shipment
        </Typography>

        <Paper sx={{ p: 3, maxWidth: 700, mx: 'auto', borderRadius: 3, mt: 4 }}>
          <form onSubmit={handleSearch}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Track by</InputLabel>
                <Select
                  value={trackType}
                  label="Track by"
                  color='#000'
                  onChange={(e) => setTrackType(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="item_ref">Item Reference</MenuItem>
                  <MenuItem value="order_id">Order ID</MenuItem>
                  <MenuItem value="rglBookingNo">Form No</MenuItem>
                  <MenuItem value="consignment_no">Consignment No</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                placeholder={
                  trackType === 'item_ref'
                    ? 'e.g. RGSL-ITEM-ABC123'
                    : trackType === 'order_id'
                      ? 'e.g. ORD-987654'
                      : trackType === 'consignment_no'
                        ? 'e.g. RGSL-17676-327'
                        : 'e.g. CN-4567890123'
                }
                value={value}
                onChange={(e) => setValue(e.target.value.trim())}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                  ),
                }}
                disabled={loading}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading || !value.trim()}
                sx={{
                  minWidth: 140,
                  py: 2.5,
                  background: 'linear-gradient(90deg, #f58220 0%, #16a34a 100%)',
                  '&:hover': { background: '#e64a19' },
                  color: "#fff",
                  fontWeight: "bold"
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Track'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>

      {/* ────────────────────────────────────────────────
          RESULTS - Different layouts based on trackType
      ──────────────────────────────────────────────── */}
      {loading && (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            Searching shipment...
          </Typography>
        </Box>
      )}

      {error && !loading && (
        <Alert severity="error" sx={{ maxWidth: 700, mx: 'auto', mt: 5 }}>
          {error}
        </Alert>
      )}

      {!trackingData && !loading && !error && (
        <Box sx={{ textAlign: 'center', mt: 10, color: 'text.secondary' }}>
          <Typography variant="h6">
            Enter your reference number above to track your shipment
          </Typography>
        </Box>
      )}

      {trackingData && !loading && (
        <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 } }}>
          {isItemRefLayout && <ItemRefLayout trackingData={trackingData} progressPercent={progressPercent} currentStatus={currentStatus} timelineSteps={timelineSteps} />}
          {isOrderLayout && <OrderDetailedLayout trackingData={trackingData} currentStatus={currentStatus} />}
          {isConsignmentLayout && <ConsignmentLayout trackingData={trackingData} />}
        </Box>
      )}
    </Box>
  );
};

// ────────────────────────────────────────────────
// Layout 1: Item Reference - Modern / Horizontal Timeline
// ────────────────────────────────────────────────
// ────────────────────────────────────────────────
// Layout 1: Item Reference - Modern / Horizontal Timeline
// Matches your provided HTML/CSS spirit + real API response
// ────────────────────────────────────────────────
const ItemRefLayout = ({ trackingData }) => {
  const receiver = trackingData.receivers?.[0] || {};
  const item = receiver.items?.[0] || {};

  // Place mapping
  const placeMap = {
    '5': 'KARACHI',
    '2': 'DUBAI',
  };

  const pol = placeMap[trackingData.place_of_loading] || 'ORIGIN';
  const pod = placeMap[trackingData.place_of_delivery] || 'DESTINATION';
  console.log('pod   pol', trackingData)


  const currentStatus = receiver.status || trackingData.status || 'In Process';

  // Timeline steps (fixed order from your design)
  const timelineSteps = [
    'Order Created',
    'Ready for Loading',
    'Loaded Into Container',
    'Shipment Processing',
    'Shipment In Transit',
    'Under Processing',
    'Arrived at Sort Facility',
    'Ready for Delivery',
    'Shipment Delivered',
  ];

  // Find current index
  let currentIndex = timelineSteps.indexOf(currentStatus);
  if (currentIndex === -1) currentIndex = 1; // fallback

  const progressPercent = Math.round(((currentIndex + 1) / timelineSteps.length) * 100);

  // History from response
  const history = (receiver.status_history || [])
    .filter(h => h.status)
    .map(h => ({
      status: h.status,
      time: new Date(h.time).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      notes: h.notes?.trim() || '',
    }));

  // Has issue / reversal note (example logic - adjust based on your data)
  const hasIssue = history.some(h => h.notes?.toLowerCase().includes('reverse') || h.notes?.toLowerCase().includes('issue'));

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 }, pb: 6 }}>
      {/* Header / Title */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            color: '#0d6c6a',
            letterSpacing: '-0.5px',
            mb: 1,
          }}
        >
          Track Your Shipment
        </Typography>

        <Typography variant="subtitle1" color="text.secondary">
          Last updated on: {new Date().toLocaleDateString('en-GB')} {/* Replace with real timestamp */}
        </Typography>
      </Box>

      {/* Main Summary Card */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 5, md: 6 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)',
          mb: 5,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        {/* Route */}
        <Typography
          variant="h5"
          fontWeight={700}
          align="center"
          sx={{
            mb: 3,
            color: '#fff',
            letterSpacing: '1px',
          }}
        >
          {pol} → {pod}
        </Typography>

        {/* Info Chips */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          flexWrap="wrap"
          sx={{ mb: 5 }}
        >
          <Chip
            label={
              <Box sx={{ textAlign: 'center', py: 0.5, color: '#fff' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#000', fontWeight: "bold" }}>
                  ITEM REF ID
                </Typography>
                <Typography variant="body1" color='#000' fontWeight={600}>
                  {item.item_ref || '—'}
                </Typography>
              </Box>
            }
            variant="filled"

            sx={{ background: '#fff', width: 260, height: 'auto', py: 1.5 }}
          />

          <Chip
            label={
              <Box sx={{ textAlign: 'center', py: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: "bold" }}>
                 Booking Ref
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {trackingData.booking_ref || '—'}
                </Typography>
              </Box>
            }
            variant="outlined"
            sx={{ width: 180, background: "#fff", height: 'auto', py: 1.5 }}
          />

          <Chip
            label={
              <Box sx={{ textAlign: 'center', py: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: "bold" }}>
                  QUANTITY
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {item.total_number?.toLocaleString() || 0} Packages
                </Typography>
              </Box>
            }
            variant="outlined"
            sx={{ width: 180, background: "#fff", height: 'auto', py: 1.5 }}
          />

          <Chip
            label={
              <Box sx={{ textAlign: 'center', py: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: "bold" }}>
                  WEIGHT
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {item.weight || 0} KG
                </Typography>
              </Box>
            }
            variant="outlined"
            sx={{ width: 180, background: "#fff", height: 'auto', py: 1.5 }}
          />

          <Chip
            label={
              <Box sx={{ textAlign: 'center', py: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: "bold" }}>
                  ETA
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {receiver.eta
                    ? new Date(receiver.eta).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                    : '—'}
                </Typography>
              </Box>
            }
            variant="outlined"
            sx={{ width: 180, background: "#fff", height: 'auto', py: 1.5 }}
          />
        </Stack>

        {/* Horizontal Timeline */}
        <Box sx={{ position: 'relative', my: 6 }}>
          {/* Progress line */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: 8,
              bgcolor: '#e0e0e0',
              borderRadius: 4,
              transform: 'translateY(-50%)',
              marginTop: 3,
              marginBottom: 5
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              height: 8,
              background: 'linear-gradient(90deg, #16a34a 0%, #f58220 100%)',
              borderRadius: 4,
              transform: 'translateY(-50%)',
              width: `${progressPercent}%`,
              transition: 'width 0.8s ease',
              marginTop: 3,
              marginBottom: 5
            }}
          />

          {/* Steps */}
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{
              position: 'relative',
              zIndex: 1,
              pt: 2,
              mt: 4
            }}
          >
            {timelineSteps.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <Box key={step} sx={{ textAlign: 'center', flex: 1 }}>
                  {isCurrent ? (
                    <Box sx={{ position: 'relative' }}>
                      <RadioButtonCheckedIcon
                        sx={{ color: '#f58220', fontSize: 30, mb: 1 }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(50%, 17%)',
                          fontSize: 28,

                        }}
                      >
                        ⛴️
                      </Box>
                    </Box>
                  ) : isCompleted ? (
                    <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 30, mb: 1 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ color: '#bdbdbd', fontSize: 30, mb: 1 }} />
                  )}

                  <Typography
                    variant="body2"
                    fontWeight={isCurrent ? 400 : isCompleted ? 400 : 400}
                    color={isCurrent ? '#f58220' : isCompleted ? '#16a34a' : '#fff'}
                    sx={{ fontSize: '14px', mt: 10 }}
                  >
                    {step}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* Status Message */}
        <Typography variant="h6" fontWeight={600} color='#fff' textAlign={'center'} sx={{ mt: 3, mb: 2 }}>
          {currentStatus === 'Shipment Delivered'
            ? 'Shipment Delivered Successfully!'
            : `Your order is being prepared for ${currentStatus.toLowerCase()}.`}
        </Typography>

        {/* Issue / Reversal Note */}
        {hasIssue && (
          <Paper
            sx={{
              p: 3,
              mt: 3,
              bgcolor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="body1" color="amber.800" fontWeight={500}>
              Due to an issue, we had to reverse the status. We apologize for any inconvenience.
            </Typography>
          </Paper>
        )}

        {/* Notify Me Button */}
        <Button
          variant="contained"
          size="large"
          startIcon={<NotificationsIcon />}
          sx={{
            mt: 4,
            bgcolor: '#f58220',
            '&:hover': { bgcolor: '#e66918' },
            px: 8,
            py: 1.8,
            fontSize: '16px',
            color:"#fff",
            borderRadius: 50,
            // alignItems:"center",
            margin: "0 auto",
            display: "flex"
          }}
        >
          Notify Me
        </Button>
      </Paper>

      {/* Vertical History Section */}
      {history.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: '#f8fafc',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: { xs: 20, sm: 40 },
              top: 40,
              bottom: 40,
              width: 6,
              bgcolor: '#16a34a',
              borderRadius: 3,
              zIndex: 0,
            }}
          />

          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 4, pl: { xs: 4, sm: 6 } }}>
            Shipment Status History
          </Typography>

          <Box sx={{ pl: { xs: 4, sm: 6 }, position: 'relative', zIndex: 1 }}>
            {history.map((entry, idx) => {

              const isCurrent = idx - 0
              console.log('history status',isCurrent)
              return (
                <Box key={idx} sx={{ mb: 4, display: 'flex', alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: isCurrent ? '#16a34a' : '#f58220',
                      border: '4px solid white',
                      boxShadow: '0 0 0 3px rgba(22,163,74,0.3)',
                      flexShrink: 0,
                      mt: 0.5,
                      zIndex: 2,
                    }}
                  />

                  <Box sx={{ ml: 3, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} color={isCurrent ? '#16a34a' : '#f58220'}>
                      {entry.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {entry.time}
                      {/* {entry.notes && ` • ${entry.notes}`} */}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Expected Arrival */}
          {receiver.eta && (
            <Box sx={{ mt: 5, textAlign: 'center' }}>
              <Chip
                label={`Expected Arrival: ${new Date(receiver.eta).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}`}
                color="success"
                size="large"
                sx={{
                  fontSize: '1.1rem',
                  py: 2.5,
                  px: 4,
                  fontWeight: 600,
                }}
              />
            </Box>
          )}
        </Paper>
      )}

      {/* Final CTA */}
      <Paper
        elevation={4}
        sx={{
          mt: 8,
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Need to Schedule Pickup or Delivery?
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
          Contact our team for assistance with scheduling, updates, or any questions.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<PhoneIcon />}
          sx={{
            background: 'linear-gradient(90deg, #f58220 0%, #16a34a 100%)',
            '&:hover': { bgcolor: '#e66918' },
            px: 6,
            py: 1.8,
            fontSize: '1.1rem',
            color: '#fff',
            fontWeight: 600,
            borderRadius: 50,
          }}
        >
          Call Now: +971 555 658321
        </Button>
      </Paper>
    </Box>
  );
};
// ────────────────────────────────────────────────
// Layout 2: Order / Booking - Detailed with cards & table
// ────────────────────────────────────────────────
// ────────────────────────────────────────────────
// Layout 2: Order / Booking Reference - Detailed View
// Updated to match your real order_ref response structure
// ────────────────────────────────────────────────
const OrderDetailedLayout = ({ trackingData }) => {
  const {
    id: order_id,
    booking_ref,
    rgl_booking_number,
    created_at,
    overall_status,
    eta: orderEta,
    total_assigned_qty,
    sender_name: senderName,
    sender_contact: senderContact,
    sender_email: senderEmail,
    transport_type: transportType,
    collection_scope,
    receivers = [],
  } = trackingData;

  // Format date helper
  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) : '—';

  // Derive sender object for consistency
  const sender = {
    name: trackingData.sender || '—',
    contact: trackingData.sender_contact || '—',
    email: senderEmail || '—',
  };

  const transport = {
    type: transportType || '—',
    collection_scope: collection_scope || 'Partial',
    // add drop_method / delivery_date if you later include them in response
  };
  console.log('sender', sender)
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', px: 2 }}>
      {/* Order Summary Header */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 4, md: 5 },
          mb: 6,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)',
          color: '#fff',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Form No #{rgl_booking_number}
          </Typography>

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Booking Ref: <strong>{booking_ref || '—'}</strong>
          </Typography>

        </Box>
      </Paper>

      {/* Receivers */}
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        Delivery Destinations ({receivers.length})
      </Typography>

      <Stack spacing={5}>
        {receivers.map((receiver, idx) => {
          const shippingDetails = receiver.shippingDetails || [];
          const totalPackages = shippingDetails.reduce((sum, item) => sum + (Number(item.totalNumber) || 0), 0);
          const totalRemaining = shippingDetails.reduce((sum, item) => sum + (Number(item.remainingItems) || 0), 0);

          return (
            <Paper
              key={receiver.id}
              elevation={3}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.1)', transform: 'translateY(-4px)' },
              }}
            >
              {/* Receiver Header */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #1b263b 0%, #0d6c6a 100%)',
                  color: 'white',
                  p: { xs: 3, md: 4 },
                }}
              >
                <Typography variant="h5" fontWeight={700}>
                  Receiver {idx + 1}: {receiver.receiverName || '—'}
                </Typography>

                <Typography variant="body1" sx={{ mt: 1, opacity: 0.95 }}>
                  {receiver.receiverAddress || '—'} -    Email  {receiver.receiverEmail || '—'}
                </Typography>
                <Box>
                  <Typography variant="body2" color="#ffff">

                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} sx={{ mt: 2.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={receiver.status || 'Pending'}
                    size="medium"
                    sx={{ bgcolor: '#f58220', color: 'white', fontWeight: 600 }}
                  />
                  <Chip
                    label={`ETA: ${formatDate(receiver.eta) || 'TBD'}`}
                    size="medium"
                    sx={{ bgcolor: '#16a34a', color: 'white', fontWeight: 600 }}
                  />
                  {receiver.containers?.length > 0 && (
                    <Chip
                      label={`Container${receiver.containers.length > 1 ? 's' : ''}: ${receiver.containers.join(' • ')}`}
                      size="medium"
                      sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 600 }}
                    />
                  )}
                </Stack>
              </Box>

              {/* Content */}
              <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: '#fff' }}>
                <Grid container justifyContent={'space-between'} spacing={4}>
                  {/* Left column - Contact + Summary */}
                  <Grid sx={{ p: 3, bgcolor: '#fffbeb', border: '1px solid #fde68a', width: 400, borderRadius: 2 }} >
                    <Stack spacing={4}>

                      {/* Sender */}
                      <Box sx={{ mt: 3, mb: 4 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Sender
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {sender.name}
                        </Typography>
                        <Typography variant="body2">
                          Contact: {sender.contact} • Email: {sender.email}
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
                          Remaining: {totalRemaining.toLocaleString()} pcs
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Drop-off / Pickup Schedule */}
                  {receiver.dropOffDetails?.length > 0 && (
                    <Grid >
                      <Paper
                        variant="outlined"
                        sx={{ p: 3, bgcolor: '#fffbeb', border: '1px solid #fde68a', width: 400, borderRadius: 2 }}
                      >
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom color="amber.dark">
                          Pickup / Drop-off Schedule
                        </Typography>
                        <Stack spacing={2.5}>
                          {receiver.dropOffDetails.map((d, i) => (
                            <Box key={i}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {d.drop_method || '—'}
                              </Typography>
                              <Typography variant="body2">
                                {d.dropoff_name} • {d.drop_off_mobile || '—'}
                              </Typography>
                              {d.plate_no && (
                                <Typography variant="body2">Vehicle: {d.plate_no}</Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                Date: {formatDate(d.drop_date) || '—'}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  )}
                </Grid>

                {/* Cargo / Items Table */}
                {shippingDetails.length > 0 && (
                  <Box sx={{ mt: 5 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Cargo Details
                    </Typography>


                    {shippingDetails.map((item) => {
                      const containerInfo = item.containerDetails?.[0] || {};
                      const cont = containerInfo.container || {};
                      const status = containerInfo.status || receiver.status || '—';

                      return (
                        <Box flex={1}>

                          <TableContainer
                            component={Paper}
                            sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}
                          >
                            <Table size="medium">
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                  <TableCell><strong>Ref</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Total Qty</strong></TableCell>
                                  <TableCell align="right"><strong>Total Weight</strong></TableCell>
                                  <TableCell align="right"><strong>Remaining</strong></TableCell>
                                  <TableCell><strong>Container / Status</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow key={item.id} hover>
                                  <TableCell>{item.itemRef || '—'}</TableCell>
                                  <TableCell>
                                    {item.category}
                                    {item.subcategory && ` • ${item.subcategory}`}
                                    {item.type && ` (${item.type})`}
                                  </TableCell>
                                  <TableCell align="right">
                                    {Number(item.totalNumber)?.toLocaleString() || '—'}
                                  </TableCell>

                                  <TableCell align="right">
                                    {Number(item.weight)?.toLocaleString() || '—'}
                                  </TableCell>
                                  <TableCell align="right">
                                    {Number(item.remainingItems)?.toLocaleString() || '—'}
                                  </TableCell>
                                  <TableCell>
                                    {cont.container_number ? (
                                      <>
                                        {cont.container_number}
                                        <br />
                                        <Typography variant="caption" color="text.secondary">
                                          {status} • {Number(containerInfo.assign_total_box || 0).toLocaleString()}  {item.type && ` (${item.type})`}
                                          • {Number(containerInfo.assign_weight || 0).toLocaleString()} Kg

                                        </Typography>
                                      </>
                                    ) : (
                                      'Not Assigned'
                                    )}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <ShipmentTimeline
                            currentStatus={receiver.status}
                            statusHistory={receiver.status_history || []} // add this field to response if needed
                          />
                        </Box>

                      );
                    })}

                  </Box>

                )}
              </Box>
            </Paper>
          )
        })}
      </Stack>

      {/* CTA */}
      <Paper
        elevation={4}
        sx={{
          mt: 8,
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Need Help with Pickup or Delivery?
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
          Contact support for scheduling, status updates, or questions.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<PhoneIcon />}
          sx={{
            background: 'linear-gradient(90deg, #f58220 0%, #16a34a 100%)',
            '&:hover': { bgcolor: '#e66918' },
            px: 6,
            py: 1.8,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 50,
          }}
        >
          Call Now: +971 555 658321
        </Button>
      </Paper>
    </Box>
  );
};
// ────────────────────────────────────────────────
// Layout 3: Consignment - Vessel / Containers focused
// ────────────────────────────────────────────────
// ────────────────────────────────────────────────
// Layout 3: Consignment No - Vessel / Containers / Multi-Order Focused
// Fully updated to match your real consignment response structure
// ────────────────────────────────────────────────
const ConsignmentLayout = ({ trackingData }) => {
  if (!trackingData) {
    return (
      <Alert severity="info" sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        No consignment data received. Please try searching again.
      </Alert>
    );
  }

  const cons = trackingData.consignment || {};
  const orders = trackingData.orders || [];
  const summary = trackingData.summary || {};
  console.log('tracking data', trackingData)
  const hasSummaryData =
    summary.order_count ||
    summary.total_assigned ||
    summary.totalNumber ||
    summary.active_containers?.length > 0;

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      : 'TBD';

  // Vessel name fallback (you can later replace with real mapping)
  const vesselName =
    cons.vessel === 1 ? 'Vessel Alpha' :   // example mapping
      cons.vessel === 2 ? 'Vessel Beta' :
        `Vessel ID ${cons.vessel || '—'}`;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 3 } }}>
      {/* Hero - Consignment Main Info */}
      <Paper
        elevation={5}
        sx={{
          p: { xs: 4, md: 6 },
          mb: 6,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)',
          color: 'white',
          justifyContent: "space-between"
        }}
      >
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Consignment: {cons.number || 'Not available'}
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
          Status: <strong>{cons.status || 'Unknown'}</strong>
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="grey.400">
              Route
            </Typography>
            <Typography variant="h6">
              {cons.origin || '—'} → {cons.destination || '—'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="grey.400">
              Vessel / Voyage
            </Typography>
            <Typography variant="h6">
              {vesselName} / {cons.voyage || '—'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="grey.400">
              ETA
            </Typography>
            <Typography variant="h6">{formatDate(cons.eta)}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="grey.400">
              Containers
            </Typography>
            <Typography variant="h6" sx={{ wordBreak: 'break-all' }}>
              {cons.containers?.map((c) => c.containerNo).join(', ') || '—'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Consignment Overview - NOW WITH PAPER WRAPPER */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 6,
          borderRadius: 3,
          bgcolor: '#f8fafc',
          border: '1px solid #e0e7ff',
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 4 }}>
          Consignment Overview
        </Typography>

        {hasSummaryData ? (
          <Grid container spacing={4}>
            <Grid item xs={6} sm={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Orders
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {summary.order_count || orders.length || 0}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {summary.total_items?.toLocaleString() || '—'}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Assigned Quantity
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {summary.total_assigned?.toLocaleString() || '—'}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Active Containers
              </Typography>
              <Typography variant="h6" sx={{ wordBreak: 'break-all', lineHeight: 1.4 }}>
                {summary.active_containers?.join(', ') || '—'}
              </Typography>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="h6" gutterBottom>
              No summary statistics available yet
            </Typography>
            <Typography variant="body1">
              This section will display totals once the consignment progresses further.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Associated Orders */}
      {orders.length > 0 && (
        <>
          <Typography
            variant="h5"
            fontWeight={700}
            gutterBottom
            sx={{ mb: 4, textAlign: 'center' }}
          >
            Associated Orders ({orders.length})
          </Typography>

          <Stack spacing={2}>
            {orders.map((order) => (
              <Paper key={order.order_id} elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)', color: 'white', p: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Order #{order.rgl_booking_number} • {order.booking_ref || '—'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    {/* Status: {order.status || order.status || 'In Process'} */}
                  </Typography>
                </Box>

                <Box sx={{ p: 4 }}>

                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
                    Receivers ({order.receivers?.length || 0})
                  </Typography>

                  <Stack spacing={3} sx={{ mt: 2 }}>
                    {order.receivers.map((receiver, idx) => {
                      const shippingDetails = receiver.shippingDetails || [];
                      const totalPackages = shippingDetails.reduce((sum, item) => sum + (Number(item.totalNumber) || 0), 0);
                      const totalRemaining = shippingDetails.reduce((sum, item) => sum + (Number(item.remainingItems) || 0), 0);

                      return (
                        <Paper
                          key={receiver.id}
                          elevation={3}
                          sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.2s',
                            '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.1)', transform: 'translateY(-4px)' },
                          }}
                        >
                          {/* Receiver Header */}
                          <Box
                            sx={{
                              background: 'linear-gradient(135deg, #1b263b 0%, #0d6c6a 100%)',
                              color: 'white',
                              p: { xs: 3, md: 4 },
                            }}
                          >
                            <Typography variant="h5" fontWeight={700}>
                              Receiver {idx + 1}: {receiver.receiverName || '—'}
                            </Typography>

                            <Typography variant="body1" sx={{ mt: 1, opacity: 0.95 }}>
                              {receiver.receiverAddress || '—'}
                            </Typography>
                            <Typography variant="subtitle2" color="#fff" gutterBottom>
                              Email:      {receiver.receiverEmail || '—'}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 2.5, flexWrap: 'wrap' }}>
                              <Chip
                                label={receiver.status || 'Pending'}
                                size="medium"
                                sx={{ bgcolor: '#f58220', color: 'white', fontWeight: 600 }}
                              />
                              <Chip
                                label={`ETA: ${formatDate(receiver.eta) || 'TBD'}`}
                                size="medium"
                                sx={{ bgcolor: '#16a34a', color: 'white', fontWeight: 600 }}
                              />
                              {receiver.containers?.length > 0 && (
                                <Chip
                                  label={`Container${receiver.containers.length > 1 ? 's' : ''}: ${receiver.containers.join(' • ')}`}
                                  size="medium"
                                  sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 600 }}
                                />
                              )}

                            </Stack>
                          </Box>

                          {/* Content */}
                          <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: '#fff' }}>
                            <Grid container flexDirection={'row'} alignItems={'center'} justifyContent={'space-between'} spacing={4}>
                              {/* Left column - Contact + Summary */}
                              <Grid sx={{ p: 3, bgcolor: '#fffbeb', border: '1px solid #fde68a', width: 400, borderRadius: 2 }}>
                                <Stack spacing={4}>
                                  <Box>
                                    {order.sender && (
                                      <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                          Sender
                                        </Typography>
                                        <Typography>
                                          {order.sender.name} • {order.sender.email || order.sender.contact || '—'}
                                        </Typography>
                                      </Box>
                                    )}


                                  </Box>

                                  <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                      Shipment Summary
                                    </Typography>
                                    <Typography fontWeight={500}>
                                      {totalPackages.toLocaleString()} packages
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Remaining: {totalRemaining.toLocaleString()} pcs
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Grid>

                              {/* Drop-off / Pickup Schedule */}
                              {receiver.dropOffDetails?.length > 0 && (
                                <Grid >
                                  <Paper
                                    variant="outlined"
                                    sx={{ p: 3, bgcolor: '#fffbeb', border: '1px solid #fde68a', width: 400, borderRadius: 2 }}
                                  >
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom color="amber.dark">
                                      Pickup / Drop-off Schedule
                                    </Typography>
                                    <Stack spacing={2.5}>
                                      {receiver.dropOffDetails.map((d, i) => (
                                        <Box key={i}>
                                          <Typography variant="subtitle2" fontWeight={600}>
                                            {d.drop_method || '—'}
                                          </Typography>
                                          <Typography variant="body2">
                                            {d.dropoff_name} • {d.drop_off_mobile || '—'}
                                          </Typography>
                                          {d.plate_no && (
                                            <Typography variant="body2">Vehicle: {d.plate_no}</Typography>
                                          )}
                                          <Typography variant="body2" color="text.secondary">
                                            Date: {formatDate(d.drop_date) || '—'}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Stack>
                                  </Paper>
                                </Grid>
                              )}
                            </Grid>

                            {/* Cargo / Items Table */}
                            {shippingDetails.length > 0 && (
                              <Box sx={{ mt: 5 }}>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                  Cargo Details
                                </Typography>


                                {shippingDetails.map((item) => {
                                  const containerInfo = item.containerDetails?.[0] || {};
                                  const cont = containerInfo.container || {};
                                  const status = containerInfo.status || receiver.status || '—';

                                  return (
                                    <Box flex={1}>

                                      <TableContainer
                                        component={Paper}
                                        sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}
                                      >
                                        <Table size="medium">
                                          <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                              <TableCell><strong>Ref</strong></TableCell>
                                              <TableCell><strong>Description</strong></TableCell>
                                              <TableCell align="right"><strong>Total Weight</strong></TableCell>
                                              <TableCell align="right"><strong>Total Items</strong></TableCell>

                                              <TableCell align="right"><strong>Remaining</strong></TableCell>
                                              <TableCell><strong>Container / Status</strong></TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            <TableRow key={item.id} hover>
                                              <TableCell>{item.itemRef || '—'}</TableCell>
                                              <TableCell>
                                                {item.category}
                                                {item.subcategory && ` • ${item.subcategory}`}
                                                {item.type && ` (${item.type})`}
                                              </TableCell>
                                              <TableCell align="right">
                                                {Number(item.weight)?.toLocaleString() || '—'}
                                              </TableCell>
                                              <TableCell align="right">
                                                {Number(item.totalNumber)?.toLocaleString() || '—'}
                                              </TableCell>
                                              <TableCell align="right">
                                                {Number(item.remainingItems)?.toLocaleString() || '—'}
                                              </TableCell>
                                              <TableCell>
                                                {cont.container_number ? (
                                                  <>
                                                    {cont.container_number}
                                                    <br />
                                                    <Typography variant="caption" color="text.secondary">
                                                      {status} • {Number(containerInfo.assign_total_box || 0).toLocaleString()} boxes
                                                      • {Number(containerInfo.assign_weight || 0).toLocaleString()} kg

                                                    </Typography>
                                                  </>
                                                ) : (
                                                  'Not Assigned'
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                        <Box sx={{m:3}}>
                                      {cont.container_number ? (
                                    
                                        <ShipmentTimeline
                                          currentStatus={receiver.status}
                                          statusHistory={receiver.status_history || []} // add this field to response if needed
                                        />) : null}
                                       </Box>
                                    </Box>

                                  );
                                })}

                              </Box>

                            )}
                          </Box>
                        </Paper>
                      )
                    })}
                  </Stack>
                </Box>
              </Paper>
            ))}

          </Stack>

        </>
      )}


      {/* CTA */}
      <Paper
        sx={{
          mt: 8,
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          background: 'linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Questions about this consignment?
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
          Contact our team for status updates, documentation, or delivery scheduling.
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
          }}
        >
          Call Now: +971 555 658321
        </Button>
      </Paper>
    </Box>
  );
};

export default TrackingPage;
