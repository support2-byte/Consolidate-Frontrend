import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { generateKycLogsPDF } from "../../Utlis/kycLogsBuilder";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

export default function KycLogsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/api/kyc/logs");
        const data = res.data;

        if (!data.success) {
          throw new Error(data.message || "Failed to load KYC logs");
        }

        if (!cancelled) setLogs(data.logs || []);
      } catch (err) {
        console.error("Failed to fetch KYC logs:", err);
        if (!cancelled)
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load KYC logs",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLogs();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const term = search.trim().toLowerCase();
    return logs.filter((log) =>
      [
        log.form_id,
        log.customer_ref,
        log.submitted_name,
        log.submitted_email,
        log.ip_address,
        log.location,
        log.browser,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    );
  }, [logs, search]);

  const paginatedLogs = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, page, rowsPerPage]);

  const handleChangePage = (_event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportPDF = async () => {
    if (!filteredLogs.length) return;
    setExporting(true);
    try {
      await generateKycLogsPDF(filteredLogs);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} color="#f58220">
              KYC Activity Logs
            </Typography>
            <Typography color="text.secondary">
              Form access activity across all customers — IP, location, and
              browser.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/kyc")}
            >
              Back to KYC Module
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handleExportPDF}
              disabled={exporting || !filteredLogs.length}
            >
              {exporting ? "Generating..." : "Print Logs"}
            </Button>
          </Stack>
        </Stack>

        <TextField
          label="Search by form ID, IP, location, browser..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ maxWidth: "350px" }}
        />

        {error ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6">{error}</Typography>
          </Paper>
        ) : !filteredLogs.length ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6">No logs found.</Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 2 }}>
            <TableContainer
              sx={{
                borderRadius: 2,
                overflow: "auto",
                maxHeight: 600,
              }}
            >
              <Table sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Customer Ref</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Browser</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLogs.map((log, index) => (
                    <TableRow
                      key={log.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate(
                          `/kyc-submissions?customerId=${encodeURIComponent(log.customer_ref)}`,
                        )
                      }
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{log.customer_ref || "—"}</TableCell>
                      <TableCell>{log.submitted_name || "—"}</TableCell>
                      <TableCell>{log.submitted_email || "—"}</TableCell>
                      <TableCell>{log.ip_address || "—"}</TableCell>
                      <TableCell>{log.location || "—"}</TableCell>
                      <TableCell>{log.browser || "—"}</TableCell>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
        <TablePagination
          component="div"
          count={filteredLogs.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Stack>
    </Box>
  );
}
