import React, { useState, useCallback, useMemo } from "react";
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Box,
  Tooltip,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const AssignmentForm = React.memo(
  ({
    keyDetail,
    detailRemaining,
    detailRemainingWeight,
    assignmentQuantities = {},
    assignmentWeights = {},
    selectedContainersPerDetail = {},
    availableContainers = [],
    setAssignmentQuantities,
    setAssignmentWeights,
    setSelectedContainersPerDetail,
    onAssignPreview,
    loadingDate,
    setLoadingDate,
  }) => {
    const [localQty, setLocalQty] = useState(
      assignmentQuantities[keyDetail] ?? "",
    );

    const [localWeight, setLocalWeight] = useState(
      assignmentWeights[keyDetail] ?? "",
    );

    const today = new Date().toISOString().split("T")[0];

    // Single selected container
    const selectedCid = selectedContainersPerDetail[keyDetail] || "";

    // Exclude containers already selected elsewhere
    const availableForThisDetail = useMemo(() => {
      const globallySelected = Object.entries(selectedContainersPerDetail)
        .filter(([detailKey]) => detailKey !== keyDetail)
        .map(([, cid]) => cid)
        .filter(Boolean);

      return availableContainers.filter(
        (c) => !globallySelected.includes(c.cid),
      );
    }, [availableContainers, selectedContainersPerDetail, keyDetail]);

    const selectedContainer = useMemo(
      () => availableContainers.find((c) => c.cid === selectedCid),
      [availableContainers, selectedCid],
    );

    const isQtyValid = useMemo(() => {
      const num = Number(localQty);
      return !isNaN(num) && num >= 0 && num <= detailRemaining;
    }, [localQty, detailRemaining]);

    const isWeightValid = useMemo(() => {
      const num = Number(localWeight);
      return !isNaN(num) && num >= 0 && num <= detailRemainingWeight;
    }, [localWeight, detailRemainingWeight]);

    const canAssign = useMemo(
      () =>
        isQtyValid && isWeightValid && Number(localQty) > 0 && !!selectedCid,
      [isQtyValid, isWeightValid, localQty, selectedCid],
    );

    const handleQtyChange = useCallback((e) => {
      const value = e.target.value;

      if (value === "" || /^\d+$/.test(value)) {
        setLocalQty(value);
      }
    }, []);

    const handleQtyBlur = useCallback(() => {
      const num = Number(localQty);

      const clamped = Math.max(
        0,
        Math.min(isNaN(num) ? 0 : num, detailRemaining),
      );

      setLocalQty(clamped.toString());

      setAssignmentQuantities((prev) => ({
        ...prev,
        [keyDetail]: clamped.toString(),
      }));
    }, [localQty, detailRemaining, keyDetail, setAssignmentQuantities]);

    const handleWeightChange = useCallback((e) => {
      const value = e.target.value;

      if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
        setLocalWeight(value);
      }
    }, []);

    const handleWeightBlur = useCallback(() => {
      const num = Number(localWeight);

      const clamped = Math.max(
        0,
        Math.min(isNaN(num) ? 0 : num, detailRemainingWeight),
      );

      const formatted = clamped.toFixed(2);

      setLocalWeight(formatted);

      setAssignmentWeights((prev) => ({
        ...prev,
        [keyDetail]: formatted,
      }));
    }, [localWeight, detailRemainingWeight, keyDetail, setAssignmentWeights]);

    const handleContainerChange = useCallback(
      (event) => {
        setSelectedContainersPerDetail((prev) => ({
          ...prev,
          [keyDetail]: event.target.value,
        }));
      },
      [keyDetail, setSelectedContainersPerDetail],
    );

    const handlePreviewAssign = useCallback(() => {
      if (!canAssign) return;

      onAssignPreview?.({
        keyDetail,
        qty: Number(localQty),
        weight: Number(localWeight),
        container: selectedCid,
      });
    }, [
      canAssign,
      keyDetail,
      localQty,
      localWeight,
      selectedCid,
      onAssignPreview,
    ]);

    return (
      <Stack spacing={2.5} sx={{ width: "100%", maxWidth: 420 }}>
        {/* Quantity */}
        <TextField
          fullWidth
          size="small"
          label="Boxes / Units to Assign"
          type="number"
          value={localQty}
          onChange={handleQtyChange}
          onBlur={handleQtyBlur}
          error={!isQtyValid && localQty !== ""}
          helperText={
            !isQtyValid && localQty !== ""
              ? `Max: ${detailRemaining} units`
              : `Remaining: ${detailRemaining} units`
          }
          inputProps={{
            min: 0,
            max: detailRemaining,
            step: 1,
          }}
        />

        {/* Weight */}
        <TextField
          fullWidth
          size="small"
          label="Weight to Assign (kg)"
          type="number"
          value={localWeight}
          onChange={handleWeightChange}
          onBlur={handleWeightBlur}
          error={!isWeightValid && localWeight !== ""}
          helperText={
            !isWeightValid && localWeight !== ""
              ? `Max: ${detailRemainingWeight.toFixed(2)} kg`
              : `Remaining: ${detailRemainingWeight.toFixed(2)} kg`
          }
          inputProps={{
            min: 0,
            max: detailRemainingWeight,
            step: 0.01,
          }}
        />

        {/* Single Container Select */}
        <FormControl fullWidth size="small">
          <InputLabel>Select Container</InputLabel>

          <Select
            value={selectedCid}
            onChange={handleContainerChange}
            label="Select Container"
          >
            {availableForThisDetail.map((container) => (
              <MenuItem key={container.cid} value={container.cid}>
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography fontWeight={600}>
                      {container.container_number}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {container.container_size} {container.container_type}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Owner: {container.owner_type || "N/A"}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={container.derived_status || container.status}
                    color={
                      container.derived_status === "Available"
                        ? "success"
                        : container.derived_status === "Assigned to Job"
                          ? "warning"
                          : "default"
                    }
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
          <TextField
            sx={{ mt: 4 }}
            fullWidth
            label="Loading Date"
            type="date"
            value={loadingDate}
            onChange={(e) => {
              const selectedDate = e.target.value;

              if (selectedDate < today) {
                return;
              }

              setLoadingDate(selectedDate);
            }}
            onPaste={(e) => e.preventDefault()}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: today,
            }}
          />
        </FormControl>

        <Tooltip
          title={
            !canAssign ? "Select a container and enter valid qty/weight" : ""
          }
        >
          <span>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!canAssign}
              onClick={handlePreviewAssign}
            >
              Preview Assignment
            </Button>
          </span>
        </Tooltip>

        {canAssign && (
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              bgcolor: "action.hover",
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Preview: {localQty} units / {Number(localWeight).toFixed(2)} kg
            </Typography>

            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
            >
              Container: {selectedContainer?.container_number || "None"}
            </Typography>
          </Box>
        )}
      </Stack>
    );
  },
);

export default AssignmentForm;
