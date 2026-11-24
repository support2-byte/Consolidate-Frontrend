import { useState, useEffect, useContext, useRef, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  Card,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  AlertTitle,
  Checkbox,
  Collapse,
  Divider,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Autocomplete,
  FormControlLabel,
} from "@mui/material";
import XLSX from "xlsx-js-style";
import Avatar from "@mui/material/Avatar";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EditIcon from "@mui/icons-material/Edit";
import DescriptionIcon from "@mui/icons-material/Description";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import Tooltip from "@mui/material/Tooltip";
import List from "@mui/material/List";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CargoIcon from "@mui/icons-material/LocalShipping";
import { styled } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Close";
import UpdateIcon from "@mui/icons-material/Update";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import OrderModalView from "../../components/orders/OrderModalView";
import AssignModal from "./AssignContainer";
import logoRickmers from "../../../public/RICKMERS-LOGO.jpg";
import { api } from "../../api";
import { Description } from "@mui/icons-material";
import { AppContext } from "../../context/AppContext";
import { useLoading } from "../../context/LoadingContext";
import CollectionsModal from "../../components/orders/CollectionsModal";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import { toast } from "react-toastify";
import { OrderConfirmation } from "../../documents/orderConfirmationGenerator";
import OrderConfirmationEmailModal from "../../components/orders/OrderConfirmationModal";
import {
  MasterBillOfLading,
  WharfageConsignmentNote,
  RickmersBillOfLading,
} from "../../documents/mblGenerator";
import { HouseBillOfLading } from "../../documents/hblGenerator";

const StyledTooltip = styled(Tooltip)(({ theme }) => ({
  [`& .MuiTooltip-tooltip`]: {
    borderRadius: theme.shape.borderRadius,
    fontSize: theme.typography.body2.fontSize,
    width: 600,
  },
  [`& .MuiTooltip-arrow`]: {},
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
  "&:last-child td, &:last-child th": { border: 0 },
  "&:hover": { backgroundColor: theme.palette.action.selected },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  fontSize: "12px",
  padding: theme.spacing(1.5, 2),
}));

const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: "bold",
  fontSize: "0.875rem",
  padding: theme.spacing(1.5, 2),
  borderBottom: `2px solid ${theme.palette.primary.dark}`,
}));

const STATUS_COLORS = {
  "Ready for Loading": { bg: "#f3e5f5", text: "#7b1fa2" },
  "Loaded Into Container": { bg: "#e0f2f1", text: "#00695c" },
  "Shipment Processing": { bg: "#fff3e0", text: "#ef6c00" },
  "In Transit": { bg: "#e1f5fe", text: "#0277bd" },
  "Under Processing": { bg: "#fff3e0", text: "#f57c00" },
  "Arrived at Sort Facility": { bg: "#f1f8e9", text: "#689f38" },
  "Ready for Delivery": { bg: "#fce4ec", text: "#c2185b" },
  "Shipment Delivered": { bg: "#e8f5e8", text: "#2e7d32" },
  Loaded: { bg: "#e8f5e8", text: "#2e7d32" },
  "Assigned to Job": { bg: "#fff3e0", text: "#f57c00" },
  default: { bg: "#555555", text: "#ededed" },
};

const DELIVERED_STATUS = "Shipment Delivered";
const isDelivered = (s) => s === DELIVERED_STATUS;

const getOrderItems = (order) =>
  (order?.receivers || []).flatMap(
    (r) => r.shippingdetails || r.shippingDetails || [],
  );

const isItemDelivered = (item) => {
  const cds = item?.containerDetails || [];
  return (
    isDelivered(item?.status) ||
    (cds.length > 0 && cds.every((cd) => isDelivered(cd.item_status)))
  );
};

const isOrderFullyDelivered = (order) => {
  const items = getOrderItems(order);
  return items.length > 0 && items.every(isItemDelivered);
};

const getStatusColors = (status) =>
  STATUS_COLORS[status] || STATUS_COLORS.default;

const fmtEtaDMY = (v) => {
  if (!v) return "";
  const s = String(v);
  const d = /^\d{4}-\d{2}-\d{2}/.test(s)
    ? new Date(`${s.slice(0, 10)}T00:00:00`)
    : new Date(v);
  return isNaN(d.getTime())
    ? ""
    : d
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/ /g, "-");
};

