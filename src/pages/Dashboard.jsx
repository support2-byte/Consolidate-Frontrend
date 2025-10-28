import { Outlet, Link, useLocation } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, CssBaseline, Box, IconButton, Divider, Container,
  Collapse, ListSubheader, Tooltip, Fade
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
import Accessibility from "@mui/icons-material/Accessibility";
import { useState } from "react";
import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const expandedWidth = 260;
const collapsedWidth = 80;

export default function DashboardLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(true);
  const { mode, toggleTheme } = useThemeContext();
  const { user, logout } = useAuth();

  const tabs = [
    { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
    { label: "Customers", path: "/customers", icon: <PeopleIcon /> },
    { label: "Vendors", path: "/vendors", icon: <Accessibility /> },
    { label: "Containers", path: "/containers", icon: <LocalShippingIcon /> },
    { label: "Orders", path: "/orders", icon: <ShoppingCartIcon /> },
    { label: "Consignments", path: "/consignments", icon: <LocalShippingIcon /> },
  ];

  const adminSubItems = [
    { text: "Payment Types", icon: <PaymentIcon />, path: "/admin/payment-types" },
    { text: "Categories", icon: <CategoryIcon />, path: "/admin/categories" },
    { text: "Vessels", icon: <DirectionsBoatIcon />, path: "/admin/vessels" },
    { text: "Places", icon: <LocationOnIcon />, path: "/admin/places" },
    { text: "Banks", icon: <AccountBalanceIcon />, path: "/admin/banks" },
    { text: "3rd Parties", icon: <PeopleIcon />, path: "/admin/third-parties" },
  ];

  const handleAdminClick = () => {
    setOpenAdmin(!openAdmin);
  };

  // Reusable NavItem Component for simplification
  const NavItem = ({ item, selected, collapsed }) => (
    <Tooltip title={collapsed ? item.label : ""} placement="right" arrow>
      <ListItemButton
        component={Link}
        to={item.path}
        selected={selected}
        sx={{
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 2,
          mx: 1,
          my: 0.5,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&.Mui-selected": {
            backgroundColor: "#f58220",
            color: "white",
            boxShadow: 2,
            transform: "scale(1.02)",
          },
          "&:hover": {
            backgroundColor: mode === "dark" ? "#334155" : "#f0f9ff",
            color: "#f58220",
            transform: "translateX(4px)",
            boxShadow: 1,
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: collapsed ? 0 : 2.5,
            color: "inherit",
            transition: "all 0.3s ease",
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              sx: { fontWeight: "medium", color: "inherit", opacity: 0, animation: "fadeIn 0.3s ease forwards" },
            }}
            sx={{ opacity: 0, animation: "fadeIn 0.3s ease forwards" }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  );

  // Define fadeIn keyframe for CSS animation
  const useStyles = () => ({
    "@keyframes fadeIn": {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
  });

  // Reusable SubNavItem Component
  const SubNavItem = ({ subItem, selected, mode }) => (
    <Tooltip title={subItem.text} placement="right" arrow>
      <ListItemButton
        component={Link}
        to={subItem.path}
        selected={selected}
        sx={{
          pl: 4,
          borderRadius: 1.5,
          mx: 0.5,
          my: 0.25,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&.Mui-selected": {
            backgroundColor: "#f58220",
            color: "white",
            boxShadow: 1,
          },
          "&:hover": {
            backgroundColor: mode === "dark" ? "#334155" : "#f0f9ff",
            color: "#f58220",
            transform: "translateX(2px)",
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
          {subItem.icon}
        </ListItemIcon>
        <ListItemText
          primary={subItem.text}
          primaryTypographyProps={{
            sx: { fontSize: "0.875rem", color: "inherit", fontWeight: "normal", opacity: 0, animation: "fadeIn 0.2s ease forwards" },
          }}
          sx={{ opacity: 0, animation: "fadeIn 0.2s ease forwards" }}
        />
      </ListItemButton>
    </Tooltip>
  );

  const drawerContent = (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%",
      ...useStyles(), // Apply keyframes
    }}>
      <Toolbar sx={{ justifyContent: collapsed ? "center" : "flex-start" }}>
        <div> {/* Wrapper for stable ref */}
          <Fade in timeout={500}>
            <Box
              component="img"
              src={mode === "dark" ? "./logo.png" : "./logo-2.png"}
              alt="Logo"
              sx={{
                height: 45,
                width: collapsed ? 45 : 200,
                objectFit: "contain",
                mx: "auto",
                borderRadius: 1,
                transition: "all 0.4s ease",
                cursor: "pointer",
              }}
            />
          </Fade>
        </div>
      </Toolbar>
      <Divider sx={{ borderColor: mode === "dark" ? "#334155" : "#e5e7eb" }} />

      <List sx={{ flexGrow: 1, py: 1 }}>
        {tabs.map((tab, index) => (
          <div key={tab.label}> {/* Wrapper for stable ref */}
            <Fade in timeout={300 + (100 * index)} mountOnEnter unmountOnExit>
              <div>
                <NavItem
                  item={tab}
                  selected={location.pathname === tab.path}
                  collapsed={collapsed}
                />
              </div>
            </Fade>
          </div>
        ))}

        {/* Admin Panel */}
        <ListItemButton
          onClick={handleAdminClick}
          sx={{
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 2,
            mx: 1,
            my: 1,
            mt: 2,
            transition: "all 0.3s ease",
            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(245,130,32,0.1)",
            "&:hover": {
              backgroundColor: mode === "dark" ? "#334155" : "#f0f9ff",
              transform: "translateX(4px)",
              boxShadow: 1,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2.5, color: "#f58220" }}>
            <SettingsIcon />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary="Admin Panel"
              primaryTypographyProps={{
                sx: { fontWeight: "bold", color: mode === "dark" ? "#fff" : "#000", opacity: 0, animation: "fadeIn 0.3s ease forwards" },
              }}
              sx={{ opacity: 0, animation: "fadeIn 0.3s ease forwards" }}
            />
          )}
          {!collapsed && (
            <Box sx={{ ml: "auto", mr: 1, color: "#f58220" }}>
              {openAdmin ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          )}
        </ListItemButton>

        {/* Collapsible Admin Sub-Items */}
        <Collapse in={openAdmin && !collapsed} timeout="auto" unmountOnExit sx={{ pl: 2 }}>
          <List component="div" disablePadding>
            {adminSubItems.map((subItem, index) => (
              <div key={subItem.text}> {/* Wrapper for stable ref */}
                <Fade in={openAdmin} timeout={200 + (100 * index)} mountOnEnter unmountOnExit>
                  <div>
                    <SubNavItem
                      subItem={subItem}
                      selected={location.pathname === subItem.path}
                      mode={mode}
                    />
                  </div>
                </Fade>
              </div>
            ))}
          </List>
        </Collapse>
      </List>

      <Divider sx={{ borderColor: mode === "dark" ? "#334155" : "#e5e7eb" }} />
      <Box sx={{ textAlign: "center", py: 2, px: 1 }}>
        <Tooltip title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"} arrow>
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            sx={{
              color: mode === "dark" ? "#94a3b8" : "#6b7280",
              "&:hover": { backgroundColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)" },
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* Top AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: `linear-gradient(135deg, ${mode === "dark" ? "#1e293b" : "#f58220"} 0%, ${mode === "dark" ? "#334155" : "#e65100"} 100%)`,
          color: "#fff",
          boxShadow: 3,
          ml: { sm: collapsed ? `${collapsedWidth}px` : `${expandedWidth}px` },
          width: { sm: `calc(100% - ${collapsed ? collapsedWidth : expandedWidth}px)` },
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                letterSpacing: 1,
                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              Consolidate Dashboard
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`} arrow>
              <IconButton onClick={toggleTheme} color="inherit" sx={{ borderRadius: "50%" }}>
                {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            {user && (
              <Tooltip title="Logout" arrow>
                <IconButton
                  color="inherit"
                  onClick={logout}
                  sx={{
                    borderRadius: "50%",
                    transition: "all 0.2s ease",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.1)", transform: "scale(1.05)" },
                  }}
                >
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            width: collapsed ? collapsedWidth : expandedWidth,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflowX: "hidden",
            boxSizing: "border-box",
            background: mode === "dark" ? "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" : "linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)",
            borderRight: `1px solid ${mode === "dark" ? "#334155" : "#e5e7eb"}`,
            boxShadow: mode === "dark" ? "2px 0 8px rgba(0,0,0,0.3)" : "2px 0 8px rgba(0,0,0,0.05)",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Sidebar */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            width: expandedWidth,
            boxSizing: "border-box",
            background: mode === "dark" ? "#0f172a" : "#f9fafb",
            borderRight: `1px solid ${mode === "dark" ? "#334155" : "#e5e7eb"}`,
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
          background: mode === "dark" 
            ? "linear-gradient(135deg, #1e293b 0%, #334155 100%)" 
            : "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
          minHeight: "100vh",
          transition: "all 0.3s ease",
          ml: { sm: collapsed ? `${collapsedWidth}px` : `${expandedWidth}px` },
        }}
      >
        <Toolbar sx={{ minHeight: 72 }} /> {/* Offset for AppBar */}
        <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
          <div> {/* Wrapper for stable ref */}
            <Fade in timeout={800} mountOnEnter unmountOnExit>
              <div>
                <Outlet />
              </div>
            </Fade>
          </div>
        </Container>
      </Box>
    </Box>
  );
}