import { useState, useEffect, useRef, useContext } from "react";
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
import { AppContext } from "../../context/AppContext";
import { HouseBillOfLading } from "../../documents/hblGenerator";
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
import HistoryIcon from "@mui/icons-material/History";
import { getStatusColors } from "../../Utlis/statusColors";
import dayjs from "dayjs";

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

const SectionHeader = ({ icon, title, count, action, mb = 2.5 }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb }}>
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
    {action && <Box sx={{ ml: "auto" }}>{action}</Box>}
  </Box>
);

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(String(text));
    toast.success(`Copied: ${text}`);
  } catch {
    toast.error("Copy failed");
  }
};

const FieldCard = ({ label, value, accent = false, copyable = false }) => {
  const canCopy = copyable && value && value !== "N/A";
  return (
    <Box
      onClick={canCopy ? () => copyText(value) : undefined}
      title={canCopy ? "Click to copy" : undefined}
      sx={{
        p: 1.75,
        borderRadius: 2,
        border: `1px solid ${accent ? T.orange + "55" : T.grey200}`,
        bgcolor: accent ? T.orangeLight : T.grey50,
        height: "100%",
        cursor: canCopy ? "pointer" : "default",
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
};

const FieldGrid = ({ data, cols = 3, copyKeys = [] }) => (
  <Grid container spacing={1.5}>
    {Object.entries(data).map(([key, val]) => (
      <Grid item xs={12} sm={6} md={12 / cols} key={key}>
        <FieldCard label={key} value={val} copyable={copyKeys.includes(key)} />
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

const overdueDays = (d, rfd) => {
  if (d.status !== "overdue" || !rfd) return null;
  const n = dayjs().startOf("day").diff(dayjs(rfd).startOf("day"), "day") + 1;
  return n > 0 ? n : null;
};

const statusLabel = (d, rfd) => {
  const n = overdueDays(d, rfd);
  return n ? `Overdue (${n}d)` : fmtStatus(d.status);
};

const overdueNote = (d, kind, rfd) => {
  const n = kind === "Invoice" ? overdueDays(d, rfd) : null;
  if (!n) return null;
  return (
    <Typography
      variant="caption"
      display="block"
      sx={{ color: "error.main", fontWeight: 600, mt: 0.25 }}
    >
      Overdue by {n} {n === 1 ? "day" : "days"} · late charges may apply
    </Typography>
  );
};

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

  const [previewDoc, setPreviewDoc] = useState(null);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const { companies } = useContext(AppContext);
  const [hblCompanyId, setHblCompanyId] = useState("");
  const [hblHtml, setHblHtml] = useState("");
  const [hblLoading, setHblLoading] = useState(false);
  const [hblDownloading, setHblDownloading] = useState(false);
  const hblFrameRef = useRef(null);

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

  const handleOpenHbl = async () => {
    const company = (companies || []).find((c) => c.id === hblCompanyId);
    if (!selectedOrder?.id || !company) return;
    setHblLoading(true);
    try {
      const { data } = await api.get(
        `/api/orders/pdf-data/${selectedOrder.id}`,
      );
      const normalized = {
        ...data,
        sender_name: data.sender?.name || data.sender_name || "",
        sender_address: data.sender?.address || data.sender_address || "",
      };
      setHblHtml(HouseBillOfLading(normalized, company, getPlaceName));
    } catch {
      toast.error("Failed to load HBL data.");
    } finally {
      setHblLoading(false);
    }
  };

  const handleDownloadHbl = async () => {
    const doc = hblFrameRef.current?.contentDocument;
    if (!doc || hblDownloading) return;
    setHblDownloading(true);
    try {
      if (doc.fonts?.ready) await doc.fonts.ready;
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });
      const PW = 210;
      const PH = 297;
      const nodes = Array.from(doc.body.children).filter(
        (el) => !/^(STYLE|SCRIPT)$/.test(el.tagName),
      );
      let first = true;
      for (const el of nodes) {
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        const pagePx = Math.floor((canvas.width * PH) / PW);
        for (let y = 0; y < canvas.height; y += pagePx) {
          const sliceH = Math.min(pagePx, canvas.height - y);
          if (sliceH < 4) break;
          const part = document.createElement("canvas");
          part.width = canvas.width;
          part.height = sliceH;
          const ctx = part.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, part.width, part.height);
          ctx.drawImage(
            canvas,
            0,
            y,
            canvas.width,
            sliceH,
            0,
            0,
            canvas.width,
            sliceH,
          );
          if (!first) pdf.addPage();
          first = false;
          pdf.addImage(
            part.toDataURL("image/jpeg", 0.95),
            "JPEG",
            0,
            0,
            PW,
            (sliceH * PW) / canvas.width,
          );
        }
      }
      pdf.save(
        `HBL-${selectedOrder?.rgl_booking_number || selectedOrder?.id}.pdf`,
      );
    } catch (err) {
      console.error("HBL download failed:", err);
      toast.error("Failed to download HBL.");
    } finally {
      setHblDownloading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const pickDate = (list, mode) => {
    const ds = list
      .filter(Boolean)
      .map((x) => dayjs(x))
      .filter((x) => x.isValid());
    if (!ds.length) return "-";
    const t = ds.reduce((a, b) =>
      mode === "max" ? (b.isAfter(a) ? b : a) : b.isBefore(a) ? b : a,
    );
    return t.format("MMM DD, YYYY");
  };

  const getLastSync = () => {
    let best = null;
    [...(billing?.invoices || []), ...(billing?.vendorBills || [])].forEach(
      (d) => {
        if (!d.synced_at) return;
        const t = new Date(d.synced_at).getTime();
        if (Number.isFinite(t) && (!best || t > best.at)) {
          best = { at: t, by: d.synced_by };
        }
      },
    );
    return best;
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
      setHblHtml("");
      setHblCompanyId("");
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

  const openDocPdf = async (kind, doc) => {
    setPdfLoadingId(doc.id);
    try {
      const path =
        kind === "Bill"
          ? `/api/zoho-invoice/bill/${doc.id}/pdf`
          : `/api/zoho-invoice/${doc.id}/pdf`;
      const { data } = await api.get(path, { responseType: "blob" });
      setPreviewDoc({
        kind,
        doc,
        url: URL.createObjectURL(new Blob([data], { type: "application/pdf" })),
      });
    } catch {
      toast.error("Failed to load PDF.");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const closePreview = () => {
    if (previewDoc?.url) URL.revokeObjectURL(previewDoc.url);
    setPreviewDoc(null);
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
    const ph = doc.internal.pageSize.getHeight();
    const m = 14;
    const { teal, orange, lightGrey, borderGrey } = BRAND;
    const BOTTOM = ph - 20;
    let y = 0;

    const ensure = (needed = 20) => {
      if (y + needed > BOTTOM) {
        doc.addPage();
        y = 20;
      }
    };
    const val = (v) =>
      v === null || v === undefined || v === "" ? "N/A" : String(v);
    const dt = (v) => (v ? formatDate(v) : "N/A");
    const zebra = (data) => {
      if (data.section === "body" && data.row.index % 2 === 1)
        data.cell.styles.fillColor = lightGrey;
    };
    const tableOpts = {
      ...manifestTableStyles,
      styles: {
        ...manifestTableStyles.styles,
        fontSize: 8,
        overflow: "linebreak",
      },
      margin: { left: m, right: m },
    };
    const subTitle = (text) => {
      ensure(20);
      doc
        .setFont("helvetica", "bold")
        .setFontSize(9)
        .setTextColor(...teal);
      doc.text(text, m, y);
      y += 4;
    };
    const table = (head, body, extra = {}) => {
      autoTable(doc, {
        startY: y,
        head: [head],
        body,
        ...tableOpts,
        didParseCell: zebra,
        ...extra,
      });
      y = doc.lastAutoTable.finalY + 6;
    };
    const empty = (text) => {
      ensure(10);
      doc
        .setFont("helvetica", "italic")
        .setFontSize(9)
        .setTextColor(120, 120, 120);
      doc.text(text, m, y + 2);
      y += 10;
    };
    const section = (title) => {
      ensure(30);
      y = pdfDrawSectionHeader(doc, title, y, m);
    };
    const kv = (title, pairs) => {
      section(title);
      const colW = (pw - m * 2 - 10) / 2;
      for (let i = 0; i < pairs.length; i += 2) {
        const row = pairs.slice(i, i + 2).map(([label, v], ci) => ({
          label,
          lines: doc.splitTextToSize(val(v), colW),
          x: m + ci * (colW + 10),
        }));
        const h = 4 + Math.max(...row.map((c) => c.lines.length)) * 4 + 3;
        ensure(h);
        row.forEach((c) => {
          doc
            .setFont("helvetica", "bold")
            .setFontSize(9)
            .setTextColor(...teal);
          doc.text(c.label, c.x, y);
          doc.setFont("helvetica", "normal").setTextColor(50, 50, 50);
          doc.text(c.lines, c.x, y + 4);
        });
        y += h;
      }
      y += 3;
    };
    const fileTable = (title, files) => {
      section(title);
      if (!files.length) return empty("No files uploaded");
      const urls = files.map(resolveFileUrl);
      table(
        ["#", "File", "Type", "Size", "Link"],
        files.map((f, i) => [
          i + 1,
          f.originalname || "File",
          f.mimetype || "N/A",
          `${((f.size || 0) / 1024).toFixed(1)} KB`,
          urls[i] ? "Open file" : "N/A",
        ]),
        {
          didParseCell(data) {
            zebra(data);
            if (
              data.section === "body" &&
              data.column.index === 4 &&
              urls[data.row.index]
            ) {
              data.cell.styles.textColor = teal;
              data.cell.styles.fontStyle = "bold";
            }
          },
          didDrawCell(data) {
            if (
              data.section === "body" &&
              data.column.index === 4 &&
              urls[data.row.index]
            ) {
              doc.link(
                data.cell.x,
                data.cell.y,
                data.cell.width,
                data.cell.height,
                {
                  url: urls[data.row.index],
                },
              );
            }
          },
        },
      );
    };

    const logo = await loadImageAsBase64("./logo-2.png");
    if (logo) doc.addImage(logo, "PNG", m, 5, 55, 12);

    doc
      .setFont("helvetica", "bold")
      .setFontSize(10)
      .setTextColor(...orange);
    doc.text(`Booking Ref: ${val(order.booking_ref)}`, pw - m, 8, {
      align: "right",
    });
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(60, 60, 60);
    [
      `Status: ${val(order.status)}`,
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

    const cards = [
      ["Order Form Number", order.rgl_booking_number],
      ["Tracking ID", order.tracking_id],
      ["Status", order.status],
      ["Transport Type", order.transport_type],
      [
        "Created At",
        order.created_at ? new Date(order.created_at).toLocaleString() : null,
      ],
      ["Total Assigned Qty", order.total_assigned_qty],
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
        .setTextColor(255, 255, 255);
      doc.text(item[0], x + 2, cy + 4);
      doc.setFont("helvetica", "normal").setTextColor(50, 50, 50);
      doc.text(doc.splitTextToSize(val(item[1]), cw - 6)[0], x + 3, cy + 11);
    });
    y += Math.ceil(cards.length / 2) * (ch + 6) + 5;

    // ── Order info ──────────────────────────────────────────
    kv("ORDER INFORMATION", [
      ["Booking Ref", order.booking_ref],
      ["RGL Booking #", order.rgl_booking_number],
      ["Point of Origin", getPlaceName(order.point_of_origin)],
      ["Place of Loading", getPlaceName(order.place_of_loading)],
      ["Place of Delivery", getPlaceName(order.place_of_delivery)],
      ["Final Destination", getPlaceName(order.final_destination)],
      ["Shipping Line", order.shipping_line],
      ["Collection Scope", order.collection_scope],
    ]);

    // ── Sender ──────────────────────────────────────────────
    kv("SENDER INFORMATION", [
      ["Sender Name", order.sender_name],
      ["Contact Number", order.sender_contact],
      ["Email", order.sender_email],
      ["Sender Ref", order.sender_ref],
      ["Address", order.sender_address],
      ["Remarks", order.sender_remarks],
    ]);

    const receivers = order.receivers || [];
    section("RECEIVERS");
    if (!receivers.length) empty("No receivers found");
    else {
      table(
        [
          "Receiver",
          "Tracking ID",
          "Status",
          "ETA",
          "Qty",
          "Weight",
          "Contact",
          "Address",
        ],
        receivers.map((r) => [
          r.receiver_name,
          r.tracking_id ||
            (r.shippingDetails || r.shippingdetails || [])[0]?.trackingId ||
            "N/A",
          r.status,
          r.eta ? formatDate(r.eta) : "N/A",
          r.etd ? formatDate(r.etd) : "N/A",
          r.total_number,
          r.total_weight,
          r.receiver_contact,
          r.receiver_address,
        ]),
      );

      for (const rec of receivers) {
        const items = rec.shippingDetails || rec.shippingdetails || [];
        if (!items.length) continue;
        subTitle(`Items for: ${val(rec.receiver_name)}`);
        table(
          [
            "Item Ref",
            "Category",
            "Subcategory",
            "Type",
            "Qty",
            "Weight",
            "Status",
            "ETA",
          ],
          items.map((s) => [
            s.itemRef,
            s.category,
            s.subcategory,
            s.type,
            s.totalNumber,
            s.weight,
            s.status,
            s.eta ? formatDate(s.eta) : "N/A",
          ]),
        );
        items.forEach((sd) => {
          if (!sd.containerDetails?.length) return;
          subTitle(`Container Assignments – ${sd.itemRef || itemLabel(sd)}`);
          table(
            [
              "Container #",
              "Consignment #",
              "Boxes",
              "Weight",
              "Status",
              "ETA",
              "Remaining",
            ],
            sd.containerDetails.map((cd) => [
              cd.container?.container_number || "N/A",
              cd.consignment_number || "N/A",
              cd.assign_total_box,
              cd.assign_weight,
              cd.item_status || cd.status,
              cd.eta ? formatDate(cd.eta) : "N/A",
              cd.remaining_items,
            ]),
          );
        });
      }
    }

    // ── Transport / third party / drop-off ──────────────────
    kv("TRANSPORT DETAILS", [
      ["Transport Type", order.transport_type],
      ["Third Party Transport", order.third_party_transport],
      ["Driver Name", order.driver_name],
      ["Driver Contact", order.driver_contact],
      ["Driver NIC", order.driver_nic],
      ["Pickup Location", order.driver_pickup_location],
      ["Truck Number", order.truck_number],
    ]);

    const dropRows = receivers.flatMap((r) =>
      (r.drop_off_details || []).map((d) => [
        r.receiver_name,
        d.drop_method,
        d.dropoff_name,
        d.drop_off_cnic,
        d.drop_off_mobile,
        d.plate_no,
        d.drop_date ? formatDate(d.drop_date) : "N/A",
      ]),
    );
    if (dropRows.length) {
      section("DROP-OFF DETAILS");
      table(
        [
          "Receiver",
          "Method",
          "Name",
          "CNIC / ID",
          "Mobile",
          "Plate No",
          "Drop Date",
        ],
        dropRows,
      );
    }

    section("COLLECTIONS");
    const colRows = receivers.flatMap((r) =>
      (r.collections || []).map((c) => [
        r.receiver_name,
        c.collectionMethod,
        c.collectionScope,
        c.clientReceiverId,
        c.clientReceiverMobile,
        c.plateNo,
        c.deliveryDate ? formatDate(c.deliveryDate) : "N/A",
        (c.items || [])
          .map((it) => `${it.itemRef} (${it.qtyDelivered})`)
          .join(", ") || "N/A",
      ]),
    );
    if (!colRows.length) empty("No collections recorded");
    else
      table(
        [
          "Receiver",
          "Method",
          "Scope",
          "ID / CNIC",
          "Phone",
          "Plate No",
          "Delivery Date",
          "Items Collected",
        ],
        colRows,
      );

    const gatepasses = [
      ...(order.gatepass || []),
      ...receivers.flatMap((r) =>
        (r.collections || []).flatMap((c) => c.gatepass || []),
      ),
    ];
    fileTable("ATTACHMENTS", order.attachments || []);
    fileTable("GATEPASS", gatepasses);

    const tracking = order.tracking || [];
    if (tracking.length) {
      section("STATUS HISTORY");
      table(
        [
          "Status",
          "Module",
          "Container #",
          "Consignment #",
          "Created",
          "Created By",
          "ETA",
          "ETD",
        ],
        tracking.map((t) => [
          t.status,
          t.module,
          t.container_number,
          t.consignment_number,
          fmtDMY(t.created_time),
          t.created_by_name || t.created_by,
          fmtDMY(t.eta),
        ]),
      );
    }

    if (canViewJobDetails && billing) {
      const billsList = (billing.vendorBills || []).filter(
        (d) => d.status !== "void",
      );
      const billsPaid = billsList.reduce((s, d) => s + docPaidAed(d), 0);
      kv("FINANCE SUMMARY (AED)", [
        ["Total Invoice", fmtMoney(billing.invoiceTotal, "AED")],
        ["Total Bills", fmtMoney(billing.vendorTotal, "AED")],
        ["Total Received", fmtMoney(billing.received, "AED")],
        ["Total Bills Paid", fmtMoney(billsPaid, "AED")],
        ["Net Profit", fmtMoney(billing.expectedProfit, "AED")],
      ]);
    }

    if (order.order_remarks) {
      const lines = doc.splitTextToSize(order.order_remarks, pw - m * 2 - 6);
      const h = 12 + lines.length * 4;
      ensure(h + 4);
      doc
        .setFillColor(...lightGrey)
        .roundedRect(m, y, pw - m * 2, h, 2, 2, "F");
      doc
        .setFont("helvetica", "bold")
        .setFontSize(10)
        .setTextColor(...teal);
      doc.text("Order Remarks", m + 3, y + 6);
      doc
        .setFont("helvetica", "normal")
        .setFontSize(9)
        .setTextColor(50, 50, 50);
      doc.text(lines, m + 3, y + 11);
      y += h + 4;
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

  const allGatepasses = [
    ...(selectedOrder?.gatepass || []),
    ...(selectedOrder?.receivers || []).flatMap((r) =>
      (r.collections || []).flatMap((c) => c.gatepass || []),
    ),
  ];

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
                    [
                      "Tracking ID",
                      rec.tracking_id ||
                        (rec.shippingDetails || [])[0]?.trackingId,
                    ],
                    ["Full / Partial", rec.full_partial],
                    ["Qty Delivered", rec.qty_delivered],
                    ["Remarks", rec.remarks],
                  ].map(([label, val]) => (
                    <Grid item xs={12} sm={6} md={4} key={label}>
                      <FieldCard
                        label={label}
                        value={val}
                        copyable={label === "Tracking ID"}
                      />
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
        if (!map[no].eta && cd.eta) {
          map[no].eta = cd.eta;
          map[no].etaStatus = cd.item_status;
        }
        map[no].rows.push({ rec, item, cd, split: cds.length > 1 });
      });
    });
    return { items, containers: Object.values(map), unassigned };
  };

  const itemLabel = (item) =>
    [item.category, item.subcategory].filter(Boolean).join(" › ") || "Item";

  const etaLabel = (status) =>
    status === "Shipment Delivered"
      ? "Delivered"
      : status === "Ready for Loading" || status === "Ready for Delivery"
        ? "RFD"
        : "ETA";

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
          {summaryChip(
            inThis?.item_status || item.status || "Order Created",
            "#00695c",
            "#fff",
          )}
        </Box>

        <Collapse in={!!expanded[ikey]} unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={1.5}>
              {[
                ["Tracking ID", item.trackingId],
                ["Type", item.type],
                ["Status", inThis?.item_status || item.status],
                [
                  etaLabel(inThis?.item_status || item.status),
                  inThis
                    ? inThis.eta
                    : isMulti(item)
                      ? "See container assignments"
                      : item.eta,
                ],
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
                ...(item.rfdDate
                  ? [
                      [
                        "RFD By",
                        item.rfdByEmail && item.rfdBy !== item.rfdByEmail
                          ? `${item.rfdBy} (${item.rfdByEmail})`
                          : item.rfdByEmail || item.rfdBy,
                      ],
                    ]
                  : []),
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
              summaryChip(
                `${etaLabel(g.etaStatus)} ${formatDate(g.eta)}`,
                "#e3f2fd",
                "#1565c0",
              )}
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
                              Gatepass ({c.gatepass.length})
                            </Typography>
                            <Stack
                              direction="row"
                              flexWrap="wrap"
                              gap={1.5}
                              sx={{ mt: 0.75 }}
                            >
                              {c.gatepass.map((g, gi) => (
                                <Stack
                                  key={g.id || gi}
                                  alignItems="center"
                                  spacing={0.25}
                                >
                                  <Box
                                    component="img"
                                    src={g.url}
                                    alt="gatepass"
                                    onClick={() =>
                                      setPreviewFile({
                                        ...g,
                                        mimetype: g.mimetype || "image/png",
                                      })
                                    }
                                    sx={{
                                      width: 56,
                                      height: 56,
                                      objectFit: "cover",
                                      borderRadius: 1,
                                      border: `1px solid ${T.grey200}`,
                                      cursor: "pointer",
                                      "&:hover": {
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                      },
                                    }}
                                  />
                                  <Tooltip title="Download">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleDownloadFile({
                                          ...g,
                                          originalname:
                                            g.originalname ||
                                            `Gatepass_${selectedOrder.booking_ref}_${gi + 1}.png`,
                                        })
                                      }
                                      sx={{ color: T.orange }}
                                    >
                                      <DownloadIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
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

  const fmtDMY = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getFullYear()}`;
  };

  const getModuleColors = (module) => {
    switch (module?.toLowerCase()) {
      case "orders":
        return { bg: "#e3f2fd", text: "#1565c0" };
      case "containers":
        return { bg: "#fff3e0", text: "#e65100" };
      case "consignments":
        return { bg: "#e8f5e9", text: "#2e7d32" };
      default:
        return { bg: "#f5f5f5", text: "#616161" };
    }
  };

  // Status history is built per receiver -> per item. Container / consignment
  // are optional details on an event (early statuses have neither), never the
  // grouping key.
  const buildHistoryGroups = () => {
    const { items } = buildShipmentData();
    const rows = [...(selectedOrder?.tracking || [])].sort(
      (a, b) =>
        new Date(b.created_time) - new Date(a.created_time) ||
        (b.id || 0) - (a.id || 0),
    );

    const byReceiverRef = {};
    const byRef = {};
    items.forEach(({ rec, item }) => {
      const ref = item.itemRef || `id-${item.id}`;
      byReceiverRef[`${rec.id}|${ref}`] = { rec, item };
      if (!byRef[ref]) byRef[ref] = { rec, item };
    });

    const groups = {};
    (selectedOrder?.receivers || []).forEach((rec) => {
      groups[rec.id] = {
        key: rec.id,
        name: rec.receiver_name,
        items: (rec.shippingDetails || rec.shippingdetails || []).map(
          (item) => ({
            key: `${rec.id}-${item.id}`,
            ref: item.itemRef || `id-${item.id}`,
            label: itemLabel(item),
            containerDetails: item.containerDetails || [],
            rows: [],
          }),
        ),
      };
    });
    const orderLevel = { key: "order", name: "Order Level", rows: [] };

    rows.forEach((r) => {
      const hit =
        byReceiverRef[`${r.receiver_id}|${r.item_ref}`] || byRef[r.item_ref];
      const g = hit && groups[hit.rec.id];
      const bucket = g?.items.find(
        (i) => i.ref === (hit.item.itemRef || `id-${hit.item.id}`),
      );
      if (bucket) bucket.rows.push(r);
      else orderLevel.rows.push(r);
    });

    // Collapse the per-container duplicates of the same status into one event
    const mergeEvents = (list) => {
      const out = [];
      list.forEach((r) => {
        const minute = dayjs(r.created_time).format("YYYY-MM-DD HH:mm");
        const prev = out.find(
          (e) => e.status === r.status && e.minute === minute,
        );
        const target =
          prev ||
          (out.push({
            id: r.id,
            status: r.status,
            minute,
            created_time: r.created_time,
            module: r.module,
            by: r.created_by_name || "",
            eta: r.eta,
            containers: [],
            consignments: [],
          }),
          out[out.length - 1]);
        if (
          r.container_number &&
          !target.containers.includes(r.container_number)
        )
          target.containers.push(r.container_number);
        if (
          r.consignment_number &&
          !target.consignments.some((c) => c.no === r.consignment_number)
        )
          target.consignments.push({
            no: r.consignment_number,
            id: r.consignment_id,
          });
      });
      return out; // newest first
    };

    // A partial shipment gets one timeline per container. Events with no
    // container (e.g. "Created") are shared by every shipment of the item.
    const buildShipments = (i) => {
      const cids = [];
      i.containerDetails.forEach((cd) => {
        const c = cd.container?.cid;
        if (c != null && !cids.includes(Number(c))) cids.push(Number(c));
      });
      i.rows.forEach((r) => {
        if (r.container_id != null && !cids.includes(Number(r.container_id)))
          cids.push(Number(r.container_id));
      });
      if (cids.length < 2) return null;
      return cids.map((cid, idx) => {
        const cd = i.containerDetails.find(
          (x) => Number(x.container?.cid) === cid,
        );
        const own = i.rows.filter((r) => Number(r.container_id) === cid);
        const first = own[0];
        const events = mergeEvents(
          i.rows.filter(
            (r) => r.container_id == null || Number(r.container_id) === cid,
          ),
        );
        return {
          key: `${i.key}-s${cid}`,
          index: idx + 1,
          container:
            cd?.container?.container_number || first?.container_number || null,
          consignment: {
            no: cd?.consignment_number || first?.consignment_number || null,
            id: cd?.consignment_id || first?.consignment_id || null,
          },
          events,
        };
      });
    };

    const list = Object.values(groups)
      .map((g) => {
        const its = g.items.map((i) => ({
          ...i,
          events: mergeEvents(i.rows),
          shipments: buildShipments(i),
        }));
        const all = its.flatMap((i) => i.events);
        return {
          ...g,
          items: its,
          eventCount: all.length,
          latest: all.sort(
            (a, b) => new Date(b.created_time) - new Date(a.created_time),
          )[0],
        };
      })
      .filter((g) => g.eventCount > 0);

    if (orderLevel.rows.length) {
      const events = mergeEvents(orderLevel.rows);
      list.unshift({
        key: "order",
        name: "Order Level",
        items: [{ key: "order-events", label: null, events }],
        eventCount: events.length,
        latest: events[0],
      });
    }
    return list;
  };

  const elapsedText = (from, to) => {
    const mins = dayjs(to).diff(dayjs(from), "minute");
    if (!Number.isFinite(mins) || mins < 1) return null;
    const d = Math.floor(mins / 1440);
    const h = Math.floor((mins % 1440) / 60);
    const m = mins % 60;
    if (d) return `${d}d ${h}h`;
    if (h) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const renderEventTimeline = (events, hideRefs = false) => (
    <Box
      sx={{
        position: "relative",
        ml: 1,
        pl: 3,
        borderLeft: `2px solid ${T.grey200}`,
      }}
    >
      {events.map((e, i) => {
        const prev = events[i + 1]; // older event
        const took = prev
          ? elapsedText(prev.created_time, e.created_time)
          : null;
        const linkSx = { color: T.teal, fontWeight: 600 };
        return (
          <Box
            key={`${e.id}-${i}`}
            sx={{
              position: "relative",
              pb: i === events.length - 1 ? 0 : 1.75,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                left: -31,
                top: 5,
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: i === 0 ? T.teal : T.white,
                border: `2px solid ${T.teal}`,
              }}
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: T.text }}>
                {e.status || "-"}
              </Typography>
              <Typography variant="caption" color={T.grey600}>
                {dayjs(e.created_time).isValid()
                  ? dayjs(e.created_time).format("DD MMM YYYY, hh:mm A")
                  : "-"}
                {took ? ` · +${took}` : ""}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                mt: 0.25,
              }}
            >
              {e.by && e.by !== "-" && (
                <Typography variant="caption" color={T.grey600}>
                  By {e.by}
                </Typography>
              )}
              {(hideRefs ? [] : e.consignments).map((c) => (
                <Typography key={c.no} variant="caption" color={T.grey600}>
                  Consignment:{" "}
                  {c.id ? (
                    <Link
                      href={consignmentHref(c.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={linkSx}
                    >
                      {c.no}
                    </Link>
                  ) : (
                    <b>{c.no}</b>
                  )}
                </Typography>
              ))}
              {(hideRefs ? [] : e.containers).map((c) => (
                <Typography key={c} variant="caption" color={T.grey600}>
                  Container:{" "}
                  <Link
                    href={containerHref(c)}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={linkSx}
                  >
                    {c}
                  </Link>
                </Typography>
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  const renderHistoryToggle = () => {
    const groups = buildHistoryGroups();
    if (!groups.length) return null;
    const keys = groups.map((g) => `h-${g.key}`);
    const allOpen = keys.every((k) => expanded[k]);
    return (
      <Button
        size="small"
        onClick={() =>
          setExpanded(
            allOpen ? {} : Object.fromEntries(keys.map((k) => [k, true])),
          )
        }
        sx={{ color: T.teal, textTransform: "none", fontWeight: 600 }}
      >
        {allOpen ? "Collapse all" : "Expand all"}
      </Button>
    );
  };

  const renderTracking = () => {
    const groups = buildHistoryGroups();
    if (!groups.length)
      return (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No status history for this order.
        </Alert>
      );

    return (
      <Stack spacing={1.5}>
        {groups.map((g) => {
          const key = `h-${g.key}`;
          const itemCount = g.items.filter((i) => i.label).length;
          const times = g.items
            .flatMap((i) => i.events)
            .map((e) => e.created_time)
            .filter((t) => dayjs(t).isValid())
            .sort((a, b) => new Date(a) - new Date(b));
          const trip =
            g.key !== "order" && times.length > 1
              ? elapsedText(times[0], times[times.length - 1])
              : null;

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
                    {g.name}
                  </Typography>
                  {itemCount > 0 && (
                    <Typography variant="caption" color={T.grey600}>
                      {itemCount} item{itemCount > 1 ? "s" : ""}
                    </Typography>
                  )}
                  <Box sx={{ flex: 1 }} />
                  {trip && (
                    <Typography variant="body2" color={T.grey600}>
                      Trip duration: <b>{trip}</b>
                    </Typography>
                  )}
                  {g.latest?.status && (
                    <Typography variant="body2" color={T.grey600}>
                      Latest:{" "}
                      <b style={{ color: T.tealDark }}>{g.latest.status}</b>
                    </Typography>
                  )}
                </>,
              )}

              <Collapse in={!!expanded[key]} unmountOnExit>
                <Stack
                  spacing={2}
                  sx={{ p: 2.5 }}
                  divider={<Divider flexItem />}
                >
                  {g.items.map((it) => {
                    const cur = it.events[0];
                    const shipments = it.shipments;
                    return (
                      <Box key={it.key}>
                        {it.label && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: 1,
                              flexWrap: "wrap",
                              mb: 1.5,
                            }}
                          >
                            <Typography fontWeight={700} color={T.text}>
                              {it.label}
                            </Typography>
                            {!String(it.ref).startsWith("id-") && (
                              <Typography variant="caption" color={T.grey600}>
                                {it.ref}
                              </Typography>
                            )}
                            <Box sx={{ flex: 1 }} />
                            <Typography variant="caption" color={T.grey600}>
                              {shipments
                                ? `Partial shipment · ${shipments.length} containers`
                                : `${cur ? `${cur.status} · ` : ""}${it.events.length} update${it.events.length !== 1 ? "s" : ""}`}
                            </Typography>
                          </Box>
                        )}
                        {shipments ? (
                          <Stack spacing={2}>
                            {shipments.map((sh) => (
                              <Box
                                key={sh.key}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2,
                                  border: `1px solid ${T.grey200}`,
                                  bgcolor: T.grey50,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: 1.5,
                                    flexWrap: "wrap",
                                    mb: 1.25,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: 13,
                                      color: T.tealDark,
                                    }}
                                  >
                                    Shipment {sh.index} of {shipments.length}
                                  </Typography>
                                  {sh.container && (
                                    <Typography
                                      variant="caption"
                                      color={T.grey600}
                                    >
                                      Container:{" "}
                                      <Link
                                        href={containerHref(sh.container)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        underline="hover"
                                        sx={{ color: T.teal, fontWeight: 600 }}
                                      >
                                        {sh.container}
                                      </Link>
                                    </Typography>
                                  )}
                                  {sh.consignment.no && (
                                    <Typography
                                      variant="caption"
                                      color={T.grey600}
                                    >
                                      Consignment:{" "}
                                      {sh.consignment.id ? (
                                        <Link
                                          href={consignmentHref(
                                            sh.consignment.id,
                                          )}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          underline="hover"
                                          sx={{
                                            color: T.teal,
                                            fontWeight: 600,
                                          }}
                                        >
                                          {sh.consignment.no}
                                        </Link>
                                      ) : (
                                        <b>{sh.consignment.no}</b>
                                      )}
                                    </Typography>
                                  )}
                                  <Box sx={{ flex: 1 }} />
                                  <Typography
                                    variant="caption"
                                    color={T.grey600}
                                  >
                                    {sh.events[0]
                                      ? `${sh.events[0].status} · `
                                      : ""}
                                    {sh.events.length} update
                                    {sh.events.length !== 1 ? "s" : ""}
                                  </Typography>
                                </Box>
                                {sh.events.length ? (
                                  renderEventTimeline(sh.events, true)
                                ) : (
                                  <Typography variant="body2" color={T.grey600}>
                                    No status history recorded.
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Stack>
                        ) : it.events.length ? (
                          renderEventTimeline(it.events)
                        ) : (
                          <Typography variant="body2" color={T.grey600}>
                            No status history recorded for this item.
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Collapse>
            </Card>
          );
        })}
      </Stack>
    );
  };

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

  const getOrderRfd = () => {
    const { items } = buildShipmentData();
    const dates = items.map(({ item }) => item.rfdDate);
    if (!dates.length || dates.some((d) => !d)) return null;
    return new Date(Math.max(...dates.map((d) => new Date(d).getTime())));
  };

  const jobTable = (docs, partyLabel, partyKey, kind) => {
    const groups = groupByForm(docs);
    const live = docs.filter((d) => d.status !== "void");
    const grandTotal = sumBy(live, docTotalAed);
    const grandBalance = sumBy(live, docBalanceAed);
    const grandPaid = sumBy(live, docPaidAed);
    const headCell = { bgcolor: T.teal, color: "#fff", fontWeight: "bold" };
    const rfdDate = selectedOrder?.rfd_date || getOrderRfd();
    const rfdTxt = rfdDate ? dayjs(rfdDate).format("MMM DD, YYYY") : "-";

    return (
      <TableContainer
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
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
                "RFD Date",
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
                Paid
              </TableCell>
              <TableCell align="right" sx={headCell}>
                Balance
              </TableCell>
              <TableCell align="right" sx={headCell}>
                Total
              </TableCell>
              <TableCell align="center" sx={headCell}>
                Preview
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No {kind.toLowerCase()}s found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {groups.map((g) => {
                  const k = `f-${kind}-${g.key}`;
                  const open = expanded[k] ?? false;
                  const gl = g.docs.filter((d) => d.status !== "void");
                  const paidCnt = gl.filter((d) => d.status === "paid").length;
                  const currencies = [...new Set(gl.map((d) => d.currency))];
                  const fcaTxt =
                    currencies.length === 1 && currencies[0] !== "AED"
                      ? fmtMoney(
                          sumBy(gl, (d) => d.total),
                          currencies[0],
                        )
                      : "-";
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
                      <TableCell>
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
                      <TableCell sx={{ fontWeight: 600 }}>
                        {!open
                          ? pickDate(
                              gl.map((d) => d.date),
                              "max",
                            )
                          : ""}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {!open
                          ? pickDate(
                              gl.map((d) => d.dueDate),
                              "min",
                            )
                          : ""}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {!open ? rfdTxt : ""}
                      </TableCell>
                      <TableCell>
                        {!open && (
                          <Chip
                            label={`Paid (${paidCnt}/${gl.length})`}
                            size="small"
                            variant="outlined"
                            color="success"
                          />
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {!open ? fcaTxt : ""}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {fmtMoney(sumBy(gl, docPaidAed), "AED")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {fmtMoney(sumBy(gl, docBalanceAed), "AED")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {fmtMoney(sumBy(gl, docTotalAed), "AED")}
                      </TableCell>
                      <TableCell />
                    </TableRow>,
                    ...(open
                      ? g.docs.map((d) => (
                          <TableRow hover key={d.id}>
                            <TableCell sx={{ pl: 7, fontWeight: 600 }}>
                              {d.number}
                            </TableCell>
                            <TableCell>{d[partyKey]}</TableCell>
                            <TableCell>
                              {d.date
                                ? dayjs(d.date).format("MMM DD, YYYY")
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {d.dueDate
                                ? dayjs(d.dueDate).format("MMM DD, YYYY")
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {rfdTxt}
                              {overdueNote(d, kind, rfdDate)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={statusLabel(d, rfdDate)}
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
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                disabled={pdfLoadingId === d.id}
                                onClick={() => openDocPdf(kind, d)}
                              >
                                {pdfLoadingId === d.id ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <VisibilityIcon fontSize="small" />
                                )}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      : []),
                  ];
                })}
                <TableRow sx={{ bgcolor: T.tealLight }}>
                  <TableCell
                    colSpan={6}
                    align="right"
                    sx={{ fontWeight: 700, color: T.tealDark }}
                  >
                    Grand Total
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
                  <TableCell />
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
    const netProfit =
      Number(billing.invoiceTotal || 0) - Number(billing.vendorTotal || 0);
    const margin =
      billing.invoiceTotal > 0
        ? `${((netProfit / billing.invoiceTotal) * 100).toFixed(1)}%`
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
                lg: "repeat(5, 1fr)",
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
              label="Total Bills Paid"
              sub={`${
                bills.filter((d) => d.status !== "void" && docPaidAed(d) > 0)
                  .length
              } Payments`}
            />
            <FinStatCard
              color="#059669"
              icon={<TrendingUpIcon />}
              value={fmtMoney(netProfit, "AED")}
              label="Net Profit"
              sub={`${margin} Margin`}
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

  const lastSync = getLastSync();

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
      label: "History",
      icon: <HistoryIcon sx={{ fontSize: 18, color: T.teal }} />,
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
              {selectedOrder?.rgl_booking_number || "Order Details"}
            </Typography>
            {selectedOrder?.created_at && (
              <Chip
                label={`Created Date: ${formatDate(selectedOrder.created_at)}`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "rgba(255,255,255,0.5)",
                  color: T.white,
                  fontSize: 12,
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
                      cols={4}
                      copyKeys={["Tracking ID", "RGL Booking #"]}
                      data={{
                        "Tracking ID": selectedOrder.tracking_id,
                        "Booking Ref": selectedOrder.booking_ref,
                        "RGL Booking #": selectedOrder.rgl_booking_number,
                        Status: selectedOrder.status,
                        "Point of Origin": getPlaceName(
                          selectedOrder.point_of_origin,
                        ),
                        "Place of Loading": getPlaceName(
                          selectedOrder.place_of_loading,
                        ),
                        "Place of Delivery": getPlaceName(
                          selectedOrder.place_of_delivery,
                        ),
                        "Final Destination": getPlaceName(
                          selectedOrder.final_destination,
                        ),

                        "Shipping Line": selectedOrder.shipping_line,
                        "Transport Type": selectedOrder.transport_type,
                        "Collection Scope": selectedOrder.collection_scope,
                        "Total Assigned Qty": selectedOrder.total_assigned_qty,

                        "Created At": new Date(
                          selectedOrder.created_at,
                        ).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                        "Order Remarks": selectedOrder.order_remarks,
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
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 2.5, border: `1px solid ${T.grey200}` }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <SectionHeader
                      icon={
                        <HistoryIcon sx={{ color: T.teal, fontSize: 20 }} />
                      }
                      title="Status History"
                      count={(selectedOrder.tracking || []).length}
                      mb={1.5}
                      action={renderHistoryToggle()}
                    />
                    {renderTracking()}
                  </CardContent>
                </Card>
              </TabPanel>
              <TabPanel value={tabValue} index={4}>
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

              <TabPanel value={tabValue} index={5}>
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
                          label={allGatepasses.length}
                          sx={{
                            bgcolor: T.tealMid,
                            color: T.tealDark,
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                      {renderFiles(allGatepasses)}
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
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
                        <PictureAsPdfIcon
                          sx={{ color: T.teal, fontSize: 18 }}
                        />
                        <Typography fontWeight={700} color={T.tealDark}>
                          House Bill of Lading (HBL)
                        </Typography>
                      </Box>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ p: 2 }}
                      >
                        <Select
                          size="small"
                          displayEmpty
                          value={hblCompanyId}
                          onChange={(e) => setHblCompanyId(e.target.value)}
                          sx={{ minWidth: 220 }}
                        >
                          <MenuItem value="" disabled>
                            Select company
                          </MenuItem>
                          {(companies || []).map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.company}
                            </MenuItem>
                          ))}
                        </Select>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={!hblCompanyId || hblLoading}
                          onClick={handleOpenHbl}
                          startIcon={
                            hblLoading ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <VisibilityIcon />
                            )
                          }
                          sx={{ borderColor: T.teal, color: T.teal }}
                        >
                          Preview
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>

              {canViewJobDetails && (
                <TabPanel value={tabValue} index={6}>
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
                            {lastSync
                              ? `${dayjs(lastSync.at).format("MMM DD, YYYY hh:mm A")}${
                                  lastSync.by ? ` by ${lastSync.by}` : ""
                                }`
                              : "N/A"}
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
      <Dialog
        open={!!hblHtml}
        onClose={() => setHblHtml("")}
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
          <Typography fontWeight={700}>House Bill of Lading</Typography>
          <Box>
            <Button
              variant="contained"
              size="small"
              disabled={hblDownloading}
              onClick={handleDownloadHbl}
              startIcon={
                hblDownloading ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <DownloadIcon />
                )
              }
              sx={{
                mr: 1,
                bgcolor: T.orange,
                "&:hover": { bgcolor: T.orangeDark },
              }}
            >
              Download
            </Button>
            <IconButton onClick={() => setHblHtml("")}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: T.grey100 }}>
          <iframe
            ref={hblFrameRef}
            title="hbl-preview"
            srcDoc={hblHtml}
            style={{ width: "100%", height: "75vh", border: 0 }}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(previewDoc)}
        onClose={closePreview}
        maxWidth="lg"
        fullWidth
      >
        {previewDoc && (
          <>
            <DialogTitle>
              {previewDoc.kind} Preview · {previewDoc.doc.number}
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              <iframe
                title="document-preview"
                src={previewDoc.url}
                style={{ width: "100%", height: "75vh", border: 0 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closePreview}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default OrderModalView;
