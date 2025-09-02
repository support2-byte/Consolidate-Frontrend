import { Outlet, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./api";
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton,
  Box, CssBaseline, ListItemText, IconButton
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

const drawerWidth = 220;

export default function App() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/auth/me").then(r => setUser(r.data.user)).catch(() => { });
  }, []);

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    nav("/login");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Consolidate Admin</Typography>
          {user && <IconButton color="inherit" onClick={logout}><LogoutIcon /></IconButton>}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
            background: "linear-gradient(180deg, #1e293b, #0f172a)",
            color: "#fff",
          },
        }}
      >
        <Toolbar />
        <List>
          {user ? (
            <>
              <ListItemButton component={Link} to="/"><ListItemText primary="Dashboard" /></ListItemButton>
              {/* <ListItemButton component={Link} to="/customers"><ListItemText primary="Customers" /></ListItemButton>
              <ListItemButton component={Link} to="/vendors"><ListItemText primary="Vendors" /></ListItemButton>
              <ListItemButton component={Link} to="/containers"><ListItemText primary="Containers" /></ListItemButton>
              <ListItemButton component={Link} to="/orders"><ListItemText primary="Orders" /></ListItemButton>
              <ListItemButton component={Link} to="/consignments"><ListItemText primary="Consignments" /></ListItemButton> */}
            </>
          ) : (
            <>
              <ListItemButton component={Link} to="/login"><ListItemText primary="Login" /></ListItemButton>
              <ListItemButton component={Link} to="/register"><ListItemText primary="Register" /></ListItemButton>
            </>
          )}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, }}>
        <Toolbar />
        <Outlet context={{ user, setUser }} />
      </Box>
    </Box>
  );
}
