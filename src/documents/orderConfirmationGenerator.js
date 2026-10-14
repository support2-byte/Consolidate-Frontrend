export const OrderConfirmation = (orderData, company, getPlaceName) => {
  const primary = company?.primary_color || "#e67e22";
  const secondary = company?.secondary_color || "#b8860b";

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const senderName = orderData.sender_name || "";
  const senderContact = orderData.sender_contact || "";
  const senderEmail = orderData.sender_email || "";
  const senderAddress = orderData.sender_address || "";

  const receiver =
    orderData.receivers && orderData.receivers[0] ? orderData.receivers[0] : {};
  const receiverName = receiver.receiverName || "";
  const receiverContact = receiver.receiverContact || "";
  const receiverAddress = receiver.receiverAddress || "";
  const receiverEmail = receiver.receiverEmail || "";
  const receiverCompany = receiver.receiverCompany || "";

  const mode = orderData.mode || "_________";
  const expectedOrderDate = "_________";

  const items = Array.isArray(orderData.items) ? orderData.items : [];

  const totalQty = items.reduce(
    (sum, item) => sum + (Number(item.qty) || 0),
    0,
  );
  const totalWeight = items.reduce(
    (sum, item) => sum + (Number(item.weight) || 0),
    0,
  );

  const itemRows =
    items.length > 0
      ? items
          .map(
            (item) => `
            <tr style="text-align: center; border: 1px solid #aaa;">
                <td class="red-text">${item.qty || ""}</td>
                <td class="red-text" style="word-break: break-word;">${[item.category, item.subcategory].filter(Boolean).join(" - ")}</td>
                <td class="red-text">${item.type || ""}</td>
                <td class="red-text">${item.weight || ""}</td>
                <td class="red-text" style="word-break: break-word;">${item.portOfLoading || ""}</td>
                <td class="red-text" style="word-break: break-word;">${item.portOfDestination || ""}</td>
            </tr>
        `,
          )
          .join("")
      : `
            <tr style="height: 60px; text-align: center; border: 1px solid #aaa;">
                <td class="red-text">_________</td>
                <td class="red-text">_________</td>
                <td class="red-text">_________</td>
                <td class="red-text">_________</td>
                <td class="red-text">_________</td>
                <td class="red-text">_________</td>
            </tr>
        `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                font-size: 12px; 
                color: #333; 
                margin: 0;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container { 
                width: 800px; 
                margin: 0 auto; 
                border: 1px solid #ccc; 
                padding: 10px; 
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 10px;
            }
            .logo-text { 
                color: ${primary}; 
                font-weight: bold; 
                font-size: 18px; 
            }
            .main-title { 
                font-size: 20px; 
                font-weight: bold; 
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 0px; 
            }
            th, td { 
                padding: 4px; 
                vertical-align: top; 
            }
            .red-text { 
                color: #000000; 
                font-weight: 500;
            }
            .golden-text {
                color: ${secondary};
                font-weight: 500;
            }
            .label-cell { 
                font-weight: bold; 
                background-color: #f9f9f9; 
                width: 15%; 
            }
            .section-header { 
                font-weight: bold; 
                text-align: center; 
                background-color: white; 
                padding: 5px; 
                font-size: 16px; 
                margin: 10px 0;
            }
            .disclaimer { 
                font-size: 11px; 
                color: #b8860b; 
                padding: 5px; 
                margin: 10px 0;
            }
            .logo-img {
                max-width: 180px;
                max-height: 60px;
            }
            @media print {
                body { background-color: white; padding: 0; }
                .container { box-shadow: none; border: 1px solid #ccc; }
            }
        </style>
    </head>
    <body>

    <div class="container">
        <table class="header-table" style="border:none;">
            <tr style="border:none;display: flex;align-items: center;gap: 125px;">
                <td style="border:none;">
                    ${
                      company?.logo_url
                        ? `<img src="${company.logo_url}" alt="${company?.company || ""} Logo" class="logo-img"><br>`
                        : `<span class="logo-text">${company?.company || ""}</span><br>`
                    }
                </td>
                <td style="border:none; ">
                    <div class="main-title">ORDER CONFIRMATION</div>
                </td>
            </tr>
        </table>

        <table>
            <tr>
                <td class="label-cell">Dated</td>
                <td class="red-text" colspan="2">${currentDate}</td>
            </tr>
            <tr style="background: #eee; font-weight: bold; border: 1px solid #aaa;">
                <td style="width: 50%;">FROM</td>
                <td colspan="2">TO</td>
            </tr>
            <tr>
                <td class="red-text" style="white-space: pre-line; border: 1px solid #aaa;">
                    ${company?.company || ""}<br>
                    Address: ${(company?.address || "").replace(/, /g, ",<br>")}<br>
                    Tel: ${company?.phone || ""}<br>
                    E-Mail: ${company?.email || ""}
                </td>
                <td class="red-text" colspan="2" style="white-space: pre-line; border: 1px solid #aaa;">
                    ${receiverName}<br>
                    ${receiverCompany ? `Company: ${receiverCompany}<br>` : ""}
                    Address: ${receiverAddress.replace(/, /g, ",<br>")}<br>
                    Contact Person: ${receiverName}<br>
                    Passport No: _________<br>
                    Emirates ID #: _________<br>
                    Trace License: _________<br>
                    Tel: ${receiverContact || "_________"}<br>
                    E-Mail: ${receiverEmail}
                </td>
            </tr>
        </table>

        <div class="disclaimer golden-text">
            This paper serves as an legal responsibility of sender & receiver for the contents of the cargo being shipped through the company ${company?.company || ""}. The Sender and Receiver will be only responsible for any loss / damages which results in case of any prohibited items attempted to be shipped through this order.
        </div>

        <div class="section-header">ACKNOWLEDGMENT AND ACCEPTANCE OF ORDER</div>

        <table>
            <tr style="text-align: center; font-weight: bold; background: #eee; border: 1px solid #aaa;">
                <td style="width: 8%;">QTY</td>
                <td style="width: 20%;">CATEGORY / SUBCATEGORY</td>
                <td style="width: 10%;">TYPE</td>
                <td style="width: 10%;">WEIGHT (KG)</td>
                <td style="width: 26%;">Port of Loading</td>
                <td style="width: 26%;">Port of Destination</td>
            </tr>
            ${itemRows}
            <tr>
                <td colspan="4" rowspan="2"><b>Mode:</b> <span class="red-text">${mode}</span></td>
                <td style="text-align: right;"><b>TOTAL QTY:</b></td>
                <td class="red-text" style="text-align: center;">${totalQty}</td>
            </tr>
            <tr>
                <td style="text-align: right;"><b>TOTAL WEIGHT (KG):</b></td>
                <td class="red-text" style="text-align: center;">${totalWeight}</td>
            </tr>
            <tr>
                <td colspan="4">
                    <b>EXPECTED SHIPMENT DATE:</b> <span class="red-text">${expectedOrderDate}</span><br>
                </td>
                <td colspan="2"></td>
            </tr>
        </table>

        <table>
            <tr class="red-text">
                <td style="border: 1px solid #aaa;">
                    Either of the Party from<br>sender or receiver paying the Invoice<br>
                    <span style="color: black;">Attn: ${senderName || "_________"}</span><br>
                    Tel: ${senderContact || "_________"}
                </td>
                <td style="border: 1px solid #aaa;">
                    Individual or company suppose to be the<br>recipient of the consignment<br>
                    <span style="color: black;">Attn: ${receiverName || "_________"}</span><br>
                    Tel: ${receiverContact || "_________"}
                </td>
            </tr>
        </table>

        <div style="text-align: center; font-weight: bold; padding: 5px; margin: 10px 0;">
            We confirm acceptance of said order, with terms as stated above.
        </div>

        <table style="margin-top: 20px;">
  <tr>
    <td style="width: 50%; vertical-align: bottom;">
      <div style="border-bottom: 1px solid #000; height: 30px;"></div>
      <b>Signature</b>
    </td>
    <td style="width: 50%; text-align: center; vertical-align: bottom;">
      <span>Time & Date Stamp: ${currentDate} ${new Date().toLocaleTimeString()}</span>
    </td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding-top: 8px;">
      <div style="border-bottom: 1px solid #000; height: 24px;"></div>
      <b>Name</b>
    </td>
    <td></td>
  </tr>
</table>
    </div>

    </body>
    </html>
    `;
};
