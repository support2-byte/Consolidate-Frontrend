import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ConsignmentCard } from "./ConsignmentCard";

const SUMMARY_HEADERS = [
  "#",
  "Consignment",
  "Date",
  "Orders",
  "Items",
  "Trip",
  "Status",
  "Actions",
];

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
    <TableContainer component={Paper} sx={{ boxShadow: 1, borderRadius: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {SUMMARY_HEADERS.map((h) => (
              <TableCell
                key={h}
                sx={{
                  bgcolor: "#0d6c6a",
                  color: "#fff",
                  fontWeight: 600,
                  py: 1,
                  borderBottom: "none",
                }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
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
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ConsignmentHistoryTab;
