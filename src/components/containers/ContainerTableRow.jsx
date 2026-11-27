import React, { useState } from "react";
import dayjs from "dayjs";
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditNoteIcon from "@mui/icons-material/EditNote";
import YoutubeSearchedForIcon from "@mui/icons-material/YoutubeSearchedFor";
import UpdateIcon from "@mui/icons-material/Update";
import { STATUS_COLOR_MAP } from "../../constants/containers";

// 12-Dec-2026
const fmtDate = (v) => {
  if (!v) return "";
  const d = dayjs(/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? `${v}T00:00:00` : v);
  return d.isValid() ? d.format("DD-MMM-YYYY") : "";
};

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
  const [anchorEl, setAnchorEl] = useState(null);
  const closeMenu = () => setAnchorEl(null);

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
      </TableCell>

      <TableCell sx={{ whiteSpace: "nowrap" }}>
        {container.eta ? fmtDate(container.eta) : "–"}
      </TableCell>

      <TableCell>{container.location || "N/A"}</TableCell>
      <TableCell>{container.consignment_number || "N/A"}</TableCell>
      <TableCell>{fmtDate(container.created_time) || "–"}</TableCell>

      <TableCell align="center">
        <IconButton
          size="small"
          title="Actions"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem
            onClick={() => {
              closeMenu();
              onQuickEdit(container);
            }}
          >
            <ListItemIcon>
              <UpdateIcon fontSize="small" sx={{ color: "#0d6c6a" }} />
            </ListItemIcon>
            <ListItemText>Update Status, ETA &amp; Location</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              onEdit(container);
            }}
          >
            <ListItemIcon>
              <EditNoteIcon fontSize="small" sx={{ color: "#f58220" }} />
            </ListItemIcon>
            <ListItemText>Edit Container Details</ListItemText>
          </MenuItem>
          <MenuItem
            disabled={loadingHistory}
            onClick={() => {
              closeMenu();
              onOpenHistory(container.cid, container.container_number);
            }}
          >
            <ListItemIcon>
              {loadingHistory ? (
                <CircularProgress size={16} />
              ) : (
                <YoutubeSearchedForIcon
                  fontSize="small"
                  sx={{ color: "#0d6c6a" }}
                />
              )}
            </ListItemIcon>
            <ListItemText>View History</ListItemText>
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
};

export default ContainerTableRow;
