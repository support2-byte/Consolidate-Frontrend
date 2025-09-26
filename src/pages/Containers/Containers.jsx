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
  Modal,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import dayjs from "dayjs";

// --- Status Colors --- //
const statusColors = {
  Available: "success",
  Occupied: "warning",
  Hired: "info",
};

// --- Helper to derive status --- //
function getStatus(c) {
  console.log("GetStatus", c);
  const now = dayjs();

  if (!c.date_hired) return "Available"; // never hired
  if (c.return_date && dayjs(c.return_date).isBefore(now)) return "Available"; // already returned
  if (c.return_date && dayjs(c.return_date).isAfter(now)) return "Occupied"; // still occupied
  if (c.date_hired && !c.return_date) return "Hired"; // hired out, no return yet
  return "Available";
}



const UsageModal = ({ open, onClose, container }) => {
  if (!container) return null;

  // ✅ Dummy usage history
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
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 3,
        }}
      >
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Usage History – {container.container_no}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f5f5", }}>
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
                <TableCell style={{width:200}}>
                  {u.pol} → {u.pod}
                </TableCell>
                <TableCell>{dayjs(u.job_date).format("YYYY-MM-DD")}</TableCell>
                <TableCell>{u.returned ? "Yes" : "No"}</TableCell>
                <TableCell>{u.remarks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box textAlign="right" mt={3}>
          <Button
            onClick={onClose}
            variant="contained"
            sx={{ borderRadius: 2,color:"#fff" }}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

// --- Table Component with Filters & CSV --- //
const CustomTable = ({ columns, rows, filters, setFilters }) => {
  const [usageOpen, setUsageOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState(null);

  const filteredRows = rows.filter((row) =>
    Object.keys(filters).every(
      (key) =>
        !filters[key] ||
        row[key]?.toString().toLowerCase().includes(filters[key].toLowerCase())
    )
  );

  const handleExport = () => {
    const headers = columns.join(",");
    const rowsCsv = filteredRows.map((r) => Object.values(r).join(","));
    const csv = [headers, ...rowsCsv].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "containers_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewUsage = (row) => {
    setSelectedContainer(row);
    setUsageOpen(true);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* 🔍 Filters */}
      <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
        {Object.keys(filters).map((key) => (
          <TextField
            key={key}
            label={key.replace("_", " ")}
            size="small"
            value={filters[key]}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, [key]: e.target.value }))
            }
            sx={{
              minWidth: 200,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
                transition: "all 0.3s ease",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#ddd" },
                "&:hover fieldset": { borderColor: "primary.main" },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  boxShadow: "0 0 8px rgba(25, 118, 210, 0.3)",
                },
              },
              "& .MuiInputLabel-root": {
                // fontWeight: 100,
                letterSpacing: 0.5,
                textTransform: "capitalize",
                color: "rgba(180, 174, 174, 1)",
              },
            }}
          />
        ))}
        <Button
          style={{ backgroundColor: "#f58220", color: "#fff" }}
          variant="contained"
          sx={{ borderRadius: 2 }}
          startIcon={<SearchIcon />}
        >
          Search
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ClearIcon />}
          onClick={() =>
            setFilters(Object.fromEntries(Object.keys(filters).map((k) => [k, ""])))
          }
          sx={{ borderRadius: 2 }}
        >
          Reset
        </Button>
      </Stack>

      {/* 📋 Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "12px" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col} sx={{ fontWeight: "bold" }}>
                  {col}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>View Usage</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row, i) => (
              <TableRow key={i}>
                {Object.entries(row).map(([key, val], j) =>
                  key === "status" ? null : <TableCell key={j}>{val}</TableCell>
                )}
                <TableCell>
                  <Chip
                    label={row.status}
                    color={statusColors[row.status] || "default"}
                    variant="contained"
                   style={{margin:"0 auto",display:"flex"}}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => handleViewUsage(row)}
                    sx={{ borderRadius: 1,pt:0.5,pb:0  }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        variant="contained"
        color="warning"
        startIcon={<DownloadIcon />}
        onClick={handleExport}
        sx={{ borderRadius: 2, px: 3, mt: 2 }}
      >
        Export CSV
      </Button>

      {/* 📦 Usage History Modal */}
      <UsageModal
        open={usageOpen}
        onClose={() => setUsageOpen(false)}
        container={selectedContainer}
      />
    </Box>
  );
};

