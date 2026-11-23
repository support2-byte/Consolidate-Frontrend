import logoRickmers from "../../public/RICKMERS-LOGO.jpg";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const tint = (hex, op = 0.1) => {
  const c = (hex || "#cccccc").replace("#", "");
  return `rgba(${parseInt(c.substring(0, 2), 16)}, ${parseInt(c.substring(2, 4), 16)}, ${parseInt(c.substring(4, 6), 16)}, ${op})`;
};

const nl = (v) => (v ? esc(v).replace(/\r?\n/g, "<br>") : "");
const catName = (i) => i.category || "Unknown";

export const mblCss = (company) => {
  const primary = company?.primary_color || "#2b3a67";
  const secondary = company?.secondary_color || "#e63946";
  return `
  .mk-page { width: 794px; height: 1120px; padding: 18px; background: #fff; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; position: relative; margin: 0 auto 20px auto; overflow: hidden; }
  .mk-page * { box-sizing: border-box; }
  .mk-frame { border: 1.5px solid #000; border-top-left-radius: 26px; border-bottom-right-radius: 26px; overflow: hidden; }
  .mk-label { display: block; font-size: 9px; color: #555; margin-bottom: 3px; line-height: 1.2; }
  .mk-content { font-size: 12px; font-weight: bold; text-transform: uppercase; line-height: 1.35; word-break: break-word; }
  .mk-cell { border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 5px 7px; }
  .mk-head { display: grid; grid-template-columns: 1.1fr 1.4fr .9fr; border-bottom: 1px solid #000; border-top: 4px solid ${primary}; }
  .mk-head > div { padding: 8px 12px; display: flex; flex-direction: column; justify-content: center; }
  .mk-head > div + div { border-left: 1px solid #000; }
  .mk-brand { align-items: flex-start; gap: 4px; }
  .mk-brand-name { font-size: 10px; font-weight: bold; color: ${primary}; letter-spacing: .3px; line-height: 1.2; }
  .mk-head-mid { align-items: center; text-align: center; }
  .mk-title { font-size: 17px; font-weight: bold; color: #000; white-space: nowrap; letter-spacing: .5px; }
  .mk-sub { font-size: 10px; font-weight: bold; color: ${secondary}; letter-spacing: 1.5px; margin-top: 3px; }
  .mk-head-no .mk-content { font-size: 15px; }
  .mk-upper { display: grid; grid-template-columns: 1.1fr 1fr; }
  .mk-upper > div { display: flex; flex-direction: column; }
  .mk-upper > div > .mk-cell:last-child { flex: 1; }
  .mk-small { font-size: 9.5px; line-height: 1.4; color: #333; text-align: justify; }
  .mk-route { display: grid; grid-template-columns: 1fr 1fr 1fr; }
  .mk-route .mk-cell:nth-child(3n) { border-right: none; }
  .mk-band { text-align: center; font-weight: bold; font-size: 12px; padding: 5px; letter-spacing: .6px; background: ${tint(primary)}; border-bottom: 1px solid #000; }
  .mk-desc { display: grid; grid-template-columns: 1fr 150px 120px; height: 250px; border-bottom: 1px solid #000; overflow: hidden; }
  .mk-dcol { padding: 6px 8px; border-right: 1px solid #000; }
  .mk-dcol.mk-last { border-right: none; }
  .mk-dtext { text-transform: none; }
  .mk-crow { margin-top: 8px; font-size: 11px; font-weight: bold; }
  .mk-tbl-head, .mk-line { display: grid; grid-template-columns: 1.2fr 1.2fr 1.8fr .9fr 1.1fr; gap: 8px; padding: 2px 0 2px 10px; }
  .mk-tbl-head > span, .mk-line > span { min-width: 0; word-break: break-word; }
  .mk-tbl-head > span:nth-child(n+4), .mk-line > span:nth-child(n+4) { text-align: right; }
  .mk-tbl-head { font-size: 8.5px; color: #555; font-weight: normal; margin-top: 3px; }
  .mk-line { font-size: 10.5px; font-weight: normal; }
  .mk-cont { margin-top: 10px; font-size: 10px; color: ${secondary}; font-weight: bold; }
  .mk-frow { display: grid; grid-template-columns: 2.2fr 1fr 1fr .8fr 1fr 1fr; }
  .mk-frow > div { border-right: 1px solid #000; padding: 4px 6px; }
  .mk-frow > div:last-child { border-right: none; }
  .mk-fhead { font-size: 9px; color: #555; border-bottom: 1px solid #000; }
  .mk-fbody { border-bottom: 1px solid #000; }
  .mk-foot { display: grid; grid-template-columns: 1fr 1fr; }
  .mk-foot > div:first-child { border-right: 1px solid #000; }
  .mk-foot > div:first-child > .mk-cell { border-right: none; }
  .mk-foot > div:last-child .mk-cell { border-right: none; }
  .mk-two { display: grid; grid-template-columns: 1fr 1fr; }
  .mk-two .mk-cell:last-child { border-right: none; }
  .mk-sign { padding: 8px 10px; }
  .mk-sig-img { height: 46px; margin: 8px 0 2px; filter: grayscale(100%) contrast(100%); mix-blend-mode: multiply; }
  .mk-signname { font-size: 12px; font-weight: bold; color: ${primary}; margin: 4px 0; }
  .mk-line-sig { border-top: 1px solid #000; margin-bottom: 3px; }
  .mk-p2head { display: flex; justify-content: space-between; padding: 10px 18px; font-size: 12px; border-bottom: 1px solid #000; border-top: 6px solid ${primary}; }
  .mk-terms { padding: 14px 18px; min-height: 700px; height: auto; overflow: visible; font-size: 10.5px; line-height: 1.5; border-bottom: 1px solid #000; }
  .mk-terms ol { margin: 8px 0; padding-left: 18px; }
  .mk-terms li { margin-bottom: 5px; }
  .mk-pgno { font-size: 9px; color: #555; margin-top: 6px; }
  .mk-wm { position: absolute; left: 0; right: 0; top: 46%; text-align: center; font-size: 72px; font-weight: bold; color: rgba(0,0,0,.12); transform: rotate(-18deg); pointer-events: none; line-height: 1; }
    .mk-frame, .mk-cell, .mk-line, .mk-crow, .mk-sign, .mk-frow, .mk-terms li { break-inside: avoid; page-break-inside: avoid; }
  @media print {
    @page { size: A4; margin: 0; }
    .mk-page { margin: 0; page-break-after: always; break-after: page; }
    .mk-page:last-child { page-break-after: auto; break-after: auto; }
  }`;
};

