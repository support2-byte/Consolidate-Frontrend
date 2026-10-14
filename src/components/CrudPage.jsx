import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  TablePagination,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SyncIcon from "@mui/icons-material/Sync";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Checkbox from "@mui/material/Checkbox";
import CloseIconMui from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const TEAL = "#1a7a6e";
const ORANGE = "#e07b2a";

export default function CrudPage({
  title,
  endpoint,
  columns,
  rows: externalRows,
  loading: externalLoading,
  onDelete,
  onReloadZoho,
  typeField = "type",
  enableImportFromDoc = false,
  onImportComplete,
}) {
  const isControlled = externalRows !== undefined;
  const [internalRows, setInternalRows] = useState([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [zohoSyncing, setZohoSyncing] = useState(false);
  const fullScreenImportModal = useMediaQuery("(max-width:600px)");

  const rows = isControlled ? externalRows : internalRows;
  const loading = isControlled ? !!externalLoading : internalLoading;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const [importDocModalOpen, setImportDocModalOpen] = useState(false);
  const [importDocLoading, setImportDocLoading] = useState(false);
  const [importCandidates, setImportCandidates] = useState([]);
  const [selectedCandidateKeys, setSelectedCandidateKeys] = useState(new Set());
  const [importSaving, setImportSaving] = useState(false);

  const buildCandidateKey = (formId, kind, id) => `${formId}-${kind}-${id}`;

  const normalize = (v) => (v || "").toString().trim().toLowerCase();

  const openImportDocModal = async () => {
    setImportDocModalOpen(true);
    setSelectedCandidateKeys(new Set());
    setImportDocLoading(true);
    try {
      const { data } = await api.get("/api/orders/booking/list");

      const existingEmails = new Set(
        (rows || []).map((c) => normalize(c.email)).filter(Boolean),
      );
      const existingPhones = new Set(
        (rows || []).map((c) => normalize(c.phone_number)).filter(Boolean),
      );

      const candidates = [];
      (data || []).forEach((form) => {
        (form.senders || []).forEach((s) => {
          const isExisting =
            (s.email && existingEmails.has(normalize(s.email))) ||
            (s.phone && existingPhones.has(normalize(s.phone)));
          candidates.push({
            key: buildCandidateKey(form.id, "sender", s.id),
            formId: form.id,
            formLabel: `${form.form_id} — ${form.company?.company || ""}`,
            kind: "sender",
            name: s.name || "",
            email: s.email || "",
            phone: s.phone || "",
            address: s.address || "",
            isExisting,
          });
        });
        (form.receivers || []).forEach((r) => {
          const isExisting =
            (r.email && existingEmails.has(normalize(r.email))) ||
            (r.phone && existingPhones.has(normalize(r.phone)));
          candidates.push({
            key: buildCandidateKey(form.id, "receiver", r.id),
            formId: form.id,
            formLabel: `${form.form_id} — ${form.company?.company || ""}`,
            kind: "receiver",
            name: r.name || "",
            email: r.email || "",
            phone: r.phone || "",
            address: r.address || "",
            isExisting,
          });
        });
      });
      setImportCandidates(candidates);
    } catch (err) {
      console.error(
        "[openImportDocModal] Error:",
        err.response?.data || err.message,
      );
      showToast(
        err.response?.data?.error || "Failed to fetch booking forms",
        "error",
      );
    } finally {
      setImportDocLoading(false);
    }
  };

  const closeImportDocModal = () => {
    setImportDocModalOpen(false);
    setImportCandidates([]);
    setSelectedCandidateKeys(new Set());
  };

  const toggleCandidate = (key) => {
    const candidate = importCandidates.find((c) => c.key === key);
    if (candidate?.isExisting) return;
    setSelectedCandidateKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectableKeys = importCandidates
      .filter((c) => !c.isExisting)
      .map((c) => c.key);
    setSelectedCandidateKeys((prev) =>
      prev.size === selectableKeys.length ? new Set() : new Set(selectableKeys),
    );
  };

  const handleImportSelected = async () => {
    const selected = importCandidates.filter((c) =>
      selectedCandidateKeys.has(c.key),
    );
    if (!selected.length) return;

    setImportSaving(true);
    try {
      const payload = {
        customers: selected.map((c) => ({
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          contact_type: "customer",
          type: c.kind,
        })),
      };
      const { data } = await api.post(
        "/api/customers/import-from-doc",
        payload,
      );
      showToast(
        `Imported ${data.imported} customer(s) successfully!`,
        "success",
      );
      closeImportDocModal();
      if (onImportComplete) {
        onImportComplete();
      } else if (!isControlled) {
        await load();
      }
    } catch (err) {
      console.error(
        "[handleImportSelected] Error:",
        err.response?.data || err.message,
      );
      showToast(
        err.response?.data?.error || "Failed to import customers",
        "error",
      );
    } finally {
      setImportSaving(false);
    }
  };

  const showToast = (message, severity = "success") => {
    toast[severity] ? toast[severity](message) : toast(message);
  };

  const load = async () => {
    if (isControlled) return;
    try {
      setInternalLoading(true);
      const response = await api.get(endpoint);
      setInternalRows(response.data);
    } catch (err) {
      console.error("Failed to load data", err);
      showToast("Failed to load data", "error");
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (!isControlled) load();
  }, []);

  const startAdd = () => navigate(`/${title.toLowerCase()}/add`);
  const startEdit = (row) =>
    navigate(`/${title.toLowerCase()}/${row.zoho_id}/edit`);

  const loadZoho = async () => {
    setZohoSyncing(true);
    try {
      if (onReloadZoho) {
        await onReloadZoho();
      } else {
        await axios.get(
          "https://consolidate.onrender.com/api/customerPanals?search=All&limit=5000&",
        );
      }
      showToast("Zoho customers synced successfully!", "success");
    } catch (err) {
      console.error("Failed to sync Zoho data:", err);
      showToast(
        `Failed to sync: ${err.response?.data?.error || err.message}`,
        "error",
      );
    } finally {
      setZohoSyncing(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (onDelete) {
        await onDelete(deleteId);
      } else {
        await api.delete(`${endpoint}/${deleteId}`);
        await load();
      }
      showToast("Record deleted successfully!", "success");
    } catch (err) {
      showToast("Failed to delete record", "error");
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleTypeFilterChange = (_e, newValue) => {
    if (newValue !== null) {
      setTypeFilter(newValue);
      setPage(0);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const filteredRows = useMemo(() => {
    let result = rows;

    if (typeFilter !== "all") {
      result = result.filter(
        (row) => String(row[typeField] ?? "").toLowerCase() === typeFilter,
      );
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter((row) =>
        columns.some((c) =>
          String(row[c.key] ?? "")
            .toLowerCase()
            .includes(term),
        ),
      );
    }

    return result;
  }, [rows, typeFilter, searchTerm, columns, typeField]);

  const paginatedRows = filteredRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="#f58220">
          {title}
        </Typography>

        <Stack direction="row" spacing={1.5}>
          {enableImportFromDoc && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadFileIcon />}
              onClick={openImportDocModal}
              sx={{
                borderColor: ORANGE,
                color: ORANGE,
                fontWeight: 600,
                "&:hover": { borderColor: ORANGE, bgcolor: "#fdf1e7" },
              }}
            >
              Import from Doc
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={
              zohoSyncing ? (
                <CircularProgress size={16} sx={{ color: TEAL }} />
              ) : (
                <SyncIcon />
              )
            }
            onClick={loadZoho}
            disabled={zohoSyncing}
            sx={{
              borderColor: TEAL,
              color: TEAL,
              fontWeight: 600,
              "&:hover": { borderColor: TEAL, bgcolor: "#e6f4f1" },
            }}
          >
            Sync Zoho
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={startAdd}
            sx={{
              bgcolor: TEAL,
              fontWeight: 600,
              "&:hover": { bgcolor: "#155f55" },
            }}
          >
            Add {title}
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <TextField
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ minWidth: 260, bgcolor: "white" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "#999" }} />
              </InputAdornment>
            ),
          }}
        />

        <ToggleButtonGroup
          value={typeFilter}
          exclusive
          onChange={handleTypeFilterChange}
          size="small"
        >
          <ToggleButton
            value="all"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              "&.Mui-selected": {
                bgcolor: TEAL,
                color: "white",
                "&:hover": { bgcolor: "#155f55" },
              },
              px: 2,
            }}
          >
            All
          </ToggleButton>
          <ToggleButton
            value="sender"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              "&.Mui-selected": {
                bgcolor: TEAL,
                color: "white",
                "&:hover": { bgcolor: "#155f55" },
              },
              px: 2,
            }}
          >
            Sender
          </ToggleButton>
          <ToggleButton
            value="receiver"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              "&.Mui-selected": {
                bgcolor: TEAL,
                color: "white",
                "&:hover": { bgcolor: "#155f55" },
              },
              px: 2,
            }}
          >
            Receiver
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

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
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    sx={{ color: "white", fontWeight: 600 }}
                  >
                    {c.label}
                  </TableCell>
                ))}
                <TableCell
                  sx={{ color: "white", fontWeight: 600 }}
                  align="right"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    <CircularProgress size={28} sx={{ color: TEAL }} />
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    align="center"
                    sx={{ py: 6, color: "#aaa" }}
                  >
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => (
                  <TableRow
                    key={row.zoho_id}
                    sx={{
                      "&:hover": { bgcolor: "#e6f4f1" },
                      "&:nth-of-type(even)": { bgcolor: "#fafafa" },
                    }}
                  >
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        <Tooltip title={row[c.key] ?? ""}>
                          <span
                            style={{
                              display: "block",
                              maxWidth: 220,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row[c.key] ?? ""}
                          </span>
                        </Tooltip>
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => startEdit(row)}
                            sx={{
                              color: TEAL,
                              "&:hover": { bgcolor: "#e6f4f1" },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(row.zoho_id)}
                            sx={{
                              color: "#c62828",
                              "&:hover": { bgcolor: "#fdecea" },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />

      {enableImportFromDoc && (
        <Dialog
          open={importDocModalOpen}
          onClose={closeImportDocModal}
          maxWidth="sm"
          fullWidth
          fullScreen={fullScreenImportModal}
          PaperProps={{
            sx: {
              borderRadius: fullScreenImportModal ? 0 : 3,
              overflow: "hidden",
            },
          }}
        >
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              py: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                Import from Booking Forms
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sender &amp; receiver contacts found on submitted forms
              </Typography>
            </Box>
            <IconButton onClick={closeImportDocModal} size="small" edge="end">
              <CloseIconMui fontSize="small" />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 0 }}>
            {importDocLoading && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 8,
                }}
              >
                <CircularProgress size={26} sx={{ color: TEAL, mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Loading booking forms…
                </Typography>
              </Box>
            )}

            {!importDocLoading && importCandidates.length === 0 && (
              <Box sx={{ py: 8, textAlign: "center", px: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No sender/receiver data found on any booking form.
                </Typography>
              </Box>
            )}

            {!importDocLoading && importCandidates.length > 0 && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1,
                    bgcolor: "grey.50",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Checkbox
                      size="small"
                      checked={
                        selectedCandidateKeys.size > 0 &&
                        selectedCandidateKeys.size ===
                          importCandidates.filter((c) => !c.isExisting).length
                      }
                      indeterminate={
                        selectedCandidateKeys.size > 0 &&
                        selectedCandidateKeys.size <
                          importCandidates.filter((c) => !c.isExisting).length
                      }
                      disabled={importCandidates.every((c) => c.isExisting)}
                      onChange={toggleSelectAll}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ cursor: "pointer" }}
                      onClick={toggleSelectAll}
                    >
                      Select all (
                      {importCandidates.filter((c) => !c.isExisting).length}{" "}
                      new)
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {selectedCandidateKeys.size} selected
                  </Typography>
                </Box>

                <Box
                  sx={{ maxHeight: { xs: "60vh", sm: 420 }, overflowY: "auto" }}
                >
                  {importCandidates.map((c) => {
                    const checked = selectedCandidateKeys.has(c.key);
                    const disabled = !!c.isExisting;
                    const initial = (c.name || "?")
                      .trim()
                      .charAt(0)
                      .toUpperCase();
                    return (
                      <Box
                        key={c.key}
                        onClick={() => toggleCandidate(c.key)}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1.5,
                          px: 2,
                          py: 1.5,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          cursor: disabled ? "not-allowed" : "pointer",
                          opacity: disabled ? 0.55 : 1,
                          bgcolor: checked
                            ? "rgba(26,122,110,0.06)"
                            : "transparent",
                          "&:hover": {
                            bgcolor: disabled
                              ? "transparent"
                              : checked
                                ? "rgba(26,122,110,0.1)"
                                : "grey.50",
                          },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleCandidate(c.key)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ mt: 0.5 }}
                        />

                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            flexShrink: 0,
                            borderRadius: "50%",
                            bgcolor: c.kind === "sender" ? "#e07b2a" : TEAL,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 14,
                            mt: 0.5,
                            filter: disabled ? "grayscale(1)" : "none",
                          }}
                        >
                          {initial}
                        </Box>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            sx={{ mb: 0.25 }}
                          >
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {c.name || "—"}
                            </Typography>
                            <Box
                              sx={{
                                px: 0.9,
                                py: 0.1,
                                borderRadius: 1,
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.3,
                                color: c.kind === "sender" ? "#e07b2a" : TEAL,
                                bgcolor:
                                  c.kind === "sender"
                                    ? "rgba(224,123,42,0.1)"
                                    : "rgba(26,122,110,0.1)",
                              }}
                            >
                              {c.kind}
                            </Box>
                            {disabled && (
                              <Box
                                sx={{
                                  px: 0.9,
                                  py: 0.1,
                                  borderRadius: 1,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#666",
                                  bgcolor: "grey.200",
                                }}
                              >
                                Already a customer
                              </Box>
                            )}
                          </Stack>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="div"
                            noWrap
                          >
                            {[c.email, c.phone].filter(Boolean).join("  ·  ") ||
                              "No contact info"}
                          </Typography>
                          {c.address && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="div"
                              noWrap
                            >
                              {c.address}
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            component="div"
                            noWrap
                            sx={{ mt: 0.25 }}
                          >
                            {c.formLabel}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              p: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              position: "sticky",
              bottom: 0,
              bgcolor: "background.paper",
            }}
          >
            <Button onClick={closeImportDocModal} sx={{ color: "#666" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={selectedCandidateKeys.size === 0 || importSaving}
              onClick={handleImportSelected}
              startIcon={
                importSaving ? (
                  <CircularProgress size={16} sx={{ color: "#fff" }} />
                ) : null
              }
              sx={{
                bgcolor: TEAL,
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": { bgcolor: "#155f55" },
              }}
            >
              Import{" "}
              {selectedCandidateKeys.size > 0
                ? `(${selectedCandidateKeys.size})`
                : ""}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this record? This action cannot be
          undone.
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: "#666" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            sx={{ bgcolor: "#c62828", "&:hover": { bgcolor: "#a31f1f" } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
