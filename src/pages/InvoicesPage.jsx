import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Button,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { api } from "../api";
import { generateInvoicePDF } from "../documents/invoiceGenerator";
import { generateGenericInvoicePDF } from "../documents/genericInvoiceGenerator";

const TABS = [
  {
    index: 0,
    key: "overstay",
    label: "Overstay Invoices",
    endpoint: "api/invoices/overstayed/list",
  },
  {
    index: 1,
    key: "storage",
    label: "Storage Invoices",
    endpoint: "api/invoices/storage/list",
  },
  {
    index: 2,
    key: "delivery",
    label: "Delivery Invoices",
    endpoint: "api/invoices/delivery/list",
  },
  {
    index: 3,
    key: "dropoff",
    label: "Drop-off Invoices",
    endpoint: "api/invoices/dropoff/list",
  },
];

const STATUS_COLORS = {
  paid: { bg: "#e8f5e9", text: "#2e7d32" },
  pending: { bg: "#fff3e0", text: "#ef6c00" },
  overdue: { bg: "#ffebee", text: "#c62828" },
  failed: { bg: "#ffebee", text: "#c62828" },
  default: { bg: "#f5f5f5", text: "#666" },
};

const getColors = (map, key) => map[key] || map.default;

const formatLabel = (key) => {
  if (!key) return "";
  return String(key)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleString();
};

const formatCurrency = (val) => {
  if (val === null || val === undefined) return "—";
  return `${Number(val).toFixed(2)} AED`;
};

const InvoicesPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [detailsRow, setDetailsRow] = useState(null);

  const currentTab = TABS[activeTab];

  useEffect(() => {
    fetchData(currentTab);
    setSearch("");
    setStatusFilter("all");
    setPage(0);
  }, [activeTab]);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  const handleChangePage = (_, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const fetchData = async (tab) => {
    setLoading(true);
    setError(null);
    setRows([]);
    try {
      const res = await api.get(tab.endpoint);
      const payload = res.data;

      if (!payload?.success) {
        throw new Error(payload?.message || "API error");
      }

      setRows(payload.invoices || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setRows([]);
      } else {
        setError(
          err.response?.data?.message || err.message || "Failed to load data",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    let result = rows;

    if (statusFilter !== "all") {
      result = result.filter(
        (r) => String(r.status).toLowerCase() === statusFilter,
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some(
          (v) =>
            v !== null &&
            v !== undefined &&
            String(v).toLowerCase().includes(q),
        ),
      );
    }

    return result;
  }, [rows, search, statusFilter]);

  const paginatedRows = useMemo(
    () =>
      filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const handleDownload = async (row) => {
    setDownloadingId(row.id);
    try {
      if (currentTab.key === "overstay") {
        await generateInvoicePDF({
          invoiceId: row.invoiceId,
          orderFormNumber: row.orderRef,
          receiverName: row.receiverName,
          receiverContact: row.receiverContact,
          category: row.category,
          subcategory: row.subcategory,
          overstayDays: row.overstayDays,
          baseRate: row.baseRate,
          taxPercent: row.taxPercent,
          subtotal: row.subtotal,
          total: row.amount,
          invoiceDate: row.createdAt,
          download: true,
        });
      } else {
        await generateGenericInvoicePDF({
          invoiceType: currentTab.key,
          invoiceId: row.invoiceId,
          orderFormNumber: row.orderRef,
          receiverName: row.receiverName,
          receiverContact: row.receiverContact,
          category: row.category,
          subcategory: row.subcategory,
          size: row.size,
          storageType: row.storageType,
          amount: row.amount,
          invoiceDate: row.createdAt,
          download: true,
        });
      }
    } catch (err) {
      console.error("Invoice PDF download failed:", err);
      toast.error("Failed to generate invoice PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const renderDetailValue = (key, value) => {
    if (key === "createdAt") {
      return <Typography variant="body2">{formatDate(value)}</Typography>;
    }
    if (key === "status") {
      const status = String(value || "").toLowerCase();
      const { bg, text } = getColors(STATUS_COLORS, status);
      return (
        <Chip
          label={formatLabel(status) || "—"}
          size="small"
          variant="outlined"
          sx={{ bgcolor: bg, color: text, borderColor: text, fontWeight: 500 }}
        />
      );
    }
    if (
      ["amount", "subtotal", "baseRate"].includes(key) &&
      value !== null &&
      value !== undefined
    ) {
      return <Typography variant="body2">{formatCurrency(value)}</Typography>;
    }
    if (value === null || value === undefined || value === "") {
      return (
        <Typography variant="body2" color="text.disabled">
          —
        </Typography>
      );
    }
    return (
      <Typography
        variant="body2"
        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {String(value)}
      </Typography>
    );
  };

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", py: 4, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" color="#f58220">
        Invoices
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        View and download all invoices generated across the platform.
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        {TABS.map((t) => (
          <Tab key={t.index} label={t.label} />
        ))}
      </Tabs>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search by invoice #, receiver, order ref..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filteredRows.length === 0 ? (
        <Alert severity="info">
          No {currentTab.label.toLowerCase()} found.
        </Alert>
      ) : (
        <Paper sx={{ borderRadius: 2 }} variant="outlined">
          <TableContainer sx={{ overflowX: "auto", borderRadius: 2 }}>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell sx={{ whiteSpace: "nowrap" }} width={60}>
                    <strong>S. No</strong>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <strong>Invoice #</strong>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <strong>Receiver</strong>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <strong>Commodity</strong>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <strong>Order Ref</strong>
                  </TableCell>
                  {currentTab.key === "overstay" && (
                    <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                      <strong>Overstay</strong>
                    </TableCell>
                  )}
                  {currentTab.key === "storage" && (
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <strong>Size</strong>
                    </TableCell>
                  )}
                  {currentTab.key === "storage" && (
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <strong>Type</strong>
                    </TableCell>
                  )}
                  <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                    <strong>Amount</strong>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <strong>Created</strong>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ whiteSpace: "nowrap" }}
                    width={180}
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row, idx) => {
                  const status = String(row.status || "").toLowerCase();
                  const { bg, text } = getColors(STATUS_COLORS, status);
                  const commodity =
                    [row.category, row.subcategory]
                      .filter(Boolean)
                      .join(" - ") || "—";

                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2" color="text.secondary">
                          {page * rowsPerPage + idx + 1}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2" fontWeight={600}>
                          {row.invoiceId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {row.receiverName || "—"}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {commodity}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {row.orderRef || "—"}
                      </TableCell>
                      {currentTab.key === "overstay" && (
                        <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                          {row.overstayDays ?? 0} day(s)
                        </TableCell>
                      )}
                      {currentTab.key === "storage" && (
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {row.size || "—"}
                        </TableCell>
                      )}
                      {currentTab.key === "storage" && (
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {row.storageType || "—"}
                        </TableCell>
                      )}
                      <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(row.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Chip
                          label={formatLabel(status) || "—"}
                          size="small"
                          variant="outlined"
                          sx={{
                            bgcolor: bg,
                            color: text,
                            borderColor: text,
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(row.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<InfoOutlinedIcon />}
                          onClick={() => setDetailsRow(row)}
                          sx={{ mr: 1 }}
                        >
                          Details
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadOutlinedIcon />}
                          disabled={downloadingId === row.id}
                          onClick={() => handleDownload(row)}
                        >
                          {downloadingId === row.id
                            ? "Preparing..."
                            : "Download"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      <Dialog
        open={Boolean(detailsRow)}
        onClose={() => setDetailsRow(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Invoice Details
          </Typography>
          <IconButton onClick={() => setDetailsRow(null)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {detailsRow && (
            <Box>
              {Object.entries(detailsRow)
                .filter(([key]) => key !== "id")
                .map(([key, value]) => (
                  <Box
                    key={key}
                    sx={{
                      display: "flex",
                      px: 2.5,
                      py: 1.25,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      gap: 2,
                      "&:last-of-type": { borderBottom: "none" },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        width: 160,
                        flexShrink: 0,
                        fontWeight: 700,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        pt: 0.25,
                      }}
                    >
                      {formatLabel(key)}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {renderDetailValue(key, value)}
                    </Box>
                  </Box>
                ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default InvoicesPage;
