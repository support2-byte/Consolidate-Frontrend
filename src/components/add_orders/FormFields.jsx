import { TextField, FormControl, InputLabel, Select } from "@mui/material";

export const CustomTextField = ({ disabled, ...props }) => (
  <TextField
    {...props}
    disabled={disabled}
    size="medium"
    sx={{
      flex: 1,
      minWidth: 0,
      "& .MuiOutlinedInput-root": {
        borderRadius: 2,
        transition: "all 0.3s ease",
        backgroundColor: "#fff",
        "& fieldset": { borderColor: "#ddd" },
        "&:hover fieldset": { borderColor: "#f58220" },
        "&.Mui-focused fieldset": {
          borderColor: "#f58220",
          boxShadow: "0 0 8px rgba(245, 130, 32, 0.3)",
        },
        ...(props.error && { "& fieldset": { borderColor: "#d32f2f" } }),
        ...(disabled && { backgroundColor: "#f5f5f5", color: "#999" }),
      },
      "& .MuiInputLabel-root": {
        letterSpacing: 0.5,
        textTransform: "capitalize",
        color: "rgba(180, 174, 174, 1)",
        ...(props.error && { color: "#d32f2f" }),
        ...(disabled && { color: "#999" }),
      },
    }}
  />
);

export const CustomSelect = ({
  label,
  name,
  value,
  onChange,
  children,
  sx: selectSx,
  error,
  disabled,
  required = false,
  renderValue,
}) => (
  <FormControl
    size="medium"
    sx={{ flex: 1, minWidth: 0, ...selectSx, background: "#fff" }}
    error={error}
    required={required}
  >
    <InputLabel
      sx={{
        color: "rgba(180, 174, 174, 1)",
        ...(disabled && { color: "#999" }),
      }}
    >
      {label}
    </InputLabel>
    <Select
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      size="medium"
      renderValue={renderValue}
      sx={{
        flex: 1,
        minWidth: 0,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          transition: "all 0.3s ease",
          backgroundColor: "#fff",
          "& fieldset": { borderColor: "#ddd" },
          "&:hover fieldset": { borderColor: "#f58220" },
          "&.Mui-focused fieldset": {
            borderColor: "#f58220",
            boxShadow: "0 0 8px rgba(245, 130, 32, 0.3)",
          },
          ...(error && { "& fieldset": { borderColor: "#d32f2f" } }),
          ...(disabled && { backgroundColor: "#f5f5f5", color: "#999" }),
        },
        "& .MuiInputLabel-root": {
          letterSpacing: 0.5,
          textTransform: "capitalize",
          color: "rgba(180, 174, 174, 1)",
          ...(error && { color: "#d32f2f" }),
          ...(disabled && { color: "#999" }),
        },
      }}
    >
      {children}
    </Select>
  </FormControl>
);
