import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { api } from "../../api";
import { generateGatepassPDF } from "../../documents/gatepassGenerator";

const GatepassCreateModal = ({
  open,
  onClose,
  collection,
  order,
  receiverName,
  marksAndNumber,
  customerContact,
  cargoDefaults,
  draft = false,
  onCreated,
}) => {
  const [form, setForm] = useState({
    customerName: "",
    customerContact: "",
    marksAndNumber: "",
    qty: "",
    weight: "",
    commodity: "",
    driverName: "",
    driverContact: "",
    driverId: "",
    pickupLocation: "",
    plateNo: "",
    gateDate: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      customerName: receiverName || "",
      customerContact: customerContact || "",
      marksAndNumber: marksAndNumber || "",
      qty: cargoDefaults?.qty ?? "",
      weight: cargoDefaults?.weight ?? "",
      commodity: cargoDefaults?.commodity || "",
      driverName: "",
      driverContact: "",
      driverId: "",
      pickupLocation: "",
      plateNo: collection?.plateNo || "",
      gateDate: new Date().toISOString().slice(0, 10),
    });
  }, [open]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const buildPdfArgs = (gpNumber) => ({
    gpNumber,
    orderBookingRef: order?.booking_ref,
    receiverName,
    customerName: form.customerName,
    customerContact: form.customerContact,
    marksAndNumber: form.marksAndNumber,
    driverName: form.driverName,
    driverId: form.driverId,
    driverContact: form.driverContact,
    plateNo: form.plateNo,
    pickupLocation: form.pickupLocation,
    qty: form.qty,
    weight: form.weight,
    commodity: form.commodity,
    gateDate: form.gateDate,
    collectionMethod: collection?.collectionMethod,
  });

  const handlePreview = async () => {
    if (!form.driverName || !form.plateNo) {
      toast.error("Driver name and truck number are required to preview.");
      return;
    }
    try {
      const doc = await generateGatepassPDF({
        ...buildPdfArgs("PREVIEW-DRAFT"),
        download: false,
      });
      window.open(doc.output("bloburl"), "_blank");
    } catch (err) {
      console.error("Gatepass preview failed:", err);
      toast.error("Failed to generate preview");
    }
  };

  const handleGenerate = async () => {
    if (!form.driverName || !form.plateNo) {
      toast.error("Driver name and truck number are required.");
      return;
    }

    if (draft) {
      try {
        const doc = await generateGatepassPDF({
          ...buildPdfArgs(`DRAFT-${Date.now()}`),
          download: true,
        });
        window.open(doc.output("bloburl"), "_blank");
      } catch (err) {
        console.error("Gatepass generation failed:", err);
        toast.error("Failed to generate gatepass PDF");
      }
      onCreated?.({ ...form });
      onClose();
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post(
        `/api/orders/collections/${collection.id}/gatepass`,
        form,
      );
      const doc = await generateGatepassPDF({
        ...buildPdfArgs(data.gatepass.gp_number),
        download: true,
      });
      window.open(doc.output("bloburl"), "_blank");
      toast.success(`Gatepass ${data.gatepass.gp_number} created`);
      onCreated?.(data.gatepass);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create gatepass");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
          <Typography variant="h6">Create Gatepass</Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            {order?.booking_ref} • {receiverName || "Select a receiver first"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: "#0d6c6a", display: "block", mb: 1 }}
        >
          Customer Details
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Customer Name"
              value={form.customerName}
              onChange={(e) => update({ customerName: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Customer Contact Number"
              value={form.customerContact}
              onChange={(e) => update({ customerContact: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Marks & Nos"
              value={form.marksAndNumber}
              onChange={(e) => update({ marksAndNumber: e.target.value })}
              helperText={marksAndNumber ? "Pre-filled from receiver" : ""}
              disabled={marksAndNumber ? true : false}
            />
          </Grid>
        </Grid>

        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: "#0d6c6a", display: "block", mb: 1 }}
        >
          Cargo Details
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="No. of Pkgs"
              value={form.qty}
              onChange={(e) => update({ qty: e.target.value })}
              helperText={
                cargoDefaults?.qty ? "Auto-filled from selected items" : ""
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Weight (KGS)"
              value={form.weight}
              onChange={(e) => update({ weight: e.target.value })}
              helperText={
                cargoDefaults?.weight ? "Auto-filled from selected items" : ""
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Commodity"
              value={form.commodity}
              onChange={(e) => update({ commodity: e.target.value })}
              helperText={
                cargoDefaults?.commodity
                  ? "Auto-filled from selected items"
                  : ""
              }
            />
          </Grid>
        </Grid>

        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: "#0d6c6a", display: "block", mb: 1 }}
        >
          Driver & Vehicle Details
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Driver Name"
              value={form.driverName}
              onChange={(e) => update({ driverName: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Driver Contact Number"
              value={form.driverContact}
              onChange={(e) => update({ driverContact: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Driver NIC Number"
              value={form.driverId}
              onChange={(e) => update({ driverId: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Pick Up Location"
              value={form.pickupLocation}
              onChange={(e) => update({ pickupLocation: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Truck Number"
              value={form.plateNo}
              onChange={(e) => update({ plateNo: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Dated"
              InputLabelProps={{ shrink: true }}
              value={form.gateDate}
              onChange={(e) => update({ gateDate: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="outlined" onClick={handlePreview}>
          Preview
        </Button>
        <Button
          variant="contained"
          disabled={saving}
          onClick={handleGenerate}
          sx={{ bgcolor: "#f58220", "&:hover": { bgcolor: "#d96f10" } }}
        >
          {saving
            ? "Generating..."
            : draft
              ? "Add Gatepass"
              : "Generate Gatepass"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GatepassCreateModal;
