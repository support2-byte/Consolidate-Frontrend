import { renderInvoice, fmtDate } from "./invoiceTemplate";

export async function generateInvoicePDF({
  invoiceId,
  orderFormNumber,
  receiverName,
  receiverContact,
  category,
  subcategory,
  overstayDays,
  baseRate,
  taxPercent,
  subtotal,
  total,
  discount,
  invoiceDate,
  dueInvoices = [],
  download = true,
}) {
  const date = fmtDate(invoiceDate || new Date());
  const commodity = `${category} - ${subcategory}`;
  const pct = Number(taxPercent ?? 0);
  const tax = (Number(subtotal ?? 0) * pct) / 100;

  return renderInvoice({
    title: "Overstay Invoice",
    invoiceId,
    meta: [
      ["Invoice Date", date],
      ["Terms", "Due on Receipt"],
      ["Due Date", date],
      ["Order Number", orderFormNumber],
      ["Commodity", commodity],
      ["Overstayed", `${overstayDays ?? 0} day(s)`],
    ],
    billTo: { name: receiverName, contact: receiverContact },
    items: [
      {
        description: "Cargo Overstay Charges",
        sub: commodity,
        qty: overstayDays,
        unit: "DAY",
        rate: baseRate,
        tax,
        taxPercent: pct,
        amount: Number(subtotal ?? 0) + tax,
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
    discount,
    total,
    note: "Charges apply after the 3 free-day period following shipment delivery.",
    download,
  });
}
