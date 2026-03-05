// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

/**
 * Auth Context Provider
 * Manages user session, permissions, and authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ────────────────────────────────────────────────────────────────
  // Core session loader with retry logic
  // ────────────────────────────────────────────────────────────────
  const loadSession = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    const baseDelay = 1500;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch current user
      const userRes = await api.get("/auth/me");
      const userData = userRes.data?.user || userRes.data;

      if (!userData?.id) {
        throw new Error("Invalid user data from /me");
      }

      setUser(userData);

      // 2. Fetch permissions
      try {
        const permRes = await api.get("/auth/rbac/my-permissions");
        console.log("permissions ",permRes)
        setPermissions(permRes.data?.permissions || {});
      } catch (permErr) {
        console.warn("[Permissions] Fetch failed:", permErr.message);
        setPermissions({});
      }
    } catch (err) {
      console.warn("[Session] Load failed:", err.message);

      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(1.5, retryCount);
        console.log(`Retrying session load in ${delay}ms (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return loadSession(retryCount + 1);
      }

      setError(err.message || "Failed to load session");
      setUser(null);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial session check on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // ────────────────────────────────────────────────────────────────
  // Login handler
  // ────────────────────────────────────────────────────────────────
 const login = async (email, password) => {
  try {
    const res = await api.post("/auth/login", { email, password });

await loadSession();

    // No need to check !user here – if loadSession didn't throw, user should be set
    // But add a safety timeout to let React batch finish
    await new Promise(resolve => setTimeout(resolve, 100));

    return true; // return the fresh user
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Login failed. Please check your credentials.";
    throw new Error(message);
  }
};

  // ────────────────────────────────────────────────────────────────
  // Logout handler
  // ────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("[Logout] API failed:", err.message);
      // Continue anyway
    } finally {
      setUser(null);
      setPermissions({});
      setError(null);
      // Redirect to login (moved to component level - see note below)
    }
  };

  // ────────────────────────────────────────────────────────────────
  // Permission & Role Checks
  // ────────────────────────────────────────────────────────────────
  const can = useCallback(
    (module, action = "view") => {
      // Graceful handling if module doesn't exist
      return permissions?.[module]?.includes(action) ?? false;
    },
    [permissions]
  );

  const hasRole = useCallback(
    (roles) => {
      if (!user?.role) return false;
      const required = Array.isArray(roles) ? roles : [roles];
      return required.includes(user.role);
    },
    [user]
  );

  const isAdmin = useCallback(() => hasRole("admin"), [hasRole]);
  const isManager = useCallback(() => hasRole("manager"), [hasRole]);
  const isStaff = useCallback(() => hasRole("staff"), [hasRole]);

  // ────────────────────────────────────────────────────────────────
  // Manual refresh helpers
  // ────────────────────────────────────────────────────────────────
  const refreshSession = useCallback(() => loadSession(), [loadSession]);

  const refreshUserOnly = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      const userData = res.data?.user || res.data;
      if (userData?.id) setUser(userData);
    } catch (err) {
      console.warn("[Refresh User] Failed:", err);
    }
  }, []);

  const value = {
    user,
    permissions,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    can,
    isAdmin,
    isManager,
    isStaff,
    refreshSession,
    refreshUserOnly,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};