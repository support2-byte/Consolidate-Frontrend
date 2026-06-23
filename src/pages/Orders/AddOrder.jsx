import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  Accordion,
  Grid,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Snackbar,
  Alert,
  RadioGroup,
  Radio,
  FormControlLabel,
  CircularProgress,
  Autocomplete,
  Checkbox,
  ListItemText,
  FormGroup,
  FormControlLabel as CheckboxFormControlLabel,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CopyIcon from "@mui/icons-material/ContentCopy";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import logoPic from "../../../public/logo-2.png";
import { AppContext } from "../../context/AppContext";

const CustomTextField = ({ disabled, ...props }) => (
  <TextField
    {...props}
    disabled={disabled}
    size="medium"
    error={props.error}
    helperText={props.helperText}
    sx={{
      flex: 1,
      minWidth: 0,
      "& .MuiOutlinedInput-root": {
        borderRadius: 2,
        transition: "all 0.3s ease",
        backgroundColor: "#fff",
        "& fieldset": { borderColor: "#ddd" },
        "&:hover fieldset": { borderColor: "#f58220" },
        "&.Mui-focused fieldset": {
          borderColor: "#f58220",
          boxShadow: "0 0 8px rgba(245, 130, 32, 0.3)",
        },
        ...(props.error && { "& fieldset": { borderColor: "#d32f2f" } }),
        ...(disabled && { backgroundColor: "#f5f5f5", color: "#999" }),
      },
      "& .MuiInputLabel-root": {
        letterSpacing: 0.5,
        textTransform: "capitalize",
        color: "rgba(180, 174, 174, 1)",
        ...(props.error && { color: "#d32f2f" }),
        ...(disabled && { color: "#999" }),
      },
    }}
  />
);

