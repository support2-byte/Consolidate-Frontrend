import {
  Box,
  Stack,
  Typography,
  Button,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  MenuItem,
  Grid,
  InputLabel,
  Select,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import { CustomTextField, CustomSelect } from "./shared";

const TransportPanel = ({
  expanded,
  onAccordionChange,
  formData,
  setFormData,
  errors,
  handleChange,
  companies,
  updateDropOffField,
  addNewDropOffEntry,
  removeDropOffEntry,
  handleGatepassUpload,
}) => {
  return (
    <Accordion
      expanded={expanded.has("panel3")}
      onChange={onAccordionChange("panel3")}
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
          bgcolor: expanded.has("panel3") ? "#0d6c6a" : "#fff3e0",
          borderRadius: 2,
          "& .MuiAccordionSummary-content": {
            fontWeight: "bold",
            color: expanded.has("panel3") ? "#fff" : "#f58220",
          },
        }}
      >
        3. Transport & Delivery
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, bgcolor: "#fff" }}>
        <Stack spacing={4}>
          <FormControl component="fieldset">
            <Typography variant="h6" color="#f58220" gutterBottom>
              Transport Type *
            </Typography>
            <RadioGroup
              row
              name="transportType"
              value={formData.transportType || "Drop Off"}
              onChange={handleChange}
            >
              <FormControlLabel
                value="Drop Off"
                control={<Radio />}
                label="Drop Off"
              />
              <FormControlLabel
                value="Collection"
                control={<Radio />}
                label="Collection"
              />
              <FormControlLabel
                value="Third Party"
                control={<Radio />}
                label="Third Party"
              />
            </RadioGroup>
          </FormControl>

          {formData.transportType === "Drop Off" && (
            <Stack spacing={3}>
              <Typography variant="h6" color="#f58220">
                Drop Off Details
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Select Receiver for Drop Off *</InputLabel>
                <Select
                  value={formData.selectedReceiverForDropOff ?? ""}
                  onChange={(e) => {
                    const idx = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      selectedReceiverForDropOff: idx,
                      dropOffDetails: {
                        ...prev.dropOffDetails,
                        [idx]: prev.dropOffDetails?.[idx] || [{}],
                      },
                    }));
                  }}
                  label="Select Receiver for Drop Off *"
                >
                  <MenuItem value="">-- Select Receiver --</MenuItem>
                  {(formData.receivers || []).map((rec, i) => (
                    <MenuItem key={i} value={i}>
                      {rec.receiverName || `Receiver ${i + 1}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {formData.selectedReceiverForDropOff !== "" &&
                formData.selectedReceiverForDropOff !== undefined && (
                  <Stack spacing={3}>
                    {(
                      formData.dropOffDetails?.[
                        formData.selectedReceiverForDropOff
                      ] || []
                    ).map((detail, idx) => (
                      <Paper
                        key={idx}
                        elevation={1}
                        sx={{ p: 3, borderRadius: 2 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 2,
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            Drop-Off #{idx + 1}
                          </Typography>
                          {idx > 0 && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removeDropOffEntry(idx)}
                            >
                              Remove
                            </Button>
                          )}
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <CustomSelect
                              label="Drop Method *"
                              value={detail.dropMethod || ""}
                              onChange={(e) =>
                                updateDropOffField(
                                  idx,
                                  "dropMethod",
                                  e.target.value,
                                )
                              }
                            >
                              <MenuItem value="">Select Method</MenuItem>
                              <MenuItem value="Drop-Off">Drop-Off</MenuItem>
                              <MenuItem value="RGSL Pickup">
                                RGSL Pickup
                              </MenuItem>
                            </CustomSelect>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <CustomTextField
                              label="Person Name *"
                              value={detail.dropoffName || ""}
                              onChange={(e) =>
                                updateDropOffField(
                                  idx,
                                  "dropoffName",
                                  e.target.value,
                                )
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <CustomTextField
                              label="CNIC / ID"
                              value={detail.dropOffCnic || ""}
                              onChange={(e) =>
                                updateDropOffField(
                                  idx,
                                  "dropOffCnic",
                                  e.target.value,
                                )
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <CustomTextField
                              label="Mobile Number"
                              value={detail.dropOffMobile || ""}
                              onChange={(e) =>
                                updateDropOffField(
                                  idx,
                                  "dropOffMobile",
                                  e.target.value,
                                )
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <CustomTextField
                              label="Plate No (Optional)"
                              value={detail.plateNo || ""}
                              onChange={(e) =>
                                updateDropOffField(
                                  idx,
                                  "plateNo",
                                  e.target.value,
                                )
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <CustomTextField
                              label="Drop Date"
                              type="date"
                              value={detail.dropDate || ""}
                              onChange={(e) =>
                                updateDropOffField(
                                  idx,
                                  "dropDate",
                                  e.target.value,
                                )
                              }
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addNewDropOffEntry}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Add Another Drop-Off Entry
                    </Button>
                  </Stack>
                )}
            </Stack>
          )}

          {formData.transportType === "Collection" && (
            <Stack spacing={3}>
              <Typography variant="h6" color="#f58220">
                Collection Details
              </Typography>
              <CustomSelect
                label="Collection Method"
                name="collectionMethod"
                value={formData.collectionMethod || ""}
                onChange={handleChange}
              >
                <MenuItem value="">Select Method</MenuItem>
                <MenuItem value="Delivered by RGSL">Delivered by RGSL</MenuItem>
                <MenuItem value="Collected by Client">
                  Collected by Client
                </MenuItem>
              </CustomSelect>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <CustomSelect
                  label="Scope"
                  name="collection_scope"
                  value={formData.collection_scope || "Partial"}
                  onChange={handleChange}
                >
                  <MenuItem value="Full">Full</MenuItem>
                  <MenuItem value="Partial">Partial</MenuItem>
                </CustomSelect>
                {formData.collection_scope === "Partial" && (
                  <CustomTextField
                    label="Qty Delivered"
                    name="qtyDelivered"
                    type="number"
                    value={formData.qtyDelivered || ""}
                    onChange={handleChange}
                  />
                )}
              </Box>

              <Stack spacing={2}>
                <CustomTextField
                  label="Client Receiver Name"
                  name="clientReceiverName"
                  value={formData.clientReceiverName || ""}
                  onChange={handleChange}
                />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <CustomTextField
                    label="Receiver ID"
                    name="clientReceiverId"
                    value={formData.clientReceiverId || ""}
                    onChange={handleChange}
                  />
                  <CustomTextField
                    label="Receiver Mobile"
                    name="clientReceiverMobile"
                    value={formData.clientReceiverMobile || ""}
                    onChange={handleChange}
                  />
                </Box>
                <CustomTextField
                  label="Plate No (Optional)"
                  name="plateNo"
                  value={formData.plateNo || ""}
                  onChange={handleChange}
                />
                <CustomTextField
                  label="Delivery Date"
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate || ""}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <Button
                variant="outlined"
                component="label"
                sx={{ borderColor: "#f58220", color: "#f58220" }}
              >
                Upload Gatepass (Optional)
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleGatepassUpload}
                />
              </Button>
            </Stack>
          )}

          {formData.transportType === "Third Party" && (
            <Stack spacing={3}>
              <Typography variant="h6" color="#f58220">
                Third Party Transport
              </Typography>
              <CustomSelect
                label="Transport Company"
                name="thirdPartyTransport"
                value={formData.thirdPartyTransport || ""}
                onChange={handleChange}
              >
                {companies.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </CustomSelect>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    label="Driver Name"
                    name="driverName"
                    value={formData.driverName || ""}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    label="Driver Contact"
                    name="driverContact"
                    value={formData.driverContact || ""}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    label="Driver NIC"
                    name="driverNic"
                    value={formData.driverNic || ""}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    label="Pickup Location"
                    name="driverPickupLocation"
                    value={formData.driverPickupLocation || ""}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <CustomTextField
                    label="Truck Number"
                    name="truckNumber"
                    value={formData.truckNumber || ""}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default TransportPanel;
