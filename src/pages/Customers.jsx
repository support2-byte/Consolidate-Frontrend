import CrudPage from "../components/CrudPage";
export default function Customers() {
  return (
    <CrudPage
      title="Customers"
      endpoint="/api/customers"
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
      ]}
      formFields={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
      ]}
    />
  );
}
