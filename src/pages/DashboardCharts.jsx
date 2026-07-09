import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Skeleton,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Package,
  Truck,
  Ship,
  Users,
  Send,
  Inbox,
  RefreshCcwIcon as RefreshIcon,
} from "lucide-react";
import { styled } from "@mui/material/styles";
import { api } from "../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
  border: `1px solid ${theme.palette.divider}`,
  height: "100%",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
}));

const PROGRESS_COLORS = [
  "#94a3b8",
  "#60a5fa",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#f59e0b",
  "#f97316",
  "#10b981",
];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const DashboardCharts = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/options/dashboard");
      setDashboardData(response.data.data);
    } catch (err) {
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton
          variant="rounded"
          height={80}
          sx={{ mb: 2, borderRadius: 2 }}
        />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Skeleton
                variant="rounded"
                height={100}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Skeleton
                variant="rounded"
                height={100}
                sx={{ borderRadius: 2, width: 160 }}
              />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={<Button onClick={fetchDashboardData}>Retry</Button>}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) return null;

  const { counts, statuses, countsByStatus, recentOrders, recentConsignments } =
    dashboardData;

  const topCounts = [
    {
      label: "Total Orders",
      value: counts.orders,
      icon: <Package size={22} />,
      color: "#f58220",
    },
    {
      label: "Total Containers",
      value: counts.containers,
      icon: <Truck size={22} />,
      color: "#3b82f6",
    },
    {
      label: "Total Consignments",
      value: counts.consignments,
      icon: <Ship size={22} />,
      color: "#8b5cf6",
    },
    {
      label: "Customers",
      value: counts.customers,
      icon: <Users size={22} />,
      color: "#10b981",
    },
    {
      label: "Senders",
      value: counts.senders,
      icon: <Send size={22} />,
      color: "#ec4899",
    },
    {
      label: "Receivers",
      value: counts.receivers,
      icon: <Inbox size={22} />,
      color: "#f59e0b",
    },
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Dashboard Overview
        </Typography>
        <Button
          startIcon={<RefreshIcon size={16} />}
          onClick={fetchDashboardData}
          size="small"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {topCounts.map((item, idx) => (
          <Grid item size={{ xs: 6, sm: 4, md: 2 }} key={idx}>
            <StyledCard
              sx={{
                bgcolor: `${item.color}08`,
                borderLeft: `5px solid ${item.color}`,
              }}
            >
              <CardContent
                sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: 1.5 } }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontSize="0.75rem"
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight="800"
                      mt={0.5}
                      fontSize="1.5rem"
                    >
                      {item.value.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ color: item.color, opacity: 0.8, ml: 1 }}>
                    {item.icon}
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" fontWeight="bold">
        Order Status Pipeline
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 4,
          mt: 2,
        }}
      >
        {statuses.map((status, index) => {
          const count = countsByStatus.orders[status.order_status] || 0;
          const color = PROGRESS_COLORS[index % PROGRESS_COLORS.length];

          if (!status.order_status) return null;

          return (
            <Box
              key={status.id}
              sx={{
                width: { xs: "calc(50% - 6px)", sm: "160px" },
                flexShrink: 0,
              }}
            >
              <StyledCard sx={{ position: "relative", overflow: "hidden" }}>
                <Box
                  sx={{
                    position: "absolute",
                    top: -10,
                    right: -10,
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    bgcolor: `${color}25`,
                  }}
                />
                <CardContent sx={{ pt: 2, position: "relative" }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: "0.7rem",
                      lineHeight: 1.3,
                      display: "block",
                      fontWeight: 600,
                    }}
                  >
                    {status.order_status}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="700"
                    sx={{ color, mt: 1, fontSize: "1.4rem" }}
                  >
                    {count}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Box>
          );
        })}
      </Box>

      <Grid container spacing={3}>
        <Grid item size={{ xs: 12, md: 6 }}>
          <StyledCard>
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" fontWeight="700" fontSize="1rem">
                Recent Orders
              </Typography>
              <Chip
                label={counts.orders}
                size="small"
                sx={{ fontWeight: 700, bgcolor: "#f5822015", color: "#f58220" }}
              />
            </Box>
            <TableContainer sx={{ px: 1.5, pb: 1.5 }}>
              <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      Ref
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      Item Ref
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        display: { xs: "none", md: "table-cell" },
                      }}
                    >
                      Receiver
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      ETA
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.slice(0, 5).map((order) => (
                    <TableRow
                      key={order.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell
                        sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}
                      >
                        {order.rgl_booking_number || "—"}
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}
                      >
                        {order.item_ref || "—"}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: "0.8rem",
                          display: { xs: "none", md: "table-cell" },
                          maxWidth: 150,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {order.receiver_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.order_status || "Created"}
                          size="small"
                          sx={{
                            fontSize: "0.7rem",
                            height: 24,
                            bgcolor: `${PROGRESS_COLORS[statuses.findIndex((s) => s.order_status === order.order_status)] || "#94a3b8"}20`,
                            color:
                              PROGRESS_COLORS[
                                statuses.findIndex(
                                  (s) => s.order_status === order.order_status,
                                )
                              ] || "#94a3b8",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: "0.8rem",
                          color: "text.secondary",
                          display: { xs: "none", sm: "table-cell" },
                        }}
                      >
                        {formatDate(order.eta)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography
              sx={{ textAlign: "right", mb: 1, mr: 1, cursor: "pointer" }}
              onClick={() => navigate("/orders")}
            >
              <Chip
                label={"View All"}
                size="small"
                sx={{
                  px: 2,
                  fontSize: "0.7rem",
                  height: 24,
                  bgcolor: "#f59e0b",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            </Typography>
          </StyledCard>
        </Grid>
        <Grid item size={{ xs: 12, md: 6 }}>
          <StyledCard>
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" fontWeight="700" fontSize="1rem">
                Recent Consignments
              </Typography>
              <Chip
                label={counts.consignments}
                size="small"
                sx={{ fontWeight: 700, bgcolor: "#8b5cf615", color: "#8b5cf6" }}
              />
            </Box>
            <TableContainer sx={{ px: 1.5, pb: 1.5 }}>
              <Table size="small" sx={{ minWidth: 400 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      Consignment #
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      Consignee
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      ETA
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentConsignments.slice(0, 5).map((cons) => (
                    <TableRow
                      key={cons.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell
                        sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}
                      >
                        {cons.consignment_number}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>
                        {cons.consignee}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cons.status}
                          size="small"
                          sx={{
                            fontSize: "0.7rem",
                            height: 24,
                            bgcolor: `${PROGRESS_COLORS[statuses.findIndex((s) => s.consignment_status === cons.status)] || "#94a3b8"}20`,
                            color:
                              PROGRESS_COLORS[
                                statuses.findIndex(
                                  (s) => s.consignment_status === cons.status,
                                )
                              ] || "#94a3b8",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: "0.8rem",
                          color: "text.secondary",
                          display: { xs: "none", sm: "table-cell" },
                        }}
                      >
                        {formatDate(cons.eta)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography
              sx={{ textAlign: "right", mb: 1, mr: 1, cursor: "pointer" }}
              onClick={() => navigate("/consignments")}
            >
              <Chip
                label={"View All"}
                size="small"
                sx={{
                  px: 2,
                  fontSize: "0.7rem",
                  height: 24,
                  bgcolor: "#f59e0b",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            </Typography>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardCharts;
