import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Box,
  Stack,
  Tooltip,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { createOrderDocumentTemplates } from "../../documents/createOrderDocumentTemplates";
import { buildDocumentRegistry } from "../../documents/buildDocumentRegistry";

const STATIC_DOCUMENT_LIST = [
  "3rd Party Shipper Undertaking for ANF.pdf",
  "3rd Party Shipper Indemnity for each order format.pdf",
  "CAS Bill of Lading.pdf",
  "Dubai Letter of Idemnity for Customs.pdf",
  "Essential Information.pdf",
  "GP#0121725 - Cargo GatePass.pdf",
  "Karachi Govt. Customs Stamp paper undertaking format.pdf",
  "Karachi, Undertaking for Customs, Each sender should give.pdf",
  "KYC Dubai Company.pdf",
  "KYC UK Company.pdf",
  "KYC Karachi Company.pdf",
  "Messiah Bill of Lading.pdf",
  "RGSL Bill of Lading.pdf",
  "Order Acknowledgement Printabe Version.pdf",
  "Order Confirmation & Acceptance Dubai Receiver.pdf",
  "Order Confirmation & Acceptance UK Receiver.pdf",
  "Order Confirmation & Acceptance Karachi Receiver.pdf",
  "Receiver Undertaking for Dubai Customs.pdf",
  "Receiver Undertaking Dubai ANF.pdf",
  "Rickmers Bill of Lading Sample.pdf",
  "Sender Undertaking for 3rd Party Shipper.pdf",
  "WHARFAGE - CONSIGNMENT NOTE.pdf",
];

const DocumentsModal = ({
  open,
  onClose,
  orderId,
  currentOrder,
  filterPlaces,
  showSnackbar,
}) => {
  const handleAction = (action, docName) => {
    if (!currentOrder) {
      showSnackbar("No order selected", "warning");
      return;
    }
    const templates = createOrderDocumentTemplates(filterPlaces);
    const registry = buildDocumentRegistry(currentOrder, templates);
    const doc = registry[docName];
    if (!doc) {
      showSnackbar("Document template not found", "warning");
      return;
    }

    if (action === "view") {
      const win = window.open("", "_blank");
      win.document.write(doc.content);
      win.document.close();
    } else if (action === "print") {
      const win = window.open("", "_blank");
      win.document.write(doc.content);
      win.document.close();
      win.onload = () => win.print();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, minHeight: "60vh" } }}
    >
      <DialogTitle
        sx={{
          bgcolor: "#0d6c6a",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">
          Documents - Order #{orderId || "123"}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold", width: 50 }}>#</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Document Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 120 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {STATIC_DOCUMENT_LIST.map((docName, index) => {
                const ext = docName.split(".").pop()?.toLowerCase() || "";
                let icon = <InsertDriveFileIcon />;
                if (ext === "pdf") icon = <PictureAsPdfIcon color="error" />;
                else if (["docx", "doc"].includes(ext))
                  icon = <DescriptionIcon color="primary" />;
                else if (["xlsx", "xls"].includes(ext))
                  icon = <AssignmentIcon color="success" />;
                return (
                  <TableRow
                    key={index}
                    hover
                    sx={{ "&:nth-of-type(odd)": { bgcolor: "#fafafa" } }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {icon}
                        <Typography variant="body2" fontWeight="medium">
                          {docName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {ext.toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Document">
                          <IconButton
                            size="small"
                            onClick={() => handleAction("view", docName)}
                            sx={{ color: "#0d6c6a" }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Document">
                          <IconButton
                            size="small"
                            onClick={() => handleAction("print", docName)}
                            sx={{ color: "#f58220" }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e0e0e0" }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderColor: "#0d6c6a", color: "#0d6c6a" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentsModal;
