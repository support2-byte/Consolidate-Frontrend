// src/main.jsx (updated)
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./routes/Protected";
import { Outlet } from "react-router-dom";
// Pages & Components
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/Dashboard"; // ← this has sidebar + topbar
import DashboardCharts from "./pages/DashboardCharts";
import Customers from "./pages/Customers/Customers";
import ContainerForm from "./pages/Containers/AddContainer";
import NotificationManage from "./pages/SystemData/ManageNotifications";
import Vendors from "./pages/Vendors/Vendors";
import Orders from "./pages/Orders/Orders";
import Consignments from "./pages/Consignments/Consignments";
import AddConsignment from "./pages/Consignments/AddConsignment";
import CustomerAdd from "./pages/Customers/AddCustomer";
import VendorsForm from "./pages/Vendors/AddVendors";
import OrderForm from "./pages/Orders/AddOrder";
import TrackingPage from "./pages/Orders/TrackingPage";
import PaymentTypes from "./pages/SystemData/PaymentTypes";
import Categories from "./pages/SystemData/Categories";
import Vessels from "./pages/SystemData/Vessels";
import Places from "./pages/SystemData/Places";
import Banks from "./pages/SystemData/Banks";
import ThirdParties from "./pages/SystemData/ThirdParties";
import BarcodePrintTest from "./pages/SystemData/BarcodePrintTest";
import EtaSetupPage from "./pages/SystemData/EtaSetup";
import UserTracking from "./pages/UserTracking";
import UsersManagement from "./pages/Admin/UserModule";
import PermissionEditor from "./pages/Admin/PermissionEditor";

// Fallback Pages
import Unauthorized from "./pages/Unauthorized";
import NotificationSettings from "./pages/SystemData/NotificationSetting";

// ────────────────────────────────────────────────────────────────
// Router Configuration
// ────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  // Public routes (no auth required)
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  // Protected routes (require authentication)
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />  {/* ← Sidebar + Topbar wrapper */}
      </ProtectedRoute>
    ),
    children: [
      // Default / Dashboard
      { index: true, element: <DashboardCharts /> },
      { path: "dashboard", element: <DashboardCharts /> },

      // Operational pages – view only for staff
      { 
        path: "customers", 
        element: (
          <ProtectedRoute permission={{ module: "customers", action: "view" }}>
            <Customers />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "vendors", 
        element: (
          <ProtectedRoute permission={{ module: "vendors", action: "view" }}>
            <Vendors />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "containers", 
        element: (
          <ProtectedRoute permission={{ module: "containers", action: "view" }}>
            <ContainerForm />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "orders", 
        element: (
          <ProtectedRoute permission={{ module: "orders", action: "view" }}>
            <Orders />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "tracking", 
        element: (
          <ProtectedRoute permission={{ module: "tracking", action: "view" }}>
            <TrackingPage />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "consignments", 
        element: (
          <ProtectedRoute permission={{ module: "consignments", action: "view" }}>
            <Consignments />
          </ProtectedRoute>
        ) 
      },

      // Forms – protected by create/edit permissions
      { 
        path: "orders/add", 
        element: (
          <ProtectedRoute permission={{ module: "orders", action: "create" }}>
            <OrderForm mode="add" />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "orders/:id/edit", 
        element: (
          <ProtectedRoute permission={{ module: "orders", action: "edit" }}>
            <OrderForm mode="edit" />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "customers/add", 
        element: (
          <ProtectedRoute permission={{ module: "customers", action: "create" }}>
            <CustomerAdd mode="add" />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "customers/:id/edit", 
        element: (
          <ProtectedRoute permission={{ module: "customers", action: "edit" }}>
            <CustomerAdd mode="edit" />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "vendors/add", 
        element: (
          <ProtectedRoute permission={{ module: "vendors", action: "create" }}>
            <VendorsForm mode="add" />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "vendors/:id/edit", 
        element: (
          <ProtectedRoute permission={{ module: "vendors", action: "edit" }}>
            <VendorsForm mode="edit" />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "consignments/add", 
        element: (
          <ProtectedRoute permission={{ module: "consignments", action: "create" }}>
            <AddConsignment mode="add" />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "consignments/:id/edit", 
        element: (
          <ProtectedRoute permission={{ module: "consignments", action: "edit" }}>
            <AddConsignment mode="edit" />
          </ProtectedRoute>
        ) 
      },

      // Admin-only pages
      { 
        path: "users", 
        element: (
          <ProtectedRoute permission={{ module: "users", action: "view" }}>
            <UsersManagement />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "permissions", 
        element: (
          <ProtectedRoute permission={{ module: "permissions", action: "view" }}>
            <PermissionEditor />
          </ProtectedRoute>
        ) 
      },
            { 
        path: "notifications", 
        element: (
          <ProtectedRoute permission={{ module: "notifications", action: "view" }}>
            <NotificationSettings />
          </ProtectedRoute>
        ) 
      },
          { 
        path: "notifications/:id", 
        element: (
          <ProtectedRoute permission={{ module: "notifications", action: "view" }}>
            <NotificationManage />
          </ProtectedRoute>
        ) 
      },

      // System/Admin section
      {
        path: "admin",
        element: ( <Outlet />
        ),
        children: [
          // { path: "notifications", element: <NotificationSettings /> },
          { path: "payment-types", element: <PaymentTypes /> },
          { path: "categories", element: <Categories /> },
          { path: "vessels", element: <Vessels /> },
          { path: "places", element: <Places /> },
          { path: "banks", element: <Banks /> },
          { path: "third-parties", element: <ThirdParties /> },
          { path: "barcode-print", element: <BarcodePrintTest /> },
          { path: "eta-setup", element: <EtaSetupPage /> },

        ],
      },

      // Other pages
      { path: "user-tracking", element: <UserTracking /> },
    ],
  },

  // Fallbacks
  { path: "/unauthorized", element: <Unauthorized /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

// ────────────────────────────────────────────────────────────────
// Root Render
// ────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);