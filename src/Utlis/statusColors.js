export const getStatusColors = (status) => {
  const colorMap = {
    Created: {
      bg: "#f5f5f5",
      text: "#616161",
    },

    "Ready for Loading": {
      bg: "#f3e5f5",
      text: "#7b1fa2",
    },

    "Loaded into Container": {
      bg: "#e0f2f1",
      text: "#00695c",
    },

    Loaded: {
      bg: "#e8f5e9",
      text: "#2e7d32",
    },

    "Shipment Processing": {
      bg: "#fff3e0",
      text: "#ef6c00",
    },

    "Submitted On Vessel": {
      bg: "#ede7f6",
      text: "#512da8",
    },

    "Shipment In Transit": {
      bg: "#e1f5fe",
      text: "#0277bd",
    },

    "In Transit": {
      bg: "#e1f5fe",
      text: "#0277bd",
    },

    "Under Processing": {
      bg: "#fff3e0",
      text: "#f57c00",
    },

    Arrived: {
      bg: "#f1f8e9",
      text: "#689f38",
    },

    "Arrived at Sort Facility": {
      bg: "#f1f8e9",
      text: "#689f38",
    },

    "Arrived at Facility": {
      bg: "#f1f8e9",
      text: "#689f38",
    },

    "Ready for Delivery": {
      bg: "#fce4ec",
      text: "#c2185b",
    },

    "Shipment Delivered": {
      bg: "#e8f5e9",
      text: "#2e7d32",
    },

    Delivered: {
      bg: "#e8f5e9",
      text: "#2e7d32",
    },

    default: {
      bg: "#f5f5f5",
      text: "#666",
    },
  };

  return colorMap[status] || colorMap.default;
};
