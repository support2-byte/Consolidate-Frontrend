import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Checkbox,
  FormControlLabel,
  Button,
  Stack,
  Grid,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  AdminPanelSettings as AdminIcon,
  Shield as ShieldIcon,
  CheckCircleOutline as CheckIcon,
  CancelOutlined as CancelIcon,
  Save as SaveIcon,
  SupervisorAccount as RoleIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

const ROLE_COLOR = {
  "super admin": "success",
  admin: "warning",
  manager: "error",
  staff: "info",
  viewer: "default",
  user: "default",
};

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

export default function RolePermissions() {
  const { can } = useAuth();

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [catalogModules, setCatalogModules] = useState([]);
  const [catalogActions, setCatalogActions] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    api.get("/auth/roles").then((res) => {
      if (res.data?.success) setRoles(res.data.data || []);
    });
    api.get("/auth/rbac/permissions").then((res) => {
      if (res.data?.success) {
        setCatalogModules(res.data.data?.modules || []);
        setCatalogActions(res.data.data?.actions || []);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedRole) return;
    setLoading(true);
    api
      .get(`/auth/rbac/roles/${selectedRole.name}/permissions`)
      .then((res) => {
        if (res.data?.success) {
          const map = {};
          for (const p of res.data.data.permissions) {
            if (!map[p.module_id]) map[p.module_id] = new Set();
            map[p.module_id].add(p.action_id);
          }
          setSelected(map);
          setDirty(false);
        }
      })
      .catch(() =>
        setSnackbar({
          open: true,
          message: "Failed to load role permissions",
          severity: "error",
        }),
      )
      .finally(() => setLoading(false));
  }, [selectedRole]);

  const toggle = useCallback((moduleId, actionId) => {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[moduleId] || []);
      if (set.has(actionId)) set.delete(actionId);
      else set.add(actionId);
      next[moduleId] = set;
      return next;
    });
    setDirty(true);
  }, []);

  const handleSave = async () => {
    if (!selectedRole) return;
    const permissions = [];
    for (const [moduleId, actionSet] of Object.entries(selected)) {
      for (const actionId of actionSet) {
        permissions.push({ moduleId: Number(moduleId), actionId });
      }
    }
    setSaving(true);
    try {
      await api.put(`/auth/rbac/roles/${selectedRole.name}/permissions`, {
        permissions,
      });
      setDirty(false);
      setSnackbar({
        open: true,
        message: `Permissions saved for "${selectedRole.name}"`,
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to save role permissions",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const totalGranted = useMemo(
    () => Object.values(selected).reduce((acc, set) => acc + set.size, 0),
    [selected],
  );

  const canEdit = can("permissions", "edit");

  if (!can("permissions", "view")) {
    return <Typography color="error">Access denied</Typography>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "grey.50", minHeight: "100vh" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#f58220">
            Role Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Define what each role can access across the platform
          </Typography>
        </Box>

        {selectedRole && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || loading || !canEdit || !dirty}
            sx={{
              borderRadius: 2,
              px: 2.5,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        )}
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Select a role
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {roles.map((role) => (
            <Chip
              key={role.id}
              avatar={
                <Avatar sx={{ bgcolor: "transparent !important" }}>
                  <RoleIcon
                    fontSize="small"
                    color={selectedRole?.id === role.id ? "inherit" : "action"}
                  />
                </Avatar>
              }
              label={role.name.charAt(0).toUpperCase() + role.name.slice(1)}
              color={
                selectedRole?.id === role.id
                  ? ROLE_COLOR[role.name?.toLowerCase()] || "primary"
                  : "default"
              }
              onClick={() => setSelectedRole(role)}
              variant={selectedRole?.id === role.id ? "filled" : "outlined"}
              sx={{
                cursor: "pointer",
                fontWeight: 600,
                borderRadius: 1.5,
                height: 34,
              }}
            />
          ))}
        </Box>
      </Paper>

      {selectedRole && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 4 }}>
              <StatCard
                icon={<AdminIcon fontSize="small" />}
                label="Role"
                value={
                  selectedRole.name.charAt(0).toUpperCase() +
                  selectedRole.name.slice(1)
                }
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <StatCard
                icon={<ShieldIcon fontSize="small" />}
                label="Modules"
                value={catalogModules.length}
                color="info"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <StatCard
                icon={<CheckIcon fontSize="small" />}
                label="Granted Permissions"
                value={totalGranted}
                color="success"
              />
            </Grid>
          </Grid>

          {dirty && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              You have unsaved changes.
            </Alert>
          )}

          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              p: { xs: 1.5, md: 2.5 },
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress />
              </Box>
            ) : catalogModules.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No modules defined in the system yet.
              </Alert>
            ) : (
              <Stack spacing={1.5}>
                {catalogModules.map((mod) => {
                  const grantedSet = selected[mod.id] || new Set();
                  const grantedActions = catalogActions.filter((a) =>
                    grantedSet.has(a.id),
                  );
                  const deniedActions = catalogActions.filter(
                    (a) => !grantedSet.has(a.id),
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
                            <Box
                              sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}
                            >
                              {grantedActions.map((action) => (
                                <FormControlLabel
                                  key={action.id}
                                  control={
                                    <Checkbox
                                      checked
                                      onChange={() => toggle(mod.id, action.id)}
                                      color="success"
                                      size="small"
                                      disabled={!canEdit}
                                    />
                                  }
                                  label={
                                    <Typography
                                      variant="body2"
                                      fontWeight={500}
                                    >
                                      {action.name}
                                    </Typography>
                                  }
                                  sx={{ ml: 0 }}
                                />
                              ))}
                            </Box>
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
                              <CancelIcon sx={{ fontSize: 14 }} /> Not granted
                            </Typography>
                            <Box
                              sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}
                            >
                              {deniedActions.map((action) => (
                                <FormControlLabel
                                  key={action.id}
                                  control={
                                    <Checkbox
                                      checked={false}
                                      onChange={() => toggle(mod.id, action.id)}
                                      color="default"
                                      size="small"
                                      disabled={!canEdit}
                                    />
                                  }
                                  label={
                                    <Typography
                                      variant="body2"
                                      fontWeight={500}
                                      color="text.secondary"
                                    >
                                      {action.name}
                                    </Typography>
                                  }
                                  sx={{ ml: 0 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </>
      )}

      {!selectedRole && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <RoleIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary" fontWeight={500}>
            Select a role above to view and edit its permissions
          </Typography>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
