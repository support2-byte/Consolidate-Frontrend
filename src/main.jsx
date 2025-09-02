import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Protected from "./routes/Protected";
import Customers from "./pages/Customers";
import Vendors from "./pages/Vendors";
import Containers from "./pages/Containers";
import Orders from "./pages/Orders";
import Consignments from "./pages/Consignments";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import DashboardCharts from "./pages/DashboardCharts";
const theme = createTheme({
  palette: {
    mode: "dark",  // Enable dark mode
    primary: {
      main: "#6366f1",  // Indigo
    },
    secondary: {
      main: "#06b6d4",  // Cyan
    },
    background: {
      default: "#0f172a", // Dark navy background
      paper: "#1e293b",   // Cards, sidebar
    },
    text: {
      primary: "#ffffff",
      secondary: "#94a3b8",
    },
    error: {
      main: "#ef4444",
    },
    success: {
      main: "#22c55e",
    },
    warning: {
      main: "#facc15",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          backgroundImage: "linear-gradient(145deg, #1e293b, #0f172a)",
        },
      },
    },
  },
});

const router = createBrowserRouter([
  { 
    path: "/", 
    element: <App />, 
    children: [
      { index: true, element: <Protected><DashboardCharts /></Protected> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "customers", element: <Protected><Customers/></Protected> },
      { path: "vendors", element: <Protected><Vendors/></Protected> },
      { path: "containers", element: <Protected><Containers/></Protected> },
      { path: "orders", element: <Protected><Orders/></Protected> },
      { path: "consignments", element: <Protected><Consignments/></Protected> },
    ]
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
