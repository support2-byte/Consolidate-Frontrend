import React from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ConsignmentHistoryTab from "./ConsignmentHistoryTab";
import UnassignedOrdersTab from "./UnassignedOrdersTab";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  width: { xs: "90%", sm: 1400 },
  maxHeight: "90vh",
  overflowY: "auto",
};

const HistoryModal = ({
  open,
  onClose,
  selectedContainerNo,
  usageHistory,
  unassignedOrders,
  activeHistoryTab,
  setActiveHistoryTab,
  loadingHistory,
  loadingUnassigned,
  generatingPDF,
  getPlaceName,
  onPrintStatusHistory,
  onPrintFullManifest,
  onSingleJobPDF,
  onDetailManifestPDF,
}) => (
  <Modal open={open} onClose={onClose}>
    <Box sx={modalStyle}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#0d6c6a" }}>
          Usage History for Container {selectedContainerNo || "N/A"}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Tooltip title="Print Status Change History">
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={onPrintStatusHistory}
              disabled={generatingPDF || !usageHistory.length}
              sx={{
                borderRadius: 2,
                borderColor: "#0d6c6a",
                color: "#0d6c6a",
                "&:hover": { backgroundColor: "rgba(13, 108, 106, 0.1)" },
              }}
            >
              {generatingPDF ? "Generating..." : "Print Status History"}
            </Button>
          </Tooltip>

          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={onPrintFullManifest}
            disabled={generatingPDF || !usageHistory.length}
            sx={{
              borderRadius: 2,
              borderColor: "#f58220",
              color: "#f58220",
              "&:hover": { backgroundColor: "rgba(245, 130, 32, 0.1)" },
            }}
          >
            {generatingPDF ? "Generating..." : "Print Full Manifest"}
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={activeHistoryTab}
          onChange={(_, v) => setActiveHistoryTab(v)}
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: "#0d6c6a" } }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Consignment History
                {usageHistory.length > 0 && (
                  <Chip
                    label={
                      usageHistory.filter((c) => c.orders?.length > 0).length
                    }
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 11,
                      bgcolor: "#e6f4f3",
                      color: "#0d6c6a",
                    }}
                  />
                )}
              </Box>
            }
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Unassigned Orders
                {unassignedOrders.length > 0 && (
                  <Chip
                    label={unassignedOrders.length}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 11,
                      bgcolor: "#fff3e0",
                      color: "#e65100",
                    }}
                  />
                )}
              </Box>
            }
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {activeHistoryTab === 0 && (
        <ConsignmentHistoryTab
          usageHistory={usageHistory}
          loadingHistory={loadingHistory}
          getPlaceName={getPlaceName}
          selectedContainerNo={selectedContainerNo}
          generatingPDF={generatingPDF}
          onSinglePDF={onSingleJobPDF}
          onDetailManifest={onDetailManifestPDF}
        />
      )}
      {activeHistoryTab === 1 && (
        <UnassignedOrdersTab
          unassignedOrders={unassignedOrders}
          loadingUnassigned={loadingUnassigned}
        />
      )}

      <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          startIcon={<CloseIcon />}
          onClick={onClose}
          sx={{
            textTransform: "none",
            color: "#fff",
            bgcolor: "#f58220",
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          Close
        </Button>
      </Box>
    </Box>
  </Modal>
);

export default HistoryModal;
