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
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { api } from "../../api";
import {
  EMAIL_TEMPLATES,
  TEMPLATE_BY_EMAIL_TYPE,
  KYC_TEMPLATE_BY_COMPANY,
} from "../../constants/emailTemplate";

const TABS = [
  { index: 0, key: "emails", label: "Emails", endpoint: "api/notifications" },
  {
    index: 1,
    key: "subscriptions",
    label: "Subscriptions",
    endpoint: "api/notifications/subscriptions",
  },
  {
    index: 2,
    key: "kyc",
    label: "KYC Emails",
    endpoint: "api/kyc/emails",
    resendEndpoint: "api/kyc/emails",
    deleteEndpoint: "api/kyc/emails",
  },
  {
    index: 3,
    key: "confirmation",
    label: "Confirmation Emails",
    endpoint: "api/notifications/confirmation-emails",
    resendEndpoint: "api/notifications/confirmation-emails",
    deleteEndpoint: "api/notifications/confirmation-emails",
  },
  {
    index: 4,
    key: "invoice",
    label: "Invoice Emails",
    endpoint: "api/notifications/invoice-emails",
    resendEndpoint: "api/notifications/invoice-emails",
    deleteEndpoint: "api/notifications/invoice-emails",
  },
];

const HIDDEN_COLUMNS = new Set([
  "id",
  "total_qty",
  "total_weight",
  "sender_name",
  "company",
  "company_logo_url",
  "subject",
  "message",
  "items",
]);
const DATE_COLUMNS = new Set(["created_at", "updated_at", "sent_at"]);

const EMAIL_STATUS_COLORS = {
  sent: { bg: "#e8f5e9", text: "#2e7d32" },
  pending: { bg: "#fff3e0", text: "#ef6c00" },
  failed: { bg: "#ffebee", text: "#c62828" },
  default: { bg: "#f5f5f5", text: "#666" },
};

const COMPANY_COLORS = {
  RGSL: { bg: "#e6f3f1", text: "#0f4f47" },
  MF: { bg: "#eef0fb", text: "#1a2060" },
  CAS: { bg: "#e8eef5", text: "#03182d" },
  default: { bg: "#f5f5f5", text: "#666" },
};

const EMAIL_TYPE_COLORS = {
  order_created: { bg: "#ede7f6", text: "#512da8" },
  order_update: { bg: "#e1f5fe", text: "#0277bd" },
  order_status_update: { bg: "#e1f5fe", text: "#0277bd" },
  container_assigned: { bg: "#f3e5f5", text: "#7b1fa2" },
  default: { bg: "#f5f5f5", text: "#666" },
};

const RECIPIENT_TYPE_COLORS = {
  receiver: { bg: "#fce4ec", text: "#c2185b" },
  sender: { bg: "#f1f8e9", text: "#689f38" },
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

const FRONTEND_URL = "http://localhost:5174";

const STATUS_ACTION_LINKS = {
  "Order Created": [{ path: "drop-off", text: "Schedule Drop-off" }],
  "Shipment Delivered": [
    { path: "purchase-storage", text: "Arrange Storage" },
    { path: "delivery-request", text: "Request Delivery" },
  ],
};

const buildActionLinksHtml = (statusLabel, itemRef) => {
  const links = STATUS_ACTION_LINKS[statusLabel];
  if (!links || links.length === 0) return "";

  const buttons = links
    .map(
      (link) =>
        `<a class="cta" style="margin-right:10px" href="${FRONTEND_URL}/${link.path}/${encodeURIComponent(itemRef)}" target="_blank" rel="noopener noreferrer">${link.text}</a>`,
    )
    .join("");

  return `<div style="margin-top:6px">${buttons}</div>`;
};

const buildTemplateData = (row) => ({
  recipientName: row.recipient_name || "Customer",
  statusLabel:
    row.status_label || formatLabel(row.email_type || "Status Update"),
  statusMsg:
    "Sample message — the exact wording is generated when the email is sent.",
  refId: row.item_ref || "—",
  orderId: row.order_form_no || "—",
  route: "Sample Route (e.g. Dubai, UAE → Karachi, PK)",
  eta: "Sample ETA",
  lastUpdated: formatDate(row.created_at),
  trackLink: "https://trackorder.royalgulfshipping.com/",
  actionLinks: buildActionLinksHtml(
    row.status_label || formatLabel(row.email_type || "Status Update"),
    row.item_ref || "—",
    row.recipient_type,
  ),
});

const buildKycTemplateData = (row) => ({
  recipientName: row.recipient_name || "Valued Customer",
  formUrl: row.form_url || "#",
  year: new Date().getFullYear(),
});

const buildItemsSectionHtml = (items) => {
  if (!Array.isArray(items) || items.length === 0) return "";
  const rows = items
    .map(
      (it) => `
        <tr>
          <td>${it.category || "—"}</td>
          <td>${it.subcategory || "—"}</td>
          <td>${it.type || "—"}</td>
          <td>${it.qty ?? "—"}</td>
          <td>${it.weight ?? "—"} KG</td>
          <td>${it.placeOfLoading || "—"}</td>
          <td>${it.placeOfDestination || "—"}</td>
        </tr>`,
    )
    .join("");
  return `<div class="info-box" style="margin-top: 16px;">
      <div class="info-title"><i class="fas fa-boxes-stacked"></i> Items</div>
      <table class="items-table" role="presentation">
        <thead><tr><th>Category</th><th>Subcategory</th><th>Type</th><th>Qty</th><th>Weight</th><th>Loading</th><th>Destination</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
};

const buildConfirmationTemplateData = (row) => ({
  recipientName: row.receiver_name || row.recipient_name || "Customer",
  senderName: row.sender_name || "—",
  companyName:
    row.company || row.company_name || "Royal Gulf Shipping & Logistics",
  companyLogo:
    row.company_logo_url ||
    "https://royalgulfshipping.com/wp-content/uploads/2023/08/RGSL-LOGO.png",
  subject: row.subject || "Order Confirmation",
  message: row.message || "Sample message — actual content shown at send time.",
  mode: row.mode || "—",
  totalQty: row.total_qty ?? "—",
  totalWeight: row.total_weight ?? "—",
  lastUpdated: formatDate(row.created_at),
  itemsSection: buildItemsSectionHtml(row.items),
  viewLink: row.form_id
    ? `https://track.royalgulfshipping.com/order-confirmation/${row.form_id}`
    : "#",
  year: new Date().getFullYear(),
});

