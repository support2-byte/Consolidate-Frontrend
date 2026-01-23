import React, { useState, useCallback, useMemo } from 'react';
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Typography,
  Box,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Optional: if you have a debounce hook
// import useDebounce from '../hooks/useDebounce';

const AssignmentForm = React.memo(({
  keyDetail,                    // e.g. "123-456-0"
  detailRemaining,              // max boxes/units remaining (number)
  detailRemainingWeight,        // max kg remaining (number)
  assignmentQuantities = {},    // global state object
  assignmentWeights = {},
  selectedContainersPerDetail = {},
  availableContainers = [],     // array of { cid, container_number, container_size, ... }
  setAssignmentQuantities,
  setAssignmentWeights,
  setSelectedContainersPerDetail,
  onAssignPreview,  
  enhancedHandleAssign            // optional callback when clicking "Preview Assignment"
}) => {
  // Local state for inputs (syncs to global on change/blur)
  const [localQty, setLocalQty] = useState(assignmentQuantities[keyDetail] ?? '');
  const [localWeight, setLocalWeight] = useState(assignmentWeights[keyDetail] ?? '');

  const selectedCids = useMemo(
    () => selectedContainersPerDetail[keyDetail] || [],
    [selectedContainersPerDetail, keyDetail]
  );

  // Filtered containers: exclude globally selected except current detail's
  const availableForThisDetail = useMemo(() => {
    const globallySelected = Object.values(selectedContainersPerDetail)
      .flat()
      .filter(cid => !selectedCids.includes(cid));

    return availableContainers.filter(c => !globallySelected.includes(c.cid));
  }, [availableContainers, selectedContainersPerDetail, selectedCids]);

  // Validation helpers
  const isQtyValid = useMemo(() => {
    const num = Number(localQty);
    return !isNaN(num) && num >= 0 && num <= detailRemaining;
  }, [localQty, detailRemaining]);

  const isWeightValid = useMemo(() => {
    const num = Number(localWeight);
    return !isNaN(num) && num >= 0 && num <= detailRemainingWeight;
  }, [localWeight, detailRemainingWeight]);

  const canAssign = useMemo(
    () => isQtyValid && isWeightValid && Number(localQty) > 0 && selectedCids.length > 0,
    [isQtyValid, isWeightValid, localQty, selectedCids]
  );

  // Handlers
  const handleQtyChange = useCallback((e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setLocalQty(value);
      setAssignmentQuantities(prev => ({ ...prev, [keyDetail]: value }));
    }
  }, [keyDetail, setAssignmentQuantities]);

  const handleQtyBlur = useCallback(() => {
    const num = Number(localQty);
    const clamped = Math.max(0, Math.min(isNaN(num) ? 0 : num, detailRemaining));
    setLocalQty(clamped.toString());
    setAssignmentQuantities(prev => ({ ...prev, [keyDetail]: clamped.toString() }));
  }, [localQty, detailRemaining, keyDetail, setAssignmentQuantities]);

  const handleWeightChange = useCallback((e) => {
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setLocalWeight(value);
      setAssignmentWeights(prev => ({ ...prev, [keyDetail]: value }));
    }
  }, [keyDetail, setAssignmentWeights]);

  const handleWeightBlur = useCallback(() => {
    const num = Number(localWeight);
    const clamped = Math.max(0, Math.min(isNaN(num) ? 0 : num, detailRemainingWeight));
    const formatted = clamped.toFixed(2);
    setLocalWeight(formatted);
    setAssignmentWeights(prev => ({ ...prev, [keyDetail]: formatted }));
  }, [localWeight, detailRemainingWeight, keyDetail, setAssignmentWeights]);

  const handleContainerChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedContainersPerDetail(prev => ({
      ...prev,
      [keyDetail]: newValue,
    }));
  }, [keyDetail, setSelectedContainersPerDetail]);

  const handleRemoveContainer = useCallback((cidToRemove) => {
    setSelectedContainersPerDetail(prev => ({
      ...prev,
      [keyDetail]: (prev[keyDetail] || []).filter(cid => cid !== cidToRemove),
    }));
  }, [keyDetail, setSelectedContainersPerDetail]);

  const handlePreviewAssign = useCallback(() => {
    if (canAssign && onAssignPreview) {
      onAssignPreview({
        keyDetail,
        qty: Number(localQty),
        weight: Number(localWeight),
        containers: selectedCids,
      });
    }
  }, [canAssign, localQty, localWeight, selectedCids, onAssignPreview, keyDetail]);

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 420 }}>
      {/* Quantity Input */}
      <TextField
        fullWidth
        size="small"
        label="Boxes / Units to Assign"
        type="number"
        value={localQty}
        onChange={handleQtyChange}
        onBlur={handleQtyBlur}
        error={!isQtyValid && localQty !== ''}
        helperText={
          !isQtyValid && localQty !== ''
            ? `Max: ${detailRemaining} units`
            : `Remaining: ${detailRemaining} units`
        }
        inputProps={{
          min: 0,
          max: detailRemaining,
          step: 1,
        }}
        sx={{ bgcolor: 'white' }}
      />

      {/* Weight Input */}
      <TextField
        fullWidth
        size="small"
        label="Weight to Assign (kg)"
        type="number"
        value={localWeight}
        onChange={handleWeightChange}
        onBlur={handleWeightBlur}
        error={!isWeightValid && localWeight !== ''}
        helperText={
          !isWeightValid && localWeight !== ''
            ? `Max: ${detailRemainingWeight.toFixed(2)} kg`
            : `Remaining: ${detailRemainingWeight.toFixed(2)} kg`
        }
        inputProps={{
          min: 0,
          max: detailRemainingWeight,
          step: 0.01,
        }}
        sx={{ bgcolor: 'white' }}
      />

      {/* Container Multi-Select */}
      <FormControl fullWidth size="small">
        <InputLabel>Select Containers</InputLabel>
        <Select
          multiple
          value={selectedCids}
          onChange={handleContainerChange}
          label="Select Containers"
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.length ? (
                selected.map((cid) => {
                  const cont = availableContainers.find(c => c.cid === cid);
                  return (
                    <Chip
                      key={cid}
                      label={cont?.container_number || `CID ${cid}`}
                      size="small"
                      onDelete={() => handleRemoveContainer(cid)}
                      deleteIcon={<DeleteIcon />}
                    />
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Choose containers...
                </Typography>
              )}
            </Box>
          )}
        >
          {availableForThisDetail.map((container) => (
            <MenuItem key={container.cid} value={container.cid}>
              <Stack direction="row" alignItems="center" spacing={1} width="100%">
                <Typography>
                  {container.container_number} ({container.container_size || '?'})
                </Typography>
                <Chip
                  label={container.derived_status || 'Unknown'}
                  size="small"
                  color={
                    container.derived_status === 'Available' ? 'success' :
                    container.derived_status === 'Assigned to job' ? 'warning' : 'default'
                  }
                />
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Preview / Assign Button */}
      <Tooltip title={!canAssign ? 'Select containers and enter valid qty/weight' : ''}>
        <span>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            disabled={!canAssign}
            onClick={handlePreviewAssign}
            sx={{ mt: 1 }}
          >
            Preview Assignment
          </Button>
        </span>
      </Tooltip>

      {/* Summary preview (optional) */}
      {canAssign && (
        <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Preview: {localQty} units / {Number(localWeight).toFixed(2)} kg
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            {selectedCids.length} container(s) selected
          </Typography>
        </Box>
      )}
    </Stack>
  );
});

export default AssignmentForm;