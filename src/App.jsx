import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout"; // your sidebar layout
import DashboardCharts from "./pages/DashboardCharts";
import Customers from "./pages/Customers";
import Vendors from "./pages/Vendors";
import Containers from "./pages/Containers";
import Orders from "./pages/Orders";
import Consignments from "./pages/Consignments";

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>; // while checking session
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardCharts />} />
            <Route path="customers" element={<Customers />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="containers" element={<Containers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="consignments" element={<Consignments />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
