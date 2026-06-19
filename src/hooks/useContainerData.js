import { useState, useEffect, useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { api } from "../api";
import { DEFAULT_FORM_DATA } from "../constants/containers";
import { buildContainerPayload, validateForm } from "../Utlis/containerBuilder";

export const useContainerData = () => {
  const { places, statuses: masterStatuses = [] } = useContext(AppContext);

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

  const [sizes, setSizes] = useState([]);
  const [types, setTypes] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [filterPlace, setFilterPlace] = useState([]);

  const [containers, setContainers] = useState([]);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({
    current_status: "",
    status: "",
    location: "",
    jobStatus: "",
  });

  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [selectedContainerNo, setSelectedContainerNo] = useState(null);
  const [historyCid, setHistoryCid] = useState("");
  const [usageHistory, setUsageHistory] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState(0);

  const [loadingContainers, setLoadingContainers] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingReturned, setLoadingReturned] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const jobStatusOptions = useMemo(
    () => [
      ...new Set(masterStatuses.map((s) => s.container_status).filter(Boolean)),
    ],
    [masterStatuses],
  );

  const getPlaceName = (placeId) => {
    if (!placeId) return "N/A";
    const id = placeId.toString();
    const place = filterPlace.find((p) => p.value === id || p.id === placeId);
    return place ? place.label : `ID: ${placeId}`;
  };

  const showToast = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
    setError(null);
  };

  const handleError = (
    err,
    defaultMessage = "An unexpected error occurred",
  ) => {
    console.error("Error:", err);
    const message = err.response?.data?.error || err.message || defaultMessage;
    setError(message);
    showToast(message, "error");
  };

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [sizeRes, typeRes, ownershipRes] = await Promise.all([
        api.get("/api/containers/sizes"),
        api.get("/api/containers/types"),
        api.get("/api/containers/ownership-types"),
      ]);
      setSizes(sizeRes.data || []);
      setTypes(typeRes.data || []);
      setOwnershipTypes(ownershipRes.data || []);
      setFilterPlace(
        places.map((p) => ({
          id: p.id,
          value: p.id.toString(),
          label: p.name,
        })),
      );
    } catch (err) {
      handleError(err, "Error fetching options");
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchContainers = async () => {
    if (!navigator.onLine) {
      handleError(new Error("You are offline. Please check your connection."));
      return;
    }
    setLoadingContainers(true);
    setError(null);
    try {
      const params = { ...filters, page: currentPage, limit: rowsPerPage };
      const res = await api.get("/api/containers", { params });
      setContainers(res.data?.data || []);
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      handleError(err, "Error fetching containers");
    } finally {
      setLoadingContainers(false);
    }
  };

  const fetchContainerById = async (cid) => {
    setLoadingHistory(true);
    setUsageHistory([]);
    try {
      const res = await api.get(`/api/containers/${cid}/usage-history`);
      const grouped = res.data?.groupedByConsignment || {};
      setUsageHistory(Object.values(grouped).reverse());
    } catch (err) {
      setUsageHistory([]);
      handleError(err, "Error fetching container details");
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchUnassignedOrders = async (cid) => {
    setLoadingUnassigned(true);
    try {
      const res = await api.get(`/api/containers/${cid}/unassigned-orders`);
      setUnassignedOrders(res.data?.orders || []);
    } catch {
      setUnassignedOrders([]);
    } finally {
      setLoadingUnassigned(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);
  useEffect(() => {
    fetchContainers();
  }, [filters, currentPage, rowsPerPage]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

  const handleFormChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const openHistory = (cid, containerNumber) => {
    setSelectedContainerNo(containerNumber);
    setHistoryCid(cid);
    setActiveHistoryTab(0);
    setUnassignedOrders([]);
    fetchContainerById(cid);
    fetchUnassignedOrders(cid);
    setOpenHistoryModal(true);
  };

  const handleEdit = (container) => {
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
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingContainer(null);
    setFormData(DEFAULT_FORM_DATA);
    setOpenAddModal(false);
  };

  const handleFormSubmit = async () => {
    try {
      validateForm(formData);
    } catch (err) {
      handleError(err);
      return;
    }
    if (!navigator.onLine) {
      handleError(new Error("You are offline. Please check your connection."));
      return;
    }
    setLoadingForm(true);
    try {
      const payload = buildContainerPayload(formData);
      if (isEditing && editingContainer) {
        await api.put(`/api/containers/${editingContainer.cid}`, payload);
        showToast("Container updated successfully", "success");
      } else {
        await api.post("/api/containers", payload);
        showToast("Container added successfully", "success");
      }
      resetForm();
      await fetchContainers();
    } catch (err) {
      handleError(err, "Failed to save container");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleQuickEdit = (container) => {
    setEditingId(container.cid);
    setTempData({
      current_status: container.assignment_status || "",
      status: container.current_status || "",
      location: container.location || "",
      jobStatus: container.assignment_status || "",
    });
  };

  const handleQuickSave = async (cid) => {
    if (!tempData.status || !tempData.location) {
      showToast("Status and Location are required", "error");
      return;
    }
    try {
      await api.put(`/api/containers/status/${cid}`, {
        current_status: tempData.current_status,
        derived_status: tempData.status,
        location: tempData.location,
        container_status: tempData.jobStatus || null,
      });
      showToast("Container updated successfully", "success");
      setEditingId(null);
      await fetchContainers();
    } catch (err) {
      handleError(err, "Failed to update container");
    }
  };

  const handleQuickCancel = () => {
    setEditingId(null);
    setTempData({
      current_status: "",
      status: "",
      location: "",
      jobStatus: "",
    });
  };

  // ─── Mark Returned ───────────────────────────────────────────────────────
  const markReturned = async (cid) => {
    if (!navigator.onLine) {
      handleError(new Error("You are offline. Please check your connection."));
      return;
    }
    setLoadingReturned((prev) => ({ ...prev, [cid]: true }));
    try {
      await api.put(`/api/containers/${cid}`, {
        derived_status: "Returned",
        remarks: "Marked as returned via frontend",
      });
      await fetchContainers();
      showToast("Container marked as returned successfully", "success");
    } catch (err) {
      handleError(err, "Failed to mark as returned");
    } finally {
      setLoadingReturned((prev) => ({ ...prev, [cid]: false }));
    }
  };

  return {
    // State
    filters,
    currentPage,
    rowsPerPage,
    totalCount,
    sizes,
    types,
    ownershipTypes,
    filterPlace,
    containers,
    formData,
    isEditing,
    editingContainer,
    openAddModal,
    setOpenAddModal,
    editingId,
    tempData,
    setTempData,
    openHistoryModal,
    setOpenHistoryModal,
    selectedContainerNo,
    historyCid,
    usageHistory,
    unassignedOrders,
    activeHistoryTab,
    setActiveHistoryTab,
    loadingContainers,
    loadingForm,
    loadingReturned,
    loadingOptions,
    loadingHistory,
    loadingUnassigned,
    generatingPDF,
    setGeneratingPDF,
    error,
    snackbar,
    jobStatusOptions,
    // Helpers
    getPlaceName,
    showToast,
    // Handlers
    handleFilterChange,
    handleClearFilters,
    handleFormChange,
    handleFormSubmit,
    resetForm,
    handleEdit,
    handleQuickEdit,
    handleQuickSave,
    handleQuickCancel,
    markReturned,
    openHistory,
    setCurrentPage,
    setRowsPerPage,
    handleSnackbarClose: () => setSnackbar((s) => ({ ...s, open: false })),
    fetchContainers,
  };
};
