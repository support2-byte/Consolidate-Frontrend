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
  Divider,
  Tooltip,
  Avatar,
  Checkbox,
  FormControlLabel,
  Link,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import EventIcon from "@mui/icons-material/Event";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PaymentsIcon from "@mui/icons-material/Payments";
import SyncIcon from "@mui/icons-material/Sync";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { alpha } from "@mui/material/styles";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PieChartOutlineIcon from "@mui/icons-material/PieChartOutline";
import { getOrderStatusColor } from "../../pages/Orders/Utlis";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { applyPlugin } from "jspdf-autotable";
import { BRAND } from "../../constants/containers";
import { toast } from "react-toastify";
import {
  manifestTableStyles,
  pdfAddFooters,
  pdfDrawSectionHeader,
} from "../../Utlis/containerBuilder";
applyPlugin(jsPDF);

const PAYMENT_STATUS = {
  paid: { label: "Paid", color: "success" },
  partially_paid: { label: "Partially Paid", color: "warning" },
  unpaid: { label: "Unpaid", color: "error" },
  no_invoice: { label: "No Invoice", color: "default" },
};

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

const docStatusColor = (s) =>
  s === "paid"
    ? "success"
    : s === "overdue"
      ? "error"
      : s === "void" || s === "draft"
        ? "default"
        : "warning";

