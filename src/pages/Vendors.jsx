import CrudPage from "../components/CrudPage";
export default function Vendors() {
  return (
    <CrudPage
      title="Vendors"
      endpoint="/api/vendors"
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "contact_person", label: "Contact Person" },
        { key: "phone", label: "Phone" },
      ]}
      formFields={[
        { key: "name", label: "Name" },
        { key: "contact_person", label: "Contact Person" },
        { key: "phone", label: "Phone" },
      ]}
    />
  );
}
