import React, { useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { AppContext } from "../../context/AppContext";

const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: "linear-gradient(90deg, #f58220 0%, #16a34a 100%)",
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: "linear-gradient(90deg, #f58220 0%, #16a34a 100%)",
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 5,
    border: 0,
    backgroundColor: "#e0e0e0",
    borderRadius: 1,
  },
}));

const StatusIcon = ({ isCompleted, isCurrent }) => {
  if (isCompleted) {
    return <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 36 }} />;
  }
  if (isCurrent) {
    return <RadioButtonCheckedIcon sx={{ color: "#f58220", fontSize: 40 }} />;
  }
  return <RadioButtonUncheckedIcon sx={{ color: "#bdbdbd", fontSize: 32 }} />;
};

const ShipmentTimeline = ({
  currentStatus = "In Process",
  statusHistory = [],
}) => {
  const { statuses } = useContext(AppContext);

  const TIMELINE_STEPS = (statuses || [])
    .filter((s) => s.status && s.order_status)
    .sort((a, b) => a.sorting_number - b.sorting_number)
    .map((s) => s.order_status);

  const STATUS_SYNC_MAP = {};
  (statuses || [])
    .filter((s) => s.status && s.order_status)
    .forEach((s) => {
      if (s.container_status)
        STATUS_SYNC_MAP[s.container_status] = s.order_status;
      if (s.consignment_status)
        STATUS_SYNC_MAP[s.consignment_status] = s.order_status;
    });

  let latestRawStatus = currentStatus;

  if (statusHistory?.length > 0) {
    const sortedHistory = [...statusHistory].sort(
      (a, b) => new Date(b.time) - new Date(a.time),
    );
    const latestEntry = sortedHistory[0];
    latestRawStatus =
      latestEntry.status ||
      latestEntry.details?.newStatus ||
      latestEntry.details?.new_status ||
      currentStatus;
  }

  const normalizedCurrent = STATUS_SYNC_MAP[latestRawStatus] ?? latestRawStatus;
  let currentIndex = TIMELINE_STEPS.indexOf(normalizedCurrent);
  if (currentIndex === -1) currentIndex = TIMELINE_STEPS.length - 3;

  const effectiveIndex = currentIndex;

  return (
    <Box
      sx={{
        borderRadius: 3,
        mt: 5,
        py: 10,
        bgcolor: "#ffffff",
        border: "none",
      }}
    >
      <Typography
        variant="h5"
        fontWeight={700}
        gutterBottom
        sx={{ mb: 4, textAlign: "center" }}
      >
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
                  "& .MuiStepLabel-label": {
                    mt: 1.5,
                    fontWeight: isCurrent ? 600 : isCompleted ? 500 : 400,
                    color: isCurrent
                      ? "#f58220"
                      : isCompleted
                        ? "#16a34a"
                        : "#757575",
                    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.95rem" },
                  },
                }}
              >
                {step}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      <Box sx={{ mt: 5, textAlign: "center" }}>
        <Typography variant="h6" fontWeight={700} color="#f58220">
          Current Status: {normalizedCurrent}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Progress: ≈{" "}
          {Math.round(((effectiveIndex + 1) / TIMELINE_STEPS.length) * 100)}%
          complete
        </Typography>
      </Box>

      {statusHistory?.length > 0 && (
        <Box sx={{ m: 6 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Recent Status Updates
          </Typography>
          <Box sx={{ pl: 3, borderLeft: "3px solid #16a34a" }}>
            {statusHistory
              .slice()
              .sort((a, b) => new Date(b.time) - new Date(a.time))
              .map((entry, idx) => (
                <Box key={idx} sx={{ mb: 2.5 }}>
                  <Typography variant="body1" fontWeight={500}>
                    {entry.status ||
                      entry.details?.newStatus ||
                      entry.details?.new_status ||
                      "Update"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(entry.time).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {entry.notes && ` — ${entry.notes.trim()}`}
                  </Typography>
                </Box>
              ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ShipmentTimeline;
