import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const T = {
  teal: "#0d6c6a",
  tealDark: "#0a5250",
  tealLight: "#e8f5f4",
  tealMid: "#cfe9e8",
  grey50: "#fafafa",
  grey100: "#f5f5f5",
  grey200: "#eeeeee",
  grey600: "#757575",
};

const FMT = "YYYY-MM-DD";

const quickRanges = () => {
  const now = dayjs();
  const dow = (now.day() + 6) % 7;
  const wStart = now.subtract(dow, "day").startOf("day");
  return [
    { key: "all", label: "All time", from: null, to: null },
    { key: "today", label: "Today", from: now, to: now },
    { key: "week", label: "This week", from: wStart, to: wStart.add(6, "day") },
    {
      key: "month",
      label: "This month",
      from: now.startOf("month"),
      to: now.endOf("month"),
    },
    {
      key: "last",
      label: "Last month",
      from: now.subtract(1, "month").startOf("month"),
      to: now.subtract(1, "month").endOf("month"),
    },
    {
      key: "year",
      label: "This year",
      from: now.startOf("year"),
      to: now.endOf("year"),
    },
  ].map((r) => ({
    ...r,
    from: r.from ? r.from.format(FMT) : "",
    to: r.to ? r.to.format(FMT) : "",
  }));
};

const money = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtStatus = (s = "") =>
  s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const fmtCur = (n, cur) => `${cur} ${money(n)}`;

const docStatusColor = (s) =>
  s === "paid"
    ? "success"
    : s === "overdue"
      ? "error"
      : s === "void" || s === "draft"
        ? "default"
        : "warning";

// Overdue is counted from the order's RFD date (RFD day = day 1), as in the Finance tab
const overdueDays = (d, rfd) => {
  if (d.status !== "overdue" || !rfd) return null;
  const n = dayjs().startOf("day").diff(dayjs(rfd).startOf("day"), "day") + 1;
  // the note under RFD Date only appears once the invoice is overdue by more than 3 days
  // 3 days are free: day 4 after RFD is "overdue by 1 day"
  return n > 3 ? n - 3 : null;
};

// status chip stays plain ("Overdue"); the day count is only in the note under RFD Date
const statusLabel = (d) => fmtStatus(d.status);

const sumBy = (rows, fn) => rows.reduce((s, r) => s + Number(fn(r) || 0), 0);

const docTotalAed = (d) =>
  d.totalAed != null
    ? Number(d.totalAed)
    : d.currency === "AED"
      ? Number(d.total || 0)
      : 0;
const docBalanceAed = (d) =>
  d.currency === "AED"
    ? Number(d.balance || 0)
    : Number(d.balance || 0) * Number(d.exchangeRate || 0);
const docPaidAed = (d) => docTotalAed(d) - docBalanceAed(d);
const fmtAed = (n) => (n == null ? "-" : fmtCur(n, "AED"));

const pickDate = (list, mode) => {
  const ds = list
    .filter(Boolean)
    .map((x) => dayjs(x))
    .filter((x) => x.isValid());
  if (!ds.length) return "-";
  const t = ds.reduce((a, b) =>
    mode === "max" ? (b.isAfter(a) ? b : a) : b.isBefore(a) ? b : a,
  );
  return t.format("MMM DD, YYYY");
};

const fmtDate = (d) => (d ? dayjs(d).format("MMM DD, YYYY") : "-");

const FinStatCard = ({ icon, value, label, sub, color }) => (
  <Box
    sx={{ bgcolor: alpha(color, 0.1), borderRadius: 2.5, px: 1.75, py: 1.5 }}
  >
    <Box sx={{ color, display: "flex", mb: 0.5, "& svg": { fontSize: 18 } }}>
      {icon}
    </Box>
    <Typography sx={{ color, fontWeight: 700, fontSize: 20, lineHeight: 1.2 }}>
      {value}
    </Typography>
    <Typography
      sx={{ fontWeight: 600, fontSize: 13, color: "text.primary", mt: 0.25 }}
    >
      {label}
    </Typography>
    <Typography sx={{ color, fontWeight: 600, fontSize: 12 }}>{sub}</Typography>
  </Box>
);

