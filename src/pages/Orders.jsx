import { useEffect, useState } from "react";
import { api } from "../api";
import CrudPage from "../components/CrudPage";

export default function Orders() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => {
    api.get("/api/customers").then(r => setCustomers(r.data));
  }, []);
  const customerOptions = customers.map(c => ({ value: c.id, label: `${c.id} - ${c.name}` }));

  return (
    <CrudPage
      title="Orders"
      endpoint="/api/orders"
      columns={[
        { key: "id", label: "ID" },
        { key: "customer_id", label: "Customer ID" },
        { key: "order_date", label: "Order Date" },
        { key: "status", label: "Status" },
        { key: "total", label: "Total" },
      ]}
      formFields={[
        { key: "customer_id", label: "Customer", select: true, options: customerOptions },
        { key: "order_date", label: "Order Date", type: "date" },
        { key: "status", label: "Status" },
        { key: "total", label: "Total", type: "number" },
      ]}
    />
  );
}
