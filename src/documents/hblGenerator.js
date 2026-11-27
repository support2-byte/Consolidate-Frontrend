export const buildHblPages = (orderData, company, getPlaceName, opts = {}) => {
  const tpl = detectTemplate(company);
  const build = {
    rgsl: classicPage,
    messiah: classicPage,
    cas: casPage,
    rickmers: rickmersPages,
  }[tpl];
  return (Array.isArray(orderData) ? orderData : [orderData]).flatMap((o) => {
    const d = collect(o, company, getPlaceName, tpl, opts);
    return d.groups.map((g) => build(d, g));
  });
};

export const hblCss = (company) => {
  const tpl = detectTemplate(company);
  return (
    BASE_CSS +
    {
      rgsl: CLASSIC_CSS,
      messiah: CLASSIC_CSS,
      cas: CAS_CSS,
      rickmers: RK_CSS,
    }[tpl]
  );
};

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const br = (v) => esc(v).replace(/\r?\n/g, "<br>");
const pad2 = (n) => String(n).padStart(2, "0");
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const toDate = (v) => {
  const x = v ? new Date(v) : new Date();
  return isNaN(x.getTime()) ? new Date() : x;
};
const fmtSlash = (v) => {
  const d = toDate(v);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const fmtDash = (v) => fmtSlash(v).replace(/\//g, "-");
const fmtMon = (v) => {
  const d = toDate(v);
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const fmtWt = (n, dp = 2) => Number(n || 0).toFixed(dp);

const fmtSize = (size, type) => {
  const s = String(size ?? "").trim();
  const t = String(type ?? "")
    .trim()
    .toUpperCase();
  if (!s) return "";
  if (/^\d+$/.test(s)) return `${s}'${t}`;
  return s;
};

const unitFor = (types) => {
  const u = [
    ...new Set(
      types.filter(Boolean).map((t) => String(t).trim().toUpperCase()),
    ),
  ];
  if (u.length !== 1) return "PKGS";
  const t = u[0];
  if (t.endsWith("S")) return t;
  if (/(X|CH|SH)$/.test(t)) return `${t}ES`;
  return `${t}S`;
};

const detectTemplate = (company) => {
  const key = String(
    company?.hbl_template || company?.company || "",
  ).toLowerCase();
  if (key.includes("cargo aviation") || key === "cas") return "cas";
  if (key.includes("messiah")) return "messiah";
  if (key.includes("rickmers")) return "rickmers";
  return "rgsl";
};

const BRAND_NAMES = {
  rgsl: "ROYAL GULF SHIPPING & LOGISTICS LLC",
  cas: "CARGO AVIATION SYSTEMS",
  messiah: "MESSIAH FREIGHT & DISTRIBUTORS UK LTD",
  rickmers: "RICKMERS CONTAINER LINE",
};

const TERMINAL_NOTE = [
  "All Terminal Charges & Demurrage",
  "Etc at the port of Discharge/",
  "Destination as per line's tariff",
  "& At the Account of Consingee.",
];

const FINE_PRINT =
  "RECEIVED for shipment specified above in apparent good order and condition unless otherwise stated. The Goods to be delivered at above mentioned Port of Discharge or Place of Delivery, whichever applies. SUBJECT TO Terms and Conditions contained on reverse side hereof, to which Merchant agrees by accepting this Bill of Lading. IN WITNESS WHEREOF the number of original Bills of lading stated on this side next to this clause have been signed, one of which being accomplished, the others to stand void, unless compulsorily applicable law provides otherwise. *Applicable only when used for MULTI MODAL TRANSPORTATION.";

const RK_CLAUSE =
  "RECEIVED by the Carrier in apparent good order and condition (unless otherwise stated herein) the total number or quantity of Containers or other packages or units indicated in the box entitled \"Carrier's Receipt\", to be carried subject to all the terms and conditions hereof from the Place of Receipt or Port of Loading to the Port of Discharge or Place of Delivery, as applicable. Delivery of the Goods to the Carrier for Carriage hereunder constitutes acceptance by the Merchant (as defined hereinafter) (i) of all the terms and conditions, whether printed, stamped or otherwise incorporated on this side and on the reverse side of this Bill of lading and the terms and conditions of the Carrier's applicable tariff(s) as if they were all signed by the Merchant, and (ii) that any prior representations and/or agreements for or in connection with Carriage of the Goods are superseded by this Bill of Lading. If this is a negotiable (To Order/of) Bill of Lading, one original Bill of Lading, duly endorsed must be surrendered by the Merchant to the Carrier (together with any outstanding Freight) in exchange for the Goods or a Delivery Order or the pin codes for any applicable Electronic Release System. If this is a non-negotiable (straight) Bill of Lading, or where issued as a Sea Waybill, the Carrier shall deliver the Goods or issue a Delivery Order or the pin codes for any applicable Electronic Release System (after payment of outstanding Freight) to the named consignee against the surrender of one original Bill of Lading, or in the case of a Sea Waybill, on production of such reasonable proof of identify as may be required by the Carrier, or in accordance with the national law at the Port of Discharge or Place of Delivery as applicable. IN WITNESS WHEREOF the Carrier or their Agent has signed the number of Bills of Lading stated at the top, all of this tenor and date, and whenever one original Bill of Lading has been surrendered all other Bills of Lading shall be void.";

const collect = (orderData, company, getPlaceName, tpl, opts = {}) => {
  const order = orderData || {};
  const consignment = order.consignment || {};

  const place = (id) =>
    (typeof getPlaceName === "function" ? getPlaceName(id) : id) || "N/A";

  const pol = place(order.place_of_loading);
  const pod = place(order.place_of_discharge || order.final_destination);
  const pdel = place(order.place_of_delivery || order.final_destination);
  const por = order.place_of_receipt ? place(order.place_of_receipt) : pol;

  const orderNumber = order.rgl_booking_number || `ORD-${order.id}`;
  const sealDefault = consignment.seal_no || order.seal_no || "N/A";
  const freeDays = Number(order.free_days ?? consignment.free_days ?? 14) || 0;

  const receivers =
    order.receivers && order.receivers.length ? order.receivers : [{}];

  const groups = receivers.map((r) => {
    const details = r.shippingdetails || [];
    const map = new Map();
    const goods = [];
    const types = [];
    let totalPkgs = 0;
    let totalWeight = 0;

    details.forEach((item) => {
      let pkgs = 0;
      let weight = 0;
      if (item.containerDetails && item.containerDetails.length > 0) {
        item.containerDetails.forEach((cd) => {
          const p = Number(cd.assign_total_box) || 0;
          const w = Number(cd.assign_weight) || 0;
          pkgs += p;
          weight += w;
          const c = cd.container || {};
          const no = c.container_number || cd.container_number || "N/A";
          const row = map.get(no) || {
            no,
            size: fmtSize(
              c.size || cd.size,
              c.containerType || cd.containerType,
            ),
            seal: c.seal_no || cd.seal_no || sealDefault,
            pkgs: 0,
            weight: 0,
          };
          row.pkgs += p;
          row.weight += w;
          map.set(no, row);
        });
      } else {
        pkgs = parseInt(item.totalNumber) || 0;
        weight = parseFloat(item.weight) || 0;
      }
      totalPkgs += pkgs;
      totalWeight += weight;
      const cat = item.category || "N/A";
      const desc = item.subcategory ? `${cat} - ${item.subcategory}` : cat;
      if (!goods.includes(desc)) goods.push(desc);
      types.push(item.type);
    });

    let containers = [...map.values()];
    if (!containers.length) {
      const raw = (r.containers || [])
        .map((c) =>
          typeof c === "string" ? c : c?.container_number || c?.containerNo,
        )
        .filter(Boolean);
      containers = raw.map((no) => ({
        no,
        size: fmtSize(),
        seal: sealDefault,
        pkgs: raw.length === 1 ? totalPkgs : 0,
        weight: raw.length === 1 ? totalWeight : 0,
      }));
    }
    if (!containers.length) {
      containers = [
        {
          no: "N/A",
          size: fmtSize(),
          seal: sealDefault,
          pkgs: totalPkgs,
          weight: totalWeight,
        },
      ];
    }

    const bySize = {};
    containers.forEach((c) => {
      bySize[c.size || ""] = (bySize[c.size || ""] || 0) + 1;
    });
    const countLabel = Object.entries(bySize)
      .map(([s, n]) => `${pad2(n)}${s ? `X${s}` : ""}`)
      .join(" + ");

    return {
      consignee: {
        name: r.receiverName || r.receivername || r.receiver_name || "N/A",
        address:
          r.receiverAddress || r.receiveraddress || r.receiver_address || "",
      },
      marks:
        r.receiver_marks_and_number ||
        r.marksandnumber ||
        r.marksAndNumber ||
        r.receiverMarksAndNumber ||
        "",
      containers,
      totalPkgs,
      totalWeight,
      unit: unitFor(types),
      goods: goods.join(", ") || "N/A",
      countLabel,
    };
  });

  return {
    tpl,
    customText: String(opts?.customText ?? "").trim(),
    carrier:
      tpl === "rgsl" ? company?.company || BRAND_NAMES.rgsl : BRAND_NAMES[tpl],
    logo: company?.logo_url || "",
    stamp: company?.stamp_url || "",
    qr: company?.qr_url || order.qr_url || "",
    orderNumber,
    bookingRef: order.booking_ref || "",
    consignmentNo: consignment.consignment_number || order.booking_ref || "",
    mbl: consignment.mbl_number || order.mbl_number || "",
    vessel: consignment.vessel || "",
    voyage: consignment.voyage || "",
    pol,
    pod,
    pdel,
    por,
    terminal: order.loading_terminal || consignment.loading_terminal || "",
    placeOfIssue: order.place_of_issue || (tpl === "messiah" ? "LONDON" : pol),
    issued: order.created_at || new Date(),
    releasePlace: order.originals_released_at || "DUBAI",
    payableAt:
      order.freight_payable_at || (tpl === "messiah" ? "LONDON" : "DUBAI"),
    loadType: String(
      order.load_type || consignment.load_type || "",
    ).toUpperCase(),
    freeDays,
    eform: consignment.eform || order.eform || "",
    eformDate: consignment.eform_date || order.eform_date || "",
    variant: String(order.hbl_variant || "ORIGINAL").toUpperCase(),
    forwarder: company?.company || "",
    destAgent: company?.company || "",
    shipper: {
      name: order.sender_name || "N/A",
      address: order.sender_address || "",
    },
    generated: `${fmtSlash(new Date())} ${pad2(new Date().getHours())}:${pad2(new Date().getMinutes())}`,
    groups,
  };
};

const BASE_CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #e9e9e9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.pg { position: relative; width: 794px; height: 1122px; margin: 0 auto 16px; background: #fff; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,.15); }
.pg img { display: block; }
.a { position: absolute; }
@media print {
  html, body { background: #fff; }
  .pg { margin: 0; box-shadow: none; page-break-after: always; break-after: page; }
  .pg:last-child { page-break-after: auto; break-after: auto; }
}`;

const CLASSIC_CSS = `
.cl { font-family: Arial, Helvetica, sans-serif; color: #000; }
.cl .band { position: absolute; top: 0; bottom: 0; right: 0; }
.cl-rgsl .band { display: none; }
.cl-messiah .band { width: 66px; background: linear-gradient(180deg,#25306b 0,#25306b 62%,#e8392f 62%); }
.cl-messiah .band span { position: absolute; left: 50%; top: 170px; transform: translateX(-50%); color: #fff; font-weight: 900; font-size: 19px; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 5px; white-space: nowrap; }
.cl .in { position: absolute; top: 0; bottom: 0; left: 20px; }
.cl-rgsl .in { right: 20px; }
.cl-messiah .in { right: 70px; }
.cl-hd { position: absolute; top: 16px; left: 0; right: 0; height: 76px; display: flex; justify-content: space-between; align-items: flex-start; }
.cl-logo { display: flex; flex-direction: column; gap: 3px; }
.cl-rname { font-size: 18px; font-weight: bold; color: #0a4b2e; }
.cl-url { font-size: 9px; letter-spacing: 1.2px; color: #333; }
.cl-mrow { display: flex; align-items: center; gap: 14px; }
.cl-mfd { display: inline-block; background: #25306b; color: #fff; font-weight: bold; font-style: italic; padding: 14px 10px; border-bottom-right-radius: 14px; }
.cl-mname { font-size: 15px; font-weight: bold; color: #25306b; letter-spacing: .3px; }
.cl-ttl { text-align: center; padding-right: 6px; }
.cl-ttl b { display: block; font-size: 21px; color: #1c2b3a; }
.cl-ttl span { display: block; font-size: 9px; line-height: 1.25; }
.cl-rgsl .cl-ttl span { color: #0a4b2e; font-weight: bold; }
.cl-messiah .cl-ttl span { color: #555; }
.cl-grid { position: absolute; top: 94px; left: 0; right: 0; border-top: 1px solid #555; border-left: 1px solid #555; border-right: 1px solid #555; }
.cl-r { display: flex; }
.cl-cols2 { display: flex; }
.cl-lc { width: 57%; }
.cl-rc { width: 43%; border-left: 1px solid #000; }
.cl-f { position: relative; border-bottom: 1px solid #555; border-right: 1px solid #555; padding: 3px 6px 2px; overflow: hidden; }
.cl-lc > .cl-f { border-right: 0; }
.cl-r > .cl-f:last-child { border-right: 0; }
.cl-l { display: block; font-size: 6px; line-height: 1.1; margin-bottom: 2px; }
.cl-rgsl .cl-l { color: #1a6b45; font-weight: bold; }
.cl-messiah .cl-l { color: #777; font-size: 6.5px; }
.cl-v { font-size: 10.5px; line-height: 1.3; text-transform: uppercase; }
.cl-b { font-weight: bold; }
.cl-part { position: absolute; top: 459px; left: 0; right: 0; text-align: center; font-size: 6.5px; font-weight: bold; padding-left: 12%; }
.cl-cl { position: absolute; top: 471px; left: 0; right: 0; height: 12px; font-size: 6px; }
.cl-rgsl .cl-cl { color: #1a6b45; font-weight: bold; }
.cl-messiah .cl-cl { color: #777; }
.cl-cl span { position: absolute; top: 2px; white-space: nowrap; }
.cl-body { position: absolute; top: 485px; left: 0; right: 0; height: 440px; }
.cl-body .t { position: absolute; font-size: 11px; line-height: 1.3; text-transform: uppercase; }
.cl-body .t.mk { font-size: 9.5px; line-height: 1.25; overflow-wrap: anywhere; word-break: break-word; }
.cl-note { position: absolute; left: 65.5%; top: 182px; width: 25%; border: 2px solid #000; padding: 3px 5px; font-family: "Courier New", monospace; font-weight: bold; font-size: 7.4px; line-height: 1.45; }
.cl-ct { position: absolute; left: 3%; top: 252px; width: 90%; }
.cl-ct .r { display: grid; font-size: 11.5px; line-height: 1.4; }
.cl-ct .h { font-weight: bold; }
.cl-wm { position: absolute; left: 22%; top: 140px; width: 56%; opacity: .07; }
.cl-foot { position: absolute; top: 919px; left: 0; right: 0; }
.cl-fa { display: flex; width: 76%; border: 1px solid #555; height: 42px; }
.cl-fa > div { padding: 3px 6px; border-right: 1px solid #555; }
.cl-fa > div:last-child { border-right: 0; }
.cl-fa b { display: block; font-size: 10.5px; margin-top: 4px; }
.cl-fb { display: flex; height: 80px; margin-top: 6px; }
.cl-fp { width: 38%; font-size: 4.6px; line-height: 1.3; color: #333; text-align: justify; padding-right: 8px; }
.cl-fm { width: 28%; position: relative; }
.cl-fm .val { position: absolute; top: 16px; left: 0; right: 8px; font-size: 10px; line-height: 1.25; font-weight: bold; text-transform: uppercase; white-space: normal; }
.cl-fs { width: 34%; position: relative; }
.cl-fs .nm { position: absolute; bottom: 22px; left: 0; font-size: 10px; font-weight: bold; text-transform: uppercase; white-space: nowrap; }
.cl-fs .as { position: absolute; bottom: 8px; left: 0; font-size: 6px; font-weight: bold; white-space: nowrap; }
.cl-fs img.stamp { position: absolute; top: 4px; left: 0; height: 64px; }
.cl-fs img.lg { position: absolute; top: 0; right: 0; height: 22px; }
`;

const classicPage = (d, g) => {
  const m = d.tpl === "messiah";
  const L = (t) => `<span class="cl-l">${t}</span>`;
  const F = (label, inner, style = "") =>
    `<div class="cl-f" style="${style}">${L(label)}${inner}</div>`;
  const party = (n, a) =>
    `<div class="cl-v"><b>${esc(n)}</b>${a ? `<br>${br(a)}` : ""}</div>`;
  const V = (v) => `<div class="cl-v cl-b">${esc(v)}</div>`;

  const header = m
    ? `<div class="cl-mrow">${d.logo ? `<img src="${esc(d.logo)}" alt="" style="height:56px;max-width:90px;object-fit:contain">` : `<span class="cl-mfd">mfd</span>`}<span class="cl-mname">${esc(d.carrier)}</span></div>`
    : `<div class="cl-logo">${d.logo ? `<img src="${esc(d.logo)}" alt="" style="height:56px;max-width:230px;object-fit:contain">` : `<span class="cl-rname">${esc(d.carrier)}</span>`}<div class="cl-url">WWW.ROYALGULFSHIPPING.COM</div></div>`;

  const notify = V("SAME AS CONSIGNEE");
  const vesselTxt = d.vessel
    ? `${d.vessel}${d.voyage ? ` / ${d.voyage}` : ""}`
    : m
      ? "N/A"
      : "******";

  const grid = `
  <div class="cl-grid">
    <div class="cl-r">
      <div class="cl-lc">
        ${F("Shipper", party(d.shipper.name, d.shipper.address), "height:86px")}
        ${F('Consignee&nbsp;&nbsp;&nbsp;("Not negotiable unless consigned to order")', party(g.consignee.name, g.consignee.address), "height:82px")}
        ${F("Notify Party (See cl. 12)", notify, "height:70px")}
        <div class="cl-r" style="height:46px">
          ${F("Port of Loading*", V(d.pol), "width:50%")}
          ${F("Pre-carriage by*", "", "width:50%")}
        </div>
      </div>
      <div class="cl-rc">
        <div class="cl-r" style="height:34px">
          ${F("B/L No. (also to be used as payment ref.)", V(d.orderNumber), "width:58%;border-bottom:1px solid #000")}
          ${F("Booking Number", V(d.bookingRef), "width:42%;border-bottom:1px solid #000")}
        </div>
        ${F("Export Reference", "", "height:52px")}
        ${F("Forwarding Agent", V(d.forwarder), "height:60px")}
        ${F("Point (State) of Origin or FTZ Number", "", "height:22px")}
        ${F("Destination Agent", V(d.destAgent), "height:116px;border-bottom:1px solid #000")}
      </div>
    </div>
    <div class="cl-r" style="height:31px">
      ${F("Place of Receipt*", V(d.por), "width:29.6%")}
      ${F("Ocean Vessel&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Voyage", V(vesselTxt), "width:27.4%")}
      ${F("Originals to be released at", V(d.releasePlace), "width:22%")}
      ${F("Freight payable at", V(d.payableAt), "width:21%")}
    </div>
    <div class="cl-r" style="height:48px">
      ${F("Port of Discharge", V(d.pod), "width:28.5%")}
      ${F("Place of Delivery*", V(d.pdel), "width:28.5%")}
      ${F("Mode Load Area", "", "width:21.5%")}
      ${F("Mode Disch. Area", "", "width:21.5%")}
    </div>
  </div>
  <div class="cl-part">PARTICULARS FURNISHED BY SHIPPER</div>
  <div class="cl-cl">
    <span style="left:0">Marks &amp; Nos.</span><span style="left:9%">Cont./Seal Nos.</span><span style="left:19%">No of Pkgs.</span>
    <span style="left:28.5%">Description of Goods</span><span style="left:79%">Gross Weight</span><span style="left:92%">Measurement</span>
  </div>`;

  // description column
  let desc;
  if (m) {
    desc = `
      <div class="t" style="left:28%;top:29px;width:50%"><b><u>${g.countLabel} ${d.loadType} CONTAINER SAID TO CONTAIN</u></b></div>
      <div class="t" style="left:28%;top:59px;width:50%">${g.countLabel} CONTAINER<br>STC ${g.totalPkgs} PACKAGES<br>${esc(g.goods)}</div>
      <div class="t" style="left:28%;top:149px;width:36%">ALL SORT OF DESTINATION CHARGES ON CONSIGNEE'S ACCOUNT</div>`;
  } else {
    desc = `
      <div class="t" style="left:28%;top:20px;width:50%"><b><u>${g.countLabel} ${d.loadType} CONTAINER SAID TO CONTAIN</u></b></div>
      <div class="t" style="left:28%;top:52px;width:50%">${esc(g.goods)}</div>
      ${d.freeDays ? `<div class="t" style="left:28%;top:98px;width:50%">${d.freeDays} DAYS FREE TIME AT POD</div>` : ""}
      <div class="t" style="left:28%;top:137px;width:36%">ALL SORT OF DESTINATION CHARGES ON CONSIGNEE'S ACCOUNT</div>`;
  }

  // user-entered text (HBL text editor), under the goods / destination lines
  const custom = d.customText
    ? `<div class="t" style="left:28%;top:${m ? 186 : 174}px;width:36%;max-height:${m ? 62 : 74}px;overflow:hidden;font-size:10.5px">${br(d.customText)}</div>`
    : "";

  const cols = m ? "27.7% 16.3% 14.5% 12.3% 1fr" : "26% 1fr";
  const cHead = m
    ? `<div class="r h" style="grid-template-columns:${cols}"><span>CONTAINER NO. &nbsp;SIZE</span><span>SEAL NO.</span><span>PKGS</span><span>GROSS WT</span></div>`
    : `<div class="r h" style="grid-template-columns:${cols}"><span>CONTAINER NO. &nbsp;SIZE</span><span>SEAL NO.</span></div>`;
  const cRows = g.containers
    .map((c) =>
      m
        ? `<div class="r" style="grid-template-columns:${cols}"><span>${esc(c.no)} / ${esc(c.size)}</span><span>${esc(c.seal)}</span><span>${c.pkgs} PKG</span><span>${fmtWt(c.weight, 3)} KGS</span></div>`
        : `<div class="r" style="grid-template-columns:${cols}"><span>${esc(c.no)} / ${esc(c.size)}</span><span>${esc(c.seal)}</span></div>`,
    )
    .join("");

  const body = `
  <div class="cl-body">
    ${!m && d.logo ? `<img class="cl-wm" src="${esc(d.logo)}" alt="">` : ""}
    ${g.marks ? `<div class="t mk" style="left:1%;top:20px;width:15%">${br(g.marks)}</div>` : ""}
    <div class="t" style="left:17.5%;top:${m ? 22 : 14}px;width:10%;text-align:center">${m ? `${g.totalPkgs}<br>PKGS` : `${g.totalPkgs}<br>${esc(g.unit)}`}</div>
    ${desc}
    ${custom}
    <div class="t" style="left:79.5%;top:${m ? 22 : 14}px;width:18%">GROSS WT<br><b>${fmtWt(g.totalWeight)} KGS</b></div>
    <div class="t" style="left:${m ? 83.4 : 81}%;top:${m ? 135 : 126}px">${m ? "" : `${d.loadType}/${d.loadType}`}</div>
    <div class="cl-note">${TERMINAL_NOTE.map(esc).join("<br>")}</div>
    <div class="cl-ct">${cHead}${cRows}</div>
  </div>`;

  const stampImg =
    m && d.stamp ? `<img class="stamp" src="${esc(d.stamp)}" alt="">` : "";
  const logoImg =
    !m && d.logo ? `<img class="lg" src="${esc(d.logo)}" alt="">` : "";
  const footer = `
  <div class="cl-foot">
    <div class="cl-fa">
      <div style="width:29%"><span class="cl-l">Tariff Item No.</span><b>FREIGHT PREPAID</b></div>
      <div style="width:51%"><span class="cl-l">Total Nos. of Pkgs&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Declared Value (See Clause 16)</span><div style="font-size:10.5px;margin-top:4px">${m ? g.countLabel : `${g.countLabel} ${d.loadType}`}</div></div>
      <div style="width:20%"><span class="cl-l">No. orig. B/L</span></div>
    </div>
    <div class="cl-fb">
      <div class="cl-fp">${esc(FINE_PRINT)}</div>
      <div class="cl-fm">
        <span class="cl-l">Place &amp; date of issue</span>
        ${m ? `<span class="as" style="position:absolute;bottom:28px;left:0;font-size:6px;font-weight:bold">as CARRIER &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;as AGENT</span>` : ""}
        <div class="val">${esc(d.placeOfIssue)} ${m ? ", " : ""}${m ? fmtSlash(d.issued) : fmtSlash(d.issued)}</div>
      </div>
      <div class="cl-fs">
        <span class="cl-l">Signed</span>
        ${stampImg}${logoImg}
        <div class="nm">${esc(d.carrier)}</div>
        ${m ? "" : `<div class="as">as CARRIER &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;as AGENT</div>`}
      </div>
    </div>
  </div>`;

  return `
<div class="pg cl cl-${d.tpl}">
  <div class="band">${m ? "<span>Your Logistic Partner</span>" : ""}</div>
  <div class="in">
    <div class="cl-hd">${header}<div class="cl-ttl"><b>Bill of Lading</b><span>Multimodal Transport</span><span>or Port-to-Port Shipment</span></div></div>
    ${grid}
    ${body}
    ${footer}
  </div>
</div>`;
};

/* ------------------------------------------------------------------ */
/* CARGO AVIATION SYSTEMS                                              */
/* ------------------------------------------------------------------ */
const CAS_CSS = `
.cs { font-family: Arial, Helvetica, sans-serif; color: #000; }
.cs-bar { position: absolute; top: 15px; left: 0; right: 0; height: 24px; background: linear-gradient(90deg,#1a1a1a 0,#1a1a1a 52%,#c2185b 78%,#f59e0b 100%); }
.cs-bar2 { position: absolute; top: 1035px; left: 30px; right: 0; height: 3px; background: linear-gradient(90deg,#f59e0b,#c2185b 60%,#f59e0b); }
.cs-in { position: absolute; left: 43px; right: 38px; top: 0; bottom: 0; }
.cs-hd { position: absolute; top: 80px; left: 0; right: 0; height: 72px; }
.cs-logo { position: absolute; left: 0; top: 0; width: 64px; height: 62px; background: #111; color: #fff; font-weight: 900; font-size: 24px; padding: 6px 6px; }
.cs-logo i { position: absolute; left: 0; right: 0; bottom: 0; height: 8px; background: linear-gradient(90deg,#f59e0b,#c2185b); }
.cs-ttl { position: absolute; left: 100px; top: 8px; font-size: 25px; font-weight: 800; letter-spacing: 1.5px; color: #111; white-space: nowrap; }
.cs-rt { position: absolute; right: 0; top: 24px; text-align: right; }
.cs-rt b { display: block; font-size: 15px; }
.cs-rt span { display: block; font-size: 6.4px; font-weight: bold; line-height: 1.3; }
.cs-grid { position: absolute; top: 157px; left: 0; right: 0; height: 408px; border-top: 1.5px solid #000; display: flex; }
.cs-lc { width: 47.6%; border-right: 1px solid #000; }
.cs-rc { width: 52.4%; }
.cs-r { display: flex; }
.cs-f { position: relative; border-bottom: 1px solid #000; padding: 3px 6px 2px; overflow: hidden; }
.cs-r > .cs-f + .cs-f { border-left: 1px solid #000; }
.cs-l { display: block; font-size: 5.8px; font-weight: bold; line-height: 1.1; margin-bottom: 2px; text-transform: uppercase; }
.cs-v { font-size: 11px; line-height: 1.35; text-transform: uppercase; }
.cs-b { font-weight: bold; }
.cs-part { position: absolute; top: 565px; left: 0; right: 0; height: 18px; border-top: 1px solid #000; border-bottom: 1px solid #000; text-align: center; font-size: 7px; font-weight: bold; line-height: 16px; }
.cs-cols { position: absolute; top: 583px; left: 0; right: 0; height: 18px; border-bottom: 1px solid #000; font-size: 6.4px; font-weight: bold; }
.cs-cols div, .cs-vl { position: absolute; }
.cs-cols div { top: 0; height: 17px; line-height: 17px; text-align: center; }
.cs-vl { top: 583px; height: 177px; width: 1px; background: #000; }
.cs-body { position: absolute; top: 601px; left: 0; right: 0; height: 159px; border-bottom: 1px solid #000; }
.cs-body .t { position: absolute; font-size: 11.5px; line-height: 1.35; text-transform: uppercase; }
.cs-body .t.mk { font-size: 9.5px; line-height: 1.25; overflow-wrap: anywhere; word-break: break-word; }
.cs-dv { position: absolute; top: 760px; left: 0; right: 0; height: 22px; font-size: 6.4px; font-weight: bold; text-align: center; line-height: 1.2; padding-top: 3px; }
.cs-dv em { position: absolute; right: 0; top: 4px; font-style: normal; font-size: 5.4px; }
.cs-ft { position: absolute; top: 782px; left: 0; width: 62%; height: 224px; border: 1px solid #000; }
.cs-ft .hd { height: 15px; text-align: center; font-size: 7px; font-weight: bold; line-height: 15px; border-bottom: 1px solid #000; }
.cs-ft .sh { display: flex; height: 17px; border-bottom: 1px solid #000; font-size: 6px; font-weight: bold; text-align: center; line-height: 17px; }
.cs-ft .sh div, .cs-ft .bd div, .cs-ft .tt div { border-right: 1px solid #000; }
.cs-ft .sh div:last-child, .cs-ft .bd div:last-child, .cs-ft .tt div:last-child { border-right: 0; }
.cs-ft .bd { display: flex; height: 140px; border-bottom: 1px solid #000; position: relative; }
.cs-ft .bd > div { position: relative; }
.cs-note { position: absolute; left: 4px; bottom: 4px; width: 255px; border: 2px solid #000; padding: 3px 5px; font-family: "Courier New", monospace; font-weight: bold; font-size: 7.4px; line-height: 1.45; background: #fff; }
.cs-ft .tt { display: flex; height: 26px; border-bottom: 1px solid #000; font-size: 7.6px; font-weight: bold; align-items: stretch; }
.cs-ft .tt div { display: flex; align-items: center; justify-content: center; }
.cs-ft .tt:last-child { border-bottom: 0; }
.cs-rp { position: absolute; top: 782px; left: 62.7%; right: 0; height: 224px; font-size: 6.2px; line-height: 1.35; }
.cs-rp p { margin-bottom: 8px; text-align: justify; }
.cs-org { position: absolute; left: 0; top: 118px; font-size: 6.6px; font-weight: bold; white-space: nowrap; }
.cs-org b { font-size: 13px; margin-left: 12px; text-decoration: underline; }
.cs-pl { position: absolute; left: 0; top: 140px; font-size: 6.6px; font-weight: bold; white-space: normal; width: 100%; border-bottom: 1px solid #000; padding-bottom: 2px; line-height: 1.3; }
.cs-pl b { display: block; font-size: 9px; margin: 2px 0 0 0; text-decoration: underline; }
.cs-for { position: absolute; left: 0; top: 190px; font-size: 6.8px; font-weight: bold; white-space: nowrap; }
.cs-for b { font-size: 15px; }
.cs-as { position: absolute; top: 1018px; right: 0; width: 37%; text-align: center; font-size: 6px; font-weight: bold; }
.cs-wm { position: absolute; left: 25%; top: 640px; font-size: 90px; font-weight: bold; color: rgba(0,0,0,.05); transform: rotate(-20deg); }
`;

const casPage = (d, g) => {
  const L = (t) => `<span class="cs-l">${t}</span>`;
  const F = (label, inner, style = "") =>
    `<div class="cs-f" style="${style}">${L(label)}${inner}</div>`;
  const party = (n, a) =>
    `<div class="cs-v"><b>${esc(n)}</b>${a ? `<br>${br(a)}` : ""}</div>`;
  const V = (v) => `<div class="cs-v">${esc(v)}</div>`;
  const vesselTxt = [d.vessel, d.voyage].filter(Boolean).join(" ") || "N/A";

  const contNos = g.containers.map((c) => c.no).filter((n) => n && n !== "N/A");
  const contFont = contNos.length > 3 ? 7 : contNos.length > 1 ? 9 : 11;
  const contHdr = contNos.length
    ? `<div class="cs-v cs-b" style="font-size:${contFont}px;line-height:1.2">${contNos.map(esc).join("<br>")}</div>`
    : "";

  const logo = d.logo
    ? `<img class="a" src="${esc(d.logo)}" alt="" style="left:0;top:0;height:62px;max-width:90px;object-fit:contain">`
    : `<div class="cs-logo">cas<i></i></div>`;

  const grid = `
  <div class="cs-grid">
    <div class="cs-lc">
      ${F("Exporter / Shipper", party(d.shipper.name, d.shipper.address), "height:92px")}
      ${F("Consigned To", party(g.consignee.name, g.consignee.address), "height:90px")}
      ${F("Notify Party / Intermediate Consignee", `<div class="cs-v cs-b" style="margin-top:16px;font-size:12px">SAME AS CONSIGNEE</div>`, "height:50px")}
      <div class="cs-r" style="height:54px">${F("* Pre-carriage by", V(d.pol), "width:48%")}${F("* Place of receipt by pre-carrier", "", "width:52%")}</div>
      <div class="cs-r" style="height:54px">${F("Vessel", V(vesselTxt), "width:48%")}${F("Port of loading / export", V(d.pol), "width:52%")}</div>
      <div class="cs-r" style="height:68px">${F("Foreign port of unloading", V(d.pod), "width:48%;border-bottom:0")}${F("* Place of delivery by on-carrier", V(d.pdel), "width:52%;border-bottom:0")}</div>
    </div>
    <div class="cs-rc">
      <div class="cs-r" style="height:49px">${F("Bill of Lading Number", `<div class="cs-v cs-b" style="font-size:13px;margin-top:3px">${esc(d.orderNumber)}</div>`, "width:58%")}${F("Container Number", contHdr, "width:42%")}</div>
      ${F("Export References", "", "height:43px")}
      ${F("Forwarding Agent", `<div class="cs-v cs-b">${esc(d.forwarder)}</div>`, "height:62px")}
      ${F("Point (State) of Origin or FTZ Number", "", "height:28px")}
      ${F("Destination Agent", `<div class="cs-v cs-b">${esc(d.destAgent)}</div>`, "height:130px")}
      ${F("Loading Pier / Terminal", `<div class="cs-v" style="text-align:center;font-size:12px">${esc(d.terminal)}</div>`, "height:48px")}
       <div class="cs-r" style="height:48px">
        ${F("Co-loaded with", "", "width:60%;border-bottom:0")}
        ${F("Containerized", `<div style="display:flex;gap:10px;align-items:center;font-size:5px;font-weight:bold;margin-top:2px"><span style="display:inline-block;width:14px;height:14px;border:1px solid #000"></span>YES<span style="display:inline-block;width:14px;height:14px;border:1px solid #000"></span>NO</div>`, "width:40%;border-bottom:0")}
      </div>
    </div>
  </div>
  <div class="cs-part">PARTICULARS FURNISHED BY SHIPPER</div>
  <div class="cs-cols">
    <div style="left:0;width:13.6%">MARKS AND NUMBERS</div>
    <div style="left:13.4%;width:9.4%">NO. OF PKGS</div>
    <div style="left:22.5%;width:46.7%">DESCRIPTION OF PACKAGES AND GOODS</div>
    <div style="left:69.2%;width:14.5%">GROSS WEIGHT</div>
    <div style="left:83.7%;width:16.3%">MEASUREMENT</div>
  </div>
  <div class="cs-vl" style="left:13.6%"></div><div class="cs-vl" style="left:22.5%"></div><div class="cs-vl" style="left:69.2%"></div><div class="cs-vl" style="left:83.7%"></div>
  ${d.variant === "COPY" ? `<div class="cs-wm">COPY</div>` : ""}`;

  const body = `
  <div class="cs-body">
    ${g.marks ? `<div class="t mk" style="left:1%;top:14px;width:12%">${br(g.marks)}</div>` : ""}
    <div class="t" style="left:13.4%;width:9.4%;top:8px;text-align:center">${g.totalPkgs}<br>${esc(g.unit)}</div>
    <div class="t" style="left:24%;top:15px;width:44%"><b><u>${g.countLabel} ${d.loadType} CONTAINER SAID TO CONTAIN</u></b></div>
    <div class="t" style="left:24%;top:54px;width:44%">${esc(g.goods)}</div>
    ${d.mbl ? `<div class="t" style="left:24%;top:103px;width:44%">MBL# ${esc(d.mbl)}</div>` : ""}
    ${d.customText ? `<div class="t" style="left:24%;top:${d.mbl ? 121 : 103}px;width:44%;max-height:${d.mbl ? 36 : 54}px;overflow:hidden;font-size:10px;line-height:1.3">${br(d.customText)}</div>` : ""}
    <div class="t" style="left:70%;top:8px;width:14%;text-align:center">GROSS WT<br><b>${fmtWt(g.totalWeight)} KGS</b></div>
    <div class="t" style="left:90%;top:70px;font-size:12px"></div>
  </div>
  <div class="cs-dv">DECLARED VALUE (For AD VALOREM purpose only).<br>(Refer to clause 5 on reverse hereof) in US $<em>* APPLICABLE ONLY WHEN DOCUMENT USED AS A COMBINED TRANSPORT BILL OF LADING.</em></div>`;

  const freight = `
  <div class="cs-ft">
    <div class="hd">FREIGHT AND CHARGES</div>
    <div class="sh"><div style="width:42.7%">DESCRIPTION OF CHARGE</div><div style="width:14.2%">RATE</div><div style="width:18.8%">PREPAID</div><div style="width:24.3%">COLLECT</div></div>
    <div class="bd"><div style="width:42.7%"><div class="cs-note" style="border-right:2px solid #000">${TERMINAL_NOTE.map(esc).join("<br>")}</div></div><div style="width:14.2%"></div><div style="width:18.8%"></div><div style="width:24.3%"></div></div>
    <div class="tt"><div style="width:42.7%">TOTAL PREPAID</div><div style="width:14.2%"></div><div style="width:43.1%;font-size:13px">FREIGHT PREPAID</div></div>
    <div class="tt"><div style="width:42.7%">TOTAL COLLECT</div><div style="width:14.2%"></div><div style="width:18.8%"></div><div style="width:24.3%"></div></div>
  </div>
  <div class="cs-rp">
    <p>In accepting this bill of lading, any local customs or privileges to the contrary notwithstanding, the shipper, consignee and owner of the goods and the holder of this bill of lading, agree to be bound by all the stipulations, exceptions and conditions stated herein whether written, printed, stamped or incorporate on the front or reverse side hereof, as fully as if they were all signed by shipper, consignee, owner or holder.</p>
    <p>In witness whereof three (3) bills of lading, all of this tenor and date have been signed, one of which being accomplished, the others to stand void.</p>
    <div class="cs-org">NUMBER OF ORIGINAL BILL'S <b>${esc(d.variant)}</b></div>
    <div class="cs-pl">Place and date of Issue <b>${esc(d.placeOfIssue)} - ${fmtSlash(d.issued)}</b></div>
    <div class="cs-for">FOR, <b>${esc(d.carrier)}</b></div>
  </div>
  <div class="cs-as">AS AGENTS</div>`;

  return `
<div class="pg cs">
  <div class="cs-bar"></div><div class="cs-bar2"></div>
  <div class="cs-in">
    <div class="cs-hd">${logo}<div class="cs-ttl">${esc(d.carrier)}</div>
      <div class="cs-rt"><b>BILL OF LADING</b><span>FOR COMBINED TRANSPORT AND</span><span>PORT TO PORT SHIPMENT</span><span>NOT NEGOTIABLE UNLESS CONSIGNED "TO ORDER"</span></div></div>
    ${grid}${body}${freight}
  </div>
</div>`;
};

/* ------------------------------------------------------------------ */
/* RICKMERS (2 pages per receiver)                                     */
/* ------------------------------------------------------------------ */
const RK = "#2a2adf";
const RK_CSS = `
.rk { font-family: "Courier New", Courier, monospace; color: #111; }
.rk-in { position: absolute; left: 36px; right: 17px; top: 0; bottom: 0; }
.rk-hd { position: absolute; top: 14px; left: 0; right: 0; height: 58px; }
.rk-logo { position: absolute; left: 4px; top: 4px; }
.rk-script { font: italic 46px Georgia, serif; color: #777; line-height: 1; }
.rk-lname { display: block; font: 15px Georgia, serif; letter-spacing: 1px; color: #b8467a; margin-top: -4px; }
.rk-title { position: absolute; left: 0; right: 0; top: 22px; text-align: center; font-family: "Courier New", monospace; }
.rk-title b { display: block; font-size: 15px; color: #1f2fbf; letter-spacing: .5px; }
.rk-title small { display: block; font-size: 7.5px; font-weight: bold; color: #1f2fbf; }
.rk-pg { position: absolute; right: 8px; top: 6px; text-align: center; font-family: Arial, sans-serif; }
.rk-pg small { display: block; font-size: 6.6px; font-weight: bold; }
.rk-pg b { display: block; font-size: 12px; font-family: "Courier New", monospace; margin-top: 4px; }
.rk-grid { position: absolute; top: 74px; left: 0; right: 0; height: 367px; border: 1px solid ${RK}; display: flex; }
.rk-lc { width: 56.4%; border-right: 1px solid ${RK}; display: flex; flex-direction: column; }
.rk-rc { width: 43.6%; }
.rk-r { display: flex; }
.rk-f { position: relative; border-bottom: 1px solid ${RK}; padding: 3px 6px 2px; overflow: hidden; }
.rk-r > .rk-f + .rk-f { border-left: 1px solid ${RK}; }
.rk-l { display: block; font: 5.6px Arial, sans-serif; color: ${RK}; text-transform: uppercase; line-height: 1.15; margin-bottom: 2px; }
.rk-v { font-size: 12px; line-height: 1.4; letter-spacing: .4px; text-transform: uppercase; }
.rk-cl { font: 6.4px/1.18 Arial, sans-serif; color: ${RK}; text-align: justify; }
.rk-hz { position: absolute; top: 468px; left: 0; right: 0; display: flex; align-items: center; font: 6px Arial, sans-serif; color: ${RK}; }
.rk-hz i { flex: 0 0 auto; font-style: normal; font-size: 5.4px; }
.rk-hz span { flex: 1; text-align: center; font-size: 9px; }
.rk-mk { overflow-wrap: anywhere; word-break: break-word; font-size: 10px; }
.rk-tbl { position: absolute; left: 0; right: 0; top: 484px; height: 262px; }
.rk-vl { position: absolute; top: 0; bottom: 0; width: 1px; background: ${RK}; }
.rk-th { position: relative; height: 24px; border-bottom: 1px solid ${RK}; font: 4.6px/1.15 Arial, sans-serif; color: ${RK}; text-align: center; text-transform: uppercase; }
.rk-th div { position: absolute; top: 3px; text-align: center; }
.rk-crs { border-bottom: 1px dotted #444; padding: 7px 0 9px; }
.rk-cr { display: flex; font-size: 11.4px; line-height: 1.45; }
.rk-cr div { padding: 0 3px; white-space: nowrap; overflow: hidden; }
.rk-bd { display: flex; font-size: 11.4px; line-height: 1.5; padding-top: 9px; }
.rk-bd div { padding: 0 6px; }
.rk-cont { position: absolute; top: 749px; left: 0; right: 0; text-align: center; font-size: 11.4px; }
.rk-red { position: absolute; top: 765px; left: 0; right: 0; font: 7.6px Arial, sans-serif; color: #e11d1d; white-space: nowrap; }
.rk-red i { display: inline-block; width: 120px; border-bottom: 1px solid #e11d1d; }
.rk-fr { position: absolute; top: 777px; left: 0; right: 0; height: 237px; }
.rk-b { position: absolute; border: 1px solid ${RK}; }
.rk-b .rk-v { font-size: 11.4px; }
.rk-terms { font: 7px/1.3 Arial, sans-serif; color: ${RK}; padding: 3px 4px; }
.rk-sign { position: absolute; font-size: 11.4px; line-height: 1.35; }
.rk-sign small { font: 6.2px Arial, sans-serif; color: ${RK}; }
.rk-car { position: absolute; top: 1060px; left: 36px; right: 17px; text-align: left; font-size: 11.4px; line-height: 1.35; }
.rk-p2 { position: absolute; top: 94px; left: 0; right: 0; height: 15px; border-bottom: 1px solid ${RK}; font-size: 11.4px; display: flex; justify-content: space-between; padding: 0 2px; }
.rk-txt { position: absolute; left: 6px; font-size: 11.4px; line-height: 1.5; white-space: pre; }
`;

const rickmersPages = (d, g) => {
  const L = (t) => `<span class="rk-l">${t}</span>`;
  const F = (label, inner, style = "") =>
    `<div class="rk-f" style="${style}">${L(label)}${inner}</div>`;
  const V = (t) => `<div class="rk-v">${esc(t)}</div>`;
  const P = (n, a) =>
    `<div class="rk-v">${esc(n)}${a ? `<br>${br(a)}` : ""}</div>`;
  const lt = d.loadType;
  const ft = (c) => {
    const n = (String(c.size || "").match(/\d+/) || [""])[0];
    return n ? `${n}FT` : "";
  };
  const rkCount = (() => {
    const m = {};
    g.containers.forEach((c) => {
      m[ft(c)] = (m[ft(c)] || 0) + 1;
    });
    return Object.entries(m)
      .map(([f, n]) => (f ? `${n}X${f}` : `${n}`))
      .join(" + ");
  })();
  const vesselTxt = [d.vessel, d.voyage].filter(Boolean).join(" ") || "N/A";
  const fit = (t, big = 12) => {
    const n = String(t || "").length;
    return n > 40 ? big - 3 : n > 26 ? big - 1.5 : big;
  };
  const VF = (t) =>
    `<div class="rk-v" style="font-size:${fit(t)}px;line-height:1.25">${esc(t)}</div>`;

  const head = (n) => `
  <div class="rk-hd">
    <div class="rk-logo">${d.logo ? `<img src="${esc(d.logo)}" alt="" style="height:52px;max-width:200px;object-fit:contain">` : `<span class="rk-script">R</span><span class="rk-lname">RICKMERS CONTAINER LINE</span>`}</div>
    <div class="rk-title"><b>NON NEGOTIABLE</b><small>BILL OF LADING</small></div>
    <div class="rk-pg"><small>PAGE: &nbsp;&nbsp;${n} OF &nbsp;&nbsp;2</small>${n === 1 ? "<b>SEA WAYBILL</b>" : ""}</div>
  </div>`;

  const vlines = `
    <div class="rk-vl" style="left:0"></div><div class="rk-vl" style="left:20.4%"></div><div class="rk-vl" style="left:30.7%"></div>
    <div class="rk-vl" style="left:32%"></div><div class="rk-vl" style="left:70.2%"></div><div class="rk-vl" style="left:85%"></div><div class="rk-vl" style="right:0"></div>`;
  const thead = `
    <div class="rk-th">
      <div style="left:0;width:20.4%">CNTR. NOS. W/SEAL NOS.<br>MARKS &amp; NUMBERS</div>
      <div style="left:20.4%;width:10.3%">QUANTITY<br>(FOR CUSTOMS<br>DECLARATION ONLY)</div>
      <div style="left:30.7%;width:1.3%">H<br>M</div>
      <div style="left:32%;width:38.2%;top:9px">DESCRIPTION OF GOODS</div>
      <div style="left:70.2%;width:14.8%;top:9px">GROSS WEIGHT</div>
      <div style="left:85%;width:15%;top:9px">GROSS MEASUREMENT</div>
    </div>`;

  const contRows = g.containers
    .map(
      (c) => `
    <div class="rk-cr">
      <div style="width:20.4%">${esc(c.no)}</div>
      <div style="width:10.3%">/ ${esc(c.seal)}</div>
      <div style="width:1.3%"></div>
      <div style="width:38.2%">/ ${c.pkgs} PKGS /${lt} / ${lt}${ft(c) ? `/1X${ft(c)}` : ""}</div>
      <div style="width:14.8%">/ ${fmtWt(c.weight)}KGS</div>
      <div style="width:15%">/</div>
    </div>`,
    )
    .join("");

  const p1 = `
<div class="pg rk"><div class="rk-in">
  ${head(1)}
  <div class="rk-grid">
    <div class="rk-lc">
      ${F("Shipper/Exporter", P(d.shipper.name, d.shipper.address), "flex:85 1 0;min-height:0")}
      ${F("Consignee", P(g.consignee.name, g.consignee.address), "flex:94 1 0;min-height:0")}
      ${F("Notify Party (It is agreed that no responsibility shall be attached to the Carrier or its Agents for failure to notify)", V("SAME AS CONSIGNEE"), "flex:93 1 0;min-height:0")}
      <div class="rk-r" style="flex:0 0 auto;min-height:30px">${F("Pre-carriage by", "", "width:50%")}${F("Place of receipt", VF(d.por), "width:50%")}</div>
      <div class="rk-r" style="flex:0 0 auto;min-height:33px">${F("Ocean Vessel Voyage No. Flag", `<div class="rk-v" style="font-size:9px">${esc(vesselTxt)}</div>`, "width:50%")}${F("Port of loading", VF(d.pol), "width:50%")}</div>
      <div class="rk-r" style="flex:0 0 auto;min-height:32px">${F("Port of discharge", VF(d.pod), "width:50%;border-bottom:0")}${F("Place of delivery", VF(d.pdel), "width:50%;border-bottom:0")}</div>
    </div>
    <div class="rk-rc">
      <div class="rk-r" style="height:29px">${F("Booking No.", V(d.bookingRef), "width:53%")}${F("Sea Waybill No.", `<div class="rk-v" style="font-size:12.5px">${esc(d.orderNumber)}</div>`, "width:47%")}</div>
      ${F("Export References (for the Merchant's and/or Carrier's reference only. See back clause 8. (4).)", "", "height:56px")}
      ${F("Forwarding Agent-References<br>FMC No.", V(d.forwarder), "height:63px")}
      <div class="rk-f" style="height:150px;padding:2px 3px"><div class="rk-cl">${esc(RK_CLAUSE)}</div></div>
      ${F("Final Destination (for the Merchant's reference only)", "", "height:37px")}
      ${F("Type of movement (if mixed, use description of packages and goods field)", `<div class="rk-v" style="display:flex;justify-content:space-between"><span>${lt} / ${lt}</span><span></span></div>`, "height:32px;border-bottom:0")}
    </div>
  </div>
    <div class="rk-hz"><i>(CHECK "HM" COLUMN IF HAZARDOUS MATERIAL)</i><span>PARTICULARS DECLARED BY SHIPPER BUT NOT ACKNOWLEDGED BY THE CARRIER</span></div>
  <div class="rk-tbl">
    ${vlines}${thead}
    <div class="rk-crs">${contRows}</div>
    <div class="rk-bd">
      <div class="rk-mk" style="width:20.4%">${br(g.marks || "NO MARKS")}</div>
      <div style="width:10.3%;text-align:center">${g.totalPkgs}<br>${esc(g.unit)}</div>
      <div style="width:1.3%"></div>
      <div style="width:38.2%">SHIPPER'S LOAD AND COUNT<br>${rkCount} CONTAINER(S)<br><br>${esc(g.goods)}${d.customText ? `<br><br>${br(d.customText)}` : ""}${d.freeDays ? `<br><br><br><br>${d.freeDays} COMBINED FREE DAYS AT<br>DESTINATION` : ""}</div>
    </div>
  </div>
  <div class="rk-cont">** TO BE CONTINUED ON ATTACHED LIST **</div>
  <div class="rk-red">Declared Cargo Value US $<i></i>. If Merchant enters a value, Carrier's limitation of liability shall not apply and the ad valorem rate will be charged.</div>
  <div class="rk-fr">
    <div class="rk-b" style="left:0;top:0;width:38.3%;height:34px;padding:2px 4px"><span class="rk-l">Freight &amp; charges payable at / by:</span><div class="rk-v" style="font-size:10px;line-height:1.1">${esc(d.pol)}<br>${esc(d.releasePlace)}</div></div>
    <div class="rk-b" style="left:38.3%;top:0;width:11.1%;height:34px;padding:2px 4px"><span class="rk-l">Service Contract No.</span></div>
    <div class="rk-b" style="left:49.4%;top:0;width:10.1%;height:34px;padding:2px 4px"><span class="rk-l">Doc Form No.</span></div>
    <div class="rk-b" style="left:59.5%;top:0;width:9.9%;height:34px;padding:2px 4px"><span class="rk-l">Commodity Code</span></div>
    <div class="rk-b" style="left:69.4%;top:0;width:15.6%;height:34px;padding:2px 4px"><span class="rk-l">Exchange Rate</span></div>

    <div class="rk-b" style="left:0;top:34px;width:69.4%;height:155px"></div>
    <div class="rk-l a" style="left:3.5%;top:38px">CODE</div>
    <div class="rk-l a" style="left:10.6%;top:38px;left:11%">TARIFF ITEM</div>
    <div class="rk-l a" style="left:21.5%;top:38px">FREIGHTED AS</div>
    <div class="rk-l a" style="left:31.8%;top:38px">RATE</div>
    <div class="rk-l a" style="left:43.5%;top:38px">PREPAID</div>
    <div class="rk-l a" style="left:58.5%;top:38px">COLLECT</div>
    <div class="rk-vl" style="left:8.8%;top:34px;bottom:48px"></div><div class="rk-vl" style="left:19.7%;top:34px;bottom:48px"></div>
    <div class="rk-vl" style="left:29.4%;top:34px;bottom:48px"></div><div class="rk-vl" style="left:38.2%;top:34px;bottom:48px"></div>
    <div class="rk-vl" style="left:53.4%;top:34px;bottom:48px"></div>
    <div class="rk-b" style="left:0;top:34px;width:69.4%;height:16px;border-width:0 0 1px 0"></div>
    <div class="rk-v a" style="left:40%;top:56px;font-size:11.4px">PREPAID</div>

    <div class="rk-b" style="left:85%;top:0;width:15%;height:72px;padding:3px 4px;font:7.4px Arial,sans-serif;color:#111;border-width:1px 1px 1px 1px">[0] ORIGINAL BILLS(S) HAVE BEEN SIGNED.</div>
    <div class="rk-b" style="left:85%;top:72px;width:15%;height:26px;padding:2px 4px"><span class="rk-l">Date cargo received</span></div>
    <div class="rk-b" style="left:85%;top:98px;width:15%;height:26px;padding:2px 4px"><span class="rk-l">Date laden on board</span><div class="rk-v" style="font-size:10px;line-height:1">${fmtMon(d.issued)}</div></div>
    <div class="rk-b" style="left:85%;top:124px;width:15%;height:38px;padding:2px 4px"><span class="rk-l">Place of Bill(s) issue</span><div class="rk-v" style="font-size:${fit(d.placeOfIssue, 10)}px;line-height:1.1">${esc(d.placeOfIssue)}</div></div>
    <div class="rk-b" style="left:85%;top:162px;width:15%;height:27px;padding:2px 4px"><span class="rk-l">Dated</span></div>

    <div class="rk-b" style="left:0;top:189px;width:38.3%;height:48px"><div class="rk-terms">The printed terms and conditions on this Bill are available at its website at www.rickmerscontainerline.com</div></div>
    <div class="rk-b" style="left:38.3%;top:189px;width:15.1%;height:48px"></div>
    <div class="rk-b" style="left:53.4%;top:189px;width:16%;height:48px"></div>
    <div class="rk-sign" style="left:69.4%;top:192px"><small>SIGNED<br>BY:</small></div>
    <div class="rk-sign" style="left:73.2%;top:193px;font-size:11px">RICKMERS CONTAINER LINE<br>&nbsp;&nbsp;KARACHI - PAKISTAN.<br><small style="margin-left:60px">, as agent for and on behalf of</small></div>
    ${d.qr ? `<img class="a" src="${esc(d.qr)}" alt="" style="left:93%;top:200px;width:42px;height:42px">` : ""}
  </div>
  <div class="rk-car" style="left:69.4%;top:1060px;font-size:11px">RICKMERS CONTAINER LINE<br>(KARACHI), AS CARRIER</div>
</div></div>`;

  const p2 = `
<div class="pg rk"><div class="rk-in">
  ${head(2)}
  <div class="rk-p2"><span>VESSEL VOYAGE: ${esc(vesselTxt)}</span><span>B/L NO.: ${esc(d.orderNumber)}</span></div>
  <div class="rk-tbl" style="top:109px;height:872px">
    ${vlines}${thead}
    ${d.eform ? `<div class="rk-txt" style="left:32.8%;top:38px">E FORM ${esc(d.eform)}${d.eformDate ? `\nDATED: ${fmtDash(d.eformDate)}` : ""}</div>` : ""}
    <div class="a" style="left:0;right:0;top:98px;border-bottom:1px dotted #444"></div>
    <div class="rk-txt" style="top:122px">OCEAN FREIGHT PREPAID
DESTINATION CHARGES COLLECT PER LINE TARIFF AND OTHER CHARGES TO BE COLLECTED FROM

THE PARTY WHO LAWFULLY DEMANDS DELIVERY OF THE CARGO WITHOUT PREJUDICE TO THE

CARRIER'S RIGHTS AGAINST THE MERCHANT (SEE BACK CLAUSE 1) AS SET OUT AT BACK
CLAUSE 13(1)</div>
  </div>
  <div class="rk-sign" style="left:60%;top:985px"><small>SIGNED<br>BY:</small></div>
  <div class="rk-sign" style="left:64.5%;top:988px">RICKMERS CONTAINER LINE<br><small style="margin-left:70px">, as agent for and on behalf of</small></div>
  <div class="rk-car" style="left:68%;top:1060px">RICKMERS CONTAINER LINE<br>(KARACHI), AS CARRIER</div>
</div></div>`;

  return p1 + p2;
};

export const HouseBillOfLading = (
  orderData,
  company,
  getPlaceName,
  opts = {},
) => {
  const tpl = detectTemplate(company);
  const d = collect(orderData, company, getPlaceName, tpl, opts);

  const build = {
    rgsl: classicPage,
    messiah: classicPage,
    cas: casPage,
    rickmers: rickmersPages,
  }[tpl];

  const css = {
    rgsl: CLASSIC_CSS,
    messiah: CLASSIC_CSS,
    cas: CAS_CSS,
    rickmers: RK_CSS,
  }[tpl];
  const pages = d.groups.map((g) => build(d, g)).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>House Bill of Lading - ${esc(d.orderNumber)}</title>
  <style>${BASE_CSS}${css}</style>
</head>
<body>
${pages}
</body>
</html>`;
};
