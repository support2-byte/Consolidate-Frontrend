import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, CssBaseline, Box, IconButton, Divider, Container,
  Collapse, ListSubheader
} from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import StoreIcon from "@mui/icons-material/Store";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SettingsIcon from "@mui/icons-material/Settings";
import PaymentIcon from "@mui/icons-material/Payment";
import CategoryIcon from "@mui/icons-material/Category";
import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PrintIcon from "@mui/icons-material/Print";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Accessibility } from "@mui/icons-material";

const expandedWidth = 240;
const collapsedWidth = 72;

export default function DashboardLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(true); // New state for Admin collapse
  const { mode, toggleTheme } = useThemeContext();
  const { user, logout } = useAuth();

  const tabs = [
    { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
    { label: "Customers", path: "/customers", icon: <PeopleIcon /> },
    { label: "Vendors", path: "/vendors", icon: <Accessibility /> },
    { label: "Containers", path: "/containers", icon: <LocalShippingIcon /> },
    { label: "Orders", path: "/orders", icon: <ShoppingCartIcon /> },
    // { label: "Tracking", path: "/tracking", icon: <TrackChangesIcon /> },
    { label: "Consignments", path: "/consignments", icon: <LocalShippingIcon /> },
  ];

  // New Admin sub-items
  const adminSubItems = [
    { text: "Payment Types", icon: <PaymentIcon />, path: "/admin/payment-types" },
    { text: "Categories", icon: <CategoryIcon />, path: "/admin/categories" },
    { text: "Vessels", icon: <DirectionsBoatIcon />, path: "/admin/vessels" },
    { text: "Places", icon: <LocationOnIcon />, path: "/admin/places" },
    { text: "Banks", icon: <AccountBalanceIcon />, path: "/admin/banks" },
    { text: "3rd Parties", icon: <PeopleIcon />, path: "/admin/third-parties" },
    // { text: "Barcode Print Test", icon: <PrintIcon />, path: "/admin/barcode-print" },
  ];

  const handleAdminClick = () => {
    setOpenAdmin(!openAdmin);
  };

  const drawerContent = (
    <Box display="flex" flexDirection="column" height="100%">
      <Toolbar sx={{ justifyContent: collapsed ? "center" : "flex-start" }}>
        <Box
          component="img"
          src={mode === "dark" ? "./logo.png" : "./logo-2.png"}
          alt="Logo"
          sx={{
            height: 40,
            width: collapsed ? 40 : 190,
            objectFit: "contain",
            display: "block",
            mx: "auto",
            transition: "all 0.3s ease",
          }}
        />
      </Toolbar>
      <Divider />

      {/* Menu Items */}
      <List sx={{ flexGrow: 1 }}>
        {tabs.map((tab) => (
          <ListItemButton
            key={tab.label}
            component={Link}
            to={tab.path}
            selected={location.pathname === tab.path}
            sx={{
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 8,
              margin: "2px 8px",
              transition: "all 0.2s ease-in-out",
              "&.Mui-selected": {
                backgroundColor: "#f58220",
                color: "#ff4d4d",
                margin: "3px 5px",
                borderRadius: 15,
              },
              "&:hover": {
                backgroundColor: "#ffebee",
                color: "#ff4d4d",
                transform: "translateX(4px)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: collapsed ? 0 : 2,
                color: mode === "dark" ? "#fff" : "#000",
              }}
            >
              {tab.icon}
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={tab.label}
                primaryTypographyProps={{
                  sx: { color: mode === "dark" ? "#fff" : "#000" },
                }}
              />
            )}
          </ListItemButton>
        ))}

        {/* New Admin Panel Section */}
        <ListItemButton
          onClick={handleAdminClick}
          sx={{
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 8,
            margin: "2px 8px",
            transition: "all 0.2s ease-in-out",
            mt: 2,
            "&:hover": {
              backgroundColor: "#e3f2fd",
              transform: "translateX(4px)",
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: collapsed ? 0 : 2,
              color: mode === "dark" ? "#fff" : "#f58220",
            }}
          >
            <SettingsIcon />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary="Admin Panel"
              primaryTypographyProps={{
                sx: { 
                  color: mode === "dark" ? "#fff" : "#000",
                  fontWeight: "medium",
                },
              }}
            />
          )}
          {!collapsed && (
            <Box sx={{ ml: "auto", mr: 1 }}>
              {openAdmin ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          )}
        </ListItemButton>

        {/* Collapsible Admin Sub-Items */}
        {!collapsed && (
          <Collapse in={openAdmin} timeout="auto" unmountOnExit sx={{ pl: 4 }}>
            <List component="div" disablePadding>
              {adminSubItems.map((subItem) => (
                <ListItemButton
                  key={subItem.text}
                  component={Link}
                  to={subItem.path}
                  selected={location.pathname === subItem.path}
                  sx={{
                    justifyContent: "flex-start",
                    borderRadius: 6,
                    margin: "1px 4px",
                    transition: "all 0.2s ease-in-out",
                    "&.Mui-selected": {
                      backgroundColor: "#f58220",
                      color: "#ff4d4d",
                      borderRadius: 12,
                    },
                    "&:hover": {
                      backgroundColor: "#ffebee",
                      color: "#ff4d4d",
                      transform: "translateX(2px)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: mode === "dark" ? "#fff" : "#000" }}>
                    {subItem.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={subItem.text}
                    primaryTypographyProps={{
                      sx: { 
                        fontSize: "0.875rem",
                        color: mode === "dark" ? "#fff" : "#000",
                      },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        )}
      </List>

      <Divider />
      <Box textAlign="center" py={1}>
        <IconButton onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Top Navbar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: mode === "dark" ? "#1e293b" : "#f58220",
          color: "#fff",
          ml: { sm: collapsed ? `${collapsedWidth}px` : `${expandedWidth}px` },
          width: { sm: `calc(100% - ${collapsed ? collapsedWidth : expandedWidth}px)` },
          transition: "all 0.3s ease",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Consolidate Dashboard
          </Typography>

          <IconButton onClick={toggleTheme} color="inherit">
            {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          {user && (
            <IconButton color="inherit" onClick={logout}>
              <LogoutIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            width: collapsed ? collapsedWidth : expandedWidth,
            transition: "all 0.3s ease",
            overflowX: "hidden",
            boxSizing: "border-box",
            backgroundColor: mode === "dark" ? "#0f172a" : "#f9fafb",
            color: mode === "dark" ? "#fff" : "#000",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            width: expandedWidth,
            boxSizing: "border-box",
            backgroundColor: mode === "dark" ? "#0f172a" : "#f9fafb",
            color: mode === "dark" ? "#fff" : "#000",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: mode === "dark" ? "#1e293b" : "#f3f4f6",
          minHeight: "100vh",
          p: 3,
          transition: "all 0.3s ease",
          ml: { sm: collapsed ? `${collapsedWidth}px` : `${expandedWidth}px` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}