const fmtStatus = (s = "") =>
  s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const fmtMoney = (n, cur) =>
  `${cur} ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
  const [assignments, setAssignments] = useState({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { isSuperAdmin, isAdmin, isManager } = useAuth();
  const canViewJobDetails = isSuperAdmin() || isAdmin();
  const canApprove = isSuperAdmin() || isAdmin() || isManager();
  const [billing, setBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [receiverPayments, setReceiverPayments] = useState({});
  const [receiverApprovals, setReceiverApprovals] = useState({});
  const [approvingId, setApprovingId] = useState(null);
  const [syncingZoho, setSyncingZoho] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const [shipView, setShipView] = useState("container");
  const [financeView, setFinanceView] = useState("invoices");
  const [expanded, setExpanded] = useState({});
  const toggleExpand = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const resolveFileUrl = (file) => {
    const raw = file?.url || file?.secure_url || file?.location || file?.path;
    if (!raw) return null;
    if (/^(https?:|blob:|data:)/i.test(raw)) return raw;
    const base = (api.defaults?.baseURL || "").replace(/\/$/, "");
    return `${base}/${String(raw).replace(/^\/+/, "")}`;
  };

  const isImage = (f) => f?.mimetype?.startsWith("image/");
  const isPdf = (f) => f?.mimetype === "application/pdf";

  const containerHref = (no) =>
    `/containers?container_number=${encodeURIComponent(no)}`;
  const consignmentHref = (id) => `/consignments/${id}/view`;

  const handleDownloadFile = async (file) => {
    const url = resolveFileUrl(file);
    if (!url) return toast.error("File URL not available.");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = file.originalname || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const paymentOf = (receiverId) =>
    PAYMENT_STATUS[receiverPayments[receiverId]]?.label;

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

  const getLastSyncedAt = () => {
    const dates = [
      ...(billing?.invoices || []),
      ...(billing?.vendorBills || []),
    ]
      .map((d) => d.synced_at)
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter(Number.isFinite);

    if (!dates.length) return null;

    return new Date(Math.max(...dates));
  };

  useEffect(() => {
    if (openModal && selectedOrder) {
      const init = {};
      (selectedOrder.receivers || []).forEach((r) => {
        if (r.container_id) init[r.id] = r.container_id;
      });
      setAssignments(init);
      setTabValue(0);
      setExpanded({});
    }
  }, [openModal, selectedOrder]);

  useEffect(() => {
    setReceiverApprovals({});
    if (!openModal || !selectedOrder?.id) return;

    let active = true;
    api
      .get(`/api/zoho-invoice/order/${selectedOrder.id}/payment-status`)
      .then(({ data }) => {
        if (!active) return;
        setReceiverPayments(data.receiverPayments || {});
        setReceiverApprovals(data.receiverApprovals || {});
      })
      .catch(() => {
        if (active) toast.error("Failed to load payment status.");
      });

    return () => {
      active = false;
    };
  }, [openModal, selectedOrder?.id]);

  useEffect(() => {
    setBilling(null);
    setReceiverPayments({});
    if (!openModal || !selectedOrder?.id || !canViewJobDetails) return;

    let active = true;
    setBillingLoading(true);
    api
      .get(`/api/zoho-invoice/order/${selectedOrder.id}/billing`)
      .then(({ data }) => {
        if (!active) return;
        setBilling(data.row);
        setReceiverPayments(data.receiverPayments || {});
      })
      .catch((err) => {
        if (active)
          toast.error(
            err.response?.data?.message || "Failed to load billing data.",
          );
      })
      .finally(() => active && setBillingLoading(false));

    return () => {
      active = false;
    };
  }, [openModal, selectedOrder?.id, canViewJobDetails]);

  const handleSyncZoho = async () => {
    if (!selectedOrder?.id) return;
    setSyncingZoho(true);
    try {
      const { data } = await api.post(
        `/api/zoho-invoice/order/${selectedOrder.id}/billing/sync`,
      );
      setBilling(data.row);
      setReceiverPayments(data.receiverPayments || {});
      setReceiverPayments(data.receiverPayments || {});
      setReceiverApprovals(data.receiverApprovals || {});
      toast.success("Zoho sync complete");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to sync with Zoho.");
    } finally {
      setSyncingZoho(false);
    }
  };

  const handleToggleApproval = async (receiverId, approved) => {
    setApprovingId(receiverId);
    try {
      const { data } = await api.patch(
        `/api/zoho-invoice/order/${selectedOrder.id}/receiver/${receiverId}/payment-approval`,
        { approved },
      );
      setReceiverApprovals((prev) => ({
        ...prev,
        [receiverId]: data.approval,
      }));
      toast.success(approved ? "Release approved" : "Approval removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update approval.");
    } finally {
      setApprovingId(null);
    }
  };

  const statusColor = getOrderStatusColor(selectedOrder?.status);

  const handleEdit = (id) => {
    handleCloseModal();
    navigate(`/orders/${id}/edit/`, { state: { orderId: id } });
  };

  const isMulti = (item) => (item?.containerDetails?.length || 0) > 1;

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
    const { teal, orange, lightGrey, borderGrey } = BRAND;
    let y;

    const PAGE_BOTTOM = 270;
    const checkPageBreak = (needed = 20) => {
      if (y + needed > PAGE_BOTTOM) {
        doc.addPage();
        y = 20;
      }
    };

    const logo = await loadImageAsBase64("./logo-2.png");
    if (logo) doc.addImage(logo, "PNG", m, 5, 55, 12);

    doc
      .setFont("helvetica", "bold")
      .setFontSize(10)
      .setTextColor(...orange);
    doc.text(`Booking Ref: ${order.booking_ref}`, pw - m, 8, {
      align: "right",
    });

    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(60, 60, 60);
    [
      `Status: ${order.status || "N/A"}`,
      `Generated: ${new Date().toLocaleString()}`,
    ].forEach((line, i) =>
      doc.text(line, pw - m, 13 + i * 4, { align: "right" }),
    );

    doc
      .setFont("helvetica", "bold")
      .setFontSize(13)
      .setTextColor(...teal);
    doc.text("ROYAL GULF SHIPPING & LOGISTICS LLC", m, 24);
    doc
      .setFont("helvetica", "normal")
      .setFontSize(7.5)
      .setTextColor(120, 120, 120);
    doc.text("Dubai • London • Karachi • Shenzhen", m, 27.5);

    doc
      .setFont("helvetica", "bold")
      .setFontSize(14)
      .setTextColor(...teal);
    doc.text("ORDER DETAILS REPORT", m, 34);
    doc
      .setDrawColor(...teal)
      .setLineWidth(0.6)
      .line(m, 37, pw - m, 37);

    y = 44;

    const primaryDropOff = order.receivers?.[0]?.drop_off_details?.[0];

    const cards = [
      ["Order Form Number", order.rgl_booking_number],
      ["Status", order.status],
      [
        "Drop Method",
        order.drop_method || primaryDropOff?.drop_method || "N/A",
      ],
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
      doc.setDrawColor(...borderGrey).setFillColor(...lightGrey);
      doc.roundedRect(x, cy, cw, ch, 2, 2, "FD");
      doc.setFillColor(...teal).rect(x, cy, cw, 5, "F");
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
      y = pdfDrawSectionHeader(doc, title, y, m);
      const colW = (pw - m * 2 - 10) / 2;
      const rh = 8;
      details.forEach((pair, i) => {
        const col = i % 2,
          row = Math.floor(i / 2);
        const x = m + col * (colW + 10),
          dy = y + row * rh;
        doc
          .setFont("helvetica", "bold")
          .setFontSize(9)
          .setTextColor(...teal)
          .text(pair[0], x, dy);
        doc
          .setFont("helvetica", "normal")
          .setFontSize(9)
          .setTextColor(50, 50, 50)
          .text(String(pair[1] || "N/A"), x, dy + 4);
      });
      return y + Math.ceil(details.length / 2) * rh + 6;
    };

    checkPageBreak(30);
    y = drawKV(y, "ORDER INFORMATION", [
      ["Booking Ref", order.booking_ref],
      ["RGL Booking #", order.rgl_booking_number],
      ["Place of Loading", getPlaceName(order.place_of_loading)],
      ["Final Destination", getPlaceName(order.final_destination)],
      ["Place of Delivery", getPlaceName(order.place_of_delivery)],
    ]);

    checkPageBreak(30);
    y = drawKV(y, "SENDER INFORMATION", [
      ["Sender Name", order.sender_name],
      ["Contact Number", order.sender_contact],
      ["Email", order.sender_email],
      ["Address", order.sender_address],
      ["Sender Ref", order.sender_ref],
    ]);

    if (order.receivers?.length) {
      checkPageBreak(20);
      y = pdfDrawSectionHeader(doc, "RECEIVERS", y, m);
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
        ...manifestTableStyles,
        margin: { left: m, right: m },
        didParseCell(data) {
          if (data.section === "body" && data.row.index % 2 === 1)
            data.cell.styles.fillColor = lightGrey;
        },
      });
      y = doc.lastAutoTable.finalY + 6;

      for (const rec of order.receivers) {
        if (!rec.shippingdetails?.length) continue;
        checkPageBreak(30);
        doc
          .setFont("helvetica", "bold")
          .setFontSize(9)
          .setTextColor(...teal)
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
            s.status,
          ]),
          ...manifestTableStyles,
          styles: { ...manifestTableStyles.styles, fontSize: 8 },
          margin: { left: m, right: m },
          didParseCell(data) {
            if (data.section === "body" && data.row.index % 2 === 1)
              data.cell.styles.fillColor = lightGrey;
          },
        });
        y = doc.lastAutoTable.finalY + 6;

        rec.shippingdetails.forEach((sd, di) => {
          if (!sd.containerDetails?.length) return;
          checkPageBreak(30);
          doc
            .setFont("helvetica", "bold")
            .setFontSize(9)
            .setTextColor(...teal)
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
            ...manifestTableStyles,
            styles: { ...manifestTableStyles.styles, fontSize: 8 },
            margin: { left: m, right: m },
          });
          y = doc.lastAutoTable.finalY + 6;
        });
      }
    }
    checkPageBreak(26);
    if (order.order_remarks) {
      doc
        .setFillColor(...lightGrey)
        .roundedRect(m, y, pw - m * 2, 20, 2, 2, "F");
      doc
        .setFont("helvetica", "bold")
        .setFontSize(10)
        .setTextColor(...teal)
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

    pdfAddFooters(doc, pw, m, `Booking Ref: ${order.booking_ref || "N/A"}`);

    doc.save(`Order_${order.booking_ref || "Unknown"}.pdf`);
  };

  const handleGeneratePDF = async () => {
    if (!selectedOrder) return;
    setIsGeneratingPDF(true);
    const toastId = toast.loading("Generating PDF…");
    try {
      await generateOrderPDF(selectedOrder);
      toast.update(toastId, {
        render: "PDF downloaded successfully",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
    } catch (e) {
      console.error(e);
      toast.update(toastId, {
        render: "Failed to generate PDF",
        type: "error",
        isLoading: false,
        autoClose: 5000,
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
        {files.map((file, i) => {
          const url = resolveFileUrl(file);
          return (
            <ListItem
              key={file.id || i}
              divider={i !== files.length - 1}
              sx={{ py: 1.5, px: 2 }}
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title={url ? "View" : "No file URL"}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!url}
                        onClick={() =>
                          isImage(file) || isPdf(file)
                            ? setPreviewFile(file)
                            : window.open(url, "_blank", "noopener,noreferrer")
                        }
                        sx={{ color: T.teal }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Download">
                    <span>
                      <IconButton
                        size="small"
                        disabled={!url}
                        onClick={() => handleDownloadFile(file)}
                        sx={{ color: T.orange }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              }
            >
              <ListItemIcon>
                <AttachFileIcon sx={{ color: T.orange }} />
              </ListItemIcon>
              <ListItemText
                sx={{ pr: 9 }}
                primary={
                  <Typography fontWeight={600} noWrap>
                    {file?.originalname || "File"}
                  </Typography>
                }
                secondary={`${file?.mimetype || "Unknown"} • ${((file?.size || 0) / 1024).toFixed(1)} KB`}
              />
            </ListItem>
          );
        })}
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
                          component="a"
                          href={containerHref(c)}
                          target="_blank"
                          rel="noopener noreferrer"
                          clickable
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

  const renderApprovalBar = (rec) => {
    const approval = receiverApprovals[rec.id];
    const approved = approval?.approved === true;
    if (!canApprove && !approved) return null;

    return (
      <Box
        sx={{
          px: 2,
          py: 1,
          borderRadius: 2,
          border: `1px dashed ${T.orange}55`,
          bgcolor: approved ? T.orangeLight : T.grey50,
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
            fontWeight={700}
            color={T.grey600}
            sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            {rec.receiver_name} — Release Approval
          </Typography>
          {approved && approval.approvedAt && (
            <Typography variant="caption" display="block" color={T.grey600}>
              Approved on {formatDate(approval.approvedAt)}
            </Typography>
          )}
        </Box>

        {canApprove ? (
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={approved}
                disabled={approvingId === rec.id}
                onChange={(e) => handleToggleApproval(rec.id, e.target.checked)}
                sx={{ color: T.orange, "&.Mui-checked": { color: T.orange } }}
              />
            }
            label={
              <Typography variant="body2">
                Approved to release without payment
              </Typography>
            }
          />
        ) : (
          <Chip
            label="Approved without payment"
            size="small"
            sx={{
              bgcolor: T.orangeLight,
              color: T.orangeDark,
              fontWeight: 600,
            }}
          />
        )}
      </Box>
    );
  };

  const buildShipmentData = () => {
    const receivers = selectedOrder?.receivers || [];
    const items = receivers.flatMap((rec) =>
      (rec.shippingDetails || rec.shippingdetails || []).map((item) => ({
        rec,
        item,
      })),
    );
    const map = {};
    const unassigned = [];
    items.forEach(({ rec, item }) => {
      const cds = item.containerDetails || [];
      if (!cds.length) {
        unassigned.push({ rec, item });
        return;
      }
      cds.forEach((cd) => {
        const no = cd.container?.container_number || "Unknown";
        if (!map[no]) map[no] = { no, status: cd.status, eta: null, rows: [] };
        if (!map[no].eta && cd.eta) map[no].eta = cd.eta;
        map[no].rows.push({ rec, item, cd, split: cds.length > 1 });
      });
    });
    return { items, containers: Object.values(map), unassigned };
  };

  const itemLabel = (item) =>
    [item.category, item.subcategory].filter(Boolean).join(" › ") || "Item";

  const sumBy = (rows, fn) => rows.reduce((s, r) => s + Number(fn(r) || 0), 0);

  const groupHeader = (key, bg, border, children) => (
    <Box
      onClick={() => toggleExpand(key)}
      sx={{
        px: 2.5,
        py: 1.5,
        bgcolor: bg,
        borderBottom: expanded[key] ? `1px solid ${border}` : "none",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <ExpandMoreIcon
        sx={{
          color: T.teal,
          transition: "transform 0.2s",
          transform: expanded[key] ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
      {children}
    </Box>
  );

  const summaryChip = (label, bg, color) => (
    <Chip
      label={label}
      size="small"
      sx={{ bgcolor: bg, color, fontWeight: 700, fontSize: 11 }}
    />
  );

  const renderItemFull = (rec, item, activeNo) => {
    const ikey = `i-${activeNo || "x"}-${item.id}`;
    const inThis = activeNo
      ? (item.containerDetails || []).find(
          (cd) => cd.container?.container_number === activeNo,
        )
      : null;
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${T.grey200}`,
          bgcolor: T.white,
        }}
      >
        <Box
          onClick={() => toggleExpand(ikey)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <ExpandMoreIcon
            sx={{
              color: T.teal,
              transition: "transform 0.2s",
              transform: expanded[ikey] ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
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
              {itemLabel(item)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          {summaryChip(item.itemRef || "-", T.grey100, T.textSoft)}
          {inThis
            ? summaryChip(
                `${inThis.assign_total_box} of ${item.totalNumber} boxes here`,
                T.orangeLight,
                T.orangeDark,
              )
            : summaryChip(`${item.totalNumber} boxes`, T.tealLight, T.tealDark)}
          {item.weight
            ? summaryChip(`${item.weight} kg`, T.tealLight, T.tealDark)
            : null}
          {(item.containerDetails?.length || 0) > 1 &&
            summaryChip(
              `Split across ${item.containerDetails.length} containers`,
              T.orangeLight,
              T.orangeDark,
            )}
          {!item.containerDetails?.length &&
            summaryChip("Not assigned", T.orangeLight, T.orangeDark)}
          {summaryChip(item.status || "Order Created", "#00695c", "#fff")}
        </Box>

        <Collapse in={!!expanded[ikey]} unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={1.5}>
              {[
                ["Tracking ID", item.trackingId],
                ["Type", item.type],
                ["Status", item.status],
                ["ETA", isMulti(item) ? "See container assignments" : item.eta],
                ["ETD", item.etd],
                ["Total Number", item.totalNumber],
                ["Weight", item.weight ? `${item.weight} kg` : null],
                ["Pickup Location", item.pickupLocation],
                ["Delivery Address", item.deliveryAddress],
                ["Item Ref", item.itemRef],
                [
                  "Remaining Items",
                  item.remainingItems != null
                    ? String(item.remainingItems)
                    : null,
                ],
                ...(paymentOf(rec.id) ? [["Payment", paymentOf(rec.id)]] : []),
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
                      <TableRow>
                        {[
                          "Status",
                          "Container #",
                          "Consignment #",
                          "Assigned Weight",
                          "Assigned Boxes",
                          ...(isMulti(item) ? ["ETA"] : []),
                          "Remaining",
                        ].map((h) => (
                          <TableCell
                            key={h}
                            sx={{
                              bgcolor: T.teal,
                              color: "#fff",
                              fontWeight: 700,
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
                          sx={{
                            "&:last-child td": { borderBottom: 0 },
                            bgcolor:
                              activeNo &&
                              cd.container?.container_number === activeNo
                                ? T.orangeLight
                                : "inherit",
                          }}
                        >
                          <TableCell>
                            <Chip
                              label={cd.item_status || cd.status}
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
                            {cd.container?.container_number ? (
                              <Link
                                href={containerHref(
                                  cd.container.container_number,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                                sx={{ color: T.teal }}
                              >
                                {cd.container.container_number}
                              </Link>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {cd.consignment_id && cd.consignment_number ? (
                              <Link
                                href={consignmentHref(cd.consignment_id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                                sx={{ color: T.teal }}
                              >
                                {cd.consignment_number}
                              </Link>
                            ) : (
                              cd.consignment_number || "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            {cd.assign_weight
                              ? `${cd.assign_weight} kg`
                              : "N/A"}
                          </TableCell>
                          <TableCell>{cd.assign_total_box || "N/A"}</TableCell>
                          {isMulti(item) && (
                            <TableCell>
                              {cd.eta ? formatDate(cd.eta) : "N/A"}
                            </TableCell>
                          )}
                          <TableCell>{cd.remaining_items ?? "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    );
  };

  const renderContainerGroup = (g) => {
    const key = `c-${g.no}`;
    const boxes = sumBy(g.rows, (r) => r.cd.assign_total_box);
    const weight = sumBy(g.rows, (r) => r.cd.assign_weight);
    const receiverCount = new Set(g.rows.map((r) => r.rec.id)).size;
    const consignments = [
      ...new Map(
        g.rows
          .filter((r) => r.cd.consignment_number)
          .map((r) => [r.cd.consignment_number, r.cd.consignment_id]),
      ).entries(),
    ];

    return (
      <Card
        key={key}
        variant="outlined"
        sx={{ borderRadius: 2.5, border: `1px solid ${T.grey200}` }}
      >
        {groupHeader(
          key,
          T.tealLight,
          T.tealMid,
          <>
            <Link
              href={containerHref(g.no)}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              onClick={(e) => e.stopPropagation()}
              sx={{ fontWeight: 700, fontSize: 16, color: T.tealDark }}
            >
              {g.no}
            </Link>
            {consignments.map(([cNo, cId]) => (
              <Chip
                key={cNo}
                size="small"
                label={`Consignment: ${cNo}`}
                component="a"
                href={cId ? consignmentHref(cId) : undefined}
                target="_blank"
                rel="noopener noreferrer"
                clickable={!!cId}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  bgcolor: "#fff",
                  color: T.orangeDark,
                  border: `1px solid ${T.orange}88`,
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            ))}
            <Box sx={{ flex: 1 }} />
            {summaryChip(
              `${receiverCount} receiver${receiverCount > 1 ? "s" : ""}`,
              "#fff",
              T.tealDark,
            )}
            {summaryChip(
              `${g.rows.length} item${g.rows.length > 1 ? "s" : ""}`,
              "#fff",
              T.tealDark,
            )}
            {summaryChip(`${boxes} boxes`, "#fff", T.tealDark)}
            {summaryChip(`${weight.toLocaleString()} kg`, "#fff", T.tealDark)}
            {g.eta &&
              summaryChip(`ETA ${formatDate(g.eta)}`, "#e3f2fd", "#1565c0")}
          </>,
        )}
        <Collapse in={!!expanded[key]} unmountOnExit>
          <Stack spacing={2} sx={{ p: 2 }}>
            {g.rows
              .filter(
                (r, i, a) => a.findIndex((x) => x.item.id === r.item.id) === i,
              )
              .map(({ rec, item }) => (
                <Box key={item.id}>{renderItemFull(rec, item, g.no)}</Box>
              ))}
          </Stack>
        </Collapse>
      </Card>
    );
  };

  const renderUnassignedGroup = (unassigned) => {
    if (!unassigned.length) return null;
    const key = "u";
    return (
      <Card
        variant="outlined"
        sx={{ borderRadius: 2.5, border: `1px solid ${T.orange}88` }}
      >
        {groupHeader(
          key,
          T.orangeLight,
          "#ffe0b2",
          <>
            <Typography fontWeight={700} color={T.orangeDark}>
              Not Assigned to a Container
            </Typography>
            <Box sx={{ flex: 1 }} />
            {summaryChip(
              `${unassigned.length} item${unassigned.length > 1 ? "s" : ""}`,
              "#fff",
              T.orangeDark,
            )}
            {summaryChip(
              `${sumBy(unassigned, (r) => r.item.totalNumber)} boxes`,
              "#fff",
              T.orangeDark,
            )}
          </>,
        )}
        <Collapse in={!!expanded[key]} unmountOnExit>
          <Stack spacing={2} sx={{ p: 2 }}>
            {unassigned.map(({ rec, item }) => (
              <Box key={item.id}>{renderItemFull(rec, item)}</Box>
            ))}
          </Stack>
        </Collapse>
      </Card>
    );
  };

  const renderReceiverGroup = (rec) => {
    const key = `r-${rec.id}`;
    const items = rec.shippingDetails || rec.shippingdetails || [];
    const containerSet = new Set(
      items.flatMap((it) =>
        (it.containerDetails || []).map((cd) => cd.container?.container_number),
      ),
    );
    const qty = sumBy(items, (it) => it.totalNumber);
    return (
      <Card
        key={key}
        variant="outlined"
        sx={{ borderRadius: 2.5, border: `1px solid ${T.grey200}` }}
      >
        {groupHeader(
          key,
          T.tealLight,
          T.tealMid,
          <>
            <Typography
              fontWeight={700}
              color={T.tealDark}
              sx={{ fontSize: 16 }}
            >
              {rec.receiver_name}
            </Typography>
            <Box sx={{ flex: 1 }} />
            {paymentOf(rec.id) &&
              summaryChip(paymentOf(rec.id), "#fff", T.tealDark)}
            {summaryChip(
              `${items.length} item${items.length > 1 ? "s" : ""}`,
              "#fff",
              T.tealDark,
            )}
            {summaryChip(`${qty} boxes`, "#fff", T.tealDark)}
            {summaryChip(
              `${containerSet.size} container${containerSet.size === 1 ? "" : "s"}`,
              "#fff",
              T.tealDark,
            )}
          </>,
        )}
        <Collapse in={!!expanded[key]} unmountOnExit>
          <Stack spacing={2} sx={{ p: 2 }}>
            {renderApprovalBar(rec)}
            {items.map((item) => (
              <Box key={item.id}>{renderItemFull(rec, item)}</Box>
            ))}
          </Stack>
        </Collapse>
      </Card>
    );
  };

  const renderOrderItems = () => {
    const { items, containers, unassigned } = buildShipmentData();
    const receivers = selectedOrder?.receivers || [];
    if (!items.length)
      return (
        <Typography variant="body2" color="text.secondary">
          No shipping items found
        </Typography>
      );

    const totalQty = sumBy(items, ({ item }) => item.totalNumber);
    const partialCount = items.filter(
      ({ item }) => (item.containerDetails?.length || 0) > 1,
    ).length;
    const keys =
      shipView === "container"
        ? [
            ...containers.map((c) => `c-${c.no}`),
            ...(unassigned.length ? ["u"] : []),
          ]
        : receivers.map((r) => `r-${r.id}`);
    const allOpen = keys.length > 0 && keys.every((k) => expanded[k]);

    return (
      <Stack spacing={2.5}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
            gap: 2,
          }}
        >
          {jobStat("Receivers", receivers.length)}
          {jobStat("Items", items.length)}
          {jobStat("Total Boxes", totalQty)}
          {jobStat("Containers", containers.length)}
          {jobStat(
            "Needs Attention",
            unassigned.length + partialCount,
            unassigned.length + partialCount > 0
              ? "warning.main"
              : "success.main",
          )}
        </Box>

        {(unassigned.length > 0 || partialCount > 0) && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {unassigned.length > 0 &&
              `${unassigned.length} item${unassigned.length > 1 ? "s are" : " is"} not assigned to any container. `}
            {partialCount > 0 &&
              `${partialCount} item${partialCount > 1 ? "s are" : " is"} split across multiple containers (partial shipment).`}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={shipView}
            onChange={(_, v) => v && setShipView(v)}
          >
            <ToggleButton
              value="container"
              sx={{ textTransform: "none", px: 2 }}
            >
              By Container
            </ToggleButton>
            <ToggleButton
              value="receiver"
              sx={{ textTransform: "none", px: 2 }}
            >
              By Receiver
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            size="small"
            onClick={() =>
              setExpanded(
                allOpen ? {} : Object.fromEntries(keys.map((k) => [k, true])),
              )
            }
            sx={{ color: T.teal, textTransform: "none" }}
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </Button>
        </Box>

        {shipView === "container" ? (
          <>
            {receivers.map((rec) => (
              <Box key={rec.id}>{renderApprovalBar(rec)}</Box>
            ))}
            {containers.map(renderContainerGroup)}
            {renderUnassignedGroup(unassigned)}
          </>
        ) : (
          receivers.map(renderReceiverGroup)
        )}
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

  const renderCollections = () => {
    const receivers = selectedOrder?.receivers || [];
    const hasAny = receivers.some((r) => r.collections?.length > 0);
    if (!hasAny)
      return (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No collections recorded for this order.
        </Alert>
      );

    return (
      <Stack spacing={2.5}>
        {receivers.map((rec, ri) => {
          const cols = rec.collections || [];
          if (!cols.length) return null;
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
                  {cols.length} collection{cols.length > 1 ? "s" : ""}
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Grid container spacing={2}>
                  {cols.map((c, ci) => (
                    <Grid item xs={12} md={6} key={c.id || ci}>
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
                          Collection {ci + 1}
                        </Typography>
                        <Grid container spacing={1}>
                          {[
                            ["Method", c.collectionMethod],
                            ["Scope", c.collectionScope],
                            ["Emirates ID / CNIC", c.clientReceiverId],
                            ["Phone Number", c.clientReceiverMobile],
                            ["Vehicle Plate No", c.plateNo],
                            [
                              "Delivery Date",
                              c.deliveryDate
                                ? formatDate(c.deliveryDate)
                                : null,
                            ],
                          ].map(([label, val]) => (
                            <Grid item xs={12} sm={6} key={label}>
                              <FieldCard label={label} value={val} />
                            </Grid>
                          ))}
                        </Grid>

                        {c.items?.length > 0 && (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              color={T.grey600}
                              sx={{
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              Items Collected
                            </Typography>
                            <Stack
                              direction="row"
                              flexWrap="wrap"
                              gap={0.5}
                              sx={{ mt: 0.5 }}
                            >
                              {c.items.map((it, iri) => (
                                <Chip
                                  key={iri}
                                  label={`${it.itemRef} (${it.qtyDelivered})`}
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

                        {c.gatepass?.length > 0 && (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              color={T.grey600}
                              sx={{
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              Gatepass
                            </Typography>
                            <Stack
                              direction="row"
                              flexWrap="wrap"
                              gap={1}
                              sx={{ mt: 0.75 }}
                            >
                              {c.gatepass.map((g, gi) => (
                                <a
                                  key={gi}
                                  href={g.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Box
                                    component="img"
                                    src={g.url}
                                    alt="gatepass"
                                    sx={{
                                      width: 56,
                                      height: 56,
                                      objectFit: "cover",
                                      borderRadius: 1,
                                      border: `1px solid ${T.grey200}`,
                                    }}
                                  />
                                </a>
                              ))}
                            </Stack>
                          </Box>
                        )}
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

  const jobStat = (label, value, color) => (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
        bgcolor: "action.hover",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        sx={{ fontWeight: 700, fontSize: 18, color: color || "text.primary" }}
      >
        {value}
      </Typography>
    </Box>
  );

  const docBalanceAed = (d) =>
    d.currency === "AED"
      ? Number(d.balance || 0)
      : Number(d.balance || 0) * Number(d.exchangeRate || 0);

  const docTotalAed = (d) =>
    d.totalAed != null
      ? Number(d.totalAed)
      : d.currency === "AED"
        ? Number(d.total || 0)
        : 0;

  const fmtAed = (n) => (n == null ? "-" : fmtMoney(n, "AED"));

  const docPaidAed = (d) => docTotalAed(d) - docBalanceAed(d);

  const FinStatCard = ({ icon, value, label, sub, color }) => (
    <Box
      sx={{
        bgcolor: alpha(color, 0.1),
        borderRadius: 2.5,
        px: 1.75,
        py: 1.5,
      }}
    >
      <Box sx={{ color, display: "flex", mb: 0.5, "& svg": { fontSize: 18 } }}>
        {icon}
      </Box>
      <Typography
        sx={{ color, fontWeight: 700, fontSize: 20, lineHeight: 1.2 }}
      >
        {value}
      </Typography>
      <Typography
        sx={{ fontWeight: 600, fontSize: 13, color: "text.primary", mt: 0.25 }}
      >
        {label}
      </Typography>
      <Typography sx={{ color, fontWeight: 600, fontSize: 12 }}>
        {sub}
      </Typography>
    </Box>
  );

  const groupByForm = (docs) =>
    Object.values(
      docs.reduce((m, d) => {
        const k = d.formNumber || selectedOrder?.rgl_booking_number || "N/A";
        (m[k] ||= { key: k, docs: [] }).docs.push(d);
        return m;
      }, {}),
    );

  const jobTable = (docs, partyLabel, partyKey, kind) => {
    const groups = groupByForm(docs);
    const live = docs.filter((d) => d.status !== "void");
    const grandTotal = live.reduce((s, d) => s + docTotalAed(d), 0);
    const grandBalance = live.reduce((s, d) => s + docBalanceAed(d), 0);
    const grandPaid = live.reduce((s, d) => s + docPaidAed(d), 0);
    const headCell = { bgcolor: T.teal, color: "#fff", fontWeight: "bold" };

    return (
      <TableContainer
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: T.white,
        }}
      >
        <Table size="small" sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              {[
                `Form No / ${kind} No`,
                partyLabel,
                "Date",
                "Due Date",
                "Status",
              ].map((h) => (
                <TableCell key={h} sx={headCell}>
                  {h}
                </TableCell>
              ))}
              <TableCell align="right" sx={headCell}>
                Total (FCA)
              </TableCell>
              <TableCell align="right" sx={headCell}>
                Paid (AED)
              </TableCell>
              <TableCell align="right" sx={headCell}>
                Balance (AED)
              </TableCell>
              <TableCell align="right" sx={headCell}>
                Total (AED)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No {kind.toLowerCase()}s found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {groups.map((g) => {
                  const k = `f-${kind}-${g.key}`;
                  const open = expanded[k] ?? true;
                  const gl = g.docs.filter((d) => d.status !== "void");
                  return [
                    <TableRow
                      key={k}
                      hover
                      onClick={() => setExpanded((p) => ({ ...p, [k]: !open }))}
                      sx={{ cursor: "pointer", bgcolor: T.grey100 }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: T.tealDark }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <ExpandMoreIcon
                            fontSize="small"
                            sx={{
                              color: T.teal,
                              transition: "transform 0.2s",
                              transform: open
                                ? "rotate(0deg)"
                                : "rotate(-90deg)",
                            }}
                          />
                          {g.key}
                        </Box>
                      </TableCell>
                      <TableCell colSpan={4}>
                        <Chip
                          size="small"
                          label={`${g.docs.length} ${kind.toLowerCase()}${g.docs.length > 1 ? "s" : ""}`}
                          sx={{
                            bgcolor: T.tealMid,
                            color: T.tealDark,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell />
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {fmtMoney(sumBy(gl, docPaidAed), "AED")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {fmtMoney(sumBy(gl, docBalanceAed), "AED")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {fmtMoney(sumBy(gl, docTotalAed), "AED")}
                      </TableCell>
                    </TableRow>,
                    ...(open
                      ? g.docs.map((d) => (
                          <TableRow hover key={d.id}>
                            <TableCell sx={{ pl: 7, fontWeight: 600 }}>
                              {d.number}
                            </TableCell>
                            <TableCell>{d[partyKey]}</TableCell>
                            <TableCell>
                              {d.date ? formatDate(d.date) : "-"}
                            </TableCell>
                            <TableCell>
                              {d.dueDate ? formatDate(d.dueDate) : "-"}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={fmtStatus(d.status)}
                                size="small"
                                variant="outlined"
                                color={docStatusColor(d.status)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {d.currency === "AED"
                                ? "-"
                                : fmtMoney(d.total, d.currency)}
                            </TableCell>
                            <TableCell align="right">
                              {d.totalAed == null || d.balanceAed == null
                                ? "-"
                                : fmtAed(d.totalAed - d.balanceAed)}
                            </TableCell>
                            <TableCell align="right">
                              {fmtAed(d.balanceAed)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {fmtAed(d.totalAed)}
                            </TableCell>
                          </TableRow>
                        ))
                      : []),
                  ];
                })}
                <TableRow sx={{ bgcolor: T.tealLight }}>
                  <TableCell
                    colSpan={5}
                    align="right"
                    sx={{ fontWeight: 700, color: T.tealDark }}
                  >
                    Grand Total (AED)
                  </TableCell>
                  <TableCell />
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, color: T.tealDark }}
                  >
                    {fmtMoney(grandPaid, "AED")}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, color: T.tealDark }}
                  >
                    {fmtMoney(grandBalance, "AED")}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, color: T.tealDark }}
                  >
                    {fmtMoney(grandTotal, "AED")}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderJobDetails = () => {
    if (!billing) {
      return (
        <Typography variant="body2" color="text.secondary">
          {billingLoading || syncingZoho
            ? "Loading billing data..."
            : "No invoices or bills found for this order. Click Sync Zoho to fetch them."}
        </Typography>
      );
    }
    const margin =
      billing.invoiceTotal > 0 && billing.expectedProfit !== null
        ? `${((billing.expectedProfit / billing.invoiceTotal) * 100).toFixed(1)}%`
        : "-";
    const invoices = billing.invoices || [];
    const bills = billing.vendorBills || [];
    const isInvoices = financeView === "invoices";

    return (
      <Stack spacing={3}>
        {billing.rateMissing ? (
          <Alert severity="warning">
            Some documents have no exchange rate yet. Click "Sync Zoho" to load
            it.
          </Alert>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                lg: "repeat(6, 1fr)",
              },
              gap: 1.5,
            }}
          >
            <FinStatCard
              color="#2563eb"
              icon={<DescriptionOutlinedIcon />}
              value={fmtMoney(billing.invoiceTotal, "AED")}
              label="Total Invoice"
              sub={`${invoices.filter((d) => d.status !== "void").length} Invoices`}
            />
            <FinStatCard
              color="#d97706"
              icon={<ReceiptLongOutlinedIcon />}
              value={fmtMoney(billing.vendorTotal, "AED")}
              label="Total Bills"
              sub={`${bills.filter((d) => d.status !== "void").length} Bills`}
            />
            <FinStatCard
              color="#16a34a"
              icon={<AccountBalanceWalletOutlinedIcon />}
              value={fmtMoney(billing.received, "AED")}
              label="Total Received"
              sub={`${
                invoices.filter((d) => d.status !== "void" && docPaidAed(d) > 0)
                  .length
              } Receipts`}
            />
            <FinStatCard
              color="#7c3aed"
              icon={<CreditCardOutlinedIcon />}
              value={fmtMoney(billing.paidOut, "AED")}
              label="Total Paid"
              sub={`${
                bills.filter((d) => d.status !== "void" && docPaidAed(d) > 0)
                  .length
              } Payments`}
            />
            <FinStatCard
              color="#059669"
              icon={<TrendingUpIcon />}
              value={fmtMoney(billing.expectedProfit, "AED")}
              label="Net Profit"
              sub={`${margin} Margin`}
            />
            <FinStatCard
              color="#e11d48"
              icon={<PieChartOutlineIcon />}
              value={margin}
              label="Profit Margin"
              sub={`${fmtMoney(billing.expectedProfit, "AED")} Profit`}
            />
          </Box>
        )}

        <Divider />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={financeView}
            onChange={(_, v) => v && setFinanceView(v)}
          >
            <ToggleButton
              value="invoices"
              sx={{ textTransform: "none", px: 2.5 }}
            >
              Invoices ({invoices.length})
            </ToggleButton>
            <ToggleButton value="bills" sx={{ textTransform: "none", px: 2.5 }}>
              Bills ({bills.length})
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary">
            Click a form number to collapse or expand. Void documents are
            excluded from totals.
          </Typography>
        </Box>

        {isInvoices
          ? jobTable(invoices, "Customer", "customer", "Invoice")
          : jobTable(bills, "Vendor", "vendor", "Bill")}
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
    ...(canViewJobDetails
      ? [
          {
            label: "Finance",
            icon: <PaymentsIcon sx={{ fontSize: 18, color: T.teal }} />,
          },
        ]
      : []),
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
            {selectedOrder?.status && (
              <Chip
                label={selectedOrder.status}
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
                        "Tracking ID": selectedOrder.tracking_id,
                        "Booking Ref": selectedOrder.booking_ref,
                        "RGL Booking #": selectedOrder.rgl_booking_number,
                        Status: selectedOrder.status,
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

                  <Card
                    variant="outlined"
                    sx={{ borderRadius: 2.5, border: `1px solid ${T.grey200}` }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <SectionHeader
                        icon={
                          <InventoryIcon sx={{ color: T.teal, fontSize: 20 }} />
                        }
                        title="Collections"
                      />
                      {renderCollections()}
                    </CardContent>
                  </Card>
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

              {canViewJobDetails && (
                <TabPanel value={tabValue} index={5}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      border: `1px solid ${T.grey200}`,
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <SectionHeader
                          icon={
                            <PaymentsIcon
                              sx={{ color: T.teal, fontSize: 20 }}
                            />
                          }
                          title="Finance"
                        />
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 0.5,
                          }}
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={handleSyncZoho}
                            disabled={syncingZoho}
                            startIcon={
                              syncingZoho ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <SyncIcon />
                              )
                            }
                            sx={{ borderColor: T.teal, color: T.teal }}
                          >
                            {syncingZoho ? "Syncing…" : "Sync Zoho"}
                          </Button>
                          <Typography variant="caption" color="text.secondary">
                            Last synced:{" "}
                            {billing ? formatDate(getLastSyncedAt()) : "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                      {renderJobDetails()}
                    </CardContent>
                  </Card>
                </TabPanel>
              )}
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
      <Dialog
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontWeight={700} noWrap>
            {previewFile?.originalname}
          </Typography>
          <Box>
            <IconButton onClick={() => handleDownloadFile(previewFile)}>
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={() => setPreviewFile(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ p: 0, bgcolor: T.grey100, textAlign: "center" }}
        >
          {previewFile && isImage(previewFile) && (
            <Box
              component="img"
              src={resolveFileUrl(previewFile)}
              alt={previewFile.originalname}
              sx={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain" }}
            />
          )}
          {previewFile && isPdf(previewFile) && (
            <iframe
              title={previewFile.originalname}
              src={resolveFileUrl(previewFile)}
              style={{ width: "100%", height: "75vh", border: 0 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderModalView;
