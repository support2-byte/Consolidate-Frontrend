import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  Paper,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  TablePagination,
  Chip,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { data } from "react-router-dom";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
  },
}));

const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#0d6c6a",
  color: "#fff",
  fontWeight: 500,
}));

export default function ContainerReleases() {
  const context = useAuth();
  const user_id = context.user.id;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [containerFilter, setContainerFilter] = useState("");
  const [consignmentFilter, setConsignmentFilter] = useState("");

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [openReleaseDialog, setOpenReleaseDialog] = useState(false);

  const [releaseDate, setReleaseDate] = useState(dayjs().format("YYYY-MM-DD"));

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const getAssignments = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/containers/container-consignments");

      console.log("API Response:", res.data);
      console.log("Assignments:", res.data?.data);

      setAssignments(res.data?.data || []);
    } catch (err) {
      console.error(err);

      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to load container assignments",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getAssignments();
  }, [getAssignments]);

  const handleReleaseClick = (row) => {
    setSelectedAssignment(row);
    setReleaseDate(dayjs().format("YYYY-MM-DD"));
    setOpenReleaseDialog(true);
  };

  const handleReleaseContainer = async () => {
    if (!selectedAssignment) return;

    if (!releaseDate) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Please select a release date",
      });
      return;
    }

    try {
      await api.put(
        `/api/containers/container-consignments/${selectedAssignment.id}/release`,
        {
          user_id,
          release_date: releaseDate,
        },
      );

      setSnackbar({
        open: true,
        severity: "success",
        message: "Container released successfully",
      });

      setOpenReleaseDialog(false);
      setSelectedAssignment(null);

      getAssignments();
    } catch (err) {
      console.error(err);

      setSnackbar({
        open: true,
        severity: "error",
        message: err.response?.data?.message || "Failed to release container",
      });
    }
  };

  const filteredAssignments = assignments.filter((row) => {
    const containerMatch = String(row.container_number || "")
      .toLowerCase()
      .includes(containerFilter.toLowerCase());

    const consignmentMatch = String(row.consignment_number || "")
      .toLowerCase()
      .includes(consignmentFilter.toLowerCase());

    return containerMatch && consignmentMatch;
  });

  const paginatedAssignments = filteredAssignments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: "#0d6c6a",
    color: "#fff",
    fontWeight: 500,
    whiteSpace: "normal",
    wordBreak: "break-word",
  }));

  const StyledTableCell = styled(TableCell)({
    whiteSpace: "normal",
    wordBreak: "break-word",
  });

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        boxShadow: 3,
        bgcolor: "#fafafa",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight="bold" color="#f58220">
          Release Containers
        </Typography>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3}>
        <TextField
          label="Search Container #"
          size="small"
          fullWidth
          value={containerFilter}
          onChange={(e) => setContainerFilter(e.target.value)}
        />

        <TextField
          label="Search Consignment #"
          size="small"
          fullWidth
          value={consignmentFilter}
          onChange={(e) => setConsignmentFilter(e.target.value)}
        />
      </Stack>

      <TableContainer
        sx={{
          borderRadius: 2,
          width: "100%",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableHeadCell>Container</StyledTableHeadCell>
              <StyledTableHeadCell>Consignment</StyledTableHeadCell>
              <StyledTableHeadCell>Assigned At</StyledTableHeadCell>
              <StyledTableHeadCell>Created At</StyledTableHeadCell>
              <StyledTableHeadCell>Created By</StyledTableHeadCell>
              <StyledTableHeadCell>Released At</StyledTableHeadCell>
              <StyledTableHeadCell>Released By</StyledTableHeadCell>
              <StyledTableHeadCell>Status</StyledTableHeadCell>
              <StyledTableHeadCell align="center">Action</StyledTableHeadCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedAssignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No active container assignments found
                </TableCell>
              </TableRow>
            ) : (
              paginatedAssignments.map((row) => (
                <StyledTableRow key={row.id}>
                  <TableCell>{row.container_number}</TableCell>

                  <TableCell>{row.consignment_number}</TableCell>

                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {dayjs(row.assigned_at).format("DD-MMM-YYYY")}
                  </TableCell>

                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {dayjs(row.created_at).format("DD-MMM-YYYY")}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={row.created_by || ""}>
                      <span>
                        {row.created_by?.length > 22
                          ? `${row.created_by.substring(0, 22)}...`
                          : row.created_by}
                      </span>
                    </Tooltip>
                  </TableCell>

                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {row.released_at
                      ? dayjs(row.released_at).format("DD-MMM-YYYY")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={row.released_by || ""}>
                      <span>
                        {row.released_by?.length > 22
                          ? `${row.released_by.substring(0, 22)}...`
                          : row.released_by || "-"}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.active ? "Assigned" : "Inactive"}
                      color={row.active ? "warning" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      disabled={!row.active}
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleReleaseClick(row)}
                    >
                      {!row.active ? "Released" : "Release"}
                    </Button>
                  </TableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredAssignments.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      <Dialog
        open={openReleaseDialog}
        onClose={() => setOpenReleaseDialog(false)}
      >
        <DialogTitle>Release Container</DialogTitle>

        <DialogContent>
          <Typography gutterBottom>
            Container:
            <strong> {selectedAssignment?.container_number}</strong>
          </Typography>

          <Typography gutterBottom>
            Consignment:
            <strong> {selectedAssignment?.consignment_number}</strong>
          </Typography>

          <TextField
            fullWidth
            margin="normal"
            label="Release Date"
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Typography color="error" sx={{ mt: 2 }}>
            This action will release the container and make it available for
            future consignments.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenReleaseDialog(false)}>Cancel</Button>

          <Button
            variant="contained"
            color="success"
            onClick={handleReleaseContainer}
          >
            Release
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Paper>
  );
}
