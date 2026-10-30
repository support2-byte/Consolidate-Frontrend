import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  IconButton,
} from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PhoneIcon from "@mui/icons-material/Phone";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DirectionsBoatFilledIcon from "@mui/icons-material/DirectionsBoatFilled";

import { api } from "../../api";
import ShipmentTimeline from "./shipmentTimeline";
import { useContext } from "react";
import { AppContext } from "../../context/AppContext";

const TrackingPage = () => {
  const { places, statuses } = useContext(AppContext);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [trackType, setTrackType] = useState("item_tracking");

  const EXCLUDED_TIMELINE_STATUSES = ["Rejected", "Canceled", "Cancelled"];

  const orderedStatuses = (statuses || [])
    .filter((s) => s.status)
    .filter((s) => !EXCLUDED_TIMELINE_STATUSES.includes(s.order_status))
    .sort((a, b) => a.sorting_number - b.sorting_number)
    .map((s) => s.order_status);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    setError("");
    setTrackingData(null);

    const reference = value.trim().toUpperCase();

    const typeToEndpoint = {
      item_tracking: "item",
      order_tracking: "order",
      rglBookingNo: "rgl",
      consignment_no: "consignment_no",
    };

    const endpoint = typeToEndpoint[trackType];
    if (!endpoint) {
      setError("Invalid tracking type");
      setLoading(false);
      return;
    }
    const url = `/api/orders/track/${endpoint}/${encodeURIComponent(reference)}`;

    try {
      const res = await api.get(url);
      let rawData = res.data?.data ?? res.data;
      let trackingDataToSet;

      if (trackType === "consignment_no") {
        if (!rawData?.orders?.length) {
          setError("No orders found for this consignment");
          setLoading(false);
          return;
        }

        trackingDataToSet = {
          consignment: rawData.consignment || {},
          orders: rawData.orders || [],
          summary: rawData.summary || {},
        };

        if (!trackingDataToSet.consignment?.number) {
          setError("Consignment number is missing in response");
          setLoading(false);
          return;
        }
      } else {
        const mainOrder = rawData.orders?.[0] || rawData;
        trackingDataToSet = {
          order_id: mainOrder.order_id || rawData.order_id || "—",

          tracking_id: mainOrder.tracking_id || rawData.tracking_id || null,

          booking_ref: mainOrder.booking_ref || rawData.booking_ref || "—",
          rgl_booking_number:
            mainOrder.rgl_booking_number || rawData.rgl_booking_number || "-",
          place_of_delivery:
            mainOrder.place_of_delivery || rawData.place_of_delivery || "",
          place_of_loading:
            mainOrder.place_of_loading || rawData.place_of_loading || "",

          created_at: mainOrder.created_at || rawData.created_at || "—",
          status: mainOrder.status || rawData.status || "In Process",
          overall_status:
            mainOrder.overall_status || rawData.overall_status || "In Process",
          eta:
            mainOrder.receivers?.[0]?.eta ||
            rawData.eta ||
            rawData.consignment?.eta ||
            "—",
          sender: mainOrder.sender_name || rawData.sender_name || null,
          sender_email: mainOrder.sender_email || rawData.sender_email || null,
          sender_contact:
            mainOrder.sender_contact || rawData.sender_contact || null,
          sender_name: mainOrder.sender_name || rawData.sender_name || null,
          transport_type:
            mainOrder.transport_type || rawData.transport_type || null,
          collection_scope:
            mainOrder.collection_scope || rawData.collection_scope || null,
          receivers: mainOrder.receivers || rawData.receivers || [],
          total_assigned_qty:
            mainOrder.total_assigned_qty || rawData.total_assigned_qty || 0,

          consignment: rawData.consignment
            ? {
                number: rawData.consignment.number,
                status: rawData.consignment.status,
                eta: rawData.consignment.eta,
                origin: rawData.consignment.origin,
                destination: rawData.consignment.destination,
                vessel: rawData.consignment.vessel,
                voyage: rawData.consignment.voyage,
                containers: rawData.consignment.containers,
              }
            : null,
        };
      }

      if (trackType === "consignment_no") {
        if (!trackingDataToSet.orders?.length) {
          setError("No valid orders found in consignment");
          setLoading(false);
          return;
        }
      } else {
        if (!trackingDataToSet.receivers?.length) {
          setError(
            "No receivers/tracking information found for this reference",
          );
          setLoading(false);
          return;
        }
      }

      setTrackingData(trackingDataToSet);
    } catch (err) {
      let msg = "Failed to load tracking details";
      if (err.response) {
        switch (err.response.status) {
          case 404:
            msg = "No shipment found for this reference";
            break;
          case 400:
            msg = err.response.data?.message || "Invalid reference format";
            break;
          case 500:
            msg = "Server error – please try again later";
            break;
          default:
            msg = err.response.data?.message || msg;
        }
      }
      setError(msg);
      console.error("Tracking error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isItemTrackingLayout = trackType === "item_tracking";
  const isOrderLayout = ["order_tracking", "rglBookingNo"].includes(trackType);
  const isConsignmentLayout = trackType === "consignment_no";

  const receiver = trackingData?.receivers?.[0];
  const item = receiver?.items?.[0];

  const currentStatus =
    receiver?.current_status ||
    receiver?.status ||
    trackingData?.status ||
    orderedStatuses[0];

  const currentStepIndex = orderedStatuses.indexOf(currentStatus);
  const completedSteps = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const progressPercent = (completedSteps / orderedStatuses.length) * 100;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa", pb: 8 }}>
      <Box
        sx={{
          backgroundColor: "#0d6c6a",
          color: "white",
          borderRadius: { xs: 0, md: 3 },
          p: { xs: 4, md: 6 },
          mb: 6,
          height: 300,
          textAlign: "center",
        }}
      >
        <Typography variant="h3" fontWeight={800} sx={{ mt: 2 }}>
          Track Shipment
        </Typography>

        <Paper sx={{ p: 3, maxWidth: 800, mx: "auto", borderRadius: 3, mt: 4 }}>
          <form onSubmit={handleSearch}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
            >
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Track by</InputLabel>
                <Select
                  value={trackType}
                  label="Track by"
                  color="#000"
                  onChange={(e) => setTrackType(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="item_tracking">Item Tracking ID</MenuItem>
                  <MenuItem value="order_tracking">Order Tracking ID</MenuItem>
                  <MenuItem value="rglBookingNo">Form No</MenuItem>
                  <MenuItem value="consignment_no">Consignment No</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                placeholder={
                  trackType === "item_tracking"
                    ? "e.g. RGSL-ORD-K7M4PX"
                    : trackType === "order_tracking"
                      ? "e.g. RGSL-ORD-XWS2LMV2"
                      : trackType === "consignment_no"
                        ? "e.g. 24xxxx"
                        : "e.g. 24xxxx"
                }
                value={value}
                onChange={(e) => setValue(e.target.value.trim())}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: "action.active", mr: 1 }} />
                  ),
                }}
                disabled={loading}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading || !value.trim()}
                sx={{
                  minWidth: 140,
                  py: 2.5,
                  color: "#fff",
                  fontWeight: "bold",
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Track"
                )}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>

      {loading && (
        <Box sx={{ textAlign: "center", mt: 10 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            Searching shipment...
          </Typography>
        </Box>
      )}

      {error && !loading && (
        <Alert severity="error" sx={{ maxWidth: 700, mx: "auto", mt: 5 }}>
          {error}
        </Alert>
      )}

      {!trackingData && !loading && !error && (
        <Box sx={{ textAlign: "center", mt: 10, color: "text.secondary" }}>
          <Typography variant="h6">
            Enter your reference number above to track your shipment
          </Typography>
        </Box>
      )}

      {trackingData && !loading && (
        <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 4 } }}>
          {isItemTrackingLayout && (
            <ItemRefLayout
              trackingData={trackingData}
              progressPercent={progressPercent}
              currentStatus={currentStatus}
              timelineSteps={orderedStatuses}
              places={places}
            />
          )}
          {isOrderLayout && (
            <OrderDetailedLayout
              trackingData={trackingData}
              timelineSteps={orderedStatuses}
            />
          )}
          {isConsignmentLayout && (
            <ConsignmentLayout trackingData={trackingData} />
          )}
        </Box>
      )}
    </Box>
  );
};

