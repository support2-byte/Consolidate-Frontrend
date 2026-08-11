import { useReducer, useEffect, useCallback } from "react";
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
  CircularProgress,
  Tabs,
  Tab,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  Alert,
  Badge,
  InputAdornment,
  alpha,
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
  Refresh as RefreshIcon,
  Shield as ShieldIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  VerifiedUser as VerifiedIcon,
} from "@mui/icons-material";
import Slide from "@mui/material/Slide";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import debounce from "lodash/debounce";

// ─── helpers ────────────────────────────────────────────────────────────────
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

// ─── reducer ────────────────────────────────────────────────────────────────
const initialState = {
  // table
  users: [],
  total: 0,
  page: 0,
  rowsPerPage: 10,
  orderBy: "name",
  order: "asc",
  searchTerm: "",
  roleFilter: "",
  activeFilter: "",
  availableRoles: [],
  tableLoading: false,
  actionLoading: {},

  // edit / create dialog
  dialogOpen: false,
  currentUser: null,
  tabValue: 0,
  formName: "",
  formEmail: "",
  formRole: "",
  formActive: true,
  formPassword: "",
  formSubmitting: false,
  resetPwdValue: "",
  resetPwdSubmitting: false,

  // permissions
  roleMap: {},
  overrides: {},
  catalogModules: [],
  catalogActions: [],
  permLoading: false,

  // view dialog
  viewDialogOpen: false,
  viewUser: null,
  viewRoleMap: {},
  viewOverrideMap: {},
  viewRoleName: "—",
  viewLoading: false,

  // delete dialog
  deleteDialogOpen: false,
  userToDelete: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET":
      return { ...state, ...action.payload };
    case "SET_ACTION_LOADING":
      return {
        ...state,
        actionLoading: { ...state.actionLoading, [action.id]: action.value },
      };
    case "OPTIMISTIC_TOGGLE": {
      const users = state.users.map((u) =>
        u.id === action.id ? { ...u, active: action.active } : u,
      );
      return { ...state, users };
    }
    case "REVERT_TOGGLE": {
      const users = state.users.map((u) =>
        u.id === action.id ? { ...u, active: !action.active } : u,
      );
      return { ...state, users };
    }
    case "SET_OVERRIDE":
      return {
        ...state,
        overrides: {
          ...state.overrides,
          [action.mod]: {
            ...(state.overrides[action.mod] || {}),
            [action.action]: action.granted,
          },
        },
      };
    case "CLOSE_DIALOG":
      return {
        ...state,
        dialogOpen: false,
        currentUser: null,
        tabValue: 0,
        roleMap: {},
        overrides: {},
        resetPwdValue: "",
        formName: "",
        formEmail: "",
        formRole: "",
        formActive: true,
        formPassword: "",
      };
    case "OPEN_DIALOG": {
      const user = action.user;
      const defaultRole = state.availableRoles.find((r) => r.name === "viewer");
      return {
        ...state,
        dialogOpen: true,
        currentUser: user || null,
        tabValue: 0,
        formName: user?.name || "",
        formEmail: user?.email || "",
        formRole: user?.role_id || defaultRole?.id || "",
        formActive: user?.active ?? true,
        formPassword: "",
        resetPwdValue: "",
      };
    }
    default:
      return state;
  }
}

