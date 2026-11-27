import React from "react";
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import YoutubeSearchedForIcon from "@mui/icons-material/YoutubeSearchedFor";
import { TimerReset } from "lucide-react";
import { STATUS_COLOR_MAP } from "../../constants/containers";

const fmtDate = (v) =>
  v ? new Date(`${String(v).slice(0, 10)}T00:00:00`).toLocaleDateString() : "";

const ContainerTableRow = ({
  container,
  index,
  loadingHistory,
  onQuickEdit,
  onEdit,
  onOpenHistory,
}) => {
  const currentStatus = container.current_status || "N/A";
  const etaStatus = container.assignment_status || "N/A";

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

      <TableCell>
        <Chip
          label={currentStatus}
          color={STATUS_COLOR_MAP[currentStatus] || "default"}
          size="small"
          sx={{ fontWeight: "bold" }}
        />
      </TableCell>

      <TableCell>
        <Chip
          label={etaStatus}
          size="small"
          variant="outlined"
          sx={{ fontWeight: "bold" }}
        />
        {container.eta && (
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 0.5, color: "text.secondary" }}
          >
            ETA: {fmtDate(container.eta)}
          </Typography>
        )}
      </TableCell>

      <TableCell>{container.location || "N/A"}</TableCell>
      <TableCell>{container.consignment_number || "N/A"}</TableCell>
      <TableCell>
        {container.created_time
          ? new Date(container.created_time).toLocaleDateString()
          : "–"}
      </TableCell>

      <TableCell>
        <Tooltip title="Update Status, ETA & Location">
          <IconButton
            onClick={() => onQuickEdit(container)}
            sx={{ color: "#0d6c6a" }}
            size="small"
          >
            <TimerReset size={20} />
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
              <YoutubeSearchedForIcon />
            )}
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

export default ContainerTableRow;
