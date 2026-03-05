import React, { useState, useEffect } from "react";
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

export default function PermissionEditor() {
  const { can } = useAuth();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tab, setTab] = useState(0);
  const [rolePermissions, setRolePermissions] = useState({});
  const [overrides, setOverrides] = useState({});
  const [effective, setEffective] = useState({});
  const [roleName, setRoleName] = useState("—");
  const [catalogModules, setCatalogModules] = useState([]);
  const [catalogActions, setCatalogActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Load all users
  useEffect(() => {
    if (!can("users", "view")) return;

    setLoading(true);
    api
      .get("/auth/users")
      .then((res) => {
        if (res.data?.success) {
          setUsers(res.data.users || []);
        }
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: "Failed to load users",
          severity: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [can]);

  // Load full permission catalog (only once)
  useEffect(() => {
    let isMounted = true;

    const fetchCatalog = async () => {
      try {
        const res = await api.get("/auth/admin/permissions/catalog");

        if (isMounted && res.data?.success) {
          setCatalogModules(res.data.modules || []);
          setCatalogActions(res.data.actions || []);
          console.log("Permission catalog loaded:", res.data);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load permission catalog:", err);
          setSnackbar({
            open: true,
            message: "Could not load full permission list",
            severity: "warning",
          });
        }
      }
    };

    fetchCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load selected user's permissions
  useEffect(() => {
    if (!selectedUser?.id) return;

    setLoading(true);
    api
      .get(`/auth/admin/users/${selectedUser.id}/permissions`)
      .then((res) => {
        console.log('reteunnnn',res)
        if (res.data?.success) {
          setRolePermissions(res.data.rolePermissions || {});
          setOverrides(res.data.overrides || {});
          setEffective(res.data.effective || {});
          setRoleName(res.data.role || "unknown");
        }
      })
      .catch((err) => {
        console.error("Failed to load user permissions:", err);
        setSnackbar({
          open: true,
          message: "Failed to load user permissions",
          severity: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [selectedUser]);

  // Handle override toggle
  const handleToggle = (module, action, newGranted) => {
    if (!selectedUser?.id) return;

    api
      .post(`/auth/admin/users/${selectedUser.id}/permissions`, {
        module,
        action,
        granted: newGranted,
      })
      .then(() => {
        setOverrides((prev) => ({
          ...prev,
          [module]: {
            ...prev[module],
            [action]: newGranted,
          },
        }));

        setEffective((prev) => ({
          ...prev,
          [module]: newGranted
            ? [...(prev[module] || []), action]
            : (prev[module] || []).filter((a) => a !== action),
        }));

        setSnackbar({
          open: true,
          message: `Permission "${action}" ${newGranted ? "granted" : "revoked"}`,
          severity: "success",
        });
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: "Failed to update permission",
          severity: "error",
        });
      });
  };

  if (!can("admin", "view")) {
    return <Typography color="error">Access denied – admin only</Typography>;
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Permission Editor
      </Typography>

      {/* User Selection */}
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
                label={`${user.email} (${user.role || "?"})`}
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
              Current role: <strong>{"roleName" || currentUser?.role || "loading..."}</strong>
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
              {/* Role Permissions Tab */}
              {tab === 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Permissions inherited from role "{"roleName" || "unknown"}"
                  </Typography>

                  {Object.keys(rolePermissions).length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      This role has no default permissions assigned yet.
                    </Typography>
                  ) : (
                    Object.entries(rolePermissions).map(([mod, actions]) => (
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

              {/* User Overrides Tab – full catalog */}
              {tab === 1 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    All System Permissions – Assign/Override for this user
                  </Typography>

                  {catalogModules.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No modules or actions defined in the system yet.
                    </Alert>
                  ) : (
                    catalogModules.map((mod) => {
                      const moduleCode = mod; // backend returns string array
                      const roleActions = rolePermissions[moduleCode] || [];
                      const overrideMap = overrides[moduleCode] || {};

                      return (
                        <Paper key={moduleCode} variant="outlined" sx={{ p: 3, mb: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            {moduleCode}
                          </Typography>

                          <Divider sx={{ my: 2 }} />

                          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                            {catalogActions.map((action) => {
                              const hasRoleDefault = roleActions.includes(action);
                              const overrideValue = overrideMap[action];
                              const isChecked = overrideValue !== undefined ? overrideValue : hasRoleDefault;

                              return (
                                <FormControlLabel
                                  key={action}
                                  control={
                                    <Checkbox
                                      checked={isChecked}
                                      onChange={() => handleToggle(moduleCode, action, !isChecked)}
                                      color={overrideValue !== undefined ? "secondary" : "primary"}
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                      <Typography component="span">{action}</Typography>

                                      {overrideValue !== undefined && (
                                        <Chip
                                          size="small"
                                          label={`override: ${overrideValue ? "YES" : "NO"}`}
                                          color="secondary"
                                          variant="outlined"
                                        />
                                      )}

                                      {overrideValue === undefined && hasRoleDefault && (
                                        <Chip
                                          size="small"
                                          label="from role"
                                          color="default"
                                          variant="outlined"
                                        />
                                      )}

                                      {overrideValue === undefined && !hasRoleDefault && (
                                        <Chip
                                          size="small"
                                          label="denied by role"
                                          variant="outlined"
                                        />
                                      )}
                                    </Box>
                                  }
                                />
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
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}