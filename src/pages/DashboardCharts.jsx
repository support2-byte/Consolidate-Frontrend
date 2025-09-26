// src/pages/Dashboard.jsx
import React from "react";
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useThemeContext } from "../context/ThemeContext";

// === DATASETS ===
const salesSummary = [
  { title: "$1K", subtitle: "Customers", change: "+15%", color: "#ff69b4" },
  { title: "300", subtitle: "Vendors", change: "+10%", color: "#ffa500" },
  { title: "5", subtitle: "Containers", change: "-2%", color: "#90ee90" },
  { title: "8", subtitle: "Orders", change: "+6%", color: "#dda0dd" },
];

const visitorInsightsData = [
  { month: "Jan", legal: 4000, new: 2400, unique: 2400 },
  { month: "Feb", legal: 3000, new: 1398, unique: 2210 },
  { month: "Mar", legal: 2000, new: 9800, unique: 2290 },
  { month: "Apr", legal: 2780, new: 3908, unique: 2000 },
  { month: "May", legal: 1890, new: 4800, unique: 2181 },
  { month: "Jun", legal: 2390, new: 3800, unique: 2500 },
  { month: "Jul", legal: 3490, new: 4300, unique: 2100 },
];

const revenueData = [
  { day: "Mon", online: 300, offline: 200 },
  { day: "Tue", online: 400, offline: 250 },
  { day: "Wed", online: 350, offline: 220 },
  { day: "Thu", online: 450, offline: 300 },
  { day: "Fri", online: 500, offline: 350 },
  { day: "Sat", online: 600, offline: 400 },
  { day: "Sun", online: 550, offline: 380 },
];

const satisfactionData = [
  { month: "Jan", satisfaction: 80 },
  { month: "Feb", satisfaction: 85 },
  { month: "Mar", satisfaction: 90 },
  { month: "Apr", satisfaction: 88 },
  { month: "May", satisfaction: 92 },
  { month: "Jun", satisfaction: 95 },
];

const targetRealityData = [
  { month: "Jan", actual: 8500, target: 10000 },
  { month: "Feb", actual: 11000, target: 12000 },
  { month: "Mar", actual: 14500, target: 15000 },
  { month: "Apr", actual: 12500, target: 13000 },
  { month: "May", actual: 17500, target: 18000 },
  { month: "Jun", actual: 15500, target: 16000 },
];

