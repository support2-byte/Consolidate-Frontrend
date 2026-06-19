import React from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
  TablePagination,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";

import { useContainerData } from "../../hooks/useContainerData";
import { usePDFGenerators } from "../../hooks/usePDFGenerators";
import ContainerTableRow from "../../components/containers/ContainerTableRow";
import ContainerFormModal from "../../components/containers/ContainerFormModal";
import HistoryModal from "../../components/containers/HistoryModal";
import { TABLE_HEADERS } from "../../constants/containers";

const ContainerModule = ({ propContainers = [] }) => {
  const state = useContainerData();

  const {
    generateFullManifestPDF,
    generateJobDetailManifestPDF,
    generateSingleJobManifestPDF,
    generateStatusHistoryPDF,
  } = usePDFGenerators({
    historyCid: state.historyCid,
    selectedContainerNo: state.selectedContainerNo,
    usageHistory: state.usageHistory,
    getPlaceName: state.getPlaceName,
    showToast: state.showToast,
    setGeneratingPDF: state.setGeneratingPDF,
  });

  const {
    // Data
    filters,
    containers,
    totalCount,
    currentPage,
    rowsPerPage,
    sizes,
    types,
    ownershipTypes,
    formData,
    isEditing,
    openAddModal,
    setOpenAddModal,
    editingId,
    tempData,
    setTempData,
    openHistoryModal,
    setOpenHistoryModal,
    selectedContainerNo,
    usageHistory,
    unassignedOrders,
    activeHistoryTab,
    setActiveHistoryTab,
    jobStatusOptions,
    // Loading
    loadingContainers,
    loadingForm,
    loadingReturned,
    loadingOptions,
    loadingHistory,
    loadingUnassigned,
    generatingPDF,
    // Feedback
    error,
    snackbar,
    handleSnackbarClose,
    // Handlers
    handleFilterChange,
    handleFormChange,
    handleFormSubmit,
    resetForm,
    handleEdit,
    handleQuickEdit,
    handleQuickSave,
    handleQuickCancel,
    markReturned,
    openHistory,
    setCurrentPage,
    setRowsPerPage,
    getPlaceName,
  } = state;

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        bgcolor: "#f5f5f5",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          maxWidth: 1450,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "#f58220" }}
          >
            Container Master
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={() => {
              resetForm();
              setOpenAddModal(true);
            }}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 5,
              py: 1,
              fontSize: "1rem",
              background: "#0d6c6a",
              color: "#fff",
            }}
          >
            Add Containers
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* Filter bar */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Container No."
            name="container_number"
            value={filters.container_number || ""}
            onChange={handleFilterChange}
            size="small"
            variant="outlined"
            sx={{ minWidth: 150, bgcolor: "white" }}
          />
        </Box>

        {/* Table */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <TableContainer
            component={Paper}
            sx={{ flex: 1, overflow: "auto", boxShadow: 3, borderRadius: 2 }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {TABLE_HEADERS.map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        bgcolor: "#0d6c6a",
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingContainers ? (
                  <TableRow>
                    <TableCell
                      colSpan={TABLE_HEADERS.length}
                      align="center"
                      sx={{ py: 4 }}
                    >
                      <CircularProgress size={24} />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        Loading containers...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={TABLE_HEADERS.length}
                      align="center"
                      sx={{ py: 4, color: "error.main" }}
                    >
                      <Typography variant="body2">{error}</Typography>
                    </TableCell>
                  </TableRow>
                ) : containers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={TABLE_HEADERS.length}
                      align="center"
                      sx={{ py: 4 }}
                    >
                      <Typography variant="body2">
                        No containers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  containers.map((container, index) => (
                    <ContainerTableRow
                      key={container.cid || index}
                      container={container}
                      index={index}
                      isEditingRow={editingId === container.cid}
                      tempData={tempData}
                      setTempData={setTempData}
                      jobStatusOptions={jobStatusOptions}
                      loadingUpdate={false}
                      loadingHistory={loadingHistory}
                      loadingReturned={loadingReturned}
                      onQuickEdit={handleQuickEdit}
                      onQuickSave={handleQuickSave}
                      onQuickCancel={handleQuickCancel}
                      onEdit={handleEdit}
                      onOpenHistory={openHistory}
                      onMarkReturned={markReturned}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!loadingContainers && totalCount > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={currentPage - 1}
              onPageChange={(_, newPage) => setCurrentPage(newPage + 1)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              sx={{ flexShrink: 0, mt: 1 }}
            />
          )}
        </Box>

        <ContainerFormModal
          open={openAddModal}
          onClose={resetForm}
          isEditing={isEditing}
          formData={formData}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
          loadingForm={loadingForm}
          sizes={sizes}
          types={types}
          ownershipTypes={ownershipTypes}
        />

        <HistoryModal
          open={openHistoryModal}
          onClose={() => setOpenHistoryModal(false)}
          selectedContainerNo={selectedContainerNo}
          usageHistory={usageHistory}
          unassignedOrders={unassignedOrders}
          activeHistoryTab={activeHistoryTab}
          setActiveHistoryTab={setActiveHistoryTab}
          loadingHistory={loadingHistory}
          loadingUnassigned={loadingUnassigned}
          generatingPDF={generatingPDF}
          getPlaceName={getPlaceName}
          onPrintStatusHistory={() =>
            generateStatusHistoryPDF(selectedContainerNo)
          }
          onPrintFullManifest={generateFullManifestPDF}
          onSingleJobPDF={generateSingleJobManifestPDF}
          onDetailManifestPDF={generateJobDetailManifestPDF}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={
            loadingForm || loadingOptions || loadingContainers || generatingPDF
          }
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Box>
    </Box>
  );
};

export default ContainerModule;
