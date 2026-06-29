import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

export function useOrdersData({ places }) {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filterPlaces, setFilterPlaces] = useState([]);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = useCallback((message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  }, []);
  const handleSnackbarClose = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: filters.status?.trim() || "",
        search: filters.search?.trim() || "",
        page: page + 1,
        limit: rowsPerPage,
        includeContainer: true,
      };
      const response = await api.get("/api/orders", { params });
      const ordersData =
        response.data.data || response.data.orders || response.data || [];
      const totalCount =
        response.data.pagination?.total ||
        response.data.pagination?.count ||
        response.data.pagination?.totalCount ||
        0;

      const ordersWithAutoPopulate = await Promise.all(
        ordersData.map(async (order) => {
          const ownerPrefix =
            order.sender_type === "sender" ? "sender" : "receiver";
          const ownerNameKey = `${ownerPrefix}_name`;
          const selectedOwnerKey = "selected_sender_owner";
          if (order[selectedOwnerKey] && !order[ownerNameKey]?.trim()) {
            try {
              const customerRes = await api.get(
                `/api/customers/${order[selectedOwnerKey]}`,
              );
              if (customerRes?.data) {
                const customer = customerRes.data;
                return {
                  ...order,
                  [ownerNameKey]:
                    customer.contact_name ||
                    customer.contact_persons?.[0]?.name ||
                    "",
                  [`${ownerPrefix}_contact`]:
                    customer.primary_phone ||
                    customer.contact_persons?.[0]?.phone ||
                    "",
                  [`${ownerPrefix}_address`]:
                    customer.zoho_notes || customer.billing_address || "",
                  [`${ownerPrefix}_email`]:
                    customer.email ||
                    customer.contact_persons?.[0]?.email ||
                    "",
                  [`${ownerPrefix}_ref`]:
                    customer.zoho_id || customer.ref || "",
                  [`${ownerPrefix}_remarks`]:
                    customer.zoho_notes || customer.system_notes || "",
                };
              }
            } catch (autoErr) {
              console.error(
                `Auto-populate owner failed for order ${order.id}:`,
                autoErr,
              );
            }
          }
          return order;
        }),
      );

      setOrders(ordersWithAutoPopulate);
      setTotal(totalCount);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to fetch orders");
      showSnackbar(
        err.response?.data?.error || err.message || "Failed to fetch orders",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.search, page, rowsPerPage, showSnackbar]);

  useEffect(() => {
    setFilterPlaces(
      places.map((p) => ({ value: p.id.toString(), label: p.name })),
    );
    fetchOrders();
  }, [page, rowsPerPage, filters.status]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };
  const handleSearchChange = (value) =>
    setFilters((prev) => ({ ...prev, search: value }));
  const runSearch = () => {
    setPage(0);
    fetchOrders();
  };
  const handleClearSearch = () => {
    setFilters({ status: "", search: "" });
    setPage(0);
    window.location.reload();
  };
  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const exportOrders = async () => {
    if (total === 0) {
      showSnackbar("No orders to export", "warning");
      return;
    }
    setExporting(true);
    try {
      let allOrders = [];
      let currentPage = 1;
      const pageSize = 100;
      let hasMore = true;
      while (hasMore) {
        const params = {
          page: currentPage,
          limit: pageSize,
          includeContainer: true,
          ...filters,
        };
        const response = await api.get(`/api/orders`, { params });
        const pageOrders = response.data.data || [];
        allOrders = [...allOrders, ...pageOrders];
        hasMore = pageOrders.length >= pageSize;
        currentPage++;
      }
      if (allOrders.length === 0) {
        showSnackbar("No orders found to export", "warning");
        return;
      }

      const headers = [
        "Booking Ref",
        "Status",
        "Place of Loading",
        "Final Destination",
        "Sender",
        "Receivers",
        "Containers",
        "Associated Container",
        "Created At",
      ];
      const rows = allOrders.map((order) => [
        order.booking_ref || "",
        order.status || "",
        order?.place_of_loading || "",
        order.final_destination || "",
        order.sender_name || "",
        order.receiver_summary || "",
        order.receiver_containers || "",
        order.container_number || "",
        new Date(order.created_at).toLocaleDateString(),
      ]);
      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSnackbar(
        `Successfully exported ${allOrders.length} orders`,
        "success",
      );
    } catch (err) {
      console.error("Error exporting orders:", err);
      showSnackbar(
        err.response?.data?.error || err.message || "Failed to export orders",
        "error",
      );
    } finally {
      setExporting(false);
    }
  };

  return {
    orders,
    total,
    page,
    rowsPerPage,
    loading,
    error,
    exporting,
    filterPlaces,
    filters,
    snackbar,
    showSnackbar,
    handleSnackbarClose,
    fetchOrders,
    handleFilterChange,
    handleSearchChange,
    runSearch,
    handleClearSearch,
    handleChangePage,
    handleChangeRowsPerPage,
    exportOrders,
  };
}
