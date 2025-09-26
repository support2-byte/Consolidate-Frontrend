import { useState } from "react";
import axios from "axios";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Snackbar, Alert } from "@mui/material";
import dayjs from "dayjs";
import { api } from "../../api";

export default function AddContainer() {
  const [containerNo, setContainerNo] = useState("");
  const [containerSize, setContainerSize] = useState("");
  const [containerType, setContainerType] = useState("");
  const [ownershipType, setOwnershipType] = useState("");
  const [shipper, setShipper] = useState("");
  const [dateHired, setDateHired] = useState(null);
  const [dateReached, setDateReached] = useState(null);
  const [freeDays, setFreeDays] = useState("");
  const [returnDate, setReturnDate] = useState(null);
  const [placeOfLoading, setPlaceOfLoading] = useState("");
  const [placeOfDelivery, setPlaceOfDelivery] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
    const [image, setImage] = useState(null);
 const [preview, setPreview] = useState(null);

  // ✅ Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file)); // generate preview
      console.log("📷 Selected file:", file);
    }
  };

  // ✅ Trigger hidden input
  const handleUploadClick = () => {
    document.getElementById("fileInput").click();
  };

  // ✅ Submit handler
  const handleSubmit = async () => {
    try {
      const payload = {
        container_no: containerNo,
        container_size: containerSize,
        shipper,
        date_hired: dateHired ? dayjs(dateHired).format("YYYY-MM-DD") : null,
        date_reached: dateReached ? dayjs(dateReached).format("YYYY-MM-DD") : null,
        free_days: freeDays,
        return_date: returnDate ? dayjs(returnDate).format("YYYY-MM-DD") : null,
        place_of_loading: placeOfLoading,
        place_of_delivery: placeOfDelivery,
        container_type: containerType,
        ownership_type: ownershipType,
      };

      const res = await api.post("/api/containers", payload);

      showToast("Container saved successfully!", "success");
      console.log("Response:", res.data);

      // Reset form after success
      setContainerNo("");
      setContainerSize("");
      setContainerType("");
      setOwnershipType("");
      setShipper("");
      setDateHired(null);
      setDateReached(null);
      setFreeDays("");
      setReturnDate(null);
      setPlaceOfLoading("");
      setPlaceOfDelivery("");
    } catch (err) {
      console.error("❌ Error adding container:", err.response?.data || err.message);
      showToast("Failed to save Container. Please try again.", "error");
    }
  };
  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Card sx={{ maxWidth: "100%", margin: "0", borderRadius: 2, boxShadow: 3 }}>
        <CardHeader
          title={<Typography variant="h4" fontWeight="bold" mt={0}>Container Details</Typography>}
        />
        <CardContent sx={{ display: "grid", gap: 3 }}>

          {/* Row 1: Container No + Container Size */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Container No *"
              placeholder="e.g. ABCD1234567"
              fullWidth
              value={containerNo}
              onChange={(e) => setContainerNo(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Container Size *</InputLabel>
              <Select
                value={containerSize}
                onChange={(e) => setContainerSize(e.target.value)}
                label="Container Size *"
              >
                <MenuItem value="20">20 ft</MenuItem>
                <MenuItem value="40">40 ft</MenuItem>
                <MenuItem value="40HC">40 ft HC</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Row 2: Shipping Line + Date Hired */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Shipping Line / Hired Co.</InputLabel>
              <Select
                value={shipper}
                onChange={(e) => setShipper(e.target.value)}
                label="Shipping Line / Hired Co."
              >
                <MenuItem value="maersk">Maersk</MenuItem>
                <MenuItem value="msc">MSC</MenuItem>
                <MenuItem value="cma">CMA CGM</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Container Type *</InputLabel>
              <Select
                value={containerType}
                onChange={(e) => setContainerType(e.target.value)}
                label="Container Size *"
              >
                <MenuItem value="Dry High">Dry High</MenuItem>
                <MenuItem value="Dry Standard">Dry Standard</MenuItem>
                <MenuItem value="Flat High">Flat High</MenuItem>
                <MenuItem value="Flat Standard">Flat Standard</MenuItem>
                <MenuItem value="Open Top">Open Top</MenuItem>
                <MenuItem value="Open Top High">Open Top High</MenuItem>
                <MenuItem value="Reefer High">Reefer High</MenuItem>
                <MenuItem value="Reefer Standard">Reefer Standard</MenuItem>
                <MenuItem value="Tank">Tank</MenuItem>
              </Select>
            </FormControl>

          </Box>

          {/* Row 3: Date Reached + Free Days */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <DatePicker
              label="Date Hired *"
              value={dateHired}
              onChange={(newValue) => setDateHired(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DatePicker
              label="Date Reached Destination"
              value={dateReached}
              onChange={(newValue) => setDateReached(newValue)}
              slotProps={{ textField: { fullWidth: true } }}

            />

          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            {/* Row 4: Return Date */}
            <DatePicker
              label="Return Date"
              value={returnDate}
              onChange={(newValue) => setReturnDate(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TextField
              type="number"
              label="Free Days *"
              placeholder="e.g. 10"
              fullWidth
              value={freeDays}
              onChange={(e) => setFreeDays(e.target.value)}
            />
          </Box>
          {/* Row 5: Place of Loading + Place of Delivery */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Place of Loading *</InputLabel>
              <Select
                value={placeOfLoading}
                onChange={(e) => setPlaceOfLoading(e.target.value)}
                label="Place of Loading *"
              >
                <MenuItem value="mumbai">Mumbai</MenuItem>
                <MenuItem value="dubai">Dubai</MenuItem>
                <MenuItem value="singapore">Singapore</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>OwnerShip Type *</InputLabel>
              <Select
                value={ownershipType}
                onChange={(e) => setOwnershipType(e.target.value)}
                label="Ownership Type"
              >
                <MenuItem value="SOC">SOC</MenuItem>
                <MenuItem value="COC">COC</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Place of Delivery *</InputLabel>
              <Select
                value={placeOfDelivery}
                onChange={(e) => setPlaceOfDelivery(e.target.value)}
                label="Place of Delivery *"
              >
                <MenuItem value="newyork">New York</MenuItem>
                <MenuItem value="rotterdam">Rotterdam</MenuItem>
                <MenuItem value="antwerp">Antwerp</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
    <input
        type="file"
        id="fileInput"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Preview Section */}
      {preview && (
        <Box
          sx={{
            mt: 2,
            mb: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="primary" fontWeight={"bold"} mb={1}>
            Selected Image:
          </Typography>
          <Box
            component="img"
            src={preview}
            alt="Preview"
            sx={{
              width: 200,
              height: 150,
              borderRadius: 2,
              objectFit: "cover",
              border: "1px solid #ddd",
              boxShadow: 2,
            }}
          />
        </Box>
      )}
        {/* Action Buttons */}
        <CardActions sx={{ justifyContent: "flex-end", gap: 2, padding: "1rem" }}>
          <Button variant="outlined" color="secondary" onClick={handleUploadClick}>Upload Image</Button>
          <Button variant="outlined" color="error">Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Save
          </Button>
        </CardActions>
      </Card>
    </LocalizationProvider>
  );
}
