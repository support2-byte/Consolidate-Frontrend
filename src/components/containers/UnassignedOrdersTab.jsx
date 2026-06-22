import React from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
} from "@mui/material";
import { UNASSIGNED_TABLE_HEADERS } from "../../constants/containers";
import { DownloadIcon } from "lucide-react";

const UnassignedOrdersTab = ({
  unassignedOrders,
  loadingUnassigned,
  generatingPDF,
  onGenerateManifest,
}) => {
  if (loadingUnassigned) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 1 }}>
          Loading unassigned orders...
        </Typography>
      </Box>
    );
  }

  if (!unassignedOrders.length) {
    return (
      <Typography
        variant="body2"
        align="center"
        sx={{ py: 4, color: "text.secondary" }}
      >
        No orders without a consignment found for this container.
      </Typography>
    );
  }

  return (
    <Box>
      {/* Summary banner with generate button */}
      <Box
        sx={{
          mb: 2,
          px: 2,
          py: 1,
          borderRadius: 2,
          bgcolor: "#fff8f0",
          border: "1px solid #ffe0b2",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: "#e65100", fontWeight: 600 }}>
          {unassignedOrders.length} assignment event
          {unassignedOrders.length !== 1 ? "s" : ""} with no consignment linked
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={
            generatingPDF ? <CircularProgress size={14} /> : <DownloadIcon />
          }
          onClick={onGenerateManifest}
          disabled={generatingPDF}
          sx={{
            borderColor: "#e65100",
            color: "#e65100",
            fontSize: 12,
            py: 0.4,
            px: 1.5,
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: "#fff3e0", borderColor: "#e65100" },
          }}
        >
          {generatingPDF ? "Generating..." : "Generate Manifest"}
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 1, borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#e65100" }}>
              {UNASSIGNED_TABLE_HEADERS.map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    bgcolor: "#e65100",
                    color: "#fff",
                    fontWeight: 600,
                    py: 1,
                    borderBottom: "none",
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {unassignedOrders.map((event, idx) => (
              <TableRow
                key={`unassigned-${idx}`}
                sx={{
                  bgcolor: idx % 2 === 0 ? "#fff8f0" : "white",
                  "&:hover": { bgcolor: "#ffe0b2" },
                }}
              >
                <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                  {idx + 1}
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>
                  {event.eventTime || "—"}
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 500, color: "#0d6c6a", fontSize: 13 }}
                >
                  {event.bookingRef || event.orderId || "N/A"}
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>
                  {event.formNo || "N/A"}
                </TableCell>
                <TableCell sx={{ fontSize: 13, maxWidth: 200 }}>
                  {event.eventSummary || "N/A"}
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>
                  {event.assignedQty ?? "—"}
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>
                  {event.assignedWeightKg != null
                    ? `${event.assignedWeightKg} KG`
                    : "—"}
                </TableCell>
                <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                  {event.changedBy || "System"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={event.actionType || event.eventType}
                    size="small"
                    sx={{
                      fontSize: 11,
                      height: 20,
                      bgcolor: "#fff3e0",
                      color: "#e65100",
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UnassignedOrdersTab;