export default function Dashboard() {
  const { mode } = useThemeContext();

  const bg = mode === "dark" ? "#1a202c" : "#f7fafc";
  const cardBg = mode === "dark" ? "rgba(26, 32, 44, 0.95)" : "rgba(255, 255, 255, 0.98)";
  const textColor = mode === "dark" ? "#e2e8f0" : "#2d3748";
  const gridColor = mode === "dark" ? "#4a5568" : "#edf2f7";
  const axisColor = mode === "dark" ? "#a0aec0" : "#718096";
  const borderColor = mode === "dark" ? "#2d3748" : "#e2e8f0";
  const titleColor = mode === "dark" ? "#a0aec0" : "#4a5568";
  const visitorColors = ["#9b59b6", "#e74c3c", "#27ae60"];

  return (
    <div style={{ 
      padding: "20px", 
      background: bg, 
      minHeight: "100vh", 
      color: textColor,
      fontFamily: "'Roboto', sans-serif",
      fontSize: "14px"
    }}>
      <h1 style={{ 
        marginBottom: "20px", 
        fontSize: "24px", 
        fontWeight: 700, 
        color: titleColor,
        display: "flex", 
        alignItems: "center",
        textShadow: mode === "dark" ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "0 1px 2px rgba(0, 0, 0, 0.1)"
      }}>
        <span style={{ marginRight: "8px" }}>📊</span> Sales Dashboard
      </h1>
      
      {/* Top Row: Today's Sales & Visitor Insights */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "2fr 1fr", 
        gap: "20px", 
        marginBottom: "20px" 
      }}>
        {/* Today's Sales Summary */}
        <div style={{ 
          background: cardBg, 
          borderRadius: "8px", 
          padding: "16px", 
          border: `1px solid ${borderColor}`,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(5px)"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "12px" 
          }}>
            <h3 style={{ 
              color: textColor, 
              margin: 0, 
              fontSize: "16px", 
              fontWeight: 600 
            }}>Today's Sales</h3>
            <button style={{ 
              background: "transparent", 
              border: `1px solid ${borderColor}`, 
              color: textColor, 
              padding: "6px 12px", 
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              transition: "background 0.3s"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = mode === "dark" ? "#2d3748" : "#edf2f7"}
            onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
            >Export</button>
          </div>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: "12px" 
          }}>
            {salesSummary.map((item, index) => (
              <div key={index} style={{ 
                background: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : item.color + "20",
                borderRadius: "6px", 
                padding: "12px", 
               height:160,
                border: `1px solid ${item.color}40`,
                transition: "transform 0.2s"
              }}
              onMouseOver={(e) => e.target.style.transform = "scale(1.02)"}
              onMouseOut={(e) => e.target.style.transform = "scale(1)"}
              >
                <div style={{ 
                  fontSize: "18px", 
                  fontWeight: 600, 
                  color: item.color, 
                  marginBottom: "4px" 
                }}>
                  {item.title}
                </div>
                <div style={{ 
           fontSize: "18px", 
                  fontWeight: 600,
                  color: axisColor, 
                  marginBottom: "4px" 
                }}>
                  {item.subtitle}
                </div>
                <div style={{ 
                  fontSize: "12px", 
                  color: item.change.startsWith("+") ? "#27ae60" : "#e74c3c" 
                }}>
                  {item.change} from yesterday
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visitor Insights */}
        <div style={{ 
          background: cardBg, 
          borderRadius: "8px", 
          padding: "16px", 
          border: `1px solid ${borderColor}`,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(5px)"
        }}>
          <h3 style={{ 
            color: textColor, 
            margin: "0 0 12px 0", 
            fontSize: "16px", 
            fontWeight: 600 
          }}>Vis Insights</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={visitorInsightsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" stroke={axisColor} fontSize="12px" />
              <YAxis stroke={axisColor} fontSize="12px" />
              <Tooltip contentStyle={{ background: cardBg, color: textColor, border: `1px solid ${borderColor}` }} />
              <Legend wrapperStyle={{ fontSize: "12px", color: textColor, marginTop: "8px" }} />
              <Line type="monotone" dataKey="legal" stroke={visitorColors[0]} strokeWidth={2} />
              <Line type="monotone" dataKey="new" stroke={visitorColors[1]} strokeWidth={2} />
              <Line type="monotone" dataKey="unique" stroke={visitorColors[2]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Total Revenue, Customer Satisfaction, Target vs Reality */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr 1fr", 
        gap: "20px" 
      }}>
        {/* Total Revenue */}
        <div style={{ 
          background: cardBg, 
          borderRadius: "8px", 
          padding: "16px", 
          border: `1px solid ${borderColor}`,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(5px)"
        }}>
          <h3 style={{ 
            color: textColor, 
            margin: "0 0 12px 0", 
            fontSize: "16px", 
            fontWeight: 600 
          }}>Total Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="day" stroke={axisColor} fontSize="12px" />
              <YAxis stroke={axisColor} fontSize="12px" />
              <Tooltip contentStyle={{ background: cardBg, color: textColor, border: `1px solid ${borderColor}` }} />
              <Legend wrapperStyle={{ fontSize: "12px", color: textColor, marginTop: "8px" }} />
              <Bar dataKey="online" fill="#3498db" barSize={20} />
              <Bar dataKey="offline" fill="#2ecc71" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
            <div>
              <div style={{ fontSize: "12px", color: axisColor }}>Online Sales</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#3498db" }}>$3,204</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: axisColor }}>Offline Sales</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#2ecc71" }}>$4,504</div>
            </div>
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div style={{ 
          background: cardBg, 
          borderRadius: "8px", 
          padding: "16px", 
          border: `1px solid ${borderColor}`,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(5px)"
        }}>
          <h3 style={{ 
            color: textColor, 
            margin: "0 0 12px 0", 
            fontSize: "16px", 
            fontWeight: 600 
          }}>Customer Satisfaction</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={satisfactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" stroke={axisColor} fontSize="12px" />
              <YAxis stroke={axisColor} fontSize="12px" />
              <Tooltip contentStyle={{ background: cardBg, color: textColor, border: `1px solid ${borderColor}` }} />
              <Area type="monotone" dataKey="satisfaction" stroke="#3498db" fill="#3498db33" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <div style={{ fontSize: "12px", color: axisColor }}>Last Month</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#3498db" }}>93%</div>
          </div>
        </div>

        {/* Target vs Reality */}
        <div style={{ 
          background: cardBg, 
          borderRadius: "8px", 
          padding: "16px", 
          border: `1px solid ${borderColor}`,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(5px)"
        }}>
          <h3 style={{ 
            color: textColor, 
            margin: "0 0 12px 0", 
            fontSize: "16px", 
            fontWeight: 600 
          }}>Target vs Reality</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={targetRealityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" stroke={axisColor} fontSize="12px" />
              <YAxis stroke={axisColor} fontSize="12px" />
              <Tooltip contentStyle={{ background: cardBg, color: textColor, border: `1px solid ${borderColor}` }} />
              <Legend wrapperStyle={{ fontSize: "12px", color: textColor, marginTop: "8px" }} />
              <Bar dataKey="actual" fill="#f1c40f" barSize={20} />
              <Bar dataKey="target" fill="#e67e22" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
            <div>
              <div style={{ fontSize: "12px", color: axisColor }}>Actual Sales</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#f1c40f" }}>$8,823</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: axisColor }}>Target Sales</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#e67e22" }}>$10,222</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}