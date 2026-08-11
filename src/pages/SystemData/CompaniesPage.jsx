import { useState, useEffect, useCallback } from "react";
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
  Avatar,
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Stack,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { api } from "../../api";
import SignaturePad from "../../components/companies/SignaturePad";

const EMPTY_FORM = {
  id: null,
  company: "",
  email: "",
  phone: "",
  address: "",
  primary_color: "",
  secondary_color: "",
  status: true,
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState(null);
  const [signatureData, setSignatureData] = useState(null); // base64 data URL from canvas
  const [existingSignatureUrl, setExistingSignatureUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/options/companies");
      setCompanies(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const openCreateDialog = () => {
    setForm(EMPTY_FORM);
    setLogoFile(null);
    setSignatureData(null);
    setExistingSignatureUrl(null);
    setDialogOpen(true);
  };

  const openEditDialog = (companyRow) => {
    setForm({
      id: companyRow.id,
      company: companyRow.company,
      email: companyRow.email,
      phone: companyRow.phone,
      address: companyRow.address,
      primary_color: companyRow.primary_color,
      secondary_color: companyRow.secondary_color,
      status: companyRow.status,
    });
    setLogoFile(null);
    setSignatureData(null);
    setExistingSignatureUrl(companyRow.signature_url || null);
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

    if (!form.id && !signatureData) {
      setError("Please draw a signature before saving.");
      setSaving(false);
      return;
    }

    const payload = new FormData();
    payload.append("company", form.company);
    payload.append("email", form.email);
    payload.append("phone", form.phone);
    payload.append("address", form.address);
    payload.append("primary_color", form.primary_color);
    payload.append("secondary_color", form.secondary_color);
    payload.append("status", form.status);
    if (logoFile) payload.append("logo", logoFile);
    // Backend expects an actual file under "signature" (multer .fields()), not a
    // base64 string — convert the canvas's data URL into a Blob before appending.
    if (signatureData) {
      const signatureBlob = await (await fetch(signatureData)).blob();
      payload.append("signature", signatureBlob, "signature.png");
    }

    try {
      if (form.id) {
        await api.put(`/api/options/companies/${form.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/api/options/companies", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setDialogOpen(false);
      fetchCompanies();
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setError(
        typeof backendMessage === "string"
          ? backendMessage
          : "Failed to save company",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={600}>
          Companies
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          New Company
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
                <TableCell>Logo</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Colors</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
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
                          sx={{ width: 36, height: 36 }}
                        >
                          {row.company?.[0]}
                        </Avatar>
                      </Box>
                    ) : (
                      <Avatar variant="rounded" sx={{ width: 36, height: 36 }}>
                        {row.company?.[0]}
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>{row.company}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {[row.primary_color, row.secondary_color]
                        .filter(Boolean)
                        .map((c) => (
                          <Box
                            key={c}
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "4px",
                              bgcolor: c,
                              border: "1px solid rgba(0,0,0,0.15)",
                            }}
                          />
                        ))}
                    </Stack>
                  </TableCell>
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
              {companies.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    No companies yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? "Edit Company" : "New Company"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Company Name"
              value={form.company}
              onChange={handleChange("company")}
              fullWidth
              required
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={handleChange("email")}
              fullWidth
              required
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={handleChange("phone")}
              fullWidth
              required
            />
            <TextField
              label="Address"
              value={form.address}
              onChange={handleChange("address")}
              fullWidth
              required
              multiline
              rows={2}
            />
            <Grid container spacing={2} mt={2} mb={1}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Primary Color"
                  type="color"
                  value={form.primary_color || "#000000"}
                  onChange={handleChange("primary_color")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Secondary Color"
                  type="color"
                  value={form.secondary_color || "#000000"}
                  onChange={handleChange("secondary_color")}
                />
              </Grid>
            </Grid>

            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
            >
              {logoFile ? logoFile.name : "Upload Logo"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </Button>

            <SignaturePad
              onChange={setSignatureData}
              existingUrl={existingSignatureUrl}
            />

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
