import { useState, useEffect, useRef, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  Stack,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { api } from "../../api";
import { generateInvoicePDF } from "../../documents/invoiceGenerator";
import { pdfDocToPngBlob } from "../../lib/pdfToPng";
import { generateFormSeed } from "../../Utlis/idGenerator";
import { AppContext } from "../../context/AppContext";

const DEFAULT_BASE_RATE = 50;
const DEFAULT_TAX_PERCENT = 5;

const CreateInvoiceModal = ({
  open,
  onClose,
  order,
  receiverId,
  receiverName,
  itemRef,
  category,
  subcategory,
  overstayDays,
  onCreated,
}) => {
  const { getSystemRate } = useContext(AppContext);
  const [baseRate, setBaseRate] = useState(
    getSystemRate("overstay_rate", DEFAULT_BASE_RATE),
  );
  const [taxPercent, setTaxPercent] = useState(
    getSystemRate("tax", DEFAULT_TAX_PERCENT),
  );
  const [creating, setCreating] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewUrlRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (open) {
      setBaseRate(getSystemRate("overstay_rate", DEFAULT_BASE_RATE));
      setTaxPercent(getSystemRate("tax", DEFAULT_TAX_PERCENT));
      setCreatedInvoice(null);
    }
  }, [open, itemRef]);

  const invoiceId = `INV-${generateFormSeed()}`;
  const subtotal = (Number(baseRate) || 0) * (Number(overstayDays) || 0);
  const taxAmount = subtotal * ((Number(taxPercent) || 0) / 100);
  const total = subtotal + taxAmount;

  const buildPreview = async () => {
    if (!open) return;
    setPreviewLoading(true);
    try {
      const doc = await generateInvoicePDF({
        invoiceId: createdInvoice?.invoiceId || invoiceId,
        orderFormNumber: order?.rgl_booking_number,
        receiverName,
        category,
        subcategory,
        overstayDays,
        baseRate,
        taxPercent,
        subtotal,
        total,
        invoiceDate:
          createdInvoice?.createdAt || createdInvoice?.created_at || new Date(),
        dueDate: createdInvoice?.dueAt || createdInvoice?.due_at,
        download: false,
      });
      const pngBlob = await pdfDocToPngBlob(doc);
      const url = URL.createObjectURL(pngBlob);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch (err) {
      console.error("Invoice preview generation failed:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      buildPreview();
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [
    open,
    baseRate,
    taxPercent,
    overstayDays,
    receiverName,
    category,
    subcategory,
    createdInvoice,
  ]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await api.post(`/api/invoices/overstayed`, {
        invoiceId,
        orderId: order.id,
        receiverId,
        itemRef,
        category,
        subcategory,
        overstayDays,
        baseRate: Number(baseRate) || 0,
        taxPercent: Number(taxPercent) || 0,
        subtotal: Number(subtotal.toFixed(2)),
        total: Number(total.toFixed(2)),
      });
      setCreatedInvoice(data.invoice);
      toast.success("Invoice created and notification queued");
      onCreated?.(data.invoice);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create invoice");
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!createdInvoice) return;
    try {
      await generateInvoicePDF({
        invoiceId: createdInvoice.invoiceId || invoiceId,
        orderFormNumber: order?.rgl_booking_number,
        receiverName,
        category,
        subcategory,
        overstayDays,
        baseRate,
        taxPercent,
        subtotal,
        total,
        invoiceDate:
          createdInvoice.createdAt || createdInvoice.created_at || new Date(),
        dueDate: createdInvoice.dueAt || createdInvoice.due_at,
        download: true,
      });
    } catch (err) {
      console.error("Invoice PDF generation failed:", err);
      toast.error("Failed to generate invoice PDF");
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
          <Typography variant="h6">Create Overstayed Invoice</Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            {order?.booking_ref} • {receiverName || "—"} • {itemRef}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "#0d6c6a",
                display: "block",
                mb: 1,
              }}
            >
              Invoice Details
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Category"
                value={category || ""}
                disabled
              />
              <TextField
                fullWidth
                size="small"
                label="Sub-Category"
                value={subcategory || ""}
                disabled
              />
              <TextField
                fullWidth
                size="small"
                label="Receiver"
                value={receiverName || ""}
                disabled
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Overstayed Days"
                value={overstayDays ?? 0}
                disabled
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Base Rate (per day)"
                value={baseRate}
                inputProps={{ min: 0, step: "0.01" }}
                onChange={(e) => setBaseRate(e.target.value)}
                disabled={!!createdInvoice}
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Tax (%)"
                value={taxPercent}
                inputProps={{ min: 0, step: "0.01" }}
                onChange={(e) => setTaxPercent(e.target.value)}
                disabled={!!createdInvoice}
              />

              <Divider />

              <Box
                sx={{
                  bgcolor: "#f7f8fa",
                  borderRadius: 1.5,
                  p: 1.5,
                }}
              >
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {subtotal.toFixed(2)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Tax ({Number(taxPercent) || 0}%)
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {taxAmount.toFixed(2)}
                  </Typography>
                </Stack>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body1" fontWeight={700}>
                    Total
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="#f58220">
                    {total.toFixed(2)}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "#0d6c6a" }}
              >
                Invoice Preview
              </Typography>
              {createdInvoice && (
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "#2e7d32",
                    bgcolor: "#e8f5e9",
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                  }}
                >
                  Saved as{" "}
                  {createdInvoice.invoiceId || createdInvoice.invoice_id}
                </Typography>
              )}
            </Stack>
            <Box
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 1.5,
                p: previewUrl ? 1 : 3,
                minHeight: 460,
                bgcolor: "#f0f1f3",
                display: "flex",
                alignItems: previewUrl ? "flex-start" : "center",
                justifyContent: "center",
                overflow: "auto",
                position: "relative",
              }}
            >
              {previewLoading && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(255,255,255,0.9)",
                    borderRadius: "50%",
                    p: 0.5,
                    display: "flex",
                  }}
                >
                  <CircularProgress size={16} />
                </Box>
              )}
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Invoice preview"
                  sx={{
                    width: "100%",
                    borderRadius: 1,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                    bgcolor: "#fff",
                  }}
                />
              ) : (
                <Typography color="text.secondary" variant="body2">
                  Generating preview...
                </Typography>
              )}
            </Box>

            <Button
              variant="outlined"
              disabled={!createdInvoice}
              onClick={handleDownloadPdf}
              sx={{ mt: 2 }}
            >
              Download PDF
            </Button>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          disabled={creating || !!createdInvoice}
          onClick={handleCreate}
          sx={{ bgcolor: "#f58220", "&:hover": { bgcolor: "#d96f10" } }}
        >
          {creating
            ? "Creating..."
            : createdInvoice
              ? "Invoice Created"
              : "Create Invoice"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInvoiceModal;
