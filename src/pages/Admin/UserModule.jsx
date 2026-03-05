import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  DialogContentText,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircleOutline as CheckIcon,
  CancelOutlined as CancelIcon,
} from "@mui/icons-material";
import Slide from "@mui/material/Slide";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import debounce from "lodash/debounce";

export default function UsersManagement() {
  const { can, isAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states for edit/add
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formPassword, setFormPassword] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // View Permissions Modal states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [viewRolePermissions, setViewRolePermissions] = useState({});
  const [viewOverrides, setViewOverrides] = useState({});
  const [viewEffective, setViewEffective] = useState({});
  const [viewRoleName, setViewRoleName] = useState("—");
  const [viewLoading, setViewLoading] = useState(false);

  // Permission editor states (when editing)
  const [rolePermissions, setRolePermissions] = useState({});
  const [overrides, setOverrides] = useState({});

  const [catalogModules, setCatalogModules] = useState([]);
  const [catalogActions, setCatalogActions] = useState([]);

  // ────────────────────────────────────────────────────────────────
  // Fetch data
  // ────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    if (!can("users", "view")) return;
    setTableLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        sort: `${orderBy}:${order}`,
        search: searchTerm.trim() || undefined,
        role: roleFilter || undefined,
        active: activeFilter || undefined,
      };
      const res = await api.get("/auth/users", { params });
      if (res.data?.success) {
        setUsers(res.data.users || []);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setSnackbar({ open: true, message: "Could not load users", severity: "error" });
    } finally {
      setTableLoading(false);
    }
  }, [page, rowsPerPage, orderBy, order, searchTerm, roleFilter, activeFilter, can]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get("/auth/roles");
      if (res.data?.success && Array.isArray(res.data.roles)) {
        setAvailableRoles(res.data.roles);
      } else {
        setAvailableRoles([
          { id: 1, name: "admin" },
          { id: 2, name: "manager" },
          { id: 3, name: "staff" },
          { id: 4, name: "viewer" },
        ]);
      }
    } catch (err) {
      console.warn("Failed to load roles:", err);
      setAvailableRoles([
        { id: 1, name: "admin" },
        { id: 2, name: "manager" },
        { id: 3, name: "staff" },
        { id: 4, name: "viewer" },
      ]);
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await api.get("/auth/admin/permissions/all");
      if (res.data?.success) {
        setCatalogModules(res.data.modules || []);
        setCatalogActions(res.data.actions || []);
      }
    } catch (err) {
      console.error("Failed to load catalog:", err);
      setSnackbar({ open: true, message: "Failed to load permission catalog", severity: "warning" });
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchCatalog();
    fetchUsers();
  }, [fetchRoles, fetchCatalog, fetchUsers]);

  const debouncedSearch = useCallback(debounce((value) => {
    setSearchTerm(value);
    setPage(0);
  }, 500), []);

  // ────────────────────────────────────────────────────────────────
  // Load permissions when editing user
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dialogOpen || !currentUser || !isAdmin()) return;
    setTabValue(0);
    setLoading(true);
    api
      .get(`/auth/admin/users/${currentUser.id}/permissions`)
      .then((res) => {
        if (res.data?.success) {
          setRolePermissions(res.data.rolePermissions || {});
          setOverrides(res.data.overrides || {});
        }
      })
      .catch((err) => {
        console.error("Failed to load permissions:", err);
        setSnackbar({ open: true, message: "Failed to load permissions", severity: "error" });
      })
      .finally(() => setLoading(false));
  }, [dialogOpen, currentUser, isAdmin]);

  // ────────────────────────────────────────────────────────────────
  // Form sync for edit/add
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (dialogOpen) {
      if (currentUser) {
        setFormName(currentUser.name || "");
        setFormEmail(currentUser.email || "");

        const selectedRole = availableRoles.find(r => r.name === currentUser.role);
        setFormRole(selectedRole?.id || "");

        setFormActive(currentUser.active ?? true);
        setFormPassword("");
      } else {
        const defaultRole = availableRoles.find(r => r.name === "viewer");
        setFormName("");
        setFormEmail("");
        setFormRole(defaultRole?.id || "");
        setFormActive(true);
        setFormPassword("");
      }
    }
  }, [dialogOpen, currentUser, availableRoles]);

  // ────────────────────────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────────────────────────
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
    setPage(0);
  };

  const handleChangePage = (_, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const toggleActive = async (user) => {
    if (!can("users", "edit")) return setSnackbar({ open: true, message: "No permission", severity: "warning" });

    const newActive = !user.active;
    const userId = user.id;

    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: newActive } : u)));

    try {
      await api.put(`/auth/users/${userId}`, { active: newActive });
      setSnackbar({
        open: true,
        message: `User ${user.name || user.email} ${newActive ? "activated" : "deactivated"}`,
        severity: "success",
      });
    } catch (err) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: !newActive } : u)));
      setSnackbar({ open: true, message: "Failed to update status", severity: "error" });
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDelete = (user) => {
    if (!can("users", "delete")) return setSnackbar({ open: true, message: "No permission", severity: "warning" });
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/auth/users/${userToDelete.id}`);
      setSnackbar({ open: true, message: "User deleted", severity: "success" });
      fetchUsers();
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to delete user", severity: "error" });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user && !can("users", "edit")) return setSnackbar({ open: true, message: "No edit permission", severity: "warning" });
    if (!user && !can("users", "create")) return setSnackbar({ open: true, message: "No create permission", severity: "warning" });

    setCurrentUser(user);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentUser(null);
    setTabValue(0);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (!formName.trim()) return setSnackbar({ open: true, message: "Name required", severity: "error" });
    if (!formEmail.includes("@")) return setSnackbar({ open: true, message: "Valid email required", severity: "error" });
    if (!currentUser && formPassword.length < 8) return setSnackbar({ open: true, message: "Password min 8 chars", severity: "error" });

    setFormSubmitting(true);

    const payload = {
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      active: formActive,
    };

    if (!currentUser) payload.password = formPassword;

    try {
      if (currentUser) {
        await api.put(`/auth/users/${currentUser.id}`, payload);
        setSnackbar({ open: true, message: "User updated", severity: "success" });
      } else {
        await api.post("/auth/users", payload);
        setSnackbar({ open: true, message: "User created", severity: "success" });
      }
      fetchUsers();
      handleCloseDialog();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to save user";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePermissionToggle = async (module, action, newGranted) => {
    if (!currentUser?.id) return;

    const originalOverrides = { ...overrides };
    setOverrides((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: newGranted,
      },
    }));

    try {
      await api.post(`/auth/admin/users/${currentUser.id}/permissions`, {
        module,
        action,
        granted: newGranted,
      });

      const res = await api.get(`/auth/admin/users/${currentUser.id}/permissions`);
      if (res.data?.success) {
        setRolePermissions(res.data.rolePermissions || {});
        setOverrides(res.data.overrides || {});
        setSnackbar({
          open: true,
          message: `Permission "${action}" on "${module}" updated`,
          severity: "success",
        });
      }
    } catch (err) {
      setOverrides(originalOverrides);
      setSnackbar({
        open: true,
        message: `Failed to update "${action}" on "${module}"`,
        severity: "error",
      });
    }
  };

  const handleViewPermissions = async (user) => {
    setViewUser(user);
    setViewDialogOpen(true);
    setViewLoading(true);

    try {
      const res = await api.get(`/auth/admin/users/${user.id}/permissions`);
      if (res.data?.success) {
        setViewRolePermissions(res.data.rolePermissions || {});
        setViewOverrides(res.data.overrides || {});
        setViewEffective(res.data.effective || {});
        setViewRoleName(res.data.role || "unknown");
      }
    } catch (err) {
      console.error("Failed to load view permissions:", err);
      setSnackbar({ open: true, message: "Failed to load permissions", severity: "error" });
    } finally {
      setViewLoading(false);
    }
  };

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Card elevation={4} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={600}>
              User Management
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <TextField
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => debouncedSearch(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ color: "action.active", mr: 1 }} /> }}
                sx={{ width: { xs: "100%", sm: 280 } }}
              />

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Role</InputLabel>
                <Select value={roleFilter} label="Role" onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}>
                  <MenuItem value="">All Roles</MenuItem>
                  {availableRoles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select value={activeFilter} label="Status" onChange={(e) => { setActiveFilter(e.target.value); setPage(0); }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>

              {can("users", "create") && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                  Add User
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Table */}
          {tableLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ py: 10 }}>
              No users found
            </Typography>
          ) : (
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: "primary.dark" }}>
                    <TableRow>
                      <TableCell sx={{ color: "white" }}>User</TableCell>
                      <TableCell sx={{ color: "white" }}>
                        <TableSortLabel
                          active={orderBy === "name"}
                          direction={orderBy === "name" ? order : "asc"}
                          onClick={() => handleSort("name")}
                          sx={{ color: "white !important" }}
                        >
                          Name
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>Email</TableCell>
                      <TableCell sx={{ color: "white" }}>Role</TableCell>
                      <TableCell sx={{ color: "white" }} align="center">Status</TableCell>
                      <TableCell sx={{ color: "white" }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            {(user.name || user.email)?.charAt(0) || <PersonIcon />}
                          </Avatar>
                        </TableCell>
                        <TableCell>{user.name || "—"}</TableCell>
                        <TableCell>{user.email || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              user.role
                                ? typeof user.role === "string"
                                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                                  : user.role
                                : "—"
                            }
                            color="primary"
                            size="small"
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={user.active ? "Active" : "Inactive"}
                            color={user.active ? "success" : "error"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Permissions">
                            <IconButton onClick={() => handleViewPermissions(user)}>
                              <VisibilityIcon fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>
                          {can("users", "edit") && (
                            <Tooltip title="Edit">
                              <IconButton onClick={() => handleOpenDialog(user)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {can("users", "edit") && (
                            <Tooltip title={user.active ? "Deactivate" : "Activate"}>
                              <Checkbox
                                checked={user.active ?? false}
                                onChange={() => toggleActive(user)}
                                disabled={actionLoading[user.id]}
                                size="small"
                                color={user.active ? "success" : "default"}
                              />
                            </Tooltip>
                          )}
                          {can("users", "delete") && (
                            <Tooltip title="Delete">
                              <IconButton color="error" onClick={() => handleDelete(user)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 20, 50]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2 }}>
          {currentUser ? "Edit User" : "Add New User"}
        </DialogTitle>

        {currentUser && isAdmin() && (
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} centered sx={{ bgcolor: "#f5f5f5" }}>
            <Tab label="Basic Info" />
            <Tab label="Permissions" />
          </Tabs>
        )}

        <form onSubmit={handleSaveUser}>
          <DialogContent dividers sx={{ position: "relative", minHeight: 400 }}>
            {formSubmitting && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "rgba(255,255,255,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {tabValue === 0 || !currentUser ? (
              <Stack spacing={3}>
                <TextField
                  autoFocus
                  label="Full Name"
                  fullWidth
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  disabled={formSubmitting}
                />

                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  disabled={formSubmitting}
                />

                <FormControl fullWidth sx={{ mb: 3 }} disabled={formSubmitting}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formRole}
                    label="Role"
                    onChange={(e) => setFormRole(e.target.value)}
                  >
                    {availableRoles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      color="success"
                      disabled={formSubmitting}
                    />
                  }
                  label="Account is active"
                />

                {!currentUser && (
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    helperText="Minimum 8 characters"
                    disabled={formSubmitting}
                  />
                )}
              </Stack>
            ) : (
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  Custom Overrides & Effective Permissions
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Toggle permissions below to override the user's role defaults. Changes are saved instantly.
                </Typography>

                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : catalogModules.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No modules or actions defined in the system yet.
                  </Alert>
                ) : (
                  <Stack spacing={2}>
                    {catalogModules.map((mod) => {
                      const moduleCode = mod;
                      const roleActs = rolePermissions[moduleCode] || [];
                      const overrideMap = overrides[moduleCode] || {};

                      const grantedActions = catalogActions.filter(act => {
                        const hasRole = roleActs.includes(act);
                        const ovr = overrideMap[act];
                        return ovr !== undefined ? ovr : hasRole;
                      });

                      const deniedActions = catalogActions.filter(act => !grantedActions.includes(act));

                      return (
                        <Accordion
                          key={moduleCode}
                          sx={{
                            borderRadius: 2,
                            boxShadow: 1,
                            overflow: "hidden",
                            "&:before": { display: "none" },
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{
                              bgcolor: "grey.100",
                              borderBottom: "1px solid",
                              borderColor: "divider",
                              py: 1.5,
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight={600}>
                              {moduleCode}
                            </Typography>
                          </AccordionSummary>

                          <AccordionDetails sx={{ p: 3 }}>
                            {grantedActions.length > 0 && (
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <CheckIcon fontSize="small" /> Granted Permissions
                                </Typography>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                  {grantedActions.map((act) => {
                                    const hasRoleDefault = roleActs.includes(act);
                                    const overrideValue = overrideMap[act];
                                    const isOverridden = overrideValue !== undefined;

                                    return (
                                      <FormControlLabel
                                        key={act}
                                        control={
                                          <Checkbox
                                            checked={true}
                                            onChange={() => handlePermissionToggle(moduleCode, act, false)}
                                            color="success"
                                            sx={{
                                              color: isOverridden ? "success.main" : "grey.500",
                                              "&.Mui-checked": { color: "success.main" },
                                            }}
                                          />
                                        }
                                        label={
                                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Typography fontWeight={500}>{act}</Typography>
                                            {isOverridden ? (
                                              <Chip
                                                size="small"
                                                label="Override: YES"
                                                color="success"
                                                variant="outlined"
                                              />
                                            ) : (
                                              <Chip
                                                size="small"
                                                label="From Role"
                                                color="default"
                                                variant="outlined"
                                              />
                                            )}
                                          </Box>
                                        }
                                      />
                                    );
                                  })}
                                </Box>
                              </Box>
                            )}

                            {deniedActions.length > 0 && (
                              <Box>
                                <Typography variant="subtitle2" color="error.main" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <CancelIcon fontSize="small" /> Denied Permissions
                                </Typography>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                  {deniedActions.map((act) => {
                                    const hasRoleDefault = roleActs.includes(act);
                                    const overrideValue = overrideMap[act];
                                    const isOverridden = overrideValue !== undefined;

                                    return (
                                      <FormControlLabel
                                        key={act}
                                        control={
                                          <Checkbox
                                            checked={false}
                                            onChange={() => handlePermissionToggle(moduleCode, act, true)}
                                            color="error"
                                            sx={{
                                              color: isOverridden ? "error.main" : "grey.500",
                                              "&.Mui-checked": { color: "error.main" },
                                            }}
                                          />
                                        }
                                        label={
                                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Typography fontWeight={500} color="text.secondary">{act}</Typography>
                                            {isOverridden ? (
                                              <Chip
                                                size="small"
                                                label="Override: NO"
                                                color="error"
                                                variant="outlined"
                                              />
                                            ) : (
                                              <Chip
                                                size="small"
                                                label="Denied by Role"
                                                color="default"
                                                variant="outlined"
                                              />
                                            )}
                                          </Box>
                                        }
                                      />
                                    );
                                  })}
                                </Box>
                              </Box>
                            )}

                            {grantedActions.length === 0 && deniedActions.length === 0 && (
                              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                No actions available for this module
                              </Typography>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseDialog} disabled={formSubmitting}>
              Cancel
            </Button>
            {tabValue === 0 && (
              <Button type="submit" variant="contained" disabled={formSubmitting}>
                {formSubmitting ? (currentUser ? "Updating..." : "Creating...") : currentUser ? "Update" : "Create"}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* View Permissions Modal */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2 }}>
          Permissions for {viewUser?.email || "User"}
        </DialogTitle>

        <DialogContent dividers sx={{ minHeight: 400 }}>
          {viewLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                Role: <strong>{viewRoleName}</strong>
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Role-based Permissions
              </Typography>

              {Object.keys(viewRolePermissions).length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3 }}>
                  No role permissions assigned.
                </Typography>
              ) : (
                <Stack spacing={2} sx={{ mb: 5 }}>
                  {Object.entries(viewRolePermissions).map(([mod, acts]) => (
                    <Accordion key={mod}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">{mod}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {acts.map((act) => (
                            <Chip key={act} label={act} color="success" size="small" />
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              )}

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" gutterBottom>
                Custom Overrides
              </Typography>

              {Object.keys(viewOverrides).length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3 }}>
                  No custom overrides set for this user.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {Object.entries(viewOverrides).map(([mod, ovr]) => (
                    <Box key={mod}>
                      <Typography variant="subtitle1" gutterBottom>
                        {mod}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {Object.entries(ovr).map(([act, granted]) => (
                          <Chip
                            key={act}
                            label={`${act}: ${granted ? "YES" : "NO"}`}
                            color={granted ? "success" : "error"}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" gutterBottom>
                Effective Permissions (What the user actually has)
              </Typography>

              {Object.keys(viewEffective).length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3 }}>
                  No effective permissions (check role and overrides).
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {Object.entries(viewEffective).map(([mod, acts]) => (
                    <Box key={mod}>
                      <Typography variant="subtitle1" gutterBottom>
                        {mod}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {acts.map((act) => (
                          <Chip key={act} label={act} color="primary" size="small" />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {userToDelete?.name || userToDelete?.email}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}