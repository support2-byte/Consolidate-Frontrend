import { CONFIRMATION_EMAIL_TEMPLATE } from "./confirmationEmailTemplate";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const buildEmailPreviewHtml = ({
  company,
  recipientName,
  message,
  mode,
  items,
  pol,
  pod,
}) => {
  const totalQty = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const totalWeight = items.reduce((s, i) => s + (Number(i.weight) || 0), 0);

  const messageSection = message.trim()
    ? `<p class="body-text" style="white-space:pre-line">${esc(message)}</p>`
    : "";

  const itemsSection = items.length
    ? `<div class="info-box">
        <div class="info-title">Shipment Items${
          pol || pod ? ` &mdash; ${esc(pol)} &rarr; ${esc(pod)}` : ""
        }</div>
        <table class="items-table">
          <tr><th>Category</th><th>Subcategory</th><th>Type</th><th>Qty</th><th>Weight</th></tr>
          ${items
            .map(
              (i) =>
                `<tr><td>${esc(i.category)}</td><td>${esc(i.subcategory)}</td><td>${esc(i.type)}</td><td>${esc(i.qty)}</td><td>${esc(i.weight)}</td></tr>`,
            )
            .join("")}
        </table>
      </div>`
    : "";

  const values = {
    companyLogo: esc(company?.logo_url || ""),
    companyName: esc(company?.company || ""),
    recipientName: esc(recipientName),
    introText:
      "Your booking confirmation has been recorded. Please review the details below and confirm your acceptance.",
    messageSection,
    viewLink: "",
    mode: esc(mode),
    totalQty,
    totalWeight,
    year: new Date().getFullYear(),
    itemsSection,
  };

  const html = CONFIRMATION_EMAIL_TEMPLATE.replace(/{{(\w+)}}/g, (m, k) =>
    k in values ? values[k] : m,
  );

  const disableLinkStyle = `<style>
    a.btn { pointer-events: none; cursor: default; opacity: 0.6; }
  </style>`;

  return html.replace("</head>", `${disableLinkStyle}</head>`);
};