const ROWS_P1 = 6;
const ROWS_CONT = 38;

export const buildMblPages = (data, company, variant = "original") => {
  const c = data.consignment || {};
  const containers = data.containers || [];
  const totals = data.totals || { containers: 0, pkgs: 0, weight: 0 };
  const companyName = company?.company || "";
  const issueDate = new Date().toISOString().slice(0, 10);
  const sob = data.shipped_on_board || "";
  const formNos = (data.orders || [])
    .map((o) => o.rgl_booking_number)
    .filter(Boolean)
    .join(", ");
  const vesselLine = [c.vessel_name, c.voyage].filter(Boolean).join(" / ");
  const goods = [
    ...new Set(containers.flatMap((ct) => ct.items.map(catName))),
  ].join(", ");
  const showSig = variant !== "copy" && company?.signature_url;
  const watermark =
    variant === "copy"
      ? `<div class="mk-wm">COPY</div>`
      : variant === "certified"
        ? `<div class="mk-wm" style="font-size:52px;">CERTIFIED<br>TRUE COPY</div>`
        : "";

  const tblHead = `<div class="mk-tbl-head"><span>Form No.</span><span>Marks &amp; Nos.</span><span>Category</span><span>QTY</span><span>Weight</span></div>`;

  const rows = [];
  containers.forEach((ct) => {
    rows.push(
      `<div class="mk-crow">${esc(ct.container_number)} ${esc(ct.size)}${esc(ct.type)} &nbsp; Seal: ${esc(c.seal_no) || "-"} &nbsp; ${ct.pkgs} PKGS &nbsp; ${ct.weight.toFixed(3)} KGS</div>`,
      tblHead,
    );
    const merged = {};
    ct.items.forEach((i) => {
      const key = `${i.order_no || ""}||${i.marks || ""}||${catName(i)}`;
      if (!merged[key])
        merged[key] = {
          order_no: i.order_no,
          marks: i.marks || "",
          category: catName(i),
          type: i.type,
          pkgs: 0,
          weight: 0,
        };
      merged[key].pkgs += Number(i.pkgs) || 0;
      merged[key].weight += Number(i.weight) || 0;
    });
    Object.values(merged).forEach((m) => {
      rows.push(
        `<div class="mk-line"><span>${esc(m.order_no)}</span><span>${nl(m.marks)}</span><span>${esc(m.category)}</span><span>${m.pkgs} ${esc(m.type)}</span><span>${m.weight.toFixed(3)} KGS</span></div>`,
      );
    });
  });
  const p1Rows = rows.slice(0, ROWS_P1);
  const overflow = rows.slice(ROWS_P1);
  const contChunks = [];
  for (let n = 0; n < overflow.length; n += ROWS_CONT)
    contChunks.push(overflow.slice(n, n + ROWS_CONT));
  const totalPages = 2 + contChunks.length;

  const freight = (h) => `
    <div class="mk-frow mk-fhead"><div>Freight &amp; Charges</div><div>Rate</div><div>Unit</div><div>Currency</div><div>Prepaid</div><div>Collect</div></div>
    <div class="mk-frow mk-fbody" style="height:${h}px;"><div></div><div></div><div></div><div></div><div>${c.payment_type === "Prepaid" ? "PREPAID" : ""}</div><div>${c.payment_type === "Collect" ? "COLLECT" : ""}</div></div>`;

  const logo = company?.logo_url
    ? `<img src="${esc(company.logo_url)}" alt="${esc(companyName)}" style="max-height:48px;max-width:170px;object-fit:contain;">`
    : "";

  const page1 = `
  <div class="mk-page">
    <div class="mk-frame">
      <div class="mk-head">
        <div class="mk-brand">${logo}</div>
        <div class="mk-head-mid">
          <div class="mk-title">MASTER BILL OF LADING</div>
          <div class="mk-sub">NON-NEGOTIABLE</div>
        </div>
        <div class="mk-head-no">
          <span class="mk-label">B/L No.</span>
          <div class="mk-content">${esc(c.consignment_number)}</div>
        </div>
      </div>
      <div class="mk-upper">
        <div>
          <div class="mk-cell" style="min-height:80px;"><span class="mk-label">Shipper</span>
            <div class="mk-content">${esc(c.shipper)}<br>${nl(c.shipper_address)}${c.shipper_contact ? `<br>Tel: ${esc(c.shipper_contact)}` : ""}</div></div>
          <div class="mk-cell" style="min-height:80px;"><span class="mk-label">Consignee</span>
            <div class="mk-content">${esc(c.consignee)}<br>${nl(c.consignee_address)}${c.consignee_contact ? `<br>Tel: ${esc(c.consignee_contact)}` : ""}</div></div>
          <div class="mk-cell" style="min-height:60px;"><span class="mk-label">Notify Party</span>
            <div class="mk-content">Same as Consignee</div></div>
        </div>
        <div>
          <div class="mk-cell" style="min-height:48px;"><span class="mk-label">Export References</span><div class="mk-content" style="font-size:11px;">${esc(c.eform)}${c.eform_date ? ` / ${esc(c.eform_date)}` : ""}${c.customs_crn ? `<br>CRN: ${esc(c.customs_crn)}` : ""}</div></div>
          <div class="mk-cell" style="min-height:150px;"><div class="mk-small">This contract is subject to the standard terms, conditions and exceptions of ${esc(companyName)}, including the limitation of liability and the law and jurisdiction clauses. Full terms are printed on page ${totalPages}.</div></div>
          <div class="mk-cell" style="min-height:48px;"><span class="mk-label">Carrier / Shipping Line</span><div class="mk-content" style="font-size:11px;">${esc(c.shipping_line_name)}</div></div>
        </div>
      </div>
      <div class="mk-route">
        <div class="mk-cell" style="min-height:42px;"><span class="mk-label">Vessel</span><div class="mk-content">${esc(c.vessel_name)}</div></div>
        <div class="mk-cell"><span class="mk-label">Voyage No.</span><div class="mk-content">${esc(c.voyage)}</div></div>
        <div class="mk-cell"><span class="mk-label">Status</span><div class="mk-content">${esc(c.status)}</div></div>
        <div class="mk-cell" style="min-height:42px;"><span class="mk-label">Port of Loading</span><div class="mk-content">${esc(c.origin)}</div></div>
        <div class="mk-cell"><span class="mk-label">Port of Discharge</span><div class="mk-content">${esc(c.destination)}</div></div>
        <div class="mk-cell"><span class="mk-label">Place of Delivery</span><div class="mk-content">${esc(c.destination)}</div></div>
      </div>
      <div class="mk-band">PARTICULARS FURNISHED BY SHIPPER</div>
      <div class="mk-desc">
        <div class="mk-dcol">
          <span class="mk-label">Kind of Packages; Description of goods; Marks and Numbers; Container No./Seal No.</span>
          <div class="mk-content mk-dtext">
            ${sob ? `SHIPPED ON BOARD ${esc(vesselLine)} ON ${esc(sob)} AT ${esc(c.origin)}<br><br>` : ""}
            ${totals.containers} CONTAINER(S) SAID TO CONTAIN ${totals.pkgs} PACKAGES<br>
            ${esc(goods)}
            ${p1Rows.join("")}
            ${overflow.length ? `<div class="mk-cont">CONTINUED ON PAGE 2 ...</div>` : ""}
          </div>
        </div>
        <div class="mk-dcol"><span class="mk-label">Weight</span><div class="mk-content" style="margin-top:14px;">${Number(totals.weight).toFixed(3)} KGS</div></div>
        <div class="mk-dcol mk-last"><span class="mk-label">Measurement</span></div>
      </div>
      ${freight(60)}
      <div class="mk-foot">
        <div>
          <div class="mk-cell"><span class="mk-label">Carrier's Receipt. Total number of containers or packages received by Carrier</span><div class="mk-content">${totals.containers} container(s) / ${totals.pkgs} packages</div></div>
          <div class="mk-two">
            <div class="mk-cell"><span class="mk-label">Place of Issue of B/L</span><div class="mk-content" style="font-size:11px;">${esc(c.origin)}</div></div>
            <div class="mk-cell"><span class="mk-label">Date of Issue</span><div class="mk-content" style="font-size:11px;">${issueDate}</div></div>
          </div>
          <div class="mk-two">
            <div class="mk-cell"><span class="mk-label">Shipped on Board Date</span><div class="mk-content" style="font-size:11px;">${esc(sob)}</div></div>
            <div class="mk-cell"><span class="mk-label">Declared Value Charges</span></div>
          </div>
        </div>
        <div>
          <div class="mk-cell" style="min-height:64px;"><div class="mk-small">Shipped, as far as ascertained by reasonable means of checking, in apparent good order and condition unless otherwise stated herein.</div></div>
          <div class="mk-sign">
            <span class="mk-label">Signed for the Carrier</span>
            ${showSig ? `<img class="mk-sig-img" src="${esc(company.signature_url)}" alt="">` : `<div style="height:56px;"></div>`}
            <div class="mk-signname">${esc(companyName)}</div>
            <div class="mk-line-sig"></div>
            <span class="mk-label">As Agents</span>
          </div>
        </div>
      </div>
    </div>
    ${watermark}
    <div class="mk-pgno">This transport document has ${totalPages} numbered pages &nbsp;|&nbsp; Page 1 of ${totalPages}</div>
  </div>`;

  const contPages = contChunks.map(
    (chunk, idx) => `
  <div class="mk-page">
    <div class="mk-frame">
      <div class="mk-p2head"><span>B/L: <b>${esc(c.consignment_number)}</b></span><span>Page: ${idx + 2}</span></div>
      <div class="mk-terms" style="min-height:900px;">${/^<div class="mk-(crow|tbl-head)"/.test(chunk[0]) ? "" : tblHead}${chunk.join("")}</div>
    </div>
    ${watermark}
    <div class="mk-pgno">Page ${idx + 2} of ${totalPages}</div>
  </div>`,
  );

  const cn = esc(companyName);
  const page2 = `
  <div class="mk-page">
    <div class="mk-frame">
      <div class="mk-p2head"><span>B/L: <b>${esc(c.consignment_number)}</b></span><span>Page: ${totalPages}</span></div>
      <div class="mk-terms">
        <strong>By accepting this document, the Merchant agrees to the following terms:</strong>
        <ol>
          <li>Carriage is performed under ${cn}'s standard terms and applicable international conventions. All cargo details supplied must be true and complete.</li>
          <li>Transit times are estimates only. Delays may occur due to weather, customs, port congestion, operational issues or carrier schedules.</li>
          <li>Customs scanning, inspections or port delays may incur extra charges payable by the Merchant.</li>
          <li>Liability for loss or damage shall not exceed the freight value or USD 50 per package unless a higher value is declared and agreed in writing beforehand.</li>
          <li>The Merchant confirms lawful ownership of goods and accepts full responsibility for any illegal, prohibited or undeclared items shipped.</li>
          <li>Cargo is carried at Merchant's risk unless the Merchant arranges separate insurance. ${cn} is not liable for indirect or consequential losses.</li>
          <li>Claims must be notified immediately in writing and within legal time limits. Late claims may be void.</li>
          <li>${cn} may use third-party carriers or subcontractors; all their protections and liability limits apply equally to ${cn}.</li>
          <li>This B/L applies only to consignment ${esc(c.consignment_number)}.</li>
          <li>Governed by UAE law; disputes fall under Dubai courts unless agreed otherwise.</li>
        </ol>
        <strong>SHIPPER'S LOAD, STOW, WEIGHT AND COUNT</strong><br>
        <strong>${c.payment_type === "Prepaid" ? "FREIGHT PREPAID" : c.payment_type === "Collect" ? "FREIGHT COLLECT" : ""}</strong>
      </div>
      ${freight(150)}
    </div>
    ${watermark}
    <div class="mk-pgno">Page ${totalPages} of ${totalPages}</div>
  </div>`;

  return [page1, page2];
};