const CustomSelect = ({
  label,
  name,
  value,
  onChange,
  children,
  sx: selectSx,
  error,
  disabled,
  required = false,
  renderValue,
}) => (
  <FormControl
    size="medium"
    sx={{ flex: 1, minWidth: 0, ...selectSx, background: "#fff" }}
    error={error}
    required={required}
  >
    <InputLabel
      sx={{
        color: "rgba(180, 174, 174, 1)",
        ...(disabled && { color: "#999" }),
      }}
    >
      {label}
    </InputLabel>
    <Select
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      size="medium"
      renderValue={renderValue}
      sx={{
        flex: 1,
        minWidth: 0,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          transition: "all 0.3s ease",
          backgroundColor: "#fff",
          "& fieldset": { borderColor: "#ddd" },
          "&:hover fieldset": { borderColor: "#f58220" },
          "&.Mui-focused fieldset": {
            borderColor: "#f58220",
            boxShadow: "0 0 8px rgba(245, 130, 32, 0.3)",
          },
          ...(error && { "& fieldset": { borderColor: "#d32f2f" } }),
          ...(disabled && { backgroundColor: "#f5f5f5", color: "#999" }),
        },
        "& .MuiInputLabel-root": {
          letterSpacing: 0.5,
          textTransform: "capitalize",
          color: "rgba(180, 174, 174, 1)",
          ...(error && { color: "#d32f2f" }),
          ...(disabled && { color: "#999" }),
        },
      }}
    >
      {children}
    </Select>
  </FormControl>
);
const OrderForm = () => {
  const { places, customers, statuses: rawStatuses } = useContext(AppContext);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(new Set(["panel1"]));
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingContainers, setLoadingContainers] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categorySubMap, setCategorySubMap] = useState({});
  const [types, setTypes] = useState([]);
  const [filterPlaces, setFilterPlaces] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [previewSd, setPreviewSd] = useState({});
  const [companies, setCompanies] = useState([]);
  const orderId = location.state?.orderId;
  const [isEditMode, setIsEditMode] = useState(!!orderId);
  const containerOptions = location.state?.containers || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [searchTerm3, setSearchTerm3] = useState("");

  const options2 = useMemo(() => {
    if (!searchTerm) return customers;
    const lower = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        (c.contact_name || "").toLowerCase().includes(lower) ||
        (c.email || "").toLowerCase().includes(lower) ||
        (c.primary_phone || "").toLowerCase().includes(lower),
    );
  }, [customers, searchTerm]);

  const options3 = useMemo(() => {
    if (!searchTerm3) return customers;
    const lower = searchTerm3.toLowerCase();
    return customers.filter(
      (c) =>
        (c.contact_name || "").toLowerCase().includes(lower) ||
        (c.email || "").toLowerCase().includes(lower) ||
        (c.primary_phone || "").toLowerCase().includes(lower),
    );
  }, [customers, searchTerm3]);

  const statuses = useMemo(
    () => [...rawStatuses].sort((a, b) => a.sorting_number - b.sorting_number),
    [rawStatuses],
  );

  const firstStatus = [...statuses].sort(
    (a, b) => a.sorting_number - b.sorting_number,
  )[0];

  useEffect(() => {
    if (!isEditMode && firstStatus?.days_offset != null) {
      const eta = new Date();
      eta.setDate(eta.getDate() + firstStatus.days_offset);
      const etaStr = eta.toISOString().split("T")[0];

      setFormData((prev) => ({
        ...prev,
        receivers: prev.receivers.map((rec) => ({ ...rec, eta: etaStr })),
        senders: prev.senders.map((s) => ({ ...s, eta: etaStr })),
      }));
    }
  }, [firstStatus?.id]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [errors, setErrors] = useState({});
  const initialShippingDetail = {
    pickupLocation: "",
    category: "",
    subcategory: "",
    type: "",
    deliveryAddress: "",
    totalNumber: "",
    weight: "",
    remainingItems: "",
    status: firstStatus?.order_status,
  };
  const initialSenderObject = {
    senderName: "",
    senderContact: "",
    senderAddress: "",
    senderEmail: "",
    eta: "",
    etd: "",
    shippingLine: "",
    shippingDetails: [{ ...initialShippingDetail }],
    fullPartial: "",
    qtyDelivered: "",
    status: "",
    remarks: "",
  };
  const initialReceiver = {
    receiverName: "",
    receiverContact: "",
    receiverAddress: "",
    receiverEmail: "",
    eta: "",
    etd: "",
    shippingLine: "",
    shippingDetails: [{ ...initialShippingDetail }],
    fullPartial: "",
    qtyDelivered: "",
    status: "Created",
    remarks: "",
    isNew: false,
  };

  const [formData, setFormData] = useState({
    bookingRef: "",
    rglBookingNumber: "",
    placeOfLoading: "",
    pointOfOrigin: "",
    finalDestination: "",
    placeOfDelivery: "",
    orderRemarks: "",
    attachments: [],
    senderName: "",
    senderContact: "",
    senderAddress: "",
    senderEmail: "",
    senderRef: "",
    senderRemarks: "",
    receiverName: "",
    receiverContact: "",
    receiverAddress: "",
    receiverEmail: "",
    receiverRef: "",
    receiverRemarks: "",
    senders: [],
    receivers: [
      {
        receiverName: "",
        receiverContact: "",
        receiverAddress: "",
        receiverEmail: "",
        eta: "",
        etd: "",
        shippingLine: "",
        shippingDetails: [{ ...initialShippingDetail }],
        fullPartial: "",
        qtyDelivered: "",
        status: "Created",
        remarks: "",
        isNew: false,
      },
    ],
    globalTotalItems: 0,
    globalRemainingItems: 0,
    transportType: "",
    thirdPartyTransport: "",
    driverName: "",
    driverContact: "",
    driverNic: "",
    driverPickupLocation: "",
    truckNumber: "",
    dropMethod: "",
    dropoffName: "",
    dropOffCnic: "",
    dropOffMobile: "",
    plateNo: "",
    dropDate: "",
    collectionMethod: "",
    collection_scope: "Partial",
    fullPartial: "",
    qtyDelivered: "",
    clientReceiverName: "",
    clientReceiverId: "",
    clientReceiverMobile: "",
    deliveryDate: "",
    gatepass: [],
    senderType: "sender",
    selectedSenderOwner: "",
    selectedReceiver: "",
    dropOffDetails: {},
  });

  const editableInEdit = [
    "transportType",
    "dropMethod",
    "dropoffName",
    "dropOffCnic",
    "dropOffMobile",
    "plateNo",
    "dropDate",
    "collectionMethod",
    "collection_scope",
    "qtyDelivered",
    "clientReceiverName",
    "clientReceiverId",
    "clientReceiverMobile",
    "deliveryDate",
    "thirdPartyTransport",
    "driverName",
    "driverContact",
    "driverNic",
    "driverPickupLocation",
    "truckNumber",
    "receivers[].fullPartial",
    "receivers[].qtyDelivered",
    "receivers[].shippingDetails[].totalNumber",
    "senders[].fullPartial",
    "senders[].qtyDelivered",
    "senders[].shippingDetails[].totalNumber",
  ];

  const requiredFields = [
    "rglBookingNumber",
    "pointOfOrigin",
    "placeOfLoading",
    "finalDestination",
    "placeOfDelivery",
  ];

  const typePrefix = formData.senderType === "receiver" ? "Receiver" : "Sender";
  const fieldPrefix = formData.senderType === "sender" ? "sender" : "receiver";

  const handleSelectOwner = (event, value) => {
    const lookupId = value?.zoho_id || value?.id;
    const c = lookupId
      ? customers.find(
          (cust) => cust.zoho_id === lookupId || cust.id === lookupId,
        )
      : null;

    if (c) {
      setFormData((prev) => ({
        ...prev,
        [`${fieldPrefix}Name`]: c.contact_name || "",
        [`${fieldPrefix}Contact`]: c.contact || "",
        [`${fieldPrefix}Address`]: c.address || c.zoho_notes || "",
        [`${fieldPrefix}Email`]: c.email || "",
        [`${fieldPrefix}Ref`]: c.zoho_id || "",
        [`${fieldPrefix}Remarks`]: c.system_notes || c.zoho_notes || "",
        selectedSenderOwner: c.zoho_id || c.id,
      }));

      const ownerId = c.zoho_id || c.id;
      api
        .get(`/api/customers/${ownerId}`)
        .then((res) => {
          const phone = res?.data?.contact_persons?.[0]?.phone;
          if (!phone) return;
          setFormData((prev) => {
            if (prev.selectedSenderOwner !== ownerId) return prev;
            return { ...prev, [`${fieldPrefix}Contact`]: phone };
          });
        })
        .catch((err) => console.error("Error fetching owner phone:", err));
    } else {
      setFormData((prev) => ({
        ...prev,
        [`${fieldPrefix}Name`]: "",
        [`${fieldPrefix}Contact`]: "",
        [`${fieldPrefix}Address`]: "",
        [`${fieldPrefix}Email`]: "",
        [`${fieldPrefix}Ref`]: "",
        [`${fieldPrefix}Remarks`]: "",
        selectedSenderOwner: "",
      }));
    }
  };

  // Helper to convert snake_case to camelCase
  const snakeToCamel = (str) =>
    str.replace(/(_[a-z])/g, (g) => g[1].toUpperCase());
  // Helper to convert camelCase to snake_case
  const camelToSnake = (str) => str.replace(/([A-Z])/g, "_$1").toLowerCase();
  // Add these functions
  const updateDropOffField = (entryIndex, field, value) => {
    const receiverIndex = formData.selectedReceiverForDropOff;
    setFormData((prev) => {
      const current = prev.dropOffDetails?.[receiverIndex] || [];
      const updated = [...current];
      updated[entryIndex] = { ...updated[entryIndex], [field]: value };
      return {
        ...prev,
        dropOffDetails: {
          ...prev.dropOffDetails,
          [receiverIndex]: updated,
        },
      };
    });
  };

  const addNewDropOffEntry = () => {
    const receiverIndex = formData.selectedReceiverForDropOff;
    setFormData((prev) => ({
      ...prev,
      dropOffDetails: {
        ...prev.dropOffDetails,
        [receiverIndex]: [
          ...(prev.dropOffDetails?.[receiverIndex] || []),
          {
            dropMethod: "",
            dropoffName: "",
            dropOffCnic: "",
            dropOffMobile: "",
            plateNo: "",
            dropDate: "",
          },
        ],
      },
    }));
  };

  const removeDropOffEntry = (entryIndex) => {
    const receiverIndex = formData.selectedReceiverForDropOff;
    setFormData((prev) => ({
      ...prev,
      dropOffDetails: {
        ...prev.dropOffDetails,
        [receiverIndex]: prev.dropOffDetails[receiverIndex].filter(
          (_, i) => i !== entryIndex,
        ),
      },
    }));
  };

  // Auto generate bookingRef and rglBookingNumber for new orders
  // Auto generate bookingRef, rgslBookingRef, and rglBookingNumber for new orders
  useEffect(() => {
    if (!isEditMode && !formData.bookingRef) {
      const timestamp = Date.now();
      const randomLast3 = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const timestampWithRandom = timestamp.toString().slice(0, 5);

      const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const randomSuffix = Math.random()
        .toString(36)
        .substr(2, 3)
        .toUpperCase();
      const autoPart = `${today}-${randomSuffix}`;

      const bookingRef = `RGSL-${timestampWithRandom}-${randomLast3}`;
      // const rgslBookingRef = `RGSL-ORD-${today}-${randomLast3}`;
      // const rglBookingNumber = `RGSL-ORD-${randomSuffix}${today}`;

      setFormData((prev) => ({
        ...prev,
        bookingRef,
        // rgslBookingRef,
        // rglBookingNumber
      }));
    }
  }, [isEditMode]);
  // Compute global totals dynamically
  useEffect(() => {
    const items =
      formData.senderType === "sender" ? formData.receivers : formData.senders;
    let total = 0;
    let remaining = 0;
    items.forEach((rec) => {
      const recTotal = (rec.shippingDetails || []).reduce(
        (sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0),
        0,
      );
      const recDelivered = parseInt(rec.qtyDelivered || 0) || 0;
      const recRemaining = Math.max(0, recTotal - recDelivered);
      total += recTotal;
      remaining += recRemaining;
    });
    setFormData((prev) => ({
      ...prev,
      globalTotalItems: total,
      globalRemainingItems: remaining,
    }));
  }, [formData.senderType, formData.receivers, formData.senders]);
  // Compute remaining items dep
  const remainingDep = useMemo(() => {
    const items =
      formData.senderType === "sender" ? formData.receivers : formData.senders;
    return items
      .flatMap((rec) =>
        (rec.shippingDetails || []).map(
          (sd) =>
            `${sd.totalNumber || ""}-${rec.qtyDelivered || ""}-${rec.fullPartial || ""}`,
        ),
      )
      .join(",");
  }, [formData.senderType, formData.receivers, formData.senders]);
  // Compute per-item remaining dynamically
  useEffect(() => {
    const listKey = formData.senderType === "sender" ? "receivers" : "senders";
    setFormData((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((rec) => {
        const shippingDetails = rec.shippingDetails || [];
        const recTotal = shippingDetails.reduce(
          (sum, sd) => sum + (parseInt(sd.totalNumber || 0) || 0),
          0,
        );
        const delivered = parseInt(rec.qtyDelivered || 0) || 0;
        const recRemaining = Math.max(0, recTotal - delivered);
        if (rec.fullPartial === "Partial" && recTotal > 0) {
          const updatedDetails = shippingDetails.map((sd) => {
            const sdTotal = parseInt(sd.totalNumber || 0) || 0;
            const sdRemaining = Math.round((sdTotal / recTotal) * recRemaining);
            return { ...sd, remainingItems: sdRemaining.toString() };
          });
          return { ...rec, shippingDetails: updatedDetails };
        } else {
          const updatedDetails = shippingDetails.map((sd) => ({
            ...sd,
            remainingItems: (parseInt(sd.totalNumber || 0) || 0).toString(),
          }));
          return { ...rec, shippingDetails: updatedDetails };
        }
      }),
    }));
  }, [remainingDep, formData.senderType]);

  const ownerNameKey =
    formData.senderType === "sender" ? "senderName" : "receiverName";
  useEffect(() => {
    if (isEditMode && formData.selectedSenderOwner) {
      // const ownerNameKey = formData.senderType === 'sender' ? 'senderName' : 'receiverName';
      if (!formData[ownerNameKey]?.trim()) {
        // Auto-fetch customer details if name empty but ID present
        handleSelectOwner(null, { zoho_id: formData.selectedSenderOwner }); // Mock event/value to trigger fetch
      }
    }
  }, [isEditMode, formData.selectedSenderOwner, formData.senderType]);
  const validateForm = () => {
    const newErrors = {};
    // Core required fields
    const coreRequired = [
      "rglBookingNumber",
      "pointOfOrigin",
      "placeOfLoading",
      "placeOfDelivery",
      "finalDestination",
    ];
    coreRequired.forEach((field) => {
      if (!formData[field]?.trim()) {
        newErrors[field] =
          `${field.replace(/([A-Z])/g, " $1").trim()} is required`;
      }
    });

    // Validate owner name
    if (!formData[ownerNameKey]?.trim() && formData.selectedSenderOwner) {
      newErrors[ownerNameKey] =
        "Owner name is recommended (fetch from selected ID)";
    }
    const ownerContactKey =
      formData.senderType === "sender" ? "senderContact" : "receiverContact";
    // if (!formData[ownerContactKey]?.trim()) {
    //     newErrors[ownerContactKey] = 'Owner contact is required';
    // }
    const ownerAddressKey =
      formData.senderType === "sender" ? "senderAddress" : "receiverAddress";
    // if (!formData[ownerAddressKey]?.trim()) {
    //     newErrors[ownerAddressKey] = 'Owner address is required';
    // }
    // Validate senderType
    if (!formData.senderType) {
      newErrors.senderType = "Sender Type is required";
    }
    // NEW: Validate selectedReceiver for Drop Off
    if (formData.transportType === "Drop Off") {
      if (!formData.selectedReceiver) {
        newErrors.selectedReceiver =
          "Please select a receiver for drop-off details";
      } else if (
        formData.receivers &&
        !formData.receivers[formData.selectedReceiver]
      ) {
        newErrors.selectedReceiver = "Invalid receiver selection";
      } else {
        const selectedIdx = formData.selectedReceiver;
        const receiverDropOffs = formData.dropOffDetails?.[selectedIdx] || [];
        if (receiverDropOffs.length === 0) {
          newErrors[`dropOffDetails[${selectedIdx}]`] =
            "At least one drop-off detail is required for the selected receiver";
        } else {
          receiverDropOffs.forEach((detail, index) => {
            if (!detail.dropMethod?.trim()) {
              newErrors[`dropOffDetails[${selectedIdx}][${index}].dropMethod`] =
                "Drop Method is required";
            }
            if (!detail.dropoffName?.trim()) {
              newErrors[
                `dropOffDetails[${selectedIdx}][${index}].dropoffName`
              ] = "Person Name is required";
            }
            if (!detail.dropOffCnic?.trim()) {
              newErrors[
                `dropOffDetails[${selectedIdx}][${index}].dropOffCnic`
              ] = "CNIC/ID is required";
            }
            if (!detail.dropOffMobile?.trim()) {
              newErrors[
                `dropOffDetails[${selectedIdx}][${index}].dropOffMobile`
              ] = "Mobile is required";
            }
            if (
              detail.dropDate &&
              !/^\d{4}-\d{2}-\d{2}$/.test(detail.dropDate)
            ) {
              newErrors[`dropOffDetails[${selectedIdx}][${index}].dropDate`] =
                "Invalid Drop Date format (YYYY-MM-DD)";
            }
          });
        }
      }
    }

    const isSenderMode = formData.senderType === "receiver";
    const items = isSenderMode ? formData.senders : formData.receivers;
    const itemsKey = isSenderMode ? "senders" : "receivers";
    const itemPrefix = isSenderMode ? "Sender" : "Receiver";

    if (!formData.transportType) {
      newErrors.transportType = "Transport Type is required";
    }

    if (formData.transportType === "Drop Off" && !formData.dropMethod?.trim()) {
      newErrors.dropMethod = "Drop Method is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const ownerEmailKey =
      formData.senderType === "sender" ? "senderEmail" : "receiverEmail";

    if (formData[ownerEmailKey] && !emailRegex.test(formData[ownerEmailKey])) {
      newErrors[ownerEmailKey] = "Invalid owner email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const [companiesRes, categoriesRes, subcategoriesRes] = await Promise.all(
        [
          api.get("api/options/thirdParty/crud"),
          api.get("api/options/categories/crud"),
          api.get("api/options/subcategories/crud"),
        ],
      );

      setFilterPlaces(
        places.map((p) => ({ value: p.id.toString(), label: p.name })),
      );
      const thirdParties = companiesRes?.data?.third_parties || [];
      setCompanies(
        thirdParties.map((c) => ({
          value: c.id.toString(),
          label: c.company_name,
        })),
      );
      const fetchedCategories = categoriesRes?.data?.categories || [];
      setCategories(fetchedCategories.map((c) => c.name));
      const fetchedSubcategories = subcategoriesRes?.data?.subcategories || [];
      const subMap = {};
      fetchedCategories.forEach((cat) => {
        subMap[cat.name] = fetchedSubcategories
          .filter((s) => s.category_id === cat.id)
          .map((s) => s.name);
      });
      setCategorySubMap(subMap);
      setTypes(["Package", "Box", "Bags"]);
    } catch (error) {
      console.error("Error fetching options:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch options",
        severity: "error",
      });
      // Fallback to dummies if needed
      setCategories(["Electronics", "Clothing", "Books"]);
      setCategorySubMap({
        Electronics: ["Smartphones", "Laptops", "Accessories"],
        Clothing: ["Men's Wear", "Women's Wear", "Kids Wear"],
        Books: ["Fiction", "Non-Fiction", "Technical"],
      });
      setTypes(["Package", "Box", "Bags"]);
      setStatuses(["Created", "In Transit", "Delivered", "Cancelled"]);
      setCompanies([
        { value: "", label: "Select 3rd party company" },
        { value: "Company A", label: "Company A" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const themeColors = {
    primary: "#f58220",
    secondary: "#1a9c8f",
    background: "#f8f9fa",
    surface: "#ffffff",
    border: "#e0e0e0",
    textPrimary: "#212121",
    textSecondary: "#757575",
    success: "#4caf50",
    warning: "#ff9800",
    error: "#f44336",
  };
  // Fetch containers on mount
  useEffect(() => {
    fetchOptions();
    fetchContainers();
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);
  // Auto-expand accordions with errors

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const panelsToExpand = new Set();
      Object.keys(errors).forEach((key) => {
        if (
          [
            "senderName",
            "senderContact",
            "senderAddress",
            "senderEmail",
            "senderRef",
            "senderRemarks",
            "receiverName",
            "receiverContact",
            "receiverAddress",
            "receiverEmail",
            "receiverRef",
            "receiverRemarks",
          ].includes(key)
        )
          panelsToExpand.add("panel1");
        if (key.startsWith("receivers[") || key.startsWith("senders["))
          panelsToExpand.add("panel2");
        if (
          [
            "transportType",
            "dropMethod",
            "dropoffName",
            "dropOffCnic",
            "dropOffMobile",
            "plateNo",
            "dropDate",
            "collectionMethod",
            "fullPartial",
            "qtyDelivered",
            "clientReceiverName",
            "clientReceiverId",
            "clientReceiverMobile",
            "deliveryDate",
            "driverName",
            "driverContact",
            "driverNic",
            "driverPickupLocation",
            "truckNumber",
            "thirdPartyTransport",
          ].includes(key)
        )
          panelsToExpand.add("panel3");
      });
      setExpanded((prev) => new Set([...prev, ...panelsToExpand]));
    }
  }, [errors]);
  // Fetch all containers
  const fetchContainers = async () => {
    setLoadingContainers(true);
    try {
      const params = {
        page: 1,
        limit: 50,
      };
      const response = await api.get("/api/containers", { params });
      setContainers(response.data.data || []);
    } catch (error) {
      console.error("❌ Error fetching containers:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch containers",
        severity: "error",
      });
    } finally {
      setLoadingContainers(false);
    }
  };
  const fetchOrder = async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/orders/${id}`, {
        params: { includeContainer: true },
      });

      if (!response.data) throw new Error("Invalid response data");

      // The actual response is FLAT (as per your example)
      const orderData = response.data; // ← No .order wrapper in GET

      // Safe array parser
      const safeParseArray = (value, fallback = []) => {
        if (Array.isArray(value)) return value;
        if (!value) return fallback;
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : fallback;
          } catch (e) {
            console.warn("Failed to parse JSON array:", e.message);
            return fallback;
          }
        }
        return fallback;
      };

      // ── Parse attachments and gatepass ─────────────────────────────
      let attachments = safeParseArray(orderData.attachments);
      let gatepass = safeParseArray(orderData.gatepass);

      const apiBase = import.meta.env.VITE_API_URL || "";

      attachments = attachments
        .filter((item) => item?.url && typeof item.url === "string")
        .map((item) => (typeof item === "string" ? `${apiBase}${item}` : item));

      gatepass = gatepass
        .filter((item) => item?.url && typeof item.url === "string")
        .map((item) => (typeof item === "string" ? `${apiBase}${item}` : item));

      // ── Convert snake_case → camelCase + date formatting ───────────
      const camelData = {};

      Object.keys(orderData).forEach((key) => {
        let value = orderData[key];

        // Date fields normalization
        if (["eta", "etd", "delivery_date", "drop_date"].includes(key)) {
          if (value) {
            const date = new Date(value);
            value = !isNaN(date.getTime())
              ? date.toISOString().split("T")[0]
              : "";
          } else {
            value = "";
          }
        }

        camelData[snakeToCamel(key)] = value ?? "";
      });

      // Explicit important fields
      camelData.senderType = orderData.sender_type || "sender";
      camelData.transportType = orderData.transport_type || "Drop Off";
      camelData.collectionScope = orderData.collection_scope || "Partial";
      camelData.collectionMethod = orderData.collection_method || "";
      camelData.deliveryDate = camelData.deliveryDate || "";
      camelData.plateNo = orderData.plate_no || "";

      camelData.placeOfLoading = orderData.place_of_loading?.toString() || "";
      camelData.placeOfDelivery = orderData.place_of_delivery?.toString() || "";
      camelData.pointOfOrigin = orderData.point_of_origin?.toString() || "";
      camelData.finalDestination =
        orderData.final_destination?.toString() || "";

      // Owner fields (sender or receiver)
      const ownerPrefix =
        camelData.senderType === "sender" ? "sender" : "receiver";
      const ownerFields = [
        "name",
        "contact",
        "address",
        "email",
        "ref",
        "remarks",
      ];

      ownerFields.forEach((field) => {
        const snakeKey = `${ownerPrefix}_${field}`;
        if (orderData[snakeKey] !== undefined) {
          const camelKey = `${ownerPrefix}${field.charAt(0).toUpperCase() + field.slice(1)}`;
          camelData[camelKey] = orderData[snakeKey] || "";
        }
      });

      camelData.selectedSenderOwner = orderData.selected_sender_owner || "";

      // ── Process Receivers + Drop-off Details + ShippingDetails ─────
      const rawReceivers = orderData.receivers || [];
      const panel2Prefix =
        camelData.senderType === "sender" ? "receiver" : "sender";
      const panel2ListKey =
        camelData.senderType === "sender" ? "receivers" : "senders";

      const mappedReceivers = rawReceivers.map((rec, index) => {
        const camelRec = {
          ...initialReceiver, // or initialSenderObject depending on type
          id: rec.id,
          shippingDetails: [],
          isNew: false,
        };

        // Basic receiver fields
        Object.keys(rec).forEach((apiKey) => {
          const camelKey = snakeToCamel(apiKey);
          let val = rec[apiKey];

          if (["receiver_name", "sender_name"].includes(apiKey)) {
            camelRec[`${panel2Prefix}Name`] = val || "";
          } else if (["receiver_contact", "sender_contact"].includes(apiKey)) {
            camelRec[`${panel2Prefix}Contact`] = val || "";
          } else if (["receiver_address", "sender_address"].includes(apiKey)) {
            camelRec[`${panel2Prefix}Address`] = val || "";
          } else if (["receiver_email", "sender_email"].includes(apiKey)) {
            camelRec[`${panel2Prefix}Email`] = val || "";
          } else if (
            apiKey === "receiver_marks_and_number" ||
            apiKey === "marksAndNumber"
          ) {
            camelRec[`${panel2Prefix}MarksNumber`] = val || "";
          } else {
            camelRec[camelKey] = val ?? "";
          }
        });

        // Shipping Details
        const shippingDetailsRaw =
          rec.shippingDetails || rec.shippingdetails || [];
        camelRec.shippingDetails = shippingDetailsRaw.map((sd) => {
          const camelSd = { ...initialShippingDetail };

          Object.keys(sd).forEach((sdKey) => {
            camelSd[snakeToCamel(sdKey)] = sd[sdKey] ?? "";
          });

          // Container Details inside shipping detail
          camelSd.containerDetails = (
            sd.containerDetails ||
            sd.container_details ||
            []
          ).map((cd) => ({
            ...cd,
            totalNumber: cd.total_number ?? cd.totalNumber ?? "",
          }));

          return camelSd;
        });

        if (!camelRec.shippingDetails.length) {
          camelRec.shippingDetails = [{ ...initialShippingDetail }];
        }

        // ←←← IMPORTANT: Handle drop_off_details per receiver ←←←
        camelRec.dropOffDetails = Array.isArray(rec.drop_off_details)
          ? rec.drop_off_details.map((drop) => ({
              dropMethod: drop.drop_method || drop.dropMethod || "",
              dropoffName: drop.dropoff_name || drop.dropoffName || "",
              dropOffCnic: drop.drop_off_cnic || drop.dropOffCnic || "",
              dropOffMobile: drop.drop_off_mobile || drop.dropOffMobile || "",
              plateNo: drop.plate_no || drop.plateNo || "",
              dropDate: drop.drop_date
                ? new Date(drop.drop_date).toISOString().split("T")[0]
                : "",
            }))
          : [];

        return camelRec;
      });

      // Fallback if no receivers
      if (!mappedReceivers.length) {
        mappedReceivers.push({
          ...initialReceiver,
          shippingDetails: [{ ...initialShippingDetail }],
          isNew: true,
        });
      }

      camelData[panel2ListKey] = mappedReceivers;
      camelData.senders =
        camelData.senderType === "receiver" ? mappedReceivers : []; // adjust if needed

      // ── DropOffDetails at root level (for form state) ─────────────
      // If you use formData.dropOffDetails as object with receiverIndex as key:
      const dropOffDetailsObj = {};
      mappedReceivers.forEach((rec, index) => {
        if (rec.dropOffDetails && rec.dropOffDetails.length > 0) {
          dropOffDetailsObj[index] = rec.dropOffDetails;
        }
      });
      camelData.dropOffDetails = dropOffDetailsObj;

      // Also set selected receiver for drop off (if any has data)
      if (Object.keys(dropOffDetailsObj).length > 0) {
        camelData.selectedReceiverForDropOff =
          Object.keys(dropOffDetailsObj)[0];
      }

      setFormData(camelData);
    } catch (err) {
      console.error("[fetchOrder] Error:", err);
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error || err.message || "Failed to fetch order",
        severity: "error",
      });
      if (err.response?.status === 404) navigate("/orders");
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "transportType" && value !== prev.transportType) {
        // Clear transport-specific fields
        updated.dropMethod = "";
        updated.dropoffName = "";
        updated.dropOffCnic = "";
        updated.dropOffMobile = "";
        updated.plateNo = "";
        updated.dropDate = "";
        updated.collectionMethod = "";
        updated.clientReceiverName = "";
        updated.clientReceiverId = "";
        updated.clientReceiverMobile = "";
        updated.deliveryDate = "";
        updated.gatepass = [];
        updated.driverName = "";
        updated.driverContact = "";
        updated.driverNic = "";
        updated.driverPickupLocation = "";
        updated.truckNumber = "";
        updated.thirdPartyTransport = "";
        // Clear receiver-specific drop-off details when switching transport types
        updated.dropOffDetails = {};
        updated.selectedReceiver = "";
      }
      if (name === "dropMethod" && value === "RGSL Pickup") {
        updated.dropoffName = "";
        updated.dropOffCnic = "";
        updated.dropOffMobile = "";
      }
      if (name === "collectionMethod" && value === "Delivered by RGSL") {
        updated.clientReceiverName = "";
        updated.clientReceiverId = "";
        updated.clientReceiverMobile = "";
      }
      if (name === "senderType" && value !== prev.senderType) {
        // Clear opposite owner fields if switching
        const newPrefix = value;
        const oldPrefix = prev.senderType;
        const fields = [
          "Name",
          "Contact",
          "Address",
          "Email",
          "Ref",
          "Remarks",
        ];
        fields.forEach((key) => {
          const oldKey = `${oldPrefix}${key}`;
          if (updated[oldKey]) updated[oldKey] = "";
        });
      }
      // Handle selectedReceiver change: Clear drop-off details for previous receiver
      if (name === "selectedReceiver" && value !== prev.selectedReceiver) {
        if (
          prev.selectedReceiver !== "" &&
          updated.dropOffDetails[prev.selectedReceiver]
        ) {
          // Optionally persist or clear previous receiver's details
          delete updated.dropOffDetails[prev.selectedReceiver]; // Clear for new selection
        }
      }
      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Receiver handlers
  const addReceiver = () => {
    setFormData((prev) => ({
      ...prev,
      receivers: [
        ...prev.receivers,
        {
          ...initialReceiver,
          shippingDetails: [{ ...initialShippingDetail }],
          isNew: true,
        },
      ],
    }));
  };
  const removeReceiver = async (order) => {
    try {
      const response = await api.delete(
        `/api/orders/${orderId}/receivers/${order.id}`,
      );

      // Update local state with returned receivers list
      setFormData((prev) => ({
        ...prev,
        receivers: response.data.receivers,
      }));

      setSnackbar({
        open: true,
        message: "Receiver removed successfully",
        severity: "success",
      });
    } catch (err) {
      console.error(
        "[handleRemoveReceiver] Error:",
        err.response?.data || err.message,
      );
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Failed to remove receiver",
        severity: "error",
      });
    }
    // };
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

  const generateOrderPDF = async (order) => {
    if (!order) return;

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const brandPrimary = [13, 108, 106]; // #0d6c6a
    const brandLight = [220, 245, 243];
    let y = 30;

    // -------- HEADER --------
    const logoBase64 = await loadImageAsBase64("./logo-2.png");
    if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 4, 60, 12);

    doc.setFont("helvetica", "bold").setFontSize(16);
    doc.setTextColor(...brandPrimary);
    doc.text("ORDER DETAILS REPORT", pageWidth - margin, 10, {
      align: "right",
    });

    doc.setFont("helvetica", "normal").setFontSize(9);
    doc.text(`Booking Ref: ${order.booking_ref}`, pageWidth - margin, 17, {
      align: "right",
    });
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageWidth - margin,
      22,
      { align: "right" },
    );

    // -------- SUMMARY CARDS --------
    const cards = [
      ["Order ID", order.id],
      ["Status", order.status],
      ["Drop Method", order.drop_method],
      ["Point of Origin", order.point_of_origin],
      ["Total Assigned Qty", order.total_assigned_qty],
      ["Collection Scope", order.collection_scope],
    ];
    const cardWidth = (pageWidth - margin * 2 - 6) / 2;
    const cardHeight = 16;

    cards.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * (cardWidth + 6);
      const cardY = y + row * (cardHeight + 6);

      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(...brandLight);
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, "FD");

      doc.setFillColor(...brandPrimary);
      doc.rect(x, cardY, cardWidth, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(item[0], x + 2, cardY + 4);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(String(item[1]), x + 3, cardY + 11);
    });

    y += Math.ceil(cards.length / 2) * (cardHeight + 6) + 5;

    // -------- ORDER DETAILS --------
    const orderDetails = [
      ["Booking Ref", order.booking_ref],
      ["RGL Booking #", order.rgl_booking_number],
      ["Place of Loading", order.place_of_loading],
      ["Final Destination", order.final_destination],
      ["Place of Delivery", order.place_of_delivery],
      ["ETA", order.eta || "N/A"],
      ["ETD", order.etd || "N/A"],
      ["Shipping Line", order.shipping_line || "N/A"],
      ["Plate No", order.plate_no],
      ["Drop Off CNIC", order.drop_off_cnic],
      ["Drop Off Mobile", order.drop_off_mobile],
      [
        "Drop Date",
        order.drop_date ? new Date(order.drop_date).toLocaleString() : "N/A",
      ],
    ];

    const drawKeyValueSection = (y, title, details) => {
      doc.setFont("helvetica", "bold").setFontSize(14);
      doc.setTextColor(...brandPrimary);
      doc.text(title, margin, y);
      y += 4;

      doc.setDrawColor(...brandPrimary);
      doc.setLineWidth(0.6);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      const colWidth = (pageWidth - margin * 2 - 10) / 2;
      const rowHeight = 8;

      details.forEach((pair, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + col * (colWidth + 10);
        const dy = y + row * rowHeight;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...brandPrimary);
        doc.text(pair[0], x, dy);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text(String(pair[1] || "N/A"), x, dy + 4);
      });

      return y + Math.ceil(details.length / 2) * rowHeight + 6;
    };

    y = drawKeyValueSection(y, "ORDER INFORMATION", orderDetails);

    // -------- SENDER DETAILS --------
    const senderDetails = [
      ["Sender Name", order.sender_name],
      ["Contact Number", order.sender_contact],
      ["Email", order.sender_email],
      ["Address", order.sender_address],
      ["Sender Ref", order.sender_ref],
      ["Sender Remarks", order.sender_remarks],
      ["Selected Sender Owner", order.selected_sender_owner],
    ];
    y = drawKeyValueSection(y, "SENDER INFORMATION", senderDetails);

    // -------- RECEIVERS TABLE --------
    if (order.receivers?.length) {
      doc.setFont("helvetica", "bold").setFontSize(14);
      doc.setTextColor(...brandPrimary);
      doc.text("RECEIVERS", margin, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [
          [
            "Receiver",
            "Status",
            "Consignment #",
            "Qty",
            "Weight",
            "Contact",
            "Address",
            "Containers",
          ],
        ],
        body: order.receivers.map((r) => [
          r.receiver_name,
          r.status,
          r.consignment_number,
          r.total_number,
          r.total_weight,
          r.receiver_contact,
          r.receiver_address,
          r.containers?.map((c) => c.join(", ")).join("; ") || "N/A",
        ]),
        headStyles: { fillColor: brandPrimary, textColor: 255 },
        bodyStyles: { fontSize: 9, cellPadding: 3 },
        margin: { left: margin, right: margin },
      });

      y = doc.lastAutoTable.finalY + 6;

      // -------- RECEIVER SHIPPING DETAILS TABLE --------
      for (const receiver of order.receivers) {
        if (!receiver.shippingDetails?.length) continue;

        doc.setFont("helvetica", "bold").setFontSize(12);
        doc.setTextColor(...brandPrimary);
        doc.text(`Products Details for: ${receiver.receiver_name}`, margin, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [
            [
              "Category",
              "Subcategory",
              "Type",
              "Total #",
              "Weight",
              "Pickup",
              "Delivery",
              "Item Ref",
              "Assigned Qty",
            ],
          ],
          body: receiver.shippingDetails.map((s) => [
            s.category,
            s.subcategory,
            s.type,
            s.totalNumber,
            s.weight,
            s.pickupLocation,
            s.deliveryAddress,
            s.itemRef,
            s.assignedQty,
          ]),
          headStyles: { fillColor: brandPrimary, textColor: 255 },
          bodyStyles: { fontSize: 9, cellPadding: 3 },
          margin: { left: margin, right: margin },
        });

        y = doc.lastAutoTable.finalY + 6;
      }
    }

    // -------- REMARKS --------
    const drawBoxText = (y, title, text) => {
      if (!text) return y;

      const boxHeight = 20;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margin, y, pageWidth - margin * 2, boxHeight, 2, 2, "F");

      doc.setFont("helvetica", "bold").setFontSize(10);
      doc.setTextColor(...brandPrimary);
      doc.text(title, margin + 3, y + 6);

      doc.setFont("helvetica", "normal").setFontSize(9);
      doc.setTextColor(50, 50, 50);
      const wrapped = doc.splitTextToSize(text, pageWidth - margin * 2 - 6);
      doc.text(wrapped, margin + 3, y + 11);

      return y + boxHeight + 6;
    };

    y = drawBoxText(y, "Order Remarks", order.order_remarks);

    // -------- ATTACHMENTS --------
    const attachmentsText = order.attachments?.length
      ? order.attachments.join(", ")
      : "None";
    y = drawBoxText(y, "Attachments", attachmentsText);

    // -------- FOOTER --------
    const footerY = 275;
    doc.setDrawColor(...brandPrimary);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFont("helvetica", "normal").setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, footerY + 6);
    doc.text(
      `Page ${doc.getCurrentPageInfo().pageNumber}`,
      pageWidth - margin,
      footerY + 6,
      { align: "right" },
    );

    // -------- SAVE PDF --------
    doc.save(`Order_${order.booking_ref || "Unknown"}.pdf`);
  };

  const getPlaceName = (placeId) => {
    if (!placeId) return "N/A";
    const idStr = placeId.toString();
    const place = filterPlaces.find(
      (p) => p.value === idStr || p.id === placeId,
    );
    return place ? place.label : `ID: ${placeId}`;
  };
  const generateReceiptPDF = async (order) => {
    if (!order) return;

    try {
      // Check libraries
      if (typeof jsPDF === "undefined" || typeof html2canvas === "undefined") {
        console.error("Required libraries not loaded");
        return;
      }

      // Create HTML template (ab yeh async function hai)
      const htmlContent = await createReceiptHTML(order);

      // Create temporary div
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = "fixed";
      tempDiv.style.left = "-10000px";
      tempDiv.style.top = "0";
      tempDiv.style.width = "210mm";
      tempDiv.style.backgroundColor = "#ffffff";
      document.body.appendChild(tempDiv);

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Clean up
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        imgWidth,
        imgHeight,
      );

      // Save PDF
      const fileName = `Receipt_${order.booking_ref || order.id || "order"}_${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  };
  // Function to create dynamic HTML content
  const createReceiptHTML = async (order) => {
    const logoBase64 = await loadImageAsBase64(logoPic);

    // Helper function to format date
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

    // Format current date and time
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

    // Extract data from order object based on your response structure
    const senderName = order.sender_name || "N/A";
    const senderContact = order.sender_contact || "N/A";
    const senderEmail = order.sender_email || "N/A";
    const senderRef = order.sender_ref || "N/A";

    // Get first receiver data
    const receiver =
      order.receivers && order.receivers[0] ? order.receivers[0] : {};
    const receiverName = receiver.receiver_name || "N/A";
    const receiverContact = receiver.receiver_contact || "N/A";
    const receiverAddress = receiver.receiver_address || "N/A";
    const receiverEmail = receiver.receiver_email || "N/A";

    // Get shipping details
    const shippingDetails =
      receiver.shippingDetails || receiver.shippingdetails || [];

    // Calculate totals
    let totalQty = 0;
    let totalWeight = 0;

    shippingDetails.forEach((item) => {
      totalQty += parseInt(item.totalNumber || 0);
      totalWeight += parseFloat(item.weight || 0);
    });

    // If no shipping details, use receiver totals
    if (shippingDetails.length === 0) {
      totalQty = parseInt(receiver.total_number || 0);
      totalWeight = parseFloat(receiver.total_weight || 0);
    }

    // Get container info
    const containers = receiver.containers || [];
    const containerInfo = containers.length > 0 ? containers[0] : "N/A";

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                color: #333;
                line-height: 1.3;
                margin: 0;
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

            /* Top Banner */
            .top-banner {
                background-color: #1a4731;
                color: white;
                text-align: center;
                padding: 10px;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 2px;
                margin-bottom: 20px;
            }

            /* Header Section */
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

            /* Titles */
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

            /* Tables */
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

            /* Small Text Sections */
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

            /* Footer */
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

            /* Order Items Table */
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

            /* Signature Section */
            .signature-section {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
            }

            .signature-box {
                text-align: center;
                border-top: 1px solid #333;
                padding-top: 10px;
                width: 45%;
            }

            /* Print-specific styles */
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
                            <img src="${logoBase64 || ""}" alt="Company Logo">

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
                        Passport No: <br>
                        CNIC: <br>
                        Tel: ${senderContact}<br>
                        E-Mail: ${senderEmail}
                    </td>
                    <td>
                        <strong>${receiverName}</strong><br><br>
                        Contact Person: ${receiverName}<br>
                        Passport No: <br>
                        Emirates ID: <br>
                        Tel: ${receiverContact}<br>
                        E-Mail: ${receiverEmail}
                    </td>
                </tr>
            </table>

            <div class="small-red-text">
                This paper serves as a legal responsibility of sender & receiver for the contents of the cargo being shipped
                through the company Royal Gulf Shipping & Logistics LLC. The Sender and Receiver will be responsible for any
                loss/ damage which results in case of any prohibited items attempted to be shipped through this order.
            </div>

            <div class="order-title">ACKNOWLEDGMENT AND ACCEPTANCE OF ORDER</div>

            <div class="order-info-bar">
                <div><u> Order Date:</u> <span>${formatDate(order.created_at)}</span></div>
                <div><u> Order Number:</u> <span>${order.booking_ref}</span></div>
                <div><u> Customer No:</u> <span>${order.rgl_booking_number}</span></div>
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
                    <td>${item.category || "N/A"}</td>
                    <td style="text-align: center;">${order.booking_ref || "N/A"}</td>
                    <td>${order.rgl_booking_number || "N/A"}</td>
                    <td>${getPlaceName(order.place_of_loading) || "N/A"}</td>
                    <td>${getPlaceName(order.final_destination) || "N/A"}</td>
                </tr>
                `,
                        )
                        .join("")
                    : `
                <tr>
                    <td style="text-align: center;">${totalQty || 0}</td>
                    <td>General Items</td>
                    <td style="text-align: center;">${order.booking_ref || "N/A"}</td>
                    <td>${containerInfo}</td>
                    <td>${order.place_of_loading || "N/A"}</td>
                    <td>${order.final_destination || "N/A"}</td>
                </tr>
                `
                }
                <tr class="total-row">
                    <td style="text-align: center;">${totalQty}</td>
                    <td colspan="5">TOTAL PACKAGES: ${totalQty} | TOTAL WEIGHT: ${totalWeight} kg</td>
                </tr>
            </table>

            <div class="dated-text" style="text-decoration: underline;">Mode: ${order.transport_type || "Drop Off"}</div>

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
                    <strong>Sender's Signature</strong><br>
                    ${senderName}
                </div>
                <div class="signature-box">
                    <strong>Receiver's Signature</strong><br>
                    ${receiverName}
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

  const duplicateReceiver = (index) => {
    setFormData((prev) => ({
      ...prev,
      receivers: [
        ...prev.receivers.slice(0, index + 1),
        {
          ...prev.receivers[index],
          shippingDetails: prev.receivers[index].shippingDetails.map((sd) => ({
            ...sd,
          })),
          isNew: true,
        },
        ...prev.receivers.slice(index + 1),
      ],
    }));
  };
  const handleReceiverChange = (index, field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      receivers: prev.receivers.map((rec, i) =>
        i === index ? { ...rec, [field]: value } : rec,
      ),
    }));
    const errorKey = `receivers[${index}].${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr[errorKey];
        return newErr;
      });
    }
  };
  const handleReceiverShippingChange = (index, j, field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => {
      const rec = prev.receivers[index];
      const oldSd = rec.shippingDetails[j] || {};
      const updatedSd = { ...oldSd, [field]: value };
      if (field === "category" && value !== oldSd.category) {
        updatedSd.subcategory = "";
      }
      let updatedReceivers = prev.receivers;
      if (field === "status") {
        const matched = rawStatuses.find((s) => s.order_status === value);
        if (matched?.days_offset != null) {
          const eta = new Date();
          eta.setDate(eta.getDate() + matched.days_offset);
          const etaStr = eta.toISOString().split("T")[0];
          updatedReceivers = prev.receivers.map((r, i) =>
            i === index ? { ...r, eta: etaStr } : r,
          );
        }
      }
      return {
        ...prev,
        receivers: updatedReceivers.map((r, i) =>
          i === index
            ? {
                ...r,
                shippingDetails: r.shippingDetails.map((sd, k) =>
                  k === j ? updatedSd : sd,
                ),
              }
            : r,
        ),
      };
    });
    const errorKey = `receivers[${index}].shippingDetails[${j}].${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr[errorKey];
        return newErr;
      });
    }
  };

  const handleReceiverPartialChange = (index, field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => {
      const rec = prev.receivers[index];
      const updated = { ...rec, [field]: value };
      if (field === "fullPartial" && value === "Full") {
        updated.qtyDelivered = "";
      }
      return {
        ...prev,
        receivers: prev.receivers.map((r, i) => (i === index ? updated : r)),
      };
    });
    const errorKey = `receivers[${index}].${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr[errorKey];
        return newErr;
      });
    }
  };
  const addReceiverShipping = (index) => {
    setFormData((prev) => ({
      ...prev,
      receivers: prev.receivers.map((r, i) =>
        i === index
          ? {
              ...r,
              shippingDetails: [
                ...(r.shippingDetails || []),
                { ...initialShippingDetail },
              ],
            }
          : r,
      ),
    }));
  };
  const duplicateReceiverShipping = (index, j) => {
    const toDuplicate = formData.receivers[index].shippingDetails[j];
    setFormData((prev) => ({
      ...prev,
      receivers: prev.receivers.map((r, i) =>
        i === index
          ? {
              ...r,
              shippingDetails: [
                ...r.shippingDetails.slice(0, j + 1),
                { ...toDuplicate },
                ...r.shippingDetails.slice(j + 1),
              ],
            }
          : r,
      ),
    }));
  };

  const removeReceiverShipping = async (index, j) => {
    const receiver = formData.receivers[index];
    const shippingDetail = receiver?.shippingDetails?.[j];

    // If item exists in DB, delete it via API
    if (shippingDetail?.id) {
      try {
        await api.delete(
          `/api/orders/${orderId}/order-items/${shippingDetail.id}`,
        );
      } catch (err) {
        console.error(
          "[removeReceiverShipping] Failed to delete from DB:",
          err.response?.data || err.message,
        );
        setSnackbar({
          open: true,
          message:
            err.response?.data?.error || "Failed to remove shipping detail",
          severity: "error",
        });
        return; // Don't update local state if DB delete failed
      }
    }

    // Update local state
    setFormData((prev) => ({
      ...prev,
      receivers: prev.receivers.map((r, i) =>
        i === index
          ? {
              ...r,
              shippingDetails: r.shippingDetails.filter((_, k) => k !== j),
            }
          : r,
      ),
    }));
  };
  // Frontend: handleSaveShipping function (add this to your AddOrder.jsx component)
  // This function saves/updates shipping details for a specific receiver index without full form submission
  // It can be called on the "Save" button click for shipping section
  const handleSaveShipping = async (index) => {
    if (!validateShippingDetails(index)) {
      setSnackbar({
        open: true,
        message: "Please fix shipping detail errors",
        severity: "error",
      });
      return;
    }
    setLoading(true);
    const formDataToSend = new FormData();
    // Dynamic panel2
    const panel2FieldPrefix =
      formData.senderType === "sender" ? "receiver" : "sender";
    const listKey = formData.senderType === "sender" ? "receivers" : "senders";
    const currentList = formData[listKey];
    const itemData = currentList[index];
    const snakeRec = {
      [`${panel2FieldPrefix}_name`]:
        formData.senderType === "sender"
          ? itemData.receiverName || ""
          : itemData.senderName || "",
      [`${panel2FieldPrefix}_contact`]:
        formData.senderType === "sender"
          ? itemData.receiverContact || ""
          : itemData.senderContact || "",
      [`${panel2FieldPrefix}_address`]:
        formData.senderType === "sender"
          ? itemData.receiverAddress || ""
          : itemData.senderAddress || "",
      [`${panel2FieldPrefix}_email`]:
        formData.senderType === "sender"
          ? itemData.receiverEmail || ""
          : itemData.senderEmail || "",
      eta: itemData.eta || "",
      etd: itemData.etd || "",
      remarks: itemData.remarks || "",
      shipping_line: itemData.shippingLine || "",
    };
    // Append panel2 data as JSON
    formDataToSend.append(`${panel2FieldPrefix}s`, JSON.stringify([snakeRec]));
    // Append shipping details as order_items flat list for this item
    const orderItemsToSend = (itemData.shippingDetails || []).map((sd, j) => {
      const snakeItem = {};
      Object.keys(sd).forEach((key) => {
        if (key !== "remainingItems") {
          const snakeKey = camelToSnake(key);
          snakeItem[snakeKey] = sd[key] || "";
        }
      });
      snakeItem.item_ref = `ORDER-ITEM-REF-${index + 1}-${j + 1}-${Date.now()}`;
      return snakeItem;
    });
    formDataToSend.append("order_items", JSON.stringify(orderItemsToSend));
    // Append order_id for update
    formDataToSend.append("order_id", orderId);
    try {
      const response = await api.put(
        `/api/orders/${orderId}/shipping`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      // Update local formData with response if needed
      if (response.data.success) {
        // Optionally refetch full order or update local state
        await fetchOrder(orderId);
        setSnackbar({
          open: true,
          message: "Shipping details saved successfully",
          severity: "success",
        });
      }
    } catch (err) {
      console.error(
        "[handleSaveShipping] Error:",
        err.response?.data || err.message,
      );
      const backendMsg =
        err.response?.data?.error ||
        err.message ||
        "Failed to save shipping details";
      setSnackbar({
        open: true,
        message: `Error: ${backendMsg}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  // Validation helper for shipping details (add this too)
  const validateShippingDetails = (index) => {
    const panel2FieldPrefix =
      formData.senderType === "sender" ? "receiver" : "sender";
    const listKey = formData.senderType === "sender" ? "receivers" : "senders";
    const currentList = formData[listKey];
    const itemData = currentList[index];
    const shippingDetails = itemData.shippingDetails || [];
    let isValid = true;
    const newErrors = { ...errors };
    // Validate item level
    const nameField =
      formData.senderType === "sender" ? "receiverName" : "senderName";
    if (!itemData[nameField]?.trim()) {
      newErrors[`${listKey}[${index}].${nameField}`] =
        `${panel2FieldPrefix} name required`;
      isValid = false;
    }
    if (!itemData.eta) {
      newErrors[`${listKey}[${index}].eta`] = "ETA required";
      isValid = false;
    }
    if (!itemData.etd) {
      newErrors[`${listKey}[${index}].etd`] = "ETD required";
      isValid = false;
    }
    // Validate each shipping detail
    shippingDetails.forEach((sd, j) => {
      if (!sd.pickupLocation?.trim()) {
        newErrors[`${listKey}[${index}].shippingDetails[${j}].pickupLocation`] =
          "Pickup location required";
        isValid = false;
      }
      if (!sd.category?.trim()) {
        newErrors[`${listKey}[${index}].shippingDetails[${j}].category`] =
          "Category required";
        isValid = false;
      }
      if (!sd.subcategory?.trim()) {
        newErrors[`${listKey}[${index}].shippingDetails[${j}].subcategory`] =
          "Subcategory required";
        isValid = false;
      }
      if (!sd.type?.trim()) {
        newErrors[`${listKey}[${index}].shippingDetails[${j}].type`] =
          "Type required";
        isValid = false;
      }
      if (!sd.deliveryAddress?.trim()) {
        newErrors[
          `${listKey}[${index}].shippingDetails[${j}].deliveryAddress`
        ] = "Delivery address required";
        isValid = false;
      }
      // const totalNum = parseInt(sd.totalNumber || 0);
      // if (!sd.totalNumber || totalNum <= 0) {
      //     newErrors[`${listKey}[${index}].shippingDetails[${j}].totalNumber`] = 'Total number must be positive';
      //     isValid = false;
      // }
      const weight = parseFloat(sd.weight || 0);
      if (!sd.weight || weight <= 0) {
        newErrors[`${listKey}[${index}].shippingDetails[${j}].weight`] =
          "Weight must be positive";
        isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    if (!isEditMode && !formData.transportType) {
      setFormData((prev) => ({ ...prev, transportType: "Drop Off" }));
    }
  }, [isEditMode]);

  const addSender = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      senders: [
        ...prev.senders,
        {
          ...initialSenderObject,
          shippingDetails: [{ ...initialShippingDetail }],
        },
      ],
    }));
  }, []);
  const removeSender = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      senders: prev.senders.filter((_, i) => i !== index),
    }));
  }, []);
  const duplicateSender = useCallback(
    (index) => {
      const toDuplicate = formData.senders[index];
      setFormData((prev) => ({
        ...prev,
        senders: [
          ...prev.senders.slice(0, index + 1),
          {
            ...toDuplicate,
            shippingDetails: toDuplicate.shippingDetails.map((sd) => ({
              ...sd,
            })),
            id: Date.now(),
          },
          ...prev.senders.slice(index + 1),
        ],
      }));
    },
    [formData.senders],
  );
  const handleSenderChange = useCallback(
    (index, field) => (event) => {
      const value = event.target.value;
      setFormData((prev) => ({
        ...prev,
        senders: prev.senders.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      }));
      const errorKey = `senders[${index}].${field}`;
      if (errors[errorKey]) {
        setErrors((prev) => ({ ...prev, [errorKey]: "" }));
      }
    },
    [errors],
  );

  const handleSenderShippingChange = useCallback(
    (index, j, field) => (event) => {
      const value = event.target.value;
      setFormData((prev) => {
        let updatedSenders = prev.senders.map((item, i) =>
          i === index
            ? {
                ...item,
                shippingDetails: item.shippingDetails.map((sd, k) =>
                  k === j ? { ...sd, [field]: value } : sd,
                ),
              }
            : item,
        );
        if (field === "status") {
          const matched = rawStatuses.find((s) => s.order_status === value);
          if (matched?.days_offset != null) {
            const eta = new Date();
            eta.setDate(eta.getDate() + matched.days_offset);
            const etaStr = eta.toISOString().split("T")[0];
            updatedSenders = updatedSenders.map((r, i) =>
              i === index ? { ...r, eta: etaStr } : r,
            );
          }
        }
        return { ...prev, senders: updatedSenders };
      });
      const errorKey = `senders[${index}].shippingDetails[${j}].${field}`;
      if (errors[errorKey]) {
        setErrors((prev) => ({ ...prev, [errorKey]: "" }));
      }
    },
    [errors, rawStatuses],
  );
  const handleSenderPartialChange = useCallback(
    (index, field) => (event) => {
      const value = event.target.value;
      setFormData((prev) => ({
        ...prev,
        senders: prev.senders.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      }));
      const errorKey = `senders[${index}].${field}`;
      if (errors[errorKey]) {
        setErrors((prev) => ({ ...prev, [errorKey]: "" }));
      }
    },
    [errors],
  );
  const addSenderShipping = (index) => {
    setFormData((prev) => ({
      ...prev,
      senders: prev.senders.map((r, i) =>
        i === index
          ? {
              ...r,
              shippingDetails: [
                ...(r.shippingDetails || []),
                { ...initialShippingDetail },
              ],
            }
          : r,
      ),
    }));
  };
  const duplicateSenderShipping = (index, j) => {
    const toDuplicate = formData.senders[index].shippingDetails[j];
    setFormData((prev) => ({
      ...prev,
      senders: prev.senders.map((r, i) =>
        i === index
          ? {
              ...r,
              shippingDetails: [
                ...r.shippingDetails.slice(0, j + 1),
                { ...toDuplicate },
                ...r.shippingDetails.slice(j + 1),
              ],
            }
          : r,
      ),
    }));
  };
  const removeSenderShipping = (index, j) => {
    setFormData((prev) => ({
      ...prev,
      senders: prev.senders.map((r, i) =>
        i === index
          ? {
              ...r,
              shippingDetails: r.shippingDetails.filter((_, k) => k !== j),
            }
          : r,
      ),
    }));
  };
  const handleReceiverContainersChange = (index) => (event) => {
    // Removed containers, placeholder
  };
  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.add(panel);
      } else {
        newSet.delete(panel);
      }
      return newSet;
    });
  };
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      attachments: [
        ...(Array.isArray(prev.attachments) ? prev.attachments : []),
        ...files,
      ],
    }));
  };
  const handleGatepassUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      gatepass: [
        ...(Array.isArray(prev.gatepass) ? prev.gatepass : []),
        ...files,
      ],
    }));
  };

  const handleSave = async () => {
    setLoading(true);

    const formDataToSend = new FormData();
    const dateFields = ["eta", "etd", "dropDate", "deliveryDate"];

    // ── 1. Core Order Fields ─────────────────────────────────────
    const coreFields = {
      booking_ref: formData.bookingRef,
      rgl_booking_number: formData.rglBookingNumber,
      place_of_loading: formData.placeOfLoading,
      point_of_origin: formData.pointOfOrigin,
      final_destination: formData.finalDestination,
      place_of_delivery: formData.placeOfDelivery,
      order_remarks: formData.orderRemarks,
      eta: formData.eta,
      etd: formData.etd,
      sender_type: formData.senderType,
      selected_sender_owner: formData.selectedSenderOwner || "",
    };

    Object.entries(coreFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (dateFields.includes(key) && value === "") {
          return; // skip empty dates
        }
        formDataToSend.append(key, value);
      }
    });

    // ── 2. Sender / Owner Fields ─────────────────────────────────
    const ownerPrefix =
      formData.senderType === "sender" ? "sender" : "receiver";
    const ownerFields = [
      "Name",
      "Contact",
      "Address",
      "Email",
      "Ref",
      "Remarks",
    ];

    ownerFields.forEach((field) => {
      const value = formData[`${ownerPrefix}${field}`] || "";
      formDataToSend.append(`${ownerPrefix}_${field.toLowerCase()}`, value);
    });

    // ── 3. Panel 2: Receivers / Senders ──────────────────────────
    const panel2Items =
      formData.senderType === "receiver"
        ? formData.senders
        : formData.receivers;
    const panel2FieldPrefix =
      formData.senderType === "sender" ? "receiver" : "sender";
    const panel2ArrayKey = `${panel2FieldPrefix}s`;

    const panel2ToSend = panel2Items.map((item) => ({
      id: item.id || null,
      [`${panel2FieldPrefix}_name`]:
        formData.senderType === "sender"
          ? item.receiverName || ""
          : item.senderName || "",
      [`${panel2FieldPrefix}_contact`]:
        formData.senderType === "sender"
          ? item.receiverContact || ""
          : item.senderContact || "",
      [`${panel2FieldPrefix}_address`]:
        formData.senderType === "sender"
          ? item.receiverAddress || ""
          : item.senderAddress || "",
      [`${panel2FieldPrefix}_email`]:
        formData.senderType === "sender"
          ? item.receiverEmail || ""
          : item.senderEmail || "",
      [`${panel2FieldPrefix}_marks_and_number`]:
        item[`${panel2FieldPrefix}MarksNumber`] || "",
      eta: item.eta || "",
      etd: item.etd || "",
      shipping_line: item.shippingLine || "",
      full_partial: item.fullPartial || "Full",
      qty_delivered: item.qtyDelivered || "",
      status: item.status || firstStatus?.order_status,
      remarks: item.remarks || "",
      containers: Array.isArray(item.containers) ? item.containers.flat() : [],
    }));

    formDataToSend.append(panel2ArrayKey, JSON.stringify(panel2ToSend));

    // ── 4. Order Items ───────────────────────────────────────────
    const orderItemsToSend = [];
    panel2Items.forEach((item, receiverIndex) => {
      (item.shippingDetails || []).forEach((sd, j) => {
        const snakeItem = {};

        Object.keys(sd).forEach((key) => {
          if (key !== "remainingItems" && key !== "containerDetails") {
            snakeItem[camelToSnake(key)] = sd[key] || "";
          }
        });

        // Handle container details
        snakeItem.container_details = (sd.containerDetails || []).map((cd) => {
          const snakeCd = {};
          Object.keys(cd).forEach((ck) => {
            snakeCd[camelToSnake(ck)] = cd[ck];
          });
          return snakeCd;
        });

        snakeItem.item_ref =
          sd.itemRef ||
          sd.item_ref ||
          `ORDER-ITEM-REF-${receiverIndex + 1}-${j + 1}-${Date.now()}`;
        snakeItem.existing_id = sd.id || null;
        snakeItem.receiver_index = receiverIndex;

        orderItemsToSend.push(snakeItem);
      });
    });

    formDataToSend.append("order_items", JSON.stringify(orderItemsToSend));

    // ── 5. Transport Fields ──────────────────────────────────────
    const transportFields = {
      transport_type: formData.transportType || "Drop Off",
      collection_scope: formData.collection_scope || "Partial",
      collection_method: formData.collectionMethod || "",
      third_party_transport: formData.thirdPartyTransport || "",
      driver_name: formData.driverName || "",
      driver_contact: formData.driverContact || "",
      driver_nic: formData.driverNic || "",
      driver_pickup_location: formData.driverPickupLocation || "",
      truck_number: formData.truckNumber || "",
      client_receiver_name: formData.clientReceiverName || "",
      client_receiver_id: formData.clientReceiverId || "",
      client_receiver_mobile: formData.clientReceiverMobile || "",
      delivery_date: formData.deliveryDate || "",
      plate_no: formData.plateNo || "",
    };

    Object.entries(transportFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (dateFields.includes(key.replace("_", "")) && value === "") return;
        formDataToSend.append(key, value);
      }
    });

    // ── 6. Drop Off Details (Flattened) ──────────────────────────
    const flattenedDropOffDetails = [];

    if (
      formData.dropOffDetails &&
      typeof formData.dropOffDetails === "object"
    ) {
      Object.keys(formData.dropOffDetails).forEach((receiverIndex) => {
        const entries = formData.dropOffDetails[receiverIndex];
        if (Array.isArray(entries) && entries.length > 0) {
          entries.forEach((detail) => {
            flattenedDropOffDetails.push({
              receiver_index: receiverIndex,
              drop_method: detail.dropMethod || null,
              dropoff_name: detail.dropoffName || null,
              drop_off_cnic: detail.dropOffCnic || null,
              drop_off_mobile: detail.dropOffMobile || null,
              plate_no: detail.plateNo || null,
              drop_date: detail.dropDate || null,
            });
          });
        }
      });
    }

    formDataToSend.append(
      "drop_off_details",
      JSON.stringify(flattenedDropOffDetails),
    );

    // ── 7. Attachments & Gatepass ────────────────────────────────
    ["attachments", "gatepass"].forEach((key) => {
      const value = formData[key];
      if (Array.isArray(value) && value.length > 0) {
        const newFiles = value.filter((item) => item instanceof File);
        const existing = value.filter((item) => !(item instanceof File));

        // Append new files
        newFiles.forEach((file) => {
          formDataToSend.append(key, file);
        });

        // Append existing files metadata
        if (existing.length > 0) {
          formDataToSend.append(
            `${camelToSnake(key)}_existing`,
            JSON.stringify(existing),
          );
        }
      }
    });

    try {
      const endpoint = isEditMode ? `/api/orders/${orderId}` : "/api/orders";
      const method = isEditMode ? "put" : "post";

      const response = await api[method](endpoint, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (isEditMode) {
        await fetchOrder(orderId);
      } else {
        navigate("/orders");
      }

      setSnackbar({
        open: true,
        message: isEditMode
          ? "Order updated successfully"
          : "Order created successfully",
        severity: "success",
      });
    } catch (err) {
      console.error("[handleSave] Error:", err.response?.data || err.message);
      const backendMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to save order";

      setSnackbar({
        open: true,
        message: `Error: ${backendMsg}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = () => {
    navigate(-1);
  };
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };
  const isFieldDisabled = (name) => {
    if (!isEditMode) {
      if (name === "bookingRef") return true;
      return false;
    }
    if (name.startsWith("receivers[") || name.startsWith("senders[")) {
      // For new items, editable
      const match = name.match(/(receivers|senders)\[(\d+)\]\.(.+)/);
      if (match) {
        const list =
          match[1] === "receivers" ? formData.receivers : formData.senders;
        const idx = parseInt(match[2]);
        const item = list[idx];
        if (item?.isNew) return false;
      }
      return !editableInEdit.some((e) =>
        name.includes(
          e
            .replace("receivers[].", "")
            .replace("receivers[", "")
            .replace("senders[].", "")
            .replace("senders[", ""),
        ),
      );
    }
    return !editableInEdit.includes(name);
  };

  if (loading) {
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
  const firstPanel2Item =
    (formData.senderType === "sender"
      ? formData.receivers
      : formData.senders)[0] || {};
  const ownerName =
    formData.senderType === "sender"
      ? formData.senderName
      : formData.receiverName;
  return (
    <>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
        <Box sx={{ p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
            className="MuiStack-root css-twoet5"
            sx={{
              position: "sticky",
              zIndex: 9999,
              top: 63,
              background: "white",
              p: 2,
            }}
          >
            <Typography variant="h4" fontWeight="bold" color="#f58220">
              {isEditMode ? "Edit" : "New"} Order Details
            </Typography>
            <Stack
              direction="row"
              sx={{
                position: "sticky",
                zIndex: 9999,
                top: 63,
                background: "white",
              }}
              gap={1}
            >
              <Button
                variant="outlined"
                onClick={handleCancel}
                sx={{
                  borderRadius: 2,
                  borderColor: "#f58220",
                  color: "#f58220",
                  px: 3,
                }}
                disabled={loading}
              >
                CANCEL
              </Button>
              <Button
                variant="contained"
                onClick={() => handleSave()}
                sx={{
                  borderRadius: 2,
                  backgroundColor: "#0d6c6a",
                  color: "#fff",
                  px: 3,
                  "&:hover": { backgroundColor: "#0d6c6a" },
                }}
                disabled={loading}
              >
                {loading ? "Saving..." : "SAVE"}
              </Button>
            </Stack>
          </Stack>
          {/* Top Order Fields */}
          <Stack spacing={3} mb={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: "stretch",
              }}
            >
              <CustomTextField
                label="Booking Ref"
                name="bookingRef"
                value={formData.bookingRef}
                onChange={handleChange}
                error={!!errors.bookingRef}
                helperText={errors.bookingRef}
                disabled={isFieldDisabled("bookingRef")}
              />
              <CustomTextField
                label="RGSL Booking Number"
                name="rglBookingNumber"
                value={formData.rglBookingNumber}
                onChange={handleChange}
                error={!!errors.rglBookingNumber}
                helperText={errors.rglBookingNumber}
                required
                disabled={isFieldDisabled("rglBookingNumber")}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: "stretch",
              }}
            >
              <CustomSelect
                label="Point of Origin"
                name="pointOfOrigin"
                value={
                  formData.pointOfOrigin ||
                  filterPlaces.find((p) => p.label === "Karachi")?.value ||
                  ""
                }
                onChange={handleChange}
                error={!!errors.pointOfOrigin}
                required
                renderValue={(selected) =>
                  filterPlaces.find((p) => p.value === selected)?.label ||
                  "Karachi"
                }
              >
                {filterPlaces.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </CustomSelect>
              <CustomSelect
                label="Place of Loading"
                name="placeOfLoading"
                value={formData.placeOfLoading || ""}
                onChange={handleChange}
                error={!!errors.placeOfLoading}
                required
                renderValue={(selected) =>
                  filterPlaces.find((p) => p.value === selected)?.label ||
                  "Select Place of Loading"
                }
              >
                {filterPlaces.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </CustomSelect>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: "stretch",
              }}
            >
              <CustomSelect
                label="Place of Delivery"
                name="placeOfDelivery"
                value={formData.placeOfDelivery || ""}
                onChange={handleChange}
                error={!!errors.placeOfDelivery}
                required
                renderValue={(selected) =>
                  filterPlaces.find((p) => p.value === selected)?.label ||
                  "Select Place of Delivery"
                }
              >
                {filterPlaces.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </CustomSelect>
              <CustomSelect
                label="Final Destination"
                name="finalDestination"
                value={
                  formData.finalDestination ||
                  filterPlaces.find((p) => p.label === "Dubai")?.value ||
                  ""
                }
                onChange={handleChange}
                error={!!errors.finalDestination}
                required
                renderValue={(selected) =>
                  filterPlaces.find((p) => p.value === selected)?.label ||
                  "Dubai"
                }
              >
                {filterPlaces.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </CustomSelect>
            </Box>
            <CustomTextField
              label="Order Remarks"
              name="orderRemarks"
              value={formData.orderRemarks}
              onChange={handleChange}
              error={!!errors.orderRemarks}
              helperText={errors.orderRemarks}
              fullWidth
              multiline
              rows={2}
              disabled={isFieldDisabled("orderRemarks")}
            />
          </Stack>
          <Divider sx={{ my: 3, borderColor: "#e0e0e0" }} />
          {/* Accordion Sections */}
          <Stack spacing={2}>
            <Accordion
              expanded={expanded.has("panel1")}
              onChange={handleAccordionChange("panel1")}
              sx={{
                borderRadius: 2,
                boxShadow: "none",
                "&:before": { display: "none" },
                "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: expanded.has("panel1") ? "#0d6c6a" : "#fff3e0",
                  borderRadius: 2,
                  "& .MuiAccordionSummary-content": {
                    fontWeight: "bold",
                    color: expanded.has("panel1") ? "#fff" : "#f58220",
                  },
                }}
              >
                1. Owner Details
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                <Stack spacing={2}>
                  {(() => {
                    const ownerNameKey =
                      formData.senderType === "sender"
                        ? "senderName"
                        : "receiverName";
                    const ownerContactKey =
                      formData.senderType === "sender"
                        ? "senderContact"
                        : "receiverContact";
                    const ownerAddressKey =
                      formData.senderType === "sender"
                        ? "senderAddress"
                        : "receiverAddress";
                    const ownerEmailKey =
                      formData.senderType === "sender"
                        ? "senderEmail"
                        : "receiverEmail";
                    const ownerRefKey =
                      formData.senderType === "sender"
                        ? "senderRef"
                        : "receiverRef";
                    const ownerRemarksKey =
                      formData.senderType === "sender"
                        ? "senderRemarks"
                        : "receiverRemarks";
                    const typePrefix =
                      formData.senderType === "sender" ? "Sender" : "Receiver";
                    const fieldPrefix =
                      formData.senderType === "sender" ? "sender" : "receiver";

                    const handleOwnerNameChange = (event, newValue) => {
                      if (typeof newValue === "string") {
                        // Manual entry or existing value
                        handleChange({
                          target: { name: ownerNameKey, value: newValue },
                        });
                      } else if (newValue) {
                        // Selected option, fetch details
                        handleSelectOwner(event, newValue);
                      } else {
                        // Cleared
                        const fieldMap = {
                          [ownerNameKey]: "",
                          [ownerContactKey]: "",
                          [ownerAddressKey]: "",
                          [ownerEmailKey]: "",
                          [ownerRefKey]: "",
                          [ownerRemarksKey]: "",
                        };
                        Object.entries(fieldMap).forEach(([formKey, value]) => {
                          handleChange({ target: { name: formKey, value } });
                        });
                        handleChange({
                          target: { name: "selectedSenderOwner", value: "" },
                        });
                      }
                    };

                    const handleSelectOwner = (event, value) => {
                      if (value && typeof value !== "string") {
                        const fieldMap = {
                          [ownerNameKey]: value.contact_name || "",
                          [ownerContactKey]: value.contact || "",
                          [ownerAddressKey]:
                            value.address || value.zoho_notes || "",
                          [ownerEmailKey]: value.email || "",
                          [ownerRefKey]: value.zoho_id || value.ref || "",
                          [ownerRemarksKey]:
                            value.system_notes || value.zoho_notes || "",
                        };
                        Object.entries(fieldMap).forEach(
                          ([formKey, dbValue]) => {
                            handleChange({
                              target: { name: formKey, value: dbValue },
                            });
                          },
                        );
                        const ownerId = value.zoho_id || value.id;
                        handleChange({
                          target: {
                            name: "selectedSenderOwner",
                            value: ownerId,
                          },
                        });

                        api
                          .get(`/api/customers/${ownerId}`)
                          .then((res) => {
                            const phone =
                              res?.data?.contact_persons?.[0]?.phone;
                            if (!phone) return;
                            setFormData((prev) => {
                              if (prev.selectedSenderOwner !== ownerId)
                                return prev;
                              return { ...prev, [ownerContactKey]: phone };
                            });
                          })
                          .catch((err) =>
                            console.error("Error fetching owner phone:", err),
                          );
                      }
                    };

                    return (
                      <>
                        <FormControl
                          component="fieldset"
                          error={!!errors.senderType}
                        >
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            color="#f58220"
                            gutterBottom
                          >
                            Select Type
                          </Typography>
                          <RadioGroup
                            name="senderType"
                            value={formData.senderType}
                            onChange={handleChange}
                            sx={{ flexDirection: "row", gap: 3, mb: 1 }}
                            defaultValue="sender"
                          >
                            <FormControlLabel
                              value="sender"
                              control={<Radio />}
                              label="Sender Details"
                            />
                            <FormControlLabel
                              value="receiver"
                              control={<Radio />}
                              label="Receiver Details"
                            />
                          </RadioGroup>
                          {errors.senderType && (
                            <Typography variant="caption" color="error">
                              {errors.senderType}
                            </Typography>
                          )}
                        </FormControl>

                        <Stack spacing={2}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              gap: 2,
                              alignItems: "stretch",
                            }}
                          >
                            {/* ── Panel 1 owner autocomplete (uses options2 from context) ── */}
                            <Autocomplete
                              options={options2}
                              loading={loading}
                              freeSolo={true}
                              getOptionLabel={(option) =>
                                typeof option === "string"
                                  ? option
                                  : option.contact_name || ""
                              }
                              isOptionEqualToValue={(option, value) => {
                                if (typeof value === "string") {
                                  return typeof option === "string"
                                    ? option === value
                                    : (option.contact_name || "") === value;
                                }
                                return (
                                  typeof option !== "string" &&
                                  (option.zoho_id === value.zoho_id ||
                                    option.id === value.id)
                                );
                              }}
                              value={formData[ownerNameKey] || null}
                              onChange={handleOwnerNameChange}
                              onInputChange={(_, newInputValue) =>
                                setSearchTerm(newInputValue)
                              }
                              renderInput={(params) => (
                                <CustomTextField
                                  {...params}
                                  label={`Search & Select ${typePrefix}`}
                                  error={
                                    !!errors[ownerNameKey] ||
                                    !!errors.selectedSenderOwner
                                  }
                                  helperText={
                                    errors[ownerNameKey] ||
                                    errors.selectedSenderOwner ||
                                    (loading ? "Loading..." : "")
                                  }
                                  disabled={isFieldDisabled(
                                    "selectedSenderOwner",
                                  )}
                                  style={{ width: "100%" }}
                                />
                              )}
                              renderOption={(props, option) => (
                                <li
                                  {...props}
                                  key={
                                    typeof option === "string"
                                      ? option
                                      : option.zoho_id || option.id
                                  }
                                >
                                  <div>
                                    <strong>
                                      {typeof option === "string"
                                        ? option
                                        : option.contact_name || ""}
                                    </strong>
                                    {typeof option !== "string" &&
                                      option.email && (
                                        <div
                                          style={{
                                            fontSize: "0.875em",
                                            color: "#666",
                                          }}
                                        >
                                          {option.email}
                                        </div>
                                      )}
                                    {typeof option !== "string" &&
                                      option.primary_phone && (
                                        <div
                                          style={{
                                            fontSize: "0.875em",
                                            color: "#666",
                                          }}
                                        >
                                          {option.primary_phone}
                                        </div>
                                      )}
                                  </div>
                                </li>
                              )}
                              noOptionsText={
                                searchTerm
                                  ? `No ${typePrefix.toLowerCase()}s found for "${searchTerm}"`
                                  : `Type to search ${typePrefix.toLowerCase()}s`
                              }
                              clearOnBlur={false}
                              selectOnFocus={true}
                              style={{ width: "60%" }}
                            />
                            <CustomTextField
                              label={`${typePrefix} Contact`}
                              name={ownerContactKey}
                              value={formData[ownerContactKey] || ""}
                              onChange={handleChange}
                              error={!!errors[ownerContactKey]}
                              helperText={errors[ownerContactKey]}
                              // required
                            />
                          </Box>
                          <CustomTextField
                            label={`${typePrefix} Address`}
                            name={ownerAddressKey}
                            value={formData[ownerAddressKey] || ""}
                            onChange={handleChange}
                            error={!!errors[ownerAddressKey]}
                            helperText={errors[ownerAddressKey]}
                            multiline
                            rows={2}
                            // required
                          />
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              gap: 2,
                              alignItems: "stretch",
                            }}
                          >
                            <CustomTextField
                              label={`${typePrefix} Email`}
                              name={ownerEmailKey}
                              value={formData[ownerEmailKey] || ""}
                              onChange={handleChange}
                              error={!!errors[ownerEmailKey]}
                              helperText={errors[ownerEmailKey]}
                            />
                            <CustomTextField
                              label={`${typePrefix} Ref`}
                              name={ownerRefKey}
                              value={formData[ownerRefKey] || ""}
                              onChange={handleChange}
                              error={!!errors[ownerRefKey]}
                              helperText={errors[ownerRefKey]}
                            />
                          </Box>
                          <CustomTextField
                            label={`${typePrefix} Remarks`}
                            name={ownerRemarksKey}
                            value={formData[ownerRemarksKey] || ""}
                            onChange={handleChange}
                            error={!!errors[ownerRemarksKey]}
                            helperText={errors[ownerRemarksKey]}
                            multiline
                            rows={2}
                          />
                        </Stack>
                      </>
                    );
                  })()}
                </Stack>
              </AccordionDetails>
            </Accordion>
            <Accordion
              expanded={expanded.has("panel2")}
              onChange={handleAccordionChange("panel2")}
              sx={{
                borderRadius: 2,
                boxShadow: "none",
                "&:before": { display: "none" },
                "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: expanded.has("panel2") ? "#0d6c6a" : "#fff3e0",
                  borderRadius: 2,
                  "& .MuiAccordionSummary-content": {
                    fontWeight: "bold",
                    color: expanded.has("panel2") ? "#fff" : "#f58220",
                  },
                }}
              >
                2.{" "}
                {formData.senderType === "receiver"
                  ? "Sender Details (with Shipping)"
                  : "Receiver Details (with Shipping)"}
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                <Stack spacing={2}>
                  {(formData.senderType === "sender"
                    ? formData.receivers
                    : formData.senders
                  ).length > 1 && (
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="primary">
                        {formData.senderType === "sender"
                          ? "Receivers"
                          : "Senders"}{" "}
                        Overview
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{ overflowX: "auto" }}
                      >
                        {(formData.senderType === "sender"
                          ? formData.receivers
                          : formData.senders
                        ).map((rec, i) => {
                          const totalItems = (rec.shippingDetails || []).reduce(
                            (sum, sd) => {
                              return (
                                sum +
                                (sd.containerDetails || []).reduce(
                                  (s, cd) =>
                                    s + (parseInt(cd.assignTotalBox || 0) || 0),
                                  0,
                                )
                              );
                            },
                            0,
                          );
                          const remainingItems = (
                            rec.shippingDetails || []
                          ).reduce((sum, sd) => {
                            return (
                              sum +
                              (sd.containerDetails || []).reduce(
                                (s, cd) =>
                                  s + (parseInt(cd.remainingItems || 0) || 0),
                                0,
                              )
                            );
                          }, 0);
                          return (
                            <Chip
                              key={i}
                              label={`${
                                (formData.senderType === "sender"
                                  ? rec.receiverName
                                  : rec.senderName) ||
                                (formData.senderType === "sender"
                                  ? `Receiver ${i + 1}`
                                  : `Sender ${i + 1}`)
                              } (Items: ${totalItems.toLocaleString()} / Remaining: ${remainingItems.toLocaleString()})`}
                              variant={
                                rec.fullPartial === "Partial"
                                  ? "filled"
                                  : "outlined"
                              }
                              color={
                                rec.fullPartial === "Partial"
                                  ? "warning"
                                  : "primary"
                              }
                            />
                          );
                        })}
                      </Stack>
                    </Stack>
                  )}
                  {(() => {
                    const currentList =
                      formData.senderType === "sender"
                        ? formData.receivers
                        : formData.senders;
                    const isSenderMode = formData.senderType === "receiver";
                    const typePrefix = isSenderMode ? "Sender" : "Receiver";
                    const handleChangeFn = isSenderMode
                      ? handleSenderChange
                      : handleReceiverChange;
                    const handleShippingChangeFn = isSenderMode
                      ? handleSenderShippingChange
                      : handleReceiverShippingChange;
                    const handlePartialChangeFn = isSenderMode
                      ? handleSenderPartialChange
                      : handleReceiverPartialChange;
                    const addShippingFn = isSenderMode
                      ? addSenderShipping
                      : addReceiverShipping;
                    const duplicateShippingFn = isSenderMode
                      ? duplicateSenderShipping
                      : duplicateReceiverShipping;
                    const removeShippingFn = isSenderMode
                      ? removeSenderShipping
                      : removeReceiverShipping;
                    const listKey = isSenderMode ? "senders" : "receivers";
                    const errorsPrefix = isSenderMode
                      ? `senders[${0}]`
                      : `receivers[${0}]`;
                    const disabledPrefix = isSenderMode
                      ? `senders[${0}]`
                      : `receivers[${0}]`;
                    const addRecFn = isSenderMode ? addSender : addReceiver;
                    const duplicateRecFn = isSenderMode
                      ? duplicateSender
                      : duplicateReceiver;
                    const removeRecFn = isSenderMode
                      ? removeSender
                      : removeReceiver;
                    // Helper function to update nested state immutably (generic for senders/receivers)
                    const updateNestedArray = (
                      indices,
                      field,
                      value,
                      isSender = true,
                    ) => {
                      const key = isSender ? "senders" : "receivers";
                      setFormData((prev) => ({
                        ...prev,
                        [key]: prev[key].map((item, ii) => {
                          if (ii !== indices[0]) return item;
                          return {
                            ...item,
                            shippingDetails: (item.shippingDetails || []).map(
                              (sd, jj) => {
                                if (jj !== indices[1]) return sd;
                                return {
                                  ...sd,
                                  containerDetails: (
                                    sd.containerDetails || []
                                  ).map((cd, kk) => {
                                    if (kk !== indices[2]) return cd;
                                    return { ...cd, [field]: value };
                                  }),
                                };
                              },
                            ),
                          };
                        }),
                      }));
                    };
                    // 1. handleSenderContainerDetailChange
                    const handleSenderContainerDetailChange =
                      (index, shippingIndex, containerIndex, field) =>
                      (eventOrValue) => {
                        const value = eventOrValue.target
                          ? eventOrValue.target.value
                          : eventOrValue;
                        updateNestedArray(
                          [index, shippingIndex, containerIndex],
                          field,
                          value,
                          true,
                        );
                      };
                    // 2. handleReceiverContainerDetailChange
                    const handleReceiverContainerDetailChange =
                      (index, shippingIndex, containerIndex, field) =>
                      (eventOrValue) => {
                        const value = eventOrValue.target
                          ? eventOrValue.target.value
                          : eventOrValue;
                        updateNestedArray(
                          [index, shippingIndex, containerIndex],
                          field,
                          value,
                          false,
                        );
                      };
                    // 3. addSenderContainerDetail
                    const addSenderContainerDetail = (index, shippingIndex) => {
                      setFormData((prev) => ({
                        ...prev,
                        senders: prev.senders.map((sender, ii) => {
                          if (ii !== index) return sender;
                          return {
                            ...sender,
                            shippingDetails: sender.shippingDetails.map(
                              (sd, jj) => {
                                if (jj !== shippingIndex) return sd;
                                return {
                                  ...sd,
                                  containerDetails: [
                                    ...(sd.containerDetails || []),
                                    {
                                      assignTotalBox: "",
                                      assignWeight: "",
                                      container: null,
                                      status: "",
                                    },
                                  ],
                                };
                              },
                            ),
                          };
                        }),
                      }));
                    };
                    // 4. addReceiverContainerDetail
                    const addReceiverContainerDetail = (
                      index,
                      shippingIndex,
                    ) => {
                      setFormData((prev) => ({
                        ...prev,
                        receivers: prev.receivers.map((receiver, ii) => {
                          if (ii !== index) return receiver;
                          return {
                            ...receiver,
                            shippingDetails: receiver.shippingDetails.map(
                              (sd, jj) => {
                                if (jj !== shippingIndex) return sd;
                                return {
                                  ...sd,
                                  containerDetails: [
                                    ...(sd.containerDetails || []),
                                    {
                                      assignTotalBox: "",
                                      assignWeight: "",
                                      container: null,
                                      status: "",
                                    },
                                  ],
                                };
                              },
                            ),
                          };
                        }),
                      }));
                    };
                    const getContainerAssignQty = (cd) => {
                      return Number(
                        cd?.assign_total_box ??
                          cd?.assignTotalBox ??
                          cd?.total_number ??
                          cd?.totalNumber ??
                          0,
                      );
                    };

                    const getContainerAssignWeight = (cd) => {
                      return Number(cd?.assign_weight ?? cd?.assignWeight ?? 0);
                    };

                    const getContainerCid = (cd) => {
                      return Number(
                        cd?.container?.cid ?? cd?.container_id ?? cd?.cid ?? 0,
                      );
                    };
                    const removeContainerDetailFromDb = async (
                      item,
                      containerDetail,
                      receiverId,
                    ) => {
                      const orderItemId = item?.id;
                      const qty = getContainerAssignQty(containerDetail);
                      const weight = getContainerAssignWeight(containerDetail);
                      const cid = getContainerCid(containerDetail);

                      if (
                        !orderId ||
                        !receiverId ||
                        !orderItemId ||
                        !cid ||
                        qty <= 0
                      ) {
                        return;
                      }

                      const payload = {
                        [orderId]: {
                          [receiverId]: {
                            [orderItemId]: {
                              orderItemId,
                              qty,
                              totalAssignedWeight: weight,
                              containers: [cid],
                            },
                          },
                        },
                      };

                      const res = await api.post(
                        "/api/orders/remove-assign-container",
                        {
                          assignments: payload,
                        },
                      );

                      if (!res.data?.success) {
                        throw new Error(
                          res.data?.details ||
                            res.data?.error ||
                            "Container remove failed",
                        );
                      }
                    };
                    // 5. removeSenderContainerDetail
                    const removeSenderContainerDetail = async (
                      index,
                      shippingIndex,
                      containerIndex,
                    ) => {
                      const sender = formData.senders[index];
                      const shippingDetail =
                        sender?.shippingDetails?.[shippingIndex];
                      const containerDetail =
                        shippingDetail?.containerDetails?.[containerIndex];

                      if (!sender || !shippingDetail || !containerDetail)
                        return;

                      const ok = window.confirm(
                        "Remove this container assignment?",
                      );
                      if (!ok) return;

                      try {
                        await removeContainerDetailFromDb(
                          shippingDetail,
                          containerDetail,
                          sender.id,
                        );

                        await fetchOrder(orderId);
                        await fetchContainers?.();

                        setSnackbar({
                          open: true,
                          message: "Container assignment removed successfully",
                          severity: "success",
                        });
                      } catch (err) {
                        console.error(
                          "[removeSenderContainerDetail] Error:",
                          err.response?.data || err.message,
                        );

                        setSnackbar({
                          open: true,
                          message:
                            err.response?.data?.details ||
                            err.response?.data?.error ||
                            err.message ||
                            "Failed to remove container",
                          severity: "error",
                        });
                      }
                    };
                    // 6. removeReceiverContainerDetail
                    const removeReceiverContainerDetail = async (
                      index,
                      shippingIndex,
                      containerIndex,
                    ) => {
                      const receiver = formData.receivers[index];
                      const shippingDetail =
                        receiver?.shippingDetails?.[shippingIndex];
                      const containerDetail =
                        shippingDetail?.containerDetails?.[containerIndex];

                      if (!receiver || !shippingDetail || !containerDetail)
                        return;

                      const ok = window.confirm(
                        "Remove this container assignment?",
                      );
                      if (!ok) return;

                      try {
                        await removeContainerDetailFromDb(
                          shippingDetail,
                          containerDetail,
                          receiver.id,
                        );

                        await fetchOrder(orderId);
                        await fetchContainers?.();

                        setSnackbar({
                          open: true,
                          message: "Container assignment removed successfully",
                          severity: "success",
                        });
                      } catch (err) {
                        console.error(
                          "[removeReceiverContainerDetail] Error:",
                          err.response?.data || err.message,
                        );

                        setSnackbar({
                          open: true,
                          message:
                            err.response?.data?.details ||
                            err.response?.data?.error ||
                            err.message ||
                            "Failed to remove container",
                          severity: "error",
                        });
                      }
                    };
                    // 7. duplicateSenderContainerDetail
                    const duplicateSenderContainerDetail = (
                      index,
                      shippingIndex,
                      containerIndex,
                    ) => {
                      setFormData((prev) => ({
                        ...prev,
                        senders: prev.senders.map((sender, ii) => {
                          if (ii !== index) return sender;
                          return {
                            ...sender,
                            shippingDetails: sender.shippingDetails.map(
                              (sd, jj) => {
                                if (jj !== shippingIndex) return sd;
                                const containerDetails = [
                                  ...(sd.containerDetails || []),
                                ];
                                const toDuplicate =
                                  containerDetails[containerIndex];
                                if (toDuplicate) {
                                  containerDetails.splice(
                                    containerIndex + 1,
                                    0,
                                    { ...toDuplicate },
                                  );
                                }
                                return { ...sd, containerDetails };
                              },
                            ),
                          };
                        }),
                      }));
                    };
                    // 8. duplicateReceiverContainerDetail
                    const duplicateReceiverContainerDetail = (
                      index,
                      shippingIndex,
                      containerIndex,
                    ) => {
                      setFormData((prev) => ({
                        ...prev,
                        receivers: prev.receivers.map((receiver, ii) => {
                          if (ii !== index) return receiver;
                          return {
                            ...receiver,
                            shippingDetails: receiver.shippingDetails.map(
                              (sd, jj) => {
                                if (jj !== shippingIndex) return sd;
                                const containerDetails = [
                                  ...(sd.containerDetails || []),
                                ];
                                const toDuplicate =
                                  containerDetails[containerIndex];
                                if (toDuplicate) {
                                  containerDetails.splice(
                                    containerIndex + 1,
                                    0,
                                    { ...toDuplicate },
                                  );
                                }
                                return { ...sd, containerDetails };
                              },
                            ),
                          };
                        }),
                      }));
                    };

                    const renderRecForm = (rec, i) => {
                      const recErrorsPrefix = isSenderMode
                        ? `senders[${i}]`
                        : `receivers[${i}]`;
                      const recDisabledPrefix = isSenderMode
                        ? `senders[${i}]`
                        : `receivers[${i}]`;
                      const isSender = isSenderMode;
                      const emptySd = {
                        pickupLocation: "",
                        category: "",
                        subcategory: "",
                        type: "",
                        weight: "",
                        totalNumber: "",
                        deliveryAddress: "",
                        status: "",
                        containerDetails: [],
                        itemRef: `ORDER-ITEM-REF-${i + 1}-${Date.now()}`,
                      };
                      const addShippingWithValues = (
                        recIndex,
                        sdFields,
                        containerFields = null,
                      ) => {
                        const key = listKey;
                        setFormData((prev) => ({
                          ...prev,
                          [key]: prev[key].map((item, ii) => {
                            if (ii !== recIndex) return item;
                            const newSd = { ...emptySd, ...sdFields };
                            if (containerFields) {
                              newSd.containerDetails = [
                                {
                                  ...emptySd.containerDetails[0],
                                  ...containerFields,
                                },
                              ];
                            } else {
                              newSd.containerDetails = [
                                ...emptySd.containerDetails,
                              ];
                            }
                            return {
                              ...item,
                              shippingDetails: [
                                ...(item.shippingDetails || []),
                                newSd,
                              ],
                            };
                          }),
                        }));
                      };

                      const handlePreviewChange = (e) => {
                        setPreviewSd(e.target.value);
                      };

                      const handleEmptySdChange = (field, value) => {
                        const sdFields = { [field]: value };
                        let containerFields = null;
                        addShippingWithValues(i, sdFields, containerFields);
                      };
                      const handleShippingChangeWithAutoFill =
                        (recIndex, shipIndex, field) => (e) => {
                          if (field !== "totalNumber" && field !== "weight") {
                            handleShippingChangeFn(
                              recIndex,
                              shipIndex,
                              field,
                            )(e);
                            return;
                          }
                          const value = e.target.value;
                          const key = listKey;
                          setFormData((prev) => ({
                            ...prev,
                            [key]: prev[key].map((item, ii) => {
                              if (ii !== recIndex) return item;
                              return {
                                ...item,
                                shippingDetails: item.shippingDetails.map(
                                  (sd, jj) => {
                                    if (jj !== shipIndex) return sd;
                                    return {
                                      ...sd,
                                      [field]: value,
                                    };
                                  },
                                ),
                              };
                            }),
                          }));
                        };
                      const addContainerDetail = (shippingIndex) => {
                        const addFn = isSenderMode
                          ? addSenderContainerDetail
                          : addReceiverContainerDetail;
                        addFn(i, shippingIndex);
                      };

                      const removeContainerDetail = async (
                        shippingIndex,
                        containerIndex,
                      ) => {
                        const removeFn = isSenderMode
                          ? removeSenderContainerDetail
                          : removeReceiverContainerDetail;
                        await removeFn(i, shippingIndex, containerIndex);
                      };
                      const duplicateContainerDetail = (
                        shippingIndex,
                        containerIndex,
                      ) => {
                        const duplicateFn = isSenderMode
                          ? duplicateSenderContainerDetail
                          : duplicateReceiverContainerDetail;
                        duplicateFn(i, shippingIndex, containerIndex);
                      };
                      const handleContainerDetailChange =
                        (shippingIndex, containerIndex, field) => (value) => {
                          const changeFn = isSenderMode
                            ? handleSenderContainerDetailChange
                            : handleReceiverContainerDetailChange;
                          changeFn(
                            i,
                            shippingIndex,
                            containerIndex,
                            field,
                          )(value);
                        };
                      const nameField = isSenderMode
                        ? "senderName"
                        : "receiverName";
                      const getCid = (cont) =>
                        cont
                          ? typeof cont === "object"
                            ? cont.cid
                            : cont
                          : null;
                      const globalSelectedCids = currentList.flatMap((r) =>
                        (r.shippingDetails || []).flatMap((sd) =>
                          (sd.containerDetails || [])
                            .map((cd) => getCid(cd.container))
                            .filter(Boolean),
                        ),
                      );
                      const availableContainersBase = containers.filter(
                        (c) => !globalSelectedCids.includes(c.cid),
                      );
                      const autocompleteEquality = (option, value) => {
                        const valueCid = value
                          ? typeof value === "object"
                            ? value.cid
                            : value
                          : null;
                        return option.cid === valueCid;
                      };
                      const handleNameChange = (event, newValue) => {
                        if (typeof newValue === "string") {
                          handleChangeFn(
                            i,
                            nameField,
                          )({ target: { value: newValue } });
                        } else if (newValue) {
                          handleSelect(event, newValue);
                        } else {
                          const fieldMap = isSenderMode
                            ? {
                                senderName: "",
                                senderContact: "",
                                senderAddress: "",
                                senderEmail: "",
                                senderRef: "",
                                senderRemarks: "",
                                senderMarksNumber: "",
                              }
                            : {
                                receiverName: "",
                                receiverContact: "",
                                receiverAddress: "",
                                receiverEmail: "",
                                receiverRef: "",
                                receiverRemarks: "",
                                receiverMarksNumber: "",
                              };
                          Object.entries(fieldMap).forEach(
                            ([formKey, value]) => {
                              handleChangeFn(i, formKey)({ target: { value } });
                            },
                          );
                          handleChangeFn(
                            i,
                            "selectedSenderOwner",
                          )({ target: { value: "" } });
                        }
                      };
                      const handleSelect = (event, value) => {
                        if (value && typeof value !== "string") {
                          const fieldMap = isSenderMode
                            ? {
                                senderName: value.contact_name || "",
                                senderContact: value.contact || "",
                                senderAddress:
                                  value.address || value.zoho_notes || "",
                                senderEmail: value.email || "",
                                senderRef: value.zoho_id || value.ref || "",
                                senderRemarks:
                                  value.system_notes || value.zoho_notes || "",
                              }
                            : {
                                receiverName: value.contact_name || "",
                                receiverContact: value.contact || "",
                                receiverAddress:
                                  value.address || value.zoho_notes || "",
                                receiverEmail: value.email || "",
                                receiverRef: value.zoho_id || value.ref || "",
                                receiverRemarks:
                                  value.system_notes || value.zoho_notes || "",
                              };
                          Object.entries(fieldMap).forEach(
                            ([formKey, dbValue]) => {
                              handleChangeFn(
                                i,
                                formKey,
                              )({ target: { value: dbValue } });
                            },
                          );
                          const ownerId = value.zoho_id || value.id;
                          handleChangeFn(
                            i,
                            "selectedSenderOwner",
                          )({
                            target: { value: ownerId },
                          });

                          const contactField = isSenderMode
                            ? "senderContact"
                            : "receiverContact";
                          const refField = isSenderMode
                            ? "senderRef"
                            : "receiverRef";

                          api
                            .get(`/api/customers/${ownerId}`)
                            .then((res) => {
                              const phone =
                                res?.data?.contact_persons?.[0]?.phone;
                              if (!phone) return;
                              setFormData((prev) => {
                                const item = prev[listKey][i];
                                if (!item || item[refField] !== ownerId)
                                  return prev; // selection changed
                                return {
                                  ...prev,
                                  [listKey]: prev[listKey].map((it, ii) =>
                                    ii === i
                                      ? { ...it, [contactField]: phone }
                                      : it,
                                  ),
                                };
                              });
                            })
                            .catch((err) =>
                              console.error(
                                "Error fetching contact phone:",
                                err,
                              ),
                            );
                        }
                      };
                      const calculateSumAssignTotalBox = (sd) => {
                        return (sd.containerDetails || []).reduce(
                          (sum, cd) =>
                            sum + (parseInt(cd.assignTotalBox || 0) || 0),
                          0,
                        );
                      };
                      const calculateSumAssignWeight = (sd) => {
                        return (sd.containerDetails || []).reduce(
                          (sum, cd) =>
                            sum + (parseFloat(cd.assignWeight || 0) || 0),
                          0,
                        );
                      };
                      const renderEmptyContainerDetail = (shippingIndex) => {
                        const emptyCd = {
                          assignTotalBox: "",
                          assignWeight: "",
                          container: null,
                          status: "",
                        };
                        const currentContainerPreview = emptyCd.container;
                        const currentCidPreview =
                          typeof currentContainerPreview === "object"
                            ? currentContainerPreview?.cid
                            : currentContainerPreview;
                        const otherSelectedCidsPreview =
                          globalSelectedCids.filter(
                            (cid) => cid != currentCidPreview,
                          );
                        const availableContainersForCdPreview =
                          containers.filter(
                            (c) => !otherSelectedCidsPreview.includes(c.cid),
                          );
                        const displayValuePreview =
                          currentContainerPreview &&
                          typeof currentContainerPreview === "object"
                            ? currentContainerPreview
                            : currentCidPreview
                              ? availableContainersForCdPreview.find(
                                  (c) => c.cid === currentCidPreview,
                                ) ||
                                containers.find(
                                  (c) => c.cid === currentCidPreview,
                                )
                              : null;
                        return (
                          <Box
                            sx={{
                              p: 1,
                              border: 1,
                              borderColor: "grey.200",
                              borderRadius: 1,
                            }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              mb={1}
                            >
                              <Typography variant="body2" color="primary">
                                Container 1
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  onClick={() => {
                                    addContainerDetail(shippingIndex);
                                    duplicateContainerDetail(shippingIndex, 0);
                                  }}
                                  size="small"
                                  title="Duplicate"
                                  color="primary"
                                >
                                  <ContentCopyIcon />
                                </IconButton>
                              </Stack>
                            </Stack>
                            <Stack spacing={1.5}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: { xs: "column", sm: "row" },
                                  gap: 2,
                                  alignItems: "stretch",
                                }}
                              >
                                <CustomTextField
                                  label="Assign Total Box"
                                  value={emptyCd.assignTotalBox || ""}
                                  onChange={(e) => {
                                    addContainerDetail(shippingIndex);
                                    handleContainerDetailChange(
                                      shippingIndex,
                                      0,
                                      "assignTotalBox",
                                    )(e.target.value);
                                  }}
                                  sx={{ width: { xs: "100%", sm: "50%" } }}
                                  error={
                                    !!errors[
                                      `${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].assignTotalBox`
                                    ]
                                  }
                                  helperText={
                                    errors[
                                      `${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].assignTotalBox`
                                    ]
                                  }
                                />
                                <CustomTextField
                                  label="Assign Weight"
                                  value={emptyCd.assignWeight || ""}
                                  onChange={(e) => {
                                    addContainerDetail(shippingIndex);
                                    handleContainerDetailChange(
                                      shippingIndex,
                                      0,
                                      "assignWeight",
                                    )(e.target.value);
                                  }}
                                  sx={{ width: { xs: "100%", sm: "50%" } }}
                                  error={
                                    !!errors[
                                      `${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].assignWeight`
                                    ]
                                  }
                                  helperText={
                                    errors[
                                      `${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].assignWeight`
                                    ]
                                  }
                                />
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: { xs: "column", sm: "row" },
                                  gap: 2,
                                  alignItems: "stretch",
                                }}
                              >
                                <Autocomplete
                                  options={availableContainersForCdPreview}
                                  value={displayValuePreview}
                                  onChange={(e, newValue) => {
                                    addContainerDetail(shippingIndex);
                                    handleContainerDetailChange(
                                      shippingIndex,
                                      0,
                                      "container",
                                    )(newValue);
                                  }}
                                  sx={{ width: { xs: "100%", sm: "50%" } }}
                                  getOptionLabel={(option) =>
                                    option.container_number || ""
                                  }
                                  isOptionEqualToValue={autocompleteEquality}
                                  renderInput={(params) => (
                                    <TextField {...params} label="Container" />
                                  )}
                                />
                                <CustomSelect
                                  label="Status"
                                  value={emptyCd.status || ""}
                                  onChange={(e) => {
                                    addContainerDetail(shippingIndex);
                                    handleContainerDetailChange(
                                      shippingIndex,
                                      0,
                                      "status",
                                    )(e.target.value);
                                  }}
                                  sx={{ width: { xs: "100%", sm: "50%" } }}
                                  error={
                                    !!errors[
                                      `${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].status`
                                    ]
                                  }
                                  helperText={
                                    errors[
                                      `${listKey}[${i}].shippingDetails[${shippingIndex}].containerDetails[0].status`
                                    ]
                                  }
                                  renderValue={(selected) =>
                                    selected || "Select Status"
                                  }
                                >
                                  <MenuItem value="">Select Status</MenuItem>
                                  {statuses.map((s) => (
                                    <MenuItem key={s.id} value={s.order_status}>
                                      {s.order_status}
                                    </MenuItem>
                                  ))}
                                </CustomSelect>
                              </Box>
                            </Stack>
                          </Box>
                        );
                      };
                      const renderShippingSection = () => (
                        <Stack spacing={2}>
                          <Typography
                            variant="subtitle1"
                            color="primary"
                            fontWeight={"bold"}
                            mb={1}
                          >
                            Shipping Details
                          </Typography>
                          {/* ETA, ETD at receiver/sender level */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              gap: 2,
                              alignItems: "stretch",
                            }}
                          >
                            <CustomTextField
                              label="ETA"
                              type="date"
                              value={rec.eta || ""}
                              onChange={(e) => handleChangeFn(i, "eta")(e)}
                              InputLabelProps={{ shrink: true }}
                              error={!!errors[`${listKey}[${i}].eta`]}
                              helperText={errors[`${listKey}[${i}].eta`]}
                            />
                            <CustomTextField
                              label="ETD"
                              type="date"
                              value={rec.etd || ""}
                              onChange={(e) => handleChangeFn(i, "etd")(e)}
                              InputLabelProps={{ shrink: true }}
                              error={!!errors[`${listKey}[${i}].etd`]}
                              helperText={errors[`${listKey}[${i}].etd`]}
                            />
                          </Box>
                          {/* Shipping Details Forms */}
                          {(rec.shippingDetails || []).length === 0 ? (
                            <Box
                              sx={{
                                p: 1.5,
                                border: 1,
                                borderColor: "grey.200",
                                borderRadius: 1,
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={1}
                              >
                                <Typography
                                  variant="body2"
                                  color="primary"
                                  fontWeight="bold"
                                >
                                  Shipping Details 1
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                  <IconButton
                                    onClick={() => duplicateShippingFn(i, 0)}
                                    size="small"
                                    title="Duplicate"
                                    color="primary"
                                  >
                                    <ContentCopyIcon />
                                  </IconButton>
                                  <IconButton
                                    onClick={() => removeShippingFn(i, 0)}
                                    size="small"
                                    title="Delete"
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Stack>
                              </Stack>
                              <Stack spacing={1.5}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" },
                                    gap: 2,
                                    alignItems: "stretch",
                                  }}
                                >
                                  <CustomTextField
                                    label="Pickup Location"
                                    value={emptySd.pickupLocation}
                                    onChange={(e) =>
                                      handleEmptySdChange(
                                        "pickupLocation",
                                        e.target.value,
                                      )
                                    }
                                    error={
                                      !!errors[
                                        `${listKey}[${i}].shippingDetails[0].pickupLocation`
                                      ]
                                    }
                                    helperText={
                                      errors[
                                        `${listKey}[${i}].shippingDetails[0].pickupLocation`
                                      ]
                                    }
                                    disabled={isFieldDisabled(
                                      `${recDisabledPrefix}.shippingDetails[0].pickupLocation`,
                                    )}
                                  />

                                  <CustomSelect
                                    label="Category"
                                    value={emptySd.category}
                                    onChange={(e) =>
                                      handleEmptySdChange(
                                        "category",
                                        e.target.value,
                                      )
                                    }
                                    error={
                                      !!errors[
                                        `${listKey}[${i}].shippingDetails[0].category`
                                      ]
                                    }
                                    helperText={
                                      errors[
                                        `${listKey}[${i}].shippingDetails[0].category`
                                      ]
                                    }
                                    disabled={isFieldDisabled(
                                      `${recDisabledPrefix}.shippingDetails[0].category`,
                                    )}
                                    renderValue={(selected) =>
                                      selected || "Select Category"
                                    }
                                  >
                                    <MenuItem value="">
                                      Select Category
                                    </MenuItem>
                                    {categories.map((c) => (
                                      <MenuItem key={c} value={c}>
                                        {c}
                                      </MenuItem>
                                    ))}
                                  </CustomSelect>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" },
                                    gap: 2,
                                    alignItems: "stretch",
                                  }}
                                >
                                  <CustomSelect
                                    label="Subcategory"
                                    value={emptySd.subcategory}
                                    onChange={(e) =>
                                      handleEmptySdChange(
                                        "subcategory",
                                        e.target.value,
                                      )
                                    }
                                    error={
                                      !!errors[
                                        `${listKey}[${i}].shippingDetails[0].subcategory`
                                      ]
                                    }
                                    helperText={
                                      errors[
                                        `${listKey}[${i}].shippingDetails[0].subcategory`
                                      ]
                                    }
                                    disabled={isFieldDisabled(
                                      `${recDisabledPrefix}.shippingDetails[0].subcategory`,
                                    )}
                                    renderValue={(selected) =>
                                      selected || "Select Subcategory"
                                    }
                                  >
                                    <MenuItem value="">
                                      Select Subcategory
                                    </MenuItem>
                                    {(
                                      categorySubMap[emptySd.category] || []
                                    ).map((sc) => (
                                      <MenuItem key={sc} value={sc}>
                                        {sc}
                                      </MenuItem>
                                    ))}
                                  </CustomSelect>
                                  <CustomSelect
                                    label="Type"
                                    value={emptySd.type}
                                    onChange={(e) =>
                                      handleEmptySdChange(
                                        "type",
                                        e.target.value,
                                      )
                                    }
                                    error={
                                      !!errors[
                                        `${listKey}[${i}].shippingDetails[0].type`
                                      ]
                                    }
                                    helperText={
                                      errors[
                                        `${listKey}[${i}].shippingDetails[0].type`
                                      ]
                                    }
                                    disabled={isFieldDisabled(
                                      `${recDisabledPrefix}.shippingDetails[0].type`,
                                    )}
                                    renderValue={(selected) =>
                                      selected || "Select Type"
                                    }
                                  >
                                    <MenuItem value="">Select Type</MenuItem>
                                    {types.map((t) => (
                                      <MenuItem key={t} value={t}>
                                        {t}
                                      </MenuItem>
                                    ))}
                                  </CustomSelect>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" },
                                    gap: 2,
                                    alignItems: "stretch",
                                  }}
                                >
                                  <CustomTextField
                                    label="Weight"
                                    value={emptySd.weight}
                                    onChange={(e) =>
                                      handleEmptySdChange(
                                        "weight",
                                        e.target.value,
                                      )
                                    }
                                    error={
                                      !!errors[
                                        `${listKey}[${i}].shippingDetails[0].weight`
                                      ]
                                    }
                                    helperText={
                                      errors[
                                        `${listKey}[${i}].shippingDetails[0].weight`
                                      ]
                                    }
                                    disabled={isFieldDisabled(
                                      `${recDisabledPrefix}.shippingDetails[0].weight`,
                                    )}
                                  />
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" },
                                    gap: 2,
                                    alignItems: "stretch",
                                  }}
                                >
                                  <CustomTextField
                                    label="Total Number"
                                    value={emptySd.totalNumber}
                                    onChange={(e) =>
                                      handleEmptySdChange(
                                        "totalNumber",
                                        e.target.value,
                                      )
                                    }
                                    error={
                                      !!errors[
                                        `${listKey}[${i}].shippingDetails[0].totalNumber`
                                      ]
                                    }
                                    helperText={
                                      errors[
                                        `${listKey}[${i}].shippingDetails[0].totalNumber`
                                      ]
                                    }
                                    disabled={isFieldDisabled(
                                      `${recDisabledPrefix}.shippingDetails[0].totalNumber`,
                                    )}
                                  />
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" },
                                    gap: 2,
                                    alignItems: "stretch",
                                  }}
                                >
                                  <CustomSelect
                                    label="Consignment Status"
                                    value={emptySd.status || ""}
                                    onChange={(e) =>
                                      handleEmptySdChange(
                                        "status",
                                        e.target.value,
                                      )
                                    }
                                    error={
                                      !!errors[
                                        `${listKey}[${i}].shippingDetails[0].status`
                                      ]
                                    }
                                    helperText={
                                      errors[
                                        `${listKey}[${i}].shippingDetails[0].status`
                                      ]
                                    }
                                    disabled={isFieldDisabled(
                                      `${recDisabledPrefix}.shippingDetails[0].status`,
                                    )}
                                    renderValue={(selected) =>
                                      selected || "Select Status"
                                    }
                                  >
                                    <MenuItem value="">Select Status</MenuItem>
                                    {statuses.map((s) => (
                                      <MenuItem
                                        key={s.id}
                                        value={s.order_status}
                                      >
                                        {s.order_status}
                                      </MenuItem>
                                    ))}
                                  </CustomSelect>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" },
                                    gap: 2,
                                    alignItems: "stretch",
                                  }}
                                >
                                  <CustomTextField
                                    label="Delivery Address"
                                    value={emptySd.deliveryAddress}
                                    onChange={(e) =>
                                      handleEmptySdChange(
                                        "deliveryAddress",
                                        e.target.value,
                                      )
                                    }
                                    error={
                                      !!errors[
                                        `${listKey}[${i}].shippingDetails[0].deliveryAddress`
                                      ]
                                    }
                                    helperText={
                                      errors[
                                        `${listKey}[${i}].shippingDetails[0].deliveryAddress`
                                      ]
                                    }
                                    fullWidth
                                    disabled={isFieldDisabled(
                                      `${recDisabledPrefix}.shippingDetails[0].deliveryAddress`,
                                    )}
                                  />
                                  <CustomTextField
                                    label="Ref Number"
                                    value={emptySd.itemRef}
                                    disabled={true}
                                  />
                                </Box>
                                <Typography
                                  variant="body2"
                                  color="primary"
                                  fontWeight="bold"
                                  my={4}
                                  textAlign="center"
                                >
                                  No Contianer Assigned
                                </Typography>
                              </Stack>
                            </Box>
                          ) : (
                            (rec.shippingDetails || []).map((sd, j) => {
                              const hasContainers =
                                (sd.containerDetails || []).length > 0;
                              return (
                                <Box
                                  key={j}
                                  sx={{
                                    p: 1.5,
                                    border: 1,
                                    borderColor: "grey.200",
                                    borderRadius: 1,
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={1}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="primary"
                                      fontWeight="bold"
                                    >
                                      Shipping Detail {j + 1}
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                      <IconButton
                                        onClick={() =>
                                          duplicateShippingFn(i, j)
                                        }
                                        size="small"
                                        title="Duplicate"
                                        color="primary"
                                      >
                                        <ContentCopyIcon />
                                      </IconButton>
                                      {(rec.shippingDetails || []).length >
                                        1 && (
                                        <IconButton
                                          onClick={() => removeShippingFn(i, j)}
                                          size="small"
                                          title="Delete"
                                          color="error"
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      )}
                                    </Stack>
                                  </Stack>
                                  <Stack spacing={1.5}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: {
                                          xs: "column",
                                          sm: "row",
                                        },
                                        gap: 2,
                                        alignItems: "stretch",
                                      }}
                                    >
                                      <CustomTextField
                                        label="Pickup Location"
                                        value={sd.pickupLocation || ""}
                                        onChange={(e) =>
                                          handleShippingChangeFn(
                                            i,
                                            j,
                                            "pickupLocation",
                                          )(e)
                                        }
                                        error={
                                          !!errors[
                                            `${listKey}[${i}].shippingDetails[${j}].pickupLocation`
                                          ]
                                        }
                                        helperText={
                                          errors[
                                            `${listKey}[${i}].shippingDetails[${j}].pickupLocation`
                                          ]
                                        }
                                      />
                                      <CustomSelect
                                        label="Category"
                                        value={sd.category || ""}
                                        onChange={(e) =>
                                          handleShippingChangeFn(
                                            i,
                                            j,
                                            "category",
                                          )(e)
                                        }
                                        error={
                                          !!errors[
                                            `${listKey}[${i}].shippingDetails[${j}].category`
                                          ]
                                        }
                                        helperText={
                                          errors[
                                            `${listKey}[${i}].shippingDetails[${j}].category`
                                          ]
                                        }
                                        renderValue={(selected) =>
                                          selected || "Select Category"
                                        }
                                      >
                                        <MenuItem value="">
                                          Select Category
                                        </MenuItem>
                                        {categories.map((c) => (
                                          <MenuItem key={c} value={c}>
                                            {c}
                                          </MenuItem>
                                        ))}
                                      </CustomSelect>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: {
                                          xs: "column",
                                          sm: "row",
                                        },
                                        gap: 2,
                                        alignItems: "stretch",
                                      }}
                                    >
                                      <CustomSelect
                                        label="Subcategory"
                                        value={sd.subcategory || ""}
                                        onChange={(e) =>
                                          handleShippingChangeFn(
                                            i,
                                            j,
                                            "subcategory",
                                          )(e)
                                        }
                                        error={
                                          !!errors[
                                            `${listKey}[${i}].shippingDetails[${j}].subcategory`
                                          ]
                                        }
                                        helperText={
                                          errors[
                                            `${listKey}[${i}].shippingDetails[${j}].subcategory`
                                          ]
                                        }
                                        renderValue={(selected) =>
                                          selected || "Select Subcategory"
                                        }
                                      >
                                        <MenuItem value="">
                                          Select Subcategory
                                        </MenuItem>
                                        {(
                                          categorySubMap[sd.category] || []
                                        ).map((sc) => (
                                          <MenuItem key={sc} value={sc}>
                                            {sc}
                                          </MenuItem>
                                        ))}
                                      </CustomSelect>
                                      <CustomSelect
                                        label="Type"
                                        value={sd.type || ""}
                                        onChange={(e) =>
                                          handleShippingChangeFn(
                                            i,
                                            j,
                                            "type",
                                          )(e)
                                        }
                                        error={
                                          !!errors[
                                            `${listKey}[${i}].shippingDetails[${j}].type`
                                          ]
                                        }
                                        helperText={
                                          errors[
                                            `${listKey}[${i}].shippingDetails[${j}].type`
                                          ]
                                        }
                                        renderValue={(selected) =>
                                          selected || "Select Type"
                                        }
                                      >
                                        <MenuItem value="">
                                          Select Unit
                                        </MenuItem>
                                        {types.map((t) => (
                                          <MenuItem key={t} value={t}>
                                            {t}
                                          </MenuItem>
                                        ))}
                                      </CustomSelect>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: {
                                          xs: "column",
                                          sm: "row",
                                        },
                                        gap: 2,
                                        alignItems: "stretch",
                                      }}
                                    >
                                      <CustomTextField
                                        label="Weight"
                                        value={sd.weight || ""}
                                        onChange={handleShippingChangeWithAutoFill(
                                          i,
                                          j,
                                          "weight",
                                        )}
                                        error={
                                          !!errors[
                                            `${listKey}[${i}].shippingDetails[${j}].weight`
                                          ]
                                        }
                                        helperText={
                                          errors[
                                            `${listKey}[${i}].shippingDetails[${j}].weight`
                                          ]
                                        }
                                      />
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: {
                                          xs: "column",
                                          sm: "row",
                                        },
                                        gap: 2,
                                        alignItems: "stretch",
                                      }}
                                    >
                                      <CustomTextField
                                        label="Total Number"
                                        value={sd.totalNumber || ""}
                                        onChange={handleShippingChangeWithAutoFill(
                                          i,
                                          j,
                                          "totalNumber",
                                        )}
                                        error={
                                          !!errors[
                                            `${listKey}[${i}].shippingDetails[${j}].totalNumber`
                                          ]
                                        }
                                        helperText={
                                          errors[
                                            `${listKey}[${i}].shippingDetails[${j}].totalNumber`
                                          ]
                                        }
                                      />
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: {
                                          xs: "column",
                                          sm: "row",
                                        },
                                        gap: 2,
                                        alignItems: "stretch",
                                      }}
                                    >
                                      <CustomSelect
                                        label="Shippment Status"
                                        value={sd.status || ""}
                                        onChange={(e) =>
                                          handleShippingChangeFn(
                                            i,
                                            j,
                                            "status",
                                          )(e)
                                        }
                                        error={
                                          !!errors[
                                            `${listKey}[${i}].shippingDetails[${j}].status`
                                          ]
                                        }
                                        helperText={
                                          errors[
                                            `${listKey}[${i}].shippingDetails[${j}].status`
                                          ]
                                        }
                                        renderValue={(selected) =>
                                          selected || "Select Status"
                                        }
                                      >
                                        <MenuItem value="">
                                          Select Status
                                        </MenuItem>
                                        {statuses.map((s) => (
                                          <MenuItem
                                            key={s.id}
                                            value={s.order_status}
                                          >
                                            {s.order_status}
                                          </MenuItem>
                                        ))}
                                      </CustomSelect>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: {
                                          xs: "column",
                                          sm: "row",
                                        },
                                        gap: 2,
                                        alignItems: "stretch",
                                      }}
                                    >
                                      <CustomTextField
                                        label="Delivery Address"
                                        value={sd.deliveryAddress || ""}
                                        onChange={(e) =>
                                          handleShippingChangeFn(
                                            i,
                                            j,
                                            "deliveryAddress",
                                          )(e)
                                        }
                                        error={
                                          !!errors[
                                            `${listKey}[${i}].shippingDetails[${j}].deliveryAddress`
                                          ]
                                        }
                                        helperText={
                                          errors[
                                            `${listKey}[${i}].shippingDetails[${j}].deliveryAddress`
                                          ]
                                        }
                                        fullWidth
                                      />
                                      <CustomTextField
                                        label="Ref Number"
                                        value={
                                          sd.itemRef ||
                                          `ORDER-ITEM-REF-${i + 1}-${j + 1}-${Date.now()}`
                                        }
                                        disabled={true}
                                      />
                                    </Box>

                                    {!hasContainers ? (
                                      <Typography
                                        variant="body2"
                                        color="primary"
                                        fontWeight="bold"
                                        my={4}
                                        textAlign="center"
                                      >
                                        No Contianer Assigned
                                      </Typography>
                                    ) : (
                                      <>
                                        <Stack spacing={1}>
                                          <Typography
                                            variant="subtitle2"
                                            color="primary"
                                            fontWeight="bold"
                                          >
                                            Container Details
                                          </Typography>
                                          {(sd.containerDetails || []).map(
                                            (cd, k) => {
                                              const currentContainer =
                                                cd.container;
                                              const currentCid =
                                                typeof currentContainer ===
                                                "object"
                                                  ? currentContainer?.cid
                                                  : currentContainer;
                                              const otherSelectedCids =
                                                globalSelectedCids.filter(
                                                  (cid) => cid !== currentCid,
                                                );
                                              const availableContainersForCd =
                                                containers.filter(
                                                  (c) =>
                                                    !otherSelectedCids.includes(
                                                      c.cid,
                                                    ),
                                                );
                                              const displayValue =
                                                currentContainer &&
                                                typeof currentContainer ===
                                                  "object"
                                                  ? currentContainer
                                                  : currentCid
                                                    ? availableContainersForCd.find(
                                                        (c) =>
                                                          c.cid === currentCid,
                                                      ) ||
                                                      containers.find(
                                                        (c) =>
                                                          c.cid === currentCid,
                                                      )
                                                    : null;
                                              return (
                                                <Box
                                                  key={k}
                                                  sx={{
                                                    p: 1,
                                                    border: 1,
                                                    borderColor: "grey.200",
                                                    borderRadius: 1,
                                                  }}
                                                >
                                                  <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                    mb={1}
                                                  >
                                                    <Typography
                                                      variant="body2"
                                                      color="primary"
                                                    >
                                                      Container {k + 1}
                                                    </Typography>
                                                  </Stack>
                                                  <Stack spacing={1.5}>
                                                    <Box
                                                      sx={{
                                                        display: "flex",
                                                        flexDirection: {
                                                          xs: "column",
                                                          sm: "row",
                                                        },
                                                        gap: 2,
                                                        alignItems: "stretch",
                                                      }}
                                                    >
                                                      <CustomTextField
                                                        label="Assign Total Box"
                                                        value={
                                                          cd.assign_total_box ||
                                                          ""
                                                        }
                                                        onChange={(e) =>
                                                          handleContainerDetailChange(
                                                            j,
                                                            k,
                                                            "assignTotalBox",
                                                          )(e.target.value)
                                                        }
                                                        error={
                                                          !!errors[
                                                            `${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].assignTotalBox`
                                                          ]
                                                        }
                                                        helperText={
                                                          errors[
                                                            `${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].assignTotalBox`
                                                          ]
                                                        }
                                                        sx={{
                                                          width: {
                                                            xs: "100%",
                                                            sm: "50%",
                                                          },
                                                        }}
                                                        disabled={true}
                                                      />
                                                      <CustomTextField
                                                        label="Assign Weight"
                                                        value={
                                                          cd.assign_weight || ""
                                                        }
                                                        onChange={(e) =>
                                                          handleContainerDetailChange(
                                                            j,
                                                            k,
                                                            "assignWeight",
                                                          )(e.target.value)
                                                        }
                                                        error={
                                                          !!errors[
                                                            `${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].assignWeight`
                                                          ]
                                                        }
                                                        helperText={
                                                          errors[
                                                            `${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].assignWeight`
                                                          ]
                                                        }
                                                        sx={{
                                                          width: {
                                                            xs: "100%",
                                                            sm: "50%",
                                                          },
                                                        }}
                                                        disabled={true}
                                                      />
                                                    </Box>
                                                    <Box
                                                      sx={{
                                                        display: "flex",
                                                        flexDirection: {
                                                          xs: "column",
                                                          sm: "row",
                                                        },
                                                        gap: 2,
                                                        alignItems: "stretch",
                                                      }}
                                                    >
                                                      <Autocomplete
                                                        options={
                                                          availableContainersForCd
                                                        }
                                                        value={displayValue}
                                                        onChange={(
                                                          e,
                                                          newValue,
                                                        ) => {
                                                          handleContainerDetailChange(
                                                            j,
                                                            k,
                                                            "container",
                                                          )(newValue);
                                                        }}
                                                        getOptionLabel={(
                                                          option,
                                                        ) =>
                                                          option.container_number ||
                                                          ""
                                                        }
                                                        isOptionEqualToValue={
                                                          autocompleteEquality
                                                        }
                                                        renderInput={(
                                                          params,
                                                        ) => (
                                                          <TextField
                                                            {...params}
                                                            label="Container"
                                                          />
                                                        )}
                                                        sx={{
                                                          width: {
                                                            xs: "100%",
                                                            sm: "50%",
                                                          },
                                                        }}
                                                        disabled
                                                      />
                                                      <CustomSelect
                                                        label="Status"
                                                        value={cd.status || ""}
                                                        onChange={(e) =>
                                                          handleContainerDetailChange(
                                                            j,
                                                            k,
                                                            "status",
                                                          )(e.target.value)
                                                        }
                                                        error={
                                                          !!errors[
                                                            `${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].status`
                                                          ]
                                                        }
                                                        helperText={
                                                          errors[
                                                            `${listKey}[${i}].shippingDetails[${j}].containerDetails[${k}].status`
                                                          ]
                                                        }
                                                        sx={{
                                                          width: {
                                                            xs: "100%",
                                                            sm: "50%",
                                                          },
                                                        }}
                                                        renderValue={(
                                                          selected,
                                                        ) =>
                                                          selected ||
                                                          "Select Status"
                                                        }
                                                        disabled={true}
                                                      >
                                                        <MenuItem value="">
                                                          Select Status
                                                        </MenuItem>
                                                        {statuses.map((s) => (
                                                          <MenuItem
                                                            key={s.id}
                                                            value={
                                                              s.order_status
                                                            }
                                                          >
                                                            {s.order_status}
                                                          </MenuItem>
                                                        ))}
                                                      </CustomSelect>
                                                    </Box>
                                                  </Stack>
                                                </Box>
                                              );
                                            },
                                          )}
                                          <Box
                                            sx={{
                                              p: 1,
                                              border: 1,
                                              borderColor: "grey.300",
                                              borderRadius: 1,
                                              bgcolor: "grey.50",
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              color="primary"
                                              fontWeight="bold"
                                            >
                                              Total Assign Number:{" "}
                                              {calculateSumAssignTotalBox(
                                                sd,
                                              ).toLocaleString()}{" "}
                                              | Total Assign Weight:{" "}
                                              {calculateSumAssignWeight(
                                                sd,
                                              ).toFixed(2)}
                                            </Typography>
                                          </Box>
                                        </Stack>
                                      </>
                                    )}
                                  </Stack>
                                </Box>
                              );
                            })
                          )}
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ justifyContent: "space-between" }}
                          >
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => addShippingFn(i)}
                            >
                              Add Shipping Detail
                            </Button>
                          </Stack>
                        </Stack>
                      );
                      return (
                        <Box
                          key={i}
                          sx={{
                            p: 2,
                            border: 1,
                            borderColor: "grey.300",
                            borderRadius: 2,
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Typography
                              variant="subtitle1"
                              color="primary"
                              fontWeight={"bold"}
                            >
                              {typePrefix} {i + 1}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                onClick={() => duplicateRecFn(i)}
                                size="small"
                                title="Duplicate"
                                color="primary"
                              >
                                <ContentCopyIcon />
                              </IconButton>
                              {currentList.length > 1 && (
                                <IconButton
                                  onClick={() => removeRecFn(rec)}
                                  size="small"
                                  title="Delete"
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Stack>
                          </Stack>
                          {/* Show validation warnings if present */}
                          {rec.validationWarnings && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              {Object.entries(rec.validationWarnings)
                                .map(
                                  ([key, msg]) =>
                                    `${snakeToCamel(key)
                                      .replace(/([A-Z])/g, " $1")
                                      .trim()}: ${msg}`,
                                )
                                .join("; ")}
                            </Alert>
                          )}
                          {/* Dynamic: Basic Info */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              gap: 2,
                              alignItems: "stretch",
                            }}
                          >
                            {/* ── Panel 2 receiver/sender autocomplete (uses options3 from context) ── */}
                            <Autocomplete
                              options={options3}
                              loading={loading}
                              freeSolo={true}
                              getOptionLabel={(option) =>
                                typeof option === "string"
                                  ? option
                                  : option.contact_name || ""
                              }
                              isOptionEqualToValue={(option, value) => {
                                if (typeof value === "string") {
                                  return typeof option === "string"
                                    ? option === value
                                    : (option.contact_name || "") === value;
                                }
                                return (
                                  typeof option !== "string" &&
                                  (option.zoho_id === value.zoho_id ||
                                    option.id === value.id)
                                );
                              }}
                              value={rec[nameField] || null}
                              onChange={handleNameChange}
                              disabled={isFieldDisabled(
                                `${recDisabledPrefix}.${isSenderMode ? "senderName" : "receiverName"}`,
                              )}
                              onInputChange={(_, newInputValue) =>
                                setSearchTerm3(newInputValue)
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label={`${typePrefix} Name`}
                                  error={
                                    !!errors[`${listKey}[${i}].${nameField}`]
                                  }
                                  helperText={
                                    errors[`${listKey}[${i}].${nameField}`]
                                  }
                                  disabled={isFieldDisabled(
                                    `${recDisabledPrefix}.${isSenderMode ? "senderName" : "receiverName"}`,
                                  )}
                                  fullWidth
                                />
                              )}
                              renderOption={(props, option) => (
                                <li
                                  {...props}
                                  key={
                                    typeof option === "string"
                                      ? option
                                      : option.zoho_id || option.id
                                  }
                                >
                                  <div>
                                    <strong>
                                      {typeof option === "string"
                                        ? option
                                        : option.contact_name || ""}
                                    </strong>
                                    {typeof option !== "string" &&
                                      option.email && (
                                        <div
                                          style={{
                                            fontSize: "0.875em",
                                            color: "#666",
                                          }}
                                        >
                                          {option.email}
                                        </div>
                                      )}
                                    {typeof option !== "string" &&
                                      option.primary_phone && (
                                        <div
                                          style={{
                                            fontSize: "0.875em",
                                            color: "#666",
                                          }}
                                        >
                                          {option.primary_phone}
                                        </div>
                                      )}
                                  </div>
                                </li>
                              )}
                              noOptionsText={
                                searchTerm3
                                  ? `No ${typePrefix.toLowerCase()}s found for "${searchTerm3}"`
                                  : `Type to search ${typePrefix.toLowerCase()}s`
                              }
                              clearOnBlur={false}
                              selectOnFocus={true}
                              style={{ width: "50%" }}
                            />
                            <CustomTextField
                              label={`${typePrefix} Contact`}
                              value={
                                isSenderMode
                                  ? rec.senderContact
                                  : rec.receiverContact
                              }
                              onChange={handleChangeFn(
                                i,
                                isSenderMode
                                  ? "senderContact"
                                  : "receiverContact",
                              )}
                              error={
                                !!errors[
                                  `${listKey}[${i}].${isSenderMode ? "senderContact" : "receiverContact"}`
                                ]
                              }
                              helperText={
                                errors[
                                  `${listKey}[${i}].${isSenderMode ? "senderContact" : "receiverContact"}`
                                ]
                              }
                              disabled={isFieldDisabled(
                                `${recDisabledPrefix}.${isSenderMode ? "senderContact" : "receiverContact"}`,
                              )}
                            />
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              py: 2,
                              flexDirection: { xs: "column", sm: "row" },
                              gap: 2,
                              alignItems: "stretch",
                            }}
                          >
                            <CustomTextField
                              label={`${typePrefix} Address`}
                              value={
                                isSenderMode
                                  ? rec.senderAddress
                                  : rec.receiverAddress
                              }
                              onChange={handleChangeFn(
                                i,
                                isSenderMode
                                  ? "senderAddress"
                                  : "receiverAddress",
                              )}
                              error={
                                !!errors[
                                  `${listKey}[${i}].${isSenderMode ? "senderAddress" : "receiverAddress"}`
                                ]
                              }
                              helperText={
                                errors[
                                  `${listKey}[${i}].${isSenderMode ? "senderAddress" : "receiverAddress"}`
                                ]
                              }
                              disabled={isFieldDisabled(
                                `${recDisabledPrefix}.${isSenderMode ? "senderAddress" : "receiverAddress"}`,
                              )}
                            />
                            <CustomTextField
                              label={`${typePrefix} Email`}
                              value={
                                isSenderMode
                                  ? rec.senderEmail
                                  : rec.receiverEmail
                              }
                              onChange={handleChangeFn(
                                i,
                                isSenderMode ? "senderEmail" : "receiverEmail",
                              )}
                              error={
                                !!errors[
                                  `${listKey}[${i}].${isSenderMode ? "senderEmail" : "receiverEmail"}`
                                ]
                              }
                              helperText={
                                errors[
                                  `${listKey}[${i}].${isSenderMode ? "senderEmail" : "receiverEmail"}`
                                ]
                              }
                              disabled={isFieldDisabled(
                                `${recDisabledPrefix}.${isSenderMode ? "senderEmail" : "receiverEmail"}`,
                              )}
                            />
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              py: 2,
                              flexDirection: { xs: "column", sm: "row" },
                              gap: 2,
                              alignItems: "stretch",
                            }}
                          >
                            <CustomTextField
                              label={`${typePrefix} Marks & Number`}
                              value={
                                isSenderMode
                                  ? rec.senderMarksNumber
                                  : rec.receiverMarksNumber
                              }
                              onChange={handleChangeFn(
                                i,
                                isSenderMode
                                  ? "senderMarksNumber"
                                  : "receiverMarksNumber",
                              )}
                              error={
                                !!errors[
                                  `${listKey}[${i}].${isSenderMode ? "senderMarksNumber" : "receiverMarksNumber"}`
                                ]
                              }
                              helperText={
                                errors[
                                  `${listKey}[${i}].${isSenderMode ? "senderMarksNumber" : "receiverMarksNumber"}`
                                ]
                              }
                              disabled={isFieldDisabled(
                                `${recDisabledPrefix}.${isSenderMode ? "senderMarksNumber" : "receiverMarksNumber"}`,
                              )}
                              fullWidth
                            />
                            <CustomTextField
                              label="Remarks"
                              value={rec.remarks || ""}
                              onChange={handleChangeFn(i, "remarks")}
                              multiline
                              rows={3}
                              fullWidth
                              disabled={isFieldDisabled(
                                `${recDisabledPrefix}.remarks`,
                              )}
                            />
                          </Box>
                          {renderShippingSection()}
                        </Box>
                      );
                    };
                    const handleEmptyRecChange = (field, value) => {
                      addRecFn();
                      const fn = isSenderMode
                        ? handleSenderChange
                        : handleReceiverChange;
                      fn(0, field)({ target: { value } });
                    };
                    const emptyRec = {
                      [isSenderMode ? "senderName" : "receiverName"]: "",
                      [isSenderMode ? "senderContact" : "receiverContact"]: "",
                      [isSenderMode ? "senderAddress" : "receiverAddress"]: "",
                      [isSenderMode ? "senderEmail" : "receiverEmail"]: "",
                      [isSenderMode
                        ? "senderMarksNumber"
                        : "receiverMarksNumber"]: "",
                      eta: "",
                      etd: "",
                      shippingLine: "",
                      shippingDetails: [],
                    };
                    if (currentList.length === 0) {
                      const emptyI = 0;
                      return renderRecForm(emptyRec, emptyI);
                    } else {
                      return currentList.map((rec, i) => renderRecForm(rec, i));
                    }
                  })()}
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={
                      formData.senderType === "receiver"
                        ? addSender
                        : addReceiver
                    }
                    sx={{ alignSelf: "flex-start" }}
                  >
                    {formData.senderType === "receiver"
                      ? "Add Sender"
                      : "Add Receiver"}
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
            {/* ==================== TRANSPORT PANEL ==================== */}
            <Accordion
              expanded={expanded.has("panel3")}
              onChange={handleAccordionChange("panel3")}
              sx={{
                borderRadius: 2,
                boxShadow: "none",
                "&:before": { display: "none" },
                "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: expanded.has("panel3") ? "#0d6c6a" : "#fff3e0",
                  borderRadius: 2,
                  "& .MuiAccordionSummary-content": {
                    fontWeight: "bold",
                    color: expanded.has("panel3") ? "#fff" : "#f58220",
                  },
                }}
              >
                3. Transport & Delivery
              </AccordionSummary>

              <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                <Stack spacing={4}>
                  {/* Transport Type */}
                  <FormControl component="fieldset">
                    <Typography variant="h6" color="#f58220" gutterBottom>
                      Transport Type *
                    </Typography>
                    <RadioGroup
                      row
                      name="transportType"
                      value={formData.transportType || "Drop Off"}
                      onChange={handleChange}
                    >
                      <FormControlLabel
                        value="Drop Off"
                        control={<Radio />}
                        label="Drop Off"
                      />
                      <FormControlLabel
                        value="Collection"
                        control={<Radio />}
                        label="Collection"
                      />
                      <FormControlLabel
                        value="Third Party"
                        control={<Radio />}
                        label="Third Party"
                      />
                    </RadioGroup>
                  </FormControl>

                  {/* ====================== DROP OFF ====================== */}
                  {formData.transportType === "Drop Off" && (
                    <Stack spacing={3}>
                      <Typography variant="h6" color="#f58220">
                        Drop Off Details
                      </Typography>

                      <FormControl fullWidth>
                        <InputLabel>Select Receiver for Drop Off *</InputLabel>
                        <Select
                          value={formData.selectedReceiverForDropOff ?? ""}
                          onChange={(e) => {
                            const idx = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              selectedReceiverForDropOff: idx,
                              dropOffDetails: {
                                ...prev.dropOffDetails,
                                [idx]: prev.dropOffDetails?.[idx] || [{}],
                              },
                            }));
                          }}
                          label="Select Receiver for Drop Off *"
                        >
                          <MenuItem value="">-- Select Receiver --</MenuItem>
                          {(formData.receivers || []).map((rec, i) => (
                            <MenuItem key={i} value={i}>
                              {rec.receiverName || `Receiver ${i + 1}`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {formData.selectedReceiverForDropOff !== "" &&
                        formData.selectedReceiverForDropOff !== undefined && (
                          <Stack spacing={3}>
                            {(
                              formData.dropOffDetails?.[
                                formData.selectedReceiverForDropOff
                              ] || []
                            ).map((detail, idx) => (
                              <Paper
                                key={idx}
                                elevation={1}
                                sx={{ p: 3, borderRadius: 2 }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 2,
                                  }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                  >
                                    Drop-Off #{idx + 1}
                                  </Typography>
                                  {idx > 0 && (
                                    <Button
                                      size="small"
                                      color="error"
                                      onClick={() => removeDropOffEntry(idx)}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </Box>

                                <Grid container spacing={2}>
                                  <Grid item xs={12} sm={6}>
                                    <CustomSelect
                                      label="Drop Method *"
                                      value={detail.dropMethod || ""}
                                      onChange={(e) =>
                                        updateDropOffField(
                                          idx,
                                          "dropMethod",
                                          e.target.value,
                                        )
                                      }
                                    >
                                      <MenuItem value="">
                                        Select Method
                                      </MenuItem>
                                      <MenuItem value="Drop-Off">
                                        Drop-Off
                                      </MenuItem>
                                      <MenuItem value="RGSL Pickup">
                                        RGSL Pickup
                                      </MenuItem>
                                    </CustomSelect>
                                  </Grid>

                                  <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                      label="Person Name *"
                                      value={detail.dropoffName || ""}
                                      onChange={(e) =>
                                        updateDropOffField(
                                          idx,
                                          "dropoffName",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </Grid>

                                  <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                      label="CNIC / ID"
                                      value={detail.dropOffCnic || ""}
                                      onChange={(e) =>
                                        updateDropOffField(
                                          idx,
                                          "dropOffCnic",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </Grid>

                                  <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                      label="Mobile Number"
                                      value={detail.dropOffMobile || ""}
                                      onChange={(e) =>
                                        updateDropOffField(
                                          idx,
                                          "dropOffMobile",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </Grid>

                                  <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                      label="Plate No (Optional)"
                                      value={detail.plateNo || ""}
                                      onChange={(e) =>
                                        updateDropOffField(
                                          idx,
                                          "plateNo",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </Grid>

                                  <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                      label="Drop Date"
                                      type="date"
                                      value={detail.dropDate || ""}
                                      onChange={(e) =>
                                        updateDropOffField(
                                          idx,
                                          "dropDate",
                                          e.target.value,
                                        )
                                      }
                                      InputLabelProps={{ shrink: true }}
                                    />
                                  </Grid>
                                </Grid>
                              </Paper>
                            ))}

                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={addNewDropOffEntry}
                              sx={{ alignSelf: "flex-start" }}
                            >
                              Add Another Drop-Off Entry
                            </Button>
                          </Stack>
                        )}
                    </Stack>
                  )}

                  {/* ====================== COLLECTION ====================== */}
                  {formData.transportType === "Collection" && (
                    <Stack spacing={3}>
                      <Typography variant="h6" color="#f58220">
                        Collection Details
                      </Typography>

                      <CustomSelect
                        label="Collection Method"
                        name="collectionMethod"
                        value={formData.collectionMethod || ""}
                        onChange={handleChange}
                      >
                        <MenuItem value="">Select Method</MenuItem>
                        <MenuItem value="Delivered by RGSL">
                          Delivered by RGSL
                        </MenuItem>
                        <MenuItem value="Collected by Client">
                          Collected by Client
                        </MenuItem>
                      </CustomSelect>

                      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <CustomSelect
                          label="Scope"
                          name="collection_scope"
                          value={formData.collection_scope || "Partial"}
                          onChange={handleChange}
                        >
                          <MenuItem value="Full">Full</MenuItem>
                          <MenuItem value="Partial">Partial</MenuItem>
                        </CustomSelect>

                        {formData.collection_scope === "Partial" && (
                          <CustomTextField
                            label="Qty Delivered"
                            name="qtyDelivered"
                            type="number"
                            value={formData.qtyDelivered || ""}
                            onChange={handleChange}
                          />
                        )}
                      </Box>

                      <Stack spacing={2}>
                        <CustomTextField
                          label="Client Receiver Name"
                          name="clientReceiverName"
                          value={formData.clientReceiverName || ""}
                          onChange={handleChange}
                        />
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <CustomTextField
                            label="Receiver ID"
                            name="clientReceiverId"
                            value={formData.clientReceiverId || ""}
                            onChange={handleChange}
                          />
                          <CustomTextField
                            label="Receiver Mobile"
                            name="clientReceiverMobile"
                            value={formData.clientReceiverMobile || ""}
                            onChange={handleChange}
                          />
                        </Box>
                        <CustomTextField
                          label="Plate No (Optional)"
                          name="plateNo"
                          value={formData.plateNo || ""}
                          onChange={handleChange}
                        />
                        <CustomTextField
                          label="Delivery Date"
                          type="date"
                          name="deliveryDate"
                          value={formData.deliveryDate || ""}
                          onChange={handleChange}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Stack>

                      {/* Gatepass Upload */}
                      <Button
                        variant="outlined"
                        component="label"
                        sx={{ borderColor: "#f58220", color: "#f58220" }}
                      >
                        Upload Gatepass (Optional)
                        <input
                          type="file"
                          hidden
                          multiple
                          accept="image/*"
                          onChange={handleGatepassUpload}
                        />
                      </Button>
                    </Stack>
                  )}

                  {/* ====================== THIRD PARTY ====================== */}
                  {formData.transportType === "Third Party" && (
                    <Stack spacing={3}>
                      <Typography variant="h6" color="#f58220">
                        Third Party Transport
                      </Typography>

                      <CustomSelect
                        label="Transport Company"
                        name="thirdPartyTransport"
                        value={formData.thirdPartyTransport || ""}
                        onChange={handleChange}
                      >
                        {companies.map((c) => (
                          <MenuItem key={c.value} value={c.value}>
                            {c.label}
                          </MenuItem>
                        ))}
                      </CustomSelect>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <CustomTextField
                            label="Driver Name"
                            name="driverName"
                            value={formData.driverName || ""}
                            onChange={handleChange}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <CustomTextField
                            label="Driver Contact"
                            name="driverContact"
                            value={formData.driverContact || ""}
                            onChange={handleChange}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <CustomTextField
                            label="Driver NIC"
                            name="driverNic"
                            value={formData.driverNic || ""}
                            onChange={handleChange}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <CustomTextField
                            label="Pickup Location"
                            name="driverPickupLocation"
                            value={formData.driverPickupLocation || ""}
                            onChange={handleChange}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <CustomTextField
                            label="Truck Number"
                            name="truckNumber"
                            value={formData.truckNumber || ""}
                            onChange={handleChange}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
            <Accordion
              expanded={expanded.has("panel4")}
              onChange={handleAccordionChange("panel4")}
              sx={{
                borderRadius: 2,
                boxShadow: "none",
                "&:before": { display: "none" },
                "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: expanded.has("panel4") ? "#0d6c6a" : "#fff3e0",
                  borderRadius: 2,
                  "& .MuiAccordionSummary-content": {
                    fontWeight: "bold",
                    color: expanded.has("panel4") ? "#fff" : "#f58220",
                  },
                }}
              >
                4. Order Summary
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body1" fontWeight="medium">
                      Booking Ref:
                    </Typography>
                    <Chip
                      label={formData.bookingRef || "-"}
                      variant="outlined"
                      color="primary"
                    />
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body1" fontWeight="medium">
                      Point of Origin:
                    </Typography>
                    <Typography variant="body1">
                      {filterPlaces.find(
                        (p) => p.value === formData.pointOfOrigin,
                      )?.label || "-"}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body1" fontWeight="medium">
                      Place of Loading:
                    </Typography>
                    <Typography variant="body1">
                      {filterPlaces.find(
                        (p) => p.value === formData.placeOfLoading,
                      )?.label || "-"}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body1" fontWeight="medium">
                      Final Destination:
                    </Typography>
                    <Typography variant="body1">
                      {filterPlaces.find(
                        (p) => p.value === formData.finalDestination,
                      )?.label || "-"}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body1" fontWeight="medium">
                      Owner:
                    </Typography>
                    <Typography variant="body1">{ownerName || "-"}</Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="body1" fontWeight="medium">
                      {formData.senderType === "sender"
                        ? "Receivers:"
                        : "Senders:"}
                    </Typography>
                    {(formData.senderType === "sender"
                      ? formData.receivers
                      : formData.senders
                    ).map((rec, i) => (
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        key={i}
                      >
                        <Chip
                          sx={{ p: 2 }}
                          label={
                            formData.senderType === "sender"
                              ? rec.receiverName
                              : rec.senderName ||
                                `${formData.senderType === "sender" ? "Receiver" : "Sender"} ${i + 1}`
                          }
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          Delivered: {rec.qtyDelivered || 0} /{" "}
                          {(rec.shippingDetails || []).reduce(
                            (sum, sd) =>
                              sum + (parseInt(sd.totalNumber || 0) || 0),
                            0,
                          )}{" "}
                          items
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  {formData.receivers.some(
                    (rec) => rec.containers && rec.containers.length > 0,
                  ) && (
                    <Stack spacing={1}>
                      <Typography variant="body1" fontWeight="medium">
                        Assigned Containers:
                      </Typography>
                      {formData.receivers
                        ?.flatMap((rec) => rec.containers || [])
                        .map((cont, i) => (
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            key={i}
                          >
                            <Chip
                              sx={{ p: 2 }}
                              label={cont}
                              color="info"
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        ))}
                    </Stack>
                  )}
                  {/* New: Global Totals */}
                  <Divider />
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body1" fontWeight="medium">
                      Total Items (All{" "}
                      {formData.senderType === "sender"
                        ? "Receivers"
                        : "Senders"}
                      ):
                    </Typography>
                    <Chip
                      label={formData.globalTotalItems || "-"}
                      variant="outlined"
                      color="success"
                    />
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body1" fontWeight="medium">
                      Shipping Line:
                    </Typography>
                    <Typography variant="body1">
                      {firstPanel2Item.shippingLine || "-"}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body1" fontWeight="medium">
                      ETA:
                    </Typography>
                    <Typography variant="body1">
                      {firstPanel2Item.eta || "-"}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body1" fontWeight="medium">
                      Transport Type:
                    </Typography>
                    <Typography variant="body1">
                      {formData.transportType || "-"}
                    </Typography>
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
            <Accordion
              expanded={expanded.has("panel5")}
              onChange={handleAccordionChange("panel5")}
              sx={{
                borderRadius: 2,
                boxShadow: "none",
                "&:before": { display: "none" },
                "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: expanded.has("panel5") ? "#0d6c6a" : "#fff3e0",
                  borderRadius: 2,
                  "& .MuiAccordionSummary-content": {
                    fontWeight: "bold",
                    color: expanded.has("panel5") ? "#fff" : "#f58220",
                  },
                }}
              >
                5. Attachments
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    component="label"
                    sx={{
                      borderRadius: 2,
                      borderColor: "#f58220",
                      color: "#f58220",
                      px: 3,
                    }}
                  >
                    Upload File
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={handleFileUpload}
                    />
                  </Button>
                  {Array.isArray(formData.attachments) &&
                    formData.attachments.length > 0 && (
                      <Stack
                        spacing={1}
                        direction="row"
                        flexWrap="wrap"
                        gap={1}
                      >
                        {formData.attachments.map((attachment, i) => {
                          let label = "File";
                          let previewSrc;

                          if (typeof attachment === "string") {
                            label = attachment.split("/").pop() || "File";
                            previewSrc = attachment.startsWith("http")
                              ? attachment
                              : `${import.meta.env.VITE_API_URL || ""}${attachment}`;
                          } else if (attachment?.url) {
                            label =
                              attachment.originalname ||
                              attachment.filename ||
                              "File";
                            previewSrc = attachment.url;
                          } else if (
                            attachment instanceof File ||
                            attachment?.previewUrl
                          ) {
                            previewSrc =
                              attachment.previewUrl ||
                              URL.createObjectURL(attachment);
                            label = attachment.name || "File";
                          } else {
                            label = "Unknown";
                            previewSrc = null;
                          }

                          const isImage =
                            previewSrc?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                            attachment?.mimetype?.startsWith("image/");

                          return (
                            <Chip
                              key={i}
                              label={label}
                              color="secondary"
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                if (previewSrc) {
                                  setPreviewSrc(previewSrc);
                                  setPreviewOpen(true);
                                } else {
                                  console.warn(
                                    "No valid preview source for attachment:",
                                    attachment,
                                  );
                                }
                              }}
                              onDelete={() => {
                                if (attachment.previewUrl) {
                                  URL.revokeObjectURL(attachment.previewUrl);
                                }

                                const newAttachments =
                                  formData.attachments.filter(
                                    (_, index) => index !== i,
                                  );
                                setFormData((prev) => ({
                                  ...prev,
                                  attachments: newAttachments,
                                }));
                              }}
                              sx={{
                                cursor: previewSrc ? "pointer" : "default",
                                "&:hover": previewSrc
                                  ? {
                                      backgroundColor: "#f58220",
                                      color: "white",
                                      borderColor: "#f58220",
                                    }
                                  : {},
                              }}
                              deleteIcon={<DeleteIcon fontSize="small" />}
                            />
                          );
                        })}
                      </Stack>
                    )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
          {/* Bottom Buttons */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            gap={2}
            mt={4}
            pt={3}
            borderTop="1px solid #e0e0e0"
          >
            <Button
              onClick={() => generateReceiptPDF(selectedOrder)}
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: 2, borderColor: "#F58220", color: "#F58220" }}
            >
              Print Consignment Manifest
            </Button>
          </Stack>
        </Box>
      </Paper>
      {/* Preview Modal */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: "90vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle sx={{ position: "relative", pr: 6 }}>
          File Preview — {previewSrc?.split("/").pop() || "Attachment"}
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 3,
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: previewSrc ? "center" : "flex-start",
          }}
        >
          {previewSrc ? (
            previewSrc.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
            previewSrc.includes("image/upload") ? (
              <img
                src={previewSrc}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "75vh",
                  objectFit: "contain",
                  borderRadius: 8,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  background: "#f8f9fa",
                }}
                onError={(e) => {
                  e.target.src = "/fallback-image.png";
                  e.target.style.objectFit = "contain";
                  setSnackbar({
                    open: true,
                    message: "Failed to load image preview",
                    severity: "warning",
                  });
                }}
              />
            ) : previewSrc.toLowerCase().endsWith(".pdf") ||
              previewSrc.includes("application/pdf") ? (
              <Box
                sx={{
                  width: "100%",
                  height: "75vh",
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: 3,
                }}
              >
                <iframe
                  src={previewSrc}
                  title="PDF Preview"
                  width="100%"
                  height="100%"
                  style={{ border: "none" }}
                  onError={() => {
                    setSnackbar({
                      open: true,
                      message:
                        "Failed to load PDF preview — try downloading instead",
                      severity: "warning",
                    });
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  px: 4,
                  bgcolor: "grey.100",
                  borderRadius: 2,
                  width: "100%",
                  maxWidth: 500,
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Preview not available for this file type
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {previewSrc.split("/").pop() || "Unknown file"}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  href={previewSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mt: 2 }}
                >
                  Download File
                </Button>
              </Box>
            )
          ) : (
            <Typography color="text.secondary">No preview available</Typography>
          )}
        </DialogContent>

        {/* Optional footer with actions */}
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          {previewSrc && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              href={previewSrc}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {/* Snackbar for notifications */}
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
    </>
  );
};

export default OrderForm;
