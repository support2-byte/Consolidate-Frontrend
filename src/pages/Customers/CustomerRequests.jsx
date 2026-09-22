import { useEffect, useState, useCallback, useContext } from "react";
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { toast } from "react-toastify";
import { api } from "../../api";
import { AppContext } from "../../context/AppContext";

const TABS = [
  { key: "delivery", label: "Delivery Requests" },
  { key: "storage", label: "Storage Requests" },
  { key: "dropoff", label: "Drop-off Requests" },
];

const STORAGE_TYPES = ["Dry Storage", "Cold Storage", "Hazardous"];

export default function CustomerRequests() {
  const { getSystemRate } = useContext(AppContext);
  const [tab, setTab] = useState("delivery");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [reason, setReason] = useState("");
  const [storageType, setStorageType] = useState("");
  const [storageAmount, setStorageAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/internal/get-requests");
      setRequests(Array.isArray(res.data?.requests) ? res.data.requests : []);
    } catch (error) {
      toast.error("Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const openConfirm = (type, row, action) => {
    setReason("");
    setStorageType("");
    const rate = getSystemRate("storage_rate", 1);
    const months = Number(row.duration_months) || 1;
    const computed = Number(row.storage || 0) * rate * months;
    setStorageAmount(String(computed || row.amount || ""));
    setConfirm({ type, row, action });
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { type, row, action } = confirm;
    setSubmitting(true);
    try {
      if (action === "approve") {
        await api.post(`/api/internal/requests/${type}/${row.id}/approve`, {
          invoice_type: type,
          ...(type === "storage" && {
            storage_type: storageType,
            amount: Number(storageAmount),
          }),
        });
        toast.success("Approved and invoice created");
      } else {
        await api.post(`/api/internal/requests/${type}/${row.id}/reject`, {
          reason,
        });
        toast.success("Request rejected");
      }
      setConfirm(null);
      fetchRequests();
    } catch (error) {
      const msg = error?.response?.data?.message || "Action failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const storageApproveInvalid =
    confirm?.action === "approve" &&
    confirm?.type === "storage" &&
    (!storageType || !(Number(storageAmount) > 0));

  const rows = requests.filter((r) => r.request_type === tab);

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", py: 4, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" color="#f58220">
        Customer Requests
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        View and manage Mobile App Users Requests.
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Shipment</TableCell>
              <TableCell>Form #</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Subcategory</TableCell>
              {tab === "storage" && <TableCell>Size</TableCell>}
              {tab === "storage" && <TableCell>Type</TableCell>}
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested At</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No requests found
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              rows.map((row) => {
                const status = String(row.status || "").toLowerCase();
                const isPending = status === "pending";
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.customer_id}</TableCell>
                    <TableCell>{row.shipment_id}</TableCell>
                    <TableCell>{row.rgl_booking_number}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.subcategory}</TableCell>
                    {tab === "storage" && (
                      <TableCell>{row.size || "—"}</TableCell>
                    )}
                    {tab === "storage" && (
                      <TableCell>{row.storage_type || "—"}</TableCell>
                    )}
                    <TableCell>{row.amount}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          status
                            ? status.charAt(0).toUpperCase() + status.slice(1)
                            : "—"
                        }
                        size="small"
                        color={
                          status === "approved"
                            ? "success"
                            : status === "rejected"
                              ? "error"
                              : "warning"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="success"
                        disabled={!isPending}
                        onClick={() => openConfirm(tab, row, "approve")}
                      >
                        <CheckCircleOutlineIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        disabled={!isPending}
                        onClick={() => openConfirm(tab, row, "reject")}
                      >
                        <HighlightOffIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {confirm?.action === "approve"
            ? "Approve request?"
            : "Reject request?"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            {confirm?.action === "approve"
              ? "This will create an invoice for this customer."
              : "This request will be marked as rejected."}
          </Typography>
          {confirm?.action === "approve" && confirm?.type === "storage" && (
            <>
              <TextField
                select
                required
                fullWidth
                label="Storage Type"
                value={storageType}
                onChange={(e) => setStorageType(e.target.value)}
                sx={{ mb: 2 }}
              >
                {STORAGE_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                required
                fullWidth
                type="number"
                label="Invoice Amount (AED)"
                value={storageAmount}
                onChange={(e) => setStorageAmount(e.target.value)}
                slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              />
            </>
          )}
          {confirm?.action === "reject" && (
            <TextField
              label="Reason (optional)"
              fullWidth
              multiline
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirm?.action === "approve" ? "success" : "error"}
            onClick={handleConfirm}
            disabled={submitting || storageApproveInvalid}
          >
            {submitting ? <CircularProgress size={20} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
