import CrudPage from "../components/CrudPage";
export default function Containers() {
  return (
    <CrudPage
      title="Containers"
      endpoint="/api/containers"
      columns={[
        { key: "id", label: "ID" },
        { key: "container_number", label: "Container No." },
        { key: "type", label: "Type" },
        { key: "status", label: "Status" },
      ]}
      formFields={[
        { key: "container_number", label: "Container No." },
        { key: "type", label: "Type" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
