import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { api } from "../api";
import { getStatusColors } from "../Utlis/statusColors";

const TEAL = "#1a7a6e";
const ORANGE = "#e07b2a";

const FILTER_FIELDS = [
  { key: "rgl_booking_number", label: "Form Number" },
  { key: "booking_ref", label: "Booking Ref" },
  { key: "container_number", label: "Container Number" },
  { key: "consignment_number", label: "Consignment Number" },
  { key: "item_ref", label: "Item Ref" },
];

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export default function OrderTrackingPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    rgl_booking_number: "",
    booking_ref: "",
    container_number: "",
    consignment_number: "",
    item_ref: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    const fetchTracking = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/api/orders/trackingHistory");
        if (data?.success) {
          setRows(data.rows || []);
        } else {
          toast.error(data?.message || "Failed to load tracking data");
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Something went wrong fetching tracking data",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
  }, []);

  const handleFilterChange = (key) => (e) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));
    setPage(0);
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      FILTER_FIELDS.every(({ key }) => {
        const filterValue = filters[key]?.trim().toLowerCase();
        if (!filterValue) return true;
        const cellValue = (row[key] ?? "").toString().toLowerCase();
        return cellValue.includes(filterValue);
      }),
    );
  }, [rows, filters]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const handleChangePage = (_e, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const getModuleColors = (module) => {
    switch (module?.toLowerCase()) {
      case "orders":
        return {
          bg: "#e3f2fd",
          text: "#1565c0",
        };

      case "containers":
        return {
          bg: "#fff3e0",
          text: "#e65100",
        };

      case "consignments":
        return {
          bg: "#e8f5e9",
          text: "#2e7d32",
        };

      default:
        return {
          bg: "#f5f5f5",
          text: "#616161",
        };
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="#f58220">
          Order Tracking History
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          border: "1px solid #e8e8e8",
          borderRadius: 2,
        }}
      >
        <Grid container spacing={2}>
          {FILTER_FIELDS.map(({ key, label }) => (
            <Grid item xs={12} sm={6} md={2.4} key={key}>
              <TextField
                fullWidth
                size="small"
                label={label}
                value={filters[key]}
                onChange={handleFilterChange(key)}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e8e8e8",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: TEAL }}>
                <TableCell sx={{ color: "white", fontWeight: 600, py: 1.5 }}>
                  Form Number
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  Booking Ref
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  Container Number
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  Consignment Number
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  Item Ref
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  Status
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  Module
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  Created Time
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  Created By
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  ETA
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  ETD
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: TEAL }} />
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    align="center"
                    sx={{ py: 6, color: "#aaa" }}
                  >
                    No tracking records match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => {
                  const { bg, text } = getStatusColors(row.status);
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.rgl_booking_number || "-"}</TableCell>
                      <TableCell>{row.booking_ref || "-"}</TableCell>
                      <TableCell>{row.container_number || "-"}</TableCell>
                      <TableCell>{row.consignment_number || "-"}</TableCell>
                      <TableCell>{row.item_ref || "-"}</TableCell>
                      <TableCell>
                        {row.status ? (
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              bgcolor: bg,
                              color: text,
                              fontWeight: 600,
                              border: "none",
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {row.module
                          ? (() => {
                              const { bg, text } = getModuleColors(row.module);

                              return (
                                <Chip
                                  label={row.module}
                                  size="small"
                                  sx={{
                                    bgcolor: bg,
                                    color: text,
                                    fontWeight: 600,
                                    border: "none",
                                  }}
                                />
                              );
                            })()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {formatDate(row.created_time) || "-"}
                      </TableCell>
                      <TableCell>{row.created_by || "-"}</TableCell>
                      <TableCell>{formatDate(row.eta) || "-"}</TableCell>
                      <TableCell>{formatDate(row.etd) || "-"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Box>
  );
}
