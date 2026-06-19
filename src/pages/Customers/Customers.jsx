import { useContext } from "react";
import CrudPage from "../../components/CrudPage";
import { AppContext } from "../../context/AppContext";
import { api } from "../../api";
import axios from "axios";

export default function Customers() {
  const { customers, customersLoading, setCustomers, refreshCustomers } =
    useContext(AppContext);

  const handleDelete = async (zohoId) => {
    await api.delete(`/api/customers/${zohoId}`);
    setCustomers((prev) => prev.filter((c) => c.zoho_id !== zohoId));
  };

  const handleReloadZoho = async () => {
    await axios.get(
      "https://consolidate.onrender.com/api/customerPanals?search=All&limit=5000&",
    );
    await refreshCustomers();
  };

  return (
    <CrudPage
      title="Customers"
      rows={customers}
      loading={customersLoading}
      onDelete={handleDelete}
      onReloadZoho={handleReloadZoho}
      columns={[
        { key: "zoho_id", label: "Zoho ID" },
        { key: "email", label: "Email" },
        { key: "contact_name", label: "Company" },
        { key: "created_by", label: "Created By" },
        { key: "modified_by", label: "Modified By" },
        { key: "status", label: "Status" },
      ]}
      formFields={[
        { key: "Full_Name", label: "Full Name" },
        { key: "Email", label: "Email" },
        { key: "Mobile", label: "Mobile" },
      ]}
    />
  );
}
