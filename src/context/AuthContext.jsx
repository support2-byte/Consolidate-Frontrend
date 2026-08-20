import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { api, hasSessionFlag, setHasSession, clearHasSession } from "../api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSession = useCallback(async () => {
    if (!hasSessionFlag()) {
      setUser(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userRes = await api.get("/auth/me");
      const userData = userRes.data?.data;

      if (!userData?.id) throw new Error("Invalid user data");

      setUser(userData);
      setPermissions(userData.permissions || []);
    } catch (err) {
      clearHasSession();
      setError(err.message || "Failed to load session");
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (email, password) => {
    try {
      await api.post("/auth/login", { email, password });
      setHasSession();
      await loadSession();
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Login failed. Please check your credentials.";
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("[Logout] API failed:", err.message);
    } finally {
      clearHasSession();
      setUser(null);
      setPermissions([]);
      setError(null);
    }
  };

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const can = useCallback(
    (module, action = "view") => {
      return permissionSet.has(`${module}.${action}`);
    },
    [permissionSet],
  );

  const hasRole = useCallback(
    (roles) => {
      if (!user?.roleName) return false;
      const required = Array.isArray(roles) ? roles : [roles];
      return required.includes(user.roleName);
    },
    [user],
  );

  const isSuperAdmin = useCallback(() => hasRole("super admin"), [hasRole]);
  const isAdmin = useCallback(() => hasRole("admin"), [hasRole]);
  const isManager = useCallback(() => hasRole("manager"), [hasRole]);
  const isStaff = useCallback(() => hasRole("staff"), [hasRole]);

  const refreshSession = useCallback(() => loadSession(), [loadSession]);

  const refreshUserOnly = useCallback(async () => {
    if (!hasSessionFlag()) return;
    try {
      const res = await api.get("/auth/me");
      const userData = res.data?.data;
      if (userData?.id) {
        setUser(userData);
        setPermissions(userData.permissions || []);
      }
    } catch (err) {
      console.warn("[Refresh User] Failed:", err.message);
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
    isSuperAdmin,
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
