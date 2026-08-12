import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { api } from "../../api";

const EMPTY_FORM = {
  id: null,
  name: "",
  template: "",
  status: true,
  company_id: "",
};

// Sample data used only for the in-editor preview — the real print flow
// (Orders List -> select order -> select template) renders with actual
// order data via GET /api/document-templates/:id/render?order_id=...
const SAMPLE_DATA = {
  order: {
    rgl_booking_number: "RGL-000123",
    booking_ref: "BR-9981",
    item_ref: "IT-4521",
  },
  consignment: { consignment_number: "CNS-2026-045" },
  container: { container_number: "MSKU1234567" },
  receiver: {
    name: "Ahmed Al Farsi",
    address: "Al Quoz Industrial Area, Dubai, UAE",
    phone: "+971 50 123 4567",
  },
};

const MERGE_TAGS = [
  "{{order.rgl_booking_number}}",
  "{{order.booking_ref}}",
  "{{order.item_ref}}",
  "{{consignment.consignment_number}}",
  "{{container.container_number}}",
  "{{receiver.name}}",
  "{{receiver.address}}",
  "{{receiver.phone}}",
  "{{company.company}}",
  "{{company.address}}",
  "{{company.logo_url}}",
  "{{company.signature_url}}",
];

const getByPath = (obj, path) =>
  path
    .split(".")
    .reduce(
      (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
      obj,
    );

const mergeTemplate = (templateHtml, data) =>
  (templateHtml || "").replace(/{{\s*([\w.]+)\s*}}/g, (match, path) => {
    const value = getByPath(data, path);
    return value !== undefined && value !== null
      ? String(value)
      : `<span style="color:#c00">${match}</span>`;
  });

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [templatesRes, companiesRes] = await Promise.all([
        api.get("/api/options/documents"),
        api.get("/api/options/companies", {
          params: { status: true, limit: 100 },
        }),
      ]);
      setTemplates(templatesRes.data.data || []);
      setCompanies(companiesRes.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load document templates",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreateDialog = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (row) => {
    setForm({
      id: row.id,
      name: row.name,
      template: row.template,
      status: row.status,
      company_id: row.company_id,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const handleChange = (field) => (e) => {
    const value = field === "status" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      template: form.template,
      status: form.status,
      company_id: form.company_id,
    };

    try {
      if (form.id) {
        await api.put(`/api/options/documents/${form.id}`, payload);
      } else {
        await api.post("/api/options/documents", payload);
      }
      setDialogOpen(false);
      fetchAll();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save document template",
      );
    } finally {
      setSaving(false);
    }
  };

  const companyName = (id) =>
    companies.find((c) => c.id === id)?.company || "—";

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === form.company_id),
    [companies, form.company_id],
  );

  const previewHtml = useMemo(() => {
    if (!form.template) return "";
    const data = {
      ...SAMPLE_DATA,
      company: {
        company: selectedCompany?.company || "Select a company",
        address: selectedCompany?.address || "",
        logo_url: selectedCompany?.logo_url || "",
        signature_url: selectedCompany?.signature_url || "",
        primary_color: selectedCompany?.primary_color || "#000000",
        secondary_color: selectedCompany?.secondary_color || "#666666",
      },
    };
    return mergeTemplate(form.template, data);
  }, [form.template, selectedCompany]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={600}>
          Document Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          New Template
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined">
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Template Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {row.logo_url ? (
                        <Box
                          component="a"
                          href={row.logo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: "inline-flex", cursor: "pointer" }}
                          title="Open logo"
                        >
                          <Avatar
                            src={row.logo_url}
                            variant="rounded"
                            sx={{ width: 28, height: 28 }}
                          >
                            {
                              (row.company_name ||
                                companyName(row.company_id))?.[0]
                            }
                          </Avatar>
                        </Box>
                      ) : (
                        <Avatar
                          variant="rounded"
                          sx={{ width: 28, height: 28 }}
                        >
                          {
                            (row.company_name ||
                              companyName(row.company_id))?.[0]
                          }
                        </Avatar>
                      )}
                      <Typography variant="body2">
                        {row.company_name || companyName(row.company_id)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status ? "Active" : "Inactive"}
                      color={row.status ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(row)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    No document templates yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xl" fullWidth>
        <DialogTitle>
          {form.id ? "Edit Document Template" : "New Document Template"}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
              alignItems: "flex-start",
            }}
          >
            {/* Left: form */}
            <Box
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                width: { xs: "100%", md: "auto" },
              }}
            >
              <Stack spacing={2}>
                <TextField
                  select
                  label="Company"
                  value={form.company_id}
                  onChange={handleChange("company_id")}
                  fullWidth
                  required
                  helperText="Preview and print use this company's logo, signature and colors"
                >
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.company}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Template Name"
                  value={form.name}
                  onChange={handleChange("name")}
                  fullWidth
                  required
                />

                <TextField
                  label="Template (HTML)"
                  value={form.template}
                  onChange={handleChange("template")}
                  fullWidth
                  required
                  multiline
                  rows={16}
                  helperText="Use {{merge.tags}} — see reference below. Actual print uses real order data."
                />

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    Available merge tags
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {MERGE_TAGS.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            template: (prev.template || "") + tag,
                          }))
                        }
                      />
                    ))}
                  </Stack>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={!!form.status}
                      onChange={handleChange("status")}
                    />
                  }
                  label="Active"
                />
              </Stack>
            </Box>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", md: "block" } }}
            />

            {/* Right: live preview */}
            <Box
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                width: { xs: "100%", md: "auto" },
                position: "sticky",
                top: 0,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Preview{" "}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  (sample data)
                </Typography>
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  minHeight: 480,
                  bgcolor: "#fff",
                  overflow: "auto",
                  fontSize: 14,
                }}
              >
                {form.template ? (
                  <Box dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Start typing a template to see the preview.
                  </Typography>
                )}
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
