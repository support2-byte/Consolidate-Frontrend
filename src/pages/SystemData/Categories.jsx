import React, { useReducer, useEffect } from "react";
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
  Divider,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { api } from "../../api";

const initialState = {
  // Categories State
  openDialog: false,
  editMode: false,
  selectedCategory: null,
  formData: { name: "", status: true },
  selected: [],
  categories: [],
  loadingCat: true,

  // Subcategories State
  openSubDialog: false,
  editModeSub: false,
  selectedSubCategory: null,
  formDataSub: { name: "", category_id: "", status: true },
  selectedSub: [],
  subcategories: [],
  loadingSub: true,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
    case "TOGGLE_CATEGORY":
      return {
        ...state,
        selected: state.selected.includes(action.payload)
          ? state.selected.filter((id) => id !== action.payload)
          : [...state.selected, action.payload],
      };
    case "TOGGLE_SUBCATEGORY":
      return {
        ...state,
        selectedSub: state.selectedSub.includes(action.payload)
          ? state.selectedSub.filter((id) => id !== action.payload)
          : [...state.selectedSub, action.payload],
      };
    default:
      return state;
  }
};

const Categories = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const {
    openDialog,
    editMode,
    selectedCategory,
    formData,
    selected,
    categories,
    loadingCat,
    openSubDialog,
    editModeSub,
    selectedSubCategory,
    formDataSub,
    selectedSub,
    subcategories,
    loadingSub,
  } = state;

  // Wrappers to keep text inputs working cleanly
  const setFormData = (newData) => {
    dispatch({
      type: "SET_STATE",
      payload: {
        formData: typeof newData === "function" ? newData(formData) : newData,
      },
    });
  };
  const setFormDataSub = (newData) => {
    dispatch({
      type: "SET_STATE",
      payload: {
        formDataSub:
          typeof newData === "function" ? newData(formDataSub) : newData,
      },
    });
  };

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    dispatch({ type: "SET_STATE", payload: { selectedSub: [] } });
  }, [selected]);

  const fetchCategories = async () => {
    try {
      dispatch({ type: "SET_STATE", payload: { loadingCat: true } });
      const response = await api.get("api/options/categories/crud");
      dispatch({
        type: "SET_STATE",
        payload: { categories: response.data.categories || [] },
      });
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories. Please try again.");
    } finally {
      dispatch({ type: "SET_STATE", payload: { loadingCat: false } });
    }
  };

  const fetchSubcategories = async () => {
    try {
      dispatch({ type: "SET_STATE", payload: { loadingSub: true } });
      const response = await api.get("api/options/subcategories/crud");
      dispatch({
        type: "SET_STATE",
        payload: { subcategories: response.data.subCategories || [] },
      });
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      toast.error("Failed to load subcategories. Please try again.");
    } finally {
      dispatch({ type: "SET_STATE", payload: { loadingSub: false } });
    }
  };

  const filteredSubcategories =
    selected.length === 0
      ? subcategories
      : subcategories.filter((sub) => selected.includes(sub.category_id));

  const validateCatForm = () => {
    if (!formData.name.trim()) {
      toast.warning("Category name is required.");
      return false;
    }
    return true;
  };

  const validateSubForm = () => {
    if (!formDataSub.name.trim()) {
      toast.warning("Subcategory name is required.");
      return false;
    }
    if (!formDataSub.category_id) {
      toast.warning("Category selection is required.");
      return false;
    }
    return true;
  };

  const handleOpenDialog = (category = null) => {
    dispatch({
      type: "SET_STATE",
      payload: {
        editMode: !!category,
        selectedCategory: category,
        formData: {
          name: category ? category.name : "",
          status: category ? Boolean(category.status) : true,
        },
        openDialog: true,
      },
    });
  };

  const handleCloseDialog = () => {
    dispatch({
      type: "SET_STATE",
      payload: {
        openDialog: false,
        selectedCategory: null,
        formData: { name: "", status: true },
      },
    });
  };

  const handleSaveCat = async () => {
    if (!validateCatForm()) return;

    try {
      const payload = { name: formData.name, status: formData.status ? 1 : 0 };
      let response;

      if (editMode) {
        response = await api.put(
          `api/options/categories/${selectedCategory.id}`,
          payload,
        );
      } else {
        response = await api.post("api/options/categories", payload);
      }

      if (response.status >= 400)
        throw new Error(response.data.error || "Failed to save category");

      await fetchCategories();
      handleCloseDialog();
      toast.success(`Category ${editMode ? "updated" : "added"} successfully!`);
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error(err.message || "Failed to save category.");
    }
  };

  const handleBulkDeleteCat = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selected.length} selected categories? This action cannot be undone.`,
      )
    )
      return;

    try {
      for (const id of selected) {
        const response = await api.delete(`api/options/categories/${id}`);
        if (response.status >= 400)
          throw new Error(response.data.error || "Failed to delete category");
      }
      await fetchCategories();
      await fetchSubcategories();
      dispatch({ type: "SET_STATE", payload: { selected: [] } });
      toast.success("Selected categories deleted successfully!");
    } catch (err) {
      console.error("Error deleting categories:", err);
      toast.error(err.message || "Failed to delete categories.");
    }
  };

  const handleToggleCat = (id) =>
    dispatch({ type: "TOGGLE_CATEGORY", payload: id });

  const handleHeaderCheckboxCat = (event) => {
    dispatch({
      type: "SET_STATE",
      payload: {
        selected: event.target.checked ? categories.map((c) => c.id) : [],
      },
    });
  };

  const handleOpenSubDialog = (subcategory = null) => {
    dispatch({
      type: "SET_STATE",
      payload: {
        editModeSub: !!subcategory,
        selectedSubCategory: subcategory,
        formDataSub: {
          name: subcategory ? subcategory.name : "",
          category_id: subcategory ? subcategory.category_id : "",
          status: subcategory ? Boolean(subcategory.status) : true,
        },
        openSubDialog: true,
      },
    });
  };

  const handleCloseSubDialog = () => {
    dispatch({
      type: "SET_STATE",
      payload: {
        openSubDialog: false,
        selectedSubCategory: null,
        formDataSub: { name: "", category_id: "", status: true },
      },
    });
  };

  const handleSaveSub = async () => {
    if (!validateSubForm()) return;

    try {
      const payload = {
        name: formDataSub.name,
        category_id: parseInt(formDataSub.category_id),
        status: formDataSub.status ? 1 : 0,
      };
      let response;

      if (editModeSub) {
        response = await api.put(
          `api/options/subcategories/${selectedSubCategory.id}`,
          payload,
        );
      } else {
        response = await api.post("api/options/subcategories", payload);
      }

      if (response.status >= 400)
        throw new Error(response.data.error || "Failed to save subcategory");

      await fetchSubcategories();
      handleCloseSubDialog();
      toast.success(
        `Subcategory ${editModeSub ? "updated" : "added"} successfully!`,
      );
    } catch (err) {
      console.error("Error saving subcategory:", err);
      toast.error(err.message || "Failed to save subcategory.");
    }
  };

  const handleBulkDeleteSub = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedSub.length} selected subcategories? This action cannot be undone.`,
      )
    )
      return;

    try {
      for (const id of selectedSub) {
        const response = await api.delete(`api/options/subcategories/${id}`);
        if (response.status >= 400)
          throw new Error(
            response.data.error || "Failed to delete subcategory",
          );
      }
      await fetchSubcategories();
      dispatch({ type: "SET_STATE", payload: { selectedSub: [] } });
      toast.success("Selected subcategories deleted successfully!");
    } catch (err) {
      console.error("Error deleting subcategories:", err);
      toast.error(err.message || "Failed to delete subcategories.");
    }
  };

  const handleToggleSub = (id) =>
    dispatch({ type: "TOGGLE_SUBCATEGORY", payload: id });

  const handleHeaderCheckboxSub = (event) => {
    dispatch({
      type: "SET_STATE",
      payload: {
        selectedSub: event.target.checked
          ? filteredSubcategories.map((s) => s.id)
          : [],
      },
    });
  };

  const renderEmptyState = (type, colSpan) => (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ textAlign: "center", py: 5 }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No {type} found
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Click "Add New" to get started.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() =>
            type === "categories" ? handleOpenDialog() : handleOpenSubDialog()
          }
        >
          Add Your First {type === "categories" ? "Category" : "Subcategory"}
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1400px", margin: "0 auto" }}>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
      />

      {/* Categories Section */}
      <Box sx={{ mb: 6 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 3,
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ color: "#0d6c6a", fontWeight: "bold" }}
            >
              Manage Categories
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Organize your main categories. Subcategories will be filtered
              based on selection.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="large"
            sx={{
              backgroundColor: "#0d6c6a",
              "&:hover": { backgroundColor: "#0a5654" },
              whiteSpace: "nowrap",
            }}
          >
            Add Category
          </Button>
        </Box>

        <Paper elevation={2} sx={{ overflow: "hidden", position: "relative" }}>
          {loadingCat && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.7)",
                zIndex: 10,
              }}
            >
              <CircularProgress sx={{ color: "#0d6c6a" }} />
            </Box>
          )}

          <Box sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f4f6f8" }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selected.length > 0 &&
                        selected.length < categories.length
                      }
                      checked={
                        categories.length > 0 &&
                        selected.length === categories.length
                      }
                      onChange={handleHeaderCheckboxCat}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length === 0 && !loadingCat
                  ? renderEmptyState("categories", 5)
                  : categories.map((category) => (
                      <TableRow
                        key={category.id}
                        hover
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selected.includes(category.id)}
                            onChange={() => handleToggleCat(category.id)}
                          />
                        </TableCell>
                        <TableCell>{category.id}</TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {category.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={category.status ? "Active" : "Inactive"}
                            color={category.status ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          <Tooltip title="Edit Category">
                            <IconButton
                              onClick={() => handleOpenDialog(category)}
                              color="primary"
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              borderTop: "1px solid #eee",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {selected.length > 0 && (
                <Tooltip
                  title={`Delete ${selected.length} selected categories`}
                >
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleBulkDeleteCat}
                    sx={{ mr: 2 }}
                    size="small"
                  >
                    Delete ({selected.length})
                  </Button>
                </Tooltip>
              )}
              <Typography variant="body2" color="textSecondary">
                Total: {categories.length}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Subcategories Section */}
      <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 3,
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ color: "#0d6c6a", fontWeight: "bold" }}
            >
              Manage Subcategories
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {selected.length > 0
                ? `Filtering subcategories by ${selected.length} selected category(ies).`
                : "Select categories above to filter."}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenSubDialog()}
            size="large"
            disabled={categories.length === 0}
            sx={{
              backgroundColor: "#0d6c6a",
              "&:hover": { backgroundColor: "#0a5654" },
              whiteSpace: "nowrap",
            }}
          >
            Add Subcategory
          </Button>
        </Box>

        <Paper elevation={2} sx={{ overflow: "hidden", position: "relative" }}>
          {loadingSub && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.7)",
                zIndex: 10,
              }}
            >
              <CircularProgress sx={{ color: "#0d6c6a" }} />
            </Box>
          )}

          <Box sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f4f6f8" }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedSub.length > 0 &&
                        selectedSub.length < filteredSubcategories.length
                      }
                      checked={
                        filteredSubcategories.length > 0 &&
                        selectedSub.length === filteredSubcategories.length
                      }
                      onChange={handleHeaderCheckboxSub}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Parent Category
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubcategories.length === 0 && !loadingSub
                  ? renderEmptyState("subcategories", 6)
                  : filteredSubcategories.map((subcategory) => (
                      <TableRow
                        key={subcategory.id}
                        hover
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedSub.includes(subcategory.id)}
                            onChange={() => handleToggleSub(subcategory.id)}
                          />
                        </TableCell>
                        <TableCell>{subcategory.id}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              categories.find(
                                (c) => c.id === subcategory.category_id,
                              )?.name || "Unknown"
                            }
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {subcategory.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={subcategory.status ? "Active" : "Inactive"}
                            color={subcategory.status ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          <Tooltip title="Edit Subcategory">
                            <IconButton
                              onClick={() => handleOpenSubDialog(subcategory)}
                              color="primary"
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              borderTop: "1px solid #eee",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {selectedSub.length > 0 && (
                <Tooltip
                  title={`Delete ${selectedSub.length} selected subcategories`}
                >
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleBulkDeleteSub}
                    sx={{ mr: 2 }}
                    size="small"
                  >
                    Delete ({selectedSub.length})
                  </Button>
                </Tooltip>
              )}
              <Typography variant="body2" color="textSecondary">
                Total: {filteredSubcategories.length}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Categories Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: "#0d6c6a", color: "#fff" }}>
          {editMode ? "Edit Category" : "Add New Category"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Category Name *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              error={!formData.name.trim()}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.checked })
                  }
                  color="success"
                />
              }
              label={formData.status ? "Status: Active" : "Status: Inactive"}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveCat}
            variant="contained"
            disabled={!formData.name.trim()}
            sx={{
              backgroundColor: "#0d6c6a",
              "&:hover": { backgroundColor: "#0a5654" },
            }}
          >
            {editMode ? "Update Category" : "Create Category"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subcategories Dialog */}
      <Dialog
        open={openSubDialog}
        onClose={handleCloseSubDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: "#0d6c6a", color: "#fff" }}>
          {editModeSub ? "Edit Subcategory" : "Add New Subcategory"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            <TextField
              fullWidth
              label="Subcategory Name *"
              value={formDataSub.name}
              onChange={(e) =>
                setFormDataSub({ ...formDataSub, name: e.target.value })
              }
              required
              error={!formDataSub.name.trim()}
            />

            <FormControl fullWidth required error={!formDataSub.category_id}>
              <InputLabel>Parent Category</InputLabel>
              <Select
                value={formDataSub.category_id}
                label="Parent Category *"
                onChange={(e) =>
                  setFormDataSub({
                    ...formDataSub,
                    category_id: e.target.value,
                  })
                }
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={formDataSub.status}
                  onChange={(e) =>
                    setFormDataSub({ ...formDataSub, status: e.target.checked })
                  }
                  color="success"
                />
              }
              label={formDataSub.status ? "Status: Active" : "Status: Inactive"}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseSubDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveSub}
            variant="contained"
            disabled={!formDataSub.name.trim() || !formDataSub.category_id}
            sx={{
              backgroundColor: "#0d6c6a",
              "&:hover": { backgroundColor: "#0a5654" },
            }}
          >
            {editModeSub ? "Update Subcategory" : "Create Subcategory"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;
