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
import AddConsignment from "./pages/Consignments/AddConsignment";
import Consignments from "./pages/Consignments";
import AddCustomer from "./pages/AddCustomer";
import AddVendor from "./pages/AddVendor";  
import TrackingPage from "./pages/Orders/TrackingPage";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import OrderForm from "./pages/Orders/AddOrder";
import PaymentTypes from "./pages/SystemData/PaymentTypes";
import Categories from "./pages/SystemData/Categories";
import Vessels from "./pages/SystemData/Vessels";  
import Places from "./pages/SystemData/Places";
import Banks from "./pages/SystemData/Banks";
import ThirdParties from "./pages/SystemData/ThirdParties";
import BarcodePrintTest from "./pages/SystemData/BarcodePrintTest";
import Slide from "@mui/material/Slide"; // Add this import for MUI Slide

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>; // while checking session
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Simple inline wrapper for demonstration (or import your AnimatedSlideWrapper from earlier)
const AnimatedSlideWrapper = ({ children, direction = "up", timeout = 1000 }) => (
  <Slide direction={direction} in={true} timeout={timeout}>
    {children}
  </Slide>
);

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<AnimatedSlideWrapper><DashboardCharts /></AnimatedSlideWrapper>} />
              <Route path="customers" element={<AnimatedSlideWrapper><Customers /></AnimatedSlideWrapper>} />
              <Route path="vendors" element={<AnimatedSlideWrapper><Vendors /></AnimatedSlideWrapper>} />
              <Route path="orders" element={<AnimatedSlideWrapper><Orders /></AnimatedSlideWrapper>} />
              <Route path="/orders/add" element={<AnimatedSlideWrapper><OrderForm mode="add" /></AnimatedSlideWrapper>} />
              <Route path="/customers/add" element={<AnimatedSlideWrapper><AddCustomer mode="add" /></AnimatedSlideWrapper>} />
              <Route path="/customers/:id/edit" element={<AnimatedSlideWrapper><AddCustomer mode="edit" /></AnimatedSlideWrapper>} />
              <Route path="/vendors/add" element={<AnimatedSlideWrapper><AddVendor mode="add" /></AnimatedSlideWrapper>} />
              <Route path="/vendors/:id/edit" element={<AnimatedSlideWrapper><AddVendor mode="edit" /></AnimatedSlideWrapper>} />
              {/* <Route path="/containers" element={<Containers mode="edit" />} /> */}
              <Route path="/containers" element={<AnimatedSlideWrapper><AddContainers /></AnimatedSlideWrapper>} />
              <Route path="/tracking" element={<AnimatedSlideWrapper><TrackingPage /></AnimatedSlideWrapper>} />
              <Route path="/consignments" element={<AnimatedSlideWrapper><Consignments /></AnimatedSlideWrapper>} /> 
              <Route path="/consignments/add" element={<AnimatedSlideWrapper><AddConsignment mode="add" /></AnimatedSlideWrapper>} />
              <Route path="/consignments/:id/edit" element={<AnimatedSlideWrapper><AddConsignment mode="edit" /></AnimatedSlideWrapper>} />
              <Route path="/admin/payment-types" element={<AnimatedSlideWrapper><PaymentTypes /></AnimatedSlideWrapper>} />
              <Route path="/admin/categories" element={<AnimatedSlideWrapper><Categories /></AnimatedSlideWrapper>} />
              <Route path="/admin/vessels" element={<AnimatedSlideWrapper><Vessels /></AnimatedSlideWrapper>} />
              <Route path="/admin/places" element={<AnimatedSlideWrapper><Places /></AnimatedSlideWrapper>} />
              <Route path="/admin/banks" element={<AnimatedSlideWrapper><Banks /></AnimatedSlideWrapper>} />
              <Route path="/admin/third-parties" element={<AnimatedSlideWrapper><ThirdParties /></AnimatedSlideWrapper>} />
              <Route path="/admin/barcode-print" element={<AnimatedSlideWrapper><BarcodePrintTest /></AnimatedSlideWrapper>} />
              {/* <Route path="/containers/add" element={<AddContainers />} /> */}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </LocalizationProvider>
  );
}