function StatCard({ icon, label, value, color }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette[color]?.light || theme.palette.primary.light, 0.12)} 0%, ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.04)} 100%)`,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 45,
          height: 45,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: (theme) =>
            alpha(
              theme.palette[color]?.main || theme.palette.primary.main,
              0.15,
            ),
          color: `${color}.main`,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6">
          {value} {label}
        </Typography>
      </Box>
    </Paper>
  );
}

const ROLE_COLOR = {
  "super admin": "success",
  admin: "warning",
  manager: "error",
  staff: "info",
  viewer: "default",
  user: "default",
};

export default function UsersManagement() {
  const { can, isAdmin, isSuperAdmin } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const set = (payload) => dispatch({ type: "SET", payload });

  const fetchUsers = useCallback(async () => {
    if (!can("users", "view")) return;
    set({ tableLoading: true });
    try {
      const res = await api.get("/auth/users", {
        params: {
          page: state.page + 1,
          limit: state.rowsPerPage,
          search: state.searchTerm.trim() || undefined,
          roleId: state.roleFilter || undefined,
          active: state.activeFilter || undefined,
        },
      });
      if (res.data?.success) {
        set({
          users: res.data.data || [],
          total: res.data.pagination?.total || 0,
        });
      }
    } catch {
      toast.error("Could not load users");
    } finally {
      set({ tableLoading: false });
    }
  }, [
    state.page,
    state.rowsPerPage,
    state.searchTerm,
    state.roleFilter,
    state.activeFilter,
    can,
  ]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get("/auth/roles");
      if (res.data?.success) set({ availableRoles: res.data.data || [] });
    } catch (err) {
      if (err.response?.status !== 403) toast.warn("Could not load roles");
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await api.get("/auth/rbac/permissions");
      if (res.data?.success) {
        set({
          catalogModules: res.data.data?.modules || [],
          catalogActions: res.data.data?.actions || [],
        });
      }
    } catch {
      toast.warn("Failed to load permission catalog");
    }
  }, []);

  const fetchUserPermissions = useCallback(async (userId) => {
    set({ permLoading: true });
    try {
      const res = await api.get(`/auth/users/${userId}/permissions`);
      if (res.data?.success) {
        set({
          roleMap: buildRoleMap(res.data.data?.rolePermissions || []),
          overrides: buildOverrideMap(res.data.data?.overrides || []),
        });
      }
    } catch {
      toast.error("Failed to load permissions");
    } finally {
      set({ permLoading: false });
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (
      state.dialogOpen &&
      state.currentUser &&
      (isAdmin() || isSuperAdmin()) &&
      state.tabValue === 1
    ) {
      if (state.catalogModules.length === 0) fetchCatalog();
      fetchUserPermissions(state.currentUser.id);
    }
  }, [
    state.dialogOpen,
    state.currentUser,
    state.tabValue,
    isAdmin,
    state.catalogModules.length,
    fetchCatalog,
    fetchUserPermissions,
  ]);

  const debouncedSearch = useCallback(
    debounce((value) => set({ searchTerm: value, page: 0 }), 500),
    [],
  );
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const toggleActive = async (user) => {
    if (!can("users", "edit")) return toast.warn("No permission");
    const newActive = !user.active;
    dispatch({ type: "SET_ACTION_LOADING", id: user.id, value: true });
    dispatch({ type: "OPTIMISTIC_TOGGLE", id: user.id, active: newActive });
    try {
      await api.put(`/auth/users/${user.id}`, { active: newActive });
      toast.success(
        `${user.name || user.email} ${newActive ? "activated" : "deactivated"}`,
      );
    } catch {
      dispatch({ type: "REVERT_TOGGLE", id: user.id, active: newActive });
      toast.error("Failed to update status");
    } finally {
      dispatch({ type: "SET_ACTION_LOADING", id: user.id, value: false });
    }
  };

  const handleDelete = (user) => {
    if (!isSuperAdmin()) return toast.warn("Only Super Admin can delete users");
    set({ userToDelete: user, deleteDialogOpen: true });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/auth/users/${state.userToDelete.id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      set({ deleteDialogOpen: false, userToDelete: null });
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user && !can("users", "edit")) return toast.warn("No edit permission");
    if (!user && !can("users", "create"))
      return toast.warn("No create permission");
    dispatch({ type: "OPEN_DIALOG", user });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!state.formName.trim()) return toast.error("Name required");
    if (!state.formEmail.includes("@"))
      return toast.error("Valid email required");
    if (!state.currentUser && state.formPassword.length < 8)
      return toast.error("Password must be at least 8 characters");

    set({ formSubmitting: true });
    const payload = {
      name: state.formName.trim(),
      email: state.formEmail.trim(),
      roleId: state.formRole,
      active: state.formActive,
    };
    if (!state.currentUser) payload.password = state.formPassword;

    try {
      if (state.currentUser) {
        await api.put(`/auth/users/${state.currentUser.id}`, payload);
        toast.success("User updated");
      } else {
        await api.post("/auth/users", payload);
        toast.success("User created");
      }
      fetchUsers();
      dispatch({ type: "CLOSE_DIALOG" });
    } catch (err) {
      const code = err.response?.data?.error;
      toast.error(
        code === "EMAIL_TAKEN" ? "Email already in use" : "Failed to save user",
      );
    } finally {
      set({ formSubmitting: false });
    }
  };

  const submitResetPassword = async () => {
    if (!state.currentUser?.id) return;
    if (state.resetPwdValue.length < 8)
      return toast.error("Password must be at least 8 characters");
    set({ resetPwdSubmitting: true });
    try {
      await api.put(`/auth/reset-password/${state.currentUser.id}`, {
        newPassword: state.resetPwdValue,
      });
      toast.success(`Password reset for ${state.currentUser.email}`);
      set({ resetPwdValue: "" });
    } catch {
      toast.error("Failed to reset password");
    } finally {
      set({ resetPwdSubmitting: false });
    }
  };

  const handlePermissionToggle = async (mod, action, newGranted) => {
    if (!state.currentUser?.id) return;
    const prevOverrides = { ...state.overrides };
    dispatch({
      type: "SET_OVERRIDE",
      mod: mod.code,
      action: action.code,
      granted: newGranted,
    });
    try {
      await api.put(`/auth/users/${state.currentUser.id}/permissions`, {
        moduleId: mod.id,
        actionId: action.id,
        granted: newGranted,
      });
      toast.success(
        `"${action.code}" on "${mod.code}" ${newGranted ? "granted" : "revoked"}`,
      );
    } catch {
      set({ overrides: prevOverrides });
      toast.error(`Failed to update "${action.code}" on "${mod.code}"`);
    }
  };

  const handleViewPermissions = async (user) => {
    set({ viewUser: user, viewDialogOpen: true, viewLoading: true });
    try {
      const res = await api.get(`/auth/users/${user.id}/permissions`);
      if (res.data?.success) {
        set({
          viewRoleMap: buildRoleMap(res.data.data?.rolePermissions || []),
          viewOverrideMap: buildOverrideMap(res.data.data?.overrides || []),
          viewRoleName: res.data.data?.roleName || "—",
        });
      }
    } catch {
      toast.error("Failed to load permissions");
    } finally {
      set({ viewLoading: false });
    }
  };

  const effectivePermCount = Object.values(state.viewRoleMap).reduce(
    (acc, acts) => acc + acts.length,
    0,
  );
  const overrideCount = Object.values(state.viewOverrideMap).reduce(
    (acc, obj) => acc + Object.keys(obj).length,
    0,
  );
  const activeCount = state.users.filter((u) => u.active).length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "grey.50", minHeight: "100vh" }}>
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h4" fontWeight="bold" color="#f58220">
              User Management
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage accounts, roles and permissions across the platform
          </Typography>
        </Box>
        {can("users", "create") && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              px: 2.5,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
          >
            Add User
          </Button>
        )}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<GroupIcon fontSize="small" />}
            label="Total Users"
            value={state.total}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<VerifiedIcon fontSize="small" />}
            label="Active"
            value={activeCount}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<AdminIcon fontSize="small" />}
            label="Roles"
            value={state.availableRoles.length}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<ShieldIcon fontSize="small" />}
            label="Inactive"
            value={state.total - activeCount}
            color="error"
          />
        </Grid>
      </Grid>
      <Box
        sx={{
          my: 2,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
          flexWrap="wrap"
        >
          <TextField
            size="small"
            placeholder="Search users…"
            onChange={(e) => debouncedSearch(e.target.value)}
            sx={{
              width: { xs: "100%", sm: 260 },
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.disabled", fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl
            size="small"
            sx={{
              minWidth: 130,
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
            }}
          >
            <InputLabel>Role</InputLabel>
            <Select
              value={state.roleFilter}
              label="Role"
              onChange={(e) => set({ roleFilter: e.target.value, page: 0 })}
            >
              <MenuItem value="">All Roles</MenuItem>
              {state.availableRoles.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{
              minWidth: 130,
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
            }}
          >
            <InputLabel>Status</InputLabel>
            <Select
              value={state.activeFilter}
              label="Status"
              onChange={(e) => set({ activeFilter: e.target.value, page: 0 })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ ml: "auto" }}>
            <Tooltip title="Refresh">
              <span>
                <IconButton
                  onClick={fetchUsers}
                  disabled={state.tableLoading}
                  size="small"
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <RefreshIcon
                    fontSize="small"
                    sx={
                      state.tableLoading
                        ? {
                            animation: "spin 1s linear infinite",
                            "@keyframes spin": {
                              from: { transform: "rotate(0deg)" },
                              to: { transform: "rotate(360deg)" },
                            },
                          }
                        : undefined
                    }
                  />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Stack>
      </Box>
      <Card
        elevation={0}
        sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {state.tableLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
              <CircularProgress />
            </Box>
          ) : state.users.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 12 }}>
              <GroupIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary" fontWeight={500}>
                No users found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Try adjusting your search or filters
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, width: 56 }} />
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {state.users.map((user) => (
                      <TableRow
                        key={user.id}
                        hover
                        sx={{
                          "&:last-child td": { border: 0 },
                          transition: "background 0.15s",
                        }}
                      >
                        <TableCell>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: "primary.main",
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {(user.name || user.email)
                              ?.charAt(0)
                              .toUpperCase() || <PersonIcon fontSize="small" />}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {user.name || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              user.role_name
                                ? user.role_name.charAt(0).toUpperCase() +
                                  user.role_name.slice(1)
                                : "—"
                            }
                            color={
                              ROLE_COLOR[user.role_name?.toLowerCase()] ||
                              "default"
                            }
                            size="small"
                            sx={{ fontWeight: 600, borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={user.active ? "Active" : "Inactive"}
                            color={user.active ? "success" : "default"}
                            size="small"
                            variant={user.active ? "filled" : "outlined"}
                            sx={{ fontWeight: 600, borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                            alignItems="center"
                          >
                            <Tooltip title="View permissions">
                              <IconButton
                                size="small"
                                onClick={() => handleViewPermissions(user)}
                                sx={{
                                  borderRadius: 1.5,
                                  "&:hover": { bgcolor: "primary.50" },
                                }}
                              >
                                <VisibilityIcon
                                  fontSize="small"
                                  color="primary"
                                />
                              </IconButton>
                            </Tooltip>

                            {can("users", "edit") && (
                              <Tooltip title="Edit user">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(user)}
                                  sx={{ borderRadius: 1.5 }}
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
                                  disabled={state.actionLoading[user.id]}
                                  size="small"
                                  color="success"
                                  sx={{ borderRadius: 1 }}
                                />
                              </Tooltip>
                            )}

                            {isSuperAdmin() && (
                              <Tooltip title="Delete user">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(user)}
                                  sx={{ borderRadius: 1.5 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>

      <TablePagination
        rowsPerPageOptions={[5, 10, 20, 50]}
        component="div"
        count={state.total}
        rowsPerPage={state.rowsPerPage}
        page={state.page}
        onPageChange={(_, newPage) => set({ page: newPage })}
        onRowsPerPageChange={(e) => {
          set({ rowsPerPage: parseInt(e.target.value, 10), page: 0 });
        }}
        sx={{ borderTop: "1px solid", borderColor: "divider" }}
      />

      <Dialog
        open={state.dialogOpen}
        onClose={() => dispatch({ type: "CLOSE_DIALOG" })}
        maxWidth="md"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
        PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#0d6c6a",
            color: "white",
            py: 2.5,
            px: 3,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {state.currentUser ? (
                <EditIcon fontSize="small" />
              ) : (
                <AddIcon fontSize="small" />
              )}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {state.currentUser ? "Edit User" : "Add New User"}
              </Typography>
              {state.currentUser && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {state.currentUser.email}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogTitle>

        {state.currentUser && (isAdmin() || isSuperAdmin()) && (
          <Tabs
            value={state.tabValue}
            onChange={(_, v) => set({ tabValue: v })}
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "grey.50",
              px: 2,
            }}
          >
            <Tab
              label="Basic Info"
              sx={{ textTransform: "none", fontWeight: 600, minHeight: 48 }}
            />
            <Tab
              label="Permissions"
              sx={{ textTransform: "none", fontWeight: 600, minHeight: 48 }}
            />
          </Tabs>
        )}

        <form onSubmit={handleSaveUser} style={{ overflowY: "auto" }}>
          <DialogContent dividers sx={{ position: "relative", p: 3 }}>
            {state.formSubmitting && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "rgba(255,255,255,0.85)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  backdropFilter: "blur(2px)",
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {state.tabValue === 0 || !state.currentUser ? (
              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    autoFocus
                    label="Full Name"
                    fullWidth
                    value={state.formName}
                    onChange={(e) => set({ formName: e.target.value })}
                    required
                    disabled={state.formSubmitting}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                  <TextField
                    label="Email Address"
                    type="email"
                    fullWidth
                    value={state.formEmail}
                    onChange={(e) => set({ formEmail: e.target.value })}
                    required
                    disabled={state.formSubmitting}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                  {!state.currentUser && (
                    <TextField
                      label="Password"
                      type="password"
                      fullWidth
                      value={state.formPassword}
                      onChange={(e) => set({ formPassword: e.target.value })}
                      required
                      helperText="Minimum 8 characters"
                      disabled={state.formSubmitting}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  )}
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <FormControl
                    fullWidth
                    disabled={state.formSubmitting}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  >
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={state.formRole}
                      label="Role"
                      onChange={(e) => set({ formRole: e.target.value })}
                    >
                      {state.availableRoles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          {role.name.charAt(0).toUpperCase() +
                            role.name.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      px: 2,
                      minWidth: 180,
                      cursor: "pointer",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={state.formActive}
                          onChange={(e) =>
                            set({ formActive: e.target.checked })
                          }
                          color="success"
                          disabled={state.formSubmitting}
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight={500}>
                          Account active
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                  </Box>
                </Stack>

                {state.currentUser && isSuperAdmin() && (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "warning.light",
                      bgcolor: (t) => alpha(t.palette.warning.main, 0.05),
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      color="warning.dark"
                      gutterBottom
                    >
                      Reset Password
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="New Password"
                        type="password"
                        fullWidth
                        value={state.resetPwdValue}
                        onChange={(e) => set({ resetPwdValue: e.target.value })}
                        helperText="Revokes all active sessions for this user"
                        disabled={state.resetPwdSubmitting}
                        size="small"
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={submitResetPassword}
                        disabled={
                          state.resetPwdSubmitting ||
                          state.resetPwdValue.length < 8
                        }
                        sx={{
                          alignSelf: "flex-start",
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {state.resetPwdSubmitting ? "Resetting…" : "Reset"}
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Stack>
            ) : (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 0.5 }}
                >
                  <ShieldIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Permission Overrides
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Toggle permissions to override role defaults. Changes save
                  instantly.
                </Typography>

                {state.permLoading ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 8 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : state.catalogModules.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No modules defined in the system yet.
                  </Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {state.catalogModules.map((mod) => {
                      const roleActs = state.roleMap[mod.code] || [];
                      const overrideMap = state.overrides[mod.code] || {};

                      const grantedActions = state.catalogActions.filter(
                        (act) => {
                          const ovr = overrideMap[act.code];
                          return ovr !== undefined
                            ? ovr
                            : roleActs.includes(act.code);
                        },
                      );
                      const deniedActions = state.catalogActions.filter(
                        (act) => !grantedActions.includes(act),
                      );

                      return (
                        <Accordion
                          key={mod.id}
                          sx={{
                            borderRadius: "12px !important",
                            boxShadow: "none",
                            border: "1px solid",
                            borderColor: "divider",
                            overflow: "hidden",
                            "&:before": { display: "none" },
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ bgcolor: "grey.50", minHeight: 52 }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1.5}
                            >
                              <Typography variant="subtitle2" fontWeight={700}>
                                {mod.name}
                              </Typography>
                              <Badge
                                badgeContent={grantedActions.length}
                                color="success"
                                sx={{
                                  "& .MuiBadge-badge": {
                                    fontSize: 10,
                                    height: 18,
                                    minWidth: 18,
                                  },
                                }}
                              >
                                <Box sx={{ width: 8 }} />
                              </Badge>
                            </Stack>
                          </AccordionSummary>

                          <AccordionDetails sx={{ p: 2.5 }}>
                            {grantedActions.length > 0 && (
                              <Box sx={{ mb: 2.5 }}>
                                <Typography
                                  variant="overline"
                                  color="success.main"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    mb: 1,
                                    fontWeight: 700,
                                  }}
                                >
                                  <CheckIcon sx={{ fontSize: 14 }} /> Granted
                                </Typography>
                                <Stack spacing={1}>
                                  {grantedActions.map((act) => {
                                    const isOverridden =
                                      overrideMap[act.code] !== undefined;
                                    return (
                                      <FormControlLabel
                                        key={act.id}
                                        control={
                                          <Checkbox
                                            checked
                                            onChange={() =>
                                              handlePermissionToggle(
                                                mod,
                                                act,
                                                false,
                                              )
                                            }
                                            color="success"
                                            size="small"
                                          />
                                        }
                                        label={
                                          <Stack
                                            direction="row"
                                            alignItems="center"
                                            spacing={1}
                                          >
                                            <Typography
                                              variant="body2"
                                              fontWeight={500}
                                            >
                                              {act.name}
                                            </Typography>
                                            <Chip
                                              size="small"
                                              label={
                                                isOverridden
                                                  ? "Override"
                                                  : "From role"
                                              }
                                              color={
                                                isOverridden
                                                  ? "success"
                                                  : "default"
                                              }
                                              variant="outlined"
                                              sx={{
                                                height: 20,
                                                fontSize: 10,
                                                fontWeight: 600,
                                                borderRadius: 1,
                                              }}
                                            />
                                          </Stack>
                                        }
                                        sx={{ ml: 0 }}
                                      />
                                    );
                                  })}
                                </Stack>
                              </Box>
                            )}

                            {deniedActions.length > 0 && (
                              <Box>
                                <Typography
                                  variant="overline"
                                  color="error.main"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    mb: 1,
                                    fontWeight: 700,
                                  }}
                                >
                                  <CancelIcon sx={{ fontSize: 14 }} /> Denied
                                </Typography>
                                <Stack spacing={1}>
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
                                            size="small"
                                          />
                                        }
                                        label={
                                          <Stack
                                            direction="row"
                                            alignItems="center"
                                            spacing={1}
                                          >
                                            <Typography
                                              variant="body2"
                                              fontWeight={500}
                                              color="text.secondary"
                                            >
                                              {act.name}
                                            </Typography>
                                            <Chip
                                              size="small"
                                              label={
                                                isOverridden
                                                  ? "Override"
                                                  : "Denied by role"
                                              }
                                              color={
                                                isOverridden
                                                  ? "error"
                                                  : "default"
                                              }
                                              variant="outlined"
                                              sx={{
                                                height: 20,
                                                fontSize: 10,
                                                fontWeight: 600,
                                                borderRadius: 1,
                                              }}
                                            />
                                          </Stack>
                                        }
                                        sx={{ ml: 0 }}
                                      />
                                    );
                                  })}
                                </Stack>
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

          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              onClick={() => dispatch({ type: "CLOSE_DIALOG" })}
              disabled={state.formSubmitting}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            {state.tabValue === 0 && (
              <Button
                type="submit"
                variant="contained"
                disabled={state.formSubmitting}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": { boxShadow: "none" },
                }}
              >
                {state.formSubmitting
                  ? state.currentUser
                    ? "Updating…"
                    : "Creating…"
                  : state.currentUser
                    ? "Save Changes"
                    : "Create User"}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* ── View Permissions Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={state.viewDialogOpen}
        onClose={() => set({ viewDialogOpen: false })}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, minHeight: "80vh" } }}
      >
        <DialogTitle
          sx={{
            background: (t) =>
              `linear-gradient(135deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 100%)`,
            color: "white",
            py: 3,
            px: 3,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: "rgba(255,255,255,0.2)",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {(state.viewUser?.name || state.viewUser?.email)
                ?.charAt(0)
                .toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {state.viewUser?.name || "User"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {state.viewUser?.email}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, md: 3 }, bgcolor: "grey.50" }}>
          {state.viewLoading ? (
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
                {[
                  {
                    label: "Assigned Role",
                    value: state.viewRoleName,
                    big: false,
                    color: "primary",
                    icon: <AdminIcon fontSize="small" />,
                  },
                  {
                    label: "Role Permissions",
                    value: effectivePermCount,
                    big: true,
                    color: "success",
                    icon: <VerifiedIcon fontSize="small" />,
                  },
                  {
                    label: "Custom Overrides",
                    value: overrideCount,
                    big: true,
                    color: overrideCount > 0 ? "warning" : "default",
                    icon: <ShieldIcon fontSize="small" />,
                  },
                ].map((c) => (
                  <Grid item xs={12} md={4} key={c.label}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: (t) =>
                            alpha(
                              t.palette[c.color]?.main || t.palette.grey[400],
                              0.12,
                            ),
                          color: `${c.color}.main`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {c.icon}
                      </Box>
                      <Box>
                        <Typography
                          variant={c.big ? "h4" : "h6"}
                          fontWeight={700}
                          lineHeight={1}
                        >
                          {c.value}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={500}
                        >
                          {c.label}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "white",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <VerifiedIcon fontSize="small" color="success" />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Role Permissions
                  </Typography>
                </Stack>
                {Object.keys(state.viewRoleMap).length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No role permissions assigned.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {Object.entries(state.viewRoleMap).map(([mod, acts]) => (
                      <Box
                        key={mod}
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", md: "row" },
                          gap: 1.5,
                          py: 1.5,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          "&:last-child": { borderBottom: "none", pb: 0 },
                        }}
                      >
                        <Typography
                          sx={{
                            minWidth: 160,
                            fontWeight: 600,
                            textTransform: "capitalize",
                            fontSize: 13,
                          }}
                        >
                          {mod}
                        </Typography>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}
                        >
                          {acts.map((act) => (
                            <Chip
                              key={act}
                              label={act}
                              color="success"
                              size="small"
                              sx={{
                                borderRadius: 1.5,
                                fontWeight: 600,
                                height: 24,
                              }}
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
                  borderColor: overrideCount > 0 ? "warning.light" : "divider",
                  bgcolor: "white",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <ShieldIcon
                    fontSize="small"
                    color={overrideCount > 0 ? "warning" : "disabled"}
                  />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Custom Overrides
                  </Typography>
                  {overrideCount > 0 && (
                    <Chip
                      label={overrideCount}
                      size="small"
                      color="warning"
                      sx={{ height: 20, fontSize: 11, borderRadius: 1 }}
                    />
                  )}
                </Stack>
                {Object.keys(state.viewOverrideMap).length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No custom overrides configured.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {Object.entries(state.viewOverrideMap).map(
                      ([mod, modOverrides]) => (
                        <Box
                          key={mod}
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            gap: 1.5,
                            py: 1.5,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            "&:last-child": { borderBottom: "none", pb: 0 },
                          }}
                        >
                          <Typography
                            sx={{
                              minWidth: 160,
                              fontWeight: 600,
                              textTransform: "capitalize",
                              fontSize: 13,
                            }}
                          >
                            {mod}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.75,
                            }}
                          >
                            {Object.entries(modOverrides).map(
                              ([action, granted]) => (
                                <Chip
                                  key={action}
                                  label={action}
                                  color={granted ? "success" : "error"}
                                  variant={granted ? "filled" : "outlined"}
                                  size="small"
                                  sx={{
                                    borderRadius: 1.5,
                                    fontWeight: 600,
                                    height: 24,
                                  }}
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

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => set({ viewDialogOpen: false })}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={state.deleteDialogOpen}
        onClose={() => set({ deleteDialogOpen: false, userToDelete: null })}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete{" "}
            <strong>
              {state.userToDelete?.name || state.userToDelete?.email}
            </strong>
            ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => set({ deleteDialogOpen: false, userToDelete: null })}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
