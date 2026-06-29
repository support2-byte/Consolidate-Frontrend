import { Close } from "@mui/icons-material";
import {
  Dialog,
  DialogContent,
  Typography,
  DialogActions,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import { Delete } from "lucide-react";

export function DeleteDialog({ open, onClose, onConfirm, deleting, rowName }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogContent
        sx={{
          bgcolor: "#d32f2f",
          color: "white",
          fontWeight: 700,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.5,
          px: 2.5,
        }}
      >
        Delete Status
        <IconButton size="small" onClick={onClose} sx={{ color: "white" }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogContent>

      <DialogContent sx={{ pt: "24px !important" }}>
        <Typography variant="body2" sx={{ color: "#555" }}>
          Are you sure you want to delete <strong>{rowName}</strong>? This
          action cannot be undone.
        </Typography>
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
          onClick={onConfirm}
          variant="contained"
          size="small"
          disabled={deleting}
          startIcon={
            deleting ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <Delete fontSize="small" />
            )
          }
          sx={{
            bgcolor: "#d32f2f",
            "&:hover": { bgcolor: "#b71c1c" },
            fontWeight: 600,
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
