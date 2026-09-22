import React, { useEffect, useState, useCallback } from "react";
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
  Dialog,
  DialogContent,
  IconButton,
  Button,
  CircularProgress,
  Chip,
  Typography,
  Divider,
  Stack,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { api } from "../../api";
import { OrderConfirmation } from "../../documents/orderConfirmationGenerator";

function SectionHeading({ icon, children }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
      {icon}
      <Typography
        variant="overline"
        sx={{ letterSpacing: 0.4, color: "text.secondary", fontWeight: 600 }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

function DetailField({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} noWrap title={value || ""}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

function AttachmentChip({ label, url }) {
  if (!url) {
    return (
      <Chip
        size="small"
        variant="outlined"
        icon={<InsertDriveFileOutlinedIcon sx={{ fontSize: 16 }} />}
        label={`${label} — not uploaded`}
        sx={{ color: "text.disabled", borderStyle: "dashed" }}
      />
    );
  }
  return (
    <Chip
      size="small"
      clickable
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      icon={<InsertDriveFileOutlinedIcon sx={{ fontSize: 16 }} />}
      label={label}
      sx={{ fontWeight: 500 }}
    />
  );
}

export default function BookingConfirmationsPage() {
  const fullScreen = useMediaQuery("(max-width:600px)");
  const [tab, setTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [docHtml, setDocHtml] = useState(null);
  const [submissionDetail, setSubmissionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/booking/list");
      setBookings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/booking/submissions");
      setSubmissions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 0) loadBookings();
    else loadSubmissions();
  }, [tab, loadBookings, loadSubmissions]);

  const openBookingDoc = async (id) => {
    setModalOpen(true);
    setDocHtml(null);
    setSubmissionDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/api/booking/${id}`);
      setDocHtml(OrderConfirmation(data.orderData, data.company, () => ""));
    } catch (err) {
      setDetailError("Failed to load booking document.");
    } finally {
      setDetailLoading(false);
    }
  };

  const openSubmissionDoc = async (submissionId) => {
    setModalOpen(true);
    setDocHtml(null);
    setSubmissionDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const { data } = await api.get(
        `/api/booking/submissions/${submissionId}`,
      );
      setSubmissionDetail(data);
    } catch (err) {
      setDetailError("Failed to load submission detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setDocHtml(null);
    setSubmissionDetail(null);
    setDetailError(null);
  };

  if (loading) {
    <Box sx={{ justifyContent: "center", alignItems: "center" }}>
      <CircularProgress />
    </Box>;
  }

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", py: 4, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" color="#f58220">
        Booking Confirmations
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        View Confirmation and Submission Forms.
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Booking Confirmations" />
        <Tab label="Submissions" />
      </Tabs>

      {!loading && tab === 0 && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Form ID</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Total Qty</TableCell>
                <TableCell>Total Weight</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Doc</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((b) => {
                const anySubmitted =
                  (b.senders || []).some((s) => s.booking_submitted_at) ||
                  (b.receivers || []).some((r) => r.booking_submitted_at);
                return (
                  <TableRow key={b.id}>
                    <TableCell>{b.form_id}</TableCell>
                    <TableCell>{b.company?.company}</TableCell>
                    <TableCell>{b.mode}</TableCell>
                    <TableCell>{b.subject}</TableCell>
                    <TableCell>{b.total_qty}</TableCell>
                    <TableCell>{b.total_weight}</TableCell>
                    <TableCell>
                      {new Date(b.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={anySubmitted ? "Submitted" : "Pending"}
                        color={anySubmitted ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openBookingDoc(b.id)}>
                        View Doc
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {!loading && tab === 1 && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Form ID</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Submitted By</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Submitted At</TableCell>
                <TableCell align="right">Doc</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((s) => (
                <TableRow key={s.submission_id}>
                  <TableCell>{s.form_id}</TableCell>
                  <TableCell>{s.company_name}</TableCell>
                  <TableCell>{s.submitter_name}</TableCell>
                  <TableCell>{s.participant_type}</TableCell>
                  <TableCell>
                    {new Date(s.submitted_at).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => openSubmissionDoc(s.submission_id)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog
        open={modalOpen}
        onClose={closeModal}
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen}
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : 3,
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {submissionDetail
                ? `Submission — ${submissionDetail.extras.participantRole}`
                : "Document"}
            </Typography>
            {submissionDetail && (
              <Typography variant="caption" color="text.secondary">
                {submissionDetail.company.company}
              </Typography>
            )}
          </Box>
          <IconButton onClick={closeModal} size="small" edge="end">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: docHtml ? 0 : 0 }}>
          {detailLoading && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 10,
              }}
            >
              <CircularProgress size={28} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Loading document…
              </Typography>
            </Box>
          )}

          {!detailLoading && detailError && (
            <Box sx={{ py: 8, textAlign: "center", px: 3 }}>
              <Typography variant="body2" color="error">
                {detailError}
              </Typography>
            </Box>
          )}

          {!detailLoading && !detailError && docHtml && (
            <iframe
              title="document-preview"
              srcDoc={docHtml}
              style={{
                width: "100%",
                height: "80vh",
                border: "none",
                display: "block",
              }}
            />
          )}

          {!detailLoading && !detailError && submissionDetail && (
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <SectionHeading
                    icon={
                      <DomainOutlinedIcon
                        fontSize="small"
                        sx={{ color: "text.secondary" }}
                      />
                    }
                  >
                    Company
                  </SectionHeading>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <DetailField
                      label="Company"
                      value={submissionDetail.company.company}
                    />
                    <DetailField
                      label="Mode"
                      value={submissionDetail.order.mode}
                    />
                    <DetailField
                      label="Address"
                      value={submissionDetail.company.address}
                    />
                    <DetailField
                      label="Phone"
                      value={submissionDetail.company.phone}
                    />
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <SectionHeading
                    icon={
                      <BadgeOutlinedIcon
                        fontSize="small"
                        sx={{ color: "text.secondary" }}
                      />
                    }
                  >
                    Submitter details
                  </SectionHeading>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <DetailField
                      label="Passport number"
                      value={submissionDetail.extras.passportNumber}
                    />
                    <DetailField
                      label="Emirates ID"
                      value={submissionDetail.extras.emiratesId}
                    />
                    <DetailField
                      label="Trade license number"
                      value={submissionDetail.extras.tradeLicenseNumber}
                    />
                    <DetailField
                      label="Expected date"
                      value={
                        submissionDetail.extras.expectedDate
                          ? new Date(
                              submissionDetail.extras.expectedDate,
                            ).toLocaleDateString()
                          : null
                      }
                    />
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <SectionHeading
                    icon={
                      <DescriptionOutlinedIcon
                        fontSize="small"
                        sx={{ color: "text.secondary" }}
                      />
                    }
                  >
                    Attachments
                  </SectionHeading>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <AttachmentChip
                      label="Passport"
                      url={submissionDetail.attachment?.passport_doc_url}
                    />
                    <AttachmentChip
                      label="Emirates ID"
                      url={submissionDetail.attachment?.emirates_doc_url}
                    />
                    <AttachmentChip
                      label="Trade license"
                      url={submissionDetail.attachment?.trade_license_doc_url}
                    />
                  </Stack>
                </Box>

                {submissionDetail.extras.signatureDataUrl && (
                  <>
                    <Divider />
                    <Box>
                      <SectionHeading
                        icon={
                          <BadgeOutlinedIcon
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                        }
                      >
                        Signature
                      </SectionHeading>
                      <Box
                        component="img"
                        src={submissionDetail.extras.signatureDataUrl}
                        alt="Signature"
                        sx={{
                          maxWidth: 280,
                          maxHeight: 110,
                          display: "block",
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                          p: 1.5,
                          bgcolor: "background.default",
                        }}
                      />
                    </Box>
                  </>
                )}

                {submissionDetail.formUrl && (
                  <Button
                    variant="contained"
                    disableElevation
                    startIcon={<PictureAsPdfOutlinedIcon />}
                    href={submissionDetail.formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      alignSelf: "flex-start",
                      borderRadius: 2,
                      textTransform: "none",
                    }}
                  >
                    Open original confirmation PDF
                  </Button>
                )}
              </Stack>
            </Box>
          )}

          {!detailLoading && !detailError && !docHtml && !submissionDetail && (
            <Box sx={{ py: 8, textAlign: "center", px: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Document snapshot unavailable for this submission.
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
