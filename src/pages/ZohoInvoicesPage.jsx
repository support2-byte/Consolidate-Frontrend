import { useState, useEffect, useMemo, useContext } from "react";
import { AppContext } from "../context/AppContext";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  MenuItem,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import NavigateBeforeRoundedIcon from "@mui/icons-material/NavigateBeforeRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import { toast } from "react-toastify";
import { api } from "../api";
import { useThemeContext } from "../context/ThemeContext";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partially_paid", label: "Partially paid" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

const PAGE_SIZES = [10, 25, 50, 100];

const getStatusColor = (status) => {
  switch (status) {
    case "paid":
      return "success";
    case "overdue":
      return "error";
    case "unpaid":
    case "partially_paid":
      return "warning";
    case "sent":
    case "viewed":
      return "info";
    default:
      return "default";
  }
};

const formatStatus = (s = "") =>
  s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const formatMoney = (amount, currency) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(amount ?? 0);
  } catch {
    return `${currency || ""} ${amount ?? 0}`;
  }
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function ZohoInvoicesPage() {
  const { mode } = useThemeContext();

  const {
    zohoInvoices,
    zohoInvoicesLoading,
    zohoInvoicesSyncing,
    syncZohoInvoices,
  } = useContext(AppContext);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const showNotification = (msg, severity = "success") => {
    if (severity === "error") toast.error(msg);
    else if (severity === "warning") toast.warning(msg);
    else if (severity === "info") toast.info(msg);
    else toast.success(msg);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const tableLoading = zohoInvoicesLoading || zohoInvoicesSyncing;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return zohoInvoices.filter(
      (i) =>
        (!status || i.status === status) &&
        (!q ||
          [
            i.invoice_number,
            i.customer_name,
            i.reference_number,
            i.order_number,
            i.consignment_number,
          ].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [zohoInvoices, status, search]);

  const invoices = filtered.slice((page - 1) * perPage, page * perPage);
  const hasMore = page * perPage < filtered.length;

  const handleViewPdf = async (id) => {
    setPdfLoadingId(id);
    try {
      const { data } = await api.get(`/api/zoho-invoice/${id}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(
        new Blob([data], { type: "application/pdf" }),
      );
      window.open(url, "_blank");
    } catch (err) {
      showNotification("Failed to load invoice PDF.", "error");
    } finally {
      setPdfLoadingId(null);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ color: "#0d6c6a" }}
          >
            Zoho Invoices
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Invoices synced live from Zoho Books.
          </Typography>
        </Box>

        <Tooltip title="Refresh data">
          <IconButton
            onClick={syncZohoInvoices}
            disabled={tableLoading}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search invoice number, customer or reference…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
        <TextField
          select
          size="small"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          SelectProps={{ displayEmpty: true }}
          sx={{
            minWidth: { sm: 200 },
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
        >
          {STATUS_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
      >
        {tableLoading && <LinearProgress sx={{ height: 3 }} color="primary" />}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ background: "transparent" }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead
              sx={{
                backgroundColor:
                  mode === "dark"
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(0,0,0,0.01)",
              }}
            >
              <TableRow>
                <TableCell width={80} align="center" sx={{ fontWeight: 600 }}>
                  S No.
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    display: { xs: "none", lg: "table-cell" },
                  }}
                >
                  Order #
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    display: { xs: "none", lg: "table-cell" },
                  }}
                >
                  Consignment #
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    display: { xs: "none", md: "table-cell" },
                  }}
                >
                  Date
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Due date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Total
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Balance
                </TableCell>
                <TableCell width={80} align="center" sx={{ fontWeight: 600 }}>
                  PDF
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ fontWeight: 500 }}
                    >
                      {tableLoading
                        ? "Loading invoices..."
                        : "No invoices found."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv, index) => (
                  <TableRow
                    key={inv.invoice_id}
                    hover
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell align="center">
                      {(page - 1) * perPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {inv.invoice_number}
                      </Typography>
                      {inv.reference_number && (
                        <Typography variant="caption" color="text.secondary">
                          Ref: {inv.reference_number}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {inv.customer_name}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ display: { xs: "none", lg: "table-cell" } }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {inv.order_number || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ display: { xs: "none", lg: "table-cell" } }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {inv.consignment_number || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ display: { xs: "none", md: "table-cell" } }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(inv.date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(inv.due_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={formatStatus(inv.status)}
                        color={getStatusColor(inv.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatMoney(inv.total, inv.currency_code)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={inv.balance > 0 ? "error" : "text.secondary"}
                      >
                        {formatMoney(inv.balance, inv.currency_code)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View PDF">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleViewPdf(inv.invoice_id)}
                            disabled={pdfLoadingId === inv.invoice_id}
                          >
                            {pdfLoadingId === inv.invoice_id ? (
                              <CircularProgress size={18} />
                            ) : (
                              <PictureAsPdfRoundedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            px: 2,
            py: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Rows per page
            </Typography>
            <TextField
              select
              size="small"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Typography variant="body2">Page {page}</Typography>
          <Box>
            <IconButton
              disabled={page <= 1 || tableLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              <NavigateBeforeRoundedIcon />
            </IconButton>
            <IconButton
              disabled={!hasMore || tableLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              <NavigateNextRoundedIcon />
            </IconButton>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
