// src/pages/Dashboard.jsx
import React from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Box, Typography, Paper, Grid, Chip, Tooltip as MuiTooltip,
  CircularProgress, Card, CardContent, CardHeader
} from "@mui/material";
import {Avatar} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";

// Sample data (you can replace with real API data later)
const salesSummary = [
  { title: "$1K", subtitle: "Customers", change: "+15%", module: "customers" },
  { title: "300", subtitle: "Vendors", change: "+10%", module: "vendors" },
  { title: "5", subtitle: "Containers", change: "-2%", module: "containers" },
  { title: "8", subtitle: "Orders", change: "+6%", module: "orders" },
];

const visitorInsightsData = [ /* ... your data ... */ ];
const revenueData = [ /* ... */ ];
const satisfactionData = [ /* ... */ ];
const targetRealityData = [ /* ... */ ];

export default function Dashboard() {
  const { user, permissions, loading, can } = useAuth();
  const { mode } = useThemeContext();
console.log("userrere",user,permissions, loading, can)
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const bg = mode === "dark" ? "#0f172a" : "#f8fafc";
  const cardBg = mode === "dark" ? "#1e293b" : "#ffffff";
  const textColor = mode === "dark" ? "#e2e8f0" : "#1e293b";
  const accent = "#f58220";

  // Helper to show what permissions user has for a module
  const getPermissionBadge = (module) => {
    if (!can(module, 'view')) return null;
    const actions = permissions[module] || [];
    return (
      <MuiTooltip title={`Access: ${actions.join(", ") || "view only"}`}>
        <Chip
          size="small"
          label={actions.length > 0 ? `${actions.length} perms` : "View"}
          color="success"
          variant="outlined"
          sx={{ ml: 1, fontSize: '0.7rem' }}
        />
      </MuiTooltip>
    );
  };

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      bgcolor: bg, 
      minHeight: "100vh", 
      color: textColor 
    }}>
      {/* Header with role indicator */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard Overview
        </Typography>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              avatar={<Avatar sx={{ bgcolor: accent }}>{user.email?.[0]?.toUpperCase()}</Avatar>}
              label={`${user.role?.toUpperCase() || 'User'}`}
              color="primary"
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Sales Summary Cards – only show if permitted */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {salesSummary.map((item, index) => {
          if (!can(item.module, 'view')) return null;

          return (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                elevation={3}
                sx={{ 
                  bgcolor: cardBg,
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {item.subtitle}
                    </Typography>
                    {getPermissionBadge(item.module)}
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color={accent}>
                    {item.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mt: 1,
                      color: item.change.startsWith('+') ? 'success.main' : 'error.main' 
                    }}
                  >
                    {item.change} this month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Charts Section – conditionally shown */}
      <Grid container spacing={3}>
        {/* Visitor Insights */}
        {can('dashboard', 'view') && (
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ bgcolor: cardBg, borderRadius: 2 }}>
              <CardHeader 
                title="Visitor Insights" 
                action={getPermissionBadge('dashboard')}
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={visitorInsightsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={mode === "dark" ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="month" stroke={textColor} />
                    <YAxis stroke={textColor} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="legal" stroke="#9b59b6" />
                    <Line type="monotone" dataKey="new" stroke="#e74c3c" />
                    <Line type="monotone" dataKey="unique" stroke="#27ae60" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Add other charts with similar can() checks */}
        {/* Example: Total Revenue */}
        {can('orders', 'view') && (
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ bgcolor: cardBg, borderRadius: 2 }}>
              <CardHeader title="Revenue Breakdown" action={getPermissionBadge('orders')} />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={mode === "dark" ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="day" stroke={textColor} />
                    <YAxis stroke={textColor} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="online" fill="#3498db" />
                    <Bar dataKey="offline" fill="#2ecc71" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* You can continue adding other charts with can() checks */}
      </Grid>

      {/* Quick permission summary (optional – for debugging or user awareness) */}
      {/* {user && (
        <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Your Current Permissions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(permissions).map(([module, actions]) => (
              <Chip
                key={module}
                label={`${module}: ${actions.join(', ')}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
            {Object.keys(permissions).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No specific permissions loaded (falling back to role-based access)
              </Typography>
            )}
          </Box>
        </Box>
      )} */}
    </Box>
  );
}