import { useEffect, useState } from "react";
import { api } from "../../api";
import CrudPage from "../../components/CrudPage";

export default function Consignments() {
  const [orders, setOrders] = useState([]);
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    api.get("/api/orders").then(r => setOrders(r.data));
    api.get("/api/containers").then(r => setContainers(r.data));
  }, []);

  const orderOpts = orders.map(o => ({ value: o.id, label: `Order #${o.id}` }));
  const containerOpts = containers.map(c => ({ value: c.id, label: c.container_number }));

  return (
    <CrudPage
      title="Consignments"
      endpoint="/api/consignments"
      columns={[
        { key: "zoho_id", label: "ID" },
        { key: "order_id", label: "Order ID" },
        { key: "container_id", label: "Container ID" },
        { key: "shipment_date", label: "Shipment Date" },
        { key: "status", label: "Status" },
      ]}
      formFields={[
        { key: "order_id", label: "Order", select: true, options: orderOpts },
        { key: "container_id", label: "Container", select: true, options: containerOpts },
        { key: "shipment_date", label: "Shipment Date", type: "date" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