export const MasterBillOfLading = (orderData, company, opts = {}) => {
  const list = orderData?.mblList || [];
  const pages = list.length
    ? list.flatMap((d) => buildMblPages(d, company, opts.variant))
    : [
        `<div class="mk-page"><div class="mk-content mk-dtext">No consignment is linked to this order yet.</div></div>`,
      ];
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Master Bill of Lading</title><style>${mblCss(company)}</style></head><body>${pages.join("")}</body></html>`;
};

const dmy = (v, sep = "-") => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}${sep}${p(d.getMonth() + 1)}${sep}${d.getFullYear()}`;
};
const kg = (n) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const emptyDoc = (title) =>
  `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title></head><body><p style="font-family:Arial;font-weight:bold;">No consignment is linked to this order yet.</p></body></html>`;

export const WharfageConsignmentNote = (orderData) => {
  const list = orderData?.mblList || [];
  if (!list.length) return emptyDoc("Wharfage Consignment Note");
  const today = new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");

  const pages = list.map((d) => {
    const c = d.consignment || {};
    const cts = d.containers || [];
    const totals = d.totals || { pkgs: 0, weight: 0 };
    const net = Number(c.net_weight) || totals.weight;
    const gross = Number(c.gross_weight) || net;
    const ratio = totals.weight > 0 ? gross / totals.weight : 1;
    const comm = [
      ...new Set(
        cts.flatMap((ct) => ct.items.map((i) => i.category).filter(Boolean)),
      ),
    ].join(", ");
    const forms = (d.orders || [])
      .map((o) => o.rgl_booking_number)
      .filter(Boolean)
      .join(", ");
    const bySize = {};
    cts.forEach((ct) => {
      bySize[ct.size] = (bySize[ct.size] || 0) + 1;
    });
    const status = Object.entries(bySize)
      .map(([s, n]) => `${String(n).padStart(2, "0")}X${s}`)
      .join(" + ");
    const blank = "_________";
    const v = (x) => (x ? esc(x) : blank);

    return `
    <div class="container wf-page">
      <div class="header">
        <div class="date-row">DATED: ${today}</div>
        <div class="title">CONSIGNMENT NOTE: ${v(c.consignment_number)}</div>
      </div>
      <div class="top-boxes">
        <div class="box"><div class="box-label">Custom CRN or Customs Machine number</div><div class="box-content">${v(c.customs_crn)}</div></div>
        <div class="box"><div class="box-label"><div class="container-info"><span>Container No:</span></div></div>
          <div class="box-content" style="padding:0;">
            ${cts.length ? cts.map((ct, i) => `<div style="width:100%;text-align:center;box-sizing:border-box;padding:8px;border-bottom:${i < cts.length - 1 ? "1px solid #ccc" : "none"};">${esc(ct.container_number)}</div>`).join("") : '<div style="padding:8px;">N/A</div>'}
          </div></div>
        <div class="box"><div class="box-label">Seal No</div><div class="box-content">${v(c.seal_no)}</div></div>
      </div>
      <div class="details-grid">
        <div><strong>VESSEL:</strong> ${v(c.vessel_name)}</div>
        <div><strong>Voyage:</strong> ${v(c.voyage)}</div>
        <div><strong>SHIPPING LINE:</strong> ${v(c.shipping_line_name)}</div>
        <div><strong>Dest:</strong> ${v(c.destination)}</div>
        <div><strong>Shipper:</strong> ${v(c.shipper)}</div>
        <div><strong>BOOKING NO:</strong> ${v(forms)}</div>
        <div><strong>Comm:</strong> ${v(comm)}</div>
        <div><strong>Origin:</strong> ${v(c.origin)}</div>
        <div><strong>GROSS Wt:</strong> <span class="underline">${kg(gross)} KGS</span><br><strong>NET Wt:</strong> <span class="underline">${kg(net)} KGS</span></div>
        <div><strong>Status:</strong> ${v(status)}</div>
        <div><strong class="underline">TRUCK NO</strong> ${v((d.trucks || []).join(", "))}</div>
        <div><strong>TOTAL CTNS:</strong> <span class="underline">${Number(totals.pkgs).toLocaleString()} PKGS</span></div>
      </div>
      ${cts
        .map(
          (ct) => `
      <div class="summary-bar">
        <div class="summary-box">${esc(ct.container_number)}</div>
        <div class="summary-text">PKGS: ${Number(ct.pkgs).toLocaleString()} &nbsp; GROSS WT: ${kg(ct.weight * ratio)} KGS &nbsp; NET WT: ${kg(ct.weight)} KGS</div>
      </div>`,
        )
        .join("")}
      <div class="certification-box">I / We hereby certify that goods mentioned in the accompanied packing list have been placed inside the container and the container has been sealed by me / us the particulars are true.</div>
      <div class="footer">
        <div class="sign-block"><div class="sign-line"></div>PICT/KICT/QICT Representative<br>Gate Clerk / Dmg Inspector</div>
        <div class="sign-block text-right"><div class="sign-line"></div>Name and Signature of Agent<br>Shipper / Consolidator with stamp</div>
      </div>
    </div>`;
  });

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Wharfage Consignment Note</title>
<style>
body{font-family:Arial,sans-serif;font-size:13px;color:#000;line-height:1.4;padding:20px;}
.container{max-width:850px;margin:0 auto;padding:20px;}
.header{text-align:center;margin-bottom:20px;}
.date-row{text-align:right;font-weight:bold;margin-bottom:10px;}
.title{font-weight:bold;text-decoration:underline;font-size:16px;}
.top-boxes{display:flex;gap:20px;margin-bottom:30px;}
.box{flex:1;border:1px solid #000;}
.box-label{padding:2px 5px;border-bottom:1px solid #000;min-height:35px;}
.box-content{min-height:30px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px;}
.container-info{display:flex;gap:10px;align-items:center;}
.details-grid{display:grid;grid-template-columns:1.2fr 1.2fr 1fr;gap:15px 10px;margin-bottom:40px;}
.underline{border-bottom:1px solid #000;display:inline-block;min-width:80px;}
.summary-bar{display:flex;align-items:center;gap:30px;margin-bottom:5px;}
.summary-box{border:1px solid #000;padding:10px 40px;font-weight:bold;min-width:200px;}
.summary-text{font-weight:bold;}
.certification-box{border:1px solid #000;padding:15px;margin:30px 0 100px;width:90%;}
.footer{display:flex;justify-content:space-between;}
.sign-block{width:300px;}
.sign-line{border-top:1px solid #000;margin-bottom:5px;}
.text-right{text-align:left;}
.wf-page:not(:last-child){page-break-after:always;}
@media print{body{background:#fff;padding:0;}}
</style></head><body>${pages.join("")}</body></html>`;
};

export const RickmersBillOfLading = (orderData) => {
  const list = orderData?.mblList || [];
  if (!list.length) return emptyDoc("Rickmers Bill of Lading");

  const pages = list.flatMap((d) => {
    const c = d.consignment || {};
    const cts = d.containers || [];
    const totals = d.totals || { pkgs: 0, weight: 0 };
    const up = (x) => esc(String(x || "").toUpperCase());
    const addr = (x) =>
      x ? esc(String(x).toUpperCase()).replace(/\r?\n/g, "<br>") : "";
    const forms = (d.orders || [])
      .map((o) => o.rgl_booking_number)
      .filter(Boolean)
      .join(", ");
    const goods = [
      ...new Set(
        cts.flatMap((ct) =>
          ct.items.map((i) =>
            i.subcategory ? `${i.category} - ${i.subcategory}` : i.category,
          ),
        ),
      ),
    ].join(", ");
    const marks = [
      ...new Set(
        cts.flatMap((ct) => ct.items.map((i) => i.marks).filter(Boolean)),
      ),
    ].join(", ");
    const voyage = c.voyage
      ? /^v/i.test(c.voyage)
        ? c.voyage
        : `V-${c.voyage}`
      : "";
    const vesselVoyage = [c.vessel_name, voyage].filter(Boolean).join(" ");
    const sob = d.shipped_on_board
      ? new Date(d.shipped_on_board)
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .toUpperCase()
      : "";
    const prepaid = c.payment_type === "Prepaid" ? "PREPAID" : "";
    const collect = c.payment_type === "Collect" ? "COLLECT" : "";

    const header = (sub, extra = "") => `
      <div class="header-row">
        <div class="logo-block"><img src="${logoRickmers}" alt="Rickmers Container Line" /></div>
        <div class="center-title"><div class="nn">NON NEGOTIABLE</div>${sub}</div>
        ${extra}
      </div>`;

    const rows = cts.length
      ? cts
          .map(
            (ct) => `
        <tr>
          <td>${esc(ct.container_number)} / ${esc(c.seal_no)}</td>
          <td>${ct.pkgs}<br>PKGS</td>
          <td></td>
          <td class="desc-cell">SHIPPER'S LOAD AND COUNT<br>1X${esc(ct.size)}${esc(ct.type)} CONTAINER(S)</td>
          <td>${Number(ct.weight).toFixed(2)}KGS</td>
          <td></td>
        </tr>`,
          )
          .join("")
      : `<tr><td colspan="6">&nbsp;</td></tr>`;

    const page1 = `
    <div class="page">
      <div class="page-number">PAGE: 1 OF 2</div>
      ${header(
        `<div class="bl-sub">SEA WAYBILL</div><div class="bl-sub">BILL OF LADING</div>`,
        `<div class="booking-info">BOOKING NO.<br><b>${esc(forms)}</b><br><br>SEA WAYBILL NO.<br><b>${esc(c.consignment_number)}</b></div>`,
      )}
      <table class="bl-table">
        <tr>
          <td style="width:50%;"><span class="label">SHIPPER/EXPORTER</span><b>${up(c.shipper)}</b><br>${addr(c.shipper_address)}</td>
          <td style="width:50%;"><span class="label">EXPORT REFERENCES (for the Merchant's and/or Carrier's reference only. See back clause 8. (4))</span>${esc(c.eform)}</td>
        </tr>
        <tr>
          <td><span class="label">CONSIGNEE</span><b>${up(c.consignee)}</b><br>${addr(c.consignee_address)}</td>
          <td rowspan="2"><span class="label">FORWARDING AGENT-REFERENCES<br>FMC NO.</span>ROYAL GULF SHIPPING &amp; LOGISTICS<br>DUBAI , UAE . TEL043331785</td>
        </tr>
        <tr>
          <td><span class="label">NOTIFY PARTY (It is agreed that no responsibility shall be attached to the Carrier or its Agents for failure to notify)</span><b>${up(c.consignee)}</b><br>${addr(c.consignee_address)}</td>
        </tr>
        <tr>
          <td colspan="2" class="remarks-cell">RECEIVED by the Carrier in apparent good order and condition (unless otherwise stated herein) the total number or quantity of Containers or other packages or units indicated in the box entitled "Carrier's Receipt", to be carried subject to all the terms and conditions hereof from the Place of Receipt or Port of Loading to the Port of Discharge or Place of Delivery, as applicable. Delivery of the Goods to the Carrier for Carriage hereunder constitutes acceptance by the Merchant (as defined hereinafter) (i) of all the terms and conditions, whether printed, stamped or otherwise incorporated on this side and on the reverse side of this Bill of lading and the terms and conditions of the Carrier's applicable tariff(s) as if they were all signed by the Merchant, and (ii) that any prior representations and/or agreements for or in connection with Carriage of the Goods are superseded by this Bill of Lading. If this is a non-negotiable (straight) Bill of Lading, or where issued as a Sea Waybill, the Carrier shall deliver the Goods or issue a Delivery Order or the pin codes for any applicable Electronic Release System (after payment of outstanding Freight) to the named consignee against the surrender of one original Bill of Lading, or in the case of a Sea Waybill, on production of such reasonable proof of identify as may be required by the Carrier, or in accordance with the national law at the Port of Discharge or Place of Delivery as applicable.</td>
        </tr>
        <tr>
          <td><span class="label">PRE-CARRIAGE BY</span><br><span class="label" style="margin-top:6px;">PLACE OF RECEIPT</span>${up(c.origin)}</td>
          <td><span class="label">TYPE OF MOVEMENT (IF MIXED, USE DESCRIPTION OF PACKAGES AND GOODS FIELD)</span>FCL / FCL &nbsp;&nbsp;&nbsp; CY / CY</td>
        </tr>
        <tr>
          <td><span class="label">OCEAN VESSEL VOYAGE NO. FLAG</span>${up(vesselVoyage)}<br><br><span class="label">PORT OF LOADING</span>${up(c.origin)}</td>
          <td><span class="label">FINAL DESTINATION (for the Merchant's reference only)</span></td>
        </tr>
        <tr>
          <td><span class="label">PORT OF DISCHARGE</span>${up(c.destination)}</td>
          <td><span class="label">PLACE OF DELIVERY</span>${up(c.destination)}</td>
        </tr>
      </table>

      <div class="note-text">(CHECK "HM" COLUMN IF HAZARDOUS MATERIAL)</div>
      <div class="note-text" style="color:#1a3d8f;">PARTICULARS DECLARED BY SHIPPER BUT NOT ACKNOWLEDGED BY THE CARRIER</div>

      <table class="bl-table goods-table">
        <tr>
          <td style="width:20%;"><span class="label">CNTR. NOS. W/SEAL NOS. MARKS &amp; NUMBERS</span></td>
          <td style="width:12%;"><span class="label">QUANTITY (FOR CUSTOMS DECLARATION ONLY)</span></td>
          <td style="width:3%;">H<br>M</td>
          <td style="width:35%;" class="desc-cell"><span class="label">DESCRIPTION OF GOODS</span></td>
          <td style="width:15%;"><span class="label">GROSS WEIGHT</span></td>
          <td style="width:15%;"><span class="label">GROSS MEASUREMENT</span></td>
        </tr>
        ${rows}
        <tr>
          <td>${marks ? up(marks) : "NO MARKS"}</td>
          <td>${totals.pkgs}<br>PKGS</td>
          <td></td>
          <td class="desc-cell">${up(goods)}<br><br>14 COMBINED FREE DAYS AT DESTINATION</td>
          <td>${Number(totals.weight).toFixed(2)}KGS</td>
          <td></td>
        </tr>
      </table>

      <div class="note-text" style="font-weight:bold;">** TO BE CONTINUED ON ATTACHED LIST **</div>

      <table class="bl-table" style="margin-top:15px;">
        <tr>
          <td style="width:33%;"><span class="label" style="color:#c0392b;">Declared Cargo Value US $</span><span style="font-size:8px;">If Merchant enters a value, Carrier's limitation of liability shall not apply and the ad valorem rate will be charged.</span></td>
          <td style="width:34%;"><span class="label">FREIGHT &amp; CHARGES PAYABLE AT / BY</span>${up(c.origin)}</td>
          <td style="width:33%;"><span class="label">(if) ORIGINAL BILL(S) HAVE BEEN SIGNED</span></td>
        </tr>
        <tr>
          <td colspan="3">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="border:1px solid #999;padding:3px;font-size:8.5px;">CODE</td>
                <td style="border:1px solid #999;padding:3px;font-size:8.5px;">TARIFF ITEM</td>
                <td style="border:1px solid #999;padding:3px;font-size:8.5px;">FREIGHTED AS</td>
                <td style="border:1px solid #999;padding:3px;font-size:8.5px;">RATE</td>
                <td style="border:1px solid #999;padding:3px;font-size:8.5px;">PREPAID</td>
                <td style="border:1px solid #999;padding:3px;font-size:8.5px;">COLLECT</td>
              </tr>
              <tr>
                <td style="border:1px solid #999;padding:8px;"></td>
                <td style="border:1px solid #999;padding:8px;"></td>
                <td style="border:1px solid #999;padding:8px;"></td>
                <td style="border:1px solid #999;padding:8px;"></td>
                <td style="border:1px solid #999;padding:8px;">${prepaid}</td>
                <td style="border:1px solid #999;padding:8px;">${collect}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div class="signature-block">
        DATE CARGO RECEIVED<br><br>
        DATE LADEN ON BOARD<br><b>${sob}</b><br><br>
        PLACE OF BILL(S) ISSUE<br><b>${up(c.origin)}</b><br><br>
        DATED<br><br>
        SIGNED<br>BY: <b>RICKMERS CONTAINER LINE</b><br>as agent for and on behalf of
      </div>
      <div class="footer-note" style="text-align:right;margin-top:20px;">RICKMERS CONTAINER LINE<br>AS CARRIER</div>
    </div>`;

    const page2 = `
    <div class="page">
      <div class="page-number">PAGE: 2 OF 2</div>
      ${header(`<div class="bl-sub">BILL OF LADING</div>`)}
      <div style="display:flex;justify-content:space-between;font-size:10px;border-top:1px solid #999;border-bottom:1px solid #999;padding:5px 0;margin-top:10px;">
        <div>VESSEL VOYAGE: ${up(vesselVoyage)}</div>
        <div>B/L NO.: ${esc(c.consignment_number)}</div>
      </div>
      <table class="bl-table" style="margin-top:10px;">
        <tr>
          <td style="width:20%;"><span class="label">CNTR/SEAL NOS. MARKS &amp; NUMBERS</span></td>
          <td style="width:15%;"><span class="label">QUANTITY FOR CUSTOMS DECLARATION ONLY</span></td>
          <td style="width:3%;">H<br>M</td>
          <td style="width:35%;" class="desc-cell"><span class="label">DESCRIPTION OF GOODS</span></td>
          <td style="width:13%;"><span class="label">GROSS WEIGHT</span></td>
          <td style="width:14%;"><span class="label">MEASUREMENT</span></td>
        </tr>
        <tr>
          <td></td><td></td><td></td>
          <td class="desc-cell">E FORM ${esc(c.eform)}<br>DATED: ${dmy(c.eform_date)}</td>
          <td></td><td></td>
        </tr>
      </table>
      <div class="footer-note">
        OCEAN FREIGHT ${prepaid || collect || "PREPAID"}<br>
        DESTINATION CHARGES COLLECT PER LINE TARIFF AND OTHER CHARGES TO BE COLLECTED FROM<br>
        THE PARTY WHO LAWFULLY DEMANDS DELIVERY OF THE CARGO WITHOUT PREJUDICE TO THE<br>
        CARRIER'S RIGHTS AGAINST THE MERCHANT (SEE BACK CLAUSE 1) AS SET OUT AT BACK<br>
        CLAUSE 13(1)
      </div>
      <div class="signature-block" style="margin-top:200px;">SIGNED<br>BY: <b>RICKMERS CONTAINER LINE</b><br>as agent for and on behalf of</div>
      <div class="footer-note" style="text-align:right;margin-top:20px;">RICKMERS CONTAINER LINE<br>AS CARRIER</div>
    </div>`;

    return [page1, ...contPages, page2];
  });

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Rickmers Bill of Lading</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Courier New',monospace;font-size:11px;background-color:#f5f5f5;padding:20px;color:#000;}
.page{width:900px;margin:0 auto 20px auto;background:#fff;padding:25px 30px;box-shadow:0 0 10px rgba(0,0,0,0.1);position:relative;}
.page:not(:last-child){page-break-after:always;}
.page-number{position:absolute;top:15px;right:20px;font-size:10px;}
.header-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
.logo-block img{height:50px;}
.center-title{text-align:center;flex-grow:1;}
.center-title .nn{color:#1a3d8f;font-weight:bold;font-size:14px;letter-spacing:1px;}
.center-title .bl-sub{color:#1a3d8f;font-size:10px;}
.booking-info{text-align:right;font-size:10px;}
table.bl-table{width:100%;border-collapse:collapse;border:1px solid #999;margin-top:10px;}
table.bl-table td{border:1px solid #999;padding:4px 6px;vertical-align:top;font-size:10px;}
.label{color:#1a3d8f;font-size:8.5px;display:block;margin-bottom:2px;}
.remarks-cell{font-size:8px;line-height:1.3;}
.goods-table td{text-align:center;font-size:10px;}
.goods-table .desc-cell{text-align:left;}
.note-text{font-size:9px;margin-top:8px;}
.footer-note{margin-top:15px;font-size:9px;line-height:1.5;}
.signature-block{margin-top:30px;text-align:right;font-size:10px;}
@media print{@page{size:A4 landscape;margin:0;}body{background:#fff;padding:0;}.page{box-shadow:none;}}
</style></head><body>${pages.join("")}</body></html>`;
};
