import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import { BRAND } from "../constants/containers";
import { loadImageAsBase64, pdfAddFooters } from "./containerBuilder";

applyPlugin(jsPDF);

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
};

const pdfApprovedKycHeader = async (
  doc,
  { totalRecords, pageWidth, margin, title = "APPROVED KYC REPORT" },
) => {
  const { teal, orange } = BRAND;
  const logoBase64 = await loadImageAsBase64("./logo-2.png");
  if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 5, 55, 12);

  doc
    .setFont("helvetica", "bold")
    .setFontSize(10)
    .setTextColor(...orange);
  doc.text("Approved KYC Report", pageWidth - margin, 8, { align: "right" });

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(60, 60, 60);
  [
    `Total Approved: ${totalRecords}`,
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
  doc.text(title, margin, 36);
  doc
    .setDrawColor(...teal)
    .setLineWidth(0.6)
    .line(margin, 39, pageWidth - margin, 39);

  return 42;
};

export const generateKycSubmissionsPDF = async (submissions) => {
  if (!submissions.length) return { empty: true };

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  const startY = await pdfApprovedKycHeader(doc, {
    totalRecords: submissions.length,
    pageWidth,
    margin,
  });

  const head = [
    [
      "#",
      "Name",
      "Email",
      "Phone",
      "Address",
      "Emirates ID",
      "Trade License",
      "Customer Ref",
      "Form ID",
      "Submitted At",
    ],
  ];

  const body = submissions.map((s, i) => [
    i + 1,
    s.contact_name || s.name || "N/A",
    s.email || "N/A",
    s.phone || s.customer_phone || "N/A",
    s.address || "N/A",
    s.emirates_id || "N/A",
    s.trade_license || "N/A",
    s.customer_ref || "N/A",
    s.form_id || "N/A",
    formatDate(s.created_at),
  ]);

  doc.autoTable({
    head,
    body,
    startY,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7.5,
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

  pdfAddFooters(doc, pageWidth, margin, "KYC Submissions");

  doc.save(`KYC_Submissions_${new Date().toISOString().slice(0, 10)}.pdf`);
  return { empty: false };
};
