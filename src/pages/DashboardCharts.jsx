// src/pages/Dashboard.jsx
import React from "react";
import {
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

// === DATASETS ===
const shipmentsData = [
  { month: "Jan", shipments: 120 },
  { month: "Feb", shipments: 150 },
  { month: "Mar", shipments: 180 },
  { month: "Apr", shipments: 140 },
  { month: "May", shipments: 200 },
  { month: "Jun", shipments: 250 },
];

const revenueCostData = [
  { month: "Jan", revenue: 50000, cost: 30000 },
  { month: "Feb", revenue: 60000, cost: 35000 },
  { month: "Mar", revenue: 80000, cost: 45000 },
  { month: "Apr", revenue: 70000, cost: 40000 },
];

const shipmentStatusData = [
  { name: "Delivered", value: 400 },
  { name: "In Transit", value: 250 },
  { name: "Delayed", value: 50 },
];
const STATUS_COLORS = ["#42a5f5", "#0dcaf0", "rgb(42, 245, 152)"];

const containerData = [
  { month: "Jan", full: 300, empty: 50 },
  { month: "Feb", full: 280, empty: 70 },
  { month: "Mar", full: 320, empty: 40 },
  { month: "Apr", full: 310, empty: 60 },
];

const vendorData = [
  { metric: "On-time Delivery", VendorA: 90, VendorB: 70 },
  { metric: "Customer Satisfaction", VendorA: 85, VendorB: 65 },
  { metric: "Cost Efficiency", VendorA: 75, VendorB: 80 },
  { metric: "Coverage", VendorA: 95, VendorB: 60 },
];

export default function Dashboard() {
  return (
    <div style={{ padding: "20px", background: "#0d1117", minHeight: "100vh", color: "#fff" }}>
      <h1 style={{ marginBottom: "20px" }}>📊 Logistics Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>

        {/* 1️⃣ Monthly Shipments */}
        <div style={{ background: "#161b22", borderRadius: "10px", padding: "15px" }}>
          <h3>Monthly Shipments</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={shipmentsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="month" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="shipments" stroke="#4dabf7" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 2️⃣ Revenue vs Cost */}
        <div style={{ background: "#161b22", borderRadius: "10px", padding: "15px" }}>
          <h3>Revenue vs Cost</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueCostData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="month" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#0dcaf0" fill="#0dcaf0" />
              <Area type="monotone" dataKey="cost" stackId="1" stroke="#d32f2f" fill="rgb(42, 245, 152)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 3️⃣ Shipment Status */}
        <div style={{ background: "#161b22", borderRadius: "10px", padding: "15px" }}>
          <h3>Shipment Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={shipmentStatusData} cx="50%" cy="50%" outerRadius={90} fill="#8884d8" dataKey="value" label>
                {shipmentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 4️⃣ Container Utilization */}
        <div style={{ background: "#161b22", borderRadius: "10px", padding: "15px" }}>
          <h3>Container Utilization</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={containerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="month" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Legend />
              <Bar dataKey="full" fill="#42a5f5" />
              <Bar dataKey="empty" fill="#9e9e9e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 5️⃣ Vendor Performance */}
        <div style={{ gridColumn: "span 2", background: "#161b22", borderRadius: "10px", padding: "15px" }}>
          <h3>Vendor Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart outerRadius={100} data={vendorData}>
              <PolarGrid stroke="#444" />
              <PolarAngleAxis dataKey="metric" stroke="#ccc" />
              <PolarRadiusAxis stroke="#ccc" />
              <Radar name="Vendor A" dataKey="VendorA" stroke="#2e7d32" fill="#66bb6a" fillOpacity={0.6} />
              <Radar name="Vendor B" dataKey="VendorB" stroke="#0288d1" fill="#4fc3f7" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
