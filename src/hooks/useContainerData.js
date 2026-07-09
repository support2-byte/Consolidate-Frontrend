import {
  useReducer,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useState,
} from "react";
import { AppContext } from "../context/AppContext";
import { api } from "../api";
import { DEFAULT_FORM_DATA } from "../constants/containers";
import { buildContainerPayload, validateForm } from "../Utlis/containerBuilder";

const initialFilters = {
  container_number: "",
  container_size: "",
  container_type: "",
  owner_type: "",
  status: "",
  location: "",
};

const initialDataState = {
  filters: initialFilters,
  currentPage: 1,
  rowsPerPage: 50,
  totalCount: 0,
  sizes: [],
  types: [],
  ownershipTypes: [],
  filterPlace: [],
  containers: [],
  allContainers: [],
};

const initialFormState = {
  openAddModal: false,
  isEditing: false,
  editingContainer: null,
  formData: DEFAULT_FORM_DATA,
};

const initialHistoryState = {
  openHistoryModal: false,
  selectedContainerNo: null,
  historyCid: "",
  usageHistory: [],
  unassignedOrders: [],
  activeHistoryTab: 0,
};

const initialUIState = {
  loadingContainers: false,
  loadingForm: false,
  loadingReturned: {},
  loadingOptions: false,
  loadingHistory: false,
  loadingUnassigned: false,
  generatingPDF: false,
  error: null,
  snackbar: {
    open: false,
    message: "",
    severity: "info",
  },
  editingId: null,
  tempData: {
    current_status: "",
    status: "",
    location: "",
    jobStatus: "",
  },
};

const dataReducer = (state, action) => {
  switch (action.type) {
    case "SET_FILTER":
      return {
        ...state,
        filters: { ...state.filters, [action.field]: action.value },
        currentPage: 1,
      };
    case "CLEAR_FILTERS":
      return {
        ...state,
        filters: initialFilters,
        currentPage: 1,
      };
    case "SET_PAGE":
      return { ...state, currentPage: action.page };
    case "SET_ROWS_PER_PAGE":
      return { ...state, rowsPerPage: action.rows, currentPage: 1 };
    case "SET_TOTAL_COUNT":
      return { ...state, totalCount: action.count };
    case "SET_OPTIONS":
      return {
        ...state,
        sizes: action.sizes,
        types: action.types,
        ownershipTypes: action.ownershipTypes,
        filterPlace: action.filterPlace,
      };
    case "SET_ALL_CONTAINERS":
      return { ...state, allContainers: action.containers };
    case "SET_FILTERED_CONTAINERS":
      return {
        ...state,
        containers: action.containers,
        totalCount: action.totalCount,
      };
    default:
      return state;
  }
};

const formReducer = (state, action) => {
  switch (action.type) {
    case "OPEN_ADD_MODAL":
      return { ...state, openAddModal: true };
    case "CLOSE_ADD_MODAL":
      return {
        ...state,
        openAddModal: false,
        isEditing: false,
        editingContainer: null,
        formData: DEFAULT_FORM_DATA,
      };
    case "SET_EDITING":
      return {
        ...state,
        isEditing: true,
        editingContainer: action.container,
        formData: action.formData,
        openAddModal: true,
      };
    case "UPDATE_FORM":
      if (state.formData[action.field] === action.value) {
        return state;
      }
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value },
      };
    case "RESET_FORM":
      return {
        ...state,
        isEditing: false,
        editingContainer: null,
        formData: DEFAULT_FORM_DATA,
        openAddModal: false,
      };
    default:
      return state;
  }
};

const historyReducer = (state, action) => {
  switch (action.type) {
    case "OPEN_HISTORY":
      return {
        ...state,
        openHistoryModal: true,
        selectedContainerNo: action.containerNumber,
        historyCid: action.cid,
        activeHistoryTab: 0,
        unassignedOrders: [],
        usageHistory: [],
      };
    case "CLOSE_HISTORY":
      return {
        ...state,
        openHistoryModal: false,
        selectedContainerNo: null,
        historyCid: "",
        usageHistory: [],
        unassignedOrders: [],
        activeHistoryTab: 0,
      };
    case "SET_USAGE_HISTORY":
      return { ...state, usageHistory: action.history };
    case "SET_UNASSIGNED_ORDERS":
      return { ...state, unassignedOrders: action.orders };
    case "SET_ACTIVE_TAB":
      return { ...state, activeHistoryTab: action.tab };
    default:
      return state;
  }
};

const uiReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, [action.key]: action.value };
    case "SET_LOADING_RETURNED":
      return {
        ...state,
        loadingReturned: {
          ...state.loadingReturned,
          [action.cid]: action.value,
        },
      };
    case "SHOW_SNACKBAR":
      return {
        ...state,
        snackbar: {
          open: true,
          message: action.message,
          severity: action.severity || "info",
        },
        error: null,
      };
    case "HIDE_SNACKBAR":
      return { ...state, snackbar: { ...state.snackbar, open: false } };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "START_QUICK_EDIT":
      return {
        ...state,
        editingId: action.cid,
        tempData: action.tempData,
      };
    case "CANCEL_QUICK_EDIT":
      return {
        ...state,
        editingId: null,
        tempData: {
          current_status: "",
          status: "",
          location: "",
          jobStatus: "",
        },
      };
    case "UPDATE_TEMP_DATA":
      return {
        ...state,
        tempData: { ...state.tempData, [action.field]: action.value },
      };
    case "SET_GENERATING_PDF":
      return { ...state, generatingPDF: action.value };
    default:
      return state;
  }
};

const dataActions = {
  setFilter: (field, value) => ({ type: "SET_FILTER", field, value }),
  clearFilters: () => ({ type: "CLEAR_FILTERS" }),
  setPage: (page) => ({ type: "SET_PAGE", page }),
  setRowsPerPage: (rows) => ({ type: "SET_ROWS_PER_PAGE", rows }),
  setTotalCount: (count) => ({ type: "SET_TOTAL_COUNT", count }),
  setOptions: (sizes, types, ownershipTypes, filterPlace) => ({
    type: "SET_OPTIONS",
    sizes,
    types,
    ownershipTypes,
    filterPlace,
  }),
  setAllContainers: (containers) => ({
    type: "SET_ALL_CONTAINERS",
    containers,
  }),
  setFilteredContainers: (containers, totalCount) => ({
    type: "SET_FILTERED_CONTAINERS",
    containers,
    totalCount,
  }),
};

const formActions = {
  openAddModal: () => ({ type: "OPEN_ADD_MODAL" }),
  closeAddModal: () => ({ type: "CLOSE_ADD_MODAL" }),
  setEditing: (container, formData) => ({
    type: "SET_EDITING",
    container,
    formData,
  }),
  updateForm: (field, value) => ({ type: "UPDATE_FORM", field, value }),
  resetForm: () => ({ type: "RESET_FORM" }),
};

const historyActions = {
  openHistory: (cid, containerNumber) => ({
    type: "OPEN_HISTORY",
    cid,
    containerNumber,
  }),
  closeHistory: () => ({ type: "CLOSE_HISTORY" }),
  setUsageHistory: (history) => ({ type: "SET_USAGE_HISTORY", history }),
  setUnassignedOrders: (orders) => ({ type: "SET_UNASSIGNED_ORDERS", orders }),
  setActiveTab: (tab) => ({ type: "SET_ACTIVE_TAB", tab }),
};

const uiActions = {
  setLoading: (key, value) => ({ type: "SET_LOADING", key, value }),
  setLoadingReturned: (cid, value) => ({
    type: "SET_LOADING_RETURNED",
    cid,
    value,
  }),
  showSnackbar: (message, severity) => ({
    type: "SHOW_SNACKBAR",
    message,
    severity,
  }),
  hideSnackbar: () => ({ type: "HIDE_SNACKBAR" }),
  setError: (error) => ({ type: "SET_ERROR", error }),
  startQuickEdit: (cid, tempData) => ({
    type: "START_QUICK_EDIT",
    cid,
    tempData,
  }),
  cancelQuickEdit: () => ({ type: "CANCEL_QUICK_EDIT" }),
  updateTempData: (field, value) => ({
    type: "UPDATE_TEMP_DATA",
    field,
    value,
  }),
  setGeneratingPDF: (value) => ({ type: "SET_GENERATING_PDF", value }),
};

