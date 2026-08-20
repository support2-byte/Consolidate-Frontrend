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
  useMediaQuery,
  useTheme,
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
  p: { xs: 2, sm: 3, md: 4 },
  borderRadius: 2,
  width: { xs: "95%", sm: "90%", md: 1400 },
  maxWidth: "100%",
  maxHeight: { xs: "95vh", sm: "90vh" },
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
  onGenerateUnassignedManifest,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: 1.5, sm: 2 },
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: "#0d6c6a",
              fontSize: { xs: "1.1rem", sm: "1.5rem" },
              wordBreak: "break-word",
            }}
          >
            Usage History for Container {selectedContainerNo || "N/A"}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1, sm: 2 },
              alignItems: { xs: "stretch", sm: "center" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Tooltip title="Print Status Change History">
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={onPrintStatusHistory}
                disabled={generatingPDF || !usageHistory.length}
                fullWidth={isMobile}
                sx={{
                  borderRadius: 2,
                  borderColor: "#0d6c6a",
                  color: "#0d6c6a",
                  whiteSpace: "nowrap",
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
              fullWidth={isMobile}
              sx={{
                borderRadius: 2,
                borderColor: "#f58220",
                color: "#f58220",
                whiteSpace: "nowrap",
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
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
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
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                minWidth: { xs: "auto", sm: 90 },
              }}
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
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                minWidth: { xs: "auto", sm: 90 },
              }}
            />
          </Tabs>
        </Box>

        <Box sx={{ overflowX: "auto" }}>
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
              generatingPDF={generatingPDF}
              onGenerateManifest={onGenerateUnassignedManifest}
            />
          )}
        </Box>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            startIcon={<CloseIcon />}
            onClick={onClose}
            fullWidth={isMobile}
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
};

export default HistoryModal;
