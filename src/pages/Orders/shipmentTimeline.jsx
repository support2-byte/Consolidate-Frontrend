import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

// Standard timeline steps (the canonical names)
const TIMELINE_STEPS = [
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

// Status sync mapping (your provided rules)
const STATUS_SYNC_MAP = {
  'Drafts Cleared': 'Order Created',
  'Submitted On Vessel': 'Ready for Loading',
  'Customs Cleared': 'Loaded Into Container',
  'Submitted': 'Shipment Processing',
  'Under Shipment Processing': 'Shipment In Transit',
  'In Transit': 'Under Processing',
  'Arrived at Facility': 'Arrived at Sort Facility',
  'Ready for Delivery': 'Ready for Delivery',
  'Arrived at Destination': 'Ready for Delivery',
  'Delivered': 'Shipment Delivered',
  // Add more if needed
};

// Custom connector line
const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(90deg, #f58220 0%, #16a34a 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
            backgroundImage: 'linear-gradient(90deg, #f58220 0%, #16a34a 100%)',

    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 5,
    border: 0,
    backgroundColor: '#e0e0e0',
    borderRadius: 1,
  },
}));

const StatusIcon = ({ isCompleted, isCurrent }) => {
  if (isCompleted) {
    return <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 36 }} />;
  }
  if (isCurrent) {
    return <RadioButtonCheckedIcon sx={{ color: '#f58220', fontSize: 40 }} />;
  }
  return <RadioButtonUncheckedIcon sx={{ color: '#bdbdbd', fontSize: 32 }} />;
};

const ShipmentTimeline = ({ currentStatus = 'In Process', statusHistory = [] }) => {
  // ────────────────────────────────────────────────
  // 1. Find the MOST RECENT status from history
  // ────────────────────────────────────────────────
  let latestRawStatus = currentStatus; // fallback

  if (statusHistory?.length > 0) {
    // Sort by time descending (newest first) – just in case they're not already ordered
    const sortedHistory = [...statusHistory].sort((a, b) => 
      new Date(b.time) - new Date(a.time)
    );
    
    const latestEntry = sortedHistory[0];
    
    // Most status_advanced entries have status field
    // status_updated entries usually have newStatus in details
    latestRawStatus = 
      latestEntry.status ||
      latestEntry.details?.newStatus ||
      latestEntry.details?.new_status ||
      currentStatus; // ultimate fallback
  }

  // 2. Normalize using your mapping
  const normalizedCurrent = STATUS_SYNC_MAP[latestRawStatus] || latestRawStatus;

  // 3. Find position in canonical timeline
  let currentIndex = TIMELINE_STEPS.indexOf(normalizedCurrent);

  // Fallback logic if status not found in timeline
  if (currentIndex === -1) {
    // You can make this smarter – for now using your existing fallback
    currentIndex = TIMELINE_STEPS.length - 3; // or any reasonable default
  }

  const effectiveIndex = currentIndex;

  console.log('status logs',{
    latestRawStatus,
    normalizedCurrent,
    currentIndex,
    effectiveIndex,
    historyLength: statusHistory.length
  });

  // Rest of your component remains almost the same...
  return (
    <Paper
      elevation={3}
      sx={{ 
        borderRadius: 3,
        mt: 5,
        py:10,
        bgcolor: '#ffffff',
        border: '1px solid #e0e7ff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}
    >
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        Shipment Progress Timeline
      </Typography>

      <Stepper
        alternativeLabel
        connector={<CustomStepConnector />}
        activeStep={effectiveIndex}
        sx={{ pt: 2 }}
      >
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index < effectiveIndex;
          const isCurrent = index === effectiveIndex;

          return (
            <Step key={step} completed={isCompleted} active={isCurrent}>
              <StepLabel
                StepIconComponent={() => (
                  <StatusIcon isCompleted={isCompleted} isCurrent={isCurrent} />
                )}
                sx={{
                  '& .MuiStepLabel-label': {
                    mt: 1.5,
                    fontWeight: isCurrent ? 600 : isCompleted ? 500 : 400,
                    color: isCurrent
                      ? '#f58220'
                      : isCompleted
                      ? '#16a34a'
                      : '#757575',
                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.95rem' },
                  },
                }}
              >
                {step}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      <Box sx={{ mt: 5, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700} color="#f58220">
          Current Status: {normalizedCurrent}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Progress: ≈ {Math.round(((effectiveIndex + 1) / TIMELINE_STEPS.length) * 100)}% complete
        </Typography>
      </Box>

      {/* History list – already good, but now guaranteed to show latest first */}
      {statusHistory?.length > 0 && (
        <Box sx={{ m: 6 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Recent Status Updates
          </Typography>
          <Box sx={{ pl: 3, borderLeft: '3px solid #16a34a' }}>
            {statusHistory
              .slice() // copy
              .sort((a, b) => new Date(b.time) - new Date(a.time)) // newest first
              .map((entry, idx) => (
                <Box key={idx} sx={{ mb: 2.5 }}>
                  <Typography variant="body1" fontWeight={500}>
                    {entry.status || entry.details?.newStatus || entry.details?.new_status || 'Update'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(entry.time).toLocaleString('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    {entry.notes && ` — ${entry.notes.trim()}`}
                  </Typography>
                </Box>
              ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ShipmentTimeline;