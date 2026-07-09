import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress, Fade } from "@mui/material";

export default function ProtectedRoute({
  children,
  permission = null,
  redirectTo = "/login",
  unauthorizedPath = "/unauthorized",
}) {
  const location = useLocation();
  const { isAuthenticated, loading, can } = useAuth();

  if (loading) {
    return (
      <Fade in timeout={400}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            bgcolor: "background.default",
          }}
        >
          <CircularProgress size={60} thickness={4} />
        </Box>
      </Fade>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (permission?.module) {
    const actions = Array.isArray(permission.action)
      ? permission.action
      : [permission.action || "view"];

    const hasPermission = actions.some((action) =>
      can(permission.module, action),
    );

    if (!hasPermission) {
      return <Navigate to={unauthorizedPath} replace />;
    }
  }

  return children ? children : <Outlet />;
}
