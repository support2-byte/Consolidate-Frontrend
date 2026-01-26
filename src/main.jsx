import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/Dashboard";
import DashboardCharts from "./pages/DashboardCharts";
import Customers from "./pages/Customers/Customers";
import ContainerForm from "./pages/Containers/AddContainer";
import ProtectedRoute from "./routes/Protected";
import Vendors from "./pages/Vendors/Vendors";
import Orders from "./pages/Orders/Orders";
import { ThemeProvider as CustomThemeProvider, useThemeContext } from "./context/ThemeContext";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./context/AuthContext";
import CustomerAdd from "./pages/Customers/AddCustomer";
import Consignments from "./pages/Consignments/Consignments";
import AddConsignment from "./pages/Consignments/AddConsignment";
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

function ThemedApp({ children }) {
  const { mode } = useThemeContext();
 const theme = createTheme({
    palette: {
      mode,
      primary: { main: "#f58220" },
      secondary: { main: "#06b6d4" },
    },
    // Optional: you can influence density here too
    typography: {
      fontSize: 11,          // helps a lot with the "too big" feeling
    },
    spacing: 3,
  });

  return (
    <MuiThemeProvider theme={theme}>
           <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardCharts /> },
      { path: "customers", element: <Customers /> },
      { path: "vendors", element: <Vendors /> },
      { path: "/containers", element: <ContainerForm /> },
      { path: "orders", element: <Orders /> },
      { path: "/orders/add", element: <OrderForm mode="add" /> },
      { path: "/orders/:id/edit", element: <OrderForm mode="edit" /> },
      { path: "/tracking", element: <TrackingPage /> },
      { path: "consignments", element: <Consignments /> },
      { path: "/customers/add", element: <CustomerAdd mode="add" /> },
      { path: "/customers/:id/edit", element: <CustomerAdd mode="edit" /> },
      { path: "/vendors/add", element: <VendorsForm mode="add" /> },
      { path: "/vendors/:id/edit", element: <VendorsForm mode="edit" /> },
      { path: "/consignments/add", element: <AddConsignment mode="add" /> },
      { path: "/consignments/:id/edit", element: <AddConsignment mode="edit" /> },
      { path: "/admin/payment-types", element: <PaymentTypes /> },
      { path: "/admin/categories", element: <Categories /> },
      { path: "/admin/vessels", element: <Vessels /> },
      { path: "/admin/places", element: <Places /> },
      { path: "/admin/banks", element: <Banks /> },
      { path: "/admin/third-parties", element: <ThirdParties /> },
      { path: "/admin/barcode-print", element: <BarcodePrintTest /> },
      { path: "/admin/EtaSetupPage", element: <EtaSetupPage /> },

    ],
  },
]);

// 🟢 Removed StrictMode wrapper
ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <CustomThemeProvider>
      <ThemedApp>
        <RouterProvider router={router} />
      </ThemedApp>
    </CustomThemeProvider>
  </AuthProvider>
);
