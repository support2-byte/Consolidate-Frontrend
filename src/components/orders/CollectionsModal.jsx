import { useState, useEffect, useMemo, useContext } from "react";
import dayjs from "dayjs";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  FormControlLabel,
  InputLabel,
  Checkbox,
  Grid,
  Chip,
  Divider,
  Tooltip,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CreateInvoiceModal from "./CreateInvoiceModal";
import { toast } from "react-toastify";
import { api } from "../../api";
import { generateGatepassPDF } from "../../documents/gatepassGenerator";
import { AppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { pdfDocToPngBlob } from "../../lib/pdfToPng";

const triggerDownload = (href, filename) => {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const downloadFromUrl = async (url, filename) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, filename);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    window.open(url, "_blank");
  }
};

const fmtDMY = (v) => {
  if (!v) return "—";
  const s = String(v);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? new Date(`${s}T00:00:00`)
    : new Date(v);
  return isNaN(d.getTime())
    ? "—"
    : d
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/ /g, "-");
};

const fmtDT = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
};

const overdueDaysSince = (rfd) => {
  if (!rfd) return null;
  const n = dayjs().startOf("day").diff(dayjs(rfd).startOf("day"), "day") + 1;
  // 3 days are free: day 4 after RFD is "overdue by 1 day"
  return n > 3 ? n - 3 : null;
};

// Part shipments: the Zoho order number is the form number + a letter
// (A, B, ...). Each part is matched to items through its consignment number.
const consKey = (v) =>
  String(v ?? "")
    .trim()
    .replace(/^c(?=\d)/i, "")
    .toLowerCase();

const itemReleaseState = (
  parts,
  itemConsignments,
  { approved = false, receiverPaid = false, strict = false } = {},
) => {
  if (approved && !strict) return { ok: true };
  const perPart = (parts || []).some((p) => p.part);
  if (!perPart) {
    return receiverPaid
      ? { ok: true }
      : { ok: false, reason: "Payment pending" };
  }
  const keys = (itemConsignments || []).map(consKey).filter(Boolean);
  const hit = parts.filter((p) =>
    (p.consignments || []).some((c) => keys.includes(consKey(c))),
  );
  const applicable = hit.length
    ? hit
    : parts.filter((p) => !(p.consignments || []).length);
  if (!applicable.length) {
    return { ok: false, reason: "No invoice for this shipment yet" };
  }
  const bad = applicable.filter((p) => p.status !== "paid");
  return bad.length
    ? {
        ok: false,
        reason: `Part ${bad.map((p) => p.part || "–").join(", ")} not paid`,
      }
    : { ok: true };
};

const PART_STATUS = {
  paid: { label: "Paid", bg: "#e8f5e9", color: "#2e7d32" },
  partially_paid: { label: "Partially paid", bg: "#fff8e1", color: "#b26a00" },
  unpaid: { label: "Unpaid", bg: "#fff3e0", color: "#ef6c00" },
  no_invoice: { label: "No invoice", bg: "#eceff1", color: "#546e7a" },
};

const MARK_OK_STATUSES = ["Ready for Delivery", "Shipment Delivered"];
const remainingOf = (i) =>
  Math.max(0, parseInt(i?.remainingQty ?? i?.totalNumber ?? 0, 10) || 0);

const emptyCollection = (idx) => ({
  _key: `c-${Date.now()}-${idx}`,
  collectionMethod: "",
  collectionScope: "Partial",
  qtyDelivered: "",
  receiverId: "",
  driverId: "",
  clientReceiverId: "",
  clientReceiverMobile: "",
  plateNo: "",
  deliveryDate: "",
  status: false,
  paymentApproved: false,
  gatepassFiles: [],
  items: {},
});

