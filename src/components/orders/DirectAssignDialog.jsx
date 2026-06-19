import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  Autocomplete,
  TextField,
  Chip,
  Button,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";

const DirectAssignDialog = ({
  open,
  onClose,
  numSelected,
  containers,
  loadingContainers,
  value,
  onChange,
  onConfirm,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>
      Select Containers for All Selected Orders ({numSelected})
    </DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Choose one or more containers to assign to all shipping details of the
        selected orders (full quantity).
      </Typography>
      {loadingContainers ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Autocomplete
          value={value}
          onChange={(_e, newValue) => onChange(newValue)}
          options={containers}
          getOptionLabel={(option) => option?.container_number || ""}
          isOptionEqualToValue={(option, val) => option.cid === val?.cid}
          renderOption={(props, option) => (
            <li {...props} key={option.cid}>
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", sm: "center" },
                  gap: 1,
                  py: 0.5,
                }}
              >
                <Box>
                  <Typography fontWeight={600}>
                    {option.container_number}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.container_size} {option.container_type}
                  </Typography>
                </Box>
                <Chip
                  label={option.owner_type || "N/A"}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Container"
              placeholder="Search container..."
              fullWidth
            />
          )}
          sx={{ mt: 1 }}
        />
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        disabled={!value || loadingContainers}
        startIcon={<AssignmentIcon />}
      >
        Assign Container
      </Button>
    </DialogActions>
  </Dialog>
);

export default DirectAssignDialog;
