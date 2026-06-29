import { Box, Switch, TextField, Typography } from "@mui/material";

const TEAL = "#1a7a6e";

export function StatusFormFields({ form, onChange }) {
  return (
    <>
      <TextField
        label="Order Status"
        size="small"
        fullWidth
        value={form.order_status}
        onChange={(e) => onChange("order_status", e.target.value)}
      />
      <TextField
        label="Container Status"
        size="small"
        fullWidth
        value={form.container_status}
        onChange={(e) => onChange("container_status", e.target.value)}
      />
      <TextField
        label="Consignment Status"
        size="small"
        fullWidth
        value={form.consignment_status}
        onChange={(e) => onChange("consignment_status", e.target.value)}
      />
      <TextField
        label="Days Offset"
        size="small"
        type="number"
        fullWidth
        value={form.days_offset}
        onChange={(e) => onChange("days_offset", Number(e.target.value))}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" sx={{ color: "#555" }}>
          Active
        </Typography>
        <Switch
          checked={form.status}
          onChange={(e) => onChange("status", e.target.checked)}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": { color: TEAL },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              bgcolor: TEAL,
            },
          }}
        />
      </Box>
    </>
  );
}
