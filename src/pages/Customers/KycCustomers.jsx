import { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../../api";
import { AppContext } from "../../context/AppContext";

const COMPANIES = [
  {
    value: "RGSL",
    label: "Royal Gulf Shipping & Logistics",
    primary: "#097D76",
    accent: "#F38120",
  },
  {
    value: "MF",
    label: "Messiah Freight",
    primary: "#34419F",
    accent: "#F46A17",
  },
  {
    value: "CAS",
    label: "Cargo Aviation System",
    primary: "#04274a",
    accent: "#d91423",
  },
];

const statusColor = (status) => (status === "Email Sent" ? "success" : "info");

const kycRowColor = (kycStatus) => {
  if (kycStatus === "approved")
    return { bg: "#eaf7ee", hoverBg: "#d9f0e0", border: "#2e7d32" };
  if (kycStatus === "rejected")
    return { bg: "#fdecea", hoverBg: "#fbdad7", border: "#c62828" };
  if (kycStatus === "pending")
    return { bg: "#fff9e6", hoverBg: "#fff3c4", border: "#b7860b" };
  return null;
};

function CompanySelectorModal({ open, targets, onConfirm, onClose }) {
  const [selectedCompany, setSelectedCompany] = useState("");

  useEffect(() => {
    if (open) setSelectedCompany("");
  }, [open]);

  const chosen = COMPANIES.find((c) => c.value === selectedCompany);
  const isBulk = targets?.length > 1;

  const handleConfirm = () => {
    if (!selectedCompany) return;
    onConfirm(selectedCompany);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: chosen ? chosen.primary : "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
          >
            <BusinessIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography fontWeight={700} fontSize="1rem">
              Send KYC Email
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isBulk
                ? `Sending to ${targets.length} customers`
                : `Sending to ${targets?.[0]?.name || "customer"}`}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Choose which company brand this KYC email should be sent under.
        </Typography>

        <FormControl fullWidth size="small">
          <InputLabel>Select Company</InputLabel>
          <Select
            value={selectedCompany}
            label="Select Company"
            onChange={(e) => setSelectedCompany(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            {COMPANIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: c.primary,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2">{c.label}</Typography>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {chosen && (
          <Box
            sx={{
              mt: 2,
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              display: "flex",
              height: 8,
            }}
          >
            <Box sx={{ flex: 1, bgcolor: chosen.primary }} />
            <Box sx={{ flex: 1, bgcolor: chosen.accent }} />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!selectedCompany}
          onClick={handleConfirm}
          startIcon={<SendIcon />}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            bgcolor: chosen?.primary || undefined,
            "&:hover": {
              bgcolor: chosen?.primary || undefined,
              filter: "brightness(0.88)",
            },
          }}
        >
          Confirm & Queue
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function KycCustomers() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { customers, loadingCustomers } = useContext(AppContext);

  const [emailStatusMap, setEmailStatusMap] = useState({});
  const [submissionStats, setSubmissionStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [kycStatusMap, setKycStatusMap] = useState({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sendingIds, setSendingIds] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTargets, setModalTargets] = useState([]);

  const toggleFilter = (filter) => {
    setActiveFilter((prev) => (prev === filter ? null : filter));
    setPage(0);
    setSelectedIds([]);
  };

  const fetchEmailStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await api.get("/api/kyc/email-status");
      setEmailStatusMap(response.data.statusMap || {});
    } catch (error) {
      console.error("Failed to load KYC email status", error);
      toast.error("Unable to load KYC email status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchSubmissionStats = async () => {
    try {
      const response = await api.get("/api/kyc/submissions-stats");
      if (response.data.success) setSubmissionStats(response.data.stats);
    } catch (error) {
      console.error("Failed to load KYC submission stats", error);
      toast.error("Unable to load KYC submission stats.");
    }
  };

  const fetchKycStatusMap = async () => {
    try {
      const response = await api.get("/api/kyc/customer-status-map");
      if (response.data.success) setKycStatusMap(response.data.statusMap || {});
    } catch (error) {
      console.error("Failed to load KYC customer status map", error);
      toast.error("Unable to load KYC status data.");
    }
  };

  useEffect(() => {
    fetchEmailStatus();
    fetchSubmissionStats();
    fetchKycStatusMap();
  }, []);

  useEffect(() => {
    setPage(0);
    setSelectedIds([]);
  }, [search]);

  const rows = useMemo(() => {
    if (!customers?.length) return [];
    const term = search.trim().toLowerCase();

    return customers
      .map((customer, index) => {
        const id = customer.zoho_id || customer.id || `customer-${index}`;
        const email =
          customer.email || customer.contact_persons?.[0]?.email || "";
        const emailStatus = emailStatusMap[id];
        const sendCount = emailStatus?.sendCount || 0;

        return {
          id,
          company:
            customer.company_name ||
            customer.customer_name ||
            customer.contact_name ||
            "Unnamed Customer",
          name:
            customer.contact_name ||
            customer.contact_persons?.[0]?.name ||
            customer.company_name ||
            "Unnamed Customer",
          email,
          phone:
            customer.primary_phone ||
            customer.contact_persons?.[0]?.phone ||
            "",
          createdAt: customer.created_at || customer.createdAt || "",
          status: sendCount > 0 ? "Email Sent" : "Pending Review",
          sendCount,
          lastSentAt: emailStatus?.lastSentAt || null,
          kycStatus: kycStatusMap[id] || null,
        };
      })
      .filter((row) => {
        if (!term) return true;
        return (
          row.company.toLowerCase().includes(term) ||
          row.email.toLowerCase().includes(term) ||
          row.phone.toLowerCase().includes(term)
        );
      })
      .filter((row) => {
        if (!activeFilter) return true;
        if (activeFilter === "emailed") return row.sendCount > 0;
        if (activeFilter === "pending")
          return (
            row.kycStatus === "pending" ||
            (!row.kycStatus && row.sendCount === 0)
          );
        if (activeFilter === "approved") return row.kycStatus === "approved";
        if (activeFilter === "rejected") return row.kycStatus === "rejected";
        return true;
      });
  }, [customers, emailStatusMap, kycStatusMap, search, activeFilter]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds],
  );

  const totals = useMemo(() => {
    const allEmailed = (customers || []).filter((customer, index) => {
      const id = customer.zoho_id || customer.id || `customer-${index}`;
      return (emailStatusMap[id]?.sendCount || 0) > 0;
    }).length;

    return {
      total: customers?.length || 0,
      pending: submissionStats.pending,
      emailed: allEmailed,
      submissionsTotal: submissionStats.total,
      approved: submissionStats.approved,
      rejected: submissionStats.rejected,
    };
  }, [customers, emailStatusMap, submissionStats]);

  const toggleRow = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );

  const toggleAllRows = () => {
    const idsOnPage = paginatedRows.map((row) => row.id);
    const allSelected = idsOnPage.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !idsOnPage.includes(id))
        : [...new Set([...prev, ...idsOnPage])],
    );
  };

  const openMenu = (event, row) => {
    setMenuAnchor(event.currentTarget);
    setMenuRow(row);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const openSendModal = (row = null) => {
    const targets = row ? [row] : selectedRows;

    if (!targets.length) {
      toast.warning("Select at least one customer first.");
      return;
    }

    const missingEmail = targets.filter((t) => !t.email);
    if (missingEmail.length) {
      toast.warning(
        `${missingEmail.length} selected customer(s) have no email on file.`,
      );
    }

    const validTargets = targets.filter((t) => t.email);
    if (!validTargets.length) return;

    setModalTargets(validTargets);
    setModalOpen(true);
  };

  const handleConfirmSend = async (company) => {
    setModalOpen(false);

    const ids = modalTargets.map((item) => item.id);
    setSendingIds(ids);

    try {
      await api.post("/api/kyc/queue-email", {
        customers: modalTargets.map((t) => ({
          id: t.id,
          name: t.name,
          email: t.email,
          company,
        })),
      });

      toast.success(
        `KYC email queued for ${modalTargets.length} customer${modalTargets.length > 1 ? "s" : ""}.`,
      );
      setSelectedIds([]);
      await fetchEmailStatus();
    } catch (error) {
      console.error("KYC queue action failed", error);
      toast.error("Unable to queue KYC email.");
    } finally {
      setSendingIds([]);
      setModalTargets([]);
    }
  };

  const loading = loadingCustomers || statusLoading;

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }}
              color="#f58220"
            >
              KYC Customer Module
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Select customers and queue KYC verification emails.
            </Typography>
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            width={{ xs: "100%", md: "auto" }}
          >
            <Button
              variant="contained"
              fullWidth={isMobile}
              onClick={() => navigate("/kyc-submissions")}
            >
              View Submissions
            </Button>
            <Button
              variant="contained"
              fullWidth={isMobile}
              onClick={() => navigate("/kyc-logs")}
            >
              View Logs
            </Button>
            <Button
              variant="contained"
              color="success"
              fullWidth={isMobile}
              disabled={!selectedRows.length}
              onClick={() => openSendModal()}
            >
              Send Selected ({selectedRows.length})
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(6, 1fr)",
            },
            gap: 2,
          }}
        >
          {[
            {
              label: "Total Customers",
              value: totals.total,
              filter: null,
              activeColor: "primary.main",
            },
            {
              label: "Pending Review",
              value: totals.pending,
              filter: "pending",
              activeColor: "warning.main",
            },
            {
              label: "Approved",
              value: totals.approved,
              filter: "approved",
              activeColor: "success.main",
              valueColor: "success.main",
            },
            {
              label: "Rejected",
              value: totals.rejected,
              filter: "rejected",
              activeColor: "error.main",
              valueColor: "error.main",
            },
            {
              label: "Emails Sent",
              value: totals.emailed,
              filter: "emailed",
              activeColor: "info.main",
            },
            {
              label: "Total Submissions",
              value: totals.submissionsTotal,
              filter: "__none__",
            },
          ].map(({ label, value, filter, activeColor, valueColor }) => (
            <Paper
              key={label}
              onClick={
                filter !== "__none__"
                  ? () =>
                      filter === null
                        ? (setActiveFilter(null),
                          setPage(0),
                          setSelectedIds([]))
                        : toggleFilter(filter)
                  : undefined
              }
              sx={{
                p: 2,
                cursor: filter !== "__none__" ? "pointer" : "default",
                border:
                  activeFilter === filter
                    ? "2px solid"
                    : "2px solid transparent",
                borderColor:
                  activeFilter === filter ? activeColor : "transparent",
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                {label}
              </Typography>
              <Typography
                variant="h5"
                sx={valueColor ? { color: valueColor } : undefined}
              >
                {value}
              </Typography>
            </Paper>
          ))}
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Search by company, email or phone"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ width: { xs: "100%", md: "30%" } }}
        />

        {isMobile ? (
          <Stack spacing={1.5}>
            {loading ? (
              <Typography align="center" sx={{ py: 4 }}>
                Loading customers...
              </Typography>
            ) : !paginatedRows.length ? (
              <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                No customer records found.
              </Typography>
            ) : (
              paginatedRows.map((row) => (
                <Card key={row.id} variant="outlined">
                  <CardContent sx={{ pb: "12px !important" }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleRow(row.id)}
                        sx={{ p: 0, mr: 1 }}
                      />
                      <Box flex={1}>
                        <Typography fontWeight={600}>{row.company}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {row.email || "No email"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {row.phone || "—"}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => openMenu(e, row)}
                        disabled={sendingIds.includes(row.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Stack>
                    <Stack direction="row" spacing={1} mt={1.5}>
                      <Chip
                        label={row.status}
                        color={statusColor(row.status)}
                        size="small"
                      />
                      <Chip
                        label={
                          row.sendCount > 0
                            ? `${row.sendCount}x sent`
                            : "0x sent"
                        }
                        color={row.sendCount > 0 ? "success" : "default"}
                        size="small"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={
                        paginatedRows.length > 0 &&
                        paginatedRows.every((r) => selectedIds.includes(r.id))
                      }
                      indeterminate={
                        paginatedRows.some((r) => selectedIds.includes(r.id)) &&
                        !paginatedRows.every((r) => selectedIds.includes(r.id))
                      }
                      onChange={toggleAllRows}
                      disabled={!paginatedRows.length}
                    />
                  </TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Send Count</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : !paginatedRows.length ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No customer records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((row) => {
                    const rowColor = kycRowColor(row.kycStatus);
                    return (
                      <TableRow
                        key={row.id}
                        hover
                        sx={
                          rowColor
                            ? {
                                bgcolor: rowColor.bg,
                                borderLeft: `4px solid ${rowColor.border}`,
                                "&:hover": { bgcolor: rowColor.hoverBg },
                              }
                            : undefined
                        }
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.includes(row.id)}
                            onChange={() => toggleRow(row.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={600}>
                            {row.company}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {row.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.email || "—"}</TableCell>
                        <TableCell>{row.phone || "—"}</TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Chip
                              label={row.status}
                              color={statusColor(row.status)}
                              size="small"
                            />
                            {row.kycStatus && (
                              <Chip
                                label={`KYC: ${row.kycStatus}`}
                                size="small"
                                color={
                                  row.kycStatus === "approved"
                                    ? "success"
                                    : row.kycStatus === "rejected"
                                      ? "error"
                                      : "warning"
                                }
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.sendCount > 0 ? `${row.sendCount}` : "0"}
                            color={row.sendCount > 0 ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => openMenu(e, row)}
                            disabled={sendingIds.includes(row.id)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[10, 15, 25, 50]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        <MenuItem
          onClick={() => {
            const row = menuRow;
            closeMenu();
            openSendModal(row);
          }}
        >
          {menuRow?.sendCount > 0
            ? `Resend Email (${menuRow.sendCount})`
            : "Send Email"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            navigate(
              `/kyc-submission?customerId=${encodeURIComponent(menuRow?.id || "")}`,
            );
          }}
        >
          View Details
        </MenuItem>
      </Menu>

      <CompanySelectorModal
        open={modalOpen}
        targets={modalTargets}
        onConfirm={handleConfirmSend}
        onClose={() => {
          setModalOpen(false);
          setModalTargets([]);
        }}
      />
    </Box>
  );
}
