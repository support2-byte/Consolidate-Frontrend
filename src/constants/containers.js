export const CONTAINER_STATUS_OPTIONS = [
  "Available",
  "Hired",
  "Occupied",
  "Under Repair",
  "Returned",
];

export const LOCATION_OPTIONS = [
  { value: "karachi_port", label: "Karachi Port" },
  { value: "dubai_port", label: "Dubai Port" },
];

export const CURRENCY_OPTIONS = [
  "USD",
  "EUR",
  "GBP",
  "AED",
  "PKR",
  "SAR",
  "INR",
];

export const STATUS_COLOR_MAP = {
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

export const BRAND = {
  teal: [13, 108, 106],
  orange: [245, 130, 32],
  lightGrey: [245, 245, 245],
  borderGrey: [210, 210, 210],
};

export const TABLE_HEADERS = [
  "Container No.",
  "Size",
  "Type",
  "Ownership",
  "Status",
  "ETA Status",
  "Location",
  "Consignment",
  "Last Used",
  "Actions",
];

export const HISTORY_TABLE_HEADERS = [
  "Booking Ref",
  "Form No",
  "Summary",
  "Qty",
  "Weight",
  "Updated By",
  "Assigned At",
  "Type",
];

export const UNASSIGNED_TABLE_HEADERS = [
  "#",
  "Date",
  "Booking Ref",
  "Form No",
  "Summary",
  "Qty",
  "Weight",
  "Updated By",
  "Type",
];

export const DEFAULT_FORM_DATA = {
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
};