const StatusChip = ({ status, height, size, eta }) => {
  const colors = getStatusColors(status);
  return (
    <Chip
      label={eta ? `${status} (${eta})` : status}
      size={size}
      sx={{
        height,
        fontSize: "0.65rem",
        marginLeft: 2,
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    />
  );
};

const OrdersList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { places, statuses, companies, customers } = useContext(AppContext);
  const { isLoading, setIsLoading } = useLoading();
  const [rawOrders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [openDocumentsModal, setOpenDocumentsModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [loadingContainers, setLoadingContainers] = useState(false);
  const [assignmentError, setAssignmentError] = useState(null);
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const filterPlaces = useMemo(
    () =>
      (places || []).map((p) => ({ value: p.id.toString(), label: p.name })),
    [places],
  );

  const customersById = useMemo(() => {
    const map = new Map();
    (customers || []).forEach((c) => {
      if (c.zoho_id) map.set(String(c.zoho_id), c);
      if (c.id) map.set(String(c.id), c);
    });
    return map;
  }, [customers]);

  const orders = useMemo(
    () =>
      rawOrders.map((order) => {
        const ownerPrefix =
          order.sender_type === "sender" ? "sender" : "receiver";
        const ownerNameKey = `${ownerPrefix}_name`;
        const ownerId = order.selected_sender_owner;
        if (!ownerId || order[ownerNameKey]?.trim()) return order;
        const customer = customersById.get(String(ownerId));
        if (!customer) return order;
        return {
          ...order,
          [ownerNameKey]:
            customer.contact_name || customer.contact_persons?.[0]?.name || "",
          [`${ownerPrefix}_contact`]:
            customer.primary_phone ||
            customer.contact_persons?.[0]?.phone ||
            "",
          [`${ownerPrefix}_address`]:
            customer.zoho_notes || customer.billing_address || "",
          [`${ownerPrefix}_email`]:
            customer.email || customer.contact_persons?.[0]?.email || "",
          [`${ownerPrefix}_ref`]: customer.zoho_id || customer.ref || "",
          [`${ownerPrefix}_remarks`]:
            customer.zoho_notes || customer.system_notes || "",
        };
      }),
    [rawOrders, customersById],
  );

  const [filters, setFilters] = useState({
    status: "",
    partial: false,
    search: new URLSearchParams(window.location.search).get("search") || "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [openModal, setOpenModal] = useState(false);
  const [assignments, setAssignments] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [tempOrderId, setTempOrderId] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState("");

  const [openDirectAssign, setOpenDirectAssign] = useState(false);
  const [directSelectedContainers, setDirectSelectedContainers] =
    useState(null);

  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState(null);
  const [selectedReceiverForUpdate, setSelectedReceiverForUpdate] =
    useState(null);
  const [
    selectedReceiverForUpdateDetails,
    setSelectedReceiverForUpdateDetails,
  ] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedEta, setSelectedEta] = useState("");
  const [selectedCid, setSelectedCid] = useState("");
  const [etaSaving, setEtaSaving] = useState(false);

  const [openCollectionsModal, setOpenCollectionsModal] = useState(false);
  const [collectionsOrder, setCollectionsOrder] = useState(null);

  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuOrder, setActionMenuOrder] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  const [docTab, setDocTab] = useState(0);
  const [activeDocKey, setActiveDocKey] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [activeOrderData, setActiveOrderData] = useState(null);
  const [openOrderConfirmEmail, setOpenOrderConfirmEmail] = useState(false);
  const printFrameRef = useRef(null);
  const [mblVariant, setMblVariant] = useState("original");

  const toLocalISO = (v) => {
    if (!v) return "";
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  const etaBounds = (currentEta) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let base = today;
    if (currentEta) {
      const c = new Date(currentEta);
      c.setHours(0, 0, 0, 0);
      if (!isNaN(c.getTime()) && c > today) base = c;
    }
    const max = new Date(base);
    max.setDate(max.getDate() + 30);
    return { min: toLocalISO(base), max: toLocalISO(max) };
  };

  const getCurrentEta = () => {
    const d = selectedReceiverForUpdateDetails;
    const cd = selectedCid
      ? d?.containerDetails?.find((c) => c.container.cid === selectedCid)
      : null;
    return cd?.eta || d?.trackingEta || d?.eta;
  };

  const toDateInput = (v) => toLocalISO(v);

  const calcEtaForStatus = (statusName) => {
    const matched = (statuses || []).find((s) => s.order_status === statusName);
    if (matched?.days_offset == null) return "";
    const d = new Date();
    d.setDate(d.getDate() + matched.days_offset);
    const calc = toLocalISO(d);
    const { min, max } = etaBounds(getCurrentEta());
    return calc < min ? min : calc > max ? max : calc;
  };

  const handleOpenActionMenu = (e, order) => {
    e.preventDefault();
    e.stopPropagation();

    setActionMenuOrder(order);
    setMenuPosition({
      top: e.clientY,
      left: e.clientX,
    });
  };

  const handleCloseActionMenu = () => {
    setMenuPosition(null);
    setActionMenuOrder(null);
  };

  const handleStatusUpdate = (orderId, order) => {
    if (isOrderFullyDelivered(orderId)) {
      setSnackbar({
        open: true,
        message: "This order is delivered. Status can no longer be updated.",
        severity: "warning",
      });
      return;
    }
    setSelectedCid("");
    setSelectedOrderForUpdate(orderId);
    setSelectedReceiverForUpdateDetails(null);
    setSelectedEta("");
    if (orderId && orderId.length) {
      const firstRec = orderId[0];
      setSelectedReceiverForUpdate(firstRec);
      setSelectedStatus(firstRec.status || "Received for Shipment");
    }
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setSelectedCid("");
    setOpenStatusDialog(false);
    setSelectedOrderForUpdate(null);
    setSelectedReceiverForUpdate(null);
    setSelectedReceiverForUpdateDetails(null);
    setSelectedStatus("");
    setSelectedEta("");
  };

  const handleStatusChange = (event) => {
    const value = event.target.value;
    setSelectedStatus(value);
    const calculated = calcEtaForStatus(value);
    if (calculated) setSelectedEta(calculated);
  };

  const handleReceiverChange = (event) => {
    setSelectedCid("");
    const recId = event.target.value;
    const rec = selectedOrderForUpdate?.receivers?.find((r) => r.id === recId);
    setSelectedReceiverForUpdate(rec);
    setSelectedReceiverForUpdateDetails(null);
    setSelectedStatus(rec?.status || "Received for Shipment");
    setSelectedEta("");
  };

  const handleShippingChange = (event) => {
    const recId = event.target.value;
    const rec = selectedReceiverForUpdate?.shippingdetails?.find(
      (r) => r.itemRef === recId,
    );
    setSelectedReceiverForUpdateDetails(rec);
    const cds = rec?.containerDetails || [];
    if (cds.length === 1) {
      setSelectedCid(cds[0].container.cid);
      setSelectedStatus(cds[0].item_status || rec?.status || selectedStatus);
      setSelectedEta(toDateInput(cds[0].eta || rec?.trackingEta || rec?.eta));
      return;
    }
    setSelectedCid("");
    if (rec?.status) setSelectedStatus(rec.status);
    setSelectedEta(toDateInput(rec?.trackingEta || rec?.eta));
  };

  const handleContainerChange = (event) => {
    const cid = event.target.value;
    setSelectedCid(cid);
    const cd = selectedReceiverForUpdateDetails?.containerDetails?.find(
      (c) => c.container.cid === cid,
    );
    if (cd?.item_status) setSelectedStatus(cd.item_status);
    setSelectedEta(
      toDateInput(cd?.eta || selectedReceiverForUpdateDetails?.eta),
    );
  };

  const handleCopyContainer = async (containerNumber) => {
    try {
      await navigator.clipboard.writeText(containerNumber);

      setSnackbar({
        open: true,
        message: `Copied: ${containerNumber}`,
        severity: "success",
      });
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleConfirmStatusUpdate = async () => {
    if (selectedItemDelivered) return;
    if (
      !selectedOrderForUpdate ||
      !selectedReceiverForUpdate ||
      !selectedStatus
    )
      return;

    setIsLoading(true);

    try {
      await api.put(
        `/api/orders/${selectedOrderForUpdate.id}/receivers/${selectedReceiverForUpdate.id}/items/${selectedReceiverForUpdateDetails.itemRef}/status`,
        {
          status: selectedStatus,
          itemRefs: [selectedReceiverForUpdateDetails.itemRef],
          cid: selectedCid || null,
        },
      );
      setSnackbar({
        open: true,
        message: `Status updated to "${selectedStatus}" successfully!`,
        severity: "success",
      });
      fetchOrders();
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err.response?.data?.details ||
          err.response?.message ||
          "Failed to update status",
        severity: "error",
      });
      console.error("Error updating status:", err);
    } finally {
      setIsLoading(false);
      handleCloseStatusDialog();
    }
  };

  const handleUpdateEta = async () => {
    if (selectedItemDelivered) return;
    if (
      !selectedOrderForUpdate ||
      !selectedReceiverForUpdateDetails?.itemRef ||
      !selectedEta
    ) {
      setSnackbar({
        open: true,
        message: "Select an item and an ETA first",
        severity: "warning",
      });
      return;
    }
    setEtaSaving(true);
    try {
      await api.put(
        `/api/orders/${selectedOrderForUpdate.id}/items/${selectedReceiverForUpdateDetails.itemRef}/eta`,
        { eta: selectedEta, cid: selectedCid || null },
      );
      setSnackbar({
        open: true,
        message: "ETA updated successfully!",
        severity: "success",
      });
      handleCloseStatusDialog();
      fetchOrders();
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err.response?.data?.details ||
          err.response?.data?.message ||
          "Failed to update ETA",
        severity: "error",
      });
    } finally {
      setEtaSaving(false);
    }
  };

  const handleNotify = async () => {
    if (selectedItemDelivered) return;
    if (
      !selectedOrderForUpdate ||
      !selectedReceiverForUpdate ||
      !selectedStatus
    )
      return;
    setIsLoading(true);
    try {
      await api.post(`/api/orders/${selectedOrderForUpdate.id}/notify`, {
        status: selectedStatus,
        itemRefs: [selectedReceiverForUpdateDetails.itemRef],
        notifyClient: true,
        notifyParties: true,
      });
      setSnackbar({
        open: true,
        message: `Notifications queued for status "${selectedStatus}".`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err.response?.data?.details ||
          err.response?.message ||
          "Failed to queue notifications",
        severity: "error",
      });
      console.error("Error triggering notifications:", err);
    } finally {
      setIsLoading(false);
      handleCloseStatusDialog();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        status: "",
        search: "",
        page: page + 1,
        limit: rowsPerPage,
        includeContainer: true,
      };

      if (filters.status?.trim()) {
        params.status = filters.status.trim();
      }

      if (filters.partial) {
        params.partial = "true";
      }

      if (filters.search?.trim()) {
        params.search = filters.search.trim();
      }

      const response = await api.get("/api/orders", { params });

      const ordersData =
        response.data.data || response.data.orders || response.data || [];
      const totalCount =
        response.data.pagination.total ||
        response.data.pagination.count ||
        response.data.pagination.totalCount ||
        0;
      setOrders(ordersData);
      setTotal(totalCount);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to fetch orders");
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error || err.message || "Failed to fetch orders",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrdersSilently = async () => {
    try {
      const params = {
        status: filters.status?.trim() || "",
        search: filters.search?.trim() || "",
        partial: filters.partial ? "true" : "",
        page: page + 1,
        limit: rowsPerPage,
        includeContainer: true,
      };
      const response = await api.get("/api/orders", { params });
      const ordersData =
        response.data.data || response.data.orders || response.data || [];
      setOrders(ordersData);
    } catch (err) {
      console.error("Silent refresh failed:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, filters.status, filters.partial]);

  const handleClearSearch = async () => {
    setFilters({
      status: "",
      partial: false,
      search: "",
    });

    setPage(0);
    window.location.assign(window.location.pathname);
  };

  const handleDocuments = async (orderId) => {
    setTempOrderId(orderId);
    setDocumentsLoading(true);
    setOpenDocumentsModal(true);
    setActiveDocKey(null);
    setSelectedCompanyId("");
    setActiveOrderData(null);

    try {
      const { data } = await api.get(`/api/orders/pdf-data/${orderId}`);
      const normalizedData = {
        ...data,
        sender_name: data.sender?.name || data.sender_name || "",
        sender_contact: data.sender?.contact || data.sender_contact || "",
        sender_address: data.sender?.address || data.sender_address || "",
        sender_email: data.sender?.email || data.sender_email || "",
        sender_ref: data.sender?.ref || data.sender_ref || "",
        sender_cnic: data.sender?.cnic || data.sender_cnic || "",
        sender_passport_number:
          data.sender?.passportNumber || data.sender_passport_number || "",
        sender_trade_license:
          data.sender?.tradeLicense || data.sender_trade_license || "",
        sender_emirates_id:
          data.sender?.emiratesId || data.sender_emirates_id || "",
        sender_kyc_approved:
          data.sender?.kycApproved ?? data.sender_kyc_approved ?? false,
        sender_kyc_name: data.sender?.name || data.sender_name || "",
        sender_signature_url:
          data.sender?.signatureUrl || data.sender_signature_url || "",
      };

      const mblList = (
        await Promise.all(
          (data.mbl_consignment_ids || []).map((cid) =>
            api
              .get(`/api/orders/consignment-mbl/${cid}`)
              .then((r) => r.data)
              .catch((e) => {
                console.error("MBL fetch failed", cid, e);
                return null;
              }),
          ),
        )
      ).filter(Boolean);
      setActiveOrderData({ ...normalizedData, mblList });
    } catch (err) {
      console.error("Error fetching order data for preview:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Failed to load order data",
        severity: "error",
      });
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleCloseDocumentsModal = () => {
    setOpenDocumentsModal(false);
    setDocuments([]);
    setTempOrderId(null);
    setActiveDocKey(null);
    setSelectedCompanyId("");
    setActiveOrderData(null);
  };

  const getPlaceName = (placeId) => {
    if (!placeId) return "-";
    const place = filterPlaces.find((p) => p.value === placeId.toString());
    return place ? place.label : placeId;
  };

  const handleReceiverAction = (receiver) => {
    alert(`Editing receiver: ${receiver.receiver_name}`);
  };
  const HorizontalKeyValue = ({ data, spacing = 3 }) => (
    <Grid container spacing={spacing}>
      {Object.entries(data).map(([key, value]) => (
        <Grid item xs={12} sm={6} md={4} key={key}>
          <Box
            sx={{
              p: 2,
              border: "1px solid #e3f2fd",
              borderRadius: 2,
              bgcolor: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(245, 130, 32, 0.15)",
                transform: "translateY(-2px)",
                borderColor: "#f58220",
              },
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{
                textTransform: "uppercase",
                fontWeight: "bold",
                fontSize: "0.75rem",
                mb: 0.5,
              }}
            >
              {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontSize: "1rem" }}
            >
              {value || "N/A"}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
  const handleUpdateReceiver = (updatedReceiver) => {
    setOrders((prevOrders) =>
      prevOrders.map(
        (order) =>
          order.receivers?.map((rec) =>
            rec.id === updatedReceiver.id
              ? { ...rec, ...updatedReceiver }
              : rec,
          ) || order.receivers,
      ),
    );
  };

  const containersCache = useRef({ data: null, at: 0 });
  const loadContainers = async (force) => {
    const cache = containersCache.current;
    if (!force && cache.data && Date.now() - cache.at < 60 * 1000) {
      return cache.data;
    }
    const response = await api.get("/api/containers");
    cache.data = response.data.data || [];
    cache.at = Date.now();
    return cache.data;
  };

  const fetchContainers = async (force = true) => {
    if (loadingContainers) return;
    setLoadingContainers(true);
    setAssignmentError(null);
    try {
      const availableContainers = await loadContainers(force !== false);
      setContainers(availableContainers);
    } catch (err) {
      console.error("Error fetching containers:", err);
      setAssignmentError(
        'Failed to fetch containers. Please check the backend query for table "cm".',
      );
      setSnackbar({
        open: true,
        message: "Failed to fetch containers",
        severity: "error",
      });
    } finally {
      setLoadingContainers(false);
    }
  };
  const fetchOrderDetails = async (orderId) => {
    setModalLoading(true);
    setModalError(null);
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      setSelectedOrder(response.data);
    } catch (err) {
      console.error("Error fetching order details:", err);
      setModalError(
        err.response?.data?.error ||
          err.message ||
          "Failed to fetch order details",
      );
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          err.message ||
          "Failed to fetch order details",
        severity: "error",
      });
    } finally {
      setModalLoading(false);
    }
  };
  const handleClick = (id) => {
    const selectedIndex = selectedOrders.indexOf(id);
    let newSelected = [...selectedOrders];
    if (selectedIndex === -1) {
      newSelected.push(id);
    } else {
      newSelected.splice(selectedIndex, 1);
    }
    setSelectedOrders(newSelected);
  };
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = orders.map((n) => n.id);
      setSelectedOrders(newSelected);
      return;
    }
    setSelectedOrders([]);
  };
  const isSelected = (id) => selectedOrders.indexOf(id) !== -1;
  const handleAssign = async (assignments) => {
    if (!assignments || Object.keys(assignments).length === 0) {
      setSnackbar({
        open: true,
        message: "No valid assignments provided.",
        severity: "warning",
      });
      return;
    }

    let hasValid = false;
    Object.values(assignments).forEach((orderAssign) => {
      Object.values(orderAssign).forEach((recAssign) => {
        Object.values(recAssign).forEach((detail) => {
          const qty = parseInt(detail.qty, 10);
          const assignedWeight = parseFloat(
            detail.totalAssignedWeight ?? detail.weight ?? 0,
          );

          if (
            qty > 0 &&
            assignedWeight > 0 &&
            Array.isArray(detail.containers) &&
            detail.containers.length > 0 &&
            detail.orderItemId
          ) {
            hasValid = true;
          }
        });
      });
    });

    if (!hasValid) {
      setSnackbar({
        open: true,
        message:
          "Please assign qty > 0, weight > 0, containers, and orderItemId to at least one detail.",
        severity: "warning",
      });
      return;
    }

    const cleanAssignments = {};
    Object.entries(assignments).forEach(([orderIdStr, orderAssign]) => {
      const cleanOrder = {};
      Object.entries(orderAssign).forEach(([recIdStr, recAssign]) => {
        const cleanRec = {};
        Object.entries(recAssign).forEach(([idxStr, detail]) => {
          if (!detail.orderItemId) {
            console.warn(`Skipping detail ${idxStr}: missing orderItemId`);
            return;
          }

          const containers = (detail.containers || [])
            .map((cid) => parseInt(cid, 10))
            .filter((cid) => !isNaN(cid));

          const qty = parseInt(detail.qty, 10);
          const weightKg = parseFloat(
            detail.totalAssignedWeight ?? detail.weight ?? 0,
          );

          if (qty > 0 && weightKg > 0 && containers.length > 0) {
            cleanRec[idxStr] = {
              orderItemId: parseInt(detail.orderItemId),
              qty,
              totalAssignedWeight: weightKg,
              containers,
              loadingDate: detail.loadingDate || null,
            };
          }
        });

        if (Object.keys(cleanRec).length > 0) {
          cleanOrder[recIdStr] = cleanRec;
        }
      });

      if (Object.keys(cleanOrder).length > 0) {
        cleanAssignments[orderIdStr] = cleanOrder;
      }
    });

    if (Object.keys(cleanAssignments).length === 0) {
      setSnackbar({
        open: true,
        message: "No valid assignments after cleaning.",
        severity: "warning",
      });
      return;
    }

    try {
      const res = await api.post("/api/orders/assign-container", {
        assignments: cleanAssignments,
      });

      const { success, message, updatedOrders, tracking } = res.data;

      if (success) {
        setSnackbar({
          open: true,
          message:
            message ||
            `Assigned successfully (${tracking?.length || 0} receivers)`,
          severity: "success",
        });

        fetchContainers();
        fetchOrders();

        setSelectedOrders([]);
        setSelectedContainer("");
      } else {
        throw new Error(message || "Assignment failed");
      }
    } catch (err) {
      console.error("Assignment error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message ||
        "Failed to assign containers";
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  const onUpdateAssignedQty = (receiverId, newQty) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => ({
        ...order,
        receivers: order.receivers?.map((rec) =>
          rec.id === receiverId ? { ...rec, qty_delivered: newQty } : rec,
        ),
      })),
    );
  };
  const onRemoveContainers = (receiverId) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => ({
        ...order,
        receivers: order.receivers?.map((rec) =>
          rec.id === receiverId ? { ...rec, containers: [] } : rec,
        ),
      })),
    );
  };

  const exportOrders = async () => {
    if (total === 0) {
      setSnackbar({
        open: true,
        message: "No orders to export",
        severity: "warning",
      });
      return;
    }
    setExporting(true);
    try {
      const listed = [];
      let currentPage = 1;
      const pageSize = 100;
      let hasMore = true;
      while (hasMore) {
        const response = await api.get("/api/orders", {
          params: {
            page: currentPage,
            limit: pageSize,
            status: filters.status?.trim() || "",
            search: filters.search?.trim() || "",
            partial: filters.partial ? "true" : "",
          },
        });
        const pageOrders = response.data.data || [];
        listed.push(...pageOrders);
        if (pageOrders.length < pageSize) hasMore = false;
        else currentPage++;
      }

      if (listed.length === 0) {
        setSnackbar({
          open: true,
          message: "No orders found to export",
          severity: "warning",
        });
        return;
      }

      // Oldest -> latest
      listed.sort(
        (a, b) =>
          new Date(a.created_at) - new Date(b.created_at) || a.id - b.id,
      );

      // 2) Load order details + pdf-data in batches of 5 orders
      const loaded = [];
      let failed = 0;
      let partial = 0;
      const batchSize = 5;
      for (let i = 0; i < listed.length; i += batchSize) {
        const chunk = listed.slice(i, i + batchSize);
        const results = await Promise.all(
          chunk.map(async (o) => {
            const [detailRes, pdfRes] = await Promise.allSettled([
              api.get(`/api/orders/${o.id}`),
              api.get(`/api/orders/pdf-data/${o.id}`),
            ]);
            const detail =
              detailRes.status === "fulfilled" ? detailRes.value.data : null;
            const pdf =
              pdfRes.status === "fulfilled" ? pdfRes.value.data : null;
            if (!detail && !pdf) {
              console.error(`Export: failed to load order ${o.id}`);
              return null;
            }
            if (!detail || !pdf) partial++;
            return { detail, pdf };
          }),
        );
        results.forEach((r) => (r ? loaded.push(r) : failed++));
      }

      // 3) Build the three sheets
      const ordersRows = [];
      const itemsRows = [];
      const assignmentRows = [];

      const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-GB") : "");
      const num = (v) => Number(v) || 0;
      const pick = (...vals) =>
        vals.find((v) => v !== null && v !== undefined && v !== "") ?? "";

      loaded.forEach(({ detail, pdf }) => {
        const d = detail || {};
        const p = pdf || {};
        const sender = p.sender || {};

        const consignments =
          p.consignments || (p.consignment ? [p.consignment] : []);
        const findConsignment = (containerNo) =>
          consignments.find((c) =>
            (c.containers || []).includes(containerNo),
          ) || (consignments.length === 1 ? consignments[0] : null);

        const detailRecs = d.receivers || [];
        const pdfRecs = p.receivers || [];
        const recIds = [
          ...new Set([...detailRecs, ...pdfRecs].map((r) => r.id)),
        ];

        const orderConsignments = new Set();
        let orderItemsCount = 0;
        let orderQty = 0;
        let orderWeight = 0;

        recIds.forEach((recId) => {
          const dRec = detailRecs.find((r) => r.id === recId) || {};
          const pRec = pdfRecs.find((r) => r.id === recId) || {};

          const dItems = dRec.shippingDetails || dRec.shippingdetails || [];
          const pItems = pRec.shippingdetails || [];
          const itemIds = [
            ...new Set([...dItems, ...pItems].map((it) => it.id)),
          ];

          const recName = pick(pRec.receiverName, dRec.receiver_name);

          itemIds.forEach((itemId) => {
            const dItem = dItems.find((it) => it.id === itemId) || {};
            const pItem = pItems.find((it) => it.id === itemId) || {};

            const qty = num(pick(dItem.totalNumber, pItem.totalNumber));
            const weight = num(
              pick(dItem.totalWeight, dItem.weight, pItem.weight),
            );
            const category = pick(dItem.category, pItem.category);
            const subcategory = pick(dItem.subcategory, pItem.subcategory);
            const itemRef = pick(dItem.itemRef, pItem.itemRef);

            orderItemsCount += 1;
            orderQty += qty;
            orderWeight += weight;

            // Assignments: prefer history rows from pdf-data, fall back to order details
            const dContainers = dItem.containerDetails || [];
            const assignments = pItem.containerAssignments?.length
              ? pItem.containerAssignments
              : dContainers.map((cd) => ({
                  container_number: cd.container?.container_number || "",
                  assigned_qty: cd.assign_total_box,
                  assigned_weight_kg: cd.assign_weight,
                  status: cd.status,
                  created_at: null,
                }));

            const itemConsignments = new Set();

            assignments.forEach((a) => {
              const containerNo = a.container_number || "";
              const cons = findConsignment(containerNo);
              const consNo = pick(
                cons?.consignment_number,
                dContainers.find(
                  (cd) => cd.container?.container_number === containerNo,
                )?.consignment_number,
              );
              if (consNo) {
                itemConsignments.add(consNo);
                orderConsignments.add(consNo);
              }

              assignmentRows.push({
                "Order ID": d.id ?? p.id,
                "Booking Ref": pick(d.booking_ref, p.booking_ref),
                "Form No": pick(d.rgl_booking_number, p.rgl_booking_number),
                "Receiver ID": recId,
                "Receiver Name": recName,
                "Item ID": itemId,
                "Item Ref": itemRef,
                Category: category,
                Subcategory: subcategory,
                "Container No": containerNo,
                "Container Status": a.status || "",
                "Assigned Qty": num(a.assigned_qty),
                "Assigned Weight (kg)": num(a.assigned_weight_kg),
                "Assigned At": fmtDateTime(a.created_at),
                "Consignment No": consNo,
                Vessel: cons?.vessel || "",
                Voyage: cons?.voyage || "",
                "Shipping Line": cons?.shipping_line_name || "",
                "Seal No": cons?.seal_no || "",
                "Customs CRN": cons?.customs_crn || "",
                "Consignment Gross Weight": cons?.gross_weight ?? "",
              });
            });

            itemsRows.push({
              "Order ID": d.id ?? p.id,
              "Booking Ref": pick(d.booking_ref, p.booking_ref),
              "Form No": pick(d.rgl_booking_number, p.rgl_booking_number),
              "Receiver ID": recId,
              "Receiver Name": recName,
              "Receiver Contact": pick(
                pRec.receiverContact,
                dRec.receiver_contact,
              ),
              "Receiver Email": pick(pRec.receiverEmail, dRec.receiver_email),
              "Receiver Address": pick(
                pRec.receiverAddress,
                dRec.receiver_address,
              ),
              "Receiver Status": dRec.status || "",
              "Item ID": itemId,
              "Item Ref": itemRef,
              Category: category,
              Subcategory: subcategory,
              Type: dItem.type || "",
              "Total Qty": qty,
              "Weight (kg)": num(pick(dItem.weight, pItem.weight)),
              "Total Weight (kg)": weight,
              "Item Status": pick(dItem.status, pItem.status),
              ETA: pick(dItem.eta, pItem.trackingEta),
              ETD: dItem.etd || "",
              "Shipping Line": dItem.shippingLine || "",
              "Delivered Qty": num(dItem.deliveredQty),
              "Remaining Qty": num(dItem.remainingQty),
              "Unassigned Qty": num(dItem.remainingItems),
              "Containers Count": assignments.length,
              Consignments: [...itemConsignments].join(", "),
            });
          });
        });

        ordersRows.push({
          "Order ID": d.id ?? p.id,
          "Booking Ref": pick(d.booking_ref, p.booking_ref),
          "Form No": pick(d.rgl_booking_number, p.rgl_booking_number),
          Status: pick(d.overall_status, d.status, p.status),
          "Created At": fmtDateTime(pick(d.created_at, p.created_at)),
          "Created By": d.created_by || "",
          "Place of Loading": getPlaceName(
            pick(d.place_of_loading, p.place_of_loading),
          ),
          "Place of Delivery": getPlaceName(
            pick(d.place_of_delivery, p.place_of_delivery),
          ),
          "Final Destination": getPlaceName(
            pick(d.final_destination, p.final_destination),
          ),
          "Sender Name": pick(sender.name, d.sender_name),
          "Sender Type": d.sender_type || "",
          "Sender Contact": pick(sender.contact, d.sender_contact),
          "Sender Email": pick(sender.email, d.sender_email),
          "Sender Address": pick(sender.address, d.sender_address),
          "Sender Ref": pick(sender.ref, d.sender_ref),
          "Sender KYC Approved": sender.kycApproved ? "Yes" : "No",
          "Transport Type": pick(d.transport_type, p.transport_type),
          "Truck No": pick(d.truck_number, p.truck_number),
          "Driver Name": pick(d.driver_name, p.dropoff_name),
          "Driver Contact": pick(d.driver_contact, p.drop_off_mobile),
          ETA: d.eta || "",
          "Consignment No(s)": [...orderConsignments].join(", "),
          Receivers: recIds.length,
          "Total Items": orderItemsCount,
          "Total Qty": orderQty,
          "Total Weight (kg)": orderWeight,
        });
      });

      // 4) Build workbook (title row + dark header row)
      const TITLE = "Royal Gulf Shipping and Logistics (Consolidate)";
      const titleStyle = {
        font: { bold: true, sz: 16, color: { rgb: "0D6C6A" } },
        alignment: { horizontal: "left", vertical: "center" },
      };
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { patternType: "solid", fgColor: { rgb: "1F2937" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
      };

      const wb = XLSX.utils.book_new();
      const addSheet = (name, rows) => {
        const headers = rows.length ? Object.keys(rows[0]) : ["No data"];
        const ws = XLSX.utils.aoa_to_sheet([[TITLE], [], headers]);
        if (rows.length) {
          XLSX.utils.sheet_add_json(ws, rows, {
            origin: "A4",
            header: headers,
            skipHeader: true,
          });
        }

        const lastCol = headers.length - 1;
        ws["A1"].s = titleStyle;
        if (lastCol > 0) {
          ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }];
        }
        headers.forEach((_, c) => {
          ws[XLSX.utils.encode_cell({ r: 2, c })].s = headerStyle;
        });

        ws["!cols"] = headers.map((h) => ({
          wch: Math.min(
            45,
            Math.max(
              h.length + 2,
              12,
              ...rows.slice(0, 200).map((r) => String(r[h] ?? "").length + 2),
            ),
          ),
        }));
        ws["!rows"] = [{ hpt: 30 }, {}, { hpt: 24 }];
        ws["!autofilter"] = {
          ref: XLSX.utils.encode_range({
            s: { r: 2, c: 0 },
            e: { r: 2 + rows.length, c: lastCol },
          }),
        };

        XLSX.utils.book_append_sheet(wb, ws, name);
      };

      addSheet("Orders", ordersRows);
      addSheet("Order Items", itemsRows);
      addSheet("Container Assignments", assignmentRows);

      XLSX.writeFile(
        wb,
        `orders-${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      const notes = [];
      if (failed > 0) notes.push(`${failed} failed to load`);
      if (partial > 0) notes.push(`${partial} had incomplete data`);
      setSnackbar({
        open: true,
        message: notes.length
          ? `Exported ${loaded.length} orders (${notes.join(", ")})`
          : `Successfully exported ${loaded.length} orders`,
        severity: notes.length ? "warning" : "success",
      });
    } catch (err) {
      console.error("Error exporting orders:", err);
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error || err.message || "Failed to export orders",
        severity: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (openAssignModal) fetchContainers(false);
  }, [openAssignModal]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (orderId) => {
    navigate(`/orders/${orderId}/edit/`, { state: { orderId } });
  };
  const handleView = (orderId) => {
    fetchOrderDetails(orderId);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedOrder(null);
    setModalError(null);
  };
  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getLeastStatus = (productsSummary, statuses) => {
    if (!productsSummary.length) {
      return { label: "Created", count: 0, eta: null };
    }

    const rankMap = {};

    statuses.forEach((s, idx) => {
      rankMap[s.order_status] = idx;
    });

    const ranked = productsSummary.map((p) => {
      const status = p.shippingDetailStatus || "Created";

      return {
        status,
        rank: rankMap[status] ?? -1,
        eta: p.eta,
      };
    });

    const minRank = Math.min(...ranked.map((r) => r.rank));

    const leastGroup = ranked.filter((r) => r.rank === minRank);
    const lastInGroup = leastGroup[leastGroup.length - 1];
    return {
      label: lastInGroup.status,
      count: ranked.length,
      eta: lastInGroup.eta,
    };
  };

  const normalizeContainers = (containers) => {
    if (!containers) return [];
    if (typeof containers === "string") {
      return [containers.trim()];
    }
    if (Array.isArray(containers)) {
      return containers;
    }
    return [];
  };

  const handleDirectAssign = async () => {
    if (!directSelectedContainers || !selectedOrders.length) {
      setSnackbar({
        open: true,
        message: "Please select a container and at least one order.",
        severity: "warning",
      });
      return;
    }

    setAssigning(true);

    try {
      const status = (directSelectedContainers.current_status || "").trim();

      if (status !== "Available" && status !== "Assigned to Job") {
        throw new Error(
          `Container ${directSelectedContainers.container_number} cannot be assigned. Current status: ${status}`,
        );
      }

      const targets = [];

      for (const orderId of selectedOrders) {
        const order = orders.find((o) => o.id === orderId);

        if (!order?.receivers?.length) continue;

        for (const receiver of order.receivers) {
          if (!receiver?.id) continue;

          const details =
            receiver.shippingdetails || receiver.shippingDetails || [];

          details.forEach((detail, idx) => {
            targets.push({
              orderId: String(orderId),
              receiverId: String(receiver.id),
              detailIndex: String(idx),
              remainingQty: parseInt(detail.totalNumber || 0, 10),
            });
          });
        }
      }

      if (!targets.length) {
        throw new Error(
          "No receivers with remaining quantity found in selected orders",
        );
      }

      const containerId =
        directSelectedContainers.cid ||
        directSelectedContainers.container_number;

      if (!containerId) {
        throw new Error("Selected container is invalid");
      }

      const assignmentList = targets.map((target) => ({
        orderId: target.orderId,
        receiverId: target.receiverId,
        detailIndex: target.detailIndex,
        containerId: String(containerId),
        qty: target.remainingQty,
      }));

      const payload = {
        assignments: assignmentList,
        requestedOrderIds: selectedOrders.map(String),
        totalContainers: 1,
      };

      const response = await api.post(
        "/api/orders/assign-containers-batch",
        payload,
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Server rejected assignment");
      }

      const { updatedCount, updatedOrders = [], skipped = [] } = response.data;

      setSnackbar({
        open: true,
        message: `Container ${directSelectedContainers.container_number} assigned successfully.`,
        severity: "success",
      });

      if (skipped.length > 0) {
        setSnackbar({
          open: true,
          message: `${skipped.length} assignment(s) skipped.`,
          severity: "warning",
        });
      }

      await fetchContainers();
      await fetchOrders();
    } catch (err) {
      console.error("Direct assignment error:", err);

      let msg = err.message || "Failed to assign container";

      if (err.response?.data) {
        const { error, details, message, skipped } = err.response.data;

        msg = details || message || error || msg;

        if (skipped?.length) {
          msg += ` (${skipped.length} skipped)`;
        }
      }

      setSnackbar({
        open: true,
        message: msg,
        severity: "error",
      });
    } finally {
      setAssigning(false);
      setOpenDirectAssign(false);
      setDirectSelectedContainers(null);
    }
  };
  const handleOpenDirectAssign = async (tempData) => {
    setLoadingContainers(true);
    setAssignmentError(null);

    let orderIdRaw;

    if (Array.isArray(tempData) && tempData.length > 0) {
      orderIdRaw = tempData[0];
    } else if (
      typeof tempData === "number" ||
      (typeof tempData === "string" && !isNaN(Number(tempData)))
    ) {
      orderIdRaw = tempData;
    } else if (tempData && typeof tempData === "object") {
      orderIdRaw =
        tempData?.orderId ||
        tempData?.id ||
        tempData?.order_id ||
        tempData?.OrderId ||
        tempData?.orderID;
    }

    const orderId = Number(orderIdRaw);

    if (!orderIdRaw || isNaN(orderId) || orderId <= 0) {
      console.error("No valid orderId could be extracted from tempData:", {
        rawInput: tempData,
        extractedRaw: orderIdRaw,
        converted: orderId,
      });

      setSnackbar({
        open: true,
        message: "Cannot open assignment dialog — no valid order selected",
        severity: "error",
      });
      setLoadingContainers(false);
      return;
    }

    setTempOrderId(orderId);

    try {
      const allContainers = await loadContainers(false);

      const selectedOrderObjects = orders.filter((o) =>
        selectedOrders.includes(o.id),
      );

      const placeIds = [
        ...new Set(
          selectedOrderObjects.map((o) => o.place_of_loading).filter(Boolean),
        ),
      ];

      const placeNames = places
        .filter((p) => placeIds.includes(p.id))
        .map((p) => p.name);

      const availableContainers = allContainers.filter((c) => {
        const status =
          c.current_status === "Available" ||
          c.current_status === "Assigned to Job";

        const location = placeNames.includes(c.location);

        return status && location;
      });

      setContainers(availableContainers);
    } catch (err) {
      console.error("Error fetching containers:", err);
      setAssignmentError("Failed to fetch containers.");
      setSnackbar({
        open: true,
        message: "Failed to fetch containers",
        severity: "error",
      });
    } finally {
      setLoadingContainers(false);
      setOpenDirectAssign(true);
    }
  };
  const handleCloseDirectAssign = () => {
    setOpenDirectAssign(false);
    setDirectSelectedContainers(null);
  };

  const parseSummaryToList = (receivers, order) => {
    if (!receivers || !Array.isArray(receivers)) return [];
    return receivers;
  };

  const parseSummaryToListTwo = (receivers, order) => {
    if (!receivers || !Array.isArray(receivers)) return [];

    const containerList = [];

    receivers.forEach((rec) => {
      if (rec.shippingdetails && Array.isArray(rec.shippingdetails)) {
        rec.shippingdetails.forEach((detail) => {
          if (
            detail.containerDetails &&
            Array.isArray(detail.containerDetails)
          ) {
            detail.containerDetails.forEach((containerDetail) => {
              if (containerDetail.container && containerDetail.status) {
                containerList.push({
                  primary: `${containerDetail.container.container_number} (${rec.receiver_name || "Unnamed Receiver"})`,
                  status: containerDetail.status,
                  receiverId: rec.id,
                  shippingDetailId: detail.id,
                  containerNumber: containerDetail.container.container_number,
                });
              }
            });
          }
        });
      }
    });

    return containerList;
  };

  const PrettyList = ({ receivers, title }) => {
    return (
      <Card
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "#fafafa",
          width: 600,
          boxShadow: "none",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pb: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: "bold", color: "#f58220" }}
            >
              {title}
            </Typography>
            <Chip
              label={`(${receivers?.length || 0})`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{
                fontSize: "0.7rem",
                height: 20,
                "& .MuiChip-label": { px: 0.5 },
              }}
            />
          </Box>

          <Stack spacing={1} sx={{ maxHeight: "auto", overflow: "auto" }}>
            {receivers?.length > 0 ? (
              receivers.map((receiver, rIdx) => (
                <Card
                  key={rIdx}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "grey.200",
                    backgroundColor: "#fff",
                    boxShadow: "none",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight="medium" noWrap>
                        {receiver.receiverName || "Unnamed Receiver"}
                      </Typography>
                    </Box>
                    <StatusChip
                      status={receiver.status}
                      size="small"
                      height={18}
                    />
                  </Stack>

                  <Divider sx={{ mt: 1 }} />

                  {receiver.shippingdetails?.length > 0 ? (
                    receiver.shippingdetails.map((item, sIdx) => (
                      <Box key={sIdx} sx={{ mt: 1, pl: 1 }}>
                        <Box sx={{ flexDirection: "column" }}>
                          <Typography variant="body2" fontWeight="bold">
                            {item.category || "Unknown Category"} -{" "}
                            {item.subcategory || "Unknown Subcategory"} (
                            {item.type || "Unknown Type"}) Total:{" "}
                            {item.totalNumber ?? 0}, Weight: {item.weight ?? 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Qty Total Assigned:{" "}
                            {Math.max(
                              0,
                              parseInt(item.totalNumber || 0) -
                                parseInt(item.remainingItems || 0),
                            ).toLocaleString()}{" "}
                            / Remaining Items:{" "}
                            {parseInt(
                              item.remainingItems || 0,
                            ).toLocaleString()}
                          </Typography>
                        </Box>
                        {item.containerDetails?.length > 0 ? (
                          <Stack
                            direction="row"
                            justifyContent={"space-between"}
                            alignItems={"center"}
                            display={"flex"}
                            spacing={1}
                            sx={{
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                            }}
                          >
                            {item.containerDetails.map((c, cIdx) => (
                              <div
                                style={{
                                  marginTop: 5,
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  alignSelf: "center",
                                  flex: 1,
                                  display: "flex",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Chip
                                    key={cIdx}
                                    label={`${c.container.container_number} - ${c.assign_total_box} boxes (${c.assign_weight} kg)`}
                                    size="large"
                                    color="secondary"
                                    variant="outlined"
                                    sx={{ marginBottom: 2 }}
                                  />

                                  <Tooltip
                                    title="Copy Container Number"
                                    sx={{ marginBottom: 2 }}
                                  >
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleCopyContainer(
                                          c.container.container_number,
                                        )
                                      }
                                    >
                                      <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                                <Chip
                                  label={`ETA: ${c.eta || item.trackingEta ? new Date(c.eta || item.trackingEta).toLocaleDateString() : "N/A"}`}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.65rem",
                                    backgroundColor: "#00695c",
                                    color: "#fff",
                                  }}
                                />
                              </div>
                            ))}
                          </Stack>
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            No containers assigned
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      No shipping details
                    </Typography>
                  )}

                  {receiver.drop_off_details?.length > 0 && (
                    <Box sx={{ mt: 1, pl: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        Drop Off Details:
                      </Typography>
                      {receiver.drop_off_details.map((dod, dIdx) => (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          key={dIdx}
                          display="block"
                        >
                          {dod.drop_method} - {dod.dropoff_name} (
                          {dod.drop_off_mobile}) on {dod.drop_date}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Card>
              ))
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  py: 3,
                  color: "text.secondary",
                }}
              >
                <EmojiEventsIcon
                  sx={{ fontSize: 40, color: "grey.300", mb: 1 }}
                />
                <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                  No receivers available
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Card>
    );
  };

  const CombinedTooltip = ({ order }) => {
    return (
      <PrettyList receivers={order.receivers} title="Receivers & Containers" />
    );
  };

  const parseContainersToList = (order) => {
    if (!order || !order.receivers || order.receivers.length === 0) {
      return [];
    }

    const containerSet = new Set();
    order.receivers.forEach((receiver) => {
      if (receiver.shippingdetails && Array.isArray(receiver.shippingdetails)) {
        receiver.shippingdetails.forEach((shippingDetail) => {
          if (
            shippingDetail.containerDetails &&
            Array.isArray(shippingDetail.containerDetails)
          ) {
            shippingDetail.containerDetails.forEach((containerDetail) => {
              if (
                containerDetail.container &&
                containerDetail.container.container_number
              ) {
                containerSet.add(
                  containerDetail.container.container_number.trim(),
                );
              } else if (containerDetail.container_number) {
                containerSet.add(containerDetail.container_number.trim());
              }
            });
          }
        });
      }
    });

    return Array.from(containerSet).map((num) => ({ primary: num }));
  };

  const PrettyContainersList = ({ items, title }) => {
    return (
      <Box sx={{ p: 1, maxWidth: 280 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: "medium",
            color: "text.secondary",
            mb: 1,
            display: "block",
          }}
        >
          {title} ({items.length})
        </Typography>
        <Stack direction="row" flexWrap="wrap" spacing={0.75} useFlexGap>
          {items.length > 0 ? (
            items.map((item, index) => (
              <Chip
                key={index}
                label={item.primary}
                icon={<CargoIcon fontSize="small" />}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: 1.5,
                  borderColor: "divider",
                  backgroundColor: "#0d6c6a",
                  "& .MuiChip-icon": { color: "secondary.main" },
                  fontSize: "0.75rem",
                  height: 24,
                  "&:hover": { backgroundColor: "#e9ecef" },
                }}
              />
            ))
          ) : (
            <Chip
              label="No containers"
              size="small"
              variant="outlined"
              sx={{
                borderRadius: 1.5,
                borderColor: "divider",
                backgroundColor: "#f8f9fa",
                color: "text.secondary",
                fontSize: "0.75rem",
                height: 24,
              }}
            />
          )}
        </Stack>
      </Box>
    );
  };

  const numSelected = selectedOrders.length;
  const rowCount = orders.length;

  const getReceiverName = (orderData) => {
    if (orderData.receivers && orderData.receivers.length > 0) {
      return orderData.receivers[0].receiverName || null;
    }
    return null;
  };
  const getReceiverAddress = (orderData) => {
    const list = [
      ...new Set(
        (orderData.receivers || [])
          .map((r) => r.receiverAddress)
          .filter(Boolean),
      ),
    ];
    return list.length ? list.join("; ") : "___________";
  };
  const getReceiverEmail = (orderData) => {
    if (orderData.receivers && orderData.receivers.length > 0) {
      return orderData.receivers[0].receiverEmail || null;
    }
    return null;
  };

  const getReceiverKyc = (orderData) => {
    if (orderData.receivers && orderData.receivers.length > 0) {
      return orderData.receivers[0];
    }
    return {};
  };

  const handleFilterText = (e) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
    }));
  };

  const onSearchClick = () => {
    if (filters.search?.trim()) {
      fetchOrders(filters.search.trim());
    }
  };

  function extractContainers(orderData) {
    const containers = [];
    (orderData.receivers || []).forEach((receiver) => {
      (receiver.shippingdetails || []).forEach((detail) => {
        (detail.containerAssignments || []).forEach((a) => {
          if (a.container_number && !containers.includes(a.container_number)) {
            containers.push(a.container_number);
          }
        });
      });
      if (containers.length === 0 && receiver.containers?.length) {
        receiver.containers.forEach((c) => {
          if (!containers.includes(c)) containers.push(c);
        });
      }
    });
    if (containers.length === 0) {
      containers.push(orderData.associated_container || "_________");
    }
    return containers;
  }

  function getContainerData(orderData, containerNumber) {
    const containerData = {
      ...orderData,
      container_number: containerNumber,
      orders: [],
    };
    (orderData.receivers || []).forEach((receiver) => {
      (receiver.shippingdetails || []).forEach((detail) => {
        const assignmentsForThisContainer = (
          detail.containerAssignments || []
        ).filter((a) => a.container_number === containerNumber);
        if (assignmentsForThisContainer.length > 0) {
          assignmentsForThisContainer.forEach((a) => {
            containerData.orders.push({
              orderRef: orderData.rgl_booking_number || "_________",
              itemName: detail.itemName || "",
              quantity: a.assigned_qty || 0,
              weight: a.assigned_weight_kg || 0,
            });
          });
        }
      });
    });
    if (containerData.orders.length === 0) {
      const firstDetail = orderData.receivers?.[0]?.shippingdetails?.[0];
      containerData.orders.push({
        orderRef: orderData.rgl_booking_number || "_________",
        itemName: firstDetail?.itemName || "",
        quantity: firstDetail?.totalNumber || 0,
        weight: firstDetail?.weight || 0,
      });
    }
    return containerData;
  }

  function generateOrderRows(containerData) {
    if (!containerData.orders || containerData.orders.length === 0) {
      return `<tr><td>_________</td><td>_________</td><td>_________</td><td>_________</td></tr>`;
    }
    return containerData.orders
      .map(
        (order) => `
        <tr>
            <td>${order.orderRef || "_________"}</td>
            <td>${order.itemName || "_________"}</td>
            <td>${order.quantity || "_________"}</td>
            <td>${order.weight || "_________"}</td>
        </tr>
    `,
      )
      .join("");
  }

  function getContainerCategory(containerData) {
    const blank = "_________________";
    if (!containerData.receivers || containerData.receivers.length === 0) {
      return containerData.category || blank;
    }
    for (const receiver of containerData.receivers) {
      for (const detail of receiver.shippingdetails || []) {
        for (const a of detail.containerAssignments || []) {
          if (a.container_number === containerData.container_number) {
            return detail.itemName || blank;
          }
        }
      }
    }
    return containerData.category || blank;
  }

  function generateContainerPage(containerData, pageNumber, totalPages) {
    return `
    <div class="page">
        <div class="page-content">
            <div class="stamp-paper"></div>
            <div class="date-section">
                Dated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")}
            </div>

            <div class="address-block">
                <div class="address-line">To,</div>
                <div class="address-line">Anti Narcotics Force,</div>
                <div class="address-line">Port Qasim / Karachi,</div>
                <div class="address-line">The Deputy Collector of Customs Exports,</div>
                <div class="address-line">West Wharf / East Wharf / KICT / PICT / PORT QASIM,</div>
                <div class="address-line">Karachi,</div>
            </div>

            <div class="title">Letter of Indemnity, Undertaking</div>

            <div class="subject-line">
                <span style="font-weight: bold;">SUBJECT:</span> 
                Container No <span style="color: #000000;">${containerData.container_number} , </span>
                Vide GD No : <span style="color: #000000;">${containerData.gd_number || "_________"} </span>
                ${containerData.system_number ? `Order Form # <span style="color: #000000;">${containerData.system_number}` : ""}</span>
            </div>
            
            <div class="exporter-info">
                <span style="font-weight: bold;">EXPORTER:</span> 
                <span style="color: #000000;">${containerData.sender_name || "_________________________"}</span>
            </div>

            <div class="cnic-info">
                <span class="cnic-label">CNIC</span>
                <span>: <span style="color: #000000;">${containerData.sender_emirates_id || "_____-_______-_"}</span></span>
            </div>

            <div class="content-margin">
                WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS, BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
            </div>

            <div class="content-margin point">
                1. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY 
                <span style="color: #000000; font-weight: bold; text-decoration: underline; letter-spacing: 2px;">
                ${getContainerCategory(containerData) || "_____________________"}
                </span>AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC. AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>

            <div class="content-margin point">
                2. WE FURTHER LIKE TO BRING IN YOUR KNOWLEDGE THE SAID CONSIGNMENT CONTAINERS THE BELOW ORDERS FOR EXPORT (CONTAINER ${containerData.container_number}).
            </div>

            <div class="content-margin">
                <table>
                    <thead>
                        <tr><th>Order No</th><th>Item Name</th><th>Qty / Pkgs</th><th>Weight (kg)</th></tr>
                    </thead>
                    <tbody>
                        ${generateOrderRows(containerData)}
                    </tbody>
                </table>
            </div>

            <div class="content-margin point">
                3. IT IS THEREFORE, REQUESTED TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
            </div>

            <div class="signature-section">
                <div class="signature-item">
                    <span class="signature-label">Signature</span>
                    <span class="signature-colon">:</span>
                    ${
                      containerData.sender_signature_url
                        ? `<img style="width:150px;height:auto;filter:grayscale(100%) contrast(100%);mix-blend-mode:multiply;" src="${containerData.sender_signature_url}" />`
                        : ""
                    }
                </div>
                <div class="signature-item">
                    <span class="signature-label">Name</span>
                    <span class="signature-colon">:</span>
                    <span class="signature-line">${containerData.sender_name || ""}</span>
                </div>
            </div>
        </div>
    </div>
  `;
  }

  const resolveCompanyName = (company, fallback) =>
    company?.company?.trim() || fallback;

  const PartyShipperUndertakingForANF = (orderData) => {
    const containers = extractContainers(orderData);
    let allPagesHTML = "";

    containers.forEach((container, containerIndex) => {
      const containerData = getContainerData(orderData, container);

      containerData.orders.forEach((order, orderIndex) => {
        const singleOrderData = {
          ...containerData,
          orders: [order],
        };

        const totalOrders = containerData.orders.length;
        const globalPageNumber = containerIndex * totalOrders + orderIndex + 1;
        const totalPages = containers.reduce((acc, curr) => {
          const currData = getContainerData(orderData, curr);
          return acc + currData.orders.length;
        }, 0);

        allPagesHTML += generateContainerPage(
          singleOrderData,
          globalPageNumber,
          totalPages,
        );
      });
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3rd Party Shipper Undertaking for ANF</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Arial, sans-serif;
            background-color: #f5f5f5;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0;
            margin: 0;
            width: 100%;
        }
            .stamp-paper
            {
                height: 385px;
            }
        
        .page {
            width: 210mm;
            min-height: auto;
            background-color: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            padding: 15mm 15mm 15mm 15mm;
            position: relative;
            margin: 0 auto 20px auto;
            box-sizing: border-box;
        }
        
        .page:not(:last-child) {
            page-break-after: always;
        }
        
        @media print {
            @page {
                size: legal portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto;
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin: 10px 0;
        }
        
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 14px;
        }
        
        th {
            font-weight: bold;
            background-color: #f2f2f2;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 250px;
            height: 20px;
            display: inline-block;
            margin-left: 10px;
        }
        
        .date-section {
            font-family: Arial, sans-serif;
            font-size: 15px;
            color: #000000;
            line-height: 1.4;
            margin-top: 0;
            margin-bottom: 15px;
            text-align: left;
        }

        .address-block {
            margin-top: 0;
            margin-bottom: 15px;
        }

        .address-line {
            font-family: Arial, sans-serif;
            font-size: 15px;
            line-height: 1.6;
        }

        .title {
            text-align: center;
            font-weight: bold;
            font-family: Arial, sans-serif;
            font-size: 18px;
            margin: 15px 0;
            letter-spacing: 1px;
        }

        .subject-line {
            font-family: Arial, sans-serif;
            font-size: 15px;
            margin: 10px 0;
        }

        .exporter-info {
            margin: 10px 0;
            font-family: Arial, sans-serif;
            font-size: 15px;
        }

        .cnic-info {
            margin: 10px 0;
            display: flex;
            font-family: Arial, sans-serif;
            font-size: 15px;
        }

        .cnic-label {
            width: 70px;
            font-weight: bold;
        }

        .content-margin {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }

        .point {
            margin: 15px 0;
            line-height: 1.5;
        }

        .signature-section {
            margin-top: 20px;
            margin-bottom: 0;
        }

        .signature-item {
            margin-bottom: 5px;
            font-family: Arial, sans-serif;
            font-size: 15px;
            display: flex;
            align-items: center;
        }

        .signature-label {
            width: 70px;
        }

        .signature-colon {
            width: 20px;
        }

        .page-content {
            display: flex;
            flex-direction: column;
            height: auto;
        }

        .order-indicator {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
            text-align: right;
        }
    </style>
</head>
<body>
    ${allPagesHTML}
</body>
</html>
`;
  };

  const PartyShipperIndemnityForEachOrderFormat = (orderData, company) => {
    const safeOrder = orderData || {};
    const companyName = resolveCompanyName(
      company,
      "Cargo Aviation Systems (Pvt) Ltd",
    );

    const getSafeValue = (value, defaultValue = "_________________") => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : defaultValue;
    };

    const senderName = safeOrder.sender_name || "";
    const senderEmiratesID = safeOrder.sender_emirates_id || "________";
    const senderPassport = safeOrder.sender_passport_number || "________";
    const senderPhone = safeOrder.sender_contact || "________";
    const senderAddress = safeOrder.sender_address || "Address in Karachi";
    const senderCompany =
      safeOrder.sender_company ||
      safeOrder.sender_name ||
      "Company Name / Individual Name";

    const calculateTotalPackages = () => {
      if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
        return safeOrder.total_packages || 0;
      }
      let total = 0;
      safeOrder.receivers.forEach((receiver) => {
        (receiver.shippingdetails || []).forEach((detail) => {
          total += parseInt(detail.totalNumber) || 0;
        });
      });
      return total;
    };

    const getGoodsDescription = () => {
      if (safeOrder.goods_description) return safeOrder.goods_description;
      const categories = new Set();
      (safeOrder.receivers || []).forEach((r) => {
        (r.shippingdetails || []).forEach((d) => {
          const label = [d.category, d.subcategory]
            .filter(Boolean)
            .join(" ")
            .trim();
          if (label) categories.add(label);
        });
      });
      return categories.size ? Array.from(categories).join(", ") : "";
    };

    const totalPackages = calculateTotalPackages();
    const goodsDescription = getGoodsDescription();
    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3rd Party Shipper Indemnity for each order format</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: A4 ;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto;
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <div style="text-align: right; margin-bottom: 40px;">
            <div style="font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 5px;">${getSafeValue(senderCompany)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 5px;">${getSafeValue(senderAddress)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">CNIC # : ${getSafeValue(senderEmiratesID)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Passport No : ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #000000;">Tel #: ${getSafeValue(senderPhone)}</div>
        </div>

        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 10px;">
            Dated: ${currentDate}
        </div>

        <div style="margin-bottom: 10px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">3rd Party Shipper</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Address,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Karachi - Pakistan.</div>
        </div>

        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Order Number: <span style="color: #000000;">${getSafeValue(safeOrder.rgl_booking_number)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Co-Loader : <span style="color: #000000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #000000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></span>
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that ${companyName}, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #000000; text-decoration: underline;">${getSafeValue(goodsDescription, "_________________")}</span>
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-family: Arial; font-size: 15.0px;">
            <tr>
                <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #000000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">CNIC ID #</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></td>
            </tr>
            <tr>
    <td style="padding: 2px 0; vertical-align: top;">Signature</td>
    <td style="padding: 2px 0; vertical-align: top;">
        ${
          safeOrder.sender_signature_url
            ? `<img src="${safeOrder.sender_signature_url}" style="height:40px;filter: grayscale(100%) contrast(100%);mix-blend-mode: multiply;" />`
            : ": __________"
        }
    </td>
</tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getSafeValue(senderName)}</td>
            </tr>
        </table>

        <div style="text-align: center; font-family: Arial; font-size: 12px; color: #000000; margin-top: 10px; line-height: 1.6;">
            We hereby understand and confirm the document is digitally signed and is fully authorized to use if needed in event of any clearance process.
        </div>
    </div>
</body>
</html>
    `;
  };

  const DubaiLetterOfIndemnityForCustoms = (orderData, company) => {
    const safeOrder = orderData || {};
    const companyName = resolveCompanyName(
      company,
      "Royal Gulf Shipping & Logistics LLC",
    );

    const getSafeValue = (value, defaultValue = "_________________") => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : defaultValue;
    };

    const senderName = safeOrder.sender_name || "";
    const trade_license = safeOrder.sender_trade_license || "________";
    const senderPassport = safeOrder.sender_kyc_approved
      ? safeOrder.sender_passport_number || "________"
      : "__________";
    const senderEmiratesID = safeOrder.sender_kyc_approved
      ? safeOrder.sender_emirates_id || "________"
      : "__________";
    const senderPhone = safeOrder.sender_contact || "________";
    const senderAddress = safeOrder.sender_address || "Address in Karachi";
    const senderCompany =
      safeOrder.sender_company ||
      safeOrder.sender_name ||
      "Company Name / Individual Name";

    const calculateTotalPackages = () => {
      if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
        return safeOrder.total_packages || 0;
      }

      let total = 0;
      safeOrder.receivers.forEach((receiver) => {
        if (
          receiver.shippingdetails &&
          Array.isArray(receiver.shippingdetails)
        ) {
          receiver.shippingdetails.forEach((detail) => {
            total += parseInt(detail.totalNumber) || 0;
          });
        }
      });
      return total;
    };

    const getGoodsDescription = () => {
      if (safeOrder.goods_description) return safeOrder.goods_description;
      const categories = new Set();
      (safeOrder.receivers || []).forEach((r) => {
        (r.shippingdetails || []).forEach((d) => {
          const label = [d.category, d.subcategory]
            .filter(Boolean)
            .join(" ")
            .trim();
          if (label) categories.add(label);
        });
      });
      return categories.size ? Array.from(categories).join(", ") : "";
    };

    const totalPackages = calculateTotalPackages();
    const goodsDescription = getGoodsDescription();
    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dubai Letter of Idemnity for Customs</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: A4;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto;
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <div style="text-align: right; margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 5px;">${getSafeValue(senderCompany)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 5px;">${getSafeValue(senderAddress)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Trade Liceness #: ${getSafeValue(trade_license)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Passport No: ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Emirates ID #: ${getSafeValue(senderEmiratesID)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #000000;">Tel #: ${getSafeValue(senderPhone)}</div>
        </div>

        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 10px;">
            Dated: ${currentDate}
        </div>

        <div style="margin-bottom: 10px;">
                        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Anti Narcotics Force,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Dubai, Sharjah Customs,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">United Arab Emirates.</div>
        </div>

        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Order Number: <span style="color: #000000;">${getSafeValue(safeOrder.rgl_booking_number)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">EXPORTER : <span style="color: #000000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #000000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></span>
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that ${companyName}, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #000000; text-decoration: underline;">${getSafeValue(goodsDescription, "____________________")}</span>            
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: Arial; font-size: 15.0px;">
            <tr>
                <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #000000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Emirates ID #</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">
                    ${
                      safeOrder.sender_kyc_approved &&
                      safeOrder.sender_signature_url
                        ? `<img src="${safeOrder.sender_signature_url}" style="height:50px;filter: grayscale(100%) contrast(100%);mix-blend-mode: multiply;" />`
                        : ": __________"
                    }
                </td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getSafeValue(senderName)}</td>
            </tr>
        </table>

        <div style="text-align: center; font-family: Arial; font-size: 12px; color: #000000; margin-top: 10px; line-height: 1.6;">
            We hereby understand and confirm the document is digitally signed and is fully authorized to use if needed in event of any clearance process.
        </div>
    </div>
</body>
</html>
    `;
  };

  const KarachiGovtCustomsStampPaperUndertakingFormat = (
    orderData,
    company,
  ) => {
    const safeOrder = orderData || {};
    const companyName = resolveCompanyName(
      company,
      "Cargo Aviation Systems (Pvt) Ltd",
    );

    const getSafeValue = (value, defaultValue = "_________________") => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : defaultValue;
    };

    const senderName = safeOrder.sender_name || "";
    const senderCNIC = safeOrder.sender_cnic || "_____-_______-_";
    const senderEmiratesID = safeOrder.sender_emirates_id || "_____-_______-_";
    const senderPassport = safeOrder.sender_passport_number || "________";
    const senderPhone = safeOrder.sender_contact || "________";
    const senderAddress = safeOrder.sender_address || "Address in Karachi";
    const senderCompany =
      safeOrder.sender_company ||
      safeOrder.sender_name ||
      "Company Name / Individual Name";

    const calculateTotalPackages = () => {
      if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
        return safeOrder.total_packages || "123";
      }

      let total = 0;
      safeOrder.receivers.forEach((receiver) => {
        if (
          receiver.shippingdetails &&
          Array.isArray(receiver.shippingdetails)
        ) {
          receiver.shippingdetails.forEach((detail) => {
            total += parseInt(detail.totalNumber) || 0;
          });
        }
      });
      return total || "123";
    };

    const getGoodsDescription = () => {
      if (safeOrder.goods_description) return safeOrder.goods_description;

      if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
        const detail = safeOrder.receivers[0].shippingdetails[0];
        return `${detail.category || "TEXTILE"} ${detail.subcategory || ""}`.trim();
      }

      return "TEXTILE";
    };

    const totalPackages = calculateTotalPackages();
    const goodsDescription = getGoodsDescription();
    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Karachi Govt. Customs Stamp paper undertaking format</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
