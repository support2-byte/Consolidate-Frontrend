import CrudPage from "../../components/CrudPage";

export default function Vendors() {
  return (
  <CrudPage
  title="Customers"
  endpoint="/api/customers"
  columns={[
    { key: "zoho_id", label: "Zoho ID" },
    // { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    // { key: "phone", label: "Phone" },
    // { key: "mobile", label: "Mobile" },
    // { key: "title", label: "Title" },
    // { key: "department", label: "Department" },
    // { key: "lead_source", label: "Lead Source" },
    { key: "account_name", label: "Company" },
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
        // { key: "Title", label: "Job Title" },
        // { key: "Department", label: "Department" },
        // { key: "Lead_Source", label: "Lead Source" },
        // { key: "Account_Name", label: "Company" },
        // { key: "Owner", label: "Owner" },
        // { key: "Mailing_Street", label: "Street" },
        // { key: "Mailing_City", label: "City" },
        // { key: "Mailing_State", label: "State" },
        // { key: "Mailing_Zip", label: "Zip" },
        // { key: "Mailing_Country", label: "Country" },
      ]}
    />
  );
}
