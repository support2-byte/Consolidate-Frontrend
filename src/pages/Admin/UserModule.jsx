import { useState, useEffect, useCallback } from "react";
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
  Grid,
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

function buildRoleMap(rolePermissions) {
  const map = {};
  for (const row of rolePermissions) {
    if (!map[row.module_code]) map[row.module_code] = [];
    map[row.module_code].push(row.action_code);
  }
  return map;
}

function buildOverrideMap(overrides) {
  const map = {};
  for (const row of overrides) {
    if (!map[row.module_code]) map[row.module_code] = {};
    map[row.module_code][row.action_code] = row.granted;
  }
  return map;
}

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
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formPassword, setFormPassword] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [roleMap, setRoleMap] = useState({});
  const [overrides, setOverrides] = useState({});
  const [catalogModules, setCatalogModules] = useState([]);
  const [catalogActions, setCatalogActions] = useState([]);
  const [permLoading, setPermLoading] = useState(false);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [viewRoleMap, setViewRoleMap] = useState({});
  const [viewOverrideMap, setViewOverrideMap] = useState({});
  const [viewRoleName, setViewRoleName] = useState("—");
  const [viewLoading, setViewLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnack = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const fetchUsers = useCallback(async () => {
    if (!can("users", "view")) return;
    setTableLoading(true);
    try {
      const res = await api.get("/auth/users", {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm.trim() || undefined,
          roleId: roleFilter || undefined,
          active: activeFilter || undefined,
        },
      });
      if (res.data?.success) {
        setUsers(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch {
      showSnack("Could not load users", "error");
    } finally {
      setTableLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, roleFilter, activeFilter, can]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get("/auth/roles");
      if (res.data?.success) setAvailableRoles(res.data.data || []);
    } catch (err) {
      const status = err.response?.status;
      if (status !== 403) {
        showSnack("Could not load roles", "warning");
      }
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await api.get("/auth/rbac/permissions");
      if (res.data?.success) {
        setCatalogModules(res.data.data?.modules || []);
        setCatalogActions(res.data.data?.actions || []);
      }
    } catch {
      showSnack("Failed to load permission catalog", "warning");
    }
  }, []);

  const fetchUserPermissions = useCallback(async (userId) => {
    setPermLoading(true);
    try {
      const res = await api.get(`/auth/users/${userId}/permissions`);
      if (res.data?.success) {
        setRoleMap(buildRoleMap(res.data.data?.rolePermissions || []));
        setOverrides(buildOverrideMap(res.data.data?.overrides || []));
      }
    } catch {
      showSnack("Failed to load permissions", "error");
    } finally {
      setPermLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (dialogOpen && currentUser && isAdmin() && tabValue === 1) {
      if (catalogModules.length === 0) fetchCatalog();
      fetchUserPermissions(currentUser.id);
    }
  }, [
    dialogOpen,
    currentUser,
    tabValue,
    isAdmin,
    catalogModules.length,
    fetchCatalog,
    fetchUserPermissions,
  ]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (currentUser) {
      setFormName(currentUser.name || "");
      setFormEmail(currentUser.email || "");
      setFormRole(currentUser.role_id || "");
      setFormActive(currentUser.active ?? true);
      setFormPassword("");
    } else {
      const defaultRole = availableRoles.find((r) => r.name === "viewer");
      setFormName("");
      setFormEmail("");
      setFormRole(defaultRole?.id || "");
      setFormActive(true);
      setFormPassword("");
    }
  }, [dialogOpen, currentUser, availableRoles]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setPage(0);
    }, 500),
    [],
  );

  const handleSort = (property) => {
    setOrder(orderBy === property && order === "asc" ? "desc" : "asc");
    setOrderBy(property);
    setPage(0);
  };

  const toggleActive = async (user) => {
    if (!can("users", "edit")) return showSnack("No permission", "warning");

    const newActive = !user.active;
    setActionLoading((prev) => ({ ...prev, [user.id]: true }));
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, active: newActive } : u)),
    );

    try {
      await api.put(`/auth/users/${user.id}`, { active: newActive });
      showSnack(
        `${user.name || user.email} ${newActive ? "activated" : "deactivated"}`,
      );
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !newActive } : u)),
      );
      showSnack("Failed to update status", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  const handleDelete = (user) => {
    if (!can("users", "delete")) return showSnack("No permission", "warning");
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/auth/users/${userToDelete.id}`);
      showSnack("User deleted");
      fetchUsers();
    } catch {
      showSnack("Failed to delete user", "error");
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user && !can("users", "edit"))
      return showSnack("No edit permission", "warning");
    if (!user && !can("users", "create"))
      return showSnack("No create permission", "warning");
    setCurrentUser(user);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentUser(null);
    setTabValue(0);
    setRoleMap({});
    setOverrides({});
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (!formName.trim()) return showSnack("Name required", "error");
    if (!formEmail.includes("@"))
      return showSnack("Valid email required", "error");
    if (!currentUser && formPassword.length < 8)
      return showSnack("Password min 8 chars", "error");

    setFormSubmitting(true);

    const payload = {
      name: formName.trim(),
      email: formEmail.trim(),
      roleId: formRole,
      active: formActive,
    };

    if (!currentUser) payload.password = formPassword;

    try {
      if (currentUser) {
        await api.put(`/auth/users/${currentUser.id}`, payload);
        showSnack("User updated");
      } else {
        await api.post("/auth/users", payload);
        showSnack("User created");
      }
      fetchUsers();
      handleCloseDialog();
    } catch (err) {
      const code = err.response?.data?.error;
      showSnack(
        code === "EMAIL_TAKEN" ? "Email already in use" : "Failed to save user",
        "error",
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePermissionToggle = async (mod, action, newGranted) => {
    if (!currentUser?.id) return;

    const prev = { ...overrides };
    setOverrides((p) => ({
      ...p,
      [mod.code]: { ...p[mod.code], [action.code]: newGranted },
    }));

    try {
      await api.put(`/auth/users/${currentUser.id}/permissions`, {
        moduleId: mod.id,
        actionId: action.id,
        granted: newGranted,
      });
      showSnack(
        `"${action.code}" on "${mod.code}" ${newGranted ? "granted" : "revoked"}`,
      );
    } catch {
      setOverrides(prev);
      showSnack(`Failed to update "${action.code}" on "${mod.code}"`, "error");
    }
  };

  const handleViewPermissions = async (user) => {
    setViewUser(user);
    setViewDialogOpen(true);
    setViewLoading(true);
    try {
      const res = await api.get(`/auth/users/${user.id}/permissions`);
      if (res.data?.success) {
        setViewRoleMap(buildRoleMap(res.data.data?.rolePermissions || []));
        setViewOverrideMap(buildOverrideMap(res.data.data?.overrides || []));
        setViewRoleName(res.data.data?.roleName || "—");
      }
    } catch {
      showSnack("Failed to load permissions", "error");
    } finally {
      setViewLoading(false);
    }
  };

  const effectivePermCount = Object.values(viewRoleMap).reduce(
    (acc, acts) => acc + acts.length,
    0,
  );

  const overrideCount = Object.values(viewOverrideMap).reduce(
    (acc, obj) => acc + Object.keys(obj).length,
    0,
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Card elevation={4} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{ mb: 4 }}
          >
            <Typography variant="h5" fontWeight={600}>
              User Management
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              flexWrap="wrap"
            >
              <TextField
                size="small"
                placeholder="Search..."
                onChange={(e) => debouncedSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: "action.active", mr: 1 }} />
                  ),
                }}
                sx={{ width: { xs: "100%", sm: 280 } }}
              />

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(0);
                  }}
                >
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
                <Select
                  value={activeFilter}
                  label="Status"
                  onChange={(e) => {
                    setActiveFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>

              {can("users", "create") && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add User
                </Button>
              )}
            </Stack>
          </Stack>

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
                      <TableCell sx={{ color: "white" }} align="center">
                        Status
                      </TableCell>
                      <TableCell sx={{ color: "white" }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            {(user.name || user.email)?.charAt(0) || (
                              <PersonIcon />
                            )}
                          </Avatar>
                        </TableCell>
                        <TableCell>{user.name || "—"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              user.role_name
                                ? user.role_name.charAt(0).toUpperCase() +
                                  user.role_name.slice(1)
                                : "—"
                            }
                            color="primary"
                            size="small"
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
                            <IconButton
                              onClick={() => handleViewPermissions(user)}
                            >
                              <VisibilityIcon
                                fontSize="small"
                                color="primary"
                              />
                            </IconButton>
                          </Tooltip>
                          {can("users", "edit") && (
                            <Tooltip title="Edit">
                              <IconButton
                                onClick={() => handleOpenDialog(user)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {can("users", "edit") && (
                            <Tooltip
                              title={user.active ? "Deactivate" : "Activate"}
                            >
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
                              <IconButton
                                color="error"
                                onClick={() => handleDelete(user)}
                              >
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
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Paper>
          )}
        </CardContent>
      </Card>

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
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            centered
            sx={{ bgcolor: "#f5f5f5" }}
          >
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
                <FormControl fullWidth disabled={formSubmitting}>
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
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Custom Overrides & Effective Permissions
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  Toggle permissions below to override the user's role defaults.
                  Changes are saved instantly.
                </Typography>

                {permLoading ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 8 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : catalogModules.length === 0 ? (
                  <Alert severity="info">
                    No modules defined in the system yet.
                  </Alert>
                ) : (
                  <Stack spacing={2}>
                    {catalogModules.map((mod) => {
                      const roleActs = roleMap[mod.code] || [];
                      const overrideMap = overrides[mod.code] || {};

                      const grantedActions = catalogActions.filter((act) => {
                        const ovr = overrideMap[act.code];
                        return ovr !== undefined
                          ? ovr
                          : roleActs.includes(act.code);
                      });

                      const deniedActions = catalogActions.filter(
                        (act) => !grantedActions.includes(act),
                      );

                      return (
                        <Accordion
                          key={mod.id}
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
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight={600}>
                              {mod.name}
                            </Typography>
                          </AccordionSummary>

                          <AccordionDetails sx={{ p: 3 }}>
                            {grantedActions.length > 0 && (
                              <Box sx={{ mb: 3 }}>
                                <Typography
                                  variant="subtitle2"
                                  color="success.main"
                                  gutterBottom
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <CheckIcon fontSize="small" /> Granted
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                  }}
                                >
                                  {grantedActions.map((act) => {
                                    const isOverridden =
                                      overrideMap[act.code] !== undefined;
                                    return (
                                      <FormControlLabel
                                        key={act.id}
                                        control={
                                          <Checkbox
                                            checked={true}
                                            onChange={() =>
                                              handlePermissionToggle(
                                                mod,
                                                act,
                                                false,
                                              )
                                            }
                                            color="success"
                                          />
                                        }
                                        label={
                                          <Box
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 1.5,
                                            }}
                                          >
                                            <Typography fontWeight={500}>
                                              {act.name}
                                            </Typography>
                                            <Chip
                                              size="small"
                                              label={
                                                isOverridden
                                                  ? "Override: YES"
                                                  : "From Role"
                                              }
                                              color={
                                                isOverridden
                                                  ? "success"
                                                  : "default"
                                              }
                                              variant="outlined"
                                            />
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
                                <Typography
                                  variant="subtitle2"
                                  color="error.main"
                                  gutterBottom
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <CancelIcon fontSize="small" /> Denied
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                  }}
                                >
                                  {deniedActions.map((act) => {
                                    const isOverridden =
                                      overrideMap[act.code] !== undefined;
                                    return (
                                      <FormControlLabel
                                        key={act.id}
                                        control={
                                          <Checkbox
                                            checked={false}
                                            onChange={() =>
                                              handlePermissionToggle(
                                                mod,
                                                act,
                                                true,
                                              )
                                            }
                                            color="error"
                                          />
                                        }
                                        label={
                                          <Box
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 1.5,
                                            }}
                                          >
                                            <Typography
                                              fontWeight={500}
                                              color="text.secondary"
                                            >
                                              {act.name}
                                            </Typography>
                                            <Chip
                                              size="small"
                                              label={
                                                isOverridden
                                                  ? "Override: NO"
                                                  : "Denied by Role"
                                              }
                                              color={
                                                isOverridden
                                                  ? "error"
                                                  : "default"
                                              }
                                              variant="outlined"
                                            />
                                          </Box>
                                        }
                                      />
                                    );
                                  })}
                                </Box>
                              </Box>
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
              <Button
                type="submit"
                variant="contained"
                disabled={formSubmitting}
              >
                {formSubmitting
                  ? currentUser
                    ? "Updating..."
                    : "Creating..."
                  : currentUser
                    ? "Update"
                    : "Create"}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, minHeight: "80vh" } }}
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 3 }}>
          <Stack spacing={0.5}>
            <Typography variant="h5" fontWeight={700}>
              User Permissions
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {viewUser?.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {viewUser?.email}
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ p: { xs: 2, md: 3 }, bgcolor: "grey.50" }}
        >
          {viewLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 400,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Role
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {viewRoleName}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Role Permissions
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {effectivePermCount}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Custom Overrides
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {overrideCount}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Role Permissions
                </Typography>
                {Object.keys(viewRoleMap).length === 0 ? (
                  <Typography color="text.secondary">
                    No role permissions assigned.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {Object.entries(viewRoleMap).map(([mod, acts]) => (
                      <Box
                        key={mod}
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", md: "row" },
                          gap: 2,
                          py: 1.5,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          "&:last-child": { borderBottom: "none", pb: 0 },
                        }}
                      >
                        <Typography
                          sx={{
                            minWidth: 180,
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {mod}
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {acts.map((act) => (
                            <Chip
                              key={act}
                              label={act}
                              color="success"
                              size="small"
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Custom Overrides
                </Typography>
                {Object.keys(viewOverrideMap).length === 0 ? (
                  <Typography color="text.secondary">
                    No custom overrides configured.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {Object.entries(viewOverrideMap).map(
                      ([mod, modOverrides]) => (
                        <Box
                          key={mod}
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            gap: 2,
                            py: 1.5,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            "&:last-child": { borderBottom: "none", pb: 0 },
                          }}
                        >
                          <Typography
                            sx={{
                              minWidth: 180,
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          >
                            {mod}
                          </Typography>
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
                          >
                            {Object.entries(modOverrides).map(
                              ([action, granted]) => (
                                <Chip
                                  key={action}
                                  label={action}
                                  color={granted ? "success" : "error"}
                                  variant={granted ? "filled" : "outlined"}
                                  size="small"
                                />
                              ),
                            )}
                          </Box>
                        </Box>
                      ),
                    )}
                  </Stack>
                )}
              </Paper>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            {userToDelete?.name || userToDelete?.email}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
