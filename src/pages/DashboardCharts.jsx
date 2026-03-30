import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import {
  Package,
  Truck,
  Plane,
  Ship,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
  },
}));

const DashboardCharts = () => {
  const kpiData = [
    {
      title: "Total Shipments",
      value: "26,666",
      change: "+21.01%",
      trend: "up",
      icon: Package,
      color: "#f58220",
    },
    {
      title: "Out for Delivery",
      value: "6,500",
      change: "+21.01%",
      trend: "up",
      icon: Truck,
      color: "#f58220",
    },
    {
      title: "In Transit",
      value: "5,000",
      change: "+21.01%",
      trend: "up",
      icon: Plane,
      color: "#f58220",
    },
    {
      title: "Pending",
      value: "26,666",
      change: "-21.01%",
      trend: "down",
      icon: Ship,
      color: "#ef4444",
    },
  ];

  const recentShipments = [
    {
      id: "#3752584",
      status: "In Transit",
      statusColor: "#3b82f6",
      bgColor: "#eff6ff",
      address: "789 Front Street West, Toronto",
      eta: "Jan 27 - Feb 01",
      icon: Truck,
      progress: 65,
    },
    {
      id: "#3752584",
      status: "Out for Delivery",
      statusColor: "#8b5cf6",
      bgColor: "#f3e8ff",
      address: "789 Front Street West, Toronto",
      eta: "Jan 27 - Feb 01",
      icon: Plane,
      progress: 85,
    },
    {
      id: "#3752584",
      status: "Processing",
      statusColor: "#f59e0b",
      bgColor: "#fef3c7",
      address: "789 Front Street West, Toronto",
      eta: "Jan 27 - Feb 01",
      icon: Ship,
      progress: 35,
    },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="#1f2937">
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Welcome back, Daniel
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<Package size={20} />}
            sx={{
              bgcolor: '#f58220',
              '&:hover': { bgcolor: '#059669' },
              borderRadius: 3,
              textTransform: 'none',
              px: 4,
              py: 1.5,
            }}
          >
            Create Shipment
          </Button>
        </Box>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {kpiData.map((kpi, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StyledCard>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: `${kpi.color}15`,
                      }}
                    >
                      <kpi.icon size={32} color={kpi.color} />
                    </Box>

                    <Chip
                      label={kpi.change}
                      size="small"
                      icon={kpi.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      sx={{
                        bgcolor: kpi.trend === 'up' ? '#ecfdf5' : '#fef2f2',
                        color: kpi.trend === 'up' ? '#f58220' : '#ef4444',
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  <Typography variant="h5" fontWeight="600" sx={{ mt: 4, mb: 0.5 }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {kpi.title}
                  </Typography>

                  {/* Mini Sparkline */}
                  <Box sx={{ mt: 3, height: 48, display: 'flex', alignItems: 'flex-end', gap: 0.8 }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: 1,
                          height: `${30 + (i % 5) * 8}px`,
                          bgcolor: '#f58220',
                          borderRadius: '4px 4px 0 0',
                          opacity: 0.7 + (i % 3) * 0.1,
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Shipments */}
          <Grid item xs={12} lg={8}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                p: 4,
                border: '1px solid #e5e7eb',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Package size={24} /> Recent Shipments
                </Typography>
                <Button variant="text" endIcon={<span>→</span>} sx={{ color: '#f58220' }}>
                  View All
                </Button>
              </Box>

              <Stack spacing={3}>
                {recentShipments.map((shipment, index) => (
                  <Card key={index} variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" fontWeight="600" fontFamily="monospace">
                            {shipment.id}
                          </Typography>
                          <Chip
                            label={shipment.status}
                            size="small"
                            sx={{
                              bgcolor: shipment.bgColor,
                              color: shipment.statusColor,
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'text.secondary' }}>
                          <MapPin size={18} />
                          <Typography variant="body2">{shipment.address}</Typography>
                        </Box>
                      </Box>

                      <Box textAlign="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                          <Calendar size={18} />
                          <Typography variant="body2">ETA: {shipment.eta}</Typography>
                        </Box>
                        <shipment.icon size={52} color="#9ca3af" />
                      </Box>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ height: 8, bgcolor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: `${shipment.progress}%`,
                            bgcolor: 'linear-gradient(90deg, #f58220, #34d399)',
                            borderRadius: 4,
                          }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748b' }}>
                      <div>Order Placed</div>
                      <div>Processing</div>
                      <div>In Transit</div>
                      <div>Out for Delivery</div>
                      <div>Delivered</div>
                    </Box>
                  </Card>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* Real-Time Map Sidebar */}
          <Grid item xs={12} lg={4}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                p: 4,
                height: '100%',
                border: '1px solid #e5e7eb',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                <Box sx={{ p: 1.5, bgcolor: '#bae6fd', borderRadius: 3 }}>
                  <MapPin size={28} color="#0ea5e9" />
                </Box>
                <Typography variant="h6" fontWeight="600">
                  Real-Time Map
                </Typography>
              </Box>

              {/* Map Area */}
              <Box
                sx={{
                  height: 320,
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  mb: 4,
                  border: '1px solid #e5e7eb',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800"
                  alt="World Map"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.4))',
                  }}
                />
              </Box>

              {/* Live Tracking List */}
              <Stack spacing={2}>
                {[
                  { id: "#3752584", status: "Out for Delivery", type: "Food Materials", color: "#8b5cf6" },
                  { id: "#3752584", status: "In Transit", type: "Food Materials", color: "#3b82f6" },
                  { id: "#3752584", status: "Processing", type: "Food Materials", color: "#f59e0b" },
                ].map((item, i) => (
                  <Paper
                    key={i}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight="600">
                        {item.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.type}
                      </Typography>
                    </Box>
                    <Chip
                      label={item.status}
                      size="small"
                      sx={{
                        bgcolor: `${item.color}15`,
                        color: item.color,
                        fontWeight: 600,
                      }}
                    />
                  </Paper>
                ))}
              </Stack>

              <Button
                fullWidth
                variant="outlined"
                sx={{
                  mt: 4,
                  borderRadius: 3,
                  py: 1.5,
                  borderColor: '#f58220',
                  color: '#f58220',
                  '&:hover': {
                    borderColor: '#059669',
                    bgcolor: '#f0fdf4',
                  },
                }}
              >
                View All Shipments
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardCharts;