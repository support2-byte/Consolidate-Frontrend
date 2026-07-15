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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { toast } from "react-toastify";
import { api } from "../../api";

const TABS = [
  { index: 0, key: "emails", label: "Emails", endpoint: "api/notifications" },
  {
    index: 1,
    key: "subscriptions",
    label: "Subscriptions",
    endpoint: "api/notifications/subscriptions",
  },
];

const HIDDEN_COLUMNS = new Set(["id"]);
const DATE_COLUMNS = new Set(["created_at", "updated_at", "sent_at"]);

const formatLabel = (key) =>
  key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleString();
};

const NotificationSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resendingId, setResendingId] = useState(null);

  const currentTab = TABS[activeTab];
  const isEmailsTab = currentTab.key === "emails";

  useEffect(() => {
    fetchData(currentTab);
    setSearch("");
    setStatusFilter("all");
  }, [activeTab]);

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
    setResendingId(rowId);
    try {
      const res = await api.post(`${currentTab.endpoint}/${rowId}/resend`);
      if (res.data?.success) {
        setRows((prev) =>
          prev.map((r) => (r.id === rowId ? { ...r, status: "sent" } : r)),
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
      setResendingId(null);
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
      const statusColorMap = {
        sent: "success",
        failed: "error",
        pending: "warning",
      };
      return (
        <Chip
          label={formatLabel(status) || "—"}
          size="small"
          color={statusColorMap[status] || "default"}
          variant="outlined"
        />
      );
    }

    if (col === "email_type") {
      const typeLabelMap = {
        order_created: "Order Created",
        shipment_update: "Shipment Update",
      };
      const label = typeLabelMap[value] || formatLabel(String(value || ""));

      return (
        <Chip
          label={label}
          size="small"
          color={value === "order_created" ? "primary" : "secondary"}
          variant="outlined"
        />
      );
    }

    if (col === "recipient_type") {
      const type = String(value || "").toLowerCase();
      const recipientColorMap = {
        sender: "info",
        receiver: "secondary",
      };
      return (
        <Chip
          label={formatLabel(type) || "—"}
          size="small"
          color={recipientColorMap[type] || "default"}
          variant="outlined"
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

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", py: 4, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Notifications
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
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ overflowX: "auto" }}
        >
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                {columns.map((col) => (
                  <TableCell key={col} sx={{ whiteSpace: "nowrap" }}>
                    <strong>{formatLabel(col)}</strong>
                  </TableCell>
                ))}
                {isEmailsTab && (
                  <TableCell
                    align="right"
                    sx={{ whiteSpace: "nowrap" }}
                    width={140}
                  />
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id} hover>
                  {columns.map((col) => (
                    <TableCell key={col} sx={{ whiteSpace: "nowrap" }}>
                      {renderCell(row, col)}
                    </TableCell>
                  ))}
                  {isEmailsTab && (
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EmailOutlinedIcon />}
                        disabled={resendingId === row.id}
                        onClick={() => handleResend(row.id)}
                      >
                        {resendingId === row.id ? "Sending..." : "Email"}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default NotificationSettings;
