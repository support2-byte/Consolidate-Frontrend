import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Chip,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

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

export default function PermissionEditor() {
  const { can } = useAuth();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tab, setTab] = useState(0);
  const [roleMap, setRoleMap] = useState({});
  const [overrideMap, setOverrideMap] = useState({});
  const [roleName, setRoleName] = useState("—");
  const [catalogModules, setCatalogModules] = useState([]);
  const [catalogActions, setCatalogActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (!can("users", "view")) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get("/auth/users");
        if (res.data?.success) setUsers(res.data.data || []);
      } catch {
        setSnackbar({
          open: true,
          message: "Failed to load users",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [can]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get("/auth/rbac/permissions");
        if (res.data?.success) {
          setCatalogModules(res.data.data?.modules || []);
          setCatalogActions(res.data.data?.actions || []);
        }
      } catch {
        setSnackbar({
          open: true,
          message: "Could not load permission catalog",
          severity: "warning",
        });
      }
    };

    fetchCatalog();
  }, []);

  useEffect(() => {
    if (!selectedUser?.id) return;

    const fetchUserPermissions = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/auth/users/${selectedUser.id}/permissions`);
        if (res.data?.success) {
          setRoleMap(buildRoleMap(res.data.data?.rolePermissions || []));
          setOverrideMap(buildOverrideMap(res.data.data?.overrides || []));
          setRoleName(res.data.data?.roleName || "—");
        }
      } catch {
        setSnackbar({
          open: true,
          message: "Failed to load user permissions",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [selectedUser]);

  const handleToggle = useCallback(
    async (mod, action, newGranted) => {
      if (!selectedUser?.id) return;

      try {
        await api.put(`/auth/users/${selectedUser.id}/permissions`, {
          moduleId: mod.id,
          actionId: action.id,
          granted: newGranted,
        });

        setOverrideMap((prev) => ({
          ...prev,
          [mod.code]: {
            ...prev[mod.code],
            [action.code]: newGranted,
          },
        }));

        setSnackbar({
          open: true,
          message: `"${action.code}" on "${mod.code}" ${newGranted ? "granted" : "revoked"}`,
          severity: "success",
        });
      } catch {
        setSnackbar({
          open: true,
          message: "Failed to update permission",
          severity: "error",
        });
      }
    },
    [selectedUser],
  );

  const handleRevert = useCallback(
    async (mod, action) => {
      if (!selectedUser?.id) return;

      try {
        await api.put(`/auth/users/${selectedUser.id}/permissions`, {
          moduleId: mod.id,
          actionId: action.id,
          granted: null,
        });

        setOverrideMap((prev) => {
          const next = { ...prev };
          if (next[mod.code]) {
            next[mod.code] = { ...next[mod.code] };
            delete next[mod.code][action.code];
          }
          return next;
        });

        setSnackbar({
          open: true,
          message: `"${action.code}" on "${mod.code}" reverted to role default`,
          severity: "info",
        });
      } catch {
        setSnackbar({
          open: true,
          message: "Failed to revert permission",
          severity: "error",
        });
      }
    },
    [selectedUser],
  );

  if (!can("permissions", "view")) {
    return <Typography color="error">Access denied</Typography>;
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Permission Editor
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select User
        </Typography>

        {loading && !selectedUser ? (
          <CircularProgress />
        ) : users.length === 0 ? (
          <Typography color="text.secondary">No users found</Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {users.map((user) => (
              <Chip
                key={user.id}
                label={`${user.email} (${user.role_name || "?"})`}
                color={selectedUser?.id === user.id ? "primary" : "default"}
                onClick={() => setSelectedUser(user)}
                variant={selectedUser?.id === user.id ? "filled" : "outlined"}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>
        )}
      </Paper>

      {selectedUser && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">
              Permissions for: {selectedUser.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role: <strong>{roleName}</strong>
            </Typography>
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="Role Permissions" />
            <Tab label="User Overrides" />
          </Tabs>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {tab === 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Permissions inherited from role "{roleName}"
                  </Typography>

                  {Object.keys(roleMap).length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      This role has no permissions assigned.
                    </Typography>
                  ) : (
                    Object.entries(roleMap).map(([mod, actions]) => (
                      <Box key={mod} sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {mod}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {actions.map((act) => (
                            <Chip
                              key={act}
                              label={act}
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              )}

              {tab === 1 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Override individual permissions for this user
                  </Typography>

                  {catalogModules.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No modules defined in the system yet.
                    </Alert>
                  ) : (
                    catalogModules.map((mod) => {
                      const roleActions = roleMap[mod.code] || [];
                      const modOverrides = overrideMap[mod.code] || {};

                      return (
                        <Paper
                          key={mod.id}
                          variant="outlined"
                          sx={{ p: 3, mb: 3 }}
                        >
                          <Typography variant="h6" gutterBottom>
                            {mod.name}
                          </Typography>

                          <Divider sx={{ my: 2 }} />

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1.5,
                            }}
                          >
                            {catalogActions.map((action) => {
                              const hasRoleDefault = roleActions.includes(
                                action.code,
                              );
                              const overrideValue = modOverrides[action.code];
                              const isChecked =
                                overrideValue !== undefined
                                  ? overrideValue
                                  : hasRoleDefault;
                              const isOverridden = overrideValue !== undefined;

                              return (
                                <Box
                                  key={action.id}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={isChecked}
                                        onChange={() =>
                                          handleToggle(mod, action, !isChecked)
                                        }
                                        color={
                                          isOverridden ? "secondary" : "primary"
                                        }
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
                                        <Typography>{action.name}</Typography>

                                        {isOverridden && (
                                          <Chip
                                            size="small"
                                            label={`override: ${overrideValue ? "granted" : "revoked"}`}
                                            color="secondary"
                                            variant="outlined"
                                          />
                                        )}

                                        {!isOverridden && hasRoleDefault && (
                                          <Chip
                                            size="small"
                                            label="from role"
                                            color="default"
                                            variant="outlined"
                                          />
                                        )}

                                        {!isOverridden && !hasRoleDefault && (
                                          <Chip
                                            size="small"
                                            label="denied by role"
                                            variant="outlined"
                                          />
                                        )}
                                      </Box>
                                    }
                                  />

                                  {isOverridden && (
                                    <Chip
                                      size="small"
                                      label="revert to role"
                                      onClick={() => handleRevert(mod, action)}
                                      variant="outlined"
                                      color="default"
                                      sx={{ cursor: "pointer" }}
                                    />
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        </Paper>
                      );
                    })
                  )}
                </Box>
              )}
            </>
          )}
        </Paper>
      )}

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
