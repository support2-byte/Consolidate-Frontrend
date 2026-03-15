// src/routes/Protected.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress, Fade } from "@mui/material";

/**
 * Protected Route Component
 * Protects routes based on authentication + optional permissions.
 *
 * @param {Object} props
 * @param {ReactNode} [props.children] - Optional children (for layout wrapping)
 * @param {Object} [props.permission] - Permission check config
 * @param {string} props.permission.module - Required module name (e.g. "orders")
 * @param {string|string[]} [props.permission.action="view"] - Action(s) to check
 * @param {string} [props.redirectTo="/login"] - Where to redirect if not authenticated
 * @param {string} [props.unauthorizedPath="/unauthorized"] - Where to redirect if permission denied
 */
export default function ProtectedRoute({
  children,
  permission = null,
  redirectTo = "/login",
  unauthorizedPath = "/unauthorized",
}) {
  // const { isAuthenticated, loading, can } = useAuth();
  const location = useLocation();
const { isAuthenticated, loading, can, permissions, user } = useAuth(); // ← add permissions & user if available

  console.log('ProtectedRoute → user:', user);
  console.log('ProtectedRoute → all permissions:', permissions);

  if (permission?.module) {
    const hasPerm = can(permission.module, permission.action);
    console.log(
      `Checking permission: ${permission.module}.${permission.action} → ${hasPerm ? 'YES' : 'NO'}`
    );
  }
  // ────────────────────────────────────────────────────────────────
  // Loading state — full-screen centered spinner
  // ────────────────────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────────────────────
  // Not authenticated → redirect to login + preserve location
  // ────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // ────────────────────────────────────────────────────────────────
  // Optional permission check
  // ────────────────────────────────────────────────────────────────
  if (permission?.module) {
    const actions = Array.isArray(permission.action)
      ? permission.action
      : [permission.action || "view"];

    const hasPermission = actions.some((action) =>
      can(permission.module, action)
    );

    if (!hasPermission) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[ProtectedRoute] Permission denied: ${permission.module}:[${actions.join(", ")}]`
        );
      }
      return <Navigate to={unauthorizedPath} replace />;
    }
  }

  // ────────────────────────────────────────────────────────────────
  // All checks passed → render children or nested routes
  // ────────────────────────────────────────────────────────────────
  return children ? children : <Outlet />;
}