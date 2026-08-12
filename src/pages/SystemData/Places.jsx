import React, { useEffect, useRef, useReducer, useContext } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  TextField,
  ListItemText,
  CircularProgress,
  Chip,
  Tooltip,
  Divider,
  IconButton,
  Grid,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import { api } from "../../api";
import { AppContext } from "../../context/AppContext";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_PARAMS = "format=json&limit=5&addressdetails=1";

const initialState = {
  openDialog: false,
  editMode: false,
  selectedPlace: null,
  dialogLoading: false,
  suggestions: [],
  inputValue: "",
  formData: {
    name: "",
    isLoading: false,
    isDestination: false,
    country: "",
    latitude: "",
    longitude: "",
  },
};

const reducer = (state, action) => {
  switch (action.type) {
    case "OPEN_DIALOG":
      return {
        ...state,
        openDialog: true,
        editMode: !!action.payload,
        selectedPlace: action.payload || null,
        inputValue: action.payload?.name || "",
        suggestions: [],
        formData: action.payload
          ? {
              name: action.payload.name || "",
              isLoading: action.payload.is_loading || false,
              isDestination: action.payload.is_destination || false,
              country: action.payload.country || "",
              latitude: action.payload.latitude || "",
              longitude: action.payload.longitude || "",
            }
          : initialState.formData,
      };
    case "CLOSE_DIALOG":
      return {
        ...state,
        openDialog: false,
        selectedPlace: null,
        editMode: false,
        inputValue: "",
        suggestions: [],
        formData: initialState.formData,
      };
    case "UPDATE_FORM":
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
      };
    case "SET_SUGGESTIONS":
      return { ...state, suggestions: action.payload };
    case "SET_INPUT_VALUE":
      return { ...state, inputValue: action.payload };
    case "SET_DIALOG_LOADING":
      return { ...state, dialogLoading: action.payload };
    default:
      return state;
  }
};

