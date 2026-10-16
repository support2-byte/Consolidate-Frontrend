import { useCallback, useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Stack,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import { api } from "../api";
import { getStatusColors } from "../Utlis/statusColors";

const TEAL = "#1a7a6e";
const ORANGE = "#f58220";
const MAX_GRACE = 2;

const pad = (n) => String(n).padStart(2, "0");

const formatDate = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const formatDateTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return `${formatDate(v)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const addDays = (v, days) => {
  if (!v) return null;
  const d = new Date(v);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
};

const OUTCOME = {
  grace_added: {
    label: (r) => `Grace +${r.grace_days_added} days`,
    color: "#2e7d32",
    bg: "#e8f5e9",
  },
  delayed: { label: () => "Marked Delayed", color: "#c62828", bg: "#ffebee" },
  auto_delayed: {
    label: () => "Auto-marked Delayed",
    color: "#c62828",
    bg: "#ffebee",
  },
  superseded: {
    label: () => "Status changed",
    color: "#616161",
    bg: "#f0f0f0",
  },
};

const GracePips = ({ used }) => (
  <Stack direction="row" spacing={0.6} alignItems="center">
    {[...Array(MAX_GRACE)].map((_, i) => (
      <Box
        key={i}
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          border: `1.5px solid ${i < used ? ORANGE : TEAL}`,
          bgcolor: i < used ? ORANGE : "transparent",
        }}
      />
    ))}
    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
      {Math.max(0, MAX_GRACE - used)} left
    </Typography>
  </Stack>
);

const Label = ({ children }) => (
  <Typography
    variant="caption"
    color="text.secondary"
    sx={{ display: "block", lineHeight: 1.4 }}
  >
    {children}
  </Typography>
);

const cardSx = (accent) => ({
  p: { xs: 2, sm: 2.5 },
  mb: 1.5,
  border: "1px solid",
  borderColor: "divider",
  borderLeft: `4px solid ${accent}`,
  borderRadius: 2.5,
  bgcolor: "background.paper",
  display: "grid",
  gap: { xs: 2, md: 3 },
  alignItems: "center",
  transition: "box-shadow .2s",
  "&:hover": { boxShadow: "0 4px 14px rgba(0,0,0,0.08)" },
});

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        api.get("/api/eta-monitor/notifications", {
          params: { state: "pending" },
        }),
        api.get("/api/eta-monitor/notifications", {
          params: { state: "resolved" },
        }),
      ]);
      setPending(p.data.rows || []);
      setResolved(r.data.rows || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statusOptions = useMemo(
    () =>
      [
        ...new Set(
          [...pending, ...resolved].map((r) => r.status).filter(Boolean),
        ),
      ].sort(),
    [pending, resolved],
  );

  const matches = useCallback(
    (r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [
        r.rgl_booking_number,
        r.booking_ref,
        r.item_ref,
        r.receiver_name,
      ].some((v) => (v ?? "").toString().toLowerCase().includes(q));
    },
    [search, statusFilter],
  );

  const filteredPending = useMemo(
    () => pending.filter(matches),
    [pending, matches],
  );
  const filteredResolved = useMemo(
    () => resolved.filter(matches),
    [resolved, matches],
  );
  const filtersActive = !!(search.trim() || statusFilter);

  const act = (row, kind) => setConfirm({ row, kind });

  const handleConfirm = async () => {
    const { row, kind } = confirm;
    setBusyId(row.id);
    try {
      const { data } = await api.post(
        `/api/eta-monitor/notifications/${row.id}/${kind === "grace" ? "grace" : "delay"}`,
      );
      toast.success(data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
      setConfirm(null);
      load();
    }
  };

  const statusChip = (status) => {
    const { bg, text } = getStatusColors(status);
    return (
      <Chip
        label={status}
        size="small"
        sx={{ bgcolor: bg, color: text, fontWeight: 600, border: "none" }}
      />
    );
  };

  const renderPending = (r) => {
    const newEta = r.grace_days > 0 ? addDays(r.eta, r.grace_days) : null;
    const limitReached = (r.grace_used ?? 0) >= MAX_GRACE;

    return (
      <Paper
        key={r.id}
        elevation={0}
        sx={{
          ...cardSx(ORANGE),
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0,1.6fr) minmax(0,1fr) auto",
          },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Typography fontWeight={700}>
              {r.rgl_booking_number || "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {r.booking_ref}
            </Typography>
            {statusChip(r.status)}
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 500 }}>
            {r.receiver_name || "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Stuck in <b>{r.status}</b> for{" "}
            <b>
              {r.idle_days} {r.idle_days === 1 ? "day" : "days"}
            </b>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.25, wordBreak: "break-all" }}
          >
            {r.item_ref}
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "row", md: "column" }}
          spacing={{ xs: 4, md: 1.5 }}
        >
          <Box>
            <Label>ETA</Label>
            <Typography variant="body2" fontWeight={600}>
              {formatDate(r.eta)}
              {newEta && (
                <Box component="span" sx={{ color: TEAL }}>
                  {" → "}
                  {formatDate(newEta)}
                </Box>
              )}
            </Typography>
          </Box>
          <Box>
            <Label>Grace used</Label>
            <Box sx={{ mt: 0.5 }}>
              <GracePips used={r.grace_used ?? 0} />
            </Box>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          {limitReached ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 240 }}
            >
              Grace limit reached. Will be marked Delayed automatically.
            </Typography>
          ) : (
            <>
              <Button
                variant="contained"
                disableElevation
                disabled={busyId === r.id || !(r.grace_days > 0)}
                onClick={() => act(r, "grace")}
                sx={{
                  bgcolor: TEAL,
                  "&:hover": { bgcolor: "#155f55" },
                  whiteSpace: "nowrap",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                {r.grace_days > 0
                  ? `Add ${r.grace_days} grace day${r.grace_days > 1 ? "s" : ""}`
                  : "No grace days set"}
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={busyId === r.id}
                onClick={() => act(r, "delay")}
                sx={{
                  whiteSpace: "nowrap",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Mark as Delayed
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    );
  };

  const renderResolved = (r) => {
    const o = OUTCOME[r.state] || {
      label: () => r.state,
      color: "#616161",
      bg: "#f0f0f0",
    };

    return (
      <Paper
        key={r.id}
        elevation={0}
        sx={{
          ...cardSx(o.color),
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr)",
          },
        }}
      >
        {/* Order details */}
        <Box sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Typography fontWeight={700}>
              {r.rgl_booking_number || "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {r.booking_ref}
            </Typography>
            {statusChip(r.status)}
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 500 }}>
            {r.receiver_name || "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Was stuck for{" "}
            <b>
              {r.idle_days} {r.idle_days === 1 ? "day" : "days"}
            </b>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.25, wordBreak: "break-all" }}
          >
            {r.item_ref}
          </Typography>
        </Box>

        {/* ETA + outcome */}
        <Stack
          direction={{ xs: "row", md: "column" }}
          spacing={{ xs: 4, md: 1.5 }}
          alignItems={{ xs: "flex-start" }}
        >
          <Box>
            <Label>ETA</Label>
            <Typography variant="body2" fontWeight={600}>
              {formatDate(r.eta)}
            </Typography>
          </Box>
          <Box>
            <Label>Outcome</Label>
            <Chip
              label={o.label(r)}
              size="small"
              sx={{
                mt: 0.5,
                bgcolor: o.bg,
                color: o.color,
                fontWeight: 600,
                border: "none",
              }}
            />
          </Box>
        </Stack>

        {/* Resolved info */}
        <Box sx={{ minWidth: 0 }}>
          <Label>Resolved</Label>
          <Typography variant="body2" fontWeight={600}>
            {formatDateTime(r.resolved_at)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", wordBreak: "break-all" }}
          >
            {r.resolved_by ||
              (r.state === "auto_delayed" || r.state === "superseded"
                ? "system"
                : "-")}
          </Typography>
        </Box>
      </Paper>
    );
  };

  const list = tab === "pending" ? filteredPending : filteredResolved;

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" fontWeight="bold" color={ORANGE}>
          Admin Notifications
        </Typography>
        <Button
          size="small"
          startIcon={<InfoOutlinedIcon />}
          endIcon={
            <ExpandMoreIcon
              sx={{
                transform: showInfo ? "rotate(180deg)" : "none",
                transition: "transform .2s",
              }}
            />
          }
          onClick={() => setShowInfo((s) => !s)}
          sx={{ textTransform: "none", color: TEAL, fontWeight: 600 }}
        >
          How it works
        </Button>
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2, maxWidth: 760 }}
      >
        Orders whose status has not changed for too long. Add grace days or mark
        the order as Delayed.
      </Typography>

      <Collapse in={showInfo}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2.5,
            bgcolor: "background.paper",
          }}
        >
          <Box
            component="ol"
            sx={{
              m: 0,
              pl: 2.5,
              fontSize: 14,
              lineHeight: 1.8,
              color: "text.secondary",
            }}
          >
            <li>
              Daily automation checks every open order. Idle time = days since
              the status changed, or since the last grace was added.
            </li>
            <li>
              When idle time reaches half of the status's Days Offset and grace
              used is under {MAX_GRACE}, admin is notified.
            </li>
            <li>
              <b>Add grace days</b> moves the ETA forward by the status's Grace
              Days and restarts the idle clock. <b>Mark as Delayed</b> keeps the
              ETA unchanged.
            </li>
            <li>
              After {MAX_GRACE} grace extensions, the next idle period marks the
              order as Delayed automatically.
            </li>
            <li>
              Any status change resets grace used to 0 and clears the Delayed
              flag.
            </li>
          </Box>
        </Paper>
      </Collapse>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Search"
          placeholder="Form no, booking ref, item ref, receiver"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, maxWidth: { sm: 420 } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusOptions.includes(statusFilter) ? statusFilter : ""}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {filtersActive && (
          <Button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              alignSelf: { sm: "center" },
            }}
          >
            Clear
          </Button>
        )}
      </Stack>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{
          mb: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
          "& .Mui-selected": { color: `${ORANGE} !important` },
          "& .MuiTabs-indicator": { bgcolor: ORANGE },
        }}
      >
        <Tab
          value="pending"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Pending</span>
              {!loading && (
                <Chip
                  label={filteredPending.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    bgcolor: filteredPending.length ? ORANGE : "#e0e0e0",
                    color: filteredPending.length ? "#fff" : "#616161",
                  }}
                />
              )}
            </Stack>
          }
        />
        <Tab
          value="resolved"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Resolved</span>
              {!loading && (
                <Chip
                  label={filteredResolved.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    bgcolor: "#e0e0e0",
                    color: "#616161",
                  }}
                />
              )}
            </Stack>
          }
        />
      </Tabs>

      {loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress size={28} sx={{ color: TEAL }} />
        </Box>
      ) : list.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2.5,
            color: "text.secondary",
          }}
        >
          {filtersActive
            ? "No notifications match your search or filter."
            : tab === "pending"
              ? "No orders need attention right now."
              : "No resolved notifications yet."}
        </Paper>
      ) : tab === "pending" ? (
        filteredPending.map(renderPending)
      ) : (
        filteredResolved.map(renderResolved)
      )}

      <Dialog
        open={!!confirm}
        onClose={() => busyId == null && setConfirm(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {confirm &&
          (() => {
            const { row, kind } = confirm;
            const isGrace = kind === "grace";
            const accent = isGrace ? TEAL : "#c62828";
            const newEta = isGrace ? addDays(row.eta, row.grace_days) : null;

            return (
              <>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                  {isGrace ? "Add grace days?" : "Mark as Delayed?"}
                </DialogTitle>

                <DialogContent>
                  <Box
                    sx={{
                      p: 1.5,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                      borderLeft: `4px solid ${accent}`,
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {row.rgl_booking_number || "-"} · {row.booking_ref}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {row.receiver_name || "-"}
                    </Typography>
                    <Box sx={{ mt: 0.75 }}>{statusChip(row.status)}</Box>
                  </Box>

                  {isGrace ? (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        The ETA will move forward by{" "}
                        <b>
                          {row.grace_days} day{row.grace_days > 1 ? "s" : ""}
                        </b>
                        .
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(row.eta)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: TEAL }}>
                          →
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ color: TEAL }}
                        >
                          {formatDate(newEta)}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1.5 }}
                      >
                        Grace used: {(row.grace_used ?? 0) + 1} of {MAX_GRACE}{" "}
                        after this.
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2">
                      The order will be flagged as Delayed. The ETA stays{" "}
                      <b>{formatDate(row.eta)}</b>.
                    </Typography>
                  )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                  <Button
                    onClick={() => setConfirm(null)}
                    disabled={busyId != null}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    disableElevation
                    onClick={handleConfirm}
                    disabled={busyId != null}
                    sx={{
                      bgcolor: accent,
                      "&:hover": { bgcolor: isGrace ? "#155f55" : "#a52121" },
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      minWidth: 120,
                    }}
                  >
                    {busyId != null ? (
                      <CircularProgress size={18} sx={{ color: "#fff" }} />
                    ) : isGrace ? (
                      "Add grace days"
                    ) : (
                      "Mark as Delayed"
                    )}
                  </Button>
                </DialogActions>
              </>
            );
          })()}
      </Dialog>
    </Box>
  );
}
