import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Paper,
  TableBody,
} from "@mui/material";
import { DownloadIcon } from "lucide-react";
import { HISTORY_TABLE_HEADERS } from "../../constants/containers";

export const ConsignmentCard = ({
  consignment,
  groupIndex,
  getPlaceName,
  selectedContainerNo,
  generatingPDF,
  onSinglePDF,
  onDetailManifest,
}) => {
  const filteredOrders = consignment.orders || [];
  if (!filteredOrders.length) return null;

  const firstEvent = filteredOrders[0];
  const jobNo =
    consignment.consignmentNo ||
    firstEvent?.bookingRef ||
    `Consignment ${groupIndex + 1}`;
  const pol = firstEvent.pol || "N/A";
  const pod = firstEvent.pod || "N/A";
  const linkedOrders = firstEvent.linkedOrders || "N/A";

  const sortedEvents = [...consignment.orders].sort(
    (a, b) => new Date(b.eventTime) - new Date(a.eventTime),
  );
  const earliestEvent =
    [...consignment.orders].sort(
      (a, b) => new Date(a.eventTime) - new Date(b.eventTime),
    )[0] || {};

  return (
    <Box
      sx={{
        mb: 2,
        border: "0.5px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          borderBottom: "0.5px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", minWidth: 20, fontWeight: 500 }}
        >
          {groupIndex + 1}.
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: "#e6f4f3",
            color: "#0d6c6a",
            fontSize: 16,
            fontWeight: "bold",
            px: 1.5,
            py: 0.4,
            borderRadius: 10,
            whiteSpace: "nowrap",
          }}
        >
          Consignment:{" "}
          {firstEvent.consignmentNo || consignment.consignmentNo || "N/A"}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            py: 0.5,
            px: 1,
            bgcolor: "lightBlue",
            borderRadius: 4,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "text.primary", fontSize: 13 }}
          >
            Date: {firstEvent.loadedAt || earliestEvent.startDate || "N/A"}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{ fontSize: 14, color: "text.secondary" }}
        >
          <Box
            component="span"
            sx={{
              fontWeight: "bold",
              color: "text.primary",
              py: 0.5,
              px: 1,
              bgcolor: "#99A1FF",
              borderRadius: 4,
            }}
          >
            Trip: {getPlaceName(pol)} &rarr; {getPlaceName(pod)}
          </Box>
        </Typography>

        <Chip
          label={`Status: ${firstEvent.consignmentStatus || "N/A"}`}
          size="small"
          sx={{
            bgcolor: "#e8f5e9",
            color: "#2e7d32",
            fontWeight: 600,
            height: 24,
            ml: 1,
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
          <Chip
            label={`Events: ${consignment.orders.length}`}
            size="small"
            sx={{
              bgcolor: "#e6f4f3",
              color: "#0d6c6a",
              fontSize: 11,
              height: 22,
            }}
          />

          <Tooltip title="Download job summary">
            <IconButton
              size="small"
              disabled={generatingPDF}
              onClick={() =>
                onSinglePDF(
                  consignment.orders,
                  selectedContainerNo,
                  jobNo,
                  pol,
                  pod,
                  linkedOrders,
                  earliestEvent.eventTime || "N/A",
                )
              }
              sx={{
                border: "0.5px solid",
                borderColor: "divider",
                borderRadius: 1,
                p: 0.6,
                color: "#0d6c6a",
              }}
            >
              {generatingPDF ? (
                <CircularProgress size={16} />
              ) : (
                <DownloadIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Print detailed manifest">
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              disabled={generatingPDF}
              onClick={() => {
                const consignmentDate = earliestEvent.eventTime
                  ? new Date(earliestEvent.eventTime).toLocaleDateString(
                      "en-GB",
                    )
                  : "N/A";
                onDetailManifest(
                  jobNo,
                  pol,
                  pod,
                  linkedOrders,
                  consignment.orders,
                  consignment.consignmentNo || firstEvent.consignmentNo,
                  consignmentDate,
                );
              }}
              sx={{
                borderColor: "#f58220",
                color: "#f58220",
                fontSize: 12,
                py: 0.4,
                px: 1.5,
                "&:hover": { bgcolor: "#fff8f3", borderColor: "#f58220" },
              }}
            >
              Manifest
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 1, borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {HISTORY_TABLE_HEADERS.map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    bgcolor: "#0d6c6a",
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
            {sortedEvents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={HISTORY_TABLE_HEADERS.length}
                  align="center"
                  sx={{ py: 3, color: "text.secondary", fontSize: 13 }}
                >
                  No assignment events in this group
                </TableCell>
              </TableRow>
            ) : (
              sortedEvents.map((event, eventIndex) => (
                <TableRow
                  key={`${jobNo}-${event.eventTime}-${eventIndex}`}
                  sx={{
                    "&:last-child td": { border: 0 },
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <TableCell
                    sx={{ fontWeight: 500, color: "#0d6c6a", fontSize: 13 }}
                  >
                    {event.bookingRef || event.orderId || "N/A"}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {event.formNo || "N/A"}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
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
                  <TableCell sx={{ fontSize: 13 }}>
                    {event.loadedAt ?? "-- Proceeded via Batch --"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.eventType}
                      size="small"
                      sx={{
                        fontSize: 11,
                        height: 20,
                        bgcolor:
                          event.eventType === "ASSIGNMENT"
                            ? "#e6f4f3"
                            : "#e8f4ff",
                        color:
                          event.eventType === "ASSIGNMENT"
                            ? "#0d6c6a"
                            : "#1a5fa8",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
