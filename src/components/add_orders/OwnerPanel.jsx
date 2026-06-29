import {
  Box,
  Stack,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  Autocomplete,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CustomTextField } from "./shared";

const OwnerPanel = ({
  expanded,
  onAccordionChange,
  formData,
  errors,
  options2,
  searchTerm,
  setSearchTerm,
  loading,
  handleChange,
  handleSelectOwner,
  isFieldDisabled,
}) => {
  const ownerNameKey =
    formData.senderType === "sender" ? "senderName" : "receiverName";
  const ownerContactKey =
    formData.senderType === "sender" ? "senderContact" : "receiverContact";
  const ownerAddressKey =
    formData.senderType === "sender" ? "senderAddress" : "receiverAddress";
  const ownerEmailKey =
    formData.senderType === "sender" ? "senderEmail" : "receiverEmail";
  const ownerRefKey =
    formData.senderType === "sender" ? "senderRef" : "receiverRef";
  const ownerRemarksKey =
    formData.senderType === "sender" ? "senderRemarks" : "receiverRemarks";
  const typePrefix = formData.senderType === "sender" ? "Sender" : "Receiver";

  const handleOwnerNameChange = (event, newValue) => {
    if (typeof newValue === "string") {
      handleChange({ target: { name: ownerNameKey, value: newValue } });
    } else if (newValue) {
      handleSelectOwner(event, newValue);
    } else {
      [
        ownerNameKey,
        ownerContactKey,
        ownerAddressKey,
        ownerEmailKey,
        ownerRefKey,
        ownerRemarksKey,
      ].forEach((key) => handleChange({ target: { name: key, value: "" } }));
      handleChange({ target: { name: "selectedSenderOwner", value: "" } });
    }
  };

  return (
    <Accordion
      expanded={expanded.has("panel1")}
      onChange={onAccordionChange("panel1")}
      sx={{
        borderRadius: 2,
        boxShadow: "none",
        "&:before": { display: "none" },
        "&.Mui-expanded": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: expanded.has("panel1") ? "#0d6c6a" : "#fff3e0",
          borderRadius: 2,
          "& .MuiAccordionSummary-content": {
            fontWeight: "bold",
            color: expanded.has("panel1") ? "#fff" : "#f58220",
          },
        }}
      >
        1. Owner Details
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
        <Stack spacing={2}>
          <FormControl component="fieldset" error={!!errors.senderType}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="#f58220"
              gutterBottom
            >
              Select Type
            </Typography>
            <RadioGroup
              name="senderType"
              value={formData.senderType}
              onChange={handleChange}
              sx={{ flexDirection: "row", gap: 3, mb: 1 }}
            >
              <FormControlLabel
                value="sender"
                control={<Radio />}
                label="Sender Details"
              />
              <FormControlLabel
                value="receiver"
                control={<Radio />}
                label="Receiver Details"
              />
            </RadioGroup>
            {errors.senderType && (
              <Typography variant="caption" color="error">
                {errors.senderType}
              </Typography>
            )}
          </FormControl>

          <Stack spacing={2}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <Autocomplete
                options={options2}
                loading={loading}
                freeSolo
                getOptionLabel={(option) =>
                  typeof option === "string"
                    ? option
                    : option.contact_name || ""
                }
                isOptionEqualToValue={(option, value) => {
                  if (typeof value === "string") {
                    return typeof option === "string"
                      ? option === value
                      : (option.contact_name || "") === value;
                  }
                  return (
                    typeof option !== "string" &&
                    (option.zoho_id === value.zoho_id || option.id === value.id)
                  );
                }}
                value={formData[ownerNameKey] || null}
                onChange={handleOwnerNameChange}
                onInputChange={(_, newVal) => setSearchTerm(newVal)}
                renderInput={(params) => (
                  <CustomTextField
                    {...params}
                    label={`Search & Select ${typePrefix}`}
                    error={
                      !!errors[ownerNameKey] || !!errors.selectedSenderOwner
                    }
                    helperText={
                      errors[ownerNameKey] ||
                      errors.selectedSenderOwner ||
                      (loading ? "Loading..." : "")
                    }
                    disabled={isFieldDisabled("selectedSenderOwner")}
                    style={{ width: "100%" }}
                  />
                )}
                renderOption={(props, option) => (
                  <li
                    {...props}
                    key={
                      typeof option === "string"
                        ? option
                        : option.zoho_id || option.id
                    }
                  >
                    <div>
                      <strong>
                        {typeof option === "string"
                          ? option
                          : option.contact_name || ""}
                      </strong>
                      {typeof option !== "string" && option.email && (
                        <div style={{ fontSize: "0.875em", color: "#666" }}>
                          {option.email}
                        </div>
                      )}
                      {typeof option !== "string" && option.primary_phone && (
                        <div style={{ fontSize: "0.875em", color: "#666" }}>
                          {option.primary_phone}
                        </div>
                      )}
                    </div>
                  </li>
                )}
                noOptionsText={
                  searchTerm
                    ? `No ${typePrefix.toLowerCase()}s found for "${searchTerm}"`
                    : `Type to search ${typePrefix.toLowerCase()}s`
                }
                clearOnBlur={false}
                selectOnFocus
                style={{ width: "60%" }}
              />
              <CustomTextField
                label={`${typePrefix} Contact`}
                name={ownerContactKey}
                value={formData[ownerContactKey] || ""}
                onChange={handleChange}
                error={!!errors[ownerContactKey]}
                helperText={errors[ownerContactKey]}
              />
            </Box>

            <CustomTextField
              label={`${typePrefix} Address`}
              name={ownerAddressKey}
              value={formData[ownerAddressKey] || ""}
              onChange={handleChange}
              error={!!errors[ownerAddressKey]}
              helperText={errors[ownerAddressKey]}
              multiline
              rows={2}
            />

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <CustomTextField
                label={`${typePrefix} Email`}
                name={ownerEmailKey}
                value={formData[ownerEmailKey] || ""}
                onChange={handleChange}
                error={!!errors[ownerEmailKey]}
                helperText={errors[ownerEmailKey]}
              />
              <CustomTextField
                label={`${typePrefix} Ref`}
                name={ownerRefKey}
                value={formData[ownerRefKey] || ""}
                onChange={handleChange}
                error={!!errors[ownerRefKey]}
                helperText={errors[ownerRefKey]}
              />
            </Box>

            <CustomTextField
              label={`${typePrefix} Remarks`}
              name={ownerRemarksKey}
              value={formData[ownerRemarksKey] || ""}
              onChange={handleChange}
              error={!!errors[ownerRemarksKey]}
              helperText={errors[ownerRemarksKey]}
              multiline
              rows={2}
            />
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default OwnerPanel;
