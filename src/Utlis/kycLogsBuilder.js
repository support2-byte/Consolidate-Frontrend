import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import { BRAND } from "../constants/containers";
import { loadImageAsBase64, pdfAddFooters } from "./containerBuilder"; // adjust path to wherever these live

applyPlugin(jsPDF);

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
};

export const pdfKycLogsHeader = async (
  doc,
  { totalRecords, pageWidth, margin },
) => {
  const { teal, orange } = BRAND;
  const logoBase64 = await loadImageAsBase64("./logo-2.png");
  if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 5, 55, 12);

  doc
    .setFont("helvetica", "bold")
    .setFontSize(10)
    .setTextColor(...orange);
  doc.text("Activity Report", pageWidth - margin, 8, { align: "right" });

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(60, 60, 60);
  [
    `Total Records: ${totalRecords}`,
    `Generated: ${new Date().toLocaleString()}`,
  ].forEach((line, i) =>
    doc.text(line, pageWidth - margin, 13 + i * 4, { align: "right" }),
  );

  doc
    .setFont("helvetica", "bold")
    .setFontSize(13)
    .setTextColor(...teal);
  doc.text("ROYAL GULF SHIPPING & LOGISTICS LLC", margin, 24);
  doc
    .setFont("helvetica", "normal")
    .setFontSize(7.5)
    .setTextColor(120, 120, 120);
  doc.text("Dubai • London • Karachi • Shenzhen", margin, 27.5);

  doc
    .setFont("helvetica", "bold")
    .setFontSize(14)
    .setTextColor(...teal);
  doc.text("KYC ACTIVITY LOG REPORT", margin, 36);
  doc
    .setDrawColor(...teal)
    .setLineWidth(0.6)
    .line(margin, 39, pageWidth - margin, 39);

  return 42;
};

export const generateKycLogsPDF = async (logs) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  const startY = await pdfKycLogsHeader(doc, {
    totalRecords: logs.length,
    pageWidth,
    margin,
  });

  const head = [
    [
      "#",
      "Customer Ref",
      "Name",
      "Email",
      "IP Address",
      "Location",
      "Browser",
      "Created At",
    ],
  ];

  const body = logs.map((log, index) => [
    index + 1,
    log.customer_ref || "N/A",
    log.submitted_name || "N/A",
    log.submitted_email || "N/A",
    log.ip_address || "N/A",
    log.location || "N/A",
    log.browser || "N/A",
    formatDate(log.created_at),
  ]);

  doc.autoTable({
    head,
    body,
    startY,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineWidth: 0.2,
      lineColor: BRAND.borderGrey,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [50, 50, 50],
      fontStyle: "bold",
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: BRAND.borderGrey,
    },
    bodyStyles: { fillColor: [255, 255, 255] },
    tableLineWidth: 0.2,
    tableLineColor: BRAND.borderGrey,
  });

  pdfAddFooters(doc, pageWidth, margin, "KYC Activity Logs");

  const filename = `KYC_Activity_Logs_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
