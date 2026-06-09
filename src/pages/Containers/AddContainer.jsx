import React, { useState, useEffect } from "react";
import axios, { all } from "axios";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Modal,
  FormControl,
  InputLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
  Pagination,
  TablePagination,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate } from "react-router-dom";
import HistoryIcon from "@mui/icons-material/History";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CloseIcon from "@mui/icons-material/Close";
import { api } from "../../api";
import SaveIcon from "@mui/icons-material/Save";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
applyPlugin(jsPDF);

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxWidth: "90vw",
  maxHeight: "90vh",
  overflow: "auto",
  width: { xs: "90%", sm: 600 },
};

const ContainerModule = ({ propContainers = [] }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    container_number: "",
    container_size: "",
    container_type: "",
    owner_type: "",
    status: "",
    location: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  const getStatusColor = (status) => {
    const colors = {
      Available: "success",
      Returned: "success",
      "In Transit": "warning",
      Loaded: "warning",
      Occupied: "warning",
      Hired: "warning",
      Arrived: "error",
      "Under Repair": "error",
      "De-Linked": "info",
      Cleared: "info",
      "Assigned to Job": "warning",
    };
    return colors[status] || "default";
  };

  const [statuses, setStatuses] = useState([
    {
      value: "Available",
      label: "Available",
      color: getStatusColor("Available"),
    },
    { value: "Hired", label: "Hired", color: getStatusColor("Hired") },
    { value: "Occupied", label: "Occupied", color: getStatusColor("Occupied") },
    {
      value: "In Transit",
      label: "In Transit",
      color: getStatusColor("In Transit"),
    },
    { value: "Loaded", label: "Loaded", color: getStatusColor("Loaded") },
    {
      value: "Assigned to Job",
      label: "Assigned to Job",
      color: getStatusColor("Assigned to Job"),
    },
    { value: "Arrived", label: "Arrived", color: getStatusColor("Arrived") },
    {
      value: "De-Linked",
      label: "De-Linked",
      color: getStatusColor("De-Linked"),
    },
    {
      value: "Under Repair",
      label: "Under Repair",
      color: getStatusColor("Under Repair"),
    },
    { value: "Returned", label: "Returned", color: getStatusColor("Returned") },
    { value: "Cleared", label: "Cleared", color: getStatusColor("Cleared") },
  ]);

  const [locations, setLocations] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [types, setTypes] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [selectedContainerNo, setSelectedContainerNo] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({ status: "", location: "" });
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const [containers, setContainers] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);

  const [loadingContainers, setLoadingContainers] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingReturned, setLoadingReturned] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const [error, setError] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [formData, setFormData] = useState({
    ownership: "soc",
    containerNo: "",
    size: "",
    type: "",
    derived_status: "",
    location: "karachi_port",
    dateAdded: new Date().toISOString().split("T")[0],
    dateOfManufacture: new Date().toISOString().split("T")[0],
    purchaseDate: new Date().toISOString().split("T")[0],
    purchasePrice: "",
    purchaseFrom: "",
    ownershipDetails: "Self-Owned",
    availableAtDate: new Date().toISOString().split("T")[0],
    currency: "USD",
    hireStartDate: new Date().toISOString().split("T")[0],
    hireEndDate: new Date().toISOString().split("T")[0],
    vendor: "",
    return_date: new Date().toISOString().split("T")[0],
    freeDays: "",
    placeOfLoading: "",
    placeOfDelivery: "",
  });

  const [activeHistoryTab, setActiveHistoryTab] = useState(0);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showToast = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
    setError(null);
  };

  const handleError = (
    error,
    defaultMessage = "An unexpected error occurred",
  ) => {
    console.error("Error:", error);
    const message =
      error.response?.data?.error || error.message || defaultMessage;
    setError(message);
    showToast(message, "error");
  };

  const [places, setPlaces] = useState([]);

  const getPlaceName = (placeId) => {
    if (!placeId) return "N/A";
    const idStr = placeId.toString();
    const place = places.find((p) => p.value === idStr || p.id === placeId);
    return place ? place.label : `ID: ${placeId}`;
  };

  const getJobDetails = async (jobNo) => {
    try {
      const response = await api.get(`/api/jobs/${jobNo}`);
      return { pol: response.data?.pol, pod: response.data?.pod };
    } catch (error) {
      console.error(`Error fetching job ${jobNo}:`, error);
      return { pol: null, pod: null };
    }
  };

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [
        statusRes,
        locationRes,
        sizeRes,
        typeRes,
        ownershipRes,
        placesRes,
      ] = await Promise.all([
        api.get("/api/containers/statuses"),
        api.get("/api/containers/locations"),
        api.get("/api/containers/sizes"),
        api.get("/api/containers/types"),
        api.get("/api/containers/ownership-types"),
        api.get("api/options/places/crud"),
      ]);

      setSizes(sizeRes.data || []);
      setTypes(typeRes.data || []);
      setOwnershipTypes(ownershipRes.data || []);

      const allPlaces = placesRes?.data?.places || [];
      setPlaces(
        allPlaces.map((p) => ({
          id: p.id,
          value: p.id.toString(),
          label: p.name,
        })),
      );
    } catch (error) {
      handleError(error, "Error fetching options");
    } finally {
      setLoadingOptions(false);
    }
  };

  const validateContainerNumber = (containerNo) => {
    const regex = /^[A-Z]{4}\d{7}$/;
    return regex.test(containerNo);
  };

  const validateDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const validateNumber = (value, fieldName) => {
    if (value === "" || value === null || value === undefined) return true;
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error(`${fieldName} must be a valid non-negative number`);
    }
    return true;
  };

  const fetchContainers = async () => {
    if (!navigator.onLine) {
      handleError(
        new Error("You are offline. Please check your connection."),
        "Network error",
      );
      return;
    }
    setLoadingContainers(true);
    setError(null);
    try {
      const params = { ...filters, page: currentPage, limit: rowsPerPage };
      const response = await api.get("/api/containers", { params });
      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      setContainers(response.data?.data || []);
      setTotalCount(response.data?.total || 0);
    } catch (error) {
      handleError(error, "Error fetching containers");
    } finally {
      setLoadingContainers(false);
    }
  };

  const fetchContainerById = async (cid) => {
    setLoadingHistory(true);
    setUsageHistory([]);

    if (!cid) {
      handleError(new Error("Invalid container ID"));
      setLoadingHistory(false);
      return;
    }

    try {
      const [containerRes, historyRes] = await Promise.all([
        api.get(`/api/containers/${cid}`),
        api.get(`/api/containers/${cid}/usage-history`),
      ]);

      if (containerRes.status !== 200 || historyRes.status !== 200) {
        throw new Error("Failed to fetch container details");
      }

      const data = containerRes.data;
      const groupedHistory = historyRes.data?.groupedByConsignment || {};
      const historyArray = Object.values(groupedHistory).reverse();

      setUsageHistory(historyArray);
      setSelectedContainerNo(data.container_number || cid);
    } catch (error) {
      console.error("Error fetching container details:", error);
      setUsageHistory([]);
      setSelectedContainerNo(cid);
      handleError(error, "Error fetching container details");
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchUnassignedOrders = async (cid) => {
    setLoadingUnassigned(true);
    try {
      const res = await api.get(`/api/containers/${cid}/unassigned-orders`);
      setUnassignedOrders(res.data?.orders || []);
    } catch (err) {
      console.error("Error fetching unassigned orders:", err);
      setUnassignedOrders([]);
    } finally {
      setLoadingUnassigned(false);
    }
  };

  useEffect(() => {
    if (!propContainers || propContainers.length === 0) {
      setContainers([]);
      setTotalCount(0);
      return;
    }

    let filtered = [...propContainers];

    if (filters.container_number) {
      filtered = filtered.filter((c) =>
        c.container_number
          ?.toUpperCase()
          .includes(filters.container_number.toUpperCase()),
      );
    }
    if (filters.container_size) {
      filtered = filtered.filter(
        (c) => c.container_size === filters.container_size,
      );
    }
    if (filters.container_type) {
      filtered = filtered.filter(
        (c) => c.container_type === filters.container_type,
      );
    }
    if (filters.owner_type) {
      filtered = filtered.filter((c) => c.owner_type === filters.owner_type);
    }
    if (filters.status) {
      filtered = filtered.filter((c) => c.derived_status === filters.status);
    }
    if (filters.location) {
      filtered = filtered.filter((c) => c.location === filters.location);
    }

    setTotalCount(filtered.length);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    setContainers(filtered.slice(startIndex, endIndex));
  }, []);

  const handleQuickEdit = (container) => {
    setEditingId(container.cid);
    setTempData({
      status: container.derived_status || "",
      location: container.location || "",
    });
  };

  const handleQuickSave = async (cid) => {
    if (!tempData.status || !tempData.location) {
      showToast("Status and Location are required", "error");
      return;
    }
    setLoadingUpdate(true);
    try {
      const payload = {
        derived_status: tempData.status,
        location: tempData.location,
      };
      const response = await api.put(`/api/containers/${cid}`, payload);
      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      showToast("Container updated successfully", "success");
      setEditingId(null);
      await fetchContainers();
    } catch (error) {
      handleError(error, "Failed to update container");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleQuickCancel = () => {
    setEditingId(null);
    setTempData({ status: "", location: "" });
  };

  const handleEdit = async (container) => {
    if (!container) {
      handleError(new Error("Invalid container data"));
      return;
    }
    try {
      setEditingContainer(container);
      setFormData({
        ownership: container.owner_type || "soc",
        containerNo: container.container_number || "",
        size: container.container_size || "",
        type: container.container_type || "",
        derived_status: container.derived_status || "",
        location: container.location || "karachi_port",
        dateAdded: new Date().toISOString().split("T")[0],
        dateOfManufacture: container.manufacture_date
          ? new Date(container.manufacture_date).toISOString().split("T")[0]
          : "",
        purchaseDate: container.purchase_date
          ? new Date(container.purchase_date).toISOString().split("T")[0]
          : "",
        purchasePrice: container.purchase_price || "",
        purchaseFrom: container.purchase_from || "",
        ownershipDetails: container.owned_by || "Self-Owned",
        availableAtDate: container.available_at
          ? new Date(container.available_at).toISOString().split("T")[0]
          : "",
        currency: container.currency || "USD",
        hireStartDate: container.hire_start_date
          ? new Date(container.hire_start_date).toISOString().split("T")[0]
          : "",
        hireEndDate: container.hire_end_date
          ? new Date(container.hire_end_date).toISOString().split("T")[0]
          : "",
        vendor: container.hired_by || "",
        return_date: container.return_date
          ? new Date(container.return_date).toISOString().split("T")[0]
          : "",
        freeDays: container.free_days || "",
        placeOfLoading: container.place_of_loading || "",
        placeOfDelivery: container.place_of_destination || "",
      });
      setIsEditing(true);
      setOpenAddModal(true);
    } catch (error) {
      handleError(error, "Error preparing to edit container");
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);
  useEffect(() => {
    fetchContainers();
  }, [filters, currentPage, rowsPerPage]);

  const [historyCid, setHistoryCid] = useState("");

  const openHistory = (cid) => {
    if (!cid) {
      handleError(new Error("Invalid container ID"));
      return;
    }
    setSelectedContainerNo(cid);
    setHistoryCid(cid);
    setActiveHistoryTab(0);
    setUnassignedOrders([]);

    fetchContainerById(cid);

    fetchUnassignedOrders(cid);

    setOpenHistoryModal(true);
  };

  const handleFilterChange = (e) => {
    if (!e || !e.target) return;
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      container_number: "",
      container_size: "",
      container_type: "",
      owner_type: "",
      status: "",
      location: "",
    });
    setCurrentPage(1);
  };

  const handleFormChange = (e) => {
    if (!e || !e.target) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.containerNo.trim()) {
      errors.push("Container Number is required");
    } else if (!validateContainerNumber(formData.containerNo)) {
      errors.push(
        "Container Number must be 4 letters followed by 7 digits (e.g., ABCD1234567)",
      );
    }

    if (!formData.size) errors.push("Size is required");
    if (!formData.type) errors.push("Type is required");

    if (
      !formData.location ||
      !["karachi_port", "dubai_port"].includes(formData.location)
    ) {
      errors.push("Valid Location is required (Karachi Port or Dubai Port)");
    }

    if (formData.ownership === "soc") {
      if (
        !formData.dateOfManufacture ||
        !validateDate(formData.dateOfManufacture)
      )
        errors.push("Valid Date of Manufacture is required");
      if (!formData.purchaseDate || !validateDate(formData.purchaseDate))
        errors.push("Valid Purchase Date is required");
      if (
        !formData.purchasePrice ||
        !validateNumber(formData.purchasePrice, "Purchase Price")
      )
        errors.push("Valid Purchase Price is required");
      if (!formData.purchaseFrom) errors.push("Purchase From is required");
      if (!formData.ownershipDetails.trim())
        errors.push("Owned By is required");
      if (!formData.availableAtDate || !validateDate(formData.availableAtDate))
        errors.push("Valid Available At Date is required");
      if (formData.currency && !/^[A-Z]{3}$/.test(formData.currency))
        errors.push("Currency must be a 3-letter code (e.g., USD)");
    }

    if (formData.ownership === "coc") {
      if (!formData.hireStartDate || !validateDate(formData.hireStartDate))
        errors.push("Valid Hire Start Date is required");
      if (!formData.hireEndDate || !validateDate(formData.hireEndDate))
        errors.push("Valid Hire End Date is required");
      if (!formData.vendor.trim()) errors.push("Vendor is required");
      if (!formData.freeDays || !validateNumber(formData.freeDays, "Free Days"))
        errors.push("Valid Free Days is required");
      if (!formData.placeOfLoading.trim())
        errors.push("Place of Loading is required");
      if (!formData.placeOfDelivery.trim())
        errors.push("Place of Delivery is required");
      if (formData.return_date && !validateDate(formData.return_date))
        errors.push("Valid Return Date is required");
    }

    if (errors.length > 0) throw new Error(errors.join("; "));
    return true;
  };

  const handleFormSubmit = async () => {
    try {
      validateForm();
    } catch (validationError) {
      handleError(validationError);
      return;
    }

    if (!navigator.onLine) {
      handleError(
        new Error("You are offline. Please check your connection."),
        "Network error",
      );
      return;
    }

    const payload = {
      container_number: formData.containerNo,
      container_size: formData.size,
      container_type: formData.type,
      owner_type: formData.ownership,
      derived_status: formData.derived_status,
      remarks: "Created/Updated via frontend",
      created_by: "system",
      location: formData.location,
      manufacture_date: formData.dateOfManufacture,
      purchase_date: formData.purchaseDate,
      purchase_price: parseFloat(formData.purchasePrice) || 0,
      purchase_from: formData.purchaseFrom,
      owned_by: formData.ownershipDetails,
      available_at: formData.availableAtDate,
      currency: formData.currency,
      hire_start_date: formData.hireStartDate,
      hire_end_date: formData.hireEndDate,
      hired_by: formData.vendor,
      return_date: formData.return_date,
      free_days: parseInt(formData.freeDays) || 0,
      place_of_loading: formData.placeOfLoading,
      place_of_destination: formData.placeOfDelivery,
    };

    setLoadingForm(true);
    setError(null);
    try {
      if (isEditing && editingContainer) {
        if (!editingContainer.cid)
          throw new Error("Invalid container ID for update");
        const response = await api.put(
          `/api/containers/${editingContainer.cid}`,
          payload,
        );
        if (response.status !== 200)
          throw new Error(`Unexpected response status: ${response.status}`);
        showToast("Container updated successfully", "success");
      } else {
        const response = await api.post("/api/containers", payload);
        if (response.status !== 201)
          throw new Error(`Unexpected response status: ${response.status}`);
        showToast("Container added successfully", "success");
      }
      setOpenAddModal(false);
      setIsEditing(false);
      setEditingContainer(null);
      setFormData({
        ownership: "soc",
        containerNo: "",
        size: "",
        type: "",
        derived_status: "",
        location: "karachi_port",
        dateAdded: new Date().toISOString().split("T")[0],
        dateOfManufacture: "",
        purchaseDate: "",
        purchasePrice: "",
        purchaseFrom: "",
        ownershipDetails: "Self-Owned",
        availableAtDate: new Date().toISOString().split("T")[0],
        currency: "USD",
        hireStartDate: "",
        hireEndDate: "",
        vendor: "",
        return_date: "",
        freeDays: "",
        placeOfLoading: "",
        placeOfDelivery: "",
      });
      await fetchContainers();
    } catch (error) {
      handleError(error, "Failed to save container");
    } finally {
      setLoadingForm(false);
    }
  };

  const markReturned = async (cid) => {
    if (!cid) {
      handleError(new Error("Invalid container ID"));
      return;
    }
    if (!navigator.onLine) {
      handleError(
        new Error("You are offline. Please check your connection."),
        "Network error",
      );
      return;
    }
    setLoadingReturned((prev) => ({ ...prev, [cid]: true }));
    setError(null);
    try {
      const payload = {
        derived_status: "Returned",
        remarks: "Marked as returned via frontend",
      };
      const response = await api.put(`/api/containers/${cid}`, payload);
      if (response.status !== 200)
        throw new Error(`Unexpected response status: ${response.status}`);
      await fetchContainers();
      showToast("Container marked as returned successfully", "success");
    } catch (error) {
      handleError(error, "Failed to mark as returned");
    } finally {
      setLoadingReturned((prev) => ({ ...prev, [cid]: false }));
    }
  };

  const loadImageAsBase64 = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
    });

  // ─────────────────────────────────────────────────────────────────────────────
  // FULL MANIFEST PDF — loops through every consignment in usageHistory
  // and renders one section (summary cards + category table + detail table)
  // per consignment, exactly like generateJobDetailManifestPDF does.
  // ─────────────────────────────────────────────────────────────────────────────

  const generateFullManifestPDF = async (allOrderIds, historyCid) => {
    if (!usageHistory || usageHistory.length === 0) {
      showToast("No history data available to print", "warning");
      return;
    }

    const consignmentGroups = usageHistory.filter(
      (c) => c.orders && Array.isArray(c.orders) && c.orders.length > 0,
    );

    if (consignmentGroups.length === 0) {
      showToast("No consignment data available to print", "warning");
      return;
    }

    setGeneratingPDF(true);
    try {
      const uniqueOrderIds = [
        ...new Set(
          consignmentGroups
            .flatMap((c) => c.orders || [])
            .map((e) => e.orderId)
            .filter(Boolean)
            .map((id) => id.toString()),
        ),
      ];

      const allOrdersMap = {};
      for (const orderId of uniqueOrderIds) {
        try {
          const response = await api.get(`/api/orders/${orderId}`, {
            params: { includeOrders: true },
          });
          if (response.data) allOrdersMap[orderId] = response.data;
        } catch (err) {
          console.error(`Error fetching order ${orderId}:`, err);
        }
      }

      let matchedContainerNumber = selectedContainerNo || "N/A";
      outer: for (const orderData of Object.values(allOrdersMap)) {
        for (const receiver of orderData.receivers || []) {
          for (const detail of receiver.shippingDetails || []) {
            for (const cd of detail.containerDetails || []) {
              if (cd.container?.cid === historyCid) {
                matchedContainerNumber = cd.container.container_number;
                break outer;
              }
            }
          }
        }
      }
      if (!matchedContainerNumber || matchedContainerNumber === "N/A") {
        for (const orderData of Object.values(allOrdersMap)) {
          const match = (orderData.assignmentHistory || []).find(
            (a) => a.cid === historyCid,
          );
          if (match) {
            matchedContainerNumber = match.container_number;
            break;
          }
        }
      }

      let containerSize = "N/A";
      try {
        const containerRes = await api.get(`/api/containers/${historyCid}`);
        containerSize = containerRes.data?.container_size || "N/A";
        if (!matchedContainerNumber || matchedContainerNumber === "N/A") {
          matchedContainerNumber = containerRes.data?.container_number || "N/A";
        }
      } catch (err) {
        console.error("Error fetching container details for size:", err);
      }

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const teal = [13, 108, 106];
      const orange = [245, 130, 32];
      const lightGrey = [245, 245, 245];
      const borderGrey = [210, 210, 210];

      // ── Helper: draw section sub-header (teal left-border accent style) ──────
      const drawSectionHeader = (text, y) => {
        doc.setFillColor(...teal);
        doc.rect(margin, y, 3, 5, "F");
        doc.setFont("helvetica", "bold").setFontSize(10);
        doc.setTextColor(...teal);
        doc.text(text, margin + 6, y + 4);
        return y + 9;
      };

      // ── Helper: draw a label-value row ────────────────────────────────────────
      const drawLabelValue = (label, value, x, y, labelWidth = 28) => {
        doc.setFont("helvetica", "bold").setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(label + ":", x, y);
        doc.setFont("helvetica", "normal").setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.text(String(value || "N/A"), x + labelWidth, y);
      };

      // ── Helper: thin full-width divider ───────────────────────────────────────
      const drawDivider = (y, color = borderGrey) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
      };

      // ── PAGE HEADER renderer (called once per consignment section) ────────────
      const renderPageHeader = async (
        doc,
        consignmentNo,
        pol,
        pod,
        totalContainers,
      ) => {
        const logoBase64 = await loadImageAsBase64("./logo-2.png");
        if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 5, 55, 12);

        // Right-side metadata block
        doc.setFont("helvetica", "bold").setFontSize(10);
        doc.setTextColor(...orange);
        doc.text(`Consignment: ${consignmentNo}`, pageWidth - margin, 8, {
          align: "right",
        });

        doc.setFont("helvetica", "normal").setFontSize(8);
        doc.setTextColor(60, 60, 60);
        const metaLines = [
          `Total Containers: ${totalContainers}`,
          `POL: ${pol}`,
          `POD: ${pod}`,
          `Generated: ${new Date().toLocaleString()}`,
        ];
        metaLines.forEach((line, i) => {
          doc.text(line, pageWidth - margin, 13 + i * 4, { align: "right" });
        });

        // Company name + title
        doc.setFont("helvetica", "bold").setFontSize(13);
        doc.setTextColor(...teal);
        doc.text("ROYAL GULF SHIPPING & LOGISTICS LLC", margin, 22);

        doc.setFont("helvetica", "normal").setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text("Dubai • London • Karachi • Shenzhen", margin, 26);

        // Bold manifest title
        doc.setFont("helvetica", "bold").setFontSize(14);
        doc.setTextColor(...teal);
        doc.text("CONSOLIDATION MANIFEST - CONTAINER LEVEL", margin, 33);

        // Teal divider under title
        doc.setDrawColor(...teal);
        doc.setLineWidth(0.6);
        doc.line(margin, 36, pageWidth - margin, 36);

        return 40; // y after header
      };

      // ── RENDER EACH CONSIGNMENT AS A FULL PAGE SECTION ───────────────────────
      let firstPage = true;

      for (let ci = 0; ci < consignmentGroups.length; ci++) {
        const consignment = consignmentGroups[ci];

        const consignmentOrderIds = [
          ...new Set(
            (consignment.orders || [])
              .map((e) => e.orderId?.toString())
              .filter(Boolean),
          ),
        ];

        const receiversData = [];
        consignmentOrderIds.forEach((oid) => {
          const orderData = allOrdersMap[oid];
          if (!orderData) return;
          (orderData.receivers || []).forEach((receiver) => {
            (receiver.shippingDetails || []).forEach((detail) => {
              receiversData.push({
                receiverName: receiver.receiver_name || "N/A",
                category: detail.category || "N/A",
                subcategory: detail.subcategory || "N/A",
                type: detail.type || "N/A",
                totalNumber: Number(detail.totalNumber || 0),
                weight: Number(detail.weight || 0),
                bookingRef: orderData.booking_ref || "N/A",
                rglBookingNumber: orderData.rgl_booking_number || "N/A",
                senderName: orderData.sender_name || "N/A",
                receiverCompany: receiver.receiver_name || "N/A",
                pod: detail.deliveryAddress || "N/A",
                pol: detail.pickupLocation || "N/A",
              });
            });
          });
        });

        const firstEvent = consignment.orders?.[0] || {};
        const cPol = getPlaceName(consignment.pol || firstEvent.pol);
        const cPod = getPlaceName(consignment.pod || firstEvent.pod);
        const cConsignmentNo =
          consignment.consignmentNo || `Consignment ${ci + 1}`;

        if (!firstPage) doc.addPage();
        firstPage = false;

        let y = await renderPageHeader(
          doc,
          cConsignmentNo,
          cPol,
          cPod,
          consignmentOrderIds.length,
        );

        y += 3;
        drawLabelValue(
          "Shipper",
          firstEvent.shipperName || "N/A",
          margin,
          y,
          22,
        );

        y += 6;

        drawLabelValue(
          "Consignee",
          firstEvent.consigneeName || "N/A",
          margin,
          y,
          22,
        );

        y += 8;
        drawDivider(y);
        y += 5;

        // ── Container block header ────────────────────────────────────────────
        doc.setFillColor(...teal);
        doc.setDrawColor(...teal);
        doc.setLineWidth(0.4);
        doc.rect(margin, y, pageWidth - 2 * margin, 7, "S");
        doc.setFont("helvetica", "bold").setFontSize(9);
        doc.setTextColor(...teal);
        doc.text(
          `CONTAINER ${ci + 1}: ${matchedContainerNumber} | SIZE: ${containerSize}`,
          margin + 3,
          y + 5,
        );
        y += 12;

        // ── CONTAINER SUMMARY table ───────────────────────────────────────────
        y = drawSectionHeader(
          `CONTAINER SUMMARY - ${matchedContainerNumber}`,
          y,
        );

        const totalPkgs = receiversData.reduce((s, r) => s + r.totalNumber, 0);
        const totalWt = receiversData.reduce((s, r) => s + r.weight, 0);

        doc.autoTable({
          head: [
            [
              "ORDERS IN CONTAINER",
              "TOTAL PACKAGES",
              "TOTAL WEIGHT (KGS)",
              "GROSS WEIGHT (APPROX.)",
            ],
          ],
          body: [
            [
              consignmentOrderIds.length.toString(),
              totalPkgs.toString(),
              totalWt.toFixed(2),
              (totalWt * 1.15).toFixed(2),
            ],
          ],
          startY: y,
          styles: {
            fontSize: 9,
            cellPadding: 3,
            halign: "center",
            lineWidth: 0.2,
            lineColor: borderGrey,
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [50, 50, 50],
            fontStyle: "bold",
            fontSize: 8,
            lineWidth: 0.2,
            lineColor: borderGrey,
          },
          bodyStyles: { fillColor: [255, 255, 255], textColor: [30, 30, 30] },
          margin: { left: margin, right: margin },
          tableLineColor: borderGrey,
          tableLineWidth: 0.2,
        });
        y = doc.lastAutoTable.finalY + 8;

        // ── COMMODITY SUMMARY table ───────────────────────────────────────────
        y = drawSectionHeader(
          `CONTAINER COMMODITY SUMMARY - ${matchedContainerNumber}`,
          y,
        );

        doc.setFont("helvetica", "italic").setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text("Commodity-wise breakdown for this container", margin, y + 1);
        y += 6;

        const catMap = {};
        receiversData.forEach((r) => {
          const key = r.category;
          if (!catMap[key])
            catMap[key] = {
              category: r.category,
              orders: new Set(),
              totalNumber: 0,
              weight: 0,
            };
          catMap[key].totalNumber += r.totalNumber;
          catMap[key].weight += r.weight;
          catMap[key].orders.add(r.bookingRef);
        });

        const catRows = Object.values(catMap).map((item) => [
          item.category,
          item.orders.size.toString(),
          item.totalNumber.toString(),
          item.weight.toFixed(2),
        ]);
        const catTotal = Object.values(catMap).reduce(
          (s, i) => ({ q: s.q + i.totalNumber, w: s.w + i.weight }),
          { q: 0, w: 0 },
        );
        catRows.push([
          {
            content: "TOTAL",
            styles: { fontStyle: "bold", textColor: [30, 30, 30] },
          },
          { content: "", styles: { fontStyle: "bold" } },
          { content: catTotal.q.toString(), styles: { fontStyle: "bold" } },
          { content: catTotal.w.toFixed(2), styles: { fontStyle: "bold" } },
        ]);

        doc.autoTable({
          head: [
            ["COMMODITY", "TOTAL ORDERS", "TOTAL PKGS", "TOTAL WEIGHT (KGS)"],
          ],
          body: catRows,
          startY: y,
          styles: {
            fontSize: 9,
            cellPadding: 3,
            lineWidth: 0.2,
            lineColor: borderGrey,
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [50, 50, 50],
            fontStyle: "bold",
            fontSize: 8,
            lineWidth: 0.2,
            lineColor: borderGrey,
          },
          bodyStyles: { fillColor: [255, 255, 255] },
          margin: { left: margin, right: margin },
          tableLineWidth: 0.2,
          tableLineColor: borderGrey,
          didParseCell(data) {
            if (
              data.section === "body" &&
              data.row.index === catRows.length - 1
            ) {
              data.cell.styles.fontStyle = "bold";
            }
          },
        });
        y = doc.lastAutoTable.finalY + 8;

        // ── DETAILED MANIFEST table ───────────────────────────────────────────
        y = drawSectionHeader(
          `DETAILED MANIFEST - ${matchedContainerNumber}`,
          y,
        );

        const detailRows = receiversData.map((r, i) => [
          (i + 1).toString(),
          r.bookingRef,
          r.senderName,
          r.receiverName,
          "N/A", // Marks & Nos
          r.totalNumber.toString(),
          r.weight.toFixed(2),
          r.category + (r.subcategory !== "N/A" ? ` - ${r.subcategory}` : ""),
        ]);

        // Totals row
        detailRows.push([
          {
            content: "TOTAL:",
            colSpan: 5,
            styles: { halign: "right", fontStyle: "bold" },
          },
          { content: totalPkgs.toString(), styles: { fontStyle: "bold" } },
          { content: totalWt.toFixed(2), styles: { fontStyle: "bold" } },
          { content: "", styles: {} },
        ]);

        doc.autoTable({
          head: [
            [
              "S.NO",
              "ORDER NO",
              "SENDER",
              "RECEIVER",
              "MARKS & NOS",
              "PKGS",
              "WEIGHT\n(KGS)",
              "COMMODITY",
            ],
          ],
          body: detailRows,
          startY: y,
          styles: {
            fontSize: 8,
            cellPadding: 2.5,
            overflow: "linebreak",
            valign: "top",
            lineWidth: 0.2,
            lineColor: borderGrey,
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [50, 50, 50],
            fontStyle: "bold",
            fontSize: 8,
            lineWidth: 0.2,
            lineColor: borderGrey,
          },
          bodyStyles: { fillColor: [255, 255, 255], textColor: [30, 30, 30] },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 26 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 20, halign: "center" },
            5: { cellWidth: 14, halign: "center" },
            6: { cellWidth: 18, halign: "center" },
            7: { cellWidth: 35 },
          },
          margin: { left: margin, right: margin },
          tableLineWidth: 0.2,
          tableLineColor: borderGrey,
          didParseCell(data) {
            if (data.section === "body" && data.row.index % 2 === 1) {
              data.cell.styles.fillColor = lightGrey;
            }
          },
        });

        y = doc.lastAutoTable.finalY + 10;

        // ── Per-page footer ───────────────────────────────────────────────────
        const totalPages = doc.internal.getNumberOfPages();
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          doc.setPage(pageNum);
          const footerY = 285;
          drawDivider(footerY - 3, teal);
          doc.setFont("helvetica", "normal").setFontSize(7.5);
          doc.setTextColor(120, 120, 120);
          doc.text(
            "Generated by Royal Gulf Shipping Management System",
            pageWidth / 2,
            footerY + 2,
            { align: "center" },
          );
          doc.text(
            `Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}`,
            pageWidth / 2,
            footerY + 6,
            { align: "center" },
          );
          doc.text(
            `Page ${pageNum} of ${totalPages}`,
            pageWidth - margin,
            footerY + 2,
            { align: "right" },
          );
        }
      }

      const fileName = `Container_Manifest_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      showToast(
        `Full manifest PDF generated for ${consignmentGroups.length} consignment(s)!`,
        "success",
      );
    } catch (error) {
      console.error("Error generating full manifest PDF:", error);
      showToast("Error generating PDF: " + error.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SINGLE JOB MANIFEST PDF (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────
  const generateSingleJobManifestPDF = async (
    jobEvents,
    containerNumber,
    jobNo,
    pol,
    pod,
    linkedOrders,
    consignmentDate, // ← new param
  ) => {
    console.log("Printing single job:", jobNo);

    if (!jobEvents || jobEvents.length === 0) {
      showToast("No data available for this job", "warning");
      return;
    }

    setGeneratingPDF(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const brandPrimary = [13, 108, 106];
      const brandLight = [220, 245, 243];
      let y = 30;

      const logoBase64 = await loadImageAsBase64("./logo-2.png");
      if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 4, 60, 12);

      doc.setFont("helvetica", "bold").setFontSize(16);
      doc.setTextColor(...brandPrimary);
      doc.text("CONTAINER MANIFEST", pageWidth - margin, 10, {
        align: "right",
      });

      doc.setFont("helvetica", "normal").setFontSize(12);
      doc.text(`Consignment: ${jobNo}`, pageWidth - margin, 18, {
        align: "right",
      });

      const firstEvent = jobEvents[0];
      const jobStartDate = jobEvents[jobEvents.length - 1]?.eventTime || "N/A";
      const jobEndDate = jobEvents[0]?.eventTime || "N/A";

      const cards = [
        ["Job Number", jobNo],
        ["Container Number", containerNumber || "N/A"],
        ["Place Of Loading", getPlaceName(pol) || "N/A"],
        ["Place Of Delivery", getPlaceName(pod) || "N/A"],
        ["Linked Orders", linkedOrders || "N/A"],
        ["Consignment Date", consignmentDate || "N/A"],
        [
          "Job Start Date",
          jobStartDate ? new Date(jobStartDate).toLocaleDateString() : "N/A",
        ],
        [
          "Job End Date",
          jobEndDate ? new Date(jobEndDate).toLocaleDateString() : "N/A",
        ],
        ["Total Events", jobEvents.length.toString()],
      ];

      const cardWidth = (pageWidth - margin * 2 - 12) / 2;
      const cardHeight = 16;

      cards.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + col * (cardWidth + 12);
        const cardY = y + row * (cardHeight + 3);

        doc.setDrawColor(220, 220, 220);
        doc.setFillColor(...brandLight);
        doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "FD");

        doc.setFillColor(...brandPrimary);
        doc.rect(x, cardY, cardWidth, 5, "F");
        doc.setFont("helvetica", "bold").setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(item[0], x + 3, cardY + 4);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const lines = doc.splitTextToSize(
          String(item[1] || "Not Found"),
          cardWidth - 6,
        );
        doc.text(lines, x + 3, cardY + 11);
      });

      y += (cards.length / 2) * (cardHeight + 3) + 10;

      if (jobEvents.length > 0) {
        const tableData = jobEvents.map((event, index) => [
          index + 1,
          event.eventTime ? new Date(event.eventTime).toLocaleString() : "N/A",
          event.eventType || "N/A",
          event.eventSummary || "N/A",
          event.changedBy || "System",
          event.orderId || "N/A",
          event.receiverId || "N/A",
        ]);

        doc.autoTable({
          head: [
            [
              "S.No",
              "Event Time",
              "Type",
              "Summary",
              "Changed By",
              "Order",
              "Receiver",
            ],
          ],
          body: tableData,
          startY: y,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak",
            valign: "top",
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: brandPrimary,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 30 },
            2: { cellWidth: 20 },
            3: { cellWidth: 40 },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 },
            6: { cellWidth: 20 },
          },
          margin: { left: margin, right: margin },
        });
      }

      const totalPages = doc.internal.getNumberOfPages();
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFont("helvetica", "normal").setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Container: ${containerNumber || "N/A"} | Job: ${jobNo} | Events: ${jobEvents.length}`,
          margin,
          footerY,
        );
        doc.text(
          `Page ${pageNum} of ${totalPages}`,
          pageWidth - margin,
          footerY,
          { align: "right" },
        );
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          footerY,
          { align: "center" },
        );
      }

      const fileName = `Container_${containerNumber}_Job_${jobNo}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      showToast(`PDF generated for Job ${jobNo}!`, "success");
    } catch (error) {
      console.error("Error generating single job PDF:", error);
      showToast("Error generating PDF: " + error.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // JOB DETAIL MANIFEST PDF — matches CONSOLIDATION MANIFEST design
  // ─────────────────────────────────────────────────────────────────────────────
  const generateJobDetailManifestPDF = async (
    jobNo,
    pol,
    pod,
    linkedOrders,
    jobEvents,
    consignmentNo,
    consignmentDate,
  ) => {
    if (!linkedOrders) {
      showToast("No linked orders found for this job", "warning");
      return;
    }

    const firstEvent = jobEvents?.[0] || {};

    const shipperName = firstEvent.shipperName || "N/A";
    const consigneeName = firstEvent.consigneeName || "N/A";

    setGeneratingPDF(true);
    try {
      let orderIdArray = [];
      if (typeof linkedOrders === "string") {
        orderIdArray = linkedOrders.split(",").map((id) => id.trim());
      } else if (Array.isArray(linkedOrders)) {
        orderIdArray = linkedOrders;
      }

      const cleanedOrderIds = orderIdArray.map((id) => {
        const strId = id.toString();
        return strId.includes("-")
          ? strId.split("-").slice(1).join("-")
          : strId;
      });

      if (cleanedOrderIds.length === 0) {
        showToast("No valid order IDs found for this job", "warning");
        return;
      }

      const allOrdersData = [];
      const allReceivers = [];

      for (const orderId of cleanedOrderIds) {
        try {
          const response = await api.get(`/api/orders/${orderId}`, {
            params: { includeOrders: true },
          });
          if (response.data) {
            allOrdersData.push({ orderId, data: response.data });
            (response.data.receivers || []).forEach((receiver) => {
              allReceivers.push({
                ...receiver,
                sourceOrderId: orderId,
                sourceOrderData: response.data,
              });
            });
          }
        } catch (error) {
          console.error(`Error fetching order ${orderId}:`, error);
        }
      }

      let matchedContainerNumber = "N/A";
      outer2: for (const receiver of allReceivers) {
        for (const item of receiver.shippingDetails || []) {
          for (const containerDetail of item.containerDetails || []) {
            if (containerDetail.container?.cid === historyCid) {
              matchedContainerNumber =
                containerDetail.container.container_number;
              break outer2;
            }
          }
        }
      }
      if (matchedContainerNumber === "N/A") {
        for (const order of allOrdersData) {
          const match = (order.data.assignmentHistory || []).find(
            (a) => a.cid === historyCid,
          );
          if (match) {
            matchedContainerNumber = match.container_number;
            break;
          }
        }
      }

      let containerSize = "N/A";
      try {
        const containerRes = await api.get(`/api/containers/${historyCid}`);
        containerSize = containerRes.data?.container_size || "N/A";
        if (matchedContainerNumber === "N/A") {
          matchedContainerNumber = containerRes.data?.container_number || "N/A";
        }
      } catch (err) {
        console.error("Error fetching container details for size:", err);
      }

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const teal = [13, 108, 106];
      const orange = [245, 130, 32];
      const lightGrey = [245, 245, 245];
      const borderGrey = [210, 210, 210];

      const drawSectionHeader = (text, y) => {
        doc.setFillColor(...teal);
        doc.rect(margin, y, 3, 5, "F");
        doc.setFont("helvetica", "bold").setFontSize(10);
        doc.setTextColor(...teal);
        doc.text(text, margin + 6, y + 4);
        return y + 9;
      };

      const drawLabelValue = (label, value, x, y, labelWidth = 28) => {
        doc.setFont("helvetica", "bold").setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(label + ":", x, y);
        doc.setFont("helvetica", "normal").setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.text(String(value || "N/A"), x + labelWidth, y);
      };

      const drawDivider = (y, color = borderGrey) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
      };

      // ── Page header ───────────────────────────────────────────────────────────
      const logoBase64 = await loadImageAsBase64("./logo-2.png");
      if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 5, 55, 12);

      const resolvedConsignmentNo = consignmentNo || jobNo;
      const polName = getPlaceName(pol);
      const podName = getPlaceName(pod);

      doc.setFont("helvetica", "bold").setFontSize(10);
      doc.setTextColor(...orange);
      doc.text(`Consignment: ${resolvedConsignmentNo}`, pageWidth - margin, 8, {
        align: "right",
      });

      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.setTextColor(60, 60, 60);
      [
        `Total Containers: 1`,
        `POL: ${polName}`,
        `POD: ${podName}`,
        `ETA: ${consignmentDate || "N/A"}`,
        `Generated: ${new Date().toLocaleString()}`,
      ].forEach((line, i) => {
        doc.text(line, pageWidth - margin, 13 + i * 4, { align: "right" });
      });

      doc.setFont("helvetica", "bold").setFontSize(13);
      doc.setTextColor(...teal);
      doc.text("ROYAL GULF SHIPPING & LOGISTICS LLC", margin, 22);

      doc.setFont("helvetica", "normal").setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text("Dubai • London • Karachi • Shenzhen", margin, 26);

      doc.setFont("helvetica", "bold").setFontSize(14);
      doc.setTextColor(...teal);
      doc.text("CONSOLIDATION MANIFEST - CONTAINER LEVEL", margin, 33);

      doc.setDrawColor(...teal);
      doc.setLineWidth(0.6);
      doc.line(margin, 36, pageWidth - margin, 36);

      let y = 42;

      // ── Shipper / Consignee ───────────────────────────────────────────────────
      drawLabelValue("Shipper", shipperName, margin, y, 22);

      y += 6;

      drawLabelValue("Consignee", consigneeName, margin, y, 22);
      y += 8;
      drawDivider(y);
      y += 5;

      // ── Per-consignment sections ──────────────────────────────────────────────
      const consignmentGroupsForJob = usageHistory.filter(
        (c) => c.orders && c.orders.length > 0 && c.consignmentNo === jobNo,
      );

      const groupsToRender =
        consignmentGroupsForJob.length > 0
          ? consignmentGroupsForJob
          : [{ consignmentNo: resolvedConsignmentNo, orders: jobEvents || [] }];

      for (let ci = 0; ci < groupsToRender.length; ci++) {
        const consignment = groupsToRender[ci];
        const consignmentOrderIds = [
          ...new Set(
            (consignment.orders || [])
              .map((e) => e.orderId?.toString())
              .filter(Boolean),
          ),
        ];

        const consignmentReceivers = allReceivers.filter(
          (r) =>
            consignmentOrderIds.length === 0 ||
            consignmentOrderIds.includes(r.sourceOrderId?.toString()),
        );

        const receiversData = [];
        consignmentReceivers.forEach((receiver) => {
          (receiver.shippingDetails || []).forEach((detail) => {
            const orderData = receiver.sourceOrderData || {};
            receiversData.push({
              receiverName: receiver.receiver_name || "N/A",
              category: detail.category || "N/A",
              subcategory: detail.subcategory || "N/A",
              type: detail.type || "N/A",
              totalNumber: Number(detail.totalNumber || 0),
              weight: Number(detail.weight || 0),
              bookingRef: orderData.booking_ref || "N/A",
              rglBookingNumber: orderData.rgl_booking_number || "N/A",
              senderName: orderData.sender_name || "N/A",
            });
          });
        });

        // Fallback if no receivers: use job events rows
        const hasData = receiversData.length > 0;

        if (y > 220) {
          doc.addPage();
          y = 20;
        }

        // Container block header
        doc.setDrawColor(...teal);
        doc.setLineWidth(0.4);
        doc.rect(margin, y, pageWidth - 2 * margin, 7, "S");
        doc.setFont("helvetica", "bold").setFontSize(9);
        doc.setTextColor(...teal);
        doc.text(
          `CONTAINER ${ci + 1}: ${matchedContainerNumber} | SIZE: ${containerSize}`,
          margin + 3,
          y + 5,
        );
        y += 12;

        if (hasData) {
          const totalPkgs = receiversData.reduce(
            (s, r) => s + r.totalNumber,
            0,
          );
          const totalWt = receiversData.reduce((s, r) => s + r.weight, 0);

          // CONTAINER SUMMARY
          y = drawSectionHeader(
            `CONTAINER SUMMARY - ${matchedContainerNumber}`,
            y,
          );
          doc.autoTable({
            head: [
              [
                "ORDERS IN CONTAINER",
                "TOTAL PACKAGES",
                "TOTAL WEIGHT (KGS)",
                "GROSS WEIGHT (APPROX.)",
              ],
            ],
            body: [
              [
                (consignmentOrderIds.length || allOrdersData.length).toString(),
                totalPkgs.toString(),
                totalWt.toFixed(2),
                (totalWt * 1.15).toFixed(2),
              ],
            ],
            startY: y,
            styles: {
              fontSize: 9,
              cellPadding: 3,
              halign: "center",
              lineWidth: 0.2,
              lineColor: borderGrey,
            },
            headStyles: {
              fillColor: [255, 255, 255],
              textColor: [50, 50, 50],
              fontStyle: "bold",
              fontSize: 8,
              lineWidth: 0.2,
              lineColor: borderGrey,
            },
            bodyStyles: { fillColor: [255, 255, 255] },
            margin: { left: margin, right: margin },
            tableLineWidth: 0.2,
            tableLineColor: borderGrey,
          });
          y = doc.lastAutoTable.finalY + 8;

          // COMMODITY SUMMARY
          y = drawSectionHeader(
            `CONTAINER COMMODITY SUMMARY - ${matchedContainerNumber}`,
            y,
          );
          doc.setFont("helvetica", "italic").setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(
            "Commodity-wise breakdown for this container",
            margin,
            y + 1,
          );
          y += 6;

          const catMap = {};
          receiversData.forEach((r) => {
            const key = r.category;
            if (!catMap[key])
              catMap[key] = {
                category: r.category,
                orders: new Set(),
                totalNumber: 0,
                weight: 0,
              };
            catMap[key].totalNumber += r.totalNumber;
            catMap[key].weight += r.weight;
            catMap[key].orders.add(r.bookingRef);
          });

          const catRows = Object.values(catMap).map((item) => [
            item.category,
            item.orders.size.toString(),
            item.totalNumber.toString(),
            item.weight.toFixed(2),
          ]);
          const catTotal = Object.values(catMap).reduce(
            (s, i) => ({ q: s.q + i.totalNumber, w: s.w + i.weight }),
            { q: 0, w: 0 },
          );
          catRows.push([
            { content: "TOTAL", styles: { fontStyle: "bold" } },
            { content: "", styles: {} },
            { content: catTotal.q.toString(), styles: { fontStyle: "bold" } },
            { content: catTotal.w.toFixed(2), styles: { fontStyle: "bold" } },
          ]);

          doc.autoTable({
            head: [
              ["COMMODITY", "TOTAL ORDERS", "TOTAL PKGS", "TOTAL WEIGHT (KGS)"],
            ],
            body: catRows,
            startY: y,
            styles: {
              fontSize: 9,
              cellPadding: 3,
              lineWidth: 0.2,
              lineColor: borderGrey,
            },
            headStyles: {
              fillColor: [255, 255, 255],
              textColor: [50, 50, 50],
              fontStyle: "bold",
              fontSize: 8,
              lineWidth: 0.2,
              lineColor: borderGrey,
            },
            bodyStyles: { fillColor: [255, 255, 255] },
            margin: { left: margin, right: margin },
            tableLineWidth: 0.2,
            tableLineColor: borderGrey,
          });
          y = doc.lastAutoTable.finalY + 8;

          // DETAILED MANIFEST
          y = drawSectionHeader(
            `DETAILED MANIFEST - ${matchedContainerNumber}`,
            y,
          );
          const detailRows = receiversData.map((r, i) => [
            (i + 1).toString(),
            r.bookingRef,
            r.senderName,
            r.receiverName,
            "N/A",
            r.totalNumber.toString(),
            r.weight.toFixed(2),
            r.category + (r.subcategory !== "N/A" ? ` - ${r.subcategory}` : ""),
          ]);
          detailRows.push([
            {
              content: "TOTAL:",
              colSpan: 5,
              styles: { halign: "right", fontStyle: "bold" },
            },
            { content: totalPkgs.toString(), styles: { fontStyle: "bold" } },
            { content: totalWt.toFixed(2), styles: { fontStyle: "bold" } },
            { content: "" },
          ]);

          doc.autoTable({
            head: [
              [
                "S.NO",
                "ORDER NO",
                "SENDER",
                "RECEIVER",
                "MARKS & NOS",
                "PKGS",
                "WEIGHT\n(KGS)",
                "COMMODITY",
              ],
            ],
            body: detailRows,
            startY: y,
            styles: {
              fontSize: 8,
              cellPadding: 2.5,
              overflow: "linebreak",
              valign: "top",
              lineWidth: 0.2,
              lineColor: borderGrey,
            },
            headStyles: {
              fillColor: [255, 255, 255],
              textColor: [50, 50, 50],
              fontStyle: "bold",
              fontSize: 8,
              lineWidth: 0.2,
              lineColor: borderGrey,
            },
            bodyStyles: { fillColor: [255, 255, 255], textColor: [30, 30, 30] },
            columnStyles: {
              0: { cellWidth: 10, halign: "center" },
              1: { cellWidth: 26 },
              2: { cellWidth: 30 },
              3: { cellWidth: 30 },
              4: { cellWidth: 20, halign: "center" },
              5: { cellWidth: 14, halign: "center" },
              6: { cellWidth: 18, halign: "center" },
              7: { cellWidth: 35 },
            },
            margin: { left: margin, right: margin },
            tableLineWidth: 0.2,
            tableLineColor: borderGrey,
            didParseCell(data) {
              if (data.section === "body" && data.row.index % 2 === 1) {
                data.cell.styles.fillColor = lightGrey;
              }
            },
          });
          y = doc.lastAutoTable.finalY + 10;
        } else {
          doc.setFont("helvetica", "italic").setFontSize(9);
          doc.setTextColor(150, 0, 0);
          doc.text(
            "No receiver details found for this consignment.",
            margin,
            y,
          );
          y += 10;
        }
      }

      // ── Footers ───────────────────────────────────────────────────────────────
      const totalPages = doc.internal.getNumberOfPages();
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        const footerY = 285;
        doc.setDrawColor(...teal);
        doc.setLineWidth(0.3);
        doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
        doc.setFont("helvetica", "normal").setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text(
          "Generated by Royal Gulf Shipping Management System",
          pageWidth / 2,
          footerY + 2,
          { align: "center" },
        );
        doc.text(
          `Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}`,
          pageWidth / 2,
          footerY + 6,
          { align: "center" },
        );
        doc.text(
          `Page ${pageNum} of ${totalPages}`,
          pageWidth - margin,
          footerY + 2,
          { align: "right" },
        );
      }

      const fileName = `Job_${jobNo}_Manifest_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      showToast(`Job ${jobNo} manifest generated!`, "success");
    } catch (error) {
      console.error("Error generating job manifest PDF:", error);
      showToast("Error generating PDF: " + error.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STATUS HISTORY PDF (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────
  const generateStatusHistoryPDF = async (containerNumber) => {
    if (!historyCid) {
      showToast("Container ID not found", "error");
      return;
    }

    setGeneratingPDF(true);
    try {
      const response = await api.get(
        `/api/containers/${historyCid}/usage-history`,
      );

      if (!response.data || !response.data.containerStatusHistory) {
        throw new Error("No status history data available");
      }

      const statusHistory = response.data.containerStatusHistory.events;
      const totalRecords = response.data.containerStatusHistory.totalRecords;

      if (!statusHistory || statusHistory.length === 0) {
        throw new Error("No status history records found");
      }

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const brandPrimary = [13, 108, 106];
      const brandLight = [220, 245, 243];
      let y = 30;

      const logoBase64 = await loadImageAsBase64("./logo-2.png");
      if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 4, 60, 12);

      doc.setFont("helvetica", "bold").setFontSize(16);
      doc.setTextColor(...brandPrimary);
      doc.text("CONTAINER STATUS HISTORY REPORT", pageWidth - margin, 10, {
        align: "right",
      });

      doc.setFont("helvetica", "normal").setFontSize(12);
      doc.text(`Container: ${containerNumber}`, pageWidth - margin, 18, {
        align: "right",
      });

      const sortedStatusHistory = [...statusHistory].sort(
        (a, b) => new Date(b.createdTime) - new Date(a.createdTime),
      );

      const firstStatus = sortedStatusHistory[sortedStatusHistory.length - 1];
      const latestStatus = sortedStatusHistory[0];
      const uniqueStatuses = [...new Set(statusHistory.map((s) => s.status))];
      const uniqueLocations = [
        ...new Set(statusHistory.map((s) => s.location)),
      ].filter(Boolean);

      const summaryCards = [
        ["Container Number", containerNumber],
        ["Total Status Changes", totalRecords.toString()],
        [
          "First Status Date",
          firstStatus?.createdTime
            ? new Date(firstStatus.createdTime).toLocaleDateString()
            : "N/A",
        ],
        [
          "Latest Status Date",
          latestStatus?.createdTime
            ? new Date(latestStatus.createdTime).toLocaleDateString()
            : "N/A",
        ],
        ["Status Types", uniqueStatuses.length.toString()],
        ["Locations Used", uniqueLocations.length.toString()],
      ];

      const cardWidth = (pageWidth - margin * 2 - 12) / 2;
      const cardHeight = 16;

      summaryCards.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + col * (cardWidth + 12);
        const cardY = y + row * (cardHeight + 3);

        doc.setDrawColor(220, 220, 220);
        doc.setFillColor(...brandLight);
        doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "FD");

        doc.setFillColor(...brandPrimary);
        doc.rect(x, cardY, cardWidth, 5, "F");
        doc.setFont("helvetica", "bold").setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(item[0], x + 3, cardY + 4);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const lines = doc.splitTextToSize(
          String(item[1] || "N/A"),
          cardWidth - 6,
        );
        doc.text(lines, x + 3, cardY + 11);
      });

      y += (summaryCards.length / 2) * (cardHeight + 3) + 5;

      if (statusHistory.length > 0) {
        doc.setFont("helvetica", "bold").setFontSize(12);
        doc.setTextColor(...brandPrimary);
        doc.text("STATUS CHANGE TIMELINE", margin, y);
        y += 10;

        const timelineStartY = y;
        const timelineWidth = pageWidth - 2 * margin - 30;
        const maxEventsPerRow = 7;
        const chronologicalEvents = [...statusHistory].sort(
          (a, b) => new Date(a.createdTime) - new Date(b.createdTime),
        );
        const rows = Math.ceil(chronologicalEvents.length / maxEventsPerRow);
        const rowHeight = 25;

        for (let row = 0; row < rows; row++) {
          const startIdx = row * maxEventsPerRow;
          const endIdx = Math.min(
            startIdx + maxEventsPerRow,
            chronologicalEvents.length,
          );
          const rowEvents = chronologicalEvents.slice(startIdx, endIdx);

          doc.setDrawColor(...brandPrimary);
          doc.setLineWidth(0.5);
          const rowY = timelineStartY + row * rowHeight;
          doc.line(margin + 15, rowY, margin + 15 + timelineWidth, rowY);

          rowEvents.forEach((event, idx) => {
            const totalEventsInRow = rowEvents.length;
            const eventDate = new Date(event.createdTime);
            const xPos =
              margin + 15 + timelineWidth * (idx / (totalEventsInRow - 1 || 1));

            doc.setFillColor(...brandPrimary);
            doc.circle(xPos, rowY, 2.5, "F");

            doc.setFont("helvetica", "bold").setFontSize(8);
            doc.setTextColor(...brandPrimary);
            const status = event.status || "Unknown";
            const statusWidth = doc.getTextWidth(status);
            doc.text(status, xPos - statusWidth / 2, rowY - 5);

            doc.setFont("helvetica", "normal").setFontSize(7);
            doc.setTextColor(100, 100, 100);
            const dateStr = eventDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            });
            const dateWidth = doc.getTextWidth(dateStr);
            doc.text(dateStr, xPos - dateWidth / 2, rowY + 7);

            doc.setFontSize(6);
            const timeStr = eventDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const timeWidth = doc.getTextWidth(timeStr);
            doc.text(timeStr, xPos - timeWidth / 2, rowY + 11);
          });
        }

        y = timelineStartY + rows * rowHeight;
      }

      if (statusHistory.length > 0) {
        doc.setFont("helvetica", "bold").setFontSize(12);
        doc.setTextColor(...brandPrimary);
        doc.text("DETAILED STATUS HISTORY", margin, y);
        y += 5;

        const tableData = statusHistory.map((event, index) => {
          const eventDate = new Date(event.createdTime);
          return [
            index + 1,
            eventDate.toLocaleDateString(),
            eventDate.toLocaleTimeString(),
            event.status || "N/A",
            event.location || "N/A",
            event.createdBy || "System",
            event.notes || "No notes",
          ];
        });

        doc.autoTable({
          head: [
            [
              "S.No",
              "Date",
              "Time",
              "Status",
              "Location",
              "Changed By",
              "Notes",
            ],
          ],
          body: tableData,
          startY: y,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak",
            valign: "top",
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: brandPrimary,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
          },
          columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 25, fontStyle: "bold" },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 },
            6: { cellWidth: pageWidth - 2 * margin - 127 },
          },
          margin: { left: margin, right: margin },
          didParseCell(data) {
            if (data.section === "body") {
              data.cell.styles.fillColor =
                data.row.index % 2 === 0 ? [245, 245, 245] : [255, 255, 255];
            }
          },
        });
      }

      const totalPages = doc.internal.getNumberOfPages();
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFont("helvetica", "normal").setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Container: ${containerNumber} | Status Changes: ${totalRecords}`,
          margin,
          footerY,
        );
        doc.text(
          `Page ${pageNum} of ${totalPages}`,
          pageWidth - margin,
          footerY,
          { align: "right" },
        );
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          footerY,
          { align: "center" },
        );
      }

      const fileName = `Container_${containerNumber}_Status_History_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      showToast(
        `Status history PDF generated for ${containerNumber}! (${totalRecords} records)`,
        "success",
      );
    } catch (error) {
      console.error("Error generating status history PDF:", error);
      showToast("Error generating PDF: " + error.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        bgcolor: "#f5f5f5",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          maxWidth: 1450,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "#f58220" }}
          >
            Container Master
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={() => {
              setIsEditing(false);
              setEditingContainer(null);
              setOpenAddModal(true);
            }}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 5,
              py: 1,
              fontSize: "1rem",
              background: "#0d6c6a",
              color: "#fff",
            }}
          >
            Add Containers
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* Filters */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "nowrap",
            justifyContent: "space-between",
            mb: 2,
            gap: 1,
          }}
        >
          <Box sx={{ minWidth: 150 }}>
            <TextField
              label="Container No."
              name="container_number"
              value={filters.container_number || ""}
              onChange={handleFilterChange}
              size="small"
              fullWidth
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
                  transition: "all 0.3s ease",
                  backgroundColor: "#fff",
                  "& fieldset": { borderColor: "#ddd" },
                  "&:hover fieldset": { borderColor: "primary.main" },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                    boxShadow: "0 0 8px rgba(25, 118, 210, 0.3)",
                  },
                },
                "& .MuiInputLabel-root": {
                  letterSpacing: 0.5,
                  textTransform: "capitalize",
                  color: "rgba(180, 174, 174, 1)",
                },
              }}
            />
          </Box>
        </Box>

        {/* Table */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <TableContainer
            component={Paper}
            sx={{ flex: 1, overflow: "auto", boxShadow: 3, borderRadius: 2 }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {[
                    "Container No.",
                    "Size",
                    "Type",
                    "Ownership",
                    "Status",
                    "Location",
                    "Consignment",
                    "Last Used",
                    "Actions",
                  ].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        bgcolor: "#0d6c6a",
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingContainers ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        Loading containers...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                      sx={{ py: 4, color: "error.main" }}
                    >
                      <Typography variant="body2">{error}</Typography>
                      <Button onClick={fetchContainers} sx={{ mt: 1 }}>
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : containers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2">
                        No containers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  containers.map((container, index) => {
                    const isEditingRow = editingId === container.cid;
                    const currentStatus = isEditingRow
                      ? tempData.status
                      : container.derived_status || "N/A";
                    const currentLocation = isEditingRow
                      ? tempData.location
                      : container.location || "N/A";
                    const statusColor =
                      statuses.find((s) => s.value === currentStatus)?.color ||
                      "default";

                    return (
                      <TableRow
                        key={container.cid || index}
                        sx={{
                          bgcolor: index % 2 === 0 ? "#f9f9f9" : "white",
                          "&:hover": { bgcolor: "#e3f2fd" },
                        }}
                      >
                        <TableCell
                          sx={{
                            cursor: "pointer",
                            color: "#0d6c6a",
                            "&:hover": { textDecoration: "underline" },
                          }}
                          onClick={() => openHistory(container.cid)}
                        >
                          {container.container_number || "N/A"}
                        </TableCell>
                        <TableCell>
                          {container.container_size || "N/A"}
                        </TableCell>
                        <TableCell>
                          {container.container_type || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              container.owner_type === "soc" ? "Own" : "Hired"
                            }
                            color={
                              container.owner_type === "soc"
                                ? "success"
                                : "info"
                            }
                            size="small"
                            sx={{ fontWeight: "bold" }}
                          />
                        </TableCell>
                        <TableCell>
                          {isEditingRow ? (
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={currentStatus}
                                onChange={(e) =>
                                  setTempData({
                                    ...tempData,
                                    status: e.target.value,
                                  })
                                }
                                displayEmpty
                              >
                                {statuses.map((status) => (
                                  <MenuItem
                                    key={status.value}
                                    value={status.value}
                                  >
                                    {status.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Chip
                              label={currentStatus}
                              color={statusColor}
                              size="small"
                              sx={{ fontWeight: "bold" }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditingRow ? (
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                              <Select
                                value={currentLocation}
                                onChange={(e) =>
                                  setTempData({
                                    ...tempData,
                                    location: e.target.value,
                                  })
                                }
                              >
                                <MenuItem value="karachi_port">
                                  Karachi Port
                                </MenuItem>
                                <MenuItem value="dubai_port">
                                  Dubai Port
                                </MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            currentLocation
                          )}
                        </TableCell>
                        <TableCell>
                          {container.consignment_number || "N/A"}
                        </TableCell>
                        <TableCell>
                          {container.created_time
                            ? new Date(
                                container.created_time,
                              ).toLocaleDateString()
                            : "–"}
                        </TableCell>
                        <TableCell>
                          {isEditingRow ? (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Tooltip title="Save">
                                <IconButton
                                  onClick={() => handleQuickSave(container.cid)}
                                  disabled={loadingUpdate}
                                  size="small"
                                >
                                  {loadingUpdate ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <SaveIcon />
                                  )}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancel">
                                <IconButton
                                  onClick={handleQuickCancel}
                                  size="small"
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <>
                              <Tooltip title="Quick Update Status & Location">
                                <IconButton
                                  onClick={() => handleQuickEdit(container)}
                                  sx={{ color: "#0d6c6a" }}
                                  size="small"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Container Details">
                                <IconButton
                                  onClick={() => handleEdit(container)}
                                  sx={{ color: "#f58220" }}
                                  size="small"
                                >
                                  <EditNoteIcon fontSize="large" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View History">
                                <IconButton
                                  onClick={() => openHistory(container.cid)}
                                  sx={{ color: "#0d6c6a" }}
                                  disabled={loadingHistory}
                                >
                                  {loadingHistory ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <HistoryIcon />
                                  )}
                                </IconButton>
                              </Tooltip>
                              <Tooltip
                                title={
                                  container.derived_status !== "Cleared"
                                    ? "Container must be Cleared to mark Returned"
                                    : "Mark as Returned"
                                }
                              >
                                <span>
                                  <Button
                                    disabled={
                                      container.derived_status !== "Cleared" ||
                                      loadingReturned[container.cid]
                                    }
                                    onClick={() => markReturned(container.cid)}
                                    size="small"
                                    startIcon={
                                      loadingReturned[container.cid] ? (
                                        <CircularProgress size={16} />
                                      ) : null
                                    }
                                    sx={{
                                      textTransform: "none",
                                      color: "#0d6c6a",
                                    }}
                                  >
                                    Mark Returned
                                  </Button>
                                </span>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!loadingContainers && totalCount > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={currentPage - 1}
              onPageChange={(event, newPage) => setCurrentPage(newPage + 1)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setCurrentPage(1);
              }}
              sx={{ flexShrink: 0, mt: 1 }}
            />
          )}
        </Box>

        {/* Add / Edit Container Modal */}
        <Modal
          open={openAddModal}
          onClose={() => {
            setOpenAddModal(false);
            setIsEditing(false);
            setEditingContainer(null);
          }}
        >
          <Box sx={{ ...modalStyle, width: { xs: "90%", sm: 1100 } }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: "bold", color: "#0d6c6a", mb: 1 }}
            >
              {isEditing ? "Edit Container" : "Add New Container"}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <FormControl component="fieldset" sx={{ mb: 1 }}>
              <RadioGroup
                row
                name="ownership"
                value={formData.ownership || "soc"}
                onChange={handleFormChange}
              >
                {ownershipTypes
                  .slice()
                  .reverse()
                  .map((own) => (
                    <FormControlLabel
                      key={own.value}
                      value={own.value}
                      control={<Radio />}
                      label={own.label}
                    />
                  ))}
              </RadioGroup>
            </FormControl>
            <Box sx={{ display: "flex" }}>
              <Box sx={{ flex: 1, mx: 0.5 }}>
                <TextField
                  label="Container Number"
                  name="containerNo"
                  value={formData.containerNo || ""}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  helperText="Format: 4 letters + 7 digits (e.g., RGSLU1234567)"
                  variant="outlined"
                  disabled={isEditing}
                  sx={{ bgcolor: "white", mb: 1 }}
                />
              </Box>
              <Box sx={{ flex: 1, mx: 0.5 }}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ bgcolor: "white" }}
                >
                  <InputLabel>Derived Status</InputLabel>
                  <Select
                    name="derived_status"
                    label="Derived Status"
                    value={formData.derived_status || ""}
                    onChange={handleFormChange}
                  >
                    {statuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box sx={{ display: "flex", mb: 1 }}>
              <Box sx={{ flex: 1, mx: 0.5 }}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ bgcolor: "white" }}
                >
                  <InputLabel>Size</InputLabel>
                  <Select
                    name="size"
                    label="Size"
                    value={formData.size || ""}
                    onChange={handleFormChange}
                    disabled={isEditing}
                  >
                    {sizes.map((size) => (
                      <MenuItem key={size.value} value={size.value}>
                        {size.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1, mx: 0.5 }}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ bgcolor: "white" }}
                >
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    label="Type"
                    value={formData.type || ""}
                    onChange={handleFormChange}
                    disabled={isEditing}
                  >
                    {types.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box sx={{ mb: 1 }}>
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ bgcolor: "white" }}
              >
                <InputLabel>Location</InputLabel>
                <Select
                  name="location"
                  label="Location"
                  value={formData.location || "karachi_port"}
                  onChange={handleFormChange}
                >
                  <MenuItem value="karachi_port">Karachi Port</MenuItem>
                  <MenuItem value="dubai_port">Dubai Port</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {formData.ownership === "soc" && (
              <>
                <Box sx={{ mb: 1 }}>
                  <TextField
                    label="Date of Manufacture"
                    name="dateOfManufacture"
                    type="date"
                    value={formData.dateOfManufacture || ""}
                    onChange={handleFormChange}
                    fullWidth
                    required
                    variant="outlined"
                    sx={{ bgcolor: "white" }}
                  />
                </Box>
                <Box sx={{ display: "flex", mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Purchase Date"
                      name="purchaseDate"
                      type="date"
                      value={formData.purchaseDate || ""}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "row",
                      mx: 0.5,
                    }}
                  >
                    <TextField
                      label="Purchase Price"
                      name="purchasePrice"
                      type="number"
                      value={formData.purchasePrice || ""}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: "white", marginRight: 2 }}
                    />
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ bgcolor: "white", width: 100 }}
                    >
                      <InputLabel>Currency</InputLabel>
                      <Select
                        name="currency"
                        label="Currency"
                        value={formData.currency || "USD"}
                        onChange={handleFormChange}
                      >
                        {["USD", "EUR", "GBP", "AED", "PKR", "SAR", "INR"].map(
                          (curr) => (
                            <MenuItem key={curr} value={curr}>
                              {curr}
                            </MenuItem>
                          ),
                        )}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Purchase From"
                      name="purchaseFrom"
                      type="text"
                      value={formData.purchaseFrom || ""}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Owned By"
                      name="ownershipDetails"
                      value={formData.ownershipDetails || ""}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <TextField
                    label="Available At Date"
                    name="availableAtDate"
                    type="date"
                    value={formData.availableAtDate || ""}
                    onChange={handleFormChange}
                    fullWidth
                    required
                    variant="outlined"
                    sx={{ bgcolor: "white" }}
                  />
                </Box>
              </>
            )}

            {formData.ownership === "coc" && (
              <>
                <Box sx={{ display: "flex", mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Hire Start Date"
                      name="hireStartDate"
                      type="date"
                      value={formData.hireStartDate || ""}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Hire End Date"
                      name="hireEndDate"
                      type="date"
                      value={formData.hireEndDate || ""}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: "flex", mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Return Date"
                      name="return_date"
                      type="date"
                      value={formData.return_date || ""}
                      onChange={handleFormChange}
                      fullWidth
                      variant="outlined"
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Vendor"
                      name="vendor"
                      value={formData.vendor || ""}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: "flex", mb: 1 }}>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Place of Loading"
                      name="placeOfLoading"
                      value={formData.placeOfLoading || ""}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Place of Delivery"
                      name="placeOfDelivery"
                      value={formData.placeOfDelivery || ""}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, mx: 0.5 }}>
                    <TextField
                      label="Free Days"
                      name="freeDays"
                      type="number"
                      value={formData.freeDays || ""}
                      onChange={handleFormChange}
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>
                </Box>
              </>
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
                mt: 1,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => {
                  setOpenAddModal(false);
                  setIsEditing(false);
                  setEditingContainer(null);
                }}
                disabled={loadingForm}
                sx={{
                  textTransform: "none",
                  borderColor: "#0d6c6a",
                  color: "#0d6c6a",
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleFormSubmit}
                disabled={loadingForm}
                startIcon={loadingForm ? <CircularProgress size={20} /> : null}
                sx={{
                  color: "#fff",
                  textTransform: "none",
                  bgcolor: "#f58220",
                  "&:hover": { bgcolor: "#1b5e20" },
                }}
              >
                {isEditing ? "Update" : "Save"}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Usage History Modal */}
        <Modal
          open={openHistoryModal}
          onClose={() => setOpenHistoryModal(false)}
        >
          <Box
            sx={{
              ...modalStyle,
              width: { xs: "90%", sm: 1400 },
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
                mb: 2,
              }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "#0d6c6a",
                  mb: { xs: 1, sm: 2 },
                }}
              >
                Usage History for Container {selectedContainerNo || "N/A"}
              </Typography>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Tooltip title="Print Status Change History">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() =>
                      generateStatusHistoryPDF(selectedContainerNo)
                    }
                    disabled={generatingPDF || usageHistory.length === 0}
                    sx={{
                      borderRadius: 2,
                      borderColor: "#0d6c6a",
                      color: "#0d6c6a",
                      "&:hover": { backgroundColor: "rgba(13, 108, 106, 0.1)" },
                    }}
                  >
                    {generatingPDF ? "Generating..." : "Print Status History"}
                  </Button>
                </Tooltip>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    // Pass all order IDs — generateFullManifestPDF now uses usageHistory directly
                    const allOrderIds = usageHistory
                      .flatMap((c) => c.orders || [])
                      .map((e) => e.orderId)
                      .filter(Boolean);
                    generateFullManifestPDF(
                      [...new Set(allOrderIds)],
                      historyCid,
                    );
                  }}
                  disabled={generatingPDF || usageHistory.length === 0}
                  sx={{
                    borderRadius: 2,
                    borderColor: "#f58220",
                    color: "#f58220",
                    "&:hover": { backgroundColor: "rgba(245, 130, 32, 0.1)" },
                  }}
                >
                  {generatingPDF ? "Generating..." : "Print Full Manifest"}
                </Button>
              </Box>
            </Box>
            <>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                  value={activeHistoryTab}
                  onChange={(_, v) => setActiveHistoryTab(v)}
                  textColor="inherit"
                  TabIndicatorProps={{ style: { backgroundColor: "#0d6c6a" } }}
                >
                  <Tab
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        Consignment History
                        {usageHistory.length > 0 && (
                          <Chip
                            label={
                              usageHistory.filter((c) => c.orders?.length > 0)
                                .length
                            }
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 11,
                              bgcolor: "#e6f4f3",
                              color: "#0d6c6a",
                            }}
                          />
                        )}
                      </Box>
                    }
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  />
                  <Tab
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        Unassigned Orders
                        {unassignedOrders.length > 0 && (
                          <Chip
                            label={unassignedOrders.length}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 11,
                              bgcolor: "#fff3e0",
                              color: "#e65100",
                            }}
                          />
                        )}
                      </Box>
                    }
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  />
                </Tabs>
              </Box>

              {activeHistoryTab === 0 && (
                <>
                  {loadingHistory ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 4 }}
                    >
                      <CircularProgress />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        Loading history...
                      </Typography>
                    </Box>
                  ) : !Array.isArray(usageHistory) ||
                    usageHistory.length === 0 ? (
                    <Typography
                      variant="body2"
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      No assignment history available
                    </Typography>
                  ) : (
                    usageHistory
                      .filter((consignment) => {
                        if (!consignment?.orders?.length) return false;
                        const netQty = consignment.orders.reduce(
                          (sum, o) => sum + (o.assignedQty || 0),
                          0,
                        );
                        return netQty > 0;
                      })
                      .map((consignment, groupIndex) => {
                        const filteredGroup = consignment.orders || [];
                        if (filteredGroup.length === 0) return null;

                        const firstEvent = filteredGroup[0];
                        const jobNo =
                          consignment.consignmentNo ||
                          firstEvent?.bookingRef ||
                          `Consignment ${groupIndex + 1}`;
                        const pol = firstEvent.pol || "N/A";
                        const pod = firstEvent.pod || "N/A";
                        const linkedOrders = firstEvent.linkedOrders || "N/A";
                        const shipperName = firstEvent.shipperName || "N/A";
                        const consigneeName = firstEvent.consigneeName || "N/A";

                        const sortedEvents = [...consignment.orders].sort(
                          (a, b) =>
                            new Date(b.eventTime) - new Date(a.eventTime),
                        );
                        const earliestEvent =
                          sortedEvents[sortedEvents.length - 1] || {};

                        return (
                          <Box
                            key={jobNo || `group-${groupIndex}`}
                            sx={{
                              mb: 2,
                              border: "0.5px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                              overflow: "hidden",
                              bgcolor: "background.paper",
                            }}
                          >
                            {/* Trip Header */}
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
                                sx={{
                                  color: "text.secondary",
                                  minWidth: 20,
                                  fontWeight: 500,
                                }}
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
                                {firstEvent.consignmentNo ||
                                  consignment.consignmentNo ||
                                  "N/A"}
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
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
                                  Date:{" "}
                                  {firstEvent.loadedAt ||
                                    earliestEvent.startDate ||
                                    "N/A"}
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
                                  Trip: {getPlaceName(pol)} &rarr;{" "}
                                  {getPlaceName(pod)}
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

                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  ml: "auto",
                                }}
                              >
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
                                    onClick={() =>
                                      generateSingleJobManifestPDF(
                                        consignment.orders,
                                        selectedContainerNo,
                                        jobNo,
                                        pol,
                                        pod,
                                        linkedOrders,
                                        [...consignment.orders].sort(
                                          (a, b) =>
                                            new Date(a.eventTime) -
                                            new Date(b.eventTime),
                                        )[0]?.eventTime || "N/A",
                                      )
                                    }
                                    disabled={generatingPDF}
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
                                    onClick={() =>
                                      generateJobDetailManifestPDF(
                                        jobNo,
                                        pol,
                                        pod,
                                        linkedOrders,
                                        consignment.orders,
                                        consignment.consignmentNo ||
                                          firstEvent.consignmentNo,
                                        [...consignment.orders].sort(
                                          (a, b) =>
                                            new Date(a.eventTime) -
                                            new Date(b.eventTime),
                                        )[0]?.eventTime
                                          ? new Date(
                                              [...consignment.orders].sort(
                                                (a, b) =>
                                                  new Date(a.eventTime) -
                                                  new Date(b.eventTime),
                                              )[0].eventTime,
                                            ).toLocaleDateString("en-GB")
                                          : "N/A",
                                      )
                                    }
                                    disabled={generatingPDF}
                                    sx={{
                                      borderColor: "#f58220",
                                      color: "#f58220",
                                      fontSize: 12,
                                      py: 0.4,
                                      px: 1.5,
                                      "&:hover": {
                                        bgcolor: "#fff8f3",
                                        borderColor: "#f58220",
                                      },
                                    }}
                                  >
                                    Manifest
                                  </Button>
                                </Tooltip>
                              </Box>
                            </Box>

                            {/* Orders Table */}
                            <TableContainer
                              component={Paper}
                              sx={{ boxShadow: 1, borderRadius: 1 }}
                            >
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "#0d6c6a" }}>
                                    {[
                                      "Booking Ref",
                                      "Form No",
                                      "Summary",
                                      "Qty",
                                      "Weight",
                                      "Updated By",
                                      "Assigned At",
                                      "Type",
                                    ].map((h) => (
                                      <TableCell
                                        key={h}
                                        sx={{
                                          color: "white",
                                          fontWeight: "bold",
                                          py: 1,
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
                                        colSpan={7}
                                        align="center"
                                        sx={{
                                          py: 3,
                                          color: "text.secondary",
                                          fontSize: 13,
                                        }}
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
                                          "&:hover": {
                                            bgcolor: "action.hover",
                                          },
                                        }}
                                      >
                                        <TableCell
                                          sx={{
                                            fontWeight: 500,
                                            color: "#0d6c6a",
                                            fontSize: 13,
                                          }}
                                        >
                                          {event.bookingRef ||
                                            event.orderId ||
                                            "N/A"}
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
                                        <TableCell
                                          sx={{
                                            fontSize: 12,
                                            color: "text.secondary",
                                          }}
                                        >
                                          {event.changedBy || "System"}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13 }}>
                                          {event.loadedAt != null
                                            ? `${event.loadedAt}`
                                            : "-- Proceeded via Batch --"}
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
                      })
                  )}
                </>
              )}

              {activeHistoryTab === 1 && (
                <>
                  {loadingUnassigned ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 4 }}
                    >
                      <CircularProgress />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        Loading unassigned orders...
                      </Typography>
                    </Box>
                  ) : unassignedOrders.length === 0 ? (
                    <Typography
                      variant="body2"
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      No orders without a consignment found for this container.
                    </Typography>
                  ) : (
                    <Box>
                      {/* summary banner */}
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
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: "#e65100", fontWeight: 600 }}
                        >
                          {unassignedOrders.length} assignment event
                          {unassignedOrders.length !== 1 ? "s" : ""} with no
                          consignment linked
                        </Typography>
                      </Box>

                      <TableContainer
                        component={Paper}
                        sx={{ boxShadow: 1, borderRadius: 1 }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: "#e65100" }}>
                              {[
                                "#",
                                "Date",
                                "Booking Ref",
                                "Form No",
                                "Summary",
                                "Qty",
                                "Weight",
                                "Updated By",
                                "Type",
                              ].map((h) => (
                                <TableCell
                                  key={h}
                                  sx={{
                                    color: "white",
                                    fontWeight: "bold",
                                    py: 1,
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
                                <TableCell
                                  sx={{ fontSize: 12, color: "text.secondary" }}
                                >
                                  {idx + 1}
                                </TableCell>
                                <TableCell sx={{ fontSize: 13 }}>
                                  {event.eventTime || "—"}
                                </TableCell>
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
                                <TableCell
                                  sx={{ fontSize: 12, color: "text.secondary" }}
                                >
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
                  )}
                </>
              )}
            </>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                startIcon={<CloseIcon />}
                onClick={() => setOpenHistoryModal(false)}
                sx={{
                  textTransform: "none",
                  color: "#fff",
                  bgcolor: "#f58220",
                  "&:hover": { bgcolor: "#1565c0" },
                }}
              >
                Close
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Snackbar */}
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

        {/* Backdrop */}
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={
            loadingForm || loadingOptions || loadingContainers || generatingPDF
          }
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Box>
    </Box>
  );
};

export default ContainerModule;