const buildInvoiceTemplateData = (row) => ({
  recipientName: row.recipient_name || "Valued Customer",
  invoiceId: row.invoice_id || "—",
  itemRef: row.item_ref || "—",
  amount: row.amount ? `$${row.amount}` : "—",
  invoiceLink: row.invoice_url || "#",
  lastUpdated: formatDate(row.created_at),
  year: new Date().getFullYear(),
  otp: row.otp || "—",
});

const renderTemplate = (templateKey, data) => {
  const template = EMAIL_TEMPLATES[templateKey];
  if (!template) return null;
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) =>
    data[key] !== undefined && data[key] !== null ? String(data[key]) : "",
  );
};

const NotificationSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sendingId, setSendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [previewRow, setPreviewRow] = useState(null);
  const [detailsRow, setDetailsRow] = useState(null);

  const currentTab = TABS[activeTab];
  const isEmailsTab = currentTab.key === "emails";
  const isKycTab = currentTab.key === "kyc";
  const isConfirmationTab = currentTab.key === "confirmation";
  const isInvoiceTab = currentTab.key === "invoice";
  const hasRowActions =
    isEmailsTab || isKycTab || isConfirmationTab || isInvoiceTab;

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
        throw new Error(payload?.message || payload?.error || "API error");
      }

      setRows(payload.notifications || []);
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

  const handleResend = async (rowId) => {
    setSendingId(rowId);
    try {
      const base = currentTab.resendEndpoint || currentTab.endpoint;
      const res = await api.post(`${base}/${rowId}/resend`);
      if (res.data?.success) {
        const updatedRow = res.data.row;
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? { ...r, ...(updatedRow || { status: "sent" }) }
              : r,
          ),
        );
        toast.success("Email sent");
      } else {
        throw new Error(res.data?.message || "Failed to send");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to send email",
      );
    } finally {
      setSendingId(null);
    }
  };

  const columns = useMemo(
    () =>
      rows.length > 0
        ? Object.keys(rows[0]).filter((k) => !HIDDEN_COLUMNS.has(k))
        : [],
    [rows],
  );

  const filteredRows = useMemo(() => {
    let result = rows;

    if (isEmailsTab && statusFilter === "sent") {
      result = result.filter((r) => String(r.status).toLowerCase() === "sent");
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
  }, [rows, search, statusFilter, isEmailsTab]);

  const paginatedRows = useMemo(
    () =>
      filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const renderCell = (row, col) => {
    const value = row[col];

    if (DATE_COLUMNS.has(col)) {
      return (
        <Typography variant="body2" color="text.secondary">
          {formatDate(value)}
        </Typography>
      );
    }

    if (col === "status") {
      const status = String(value || "").toLowerCase();
      const { bg, text } = getColors(EMAIL_STATUS_COLORS, status);
      return (
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
      );
    }

    if (col === "email_type") {
      const type = String(value || "");
      const { bg, text } = getColors(EMAIL_TYPE_COLORS, type);
      return (
        <Chip
          label={formatLabel(type) || "—"}
          size="small"
          variant="outlined"
          sx={{
            bgcolor: bg,
            color: text,
            borderColor: text,
            fontWeight: 500,
          }}
        />
      );
    }

    if (col === "company") {
      const code = String(value || "");
      const { bg, text } = getColors(COMPANY_COLORS, code);
      return (
        <Chip
          label={code || "—"}
          size="small"
          variant="outlined"
          sx={{ bgcolor: bg, color: text, borderColor: text, fontWeight: 500 }}
        />
      );
    }

    if (col === "recipient_type") {
      const type = String(value || "").toLowerCase();
      const { bg, text } = getColors(RECIPIENT_TYPE_COLORS, type);
      return (
        <Chip
          label={formatLabel(type) || "—"}
          size="small"
          variant="outlined"
          sx={{
            bgcolor: bg,
            color: text,
            borderColor: text,
            fontWeight: 500,
          }}
        />
      );
    }

    if (value === null || value === undefined) {
      return (
        <Typography variant="body2" color="text.disabled">
          —
        </Typography>
      );
    }

    if (typeof value === "object") {
      return (
        <Typography variant="body2" color="text.secondary">
          {JSON.stringify(value)}
        </Typography>
      );
    }

    return <Typography variant="body2">{String(value)}</Typography>;
  };

  const previewTemplateKey = previewRow
    ? isKycTab
      ? KYC_TEMPLATE_BY_COMPANY[previewRow.company] || "kyc_rgsl"
      : isConfirmationTab
        ? "confirmation_email"
        : isInvoiceTab
          ? "invoice_email"
          : TEMPLATE_BY_EMAIL_TYPE[previewRow.email_type] || "shipment_update"
    : null;

  const previewHtml = previewRow
    ? renderTemplate(
        previewTemplateKey,
        isKycTab
          ? buildKycTemplateData(previewRow)
          : isConfirmationTab
            ? buildConfirmationTemplateData(previewRow)
            : isInvoiceTab
              ? buildInvoiceTemplateData(previewRow)
              : buildTemplateData(previewRow),
      )
    : null;

  const handleDelete = async (id) => {
    if (isEmailsTab || isKycTab || isConfirmationTab || isInvoiceTab) {
      const row = rows.find((r) => r.id === id);
      if (row && String(row.status).toLowerCase() === "sent") {
        return toast.error("Sent emails cannot be deleted.");
      }
    }

    setDeletingId(id);
    try {
      const base = currentTab.deleteEndpoint || "api/notifications";
      const { data } = await api.delete(`${base}/${id}/delete`);

      if (!data.success) {
        return toast.error(data.message);
      }

      setRows((prev) => prev.filter((row) => row.id !== id));

      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setDeletingId(null);
    }
  };

  const renderDetailValue = (key, value) => {
    if (DATE_COLUMNS.has(key)) {
      return <Typography variant="body2">{formatDate(value)}</Typography>;
    }
    if (key === "status") {
      const status = String(value || "").toLowerCase();
      const { bg, text } = getColors(EMAIL_STATUS_COLORS, status);
      return (
        <Chip
          label={formatLabel(status) || "—"}
          size="small"
          variant="outlined"
          sx={{ bgcolor: bg, color: text, borderColor: text, fontWeight: 500 }}
        />
      );
    }
    if (key === "company") {
      const code = String(value || "");
      const { bg, text } = getColors(COMPANY_COLORS, code);
      return (
        <Chip
          label={code || "—"}
          size="small"
          variant="outlined"
          sx={{ bgcolor: bg, color: text, borderColor: text, fontWeight: 500 }}
        />
      );
    }
    if (key === "items") {
      if (!Array.isArray(value) || value.length === 0) {
        return (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        );
      }
      return (
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 0.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell>Category</TableCell>
                <TableCell>Subcategory</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Weight</TableCell>
                <TableCell>Loading</TableCell>
                <TableCell>Destination</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {value.map((it, i) => (
                <TableRow key={i}>
                  <TableCell>{it.category || "—"}</TableCell>
                  <TableCell>{it.subcategory || "—"}</TableCell>
                  <TableCell>{it.type || "—"}</TableCell>
                  <TableCell align="right">{it.qty ?? "—"}</TableCell>
                  <TableCell align="right">{it.weight ?? "—"} KG</TableCell>
                  <TableCell>{it.placeOfLoading || "—"}</TableCell>
                  <TableCell>{it.placeOfDestination || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }
    if (value === null || value === undefined || value === "") {
      return (
        <Typography variant="body2" color="text.disabled">
          —
        </Typography>
      );
    }
    if (key === "company_logo_url") {
      return (
        <Box
          component="img"
          src={value}
          alt="Logo"
          sx={{ height: 32, objectFit: "contain" }}
        />
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
        Email Notifications
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        View queued emails and manage notification subscriptions.
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
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {isEmailsTab && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
            </Select>
          </FormControl>
        )}
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
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell sx={{ whiteSpace: "nowrap" }} width={70}>
                    <strong>S. No</strong>
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col} sx={{ whiteSpace: "nowrap" }}>
                      <strong>{formatLabel(col)}</strong>
                    </TableCell>
                  ))}
                  {hasRowActions && (
                    <TableCell
                      align="right"
                      sx={{ whiteSpace: "nowrap" }}
                      width={220}
                    />
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row, idx) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="body2" color="text.secondary">
                        {page * rowsPerPage + idx + 1}
                      </Typography>
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell key={col} sx={{ whiteSpace: "nowrap" }}>
                        {renderCell(row, col)}
                      </TableCell>
                    ))}
                    {isEmailsTab && (
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<VisibilityOutlinedIcon />}
                          onClick={() => setPreviewRow(row)}
                          sx={{ mr: 1 }}
                        >
                          View
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EmailOutlinedIcon />}
                          disabled={
                            sendingId === row.id || deletingId === row.id
                          }
                          onClick={() => handleResend(row.id)}
                          sx={{ mr: 1 }}
                        >
                          {sendingId === row.id ? "Sending..." : "Email"}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          disabled={
                            sendingId === row.id ||
                            deletingId === row.id ||
                            String(row.status).toLowerCase() === "sent"
                          }
                          onClick={() => handleDelete(row.id)}
                        >
                          {deletingId === row.id ? "Deleting..." : "Delete"}
                        </Button>
                      </TableCell>
                    )}
                    {(isKycTab || isConfirmationTab || isInvoiceTab) && (
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {isConfirmationTab && (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<InfoOutlinedIcon />}
                            onClick={() => setDetailsRow(row)}
                            sx={{ mr: 1 }}
                          >
                            {" "}
                            Details{" "}
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<VisibilityOutlinedIcon />}
                          onClick={() => setPreviewRow(row)}
                          sx={{ mr: 1 }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EmailOutlinedIcon />}
                          disabled={
                            sendingId === row.id || deletingId === row.id
                          }
                          onClick={() => handleResend(row.id)}
                          sx={{ mr: 1 }}
                        >
                          {sendingId === row.id ? "Sending..." : "Resend"}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          disabled={
                            sendingId === row.id ||
                            deletingId === row.id ||
                            String(row.status).toLowerCase() === "sent"
                          }
                          onClick={() => handleDelete(row.id)}
                        >
                          {deletingId === row.id ? "Deleting..." : "Delete"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
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
        open={Boolean(previewRow)}
        onClose={() => setPreviewRow(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: "85vh" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Email Preview
            </Typography>
            {previewRow && (
              <Typography variant="caption" color="text.secondary">
                {previewRow.email_type
                  ? `${formatLabel(previewRow.email_type)} • `
                  : ""}
                To:{" "}
                {previewRow.recipient_email ||
                  previewRow.recipient_email_address ||
                  "—"}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => setPreviewRow(null)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ p: 0, display: "flex", flexDirection: "column" }}
        >
          <Alert severity="info" sx={{ borderRadius: 0 }}>
            Preview only. Fields like status message, ETA and route are
            generated at send time — sample values are shown here.
          </Alert>
          {previewHtml ? (
            <iframe
              title="email-preview"
              srcDoc={previewHtml}
              style={{ flex: 1, width: "100%", border: "none" }}
              sandbox=""
            />
          ) : (
            <Box sx={{ p: 3 }}>
              <Alert severity="warning">
                No template available for "{previewRow?.email_type}".
              </Alert>
            </Box>
          )}
        </DialogContent>
      </Dialog>
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
            Full Record
          </Typography>
          <IconButton onClick={() => setDetailsRow(null)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {detailsRow && (
            <Box sx={{ divide: "y" }}>
              {Object.entries(detailsRow)
                .filter(([key]) => key !== "id")
                .map(([key, value]) => (
                  <Box
                    key={key}
                    sx={{
                      display: "flex",
                      flexDirection: key === "items" ? "column" : "row",
                      px: 2.5,
                      py: 1.25,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      gap: key === "items" ? 1 : 2,
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

export default NotificationSettings;
