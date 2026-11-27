import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  api,
  hasSessionFlag,
  setHasSession,
  clearHasSession,
  AUTH_EXPIRED_EVENT,
  replayWaitingRequests,
  rejectWaitingRequests,
} from "../api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const userRef = useRef(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
      const userRes = await api.get("/auth/me", { skipReauth: true });
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

  // The server ends the session after 30 minutes of inactivity. Nothing happens
  // while the user is away; the first API call that gets a 401 fires this event.
  // The page stays mounted and a re-login dialog opens over it.
  useEffect(() => {
    const handleExpired = () => {
      if (userRef.current) setSessionExpired(true);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

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
      await api.post("/auth/logout", null, { skipReauth: true });
    } catch (err) {
      console.warn("[Logout] API failed:", err.message);
    } finally {
      clearHasSession();
      rejectWaitingRequests();
      setSessionExpired(false);
      setUser(null);
      setPermissions([]);
      setError(null);
    }
  };

  // Called from the re-login dialog. Same account only (the email is locked).
  // The page is never reloaded; held requests are replayed on success.
  const reauthenticate = async (password) => {
    const email = userRef.current?.email;
    if (!email) throw new Error("NO_SESSION");

    try {
      await api.post("/auth/login", { email, password }, { skipReauth: true });
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Login failed",
      );
    }

    setHasSession();

    // Refresh user data without toggling `loading`, which would unmount the page.
    try {
      const res = await api.get("/auth/me", { skipReauth: true });
      const userData = res.data?.data;
      if (userData?.id) {
        // Keep the same object/array references when nothing changed, so pages
        // with effects depending on `user`, `permissions` or `can` do not
        // re-run and reset their filters/search state.
        setUser((prev) =>
          JSON.stringify(prev) === JSON.stringify(userData) ? prev : userData,
        );
        const nextPerms = userData.permissions || [];
        setPermissions((prev) =>
          prev.length === nextPerms.length &&
          prev.every((p, i) => p === nextPerms[i])
            ? prev
            : nextPerms,
        );
      }
    } catch {
      // Keep the existing user; permissions refresh on the next /auth/me.
    }

    setSessionExpired(false);
    replayWaitingRequests();
  };

  // "Sign in as someone else": drop held requests and go through the normal
  // login page. ProtectedRoute remembers the current URL so they return to it.
  const abandonSession = () => {
    clearHasSession();
    rejectWaitingRequests();
    setSessionExpired(false);
    setUser(null);
    setPermissions([]);
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
    sessionExpired,
    reauthenticate,
    abandonSession,
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
