import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api";
import { toast } from "react-toastify";

const TEAL = "#1a7a6e";
const ORANGE = "#e07b2a";
const RED = "#c0392b";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const statusStyle = (status) => {
  if (status === "approved")
    return { color: TEAL, bg: "#e6f3f1", border: TEAL };
  if (status === "rejected") return { color: RED, bg: "#fbebea", border: RED };
  return { color: ORANGE, bg: "#fdf1e6", border: ORANGE };
};

export default function KycCustomerDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get("customerId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [decision, setDecision] = useState("approved");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccessId, setUpdateSuccessId] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/kyc/customer-profile/${customerId}`);
      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to load customer profile");
      }

      setCustomer(data.customer);
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error("Failed to fetch KYC customer profile:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load customer profile",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchProfile();
  }, [customerId]);

  const totalLogCount = useMemo(
    () => submissions.reduce((sum, s) => sum + (s.logs?.length || 0), 0),
    [submissions],
  );

  const latestSubmission = submissions[submissions.length - 1];

  const openModal = (submission) => {
    setActiveSubmission(submission);
    setDecision(submission.status === "rejected" ? "rejected" : "approved");
    setRemarks(submission.remarks || "");
    setSaveError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setActiveSubmission(null);
  };

  const handleSaveDecision = async () => {
    if (!activeSubmission) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await api.patch(
        `/api/kyc/submissions/${activeSubmission.id}`,
        { status: decision, remarks },
      );
      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to update submission");
      }

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === activeSubmission.id
            ? {
                ...s,
                status: data.submission.status,
                remarks: data.submission.remarks,
              }
            : s,
        ),
      );
      setModalOpen(false);
      setActiveSubmission(null);
    } catch (err) {
      console.error("Failed to update KYC submission:", err);
      setSaveError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update submission",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCustomer = async (submission) => {
    setUpdating(true);
    setUpdateError(null);
    try {
      const res = await api.patch(
        `/api/kyc/submissions/${submission.id}/update-customer`,
        {
          validateStatus: () => true,
        },
      );
      const data = res.data;

      if (!data.success) {
        toast.error("Failed to update customer");
      } else {
        setCustomer(data.customer);
        setUpdateSuccessId(submission.id);
        toast.success(data.message);
      }
    } catch (err) {
      toast.error("Something went wrong!");
      setUpdateError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update customer",
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (error || !submissions.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/customers/kyc")}
          >
            Back to KYC Module
          </Button>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6">
              {error || "No KYC submissions found for this customer."}
            </Typography>
          </Paper>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3} className="no-print">
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/customers/kyc")}
          >
            Back to KYC Module
          </Button>
        </Stack>

        <Paper
          sx={{
            p: { xs: 2, md: 4 },
            "@media print": { boxShadow: "none", border: "1px solid #d0d7de" },
          }}
        >
          <Stack spacing={3}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ color: ORANGE }}>
                KYC Customer Profile
              </Typography>
            </Box>

            <Typography variant="h6" fontWeight={700}>
              Customer Details
            </Typography>

            {customer ? (
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, flex: 1, borderTop: `3px solid ${TEAL}` }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    <b>Contact Name</b>
                  </Typography>
                  <Typography variant="body1">
                    {customer.contact_name || "—"}
                  </Typography>
                </Paper>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, flex: 1, borderTop: `3px solid ${TEAL}` }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    <b>Email</b>
                  </Typography>
                  <Typography variant="body1">
                    {customer.email || "—"}
                  </Typography>
                </Paper>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, flex: 1, borderTop: `3px solid ${TEAL}` }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    <b>Phone</b>
                  </Typography>
                  <Typography variant="body1">
                    {customer.phone_number || "—"}
                  </Typography>
                </Paper>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, flex: 1, borderTop: `3px solid ${TEAL}` }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    <b>Address</b>
                  </Typography>
                  <Typography variant="body1">
                    {customer.address || "—"}
                  </Typography>
                </Paper>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    flex: 1,
                    borderTop: `3px solid ${customer.status ? TEAL : RED}`,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    <b>Account Status</b>
                  </Typography>
                  <Chip
                    label={customer.status ? "Active" : "Inactive"}
                    sx={{
                      mt: 0.5,
                      fontWeight: 600,
                      color: customer.status ? TEAL : RED,
                      bgcolor: customer.status ? "#e6f3f1" : "#fbebea",
                    }}
                  />
                </Paper>
              </Stack>
            ) : (
              <Paper
                variant="outlined"
                sx={{ p: 2, borderLeft: `4px solid ${ORANGE}` }}
              >
                <Typography variant="body2" sx={{ color: ORANGE }}>
                  No matching record found in the customers table for
                  customer_ref <strong>{customerId}</strong>.
                </Typography>
              </Paper>
            )}

            <Typography variant="subtitle1" fontWeight={700}>
              Profile Summary
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <b>Profile Type</b>
                </Typography>
                <Typography variant="body1">
                  {customer.contact_type
                    ? customer.contact_type.charAt(0).toUpperCase() +
                      customer.contact_type.slice(1)
                    : ""}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <b>Customer Type</b>
                </Typography>
                <Typography variant="body1">
                  {customer.type
                    ? customer.type === "both"
                      ? "Sender & Receiver"
                      : customer.type.charAt(0).toUpperCase() +
                        customer.type.slice(1)
                    : ""}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <b>Customer Since</b>
                </Typography>
                <Typography variant="body1">
                  {formatDate(customer?.created_time)}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <b>KYC Submissions</b>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: TEAL, fontWeight: 700 }}
                >
                  {submissions.length}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <b>Access Logs</b>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: ORANGE, fontWeight: 700 }}
                >
                  {totalLogCount}
                </Typography>
              </Paper>
            </Stack>

            <Divider sx={{ borderColor: TEAL, opacity: 0.3 }} />

            <Typography variant="h6" fontWeight={700}>
              Submission History
            </Typography>

            <Stack spacing={3}>
              {submissions.map((submission) => {
                const style = statusStyle(submission.status);
                return (
                  <Paper
                    key={submission.id}
                    variant="outlined"
                    sx={{
                      borderLeft: `5px solid ${style.border}`,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <Box sx={{ bgcolor: style.bg, px: 3, py: 2 }}>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        alignItems={{ md: "center" }}
                        spacing={1}
                      >
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            KYC Submission — {submission.form_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Submitted {formatDate(submission.created_at)}
                            {submission.company
                              ? ` · ${submission.company}`
                              : ""}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={submission.status.toUpperCase()}
                            size="medium"
                            sx={{
                              fontWeight: 600,
                              color: style.color,
                              bgcolor: "#fff",
                              border: `1px solid ${style.border}`,
                            }}
                          />
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => openModal(submission)}
                            disabled={submission.status !== "pending"}
                            sx={{
                              bgcolor: TEAL,
                              "&:hover": { bgcolor: "#155f56" },
                              "&.Mui-disabled": {
                                bgcolor: "#e0e0e0",
                                color: "#9e9e9e",
                              },
                            }}
                          >
                            {submission.status === "pending"
                              ? "Review"
                              : "Reviewed"}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleUpdateCustomer(submission)}
                            disabled={
                              submission.status !== "approved" || updating
                            }
                          >
                            {updating && updateSuccessId !== submission.id
                              ? "Updating..."
                              : updateSuccessId === submission.id
                                ? "Updated ✓"
                                : "Update Customer"}
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>

                    <Box sx={{ p: 3 }}>
                      <Stack spacing={3}>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            <b>Submitted Info</b>
                          </Typography>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={2}
                          >
                            <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                              >
                                <b>Name</b>
                              </Typography>
                              <Typography variant="body1">
                                {submission.name || "—"}
                              </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                              >
                                <b>Email</b>
                              </Typography>
                              <Typography variant="body1">
                                {submission.email || "—"}
                              </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                              >
                                <b>Phone</b>
                              </Typography>
                              <Typography variant="body1">
                                {submission.phone || "—"}
                              </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                              >
                                <b>Address</b>
                              </Typography>
                              <Typography variant="body1">
                                {submission.address || "—"}
                              </Typography>
                            </Paper>
                          </Stack>
                        </Box>

                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={2}
                        >
                          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              <b>Emirates ID</b>
                            </Typography>
                            <Typography variant="body1">
                              {submission.emirates_id || "—"}
                            </Typography>
                          </Paper>
                          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              <b>Passport Number</b>
                            </Typography>
                            <Typography variant="body1">
                              {submission.passport_number || "—"}
                            </Typography>
                          </Paper>
                          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              <b>Trade License</b>
                            </Typography>
                            <Typography variant="body1">
                              {submission.trade_license || "—"}
                            </Typography>
                          </Paper>
                        </Stack>

                        {submission.remarks && (
                          <Paper
                            variant="outlined"
                            sx={{ p: 2, bgcolor: "#fafafa" }}
                          >
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              <b>Remarks</b>
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {submission.remarks}
                            </Typography>
                          </Paper>
                        )}

                        {submission.attachments?.length > 0 && (
                          <Box>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              <b>Attachments</b>
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              {submission.attachments.map((att, index) => (
                                <Button
                                  key={att.id}
                                  size="small"
                                  variant="outlined"
                                  component="a"
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ borderColor: TEAL, color: TEAL }}
                                >
                                  Attachment #{index + 1}
                                </Button>
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {submission.signature_url && (
                          <Box>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              <b>Signature</b>
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              component="a"
                              href={submission.signature_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ borderColor: ORANGE, color: ORANGE }}
                            >
                              View Signature
                            </Button>
                          </Box>
                        )}

                        <Box>
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{ mb: 1 }}
                          >
                            Activity Timeline
                          </Typography>
                          <Stack spacing={1.5}>
                            <Box
                              sx={{
                                border: "1px solid #e5e7eb",
                                borderLeft: `3px solid ${TEAL}`,
                                borderRadius: 1,
                                p: 1.5,
                                backgroundColor: "#f8fafc",
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight={700}>
                                Form Submitted
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatDate(submission.created_at)}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                <b>{submission.name}</b> submitted the KYC
                                form&nbsp;
                                <b>(ID: {submission.form_id})</b>
                              </Typography>
                            </Box>

                            {submission.logs?.map((log) => (
                              <Box
                                key={log.id}
                                sx={{
                                  border: "1px solid #e5e7eb",
                                  borderLeft: `3px solid ${ORANGE}`,
                                  borderRadius: 1,
                                  p: 1.5,
                                  backgroundColor: "#fff",
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={700}
                                >
                                  Form Accessed
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {formatDate(log.created_at)}
                                </Typography>
                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  spacing={2}
                                  sx={{ mt: 0.5 }}
                                >
                                  <Typography variant="body2">
                                    IP: <b>{log.ip_address || "—"}</b>
                                  </Typography>
                                  <Typography variant="body2">
                                    Location: <b>{log.location || "—"}</b>
                                  </Typography>
                                  <Typography variant="body2">
                                    Browser: <b>{log.browser || "—"}</b>
                                  </Typography>
                                </Stack>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        </Paper>
      </Stack>

      <Dialog open={modalOpen} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          Review Submission {activeSubmission?.form_id}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="decision-label">Decision</InputLabel>
              <Select
                labelId="decision-label"
                label="Decision"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              >
                <MenuItem value="approved">Approve</MenuItem>
                <MenuItem value="rejected">Reject</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Remarks"
              multiline
              minRows={4}
              fullWidth
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add notes about this decision..."
            />

            {saveError && (
              <Typography variant="body2" sx={{ color: RED }}>
                {saveError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeModal} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveDecision}
            disabled={saving}
            sx={{
              bgcolor: decision === "rejected" ? RED : TEAL,
              "&:hover": {
                bgcolor: decision === "rejected" ? "#a53225" : "#155f56",
              },
            }}
          >
            {saving
              ? "Saving..."
              : decision === "rejected"
                ? "Reject Submission"
                : "Approve Submission"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
