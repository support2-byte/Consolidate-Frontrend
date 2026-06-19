import React from "react";
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Button,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  Box,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EditNoteIcon from "@mui/icons-material/EditNote";
import HistoryIcon from "@mui/icons-material/History";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import {
  CONTAINER_STATUS_OPTIONS,
  LOCATION_OPTIONS,
  STATUS_COLOR_MAP,
} from "../../constants/containers";

const ContainerTableRow = ({
  container,
  index,
  isEditingRow,
  tempData,
  setTempData,
  jobStatusOptions,
  loadingUpdate,
  loadingHistory,
  loadingReturned,
  onQuickEdit,
  onQuickSave,
  onQuickCancel,
  onEdit,
  onOpenHistory,
  onMarkReturned,
}) => {
  const currentStatus = isEditingRow
    ? tempData.status
    : container.current_status || "N/A";
  const currentLocation = isEditingRow
    ? tempData.location
    : container.location || "N/A";
  const currentJobStatus = isEditingRow
    ? tempData.jobStatus
    : container.assignment_status || "N/A";

  return (
    <TableRow
      sx={{
        bgcolor: index % 2 === 0 ? "#f9f9f9" : "white",
        "&:hover": { bgcolor: "#e3f2fd" },
      }}
    >
      <TableCell
        sx={{
          cursor: "pointer",
          color: "#0d6c6a",
          "&:hover": { textDecoration: "underline" },
        }}
        onClick={() => onOpenHistory(container.cid, container.container_number)}
      >
        {container.container_number || "N/A"}
      </TableCell>

      <TableCell>{container.container_size || "N/A"}</TableCell>
      <TableCell>{container.container_type || "N/A"}</TableCell>

      <TableCell>
        <Chip
          label={container.owner_type === "soc" ? "Own" : "Hired"}
          color={container.owner_type === "soc" ? "success" : "info"}
          size="small"
          sx={{ fontWeight: "bold" }}
        />
      </TableCell>

      {/* Status (editable) */}
      <TableCell>
        {isEditingRow ? (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={currentStatus}
              onChange={(e) =>
                setTempData((p) => ({ ...p, status: e.target.value }))
              }
              displayEmpty
            >
              {CONTAINER_STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Chip
            label={currentStatus}
            color={STATUS_COLOR_MAP[currentStatus] || "default"}
            size="small"
            sx={{ fontWeight: "bold" }}
          />
        )}
      </TableCell>

      {/* ETA Status (editable) */}
      <TableCell>
        {isEditingRow ? (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={currentJobStatus === "N/A" ? "" : currentJobStatus}
              onChange={(e) =>
                setTempData((p) => ({ ...p, jobStatus: e.target.value }))
              }
              displayEmpty
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {jobStatusOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Chip
            label={currentJobStatus}
            size="small"
            variant="outlined"
            sx={{ fontWeight: "bold" }}
          />
        )}
      </TableCell>

      {/* Location (editable) */}
      <TableCell>
        {isEditingRow ? (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={currentLocation}
              onChange={(e) =>
                setTempData((p) => ({ ...p, location: e.target.value }))
              }
            >
              {LOCATION_OPTIONS.map((l) => (
                <MenuItem key={l.value} value={l.value}>
                  {l.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          currentLocation
        )}
      </TableCell>

      <TableCell>{container.consignment_number || "N/A"}</TableCell>
      <TableCell>
        {container.created_time
          ? new Date(container.created_time).toLocaleDateString()
          : "–"}
      </TableCell>

      {/* Actions */}
      <TableCell>
        {isEditingRow ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Save">
              <IconButton
                onClick={() => onQuickSave(container.cid)}
                disabled={loadingUpdate}
                size="small"
              >
                {loadingUpdate ? <CircularProgress size={16} /> : <SaveIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton onClick={onQuickCancel} size="small">
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <>
            <Tooltip title="Quick Update Status & Location">
              <IconButton
                onClick={() => onQuickEdit(container)}
                sx={{ color: "#0d6c6a" }}
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Container Details">
              <IconButton
                onClick={() => onEdit(container)}
                sx={{ color: "#f58220" }}
                size="small"
              >
                <EditNoteIcon fontSize="large" />
              </IconButton>
            </Tooltip>
            <Tooltip title="View History">
              <IconButton
                onClick={() =>
                  onOpenHistory(container.cid, container.container_number)
                }
                sx={{ color: "#0d6c6a" }}
                disabled={loadingHistory}
              >
                {loadingHistory ? (
                  <CircularProgress size={16} />
                ) : (
                  <HistoryIcon />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                container.derived_status !== "Cleared"
                  ? "Container must be Cleared to mark Returned"
                  : "Mark as Returned"
              }
            >
              <span>
                <Button
                  disabled={
                    container.derived_status !== "Cleared" ||
                    loadingReturned[container.cid]
                  }
                  onClick={() => onMarkReturned(container.cid)}
                  size="small"
                  startIcon={
                    loadingReturned[container.cid] ? (
                      <CircularProgress size={16} />
                    ) : null
                  }
                  sx={{ textTransform: "none", color: "#0d6c6a" }}
                >
                  Mark Returned
                </Button>
              </span>
            </Tooltip>
          </>
        )}
      </TableCell>
    </TableRow>
  );
};

export default ContainerTableRow;
