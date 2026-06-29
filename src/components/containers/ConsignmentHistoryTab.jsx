import { Box, CircularProgress, Typography } from "@mui/material";
import { ConsignmentCard } from "./ConsignmentCard";

const ConsignmentHistoryTab = ({
  usageHistory,
  loadingHistory,
  getPlaceName,
  selectedContainerNo,
  generatingPDF,
  onSinglePDF,
  onDetailManifest,
}) => {
  if (loadingHistory) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 1 }}>
          Loading history...
        </Typography>
      </Box>
    );
  }

  const visibleConsignments = (usageHistory || []).filter((c) => {
    if (!c?.orders?.length) return false;
    return c.orders.reduce((sum, o) => sum + (o.assignedQty || 0), 0) > 0;
  });

  if (!visibleConsignments.length) {
    return (
      <Typography
        variant="body2"
        align="center"
        sx={{ py: 4, color: "text.secondary" }}
      >
        No assignment history available
      </Typography>
    );
  }

  return (
    <>
      {visibleConsignments.map((consignment, groupIndex) => (
        <ConsignmentCard
          key={consignment.consignmentNo || `group-${groupIndex}`}
          consignment={consignment}
          groupIndex={groupIndex}
          getPlaceName={getPlaceName}
          selectedContainerNo={selectedContainerNo}
          generatingPDF={generatingPDF}
          onSinglePDF={onSinglePDF}
          onDetailManifest={onDetailManifest}
        />
      ))}
    </>
  );
};

export default ConsignmentHistoryTab;
