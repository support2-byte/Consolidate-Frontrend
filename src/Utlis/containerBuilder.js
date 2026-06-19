import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import { BRAND } from "../constants/containers";

applyPlugin(jsPDF);

export const validateContainerNumber = (val) => /^[A-Z]{4}\d{7}$/.test(val);

export const validateDate = (d) => {
  const date = new Date(d);
  return date instanceof Date && !isNaN(date);
};

export const validateNumber = (value, fieldName) => {
  if (value === "" || value === null || value === undefined) return true;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0)
    throw new Error(`${fieldName} must be a valid non-negative number`);
  return true;
};

export const validateForm = (formData) => {
  const errors = [];

  if (!formData.containerNo.trim()) {
    errors.push("Container Number is required");
  } else if (!validateContainerNumber(formData.containerNo)) {
    errors.push(
      "Container Number must be 4 letters followed by 7 digits (e.g., ABCD1234567)",
    );
  }

  if (!formData.size) errors.push("Size is required");
  if (!formData.type) errors.push("Type is required");

  if (
    !formData.location ||
    !["karachi_port", "dubai_port"].includes(formData.location)
  )
    errors.push("Valid Location is required (Karachi Port or Dubai Port)");

  if (formData.ownership === "soc") {
    if (
      !formData.dateOfManufacture ||
      !validateDate(formData.dateOfManufacture)
    )
      errors.push("Valid Date of Manufacture is required");
    if (!formData.purchaseDate || !validateDate(formData.purchaseDate))
      errors.push("Valid Purchase Date is required");
    if (
      !formData.purchasePrice ||
      !validateNumber(formData.purchasePrice, "Purchase Price")
    )
      errors.push("Valid Purchase Price is required");
    if (!formData.purchaseFrom) errors.push("Purchase From is required");
    if (!formData.ownershipDetails.trim()) errors.push("Owned By is required");
    if (!formData.availableAtDate || !validateDate(formData.availableAtDate))
      errors.push("Valid Available At Date is required");
    if (formData.currency && !/^[A-Z]{3}$/.test(formData.currency))
      errors.push("Currency must be a 3-letter code (e.g., USD)");
  }

  if (formData.ownership === "coc") {
    if (!formData.hireStartDate || !validateDate(formData.hireStartDate))
      errors.push("Valid Hire Start Date is required");
    if (!formData.hireEndDate || !validateDate(formData.hireEndDate))
      errors.push("Valid Hire End Date is required");
    if (!formData.vendor.trim()) errors.push("Vendor is required");
    if (!formData.freeDays || !validateNumber(formData.freeDays, "Free Days"))
      errors.push("Valid Free Days is required");
    if (!formData.placeOfLoading.trim())
      errors.push("Place of Loading is required");
    if (!formData.placeOfDelivery.trim())
      errors.push("Place of Delivery is required");
    if (formData.return_date && !validateDate(formData.return_date))
      errors.push("Valid Return Date is required");
  }

  if (errors.length > 0) throw new Error(errors.join("; "));
  return true;
};

export const buildContainerPayload = (formData) => ({
  container_number: formData.containerNo,
  container_size: formData.size,
  container_type: formData.type,
  owner_type: formData.ownership,
  derived_status: formData.derived_status,
  remarks: "Created/Updated via frontend",
  created_by: "system",
  location: formData.location,
  manufacture_date: formData.dateOfManufacture,
  purchase_date: formData.purchaseDate,
  purchase_price: parseFloat(formData.purchasePrice) || 0,
  purchase_from: formData.purchaseFrom,
  owned_by: formData.ownershipDetails,
  available_at: formData.availableAtDate,
  currency: formData.currency,
  hire_start_date: formData.hireStartDate,
  hire_end_date: formData.hireEndDate,
  hired_by: formData.vendor,
  return_date: formData.return_date,
  free_days: parseInt(formData.freeDays) || 0,
  place_of_loading: formData.placeOfLoading,
  place_of_destination: formData.placeOfDelivery,
});

export const loadImageAsBase64 = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
  });

export const pdfDrawSectionHeader = (doc, text, y, margin) => {
  const { teal } = BRAND;
  doc.setFillColor(...teal);
  doc.rect(margin, y, 3, 5, "F");
  doc.setFont("helvetica", "bold").setFontSize(10);
  doc.setTextColor(...teal);
  doc.text(text, margin + 6, y + 4);
  return y + 9;
};

export const pdfDrawLabelValue = (doc, label, value, x, y, labelWidth = 28) => {
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(80, 80, 80);
  doc.text(label + ":", x, y);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(30, 30, 30);
  doc.text(String(value || "N/A"), x + labelWidth, y);
};

export const pdfDrawDivider = (
  doc,
  y,
  pageWidth,
  margin,
  color = BRAND.borderGrey,
) => {
  doc.setDrawColor(...color).setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
};

