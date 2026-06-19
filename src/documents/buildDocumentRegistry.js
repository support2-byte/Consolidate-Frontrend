export function buildDocumentRegistry(orderData, templates) {
  return {
    "3rd Party Shipper Undertaking for ANF.pdf": {
      title: "3rd Party Shipper Undertaking for ANF",
      content: templates.PartyShipperUndertakingForANF(orderData),
      fileExt: ".html",
      mimeType: "text/html",
    },
    // ...repeat the same pattern for the remaining 17 entries, unchanged
    // apart from `templates.<FunctionName>(orderData)`.
  };
}