const CollectionsModal = ({ open, onClose, order, getPlaceName, onSave }) => {
  const { drivers, driverTrucks } = useContext(AppContext);
  const { isSuperAdmin, isAdmin, isManager } = useAuth();
  const canApprove = isSuperAdmin() || isAdmin() || isManager();
  const [collections, setCollections] = useState([emptyCollection(1)]);
  const [saving, setSaving] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceTarget, setInvoiceTarget] = useState(null);
  const [payments, setPayments] = useState(null);
  const [approvals, setApprovals] = useState({});
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentMeta, setPaymentMeta] = useState({});
  const [lastSync, setLastSync] = useState(null);
  const [billingInvoices, setBillingInvoices] = useState([]);
  const [receiverParts, setReceiverParts] = useState({});
  const [markOpen, setMarkOpen] = useState(false);
  const [markBusy, setMarkBusy] = useState(false);
  const isPaid = (receiverId) => payments?.[receiverId] === "paid";
  const isApproved = (receiverId) => approvals?.[receiverId]?.approved === true;
  const canRelease = (receiverId) =>
    isPaid(receiverId) || isApproved(receiverId);
  const isPerPart = (receiverId) =>
    (receiverParts?.[receiverId] || []).some((p) => p.part);
  const itemRelease = (receiverId, item, strict = false) =>
    itemReleaseState(
      receiverParts?.[receiverId] || [],
      (item?.containerDetails || []).map((cd) => cd.consignment_number),
      {
        approved: isApproved(receiverId),
        receiverPaid: isPaid(receiverId),
        strict,
      },
    );
  // can anything be collected for this receiver at all?
  const receiverHasReleasable = (r) =>
    isPerPart(r.id)
      ? (r.shippingdetails || []).some((i) => itemRelease(r.id, i).ok)
      : canRelease(r.id);

  const getDriverTrucks = (driver) =>
    driverTrucks.filter((t) => t.driver_id === driver.id);

  const addDraftGatepass = (collectionKey, gpData) => {
    setCollections((prev) =>
      prev.map((c) =>
        c._key === collectionKey
          ? { ...c, gatepasses: [...c.gatepasses, gpData] }
          : c,
      ),
    );
  };

  const removeDraftGatepass = (collectionKey, idx) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c._key !== collectionKey) return c;
        const gatepasses = [...c.gatepasses];
        gatepasses.splice(idx, 1);
        return { ...c, gatepasses };
      }),
    );
  };

  useEffect(() => {
    if (open) {
      setCollections([emptyCollection(1)]);
    }
  }, [open, order?.id]);

  useEffect(() => {
    if (!open || !order?.id) return;
    let active = true;

    const loadPayments = async () => {
      setPayments(null);
      setApprovals({});
      setPaymentMeta({});
      setReceiverParts({});
      setLastSync(null);
      try {
        const { data } = await api.get(
          `/api/zoho-invoice/order/${order.id}/payment-status`,
        );
        if (!active) return;
        setPayments(data.receiverPayments || {});
        setApprovals(data.receiverApprovals || {});
        setPaymentMeta(data.receiverPaymentMeta || {});
        setReceiverParts(data.receiverParts || {});
        setLastSync(data.lastSync || null);
      } catch {
        if (!active) return;
        setPayments({});
        toast.error("Failed to verify payment status.");
      }
    };

    loadPayments();
    return () => {
      active = false;
    };
  }, [open, order?.id]);

  const loadInvoices = async () => {
    if (!order?.id) return;
    try {
      const { data } = await api.get(
        `/api/zoho-invoice/order/${order.id}/billing`,
        { params: { invoicesOnly: 1 } },
      );
      setBillingInvoices(data?.row?.invoices || []);
    } catch {
      setBillingInvoices([]);
    }
  };

  useEffect(() => {
    if (open && order?.id) loadInvoices();
    else setBillingInvoices([]);
  }, [open, order?.id]);

  if (!order) return null;

  const receivers = order.receivers || [];

  const allItems = receivers.flatMap((r) => r.shippingdetails || []);
  const orderTotalQty = allItems.reduce(
    (s, i) => s + (Number(i.totalNumber) || 0),
    0,
  );
  const orderTotalWeight = allItems.reduce(
    (s, i) => s + (Number(i.weight) || 0),
    0,
  );

  const itemsDelivered = allItems.reduce(
    (s, i) => s + (Number(i.deliveredQty) || 0),
    0,
  );
  const collectedQty = Math.min(
    Math.max(Number(order.order_qty_delivered) || 0, itemsDelivered),
    orderTotalQty,
  );
  const collectedPct =
    orderTotalQty > 0 ? Math.round((collectedQty / orderTotalQty) * 100) : 0;
  const remainingQty = Math.max(0, orderTotalQty - collectedQty);

  const rfdDate = (() => {
    if (order.rfd_date) return order.rfd_date;
    if (!allItems.length || allItems.some((i) => !i.rfdDate)) return null;
    return new Date(
      Math.max(...allItems.map((i) => new Date(i.rfdDate).getTime())),
    );
  })();
  const hasOverdueInvoice = billingInvoices.some((d) => d.status === "overdue");
  const rfdOverdueDays = hasOverdueInvoice ? overdueDaysSince(rfdDate) : null;

  const markStates = receivers.map((r) => {
    const open = (r.shippingdetails || []).filter((i) => remainingOf(i) > 0);
    const paid =
      open.length > 0 && open.every((i) => itemRelease(r.id, i, true).ok);
    const statusOk =
      open.length > 0 && open.every((i) => MARK_OK_STATUSES.includes(i.status));
    return { r, open, paid, statusOk, eligible: paid && statusOk };
  });
  const markEligible = markStates.filter((m) => m.eligible);
  const markQty = markEligible.reduce(
    (s, m) => s + m.open.reduce((a, i) => a + remainingOf(i), 0),
    0,
  );
  const markDisabledReason = (() => {
    if (payments === null) return "Checking payment status…";
    if (remainingQty === 0) return "Everything is already collected";
    if (markEligible.length > 0) return "";
    if (!markStates.some((m) => m.paid)) return "Payment is not paid yet";
    return "Items must be Ready for Delivery or Shipment Delivered";
  })();

  const handleMarkCollected = async () => {
    setMarkBusy(true);
    try {
      await api.post(`/api/orders/${order.id}/collections/mark-collected`, {
        receiverIds: markEligible.map((m) => m.r.id),
      });
      toast.success("Marked as collected");
      setMarkOpen(false);
      setHistoryExpanded(true);
      onSave?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to mark as collected");
    } finally {
      setMarkBusy(false);
    }
  };

  const paidCount = receivers.filter((r) => isPaid(r.id)).length;
  const notClearedCount = receivers.filter(
    (r) => !receiverHasReleasable(r),
  ).length;
  const paymentSummary = !receivers.length
    ? ""
    : paidCount === receivers.length
      ? "All paid"
      : notClearedCount === 0
        ? "All cleared for release"
        : `${notClearedCount} awaiting payment`;

  const renderPayChip = (receiverId) => {
    if (payments === null)
      return (
        <Chip size="small" label="Checking…" sx={{ fontSize: "0.7rem" }} />
      );
    const st = payments?.[receiverId];
    const m = paymentMeta?.[receiverId];
    const base = { size: "small", sx: { fontWeight: 700, fontSize: "0.7rem" } };
    if (st === "paid")
      return (
        <Chip
          {...base}
          icon={<CheckCircleIcon style={{ color: "#2e7d32", fontSize: 16 }} />}
          label={m?.paidDate ? `Paid · ${fmtDMY(m.paidDate)}` : "Paid"}
          sx={{ ...base.sx, bgcolor: "#e8f5e9", color: "#2e7d32" }}
        />
      );
    if (st === "partially_paid")
      return (
        <Chip
          {...base}
          label={`Partially paid · ${Number(m?.balance || 0).toLocaleString()} due`}
          sx={{ ...base.sx, bgcolor: "#fff8e1", color: "#b26a00" }}
        />
      );
    if (st === "unpaid")
      return (
        <Chip
          {...base}
          label="Unpaid"
          sx={{ ...base.sx, bgcolor: "#fff3e0", color: "#ef6c00" }}
        />
      );
    return (
      <Chip
        {...base}
        label="No invoice"
        sx={{ ...base.sx, bgcolor: "#eceff1", color: "#546e7a" }}
      />
    );
  };

  const handleCheckPayment = async () => {
    setCheckingPayment(true);
    try {
      const { data } = await api.post(
        `/api/zoho-invoice/order/${order.id}/payment-status/sync`,
      );
      const result = data.receiverPayments || {};
      const approved = data.receiverApprovals || {};
      setPayments(result);
      setApprovals(approved);
      setPaymentMeta(data.receiverPaymentMeta || {});
      setReceiverParts(data.receiverParts || {});
      setLastSync(data.lastSync || null);

      loadInvoices();
      const paidCount = receivers.filter((r) => result[r.id] === "paid").length;
      const approvedOnly = receivers.filter(
        (r) => result[r.id] !== "paid" && approved[r.id]?.approved,
      ).length;

      if (paidCount > 0) {
        toast.success(
          `Zoho synced: ${paidCount} of ${receivers.length} receiver(s) paid.`,
        );
      } else if (approvedOnly > 0) {
        toast.info(
          `Not paid in Zoho. Release is approved for ${approvedOnly} receiver(s).`,
        );
      } else {
        toast.warning(
          data.lastSync?.message || "Payment is not completed for this order.",
        );
      }
    } catch (err) {
      if (err?.response?.data?.lastSync)
        setLastSync(err.response.data.lastSync);
      toast.error(
        err?.response?.data?.message || "Failed to check payment status.",
      );
    } finally {
      setCheckingPayment(false);
    }
  };

  const updateCollection = (key, patch) => {
    setCollections((prev) =>
      prev.map((c) => (c._key === key ? { ...c, ...patch } : c)),
    );
  };

  const removeCollection = (key) => {
    setCollections((prev) => prev.filter((c) => c._key !== key));
  };

  const handleReceiverChange = (key, receiverId) => {
    updateCollection(key, { receiverId, items: {} });
  };

  const handleDriverChange = (key, driverId) => {
    const driver = drivers.find((d) => d.id === driverId);
    const trucks = driverTrucks.filter((t) => t.driver_id === driverId);
    updateCollection(key, {
      driverId,
      clientReceiverId: driver?.driver_id || "",
      clientReceiverMobile: driver?.phone_number || "",
      plateNo: trucks.length === 1 ? trucks[0].plate_no : "",
    });
  };

  const toggleItem = (key, itemRef, checked, remaining, orderItemId) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c._key !== key) return c;
        const items = { ...c.items };
        items[itemRef] = {
          checked,
          orderItemId,
          qtyDelivered: checked
            ? items[itemRef]?.qtyDelivered || remaining || 0
            : "",
        };
        return { ...c, items };
      }),
    );
  };

  const addCollection = () => {
    if (receivers.length <= 1) {
      toast.error(
        "Only one receiver on this order — you can't add another collection.",
      );
      return;
    }
    setCollections((prev) => [...prev, emptyCollection(prev.length + 1)]);
  };

  const setItemQty = (key, itemRef, qty, remaining) => {
    const clamped = Math.max(0, Math.min(Number(qty) || 0, remaining));
    setCollections((prev) =>
      prev.map((c) => {
        if (c._key !== key) return c;
        const items = { ...c.items };
        items[itemRef] = { ...items[itemRef], qtyDelivered: clamped };
        return { ...c, items };
      }),
    );
  };

  const handleGatepassUpload = (key, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const withPreviews = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setCollections((prev) =>
      prev.map((c) =>
        c._key === key
          ? { ...c, gatepassFiles: [...c.gatepassFiles, ...withPreviews] }
          : c,
      ),
    );
  };

  const removeGatepassFile = (key, idx) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c._key !== key) return c;
        const files = [...c.gatepassFiles];
        files.splice(idx, 1);
        return { ...c, gatepassFiles: files };
      }),
    );
  };

  const handleSave = async () => {
    const items = collections.map((c) =>
      Object.entries(c.items).filter(
        ([, v]) => v.checked && Number(v.qtyDelivered) > 0,
      ),
    );
    if (!items.some((arr) => arr.length > 0)) {
      toast.error(
        "Select at least one item with a delivered quantity greater than 0.",
      );
      return;
    }
    const blockedPick = collections.flatMap((c) => {
      const rec = receivers.find((r) => r.id === c.receiverId);
      return Object.entries(c.items || {})
        .filter(([, v]) => v.checked && Number(v.qtyDelivered) > 0)
        .map(([ref]) =>
          (rec?.shippingdetails || []).find((i) => i.itemRef === ref),
        )
        .filter((i) => i && !itemRelease(c.receiverId, i).ok)
        .map((i) => `${i.itemRef} (${itemRelease(c.receiverId, i).reason})`);
    });
    if (blockedPick.length) {
      toast.error(`Not cleared for release: ${blockedPick.join(", ")}`);
      return;
    }

    const formData = new FormData();
    const collectionsPayload = collections.map((c, i) => {
      c.gatepassFiles.forEach((g) =>
        formData.append(`gatepass_${c.receiverId}`, g.file),
      );
      return {
        receiverId: c.receiverId,
        collectionMethod: c.collectionMethod,
        collectionScope: c.collectionScope,
        driverId: c.driverId,
        clientReceiverId: c.clientReceiverId,
        clientReceiverMobile: c.clientReceiverMobile,
        plateNo: c.plateNo,
        deliveryDate: c.deliveryDate,
        status: c.status,
        paymentApproved: c.paymentApproved,
        items: Object.entries(c.items)
          .filter(([, v]) => v.checked && Number(v.qtyDelivered) > 0)
          .map(([itemRef, v]) => ({
            itemRef,
            orderItemId: v.orderItemId,
            qtyDelivered: v.qtyDelivered,
          })),
      };
    });
    formData.append("collections", JSON.stringify(collectionsPayload));

    for (const c of collections) {
      if (!c.receiverId) continue;
      if (c.gatepassFiles.length > 0) continue;
      const receiver = receivers.find((r) => r.id === c.receiverId);
      const driver = drivers.find((d) => d.id === c.driverId);
      const cargoDefaults = computeCargoDefaults(receiver, c.items);
      try {
        const doc = await generateGatepassPDF({
          gpNumber: `GP-${Date.now()}`,
          orderBookingRef: order.booking_ref,
          receiverName: receiver?.receiver_name,
          customerName: receiver?.receiver_name,
          customerContact: receiver?.receiver_contact,
          marksAndNumber: receiver?.marksAndNumber,
          driverName: driver?.name || "N/A",
          driverId: c.clientReceiverId,
          driverContact: c.clientReceiverMobile,
          plateNo: c.plateNo,
          pickupLocation: "",
          qty: cargoDefaults.qty,
          weight: cargoDefaults.weight,
          commodity: cargoDefaults.commodity,
          items: cargoDefaults.items,
          gateDate: c.deliveryDate,
          collectionMethod: c.collectionMethod,
          download: false,
        });
        const pngBlob = await pdfDocToPngBlob(doc);
        const fileName = `Gatepass_${order.rgl_booking_number}_${Date.now()}.png`;
        formData.append(`gatepass_${c.receiverId}`, pngBlob, fileName);
      } catch (err) {
        console.error("Auto gatepass generation failed:", err);
      }
    }

    setSaving(true);
    try {
      await api.post(`/api/orders/${order.id}/collections`, formData);
      toast.success("Collection saved successfully");
      collections.forEach((c) =>
        c.gatepassFiles.forEach((g) => URL.revokeObjectURL(g.previewUrl)),
      );
      setCollections([emptyCollection(1)]);
      setHistoryExpanded(true);
      onSave?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to save collections");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (value) => {
    if (!value) return "No date";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "No date" : d.toLocaleDateString();
  };

  const ITEM_FREE_DAYS = 3;

  const getItemOverstayDays = (item) => {
    if (item.status !== "Shipment Delivered" || !item.eta) {
      return 0;
    }
    const delivered = new Date(item.eta);
    if (isNaN(delivered.getTime())) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysSinceDelivered = Math.floor((new Date() - delivered) / msPerDay);
    const overstay = daysSinceDelivered - ITEM_FREE_DAYS;
    return overstay > 0 ? overstay : 0;
  };

  const fmtShortDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const computeCargoDefaults = (receiver, selectedEntries) => {
    const shippingdetails = receiver?.shippingdetails || [];

    const selectedList = Array.isArray(selectedEntries)
      ? selectedEntries
      : Object.entries(selectedEntries || {})
          .filter(([, v]) => v.checked)
          .map(([itemRef, v]) => ({ itemRef, qtyDelivered: v.qtyDelivered }));

    let totalQty = 0;
    let totalWeight = 0;
    const commodities = new Set();
    const lines = [];

    selectedList.forEach(({ itemRef, qtyDelivered }) => {
      const qty = Number(qtyDelivered) || 0;
      if (qty <= 0) return;

      const item = shippingdetails.find((sd) => sd.itemRef === itemRef);
      if (!item) return;

      totalQty += qty;

      const itemTotal = Number(item.totalNumber) || 0;
      const itemWeight = Number(item.weight) || 0;
      const perUnitWeight = itemTotal > 0 ? itemWeight / itemTotal : itemWeight;
      totalWeight += perUnitWeight * qty;

      const label = item.subcategory || item.category;
      if (label) commodities.add(label);

      lines.push({
        commodity: label || item.itemRef,
        qty,
        weight: Number((perUnitWeight * qty).toFixed(2)),
      });
    });

    return {
      qty: totalQty || "",
      weight: totalWeight ? Number(totalWeight.toFixed(2)) : "",
      commodity: [...commodities].join(", "),
      items: lines,
    };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#0d6c6a",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6">Add Collections</Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            Order #{order.booking_ref}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box
          sx={{
            bgcolor: "#fff4e8",
            border: "1px solid #fbd9ae",
            borderRadius: 2,
            p: 2,
            mb: 3,
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(7, 1fr)",
            },
          }}
        >
          {[
            ["Order Booking Ref", order.booking_ref || "—"],
            ["Form Number", order.rgl_booking_number || "—"],
            ["Place of Loading", getPlaceName(order.place_of_loading) || "—"],
            ["Place of Delivery", getPlaceName(order.place_of_delivery) || "—"],
          ].map(([label, value]) => (
            <Box key={label} sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ wordBreak: "break-word" }}
              >
                {value}
              </Typography>
            </Box>
          ))}

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              RFD Date
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {rfdDate ? dayjs(rfdDate).format("MMM DD, YYYY") : "—"}
            </Typography>
            {rfdOverdueDays && (
              <Typography
                variant="caption"
                display="block"
                sx={{ color: "error.main", fontWeight: 600, mt: 0.25 }}
              >
                Overdue by {rfdOverdueDays}{" "}
                {rfdOverdueDays === 1 ? "day" : "days"} · late charges may apply
              </Typography>
            )}
          </Box>

          {[
            ["Total Qty", orderTotalQty.toLocaleString()],
            [
              "Total Weight",
              `${orderTotalWeight.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })} kg`,
            ],
          ].map(([label, value]) => (
            <Box
              key={label}
              sx={{
                minWidth: 0,
                px: 1.5,
                py: 0.75,
                borderRadius: 1.5,
                bgcolor: "#fff",
                border: "1px solid #fbd9ae",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="#d96f10">
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            border: "1px solid #cfe9e7",
            bgcolor: "#f5fbfa",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            mb={1}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: "#0d6c6a",
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              Collected
            </Typography>
            <Typography variant="body2" fontWeight={800}>
              {collectedQty.toLocaleString()}
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                {" "}
                / {orderTotalQty.toLocaleString()} pkgs · {collectedPct}%
              </Typography>
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={collectedPct}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "#d7ebe9",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                bgcolor: collectedPct >= 100 ? "#16a34a" : "#0d6c6a",
              },
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.75, display: "block" }}
          >
            {remainingQty === 0
              ? "Everything on this order has been collected."
              : `${remainingQty.toLocaleString()} pkgs still to be collected`}
          </Typography>
          <Tooltip title={markDisabledReason}>
            <span>
              {/* <Button
                size="small"
                variant="outlined"
                startIcon={<CheckCircleIcon fontSize="small" />}
                disabled={!!markDisabledReason}
                onClick={() => setMarkOpen(true)}
                sx={{
                  mt: 1.25,
                  borderColor: "#0d6c6a",
                  color: "#0d6c6a",
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Mark as Collected
              </Button> */}
            </span>
          </Tooltip>
        </Box>

        <Box
          sx={{
            mb: 3,
            borderRadius: 2,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2,
              py: 1.25,
              bgcolor: "#f7f8fa",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "text.secondary",
                }}
              >
                Payment status
              </Typography>
              {payments && receivers.length > 0 && (
                <Chip
                  size="small"
                  label={paymentSummary}
                  sx={{
                    height: 20,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    bgcolor: "#e0f2f1",
                    color: "#0d6c6a",
                  }}
                />
              )}
            </Stack>
            <Button
              size="small"
              variant="outlined"
              onClick={handleCheckPayment}
              disabled={checkingPayment || !order.rgl_booking_number}
              startIcon={
                checkingPayment ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <SyncIcon fontSize="small" />
                )
              }
              sx={{
                borderColor: "#0d6c6a",
                color: "#0d6c6a",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {checkingPayment ? "Syncing…" : "Sync from Zoho"}
            </Button>
          </Stack>

          <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #f0f0f0" }}>
            {lastSync ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
              >
                <AccessTimeIcon
                  sx={{ fontSize: 15, color: "text.secondary" }}
                />
                <Typography variant="caption" color="text.secondary">
                  Last synced by{" "}
                  <strong style={{ color: "#333" }}>
                    {lastSync.syncedByName ||
                      lastSync.syncedByEmail ||
                      "System"}
                  </strong>{" "}
                  on {fmtDT(lastSync.syncedAt)}
                </Typography>
                <Chip
                  size="small"
                  label={lastSync.message || lastSync.status}
                  sx={{
                    height: 20,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    bgcolor:
                      lastSync.status !== "success"
                        ? "#ffebee"
                        : lastSync.paidAfter > lastSync.paidBefore
                          ? "#e8f5e9"
                          : "#eceff1",
                    color:
                      lastSync.status !== "success"
                        ? "#c62828"
                        : lastSync.paidAfter > lastSync.paidBefore
                          ? "#2e7d32"
                          : "#546e7a",
                  }}
                />
              </Stack>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Not synced from Zoho yet. Click “Sync from Zoho” to check for
                new payments.
              </Typography>
            )}
          </Box>

          {receivers.map((r) => {
            const ap = approvals?.[r.id];
            const paid = isPaid(r.id);
            const approved = isApproved(r.id);
            const parts = receiverParts?.[r.id] || [];
            const perPart = parts.some((p) => p.part);
            const partsPaid = parts.filter((p) => p.status === "paid").length;
            const approverName = ap?.approvedByName || ap?.approvedByEmail;
            return (
              <Stack
                key={r.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{
                  px: 2,
                  py: 1,
                  borderBottom: "1px solid #f5f5f5",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {r.receiver_name || "Unnamed Receiver"}
                  </Typography>
                  {payments !== null && (
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{
                        fontWeight: 600,
                        color: receiverHasReleasable(r) ? "#2e7d32" : "#c62828",
                      }}
                    >
                      {perPart
                        ? approved
                          ? "Cleared for release · approved without payment"
                          : partsPaid === parts.length
                            ? "Cleared for release · all parts paid"
                            : partsPaid > 0
                              ? "Partly cleared · only paid parts can be collected"
                              : "Not cleared for release · payment or approval required"
                        : paid
                          ? "Cleared for release · payment received"
                          : approved
                            ? "Cleared for release · approved without payment"
                            : "Not cleared for release · payment or approval required"}
                    </Typography>
                  )}
                  {perPart && (
                    <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                      {parts.map((p) => {
                        const st =
                          PART_STATUS[p.status] || PART_STATUS.no_invoice;
                        return (
                          <Tooltip
                            key={p.part}
                            title={
                              (p.invoices || []).length
                                ? `Invoices: ${p.invoices.join(", ")}`
                                : "No invoice"
                            }
                          >
                            <Chip
                              size="small"
                              label={`Part ${p.part || "–"} · ${st.label}${
                                (p.consignments || []).length
                                  ? ` · ${p.consignments.join(", ")}`
                                  : ""
                              }`}
                              sx={{
                                height: 20,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                bgcolor: st.bg,
                                color: st.color,
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    </Stack>
                  )}
                  {approved && !paid && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Approved
                      {approverName && (
                        <>
                          {" "}
                          by <strong>{approverName}</strong>
                        </>
                      )}
                      {ap?.approvedAt && ` on ${fmtDT(ap.approvedAt)}`}
                    </Typography>
                  )}
                </Box>
                {perPart ? (
                  <Chip
                    size="small"
                    label={`${partsPaid}/${parts.length} parts paid`}
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      bgcolor:
                        partsPaid === parts.length ? "#e8f5e9" : "#fff8e1",
                      color: partsPaid === parts.length ? "#2e7d32" : "#b26a00",
                    }}
                  />
                ) : (
                  renderPayChip(r.id)
                )}
              </Stack>
            );
          })}
        </Box>
        {receivers.some((r) => r.collections?.length > 0) && (
          <Box
            sx={{
              mb: 3,
              border: "1px solid #e0f2f1",
              borderRadius: 1.5,
              overflow: "hidden",
            }}
          >
            <Box
              onClick={() => setHistoryExpanded((prev) => !prev)}
              sx={{
                px: 1.5,
                py: 1,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "#f5fbfa",
                "&:hover": { bgcolor: "#eef8f7" },
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "#0d6c6a" }}
              >
                Previously Added Collections (
                {receivers.reduce(
                  (sum, r) => sum + (r.collections?.length || 0),
                  0,
                )}
                )
              </Typography>
              <ExpandMoreIcon
                fontSize="small"
                sx={{
                  color: "#0d6c6a",
                  transition: "transform 0.2s",
                  transform: historyExpanded
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              />
            </Box>

            {historyExpanded && (
              <Box sx={{ p: 1.5, pt: 1 }}>
                <Stack spacing={1}>
                  {receivers.flatMap((r) =>
                    (r.collections || []).map((c) => (
                      <Box
                        key={c.id}
                        sx={{
                          border: "1px solid #e0f2f1",
                          bgcolor: "#f5fbfa",
                          borderRadius: 1.5,
                          p: 1.5,
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {r.receiver_name || "Unnamed Receiver"} —{" "}
                              {c.collectionMethod || "—"}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {(c.items || []).length} item(s) •{" "}
                              {fmtDate(c.deliveryDate)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Added
                              {(c.createdByName || c.createdBy) && (
                                <>
                                  {" "}
                                  by{" "}
                                  <strong>
                                    {c.createdByName || c.createdBy}
                                  </strong>
                                </>
                              )}
                              {c.createdAt && ` on ${fmtDT(c.createdAt)}`}
                            </Typography>

                            {c.items?.length > 0 && (
                              <Stack
                                direction="row"
                                flexWrap="wrap"
                                gap={0.5}
                                mt={0.5}
                              >
                                {c.items.map((it, i) => (
                                  <Chip
                                    key={i}
                                    label={`${it.itemRef} (${it.qtyDelivered})`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: "0.65rem" }}
                                  />
                                ))}
                              </Stack>
                            )}
                          </Box>

                          <Box>
                            <Chip
                              label={c.collectionScope || "—"}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.65rem",
                                mb: 1,
                              }}
                            />
                            {c.gatepass?.length > 0 && (
                              <Stack direction="row" gap={0.5} mt={0.5}>
                                {c.gatepass.map((g, i) => (
                                  <Stack key={i} alignItems="center">
                                    <a
                                      href={g.url}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <img
                                        src={g.url}
                                        alt="gatepass"
                                        style={{
                                          width: 50,
                                          height: 50,
                                          objectFit: "cover",
                                          borderRadius: 4,
                                          border: "0.5px solid #a2a2a2",
                                        }}
                                      />
                                    </a>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        downloadFromUrl(
                                          g.url,
                                          `Gatepass_${order.booking_ref}_${i + 1}.png`,
                                        )
                                      }
                                    >
                                      <DownloadIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Stack>
                      </Box>
                    )),
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        )}

        <Stack spacing={2}>
          {collections.map((c, idx) => {
            const receiver = receivers.find((r) => r.id === c.receiverId);
            const items = receiver?.shippingdetails || [];

            return (
              <Box
                key={c._key}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 2,
                  p: 2,
                  bgcolor: "#fcfcfd",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1.5}
                >
                  <Chip
                    label={`Collection #${idx + 1}`}
                    size="small"
                    sx={{
                      bgcolor: "#fff4e8",
                      color: "#d96f10",
                      fontWeight: 700,
                      border: "1px solid #fbd9ae",
                    }}
                  />
                  {collections.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeCollection(c._key)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>

                <Grid container spacing={2} mb={1}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Collection Method</InputLabel>
                      <Select
                        label="Collection Method"
                        value={c.collectionMethod}
                        onChange={(e) =>
                          updateCollection(c._key, {
                            collectionMethod: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="">Select Method</MenuItem>
                        <MenuItem value="Delivered by RGSL">
                          Delivered by RGSL
                        </MenuItem>
                        <MenuItem value="Collected by Client">
                          Collected by Client
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Scope</InputLabel>
                      <Select
                        label="Scope"
                        value={c.collectionScope}
                        onChange={(e) =>
                          updateCollection(c._key, {
                            collectionScope: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="Full">Full</MenuItem>
                        <MenuItem value="Partial">Partial</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Receiver</InputLabel>
                      <Select
                        label="Receiver"
                        value={c.receiverId}
                        onChange={(e) =>
                          handleReceiverChange(c._key, e.target.value)
                        }
                      >
                        <MenuItem value="">Select Receiver</MenuItem>
                        {receivers.map((r) => (
                          <MenuItem
                            key={r.id}
                            value={r.id}
                            disabled={!receiverHasReleasable(r)}
                          >
                            {r.receiver_name || "Unnamed Receiver"}
                            {payments &&
                              !isPaid(r.id) &&
                              (isPerPart(r.id)
                                ? !receiverHasReleasable(r) &&
                                  " — Payment pending"
                                : " — Payment pending")}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {c.receiverId && isApproved(c.receiverId) && (
                  <Box
                    sx={{
                      mb: 1,
                      px: 1.5,
                      py: 1,
                      borderRadius: 1.5,
                      bgcolor: "#fff4e8",
                      border: "1px dashed #f3c088",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: "#d96f10" }}
                    >
                      Release approved without payment
                    </Typography>
                    <Typography variant="body2">
                      By{" "}
                      <strong>
                        {approvals[c.receiverId]?.approvedByName ||
                          approvals[c.receiverId]?.approvedByEmail ||
                          "—"}
                      </strong>
                      {approvals[c.receiverId]?.approvedAt &&
                        ` on ${fmtDT(approvals[c.receiverId].approvedAt)}`}
                    </Typography>
                  </Box>
                )}

                <Grid container spacing={2} my={2}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Driver</InputLabel>
                      <Select
                        label="Driver"
                        value={c.driverId}
                        onChange={(e) =>
                          handleDriverChange(c._key, e.target.value)
                        }
                        renderValue={(val) => {
                          if (!val) return "Select Driver";
                          const d = drivers.find((dr) => dr.id === val);
                          return d ? `${d.name} (${d.driver_id})` : "";
                        }}
                      >
                        <MenuItem value="">
                          <em>Select Driver</em>
                        </MenuItem>
                        {drivers.map((d) => {
                          const trucks = getDriverTrucks(d);
                          const deliveries = trucks.reduce(
                            (sum, t) => sum + (Number(t.total_deliveries) || 0),
                            0,
                          );
                          return (
                            <MenuItem
                              key={d.id}
                              value={d.id}
                              sx={{ display: "block", py: 1 }}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {d.name} ({d.driver_id})
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {deliveries} deliveries
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {trucks.length
                                  ? trucks.map((t) => t.plate_no).join(", ")
                                  : "No truck on file"}
                              </Typography>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Emirates ID / CNIC"
                      placeholder="Emirates ID / CNIC"
                      value={c.clientReceiverId}
                      onChange={(e) =>
                        updateCollection(c._key, {
                          clientReceiverId: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Phone Number"
                      placeholder="+971"
                      value={c.clientReceiverMobile}
                      onChange={(e) =>
                        updateCollection(c._key, {
                          clientReceiverMobile: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Vehicle Plate No (Optional)"
                      value={c.plateNo}
                      onChange={(e) =>
                        updateCollection(c._key, { plateNo: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Delivery Date"
                      InputLabelProps={{ shrink: true }}
                      value={c.deliveryDate}
                      onChange={(e) =>
                        updateCollection(c._key, {
                          deliveryDate: e.target.value,
                        })
                      }
                    />
                  </Grid>
                </Grid>

                {c.receiverId && (
                  <Box
                    sx={{
                      mt: 2,
                      border: "1px solid #e5e7eb",
                      borderRadius: 1.5,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "32px 1.1fr 0.9fr 0.8fr 0.7fr 0.8fr 0.8fr 1fr 1.1fr",
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        bgcolor: "#f7f8fa",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {[
                        "",
                        "Item",
                        "Delivered Date",
                        "Overstayed",
                        "Total Qty",
                        "Delivered Qty",
                        "Remaining Qty",
                        "Qty Delivered",
                        "Action",
                      ].map((h, i) => (
                        <Typography
                          key={i}
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: "text.secondary",
                            textTransform: "uppercase",
                            fontSize: "0.65rem",
                          }}
                        >
                          {h}
                        </Typography>
                      ))}
                    </Box>

                    {items.length === 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", p: 1.5 }}
                      >
                        This receiver has no order items.
                      </Typography>
                    )}

                    {items.map((item) => {
                      const total = parseInt(item.totalNumber || 0, 10);
                      const remaining = parseInt(
                        item.remainingQty ?? item.totalNumber ?? 0,
                        10,
                      );
                      const delivered = parseInt(item.deliveredQty || 0, 10);
                      const rowState = c.items[item.itemRef] || {
                        checked: false,
                        qtyDelivered: "",
                      };

                      const overstayDays = getItemOverstayDays(item);
                      const rel = itemRelease(c.receiverId, item);

                      return (
                        <Box
                          key={item.itemRef}
                          sx={{
                            display: "grid",
                            gridTemplateColumns:
                              "32px 1.1fr 0.9fr 0.8fr 0.7fr 0.8fr 0.8fr 1fr 1.1fr",
                            gap: 1,
                            alignItems: "center",
                            px: 1.5,
                            py: 1,
                            borderBottom: "1px solid #f0f0f0",
                            opacity: rowState.checked ? 1 : rel.ok ? 0.6 : 0.45,
                            "&:last-child": { borderBottom: "none" },
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={rowState.checked}
                            disabled={!rel.ok}
                            onChange={(e) =>
                              toggleItem(
                                c._key,
                                item.itemRef,
                                e.target.checked,
                                remaining,
                                item.id,
                              )
                            }
                            sx={{
                              p: 0,
                              color: "#f58220",
                              "&.Mui-checked": { color: "#f58220" },
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Tooltip title={item.itemRef}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ wordBreak: "break-word" }}
                              >
                                {[item.category, item.subcategory]
                                  .filter(Boolean)
                                  .join(" › ") || "Unnamed item"}
                              </Typography>
                            </Tooltip>
                            {!rel.ok && (
                              <Typography
                                variant="caption"
                                display="block"
                                sx={{ color: "#c62828", fontWeight: 600 }}
                              >
                                {rel.reason}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="body2">
                            {item.status === "Shipment Delivered"
                              ? fmtShortDate(item.eta)
                              : "—"}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={overstayDays > 0 ? "#c0392b" : "#16a34a"}
                          >
                            {overstayDays > 0 ? `${overstayDays}d` : "—"}
                          </Typography>
                          <Typography variant="body2">{total}</Typography>
                          <Typography variant="body2">{delivered}</Typography>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={remaining === 0 ? "#16a34a" : "#d96f10"}
                          >
                            {remaining}
                          </Typography>
                          <TextField
                            type="number"
                            size="small"
                            placeholder="0"
                            disabled={!rowState.checked}
                            value={rowState.qtyDelivered}
                            inputProps={{ min: 0, max: remaining }}
                            onChange={(e) =>
                              setItemQty(
                                c._key,
                                item.itemRef,
                                e.target.value,
                                remaining,
                              )
                            }
                          />
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            disabled={overstayDays <= 0 || !c.receiverId}
                            onClick={() => {
                              setInvoiceTarget({
                                receiverId: c.receiverId,
                                receiverName: receiver?.receiver_name,
                                itemRef: item.itemRef,
                                category: item.category,
                                subcategory: item.subcategory,
                                overstayDays,
                              });
                              setInvoiceModalOpen(true);
                            }}
                          >
                            Create Invoice
                          </Button>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                <Box
                  sx={{
                    mt: 2,
                    border: "1.5px dashed #f3c088",
                    bgcolor: "#fffaf3",
                    borderRadius: 1.5,
                    p: 1.5,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: "#d96f10" }}
                    >
                      Gatepass (Optional)
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        component="label"
                        size="small"
                        disabled={
                          !c.receiverId ||
                          !receiverHasReleasable(
                            receiver || { id: c.receiverId },
                          )
                        }
                        sx={{
                          borderColor: "#f58220",
                          color: "#f58220",
                          border: "1px solid #f58220",
                        }}
                      >
                        Upload Gatepass
                        <input
                          type="file"
                          hidden
                          multiple
                          accept="image/*"
                          onChange={(e) =>
                            handleGatepassUpload(c._key, e.target.files)
                          }
                        />
                      </Button>
                    </Stack>
                  </Stack>

                  {c.gatepassFiles.length > 0 ? (
                    <Stack direction="row" flexWrap="wrap" gap={1} mt={1.5}>
                      {c.gatepassFiles.map((g, i) => (
                        <Box
                          key={i}
                          sx={{
                            position: "relative",
                            width: 64,
                            height: 64,
                            borderRadius: 1,
                            overflow: "hidden",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <img
                            src={g.previewUrl}
                            alt="gatepass"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeGatepassFile(c._key, i)}
                            sx={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              bgcolor: "rgba(0,0,0,0.55)",
                              color: "#fff",
                              p: 0.25,
                              "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      No gatepass images uploaded yet.
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>

        {receivers.length > 1 && (
          <Button
            startIcon={<AddIcon />}
            onClick={addCollection}
            sx={{
              mt: 2,
              border: "1.5px dashed #f58220",
              color: "#d96f10",
              "&:hover": { bgcolor: "#fff4e8" },
            }}
          >
            Add Another Collection
          </Button>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ bgcolor: "#f58220", "&:hover": { bgcolor: "#d96f10" } }}
        >
          {saving ? "Saving..." : "Save Collections"}
        </Button>
      </DialogActions>
      <Dialog
        open={markOpen}
        onClose={() => !markBusy && setMarkOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Mark as Collected</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            This creates a collection that marks the full remaining quantity of
            every item as collected. No gatepass is generated.
          </Typography>
          <Stack spacing={0.75} sx={{ mb: 1.5 }}>
            {markEligible.map((m) => (
              <Typography key={m.r.id} variant="body2">
                <strong>{m.r.receiver_name || "Unnamed Receiver"}</strong> —{" "}
                {m.open.length} item(s),{" "}
                {m.open
                  .reduce((a, i) => a + remainingOf(i), 0)
                  .toLocaleString()}{" "}
                pkgs
              </Typography>
            ))}
            {markStates
              .filter((m) => !m.eligible && m.open.length > 0)
              .map((m) => (
                <Typography
                  key={m.r.id}
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Skipped: {m.r.receiver_name || "Unnamed Receiver"} (
                  {m.paid ? "not Ready for Delivery / Delivered" : "not paid"})
                </Typography>
              ))}
          </Stack>
          <Typography variant="body2">
            RFD Date:{" "}
            <strong>
              {rfdDate ? dayjs(rfdDate).format("MMM DD, YYYY") : "—"}
            </strong>
          </Typography>
          {rfdOverdueDays && (
            <Typography
              variant="caption"
              display="block"
              sx={{ color: "error.main", fontWeight: 600, mt: 0.25 }}
            >
              Overdue by {rfdOverdueDays}{" "}
              {rfdOverdueDays === 1 ? "day" : "days"} · late charges may apply
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 1.5 }}>
            Total: <strong>{markQty.toLocaleString()} pkgs</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkOpen(false)} disabled={markBusy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleMarkCollected}
            disabled={markBusy || markEligible.length === 0}
            sx={{ bgcolor: "#0d6c6a", "&:hover": { bgcolor: "#0a5250" } }}
          >
            {markBusy ? "Saving..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
      <CreateInvoiceModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        order={order}
        receiverId={invoiceTarget?.receiverId}
        receiverName={invoiceTarget?.receiverName}
        itemRef={invoiceTarget?.itemRef}
        category={invoiceTarget?.category}
        subcategory={invoiceTarget?.subcategory}
        overstayDays={invoiceTarget?.overstayDays}
        onCreated={() => onSave?.()}
      />
    </Dialog>
  );
};

export default CollectionsModal;
