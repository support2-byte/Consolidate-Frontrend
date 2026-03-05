// src/components/RequireAuthRedirect.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuthRedirect() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only act after auth check is finished
    if (loading) return;

    // If logged in and on login/register → redirect away
    if (isAuthenticated && ["/login", "/register"].includes(location.pathname)) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [loading, isAuthenticated, location.pathname, navigate, location.state]);

  return null; // Renders nothing — just runs the effect
}