export default function ContainersTabs() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const [containers, setContainers] = useState([]);

  // ✅ Fetch containers
  useEffect(() => {
    const fetchContainers = async () => {
      try {
        const res = await api.get("/api/containers");
        setContainers(res.data);
      } catch (err) {
        console.error("❌ Error fetching containers:", err);
      }
    };
    fetchContainers();
  }, []);

  // Filters
  const [aboutFilters, setAboutFilters] = useState({
    container_no: "",
    container_size: "",
    date_hired: "",
    date_reached: "",
    free_days: "",
    return_date: "",
    // place_of_loading: "",
    // place_of_delivery: "",
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
    container_no: c.container_no,
    container_size: c.container_size,
    date_hired: c.date_hired ? dayjs(c.date_hired).format("YYYY-MM-DD") : "-",
    date_reached: c.date_reached ? dayjs(c.date_reached).format("YYYY-MM-DD") : "-",
    free_days: c.free_days || "-",
    return_date: c.return_date ? dayjs(c.return_date).format("YYYY-MM-DD") : "-",
    // place_of_loading: c.place_of_loading || "-",
    // place_of_delivery: c.place_of_delivery || "-",
    ownership: c.ownership_type || "-",
    status: getStatus(c),
  }));

  const occupiedData = containers
    .filter((c) => getStatus(c) === "Occupied")
    .map((c) => ({
      container_no: c.container_no,
      container_size: c.container_size,
      shipper: c.shipper || "-",
      pol: c.place_of_loading || "-",
      pod: c.place_of_delivery || "-",
      associated_date: c.date_hired ? dayjs(c.date_hired).format("YYYY-MM-DD") : "-",
      days_till_today: c.date_hired ? dayjs().diff(dayjs(c.date_hired), "day") : "-",
      status: "Occupied",
    }));

  const availableData = containers
    .filter((c) => getStatus(c) === "Available")
    .map((c) => ({
      container_no: c.container_no,
      container_size: c.container_size,
      location: c.place_of_delivery || "-",
      condition: "Good", // placeholder
      ownership: c.ownership_type || "-",
      status: "Available",
    }));

  const hiredData = containers
    .filter((c) => getStatus(c) === "Hired")
    .map((c) => ({
      container_no: c.container_no,
      container_size: c.container_size,
      shipper: c.shipper || "-",
      pol: c.place_of_loading || "-",
      pod: c.place_of_delivery || "-",
      associated_date: c.date_hired ? dayjs(c.date_hired).format("YYYY-MM-DD") : "-",
      days_till_today: c.date_hired ? dayjs().diff(dayjs(c.date_hired), "day") : "-",
      status: "Hired",
    }));

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Containers
          </Typography>
          <Button
            style={{ backgroundColor: "#f58220", color: "#fff" }}
            variant="contained"
            startIcon={<AddIcon />}
            onClick={startAdd}
            sx={{ borderRadius: 2 }}
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
            columns={[
              "Container No",
              "Size",
              "Date Hired",
              "Date Reached",
              "Free Days",
              "Return Date",
              // "POL",
              // "POD",
              "Ownership",
            ]}
            rows={aboutData}
            filters={aboutFilters}
            setFilters={setAboutFilters}
          />
        )}
        {tab === 1 && (
          <CustomTable
            columns={[
              "Container No",
              "Size",
              "Shipper",
              "POL",
              "POD",
              "Associated Since Date",
              "Associated Days till today",
            ]}
            rows={occupiedData}
            filters={occupiedFilters}
            setFilters={setOccupiedFilters}
          />
        )}
        {tab === 2 && (
          <CustomTable
            columns={["Container No", "Size", "Location", "Condition", "Ownership"]}
            rows={availableData}
            filters={availableFilters}
            setFilters={setAvailableFilters}
          />
        )}
        {tab === 3 && (
          <CustomTable
            columns={[
              "Container No",
              "Size",
              "Shipper",
              "POL",
              "POD",
              "Associated Since Date",
              "Associated Days till today",
            ]}
            rows={hiredData}
            filters={hiredFilters}
            setFilters={setHiredFilters}
          />
        )}
      </Box>
    </Paper>
  );
}
