import {
  Stack,
  Typography,
  Button,
  Box,
  TextField,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";

const OrdersToolbar = ({
  numSelected,
  loading,
  exporting,
  total,
  loadingContainers,
  onAddSelectedToContainer,
  onDirectAssign,
  onExport,
  onNewOrder,
  search,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  status,
  onStatusChange,
  statuses,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight="bold" color="#f58220">
          Orders List
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            disabled={numSelected === 0}
            onClick={onAddSelectedToContainer}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              backgroundColor: "#0d6c6a",
              color: "#fff",
              "&:hover": { backgroundColor: "#0d6c6a" },
            }}
          >
            Add Selected to Container ({numSelected})
          </Button>

          <Button
            variant="contained"
            disabled={numSelected === 0 || loadingContainers}
            onClick={onDirectAssign}
            startIcon={<AssignmentIcon />}
            sx={{
              borderRadius: 2,
              backgroundColor: "#f58220",
              color: "#fff",
              "&:hover": { backgroundColor: "#f58220" },
            }}
          >
            Direct Assign Containers ({numSelected})
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={onExport}
            disabled={loading || exporting || total === 0}
            sx={{
              borderRadius: 2,
              borderColor: "#0d6c6a",
              color: "#0d6c6a",
              "&:hover": {
                borderColor: "#0d6c6a",
                backgroundColor: "#0d6c6a",
                color: "#fff",
              },
            }}
          >
            {exporting ? <CircularProgress size={20} color="inherit" /> : null}
            Export Orders
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewOrder}
            sx={{
              borderRadius: 2,
              backgroundColor: "#0d6c6a",
              color: "#fff",
              "&:hover": { backgroundColor: "#0d6c6a" },
            }}
          >
            New Order
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TextField
            label="Search Orders"
            placeholder="Booking Ref, Form No, Sender, Receiver, Status..."
            type="search"
            name="search"
            value={search || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            size="small"
            sx={{ width: 320 }}
            onKeyDown={handleKeyDown}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={onSearchSubmit}
                    sx={{ color: "primary.main" }}
                  >
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" disabled={!search} onClick={onClearSearch}>
            Clear Search
          </Button>
        </Box>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={status}
            label="Status"
            onChange={onStatusChange}
          >
            <MenuItem value="">All</MenuItem>
            {statuses.map((s) => (
              <MenuItem key={s.id} value={s.order_status}>
                {s.order_status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </>
  );
};

export default OrdersToolbar;