const ItemRefLayout = ({ trackingData, places, timelineSteps }) => {
  const receiver = trackingData.receivers?.[0] || {};
  const item = receiver.items?.[0] || {};

  const pol = trackingData.place_of_loading;
  const pod = trackingData.place_of_delivery;

  const currentStatus = receiver.status || timelineSteps[0];

  let currentIndex = timelineSteps.indexOf(currentStatus);

  if (currentIndex === -1) currentIndex = 0;

  const progressPercent = Math.round(
    ((currentIndex + 1) / timelineSteps.length) * 100,
  );

  const history = (receiver.status_history || [])
    .filter((h) => h.status)
    .map((h) => ({
      status: h.status,
      time: new Date(h.time).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      notes: h.notes?.trim() || "",
    }));

  const hasIssue = history.some(
    (h) =>
      h.notes?.toLowerCase().includes("reverse") ||
      h.notes?.toLowerCase().includes("issue"),
  );

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Box sx={{ textAlign: "center", m: 5 }}>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            color: "#0d6c6a",
            letterSpacing: "-0.5px",
            display: "block",
            mt: 3,
          }}
        >
          Track Shipment
        </Typography>

        <Typography variant="subtitle1" color="text.secondary">
          Last updated on: {new Date().toLocaleDateString("en-GB")}{" "}
        </Typography>
      </Box>

      <Paper
        elevation={4}
        sx={{
          p: { xs: 5, md: 6 },
          borderRadius: 3,
          backgroundColor: "#0d6c6a",
          mb: 5,
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        {/* Route */}
        <Typography
          variant="h5"
          fontWeight={700}
          align="center"
          sx={{
            mb: 3,
            color: "#fff",
            letterSpacing: "1px",
          }}
        >
          {pol} → {pod}
        </Typography>

        {/* Info Chips */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
          flexWrap="nowrap"
          sx={{ mb: 5 }}
        >
          <Chip
            label={
              <Box sx={{ textAlign: "center", py: 1, color: "#fff" }}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "#000",
                    fontWeight: "bold",
                  }}
                >
                  TRACKING ID
                </Typography>

                <Typography variant="body1" color="#000" fontWeight={600}>
                  {item.tracking_id || "—"}
                </Typography>
              </Box>
            }
            variant="filled"
            sx={{ background: "#fff", width: 310, height: "auto", py: 1.5 }}
          />

          <Chip
            label={
              <Box sx={{ textAlign: "center", py: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.75rem", fontWeight: "bold" }}
                >
                  Booking Ref
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {trackingData.booking_ref || "—"}
                </Typography>
              </Box>
            }
            variant="outlined"
            sx={{ width: 180, background: "#fff", height: "auto", py: 1.5 }}
          />

          <Chip
            label={
              <Box sx={{ textAlign: "center", py: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.75rem", fontWeight: "bold" }}
                >
                  QUANTITY
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {item.total_number?.toLocaleString() || 0} Packages
                </Typography>
              </Box>
            }
            variant="outlined"
            sx={{ width: 180, background: "#fff", height: "auto", py: 1.5 }}
          />

          <Chip
            label={
              <Box sx={{ textAlign: "center", py: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.75rem", fontWeight: "bold" }}
                >
                  WEIGHT
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {item.weight || 0} KG
                </Typography>
              </Box>
            }
            variant="outlined"
            sx={{ width: 180, background: "#fff", height: "auto", py: 1.5 }}
          />

          <Chip
            label={
              <Box sx={{ textAlign: "center", py: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.75rem", fontWeight: "bold" }}
                >
                  ETA
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {receiver.eta
                    ? new Date(receiver.eta).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </Typography>
              </Box>
            }
            variant="outlined"
            sx={{ width: 180, background: "#fff", height: "auto", py: 1.5 }}
          />
        </Stack>

        <Box sx={{ position: "relative", my: 3 }}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 8,
              bgcolor: "#e0e0e0",
              borderRadius: 4,
              transform: "translateY(-50%)",
              marginBottom: 5,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: 0,
              height: 8,
              background: "linear-gradient(90deg, #16a34a 0%, #f58220 100%)",
              borderRadius: 4,
              transform: "translateY(-50%)",
              width: `${progressPercent}%`,
              transition: "width 0.8s ease",
              marginBottom: 5,
            }}
          />

          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{
              position: "relative",
              zIndex: 1,
              pt: 1,
              mt: 2,
            }}
          >
            {timelineSteps.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <Box key={step} sx={{ textAlign: "center", flex: 1 }}>
                  {isCurrent ? (
                    <Box sx={{ position: "relative" }}>
                      <RadioButtonCheckedIcon
                        sx={{ color: "#f58220", fontSize: 30, mb: 1 }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          top: -2,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          bgcolor: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "3px solid #f58220",
                          zIndex: 3,

                          boxShadow: "0 4px 14px rgba(245, 130, 32, 0.35)",

                          "&::before": {
                            content: '""',
                            position: "absolute",
                            inset: -3,
                            borderRadius: "50%",
                            border: "2px solid #f58220",
                            animation: "shipPulse 2s ease-out infinite",
                          },

                          "@keyframes shipPulse": {
                            "0%": {
                              transform: "scale(1)",
                              opacity: 0.7,
                            },
                            "70%": {
                              transform: "scale(1.55)",
                              opacity: 0,
                            },
                            "100%": {
                              transform: "scale(1.55)",
                              opacity: 0,
                            },
                          },

                          "@keyframes shipFloat": {
                            "0%, 100%": {
                              transform: "translateY(0)",
                            },
                            "50%": {
                              transform: "translateY(-3px)",
                            },
                          },
                        }}
                      >
                        <DirectionsBoatFilledIcon
                          sx={{
                            fontSize: 23,
                            color: "#0d6c6a",
                            animation: "shipFloat 2.2s ease-in-out infinite",
                          }}
                        />
                      </Box>
                    </Box>
                  ) : isCompleted ? (
                    <CheckCircleIcon
                      sx={{ color: "#16a34a", fontSize: 30, mb: 1 }}
                    />
                  ) : (
                    <RadioButtonUncheckedIcon
                      sx={{ color: "#bdbdbd", fontSize: 30, mb: 1 }}
                    />
                  )}

                  <Typography
                    variant="body2"
                    fontWeight={isCurrent ? 800 : isCompleted ? 600 : 400}
                    color={
                      isCurrent
                        ? "#FF8A00"
                        : isCompleted
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.65)"
                    }
                    sx={{ fontSize: "14px", mt: 5 }}
                  >
                    {step}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Typography
          variant="h6"
          fontWeight={600}
          color="#fff"
          textAlign={"center"}
          sx={{ mt: 3, mb: 2 }}
        >
          {currentStatus === "Shipment Delivered"
            ? "Shipment Delivered Successfully!"
            : `Your order is being prepared for ${currentStatus.toLowerCase()}.`}
        </Typography>

        {hasIssue && (
          <Paper
            sx={{
              p: 3,
              mt: 3,
              bgcolor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <Typography variant="body1" color="amber.800" fontWeight={500}>
              Due to an issue, we had to reverse the status. We apologize for
              any inconvenience.
            </Typography>
          </Paper>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={<NotificationsIcon />}
          sx={{
            mt: 4,
            bgcolor: "#f58220",
            "&:hover": { bgcolor: "#e66918" },
            px: 8,
            py: 1.8,
            fontSize: "16px",
            color: "#fff",
            borderRadius: 50,
            margin: "0 auto",
            display: "flex",
          }}
        >
          Notify Me
        </Button>
      </Paper>

      {history.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
            bgcolor: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 35px rgba(0,0,0,0.06)",

            "@keyframes historyPulse": {
              "0%": {
                transform: "scale(1)",
                opacity: 0.65,
              },
              "70%": {
                transform: "scale(1.8)",
                opacity: 0,
              },
              "100%": {
                transform: "scale(1.8)",
                opacity: 0,
              },
            },

            "@keyframes historyFloat": {
              "0%, 100%": {
                transform: "translateY(0)",
              },
              "50%": {
                transform: "translateY(-2px)",
              },
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 4,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{ color: "#0d6c6a" }}
              >
                Shipment Status History
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Follow your shipment's journey
              </Typography>
            </Box>

            <Chip
              label="Live Tracking"
              size="small"
              sx={{
                bgcolor: "rgba(22,163,74,0.10)",
                color: "#16a34a",
                fontWeight: 700,
                border: "1px solid rgba(22,163,74,0.25)",
              }}
            />
          </Box>

          <Box sx={{ position: "relative" }}>
            <Box
              sx={{
                position: "absolute",
                left: 17,
                top: 20,
                bottom: 20,
                width: 3,
                bgcolor: "#e2e8f0",
                borderRadius: 10,
              }}
            />

            {history.map((entry, idx) => {
              const isCurrent = idx === 0;
              const isLast = idx === history.length - 1;

              return (
                <Box
                  key={idx}
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 3,
                    pb: isLast ? 0 : 4,
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                    }}
                  >
                    {isCurrent ? (
                      <Box
                        sx={{
                          position: "relative",
                          width: 35,
                          height: 35,
                          borderRadius: "50%",
                          bgcolor: "#fff",
                          border: "3px solid #f58220",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 14px rgba(245,130,32,0.30)",

                          "&::before": {
                            content: '""',
                            position: "absolute",
                            inset: -4,
                            borderRadius: "50%",
                            border: "2px solid #f58220",
                            animation: "historyPulse 2s ease-out infinite",
                          },
                        }}
                      >
                        <DirectionsBoatFilledIcon
                          sx={{
                            fontSize: 20,
                            color: "#0d6c6a",
                            animation: "historyFloat 2.2s ease-in-out infinite",
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          bgcolor: "#16a34a",
                          border: "4px solid #fff",
                          boxShadow: "0 0 0 2px rgba(22,163,74,0.20)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircleIcon
                          sx={{
                            fontSize: 14,
                            color: "#fff",
                          }}
                        />
                      </Box>
                    )}
                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      mt: 0,
                      borderRadius: 3,

                      bgcolor: isCurrent
                        ? "rgba(245,130,32,0.06)"
                        : "transparent",

                      border: isCurrent
                        ? "1px solid rgba(245,130,32,0.20)"
                        : "1px solid transparent",

                      transition: "all 0.25s ease",

                      "&:hover": {
                        bgcolor: isCurrent
                          ? "rgba(245,130,32,0.09)"
                          : "#f8fafc",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: {
                          xs: "flex-start",
                          sm: "center",
                        },
                        justifyContent: "space-between",
                        flexDirection: {
                          xs: "column",
                          sm: "row",
                        },
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{
                            color: isCurrent ? "#f58220" : "#1e293b",
                          }}
                        >
                          {entry.status}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.4 }}
                        >
                          {entry.time}
                        </Typography>
                      </Box>

                      {isCurrent && (
                        <Chip
                          label="Current"
                          size="small"
                          sx={{
                            bgcolor: "#f58220",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* ETA */}
          {receiver.eta && (
            <Box
              sx={{
                mt: 5,
                p: 2.5,
                borderRadius: 3,
                bgcolor: "rgba(13,108,106,0.06)",
                border: "1px solid rgba(13,108,106,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Expected Arrival
              </Typography>

              <Typography
                variant="body1"
                fontWeight={700}
                sx={{ color: "#0d6c6a" }}
              >
                {new Date(receiver.eta).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      <Paper
        elevation={4}
        sx={{
          mt: 8,
          p: { xs: 4, md: 6 },
          textAlign: "center",
          borderRadius: 4,
          background: "linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)",
          color: "white",
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Need to Schedule Pickup or Delivery?
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: "auto" }}
        >
          Contact our team for assistance with scheduling, updates, or any
          questions.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<PhoneIcon />}
          sx={{
            px: 6,
            py: 1.8,
            fontSize: "1.1rem",
            color: "#fff",
            fontWeight: 600,
            borderRadius: 50,
          }}
        >
          Call Now: +971 555 658321
        </Button>
      </Paper>
    </Box>
  );
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const ReceiverProgress = ({ steps, currentIndex }) => (
  <Box sx={{ overflowX: "auto", py: 2 }}>
    <Stack direction="row" sx={{ minWidth: steps.length * 110 }}>
      {steps.map((step, idx) => {
        const done = idx < currentIndex;
        const current = idx === currentIndex;
        return (
          <Box
            key={step}
            sx={{ flex: 1, textAlign: "center", position: "relative" }}
          >
            {idx > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  left: "-50%",
                  width: "100%",
                  height: 4,
                  bgcolor: idx <= currentIndex ? "#16a34a" : "#e0e0e0",
                  zIndex: 0,
                }}
              />
            )}
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                bgcolor: "#fff",
                display: "inline-flex",
                borderRadius: "50%",
              }}
            >
              {done ? (
                <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 30 }} />
              ) : current ? (
                <RadioButtonCheckedIcon
                  sx={{ color: "#f58220", fontSize: 30 }}
                />
              ) : (
                <RadioButtonUncheckedIcon
                  sx={{ color: "#bdbdbd", fontSize: 30 }}
                />
              )}
            </Box>
            <Typography
              variant="caption"
              display="block"
              sx={{
                mt: 0.5,
                px: 0.5,
                fontWeight: current ? 700 : 400,
                color: current
                  ? "#f58220"
                  : done
                    ? "#16a34a"
                    : "text.secondary",
              }}
            >
              {step}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  </Box>
);

const ItemRow = ({ item }) => {
  const [open, setOpen] = useState(false);
  const containers = (item.containerDetails || []).filter(
    (c) =>
      c.container?.container_number &&
      c.container.container_number !== "Unknown",
  );
  const history = item.status_history || [];

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ width: 40 }}>
          <IconButton size="small" onClick={() => setOpen((o) => !o)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{item.trackingId || "—"}</TableCell>
        <TableCell>
          {item.category}
          {item.subcategory && ` • ${item.subcategory}`}
          {item.type && ` (${item.type})`}
        </TableCell>
        <TableCell align="right">
          {Number(item.totalNumber || 0).toLocaleString()}
        </TableCell>
        <TableCell align="right">
          {Number(item.weight || 0).toLocaleString()} kg
        </TableCell>
        <TableCell>
          <Chip
            label={item.status || "Created"}
            size="small"
            sx={{ bgcolor: "#f58220", color: "#fff", fontWeight: 600 }}
          />
        </TableCell>
        <TableCell>{fmtDate(item.eta)}</TableCell>
        <TableCell>
          {containers.length ? (
            containers.map((c, i) => (
              <Typography key={i} variant="body2">
                {c.container.container_number}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  {" "}
                  • {Number(c.assign_total_box || 0).toLocaleString()} pkgs
                </Typography>
              </Typography>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              Not Assigned
            </Typography>
          )}
        </TableCell>
        <TableCell>
          {(item.consignments || []).length
            ? item.consignments.map((c, i) => (
                <Typography key={i} variant="body2">
                  {c.number}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    {" "}
                    • {c.status || "—"}
                  </Typography>
                </Typography>
              ))
            : "—"}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, border: open ? undefined : 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, pl: 6 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Tracking history
              </Typography>
              {history.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tracking updates yet.
                </Typography>
              ) : (
                history.map((h, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 2, mb: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        mt: 0.7,
                        bgcolor: i === 0 ? "#16a34a" : "#f58220",
                        flexShrink: 0,
                      }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {h.status}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fmtDateTime(h.time)}
                        {h.container_number && ` • ${h.container_number}`}
                        {h.consignment_number && ` • ${h.consignment_number}`}
                        {h.eta && ` • ETA ${fmtDate(h.eta)}`}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const OrderDetailedLayout = ({ trackingData, timelineSteps = [] }) => {
  const {
    tracking_id,
    booking_ref,
    rgl_booking_number,
    created_at,
    receivers = [],
  } = trackingData;

  const senderName = trackingData.sender_name || trackingData.sender || "—";
  const finalStep = timelineSteps[timelineSteps.length - 1];
  const rankOf = (status) => Math.max(timelineSteps.indexOf(status), 0);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", px: 2 }}>
      {/* Order header */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 4, md: 5 },
          mb: 6,
          borderRadius: 3,
          background: "linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Tracking ID: {tracking_id || "—"}
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          justifyContent="center"
          sx={{ mt: 2, opacity: 0.95 }}
        >
          <Typography>
            Form No: <strong>{rgl_booking_number || "—"}</strong>
          </Typography>
          <Typography>
            Sender: <strong>{senderName}</strong>
          </Typography>
          <Typography>
            Created: <strong>{fmtDate(created_at)}</strong>
          </Typography>
          {trackingData.transport_type && (
            <Typography>
              Mode: <strong>{trackingData.transport_type}</strong>
            </Typography>
          )}
        </Stack>
      </Paper>

      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ mb: 3, textAlign: "center" }}
      >
        Delivery Destinations ({receivers.length})
      </Typography>

      {receivers.map((receiver, idx) => {
        const items = receiver.shippingDetails || [];

        const leastItem = items.reduce(
          (min, it) =>
            !min || rankOf(it.status) < rankOf(min.status) ? it : min,
          null,
        );
        const currentIndex = leastItem ? rankOf(leastItem.status) : 0;
        const deliveredCount = items.filter(
          (i) => i.status === finalStep,
        ).length;

        return (
          <Accordion
            key={receiver.id}
            defaultExpanded={idx === 0}
            sx={{
              mb: 2,
              borderRadius: 2,
              overflow: "hidden",
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}
              sx={{
                color: "#fff",
                background: "linear-gradient(135deg, #1b263b 0%, #0d6c6a 100%)",
              }}
            >
              <Box sx={{ width: "100%" }}>
                <Typography variant="h6" fontWeight={700}>
                  Receiver {idx + 1}: {receiver.receiverName || "—"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {receiver.receiverAddress || "—"}
                  {receiver.receiverEmail && ` • ${receiver.receiverEmail}`}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1, flexWrap: "wrap" }}
                >
                  <Chip
                    size="small"
                    label={`${items.length} item${items.length === 1 ? "" : "s"}`}
                    sx={{ bgcolor: "#1976d2", color: "#fff", fontWeight: 600 }}
                  />
                  <Chip
                    size="small"
                    label={`${deliveredCount}/${items.length} delivered`}
                    sx={{ bgcolor: "#16a34a", color: "#fff", fontWeight: 600 }}
                  />
                  {leastItem && (
                    <Chip
                      size="small"
                      label={`Current: ${leastItem.status}`}
                      sx={{
                        bgcolor: "#f58220",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: { xs: 2, md: 3 }, bgcolor: "#fff" }}>
              {timelineSteps.length > 0 && items.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">
                    Overall progress (based on the least advanced item
                    {leastItem?.trackingId ? `: ${leastItem.trackingId}` : ""})
                  </Typography>
                  <ReceiverProgress
                    steps={timelineSteps}
                    currentIndex={currentIndex}
                  />
                </>
              )}

              <TableContainer
                component={Paper}
                sx={{ border: "1px solid #e2e8f0", borderRadius: 2, mt: 1 }}
              >
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                      <TableCell />
                      <TableCell>
                        <strong>Tracking ID</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Description</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Qty</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Weight</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Status</strong>
                      </TableCell>
                      <TableCell>
                        <strong>ETA</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Container</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Consignment</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No items found for this receiver.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => <ItemRow key={item.id} item={item} />)
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {receiver.dropOffDetails?.length > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    mt: 3,
                    bgcolor: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Pickup / Drop-off Schedule
                  </Typography>
                  <Stack spacing={2}>
                    {receiver.dropOffDetails.map((d, i) => (
                      <Box key={i}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {d.drop_method || "—"}
                        </Typography>
                        <Typography variant="body2">
                          {d.dropoff_name} • {d.drop_off_mobile || "—"}
                          {d.plate_no && ` • Vehicle: ${d.plate_no}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {fmtDate(d.drop_date)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Paper
        elevation={4}
        sx={{
          mt: 8,
          p: { xs: 4, md: 6 },
          textAlign: "center",
          borderRadius: 4,
          background: "linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)",
          color: "white",
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Need Help with Pickup or Delivery?
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: "auto" }}
        >
          Contact support for scheduling, status updates, or questions.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<PhoneIcon />}
          sx={{
            px: 6,
            py: 1.8,
            fontSize: "1.1rem",
            color: "#fff",
            fontWeight: 600,
            borderRadius: 50,
          }}
        >
          Call Now: +971 555 658321
        </Button>
      </Paper>
    </Box>
  );
};

const ConsignmentLayout = ({ trackingData }) => {
  if (!trackingData) {
    return (
      <Alert severity="info" sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        No consignment data received. Please try searching again.
      </Alert>
    );
  }

  const cons = trackingData.consignment || {};
  const orders = trackingData.orders || [];
  const summary = trackingData.summary || {};
  const hasSummaryData =
    summary.order_count ||
    summary.total_assigned ||
    summary.totalNumber ||
    summary.active_containers?.length > 0;

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "TBD";

  const vesselName =
    cons.vessel === 1
      ? "Vessel Alpha"
      : cons.vessel === 2
        ? "Vessel Beta"
        : `Vessel ID ${cons.vessel || "—"}`;

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 3 } }}>
      <Paper
        elevation={5}
        sx={{
          p: { xs: 4, md: 6 },
          mb: 6,
          borderRadius: 3,
          background: "linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)",
          color: "white",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Consignment: {cons.number || "Not available"}
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
          Status: <strong>{cons.status || "Unknown"}</strong>
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="grey.400">
              Route
            </Typography>
            <Typography variant="h6">
              {cons.origin || "—"} → {cons.destination || "—"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="grey.400">
              Vessel / Voyage
            </Typography>
            <Typography variant="h6">
              {vesselName} / {cons.voyage || "—"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="grey.400">
              ETA
            </Typography>
            <Typography variant="h6">{formatDate(cons.eta)}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="grey.400">
              Containers
            </Typography>
            <Typography variant="h6" sx={{ wordBreak: "break-all" }}>
              {cons.containers?.map((c) => c.containerNo).join(", ") || "—"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 6,
          borderRadius: 3,
          bgcolor: "#f8fafc",
          border: "1px solid #e0e7ff",
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 4 }}>
          Consignment Overview
        </Typography>

        {hasSummaryData ? (
          <Grid container spacing={4}>
            <Grid item xs={6} sm={3}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Orders
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {summary.order_count || orders.length || 0}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Total Items
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {summary.total_items?.toLocaleString() || "—"}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Assigned Quantity
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {summary.total_assigned?.toLocaleString() || "—"}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Active Containers
              </Typography>
              <Typography
                variant="h6"
                sx={{ wordBreak: "break-all", lineHeight: 1.4 }}
              >
                {summary.active_containers?.join(", ") || "—"}
              </Typography>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="h6" gutterBottom>
              No summary statistics available yet
            </Typography>
            <Typography variant="body1">
              This section will display totals once the consignment progresses
              further.
            </Typography>
          </Box>
        )}
      </Paper>

      {orders.length > 0 && (
        <>
          <Typography
            variant="h5"
            fontWeight={700}
            gutterBottom
            sx={{ mb: 4, textAlign: "center" }}
          >
            Associated Orders ({orders.length})
          </Typography>

          <Stack spacing={2}>
            {orders.map((order) => (
              <Paper
                key={order.order_id}
                elevation={3}
                sx={{ borderRadius: 3, overflow: "hidden" }}
              >
                <Box
                  sx={{
                    background:
                      "linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)",
                    color: "white",
                    p: 3,
                  }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Order #{order.rgl_booking_number} •{" "}
                    {order.booking_ref || "—"}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    {/* Status: {order.status || order.status || 'In Process'} */}
                  </Typography>
                </Box>

                <Box sx={{ p: 4 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    gutterBottom
                    sx={{ mt: 3 }}
                  >
                    Receivers ({order.receivers?.length || 0})
                  </Typography>

                  <Stack spacing={3} sx={{ mt: 2 }}>
                    {order.receivers.map((receiver, idx) => {
                      const shippingDetails = receiver.shippingDetails || [];
                      const totalPackages = shippingDetails.reduce(
                        (sum, item) => sum + (Number(item.totalNumber) || 0),
                        0,
                      );
                      const totalRemaining = shippingDetails.reduce(
                        (sum, item) => sum + (Number(item.remainingItems) || 0),
                        0,
                      );

                      return (
                        <Paper
                          key={receiver.id}
                          elevation={3}
                          sx={{
                            borderRadius: 3,
                            overflow: "hidden",
                            border: "1px solid #e2e8f0",
                            transition: "all 0.2s",
                            "&:hover": {
                              boxShadow: "0 12px 40px rgba(0,0,0,0.1)",
                              transform: "translateY(-4px)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              background:
                                "linear-gradient(135deg, #1b263b 0%, #0d6c6a 100%)",
                              color: "white",
                              p: { xs: 3, md: 4 },
                            }}
                          >
                            <Typography variant="h5" fontWeight={700}>
                              Receiver {idx + 1}: {receiver.receiverName || "—"}
                            </Typography>

                            <Typography
                              variant="body1"
                              sx={{ mt: 1, opacity: 0.95 }}
                            >
                              {receiver.receiverAddress || "—"}
                            </Typography>
                            <Typography
                              variant="subtitle2"
                              color="#fff"
                              gutterBottom
                            >
                              Email: {receiver.receiverEmail || "—"}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={2}
                              sx={{ mt: 2.5, flexWrap: "wrap" }}
                            >
                              <Chip
                                label={receiver.status || "Pending"}
                                size="medium"
                                sx={{
                                  bgcolor: "#f58220",
                                  color: "white",
                                  fontWeight: 600,
                                }}
                              />
                              <Chip
                                label={`ETA: ${formatDate(receiver.eta) || "TBD"}`}
                                size="medium"
                                sx={{
                                  bgcolor: "#16a34a",
                                  color: "white",
                                  fontWeight: 600,
                                }}
                              />
                              {receiver.containers?.length > 0 && (
                                <Chip
                                  label={`Container${receiver.containers.length > 1 ? "s" : ""}: ${receiver.containers.join(" • ")}`}
                                  size="medium"
                                  sx={{
                                    bgcolor: "#1976d2",
                                    color: "white",
                                    fontWeight: 600,
                                  }}
                                />
                              )}
                            </Stack>
                          </Box>

                          {/* Content */}
                          <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: "#fff" }}>
                            <Grid
                              container
                              flexDirection={"row"}
                              alignItems={"center"}
                              justifyContent={"space-between"}
                              spacing={4}
                            >
                              <Grid
                                sx={{
                                  p: 3,
                                  bgcolor: "#fffbeb",
                                  border: "1px solid #fde68a",
                                  width: 400,
                                  borderRadius: 2,
                                }}
                              >
                                <Stack spacing={4}>
                                  <Box>
                                    {order.sender && (
                                      <Box sx={{ mb: 4 }}>
                                        <Typography
                                          variant="subtitle1"
                                          fontWeight={600}
                                          gutterBottom
                                        >
                                          Sender
                                        </Typography>
                                        <Typography>
                                          {order.sender.name} •{" "}
                                          {order.sender.email ||
                                            order.sender.contact ||
                                            "—"}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>

                                  <Box>
                                    <Typography
                                      variant="subtitle2"
                                      color="text.secondary"
                                      gutterBottom
                                    >
                                      Shipment Summary
                                    </Typography>
                                    <Typography fontWeight={500}>
                                      {totalPackages.toLocaleString()} packages
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Remaining:{" "}
                                      {totalRemaining.toLocaleString()} pcs
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Grid>

                              {receiver.dropOffDetails?.length > 0 && (
                                <Grid>
                                  <Paper
                                    variant="outlined"
                                    sx={{
                                      p: 3,
                                      bgcolor: "#fffbeb",
                                      border: "1px solid #fde68a",
                                      width: 400,
                                      borderRadius: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      fontWeight={600}
                                      gutterBottom
                                      color="amber.dark"
                                    >
                                      Pickup / Drop-off Schedule
                                    </Typography>
                                    <Stack spacing={2.5}>
                                      {receiver.dropOffDetails.map((d, i) => (
                                        <Box key={i}>
                                          <Typography
                                            variant="subtitle2"
                                            fontWeight={600}
                                          >
                                            {d.drop_method || "—"}
                                          </Typography>
                                          <Typography variant="body2">
                                            {d.dropoff_name} •{" "}
                                            {d.drop_off_mobile || "—"}
                                          </Typography>
                                          {d.plate_no && (
                                            <Typography variant="body2">
                                              Vehicle: {d.plate_no}
                                            </Typography>
                                          )}
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            Date:{" "}
                                            {formatDate(d.drop_date) || "—"}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Stack>
                                  </Paper>
                                </Grid>
                              )}
                            </Grid>

                            {shippingDetails.length > 0 && (
                              <Box sx={{ mt: 5 }}>
                                <Typography
                                  variant="h6"
                                  fontWeight={600}
                                  gutterBottom
                                >
                                  Cargo Details
                                </Typography>

                                {shippingDetails.map((item) => {
                                  const containerInfo =
                                    item.containerDetails?.[0] || {};
                                  const cont = containerInfo.container || {};
                                  const status =
                                    containerInfo.status ||
                                    receiver.status ||
                                    "—";

                                  return (
                                    <Box flex={1}>
                                      <TableContainer
                                        component={Paper}
                                        sx={{
                                          border: "1px solid #e2e8f0",
                                          borderRadius: 2,
                                          overflow: "hidden",
                                        }}
                                      >
                                        <Table size="medium">
                                          <TableHead>
                                            <TableRow
                                              sx={{ bgcolor: "#f8fafc" }}
                                            >
                                              <TableCell>
                                                <strong>Ref</strong>
                                              </TableCell>
                                              <TableCell>
                                                <strong>Description</strong>
                                              </TableCell>
                                              <TableCell align="right">
                                                <strong>Total Weight</strong>
                                              </TableCell>
                                              <TableCell align="right">
                                                <strong>Total Items</strong>
                                              </TableCell>

                                              <TableCell align="right">
                                                <strong>Remaining</strong>
                                              </TableCell>
                                              <TableCell>
                                                <strong>
                                                  Container / Status
                                                </strong>
                                              </TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            <TableRow key={item.id} hover>
                                              <TableCell>
                                                {item.itemRef || "—"}
                                              </TableCell>
                                              <TableCell>
                                                {item.category}
                                                {item.subcategory &&
                                                  ` • ${item.subcategory}`}
                                                {item.type && ` (${item.type})`}
                                              </TableCell>
                                              <TableCell align="right">
                                                {Number(
                                                  item.weight,
                                                )?.toLocaleString() || "—"}
                                              </TableCell>
                                              <TableCell align="right">
                                                {Number(
                                                  item.totalNumber,
                                                )?.toLocaleString() || "—"}
                                              </TableCell>
                                              <TableCell align="right">
                                                {Number(
                                                  item.remainingItems,
                                                )?.toLocaleString() || "—"}
                                              </TableCell>
                                              <TableCell>
                                                {cont.container_number ? (
                                                  <>
                                                    {cont.container_number}
                                                    <br />
                                                    <Typography
                                                      variant="caption"
                                                      color="text.secondary"
                                                    >
                                                      {status} •{" "}
                                                      {Number(
                                                        containerInfo.assign_total_box ||
                                                          0,
                                                      ).toLocaleString()}{" "}
                                                      boxes •{" "}
                                                      {Number(
                                                        containerInfo.assign_weight ||
                                                          0,
                                                      ).toLocaleString()}{" "}
                                                      kg
                                                    </Typography>
                                                  </>
                                                ) : (
                                                  "Not Assigned"
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                      <Box sx={{ m: 3 }}>
                                        {cont.container_number ? (
                                          <ShipmentTimeline
                                            currentStatus={receiver.status}
                                            statusHistory={
                                              receiver.status_history || []
                                            }
                                          />
                                        ) : null}
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>
              </Paper>
            ))}
          </Stack>
        </>
      )}

      <Paper
        sx={{
          mt: 8,
          p: { xs: 4, md: 6 },
          textAlign: "center",
          background: "linear-gradient(135deg, #0d6c6a 0%, #1b263b 100%)",
          color: "white",
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Questions about this consignment?
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
          Contact our team for status updates, documentation, or delivery
          scheduling.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<PhoneIcon />}
          sx={{
            px: 6,
            py: 1.8,
            fontSize: "1.1rem",
            color: "#fff",
            fontWeight: 600,
            borderRadius: 50,
          }}
        >
          Call Now: +971 555 658321
        </Button>
      </Paper>
    </Box>
  );
};

export default TrackingPage;
