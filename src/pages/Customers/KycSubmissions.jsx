import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { toast } from "react-toastify";
import { generateKycSubmissionsPDF } from "../../Utlis/kycApprovedPDF";

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

export default function KycSubmissionsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/api/kyc/submissions");
        const data = res.data;

        if (!data.success) {
          throw new Error(data.message || "Failed to load KYC submissions");
        }

        if (!cancelled) setSubmissions(data.submissions || []);
      } catch (err) {
        console.error("Failed to fetch KYC submissions:", err);
        if (!cancelled)
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load KYC submissions",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSubmissions();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSubmissions = useMemo(() => {
    if (!search.trim()) return submissions;
    const term = search.trim().toLowerCase();
    return submissions.filter((s) =>
      [
        s.contact_name,
        s.name,
        s.email,
        s.phone,
        s.customer_phone,
        s.customer_ref,
        s.form_id,
        s.emirates_id,
        s.trade_license,
        s.company,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    );
  }, [submissions, search]);

  const handleViewDetails = (customerRef) => {
    navigate(`/kyc-submission?customerId=${encodeURIComponent(customerRef)}`);
  };

  const handlePrint = async () => {
    const result = await generateKycSubmissionsPDF(filteredSubmissions);
    if (result?.empty) {
      toast.warn("No submissions to print.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: ORANGE }}>
            KYC Submissions
          </Typography>
          <Typography color="text.secondary">
            All submitted KYC forms across customers.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ sm: "center" }}
        >
          <TextField
            label="Search by name, email, phone, customer ref, form ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: { xs: "100%", md: "30%" } }}
          />
          <Button
            variant="contained"
            onClick={handlePrint}
            disabled={!filteredSubmissions.length}
            sx={{ whiteSpace: "nowrap" }}
          >
            Print KYC Submissions
          </Button>
        </Stack>

        {error ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6">{error}</Typography>
          </Paper>
        ) : !filteredSubmissions.length ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6">No submissions found.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredSubmissions.map((submission) => {
              const style = statusStyle(submission.status);
              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  size={{ xs: 12, sm: 6, md: 4 }}
                  key={submission.id}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderTop: `4px solid ${style.border}`,
                      borderRadius: 2,
                      transition: "box-shadow 0.2s ease",
                      "&:hover": { boxShadow: 3 },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        sx={{ mb: 1.5 }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            noWrap
                          >
                            {submission.contact_name ||
                              submission.name ||
                              "Unnamed"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Form ID: {submission.form_id}
                            {submission.company
                              ? ` · ${submission.company}`
                              : ""}
                          </Typography>
                        </Box>
                        <Chip
                          label={submission.status}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            color: style.color,
                            bgcolor: style.bg,
                          }}
                        />
                      </Stack>

                      <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <EmailIcon
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                          <Typography variant="body2" noWrap>
                            Email: {submission.email || "—"}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PhoneIcon
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                          <Typography variant="body2" noWrap>
                            Phone:{" "}
                            {submission.phone ||
                              submission.customer_phone ||
                              "—"}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <BadgeIcon
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                          <Typography variant="body2" noWrap>
                            Address: {submission.address || "—"}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Typography variant="caption" color="text.secondary">
                        Submitted {formatDate(submission.created_at)}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        startIcon={<VisibilityIcon fontSize="small" />}
                        onClick={() =>
                          handleViewDetails(submission.customer_ref)
                        }
                        sx={{
                          bgcolor: TEAL,
                          "&:hover": { bgcolor: "#155f56" },
                        }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Stack>
    </Box>
  );
}
