import { useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { toast } from "react-toastify";
import { api } from "../../api";

export const PAYMENT_STATUS = {
  paid: { label: "Paid", color: "success" },
  partially_paid: { label: "Partially Paid", color: "warning" },
  unpaid: { label: "Unpaid", color: "error" },
  no_invoice: { label: "No Invoice", color: "default" },
};

const TEAL = "#0d6c6a";
const headCellSx = { bgcolor: TEAL, color: "#fff", fontWeight: "bold" };

const docStatusColor = (s) =>
  s === "paid"
    ? "success"
    : s === "overdue"
      ? "error"
      : s === "void" || s === "draft"
        ? "default"
        : "warning";

const fmtStatus = (s = "") =>
  s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const fmtMoney = (n, cur) =>
  `${cur ?? ""} ${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`.trim();

const fmtDate = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "-");

const Stat = ({ label, value, color }) => (
  <Box
    sx={{
      border: 1,
      borderColor: "divider",
      borderRadius: 2,
      p: 2,
      bgcolor: "action.hover",
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography
      sx={{ fontWeight: 700, fontSize: 18, color: color || "text.primary" }}
    >
      {value}
    </Typography>
  </Box>
);

const DocTable = ({
  title,
  docs,
  partyLabel,
  partyKey,
  kind,
  loadingId,
  onPreview,
}) => (
  <Box sx={{ mt: 2 }}>
    <Typography sx={{ fontWeight: 600, color: TEAL, mb: 1 }}>
      {title} ({docs.length})
    </Typography>
    <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
      <Table size="small" sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow>
            {[
              `${kind} No`,
              partyLabel,
              "Consignment",
              "Date",
              "Due Date",
              "Status",
            ].map((h) => (
              <TableCell key={h} sx={headCellSx}>
                {h}
              </TableCell>
            ))}
            <TableCell sx={headCellSx} align="right">
              Amount
            </TableCell>
            <TableCell sx={headCellSx} align="right">
              Balance
            </TableCell>
            <TableCell sx={headCellSx} align="center">
              Preview
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {docs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No {title.toLowerCase()} found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            docs.map((d) => (
              <TableRow hover key={d.id}>
                <TableCell>{d.number}</TableCell>
                <TableCell>{d[partyKey]}</TableCell>
                <TableCell>{d.consignmentNumber || "-"}</TableCell>
                <TableCell>{fmtDate(d.date)}</TableCell>
                <TableCell>{fmtDate(d.dueDate)}</TableCell>
                <TableCell>
                  <Chip
                    label={fmtStatus(d.status)}
                    size="small"
                    variant="outlined"
                    color={docStatusColor(d.status)}
                  />
                </TableCell>
                <TableCell align="right">
                  {fmtMoney(d.total, d.currency)}
                </TableCell>
                <TableCell align="right">
                  {fmtMoney(d.balance, d.currency)}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    disabled={loadingId === d.id}
                    onClick={() => onPreview(kind, d)}
                  >
                    {loadingId === d.id ? (
                      <CircularProgress size={18} />
                    ) : (
                      <VisibilityIcon fontSize="small" />
                    )}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

export default function JobDetailsPanel({ row, loading }) {
  const [preview, setPreview] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const openPreview = async (kind, doc) => {
    setLoadingId(doc.id);
    try {
      const path =
        kind === "Bill"
          ? `/api/zoho-invoice/bill/${doc.id}/pdf`
          : `/api/zoho-invoice/${doc.id}/pdf`;
      const { data } = await api.get(path, { responseType: "blob" });
      setPreview({
        kind,
        doc,
        url: URL.createObjectURL(new Blob([data], { type: "application/pdf" })),
      });
    } catch {
      toast.error("Failed to load PDF.");
    } finally {
      setLoadingId(null);
    }
  };

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!row || (!row.invoices.length && !row.vendorBills.length)) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        No invoices or Job Details found for this order
      </Alert>
    );
  }

  const status = PAYMENT_STATUS[row.paymentStatus];

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
          {row.bookingRef} · {row.formNo}
        </Typography>
        <Chip label={status.label} size="small" color={status.color} />
      </Box>

      {row.mixedCurrency ? (
        <Alert severity="warning">
          Invoices and bills use different currencies, so gross profit can't be
          calculated automatically.
        </Alert>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          <Stat
            label="Total Invoices (Revenue)"
            value={fmtMoney(row.invoiceTotal, row.currency)}
          />
          <Stat
            label="Total Job Details (Cost)"
            value={fmtMoney(row.vendorTotal, row.currency)}
          />
          <Stat
            label="Gross Profit"
            value={fmtMoney(row.gross, row.currency)}
            color={row.gross >= 0 ? "success.main" : "error.main"}
          />
          <Stat
            label="Margin"
            value={
              row.invoiceTotal > 0
                ? `${((row.gross / row.invoiceTotal) * 100).toFixed(1)}%`
                : "-"
            }
          />
        </Box>
      )}

      <DocTable
        title="Job Details"
        docs={row.vendorBills}
        partyLabel="Vendor"
        partyKey="vendor"
        kind="Bill"
        loadingId={loadingId}
        onPreview={openPreview}
      />
      <DocTable
        title="Invoices"
        docs={row.invoices}
        partyLabel="Customer"
        partyKey="customer"
        kind="Invoice"
        loadingId={loadingId}
        onPreview={openPreview}
      />

      <Dialog
        open={Boolean(preview)}
        onClose={closePreview}
        maxWidth="lg"
        fullWidth
      >
        {preview && (
          <>
            <DialogTitle>
              {preview.kind} Preview · {preview.doc.number}
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              <iframe
                title="document-preview"
                src={preview.url}
                style={{ width: "100%", height: "75vh", border: 0 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closePreview}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
