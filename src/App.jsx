// src/App.js
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardCharts from './pages/DashboardCharts';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors/Vendors';
import Containers from './pages/Containers/Containers';
import AddContainers from './pages/Containers/AddContainer';
import Orders from './pages/Orders/Orders';
import AddConsignment from './pages/Consignments/AddConsignment';
import Consignments from './pages/Consignments';
import AddCustomer from './pages/AddCustomer';
import AddVendor from './pages/AddVendor';
import TrackingPage from './pages/Orders/TrackingPage';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import OrderForm from './pages/Orders/AddOrder';
import PaymentTypes from './pages/SystemData/PaymentTypes';
import Categories from './pages/SystemData/Categories';
import Vessels from './pages/SystemData/Vessels';
import Places from './pages/SystemData/Places';
import Banks from './pages/SystemData/Banks';
import ThirdParties from './pages/SystemData/ThirdParties';
import BarcodePrintTest from './pages/SystemData/BarcodePrintTest';
import EtaSetupPage from './pages/SystemData/EtaSetup';
import UsersManagement from './pages/Admin/UserModule';
import PermissionEditor from './pages/Admin/PermissionEditor';
import NotificationSettings from './pages/SystemData/NotificationSetting';

// ────────────────────────────────────────────────────────────────
// Protected Route Wrapper (checks auth + optional permission)
// ────────────────────────────────────────────────────────────────
function ProtectedRoute({ requiredPermission = null }) {
  const { isAuthenticated, loading, can } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Optional: check specific permission
  if (requiredPermission && !can(requiredPermission.module, requiredPermission.action)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// ────────────────────────────────────────────────────────────────
// Admin-only Route Wrapper (shortcut for role-based admin checks)
// ────────────────────────────────────────────────────────────────
function AdminRoute() {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// ────────────────────────────────────────────────────────────────
// Unauthorized page (simple placeholder — replace with real one)
// ────────────────────────────────────────────────────────────────
function Unauthorized() {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <h1>403 - Access Denied</h1>
      <p>You don't have permission to view this page.</p>
    </Box>
  );
}

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes (require login) */}
          <Route element={<ProtectedRoute />}>
            {/* Dashboard layout wrapper */}
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<DashboardCharts />} />

              {/* Core features – protected by login only */}
              <Route path="customers" element={<Customers />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="orders" element={<Orders />} />
              <Route path="tracking" element={<TrackingPage />} />
              <Route path="consignments" element={<Consignments />} />
              <Route path="permissions" element={<PermissionEditor />} />

              {/* Create/Edit routes */}
              <Route path="orders/add" element={<OrderForm mode="add" />} />
              <Route path="customers/add" element={<AddCustomer mode="add" />} />
              <Route path="customers/:id/edit" element={<AddCustomer mode="edit" />} />
              <Route path="vendors/add" element={<AddVendor mode="add" />} />
              <Route path="vendors/:id/edit" element={<AddVendor mode="edit" />} />
              <Route path="containers" element={<AddContainers />} />
              <Route path="consignments/add" element={<AddConsignment mode="add" />} />
              <Route path="consignments/:id/edit" element={<AddConsignment mode="edit" />} />
                <Route path="notifications" element={<NotificationSettings />} />

              {/* Users Management – protected by permission */}
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredPermission={{ module: 'users', action: 'view' }}>
                    <UsersManagement />
                  </ProtectedRoute>
                }
              />
            </Route>
<Route
        path="admin"
        element={
          <ProtectedRoute requiredPermission={{ module: 'admin', action: 'view' }}>
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route path="payment-types" element={<PaymentTypes />} />
        <Route path="categories"     element={<Categories />} />
        <Route path="vessels"        element={<Vessels />} />
        <Route path="places"         element={<Places />} />
        <Route path="banks"          element={<Banks />} />
        <Route path="third-parties"  element={<ThirdParties />} />
        <Route path="barcode-print"  element={<BarcodePrintTest />} />
        <Route path="eta-setup"      element={<EtaSetupPage />} />
      </Route>
          </Route>

          {/* Catch-all unauthorized / 404 */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LocalizationProvider>
  );
}