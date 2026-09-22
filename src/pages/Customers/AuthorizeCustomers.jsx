import { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Card,
  CardContent,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { api } from "../../api";
import { AppContext } from "../../context/AppContext";

const getRole = (customer) => {
  const raw = (customer.type || "").toLowerCase();
  if (raw.includes("receiver")) return "receiver";
  if (raw.includes("sender") || raw.includes("sender")) return "sender";
  return "unknown";
};

const roleChipColor = (role) =>
  role === "receiver" ? "info" : role === "sender" ? "secondary" : "default";

export default function AuthorizeCustomers() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { customers, loadingCustomers } = useContext(AppContext);

  const [authStatusMap, setAuthStatusMap] = useState({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [processingIds, setProcessingIds] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  const toggleFilter = (filter) => {
    setActiveFilter((prev) => (prev === filter ? null : filter));
    setPage(0);
    setSelectedIds([]);
  };

  const fetchAuthStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await api.get("/api/customers/status-map", {
        validateStatus: () => true,
      });
      setAuthStatusMap(response.data.statusMap || {});
    } catch (error) {
      console.error("Failed to load mobile auth status", error);
      toast.error("Unable to load authorization status.");
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  useEffect(() => {
    setPage(0);
    setSelectedIds([]);
  }, [search]);

  const rows = useMemo(() => {
    if (!customers?.length) return [];
    const term = search.trim().toLowerCase();

    return customers
      .map((customer, index) => {
        const id = customer.zoho_id || `customer-${index}`;
        const authInfo = authStatusMap[id];

        return {
          id,
          company: customer.contact_name || "Unnamed Customer",
          name: customer.contact_name || "Unnamed Customer",
          email: customer.email || "",
          phone: customer.phone_number || "",
          role: getRole(customer),
          isActive: Boolean(customer.status),
          hasAppAccount: Boolean(authInfo),
          authorized: Boolean(authInfo?.authorized),
        };
      })
      .filter((row) => {
        if (!term) return true;
        return (
          row.company.toLowerCase().includes(term) ||
          row.email.toLowerCase().includes(term) ||
          row.phone.toLowerCase().includes(term)
        );
      })
      .filter((row) => {
        if (!activeFilter) return true;
        if (activeFilter === "active") return row.isActive;
        if (activeFilter === "receivers")
          return row.role === "receiver" && row.authorized;
        if (activeFilter === "senders")
          return row.role === "sender" && row.authorized;
        return true;
      });
  }, [customers, authStatusMap, search, activeFilter]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds],
  );

  const totals = useMemo(() => {
    const all = (customers || []).map((customer, index) => {
      const id = customer.zoho_id || `customer-${index}`;
      const authInfo = authStatusMap[id];
      return {
        role: getRole(customer),
        authorized: Boolean(authInfo?.authorized),
        isActive: Boolean(customer.status),
      };
    });

    return {
      total: all.length,
      active: all.filter((c) => c.isActive).length,
      authorizedReceivers: all.filter(
        (c) => c.role === "receiver" && c.authorized,
      ).length,
      authorizedSenders: all.filter((c) => c.role === "sender" && c.authorized)
        .length,
    };
  }, [customers, authStatusMap]);

  const toggleRow = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );

  const toggleAllRows = () => {
    const idsOnPage = paginatedRows.map((row) => row.id);
    const allSelected = idsOnPage.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !idsOnPage.includes(id))
        : [...new Set([...prev, ...idsOnPage])],
    );
  };

  const openMenu = (event, row) => {
    setMenuAnchor(event.currentTarget);
    setMenuRow(row);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const handleSetAuthorization = async (rowsToUpdate, authorize) => {
    if (!rowsToUpdate.length) {
      toast.warning("Select at least one customer first.");
      return;
    }

    const missingEmail = rowsToUpdate.filter((r) => !r.email);
    if (missingEmail.length) {
      toast.warning(
        `${missingEmail.length} selected customer(s) have no email on file and were skipped.`,
      );
    }
    const validRows = rowsToUpdate.filter((r) => r.email);
    if (!validRows.length) return;

    const ids = validRows.map((r) => r.id);
    setProcessingIds(ids);

    try {
      const response = await api.post(
        "/api/customers/toggle-access",
        {
          customers: validRows.map((r) => ({
            customerId: r.id,
            fullName: r.name,
            email: r.email,
            accountType: r.role === "unknown" ? "receiver" : r.role,
          })),
          authorize,
        },
        { validateStatus: () => true },
      );

      const { insertedIds = [], updatedIds = [] } = response.data || {};

      toast.success(
        `${insertedIds.length + updatedIds.length} customer${
          insertedIds.length + updatedIds.length > 1 ? "s" : ""
        } ${authorize ? "authorized" : "unauthorized"} for mobile app access.`,
      );

      setSelectedIds([]);
      await fetchAuthStatus();
    } catch (error) {
      console.error("Mobile auth toggle failed", error);
      toast.error("Unable to update authorization.");
    } finally {
      setProcessingIds([]);
    }
  };

  const loading = loadingCustomers || statusLoading;

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", py: 4, px: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" color="#f58220">
              Mobile App Authorization
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Select customers to authorize or revoke mobile app access.
            </Typography>
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            width={{ xs: "100%", md: "auto" }}
          >
            <Button
              variant="contained"
              color="success"
              startIcon={<LockOpenIcon />}
              fullWidth={isMobile}
              disabled={!selectedRows.length}
              onClick={() => handleSetAuthorization(selectedRows, true)}
            >
              Authorize ({selectedRows.length})
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LockIcon />}
              fullWidth={isMobile}
              disabled={!selectedRows.length}
              onClick={() => handleSetAuthorization(selectedRows, false)}
            >
              Unauthorize ({selectedRows.length})
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {[
            {
              label: "Total Users",
              value: totals.total,
              filter: null,
              activeColor: "primary.main",
            },
            {
              label: "Active Users",
              value: totals.active,
              filter: "active",
              activeColor: "info.main",
            },
            {
              label: "Authorized Receivers",
              value: totals.authorizedReceivers,
              filter: "receivers",
              activeColor: "success.main",
              valueColor: "success.main",
            },
            {
              label: "Authorized Senders",
              value: totals.authorizedSenders,
              filter: "senders",
              activeColor: "secondary.main",
              valueColor: "secondary.main",
            },
          ].map(({ label, value, filter, activeColor, valueColor }) => (
            <Paper
              key={label}
              onClick={() =>
                filter === null
                  ? (setActiveFilter(null), setPage(0), setSelectedIds([]))
                  : toggleFilter(filter)
              }
              sx={{
                p: 2,
                cursor: "pointer",
                border:
                  activeFilter === filter
                    ? "2px solid"
                    : "2px solid transparent",
                borderColor:
                  activeFilter === filter ? activeColor : "transparent",
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                {label}
              </Typography>
              <Typography
                variant="h5"
                sx={valueColor ? { color: valueColor } : undefined}
              >
                {value}
              </Typography>
            </Paper>
          ))}
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Search by company, email or phone"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ width: { xs: "100%", md: "30%" } }}
        />

        {isMobile ? (
          <Stack spacing={1.5}>
            {loading ? (
              <Typography align="center" sx={{ py: 4 }}>
                Loading customers...
              </Typography>
            ) : !paginatedRows.length ? (
              <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                No customer records found.
              </Typography>
            ) : (
              paginatedRows.map((row) => (
                <Card key={row.id} variant="outlined">
                  <CardContent sx={{ pb: "12px !important" }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleRow(row.id)}
                        sx={{ p: 0, mr: 1 }}
                      />
                      <Box flex={1}>
                        <Typography fontWeight={600}>{row.company}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {row.email || "No email"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {row.phone || "—"}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => openMenu(e, row)}
                        disabled={processingIds.includes(row.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1}
                      mt={1.5}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Chip
                        label={row.role}
                        color={roleChipColor(row.role)}
                        size="small"
                      />
                      <Chip
                        label={
                          !row.hasAppAccount
                            ? "No App Account"
                            : row.authorized
                              ? "Authorized"
                              : "Not Authorized"
                        }
                        color={
                          !row.hasAppAccount
                            ? "default"
                            : row.authorized
                              ? "success"
                              : "warning"
                        }
                        size="small"
                      />
                      {row.isActive && (
                        <Chip label="Active" color="info" size="small" />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={
                        paginatedRows.length > 0 &&
                        paginatedRows.every((r) => selectedIds.includes(r.id))
                      }
                      indeterminate={
                        paginatedRows.some((r) => selectedIds.includes(r.id)) &&
                        !paginatedRows.every((r) => selectedIds.includes(r.id))
                      }
                      onChange={toggleAllRows}
                      disabled={!paginatedRows.length}
                    />
                  </TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : !paginatedRows.length ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No customer records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={
                        row.authorized
                          ? {
                              bgcolor: "#eaf7ee",
                              borderLeft: "4px solid #2e7d32",
                              "&:hover": { bgcolor: "#d9f0e0" },
                            }
                          : undefined
                      }
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleRow(row.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{row.company}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {row.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.email || "—"}</TableCell>
                      <TableCell>{row.phone || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.role}
                          color={roleChipColor(row.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Chip
                            label={
                              !row.hasAppAccount
                                ? "No App Account"
                                : row.authorized
                                  ? "Authorized"
                                  : "Not Authorized"
                            }
                            color={
                              !row.hasAppAccount
                                ? "default"
                                : row.authorized
                                  ? "success"
                                  : "warning"
                            }
                            size="small"
                          />
                          {row.isActive && (
                            <Chip label="Active" color="info" size="small" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => openMenu(e, row)}
                          disabled={processingIds.includes(row.id)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[10, 15, 25, 50]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        <MenuItem
          onClick={() => {
            const row = menuRow;
            closeMenu();
            handleSetAuthorization([row], true);
          }}
          disabled={menuRow?.authorized}
        >
          Authorize
        </MenuItem>
        <MenuItem
          onClick={() => {
            const row = menuRow;
            closeMenu();
            handleSetAuthorization([row], false);
          }}
          disabled={!menuRow?.authorized}
        >
          Unauthorize
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            closeMenu();
          }}
        >
          View Details
        </MenuItem>
      </Menu>
    </Box>
  );
}
