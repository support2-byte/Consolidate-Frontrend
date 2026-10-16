import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  CircularProgress,
  Button,
  TextField,
  Tabs,
  Tab,
  Stack,
  Tooltip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { toast } from "react-toastify";
import { api } from "../api";
import { getStatusColors } from "../Utlis/statusColors";

const TEAL = "#1a7a6e";
const MAX_GRACE = 2;
const FINAL = ["Shipment Delivered", "Rejected", "Cancelled"];
const head = { color: "white", fontWeight: 600 };

const formatDate = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const ACTIONS = {
  status_changed: { label: "Status changed", bg: "#e3f2fd", text: "#1565c0" },
  admin_notified: { label: "Admin notified", bg: "#fff3e0", text: "#e65100" },
  grace_added: { label: "Grace added", bg: "#e8f5e9", text: "#2e7d32" },
  delayed: { label: "Marked Delayed", bg: "#ffebee", text: "#c62828" },
  auto_delayed: { label: "Auto-delayed", bg: "#ffebee", text: "#c62828" },
};

const flagOf = (r) => {
  if (r.is_delayed)
    return {
      label: "Delayed",
      bg: "#ffebee",
      text: "#c62828",
      tip:
        r.delayed_reason === "auto"
          ? "Auto-marked after grace limit"
          : "Marked by admin",
    };
  if (FINAL.includes(r.status))
    return { label: "Closed", bg: "#e8f5e9", text: "#2e7d32" };
  if (r.check_after_days > 0 && r.idle_days >= r.check_after_days)
    return {
      label: "Stale",
      bg: "#fff3e0",
      text: "#e65100",
      tip: `Past midpoint of ${r.days_offset}-day offset`,
    };
  return { label: "On track", bg: "#f5f5f5", text: "#616161" };
};

export default function ETAMonitoringPage() {
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [running, setRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [statusOptions, setStatusOptions] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        tab === 0 ? "/api/eta-monitor/items" : "/api/eta-monitor/log",
        {
          params: {
            page: page + 1,
            limit: rowsPerPage,
            search,
            status: statusFilter,
          },
        },
      );
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch (e) {
      toast.error(
        e.response?.data?.message || "Failed to load ETA monitoring data",
      );
    } finally {
      setLoading(false);
    }
  }, [tab, page, rowsPerPage, search, statusFilter]);

  const loadStatusOptions = useCallback(async () => {
    try {
      const { data } = await api.get("/api/eta-monitor/statuses");
      setStatusOptions(data.statuses || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadStatusOptions();
  }, [loadStatusOptions]);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [load]);

  const runNow = async () => {
    setRunning(true);
    try {
      const { data } = await api.post("/api/eta-monitor/run");
      const s = data.summary;
      toast.success(
        `Check complete: ${s.notified} notified, ${s.autoDelayed} auto-delayed, ${s.statusChanges} status resets.`,
      );
      load();
      loadStatusOptions();
    } catch (e) {
      toast.error(e.response?.data?.message || "Check failed");
    } finally {
      setRunning(false);
    }
  };

  const chip = (label, bg, text) => (
    <Chip
      label={label}
      size="small"
      sx={{ bgcolor: bg, color: text, fontWeight: 600, border: "none" }}
    />
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" fontWeight="bold" color="#f58220">
          ETA Monitoring
        </Typography>
        <Button
          variant="outlined"
          onClick={runNow}
          disabled={running}
          sx={{ borderColor: TEAL, color: TEAL }}
        >
          {running ? <CircularProgress size={18} /> : "Run check now"}
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{ p: 2, mb: 2, border: "1px solid #e8e8e8", borderRadius: 2 }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <TextField
            size="small"
            label="Search form no, booking ref, item ref"
            sx={{ width: { xs: "100%", sm: 320 } }}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusOptions.includes(statusFilter) ? statusFilter : ""}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {statusOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            Items are checked at the midpoint of each status's Days Offset
            (rounded up).
          </Typography>
        </Stack>
      </Paper>

      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setPage(0);
        }}
        sx={{ mb: 2 }}
      >
        <Tab label="Monitoring" />
        <Tab label="Activity Log" />
      </Tabs>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e8e8e8",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: TEAL }}>
                <TableCell sx={{ ...head, py: 1.5 }}>Form Number</TableCell>
                <TableCell sx={head}>Booking Ref</TableCell>
                <TableCell sx={head}>Item Ref</TableCell>
                {tab === 0 ? (
                  <>
                    <TableCell sx={head}>Receiver</TableCell>
                    <TableCell sx={head}>Status</TableCell>
                    <TableCell sx={head}>In Status</TableCell>
                    <TableCell sx={head}>Idle</TableCell>
                    <TableCell sx={head}>Check After</TableCell>
                    <TableCell sx={head}>Grace Used</TableCell>
                    <TableCell sx={head}>ETA</TableCell>
                    <TableCell sx={head}>Flag</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell sx={head}>Status</TableCell>
                    <TableCell sx={head}>Action</TableCell>
                    <TableCell sx={head}>Created Time</TableCell>
                    <TableCell sx={head}>Created By</TableCell>
                    <TableCell sx={head}>ETA</TableCell>
                    <TableCell sx={head}>Note</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: TEAL }} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    align="center"
                    sx={{ py: 6, color: "#aaa" }}
                  >
                    {tab === 0
                      ? "No items are being monitored yet. Click Run check now."
                      : "Nothing logged yet."}
                  </TableCell>
                </TableRow>
              ) : tab === 0 ? (
                rows.map((r, i) => {
                  const st = getStatusColors(r.status);
                  const f = flagOf(r);
                  return (
                    <TableRow key={`${r.item_ref}-${i}`} hover>
                      <TableCell>{r.rgl_booking_number || "-"}</TableCell>
                      <TableCell>{r.booking_ref || "-"}</TableCell>
                      <TableCell>{r.item_ref || "-"}</TableCell>
                      <TableCell>{r.receiver_name || "-"}</TableCell>
                      <TableCell>{chip(r.status, st.bg, st.text)}</TableCell>
                      <TableCell>{r.days_in_status}d</TableCell>
                      <TableCell>{r.idle_days}d</TableCell>
                      <TableCell>
                        {r.check_after_days > 0
                          ? `${r.check_after_days}d`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {r.grace_used}/{MAX_GRACE}
                      </TableCell>
                      <TableCell>{formatDate(r.eta)}</TableCell>
                      <TableCell>
                        <Tooltip title={f.tip || ""}>
                          <span>{chip(f.label, f.bg, f.text)}</span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                rows.map((r) => {
                  const st = getStatusColors(r.status);
                  const a = ACTIONS[r.action] || {
                    label: r.action,
                    bg: "#f5f5f5",
                    text: "#616161",
                  };
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.rgl_booking_number || "-"}</TableCell>
                      <TableCell>{r.booking_ref || "-"}</TableCell>
                      <TableCell>{r.item_ref || "-"}</TableCell>
                      <TableCell>
                        {r.status ? chip(r.status, st.bg, st.text) : "-"}
                      </TableCell>
                      <TableCell>{chip(a.label, a.bg, a.text)}</TableCell>
                      <TableCell>{formatDate(r.created_at)}</TableCell>
                      <TableCell>{r.created_by || "-"}</TableCell>
                      <TableCell>{formatDate(r.eta)}</TableCell>
                      <TableCell>{r.note || "-"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Box>
  );
}
