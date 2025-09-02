import { Outlet, Link, useLocation } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Drawer, List,
  ListItemButton, ListItemIcon, ListItemText,
  CssBaseline, Box, IconButton
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import StoreIcon from "@mui/icons-material/Store";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";

const drawerWidth = 240;

export default function App() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabs = [
    { label: "Customers", path: "/customers", icon: <PeopleIcon /> },
    { label: "Vendors", path: "/vendors", icon: <StoreIcon /> },
    { label: "Containers", path: "/containers", icon: <InventoryIcon /> },
    { label: "Orders", path: "/orders", icon: <ShoppingCartIcon /> },
    { label: "Consignments", path: "/consignments", icon: <LocalShippingIcon /> },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Consolidate Dashboard
        </Typography>
      </Toolbar>
      <List>
        {tabs.map((tab) => (
          <ListItemButton
            key={tab.label}
            component={Link}
            to={tab.path}
            selected={location.pathname === tab.path}
          >
            <ListItemIcon>{tab.icon}</ListItemIcon>
            <ListItemText primary={tab.label} />
          </ListItemButton>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {/* Top AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
        open
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
