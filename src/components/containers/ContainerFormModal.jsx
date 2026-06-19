import React from "react";
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
} from "@mui/material";
import {
  CONTAINER_STATUS_OPTIONS,
  CURRENCY_OPTIONS,
  LOCATION_OPTIONS,
} from "../../constants/containers";
import { StyledTextField, StyledSelect, FieldRow } from "./FormFields";

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
}) => {
  const isSoc = formData.ownership === "soc";
  const isCoc = formData.ownership === "coc";

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
        <Divider sx={{ mb: 1 }} />

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
            onChange={onChange}
            required
            disabled={isEditing}
            helperText="Format: 4 letters + 7 digits (e.g., RGSLU1234567)"
            sx={{ mb: 1 }}
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
        </FieldRow>

        <FieldRow sx={{ mb: 1 }}>
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

        <Box sx={{ mb: 1 }}>
          <StyledSelect
            label="Location"
            name="location"
            value={formData.location || "karachi_port"}
            onChange={onChange}
          >
            {LOCATION_OPTIONS.map((l) => (
              <MenuItem key={l.value} value={l.value}>
                {l.label}
              </MenuItem>
            ))}
          </StyledSelect>
        </Box>

        {isSoc && (
          <>
            <Box sx={{ mb: 1 }}>
              <StyledTextField
                label="Date of Manufacture"
                name="dateOfManufacture"
                type="date"
                value={formData.dateOfManufacture}
                onChange={onChange}
                required
              />
            </Box>
            <FieldRow>
              <StyledTextField
                label="Purchase Date"
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
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
            <FieldRow>
              <StyledTextField
                label="Purchase From"
                name="purchaseFrom"
                value={formData.purchaseFrom}
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
            </FieldRow>
            <Box sx={{ mb: 1 }}>
              <StyledTextField
                label="Available At Date"
                name="availableAtDate"
                type="date"
                value={formData.availableAtDate}
                onChange={onChange}
                required
              />
            </Box>
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
            </FieldRow>
            <FieldRow>
              <StyledTextField
                label="Return Date"
                name="return_date"
                type="date"
                value={formData.return_date}
                onChange={onChange}
              />
              <StyledTextField
                label="Vendor"
                name="vendor"
                value={formData.vendor}
                onChange={onChange}
                required
              />
            </FieldRow>
            <FieldRow>
              <StyledTextField
                label="Place of Loading"
                name="placeOfLoading"
                value={formData.placeOfLoading}
                onChange={onChange}
                required
              />
              <StyledTextField
                label="Place of Delivery"
                name="placeOfDelivery"
                value={formData.placeOfDelivery}
                onChange={onChange}
                required
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
          </>
        )}

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}
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
