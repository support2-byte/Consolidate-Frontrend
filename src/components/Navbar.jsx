// src/components/Navbar.jsx (or wherever you keep shared components)
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Tooltip,
} from "@mui/material";
import {
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { mode, toggleTheme } = useThemeContext();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate("/login");
  };

  return (
    <AppBar
      position="static"
      elevation={2}
      sx={{
        background: mode === "dark"
          ? "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)"
          : "linear-gradient(90deg, #ffffff 0%, #f8fafc 100%)",
        color: mode === "dark" ? "#e2e8f0" : "#1e293b",
        borderBottom: `1px solid ${mode === "dark" ? "#334155" : "#e2e8f0"}`,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 4 } }}>
        {/* Left: Title / Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              letterSpacing: 1,
              background: "linear-gradient(90deg, #f58220, #e65100)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: { xs: "none", sm: "block" },
            }}
          >
            Consolidate
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 500,
              color: mode === "dark" ? "#94a3b8" : "#6b7280",
              display: { xs: "none", sm: "block" },
            }}
          >
            Dashboard
          </Typography>
        </Box>

        {/* Right: Theme toggle + User menu */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`}>
            <IconButton
              onClick={toggleTheme}
              color="inherit"
              size="large"
              sx={{
                transition: "transform 0.3s",
                "&:hover": { transform: "rotate(20deg)" },
              }}
            >
              {mode === "dark" ? (
                <Brightness7Icon sx={{ color: "#fbbf24" }} />
              ) : (
                <Brightness4Icon sx={{ color: "#f58220" }} />
              )}
            </IconButton>
          </Tooltip>

          {/* User Avatar & Dropdown */}
          {user && (
            <>
              <Tooltip title={user.email}>
                <IconButton
                  onClick={handleMenu}
                  size="large"
                  sx={{ p: 0 }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "#f58220",
                      width: 40,
                      height: 40,
                      fontWeight: "bold",
                      transition: "all 0.3s",
                      "&:hover": { bgcolor: "#e65100" },
                    }}
                  >
                    {user.email?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>

<Menu
  anchorEl={profileAnchorEl}
  open={open}
  onClose={handleProfileClose}
  disablePortal                 // ← Fixes aria-hidden + focus warning
  anchorOrigin={{
    vertical: "bottom",
    horizontal: "right",
  }}
  transformOrigin={{
    vertical: "top",
    horizontal: "right",
  }}
  PaperProps={{
    elevation: 4,
    sx: {
      mt: 1.5,
      minWidth: 200,
      borderRadius: 2,
      overflow: "hidden",
      boxShadow: mode === "dark" 
        ? "0 10px 30px rgba(0,0,0,0.6)" 
        : "0 10px 30px rgba(0,0,0,0.15)",
    },
  }}
  TransitionComponent={Fade}
  TransitionProps={{ timeout: 300 }}
>
  {/* Role Badge */}
  <MenuItem disabled sx={{ 
    fontWeight: "bold", 
    color: user.role === "admin" ? "#4caf50" : "#f58220",
    justifyContent: "center",
    py: 1.5,
    borderBottom: `1px solid ${mode === "dark" ? "#334155" : "#e0e0e0"}`
  }}>
    {user.role?.toUpperCase() || "User"}
  </MenuItem>

  {/* Email */}
  <MenuItem disabled sx={{ 
    fontSize: "0.875rem", 
    color: "text.secondary",
    justifyContent: "center",
    py: 1
  }}>
    {user.email}
  </MenuItem>

  <Divider />

  {/* Profile (optional – add later) */}
  <MenuItem onClick={() => {
    handleProfileClose();
    navigate("/profile"); // or wherever your profile page is
  }}>
    <PersonIcon fontSize="small" sx={{ mr: 1.5 }} />
    Profile
  </MenuItem>

  {/* Logout */}
  <MenuItem 
    onClick={handleLogoutClick}
    sx={{ 
      color: "error.main",
      fontWeight: 500,
      "&:hover": { bgcolor: "error.light" }
    }}
  >
    <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
    Logout
  </MenuItem>
</Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}