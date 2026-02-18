import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ check if already logged in on first load
  useEffect(() => {
    api.get("/auth/me")
      .then((res) => {
        console.log("Session check response:", res);
        setUser(res.data);
      })
      .catch(() => setUser(null))  
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data.user);
    return res.data.user;
  };
async function handleAdminReset(userEmail, newPassword) {
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userEmail)}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${yourAdminToken}`,
      },
      body: JSON.stringify({ newPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to reset password");
      return;
    }

    alert(`Password reset successful for ${data.user.email}`);
  } catch (err) {
    alert("Network error");
  }
}
  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
