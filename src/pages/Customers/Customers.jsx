import CrudPage from "../../components/CrudPage";

export default function Customers() {
  return (
  <CrudPage
  title="Customers"
  endpoint="/api/customers?search=All&limit=10000"
  columns={[
    { key: "zoho_id", label: "Zoho ID" },
    // { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    // { key: "phone", label: "Phone" },
    // { key: "mobile", label: "Mobile" },
    // { key: "title", label: "Title" },
    // { key: "department", label: "Department" },
    // { key: "lead_source", label: "Lead Source" },
    { key: "contact_name", label: "Company" },
    // { key: "mailing_city", label: "City" },
    // { key: "mailing_country", label: "Country" },
    { key: "created_by", label: "Created By" },
    { key: "modified_by", label: "Modified By" },
       { key: "status", label: "Status" },
  ]}

      formFields={[
        { key: "Full_Name", label: "Full Name" },
        { key: "Email", label: "Email" },
        // { key: "Phone", label: "Phone" },
        { key: "Mobile", label: "Mobile" },
   
      ]}
    />
  );
}
