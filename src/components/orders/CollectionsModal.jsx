import { useState, useEffect, useMemo, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  Grid,
  Chip,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GatepassCreateModal from "./GatepassCreateModal";
import CreateInvoiceModal from "./CreateInvoiceModal";
import { toast } from "react-toastify";
import { api } from "../../api";
import { generateGatepassPDF } from "../../documents/gatepassGenerator";
import { AppContext } from "../../context/AppContext";
import { pdfDocToPngBlob } from "../../lib/pdfToPng";

const emptyCollection = (idx) => ({
  _key: `c-${Date.now()}-${idx}`,
  collectionMethod: "",
  collectionScope: "Partial",
  qtyDelivered: "",
  receiverId: "",
  driverId: "",
  clientReceiverId: "",
  clientReceiverMobile: "",
  plateNo: "",
  deliveryDate: "",
  status: false,
  gatepassFiles: [],
  gatepasses: [],
  items: {},
});

const CollectionsModal = ({ open, onClose, order, getPlaceName, onSave }) => {
  const { drivers, driverTracks } = useContext(AppContext);
  const [collections, setCollections] = useState([emptyCollection(1)]);
  const [saving, setSaving] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [draftGatepassModalOpen, setDraftGatepassModalOpen] = useState(false);
  const [draftGatepassTargetKey, setDraftGatepassTargetKey] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceTarget, setInvoiceTarget] = useState(null);

  const getDriverTrack = (driver) =>
    driverTracks.find((t) => t.driver_code === driver.driver_id);

  const addDraftGatepass = (collectionKey, gpData) => {
    setCollections((prev) =>
      prev.map((c) =>
        c._key === collectionKey
          ? { ...c, gatepasses: [...c.gatepasses, gpData] }
          : c,
      ),
    );
  };

  const removeDraftGatepass = (collectionKey, idx) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c._key !== collectionKey) return c;
        const gatepasses = [...c.gatepasses];
        gatepasses.splice(idx, 1);
        return { ...c, gatepasses };
      }),
    );
  };

  useEffect(() => {
    if (open) {
      setCollections([emptyCollection(1)]);
    }
  }, [open, order?.id]);

  if (!order) return null;

  const receivers = order.receivers || [];

  const updateCollection = (key, patch) => {
    setCollections((prev) =>
      prev.map((c) => (c._key === key ? { ...c, ...patch } : c)),
    );
  };

  const removeCollection = (key) => {
    setCollections((prev) => prev.filter((c) => c._key !== key));
  };

  const handleReceiverChange = (key, receiverId) => {
    updateCollection(key, { receiverId, items: {} });
  };

  const handleDriverChange = (key, driverId) => {
    const driver = drivers.find((d) => d.id === driverId);
    updateCollection(key, {
      driverId,
      clientReceiverId: driver?.driver_id || "",
      clientReceiverMobile: driver?.phone_number || "",
      plateNo: driver?.vehicle_plate || "",
    });
  };

  const toggleItem = (key, itemRef, checked, remaining, orderItemId) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c._key !== key) return c;
        const items = { ...c.items };
        items[itemRef] = {
          checked,
          orderItemId,
          qtyDelivered: checked
            ? items[itemRef]?.qtyDelivered || remaining || 0
            : "",
        };
        return { ...c, items };
      }),
    );
  };

  const addCollection = () => {
    if (receivers.length <= 1) {
      toast.error(
        "Only one receiver on this order — you can't add another collection.",
      );
      return;
    }
    setCollections((prev) => [...prev, emptyCollection(prev.length + 1)]);
  };

  const setItemQty = (key, itemRef, qty, remaining) => {
    const clamped = Math.max(0, Math.min(Number(qty) || 0, remaining));
    setCollections((prev) =>
      prev.map((c) => {
        if (c._key !== key) return c;
        const items = { ...c.items };
        items[itemRef] = { ...items[itemRef], qtyDelivered: clamped };
        return { ...c, items };
      }),
    );
  };

  const handleGatepassUpload = (key, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const withPreviews = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setCollections((prev) =>
      prev.map((c) =>
        c._key === key
          ? { ...c, gatepassFiles: [...c.gatepassFiles, ...withPreviews] }
          : c,
      ),
    );
  };

  const removeGatepassFile = (key, idx) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c._key !== key) return c;
        const files = [...c.gatepassFiles];
        files.splice(idx, 1);
        return { ...c, gatepassFiles: files };
      }),
    );
  };

  const handleSave = async () => {
    const items = collections.map((c) =>
      Object.entries(c.items).filter(
        ([, v]) => v.checked && Number(v.qtyDelivered) > 0,
      ),
    );
    if (!items.some((arr) => arr.length > 0)) {
      toast.error(
        "Select at least one item with a delivered quantity greater than 0.",
      );
      return;
    }

    const formData = new FormData();
    const collectionsPayload = collections.map((c, i) => {
      c.gatepassFiles.forEach((g) =>
        formData.append(`gatepass_${c.receiverId}`, g.file),
      );
      return {
        receiverId: c.receiverId,
        collectionMethod: c.collectionMethod,
        collectionScope: c.collectionScope,
        driverId: c.driverId,
        clientReceiverId: c.clientReceiverId,
        clientReceiverMobile: c.clientReceiverMobile,
        plateNo: c.plateNo,
        deliveryDate: c.deliveryDate,
        status: c.status,
        items: Object.entries(c.items)
          .filter(([, v]) => v.checked && Number(v.qtyDelivered) > 0)
          .map(([itemRef, v]) => ({
            itemRef,
            orderItemId: v.orderItemId,
            qtyDelivered: v.qtyDelivered,
          })),
      };
    });
    formData.append("collections", JSON.stringify(collectionsPayload));

    for (const c of collections) {
      if (!c.receiverId) continue;
      if (c.gatepassFiles.length > 0) continue;
      const receiver = receivers.find((r) => r.id === c.receiverId);
      const driver = drivers.find((d) => d.id === c.driverId);
      const cargoDefaults = computeCargoDefaults(receiver, c.items);
      try {
        const doc = await generateGatepassPDF({
          gpNumber: `GP-${Date.now()}`,
          orderBookingRef: order.booking_ref,
          receiverName: receiver?.receiver_name,
          customerName: receiver?.receiver_name,
          customerContact: receiver?.receiver_contact,
          marksAndNumber: receiver?.marksAndNumber,
          driverName: driver?.name || "N/A",
          driverId: c.clientReceiverId,
          driverContact: c.clientReceiverMobile,
          plateNo: c.plateNo,
          pickupLocation: "",
          qty: cargoDefaults.qty,
          weight: cargoDefaults.weight,
          commodity: cargoDefaults.commodity,
          gateDate: c.deliveryDate,
          collectionMethod: c.collectionMethod,
          download: false,
        });
        const pngBlob = await pdfDocToPngBlob(doc);
        formData.append(
          `gatepass_${c.receiverId}`,
          pngBlob,
          `Gatepass_${c.receiverId}_${Date.now()}.png`,
        );
      } catch (err) {
        console.error("Auto gatepass generation failed:", err);
      }
    }

    setSaving(true);
    try {
      await api.post(`/api/orders/${order.id}/collections`, formData);
      onSave?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to save collections");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (value) => {
    if (!value) return "No date";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "No date" : d.toLocaleDateString();
  };

  const ITEM_FREE_DAYS = 3;

  const getItemOverstayDays = (item) => {
    if (item.status !== "Shipment Delivered" || !item.eta) {
      return 0;
    }
    const delivered = new Date(item.eta);
    if (isNaN(delivered.getTime())) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysSinceDelivered = Math.floor((new Date() - delivered) / msPerDay);
    const overstay = daysSinceDelivered - ITEM_FREE_DAYS;
    return overstay > 0 ? overstay : 0;
  };

  const fmtShortDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const computeCargoDefaults = (receiver, selectedEntries) => {
    const shippingdetails = receiver?.shippingdetails || [];

    const selectedList = Array.isArray(selectedEntries)
      ? selectedEntries
      : Object.entries(selectedEntries || {})
          .filter(([, v]) => v.checked)
          .map(([itemRef, v]) => ({ itemRef, qtyDelivered: v.qtyDelivered }));

    let totalQty = 0;
    let totalWeight = 0;
    const commodities = new Set();

    selectedList.forEach(({ itemRef, qtyDelivered }) => {
      const qty = Number(qtyDelivered) || 0;
      if (qty <= 0) return;

      const item = shippingdetails.find((sd) => sd.itemRef === itemRef);
      if (!item) return;

      totalQty += qty;

      const itemTotal = Number(item.totalNumber) || 0;
      const itemWeight = Number(item.weight) || 0;
      const perUnitWeight = itemTotal > 0 ? itemWeight / itemTotal : itemWeight;
      totalWeight += perUnitWeight * qty;

      const label = item.subcategory || item.category;
      if (label) commodities.add(label);
    });

    return {
      qty: totalQty || "",
      weight: totalWeight ? Number(totalWeight.toFixed(2)) : "",
      commodity: [...commodities].join(", "),
    };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#0d6c6a",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6">Add Collections</Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            Order #{order.booking_ref}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box
          sx={{
            bgcolor: "#fff4e8",
            border: "1px solid #fbd9ae",
            borderRadius: 2,
            p: 2,
            mb: 3,
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Order Booking Ref
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {order.booking_ref || "—"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Form Number
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {order.rgl_booking_number || "—"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Place of Loading
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {getPlaceName(order.place_of_loading) || "—"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Place of Delivery
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {getPlaceName(order.place_of_delivery) || "—"}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        {receivers.some((r) => r.collections?.length > 0) && (
          <Box
            sx={{
              mb: 3,
              border: "1px solid #e0f2f1",
              borderRadius: 1.5,
              overflow: "hidden",
            }}
          >
            <Box
              onClick={() => setHistoryExpanded((prev) => !prev)}
              sx={{
                px: 1.5,
                py: 1,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "#f5fbfa",
                "&:hover": { bgcolor: "#eef8f7" },
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "#0d6c6a" }}
              >
                Previously Added Collections (
                {receivers.reduce(
                  (sum, r) => sum + (r.collections?.length || 0),
                  0,
                )}
                )
              </Typography>
              <ExpandMoreIcon
                fontSize="small"
                sx={{
                  color: "#0d6c6a",
                  transition: "transform 0.2s",
                  transform: historyExpanded
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              />
            </Box>

            {historyExpanded && (
              <Box sx={{ p: 1.5, pt: 1 }}>
                <Stack spacing={1}>
                  {receivers.flatMap((r) =>
                    (r.collections || []).map((c) => (
                      <Box
                        key={c.id}
                        sx={{
                          border: "1px solid #e0f2f1",
                          bgcolor: "#f5fbfa",
                          borderRadius: 1.5,
                          p: 1.5,
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {r.receiver_name || "Unnamed Receiver"} —{" "}
                              {c.collectionMethod || "—"}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {(c.items || []).length} item(s) •{" "}
                              {fmtDate(c.deliveryDate)}
                            </Typography>

                            {c.items?.length > 0 && (
                              <Stack
                                direction="row"
                                flexWrap="wrap"
                                gap={0.5}
                                mt={0.5}
                              >
                                {c.items.map((it, i) => (
                                  <Chip
                                    key={i}
                                    label={`${it.itemRef} (${it.qtyDelivered})`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: "0.65rem" }}
                                  />
                                ))}
                              </Stack>
                            )}
                          </Box>

                          <Box>
                            <Chip
                              label={c.collectionScope || "—"}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.65rem",
                                mb: 1,
                              }}
                            />
                            {c.gatepass?.length > 0 && (
                              <Stack direction="row" gap={0.5} mt={0.5}>
                                {c.gatepass.map((g, i) => (
                                  <a
                                    key={i}
                                    href={g.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <img
                                      src={g.url}
                                      alt="gatepass"
                                      style={{
                                        width: 50,
                                        height: 50,
                                        objectFit: "cover",
                                        borderRadius: 4,
                                        border: "0.5px solid #a2a2a2",
                                      }}
                                    />
                                  </a>
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Stack>
                      </Box>
                    )),
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        )}

        <Stack spacing={2}>
          {collections.map((c, idx) => {
            const receiver = receivers.find((r) => r.id === c.receiverId);
            const items = receiver?.shippingdetails || [];

            return (
              <Box
                key={c._key}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 2,
                  p: 2,
                  bgcolor: "#fcfcfd",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1.5}
                >
                  <Chip
                    label={`Collection #${idx + 1}`}
                    size="small"
                    sx={{
                      bgcolor: "#fff4e8",
                      color: "#d96f10",
                      fontWeight: 700,
                      border: "1px solid #fbd9ae",
                    }}
                  />
                  {collections.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeCollection(c._key)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>

                <Grid container spacing={2} mb={1}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Collection Method</InputLabel>
                      <Select
                        label="Collection Method"
                        value={c.collectionMethod}
                        onChange={(e) =>
                          updateCollection(c._key, {
                            collectionMethod: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="">Select Method</MenuItem>
                        <MenuItem value="Delivered by RGSL">
                          Delivered by RGSL
                        </MenuItem>
                        <MenuItem value="Collected by Client">
                          Collected by Client
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Scope</InputLabel>
                      <Select
                        label="Scope"
                        value={c.collectionScope}
                        onChange={(e) =>
                          updateCollection(c._key, {
                            collectionScope: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="Full">Full</MenuItem>
                        <MenuItem value="Partial">Partial</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Receiver</InputLabel>
                      <Select
                        label="Receiver"
                        value={c.receiverId}
                        onChange={(e) =>
                          handleReceiverChange(c._key, e.target.value)
                        }
                      >
                        <MenuItem value="">Select Receiver</MenuItem>
                        {receivers.map((r) => (
                          <MenuItem key={r.id} value={r.id}>
                            {r.receiver_name || "Unnamed Receiver"}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Grid container spacing={2} my={2}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Driver</InputLabel>
                      <Select
                        label="Driver"
                        value={c.driverId}
                        onChange={(e) =>
                          handleDriverChange(c._key, e.target.value)
                        }
                        renderValue={(val) => {
                          if (!val) return "Select Driver";
                          const d = drivers.find((dr) => dr.id === val);
                          return d ? `${d.name} (${d.driver_id})` : "";
                        }}
                      >
                        <MenuItem value="">
                          <em>Select Driver</em>
                        </MenuItem>
                        {drivers.map((d) => {
                          const track = getDriverTrack(d);
                          return (
                            <MenuItem
                              key={d.id}
                              value={d.id}
                              sx={{ display: "block", py: 1 }}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {d.name} ({d.driver_id})
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {track?.total_deliveries ?? 0} deliveries
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {track?.routes || "No route on file"}
                              </Typography>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Emirates ID / CNIC"
                      placeholder="Emirates ID / CNIC"
                      value={c.clientReceiverId}
                      onChange={(e) =>
                        updateCollection(c._key, {
                          clientReceiverId: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Phone Number"
                      placeholder="+971"
                      value={c.clientReceiverMobile}
                      onChange={(e) =>
                        updateCollection(c._key, {
                          clientReceiverMobile: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Vehicle Plate No (Optional)"
                      value={c.plateNo}
                      onChange={(e) =>
                        updateCollection(c._key, { plateNo: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Delivery Date"
                      InputLabelProps={{ shrink: true }}
                      value={c.deliveryDate}
                      onChange={(e) =>
                        updateCollection(c._key, {
                          deliveryDate: e.target.value,
                        })
                      }
                    />
                  </Grid>
                </Grid>

                {c.receiverId && (
                  <Box
                    sx={{
                      mt: 2,
                      border: "1px solid #e5e7eb",
                      borderRadius: 1.5,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "32px 1.1fr 0.9fr 0.8fr 0.7fr 0.8fr 0.8fr 1fr 1.1fr",
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        bgcolor: "#f7f8fa",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {[
                        "",
                        "Item Ref",
                        "Delivered Date",
                        "Overstayed",
                        "Total Qty",
                        "Delivered Qty",
                        "Remaining Qty",
                        "Qty Delivered",
                        "Action",
                      ].map((h, i) => (
                        <Typography
                          key={i}
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: "text.secondary",
                            textTransform: "uppercase",
                            fontSize: "0.65rem",
                          }}
                        >
                          {h}
                        </Typography>
                      ))}
                    </Box>

                    {items.length === 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", p: 1.5 }}
                      >
                        This receiver has no order items.
                      </Typography>
                    )}

                    {items.map((item) => {
                      const total = parseInt(item.totalNumber || 0, 10);
                      const remaining = parseInt(
                        item.remainingQty ?? item.totalNumber ?? 0,
                        10,
                      );
                      const delivered = parseInt(item.deliveredQty || 0, 10);
                      const rowState = c.items[item.itemRef] || {
                        checked: false,
                        qtyDelivered: "",
                      };

                      const overstayDays = getItemOverstayDays(item);

                      return (
                        <Box
                          key={item.itemRef}
                          sx={{
                            display: "grid",
                            gridTemplateColumns:
                              "32px 1.1fr 0.9fr 0.8fr 0.7fr 0.8fr 0.8fr 1fr 1.1fr",
                            gap: 1,
                            alignItems: "center",
                            px: 1.5,
                            py: 1,
                            borderBottom: "1px solid #f0f0f0",
                            opacity: rowState.checked ? 1 : 0.6,
                            "&:last-child": { borderBottom: "none" },
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={rowState.checked}
                            onChange={(e) =>
                              toggleItem(
                                c._key,
                                item.itemRef,
                                e.target.checked,
                                remaining,
                                item.id,
                              )
                            }
                            sx={{
                              p: 0,
                              color: "#f58220",
                              "&.Mui-checked": { color: "#f58220" },
                            }}
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {item.itemRef}
                          </Typography>
                          <Typography variant="body2">
                            {item.status === "Shipment Delivered"
                              ? fmtShortDate(item.eta)
                              : "—"}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={overstayDays > 0 ? "#c0392b" : "#16a34a"}
                          >
                            {overstayDays > 0 ? `${overstayDays}d` : "—"}
                          </Typography>
                          <Typography variant="body2">{total}</Typography>
                          <Typography variant="body2">{delivered}</Typography>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={remaining === 0 ? "#16a34a" : "#d96f10"}
                          >
                            {remaining}
                          </Typography>
                          <TextField
                            type="number"
                            size="small"
                            placeholder="0"
                            disabled={!rowState.checked}
                            value={rowState.qtyDelivered}
                            inputProps={{ min: 0, max: remaining }}
                            onChange={(e) =>
                              setItemQty(
                                c._key,
                                item.itemRef,
                                e.target.value,
                                remaining,
                              )
                            }
                          />
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            disabled={overstayDays <= 0 || !c.receiverId}
                            onClick={() => {
                              setInvoiceTarget({
                                receiverId: c.receiverId,
                                receiverName: receiver?.receiver_name,
                                itemRef: item.itemRef,
                                category: item.category,
                                subcategory: item.subcategory,
                                overstayDays,
                              });
                              setInvoiceModalOpen(true);
                            }}
                          >
                            Create Invoice
                          </Button>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                <Box
                  sx={{
                    mt: 2,
                    border: "1.5px dashed #f3c088",
                    bgcolor: "#fffaf3",
                    borderRadius: 1.5,
                    p: 1.5,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: "#d96f10" }}
                    >
                      Gatepass (Optional)
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        component="label"
                        size="small"
                        startIcon={<CloudUploadIcon />}
                        sx={{
                          borderColor: "#f58220",
                          color: "#f58220",
                          border: "1px solid #f58220",
                        }}
                      >
                        Upload Gatepass
                        <input
                          type="file"
                          hidden
                          multiple
                          accept="image/*"
                          onChange={(e) =>
                            handleGatepassUpload(c._key, e.target.files)
                          }
                        />
                      </Button>
                    </Stack>
                  </Stack>

                  {c.gatepasses.length > 0 && (
                    <Stack spacing={1} mt={1.5}>
                      {c.gatepasses.map((g, i) => (
                        <Box
                          key={i}
                          sx={{
                            border: "1px solid #fbd9ae",
                            bgcolor: "#fff",
                            borderRadius: 1,
                            p: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="caption">
                            <strong>{g.driverName}</strong> • {g.plateNo}
                            {g.marksAndNumber ? ` • ${g.marksAndNumber}` : ""}
                            {g.qty ? ` • ${g.qty} pkgs` : ""}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => removeDraftGatepass(c._key, i)}
                          >
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  )}

                  {c.gatepassFiles.length > 0 ? (
                    <Stack direction="row" flexWrap="wrap" gap={1} mt={1.5}>
                      {c.gatepassFiles.map((g, i) => (
                        <Box
                          key={i}
                          sx={{
                            position: "relative",
                            width: 64,
                            height: 64,
                            borderRadius: 1,
                            overflow: "hidden",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <img
                            src={g.previewUrl}
                            alt="gatepass"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeGatepassFile(c._key, i)}
                            sx={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              bgcolor: "rgba(0,0,0,0.55)",
                              color: "#fff",
                              p: 0.25,
                              "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      No gatepass images uploaded yet.
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>

        {receivers.length > 1 && (
          <Button
            startIcon={<AddIcon />}
            onClick={addCollection}
            sx={{
              mt: 2,
              border: "1.5px dashed #f58220",
              color: "#d96f10",
              "&:hover": { bgcolor: "#fff4e8" },
            }}
          >
            Add Another Collection
          </Button>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ bgcolor: "#f58220", "&:hover": { bgcolor: "#d96f10" } }}
        >
          {saving ? "Saving..." : "Save Collections"}
        </Button>
      </DialogActions>
      <GatepassCreateModal
        draft
        open={draftGatepassModalOpen}
        onClose={() => setDraftGatepassModalOpen(false)}
        collection={collections.find((c) => c._key === draftGatepassTargetKey)}
        order={order}
        receiverName={
          receivers.find(
            (r) =>
              r.id ===
              collections.find((c) => c._key === draftGatepassTargetKey)
                ?.receiverId,
          )?.receiver_name
        }
        marksAndNumber={
          receivers.find(
            (r) =>
              r.id ===
              collections.find((c) => c._key === draftGatepassTargetKey)
                ?.receiverId,
          )?.marksAndNumber
        }
        customerContact={
          receivers.find(
            (r) =>
              r.id ===
              collections.find((c) => c._key === draftGatepassTargetKey)
                ?.receiverId,
          )?.receiver_contact
        }
        cargoDefaults={(() => {
          const targetCollection = collections.find(
            (c) => c._key === draftGatepassTargetKey,
          );
          const receiver = receivers.find(
            (r) => r.id === targetCollection?.receiverId,
          );
          return computeCargoDefaults(receiver, targetCollection?.items);
        })()}
        onCreated={(gpData) => addDraftGatepass(draftGatepassTargetKey, gpData)}
      />

      <CreateInvoiceModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        order={order}
        receiverId={invoiceTarget?.receiverId}
        receiverName={invoiceTarget?.receiverName}
        itemRef={invoiceTarget?.itemRef}
        category={invoiceTarget?.category}
        subcategory={invoiceTarget?.subcategory}
        overstayDays={invoiceTarget?.overstayDays}
        onCreated={() => onSave?.()}
      />
    </Dialog>
  );
};

export default CollectionsModal;