export const useContainerData = (propContainers = []) => {
  const { places, statuses: masterStatuses = [] } = useContext(AppContext);

  const [dataState, dataDispatch] = useReducer(dataReducer, initialDataState);
  const [formState, formDispatch] = useReducer(formReducer, initialFormState);
  const [historyState, historyDispatch] = useReducer(
    historyReducer,
    initialHistoryState,
  );
  const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);

  const [debouncedContainerNumber, setDebouncedContainerNumber] = useState("");

  const jobStatusOptions = useMemo(
    () => [
      ...new Set(masterStatuses.map((s) => s.container_status).filter(Boolean)),
    ],
    [masterStatuses],
  );

  const getPlaceName = useCallback(
    (placeId) => {
      if (!placeId) return "N/A";
      const id = placeId.toString();
      const place = dataState.filterPlace.find(
        (p) => p.value === id || p.id === placeId,
      );
      return place ? place.label : `ID: ${placeId}`;
    },
    [dataState.filterPlace],
  );

  const showToast = useCallback((message, severity = "info") => {
    uiDispatch(uiActions.showSnackbar(message, severity));
  }, []);

  const handleError = useCallback(
    (err, defaultMessage = "An unexpected error occurred") => {
      console.error("Error:", err);
      const message =
        err.response?.data?.error || err.message || defaultMessage;
      uiDispatch(uiActions.setError(message));
      uiDispatch(uiActions.showSnackbar(message, "error"));
    },
    [],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedContainerNumber(dataState.filters.container_number);
    }, 400);
    return () => clearTimeout(timeout);
  }, [dataState.filters.container_number]);

  useEffect(() => {
    const fetchOptions = async () => {
      uiDispatch(uiActions.setLoading("loadingOptions", true));
      try {
        const [sizeRes, typeRes, ownershipRes] = await Promise.all([
          api.get("/api/containers/sizes"),
          api.get("/api/containers/types"),
          api.get("/api/containers/ownership-types"),
        ]);
        dataDispatch(
          dataActions.setOptions(
            sizeRes.data || [],
            typeRes.data || [],
            ownershipRes.data || [],
            places.map((p) => ({
              id: p.id,
              value: p.id.toString(),
              label: p.name,
            })),
          ),
        );
      } catch (err) {
        handleError(err, "Error fetching options");
      } finally {
        uiDispatch(uiActions.setLoading("loadingOptions", false));
      }
    };
    fetchOptions();
  }, [places, handleError]);

  const fetchContainers = useCallback(async () => {
    if (!navigator.onLine) {
      handleError(new Error("You are offline. Please check your connection."));
      return;
    }
    uiDispatch(uiActions.setLoading("loadingContainers", true));
    uiDispatch(uiActions.setError(null));
    try {
      const res = await api.get("/api/containers");
      const data = res.data?.data || [];
      dataDispatch(dataActions.setAllContainers(data));
    } catch (err) {
      handleError(err, "Error fetching containers");
    } finally {
      uiDispatch(uiActions.setLoading("loadingContainers", false));
    }
  }, [handleError]);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  useEffect(() => {
    if (dataState.allContainers.length === 0) {
      dataDispatch(dataActions.setFilteredContainers([], 0));
      return;
    }

    let filtered = [...dataState.allContainers];
    const { filters } = dataState;

    if (filters.container_number) {
      filtered = filtered.filter((c) =>
        c.container_number
          ?.toUpperCase()
          .includes(filters.container_number.toUpperCase()),
      );
    }
    if (filters.container_size)
      filtered = filtered.filter(
        (c) => c.container_size === filters.container_size,
      );
    if (filters.container_type)
      filtered = filtered.filter(
        (c) => c.container_type === filters.container_type,
      );
    if (filters.owner_type)
      filtered = filtered.filter((c) => c.owner_type === filters.owner_type);
    if (filters.status)
      filtered = filtered.filter((c) => c.derived_status === filters.status);
    if (filters.location)
      filtered = filtered.filter((c) => c.location === filters.location);

    const start = (dataState.currentPage - 1) * dataState.rowsPerPage;
    dataDispatch(
      dataActions.setFilteredContainers(
        filtered.slice(start, start + dataState.rowsPerPage),
        filtered.length,
      ),
    );
  }, [
    dataState.filters,
    dataState.allContainers,
    dataState.currentPage,
    dataState.rowsPerPage,
  ]);

  const fetchContainerById = useCallback(
    async (cid) => {
      uiDispatch(uiActions.setLoading("loadingHistory", true));
      historyDispatch(historyActions.setUsageHistory([]));
      try {
        const res = await api.get(`/api/containers/${cid}/usage-history`);
        const grouped = res.data?.groupedByConsignment || {};
        historyDispatch(
          historyActions.setUsageHistory(Object.values(grouped).reverse()),
        );
      } catch (err) {
        historyDispatch(historyActions.setUsageHistory([]));
        handleError(err, "Error fetching container details");
      } finally {
        uiDispatch(uiActions.setLoading("loadingHistory", false));
      }
    },
    [handleError],
  );

  const fetchUnassignedOrders = useCallback(async (cid) => {
    uiDispatch(uiActions.setLoading("loadingUnassigned", true));
    try {
      const res = await api.get(`/api/containers/${cid}/unassigned-orders`);
      historyDispatch(
        historyActions.setUnassignedOrders(res.data?.orders || []),
      );
    } catch {
      historyDispatch(historyActions.setUnassignedOrders([]));
    } finally {
      uiDispatch(uiActions.setLoading("loadingUnassigned", false));
    }
  }, []);

  const handleFilterChange = useCallback((e) => {
    dataDispatch(dataActions.setFilter(e.target.name, e.target.value));
  }, []);

  const handleClearFilters = useCallback(() => {
    dataDispatch(dataActions.clearFilters());
  }, []);

  const handleFormChange = useCallback((e) => {
    formDispatch(formActions.updateForm(e.target.name, e.target.value));
  }, []);

  const openHistory = useCallback(
    (cid, containerNumber) => {
      historyDispatch(historyActions.openHistory(cid, containerNumber));
      fetchContainerById(cid);
      fetchUnassignedOrders(cid);
    },
    [fetchContainerById, fetchUnassignedOrders],
  );

  const handleEdit = useCallback(async (containerData) => {
    try {
      const response = await api.get(`/api/containers/${containerData.cid}`);
      const container = response.data;

      const formData = {
        ownership: container.owner_type || "soc",
        containerNo: container.container_number || "",
        size: container.container_size || "",
        type: container.container_type || "",
        derived_status: container.status || "",
        location: container.location || "karachi_port",
        dateAdded: new Date().toISOString().split("T")[0],
        dateOfManufacture: container.manufacture_date
          ? new Date(container.manufacture_date).toISOString().split("T")[0]
          : "",
        purchasePrice: container.purchase_price || "",
        purchaseFrom: container.purchase_from || "",
        ownershipDetails: container.owned_by || "Self-Owned",
        currency: container.currency || "USD",
        hireStartDate: container.hire_start_date?.split("T")[0] ?? "",
        hireEndDate: container.hire_end_date?.split("T")[0] ?? "",
        return_date: container.return_date?.split("T")[0] ?? "",
        purchaseDate: container.purchase_date?.split("T")[0] ?? "",
        availableAtDate: container.available_at?.split("T")[0] ?? "",
        vendor: container.hired_by || "",
        freeDays: container.free_days || "",
        placeOfLoading: container.place_of_loading || "",
        placeOfDelivery: container.place_of_destination || "",
      };

      formDispatch(formActions.setEditing(containerData, formData));
    } catch (error) {
      console.log("Something went wrong", error);
    }
  }, []);

  const resetForm = useCallback(() => {
    formDispatch(formActions.resetForm());
  }, []);

  const handleFormSubmit = useCallback(async () => {
    try {
      validateForm(formState.formData, places);
    } catch (err) {
      handleError(err);
      return;
    }
    if (!navigator.onLine) {
      handleError(new Error("You are offline. Please check your connection."));
      return;
    }
    uiDispatch(uiActions.setLoading("loadingForm", true));
    try {
      const payload = buildContainerPayload(formState.formData);
      if (formState.isEditing && formState.editingContainer) {
        await api.put(
          `/api/containers/${formState.editingContainer.cid}`,
          payload,
        );
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
      uiDispatch(uiActions.setLoading("loadingForm", false));
    }
  }, [formState, places, handleError, showToast, resetForm, fetchContainers]);

  const handleQuickEdit = useCallback((container) => {
    uiDispatch(
      uiActions.startQuickEdit(container.cid, {
        current_status: container.assignment_status || "",
        status: container.current_status || "",
        location: container.location || "",
        jobStatus: container.assignment_status || "",
      }),
    );
  }, []);

  const handleQuickSave = useCallback(
    async (cid) => {
      if (!uiState.tempData.status || !uiState.tempData.location) {
        showToast("Status and Location are required", "error");
        return;
      }
      try {
        await api.put(`/api/containers/status/${cid}`, {
          current_status: uiState.tempData.current_status,
          derived_status: uiState.tempData.status,
          location: uiState.tempData.location,
          container_status: uiState.tempData.jobStatus || null,
        });
        showToast("Container updated successfully", "success");
        uiDispatch(uiActions.cancelQuickEdit());
        await fetchContainers();
      } catch (err) {
        handleError(err, "Failed to update container");
      }
    },
    [uiState.tempData, showToast, fetchContainers, handleError],
  );

  const handleQuickCancel = useCallback(() => {
    uiDispatch(uiActions.cancelQuickEdit());
  }, []);

  const markReturned = useCallback(
    async (cid) => {
      if (!navigator.onLine) {
        handleError(
          new Error("You are offline. Please check your connection."),
        );
        return;
      }
      uiDispatch(uiActions.setLoadingReturned(cid, true));
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
        uiDispatch(uiActions.setLoadingReturned(cid, false));
      }
    },
    [handleError, showToast, fetchContainers],
  );

  const handleSnackbarClose = useCallback(() => {
    uiDispatch(uiActions.hideSnackbar());
  }, []);

  return {
    filters: dataState.filters,
    currentPage: dataState.currentPage,
    rowsPerPage: dataState.rowsPerPage,
    totalCount: dataState.totalCount,
    sizes: dataState.sizes,
    types: dataState.types,
    ownershipTypes: dataState.ownershipTypes,
    filterPlace: dataState.filterPlace,
    containers: dataState.containers,
    formData: formState.formData,
    isEditing: formState.isEditing,
    editingContainer: formState.editingContainer,
    openAddModal: formState.openAddModal,
    openHistoryModal: historyState.openHistoryModal,
    selectedContainerNo: historyState.selectedContainerNo,
    historyCid: historyState.historyCid,
    usageHistory: historyState.usageHistory,
    unassignedOrders: historyState.unassignedOrders,
    activeHistoryTab: historyState.activeHistoryTab,
    loadingContainers: uiState.loadingContainers,
    loadingForm: uiState.loadingForm,
    loadingReturned: uiState.loadingReturned,
    loadingOptions: uiState.loadingOptions,
    loadingHistory: uiState.loadingHistory,
    loadingUnassigned: uiState.loadingUnassigned,
    generatingPDF: uiState.generatingPDF,
    error: uiState.error,
    snackbar: uiState.snackbar,
    editingId: uiState.editingId,
    tempData: uiState.tempData,
    jobStatusOptions,
    debouncedContainerNumber,
    getPlaceName,
    showToast,
    setOpenAddModal: (open) =>
      open
        ? formDispatch(formActions.openAddModal())
        : formDispatch(formActions.closeAddModal()),
    setOpenHistoryModal: (open) =>
      open
        ? historyDispatch(historyActions.openHistory("", ""))
        : historyDispatch(historyActions.closeHistory()),
    setActiveHistoryTab: (tab) =>
      historyDispatch(historyActions.setActiveTab(tab)),
    setTempData: (updater) => {
      if (typeof updater === "function") {
        const newData = updater(uiState.tempData);
        Object.entries(newData).forEach(([key, value]) => {
          uiDispatch(uiActions.updateTempData(key, value));
        });
      } else {
        Object.entries(updater).forEach(([key, value]) => {
          uiDispatch(uiActions.updateTempData(key, value));
        });
      }
    },
    setGeneratingPDF: (value) => uiDispatch(uiActions.setGeneratingPDF(value)),
    setCurrentPage: (page) => dataDispatch(dataActions.setPage(page)),
    setRowsPerPage: (rows) => dataDispatch(dataActions.setRowsPerPage(rows)),
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
    handleSnackbarClose,
    fetchContainers,
  };
};
