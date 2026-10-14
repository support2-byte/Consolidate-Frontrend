import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Grid,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { toast } from "react-toastify";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import PrintIcon from "@mui/icons-material/Print";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { OrderConfirmation } from "../../documents/orderConfirmationGenerator";
import { api } from "../../api";
import { AppContext } from "../../context/AppContext";

const TYPE_OPTIONS = ["Box", "Package", "Bags"];

const emptyItem = () => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  portOfLoading: "",
  portOfDestination: "",
  categoryId: "",
  subcategoryId: "",
  type: "",
  weight: "",
  qty: "",
});

const emptyParty = () => ({
  name: "",
  address: "",
  phone: "",
  email: "",
});

const parseEmailList = (value) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const SectionHeader = ({ icon, title }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    {icon}
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
  </Stack>
);

const DEFAULT_SUBJECT = "Order Confirmation & Acceptance";
const DEFAULT_MESSAGE =
  "Please find attached the order confirmation for your review. Kindly verify the shipment details below and confirm your acceptance at your earliest convenience.";

const OrderConfirmationEmailModal = ({
  open,
  onClose,
  companies,
  getPlaceName,
}) => {
  const { places } = useContext(AppContext);

  const [expanded, setExpanded] = useState("email");
  const handleAccordion = (panel) => (_, isExpanded) =>
    setExpanded(isExpanded ? panel : false);

  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [toInput, setToInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const [senderForm, setSenderForm] = useState(emptyParty());
  const [receiverForm, setReceiverForm] = useState(emptyParty());
  const [receiverCompanyName, setReceiverCompanyName] = useState("");

  const [mode, setMode] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const [catRes, subRes] = await Promise.all([
          api.get("api/options/categories/crud"),
          api.get("api/options/subcategories/crud"),
        ]);
        setCategories(catRes.data?.categories || []);
        setSubcategories(subRes.data?.subCategories || []);
      } catch (err) {
        console.log(err);
        toast.error("Failed to load categories/subcategories");
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchOptions();
  }, [open]);

  const printFrameRef = useRef(null);

  const activeCompany =
    companies?.find((c) => c.id === selectedCompanyId) || null;

  const handleSenderChange = (field) => (e) =>
    setSenderForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleReceiverChange = (field) => (e) =>
    setReceiverForm((prev) => ({ ...prev, [field]: e.target.value }));

  const senderParty = senderForm.name.trim() ? senderForm : null;
  const receiverParty = receiverForm.name.trim() ? receiverForm : null;

  const previewOrderData = useMemo(() => {
    if (!senderParty || !receiverParty) return null;

    const getCategoryName = (id) =>
      categories.find((c) => String(c.id) === String(id))?.name || "";
    const getSubcategoryName = (id) =>
      subcategories.find((s) => String(s.id) === String(id))?.name || "";
    const getPlaceLabel = (id) => {
      if (!id) return "";
      const fromParent = getPlaceName ? getPlaceName(id) : "";
      if (fromParent && fromParent !== id) return fromParent;
      return places?.find((p) => String(p.id) === String(id))?.name || "";
    };

    return {
      sender_name: senderParty.name,
      sender_address: senderParty.address,
      sender_contact: senderParty.phone,
      sender_email: senderParty.email,
      mode,
      items: items
        .filter(
          (i) =>
            i.portOfLoading ||
            i.portOfDestination ||
            i.categoryId ||
            i.subcategoryId ||
            i.type ||
            i.weight ||
            i.qty,
        )
        .map((i) => ({
          portOfLoading: getPlaceLabel(i.portOfLoading),
          portOfDestination: getPlaceLabel(i.portOfDestination),
          category: getCategoryName(i.categoryId),
          subcategory: getSubcategoryName(i.subcategoryId),
          type: i.type,
          weight: i.weight,
          qty: i.qty,
        })),
      receivers: [
        {
          receiverName: receiverParty.name,
          receiverAddress: receiverParty.address,
          receiverContact: receiverParty.phone,
          receiverEmail: receiverParty.email,
          receiverCompany: receiverCompanyName,
        },
      ],
    };
  }, [
    senderParty,
    receiverParty,
    receiverCompanyName,
    mode,
    items,
    categories,
    subcategories,
    places,
    getPlaceName,
  ]);

  const previewHtml = useMemo(() => {
    if (!activeCompany || !previewOrderData) return "";
    return OrderConfirmation(previewOrderData, activeCompany, getPlaceName);
  }, [previewOrderData, activeCompany, getPlaceName]);

  const handleItemChange = (id, field) => (e) => {
    const value = e.target.value;
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  };

  const handleAddItem = () => setItems((prev) => [...prev, emptyItem()]);
  const handleRemoveItem = (id) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.id !== id) : prev,
    );

  const handlePrint = () => {
    if (!previewHtml || !printFrameRef.current) return;
    const frame = printFrameRef.current;
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(previewHtml);
    doc.close();
    frame.contentWindow.focus();
    frame.contentWindow.print();
  };

  const handleSendEmail = async () => {
    const toList = parseEmailList(toInput);
    const ccList = parseEmailList(ccInput);
    const bccList = parseEmailList(bccInput);

    if (toList.length === 0) {
      toast.warning("Add at least one recipient in To");
      return;
    }
    if (!activeCompany) {
      toast.warning("Select a company to brand the document before sending");
      return;
    }
    if (!senderParty || !receiverParty) {
      toast.warning("Fill in sender and receiver details before sending");
      return;
    }

    const allRecipients = [
      ...toList.map((email) => ({ email, role: "to" })),
      ...ccList.map((email) => ({ email, role: "cc" })),
      ...bccList.map((email) => ({ email, role: "bcc" })),
    ];

    const getCategoryName = (id) =>
      categories.find((c) => String(c.id) === String(id))?.name || "";
    const getSubcategoryName = (id) =>
      subcategories.find((s) => String(s.id) === String(id))?.name || "";
    const getPlaceLabel = (id) => {
      if (!id) return "";
      const fromParent = getPlaceName ? getPlaceName(id) : "";
      if (fromParent && fromParent !== id) return fromParent;
      return places?.find((p) => String(p.id) === String(id))?.name || "";
    };

    const payloadItems = items
      .filter(
        (i) =>
          i.portOfLoading ||
          i.portOfDestination ||
          i.categoryId ||
          i.subcategoryId ||
          i.type ||
          i.weight ||
          i.qty,
      )
      .map((i) => ({
        portOfLoadingId: i.portOfLoading || null,
        portOfLoading: getPlaceLabel(i.portOfLoading),
        portOfDestinationId: i.portOfDestination || null,
        portOfDestination: getPlaceLabel(i.portOfDestination),
        categoryId: i.categoryId || null,
        category: getCategoryName(i.categoryId),
        subcategoryId: i.subcategoryId || null,
        subcategory: getSubcategoryName(i.subcategoryId),
        type: i.type,
        weight: i.weight,
        qty: i.qty,
      }));

    try {
      const { data } = await api.post("/api/booking/confirmation-email-queue", {
        companyId: activeCompany.id,
        subject,
        message,
        mode,
        sender: {
          name: senderParty.name,
          address: senderParty.address,
          phone: senderParty.phone,
          email: senderParty.email,
        },
        items: payloadItems,
        participants: allRecipients.map((p) => ({
          name: receiverParty.name,
          company: receiverCompanyName,
          email: p.email,
          phone: receiverParty.phone,
          address: receiverParty.address,
          role: p.role,
        })),
      });

      const msg = `Queued ${data.queued} of ${data.total} email(s)`;
      if (data.queued === data.total) {
        toast.success(msg);
      } else {
        toast.warning(msg);
      }
    } catch (err) {
      console.log(err);
      toast.error(
        err.response?.data?.message || "Failed to queue confirmation emails",
      );
    }
  };

  const handleClose = () => {
    setToInput("");
    setCcInput("");
    setBccInput("");
    setSubject(DEFAULT_SUBJECT);
    setMessage(DEFAULT_MESSAGE);
    setSenderForm(emptyParty());
    setReceiverForm(emptyParty());
    setReceiverCompanyName("");
    setMode("");
    setItems([emptyItem()]);
    setSelectedCompanyId("");
    setExpanded("email");
    onClose();
  };

  const accordionSx = {
    boxShadow: "none",
    border: "1px solid #e0e0e0",
    borderRadius: "8px !important",
    mb: 1.25,
    "&:before": { display: "none" },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, height: "92vh" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1.5,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Order Confirmation & Acceptance
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: "flex", height: "100%" }}>
        <Box
          sx={{
            width: 600,
            flexShrink: 0,
            borderRight: "1px solid #e0e0e0",
            p: 2,
            overflowY: "auto",
            bgcolor: "#fafafa",
          }}
        >
          <Accordion
            sx={accordionSx}
            expanded={expanded === "email"}
            onChange={handleAccordion("email")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SectionHeader
                icon={
                  <EmailOutlinedIcon
                    fontSize="small"
                    sx={{ color: "#f58220" }}
                  />
                }
                title="Email"
              />
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1.25}>
                <TextField
                  label="To"
                  placeholder="name@example.com, name2@example.com"
                  size="small"
                  fullWidth
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                />
                <TextField
                  label="Cc"
                  placeholder="cc1@example.com, cc2@example.com"
                  size="small"
                  fullWidth
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                />
                <TextField
                  label="Bcc"
                  placeholder="bcc1@example.com"
                  size="small"
                  fullWidth
                  value={bccInput}
                  onChange={(e) => setBccInput(e.target.value)}
                />
                <TextField
                  label="Subject"
                  size="small"
                  fullWidth
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <TextField
                  label="Message"
                  size="small"
                  fullWidth
                  multiline
                  minRows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion
            sx={accordionSx}
            expanded={expanded === "company"}
            onChange={handleAccordion("company")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SectionHeader
                icon={
                  <BusinessIcon fontSize="small" sx={{ color: "#0d6c6a" }} />
                }
                title="Company"
              />
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                select
                label="Company"
                size="small"
                fullWidth
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <MenuItem value="" disabled>
                  Select company
                </MenuItem>
                {(companies || []).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.company}
                  </MenuItem>
                ))}
              </TextField>
            </AccordionDetails>
          </Accordion>

          <Accordion
            sx={accordionSx}
            expanded={expanded === "parties"}
            onChange={handleAccordion("parties")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SectionHeader
                icon={
                  <PeopleAltOutlinedIcon
                    fontSize="small"
                    sx={{ color: "#7b1fa2" }}
                  />
                }
                title="Sender & Receiver"
              />
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1.5}>
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    Sender
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 0.25 }}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Name"
                        size="small"
                        fullWidth
                        value={senderForm.name}
                        onChange={handleSenderChange("name")}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Phone"
                        size="small"
                        fullWidth
                        value={senderForm.phone}
                        onChange={handleSenderChange("phone")}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Email"
                        size="small"
                        fullWidth
                        value={senderForm.email}
                        onChange={handleSenderChange("email")}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Address"
                        size="small"
                        fullWidth
                        value={senderForm.address}
                        onChange={handleSenderChange("address")}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    Receiver
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 0.25 }}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Name"
                        size="small"
                        fullWidth
                        value={receiverForm.name}
                        onChange={handleReceiverChange("name")}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Phone"
                        size="small"
                        fullWidth
                        value={receiverForm.phone}
                        onChange={handleReceiverChange("phone")}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Email"
                        size="small"
                        fullWidth
                        value={receiverForm.email}
                        onChange={handleReceiverChange("email")}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Address"
                        size="small"
                        fullWidth
                        value={receiverForm.address}
                        onChange={handleReceiverChange("address")}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Receiver Company Name"
                        size="small"
                        fullWidth
                        value={receiverCompanyName}
                        onChange={(e) => setReceiverCompanyName(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion
            sx={accordionSx}
            expanded={expanded === "shipment"}
            onChange={handleAccordion("shipment")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SectionHeader
                icon={
                  <LocalShippingOutlinedIcon
                    fontSize="small"
                    sx={{ color: "#0277bd" }}
                  />
                }
                title="Shipment Details"
              />
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label="Mode"
                size="small"
                fullWidth
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion
            sx={accordionSx}
            expanded={expanded === "items"}
            onChange={handleAccordion("items")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  pr: 1,
                }}
              >
                <SectionHeader
                  icon={
                    <Inventory2OutlinedIcon
                      fontSize="small"
                      sx={{ color: "#c62828" }}
                    />
                  }
                  title={`Order Items (${items.length})`}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1.5}>
                {items.map((item, idx) => {
                  const filteredSubcategories = subcategories.filter(
                    (s) => String(s.category_id) === String(item.categoryId),
                  );

                  return (
                    <Paper
                      key={item.id}
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 1.5 }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Item {idx + 1}
                        </Typography>
                        {items.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            select
                            label="Place of Loading"
                            size="small"
                            fullWidth
                            value={item.portOfLoading}
                            onChange={handleItemChange(
                              item.id,
                              "portOfLoading",
                            )}
                          >
                            <MenuItem value="" disabled>
                              Select place
                            </MenuItem>
                            {(places || []).map((p) => (
                              <MenuItem key={p.id} value={p.id}>
                                {p.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            select
                            label="Place of Destination"
                            size="small"
                            fullWidth
                            value={item.portOfDestination}
                            onChange={handleItemChange(
                              item.id,
                              "portOfDestination",
                            )}
                          >
                            <MenuItem value="" disabled>
                              Select place
                            </MenuItem>
                            {(places || []).map((p) => (
                              <MenuItem key={p.id} value={p.id}>
                                {p.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            select
                            label="Category"
                            size="small"
                            fullWidth
                            value={item.categoryId}
                            onChange={(e) => {
                              const value = e.target.value;
                              setItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id
                                    ? {
                                        ...it,
                                        categoryId: value,
                                        subcategoryId: "",
                                      }
                                    : it,
                                ),
                              );
                            }}
                          >
                            <MenuItem value="" disabled>
                              {optionsLoading
                                ? "Loading..."
                                : "Select category"}
                            </MenuItem>
                            {categories.map((c) => (
                              <MenuItem key={c.id} value={c.id}>
                                {c.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            select
                            label="Subcategory"
                            size="small"
                            fullWidth
                            disabled={!item.categoryId}
                            value={item.subcategoryId}
                            onChange={handleItemChange(
                              item.id,
                              "subcategoryId",
                            )}
                          >
                            <MenuItem value="" disabled>
                              {!item.categoryId
                                ? "Select category first"
                                : "Select subcategory"}
                            </MenuItem>
                            {filteredSubcategories.map((s) => (
                              <MenuItem key={s.id} value={s.id}>
                                {s.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <TextField
                            select
                            label="Type"
                            size="small"
                            fullWidth
                            value={item.type}
                            onChange={handleItemChange(item.id, "type")}
                          >
                            <MenuItem value="" disabled>
                              Select type
                            </MenuItem>
                            {TYPE_OPTIONS.map((t) => (
                              <MenuItem key={t} value={t}>
                                {t}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <TextField
                            label="Weight"
                            size="small"
                            fullWidth
                            value={item.weight}
                            type="number"
                            onChange={handleItemChange(item.id, "weight")}
                          />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <TextField
                            label="Qty"
                            size="small"
                            fullWidth
                            type="number"
                            value={item.qty}
                            onChange={handleItemChange(item.id, "qty")}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Add Item
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            bgcolor: "#eef0f1",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              px: 2,
              py: 1.25,
              bgcolor: "#fff",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="subtitle2">
              {receiverParty ? `Preview for ${receiverParty.name}` : "Preview"}
            </Typography>
            <Button
              size="small"
              startIcon={<PrintIcon />}
              disabled={!previewHtml}
              onClick={handlePrint}
            >
              Print
            </Button>
          </Stack>

          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              justifyContent: "center",
              p: 3,
            }}
          >
            {!selectedCompanyId ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
                Select a company to preview the branded document.
              </Typography>
            ) : !senderParty || !receiverParty ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
                Fill in sender and receiver details to preview the document.
              </Typography>
            ) : (
              <Paper
                elevation={3}
                sx={{
                  width: 800,
                  maxWidth: "100%",
                  height: "fit-content",
                  bgcolor: "#fff",
                  "& .container": {
                    boxShadow: "none !important",
                    border: "none !important",
                  },
                }}
              >
                <Box dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </Paper>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSendEmail}
          sx={{
            backgroundColor: "#f58220",
            "&:hover": { backgroundColor: "#f58220" },
          }}
        >
          Send Email
        </Button>
      </DialogActions>
      <iframe
        ref={printFrameRef}
        title="order-confirmation-print-frame"
        style={{ position: "absolute", width: 0, height: 0, border: "none" }}
      />
    </Dialog>
  );
};

export default OrderConfirmationEmailModal;
