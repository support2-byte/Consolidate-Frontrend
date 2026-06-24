import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
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
  Checkbox,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useThemeContext } from "../../context/ThemeContext";
import { api } from "../../api";

const MAX_TITLE = 80;
const MAX_DESC = 1000;

export default function BugReportPage() {
  const { mode } = useThemeContext();

  const [reports, setReports] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");

  useEffect(() => {
    fetchReports();
  }, []);

  const showNotification = (msg, severity = "success") => {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  const fetchReports = async () => {
    setTableLoading(true);
    try {
      const { data } = await api.get("/api/options/bug-report");
      setReports(Array.isArray(data) ? data : data?.reports || []);
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to fetch bug reports.",
        "error",
      );
    } finally {
      setTableLoading(false);
    }
  };

  const validate = () => {
    const e = { title: "", description: "" };
    if (!title.trim()) e.title = "Title is required.";
    if (!description.trim()) e.description = "Description is required.";
    setErrors(e);
    return !e.title && !e.description;
  };

  const handleOpenDialog = (report = null) => {
    if (report) {
      setEditingId(report.id || report._id);
      setTitle(report.title);
      setDescription(report.description);
    } else {
      setEditingId(null);
      setTitle("");
      setDescription("");
    }
    setErrors({ title: "", description: "" });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
  };

  const handleSaveReport = async () => {
    if (!validate()) return;
    setLoading(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
    };

    try {
      if (editingId) {
        const { data } = await api.put(
          `/api/options/bug-report/${editingId}`,
          payload,
        );
        setReports((prev) =>
          prev.map((r) =>
            (r.id || r._id) === editingId ? { ...r, ...payload } : r,
          ),
        );
        showNotification(data?.message || "Bug report updated successfully.");
      } else {
        const { data } = await api.post("/api/options/bug-report", payload);
        const newReport = data?.report || {
          ...payload,
          id: Date.now(),
          isFixed: false,
        };
        setReports((prev) => [newReport, ...prev]);
        showNotification(data?.message || "Bug report submitted successfully.");
      }
      handleCloseDialog();
    } catch (err) {
      showNotification(
        err.response?.data?.message || err.message || "Something went wrong.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFixed = async (id, currentStatus) => {
    try {
      const updatedStatus = !currentStatus;
      await api.put(`/api/options/bug-report/${id}`, {
        isFixed: updatedStatus,
      });

      setReports((prev) =>
        prev.map((r) =>
          (r.id || r._id) === id ? { ...r, isFixed: updatedStatus } : r,
        ),
      );
      showNotification(updatedStatus ? "Marked as fixed!" : "Reopened report.");
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to update report status.",
        "error",
      );
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bug report?"))
      return;

    try {
      await api.delete(`/api/options/bug-report/${id}`);
      setReports((prev) => prev.filter((r) => (r.id || r._id) !== id));
      showNotification("Bug report removed successfully.");
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to delete report.",
        "error",
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: { xs: 2, md: 4 },
      }}
    >
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "#00695c",
            }}
          >
            <BugReportOutlinedIcon sx={{ color: "#fff", fontSize: 28 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              Bug Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage, review, and track application anomalies.
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", gap: 1.5, width: { xs: "100%", sm: "auto" } }}
        >
          <Tooltip title="Refresh data">
            <IconButton
              onClick={fetchReports}
              disabled={tableLoading}
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<AddRoundedIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Report a Bug
          </Button>
        </Box>
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
                <TableCell width={80} align="center" sx={{ fontWeight: 600 }}>
                  Fixed
                </TableCell>
                <TableCell width={300} sx={{ fontWeight: 600 }}>
                  Title
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell width={120} align="center" sx={{ fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ fontWeight: 500 }}
                    >
                      {tableLoading
                        ? "Loading reports..."
                        : "No bug reports found."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report, index) => {
                  const id = report.id || report._id;
                  return (
                    <TableRow
                      key={id}
                      hover
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell align="center">{index + 1}</TableCell>
                      <TableCell align="center">
                        <Tooltip
                          title={report.isFixed ? "Mark open" : "Mark fixed"}
                        >
                          <Checkbox
                            checked={!!report.isFixed}
                            onChange={() =>
                              handleToggleFixed(id, report.isFixed)
                            }
                            color="success"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            textDecoration: report.isFixed
                              ? "line-through"
                              : "none",
                            color: report.isFixed
                              ? "text.disabled"
                              : "text.primary",
                          }}
                        >
                          {report.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={
                            report.isFixed ? "text.disabled" : "text.secondary"
                          }
                          sx={{
                            textDecoration: report.isFixed
                              ? "line-through"
                              : "none",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {report.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "inline-flex", gap: 0.5 }}>
                          <Tooltip title="Edit report">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(report)}
                              disabled={report.isFixed}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete report">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteReport(id)}
                            >
                              <DeleteRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editingId ? "Modify Bug Report" : "File Bug Report"}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              fullWidth
              label="Title"
              placeholder="e.g. Crash on login with Google account"
              value={title}
              onChange={(e) => {
                if (e.target.value.length <= MAX_TITLE) {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((p) => ({ ...p, title: "" }));
                }
              }}
              error={!!errors.title}
              helperText={errors.title || `${title.length} / ${MAX_TITLE}`}
              disabled={loading}
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Description"
              placeholder="Describe what you did, what you expected, and what actually happened."
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= MAX_DESC) {
                  setDescription(e.target.value);
                  if (errors.description)
                    setErrors((p) => ({ ...p, description: "" }));
                }
              }}
              error={!!errors.description}
              helperText={
                errors.description || `${description.length} / ${MAX_DESC}`
              }
              disabled={loading}
              multiline
              rows={5}
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              color: "text.secondary",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendRoundedIcon />}
            onClick={handleSaveReport}
            disabled={loading}
            sx={{ borderRadius: 2, px: 3, textTransform: "none" }}
          >
            {loading ? "Saving…" : editingId ? "Save Changes" : "Submit Report"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackSeverity}
          onClose={() => setSnackOpen(false)}
          sx={{ borderRadius: 2, fontWeight: 500 }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
