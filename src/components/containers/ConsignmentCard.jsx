import { Fragment, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { DownloadIcon } from "lucide-react";
import { HISTORY_TABLE_HEADERS } from "../../constants/containers";

const headSx = {
  bgcolor: "#0d6c6a",
  color: "#fff",
  fontWeight: 600,
  py: 1,
  borderBottom: "none",
};

const ORDER_HEADERS = [
  "Booking Ref",
  "Form No",
  "Items",
  "Total Qty",
  "Total Weight",
  "Loaded At",
  "Actions",
];

export const ConsignmentCard = ({
  consignment,
  groupIndex,
  getPlaceName,
  selectedContainerNo,
  generatingPDF,
  onSinglePDF,
  onDetailManifest,
}) => {
  const [open, setOpen] = useState(false);
  const [openOrders, setOpenOrders] = useState({});

  const allEvents = consignment.orders || [];

  const events = useMemo(() => {
    const seen = new Set();
    return allEvents.filter((e) => {
      if (seen.has(e.detailId)) return false;
      seen.add(e.detailId);
      return e.actionType === "ASSIGN";
    });
  }, [consignment.orders]);

  const orderRows = useMemo(() => {
    const map = new Map();
    [...events].forEach((e) => {
      const key = e.orderId ?? e.bookingRef;
      if (!map.has(key)) {
        map.set(key, {
          key,
          bookingRef: e.bookingRef || e.orderId || "N/A",
          formNo: e.formNo || "N/A",
          qty: 0,
          weight: 0,
          loadedAt: e.loadedAt,
          events: [],
        });
      }
      const g = map.get(key);
      g.qty += Number(e.assignedQty) || 0;
      g.weight += Number(e.assignedWeightKg) || 0;
      g.events.push(e);
    });
    return [...map.values()];
  }, [events]);

  if (!events.length) return null;

  const firstEvent = allEvents[0];
  const jobNo =
    consignment.consignmentNo ||
    firstEvent.bookingRef ||
    `Consignment ${groupIndex + 1}`;
  const pol = firstEvent.pol || "N/A";
  const pod = firstEvent.pod || "N/A";
  const linkedOrders = firstEvent.linkedOrders || "N/A";
  const earliestEvent =
    [...allEvents].sort(
      (a, b) => new Date(a.eventTime) - new Date(b.eventTime),
    )[0] || {};
  const itemCount = new Set(events.map((e) => e.detailId)).size;

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ fontSize: 13 }}>{groupIndex + 1}</TableCell>
        <TableCell sx={{ fontWeight: 600, color: "#0d6c6a", fontSize: 13 }}>
          {consignment.consignmentNo || firstEvent.consignmentNo || "N/A"}
        </TableCell>
        <TableCell sx={{ fontSize: 13 }}>
          {firstEvent.loadedAt || earliestEvent.startDate || "N/A"}
        </TableCell>
        <TableCell sx={{ fontSize: 13 }}>{orderRows.length}</TableCell>
        <TableCell sx={{ fontSize: 13 }}>{itemCount}</TableCell>
        <TableCell sx={{ fontSize: 13 }}>
          {getPlaceName(pol)} &rarr; {getPlaceName(pod)}
        </TableCell>
        <TableCell>
          <Chip
            label={firstEvent.consignmentStatus || "N/A"}
            size="small"
            sx={{
              bgcolor: "#e8f5e9",
              color: "#2e7d32",
              fontWeight: 600,
              height: 24,
            }}
          />
        </TableCell>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setOpen((v) => !v)}
              sx={{
                borderColor: "#0d6c6a",
                color: "#0d6c6a",
                fontSize: 12,
                py: 0.4,
                px: 1.5,
                whiteSpace: "nowrap",
              }}
            >
              {open ? "Hide Orders" : "View Orders"}
            </Button>
            <Tooltip title="Download job summary">
              <span>
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
                    <DownloadIcon size={16} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Print detailed manifest">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon size={16} />}
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
              </span>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>

      {open && (
        <TableRow>
          <TableCell colSpan={8} sx={{ bgcolor: "#f8f9fa", p: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 600, color: "#0d6c6a" }}
            >
              Order Details ({orderRows.length})
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {ORDER_HEADERS.map((h) => (
                    <TableCell key={h} sx={headSx}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {orderRows.map((r) => (
                  <Fragment key={r.key}>
                    <TableRow hover sx={{ bgcolor: "background.paper" }}>
                      <TableCell
                        sx={{ fontWeight: 500, color: "#0d6c6a", fontSize: 13 }}
                      >
                        {r.bookingRef}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{r.formNo}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {new Set(r.events.map((e) => e.detailId)).size}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{r.qty}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {r.weight.toFixed(2)} KG
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {r.loadedAt ?? "-- Proceeded via Batch --"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            setOpenOrders((p) => ({ ...p, [r.key]: !p[r.key] }))
                          }
                          sx={{
                            borderColor: "#f58220",
                            color: "#f58220",
                            fontSize: 12,
                            py: 0.4,
                            px: 1.5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {openOrders[r.key] ? "Hide Items" : "View Items"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {openOrders[r.key] && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 2 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, fontWeight: 600, color: "#f58220" }}
                          >
                            Order Item Details ({r.events.length})
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {HISTORY_TABLE_HEADERS.map((h) => (
                                  <TableCell key={h} sx={headSx}>
                                    {h}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {r.events.map((event, i) => (
                                <TableRow
                                  key={`${event.detailId}-${i}`}
                                  hover
                                  sx={{ "&:last-child td": { border: 0 } }}
                                >
                                  <TableCell
                                    sx={{
                                      fontWeight: 500,
                                      color: "#0d6c6a",
                                      fontSize: 13,
                                    }}
                                  >
                                    {event.bookingRef || event.orderId || "N/A"}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: 13 }}>
                                    {event.formNo || "N/A"}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: 13 }}>
                                    {event.itemRef || "N/A"}
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
                                  <TableCell
                                    sx={{
                                      fontSize: 12,
                                      color: "text.secondary",
                                    }}
                                  >
                                    {event.changedBy || "System"}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: 13 }}>
                                    {event.loadedAt ??
                                      "-- Proceeded via Batch --"}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={event.eventType}
                                      size="small"
                                      sx={{
                                        fontSize: 11,
                                        height: 20,
                                        bgcolor: "#e6f4f3",
                                        color: "#0d6c6a",
                                      }}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
