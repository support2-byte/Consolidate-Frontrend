import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fade,
  Grow,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Divider,
  Tooltip,
  Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import InventoryIcon from "@mui/icons-material/Inventory";
import DriveEtaIcon from "@mui/icons-material/DriveEta";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EventIcon from "@mui/icons-material/Event";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { getOrderStatusColor } from "./Utlis";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { applyPlugin } from "jspdf-autotable";
applyPlugin(jsPDF);

const T = {
  teal: "#0d6c6a",
  tealDark: "#0a5250",
  tealLight: "#e8f5f4",
  tealMid: "#b2dfdb",
  orange: "#f58220",
  orangeDark: "#e65100",
  orangeLight: "#fff3e0",
  grey50: "#fafafa",
  grey100: "#f5f5f5",
  grey200: "#eeeeee",
  grey600: "#757575",
  text: "#1a1a2e",
  textSoft: "#555770",
  white: "#ffffff",
};

const SectionHeader = ({ icon, title, count }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
    <Avatar sx={{ bgcolor: T.tealLight, width: 36, height: 36 }}>{icon}</Avatar>
    <Typography variant="h6" fontWeight={700} color={T.teal}>
      {title}
    </Typography>
    {count != null && (
      <Chip
        label={count}
        size="small"
        sx={{ bgcolor: T.tealMid, color: T.tealDark, fontWeight: 700 }}
      />
    )}
  </Box>
);

const FieldCard = ({ label, value, accent = false }) => (
  <Box
    sx={{
      p: 1.75,
      borderRadius: 2,
      border: `1px solid ${accent ? T.orange + "55" : T.grey200}`,
      bgcolor: accent ? T.orangeLight : T.grey50,
      height: "100%",
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: "0 3px 10px rgba(0,0,0,0.07)" },
    }}
  >
    <Typography
      variant="caption"
      sx={{
        color: T.grey600,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        display: "block",
        mb: 0.4,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={600}
      color={value && value !== "N/A" ? T.text : T.grey600}
    >
      {value || "N/A"}
    </Typography>
  </Box>
);

const FieldGrid = ({ data, cols = 3 }) => (
  <Grid container spacing={1.5}>
    {Object.entries(data).map(([key, val]) => (
      <Grid item xs={12} sm={6} md={12 / cols} key={key}>
        <FieldCard label={key} value={val} />
      </Grid>
    ))}
  </Grid>
);

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Grow in timeout={400}>
          <Box sx={{ pt: 2.5 }}>{children}</Box>
        </Grow>
      )}
    </div>
  );
}

function a11yProps(i) {
  return { id: `tab-${i}`, "aria-controls": `tabpanel-${i}` };
}

