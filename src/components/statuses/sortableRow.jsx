import {
  Box,
  TableCell,
  TableRow,
  IconButton,
  Switch,
  Chip,
  Tooltip,
} from "@mui/material";
import { DragIndicator, Edit, Delete } from "@mui/icons-material";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

const TEAL = "#1a7a6e";
const TEAL_LIGHT = "#e8f5f3";

export function SortableRow({ row, onEdit, onToggle, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  return (
    <TableRow
      ref={setNodeRef}
      hover
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: isDragging ? TEAL_LIGHT : "inherit",
      }}
    >
      <TableCell align="center" sx={{ width: 60 }}>
        <IconButton
          size="small"
          {...attributes}
          {...listeners}
          disableRipple
          sx={{ cursor: "grab", color: "#aaa" }}
        >
          <DragIndicator fontSize="small" />
        </IconButton>
      </TableCell>
      <TableCell align="center" sx={{ color: "#555", fontWeight: 500 }}>
        {row.sorting_number}
      </TableCell>
      <TableCell sx={{ fontWeight: 500 }}>{row.order_status}</TableCell>
      <TableCell>
        {row.container_status ?? <span style={{ color: "#bbb" }}>—</span>}
      </TableCell>
      <TableCell>
        {row.consignment_status ?? <span style={{ color: "#bbb" }}>—</span>}
      </TableCell>
      <TableCell>
        <Chip
          label={row.status ? "Active" : "Inactive"}
          size="small"
          sx={{
            bgcolor: row.status ? "#e8f5e9" : "#f5f5f5",
            color: row.status ? "#2e7d32" : "#9e9e9e",
            fontWeight: 600,
            fontSize: 12,
            border: "none",
          }}
        />
      </TableCell>
      <TableCell sx={{ color: "#888" }}>{row.days_offset}</TableCell>
      <TableCell align="right">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            justifyContent: "flex-end",
          }}
        >
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => onEdit(row)}
              sx={{ color: TEAL, "&:hover": { bgcolor: TEAL_LIGHT } }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete(row)}
              sx={{ color: "#d32f2f", "&:hover": { bgcolor: "#fdecea" } }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.status ? "Disable" : "Enable"}>
            <Switch
              checked={row.status}
              onChange={() => onToggle(row)}
              size="small"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: TEAL },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  bgcolor: TEAL,
                },
              }}
            />
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
}
