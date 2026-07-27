import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  Divider,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  CloudUploadOutlined as UploadIcon,
  InsertDriveFileOutlined as FileIcon,
  PictureAsPdfOutlined as PdfIcon,
  ImageOutlined as ImageIcon,
  TableChartOutlined as ExcelIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";
import {
  CONTAINER_STATUS_OPTIONS,
  CURRENCY_OPTIONS,
} from "../../constants/containers";
import { StyledTextField, StyledSelect, FieldRow } from "./FormFields";
import { AppContext } from "../../context/AppContext";
import { api } from "../../api";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxWidth: "90vw",
  maxHeight: "90vh",
  overflow: "auto",
  width: { xs: "90%", sm: 1100 },
};

const getFileIcon = (fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
    return <ImageIcon color="action" />;
  }
  if (ext === "pdf") {
    return <PdfIcon sx={{ color: "#d32f2f" }} />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <ExcelIcon sx={{ color: "#2e7d32" }} />;
  }
  return <FileIcon color="action" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const ContainerFormModal = ({
  open,
  onClose,
  isEditing,
  formData,
  onChange,
  onSubmit,
  loadingForm,
  sizes,
  types,
  ownershipTypes,
  places,
  onFileChange,
  onRemoveFile,
  selectedFiles = [],
  existingAttachments = [],
  onRemoveExistingAttachment,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const isSoc = formData.ownership === "soc";
  const isCoc = formData.ownership === "coc";

  const loadingPlaces = places?.filter((p) => p.is_loading) || [];
  const destinationPlaces = places?.filter((p) => p.is_destination) || [];

  useEffect(() => {
    if (open && !isEditing) {
      const updates = {};
      if (!formData.location && places?.length > 0) {
        updates.location = places[0].name;
      }
      if (!formData.derived_status && CONTAINER_STATUS_OPTIONS.length > 0) {
        updates.derived_status = CONTAINER_STATUS_OPTIONS[0];
      }
      Object.entries(updates).forEach(([name, value]) => {
        onChange({ target: { name, value } });
      });
    }
  }, [open, places]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#0d6c6a", mb: 1 }}
        >
          {isEditing ? "Edit Container" : "Add New Container"}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <FormControl component="fieldset" sx={{ mb: 1 }}>
          <RadioGroup
            row
            name="ownership"
            value={formData.ownership || "soc"}
            onChange={onChange}
          >
            {[...ownershipTypes].reverse().map((own) => (
              <FormControlLabel
                key={own.value}
                value={own.value}
                control={<Radio />}
                label={own.label}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <FieldRow>
          <StyledTextField
            label="Container Number"
            name="containerNo"
            value={formData.containerNo}
            onChange={(e) => {
              onChange({
                target: {
                  name: "containerNo",
                  value: e.target.value.replace(/\s+/g, "").toUpperCase(),
                },
              });
            }}
            required
            disabled={isEditing}
            helperText="4 letters + 7 digits (e.g., RGSLU1234567)"
          />
          <StyledSelect
            label="Derived Status"
            name="derived_status"
            value={formData.derived_status}
            onChange={onChange}
          >
            {CONTAINER_STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </StyledSelect>
          <StyledSelect
            label="Size"
            name="size"
            value={formData.size}
            onChange={onChange}
            disabled={isEditing}
          >
            {sizes.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </StyledSelect>
          <StyledSelect
            label="Type"
            name="type"
            value={formData.type}
            onChange={onChange}
            disabled={isEditing}
          >
            {types.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </StyledSelect>
        </FieldRow>

        <Box sx={{ my: 2 }}>
          <StyledSelect
            label="Location"
            name="location"
            value={formData.location ?? ""}
            onChange={onChange}
          >
            {places.map((place) => (
              <MenuItem key={place.id} value={place.name}>
                {place.name}
              </MenuItem>
            ))}
          </StyledSelect>
        </Box>

        {isSoc && (
          <>
            <FieldRow>
              <StyledTextField
                label="Purchase Date"
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={onChange}
                required
              />
              <StyledTextField
                label="Purchase From"
                name="purchaseFrom"
                value={formData.purchaseFrom}
                onChange={onChange}
                required
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <StyledTextField
                  label="Purchase Price"
                  name="purchasePrice"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={onChange}
                  required
                  sx={{ flex: 1 }}
                />
                <StyledSelect
                  label="Currency"
                  name="currency"
                  value={formData.currency || "USD"}
                  onChange={onChange}
                  sx={{ width: 100, flex: "none" }}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </StyledSelect>
              </Box>
            </FieldRow>
            <FieldRow sx={{ mt: 2 }}>
              <StyledTextField
                label="Date of Manufacture"
                name="dateOfManufacture"
                type="date"
                value={formData.dateOfManufacture}
                onChange={onChange}
                required
              />
              <StyledTextField
                label="Owned By"
                name="ownershipDetails"
                value={formData.ownershipDetails}
                onChange={onChange}
                required
              />
              <StyledTextField
                label="Available At Date"
                name="availableAtDate"
                type="date"
                value={formData.availableAtDate}
                onChange={onChange}
                required
              />
            </FieldRow>
          </>
        )}

        {isCoc && (
          <>
            <FieldRow>
              <StyledTextField
                label="Hire Start Date"
                name="hireStartDate"
                type="date"
                value={formData.hireStartDate}
                onChange={onChange}
                required
              />
              <StyledTextField
                label="Hire End Date"
                name="hireEndDate"
                type="date"
                value={formData.hireEndDate}
                onChange={onChange}
                required
              />
              <StyledTextField
                label="Return Date"
                name="return_date"
                type="date"
                value={formData.return_date}
                onChange={onChange}
              />
              <StyledTextField
                label="Free Days"
                name="freeDays"
                type="number"
                value={formData.freeDays}
                onChange={onChange}
                required
              />
            </FieldRow>

            <FieldRow sx={{ mt: 2 }}>
              <StyledTextField
                label="Vendor"
                name="vendor"
                value={formData.vendor}
                onChange={onChange}
                required
              />
              <StyledSelect
                label="Place of Loading"
                name="placeOfLoading"
                value={formData.placeOfLoading || ""}
                onChange={onChange}
                required
              >
                {loadingPlaces.map((place) => (
                  <MenuItem key={place.id} value={place.name}>
                    {place.name}
                  </MenuItem>
                ))}
              </StyledSelect>

              <StyledSelect
                label="Place of Delivery"
                name="placeOfDelivery"
                value={formData.placeOfDelivery || ""}
                onChange={onChange}
                required
              >
                {destinationPlaces.map((place) => (
                  <MenuItem key={place.id} value={place.name}>
                    {place.name}
                  </MenuItem>
                ))}
              </StyledSelect>
            </FieldRow>
          </>
        )}

        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 600 }}>
            Attachments
          </Typography>

          {isEditing && existingAttachments.length > 0 && (
            <Stack spacing={0.8} sx={{ mb: 1.5 }}>
              {existingAttachments.map((att) => {
                const fileName = decodeURIComponent(
                  att.url.split("/").pop() || "file",
                );
                return (
                  <Paper
                    key={att.id}
                    variant="outlined"
                    sx={{
                      px: 1.5,
                      py: 0.8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: 1,
                      bgcolor: "#fff",
                    }}
                  >
                    <Box
                      component="a"
                      href="#"
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          const res = await api.get(
                            `/api/containers/attachments/${att.id}/signed-url`,
                          );
                          window.open(
                            res.data.url,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        } catch {}
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        overflow: "hidden",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      {getFileIcon(fileName)}
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.82rem",
                          maxWidth: { xs: 200, sm: 350 },
                        }}
                      >
                        {fileName}
                      </Typography>
                    </Box>

                    <Tooltip title="Remove file">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onRemoveExistingAttachment(att.id)}
                        sx={{ p: 0.5 }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                );
              })}
            </Stack>
          )}

          <Paper
            variant="outlined"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              p: 1.5,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              cursor: "pointer",
              borderRadius: 1.5,
              borderStyle: "dashed",
              borderWidth: 1.5,
              borderColor: isDragging ? "#0d6c6a" : "grey.300",
              bgcolor: isDragging ? "rgba(13, 108, 106, 0.04)" : "#fafafa",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "#0d6c6a",
                bgcolor: "rgba(13, 108, 106, 0.02)",
              },
            }}
            component="label"
          >
            <input
              type="file"
              hidden
              multiple
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={onFileChange}
            />
            <UploadIcon
              sx={{ fontSize: 26, color: "#0d6c6a", flexShrink: 0 }}
            />
            <Box sx={{ textAlign: "left" }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}
              >
                Click to upload{" "}
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                >
                  or drag and drop files here
                </Typography>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  display: "block",
                  fontSize: "0.72rem",
                }}
              >
                PDF, Word, Excel, Images (Max 5 files, 5MB each)
              </Typography>
            </Box>
          </Paper>

          {selectedFiles.length > 0 && (
            <Stack spacing={0.8} sx={{ mt: 1.5 }}>
              {Array.from(selectedFiles).map((file, i) => (
                <Paper
                  key={i}
                  variant="outlined"
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: 1,
                    bgcolor: "#fff",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      overflow: "hidden",
                    }}
                  >
                    {getFileIcon(file.name)}
                    <Box sx={{ overflow: "hidden" }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.82rem",
                          maxWidth: { xs: 200, sm: 350 },
                        }}
                      >
                        {file.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem", display: "block" }}
                      >
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                  </Box>

                  <Tooltip title="Remove file">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveFile && onRemoveFile(i)}
                      sx={{ p: 0.5 }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loadingForm}
            sx={{
              textTransform: "none",
              borderColor: "#0d6c6a",
              color: "#0d6c6a",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={loadingForm}
            startIcon={loadingForm ? <CircularProgress size={20} /> : null}
            sx={{
              color: "#fff",
              textTransform: "none",
              bgcolor: "#f58220",
              "&:hover": { bgcolor: "#1b5e20" },
            }}
          >
            {isEditing ? "Update" : "Save"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ContainerFormModal;