// Same layout and rules as the Finance tab, across all orders: one group per
// order (form number), click it to expand its documents.
function DocTable({
  groups,
  kind,
  partyLabel,
  partyKey,
  onPreview,
  previewingId,
  page,
  rowsPerPage,
}) {
  const [open, setOpen] = useState({});
  const head = {
    bgcolor: T.teal,
    color: "#fff",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  };
  const allDocs = groups.flatMap((g) => g.docs);
  const live = allDocs.filter((d) => d.status !== "void");
  const shown = groups.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <TableContainer
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "#fff",
      }}
    >
      <Table size="small" sx={{ minWidth: 1250 }}>
        <TableHead>
          <TableRow>
            {[
              `Form No / ${kind} No`,
              partyLabel,
              "Consignment",
              "Date",
              "Due Date",
              "RFD Date",
              "Status",
            ].map((h) => (
              <TableCell key={h} sx={head}>
                {h}
              </TableCell>
            ))}
            {["Total (FCA)", "Paid", "Balance", "Total"].map((h) => (
              <TableCell key={h} align="right" sx={head}>
                {h}
              </TableCell>
            ))}
            <TableCell align="center" sx={head}>
              Preview
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={12}
                align="center"
                sx={{ py: 4, color: T.grey600 }}
              >
                No {kind.toLowerCase()}s found
              </TableCell>
            </TableRow>
          ) : (
            <>
              {shown.map((g) => {
                const k = g.orderId;
                const isOpen = open[k] ?? false;
                const gl = g.docs.filter((d) => d.status !== "void");
                const paidCnt = gl.filter((d) => d.status === "paid").length;
                const currencies = [...new Set(gl.map((d) => d.currency))];
                const fcaTxt =
                  currencies.length === 1 && currencies[0] !== "AED"
                    ? fmtCur(
                        sumBy(gl, (d) => d.total),
                        currencies[0],
                      )
                    : "-";
                const cons = [
                  ...new Set(
                    g.docs.map((d) => d.consignmentNumber).filter(Boolean),
                  ),
                ];
                const rfdTxt = fmtDate(g.rfdDate);
                return [
                  <TableRow
                    key={k}
                    hover
                    onClick={() => setOpen((p) => ({ ...p, [k]: !isOpen }))}
                    sx={{ cursor: "pointer", bgcolor: T.grey100 }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: T.tealDark }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <ExpandMoreIcon
                          fontSize="small"
                          sx={{
                            color: T.teal,
                            transition: "transform 0.2s",
                            transform: isOpen
                              ? "rotate(0deg)"
                              : "rotate(-90deg)",
                          }}
                        />
                        <Box>
                          {g.formNo}
                          {g.bookingRef && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                color: T.grey600,
                                fontWeight: 400,
                              }}
                            >
                              {g.bookingRef}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`${g.docs.length} ${kind.toLowerCase()}${g.docs.length > 1 ? "s" : ""}`}
                        sx={{
                          bgcolor: T.tealMid,
                          color: T.tealDark,
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {!isOpen ? (cons.length ? cons.join(", ") : "-") : ""}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {!isOpen
                        ? pickDate(
                            gl.map((d) => d.date),
                            "max",
                          )
                        : ""}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {!isOpen
                        ? pickDate(
                            gl.map((d) => d.dueDate),
                            "min",
                          )
                        : ""}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {!isOpen ? rfdTxt : ""}
                    </TableCell>
                    <TableCell>
                      {!isOpen && (
                        <Chip
                          label={`Paid (${paidCnt}/${gl.length})`}
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {!isOpen ? fcaTxt : ""}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {fmtAed(sumBy(gl, docPaidAed))}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {fmtAed(sumBy(gl, docBalanceAed))}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {fmtAed(sumBy(gl, docTotalAed))}
                    </TableCell>
                    <TableCell />
                  </TableRow>,
                  ...(isOpen
                    ? g.docs.map((d) => {
                        const od =
                          kind === "Invoice" ? overdueDays(d, g.rfdDate) : null;
                        return (
                          <TableRow hover key={d.id}>
                            <TableCell sx={{ pl: 7, fontWeight: 600 }}>
                              {d.number}
                            </TableCell>
                            <TableCell>{d[partyKey]}</TableCell>
                            <TableCell>{d.consignmentNumber || "-"}</TableCell>
                            <TableCell>{fmtDate(d.date)}</TableCell>
                            <TableCell>{fmtDate(d.dueDate)}</TableCell>
                            <TableCell>
                              {rfdTxt}
                              {od && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "block",
                                    color: "error.main",
                                    fontWeight: 600,
                                    mt: 0.25,
                                  }}
                                >
                                  Overdue by {od} {od === 1 ? "day" : "days"} ·
                                  late charges may apply
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={statusLabel(d, g.rfdDate)}
                                size="small"
                                variant="outlined"
                                color={docStatusColor(d.status)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {d.currency === "AED"
                                ? "-"
                                : fmtCur(d.total, d.currency)}
                            </TableCell>
                            <TableCell align="right">
                              {d.totalAed == null || d.balanceAed == null
                                ? "-"
                                : fmtAed(d.totalAed - d.balanceAed)}
                            </TableCell>
                            <TableCell align="right">
                              {fmtAed(d.balanceAed)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {fmtAed(d.totalAed)}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                disabled={previewingId === d.id}
                                onClick={() => onPreview(kind, d)}
                              >
                                {previewingId === d.id ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <VisibilityIcon fontSize="small" />
                                )}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    : []),
                ];
              })}
              <TableRow sx={{ bgcolor: T.tealLight }}>
                <TableCell
                  colSpan={8}
                  align="right"
                  sx={{ fontWeight: 700, color: T.tealDark }}
                >
                  Grand Total ({groups.length} orders)
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: T.tealDark }}
                >
                  {fmtAed(sumBy(live, docPaidAed))}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: T.tealDark }}
                >
                  {fmtAed(sumBy(live, docBalanceAed))}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: T.tealDark }}
                >
                  {fmtAed(sumBy(live, docTotalAed))}
                </TableCell>
                <TableCell />
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function FinanceOverview() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const allowed = isSuperAdmin() || isAdmin();

  const ranges = useMemo(quickRanges, []);
  const [range, setRange] = useState({ from: "", to: "" });
  const [rfdOnly, setRfdOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("invoices");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [previewingId, setPreviewingId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const invalidRange = range.from && range.to && range.from > range.to;

  const load = useCallback(async () => {
    if (!allowed || invalidRange) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/api/zoho-invoice/finance/overview", {
        params: {
          from: range.from || undefined,
          to: range.to || undefined,
          rfdOnly: rfdOnly || undefined,
        },
      });
      setOrders(data.orders || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load finance overview.",
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [allowed, invalidRange, range.from, range.to, rfdOnly]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setPage(0), [search, view, orders]);

  const openPreview = async (kind, doc) => {
    setPreviewingId(doc.id);
    try {
      const path =
        kind === "Bill"
          ? `/api/zoho-invoice/bill/${doc.id}/pdf`
          : `/api/zoho-invoice/${doc.id}/pdf`;
      const { data } = await api.get(path, { responseType: "blob" });
      setPreviewDoc({
        kind,
        doc,
        url: URL.createObjectURL(new Blob([data], { type: "application/pdf" })),
      });
    } catch {
      toast.error("Failed to load PDF.");
    } finally {
      setPreviewingId(null);
    }
  };

  const closePreview = () => {
    if (previewDoc?.url) URL.revokeObjectURL(previewDoc.url);
    setPreviewDoc(null);
  };

  // search narrows orders (and therefore cards, tabs and totals)
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    const has = (v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(q);
    return orders.filter(
      (o) =>
        has(o.formNo) ||
        has(o.bookingRef) ||
        [...o.invoices, ...o.vendorBills].some(
          (d) =>
            has(d.number) ||
            has(d.customer) ||
            has(d.vendor) ||
            has(d.consignmentNumber),
        ),
    );
  }, [orders, search]);

  const invoices = useMemo(() => visible.flatMap((o) => o.invoices), [visible]);
  const bills = useMemo(() => visible.flatMap((o) => o.vendorBills), [visible]);

  const stats = useMemo(() => {
    const liveInv = invoices.filter((d) => d.status !== "void");
    const liveBills = bills.filter((d) => d.status !== "void");
    const invoiceTotal = sumBy(liveInv, docTotalAed);
    const vendorTotal = sumBy(liveBills, docTotalAed);
    return {
      liveInv,
      liveBills,
      invoiceTotal,
      vendorTotal,
      received: sumBy(liveInv, docPaidAed),
      paidOut: sumBy(liveBills, docPaidAed),
      net: invoiceTotal - vendorTotal,
      missing: [...liveInv, ...liveBills].filter((d) => d.totalAed == null)
        .length,
    };
  }, [invoices, bills]);

  const isInvoices = view === "invoices";
  const groups = useMemo(
    () =>
      visible
        .map((o) => ({
          orderId: o.orderId,
          formNo: o.formNo,
          bookingRef: o.bookingRef,
          rfdDate: o.rfdDate,
          docs: isInvoices ? o.invoices : o.vendorBills,
        }))
        .filter((g) => g.docs.length > 0),
    [visible, isInvoices],
  );

  if (!allowed)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You do not have access to this page.</Alert>
      </Box>
    );

  const margin =
    stats.invoiceTotal > 0
      ? `${((stats.net / stats.invoiceTotal) * 100).toFixed(1)}% Margin`
      : "- Margin";
  const activeQuick = ranges.find(
    (r) => r.from === range.from && r.to === range.to,
  )?.key;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Typography variant="h5" fontWeight={700} color={T.teal}>
            Finance Overview
          </Typography>
          <Typography variant="body2" sx={{ color: T.grey600 }}>
            All orders · amounts in AED · date range filters by invoice date /
            bill date
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={load}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <RefreshIcon />
            )
          }
          sx={{ borderColor: T.teal, color: T.teal }}
        >
          Refresh
        </Button>
      </Stack>

      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 2.5, borderRadius: 2.5, borderColor: T.grey200 }}
      >
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1.5}>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {ranges.map((r) => (
              <Chip
                key={r.key}
                label={r.label}
                clickable
                onClick={() => setRange({ from: r.from, to: r.to })}
                sx={{
                  fontWeight: 600,
                  ...(activeQuick === r.key
                    ? {
                        bgcolor: T.teal,
                        color: "#fff",
                        "&:hover": { bgcolor: T.tealDark },
                      }
                    : { bgcolor: T.grey100 }),
                }}
              />
            ))}
          </Stack>
          <Box sx={{ flex: 1 }} />
          {[
            ["from", "From date"],
            ["to", "To date"],
          ].map(([k, label]) => (
            <Stack key={k} direction="row" alignItems="center" spacing={0.75}>
              <Typography
                variant="caption"
                sx={{ color: T.grey600, fontWeight: 600, whiteSpace: "nowrap" }}
              >
                {label}
              </Typography>
              <TextField
                size="small"
                type="date"
                value={range[k]}
                onChange={(e) =>
                  setRange((r) => ({ ...r, [k]: e.target.value }))
                }
                error={!!invalidRange}
                inputProps={{ "aria-label": label }}
                sx={{ width: 160 }}
              />
            </Stack>
          ))}
        </Stack>
        <Stack
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          gap={2}
          sx={{ mt: 1.5 }}
        >
          <TextField
            size="small"
            placeholder="Search form no, document, party, consignment"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: "100%", sm: 440 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={rfdOnly}
                onChange={(e) => setRfdOnly(e.target.checked)}
                sx={{ color: T.teal, "&.Mui-checked": { color: T.teal } }}
              />
            }
            label={
              <Typography variant="body2">
                Only orders with RFD date (overdue is counted from RFD date)
              </Typography>
            }
          />
        </Stack>
        {invalidRange && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 1, display: "block" }}
          >
            The "from" date is after the "to" date.
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {stats.missing > 0 && (
          <Alert severity="warning">
            {stats.missing} document{stats.missing > 1 ? "s have" : " has"} no
            exchange rate yet, so {stats.missing > 1 ? "they are" : "it is"} not
            in the AED totals. Open the order's Finance tab and click Sync Zoho
            to load the rate.
          </Alert>
        )}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              lg: "repeat(5, 1fr)",
            },
            gap: 1.5,
          }}
        >
          <FinStatCard
            color="#2563eb"
            icon={<DescriptionOutlinedIcon />}
            value={fmtAed(stats.invoiceTotal)}
            label="Total Invoice"
            sub={`${stats.liveInv.length} Invoices`}
          />
          <FinStatCard
            color="#d97706"
            icon={<ReceiptLongOutlinedIcon />}
            value={fmtAed(stats.vendorTotal)}
            label="Total Bills"
            sub={`${stats.liveBills.length} Bills`}
          />
          <FinStatCard
            color="#16a34a"
            icon={<AccountBalanceWalletOutlinedIcon />}
            value={fmtAed(stats.received)}
            label="Total Received"
            sub={`${stats.liveInv.filter((d) => docPaidAed(d) > 0).length} Receipts`}
          />
          <FinStatCard
            color="#7c3aed"
            icon={<CreditCardOutlinedIcon />}
            value={fmtAed(stats.paidOut)}
            label="Total Bills Paid"
            sub={`${stats.liveBills.filter((d) => docPaidAed(d) > 0).length} Payments`}
          />
          <FinStatCard
            color="#059669"
            icon={<TrendingUpIcon />}
            value={fmtAed(stats.net)}
            label="Net Profit"
            sub={margin}
          />
        </Box>

        <Divider />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, v) => v && setView(v)}
          >
            <ToggleButton
              value="invoices"
              sx={{ textTransform: "none", px: 2.5 }}
            >
              Invoices ({invoices.length})
            </ToggleButton>
            <ToggleButton value="bills" sx={{ textTransform: "none", px: 2.5 }}>
              Bills ({bills.length})
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary">
            Click a form number to collapse or expand. Void documents are
            excluded from totals.
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress size={28} sx={{ color: T.teal }} />
          </Box>
        ) : (
          <Box>
            <DocTable
              groups={groups}
              kind={isInvoices ? "Invoice" : "Bill"}
              partyLabel={isInvoices ? "Customer" : "Vendor"}
              partyKey={isInvoices ? "customer" : "vendor"}
              onPreview={openPreview}
              previewingId={previewingId}
              page={page}
              rowsPerPage={rowsPerPage}
            />
            <TablePagination
              component="div"
              rowsPerPageOptions={[10, 25, 50, 100]}
              count={groups.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Orders per page"
            />
          </Box>
        )}
      </Stack>

      <Dialog
        open={!!previewDoc}
        onClose={closePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: T.teal,
            color: "#fff",
          }}
        >
          {previewDoc?.kind} {previewDoc?.doc?.number}
          <IconButton onClick={closePreview} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {previewDoc && (
          <Box
            component="iframe"
            src={previewDoc.url}
            title="Document preview"
            sx={{ border: 0, width: "100%", height: "75vh" }}
          />
        )}
      </Dialog>
    </Box>
  );
}