.stamp-paper
            {
                height: 385px;
            }
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: legal portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto;
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <div class="stamp-paper"></div>
        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 15px;">
            Dated: ${currentDate}
        </div>

        <div style="margin-bottom: 0px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Anti Narcotics Force,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Dubai, Sharjah Customs,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">United Arab Emirates.</div>
        </div>

        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Order Number: <span style="color: #000000;">${getSafeValue(safeOrder.rgl_booking_number)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">EXPORTER : <span style="color: #000000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #000000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></span>
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that "<span style="color: #000000;">${getSafeValue(senderCompany)}</span> & their agents" ${companyName}, are only a Warehousing & Distribution agents on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #000000; text-decoration: underline;">${getSafeValue(goodsDescription, "____________________")}</span>
            </div>
            <div style="font-family: Arial; font-size: 13.2px; color: #000000; text-align: justify;">
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 30px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-family: Arial; font-size: 15.0px;">
            <tr>
                <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #000000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">CNIC ID #</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">
                    ${
                      safeOrder.sender_kyc_approved &&
                      safeOrder.sender_signature_url
                        ? `<img src="${safeOrder.sender_signature_url}" style="height:40px;filter: grayscale(100%) contrast(100%);mix-blend-mode: multiply;" />`
                        : ": __________"
                    }
                </td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getSafeValue(senderName)}</td>
            </tr>
        </table>
    </div>
