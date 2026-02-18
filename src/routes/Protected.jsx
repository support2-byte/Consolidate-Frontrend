import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  console.log("ProtectedRoute check - user:", user, "loading:", loading);
  const location = useLocation();

  if (loading) return <div>Loading...</div>; // ⏳ optional spinner
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}
