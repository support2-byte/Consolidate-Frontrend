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

function drawMetaRow(doc, x, y, label, value, labelWidth = 34) {
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(60, 60, 60);
  doc.text(label, x, y);
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(20, 20, 20);
  doc.text(String(value ?? "N/A"), x + labelWidth, y);
  return y + 6;
}

export async function generateGatepassPDF({
  gpNumber,
  orderBookingRef,
  receiverName,
  customerName,
  customerContact,
  marksAndNumber,
  driverName,
  driverId,
  driverContact,
  plateNo,
  pickupLocation,
  qty,
  weight,
  commodity,
  gateDate,
  collectionMethod,
  download = true,
}) {
  const { teal, orange } = BRAND;

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;

  const gateDateFmt = gateDate
    ? new Date(gateDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

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
  doc.text("CARGO", pageWidth - margin, y + 4, { align: "right" });
  doc.text("GATEPASS", pageWidth - margin, y + 11, { align: "right" });

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
  ly = drawMetaRow(doc, leftX, ly, "GatePass #", gpNumber);
  ly = drawMetaRow(doc, leftX, ly, "GatePass Date", gateDateFmt);
  ly = drawMetaRow(doc, leftX, ly, "Terms", "Due on Receipt");
  ly = drawMetaRow(doc, leftX, ly, "Order Ref", orderBookingRef);
  ly = drawMetaRow(doc, leftX, ly, "Marks & No", marksAndNumber);

  let ry = startY;
  ry = drawMetaRow(doc, rightX, ry, "Driver Name", driverName);
  ry = drawMetaRow(doc, rightX, ry, "Driver Contact", driverContact);
  ry = drawMetaRow(doc, rightX, ry, "Driver NIC", driverId);
  ry = drawMetaRow(doc, rightX, ry, "Truck No", plateNo);

  y = Math.max(ly, ry) + 4;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(20, 20, 20);
  doc.text("Gatepass To", margin + 3, y + 4.8);
  y += 12;

  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(192, 57, 43);
  doc.text(customerName || receiverName || "N/A", margin, y);
  if (customerContact) {
    doc
      .setFont("helvetica", "normal")
      .setFontSize(8.5)
      .setTextColor(80, 80, 80);
    doc.text(String(customerContact), margin, y + 5);
    y += 5;
  }
  y += 8;

  const idxColW = 10;

  doc.setDrawColor(200, 200, 200).setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(20, 20, 20);
  doc.text("#", margin + 2, y + 5);
  doc.text("Item & Description", margin + idxColW + 2, y + 5);
  doc.text("Qty", pageWidth - margin - 2, y + 5, { align: "right" });
  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(192, 57, 43);
  doc.text("1", margin + 2, y);

  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(41, 128, 185);
  doc.text(commodity || "ITEM", margin + idxColW + 2, y);

  doc
    .setFont("helvetica", "normal")
    .setFontSize(7.5)
    .setTextColor(41, 128, 185);
  doc.text(`TRUCK # ${plateNo || "N/A"}`, margin + idxColW + 2, y + 4.2);
  doc.text(`DRIVER # ${driverName || "N/A"}`, margin + idxColW + 2, y + 8.4);
  doc.text(`ID # ${orderBookingRef || "N/A"}`, margin + idxColW + 2, y + 12.6);
  if (weight) {
    doc.text(`WEIGHT # ${weight} KGS`, margin + idxColW + 2, y + 16.8);
  }

  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(192, 57, 43);
  doc.text(qty ? Number(qty).toFixed(2) : "0.00", pageWidth - margin - 2, y, {
    align: "right",
  });

  y += weight ? 23 : 19;
  doc.setDrawColor(230, 230, 230).setLineWidth(0.15);
  doc.line(margin, y - 3, pageWidth - margin, y - 3);

  y += 4;
  doc.setDrawColor(200, 200, 200).setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  const totalQty = qty ? Number(qty).toFixed(2) : "0.00";
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(40, 40, 40);
  doc.text(`Items in Total ${totalQty}`, margin, y);
  doc.text(`Sub Total  ${totalQty}`, pageWidth - margin, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "bold").setFontSize(9);
  doc.text(`Total QTY ${totalQty}`, pageWidth - margin, y, {
    align: "right",
  });
  y += 12;

  if (collectionMethod) {
    doc
      .setFont("helvetica", "italic")
      .setFontSize(8)
      .setTextColor(100, 100, 100);
    doc.text(`Collection Method: ${collectionMethod}`, margin, y);
    y += 6;
  }

  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(60, 60, 60);
  doc.text("Thanks for your business.", margin, y);

  drawFooter();

  if (download) {
    doc.save(`Gatepass_${gpNumber}.pdf`);
  }
  return doc;
}
