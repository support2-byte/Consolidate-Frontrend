import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/Dashboard";   // 👈 renamed App -> DashboardLayout
import DashboardCharts from "./pages/DashboardCharts";
import Customers from "./pages/Customers";
import Vendors from "./pages/Vendors";
import Containers from "./pages/Containers";
import Orders from "./pages/Orders";
import Consignments from "./pages/Consignments";
import ProtectedRoute from "./routes/Protected";

import { ThemeProvider as CustomThemeProvider, useThemeContext } from "./context/ThemeContext";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./context/AuthContext";
// ✅ Theming wrapper
function ThemedApp({ children }) {
  const { mode } = useThemeContext();
  const theme = createTheme({
    palette: {
      mode,
      primary: { main: "#6366f1" },
      secondary: { main: "#06b6d4" },
    },
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
      { path: "containers", element: <Containers /> },
      { path: "orders", element: <Orders /> },
      { path: "consignments", element: <Consignments /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CustomThemeProvider>
        <ThemedApp>
          <RouterProvider router={router} />
        </ThemedApp>
      </CustomThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
