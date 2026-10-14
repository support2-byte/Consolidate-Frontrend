import jsPDF from "jspdf";
import { BRAND } from "../constants/containers";
import { loadImageAsBase64 } from "../Utlis/containerBuilder";

export const COMPANY = {
  name: "Royal Gulf Shipping & Logistics",
  addressLines: [
    "Plot #613-1130, Shed# 1 and 4",
    "Ras al Khor Industrial Area",
    "Dubai UAE 27011",
    "U.A.E",
  ],
  phone: "+971 4 333 1785",
  mobile: "+971 50 972 4214",
  email: "info@royalgulfshipping.com",
  bank: [
    "M/s: Royal Gulf Shipping & Logistics",
    "Bank Name : Habib Bank AG Zurich",
    "Bank Branch : Bur Dubai",
    "Account Title : Royal Gulf Shipping & Logistics LLC",
    "",
    "Account No: 02-02-08-020311-105-0574843",
    "IBAN No: AE56 0290 8902 1050 0574 843",
    "Swift Code : HBZUAEAD",
  ],
};

export const DEFAULT_TERMS = [
  "In case Customer fails to pay the monthly rent payments for consecutive two months Warehouse reserves the right to dispose off /auction cargo in order to recover the pending outstanding payments.",
  "Warehouse its owners/partners will be free for any liability arising due to non payment of monthly rent payments.",
  "All responsibility for the cargo stored within the Warehouse premises pertaining to product its brand, Expiry and made lies to the owner of the cargo if any discrepancy is found by the laws of U.A.E",
  "Warehouse its owners/partners will not be responsible for any contents of cargo or nature of cargo stored within Warehouse premises as this is the sole liability of the customer/owner of cargo.",
  "All the goods stored should be the property of agreement customer as non of the 3rd parties cargo can be stored under their trade license which is not the property of the agreement customer.",
  "The contract can anytime be terminated by the Warehouse depending upon space availability with immediate effect.",
  "Warehouse reserve the right to terminate the contract in case of any misbehaviour or if found not complying with the warehouse terms and conditions.",
  "Warehouse will inform customer for the termination of the contract before one month for pre- arrangements and shifting of cargo.",
  "Customer should inform the warehouse owner before two months if they don’t want to continue the premises availability for the remaining period of the contract. Failure to do so one month extra rent will be charged to customer.",
  "Customer shall pay the amount agreed for warehousing in full monthly cheques for 10th of every month in advance.",
  "Warehouse operator/owner does not provide any insurance for stock being stored under the premises unless agreed in written by 3rd party insurance broker separately.",
  "In case of any rents cheque return the contract will be immediately terminated without any notice and customer will abide to vacate the place within 03 working days.",
  "Warehouse can increase the rent of the premises depending upon the market conditions, subject to one month prior notice to customer for the same.",
  "Validity of contract can anytime be terminated if any mis-behaviour or non professional attitude from the representative of the customer is noticed.",
  "One Key for the locks applied at the door will be kept with Warehouse supervisor for in case of emergency access.",
  "Total cargo movements In/Out will be recorded by customer itself as Warehouse is not liable to keep any track of cargo movements In/Out and will not undertake any responsibility for any loss / damage of the cargo.",
  "Customer has to maintain his own cargo inventory.",
  "Warehouse will not give access to any one in Sheds premises prior written confirmation from customers.",
];

const PW = 210;
const PH = 297;
const M = 16;
const R = 198;
const GOLD = [221, 190, 60];
const DARK = [58, 58, 58];
const SLATE = [52, 64, 72];
const LIGHT = [244, 244, 242];
const PAGE_LIMIT = 268;