const OrderModalView = ({
  openModal,
  handleCloseModal,
  selectedOrder,
  modalLoading,
  modalError,
  places,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const [containers, setContainers] = useState([]);
  const [loadingContainers, setLoadingContainers] = useState(false);
  const [assignmentError, setAssignmentError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [assignments, setAssignments] = useState({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const getPlaceName = (id) => {
    if (!id) return "N/A";
    const p = places?.find((p) => p.value === id.toString());
    return p ? p.label : id;
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    if (openModal && selectedOrder) {
      const init = {};
      (selectedOrder.receivers || []).forEach((r) => {
        if (r.container_id) init[r.id] = r.container_id;
      });
      setAssignments(init);
      setTabValue(0);
    }
  }, [openModal, selectedOrder]);

  const statusColor = getOrderStatusColor(
    selectedOrder?.overall_status || selectedOrder?.status,
  );

  const handleEdit = (id) => {
    handleCloseModal();
    navigate(`/orders/${id}/edit/`, { state: { orderId: id } });
  };

  const normalizeContainers = (c) => {
    if (!c || !Array.isArray(c)) return [];
    return c
      .flat()
      .filter((x) => x && typeof x === "string")
      .map((x) => x.trim());
  };

  const loadImageAsBase64 = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
    });

  const generateOrderPDF = async (order) => {
    if (!order) return;
    const doc = new jsPDF("p", "mm", "a4");
    const pw = doc.internal.pageSize.getWidth();
    const m = 14;
    const bp = [13, 108, 106];
    const bl = [220, 245, 243];
    let y = 30;

    const logo = await loadImageAsBase64("./logo-2.png");
    if (logo) doc.addImage(logo, "PNG", m, 4, 60, 12);

    doc
      .setFont("helvetica", "bold")
      .setFontSize(16)
      .setTextColor(...bp);
    doc.text("ORDER DETAILS REPORT", pw - m, 10, { align: "right" });
    doc.setFont("helvetica", "normal").setFontSize(9);
    doc.text(`Booking Ref: ${order.booking_ref}`, pw - m, 17, {
      align: "right",
    });
    doc.text(`Generated: ${new Date().toLocaleString()}`, pw - m, 22, {
      align: "right",
    });

    const cards = [
      ["Order ID", order.id],
      ["Status", order.status],
      ["Drop Method", order.drop_method],
      ["Point of Origin", getPlaceName(order.point_of_origin)],
      ["Total Assigned Qty", order.total_assigned_qty],
      ["Collection Scope", order.collection_scope],
    ];
    const cw = (pw - m * 2 - 6) / 2;
    const ch = 16;
    cards.forEach((item, i) => {
      const col = i % 2,
        row = Math.floor(i / 2);
      const x = m + col * (cw + 6),
        cy = y + row * (ch + 6);
      doc
        .setDrawColor(220, 220, 220)
        .setFillColor(...bl)
        .roundedRect(x, cy, cw, ch, 2, 2, "FD");
      doc.setFillColor(...bp).rect(x, cy, cw, 5, "F");
      doc
        .setFont("helvetica", "bold")
        .setFontSize(9)
        .setTextColor(255, 255, 255)
        .text(item[0], x + 2, cy + 4);
      doc
        .setFont("helvetica", "normal")
        .setTextColor(50, 50, 50)
        .text(String(item[1] ?? "N/A"), x + 3, cy + 11);
    });
    y += Math.ceil(cards.length / 2) * (ch + 6) + 5;

    const drawKV = (y, title, details) => {
      doc
        .setFont("helvetica", "bold")
        .setFontSize(14)
        .setTextColor(...bp)
        .text(title, m, y);
      y += 4;
      doc
        .setDrawColor(...bp)
        .setLineWidth(0.6)
        .line(m, y, pw - m, y);
      y += 6;
      const colW = (pw - m * 2 - 10) / 2;
      const rh = 8;
      details.forEach((pair, i) => {
        const col = i % 2,
          row = Math.floor(i / 2);
        const x = m + col * (colW + 10),
          dy = y + row * rh;
        doc
          .setFont("helvetica", "bold")
          .setFontSize(10)
          .setTextColor(...bp)
          .text(pair[0], x, dy);
        doc
          .setFont("helvetica", "normal")
          .setTextColor(50, 50, 50)
          .text(String(pair[1] || "N/A"), x, dy + 4);
      });
      return y + Math.ceil(details.length / 2) * rh + 6;
    };

    y = drawKV(y, "ORDER INFORMATION", [
      ["Booking Ref", order.booking_ref],
      ["RGL Booking #", order.rgl_booking_number],
      ["Place of Loading", getPlaceName(order.place_of_loading)],
      ["Final Destination", getPlaceName(order.final_destination)],
      ["Place of Delivery", getPlaceName(order.place_of_delivery)],
    ]);

    y = drawKV(y, "SENDER INFORMATION", [
      ["Sender Name", order.sender_name],
      ["Contact Number", order.sender_contact],
      ["Email", order.sender_email],
      ["Address", order.sender_address],
      ["Sender Ref", order.sender_ref],
    ]);

    if (order.receivers?.length) {
      doc
        .setFont("helvetica", "bold")
        .setFontSize(14)
        .setTextColor(...bp)
        .text("RECEIVERS", m, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [
          [
            "Receiver",
            "Status",
            "ETA",
            "ETD",
            "Qty",
            "Weight",
            "Contact",
            "Address",
          ],
        ],
        body: order.receivers.map((r) => [
          r.receiver_name,
          r.status,
          r.eta ? formatDate(r.eta) : "N/A",
          r.etd ? formatDate(r.etd) : "N/A",
          r.total_number,
          r.total_weight,
          r.receiver_contact,
          r.receiver_address,
        ]),
        headStyles: { fillColor: bp, textColor: 255 },
        bodyStyles: { fontSize: 9, cellPadding: 2 },
        margin: { left: m, right: m },
      });
      y = doc.lastAutoTable.finalY + 6;

      for (const rec of order.receivers) {
        if (!rec.shippingdetails?.length) continue;
        doc
          .setFont("helvetica", "normal")
          .setFontSize(9)
          .setTextColor(...bp)
          .text(`Products for: ${rec.receiver_name}`, m, y);
        y += 6;
        autoTable(doc, {
          startY: y,
          head: [
            [
              "Category",
              "Subcategory",
              "Type",
              "Total",
              "Weight",
              "Pickup",
              "Delivery",
              "Status",
            ],
          ],
          body: rec.shippingdetails.map((s) => [
            s.category,
            s.subcategory,
            s.type,
            s.totalNumber,
            s.weight,
            s.pickupLocation,
            s.deliveryAddress,
            s.consignmentStatus,
          ]),
          headStyles: { fillColor: bp, textColor: 255 },
          bodyStyles: { fontSize: 8, cellPadding: 2 },
          margin: { left: m, right: m },
        });
        y = doc.lastAutoTable.finalY + 6;
        rec.shippingdetails.forEach((sd, di) => {
          if (!sd.containerDetails?.length) return;
          doc
            .setFont("helvetica", "normal")
            .setFontSize(9)
            .setTextColor(...bp)
            .text(`Container Assignments – Item ${di + 1}`, m, y);
          y += 4;
          autoTable(doc, {
            startY: y,
            head: [
              [
                "Status",
                "Container #",
                "Assigned Weight",
                "Assigned Boxes",
                "Remaining",
              ],
            ],
            body: sd.containerDetails.map((cd) => [
              cd.status,
              cd.container?.container_number || "N/A",
              cd.assign_weight,
              cd.assign_total_box,
              cd.remaining_items,
            ]),
            headStyles: { fillColor: bp, textColor: 255 },
            bodyStyles: { fontSize: 8, cellPadding: 2 },
            margin: { left: m, right: m },
            theme: "grid",
          });
          y = doc.lastAutoTable.finalY + 6;
        });
      }
    }

    if (order.order_remarks) {
      doc
        .setFillColor(248, 249, 250)
        .roundedRect(m, y, pw - m * 2, 20, 2, 2, "F");
      doc
        .setFont("helvetica", "bold")
        .setFontSize(10)
        .setTextColor(...bp)
        .text("Order Remarks", m + 3, y + 6);
      doc
        .setFont("helvetica", "normal")
        .setFontSize(9)
        .setTextColor(50, 50, 50);
      doc.text(
        doc.splitTextToSize(order.order_remarks, pw - m * 2 - 6),
        m + 3,
        y + 11,
      );
      y += 26;
    }

    const fy = 275;
    doc.setDrawColor(...bp).line(m, fy, pw - m, fy);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleString()}`, m, fy + 6);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pw - m, fy + 6, {
      align: "right",
    });
    doc.save(`Order_${order.booking_ref || "Unknown"}.pdf`);
  };

  const handleGeneratePDF = async () => {
    if (!selectedOrder) return;
    setIsGeneratingPDF(true);
    setSnackbar({ open: true, message: "Generating PDF…", severity: "info" });
    try {
      await generateOrderPDF(selectedOrder);
      setSnackbar({
        open: true,
        message: "PDF downloaded successfully",
        severity: "success",
      });
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: "Failed to generate PDF",
        severity: "error",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderFiles = (files) => {
    if (!files?.length)
      return (
        <Box
          sx={{
            py: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <AttachFileIcon sx={{ fontSize: 36, color: T.grey200 }} />
          <Typography variant="body2" color="text.secondary">
            No files uploaded
          </Typography>
        </Box>
      );
    return (
      <List disablePadding>
        {files.map((file, i) => (
          <ListItem
            key={i}
            divider={i !== files.length - 1}
            sx={{ py: 1.5, px: 2 }}
          >
            <ListItemIcon>
              <AttachFileIcon sx={{ color: T.orange }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography fontWeight={600} noWrap>
                  {file?.originalname || "File"}
                </Typography>
              }
              secondary={`${file?.mimetype || "Unknown"} • ${((file?.size || 0) / 1024).toFixed(1)} KB`}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const renderReceivers = () => {
    const receivers = selectedOrder?.receivers || [];
    if (!receivers.length)
      return (
        <Typography variant="body2" color="text.secondary">
          No receivers found
        </Typography>
      );

    return (
      <Stack spacing={2}>
        {receivers.map((rec, i) => {
          const conts = normalizeContainers(rec.containers);
          const hasEta = rec.eta && rec.eta.trim() !== "";
          const hasEtd = rec.etd && rec.etd.trim() !== "";
          return (
            <Card
              key={rec.id || i}
              variant="outlined"
              sx={{
                borderRadius: 2.5,
                border: `1px solid ${T.grey200}`,
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
              }}
            >
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  bgcolor: T.tealLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${T.tealMid}`,
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: T.teal,
                      fontSize: 12,
                    }}
                  >
                    {i + 1}
                  </Avatar>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color={T.tealDark}
                  >
                    {rec.receiver_name || `Receiver ${i + 1}`}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label={rec.status || "Order Created"}
                    size="small"
                    sx={{
                      bgcolor: "#00695c",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  />
                  {hasEta && (
                    <Chip
                      icon={<EventIcon sx={{ fontSize: 14 }} />}
                      label={`ETA: ${formatDate(rec.eta)}`}
                      size="small"
                      sx={{
                        bgcolor: "#e3f2fd",
                        color: "#1565c0",
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    />
                  )}
                  {hasEtd && (
                    <Chip
                      icon={<EventIcon sx={{ fontSize: 14 }} />}
                      label={`ETD: ${formatDate(rec.etd)}`}
                      size="small"
                      sx={{
                        bgcolor: T.orangeLight,
                        color: T.orangeDark,
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    />
                  )}
                </Stack>
              </Box>

              <CardContent sx={{ p: 2.5 }}>
                <Grid container spacing={1.5}>
                  {[
                    ["Contact", rec.receiver_contact],
                    ["Email", rec.receiver_email],
                    ["Address", rec.receiver_address],
                    // ["Consignment #", rec.consignment_number],
                    ["Total Number", rec.total_number],
                    [
                      "Total Weight",
                      rec.total_weight ? `${rec.total_weight} kg` : null,
                    ],
                    ["Receiver Ref", rec.receiver_ref],
                    ["Full / Partial", rec.full_partial],
                    ["Qty Delivered", rec.qty_delivered],
                    ["Remarks", rec.remarks],
                  ].map(([label, val]) => (
                    <Grid item xs={12} sm={6} md={4} key={label}>
                      <FieldCard label={label} value={val} />
                    </Grid>
                  ))}
                </Grid>

                {conts.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color={T.grey600}
                      sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Containers
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      sx={{ mt: 0.75 }}
                    >
                      {conts.map((c, ci) => (
                        <Chip
                          key={ci}
                          label={c}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: T.teal,
                            color: T.teal,
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    );
  };

  const renderOrderItems = () => {
    const receivers = selectedOrder?.receivers || [];
    const allItems = receivers.flatMap((rec, ri) =>
      (rec.shippingDetails || rec.shippingdetails || []).map((item, ii) => ({
        rec,
        ri,
        item,
        ii,
      })),
    );
    if (!allItems.length)
      return (
        <Typography variant="body2" color="text.secondary">
          No shipping items found
        </Typography>
      );

    return (
      <Stack spacing={2}>
        {allItems.map(({ rec, ri, item, ii }) => (
          <Card
            key={`${ri}-${ii}`}
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${T.grey200}`,
              "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                bgcolor: T.orangeLight,
                borderBottom: `1px solid #ffe0b2`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  color={T.grey600}
                  fontWeight={700}
                  sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  {rec.receiver_name}
                </Typography>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color={T.orangeDark}
                >
                  {item.category} › {item.subcategory}
                </Typography>
              </Box>
              <Chip
                label={item.consignmentStatus || "Order Created"}
                size="small"
                sx={{
                  bgcolor: "#00695c",
                  color: "#fff",
                  fontWeight: 700,
                }}
              />
            </Box>

            <CardContent sx={{ p: 2.5 }}>
              <Grid container spacing={1.5}>
                {[
                  ["Type", item.type],
                  ["Total Number", item.totalNumber],
                  ["Weight", item.weight ? `${item.weight} kg` : null],
                  ["Pickup Location", item.pickupLocation],
                  ["Delivery Address", item.deliveryAddress],
                  ["Item Ref", item.itemRef],
                  ["Remaining Items", item.remainingItems],
                ].map(([label, val]) => (
                  <Grid item xs={12} sm={6} md={4} key={label}>
                    <FieldCard label={label} value={val} />
                  </Grid>
                ))}
              </Grid>

              {item.containerDetails?.length > 0 && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color={T.grey600}
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      display: "block",
                      mb: 1,
                    }}
                  >
                    Container Assignments
                  </Typography>
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: T.tealLight }}>
                          {[
                            "Status",
                            "Container #",
                            "Assigned Weight",
                            "Assigned Boxes",
                            "Remaining",
                          ].map((h) => (
                            <TableCell
                              key={h}
                              sx={{
                                fontWeight: 700,
                                color: T.tealDark,
                                fontSize: 12,
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {item.containerDetails.map((cd, cdi) => (
                          <TableRow
                            key={cdi}
                            sx={{ "&:last-child td": { borderBottom: 0 } }}
                          >
                            <TableCell>
                              <Chip
                                label={cd.status}
                                size="small"
                                sx={{
                                  bgcolor:
                                    cd.status === "Occupied"
                                      ? "#e8f5e9"
                                      : "#fff3e0",
                                  color:
                                    cd.status === "Occupied"
                                      ? "#2e7d32"
                                      : T.orangeDark,
                                  fontWeight: 600,
                                  fontSize: 11,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {cd.container?.container_number || "N/A"}
                            </TableCell>
                            <TableCell>
                              {cd.assign_weight
                                ? `${cd.assign_weight} kg`
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {cd.assign_total_box || "N/A"}
                            </TableCell>
                            <TableCell>{cd.remaining_items ?? "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  };

  const renderDropOff = () => {
    const receivers = selectedOrder?.receivers || [];
    const hasAny = receivers.some((r) => r.drop_off_details?.length > 0);
    if (!hasAny)
      return (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No drop-off details recorded for this order.
        </Alert>
      );

    return (
      <Stack spacing={2.5}>
        {receivers.map((rec, ri) => {
          const drops = rec.drop_off_details || [];
          if (!drops.length) return null;
          return (
            <Card
              key={rec.id || ri}
              variant="outlined"
              sx={{ borderRadius: 2.5 }}
            >
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  bgcolor: T.orangeLight,
                  borderBottom: "1px solid #ffe0b2",
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={T.orangeDark}
                >
                  {rec.receiver_name || `Receiver ${ri + 1}`}
                </Typography>
                <Typography variant="caption" color={T.grey600}>
                  {drops.length} drop-off{" "}
                  {drops.length > 1 ? "entries" : "entry"}
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Grid container spacing={2}>
                  {drops.map((d, di) => (
                    <Grid item xs={12} md={6} key={di}>
                      <Box
                        sx={{
                          p: 2,
                          border: `1px dashed ${T.orange}55`,
                          borderRadius: 2,
                          bgcolor: T.grey50,
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color={T.orange}
                          sx={{
                            display: "block",
                            mb: 1.5,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Entry {di + 1}
                        </Typography>
                        <Grid container spacing={1}>
                          {[
                            ["Drop Method", d.drop_method],
                            ["Name", d.dropoff_name],
                            ["CNIC / ID", d.drop_off_cnic],
                            ["Mobile", d.drop_off_mobile],
                            ["Plate No", d.plate_no],
                            [
                              "Drop Date",
                              d.drop_date ? formatDate(d.drop_date) : null,
                            ],
                          ].map(([label, val]) => (
                            <Grid item xs={12} sm={6} key={label}>
                              <FieldCard label={label} value={val} />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    );
  };

  const tabs = [
    {
      label: "Overview",
      icon: <InfoIcon sx={{ fontSize: 18, color: T.teal }} />,
    },
    {
      label: "Parties",
      icon: <PersonIcon sx={{ fontSize: 18, color: T.teal }} />,
    },
    {
      label: "Shipping",
      icon: <InventoryIcon sx={{ fontSize: 18, color: T.teal }} />,
    },
    {
      label: "Transport",
      icon: <DriveEtaIcon sx={{ fontSize: 18, color: T.teal }} />,
    },
    {
      label: "Files",
      icon: <AttachFileIcon sx={{ fontSize: 18, color: T.teal }} />,
    },
  ];

  return (
    <>
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            maxHeight: "92vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: T.teal,
            color: T.white,
            py: 2,
            px: 3,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <LocalShippingIcon sx={{ fontSize: 22 }} />
            <Typography variant="h6" fontWeight={700} noWrap>
              {selectedOrder?.booking_ref || "Order Details"}
            </Typography>
            {selectedOrder?.overall_status && (
              <Chip
                label={selectedOrder.overall_status}
                size="small"
                sx={{
                  bgcolor: statusColor,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            )}
            {(selectedOrder?.receivers || []).length > 0 && (
              <Chip
                label={`${selectedOrder.receivers.length} Receiver${selectedOrder.receivers.length > 1 ? "s" : ""}`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "rgba(255,255,255,0.5)",
                  color: T.white,
                  fontSize: 11,
                }}
              />
            )}
          </Box>
          <IconButton
            onClick={handleCloseModal}
            sx={{
              color: T.white,
              "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: T.white,
            flexShrink: 0,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              minHeight: 52,
              "& .MuiTab-root": {
                minHeight: 52,
                fontSize: 13,
                fontWeight: 600,
                color: T.grey600,
                gap: 0.5,
              },
              "& .Mui-selected": { color: `${T.teal} !important` },
            }}
            TabIndicatorProps={{
              style: {
                backgroundColor: T.teal,
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            {tabs.map((t, i) => (
              <Tab
                key={i}
                label={t.label}
                icon={t.icon}
                iconPosition="start"
                {...a11yProps(i)}
              />
            ))}
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0, bgcolor: T.grey100, overflowY: "auto" }}>
          {modalLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 10,
                gap: 2,
              }}
            >
              <CircularProgress size={36} sx={{ color: T.teal }} />
              <Typography color="text.secondary">
                Loading order details…
              </Typography>
            </Box>
          ) : modalError ? (
            <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
              {modalError}
            </Alert>
          ) : selectedOrder ? (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <TabPanel value={tabValue} index={0}>
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 2.5, border: `1px solid ${T.grey200}` }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <SectionHeader
                      icon={<InfoIcon sx={{ color: T.teal, fontSize: 20 }} />}
                      title="Order Information"
                    />
                    <FieldGrid
                      cols={3}
                      data={{
                        "Booking Ref": selectedOrder.booking_ref,
                        "RGL Booking #": selectedOrder.rgl_booking_number,
                        Status:
                          selectedOrder.overall_status || selectedOrder.status,
                        "Place of Loading": getPlaceName(
                          selectedOrder.place_of_loading,
                        ),
                        "Final Destination": getPlaceName(
                          selectedOrder.final_destination,
                        ),
                        "Place of Delivery": getPlaceName(
                          selectedOrder.place_of_delivery,
                        ),
                        "Point of Origin": getPlaceName(
                          selectedOrder.point_of_origin,
                        ),
                        "Shipping Line": selectedOrder.shipping_line,
                        "Collection Scope": selectedOrder.collection_scope,
                        "Transport Type": selectedOrder.transport_type,
                        "Total Assigned Qty": selectedOrder.total_assigned_qty,
                        "Order Remarks": selectedOrder.order_remarks,
                        // "Consignment Remarks":
                        //   selectedOrder.consignment_remarks,
                        "Created At": new Date(
                          selectedOrder.created_at,
                        ).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      }}
                    />
                  </CardContent>
                </Card>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Stack spacing={3}>
                  <Card
                    variant="outlined"
                    sx={{ borderRadius: 2.5, border: `1px solid ${T.grey200}` }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <SectionHeader
                        icon={
                          <PersonIcon sx={{ color: T.teal, fontSize: 20 }} />
                        }
                        title="Sender Details"
                      />
                      <FieldGrid
                        cols={3}
                        data={{
                          Name: selectedOrder.sender_name,
                          Contact: selectedOrder.sender_contact,
                          Email: selectedOrder.sender_email,
                          Address: selectedOrder.sender_address,
                          "Sender Ref": selectedOrder.sender_ref,
                          "Sender Owner": selectedOrder.selected_sender_owner,
                          Remarks: selectedOrder.sender_remarks,
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card
                    variant="outlined"
                    sx={{ borderRadius: 2.5, border: `1px solid ${T.grey200}` }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <SectionHeader
                        icon={
                          <PersonIcon sx={{ color: T.teal, fontSize: 20 }} />
                        }
                        title="Receivers"
                        count={(selectedOrder.receivers || []).length}
                      />
                      {renderReceivers()}
                    </CardContent>
                  </Card>
                </Stack>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 2.5, border: `1px solid ${T.grey200}` }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <SectionHeader
                      icon={
                        <InventoryIcon sx={{ color: T.teal, fontSize: 20 }} />
                      }
                      title="Shipping Details"
                    />
                    {renderOrderItems()}
                  </CardContent>
                </Card>
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <Stack spacing={3}>
                  {selectedOrder.transport_type !== "Drop Off" && (
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5,
                        border: `1px solid ${T.grey200}`,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <SectionHeader
                          icon={
                            <DriveEtaIcon
                              sx={{ color: T.teal, fontSize: 20 }}
                            />
                          }
                          title="Transport Details"
                        />
                        <FieldGrid
                          cols={3}
                          data={{
                            "Transport Type": selectedOrder.transport_type,
                            "Driver Name": selectedOrder.driver_name,
                            "Driver Contact": selectedOrder.driver_contact,
                            "Driver NIC": selectedOrder.driver_nic,
                            "Pickup Location":
                              selectedOrder.driver_pickup_location,
                            "Truck Number": selectedOrder.truck_number,
                            "Third Party Transport":
                              selectedOrder.third_party_transport,
                          }}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {selectedOrder.transport_type === "Drop Off" && (
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5,
                        border: `1px solid ${T.grey200}`,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <SectionHeader
                          icon={
                            <LocalShippingIcon
                              sx={{ color: T.teal, fontSize: 20 }}
                            />
                          }
                          title="Drop-Off Details"
                        />
                        {renderDropOff()}
                      </CardContent>
                    </Card>
                  )}

                  {/* <Card
                    variant="outlined"
                    sx={{ borderRadius: 2.5, border: `1px solid ${T.grey200}` }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <SectionHeader
                        icon={
                          <CheckCircleOutlineIcon
                            sx={{ color: T.teal, fontSize: 20 }}
                          />
                        }
                        title="Delivery Details"
                      />
                      <FieldGrid
                        cols={3}
                        data={{
                          "Collection Method": selectedOrder.collection_method,
                          "Collection Scope": selectedOrder.collection_scope,
                          "Full / Partial": selectedOrder.full_partial,
                          "Qty Delivered": selectedOrder.qty_delivered,
                          "Delivery Date": formatDate(
                            selectedOrder.delivery_date,
                          ),
                          "Drop Date": formatDate(selectedOrder.drop_date),
                          "Receiver Name": selectedOrder.client_receiver_name,
                          "Receiver ID": selectedOrder.client_receiver_id,
                          "Receiver Mobile":
                            selectedOrder.client_receiver_mobile,
                        }}
                      />
                    </CardContent>
                  </Card> */}
                </Stack>
              </TabPanel>

              <TabPanel value={tabValue} index={4}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      variant="outlined"
                      sx={{ borderRadius: 2.5, overflow: "hidden" }}
                    >
                      <Box
                        sx={{
                          px: 2.5,
                          py: 1.5,
                          bgcolor: T.tealLight,
                          borderBottom: `1px solid ${T.tealMid}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <AttachFileIcon sx={{ color: T.teal, fontSize: 18 }} />
                        <Typography fontWeight={700} color={T.tealDark}>
                          Attachments
                        </Typography>
                        <Chip
                          size="small"
                          label={selectedOrder?.attachments?.length || 0}
                          sx={{
                            bgcolor: T.tealMid,
                            color: T.tealDark,
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                      {renderFiles(selectedOrder?.attachments)}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper
                      variant="outlined"
                      sx={{ borderRadius: 2.5, overflow: "hidden" }}
                    >
                      <Box
                        sx={{
                          px: 2.5,
                          py: 1.5,
                          bgcolor: T.tealLight,
                          borderBottom: `1px solid ${T.tealMid}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <AttachFileIcon sx={{ color: T.teal, fontSize: 18 }} />
                        <Typography fontWeight={700} color={T.tealDark}>
                          Gatepass
                        </Typography>
                        <Chip
                          size="small"
                          label={selectedOrder?.gatepass?.length || 0}
                          sx={{
                            bgcolor: T.tealMid,
                            color: T.tealDark,
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                      {renderFiles(selectedOrder?.gatepass)}
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 10,
              }}
            >
              <Typography color="text.secondary">No order selected</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            bgcolor: T.white,
            borderTop: `1px solid ${T.grey200}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Button
            onClick={handleCloseModal}
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: T.grey200,
              color: T.textSoft,
              "&:hover": { borderColor: T.grey600 },
            }}
          >
            Close
          </Button>
          <Button
            onClick={handleGeneratePDF}
            variant="outlined"
            disabled={!selectedOrder || isGeneratingPDF}
            startIcon={
              isGeneratingPDF ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PictureAsPdfIcon />
              )
            }
            sx={{
              borderRadius: 2,
              borderColor: T.teal,
              color: T.teal,
              "&:hover": { bgcolor: T.tealLight, borderColor: T.tealDark },
            }}
          >
            {isGeneratingPDF ? "Generating…" : "Export PDF"}
          </Button>
          <Button
            onClick={() => handleEdit(selectedOrder?.id)}
            variant="contained"
            disabled={!selectedOrder}
            startIcon={<EditIcon />}
            sx={{
              borderRadius: 2,
              bgcolor: T.teal,
              "&:hover": { bgcolor: T.tealDark },
              boxShadow: "none",
            }}
          >
            Edit Order
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OrderModalView;
