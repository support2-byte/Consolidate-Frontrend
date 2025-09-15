import React, { useState, useEffect } from "react";
import {
  TextField,
  Select, MenuItem,
  FormControl, InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Grid,
  Paper,
  Typography,
  Card,
  IconButton,
  CardContent
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "../../api";
import { useParams, useNavigate } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Add, Delete } from "@mui/icons-material";
export default function VendorsForm({ mode = "add", }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    name: "",
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
  const showToast = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };
  // Load customer if edit mode
  useEffect(() => {
    setUsers([ { id: "1", name: "Admin" }, { id: "2", name: "Manager" }, { id: "3", name: "Staff" }, ]);
    console.log("Mode:", mode, "Customer ID:", id);
    if (mode === "edit" && id) {
      console.log("Loading customer:", id);
      api.get(`/api/customers/${id}`).then((res) => {
        console.log("Customer data:", res.data);

        const c = res.data;
        setForm({
          name: c.account_name || "",
          email: c.email || "",
          associated_by: c.associated_by || "",
          zoho_notes: c.zoho_notes || "",
          address: c.address || "",
          system_notes: c.system_notes || "",
          type: c.type || "sender",
        });
        setContacts(c.contacts || []);
        setDocuments(c.documents || []);
      });
    }
  }, [mode, id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  const handleAddContact = () => {
    setContacts((prev) => [
      ...prev,
      {
        id: uuidv4(), // temporary ID
        name: "",
        phone: "",
        email: "",
        designation: "",
        isNew: true
      }
    ]);
  };


  // 📝 Update a field
  const handleChangeContact = (id, field, value) => {
    console.log("Update contact:", id, field, value);
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveContacts = async () => {
    try {
      const res = await api.post(`/api/customers/${id}/contacts`, contacts);
      const saved = Array.isArray(res.data) ? res.data : [res.data];

      // Important: refresh local state with DB rows (have proper UUID ids now)
      setContacts(saved);
      showToast("Contacts saved successfully!", "success");
    } catch (err) {
      console.error("Failed to save contacts:", err);
      showToast("Failed to save contacts", "error");
    }
  };


  const handleDeleteContact = async (contactId, isNew) => {
    if (!contactId) {
      console.warn("Contact has no ID, skipping delete");
      return;
    }

    if (isNew) {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
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


  // Save or update customer
  const handleSaveCustomer = async () => {
    try {
      if (mode === "edit") {
        await api.put(`/api/customers/${id}`, form);
        showToast("Customer updated successfully!", "success");
      } else {
        const res = await api.post("/api/customers", form);
        console.log("New customer created:", res.data);
        showToast("Customer created successfully!", "success");
      }
    } catch (err) {
      console.error("Save failed:", err);
      showToast("Failed to save customer", "error");
    }
  };




  // Add document (file upload)
  const handleAddDocument = async (e) => {
    console.log("File selected:", e?.target?.files);
    const file = e?.target?.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await api.post(
          `/api/customers/${id}/documents`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setDocuments([...documents, res.data]);
        showToast("Document uploaded!", "success");
      } catch (err) {
        console.error("Failed to upload document:", err);
        showToast("File upload failed", "error");
      }
    }
  };

  // const contactColumns = [
  //   {
  //     field: "name",
  //     headerName: "Name",
  //     flex: 1,
  //     renderCell: (params) => (
  //       <TextField
  //         variant="standard"
  //         value={params.row.name}
  //         onChange={(e) =>
  //           handleUpdateContact(params.row.id, "name", e.target.value)
  //         }
  //       />
  //     ),
  //   },
  //   {
  //     field: "phone",
  //     headerName: "Phone",
  //     flex: 1,
  //     renderCell: (params) => (
  //       <TextField
  //         variant="standard"
  //         value={params.row.phone}
  //         onChange={(e) =>
  //           handleUpdateContact(params.row.id, "phone", e.target.value)
  //         }
  //       />
  //     ),
  //   },
  //   {
  //     field: "email",
  //     headerName: "Email",
  //     flex: 1,
  //     renderCell: (params) => (
  //       <TextField
  //         variant="standard"
  //         value={params.row.email}
  //         onChange={(e) =>
  //           handleUpdateContact(params.row.id, "email", e.target.value)
  //         }
  //       />
  //     ),
  //   },
  //   {
  //     field: "actions",
  //     headerName: "Actions",
  //     renderCell: (params) => (
  //       <Button
  //         color="error"
  //         onClick={() => handleDeleteContact(params.row.id)}
  //       >
  //         Delete
  //       </Button>
  //     ),
  //   },
  // ];
const docColumns = [
  {
    field: "filename",
    headerName: "Filename",
    flex: 1,
    renderCell: (params) => (
      <a
        href={params.row.filepath}
        download={params.value} // suggest filename for download
        style={{
          color: "#1976d2",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {params.value}
      </a>
    ),
  },
  { field: "filepath", headerName: "Path", flex: 1 },
  {
    field: "actions",
    headerName: "Actions",
    renderCell: (params) => (
      <IconButton
        color="error"
        onClick={() =>
          setDocuments((prev) => prev.filter((d) => d.id !== params.row.id))
        }
      >
        <DeleteIcon />
      </IconButton>
    ),
  },
];




  return (
    <Paper sx={{ p: 3 }}>
      {/* Snackbar for toast notifications */}
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
      <Grid container flexDirection={"row"} mb={5} justifyContent={"space-between"} alignItems={"center"} spacing={2}>
        <Typography variant="h4" fontWeight={"bold"} mt={0}>
          Customer Info
        </Typography>

      </Grid>
      <Grid container spacing={2} mb={2}>

        <Grid item xs={12} spacing={2} mb={2}>
          <TextField
            fullWidth
            required
            label="Customer Name"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
        </Grid>

        <Grid item mb={2} xs={12}>
          <TextField
            fullWidth
            required
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />
        </Grid>
        <Grid item style={{width:"25%"}} xs={12} md={6}>
       <FormControl fullWidth>
        <InputLabel id="associated_by-label">Associated By</InputLabel>
         <Select labelId="associated_by-label" value={form.associated_by} onChange={(e) => setForm({ ...form, associated_by: e.target.value })} >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name}
                </MenuItem>
              ))}
            </Select>
 </FormControl> 
        </Grid>
      </Grid>
      <Grid container spacing={2} p={0} mb={2}>


        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Zoho Notes"
            name="zoho_notes"
            value={form.zoho_notes}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Address"
            name="address"
            value={form.address}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={4}>
          <TextField
            fullWidth
            label="System Notes"
            name="system_notes"
            value={form.system_notes}
            onChange={handleChange}
          
          />
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <RadioGroup
          row
          name="type"
          value={form.type}
          onChange={handleChange}
        >
          <FormControlLabel value="sender" control={<Radio />} label="Only Sender" />
          <FormControlLabel value="receiver" control={<Radio />} label="Only Receiver" />
          <FormControlLabel value="both" control={<Radio />} label="Sender or Receiver" />
        </RadioGroup>
      </Grid>
      <Button variant="contained"  style={{ backgroundColor: "#f58220", color: "#fff" }} onClick={handleSaveCustomer}>
        {mode === "edit" ? "Update" : "Add"} Customer
      </Button>


      {/* Contacts */}

      <CardContent sx={{ mt: 3, p: 0 }}>
        <h2 className="text-xl font-bold mb-4">Contacts</h2>
        {contacts.map((contact, index) => (
          <Paper
            key={contact.id}
            sx={{ pb: 2, mb: 2, display: "flex", alignItems: "center" }}
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




        <Grid container flexDirection={"row"} mb={5} justifyContent={"space-between"} alignItems={"center"} spacing={2}>
       
          <Button
           style={{ backgroundColor: "#f58220", color: "#fff" }}
            variant="contained"
            color="primary"
            className="m-2"
            onClick={handleSaveContacts}
          >
            Save Contacts
          </Button>
             <Button
      
            startIcon={<Add />}
            onClick={handleAddContact}
            variant="outlined"
            color="primary"
            className="m-2"
          >
            Add 
          </Button>
</Grid>
      </CardContent>
      {/* </Card> */}
      {/* Documents */}
      <Grid container flexDirection={"row"} mb={0} justifyContent={"space-between"} alignItems={"center"} spacing={2}>
        <h2 className="text-xl font-bold mb-4">Documents</h2>
        <Button startIcon={<Add />} className="m-2" variant="outlined" component="label" sx={{ mb: 0 }}>
         Add
          <input type="file" hidden onChange={handleAddDocument} />
        </Button>
      </Grid>
      <div style={{ height: 250, width: "100%" }}>
        <DataGrid
          rows={documents}
          getRowId={(row) => row.id}
          columns={docColumns}
          hideFooter
        />
      </div>

    </Paper>
  );
}
