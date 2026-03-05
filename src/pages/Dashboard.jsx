// src/layouts/DashboardLayout.jsx
import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Box,
  IconButton,
  Divider,
  Container,
  Collapse,
  Tooltip,
  Slide,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  TrackChanges as TrackChangesIcon,
  LocalShipping as LocalShippingIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  Print as PrintIcon,
  CalendarMonth as CalendarMonthIcon,
  Category as CategoryIcon,
  DirectionsBoat as DirectionsBoatIcon,
  LocationOn as LocationOnIcon,
  Lock,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom"; // ← Added this import
import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import AdminResetPasswordDialog from "./ForgetPassword";

// Constants
const expandedWidth = 260;
const collapsedWidth = 80;

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeContext();
  const { user, logout, can } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(true);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [forgetPassword, setForgetPassword] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleProfileClick = (e) => setProfileAnchorEl(e.currentTarget);
  const handleProfileClose = () => setProfileAnchorEl(null);


  const handleForgetClose = () => setForgetPassword(false);

  const handleLogoutClick = () => {
    setProfileAnchorEl(null);
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate("/login");
  };

  // Main navigation items – filtered by permissions
  const navItems = [
    { label: "Dashboard", path: "/", icon: <DashboardIcon />, module: "dashboard" },
    { label: "Users", path: "/users", icon: <PersonIcon />, module: "users" },
    { text: "Permission Editor", icon: <PersonIcon />, path: "permissions", module: "permissions" },
    { label: "Customers", path: "/customers", icon: <PeopleIcon />, module: "customers" },
    { label: "Vendors", path: "/vendors", icon: <PeopleIcon />, module: "vendors" },
    { label: "Containers", path: "/containers", icon: <LocalShippingIcon />, module: "containers" },
    { label: "Orders", path: "/orders", icon: <ShoppingCartIcon />, module: "orders" },
    { label: "Consignments", path: "/consignments", icon: <LocalShippingIcon />, module: "consignments" },
    { label: "Tracking", path: "/tracking", icon: <TrackChangesIcon />, module: "tracking" },
  ].filter((item) => !item.module || can(item.module, "view"));

  // Admin sub-items – filtered by permissions
  const adminSubItems = [
    { text: "Payment Types", icon: <PaymentIcon />, path: "/admin/payment-types", module: "payment-types" },
    { text: "Categories", icon: <CategoryIcon />, path: "/admin/categories", module: "categories" },
    { text: "Vessels", icon: <DirectionsBoatIcon />, path: "/admin/vessels", module: "vessels" },
    { text: "Places", icon: <LocationOnIcon />, path: "/admin/places", module: "places" },
    { text: "Banks", icon: <AccountBalanceIcon />, path: "/admin/banks", module: "banks" },
    { text: "ETA Setup", icon: <CalendarMonthIcon />, path: "/admin/eta-setup", module: "eta-setup" },
    { text: "3rd Parties", icon: <PeopleIcon />, path: "/admin/third-parties", module: "third-parties" },
    { text: "Barcode Print", icon: <PrintIcon />, path: "/admin/barcode-print", module: "barcode-print" },
  ].filter((item) => !item.module || can(item.module, "view"));

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo / Header */}
      <Toolbar sx={{ justifyContent: collapsed ? "center" : "flex-start", minHeight: 72 }}>
        <Box
          component="img"
          src={mode === "dark" ? "/logo-dark.png" : "/logo.png"}
          alt="Logo"
          sx={{
            height: 50,
            width: collapsed ? 50 : 180,
            objectFit: "contain",
            transition: "all 0.3s ease",
          }}
        />
      </Toolbar>

      <Divider />

      {/* Main Navigation */}
      <List sx={{ flexGrow: 1, py: 1 }}>
        {navItems.map((item) => (
          <Tooltip key={item.path} title={collapsed ? item.label : ""} placement="right" arrow>
            <ListItemButton
              component={RouterLink}           // ← Fixed: use RouterLink
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                transition: "all 0.3s",
                "&.Mui-selected": {
                  backgroundColor: "#f58220",
                  color: "white",
                  boxShadow: 2,
                },
                "&:hover": {
                  backgroundColor: mode === "dark" ? "#334155" : "#f0f9ff",
                  color: "#f58220",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: "inherit" }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
          </Tooltip>
        ))}

        {/* Admin Section */}
        {can("settings", "view") && (   // ← changed from "admin" → more semantic if you have "settings" module
          <>
            <ListItemButton
              onClick={() => setOpenAdmin(!openAdmin)}
              sx={{
                mt: 2,
                mx: 1,
                borderRadius: 2,
                backgroundColor: openAdmin ? "rgba(245,130,32,0.12)" : "transparent",
              }}
            >
              <ListItemIcon sx={{ color: "#f58220" }}>
                <SettingsIcon />
              </ListItemIcon>
              {!collapsed && (
                <>
                  <ListItemText primary="Admin Settings" />
                  {openAdmin ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </>
              )}
            </ListItemButton>

            <Collapse in={openAdmin && !collapsed}>
              <List component="div" disablePadding>
                {adminSubItems.map((item) => (
                  <Tooltip key={item.path} title={collapsed ? item.text : ""} placement="right" arrow>
                    <ListItemButton
                      component={RouterLink}     // ← Fixed here too
                      to={item.path}
                      selected={location.pathname === item.path}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontSize: "0.9rem" }}
                      />
                    </ListItemButton>
                  </Tooltip>
                ))}
              </List>
            </Collapse>
          </>
        )}
      </List>

      {/* Footer Controls */}
      <Divider />
      <Box sx={{ p: 2, display: "flex", justifyContent: "center", gap: 2 }}>
        <Tooltip title="Toggle Theme">
          <IconButton onClick={toggleTheme} size="large">
            {mode === "dark" ? (
              <Brightness7Icon sx={{ color: "#fbbf24" }} />
            ) : (
              <Brightness4Icon sx={{ color: "#f58220" }} />
            )}
          </IconButton>
        </Tooltip>

        <Tooltip title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
          <IconButton onClick={() => setCollapsed(!collapsed)} size="large">
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: mode === "dark"
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          color: mode === "dark" ? "#e2e8f0" : "#1e293b",
          boxShadow: mode === "dark" ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.08)",
          transition: "all 0.3s",
          ml: { sm: collapsed ? `${collapsedWidth}px` : `${expandedWidth}px` },
          width: { sm: `calc(100% - ${collapsed ? collapsedWidth : expandedWidth}px)` },
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: "bold",
                letterSpacing: 1,
                background: "linear-gradient(90deg, #f58220, #e65100)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Consolidate
            </Typography>
          </Box>

          {/* Right side: User info + theme toggle */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`}>
              <IconButton onClick={toggleTheme} color="inherit">
                {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>

            {user && (
              <>
                <Tooltip title={user.email}>
                  <IconButton onClick={handleProfileClick} size="large" sx={{ p: 0 }}>
                    <Avatar
                      sx={{
                        bgcolor: "#f58220",
                        width: 40,
                        height: 40,
                        fontWeight: "bold",
                        transition: "all 0.3s",
                        "&:hover": { bgcolor: "#e65100", transform: "scale(1.1)" },
                      }}
                    >
                      {user.email?.charAt(0)?.toUpperCase()}

                    </Avatar>
                  </IconButton>
                  
                </Tooltip>

                <Menu
                  anchorEl={profileAnchorEl}
                  open={Boolean(profileAnchorEl)}
                  onClose={handleProfileClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  PaperProps={{
                    elevation: 4,
                    sx: { mt: 1.5, minWidth: 180, borderRadius: 2 },
                  }}
                >
                  <MenuItem disabled sx={{ fontWeight: "bold", color: "#f58220" }}>
                    {user.role?.toUpperCase() || "User"}
                  </MenuItem>
                  <MenuItem disabled sx={{ fontSize: "0.875rem" }}>
                    {user.email}
                  </MenuItem>
                  <Divider />

                        <MenuItem onClick={() => setForgetPassword(true)} sx={{ fontSize: "0.875rem" }}>
                  Reset Password
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogoutClick} sx={{ color: "error.main" }}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
<AdminResetPasswordDialog open={forgetPassword} targetUserEmail={user.email} onClose={handleForgetClose} />
      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          width: collapsed ? collapsedWidth : expandedWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: collapsed ? collapsedWidth : expandedWidth,
            transition: "width 0.3s",
            overflowX: "hidden",
            background: mode === "dark" ? "#0f172a" : "#f8fafc",
            borderRight: `1px solid ${mode === "dark" ? "#334155" : "#e2e8f0"}`,
            boxShadow: mode === "dark" ? "2px 0 15px rgba(0,0,0,0.5)" : "2px 0 15px rgba(0,0,0,0.08)",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer */}
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
            background: mode === "dark" ? "#0f172a" : "#f8fafc",
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
          p: { xs: 2, md: 4 },
          mt: { xs: 7, sm: 8 },
          // ml: { sm: collapsed ? `${collapsedWidth}px` : `${expandedWidth}px` },
          transition: "margin 0.3s",
          background: mode === "dark" ? "#0f172a" : "#f8fafc",
        }}
      >
        {/* <Container maxWidth="xl"> */}
          <Slide direction="up" in mountOnEnter unmountOnExit timeout={600}>
            <div>
              <Outlet />
            </div>
          </Slide>
        {/* </Container> */}
      </Box>

      {/* Logout Confirmation */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>Logout</DialogTitle>
        <DialogContent>
          Are you sure you want to log out?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmLogout} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}