import { renderInvoice, fmtDate } from "./invoiceTemplate";

const INVOICE_LABELS = {
  storage: {
    title: "Storage Invoice",
    description: "Storage Charges",
    unit: "NO",
    note: "Charges reflect storage usage for the period specified above.",
  },
  delivery: {
    title: "Delivery Invoice",
    description: "Delivery Charges",
    unit: "NO",
    note: "Charges reflect delivery service requested for this shipment.",
  },
  dropoff: {
    title: "Drop-off Invoice",
    description: "Drop-off Pickup Charges",
    unit: "NO",
    note: "Charges reflect pickup service requested for this shipment.",
  },
};

const formatLabel = (key) =>
  key
    ? String(key)
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "";

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
  dueInvoices = [],
  download = true,
}) {
  const labels = INVOICE_LABELS[invoiceType] || INVOICE_LABELS.storage;
  const date = fmtDate(invoiceDate || new Date());
  const commodity =
    [category, subcategory].filter(Boolean).join(" - ") || "N/A";
  const detail =
    invoiceType === "storage"
      ? [size, formatLabel(storageType)].filter(Boolean).join(" • ")
      : "";

  return renderInvoice({
    title: labels.title,
    invoiceId,
    meta: [
      ["Invoice Date", date],
      ["Terms", "Due on Receipt"],
      ["Due Date", date],
      ["Order Number", orderFormNumber],
      ["Commodity", commodity],
    ],
    billTo: { name: receiverName, contact: receiverContact },
    items: [
      {
        description: labels.description,
        sub: [commodity, detail].filter(Boolean).join("  "),
        qty: 1,
        unit: labels.unit,
        rate: amount,
        tax: 0,
        taxPercent: 0,
        amount: Number(amount ?? 0),
      },
      ...dueInvoices.map((d) => ({
        description: `Previous Balance - ${d.invoiceNumber}`,
        sub: d.dueDate ? `Due ${fmtDate(d.dueDate)}` : "",
        qty: 1,
        unit: "NO",
        rate: d.balance,
        tax: 0,
        taxPercent: 0,
        amount: Number(d.balance ?? 0),
      })),
    ],
    note: labels.note,
    download,
  });
}
