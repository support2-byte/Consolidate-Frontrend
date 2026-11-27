import React from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { CONTAINER_STATUS_OPTIONS } from "../../constants/containers";
import {
  isLockedStatus,
  containerEtaLockedMessage,
  etaWindow,
  isEtaInWindow,
} from "../../constants/lockedStatuses";

const TEAL = "#0d6c6a";
const ORANGE = "#f58220";

const Section = ({ icon, title, subtitle, children }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      p: 2,
      bgcolor: "#fafcfc",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1.5,
          bgcolor: "rgba(13,108,106,0.1)",
          color: TEAL,
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, color: TEAL, lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
    {children}
  </Box>
);

// 12-Dec-2026
const fmt = (v) => {
  if (!v) return "—";
  const d = dayjs(`${String(v).slice(0, 10)}T00:00:00`);
  return d.isValid() ? d.format("DD-MMM-YYYY") : "—";
};

const ContainerQuickUpdateModal = ({
  open,
  container,
  tempData,
  setTempData,
  jobStatusOptions = [],
  isEtaStatusBackward = () => false,
  places = [],
  saving = false,
  onSave,
  onClose,
}) => {
  if (!container) return null;

  const currentEtaStatus = container.assignment_status || "";
  const etaLocked = isLockedStatus(currentEtaStatus);
  const isAssigned = !!container.consignment_number;
  const hasEtaStatus = !!currentEtaStatus && currentEtaStatus !== "Available";

  const selectedEtaStatus =
    !tempData.jobStatus || tempData.jobStatus === "Available"
      ? ""
      : tempData.jobStatus;
  const etaStatusChanged =
    !!selectedEtaStatus && selectedEtaStatus !== currentEtaStatus;

  const limits = etaWindow(container.eta);
  const etaDateDisabled = etaLocked || !isAssigned || etaStatusChanged;
  const etaEdited = !!tempData.eta && tempData.eta !== tempData.etaOriginal;
  const etaInvalid =
    etaEdited && !isEtaInWindow(tempData.etaOriginal, tempData.eta);

  const etaHelper = etaLocked
    ? containerEtaLockedMessage(currentEtaStatus)
    : !isAssigned
      ? "Available once the container is assigned to a consignment."
      : etaStatusChanged
        ? "A new ETA status calculates its own ETA."
        : etaInvalid
          ? `Choose a date between ${limits.min} and ${limits.max}.`
          : `Forward only, up to ${limits.max} (30 days).`;

  const dirty =
    tempData.status !== (container.current_status || "") ||
    tempData.location !== (container.location || "") ||
    (selectedEtaStatus || "") !== (hasEtaStatus ? currentEtaStatus : "") ||
    (etaEdited && !etaStatusChanged);

  const canSave =
    !saving && dirty && !etaInvalid && !!tempData.status && !!tempData.location;

  const locationNames = places.map((p) => p.name);
  const locationOptions =
    tempData.location && !locationNames.includes(tempData.location)
      ? [tempData.location, ...locationNames]
      : locationNames;
  const statusOptions =
    tempData.status && !CONTAINER_STATUS_OPTIONS.includes(tempData.status)
      ? [tempData.status, ...CONTAINER_STATUS_OPTIONS]
      : CONTAINER_STATUS_OPTIONS;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${TEAL} 0%, #14908d 100%)`,
          color: "#fff",
          px: 3,
          py: 2.5,
          position: "relative",
        }}
      >
        <IconButton
          onClick={onClose}
          disabled={saving}
          size="small"
          sx={{ position: "absolute", top: 10, right: 10, color: "#fff" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography variant="overline" sx={{ opacity: 0.8, lineHeight: 1 }}>
          Quick update
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
          {container.container_number}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
          <Chip
            size="small"
            label={`${container.container_size || "—"} ${container.container_type || ""}`}
            sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff" }}
          />
          <Chip
            size="small"
            label={container.owner_type === "soc" ? "Own" : "Hired"}
            sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff" }}
          />
          {isAssigned && (
            <Chip
              size="small"
              label={`Consignment ${container.consignment_number}`}
              sx={{ bgcolor: ORANGE, color: "#fff", fontWeight: 600 }}
            />
          )}
        </Box>
      </Box>

      <DialogContent sx={{ display: "grid", gap: 2, pt: 3 }}>
        {etaLocked && (
          <Alert
            severity="info"
            icon={<LockOutlinedIcon fontSize="inherit" />}
            sx={{ borderRadius: 2 }}
          >
            {containerEtaLockedMessage(currentEtaStatus)} You can still update
            the physical status and location.
          </Alert>
        )}

        <Section
          icon={<Inventory2OutlinedIcon fontSize="small" />}
          title="Status & location"
          subtitle="Where the container physically is"
        >
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              select
              size="small"
              label="Status"
              value={tempData.status || ""}
              onChange={(e) =>
                setTempData((p) => ({ ...p, status: e.target.value }))
              }
              fullWidth
            >
              {statusOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Location"
              value={tempData.location || ""}
              onChange={(e) =>
                setTempData((p) => ({ ...p, location: e.target.value }))
              }
              InputProps={{
                startAdornment: (
                  <PlaceOutlinedIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "text.secondary" }}
                  />
                ),
              }}
              fullWidth
            >
              {locationOptions.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Section>

        <Section
          icon={<LocalShippingOutlinedIcon fontSize="small" />}
          title="ETA tracking"
          subtitle="Moves forward only — it can't go back to an earlier step"
        >
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              select
              size="small"
              label="ETA Status"
              value={
                etaLocked ? currentEtaStatus : selectedEtaStatus || "Available"
              }
              onChange={(e) =>
                setTempData((p) => ({ ...p, jobStatus: e.target.value }))
              }
              disabled={etaLocked}
              helperText={
                etaLocked
                  ? "Locked"
                  : hasEtaStatus
                    ? "Earlier steps are disabled."
                    : ""
              }
              fullWidth
            >
              <MenuItem value="Available" disabled={hasEtaStatus}>
                None (Available)
              </MenuItem>
              {etaLocked && !jobStatusOptions.includes(currentEtaStatus) && (
                <MenuItem value={currentEtaStatus}>{currentEtaStatus}</MenuItem>
              )}
              {jobStatusOptions.map((s) => (
                <MenuItem
                  key={s}
                  value={s}
                  disabled={isEtaStatusBackward(currentEtaStatus, s)}
                >
                  {s}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="ETA"
              type="date"
              size="small"
              value={tempData.eta || ""}
              onChange={(e) =>
                setTempData((p) => ({ ...p, eta: e.target.value }))
              }
              disabled={etaDateDisabled}
              error={etaInvalid}
              helperText={etaHelper}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: limits.min, max: limits.max }}
              InputProps={{
                startAdornment: (
                  <EventOutlinedIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "text.secondary" }}
                  />
                ),
              }}
              fullWidth
            />
            {container.eta && (
              <Typography variant="caption" color="text.secondary">
                Current ETA: <b>{fmt(container.eta)}</b>
              </Typography>
            )}
          </Box>
        </Section>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ textTransform: "none", color: TEAL }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSave(container.cid)}
          disabled={!canSave}
          sx={{
            textTransform: "none",
            px: 3,
            borderRadius: 2,
            bgcolor: ORANGE,
            "&:hover": { bgcolor: "#d86f12" },
          }}
          startIcon={
            saving ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContainerQuickUpdateModal;