const Places = () => {
  const { places, fetchPlaces, placesLoading } = useContext(AppContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const timeoutRef = useRef(null);

  const safeInputValue = state.inputValue || "";

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      if (safeInputValue.length > 2) {
        fetchSuggestions(safeInputValue);
      } else {
        dispatch({ type: "SET_SUGGESTIONS", payload: [] });
      }
    }, 300);

    return () => clearTimeout(timeoutRef.current);
  }, [safeInputValue]);

  const fetchSuggestions = async (query) => {
    try {
      const response = await fetch(
        `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&${NOMINATIM_PARAMS}`,
      );
      if (!response.ok) throw new Error("Nominatim search failed");
      const data = await response.json();
      dispatch({
        type: "SET_SUGGESTIONS",
        payload: data.map((item) => ({
          label: item.display_name || item.name,
          value: item.display_name,
          lat: item.lat,
          lon: item.lon,
          country: item.address?.country || "",
        })),
      });
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      dispatch({ type: "SET_SUGGESTIONS", payload: [] });
    }
  };

  const handleSuggestionSelect = (event, option) => {
    if (option && typeof option === "object") {
      const name = option.value || option.label || "";
      dispatch({ type: "SET_INPUT_VALUE", payload: name });
      dispatch({
        type: "UPDATE_FORM",
        payload: {
          name,
          latitude: option.lat,
          longitude: option.lon,
          country: option.country,
        },
      });
    } else if (typeof option === "string") {
      dispatch({ type: "SET_INPUT_VALUE", payload: option });
      dispatch({ type: "UPDATE_FORM", payload: { name: option } });
    }
  };

  const validateForm = () => {
    if (!state.formData.name.trim()) {
      toast.warning("Place name is required.");
      return false;
    }
    if (!state.formData.country.trim()) {
      toast.warning("Country is required.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      dispatch({ type: "SET_DIALOG_LOADING", payload: true });
      const payload = {
        name: state.formData.name,
        is_loading: state.formData.isLoading,
        is_destination: state.formData.isDestination,
        country: state.formData.country,
        latitude: parseFloat(state.formData.latitude) || null,
        longitude: parseFloat(state.formData.longitude) || null,
      };

      let response;
      if (state.editMode) {
        response = await api.put(
          `api/options/places/${state.selectedPlace.id}`,
          payload,
        );
      } else {
        response = await api.post("api/options/places", payload);
      }

      if (response.status >= 400) {
        throw new Error(response.data?.error || "Failed to save place");
      }

      await fetchPlaces();
      dispatch({ type: "CLOSE_DIALOG" });
      toast.success(
        state.editMode
          ? "Place updated successfully!"
          : "Place added successfully!",
      );
    } catch (err) {
      console.error("Error saving place:", err);
      toast.error(err.message || "Failed to save place.");
    } finally {
      dispatch({ type: "SET_DIALOG_LOADING", payload: false });
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this place? This action cannot be undone.",
      )
    ) {
      return;
    }
    try {
      const response = await api.delete(`api/options/places/${id}`);
      if (response.status >= 400) {
        throw new Error(response.data?.error || "Failed to delete place");
      }
      await fetchPlaces();
      toast.success("Place deleted successfully!");
    } catch (err) {
      console.error("Error deleting place:", err);
      toast.error(err.message || "Failed to delete place.");
    }
  };

  const getTypeLabel = (place) => {
    const types = [];
    if (place.is_loading) types.push("Loading");
    if (place.is_destination) types.push("Destination");
    return types.join(", ") || "None";
  };

  const renderEmptyState = () => (
    <Box sx={{ textAlign: "center", py: 6 }}>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        No places found
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Click "Add New Place" to start mapping your locations.
      </Typography>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => dispatch({ type: "OPEN_DIALOG" })}
        size="large"
      >
        Add Your First Place
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Grid item xs={12} sm={8}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ color: "#0d6c6a" }}
          >
            Manage Places
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Add, edit, or remove locations for loading and destinations.
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          sm={4}
          sx={{ textAlign: { xs: "left", sm: "right" } }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => dispatch({ type: "OPEN_DIALOG" })}
            size="large"
            disableElevation
          >
            Add New Place
          </Button>
        </Grid>
      </Grid>

      <Paper
        elevation={2}
        sx={{ width: "100%", overflowX: "auto", position: "relative" }}
      >
        {placesLoading && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        <Table sx={{ minWidth: 650 }} aria-label="places table">
          <TableHead sx={{ bgcolor: "primary.main" }}>
            <TableRow>
              {[
                "ID",
                "Name",
                "Type",
                "Country",
                "Latitude",
                "Longitude",
                "Actions",
              ].map((head) => (
                <TableCell
                  key={head}
                  sx={{ color: "primary.contrastText", fontWeight: "bold" }}
                >
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {places.length === 0 && !placesLoading ? (
              <TableRow>
                <TableCell colSpan={7}>{renderEmptyState()}</TableCell>
              </TableRow>
            ) : (
              places.map((place) => (
                <TableRow
                  key={place.id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>{place.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {place.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getTypeLabel(place) === "None" ? (
                      <Chip label="None" size="small" variant="outlined" />
                    ) : (
                      <Chip
                        label={getTypeLabel(place)}
                        size="small"
                        color="primary"
                      />
                    )}
                  </TableCell>
                  <TableCell>{place.country || "N/A"}</TableCell>
                  <TableCell>{place.latitude || "N/A"}</TableCell>
                  <TableCell>{place.longitude || "N/A"}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() =>
                          dispatch({ type: "OPEN_DIALOG", payload: place })
                        }
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(place.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={state.openDialog}
        onClose={() => dispatch({ type: "CLOSE_DIALOG" })}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "#fff",
            py: 2,
            fontWeight: 600,
            fontSize: 22,
          }}
        >
          {state.editMode ? "Edit Place Details" : "Add New Place"}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ my: 2, fontWeight: 600 }}
          >
            {state.editMode
              ? "Update the details below."
              : "Search for a place to automatically fill coordinates."}
          </Typography>

          <Grid container spacing={3}>
            <Grid item size={6}>
              <Autocomplete
                freeSolo
                fullWidth
                options={state.suggestions || []}
                getOptionLabel={(option) => option?.label || ""}
                isOptionEqualToValue={(option, value) =>
                  option?.value === value?.value
                }
                inputValue={safeInputValue}
                onChange={handleSuggestionSelect}
                onInputChange={(_, value) => {
                  dispatch({
                    type: "SET_INPUT_VALUE",
                    payload: value || "",
                  });

                  dispatch({
                    type: "UPDATE_FORM",
                    payload: {
                      name: value || "",
                    },
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Place Name"
                    required
                    placeholder="Search city, warehouse, port..."
                    error={!state.formData.name.trim()}
                    helperText={
                      !state.formData.name.trim()
                        ? "Place name is required"
                        : "Search to auto-fill location details."
                    }
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <SearchIcon
                            sx={{
                              mr: 1,
                              color: "action.active",
                            }}
                          />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <ListItemText
                      primary={option.label}
                      secondary={`${option.country} • ${option.lat}, ${option.lon}`}
                    />
                  </li>
                )}
              />
            </Grid>

            <Grid item size={3}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={state.formData.latitude}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_FORM",
                    payload: {
                      latitude: e.target.value,
                    },
                  })
                }
                InputProps={{
                  readOnly: true,
                }}
                helperText="Automatically filled from search"
              />
            </Grid>

            <Grid item size={3}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={state.formData.longitude}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_FORM",
                    payload: {
                      longitude: e.target.value,
                    },
                  })
                }
                InputProps={{
                  readOnly: true,
                }}
                helperText="Automatically filled from search"
              />
            </Grid>

            <Grid item size={4}>
              <TextField
                fullWidth
                label="Country"
                required
                value={state.formData.country}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_FORM",
                    payload: {
                      country: e.target.value,
                    },
                  })
                }
                error={!state.formData.country.trim()}
                helperText={
                  !state.formData.country.trim() ? "Country is required" : ""
                }
              />
            </Grid>
            <Grid item size={6}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={state.formData.isLoading}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FORM",
                          payload: {
                            isLoading: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Loading Point"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={state.formData.isDestination}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FORM",
                          payload: {
                            isDestination: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Destination"
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: 1,
            borderColor: "divider",
            justifyContent: "space-between",
            flexDirection: {
              xs: "column-reverse",
              sm: "row",
            },
            gap: 2,
          }}
        >
          <Button
            fullWidth={window.innerWidth < 600}
            onClick={() => dispatch({ type: "CLOSE_DIALOG" })}
            disabled={state.dialogLoading}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disableElevation
            fullWidth={window.innerWidth < 600}
            onClick={handleSave}
            disabled={
              state.dialogLoading ||
              !state.formData.name.trim() ||
              !state.formData.country.trim()
            }
          >
            {state.dialogLoading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Save Place"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Places;