</body>
</html>
    `;
  };

  const KarachiUndertakingForCustomsEachSenderShouldGive = (
    orderData,
    company,
  ) => {
    const safeOrder = orderData || {};
    const companyName = resolveCompanyName(
      company,
      "Cargo Aviation Systems (Pvt) Ltd",
    );

    const getSafeValue = (value, defaultValue = "_________________") => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : defaultValue;
    };

    const senderName = safeOrder.sender_name || "";
    const senderCNIC = safeOrder.sender_cnic || "_____-_______-_";
    const senderEmiratesID = safeOrder.sender_emirates_id || "_____-_______-_";
    const senderPassport = safeOrder.sender_passport_number || "________";
    const senderPhone = safeOrder.sender_contact || "________";
    const senderAddress = safeOrder.sender_address || "Address in Karachi";
    const senderCompany =
      safeOrder.sender_company ||
      safeOrder.sender_name ||
      "Company Name / Individual Name";

    const calculateTotalPackages = () => {
      if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
        return safeOrder.total_packages || "123";
      }

      let total = 0;
      safeOrder.receivers.forEach((receiver) => {
        if (
          receiver.shippingdetails &&
          Array.isArray(receiver.shippingdetails)
        ) {
          receiver.shippingdetails.forEach((detail) => {
            total += parseInt(detail.totalNumber) || 0;
          });
        }
      });
      return total || "123";
    };

    const getGoodsDescription = () => {
      if (safeOrder.goods_description) return safeOrder.goods_description;

      if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
        const detail = safeOrder.receivers[0].shippingdetails[0];
        return `${detail.category || "TEXTILE"} ${detail.subcategory || ""}`.trim();
      }

      return "TEXTILE";
    };

    const totalPackages = calculateTotalPackages();
    const goodsDescription = getGoodsDescription();
    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Karachi, Undertaking for Customs, Each sender should give</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
.stamp-paper
            {
                height: 385px;
            }
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: legal portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto;
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <div class="stamp-paper"></div>
        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 20px;">
            Dated: ${currentDate}
        </div>

        <div style="margin-bottom: 10px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Anti Narcotics Force,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Port Qasim / Karachi,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">The Deputy Collector of Customs Exports,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">West Wharf / East Wharf / KICT / PICT / PORT QASIM,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Karachi,</div>
        </div>

        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Order Number: <span style="color: #000000;">${getSafeValue(safeOrder.rgl_booking_number)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">EXPORTER : <span style="color: #000000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #000000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></span>
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that "<span style="color: #000000;">${getSafeValue(senderCompany)}</span> & their agents" ${companyName}, are only a Warehousing & Distribution agents on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #000000; text-decoration: underline;">${getSafeValue(goodsDescription, "__TEXTILE_____________")}</span>
            </div>
            <div style="font-family: Arial; font-size: 13.2px; color: #000000; text-align: justify;">
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 30px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: Arial; font-size: 15.0px;">
            <tr>
                <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #000000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">CNIC ID #</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">
                    ${
                      safeOrder.sender_kyc_approved &&
                      safeOrder.sender_signature_url
                        ? `<img src="${safeOrder.sender_signature_url}" style="height:40px;filter: grayscale(100%) contrast(100%);mix-blend-mode: multiply;" />`
                        : ": __________"
                    }
                </td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getSafeValue(senderName)}</td>
            </tr>
        </table>
    </div>
</body>
</html>
    `;
  };

  const ReceiverUndertakingForDubaiCustoms = (orderData, company) => {
    const safeOrder = orderData || {};
    const companyName = resolveCompanyName(
      company,
      "Royal Gulf Shipping & Logistics LLC",
    );

    const getSafeValue = (value, defaultValue = "_________________") => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : defaultValue;
    };

    const senderName = safeOrder.sender_name || "";
    const trade_license = safeOrder.sender_trade_license || "________";
    const senderPassport = safeOrder.sender_kyc_approved
      ? safeOrder.sender_passport_number || "________"
      : "__________";
    const senderEmiratesID = safeOrder.sender_kyc_approved
      ? safeOrder.sender_emirates_id || "________"
      : "__________";
    const senderPhone = safeOrder.sender_contact || "________";
    const senderAddress = safeOrder.sender_address || "Address in Karachi";
    const senderCompany =
      safeOrder.sender_company ||
      safeOrder.sender_name ||
      "Company Name / Individual Name";

    const receiverKyc = getReceiverKyc(safeOrder);

    const calculateTotalPackages = () => {
      if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
        return safeOrder.total_packages || "123";
      }

      let total = 0;
      safeOrder.receivers.forEach((receiver) => {
        if (
          receiver.shippingdetails &&
          Array.isArray(receiver.shippingdetails)
        ) {
          receiver.shippingdetails.forEach((detail) => {
            total += parseInt(detail.totalNumber) || 0;
          });
        }
      });
      return total || "123";
    };

    const getGoodsDescription = () => {
      if (safeOrder.goods_description) return safeOrder.goods_description;

      if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
        const detail = safeOrder.receivers[0].shippingdetails[0];
        return `${detail.category || "TEXTILE"} ${detail.subcategory || ""}`.trim();
      }

      return "TEXTILE";
    };

    const totalPackages = calculateTotalPackages();
    const goodsDescription = getGoodsDescription();
    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receiver Undertaking for Dubai Customs</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: A4 portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto;
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <div style="text-align: right; margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 5px;">${getSafeValue(senderCompany)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 5px;">${getSafeValue(senderAddress)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Trade Liceness #: ${getSafeValue(trade_license)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Passport No: ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Emirates ID #: ${getSafeValue(senderEmiratesID)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #000000;">Tel #: ${getSafeValue(senderPhone)}</div>
        </div>

        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 10px;">
            Dated: ${currentDate}
        </div>

        <div style="margin-bottom: 10px;">
                        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">3rd Party Consignee</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Address, </div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Dubai UAE.</div>
        </div>

        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> IMPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Order Number: <span style="color: #000000;">${getSafeValue(safeOrder.rgl_booking_number)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Co-Loader : <span style="color: #000000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #000000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></span>
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that ${companyName}, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #000000; text-decoration: underline;">${getSafeValue(goodsDescription, "____________________")}</span>
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: Arial; font-size: 15.0px;">
            <tr>
            <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
            <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #000000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Emirates ID # 	</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">
                    ${
                      safeOrder.sender_kyc_approved &&
                      safeOrder.sender_signature_url
                        ? `<img src="${safeOrder.sender_signature_url}" style="height:50PX;filter: grayscale(100%) contrast(100%);mix-blend-mode: multiply;" />`
                        : ": __________"
                    }
                </td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getSafeValue(senderName)}</td>
            </tr>
        </table>

        <div style="text-align: center; font-family: Arial; font-size: 12px; color: #000000; margin-top: 5px;">
            We hereby understand and confirm the document is digitally signed and is fully authorized to use if needed in event of any clearance process.
        </div>
    </div>
</body>
</html>
    `;
  };

  const ReceiverUndertakingDubaiANF = (orderData, company) => {
    const safeOrder = orderData || {};
    const companyName = resolveCompanyName(
      company,
      "Royal Gulf Shipping & Logistics LLC",
    );

    const getSafeValue = (value, defaultValue = "_________________") => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : defaultValue;
    };

    const senderName = safeOrder.sender_name || "";
    const trade_license = safeOrder.sender_trade_license || "________";
    const senderPassport = safeOrder.sender_kyc_approved
      ? safeOrder.sender_passport_number || "________"
      : "__________";
    const senderEmiratesID = safeOrder.sender_kyc_approved
      ? safeOrder.sender_emirates_id || "________"
      : "__________";
    const senderPhone = safeOrder.sender_contact || "________";
    const senderAddress = safeOrder.sender_address || "Address in Karachi";
    const senderCompany =
      safeOrder.sender_company ||
      safeOrder.sender_name ||
      "Company Name / Individual Name";

    const receiverKyc = getReceiverKyc(safeOrder);

    const calculateTotalPackages = () => {
      if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
        return safeOrder.total_packages || "123";
      }

      let total = 0;
      safeOrder.receivers.forEach((receiver) => {
        if (
          receiver.shippingdetails &&
          Array.isArray(receiver.shippingdetails)
        ) {
          receiver.shippingdetails.forEach((detail) => {
            total += parseInt(detail.totalNumber) || 0;
          });
        }
      });
      return total || "123";
    };

    const getGoodsDescription = () => {
      if (safeOrder.goods_description) return safeOrder.goods_description;

      if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
        const detail = safeOrder.receivers[0].shippingdetails[0];
        return `${detail.category || "TEXTILE"} ${detail.subcategory || ""}`.trim();
      }

      return "TEXTILE";
    };

    const totalPackages = calculateTotalPackages();
    const goodsDescription = getGoodsDescription();
    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receiver Undertaking Dubai ANF</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: A4 portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto;
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <div style="text-align: right; margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 5px;">${getSafeValue(senderCompany)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 5px;">${getSafeValue(senderAddress)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Trade Liceness #: ${getSafeValue(trade_license)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Passport No: ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Emirates ID #: ${getSafeValue(senderEmiratesID)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #000000;">Tel #: ${getSafeValue(senderPhone)}</div>
        </div>

        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 10px;">
            Dated: ${currentDate}
        </div>

        <div style="margin-bottom: 10px;">
                        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Anti Narcotics Force,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Dubai, Sharjah Customs,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">United Arab Emirates. </div>
        </div>

        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">IMPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Order Number: <span style="color: #000000;">${getSafeValue(safeOrder.rgl_booking_number)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Co-Loader : <span style="color: #000000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #000000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></span>
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that ${companyName}, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #000000; text-decoration: underline;">${getSafeValue(goodsDescription, "____________________")}</span>
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: Arial; font-size: 15.0px;">
            <tr>
            <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
            <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #000000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Emirates ID # 	</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">
                    ${
                      safeOrder.sender_kyc_approved &&
                      safeOrder.sender_signature_url
                        ? `<img src="${safeOrder.sender_signature_url}" style="height:50px;filter: grayscale(100%) contrast(100%);mix-blend-mode: multiply;" />`
                        : ": __________"
                    }
                </td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getSafeValue(senderName)}</td>
            </tr>
        </table>

        <div style="text-align: center; font-family: Arial; font-size: 12px; color: #000000; margin-top: 5px;">
            We hereby understand and confirm the document is digitally signed and is fully authorized to use if needed in event of any clearance process.
        </div>
    </div>
</body>
</html>
    `;
  };

  const SenderUndertakingForThirdPartyShipper = (orderData, company) => {
    const safeOrder = orderData || {};
    const companyName = resolveCompanyName(
      company,
      "Cargo Aviation Systems (Pvt) Ltd",
    );

    const getSafeValue = (value, defaultValue = "_________________") => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : defaultValue;
    };

    const senderName = safeOrder.sender_name || "";
    const senderCNIC = safeOrder.sender_cnic || "_____-_______-_";
    const trade_license = safeOrder.sender_trade_license || "________";
    const senderPassport = safeOrder.sender_passport_number || "________";
    const senderEmiratesID = safeOrder.sender_emirates_id || "________";
    const consignmentNumber =
      safeOrder.consignment?.consignment_number || "________";
    const consignmentVessel = safeOrder.consignment?.vessel || "________";
    const consignmentVoyage = safeOrder.consignment?.voyage || "________";
    const senderPhone = safeOrder.sender_contact || "________";
    const senderAddress = safeOrder.sender_address || "Address in Karachi";
    const senderCompany =
      safeOrder.sender_company ||
      safeOrder.sender_name ||
      "Company Name / Individual Name";

    const calculateTotalPackages = () => {
      if (!safeOrder.receivers || !Array.isArray(safeOrder.receivers)) {
        return safeOrder.total_packages || "123";
      }

      let total = 0;
      safeOrder.receivers.forEach((receiver) => {
        if (
          receiver.shippingdetails &&
          Array.isArray(receiver.shippingdetails)
        ) {
          receiver.shippingdetails.forEach((detail) => {
            total += parseInt(detail.totalNumber) || 0;
          });
        }
      });
      return total || "123";
    };

    const getGoodsDescription = () => {
      if (safeOrder.goods_description) return safeOrder.goods_description;

      if (safeOrder.receivers && safeOrder.receivers[0]?.shippingdetails?.[0]) {
        const detail = safeOrder.receivers[0].shippingdetails[0];
        return `${detail.category || "TEXTILE"} ${detail.subcategory || ""}`.trim();
      }

      return "TEXTILE";
    };

    const totalPackages = calculateTotalPackages();
    const goodsDescription = getGoodsDescription();
    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sender Undertaking for 3rd Party Shipper</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .document {
            width: 850px;
            margin: 0 auto;
            background-color: white;
            padding: 50px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            min-width: 300px;
            height: 1px;
            display: inline-block;
            margin-left: 5px;
        }
            @media print {
            @page {
                size: A4 portrait;
                margin: 0;
            }
            
            body {
                background-color: white;
                padding: 0;
                margin: 0;
                width: 100%;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: auto;
                min-height: auto;
                position: relative;
                background: white;
                border: none;
            }
            
            .page:last-child {
                page-break-after: auto;
            }
            
            html, body {
                height: auto;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <div style="text-align: right; margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 5px;">${getSafeValue(senderCompany)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 5px;">${getSafeValue(senderAddress)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Trade Liceness #: ${getSafeValue(trade_license)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Passport No: ${getSafeValue(senderPassport)}</div>
            <div style="font-family: Arial; font-size: 13.1px; color: #000000; margin-bottom: 5px;">Emirates ID #: ${getSafeValue(senderEmiratesID)}</div>
            <div style="font-family: Arial; font-size: 14.1px; color: #000000;">Tel #: ${getSafeValue(senderPhone)}</div>
        </div>

        <div style="font-style: italic; font-family: Arial; font-size: 14.1px; color: #000000; margin-bottom: 10px;">
            Dated: ${currentDate}
        </div>

        <div style="margin-bottom: 10px;">
                        <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">To,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">3rd Party Shipper</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Address, </div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Karachi - Pakistan.</div>
        </div>

        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">EXPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Order Number: <span style="color: #000000;">${getSafeValue(safeOrder.rgl_booking_number)}</span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Co-Loader : <span style="color: #000000;">${getSafeValue(senderName)}</span></span>
            </div>
            <div style="margin-bottom: 5px; margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">Passport No : <span style="color: #000000;">${getSafeValue(senderPassport)}</span></span>
            </div>
            <div style="margin-left: 99px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">CNIC : <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></span>
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000;">
            WE, THE UNDERSIGNED, DO HEREBY UNDERTAKE, AND AGREE AS FOLLOWS,
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            1. BOUND AND UNDERTAKE OURSELVES THAT IF ANY CONTRABAND DRUG OR NARCOTICS ARE FOUND OR REPORTED IN THE GOODS, ITS PACKING OR CONCEALED IN THE SUBJECT QTY AT ANY STAGE UNDER RULES AND REGULATION MADE THEREUNDER.
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            2. We hereby agree that ${companyName}, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
        </div>

        <div style="margin-bottom: 20px;">
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
                3. FURTHER UNDERTAKE THAT THIS CONSIGNMENT CONTAIN ONLY
                <span style="font-weight: bold; font-family: Arial; font-size: 13.6px; color: #000000; text-decoration: underline;">${getSafeValue(goodsDescription, "____________________")}</span>
                AND DOES NOT CONTAIN ANY CONTRABAND NARCOTIC / DRUGS ETC., AND UNDERTAKE TO BE FULLY HELD GOOD OWNER RESPONSIBLE IF FOUND IN THE CONSIGNMENT AT ANY STAGE.
            </div>
        </div>

        <div style="font-family: Arial; font-size: 15.0px; color: #000000; line-height: 1.6; margin-bottom: 10px;">
            4. IF IS THEREFORE, REQUEST TO ACCEPT OUR UNDERTAKING FOR ALLOWING SHIPMENT OF GOODS.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: Arial; font-size: 15.0px;">
            <tr>
            <td style="padding: 2px 0; width: 150px; vertical-align: top;">GOODS OWNER</td>
            <td style="padding: 2px 0; vertical-align: top;">: <span style="font-weight: bold; color: #000000;">${getSafeValue(senderName)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Company Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderCompany)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Delivery Address</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getReceiverAddress(safeOrder)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Emirates ID # 	</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">
                    ${
                      safeOrder.sender_kyc_approved &&
                      safeOrder.sender_signature_url
                        ? `<img src="${safeOrder.sender_signature_url}" style="height:40px;filter: grayscale(100%) contrast(100%);mix-blend-mode: multiply;" />`
                        : ": __________"
                    }
                </td>
            </tr>
            <tr>
                <td style="padding: 2px 0; vertical-align: top;">Name</td>
                <td style="padding: 2px 0; vertical-align: top;">: ${getSafeValue(senderName)}</td>
            </tr>
        </table>

        <div style="text-align: center; font-family: Arial; font-size: 12px; color: #000000; margin-top: 5px;">
            We hereby understand and confirm the document is digitally signed and is fully authorized to use if needed in event of any clearance process.
        </div>
    </div>
</body>
</html>
    `;
  };

  const BRANDABLE_DOCUMENT_GENERATORS = {
    "WHARFAGE - CONSIGNMENT NOTE.pdf": WharfageConsignmentNote,
    "House Bill of Lading (HBL).pdf": (d, c) =>
      HouseBillOfLading(d, c, getPlaceName),
    "3rd Party Shipper Undertaking for ANF.pdf": PartyShipperUndertakingForANF,
    "3rd Party Shipper Indemnity for each order format.pdf":
      PartyShipperIndemnityForEachOrderFormat,
    "Dubai Letter of Idemnity for Customs.pdf":
      DubaiLetterOfIndemnityForCustoms,
    "Karachi Govt. Customs Stamp paper undertaking format.pdf":
      KarachiGovtCustomsStampPaperUndertakingFormat,
    "Karachi, Undertaking for Customs, Each sender should give.pdf":
      KarachiUndertakingForCustomsEachSenderShouldGive,
    "Receiver Undertaking for Dubai Customs.pdf":
      ReceiverUndertakingForDubaiCustoms,
    "Receiver Undertaking Dubai ANF.pdf": ReceiverUndertakingDubaiANF,
    "Sender Undertaking for 3rd Party Shipper.pdf":
      SenderUndertakingForThirdPartyShipper,
  };

  const isBrandable = (docName) => !!BRANDABLE_DOCUMENT_GENERATORS[docName];

  const activeCompany =
    companies?.find((c) => c.id === selectedCompanyId) || null;

  const activeDocHtml = useMemo(() => {
    if (!activeDocKey || !activeOrderData) return "";
    if (isBrandable(activeDocKey)) {
      if (!activeCompany) return "";
      return BRANDABLE_DOCUMENT_GENERATORS[activeDocKey](
        activeOrderData,
        activeCompany,
        { variant: mblVariant },
      );
    }
    return "";
  }, [activeDocKey, activeOrderData, activeCompany, filterPlaces, mblVariant]);

  const handlePrintActiveDoc = () => {
    if (!activeDocHtml || !printFrameRef.current) return;
    const frame = printFrameRef.current;
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(activeDocHtml);
    doc.close();
    frame.contentWindow.focus();
    frame.contentWindow.print();
  };

  const selectedContainerDetail =
    selectedReceiverForUpdateDetails?.containerDetails?.find(
      (c) => c.container.cid === selectedCid,
    );
  const isMultiContainer =
    (selectedReceiverForUpdateDetails?.containerDetails?.length || 0) > 1;
  const selectedItemDelivered = !selectedReceiverForUpdateDetails
    ? false
    : isMultiContainer
      ? isDelivered(selectedContainerDetail?.item_status)
      : isItemDelivered(selectedReceiverForUpdateDetails);

  const needsCid =
    (selectedReceiverForUpdateDetails?.containerDetails?.length || 0) > 1 &&
    !selectedCid;

  const etaRange = etaBounds(getCurrentEta());
  const etaInvalid =
    !!selectedEta && (selectedEta < etaRange.min || selectedEta > etaRange.max);

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
        >
          <CircularProgress size={24} />
          <Typography variant="h6" color="#f58220">
            Loading orders...
          </Typography>
        </Stack>
      </Paper>
    );
  }
  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={fetchOrders}
          sx={{ mt: 2, backgroundColor: "#f58220" }}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <>
      <Dialog
        open={openDocumentsModal}
        onClose={handleCloseDocumentsModal}
        maxWidth="xxl"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogContent sx={{ mt: 1, p: 0 }}>
          <Box sx={{ display: "flex", height: "75vh" }}>
            <Box sx={{ overflow: "auto" }}>
              {(() => {
                const docGroups = [
                  {
                    label: "Branded Documents",
                    color: "#1a7a6e",
                    docs: [
                      "House Bill of Lading (HBL).pdf",
                      "WHARFAGE - CONSIGNMENT NOTE.pdf",
                    ],
                  },
                  {
                    label: "Customs & Undertakings",
                    color: "#5c3d99",
                    docs: [
                      "3rd Party Shipper Undertaking for ANF.pdf",
                      "3rd Party Shipper Indemnity for each order format.pdf",
                      "Dubai Letter of Idemnity for Customs.pdf",
                      "Karachi Govt. Customs Stamp paper undertaking format.pdf",
                      "Karachi, Undertaking for Customs, Each sender should give.pdf",
                      "Receiver Undertaking for Dubai Customs.pdf",
                      "Receiver Undertaking Dubai ANF.pdf",
                      "Sender Undertaking for 3rd Party Shipper.pdf",
                    ],
                  },
                ];

                const getFileIcon = (docName) => {
                  const ext = docName.split(".").pop()?.toLowerCase() || "";
                  if (ext === "pdf") return <PictureAsPdfIcon color="error" />;
                  if (ext === "docx" || ext === "doc")
                    return <DescriptionIcon color="primary" />;
                  if (ext === "xlsx" || ext === "xls")
                    return <AssignmentIcon color="success" />;
                  return <InsertDriveFileIcon />;
                };

                const activeGroup = docGroups[docTab];

                return (
                  <>
                    <Box
                      sx={{
                        borderBottom: "1px solid #e0e0e0",
                        bgcolor: "#fafafa",
                      }}
                    >
                      <Tabs
                        value={docTab}
                        onChange={(e, v) => setDocTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        TabIndicatorProps={{ style: { height: 3 } }}
                        sx={{
                          minHeight: 44,
                          "& .MuiTab-root": {
                            minHeight: 44,
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            px: 2,
                          },
                        }}
                      >
                        {docGroups.map((g, i) => (
                          <Tab
                            key={i}
                            label={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.75,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    bgcolor: g.color,
                                    flexShrink: 0,
                                  }}
                                />
                                {g.label}
                                <Chip
                                  label={g.docs.length}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.65rem",
                                    bgcolor: docTab === i ? g.color : "#e0e0e0",
                                    color: docTab === i ? "#fff" : "#555",
                                    "& .MuiChip-label": { px: 0.75 },
                                  }}
                                />
                              </Box>
                            }
                          />
                        ))}
                      </Tabs>
                    </Box>

                    <Box sx={{ p: 2 }}>
                      <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                              <TableCell sx={{ fontWeight: "bold", width: 40 }}>
                                #
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: "bold", maxWidth: 350 }}
                              >
                                Document Name
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: "bold", maxWidth: 260 }}
                              >
                                Actions
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {activeGroup.docs.map((docName, index) => (
                              <TableRow
                                key={index}
                                hover
                                selected={activeDocKey === docName}
                                sx={{
                                  "&:nth-of-type(odd)": { bgcolor: "#fafafa" },
                                }}
                              >
                                <TableCell
                                  sx={{ color: "#999", fontSize: "0.75rem" }}
                                >
                                  {index + 1}
                                </TableCell>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    {getFileIcon(docName)}
                                    <Typography
                                      variant="body2"
                                      fontWeight="medium"
                                    >
                                      {docName}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    {isBrandable(docName) && (
                                      <Select
                                        size="small"
                                        value={
                                          activeDocKey === docName
                                            ? selectedCompanyId
                                            : ""
                                        }
                                        displayEmpty
                                        onChange={(e) => {
                                          setSelectedCompanyId(e.target.value);
                                          setActiveDocKey(docName);
                                        }}
                                        sx={{
                                          minWidth: 140,
                                          height: 32,
                                          fontSize: "0.75rem",
                                        }}
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
                                    )}
                                    <Tooltip title="Preview">
                                      <span>
                                        <IconButton
                                          size="small"
                                          disabled={
                                            !activeOrderData ||
                                            (isBrandable(docName) &&
                                              !selectedCompanyId &&
                                              activeDocKey !== docName)
                                          }
                                          onClick={() =>
                                            setActiveDocKey(docName)
                                          }
                                          sx={{
                                            color: "#0d6c6a",
                                            "&:hover": {
                                              bgcolor: "rgba(13,108,106,0.1)",
                                            },
                                          }}
                                        >
                                          <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </>
                );
              })()}
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ p: 1.5 }}
              >
                <Button
                  size="small"
                  startIcon={<PrintIcon />}
                  disabled={!activeDocHtml}
                  onClick={handlePrintActiveDoc}
                >
                  Print
                </Button>
              </Stack>
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  m: 1.5,
                  mt: 0,
                  p: 2,
                  overflow: "auto",
                  bgcolor: "#fff",
                }}
              >
                {!activeDocKey ? (
                  <Typography variant="body2" color="text.secondary">
                    Select a document to preview.
                  </Typography>
                ) : !activeOrderData ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 4 }}
                  >
                    <CircularProgress size={22} />
                  </Box>
                ) : isBrandable(activeDocKey) && !selectedCompanyId ? (
                  <Typography variant="body2" color="text.secondary">
                    Select a company for this document.
                  </Typography>
                ) : (
                  <Box dangerouslySetInnerHTML={{ __html: activeDocHtml }} />
                )}
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <iframe
          ref={printFrameRef}
          title="print-frame"
          style={{ position: "absolute", width: 0, height: 0, border: "none" }}
        />
      </Dialog>

      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" fontWeight="bold" color="#f58220">
            Orders List
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              disabled={numSelected === 0}
              onClick={() => setOpenAssignModal(true)}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                backgroundColor: "#0d6c6a",
                color: "#fff",
                "&:hover": { backgroundColor: "#0d6c6a" },
              }}
            >
              Add Selected to Container ({numSelected})
            </Button>
            <Button
              variant="contained"
              disabled={numSelected === 0 || loadingContainers}
              onClick={() => handleOpenDirectAssign(selectedOrders)}
              startIcon={<AssignmentIcon />}
              sx={{
                borderRadius: 2,
                backgroundColor: "#f58220",
                color: "#fff",
                "&:hover": { backgroundColor: "#f58220" },
              }}
            >
              Direct Assign Containers ({numSelected})
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportOrders}
              disabled={isLoading || exporting || total === 0}
              sx={{
                borderRadius: 2,
                borderColor: "#0d6c6a",
                color: "#0d6c6a",
                "&:hover": {
                  borderColor: "#0d6c6a",
                  backgroundColor: "#0d6c6a",
                  color: "#fff",
                },
              }}
            >
              {exporting ? (
                <CircularProgress size={20} color="inherit" />
              ) : null}
              Export Orders
            </Button>
            <Button
              variant="outlined"
              onClick={() => setOpenOrderConfirmEmail(true)}
              startIcon={<DescriptionIcon />}
              sx={{
                borderRadius: 2,
                borderColor: "#f58220",
                color: "#f58220",
                "&:hover": {
                  borderColor: "#f58220",
                  backgroundColor: "#f58220",
                  color: "#fff",
                },
              }}
            >
              Booking Confirmation
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/orders/add")}
              sx={{
                borderRadius: 2,
                backgroundColor: "#0d6c6a",
                color: "#fff",
                "&:hover": { backgroundColor: "#0d6c6a" },
              }}
            >
              New Order
            </Button>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={2} mb={3} alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              label="Search Orders"
              placeholder="Booking Ref, Form No, Sender, Receiver, Status..."
              type="search"
              name="search"
              value={filters.search || ""}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }));
              }}
              size="small"
              sx={{ width: 320 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filters.search?.trim()) {
                    fetchOrders(filters.search.trim());
                  } else {
                    setFilters((prev) => ({ ...prev, search: "" }));
                    fetchOrders("");
                  }
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => {
                        if (filters.search?.trim()) {
                          fetchOrders(filters.search.trim());
                        } else {
                          setFilters((prev) => ({ ...prev, search: "" }));
                          fetchOrders();
                        }
                      }}
                      sx={{
                        color: "primary.main",
                      }}
                    >
                      {filters.search?.trim() ? <SearchIcon /> : <SearchIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              disabled={!filters.search}
              onClick={handleClearSearch}
            >
              Clear Search
            </Button>
          </Box>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filters.status}
              label="Status"
              onChange={handleFilterChange}
            >
              <MenuItem value="">All</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status.id} value={status.order_status}>
                  {status.order_status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box
            onClick={() => {
              setFilters((prev) => ({ ...prev, partial: !prev.partial }));
              setPage(0);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              pl: 0.5,
              pr: 1.5,
              height: 40,
              borderRadius: 2,
              cursor: "pointer",
              userSelect: "none",
              border: "1.5px solid",
              borderColor: filters.partial ? "#f58220" : "#d0d5dd",
              bgcolor: filters.partial ? "#fff4e8" : "#fff",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "#f58220",
                bgcolor: "#fff9f2",
              },
            }}
          >
            <Checkbox
              size="small"
              checked={filters.partial}
              disableRipple
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, partial: e.target.checked }));
                setPage(0);
              }}
              sx={{
                p: 0.75,
                color: "#f58220",
                "&.Mui-checked": { color: "#f58220" },
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: filters.partial ? "#d96f10" : "text.primary",
              }}
            >
              Partially Collected
            </Typography>
            {filters.partial && (
              <Chip
                size="small"
                label={total}
                sx={{
                  height: 20,
                  ml: 0.5,
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  bgcolor: "#f58220",
                  color: "#fff",
                }}
              />
            )}
          </Box>
        </Stack>

        <TableContainer
          sx={{
            borderRadius: 2,
            overflow: "scroll",
            boxShadow: 2,
            width: "100%",
            "&::-webkit-scrollbar": {
              height: 6,
              width: 6,
            },
            "&::-webkit-scrollbar-track": {
              background: "background.paper",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#0d6c6a",
              borderRadius: 3,
              display: "table-cell",
            },
          }}
        >
          <Table
            stickyHeader
            size="small"
            aria-label="Consignments table"
            sx={{}}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: "#0d6c6a" }}>
                <StyledTableHeadCell
                  padding="checkbox"
                  sx={{ bgcolor: "#0d6c6a", color: "#fff" }}
                ></StyledTableHeadCell>
                {[
                  <StyledTableHeadCell
                    sx={{ bgcolor: "#0d6c6a", color: "#fff" }}
                    key="created"
                  >
                    Created At
                  </StyledTableHeadCell>,

                  <StyledTableHeadCell
                    sx={{ bgcolor: "#0d6c6a", color: "#fff" }}
                    key="ref"
                  >
                    Tracking ID
                  </StyledTableHeadCell>,
                  <StyledTableHeadCell
                    sx={{ bgcolor: "#0d6c6a", color: "#fff" }}
                    key="form_no"
                  >
                    Form No
                  </StyledTableHeadCell>,
                  <StyledTableHeadCell
                    sx={{ bgcolor: "#0d6c6a", color: "#fff", width: 200 }}
                    key="receivers"
                  >
                    Receivers & Containers
                  </StyledTableHeadCell>,
                  <StyledTableHeadCell
                    sx={{ bgcolor: "#0d6c6a", color: "#fff" }}
                    key="dest"
                  >
                    POD
                  </StyledTableHeadCell>,
                  <StyledTableHeadCell
                    sx={{ bgcolor: "#0d6c6a", color: "#fff" }}
                    key="sender"
                  >
                    Sender
                  </StyledTableHeadCell>,
                  <StyledTableHeadCell
                    sx={{ bgcolor: "#0d6c6a", color: "#fff" }}
                    key="total_items"
                  >
                    Total Items & Weight
                  </StyledTableHeadCell>,
                  <StyledTableHeadCell
                    sx={{ bgcolor: "#0d6c6a", color: "#fff" }}
                    key="status"
                  >
                    Status
                  </StyledTableHeadCell>,
                  <StyledTableHeadCell
                    sx={{ bgcolor: "#0d6c6a", color: "#fff" }}
                    key="actions"
                  >
                    Actions
                  </StyledTableHeadCell>,
                ]}
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => {
                const isItemSelected = isSelected(order.id);
                const status =
                  order.overall_status || order.status || "Created";
                const colors = getStatusColors(status);
                const productsSummary = order.receivers.flatMap((receiver) =>
                  (receiver.shippingdetails || []).map((detail) => {
                    return {
                      category: detail.category || "Unknown",
                      subcategory: detail.subcategory || "",
                      type: detail.type || "Package",
                      weight: parseFloat(detail.weight || 0),
                      total_number: parseInt(detail.totalNumber || 0),
                      itemRef: detail.itemRef || "",
                      shippingDetailStatus: detail.status || "",
                      isDelayed: !!detail.isDelayed,
                      eta: detail.trackingEta || receiver.eta || null,
                    };
                  }),
                );
                const totalItems = productsSummary.reduce(
                  (sum, p) => sum + p.total_number,
                  0,
                );
                const totalWeight = productsSummary.reduce(
                  (sum, p) => sum + p.weight,
                  0,
                );
                const delayedCount = productsSummary.filter(
                  (p) => p.isDelayed,
                ).length;
                const categoryList = [
                  ...new Set(productsSummary.map((p) => p.category)),
                ].join(", ");
                const containerNos = new Set(
                  order.receivers.flatMap((r) =>
                    (r.shippingdetails || []).flatMap((d) =>
                      (d.containerDetails || [])
                        .map((cd) => cd.container?.container_number)
                        .filter(Boolean),
                    ),
                  ),
                );
                const containerCount = containerNos.size;
                const {
                  label: leastStatusLabel,
                  count: leastStatusRemaining,
                  eta: leastStatusEta,
                } = getLeastStatus(productsSummary, statuses);

                return (
                  <StyledTableRow
                    key={order.id}
                    onClick={() => handleClick(order.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    selected={isItemSelected}
                    sx={{ cursor: "pointer" }}
                  >
                    <StyledTableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={(event) => {
                          handleClick(order.id);
                          event.stopPropagation();
                        }}
                        inputProps={{
                          "aria-labelledby": `enhanced-table-checkbox-${order.id}`,
                        }}
                      />
                    </StyledTableCell>

                    <StyledTableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </StyledTableCell>
                    <StyledTableCell>
                      {order.tracking_id ? (
                        <Tooltip title="Click to copy">
                          <Box
                            component="span"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyContainer(order.tracking_id);
                            }}
                            sx={{
                              cursor: "pointer",
                              fontWeight: 600,
                              "&:hover": {
                                color: "#0d6c6a",
                                textDecoration: "underline",
                              },
                            }}
                          >
                            {order.tracking_id}
                          </Box>
                        </Tooltip>
                      ) : (
                        "-"
                      )}
                    </StyledTableCell>
                    <StyledTableCell>
                      {order?.rgl_booking_number ? (
                        <Tooltip title="Click to copy">
                          <Box
                            component="span"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyContainer(order.rgl_booking_number);
                            }}
                            sx={{
                              cursor: "pointer",
                              fontWeight: 600,
                              "&:hover": {
                                color: "#0d6c6a",
                                textDecoration: "underline",
                              },
                            }}
                          >
                            {order.rgl_booking_number}
                          </Box>
                        </Tooltip>
                      ) : (
                        "-"
                      )}
                    </StyledTableCell>
                    <TableCell colSpan={1.5}>
                      <StyledTooltip
                        title={<CombinedTooltip order={order} />}
                        arrow
                        placement="bottom-start"
                        PopperProps={{
                          sx: {
                            "& .MuiTooltip-tooltip": {
                              border: "1px solid #e0e0e0",
                              background: "transparent",
                              width: 600,
                            },
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 150, cursor: "help" }}
                        >
                          {order.receivers.length > 0 ? (
                            <>
                              {order.receivers.length > 1 && (
                                <sup
                                  style={{
                                    padding: 4,
                                    borderRadius: 50,
                                    float: "left",
                                    background: "#00695c",
                                    color: "#fff",
                                  }}
                                >
                                  ({order.receivers.length})
                                </sup>
                              )}
                              <span style={{ padding: 0 }}>
                                {order.receivers.map(
                                  (r) => r.receiverName || "",
                                )}
                              </span>
                            </>
                          ) : (
                            "-"
                          )}
                        </Typography>
                      </StyledTooltip>
                    </TableCell>
                    <StyledTableCell>
                      {getPlaceName(order.place_of_delivery)}
                    </StyledTableCell>
                    <StyledTableCell colSpan={1.5}>
                      {order.sender_name?.substring(0, 20)}
                    </StyledTableCell>

                    <StyledTableCell
                      sx={{ flexWrap: "wrap", display: "list-item" }}
                    >
                      <Typography
                        variant="text.seconday"
                        sx={{
                          paddingLeft: 0,
                          fontWeight: "bold",
                          color: "#000",
                        }}
                      >
                        {totalItems.toFixed()} Packages
                      </Typography>
                      <Typography
                        variant="text.seconday"
                        sx={{
                          marginLeft: 4,
                          fontWeight: "bold",
                          color: "#555",
                        }}
                      >
                        {totalWeight.toFixed()} kg
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell sx={{ fontWeight: "bold" }}>
                      <StatusChip
                        size="large"
                        height={24}
                        status={leastStatusLabel}
                        eta={fmtEtaDMY(leastStatusEta)}
                      />
                      {leastStatusRemaining - 1 > 0 && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ ml: 0.5, fontWeight: "bold" }}
                        >
                          (+{leastStatusRemaining - 1}){" "}
                          {containerCount > 1 && (
                            <Chip
                              size="small"
                              label={`${containerCount} containers`}
                              sx={{
                                ml: 1,
                                height: 20,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                bgcolor: "#e8f5f4",
                                color: "#0a5250",
                              }}
                            />
                          )}
                        </Typography>
                      )}
                      {delayedCount > 0 && (
                        <Chip
                          label={`Delayed${delayedCount > 1 ? ` (${delayedCount})` : ""}`}
                          size="small"
                          sx={{
                            ml: 1,
                            height: 24,
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            bgcolor: "#ffebee",
                            color: "#c62828",
                          }}
                        />
                      )}
                    </StyledTableCell>
                    <StyledTableCell>
                      <IconButton
                        size="small"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenActionMenu(e, order);
                        }}
                        title="Actions"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 75, 100, 125]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
          sx={{
            borderTop: "1px solid rgba(224, 224, 224, 1)",
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                color: "#f58220",
                fontWeight: "medium",
                fontSize: "0.875rem",
              },
            "& .MuiTablePagination-select, & .MuiTablePagination-input": {
              fontSize: "0.875rem",
              borderRadius: 1,
              "&:focus": { borderColor: "#0d6c6a" },
            },
            "& .MuiTablePagination-actions button": {
              color: "#0d6c6a",
              "& svg": { fontSize: "1.125rem" },
              "&:hover": { backgroundColor: "rgba(13, 108, 106, 0.08)" },
              "&:focus": { outline: "2px solid #0d6c6a" },
            },
          }}
        />
        <OrderModalView
          openModal={openModal}
          handleCloseModal={handleCloseModal}
          selectedOrder={selectedOrder}
          modalLoading={modalLoading}
          modalError={modalError}
          places={filterPlaces}
        />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        <AssignModal
          openAssignModal={openAssignModal}
          setOpenAssignModal={setOpenAssignModal}
          selectedOrders={selectedOrders}
          orders={orders}
          containers={containers}
          selectedContainers={selectedContainers}
          setSelectedContainers={setSelectedContainers}
          loadingContainers={loadingContainers}
          fetchContainers={fetchContainers}
          onUpdateAssignedQty={onUpdateAssignedQty}
          onRemoveContainers={onRemoveContainers}
          handleAssign={handleAssign}
          handleReceiverAction={handleReceiverAction}
          onUpdateReceiver={handleUpdateReceiver}
          fetchOrders={fetchOrders}
          places={places}
        />
        <CollectionsModal
          open={openCollectionsModal}
          onClose={() => setOpenCollectionsModal(false)}
          order={collectionsOrder}
          getPlaceName={getPlaceName}
          onSave={async () => {
            refreshOrdersSilently();
            try {
              const { data } = await api.get(
                `/api/orders/${collectionsOrder.id}`,
              );
              setCollectionsOrder(data);
            } catch (err) {
              console.error("Failed to refresh collections order:", err);
            }
          }}
        />
        <OrderConfirmationEmailModal
          open={openOrderConfirmEmail}
          onClose={() => setOpenOrderConfirmEmail(false)}
          companies={companies}
          getPlaceName={getPlaceName}
        />
        <Dialog
          open={openDirectAssign}
          onClose={handleCloseDirectAssign}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Select Containers for All Selected Orders ({numSelected})
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Choose one or more containers to assign to all shipping details of
              the selected orders (full quantity).
            </Typography>
            {loadingContainers ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Autocomplete
                value={directSelectedContainers}
                onChange={(event, newValue) =>
                  setDirectSelectedContainers(newValue)
                }
                options={containers}
                getOptionLabel={(option) => option?.container_number || ""}
                isOptionEqualToValue={(option, value) =>
                  option.cid === value?.cid
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.cid}>
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: 1,
                        py: 0.5,
                      }}
                    >
                      <Box>
                        <Typography fontWeight={600}>
                          {option.container_number}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {option.container_size} {option.container_type}
                        </Typography>
                      </Box>

                      <Chip
                        label={option.owner_type || "N/A"}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Container"
                    placeholder="Search container..."
                    fullWidth
                  />
                )}
                sx={{ mt: 1 }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDirectAssign}>Cancel</Button>
            <Button
              onClick={handleDirectAssign}
              variant="contained"
              disabled={!directSelectedContainers || loadingContainers}
              startIcon={<AssignmentIcon />}
            >
              Assign Container
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={openStatusDialog}
          onClose={handleCloseStatusDialog}
          maxWidth="sm"
          fullWidth
          fullScreen={fullScreen}
          PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
        >
          <DialogTitle
            sx={{
              bgcolor: "#0d6c6a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 1.5,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
                Update Status
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, mt: 1 }}>
                Order: {selectedOrderForUpdate?.rgl_booking_number || "-"}
              </Typography>
            </Box>
            <IconButton
              onClick={handleCloseStatusDialog}
              size="small"
              sx={{ color: "#fff" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: "20px !important", px: { xs: 2, sm: 3 } }}>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              Notifications will be sent based on configured rules.
            </Alert>
            {selectedItemDelivered && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                This item is already delivered and cannot be updated.
              </Alert>
            )}

            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Receiver</InputLabel>
                <Select
                  value={selectedReceiverForUpdate?.id || ""}
                  label="Receiver"
                  onChange={handleReceiverChange}
                >
                  {selectedOrderForUpdate?.receivers?.map((rec) => (
                    <MenuItem key={rec.id} value={rec.id}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ width: "100%", gap: 1 }}
                      >
                        <Typography variant="body2" noWrap>
                          {rec.receiverName}
                        </Typography>
                        <StatusChip
                          status={rec.status}
                          size="small"
                          height={18}
                        />
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Item</InputLabel>
                <Select
                  value={selectedReceiverForUpdateDetails?.itemRef || ""}
                  label="Item"
                  onChange={handleShippingChange}
                  disabled={!selectedReceiverForUpdate}
                  renderValue={(val) => {
                    const it = selectedReceiverForUpdate?.shippingdetails?.find(
                      (r) => r.itemRef === val,
                    );
                    return it
                      ? `${it.category || "-"} — ${it.subcategory || "-"}`
                      : val;
                  }}
                >
                  {selectedReceiverForUpdate?.shippingdetails?.map((rec) => (
                    <MenuItem
                      key={rec.itemRef}
                      value={rec.itemRef}
                      disabled={isItemDelivered(rec)}
                    >
                      <Tooltip
                        title={`Item Ref: ${rec.itemRef}`}
                        placement="right"
                        arrow
                      >
                        <Box
                          sx={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {rec.category || "-"} — {rec.subcategory || "-"}
                          </Typography>
                          {isItemDelivered(rec) && (
                            <Chip
                              label="Delivered"
                              size="small"
                              sx={{ height: 18, fontSize: "0.65rem" }}
                            />
                          )}
                        </Box>
                      </Tooltip>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {(selectedReceiverForUpdateDetails?.containerDetails?.length ||
                0) > 1 && (
                <FormControl fullWidth size="small">
                  <InputLabel>Container</InputLabel>
                  <Select
                    value={selectedCid}
                    label="Container"
                    onChange={handleContainerChange}
                  >
                    {selectedReceiverForUpdateDetails.containerDetails.map(
                      (cd) => (
                        <MenuItem
                          key={cd.container.cid}
                          value={cd.container.cid}
                          disabled={isDelivered(cd.item_status)}
                        >
                          {cd.container.container_number} ({cd.assign_total_box}{" "}
                          boxes)
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </FormControl>
              )}

              <Divider />

              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={selectedStatus}
                      label="Status"
                      onChange={handleStatusChange}
                    >
                      {statuses.map((status) => (
                        <MenuItem key={status.id} value={status.order_status}>
                          {status.order_status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                  <TextField
                    label="ETA"
                    type="date"
                    size="small"
                    fullWidth
                    value={selectedEta}
                    onChange={(e) => setSelectedEta(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={!selectedReceiverForUpdateDetails}
                    error={etaInvalid}
                    helperText={
                      etaInvalid
                        ? `Pick a date between ${etaRange.min} and ${etaRange.max}`
                        : ""
                    }
                    inputProps={etaRange}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              px: { xs: 2, sm: 3 },
              py: 2,
              gap: 1,
              flexWrap: "wrap",
              justifyContent: { xs: "stretch", sm: "flex-end" },
              "& > :not(style)": { m: 0 },
              "& .MuiButton-root": {
                flex: { xs: "1 1 45%", sm: "0 0 auto" },
                borderRadius: 2,
                textTransform: "none",
              },
            }}
          >
            <Button onClick={handleCloseStatusDialog} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleUpdateEta}
              disabled={
                isLoading ||
                etaSaving ||
                !selectedReceiverForUpdateDetails ||
                !selectedEta
              }
              variant="outlined"
              sx={{ borderColor: "#f58220", color: "#f58220" }}
            >
              {etaSaving ? "Updating..." : "Update ETA"}
            </Button>
            <Button
              onClick={handleNotify}
              disabled={isLoading || needsCid}
              variant="outlined"
              sx={{ borderColor: "#0d6c6a", color: "#0d6c6a" }}
            >
              Notify
            </Button>
            <Button
              onClick={handleConfirmStatusUpdate}
              disabled={isLoading || needsCid}
              variant="contained"
              sx={{ bgcolor: "#0d6c6a", "&:hover": { bgcolor: "#0a5250" } }}
            >
              Update Status
            </Button>
          </DialogActions>
        </Dialog>
        <Menu
          open={!!menuPosition}
          onClose={handleCloseActionMenu}
          anchorReference="anchorPosition"
          anchorPosition={menuPosition}
        >
          <MenuItem
            onClick={() => {
              handleStatusUpdate(actionMenuOrder);
              handleCloseActionMenu();
            }}
          >
            <UpdateIcon fontSize="small" sx={{ mr: 1.5 }} />
            Update Status
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleDocuments(actionMenuOrder.id);
              handleCloseActionMenu();
            }}
          >
            <DescriptionIcon fontSize="small" sx={{ mr: 1.5 }} />
            Documents
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleView(actionMenuOrder.id);
              handleCloseActionMenu();
            }}
          >
            <VisibilityIcon fontSize="small" sx={{ mr: 1.5 }} />
            View Details
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleEdit(actionMenuOrder.id);
              handleCloseActionMenu();
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1.5 }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={async () => {
              const orderToOpen = actionMenuOrder;
              handleCloseActionMenu();
              try {
                const { data } = await api.get(`/api/orders/${orderToOpen.id}`);
                setCollectionsOrder(data);
                setOpenCollectionsModal(true);
              } catch (err) {
                setSnackbar({
                  open: true,
                  message: "Failed to load order for collections",
                  severity: "error",
                });
              }
            }}
          >
            <CargoIcon fontSize="small" sx={{ mr: 1.5 }} />
            Add Collections
          </MenuItem>
        </Menu>
      </Paper>
    </>
  );
};
export default OrdersList;
