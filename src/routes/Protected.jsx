import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress, Fade } from "@mui/material";

/**
 * Protected Route Component
 * Protects routes based on authentication + optional permissions.
 *
 * @param {Object} props
 * @param {ReactNode} [props.children]
 * @param {Object} [props.permission]
 * @param {string} props.permission.module
 * @param {string|string[]} [props.permission.action="view"]
 * @param {string} [props.redirectTo="/login"]
 * @param {string} [props.unauthorizedPath="/unauthorized"]
 */
export default function ProtectedRoute({
  children,
  permission = null,
  redirectTo = "/login",
  unauthorizedPath = "/unauthorized",
}) {
  const location = useLocation();
  const { isAuthenticated, loading, can, permissions, user } = useAuth();

  if (permission?.module) {
    const hasPerm = can(permission.module, permission.action);
  }
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
          <CircularProgress
            size={60}
            thickness={4}
            aria-label="Loading protected route..."
          />
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
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[ProtectedRoute] Permission denied: ${permission.module}:[${actions.join(", ")}]`,
        );
      }
      return <Navigate to={unauthorizedPath} replace />;
    }
  }

  return children ? children : <Outlet />;
}
