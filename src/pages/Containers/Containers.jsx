import { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  Chip,
  Divider,
  Slide,
  TableSortLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from "@mui/material";
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import dayjs from "dayjs";
import { styled } from '@mui/material/styles';

// --- Status Colors --- //
const statusColors = {
  Available: "success",
  Occupied: "warning",
  Hired: "info",
};

// --- Helper to derive status --- //
function getStatus(c) {
  const now = dayjs();

  if (!c.date_hired) return "Available"; // never hired
  if (c.return_date && dayjs(c.return_date).isBefore(now)) return "Available"; // already returned
  if (c.return_date && dayjs(c.return_date).isAfter(now)) return "Occupied"; // still occupied
  if (c.date_hired && !c.return_date) return "Hired"; // hired out, no return yet
  return "Available";
}

const UsageDialog = ({ open, onClose, container }) => {
  if (!container) return null;

  // Dummy usage history
  const usageHistory = [
    {
      job_no: "JOB-1001",
      client_name: "Client A",
      pol: "Singapore",
      pod: "Rotterdam",
      job_date: "2025-09-01",
      returned: true,
      remarks: "Delivered successfully",
    },
    {
      job_no: "JOB-1002",
      client_name: "Client B",
      pol: "Dubai",
      pod: "Hamburg",
      job_date: "2025-09-12",
      returned: false,
      remarks: "Still in transit",
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="usage-dialog-title"
      sx={{ '& .MuiDialog-paper': { borderRadius: 3, boxShadow: 4 } }}
    >
      <DialogTitle id="usage-dialog-title" sx={{ fontSize: '1.25rem', p: 2, bgcolor: '#f8f9fa', borderBottom: 1, borderColor: 'divider' }}>
        Usage History – {container.container_no}
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Job No</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Client</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>POL → POD</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Job Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Returned?</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usageHistory.map((u, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Button variant="text" color="primary" size="small">
                    {u.job_no}
                  </Button>
                </TableCell>
                <TableCell>{u.client_name}</TableCell>
                <TableCell sx={{ width: 200 }}>
                  {u.pol} → {u.pod}
                </TableCell>
                <TableCell>{dayjs(u.job_date).format("YYYY-MM-DD")}</TableCell>
                <TableCell>{u.returned ? "Yes" : "No"}</TableCell>
                <TableCell>{u.remarks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0, bgcolor: '#f8f9fa', borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} size="small" variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// --- Table Component with Filters & CSV --- //
const CustomTable = ({ columns, rows, filters, setFilters, tabLabel }) => {
  const [orderBy, setOrderBy] = useState('container_no');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [usageOpen, setUsageOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const filteredRows = rows.filter((row) =>
    Object.keys(filters).every(
      (key) =>
        !filters[key] ||
        row[key]?.toString().toLowerCase().includes(filters[key].toLowerCase())
    )
  );

  const total = filteredRows.length;
  const numSelected = selected.length;

  function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function getComparator(order, orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  function getSortableValue(item, key) {
    const value = item[key];
    if (typeof value === 'number') {
      return value;
    }
    return value || '';
  }

  function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) {
        return order;
      }
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const sortedConsignments = stableSort(filteredRows, getComparator(order, orderBy));
  const visibleRows = sortedConsignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredRows.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = () => {
    setExporting(true);
    // Dummy export logic
    setTimeout(() => {
      setExporting(false);
      setSnackbar({ open: true, message: 'Exported successfully!', severity: 'success' });
    }, 2000);
  };

  const handleViewUsage = (row) => {
    setSelectedContainer(row);
    setUsageOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
    const StyledTableRow = styled(TableRow)(({ theme }) => ({
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
        },
        // hide last border
        '&:last-child td, &:last-child th': {
            border: 0,
        },
        '&:hover': {
            backgroundColor: theme.palette.action.selected,
        },
    }));

    const StyledTableCell = styled(TableCell)(({ theme }) => ({
        borderBottom: `1px solid ${theme.palette.divider}`,
        fontSize: '0.875rem',
        padding: theme.spacing(1.5, 2),
    }));

    const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        fontWeight: 'bold',
        fontSize: '0.875rem',
        padding: theme.spacing(1.5, 2),
        borderBottom: `2px solid ${theme.palette.primary.dark}`,
    }));

  if (total === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary" align="center" sx={{ py: 4 }}>
          No containers available
        </Typography>
      </Box>
    );
  }

  return (
    <Box  sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
      {/* Summary Card */}
      <Card  sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 108, 106, 0.15)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Showing <strong>{total}</strong> {tabLabel.toLowerCase()} containers
            </Typography>
            <Chip 
              icon={<InfoIcon fontSize="small" />} 
              label={`${numSelected} selected`} 
              color={numSelected > 0 ? "primary" : "default"}
              size="small"
              variant="outlined"
              sx={{ 
                borderRadius: 1.5,
                fontWeight: 'medium',
                minWidth: 120,
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.02)' }
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 2, sm: 0 }} mb={2}>
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          color="#f58220" 
          sx={{ 
            fontSize: { xs: '1.5rem', md: '1.75rem' },
            mb: { xs: 1, sm: 0 },
            transition: 'transform 0.2s ease',
            '&:hover': { transform: 'scale(1.01)' }
          }}
        >
          {tabLabel}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title={numSelected === 0 ? "Select items to hire" : ""}>
            <span>
              <Button
                variant="contained"
                disabled={numSelected === 0}
                onClick={() => console.log('Hire selected containers', selected)}
                startIcon={<AddIcon />}
                size="medium"
                fullWidth
                sx={{
                  borderRadius: 2,
                  backgroundColor: "#0d6c6a",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#0a5a59" },
                  fontSize: '0.875rem',
                  fontWeight: 'medium',
                  transition: 'all 0.2s ease',
                  minHeight: 40,
                  width: 200,
                  '&:disabled': { backgroundColor: 'grey.400' }
                }}
              >
                Hire ({numSelected})
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Export to CSV">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={exporting || total === 0}
              size="small"
              fullWidth
              sx={{
                borderRadius: 2,
                borderColor: "#0d6c6a",
                color: "#0d6c6a",
                "&:hover": { borderColor: "#0d6c6a", backgroundColor: "#0d6c6a", color: "#fff" },
                fontSize: '0.875rem',
                fontWeight: 'medium',
                transition: 'all 0.2s ease',
                minHeight: 40,
                width: 120,
                '&:disabled': { borderColor: 'grey.400', color: 'grey.400' }
              }}
            >
              {exporting ? <CircularProgress size={16} color="inherit" /> : "Export"}
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center" flexWrap="wrap">
        {Object.keys(filters).map((key) => (
          <TextField
            key={key}
            name={key}
            label={key.replace("_", " ")}
            value={filters[key]}
            onChange={handleFilterChange}
            size="small"
            sx={{ 
              width: { xs: '100%', sm: 200 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'background.paper',
                transition: 'box-shadow 0.2s ease',
                '&:focus': { boxShadow: '0 0 0 2px rgba(13, 108, 106, 0.25)' }
              },
              '& .MuiInputLabel-root': {
                letterSpacing: 0.5,
                textTransform: "capitalize",
                color: "rgba(180, 174, 174, 1)",
              },
            }}
            placeholder={`Search ${key.replace("_", " ")}`}
          />
        ))}
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={() =>
            setFilters(Object.fromEntries(Object.keys(filters).map((k) => [k, ""])))
          }
          sx={{ 
            borderRadius: 2,
            borderColor: "#0d6c6a",
            color: "#0d6c6a",
            "&:hover": { borderColor: "#0d6c6a", backgroundColor: "#0d6c6a", color: "#fff" },
            fontSize: '0.875rem',
            fontWeight: 'medium',
            minHeight: 40,
          }}
        >
          Reset
        </Button>
      </Stack>

      {/* Table */}
      <TableContainer sx={{ 
        borderRadius: 2, 
        overflow: 'hidden', 
        boxShadow: 2, 
        maxHeight: 600,
        width: '100%',
        '&::-webkit-scrollbar': {
          height: 6,
          width: 6,
        },
        '&::-webkit-scrollbar-track': {
          background: 'background.paper',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#0d6c6a',
          borderRadius: 3,
        }
      }}>
        <Table stickyHeader size="small" aria-label={`${tabLabel} table`} sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <StyledTableHeadCell padding="checkbox" sx={{ width: 50, padding: '12px 8px' }}>
                <Checkbox
                  color="primary"
                  indeterminate={numSelected > 0 && numSelected < total}
                  checked={total > 0 && numSelected === total}
                  onChange={handleSelectAllClick}
                  size="small"
                  aria-label="Select all containers"
                />
              </StyledTableHeadCell>
              {columns.map((column) => (
                <StyledTableHeadCell 
                  key={column.key} 
                  sx={{ 
                    width: `${100 / (columns.length + 1)}%`, 
                    maxWidth: 150, 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: '12px 8px'
                  }} 
                  scope="col"
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.key}
                      direction={orderBy === column.key ? order : 'asc'}
                      onClick={(e) => handleRequestSort(e, column.key)}
                      sx={{ 
                        color: 'inherit !important', 
                        '&:hover': { color: 'inherit !important' }, 
                        '& .MuiTableSortLabel-icon': { color: 'inherit !important' },
                        '&:focus': { outline: '2px solid currentColor' }
                      }}
                      aria-label={`Sort by ${column.label}`}
                    >
                      <Typography variant="body2" sx={{ lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {column.label}
                      </Typography>
                    </TableSortLabel>
                  ) : (
                    <Typography variant="body2" sx={{ lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {column.label}
                    </Typography>
                  )}
                </StyledTableHeadCell>
              ))}
              <StyledTableHeadCell sx={{ width: 80, padding: '12px 8px' }} scope="col">
                <Typography variant="body2" sx={{ lineHeight: 1 }}>Actions</Typography>
              </StyledTableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row) => {
                const isItemSelected = isSelected(row.id);
                return (
                  <StyledTableRow
                    key={row.id}
                    onClick={() => handleClick(row.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    selected={isItemSelected}
                    hover
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick(row.id);
                      }
                    }}
                    sx={{ 
                      py: 1,
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease',
                      '&:focus': { outline: '2px solid #0d6c6a', outlineOffset: -2 }
                    }}
                    aria-label={`Container ${row.container_no}`}
                  >
                    <StyledTableCell padding="checkbox" sx={{ width: 50, padding: '12px 8px' }}>
                      <Checkbox
                        checked={isItemSelected}
                        onClick={(event) => {
                          handleClick(row.id);
                          event.stopPropagation();
                        }}
                        size="small"
                        inputProps={{
                          'aria-labelledby': `checkbox-${row.id}`,
                        }}
                        aria-label={`Select container ${row.container_no}`}
                      />
                    </StyledTableCell>
                    {columns.map((column) => (
                      <StyledTableCell key={column.key} sx={{ width: `${100 / (columns.length + 1)}%`, maxWidth: 150 }}>
                        <Tooltip title={typeof column.render(row) === 'string' ? column.render(row) : ''} arrow placement="top">
                          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {column.render ? column.render(row) : row[column.key]}
                          </Typography>
                        </Tooltip>
                      </StyledTableCell>
                    ))}
                    <StyledTableCell sx={{ width: 80, padding: '12px 8px' }}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Usage">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleViewUsage(row); }}
                            aria-label={`View usage for container ${row.container_no}`}
                            sx={{ 
                              color: '#0d6c6a',
                              '&:hover': { backgroundColor: 'rgba(13, 108, 106, 0.08)', transform: 'scale(1.1)' },
                              transition: 'all 0.2s ease',
                              '&:focus': { outline: '2px solid #0d6c6a' }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </StyledTableCell>
                  </StyledTableRow>
                );
              })
            ) : (
              <StyledTableRow>
                <StyledTableCell colSpan={columns.length + 2} align="center" sx={{ py: 4, border: 0 }}>
                  <Stack spacing={1} alignItems="center">
                    <Typography variant="h6" color="text.secondary" sx={{ fontSize: '1.125rem' }}>
                      No containers found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your filters.
                    </Typography>
                  </Stack>
                </StyledTableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Rows per page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        sx={{
          borderTop: '1px solid rgba(224, 224, 224, 1)',
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            color: '#f58220',
            fontWeight: 'medium',
            fontSize: '0.875rem',
          },
          '& .MuiTablePagination-select, & .MuiTablePagination-input': {
            fontSize: '0.875rem',
            borderRadius: 1,
            '&:focus': { borderColor: '#0d6c6a' }
          },
          '& .MuiTablePagination-actions button': {
            color: '#0d6c6a',
            '& svg': { fontSize: '1.125rem' },
            '&:hover': { backgroundColor: 'rgba(13, 108, 106, 0.08)' },
            '&:focus': { outline: '2px solid #0d6c6a' }
          }
        }}
        aria-label={`${tabLabel} table pagination`}
      />

      {/* Usage Dialog */}
      <UsageDialog
        open={usageOpen}
        onClose={() => setUsageOpen(false)}
        container={selectedContainer}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        aria-live="polite"
        sx={{ '& .MuiSnackbarContent-root': { borderRadius: 2 } }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%', 
            fontSize: '1rem',
            borderRadius: 2,
            animation: 'slideInUp 0.3s ease',
            boxShadow: 2
          }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default function ContainersTabs() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const [containers, setContainers] = useState([]);
  const [slideIn, setSlideIn] = useState(false);

  // ✅ Fetch containers
  useEffect(() => {
    const fetchContainers = async () => {
      try {
        const res = await api.get("/api/containers");
        setContainers(res.data.data || []);
      } catch (err) {
        console.error("❌ Error fetching containers:", err);
      }
    };
    fetchContainers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSlideIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Filters
  const [aboutFilters, setAboutFilters] = useState({
    container_no: "",
    container_size: "",
    date_hired: "",
    date_reached: "",
    free_days: "",
    return_date: "",
    ownership: "",
  });
  const [occupiedFilters, setOccupiedFilters] = useState({
    container_no: "",
    container_size: "",
    shipper: "",
    pol: "",
    pod: "",
    associated_date: "",
    days_till_today: "",
  });
  const [availableFilters, setAvailableFilters] = useState({
    container_no: "",
    container_size: "",
    location: "",
    condition: "",
    ownership: "",
  });
  const [hiredFilters, setHiredFilters] = useState({
    container_no: "",
    container_size: "",
    shipper: "",
    pol: "",
    pod: "",
    associated_date: "",
    days_till_today: "",
  });

  const startAdd = () => navigate("/containers/add");

  // --- Split Data --- //
  const aboutData = containers.map((c) => ({
    id: c.id,
    container_no: c.container_no,
    container_size: c.container_size,
    date_hired: c.date_hired ? dayjs(c.date_hired).format("YYYY-MM-DD") : "-",
    date_reached: c.date_reached ? dayjs(c.date_reached).format("YYYY-MM-DD") : "-",
    free_days: c.free_days || "-",
    return_date: c.return_date ? dayjs(c.return_date).format("YYYY-MM-DD") : "-",
    ownership: c.ownership_type || "-",
    status: getStatus(c),
  }));

  const occupiedData = containers
    .filter((c) => getStatus(c) === "Occupied")
    .map((c) => ({
      id: c.id,
      container_no: c.container_no,
      container_size: c.container_size,
      shipper: c.shipper || "-",
      pol: c.place_of_loading || "-",
      pod: c.place_of_delivery || "-",
      associated_date: c.date_hired ? dayjs(c.date_hired).format("YYYY-MM-DD") : "-",
      days_till_today: c.date_hired ? dayjs().diff(dayjs(c.date_hired), "day") : 0,
      status: "Occupied",
    }));

  const availableData = containers
    .filter((c) => getStatus(c) === "Available")
    .map((c) => ({
      id: c.id,
      container_no: c.container_no,
      container_size: c.container_size,
      location: c.place_of_delivery || "-",
      condition: "Good",
      ownership: c.ownership_type || "-",
      status: "Available",
    }));

  const hiredData = containers
    .filter((c) => getStatus(c) === "Hired")
    .map((c) => ({
      id: c.id,
      container_no: c.container_no,
      container_size: c.container_size,
      shipper: c.shipper || "-",
      pol: c.place_of_loading || "-",
      pod: c.place_of_delivery || "-",
      associated_date: c.date_hired ? dayjs(c.date_hired).format("YYYY-MM-DD") : "-",
      days_till_today: c.date_hired ? dayjs().diff(dayjs(c.date_hired), "day") : 0,
      status: "Hired",
    }));

  const aboutColumns = [
    { 
      key: "container_no", 
      label: "Container No",
      sortable: true,
      render: (item) => <Typography variant="body1" fontWeight="bold" noWrap>{item.container_no || "N/A"}</Typography>
    },
    { 
      key: "container_size", 
      label: "Size", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap>{item.container_size || "N/A"}</Typography>
    },
    { 
      key: "date_hired", 
      label: "Date Hired", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap>{item.date_hired}</Typography>
    },
    { 
      key: "date_reached", 
      label: "Date Reached", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap>{item.date_reached}</Typography>
    },
    { 
      key: "free_days", 
      label: "Free Days", 
      sortable: true,
      render: (item) => <Typography variant="body1">{item.free_days || 0}</Typography>
    },
    { 
      key: "return_date", 
      label: "Return Date", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap>{item.return_date}</Typography>
    },
    { 
      key: "ownership", 
      label: "Ownership", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140 }}>{item.ownership || "N/A"}</Typography>
    },
    { 
      key: "status", 
      label: "Status",
      sortable: false,
      render: (item) => <Chip label={item.status} color={statusColors[item.status] || "default"} size="small" sx={{ fontSize: '0.875rem' }} />
    },
  ];

  const occupiedColumns = [
    { 
      key: "container_no", 
      label: "Container No",
      sortable: true,
      render: (item) => <Typography variant="body1" fontWeight="bold" noWrap>{item.container_no || "N/A"}</Typography>
    },
    { 
      key: "container_size", 
      label: "Size", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap>{item.container_size || "N/A"}</Typography>
    },
    { 
      key: "shipper", 
      label: "Shipper", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140 }}>{item.shipper || "N/A"}</Typography>
    },
    { 
      key: "pol", 
      label: "POL", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140 }}>{item.pol || "N/A"}</Typography>
    },
    { 
      key: "pod", 
      label: "POD", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap>{item.pod || "N/A"}</Typography>
    },
    { 
      key: "associated_date", 
      label: "Associated Date", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap>{item.associated_date}</Typography>
    },
    { 
      key: "days_till_today", 
      label: "Days Associated", 
      sortable: true,
      render: (item) => <Typography variant="body1">{item.days_till_today || 0}</Typography>
    },
    { 
      key: "status", 
      label: "Status",
      sortable: false,
      render: (item) => <Chip label={item.status} color={statusColors[item.status] || "default"} size="small" sx={{ fontSize: '0.875rem' }} />
    },
  ];

  const availableColumns = [
    { 
      key: "container_no", 
      label: "Container No",
      sortable: true,
      render: (item) => <Typography variant="body1" fontWeight="bold" noWrap>{item.container_no || "N/A"}</Typography>
    },
    { 
      key: "container_size", 
      label: "Size", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap>{item.container_size || "N/A"}</Typography>
    },
    { 
      key: "location", 
      label: "Location", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140 }}>{item.location || "N/A"}</Typography>
    },
    { 
      key: "condition", 
      label: "Condition", 
      sortable: true,
      render: (item) => <Typography variant="body1">{item.condition || "N/A"}</Typography>
    },
    { 
      key: "ownership", 
      label: "Ownership", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140 }}>{item.ownership || "N/A"}</Typography>
    },
    { 
      key: "status", 
      label: "Status",
      sortable: false,
      render: (item) => <Chip label={item.status} color={statusColors[item.status] || "default"} size="small" sx={{ fontSize: '0.875rem' }} />
    },
  ];

  const hiredColumns = [
    { 
      key: "container_no", 
      label: "Container No",
      sortable: true,
      render: (item) => <Typography variant="body1" fontWeight="bold" noWrap>{item.container_no || "N/A"}</Typography>
    },
    { 
      key: "container_size", 
      label: "Size", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap>{item.container_size || "N/A"}</Typography>
    },
    { 
      key: "shipper", 
      label: "Shipper", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140 }}>{item.shipper || "N/A"}</Typography>
    },
    { 
      key: "pol", 
      label: "POL", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap sx={{ maxWidth: 140 }}>{item.pol || "N/A"}</Typography>
    },
    { 
      key: "pod", 
      label: "POD", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap>{item.pod || "N/A"}</Typography>
    },
    { 
      key: "associated_date", 
      label: "Associated Date", 
      sortable: true,
      render: (item) => <Typography variant="body1" noWrap>{item.associated_date}</Typography>
    },
    { 
      key: "days_till_today", 
      label: "Days Associated", 
      sortable: true,
      render: (item) => <Typography variant="body1">{item.days_till_today || 0}</Typography>
    },
    { 
      key: "status", 
      label: "Status",
      sortable: false,
      render: (item) => <Chip label={item.status} color={statusColors[item.status] || "default"} size="small" sx={{ fontSize: '0.875rem' }} />
    },
  ];

  return (
    <Slide  sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }} direction="up" in={slideIn} timeout={1000} mountOnEnter unmountOnExit>
      <Paper  sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "#fafafa" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Containers
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={startAdd}
            sx={{ 
              borderRadius: 2,
              backgroundColor: "#0d6c6a",
              color: "#fff",
              "&:hover": { backgroundColor: "#0a5a59" },
              fontSize: '0.875rem',
              fontWeight: 'medium',
              transition: 'all 0.2s ease',
              minHeight: 40,
            }}
          >
            Add Container
          </Button>
        </Stack>

        <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} sx={{ mb: 2 }}>
          <Tab label="About" />
          <Tab label="Occupied" />
          <Tab label="Available" />
          <Tab label="Hired" />
        </Tabs>

        {tab === 0 && (
          <CustomTable
            columns={aboutColumns}
            rows={aboutData}
            filters={aboutFilters}
            setFilters={setAboutFilters}
            tabLabel="About"
          />
        )}
        {tab === 1 && (
          <CustomTable
            columns={occupiedColumns}
            rows={occupiedData}
            filters={occupiedFilters}
            setFilters={setOccupiedFilters}
            tabLabel="Occupied"
          />
        )}
        {tab === 2 && (
          <CustomTable
            columns={availableColumns}
            rows={availableData}
            filters={availableFilters}
            setFilters={setAvailableFilters}
            tabLabel="Available"
          />
        )}
        {tab === 3 && (
          <CustomTable
            columns={hiredColumns}
            rows={hiredData}
            filters={hiredFilters}
            setFilters={setHiredFilters}
            tabLabel="Hired"
          />
        )}
      </Paper>
    </Slide>
  );
}