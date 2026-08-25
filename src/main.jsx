import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppProvider } from "./context/AppContext";
import ProtectedRoute from "./routes/Protected";

import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/Dashboard";
import DashboardCharts from "./pages/DashboardCharts";
import Customers from "./pages/Customers/Customers";
import ContainerForm from "./pages/Containers/AddContainer";
import ContainerReleases from "./pages/Containers/ContainerReleases";
import NotificationSettings from "./pages/SystemData/NotificationSetting";
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
import StatusesPage from "./pages/SystemData/NewEtaSetup";
import BugReportPage from "./pages/SystemData/BugReport";
import UsersManagement from "./pages/Admin/UserModule";
import PermissionEditor from "./pages/Admin/PermissionEditor";
import Unauthorized from "./pages/Unauthorized";
import { LoadingProvider } from "./context/LoadingContext";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import KycCustomers from "./pages/Customers/KycCustomers";
import KycLogsPage from "./pages/Customers/KycLogsPage";
import KycCustomerDetailPage from "./pages/Customers/KycCustomerDetailPage";
import KycSubmissionsPage from "./pages/Customers/KycSubmissions";
import ForgotPassword from "./pages/ForgotPassword";
import CompaniesPage from "./pages/SystemData/CompaniesPage";
import DocumentTemplatesPage from "./pages/SystemData/DocumentTemplatesPage";
import RolePermissions from "./pages/Admin/RolePermissions";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/register", element: <Register /> },
  { path: "/unauthorized", element: <Unauthorized /> },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardCharts /> },
      { path: "dashboard", element: <DashboardCharts /> },

      {
        path: "customers",
        element: (
          <ProtectedRoute permission={{ module: "customers", action: "view" }}>
            <Customers />
          </ProtectedRoute>
        ),
      },
      {
        path: "customers/add",
        element: (
          <ProtectedRoute
            permission={{ module: "customers", action: "create" }}
          >
            <CustomerAdd mode="add" />
          </ProtectedRoute>
        ),
      },
      {
        path: "customers/:id/edit",
        element: (
          <ProtectedRoute permission={{ module: "customers", action: "edit" }}>
            <CustomerAdd mode="edit" />
          </ProtectedRoute>
        ),
      },

      {
        path: "vendors",
        element: (
          <ProtectedRoute permission={{ module: "vendors", action: "view" }}>
            <Vendors />
          </ProtectedRoute>
        ),
      },
      {
        path: "vendors/add",
        element: (
          <ProtectedRoute permission={{ module: "vendors", action: "create" }}>
            <VendorsForm mode="add" />
          </ProtectedRoute>
        ),
      },
      {
        path: "vendors/:id/edit",
        element: (
          <ProtectedRoute permission={{ module: "vendors", action: "edit" }}>
            <VendorsForm mode="edit" />
          </ProtectedRoute>
        ),
      },

      {
        path: "containers",
        element: (
          <ProtectedRoute permission={{ module: "containers", action: "view" }}>
            <ContainerForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "containers/release",
        element: (
          <ProtectedRoute permission={{ module: "release", action: "view" }}>
            <ContainerReleases />
          </ProtectedRoute>
        ),
      },

      {
        path: "orders",
        element: (
          <ProtectedRoute permission={{ module: "orders", action: "view" }}>
            <Orders />
          </ProtectedRoute>
        ),
      },
      {
        path: "orders/add",
        element: (
          <ProtectedRoute permission={{ module: "orders", action: "create" }}>
            <OrderForm mode="add" />
          </ProtectedRoute>
        ),
      },
      {
        path: "orders/:id/edit",
        element: (
          <ProtectedRoute permission={{ module: "orders", action: "edit" }}>
            <OrderForm mode="edit" />
          </ProtectedRoute>
        ),
      },

      {
        path: "consignments",
        element: (
          <ProtectedRoute
            permission={{ module: "consignments", action: "view" }}
          >
            <Consignments />
          </ProtectedRoute>
        ),
      },
      {
        path: "consignments/add",
        element: (
          <ProtectedRoute
            permission={{ module: "consignments", action: "create" }}
          >
            <AddConsignment mode="add" />
          </ProtectedRoute>
        ),
      },
      {
        path: "consignments/:id/edit",
        element: (
          <ProtectedRoute
            permission={{ module: "consignments", action: "edit" }}
          >
            <AddConsignment mode="edit" />
          </ProtectedRoute>
        ),
      },

      {
        path: "tracking",
        element: (
          <ProtectedRoute permission={{ module: "tracking", action: "view" }}>
            <TrackingPage />
          </ProtectedRoute>
        ),
      },

      {
        path: "tracking-history",
        element: (
          <ProtectedRoute
            permission={{ module: "order-tracking", action: "view" }}
          >
            <OrderTrackingPage />
          </ProtectedRoute>
        ),
      },

      {
        path: "notifications",
        element: (
          <ProtectedRoute
            permission={{ module: "notifications", action: "view" }}
          >
            <NotificationSettings />
          </ProtectedRoute>
        ),
      },

      {
        path: "users",
        element: (
          <ProtectedRoute permission={{ module: "users", action: "view" }}>
            <UsersManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "kyc",
        element: (
          <ProtectedRoute permission={{ module: "kyc", action: "view" }}>
            <KycCustomers />
          </ProtectedRoute>
        ),
      },
      {
        path: "kyc-logs",
        element: (
          <ProtectedRoute permission={{ module: "kyc-logs", action: "view" }}>
            <KycLogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "kyc-submission",
        element: (
          <ProtectedRoute
            permission={{ module: "kyc-submission-details", action: "view" }}
          >
            <KycCustomerDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "kyc-submissions",
        element: (
          <ProtectedRoute
            permission={{ module: "kyc-submissions", action: "view" }}
          >
            <KycSubmissionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "role-permissions",
        element: (
          <ProtectedRoute
            permission={{ module: "role-permissions", action: "view" }}
          >
            <RolePermissions />
          </ProtectedRoute>
        ),
      },
      // {
      //   path: "permissions",
      //   element: (
      //     <ProtectedRoute
      //       permission={{ module: "permissions", action: "view" }}
      //     >
      //       <PermissionEditor />
      //     </ProtectedRoute>
      //   ),
      // },
      {
        path: "admin",
        element: <Outlet />,
        children: [
          {
            path: "companies",
            element: (
              <ProtectedRoute
                permission={{ module: "companies", action: "view" }}
              >
                <CompaniesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "document-templates",
            element: (
              <ProtectedRoute
                permission={{ module: "document-templates", action: "view" }}
              >
                <DocumentTemplatesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "payment-types",
            element: (
              <ProtectedRoute
                permission={{ module: "payment-types", action: "view" }}
              >
                <PaymentTypes />
              </ProtectedRoute>
            ),
          },
          {
            path: "categories",
            element: (
              <ProtectedRoute
                permission={{ module: "categories", action: "view" }}
              >
                <Categories />
              </ProtectedRoute>
            ),
          },
          {
            path: "vessels",
            element: (
              <ProtectedRoute
                permission={{ module: "vessels", action: "view" }}
              >
                <Vessels />
              </ProtectedRoute>
            ),
          },
          {
            path: "places",
            element: (
              <ProtectedRoute permission={{ module: "places", action: "view" }}>
                <Places />
              </ProtectedRoute>
            ),
          },
          {
            path: "banks",
            element: (
              <ProtectedRoute permission={{ module: "banks", action: "view" }}>
                <Banks />
              </ProtectedRoute>
            ),
          },
          {
            path: "third-parties",
            element: (
              <ProtectedRoute
                permission={{ module: "third-parties", action: "view" }}
              >
                <ThirdParties />
              </ProtectedRoute>
            ),
          },
          {
            path: "barcode-print",
            element: (
              <ProtectedRoute
                permission={{ module: "barcode-print", action: "view" }}
              >
                <BarcodePrintTest />
              </ProtectedRoute>
            ),
          },
          {
            path: "eta-setup",
            element: (
              <ProtectedRoute
                permission={{ module: "eta-setup", action: "view" }}
              >
                <StatusesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "bug-report",
            element: (
              <ProtectedRoute
                permission={{ module: "bug-report", action: "view" }}
              >
                <BugReportPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <AppProvider>
      <LoadingProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
          <ToastContainer stacked position="bottom-right" theme="dark" />
        </ThemeProvider>
      </LoadingProvider>
    </AppProvider>
  </AuthProvider>,
);
