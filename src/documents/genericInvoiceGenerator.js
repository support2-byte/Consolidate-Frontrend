import { BRAND } from "../constants/containers";
import jsPDF from "jspdf";
import { loadImageAsBase64 } from "../Utlis/containerBuilder";

const COMPANY = {
  name: "Royal Gulf Shipping & Logistics",
  address:
    "21 6a st - Ras Al Khor Industrial Area 2 - Dubai - United Arab Emirates",
  phone: "+971 50 972 4214",
  email: "info@royalgulfshipping.com",
};

const INVOICE_LABELS = {
  storage: {
    heading: ["STORAGE", "INVOICE"],
    description: "Storage Charges",
    note: "Charges reflect storage usage for the period specified above.",
  },
  delivery: {
    heading: ["DELIVERY", "INVOICE"],
    description: "Delivery Charges",
    note: "Charges reflect delivery service requested for this shipment.",
  },
  dropoff: {
    heading: ["DROP-OFF", "INVOICE"],
    description: "Drop-off Pickup Charges",
    note: "Charges reflect pickup service requested for this shipment.",
  },
};

function drawMetaRow(doc, x, y, label, value, labelWidth = 34) {
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(60, 60, 60);
  doc.text(label, x, y);
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(20, 20, 20);
  doc.text(String(value ?? "N/A"), x + labelWidth, y);
  return y + 6;
}

export async function generateGenericInvoicePDF({
  invoiceType,
  invoiceId,
  orderFormNumber,
  receiverName,
  receiverContact,
  category,
  subcategory,
  size,
  storageType,
  amount,
  invoiceDate,
  download = true,
}) {
  const { teal, orange } = BRAND;
  const labels = INVOICE_LABELS[invoiceType] || INVOICE_LABELS.storage;

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;

  const fmtDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const invoiceDateFmt = fmtDate(invoiceDate || new Date());

  const drawBanner = () => {
    doc.setFillColor(...teal);
    doc.rect(0, 0, pageWidth, 16, "F");
    doc
      .setFont("helvetica", "bold")
      .setFontSize(15)
      .setTextColor(255, 255, 255);
    doc.text("STORAGE & DISTRIBUTION", pageWidth / 2, 10.5, {
      align: "center",
      charSpace: 1,
    });
  };

  const drawFooter = () => {
    const footerY = pageHeight - 16;
    doc.setFillColor(...teal);
    doc.rect(0, footerY, pageWidth, 16, "F");
    doc
      .setFont("helvetica", "normal")
      .setFontSize(8.5)
      .setTextColor(255, 255, 255);
    doc.text(`Tel: ${COMPANY.phone}`, margin, footerY + 9.5);
    doc.text(`Email: ${COMPANY.email}`, pageWidth - margin, footerY + 9.5, {
      align: "right",
    });
  };

  drawBanner();

  const logoBase64 = await loadImageAsBase64("./logo-2.png").catch(() => null);
  let y = 24;
  let logoDrawnWidth = 0;
  if (logoBase64) {
    const maxW = 26;
    const maxH = 14;
    const props = doc.getImageProperties(logoBase64);
    const ratio = props.width / props.height;
    let drawW = maxW;
    let drawH = drawW / ratio;
    if (drawH > maxH) {
      drawH = maxH;
      drawW = drawH * ratio;
    }
    doc.addImage(logoBase64, "PNG", margin, y, drawW, drawH);
    logoDrawnWidth = drawW;
  }

  const infoX = margin + (logoBase64 ? logoDrawnWidth + 6 : 0);
  doc
    .setFont("helvetica", "bold")
    .setFontSize(11)
    .setTextColor(...teal);
  doc.text(COMPANY.name, infoX, y + 4);
  doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(60, 60, 60);
  doc.text(doc.splitTextToSize(COMPANY.address, 110), infoX, y + 9);

  doc
    .setFont("helvetica", "bold")
    .setFontSize(16)
    .setTextColor(...orange);
  doc.text(labels.heading[0], pageWidth - margin, y + 4, { align: "right" });
  doc.text(labels.heading[1], pageWidth - margin, y + 11, { align: "right" });

  y += 20;
  doc.setDrawColor(200, 200, 200).setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  const colGap = 8;
  const colWidth = (contentWidth - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + colGap;
  const startY = y;

  let ly = startY;
  ly = drawMetaRow(doc, leftX, ly, "Invoice #", invoiceId);
  ly = drawMetaRow(doc, leftX, ly, "Invoice Date", invoiceDateFmt);
  ly = drawMetaRow(doc, leftX, ly, "Terms", "Due on Receipt");
  ly = drawMetaRow(doc, leftX, ly, "Order Ref", orderFormNumber);

  let ry = startY;
  const commodityLabel =
    [category, subcategory].filter(Boolean).join(" - ") || "N/A";
  ry = drawMetaRow(doc, rightX, ry, "Commodity", commodityLabel);

  y = Math.max(ly, ry) + 4;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(20, 20, 20);
  doc.text("Bill To", margin + 3, y + 4.8);
  y += 12;

  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(192, 57, 43);
  doc.text(receiverName || "N/A", margin, y);
  if (receiverContact) {
    doc
      .setFont("helvetica", "normal")
      .setFontSize(8.5)
      .setTextColor(80, 80, 80);
    doc.text(String(receiverContact), margin, y + 5);
    y += 5;
  }
  y += 8;

  const idxColW = 10;

  doc.setDrawColor(200, 200, 200).setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(20, 20, 20);
  doc.text("#", margin + 2, y + 5);
  doc.text("Description", margin + idxColW + 2, y + 5);
  doc.text("Amount", pageWidth - margin - 2, y + 5, { align: "right" });
  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(192, 57, 43);
  doc.text("1", margin + 2, y);

  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(41, 128, 185);
  doc.text(labels.description, margin + idxColW + 2, y);

  doc
    .setFont("helvetica", "normal")
    .setFontSize(7.5)
    .setTextColor(41, 128, 185);
  doc.text(commodityLabel, margin + idxColW + 2, y + 4.5);

  if (invoiceType === "storage" && (size || storageType)) {
    const detailLine = [size, storageType].filter(Boolean).join(" • ");
    doc.text(detailLine, margin + idxColW + 2, y + 8.5);
  }

  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(192, 57, 43);
  doc.text(`${Number(amount ?? 0).toFixed(2)} AED`, pageWidth - margin - 2, y, {
    align: "right",
  });

  y += 15;
  doc.setDrawColor(230, 230, 230).setLineWidth(0.15);
  doc.line(margin, y - 3, pageWidth - margin, y - 3);

  y += 4;
  doc.setDrawColor(200, 200, 200).setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc
    .setFont("helvetica", "bold")
    .setFontSize(10)
    .setTextColor(...orange);
  doc.text("Total Due", pageWidth - margin - 40, y);
  doc.text(`${Number(amount ?? 0).toFixed(2)} AED`, pageWidth - margin, y, {
    align: "right",
  });
  y += 12;

  doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(100, 100, 100);
  doc.text(labels.note, margin, y);
  y += 8;

  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(60, 60, 60);
  doc.text("Thanks for your business.", margin, y);

  drawFooter();

  if (download) {
    doc.save(`Invoice_${invoiceId}.pdf`);
  }
  return doc;
}