export const fmt = (n, d = 3) =>
  Number(n ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

export const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

const drawChrome = (doc, teal, footerImg) => {
  doc.setFillColor(...teal);
  doc.rect(21, 0, 169, 18, "F");
  doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(255, 255, 255);
  doc.text("STORAGE & DISTRIBUTION", PW / 2, 12.5, { align: "center" });
  if (footerImg) {
    doc.addImage(footerImg, "PNG", 21, 280, 169, 17);
    return;
  }
  doc.setFillColor(...SLATE);
  doc.rect(21, 280, 169, 17, "F");
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(255, 255, 255);
  doc.text(`Tel: ${COMPANY.phone}  |  Mob: ${COMPANY.mobile}`, 27, 287);
  doc.text(`Email: ${COMPANY.email}`, 27, 292.5);
};

const hLine = (doc, y, color = [170, 170, 170], width = 0.25) => {
  doc.setDrawColor(...color).setLineWidth(width);
  doc.line(M, y, R, y);
};

const tableHeader = (doc, y, cols) => {
  doc.setFillColor(...DARK);
  doc.rect(M, y, R - M, 8.5, "F");
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(255, 255, 255);
  cols.forEach(([text, x, align]) => doc.text(text, x, y + 5.6, { align }));
  return y + 8.5;
};

export async function renderInvoice(data) {
  const { teal } = BRAND;
  const doc = new jsPDF("p", "mm", "a4");
  const footerImg = await loadImageAsBase64("./invoice-footer.png").catch(
    () => null,
  );
  const logo = await loadImageAsBase64("./logo-2.png").catch(() => null);

  const items = data.items || [];
  const itemsTotal = items.reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const taxTotal = items.reduce((s, i) => s + Number(i.tax ?? 0), 0);
  const discount = Number(data.discount ?? 0);
  const total = data.total ?? itemsTotal - discount;

  const newPage = () => {
    doc.addPage();
    drawChrome(doc, teal, footerImg);
    return 28;
  };

  drawChrome(doc, teal, footerImg);

  if (logo) {
    const props = doc.getImageProperties(logo);
    const ratio = props.width / props.height;
    let w = 54;
    let h = w / ratio;
    if (h > 16) {
      h = 16;
      w = h * ratio;
    }
    doc.addImage(logo, "PNG", M + 2, 22, w, h);
  }
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(30, 30, 30);
  doc.text(COMPANY.name, M, 41.5);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(60, 60, 60);
  COMPANY.addressLines.forEach((line, i) => doc.text(line, M, 46 + i * 4.2));

  doc
    .setFont("helvetica", "normal")
    .setFontSize(26)
    .setTextColor(...GOLD);
  doc.text(data.title, R, 32, { align: "right" });
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(30, 30, 30);
  doc.text(`Invoice# ${data.invoiceId}`, R, 38, { align: "right" });
  doc.setFontSize(8);
  doc.text("Balance Due", R, 47, { align: "right" });
  doc.setFontSize(14);
  doc.text(`AED ${fmt(total)}`, R, 53, { align: "right" });

  let y = 73;
  data.meta.forEach(([label, value]) => {
    const lines = doc.splitTextToSize(String(value ?? "N/A"), 40);
    const h = Math.max(8, lines.length * 4 + 2);
    const mid = y + h / 2 + 1;
    doc
      .setFont("helvetica", "normal")
      .setFontSize(9.5)
      .setTextColor(60, 60, 60);
    doc.text(`${label} :`, 159, mid, { align: "right" });
    doc.setFontSize(8.5);
    doc.text(lines, R, mid - (lines.length - 1) * 2, { align: "right" });
    y += h;
  });

  const billY = Math.max(y - 14, 100);
  const bill = data.billTo || {};
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(60, 60, 60);
  doc.text("Bill To", M, billY);
  doc.setFont("helvetica", "bold").setTextColor(30, 30, 30);
  doc.text(String(bill.name || "N/A").toUpperCase(), M, billY + 4.6);
  doc.setFont("helvetica", "normal").setTextColor(60, 60, 60);
  if (bill.contact) doc.text(String(bill.contact), M, billY + 9);
  if (bill.country) doc.text(String(bill.country), M, billY + 13.4);

  y = Math.max(y, billY + 20) + 8;

  const colX = {
    idx: M + 4,
    desc: M + 14.5,
    qty: 128,
    rate: 142,
    tax: 168,
    amt: 196,
  };
  const headerCols = [
    ["#", colX.idx, "center"],
    ["Item & Description", colX.desc, "left"],
    ["Qty", colX.qty, "right"],
    ["Rate", colX.rate, "right"],
    ["Tax", colX.tax, "right"],
    ["Amount", colX.amt, "right"],
  ];
  y = tableHeader(doc, y, headerCols);

  items.forEach((item, i) => {
    if (y + 14 > PAGE_LIMIT) {
      y = tableHeader(doc, newPage(), headerCols);
    }
    const hasTax = Number(item.taxPercent ?? 0) > 0;
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(30, 30, 30);
    doc.text(String(i + 1), colX.idx, y + 6, { align: "center" });
    doc.text(item.description, colX.desc, y + 6);
    doc.text(fmt(item.qty, 2), colX.qty, y + 6, { align: "right" });
    doc.text(fmt(item.rate), colX.rate, y + 6, { align: "right" });
    doc.text(hasTax ? fmt(item.tax) : "-", colX.tax, y + 6, { align: "right" });
    doc.text(fmt(item.amount), colX.amt, y + 6, { align: "right" });
    doc.setFontSize(7).setTextColor(90, 90, 90);
    if (item.sub) doc.text(String(item.sub), colX.desc, y + 10);
    if (item.unit) doc.text(item.unit, colX.qty, y + 10, { align: "right" });
    doc.text(hasTax ? `${fmt(item.taxPercent, 2)}%` : "-", colX.tax, y + 10, {
      align: "right",
    });
    y += 14;
    hLine(doc, y);
  });

  if (y + 32 > PAGE_LIMIT) y = newPage();

  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(30, 30, 30);
  doc.text("Sub Total", 148, y + 6, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(fmt(taxTotal), colX.tax, y + 6, { align: "right" });
  doc.text(fmt(itemsTotal), colX.amt, y + 6, { align: "right" });
  y += 9;
  hLine(doc, y);

  if (discount > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Discount", 160, y + 6, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`- AED ${fmt(discount)}`, colX.amt, y + 6, { align: "right" });
    y += 9;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Total", 160, y + 7, { align: "right" });
  doc.text(`AED ${fmt(total)}`, colX.amt, y + 7, { align: "right" });
  y += 10;

  doc.setFillColor(...LIGHT);
  doc.rect(107, y, R - 107, 10, "F");
  doc.text("Balance Due", 160, y + 6.5, { align: "right" });
  doc.text(`AED ${fmt(total)}`, colX.amt, y + 6.5, { align: "right" });
  y += 20;

  if (y > 210) y = newPage();

  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(60, 60, 60);
  doc.text("Tax Summary", M, y);
  y += 4;
  y = tableHeader(doc, y, [
    ["Tax Details", M + 3, "left"],
    ["Taxable Amount (AED)", 165, "right"],
    ["Tax Amount (AED)", 196, "right"],
  ]);

  const standard = items.filter((i) => Number(i.taxPercent ?? 0) > 0);
  const exempt = items.filter((i) => !(Number(i.taxPercent ?? 0) > 0));
  const sum = (arr, k) => arr.reduce((s, i) => s + Number(i[k] ?? 0), 0);
  const standardTaxable = sum(standard, "amount") - sum(standard, "tax");
  const exemptTaxable = sum(exempt, "amount");
  const rate = standard[0]?.taxPercent ?? 5;

  [
    [
      `Standard Rate (${fmt(rate, 0)}%)`,
      standardTaxable,
      sum(standard, "tax"),
      false,
    ],
    ["Exempt", exemptTaxable, 0, false],
    ["Total", standardTaxable + exemptTaxable, taxTotal, true],
  ].forEach(([label, taxable, tax, bold]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(label, M + 3, y + 6);
    doc.text(fmt(taxable), 165, y + 6, { align: "right" });
    doc.text(fmt(tax), 196, y + 6, { align: "right" });
    y += 9;
    hLine(doc, y);
  });
  y += 12;

  if (y > 235) y = newPage();
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(60, 60, 60);
  doc.text("Notes", M, y);
  y += 5;
  doc.setFontSize(8).setTextColor(30, 30, 30);
  doc.text(data.note || "Thanks for your business.", M, y);
  y += 10;
  COMPANY.bank.forEach((line) => {
    doc.text(line, M, y);
    y += 3.8;
  });
  y += 8;

  const terms = data.terms === undefined ? DEFAULT_TERMS : data.terms;
  if (terms && terms.length) {
    if (y > 235) y = newPage();
    doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(60, 60, 60);
    doc.text("Terms & Conditions", M, y);
    y += 5;
    doc.setFontSize(8).setTextColor(30, 30, 30);
    doc.text("Warehousing & Storage Contract.", M, y);
    y += 6;
    doc.text("Warehouse & Storage Terms & Conditions:", M, y);
    y += 7;
    doc.setFontSize(7.2);
    terms.forEach((term, i) => {
      const lines = doc.splitTextToSize(term, R - M - 8);
      if (y + lines.length * 3.2 > PAGE_LIMIT) y = newPage();
      doc.text(`${i + 1}.`, M, y);
      doc.text(lines, M + 8, y);
      y += lines.length * 3.2 + 0.6;
    });
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc
      .setFont("helvetica", "normal")
      .setFontSize(6)
      .setTextColor(160, 160, 160);
    doc.text(String(p), PW - 4, 282, { align: "right" });
  }

  if (data.download !== false) doc.save(`Invoice_${data.invoiceId}.pdf`);
  return doc;
}
