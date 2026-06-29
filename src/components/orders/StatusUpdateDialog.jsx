import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { api } from "../../api";

const StatusUpdateDialog = ({
  open,
  order,
  statuses,
  onClose,
  onUpdated,
  showSnackbar,
}) => {
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && order?.receivers?.length) {
      const firstReceiver = order.receivers[0];
      setSelectedReceiver(firstReceiver);
      setSelectedItem(firstReceiver.shippingdetails?.[0] || null);
      setSelectedStatus(firstReceiver.status || "Received for Shipment");
    } else if (!open) {
      setSelectedReceiver(null);
      setSelectedItem(null);
      setSelectedStatus("");
    }
  }, [open, order]);

  const handleReceiverChange = (e) => {
    const rec = order?.receivers?.find((r) => r.id === e.target.value);
    setSelectedReceiver(rec || null);
    setSelectedItem(rec?.shippingdetails?.[0] || null);
    setSelectedStatus(rec?.status || "Received for Shipment");
  };
  const handleItemChange = (e) => {
    setSelectedItem(
      selectedReceiver?.shippingdetails?.find(
        (d) => d.itemRef === e.target.value,
      ) || null,
    );
  };

  const handleConfirm = async () => {
    if (!order || !selectedReceiver || !selectedItem || !selectedStatus) return;
    setSubmitting(true);
    try {
      await api.put(
        `/api/orders/${order.id}/receivers/${selectedReceiver.id}/items/${selectedItem.itemRef}/status`,
        {
          status: selectedStatus,
          itemRefs: [selectedItem.itemRef],
          notifyClient: true,
          notifyParties: true,
        },
      );
      showSnackbar(
        `Status updated to "${selectedStatus}" for "${selectedReceiver.receiverName}" successfully! Notifications sent as per rules.`,
        "success",
      );
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error("Error updating status:", err);
      showSnackbar(
        err.response?.data?.details ||
          err.response?.message ||
          "Failed to update status",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Receiver Status</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Select receiver and new status for order "{order?.booking_ref}".
          Notifications will be sent based on rules.
        </Typography>
        <FormControl fullWidth margin="dense">
          <InputLabel>Receiver</InputLabel>
          <Select
            value={selectedReceiver?.id || ""}
            label="Receiver"
            onChange={handleReceiverChange}
          >
            {order?.receivers?.map((rec) => (
              <MenuItem key={rec.id} value={rec.id}>
                {rec.receiverName} | (Current: {rec.status})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Items</InputLabel>
          <Select
            value={selectedItem?.itemRef || ""}
            label="Items"
            onChange={handleItemChange}
          >
            {selectedReceiver?.shippingdetails?.map((rec) => (
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
            onChange={(e) => setSelectedStatus(e.target.value)}
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
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={submitting}
        >
          Update & Notify
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusUpdateDialog;
