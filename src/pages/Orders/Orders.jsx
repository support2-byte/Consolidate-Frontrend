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
} from "@mui/material";
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
import { Autocomplete } from "@mui/material";
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
import OrderModalView from "./OrderModalView";
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

const OrdersList = () => {
  const navigate = useNavigate();
  const { places, statuses, companies } = useContext(AppContext);
  const { isLoading, setIsLoading } = useLoading();
  const [orders, setOrders] = useState([]);
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
  const [filterPlaces, setFilterPlaces] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
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

  const [openCollectionsModal, setOpenCollectionsModal] = useState(false);
  const [collectionsOrder, setCollectionsOrder] = useState(null);

  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuOrder, setActionMenuOrder] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  const [docTab, setDocTab] = useState(0);
  const [activeDocKey, setActiveDocKey] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [activeOrderData, setActiveOrderData] = useState(null);
  const printFrameRef = useRef(null);

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
    setSelectedOrderForUpdate(orderId);
    if (orderId && orderId.length) {
      const firstRec = orderId[0];

      setSelectedReceiverForUpdate(firstRec);
      setSelectedStatus(firstRec.status || "Received for Shipment");
    }

    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedOrderForUpdate(null);
    setSelectedReceiverForUpdate(null);
    setSelectedStatus("");
  };
  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };
  const handleReceiverChange = (event) => {
    const recId = event.target.value;
    const rec = selectedOrderForUpdate?.receivers?.find((r) => r.id === recId);
    setSelectedReceiverForUpdate(rec);
    setSelectedStatus(rec?.status || "Received for Shipment");
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

  const handleShippingChange = (event) => {
    const recId = event.target.value;
    const rec = selectedReceiverForUpdate?.shippingdetails?.find(
      (r) => r.itemRef === recId,
    );

    setSelectedReceiverForUpdateDetails(rec);
  };

  const handleConfirmStatusUpdate = async () => {
    setIsLoading(true);
    if (
      !selectedOrderForUpdate ||
      !selectedReceiverForUpdate ||
      !selectedStatus
    )
      return;

    try {
      await api.put(
        `/api/orders/${selectedOrderForUpdate.id}/receivers/${selectedReceiverForUpdate.id}/items/${selectedReceiverForUpdateDetails.itemRef}/status`,
        {
          status: selectedStatus,
          itemRefs: [selectedReceiverForUpdateDetails.itemRef],
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

  const handleNotify = async () => {
    setIsLoading(true);
    if (
      !selectedOrderForUpdate ||
      !selectedReceiverForUpdate ||
      !selectedStatus
    )
      return;

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
      const ordersWithAutoPopulate = await Promise.all(
        ordersData.map(async (order) => {
          const ownerPrefix =
            order.sender_type === "sender" ? "sender" : "receiver";
          const ownerNameKey = `${ownerPrefix}_name`;
          const selectedOwnerKey = "selected_sender_owner";

          if (order[selectedOwnerKey] && !order[ownerNameKey]?.trim()) {
            try {
              const customerRes = await api.get(
                `/api/customers/${order[selectedOwnerKey]}`,
              );
              if (customerRes?.data) {
                const customer = customerRes.data;
                const updatedOrder = { ...order };
                updatedOrder[ownerNameKey] =
                  customer.contact_name ||
                  customer.contact_persons?.[0]?.name ||
                  "";
                updatedOrder[`${ownerPrefix}_contact`] =
                  customer.primary_phone ||
                  customer.contact_persons?.[0]?.phone ||
                  "";
                updatedOrder[`${ownerPrefix}_address`] =
                  customer.zoho_notes || customer.billing_address || "";
                updatedOrder[`${ownerPrefix}_email`] =
                  customer.email || customer.contact_persons?.[0]?.email || "";
                updatedOrder[`${ownerPrefix}_ref`] =
                  customer.zoho_id || customer.ref || "";
                updatedOrder[`${ownerPrefix}_remarks`] =
                  customer.zoho_notes || customer.system_notes || "";
                return updatedOrder;
              }
            } catch (autoErr) {
              console.error(
                `Auto-populate owner failed for order ${order.id}:`,
                autoErr,
              );
            }
          }
          return order;
        }),
      );
      setOrders(ordersWithAutoPopulate);
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
  useEffect(() => {
    setFilterPlaces(
      places.map((p) => ({ value: p.id.toString(), label: p.name })),
    );
    fetchOrders();
  }, [page, rowsPerPage, filters.status]);

  const handleClearSearch = async () => {
    setFilters({
      status: "",
      search: "",
    });

    setPage(0);
    window.location.reload();
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
      setActiveOrderData(normalizedData);
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
  const fetchContainers = async () => {
    if (loadingContainers) return;
    setLoadingContainers(true);
    setAssignmentError(null);
    try {
      const response = await api.get("/api/containers");
      const availableContainers = response.data.data || [];
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
      let allOrders = [];
      let currentPage = 1;
      const pageSize = 100;
      let hasMore = true;
      const exportFilters = { ...filters };
      while (hasMore) {
        const params = {
          page: currentPage,
          limit: pageSize,
          includeContainer: true,
          ...exportFilters,
        };
        const response = await api.get(`/api/orders`, { params });
        const pageOrders = response.data.data || [];
        allOrders = [...allOrders, ...pageOrders];
        if (pageOrders.length < pageSize) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }
      if (allOrders.length === 0) {
        setSnackbar({
          open: true,
          message: "No orders found to export",
          severity: "warning",
        });
        return;
      }
      const headers = [
        "Booking Ref",
        "Status",
        "Place of Loading",
        "Final Destination",
        "Sender",
        "Receivers",
        "Containers",
        "Associated Container",
        "Created At",
      ];
      const rows = allOrders.map((order) => [
        order.booking_ref || "",
        order.status || "",
        order?.place_of_loading || "",
        order.final_destination || "",
        order.sender_name || "",
        order.receiver_summary || "",
        order.receiver_containers || "",
        order.container_number || "",
        order.created_by || "",
        new Date(order.created_at).toLocaleDateString(),
      ]);
      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `orders-${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSnackbar({
        open: true,
        message: `Successfully exported ${allOrders.length} orders`,
        severity: "success",
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
    fetchContainers();
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

  const getStatusColors = (status) => {
    const colorMap = {
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
    return colorMap[status] || colorMap.default;
  };

  const getLeastStatus = (productsSummary, statuses) => {
    if (!productsSummary.length) {
      return { label: "Created", count: 0 };
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
      };
    });

    const minRank = Math.min(...ranked.map((r) => r.rank));

    const leastGroup = ranked.filter((r) => r.rank === minRank);

    return {
      label: leastGroup[leastGroup.length - 1].status,
      count: ranked.length,
    };
  };

  const StyledTooltip = styled(Tooltip)(({ theme }) => ({
    [`& .MuiTooltip-tooltip`]: {
      borderRadius: theme.shape.borderRadius,
      fontSize: theme.typography.body2.fontSize,
      width: 600,
    },
    [`& .MuiTooltip-arrow`]: {},
  }));

  const StyledList = styled(List)(({ theme }) => ({
    padding: theme.spacing(1),
    "& .MuiListItem-root": {
      borderRadius: theme.shape.borderRadius,
      margin: theme.spacing(0.25),
      "&:hover": {
        backgroundColor: theme.palette.action.hover,
      },
    },
  }));
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
      const response = await api.get("/api/containers");

      const allContainers = response.data.data || [];

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

  const StatusChip = ({ status, height, size }) => {
    const colors = getStatusColors(status);
    return (
      <Chip
        label={status}
        size={size}
        sx={{
          height: height,
          fontSize: "0.65rem",
          marginLeft: 2,
          backgroundColor: colors.bg,
          color: colors.text,
        }}
      />
    );
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
                                  label={`ETA: ${item.trackingEta ? new Date(item.trackingEta).toLocaleDateString() : "N/A"}`}
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

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    "&:last-child td, &:last-child th": {
      border: 0,
    },
    "&:hover": {
      backgroundColor: theme.palette.action.selected,
    },
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
  const numSelected = selectedOrders.length;
  const rowCount = orders.length;

  const getReceiverName = (orderData) => {
    if (orderData.receivers && orderData.receivers.length > 0) {
      return orderData.receivers[0].receiverName || null;
    }
    return null;
  };
  const getReceiverAddress = (orderData) => {
    if (orderData.receivers && orderData.receivers.length > 0) {
      return orderData.receivers[0].receiverAddress || null;
    }
    return null;
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
              orderRef: detail.itemRef || orderData.booking_ref || "_________",
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
        orderRef: orderData.booking_ref || "_________",
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
                ${containerData.system_number ? `BB System # <span style="color: #000000;">${containerData.system_number}` : ""}</span>
            </div>
            
            <div class="exporter-info">
                <span style="font-weight: bold;">EXPORTER:</span> 
                <span style="color: #000000;">${containerData.sender_name || "_________________________"}</span>
            </div>

            <div class="cnic-info">
                <span class="cnic-label">CNIC</span>
                <span>: <span style="color: #000000;">${containerData.sender_cnic || "_____-_______-_"}</span></span>
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
                    <img
                      style="
                        width:150px;
                        height:auto;
                        filter: grayscale(100%) contrast(100%);
                        mix-blend-mode: multiply;
                      "
                      src="${containerData.sender_signature_url}"
                    />
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

  const PartyShipperIndemnityForEachOrderFormat = (orderData) => {
    const safeOrder = orderData || {};

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
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">BB System, 3<sup style="font-size: 9.5px;">rd</sup> Party Shipper</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">Address,</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Karachi - Pakistan.</div>
        </div>

        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #000000;">${getSafeValue(safeOrder.booking_ref)}</span>
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
            2. We hereby agree that Cargo Aviation Systems (Pvt) Ltd, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
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
            : ": (Digitally Signed Login Credentials & OTP Verified)"
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

  const DubaiLetterOfIndemnityForCustoms = (orderData) => {
    const safeOrder = orderData || {};

    const getSafeValue = (value, defaultValue = "_________________") => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : defaultValue;
    };

    const senderName = safeOrder.sender_name || "";
    const trade_license = safeOrder.sender_trade_license || "________";
    const senderPassport = safeOrder.sender_kyc_approved
      ? safeOrder.sender_passport_number || "________"
      : "Not Approved";
    const senderEmiratesID = safeOrder.sender_kyc_approved
      ? safeOrder.sender_emirates_id || "________"
      : "Not Approved";
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
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #000000;">${getSafeValue(safeOrder.booking_ref)}</span>
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
            2. We hereby agree that Royal Gulf Shipping & Logistics LLC, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
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
                <td style="padding: 2px 0; vertical-align: top;">CNIC ID #</td>
                <td style="padding: 2px 0; vertical-align: top;">: <span style="color: #000000;">${getSafeValue(senderEmiratesID)}</span></td>
            </tr>
            <tr>
                <td style="padding: 2px 0;">Signature</td>
                <td style="padding: 2px 0; vertical-align: top;">
                    ${
                      safeOrder.sender_kyc_approved &&
                      safeOrder.sender_signature_url
                        ? `<img src="${safeOrder.sender_signature_url}" style="height:50px;filter: grayscale(100%) contrast(100%);mix-blend-mode: multiply;" />`
                        : ": (Digitally Signed Login Credentials & OTP Verified)"
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

  const KarachiGovtCustomsStampPaperUndertakingFormat = (orderData) => {
    const safeOrder = orderData || {};

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
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #000000;">${getSafeValue(safeOrder.booking_ref)}</span>
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
            2. We hereby agree that "<span style="color: #000000;">${getSafeValue(senderCompany)}</span> & their agents" Cargo Aviation Systems (Pvt) Ltd, are only a Warehousing & Distribution agents on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
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
                        : ": (Digitally Signed Login Credentials & OTP Verified)"
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

  const KarachiUndertakingForCustomsEachSenderShouldGive = (orderData) => {
    const safeOrder = orderData || {};

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
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> EXPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #000000;">${getSafeValue(safeOrder.booking_ref)}</span>
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
            2. We hereby agree that "<span style="color: #000000;">XYZ Exporter</span> & their agents" Cargo Aviation Systems (Pvt) Ltd, are only a Warehousing & Distribution agents on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
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
                        : ": (Digitally Signed Login Credentials & OTP Verified)"
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

  const ReceiverUndertakingForDubaiCustoms = (orderData) => {
    const safeOrder = orderData || {};

    const getSafeValue = (value, defaultValue = "_________________") => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : defaultValue;
    };

    const senderName = safeOrder.sender_name || "";
    const trade_license = safeOrder.sender_trade_license || "________";
    const senderPassport = safeOrder.sender_kyc_approved
      ? safeOrder.sender_passport_number || "________"
      : "Not Approved";
    const senderEmiratesID = safeOrder.sender_kyc_approved
      ? safeOrder.sender_emirates_id || "________"
      : "Not Approved";
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
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">BB System, 3rd Party Consignee</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Address, </div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Dubai UAE.</div>
        </div>

        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;"> IMPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #000000;">${getSafeValue(safeOrder.booking_ref)}</span>
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
            2. We hereby agree that Royal Gulf Shipping & Logistics LLC, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
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
                        : ": (Digitally Signed Login Credentials & OTP Verified)"
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

  const ReceiverUndertakingDubaiANF = (orderData) => {
    const safeOrder = orderData || {};

    const getSafeValue = (value, defaultValue = "_________________") => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : defaultValue;
    };

    const senderName = safeOrder.sender_name || "";
    const trade_license = safeOrder.sender_trade_license || "________";
    const senderPassport = safeOrder.sender_kyc_approved
      ? safeOrder.sender_passport_number || "________"
      : "Not Approved";
    const senderEmiratesID = safeOrder.sender_kyc_approved
      ? safeOrder.sender_emirates_id || "________"
      : "Not Approved";
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
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">IMPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #000000;">${getSafeValue(safeOrder.booking_ref)}</span>
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
            2. We hereby agree that Royal Gulf Shipping & Logistics LLC, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
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
                        : ": (Digitally Signed Login Credentials & OTP Verified)"
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

  const SenderUndertakingForThirdPartyShipper = (orderData) => {
    const safeOrder = orderData || {};

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
            <div style="font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 5px;">BB System, 3rd Party Shipper</div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Address, </div>
            <div style="font-family: Arial; font-size: 15.0px; color: #000000;">Karachi - Pakistan.</div>
        </div>

        <div style="font-weight: bold; font-family: Arial; font-size: 15.0px; color: #000000; margin-bottom: 10px; text-align: center;">
            Letter of Indemnity, Agreement
        </div>

        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
                <span style="font-family: Arial; font-size: 15.0px; color: #000000; font-weight: bold;">SUBJECT:</span>
                <span style="font-family: Arial; font-size: 15.0px; color: #000000;">EXPORT OF <span style="color: #000000;">${totalPackages} Pkgs</span> , Vide Order No : BB System # <span style="color: #000000;">${getSafeValue(safeOrder.booking_ref)}</span>
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
            2. We hereby agree that Cargo Aviation Systems (Pvt) Ltd, are only a Warehousing & Distribution agent on behalf our ourselves to arrange the transport and clearance of the subject shipment and holds no responsibility in event of any prohibited goods, drugs or narcotics found in the consignment at any point of inspection/examination by ports/customs authorities while in process of shipping and clearance.
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
                        : ": (Digitally Signed Login Credentials & OTP Verified)"
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

  const WHARFAGEConsignmentsNote = (orderData) => {
    const safeOrder = orderData || {};

    const c = safeOrder.consignment || {};

    const getSafeValue = (value, defaultValue = "_________________") => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : defaultValue;
    };

    const firstReceiver =
      safeOrder.receivers && safeOrder.receivers.length > 0
        ? safeOrder.receivers[0]
        : {};

    const shippingDetails = firstReceiver.shippingdetails || [];

    const getContainerDetails = () => {
      const containerList = [];
      if (firstReceiver.containers && firstReceiver.containers.length > 0) {
        firstReceiver.containers.forEach((container) => {
          let totalQty = 0;
          let totalWeight = 0;

          shippingDetails.forEach((detail) => {
            if (detail.containerDetails) {
              detail.containerDetails.forEach((cd) => {
                const containerNum =
                  cd.container?.container_number || cd.container_number;
                if (containerNum === container) {
                  totalQty += parseInt(cd.total_number) || 0;
                  totalWeight += parseFloat(cd.assign_weight) || 0;
                }
              });
            }
          });

          containerList.push({
            number: container,
            quantity: totalQty,
            weight: totalWeight,
          });
        });
      }
      return containerList;
    };

    const containerDetails = getContainerDetails();

    const totalPackages = containerDetails.reduce(
      (sum, c) => sum + c.quantity,
      0,
    );
    const totalWeight = containerDetails.reduce((sum, c) => sum + c.weight, 0);

    const getTruckNumbers = () => {
      const trucks = [];
      if (firstReceiver.drop_off_details) {
        firstReceiver.drop_off_details.forEach((drop) => {
          if (drop.plate_no && !trucks.includes(drop.plate_no)) {
            trucks.push(drop.plate_no);
          }
        });
      }
      return trucks.join(", ");
    };

    const getCommodities = () => {
      const commodities = [];
      shippingDetails.forEach((detail) => {
        if (detail.category && !commodities.includes(detail.category)) {
          commodities.push(detail.category);
        }
      });
      return commodities.join(", ");
    };

    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

    const consignmentNumber = `CNS-${safeOrder.id || "XXXX"}-${new Date().getTime()}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wharfage Consignment Note</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 13px;
            color: #000;
            line-height: 1.4;
            padding: 20px;
        }

        .container {
            max-width: 850px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .date-row {
            text-align: right;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .title {
            font-weight: bold;
            text-decoration: underline;
            font-size: 16px;
        }

        .top-boxes {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
        }

        .box {
            flex: 1;
            border: 1px solid #000;
        }

        .box-label {
            padding: 2px 5px;
            border-bottom: 1px solid #000;
            min-height: 35px;
        }

        .box-content {
            height: auto;
            min-height: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5px;
        }

        .highlighted {
            font-weight: bold;
            color: #000000;
        }

        .container-list {
            width: 100%;
        }
        
        .container-row {
            display: flex;
            border-bottom: 1px dashed #ccc;
            padding: 3px 0;
        }
        
        .container-row:last-child {
            border-bottom: none;
        }
        
        .container-number {
            flex: 2;
            text-align: left;
            padding-left: 5px;
        }
        
        .container-qty {
            flex: 1;
            text-align: center;
            border-left: 1px dashed #ccc;
        }
        
        .container-weight {
            flex: 1;
            text-align: center;
            border-left: 1px dashed #ccc;
        }

        .details-grid {
            display: grid;
            grid-template-columns: 1.2fr 1.2fr 1fr;
            gap: 15px 10px;
            margin-bottom: 40px;
        }

        .underline {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 80px;
        }

        .summary-bar {
            display: flex;
            align-items: center;
            gap: 30px;
            margin-bottom: 5px;
        }

        .summary-box {
            border: 1px solid #000;
            padding: 10px 40px;
            font-weight: bold;
            min-width: 200px;
        }

        .summary-text {
            font-weight: bold;
        }

        .certification-box {
            border: 1px solid #000;
            padding: 15px;
            margin-bottom: 100px;
            width: 90%;
        }

        .footer {
            display: flex;
            justify-content: space-between;
        }

        .sign-block {
            width: 300px;
        }

        .sign-line {
            border-top: 1px solid #000;
            margin-bottom: 5px;
        }

        .text-right {
            text-align: left;
        }
        
        .container-info {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .small-text {
            font-size: 11px;
            color: #666;
        }
        
        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="date-row">DATED: ${currentDate}</div>
            <div class="title">CONSIGNMENT NOTE: ${consignmentNumber}</div>
        </div>

         <div class="top-boxes">
            <div class="box">
                <div class="box-label">Custom CRN or Customs Machine number</div>
                <div class="box-content">${getSafeValue(c.customs_crn)}</div>
            </div>
            <div class="box">
                <div class="box-label">
                    <div class="container-info">
                        <span>Container No:</span>
                    </div>
                </div>
                <div class="box-content" style="padding: 0;">
                    ${
                      firstReceiver.containers &&
                      firstReceiver.containers.length > 0
                        ? firstReceiver.containers
                            .map(
                              (container) => `
                            <div style="width: 100%; text-align: center; box-sizing: border-box; padding: 8px; border-bottom: ${firstReceiver.containers.indexOf(container) < firstReceiver.containers.length - 1 ? "1px solid #ccc" : "none"};">
                                ${container}
                            </div>
                        `,
                            )
                            .join("")
                        : '<div style="padding: 8px;">N/A</div>'
                    }
                </div>
            </div>
            <div class="box">
                <div class="box-label">Seal No</div>
                <div class="box-content">${getSafeValue(c.seal_no || safeOrder.seal_no)}</div>
            </div>
        </div>

        <div class="details-grid">
            <div><strong>VESSEL:</strong> ${getSafeValue(c.vessel)}</div>
            <div><strong>Voyage:</strong> ${getSafeValue(c.voyage)}</div>
            <div><strong>SHIPPING LINE:</strong> ${getSafeValue(c.shipping_line_name)}</div>

            <div><strong>Dest:</strong> ${getPlaceName(getSafeValue(safeOrder.final_destination))}</div>
            <div><strong>Shipper:</strong> ${getSafeValue(firstReceiver.receiverName)}</div>
            <div><strong>BOOKING NO:</strong> ${getSafeValue(safeOrder.rgl_booking_number)}</div>

            <div><strong>Comm:</strong> ${getCommodities() || "N/A"}</div>
            <div><strong>Origin:</strong> ${getPlaceName(getSafeValue(safeOrder.place_of_loading))}</div>
            <div>
                <strong>GROSS Wt:</strong> <span class="underline">${totalWeight} KGS</span><br>
                <strong>NET Wt:</strong> <span class="underline">${totalWeight} KGS</span>
            </div>

            <div><strong>Status:</strong> ${getSafeValue(safeOrder.status)}</div>
            <div><strong class="underline">TRUCK NO</strong> ${getTruckNumbers() || getSafeValue(safeOrder.truck_number)}</div>
            <div><strong>TOTAL CTNS:</strong> <span class="underline">${totalPackages.toLocaleString()}</span></div>
        </div>

        ${containerDetails
          .map(
            (container) => `
        <div class="summary-bar">
            <div class="summary-box">${container.number}</div>
            <div class="summary-text">
                PKGS: ${container.quantity.toLocaleString()} &nbsp; GROSS WT: ${container.weight} KGS &nbsp; NET WT: ${container.weight} KGS
            </div>
        </div>
        `,
          )
          .join("")}

        <div class="certification-box">
            I / We hereby certify that goods mentioned in the accompanied packing list have been placed inside the
            container and the container has been sealed by me / us the particulars are true.
        </div>

        <div class="footer">
            <div class="sign-block">
                <div class="sign-line"></div>
                PICT/KICT/QICT Representative<br>Gate Clerk / Dmg Inspector
            </div>
            <div class="sign-block text-right">
                <div class="sign-line"></div>
                Name and Signature of Agent<br>Shipper / Consolidator with stamp
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  const OrderAcknowledgementPrintableVersion = (orderData, company) => {
    const primary = company?.primary_color || "#1a4731";
    const formatDate = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return (
          date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }) +
          " " +
          date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch (e) {
        return dateString || "";
      }
    };

    const currentDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const currentTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const senderName = orderData.sender_name || "N/A";
    const senderContact = orderData.sender_contact || "N/A";
    const senderEmail = orderData.sender_email || "N/A";
    const senderRef = orderData.sender_ref || "N/A";

    const receiver =
      orderData.receivers && orderData.receivers[0]
        ? orderData.receivers[0]
        : {};
    const receiverName = receiver.receiverName || "N/A";
    const receiverContact = receiver.receiverContact || "N/A";
    const receiverAddress = receiver.receiverAddress || "N/A";
    const receiverEmail = receiver.receiverEmail || "N/A";

    const shippingDetails = receiver.shippingdetails || [];

    let totalQty = 0;
    let totalWeight = 0;

    shippingDetails.forEach((item) => {
      totalQty += parseInt(item.totalNumber || 0);
      totalWeight += parseFloat(item.weight || 0);
    });

    if (shippingDetails.length === 0) {
      totalQty =
        parseInt(receiver.totalnumber || 0) ||
        parseInt(orderData.total_assigned_qty || 0);
    }

    const containers = receiver.containers || [];
    const containerInfo = containers.length > 0 ? containers.join(", ") : "N/A";

    const senderKycApproved = orderData.sender_kyc_approved || false;
    const senderPassport = senderKycApproved
      ? orderData.sender_passport_number || "N/A"
      : "Not Approved";
    const senderEmiratesId = senderKycApproved
      ? orderData.sender_emirates_id || "N/A"
      : "Not Approved";
    const senderSignatureUrl = senderKycApproved
      ? orderData.sender_signature_url || ""
      : "";

    const receiverKycApproved = receiver.kycApproved || false;
    const receiverPassport = receiverKycApproved
      ? receiver.passportNumber || "N/A"
      : "Not Approved";
    const receiverEmiratesId = receiverKycApproved
      ? receiver.emiratesId || "N/A"
      : "Not Approved";
    const receiverSignatureUrl = receiverKycApproved
      ? receiver.signatureUrl || ""
      : "";

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Acknowledgement Printable Version</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                color: #333;
                line-height: 1.3;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
                width: 210mm;
                min-height: 297mm;
            }

            .document-container {
                background: #fff;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #ccc;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                min-height: 257mm;
            }

            .top-banner {
               background-color: ${primary};
                color: white;
                text-align: center;
                padding: 10px;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 2px;
                margin-bottom: 20px;
            }

            .header-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .logo-area {
                display: flex;
                align-items: center;
            }

            .logo-icon {
                width: 80px;
                margin-right: 15px;
            }

            .company-name img {
                width: 250px;
                height: auto;
            }

            .disclaimer-bubble {
                border: 2px solid #ff4d4d;
                border-radius: 50%;
                padding: 15px;
                width: 200px;
                text-align: center;
                color: #ff4d4d;
                font-size: 11px;
                font-weight: bold;
                min-height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .order-title {
                text-align: center;
                font-weight: bold;
                font-size: 18px;
                margin: 10px 0;
                text-transform: uppercase;
            }

            .dated-text {
                font-weight: bold;
                font-size: 13px;
                margin-bottom: 5px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }

            th, td {
                border: 1px solid #777;
                padding: 8px;
                text-align: left;
                font-size: 12px;
                vertical-align: top;
            }

            .table-header {
                background-color: #f9f9f9;
                text-align: center;
                font-style: italic;
                font-weight: bold;
            }

            .small-red-text {
                color: #d35400;
                font-size: 10px;
                margin: 10px 0;
                line-height: 1.2;
            }

            .order-info-bar {
                display: flex;
                justify-content: space-between;
                margin: 15px 0;
                font-size: 13px;
                font-weight: bold;
            }

            .bold-declaration {
                font-size: 12px;
                font-weight: bold;
                font-style: italic;
                margin: 15px 0;
            }

            .terms-title {
                color: #ff4d4d;
                font-size: 14px;
                margin-top: 20px;
            }

            .terms-list {
                font-size: 10px;
                color: #2c3e50;
                padding-left: 0;
                list-style: none;
            }

            .terms-list li {
                margin-bottom: 3px;
            }

            .final-confirmation {
                text-align: center;
                font-weight: bold;
                margin-top: 30px;
                font-size: 14px;
            }

            .order-items-table {
                margin: 20px 0;
            }

            .order-items-table .table-header {
                background-color: #1a4731;
                color: white;
            }

            .total-row {
                background-color: #f2f2f2;
                font-weight: bold;
            }

            .signature-section {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
            }

            .signature-box {
                text-align: center;
                padding-top: 10px;
                width: 45%;
            }

            @media print {
                body {
                    background-color: white;
                    padding: 0;
                }
                
                .document-container {
                    box-shadow: none;
                    border: none;
                    padding: 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="document-container">
            <div class="top-banner">STORAGE & DISTRIBUTION</div>

            <div class="header-section">
                <div class="logo-area">
                    <div class="company-name">
                            <img src="${company?.logo_url || ""}" alt="${company?.company || "Company Logo"}">
                    </div>
                </div>
                <div class="disclaimer-bubble">
                    In case of any Lost or Damage for Non-Insured Cargo. US$ 15 PER PKG claim would be adjusted
                </div>
            </div>

            <div class="order-title">ORDER ACKNOWLEDGEMENT</div>
            <div class="dated-text">Dated: ${currentDate} ${currentTime}</div>

            <table>
                <tr>
                    <td class="table-header" style="width: 50%;">Sender</td>
                    <td class="table-header" style="width: 50%;">Receiver</td>
                </tr>
                <tr>
                    <td>
                        <strong>${senderName}</strong><br><br>
                        Contact Person: ${senderName}<br>
                        Passport No: ${senderPassport}<br>
                        CNIC: ${senderEmiratesId}<br>
                        Tel: ${senderContact}<br>
                        E-Mail: ${senderEmail}
                    </td>
                    <td>
                        <strong>${receiverName}</strong><br><br>
                        Contact Person: ${receiverName}<br>
                        Passport No: ${receiverPassport}<br>
                        CNIC: ${receiverEmiratesId}<br>
                        Tel: ${receiverContact}<br>
                        E-Mail: ${receiverEmail}
                    </td>
                </tr>
            </table>

            <div class="small-red-text">
                This paper serves as a legal responsibility of sender & receiver for the contents of the cargo being shipped
                through the company ${company?.company || ""}. The Sender and Receiver will be responsible for any
                loss/ damage which results in case of any prohibited items attempted to be shipped through this order.
            </div>

            <div class="order-title">ACKNOWLEDGMENT AND ACCEPTANCE OF ORDER</div>

            <div class="order-info-bar">
                <div><u> Order Date:</u> <span>${formatDate(orderData.created_at)}</span></div>
                <div><u> Order Number:</u> <span>${orderData.booking_ref || "N/A"}</span></div>
                <div><u> Customer No:</u> <span>${orderData.rgl_booking_number || "N/A"}</span></div>
            </div>

            <p style="font-size: 12px;">We are in receipt of your Order as detailed below:</p>

            <table class="order-items-table">
                <tr class="table-header">
                    <td>QTY</td>
                    <td>DESCRIPTION</td>
                    <td>Order No</td>
                    <td>Form No</td>
                    <td>Port of Loading</td>
                    <td>Port of Destination</td>
                </tr>
                ${
                  shippingDetails.length > 0
                    ? shippingDetails
                        .map(
                          (item) => `
                <tr>
                    <td style="text-align: center;">${item.totalNumber || 0}</td>
                    <td>${item.category || item.subcategory || "N/A"}</td>
                    <td style="text-align: center;">${orderData.booking_ref || "N/A"}</td>
                    <td>${containerInfo}</td>
                    <td>${getPlaceName(orderData.place_of_loading) || "N/A"}</td>
                    <td>${getPlaceName(orderData.final_destination) || "N/A"}</td>
                </tr>
                `,
                        )
                        .join("")
                    : `
                <tr>
                    <td style="text-align: center;">${totalQty || 0}</td>
                    <td>General Items</td>
                    <td style="text-align: center;">${orderData.booking_ref || "N/A"}</td>
                    <td>${containerInfo}</td>
                    <td>${orderData.place_of_loading || "N/A"}</td>
                    <td>${orderData.final_destination || "N/A"}</td>
                </tr>
                `
                }
                <tr class="total-row">
                    <td style="text-align: center;">${totalQty}</td>
                    <td colspan="5">TOTAL PACKAGES: ${totalQty} | TOTAL WEIGHT: ${totalWeight} kg</td>
                </tr>
            </table>

            <div class="dated-text" style="text-decoration: underline;">Mode: ${orderData.transport_type || "Drop Off"}</div>

            <div class="bold-declaration">
                I, the sender, whose name and address are given on the item, certify that the particulars given in this
                declaration are correct and that this item does not contain any dangerous article or articles prohibited by
                legislation or by <u>postal or customs regulations.</u>
            </div>

            <div class="terms-title">Terms & Conditions</div>
            <ul class="terms-list">
                <li>*All the information provided on order acknowledgement is as per the information provided by the sender.</li>
                <li>*Customer (Sender/Receiver) acknowledges that the company will not be held liable for any loss or damage
                    caused by customs inspections, fair wear & tear & Natural Disaster.</li>
                <li>*All shipments will be inspected by Customs / ANF teams at terminals and there being if any extra cost
                    incurred will be borne by the sender Or receiver.</li>
                <li>*Transit time provided are tentative and could be change with / without prior notice upon vessels and
                    customs clearance.</li>
            </ul>

            <div class="signature-section">
                <div class="signature-box">
                ${
                  senderSignatureUrl
                    ? `<img src="${senderSignatureUrl}" style="border-bottom: 1px solid #333;height:50px;margin-top:5px;filter: grayscale(100%) contrast(100%);mix-blend-mode: multiply;" /><br>`
                    : ""
                }
                    <strong>Sender's Signature</strong><br>
                    
                </div>
                <div class="signature-box">
                ${
                  receiverSignatureUrl
                    ? `<img src="${receiverSignatureUrl}" style="border-bottom: 1px solid #333;height:50px;margin-top:5px;filter: grayscale(100%) contrast(100%);mix-blend-mode: multiply;" /><br>`
                    : ""
                }
                    <strong>Receiver's Signature</strong><br>
                    
                </div>
            </div>

            <div class="final-confirmation">
                We confirm acceptance of said order, with terms as stated above.
            </div>

        </div>
    </body>
    </html>
    `;
  };

  const OrderConfirmation = (orderData, company) => {
    const primary = company?.primary_color || "#e67e22";
    const secondary = company?.secondary_color || "#b8860b";
    const formatDate = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } catch (e) {
        return dateString || "";
      }
    };

    const currentDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const expectedShipDate = new Date();
    expectedShipDate.setDate(expectedShipDate.getDate() + 7);
    const formattedShipDate = expectedShipDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });

    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 17);
    const formattedDeliveryDate = expectedDeliveryDate.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
    );

    const senderName = orderData.sender_name || "";
    const senderContact = orderData.sender_contact || "";
    const senderEmail = orderData.sender_email || "";
    const senderAddress = orderData.sender_address || "";

    const receiver =
      orderData.receivers && orderData.receivers[0]
        ? orderData.receivers[0]
        : {};
    const receiverName = receiver.receiverName || "";
    const receiverContact = receiver.receiverContact || "";
    const receiverAddress = receiver.receiverAddress || "";
    const receiverEmail = receiver.receiverEmail || "";

    const shippingDetails = receiver.shippingdetails || [];

    let totalQty = 0;

    shippingDetails.forEach((item) => {
      totalQty += parseInt(item.totalNumber || 0);
    });

    if (shippingDetails.length === 0) {
      totalQty =
        parseInt(receiver.totalnumber || 0) ||
        parseInt(orderData.total_assigned_qty || 0);
    }

    const containers = receiver.containers || [];
    const containerInfo =
      containers.length > 0 ? containers.join(", ") : "ABC XYZ";

    const getDescription = () => {
      if (shippingDetails.length > 0) {
        return (
          shippingDetails[0].itemName ||
          shippingDetails[0].subcategory ||
          shippingDetails[0].category ||
          ""
        );
      }
      return "";
    };

    const getOrderNo = () => {
      return orderData.booking_ref || "5017";
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                font-size: 12px; 
                color: #333; 
                margin: 0;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container { 
                width: 800px; 
                margin: 0 auto; 
                border: 1px solid #ccc; 
                padding: 10px; 
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            
            .header-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 10px;
            }
            .logo-text { 
                color: ${primary}; 
                font-weight: bold; 
                font-size: 18px; 
            }
            .sub-logo { 
                font-size: 10px; 
                color: #555; 
            }
            .main-title { 
                font-size: 20px; 
                font-weight: bold; 
            }
            
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 0px; 
            }
            th, td { 
                padding: 4px; 
                vertical-align: top; 
            }
            
            .red-text { 
                color: #000000; 
                font-weight: 500;
            }
            .golden-text {
                color: ${secondary};
                font-weight: 500;
            }
            .label-cell { 
                font-weight: bold; 
                background-color: #f9f9f9; 
                width: 15%; 
            }
            
            .section-header { 
                font-weight: bold; 
                text-align: center; 
                background-color: white; 
                padding: 5px; 
                font-size: 16px; 
                margin: 10px 0;
            }
            .disclaimer { 
                font-size: 11px; 
                color: #b8860b; 
                padding: 5px; 
                margin: 10px 0;
            }
            
            .footer-sign { 
                height: 60px; 
            }
            
            .logo-img {
                max-width: 180px;
                max-height: 60px;
            }
            
            @media print {
                body {
                    background-color: white;
                    padding: 0;
                }
                .container {
                    box-shadow: none;
                    border: 1px solid #ccc;
                }
            }
        </style>
    </head>
    <body>

    <div class="container">
        <table class="header-table" style="border:none;">
            <tr style="border:none;display: flex;align-items: center;gap: 125px;">
                <td style="border:none;">
                    ${
                      company?.logo_url
                        ? `<img src="${company.logo_url}" alt="${company?.company || ""} Logo" class="logo-img"><br>`
                        : `<span class="logo-text">${company?.company || ""}</span><br>`
                    }
                </td>
                <td style="border:none; ">
                    <div class="main-title">ORDER CONFIRMATION</div>
                </td>
            </tr>
        </table>

        <table>
            <tr>
                <td class="label-cell">Dated</td>
                <td class="red-text" colspan="2">${currentDate}</td>
            </tr>
            <tr style="background: #eee; font-weight: bold;     border: 1px solid #aaa;">
                <td style="width: 50%;">TO</td>
                <td colspan="2">FROM</td>
            </tr>
            <tr>
                <td class="red-text" style="white-space: pre-line;     border: 1px solid #aaa;">
                    ${senderName}<br>
                    ${senderAddress.replace(/, /g, ",<br>")}<br>
                    Contact Person: ${senderName}<br>
                    Passport No: ${orderData.sender_kyc_approved ? orderData.sender_passport_number || "N/A" : "Not Approved"}<br>
                    CNIC : ${orderData.sender_kyc_approved ? orderData.sender_emirates_id || "N/A" : "Not Approved"}<br>
                    Tel: ${senderContact}<br>
                    E-Mail: ${senderEmail}
                </td>
                <td class="red-text" colspan="2" style="white-space: pre-line;     border: 1px solid #aaa;">
                    ${receiverName}<br>
                    ${receiverAddress.replace(/, /g, ",<br>")}<br>
                    Contact Person: ${receiverName}<br>
                    Passport No: ${receiver.kycApproved ? receiver.passportNumber || "N/A" : "Not Approved"}<br>
                    Emirates ID #: ${receiver.kycApproved ? receiver.emiratesId || "N/A" : "Not Approved"}<br>
                    Tel: ${receiverContact}<br>
                    E-Mail: ${receiverEmail}
                </td>
            </tr>
        </table>

        <div class="disclaimer golden-text">
            This paper serves as an legal responsibility of sender & receiver for the contents of the cargo being shipped through the company ${company?.company || ""}. The Sender and Receiver will be only responsible for any loss / damages which results in case of any prohibited items attempted to be shipped through this order.
        </div>

        <div class="section-header">ACKNOWLEDGMENT AND ACCEPTANCE OF ORDER</div>

        <table>
            <tr>
                <td><b>Order Date:</b> <span class="red-text">${formatDate(orderData.created_at) || "15/08/11"}</span></td>
                <td><b>Order Number:</b> <span class="red-text">${orderData.booking_ref || "5017"}</span></td>
                <td><b>Customer No:</b> <span class="red-text">${orderData.rgl_booking_number || "Sender BB Sys #"}</span></td>
            </tr>
        </table>

        <table>
            <tr style="text-align: center; font-weight: bold; background: #eee;     border: 1px solid #aaa;">
                <td style="width: 10%;">QTY</td>
                <td style="width: 30%;">DESCRIPTION</td>
                <td style="width: 15%;">Order No</td>
                <td style="width: 15%;">Marks & No</td>
                <td style="width: 15%;">Port of Loading</td>
                <td style="width: 15%;">Port of Destination</td>
            </tr>
            <tr style="height: 60px; text-align: center;     border: 1px solid #aaa;">
                <td class="red-text">${totalQty}</td>
                <td class="red-text">${getDescription()}</td>
                <td class="red-text">${getOrderNo()}</td>
                <td class="red-text">${containerInfo}</td>
                <td class="red-text">${getPlaceName(orderData.place_of_loading)}</td>
                <td class="red-text">${getPlaceName(orderData.final_destination)}</td>
            </tr>
            <tr>
                <td colspan="4" rowspan="2"><b>Mode:</b> <span class="red-text">${orderData.transport_type || "Sea Shipment"}</span></td>
                <td style="text-align: right;"><b>SUBTOTAL:</b></td>
                <td style="text-align: center;">TBC</td>
            </tr>
            <tr>
                <td style="text-align: right; font-size: 9px;">FREIGHT SURCHARGE</td>
                <td style="text-align: center;">N/a</td>
            </tr>
            <tr>
                <td colspan="4">
                    <b>EXPECTED SHIP DATE:</b> <span class="red-text">${formattedShipDate}</span><br>
                    <b>TRANSIT TIME:</b> <span class="red-text">10 Days ( Expected Delivery ${formattedDeliveryDate} )</span>
                </td>
                <td style="text-align: right; font-weight: bold;">TOTAL</td>
                <td style="text-align: center;">N/A</td>
            </tr>
        </table>

        <table>
            <tr style="background: #eee; font-weight: bold; border: 1px solid #aaa;" >
                <td style="width: 50%;">BILL TO: <span style="font-weight: normal;">(CUSTOMER # 117788)</span></td>
                <td style="width: 50%;">SHIP TO:</td>
            </tr>
            <tr class="red-text">
                <td>
                    Either of the Party from<br>sender or receiver paying the Invoice<br>
                    <span style="color: black;">Attn: ${senderName.split(" ")[0] || ""}</span><br>
                    Tel: ${senderContact}
                </td>
                <td>
                    Individual or company suppose to be the<br>recipient of the consignment<br>
                    <span style="color: black;">Attn: ${receiverName.split(" ")[0] || ""}</span><br>
                    Tel: ${receiverContact}
                </td>
            </tr>
        </table>

        <div style="text-align: center; font-weight: bold; padding: 5px;  margin: 10px 0;">
            We confirm acceptance of said order, with terms as stated above.
        </div>

        <table style="margin-top: 10px;">
            <tr>
                <td style="width: 15%; border-bottom: none;"><b>Signature:</b></td>
                <td rowspan="2" style="text-align: center; padding: 8px; vertical-align: middle;">
                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 2px;">
                        ${
                          orderData.sender_kyc_approved &&
                          orderData.sender_signature_url
                            ? `<img src="${orderData.sender_signature_url}" style="height:40px; max-width:180px; object-fit:contain; filter: grayscale(100%) contrast(100%); mix-blend-mode: multiply; margin-bottom:2px; left: 0" />`
                            : `<span>Digitally Signed through verified login and OTP for ID verification</span>`
                        }
                        <span><b>Time & Date Stamp:</b> ${currentDate} ${new Date().toLocaleTimeString()}</span>
                        <span><b>Email Addressed Used:</b> ${senderEmail}</span>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="border-top: none;"><b>Name:</b> ${senderName}</td>
            </tr>
        </table>
    </div>

    </body>
    </html>
    `;
  };

  const HouseBillOfLading = (orderData, company) => {
    const safeOrder = orderData || {};
    const receivers = safeOrder.receivers || [];
    const consignment = safeOrder.consignment || {};

    const primary = company?.primary_color || "#f37021";
    const secondary = company?.secondary_color || "#008a45";

    const tint = (hex, opacity = 0.12) => {
      if (!hex) return "#f5f5f5";
      const clean = hex.replace("#", "");
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const commonData = {
      consignment_number:
        consignment.consignment_number || safeOrder.booking_ref || "N/A",
      originName: getPlaceName(safeOrder.place_of_loading) || "N/A",
      destinationName: getPlaceName(safeOrder.final_destination) || "N/A",
      shipperName: safeOrder.sender_name || "N/A",
      shipperAddress: safeOrder.sender_address || "N/A",
      voyage: consignment.voyage || "N/A",
      vesselName: consignment.vessel || "N/A",
      sealNo: consignment.seal_no || safeOrder.seal_no || "N/A",
      created_at: safeOrder.created_at || null,
      generated_date: new Date()
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .toUpperCase(),
      generated_time: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const companyName =
      company?.company || "ROYAL GULF SHIPPING & LOGISTICS LLC";
    const companyPhone = company?.phone || "";
    const companyEmail = company?.email || "";
    const companyLogo = company?.logo_url || "";

    const receiverGroups =
      receivers.length > 0
        ? receivers.map((receiver) => ({
            orderNumber: safeOrder.rgl_booking_number || `ORD-${safeOrder.id}`,
            receiverName: receiver.receiverName || "N/A",
            receiverAddress: receiver.receiverAddress || "N/A",
            receiverData: receiver,
            shippingDetails: receiver.shippingdetails || [],
          }))
        : [
            {
              orderNumber:
                safeOrder.rgl_booking_number || `ORD-${safeOrder.id}`,
              receiverName: "N/A",
              receiverAddress: "N/A",
              receiverData: {},
              shippingDetails: [],
            },
          ];

    let allPagesHTML = "";

    receiverGroups.forEach((receiverGroup, i) => {
      const receiver = receiverGroup.receiverData;
      const shippingDetails = receiverGroup.shippingDetails;

      let receiverPackages = 0;
      let receiverWeight = 0;
      let itemRef = "";

      shippingDetails.forEach((item) => {
        let packagesForItem = 0;
        let weightForItem = 0;

        if (item.containerDetails && item.containerDetails.length > 0) {
          item.containerDetails.forEach((cd) => {
            packagesForItem += Number(cd.assign_total_box) || 0;
            weightForItem += Number(cd.assign_weight) || 0;
          });
        } else {
          packagesForItem = parseInt(item.totalNumber) || 0;
          weightForItem = parseFloat(item.weight) || 0;
        }

        receiverPackages += packagesForItem;
        receiverWeight += weightForItem;

        if (item.itemRef && !itemRef.includes(item.itemRef)) {
          itemRef += (itemRef ? ", " : "") + item.itemRef;
        }
      });

      const firstContainerNumber =
        receiver.containers && receiver.containers.length > 0
          ? receiver.containers[0]
          : "N/A";

      const issueDate = commonData.created_at
        ? new Date(commonData.created_at).toLocaleString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        : "N/A";

      const cargoRows =
        shippingDetails.length > 0
          ? shippingDetails
              .map((item) => {
                let packagesForItem = 0;
                let weightForItem = 0;

                if (item.containerDetails && item.containerDetails.length > 0) {
                  item.containerDetails.forEach((cd) => {
                    packagesForItem += Number(cd.assign_total_box) || 0;
                    weightForItem += Number(cd.assign_weight) || 0;
                  });
                } else {
                  packagesForItem = parseInt(item.totalNumber) || 0;
                  weightForItem = parseFloat(item.weight) || 0;
                }

                const category = item.category || "N/A";
                const subcategory = item.subcategory || "";
                const description = subcategory
                  ? `${category} - ${subcategory}`
                  : category;

                return `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${item.type || "N/A"}</td>
                  <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${description}</td>
                  <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${packagesForItem}</td>
                  <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${weightForItem.toFixed(2)}</td>
                  <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">0.00</td>
                </tr>
              `;
              })
              .join("")
          : "";

      allPagesHTML += `
    <div class="hbl-page" style="border-top: 8px solid ${primary};">
      <div class="header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <div class="logo-area">
          ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="width: 150px; height: auto;">` : `<span style="color: ${primary}; font-size: 16px; font-weight: bold;">${companyName}</span>`}
        </div>
        <div class="company-info" style="text-align: left; flex-grow: 1; margin-left: 20px;">
          <p class="company-name" style="color: ${primary}; font-size: 16px; font-weight: bold; margin: 0;">${companyName.toUpperCase()}</p>
          <p class="locations" style="color: ${secondary}; font-weight: bold; margin: 2px 0;">DUBAI • LONDON • KARACHI • SHENZHEN</p>
          <p style="font-size: 8px;">${companyPhone ? `Ph: ${companyPhone} | ` : ""}${companyEmail}</p>
        </div>
        <div class="title-area" style="text-align: right;">
          <p class="hbl-title" style="color: ${primary}; font-size: 20px; font-weight: bold; margin: 0;">HOUSE BILL OF LADING</p>
          <p style="font-size: 8px;">Non-negotiable copy</p>
          <p style="font-size: 8px;">Consignment: ${commonData.consignment_number}</p>
        </div>
      </div>

      <div class="grid-row" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 8px;">
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">HBL NO.</span>
          <span style="font-weight: bold; font-size: 9px;">--</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">ORDER REFERENCE</span>
          <span style="font-weight: bold; font-size: 9px;">${receiverGroup.orderNumber}</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">ITEM REFERENCE</span>
          <span style="font-weight: bold; font-size: 9px;">${itemRef}</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">ISSUE DATE</span>
          <span style="font-weight: bold; font-size: 9px;">${issueDate}</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">PLACE OF ISSUE</span>
          <span style="font-weight: bold; font-size: 9px;">${commonData.originName}</span>
        </div>
      </div>

      <div class="section-header" style="color: ${secondary}; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid ${secondary}; margin-bottom: 5px;">SHIPMENT PARTIES</div>

      <div class="parties-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 70px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">SHIPPER</span>
          <div style="font-weight: bold; font-size: 9px;">${commonData.shipperName}</div>
          <div style="font-size: 8px; color: #666;">${commonData.shipperAddress}</div>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 70px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">CONSIGNEE</span>
          <div style="font-weight: bold; font-size: 9px;">${receiverGroup.receiverName}</div>
          <div style="font-size: 8px; color: #666;">${receiverGroup.receiverAddress}</div>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 70px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">NOTIFY PARTY</span>
          <div style="font-weight: bold; font-size: 9px;">SAME AS CONSIGNEE</div>
        </div>
      </div>

      <div class="section-header" style="color: ${secondary}; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid ${secondary}; margin-bottom: 5px;">VOYAGE & ROUTING DETAILS</div>

      <div class="grid-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">PORT OF LOADING (POL)</span>
          <span style="font-weight: bold; font-size: 9px;">${commonData.originName}</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">PORT OF DISCHARGE (POD)</span>
          <span style="font-weight: bold; font-size: 9px;">${commonData.destinationName}</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">FINAL DESTINATION</span>
          <span style="font-weight: bold; font-size: 9px;">${commonData.destinationName}</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">VESSEL NAME</span>
          <span style="font-weight: bold; font-size: 9px;">${commonData.vesselName}</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">VOYAGE / SAILING</span>
          <span style="font-weight: bold; font-size: 9px;">${commonData.voyage}</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">INCOTERMS</span>
          <span style="font-weight: bold; font-size: 9px;">SEAFREIGHT</span>
        </div>
      </div>

      <div class="section-header" style="color: ${secondary}; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid ${secondary}; margin-bottom: 5px;">CONTAINER & PACKAGE INFO</div>

      <div class="grid-row" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px;">
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">CONTAINER NO.</span>
          <span style="font-weight: bold; font-size: 9px;">${firstContainerNumber} | 40ft</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">SEAL NO.</span>
          <span style="font-weight: bold; font-size: 9px;">${commonData.sealNo}</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">TOTAL PACKAGES</span>
          <span style="font-weight: bold; font-size: 9px;">${receiverPackages}</span>
        </div>
        <div class="data-box" style="border: 1px solid #ccc; padding: 4px; min-height: 30px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">TOTAL WEIGHT (KGS)</span>
          <span style="font-weight: bold; font-size: 9px;">${receiverWeight.toFixed(2)}</span>
        </div>
      </div>

      <div class="section-header" style="color: ${secondary}; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid ${secondary}; margin-bottom: 5px;">CARGO DESCRIPTION</div>

      ${
        shippingDetails.length > 0
          ? `
      <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
        <thead>
          <tr>
            <th style="border: 1px solid #ccc; border-top: 2px solid ${primary}; background-color: #f9f9f9; padding: 4px; font-size: 8px; width: 20%;">MARKS & NUMBERS</th>
            <th style="border: 1px solid #ccc; border-top: 2px solid ${primary}; background-color: #f9f9f9; padding: 4px; font-size: 8px; width: 40%;">DESCRIPTION OF GOODS</th>
            <th style="border: 1px solid #ccc; border-top: 2px solid ${primary}; background-color: #f9f9f9; padding: 4px; font-size: 8px; width: 10%;">PKGS</th>
            <th style="border: 1px solid #ccc; border-top: 2px solid ${primary}; background-color: #f9f9f9; padding: 4px; font-size: 8px; width: 15%;">WEIGHT (KGS)</th>
            <th style="border: 1px solid #ccc; border-top: 2px solid ${primary}; background-color: #f9f9f9; padding: 4px; font-size: 8px; width: 15%;">VOLUME (CBM)</th>
          </tr>
        </thead>
        <tbody>
          ${cargoRows}
          <tr style="font-weight: bold; background-color: ${tint(secondary)};">
            <td colspan="2" style="border: 1px solid #ccc; padding: 8px 4px; text-align: right;">TOTAL:</td>
            <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${receiverPackages}</td>
            <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">${receiverWeight.toFixed(2)}</td>
            <td style="border: 1px solid #ccc; padding: 8px 4px; text-align: center;">0.00</td>
          </tr>
        </tbody>
      </table>
      `
          : `
      <div style="text-align: center; padding: 30px; background: #f9f9f9; border: 1px dashed #ccc; margin-bottom: 20px;">
        <h4 style="color: #666; font-style: italic;">NO CARGO DETAILS FOUND</h4>
        <p style="color: #999;">No shipping details available for this receiver.</p>
      </div>
      `
      }

      <div class="bottom-section" style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px; margin-top: 10px; border-top: 1px solid #000; padding-top: 8px;">
        <div class="terms" style="font-size: 10px; line-height: 1.4;">
          <strong>By confirming this order for shipment, the Shipper/Consignee agrees to the following terms:</strong>
          <ol style="margin: 6px 0; padding-left: 0; list-style-position: inside;">
            <li style="margin-bottom: 4px;">Carriage is performed under ${companyName}'s standard terms and applicable international conventions. All cargo details supplied must be true and complete.</li>
            <li style="margin-bottom: 4px;">Transit times are estimates only. Delays may occur due to weather, customs, port congestion, operational issues or carrier schedules.</li>
            <li style="margin-bottom: 4px;">Customs scanning, inspections, dog checks, or port delays may incur extra charges payable by the Merchant.</li>
            <li style="margin-bottom: 4px;">In case of loss/damage, liability shall not exceed the freight value or USD 50 per package unless a higher value is declared and agreed in writing beforehand.</li>
            <li style="margin-bottom: 4px;">The Merchant confirms lawful ownership of goods and accepts full responsibility for any illegal, prohibited or undeclared items shipped.</li>
            <li style="margin-bottom: 4px;">${companyName} is not liable for any damage during customs/port inspections at origin, transit or destination.</li>
            <li style="margin-bottom: 4px;">Cargo is carried at Merchant's risk unless the Merchant arranges separate insurance. ${companyName} is not liable for indirect or consequential losses.</li>
            <li style="margin-bottom: 4px;">Claims must be notified immediately in writing and within legal time limits. Late claims may be void.</li>
            <li style="margin-bottom: 4px;">${companyName} may use third-party carriers or subcontractors; all their protections and liability limits apply equally to ${companyName}.</li>
            <li style="margin-bottom: 4px;">This HBL applies only to order ref ${receiverGroup.orderNumber}.</li>
            <li style="margin-bottom: 4px;">Governed by UAE law; disputes fall under Dubai courts unless agreed otherwise.</li>
          </ol>
          <p style="font-size: 7px; margin-top: 10px;">
            Receiver: ${receiverGroup.receiverName} |
            Order: ${receiverGroup.orderNumber} |
            Container: ${firstContainerNumber} |
            Page ${i + 1} of ${receiverGroups.length}
          </p>
        </div>
        <div class="signature-box" style="border-left: 1px solid #ccc; padding-left: 10px;">
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #000;">For and on behalf of</span>
          <p style="color: ${primary}; font-weight: bold; margin: 0; font-size:12px;">${companyName}</p>
          <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #000;">Generated: ${commonData.generated_date} ${commonData.generated_time}</span>
          <div style="margin-top: 35px; border-top: 1px solid #000;">
            <span class="label" style="font-size: 7px; font-weight: bold; display: block; text-transform: uppercase; color: #666;">Authorised Signature</span>
          </div>
        </div>
      </div>
    </div>
    `;
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>House Bill of Lading</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            font-size: 10px;
            color: #333;
        }
        .hbl-page {
            width: 780px;
            margin: 0 auto 20px auto;
            padding: 25px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .hbl-page:not(:last-child) {
            page-break-after: always;
        }
        @media print {
            body { background-color: white; padding: 0; }
            .hbl-page {
                box-shadow: none;
                page-break-after: always;
                page-break-inside: avoid;
            }
            .hbl-page:last-child { page-break-after: auto; }
        }
    </style>
</head>
<body>
    ${allPagesHTML}
</body>
</html>
  `;
  };

  const BillOfLading = (orderData, company) => {
    const primary = company?.primary_color || "#2b3a67";
    const secondary = company?.secondary_color || "#e63946";
    const getValue = (value) => {
      return value && value !== "" && value !== null && value !== undefined
        ? value
        : "";
    };

    const consignment = orderData.consignment || {};

    const currentDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const senderName = getValue(
      consignment.shipper?.company_name || orderData.sender_name,
    );
    const senderAddress = getValue(
      consignment.shipper?.address || orderData.sender_address,
    );
    const senderContact = getValue(
      consignment.shipper?.contact_phone || orderData.sender_contact,
    );

    const receiver =
      orderData.receivers && orderData.receivers[0]
        ? orderData.receivers[0]
        : {};
    const receiverName = getValue(
      consignment.consignee?.company_name || receiver.receiverName,
    );
    const receiverContact = getValue(
      consignment.consignee?.contact_phone || receiver.receiverContact,
    );
    const receiverAddress = getValue(
      consignment.consignee?.address || receiver.receiverAddress,
    );

    const shippingDetails =
      receiver.shippingdetails || receiver.shippingDetails || [];
    const containers = consignment.containers || receiver.containers || [];

    const getContainerRows = () => {
      if (!shippingDetails.length) return "";
      let rows = "";
      shippingDetails.forEach((detail) => {
        if (detail.containerDetails && detail.containerDetails.length) {
          detail.containerDetails.forEach((containerDetail) => {
            const containerNum =
              containerDetail.container?.container_number ||
              containerDetail.container_number ||
              "";
            const pkgs = containerDetail.total_number || "";
            const grossWt = containerDetail.assign_weight
              ? `${containerDetail.assign_weight} KGS`
              : "";
            if (containerNum) {
              rows += `<tr><td>${containerNum} / 40'HC</td><td></td><td>${pkgs} PKG</td><td></td><td>${grossWt}</td></tr>`;
            }
          });
        }
      });
      return rows;
    };

    const totalPkgs = shippingDetails.reduce((sum, detail) => {
      if (detail.containerDetails) {
        return (
          sum +
          detail.containerDetails.reduce(
            (s, cd) => s + (parseInt(cd.total_number) || 0),
            0,
          )
        );
      }
      return sum;
    }, 0);

    const vesselVoyage = consignment.vessel
      ? `${consignment.vessel}${consignment.voyage ? " / " + consignment.voyage : ""}`
      : "";

    const containerCount = containers.length
      ? `${containers.length}X40'HC`
      : "";

    return `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bill of Lading</title>
      <style>
          body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; margin: 0; padding: 20px; background-color: #f0f0f0; }
          .bl-container { width: 800px; margin: 0 auto; background-color: #fff; padding: 10px; border: 1px solid #ccc; position: relative; min-height: 1050px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
          .logo-section { display: flex; align-items: center; gap: 20px; }
          .mfd-logo img { width: 120px; height: auto; }
          .company-name { font-size: 16px; font-weight: bold; color: ${primary}; }
          .bl-title { text-align: right; line-height: 1.2; }
          .bl-title h1 { font-size: 18px; margin: 0; }
          .grid-container { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #000; border-left: 1px solid #000; }
          .cell { border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 4px; min-height: 40px; }
          .label { font-size: 8px; color: #555; display: block; margin-bottom: 2px; }
          .content { font-weight: bold; text-transform: uppercase; white-space: pre-line; }
          .full-width { grid-column: span 2; }
          .four-cols { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; }
          .description-area { min-height: 300px; padding: 15px; border-left: 1px solid #000; border-right: 1px solid #000; position: relative; }
          .table-data { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table-data th { text-align: left; font-size: 9px; border-bottom: 1px solid #000; padding: 5px; }
          .table-data td { padding: 5px; font-weight: bold; }
          .red-bar { height: 10px; background-color: ${secondary}; margin-top: 20px; }
      </style>
  </head>
  <body>
  <div class="bl-container">
      <div class="header">
          <div class="logo-section">
              <div class="mfd-logo"><img src="${company?.logo_url || ""}" alt="${company?.company || ""}"></div>
              <div class="company-name">${(company?.company || "").toUpperCase()}</div>
          </div>
          <div class="bl-title">
              <h1>Bill of Lading</h1>
              <div>Multimodal Transport<br>or Port-to-Port Shipment</div>
          </div>
      </div>

      <div class="grid-container">
          <div class="cell">
              <span class="label">Shipper</span>
              <div class="content">
                  ${senderName ? `${senderName}<br>` : ""}
                  ${senderAddress ? senderAddress.replace(/, /g, ",<br>") + "<br>" : ""}
                  ${senderContact ? `Tel: ${senderContact}` : ""}
              </div>
          </div>
          <div class="cell">
              <span class="label">B/L No.</span>
              <div class="content" style="font-size: 14px;">${getValue(orderData.booking_ref)}</div>
          </div>
          <div class="cell">
              <span class="label">Consignee</span>
              <div class="content">
                  ${receiverName ? `${receiverName}<br>` : ""}
                  ${receiverAddress ? receiverAddress.replace(/, /g, ",<br>") + "<br>" : ""}
                  ${receiverContact ? `Tel: ${receiverContact}` : ""}
              </div>
          </div>
          <div class="cell"><span class="label">Export Reference / Forwarding Agent</span><div class="content"></div></div>
          <div class="cell">
              <span class="label">Notify Party</span>
              <div class="content">
                  ${receiverName ? `${receiverName}<br>` : ""}
                  ${receiverAddress ? receiverAddress.replace(/, /g, ",<br>") + "<br>" : ""}
              </div>
          </div>
          <div class="cell"><span class="label">Destination Agent</span><div class="content"></div></div>
      </div>

      <div class="grid-container" style="border-top: none;">
          <div class="four-cols full-width">
              <div class="cell"><span class="label">Port of Loading</span><div class="content">${getPlaceName(orderData.place_of_loading)}</div></div>
              <div class="cell"><span class="label">Pre-carriage by</span><div class="content"></div></div>
              <div class="cell"><span class="label">Ocean Vessel / Voyage</span><div class="content">${vesselVoyage}</div></div>
              <div class="cell"><span class="label">Freight payable at</span><div class="content"></div></div>
          </div>
          <div class="four-cols full-width">
              <div class="cell"><span class="label">Place of Receipt</span><div class="content"></div></div>
              <div class="cell"><span class="label">Port of Discharge</span><div class="content">${getPlaceName(orderData.final_destination) || getPlaceName(orderData.place_of_delivery)}</div></div>
              <div class="cell"><span class="label">Place of Delivery</span><div class="content">${getPlaceName(orderData.place_of_delivery) || getPlaceName(orderData.final_destination)}</div></div>
              <div class="cell"><span class="label">Final Destination</span><div class="content">${getPlaceName(orderData.final_destination) || getPlaceName(orderData.place_of_delivery)}</div></div>
          </div>
      </div>

      <div class="description-area">
          <div style="display: flex; justify-content: space-between;">
              <div style="width: 20%;">
                  <span class="label">Marks & Nos. / No of Pkgs</span>
                  <div class="content" style="margin-top: 20px;">${totalPkgs ? totalPkgs + " PKGS" : ""}</div>
              </div>
              <div style="width: 30%;">
                  <span class="label">Description of Goods</span>
                  <div class="content" style="margin-top: 20px;">
                      ${shippingDetails
                        .map((d) => d.itemName || d.subcategory || d.category)
                        .filter(Boolean)
                        .join(", ")}
                  </div>
              </div>
              <div style="width: 20%; text-align: right;">
                  <span class="label">Gross Weight</span>
                  <div class="content" style="margin-top: 20px;">
                      ${consignment.gross_weight ? consignment.gross_weight + " KGS" : ""}
                  </div>
              </div>
          </div>
          ${
            getContainerRows()
              ? `
          <table class="table-data">
              <thead><tr><th>CONTAINER NO. SIZE</th><th>SEAL NO.</th><th>PKGS</th><th>NET WT</th><th>GROSS WT</th></tr></thead>
              <tbody>${getContainerRows()}</tbody>
          </table>`
              : ""
          }
      </div>

      <div class="grid-container">
          <div class="cell"><span class="label">Freight Details</span><div class="content"></div></div>
          <div class="cell"><span class="label">Total Number of Pkgs</span><div class="content">${containerCount}</div></div>
      </div>

      <div style="margin-top: 20px; display: flex; justify-content: space-between;">
          <div style="width: 60%;">
              <div class="content" style="margin-top: 10px;">${currentDate}</div>
          </div>
          <div style="text-align: right; width: 40%;">
              <div class="content" style="margin-top: 10px;">${(company?.company || "").toUpperCase()}</div>
          </div>
      </div>
      <div class="red-bar"></div>
  </div>
  </body>
  </html>
  `;
  };

  const CargoGatePass = (orderData, company) => {
    const primary = company?.primary_color || "#1a4731";
    const secondary = company?.secondary_color || "#1a3d6d";
    const safeOrder = orderData || {};
    const getValue = (value, fallback = "") =>
      value !== null && value !== undefined && value !== "" ? value : fallback;

    const receiver =
      safeOrder.receivers && safeOrder.receivers[0]
        ? safeOrder.receivers[0]
        : {};
    const dropOff =
      receiver.drop_off_details && receiver.drop_off_details[0]
        ? receiver.drop_off_details[0]
        : {};

    const shippingDetails = receiver.shippingdetails || [];
    const containers = receiver.containers || [];

    const totalQty = shippingDetails.reduce(
      (sum, item) => sum + (parseInt(item.totalNumber) || 0),
      0,
    );

    const currentDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const marksAndNo = [
      containers.length ? containers.join(", ") : "",
      getValue(dropOff.dropoff_name),
      getValue(dropOff.drop_off_mobile),
    ]
      .filter(Boolean)
      .join(" | ");

    const itemRows = shippingDetails.length
      ? shippingDetails
          .map(
            (item, idx) => `
        <tr>
            <td class="idx-col">${idx + 1}</td>
            <td>
                <div class="item-name">${getValue(item.category, "ITEM")}${item.subcategory ? " - " + item.subcategory : ""}</div>
                <div class="item-sub">TRUCK # ${getValue(safeOrder.truck_number || dropOff.plate_no, "N/A")}</div>
                <div class="item-sub">DRIVER # ${getValue(dropOff.dropoff_name, "N/A")}</div>
                <div class="item-sub">ID # ${getValue(safeOrder.booking_ref)}</div>
                <div class="item-sub">${getValue(dropOff.drop_off_mobile)}</div>
            </td>
            <td class="qty-col">${(item.totalNumber || 0).toFixed(2)}</td>
        </tr>
      `,
          )
          .join("")
      : `<tr><td class="idx-col">1</td><td>No items</td><td class="qty-col">0.00</td></tr>`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cargo Gatepass</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        .document {
            width: 800px;
            margin: 0 auto;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .top-banner {
            background-color: ${primary};
            color: white;
            text-align: center;
            padding: 14px;
            font-size: 26px;
            font-weight: bold;
            letter-spacing: 2px;
        }
        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 20px 25px 10px 25px;
            border-bottom: 1px solid #ccc;
        }
        .logo-block { display: flex; align-items: flex-start; gap: 12px; }
        .logo-block img { width: 60px; height: auto; }
        .company-info { font-size: 11px; line-height: 1.4; color: #333; }
        .company-info .company-title {
            font-weight: bold;
            font-size: 13px;
            color: #1a4731;
        }
        .gatepass-title {
            text-align: right;
            font-size: 22px;
            font-weight: bold;
            color: ${secondary};
            line-height: 1.2;
        }
        .meta-section {
            display: flex;
            justify-content: space-between;
            padding: 12px 25px;
            border-bottom: 1px solid #ccc;
            font-size: 12px;
        }
        .meta-col { width: 48%; }
        .meta-row { display: flex; margin-bottom: 4px; }
        .meta-label { width: 110px; color: #333; }
        .meta-value { font-weight: bold; }
        .bill-to-header {
            background-color: #f0f0f0;
            padding: 6px 25px;
            font-weight: bold;
            font-size: 12px;
            border-bottom: 1px solid #ccc;
        }
        .bill-to-name {
            padding: 8px 25px;
            font-weight: bold;
            color: #c0392b;
            font-size: 13px;
        }
        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
        }
        table.items-table th {
            background-color: #fafafa;
            text-align: left;
            font-size: 11px;
            padding: 6px 25px;
            border-top: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
        }
        table.items-table td {
            padding: 8px 25px;
            font-size: 12px;
            vertical-align: top;
            border-bottom: 1px solid #eee;
        }
        .idx-col { width: 30px; color: #c0392b; }
        .qty-col { text-align: right; color: #c0392b; font-weight: bold; }
        .item-name { color: #2980b9; font-weight: bold; }
        .item-sub { color: #2980b9; font-size: 11px; }
        .totals-section {
            display: flex;
            justify-content: space-between;
            padding: 10px 25px;
            font-size: 12px;
            border-bottom: 1px solid #ccc;
        }
        .totals-right { text-align: right; }
        .totals-right .total-row {
            font-weight: bold;
            margin-top: 4px;
        }
        .thanks-note {
            padding: 15px 25px;
            font-size: 12px;
            color: #333;
        }
        .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: ${primary};
            color: white;
            padding: 12px 25px;
            font-size: 12px;
            margin-top: 40px;
        }
        .footer .contact-line { display: flex; gap: 20px; }
        @media print {
            @page { size: A4; margin: 0; }
            body { background: white; padding: 0; }
            .document { box-shadow: none; width: 100%; }
        }
    </style>
</head>
<body>
    <div class="document">
        <div class="top-banner">STORAGE & DISTRIBUTION</div>

        <div class="header-section">
            <div class="logo-block">
                <img src="${company?.logo_url || ""}" alt="${company?.company || ""}" />
                <div class="company-info">
                    <div class="company-title">${company?.company || ""}</div>
                    ${(company?.address || "").replace(/, /g, "<br>")}
                </div>
            </div>
            <div class="gatepass-title">CARGO<br>GATEPASS</div>
        </div>

        <div class="meta-section">
            <div class="meta-col">
                <div class="meta-row"><div class="meta-label">GatePass #</div><div class="meta-value">${getValue(safeOrder.booking_ref)}</div></div>
                <div class="meta-row"><div class="meta-label">GatePass Date</div><div class="meta-value">${currentDate}</div></div>
                <div class="meta-row"><div class="meta-label">Terms</div><div class="meta-value">Due on Receipt</div></div>
                <div class="meta-row"><div class="meta-label">Due Date</div><div class="meta-value">${currentDate}</div></div>
                <div class="meta-row"><div class="meta-label">Marks & No</div><div class="meta-value">${getValue(marksAndNo, "N/A")}</div></div>
            </div>
            <div class="meta-col">
                <div class="meta-row"><div class="meta-label">Driver Name</div><div class="meta-value">${getValue(dropOff.dropoff_name, "N/A")}</div></div>
                <div class="meta-row"><div class="meta-label">Truck No</div><div class="meta-value">${getValue(safeOrder.truck_number || dropOff.plate_no, "N/A")}</div></div>
            </div>
        </div>

        <div class="bill-to-header">Bill To</div>
        <div class="bill-to-name">${getValue(receiver.receiverName, "N/A")}</div>

        <table class="items-table">
            <thead>
                <tr>
                    <th class="idx-col">#</th>
                    <th>Item & Description</th>
                    <th class="qty-col">Qty</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows}
            </tbody>
        </table>

        <div class="totals-section">
            <div>Items in Total ${totalQty.toFixed(2)}</div>
            <div class="totals-right">
                <div>Sub Total &nbsp;&nbsp; ${totalQty.toFixed(2)}</div>
                <div class="total-row">Total Qty &nbsp;&nbsp; QTY${totalQty.toFixed(2)}</div>
            </div>
        </div>

        <div class="thanks-note">Thanks for your business.</div>

        <div class="footer">
            <div class="contact-line">
                <span>☎ ${company?.phone || ""}</span>
            </div>
            <div>✉ ${company?.email || ""}</div>
        </div>
    </div>
</body>
</html>
  `;
  };

  const RickmersBillOfLadingSample = (orderData) => {
    const safeOrder = orderData || {};
    const getValue = (value, fallback = "") =>
      value !== null && value !== undefined && value !== "" ? value : fallback;

    const receiver =
      safeOrder.receivers && safeOrder.receivers[0]
        ? safeOrder.receivers[0]
        : {};
    const shippingDetails = receiver.shippingdetails || [];
    const containers = receiver.containers || [];

    const totalPkgs = shippingDetails.reduce(
      (sum, item) => sum + (parseInt(item.totalNumber) || 0),
      0,
    );
    const totalWeight = shippingDetails.reduce(
      (sum, item) => sum + (parseFloat(item.weight) || 0),
      0,
    );

    const goodsDescription = shippingDetails.length
      ? shippingDetails
          .map((d) => d.category || d.subcategory || d.itemName)
          .filter(Boolean)
          .join(", ")
      : "USED CLOTHING";

    const containerNumber = containers.length ? containers[0] : "________";

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rickmers Bill of Lading Sample</title>
          <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                  font-family: 'Courier New', monospace;
                  font-size: 11px;
                  background-color: #f5f5f5;
                  padding: 20px;
                  color: #000;
              }
              .page {
                  width: 900px;
                  margin: 0 auto 20px auto;
                  background: #fff;
                  padding: 25px 30px;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  position: relative;
              }
              .page:not(:last-child) { page-break-after: always; }
              .page-number {
                  position: absolute;
                  top: 15px;
                  right: 20px;
                  font-size: 10px;
              }
              .header-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 10px;
              }
              .logo-block img { height: 50px; }
              .center-title {
                  text-align: center;
                  flex-grow: 1;
              }
              .center-title .nn {
                  color: #1a3d8f;
                  font-weight: bold;
                  font-size: 14px;
                  letter-spacing: 1px;
              }
              .center-title .bl-sub {
                  color: #1a3d8f;
                  font-size: 10px;
              }
              .booking-info { text-align: right; font-size: 10px; }
              table.bl-table {
                  width: 100%;
                  border-collapse: collapse;
                  border: 1px solid #999;
                  margin-top: 10px;
              }
              table.bl-table td {
                  border: 1px solid #999;
                  padding: 4px 6px;
                  vertical-align: top;
                  font-size: 10px;
              }
              .label {
                  color: #1a3d8f;
                  font-size: 8.5px;
                  display: block;
                  margin-bottom: 2px;
              }
              .remarks-cell { font-size: 8px; line-height: 1.3; }
              .section-title {
                  color: #1a3d8f;
                  font-size: 8.5px;
                  margin-bottom: 3px;
              }
              .goods-table td { text-align: center; font-size: 10px; }
              .goods-table .desc-cell { text-align: left; }
              .note-text {
                  font-size: 9px;
                  margin-top: 8px;
              }
              .footer-note {
                  margin-top: 15px;
                  font-size: 9px;
                  line-height: 1.5;
              }
              .signature-block {
                  margin-top: 30px;
                  text-align: right;
                  font-size: 10px;
              }
              @media print {
                  @page { size: A4 landscape; margin: 0; }
                  body { background: white; padding: 0; }
                  .page { box-shadow: none; }
              }
          </style>
      </head>
      <body>
          <div class="page">
              <div class="page-number">PAGE: 1 OF 2</div>
              <div class="header-row">
                  <div class="logo-block">
                      <img src="${logoRickmers}" alt="Rickmers Container Line" />
                  </div>
                  <div class="center-title">
                      <div class="nn">NON NEGOTIABLE</div>
                      <div class="bl-sub">SEA WAYBILL</div>
                      <div class="bl-sub">BILL OF LADING</div>
                  </div>
                  <div class="booking-info">
                      BOOKING NO.<br><b>${getValue(safeOrder.booking_ref, "________")}</b><br><br>
                      SEA WAYBILL NO.<br><b>${getValue(safeOrder.rgl_booking_number, "RGSLKHIJEA0000")}</b>
                  </div>
              </div>

              <table class="bl-table">
                  <tr>
                      <td style="width:50%;">
                          <span class="label">SHIPPER/EXPORTER</span>
                          <b>${getValue(safeOrder.sender_name, "N/A").toUpperCase()}</b><br>
                          ${getValue(safeOrder.sender_address, "").toUpperCase()}
                      </td>
                      <td style="width:50%;">
                          <span class="label">EXPORT REFERENCES (for the Merchant's and/or Carrier's reference only. See back clause 8. (4))</span>
                      </td>
                  </tr>
                  <tr>
                      <td>
                          <span class="label">CONSIGNEE</span>
                          <b>${getValue(receiver.receiverName, "N/A").toUpperCase()}</b><br>
                          ${getValue(receiver.receiverAddress, "").toUpperCase()}
                      </td>
                      <td rowspan="2">
                          <span class="label">FORWARDING AGENT-REFERENCES<br>FMC/NO</span>
                      </td>
                  </tr>
                  <tr>
                      <td>
                          <span class="label">NOTIFY PARTY (It is agreed that no responsibility shall be attached to the Carrier or its Agents for failure to notify)</span>
                          ${getValue(receiver.receiverName, "N/A").toUpperCase()}<br>
                          ${getValue(receiver.receiverAddress, "").toUpperCase()}
                      </td>
                  </tr>
                  <tr>
                      <td colspan="2" class="remarks-cell">
                          RECEIVED by the Carrier in apparent good order and condition (unless otherwise stated herein) the total number or quantity of Containers or other packages or units indicated in the box entitled "Carrier's Receipt" for Carriage subject to all the terms and conditions hereof from the Place of Receipt or Port of Loading to the Port of Discharge or Place of Delivery, as applicable. Delivery of the Goods to the Carrier for Carriage hereunder constitutes acceptance by the Merchant (as defined hereinafter) of all the terms and conditions, whether printed, stamped or otherwise incorporated on this side and on the reverse side of this Bill of Lading and the terms and conditions of the Carrier's applicable tariff(s) as if they were all signed by the Merchant.
                      </td>
                  </tr>
                  <tr>
                      <td>
                          <span class="label">PRE CARRIAGE BY</span><br>
                          <span class="label" style="margin-top:6px;">PLACE OF RECEIPT</span>
                          ${getPlaceName(safeOrder.place_of_loading)}
                      </td>
                      <td>
                          <span class="label">TYPE OF MOVEMENT (BY): USE DESCRIPTION OF PACKAGES AND GOODS FIELD)</span>
                          FCL / FCL
                      </td>
                  </tr>
                  <tr>
                      <td>
                          <span class="label">OCEAN VESSEL/VOYAGE NO. FLAG</span>
                          ${getValue(safeOrder.consignment?.vessel, "________")}<br><br>
                          <span class="label">PORT OF LOADING</span>
                          ${getPlaceName(safeOrder.place_of_loading)}
                      </td>
                      <td>
                          <span class="label">FINAL DESTINATION (for the Merchant's reference only)</span>
                      </td>
                  </tr>
                  <tr>
                      <td>
                          <span class="label">PORT OF DISCHARGE</span>
                          ${getPlaceName(safeOrder.final_destination)}
                      </td>
                      <td>
                          <span class="label">PLACE OF DELIVERY</span>
                          ${getPlaceName(safeOrder.place_of_delivery)}
                      </td>
                  </tr>
              </table>

              <div class="note-text">(CHECK "NM" COLUMN IF HAZARDOUS MATERIAL)</div>
              <div class="note-text" style="color:#1a3d8f;">PARTICULARS DECLARED BY SHIPPER BUT NOT ACKNOWLEDGED BY THE CARRIER</div>

              <table class="bl-table goods-table">
                  <tr>
                      <td style="width:20%;"><span class="label">CNTR. NOS. SEAL NOS. MARKS & NUMBERS</span></td>
                      <td style="width:12%;"><span class="label">QUANTITY (DECLARATION ONLY)</span></td>
                      <td style="width:3%;">H<br>M</td>
                      <td style="width:35%;" class="desc-cell"><span class="label">DESCRIPTION OF GOODS</span></td>
                      <td style="width:15%;"><span class="label">GROSS WEIGHT</span></td>
                      <td style="width:15%;"><span class="label">GROSS MEASUREMENT</span></td>
                  </tr>
                  <tr>
                      <td>${containerNumber}</td>
                      <td>${totalPkgs || 0}<br>PKGS</td>
                      <td></td>
                      <td class="desc-cell">
                          SHIPPER'S LOAD AND COUNT<br>
                          1X40FT CONTAINER(S)<br><br>
                          ${goodsDescription}<br><br>
                          14 COMBINED FREE DAYS AT DESTINATION
                      </td>
                      <td>${totalWeight ? totalWeight.toFixed(2) + "KGS" : "________"}</td>
                      <td></td>
                  </tr>
              </table>

              <div class="note-text" style="font-weight:bold;">** TO BE CONTINUED ON ATTACHED LIST **</div>

              <table class="bl-table" style="margin-top:15px;">
                  <tr>
                      <td style="width:33%;">
                          <span class="label" style="color:#c0392b;">Declared Cargo Value US $</span>
                          <span style="font-size:8px;">If Merchant enters a value, Carrier's limitation of liability shall not apply and the ad valorem rate will be charged.</span>
                      </td>
                      <td style="width:34%;">
                          <span class="label">FREIGHT & CHARGES PAYABLE AT / BY</span>
                      </td>
                      <td style="width:33%;">
                          <span class="label">(if) ORIGINAL BILL(S) HAVE BEEN SIGNED</span>
                      </td>
                  </tr>
                  <tr>
                      <td colspan="3">
                          <table style="width:100%; border-collapse:collapse;">
                              <tr>
                                  <td style="border:1px solid #999; padding:3px; font-size:8.5px;">CODE</td>
                                  <td style="border:1px solid #999; padding:3px; font-size:8.5px;">TARIFF ITEM</td>
                                  <td style="border:1px solid #999; padding:3px; font-size:8.5px;">FREIGHTED AS</td>
                                  <td style="border:1px solid #999; padding:3px; font-size:8.5px;">RATE</td>
                                  <td style="border:1px solid #999; padding:3px; font-size:8.5px;">PREPAID</td>
                                  <td style="border:1px solid #999; padding:3px; font-size:8.5px;">COLLECT</td>
                              </tr>
                              <tr>
                                  <td style="border:1px solid #999; padding:8px;"></td>
                                  <td style="border:1px solid #999; padding:8px;"></td>
                                  <td style="border:1px solid #999; padding:8px;"></td>
                                  <td style="border:1px solid #999; padding:8px;"></td>
                                  <td style="border:1px solid #999; padding:8px;">PREPAID</td>
                                  <td style="border:1px solid #999; padding:8px;"></td>
                              </tr>
                          </table>
                      </td>
                  </tr>
              </table>

              <div class="signature-block">
                  DATE CARGO RECEIVED<br><br>
                  DATE LADEN ON BOARD<br>
                  <b>${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</b><br><br>
                  PLACE OF BILL(S)ISSUE<br>
                  <b>${getPlaceName(safeOrder.place_of_loading).toUpperCase()}</b><br><br>
                  DATED<br><br>
                  SIGNED<br>BY: <b>RICKMERS CONTAINER LINE</b><br>
                  as agent for and on behalf of
              </div>

              <div class="footer-note" style="text-align:right; margin-top:20px;">
                  RICKMERS CONTAINER LINE<br>
                  AS CARRIER
              </div>
          </div>

          <div class="page">
              <div class="page-number">PAGE: 2 OF 2</div>
              <div class="header-row">
                  <div class="logo-block">
                      <img src="${logoRickmers}" alt="Rickmers Container Line" />
                  </div>
                  <div class="center-title">
                      <div class="nn">NON NEGOTIABLE</div>
                      <div class="bl-sub">BILL OF LADING</div>
                  </div>
              </div>

              <div style="display:flex; justify-content:space-between; font-size:10px; border-top:1px solid #999; border-bottom:1px solid #999; padding:5px 0; margin-top:10px;">
                  <div>VESSEL VOYAGE: ${getValue(safeOrder.consignment?.vessel, "________")} ${getValue(safeOrder.consignment?.voyage, "")}</div>
                  <div>B/L NO.: ${getValue(safeOrder.rgl_booking_number, "________")}</div>
              </div>

              <table class="bl-table" style="margin-top:10px;">
                  <tr>
                      <td style="width:20%;"><span class="label">CNTR/SEAL NOS. MARKS & NUMBERS</span></td>
                      <td style="width:15%;"><span class="label">QUANTITY FOR CUSTOMS DECLARATION ONLY</span></td>
                      <td style="width:3%;">H<br>M</td>
                      <td style="width:35%;" class="desc-cell"><span class="label">DESCRIPTION OF GOODS</span></td>
                      <td style="width:13%;"><span class="label">GROSS WEIGHT</span></td>
                      <td style="width:14%;"><span class="label">MEASUREMENT</span></td>
                  </tr>
                  <tr>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td class="desc-cell">
                          E FORM ${getValue(safeOrder.sender_ref, "________")}<br>
                          DATED: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      <td></td>
                      <td></td>
                  </tr>
              </table>

              <div class="footer-note">
                  OCEAN FREIGHT PREPAID<br>
                  DESTINATION CHARGES COLLECT PER LINE TARIFF AND OTHER CHARGES TO BE COLLECTED FROM<br>
                  THE PARTY WHO LAWFULLY DEMANDS DELIVERY OF THE CARGO WITHOUT PREJUDICE TO THE<br>
                  CARRIER'S RIGHTS AGAINST THE MERCHANT (SEE BACK CLAUSE 1) AS SET OUT AT BACK<br>
                  CLAUSE 13(1)
              </div>

              <div class="signature-block" style="margin-top:200px;">
                  SIGNED<br>BY: <b>RICKMERS CONTAINER LINE</b><br>
                  as agent for and on behalf of
              </div>

              <div class="footer-note" style="text-align:right; margin-top:20px;">
                  RICKMERS CONTAINER LINE<br>
                  AS CARRIER
              </div>
          </div>
      </body>
      </html>
    `;
  };

  const STATIC_DOCUMENT_GENERATORS = {
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
    "WHARFAGE - CONSIGNMENT NOTE.pdf": WHARFAGEConsignmentsNote,
    "Rickmers Bill of Lading Sample.pdf": RickmersBillOfLadingSample,
  };

  const BRANDABLE_DOCUMENT_GENERATORS = {
    "Bill of Lading.pdf": BillOfLading,
    "Order Confirmation & Acceptance.pdf": OrderConfirmation,
    "Order Acknowledgement Printabe Version.pdf":
      OrderAcknowledgementPrintableVersion,
    "GP#0121725 - Cargo GatePass.pdf": CargoGatePass,
    "House Bill of Lading (HBL).pdf": HouseBillOfLading,
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
      );
    }
    const generator = STATIC_DOCUMENT_GENERATORS[activeDocKey];
    return generator ? generator(activeOrderData) : "";
  }, [activeDocKey, activeOrderData, activeCompany]);

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
                      "Bill of Lading.pdf",
                      "Order Confirmation & Acceptance.pdf",
                      "Order Acknowledgement Printabe Version.pdf",
                      "GP#0121725 - Cargo GatePass.pdf",
                      "House Bill of Lading (HBL).pdf",
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
                  {
                    label: "Other",
                    color: "#555",
                    docs: [
                      "WHARFAGE - CONSIGNMENT NOTE.pdf",
                      "Rickmers Bill of Lading Sample.pdf",
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
                <Typography variant="subtitle2">Preview</Typography>
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
                    Booking Ref
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
                const categoryList = [
                  ...new Set(productsSummary.map((p) => p.category)),
                ].join(", ");

                const { label: leastStatusLabel, count: leastStatusRemaining } =
                  getLeastStatus(productsSummary, statuses);

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
                    <StyledTableCell>{order.booking_ref}</StyledTableCell>
                    <StyledTableCell>
                      {order?.rgl_booking_number}
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
                      />
                      {leastStatusRemaining - 1 > 0 && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ ml: 0.5, fontWeight: "bold" }}
                        >
                          (+{leastStatusRemaining - 1})
                        </Typography>
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
          onSave={async (collectionsPayload) => {
            toast.success("Collections saved");
            setOpenCollectionsModal(false);
            fetchOrders();
          }}
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
        >
          <DialogTitle>Update Receiver Status</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Select receiver and new status for order "
              {selectedOrderForUpdate?.booking_ref}". Notifications will be sent
              based on rules.
            </Typography>
            <FormControl fullWidth margin="dense">
              <InputLabel>Receiver</InputLabel>
              <Select
                value={selectedReceiverForUpdate?.id || ""}
                label="Receiver"
                onChange={handleReceiverChange}
              >
                {selectedOrderForUpdate?.receivers?.map((rec) => (
                  <MenuItem key={rec.id} value={rec.id}>
                    {rec.receiverName} | (Current: {rec.status})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Items</InputLabel>
              <Select
                value={selectedReceiverForUpdateDetails?.itemRef || ""}
                label="Receiver"
                onChange={handleShippingChange}
              >
                {selectedReceiverForUpdate?.shippingdetails?.map((rec) => (
                  <MenuItem key={rec.itemRef} value={rec.itemRef}>
                    {rec.itemRef} (Category: {rec.category})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
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
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseStatusDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmStatusUpdate}
              disabled={isLoading}
              variant="contained"
            >
              Update Status
            </Button>
            <Button
              onClick={handleNotify}
              disabled={isLoading}
              variant="contained"
            >
              Notify
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
