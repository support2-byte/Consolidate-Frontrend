import {
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Button,
  IconButton,
} from "@mui/material";
import { Save } from "lucide-react";
import { StatusFormFields } from "./statusFormFiedls";
import { Close } from "@mui/icons-material";

const TEAL = "#1a7a6e";

export function StatusDialog({
  open,
  onClose,
  title,
  form,
  onFieldChange,
  onSave,
  saving,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          bgcolor: TEAL,
          color: "white",
          fontWeight: 700,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.5,
          px: 2.5,
        }}
      >
        {title}
        <IconButton size="small" onClick={onClose} sx={{ color: "white" }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          pt: "24px !important",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minHeight: 320,
        }}
      >
        <StatusFormFields form={form} onChange={onFieldChange} />
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          sx={{
            borderColor: "#ccc",
            color: "#555",
            "&:hover": { borderColor: "#aaa" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          size="small"
          disabled={saving}
          startIcon={
            saving ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <Save fontSize="small" />
            )
          }
          sx={{
            bgcolor: TEAL,
            "&:hover": { bgcolor: "#155f55" },
            fontWeight: 600,
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