export const pdfAddFooters = (doc, pageWidth, margin, footerText) => {
  const totalPages = doc.internal.getNumberOfPages();
  const { teal } = BRAND;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerY = 285;
    doc.setDrawColor(...teal).setLineWidth(0.3);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
    doc
      .setFont("helvetica", "normal")
      .setFontSize(7.5)
      .setTextColor(120, 120, 120);
    doc.text(
      "Generated by Royal Gulf Shipping Management System",
      pageWidth / 2,
      footerY + 2,
      {
        align: "center",
      },
    );
    doc.text(
      `Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}`,
      pageWidth / 2,
      footerY + 6,
      { align: "center" },
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, footerY + 2, {
      align: "right",
    });
    if (footerText) doc.text(footerText, margin, footerY + 2);
  }
};

export const pdfManifestHeader = async (
  doc,
  { consignmentNo, pol, pod, totalContainers, pageWidth, margin },
) => {
  const { teal, orange } = BRAND;
  const logoBase64 = await loadImageAsBase64("./logo-2.png");
  if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 5, 55, 12);

  doc
    .setFont("helvetica", "bold")
    .setFontSize(10)
    .setTextColor(...orange);
  doc.text(`Consignment: ${consignmentNo}`, pageWidth - margin, 8, {
    align: "right",
  });

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(60, 60, 60);
  [
    `Total Containers: ${totalContainers}`,
    `POL: ${pol}`,
    `POD: ${pod}`,
    `Generated: ${new Date().toLocaleString()}`,
  ].forEach((line, i) =>
    doc.text(line, pageWidth - margin, 13 + i * 4, { align: "right" }),
  );

  doc
    .setFont("helvetica", "bold")
    .setFontSize(13)
    .setTextColor(...teal);
  doc.text("ROYAL GULF SHIPPING & LOGISTICS LLC", margin, 22);
  doc
    .setFont("helvetica", "normal")
    .setFontSize(7.5)
    .setTextColor(120, 120, 120);
  doc.text("Dubai • London • Karachi • Shenzhen", margin, 26);

  doc
    .setFont("helvetica", "bold")
    .setFontSize(14)
    .setTextColor(...teal);
  doc.text("CONSOLIDATION MANIFEST - CONTAINER LEVEL", margin, 33);
  doc
    .setDrawColor(...teal)
    .setLineWidth(0.6)
    .line(margin, 36, pageWidth - margin, 36);

  return 40;
};

export const buildReceiversData = (consignmentOrderIds, allOrdersMap) => {
  const result = [];
  consignmentOrderIds.forEach((oid) => {
    const orderData = allOrdersMap[oid];
    if (!orderData) return;
    (orderData.receivers || []).forEach((receiver) => {
      (receiver.shippingDetails || []).forEach((detail) => {
        result.push({
          receiverName: receiver.receiver_name || "N/A",
          category: detail.category || "N/A",
          subcategory: detail.subcategory || "N/A",
          totalNumber: Number(detail.totalNumber || 0),
          weight: Number(detail.weight || 0),
          bookingRef: orderData.booking_ref || "N/A",
          senderName: orderData.sender_name || "N/A",
        });
      });
    });
  });
  return result;
};

export const buildCategoryRows = (receiversData) => {
  const catMap = {};
  receiversData.forEach((r) => {
    if (!catMap[r.category])
      catMap[r.category] = {
        category: r.category,
        orders: new Set(),
        totalNumber: 0,
        weight: 0,
      };
    catMap[r.category].totalNumber += r.totalNumber;
    catMap[r.category].weight += r.weight;
    catMap[r.category].orders.add(r.bookingRef);
  });
  const rows = Object.values(catMap).map((item) => [
    item.category,
    item.orders.size.toString(),
    item.totalNumber.toString(),
    item.weight.toFixed(2),
  ]);
  const total = Object.values(catMap).reduce(
    (s, i) => ({ q: s.q + i.totalNumber, w: s.w + i.weight }),
    { q: 0, w: 0 },
  );
  rows.push([
    { content: "TOTAL", styles: { fontStyle: "bold" } },
    { content: "", styles: {} },
    { content: total.q.toString(), styles: { fontStyle: "bold" } },
    { content: total.w.toFixed(2), styles: { fontStyle: "bold" } },
  ]);
  return { rows, total };
};

export const manifestTableStyles = {
  styles: {
    fontSize: 9,
    cellPadding: 3,
    lineWidth: 0.2,
    lineColor: BRAND.borderGrey,
  },
  headStyles: {
    fillColor: [255, 255, 255],
    textColor: [50, 50, 50],
    fontStyle: "bold",
    fontSize: 8,
    lineWidth: 0.2,
    lineColor: BRAND.borderGrey,
  },
  bodyStyles: { fillColor: [255, 255, 255] },
  tableLineWidth: 0.2,
  tableLineColor: BRAND.borderGrey,
};
