import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Grid,
  Paper,
  Typography,
  CardContent,
  IconButton,
  Box
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "../../api"; // Adjust path
import { useParams, useNavigate } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export default function CustomerForm({ mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    contact_name: "",
    email: "",
    associated_by: "",
    zoho_notes: "",
    address: "",
    system_notes: "",
    type: "sender",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [contacts, setContacts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    setUsers([{ id: "1", name: "Admin" }, { id: "2", name: "Manager" }, { id: "3", name: "Staff" },]);
  }, [id, mode]);

  // Other useEffect for fetchCustomer (unchanged, omitting documents)
  useEffect(() => {
    if (mode === 'edit' && id) {
      const fetchCustomer = async () => {
        try {
          const res = await api.get(`/api/customers/${id}`);
          console.log('Customer data:', res.data);
          const c = res.data;
          setForm({
            contact_name: c.contact_name || '',
            email: c.email || '',
            associated_by: c.associated_by || '',
            zoho_notes: c.zoho_notes || '',
            address: c.address || '',
            system_notes: c.system_notes || '',
            type: c.type || 'sender',
          });
          setContacts(
            (c.contact_persons || []).map((cp) => ({
              id: cp.id || cp.contact_person_id,
              name: cp.name || `${cp.first_name || ''} ${cp.last_name || ''}`.trim(),
              phone: cp.phone || '',
              email: cp.email || '',
              isNew: false,
            }))
          );
          setDocuments(
            (c.documents || []).filter(doc => doc.document_id && typeof doc.document_id === 'string')
          );
        } catch (err) {
          console.error('Failed to fetch customer:', err);
          showToast('Failed to fetch customer data', 'error');
        }
      };
      fetchCustomer();
    }
  }, [id, mode]);
  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddContact = () => {
    setContacts((prev) => [
      ...prev,
      {
        id: uuidv4(),
        name: "",
        phone: "",
        email: "",
        isNew: true,
      },
    ]);
  };

  const handleSaveContacts = async () => {
    try {
      if (!id) {
        showToast("Cannot save contacts: Customer ID is missing", "error");
        return;
      }
      if (contacts.length === 0) {
        showToast("No contacts to save", "warning");
        return;
      }
      if (contacts.some((c) => !c.name)) {
        showToast("All contacts must have a name", "error");
        return;
      }
      console.log("Saving contacts:", { zoho_id: id, contacts });
      const res = await api.post(`/api/customers/${id}/contacts`, { zoho_id: id, contacts });
      setContacts(
        res.data.map((cp) => ({
          id: cp.id || cp.contact_person_id,
          name: cp.name || `${cp.first_name || ''} ${cp.last_name || ''}`.trim(),
          phone: cp.phone || "",
          email: cp.email || "",
          isNew: false,
        }))
      );
      showToast("Contacts saved successfully!", "success");
    } catch (err) {
      console.error("Failed to save contacts:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      if (err.response?.data?.error.includes("trial account restrictions")) {
        showToast(
          "Contact person creation is disabled due to Zoho Books trial restrictions. Please create contacts manually in Zoho Books.",
          "error"
        );
      } else {
        showToast(
          err.response?.data?.error || "Failed to save contacts",
          "error"
        );
      }
    }
  };
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToast("File size must be less than 5MB", "error");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      // Create a new File object to avoid mutations
      const fileCopy = new File([selectedFile], selectedFile.name, { type: selectedFile.type });
      console.log("File selected:", {
        name: fileCopy.name,
        size: fileCopy.size,
        type: fileCopy.type,
        isFile: fileCopy instanceof File,
      });
      setFile(fileCopy);
    } else {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("No file selected", "warning");
    }
  };

  const handleAddDocument = async () => {
    if (!id) {
      showToast('Cannot upload document: Customer ID is missing', 'error');
      return;
    }
    if (!file || !(file instanceof File)) {
      console.error('Invalid file state:', file);
      showToast('Please select a valid file to upload', 'error');
      return;
    }

    console.log('File before FormData append:', {
      name: file.name,
      size: file.size,
      type: file.type,
      isFile: file instanceof File,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('zoho_id', id);

      console.log('FormData fields:', [...formData.entries()].map(([key, value]) => ({ key, value: value.name || value })));
      console.log('Current documents state:', documents);

      const res = await api.post(`/api/customers/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Document upload response:', res.data);

      if (!res.data.document_id) {
        console.error('Response missing document_id:', res.data);
        showToast('Invalid document response from server', 'error');
        return;
      }

      setDocuments((prev) => {
        const validDocs = prev.filter((doc) => doc.document_id && typeof doc.document_id === 'string');
        const existingIds = new Set(validDocs.map((doc) => doc.document_id));
        if (existingIds.has(res.data.document_id)) {
          console.error('Duplicate document ID:', res.data.document_id);
          showToast('Document with this ID already exists', 'error');
          return validDocs;
        }
        const updatedDocs = [...validDocs, res.data];
        console.log('Updated documents state:', updatedDocs);
        return updatedDocs;
      });

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('Document uploaded successfully!', 'success');
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      showToast(
        err.response?.data?.error || 'Failed to upload document',
        'error'
      );
    }
  };

  const handleDeleteDocument = async (document_id) => {
    try {
      await api.delete(`/api/customers/${id}/documents/${document_id}`);
      setDocuments((prev) => prev.filter((doc) => doc.document_id !== document_id));
      showToast('Document deleted successfully!', 'success');
    } catch (err) {
      console.error('Delete document error:', err.response?.data || err.message);
      showToast(
        err.response?.data?.error || 'Failed to delete document',
        'error'
      );
    }
  };
  const handleDeleteContact = async (contactId, isNew) => {
    if (!contactId) {
      console.warn("Contact has no ID, skipping delete");
      return;
    }
    if (isNew) {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      showToast("Contact removed", "success");
      return;
    }
    try {
      await api.delete(`/api/customers/${id}/contacts/${contactId}`);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      showToast("Contact deleted", "success");
    } catch (err) {
      console.error("Failed to delete contact:", err);
      showToast("Failed to delete contact", "error");
    }
  };


  const handleSaveCustomer = async () => {
    if (!form.contact_name || !form.email) {
      showToast("Customer name and email are required", "error");
      return;
    }
    try {
      if (mode === "edit") {
        await api.put(`/api/customers/${id}`, form);
        showToast("Customer updated successfully!", "success");
      } else {
        const res = await api.post("/api/customers", form);
        console.log("New customer created:", res.data);
        navigate(`/customers/${res.data.zoho_id}/edit`);
        showToast("Customer created successfully!", "success");
      }
    } catch (err) {
      console.error("Save failed:", err);
      showToast("Failed to save customer", "error");
    }
  };

  const docColumns = [
    {
      field: 'file_name',
      headerName: 'File Name',
      flex: 1,
      renderCell: (params) => (
        <a
          href={`/api/customers/${id}/documents/${params.row.document_id}/download`}
          download={params.value}
          style={{ color: '#1976d2', textDecoration: 'underline', cursor: 'pointer' }}
        >
          {params.value}
        </a>
      ),
    },
    { field: 'file_type', headerName: 'File Type', flex: 1 },
    { field: 'file_size_formatted', headerName: 'Size', flex: 1 },
    { field: 'uploaded_on_date_formatted', headerName: 'Uploaded On', flex: 1 },
    { field: 'uploaded_by', headerName: 'Uploaded By', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <IconButton
          color="error"
          onClick={() => handleDeleteDocument(params.row.document_id)}
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];
  return (
    <Paper sx={{ p: 3 }}>
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
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Grid
          container
          flexDirection="row"
          mb={5}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="h4" fontWeight="bold" mt={0}>
            Customer Info
          </Typography>
        </Grid>
            <Box sx={{ display: "flex", gap: 2 }}>

            <TextField
              fullWidth
              required
              label="Customer Name"
              name="contact_name"
              value={form.contact_name}
              onChange={handleChange}
              error={!form.contact_name}
              helperText={!form.contact_name ? "Customer name is required" : ""}
            />

            <TextField
              fullWidth
              required
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={!form.email}
              helperText={!form.email ? "Email is required" : ""}
            />

</Box>
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}> 
            <FormControl fullWidth>
              <InputLabel id="associated_by-label">Associated By</InputLabel>
              <Select
label="Associated By"
                labelId="associated_by-label"
                name="associated_by"
                value={form.associated_by}
                onChange={handleChange}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

  
 


            <TextField
              fullWidth
              label="Zoho Notes"
              name="zoho_notes"
              value={form.zoho_notes}
              onChange={handleChange}
            />
 
      
</Box>
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}> 

            <TextField
              fullWidth
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              label="System Notes"
              name="system_notes"
              value={form.system_notes}
              onChange={handleChange}
            />
      
</Box>
        <Grid item xs={12}>
          <RadioGroup row name="type" value={form.type} onChange={handleChange}>
            <FormControlLabel value="sender" control={<Radio />} label="Only Sender" />
            <FormControlLabel value="receiver" control={<Radio />} label="Only Receiver" />
            <FormControlLabel value="both" control={<Radio />} label="Sender or Receiver" />
          </RadioGroup>
        </Grid>
        <Button
          variant="contained"
          sx={{ bgcolor: "#f58220", color: "#fff", mt: 2 }}
          onClick={handleSaveCustomer}
        >
          {mode === "edit" ? "Update" : "Add"} Customer
        </Button>
      </Paper>
      {mode === "edit" && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <CardContent sx={{ mt: 0, p: 0 }}>
            <Typography variant="h5" fontWeight="bold" mb={2}>
              Contacts
            </Typography>
            {contacts.map((contact, index) => (
              <Paper
                key={contact.id}
                sx={{ p: 2, mb: 2, display: "flex", alignItems: "center" }}
                elevation={2}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={contact.name || ""}
                      onChange={(e) =>
                        setContacts((prev) =>
                          prev.map((c, i) =>
                            i === index ? { ...c, name: e.target.value } : c
                          )
                        )
                      }
                      error={!contact.name}
                      helperText={!contact.name ? "Name is required" : ""}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={contact.phone || ""}
                      onChange={(e) =>
                        setContacts((prev) =>
                          prev.map((c, i) =>
                            i === index ? { ...c, phone: e.target.value } : c
                          )
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={contact.email || ""}
                      onChange={(e) =>
                        setContacts((prev) =>
                          prev.map((c, i) =>
                            i === index ? { ...c, email: e.target.value } : c
                          )
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteContact(contact.id, contact.isNew)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Grid
              container
              flexDirection="row"
              mb={2}
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
            >
              <Button
                variant="contained"
                sx={{ bgcolor: "#f58220", color: "#fff" }}
                onClick={handleSaveContacts}
              >
                Save Contacts
              </Button>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddContact}
                variant="outlined"
                color="primary"
              >
                Add Contact
              </Button>
            </Grid>
          </CardContent>


          <div style={{ height: 250, width: "100%" }}>
            <DataGrid
              rows={documents}
              getRowId={(row) => row.document_id}
              columns={docColumns}
              hideFooter
            />
          </div>
          <Grid
            container
            flexDirection="row"
            mt={2}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            {/* <Typography variant="h5" fontWeight="bold">
              Documents
            </Typography> */}
            <Button
              variant="contained"
              sx={{ bgcolor: "#f58220", color: "#fff" }}
              onClick={handleAddDocument}
              disabled={!file || !(file instanceof File)}
            >
              Upload Document
            </Button>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              component="label"
              color="primary"
            >
              Select File
              <input
                type="file"
                name="file"
                hidden
                accept=".pdf,.doc,.docx,.jpg,.png"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </Button>

          </Grid>
          
        </Paper>
      )}
    </Paper>
  );
}