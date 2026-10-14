import React, { useState, useMemo, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  Stack,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Autocomplete,
  Collapse,
  Grow,
  Fade,
  Zoom,
  Grid,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import LayersIcon from "@mui/icons-material/Layers";
import UpdateIcon from "@mui/icons-material/Update";
import TollIcon from "@mui/icons-material/Toll";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";
import { api } from "../../api";
import { AppContext } from "../../context/AppContext";

const categoryColor = (category) => {
  const palette = [
    "primary",
    "secondary",
    "warning",
    "success",
    "info",
    "error",
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++)
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

function descendingComparator(a, b, orderBy) {
  const av = a[orderBy];
  const bv = b[orderBy];
  if (typeof av === "number" && typeof bv === "number") return bv - av;
  return String(bv ?? "").localeCompare(String(av ?? ""), undefined, {
    numeric: true,
  });
}

const emptyNewVar = {
  key: "",
  label: "",
  value: 0,
  unit: "",
  category: "",
  description: "",
};

export default function SystemRatesPage() {
  const {
    systemSettings: settings,
    setSystemSettings: setSettings,
    systemSettingsLoading: loading,
  } = useContext(AppContext);

  const [dirty, setDirty] = useState({});
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("label");
  const [collapsed, setCollapsed] = useState({});
  const [newVar, setNewVar] = useState(emptyNewVar);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const handleChange = (id, value) => setDirty((d) => ({ ...d, [id]: value }));
  const hasChanges = Object.keys(dirty).length > 0;

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const toggleCollapsed = (cat) =>
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));

  const categories = useMemo(() => {
    return Array.from(new Set(settings.map((s) => s.category)))
      .filter(Boolean)
      .sort();
  }, [settings]);

  const grouped = useMemo(() => {
    const merged = settings.map((s) => ({
      ...s,
      value: dirty[s.id] !== undefined ? dirty[s.id] : s.value,
      _edited: dirty[s.id] !== undefined,
    }));

    const filtered = search
      ? merged.filter(
          (s) =>
            s.label.toLowerCase().includes(search.toLowerCase()) ||
            s.key.toLowerCase().includes(search.toLowerCase()),
        )
      : merged;

    const map = {};
    filtered.forEach((s) => {
      const cat = s.category || "uncategorized";
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });

    Object.keys(map).forEach((cat) => {
      map[cat].sort((a, b) =>
        order === "desc"
          ? descendingComparator(a, b, orderBy)
          : -descendingComparator(a, b, orderBy),
      );
    });

    return map;
  }, [settings, dirty, search, order, orderBy]);

  const handleSaveAll = async () => {
    const payload = Object.entries(dirty).map(([id, value]) => ({
      id: Number(id),
      value,
    }));
    setSaving(true);
    try {
      const { data } = await api.put("/api/options/system-settings", {
        settings: payload,
      });
      const updatedMap = new Map(data.data.map((row) => [row.id, row]));
      setSettings((prev) => prev.map((s) => updatedMap.get(s.id) ?? s));
      setDirty({});
      toast.success(data.message || "Settings updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariable = async () => {
    try {
      const { data } = await api.post("/api/options/system-settings", newVar);
      setSettings((prev) => [...prev, data.data]);
      setAddOpen(false);
      setNewVar(emptyNewVar);
      toast.success(data.message || "New variable added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add variable");
    }
  };

  const openEdit = (row) => {
    setEditRow({ ...row });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const { data } = await api.put("/api/options/system-settings", {
        settings: [
          {
            id: editRow.id,
            label: editRow.label,
            value: editRow.value,
            unit: editRow.unit,
            category: editRow.category,
            description: editRow.description,
          },
        ],
      });
      const updatedMap = new Map(data.data.map((row) => [row.id, row]));
      setSettings((prev) => prev.map((s) => updatedMap.get(s.id) ?? s));
      setDirty((d) => {
        const { [editRow.id]: _, ...rest } = d;
        return rest;
      });
      setEditOpen(false);
      setEditRow(null);
      toast.success(data.message || "Variable updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update variable");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this variable? This cannot be undone.")) return;
    try {
      const { data } = await api.delete(`/api/options/system-settings/${id}`);
      setSettings((prev) => prev.filter((s) => s.id !== id));
      setDirty((d) => {
        const { [id]: _, ...rest } = d;
        return rest;
      });
      toast.success(data.message || "Variable removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove variable");
    }
  };

  const lastUpdated = useMemo(() => {
    if (!settings.length) return "—";
    const latest = settings.reduce((max, s) =>
      new Date(s.updated_at) > new Date(max.updated_at) ? s : max,
    );
    return new Date(latest.updated_at).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [settings]);

  const columns = [
    { id: "label", label: "Variable" },
    { id: "value", label: "Value" },
    { id: "updated_at", label: "Updated" },
    { id: "actions", label: "", sortable: false },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      <Box
        sx={{
          borderRadius: 4,
          p: { xs: 3, md: 4 },
          mb: 3,
          background: "#0d6c6a",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ bgcolor: "#e07b2a" }}>
                <TuneIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  System Variables
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  Rates, distances, durations, taxes, any global variable used
                  across Consolidate.
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddOpen(true)}
            sx={{
              bgcolor: "#fff",
              color: "#0f172a",
              fontWeight: 700,
              "&:hover": { bgcolor: "#e2e8f0" },
            }}
          >
            Add Variable
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          sx={{ mt: 3, position: "relative", zIndex: 1 }}
        >
          {[
            {
              icon: <LayersIcon fontSize="small" />,
              label: "Variables",
              value: settings.length,
            },
            {
              icon: <TollIcon fontSize="small" />,
              label: "Categories",
              value: categories.length,
            },
            {
              icon: <UpdateIcon fontSize="small" />,
              label: "Last Updated",
              value: lastUpdated,
            },
          ].map((stat) => (
            <Box
              key={stat.label}
              sx={{
                bgcolor: "rgba(255,255,255,0.08)",
                borderRadius: 3,
                px: 2,
                py: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
                minWidth: 140,
              }}
            >
              {stat.icon}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.7, lineHeight: 1 }}
                >
                  {stat.label}
                </Typography>
                <Typography variant="subtitle2" fontWeight={700}>
                  {stat.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      <TextField
        placeholder="Search variables by name or key..."
        size="small"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, maxWidth: 380 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="disabled" />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Stack spacing={3}>
          {[1, 2].map((i) => (
            <Paper key={i} variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
              <Skeleton width={160} height={28} sx={{ mb: 2 }} />
              {[1, 2].map((j) => (
                <Skeleton key={j} height={56} />
              ))}
            </Paper>
          ))}
        </Stack>
      ) : Object.keys(grouped).length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ borderRadius: 3, p: 5, textAlign: "center" }}
        >
          <TollIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">
            {search
              ? "No variables match your search."
              : "No variables configured yet."}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ pb: hasChanges ? 10 : 2 }}>
          {Object.keys(grouped)
            .sort()
            .map((cat) => {
              const rows = grouped[cat];
              const isCollapsed = !!collapsed[cat];
              return (
                <Grid size={{ md: 6, xs: 12 }}>
                  <Paper
                    key={cat}
                    variant="outlined"
                    sx={{ borderRadius: 3, overflow: "hidden" }}
                  >
                    <Box
                      onClick={() => toggleCollapsed(cat)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 3,
                        py: 2,
                        bgcolor: "action.hover",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Chip
                          label={cat}
                          size="small"
                          color={categoryColor(cat)}
                          sx={{ textTransform: "capitalize", fontWeight: 700 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {rows.length} variable{rows.length !== 1 ? "s" : ""}
                        </Typography>
                      </Stack>
                      <IconButton size="small">
                        {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                      </IconButton>
                    </Box>

                    <Collapse in={!isCollapsed}>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              {columns.map((col) => (
                                <TableCell key={col.id}>
                                  {col.sortable === false ? (
                                    col.label
                                  ) : (
                                    <TableSortLabel
                                      active={orderBy === col.id}
                                      direction={
                                        orderBy === col.id ? order : "asc"
                                      }
                                      onClick={() => handleSort(col.id)}
                                    >
                                      <Typography
                                        variant="caption"
                                        fontWeight={700}
                                      >
                                        {col.label.toUpperCase()}
                                      </Typography>
                                    </TableSortLabel>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rows.map((s) => (
                              <Grow in key={s.id} timeout={250}>
                                <TableRow
                                  hover
                                  sx={{
                                    transition: "background-color 0.2s",
                                    bgcolor: s._edited
                                      ? "warning.50"
                                      : "inherit",
                                  }}
                                >
                                  <TableCell>
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        fontWeight={600}
                                      >
                                        {s.label}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontFamily: "monospace" }}
                                      >
                                        {s.key}
                                      </Typography>
                                    </Box>
                                  </TableCell>

                                  <TableCell>
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={dirty[s.id] ?? s.value}
                                      onChange={(e) =>
                                        handleChange(s.id, e.target.value)
                                      }
                                      sx={{ width: 140 }}
                                      InputProps={{
                                        endAdornment: s.unit ? (
                                          <InputAdornment position="end">
                                            {s.unit}
                                          </InputAdornment>
                                        ) : null,
                                      }}
                                    />
                                  </TableCell>

                                  <TableCell>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {s.updated_at
                                        ? new Date(
                                            s.updated_at,
                                          ).toLocaleDateString(undefined, {
                                            month: "short",
                                            year: "numeric",
                                            day: "numeric",
                                          })
                                        : "—"}
                                    </Typography>
                                  </TableCell>

                                  <TableCell align="right">
                                    <Tooltip title="Edit this variable">
                                      <IconButton
                                        size="small"
                                        onClick={() => openEdit(s)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remove this variable">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(s.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              </Grow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Collapse>
                  </Paper>
                </Grid>
              );
            })}
        </Grid>
      )}

      <Fade in={hasChanges}>
        <Box
          sx={{
            position: "sticky",
            bottom: 16,
            mt: 2,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Paper
            elevation={6}
            sx={{
              borderRadius: 99,
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: "grey.900",
              color: "#fff",
            }}
          >
            <Typography variant="body2">
              {Object.keys(dirty).length} unsaved change
              {Object.keys(dirty).length > 1 ? "s" : ""}
            </Typography>
            <Button
              size="small"
              onClick={() => setDirty({})}
              sx={{ color: "grey.300" }}
            >
              Discard
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
              onClick={handleSaveAll}
              sx={{ borderRadius: 99 }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </Paper>
        </Box>
      </Fade>

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        fullWidth
        maxWidth="xs"
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          Add New Variable
          <IconButton size="small" onClick={() => setAddOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              freeSolo
              options={categories}
              value={newVar.category}
              onInputChange={(_, val) =>
                setNewVar((v) => ({ ...v, category: val }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  placeholder="e.g. rates, pickup_zone, tax..."
                  helperText="Pick an existing category or type a new one — it becomes its own section"
                />
              )}
            />
            <TextField
              label="Key (unique, snake_case)"
              value={newVar.key}
              onChange={(e) =>
                setNewVar((v) => ({ ...v, key: e.target.value.trim() }))
              }
              placeholder="e.g. customs_clearance_rate, dubai, vat_percentage"
              fullWidth
            />
            <TextField
              label="Display Label"
              value={newVar.label}
              onChange={(e) =>
                setNewVar((v) => ({ ...v, label: e.target.value }))
              }
              placeholder="e.g. VAT Percentage"
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Initial Value"
                type="number"
                value={newVar.value}
                onChange={(e) =>
                  setNewVar((v) => ({ ...v, value: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Unit"
                value={newVar.unit}
                onChange={(e) =>
                  setNewVar((v) => ({ ...v, unit: e.target.value }))
                }
                placeholder="USD, km, hrs, %"
                fullWidth
              />
            </Stack>
            <TextField
              label="Description (optional)"
              value={newVar.description}
              onChange={(e) =>
                setNewVar((v) => ({ ...v, description: e.target.value }))
              }
              multiline
              rows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!newVar.key || !newVar.label || !newVar.category}
            onClick={handleAddVariable}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      {editRow && (
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          fullWidth
          maxWidth="xs"
          TransitionComponent={Zoom}
        >
          <DialogTitle
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            Edit Variable
            <IconButton size="small" onClick={() => setEditOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Key"
                value={editRow.key}
                fullWidth
                disabled
                helperText="Key can't be changed after creation"
              />
              <Autocomplete
                freeSolo
                options={categories}
                value={editRow.category}
                onInputChange={(_, val) =>
                  setEditRow((v) => ({ ...v, category: val }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    placeholder="e.g. rates, pickup_zone, tax..."
                  />
                )}
              />
              <TextField
                label="Display Label"
                value={editRow.label}
                onChange={(e) =>
                  setEditRow((v) => ({ ...v, label: e.target.value }))
                }
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Value"
                  type="number"
                  value={editRow.value}
                  onChange={(e) =>
                    setEditRow((v) => ({ ...v, value: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label="Unit"
                  value={editRow.unit || ""}
                  onChange={(e) =>
                    setEditRow((v) => ({ ...v, unit: e.target.value }))
                  }
                  placeholder="USD, km, hrs, %"
                  fullWidth
                />
              </Stack>
              <TextField
                label="Description"
                value={editRow.description || ""}
                onChange={(e) =>
                  setEditRow((v) => ({ ...v, description: e.target.value }))
                }
                multiline
                rows={2}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!editRow.label || !editRow.category}
              onClick={handleSaveEdit}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
