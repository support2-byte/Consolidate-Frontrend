import React from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";

const fieldSx = { bgcolor: "white" };

export const StyledTextField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  disabled,
  helperText,
  sx = {},
  InputLabelProps,
  ...rest
}) => (
  <TextField
    label={label}
    name={name}
    value={value || ""}
    onChange={onChange}
    type={type}
    required={required}
    disabled={disabled}
    helperText={helperText}
    fullWidth
    variant="outlined"
    sx={{ ...fieldSx, ...sx }}
    InputLabelProps={{
      shrink: type === "date" || !!value,
      ...InputLabelProps,
    }}
    {...rest}
  />
);

export const StyledSelect = ({
  label,
  name,
  value,
  onChange,
  children,
  disabled,
  sx = {},
}) => (
  <FormControl fullWidth variant="outlined" sx={{ ...fieldSx, ...sx }}>
    <InputLabel>{label}</InputLabel>
    <Select
      name={name}
      label={label}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
    >
      {children}
    </Select>
  </FormControl>
);

export const FieldRow = ({ children, sx = {} }) => (
  <Box sx={{ display: "flex", mb: 1, gap: 1, ...sx }}>
    {React.Children.map(
      children,
      (child) => child && <Box sx={{ flex: 1 }}>{child}</Box>,
    )}
  </Box>
);
