import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout"; // your sidebar layout
import DashboardCharts from "./pages/DashboardCharts";
import Customers from "./pages/Customers";
import Vendors from "./pages/Vendors/Vendors";
import Containers from "./pages/Containers/Containers";
import AddContainers from "./pages/Containers/AddContainer";
import Orders from "./pages/Orders/Orders";
import Consignments from "./pages/Consignments";
import AddCustomer from "./pages/AddCustomer";
import AddVendor from "./pages/AddVendor";  
import TrackingPage from "./pages/Orders/TrackingPage";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import OrderForm from "./pages/Orders/AddOrder";
function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>; // while checking session
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="Date Hired"
    value={dateHired}
    onChange={(newValue) => setDateHired(newValue)}
  />
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
              <Route path="orders" element={<Orders />} />
               <Route path="/orders/add" element={<OrderForm mode="add" />} />
            <Route path="/customers/add" element={<AddCustomer mode="add" />} />
            <Route path="/customers/:id/edit" element={<AddCustomer mode="edit" />} />
            <Route path="/vendors/add" element={<AddVendor mode="add" />} />
            <Route path="/vendors/:id/edit" element={<AddVendor mode="edit" />} />
              {/* <Route path="/containers" element={<Containers mode="edit" />} /> */}
            <Route path="/containers" element={<AddContainers />} />
            <Route path="/tracking" element={<TrackingPage />} />
             {/* <Route path="/containers/add" element={<AddContainers />} /> */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    
    </LocalizationProvider>
  );
}
